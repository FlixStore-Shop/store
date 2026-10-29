/**
 * FlixStore - Admin Portal & Database Handover System
 * Complete control center for inventory, orders, credential vault & database backups
 */

const adminState = {
  token: localStorage.getItem('flix_admin_token') || localStorage.getItem('flix_token') || null,
  user: JSON.parse(localStorage.getItem('flix_user') || 'null'),
  currentTab: 'overview',
  stats: null,
  orders: [],
  products: [],
  vault: [],
  coupons: []
};

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  initAdminTabs();
});

// Check if user is logged in as admin
function checkAdminAuth() {
  if (!adminState.token || !adminState.user || adminState.user.role !== 'admin') {
    showAdminLoginModal();
  } else {
    hideAdminLoginModal();
    loadDashboardData();
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

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailInput.value, password: passInput.value })
    });
    const json = await res.json();

    if (json.success) {
      if (json.user.role !== 'admin') {
        if (errElem) errElem.textContent = 'Access denied: Admin role required.';
        return;
      }

      adminState.user = json.user;
      adminState.token = json.token;
      localStorage.setItem('flix_token', json.token);
      localStorage.setItem('flix_admin_token', json.token);
      localStorage.setItem('flix_user', JSON.stringify(json.user));

      hideAdminLoginModal();
      loadDashboardData();
    } else {
      if (errElem) errElem.textContent = json.message;
    }
  } catch (err) {
    console.error('Admin login error:', err);
  }
}

function adminLogout() {
  localStorage.removeItem('flix_admin_token');
  localStorage.removeItem('flix_token');
  localStorage.removeItem('flix_user');
  window.location.reload();
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
  if (tabName === 'coupons') loadCouponsList();
  if (tabName === 'database') loadDatabaseStats();
}

// -----------------------------------------------------------------------------
// OVERVIEW & KPI STATS
// -----------------------------------------------------------------------------

async function loadDashboardData() {
  loadOverviewStats();
  loadDatabaseStats();
}

async function loadOverviewStats() {
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
  document.getElementById('statTotalRevenue').textContent = `৳${Math.round(stats.totalRevenue * 120).toLocaleString()}`;
  document.getElementById('statTotalOrders').textContent = stats.totalOrders.toLocaleString();
  document.getElementById('statActiveProducts').textContent = stats.activeProducts;
  document.getElementById('statAvailableVault').textContent = stats.availableVaultKeys;
}

function renderRecentOrders(orders) {
  const tableBody = document.getElementById('recentOrdersTableBody');
  if (!tableBody) return;

  if (!orders || orders.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:20px;">No recent orders</td></tr>`;
    return;
  }

  tableBody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.order_number}</strong></td>
      <td>${o.customer_name}<br><small style="color:var(--text-muted);">${o.customer_email}</small></td>
      <td>${o.currency_symbol || '৳'}${Math.round(o.total_amount * (o.currency === 'USD' ? 120 : 1)).toLocaleString()}</td>
      <td><span class="badge-pill" style="text-transform:uppercase;">${o.payment_method}</span></td>
      <td>
        <span class="badge-tag ${o.delivery_status === 'delivered' ? 'bestseller' : 'hot'}">
          ${o.delivery_status}
        </span>
      </td>
      <td>
        <button class="action-btn" onclick="viewOrderCredentials('${encodeURIComponent(o.delivered_credentials)}')">View Credentials</button>
      </td>
    </tr>
  `).join('');
}

function renderCategorySales(catStats) {
  const container = document.getElementById('categorySalesStats');
  if (!container || !catStats) return;

  container.innerHTML = catStats.map(c => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--glass-border);">
      <span>${c.name}</span>
      <strong>৳${Math.round((c.category_revenue || 0) * 120).toLocaleString()} (${c.items_sold} sold)</strong>
    </div>
  `).join('');
}

// -----------------------------------------------------------------------------
// ORDERS MANAGEMENT
// -----------------------------------------------------------------------------

async function loadOrdersList() {
  try {
    const res = await fetch('/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();

    if (json.success) {
      adminState.orders = json.orders;
      renderAllOrders(json.orders);
    }
  } catch (err) {
    console.error('Error fetching orders:', err);
  }
}

function renderAllOrders(orders) {
  const tableBody = document.getElementById('allOrdersTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = orders.map(o => `
    <tr>
      <td><strong>${o.order_number}</strong></td>
      <td>${o.customer_name}<br><small style="color:var(--text-muted);">${o.customer_email} • ${o.customer_phone || 'No phone'}</small></td>
      <td>${o.currency_symbol || '৳'}${Math.round(o.total_amount * (o.currency === 'USD' ? 120 : 1)).toLocaleString()}</td>
      <td>${o.payment_method.toUpperCase()} (${o.transaction_id || 'N/A'})</td>
      <td>
        <select onchange="updateOrderStatus(${o.id}, this.value)" style="background:var(--bg-tertiary); color:var(--text-primary); border:1px solid var(--glass-border); padding:4px 8px; border-radius:6px;">
          <option value="delivered" ${o.delivery_status === 'delivered' ? 'selected' : ''}>Delivered</option>
          <option value="processing" ${o.delivery_status === 'processing' ? 'selected' : ''}>Processing</option>
          <option value="pending" ${o.delivery_status === 'pending' ? 'selected' : ''}>Pending</option>
        </select>
      </td>
      <td>${new Date(o.created_at).toLocaleDateString()}</td>
      <td>
        <button class="action-btn" onclick="viewOrderCredentials('${encodeURIComponent(o.delivered_credentials)}')">Credentials</button>
      </td>
    </tr>
  `).join('');
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
      alert('Order status updated!');
    }
  } catch (err) {
    console.error('Status update error:', err);
  }
}

function viewOrderCredentials(encodedJson) {
  try {
    const decoded = decodeURIComponent(encodedJson);
    const creds = JSON.parse(decoded || '[]');

    const modal = document.getElementById('credentialsViewerModal');
    const container = document.getElementById('credentialsViewerBody');
    if (!modal || !container) return;

    if (creds.length === 0) {
      container.innerHTML = '<p>No specific credentials assigned to this order.</p>';
    } else {
      container.innerHTML = creds.map(c => `
        <div style="background:var(--bg-tertiary); padding:16px; border-radius:8px; margin-bottom:12px; font-family:monospace;">
          <div style="font-weight:700; color:#60a5fa; margin-bottom:6px;">${c.product_title} (${c.plan_name})</div>
          ${c.account_email ? `<div>Email: <strong>${c.account_email}</strong></div>` : ''}
          ${c.account_password ? `<div>Password: <strong>${c.account_password}</strong></div>` : ''}
          ${c.profile_pin ? `<div>Profile: ${c.profile_name || 'VIP'} (PIN: ${c.profile_pin})</div>` : ''}
          ${c.license_key ? `<div>License: <strong>${c.license_key}</strong></div>` : ''}
          ${c.activation_link ? `<div style="margin-top:6px;"><a href="${c.activation_link}" target="_blank" style="color:#38bdf8;">Activation Link</a></div>` : ''}
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:6px;">Instructions: ${c.instructions}</div>
        </div>
      `).join('');
    }

    modal.style.display = 'flex';
  } catch (err) {
    alert('Failed to parse credentials');
  }
}

function closeCredentialsViewer() {
  const modal = document.getElementById('credentialsViewerModal');
  if (modal) modal.style.display = 'none';
}

// -----------------------------------------------------------------------------
// PRODUCTS MANAGEMENT
// -----------------------------------------------------------------------------

async function loadProductsList() {
  try {
    const res = await fetch('/api/admin/products', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      adminState.products = json.products;
      renderAdminProducts(json.products);
    }
  } catch (err) {
    console.error('Fetch products error:', err);
  }
}

function renderAdminProducts(products) {
  const tableBody = document.getElementById('adminProductsTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = products.map(p => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="${p.logo_url}" style="width:36px; height:36px; border-radius:6px; object-fit:cover;">
          <div>
            <strong>${p.title}</strong><br>
            <small style="color:var(--text-muted);">${p.slug}</small>
          </div>
        </div>
      </td>
      <td>${p.category_name}</td>
      <td>$${Number(p.base_price || 0).toFixed(2)}</td>
      <td><span class="badge-tag bestseller">${p.badge || 'Active'}</span></td>
      <td>${Number(p.rating || 5.0).toFixed(1)} ★ (${p.review_count || 0})</td>
    </tr>
  `).join('');
}

function openAddProductModal() {
  const modal = document.getElementById('addProductModal');
  if (modal) modal.style.display = 'flex';
}

function closeAddProductModal() {
  const modal = document.getElementById('addProductModal');
  if (modal) modal.style.display = 'none';
}

async function handleCreateProduct(e) {
  e.preventDefault();
  const form = e.target;
  const payload = {
    category_id: parseInt(form.category_id.value, 10),
    title: form.title.value.trim(),
    slug: form.slug.value.trim().toLowerCase(),
    tagline: form.tagline.value.trim(),
    description: form.description.value.trim(),
    logo_url: form.logo_url.value.trim(),
    badge: form.badge.value.trim(),
    base_price: parseFloat(form.base_price.value),
    original_price: parseFloat(form.original_price.value || form.base_price.value * 1.5),
    plans: [
      { name: '1 Month Standard', tier: 'private', months: 1, label: '1 Month', usd: parseFloat(form.base_price.value), bdt: parseFloat(form.base_price.value) * 120 }
    ]
  };

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
      alert('Product created successfully!');
      closeAddProductModal();
      loadProductsList();
    } else {
      alert(`Error: ${json.message}`);
    }
  } catch (err) {
    console.error('Create product error:', err);
  }
}

// -----------------------------------------------------------------------------
// CREDENTIAL VAULT MANAGEMENT
// -----------------------------------------------------------------------------

async function loadVaultList() {
  try {
    const res = await fetch('/api/admin/vault', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();
    if (json.success) {
      adminState.vault = json.vault;
      renderAdminVault(json.vault);
    }
  } catch (err) {
    console.error('Fetch vault error:', err);
  }
}

function renderAdminVault(vault) {
  const tableBody = document.getElementById('adminVaultTableBody');
  if (!tableBody) return;

  tableBody.innerHTML = vault.map(v => `
    <tr>
      <td>${v.id}</td>
      <td><strong>${v.product_title}</strong></td>
      <td><span class="badge-pill">${v.credential_type}</span></td>
      <td>${v.account_email || v.license_key || 'Direct Link'}</td>
      <td>${v.account_password ? '••••••••' : '-'}</td>
      <td>${v.profile_pin || '-'}</td>
      <td>
        <span class="badge-tag ${v.is_used ? 'hot' : 'bestseller'}">
          ${v.is_used ? 'ASSIGNED' : 'AVAILABLE'}
        </span>
      </td>
    </tr>
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
    profile_name: form.profile_name.value.trim() || null,
    profile_pin: form.profile_pin.value.trim() || null,
    license_key: form.license_key.value.trim() || null,
    activation_link: form.activation_link.value.trim() || null,
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
      alert('Credential stocked into vault!');
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
// COUPONS MANAGEMENT
// -----------------------------------------------------------------------------

async function loadCouponsList() {
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

  tableBody.innerHTML = coupons.map(c => `
    <tr>
      <td><strong>${c.code}</strong></td>
      <td>${c.discount_percent > 0 ? `${c.discount_percent}%` : `$${c.discount_amount_usd}`}</td>
      <td>${c.min_spend_usd > 0 ? `$${c.min_spend_usd}` : 'None'}</td>
      <td>${c.used_count} / ${c.max_uses}</td>
      <td><span class="badge-tag ${c.is_active ? 'bestseller' : 'hot'}">${c.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
    </tr>
  `).join('');
}

// -----------------------------------------------------------------------------
// DATABASE HANDOVER & BACKUP CENTER (EXPLICIT USER REQUIREMENT)
// -----------------------------------------------------------------------------

async function loadDatabaseStats() {
  try {
    const res = await fetch('/api/admin/database/stats', {
      headers: { 'Authorization': `Bearer ${adminState.token}` }
    });
    const json = await res.json();

    if (json.success) {
      const s = json.stats;
      document.getElementById('dbFilePath').textContent = s.filePath;
      document.getElementById('dbFileSize').textContent = s.fileSizeFormatted;
      document.getElementById('dbIntegrity').textContent = s.integrityCheck.toUpperCase();
      document.getElementById('dbLastModified').textContent = new Date(s.lastModified).toLocaleString();

      const counts = s.tableRecordCounts;
      document.getElementById('dbTableCounts').innerHTML = `
        <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-top:10px;">
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">Products: <strong>${counts.products}</strong></div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">Plan Tiers: <strong>${counts.product_plans}</strong></div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">Orders: <strong>${counts.orders}</strong></div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">Vault Keys: <strong>${counts.vault_keys}</strong></div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">Reviews: <strong>${counts.reviews}</strong></div>
          <div style="background:var(--bg-tertiary); padding:10px; border-radius:8px;">Users: <strong>${counts.users}</strong></div>
        </div>
      `;
    }
  } catch (err) {
    console.error('Database stats error:', err);
  }
}

// 1-Click Download flixstore.db SQLite file
function triggerDatabaseDownload() {
  const downloadUrl = `/api/admin/database/download`;
  // Create authorized download fetch or direct anchor
  fetch(downloadUrl, {
    headers: { 'Authorization': `Bearer ${adminState.token}` }
  })
  .then(response => {
    if (!response.ok) throw new Error('Download failed');
    return response.blob();
  })
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flixstore_database_backup_${new Date().toISOString().slice(0, 10)}.db`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    alert('FlixStore Database (flixstore.db) downloaded successfully!');
  })
  .catch(err => {
    alert('Failed to download database: ' + err.message);
  });
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
    alert('Full JSON Database export downloaded successfully!');
  })
  .catch(err => {
    alert('Failed to export JSON backup: ' + err.message);
  });
}

// 1-Click Restore JSON Full Backup
function handleRestoreFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!confirm(`Are you sure you want to restore the SQLite database from "${file.name}"? This will sync customer orders and accounts.`)) {
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
        alert('🎉 ' + data.message);
        loadDashboardStats();
        loadDatabaseStats();
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
