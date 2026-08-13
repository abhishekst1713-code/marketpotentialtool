const fs = require('fs');
const path = require('path');

const workspaceRoot = 'c:/Users/ADMIN/Downloads/marketpotentialtool';
const refPath = path.join(workspaceRoot, 'CII_Report_FINAL (1).html');
const destPath = path.join(workspaceRoot, 'src', 'lib', 'exportPdf.js');

const refContent = fs.readFileSync(refPath, 'utf8');
const logoMatch = refContent.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
const logoB64 = logoMatch ? logoMatch[0] : '';

const code = `// src/lib/exportPdf.js
/**
 * exportPdf — Multi-page A4 report using the CII Report layout.
 * Pages 1-17: Identical in styling, margins, headers, footers, and layout to the master template.
 * Uses dynamic inline SVGs for vector-sharp visual excellence on export.
 */

const LOGO_B64 = "${logoB64}";

const SVG_WAVES = \`<svg width="760" height="480" viewBox="0 0 760 480"><path d="M 0 350 C 150 300, 250 450, 400 350 C 550 250, 650 400, 760 300 L 760 480 L 0 480 Z" fill="rgba(26, 86, 219, 0.05)"/></svg>\`;

const SVG_WAVES_FULL = \`<svg width="100%" height="100%" viewBox="0 0 760 480" preserveAspectRatio="none"><defs><linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a56db" stop-opacity="0.2" /><stop offset="100%" stop-color="#93c5fd" stop-opacity="0.02" /></linearGradient></defs><path d="M0,280 C200,380 450,180 760,280 L760,480 L0,480 Z" fill="url(#waveGrad)"/><path d="M0,320 C180,420 400,220 760,340 L760,480 L0,480 Z" fill="#eff6ff" fill-opacity="0.6"/><path d="M0,250 C220,320 480,240 760,220 L760,480 L0,480 Z" fill="none" stroke="#1a56db" stroke-width="1.5" stroke-opacity="0.3" stroke-dasharray="5 5"/></svg>\`;

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
  return \`
    <svg width="260" height="150" viewBox="0 0 260 150" style="display:block; margin:0 auto;">
      <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="#e2e8f0" stroke-width="18" stroke-linecap="round"/>
      <path d="M 30 130 A 100 100 0 0 1 \${x.toFixed(2)} \${y.toFixed(2)}" fill="none" stroke="\${color}" stroke-width="18" stroke-linecap="round"/>
      <text x="130" y="108" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="48" font-weight="700" fill="#061228">\${clamped}</text>
      <text x="130" y="130" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10" fill="#64748b" letter-spacing=".1em">MPI SCORE / 100</text>
    </svg>
  \`;
}

function renderFunnel(tam, sam, som) {
  return \`
    <svg width="100%" height="260" viewBox="0 0 500 260" style="display:block; margin:auto;">
      <polygon points="50,20 450,20 380,90 120,90" fill="#061228" fill-opacity="0.95" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="55" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="12" font-weight="700">TAM: ₹\${Math.round(tam)} Cr</text>
      <polygon points="125,95 375,95 320,165 180,165" fill="#1a56db" fill-opacity="0.9" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="130" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="12" font-weight="700">SAM: ₹\${Math.round(sam)} Cr</text>
      <polygon points="185,170 315,170 270,240 230,240" fill="#93c5fd" fill-opacity="0.85" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="205" text-anchor="middle" fill="#0d2040" font-family="'Inter',sans-serif" font-size="12" font-weight="700">SOM: ₹\${Math.round(som)} Cr</text>
    </svg>
  \`;
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
    return \`\${x.toFixed(1)},\${y.toFixed(1)}\`;
  });
  const pointsStr = pointsArr.join(" ");
  const benchPointsArr = [60, 60, 55, 55, 50, 60].map((bench, i) => {
    const r = (bench / 100) * r_max;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return \`\${x.toFixed(1)},\${y.toFixed(1)}\`;
  });
  const benchPointsStr = benchPointsArr.join(" ");
  return \`
    <svg width="280" height="260" viewBox="0 0 280 260" style="display:block; margin:auto; flex-shrink:0;">
      <polygon points="140,35 222,82 222,178 140,225 58,178 58,82" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      <polygon points="140,82.5 181,106 181,154 140,177.5 99,154 99,106" fill="none" stroke="#e2e8f0" stroke-width="1"/>
      <line x1="140" y1="130" x2="140" y2="35" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="222" y2="82" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="222" y2="178" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="140" y2="225" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="58" y2="178" stroke="#e2e8f0"/>
      <line x1="140" y1="130" x2="58" y2="82" stroke="#e2e8f0"/>
      <polygon points="\${benchPointsStr}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <polygon points="\${pointsStr}" fill="rgba(26,86,219,0.18)" stroke="#1a56db" stroke-width="2.5"/>
      <text x="140" y="25" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Market Size</text>
      <text x="228" y="78" text-anchor="start" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Audience</text>
      <text x="228" y="184" text-anchor="start" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Competition</text>
      <text x="140" y="240" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Revenue</text>
      <text x="52" y="184" text-anchor="end" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Risk Profile</text>
      <text x="52" y="78" text-anchor="end" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#0f172a">Sector Fit</text>
    </svg>
  \`;
}

function renderDemandBars(dimensions) {
  const problem = Math.min(Math.round(dimensions.sectorFit * 1.05), 100);
  const urgency = Math.min(Math.round(dimensions.audienceQuality * 0.95), 100);
  const wtp = Math.min(Math.round(dimensions.revenuePotential * 1.02), 100);
  const values = [problem, urgency, wtp];
  const labels = ["Problem Severity", "Customer Urgency", "Willingness to Pay"];
  const benchmarks = [55, 60, 50];
  return \`
    <svg width="100%" height="220" viewBox="0 0 500 220" style="display:block; margin:auto;">
      <line x1="160" y1="20" x2="160" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="160" y1="180" x2="480" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      \${[25, 50, 75, 100].map(val => {
        const x = 160 + (val / 100) * 300;
        return \`<line x1="\${x}" y1="20" x2="\${x}" y2="180" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2 2"/>
                <text x="\${x}" y="195" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="9" fill="#94a3b8">\${val}%</text>\`;
      }).join("")}
      \${values.map((v, i) => {
        const yBar = 35 + i * 48;
        const wBar = (v / 100) * 300;
        const wBench = (benchmarks[i] / 100) * 300;
        return \`<text x="150" y="\${yBar + 12}" text-anchor="end" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#0f172a">\${labels[i]}</text>
                <rect x="160" y="\${yBar}" width="\${wBench}" height="18" fill="#e2e8f0" rx="3"/>
                <rect x="160" y="\${yBar + 3}" width="\${wBar}" height="12" fill="\${dimColor(v)}" rx="2"/>
                <text x="\${168 + wBar}" y="\${yBar + 13}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="\${dimColor(v)}">\${v}%</text>\`;
      }).join("")}
    </svg>
  \`;
}

function renderCompMatrix(profiles, org) {
  const comps = profiles || [];
  const points = [
    { name: comps[0]?.name || "Competitor A", x: 75, y: 35, color: "#94a3b8" },
    { name: comps[1]?.name || "Competitor B", x: 60, y: 55, color: "#64748b" },
    { name: comps[2]?.name || "Competitor C", x: 40, y: 70, color: "#475569" },
    { name: org || "Your Opportunity", x: 30, y: 85, color: "#1a56db", isUser: true }
  ];
  return \`
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
      \${points.map(p => {
        const cx = 60 + (p.x / 100) * 400;
        const cy = 220 - (p.y / 100) * 200;
        if (p.isUser) {
          return \`<circle cx="\${cx}" cy="\${cy}" r="9" fill="#1a56db" stroke="#bfdbfe" stroke-width="3"/>
                  <circle cx="\${cx}" cy="\${cy}" r="3" fill="#ffffff"/>
                  <text x="\${cx}" y="\${cy - 14}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10.5" font-weight="800" fill="#1a56db">\${p.name}</text>\`;
        } else {
          return \`<circle cx="\${cx}" cy="\${cy}" r="6" fill="\${p.color}" stroke="#ffffff" stroke-width="1.5"/>
                  <text x="\${cx}" y="\${cy + 15}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9.5" font-weight="600" fill="#475569">\${p.name}</text>\`;
        }
      }).join("")}
    </svg>
  \`;
}

function renderRegionalBars(revenueByRegion) {
  const labels = revenueByRegion?.labels || ["Bengaluru", "Hyderabad", "Pune", "Chennai", "Mumbai"];
  const targets = revenueByRegion?.ourTarget || [85, 75, 68, 62, 58];
  const maxVal = Math.max(...targets, 100);
  return \`
    <svg width="100%" height="200" viewBox="0 0 500 200" style="display:block; margin:auto;">
      \${labels.slice(0, 5).map((lbl, i) => {
        const y = 20 + i * 36;
        const val = targets[i] || 0;
        const barWidth = (val / maxVal) * 330;
        return \`<text x="110" y="\${y + 12}" text-anchor="end" font-family="'Inter',sans-serif" font-size="11" font-weight="700" fill="#0f172a">\${lbl}</text>
                <rect x="120" y="\${y}" width="330" height="15" fill="#eff6ff" rx="3"/>
                <rect x="120" y="\${y}" width="\${barWidth}" height="15" fill="#1a56db" rx="3"/>
                <text x="\${128 + barWidth}" y="\${y + 12}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="#1a56db">₹\${val}Cr</text>\`;
      }).join("")}
    </svg>
  \`;
}

function renderRiskHeatmap() {
  const riskItems = [
    { name: "Competitive Response", p: 4, i: 4 },
    { name: "CAC Inflation", p: 3, i: 4 },
    { name: "Market Education", p: 4, i: 3 },
    { name: "Adoption Friction", p: 3, i: 3 },
    { name: "Regulatory Changes", p: 2, i: 5 }
  ];
  return \`
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
      \${riskItems.map((r, idx) => {
        const cx = 60 + ((r.p - 1) / 4) * 360;
        const cy = 220 - ((r.i - 1) / 4) * 160;
        return \`<circle cx="\${cx}" cy="\${cy}" r="7" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5"/>
                <text x="\${cx}" y="\${cy - 12}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#9f1239">\${idx + 1}. \${r.name}</text>\`;
      }).join("")}
    </svg>
  \`;
}

function renderReadinessDashboard(dimensions) {
  const readiness = [
    { name: "Market Readiness", score: dimensions.marketSize || 0, color: "#1a56db" },
    { name: "Product Readiness", score: Math.round(((dimensions.sectorFit || 0) + (dimensions.revenuePotential || 0)) / 2), color: "#10b981" },
    { name: "Commercial Readiness", score: dimensions.revenuePotential || 0, color: "#06b6d4" },
    { name: "Competitive Readiness", score: dimensions.competitionEdge || 0, color: "#a21caf" },
    { name: "Scale Readiness", score: Math.round(((dimensions.marketSize || 0) + (dimensions.audienceQuality || 0)) / 2), color: "#f97316" }
  ];
  return \`
    <svg width="100%" height="220" viewBox="0 0 500 220" style="display:block; margin:auto;">
      \${readiness.map((r, i) => {
        const y = 15 + i * 38;
        const barWidth = (r.score / 100) * 300;
        return \`<text x="140" y="\${y + 13}" text-anchor="end" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#0f172a">\${r.name}</text>
                <rect x="150" y="\${y}" width="300" height="15" fill="#eff6ff" rx="3"/>
                <rect x="150" y="\${y}" width="\${barWidth}" height="15" fill="\${r.color}" rx="3"/>
                <text x="465" y="\${y + 12}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="\${r.color}">\${r.score}%</text>\`;
      }).join("")}
    </svg>
  \`;
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
  const expPoints = expected.map((v, i) => \`\${getX(i)},\${getY(v)}\`).join(" ");
  const consPoints = conservative.map((v, i) => \`\${getX(i)},\${getY(v)}\`).join(" ");
  const aggPoints = aggressive.map((v, i) => \`\${getX(i)},\${getY(v)}\`).join(" ");
  return \`
    <svg width="100%" height="240" viewBox="0 0 500 240" style="display:block; margin:auto;">
      <line x1="70" y1="20" x2="70" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="70" y1="180" x2="480" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      \${[0.25, 0.5, 0.75, 1.0, 1.25, 1.5].map(ratio => {
        const val = som * ratio;
        const y = getY(val);
        return \`<line x1="70" y1="\${y}" x2="480" y2="\${y}" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="2 2"/>
                <text x="60" y="\${y + 3}" text-anchor="end" font-family="'IBM Plex Mono',monospace" font-size="8" fill="#94a3b8">₹\${Math.round(val)}Cr</text>\`;
      }).join("")}
      \${months.map((m, i) => \`<text x="\${getX(i)}" y="195" text-anchor="middle" font-family="'Inter',sans-serif" font-size="8.5" fill="#64748b">\${m}</text>\`).join("")}
      <polyline points="\${consPoints}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3 3"/>
      <polyline points="\${expPoints}" fill="none" stroke="#1a56db" stroke-width="2.5"/>
      <polyline points="\${aggPoints}" fill="none" stroke="#10b981" stroke-width="2"/>
      <circle cx="\${getX(11)}" cy="\dots" r="3"/>
    </svg>
  \`;
}

function renderGantt() {
  return \`
    <svg width="100%" height="180" viewBox="0 0 500 180" style="display:block; margin:auto;">
      \${Array.from({ length: 12 }, (_, i) => {
        const x = 120 + i * 28;
        return \`<line x1="\${x}" y1="20" x2="\${x}" y2="150" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="2 2"/>
                <text x="\${x + 14}" y="15" text-anchor="middle" font-family="'Inter',sans-serif" font-size="8.5" font-weight="700" fill="#64748b">W\${i + 1}</text>\`;
      }).join("")}
      <line x1="120" y1="20" x2="120" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="120" y1="150" x2="456" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="120" y="32" width="112" height="20" fill="#0d2040" fill-opacity="0.9" rx="4"/>
      <rect x="232" y="77" width="112" height="20" fill="#1a56db" fill-opacity="0.9" rx="4"/>
      <rect x="344" y="122" width="112" height="20" fill="#10b981" fill-opacity="0.9" rx="4"/>
    </svg>
  \`;
}

function generateDetailedExecSummary(org, sector, geography, score, verdict, tam, growth) {
  return \`
    <p class="body">This corporate intelligence assessment offers a granular and multi-dimensional analysis of the venture <b>\${org}</b> operating within the high-potential <b>\${sector}</b> landscape in <b>\${geography}</b>. The evaluation, yielding a Market Potential Index (MPI) score of <b>\${score}/100</b>, positions the enterprise as a <b>\${score >= 75 ? "High Growth Opportunity" : score >= 70 ? "High Potential Disruptor" : score >= 50 ? "Steady Competitor" : "Emerging Innovator"}</b>. This rating underscores a robust underlying alignment with modern target demographics, counterbalanced by distinct execution hurdles and strategic positioning opportunities characteristic of this specific growth stage.</p>
    <p class="body">Our structural sizing frameworks indicate an addressable opportunity of scale. The broader sector TAM (Total Addressable Market) is evaluated at <b>₹\${Math.round(tam)} Crore</b>, exhibiting a strong growth momentum with a CAGR of <b>\${growth}%</b>. This market is driven by accelerating structural tailwinds, including digitization of procurement channels, regional expansion of technology-first service layers, and growing customer willingness to pay for premiumized SaaS or product solutions. Consequently, the commercial opportunity represents a solid foundation for early capitalization, provided entry models remain agile.</p>
    <p class="body">Underlying demand dynamics show a promising combination of audience urgency and willingness to pay. A key findings summary identifies that customer acquisition friction points are primarily tied to legacy process adoption rather than budget caps. However, switching barriers from established competitor suites remain moderate to high. The strategic mandate for the venture is to construct immediate, high-differentiation hooks that lower transition complexity. Capitalizing on these initial touchpoints will be the primary catalyst for rapid revenue expansion and market capture.</p>
    <p class="body">From an investment readiness standpoint, the venture demonstrates strong product readiness backed by initial validation indicators. Scale readiness remains highly dependent on establishing capital-efficient distribution channels and mitigating risks associated with customer acquisition cost (CAC) inflation. Prospective financial backers should look to the execution of the 90-day execution roadmap as a core proof-of-concept milestone. Demonstrating steady user acquisition velocity over this phase will confirm the viability of the commercial scaling model and validate the underlying growth assumptions.</p>
  \`;
}

function generateFinalVerdict(org, sector, score, som) {
  const isGo = score >= 60;
  return \`
    <p class="body">Following a comprehensive, data-driven diagnostic of <b>\${org}</b> within the <b>\${sector}</b> space, our firm issues a formal <b>\${isGo ? "GO (PROCEED WITH TARGETED EXECUTION)" : "PROCEED WITH CAUTION (REASSESS DISTRIBUTION CHANNELS)"}</b> recommendation. Our analytical confidence level stands at <b>\${Math.round(score * 0.9 + 10)}%</b>, reflecting the high clarity of local market dynamics and current consumer trends. The venture exhibits sufficient capability to capture its targeted Serviceable Obtainable Market (SOM) of <b>₹\${Math.round(som)} Crore</b> within the next three fiscal years, provided that immediate priorities around distribution partnerships and product positioning are met.</p>
    <p class="body">Market timing is highly optimal, driven by immediate macroeconomic shifts and competitor transition phases. To maximize this opportunity, the management team must focus on structural positioning differentiators that neutralize competitor counter-campaigns. The strategic positioning matrix places the venture in a favorable quadrant where customer experience innovation offsets early-stage capital constraints. Investors should closely monitor CAC-to-LTV ratios during the early phases to confirm distribution scalability.</p>
    <p class="body">In conclusion, the combination of a validated problem statement, clear customer urgency, and a substantial target market size justifies immediate commercialization efforts. While risks around CAC inflation and competitor reaction are real, the mitigations outlined in our risk matrix provide a playbook for defensive scaling. Executing on this plan in a disciplined manner will unlock the full value potential of the venture and establish a defensible market position.</p>
  \`;
}

function createPage(pageNo, eyebrow, title, sub, content) {
  return \`
    <div class="page">
      <div class="pg-hdr">
        <div class="brand">INFOPACE <span>MARKET EVALUATOR</span></div>
        <div class="pg-num">\${pageNo} / 17</div>
      </div>
      <div class="eyebrow">\${eyebrow}</div>
      <div class="pg-title">\${title}</div>
      <div class="pg-sub">\${sub}</div>
      <div style="flex:1;">
        \${content}
      </div>
      <div class="pg-ftr">
        <div>©2026 Infopace Management Pvt. Ltd. All Rights Reserved.</div>
        <div>Confidential Assessment Report</div>
      </div>
    </div>
  \`;
}

export async function exportPdf({ userData, answers, result, iframeEl }) {
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

  const html = \`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Infopace Premium Intelligence Report - \${org}</title>
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
      <img src="\${LOGO_B64}" alt="Infopace" style="height:56px;"/>
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
        \${SVG_WAVES}
      </div>
    </div>
    <div style="position:relative; z-index:2; display:flex; justify-content:space-between; align-items:flex-end; padding:0 16mm 14mm;">
      <div class="mono" style="font-size:10.5px; color:#94a3b8;">
        Venture: \${org}<br/>
        Prepared: \${now} · Version 1.0.0
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
  \${createPage("03", "Introduction", "Our Assessment Suite", "The theoretical foundations and metrics backing our diagnostic systems.", \`
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
  \`)}

  \${createPage("04", "Section One", "Executive Summary", "An investor-grade assessment summary for the venture's target market performance.", \`
    <div class="gauge-wrap" style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderScoreGauge(score)}
      <div>
        <div class="tag-pill" style="background:\${dimColor(score)}; color:#ffffff;">\${grade} Opportunity</div>
        <div class="persona-name" style="margin-top:2px;">Venture Potential Rating</div>
        <div style="font-size:12px; color:var(--inkL); margin-top:2px; line-height:1.5;">\${verdict}</div>
      </div>
    </div>
    <div style="margin-top:6mm;">
      \${generateDetailedExecSummary(org, sector, geo, score, verdict, tam, growth)}
    </div>
  \`)}

  \${createPage("05", "Section Two", "Market Potential Overview", "Dimension-by-dimension breakdown of the core assessment scores.", \`
    <div style="display:flex; flex-direction:column; gap:4mm; margin-top:3mm;">
      \${[
        { name: "Market Size & Sizing Headroom", score: dimensions.marketSize, desc: "Evaluates the total capital density, potential transaction frequency, and volume scaling possibilities inside the primary region." },
        { name: "Audience Quality & Acquisition Velocity", score: dimensions.audienceQuality, desc: "Calculates target user segmentation clarity, contract size availability, and overall conversion efficiency potential." },
        { name: "Competition Edge & Defensibility", score: dimensions.competitionEdge, desc: "Assesses competitor concentration, technological differentiation requirements, and moat-building capabilities." },
        { name: "Revenue Potential & Monetization Agility", score: dimensions.revenuePotential, desc: "Calculates monetization flexibility (SaaS, contract, transaction fee) against target segment budget willingness." },
        { name: "Sector Fit & Macro-Alignment", score: dimensions.sectorFit, desc: "Evaluates systemic sector tailwinds, regulatory growth, and digital integration trends in the geography." }
      ].map(d => \`
        <div class="dim-block">
          <div class="dim-score-col">
            <div class="n" style="color:\${dimColor(d.score)}">\${d.score}</div>
            <div class="band">Score</div>
          </div>
          <div class="dim-body">
            <div class="dim-name">\${d.name}</div>
            <div class="dim-desc">\${d.desc}</div>
          </div>
        </div>
      \`).join("")}
    </div>
  \`)}

  \${createPage("06", "Section Three", "TAM / SAM / SOM Analysis", "Opportunity funnel modeling detailing broader addressable vs realistic capture segments.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderFunnel(tam, sam, som)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Sizing Foundations &amp; Assumptions</h3>
      <p class="body">The top-level Total Addressable Market (TAM) of <b>₹\${Math.round(tam)} Crore</b> represents the total global or regional market value for the <b>\${sector}</b> sector. The Serviceable Addressable Market (SAM) is computed at <b>₹\${Math.round(sam)} Crore</b>, isolating target segments reachable within the primary geographic region. The Serviceable Obtainable Market (SOM) represents a realistic target capitalization value of <b>₹\${Math.round(som)} Crore</b> over a 36-month timeline.</p>
    </div>
  \`)}

  \${createPage("07", "Section Four", "Demand Intelligence", "Assessing client necessity parameters: problem depth, urgency, and pricing flexibility.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderDemandBars(dimensions)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Demographic Demand Factors</h3>
      <p class="body">Structural metrics suggest that problem severity remains high across target user bases. Businesses and retail consumers exhibit a strong willingness to prioritize solutions that address immediate workflow bottlenecks or cost-containment directives. Our models indicate that customer adoption timelines decrease significantly when initial capital entry requirements are minimized.</p>
    </div>
  \`)}

  \${createPage("08", "Section Five", "Market Attractiveness Analysis", "Structural sector metrics, growth projection indicators, and entry barriers.", \`
    <div class="stat-row">
      <div class="stat-box"><div class="n">\${growth}%</div><div class="l">Expected CAGR</div></div>
      <div class="stat-box"><div class="n">Medium</div><div class="l">Entry Barriers</div></div>
      <div class="stat-box"><div class="n">High</div><div class="l">Attractiveness</div></div>
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Sector Growth Profile</h3>
      <p class="body">The target market in <b>\${geo}</b> is characterized by a strong growth momentum, supported by secular digital transformation waves. Transition rates away from legacy workflows are expanding, with the overall sector CAGR projected at a healthy <b>\${growth}%</b> over the next five years.</p>
      <div class="callout insight">
        <span class="lbl">Sector Insight Fact</span>
        \${result.realTimeInsight || "Target markets show strong signs of premium pricing validation for high-utility offerings."}
      </div>
    </div>
  \`)}

  \${createPage("09", "Section Six", "Competitive Landscape", "Mapping market positioning of major competitors vs the venture's target profile.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderCompMatrix(profiles, org)}
    </div>
    <div style="margin-top:5mm;">
      <h3 class="sec">Competitor Profiling</h3>
      <table class="summary-table" style="margin:2mm 0; font-size:11.5px;">
        <thead>
          <tr><th>Competitor</th><th>Stage</th><th>Core Strength</th><th>Weakness / Gap</th></tr>
        </thead>
        <tbody>
          \${profiles.map(c => \`
            <tr>
              <td><b>\${c.name}</b></td>
              <td>\${c.stage}</td>
              <td style="color:#059669;">\${c.strength}</td>
              <td style="color:#be185d;">\${c.weakness}</td>
            </tr>
          \`).join("")}
        </tbody>
      </table>
    </div>
  \`)}

  \${createPage("10", "Section Seven", "Adoption &amp; Commercial Readiness", "Analyzing transition frictions, behavioral switches, and customer validation readiness.", \`
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
  \`)}

  \${createPage("11", "Section Eight", "Regional Opportunity Analysis", "Target city rankings based on regional revenue density and sector growth rates.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderRegionalBars(result.revenueByRegion)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Regional Distribution Priority</h3>
      <p class="body">Our spatial market intelligence models identify <b>\${result.revenueByRegion?.labels?.[0] || "Bengaluru"}</b> as the high-priority entry corridor, representing high customer density and strong early willingness to pay.</p>
    </div>
  \`)}

  \${createPage("12", "Section Nine", "Risk Intelligence &amp; Heatmap", "Structural risk identification, mapping probability vs severity with targeted mitigations.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderRiskHeatmap()}
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
  \`)}

  \${createPage("13", "Section Ten", "Investment Readiness Assessment", "Evaluating the venture across key capital suitability matrices.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderReadinessDashboard(dimensions)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Suitability Analysis Summary</h3>
      <p class="body">The venture presents a strong alignment for early-stage venture funding, scoring particularly high in commercial feasibility indicators. Scaling readiness remains dependent on stabilizing distribution structures.</p>
    </div>
  \`)}

  \${createPage("14", "Section Eleven", "Revenue Projection Trajectory", "12-Month scenario-based financial modeling (Conservative vs Expected vs Aggressive).", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderRevenueGraph(som)}
    </div>
    <div style="margin-top:6mm;">
      <h3 class="sec">Projections Summary</h3>
      <p class="body">The Expected Scenario projects the venture reaching a monthly run-rate scaling toward <b>₹\${som} Crore</b> by Month 12, driven by stable channel partnerships and consistent conversion metrics.</p>
    </div>
  \`)}

  \${createPage("15", "Section Twelve", "Strategic Recommendations", "Actionable advisory plays across pricing models, acquisition channels, and scalability.", \`
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
  \`)}

  \${createPage("16", "Section Thirteen", "90-Day Execution Roadmap", "Structured milestones mapping immediate tactical tasks, KPIs, and deliverables.", \`
    <div style="background:#fafbfe; border:1px solid var(--border); padding:20px; border-radius:10px;">
      \${renderGantt()}
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
  \`)}

  <!-- PAGE 17: FINAL RECOMMENDATION -->
  <div class="page">
    <div class="pg-hdr"><div class="brand">INFOPACE <span>MARKET EVALUATOR</span></div><div class="pg-num">17 / 17</div></div>
    <div class="eyebrow">Section Fourteen</div>
    <div class="pg-title">Final Recommendation</div>
    <div class="pg-sub">Firm advisory position and strategic summary decision for venture growth.</div>
    <div style="margin-top:2mm; flex:1;">
      \${generateFinalVerdict(org, sector, score, som)}
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
      <img src="\${LOGO_B64}" alt="Infopace" style="height:56px;"/>
      <div class="mono" style="font-size:11.5px; color:#94a3b8;">17 / 17</div>
    </div>
    <div style="position:relative; height:75mm; overflow:hidden; margin-top:20mm;">
      \${SVG_WAVES_FULL}
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
\`;

fs.writeFileSync(destPath, code);
console.log("Successfully generated src/lib/exportPdf.js!");
