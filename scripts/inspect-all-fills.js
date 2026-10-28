const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '..', 'public', 'assets', 'brands');
const files = fs.readdirSync(brandDir);

for (const f of files) {
  if (!f.endsWith('.svg')) continue;
  const content = fs.readFileSync(path.join(brandDir, f), 'utf-8');
  const fills = content.match(/fill="[^"]+"/g) || [];
  const styles = content.match(/fill:[^;"]+/g) || [];
  console.log(f, '-> fills:', [...new Set(fills)], 'styles:', [...new Set(styles)]);
}
