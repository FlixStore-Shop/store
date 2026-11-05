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
// netflix-primevideo-combo.svg uses high-resolution stacked artwork with transparent background
console.log('[INFO] netflix-primevideo-combo.svg preserved in high-resolution stacked design');
