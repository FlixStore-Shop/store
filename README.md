# 🎬 FlixStore — Ultimate OTT, AI & Cloud Subscriptions Platform

Welcome to **FlixStore**, a premier, ultra-modern e-commerce platform designed with Apple-grade aesthetic minimalism and Amazon/Samsung e-commerce versatility. FlixStore empowers sellers to distribute subscriptions for global OTT platforms, cutting-edge AI models, music streaming, and creative cloud tools with **instant 60-second automated credential dispatch**, **multi-gateway payment systems**, and **guaranteed database ownership and security**.

---

## 🌟 Key Highlights & Feature Matrix

### 💎 Apple & Samsung Grade Storefront
- **Dynamic Ambient Theme Engine**: Luxurious dark mode and ultra-clean light mode with seamless one-click toggle.
- **Hero Spotlight Showcase**: Interactive carousel highlighting Netflix 4K, ChatGPT Plus / Claude Pro, Spotify Premium, and regional Bengali OTTs (Hoichoi & Chorki).
- **Multi-Currency System**: Real-time switching and conversion across **USD ($)**, **BDT (৳)**, **EUR (€)**, **GBP (£)**, and **INR (₹)**.
- **Live Search Autocomplete**: Instant search dropdown across subscriptions, categories, and tags.
- **Plan Duration Selector**: Choose between 1 Month, 3 Months, 6 Months, and 12 Months directly on cards or in the Quick View modal with instant discount recalculations.
- **Tier Customization**: Supports Shared Screen, Private Profile with Security PIN, Family Invite Link, and Full Account options.

### 💳 Comprehensive Multi-Gateway Payment System
- **International Credit / Debit Cards**: Stripe-style card preview, card number formatting, and 3D Secure simulation.
- **Regional Mobile Banking (Bangladesh)**: **bKash**, **Nagad**, and **DBBL Rocket** with Merchant number displays, one-click copy, and automated Transaction ID (TrxID) verification.
- **PayPal Express**: One-click PayPal buyer protection checkout.
- **Crypto Payments**: USDT (TRC-20) and Bitcoin wallet address integration with quick copy.
- **Dynamic Coupon Engine**: Server-side coupon verification with percentage or fixed discounts (e.g., `FLIXVIP` for 15% OFF, `FLIXSTORE10` for 10% OFF, `SAVE5` for $5 OFF).

### ⚡ Automated Credential Vault & Instant Fulfillment
- When an order is completed, FlixStore's **automated credential allocation engine** pulls pre-stocked credentials from the database vault or provisions a unique digital activation key.
- Customers receive:
  - Instant on-screen receipt with **Copy Email**, **Copy Password**, and **Copy Profile PIN** buttons.
  - Printable/PDF invoice generation.
  - One-click invite link for family services (Spotify, YouTube Premium, Canva Pro, Google One).
- **Track Order Portal**: Customers can track orders at any time using their Order Number (e.g., `FLX-176516`) or email address.

### 🛡️ Ironclad Security Architecture
- **Password Protection**: Passwords hashed using Node's cryptographic `scrypt` algorithm with unique 64-byte salts (`crypto.scryptSync`).
- **Session Tokens**: Tamper-proof, cryptographically signed HMAC-SHA256 tokens with timing-safe validation.
- **100% Prepared Statements**: Every SQLite query is parameterized with `node:sqlite` prepared statements, completely preventing SQL Injection (SQLi).
- **In-Memory Rate Limiting**: Protects sensitive authentication and checkout routes from brute-force and DDoS attacks.
- **XSS Sanitization**: HTML entity escaping on all user-submitted names, reviews, and notes.
- **Hardened HTTP Headers**: Strict `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and Referrer-Policy headers.

---

## 💾 Database Handover & Vault Ownership

As requested, **you have 100% full ownership of the database**. The complete database is stored as a single, self-contained, high-performance SQLite 3 file in the project root:

- **File Location**: `./flixstore.db`
- **Database Engine**: Native Node.js `node:sqlite` (SQLite 3.45+) with Write-Ahead Logging (`WAL`) mode enabled.

### How to Access & Export the Database:
1. **Direct File Handover**:
   You can copy, backup, or open `flixstore.db` directly in tools like **DB Browser for SQLite**, **VS Code SQLite Viewer**, or the `sqlite3` CLI.
2. **One-Click Download via Admin Portal**:
   Log into the Admin Portal (`/admin`), navigate to the **Database & Security** tab, and click **"Download flixstore.db"**. The server will flush the WAL cache and stream the fresh `.db` file directly to your browser.
3. **Full JSON Backup**:
   Click **"Export Full JSON Database"** to download all tables (users, products, plans, orders, reviews, vault keys, coupons) as structured JSON.

### Database Schema Overview:
- `users`: Administrator and customer accounts with salt-hashed passwords.
- `categories`: Subscription categories (OTT, Regional Bengali, AI Tools, Music, Cloud/Creative, VPN).
- `products`: Catalog items with badges, descriptions, base prices, ratings, and instructions.
- `product_plans`: Duration variants (1mo, 3mo, 6mo, 12mo) and tier pricing in USD & BDT.
- `credential_vault`: Pre-stocked accounts, passwords, PINs, and invite links.
- `orders`: Order headers, customer details, payment methods, transaction IDs, and dispatched credentials.
- `order_items`: Line items mapping orders to products and specific plans.
- `coupons`: Active discount promo codes.
- `reviews`: Verified customer ratings and feedback.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v22.5.0 or higher (Node v24 recommended)
- **npm**: v10+

### 2. Quick Start
```bash
# Start the production server
npm start
```
The server will boot up at:
- 🌐 **Storefront**: [http://localhost:3000](http://localhost:3000)
- 🛡️ **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)

### 3. Running Automated Tests
```bash
npm test
```
Runs the 9-point end-to-end integration test suite verifying catalog loading, coupon calculations, real checkout simulation, credential dispatch, order tracking, admin authentication, and database integrity checks.

---

## 📞 Official Store Channels & Support

- **WhatsApp Support**: [+8801343546958](https://wa.me/8801343546958)
- **Facebook Official Page**: [https://www.facebook.com/FlixStore.org](https://www.facebook.com/FlixStore.org)
- **Payment Verification Numbers**: `01343-546958` (bKash & Nagad Send Money)

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|---|---|---|
| **Master Admin** | `admin@flixstore.com` | `adminflixstore2026!` |
| **Demo Customer** | `customer@example.com` | `customer123` |

*(You can change passwords or create new administrators anytime from the Admin Portal or directly via the database.)*

---

## 📦 Pre-Configured Subscription Catalog

1. **OTT & Video Platforms**:
   - Netflix Premium 4K UHD (Shared, Private PIN, 5-Screen Full Account)
   - Amazon Prime Video 4K UHD
   - Crunchyroll Mega Fan (Ad-free anime, offline downloads)
   - YouTube Premium & Music (Applied to your own Gmail via family invite)
   - Disney+ Hotstar / Disney+ Premium
2. **Regional Bengali OTT**:
   - **Hoichoi Premium** (Full HD Feluda, Byomkesh, movies & originals)
   - **Chorki Premium** (Bangladeshi original films & web series)
3. **AI & Productivity Subscriptions**:
   - **ChatGPT Plus (OpenAI)** (GPT-4o, OpenAI o1, Canvas, Voice Mode)
   - **Claude Pro (Anthropic)** (Claude 3.5 Sonnet, Artifacts, 200K Context)
   - **Midjourney Pro** (Photorealistic AI imagery, Fast GPU hours)
4. **Music & Audio Platforms**:
   - **Spotify Premium** (320kbps Extreme audio, applied to personal account)
   - **Apple Music** (Lossless audio & Spatial Audio with Dolby Atmos)
5. **Cloud, Creative & Utilities**:
   - **Adobe Creative Cloud All Apps** (20+ apps including Photoshop & Premiere)
   - **Google One 2TB Cloud + Gemini**
   - **Canva Pro** (1 Year or Lifetime team access)
   - **NordVPN & Threat Protection**

---

© 2026 FlixStore Inc. Built with passion for excellence, aesthetics, and bulletproof security.
