const fs = require('fs');
const path = require('path');

const brandDir = path.join(__dirname, '..', 'public', 'assets', 'brands');
if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

const sources = [
  { name: 'youtube-premium.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/YouTube_Premium_logo.svg' },
  { name: 'spotify.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg' },
  { name: 'adobe-creative-cloud.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Adobe_Creative_Cloud_rainbow_icon.svg' },
  { name: 'claude-ai.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/8/8a/Claude_AI_logo.svg' },
  { name: 'grammarly.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Grammarly_logo.svg' },
  { name: 'hbo-max.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/1/17/HBO_Max_Logo.svg' },
  { name: 'microsoft-365.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/Microsoft_365_%282022%29.svg' },
  { name: 'netflix.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg' },
  { name: 'prime-video.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Amazon_Prime_Video_logo.svg' },
  { name: 'crunchyroll.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Crunchyroll_Logo.svg' },
  { name: 'disney-plus.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Disney%2B_logo.svg' },
  { name: 'hoichoi.png', url: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Hoichoi-Logos-3.png' },
  { name: 'chorki.png', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/Chorki_Logo.png' },
  { name: 'chatgpt.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg' },
  { name: 'midjourney.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Midjourney_Emblem.svg' },
  { name: 'apple-music.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/Apple_Music_icon.svg' },
  { name: 'google-one.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/3/34/Google_One_logo.svg' },
  { name: 'canva.svg', url: 'https://upload.wikimedia.org/wikipedia/en/b/bb/Canva_Logo.svg' },
  { name: 'nordvpn.svg', url: 'https://upload.wikimedia.org/wikipedia/commons/4/48/NordVPN_logo.svg' }
];

async function downloadAll() {
  console.log('Downloading actual official brand logos from Wikimedia...');
  for (const item of sources) {
    try {
      const res = await fetch(item.url, {
        headers: { 'User-Agent': 'FlixStoreApp/1.0 (contact@flixstore.org)' }
      });
      if (!res.ok) {
        console.error(`[FAIL] ${item.name} status: ${res.status}`);
        continue;
      }
      const buffer = Buffer.from(await res.arrayBuffer());
      const dest = path.join(brandDir, item.name);
      fs.writeFileSync(dest, buffer);
      console.log(`[DOWNLOADED] ${item.name} (${buffer.length} bytes)`);
    } catch (err) {
      console.error(`[ERROR] ${item.name}: ${err.message}`);
    }
  }
  console.log('All downloads completed!');
}

downloadAll();
