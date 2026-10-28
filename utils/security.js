const crypto = require('node:crypto');

// In-memory rate limiting map
const rateLimitMap = new Map();

// Simple in-memory sliding window rate limiter
function rateLimiter({ windowMs = 60000, max = 30, message = 'Too many requests, please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();

    let record = rateLimitMap.get(ip);
    if (!record) {
      record = { timestamps: [] };
      rateLimitMap.set(ip, record);
    }

    // Filter out timestamps outside window
    record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);

    if (record.timestamps.length >= max) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((windowMs - (now - record.timestamps[0])) / 1000)
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// Clean old rate limit entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    record.timestamps = record.timestamps.filter(ts => now - ts < 300000);
    if (record.timestamps.length === 0) {
      rateLimitMap.delete(ip);
    }
  }
}, 300000);

// Basic string sanitizer to prevent stored/reflected XSS
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
}

// Secure Order ID generator (e.g., FLX-849201)
function generateOrderNumber() {
  const randomDigits = crypto.randomInt(100000, 999999);
  return `FLX-${randomDigits}`;
}

// Generate digital license key for fallback allocation
function generateLicenseKey(prefix = 'FLIX') {
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part3 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${part1}-${part2}-${part3}`;
}

module.exports = {
  rateLimiter,
  sanitizeInput,
  generateOrderNumber,
  generateLicenseKey
};
