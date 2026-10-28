const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'flixstore.db');

// Ensure database directory exists (e.g. when mounting persistent volume in /data or custom folder)
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Ensure db directory or db file location is accessible
const db = new DatabaseSync(DB_PATH);

// Helper for secure password hashing with salt
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  try {
    const [salt, key] = storedHash.split(':');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(key, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Initialize tables with secure foreign keys and indices
function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      badge TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT,
      description TEXT,
      logo_url TEXT NOT NULL,
      badge TEXT,
      base_price REAL NOT NULL,
      original_price REAL,
      delivery_time TEXT DEFAULT 'Instant',
      warranty TEXT DEFAULT 'Full Duration Warranty',
      rating REAL DEFAULT 4.9,
      review_count INTEGER DEFAULT 128,
      stock_status TEXT DEFAULT 'in_stock',
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      is_bestseller INTEGER DEFAULT 0,
      features_list TEXT,
      instructions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
  `);

  // Product Plans table (Duration & Tier variants: 1mo, 3mo, 6mo, 12mo / Shared / Private)
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      tier_type TEXT DEFAULT 'private', -- 'shared', 'private', 'family', 'license'
      duration_months INTEGER NOT NULL,
      duration_label TEXT NOT NULL,
      price_usd REAL NOT NULL,
      price_bdt REAL NOT NULL,
      original_price_usd REAL,
      is_popular INTEGER DEFAULT 0,
      device_limit TEXT DEFAULT '1 Device',
      plan_features TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Credential Vault (Pre-stocked digital credentials, keys, or accounts)
  db.exec(`
    CREATE TABLE IF NOT EXISTS credential_vault (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      plan_id INTEGER,
      credential_type TEXT NOT NULL DEFAULT 'account', -- 'account', 'license_key', 'invite_link', 'profile_pin'
      account_email TEXT,
      account_password TEXT,
      profile_name TEXT,
      profile_pin TEXT,
      license_key TEXT,
      activation_link TEXT,
      special_instructions TEXT,
      is_used INTEGER DEFAULT 0,
      assigned_order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES product_plans(id) ON DELETE SET NULL
    );
  `);

  // Coupons / Promo codes
  db.exec(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      discount_percent INTEGER DEFAULT 0,
      discount_amount_usd REAL DEFAULT 0,
      min_spend_usd REAL DEFAULT 0,
      max_uses INTEGER DEFAULT 1000,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Orders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      payment_method TEXT NOT NULL, -- 'card', 'bkash', 'nagad', 'rocket', 'paypal', 'crypto'
      payment_status TEXT NOT NULL DEFAULT 'completed', -- 'pending', 'completed', 'failed', 'refunded'
      transaction_id TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      currency_symbol TEXT NOT NULL DEFAULT '$',
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      coupon_code TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'delivered', -- 'delivered', 'processing', 'pending'
      delivered_credentials TEXT, -- JSON payload of dispatched credentials
      customer_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Order Items table
  db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      product_title TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      duration_label TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES product_plans(id) ON DELETE CASCADE
    );
  `);

  // Customer Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      headline TEXT,
      comment TEXT NOT NULL,
      verified_purchase INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Audit / Security Activity Log table
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Ensure BDT original comparison columns exist
  try {
    db.exec('ALTER TABLE products ADD COLUMN original_price_bdt REAL;');
  } catch (e) {}

  try {
    db.exec('ALTER TABLE product_plans ADD COLUMN original_price_bdt REAL;');
  } catch (e) {}

  seedInitialData();
}

// Seed comprehensive, realistic catalog
function seedInitialData() {
  // Check if categories already seeded
  const catCheck = db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCheck.count > 0) return;

  console.log('Seeding FlixStore catalog, credentials, coupons, and admin accounts...');

  // 1. Seed Admin User and Demo Customer
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertUser.run(
    'admin@flixstore.com',
    hashPassword('adminflixstore2026!'),
    'FlixStore Master Admin',
    'admin',
    '+1 (800) 555-FLIX'
  );

  insertUser.run(
    'customer@example.com',
    hashPassword('customer123'),
    'Alex Morgan',
    'customer',
    '+1 (555) 019-2834'
  );

  // 2. Seed Categories
  const categoriesData = [
    { slug: 'ott-streaming', name: 'OTT & Streaming', icon: 'film', badge: 'Hot', description: 'Premium 4K Ultra HD video streaming subscriptions', sort_order: 1 },
    { slug: 'regional-bengali', name: 'Regional Bengali OTT', icon: 'tv', badge: 'Popular', description: 'Hoichoi, Chorki, Toffee & South Asian entertainment', sort_order: 2 },
    { slug: 'ai-tools', name: 'AI & Productivity', icon: 'cpu', badge: 'Top AI', description: 'Cutting-edge AI models, coding copilot & generative tools', sort_order: 3 },
    { slug: 'music-audio', name: 'Music & Audio', icon: 'music', badge: 'Hi-Fi', description: 'Ad-free lossless audio, unlimited skips and podcasts', sort_order: 4 },
    { slug: 'cloud-creative', name: 'Cloud & Creative', icon: 'cloud', badge: 'Pro Suite', description: 'Cloud storage, Adobe Suite, Canva Pro & Office apps', sort_order: 5 },
    { slug: 'vpn-security', name: 'VPN & Privacy', icon: 'shield', badge: 'Secure', description: 'Military-grade encryption and geo-unblocking VPNs', sort_order: 6 },
  ];

  const insertCat = db.prepare(`
    INSERT INTO categories (slug, name, icon, badge, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const cat of categoriesData) {
    insertCat.run(cat.slug, cat.name, cat.icon, cat.badge, cat.description, cat.sort_order);
  }

  // 3. Seed Products & Plans
  const insertProduct = db.prepare(`
    INSERT INTO products (
      category_id, title, slug, tagline, description, logo_url, badge,
      base_price, original_price, delivery_time, warranty, rating, review_count,
      stock_status, is_featured, is_trending, is_bestseller, features_list, instructions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPlan = db.prepare(`
    INSERT INTO product_plans (
      product_id, plan_name, tier_type, duration_months, duration_label,
      price_usd, price_bdt, original_price_usd, is_popular, device_limit, plan_features, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVault = db.prepare(`
    INSERT INTO credential_vault (
      product_id, plan_id, credential_type, account_email, account_password,
      profile_name, profile_pin, license_key, activation_link, special_instructions
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const productsData = [
    // --- OTT & STREAMING ---
    {
      cat_slug: 'ott-streaming',
      title: 'Netflix Premium 4K UHD',
      slug: 'netflix-premium-4k-uhd',
      tagline: '4K Ultra HD + HDR, Dolby Atmos & Spatial Audio',
      description: 'Stream unlimited movies, TV shows, and award-winning Netflix Originals in crystal clear 4K Ultra HD. 100% genuine guaranteed account with instant renewal warranty.',
      logo_url: '/assets/brands/netflix.svg',      base_price: 2.49,
      original_price: 19.99,
      rating: 4.98,
      review_count: 1482,
      is_featured: 1,
      is_trending: 1,
      is_bestseller: 1,
      features_list: JSON.stringify([
        'Ultra HD 4K (3840 x 2160) + HDR10 / Dolby Vision',
        'Spatial Audio included on compatible titles',
        'Watch on Smart TV, Laptop, Phone, Tablet & Console',
        'Private PIN-protected profile or Full Account available',
        'Instant Automated Credential Delivery within 60 seconds',
        '100% Replacement Warranty for the entire duration'
      ]),
      instructions: 'Login to netflix.com with the provided credentials. Select your assigned profile name and enter the private PIN if applicable. Do not change master email or password.',
      plans: [
        { name: '1 Month - Shared Screen', tier: 'shared', months: 1, label: '1 Month (Shared Profile)', usd: 2.49, bdt: 299, orig: 9.99, popular: 0, devices: '1 Screen', features: '1 Screen at a time, Shared Profile, Full 4K' },
        { name: '1 Month - Private Profile (PIN)', tier: 'private', months: 1, label: '1 Month (Private PIN Profile)', usd: 5.99, bdt: 720, orig: 14.99, popular: 1, devices: '1 Screen (Private PIN)', features: 'Your Own Private Profile, Custom PIN, Watch History Saved, 4K HDR' },
        { name: '3 Months - Private Profile', tier: 'private', months: 3, label: '3 Months (Private Profile)', usd: 16.49, bdt: 1980, orig: 35.99, popular: 0, devices: '1 Screen (Private PIN)', features: 'Continuous 90-day subscription, Zero hassle, Auto replacement warranty' },
        { name: '6 Months - Private Profile', tier: 'private', months: 6, label: '6 Months (VIP Saver)', usd: 29.99, bdt: 3600, orig: 69.99, popular: 0, devices: '1 Screen (Private PIN)', features: 'Save 45% compared to monthly, uninterrupted streaming' },
        { name: '1 Month - Full Private Account (5 Screens)', tier: 'family', months: 1, label: '1 Month (Full 5 Screens Account)', usd: 14.99, bdt: 1800, orig: 22.99, popular: 0, devices: '5 Screens Simultaneously', features: 'Full 5 Profiles, Custom Password, Share with family/friends' },
      ],
      vault_seeds: [
        { type: 'account', email: 'netflix.vip01@flixstore-auth.com', pass: 'Nflx2026#Secure91', profile: 'User VIP 1', pin: '4821', instr: 'Use Profile 1 with PIN 4821. Enjoy 4K UHD streaming!' },
        { type: 'account', email: 'netflix.vip02@flixstore-auth.com', pass: 'FlixPrime$7732', profile: 'User VIP 2', pin: '9034', instr: 'Use Profile 2 with PIN 9034. Enjoy 4K UHD streaming!' },
      ]
    },
    {
      cat_slug: 'ott-streaming',
      title: 'Amazon Prime Video',
      slug: 'amazon-prime-video',
      tagline: 'Prime Originals, Exclusive Sports, 4K UHD & X-Ray',
      description: 'Enjoy exclusive Amazon Originals like The Boys, Rings of Power, Fallout, plus thousands of blockbuster movies and regional hits with X-Ray trivia and offline downloads.',
      logo_url: '/assets/brands/prime-video.svg',      base_price: 2.49,
      original_price: 14.99,
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
        { name: '1 Month - Shared Profile', tier: 'shared', months: 1, label: '1 Month (Shared Profile)', usd: 2.49, bdt: 300, orig: 8.99, popular: 0, devices: '1 Screen', features: '1 Screen, HD/4K quality' },
        { name: '1 Month - Private Profile', tier: 'private', months: 1, label: '1 Month (Private Profile)', usd: 3.99, bdt: 480, orig: 14.99, popular: 1, devices: '1 Screen (Dedicated)', features: 'Dedicated profile, personalized recommendations, full warranty' },
        { name: '6 Months - Private Profile', tier: 'private', months: 6, label: '6 Months (Value Pack)', usd: 14.99, bdt: 1800, orig: 45.00, popular: 0, devices: '1 Screen (Dedicated)', features: '6 months uninterrupted, free replacements if any issue' },
        { name: '12 Months - Private Profile', tier: 'private', months: 12, label: '12 Months (Yearly Pass)', usd: 24.99, bdt: 3000, orig: 89.99, popular: 0, devices: '1 Screen (Dedicated)', features: '1 Full Year uninterrupted streaming access' },
      ],
      vault_seeds: [
        { type: 'account', email: 'prime.stream01@flixstore-auth.com', pass: 'AmzVideo#2026x', profile: 'Flix User 1', pin: '', instr: 'Log in at primevideo.com. Stream on 1 screen.' }
      ]
    },
    {
      cat_slug: 'ott-streaming',
      title: 'Crunchyroll Mega Fan',
      slug: 'crunchyroll-mega-fan',
      tagline: 'Unlimited Anime, Simulcasts 1 hr after Japan, Zero Ads',
      description: 'The premier global anime destination. Stream Demon Slayer, Jujutsu Kaisen, Attack on Titan, Solo Leveling and 1,000+ anime titles ad-free in 1080p Full HD with offline viewing.',
      logo_url: '/assets/brands/crunchyroll.svg',      base_price: 2.99,
      original_price: 11.99,
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
        { name: '1 Month - Mega Fan', tier: 'private', months: 1, label: '1 Month (Mega Fan)', usd: 2.99, bdt: 360, orig: 9.99, popular: 0, devices: '1 Device', features: 'Ad-free, 1080p, offline viewing' },
        { name: '3 Months - Mega Fan', tier: 'private', months: 3, label: '3 Months (Mega Fan)', usd: 7.99, bdt: 960, orig: 24.99, popular: 1, devices: '1 Device', features: 'Quarterly anime pass with uninterrupted service' },
        { name: '12 Months - Mega Fan', tier: 'private', months: 12, label: '12 Months (Annual Mega Fan)', usd: 24.99, bdt: 3000, orig: 79.99, popular: 0, devices: '1 Device', features: 'Full 1-year unlimited anime access, lowest cost per month' },
      ],
      vault_seeds: [
        { type: 'account', email: 'crunchy.vip@flixstore-auth.com', pass: 'AnimeKing#2026', profile: 'Otaku Member', pin: '', instr: 'Open Crunchyroll app and log in.' }
      ]
    },
    {
      cat_slug: 'ott-streaming',
      title: 'YouTube Premium & Music',
      slug: 'youtube-premium-music',
      tagline: 'No Ads, Background Play & YouTube Music Included',
      description: 'Elevate your YouTube experience. Watch millions of videos uninterrupted by ads, play videos in the background while multitasking or screen locked, and get complete YouTube Music Premium.',
      logo_url: '/assets/brands/youtube-premium.svg',      base_price: 2.49,
      original_price: 13.99,
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
        { name: '1 Month - Personal Invite', tier: 'family', months: 1, label: '1 Month (Your Own Gmail)', usd: 2.49, bdt: 300, orig: 13.99, popular: 0, devices: 'All your devices', features: 'Applied to your own Gmail, No passwords needed' },
        { name: '6 Months - Personal Invite', tier: 'family', months: 6, label: '6 Months (Your Own Gmail)', usd: 10.99, bdt: 1320, orig: 49.99, popular: 1, devices: 'All your devices', features: '6 months on your own Gmail, seamless renewal' },
        { name: '12 Months - Personal Invite', tier: 'family', months: 12, label: '12 Months (Yearly Pass)', usd: 18.99, bdt: 2280, orig: 99.99, popular: 0, devices: 'All your devices', features: '1 Full Year uninterrupted on your personal email' },
      ],
      vault_seeds: [
        { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://families.google.com/join/flixstore-yt-invite-9932', instr: 'Click the activation link to join YouTube Premium family group with your own Google email.' }
      ]
    },

    // --- REGIONAL BENGALI OTT ---
    {
      cat_slug: 'regional-bengali',
      title: 'Hoichoi Premium',
      slug: 'hoichoi-premium',
      tagline: 'World’s Largest Bengali Entertainment Library',
      description: 'Stream 600+ Bengali blockbuster movies, 150+ award-winning exclusive web series, Feluda, Byomkesh, Eken Babu, Karagar and timeless classic cinema in Full HD with English subtitles.',
      logo_url: '/assets/brands/hoichoi.png',      base_price: 2.99,
      original_price: 9.99,
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
        { name: '1 Month - Shared Screen', tier: 'shared', months: 1, label: '1 Month (1 Screen)', usd: 2.49, bdt: 299, orig: 7.99, popular: 0, devices: '1 Device', features: '1 Screen, Full HD, all movies & web series' },
        { name: '3 Months - VIP Access', tier: 'private', months: 3, label: '3 Months (VIP Access)', usd: 5.99, bdt: 720, orig: 18.99, popular: 1, devices: '1 Device', features: '3 Months uninterrupted access, fast replacement guarantee' },
        { name: '12 Months - Full Year Pass', tier: 'private', months: 12, label: '12 Months (Yearly Super Saver)', usd: 12.99, bdt: 1550, orig: 39.99, popular: 0, devices: '1 Device', features: 'Full 1-Year access to entire Hoichoi library' },
      ],
      vault_seeds: [
        { type: 'account', email: 'hoichoi.bd01@flixstore-auth.com', pass: 'Feluda#Hoichoi26', profile: 'Flix User', pin: '', instr: 'Log in at hoichoi.tv with these credentials.' }
      ]
    },
    {
      cat_slug: 'regional-bengali',
      title: 'Chorki Premium',
      slug: 'chorki-premium',
      tagline: 'Film, Fun, Foorti - The Ultimate Bengali Original Streamer',
      description: 'Bangladesh’s premier streaming platform. Watch exclusive blockbuster movies, binge-worthy original series like Syndicate, Pett Kata Shaw, Redrum, and captivating short films.',
      logo_url: '/assets/brands/chorki.png',      base_price: 2.49,
      original_price: 8.99,
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
        { name: '1 Month - Standard', tier: 'shared', months: 1, label: '1 Month (1 Screen)', usd: 2.29, bdt: 275, orig: 6.99, popular: 0, devices: '1 Device', features: '1 Screen, HD streaming, complete Chorki Originals' },
        { name: '3 Months - Standard', tier: 'private', months: 3, label: '3 Months (Quarterly)', usd: 5.49, bdt: 660, orig: 16.99, popular: 1, devices: '1 Device', features: '3 Months guaranteed continuous streaming' },
        { name: '12 Months - Annual Pass', tier: 'private', months: 12, label: '12 Months (Annual Pass)', usd: 10.99, bdt: 1320, orig: 34.99, popular: 0, devices: '1 Device', features: 'Best value for 1 full year of Bangladeshi cinema' },
      ],
      vault_seeds: [
        { type: 'account', email: 'chorki.stream@flixstore-auth.com', pass: 'ChorkiDhaka#2026', profile: 'Flix User', pin: '', instr: 'Log in at chorki.com.' }
      ]
    },

    // --- AI & PRODUCTIVITY ---
    {
      cat_slug: 'ai-tools',
      title: 'ChatGPT Plus (OpenAI)',
      slug: 'chatgpt-plus-openai',
      tagline: 'GPT-4o, OpenAI o1, DALL-E 3, Canvas & Voice Mode',
      description: 'Supercharge your intellect and workflows with OpenAI’s most advanced AI models. Get access to GPT-4o, OpenAI o1 reasoning model, Canvas interactive editor, image generation with DALL-E 3, and high-speed priority servers.',
      logo_url: '/assets/brands/chatgpt.svg',      base_price: 13.99,
      original_price: 25.00,
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
        { name: '1 Month - Shared Access', tier: 'shared', months: 1, label: '1 Month (Shared Access)', usd: 8.99, bdt: 1080, orig: 18.00, popular: 0, devices: '1 Device', features: 'Shared with 1 other verified user, GPT-4o access' },
        { name: '1 Month - Private Account', tier: 'private', months: 1, label: '1 Month (Private Account)', usd: 14.99, bdt: 1800, orig: 24.99, popular: 1, devices: 'Dedicated Personal Login', features: 'Private personal login, your own chats & memories, zero sharing' },
        { name: '3 Months - Private Account', tier: 'private', months: 3, label: '3 Months (Private VIP)', usd: 39.99, bdt: 4800, orig: 70.00, popular: 0, devices: 'Dedicated Personal Login', features: '90 days uninterrupted access with warranty replacement' },
      ],
      vault_seeds: [
        { type: 'account', email: 'chatgpt.pro01@flixstore-auth.com', pass: 'GptPlus#2026Secure', profile: 'ChatGPT Plus User', pin: '', instr: 'Sign in to chatgpt.com with credentials.' }
      ]
    },
    {
      cat_slug: 'ai-tools',
      title: 'Claude Pro (Anthropic)',
      slug: 'claude-pro-anthropic',
      tagline: 'Claude 3.5 Sonnet, Artifacts, 200K Context Window',
      description: 'The world’s best coding and analytical AI model. Claude 3.5 Sonnet delivers unmatched programming, nuanced creative writing, and real-time interactive UI previews via Artifacts with 5x more usage volume.',
      logo_url: '/assets/brands/claude-ai.svg',      base_price: 14.99,
      original_price: 25.00,
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
        { name: '1 Month - Private Account', tier: 'private', months: 1, label: '1 Month (Private Account)', usd: 14.99, bdt: 1800, orig: 24.99, popular: 1, devices: '1 User Dedicated', features: '100% Private, your chat history saved, Artifacts enabled' },
        { name: '3 Months - Private Account', tier: 'private', months: 3, label: '3 Months (Quarterly Pro)', usd: 39.99, bdt: 4800, orig: 72.00, popular: 0, devices: '1 User Dedicated', features: '3 months full uninterrupted access and warranty' },
      ],
      vault_seeds: [
        { type: 'account', email: 'claude.sonnet01@flixstore-auth.com', pass: 'ClaudePro#Sonnet26', profile: 'Claude Pro User', pin: '', instr: 'Log in at claude.ai.' }
      ]
    },
    {
      cat_slug: 'ai-tools',
      title: 'Midjourney Pro Plan',
      slug: 'midjourney-pro-plan',
      tagline: 'Photorealistic AI Image Generation, Stealth Mode & Fast GPU',
      description: 'Create jaw-dropping photorealistic imagery, artistic concept art, 3D renders, and cinematic visuals with Midjourney. Includes 30 hours of Fast GPU time, unlimited Relax mode, and commercial usage rights.',
      logo_url: '/assets/brands/midjourney.svg',      base_price: 12.99,
      original_price: 36.00,
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
        { name: '1 Month - Standard Plan', tier: 'private', months: 1, label: '1 Month (Standard Plan)', usd: 12.99, bdt: 1560, orig: 30.00, popular: 1, devices: '1 Discord Account', features: '15h Fast GPU, Unlimited Relax GPU, Commercial License' },
        { name: '3 Months - Standard Plan', tier: 'private', months: 3, label: '3 Months (Quarterly)', usd: 34.99, bdt: 4200, orig: 85.00, popular: 0, devices: '1 Discord Account', features: 'Quarterly continuous high-speed generation' },
      ],
      vault_seeds: [
        { type: 'account', email: 'midjourney.art@flixstore-auth.com', pass: 'MjArtGen#2026x', profile: 'Artist Pro', pin: '', instr: 'Discord account with active Midjourney subscription.' }
      ]
    },

    // --- MUSIC & AUDIO ---
    {
      cat_slug: 'music-audio',
      title: 'Spotify Premium Individual',
      slug: 'spotify-premium-individual',
      tagline: 'Zero Ads, Offline Downloads & Extreme 320kbps Audio',
      description: 'Play any song, anytime, anywhere. Unlimited skips, zero commercial interruptions, offline music downloads for road trips, and 320kbps high-fidelity audio with Spotify Connect.',
      logo_url: '/assets/brands/spotify.svg',      base_price: 2.49,
      original_price: 10.99,
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
        { name: '1 Month - Upgrade Invite', tier: 'family', months: 1, label: '1 Month (Your Own Account)', usd: 2.49, bdt: 299, orig: 10.99, popular: 0, devices: 'All your devices', features: 'Applied directly to your own Spotify email' },
        { name: '3 Months - Upgrade Invite', tier: 'family', months: 3, label: '3 Months (Your Own Account)', usd: 6.49, bdt: 780, orig: 29.99, popular: 1, devices: 'All your devices', features: '3 months guaranteed on your personal account' },
        { name: '6 Months - Upgrade Invite', tier: 'family', months: 6, label: '6 Months (Value Pass)', usd: 11.99, bdt: 1440, orig: 59.99, popular: 0, devices: 'All your devices', features: 'Save 65%, hassle-free music streaming' },
        { name: '12 Months - Annual Pass', tier: 'family', months: 12, label: '12 Months (1 Full Year)', usd: 21.99, bdt: 2640, orig: 119.99, popular: 0, devices: 'All your devices', features: 'Full 1-year uninterrupted premium with full warranty' },
      ],
      vault_seeds: [
        { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://spotify.com/family/join/flixstore-sp-token-8841', instr: 'Click to upgrade your own Spotify account to Premium.' }
      ]
    },
    {
      cat_slug: 'music-audio',
      title: 'Apple Music Premium',
      slug: 'apple-music-premium',
      tagline: '100M+ Songs, Spatial Audio with Dolby Atmos & Lossless',
      description: 'Immerse yourself in music the way the artist intended. Experience pristine Lossless Audio up to 24-bit/192kHz, Spatial Audio with dynamic head tracking, real-time lyrics and Apple Music Sing.',
      logo_url: '/assets/brands/apple-music.svg',      base_price: 2.99,
      original_price: 10.99,
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
        { name: '1 Month - Apple Music', tier: 'family', months: 1, label: '1 Month (Apple Invite)', usd: 2.99, bdt: 360, orig: 10.99, popular: 0, devices: 'Personal Apple ID', features: 'Join via Family Share on your own Apple ID' },
        { name: '6 Months - Apple Music', tier: 'family', months: 6, label: '6 Months (Apple Invite)', usd: 14.99, bdt: 1800, orig: 65.99, popular: 1, devices: 'Personal Apple ID', features: '6 months uninterrupted high-res audio' },
        { name: '12 Months - Annual Pass', tier: 'family', months: 12, label: '12 Months (Full Year)', usd: 26.99, bdt: 3240, orig: 109.99, popular: 0, devices: 'Personal Apple ID', features: '1 Year uninterrupted, 24/7 warranty support' },
      ],
      vault_seeds: [
        { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://apple.com/family-invite/flixstore-am-3910', instr: 'Accept the Apple Family invitation from your device settings.' }
      ]
    },

    // --- CLOUD & CREATIVE ---
    {
      cat_slug: 'cloud-creative',
      title: 'Adobe Creative Cloud All Apps',
      slug: 'adobe-creative-cloud-all-apps',
      tagline: '20+ Professional Creative Apps + 100GB Cloud Storage',
      description: 'The industry standard for creators, designers, and video editors. Full access to Photoshop, Premiere Pro, Illustrator, After Effects, InDesign, Lightroom, Acrobat Pro, and Adobe Firefly Generative AI credits.',
      logo_url: '/assets/brands/adobe-creative-cloud.svg',      base_price: 15.99,
      original_price: 59.99,
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
        { name: '1 Month - All Apps License', tier: 'license', months: 1, label: '1 Month (Your Own Adobe ID)', usd: 15.99, bdt: 1920, orig: 59.99, popular: 0, devices: '2 Devices Simultaneously', features: 'Applied directly to your Adobe email' },
        { name: '3 Months - All Apps License', tier: 'license', months: 3, label: '3 Months (Your Own Adobe ID)', usd: 42.99, bdt: 5150, orig: 179.99, popular: 1, devices: '2 Devices Simultaneously', features: '3 months uninterrupted creative workflow' },
        { name: '12 Months - Annual Pro License', tier: 'license', months: 12, label: '12 Months (Annual Pro Pass)', usd: 129.99, bdt: 15500, orig: 699.99, popular: 0, devices: '2 Devices Simultaneously', features: 'Full 1-Year enterprise seat with 100% warranty' },
      ],
      vault_seeds: [
        { type: 'license_key', email: 'adobe.ent@flixstore-auth.com', pass: '', profile: '', pin: '', key: 'ADOBE-CC-ENT-9481-2026-FLIX', instr: 'Enterprise invite will be assigned to your checkout email.' }
      ]
    },
    {
      cat_slug: 'cloud-creative',
      title: 'Google One 2TB Cloud + Gemini',
      slug: 'google-one-2tb-cloud',
      tagline: '2TB Storage for Drive, Gmail, Photos + Gemini Advanced',
      description: 'Never worry about running out of space again. Get 2TB (2,000 GB) of secure cloud storage across Google Drive, Gmail, and Google Photos with original quality photo backups and Gemini Advanced AI integration.',
      logo_url: '/assets/brands/google-one.svg',      base_price: 3.99,
      original_price: 19.99,
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
        { name: '1 Month - 2TB Storage', tier: 'family', months: 1, label: '1 Month (Your Own Gmail)', usd: 3.99, bdt: 480, orig: 19.99, popular: 0, devices: 'All your devices', features: 'Applied to your own personal Gmail' },
        { name: '6 Months - 2TB Storage', tier: 'family', months: 6, label: '6 Months (Your Own Gmail)', usd: 18.99, bdt: 2280, orig: 59.99, popular: 1, devices: 'All your devices', features: '6 months 2TB storage on your personal account' },
        { name: '12 Months - 2TB Annual Pass', tier: 'family', months: 12, label: '12 Months (Annual 2TB Pass)', usd: 32.99, bdt: 3950, orig: 119.99, popular: 0, devices: 'All your devices', features: '1 Full Year uninterrupted 2TB storage' },
      ],
      vault_seeds: [
        { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://one.google.com/family/join/flixstore-g1-storage-2tb-418', instr: 'Join Google One family storage pool.' }
      ]
    },
    {
      cat_slug: 'cloud-creative',
      title: 'Canva Pro Subscription',
      slug: 'canva-pro-subscription',
      tagline: 'Brand Kit, Magic Studio AI & 100M+ Premium Stock Assets',
      description: 'Create professional graphics, social media posts, presentations, and video reels in minutes. Unlock 100M+ premium photos, graphics, videos, 1-click Background Remover, Magic Resize, and Brand Kits.',
      logo_url: '/assets/brands/canva.svg',      base_price: 3.49,
      original_price: 12.99,
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
        { name: '1 Year - Pro Team Invite', tier: 'family', months: 12, label: '1 Year (Your Own Canva Email)', usd: 6.99, bdt: 840, orig: 49.99, popular: 1, devices: 'Unlimited devices', features: 'Full 1-Year Pro access on your own Canva email' },
        { name: 'Lifetime - Pro Team Access', tier: 'family', months: 99, label: 'Lifetime VIP (Your Own Canva Email)', usd: 14.99, bdt: 1800, orig: 119.99, popular: 0, devices: 'Unlimited devices', features: 'Lifetime team membership with free replacements' },
      ],
      vault_seeds: [
        { type: 'invite_link', email: '', pass: '', profile: '', pin: '', link: 'https://canva.com/brand/join?token=flixstore-canva-vip-9901', instr: 'Click link to upgrade personal Canva account to Pro.' }
      ]
    },

    // --- VPN & SECURITY ---
    {
      cat_slug: 'vpn-security',
      title: 'NordVPN & Threat Protection',
      slug: 'nordvpn-threat-protection',
      tagline: 'Ultra-Fast 10Gbps Servers, Anti-Malware & Zero Logs',
      description: 'Protect your online privacy, bypass geo-restrictions, and secure public Wi-Fi. Features 6,400+ ultra-fast servers in 111 countries, Threat Protection anti-malware, and Double VPN encryption.',
      logo_url: '/assets/brands/nordvpn.svg',      base_price: 3.49,
      original_price: 15.99,
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
        { name: '1 Month - Shared Login', tier: 'shared', months: 1, label: '1 Month (1 Device)', usd: 3.49, bdt: 420, orig: 15.99, popular: 0, devices: '1 Device', features: 'Full server access, 1 device simultaneous' },
        { name: '12 Months - Private Login', tier: 'private', months: 12, label: '12 Months (Private Account)', usd: 24.99, bdt: 3000, orig: 89.99, popular: 1, devices: '6 Devices Simultaneously', features: 'Full 1-year access for up to 6 devices' },
        { name: '24 Months - 2 Year Ultra Pass', tier: 'private', months: 24, label: '24 Months (2 Full Years)', usd: 39.99, bdt: 4800, orig: 159.99, popular: 0, devices: '6 Devices Simultaneously', features: '2 Full Years coverage, highest savings' },
      ],
      vault_seeds: [
        { type: 'account', email: 'nordvpn.user@flixstore-auth.com', pass: 'NordShield#2026', profile: 'Nord User', pin: '', instr: 'Log into NordVPN app.' }
      ]
    }
  ];

  // Insert all products and plans into SQLite
  for (const p of productsData) {
    const cat = db.prepare('SELECT id FROM categories WHERE slug = ?').get(p.cat_slug);
    if (!cat) continue;

    const res = insertProduct.run(
      cat.id,
      p.title,
      p.slug,
      p.tagline,
      p.description,
      p.logo_url,
      p.badge,
      p.base_price,
      p.original_price,
      'Instant',
      'Full Duration Warranty',
      p.rating,
      p.review_count,
      'in_stock',
      p.is_featured,
      p.is_trending,
      p.is_bestseller,
      p.features_list,
      p.instructions
    );

    const productId = res.lastInsertRowid;

    // Plans
    let planIndex = 0;
    for (const pl of p.plans) {
      planIndex++;
      const planRes = insertPlan.run(
        productId,
        pl.name,
        pl.tier,
        pl.months,
        pl.label,
        pl.usd,
        pl.bdt,
        pl.orig,
        pl.popular,
        pl.devices,
        pl.features,
        planIndex
      );

      const planId = planRes.lastInsertRowid;

      // Vault items for first plan if available
      if (planIndex === 1 && p.vault_seeds && p.vault_seeds.length > 0) {
        for (const vs of p.vault_seeds) {
          insertVault.run(
            productId,
            planId,
            vs.type,
            vs.email || null,
            vs.pass || null,
            vs.profile || null,
            vs.pin || null,
            vs.key || null,
            vs.link || null,
            vs.instr || null
          );
        }
      }
    }
  }

  // 4. Seed Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_percent, discount_amount_usd, min_spend_usd, max_uses, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertCoupon.run('FLIXVIP', 15, 0, 5, 5000, 1);
  insertCoupon.run('FLIXSTORE10', 10, 0, 0, 5000, 1);
  insertCoupon.run('SAVE5', 0, 5, 20, 1000, 1);
  insertCoupon.run('BENGALISPECIAL', 20, 0, 0, 2000, 1);

  // 5. Seed Customer Reviews
  const insertReview = db.prepare(`
    INSERT INTO reviews (product_id, customer_name, rating, headline, comment, verified_purchase)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const nflx = db.prepare('SELECT id FROM products WHERE slug = ?').get('netflix-premium-4k-uhd');
  if (nflx) {
    insertReview.run(nflx.id, 'Tariqul Islam', 5, 'Instant Delivery in 30 Seconds!', 'Unbelievably fast delivery. Received the credentials on my screen and on WhatsApp instantly. 4K HDR works like magic on my LG OLED TV. FlixStore is now my #1 place.', 1);
    insertReview.run(nflx.id, 'Sophia Martinez', 5, 'Best Customer Support Ever', 'Had an issue when Netflix did an update, messaged FlixStore WhatsApp support and got a new PIN within 3 minutes. Truly professional service.', 1);
    insertReview.run(nflx.id, 'Ahmed Rahman', 5, 'Flawless 4K Stream', 'Been using the private PIN profile for 3 months now. No interruptions, no kicking out. Premium quality.', 1);
  }

  const gpt = db.prepare('SELECT id FROM products WHERE slug = ?').get('chatgpt-plus-openai');
  if (gpt) {
    insertReview.run(gpt.id, 'David Chen', 5, 'ChatGPT Plus Private Account is Superb', 'Dedicated account with OpenAI o1 and voice mode working 100%. Saves me so much money compared to direct billing. Highly recommend to all developers.', 1);
    insertReview.run(gpt.id, 'Nusrat Jahan', 5, 'Game changer for my research work', 'All my chat history stays private and intact. The payment with bKash was completely smooth and instant!', 1);
  }

  const hoi = db.prepare('SELECT id FROM products WHERE slug = ?').get('hoichoi-premium');
  if (hoi) {
    insertReview.run(hoi.id, 'Rohan Banerjee', 5, 'Great for Feluda and Byomkesh!', 'Watched all episodes in Full HD without any buffering. bKash payment process was automatic.', 1);
  }

  const sp = db.prepare('SELECT id FROM products WHERE slug = ?').get('spotify-premium-individual');
  if (sp) {
    insertReview.run(sp.id, 'Liam Walker', 5, 'Upgraded my own personal account seamlessly', 'Did not have to migrate my playlists or liked songs. The invite link upgraded my existing account in 1 minute.', 1);
  }

  // 6. Seed sample completed orders for rich Admin dashboard stats
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, user_id, customer_name, customer_email, customer_phone,
      payment_method, payment_status, transaction_id, currency, currency_symbol,
      subtotal, discount, total_amount, coupon_code, delivery_status, delivered_credentials, customer_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, plan_id, product_title, plan_name, duration_label, unit_price, quantity, total_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const sampleOrders = [
    { num: 'FLX-98214', name: 'Zubair Hossain', email: 'zubair@example.com', phone: '+8801711223344', method: 'bkash', trx: '9K2M4019XZ', sub: 5.99, disc: 0.90, tot: 5.09, coupon: 'FLIXVIP', time: '-2 hours', prod: 'netflix-premium-4k-uhd', planName: '1 Month - Private Profile (PIN)', dur: '1 Month', pPrice: 5.99 },
    { num: 'FLX-98215', name: 'Elena Rostova', email: 'elena@gmail.com', phone: '+14159981245', method: 'card', trx: 'ch_3N8274198421', sub: 14.99, disc: 1.50, tot: 13.49, coupon: 'FLIXSTORE10', time: '-5 hours', prod: 'chatgpt-plus-openai', planName: '1 Month - Private Account', dur: '1 Month', pPrice: 14.99 },
    { num: 'FLX-98216', name: 'Tanvir Ahmed', email: 'tanvir@outlook.com', phone: '+8801822334455', method: 'nagad', trx: 'NAG78210492', sub: 2.99, disc: 0, tot: 2.99, coupon: '', time: '-1 day', prod: 'hoichoi-premium', planName: '1 Month - Shared Screen', dur: '1 Month', pPrice: 2.99 },
    { num: 'FLX-98217', name: 'Marcus Bell', email: 'marcus@techstudio.co', phone: '+447911123456', method: 'paypal', trx: 'PAYPAL-8812903', sub: 42.99, disc: 6.45, tot: 36.54, coupon: 'FLIXVIP', time: '-2 days', prod: 'adobe-creative-cloud-all-apps', planName: '3 Months - All Apps License', dur: '3 Months', pPrice: 42.99 },
    { num: 'FLX-98218', name: 'Sadia Khan', email: 'sadia.k@yahoo.com', phone: '+8801933445566', method: 'bkash', trx: '9A77610291', sub: 6.99, disc: 0.70, tot: 6.29, coupon: 'FLIXSTORE10', time: '-3 days', prod: 'canva-pro-subscription', planName: '1 Year - Pro Team Invite', dur: '12 Months', pPrice: 6.99 },
  ];

  for (const so of sampleOrders) {
    const prod = db.prepare('SELECT id, title FROM products WHERE slug = ?').get(so.prod);
    const plan = prod ? db.prepare('SELECT id FROM product_plans WHERE product_id = ? LIMIT 1').get(prod.id) : null;

    const credPayload = JSON.stringify({
      product: so.prod,
      account_email: `${so.prod.split('-')[0]}.user@flixstore-auth.com`,
      account_password: 'FlixSecurePassword#2026',
      profile_name: 'VIP Profile',
      profile_pin: '8392',
      special_instructions: 'Enjoy your subscription. Contact support for 24/7 warranty help.'
    });

    const oRes = insertOrder.run(
      so.num,
      null,
      so.name,
      so.email,
      so.phone,
      so.method,
      'completed',
      so.trx,
      'USD',
      '$',
      so.sub,
      so.disc,
      so.tot,
      so.coupon,
      'delivered',
      credPayload,
      'Instant Auto-delivery',
      so.time
    );

    if (prod && plan) {
      insertOrderItem.run(
        oRes.lastInsertRowid,
        prod.id,
        plan.id,
        prod.title,
        so.planName,
        so.dur,
        so.pPrice,
        1,
        so.pPrice
      );
    }
  }

  console.log('FlixStore Database successfully populated with high-grade catalog & credentials vault!');
}

module.exports = {
  db,
  DB_PATH,
  hashPassword,
  verifyPassword,
  initDatabase
};
