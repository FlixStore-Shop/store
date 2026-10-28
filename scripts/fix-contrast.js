const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '..', 'public', 'assets', 'brands');

// 1. Fix Prime Video: change dark navy #232F3E to white #FFFFFF
let pv = fs.readFileSync(path.join(brandDir, 'prime-video.svg'), 'utf-8');
pv = pv.replace(/fill:#232F3E;/g, 'fill:#FFFFFF;');
fs.writeFileSync(path.join(brandDir, 'prime-video.svg'), pv, 'utf-8');
console.log('[FIXED] prime-video.svg: word "video" changed from dark navy #232F3E to white #FFFFFF');

// 2. Fix HBO Max: add fill="#FFFFFF" to the HBO letters
let hbo = fs.readFileSync(path.join(brandDir, 'hbo-max.svg'), 'utf-8');
// The paths and polygon for H, B, O currently have no fill attribute
hbo = hbo.replace('<path d="M64.81,30.437', '<path fill="#FFFFFF" d="M64.81,30.437');
hbo = hbo.replace('<path d="M64.891,12.691', '<path fill="#FFFFFF" d="M64.891,12.691');
hbo = hbo.replace('<polygon points="26.581,22.351', '<polygon fill="#FFFFFF" points="26.581,22.351');
fs.writeFileSync(path.join(brandDir, 'hbo-max.svg'), hbo, 'utf-8');
console.log('[FIXED] hbo-max.svg: letters "HBO" set to fill="#FFFFFF"');

// 3. Update netflix-primevideo-combo.svg to use the updated prime-video.svg
const nflxSvg = fs.readFileSync(path.join(brandDir, 'netflix.svg'), 'utf-8');
const updatedPv = fs.readFileSync(path.join(brandDir, 'prime-video.svg'), 'utf-8');

const comboSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="100%">
  <rect width="800" height="360" fill="#0b0f19"/>
  <!-- Left Netflix -->
  <g transform="translate(60, 60)">
    <svg width="300" height="240" viewBox="0 0 1024 276.742">
      ${nflxSvg.replace(/<\?xml[^>]*\?>|<svg[^>]*>|<\/svg>/g, '')}
    </svg>
  </g>
  <!-- Center Plus -->
  <text x="400" y="200" font-family="-apple-system, sans-serif" font-size="52" font-weight="900" fill="#FBBF24" text-anchor="middle">+</text>
  <!-- Right Prime Video -->
  <g transform="translate(440, 60)">
    <svg width="300" height="240" viewBox="0 0 800.3 246.3">
      ${updatedPv.replace(/<\?xml[^>]*\?>|<svg[^>]*>|<\/svg>/g, '')}
    </svg>
  </g>
</svg>`;
fs.writeFileSync(path.join(brandDir, 'netflix-primevideo-combo.svg'), comboSvg, 'utf-8');
console.log('[FIXED] netflix-primevideo-combo.svg updated with white "video" text');
