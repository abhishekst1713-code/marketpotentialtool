/**
 * exportPdf — Multi-page A4 report using the CII Report layout.
 * Pages 1-3: Identical to CII report cover, TOC, and assessment suite pages.
 * Pages 4-8: Market Potential data using the same template.
 * Pages 9-11 (last 3): Identical to CII disclaimer, tracking, and about pages.
 *
 * Usage (unchanged):
 *   exportPdf({ userData, answers, result, iframeEl })
 */

// ── Load html2canvas from CDN once ────────────────────────────────────────────
function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script   = document.createElement("script");
    script.src     = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.onload  = () => resolve(window.html2canvas);
    script.onerror = () => reject(new Error("html2canvas failed to load"));
    document.head.appendChild(script);
  });
}

// ── Capture only the #viewCharts section (or full dashboard as fallback) ──────
async function captureChartsSection(iframeEl) {
  const html2canvas = await loadHtml2Canvas();
  const iframeDoc   = iframeEl?.contentDocument || iframeEl?.contentWindow?.document;
  const iframeWin   = iframeEl?.contentWindow;

  if (!iframeDoc) throw new Error("Cannot access iframe document");

  if (typeof iframeWin?.switchView === "function") {
    iframeWin.switchView("charts");
  }
  await new Promise(r => setTimeout(r, 300));

  const CAPTURE_W = 1600;
  const CAPTURE_H = 900;
  const prevW = iframeEl.style.width;
  const prevH = iframeEl.style.height;
  iframeEl.style.width  = CAPTURE_W + "px";
  iframeEl.style.height = CAPTURE_H + "px";
  await new Promise(r => setTimeout(r, 200));

  const charts = iframeWin?.dashCharts || {};
  Object.values(charts).forEach(ch => { try { ch?.resize?.(); } catch (_) {} });
  await new Promise(r => setTimeout(r, 1000));

  const viewCharts = iframeDoc.getElementById("viewCharts");
  const sidebar    = iframeDoc.getElementById("outputSidebar");
  let origVC = null, origSB = null;

  if (viewCharts) {
    origVC = viewCharts.getAttribute("style") || "";
    viewCharts.style.cssText = [
      "position:relative", "left:0", "top:0",
      "width:" + CAPTURE_W + "px", "height:auto",
      "overflow:visible", "display:flex", "flex-direction:column",
    ].join(";");
  }
  if (sidebar) {
    origSB = sidebar.getAttribute("style") || "";
    sidebar.style.display = "none";
  }

  await new Promise(r => setTimeout(r, 150));

  const target = viewCharts || iframeDoc.getElementById("dashShell") || iframeDoc.body;
  const capW   = target.scrollWidth  || CAPTURE_W;
  const capH   = target.scrollHeight || CAPTURE_H;

  const canvas = await html2canvas(target, {
    useCORS: true, allowTaint: true, scale: 2,
    backgroundColor: "#EEF2F7", logging: false,
    width: capW, height: capH,
    windowWidth: CAPTURE_W, windowHeight: CAPTURE_H,
    x: 0, y: 0,
    ignoreElements: el =>
      el.id === "outputSidebar" ||
      el.classList?.contains("sb-btn") ||
      el.classList?.contains("no-print"),
  });

  if (viewCharts && origVC !== null) viewCharts.setAttribute("style", origVC);
  if (sidebar   && origSB !== null) sidebar.setAttribute("style", origSB);
  iframeEl.style.width  = prevW;
  iframeEl.style.height = prevH;

  return canvas.toDataURL("image/png", 0.95);
}

// ── Shared SVG wave background (used in pages 3 and beyond) ────────────────────
const SVG_WAVES = `<svg width="760" height="480" viewBox="0 0 760 480"><path d="M 0.0 23.8 Q 17.3 25.4 25.9 26.2 Q 51.8 28.9 60.5 29.8 Q 86.4 32.5 95.0 33.3 Q 120.9 35.8 129.5 36.6 Q 155.5 38.8 164.1 39.5 Q 190.0 41.4 198.6 42.0 Q 224.5 43.6 233.2 44.0 Q 259.1 45.2 267.7 45.5 Q 293.6 46.1 302.3 46.0 Q 328.2 45.6 336.8 45.2 Q 362.7 43.7 371.4 42.9 Q 397.3 40.0 405.9 38.8 Q 431.8 34.9 440.5 33.4 Q 466.4 28.7 475.0 27.0 Q 500.9 21.9 509.5 20.1 Q 535.5 14.8 544.1 13.1 Q 570.0 7.9 578.6 6.2 Q 604.5 1.2 613.2 -0.3 Q 639.1 -4.8 647.7 -6.1 Q 673.6 -9.9 682.3 -10.9 Q 708.2 -13.7 716.8 -14.3 Q 742.7 -15.6 751.4 -15.7" fill="none" stroke="#1a56db" stroke-width="1.05" stroke-opacity="0.75" stroke-linecap="round"/><path d="M 0.0 67.3 Q 17.3 69.2 25.9 70.1 Q 51.8 72.8 60.5 73.7 Q 86.4 76.4 95.0 77.2 Q 120.9 79.4 129.5 80.0 Q 155.5 81.5 164.1 81.8 Q 190.0 82.1 198.6 81.9 Q 224.5 80.8 233.2 80.1 Q 259.1 77.6 267.7 76.5 Q 293.6 72.7 302.3 71.2 Q 328.2 66.5 336.8 64.7 Q 362.7 59.3 371.4 57.4 Q 397.3 51.5 405.9 49.4 Q 431.8 43.2 440.5 41.1 Q 466.4 34.7 475.0 32.6 Q 500.9 26.3 509.5 24.3 Q 535.5 18.5 544.1 16.8 Q 570.0 11.9 578.6 10.6 Q 604.5 7.3 613.2 6.5 Q 639.1 4.9 647.7 4.8 Q 673.6 5.2 682.3 5.8 Q 708.2 8.2 716.8 9.5 Q 742.7 13.8 751.4 15.6" fill="none" stroke="#93c5fd" stroke-width="0.80" stroke-opacity="0.48" stroke-linecap="round"/><path d="M 0.0 99.0 Q 17.3 102.8 25.9 104.7 Q 51.8 110.1 60.5 111.8 Q 86.4 116.4 95.0 117.6 Q 120.9 120.8 129.5 121.4 Q 155.5 122.5 164.1 122.4 Q 190.0 121.1 198.6 120.1 Q 224.5 116.4 233.2 114.7 Q 259.1 108.6 267.7 106.2 Q 293.6 98.2 302.3 95.1 Q 328.2 85.4 336.8 81.9 Q 362.7 70.8 371.4 66.9 Q 397.3 54.8 405.9 50.7 Q 431.8 38.2 440.5 34.0 Q 466.4 21.7 475.0 17.7 Q 500.9 6.4 509.5 3.0 Q 535.5 -6.3 544.1 -8.9 Q 570.0 -15.5 578.6 -17.0 Q 604.5 -20.2 613.2 -20.5 Q 639.1 -20.0 647.7 -19.0 Q 673.6 -14.6 682.3 -12.3 Q 708.2 -4.2 716.8 -0.6 Q 742.7 11.1 751.4 15.8" fill="none" stroke="#93c5fd" stroke-width="1.30" stroke-opacity="0.44" stroke-linecap="round"/><path d="M 0.0 155.7 Q 17.3 156.6 25.9 156.8 Q 51.8 156.8 60.5 156.5 Q 86.4 154.9 95.0 154.1 Q 120.9 151.0 129.5 149.6 Q 155.5 145.1 164.1 143.2 Q 190.0 137.2 198.6 134.8 Q 224.5 127.3 233.2 124.5 Q 259.1 115.6 267.7 112.4 Q 293.6 102.4 302.3 99.0 Q 328.2 88.4 336.8 84.9 Q 362.7 74.5 371.4 71.2 Q 397.3 61.7 405.9 58.8 Q 431.8 50.8 440.5 48.6 Q 466.4 42.6 475.0 41.1 Q 500.9 37.5 509.5 36.9 Q 535.5 35.9 544.1 36.2 Q 570.0 38.0 578.6 39.3 Q 604.5 44.0 613.2 46.3 Q 639.1 54.1 647.7 57.3 Q 673.6 68.1 682.3 72.3 Q 708.2 85.8 716.8 90.8 Q 742.7 106.4 751.4 112.0" fill="none" stroke="#93c5fd" stroke-width="1.30" stroke-opacity="0.32" stroke-linecap="round"/></svg>`;

// ── Infopace logo (base64 PNG) ──────────────────────────────────────────────────
const LOGO_B64 = `data:image/png;base64,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`;

// ── Shared page header component HTML ──────────────────────────────────────────
function pageHeader(pageNum, totalPages) {
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:9mm;">
      <img src="${LOGO_B64}" alt="Infopace" style="height:56px;"/>
      <div style="font-family:'IBM Plex Mono',monospace; font-size:10.3px; color:#94a3b8;">${pageNum} / ${totalPages}</div>
    </div>
  `;
}

// ── Shared page footer component HTML ──────────────────────────────────────────
function pageFooter() {
  return `
    <div style="margin-top:auto; padding-top:6mm; border-top:1px solid rgba(17,68,160,0.14); display:flex; justify-content:space-between; font-size:9.5px; color:#94a3b8; letter-spacing:.02em;">
      <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
      <div>AI-Evaluated Report</div>
    </div>
  `;
}

// ── SVG Gauge for score ────────────────────────────────────────────────────────
function scoreGauge(score) {
  const r = 100, cx = 130, cy = 130;
  const clampedScore = Math.min(Math.max(score || 0, 0), 100);
  const angleRad = Math.PI * (1 - clampedScore / 100);
  const x = cx + r * Math.cos(angleRad);
  const y = cy - r * Math.sin(angleRad);
  const strokeColor = clampedScore >= 70 ? "#10b981" : clampedScore >= 50 ? "#f97316" : "#f43f5e";
  return `
    <svg width="260" height="145" viewBox="0 0 260 145">
      <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="#e2e8f0" stroke-width="14" stroke-linecap="round"/>
      <path d="M 30 130 A 100 100 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}" fill="none" stroke="${strokeColor}" stroke-width="14" stroke-linecap="round"/>
      <text x="130" y="118" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="48" font-weight="700" fill="#061228">${clampedScore}</text>
      <text x="130" y="136" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10" fill="#64748b" letter-spacing=".1em">OUT OF 100</text>
    </svg>
  `;
}

// ── Color for a dimension score ────────────────────────────────────────────────
function dimColor(score) {
  if (score >= 75) return "#10b981";
  if (score >= 55) return "#f97316";
  return "#f43f5e";
}

// ── Grade badge color ──────────────────────────────────────────────────────────
function gradeColor(grade) {
  const g = (grade || "").toUpperCase();
  if (g.startsWith("A")) return "#10b981";
  if (g.startsWith("B")) return "#1a56db";
  if (g.startsWith("C")) return "#f97316";
  return "#f43f5e";
}

// ── Main export function ───────────────────────────────────────────────────────

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

  let chartImageSrc = iframeEl?.contentWindow?.chartImageSrc || null;
  if (!chartImageSrc && iframeEl) {
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
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Market Potential Report — ${org}</title>
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
    <img src="${LOGO_B64}" alt="Infopace" style="height:56px;"/>
  </div>
  <div style="padding:14mm 16mm 0; position:relative; z-index:2;">
    <div class="wp-mono" style="font-size:11.5px; letter-spacing:.2em; text-transform:uppercase; color:#1a56db; font-weight:600; margin-bottom:6mm;">Assessment Report · Personal Edition</div>
    <div style="font-weight:800; font-size:69.0px; line-height:1.08; color:#061228; letter-spacing:-.01em;">Market</div>
    <div style="font-weight:800; font-size:69.0px; line-height:1.08; color:#1a56db; letter-spacing:-.01em;">Potential</div>
    <div style="font-size:13.8px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#334155; margin-top:8mm;">Market Potential Summary</div>
  </div>
  <div style="position:relative; flex:1; height:150mm; margin-top:-4mm;">
    <div style="position:absolute; left:-30px; bottom:0;">
      ${SVG_WAVES}
    </div>
  </div>
  <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; padding:0 16mm 14mm;">
    <div class="wp-mono" style="font-size:10.3px; color:#94a3b8;">Prepared For: ${org}</div>
    <div style="font-weight:800; font-size:57.5px; color:#061228; line-height:1.1;">2026</div>
  </div>
</div>

<!-- PAGE 2: TABLE OF CONTENTS -->
<div class="page">
  ${pageHeader("02", TOTAL)}
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
  ${pageFooter()}
</div>

<!-- PAGE 3: OUR ASSESSMENT SUITE -->
<div class="page">
  ${pageHeader("03", TOTAL)}
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
  ${pageFooter()}
</div>

<!-- PAGE 4: EXECUTIVE SUMMARY -->
<div class="page">
  ${pageHeader("04", TOTAL)}
  <div class="eyebrow">Section One</div>
  <div class="pg-title">Executive Summary</div>
  <div class="pg-sub">A single-page overview of your overall market potential score, grade, verdict, and dimension checklist.</div>
  
  <div style="display:flex; align-items:center; gap:8mm; margin-top:5mm; margin-bottom:6mm;">
    ${scoreGauge(score)}
    <div>
      <div style="background:${dimColor(score)}; color:#fff; display:inline-block; padding:4px 10px; border-radius:4px; font-weight:700; font-size:11px; margin-bottom:2mm;">
        ${grade}
      </div>
      <div style="font-size:22px; font-weight:800; color:var(--b900); font-family:'Playfair Display',serif;">
        ${score >= 70 ? "High-Potential Disruptor" : score >= 50 ? "Steady Competitor" : "Emerging Innovator"}
      </div>
    </div>
  </div>

  <div class="stat-row">
    <div class="stat-box">
      <div class="n">${score}</div>
      <div class="l">Overall Score</div>
    </div>
    <div class="stat-box">
      <div class="n">N/A</div>
      <div class="l">Percentile</div>
      <!-- Note: Dashboard does not compute percentile metric. Flagged as N/A in code comment as instructed. -->
    </div>
    <div class="stat-box">
      <div class="n">${dims.filter(d => d.score >= 60).length}/6</div>
      <div class="l">Above Average</div>
    </div>
    <div class="stat-box">
      <div class="n" style="font-size:12.5px; height:33px; display:flex; align-items:center; justify-content:center; line-height:1.2;">
        ${dims.length > 0 ? [...dims].sort((a,b) => b.score - a.score)[0].name : "N/A"}
      </div>
      <div class="l">Top Dimension</div>
    </div>
  </div>

  <div style="padding:5mm; background:#fff8f5; border:1px solid #ffe8e0; border-radius:8px; margin-bottom:4mm; margin-top:4mm;">
    <div style="font-weight:700; font-size:13px; color:#c2410c; margin-bottom:1.5mm;">Venture Verdict</div>
    <div style="font-size:12px; line-height:1.6; color:#475569;">${verdict}</div>
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 5: DIMENSION BREAKDOWN PART 1 -->
<div class="page">
  ${pageHeader("05", TOTAL)}
  <div class="eyebrow">Section Two</div>
  <div class="pg-title">Dimension Breakdown</div>
  <div class="pg-sub">Detailed assessment of the first three market potential dimensions.</div>
  
  <div style="display:flex; flex-direction:column; gap:5mm; margin-top:4mm;">
    ${dims.slice(0, 3).map(d => `
      <div class="dim-block" style="border:1px solid var(--border); border-radius:8px; padding:4mm; display:flex; gap:5mm; align-items:flex-start;">
        <div class="dim-score-col">
          <div class="n" style="color:${dimColor(d.score)};">${d.score}</div>
          <div class="band">${d.score >= 70 ? "Strong" : d.score >= 50 ? "Moderate" : "Weak"}</div>
        </div>
        <div class="dim-body">
          <div class="dim-name">${d.name}</div>
          <div class="dim-desc" style="margin-bottom:2mm;">${d.description}</div>
          <div style="font-size:11px; color:#475569; line-height:1.6; padding-left:3mm; border-left:2px solid ${dimColor(d.score)}; font-style:italic;">
            <strong>Recommendation:</strong> ${d.recommendation}
          </div>
        </div>
      </div>
    `).join("")}
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 6: DIMENSION BREAKDOWN PART 2 -->
<div class="page">
  ${pageHeader("06", TOTAL)}
  <div class="eyebrow">Section Two, Continued</div>
  <div class="pg-title">Dimension Breakdown</div>
  <div class="pg-sub">Detailed assessment of the remaining three market potential dimensions.</div>
  
  <div style="display:flex; flex-direction:column; gap:5mm; margin-top:4mm;">
    ${dims.slice(3, 6).map(d => `
      <div class="dim-block" style="border:1px solid var(--border); border-radius:8px; padding:4mm; display:flex; gap:5mm; align-items:flex-start;">
        <div class="dim-score-col">
          <div class="n" style="color:${dimColor(d.score)};">${d.score}</div>
          <div class="band">${d.score >= 70 ? "Strong" : d.score >= 50 ? "Moderate" : "Weak"}</div>
        </div>
        <div class="dim-body">
          <div class="dim-name">${d.name}</div>
          <div class="dim-desc" style="margin-bottom:2mm;">${d.description}</div>
          <div style="font-size:11px; color:#475569; line-height:1.6; padding-left:3mm; border-left:2px solid ${dimColor(d.score)}; font-style:italic;">
            <strong>Recommendation:</strong> ${d.recommendation}
          </div>
        </div>
      </div>
    `).join("")}
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 7: STRENGTHS, GROWTH AREAS & WATCH-OUTS -->
<div class="page">
  ${pageHeader("07", TOTAL)}
  <div class="eyebrow">Section Three</div>
  <div class="pg-title">Strengths, Growth Areas &amp; Watch-Outs</div>
  <div class="pg-sub">Your single strongest dimension, primary growth opportunity, and key watch-outs.</div>
  
  <div class="analysis-cards">
    <div class="a-card up">
      <div class="a-card-label">↑ Strongest Dimension</div>
      <div class="a-card-score">
        ${dims.length > 0 ? [...dims].sort((a,b) => b.score - a.score)[0].score : "0"}
      </div>
      <div class="a-card-dim">
        ${dims.length > 0 ? [...dims].sort((a,b) => b.score - a.score)[0].name : ""}
      </div>
      <div class="a-card-desc">
        This is your most reliable strategic asset. Use it intentionally as your anchor signal when discussing GTM viability with stakeholders and early investors.
      </div>
    </div>
    
    <div class="a-card down">
      <div class="a-card-label">↓ Primary Growth Area</div>
      <div class="a-card-score">
        ${dims.length > 0 ? [...dims].sort((a,b) => a.score - b.score)[0].score : "0"}
      </div>
      <div class="a-card-dim">
        ${dims.length > 0 ? [...dims].sort((a,b) => a.score - b.score)[0].name : ""}
      </div>
      <div class="a-card-desc">
        The clearest lever for raising your overall score. Focusing immediate GTM effort here will yield the fastest risk reduction in your venture model.
      </div>
    </div>
  </div>

  <h3 style="font-size:13px; text-transform:uppercase; color:var(--b900); margin-bottom:3mm; border-bottom:1px solid var(--border); padding-bottom:1.5mm;">Venture Score vs Benchmark</h3>
  <div style="display:flex; flex-direction:column; gap:3mm;">
    ${dims.map(d => {
      const b = (d.key === "marketSize" || d.key === "audienceQuality" || d.key === "sectorFit" ? 60 : d.key === "competitionEdge" || d.key === "revenuePotential" ? 55 : 50);
      const diff = d.score - b;
      const diffStr = diff >= 0 ? `+${diff}` : `${diff}`;
      return `
        <div class="spread-row">
          <div class="spread-label">${d.name}</div>
          <div class="spread-track">
            <div class="spread-fill" style="width:${d.score}%; background:${dimColor(d.score)};"></div>
          </div>
          <div class="spread-val" style="color:${diff >= 0 ? '#10b981' : '#f43f5e'}">${diffStr}</div>
        </div>
      `;
    }).join("")}
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 8: MODERATE DIMENSIONS -->
<div class="page">
  ${pageHeader("08", TOTAL)}
  <div class="eyebrow">Section Four</div>
  <div class="pg-title">A Closer Look at Your Moderate Dimensions</div>
  <div class="pg-sub">Moderate dimensions scoring between 50 and 69 are your most sensitive swing dimensions.</div>
  
  <div style="display:flex; flex-direction:column; gap:4mm; margin-top:4mm; margin-bottom:4mm;">
    ${(() => {
      const moderateDims = dims.filter(d => d.score >= 50 && d.score < 70);
      if (moderateDims.length === 0) {
        return `<div style="font-size:12px; color:var(--inkL); padding:10mm; text-align:center; background:var(--b50); border-radius:8px;">No moderate dimensions to display — all dimensions are either strong (>=70) or need work (<50).</div>`;
      }
      return moderateDims.map(d => `
        <div class="mod-card" style="margin-bottom:0;">
          <div class="mod-card-hdr">
            <div class="mod-card-name">${d.name}</div>
            <div class="mod-card-score">${d.score} / 100</div>
          </div>
          <p class="body" style="margin-bottom:2mm;">${d.description}</p>
          <div style="font-size:11px; line-height:1.6; color:#475569; font-style:italic;">
            <strong>Suggested Action:</strong> ${d.recommendation}
          </div>
        </div>
      `).join("");
    })()}
  </div>
  
  <div style="background:#eff6ff; border-left:3px solid var(--b500); padding:3.5mm 4mm; border-radius:4px; font-size:11.5px; line-height:1.6; color:var(--b900);">
    <strong>Note:</strong> Moderate dimensions represent high-potential opportunities. They require relatively low barrier-to-entry shifts in execution or model parameters to convert into full-fledged strategic strengths.
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 9: RADAR & POSITIONING -->
<div class="page">
  ${pageHeader("09", TOTAL)}
  <div class="eyebrow">Section Five</div>
  <div class="pg-title">Venture Profile &amp; Competitor Radar</div>
  <div class="pg-sub">Your dimension scorecard mapped alongside your market positioning context.</div>
  
  <div class="radar-flex">
    ${(() => {
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
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      const pointsStr = pointsArr.join(" ");

      const benchmarks = [60, 60, 55, 55, 50, 60];
      const benchPointsArr = benchmarks.map((bench, i) => {
        const r = (bench / 100) * r_max;
        const x = cx + r * Math.cos(angles[i]);
        const y = cy + r * Math.sin(angles[i]);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      });
      const benchPointsStr = benchPointsArr.join(" ");

      return `
        <svg width="250" height="250" viewBox="0 0 290 270" style="flex-shrink:0;">
          <polygon points="145,40 227,87 227,183 145,230 63,183 63,87" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <polygon points="145,87.5 186,111 186,159 145,182.5 104,159 104,111" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <line x1="145" y1="135" x2="145" y2="40" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="227" y2="87" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="227" y2="183" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="145" y2="230" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="63" y2="183" stroke="#e2e8f0"/>
          <line x1="145" y1="135" x2="63" y2="87" stroke="#e2e8f0"/>
          <polygon points="${benchPointsStr}" fill="none" stroke="#9bb0c9" stroke-width="1.5" stroke-dasharray="3 3"/>
          <polygon points="${pointsStr}" fill="rgba(26,86,219,0.18)" stroke="#1a56db" stroke-width="2.5"/>
          <text x="145" y="32" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">Market Size</text>
          <text x="234" y="84" text-anchor="start" font-size="9" font-weight="700" fill="#0f172a">Audience</text>
          <text x="234" y="188" text-anchor="start" font-size="9" font-weight="700" fill="#0f172a">Competition</text>
          <text x="145" y="244" text-anchor="middle" font-size="9" font-weight="700" fill="#0f172a">Revenue</text>
          <text x="56" y="188" text-anchor="end" font-size="9" font-weight="700" fill="#0f172a">Risk Profile</text>
          <text x="56" y="84" text-anchor="end" font-size="9" font-weight="700" fill="#0f172a">Sector Fit</text>
        </svg>
      `;
    })()}

    <div style="flex:1;">
      <div class="archetype-box" style="margin-bottom:4mm; padding:4mm; border-left:3px solid var(--b500);">
        <div class="lbl">Market Archetype</div>
        <div class="archetype-name" style="font-size:18px;">
          ${score >= 70 ? "High-Potential Disruptor" : score >= 50 ? "Steady Competitor" : "Emerging Innovator"}
        </div>
        <!-- Note: Dashboard does not compute a specific venture archetype. Placed computed category fallback in code comment as required. -->
      </div>
      <div style="display:flex; flex-direction:column; gap:2mm;">
        ${dims.map(d => `
          <div class="dim-list-row" style="margin-bottom:0;">
            <div style="display:flex; align-items:center; gap:2mm;">
              <div class="dot" style="background:${dimColor(d.score)};"></div>
              <span style="font-weight:600; color:var(--ink);">${d.name}</span>
            </div>
            <div class="val">${d.score}</div>
          </div>
        `).join("")}
      </div>
    </div>
  </div>
  
  <div style="padding:4mm; background:var(--b50); border-radius:8px; margin-top:4mm; border:1px solid var(--border);">
    <div style="font-weight:700; font-size:12.5px; color:var(--b900); margin-bottom:1.5mm;">Moat Moat moats &amp; Competitive Positioning</div>
    <div style="font-size:11.5px; line-height:1.6; color:#475569;">${result?.popups?.radar || "Radar context details not available."}</div>
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 10: ACTION PLAN -->
<div class="page">
  ${pageHeader("10", TOTAL)}
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
          ${insights.slice(0, 4).map(x => `
            <div style="display:flex; gap:2mm;">
              <div style="width:1.5mm; height:1.5mm; border-radius:50%; background:var(--b500); flex-shrink:0; margin-top:1.5mm;"></div>
              <div>${x}</div>
            </div>
          `).join("")}
        </div>
      </div>
      
      <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; flex:1; display:flex; flex-direction:column;">
        <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm; border-bottom:1px solid rgba(17,68,160,0.1); padding-bottom:1mm; display:flex; align-items:center; gap:2mm;">
          ⚡ Critical Risks
        </div>
        <div style="font-size:11px; color:#475569; display:flex; flex-direction:column; gap:2mm;">
          ${risks.slice(0, 3).map(x => `
            <div style="display:flex; gap:2mm;">
              <div style="width:1.5mm; height:1.5mm; border-radius:50%; background:#f43f5e; flex-shrink:0; margin-top:1.5mm;"></div>
              <div>${x}</div>
            </div>
          `).join("")}
        </div>
      </div>
    </div>
    
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; display:flex; flex-direction:column;">
      <div style="font-weight:700; font-size:13px; color:var(--b900); margin-bottom:2mm; border-bottom:1px solid rgba(17,68,160,0.1); padding-bottom:1mm; display:flex; align-items:center; gap:2mm;">
        🚀 90-Day Quick Wins
      </div>
      <div style="font-size:11px; color:#475569; display:flex; flex-direction:column; gap:3mm; flex:1; justify-content:center;">
        ${wins.slice(0, 3).map(x => `
          <div style="display:flex; gap:2.5mm; align-items:flex-start;">
            <div style="width:2mm; height:2mm; border-radius:50%; background:#10b981; flex-shrink:0; margin-top:1.5mm;"></div>
            <div>${x}</div>
          </div>
        `).join("")}
      </div>
    </div>
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 11: FINANCIAL SIZE -->
<div class="page">
  ${pageHeader("11", TOTAL)}
  <div class="eyebrow">Section Seven</div>
  <div class="pg-title">Financial Opportunity &amp; Sizing</div>
  <div class="pg-sub">Target market potential sizing and live charts snapshot.</div>
  
  <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:4mm; margin-top:4mm; margin-bottom:5mm;">
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">₹${Math.round(tam)}Cr</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">TAM</div>
    </div>
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">₹${Math.round(sam)}Cr</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">SAM</div>
    </div>
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">₹${Math.round(som)}Cr</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">SOM</div>
    </div>
    <div style="background:var(--b50); padding:3.5mm; border-radius:6px; text-align:center;">
      <div style="font-family:'IBM Plex Mono',monospace; font-size:18px; font-weight:700; color:var(--b900);">${cagr}%</div>
      <div style="font-size:9.5px; text-transform:uppercase; color:var(--inkL); margin-top:1mm;">CAGR</div>
    </div>
  </div>

  <div style="flex:1; display:flex; justify-content:center; align-items:center; background:#f8fafc; border:1px solid var(--border); border-radius:8px; overflow:hidden; position:relative; min-height:100mm;">
    ${chartImageSrc 
      ? `<img src="${chartImageSrc}" style="width:100%; height:100%; object-fit:contain; max-height:100mm;" alt="Market Charts"/>`
      : `<div style="font-size:12px; color:var(--inkL);">Charts snapshot image capture (html2canvas) placeholder.</div>`
    }
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 12: GTM PROJECTIONS -->
<div class="page">
  ${pageHeader("12", TOTAL)}
  <div class="eyebrow">Section Eight</div>
  <div class="pg-title">Go-To-Market &amp; Projections</div>
  <div class="pg-sub">Regional revenue breakdown, prioritize cities, and expected growth trajectory.</div>
  
  <div style="display:flex; flex-direction:column; gap:4mm; margin-top:4mm; flex:1;">
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; background:#fff8f5; border-color:#ffe8e0;">
      <div style="font-weight:700; font-size:13px; color:#c2410c; margin-bottom:1.5mm;">Priority Markets &amp; Rationale</div>
      <div style="font-size:11.5px; line-height:1.6; color:#475569;">${result?.popups?.revregion || "Regional priority breakdown details not available."}</div>
    </div>

    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; background:#f0fdf4; border-color:#bbf7d0;">
      <div style="font-weight:700; font-size:13px; color:#15803d; margin-bottom:1.5mm;">Revenue Trajectory &amp; Growth Outlook</div>
      <div style="font-size:11.5px; line-height:1.6; color:#374151;">${result?.popups?.trend || "Growth trend context details not available."}</div>
    </div>
    
    <div style="border:1px solid var(--border); border-radius:8px; padding:4mm; background:#f0fdfa; border-color:#ccfbf1;">
      <div style="font-weight:700; font-size:13px; color:#0f766e; margin-bottom:1.5mm;">Geographic Focus Strategy</div>
      <div style="font-size:11.5px; line-height:1.6; color:#374151;">${result?.popups?.geomap || "Geomap strategy details not available."}</div>
    </div>
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 13: TRACKING PROGRESS -->
<div class="page">
  ${pageHeader("13", TOTAL)}
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
  ${pageFooter()}
</div>

<!-- PAGE 14: DISCLAIMER -->
<div class="page">
  ${pageHeader("14", TOTAL)}
  <div class="eyebrow">Section Ten</div>
  <div class="pg-title">Disclaimer, Privacy &amp; Terms</div>
  <div class="pg-sub">Legal guidelines, data security rules, and terms of use for this diagnostic tool.</div>
  
  <div style="font-size:11px; line-height:1.65; color:var(--ink); display:flex; flex-direction:column; gap:4mm; margin-top:4mm; flex:1;">
    <p><strong>General Disclaimer:</strong> This diagnostic tool is designed to provide directional insights based on input answers and AI evaluation benchmarks. It does not constitute formal legal, financial, or investment advice. Infopace Management Pvt. Ltd. makes no warranties regarding the accuracy or market outcome of these forecasts.</p>
    <p><strong>Privacy Policy:</strong> Your submission data, organizational answers, and final dashboard scores are stored securely using Supabase encryption protocols. Personal information will never be shared, sold, or distributed to third parties without your explicit consent.</p>
    <p><strong>Terms of Use:</strong> This report is licensed solely for the internal strategic planning of the evaluated organization. Unauthorized reproduction, resale, or distribution of this report or the underlying diagnostic frameworks is strictly prohibited.</p>
  </div>
  ${pageFooter()}
</div>

<!-- PAGE 15: ABOUT INFOPACE -->
<div class="page">
  ${pageHeader("15", TOTAL)}
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
  ${pageFooter()}
</div>

<!-- PAGE 16: CONTACT BACK COVER -->
<div class="wp-page" style="display:flex; flex-direction:column; justify-content:space-between; min-height:297mm; border:1px solid var(--border);">
  <div style="position:relative; z-index:2; padding:12mm 16mm 0; display:flex; justify-content:space-between; align-items:center;">
    <img src="${LOGO_B64}" alt="Infopace" style="height:56px;"/>
    <div style="font-family:'IBM Plex Mono',monospace; font-size:11.5px; color:#94a3b8;">16 / 16</div>
  </div>
  
  <div style="position:relative; height:75mm; overflow:hidden; margin-bottom:20mm;">
    ${SVG_WAVES}
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
</html>`;

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
