const fs = require('fs');

const originalContent = fs.readFileSync('src/lib/exportPdf.js', 'utf8');
const lines = originalContent.split('\n');

// Extract the first 151 lines (up to the exportPdf function definition)
const header = lines.slice(0, 151).join('\n');

const newBody = `
// ── Get detailed description and recommendation for each Market Potential dimension ──
function getDimDetail(key, score) {
  const details = {
    marketSize: {
      name: "Market Size",
      desc: score >= 70 
        ? "Large addressable market with high growth rate, suggesting substantial headroom for customer acquisition and expansion." 
        : score >= 50 
        ? "Moderate market size. The addressable opportunity is sufficient for early traction but may require adjacencies to scale." 
        : "Niche or restricted market size. High risk of growth ceiling unless TAM definition is expanded or value proposition is broadened.",
      reco: score >= 70
        ? "Leverage scale to capture dominant market share early before competitors capture key regional clusters."
        : score >= 50
        ? "Validate primary customer segments and test expansion opportunities in adjacent verticals."
        : "Focus on capturing high-value niches first and model a path to broaden the target segment."
    },
    audienceQuality: {
      name: "Audience Quality",
      desc: score >= 70 
        ? "Strong alignment with high-intent buyers who possess budget authority and a clear pain point, leading to faster sales cycles." 
        : score >= 50 
        ? "Moderate audience alignment. Buyers recognize the problem but may face internal friction, budget constraints, or long adoption cycles." 
        : "Low audience alignment or high purchase friction. Decision-makers are fragmented or do not perceive the problem as urgent.",
      reco: score >= 70
        ? "Implement standard customer success playbooks to maximize retention and drive expansion/upsell."
        : score >= 50
        ? "Refine messaging to focus on ROI and address specific purchase friction points."
        : "Run customer discovery interviews to identify a segment with more urgent, budget-backed pain points."
    },
    competitionEdge: {
      name: "Competition Edge",
      desc: score >= 70 
        ? "Highly differentiated product or model with clear, defensible moats against both established giants and scrappy startups." 
        : score >= 50 
        ? "Moderate differentiation. Features are competitive but vulnerable to feature replication by incumbents." 
        : "Weak competitive differentiation. High risk of price competition. Moats are weak relative to existing competitors.",
      reco: score >= 70
        ? "Build brand equity and distribution moats to protect your technological lead."
        : score >= 50
        ? "Identify one specific dimension where you can be 10x better than the leading competitor."
        : "Pivot or specialize in a niche where incumbents cannot easily serve due to their structure."
    },
    revenuePotential: {
      name: "Revenue Potential",
      desc: score >= 70 
        ? "Clear, high-margin monetization model with opportunities for recurring revenue, high contract value, or strong customer LTV." 
        : score >= 50 
        ? "Viable revenue streams, but margins may be pressured by customer acquisition costs or pricing sensitivity." 
        : "Thin margins or high customer acquisition costs relative to LTV. Monetization path is complex or unproven.",
      reco: score >= 70
        ? "Optimize pricing tiers and expand upsell paths to maximize net revenue retention."
        : score >= 50
        ? "Test alternative pricing models and focus on reducing CAC through organic channels."
        : "Run pricing experiments with early adopters to validate willingness to pay before scaling."
    },
    riskProfile: {
      name: "Risk Profile",
      desc: score >= 70 
        ? "Low strategic, regulatory, or execution risk. The venture operates in a supportive or well-defined regulatory framework." 
        : score >= 50 
        ? "Moderate risks, primarily related to regulatory compliance timelines or customer adoption hurdles." 
        : "High strategic or regulatory risk. The venture faces compliance bottlenecks or high execution complexity.",
      reco: score >= 70
        ? "Establish standard operations and monitor competitor moves to maintain a low-risk profile."
        : score >= 50
        ? "Proactively build compliance frameworks and secure required approvals early."
        : "Develop a risk mitigation roadmap and maintain a larger capital runway to absorb delays."
    },
    sectorFit: {
      name: "Sector Fit",
      desc: score >= 70 
        ? "Perfect alignment with sector tailwinds, leveraging structural shifts like digitization, UPI, or local infrastructure." 
        : score >= 50 
        ? "Positive alignment with sector trends, though macro factors or supply chain constraints may limit speed." 
        : "Weak alignment with sector directions. Operating against macro headwinds or in a declining industry segment.",
      reco: score >= 70
        ? "Aggressively leverage sector tailwinds (e.g. UPI, ONDC, PLI schemes) to accelerate GTM."
        : score >= 50
        ? "Monitor policy shifts and structural changes to align GTM strategy with emerging trends."
        : "Re-evaluate geographic focus or product scope to align with growing market segments."
    }
  };
  return details[key] || { name: key, desc: "", reco: "" };
}

// ── Main export function ──
export async function exportPdf({ userData, answers, result, iframeEl }) {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  let chartImageSrc = null;
  if (iframeEl) {
    try {
      chartImageSrc = await captureChartsSection(iframeEl);
    } catch (err) {
      console.warn("⚠️ Chart capture failed:", err.message);
    }
  }

  const org     = userData?.organization || "Your Organisation";
  const sector  = userData?.sector       || "";
  const geo     = userData?.geography    || "";
  const score   = result?.overallScore   ?? 0;
  const grade   = result?.grade          || "N/A";
  const verdict = result?.verdict        || "";
  
  const dimLabels = {
    marketSize: "Market Size",
    audienceQuality: "Audience Quality",
    competitionEdge: "Competition Edge",
    revenuePotential: "Revenue Potential",
    riskProfile: "Risk Profile",
    sectorFit: "Sector Fit",
  };
  
  const rawDims = result?.dimensions || {};
  const dims = Object.entries(dimLabels).map(([key, name]) => {
    const s = rawDims[key] ?? 0;
    const detail = getDimDetail(key, s);
    return {
      key,
      name,
      score: s,
      description: detail.desc,
      recommendation: detail.reco,
    };
  });

  const insights = result?.keyInsights  || [];
  const risks    = result?.topRisks     || [];
  const wins     = result?.quickWins    || [];
  const tam      = result?.tamCrore     ?? 0;
  const sam      = result?.samCrore     ?? 0;
  const som      = result?.somCrore     ?? 0;
  const cagr     = result?.growthRate   ?? 0;

  const TOTAL = 16;

  // ══════════════════════════════════════════════════════════════════════════════
  // BUILD HTML DOCUMENT
  // ══════════════════════════════════════════════════════════════════════════════
  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Market Potential Report — \${org}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{
    --b900:#061228; --b800:#0d2040; --b700:#0f3460; --b600:#1144a0; --b500:#1a56db;
    --b400:#3b82f6; --b300:#93c5fd; --b200:#bfdbfe; --b100:#dbeafe; --b50:#eff6ff;
    --surface:#f0f4ff; --border:rgba(17,68,160,0.14); --ink:#1e293b; --inkL:#64748b;
    --green:#10b981; --red:#f43f5e; --orange:#f97316; --purple:#86198f; --cyan:#06b6d4;
  }
  *{box-sizing:border-box; margin:0; padding:0;}
  body{font-family:'Inter',sans-serif; background:#e5e9f5; color:var(--ink);}
  .mono{font-family:'IBM Plex Mono',monospace;}
  .serif{font-family:'Playfair Display',serif;}

  .wp-page{ width:210mm; min-height:297mm; margin:20px auto; background:#fff; box-shadow:0 8px 40px rgba(15,30,60,0.12); position:relative; page-break-after:always; overflow:hidden; font-family:'Inter',sans-serif; color:#1e293b; }
  .wp-serif{font-family:'Playfair Display',serif;}
  .wp-mono{font-family:'IBM Plex Mono',monospace;}
  @media print{ body{background:#fff;} .wp-page{margin:0; box-shadow:none;} }

  .page{ width:210mm; min-height:297mm; margin:20px auto; background:#fff; box-shadow:0 8px 40px rgba(15,30,60,0.12); position:relative; padding:15mm 16mm 12mm; display:flex; flex-direction:column; page-break-after:always; }
  @media print{ .page{margin:0; box-shadow:none;} }

  .eyebrow{font-size:11.6px; font-weight:700; letter-spacing:.15em; color:var(--b500); text-transform:uppercase; margin-bottom:6px;}
  .pg-title{font-size:27.84px; font-weight:700; color:var(--b900); margin-bottom:4px; line-height:1.24;}
  .pg-sub{font-size:12.76px; color:var(--inkL); max-width:560px; line-height:1.67; margin-bottom:18px;}

  .summary-table{width:100%; border-collapse:collapse; margin-top:4mm;}
  .summary-table th{text-align:left; padding:8px 0; font-size:12px; color:var(--inkL); border-bottom:2px solid var(--border);}
  .summary-table td{padding:12px 0; font-size:13px; font-weight:600; color:var(--b900); border-bottom:1px solid var(--border);}

  .spread-row{display:flex; align-items:center; margin-bottom:4mm;}
  .spread-label{width:38mm; font-size:11.5px; font-weight:700; color:var(--b900); flex-shrink:0;}
  .spread-track{flex:1; background:#e2e8f0; height:6px; border-radius:3px; position:relative; margin-right:4mm;}
  .spread-fill{height:100%; border-radius:3px; position:absolute; left:0; top:0;}
  .spread-val{font-size:11.5px; font-weight:700; width:10mm; text-align:right;}

  .analysis-cards{display:flex; gap:6mm; margin:6mm 0;}
  .a-card{flex:1; border-radius:12px; padding:6mm; position:relative; overflow:hidden;}
  .a-card.up{background:#f0fdf4; border:1px solid #bbf7d0; color:#16a34a;}
  .a-card.down{background:#fff1f2; border:1px solid #fecdd3; color:#e11d48;}
  .a-card-label{font-size:9.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--inkL); margin-bottom:4mm;}
  .a-card.up .a-card-label{color:#15803d;}
  .a-card.down .a-card-label{color:#9f1239;}
  .a-card-score{font-family:'IBM Plex Mono',monospace; font-size:52px; font-weight:700; line-height:1; margin-bottom:2mm;}
  .a-card-dim{font-size:16px; font-weight:700; color:var(--ink); margin-bottom:3mm;}
  .a-card-desc{font-size:11.5px; line-height:1.6; color:#475569;}

  .mod-card{border:1px solid var(--border); border-radius:12px; padding:6mm; margin-bottom:6mm; background:var(--surface);}
  .mod-card-hdr{display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4mm; border-bottom:1px solid var(--border); padding-bottom:3mm;}
  .mod-card-name{font-family:'Playfair Display',serif; font-size:20px; font-weight:700; color:var(--b900);}
  .mod-card-score{font-family:'IBM Plex Mono',monospace; font-size:16px; font-weight:700; color:var(--b600);}
  .mod-card .body{font-size:11.8px; line-height:1.75; color:var(--ink); margin-bottom:4mm;}

  .radar-flex{display:flex; gap:10mm; align-items:center; margin:6mm 0;}
  .archetype-box{background:var(--surface); border-radius:12px; padding:6mm; margin-bottom:6mm;}
  .archetype-box .lbl{font-size:9.5px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:var(--inkL); margin-bottom:2mm;}
  .archetype-box .archetype-name{font-family:'Playfair Display',serif; font-size:24px; font-weight:700; color:var(--b900);}
  .dim-list-row{display:flex; align-items:center; margin-bottom:3mm; font-size:11.5px;}
  .dim-list-row .dot{width:8px; height:8px; border-radius:50%; margin-right:3mm; flex-shrink:0;}
  .dim-list-row .val{font-family:'IBM Plex Mono',monospace; font-weight:700; width:8mm; text-align:right;}

  .dim-block{display:flex; gap:14px; padding:14px 0; border-bottom:1px solid var(--border);}
  .dim-block:last-child{border-bottom:none;}
  .dim-score-col{width:66px; flex-shrink:0; text-align:center;}
  .dim-score-col .n{font-family:'IBM Plex Mono',monospace; font-size:25.52px; font-weight:700;}
  .dim-score-col .band{font-size:8.7px; text-transform:uppercase; letter-spacing:.04em; color:var(--inkL); margin-top:1px;}
  .dim-body{flex:1;}
  .dim-name{font-size:13.92px; font-weight:700; color:var(--b900); margin-bottom:2px;}
  .dim-desc{font-size:11.6px; color:var(--inkL); line-height:1.67;}
  .tag-pill{display:inline-block; background:var(--b100); color:var(--b700); font-size:12.18px; font-weight:700; padding:4px 13px; border-radius:16px; margin-bottom:6px;}

  .print-btn{position:fixed; bottom:28px; right:28px; background:#061228; color:#fff; border:none; border-radius:8px; padding:11px 22px; font-size:13px; font-weight:600; cursor:pointer; box-shadow:0 4px 16px rgba(15,30,60,.25); z-index:9999;}
  .print-btn:hover{background:#1d3461;}
  @media print{.print-btn{display:none;}}
</style>
</head>
<body>

<!-- PAGE 1: COVER -->
<div class="wp-page" style="border:1px solid var(--border); display:flex; flex-direction:column; min-height:297mm;">
  <div style="padding:14mm 16mm 0;">
    <img src="\${LOGO_B64}" alt="Infopace" style="height:56px;"/>
  </div>
  <div style="padding:14mm 16mm 0; position:relative; z-index:2;">
    <div class="wp-mono" style="font-size:11.5px; letter-spacing:.2em; text-transform:uppercase; color:#1a56db; font-weight:600; margin-bottom:6mm;">Assessment Report · Personal Edition</div>
    <div style="font-weight:800; font-size:69.0px; line-height:1.08; color:#061228; letter-spacing:-.01em;">Market</div>
    <div style="font-weight:800; font-size:69.0px; line-height:1.08; color:#1a56db; letter-spacing:-.01em;">Potential</div>
    <div style="font-size:13.8px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#334155; margin-top:8mm;">Market Potential Summary</div>
  </div>
  <div style="position:relative; flex:1; height:150mm; margin-top:-4mm;">
    <div style="position:absolute; left:-30px; bottom:0;">
      \${SVG_WAVES}
    </div>
  </div>
  <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; padding:0 16mm 14mm;">
    <div class="wp-mono" style="font-size:10.3px; color:#94a3b8;">Prepared For: \${org}</div>
    <div style="font-weight:800; font-size:57.5px; color:#061228; line-height:1.1;">2026</div>
  </div>
</div>

<!-- PAGE 2: TABLE OF CONTENTS -->
<div class="page">
  \${pageHeader("02", TOTAL)}
  <div class="eyebrow">Contents</div>
  <div class="pg-title">Table of Contents</div>
  <div class="pg-sub">A guide to the structure of your market potential assessment report.</div>
  
  <table class="summary-table">
    <thead>
      <tr>
        <th>Section</th>
        <th style="text-align:right;">Page</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>01 / Our Assessment Suite</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">03</td></tr>
      <tr><td>02 / Executive Summary</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">04</td></tr>
      <tr><td>03 / Dimension-by-Dimension Breakdown (Part 1)</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">05</td></tr>
      <tr><td>04 / Dimension-by-Dimension Breakdown (Part 2)</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">06</td></tr>
      <tr><td>05 / Strengths, Growth Areas &amp; Watch-Outs</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">07</td></tr>
      <tr><td>06 / A Closer Look at Your Moderate Dimensions</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">08</td></tr>
      <tr><td>07 / Venture Profile &amp; Market Position</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">09</td></tr>
      <tr><td>08 / Action Plan &amp; Recommendations</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">10</td></tr>
      <tr><td>09 / Financial Opportunity &amp; Market Sizing</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">11</td></tr>
      <tr><td>10 / Go-To-Market &amp; Revenue Projections</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">12</td></tr>
      <tr><td>11 / Tracking Your Progress</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">13</td></tr>
      <tr><td>12 / Disclaimer, Privacy and Terms</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">14</td></tr>
      <tr><td>13 / About Infopace</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">15</td></tr>
    </tbody>
  </table>
  \${pageFooter()}
</div>

<!-- PAGE 3: OUR ASSESSMENT SUITE -->
<div class="page">
  \${pageHeader("03", TOTAL)}
  <div class="eyebrow">Introduction</div>
  <div class="pg-title">Our Assessment Suite</div>
  <div class="pg-sub">A summary of the frameworks and metrics we track across our diagnostic tools.</div>
  
  <div style="display:flex; flex-direction:column; gap:6mm; margin-top:5mm;">
    <div style="margin-bottom:0; padding:4mm; background:var(--b50); border-radius:8px;">
      <div style="font-weight:700; font-size:14px; color:var(--b900); margin-bottom:2mm;">Creative Innovation Index (CII)</div>
      <div style="font-size:12px; line-height:1.65; color:var(--ink);">Measures individual and team creative cognitive capacity, divergent thinking, remote association, openness to risk, and daily innovative habits. Used to build capability baselines.</div>
    </div>
    <div style="margin-bottom:0; padding:4mm; background:var(--b50); border-radius:8px;">
      <div style="font-weight:700; font-size:14px; color:var(--b900); margin-bottom:2mm;">Market Potential Index (MPI)</div>
      <div style="font-size:12px; line-height:1.65; color:var(--ink);">Evaluates early-stage venture concept feasibility, market sizing (TAM/SAM/SOM), target audience quality, competitor density, revenue model viability, and sector fit.</div>
    </div>
    <div style="margin-bottom:0; padding:4mm; background:var(--b50); border-radius:8px;">
      <div style="font-weight:700; font-size:14px; color:var(--b900); margin-bottom:2mm;">Product-Market Fit (PMF) Diagnostic</div>
      <div style="font-size:12px; line-height:1.65; color:var(--ink);">Tracks post-launch customer retention, Net Promoter Score (NPS), conversion velocities, expansion margins, and payback periods to establish scaling readiness.</div>
    </div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 4: EXECUTIVE SUMMARY -->
<div class="page">
  \${pageHeader("04", TOTAL)}
  <div class="eyebrow">Section One</div>
  <div class="pg-title">Executive Summary</div>
  <div class="pg-sub">A single-page overview of your overall market potential score, grade, verdict, and dimension checklist.</div>
  
  <div style="display:flex; align-items:center; gap:8mm; margin-top:5mm; margin-bottom:6mm;">
    \${scoreGauge(score)}
    <div>
      <div style="background:\${dimColor(score)}; color:#fff; display:inline-block; padding:4px 10px; border-radius:4px; font-weight:700; font-size:11px; margin-bottom:2mm;">
        \${grade}
      </div>
      <div style="font-size:22px; font-weight:800; color:var(--b900); font-family:'Playfair Display',serif;">
        \${score >= 70 ? "High-Potential Disruptor" : score >= 50 ? "Steady Competitor" : "Emerging Innovator"}
      </div>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat-box">
      <div class="n">\${score}</div>
      <div class="l">Overall Score</div>
    </div>
    <div class="stat-box">
      <div class="n">N/A</div>
      <div class="l">Percentile</div>
      <!-- Note: Dashboard does not compute percentile metric. Flagged as N/A in code comment as instructed. -->
    </div>
    <div class="stat-box">
      <div class="n">\${dims.filter(d => d.score >= 60).length}/6</div>
      <div class="l">Above Average</div>
    </div>
    <div class="stat-box">
      <div class="n" style="font-size:12.5px; height:33px; display:flex; align-items:center; justify-content:center; line-height:1.2;">
        \${dims.length > 0 ? [...dims].sort((a,b) => b.score - a.score)[0].name : "N/A"}
      </div>
      <div class="l">Top Dimension</div>
    </div>
  </div>

  <div style="padding:5mm; background:#fff8f5; border:1px solid #ffe8e0; border-radius:8px; margin-bottom:4mm; margin-top:4mm;">
    <div style="font-weight:700; font-size:13px; color:#c2410c; margin-bottom:1.5mm;">Venture Verdict</div>
    <div style="font-size:12px; line-height:1.6; color:#475569;">\${verdict}</div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 5: DIMENSION BREAKDOWN PART 1 -->
<div class="page">
  \${pageHeader("05", TOTAL)}
  <div class="eyebrow">Section Two</div>
  <div class="pg-title">Dimension Breakdown</div>
  <div class="pg-sub">Detailed assessment of the first three market potential dimensions.</div>
  
  <div style="display:flex; flex-direction:column; gap:5mm; margin-top:4mm;">
    \${dims.slice(0, 3).map(d => \`
      <div class="dim-block" style="border:1px solid var(--border); border-radius:8px; padding:4mm; display:flex; gap:5mm; align-items:flex-start;">
        <div class="dim-score-col">
          <div class="n" style="color:\${dimColor(d.score)};">\${d.score}</div>
          <div class="band">\${d.score >= 70 ? "Strong" : d.score >= 50 ? "Moderate" : "Weak"}</div>
        </div>
        <div class="dim-body">
          <div class="dim-name">\${d.name}</div>
          <div class="dim-desc" style="margin-bottom:2mm;">\${d.description}</div>
          <div style="font-size:11px; color:#475569; line-height:1.6; padding-left:3mm; border-left:2px solid \${dimColor(d.score)}; font-style:italic;">
            <strong>Recommendation:</strong> \${d.recommendation}
          </div>
        </div>
      </div>
    \`).join("")}
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 6: DIMENSION BREAKDOWN PART 2 -->
<div class="page">
  \${pageHeader("06", TOTAL)}
  <div class="eyebrow">Section Two, Continued</div>
  <div class="pg-title">Dimension Breakdown</div>
  <div class="pg-sub">Detailed assessment of the remaining three market potential dimensions.</div>
  
  <div style="display:flex; flex-direction:column; gap:5mm; margin-top:4mm;">
    \${dims.slice(3, 6).map(d => \`
      <div class="dim-block" style="border:1px solid var(--border); border-radius:8px; padding:4mm; display:flex; gap:5mm; align-items:flex-start;">
        <div class="dim-score-col">
          <div class="n" style="color:\${dimColor(d.score)};">\${d.score}</div>
          <div class="band">\${d.score >= 70 ? "Strong" : d.score >= 50 ? "Moderate" : "Weak"}</div>
        </div>
        <div class="dim-body">
          <div class="dim-name">\${d.name}</div>
          <div class="dim-desc" style="margin-bottom:2mm;">\${d.description}</div>
          <div style="font-size:11px; color:#475569; line-height:1.6; padding-left:3mm; border-left:2px solid \${dimColor(d.score)}; font-style:italic;">
            <strong>Recommendation:</strong> \${d.recommendation}
          </div>
        </div>
      </div>
    \`).join("")}
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 7: STRENGTHS, GROWTH AREAS & WATCH-OUTS -->
<div class="page">
  \${pageHeader("07", TOTAL)}
  <div class="eyebrow">Section Three</div>
  <div class="pg-title">Strengths, Growth Areas &amp; Watch-Outs</div>
  <div class="pg-sub">Your single strongest dimension, primary growth opportunity, and key watch-outs.</div>
  
  <div class="analysis-cards">
    <div class="a-card up">
      <div class="a-card-label">↑ Strongest Dimension</div>
      <div class="a-card-score">
        \${dims.length > 0 ? [...dims].sort((a,b) => b.score - a.score)[0].score : "0"}
      </div>
      <div class="a-card-dim">
        \${dims.length > 0 ? [...dims].sort((a,b) => b.score - a.score)[0].name : ""}
      </div>
      <div class="a-card-desc">
        This is your most reliable strategic asset. Use it intentionally as your anchor signal when discussing GTM viability with stakeholders and early investors.
      </div>
    </div>
    
    <div class="a-card down">
      <div class="a-card-label">↓ Primary Growth Area</div>
      <div class="a-card-score">
        \${dims.length > 0 ? [...dims].sort((a,b) => a.score - b.score)[0].score : "0"}
      </div>
      <div class="a-card-dim">
        \${dims.length > 0 ? [...dims].sort((a,b) => a.score - b.score)[0].name : ""}
      </div>
      <div class="a-card-desc">
        The clearest lever for raising your overall score. Focusing immediate GTM effort here will yield the fastest risk reduction in your venture model.
      </div>
    </div>
  </div>

  <h3 style="font-size:13px; text-transform:uppercase; color:var(--b900); margin-bottom:3mm; border-bottom:1px solid var(--border); padding-bottom:1.5mm;">Venture Score vs Benchmark</h3>
  <div style="display:flex; flex-direction:column; gap:3mm;">
    \${dims.map(d => {
      const b = (d.key === "marketSize" || d.key === "audienceQuality" || d.key === "sectorFit" ? 60 : d.key === "competitionEdge" || d.key === "revenuePotential" ? 55 : 50);
      const diff = d.score - b;
      const diffStr = diff >= 0 ? \`+\${diff}\` : \`\${diff}\`;
      return \`
        <div class="spread-row">
          <div class="spread-label">\${d.name}</div>
          <div class="spread-track">
            <div class="spread-fill" style="width:\${d.score}%; background:\${dimColor(d.score)};"></div>
          </div>
          <div class="spread-val" style="color:\${diff >= 0 ? '#10b981' : '#f43f5e'}">\${diffStr}</div>
        </div>
      \`;
    }).join("")}
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 8: MODERATE DIMENSIONS -->
<div class="page">
  \${pageHeader("08", TOTAL)}
  <div class="eyebrow">Section Four</div>
  <div class="pg-title">A Closer Look at Your Moderate Dimensions</div>
  <div class="pg-sub">Moderate dimensions scoring between 50 and 69 are your most sensitive swing dimensions.</div>
  
  <div style="display:flex; flex-direction:column; gap:4mm; margin-top:4mm; margin-bottom:4mm;">
    \${(() => {
      const moderateDims = dims.filter(d => d.score >= 50 && d.score < 70);
      if (moderateDims.length === 0) {
        return \`<div style="font-size:12px; color:var(--inkL); padding:10mm; text-align:center; background:var(--b50); border-radius:8px;">No moderate dimensions to display — all dimensions are either strong (>=70) or need work (<50).</div>\`;
      }
      return moderateDims.map(d => \`
        <div class="mod-card" style="margin-bottom:0;">
          <div class="mod-card-hdr">
            <div class="mod-card-name">\${d.name}</div>
            <div class="mod-card-score">\${d.score} / 100</div>
          </div>
          <p class="body" style="margin-bottom:2mm;">\${d.description}</p>
          <div style="font-size:11px; line-height:1.6; color:#475569; font-style:italic;">
            <strong>Suggested Action:</strong> \${d.recommendation}
          </div>
        </div>
      \`).join("");
    })()}
  </div>
  
  <div style="background:#eff6ff; border-left:3px solid var(--b500); padding:3.5mm 4mm; border-radius:4px; font-size:11.5px; line-height:1.6; color:var(--b900);">
    <strong>Note:</strong> Moderate dimensions represent high-potential opportunities. They require relatively low barrier-to-entry shifts in execution or model parameters to convert into full-fledged strategic strengths.
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 9: RADAR & POSITIONING -->
<div class="page">
  \${pageHeader("09", TOTAL)}
  <div class="eyebrow">Section Five</div>
  <div class="pg-title">Venture Profile &amp; Competitor Radar</div>
  <div class="pg-sub">Your dimension scorecard mapped alongside your market positioning context.</div>
  
  <div class="radar-flex">
    \${(() => {
      const cx = 145, cy = 135, r_max = 95;
      const angles = [
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI / 3,
        -Math.PI / 2 + 2 * Math.PI / 3,
        -Math.PI / 2 + Math.PI,
        -Math.PI / 2 + 4 * Math.PI / 3,
        -Math.PI / 2 + 5 * Math.PI / 3
      ];
      const pointsArr = dims.map((d, i) => {
        const r = (d.score / 100) * r_max;
        const x = cx + r * Math.cos(angles[i]);
        const y = cy + r * Math.sin(angles[i]);
        return \`\${x.toFixed(1)},\${y.toFixed(1)}\`;
      });
      const pointsStr = pointsArr.join(" ");

      const benchmarks = [60, 60, 55, 55, 50, 60];
      const benchPointsArr = benchmarks.map((bench, i) => {
        const r = (bench / 100) * r_max;
        const x = cx + r * Math.cos(angles[i]);
        const y = cy + r * Math.sin(angles[i]);
        return \`\${x.toFixed(1)},\${y.toFixed(1)}\`;
      });
      const benchPointsStr = benchPointsArr.join(" ");

      return \`
        <svg width="250" height="250" viewBox="0 0 290 270" style="flex-shrink:0;">
          <polygon points="145,40 227,87 227,183 145,230 63,183 63,87" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <polygon points="145,87.5 186,111 186,159 145,182.5 104,159 104,111" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <line x1="145" y1="135" x2="145" y2="40" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="227" y2="87" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="227" y2="183" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="145" y2="230" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="63" y2="183" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="63" y2="87" stroke="#e2e8f0"/>
          <polygon points="\${benchPointsStr}" fill="none" stroke="#9bb0c9" stroke-width="1.5" stroke-dasharray="3 3"/>
          <polygon points="\${pointsStr}" fill="rgba(26,86,219,0.18)" stroke="#1a56db" stroke-width="2.5"/>
          <text x="145" y="32" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">Market Size</text>
          <text x="234" y="84" text-anchor="start" font-size="9" font-weight="700" fill="#0f172a">Audience</text>
          <text x="234" y="188" text-anchor="start" font-size="9" font-weight="700" fill="#0f172a">Competition</text>
          <text x="145" y="244" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">Revenue</text>
          <text x="56" y="188" text-anchor="end" font-size="9" font-weight="700" fill="#0f172a">Risk Profile</text>
          <text x="56" y="84" text-anchor="end" font-size="9" font-weight="700" fill="#0f172a">Sector Fit</text>
        </svg>
      \`;
    })()}

    <div style="flex:1;">
      <div class="archetype-box" style="margin-bottom:4mm; padding:4mm; border-left:3px solid var(--b500);">
        <div class="lbl">Market Archetype</div>
        <div class="archetype-name" style="font-size:18px;">
          \${score >= 70 ? "High-Potential Disruptor" : score >= 50 ? "Steady Competitor" : "Emerging Innovator"}
        </div>
        <!-- Note: Dashboard does not compute a specific venture archetype. Placed computed category fallback in code comment as required. -->
      </div>
      <div style="display:flex; flex-direction:column; gap:2mm;">
        \${dims.map(d => \`
          <div class="dim-list-row" style="margin-bottom:0;">
            <div style="display:flex; align-items:center; gap:2mm;">
              <div class="dot" style="background:\${dimColor(d.score)};"></div>
              <span style="font-weight:600; color:var(--ink);">\${d.name}</span>
            </div>
            <div class="val">\${d.score}</div>
          </div>
        \`).join("")}
      </div>
    </div>
  </div>
  
  <div style="padding:4mm; background:var(--b50); border-radius:8px; margin-top:4mm; border:1px solid var(--border);">
    <div style="font-weight:700; font-size:12.5px; color:var(--b900); margin-bottom:1.5mm;">Moat Moat moats &amp; Competitive Positioning</div>
    <div style="font-size:11.5px; line-height:1.6; color:#475569;">\${result?.popups?.radar || "Radar context details not available."}</div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 10: ACTION PLAN -->
<div class="page">
  \${pageHeader("10", TOTAL)}
  <div class="eyebrow">Section Six</div>
  <div class="pg-title">Action Plan &amp; Recommendations</div>
  <div class="pg-sub">Insights, critical risks, and priority wins derived from the assessment.</div>
  
  <div style="display:grid; grid-template-columns:1fr 1fr; gap:5mm; margin-top:4mm; margin-bottom:4mm; flex:1;">
    <div style="display:flex; flex-direction:column; gap:4mm;">
      <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; flex:1; display:flex; flex-direction:column;">
        <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm; border-bottom:1px solid rgba(17,68,160,0.1); padding-bottom:1mm; display:flex; align-items:center; gap:2mm;">
          💡 Key Insights
        </div>
        <div style="font-size:11px; color:#475569; display:flex; flex-direction:column; gap:2mm;">
          \${insights.slice(0, 4).map(x => \`
            <div style="display:flex; gap:2mm;">
              <div style="width:1.5mm; height:1.5mm; border-radius:50%; background:var(--b500); flex-shrink:0; margin-top:1.5mm;"></div>
              <div>\${x}</div>
            </div>
          \`).join("")}
        </div>
      </div>
      
      <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; flex:1; display:flex; flex-direction:column;">
        <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm; border-bottom:1px solid rgba(17,68,160,0.1); padding-bottom:1mm; display:flex; align-items:center; gap:2mm;">
          ⚡ Critical Risks
        </div>
        <div style="font-size:11px; color:#475569; display:flex; flex-direction:column; gap:2mm;">
          \${risks.slice(0, 3).map(x => \`
            <div style="display:flex; gap:2mm;">
              <div style="width:1.5mm; height:1.5mm; border-radius:50%; background:#f43f5e; flex-shrink:0; margin-top:1.5mm;"></div>
              <div>\${x}</div>
            </div>
          \`).join("")}
        </div>
      </div>
    </div>
    
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; display:flex; flex-direction:column;">
      <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm; border-bottom:1px solid rgba(17,68,160,0.1); padding-bottom:1mm; display:flex; align-items:center; gap:2mm;">
        🚀 90-Day Quick Wins
      </div>
      <div style="font-size:11px; color:#475569; display:flex; flex-direction:column; gap:3mm; flex:1; justify-content:center;">
        \${wins.slice(0, 3).map(x => \`
          <div style="display:flex; gap:2.5mm; align-items:flex-start;">
            <div style="width:2mm; height:2mm; border-radius:50%; background:#10b981; flex-shrink:0; margin-top:1.5mm;"></div>
            <div>\${x}</div>
          </div>
        \`).join("")}
      </div>
    </div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 11: FINANCIAL SIZE -->
<div class="page">
  \${pageHeader("11", TOTAL)}
  <div class="eyebrow">Section Seven</div>
  <div class="pg-title">Financial Opportunity &amp; Sizing</div>
  <div class="pg-sub">Target market potential sizing and live charts snapshot.</div>
  
  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4mm; margin-top:4mm; margin-bottom:5mm;">
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">₹\${Math.round(tam)}Cr</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">TAM</div>
    </div>
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">₹\${Math.round(sam)}Cr</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">SAM</div>
    </div>
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">₹\${Math.round(som)}Cr</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">SOM</div>
    </div>
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">\${cagr}%</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">CAGR</div>
    </div>
  </div>

  <div style="flex:1; display:flex; justify-content:center; align-items:center; background:#f8fafc; border:1px solid var(--border); border-radius:8px; overflow:hidden; position:relative; min-height:100mm;">
    \${chartImageSrc 
      ? \`<img src="\${chartImageSrc}" style="width:100%; height:100%; object-fit:contain; max-height:100mm;" alt="Market Charts"/>\`
      : \`<div style="font-size:12px; color:var(--inkL);">Charts snapshot image capture (html2canvas) placeholder.</div>\`
    }
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 12: GTM PROJECTIONS -->
<div class="page">
  \${pageHeader("12", TOTAL)}
  <div class="eyebrow">Section Eight</div>
  <div class="pg-title">Go-To-Market &amp; Projections</div>
  <div class="pg-sub">Regional revenue breakdown, prioritize cities, and expected growth trajectory.</div>
  
  <div style="display:flex; flex-direction:column; gap:4mm; margin-top:4mm; flex:1;">
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; background:#fff8f5; border-color:#ffe8e0;">
      <div style="font-weight:700; font-size:13px; color:#c2410c; margin-bottom:1.5mm;">Priority Markets &amp; Rationale</div>
      <div style="font-size:11.5px; line-height:1.6; color:#475569;">\${result?.popups?.revregion || "Regional priority breakdown details not available."}</div>
    </div>

    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; background:#f0fdf4; border-color:#bbf7d0;">
      <div style="font-weight:700; font-size:13px; color:#15803d; margin-bottom:1.5mm;">Revenue Trajectory &amp; Growth Outlook</div>
      <div style="font-size:11.5px; line-height:1.6; color:#374151;">\${result?.popups?.trend || "Growth trend context details not available."}</div>
    </div>
    
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; background:#f0fdfa; border-color:#ccfbf1;">
      <div style="font-weight:700; font-size:13px; color:#0f766e; margin-bottom:1.5mm;">Geographic Focus Strategy</div>
      <div style="font-size:11.5px; line-height:1.6; color:#374151;">\${result?.popups?.geomap || "Geomap strategy details not available."}</div>
    </div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 13: TRACKING PROGRESS -->
<div class="page">
  \${pageHeader("13", TOTAL)}
  <div class="eyebrow">Section Nine</div>
  <div class="pg-title">Tracking Your Progress</div>
  <div class="pg-sub">Specific milestones to track as you implement this plan.</div>
  
  <div style="display:flex; flex-direction:column; gap:4mm; margin-top:4mm; flex:1;">
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm;">
      <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm;">📅 30-Day Checkpoint: Problem &amp; Moat Validation</div>
      <div style="font-size:11px; color:#475569; line-height:1.6;">
        Verify that you have conducted at least 20 JTBD problem interviews with target decision-makers, mapped the core features against competitor offsets, and formally documented your primary defensibility thesis.
      </div>
    </div>
    
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm;">
      <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm;">📅 60-Day Checkpoint: TAM-SAM-SOM Verification</div>
      <div style="font-size:11px; color:#475569; line-height:1.6;">
        Validate initial customer acquisition metrics. Monitor pricing power index, average transaction size, and local market density in your primary priority cities to confirm that the target SAM remains mathematically realistic.
      </div>
    </div>
    
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm;">
      <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm;">📅 90-Day Checkpoint: Trajectory Re-Evaluation</div>
      <div style="font-size:11px; color:#475569; line-height:1.6;">
        Conduct a comprehensive review of your GTM pipeline. Compare actual revenue run-rate against projected monthly target curves. Re-run this assessment to monitor shifts in your moderate and weak dimensions.
      </div>
    </div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 14: DISCLAIMER -->
<div class="page">
  \${pageHeader("14", TOTAL)}
  <div class="eyebrow">Section Ten</div>
  <div class="pg-title">Disclaimer, Privacy &amp; Terms</div>
  <div class="pg-sub">Legal guidelines, data security rules, and terms of use for this diagnostic tool.</div>
  
  <div style="font-size:11px; line-height:1.65; color:var(--ink); display:flex; flex-direction:column; gap:4mm; margin-top:4mm; flex:1;">
    <p><strong>General Disclaimer:</strong> This diagnostic tool is designed to provide directional insights based on input answers and AI evaluation benchmarks. It does not constitute formal legal, financial, or investment advice. Infopace Management Pvt. Ltd. makes no warranties regarding the accuracy or market outcome of these forecasts.</p>
    <p><strong>Privacy Policy:</strong> Your submission data, organizational answers, and final dashboard scores are stored securely using Supabase encryption protocols. Personal information will never be shared, sold, or distributed to third parties without your explicit consent.</p>
    <p><strong>Terms of Use:</strong> This report is licensed solely for the internal strategic planning of the evaluated organization. Unauthorized reproduction, resale, or distribution of this report or the underlying diagnostic frameworks is strictly prohibited.</p>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 15: ABOUT INFOPACE -->
<div class="page">
  \${pageHeader("15", TOTAL)}
  <div class="eyebrow">Section Eleven</div>
  <div class="pg-title">About Infopace</div>
  <div class="pg-sub">A brief introduction to our team, methodology, and corporate advisory services.</div>
  
  <div style="display:flex; flex-direction:column; gap:5mm; margin-top:4mm; flex:1;">
    <div style="font-size:11.5px; line-height:1.65; color:var(--ink);">
      Infopace is a premier market intelligence and corporate advisory firm. We help early-stage venture founders and enterprise innovation heads design, validate, and scale high-potential market concepts.
    </div>
    <div style="font-size:11.5px; line-height:1.65; color:var(--ink);">
      Our diagnostic methodologies combine quantitative database analysis with generative AI reasoning to produce accurate, real-world projections tailored to specific sectors, regulatory models, and geographies.
    </div>
    <div style="border:1px solid var(--border); padding:4mm; border-radius:8px; background:var(--b50); margin-top:2mm;">
      <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:1.5mm;">Methodology Stack</div>
      <div style="font-size:11px; line-height:1.6; color:#475569;">
        Every score is generated by cross-referencing founder submissions against our proprietary database of regional industry benchmarks, regulatory timeline constants, and competitive positioning datasets.
      </div>
    </div>
  </div>
  \${pageFooter()}
</div>

<!-- PAGE 16: CONTACT BACK COVER -->
<div class="wp-page" style="display:flex; flex-direction:column; justify-content:space-between; min-height:297mm; border:1px solid var(--border);">
  <div style="position:relative; z-index:2; padding:12mm 16mm 0; display:flex; justify-content:space-between; align-items:center;">
    <img src="\${LOGO_B64}" alt="Infopace" style="height:56px;"/>
    <div style="font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#94a3b8;">16 / 16</div>
  </div>
  
  <div style="position:relative; height:75mm; overflow:hidden; margin-bottom:20mm;">
    \${SVG_WAVES}
  </div>

  <div style="padding:0 16mm 16mm; position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end;">
    <div>
      <div style="font-weight:800; font-size:14px; color:var(--b900); margin-bottom:1.5mm;">Infopace Management Pvt. Ltd.</div>
      <div style="font-size:11px; color:var(--inkL); line-height:1.5;">
        advisory@infopace.in · www.infopace.in<br/>
        Venture Diagnostics &amp; Market Intelligence
      </div>
    </div>
    <div style="font-weight:800; font-size:57.5px; color:#061228; line-height:1.1;">2026</div>
  </div>
</div>

<button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>

</body>
</html>\`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to export the PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 1200);
}
`;

fs.writeFileSync('src/lib/exportPdf.js', header + '\n' + newBody, 'utf8');
console.log('Successfully wrote src/lib/exportPdf.js');
