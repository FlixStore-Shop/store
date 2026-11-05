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

// 3. netflix-primevideo-combo.svg uses high-resolution stacked artwork with transparent background
console.log('[INFO] netflix-primevideo-combo.svg: preserved high-res stacked design');
