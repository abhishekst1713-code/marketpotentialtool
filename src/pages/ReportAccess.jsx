import { useEffect, useState } from "react";
import { fetchSubmission } from "../lib/db";

// ── Standalone, no-login page for a single test's saved artifacts. ──
// Reached at /r/<submissionId> — pulls the row via the existing
// GET /api/submissions/:id endpoint and shows the archived dashboard
// screenshot + a link to the archived report PDF (both already uploaded
// to Supabase Storage by AssessmentAndDashboard.jsx as soon as a test
// completes). Independent of the main app's session/auth state, so the
// link keeps working even after the tool has moved on to a new test. ──
export default function ReportAccess({ submissionId }) {
  const [status, setStatus] = useState("loading"); // "loading" | "not_found" | "ready"
  const [row, setRow] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSubmission(submissionId).then((data) => {
      if (cancelled) return;
      if (!data) {
        setStatus("not_found");
        return;
      }
      setRow(data);
      setStatus("ready");
    });
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const wrap = {
    minHeight: "100vh",
    background: "#EEF2F7",
    fontFamily: "'IBM Plex Sans', sans-serif",
  };

  const topbar = (
    <div style={{ background: "#00338D", height: 48, display: "flex", alignItems: "center", padding: "0 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
      <div style={{ width: 32, height: 32, background: "#0091DA", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "monospace", fontWeight: 700, fontSize: 12, color: "#fff", marginRight: 12 }}>IP</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", color: "#fff", textTransform: "uppercase" }}>Infopace Management Pvt Ltd</div>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>Market Intelligence Platform</div>
      </div>
    </div>
  );

  if (status === "loading") {
    return (
      <div style={wrap}>
        {topbar}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 48px)", color: "#627289", fontSize: 14 }}>
          Loading your saved report…
        </div>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div style={wrap}>
        {topbar}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 48px)", color: "#627289", gap: 8, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#08152A" }}>This report link isn't valid</div>
          <div style={{ fontSize: 13, maxWidth: 420 }}>
            We couldn't find a saved test for this link. Double-check the URL, or take a new assessment to generate a fresh one.
          </div>
        </div>
      </div>
    );
  }

  const dateStr = row.created_at
    ? new Date(row.created_at).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const hasScreenshot = row.screenshot_url && row.screenshot_url.length > 0;
  const hasReportPdf = row.report_pdf_url && row.report_pdf_url.length > 0;

  const card = {
    background: "#fff",
    border: "1px solid #D6DFED",
    borderRadius: 8,
    boxShadow: "0 1px 3px rgba(8,21,42,0.06)",
  };

  return (
    <div style={wrap}>
      {topbar}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "32px 20px 60px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "#0091DA", textTransform: "uppercase", marginBottom: 6 }}>
            Saved Test Report
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#08152A", margin: 0 }}>
            {row.organization || row.product_name || "Market Potential Assessment"}
          </h1>
          <div style={{ fontSize: 13, color: "#627289", marginTop: 4 }}>
            {row.name ? `${row.name} · ` : ""}
            {dateStr}
            {row.overall_score != null ? ` · Score ${row.overall_score}/100 (${row.grade || "—"})` : ""}
          </div>
        </div>

        <div style={{ ...card, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#627289", textTransform: "uppercase", marginBottom: 12 }}>
            Dashboard Screenshot
          </div>
          {hasScreenshot ? (
            <img
              src={row.screenshot_url}
              alt="Dashboard screenshot"
              style={{ width: "100%", borderRadius: 6, border: "1px solid #D6DFED", display: "block" }}
            />
          ) : (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#9BAABB", fontSize: 13 }}>
              No screenshot was saved for this test yet.
            </div>
          )}
        </div>

        <div style={{ ...card, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "#627289", textTransform: "uppercase", marginBottom: 12 }}>
            Full Report PDF
          </div>
          {hasReportPdf ? (
            <a
              href={row.report_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-block",
                padding: "12px 24px",
                background: "#00338D",
                color: "#fff",
                borderRadius: 6,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              ⬇ Download Report PDF
            </a>
          ) : (
            <div style={{ fontSize: 13, color: "#9BAABB" }}>
              The report PDF is still being generated for this test — check back in a moment and refresh this page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
