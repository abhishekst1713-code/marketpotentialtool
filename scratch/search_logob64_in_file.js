const fs = require('fs');
const content = fs.readFileSync('public/dashboard.html', 'utf8');
const lines = content.split('\n');

let found = false;
lines.forEach((line, idx) => {
  if (line.includes('LOGO_B64')) {
    console.log(`Found LOGO_B64 on line ${idx + 1}: ${line.trim()}`);
    found = true;
  }
});

if (!found) {
  console.log("LOGO_B64 was not found in public/dashboard.html");
}
