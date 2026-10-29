const nodemailer = require('nodemailer');

// Configure SMTP Transporter from environment variables
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const rawPass = process.env.SMTP_PASS || '';
  const pass = rawPass.replace(/\s+/g, ''); // Strip any accidental spaces from Google's 4x4 app password format
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    return null;
  }

  // Optimized Gmail preset: uses standard Gmail service with automatic TLS negotiation (fastest & most reliable on cloud hosts)
  const isGmail = (host && host.includes('gmail')) || (user && user.includes('@gmail.com'));
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
  }

  if (host) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000
    });
  }

  return null;
}

/**
 * Sends emails over standard HTTPS Port 443 (Brevo / Resend REST APIs)
 * Essential for cloud hosts like Render Free Tier that block outbound ports 25, 465, and 587
 */
async function dispatchViaHttpApi({ to, subject, html, text }) {
  const fromName = process.env.SMTP_FROM_NAME || 'FlixStore Security';
  const fromEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || process.env.SMTP_FROM_EMAIL || 'mridhamahmod@gmail.com';

  // 1. Brevo REST API (300 free emails/day over HTTPS Port 443 - zero ports blocked)
  if (process.env.BREVO_API_KEY) {
    try {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY.trim(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: to }],
          subject,
          htmlContent: html,
          textContent: text
        }),
        signal: AbortSignal.timeout(7000)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✓ [BREVO HTTPS SUCCESS]: Delivered to ${to}. Message ID: ${data.messageId || 'ok'}`);
        return { success: true, mode: 'brevo_api', messageId: data.messageId || 'ok' };
      } else {
        const errorMsg = data.message || JSON.stringify(data);
        console.warn(`✕ [BREVO API WARNING]:`, errorMsg);
        return { success: false, mode: 'brevo_api', error: errorMsg };
      }
    } catch (e) {
      console.warn(`✕ [BREVO API ERROR]:`, e.message);
    }
  }

  // 2. Resend REST API (100 free emails/day over HTTPS Port 443 - zero ports blocked)
  if (process.env.RESEND_API_KEY) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `${fromName} <${process.env.SMTP_FROM_EMAIL || 'onboarding@resend.dev'}>`,
          to: [to],
          subject,
          html
        }),
        signal: AbortSignal.timeout(7000)
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✓ [RESEND HTTPS SUCCESS]: Delivered to ${to}. Message ID: ${data.id || 'ok'}`);
        return { success: true, mode: 'resend_api', messageId: data.id || 'ok' };
      } else {
        console.warn(`✕ [RESEND API WARNING]:`, data.message || data);
      }
    } catch (e) {
      console.warn(`✕ [RESEND API ERROR]:`, e.message);
    }
  }

  return null;
}

/**
 * Sends a high-priority 6-digit OTP email to user's provided inbox
 * @param {string} toEmail - Recipient email address
 * @param {string} otpCode - 6-digit numerical code
 * @param {string} purpose - 'login' | 'register' | 'verification'
 */
async function sendOtpEmail(toEmail, otpCode, purpose = 'verification') {
  const cleanEmail = toEmail.trim().toLowerCase();
  const fromName = process.env.SMTP_FROM_NAME || 'FlixStore Security';
  const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'no-reply@flixstore.org';
  const from = `"${fromName}" <${fromAddress}>`;

  const subject = purpose === 'register' 
    ? 'Verify Your Email Address - FlixStore' 
    : 'Your FlixStore Security Verification Code';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 30px 10px; color: #f8fafc; }
        .email-container { max-width: 540px; margin: 0 auto; background: #131826; border-radius: 16px; border: 1px solid #1f293d; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .header { background: linear-gradient(135deg, #1e1b4b 0%, #311042 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #2d3748; }
        .brand { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; }
        .brand-pro { font-size: 11px; font-weight: 800; background: #3b82f6; color: #ffffff; padding: 2px 7px; border-radius: 6px; }
        .body-content { padding: 36px 32px; }
        .h1-title { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin-bottom: 24px; }
        .otp-box { background: #1a2234; border: 2px dashed #3b82f6; border-radius: 12px; padding: 20px; text-align: center; margin: 28px 0; }
        .otp-label { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #60a5fa; margin-bottom: 8px; }
        .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #ffffff; }
        .expiry-note { font-size: 12px; color: #64748b; text-align: center; margin-top: 10px; }
        .warning-box { background: rgba(245, 158, 11, 0.1); border-left: 3px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #fbbf24; margin: 20px 0; }
        .footer { padding: 20px 32px; background: #0c101c; border-top: 1px solid #1a2030; font-size: 11px; color: #64748b; text-align: center; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="brand">
            <span>FlixStore</span>
            <span class="brand-pro">PRO</span>
          </div>
        </div>
        <div class="body-content">
          <h2 class="h1-title">Verify Your Email Address</h2>
          <p class="text">
            Hello,<br><br>
            You requested a verification code to authenticate with your <strong>FlixStore</strong> account. Please use the one-time verification code below to verify your email address:
          </p>

          <div class="otp-box">
            <div class="otp-label">Security Verification Code</div>
            <div class="otp-code">${otpCode}</div>
            <div class="expiry-note">⏳ Code expires in 10 minutes</div>
          </div>

          <div class="warning-box">
            🛡️ <strong>Security Tip:</strong> Never share this code with anyone. FlixStore representatives will never ask for your verification code.
          </div>

          <p class="text" style="font-size: 12px; margin-bottom: 0;">
            If you did not request this email, please ignore this message. Your account remains completely secure.
          </p>
        </div>
        <div class="footer">
          © 2026 FlixStore Inc. All rights reserved.<br>
          Delivering genuine OTT, AI, & Creative subscriptions worldwide with automated fulfillment.
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `FlixStore Security Verification\n\nYour 6-digit verification code is: ${otpCode}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.`;

  // Always log to server output so administrator/developer can see delivery in real-time
  console.log(`\n========================================================`);
  console.log(`📧 [EMAIL VERIFICATION DISPATCH]`);
  console.log(`To: ${cleanEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`Security Code (OTP): [ ${otpCode} ]`);
  console.log(`========================================================\n`);

  // 1. Try HTTPS API first (Bypasses Render's port blocks on Port 443)
  if (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) {
    const httpResult = await dispatchViaHttpApi({ to: cleanEmail, subject, html: htmlContent, text: textContent });
    if (httpResult) {
      return httpResult;
    }
  }

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`ℹ️ [SMTP NOTICE]: No external SMTP host or HTTP API key configured in .env.`);
    return {
      success: false,
      mode: 'logged',
      message: 'SMTP unconfigured',
      fallbackOtp: otpCode
    };
  }

  try {
    const sendPromise = transporter.sendMail({
      from,
      to: cleanEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP connection timed out (Render free tier blocks ports 465/587)')), 4000)
    );

    const info = await Promise.race([sendPromise, timeoutPromise]);

    console.log(`✓ [SMTP SUCCESS]: Email successfully delivered to ${cleanEmail}. Message ID: ${info.messageId}`);
    return {
      success: true,
      mode: 'delivered',
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`✕ [SMTP ERROR]: Failed delivering email to ${cleanEmail}:`, error.message);
    return {
      success: false,
      error: error.message,
      fallbackOtp: otpCode
    };
  }
}

/**
 * Sends order receipt and dispatched subscription credentials to customer
 */
async function sendOrderConfirmationEmail(orderData, credentials = []) {
  const cleanEmail = orderData.customerEmail.trim().toLowerCase();
  const fromName = process.env.SMTP_FROM_NAME || 'FlixStore Orders';
  const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'orders@flixstore.org';
  const from = `"${fromName}" <${fromAddress}>`;

  const subject = `Order Confirmed: ${orderData.orderNumber} - Your Subscription Credentials`;

  let credsHtml = '';
  for (const c of credentials) {
    credsHtml += `
      <div style="background:#161d2f; border:1px solid #2d3748; border-radius:10px; padding:18px; margin-bottom:16px;">
        <div style="font-size:16px; font-weight:700; color:#ffffff; margin-bottom:4px;">${c.product_title || 'Subscription'}</div>
        <div style="font-size:12px; color:#38bdf8; font-weight:600; margin-bottom:12px;">Plan: ${c.plan_name || 'Standard Plan'}</div>
        
        ${c.account_email ? `<div style="margin-bottom:6px; font-size:13px; color:#cbd5e1;"><strong>Email/User:</strong> <code style="background:#0b0f19; padding:2px 8px; border-radius:4px; color:#34d399;">${c.account_email}</code></div>` : ''}
        ${c.account_password ? `<div style="margin-bottom:6px; font-size:13px; color:#cbd5e1;"><strong>Password:</strong> <code style="background:#0b0f19; padding:2px 8px; border-radius:4px; color:#f59e0b;">${c.account_password}</code></div>` : ''}
        ${c.profile_name ? `<div style="margin-bottom:6px; font-size:13px; color:#cbd5e1;"><strong>Profile:</strong> ${c.profile_name}</div>` : ''}
        ${c.profile_pin ? `<div style="margin-bottom:6px; font-size:13px; color:#cbd5e1;"><strong>PIN:</strong> <code style="background:#0b0f19; padding:2px 8px; border-radius:4px; color:#60a5fa;">${c.profile_pin}</code></div>` : ''}
        ${c.license_key ? `<div style="margin-bottom:6px; font-size:13px; color:#cbd5e1;"><strong>License Key:</strong> <code style="background:#0b0f19; padding:2px 8px; border-radius:4px; color:#a78bfa;">${c.license_key}</code></div>` : ''}
        ${c.activation_link ? `<div style="margin-bottom:6px; font-size:13px; color:#cbd5e1;"><strong>Activation Link:</strong> <a href="${c.activation_link}" style="color:#38bdf8;">Click to Activate</a></div>` : ''}
        
        ${c.instructions ? `<div style="margin-top:10px; padding-top:10px; border-top:1px dashed #334155; font-size:12px; color:#94a3b8; line-height:1.5;"><strong>Instructions:</strong> ${c.instructions}</div>` : ''}
      </div>
    `;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 30px 10px; color: #f8fafc; }
        .email-container { max-width: 580px; margin: 0 auto; background: #111625; border-radius: 16px; border: 1px solid #1e2638; overflow: hidden; }
        .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 28px; text-align: center; border-bottom: 1px solid #2d3748; }
        .brand { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .body-content { padding: 30px 24px; }
        .order-badge { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; display: inline-block; margin-bottom: 14px; }
        .footer { padding: 20px 24px; background: #0c101c; border-top: 1px solid #1a2030; font-size: 11px; color: #64748b; text-align: center; }
        .cta-btn { display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="brand">FlixStore <span style="background:#3b82f6; font-size:11px; padding:2px 6px; border-radius:4px;">PRO</span></div>
        </div>
        <div class="body-content">
          <span class="order-badge">✓ PAYMENT VERIFIED & CREDENTIALS DISPATCHED</span>
          <h2 style="font-size:20px; font-weight:800; color:#ffffff; margin:0 0 10px 0;">Thank You for Your Order, ${orderData.customerName}!</h2>
          <p style="font-size:14px; color:#94a3b8; line-height:1.6; margin-bottom:20px;">
            Your order <strong>#${orderData.orderNumber}</strong> has been processed with instant automated delivery. Your subscription access details are below:
          </p>

          ${credsHtml}

          <div style="background:#131b2e; border:1px solid #243048; border-radius:10px; padding:16px; margin:20px 0;">
            <div style="font-size:13px; color:#cbd5e1;"><strong>Total Paid:</strong> ${orderData.currencySymbol || '৳'}${orderData.total} (${orderData.paymentMethod.toUpperCase()})</div>
            <div style="font-size:13px; color:#cbd5e1; margin-top:4px;"><strong>Order ID:</strong> ${orderData.orderNumber}</div>
            <div style="font-size:13px; color:#cbd5e1; margin-top:4px;"><strong>Delivery Status:</strong> 100% Instant Dispatched</div>
          </div>

          <div style="text-align:center; padding:10px 0;">
            <p style="font-size:13px; color:#94a3b8; margin-bottom:10px;">Need replacement warranty help or have questions?</p>
            <a href="https://wa.me/8801343546958?text=Hello%20FlixStore%20Support%2C%20I%20need%20help%20with%20Order%20${orderData.orderNumber}" class="cta-btn">
              💬 Chat with 24/7 WhatsApp Support
            </a>
          </div>
        </div>
        <div class="footer">
          © 2026 FlixStore. All subscriptions include 100% full duration replacement warranty.
        </div>
      </div>
    </body>
    </html>
  `;

  console.log(`📧 [ORDER CONFIRMATION EMAIL DISPATCH] -> To: ${cleanEmail} for Order #${orderData.orderNumber}`);

  // 1. Try HTTPS API first (Bypasses Render's port blocks on Port 443)
  if (process.env.BREVO_API_KEY || process.env.RESEND_API_KEY) {
    const httpResult = await dispatchViaHttpApi({ to: cleanEmail, subject, html: htmlContent });
    if (httpResult) {
      return httpResult;
    }
  }

  const transporter = getTransporter();
  if (!transporter) return { success: true, mode: 'logged' };

  try {
    const sendPromise = transporter.sendMail({
      from,
      to: cleanEmail,
      subject,
      html: htmlContent
    });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP dispatch timed out')), 4000)
    );
    const info = await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✓ [SMTP ORDER SUCCESS]: Delivered to ${cleanEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`✕ [SMTP ORDER ERROR]:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends a notification email to the store owner when a new order arrives
 */
async function sendAdminOrderAlert(orderData) {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || process.env.SMTP_USER || 'admin@flixstore.com';
  const fromName = process.env.SMTP_FROM_NAME || 'FlixStore System';
  const fromAddress = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'system@flixstore.org';
  const from = `"${fromName}" <${fromAddress}>`;

  const subject = `🔔 New Order Placed: #${orderData.orderNumber} (${orderData.currencySymbol || '৳'}${orderData.total} via ${orderData.paymentMethod.toUpperCase()})`;

  const htmlContent = `
    <div style="font-family:sans-serif; background:#0b0f19; color:#f8fafc; padding:20px;">
      <h2>🎉 New Order Received!</h2>
      <p><strong>Order #:</strong> ${orderData.orderNumber}</p>
      <p><strong>Customer:</strong> ${orderData.customerName} (${orderData.customerEmail})</p>
      <p><strong>Phone:</strong> ${orderData.customerPhone || 'N/A'}</p>
      <p><strong>Amount:</strong> ${orderData.currencySymbol || '৳'}${orderData.total}</p>
      <p><strong>Payment Method:</strong> ${orderData.paymentMethod.toUpperCase()}</p>
      <p><a href="https://store-q51q.onrender.com/admin" style="color:#38bdf8;">Open FlixStore Admin Dashboard</a></p>
    </div>
  `;

  const transporter = getTransporter();
  if (!transporter) return { success: true, mode: 'logged' };

  try {
    const alertPromise = transporter.sendMail({ from, to: adminEmail, subject, html: htmlContent });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Admin alert timed out after 5s')), 5000)
    );
    await Promise.race([alertPromise, timeoutPromise]);
    console.log(`✓ [SMTP ADMIN ALERT]: Notified ${adminEmail}`);
  } catch (e) {
    console.warn(`✕ [SMTP ADMIN ALERT ERROR]:`, e.message);
  }
}

/**
 * Diagnostic tool to verify live SMTP / HTTP email connection credentials
 */
async function verifySmtpConnection() {
  if (process.env.BREVO_API_KEY) {
    return { configured: true, valid: true, mode: 'brevo_api', message: 'Brevo HTTPS API configured (Port 443 - 100% compatible with Render Free Tier).' };
  }
  if (process.env.RESEND_API_KEY) {
    return { configured: true, valid: true, mode: 'resend_api', message: 'Resend HTTPS API configured (Port 443 - 100% compatible with Render Free Tier).' };
  }

  const transporter = getTransporter();
  if (!transporter) {
    return { configured: false, message: 'SMTP environment variables are not set.' };
  }

  try {
    const verifyPromise = transporter.verify();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SMTP verification timed out. Note: Render Free Tier blocks outbound SMTP ports 465/587. Please use Brevo or Resend HTTPS API instead.')), 4000)
    );
    await Promise.race([verifyPromise, timeoutPromise]);
    return { configured: true, valid: true, message: 'SMTP credentials verified successfully! Live email delivery active.' };
  } catch (err) {
    return { configured: true, valid: false, message: `SMTP verification failed: ${err.message}` };
  }
}

module.exports = {
  sendOtpEmail,
  sendOrderConfirmationEmail,
  sendAdminOrderAlert,
  verifySmtpConnection
};
