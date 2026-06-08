import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function sendOtpEmail(to, code) {
  const subject = 'Your World Cup 2026 Challenge code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto">
      <h2 style="color:#C9A84C">⚽ World Cup 2026 Challenge</h2>
      <p>Your one-time verification code is:</p>
      <p style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#1a6fc4">${code}</p>
      <p style="color:#666">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
    </div>`;

  if (!transporter) {
    console.log(`\n[DEV OTP] ${to} -> ${code}\n`);
    return { devCode: code };
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'World Cup Challenge <no-reply@wc2026.app>',
    to, subject, text, html,
  });
  return { sent: true };
}

export const SMTP_CONFIGURED = !!transporter;
