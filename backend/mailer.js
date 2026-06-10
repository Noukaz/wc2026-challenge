import dotenv from 'dotenv';
dotenv.config();

export async function sendOtpEmail(to, code) {
  // Try multiple env var names in case of misconfiguration
  const apiKey = process.env.BREVO_API_KEY
               || process.env.BREVO_KEY
               || process.env.API_KEY;

  const senderEmail = process.env.SMTP_FROM_EMAIL
                    || process.env.SENDER_EMAIL
                    || process.env.FROM_EMAIL;

  console.log('[OTP] Sending to:', to);
  console.log('[OTP] BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'SET ✓' : 'MISSING ✗');
  console.log('[OTP] SMTP_FROM_EMAIL:', senderEmail || 'MISSING ✗');

  if (!apiKey) {
    console.log('[OTP] No API key found — DEV mode (code shown on screen)');
    console.log(`[DEV OTP] ${to} -> ${code}`);
    return { devCode: code };
  }

  if (!senderEmail) {
    console.error('[OTP] ERROR: SMTP_FROM_EMAIL not set');
    return { devCode: code, smtpError: 'SMTP_FROM_EMAIL not configured' };
  }

  try {
    console.log('[OTP] Calling Brevo API...');
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: { name: 'WC2026 Challenge', email: senderEmail },
        to: [{ email: to }],
        subject: 'Your WC2026 verification code',
        htmlContent: `<div style="font-family:Arial;padding:24px;max-width:480px">
          <h2 style="color:#C9A84C">⚽ World Cup 2026 Challenge</h2>
          <p>Your verification code:</p>
          <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a6fc4">${code}</p>
          <p style="color:#888;font-size:13px">Expires in 10 minutes.</p>
        </div>`,
        textContent: `Your WC2026 code: ${code} (expires in 10 minutes)`,
      }),
    });

    const body = await res.text();
    console.log('[OTP] Brevo status:', res.status, '| body:', body.slice(0, 200));

    if (!res.ok) throw new Error(`Brevo ${res.status}: ${body}`);

    console.log('[OTP] ✓ Email sent to', to);
    return { sent: true };
  } catch (err) {
    console.error('[OTP] FAILED:', err.message);
    return { devCode: code, smtpError: err.message };
  }
}

export function SMTP_CONFIGURED() {
  return !!(process.env.BREVO_API_KEY || process.env.BREVO_KEY || process.env.API_KEY);
}
