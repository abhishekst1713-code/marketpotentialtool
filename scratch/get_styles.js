const fs = require('fs');
const content = fs.readFileSync('CII_Report_FINAL (1).html', 'utf8');

const matches = content.match(/<style>([\s\S]*?)<\/style>/g);
if (matches) {
  matches.forEach((m, idx) => {
    console.log(`Style Block ${idx + 1}: length ${m.length}`);
    console.log(m.substring(0, 300) + "...\n");
  });
} else {
  console.log("No style blocks found!");
}
