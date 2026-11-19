function formatDescriptionHtml(rawText) {
  if (!rawText) return '';
  let safe = String(rawText)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Convert markdown bold **text** to <strong>text</strong>
  safe = safe.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong class="desc-bold">$1</strong>');
  safe = safe.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong class="desc-bold">$1</strong>');
  safe = safe.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, '<strong class="desc-bold">$1</strong>');

  return safe;
}

function formatTaglineHtml(rawText) {
  if (!rawText) return '';
  let safe = String(rawText)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // Convert markdown bold **text** to <strong>text</strong>
  safe = safe.replace(/\*\*([^\*\n]+?)\*\*/g, '<strong class="tagline-bold">$1</strong>');
  safe = safe.replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/gi, '<strong class="tagline-bold">$1</strong>');
  safe = safe.replace(/&lt;strong&gt;([\s\S]*?)&lt;\/strong&gt;/gi, '<strong class="tagline-bold">$1</strong>');

  return safe;
}

/**
 * FlixStore Dedicated Product Page Controller
 * Handles dynamic data fetching, tier & duration selection, instant checkout,
 * tab switching, reviews rendering, and SEO metadata.
 */

const productState = {
  slug: '',
  product: null,
  selectedTier: '',
  selectedPlan: null,
  quantity: 1,
  activeTab: 'features'
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanDurationLabel(duration, months) {
  if (months === 1) return '1 Month';
  if (months === 3) return '3 Months';
  if (months === 6) return '6 Months';
  if (months === 12) return '1 Year';

  if (!duration) return '1 Month';
  let str = String(duration).trim();

  const match = str.match(/^(\d+)\s*(months?|years?|days?|weeks?|hours?)/i);
  if (match) {
    const num = match[1];
    const unit = match[2].toLowerCase();
    if (unit.startsWith('month')) return `${num} ${num === '1' ? 'Month' : 'Months'}`;
    if (unit.startsWith('year')) return `${num} ${num === '1' ? 'Year' : 'Years'}`;
    if (unit.startsWith('day')) return `${num} ${num === '1' ? 'Day' : 'Days'}`;
    if (unit.startsWith('week')) return `${num} ${num === '1' ? 'Week' : 'Weeks'}`;
    if (unit.startsWith('hour')) return `${num} ${num === '1' ? 'Hour' : 'Hours'}`;
  }

  if (/^lifetime/i.test(str)) return 'Lifetime';

  // Strip anything in parentheses like "(Shared Screen)", "(Private PIN Profile)"
  str = str.replace(/\s*\([^)]*\)/g, '').trim();
  // Strip trailing words like Access, VIP, Pass, Plan, Device, Screen
  str = str.replace(/\s+(access|vip|pass|plan|subscription|screen|device)$/i, '').trim();

  return str || '1 Month';
}

document.addEventListener('DOMContentLoaded', () => {
  initProductPage();
});

function getSlugFromURL() {
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  // URL could be /product/:slug
  if (pathParts.length >= 2 && pathParts[0] === 'product') {
    return pathParts[1];
  }
  // Or /product?slug=:slug or /product.html?slug=:slug
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('slug') || urlParams.get('id') || 'netflix-premium-4k-uhd';
}

async function initProductPage() {
  productState.slug = getSlugFromURL();
  if (!productState.slug) {
    showProductNotFound();
    return;
  }

  await loadProductData(productState.slug);
  initStickyPurchaseBarObserver();

  if (typeof window.initFloatingMobileNav === 'function') {
    window.initFloatingMobileNav();
  }
}

async function loadProductData(slug) {
  try {
    const loadingElem = document.getElementById('pdpLoadingState');
    const contentElem = document.getElementById('pdpContentState');
    if (loadingElem) loadingElem.style.display = 'flex';
    if (contentElem) contentElem.style.display = 'none';

    const res = await fetch(`/api/products/${slug}`);
    const json = await res.json();

    if (!json.success || !json.data) {
      showProductNotFound();
      return;
    }

    productState.product = json.data;

    // Set initial plan & tier
    const plans = json.data.plans || [];
    if (plans.length > 0) {
      // Prefer popular plan if available, then private PIN, otherwise first plan's tier
      const popularPlan = plans.find(pl => pl.is_popular);
      const privatePlan = plans.find(pl => pl.tier_type === 'private');
      productState.selectedPlan = popularPlan || privatePlan || plans[0];
      productState.selectedTier = productState.selectedPlan.tier_type || 'shared';
    }

    renderProductDetails();

    if (loadingElem) loadingElem.style.display = 'none';
    if (contentElem) contentElem.style.display = 'block';

  } catch (err) {
    console.error('Failed to load product:', err);
    showProductNotFound();
  }
}

function showProductNotFound() {
  const loadingElem = document.getElementById('pdpLoadingState');
  const errorElem = document.getElementById('pdpErrorState');
  const contentElem = document.getElementById('pdpContentState');
  if (loadingElem) loadingElem.style.display = 'none';
  if (contentElem) contentElem.style.display = 'none';
  if (errorElem) errorElem.style.display = 'block';
}

function renderProductDetails() {
  const p = productState.product;
  if (!p) return;

  // 1. Dynamic Page Meta & Title
  document.title = `${p.title} - Official Subscription | FlixStore`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute('content', `Buy genuine ${p.title} with 60-second instant automated delivery and 100% replacement warranty in Bangladesh.`);
  }
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `${p.title} - Official Subscription | FlixStore`);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', `Buy genuine ${p.title} with instant 60s automated delivery and full warranty in Bangladesh.`);
  const ogImage = document.querySelector('meta[property="og:image"]');
  if (ogImage && p.logo_url) ogImage.setAttribute('content', window.location.origin + p.logo_url);
  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) canonical.setAttribute('href', window.location.href);

  // 2. Breadcrumbs
  const breadcrumbCat = document.getElementById('pdpBreadcrumbCategory');
  const breadcrumbTitle = document.getElementById('pdpBreadcrumbTitle');
  if (breadcrumbCat) breadcrumbCat.textContent = p.category_name;
  if (breadcrumbTitle) breadcrumbTitle.textContent = p.title;

  // 3. Media Column (Left)
  const logoImg = document.getElementById('pdpProductLogo');
  if (logoImg) {
    logoImg.src = p.logo_url ? p.logo_url + '?v=5' : '/assets/flixstore-icon.png';
    logoImg.onerror = function() {
      this.onerror = null;
      this.src = '/assets/flixstore-icon.png';
    };
  }
  
  const badgeTag = document.getElementById('pdpBadgeTag');
  if (badgeTag) {
    const rawBadge = p.badge && p.badge.trim() ? p.badge.trim() : 'Official Verified';
    badgeTag.textContent = rawBadge;
    const badgeClass = rawBadge.toLowerCase().replace(/[^a-z0-9]/g, '');
    badgeTag.className = `badge-tag ${badgeClass || 'official'}`;
  }

  const deliveryBadge = document.getElementById('pdpDeliveryBadge');
  if (deliveryBadge) {
    let dText = p.delivery_time ? p.delivery_time.trim() : '60s Instant Delivery';
    if (dText.toLowerCase() === 'instant') dText = '60s Instant Delivery';
    if (!dText.startsWith('⚡')) dText = `⚡ ${dText}`;
    deliveryBadge.textContent = dText;
  }

  // 3.1 Atmospheric Brand Glow
  const glow = document.querySelector('.pdp-showcase-glow');
  if (glow && p.slug) {
    const slug = p.slug.toLowerCase();
    if (slug.includes('netflix') || slug.includes('hoichoi')) {
      glow.style.background = 'radial-gradient(circle, rgba(229, 9, 20, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('spotify') || slug.includes('chorki')) {
      glow.style.background = 'radial-gradient(circle, rgba(29, 185, 84, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('chatgpt') || slug.includes('claude') || slug.includes('ai') || slug.includes('openai')) {
      glow.style.background = 'radial-gradient(circle, rgba(16, 163, 127, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('hbo') || slug.includes('max')) {
      glow.style.background = 'radial-gradient(circle, rgba(114, 18, 219, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('prime') || slug.includes('disney') || slug.includes('nordvpn')) {
      glow.style.background = 'radial-gradient(circle, rgba(0, 168, 225, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('canva') || slug.includes('adobe') || slug.includes('midjourney')) {
      glow.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('youtube') || slug.includes('apple')) {
      glow.style.background = 'radial-gradient(circle, rgba(255, 0, 0, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else if (slug.includes('crunchyroll')) {
      glow.style.background = 'radial-gradient(circle, rgba(244, 117, 33, 0.28) 0%, rgba(0,0,0,0) 70%)';
    } else {
      glow.style.background = 'radial-gradient(circle, rgba(59, 130, 246, 0.28) 0%, rgba(0,0,0,0) 70%)';
    }
  }

  // 4. Header Info (Right)
  const catPill = document.getElementById('pdpCategoryPill');
  if (catPill) catPill.textContent = p.category_name;

  const titleElem = document.getElementById('pdpProductTitle');
  if (titleElem) {
    const cleanTitle = (p.title || '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    titleElem.textContent = cleanTitle;
    if (p.title_align) {
      titleElem.style.textAlign = p.title_align;
      titleElem.classList.remove('align-center', 'align-right');
      if (p.title_align !== 'left') titleElem.classList.add(`align-${p.title_align}`);
    }
  }

  const taglineElem = document.getElementById('pdpProductTagline');
  if (taglineElem) {
    taglineElem.innerHTML = formatTaglineHtml((p.tagline || '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'));
    if (p.tagline_align) {
      taglineElem.style.textAlign = p.tagline_align;
      taglineElem.classList.remove('align-center', 'align-justify', 'align-right');
      if (p.tagline_align !== 'left') taglineElem.classList.add(`align-${p.tagline_align}`);
    }
  }

  const ratingScore = document.getElementById('pdpRatingScore');
  const reviewCount = document.getElementById('pdpReviewCount');
  if (ratingScore) ratingScore.textContent = Number(p.rating || 5.0).toFixed(1);
  if (reviewCount) {
    const count = parseInt(p.review_count || 128, 10);
    const countFormatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count.toLocaleString();
    reviewCount.textContent = `(${countFormatted})`;
  }

  // ShahedStore Style Highlights Card
  const hlList = document.getElementById('pdpHighlightsList');
  if (hlList) {
    let feats = p.features_list || [];
    if (typeof feats === 'string') {
      try { feats = JSON.parse(feats); } catch(e) { feats = feats.split('\n').map(s => s.trim()).filter(Boolean); }
    }
    if (Array.isArray(feats) && feats.length > 0) {
      hlList.innerHTML = feats.slice(0, 4).map(f => `<li><span class="pdp-hl-dot"></span> ${escapeHtml(f)}</li>`).join('');
    } else {
      hlList.innerHTML = `
        <li><span class="pdp-hl-dot"></span> Full Plan Replacement Warranty Available</li>
        <li><span class="pdp-hl-dot"></span> Automated 60s Instant Vault Delivery</li>
        <li><span class="pdp-hl-dot"></span> Genuine Dedicated Profile with 4-Digit Security PIN</li>
        <li><span class="pdp-hl-dot"></span> Streaming on TV, Mobile, Laptop & Tablet Without VPN</li>
      `;
    }
  }

  const descElem = document.getElementById('pdpProductDescription');
  const descSection = document.getElementById('pdpDescSection');
  let cleanDesc = (p.description || '').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').trim();
  if (cleanDesc) {
    cleanDesc = cleanDesc.charAt(0).toUpperCase() + cleanDesc.slice(1);
  }

  if (descElem) {
    descElem.innerHTML = formatDescriptionHtml(cleanDesc);
    if (p.desc_align) {
      descElem.style.textAlign = p.desc_align;
      descElem.classList.remove('align-center', 'align-justify', 'align-right');
      if (p.desc_align !== 'left') descElem.classList.add(`align-${p.desc_align}`);
    }
  }

    if (descSection) {
    descSection.classList.remove('expanded');
    const tBtn = document.getElementById('pdpDescToggleBtn');
    if (tBtn) tBtn.setAttribute('aria-expanded', 'false');
    descSection.style.display = cleanDesc ? 'block' : 'none';
  }

  // 5. Render Tiers & Durations
  renderTierTabs();
  renderDurationOptions();
  updateSelectedPlanPricing();

  // 6. Tabs Section (Features, Instructions, Warranty, Reviews, FAQ)
  renderFeaturesTab();
  renderInstructionsTab();
  renderReviewsTab();
  renderFaqTab();

  // 7. Related Products
  renderRelatedProducts();
}

function renderTierTabs() {
  const container = document.getElementById('pdpTierTabs');
  if (!container) return;

  const plans = productState.product.plans || [];
  const uniqueTiers = Array.from(new Set(plans.map(pl => pl.tier_type)));

  const secWrapper = document.getElementById('pdpTierSection');
  const hintBox = document.getElementById('pdpTierHintBox');

  if (uniqueTiers.length <= 1) {
    if (secWrapper) secWrapper.style.display = 'none';
    if (hintBox) hintBox.style.display = 'none';
    return;
  }
  if (secWrapper) secWrapper.style.display = 'block';
  container.style.display = 'flex';

  const tierMeta = {
    'shared': { label: 'Shared', icon: '👥', hint: 'Most economical option. 1 device at a time.' },
    'private': { label: 'Personal', icon: '🔒', hint: 'Your dedicated profile locked with custom 4-digit PIN. 100% private watch history & recommendations.' },
    'family': { label: 'Full Family Account', icon: '👨‍👩‍👧‍👦', hint: 'All profiles unlocked. Share with family/friends across up to 5 devices.' },
    'license': { label: 'Direct License Key', icon: '🔑', hint: 'Official software license key with automated instant activation.' }
  };

  container.innerHTML = uniqueTiers.map(t => {
    const meta = tierMeta[t] || { label: t.toUpperCase(), icon: '⚡', hint: '' };
    const isActive = productState.selectedTier === t;
    return `
      <button type="button" class="pdp-tier-btn ${isActive ? 'active' : ''}" onclick="selectPdpTier('${t}')" aria-label="Select ${escapeHtml(meta.label)} tier">
        <span class="pdp-tier-icon">${meta.icon}</span>
        <span class="pdp-tier-label">${meta.label}</span>
      </button>
    `;
  }).join('');

  // Update explainer hint
  if (hintBox) {
    const activeMeta = tierMeta[productState.selectedTier];
    if (activeMeta && activeMeta.hint) {
      hintBox.innerHTML = `<strong>💡 ${activeMeta.label}:</strong> ${activeMeta.hint}`;
      hintBox.style.display = 'block';
    } else {
      hintBox.style.display = 'none';
    }
  }
}

function selectPdpTier(tier) {
  productState.selectedTier = tier;
  
  // Pick popular plan in this tier, or first matching plan
  const plans = productState.product.plans || [];
  const matchingPlan = plans.find(pl => pl.tier_type === tier && pl.is_popular) || plans.find(pl => pl.tier_type === tier);
  if (matchingPlan) {
    productState.selectedPlan = matchingPlan;
  }

  renderTierTabs();
  renderDurationOptions();
  updateSelectedPlanPricing();
}

function renderDurationOptions() {
  const container = document.getElementById('pdpDurationGrid');
  if (!container) return;

  const allPlans = productState.product.plans || [];
  // Filter plans by selected tier if multiple tiers exist
  const uniqueTiers = Array.from(new Set(allPlans.map(pl => pl.tier_type)));
  const visiblePlans = uniqueTiers.length > 1 
    ? allPlans.filter(pl => pl.tier_type === productState.selectedTier)
    : allPlans;

  if (visiblePlans.length === 0) {
    container.innerHTML = '<div style="color:var(--text-secondary); font-size:0.85rem; padding:12px;">No plan configurations available for this tier.</div>';
    return;
  }

  container.innerHTML = visiblePlans.map(plan => {
    const isSelected = productState.selectedPlan && productState.selectedPlan.id === plan.id;
    const durationText = cleanDurationLabel(plan.duration_label, plan.duration_months);
    const offerBdt = plan.price_bdt || Math.round(plan.price_usd * 120);
    const origBdt = plan.original_price_bdt || (plan.original_price_usd ? Math.round(plan.original_price_usd * 120) : null);
    const discountPercent = (origBdt && origBdt > offerBdt) ? Math.round((1 - offerBdt / origBdt) * 100) : 0;

    return `
      <div class="pdp-plan-card ${isSelected ? 'active' : ''}" onclick="selectPdpPlan(${plan.id})" role="button" tabindex="0">
        <div class="pdp-plan-card-left">
          <span class="pdp-plan-radio-dot ${isSelected ? 'active' : ''}"></span>
          <span class="pdp-plan-duration-name">${escapeHtml(durationText)}</span>
        </div>
        <div class="pdp-plan-card-right">
          ${origBdt && origBdt > offerBdt ? `<span class="pdp-plan-orig-bdt">৳${origBdt.toLocaleString()}</span>` : ''}
          <span class="pdp-plan-current-bdt">৳${offerBdt.toLocaleString()}</span>
          ${discountPercent > 0 ? `<span class="pdp-plan-disc-tag">-${discountPercent}%</span>` : ''}
        </div>
      </div>
    `;
  }).join('');

  const durationLabel = document.getElementById('pdpSelectedDurationLabel');
  if (durationLabel && productState.selectedPlan) {
    durationLabel.textContent = cleanDurationLabel(productState.selectedPlan.duration_label, productState.selectedPlan.duration_months);
  }
}

function selectPdpPlan(planId) {
  const plans = productState.product.plans || [];
  const found = plans.find(pl => pl.id === planId);
  if (found) {
    productState.selectedPlan = found;
    renderDurationOptions();
    updateSelectedPlanPricing();
  }
}

function getCleanPlanTitle(plan) {
  if (!plan) return '';
  const duration = cleanDurationLabel(plan.duration_label || '', plan.duration_months);
  let name = (plan.plan_name || '').trim();
  
  // Strip duration prefix: e.g. "1 Month - Shared Screen" -> "Shared Screen"
  name = name.replace(/^(\d+\s*(?:Months?|Years?|Days?|Weeks?|Hours?)|Lifetime)\s*[-–•:]*\s*/i, '').trim();
  
  // Remove parenthetical tier repetition: e.g. "Personal (Private PIN)" -> "Personal"
  name = name.replace(/\s*\([^)]*\)/g, '').trim();
  
  // Simplify tier titles
  name = name.replace(/Private\s+PIN\s+Profile/i, 'Personal');
  name = name.replace(/Private\s+Profile/i, 'Personal');
  name = name.replace(/Private\s+Screen/i, 'Personal');
  name = name.replace(/Shared\s+Screen/i, 'Shared');
  
  // If empty or identical to duration, return just duration
  if (!name || name.toLowerCase() === duration.toLowerCase()) {
    return duration;
  }
  return `${duration} • ${name}`;
}

function updateSelectedPlanPricing() {
  const plan = productState.selectedPlan;
  if (!plan) return;

  const offerBdt = plan.price_bdt || Math.round(plan.price_usd * 120);
  const origBdt = plan.original_price_bdt || (plan.original_price_usd ? Math.round(plan.original_price_usd * 120) : null);
  const saveAmount = (origBdt && origBdt > offerBdt) ? (origBdt - offerBdt) : 0;
  const discountPercent = (origBdt && origBdt > offerBdt) ? Math.round((1 - offerBdt / origBdt) * 100) : 0;

  const currentPriceDisplay = document.getElementById('pdpCurrentPrice');
  const origPriceDisplay = document.getElementById('pdpOriginalPrice');
  const savingsDisplay = document.getElementById('pdpSavingsTag');
  const discountBadge = document.getElementById('pdpDiscountBadge');
  const imgDiscountBadge = document.getElementById('pdpImageDiscountBadge');
  const planNameDisplay = document.getElementById('pdpSelectedPlanSummary');
  const deviceLimitDisplay = document.getElementById('pdpDeviceLimitSummary');

  if (currentPriceDisplay) currentPriceDisplay.textContent = formatPrice(offerBdt, true);
  if (origPriceDisplay) {
    if (origBdt && origBdt > offerBdt) {
      origPriceDisplay.textContent = formatPrice(origBdt, true);
      origPriceDisplay.style.display = 'inline';
    } else {
      origPriceDisplay.style.display = 'none';
    }
  }

  if (savingsDisplay) {
    if (saveAmount > 0) {
      savingsDisplay.textContent = `Save ৳${saveAmount.toLocaleString()}`;
      savingsDisplay.style.display = 'inline-flex';
    } else {
      savingsDisplay.style.display = 'none';
    }
  }

  if (discountBadge) {
    if (discountPercent > 0) {
      discountBadge.textContent = `-${discountPercent}% OFF`;
      discountBadge.style.display = 'inline-flex';
    } else {
      discountBadge.style.display = 'none';
    }
  }

  if (imgDiscountBadge) {
    if (discountPercent > 0) {
      imgDiscountBadge.textContent = `-${discountPercent}% OFF`;
      imgDiscountBadge.style.display = 'inline-flex';
    } else {
      imgDiscountBadge.style.display = 'none';
    }
  }

  const durationLabel = document.getElementById('pdpSelectedDurationLabel');
  if (durationLabel) {
    durationLabel.textContent = cleanDurationLabel(plan.duration_label, plan.duration_months);
  }

  // Clean, non-repetitive plan title
  const cleanTitle = getCleanPlanTitle(plan);

  if (planNameDisplay) {
    planNameDisplay.textContent = cleanTitle;
  }

  if (deviceLimitDisplay) {
    deviceLimitDisplay.textContent = `${plan.device_limit || '1 Device'} • 4K UHD • Full Warranty`;
  }

  const qty = productState.quantity || 1;
  const totalOfferBdt = offerBdt * qty;

  // Update dynamic Buy Now CTA button label with offer price
  const buyBtnLabel = document.getElementById('pdpBuyBtnLabel');
  if (buyBtnLabel) {
    buyBtnLabel.innerHTML = `Buy It Now &mdash; ${formatPrice(totalOfferBdt, true)}`;
  }

  // Check VIP Status for discount alert
  const user = (typeof state !== 'undefined' && state?.user) || JSON.parse(localStorage.getItem('flix_user') || 'null');
  const vipAlert = document.getElementById('pdpVipDiscountNotice');
  if (vipAlert) {
    const isVip = user && (user.role === 'admin' || user.tier === 'vip' || user.is_vip);
    if (isVip) {
      vipAlert.style.display = 'flex';
      vipAlert.innerHTML = `<span>👑</span> <span><strong>VIP Member Benefit:</strong> Automatic 5% extra discount applied at checkout!</span>`;
    } else {
      vipAlert.style.display = 'flex';
      vipAlert.innerHTML = `<span>👑</span> <span>Become a VIP member to get an automatic <strong>5% OFF</strong> every purchase!</span>`;
    }
  }

  // Update sticky bottom purchase bar details
  const stickyPlan = document.getElementById('pdpStickyPlanName');
  const stickyPrice = document.getElementById('pdpStickyPrice');
  if (stickyPlan) stickyPlan.textContent = cleanTitle;
  if (stickyPrice) stickyPrice.textContent = formatPrice(totalOfferBdt, true);

  // Update WhatsApp direct order link
  const waBtn = document.getElementById('pdpWhatsAppInquiryBtn');
  if (waBtn) {
    const planName = cleanTitle || 'Selected Plan';
    const prodTitle = (productState.product && productState.product.title) ? productState.product.title : 'Subscription';
    const qty = productState.quantity || 1;
    const priceFormatted = formatPrice(offerBdt * qty, true);
    const message = `Hello FlixStore! 🚀\nI would like to place an order via WhatsApp:\n\n📦 Subscription: ${prodTitle}\n💳 Plan: ${planName}\n🔢 Quantity: ${qty}\n💰 Total Amount: ${priceFormatted}\n⚡ Delivery: Instant Automated Delivery\n\nPlease send me the payment details (bKash/Nagad/Rocket/Bank) to complete my order. Thank you!`;
    waBtn.href = `https://wa.me/8801343546958?text=${encodeURIComponent(message)}`;
  }
}

function initStickyPurchaseBarObserver() {
  const actionsContainer = document.querySelector('.pdp-actions-container');
  const stickyBar = document.getElementById('pdpStickyPurchaseBar');
  if (!actionsContainer || !stickyBar) return;

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
          stickyBar.classList.add('visible');
          document.body.classList.add('pdp-sticky-active');
        } else {
          stickyBar.classList.remove('visible');
          document.body.classList.remove('pdp-sticky-active');
        }
      });
    }, { threshold: 0.1 });
    observer.observe(actionsContainer);
  }
}

// -----------------------------------------------------------------------------
// CART & BUY NOW ACTIONS
// -----------------------------------------------------------------------------

function pdpAdjustQty(delta) {
  const current = productState.quantity || 1;
  const newQty = Math.max(1, Math.min(10, current + delta));
  productState.quantity = newQty;
  const qtyEl = document.getElementById('pdpQtyValue');
  if (qtyEl) qtyEl.textContent = newQty;
  updateSelectedPlanPricing();
}

function pdpAddToCart() {
  if (!productState.product || !productState.selectedPlan) return;
  const qty = productState.quantity || 1;
  addToCart(productState.product, productState.selectedPlan, qty);
  openCartDrawer();
}

function pdpBuyNow() {
  if (!productState.product || !productState.selectedPlan) return;
  const qty = productState.quantity || 1;
  const existingIndex = (typeof state !== 'undefined' && state?.cart) 
    ? state.cart.findIndex(item => item.productId === productState.product.id && item.planId === productState.selectedPlan.id)
    : -1;

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity = qty;
    if (typeof saveCart === 'function') saveCart();
    if (typeof updateCartUI === 'function') updateCartUI();
  } else {
    addToCart(productState.product, productState.selectedPlan, qty);
  }
  openCheckoutModal();
}

// -----------------------------------------------------------------------------
// TABS SWITCHER (FEATURES, SETUP, WARRANTY, REVIEWS, FAQ)
// -----------------------------------------------------------------------------

function switchPdpTab(tabName) {
  productState.activeTab = tabName;
  
  // Tab buttons
  document.querySelectorAll('.pdp-tab-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Tab panes
  document.querySelectorAll('.pdp-tab-pane').forEach(pane => {
    pane.classList.toggle('active', pane.id === `pdpTab_${tabName}`);
  });
}

function renderFeaturesTab() {
  const container = document.getElementById('pdpFeaturesContainer');
  if (!container) return;

  let features = productState.product.features_list || [];
  if (typeof features === 'string') {
    try {
      features = JSON.parse(features);
    } catch (e) {
      features = features.split('\n').map(s => s.trim()).filter(Boolean);
    }
  }
  if (!Array.isArray(features)) {
    features = [];
  }

  if (features.length === 0) {
    container.innerHTML = '<p style="color:var(--text-secondary);">Features and benefits included with every genuine plan.</p>';
    return;
  }

  container.innerHTML = `
    <div class="pdp-features-grid">
      ${features.map(f => `
        <div class="pdp-feature-item">
          <div class="pdp-feature-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
          </div>
          <div class="pdp-feature-text">${f}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderInstructionsTab() {
  const container = document.getElementById('pdpInstructionsContainer');
  if (!container) return;

  const inst = productState.product.instructions || 'Credentials and login details will be instantly generated and saved into your Digital Pass.';
  container.innerHTML = `
    <div class="pdp-instructions-card">
      <div class="pdp-instructions-header">
        <span style="font-size:1.2rem;">📋</span> Activation Steps & Instructions:
      </div>
      <p style="color:var(--text-secondary); line-height:1.6; margin-bottom:16px;">${inst}</p>
      
      <div class="how-steps-grid">
        <div class="how-step-card">
          <div class="step-num-badge">STEP 01</div>
          <h4 style="margin:8px 0 4px; font-size:0.95rem; font-family:'Sora',sans-serif; font-weight:700;">Complete Order</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin:0;">Pay securely via bKash, Nagad, Rocket, or Bank transfer.</p>
        </div>
        <div class="how-step-card">
          <div class="step-num-badge">STEP 02</div>
          <h4 style="margin:8px 0 4px; font-size:0.95rem; font-family:'Sora',sans-serif; font-weight:700;">Instant Credentials</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin:0;">Login email, password, and PIN appear immediately in 60s.</p>
        </div>
        <div class="how-step-card">
          <div class="step-num-badge">STEP 03</div>
          <h4 style="margin:8px 0 4px; font-size:0.95rem; font-family:'Sora',sans-serif; font-weight:700;">Stream Uninterrupted</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin:0;">Protected by our 100% replacement warranty.</p>
        </div>
      </div>
    </div>
  `;
}

let currentReviewRating = 5;

function togglePdpReviewForm() {
  const formCard = document.getElementById('pdpWriteReviewFormCard');
  if (!formCard) return;
  formCard.classList.toggle('open');
  if (formCard.classList.contains('open')) {
    formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}
window.togglePdpReviewForm = togglePdpReviewForm;

function setPdpReviewRating(stars) {
  currentReviewRating = stars;
  const starBtns = document.querySelectorAll('.pdp-star-btn');
  starBtns.forEach((btn, idx) => {
    btn.classList.toggle('active', idx < stars);
  });
}
window.setPdpReviewRating = setPdpReviewRating;

async function submitPdpReview(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('pdpReviewAuthorInput');
  const commentInput = document.getElementById('pdpReviewCommentInput');
  const submitBtn = document.getElementById('pdpReviewSubmitBtn');

  const customer_name = nameInput ? nameInput.value.trim() : '';
  const comment = commentInput ? commentInput.value.trim() : '';

  if (!customer_name) {
    if (typeof showToast === 'function') showToast('Please enter your name', 'warning');
    else alert('Please enter your name');
    if (nameInput) nameInput.focus();
    return;
  }
  if (!comment) {
    if (typeof showToast === 'function') showToast('Please write your review comment', 'warning');
    else alert('Please write your review comment');
    if (commentInput) commentInput.focus();
    return;
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
  }

  try {
    const p = productState.product || {};
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        product_id: p.id,
        customer_name,
        rating: currentReviewRating,
        comment
      })
    });
    const json = await res.json();

    if (json.success) {
      if (typeof showToast === 'function') showToast('Thank you! Your review has been published.', 'success');
      // Add review to local state and re-render
      if (!p.reviews) p.reviews = [];
      p.reviews.unshift({
        customer_name,
        rating: currentReviewRating,
        comment,
        created_at: new Date().toISOString(),
        verified_purchase: 1
      });
      renderReviewsTab();
    } else {
      if (typeof showToast === 'function') showToast(json.message || 'Failed to submit review', 'error');
    }
  } catch (err) {
    console.error('Review submit error:', err);
    if (typeof showToast === 'function') showToast('Network error submitting review', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Review';
    }
  }
}
window.submitPdpReview = submitPdpReview;

function renderReviewsTab() {
  const container = document.getElementById('pdpReviewsContainer');
  if (!container) return;

  const p = productState.product || {};
  const reviews = p.reviews || [];
  const ratingScore = Number(p.rating || 5.0).toFixed(1);
  const totalCount = p.review_count || 128;

  // Form HTML template
  const formHtml = `
    <div id="pdpWriteReviewFormCard" class="pdp-write-review-form-card">
      <h4 class="pdp-form-title">Write a Customer Review</h4>
      <div style="margin-bottom:12px;">
        <label style="font-size:13px; font-weight:600; color:#475569; display:block; margin-bottom:6px;">Your Rating:</label>
        <div class="pdp-star-picker">
          <button type="button" class="pdp-star-btn active" onclick="setPdpReviewRating(1)">★</button>
          <button type="button" class="pdp-star-btn active" onclick="setPdpReviewRating(2)">★</button>
          <button type="button" class="pdp-star-btn active" onclick="setPdpReviewRating(3)">★</button>
          <button type="button" class="pdp-star-btn active" onclick="setPdpReviewRating(4)">★</button>
          <button type="button" class="pdp-star-btn active" onclick="setPdpReviewRating(5)">★</button>
        </div>
      </div>
      <div class="pdp-form-grid">
        <input type="text" id="pdpReviewAuthorInput" class="pdp-form-input" placeholder="Your Name (e.g. Tanvir Ahmed)" required>
        <input type="text" class="pdp-form-input" value="${escapeHtml(p.title || '')}" readonly style="background:#F1F5F9; color:#64748B;">
      </div>
      <textarea id="pdpReviewCommentInput" class="pdp-form-textarea" placeholder="Share your experience with this subscription (activation speed, streaming quality, customer support...)" required></textarea>
      <div class="pdp-form-actions">
        <button type="button" class="btn-pdp-cancel-review" onclick="togglePdpReviewForm()">Cancel</button>
        <button type="button" id="pdpReviewSubmitBtn" class="btn-pdp-submit-review" onclick="submitPdpReview(event)">Submit Review</button>
      </div>
    </div>
  `;

  if (reviews.length === 0) {
    // Exact ShahedStore signature empty reviews card (step_8_shot_2.png)
    container.innerHTML = `
      <div class="pdp-empty-reviews-box">
        <div class="pdp-empty-star-icon">
          <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
          </svg>
        </div>
        <p class="pdp-empty-review-title">No reviews yet. Be the first to review!</p>
        <p class="pdp-empty-review-sub">Share your feedback about this subscription.</p>
        <button type="button" class="btn-pdp-write-review" onclick="togglePdpReviewForm()">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          <span>Write a Review</span>
        </button>
      </div>
      ${formHtml}
    `;
    return;
  }

  // Organized Reviews Presentation when reviews exist
  container.innerHTML = `
    <div class="pdp-reviews-clean-header">
      <div class="pdp-reviews-rating-pill">
        <div class="pdp-reviews-score-badge">
          <span class="pdp-reviews-score-stars">★</span>
          <span>${ratingScore}</span>
        </div>
        <span class="pdp-reviews-count-txt">Based on ${reviews.length} verified customer reviews</span>
      </div>
      <button type="button" class="btn-pdp-write-review" onclick="togglePdpReviewForm()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
        <span>Write a Review</span>
      </button>
    </div>

    ${formHtml}

    <div class="pdp-reviews-stream">
      ${reviews.map(r => {
        const authorName = escapeHtml(r.customer_name || r.author_name || 'Verified Customer');
        const initials = authorName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'VC';
        const rating = Math.max(1, Math.min(5, parseInt(r.rating || 5, 10)));
        const starsStr = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const comment = escapeHtml(r.comment || '');
        const timeStr = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Verified Order';

        return `
          <div class="pdp-review-item-row">
            <div class="pdp-review-header-flex">
              <div class="pdp-review-user-info">
                <div class="pdp-review-avatar-circle">${initials}</div>
                <div class="pdp-review-name-wrap">
                  <div class="pdp-review-author-name">
                    <span>${authorName}</span>
                    <span class="pdp-review-verified-pill">✓ Verified Buyer</span>
                  </div>
                  <span class="pdp-review-meta-time">${timeStr}</span>
                </div>
              </div>
              <div class="pdp-review-stars-strip">${starsStr}</div>
            </div>
            <p class="pdp-review-body-text">${comment}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderFaqTab() {
  const container = document.getElementById('pdpFaqContainer');
  if (!container) return;

  const faqs = [
    {
      q: "Can I renew this subscription on the same profile / account?",
      a: "Yes! You can easily renew your subscription before or after expiry by selecting the same duration or messaging our 24/7 WhatsApp support. Your watch history, playlists, PIN, and favorites will remain 100% preserved."
    },
    {
      q: "Do I need a VPN to use this subscription in Bangladesh?",
      a: "No VPN is required. All our subscriptions are configured for direct native streaming across Bangladesh and worldwide on Smart TVs, Android TV boxes, Firestick, iPhones, iPads, PCs, Macs, and Android devices."
    },
    {
      q: "What happens if a password resets or an issue occurs during my validity?",
      a: "Every purchase is backed by our 100% Full Duration Replacement Guarantee. If access drops or passwords reset, simply message our official WhatsApp helpline (+8801343546958) with your Order ID, and our support team will restore or replace your credentials within minutes."
    },
    {
      q: "How soon will I receive my login credentials after payment?",
      a: "Delivery is 100% automated and instant. As soon as your bKash, Nagad, Rocket, or card payment confirms, your login email, password, profile name, and 4-digit PIN appear on your screen and are delivered to your email within 60 seconds."
    },
    {
      q: "Can I use this subscription on multiple devices simultaneously?",
      a: "For Shared plans, you can watch on 1 device at a time. For Personal plans, your dedicated profile is locked with your private PIN for 1 device concurrent streaming. For Full Family Accounts, you can stream simultaneously on up to 4–5 devices."
    }
  ];

  container.innerHTML = faqs.map((faq, idx) => `
    <div class="pdp-faq-item ${idx === 0 ? 'active' : ''}" onclick="togglePdpFaq(this)">
      <div class="pdp-faq-q">
        <span>${escapeHtml(faq.q)}</span>
        <svg class="pdp-faq-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      <div class="pdp-faq-a">
        <p>${escapeHtml(faq.a)}</p>
      </div>
    </div>
  `).join('');
}

window.togglePdpFaq = function(item) {
  if (!item) return;
  const wasActive = item.classList.contains('active');
  // Close other accordions for clean single-item focus
  document.querySelectorAll('.pdp-faq-item').forEach(el => el.classList.remove('active'));
  if (!wasActive) {
    item.classList.add('active');
  }
};

function renderRelatedProducts() {
  const container = document.getElementById('pdpRelatedProductsContainer');
  if (!container) return;

  const related = productState.product.related || [];
  if (related.length === 0) {
    container.style.display = 'none';
    return;
  }
  container.style.display = 'block';

  const grid = document.getElementById('pdpRelatedProductsGrid');
  if (!grid) return;

  grid.innerHTML = related.map(p => {
    const offerPriceBDT = Math.round(Number(p.base_price || 0) * 120);
    const offerFormatted = formatPrice(offerPriceBDT, true);
    return `
      <div class="product-card" data-slug="${p.slug}">
        <div class="product-card-top" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;">
          <img src="${p.logo_url ? p.logo_url + '?v=5' : '/assets/flixstore-icon.png'}" alt="${p.title}" class="product-card-img" loading="lazy" onerror="this.onerror=null; this.src='/assets/flixstore-icon.png';">
          <span class="card-discount-pill hot">HOT</span>
        </div>
        <div class="product-body">
          <h3 class="product-title" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;" title="${p.title}">
            ${p.title}
          </h3>
          <div class="product-rating-row">
            <div class="stars">★★★★☆</div>
            <span class="review-count">(${Number(p.review_count || 180)})</span>
          </div>
          <div class="card-pricing-row">
            <span class="card-price-violet">${offerFormatted}</span>
          </div>
          <div class="card-action-group">
            <button type="button" class="btn-card-buy-now" onclick="window.location.href='/product/${p.slug}'" title="View Plan">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              <span>Buy Now</span>
            </button>
            <div class="card-action-split-row">
              <a href="https://wa.me/8801343546958?text=${encodeURIComponent('Hello FlixStore, I am interested in purchasing ' + p.title)}" target="_blank" rel="noopener noreferrer" class="btn-card-secondary btn-card-whatsapp" onclick="event.stopPropagation()" title="Order via WhatsApp">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#10b981"><path d="M12.031 2C6.495 2 2 6.495 2 12.031c0 1.97.567 3.81 1.545 5.373L2 22l4.757-1.514A9.972 9.972 0 0 0 12.031 22C17.567 22 22 17.505 22 12.031 22 6.495 17.567 2 12.031 2zm5.792 14.288c-.244.686-1.22 1.307-1.745 1.365-.487.054-1.12.079-3.626-.957-3.197-1.32-5.267-4.57-5.426-4.783-.16-.213-1.294-1.722-1.294-3.284 0-1.562.819-2.332 1.109-2.651.29-.319.633-.399.844-.399.21 0 .422 0 .607.01.196.01.458-.074.717.55.264.633.9 2.197.978 2.357.079.16.132.348.026.56-.105.213-.158.348-.316.533-.159.186-.334.415-.477.557-.16.16-.328.334-.141.655.186.32.827 1.367 1.775 2.212 1.222 1.088 2.253 1.424 2.573 1.583.32.16.507.133.693-.08.187-.213.794-.925 1.006-1.242.211-.318.423-.265.714-.159.29.106 1.848.872 2.165 1.03.317.16.529.238.608.37.079.133.079.768-.165 1.454z"/></svg>
                <span>WhatsApp</span>
              </a>
              <a href="/product/${p.slug}" class="btn-card-secondary btn-card-cart" onclick="event.stopPropagation()" title="View Plan">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                <span>Cart</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}


/**
 * Toggle "About This Subscription" collapsible accordion button
 */
function togglePdpDescription() {
  const card = document.getElementById('pdpDescSection');
  const btn = document.getElementById('pdpDescToggleBtn');
  if (!card) return;
  const isExpanded = card.classList.toggle('expanded');
  if (btn) btn.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
}
window.togglePdpDescription = togglePdpDescription;
