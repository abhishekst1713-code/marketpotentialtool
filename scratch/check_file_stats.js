const fs = require('fs');
const stats = fs.statSync('public/dashboard.html');
console.log("Last modified:", stats.mtime);

const content = fs.readFileSync('public/dashboard.html', 'utf8');
const index = content.indexOf('localLogoB64');
if (index !== -1) {
  console.log("Found localLogoB64 context:\n", content.substring(index - 50, index + 250));
} else {
  console.log("localLogoB64 not found in file!");
}
