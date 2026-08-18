// src/lib/exportPdf.js
/**
 * exportPdf — Multi-page A4 report using the CII Report layout.
 * Pages 1-17: Identical in styling, margins, headers, footers, and layout to the master template.
 * Uses dynamic inline SVGs for vector-sharp visual excellence on export.
 */

const LOGO_B64 = "data:image/png;base64,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";

const SVG_WAVES = `<svg width="760" height="480" viewBox="0 0 760 480"><path d="M 0 350 C 150 300, 250 450, 400 350 C 550 250, 650 400, 760 300 L 760 480 L 0 480 Z" fill="rgba(26, 86, 219, 0.05)"/></svg>`;

const SVG_WAVES_FULL = `<svg width="100%" height="100%" viewBox="0 0 760 480" preserveAspectRatio="none"><defs><linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a56db" stop-opacity="0.2" /><stop offset="100%" stop-color="#93c5fd" stop-opacity="0.02" /></linearGradient></defs><path d="M0,280 C200,380 450,180 760,280 L760,480 L0,480 Z" fill="url(#waveGrad)"/><path d="M0,320 C180,420 400,220 760,340 L760,480 L0,480 Z" fill="#eff6ff" fill-opacity="0.6"/><path d="M0,250 C220,320 480,240 760,220 L760,480 L0,480 Z" fill="none" stroke="#1a56db" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="5 5"/></svg>`;

function dimColor(score) {
  if (score >= 75) return "#10b981";
  if (score >= 50) return "#1a56db";
  if (score >= 35) return "#f97316";
  return "#f43f5e";
}

function renderScoreGauge(score) {
  const clamped = Math.min(Math.max(score || 0, 0), 100);
  const r = 100, cx = 130, cy = 130;
  const angleRad = Math.PI * (1 - clamped / 100);
  const x = cx + r * Math.cos(angleRad);
  const y = cy - r * Math.sin(angleRad);
  const color = dimColor(clamped);
  return `
    <svg width="260" height="150" viewBox="0 0 260 150" style="display:block; margin:0 auto;">
      <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round"/>
      <path d="M 30 130 A 100 100 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)}" fill="none" stroke="${color}" stroke-width="18" stroke-linecap="round"/>
      <text x="130" y="108" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="48" font-weight="700" fill="#061228">${clamped}</text>
      <text x="130" y="130" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10" fill="#64748b" letter-spacing=".1em">MPI SCORE / 100</text>
    </svg>
  `;
}

function renderFunnel(tam, sam, som) {
  return `
    <svg width="100%" height="260" viewBox="0 0 500 260" style="display:block; margin:auto;">
      <polygon points="50,20 450,20 380,90 120,90" fill="#061228" fill-opacity="0.95" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="55" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="12" font-weight="700">TAM: ₹${Math.round(tam)} Cr</text>
      <polygon points="125,95 375,95 320,165 180,165" fill="#1a56db" fill-opacity="0.9" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="130" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="12" font-weight="700">SAM: ₹${Math.round(sam)} Cr</text>
      <polygon points="185,170 315,170 270,240 230,240" fill="#93c5fd" fill-opacity="0.85" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="205" text-anchor="middle" fill="#0d2040" font-family="'Inter',sans-serif" font-size="12" font-weight="700">SOM: ₹${Math.round(som)} Cr</text>
    </svg>
  `;
}


function renderRadar(dimensions) {
  const cx = 140, cy = 130, r_max = 95;
  const angles = [
    -Math.PI / 2,
    -Math.PI / 2 + Math.PI / 3,
    -Math.PI / 2 + 2 * Math.PI / 3,
    -Math.PI / 2 + Math.PI,
    -Math.PI / 2 + 4 * Math.PI / 3,
    -Math.PI / 2 + 5 * Math.PI / 3
  ];
  const values = [
    dimensions.marketSize || 0,
    dimensions.audienceQuality || 0,
    dimensions.competitionEdge || 0,
    dimensions.revenuePotential || 0,
    dimensions.riskProfile || 0,
    dimensions.sectorFit || 0
  ];
  const pointsArr = values.map((val, i) => {
    const r = (val / 100) * r_max;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pointsStr = pointsArr.join(" ");
  const benchPointsArr = [60, 60, 55, 55, 50, 60].map((bench, i) => {
    const r = (bench / 100) * r_max;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const benchPointsStr = benchPointsArr.join(" ");
  return `
    <svg width="280" height="260" viewBox="0 0 280 260" style="display:block; margin:auto; flex-shrink:0;">
      <polygon points="140,35 222,82 222,178 140,225 58,178 58,82" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      <polygon points="140,82.5 181,106 181,154 140,177.5 99,154 99,106" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="140" y1="130" x2="140" y2="35" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="222" y2="82" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="222" y2="178" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="140" y2="225" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="58" y2="178" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="58" y2="82" stroke="#e2e8f0"/>
      <polygon points="${benchPointsStr}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <polygon points="${pointsStr}" fill="rgba(26,86,219,0.18)" stroke="#1a56db" stroke-width="2.5"/>
      <text x="140" y="25" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Market Size</text>
      <text x="228" y="78" text-anchor="start" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Audience</text>
      <text x="228" y="184" text-anchor="start" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Competition</text>
      <text x="140" y="240" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Revenue</text>
      <text x="52" y="184" text-anchor="end" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Risk Profile</text>
      <text x="52" y="78" text-anchor="end" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Sector Fit</text>
    </svg>
  `;
}

function renderDemandBars(dimensions) {
  const problem = Math.min(Math.round(dimensions.sectorFit * 1.05), 100);
  const urgency = Math.min(Math.round(dimensions.audienceQuality * 0.95), 100);
  const wtp = Math.min(Math.round(dimensions.revenuePotential * 1.02), 100);
  const values = [problem, urgency, wtp];
  const labels = ["Problem Severity", "Customer Urgency", "Willingness to Pay"];
  const benchmarks = [55, 60, 50];
  return `
    <svg width="100%" height="220" viewBox="0 0 500 220" style="display:block; margin:auto;">
      <line x1="160" y1="20" x2="160" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="160" y1="180" x2="480" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      ${[25, 50, 75, 100].map(val => {
        const x = 160 + (val / 100) * 300;
        return `<line x1="${x}" y1="20" x2="${x}" y2="180" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2 2"/>
                <text x="${x}" y="195" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="9" fill="#94a3b8">${val}%</text>`;
      }).join("")}
      ${values.map((v, i) => {
        const yBar = 35 + i * 48;
        const wBar = (v / 100) * 300;
        const wBench = (benchmarks[i] / 100) * 300;
        return `<text x="150" y="${yBar + 12}" text-anchor="end" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#0f172a">${labels[i]}</text>
                <rect x="160" y="${yBar}" width="${wBench}" height="18" fill="#e2e8f0" rx="3"/>
                <rect x="160" y="${yBar + 3}" width="${wBar}" height="12" fill="${dimColor(v)}" rx="2"/>
                <text x="${168 + wBar}" y="${yBar + 13}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="${dimColor(v)}">${v}%</text>`;
      }).join("")}
    </svg>
  `;
}


function renderCompMatrix(profiles, org) {
  const comps = profiles || [];
  const points = [
    { name: comps[0]?.name || "Competitor A", x: 75, y: 35, color: "#94a3b8" },
    { name: comps[1]?.name || "Competitor B", x: 60, y: 55, color: "#64748b" },
    { name: comps[2]?.name || "Competitor C", x: 40, y: 70, color: "#475569" },
    { name: org || "Your Opportunity", x: 30, y: 85, color: "#1a56db", isUser: true }
  ];
  return `
    <svg width="100%" height="260" viewBox="0 0 500 260" style="display:block; margin:auto;">
      <rect x="60" y="20" width="200" height="100" fill="#eff6ff" fill-opacity="0.3" stroke="none"/>
      <rect x="260" y="20" width="200" height="100" fill="#f0fdf4" fill-opacity="0.3" stroke="none"/>
      <rect x="60" y="120" width="200" height="100" fill="#fff5f5" fill-opacity="0.3" stroke="none"/>
      <rect x="260" y="120" width="200" height="100" fill="#fffbeb" fill-opacity="0.3" stroke="none"/>
      <line x1="60" y1="20" x2="60" y2="220" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="60" y1="220" x2="460" y2="220" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="260" y1="20" x2="260" y2="220" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3 3"/>
      <line x1="60" y1="120" x2="460" y2="120" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="3 3"/>
      <text x="260" y="238" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11" font-weight="700" fill="#64748b">Market Strength →</text>
      <text x="25" y="120" text-anchor="middle" font-family="'Inter',sans-serif" font-size="11" font-weight="700" fill="#64748b" transform="rotate(-90 25 120)">Differentiation →</text>
      ${points.map(p => {
        const cx = 60 + (p.x / 100) * 400;
        const cy = 220 - (p.y / 100) * 200;
        if (p.isUser) {
          return `<circle cx="${cx}" cy="${cy}" r="9" fill="#1a56db" stroke="#bfdbfe" stroke-width="3"/>
                  <circle cx="${cx}" cy="${cy}" r="3" fill="#ffffff"/>
                  <text x="${cx}" y="${cy - 14}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10.5" font-weight="800" fill="#1a56db">${p.name}</text>`;
        } else {
          return `<circle cx="${cx}" cy="${cy}" r="6" fill="${p.color}" stroke="#ffffff" stroke-width="1.5"/>
                  <text x="${cx}" y="${cy + 15}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9.5" font-weight="600" fill="#475569">${p.name}</text>`;
        }
      }).join("")}
    </svg>
  `;
}

function renderRegionalBars(revenueByRegion) {
  const labels = revenueByRegion?.labels || ["Bengaluru", "Hyderabad", "Pune", "Chennai", "Mumbai"];
  const targets = revenueByRegion?.ourTarget || [85, 75, 68, 62, 58];
  const maxVal = Math.max(...targets, 100);
  return `
    <svg width="100%" height="200" viewBox="0 0 500 200" style="display:block; margin:auto;">
      ${labels.slice(0, 5).map((lbl, i) => {
        const y = 20 + i * 36;
        const val = targets[i] || 0;
        const barWidth = (val / maxVal) * 330;
        return `<text x="110" y="${y + 12}" text-anchor="end" font-family="'Inter',sans-serif" font-size="11" font-weight="700" fill="#0f172a">${lbl}</text>
                <rect x="120" y="${y}" width="330" height="15" fill="#eff6ff" rx="3"/>
                <rect x="120" y="${y}" width="${barWidth}" height="15" fill="#1a56db" rx="3"/>
                <text x="${128 + barWidth}" y="${y + 12}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="#1a56db">₹${val}Cr</text>`;
      }).join("")}
    </svg>
  `;
}

function renderRiskHeatmap() {
  const riskItems = [
    { name: "Competitive Response", p: 4, i: 4 },
    { name: "CAC Inflation", p: 3, i: 4 },
    { name: "Market Education", p: 4, i: 3 },
    { name: "Adoption Friction", p: 3, i: 3 },
    { name: "Regulatory Changes", p: 2, i: 5 }
  ];
  return `
    <svg width="100%" height="260" viewBox="0 0 500 260" style="display:block; margin:auto;">
      <rect x="60" y="140" width="180" height="80" fill="#f0fdf4" stroke="none"/>
      <rect x="240" y="140" width="180" height="80" fill="#fffbeb" stroke="none"/>
      <rect x="60" y="60" width="180" height="80" fill="#fffbeb" stroke="none"/>
      <rect x="240" y="60" width="180" height="80" fill="#fff5f5" stroke="none"/>
      <line x1="60" y1="60" x2="60" y2="220" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="60" y1="220" x2="420" y2="220" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="240" y1="60" x2="240" y2="220" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2 2"/>
      <line x1="60" y1="140" x2="420" y2="140" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2 2"/>
      <text x="240" y="238" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#64748b">Probability (Low → High)</text>
      <text x="25" y="140" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#64748b" transform="rotate(-90 25 140)">Impact (Low → High)</text>
      ${riskItems.map((r, idx) => {
        const cx = 60 + ((r.p - 1) / 4) * 360;
        const cy = 220 - ((r.i - 1) / 4) * 160;
        return `<circle cx="${cx}" cy="${cy}" r="7" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5"/>
                <text x="${cx}" y="${cy - 12}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#9f1239">${idx + 1}. ${r.name}</text>`;
      }).join("")}
    </svg>
  `;
}


function renderReadinessDashboard(dimensions) {
  const readiness = [
    { name: "Market Readiness", score: dimensions.marketSize || 0, color: "#1a56db" },
    { name: "Product Readiness", score: Math.round(((dimensions.sectorFit || 0) + (dimensions.revenuePotential || 0)) / 2), color: "#10b981" },
    { name: "Commercial Readiness", score: dimensions.revenuePotential || 0, color: "#06b6d4" },
    { name: "Competitive Readiness", score: dimensions.competitionEdge || 0, color: "#a21caf" },
    { name: "Scale Readiness", score: Math.round(((dimensions.marketSize || 0) + (dimensions.audienceQuality || 0)) / 2), color: "#f97316" }
  ];
  return `
    <svg width="100%" height="220" viewBox="0 0 500 220" style="display:block; margin:auto;">
      ${readiness.map((r, i) => {
        const y = 15 + i * 38;
        const barWidth = (r.score / 100) * 300;
        return `<text x="140" y="${y + 13}" text-anchor="end" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#0f172a">${r.name}</text>
                <rect x="150" y="${y}" width="300" height="15" fill="#eff6ff" rx="3"/>
                <rect x="150" y="${y}" width="${barWidth}" height="15" fill="${r.color}" rx="3"/>
                <text x="465" y="${y + 12}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="${r.color}">${r.score}%</text>`;
      }).join("")}
    </svg>
  `;
}

function renderRevenueGraph(somCrore) {
  const som = somCrore || 50;
  const months = ["M1", "M2", "M3", "M4", "M5", "M6", "M7", "M8", "M9", "M10", "M11", "M12"];
  const expected = Array.from({ length: 12 }, (_, idx) => {
    const fraction = (idx + 1) / 12;
    return som * Math.pow(fraction, 1.8);
  });
  const conservative = expected.map(val => val * 0.7);
  const aggressive = expected.map(val => val * 1.4);
  const maxY = som * 1.5;
  const getX = (idx) => 70 + idx * 34;
  const getY = (val) => 180 - (val / maxY) * 150;
  const expPoints = expected.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const consPoints = conservative.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const aggPoints = aggressive.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  return `
    <svg width="100%" height="240" viewBox="0 0 500 240" style="display:block; margin:auto;">
      <line x1="70" y1="20" x2="70" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="70" y1="180" x2="480" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      ${[0.25, 0.5, 0.75, 1.0, 1.25, 1.5].map(ratio => {
        const val = som * ratio;
        const y = getY(val);
        return `<line x1="70" y1="${y}" x2="480" y2="${y}" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="2 2"/>
                <text x="60" y="${y + 3}" text-anchor="end" font-family="'IBM Plex Mono',monospace" font-size="8" fill="#94a3b8">₹${Math.round(val)}Cr</text>`;
      }).join("")}
      ${months.map((m, i) => `<text x="${getX(i)}" y="195" text-anchor="middle" font-family="'Inter',sans-serif" font-size="8.5" fill="#64748b">${m}</text>`).join("")}
      <polyline points="${consPoints}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3 3"/>
      <polyline points="${expPoints}" fill="none" stroke="#1a56db" stroke-width="2.5"/>
      <polyline points="${aggPoints}" fill="none" stroke="#10b981" stroke-width="2"/>
      <circle cx="${getX(11)}" cy="${getY(expected[11])}" r="4" fill="#1a56db"/>
    </svg>
  `;
}

function renderGantt() {
  return `
    <svg width="100%" height="180" viewBox="0 0 500 180" style="display:block; margin:auto;">
      ${Array.from({ length: 12 }, (_, i) => {
        const x = 120 + i * 28;
        return `<line x1="${x}" y1="20" x2="${x}" y2="150" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="2 2"/>
                <text x="${x + 14}" y="15" text-anchor="middle" font-family="'Inter',sans-serif" font-size="8.5" font-weight="700" fill="#64748b">W${i + 1}</text>`;
      }).join("")}
      <line x1="120" y1="20" x2="120" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="120" y1="150" x2="456" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="120" y="32" width="112" height="20" fill="#0d2040" fill-opacity="0.9" rx="4"/>
      <text x="176" y="45" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="9" font-weight="700">Problem Check</text>
      <rect x="232" y="77" width="112" height="20" fill="#1a56db" fill-opacity="0.9" rx="4"/>
      <text x="288" y="90" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="9" font-weight="700">GTM &amp; Campaigns</text>
      <rect x="344" y="122" width="112" height="20" fill="#10b981" fill-opacity="0.9" rx="4"/>
      <text x="400" y="135" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="9" font-weight="700">Channel Scale</text>
    </svg>
  `;
}


function generateDetailedExecSummary(org, sector, geography, score, verdict, tam, growth) {
  return `
    <p class="body">This corporate intelligence assessment offers a granular and multi-dimensional analysis of the venture <b>${org}</b> operating within the high-potential <b>${sector}</b> landscape in <b>${geography}</b>. The evaluation, yielding a Market Potential Index (MPI) score of <b>${score}/100</b>, positions the enterprise as a <b>${score >= 75 ? "High Growth Opportunity" : score >= 70 ? "High Potential Disruptor" : score >= 50 ? "Steady Competitor" : "Emerging Innovator"}</b>. This rating underscores a robust underlying alignment with modern target demographics, counterbalanced by distinct execution hurdles and strategic positioning opportunities characteristic of this specific growth stage.</p>
    <p class="body">Our structural sizing frameworks indicate an addressable opportunity of scale. The broader sector TAM (Total Addressable Market) is evaluated at <b>₹${Math.round(tam)} Crore</b>, exhibiting a strong growth momentum with a CAGR of <b>${growth}%</b>. This market is driven by accelerating structural tailwinds, including digitization of procurement channels, regional expansion of technology-first service layers, and growing customer willingness to pay for premiumized SaaS or product solutions. Consequently, the commercial opportunity represents a solid foundation for early capitalization, provided entry models remain agile.</p>
    <p class="body">Underlying demand dynamics show a promising combination of audience urgency and willingness to pay. A key findings summary identifies that customer acquisition friction points are primarily tied to legacy process adoption rather than budget caps. However, switching barriers from established competitor suites remain moderate to high. The strategic mandate for the venture is to construct immediate, high-differentiation hooks that lower transition complexity. Capitalizing on these initial touchpoints will be the primary catalyst for rapid revenue expansion and market capture.</p>
    <p class="body">From an investment readiness standpoint, the venture demonstrates strong product readiness backed by initial validation indicators. Scale readiness remains highly dependent on establishing capital-efficient distribution channels and mitigating risks associated with customer acquisition cost (CAC) inflation. Prospective financial backers should look to the execution of the 90-day execution roadmap as a core proof-of-concept milestone. Demonstrating steady user acquisition velocity over this phase will confirm the viability of the commercial scaling model and validate the underlying growth assumptions.</p>
  `;
}

function generateFinalVerdict(org, sector, score, som) {
  const isGo = score >= 60;
  return `
    <p class="body">Following a comprehensive, data-driven diagnostic of <b>${org}</b> within the <b>${sector}</b> space, our firm issues a formal <b>${isGo ? "GO (PROCEED WITH TARGETED EXECUTION)" : "PROCEED WITH CAUTION (REASSESS DISTRIBUTION CHANNELS)"}</b> recommendation. Our analytical confidence level stands at <b>${Math.round(score * 0.9 + 10)}%</b>, reflecting the high clarity of local market dynamics and current consumer trends. The venture exhibits sufficient capability to capture its targeted Serviceable Obtainable Market (SOM) of <b>₹${Math.round(som)} Crore</b> within the next three fiscal years, provided that immediate priorities around distribution partnerships and product positioning are met.</p>
    <p class="body">Market timing is highly optimal, driven by immediate macroeconomic shifts and competitor transition phases. To maximize this opportunity, the management team must focus on structural positioning differentiators that neutralize competitor counter-campaigns. The strategic positioning matrix places the venture in a favorable quadrant where customer experience innovation offsets early-stage capital constraints. Investors should closely monitor CAC-to-LTV ratios during the early phases to confirm distribution scalability.</p>
    <p class="body">In conclusion, the combination of a validated problem statement, clear customer urgency, and a substantial target market size justifies immediate commercialization efforts. While risks around CAC inflation and competitor reaction are real, the mitigations outlined in our risk matrix provide a playbook for defensive scaling. Executing on this plan in a disciplined manner will unlock the full value potential of the venture and establish a defensible market position.</p>
  `;
}

function createPage(pageNo, eyebrow, title, sub, content) {
  return `
    <div class="page">
      <div class="pg-hdr">
        <div class="brand">INFOPACE <span>MARKET EVALUATOR</span></div>
        <div class="pg-num">${pageNo} / 17</div>
      </div>
      <div class="eyebrow">${eyebrow}</div>
      <div class="pg-title">${title}</div>
      <div class="pg-sub">${sub}</div>
      <div style="flex:1;">
        ${content}
      </div>
      <div class="pg-ftr">
        <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
        <div>Confidential Assessment Report</div>
      </div>
    </div>
  `;
}


// ── Builds the full 18-page report HTML string (shared by the print-window
// export and the headless PDF-capture export below) ────────────────────────
function buildReportHtml({ userData, answers, result }) {
  const org = userData.organization || "Unnamed Venture";
  const sector = userData.sector || "Not specified";
  const geo = userData.geography || "India";
  const score = result.overallScore || 0;
  const grade = result.grade || "Strong";
  const verdict = result.verdict || "Assessment completed successfully.";
  const dimensions = result.dimensions || { marketSize: 70, audienceQuality: 65, competitionEdge: 60, revenuePotential: 75, riskProfile: 50, sectorFit: 80 };
  const tam = result.tamCrore || 1200;
  const sam = result.samCrore || 350;
  const som = result.somCrore || 75;
  const growth = result.growthRate || 14.5;
  const profiles = result.competitorProfiles || [];
  
  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Infopace Premium Intelligence Report - ${org}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=IBM+Plex+Mono:wght@600;700&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --b900: #061228; --b800: #0d2040; --b700: #0f3460; --b600: #1144a0; --b500: #1a56db;
      --b400: #3b82f6; --b300: #93c5fd; --b200: #bfdbfe; --b100: #dbeafe; --b50:  #eff6ff;
      --surface: #f0f4ff; --border: rgba(17,68,160,0.14); --ink: #1e293b; --inkL: #64748b;
      --green: #10b981; --red: #f43f5e; --orange: #f97316; --purple: #86198f; --cyan: #06b6d4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #e5e9f5; color: var(--ink); -webkit-font-smoothing: antialiased; }
    .mono { font-family: 'IBM Plex Mono', monospace; }
    .serif { font-family: 'Playfair Display', serif; }
    .page { width: 210mm; min-height: 297mm; margin: 20px auto; background: #fff; box-shadow: 0 8px 40px rgba(15, 30, 60, 0.12); position: relative; padding: 15mm 16mm 12mm; display: flex; flex-direction: column; page-break-after: always; }
    .wp-page { width: 210mm; min-height: 297mm; margin: 20px auto; background: #fff; box-shadow: 0 8px 40px rgba(15, 30, 60, 0.12); position: relative; page-break-after: always; overflow: hidden; display: flex; flex-direction: column; }
    .summary-table { width: 100%; border-collapse: collapse; margin: 12mm 0; }
    .summary-table th { text-align: left; font-size: 10px; font-weight: 700; color: var(--inkL); letter-spacing: 0.05em; text-transform: uppercase; padding: 8px 12px; border-bottom: 2px solid var(--b900); }
    .summary-table td { padding: 12px; font-size: 13px; font-weight: 600; color: var(--ink); border-bottom: 1px solid var(--border); }
    .pg-hdr { display: flex; justify-content: space-between; align-items: center; padding-bottom: 9px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
    .brand { font-size: 11.6px; font-weight: 700; letter-spacing: .14em; color: var(--b900); text-transform: uppercase; }
    .brand span { color: var(--b500); }
    .pg-num { font-size: 11px; color: var(--inkL); letter-spacing: .08em; }
    .pg-ftr { margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 9.8px; color: #94a3b8; letter-spacing: .06em; text-transform: uppercase; }
    .eyebrow { font-size: 11.6px; font-weight: 700; letter-spacing: .15em; color: var(--b500); text-transform: uppercase; margin-bottom: 6px; }
    .pg-title { font-size: 28px; font-weight: 800; color: var(--b900); margin-bottom: 4px; line-height: 1.24; }
    .pg-sub { font-size: 12.8px; color: var(--inkL); max-width: 560px; line-height: 1.67; margin-bottom: 18px; }
    h3.sec { font-size: 14px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--b900); margin: 22px 0 10px; padding-top: 14px; border-top: 1px solid var(--border); }
    h3.sec:first-of-type { border-top: none; padding-top: 0; margin-top: 14px; }
    p.body { font-size: 12.5px; line-height: 1.78; color: #334155; margin-bottom: 12px; text-align: justify; }
    p.body b { color: var(--b900); }
    .callout { background: var(--b50); border: 1px solid var(--b200); border-radius: 10px; padding: 13px 16px; font-size: 12.2px; color: #334155; line-height: 1.73; margin: 12px 0; }
    .callout b { color: var(--b900); }
    .callout.insight { background: #fffbeb; border-color: #fde68a; }
    .callout.insight .lbl { color: #b45309; }
    .lbl { font-size: 10.4px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--b500); margin-bottom: 5px; display: block; }
    .stat-row { display: flex; gap: 14px; margin: 14px 0 4px; }
    .stat-box { flex: 1; background: var(--b50); border: 1px solid var(--b200); border-radius: 9px; padding: 10px 12px; text-align: center; }
    .stat-box .n { font-family: 'IBM Plex Mono', monospace; font-size: 23.2px; font-weight: 700; color: var(--b700); }
    .stat-box .l { font-size: 9.8px; color: var(--inkL); text-transform: uppercase; letter-spacing: .05em; margin-top: 2px; }
    .gauge-wrap { display: flex; align-items: center; gap: 30px; margin: 10px 0; }
    .tag-pill { display: inline-block; background: var(--b100); color: var(--b700); font-size: 12.2px; font-weight: 700; padding: 4px 13px; border-radius: 16px; margin-bottom: 6px; }
    .persona-name { font-size: 21px; font-weight: 800; color: var(--b900); font-family: 'Playfair Display', serif; }
    .dim-block { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .dim-block:last-child { border-bottom: none; }
    .dim-score-col { width: 66px; flex-shrink: 0; text-align: center; }
    .dim-score-col .n { font-family: 'IBM Plex Mono', monospace; font-size: 25.5px; font-weight: 700; }
    .dim-score-col .band { font-size: 8.7px; text-transform: uppercase; letter-spacing: .04em; color: var(--inkL); margin-top: 1px; }
    .dim-body { flex: 1; }
    .dim-name { font-size: 14px; font-weight: 700; color: var(--b900); margin-bottom: 2px; }
    .dim-desc { font-size: 11.6px; color: var(--inkL); line-height: 1.67; }
    .dim-tell { font-size: 11px; color: #475569; line-height: 1.67; margin-top: 3px; padding-left: 10px; border-left: 2px solid var(--b100); }
    .glance-table { width: 100%; border-collapse: collapse; margin: 10px 0 4px; }
    .glance-table td { padding: 8px; font-size: 11.5px; border-bottom: 1px solid var(--border); }
    .glance-table .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 7px; }
    .glance-table .nm { font-weight: 600; color: var(--b900); }
    .glance-table .sc { font-family: 'IBM Plex Mono', monospace; font-weight: 700; text-align: right; }
    .seq-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    .seq-table th { text-align: left; font-size: 9.6px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--inkL); padding: 6px 8px; border-bottom: 1.5px solid var(--b900); }
    .seq-table td { padding: 8px; font-size: 11.5px; border-bottom: 1px solid var(--border); vertical-align: top; }
    .seq-table .stage-num { font-family: 'IBM Plex Mono', monospace; font-weight: 700; color: var(--b500); font-size: 12.5px; }
    .print-btn { position: fixed; bottom: 24px; right: 24px; background: var(--b900); color: #fff; border: none; border-radius: 8px; padding: 12px 24px; font-size: 13px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 16px rgba(15, 30, 60, .25); z-index: 9999; transition: all 0.2s ease; }
    .print-btn:hover { background: var(--b500); }
    @media print {
      body { background: #fff; }
      .page { margin: 0; box-shadow: none; border: none; page-break-after: always; }
      .wp-page { margin: 0; box-shadow: none; border: none; page-break-after: always; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>
<div style="font-family:'Inter',sans-serif; color:#1e293b; background:#e5e9f5; padding:20px 0;">

  <!-- PAGE 1: COVER -->
  <div class="wp-page" style="border:1px solid var(--border); display:flex; flex-direction:column; min-height:297mm; background:#fff;">
    <div style="padding:14mm 16mm 0;">
      <img src="${LOGO_B64}" alt="Infopace" style="height:56px;"/>
    </div>
    <div style="padding:14mm 16mm 0; position:relative; z-index:2;">
      <div class="mono" style="font-size:11.5px; letter-spacing:.2em; text-transform:uppercase; color:#1a56db; font-weight:600; margin-bottom:6mm;">Market Potential Intelligence · Premium Edition</div>
      <div style="font-weight:800; font-size:60px; line-height:1.08; color:#061228; letter-spacing:-.01em;">Market</div>
      <div style="font-weight:800; font-size:60px; line-height:1.08; color:#1a56db; letter-spacing:-.01em;">Potential</div>
      <div style="font-weight:800; font-size:60px; line-height:1.08; color:#061228; letter-spacing:-.01em;">Assessment</div>
      <div style="font-size:13.8px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; color:#334155; margin-top:8mm;">Comprehensive Venture Diagnostic Report</div>
    </div>
    <div style="position:relative; flex:1; height:150mm; margin-top:-4mm;">
      <div style="position:absolute; left:-30px; bottom:0;">
        ${SVG_WAVES}
      </div>
    </div>
    <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; padding:0 16mm 14mm;">
      <div class="mono" style="font-size:10.5px; color:#94a3b8;">
        Venture: ${org}<br/>
        Prepared: ${now} · Version 1.0.0
      </div>
      <div style="font-weight:800; font-size:57.5px; color:#061228; line-height:1.1;">2026</div>
    </div>
  </div>

  <!-- PAGE 2: TABLE OF CONTENTS -->
  <div class="page">
    <div class="pg-hdr"><div class="brand">INFOPACE <span>MARKET EVALUATOR</span></div><div class="pg-num">02 / 17</div></div>
    <div class="eyebrow">Contents</div>
    <div class="pg-title">Table of Contents</div>
    <div class="pg-sub">A structural index of your comprehensive market potential diagnostic assessment.</div>
    <table class="summary-table">
      <thead><tr><th>Section</th><th style="text-align:right;">Page</th></tr></thead>
      <tbody>
        <tr><td>01 / Our Assessment Suite &amp; Diagnostic Foundations</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">03</td></tr>
        <tr><td>02 / Executive Summary &amp; Investment-Grade Verdict</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">04</td></tr>
        <tr><td>03 / Market Potential Overview &amp; Key Dimensions</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">05</td></tr>
        <tr><td>04 / TAM / SAM / SOM Market Sizing &amp; Funnel Analysis</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">06</td></tr>
        <tr><td>05 / Demand Intelligence &amp; Customer Urgency Analysis</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">07</td></tr>
        <tr><td>06 / Market Attractiveness, CAGR &amp; Barriers</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">08</td></tr>
        <tr><td>07 / Competitive Landscape &amp; Positioning Matrix</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">09</td></tr>
        <tr><td>08 / Adoption &amp; Commercial Readiness Diagnosis</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">10</td></tr>
        <tr><td>09 / Regional Opportunity Analysis &amp; City Ranking</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">11</td></tr>
        <tr><td>10 / Risk Intelligence &amp; Impact Heatmap Analysis</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">12</td></tr>
        <tr><td>11 / Investment Readiness Dashboard &amp; Scorecard</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">13</td></tr>
        <tr><td>12 / Go-To-Market &amp; 12-Month Revenue Projections</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">14</td></tr>
        <tr><td>13 / Strategic Positioning &amp; Growth Recommendations</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">15</td></tr>
        <tr><td>14 / 90-Day Execution Roadmap &amp; Gantt Deliverables</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">16</td></tr>
        <tr><td>15 / Final Advisory Go/No-Go Decision Summary</td><td style="text-align:right; font-family:'IBM Plex Mono',monospace; font-weight:600; color:var(--inkL);">17</td></tr>
      </tbody>
    </table>
    <div class="pg-ftr"><div>©2026 Infopace Management Pvt. Ltd.</div><div>Confidential Assessment Report</div></div>
  </div>

  <!-- Pages 3-17 generated programmatically -->
  ${createPage("03", "Introduction", "Our Assessment Suite", "The theoretical foundations and metrics backing our diagnostic systems.", `
    <div style="display:flex; flex-direction:column; gap:6mm; margin-top:5mm;">
      <div style="padding:4mm; background:var(--b50); border-radius:8px; border-left:4px solid var(--b500);">
        <div style="font-weight:700; font-size:14px; color:var(--b900); margin-bottom:1.5mm;">Creative Innovation Index (CII)</div>
        <p class="body" style="font-size:11.8px; margin-bottom:0;">Evaluates organization design capabilities, organizational agility, creative velocity, and internal capability networks to score product validation speed.</p>
      </div>
      <div style="padding:4mm; background:var(--b50); border-radius:8px; border-left:4px solid var(--b500);">
        <div style="font-weight:700; font-size:14px; color:var(--b900); margin-bottom:1.5mm;">Market Potential Index (MPI)</div>
        <p class="body" style="font-size:11.8px; margin-bottom:0;">Measures outside-in market attributes including TAM availability, customer willingness to pay, competitor pricing power, entry regulations, and regional scale headroom.</p>
      </div>
      <div style="padding:4mm; background:var(--b50); border-radius:8px; border-left:4px solid var(--b500);">
        <div style="font-weight:700; font-size:14px; color:var(--b900); margin-bottom:1.5mm;">Product-Market Fit Diagnostic (PMF)</div>
        <p class="body" style="font-size:11.8px; margin-bottom:0;">Calculates conversion velocity, churn metrics, cohort behavior patterns, and structural unit economics to measure product retention and scaling feasibility.</p>
      </div>
    </div>
  `)}

  ${createPage("04", "Section One", "Executive Summary", "An investor-grade assessment summary for the venture's target market performance.", `
    <div class="gauge-wrap" style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderScoreGauge(score)}
      <div>
        <div class="tag-pill" style="background:${dimColor(score)}; color:#ffffff;">${grade} Opportunity</div>
        <div class="persona-name" style="margin-top:2px;">Venture Potential Rating</div>
        <div style="font-size:12px; color:var(--inkL); margin-top:2px; line-height:1.5;">${verdict}</div>
      </div>
    </div>
    <div style="margin-top:6mm;">
      ${generateDetailedExecSummary(org, sector, geo, score, verdict, tam, growth)}
    </div>
  `)}

  ${createPage("05", "Section Two", "Market Potential Overview", "Dimension-by-dimension breakdown of the core assessment scores.", `
    <div style="display:flex; flex-direction:column; gap:4mm; margin-top:3mm;">
      ${[
        { name: "Market Size & Sizing Headroom", score: dimensions.marketSize, desc: "Evaluates the total capital density, potential transaction frequency, and volume scaling possibilities inside the primary region." },
        { name: "Audience Quality & Acquisition Velocity", score: dimensions.audienceQuality, desc: "Calculates target user segmentation clarity, contract size availability, and overall conversion efficiency potential." },
        { name: "Competition Edge & Defensibility", score: dimensions.competitionEdge, desc: "Assesses competitor concentration, technological differentiation requirements, and moat-building capabilities." },
        { name: "Revenue Potential & Monetization Agility", score: dimensions.revenuePotential, desc: "Calculates monetization flexibility (SaaS, contract, transaction fee) against target segment budget willingness." },
        { name: "Sector Fit & Macro-Alignment", score: dimensions.sectorFit, desc: "Evaluates systemic sector tailwinds, regulatory growth, and digital integration trends in the geography." }
      ].map(d => `
        <div class="dim-block">
          <div class="dim-score-col">
            <div class="n" style="color:${dimColor(d.score)}">${d.score}</div>
            <div class="band">Score</div>
          </div>
          <div class="dim-body">
            <div class="dim-name">${d.name}</div>
            <div class="dim-desc">${d.desc}</div>
          </div>
        </div>
      `).join("")}
    </div>
  `)}

  ${createPage("06", "Section Three", "TAM / SAM / SOM Analysis", "Opportunity funnel modeling detailing broader addressable vs realistic capture segments.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderFunnel(tam, sam, som)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Sizing Foundations &amp; Assumptions</h3>
      <p class="body">The top-level Total Addressable Market (TAM) of <b>₹${Math.round(tam)} Crore</b> represents the total global or regional market value for the <b>${sector}</b> sector. The Serviceable Addressable Market (SAM) is computed at <b>₹${Math.round(sam)} Crore</b>, isolating target segments reachable within the primary geographic region. The Serviceable Obtainable Market (SOM) represents a realistic target capitalization value of <b>₹${Math.round(som)} Crore</b> over a 36-month timeline.</p>
    </div>
  `)}

  ${createPage("07", "Section Four", "Demand Intelligence", "Assessing client necessity parameters: problem depth, urgency, and pricing flexibility.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderDemandBars(dimensions)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Demographic Demand Factors</h3>
      <p class="body">Structural metrics suggest that problem severity remains high across target user bases. Businesses and retail consumers exhibit a strong willingness to prioritize solutions that address immediate workflow bottlenecks or cost-containment directives. Our models indicate that customer adoption timelines decrease significantly when initial capital entry requirements are minimized.</p>
    </div>
  `)}

  ${createPage("08", "Section Five", "Market Attractiveness Analysis", "Structural sector metrics, growth projection indicators, and entry barriers.", `
    <div class="stat-row">
      <div class="stat-box"><div class="n">${growth}%</div><div class="l">Expected CAGR</div></div>
      <div class="stat-box"><div class="n">Medium</div><div class="l">Entry Barriers</div></div>
      <div class="stat-box"><div class="n">High</div><div class="l">Attractiveness</div></div>
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Sector Growth Profile</h3>
      <p class="body">The target market in <b>${geo}</b> is characterized by a strong growth momentum, supported by secular digital transformation waves. Transition rates away from legacy workflows are expanding, with the overall sector CAGR projected at a healthy <b>${growth}%</b> over the next five years.</p>
      <div class="callout insight">
        <span class="lbl">Sector Insight Fact</span>
        ${result.realTimeInsight || "Target markets show strong signs of premium pricing validation for high-utility offerings."}
      </div>
    </div>
  `)}

  ${createPage("09", "Section Six", "Competitive Landscape", "Mapping market positioning of major competitors vs the venture's target profile.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderCompMatrix(profiles, org)}
    </div>
    <div style="margin-top:5mm;">
      <h3 class="sec">Competitor Profiling</h3>
      <table class="summary-table" style="margin:2mm 0; font-size:11.5px;">
        <thead>
          <tr><th>Competitor</th><th>Stage</th><th>Core Strength</th><th>Weakness / Gap</th></tr>
        </thead>
        <tbody>
          ${profiles.map(c => `
            <tr>
              <td><b>${c.name}</b></td>
              <td>${c.stage}</td>
              <td style="color:#059669;">${c.strength}</td>
              <td style="color:#be185d;">${c.weakness}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `)}

  ${createPage("10", "Section Seven", "Adoption &amp; Commercial Readiness", "Analyzing transition frictions, behavioral switches, and customer validation readiness.", `
    <div style="display:flex; flex-direction:column; gap:4mm; margin-top:4mm;">
      <div class="dim-block">
        <div class="dim-score-col"><div class="n" style="color:var(--b500);">Low</div><div class="band">Friction</div></div>
        <div class="dim-body">
          <div class="dim-name">Transition Friction &amp; Migration Complexity</div>
          <div class="dim-desc">Measures the overall engineering or onboarding lift required for users to switch to the venture's interface.</div>
        </div>
      </div>
      <div class="dim-block">
        <div class="dim-score-col"><div class="n" style="color:var(--b500);">High</div><div class="band">Readiness</div></div>
        <div class="dim-body">
          <div class="dim-name">Target Demographic Readiness</div>
          <div class="dim-desc">Assesses awareness levels, budget availability, and technological alignment within early adopter groups.</div>
        </div>
      </div>
    </div>
  `)}

  ${createPage("11", "Section Eight", "Regional Opportunity Analysis", "Target city rankings based on regional revenue density and sector growth rates.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderRegionalBars(result.revenueByRegion)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Regional Distribution Priority</h3>
      <p class="body">Our spatial market intelligence models identify <b>${result.revenueByRegion?.labels?.[0] || "Bengaluru"}</b> as the high-priority entry corridor, representing high customer density and strong early willingness to pay.</p>
    </div>
  `)}

  ${createPage("12", "Section Nine", "Risk Intelligence &amp; Heatmap", "Structural risk identification, mapping probability vs severity with targeted mitigations.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderRiskHeatmap()}
    </div>
    <div style="margin-top:4mm;">
      <h3 class="sec">Structural Risk Matrix</h3>
      <table class="summary-table" style="margin:2mm 0; font-size:11.5px;">
        <thead><tr><th>Risk Area</th><th>Probability</th><th>Impact</th><th>Mitigation Strategy</th></tr></thead>
        <tbody>
          <tr><td><b>Competitive Response</b></td><td>High</td><td>High</td><td>Establish proprietary product hooks and long-term contract locks.</td></tr>
          <tr><td><b>CAC Inflation</b></td><td>Medium</td><td>High</td><td>Utilize organic growth loops and content distribution channels.</td></tr>
          <tr><td><b>Regulatory Changes</b></td><td>Low</td><td>High</td><td>Maintain high compliance margins and monitor local policy channels.</td></tr>
        </tbody>
      </table>
    </div>
  `)}

  ${createPage("13", "Section Ten", "Investment Readiness Assessment", "Evaluating the venture across key capital suitability matrices.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderReadinessDashboard(dimensions)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Suitability Analysis Summary</h3>
      <p class="body">The venture presents a strong alignment for early-stage venture funding, scoring particularly high in commercial feasibility indicators. Scaling readiness remains dependent on stabilizing distribution structures.</p>
    </div>
  `)}

  ${createPage("14", "Section Eleven", "Revenue Projection Trajectory", "12-Month scenario-based financial modeling (Conservative vs Expected vs Aggressive).", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderRevenueGraph(som)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Projections Summary</h3>
      <p class="body">The Expected Scenario projects the venture reaching a monthly run-rate scaling toward <b>₹${som} Crore</b> by Month 12, driven by stable channel partnerships and consistent conversion metrics.</p>
    </div>
  `)}

  ${createPage("15", "Section Twelve", "Strategic Recommendations", "Actionable advisory plays across pricing models, acquisition channels, and scalability.", `
    <div style="display:flex; flex-direction:column; gap:4mm; margin-top:2mm;">
      <div style="padding:4mm; background:#fafbfe; border:1px solid var(--border); border-radius:8px;">
        <div style="font-weight:700; font-size:13.5px; color:var(--b900); margin-bottom:1.5mm;">1. Pricing Strategy Optimization</div>
        <p class="body" style="font-size:11.8px; margin-bottom:0; text-align:left;">Transition toward value-based licensing or tiered pricing packages to capture both price-sensitive SMB segments and corporate accounts.</p>
      </div>
      <div style="padding:4mm; background:#fafbfe; border:1px solid var(--border); border-radius:8px;">
        <div style="font-weight:700; font-size:13.5px; color:var(--b900); margin-bottom:1.5mm;">2. Acquisition Channel Scale-Up</div>
        <p class="body" style="font-size:11.8px; margin-bottom:0; text-align:left;">Leverage channel partnerships with industry trade bodies, regional distributors, and digital integration agencies.</p>
      </div>
    </div>
  `)}

  ${createPage("16", "Section Thirteen", "90-Day Execution Roadmap", "Structured milestones mapping immediate tactical tasks, KPIs, and deliverables.", `
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      ${renderGantt()}
    </div>
    <div style="margin-top:4mm;">
      <table class="summary-table" style="margin:2mm 0; font-size:11px;">
        <thead><tr><th>Phase</th><th>Weeks</th><th>Primary Deliverables</th><th>Core KPIs</th></tr></thead>
        <tbody>
          <tr><td><b>1. Validation</b></td><td>Weeks 1-4</td><td>Complete customer pilot agreements; validate pricing points.</td><td>Agreement Sign-offs</td></tr>
          <tr><td><b>2. Launch Campaign</b></td><td>Weeks 5-8</td><td>Launch outbound campaigns; establish distributor channels.</td><td>Lead Velocity Rate</td></tr>
          <tr><td><b>3. Channel Scale</b></td><td>Weeks 9-12</td><td>Refine GTM channels; scale inbound digital loop.</td><td>Retention %</td></tr>
        </tbody>
      </table>
    </div>
  `)}

  <!-- PAGE 17: FINAL RECOMMENDATION -->
  <div class="page">
    <div class="pg-hdr"><div class="brand">INFOPACE <span>MARKET EVALUATOR</span></div><div class="pg-num">17 / 17</div></div>
    <div class="eyebrow">Section Fourteen</div>
    <div class="pg-title">Final Recommendation</div>
    <div class="pg-sub">Firm advisory position and strategic summary decision for venture growth.</div>
    <div style="margin-top:2mm; flex:1;">
      ${generateFinalVerdict(org, sector, score, som)}
    </div>
    <div style="margin-top:auto; padding-top:6mm; border-top:1.5px solid var(--b900);">
      <div style="display:flex; justify-content:space-between; align-items:flex-end;">
        <div>
          <div style="font-weight:800; font-size:13px; color:var(--b900); margin-bottom:1mm;">Infopace Management Pvt. Ltd.</div>
          <div style="font-size:10.5px; color:var(--inkL); line-height:1.4;">Market intelligence diagnostic report.<br/>Advisory services: advisory@infopace.in</div>
        </div>
        <div style="font-family:'IBM Plex Mono',monospace; font-size:11px; font-weight:700; color:var(--b500);">CONFIDENTIAL ASSESSMENT</div>
      </div>
    </div>
  </div>

  <!-- PAGE 18: BACK COVER -->
  <div class="wp-page" style="border:1px solid var(--border); display:flex; flex-direction:column; min-height:297mm; background:#fff;">
    <div style="padding:14mm 16mm 0; display:flex; justify-content:space-between; align-items:center;">
      <img src="${LOGO_B64}" alt="Infopace" style="height:56px;"/>
      <div class="mono" style="font-size:11.5px; color:#94a3b8;">17 / 17</div>
    </div>
    <div style="position:relative; height:75mm; overflow:hidden; margin-top:20mm;">
      ${SVG_WAVES_FULL}
    </div>
    <div style="padding:0 16mm 16mm; position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; flex:1;">
      <div>
        <div style="font-weight:800; font-size:14px; color:var(--b900); margin-bottom:1.5mm;">Infopace Management Pvt. Ltd.</div>
        <div style="font-size:11px; color:var(--inkL); line-height:1.5;">advisory@infopace.in · www.infopace.in<br/>Venture Diagnostics &amp; Market Intelligence</div>
      </div>
      <div style="font-weight:800; font-size:57.5px; color:#061228; line-height:1.1;">2026</div>
    </div>
  </div>
</div>

<button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>

</body>
</html>`;

  return html;
}

// ── User-facing export: opens a print-ready window so the user can Save as PDF ──
export async function exportPdf({ userData, answers, result, iframeEl }) {
  const html = buildReportHtml({ userData, answers, result });

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

// ── Load html2canvas / jsPDF from CDN once (mirrors the loader pattern in
// AssessmentAndDashboard.jsx used for the screenshot capture) ──────────────
function loadScriptOnce(src, checkGlobal) {
  return new Promise((resolve, reject) => {
    if (checkGlobal()) { resolve(checkGlobal()); return; }
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve(checkGlobal());
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function loadHtml2Canvas() {
  return loadScriptOnce(
    "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
    () => window.html2canvas
  );
}

function loadJsPdf() {
  return loadScriptOnce(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
    () => window.jspdf && window.jspdf.jsPDF
  );
}

// ── Rasterizes a list of already-rendered ".page" elements with html2canvas
// and stitches them into a real multi-page A4 PDF with jsPDF. Shared by
// generateLiveReportPdfDataUrl() below. Returns a base64 data URI. ──
async function capturePagesToPdfDataUrl(pageEls, html2canvas, jsPDF) {
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

  for (let i = 0; i < pageEls.length; i++) {
    const canvas = await html2canvas(pageEls[i], {
      useCORS: true,
      allowTaint: true,
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, "JPEG", 0, 0, 210, 297);
  }

  const dataUri = doc.output("datauristring");
  // jsPDF's "datauristring" output embeds a filename segment —
  // "data:application/pdf;filename=generated.pdf;base64,..." — instead of
  // the plain "data:application/pdf;base64,..." format. The backend's
  // upload validation expects the plain format, so every report PDF
  // archive was failing with a 400 "Validation failed" error before this
  // normalization, even though generation itself succeeded.
  return dataUri.replace(/^data:application\/pdf;filename=[^;]*;base64,/, "data:application/pdf;base64,");
}

// ── Archives the ACTUAL live report (dashboard.html's own Report view,
// same-origin) instead of a separate hand-built template. Opens a hidden,
// invisible copy of dashboard.html, drives it directly with this test's
// real fd/analysis (same-origin access — no postMessage round-trip
// needed), and captures whatever it renders — guaranteeing the archived
// PDF is a pixel-for-pixel copy of what the user actually sees. ──
export async function generateLiveReportPdfDataUrl({ fd, analysis }) {
  const [html2canvas, jsPDF] = await Promise.all([loadHtml2Canvas(), loadJsPdf()]);

  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:1400px;height:1000px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  try {
    await new Promise((resolve, reject) => {
      iframe.onload = resolve;
      iframe.onerror = () => reject(new Error("dashboard.html failed to load for archiving"));
      iframe.src = "/dashboard.html?v=1.0.2";
    });

    const win = iframe.contentWindow;
    if (!win || typeof win.renderDash !== "function" || typeof win.switchView !== "function") {
      throw new Error("dashboard.html did not expose renderDash/switchView for archiving");
    }

    // Mirror dashboard.html's own INFOPACE_RENDER handler: fall back to its
    // offline analysis when no real analysis is available, same as the
    // live report does.
    const finalAnalysis = (analysis && typeof analysis === "object" && Object.keys(analysis).length > 0)
      ? analysis
      : win.offlineAnalysis(fd);

    win._unlocked = true; // archive the full report, never the paywall gate
    win.renderDash(fd, finalAnalysis);
    win.switchView("report"); // builds #reportContent via the live buildReport()

    // switchView() leaves #viewReport as position:fixed/height:100vh/
    // overflow-y:auto (the same styling that caused the browser's native
    // print to drop every page beyond the first, fixed earlier with a
    // @media print override). That fix only applies to real print jobs —
    // html2canvas never sees print CSS, so screenshotting individual pages
    // inside this fixed, scroll-clipped box was still silently dropping
    // pages at both ends (html2canvas miscalculates element positions
    // inside a position:fixed ancestor taller than its own viewport).
    // Force the same "normal document flow" override here, directly, so
    // every page has real, un-clipped layout before it's captured.
    const viewReportEl = iframe.contentDocument.getElementById("viewReport");
    if (viewReportEl) {
      viewReportEl.style.position = "static";
      viewReportEl.style.left = "auto";
      viewReportEl.style.top = "auto";
      viewReportEl.style.width = "auto";
      viewReportEl.style.height = "auto";
      viewReportEl.style.overflow = "visible";
    }

    // Let fonts / the base64 logo / layout settle before capturing.
    await new Promise((r) => setTimeout(r, 700));

    const pageEls = iframe.contentDocument.querySelectorAll("#reportContent .page");
    if (!pageEls.length) {
      throw new Error("No report pages found to capture");
    }

    return await capturePagesToPdfDataUrl(pageEls, html2canvas, jsPDF);
  } finally {
    document.body.removeChild(iframe);
  }
}
