const fs = require('fs');
const content = fs.readFileSync('CII_Report_FINAL (1).html', 'utf8');

const regex = /<div class="(wp-)?page"/g;
let match;
let indices = [];
while ((match = regex.exec(content)) !== null) {
  indices.push(match.index);
}

const page1Content = content.substring(indices[0], indices[1]);
// Remove base64 image data
const cleanContent = page1Content.replace(/data:image\/[a-zA-Z+]+;base64,[^"]+/g, '[BASE64]');
console.log(cleanContent.substring(0, 1500).replace(/\s+/g, ' ').trim());
