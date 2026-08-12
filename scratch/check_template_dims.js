const fs = require('fs');
const content = fs.readFileSync('CII_Report_FINAL (1).html', 'utf8');

// Find all occurrences of class="dim-name"
const regex = /<div class="dim-name">([\s\S]*?)<\/div>/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log("Dimension name in template:", match[1].trim());
}
