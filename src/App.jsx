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


import { useState, useRef } from "react";
import OnboardingForm from "./pages/OnboardingForm";
import AssessmentAndDashboard from "./pages/AssessmentAndDashboard";
import { saveOnboarding, saveResult, saveScreenshotDataUrl } from "./lib/db";

// ── Flow:
//   1. User fills OnboardingForm → onComplete(userData) fires
//      → saveOnboarding() inserts row into Supabase, returns submissionId
//   2. User completes dashboard questions → AI generates result
//      → AssessmentAndDashboard calls onResult(answers, result)
//      → saveResult() updates the same row with scores + analysis
// ──────────────────────────────────────────────────────────────────

export default function App() {
  const [userData, setUserData] = useState(null);
  const [submissionId, setSubmissionId] = useState(null); // holds Supabase row UUID

  // ── Called when onboarding form is submitted ──────────────────
  async function handleOnboardingComplete(formData) {
    setUserData(formData);

    // Save to Supabase immediately — non-blocking
    const id = await saveOnboarding(formData);
    setSubmissionId(id); // store for phase 2 — triggers re-render so child gets the real id
  }

  // ── Called when AI analysis completes inside the dashboard ────
  async function handleResult(answers, result) {
    await saveResult(submissionId, answers, result).catch(e =>
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

  function handleRestart() {
    setUserData(null);
    setSubmissionId(null);
  }

  if (userData) {
    return (
      <AssessmentAndDashboard
        userData={userData}
        submissionId={submissionId}
        onResult={handleResult}
        onScreenshot={handleScreenshot}
        onRestart={handleRestart}
      />
    );
  }

  return <OnboardingForm onComplete={handleOnboardingComplete} user={null} />;
}