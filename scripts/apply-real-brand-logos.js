const fs = require('fs');
const path = require('path');
const { db } = require('../db/database');

const brandMap = {
  'netflix-premium-4k-uhd': '/assets/brands/netflix.svg',
  'amazon-prime-video': '/assets/brands/prime-video.svg',
  'crunchyroll-mega-fan': '/assets/brands/crunchyroll.svg',
  'youtube-premium-music': '/assets/brands/youtube-premium.svg',
  'hoichoi-premium': '/assets/brands/hoichoi.png',
  'chorki-premium': '/assets/brands/chorki.png',
  'chatgpt-plus-openai': '/assets/brands/chatgpt.svg',
  'claude-pro-anthropic': '/assets/brands/claude-ai.svg',
  'midjourney-pro-plan': '/assets/brands/midjourney.svg',
  'spotify-premium-individual': '/assets/brands/spotify.svg',
  'apple-music-premium': '/assets/brands/apple-music.svg',
  'adobe-creative-cloud-all-apps': '/assets/brands/adobe-creative-cloud.svg',
  'google-one-2tb-cloud': '/assets/brands/google-one.svg',
  'canva-pro-subscription': '/assets/brands/canva.svg',
  'nordvpn-threat-protection': '/assets/brands/nordvpn.svg',
  'netflix-primevideo-combo': '/assets/brands/netflix-primevideo-combo.svg',
  'hbo-max-streaming': '/assets/brands/hbo-max.svg',
  'disney-plus-premium': '/assets/brands/disney-plus.svg',
  'grammarly-premium-ai': '/assets/brands/grammarly.svg',
  'microsoft-365-office-suite': '/assets/brands/microsoft-365.svg'
};

// 1. Update flixstore.db
const updateStmt = db.prepare('UPDATE products SET logo_url = ? WHERE slug = ?');
for (const [slug, url] of Object.entries(brandMap)) {
  updateStmt.run(url, slug);
}
console.log('[OK] Updated flixstore.db with official brand logos from Wikimedia');

// 2. Update files: db/database.js and scripts/update-catalog.js
['scripts/update-catalog.js', 'db/database.js'].forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (!fs.existsSync(fullPath)) return;
  let text = fs.readFileSync(fullPath, 'utf-8');

  for (const [slug, url] of Object.entries(brandMap)) {
    const slugIdx = text.indexOf(`slug: '${slug}'`);
    if (slugIdx !== -1) {
      const logoIdx = text.indexOf('logo_url:', slugIdx);
      if (logoIdx !== -1 && logoIdx - slugIdx < 600) {
        const lineEnd = text.indexOf('\n', logoIdx);
        text = text.substring(0, logoIdx) + `logo_url: '${url}',` + text.substring(lineEnd + 1);
      }
    }
  }
  fs.writeFileSync(fullPath, text, 'utf-8');
  console.log(`[OK] Updated ${file}`);
});
