const fs = require('fs');

// 1. Read exportPdf.js and extract LOGO_B64 value
const exportPdfContent = fs.readFileSync('src/lib/exportPdf.js', 'utf8');
const logoRegex = /const LOGO_B64 = [`'"](data:image\/[a-zA-Z+]+;base64,[^`'"]+)[`'"]/;
const match = exportPdfContent.match(logoRegex);

if (!match) {
  console.error("Error: Could not find LOGO_B64 definition in src/lib/exportPdf.js");
  process.exit(1);
}

const logoBase64 = match[1];
console.log("Found logo base64 string of length:", logoBase64.length);

// 2. Read public/dashboard.html
let dashboardContent = fs.readFileSync('public/dashboard.html', 'utf8');

// 3. Replace the placeholder reference (ignoring whitespace) with the literal base64 string
const targetRegex = /const localLogoB64\s*=\s*LOGO_B64\s*;/;

if (targetRegex.test(dashboardContent)) {
  dashboardContent = dashboardContent.replace(targetRegex, `const localLogoB64 = \`${logoBase64}\`;`);
  fs.writeFileSync('public/dashboard.html', dashboardContent, 'utf8');
  console.log("Successfully fixed LOGO_B64 reference in public/dashboard.html");
} else {
  console.error("Error: Target placeholder matching regex was not found in public/dashboard.html");
}
