/**
 * FlixStore - Developer Console & Admin Control Center
 * Complete unified management for subscriptions, orders, credential vault, users & Neon cloud services
 */

const adminState = {
  token: localStorage.getItem('flix_admin_token') || localStorage.getItem('flix_token') || null,
  user: JSON.parse(localStorage.getItem('flix_user') || 'null'),
  currentTab: 'overview',
  stats: null,
  orders: [],
  filteredOrders: [],
  products: [],
  vault: [],
  customers: [],
  coupons: []
};

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  initAdminTabs();
});

// Toast notification helper
function showToast(message, isError = false) {
  const toast = document.getElementById('adminToast');
  const msgElem = document.getElementById('adminToastMsg');
  const iconElem = document.getElementById('adminToastIcon');
  if (!toast || !msgElem) return;

  msgElem.textContent = message;
  if (iconElem) iconElem.textContent = isError ? '✕' : '✓';
  toast.style.borderColor = isError ? 'rgba(239, 68, 68, 0.4)' : 'rgba(52, 211, 153, 0.4)';
  toast.style.display = 'flex';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3500);
}

// Check admin authentication
function checkAdminAuth() {
  if (!adminState.token || !adminState.user || adminState.user.role !== 'admin') {
    showAdminLoginModal();
  } else {
    hideAdminLoginModal();
    updateAdminUserHeader();
    loadDashboardData();
  }
}

function updateAdminUserHeader() {
  const label = document.getElementById('adminUserLabel');
  if (label && adminState.user) {
    label.textContent = adminState.user.full_name || 'Administrator';
  }
  const curlPlaceholder = document.getElementById('curlTokenPlaceholder');
  if (curlPlaceholder && adminState.token) {
    curlPlaceholder.textContent = adminState.token.slice(0, 16) + '...';
  }
}

function showAdminLoginModal() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.style.display = 'flex';
}

function hideAdminLoginModal() {
  const modal = document.getElementById('adminLoginModal');
  if (modal) modal.style.display = 'none';
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const emailInput = document.getElementById('adminEmail');
  const passInput = document.getElementById('adminPassword');
  const errElem = document.getElementById('adminLoginError');
  const btn = document.getElementById('adminLoginSubmitBtn');

  if (errElem) errElem.textContent = '';
  if (btn) {
    btn.disabled = true;
    btn.textContent = 'Verifying Security Credentials...';
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: emailInput.value.trim(),
        password: passInput.value,
        skipOtp: true
      })
    });
    const json = await res.json();

    if (json.success && json.token) {
      if (json.user.role !== 'admin') {
        if (errElem) errElem.textContent = 'Access Denied: Administrator role required.';
        return;
      }

      adminState.user = json.user;
      adminState.token = json.token;
      localStorage.setItem('flix_token', json.token);
      localStorage.setItem('flix_admin_token', json.token);
      localStorage.setItem('flix_user', JSON.stringify(json.user));

      hideAdminLoginModal();
      updateAdminUserHeader();
      loadDashboardData();
      showToast('Welcome back, Administrator!');
    } else {
      if (errElem) errElem.textContent = json.message || 'Invalid administrator credentials';
    }
  } catch (err) {
    console.error('Admin login error:', err);
    if (errElem) errElem.textContent = 'Connection error. Please try again.';
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Unlock Management Console';
    }
  }
}

function adminLogout() {
  localStorage.removeItem('flix_admin_token');
  localStorage.removeItem('flix_token');
  localStorage.removeItem('flix_user');
  window.location.reload();
}

function copyAdminApiToken() {
  if (!adminState.token) return;
  navigator.clipboard.writeText(adminState.token).then(() => {
    showToast('Admin JWT Bearer Token copied to clipboard!');
  }).catch(() => {
    prompt('Copy your Bearer Token:', adminState.token);
  });
}

// -----------------------------------------------------------------------------
// TAB NAVIGATION
// -----------------------------------------------------------------------------

function initAdminTabs() {
  document.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      switchAdminTab(tab);
    });
  });
}

function switchAdminTab(tabName) {
  adminState.currentTab = tabName;

  document.querySelectorAll('.admin-nav-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  document.querySelectorAll('.admin-tab-content').forEach(view => {
    view.style.display = view.id === `${tabName}View` ? 'block' : 'none';
  });

  if (tabName === 'overview') loadOverviewStats();
  if (tabName === 'orders') loadOrdersList();
  if (tabName === 'products') loadProductsList();
  if (tabName === 'vault') loadVaultList();
  if (tabName === 'customers') loadCustomersList();
  if (tabName === 'coupons') loadCouponsList();
  if (tabName === 'neon') loadNeonCloudStats();
}

// -----------------------------------------------------------------------------
// TAB 1: OVERVIEW & ADVANCED KPIS
// -----------------------------------------------------------------------------

async function loadDashboardData() {
  await Promise.all([
    loadOverviewStats(),
    loadOrdersList(),
    loadProductsList()
  ]);
}

async function loadOverviewStats() {
  if (!adminState.token) return;

  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();

    if (json.success) {
      adminState.stats = json.stats;
      renderKPIs(json.stats);
      renderRecentOrders(json.stats.recentOrders);
      renderCategorySales(json.stats.categoryStats);
    }
  } catch (err) {
    console.error('Error fetching admin stats:', err);
  }
}

function renderKPIs(stats) {
  const revElem = document.getElementById('statTotalRevenue');
  const ordElem = document.getElementById('statTotalOrders');
  const prodElem = document.getElementById('statActiveProducts');
  const vaultElem = document.getElementById('statAvailableVault');

  const totalBDT = Math.round(stats.totalRevenue * 120);
  if (revElem) revElem.innerHTML = `৳${totalBDT.toLocaleString()} <span style="font-size:0.85rem; color:#94a3b8; font-weight:600;">($${Number(stats.totalRevenue).toFixed(2)})</span>`;
  if (ordElem) ordElem.textContent = stats.totalOrders.toLocaleString();
  if (prodElem) prodElem.textContent = stats.activeProducts;
  if (vaultElem) vaultElem.textContent = stats.availableVaultKeys;

  const ordersCountBadge = document.getElementById('navOrdersCount');
  if (ordersCountBadge) ordersCountBadge.textContent = stats.totalOrders;

  const productsCountBadge = document.getElementById('navProductsCount');
  if (productsCountBadge) productsCountBadge.textContent = stats.activeProducts;
}

function renderRecentOrders(orders) {
  const tableBody = document.getElementById('recentOrdersTableBody');
  if (!tableBody) return;

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px; color:#94a3b8;">No recent orders placed yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = orders.slice(0, 7).map(o => {
    const isDelivered = o.delivery_status === 'delivered';
    const amountBDT = Math.round(o.total_amount * (o.currency === 'USD' ? 120 : 1));
    const gwClass = o.payment_method ? o.payment_method.toLowerCase() : 'card';

    return `
      <tr>
        <td><strong style="color:#60a5fa;">#${o.order_number}</strong></td>
        <td>
          <div style="font-weight:700;">${o.customer_name}</div>
          <div style="font-size:0.75rem; color:#94a3b8;">${o.customer_email}</div>
        </td>
        <td><strong>৳${amountBDT.toLocaleString()}</strong></td>
        <td><span class="gateway-pill ${gwClass}">${o.payment_method}</span></td>
        <td>
          <span class="badge-tag ${isDelivered ? 'bestseller' : 'hot'}" style="font-size:0.7rem; padding:2px 8px;">
            ${isDelivered ? '● DELIVERED' : '⏳ ' + o.delivery_status.toUpperCase()}
          </span>
        </td>
        <td>
          <button class="btn-secondary" style="padding:4px 10px; font-size:0.74rem;" onclick="viewOrderCredentials('${encodeURIComponent(o.delivered_credentials || '[]')}')">
            🔑 Credentials
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderCategorySales(catStats) {
  const container = document.getElementById('categorySalesStats');
  if (!container || !catStats) return;

  if (catStats.length === 0) {
    container.innerHTML = '<div style="color:#94a3b8; font-size:0.82rem; padding:10px 0;">No category sales data yet.</div>';
    return;
  }

  const maxRev = Math.max(...catStats.map(c => Number(c.category_revenue || 0)), 1);

  container.innerHTML = catStats.map(c => {
    const revBDT = Math.round((c.category_revenue || 0) * 120);
    const pct = Math.min(100, Math.round(((c.category_revenue || 0) / maxRev) * 100));

    return `
      <div>
        <div style="display:flex; justify-content:space-between; font-size:0.82rem; margin-bottom:4px;">
          <span><strong>${c.name}</strong> (${c.items_sold} sold)</span>
          <span style="color:#60a5fa; font-weight:700;">৳${revBDT.toLocaleString()}</span>
        </div>
        <div style="height:6px; background:rgba(255,255,255,0.06); border-radius:3px; overflow:hidden;">
          <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, #3b82f6, #8b5cf6); border-radius:3px;"></div>
        </div>
      </div>
    `;
  }).join('');
}

// -----------------------------------------------------------------------------
// TAB 2: ORDERS MANAGEMENT & FULFILLMENT
// -----------------------------------------------------------------------------

async function loadOrdersList() {
  if (!adminState.token) return;

  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();

    if (json.success) {
      adminState.orders = json.orders;
      adminState.filteredOrders = json.orders;
      renderAllOrders(json.orders);
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
}

function filterOrdersTable() {
  const searchInput = document.getElementById('orderSearchInput');
  const statusFilter = document.getElementById('orderStatusFilter');
  const gwFilter = document.getElementById('orderGatewayFilter');

  const q = searchInput ? searchInput.value.trim().toLowerCase() : '';
  const status = statusFilter ? statusFilter.value : 'all';
  const gw = gwFilter ? gwFilter.value : 'all';

  adminState.filteredOrders = adminState.orders.filter(o => {
    const matchesSearch = !q || 
      (o.order_number && o.order_number.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.toLowerCase().includes(q)) ||
      (o.transaction_id && o.transaction_id.toLowerCase().includes(q));

    const matchesStatus = status === 'all' || o.delivery_status === status;
    const matchesGw = gw === 'all' || (o.payment_method && o.payment_method.toLowerCase() === gw);

    return matchesSearch && matchesStatus && matchesGw;
  });

  renderAllOrders(adminState.filteredOrders);
}

function renderAllOrders(orders) {
  const tableBody = document.getElementById('allOrdersTableBody');
  if (!tableBody) return;

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">No matching customer orders found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = orders.map(o => {
    const amountBDT = Math.round(o.total_amount * (o.currency === 'USD' ? 120 : 1));
    const gwClass = o.payment_method ? o.payment_method.toLowerCase() : 'card';
    const dateStr = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const cleanPhone = o.customer_phone ? o.customer_phone.replace(/\D/g, '') : '';

    return `
      <tr>
        <td>
          <strong style="color:#60a5fa; font-size:0.9rem;">#${o.order_number}</strong>
          <div style="font-size:0.72rem; color:#94a3b8;">ID: ${o.id}</div>
        </td>
        <td>
          <div style="font-weight:700;">${o.customer_name}</div>
          <div style="font-size:0.78rem; color:#cbd5e1;">${o.customer_email}</div>
          ${o.customer_phone ? `<div style="font-size:0.74rem; color:#94a3b8;">📞 ${o.customer_phone}</div>` : ''}
        </td>
        <td>
          <strong style="font-size:0.95rem;">৳${amountBDT.toLocaleString()}</strong>
          <div style="font-size:0.72rem; color:#94a3b8;">$${Number(o.total_amount).toFixed(2)} USD</div>
        </td>
        <td>
          <span class="gateway-pill ${gwClass}">${o.payment_method}</span>
          <div style="font-size:0.74rem; color:#94a3b8; font-family:monospace; margin-top:3px;" title="Transaction ID">${o.transaction_id || 'AUTO'}</div>
        </td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" style="background:var(--admin-bg-base); color:#ffffff; border:1px solid var(--admin-border); padding:5px 8px; border-radius:6px; font-size:0.78rem; cursor:pointer;">
            <option value="delivered" ${o.delivery_status === 'delivered' ? 'selected' : ''}>● Delivered</option>
            <option value="processing" ${o.delivery_status === 'processing' ? 'selected' : ''}>⏳ Processing</option>
            <option value="pending" ${o.delivery_status === 'pending' ? 'selected' : ''}>⚠️ Pending</option>
          </select>
        </td>
        <td>${dateStr}</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <button class="btn-secondary" style="padding:4px 8px; font-size:0.74rem;" onclick="viewOrderCredentials('${encodeURIComponent(o.delivered_credentials || '[]')}')" title="Inspect Credentials">
              🔑 View Keys
            </button>
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(o.customer_name)}%2C%20this%20is%20FlixStore%20Support%20regarding%20Order%20${encodeURIComponent(o.order_number)}" target="_blank" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#10b981; border-color:rgba(16,185,129,0.3); text-decoration:none;" title="Chat via WhatsApp">
                💬 WhatsApp
              </a>
            ` : ''}
            <button onclick="deleteOrder(${o.id}, '${o.order_number}')" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" title="Delete Order Record">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteOrder(orderId, orderNumber) {
  if (!confirm(`Are you sure you want to permanently delete Order #${orderNumber}?\n\nThis will remove the transaction record and release any assigned credentials back to available inventory.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminState.token}`
      }
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || `Order #${orderNumber} removed`, 'success');
      loadOrdersList();
      loadAdminStats();
    } else {
      showToast(json.message || 'Failed to delete order', 'error');
    }
  } catch (err) {
    console.error('Delete order error:', err);
    showToast('Network error deleting order', 'error');
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify({ delivery_status: newStatus })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Order #${orderId} marked as ${newStatus}!`);
    }
  } catch (err) {
    console.error('Status update error:', err);
    showToast('Failed to update status', true);
  }
}

// 1-Click Export Orders to CSV
function exportOrdersToCSV() {
  const orders = adminState.filteredOrders.length > 0 ? adminState.filteredOrders : adminState.orders;
  if (!orders || orders.length === 0) {
    alert('No orders to export');
    return;
  }

  const headers = ['Order Number', 'Customer Name', 'Customer Email', 'Customer Phone', 'Payment Method', 'Transaction ID', 'Total Amount USD', 'Delivery Status', 'Created At'];
  const rows = orders.map(o => [
    `"${o.order_number}"`,
    `"${o.customer_name}"`,
    `"${o.customer_email}"`,
    `"${o.customer_phone || ''}"`,
    `"${o.payment_method}"`,
    `"${o.transaction_id || ''}"`,
    o.total_amount,
    `"${o.delivery_status}"`,
    `"${o.created_at}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `flixstore_orders_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  showToast('Orders exported to CSV spreadsheet!');
}

function viewOrderCredentials(encodedJson) {
  try {
    const decoded = decodeURIComponent(encodedJson);
    const creds = JSON.parse(decoded || '[]');

    const modal = document.getElementById('credentialsViewerModal');
    const container = document.getElementById('credentialsViewerBody');
    if (!modal || !container) return;

    if (creds.length === 0) {
      container.innerHTML = '<div style="color:#94a3b8; padding:20px; text-align:center;">No specific credentials assigned to this order.</div>';
    } else {
      container.innerHTML = creds.map(c => `
        <div style="background:var(--admin-bg-base); border:1px solid var(--admin-border); padding:16px; border-radius:10px; margin-bottom:12px; font-family:monospace; font-size:0.86rem;">
          <div style="font-weight:700; color:#38bdf8; margin-bottom:8px; font-size:0.95rem;">${c.product_title || 'Subscription'} (${c.plan_name || 'Plan'})</div>
          ${c.account_email ? `<div style="margin-bottom:4px;">Email: <strong style="color:#ffffff;">${c.account_email}</strong></div>` : ''}
          ${c.account_password ? `<div style="margin-bottom:4px;">Password: <strong style="color:#ffffff;">${c.account_password}</strong></div>` : ''}
          ${c.profile_pin ? `<div style="margin-bottom:4px;">Profile PIN: <strong style="color:#f59e0b;">${c.profile_pin}</strong></div>` : ''}
          ${c.license_key ? `<div style="margin-bottom:4px;">License Key: <strong style="color:#10b981;">${c.license_key}</strong></div>` : ''}
          ${c.activation_link ? `<div style="margin-top:6px;"><a href="${c.activation_link}" target="_blank" style="color:#38bdf8; text-decoration:none;">🔗 Open Activation Portal &rarr;</a></div>` : ''}
          <div style="font-size:0.76rem; color:#94a3b8; margin-top:8px; border-top:1px dashed var(--admin-border); padding-top:6px;">Instructions: ${c.instructions || 'Standard access'}</div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
  } catch (err) {
    alert('Failed to parse credentials: ' + err.message);
  }
}

function closeCredentialsViewer() {
  const modal = document.getElementById('credentialsViewerModal');
  if (modal) modal.style.display = 'none';
}

// -----------------------------------------------------------------------------
// TAB 3: PRODUCTS CATALOG
// -----------------------------------------------------------------------------

async function loadProductsList() {
  if (!adminState.token) return;

  try {
    const res = await fetch('/api/admin/products', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      adminState.products = json.products;
      renderAdminProducts(json.products);
      populateVaultProductDropdown(json.products);
    }
  } catch (err) {
    console.error('Fetch products error:', err);
  }
}

function filterProductsTable() {
  const input = document.getElementById('productSearchInput');
  const q = input ? input.value.trim().toLowerCase() : '';
  const filtered = adminState.products.filter(p => !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  renderAdminProducts(filtered);
}

function renderAdminProducts(products) {
  const tableBody = document.getElementById('adminProductsTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = products.map(p => {
    const priceBDT = Math.round(Number(p.base_price || 0) * 120);
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${p.logo_url}" style="width:38px; height:38px; border-radius:8px; object-fit:cover; border:1px solid var(--admin-border);">
            <div>
              <strong style="color:#ffffff;">${p.title}</strong>
              <div style="color:#94a3b8; font-size:0.75rem; font-family:monospace;">${p.slug}</div>
            </div>
          </div>
        </td>
        <td><span class="badge-pill">${p.category_name}</span></td>
        <td>
          <strong>$${Number(p.base_price || 0).toFixed(2)}</strong>
          <span style="font-size:0.76rem; color:#94a3b8;">(~৳${priceBDT})</span>
        </td>
        <td><span class="badge-tag bestseller">${p.badge || 'Active'}</span></td>
        <td><strong style="color:#fbbf24;">${Number(p.rating || 5.0).toFixed(1)} ★</strong> (${p.review_count || 0})</td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            <a href="/#productsGrid" target="_blank" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem;">
              View
            </a>
            <button onclick="deleteProduct(${p.id}, '${p.title.replace(/'/g, "\\'")}')" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" title="Delete Subscription">
              🗑️ Delete
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteProduct(productId, title) {
  if (!confirm(`Are you sure you want to permanently remove "${title}"?\n\nThis will remove the product and its plans from the store catalog.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminState.token}`
      }
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Product removed successfully', 'success');
      loadProductsList();
      loadAdminStats();
    } else {
      showToast(json.message || 'Failed to remove product', 'error');
    }
  } catch (err) {
    console.error('Delete product error:', err);
    showToast('Network error removing product', 'error');
  }
}

// =============================================================================
// SUBSCRIPTION CREATOR STUDIO (EXECUTIVE EDITION v2.0)
// =============================================================================

const BRAND_PRESETS = [
  { id: 'netflix', name: 'Netflix', logo: '/assets/brands/netflix.svg', cat: 1, title: 'Netflix Premium 4K UHD', tagline: 'Ultra HD 4K • Private Profile with PIN • Direct BD Streaming', badge: 'Official Verified', presetType: 'streaming' },
  { id: 'prime', name: 'Prime Video', logo: '/assets/brands/prime-video.svg', cat: 1, title: 'Amazon Prime Video 4K', tagline: 'Full HD / 4K UHD • Private Profile • Ad-Free', badge: 'Hot Deal', presetType: 'streaming' },
  { id: 'disney', name: 'Disney+', logo: '/assets/brands/disney-plus.svg', cat: 1, title: 'Disney+ Premium 4K UHD', tagline: 'Disney, Pixar, Marvel, Star Wars & Nat Geo • 4K HDR', badge: 'Family Choice', presetType: 'streaming' },
  { id: 'spotify', name: 'Spotify', logo: '/assets/brands/spotify.svg', cat: 4, title: 'Spotify Premium Individual', tagline: 'Ad-Free Music • High Quality Audio • Offline Downloads', badge: 'Music #1', presetType: 'streaming' },
  { id: 'youtube', name: 'YouTube', logo: '/assets/brands/youtube-premium.svg', cat: 4, title: 'YouTube Premium + Music', tagline: 'Ad-Free Video • Background Play • Includes YouTube Music', badge: 'Bestseller', presetType: 'streaming' },
  { id: 'chatgpt', name: 'ChatGPT Plus', logo: '/assets/brands/chatgpt.svg', cat: 3, title: 'ChatGPT Plus (GPT-4o & Canvas)', tagline: 'Unlimited GPT-4o, DALL-E 3, Advanced Voice & Web Browsing', badge: 'AI Superpower', presetType: 'ai' },
  { id: 'claude', name: 'Claude Pro', logo: '/assets/brands/claude-ai.svg', cat: 3, title: 'Claude Pro (Opus & Sonnet 3.5)', tagline: 'Claude 3.5 Sonnet & Haiku • 5x More Usage • Project Artifacts', badge: 'Top For Coders', presetType: 'ai' },
  { id: 'midjourney', name: 'Midjourney', logo: '/assets/brands/midjourney.svg', cat: 3, title: 'Midjourney Standard Plan', tagline: 'Fast GPU Hours • Relax GPU Generation • Commercial Terms', badge: 'Creative AI', presetType: 'ai' },
  { id: 'canva', name: 'Canva Pro', logo: '/assets/brands/canva.svg', cat: 5, title: 'Canva Pro (Team / Lifetime)', tagline: '100M+ Premium Stock Photos, Videos & Audio • Background Remover', badge: 'Great Value', presetType: 'software' },
  { id: 'adobe', name: 'Adobe CC', logo: '/assets/brands/adobe-creative-cloud.svg', cat: 5, title: 'Adobe Creative Cloud All Apps', tagline: 'Photoshop, Illustrator, Premiere Pro, After Effects • 100GB Cloud', badge: 'Pro Suite', presetType: 'software' },
  { id: 'crunchyroll', name: 'Crunchyroll', logo: '/assets/brands/crunchyroll.svg', cat: 1, title: 'Crunchyroll Mega Fan', tagline: 'Simulcast Anime • No Ads • Offline Viewing • 4 Concurrent Streams', badge: 'Anime Top', presetType: 'streaming' },
  { id: 'nordvpn', name: 'NordVPN', logo: '/assets/brands/nordvpn.svg', cat: 6, title: 'NordVPN Ultimate Security', tagline: 'Ultra-Fast VPN • Threat Protection • Meshnet • 10 Devices', badge: 'Fastest VPN', presetType: 'software' },
  { id: 'm365', name: 'Microsoft 365', logo: '/assets/brands/microsoft-365.svg', cat: 5, title: 'Microsoft 365 Family / Pro', tagline: 'Word, Excel, PowerPoint • 1TB OneDrive Cloud Storage', badge: 'Productivity Pro', presetType: 'software' },
  { id: 'googleone', name: 'Google One', logo: '/assets/brands/google-one.svg', cat: 5, title: 'Google One 2TB Cloud Storage', tagline: '2TB Cloud Storage for Google Drive, Gmail & Photos • Family Sharing', badge: 'Cloud Storage', presetType: 'software' },
  { id: 'hbomax', name: 'HBO Max', logo: '/assets/brands/hbo-max.svg', cat: 1, title: 'HBO Max (Max) Ultimate 4K', tagline: 'Warner Bros, HBO Originals, DC Universe & 4K UHD Streams', badge: 'HBO Exclusive', presetType: 'streaming' },
  { id: 'applemusic', name: 'Apple Music', logo: '/assets/brands/apple-music.svg', cat: 4, title: 'Apple Music Lossless + Spatial', tagline: 'Spatial Audio with Dolby Atmos • 100 Million Songs • Lossless', badge: 'Lossless Audio', presetType: 'streaming' },
  { id: 'chorki', name: 'Chorki', logo: '/assets/brands/chorki.png', cat: 2, title: 'Chorki Premium Bengali OTT', tagline: 'Exclusive Bengali Movies, Original Web Series & Films', badge: 'Bengali Top', presetType: 'streaming' },
  { id: 'hoichoi', name: 'Hoichoi', logo: '/assets/brands/hoichoi.png', cat: 2, title: 'Hoichoi TV Premium Bengali', tagline: 'Top Bengali Web Series, World Digital Premieres & Classics', badge: 'Dhaka Favorite', presetType: 'streaming' }
];

let studioPlans = [];
let studioSlugManuallyEdited = false;
let studioPlanCounter = 0;

function renderBrandPresets() {
  const container = document.getElementById('brandPresetsContainer');
  if (!container) return;
  container.innerHTML = BRAND_PRESETS.map(b => `
    <div class="brand-preset-chip" data-id="${b.id}" onclick="selectBrandPreset('${b.id}')">
      <img src="${b.logo}" alt="${b.name}" onerror="this.style.display='none'">
      <span>${b.name}</span>
    </div>
  `).join('');
}

function selectBrandPreset(brandId) {
  const preset = BRAND_PRESETS.find(b => b.id === brandId);
  if (!preset) return;

  document.querySelectorAll('.brand-preset-chip').forEach(c => {
    c.classList.toggle('active', c.getAttribute('data-id') === brandId);
  });

  const titleInput = document.getElementById('prodTitleInput');
  const slugInput = document.getElementById('prodSlugInput');
  const logoInput = document.getElementById('prodLogoInput');
  const catSelect = document.getElementById('prodCategorySelect');
  const taglineInput = document.getElementById('prodTaglineInput');
  const badgeInput = document.getElementById('prodBadgeInput');

  if (logoInput) logoInput.value = preset.logo;
  if (catSelect) catSelect.value = String(preset.cat);
  if (badgeInput) badgeInput.value = preset.badge;
  if (taglineInput) taglineInput.value = preset.tagline;
  if (titleInput) {
    titleInput.value = preset.title;
    if (!studioSlugManuallyEdited && slugInput) {
      slugInput.value = generateSlug(preset.title);
    }
  }

  if (preset.presetType) {
    loadPlanPreset(preset.presetType);
  }

  syncLivePreview();
}

function handleTitleInput(val) {
  if (!studioSlugManuallyEdited) {
    const slugInput = document.getElementById('prodSlugInput');
    if (slugInput) slugInput.value = generateSlug(val);
  }
  syncLivePreview();
}

function handleSlugInput(val) {
  studioSlugManuallyEdited = Boolean(val && val.trim().length > 0);
  syncLivePreview();
}

function generateSlug(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function setBadge(val) {
  const input = document.getElementById('prodBadgeInput');
  if (input) {
    input.value = val;
    syncLivePreview();
  }
}

function setDelivery(val) {
  const input = document.getElementById('prodDeliveryInput');
  if (input) {
    input.value = val;
    syncLivePreview();
  }
}

function setWarranty(val) {
  const input = document.getElementById('prodWarrantyInput');
  if (input) {
    input.value = val;
    syncLivePreview();
  }
}

function toggleVaultPrestock(checked) {
  const fields = document.getElementById('vaultPrestockFields');
  if (fields) fields.style.display = checked ? 'block' : 'none';
  syncLivePreview();
}

function addPlanRow(planData = null) {
  studioPlanCounter++;
  const plan = planData || {
    id: `plan_${Date.now()}_${studioPlanCounter}`,
    name: '1 Month Private PIN Profile',
    tier: 'private',
    months: 1,
    label: '1 Month',
    bdt: 349,
    usd: 2.99,
    origBdt: 550,
    origUsd: 4.50,
    devices: '1 Device',
    popular: false,
    features: '4K Ultra HD • PIN Locked • 1 Screen'
  };

  studioPlans.push(plan);
  renderPlansList();
  syncLivePreview();
}

function removePlanRow(planId) {
  if (studioPlans.length <= 1) {
    showToast('A product must have at least one subscription plan.', 'error');
    return;
  }
  studioPlans = studioPlans.filter(p => p.id !== planId);
  renderPlansList();
  syncLivePreview();
}

function updatePlanField(planId, field, value) {
  const plan = studioPlans.find(p => p.id === planId);
  if (!plan) return;

  if (field === 'bdt') {
    const num = parseFloat(value) || 0;
    plan.bdt = num;
    plan.usd = parseFloat((num / 120).toFixed(2));
    if (!plan.origBdt || plan.origBdt <= plan.bdt) {
      plan.origBdt = Math.round(num * 1.35);
      plan.origUsd = parseFloat((plan.origBdt / 120).toFixed(2));
    }
  } else if (field === 'usd') {
    const num = parseFloat(value) || 0;
    plan.usd = num;
    plan.bdt = Math.round(num * 120);
    if (!plan.origUsd || plan.origUsd <= plan.usd) {
      plan.origUsd = parseFloat((num * 1.35).toFixed(2));
      plan.origBdt = Math.round(plan.origUsd * 120);
    }
  } else if (field === 'origBdt') {
    const num = parseFloat(value) || 0;
    plan.origBdt = num;
    plan.origUsd = parseFloat((num / 120).toFixed(2));
  } else if (field === 'origUsd') {
    const num = parseFloat(value) || 0;
    plan.origUsd = num;
    plan.origBdt = Math.round(num * 120);
  } else if (field === 'months') {
    plan.months = parseInt(value, 10) || 1;
  } else if (field === 'popular') {
    plan.popular = Boolean(value);
  } else {
    plan[field] = value;
  }

  const rowEl = document.getElementById(`plan_row_${planId}`);
  if (rowEl) {
    const bdtIn = rowEl.querySelector('.input-plan-bdt');
    const usdIn = rowEl.querySelector('.input-plan-usd');
    const origBdtIn = rowEl.querySelector('.input-plan-orig-bdt');
    const origUsdIn = rowEl.querySelector('.input-plan-orig-usd');
    if (bdtIn && field !== 'bdt') bdtIn.value = plan.bdt;
    if (usdIn && field !== 'usd') usdIn.value = plan.usd;
    if (origBdtIn && field !== 'origBdt') origBdtIn.value = plan.origBdt;
    if (origUsdIn && field !== 'origUsd') origUsdIn.value = plan.origUsd;
  }

  syncLivePreview();
}

function renderPlansList() {
  const container = document.getElementById('plansListContainer');
  const countBadge = document.getElementById('planCountBadge');
  if (!container) return;

  if (countBadge) countBadge.textContent = `${studioPlans.length} ${studioPlans.length === 1 ? 'Plan' : 'Plans'}`;

  container.innerHTML = studioPlans.map((p, idx) => `
    <div class="plan-item-card" id="plan_row_${p.id}">
      <div class="plan-item-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:0.75rem; font-weight:700; color:#94a3b8; background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:6px;">#${idx + 1}</span>
          <strong style="font-size:0.86rem; color:#f8fafc;">${p.name || 'Custom Plan'}</strong>
          ${p.popular ? '<span style="font-size:0.68rem; background:#8b5cf6; color:#fff; padding:1px 6px; border-radius:10px; font-weight:700;">POPULAR</span>' : ''}
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <label style="font-size:0.74rem; color:#cbd5e1; display:flex; align-items:center; gap:4px; cursor:pointer;">
            <input type="checkbox" ${p.popular ? 'checked' : ''} onchange="updatePlanField('${p.id}', 'popular', this.checked)">
            <span>Mark Popular</span>
          </label>
          <button type="button" onclick="removePlanRow('${p.id}')" style="background:none; border:none; color:#ef4444; font-size:0.85rem; cursor:pointer; padding:2px 6px;" title="Remove this plan">🗑️</button>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.4fr 0.9fr 0.9fr; gap:8px; margin-bottom:8px;">
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Plan Name</label>
          <input type="text" class="form-input" style="padding:6px 10px; font-size:0.8rem;" value="${p.name}" oninput="updatePlanField('${p.id}', 'name', this.value)">
        </div>
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Duration Months</label>
          <input type="number" min="0" max="60" class="form-input" style="padding:6px 10px; font-size:0.8rem;" value="${p.months}" oninput="updatePlanField('${p.id}', 'months', this.value)">
        </div>
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Duration Label</label>
          <input type="text" class="form-input" style="padding:6px 10px; font-size:0.8rem;" value="${p.label}" oninput="updatePlanField('${p.id}', 'label', this.value)">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:8px; margin-bottom:8px;">
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Tier Type</label>
          <select class="form-input" style="padding:6px 10px; font-size:0.8rem;" onchange="updatePlanField('${p.id}', 'tier', this.value)">
            <option value="private" ${p.tier === 'private' ? 'selected' : ''}>Private Profile (PIN locked)</option>
            <option value="shared" ${p.tier === 'shared' ? 'selected' : ''}>Shared Screen Access</option>
            <option value="family" ${p.tier === 'family' ? 'selected' : ''}>Full Account (Family/Private)</option>
            <option value="license" ${p.tier === 'license' ? 'selected' : ''}>License Key / Serial / Invite</option>
          </select>
        </div>
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Device / Screen Limit</label>
          <input type="text" class="form-input" style="padding:6px 10px; font-size:0.8rem;" value="${p.devices || '1 Device'}" oninput="updatePlanField('${p.id}', 'devices', this.value)">
        </div>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr 1fr 1fr; gap:8px;">
        <div>
          <label style="font-size:0.72rem; color:#34d399; font-weight:700;">Price (৳ BDT) *</label>
          <input type="number" step="1" class="form-input input-plan-bdt" style="padding:6px 10px; font-size:0.82rem; font-weight:700; color:#34d399;" value="${p.bdt}" oninput="updatePlanField('${p.id}', 'bdt', this.value)">
        </div>
        <div>
          <label style="font-size:0.72rem; color:#38bdf8; font-weight:700;">Price ($ USD) *</label>
          <input type="number" step="0.01" class="form-input input-plan-usd" style="padding:6px 10px; font-size:0.82rem; font-weight:700; color:#38bdf8;" value="${p.usd}" oninput="updatePlanField('${p.id}', 'usd', this.value)">
        </div>
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Original (৳ BDT)</label>
          <input type="number" step="1" class="form-input input-plan-orig-bdt" style="padding:6px 10px; font-size:0.82rem;" value="${p.origBdt || ''}" oninput="updatePlanField('${p.id}', 'origBdt', this.value)">
        </div>
        <div>
          <label style="font-size:0.72rem; color:#94a3b8;">Original ($ USD)</label>
          <input type="number" step="0.01" class="form-input input-plan-orig-usd" style="padding:6px 10px; font-size:0.82rem;" value="${p.origUsd || ''}" oninput="updatePlanField('${p.id}', 'origUsd', this.value)">
        </div>
      </div>
    </div>
  `).join('');
}

function loadPlanPreset(type) {
  studioPlans = [];
  if (type === 'streaming') {
    studioPlans = [
      { id: 'plan_1', name: '1 Month Private PIN Profile', tier: 'private', months: 1, label: '1 Month', bdt: 349, usd: 2.99, origBdt: 550, origUsd: 4.50, devices: '1 Screen (4K UHD)', popular: false, features: '4K Ultra HD • PIN Locked • 1 Screen' },
      { id: 'plan_2', name: '3 Months Private PIN Profile', tier: 'private', months: 3, label: '3 Months', bdt: 999, usd: 8.49, origBdt: 1650, origUsd: 13.99, devices: '1 Screen (4K UHD)', popular: true, features: '4K Ultra HD • PIN Locked • 3 Months Warranty' },
      { id: 'plan_3', name: '6 Months Private PIN Profile', tier: 'private', months: 6, label: '6 Months', bdt: 1899, usd: 15.99, origBdt: 3300, origUsd: 27.99, devices: '1 Screen (4K UHD)', popular: false, features: '4K Ultra HD • PIN Locked • 6 Months Warranty' },
      { id: 'plan_4', name: '12 Months Private PIN Profile', tier: 'private', months: 12, label: '1 Year', bdt: 3499, usd: 28.99, origBdt: 6600, origUsd: 54.99, devices: '1 Screen (4K UHD)', popular: false, features: 'Full 1-Year Ultra HD Access • Guaranteed Uptime' }
    ];
  } else if (type === 'ai') {
    studioPlans = [
      { id: 'plan_1', name: '1 Month Shared Screen Access', tier: 'shared', months: 1, label: '1 Mo Shared', bdt: 499, usd: 4.20, origBdt: 850, origUsd: 7.20, devices: '1 Device', popular: false, features: 'Shared Screen • Fast Processing • Instant Vault' },
      { id: 'plan_2', name: '1 Month Private Dedicated Account', tier: 'private', months: 1, label: '1 Mo Private', bdt: 2399, usd: 19.99, origBdt: 2900, origUsd: 24.50, devices: 'Your Email / Private', popular: true, features: 'Private Dedicated Account • Full Privacy • Max Rate Limits' },
      { id: 'plan_3', name: '1 Year Full Pro Membership', tier: 'private', months: 12, label: '1 Year Pro', bdt: 21999, usd: 184.99, origBdt: 29999, origUsd: 250.00, devices: 'Dedicated Account', popular: false, features: '12 Months Guaranteed Pro Access • Priority Support' }
    ];
  } else if (type === 'software') {
    studioPlans = [
      { id: 'plan_1', name: '1 Month Pro License', tier: 'license', months: 1, label: '1 Month', bdt: 299, usd: 2.50, origBdt: 499, origUsd: 4.20, devices: '1 Device', popular: false, features: 'Official License Key • 30 Days Access' },
      { id: 'plan_2', name: '1 Year Pro License Key', tier: 'license', months: 12, label: '1 Year', bdt: 1499, usd: 12.50, origBdt: 3500, origUsd: 29.50, devices: 'Multi-Device Support', popular: true, features: 'Full 1-Year License Key • Official Activation' },
      { id: 'plan_3', name: 'Lifetime Commercial License', tier: 'license', months: 0, label: 'Lifetime', bdt: 2999, usd: 24.99, origBdt: 6500, origUsd: 55.00, devices: 'Lifetime Validity', popular: false, features: 'One-Time Payment • Lifetime Valid Key & Updates' }
    ];
  }
  renderPlansList();
  syncLivePreview();
}

function syncLivePreview() {
  const title = (document.getElementById('prodTitleInput')?.value || 'Subscription Title').trim();
  const tagline = (document.getElementById('prodTaglineInput')?.value || '').trim();
  const logo = (document.getElementById('prodLogoInput')?.value || '/assets/brands/netflix.svg').trim();
  const badge = (document.getElementById('prodBadgeInput')?.value || 'Official Verified').trim();
  const delivery = (document.getElementById('prodDeliveryInput')?.value || '60s Instant Delivery').trim();
  const warranty = (document.getElementById('prodWarrantyInput')?.value || 'Full Duration Warranty').trim();
  const catSelect = document.getElementById('prodCategorySelect');
  const catText = catSelect && catSelect.selectedIndex >= 0 ? catSelect.options[catSelect.selectedIndex].text : 'OTT & Streaming';

  const prevImg = document.getElementById('prevCardImg');
  const prevBadge = document.getElementById('prevCardBadge');
  const prevDelivery = document.getElementById('prevCardDeliveryText');
  const prevCat = document.getElementById('prevCardCat');
  const prevTitle = document.getElementById('prevCardTitle');
  const prevTagline = document.getElementById('prevCardTagline');
  const prevTiers = document.getElementById('prevCardTiers');
  const prevOffer = document.getElementById('prevOfferPrice');
  const prevOrig = document.getElementById('prevOrigPrice');
  const prevDisc = document.getElementById('prevDiscountPill');
  const prevWarr = document.getElementById('prevWarrantyLabel');

  if (prevImg) prevImg.src = logo;
  if (prevBadge) {
    prevBadge.textContent = badge;
    const cleanBadgeClass = badge.toLowerCase().replace(/[^a-z0-9]/g, '');
    prevBadge.className = `badge-tag ${cleanBadgeClass || 'officialverified'}`;
  }
  if (prevDelivery) prevDelivery.textContent = delivery;
  if (prevCat) prevCat.textContent = catText;
  if (prevTitle) prevTitle.textContent = title;
  if (prevTagline) prevTagline.textContent = tagline;
  if (prevWarr) prevWarr.textContent = warranty.includes('Warranty') ? warranty : `${warranty} Warranty`;

  if (prevTiers) {
    if (studioPlans.length === 0) {
      prevTiers.innerHTML = '<span class="tier-chip active">1 Month</span>';
    } else {
      prevTiers.innerHTML = studioPlans.map((p, idx) => `
        <span class="tier-chip ${idx === 0 ? 'active' : ''}">${p.label || `${p.months} Mo`}</span>
      `).join('');
    }
  }

  let minBdt = Infinity;
  let minUsd = Infinity;
  let maxBdt = 0;
  let minOrigBdt = 0;

  if (studioPlans.length > 0) {
    for (const p of studioPlans) {
      const bdt = parseFloat(p.bdt) || 0;
      const usd = parseFloat(p.usd) || 0;
      if (bdt < minBdt) {
        minBdt = bdt;
        minUsd = usd;
        minOrigBdt = parseFloat(p.origBdt) || Math.round(bdt * 1.35);
      }
      if (bdt > maxBdt) maxBdt = bdt;
    }
  } else {
    minBdt = 349;
    minUsd = 2.99;
    maxBdt = 349;
    minOrigBdt = 550;
  }

  if (prevOffer) prevOffer.textContent = `৳ ${minBdt}`;
  if (prevOrig) {
    if (minOrigBdt > minBdt) {
      prevOrig.textContent = `৳ ${minOrigBdt}`;
      prevOrig.style.display = 'inline';
    } else {
      prevOrig.style.display = 'none';
    }
  }
  if (prevDisc) {
    if (minOrigBdt > minBdt) {
      const disc = Math.round(((minOrigBdt - minBdt) / minOrigBdt) * 100);
      prevDisc.textContent = `${disc}% OFF`;
      prevDisc.style.display = 'inline-block';
    } else {
      prevDisc.style.display = 'none';
    }
  }

  const metaBase = document.getElementById('metaBasePrice');
  const metaPlans = document.getElementById('metaPlanCount');
  const metaRange = document.getElementById('metaPriceRange');
  const metaVault = document.getElementById('metaVaultStatus');

  if (metaBase) metaBase.textContent = `৳ ${minBdt} ($${minUsd.toFixed(2)})`;
  if (metaPlans) metaPlans.textContent = `${studioPlans.length} ${studioPlans.length === 1 ? 'Plan' : 'Plans'} Configured`;
  if (metaRange) metaRange.textContent = minBdt === maxBdt ? `৳ ${minBdt}` : `৳ ${minBdt} – ৳ ${maxBdt}`;
  
  const vaultEnabled = document.getElementById('enableVaultPrestockToggle')?.checked;
  if (metaVault) {
    if (vaultEnabled) {
      metaVault.textContent = '1 Credential Ready for Vault';
      metaVault.style.color = '#34d399';
    } else {
      metaVault.textContent = 'None (Will Add Later)';
      metaVault.style.color = '#94a3b8';
    }
  }
}

function openAddProductModal() {
  const modal = document.getElementById('addProductModal');
  if (!modal) return;

  studioSlugManuallyEdited = false;
  renderBrandPresets();

  if (studioPlans.length === 0) {
    selectBrandPreset('netflix');
  } else {
    syncLivePreview();
  }

  modal.style.display = 'flex';
}

function closeAddProductModal() {
  const modal = document.getElementById('addProductModal');
  if (modal) modal.style.display = 'none';
}

async function handleCreateProduct(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = document.getElementById('submitProductBtn');

  if (studioPlans.length === 0) {
    showToast('Please add at least one subscription plan tier.', 'error');
    return;
  }

  const title = form.title.value.trim();
  const slug = form.slug.value.trim().toLowerCase();
  const categoryId = parseInt(form.category_id.value, 10);

  if (!title || !slug || !categoryId) {
    showToast('Please fill in Title, Slug, and Category.', 'error');
    return;
  }

  let minUsd = Infinity;
  let minBdt = Infinity;
  let minOrigUsd = 0;
  let minOrigBdt = 0;

  for (const p of studioPlans) {
    const usd = parseFloat(p.usd) || 0;
    const bdt = parseFloat(p.bdt) || 0;
    if (usd < minUsd) {
      minUsd = usd;
      minBdt = bdt;
      minOrigUsd = parseFloat(p.origUsd) || parseFloat((usd * 1.35).toFixed(2));
      minOrigBdt = parseFloat(p.origBdt) || Math.round(minOrigUsd * 120);
    }
  }

  const featuresText = document.getElementById('prodFeaturesInput')?.value || '';
  const featuresList = featuresText.split('\n').map(s => s.trim()).filter(Boolean);

  const payload = {
    category_id: categoryId,
    title,
    slug,
    tagline: (form.tagline?.value || '').trim(),
    description: (form.description?.value || '').trim(),
    logo_url: (form.logo_url?.value || '/assets/brands/netflix.svg').trim(),
    badge: (form.badge?.value || 'Official Verified').trim(),
    delivery_time: (form.delivery_time?.value || '60s Instant Delivery').trim(),
    warranty: (form.warranty?.value || 'Full Duration Warranty').trim(),
    stock_status: form.stock_status?.value || 'in_stock',
    base_price: minUsd,
    original_price: minOrigUsd,
    original_price_bdt: minOrigBdt,
    is_featured: Boolean(document.getElementById('prodIsFeatured')?.checked),
    is_trending: Boolean(document.getElementById('prodIsTrending')?.checked),
    is_bestseller: Boolean(document.getElementById('prodIsBestseller')?.checked),
    features_list: featuresList,
    instructions: (document.getElementById('prodInstructionsInput')?.value || '').trim(),
    plans: studioPlans.map(p => ({
      plan_name: p.name,
      tier_type: p.tier,
      duration_months: parseInt(p.months, 10) || 1,
      duration_label: p.label,
      price_usd: parseFloat(p.usd) || minUsd,
      price_bdt: parseFloat(p.bdt) || minBdt,
      original_price_usd: parseFloat(p.origUsd) || minOrigUsd,
      original_price_bdt: parseFloat(p.origBdt) || minOrigBdt,
      is_popular: Boolean(p.popular),
      device_limit: p.devices || '1 Device',
      plan_features: p.features || 'Full Premium Access'
    }))
  };

  const vaultToggle = document.getElementById('enableVaultPrestockToggle');
  if (vaultToggle && vaultToggle.checked) {
    const credType = document.getElementById('vaultCredType')?.value || 'profile_pin';
    const email = document.getElementById('vaultEmail')?.value.trim();
    const password = document.getElementById('vaultPassword')?.value.trim();
    const profilePin = document.getElementById('vaultProfilePin')?.value.trim();

    if (email || password || profilePin) {
      payload.initial_vault_item = {
        credential_type: credType,
        account_email: email,
        account_password: password,
        profile_pin: profilePin,
        special_instructions: payload.instructions
      };
    }
  }

  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span>⏳ Publishing Subscription...</span>';
  }

  try {
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('🎉 Subscription product published successfully!', 'success');
      closeAddProductModal();
      loadProductsList();
    } else {
      alert(`Error publishing subscription: ${json.message}`);
    }
  } catch (err) {
    console.error('Create product error:', err);
    showToast('Network error while publishing product', 'error');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>🚀 Publish Subscription to Catalog</span>';
    }
  }
}

// -----------------------------------------------------------------------------
// TAB 4: CREDENTIAL VAULT
// -----------------------------------------------------------------------------

async function loadVaultList() {
  if (!adminState.token) return;

  try {
    const res = await fetch('/api/admin/vault', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      adminState.vault = json.vault;
      renderAdminVault(json.vault);
      checkVaultLowStock(json.vault);
    }
  } catch (err) {
    console.error('Fetch vault error:', err);
  }
}

function checkVaultLowStock(vault) {
  const availableCount = vault.filter(v => !v.is_used).length;
  const alertBox = document.getElementById('vaultStockAlertBox');
  const alertText = document.getElementById('vaultStockAlertText');
  const navAlert = document.getElementById('navVaultAlert');

  if (availableCount < 5) {
    if (alertBox) alertBox.style.display = 'block';
    if (alertText) alertText.textContent = `Warning: Only ${availableCount} accounts/keys remaining in the vault. Restock now to maintain instant automated delivery.`;
    if (navAlert) {
      navAlert.style.background = 'rgba(239,68,68,0.2)';
      navAlert.style.color = '#f87171';
      navAlert.textContent = `${availableCount} Left`;
    }
  } else {
    if (alertBox) alertBox.style.display = 'none';
    if (navAlert) {
      navAlert.style.background = 'rgba(16,185,129,0.15)';
      navAlert.style.color = '#34d399';
      navAlert.textContent = `${availableCount} Ready`;
    }
  }
}

function filterVaultTable() {
  const filter = document.getElementById('vaultFilterStatus');
  const val = filter ? filter.value : 'all';
  const filtered = adminState.vault.filter(v => {
    if (val === 'available') return !v.is_used;
    if (val === 'assigned') return v.is_used;
    return true;
  });
  renderAdminVault(filtered);
}

function renderAdminVault(vault) {
  const tableBody = document.getElementById('adminVaultTableBody');
  if (!tableBody) return;

  if (vault.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#94a3b8;">No credentials stocked in vault yet.</td></tr>`;
    return;
  }

  tableBody.innerHTML = vault.map(v => `
    <tr>
      <td style="color:#94a3b8; font-family:monospace;">#${v.id}</td>
      <td><strong>${v.product_title}</strong></td>
      <td><span class="badge-pill">${v.credential_type}</span></td>
      <td><code style="color:#60a5fa;">${v.account_email || v.license_key || 'Direct Activation Link'}</code></td>
      <td>${v.account_password ? `<span style="font-family:monospace; color:#cbd5e1;" title="Password">${v.account_password}</span>` : '-'}</td>
      <td><strong style="color:#fbbf24;">${v.profile_pin || '-'}</strong></td>
      <td>
        <span class="badge-tag ${v.is_used ? 'hot' : 'bestseller'}" style="font-size:0.72rem;">
          ${v.is_used ? '● ASSIGNED' : '✓ AVAILABLE'}
        </span>
      </td>
      <td>
        <button onclick="deleteVaultItem(${v.id})" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" title="Remove Inventory Item">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

async function deleteVaultItem(vaultId) {
  if (!confirm(`Are you sure you want to remove vault inventory item #${vaultId}?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/vault/${vaultId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminState.token}`
      }
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Vault item removed', 'success');
      loadVaultInventory();
      loadAdminStats();
    } else {
      showToast(json.message || 'Failed to remove vault item', 'error');
    }
  } catch (err) {
    console.error('Delete vault item error:', err);
    showToast('Network error removing vault item', 'error');
  }
}

function populateVaultProductDropdown(products) {
  const select = document.getElementById('vaultProductSelect');
  if (!select) return;

  select.innerHTML = products.map(p => `
    <option value="${p.id}">${p.title}</option>
  `).join('');
}

function openAddVaultModal() {
  const modal = document.getElementById('addVaultModal');
  if (modal) modal.style.display = 'flex';
}

function closeAddVaultModal() {
  const modal = document.getElementById('addVaultModal');
  if (modal) modal.style.display = 'none';
}

async function handleAddVaultItem(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    product_id: parseInt(form.product_id.value, 10),
    credential_type: form.credential_type.value,
    account_email: form.account_email.value.trim() || null,
    account_password: form.account_password.value.trim() || null,
    profile_pin: form.profile_pin.value.trim() || null,
    special_instructions: form.special_instructions.value.trim() || null
  };

  try {
    const res = await fetch('/api/admin/vault', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Credential stocked into vault!');
      closeAddVaultModal();
      loadVaultList();
    } else {
      alert(`Error: ${json.message}`);
    }
  } catch (err) {
    console.error('Vault stocking error:', err);
  }
}

// -----------------------------------------------------------------------------
// TAB 5: CUSTOMER & VIP MANAGEMENT (BRAND NEW)
// -----------------------------------------------------------------------------

async function loadCustomersList() {
  if (!adminState.token) return;

  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      adminState.customers = json.users;
      renderCustomers(json.users);
      const navBadge = document.getElementById('navUsersCount');
      if (navBadge) navBadge.textContent = `${json.users.length}`;
    }
  } catch (err) {
    console.error('Fetch users error:', err);
  }
}

function filterCustomersTable() {
  const input = document.getElementById('customerSearchInput');
  const q = input ? input.value.trim().toLowerCase() : '';
  const filtered = adminState.customers.filter(u => 
    !q || 
    u.full_name.toLowerCase().includes(q) || 
    u.email.toLowerCase().includes(q) || 
    (u.phone && u.phone.includes(q))
  );
  renderCustomers(filtered);
}

function renderCustomers(users) {
  const tableBody = document.getElementById('adminCustomersTableBody');
  if (!tableBody) return;

  if (users.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:24px; color:#94a3b8;">No registered customers found.</td></tr>`;
    return;
  }

  tableBody.innerHTML = users.map(u => {
    const memberIdNum = (u.id || 1).toString().padStart(4, '0');
    const memberId = u.role === 'admin' ? `FLX-ADM-${memberIdNum}` : (u.is_vip ? `FLX-VIP-${memberIdNum}` : `FLX-${memberIdNum}`);
    const isVip = u.is_vip;
    const spentBDT = Math.round(Number(u.total_spent || 0) * 120);
    const cleanPhone = u.phone ? u.phone.replace(/\D/g, '') : '';

    return `
      <tr>
        <td><strong style="color:#60a5fa; font-family:monospace;">${memberId}</strong></td>
        <td>
          <div style="font-weight:700;">${u.full_name}</div>
          <div style="font-size:0.76rem; color:#94a3b8;">${u.email}</div>
        </td>
        <td>${u.phone || '<span style="color:#64748b;">Not set</span>'}</td>
        <td><strong style="font-size:0.95rem;">${u.order_count}</strong></td>
        <td><strong>৳${spentBDT.toLocaleString()}</strong></td>
        <td>
          <span class="badge-tag ${isVip ? 'bestseller' : 'hot'}" style="font-size:0.72rem;">
            ${u.role === 'admin' ? '👑 ADMIN PRO' : (isVip ? '★ VIP (5% OFF)' : 'STANDARD')}
          </span>
        </td>
        <td>
          <select onchange="updateUserRole(${u.id}, this.value)" style="background:var(--admin-bg-base); color:#ffffff; border:1px solid var(--admin-border); padding:4px 8px; border-radius:6px; font-size:0.75rem;">
            <option value="customer" ${u.role === 'customer' ? 'selected' : ''}>Customer</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin Master</option>
          </select>
        </td>
        <td>
          <div style="display:flex; gap:6px; align-items:center;">
            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(u.full_name)}%2C%20greetings%20from%20FlixStore%20Management!" target="_blank" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#10b981; border-color:rgba(16,185,129,0.3); text-decoration:none;">
                💬 WhatsApp
              </a>
            ` : '<span style="color:#64748b; font-size:0.75rem;">No WhatsApp</span>'}
            ${u.email !== 'admin@flixstore.com' ? `
              <button onclick="deleteCustomer(${u.id}, '${u.email}')" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" title="Remove Customer">
                🗑️
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteCustomer(userId, email) {
  if (!confirm(`Are you sure you want to remove user account (${email})?\n\nThis will remove their customer profile from the system.`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminState.token}`
      }
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Customer removed', 'success');
      loadCustomersList();
      loadAdminStats();
    } else {
      showToast(json.message || 'Failed to remove customer', 'error');
    }
  } catch (err) {
    console.error('Delete customer error:', err);
    showToast('Network error removing customer', 'error');
  }
}

async function updateUserRole(userId, newRole) {
  try {
    const res = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify({ role: newRole })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`User role updated to ${newRole}`);
      loadCustomersList();
    }
  } catch (err) {
    showToast('Failed to update role', true);
  }
}

// -----------------------------------------------------------------------------
// TAB 6: PROMO CODES
// -----------------------------------------------------------------------------

async function loadCouponsList() {
  if (!adminState.token) return;

  try {
    const res = await fetch('/api/admin/coupons', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      renderAdminCoupons(json.coupons);
    }
  } catch (err) {
    console.error('Fetch coupons error:', err);
  }
}

function renderAdminCoupons(coupons) {
  const tableBody = document.getElementById('adminCouponsTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = coupons.map(c => {
    const pct = Math.min(100, Math.round((c.used_count / Math.max(1, c.max_uses)) * 100));
    return `
      <tr>
        <td><strong style="color:#a855f7; font-family:monospace; font-size:0.95rem;">${c.code}</strong></td>
        <td><strong style="color:#34d399;">${c.discount_percent > 0 ? `${c.discount_percent}% OFF` : `$${c.discount_amount_usd} OFF`}</strong></td>
        <td>${c.min_spend_usd > 0 ? `$${c.min_spend_usd}` : 'No Minimum'}</td>
        <td style="min-width:180px;">
          <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:3px;">
            <span>${c.used_count} used</span>
            <span style="color:#94a3b8;">${c.max_uses} max</span>
          </div>
          <div style="height:5px; background:rgba(255,255,255,0.08); border-radius:3px; overflow:hidden;">
            <div style="width:${pct}%; height:100%; background:#a855f7;"></div>
          </div>
        </td>
        <td><span class="badge-tag ${c.is_active ? 'bestseller' : 'hot'}">${c.is_active ? 'ACTIVE' : 'EXPIRED'}</span></td>
        <td>
          <button onclick="deleteCoupon(${c.id}, '${c.code}')" class="btn-secondary" style="padding:4px 8px; font-size:0.74rem; color:#ef4444; border-color:rgba(239,68,68,0.3); background:rgba(239,68,68,0.06);" title="Delete Coupon">
            🗑️ Delete
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteCoupon(couponId, code) {
  if (!confirm(`Are you sure you want to permanently delete coupon code "${code}"?`)) {
    return;
  }

  try {
    const res = await fetch(`/api/admin/coupons/${couponId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminState.token}`
      }
    });
    const json = await res.json();
    if (json.success) {
      showToast(json.message || 'Coupon deleted successfully', 'success');
      loadCouponsList();
    } else {
      showToast(json.message || 'Failed to delete coupon', 'error');
    }
  } catch (err) {
    console.error('Delete coupon error:', err);
    showToast('Network error deleting coupon', 'error');
  }
}

function openAddCouponModal() {
  const modal = document.getElementById('addCouponModal');
  if (modal) modal.style.display = 'flex';
}

function closeAddCouponModal() {
  const modal = document.getElementById('addCouponModal');
  if (modal) modal.style.display = 'none';
}

async function handleCreateCoupon(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    code: form.code.value.trim().toUpperCase(),
    discount_percent: parseInt(form.discount_percent.value || 0, 10),
    discount_amount_usd: parseFloat(form.discount_amount_usd.value || 0),
    min_spend_usd: parseFloat(form.min_spend_usd.value || 0),
    max_uses: parseInt(form.max_uses.value || 1000, 10)
  };

  try {
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminState.token}`
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast('Coupon created!');
      closeAddCouponModal();
      loadCouponsList();
    } else {
      alert(`Error: ${json.message}`);
    }
  } catch (err) {
    console.error('Coupon creation error:', err);
  }
}

// -----------------------------------------------------------------------------
// TAB 7: NEON CLOUD & DEVELOPER DIAGNOSTICS
// -----------------------------------------------------------------------------

async function loadNeonCloudStats() {
  const curlPlaceholder = document.getElementById('curlTokenPlaceholder');
  if (curlPlaceholder && adminState.token) {
    curlPlaceholder.textContent = adminState.token;
  }
}

async function testNeonStorage() {
  const resultElem = document.getElementById('s3TestResult');
  if (resultElem) resultElem.textContent = 'Uploading test file to S3...';

  try {
    const res = await fetch('/api/neon/storage/test', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      if (resultElem) resultElem.innerHTML = `✓ Uploaded: <a href="${json.url}" target="_blank" style="color:#38bdf8;">${json.key}</a>`;
      showToast('S3 test successful!');
    } else {
      if (resultElem) resultElem.textContent = `✕ Failed: ${json.message}`;
    }
  } catch (err) {
    if (resultElem) resultElem.textContent = '✕ Network error testing S3';
  }
}

async function sendTestAdminEmail() {
  const input = document.getElementById('testEmailTarget');
  const resultElem = document.getElementById('smtpTestResult');
  const targetEmail = input ? input.value.trim() : 'mridhamahmod@gmail.com';

  if (resultElem) resultElem.textContent = `Dispatching test OTP to ${targetEmail}...`;

  try {
    const res = await fetch(`/api/admin/smtp/test-send?email=${encodeURIComponent(targetEmail)}`, {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      if (resultElem) resultElem.textContent = `✓ Dispatched! Code: ${json.otp || 'Sent'}`;
      showToast('Test email sent to inbox!');
    } else {
      if (resultElem) resultElem.textContent = `✕ ${json.message || 'SMTP delivery notice'}`;
    }
  } catch (err) {
    if (resultElem) resultElem.textContent = '✕ Error testing SMTP';
  }
}

// 1-Click Export JSON Full Backup
function triggerJsonExport() {
  fetch('/api/admin/database/backup-json', {
    headers: { 'Authorization': `Bearer ${adminState.token}` }
  })
  .then(response => response.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flixstore_full_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast('JSON Database backup downloaded!');
  })
  .catch(err => {
    alert('Failed to export JSON backup: ' + err.message);
  });
}

// 1-Click Download SQLite fallback
function triggerDatabaseDownload() {
  fetch('/api/admin/database/download', {
    headers: { 'Authorization': `Bearer ${adminState.token}` }
  })
  .then(res => {
    if (!res.ok) return res.json().then(j => { throw new Error(j.message); });
    return res.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flixstore.db`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    showToast('Database file downloaded!');
  })
  .catch(err => {
    alert(err.message || 'SQLite download notice');
  });
}

// Restore JSON Database
function handleRestoreFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm(`Restore database from "${file.name}"? This will sync customer records and orders.`)) {
    event.target.value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      const res = await fetch('/api/admin/database/restore-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminState.token}`
        },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Database restored successfully!');
        loadDashboardData();
      } else {
        alert('Restore failed: ' + data.message);
      }
    } catch (err) {
      alert('Failed to parse backup file: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}
