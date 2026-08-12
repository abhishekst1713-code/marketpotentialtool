const fs = require('fs');
const content = fs.readFileSync('CII_Report_FINAL (1).html', 'utf8');

const regex = /<div class="(wp-)?page"/g;
let match;
let indices = [];
while ((match = regex.exec(content)) !== null) {
  indices.push(match.index);
}

console.log("Found", indices.length, "pages in CII_Report_FINAL (1).html");

indices.forEach((startIndex, idx) => {
  const endIndex = indices[idx + 1] || content.length;
  const pageContent = content.substring(startIndex, endIndex);
  
  const titleMatch = pageContent.match(/<div class="pg-title"[^>]*>([\s\S]*?)<\/div>/i);
  const title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').trim() : 'No Title';
  
  const pgNumMatch = pageContent.match(/(\d+)\s*\/\s*11/i) || pageContent.match(/(\d+)\s*\/\s*12/i) || pageContent.match(/class="pg-num"[^>]*>([^<]+)/);
  const pageNum = pgNumMatch ? pgNumMatch[1].trim() : 'No Num';
  
  console.log(`Page ${idx + 1}: Title="${title}", PageNum="${pageNum}"`);
});
