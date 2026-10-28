const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '..', 'public', 'assets', 'brands');
const files = fs.readdirSync(brandDir);

for (const file of files) {
  if (file.endsWith('.svg')) {
    const text = fs.readFileSync(path.join(brandDir, file), 'utf-8');
    const vb = text.match(/viewBox="([^"]+)"/);
    const w = text.match(/width="([^"]+)"/);
    const h = text.match(/height="([^"]+)"/);
    console.log(file, 'viewBox:', vb ? vb[1] : 'none', 'w:', w ? w[1] : 'none', 'h:', h ? h[1] : 'none');
  } else {
    console.log(file, '(bitmap image)');
  }
}
