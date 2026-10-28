const { db } = require('../db/database');

console.log('--- Migrating FlixStore Database with Updated Pricing & New Products ---');

// 1. Ensure original_price_bdt column exists
try {
  db.exec('ALTER TABLE products ADD COLUMN original_price_bdt REAL;');
  console.log('[OK] Added original_price_bdt to products');
} catch (e) {
  console.log('[INFO] Column original_price_bdt already exists on products');
}

try {
  db.exec('ALTER TABLE product_plans ADD COLUMN original_price_bdt REAL;');
  console.log('[OK] Added original_price_bdt to product_plans');
} catch (e) {
  console.log('[INFO] Column original_price_bdt already exists on product_plans');
}

// 2. Comprehensive catalog definition
const catalog = [
  // 1. Netflix
  {
    cat_slug: 'ott-streaming',
    slug: 'netflix-premium-4k-uhd',
    title: 'Netflix Premium 4K UHD',
    tagline: '4K Ultra HD + HDR, Dolby Atmos & Spatial Audio',
    description: 'Stream unlimited movies, TV shows, and award-winning Netflix Originals in crystal clear 4K Ultra HD. 100% genuine guaranteed account with instant renewal warranty.',
    logo_url: '/assets/brands/netflix.svg',    base_price: 2.49,
    original_price: 5.00,
    original_price_bdt: 600,
    rating: 4.98,
    review_count: 1482,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 1,
    features_list: JSON.stringify([
      'Ultra HD 4K (3840 x 2160) + HDR10 / Dolby Vision',
      'Spatial Audio included on compatible titles',
      'Watch on Smart TV, Laptop, Phone, Tablet & Console',
      'Private PIN-protected profile or Shared screen available',
      'Instant Automated Credential Delivery within 60 seconds',
      '100% Replacement Warranty for the entire duration'
    ]),
    instructions: 'Login to netflix.com with the provided credentials. Select your assigned profile name and enter the private PIN if applicable. Do not change master email or password.',
    plans: [
      { name: '1 Month - Shared Screen', tier: 'shared', months: 1, label: '1 Month (Shared Screen)', usd: 2.49, bdt: 299, orig_usd: 5.00, orig_bdt: 600, popular: 0, devices: '1 Screen (Shared)', features: '1 Screen at a time, Shared Profile, Ultra HD 4K, Replacement Warranty' },
      { name: '3 Months - Shared Screen', tier: 'shared', months: 3, label: '3 Months (Shared Screen)', usd: 6.66, bdt: 799, orig_usd: 15.00, orig_bdt: 1800, popular: 0, devices: '1 Screen (Shared)', features: '90 Days Continuous 4K Streaming, Shared Profile, Auto Warranty' },
      { name: '1 Month - Personal (Private PIN)', tier: 'private', months: 1, label: '1 Month (Private PIN Profile)', usd: 4.16, bdt: 499, orig_usd: 10.00, orig_bdt: 1200, popular: 1, devices: '1 Screen (Private PIN)', features: 'Private PIN-locked Profile, Watch History Saved, 4K HDR10, Full Warranty' },
      { name: '3 Months - Personal (Private PIN)', tier: 'private', months: 3, label: '3 Months (Private PIN Profile)', usd: 11.66, bdt: 1399, orig_usd: 30.00, orig_bdt: 3600, popular: 0, devices: '1 Screen (Private PIN)', features: '90 Days Dedicated PIN Profile, Best Personal Value, Priority Support' }
    ],
    vault: [
      { type: 'account', email: 'netflix.vip01@flixstore-auth.com', pass: 'Nflx2026#Secure91', profile: 'User VIP 1', pin: '4821', instr: 'Use Profile 1 with PIN 4821. Enjoy 4K UHD streaming!' },
      { type: 'account', email: 'netflix.vip02@flixstore-auth.com', pass: 'FlixPrime$7732', profile: 'User VIP 2', pin: '9034', instr: 'Use Profile 2 with PIN 9034. Enjoy 4K UHD streaming!' }
    ]
  },

  // 2. Amazon Prime Video
  {
    cat_slug: 'ott-streaming',
    slug: 'amazon-prime-video',
    title: 'Amazon Prime Video',
    tagline: 'Prime Originals, Exclusive Sports, 4K UHD & X-Ray',
    description: 'Enjoy exclusive Amazon Originals like The Boys, Rings of Power, Fallout, plus thousands of blockbuster movies and regional hits with X-Ray trivia and offline downloads.',
    logo_url: '/assets/brands/prime-video.svg',    base_price: 1.25,
    original_price: 6.25,
    original_price_bdt: 750,
    rating: 4.89,
    review_count: 642,
    is_featured: 1,
    is_trending: 0,
    is_bestseller: 0,
    features_list: JSON.stringify([
      '4K Ultra HD & HDR playback',
      'Exclusive Amazon Originals & Hollywood hits',
      'Offline video downloads on mobile/tablets',
      'Worldwide server compatibility without VPN',
      '24/7 instant support & replacement guarantee'
    ]),
    instructions: 'Login to primevideo.com using the email and password sent to your order details. Stream from any supported device.',
    plans: [
      { name: '1 Month - Prime Video', tier: 'shared', months: 1, label: '1 Month Access', usd: 1.25, bdt: 150, orig_usd: 6.25, orig_bdt: 750, popular: 0, devices: '1 Screen', features: '4K Ultra HD & HDR, Prime Originals, Full Warranty' },
      { name: '3 Months - Prime Video', tier: 'private', months: 3, label: '3 Months Access', usd: 3.33, bdt: 399, orig_usd: 18.75, orig_bdt: 2250, popular: 1, devices: '1 Screen (Dedicated)', features: '3 Months Dedicated Profile, Offline Downloads, Full Warranty' },
      { name: '6 Months - Prime Video', tier: 'private', months: 6, label: '6 Months Access', usd: 7.08, bdt: 850, orig_usd: 37.50, orig_bdt: 4500, popular: 0, devices: '1 Screen (Dedicated)', features: '6 Months Continuous Stream, Huge Saver, Instant Replacement' }
    ],
    vault: [
      { type: 'account', email: 'prime.stream01@flixstore-auth.com', pass: 'AmzVideo#2026x', profile: 'Flix User 1', pin: '', instr: 'Log in at primevideo.com. Stream on 1 screen.' }
    ]
  },

  // 3. Crunchyroll Mega Fan
  {
    cat_slug: 'ott-streaming',
    slug: 'crunchyroll-mega-fan',
    title: 'Crunchyroll Mega Fan',
    tagline: 'Unlimited Anime, Simulcasts 1 hr after Japan, Zero Ads',
    description: 'The premier global anime destination. Stream Demon Slayer, Jujutsu Kaisen, Attack on Titan, Solo Leveling and 1,000+ anime titles ad-free in 1080p Full HD with offline viewing.',
    logo_url: '/assets/brands/crunchyroll.svg',    base_price: 2.08,
    original_price: 8.33,
    original_price_bdt: 999,
    rating: 4.95,
    review_count: 810,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Full HD 1080p anime streaming with zero advertisements',
      'Simulcast episodes 1 hour after Japanese TV broadcast',
      'Offline viewing on mobile iOS & Android devices',
      'Access to full Crunchyroll digital manga library',
      'Game Vault access on mobile'
    ]),
    instructions: 'Sign in to crunchyroll.com or the Crunchyroll mobile app with provided credentials.',
    plans: [
      { name: '1 Month - Mega Fan', tier: 'private', months: 1, label: '1 Month (Mega Fan)', usd: 2.08, bdt: 250, orig_usd: 8.33, orig_bdt: 999, popular: 0, devices: '1 Device', features: 'Ad-free Full HD anime, Simulcasts 1 hr after Japan, Offline viewing' },
      { name: '3 Months - Mega Fan', tier: 'private', months: 3, label: '3 Months (Mega Fan)', usd: 2.92, bdt: 350, orig_usd: 24.99, orig_bdt: 2999, popular: 1, devices: '1 Device', features: '3 Months Uninterrupted Anime, Offline downloads, Digital Manga' },
      { name: '6 Months - Mega Fan', tier: 'private', months: 6, label: '6 Months (Mega Fan)', usd: 8.33, bdt: 999, orig_usd: 49.99, orig_bdt: 5999, popular: 0, devices: '1 Device', features: 'Half-Year Full Access, Game Vault access, 100% Warranty' }
    ],
    vault: [
      { type: 'account', email: 'crunchy.vip@flixstore-auth.com', pass: 'AnimeKing#2026', profile: 'Otaku Member', pin: '', instr: 'Open Crunchyroll app and log in.' }
    ]
  },

  // 4. YouTube Premium & Music
  {
    cat_slug: 'ott-streaming',
    slug: 'youtube-premium-music',
    title: 'YouTube Premium & Music',
    tagline: 'No Ads, Background Play & YouTube Music Included',
    description: 'Elevate your YouTube experience. Watch millions of videos uninterrupted by ads, play videos in the background while multitasking or screen locked, and get complete YouTube Music Premium.',
    logo_url: '/assets/brands/youtube-premium.svg',    base_price: 1.25,
    original_price: 3.33,
    original_price_bdt: 400,
    rating: 4.97,
    review_count: 2130,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 1,
    features_list: JSON.stringify([
      'Zero advertisements on all YouTube videos across all devices',
      'Background play on iOS and Android when screen is off',
      'YouTube Music Premium included with 100M+ songs & playlists',
      'Offline downloads on phone and tablet',
      'Works on your OWN personal Google account via Family Invite!'
    ]),
    instructions: 'You will receive a Google Family Group invite link in your order receipt. Click the link and accept with your personal Gmail to instantly upgrade your account to Premium.',
    plans: [
      { name: '1 Month - Personal Invite', tier: 'family', months: 1, label: '1 Month (Your Own Gmail)', usd: 1.25, bdt: 150, orig_usd: 3.33, orig_bdt: 400, popular: 0, devices: 'All your devices', features: 'Zero Ads, Background Play, YouTube Music Premium included, Own Gmail' },
      { name: '3 Months - Personal Invite', tier: 'family', months: 3, label: '3 Months (Your Own Gmail)', usd: 3.33, bdt: 399, orig_usd: 10.00, orig_bdt: 1200, popular: 1, devices: 'All your devices', features: '3 Months continuous ad-free YouTube, Offline downloads, Own Gmail' },
      { name: '6 Months - Personal Invite', tier: 'family', months: 6, label: '6 Months (Your Own Gmail)', usd: 5.83, bdt: 699, orig_usd: 20.00, orig_bdt: 2400, popular: 0, devices: 'All your devices', features: 'Half-Year Super Saver, Zero interruptions, 100% Replacement Warranty' }
    ],
    vault: [
      { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://families.google.com/join/flixstore-yt-invite-9932', instr: 'Click the activation link to join YouTube Premium family group with your own Google email.' }
    ]
  },

  // 5. Hoichoi Premium
  {
    cat_slug: 'regional-bengali',
    slug: 'hoichoi-premium',
    title: 'Hoichoi Premium',
    tagline: 'World’s Largest Bengali Entertainment Library',
    description: 'Stream 600+ Bengali blockbuster movies, 150+ award-winning exclusive web series, Feluda, Byomkesh, Eken Babu, Karagar and timeless classic cinema in Full HD with English subtitles.',
    logo_url: '/assets/brands/hoichoi.png',    base_price: 1.25,
    original_price: 3.33,
    original_price_bdt: 400,
    rating: 4.93,
    review_count: 530,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Full HD 1080p Bengali cinema & web series',
      'New world premieres every single week',
      'Dolby 5.1 Surround Sound available',
      'English subtitles for non-native speakers',
      'Smart TV, FireTV, Android TV, iOS & Android compatible',
      'Instant delivery with full warranty support'
    ]),
    instructions: 'Sign in to hoichoi.tv or the Hoichoi app on mobile/TV using the email & password provided.',
    plans: [
      { name: '1 Month - Shared Screen', tier: 'shared', months: 1, label: '1 Month (1 Screen)', usd: 1.25, bdt: 150, orig_usd: 3.33, orig_bdt: 400, popular: 0, devices: '1 Screen', features: 'Full HD 1080p, 600+ Bengali Movies & 150+ Series, English Subtitles' },
      { name: '3 Months - VIP Access', tier: 'private', months: 3, label: '3 Months (VIP Access)', usd: 3.33, bdt: 399, orig_usd: 8.33, orig_bdt: 1000, popular: 1, devices: '1 Screen', features: '3 Months Continuous Bengali Cinema, Smart TV compatible, Fast Warranty' },
      { name: '6 Months - VIP Access', tier: 'private', months: 6, label: '6 Months (VIP Access)', usd: 6.66, bdt: 799, orig_usd: 15.00, orig_bdt: 1800, popular: 0, devices: '1 Screen', features: 'Half-Year Super Value, All World Premieres, Full Warranty' }
    ],
    vault: [
      { type: 'account', email: 'hoichoi.bd01@flixstore-auth.com', pass: 'Feluda#Hoichoi26', profile: 'Flix User', pin: '', instr: 'Log in at hoichoi.tv with these credentials.' }
    ]
  },

  // 6. Chorki Premium
  {
    cat_slug: 'regional-bengali',
    slug: 'chorki-premium',
    title: 'Chorki Premium',
    tagline: 'Film, Fun, Foorti - The Ultimate Bengali Original Streamer',
    description: 'Bangladesh’s premier streaming platform. Watch exclusive blockbuster movies, binge-worthy original series like Syndicate, Pett Kata Shaw, Redrum, and captivating short films.',
    logo_url: '/assets/brands/chorki.png',    base_price: 1.66,
    original_price: 3.33,
    original_price_bdt: 399,
    rating: 4.91,
    review_count: 412,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Full HD 1080p Bangladeshi original cinema & drama',
      'Exclusive festival releases & award-winning shorts',
      'Ad-free uninterrupted viewing experience',
      'Compatible with Smart TVs, Mobile, and Web Browsers',
      'Instant delivery with 100% warranty coverage'
    ]),
    instructions: 'Log in to chorki.com or the Chorki mobile/TV app with the delivered credentials.',
    plans: [
      { name: '1 Month - Standard', tier: 'shared', months: 1, label: '1 Month (1 Screen)', usd: 1.66, bdt: 199, orig_usd: 3.33, orig_bdt: 399, popular: 1, devices: '1 Screen', features: '1080p Full HD, Chorki Original Series & Dhallywood Movies' },
      { name: '6 Months - VIP Pass', tier: 'private', months: 6, label: '6 Months VIP', usd: 8.33, bdt: 999, orig_usd: 15.83, orig_bdt: 1899, popular: 0, devices: '1 Screen', features: '6 Months Uninterrupted Access, Exclusive Web Series, Full Warranty' }
    ],
    vault: [
      { type: 'account', email: 'chorki.stream@flixstore-auth.com', pass: 'ChorkiDhaka#2026', profile: 'Flix User', pin: '', instr: 'Log in at chorki.com.' }
    ]
  },

  // 7. ChatGPT Plus (OpenAI)
  {
    cat_slug: 'ai-tools',
    slug: 'chatgpt-plus-openai',
    title: 'ChatGPT Plus (OpenAI)',
    tagline: 'GPT-4o, OpenAI o1, DALL-E 3, Canvas & Voice Mode',
    description: 'Supercharge your intellect and workflows with OpenAI’s most advanced AI models. Get access to GPT-4o, OpenAI o1 reasoning model, Canvas interactive editor, image generation with DALL-E 3, and high-speed priority servers.',
    logo_url: '/assets/brands/chatgpt.svg',    base_price: 4.16,
    original_price: 10.00,
    original_price_bdt: 1200,
    rating: 4.99,
    review_count: 3120,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 1,
    features_list: JSON.stringify([
      'Full access to GPT-4o and OpenAI o1 reasoning models',
      'DALL-E 3 image generation directly inside chat',
      'Canvas workspace for collaborative writing and coding',
      'Advanced Voice Mode with real-time conversational inflection',
      'File uploads, data analysis & web browsing with citations',
      'Shared or Private dedicated account options available'
    ]),
    instructions: 'Login at chatgpt.com. Select GPT-4o or OpenAI o1 from the model dropdown. Do not reset email security.',
    plans: [
      { name: '1 Month - Shared Access', tier: 'shared', months: 1, label: '1 Month (Shared Access)', usd: 4.16, bdt: 499, orig_usd: 10.00, orig_bdt: 1200, popular: 0, devices: '1 Device', features: 'GPT-4o & OpenAI o1 access, DALL-E 3, Canvas workspace' },
      { name: '1 Month - Personal Account', tier: 'private', months: 1, label: '1 Month (Dedicated Personal)', usd: 24.16, bdt: 2899, orig_usd: 29.16, orig_bdt: 3500, popular: 1, devices: 'Dedicated Personal Login', features: '100% Private dedicated account, Your own chats & memory, Advanced Voice Mode' }
    ],
    vault: [
      { type: 'account', email: 'chatgpt.pro01@flixstore-auth.com', pass: 'GptPlus#2026Secure', profile: 'ChatGPT Plus User', pin: '', instr: 'Sign in to chatgpt.com with credentials.' }
    ]
  },

  // 8. Claude Pro (Anthropic)
  {
    cat_slug: 'ai-tools',
    slug: 'claude-pro-anthropic',
    title: 'Claude Pro (Anthropic)',
    tagline: 'Claude 3.5 Sonnet, Artifacts, 200K Context Window',
    description: 'The world’s best coding and analytical AI model. Claude 3.5 Sonnet delivers unmatched programming, nuanced creative writing, and real-time interactive UI previews via Artifacts with 5x more usage volume.',
    logo_url: '/assets/brands/claude-ai.svg',    base_price: 24.58,
    original_price: 26.67,
    original_price_bdt: 3200,
    rating: 4.98,
    review_count: 1890,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Claude 3.5 Sonnet and Claude 3 Opus flagship intelligence',
      'Interactive Artifacts workspace (live HTML/React previews)',
      '5x more usage compared to free tier during peak hours',
      '200,000 token context window (analyze entire codebases & PDFs)',
      'Instant 60s credential delivery'
    ]),
    instructions: 'Sign in at claude.ai with the assigned email and password.',
    plans: [
      { name: '1 Month - Dedicated Pro', tier: 'private', months: 1, label: '1 Month (Dedicated Login)', usd: 24.58, bdt: 2950, orig_usd: 26.67, orig_bdt: 3200, popular: 1, devices: '1 User Dedicated', features: 'Claude 3.5 Sonnet, Artifacts workspace, 200K Context Window, 5x More Usage' }
    ],
    vault: [
      { type: 'account', email: 'claude.sonnet01@flixstore-auth.com', pass: 'ClaudePro#Sonnet26', profile: 'Claude Pro User', pin: '', instr: 'Log in at claude.ai.' }
    ]
  },

  // 9. Midjourney Pro Plan
  {
    cat_slug: 'ai-tools',
    slug: 'midjourney-pro-plan',
    title: 'Midjourney Pro Plan',
    tagline: 'Photorealistic AI Image Generation, Stealth Mode & Fast GPU',
    description: 'Create jaw-dropping photorealistic imagery, artistic concept art, 3D renders, and cinematic visuals with Midjourney. Includes 30 hours of Fast GPU time, unlimited Relax mode, and commercial usage rights.',
    logo_url: '/assets/brands/midjourney.svg',    base_price: 13.00,
    original_price: 30.00,
    original_price_bdt: 3600,
    rating: 4.94,
    review_count: 940,
    is_featured: 0,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'High-speed Fast GPU generation hours',
      'Unlimited Relax GPU generations (never run out)',
      'Commercial usage rights for your generated creations',
      'Access to Midjourney Web interface and Discord bot',
      'Supports latest Midjourney v6.1 photorealistic model'
    ]),
    instructions: 'Login through the dedicated Midjourney Discord/Web account provided in your order receipt.',
    plans: [
      { name: '1 Month - Standard Plan', tier: 'private', months: 1, label: '1 Month (Standard Plan)', usd: 13.00, bdt: 1560, orig_usd: 30.00, orig_bdt: 3600, popular: 1, devices: '1 Discord Account', features: '15h Fast GPU, Unlimited Relax GPU, Commercial License' }
    ],
    vault: [
      { type: 'account', email: 'midjourney.art@flixstore-auth.com', pass: 'MjArtGen#2026x', profile: 'Artist Pro', pin: '', instr: 'Discord account with active Midjourney subscription.' }
    ]
  },

  // 10. Spotify Premium Individual
  {
    cat_slug: 'music-audio',
    slug: 'spotify-premium-individual',
    title: 'Spotify Premium Individual',
    tagline: 'Zero Ads, Offline Downloads & Extreme 320kbps Audio',
    description: 'Play any song, anytime, anywhere. Unlimited skips, zero commercial interruptions, offline music downloads for road trips, and 320kbps high-fidelity audio with Spotify Connect.',
    logo_url: '/assets/brands/spotify.svg',    base_price: 2.08,
    original_price: 4.17,
    original_price_bdt: 500,
    rating: 4.97,
    review_count: 2450,
    is_featured: 1,
    is_trending: 0,
    is_bestseller: 1,
    features_list: JSON.stringify([
      'Ad-free music listening on Mobile, Desktop, TV & Web',
      'Download songs for offline listening wherever you go',
      'Extreme 320kbps high audio bitrate quality',
      'Unlimited track skips & on-demand playback',
      'Spotify Connect streaming to smart speakers & consoles',
      'Can be upgraded directly onto your own Spotify email!'
    ]),
    instructions: 'You will receive an upgrade invite link or pre-activated Spotify credentials. If using your own email, accept the family group invitation with the provided address.',
    plans: [
      { name: '1 Month - Premium Invite', tier: 'family', months: 1, label: '1 Month (Your Own Account)', usd: 2.08, bdt: 250, orig_usd: 4.17, orig_bdt: 500, popular: 0, devices: 'All your devices', features: 'Applied directly to your own Spotify email, Ad-free, 320kbps extreme audio' },
      { name: '3 Months - Premium Invite', tier: 'family', months: 3, label: '3 Months (Your Own Account)', usd: 5.83, bdt: 699, orig_usd: 11.67, orig_bdt: 1400, popular: 1, devices: 'All your devices', features: '3 Months guaranteed on your personal email, Offline music downloads' },
      { name: '6 Months - Premium Invite', tier: 'family', months: 6, label: '6 Months (Your Own Account)', usd: 10.83, bdt: 1299, orig_usd: 22.50, orig_bdt: 2700, popular: 0, devices: 'All your devices', features: 'Save 52%, Hassle-free music streaming, 100% Replacement Warranty' }
    ],
    vault: [
      { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://spotify.com/family/join/flixstore-sp-token-8841', instr: 'Click to upgrade your own Spotify account to Premium.' }
    ]
  },

  // 11. Apple Music Premium
  {
    cat_slug: 'music-audio',
    slug: 'apple-music-premium',
    title: 'Apple Music Premium',
    tagline: '100M+ Songs, Spatial Audio with Dolby Atmos & Lossless',
    description: 'Immerse yourself in music the way the artist intended. Experience pristine Lossless Audio up to 24-bit/192kHz, Spatial Audio with dynamic head tracking, real-time lyrics and Apple Music Sing.',
    logo_url: '/assets/brands/apple-music.svg',    base_price: 3.00,
    original_price: 10.00,
    original_price_bdt: 1200,
    rating: 4.92,
    review_count: 512,
    is_featured: 0,
    is_trending: 0,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Lossless Audio (ALAC) up to 24-bit/192 kHz resolution',
      'Spatial Audio with Dolby Atmos for 360-degree immersion',
      '100 million songs, curated editor playlists & live radio',
      'Apple Music Sing with adjustable vocals and beat-by-beat lyrics',
      'Works seamlessly across iPhone, iPad, Mac, Windows & Android'
    ]),
    instructions: 'You will receive an Apple Family invitation or pre-activated Apple ID to log into your Apple Music app.',
    plans: [
      { name: '1 Month - Apple Music', tier: 'family', months: 1, label: '1 Month (Apple Invite)', usd: 3.00, bdt: 360, orig_usd: 10.00, orig_bdt: 1200, popular: 1, devices: 'Personal Apple ID', features: 'Join via Family Share on your own Apple ID, 24/7 warranty' }
    ],
    vault: [
      { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://apple.com/family-invite/flixstore-am-3910', instr: 'Accept the Apple Family invitation from your device settings.' }
    ]
  },

  // 12. Adobe Creative Cloud All Apps
  {
    cat_slug: 'cloud-creative',
    slug: 'adobe-creative-cloud-all-apps',
    title: 'Adobe Creative Cloud All Apps',
    tagline: '20+ Professional Creative Apps + 100GB Cloud Storage',
    description: 'The industry standard for creators, designers, and video editors. Full access to Photoshop, Premiere Pro, Illustrator, After Effects, InDesign, Lightroom, Acrobat Pro, and Adobe Firefly Generative AI credits.',
    logo_url: '/assets/brands/adobe-creative-cloud.svg',    base_price: 16.00,
    original_price: 60.00,
    original_price_bdt: 7200,
    rating: 4.96,
    review_count: 1120,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 1,
    features_list: JSON.stringify([
      'Full suite of 20+ desktop applications (Photoshop, Premiere, Illustrator, etc.)',
      'Adobe Firefly Generative AI credits for instant generative fill & expand',
      '100GB secure Adobe Cloud storage for projects and sync',
      'Adobe Fonts library with thousands of licensed premium typefaces',
      'Behance Pro & Adobe Portfolio included',
      'Genuine subscription directly on your personal Adobe ID!'
    ]),
    instructions: 'Provide your personal Adobe email during checkout. Our automated system will add your email to an enterprise license group within 5 minutes. Download apps directly from creativecloud.adobe.com.',
    plans: [
      { name: '1 Month - All Apps License', tier: 'license', months: 1, label: '1 Month (Your Own Adobe ID)', usd: 16.00, bdt: 1920, orig_usd: 60.00, orig_bdt: 7200, popular: 1, devices: '2 Devices Simultaneously', features: 'Applied directly to your Adobe email, 100GB storage' }
    ],
    vault: [
      { type: 'license_key', email: 'adobe.ent@flixstore-auth.com', pass: '', profile: '', pin: '', key: 'ADOBE-CC-ENT-9481-2026-FLIX', instr: 'Enterprise invite will be assigned to your checkout email.' }
    ]
  },

  // 13. Google One 2TB Cloud + Gemini
  {
    cat_slug: 'cloud-creative',
    slug: 'google-one-2tb-cloud',
    title: 'Google One 2TB Cloud + Gemini',
    tagline: '2TB Storage for Drive, Gmail, Photos + Gemini Advanced',
    description: 'Never worry about running out of space again. Get 2TB (2,000 GB) of secure cloud storage across Google Drive, Gmail, and Google Photos with original quality photo backups and Gemini Advanced AI integration.',
    logo_url: '/assets/brands/google-one.svg',    base_price: 4.00,
    original_price: 20.00,
    original_price_bdt: 2400,
    rating: 4.95,
    review_count: 730,
    is_featured: 1,
    is_trending: 0,
    is_bestseller: 0,
    features_list: JSON.stringify([
      '2 Terabytes (2,000 GB) cloud storage across all Google services',
      'Original quality backup in Google Photos with Magic Eraser tools',
      'Integration with Gemini Advanced AI for Docs, Sheets, and Gmail',
      'Google Workspace premium video calling features (no 60 min limit)',
      'Added to your personal Gmail safely via family storage invite'
    ]),
    instructions: 'Click the Google One Family Storage invitation link provided on your order page. Your existing photos and files remain 100% private.',
    plans: [
      { name: '1 Month - 2TB Storage', tier: 'family', months: 1, label: '1 Month (Your Own Gmail)', usd: 4.00, bdt: 480, orig_usd: 20.00, orig_bdt: 2400, popular: 1, devices: 'All your devices', features: 'Applied to your own personal Gmail, 2TB Cloud Storage' }
    ],
    vault: [
      { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://one.google.com/family/join/flixstore-g1-storage-2tb-418', instr: 'Join Google One family storage pool.' }
    ]
  },

  // 14. Canva Pro Subscription
  {
    cat_slug: 'cloud-creative',
    slug: 'canva-pro-subscription',
    title: 'Canva Pro Subscription',
    tagline: 'Brand Kit, Magic Studio AI & 100M+ Premium Stock Assets',
    description: 'Create professional graphics, social media posts, presentations, and video reels in minutes. Unlock 100M+ premium photos, graphics, videos, 1-click Background Remover, Magic Resize, and Brand Kits.',
    logo_url: '/assets/brands/canva.svg',    base_price: 7.00,
    original_price: 50.00,
    original_price_bdt: 6000,
    rating: 4.99,
    review_count: 3820,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 1,
    features_list: JSON.stringify([
      '100+ million premium stock photos, graphics, audio and video tracks',
      'One-click Background Remover for images and video',
      'Magic Studio: Magic Expand, Magic Grab, Magic Switch and AI Text to Image',
      'Brand Kits with custom fonts, colors and company logos',
      'Direct upgrade to your OWN personal Canva email address!'
    ]),
    instructions: 'Click the Canva Pro Team invite link in your order receipt and log in with your personal Canva account to unlock Pro instantly.',
    plans: [
      { name: '1 Year - Pro Team Invite', tier: 'family', months: 12, label: '1 Year (Your Own Canva Email)', usd: 7.00, bdt: 840, orig_usd: 50.00, orig_bdt: 6000, popular: 1, devices: 'Unlimited devices', features: 'Full 1-Year Pro access on your own Canva email' }
    ],
    vault: [
      { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://canva.com/brand/join?token=flixstore-canva-vip-9901', instr: 'Click link to upgrade personal Canva account to Pro.' }
    ]
  },

  // 15. NordVPN & Threat Protection
  {
    cat_slug: 'vpn-security',
    slug: 'nordvpn-threat-protection',
    title: 'NordVPN & Threat Protection',
    tagline: 'Ultra-Fast 10Gbps Servers, Anti-Malware & Zero Logs',
    description: 'Protect your online privacy, bypass geo-restrictions, and secure public Wi-Fi. Features 6,400+ ultra-fast servers in 111 countries, Threat Protection anti-malware, and Double VPN encryption.',
    logo_url: '/assets/brands/nordvpn.svg',    base_price: 3.50,
    original_price: 16.00,
    original_price_bdt: 1920,
    rating: 4.93,
    review_count: 670,
    is_featured: 0,
    is_trending: 0,
    is_bestseller: 0,
    features_list: JSON.stringify([
      '6,400+ ultra-fast 10Gbps servers across 111 countries',
      'Independently audited strict No-Logs policy',
      'Threat Protection: blocks ads, trackers and malicious websites',
      'Stream Netflix, Prime, BBC iPlayer from anywhere worldwide',
      'Works on Windows, macOS, iOS, Android, Linux & Routers'
    ]),
    instructions: 'Log into NordVPN client with the delivered email and password.',
    plans: [
      { name: '1 Month - Shared Login', tier: 'shared', months: 1, label: '1 Month (1 Device)', usd: 3.50, bdt: 420, orig_usd: 16.00, orig_bdt: 1920, popular: 1, devices: '1 Device', features: 'Full server access, 1 device simultaneous' }
    ],
    vault: [
      { type: 'account', email: 'nordvpn.user@flixstore-auth.com', pass: 'NordShield#2026', profile: 'Nord User', pin: '', instr: 'Log into NordVPN app.' }
    ]
  },

  // ---------------------------------------------------------
  // NEW PRODUCTS FROM Pricing details.md:
  // ---------------------------------------------------------

  // 16. Netflix + PrimeVideo Combo
  {
    cat_slug: 'ott-streaming',
    slug: 'netflix-primevideo-combo',
    title: 'Netflix + Prime Video Combo Pack',
    tagline: 'Dual Cinema Bundle: 4K UHD Netflix + Amazon Prime Originals',
    description: 'The ultimate entertainment super-bundle. Stream all Netflix 4K Originals (Stranger Things, Squid Game, Wednesday) along with Amazon Prime Video blockbuster movies and exclusive series (The Boys, Rings of Power, Fallout, Reacher) in one unified package with 100% full-duration warranty.',
    logo_url: '/assets/brands/netflix-primevideo-combo.svg',    base_price: 3.33,
    original_price: 16.25,
    original_price_bdt: 1950,
    rating: 4.99,
    review_count: 320,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 1,
    features_list: JSON.stringify([
      'Access to full Netflix 4K UHD & Amazon Prime Video libraries',
      'Stream on Smart TV, Phone, Tablet, Laptop & Firestick',
      'Ultra HD 4K, HDR10 & Dolby Atmos sound on both platforms',
      'Single unified order with instant automated credential delivery',
      '100% full-duration replacement warranty across both services'
    ]),
    instructions: 'You will receive separate login credentials for both Netflix 4K and Prime Video. Log in on your devices and start streaming immediately.',
    plans: [
      { name: '1 Month - Combo Pack', tier: 'shared', months: 1, label: '1 Month (Netflix + Prime)', usd: 3.33, bdt: 399, orig_usd: 16.25, orig_bdt: 1950, popular: 1, devices: '1 Screen Each', features: 'Netflix 4K UHD + Amazon Prime Video, 1 Screen each, Full Warranty' },
      { name: '3 Months - Combo Pack', tier: 'private', months: 3, label: '3 Months (Netflix + Prime)', usd: 9.58, bdt: 1150, orig_usd: 48.75, orig_bdt: 5850, popular: 0, devices: '1 Screen Each', features: '90 Days continuous dual streaming, 80% Super Saver, Full Warranty' }
    ],
    vault: [
      { type: 'account', email: 'combo.dual@flixstore-auth.com', pass: 'DualStream#2026x', profile: 'Combo User', pin: '5120', instr: 'Netflix: Profile 1 (PIN 5120) | Prime Video: Log in with delivered credentials.' }
    ]
  },

  // 17. HBO Max (Max)
  {
    cat_slug: 'ott-streaming',
    slug: 'hbo-max-streaming',
    title: 'HBO Max (Max) Premium',
    tagline: 'House of the Dragon, The Last of Us, DC Universe & 4K Cinema',
    description: 'Stream the highest-rated television in history and Warner Bros. blockbusters. Home of Game of Thrones, House of the Dragon, The Last of Us, Succession, The Sopranos, Batman, Studio Ghibli, and Discovery+ in crystal-clear 4K UHD with Dolby Vision and Atmos.',
    logo_url: '/assets/brands/hbo-max.svg',    base_price: 3.33,
    original_price: 16.67,
    original_price_bdt: 2000,
    rating: 4.96,
    review_count: 485,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Iconic HBO Originals, Warner Bros. movies & DC Extended Universe',
      '4K UHD streaming with Dolby Vision & Dolby Atmos sound',
      'Watch on Smart TV, Apple TV, Chromecast, iOS & Android',
      'Offline video downloads for planes and road trips',
      'Instant automated login delivery with replacement warranty'
    ]),
    instructions: 'Log in at max.com or through the Max app on TV/mobile with your assigned email and password.',
    plans: [
      { name: '1 Month - Ad-Free Stream', tier: 'private', months: 1, label: '1 Month (1 Screen)', usd: 3.33, bdt: 399, orig_usd: 16.67, orig_bdt: 2000, popular: 1, devices: '1 Screen', features: '4K UHD, HDR10 & Dolby Atmos, Game of Thrones, DC Universe, Ad-Free' }
    ],
    vault: [
      { type: 'account', email: 'max.stream01@flixstore-auth.com', pass: 'HboMax#2026Vip', profile: 'Max VIP', pin: '7721', instr: 'Sign in to Max. Enjoy 4K UHD ad-free streaming!' }
    ]
  },

  // 18. Disney+
  {
    cat_slug: 'ott-streaming',
    slug: 'disney-plus-premium',
    title: 'Disney+ Premium 4K',
    tagline: 'Marvel Studios, Star Wars, Pixar, Disney & National Geographic',
    description: 'The home of endless imagination. Experience Marvel Cinematic Universe blockbusters, the complete Star Wars saga, heartwarming Pixar animations, Disney classics, National Geographic expeditions, and Hulu/Star prestige dramas in 4K UHD with IMAX Enhanced.',
    logo_url: '/assets/brands/disney-plus.svg',    base_price: 4.16,
    original_price: 15.83,
    original_price_bdt: 1900,
    rating: 4.95,
    review_count: 510,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Complete Marvel Studios & Star Wars exclusive series & movies',
      'IMAX Enhanced mode & Dolby Atmos cinematic sound',
      '4K Ultra HD & HDR10 high dynamic range playback',
      'Offline downloads across iOS, Android, and tablets',
      'Instant credential delivery & uninterrupted guarantee'
    ]),
    instructions: 'Sign in to disneyplus.com or the Disney+ app on your devices with the provided credentials.',
    plans: [
      { name: '1 Month - Premium 4K', tier: 'private', months: 1, label: '1 Month (1 Screen)', usd: 4.16, bdt: 499, orig_usd: 15.83, orig_bdt: 1900, popular: 1, devices: '1 Screen', features: '4K UHD + IMAX Enhanced, Marvel, Star Wars, Pixar, Disney, 100% Warranty' }
    ],
    vault: [
      { type: 'account', email: 'disney.vip@flixstore-auth.com', pass: 'DisneyPlus#2026', profile: 'Flix User', pin: '3941', instr: 'Sign in to Disney+ app or website.' }
    ]
  },

  // 19. Grammarly Premium
  {
    cat_slug: 'ai-tools',
    slug: 'grammarly-premium-ai',
    title: 'Grammarly Premium AI',
    tagline: 'AI Writing Assistant, Plagiarism Detection & Sentence Rewriter',
    description: 'Elevate every word you write. Grammarly Premium delivers advanced grammar & punctuation corrections, tone adjustments, vocabulary richness, full-sentence rewrites, and 100% plagiarism detection across Google Docs, Word, Gmail, and web browsers.',
    logo_url: '/assets/brands/grammarly.svg',    base_price: 2.49,
    original_price: 30.00,
    original_price_bdt: 3600,
    rating: 4.97,
    review_count: 620,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Full-sentence rewriting & tone adjustments for professional impact',
      '100% Plagiarism checker scanning 16+ billion academic & web pages',
      'Generative AI writing assistance (prompts, ideation & outlining)',
      'Works inside Google Docs, Microsoft Word, browser extensions & desktop',
      'Instant account activation with full warranty coverage'
    ]),
    instructions: 'Sign into grammarly.com with the account provided in your order receipt. Install the browser extension or desktop app for seamless real-time suggestions.',
    plans: [
      { name: '1 Month - Premium AI', tier: 'license', months: 1, label: '1 Month (Pro Access)', usd: 2.49, bdt: 299, orig_usd: 30.00, orig_bdt: 3600, popular: 1, devices: 'Unlimited Apps', features: 'Tone adjustments, Full sentence rewrite, 100% Plagiarism checker, Generative AI' }
    ],
    vault: [
      { type: 'account', email: 'grammarly.pro@flixstore-auth.com', pass: 'GrammarAI#2026Pro', profile: 'Pro Writer', pin: '', instr: 'Sign into grammarly.com or install Grammarly extension.' }
    ]
  },

  // 20. Microsoft 365 (Office 365) + 1TB Cloud
  {
    cat_slug: 'cloud-creative',
    slug: 'microsoft-365-office-suite',
    title: 'Microsoft 365 (Office 365) + 1TB Cloud',
    tagline: 'Word, Excel, PowerPoint, Outlook + 1TB OneDrive Storage',
    description: 'The essential productivity powerhouse for students, professionals, and businesses. Full desktop installations of Microsoft Word, Excel, PowerPoint, Outlook, and OneNote, coupled with 1 TB (1,000 GB) secure OneDrive cloud storage with ransomware detection.',
    logo_url: '/assets/brands/microsoft-365.svg',    base_price: 16.25,
    original_price: 23.33,
    original_price_bdt: 2800,
    rating: 4.96,
    review_count: 540,
    is_featured: 1,
    is_trending: 1,
    is_bestseller: 0,
    features_list: JSON.stringify([
      'Full desktop apps: Word, Excel, PowerPoint, Outlook, OneNote & Access',
      '1 Terabyte (1,000 GB) OneDrive cloud storage with personal vault',
      'Use on up to 5 devices simultaneously (Windows PC, Mac, iPad, Android)',
      'Microsoft Defender advanced security & phishing protection',
      'Direct license key or enterprise account activation'
    ]),
    instructions: 'Log into portal.office.com with the credentials or license provided to download apps and activate 1TB OneDrive storage.',
    plans: [
      { name: '1 Month - Pro License + 1TB', tier: 'license', months: 1, label: '1 Month (Official License)', usd: 16.25, bdt: 1950, orig_usd: 23.33, orig_bdt: 2800, popular: 1, devices: '5 Devices', features: 'Full Word, Excel, PowerPoint desktop apps, 1TB OneDrive Cloud, Ransomware protection' }
    ],
    vault: [
      { type: 'license_key', email: 'office.ent@flixstore-auth.com', pass: 'MS365#Power2026', profile: 'Enterprise User', pin: '', key: 'MS365-PRO-ENT-8841-2026-FLX', instr: 'Sign into portal.office.com or enter product key.' }
    ]
  }
];

// 3. Upsert products and replace plans
const insertOrUpdateProd = db.prepare(`
  INSERT INTO products (
    category_id, title, slug, tagline, description, logo_url, badge,
    base_price, original_price, original_price_bdt, delivery_time, warranty, rating, review_count,
    stock_status, is_featured, is_trending, is_bestseller, features_list, instructions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Instant', 'Full Duration Warranty', ?, ?, 'in_stock', ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    category_id = excluded.category_id,
    title = excluded.title,
    tagline = excluded.tagline,
    description = excluded.description,
    logo_url = excluded.logo_url,
    badge = excluded.badge,
    base_price = excluded.base_price,
    original_price = excluded.original_price,
    original_price_bdt = excluded.original_price_bdt,
    rating = excluded.rating,
    review_count = excluded.review_count,
    is_featured = excluded.is_featured,
    is_trending = excluded.is_trending,
    is_bestseller = excluded.is_bestseller,
    features_list = excluded.features_list,
    instructions = excluded.instructions
`);

const insertPlan = db.prepare(`
  INSERT INTO product_plans (
    product_id, plan_name, tier_type, duration_months, duration_label,
    price_usd, price_bdt, original_price_usd, original_price_bdt, is_popular, device_limit, plan_features, sort_order
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertVault = db.prepare(`
  INSERT INTO credential_vault (
    product_id, plan_id, credential_type, account_email, account_password,
    profile_name, profile_pin, license_key, special_instructions
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let totalProductsProcessed = 0;
let totalPlansProcessed = 0;

for (const p of catalog) {
  const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(p.cat_slug);
  if (!cat) {
    console.error('Category not found for slug:', p.cat_slug);
    continue;
  }

  insertOrUpdateProd.run(
    cat.id,
    p.title,
    p.slug,
    p.tagline,
    p.description,
    p.logo_url,
    p.badge,
    p.base_price,
    p.original_price,
    p.original_price_bdt,
    p.rating,
    p.review_count,
    p.is_featured,
    p.is_trending,
    p.is_bestseller,
    p.features_list,
    p.instructions
  );

  const prod = db.prepare('SELECT id FROM products WHERE slug = ?').get(p.slug);
  totalProductsProcessed++;

  // Delete old plans and re-insert fresh ones
  db.prepare('DELETE FROM product_plans WHERE product_id = ?').run(prod.id);

  let sortOrder = 0;
  for (const pl of p.plans) {
    sortOrder++;
    const planRes = insertPlan.run(
      prod.id,
      pl.name,
      pl.tier,
      pl.months,
      pl.label,
      pl.usd,
      pl.bdt,
      pl.orig_usd,
      pl.orig_bdt,
      pl.popular,
      pl.devices,
      pl.features,
      sortOrder
    );
    totalPlansProcessed++;

    // Seed vault credentials if empty for this product
    const vaultCount = db.prepare('SELECT COUNT(*) as count FROM credential_vault WHERE product_id = ?').get(prod.id);
    if (vaultCount.count === 0 && p.vault && p.vault.length > 0) {
      for (const vs of p.vault) {
        insertVault.run(
          prod.id,
          planRes.lastInsertRowid,
          vs.type,
          vs.email || null,
          vs.pass || null,
          vs.profile || null,
          vs.pin || null,
          vs.key || null,
          vs.instr || null
        );
      }
    }
  }
}

console.log(`[SUCCESS] Migrated ${totalProductsProcessed} products and ${totalPlansProcessed} plans!`);
