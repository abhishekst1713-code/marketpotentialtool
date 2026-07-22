// src/lib/db.js
// All database operations now go through the Express backend.
// No direct Supabase access from the browser for the submissions table.

const API_BASE = `${import.meta.env.VITE_API_URL || ""}/api/submissions`;

// ── Phase 1: Save onboarding form immediately after submit ────────
export async function saveOnboarding(userData) {
  try {
    const resp = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("❌ saveOnboarding error:", err.error || resp.statusText);
      return null;
    }

    const data = await resp.json();
    console.log("✅ Onboarding saved — ID:", data.id);
    return data.id;
  } catch (err) {
    console.error("❌ saveOnboarding exception:", err.message);
    return null;
  }
}

// ── Phase 2: Save AI analysis result ─────────────────────────────
export async function saveResult(submissionId, answers, result) {
  if (!submissionId) {
    console.warn("⚠️ saveResult: no submissionId, skipping.");
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/${submissionId}/result`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers, result }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("❌ saveResult error:", err.error || resp.statusText);
    } else {
      console.log("✅ Result saved — ID:", submissionId);
    }
  } catch (err) {
    console.error("❌ saveResult exception:", err.message);
  }
}

// ── Phase 3: Save screenshot as base64 data URL directly in DB ───
export async function saveScreenshotDataUrl(submissionId, dataUrl) {
  if (!submissionId || !dataUrl) {
    console.warn("⚠️ saveScreenshotDataUrl: missing id or dataUrl");
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/${submissionId}/screenshot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      console.error("❌ saveScreenshotDataUrl error:", err.error || resp.statusText);
    } else {
      console.log("✅ Screenshot saved for:", submissionId, "(length:", dataUrl.length, "chars)");
    }
  } catch (err) {
    console.error("❌ saveScreenshotDataUrl exception:", err.message);
  }
}

// ── Legacy export (keeps old references working) ──────────────────
export async function saveSubmission({ userData, answers, result }) {
  const id = await saveOnboarding(userData);
  if (id) await saveResult(id, answers, result);
}

// ── Report unlock — captures lead email, returns full analysis ────
export async function unlockReport(submissionId, email, name) {
  const resp = await fetch("/api/reports/unlock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submissionId, email, name }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Unlock failed (${resp.status})`);
  }

  return resp.json(); // { analysis }
}