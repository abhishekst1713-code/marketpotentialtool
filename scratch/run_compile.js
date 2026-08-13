const fs = require('fs');
const path = require('path');

const workspaceRoot = 'c:/Users/ADMIN/Downloads/marketpotentialtool';
const destPath = path.join(workspaceRoot, 'src', 'lib', 'exportPdf.js');
const refPath = path.join(workspaceRoot, 'CII_Report_FINAL (1).html');

try {
  // 1. Read the logo from reference HTML
  const refContent = fs.readFileSync(refPath, 'utf8');
  const logoMatch = refContent.match(/data:image\/png;base64,[A-Za-z0-9+/=]+/);
  if (!logoMatch) {
    throw new Error("Could not find logo base64 in reference HTML.");
  }
  const logoB64 = logoMatch[0];

  // 2. Read each part
  let part1 = fs.readFileSync(path.join(workspaceRoot, 'scratch', 'part1.txt'), 'utf8');
  // Replace the logo placeholder
  part1 = part1.replace('__LOGO_B64_PLACEHOLDER__', logoB64);

  const part2 = fs.readFileSync(path.join(workspaceRoot, 'scratch', 'part2.txt'), 'utf8');
  const part3 = fs.readFileSync(path.join(workspaceRoot, 'scratch', 'part3.txt'), 'utf8');
  const part4 = fs.readFileSync(path.join(workspaceRoot, 'scratch', 'part4.txt'), 'utf8');
  const part5 = fs.readFileSync(path.join(workspaceRoot, 'scratch', 'part5.txt'), 'utf8');
  const part6 = fs.readFileSync(path.join(workspaceRoot, 'scratch', 'part6.txt'), 'utf8');

  // 3. Concatenate
  const fullCode = [part1, part2, part3, part4, part5, part6].join('\n\n');

  // 4. Write to final destination
  fs.writeFileSync(destPath, fullCode, 'utf8');
  console.log("✅ Successfully compiled and written src/lib/exportPdf.js!");

  // 5. Clean up temporary files
  const filesToClean = ['part1.txt', 'part2.txt', 'part3.txt', 'part4.txt', 'part5.txt', 'part6.txt'];
  filesToClean.forEach(f => {
    try {
      fs.unlinkSync(path.join(workspaceRoot, 'scratch', f));
    } catch (_) {}
  });
  console.log("Specific temporary build parts cleaned up.");
} catch (err) {
  console.error("❌ Compilation failed:", err.message);
  process.exit(1);
}
