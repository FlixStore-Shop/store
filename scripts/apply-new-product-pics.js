const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();
const { db, initDatabase } = require('../db/database');

const fileMapping = {
  'AdobeCreativeCloude.jpg': 'adobe-creative-cloud.jpg',
  'AppleMusic.jpg': 'apple-music.jpg',
  'Canva.jpg': 'canva.jpg',
  'ChatGpt.jpg': 'chatgpt.jpg',
  'Chorki.jpg': 'chorki.jpg',
  'ClaudePro.jpg': 'claude-pro.jpg',
  'Crunchyroll.jpg': 'crunchyroll.jpg',
  'GoggleOne.jpg': 'google-one.jpg',
  'Grammarly.jpg': 'grammarly.jpg',
  'HboMax.jpg': 'hbo-max.jpg',
  'Hoichoi.jpg': 'hoichoi.jpg',
  'Netflix.jpg': 'netflix.jpg',
  'Office365.jpg': 'microsoft-365.jpg',
  'PrimeVideo.jpg': 'prime-video.jpg',
  'Spotify.jpg': 'spotify.jpg',
  'YouTube Premium.jpg': 'youtube-premium.jpg',
};

const slugMapping = {
  'adobe-creative-cloud-all-apps': '/assets/products/adobe-creative-cloud.jpg',
  'apple-music-premium': '/assets/products/apple-music.jpg',
  'canva-pro-subscription': '/assets/products/canva.jpg',
  'chatgpt-plus-openai': '/assets/products/chatgpt.jpg',
  'chorki-premium': '/assets/products/chorki.jpg',
  'claude-pro-anthropic': '/assets/products/claude-pro.jpg',
  'crunchyroll-mega-fan': '/assets/products/crunchyroll.jpg',
  'google-one-2tb-cloud': '/assets/products/google-one.jpg',
  'grammarly-premium-ai': '/assets/products/grammarly.jpg',
  'hbo-max-streaming': '/assets/products/hbo-max.jpg',
  'hoichoi-premium': '/assets/products/hoichoi.jpg',
  'netflix-premium-4k-uhd': '/assets/products/netflix.jpg',
  'microsoft-365-office-suite': '/assets/products/microsoft-365.jpg',
  'amazon-prime-video': '/assets/products/prime-video.jpg',
  'spotify-premium-individual': '/assets/products/spotify.jpg',
  'youtube-premium-music': '/assets/products/youtube-premium.jpg',
};

async function main() {
  const rootDir = path.resolve(__dirname, '..');
  const srcDir = path.join(rootDir, 'Product pics');
  const destDirProducts = path.join(rootDir, 'public', 'assets', 'products');
  const destDirBrands = path.join(rootDir, 'public', 'assets', 'brands');

  if (!fs.existsSync(destDirProducts)) {
    fs.mkdirSync(destDirProducts, { recursive: true });
  }
  if (!fs.existsSync(destDirBrands)) {
    fs.mkdirSync(destDirBrands, { recursive: true });
  }

  // 1. Copy files
  console.log('--- 1. Copying Image Files ---');
  for (const [srcName, destName] of Object.entries(fileMapping)) {
    const srcPath = path.join(srcDir, srcName);
    if (!fs.existsSync(srcPath)) {
      console.error(`Source file not found: ${srcPath}`);
      continue;
    }
    const targetProducts = path.join(destDirProducts, destName);
    const targetBrands = path.join(destDirBrands, destName);
    fs.copyFileSync(srcPath, targetProducts);
    fs.copyFileSync(srcPath, targetBrands);
    console.log(`Copied: ${srcName} -> ${destName}`);
  }

  // 2. Update Database
  console.log('\n--- 2. Updating Database Records ---');
  await initDatabase();

  for (const [slug, newLogoUrl] of Object.entries(slugMapping)) {
    const res = await db.prepare('UPDATE products SET logo_url = ? WHERE slug = ?').run(newLogoUrl, slug);
    console.log(`Updated [${slug}] -> ${newLogoUrl} (changes: ${res.changes || 1})`);
  }

  // Double check all products in DB
  const allProducts = await db.prepare('SELECT id, slug, title, logo_url FROM products ORDER BY id ASC').all();
  console.log('\n--- Active Catalog Products ---');
  console.table(allProducts);

  console.log('\nAll product images and database records updated successfully!');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
