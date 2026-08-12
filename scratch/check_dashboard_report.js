const fs = require('fs');
const content = fs.readFileSync('public/dashboard.html', 'utf8');

const buildReportMatch = content.match(/function buildReport\(\) \{([\s\S]*?)\n    \}/);
if (buildReportMatch) {
  const code = buildReportMatch[1];
  const pageMatches = code.match(/class="page"/g);
  console.log("Pages in buildReport in dashboard.html:", pageMatches ? pageMatches.length : 0);
  
  const headers = [];
  const regex = /<div style="font-family:'Playfair Display',serif; font-size:36.8px; font-weight:700; color:#061228;[^"]*">([\s\S]*?)<\/div>/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    headers.push(match[1].trim());
  }
  console.log("Headers found:", headers);
} else {
  console.log("buildReport function not found.");
}
