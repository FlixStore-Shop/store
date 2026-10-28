const https = require('https');

async function getSvg(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'FlixStoreApp/1.0 (contact@flixstore.org)' } });
  return await res.text();
}

async function run() {
  const yt = await getSvg('https://upload.wikimedia.org/wikipedia/commons/d/dd/YouTube_Premium_logo.svg');
  console.log('YouTube length:', yt.length);
  const fills = yt.match(/fill="[^"]+"/g) || [];
  console.log('YouTube fills:', [...new Set(fills)]);

  const sp = await getSvg('https://upload.wikimedia.org/wikipedia/commons/2/26/Spotify_logo_with_text.svg');
  console.log('Spotify length:', sp.length);
  const spFills = sp.match(/fill="[^"]+"/g) || [];
  console.log('Spotify fills:', [...new Set(spFills)]);
}

run();
