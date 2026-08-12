const fs = require('fs');

let content = fs.readFileSync('public/dashboard.html', 'utf8');

// Normalize newlines to LF for easy matching
content = content.replace(/\r\n/g, '\n');

// 1. Inject the message receiver
const targetReceiver = `      // Receive paid status updates dynamically
      if (event.data.type === 'INFOPACE_PAID_STATUS') {
        window._unlocked = Boolean(event.data.paid);
        if (window._unlocked) {
          const vr = document.getElementById('viewReport');
          if (vr && vr.style.display !== 'none') {
            buildReport();
          }
        }
      }`;

const replacementReceiver = `      // Receive paid status updates dynamically
      if (event.data.type === 'INFOPACE_PAID_STATUS') {
        window._unlocked = Boolean(event.data.paid);
        if (window._unlocked) {
          const vr = document.getElementById('viewReport');
          if (vr && vr.style.display !== 'none') {
            buildReport();
          }
        }
      }

      // Receive captured chart image dynamically
      if (event.data.type === 'INFOPACE_CHARTS_CAPTURE') {
        window.chartImageSrc = event.data.chartImageSrc;
        const vr = document.getElementById('viewReport');
        if (vr && vr.style.display !== 'none') {
          buildReport();
        }
      }`;

if (content.includes(targetReceiver)) {
  content = content.replace(targetReceiver, replacementReceiver);
  console.log("Successfully injected message receiver.");
} else {
  console.error("Error: Could not find target message receiver in public/dashboard.html");
}

// 2. Inject the variable definition inside buildReport() (in case it wasn't replaced)
const targetVariables = `        const fd = dd.fd, a = dd.a;
        const org = fd.organization || 'Your Organisation';
        const sector = fd.sectorCode || '';`;

const replacementVariables = `        const fd = dd.fd, a = dd.a;
        const org = fd.organization || 'Your Organisation';
        const chartImageSrc = window.chartImageSrc || null;
        const sector = fd.sectorCode || '';`;

if (content.includes(targetVariables)) {
  content = content.replace(targetVariables, replacementVariables);
  console.log("Successfully injected variables inside buildReport().");
} else {
  // If it was already replaced in the previous run, that's fine
  if (content.includes('const chartImageSrc = window.chartImageSrc || null;')) {
    console.log("Variables already injected inside buildReport().");
  } else {
    console.error("Error: Could not find target variables in public/dashboard.html");
  }
}

// Convert newlines back to CRLF (Windows standard)
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('public/dashboard.html', content, 'utf8');
