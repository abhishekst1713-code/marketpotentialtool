/**
 * exportPdf — captures the Charts view from the dashboard iframe
 * and opens it as a print-ready page for the user to save as PDF.
 *
 * Usage (unchanged):
 *   exportPdf({ userData, answers, result, iframeEl })
 *
 * NOTE: Pass the iframe DOM element as `iframeEl` from ResultsDashboard.jsx
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

  // ── Step 1: Switch to charts view ─────────────────────────────────────────
  if (typeof iframeWin?.switchView === "function") {
    iframeWin.switchView("charts");
  }
  await new Promise(r => setTimeout(r, 300));

  // ── Step 2: Expand iframe to a large fixed viewport so Chart.js canvases
  //    render at full size (they are sized to the iframe viewport) ──────────
  const CAPTURE_W = 1600;
  const CAPTURE_H = 900;
  const prevW = iframeEl.style.width;
  const prevH = iframeEl.style.height;
  iframeEl.style.width  = CAPTURE_W + "px";
  iframeEl.style.height = CAPTURE_H + "px";
  await new Promise(r => setTimeout(r, 200));

  // ── Step 3: Force all Chart.js instances to resize to the new viewport ────
  const charts = iframeWin?.dashCharts || {};
  Object.values(charts).forEach(ch => { try { ch?.resize?.(); } catch (_) {} });

  // Wait for canvases to finish redrawing
  await new Promise(r => setTimeout(r, 1000));

  // ── Step 4: #viewCharts is position:fixed — html2canvas can't measure it.
  //    Temporarily make it position:relative so scroll dimensions are correct.
  const viewCharts = iframeDoc.getElementById("viewCharts");
  const sidebar    = iframeDoc.getElementById("outputSidebar");
  let origVC = null, origSB = null;

  if (viewCharts) {
    origVC = viewCharts.getAttribute("style") || "";
    viewCharts.style.cssText = [
      "position:relative",
      "left:0",
      "top:0",
      "width:" + CAPTURE_W + "px",
      "height:auto",
      "overflow:visible",
      "display:flex",
      "flex-direction:column",
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

  // ── Step 5: Capture ───────────────────────────────────────────────────────
  const canvas = await html2canvas(target, {
    useCORS:         true,
    allowTaint:      true,
    scale:           2,
    backgroundColor: "#EEF2F7",
    logging:         false,
    width:           capW,
    height:          capH,
    windowWidth:     CAPTURE_W,   // must match the viewport we forced above
    windowHeight:    CAPTURE_H,
    x: 0,
    y: 0,
    ignoreElements: el =>
      el.id === "outputSidebar" ||
      el.classList?.contains("sb-btn") ||
      el.classList?.contains("no-print"),
  });

  // ── Step 6: Restore everything ────────────────────────────────────────────
  if (viewCharts && origVC !== null) viewCharts.setAttribute("style", origVC);
  if (sidebar   && origSB !== null) sidebar.setAttribute("style", origSB);
  iframeEl.style.width  = prevW;
  iframeEl.style.height = prevH;

  return canvas.toDataURL("image/png", 0.95);
}

// ── Main export function ───────────────────────────────────────────────────────
export async function exportPdf({ userData, answers, result, iframeEl }) {
  const now = new Date().toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });

  let chartImageSrc = null;

  // Try to capture the charts section from the live iframe
  if (iframeEl) {
    try {
      chartImageSrc = await captureChartsSection(iframeEl);
    } catch (err) {
      console.warn("⚠️ Chart capture failed, falling back to text report:", err.message);
    }
  }

  // ── Build the print page ──────────────────────────────────────────────────
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Infopace Charts — ${userData?.organization || "Report"}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'IBM Plex Sans', sans-serif;
      background: #fff;
      color: #111827;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @page { size: A4 landscape; margin: 0; }
    @media print { body { margin: 0; } .no-print { display: none !important; } }

    .page {
      width: 100%;
      min-height: 100vh;
      padding: 0;
      display: flex;
      flex-direction: column;
    }

    /* ── Header bar ── */
    .header {
      background: #0F1E3C;
      padding: 18px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-brand { font-size: 13px; font-weight: 700; color: #F8FAFC; letter-spacing: -.01em; }
    .header-sub   { font-size: 10px; color: rgba(148,163,184,.6); margin-top: 2px; }
    .header-meta  { text-align: right; font-size: 10px; color: rgba(148,163,184,.55); }
    .header-score {
      font-size: 13px; font-weight: 700;
      color: #6EE7B7;
      background: rgba(6,95,70,.2);
      border: 1px solid rgba(6,95,70,.35);
      border-radius: 5px;
      padding: 4px 12px;
      margin-top: 4px;
      display: inline-block;
    }

    /* ── Chart image ── */
    .chart-wrap {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 24px 32px;
      background: #EEF2F7;
    }
    .chart-wrap img {
      max-width: 100%;
      max-height: calc(100vh - 120px);
      object-fit: contain;
      border-radius: 8px;
      box-shadow: 0 4px 24px rgba(15,30,60,.12);
    }

    /* ── Fallback message if no screenshot ── */
    .fallback {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #EEF2F7;
      color: #627289;
      font-size: 14px;
      padding: 40px;
      text-align: center;
    }

    /* ── Footer ── */
    .footer {
      background: #fff;
      border-top: 1px solid #E5E7EB;
      padding: 10px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .footer-l { font-size: 9px; color: #9CA3AF; }
    .footer-r { font-size: 9px; color: #9CA3AF; text-align: right; }

    /* ── Print button (hidden when printing) ── */
    .print-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      background: #0F1E3C;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 11px 22px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(15,30,60,.25);
      z-index: 9999;
    }
    .print-btn:hover { background: #1d3461; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div>
      <div class="header-brand">${userData?.organization || "Market Assessment"}</div>
      <div class="header-sub">
        ${userData?.sector || ""}
        ${userData?.sector && userData?.geography ? " &nbsp;·&nbsp; " : ""}
        ${userData?.geography || ""}
      </div>
    </div>
    <div class="header-meta">
      <div>Charts Dashboard</div>
      <div style="margin-top:2px">Generated ${now}</div>
      ${result?.overallScore != null
        ? `<div class="header-score">${result.overallScore}/100 &nbsp;·&nbsp; ${result.grade || ""}</div>`
        : ""}
    </div>
  </div>

  <!-- Chart screenshot or fallback -->
  ${chartImageSrc
    ? `<div class="chart-wrap"><img src="${chartImageSrc}" alt="Charts Dashboard"/></div>`
    : `<div class="fallback">
         <div>
           <div style="font-size:32px;margin-bottom:12px">📊</div>
           <div style="font-weight:600;margin-bottom:6px">Charts could not be captured automatically.</div>
           <div>Please use the browser's print function (Ctrl+P / ⌘P) directly from the Charts tab in the dashboard.</div>
         </div>
       </div>`
  }

  <!-- Footer -->
  <div class="footer">
    <div class="footer-l">Infopace Management Pvt Ltd &nbsp;·&nbsp; Market Intelligence Platform &nbsp;·&nbsp; AI-Powered Analysis</div>
    <div class="footer-r">Confidential · For Internal Use Only</div>
  </div>

</div>

<!-- Print button (hidden on print) -->
<button class="print-btn no-print" onclick="window.print()">⬇ Save as PDF</button>

</body>
</html>`;

  // Open in new tab and trigger print dialog
  const win = window.open("", "_blank");
  if (!win) {
    alert("Please allow pop-ups to export the PDF.");
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}
