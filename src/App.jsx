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
import AuthPage from "./pages/AuthPage";
import { saveOnboarding, saveResult, saveScreenshotDataUrl, fetchSubmission } from "./lib/db";
import { getUser, onAuthChange, signOut } from "./lib/auth";

// ── Flow:
//   0. App gates on Supabase auth — signed out users see AuthPage, and
//      a refresh re-checks the session instead of falling through to
//      the assessment form.
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
  // undefined = still checking Supabase for an existing session, null = signed out
  const [authUser, setAuthUser] = useState(undefined);
  const [userData, setUserData] = useState(null);
  const [submissionId, setSubmissionId] = useState(null); // holds Supabase row UUID
  const [paid, setPaid] = useState(false); // true once payment is verified

  // ── On mount: check for an existing Supabase session, and keep it in sync ──
  useEffect(() => {
    getUser().then(setAuthUser).catch(() => setAuthUser(null));
    const { data: listener } = onAuthChange(setAuthUser);
    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ── On mount: detect ?payment= and ?session= in the URL or restore from localStorage ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentResult = params.get("payment");   // "success" | "failed"
    const sessionIdFromUrl = params.get("session"); // submission UUID

    // Clean URL if we have payment params
    if (paymentResult) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }

    const sessionId = sessionIdFromUrl || localStorage.getItem("infopace_session_sid");
    if (!sessionId) return;

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
        try {
          localStorage.setItem("infopace_session_sid", sessionId);
        } catch (err) {}
        // Trust the DB flag (server-verified) or URL redirect
        setPaid(row.paid === true || (sessionIdFromUrl === sessionId && paymentResult === "success"));
      } else {
        if (paymentResult === "success") {
          setPaid(true);
          setSubmissionId(sessionId);
        }
      }
    });
  }, []); // runs once on mount

  // ── Re-hydrate paid flag when submissionId changes (handles refresh) ──
  // Whenever we know the submission ID (from normal onboarding OR from URL
  // param above), fetch the row and sync the paid flag.
  useEffect(() => {
    if (!submissionId) return;
    fetchSubmission(submissionId).then((row) => {
      if (row) {
        setPaid(row.paid === true);
      }
    });
  }, [submissionId]);

  // ── Called when onboarding form is submitted ──────────────────────
  async function handleOnboardingComplete(formData) {
    setUserData(formData);

    // Save to Supabase immediately — non-blocking
    const id = await saveOnboarding(formData);
    setSubmissionId(id); // store for phase 2 — triggers re-render so child gets the real id
    if (id) {
      try {
        localStorage.setItem("infopace_session_sid", id);
      } catch (err) {}
    }
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

  if (authUser === undefined) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#627289", fontFamily: "sans-serif", fontSize: 14 }}>
        Loading…
      </div>
    );
  }

  if (!authUser) {
    return <AuthPage onAuth={setAuthUser} />;
  }

  const signOutButton = (
    <button
      onClick={() => signOut()}
      style={{
        position: "fixed", top: 12, right: 12, zIndex: 10000,
        padding: "6px 12px", borderRadius: 8, border: "1px solid #D6DFED",
        background: "#fff", color: "#627289", fontSize: 12, fontWeight: 600,
        cursor: "pointer",
      }}
    >
      Sign out
    </button>
  );

  if (userData) {
    return (
      <>
        <AssessmentAndDashboard
          userData={userData}
          submissionId={submissionId}
          paid={paid}
          onResult={handleResult}
          onScreenshot={handleScreenshot}
          onPaymentSuccess={handlePaymentSuccess}
          onRestart={handleRestart}
        />
        {signOutButton}
      </>
    );
  }

  return (
    <>
      <OnboardingForm onComplete={handleOnboardingComplete} user={authUser} />
      {signOutButton}
    </>
  );
}