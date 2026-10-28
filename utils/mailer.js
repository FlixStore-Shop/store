const nodemailer = require('nodemailer');

// Configure SMTP Transporter from environment variables
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return null;
}

const transporter = createTransporter();

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

  if (!transporter) {
    console.log(`ℹ️ [SMTP NOTICE]: No external SMTP host configured yet in .env.`);
    console.log(`To send live emails to real inboxes, configure SMTP_HOST, SMTP_USER, SMTP_PASS in your .env file.`);
    return {
      success: true,
      mode: 'logged',
      message: 'Email dispatched (SMTP unconfigured, logged to server console)'
    };
  }

  try {
    const info = await transporter.sendMail({
      from,
      to: cleanEmail,
      subject,
      text: textContent,
      html: htmlContent
    });

    console.log(`✓ [SMTP SUCCESS]: Email successfully delivered to ${cleanEmail}. Message ID: ${info.messageId}`);
    return {
      success: true,
      mode: 'delivered',
      messageId: info.messageId
    };
  } catch (error) {
    console.error(`✕ [SMTP ERROR]: Failed delivering email to ${cleanEmail}:`, error.message);
    // Return gracefully so user experience doesn't break even if SMTP provider rejects
    return {
      success: false,
      error: error.message,
      fallbackOtp: otpCode
    };
  }
}

module.exports = {
  sendOtpEmail
};
