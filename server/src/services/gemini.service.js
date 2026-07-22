// server/src/services/gemini.service.js
// Calls the Gemini API and parses the response.
// The full prompt template lives here — the client only sends userData + answers.

const { env } = require("../config/env");

// ── Build the analysis prompt server-side ──────────────────────────
function buildAnalysisPrompt(userData, answers) {
  const answerLines = Object.entries(answers || {})
    .filter(([, v]) => v && v !== "")
    .map(([, v]) => `  - ${Array.isArray(v) ? v.join(", ") : v}`)
    .join("\n");

  return `You are a senior market intelligence analyst with deep knowledge of Indian and global markets.

Analyse this product and produce a data-driven market assessment using your real knowledge of this sector, geography, and companies.

PRODUCT: ${userData.organization || "Unnamed"}
SECTOR: ${userData.sector || "Not specified"}
BUSINESS TYPE: ${userData.role || "Not specified"}
TARGET GEOGRAPHY: ${userData.geography || "Not specified"}
BUSINESS STAGE: ${userData.stage || "Not specified"}
PROBLEM BEING SOLVED: ${userData.problem || "Not described"}

WHAT THE FOUNDER TOLD US ABOUT THEIR MARKET:
${answerLines || "(answers not provided)"}

CRITICAL INSTRUCTIONS:
1. Use your REAL knowledge of the ${userData.sector} market in ${userData.geography} — cite real TAM figures, real CAGR rates
2. Name REAL competitors that actually exist in ${userData.sector} in ${userData.geography} — not placeholders
3. Score those competitors based on your actual knowledge of their market position
4. Revenue by region must reflect real market concentration for ${userData.sector} in ${userData.geography}
5. The overall score must genuinely reflect the founder's answers above
6. TAM/SAM/SOM must be realistic for this specific sector and geography

Return ONLY raw JSON, no markdown fences, no explanation before or after:
{
"overallScore": <0-100>,
"grade": "Excellent" or "Strong" or "Moderate" or "Needs Work" or "Critical",
"verdict": "<One specific sentence naming the product, its key opportunity, and its biggest risk>",
"realTimeInsight": "<One real market fact with actual numbers>",
"dimensions": {"marketSize":<0-100>,"audienceQuality":<0-100>,"competitionEdge":<0-100>,"revenuePotential":<0-100>,"riskProfile":<0-100>,"sectorFit":<0-100>},
"tamCrore": <realistic TAM in ₹Crore>,
"samCrore": <serviceable portion>,
"somCrore": <3-year realistic target>,
"growthRate": <real CAGR %>,
"competitorProfiles": [
  {"name":"<REAL company 1>","stage":"<funding/size>","strength":"<real strength>","weakness":"<real gap>","marketSharePct":<realistic %>},
  {"name":"<REAL company 2>","stage":"<funding/size>","strength":"<real strength>","weakness":"<real gap>","marketSharePct":<realistic %>},
  {"name":"<REAL company 3>","stage":"<funding/size>","strength":"<real strength>","weakness":"<real gap>","marketSharePct":<realistic %>}
],
"marketShare": [
  {"name":"<product>","pct":<1-10>,"val":"₹<somCrore>Cr"},
  {"name":"<real comp 1>","pct":<their share %>,"val":"₹<amount>Cr"},
  {"name":"<real comp 2>","pct":<their share %>,"val":"₹<amount>Cr"},
  {"name":"<real comp 3>","pct":<their share %>,"val":"₹<amount>Cr"},
  {"name":"Others","pct":<remainder>,"val":"—"}
],
"revenueByRegion": {
  "labels": [<5-6 real cities relevant to the sector>],
  "currentMarket": [<real ₹Cr market size per city>],
  "projected2027": [<apply growthRate CAGR>],
  "ourTarget": [<realistic 2-8% of each city market>]
},
"competitorRadar": [
  {"name":"<product>","scores":{"pricingPower":<0-100>,"distribution":<0-100>,"brandValue":<0-100>,"innovation":<0-100>,"marketReach":<0-100>,"customerSat":<0-100>},"avg":"<average>"},
  {"name":"<comp 1>","scores":{"pricingPower":<n>,"distribution":<n>,"brandValue":<n>,"innovation":<n>,"marketReach":<n>,"customerSat":<n>},"avg":"<average>"},
  {"name":"<comp 2>","scores":{"pricingPower":<n>,"distribution":<n>,"brandValue":<n>,"innovation":<n>,"marketReach":<n>,"customerSat":<n>},"avg":"<average>"},
  {"name":"<comp 3>","scores":{"pricingPower":<n>,"distribution":<n>,"brandValue":<n>,"innovation":<n>,"marketReach":<n>,"customerSat":<n>},"avg":"<average>"}
],
"trendData": {
  "months": ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"],
  "series": [
    {"label":"<product>","dash":[],"data":[<12 monthly values 0-1% to 3-8%>]},
    {"label":"<comp 1>","dash":[],"data":[<12 monthly values ~20-35%>]},
    {"label":"<comp 2>","dash":[],"data":[<12 monthly values ~15-25%>]},
    {"label":"<comp 3>","dash":[],"data":[<12 monthly values ~10-20%>]}
  ]
},
"geoRegions": {
  "Asia Pacific": {"rev":"<global sector size>","pct":"<% of global TAM>","ids":[4,50,156,356,360,392,410,458,702,704,764]},
  "North America": {"rev":"<global sector size>","pct":"<% of global TAM>","ids":[124,484,840]},
  "South America": {"rev":"<global sector size>","pct":"<% of global TAM>","ids":[32,68,76,152,170]},
  "Europe": {"rev":"<global sector size>","pct":"<% of global TAM>","ids":[276,250,826,380,724,528,208,752,756,616]},
  "Africa": {"rev":"<global sector size>","pct":"<% of global TAM>","ids":[566,710,404,818,12]}
},
"keyInsights": ["<insight 1 with numbers>","<insight 2>","<insight 3>","<insight 4>","<90-day action>"],
"topRisks": ["<risk 1>","<risk 2>","<risk 3>"],
"quickWins": ["<win 1>","<win 2>","<win 3>"],
"popups": {
  "mktshare": "<2 sentences: TAM/SAM/SOM + competitor context>",
  "revregion": "<2 sentences: priority cities and why>",
  "radar": "<2 sentences: where product leads and trails>",
  "trend": "<2 sentences: trajectory and inflection point>",
  "geomap": "<2 sentences: geographic focus rationale>"
}
}`;
}

// ── Parse JSON from Gemini text output ─────────────────────────────
// Handles markdown fences, leading/trailing text, trailing commas,
// and truncated JSON responses from the model.
function parseJsonFromText(text) {
  let raw = text.trim();

  // Strip markdown code fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    raw = fenceMatch[1].trim();
  }

  // Extract the JSON object
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.error("  ❌ No JSON object found in Gemini response. First 500 chars:", raw.slice(0, 500));
    const err = new Error("AI response did not contain valid JSON");
    err.statusCode = 502;
    throw err;
  }

  raw = raw.slice(start, end + 1);

  // Clean common Gemini quirks before parsing
  // 1. Remove trailing commas before } or ]
  raw = raw.replace(/,\s*([}\]])/g, "$1");
  // 2. Remove control characters (except newline/tab)
  raw = raw.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");

  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("  ⚠️  JSON.parse failed, attempting repair:", e.message);
    // Attempt to repair truncated JSON
    const repaired = repairTruncatedJson(raw);
    if (repaired) {
      try {
        const result = JSON.parse(repaired);
        console.log("  ✅  JSON repair successful");
        return result;
      } catch (e2) {
        console.error("  ❌ JSON repair also failed:", e2.message);
      }
    }
    console.error("  ❌ First 1000 chars of extracted JSON:", raw.slice(0, 1000));
    const err = new Error("Failed to parse AI response as JSON");
    err.statusCode = 502;
    throw err;
  }
}

// ── Repair truncated JSON ──────────────────────────────────────────
// When the model's output gets cut off mid-response, we try to close
// any open strings, arrays, and objects to salvage the partial data.
function repairTruncatedJson(raw) {
  try {
    let s = raw;

    // 1. Remove any trailing partial key-value (e.g., `"key": "unfinis`)
    //    by stripping back to the last complete value
    s = s.replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/,       "");  // truncated string value
    s = s.replace(/,\s*"[^"]*"\s*:\s*\[?[^\]]*$/,     "");  // truncated array value
    s = s.replace(/,\s*"[^"]*"\s*:\s*$/,               "");  // key with no value
    s = s.replace(/,\s*"[^"]*$/,                       "");  // truncated key
    s = s.replace(/,\s*\{[^}]*$/,                      "");  // truncated object in array

    // 2. Remove trailing commas
    s = s.replace(/,\s*$/, "");

    // 3. Close any unclosed strings — find unmatched quotes
    //    Count quotes (ignoring escaped ones)
    const unescapedQuotes = s.match(/(?<!\\)"/g);
    if (unescapedQuotes && unescapedQuotes.length % 2 !== 0) {
      s += '"';
    }

    // 4. Remove trailing commas (again, after string fix)
    s = s.replace(/,\s*([}\]])/g, "$1");
    s = s.replace(/,\s*$/, "");

    // 5. Close any unclosed brackets/braces
    const opens = { "{": 0, "[": 0 };
    let inString = false;
    let prevChar = "";
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c === '"' && prevChar !== "\\") {
        inString = !inString;
      }
      if (!inString) {
        if (c === "{") opens["{"]++;
        if (c === "}") opens["{"]--;
        if (c === "[") opens["["]++;
        if (c === "]") opens["["]--;
      }
      prevChar = c;
    }

    // Close unclosed arrays first, then objects
    for (let i = 0; i < opens["["]; i++) s += "]";
    for (let i = 0; i < opens["{"]; i++) s += "}";

    return s;
  } catch (_) {
    return null;
  }
}

// ── Public: Generate analysis ──────────────────────────────────────
async function generateAnalysis(userData, answers) {
  const prompt = buildAnalysisPrompt(userData, answers);
  const model = env.GEMINI_MODEL_SMART;

  console.log(`  →  analysis (${model})`);

  // Try up to 2 times — retry once if the response is truncated
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { text, finishReason } = await callGeminiWithMeta(model, prompt);
    console.log(`  ✅  analysis complete (attempt ${attempt}, finishReason: ${finishReason})`);

    try {
      return parseJsonFromText(text);
    } catch (e) {
      // If truncated (MAX_TOKENS) and we haven't retried yet, try again
      if (attempt < 2 && (finishReason === "MAX_TOKENS" || finishReason === "OTHER")) {
        console.warn(`  ⚠️  Response truncated (${finishReason}), retrying...`);
        continue;
      }
      throw e;
    }
  }
}

// ── callGemini wrapper that also returns finishReason ──────────────
async function callGeminiWithMeta(model, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: promptText }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const status = response.status;
    console.error(`Gemini API returned ${status}`);
    try {
      const errBody = await response.json();
      console.error("Gemini error detail:", errBody.error?.message || JSON.stringify(errBody).slice(0, 200));
    } catch (_) {}
    const err = new Error(`AI service returned an error (status ${status})`);
    err.statusCode = 502;
    throw err;
  }

  const data = await response.json();

  const text = (data?.candidates?.[0]?.content?.parts || [])
    .map((p) => p.text || "")
    .join("");

  const finishReason = data?.candidates?.[0]?.finishReason || "UNKNOWN";

  if (!text) {
    const err = new Error("Empty response from AI service");
    err.statusCode = 502;
    throw err;
  }

  return { text, finishReason };
}

module.exports = { generateAnalysis };

