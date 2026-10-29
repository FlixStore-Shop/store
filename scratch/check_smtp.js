const https = require('https');

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

async function run() {
  console.log('Testing Admin Login on Render...');
  const loginRes = await post('https://store-q51q.onrender.com/api/auth/login', {
    email: 'admin@flixstore.com',
    password: 'adminflixstore2026!'
  }, { 'x-test-mode': 'true' });
  
  console.log('Login result:', loginRes.body);
  const otp = loginRes.body.demoOtp;
  
  console.log('Verifying OTP:', otp);
  const verifyRes = await post('https://store-q51q.onrender.com/api/auth/verify-otp', {
    email: 'admin@flixstore.com',
    otp: otp
  });
  console.log('Verify result:', verifyRes.body);
  const token = verifyRes.body.token;

  console.log('Checking SMTP status on Render...');
  const smtpRes = await get('https://store-q51q.onrender.com/api/admin/smtp/verify', {
    'Authorization': `Bearer ${token}`
  });
  console.log('SMTP status:', smtpRes.body);
}

run().catch(console.error);
