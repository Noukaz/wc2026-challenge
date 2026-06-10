import dotenv from 'dotenv';
dotenv.config();

export async function sendOtpEmail(to, code) {
  const apiKey = process.env.BREVO_API_KEY;

  // Log at call time so we can see in Render logs exactly what's happening
  console.log('[OTP] sendOtpEmail called for:', to);
  console.log('[OTP] BREVO_API_KEY present:', !!apiKey);
  console.log('[OTP] SMTP_FROM_EMAIL:', process.env.SMTP_FROM_EMAIL || '(not set)');
  console.log('[OTP] SMTP_USER:', process.env.SMTP_USER || '(not set)');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
      <h2 style="color:#C9A84C;margin:0 0 16px">⚽ World Cup 2026 Challenge</h2>
      <p style="color:#333;margin:0 0 12px">Your one-time verification code:</p>
      <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a6fc4;margin:16px 0">${code}</p>
      <p style="color:#888;font-size:13px">Expires in 10 minutes. If you didn't request this, ignore it.</p>
    </div>`;

  // No API key → dev mode (show code on screen)
  if (!apiKey) {
    console.log('[OTP] No BREVO_API_KEY — using dev mode');
    console.log(`[DEV OTP] ${to} -> ${code}`);
    return { devCode: code };
  }

  // Determine sender email — must be a verified sender in Brevo
  const senderEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;
  if (!senderEmail) {
    console.error('[OTP] ERROR: No sender email. Set SMTP_FROM_EMAIL in Render env vars.');
    return { devCode: code, smtpError: 'No sender email configured (set SMTP_FROM_EMAIL)' };
  }

  console.log('[OTP] Calling Brevo API with sender:', senderEmail);

  try {
    const payload = {
      sender: { name: 'World Cup 2026 Challenge', email: senderEmail },
      to: [{ email: to }],
      subject: 'Your World Cup 2026 Challenge code',
      htmlContent: html,
      textContent: `Your verification code is: ${code}. It expires in 10 minutes.`,
    };

    console.log('[OTP] Brevo payload:', JSON.stringify(payload).slice(0, 200));

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await res.text();
    console.log('[OTP] Brevo response status:', res.status);
    console.log('[OTP] Brevo response body:', responseText.slice(0, 300));

    if (!res.ok) {
      throw new Error(`Brevo API ${res.status}: ${responseText}`);
    }

    console.log(`[OTP] ✓ Email sent successfully to ${to}`);
    return { sent: true };

  } catch (err) {
    console.error('[OTP] Brevo API FAILED:', err.message);
    // Always fall back — user can still log in
    return { devCode: code, smtpError: err.message };
  }
}

// Evaluated at call time, not import time — avoids caching issues
export function SMTP_CONFIGURED() {
  return !!(process.env.BREVO_API_KEY);
}
