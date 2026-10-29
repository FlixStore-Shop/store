const https = require('https');

function get(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'GET',
      headers,
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

function post(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      },
      timeout: 10000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch (e) { resolve({ status: res.statusCode, body }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.write(postData);
    req.end();
  });
}

async function run() {
  // Login as admin
  const loginRes = await post('https://store-q51q.onrender.com/api/auth/login', {
    email: 'admin@flixstore.com',
    password: 'adminflixstore2026!'
  }, { 'x-test-mode': 'true' });
  
  const verifyRes = await post('https://store-q51q.onrender.com/api/auth/verify-otp', {
    email: 'admin@flixstore.com',
    otp: loginRes.body.demoOtp
  });
  const token = verifyRes.body.token;

  // Fetch users from admin endpoint
  const usersRes = await get('https://store-q51q.onrender.com/api/admin/users', {
    'Authorization': `Bearer ${token}`
  });
  console.log('Registered Users on Render:', usersRes.body);
}

run().catch(console.error);
