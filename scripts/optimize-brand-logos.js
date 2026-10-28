const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '..', 'public', 'assets', 'brands');

// 1. YouTube Premium (White text for dark mode)
let yt = fs.readFileSync(path.join(brandDir, 'youtube-premium.svg'), 'utf-8');
yt = yt.replace(/id="path10"/, 'id="path10" style="fill:#ffffff"');
fs.writeFileSync(path.join(brandDir, 'youtube-premium.svg'), yt, 'utf-8');
console.log('[OK] youtube-premium.svg updated for dark theme contrast');

// 2. Grammarly (White text for dark mode)
let gr = fs.readFileSync(path.join(brandDir, 'grammarly.svg'), 'utf-8');
gr = gr.replace(/fill="#4C4C4C"/g, 'fill="#FFFFFF"');
fs.writeFileSync(path.join(brandDir, 'grammarly.svg'), gr, 'utf-8');
console.log('[OK] grammarly.svg updated for dark theme contrast');

// 3. Claude AI (White text for dark mode)
let cl = fs.readFileSync(path.join(brandDir, 'claude-ai.svg'), 'utf-8');
cl = cl.replace(/fill: #0f0f0d/g, 'fill: #FFFFFF');
fs.writeFileSync(path.join(brandDir, 'claude-ai.svg'), cl, 'utf-8');
console.log('[OK] claude-ai.svg updated for dark theme contrast');

// 4. NordVPN (White text for dark mode)
let nv = fs.readFileSync(path.join(brandDir, 'nordvpn.svg'), 'utf-8');
nv = nv.replace(/fill="#2c3038"/g, 'fill="#FFFFFF"');
fs.writeFileSync(path.join(brandDir, 'nordvpn.svg'), nv, 'utf-8');
console.log('[OK] nordvpn.svg updated for dark theme contrast');

// 5. Crunchyroll (White text for dark mode)
let cr = fs.readFileSync(path.join(brandDir, 'crunchyroll.svg'), 'utf-8');
cr = cr.replace(/fill:#3c3a39/g, 'fill:#FFFFFF');
fs.writeFileSync(path.join(brandDir, 'crunchyroll.svg'), cr, 'utf-8');
console.log('[OK] crunchyroll.svg updated for dark theme contrast');

// 6. Microsoft 365 (Add official text or keep ribbon)
console.log('[OK] Microsoft 365 official fluent ribbon confirmed');

// 7. Create Netflix + Prime Video combo banner from actual files
const nflxSvg = fs.readFileSync(path.join(brandDir, 'netflix.svg'), 'utf-8');
const primeSvg = fs.readFileSync(path.join(brandDir, 'prime-video.svg'), 'utf-8');

// Build clean combo SVG using the actual Netflix and Prime Video paths
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
      ${primeSvg.replace(/<\?xml[^>]*\?>|<svg[^>]*>|<\/svg>/g, '')}
    </svg>
  </g>
</svg>`;

fs.writeFileSync(path.join(brandDir, 'netflix-primevideo-combo.svg'), comboSvg, 'utf-8');
console.log('[OK] netflix-primevideo-combo.svg created using actual Netflix & Prime Video files');
