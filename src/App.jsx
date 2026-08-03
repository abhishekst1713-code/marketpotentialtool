// import { useState, useRef, useEffect } from "react";
// import OnboardingForm from "./pages/OnboardingForm";
// import AssessmentAndDashboard from "./pages/AssessmentAndDashboard";
// import { saveOnboarding, saveResult } from "./lib/db";

// const SESSION_KEY = "infopace_session";

// export default function App() {
//   // ── Restore session from localStorage on first load ──────────────
//   const [userData, setUserData] = useState(() => {
//     try {
//       const saved = localStorage.getItem(SESSION_KEY);
//       return saved ? JSON.parse(saved) : null;
//     } catch {
//       return null;
//     }
//   });

//   const submissionIdRef = useRef(null);

//   // ── Persist submissionId across refreshes too ────────────────────
//   useEffect(() => {
//     const savedId = localStorage.getItem(SESSION_KEY + "_sid");
//     if (savedId) submissionIdRef.current = savedId;
//   }, []);

//   // ── Called when onboarding form is submitted ──────────────────────
//   async function handleOnboardingComplete(formData) {
//     // Save to localStorage immediately so refresh restores the session
//     try { localStorage.setItem(SESSION_KEY, JSON.stringify(formData)); } catch {}
//     setUserData(formData);

//     // Save to Supabase — non-blocking
//     const id = await saveOnboarding(formData);
//     submissionIdRef.current = id;
//     try { if (id) localStorage.setItem(SESSION_KEY + "_sid", id); } catch {}
//   }

//   // ── Called when AI analysis completes ────────────────────────────
//   async function handleResult(answers, result) {
//     saveResult(submissionIdRef.current, answers, result).catch(e =>
//       console.warn("DB result save failed:", e.message)
//     );
//   }

//   // ── Reset — clears session so user starts fresh ───────────────────
//   function handleRestart() {
//     try {
//       localStorage.removeItem(SESSION_KEY);
//       localStorage.removeItem(SESSION_KEY + "_sid");
//     } catch {}
//     setUserData(null);
//     submissionIdRef.current = null;
//   }

//   if (userData) {
//     return (
//       <AssessmentAndDashboard
//         userData={userData}
//         onResult={handleResult}
//         onRestart={handleRestart}
//       />
//     );
//   }

//   return <OnboardingForm onComplete={handleOnboardingComplete} user={null} />;
// }


import { useState, useRef, useEffect } from "react";
import OnboardingForm from "./pages/OnboardingForm";
import AssessmentAndDashboard from "./pages/AssessmentAndDashboard";
import { saveOnboarding, saveResult, saveScreenshotDataUrl, fetchSubmission } from "./lib/db";

// ── Flow:
//   1. User fills OnboardingForm → onComplete(userData) fires
//      → saveOnboarding() inserts row into Supabase, returns submissionId
//   2. User completes dashboard questions → AI generates result
//      → AssessmentAndDashboard calls onResult(answers, result)
//      → saveResult() updates the same row with scores + analysis
//   3. User pays via Razorpay modal → handler redirects to Payment Hub
//      → Payment Hub redirects to /payment-status (server verifies & marks paid)
//      → Server redirects to /?session=UUID&payment=success
//      → useEffect below detects the param, sets paid:true, cleans the URL
// ──────────────────────────────────────────────────────────────────

export default function App() {
  const [userData, setUserData] = useState(null);
  const [submissionId, setSubmissionId] = useState(null); // holds Supabase row UUID
  const [paid, setPaid] = useState(false); // true once payment is verified

  // ── On mount: detect ?payment= and ?session= in the URL ──────────
  // This runs once when the app loads. If the Payment Hub redirected here
  // with ?payment=success, we hydrate the paid state and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("payment");   // "success" | "failed"
    const sessionId = params.get("session");       // submission UUID

    if (!paymentResult) return; // no payment redirect — normal load

    // Strip ?payment=... and ?session=... from the address bar immediately.
    // This keeps the URL clean and prevents re-triggering on refresh.
    const cleanUrl = window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    if (paymentResult === "success" && sessionId) {
      // Re-hydrate session from DB so state is consistent even after a hard
      // redirect from the Payment Hub (React state was cleared by navigation).
      fetchSubmission(sessionId).then((row) => {
        if (row) {
          // Restore userData from the DB row fields
          setUserData({
            name: row.name,
            email: row.email,
            phone: row.phone,
            phoneFull: row.phone_full,
            countryCode: row.country_code,
            organization: row.organization,
            role: row.role,
            website: row.website,
            linkedin: row.linkedin,
            teamSize: row.team_size,
            productName: row.product_name,
            businessType: row.business_type,
            sector: row.sector,
            geography: row.geography,
            problem: row.problem,
            stage: row.stage,
          });
          setSubmissionId(sessionId);
          // Trust the DB flag (server-verified) — also catch race conditions
          // where the DB update hasn't propagated yet
          setPaid(row.paid === true || paymentResult === "success");
        } else {
          // DB fetch failed but server already verified — trust the redirect
          setPaid(true);
          setSubmissionId(sessionId);
        }
      });
    } else if (paymentResult === "failed") {
      // Payment failed — the user stays on the current page.
      // Optionally surface this to the dashboard via a state flag.
      console.warn("Payment was not completed or failed verification.");
    }
  }, []); // runs once on mount

  // ── Re-hydrate paid flag when submissionId changes (handles refresh) ──
  // Whenever we know the submission ID (from normal onboarding OR from URL
  // param above), fetch the row and sync the paid flag.
  useEffect(() => {
    if (!submissionId) return;
    fetchSubmission(submissionId).then((row) => {
      if (row?.paid) setPaid(true);
    });
  }, [submissionId]);

  // ── Called when onboarding form is submitted ──────────────────────
  async function handleOnboardingComplete(formData) {
    setUserData(formData);

    // Save to Supabase immediately — non-blocking
    const id = await saveOnboarding(formData);
    setSubmissionId(id); // store for phase 2 — triggers re-render so child gets the real id
  }

  // ── Called when AI analysis completes inside the dashboard ────────
  async function handleResult(answers, result) {
    await saveResult(submissionId, answers, result).catch((e) =>
      console.warn("DB result save failed:", e.message)
    );
  }

  // ── Called when a screenshot data URL is captured from the dashboard ──
  async function handleScreenshot(dataUrl) {
    const id = submissionId;
    if (!id || !dataUrl) {
      console.warn("⚠️ handleScreenshot: missing id or dataUrl, skipping.");
      return;
    }
    try {
      await saveScreenshotDataUrl(id, dataUrl);
    } catch (e) {
      console.warn("Screenshot save failed:", e.message);
    }
  }

  // ── Called when the payment completes on the client side ─────────
  // This is a quick optimistic update; the authoritative flag comes from
  // the server redirect back to /?payment=success&session=...
  function handlePaymentSuccess() {
    setPaid(true);
  }

  function handleRestart() {
    setUserData(null);
    setSubmissionId(null);
    setPaid(false);
  }

  if (userData) {
    return (
      <AssessmentAndDashboard
        userData={userData}
        submissionId={submissionId}
        paid={paid}
        onResult={handleResult}
        onScreenshot={handleScreenshot}
        onPaymentSuccess={handlePaymentSuccess}
        onRestart={handleRestart}
      />
    );
  }

  return <OnboardingForm onComplete={handleOnboardingComplete} user={null} />;
}