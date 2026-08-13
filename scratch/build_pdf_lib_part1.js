const fs = require('fs');
const path = require('path');

const workspaceRoot = 'c:/Users/ADMIN/Downloads/marketpotentialtool';
const refPath = path.join(workspaceRoot, 'CII_Report_FINAL (1).html');
const destPath = path.join(workspaceRoot, 'src', 'lib', 'exportPdf.js');

const refContent = fs.readFileSync(refPath, 'utf8');
const logoMatch = refContent.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
const logoB64 = logoMatch ? logoMatch[0] : '';

const headerCode = `// src/lib/exportPdf.js
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
      <path d="M 30 130 A 100 100 0 0 1 \\\${x.toFixed(2)} \\\${y.toFixed(2)}" fill="none" stroke="\\\${color}" stroke-width="18" stroke-linecap="round"/>
      <text x="130" y="108" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="48" font-weight="700" fill="#061228">\\\${clamped}</text>
      <text x="130" y="130" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10" fill="#64748b" letter-spacing=".1em">MPI SCORE / 100</text>
    </svg>
  \`;
}

function renderFunnel(tam, sam, som) {
  return \`
    <svg width="100%" height="260" viewBox="0 0 500 260" style="display:block; margin:auto;">
      <polygon points="50,20 450,20 380,90 120,90" fill="#061228" fill-opacity="0.95" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="55" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="12" font-weight="700">TAM: ₹\\\${Math.round(tam)} Cr</text>
      <polygon points="125,95 375,95 320,165 180,165" fill="#1a56db" fill-opacity="0.9" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="130" text-anchor="middle" fill="#ffffff" font-family="'Inter',sans-serif" font-size="12" font-weight="700">SAM: ₹\\\${Math.round(sam)} Cr</text>
      <polygon points="185,170 315,170 270,240 230,240" fill="#93c5fd" fill-opacity="0.85" stroke="#bfdbfe" stroke-width="1"/>
      <text x="250" y="205" text-anchor="middle" fill="#0d2040" font-family="'Inter',sans-serif" font-size="12" font-weight="700">SOM: ₹\\\${Math.round(som)} Cr</text>
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
    return \\\`\\\${x.toFixed(1)},\\\${y.toFixed(1)}\\\`;
  });
  const pointsStr = pointsArr.join(" ");
  const benchPointsArr = [60, 60, 55, 55, 50, 60].map((bench, i) => {
    const r = (bench / 100) * r_max;
    const x = cx + r * Math.cos(angles[i]);
    const y = cy + r * Math.sin(angles[i]);
    return \\\`\\\${x.toFixed(1)},\\\${y.toFixed(1)}\\\`;
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
      <polygon points="\\\${benchPointsStr}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="3 3"/>
      <polygon points="\\\${pointsStr}" fill="rgba(26,86,219,0.18)" stroke="#1a56db" stroke-width="2.5"/>
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
      \\\${[25, 50, 75, 100].map(val => {
        const x = 160 + (val / 100) * 300;
        return \\\`<line x1="\\\\\\\${x}" y1="20" x2="\\\\\\\${x}" y2="180" stroke="#e2e8f0" stroke-width="1" stroke-dasharray="2 2"/>
                <text x="\\\\\\\${x}" y="195" text-anchor="middle" font-family="'IBM Plex Mono',monospace" font-size="9" fill="#94a3b8">\\\\\\\${val}%</text>\\\`;
      }).join("")}
      \\\${values.map((v, i) => {
        const yBar = 35 + i * 48;
        const wBar = (v / 100) * 300;
        const wBench = (benchmarks[i] / 100) * 300;
        return \\\`<text x="150" y="\\\\\\\${yBar + 12}" text-anchor="end" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#0f172a">\\\\\\\${labels[i]}</text>
                <rect x="160" y="\\\\\\\${yBar}" width="\\\\\\\${wBench}" height="18" fill="#e2e8f0" rx="3"/>
                <rect x="160" y="\\\\\\\${yBar + 3}" width="\\\\\\\${wBar}" height="12" fill="\\\\\\\${dimColor(v)}" rx="2"/>
                <text x="\\\\\\\${168 + wBar}" y="\\\\\\\${yBar + 13}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="\\\\\\\${dimColor(v)}">\\\\\\\${v}%</text>\\\`;
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
      \\\${points.map(p => {
        const cx = 60 + (p.x / 100) * 400;
        const cy = 220 - (p.y / 100) * 200;
        if (p.isUser) {
          return \\\`<circle cx="\\\\\\\${cx}" cy="\\\\\\\${cy}" r="9" fill="#1a56db" stroke="#bfdbfe" stroke-width="3"/>
                  <circle cx="\\\\\\\${cx}" cy="\\\\\\\${cy}" r="3" fill="#ffffff"/>
                  <text x="\\\\\\\${cx}" y="\\\\\\\${cy - 14}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="10.5" font-weight="800" fill="#1a56db">\\\\\\\${p.name}</text>\\\`;
        } else {
          return \\\`<circle cx="\\\\\\\${cx}" cy="\\\\\\\${cy}" r="6" fill="\\\\\\\${p.color}" stroke="#ffffff" stroke-width="1.5"/>
                  <text x="\\\\\\\${cx}" y="\\\\\\\${cy + 15}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9.5" font-weight="600" fill="#475569">\\\\\\\${p.name}</text>\\\`;
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
      \\\${labels.slice(0, 5).map((lbl, i) => {
        const y = 20 + i * 36;
        const val = targets[i] || 0;
        const barWidth = (val / maxVal) * 330;
        return \\\`<text x="110" y="\\\\\\\${y + 12}" text-anchor="end" font-family="'Inter',sans-serif" font-size="11" font-weight="700" fill="#0f172a">\\\\\\\${lbl}</text>
                <rect x="120" y="\\\\\\\${y}" width="330" height="15" fill="#eff6ff" rx="3"/>
                <rect x="120" y="\\\\\\\${y}" width="\\\\\\\${barWidth}" height="15" fill="#1a56db" rx="3"/>
                <text x="\\\\\\\${128 + barWidth}" y="\\\\\\\${y + 12}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="#1a56db">₹\\\\\\\${val}Cr</text>\\\`;
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
      \\\${riskItems.map((r, idx) => {
        const cx = 60 + ((r.p - 1) / 4) * 360;
        const cy = 220 - ((r.i - 1) / 4) * 160;
        return \\\`<circle cx="\\\\\\\${cx}" cy="\\\\\\\${cy}" r="7" fill="#f43f5e" stroke="#ffffff" stroke-width="1.5"/>
                <text x="\\\\\\\${cx}" y="\\\\\\\${cy - 12}" text-anchor="middle" font-family="'Inter',sans-serif" font-size="9" font-weight="700" fill="#9f1239">\\\\\\\${idx + 1}. \\\\\\\${r.name}</text>\\\`;
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
      \\\${readiness.map((r, i) => {
        const y = 15 + i * 38;
        const barWidth = (r.score / 100) * 300;
        return \\\`<text x="140" y="\\\\\\\${y + 13}" text-anchor="end" font-family="'Inter',sans-serif" font-size="10.5" font-weight="700" fill="#0f172a">\\\\\\\${r.name}</text>
                <rect x="150" y="\\\\\\\${y}" width="300" height="15" fill="#eff6ff" rx="3"/>
                <rect x="150" y="\\\\\\\${y}" width="\\\\\\\${barWidth}" height="15" fill="\\\\\\\${r.color}" rx="3"/>
                <text x="465" y="\\\\\\\${y + 12}" font-family="'IBM Plex Mono',monospace" font-size="10" font-weight="700" fill="\\\\\\\${r.color}">\\\\\\\${r.score}%</text>\\\`;
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
  const expPoints = expected.map((v, i) => \\\`\\\${getX(i)},\\\${getY(v)}\\\`).join(" ");
  const consPoints = conservative.map((v, i) => \\\`\\\${getX(i)},\\\${getY(v)}\\\`).join(" ");
  const aggPoints = aggressive.map((v, i) => \\\`\\\${getX(i)},\\\${getY(v)}\\\`).join(" ");
  return \`
    <svg width="100%" height="240" viewBox="0 0 500 240" style="display:block; margin:auto;">
      <line x1="70" y1="20" x2="70" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      <line x1="70" y1="180" x2="480" y2="180" stroke="#cbd5e1" stroke-width="1.5"/>
      \\\${[0.25, 0.5, 0.75, 1.0, 1.25, 1.5].map(ratio => {
        const val = som * ratio;
        const y = getY(val);
        return \\\`<line x1="70" y1="\\\\\\\${y}" x2="480" y2="\\\\\\\${y}" stroke="#e2e8f0" stroke-width="0.8" stroke-dasharray="2 2"/>
                <text x="60" y="\\\\\\\${y + 3}" text-anchor="end" font-family="'IBM Plex Mono',monospace" font-size="8" fill="#94a3b8">₹\\\\\\\${Math.round(val)}Cr</text>\\\`;
      }).join("")}
      \\\${months.map((m, i) => \\\`<text x="\\\\\\\${getX(i)}" y="195" text-anchor="middle" font-family="'Inter',sans-serif" font-size="8.5" fill="#64748b">\\\\\\\${m}</text>\\\`).join("")}
      <polyline points="\\\${consPoints}" fill="none" stroke="#f43f5e" stroke-width="2" stroke-dasharray="3 3"/>
      <polyline points="\\\${expPoints}" fill="none" stroke="#1a56db" stroke-width="2.5"/>
      <polyline points="\\\${aggPoints}" fill="none" stroke="#10b981" stroke-width="2"/>
      <circle cx="\\\${getX(11)}" cy="\\\${getY(expected[11])}" r="4" fill="#1a56db"/>
    </svg>
  \`;
}

function renderGantt() {
  return \`
    <svg width="100%" height="180" viewBox="0 0 500 180" style="display:block; margin:auto;">
      \\\${Array.from({ length: 12 }, (_, i) => {
        const x = 120 + i * 28;
        return \\\`<line x1="\\\\\\\${x}" y1="20" x2="\\\\\\\${x}" y2="150" stroke="#cbd5e1" stroke-width="0.8" stroke-dasharray="2 2"/>
                <text x="\\\\\\\${x + 14}" y="15" text-anchor="middle" font-family="'Inter',sans-serif" font-size="8.5" font-weight="700" fill="#64748b">W\\\\\\\${i + 1}</text>\\\`;
      }).join("")}
      <line x1="120" y1="20" x2="120" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="120" y1="150" x2="456" y2="150" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="120" y="32" width="112" height="20" fill="#0d2040" fill-opacity="0.9" rx="4"/>
      <rect x="232" y="77" width="112" height="20" fill="#1a56db" fill-opacity="0.9" rx="4"/>
      <rect x="344" y="122" width="112" height="20" fill="#10b981" fill-opacity="0.9" rx="4"/>
    </svg>
  \`;
}
\`;

fs.writeFileSync(destPath + '.part1', headerCode);
console.log("Successfully wrote part1!");
