import dotenv from 'dotenv';
dotenv.config();

// Uses Brevo's HTTP API (port 443) instead of SMTP (port 587 is blocked on Render free tier).
// Set BREVO_API_KEY in Render environment variables.
// Get it from: Brevo dashboard → top-right menu → SMTP & API → API Keys tab → Create API key

export async function sendOtpEmail(to, code) {
  const subject = 'Your World Cup 2026 Challenge code';
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px;">
      <h2 style="color:#C9A84C;margin:0 0 16px">⚽ World Cup 2026 Challenge</h2>
      <p style="color:#333;margin:0 0 12px">Your one-time verification code:</p>
      <p style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1a6fc4;margin:16px 0">${code}</p>
      <p style="color:#888;font-size:13px">Expires in 10 minutes. If you didn't request this, ignore it.</p>
    </div>`;

  const apiKey = process.env.BREVO_API_KEY;

  // No API key → dev mode
  if (!apiKey) {
    console.log(`\n[DEV OTP] ${to} -> ${code}\n`);
    return { devCode: code };
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        sender: {
          name: process.env.SMTP_FROM_NAME || 'World Cup 2026 Challenge',
          email: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: `Your World Cup 2026 Challenge code is: ${code}. It expires in 10 minutes.`,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Brevo API ${res.status}: ${body}`);
    }
    console.log(`[Brevo API] Email sent to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error('[Brevo API] Send FAILED:', err.message);
    // Fallback: show code on screen so user is never blocked
    return { devCode: code, smtpError: err.message };
  }
}

export const SMTP_CONFIGURED = !!(process.env.BREVO_API_KEY);
