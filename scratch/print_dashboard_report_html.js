const fs = require('fs');
const content = fs.readFileSync('public/dashboard.html', 'utf8');

// Find buildReport function
const startIdx = content.indexOf('function buildReport() {');
const endIdx = content.indexOf('</script>', startIdx);
const buildReportCode = content.substring(startIdx, endIdx);

// Find all HTML sections (look for backticks `...`)
const backtickRegex = /`([\s\S]*?)`/g;
let match;
let index = 1;
while ((match = backtickRegex.exec(buildReportCode)) !== null) {
  console.log(`HTML Block ${index++}: length ${match[1].length}`);
  // print first 500 characters of the block without template variables
  console.log(match[1].substring(0, 500).replace(/\$\{[\s\S]*?\}/g, '[VAR]').replace(/\s+/g, ' ').trim());
  console.log("----------------\n");
}
