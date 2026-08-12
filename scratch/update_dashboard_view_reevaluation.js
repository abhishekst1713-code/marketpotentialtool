const fs = require('fs');

let content = fs.readFileSync('public/dashboard.html', 'utf8');

// Normalize newlines to LF
content = content.replace(/\r\n/g, '\n');

const targetStr = `        // Set unlocked state based on paid status sent from parent
        window._unlocked = Boolean(event.data.paid);
        delete window._gatedFd;
        const finalAnalysis = (analysis && typeof analysis === 'object' && Object.keys(analysis).length > 0)
          ? analysis : offlineAnalysis(fd);
        renderDash(fd, finalAnalysis);`;

const replacementStr = `        // Set unlocked state based on paid status sent from parent
        window._unlocked = Boolean(event.data.paid);
        delete window._gatedFd;
        const finalAnalysis = (analysis && typeof analysis === 'object' && Object.keys(analysis).length > 0)
          ? analysis : offlineAnalysis(fd);
        renderDash(fd, finalAnalysis);

        // Re-evaluate current view to respect the new unlocked status
        const vr = document.getElementById('viewReport');
        if (vr && vr.style.display !== 'none') {
          if (window._unlocked) {
            buildReport();
          } else {
            showReportGate();
          }
        }`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  console.log("Successfully injected view re-evaluation inside message receiver.");
} else {
  console.error("Error: Target render string not found in public/dashboard.html");
}

// Restore newlines to CRLF
content = content.replace(/\n/g, '\r\n');

fs.writeFileSync('public/dashboard.html', content, 'utf8');
