const { db } = require('../db/database');

const rows = db.prepare(`
  SELECT p.title, p.slug, pl.plan_name, pl.price_bdt, pl.original_price_bdt
  FROM products p
  JOIN product_plans pl ON p.id = pl.product_id
  WHERE p.slug IN (
    'netflix-premium-4k-uhd',
    'amazon-prime-video',
    'crunchyroll-mega-fan',
    'hoichoi-premium',
    'chorki-premium',
    'chatgpt-plus-openai',
    'spotify-premium-individual',
    'youtube-premium-music',
    'netflix-primevideo-combo',
    'hbo-max-streaming',
    'disney-plus-premium',
    'grammarly-premium-ai',
    'claude-pro-anthropic',
    'microsoft-365-office-suite'
  )
  ORDER BY p.id ASC, pl.sort_order ASC
`).all();

console.table(rows);
