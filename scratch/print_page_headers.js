const fs = require('fs');
const content = fs.readFileSync('CII_Report_FINAL (1).html', 'utf8');

const regex = /<div class="(wp-)?page"/g;
let match;
let indices = [];
while ((match = regex.exec(content)) !== null) {
  indices.push(match.index);
}

indices.forEach((startIndex, idx) => {
  const endIndex = indices[idx + 1] || content.length;
  const pageContent = content.substring(startIndex, endIndex);
  console.log(`=== PAGE ${idx + 1} (Start: ${startIndex}) ===`);
  console.log(pageContent.substring(0, 400).replace(/\s+/g, ' ').trim());
  console.log("\n");
});
