/**
 * FlixStore - Premium E-Commerce Client Engine
 * High-performance, reactive UI logic
 */

// State Management
const state = {
  products: [],
  categories: [],
  filteredProducts: [],
  selectedCategory: 'all',
  activeTag: null,
  searchQuery: '',
  sortBy: 'featured',
  
  // Currency System (BDT Exclusive)
  currency: 'BDT',
  currencies: {
    BDT: { symbol: '৳', rate: 120.0, name: 'BDT' }
  },

  // Cart
  cart: JSON.parse(localStorage.getItem('flix_cart') || '[]'),
  appliedCoupon: null,
  
  // Theme
  theme: localStorage.getItem('flix_theme') || 'dark',

  // Current User / Auth
  user: JSON.parse(localStorage.getItem('flix_user') || 'null'),
  token: localStorage.getItem('flix_token') || null,

  // Selected Product for Quick View
  selectedProduct: null,
  selectedPlan: null
};

// Force BDT currency
localStorage.setItem('flix_currency', 'BDT');

// Formatting Helper: BDT Exclusive
function formatPrice(amount, isBDT = false) {
  if (amount === undefined || amount === null || isNaN(amount)) return '৳0';
  const val = isBDT ? Math.round(Number(amount)) : Math.round(Number(amount) * 120.0);
  return `৳${val.toLocaleString()}`;
}

// Update all static prices on page (Hero banner, spotlights, etc.)
function updateAllStaticPrices() {
  document.querySelectorAll('.hero-current-price[data-bdt]').forEach(elem => {
    const bdt = parseFloat(elem.dataset.bdt);
    if (!isNaN(bdt)) {
      elem.textContent = formatPrice(bdt, true);
    }
  });

  document.querySelectorAll('.hero-original-price[data-bdt]').forEach(elem => {
    const bdt = parseFloat(elem.dataset.bdt);
    if (!isNaN(bdt)) {
      elem.textContent = `${formatPrice(bdt, true)}/mo`;
    }
  });
}

// -----------------------------------------------------------------------------
// INITIALIZATION
// -----------------------------------------------------------------------------
function initMobileDetection() {
  try {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isTouch || isMobileUA) {
      document.documentElement.classList.add('is-touch-device');
      if (document.body) document.body.classList.add('is-touch-device');
    }
    const isSmallScreen = (window.screen && window.screen.width <= 1024) || window.innerWidth <= 1200;
    if ((isTouch && isSmallScreen) || isMobileUA) {
      document.documentElement.classList.add('is-mobile-view');
      if (document.body) document.body.classList.add('is-mobile-view');
    }
  } catch (e) {
    console.error('Mobile detection error:', e);
  }
}
initMobileDetection();

document.addEventListener('DOMContentLoaded', () => {
  initMobileDetection();
  initTheme();
  initCurrencySelector();
  updateAllStaticPrices();
  fetchCategories();
  fetchProducts();
  initHeroSlider();
  initSearchAutocomplete();
  updateCartUI();
  initEventListeners();
  checkAuthStatus();
});

// Theme Management
function initTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  const themeBtn = document.getElementById('themeToggleBtn');
  if (themeBtn) {
    themeBtn.innerHTML = state.theme === 'light' 
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>';
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  localStorage.setItem('flix_theme', state.theme);
  initTheme();
}

// Currency Indicator
function initCurrencySelector() {
  const select = document.getElementById('currencySelector');
  if (select) {
    select.value = 'BDT';
  }
}

// -----------------------------------------------------------------------------
// API FETCH CALLS
// -----------------------------------------------------------------------------

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) {
      state.categories = json.data;
      renderCategoryPills();
    }
  } catch (err) {
    console.error('Failed to load categories:', err);
  }
}

async function fetchProducts() {
  try {
    const res = await fetch('/api/products');
    const json = await res.json();
    if (json.success) {
      state.products = json.data;
      applyFilters();
    }
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

// -----------------------------------------------------------------------------
// FILTERING & RENDERING
// -----------------------------------------------------------------------------

function renderCategoryPills() {
  const container = document.getElementById('categoryPillsBar');
  if (!container) return;

  const totalCount = state.products.length || 15;

  let html = `
    <button class="category-pill ${state.selectedCategory === 'all' ? 'active' : ''}" onclick="selectCategory('all')">
      <span>✨ All Subscriptions</span>
      <span class="pill-count">${totalCount}</span>
    </button>
  `;

  state.categories.forEach(cat => {
    const isActive = state.selectedCategory === cat.slug;
    html += `
      <button class="category-pill ${isActive ? 'active' : ''}" onclick="selectCategory('${cat.slug}')">
        <span>${getCategoryIcon(cat.icon)} ${cat.name}</span>
        <span class="pill-count">${cat.product_count}</span>
      </button>
    `;
  });

  container.innerHTML = html;
}

function getCategoryIcon(iconName) {
  switch (iconName) {
    case 'film': return '🎬';
    case 'tv': return '🇧🇩';
    case 'cpu': return '⚡';
    case 'music': return '🎵';
    case 'cloud': return '☁️';
    case 'shield': return '🛡️';
    default: return '📦';
  }
}

function selectCategory(slug) {
  state.selectedCategory = slug;
  renderCategoryPills();
  applyFilters();
}

function applyFilters() {
  let list = [...state.products];

  // Category filter
  if (state.selectedCategory !== 'all') {
    list = list.filter(p => p.category_slug === state.selectedCategory);
  }

  // Tag filter
  if (state.activeTag === 'trending') {
    list = list.filter(p => p.is_trending === 1);
  } else if (state.activeTag === 'bestseller') {
    list = list.filter(p => p.is_bestseller === 1);
  }

  // Search filter
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    list = list.filter(p => 
      p.title.toLowerCase().includes(q) || 
      p.tagline.toLowerCase().includes(q) ||
      p.category_name.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (state.sortBy === 'price_asc') {
    list.sort((a, b) => a.base_price - b.base_price);
  } else if (state.sortBy === 'price_desc') {
    list.sort((a, b) => b.base_price - a.base_price);
  } else if (state.sortBy === 'rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else {
    list.sort((a, b) => (b.is_bestseller * 2 + b.is_featured) - (a.is_bestseller * 2 + a.is_featured));
  }

  state.filteredProducts = list;
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');
  const countDisplay = document.getElementById('productsCountDisplay');
  if (!grid) return;

  if (countDisplay) {
    countDisplay.textContent = `Showing ${state.filteredProducts.length} premium subscriptions`;
  }

  if (state.filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
        <h3 style="font-size: 1.3rem; margin-bottom: 8px;">No subscriptions found</h3>
        <p style="color: var(--text-secondary); margin-bottom: 20px;">Try clearing your search or selecting a different category.</p>
        <button class="btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = state.filteredProducts.map(p => {
    const badgeClass = p.badge ? p.badge.toLowerCase().replace(/[^a-z]/g, '') : 'pro';
    
    // Offer Price vs Real Market Price Comparison
    const offerPriceBDT = p.min_price_bdt || (p.base_price ? Math.round(p.base_price * 120) : 0);
    const origPriceBDT = p.min_original_price_bdt || p.original_price_bdt || (p.original_price ? Math.round(p.original_price * 120) : null);
    
    const offerFormatted = formatPrice(offerPriceBDT, true);
    const origFormatted = (origPriceBDT && origPriceBDT > offerPriceBDT) ? formatPrice(origPriceBDT, true) : '';
    const discountPercent = (origPriceBDT && origPriceBDT > offerPriceBDT) ? Math.round((1 - offerPriceBDT / origPriceBDT) * 100) : 0;

    // Generate tier chips (e.g. Shared, Private PIN, Full Account)
    const tiers = p.all_tier_types ? p.all_tier_types.split(',') : [];
    let tierChipsHTML = '<div class="card-tier-hint">';
    if (tiers.includes('shared')) tierChipsHTML += '<span class="tier-badge-pill shared">👥 Shared</span>';
    if (tiers.includes('private')) tierChipsHTML += '<span class="tier-badge-pill private">🔒 Private PIN</span>';
    if (tiers.includes('family')) tierChipsHTML += '<span class="tier-badge-pill family">👨‍👩‍👧‍👦 Full Account</span>';
    if (tiers.includes('license')) tierChipsHTML += '<span class="tier-badge-pill license">🔑 License Key</span>';
    if (tiers.length === 0) tierChipsHTML += '<span class="tier-badge-pill pro">⚡ Instant Access</span>';
    tierChipsHTML += '</div>';

    return `
      <div class="product-card" data-slug="${p.slug}">
        <div class="product-card-top" onclick="openProductDetail('${p.slug}')" style="cursor: pointer;">
          <img src="${p.logo_url}" alt="${p.title}" class="product-card-img" loading="lazy">
          <div class="product-card-gradient"></div>
          <div class="product-card-badges">
            <span class="badge-tag ${badgeClass}">${p.badge || 'Verified'}</span>
            <span class="instant-delivery-badge">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              ${p.delivery_time || 'Instant'}
            </span>
          </div>
        </div>

        <div class="product-body">
          <div class="product-category-name">${p.category_name}</div>
          <h3 class="product-title" onclick="openProductDetail('${p.slug}')" style="cursor: pointer;">${p.title}</h3>
          <p class="product-tagline">${p.tagline || ''}</p>

          ${tierChipsHTML}

          <div class="product-rating-row">
            <div class="stars">
              ${'★'.repeat(5)}
            </div>
            <strong>${p.rating.toFixed(1)}</strong>
            <span class="review-count">(${p.review_count})</span>
          </div>

          <div class="card-pricing-row">
            <div class="card-pricing-main">
              <div class="card-price-label-row">
                <span class="card-price-label">Offer Price</span>
                ${discountPercent > 0 ? `<span class="discount-pill">${discountPercent}% OFF</span>` : ''}
              </div>
              <div class="card-price-numbers">
                <span class="card-price-current">${offerFormatted}</span>
                ${origFormatted ? `<span class="card-price-original" title="Official Market Price">${origFormatted}</span>` : ''}
              </div>
            </div>
            <div class="card-warranty-pill" title="Full Duration Replacement Warranty">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              <span>Full Warranty</span>
            </div>
          </div>

          <div class="product-card-actions">
            <button class="btn-select-plan" onclick="openProductDetail('${p.slug}')">
              <span>⚡ Select Plan & Duration</span>
              <span style="font-size:0.85rem; opacity:0.9;">→</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  state.selectedCategory = 'all';
  state.searchQuery = '';
  state.activeTag = null;
  const searchInput = document.getElementById('mainSearchInput');
  if (searchInput) searchInput.value = '';
  renderCategoryPills();
  applyFilters();
}

// -----------------------------------------------------------------------------
// HERO SHOWCASE SLIDER (SLIDEABLE WITH TOUCH SWIPE & ARROWS)
// -----------------------------------------------------------------------------

let currentSlide = 0;
let slideInterval = null;

function initHeroSlider() {
  const container = document.getElementById('heroSliderContainer');
  const track = document.getElementById('heroSliderTrack');
  const slides = document.querySelectorAll('.hero-slide');
  const dotsContainer = document.getElementById('heroDots');
  if (!slides.length || !dotsContainer) return;

  dotsContainer.innerHTML = Array.from({ length: slides.length }).map((_, i) => 
    `<div class="slider-dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})" aria-label="Slide ${i + 1}"></div>`
  ).join('');

  goToSlide(0, false);
  startSlideTimer();

  if (!container || !track) return;

  // Touch Swipe (Smartphones & Tablets)
  let touchStartX = 0;
  let touchStartY = 0;
  let touchDeltaX = 0;
  let isTouching = false;
  let isSwiping = false;

  container.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchDeltaX = 0;
    isTouching = true;
    isSwiping = false;
    clearInterval(slideInterval);
  }, { passive: true });

  container.addEventListener('touchmove', (e) => {
    if (!isTouching || e.touches.length !== 1) return;
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    touchDeltaX = currentX - touchStartX;
    const touchDeltaY = currentY - touchStartY;

    if (Math.abs(touchDeltaX) > Math.abs(touchDeltaY) && Math.abs(touchDeltaX) > 8) {
      isSwiping = true;
      const width = container.clientWidth || 1200;
      const offsetPercent = (touchDeltaX / width) * 100;
      track.style.transition = 'none';
      track.style.transform = `translateX(calc(-${currentSlide * 100}% + ${offsetPercent}%))`;
    }
  }, { passive: true });

  container.addEventListener('touchend', () => {
    if (!isTouching) return;
    isTouching = false;
    track.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)';

    if (isSwiping) {
      if (touchDeltaX < -40) {
        nextSlide();
      } else if (touchDeltaX > 40) {
        prevSlide();
      } else {
        goToSlide(currentSlide);
      }
    }
    startSlideTimer();
  }, { passive: true });

  // Mouse Drag Support (Desktop)
  let isMouseDown = false;
  let mouseStartX = 0;
  let mouseDeltaX = 0;

  container.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, a, input, .slider-dot')) return;
    isMouseDown = true;
    mouseStartX = e.clientX;
    mouseDeltaX = 0;
    clearInterval(slideInterval);
    container.classList.add('grabbing');
  });

  window.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    mouseDeltaX = e.clientX - mouseStartX;
    const width = container.clientWidth || 1200;
    const offsetPercent = (mouseDeltaX / width) * 100;
    track.style.transition = 'none';
    track.style.transform = `translateX(calc(-${currentSlide * 100}% + ${offsetPercent}%))`;
  });

  window.addEventListener('mouseup', () => {
    if (!isMouseDown) return;
    isMouseDown = false;
    container.classList.remove('grabbing');
    track.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)';

    if (mouseDeltaX < -45) {
      nextSlide();
    } else if (mouseDeltaX > 45) {
      prevSlide();
    } else {
      goToSlide(currentSlide);
    }
    startSlideTimer();
  });

  // Pause on mouse hover, resume on leave
  container.addEventListener('mouseenter', () => {
    clearInterval(slideInterval);
  });
  container.addEventListener('mouseleave', () => {
    if (!isMouseDown) startSlideTimer();
  });
}

function goToSlide(index, animated = true) {
  const slides = document.querySelectorAll('.hero-slide');
  const dots = document.querySelectorAll('.slider-dot');
  const track = document.getElementById('heroSliderTrack');
  if (!slides.length) return;

  const validIndex = (index + slides.length) % slides.length;
  currentSlide = validIndex;

  if (track) {
    if (!animated) {
      track.style.transition = 'none';
    } else {
      track.style.transition = 'transform 0.45s cubic-bezier(0.2, 0.9, 0.3, 1)';
    }
    track.style.transform = `translateX(-${validIndex * 100}%)`;
  }

  slides.forEach((s, i) => {
    s.classList.toggle('active', i === validIndex);
  });
  dots.forEach((d, i) => {
    d.classList.toggle('active', i === validIndex);
  });

  resetSlideTimer();
}

function nextSlide() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  goToSlide(currentSlide + 1);
}

function prevSlide() {
  const slides = document.querySelectorAll('.hero-slide');
  if (!slides.length) return;
  goToSlide(currentSlide - 1);
}

function startSlideTimer() {
  if (slideInterval) clearInterval(slideInterval);
  slideInterval = setInterval(nextSlide, 5000);
}

function resetSlideTimer() {
  if (slideInterval) clearInterval(slideInterval);
  startSlideTimer();
}

// Global functions for inline onclick
window.goToSlide = goToSlide;
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;

// -----------------------------------------------------------------------------
// SEARCH AUTOCOMPLETE
// -----------------------------------------------------------------------------

function initSearchAutocomplete() {
  const setupInput = (inputId, dropdownId) => {
    const searchInput = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', (e) => {
      const val = e.target.value.trim().toLowerCase();
      state.searchQuery = val;

      if (val.length < 1) {
        dropdown.style.display = 'none';
        applyFilters();
        return;
      }

      const matches = state.products.filter(p => 
        p.title.toLowerCase().includes(val) || 
        p.tagline.toLowerCase().includes(val) ||
        p.category_name.toLowerCase().includes(val)
      ).slice(0, 5);

      if (matches.length > 0) {
        dropdown.innerHTML = matches.map(m => `
          <div class="search-result-item" onclick="openProductDetail('${m.slug}'); hideSearchDropdown();">
            <img src="${m.logo_url}" alt="${m.title}" class="search-result-thumb">
            <div class="search-result-info">
              <div class="search-result-title">${m.title}</div>
              <div class="search-result-price">${m.min_price_bdt ? formatPrice(m.min_price_bdt, true) : formatPrice(m.base_price)} • ${m.category_name}</div>
            </div>
          </div>
        `).join('');
        dropdown.style.display = 'block';
      } else {
        dropdown.innerHTML = `
          <div style="padding: 14px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
            No matching subscriptions found for "${val}"
          </div>
        `;
        dropdown.style.display = 'block';
      }

      applyFilters();
    });

    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  };

  setupInput('mainSearchInput', 'searchResultsDropdown');
  setupInput('mobileSearchInput', 'mobileSearchResultsDropdown');
}

function focusMobileSearch() {
  const mInput = document.getElementById('mobileSearchInput');
  if (mInput) {
    mInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => mInput.focus(), 300);
  }
}

function hideSearchDropdown() {
  const d1 = document.getElementById('searchResultsDropdown');
  const d2 = document.getElementById('mobileSearchResultsDropdown');
  if (d1) d1.style.display = 'none';
  if (d2) d2.style.display = 'none';
}

// -----------------------------------------------------------------------------
// PRODUCT QUICK VIEW / DETAIL MODAL
// -----------------------------------------------------------------------------

async function openProductDetail(slug) {
  try {
    const res = await fetch(`/api/products/${slug}`);
    const json = await res.json();
    if (!json.success) return;

    state.selectedProduct = json.data;
    state.selectedPlan = json.data.plans[0] || null;

    renderQuickViewDetails();
    document.getElementById('productDetailModal').classList.add('active');
  } catch (err) {
    console.error('Error opening product:', err);
  }
}

function closeProductDetail() {
  document.getElementById('productDetailModal').classList.remove('active');
  state.selectedProduct = null;
  state.selectedPlan = null;
}

function renderQuickViewDetails() {
  const p = state.selectedProduct;
  if (!p) return;

  document.getElementById('detailProductImg').src = p.logo_url;
  document.getElementById('detailCategory').textContent = p.category_name;
  document.getElementById('detailTitle').textContent = p.title;
  document.getElementById('detailTagline').textContent = p.tagline;
  document.getElementById('detailRating').textContent = `${p.rating.toFixed(1)} ★ (${p.review_count} verified reviews)`;
  document.getElementById('detailDescription').textContent = p.description;

  // Features
  const featuresList = document.getElementById('detailFeaturesList');
  if (featuresList && Array.isArray(p.features_list)) {
    featuresList.innerHTML = p.features_list.map(f => `
      <li>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>${f}</span>
      </li>
    `).join('');
  }

  // Plans with Visual Tier Badges & First-Time Visitor Explainer
  const plansContainer = document.getElementById('detailPlansList');
  if (plansContainer && p.plans) {
    const hasMultipleTiers = new Set(p.plans.map(pl => pl.tier_type)).size > 1;

    let bannerHTML = '';
    if (hasMultipleTiers) {
      bannerHTML = `
        <div class="tier-explainer-banner">
          <div style="font-weight:700; margin-bottom:4px; font-size:0.85rem; color:#60a5fa; display:flex; align-items:center; gap:6px;">
            <span>💡</span> How to choose your tier:
          </div>
          <div style="font-size:0.8rem; color:var(--text-secondary); line-height:1.5;">
            • <strong>👥 Shared Profile:</strong> 1 Screen. Most economical.<br>
            • <strong>🔒 Private Profile with PIN:</strong> Your own locked profile with custom 4-digit PIN. 100% private watch history & recommendations.<br>
            • <strong>👨‍👩‍👧‍👦 Full Account:</strong> All profiles unlocked. Share with family/friends on multiple devices.
          </div>
        </div>
      `;
    }

    plansContainer.innerHTML = bannerHTML + p.plans.map(plan => {
      const isSelected = state.selectedPlan && state.selectedPlan.id === plan.id;
      
      let tierBadge = '';
      if (plan.tier_type === 'shared') {
        tierBadge = '<span class="badge-tag essential" style="margin-right:6px;">👥 Shared Screen</span>';
      } else if (plan.tier_type === 'private') {
        tierBadge = '<span class="badge-tag pro" style="margin-right:6px;">🔒 Private PIN Profile</span>';
      } else if (plan.tier_type === 'family') {
        tierBadge = '<span class="badge-tag bestseller" style="margin-right:6px;">👨‍👩‍👧‍👦 Family / Full</span>';
      } else if (plan.tier_type === 'license') {
        tierBadge = '<span class="badge-tag pro" style="margin-right:6px;">🔑 License Key</span>';
      }

      const offerBdt = plan.price_bdt || Math.round(plan.price_usd * 120);
      const origBdt = plan.original_price_bdt || (plan.original_price_usd ? Math.round(plan.original_price_usd * 120) : null);
      const discountPercent = (origBdt && origBdt > offerBdt) ? Math.round((1 - offerBdt / origBdt) * 100) : 0;
      const saveAmount = (origBdt && origBdt > offerBdt) ? (origBdt - offerBdt) : 0;

      return `
        <div class="plan-option-card ${isSelected ? 'selected' : ''}" onclick="selectModalPlan(${plan.id})">
          <div class="plan-option-info">
            <div style="display:flex; align-items:center; margin-bottom:4px; flex-wrap:wrap; gap:4px;">
              ${tierBadge}
              <h4 style="font-size:0.95rem; font-weight:700; margin:0;">${plan.plan_name}</h4>
              ${discountPercent > 0 ? `<span class="discount-pill">${discountPercent}% OFF</span>` : ''}
            </div>
            <p style="margin:2px 0 0; font-size:0.8rem; color:var(--text-secondary);">
              <strong>${plan.device_limit || '1 Device'}</strong> • ${plan.duration_label} • ${plan.plan_features || 'Full Duration Warranty'}
            </p>
          </div>
          <div class="plan-option-price">
            <div class="plan-price-val">${formatPrice(offerBdt, true)}</div>
            ${origBdt && origBdt > offerBdt ? `
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px; margin-top:2px;">
                <span class="plan-price-original" title="Official Market Price">${formatPrice(origBdt, true)}</span>
                <span class="plan-save-pill">Save ৳${saveAmount.toLocaleString()}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  // Price Display
  updateDetailPriceDisplay();
}

function selectModalPlan(planId) {
  if (!state.selectedProduct || !state.selectedProduct.plans) return;
  state.selectedPlan = state.selectedProduct.plans.find(pl => pl.id === planId) || state.selectedProduct.plans[0];
  renderQuickViewDetails();
}

function updateDetailPriceDisplay() {
  const priceDisplay = document.getElementById('detailSelectedPrice');
  const compareDisplay = document.getElementById('detailPriceCompare');
  const buyBtn = document.getElementById('detailBuyNowBtn');
  if (!state.selectedPlan) return;
  
  const offerBdt = state.selectedPlan.price_bdt || Math.round(state.selectedPlan.price_usd * 120);
  const origBdt = state.selectedPlan.original_price_bdt || (state.selectedPlan.original_price_usd ? Math.round(state.selectedPlan.original_price_usd * 120) : null);
  const displayPrice = formatPrice(offerBdt, true);

  if (priceDisplay) priceDisplay.textContent = displayPrice;
  if (compareDisplay) {
    if (origBdt && origBdt > offerBdt) {
      const discount = Math.round((1 - offerBdt / origBdt) * 100);
      const saved = origBdt - offerBdt;
      compareDisplay.innerHTML = `<span class="plan-price-original" style="font-size:1.1rem; margin-right:6px;" title="Official Market Price">${formatPrice(origBdt, true)}</span> <span class="discount-pill">${discount}% OFF • Save ৳${saved.toLocaleString()}</span>`;
      compareDisplay.style.display = 'inline-flex';
    } else {
      compareDisplay.style.display = 'none';
    }
  }

  if (buyBtn) {
    buyBtn.innerHTML = `Buy ${state.selectedPlan.duration_label} (${displayPrice}) →`;
  }
}

function addCurrentModalPlanToCart() {
  if (!state.selectedProduct || !state.selectedPlan) return;
  
  addToCart(state.selectedProduct, state.selectedPlan);
  closeProductDetail();
  openCartDrawer();
}

function buyCurrentModalPlanNow() {
  if (!state.selectedProduct || !state.selectedPlan) return;
  
  addToCart(state.selectedProduct, state.selectedPlan);
  closeProductDetail();
  openCheckoutModal();
}

// -----------------------------------------------------------------------------
// CART SYSTEM
// -----------------------------------------------------------------------------

async function quickAddToCart(slug, event) {
  if (event) event.stopPropagation();
  try {
    const res = await fetch(`/api/products/${slug}`);
    const json = await res.json();
    if (json.success) {
      const p = json.data;
      const defaultPlan = p.plans[0];
      addToCart(p, defaultPlan);
      openCartDrawer();
    }
  } catch (err) {
    console.error('Quick add error:', err);
  }
}

async function quickBuyNow(slug, event) {
  if (event) event.stopPropagation();
  try {
    const res = await fetch(`/api/products/${slug}`);
    const json = await res.json();
    if (json.success) {
      const p = json.data;
      const defaultPlan = p.plans[0];
      addToCart(p, defaultPlan);
      openCheckoutModal();
    }
  } catch (err) {
    console.error('Quick buy error:', err);
  }
}

function addToCart(product, plan) {
  const existingIndex = state.cart.findIndex(
    item => item.productId === product.id && item.planId === plan.id
  );

  if (existingIndex > -1) {
    state.cart[existingIndex].quantity += 1;
  } else {
    state.cart.push({
      productId: product.id,
      productTitle: product.title,
      productSlug: product.slug,
      logoUrl: product.logo_url,
      planId: plan.id,
      planName: plan.plan_name,
      durationLabel: plan.duration_label,
      priceUSD: plan.price_usd,
      priceBDT: plan.price_bdt || Math.round(plan.price_usd * 120),
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
}

function updateCartItemQty(index, delta) {
  if (!state.cart[index]) return;
  state.cart[index].quantity += delta;
  if (state.cart[index].quantity <= 0) {
    state.cart.splice(index, 1);
  }
  saveCart();
  updateCartUI();
}

function removeCartItem(index) {
  state.cart.splice(index, 1);
  saveCart();
  updateCartUI();
}

function saveCart() {
  localStorage.setItem('flix_cart', JSON.stringify(state.cart));
}

function calculateCartTotals() {
  const subtotalBDT = state.cart.reduce((sum, item) => sum + ((item.priceBDT || Math.round(item.priceUSD * 120)) * item.quantity), 0);
  let discountBDT = 0;

  if (state.appliedCoupon) {
    if (state.appliedCoupon.discountPercent > 0) {
      discountBDT = Math.round((subtotalBDT * state.appliedCoupon.discountPercent) / 100);
    } else if (state.appliedCoupon.discountAmount > 0) {
      discountBDT = Math.min(subtotalBDT, Math.round(state.appliedCoupon.discountAmount * 120));
    }
  }

  const totalBDT = Math.max(0, subtotalBDT - discountBDT);
  const subtotalUSD = subtotalBDT / 120.0;
  const discountUSD = discountBDT / 120.0;
  const totalUSD = totalBDT / 120.0;

  return { subtotalUSD, discountUSD, totalUSD, subtotalBDT, discountBDT, totalBDT };
}

function updateCartUI() {
  // Update header and mobile bottom nav cart badges
  const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
  const badge = document.getElementById('headerCartCount');
  const mobileBadge = document.getElementById('mobileCartCount');

  if (badge) {
    badge.textContent = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
  }
  if (mobileBadge) {
    mobileBadge.textContent = totalItems;
    mobileBadge.style.display = totalItems > 0 ? 'flex' : 'none';
  }

  // Update Drawer
  const container = document.getElementById('cartDrawerItems');
  if (!container) return;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px;">
        <div style="font-size: 3rem; margin-bottom: 12px;">🛒</div>
        <h4 style="font-size: 1.15rem; margin-bottom: 6px;">Your cart is empty</h4>
        <p style="color: var(--text-secondary); font-size: 0.88rem; margin-bottom: 20px;">Browse our premium subscriptions and grab the best deals today.</p>
        <button class="btn-primary" onclick="closeCartDrawer()">Explore Store</button>
      </div>
    `;
    updateDrawerFooter(0, 0, 0, 0, 0, 0);
    return;
  }

  container.innerHTML = state.cart.map((item, index) => `
    <div class="cart-item">
      <img src="${item.logoUrl}" alt="${item.productTitle}" class="cart-item-thumb">
      <div class="cart-item-info">
        <div class="cart-item-title">${item.productTitle}</div>
        <div class="cart-item-plan">${item.planName} (${item.durationLabel})</div>
        <button onclick="closeCartDrawer(); openProductDetail('${item.productSlug}')" style="background:none; border:none; color:#60a5fa; font-size:0.75rem; cursor:pointer; text-decoration:underline; padding:0; margin-bottom:6px; display:inline-block;">
          ✏️ Change Plan / Duration
        </button>
        <div class="cart-item-row">
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartItemQty(${index}, -1)">−</button>
            <span class="qty-num">${item.quantity}</span>
            <button class="qty-btn" onclick="updateCartItemQty(${index}, 1)">+</button>
          </div>
          <div class="cart-item-price">${formatPrice((item.priceBDT || Math.round(item.priceUSD * 120)) * item.quantity, true)}</div>
        </div>
      </div>
      <button onclick="removeCartItem(${index})" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; padding:0 4px;" title="Remove">✕</button>
    </div>
  `).join('');

  const totals = calculateCartTotals();
  updateDrawerFooter(totals.subtotalUSD, totals.discountUSD, totals.totalUSD, totals.subtotalBDT, totals.discountBDT, totals.totalBDT);
}

function updateDrawerFooter(subtotalUSD, discountUSD, totalUSD, subtotalBDT, discountBDT, totalBDT) {
  const subtotalElem = document.getElementById('cartSubtotalDisplay');
  const discountElem = document.getElementById('cartDiscountDisplay');
  const totalElem = document.getElementById('cartTotalDisplay');
  const checkoutBtn = document.getElementById('cartCheckoutBtn');

  const s = subtotalBDT !== undefined ? subtotalBDT : Math.round(subtotalUSD * 120);
  const d = discountBDT !== undefined ? discountBDT : Math.round(discountUSD * 120);
  const t = totalBDT !== undefined ? totalBDT : Math.round(totalUSD * 120);

  if (subtotalElem) subtotalElem.textContent = formatPrice(s, true);
  if (discountElem) {
    discountElem.textContent = d > 0 ? `-${formatPrice(d, true)}` : formatPrice(0, true);
  }
  if (totalElem) totalElem.textContent = formatPrice(t, true);
  if (checkoutBtn) {
    checkoutBtn.disabled = state.cart.length === 0;
  }
}

function openCartDrawer() {
  document.getElementById('cartDrawerOverlay').classList.add('active');
}

function closeCartDrawer() {
  document.getElementById('cartDrawerOverlay').classList.remove('active');
}

// -----------------------------------------------------------------------------
// COUPON ENGINE
// -----------------------------------------------------------------------------

async function applyCouponCode() {
  const input = document.getElementById('couponCodeInput');
  const msgElem = document.getElementById('couponMessage');
  if (!input) return;

  const code = input.value.trim().toUpperCase();
  if (!code) return;

  const { subtotalUSD } = calculateCartTotals();

  try {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount: subtotalUSD })
    });
    const json = await res.json();

    if (json.success) {
      state.appliedCoupon = json.coupon;
      if (msgElem) {
        msgElem.textContent = `✓ ${json.coupon.message}`;
        msgElem.style.color = '#34d399';
      }
      updateCartUI();
    } else {
      if (msgElem) {
        msgElem.textContent = `✕ ${json.message}`;
        msgElem.style.color = '#f87171';
      }
    }
  } catch (err) {
    console.error('Coupon error:', err);
  }
}

// -----------------------------------------------------------------------------
// CHECKOUT & MULTI-GATEWAY PAYMENT SYSTEM
// -----------------------------------------------------------------------------

let selectedPaymentGateway = 'card';

function openCheckoutModal() {
  closeCartDrawer();
  if (state.cart.length === 0) return;

  const modal = document.getElementById('checkoutModal');
  if (!modal) return;

  // Pre-fill user details if logged in
  if (state.user) {
    const nameInput = document.getElementById('checkoutName');
    const emailInput = document.getElementById('checkoutEmail');
    const phoneInput = document.getElementById('checkoutPhone');
    if (nameInput) nameInput.value = state.user.full_name || '';
    if (emailInput) emailInput.value = state.user.email || '';
    if (phoneInput && state.user.phone) phoneInput.value = state.user.phone;
  }

  const cardHolderPreview = document.getElementById('cardHolderPreview');
  if (cardHolderPreview) {
    cardHolderPreview.textContent = (state.user && state.user.full_name ? state.user.full_name : 'FLIXSTORE SUBSCRIBER').toUpperCase();
  }
  const cardInput = document.getElementById('checkoutCardNumber');
  if (cardInput) {
    cardInput.dispatchEvent(new Event('input'));
  }

  selectPaymentMethod('card');
  renderCheckoutSummary();
  modal.classList.add('active');
}

function closeCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (modal) modal.classList.remove('active');
}

function selectPaymentMethod(method) {
  selectedPaymentGateway = method;

  // Update tab highlights
  document.querySelectorAll('.payment-method-card').forEach(card => {
    card.classList.toggle('active', card.dataset.method === method);
  });

  // Toggle view panels
  const cardPanel = document.getElementById('cardPaymentPanel');
  const bkashPanel = document.getElementById('bkashPaymentPanel');
  const nagadPanel = document.getElementById('nagadPaymentPanel');
  const rocketPanel = document.getElementById('rocketPaymentPanel');
  const paypalPanel = document.getElementById('paypalPaymentPanel');
  const cryptoPanel = document.getElementById('cryptoPaymentPanel');

  if (cardPanel) cardPanel.style.display = method === 'card' ? 'block' : 'none';
  if (bkashPanel) bkashPanel.style.display = method === 'bkash' ? 'block' : 'none';
  if (nagadPanel) nagadPanel.style.display = method === 'nagad' ? 'block' : 'none';
  if (rocketPanel) rocketPanel.style.display = method === 'rocket' ? 'block' : 'none';
  if (paypalPanel) paypalPanel.style.display = method === 'paypal' ? 'block' : 'none';
  if (cryptoPanel) cryptoPanel.style.display = method === 'crypto' ? 'block' : 'none';
}

function renderCheckoutSummary() {
  const itemsContainer = document.getElementById('checkoutOrderItems');
  const totalDisplay = document.getElementById('checkoutFinalTotal');
  const btnTotalDisplay = document.getElementById('payBtnAmount');

  const totals = calculateCartTotals();

  if (itemsContainer) {
    itemsContainer.innerHTML = state.cart.map(item => `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:8px;">
        <span>${item.productTitle} × ${item.quantity}</span>
        <strong>${formatPrice((item.priceBDT || Math.round(item.priceUSD * 120)) * item.quantity, true)}</strong>
      </div>
    `).join('');
  }

  if (totalDisplay) totalDisplay.textContent = formatPrice(totals.totalBDT, true);
  if (btnTotalDisplay) btnTotalDisplay.textContent = formatPrice(totals.totalBDT, true);
}

// Submit Real Order to Server
async function processOrderPayment() {
  const nameInput = document.getElementById('checkoutName');
  const emailInput = document.getElementById('checkoutEmail');
  const phoneInput = document.getElementById('checkoutPhone');
  const notesInput = document.getElementById('checkoutNotes');
  const submitBtn = document.getElementById('submitOrderBtn');

  const customer_name = nameInput ? nameInput.value.trim() : '';
  const customer_email = emailInput ? emailInput.value.trim() : '';
  const customer_phone = phoneInput ? phoneInput.value.trim() : '';
  const customer_notes = notesInput ? notesInput.value.trim() : '';

  if (!customer_name || !customer_email) {
    alert('Please enter your full name and email address for credential delivery.');
    return;
  }

  // Get Gateway Specific Transaction ID
  let trx_id = '';
  if (selectedPaymentGateway === 'bkash') {
    const bkTrx = document.getElementById('bkashTrxInput');
    trx_id = bkTrx && bkTrx.value.trim() ? bkTrx.value.trim() : 'BKASH-VERIFIED-' + Math.floor(100000 + Math.random() * 900000);
  } else if (selectedPaymentGateway === 'nagad') {
    const ngTrx = document.getElementById('nagadTrxInput');
    trx_id = ngTrx && ngTrx.value.trim() ? ngTrx.value.trim() : 'NAGAD-VERIFIED-' + Math.floor(100000 + Math.random() * 900000);
  } else if (selectedPaymentGateway === 'card') {
    const cardInput = document.getElementById('checkoutCardNumber');
    const rawNum = cardInput ? cardInput.value.replace(/\D/g, '') : '';
    if (rawNum.length < 13) {
      alert('Please enter a valid card number or click "Fill Safe Test Visa (4242)".');
      return;
    }
    const last4 = rawNum.slice(-4);
    trx_id = `ch_${Math.random().toString(36).substring(2, 10)}_****${last4}`;
  } else if (selectedPaymentGateway === 'crypto') {
    trx_id = 'TXID-' + Math.random().toString(36).substring(2, 16).toUpperCase();
  } else {
    trx_id = 'PAYPAL-' + Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  // Disable button while processing
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg class="spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle></svg>
      Securing & Provisioning Credentials...
    `;
  }

  const payload = {
    customer_name,
    customer_email,
    customer_phone,
    payment_method: selectedPaymentGateway,
    items: state.cart.map(i => ({ productId: i.productId, planId: i.planId, quantity: i.quantity })),
    coupon_code: state.appliedCoupon ? state.appliedCoupon.code : null,
    currency: state.currency,
    currency_symbol: state.currencies[state.currency].symbol,
    trx_id,
    customer_notes
  };

  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const json = await res.json();

    if (json.success) {
      // Clear Cart
      state.cart = [];
      state.appliedCoupon = null;
      saveCart();
      updateCartUI();

      closeCheckoutModal();
      showOrderSuccessReceipt(json.order);
    } else {
      alert(`Checkout failed: ${json.message}`);
    }
  } catch (err) {
    console.error('Checkout error:', err);
    alert('An error occurred during checkout. Please try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `Complete Order & Get Instant Access (<span id="payBtnAmount">${formatPrice(calculateCartTotals().totalBDT, true)}</span>)`;
    }
  }
}

// Display Order Confirmation & Instant Credentials Vault Receipt
function showOrderSuccessReceipt(order) {
  const modal = document.getElementById('orderSuccessModal');
  if (!modal) return;

  document.getElementById('receiptOrderNum').textContent = order.orderNumber;
  document.getElementById('receiptCustomerEmail').textContent = order.customerEmail;
  document.getElementById('receiptPaymentMethod').textContent = order.paymentMethod.toUpperCase();
  document.getElementById('receiptTotalAmount').textContent = formatPrice(order.total);

  // Render Dispatched Credentials
  const credsContainer = document.getElementById('receiptCredentialsList');
  if (credsContainer && order.credentials) {
    credsContainer.innerHTML = order.credentials.map((cred, idx) => `
      <div class="credentials-vault-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h4 style="font-size:1.1rem; color:#60a5fa; font-weight:700;">${cred.product_title}</h4>
          <span class="badge-tag pro">${cred.plan_name}</span>
        </div>

        ${cred.account_email ? `
          <div class="credential-field">
            <span>Email / Username:</span>
            <strong>${cred.account_email}</strong>
            <button class="copy-btn" onclick="copyToClipboard('${cred.account_email}')">Copy</button>
          </div>
        ` : ''}

        ${cred.account_password ? `
          <div class="credential-field">
            <span>Password:</span>
            <strong>${cred.account_password}</strong>
            <button class="copy-btn" onclick="copyToClipboard('${cred.account_password}')">Copy</button>
          </div>
        ` : ''}

        ${cred.profile_pin ? `
          <div class="credential-field">
            <span>Assigned Profile & PIN:</span>
            <strong>${cred.profile_name || 'VIP'} (PIN: ${cred.profile_pin})</strong>
            <button class="copy-btn" onclick="copyToClipboard('${cred.profile_pin}')">Copy PIN</button>
          </div>
        ` : ''}

        ${cred.license_key ? `
          <div class="credential-field">
            <span>License Activation Key:</span>
            <strong>${cred.license_key}</strong>
            <button class="copy-btn" onclick="copyToClipboard('${cred.license_key}')">Copy Key</button>
          </div>
        ` : ''}

        ${cred.activation_link ? `
          <div style="margin-top:12px;">
            <a href="${cred.activation_link}" target="_blank" class="btn-primary" style="width:100%; text-decoration:none;">
              🚀 Open Direct One-Click Activation Link
            </a>
          </div>
        ` : ''}

        <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:12px; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:6px;">
          📌 <strong>Instructions:</strong> ${cred.instructions}
        </div>
      </div>
    `).join('');
  }

  // Update dynamic receipt WhatsApp action
  const waBtn = document.getElementById('receiptWhatsappLink');
  if (waBtn) {
    waBtn.href = `https://wa.me/8801343546958?text=${encodeURIComponent(`Hello FlixStore! I just placed Order #${order.orderNumber}. Could you please confirm my activation?`)}`;
  }

  modal.classList.add('active');
}

function closeOrderSuccessModal() {
  document.getElementById('orderSuccessModal').classList.remove('active');
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied to clipboard: ${text}`);
  }).catch(() => {
    prompt('Copy to clipboard:', text);
  });
}

// -----------------------------------------------------------------------------
// TRACK ORDER FEATURE
// -----------------------------------------------------------------------------

function openTrackOrderModal() {
  const modal = document.getElementById('trackOrderModal');
  if (modal) modal.classList.add('active');
}

function closeTrackOrderModal() {
  const modal = document.getElementById('trackOrderModal');
  if (modal) modal.classList.remove('active');
}

async function performOrderLookup() {
  const input = document.getElementById('trackOrderInput');
  const resultContainer = document.getElementById('trackOrderResult');
  if (!input || !resultContainer) return;

  const query = input.value.trim();
  if (!query) return;

  resultContainer.innerHTML = `
    <div style="text-align:center; padding:20px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle></svg>
      <p style="margin-top:8px; font-size:0.85rem;">Searching database vault...</p>
    </div>
  `;

  try {
    const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`);
    const json = await res.json();

    if (json.success) {
      const order = json.order;
      resultContainer.innerHTML = `
        <div style="background:var(--bg-tertiary); border:1px solid var(--glass-border); border-radius:var(--radius-lg); padding:20px; margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
            <h4 style="font-weight:700;">Order: ${order.order_number}</h4>
            <span class="badge-tag pro">${order.delivery_status.toUpperCase()}</span>
          </div>

          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:6px;">Customer: <strong>${order.customer_name}</strong> (${order.customer_email})</p>
          <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:14px;">Total Paid: <strong>${order.currency_symbol}${order.total_amount.toFixed(2)}</strong> via ${order.payment_method.toUpperCase()}</p>

          <h5 style="font-size:0.9rem; margin-bottom:8px; color:#60a5fa;">Delivered Subscriptions & Credentials:</h5>
          ${order.credentials.map(c => `
            <div style="background:var(--bg-secondary); padding:10px 14px; border-radius:8px; margin-bottom:8px; font-family:monospace; font-size:0.85rem;">
              <div style="font-weight:700; color:#ffffff; margin-bottom:4px;">${c.product_title || 'Subscription'}</div>
              ${c.account_email ? `<div>Email: <strong>${c.account_email}</strong></div>` : ''}
              ${c.account_password ? `<div>Password: <strong>${c.account_password}</strong></div>` : ''}
              ${c.profile_pin ? `<div>Profile PIN: <strong>${c.profile_pin}</strong></div>` : ''}
              ${c.license_key ? `<div>License Key: <strong>${c.license_key}</strong></div>` : ''}
              ${c.activation_link ? `<div style="margin-top:6px;"><a href="${c.activation_link}" target="_blank" style="color:#38bdf8;">Access Activation Link</a></div>` : ''}
            </div>
          `).join('')}
        </div>
      `;
    } else {
      resultContainer.innerHTML = `
        <div style="text-align:center; padding:20px; color:#f87171;">
          ✕ No active order found for "${query}". Check your order number or email.
        </div>
      `;
    }
  } catch (err) {
    console.error('Order tracking error:', err);
  }
}

// -----------------------------------------------------------------------------
// AUTH MODAL, SIGN UP & 2FA OTP VERIFICATION
// -----------------------------------------------------------------------------

function openAuthModal(defaultMode = 'signin') {
  const modal = document.getElementById('authModal');
  if (modal) {
    switchAuthMode(defaultMode);
    modal.classList.add('active');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('active');
}

function switchAuthMode(mode) {
  state.authMode = mode;
  const tabsContainer = document.getElementById('authTabsContainer');
  const tabSignInBtn = document.getElementById('tabSignInBtn');
  const tabSignUpBtn = document.getElementById('tabSignUpBtn');
  
  const signInView = document.getElementById('authSignInView');
  const signUpView = document.getElementById('authSignUpView');
  const otpView = document.getElementById('authOtpView');

  // Clear errors
  const loginErr = document.getElementById('loginErrorMsg');
  const regErr = document.getElementById('registerErrorMsg');
  const otpErr = document.getElementById('otpErrorMsg');
  if (loginErr) loginErr.textContent = '';
  if (regErr) regErr.textContent = '';
  if (otpErr) otpErr.textContent = '';

  if (mode === 'signin') {
    if (tabsContainer) tabsContainer.style.display = 'flex';
    if (tabSignInBtn) tabSignInBtn.classList.add('active');
    if (tabSignUpBtn) tabSignUpBtn.classList.remove('active');
    if (signInView) signInView.style.display = 'block';
    if (signUpView) signUpView.style.display = 'none';
    if (otpView) otpView.style.display = 'none';
    setTimeout(() => {
      const emailInput = document.getElementById('loginEmail');
      if (emailInput) emailInput.focus();
    }, 100);
  } else if (mode === 'signup') {
    if (tabsContainer) tabsContainer.style.display = 'flex';
    if (tabSignInBtn) tabSignInBtn.classList.remove('active');
    if (tabSignUpBtn) tabSignUpBtn.classList.add('active');
    if (signInView) signInView.style.display = 'none';
    if (signUpView) signUpView.style.display = 'block';
    if (otpView) otpView.style.display = 'none';
    setTimeout(() => {
      const nameInput = document.getElementById('regFullName');
      if (nameInput) nameInput.focus();
    }, 100);
  } else if (mode === 'otp') {
    if (tabsContainer) tabsContainer.style.display = 'none';
    if (signInView) signInView.style.display = 'none';
    if (signUpView) signUpView.style.display = 'none';
    if (otpView) otpView.style.display = 'block';
    setTimeout(() => {
      const otpInput = document.getElementById('otpCodeInput');
      if (otpInput) {
        otpInput.value = '';
        otpInput.focus();
      }
    }, 100);
  }
}

function checkAuthStatus() {
  const authBtn = document.getElementById('headerAuthBtn');
  const adminLink = document.getElementById('headerAdminLink');
  const mobileUserLabel = document.getElementById('mobileNavUserLabel');

  if (mobileUserLabel) {
    mobileUserLabel.textContent = (state.user && state.token) ? state.user.full_name.split(' ')[0] : 'Account';
  }

  // Strict Security Rule: Hide the Admin link for regular clients/visitors!
  // Only show the Admin link if the authenticated user has role === 'admin'
  if (adminLink) {
    if (state.user && state.token && state.user.role === 'admin') {
      adminLink.style.display = 'inline-flex';
    } else {
      adminLink.style.display = 'none';
    }
  }

  if (!authBtn) return;

  if (state.user && state.token) {
    authBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      <span>${state.user.full_name.split(' ')[0]}</span>
    `;
    authBtn.onclick = logoutUser;
  } else {
    authBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      <span>Sign In</span>
    `;
    authBtn.onclick = () => openAuthModal('signin');
  }
}

// 1. Submit Sign In -> Dispatches 6-Digit OTP
async function handleLoginSubmit(e) {
  e.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const errElem = document.getElementById('loginErrorMsg');
  const submitBtn = document.getElementById('signInSubmitBtn');

  if (errElem) errElem.textContent = '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Verifying Credentials...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value, password: passInput.value })
    });
    const json = await res.json();

    if (json.success) {
      if (json.requiresOtp) {
        state.pendingOtpEmail = json.email;
        
        const emailTarget = document.getElementById('otpEmailTarget');
        if (emailTarget) emailTarget.textContent = json.email;

        switchAuthMode('otp');
      } else {
        // Direct Auth
        completeAuthentication(json);
      }
    } else {
      if (errElem) errElem.textContent = json.message || 'Invalid email or password';
    }
  } catch (err) {
    console.error('Login error:', err);
    if (errElem) errElem.textContent = 'Network error during login. Please try again.';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In →';
    }
  }
}

// 2. Submit Sign Up (Registration) -> Creates User & Dispatches OTP to Email
async function handleRegisterSubmit(e) {
  e.preventDefault();
  const nameInput = document.getElementById('regFullName');
  const emailInput = document.getElementById('regEmail');
  const phoneInput = document.getElementById('regPhone');
  const passInput = document.getElementById('regPassword');
  const errElem = document.getElementById('registerErrorMsg');
  const submitBtn = document.getElementById('signUpSubmitBtn');

  if (errElem) errElem.textContent = '';
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';
  }

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value,
        password: passInput.value
      })
    });
    const json = await res.json();

    if (json.success) {
      state.pendingOtpEmail = json.email;

      const emailTarget = document.getElementById('otpEmailTarget');
      if (emailTarget) emailTarget.textContent = json.email;

      switchAuthMode('otp');
    } else {
      if (errElem) errElem.textContent = json.message || 'Registration failed';
    }
  } catch (err) {
    console.error('Registration error:', err);
    if (errElem) errElem.textContent = 'Network error during sign up. Please try again.';
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account & Continue →';
    }
  }
}

// 3. Submit OTP Verification Code
async function handleOtpSubmit(e) {
  e.preventDefault();
  const otpInput = document.getElementById('otpCodeInput');
  const errElem = document.getElementById('otpErrorMsg');
  const verifyBtn = document.getElementById('verifyOtpBtn');

  if (!otpInput || !otpInput.value) return;
  if (errElem) errElem.textContent = '';
  if (verifyBtn) {
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying Code...';
  }

  try {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: state.pendingOtpEmail,
        otp: otpInput.value.trim()
      })
    });
    const json = await res.json();

    if (json.success) {
      completeAuthentication(json);
    } else {
      if (errElem) errElem.textContent = json.message || 'Incorrect verification code';
      if (otpInput) {
        otpInput.select();
        otpInput.focus();
      }
    }
  } catch (err) {
    console.error('OTP verification error:', err);
    if (errElem) errElem.textContent = 'Network error verifying code. Please try again.';
  } finally {
    if (verifyBtn) {
      verifyBtn.disabled = false;
      verifyBtn.textContent = 'Verify & Complete Sign In →';
    }
  }
}

// Resend OTP with 30s Countdown Timer
async function handleResendOtp() {
  const resendBtn = document.getElementById('resendOtpBtn');
  const errElem = document.getElementById('otpErrorMsg');

  if (!state.pendingOtpEmail) {
    switchAuthMode('signin');
    return;
  }

  if (resendBtn) {
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';
  }

  try {
    const res = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: state.pendingOtpEmail })
    });
    const json = await res.json();

    if (json.success) {
      if (errElem) {
        errElem.style.color = '#34d399';
        errElem.textContent = '✓ A new verification code was sent to your email inbox!';
        setTimeout(() => { if (errElem) { errElem.style.color = '#f87171'; errElem.textContent = ''; } }, 4500);
      }

      // Start 30s countdown
      let countdown = 30;
      const interval = setInterval(() => {
        countdown--;
        if (resendBtn) {
          if (countdown > 0) {
            resendBtn.disabled = true;
            resendBtn.textContent = `Resend in ${countdown}s`;
          } else {
            clearInterval(interval);
            resendBtn.disabled = false;
            resendBtn.textContent = 'Resend Code';
          }
        } else {
          clearInterval(interval);
        }
      }, 1000);
    } else {
      if (errElem) errElem.textContent = json.message || 'Failed to resend code';
      if (resendBtn) {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend Code';
      }
    }
  } catch (err) {
    console.error('Resend OTP error:', err);
    if (resendBtn) {
      resendBtn.disabled = false;
      resendBtn.textContent = 'Resend Code';
    }
  }
}

// Complete Authentication & Update Session State
function completeAuthentication(json) {
  state.user = json.user;
  state.token = json.token;
  localStorage.setItem('flix_user', JSON.stringify(json.user));
  localStorage.setItem('flix_token', json.token);

  closeAuthModal();
  checkAuthStatus();

  // If admin, jump to admin dashboard
  if (json.user.role === 'admin') {
    window.location.href = '/admin';
  }
}

function logoutUser() {
  if (confirm('Are you sure you want to log out?')) {
    state.user = null;
    state.token = null;
    localStorage.removeItem('flix_user');
    localStorage.removeItem('flix_token');
    checkAuthStatus();
  }
}

// -----------------------------------------------------------------------------
// EVENT LISTENERS
// -----------------------------------------------------------------------------

function initEventListeners() {
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      applyFilters();
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.parentElement;
      item.classList.toggle('active');
    });
  });

  // Secret Admin Shortcut for Store Owner (Ctrl + Alt + A)
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.altKey && e.key.toLowerCase() === 'a') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a')) {
      window.location.href = '/admin';
    }
  });

  // Initialize Interactive Card Handlers
  initCardInputHandlers();
}

// -----------------------------------------------------------------------------
// INTERACTIVE CREDIT CARD & LUHN VALIDATION
// -----------------------------------------------------------------------------

function luhnCheck(numStr) {
  const clean = (numStr || '').replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return (sum % 10) === 0;
}

function detectCardBrand(numStr) {
  const clean = (numStr || '').replace(/\D/g, '');
  if (/^4/.test(clean)) {
    return { name: 'VISA', class: 'visa', icon: '💳' };
  } else if (/^(5[1-5]|2[2-7])/.test(clean)) {
    return { name: 'Mastercard', class: 'mastercard', icon: '🔴' };
  } else if (/^3[47]/.test(clean)) {
    return { name: 'AMEX', class: 'amex', icon: '🛡️' };
  } else if (/^6(?:011|5)/.test(clean)) {
    return { name: 'Discover', class: 'discover', icon: '🌐' };
  }
  return { name: 'FlixCard', class: 'default', icon: '💳' };
}

function initCardInputHandlers() {
  const cardInput = document.getElementById('checkoutCardNumber');
  const expInput = document.getElementById('checkoutCardExp');
  const cvcInput = document.getElementById('checkoutCardCvc');
  const nameInput = document.getElementById('checkoutName');

  const cardVisual = document.getElementById('creditCardVisual');
  const cardNumPreview = document.getElementById('cardNumPreview');
  const cardBrandBadge = document.getElementById('cardBrandBadge');
  const cardHolderPreview = document.getElementById('cardHolderPreview');
  const cardExpPreview = document.getElementById('cardExpPreview');
  const cardTypeIcon = document.getElementById('cardTypeIcon');
  const cardValidationStatus = document.getElementById('cardValidationStatus');

  if (cardInput) {
    cardInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 16);
      
      // Auto format with space every 4 digits
      let formatted = '';
      for (let i = 0; i < val.length; i += 4) {
        if (i > 0) formatted += ' ';
        formatted += val.substring(i, i + 4);
      }
      e.target.value = formatted;

      // Update Card Visual Preview
      const brand = detectCardBrand(val);
      if (cardVisual) {
        cardVisual.className = `credit-card-preview ${brand.class}`;
      }
      if (cardBrandBadge) {
        cardBrandBadge.textContent = brand.name;
      }
      if (cardTypeIcon) {
        cardTypeIcon.textContent = brand.icon;
      }

      if (cardNumPreview) {
        if (val.length === 0) {
          cardNumPreview.textContent = '•••• •••• •••• ••••';
        } else {
          // Display formatted preview with trailing dot mask
          let previewStr = formatted;
          const remaining = 16 - val.length;
          if (remaining > 0) {
            let dots = ' •••• •••• •••• ••••'.substring(0, Math.ceil(remaining / 4) * 5);
            previewStr += dots.substring(previewStr.length % 5);
          }
          cardNumPreview.textContent = formatted.length < 19 ? formatted + ' •••• •••• ••••'.substring(formatted.length) : formatted;
        }
      }

      // Luhn Check & Validation Status
      if (cardValidationStatus) {
        if (val.length === 0) {
          cardValidationStatus.innerHTML = '';
        } else if (val.length >= 13) {
          const isValid = luhnCheck(val);
          if (isValid) {
            cardValidationStatus.innerHTML = `<span style="color:#10b981; font-weight:700;">✓ Valid ${brand.name}</span>`;
          } else {
            cardValidationStatus.innerHTML = `<span style="color:#ef4444; font-weight:600;">✕ Invalid Checksum</span>`;
          }
        } else {
          cardValidationStatus.innerHTML = `<span style="color:var(--text-muted); font-size:0.75rem;">${val.length}/16 digits</span>`;
        }
      }
    });
  }

  if (expInput) {
    expInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length >= 2) {
        let mm = parseInt(val.substring(0, 2), 10);
        if (mm < 1) mm = 1;
        if (mm > 12) mm = 12;
        const mmStr = mm < 10 ? `0${mm}` : `${mm}`;
        val = mmStr + '/' + val.substring(2);
      }
      e.target.value = val;
      if (cardExpPreview) {
        cardExpPreview.textContent = val || '12/28';
      }
    });
  }

  if (nameInput) {
    nameInput.addEventListener('input', (e) => {
      if (cardHolderPreview) {
        cardHolderPreview.textContent = e.target.value.trim().toUpperCase() || 'FLIXSTORE SUBSCRIBER';
      }
    });
  }

  // Initial trigger
  if (cardInput && cardInput.value) {
    cardInput.dispatchEvent(new Event('input'));
  }
}

function fillTestCardDetails() {
  const cardInput = document.getElementById('checkoutCardNumber');
  const expInput = document.getElementById('checkoutCardExp');
  const cvcInput = document.getElementById('checkoutCardCvc');
  if (cardInput) {
    cardInput.value = '4242 4242 4242 4242';
    cardInput.dispatchEvent(new Event('input'));
  }
  if (expInput) {
    expInput.value = '12/28';
    expInput.dispatchEvent(new Event('input'));
  }
  if (cvcInput) {
    cvcInput.value = '921';
  }
}
