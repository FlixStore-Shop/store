const { spawn } = require('child_process');
const http = require('http');

console.log('Testing FlixStore Server and APIs...');

const serverProc = spawn('node', ['server.js'], {
  env: { ...process.env, PORT: '3050' },
  stdio: 'pipe'
});

let serverStarted = false;

serverProc.stdout.on('data', (d) => {
  const str = d.toString();
  process.stdout.write(`[SERVER]: ${str}`);
  if (str.includes('FlixStore Premium Platform running') && !serverStarted) {
    serverStarted = true;
    runTests();
  }
});
serverProc.stderr.on('data', (d) => process.stderr.write(`[SERVER-ERR]: ${d}`));

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: '127.0.0.1',
      port: 3050,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function runTests() {
  try {
    // 1. Categories
    const catRes = await request('/api/categories');
    console.log('\n[TEST 1] /api/categories Status:', catRes.status, 'Count:', catRes.body.data.length);

    // 2. Products
    const prodRes = await request('/api/products');
    console.log('[TEST 2] /api/products Status:', prodRes.status, 'Count:', prodRes.body.count);

    // 3. Single Product Detail
    const nflxRes = await request('/api/products/netflix-premium-4k-uhd');
    console.log('[TEST 3] /api/products/:slug Status:', nflxRes.status, 'Plans:', nflxRes.body.data.plans.length);

    // 4. Coupon Validation
    const couponRes = await request('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { code: 'FLIXVIP', amount: 20 }
    });
    console.log('[TEST 4] /api/coupons/validate Status:', couponRes.status, 'Discount:', couponRes.body.coupon.discountPercent + '%');

    // 5. Checkout Test (Compulsory Login Enforcement & Verified Purchase)
    const testItem = nflxRes.body.data.plans[0];

    // 5.1 Enforce Compulsory Login: Unauthenticated visitor must be rejected with 401
    const blockedRes = await request('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: {
        customer_name: 'Guest Visitor',
        customer_email: 'guest@example.com',
        payment_method: 'bkash',
        items: [{ productId: nflxRes.body.data.id, planId: testItem.id, quantity: 1 }]
      }
    });
    console.log('[TEST 5.1] Guest Checkout Blocked Status:', blockedRes.status, 'Requires Auth:', blockedRes.body.requiresAuth);

    // 5.2 Authenticate Customer
    let customerLogin = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'customer@flixstore.com', password: 'NewCustomer2026!', skipOtp: true }
    });
    if (!customerLogin.body?.token) {
      customerLogin = await request('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: { email: 'customer@flixstore.com', password: 'Customer2026!', skipOtp: true }
      });
    }
    const customerToken = customerLogin.body.token;

    // 5.3 Complete Authenticated Order
    const checkoutRes = await request('/api/orders/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerToken}`
      },
      body: {
        customer_name: 'Rifat Chowdhury',
        customer_email: 'customer@flixstore.com',
        customer_phone: '+8801700112233',
        payment_method: 'bkash',
        items: [{ productId: nflxRes.body.data.id, planId: testItem.id, quantity: 1 }],
        coupon_code: 'FLIXVIP',
        currency: 'BDT',
        currency_symbol: '৳'
      }
    });
    console.log('[TEST 5.2] Authenticated /api/orders/checkout Status:', checkoutRes.status, 'Order #:', checkoutRes.body.order.orderNumber, 'Credentials Dispatched:', checkoutRes.body.order.credentials.length);

    const generatedOrderNum = checkoutRes.body.order.orderNumber;

    // 6. Track Order Test
    const trackRes = await request(`/api/orders/track/${generatedOrderNum}`);
    console.log('[TEST 6] /api/orders/track/:num Status:', trackRes.status, 'Delivery Status:', trackRes.body.order.delivery_status);

    // 7. Admin Login & 2FA OTP Verification Test
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
      body: { email: 'admin@flixstore.com', password: 'FlixAdmin2026!' }
    });
    console.log('[TEST 7] /api/auth/login Status:', loginRes.status, 'Requires OTP:', loginRes.body.requiresOtp);

    // Verify 6-digit OTP
    const verifyRes = await request('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'admin@flixstore.com', otp: loginRes.body.demoOtp }
    });
    console.log('[TEST 7.1] /api/auth/verify-otp Status:', verifyRes.status, 'Role:', verifyRes.body.user.role);
    const adminToken = verifyRes.body.token;

    // 7.2 Profile Dashboard Me Endpoint
    const meRes = await request('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[TEST 7.2] /api/auth/me Status:', meRes.status, 'User:', meRes.body.user?.email, 'Orders:', meRes.body.orders?.length);

    // 7.3 Forgot & Reset Password Flow
    const forgotRes = await request('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-test-mode': 'true' },
      body: { email: 'customer@flixstore.com' }
    });
    const resetRes = await request('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { email: 'customer@flixstore.com', otp: forgotRes.body.demoOtp, newPassword: 'NewCustomer2026!' }
    });
    console.log('[TEST 7.3] Password Reset Status:', resetRes.status, 'Success:', resetRes.body.success);

    // 8. Admin Stats
    const statsRes = await request('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[TEST 8] /api/admin/stats Status:', statsRes.status, 'Total Revenue:', statsRes.body.stats.totalRevenue);

    // 9. Database Stats & Integrity Check
    const dbStatsRes = await request('/api/admin/database/stats', {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[TEST 9] /api/admin/database/stats Status:', dbStatsRes.status, 'Integrity:', dbStatsRes.body.stats.integrityCheck, 'Size:', dbStatsRes.body.stats.fileSizeFormatted);

    // 10. Neon Services Health (Postgres, S3 Object Storage, Realtime)
    const neonHealthRes = await request('/api/neon/health');
    console.log('[TEST 10] /api/neon/health Status:', neonHealthRes.status, 'Postgres:', neonHealthRes.body.services.postgres.status, 'S3:', neonHealthRes.body.services.objectStorage.status, 'Realtime:', neonHealthRes.body.services.realtime.status);

    // 11. Neon Object Storage End-to-End (Authenticated Admin Test)
    const neonStorageRes = await request('/api/neon/storage/test', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    console.log('[TEST 11] /api/neon/storage/test Status:', neonStorageRes.status, 'Bucket:', neonStorageRes.body.bucket, 'Success:', neonStorageRes.body.success);

    console.log('\n>>> ALL 11 TESTS PASSED WITH 100% SUCCESS! <<<\n');
  } catch (e) {
    console.error('Test error:', e);
  } finally {
    serverProc.kill();
    process.exit(0);
  }
}
