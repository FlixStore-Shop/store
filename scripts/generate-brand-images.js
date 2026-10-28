const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '..', 'public', 'assets', 'products');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log('Generating authentic real brand artworks in:', targetDir);

// Helper to generate SVG wrapper
function createSvgCard({
  bgGradient,
  glowColor,
  logoSvg,
  brandTitle,
  brandSubtitle,
  badgeText,
  badgeColor = '#3b82f6',
  badgeBg = 'rgba(59, 130, 246, 0.2)'
}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 360" width="100%" height="100%">
  <defs>
    ${bgGradient}
    <radialGradient id="cardGlow" cx="50%" cy="45%" r="50%">
      <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${glowColor}" stop-opacity="0"/>
    </radialGradient>
    <filter id="dropGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="${glowColor}" flood-opacity="0.6"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="600" height="360" fill="url(#cardBg)"/>
  <rect width="600" height="360" fill="url(#cardGlow)"/>

  <!-- Subtle Ambient Grid / Accents -->
  <g opacity="0.08" stroke="#ffffff" stroke-width="1">
    <line x1="0" y1="90" x2="600" y2="90" />
    <line x1="0" y1="180" x2="600" y2="180" />
    <line x1="0" y1="270" x2="600" y2="270" />
    <line x1="150" y1="0" x2="150" y2="360" />
    <line x1="300" y1="0" x2="300" y2="360" />
    <line x1="450" y1="0" x2="450" y2="360" />
  </g>

  <!-- Centered Official Logo Artwork -->
  <g transform="translate(300, 140)">
    ${logoSvg}
  </g>

  <!-- Brand Title -->
  <text x="300" y="245" 
    text-anchor="middle" 
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
    font-size="28" 
    font-weight="800" 
    fill="#ffffff" 
    letter-spacing="0.5">
    ${brandTitle}
  </text>

  <!-- Badge Pill -->
  ${badgeText ? `
  <g transform="translate(300, 275)">
    <rect x="-70" y="-12" width="140" height="24" rx="12" fill="${badgeBg}" stroke="${badgeColor}" stroke-width="1.2"/>
    <text x="0" y="4" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, sans-serif" font-size="11" font-weight="700" fill="${badgeColor}" letter-spacing="1">
      ${badgeText}
    </text>
  </g>` : ''}

  <!-- Feature Subtitle -->
  <text x="300" y="320" 
    text-anchor="middle" 
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
    font-size="13" 
    font-weight="500" 
    fill="rgba(255, 255, 255, 0.7)" 
    letter-spacing="0.3">
    ${brandSubtitle}
  </text>
</svg>`;
}

const assets = {
  // 1. YouTube Premium & Music
  'youtube-premium': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#140202"/>
      <stop offset="50%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1f0303"/>
    </linearGradient>`,
    glowColor: '#ff0000',
    logoSvg: `
      <!-- Red YouTube Play Button -->
      <g filter="url(#dropGlow)" transform="translate(-50, -45)">
        <rect width="100" height="70" rx="20" fill="#FF0000"/>
        <polygon points="40,20 40,50 68,35" fill="#FFFFFF"/>
      </g>
    `,
    brandTitle: 'YouTube Premium',
    brandSubtitle: 'Zero Ads • Background Play • YouTube Music',
    badgeText: 'PREMIUM SOUND',
    badgeColor: '#ff4e4e',
    badgeBg: 'rgba(255, 0, 0, 0.2)'
  }),

  // 2. Spotify Premium Individual
  'spotify-premium': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#02170b"/>
      <stop offset="50%" stop-color="#0a0e0c"/>
      <stop offset="100%" stop-color="#032411"/>
    </linearGradient>`,
    glowColor: '#1DB954',
    logoSvg: `
      <!-- Spotify Green Circle & Waves -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <circle cx="0" cy="0" r="44" fill="#1DB954"/>
        <path d="M-24 -12 C-8 -19 12 -18 25 -10" fill="none" stroke="#000000" stroke-width="6.5" stroke-linecap="round"/>
        <path d="M-21 2 C-7 -4 10 -4 21 3" fill="none" stroke="#000000" stroke-width="5.5" stroke-linecap="round"/>
        <path d="M-18 16 C-7 11 7 11 17 17" fill="none" stroke="#000000" stroke-width="4.5" stroke-linecap="round"/>
      </g>
    `,
    brandTitle: 'Spotify Premium',
    brandSubtitle: 'Ad-Free • Unlimited Skips • Extreme 320kbps Audio',
    badgeText: 'HI-FI LOSSLESS',
    badgeColor: '#1ed760',
    badgeBg: 'rgba(29, 185, 84, 0.2)'
  }),

  // 3. Adobe Creative Cloud
  'adobe-creative-cloud': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1a0c24"/>
      <stop offset="50%" stop-color="#0e1017"/>
      <stop offset="100%" stop-color="#0a1728"/>
    </linearGradient>
    <linearGradient id="adobeRainbow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF0000"/>
      <stop offset="25%" stop-color="#FF7A00"/>
      <stop offset="50%" stop-color="#FF007A"/>
      <stop offset="75%" stop-color="#7B00FF"/>
      <stop offset="100%" stop-color="#00A6FF"/>
    </linearGradient>`,
    glowColor: '#ff007a',
    logoSvg: `
      <!-- Adobe CC Ribbon / Cloud Emblem -->
      <g filter="url(#dropGlow)" transform="translate(0, -15)">
        <path d="M-40 12 C-45 -18 -15 -35 10 -25 C25 -32 48 -18 42 12 C48 24 30 35 15 30 C-10 38 -38 32 -40 12 Z" 
          fill="none" stroke="url(#adobeRainbow)" stroke-width="12" stroke-linejoin="round" stroke-linecap="round"/>
        <!-- App icon squares -->
        <g transform="translate(-60, 42)">
          <rect x="0" y="0" width="24" height="24" rx="5" fill="#001E36"/><text x="12" y="17" fill="#31A8FF" font-size="12" font-weight="900" text-anchor="middle">Ps</text>
          <rect x="32" y="0" width="24" height="24" rx="5" fill="#330000"/><text x="44" y="17" fill="#FF9A00" font-size="12" font-weight="900" text-anchor="middle">Ai</text>
          <rect x="64" y="0" width="24" height="24" rx="5" fill="#00005B"/><text x="76" y="17" fill="#9999FF" font-size="12" font-weight="900" text-anchor="middle">Pr</text>
          <rect x="96" y="0" width="24" height="24" rx="5" fill="#200030"/><text x="108" y="17" fill="#D29BFF" font-size="12" font-weight="900" text-anchor="middle">Ae</text>
        </g>
      </g>
    `,
    brandTitle: 'Adobe Creative Cloud',
    brandSubtitle: '20+ Professional Creative Apps • 100GB Cloud • Firefly AI',
    badgeText: 'MASTER PRO SUITE',
    badgeColor: '#ff3366',
    badgeBg: 'rgba(255, 0, 122, 0.2)'
  }),

  // 4. Claude Pro (Anthropic)
  'claude-pro': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#211510"/>
      <stop offset="50%" stop-color="#0f0c0b"/>
      <stop offset="100%" stop-color="#1f1008"/>
    </linearGradient>`,
    glowColor: '#D97706',
    logoSvg: `
      <!-- Anthropic Claude Spark / Sunburst Logo -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <circle cx="0" cy="0" r="42" fill="#D97706" opacity="0.15"/>
        <g stroke="#E07A5F" stroke-width="8" stroke-linecap="round">
          <line x1="0" y1="-34" x2="0" y2="34"/>
          <line x1="-34" y1="0" x2="34" y2="0"/>
          <line x1="-24" y1="-24" x2="24" y2="24"/>
          <line x1="-24" y1="24" x2="24" y2="-24"/>
        </g>
        <circle cx="0" cy="0" r="10" fill="#E07A5F"/>
      </g>
    `,
    brandTitle: 'Claude Pro (Anthropic)',
    brandSubtitle: 'Claude 3.5 Sonnet • Artifacts • 200K Context Codebase',
    badgeText: 'TOP FOR DEVELOPERS',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(217, 119, 6, 0.2)'
  }),

  // 5. Grammarly Premium AI
  'grammarly-premium': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021c16"/>
      <stop offset="50%" stop-color="#090f0d"/>
      <stop offset="100%" stop-color="#03261e"/>
    </linearGradient>`,
    glowColor: '#15C39A',
    logoSvg: `
      <!-- Official Grammarly Circle Arrow G -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <circle cx="0" cy="0" r="44" fill="#15C39A"/>
        <path d="M-18 -12 C-8 -24 16 -24 24 -10 C32 4 28 20 14 26 C0 32 -16 26 -22 14" 
          fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round"/>
        <polyline points="14,14 24,14 24,4" fill="none" stroke="#FFFFFF" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `,
    brandTitle: 'Grammarly Premium AI',
    brandSubtitle: 'Full Sentence Rewriting • Plagiarism Check • Style Tone',
    badgeText: 'AI WRITING PRO',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.2)'
  }),

  // 6. HBO Max (Max) Premium
  'hbo-max': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#140226"/>
      <stop offset="50%" stop-color="#07030d"/>
      <stop offset="100%" stop-color="#1f033d"/>
    </linearGradient>`,
    glowColor: '#7928CA',
    logoSvg: `
      <!-- HBO Max Logo Typography -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <rect x="-90" y="-36" width="180" height="72" rx="16" fill="rgba(88, 34, 180, 0.4)" stroke="#7928CA" stroke-width="2"/>
        <text x="0" y="14" font-family="'Arial Black', -apple-system, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="4">
          max
        </text>
        <circle cx="28" cy="-8" r="4" fill="#00F0FF"/>
      </g>
    `,
    brandTitle: 'HBO Max (Max) 4K UHD',
    brandSubtitle: 'House of the Dragon • The Last of Us • Warner Bros. 4K',
    badgeText: 'WARNER BROS. DISCOVERY',
    badgeColor: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.2)'
  }),

  // 7. Microsoft 365 (Office 365) + 1TB Cloud
  'microsoft-365': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0c192c"/>
      <stop offset="50%" stop-color="#080e1a"/>
      <stop offset="100%" stop-color="#182b47"/>
    </linearGradient>
    <linearGradient id="msRibbon" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#00A4EF"/>
      <stop offset="50%" stop-color="#7FBA00"/>
      <stop offset="100%" stop-color="#FFB900"/>
    </linearGradient>`,
    glowColor: '#0078D4',
    logoSvg: `
      <!-- Microsoft 365 Hex / Ribbon Mark & Suite Icons -->
      <g filter="url(#dropGlow)" transform="translate(0, -18)">
        <g transform="translate(0, -6)">
          <path d="M-28 -20 C-36 0 -12 28 8 28 C28 28 36 8 36 -10 C36 -28 14 -32 -4 -22 C-18 -14 -22 -2 -14 12" 
            fill="none" stroke="url(#msRibbon)" stroke-width="11" stroke-linecap="round"/>
        </g>
        <g transform="translate(-75, 42)">
          <rect x="0" y="0" width="26" height="26" rx="6" fill="#185ABD"/><text x="13" y="18" fill="#FFFFFF" font-size="13" font-weight="900" text-anchor="middle">W</text>
          <rect x="36" y="0" width="26" height="26" rx="6" fill="#107C41"/><text x="49" y="18" fill="#FFFFFF" font-size="13" font-weight="900" text-anchor="middle">X</text>
          <rect x="72" y="0" width="26" height="26" rx="6" fill="#C43E1C"/><text x="85" y="18" fill="#FFFFFF" font-size="13" font-weight="900" text-anchor="middle">P</text>
          <rect x="108" y="0" width="26" height="26" rx="6" fill="#0078D4"/><path d="M116 17 C116 12 124 10 128 13 C132 11 138 14 136 18 Z" fill="#FFFFFF"/>
        </g>
      </g>
    `,
    brandTitle: 'Microsoft 365 (Office)',
    brandSubtitle: 'Word • Excel • PowerPoint • 1TB OneDrive Storage',
    badgeText: 'GENUINE LICENSE',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)'
  }),

  // 8. Netflix Premium 4K UHD
  'netflix': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#240303"/>
      <stop offset="50%" stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#1f0202"/>
    </linearGradient>`,
    glowColor: '#E50914',
    logoSvg: `
      <!-- Netflix Iconic Red N -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <path d="M-24 -40 L-10 -40 L-10 40 L-24 40 Z" fill="#B81D24"/>
        <path d="M10 -40 L24 -40 L24 40 L10 40 Z" fill="#B81D24"/>
        <path d="M-24 -40 L-10 -40 L24 40 L10 40 Z" fill="#E50914"/>
      </g>
    `,
    brandTitle: 'Netflix Premium 4K',
    brandSubtitle: '4K Ultra HD • HDR10 • Spatial Audio • Dolby Atmos',
    badgeText: 'OFFICIAL 4K UHD',
    badgeColor: '#ef4444',
    badgeBg: 'rgba(229, 9, 20, 0.2)'
  }),

  // 9. Amazon Prime Video
  'amazon-prime-video': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#031626"/>
      <stop offset="50%" stop-color="#050a12"/>
      <stop offset="100%" stop-color="#03213b"/>
    </linearGradient>`,
    glowColor: '#00A8E1',
    logoSvg: `
      <!-- Prime Video Logo & Arrow -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <text x="0" y="8" font-family="'Segoe UI', -apple-system, sans-serif" font-size="38" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="1">
          prime video
        </text>
        <path d="M-55 22 Q-10 42 45 25" fill="none" stroke="#00A8E1" stroke-width="6" stroke-linecap="round"/>
        <polygon points="45,18 55,27 42,32" fill="#00A8E1"/>
      </g>
    `,
    brandTitle: 'Amazon Prime Video',
    brandSubtitle: 'The Boys • Rings of Power • Fallout • X-Ray Trivia',
    badgeText: 'PRIME ORIGINALS',
    badgeColor: '#00a8e1',
    badgeBg: 'rgba(0, 168, 225, 0.2)'
  }),

  // 10. Crunchyroll Mega Fan
  'crunchyroll': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#241203"/>
      <stop offset="50%" stop-color="#0d0905"/>
      <stop offset="100%" stop-color="#2b1402"/>
    </linearGradient>`,
    glowColor: '#F47521',
    logoSvg: `
      <!-- Crunchyroll Stylized Anime Eye Circle -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <circle cx="0" cy="0" r="44" fill="#F47521"/>
        <circle cx="10" cy="-2" r="28" fill="#0d0905"/>
        <circle cx="18" cy="-2" r="14" fill="#F47521"/>
      </g>
    `,
    brandTitle: 'Crunchyroll Mega Fan',
    brandSubtitle: 'Simulcast 1 hr after Japan • 1,000+ Anime Series • Zero Ads',
    badgeText: 'ANIME DESTINATION',
    badgeColor: '#f97316',
    badgeBg: 'rgba(244, 117, 33, 0.2)'
  }),

  // 11. Hoichoi Premium
  'hoichoi': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#260408"/>
      <stop offset="50%" stop-color="#0d0305"/>
      <stop offset="100%" stop-color="#240306"/>
    </linearGradient>`,
    glowColor: '#e50914',
    logoSvg: `
      <!-- Hoichoi Bengali Streamer Logo -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <rect x="-85" y="-34" width="170" height="68" rx="16" fill="#e50914"/>
        <text x="0" y="12" font-family="'Arial Black', sans-serif" font-size="34" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="0">
          hoichoi
        </text>
        <path d="M-30 20 Q0 30 30 20" fill="none" stroke="#FBBF24" stroke-width="4" stroke-linecap="round"/>
      </g>
    `,
    brandTitle: 'Hoichoi Premium',
    brandSubtitle: 'Feluda • Byomkesh • Eken Babu • 600+ Bengali Hits',
    badgeText: 'BENGALI CINEMA #1',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.2)'
  }),

  // 12. Chorki Premium
  'chorki': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#241402"/>
      <stop offset="50%" stop-color="#0d0903"/>
      <stop offset="100%" stop-color="#240a02"/>
    </linearGradient>`,
    glowColor: '#F59E0B',
    logoSvg: `
      <!-- Chorki Pinwheel / Flame Mark -->
      <g filter="url(#dropGlow)" transform="translate(0, -12)">
        <circle cx="0" cy="0" r="42" fill="#F59E0B"/>
        <path d="M0 -34 Q20 -15 15 0 Q20 25 0 34 Q-20 15 -15 0 Q-20 -25 0 -34 Z" fill="#DC2626"/>
        <circle cx="0" cy="0" r="10" fill="#FFFFFF"/>
      </g>
    `,
    brandTitle: 'Chorki Premium',
    brandSubtitle: 'Syndicate • Pett Kata Shaw • Redrum • Film, Fun, Foorti',
    badgeText: 'DHAKA FAVORITE',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.2)'
  }),

  // 13. ChatGPT Plus (OpenAI)
  'chatgpt-plus': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#021c17"/>
      <stop offset="50%" stop-color="#060c0b"/>
      <stop offset="100%" stop-color="#032620"/>
    </linearGradient>`,
    glowColor: '#10A37F',
    logoSvg: `
      <!-- OpenAI Rosette -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <circle cx="0" cy="0" r="44" fill="#10A37F"/>
        <!-- Simplified spiral petals -->
        <g stroke="#FFFFFF" stroke-width="5" fill="none" stroke-linecap="round">
          <path d="M0 -22 C14 -22 22 -14 22 0 C22 14 14 22 0 22 C-14 22 -22 14 -22 0 C-22 -14 -14 -22 0 -22"/>
          <path d="M-12 -12 L12 12"/>
          <path d="M12 -12 L-12 12"/>
        </g>
        <circle cx="0" cy="0" r="7" fill="#FFFFFF"/>
      </g>
    `,
    brandTitle: 'ChatGPT Plus (OpenAI)',
    brandSubtitle: 'GPT-4o • OpenAI o1 • DALL-E 3 • Voice & Canvas Mode',
    badgeText: 'AI SUPERPOWER',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.2)'
  }),

  // 14. Disney+ Premium 4K
  'disney-plus': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020e26"/>
      <stop offset="50%" stop-color="#040714"/>
      <stop offset="100%" stop-color="#05193d"/>
    </linearGradient>`,
    glowColor: '#00F0FF',
    logoSvg: `
      <!-- Disney+ Arc & Typography -->
      <g filter="url(#dropGlow)" transform="translate(0, -12)">
        <path d="M-80 30 Q0 -35 80 15" fill="none" stroke="#00F0FF" stroke-width="5" stroke-linecap="round"/>
        <text x="-15" y="14" font-family="'Impact', 'Arial Black', sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle" letter-spacing="2">
          Disney
        </text>
        <text x="55" y="10" font-family="'Arial Black', sans-serif" font-size="40" font-weight="900" fill="#00F0FF" text-anchor="middle">
          +
        </text>
      </g>
    `,
    brandTitle: 'Disney+ Premium 4K',
    brandSubtitle: 'Marvel Studios • Star Wars • Pixar • National Geographic',
    badgeText: 'IMAX ENHANCED',
    badgeColor: '#00f0ff',
    badgeBg: 'rgba(0, 240, 255, 0.2)'
  }),

  // 15. Netflix + Prime Video Combo Pack
  'netflix-primevideo-combo': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#290204"/>
      <stop offset="50%" stop-color="#08080c"/>
      <stop offset="100%" stop-color="#02162b"/>
    </linearGradient>`,
    glowColor: '#E50914',
    logoSvg: `
      <!-- Dual Combo Emblems -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <!-- Left: Netflix N -->
        <g transform="translate(-55, 0) scale(0.7)">
          <path d="M-24 -40 L-10 -40 L-10 40 L-24 40 Z" fill="#B81D24"/>
          <path d="M10 -40 L24 -40 L24 40 L10 40 Z" fill="#B81D24"/>
          <path d="M-24 -40 L-10 -40 L24 40 L10 40 Z" fill="#E50914"/>
        </g>
        <!-- Center Plus -->
        <text x="0" y="8" font-family="sans-serif" font-size="34" font-weight="900" fill="#FBBF24" text-anchor="middle">+</text>
        <!-- Right: Prime Video -->
        <g transform="translate(55, 0)">
          <circle cx="0" cy="0" r="30" fill="#00A8E1"/>
          <path d="M-15 4 Q0 16 15 4" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>
          <polygon points="13,0 19,5 12,8" fill="#FFFFFF"/>
        </g>
      </g>
    `,
    brandTitle: 'Netflix + Prime Video',
    brandSubtitle: '2-in-1 Master Entertainment Bundle • 4K UHD Across Both',
    badgeText: '80% SUPER SAVER',
    badgeColor: '#fbbf24',
    badgeBg: 'rgba(251, 191, 36, 0.2)'
  }),

  // 16. Midjourney Pro Plan
  'midjourney': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a0e26"/>
      <stop offset="50%" stop-color="#050714"/>
      <stop offset="100%" stop-color="#141438"/>
    </linearGradient>`,
    glowColor: '#60a5fa',
    logoSvg: `
      <!-- Midjourney Sailboat Emblem -->
      <g filter="url(#dropGlow)" transform="translate(0, -12)">
        <circle cx="0" cy="0" r="42" fill="rgba(96, 165, 250, 0.15)" stroke="#60a5fa" stroke-width="2"/>
        <path d="M0 -28 L0 24 M-18 20 C-6 28 6 28 18 20 L0 -24 Z" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>
        <line x1="-15" y1="2" x2="0" y2="-12" stroke="#60a5fa" stroke-width="4"/>
      </g>
    `,
    brandTitle: 'Midjourney Pro Plan',
    brandSubtitle: 'Photorealistic AI Art • Relax GPU • Commercial License',
    badgeText: 'CREATIVE AI',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(96, 165, 250, 0.2)'
  }),

  // 17. Apple Music Premium
  'apple-music': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#24050f"/>
      <stop offset="50%" stop-color="#0d0407"/>
      <stop offset="100%" stop-color="#240715"/>
    </linearGradient>`,
    glowColor: '#FA243C',
    logoSvg: `
      <!-- Apple Music Note -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <rect x="-42" y="-42" width="84" height="84" rx="22" fill="#FA243C"/>
        <path d="M-8 22 C-14 22 -18 18 -18 13 C-18 8 -13 5 -6 5 L-6 -18 L16 -24 L16 14 C10 14 6 10 6 5 C6 0 11 -3 16 -3" 
          fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
    `,
    brandTitle: 'Apple Music Premium',
    brandSubtitle: '100M+ Songs • Lossless Audio (24-bit/192kHz) • Spatial Audio',
    badgeText: 'DOLBY ATMOS',
    badgeColor: '#fa243c',
    badgeBg: 'rgba(250, 36, 60, 0.2)'
  }),

  // 18. Google One 2TB Cloud + Gemini
  'google-one': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1426"/>
      <stop offset="50%" stop-color="#060a12"/>
      <stop offset="100%" stop-color="#142138"/>
    </linearGradient>`,
    glowColor: '#4285F4',
    logoSvg: `
      <!-- Google 4-Color Ring -->
      <g filter="url(#dropGlow)" transform="translate(0, -12)">
        <circle cx="0" cy="0" r="42" fill="none" stroke="#4285F4" stroke-width="8" stroke-dasharray="66 198"/>
        <circle cx="0" cy="0" r="42" fill="none" stroke="#EA4335" stroke-width="8" stroke-dasharray="66 198" stroke-dashoffset="-66"/>
        <circle cx="0" cy="0" r="42" fill="none" stroke="#FBBC05" stroke-width="8" stroke-dasharray="66 198" stroke-dashoffset="-132"/>
        <circle cx="0" cy="0" r="42" fill="none" stroke="#34A853" stroke-width="8" stroke-dasharray="66 198" stroke-dashoffset="-198"/>
        <text x="0" y="10" font-family="'Product Sans', sans-serif" font-size="28" font-weight="900" fill="#FFFFFF" text-anchor="middle">1</text>
      </g>
    `,
    brandTitle: 'Google One 2TB Cloud',
    brandSubtitle: '2TB Storage • Original Quality Photos • Gemini Advanced',
    badgeText: '2,000 GB STORAGE',
    badgeColor: '#60a5fa',
    badgeBg: 'rgba(66, 133, 244, 0.2)'
  }),

  // 19. Canva Pro Subscription
  'canva-pro': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#031f24"/>
      <stop offset="50%" stop-color="#060f14"/>
      <stop offset="100%" stop-color="#042630"/>
    </linearGradient>`,
    glowColor: '#00C4CC',
    logoSvg: `
      <!-- Canva Script & Crown -->
      <g filter="url(#dropGlow)" transform="translate(0, -12)">
        <circle cx="0" cy="0" r="44" fill="#00C4CC"/>
        <text x="0" y="14" font-family="'Brush Script MT', cursive, sans-serif" font-size="44" font-weight="900" fill="#FFFFFF" text-anchor="middle">
          Canva
        </text>
        <!-- Crown -->
        <polygon points="-12,-38 0,-48 12,-38 8,-30 -8,-30" fill="#FBBF24"/>
      </g>
    `,
    brandTitle: 'Canva Pro Lifetime',
    brandSubtitle: '100M+ Stock Assets • 1-Click Background Remover • Magic AI',
    badgeText: 'BRAND KIT UNLOCKED',
    badgeColor: '#2dd4bf',
    badgeBg: 'rgba(0, 196, 204, 0.2)'
  }),

  // 20. NordVPN & Threat Protection
  'nordvpn': createSvgCard({
    bgGradient: `<linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#03162b"/>
      <stop offset="50%" stop-color="#060d17"/>
      <stop offset="100%" stop-color="#082245"/>
    </linearGradient>`,
    glowColor: '#4687FF',
    logoSvg: `
      <!-- NordVPN Mountain Crest -->
      <g filter="url(#dropGlow)" transform="translate(0, -10)">
        <circle cx="0" cy="0" r="44" fill="#4687FF"/>
        <path d="M-26 20 L-10 -16 L2 4 L14 -8 L26 20 Z" fill="#FFFFFF"/>
        <path d="M-10 -16 L-2 4 L2 4 Z" fill="#D0E2FF"/>
      </g>
    `,
    brandTitle: 'NordVPN & Security',
    brandSubtitle: '6,400+ 10Gbps Servers • Threat Protection • No-Logs Policy',
    badgeText: 'MILITARY ENCRYPTION',
    badgeColor: '#38bdf8',
    badgeBg: 'rgba(70, 135, 255, 0.2)'
  })
};

// Write each SVG
for (const [name, svgContent] of Object.entries(assets)) {
  const filePath = path.join(targetDir, `${name}.svg`);
  fs.writeFileSync(filePath, svgContent, 'utf-8');
  console.log(`[SAVED] ${filePath}`);
}

console.log('[SUCCESS] All 20 real product pictures generated successfully!');
