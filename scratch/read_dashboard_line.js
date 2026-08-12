const fs = require('fs');
const content = fs.readFileSync('public/dashboard.html', 'utf8');
const lines = content.split('\n');
console.log("Line 7018:", JSON.stringify(lines[7017]));
