// =============================================================================
// FLIXSTORE PLATFORM: UDDOKTAPAY AUTOMATED GATEWAY SERVICE (API v2)
// Provides instant automated checkout, webhook IPN, and payment verification
// =============================================================================

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Default Sandbox Credentials (provided by official UddoktaPay documentation)
const DEFAULT_SANDBOX_KEY = '982d381360a69d419689740d9f2e26ce36fb7a50';
const DEFAULT_BASE_URL = 'https://sandbox.uddoktapay.com';

function getApiKey() {
  return (process.env.UDDOKTAPAY_API_KEY || DEFAULT_SANDBOX_KEY).trim();
}

function getBaseUrl() {
  const url = (process.env.UDDOKTAPAY_BASE_URL || DEFAULT_BASE_URL).trim();
  return url.replace(/\/+$/, '');
}

/**
 * Perform HTTPS/HTTP POST request to UddoktaPay API
 */
function makeApiRequest(endpointPath, payload) {
  return new Promise((resolve, reject) => {
    const baseUrl = getBaseUrl();
    const apiKey = getApiKey();
    const fullUrl = new URL(endpointPath, baseUrl);

    const postData = JSON.stringify(payload);
    const isHttps = fullUrl.protocol === 'https:';
    const client = isHttps ? https : http;

    const options = {
      method: 'POST',
      hostname: fullUrl.hostname,
      port: fullUrl.port || (isHttps ? 443 : 80),
      path: fullUrl.pathname + fullUrl.search,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'RT-UDDOKTAPAY-API-KEY': apiKey,
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'FlixStore-UddoktaPay-Gateway/2.0'
      },
      timeout: 15000
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, raw: data, error: 'INVALID_JSON_RESPONSE' });
        }
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('UddoktaPay API timeout after 15000ms'));
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Initialize UddoktaPay Checkout Session (checkout-v2)
 */
async function createCheckoutSession({ fullName, email, amount, metadata = {}, redirectUrl, cancelUrl, webhookUrl }) {
  try {
    const payload = {
      full_name: fullName || 'Subscriber',
      email: email,
      amount: String(amount),
      metadata: metadata,
      redirect_url: redirectUrl,
      return_type: 'GET',
      cancel_url: cancelUrl,
      webhook_url: webhookUrl
    };

    const res = await makeApiRequest('/api/checkout-v2', payload);

    if (res.statusCode === 200 && res.data && res.data.payment_url) {
      return {
        success: true,
        payment_url: res.data.payment_url,
        message: res.data.message || 'Payment session initialized'
      };
    }

    // In case API returns an error message
    const errMsg = (res.data && res.data.message) ? res.data.message : 'Failed to generate payment url';
    return {
      success: false,
      message: errMsg,
      debug: res
    };
  } catch (err) {
    console.error('UddoktaPay checkout-v2 error:', err.message);
    return {
      success: false,
      message: err.message
    };
  }
}

/**
 * Verify Payment Status with UddoktaPay (verify-payment)
 */
async function verifyPayment(invoiceId) {
  if (!invoiceId) {
    return { success: false, message: 'Missing invoice ID' };
  }

  try {
    const res = await makeApiRequest('/api/verify-payment', { invoice_id: invoiceId });

    if (res.statusCode === 200 && res.data) {
      // UddoktaPay format: { status: true, message: "Payment Verified Successfully", data: { status: "COMPLETED", ... } }
      // or { status: "COMPLETED", ... }
      const innerData = res.data.data || res.data;
      const isCompleted = (innerData.status === 'COMPLETED' || res.data.status === 'COMPLETED' || res.data.status === true);

      return {
        success: true,
        isCompleted,
        data: innerData,
        message: res.data.message || 'Payment verified'
      };
    }

    return {
      success: false,
      isCompleted: false,
      message: (res.data && res.data.message) || 'Verification returned unexpected response'
    };
  } catch (err) {
    console.error('UddoktaPay verify-payment error:', err.message);
    return {
      success: false,
      isCompleted: false,
      message: err.message
    };
  }
}

/**
 * Validate incoming Webhook IPN header
 */
function validateWebhookHeader(headerApiKey) {
  if (!headerApiKey) return false;
  const configuredKey = getApiKey();
  return headerApiKey.trim() === configuredKey;
}

module.exports = {
  getApiKey,
  getBaseUrl,
  createCheckoutSession,
  verifyPayment,
  validateWebhookHeader
};
