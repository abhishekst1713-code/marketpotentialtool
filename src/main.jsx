import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ReportAccess from "./pages/ReportAccess.jsx";
import "./index.css";

// ── /r/<submissionId> is a standalone, per-test report-access link — it
// bypasses the normal onboarding/dashboard flow entirely so it keeps
// working regardless of the app's own session state. ──
const reportAccessMatch = window.location.pathname.match(/^\/r\/([0-9a-fA-F-]{36})\/?$/);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {reportAccessMatch ? (
      <ReportAccess submissionId={reportAccessMatch[1]} />
    ) : (
      <App />
    )}
  </React.StrictMode>
);
