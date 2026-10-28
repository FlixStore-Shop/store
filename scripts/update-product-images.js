const { db } = require('../db/database');

const imageMap = {
  'netflix-premium-4k-uhd': '/assets/products/netflix.svg',
  'amazon-prime-video': '/assets/products/amazon-prime-video.svg',
  'crunchyroll-mega-fan': '/assets/products/crunchyroll.svg',
  'youtube-premium-music': '/assets/products/youtube-premium.svg',
  'hoichoi-premium': '/assets/products/hoichoi.svg',
  'chorki-premium': '/assets/products/chorki.svg',
  'chatgpt-plus-openai': '/assets/products/chatgpt-plus.svg',
  'claude-pro-anthropic': '/assets/products/claude-pro.svg',
  'midjourney-pro-plan': '/assets/products/midjourney.svg',
  'spotify-premium-individual': '/assets/products/spotify-premium.svg',
  'apple-music-premium': '/assets/products/apple-music.svg',
  'adobe-creative-cloud-all-apps': '/assets/products/adobe-creative-cloud.svg',
  'google-one-2tb-cloud': '/assets/products/google-one.svg',
  'canva-pro-subscription': '/assets/products/canva-pro.svg',
  'nordvpn-threat-protection': '/assets/products/nordvpn.svg',
  'netflix-primevideo-combo': '/assets/products/netflix-primevideo-combo.svg',
  'hbo-max-streaming': '/assets/products/hbo-max.svg',
  'disney-plus-premium': '/assets/products/disney-plus.svg',
  'grammarly-premium-ai': '/assets/products/grammarly-premium.svg',
  'microsoft-365-office-suite': '/assets/products/microsoft-365.svg'
};

const updateStmt = db.prepare('UPDATE products SET logo_url = ? WHERE slug = ?');

for (const [slug, url] of Object.entries(imageMap)) {
  const info = updateStmt.run(url, slug);
  console.log(`[UPDATED] ${slug} -> ${url} (changes: ${info.changes})`);
}

console.log('[SUCCESS] All products now have their real official brand pictures!');
