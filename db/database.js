const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');

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

// Check if PostgreSQL connection URL is provided (e.g. Neon, Supabase, Render Postgres)
const DATABASE_URL = process.env.DATABASE_URL || '';
const isPostgres = DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://');

let db;
let DB_PATH = '';

if (isPostgres) {
  console.log('[DATABASE] Connecting to Managed Cloud PostgreSQL (Neon / Supabase)...');
  const pg = require('pg');
  // Automatically parse PostgreSQL NUMERIC/DECIMAL (OID 1700) as Float so numbers like rating & prices aren't strings
  pg.types.setTypeParser(1700, val => (val === null ? null : parseFloat(val)));
  // Automatically parse BIGINT/INT8 (OID 20) as safe Integer
  pg.types.setTypeParser(20, val => (val === null ? null : parseInt(val, 10)));
  const { Pool } = pg;
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.warn('[DATABASE] Idle client error on Neon pool:', err.message);
  });

  async function queryWithRetry(sql, params = [], retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        const isTransient = err.code === 'ECONNRESET' || err.code === '57P01' || err.code === 'ETIMEDOUT' || err.message?.includes('Connection terminated');
        if (isTransient && attempt < retries) {
          console.warn(`[DATABASE] Transient error (${err.code || err.message}), retrying query (attempt ${attempt + 1}/${retries})...`);
          await new Promise(r => setTimeout(r, 600 * attempt));
          continue;
        }
        throw err;
      }
    }
  }

  function formatPgSql(sql, isInsert = false) {
    let index = 1;
    let formatted = sql.replace(/\?/g, () => `$${index++}`);
    formatted = formatted.replace(/GROUP_CONCAT\s*\(\s*([^,)]+)(?:\s*,\s*([^)]+))?\s*\)/gi, (m, col, sep) => {
      return `STRING_AGG(CAST(${col} AS TEXT), ${sep || "','"})`;
    });
    formatted = formatted.replace(/datetime\('now'[^)]*\)/gi, 'CURRENT_TIMESTAMP');
    if (isInsert && !/RETURNING\s+id/i.test(formatted)) {
      formatted += ' RETURNING id';
    }
    return formatted;
  }

  db = {
    isPostgres: true,
    pool,
    prepare(sql) {
      const isInsert = /^\s*INSERT\s+INTO/i.test(sql);
      const pgSql = formatPgSql(sql, isInsert);

      return {
        async all(...params) {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const res = await queryWithRetry(pgSql, flat);
          return res.rows;
        },
        async get(...params) {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const res = await queryWithRetry(pgSql, flat);
          return res.rows[0] || null;
        },
        async run(...params) {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          const res = await queryWithRetry(pgSql, flat);
          return {
            lastInsertRowid: res.rows[0]?.id || 0,
            changes: res.rowCount
          };
        }
      };
    },
    async exec(sql) {
      return await queryWithRetry(sql);
    }
  };
} else {
  // Local SQLite (built into Node.js 22)
  const { DatabaseSync } = require('node:sqlite');
  DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'flixstore.db');

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const sqliteDb = new DatabaseSync(DB_PATH);

  db = {
    isPostgres: false,
    sqliteDb,
    prepare(sql) {
      const stmt = sqliteDb.prepare(sql);
      return {
        all(...params) {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.all(...flat);
        },
        get(...params) {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.get(...flat);
        },
        run(...params) {
          const flat = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
          return stmt.run(...flat);
        }
      };
    },
    exec(sql) {
      return sqliteDb.exec(sql);
    }
  };
}

// Initialize tables and seed initial catalog
async function initDatabase() {
  if (isPostgres) {
    await initPostgresSchema();
  } else {
    initSqliteSchema();
  }

  // Ensure default admin & categories exist
  await seedBaseData();

  // Ensure all 20 verified subscriptions are synced
  try {
    const prodCount = await db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (!prodCount || Number(prodCount.count) < 20) {
      console.log(`[CATALOG SYNC] Detected ${prodCount ? prodCount.count : 0}/20 products. Synchronizing full 20-product catalog...`);
      const { syncCatalog } = require('../scripts/update-catalog');
      await syncCatalog(db);
    }
  } catch (err) {
    console.error('[CATALOG SYNC ERROR]:', err);
  }
}

function initSqliteSchema() {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

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

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      badge TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    );

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
      original_price_bdt REAL,
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

    CREATE TABLE IF NOT EXISTS product_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      plan_name TEXT NOT NULL,
      tier_type TEXT DEFAULT 'private',
      duration_months INTEGER NOT NULL,
      duration_label TEXT NOT NULL,
      price_usd REAL NOT NULL,
      price_bdt REAL NOT NULL,
      original_price_usd REAL,
      original_price_bdt REAL,
      is_popular INTEGER DEFAULT 0,
      device_limit TEXT DEFAULT '1 Device',
      plan_features TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS credential_vault (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      plan_id INTEGER,
      credential_type TEXT NOT NULL DEFAULT 'account',
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

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'completed',
      transaction_id TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      currency_symbol TEXT NOT NULL DEFAULT '$',
      subtotal REAL NOT NULL,
      discount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      coupon_code TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'delivered',
      delivered_credentials TEXT,
      customer_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

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

    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function initPostgresSchema() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      phone TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      badge TEXT,
      description TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT,
      description TEXT,
      logo_url TEXT NOT NULL,
      badge TEXT,
      base_price NUMERIC NOT NULL,
      original_price NUMERIC,
      original_price_bdt NUMERIC,
      delivery_time TEXT DEFAULT 'Instant',
      warranty TEXT DEFAULT 'Full Duration Warranty',
      rating NUMERIC DEFAULT 4.9,
      review_count INTEGER DEFAULT 128,
      stock_status TEXT DEFAULT 'in_stock',
      is_featured INTEGER DEFAULT 0,
      is_trending INTEGER DEFAULT 0,
      is_bestseller INTEGER DEFAULT 0,
      features_list TEXT,
      instructions TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_plans (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      plan_name TEXT NOT NULL,
      tier_type TEXT DEFAULT 'private',
      duration_months INTEGER NOT NULL,
      duration_label TEXT NOT NULL,
      price_usd NUMERIC NOT NULL,
      price_bdt NUMERIC NOT NULL,
      original_price_usd NUMERIC,
      original_price_bdt NUMERIC,
      is_popular INTEGER DEFAULT 0,
      device_limit TEXT DEFAULT '1 Device',
      plan_features TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS credential_vault (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      plan_id INTEGER REFERENCES product_plans(id) ON DELETE SET NULL,
      credential_type TEXT NOT NULL DEFAULT 'account',
      account_email TEXT,
      account_password TEXT,
      profile_name TEXT,
      profile_pin TEXT,
      license_key TEXT,
      activation_link TEXT,
      special_instructions TEXT,
      is_used INTEGER DEFAULT 0,
      assigned_order_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      discount_percent INTEGER DEFAULT 0,
      discount_amount_usd NUMERIC DEFAULT 0,
      min_spend_usd NUMERIC DEFAULT 0,
      max_uses INTEGER DEFAULT 1000,
      used_count INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'completed',
      transaction_id TEXT,
      currency TEXT NOT NULL DEFAULT 'USD',
      currency_symbol TEXT NOT NULL DEFAULT '$',
      subtotal NUMERIC NOT NULL,
      discount NUMERIC DEFAULT 0,
      total_amount NUMERIC NOT NULL,
      coupon_code TEXT,
      delivery_status TEXT NOT NULL DEFAULT 'delivered',
      delivered_credentials TEXT,
      customer_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      plan_id INTEGER NOT NULL REFERENCES product_plans(id) ON DELETE CASCADE,
      product_title TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      duration_label TEXT NOT NULL,
      unit_price NUMERIC NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_price NUMERIC NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      rating NUMERIC NOT NULL,
      headline TEXT,
      comment TEXT NOT NULL,
      verified_purchase INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      event_type TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function seedBaseData() {
  const catCheck = await db.prepare('SELECT COUNT(*) as count FROM categories').get();
  if (catCheck && Number(catCheck.count) > 0) return;

  console.log('[DATABASE] Seeding base users, categories, and promo coupons...');

  // 1. Admin & Customer accounts
  const insertUser = db.prepare(`
    INSERT INTO users (email, password_hash, full_name, role, phone)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT (email) DO NOTHING
  `);
  await insertUser.run('admin@flixstore.com', hashPassword('FlixAdmin2026!'), 'FlixStore Admin', 'admin', '+8801343546958');
  await insertUser.run('customer@flixstore.com', hashPassword('Customer2026!'), 'Rifat Chowdhury', 'customer', '+8801700112233');

  // 2. Categories
  const insertCategory = db.prepare(`
    INSERT INTO categories (slug, name, icon, badge, description, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (slug) DO NOTHING
  `);

  await insertCategory.run('ott-streaming', 'OTT & Streaming', 'film', 'Most Popular', 'Netflix, Prime Video, Disney+, Apple TV+ and Max premium passes.', 1);
  await insertCategory.run('regional-bengali-ott', 'Regional Bengali OTT', 'tv', 'Popular in BD', 'Hoichoi, Chorki, Bioscope and Bengali entertainment portals.', 2);
  await insertCategory.run('ai-productivity', 'AI & Productivity', 'cpu', 'Trending', 'ChatGPT Plus, Claude Pro, Midjourney and GitHub Copilot.', 3);
  await insertCategory.run('music-audio', 'Music & Audio', 'music', null, 'Spotify Premium, Apple Music, YouTube Premium and Tidal HiFi.', 4);
  await insertCategory.run('cloud-creative', 'Cloud & Creative', 'cloud', 'Pro Suites', 'Canva Pro, Adobe Creative Cloud, Google One and Microsoft 365.', 5);
  await insertCategory.run('security-utilities', 'VPN & Security', 'shield', null, 'NordVPN, ExpressVPN, Surfshark and premium cybersecurity tools.', 6);

  // 3. Coupons
  const insertCoupon = db.prepare(`
    INSERT INTO coupons (code, discount_percent, discount_amount_usd, min_spend_usd, max_uses, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT (code) DO NOTHING
  `);
  await insertCoupon.run('FLIXVIP', 15, 0, 5, 5000, 1);
  await insertCoupon.run('FLIXSTORE10', 10, 0, 0, 5000, 1);
  await insertCoupon.run('SAVE5', 0, 5, 20, 1000, 1);
  await insertCoupon.run('BENGALISPECIAL', 20, 0, 0, 2000, 1);
}

module.exports = {
  db,
  DB_PATH,
  hashPassword,
  verifyPassword,
  initDatabase
};
