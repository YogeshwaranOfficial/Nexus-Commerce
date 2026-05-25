import nodemailer from 'nodemailer';
import { logger } from '../config/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #13131a; border: 1px solid #1e1e2e; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); padding: 40px; text-align: center; }
    .logo { font-size: 28px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .logo span { color: rgba(255,255,255,0.7); }
    .body { padding: 40px; }
    h1 { color: #f1f1f9; font-size: 24px; font-weight: 700; margin-bottom: 16px; }
    p { color: #9999b3; font-size: 15px; line-height: 1.7; margin-bottom: 16px; }
    .highlight { color: #f1f1f9; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff !important; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 8px 0; }
    .otp-box { background: #0a0a0f; border: 1px solid #2a2a3e; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 48px; font-weight: 800; color: #8b5cf6; letter-spacing: 12px; font-family: monospace; }
    .divider { border: none; border-top: 1px solid #1e1e2e; margin: 24px 0; }
    .footer { padding: 24px 40px; text-align: center; }
    .footer p { color: #555570; font-size: 13px; margin: 0; }
    .order-item { display: flex; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid #1e1e2e; }
    .item-info { flex: 1; }
    .item-name { color: #f1f1f9; font-size: 14px; font-weight: 500; }
    .item-meta { color: #9999b3; font-size: 13px; margin-top: 2px; }
    .item-price { color: #8b5cf6; font-weight: 600; font-size: 15px; }
    .total-row { display: flex; justify-content: space-between; padding: 6px 0; }
    .total-row .label { color: #9999b3; }
    .total-row .value { color: #f1f1f9; font-weight: 500; }
    .total-final { color: #8b5cf6 !important; font-size: 18px; font-weight: 700; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo">NEXUS<span>.</span></div>
      </div>
      <div class="body">${content}</div>
      <hr class="divider">
      <div class="footer">
        <p>© ${new Date().getFullYear()} Nexus Commerce. All rights reserved.</p>
        <p style="margin-top:8px">You're receiving this because you have an account with Nexus.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

async function send(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    logger.error('Email send failed:', err);
  }
}

export const EmailService = {
  async sendWelcome(email: string, name: string) {
    const html = baseTemplate(`
      <h1>Welcome to Nexus, ${name}! 🎉</h1>
      <p>You've successfully joined the future of shopping. Discover thousands of premium products from verified sellers.</p>
      <a href="${process.env.FRONTEND_URL}/products" class="btn">Start Shopping →</a>
    `);
    await send(email, 'Welcome to Nexus Commerce!', html);
  },

  async sendOTP(email: string, name: string, otp: string, purpose: string) {
    const purposes: Record<string, string> = {
      'email-verify': 'Verify Your Email',
      'password-reset': 'Reset Your Password',
      login: 'Login Verification',
    };
    const html = baseTemplate(`
      <h1>${purposes[purpose] || 'Verification Code'}</h1>
      <p>Hi <span class="highlight">${name}</span>, use the code below to ${purpose === 'email-verify' ? 'verify your email' : 'complete your request'}.</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="margin-top:12px;margin-bottom:0;font-size:13px">Valid for <strong style="color:#f1f1f9">10 minutes</strong></p>
      </div>
      <p>If you didn't request this, please ignore this email or contact support.</p>
    `);
    await send(email, `Your Nexus OTP: ${otp}`, html);
  },

  async sendPasswordReset(email: string, name: string, resetUrl: string) {
    const html = baseTemplate(`
      <h1>Reset Your Password</h1>
      <p>Hi <span class="highlight">${name}</span>, we received a request to reset your password. Click the button below to proceed.</p>
      <a href="${resetUrl}" class="btn">Reset Password →</a>
      <p style="margin-top:24px;font-size:13px">This link expires in <strong style="color:#f1f1f9">1 hour</strong>. If you didn't request this, ignore this email.</p>
    `);
    await send(email, 'Reset Your Nexus Password', html);
  },

  async sendOrderConfirmation(email: string, name: string, order: any) {
    const itemsHtml = order.items.map((item: any) => `
      <div class="order-item">
        <div class="item-info">
          <div class="item-name">${item.name}</div>
          <div class="item-meta">Qty: ${item.quantity} · SKU: ${item.sku}</div>
        </div>
        <div class="item-price">₹${item.subtotal.toLocaleString('en-IN')}</div>
      </div>
    `).join('');

    const html = baseTemplate(`
      <h1>Order Confirmed! 🎉</h1>
      <p>Hi <span class="highlight">${name}</span>, your order <strong style="color:#8b5cf6">#${order.orderNumber}</strong> has been placed successfully.</p>
      <hr class="divider">
      ${itemsHtml}
      <div style="margin-top:16px">
        <div class="total-row"><span class="label">Subtotal</span><span class="value">₹${order.pricing.subtotal.toLocaleString('en-IN')}</span></div>
        <div class="total-row"><span class="label">Shipping</span><span class="value">${order.pricing.shippingFee === 0 ? 'FREE' : '₹' + order.pricing.shippingFee}</span></div>
        <div class="total-row"><span class="label">Tax (GST)</span><span class="value">₹${order.pricing.tax.toLocaleString('en-IN')}</span></div>
        <hr class="divider">
        <div class="total-row"><span class="label" style="font-weight:600;color:#f1f1f9">Total</span><span class="value total-final">₹${order.pricing.total.toLocaleString('en-IN')}</span></div>
      </div>
      <br>
      <a href="${process.env.FRONTEND_URL}/orders/${order._id}" class="btn">Track Order →</a>
    `);
    await send(email, `Order Confirmed — #${order.orderNumber}`, html);
  },
};
