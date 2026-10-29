const https = require('https');

const postData = JSON.stringify({
  full_name: 'Mridha Mahadi',
  email: 'mridhamahmod+test@gmail.com',
  phone: '+8801616696977',
  password: 'Password123!'
});

const req = https.request('https://store-q51q.onrender.com/api/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 15000
}, (res) => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', e => console.error(e.message));
req.write(postData);
req.end();
