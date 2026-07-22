/**
 * generateAnalysis — calls the Express backend which builds the prompt
 * server-side and proxies to Gemini. Returns a parsed analysis object.
 *
 * The full prompt template now lives in server/src/services/gemini.service.js.
 * The client only sends userData + answers; it never touches the raw prompt.
 */
export async function generateAnalysis(userData, answers = {}) {
  const resp = await fetch("/api/analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData, answers }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `API error ${resp.status}`);
  }

  const data = await resp.json();

  // The backend returns { analysis: { ... } } with already-parsed clean JSON
  return data.analysis;
}
