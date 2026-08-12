const fs = require('fs');
const vm = require('vm');

const html = fs.readFileSync('public/dashboard.html', 'utf8');
const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let count = 0;

while ((match = scriptRegex.exec(html)) !== null) {
  count++;
  const code = match[1];
  try {
    new vm.Script(code);
    console.log(`Script ${count}: Parsed successfully!`);
  } catch (err) {
    console.error(`Script ${count} failed parsing:`, err);
    process.exit(1);
  }
}

