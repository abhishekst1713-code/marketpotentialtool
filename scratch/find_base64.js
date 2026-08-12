const fs = require('fs');
const content = fs.readFileSync('public/dashboard.html', 'utf8');
const match = content.match(/data:image\/[a-zA-Z+]+;base64,[^"']+/);
console.log(match ? match[0].substring(0, 100) + '...' : 'Not found');
