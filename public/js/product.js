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
  activeTab: 'features'
};

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
      // Prefer private PIN if available, otherwise first plan's tier
      const privatePlan = plans.find(pl => pl.tier_type === 'private');
      productState.selectedPlan = privatePlan || plans[0];
      productState.selectedTier = productState.selectedPlan.tier_type || 'private';
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

  // 2. Breadcrumbs
  const breadcrumbCat = document.getElementById('pdpBreadcrumbCategory');
  const breadcrumbTitle = document.getElementById('pdpBreadcrumbTitle');
  if (breadcrumbCat) breadcrumbCat.textContent = p.category_name;
  if (breadcrumbTitle) breadcrumbTitle.textContent = p.title;

  // 3. Media Column (Left)
  const logoImg = document.getElementById('pdpProductLogo');
  if (logoImg) logoImg.src = p.logo_url;
  
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
  if (titleElem) titleElem.textContent = p.title;

  const taglineElem = document.getElementById('pdpProductTagline');
  if (taglineElem) taglineElem.textContent = p.tagline || '';

  const ratingScore = document.getElementById('pdpRatingScore');
  const reviewCount = document.getElementById('pdpReviewCount');
  if (ratingScore) ratingScore.textContent = Number(p.rating || 5.0).toFixed(1);
  if (reviewCount) reviewCount.textContent = `(${p.review_count || 128} verified reviews)`;

  const descElem = document.getElementById('pdpProductDescription');
  if (descElem) descElem.textContent = p.description || '';

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

  const secWrapper = container.closest('div');
  const hintBox = document.getElementById('pdpTierHintBox');

  if (uniqueTiers.length <= 1) {
    if (secWrapper) secWrapper.style.display = 'none';
    if (hintBox) hintBox.style.display = 'none';
    return;
  }
  if (secWrapper) secWrapper.style.display = 'block';
  container.style.display = 'flex';

  const tierMeta = {
    'shared': { label: 'Shared Screen', icon: '👥', hint: 'Most economical option. 1 device at a time.' },
    'private': { label: 'Private PIN Profile', icon: '🔒', hint: 'Your dedicated profile locked with custom 4-digit PIN. 100% private watch history & recommendations.' },
    'family': { label: 'Full Family Account', icon: '👨‍👩‍👧‍👦', hint: 'All profiles unlocked. Share with family/friends across up to 5 devices.' },
    'license': { label: 'Direct License Key', icon: '🔑', hint: 'Official software license key with automated instant activation.' }
  };

  container.innerHTML = uniqueTiers.map(t => {
    const meta = tierMeta[t] || { label: t.toUpperCase(), icon: '⚡', hint: '' };
    const isActive = productState.selectedTier === t;
    const isPopular = t === 'private';
    return `
      <button type="button" class="pdp-tier-btn ${isActive ? 'active' : ''}" onclick="selectPdpTier('${t}')">
        <span class="pdp-tier-icon">${meta.icon}</span>
        <div class="pdp-tier-text">
          <div style="font-weight:700;">${meta.label}</div>
          ${isPopular ? '<span class="pdp-tier-pill">MOST POPULAR</span>' : ''}
        </div>
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
  
  // Pick first plan matching this tier
  const plans = productState.product.plans || [];
  const matchingPlan = plans.find(pl => pl.tier_type === tier);
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
    container.innerHTML = '<div style="color:var(--text-secondary); font-size:0.85rem;">No plan configurations available for this tier.</div>';
    return;
  }

  container.innerHTML = visiblePlans.map(plan => {
    const isSelected = productState.selectedPlan && productState.selectedPlan.id === plan.id;
    const offerBdt = plan.price_bdt || Math.round(plan.price_usd * 120);
    const origBdt = plan.original_price_bdt || (plan.original_price_usd ? Math.round(plan.original_price_usd * 120) : null);
    const discountPercent = (origBdt && origBdt > offerBdt) ? Math.round((1 - offerBdt / origBdt) * 100) : 0;

    return `
      <div class="pdp-duration-card ${isSelected ? 'selected' : ''}" onclick="selectPdpPlan(${plan.id})">
        <div class="pdp-duration-header">
          <div class="pdp-duration-title">${plan.duration_label}</div>
          ${discountPercent > 0 ? `<span class="discount-pill">${discountPercent}% OFF</span>` : ''}
        </div>
        <div class="pdp-duration-price-row">
          <div class="pdp-duration-offer">${formatPrice(offerBdt, true)}</div>
          ${origBdt && origBdt > offerBdt ? `<div class="pdp-duration-orig">${formatPrice(origBdt, true)}</div>` : ''}
        </div>
        <div class="pdp-duration-meta">
          <span>${plan.device_limit || '1 Device'}</span>
          <span>•</span>
          <span class="pdp-instant-pill">✓ Instant</span>
        </div>
      </div>
    `;
  }).join('');
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
  const name = (plan.plan_name || '').trim();
  const duration = (plan.duration_label || '').trim();
  if (!duration) return name;
  if (!name) return duration;
  
  // If plan_name already contains or starts with duration, strip the repetitive part:
  const strippedName = name.replace(/^(\d+\s*(?:Month|Year|Day)s?)\s*[-–•:]*\s*/i, '').trim();
  if (strippedName && strippedName.toLowerCase() !== duration.toLowerCase()) {
    return `${duration} • ${strippedName}`;
  }
  return duration;
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
      savingsDisplay.textContent = `Save ৳${saveAmount.toLocaleString()} (${discountPercent}% OFF)`;
      savingsDisplay.style.display = 'inline-block';
    } else {
      savingsDisplay.style.display = 'none';
    }
  }

  // Clean, non-repetitive plan title
  const cleanTitle = getCleanPlanTitle(plan);

  if (planNameDisplay) {
    planNameDisplay.textContent = cleanTitle;
  }

  if (deviceLimitDisplay) {
    deviceLimitDisplay.textContent = `${plan.device_limit || '1 Device'} • 4K UHD • Full Warranty`;
  }

  // Update dynamic Buy Now CTA button label with offer price
  const buyBtnLabel = document.getElementById('pdpBuyBtnLabel');
  if (buyBtnLabel) {
    buyBtnLabel.innerHTML = `Instant Buy &mdash; ${formatPrice(offerBdt, true)}`;
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
  if (stickyPrice) stickyPrice.textContent = formatPrice(offerBdt, true);

  // Update WhatsApp inquiry link
  const waBtn = document.getElementById('pdpWhatsAppInquiryBtn');
  if (waBtn) {
    const text = encodeURIComponent(`Hello FlixStore! I am interested in purchasing ${productState.product.title} - ${cleanTitle} for ${formatPrice(offerBdt, true)}.`);
    waBtn.href = `https://wa.me/8801343546958?text=${text}`;
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
        } else {
          stickyBar.classList.remove('visible');
        }
      });
    }, { threshold: 0.1 });
    observer.observe(actionsContainer);
  }
}

// -----------------------------------------------------------------------------
// CART & BUY NOW ACTIONS
// -----------------------------------------------------------------------------

function pdpAddToCart() {
  if (!productState.product || !productState.selectedPlan) return;
  addToCart(productState.product, productState.selectedPlan);
  openCartDrawer();
}

function pdpBuyNow() {
  if (!productState.product || !productState.selectedPlan) return;
  addToCart(productState.product, productState.selectedPlan);
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

  const features = productState.product.features_list || [];
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
      
      <div class="how-steps-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); margin-top:16px;">
        <div class="how-step-card" style="padding:16px;">
          <div class="step-num-badge">STEP 01</div>
          <h4 style="margin:8px 0 4px; font-size:0.95rem;">Complete Order</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin:0;">Pay in BDT with bKash/Nagad or USD with Card/PayPal.</p>
        </div>
        <div class="how-step-card" style="padding:16px;">
          <div class="step-num-badge">STEP 02</div>
          <h4 style="margin:8px 0 4px; font-size:0.95rem;">Instant Credentials</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin:0;">Login email, password, and PIN appear immediately in 60s.</p>
        </div>
        <div class="how-step-card" style="padding:16px;">
          <div class="step-num-badge">STEP 03</div>
          <h4 style="margin:8px 0 4px; font-size:0.95rem;">Stream Uninterrupted</h4>
          <p style="font-size:0.78rem; color:var(--text-secondary); margin:0;">Protected by our 100% replacement warranty.</p>
        </div>
      </div>
    </div>
  `;
}

function renderReviewsTab() {
  const container = document.getElementById('pdpReviewsContainer');
  if (!container) return;

  const reviews = productState.product.reviews || [];
  if (reviews.length === 0) {
    container.innerHTML = `
      <div style="padding:24px; text-align:center; color:var(--text-secondary);">
        <p>No customer reviews yet for this product. Be the first to order and review!</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="pdp-reviews-grid">
      ${reviews.map(r => `
        <div class="pdp-review-card">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
            <div>
              <div style="font-weight:700; color:var(--text-primary); font-size:0.95rem;">${r.author_name}</div>
              <div class="pdp-review-verified">✓ Verified Buyer</div>
            </div>
            <div style="color:#fbbf24; font-size:0.85rem;">${'★'.repeat(r.rating || 5)}</div>
          </div>
          <p style="font-size:0.84rem; color:var(--text-secondary); line-height:1.5; margin:0;">${r.comment}</p>
        </div>
      `).join('')}
    </div>
  `;
}

function renderFaqTab() {
  const container = document.getElementById('pdpFaqContainer');
  if (!container) return;

  container.innerHTML = `
    <div class="pdp-faq-list">
      <div class="pdp-faq-item">
        <h4 class="pdp-faq-q">Can I renew this subscription on the same profile/account?</h4>
        <p class="pdp-faq-a">Yes! You can easily renew your subscription before or after expiry by entering your current profile details or contacting our WhatsApp helpline.</p>
      </div>
      <div class="pdp-faq-item">
        <h4 class="pdp-faq-q">Do I need a VPN to use this subscription in Bangladesh?</h4>
        <p class="pdp-faq-a">No VPN required. All our subscriptions work natively across Bangladesh and worldwide on Smart TVs, Android TV, iPhones, iPads, PCs, and Macs.</p>
      </div>
      <div class="pdp-faq-item">
        <h4 class="pdp-faq-q">What happens if a password resets or an issue occurs?</h4>
        <p class="pdp-faq-a">Every plan comes with our 100% Replacement Warranty. If any issue occurs during your active subscription period, message our WhatsApp support (+8801343546958) and we will resolve or replace it within minutes.</p>
      </div>
      <div class="pdp-faq-item">
        <h4 class="pdp-faq-q">How soon will I receive my login credentials?</h4>
        <p class="pdp-faq-a">Delivery is 100% automated. Your login email, password, and private PIN are delivered on-screen and to your email within 60 seconds of payment verification.</p>
      </div>
    </div>
  `;
}

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
    return `
      <div class="product-card" onclick="window.location.href='/product/${p.slug}'" style="cursor:pointer;">
        <div class="product-card-top">
          <img src="${p.logo_url}" alt="${p.title}" class="product-card-img" loading="lazy">
          <div class="product-card-gradient"></div>
          <div class="product-card-badges">
            <span class="badge-tag pro">${p.badge || 'Verified'}</span>
          </div>
        </div>
        <div class="product-body" style="padding:16px;">
          <div class="product-category-name" style="font-size:0.75rem;">${p.category_name}</div>
          <h4 class="product-title" style="font-size:1rem; margin:4px 0 8px;">${p.title}</h4>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
            <div class="pdp-related-price">${formatPrice(offerPriceBDT, true)}</div>
            <a href="/product/${p.slug}" class="btn-secondary" style="padding:5px 10px; font-size:0.75rem; text-decoration:none;">View Plan →</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}
