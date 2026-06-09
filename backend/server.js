import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { query } from './db.js';
import { ensureDatabase } from './initdb.js';
import { sendOtpEmail, SMTP_CONFIGURED } from './mailer.js';
import { scoreMatchPrediction, scoreChampions } from './scoring.js';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const LIVE_FEED_URL = 'https://fixturedownload.com/feed/json/fifa-world-cup-2026';

function makeToken(user) {
  return jwt.sign({ id: user.id, email: user.email, nickname: user.nickname }, JWT_SECRET, { expiresIn: '30d' });
}
function auth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not signed in' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Session expired' }); }
}
function genCode(len = 6) { let s = ''; for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10); return s; }
function genGroupCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = ''; for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ---- AUTH ----
app.post('/api/auth/request-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
    const code = genCode(6);
    const codeHash = await bcrypt.hash(code, 8);
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await query('INSERT INTO otps (email, code_hash, expires_at) VALUES ($1,$2,$3)', [email, codeHash, expires]);
    const result = await sendOtpEmail(email, code);
    res.json({ ok: true, devCode: SMTP_CONFIGURED ? undefined : result.devCode });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Failed to send code' }); }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const { code, nickname, fullName } = req.body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code required' });
    const otps = await query(
      'SELECT * FROM otps WHERE email=$1 AND consumed=false AND expires_at > now() ORDER BY created_at DESC LIMIT 5',
      [email]
    );
    let matched = null;
    for (const row of otps.rows) { if (await bcrypt.compare(code, row.code_hash)) { matched = row; break; } }
    if (!matched) return res.status(400).json({ error: 'Invalid or expired code' });
    await query('UPDATE otps SET consumed=true WHERE id=$1', [matched.id]);

    let userRes = await query('SELECT * FROM users WHERE email=$1', [email]);
    let user = userRes.rows[0];
    if (!user) {
      if (!nickname || !fullName) return res.status(400).json({ error: 'New account needs nickname and full name', needsProfile: true });
      const ins = await query('INSERT INTO users (email, nickname, full_name) VALUES ($1,$2,$3) RETURNING *',
        [email, nickname.trim(), fullName.trim()]);
      user = ins.rows[0];
    }
    res.json({ token: makeToken(user), user: { id: user.id, email: user.email, nickname: user.nickname, fullName: user.full_name } });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Verification failed' }); }
});

app.get('/api/me', auth, async (req, res) => {
  const r = await query('SELECT id, email, nickname, full_name FROM users WHERE id=$1', [req.user.id]);
  res.json(r.rows[0] || null);
});

// ---- GROUPS ----
app.post('/api/groups/create', auth, async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const kind = ['friends', 'colleagues', 'family'].includes(req.body.kind) ? req.body.kind : 'friends';
    if (!name) return res.status(400).json({ error: 'Group name required' });
    let code, exists = true, attempts = 0;
    while (exists && attempts < 20) {
      code = genGroupCode();
      const c = await query('SELECT 1 FROM groups WHERE code=$1', [code]);
      exists = c.rowCount > 0; attempts++;
    }
    const g = await query('INSERT INTO groups (name, code, kind, owner_id) VALUES ($1,$2,$3,$4) RETURNING *', [name, code, kind, req.user.id]);
    await query('INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [g.rows[0].id, req.user.id]);
    res.json({ group: g.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not create group' }); }
});

app.post('/api/groups/join', auth, async (req, res) => {
  try {
    const code = (req.body.code || '').trim().toUpperCase();
    const g = await query('SELECT * FROM groups WHERE code=$1', [code]);
    if (!g.rowCount) return res.status(404).json({ error: 'No group with that code' });
    await query('INSERT INTO group_members (group_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [g.rows[0].id, req.user.id]);
    res.json({ group: g.rows[0] });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not join group' }); }
});

app.get('/api/groups/mine', auth, async (req, res) => {
  const r = await query(
    `SELECT g.* FROM groups g JOIN group_members m ON m.group_id=g.id WHERE m.user_id=$1 ORDER BY g.created_at DESC`,
    [req.user.id]);
  res.json({ groups: r.rows });
});

app.get('/api/groups/:id/members', auth, async (req, res) => {
  const r = await query(
    `SELECT u.id, u.nickname, u.full_name FROM users u
       JOIN group_members m ON m.user_id=u.id WHERE m.group_id=$1 ORDER BY u.nickname`,
    [req.params.id]);
  res.json({ members: r.rows });
});

// ---- MATCHES ----
app.get('/api/matches', async (req, res) => {
  const r = await query('SELECT * FROM matches ORDER BY match_number');
  res.json({ matches: r.rows });
});

// ---- INTERNATIONAL FANTASY ----
function predictionLocked(dateUtc) {
  return Date.now() >= new Date(dateUtc).getTime() - 60 * 60 * 1000;
}

app.get('/api/predictions/match', auth, async (req, res) => {
  const r = await query('SELECT match_number, pred_home, pred_away, points FROM match_predictions WHERE user_id=$1', [req.user.id]);
  res.json({ predictions: r.rows });
});

app.get('/api/predictions/match/:userId', auth, async (req, res) => {
  const shared = await query(
    `SELECT 1 FROM group_members a JOIN group_members b ON a.group_id=b.group_id
       WHERE a.user_id=$1 AND b.user_id=$2 LIMIT 1`, [req.user.id, req.params.userId]);
  if (!shared.rowCount) return res.status(403).json({ error: 'Not in a shared group' });
  const r = await query('SELECT match_number, pred_home, pred_away, points FROM match_predictions WHERE user_id=$1', [req.params.userId]);
  res.json({ predictions: r.rows });
});

app.post('/api/predictions/match', auth, async (req, res) => {
  try {
    const { matchNumber, home, away } = req.body;
    const m = await query('SELECT * FROM matches WHERE match_number=$1', [matchNumber]);
    if (!m.rowCount) return res.status(404).json({ error: 'Unknown match' });
    if (predictionLocked(m.rows[0].date_utc)) return res.status(403).json({ error: 'Locked — within 1 hour of kickoff' });
    if (home < 0 || away < 0 || home > 30 || away > 30) return res.status(400).json({ error: 'Invalid score' });
    await query(
      `INSERT INTO match_predictions (user_id, match_number, pred_home, pred_away)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id, match_number) DO UPDATE SET pred_home=$3, pred_away=$4, updated_at=now()`,
      [req.user.id, matchNumber, home, away]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not save prediction' }); }
});

app.get('/api/standings/international', auth, async (req, res) => {
  const groupId = req.query.groupId;
  let rows;
  if (groupId) {
    rows = await query(
      `SELECT u.id, u.nickname, COALESCE(SUM(p.points),0)::int AS points,
              COUNT(p.points) FILTER (WHERE p.points IS NOT NULL)::int AS scored
       FROM users u JOIN group_members m ON m.user_id=u.id AND m.group_id=$1
       LEFT JOIN match_predictions p ON p.user_id=u.id
       GROUP BY u.id ORDER BY points DESC, u.nickname`, [groupId]);
  } else {
    rows = await query(
      `SELECT u.id, u.nickname, COALESCE(SUM(p.points),0)::int AS points,
              COUNT(p.points) FILTER (WHERE p.points IS NOT NULL)::int AS scored
       FROM users u LEFT JOIN match_predictions p ON p.user_id=u.id
       GROUP BY u.id ORDER BY points DESC, u.nickname LIMIT 100`);
  }
  res.json({ standings: rows.rows });
});

// ---- CHAMPIONS FANTASY ----
async function getWcStart() {
  const r = await query("SELECT value FROM meta WHERE key='wc_start_utc'");
  return new Date(r.rows[0]?.value || '2026-06-11T19:00:00Z').getTime();
}

app.get('/api/champions/mine', auth, async (req, res) => {
  const r = await query('SELECT payload, points, submitted_at FROM champions_predictions WHERE user_id=$1', [req.user.id]);
  const start = await getWcStart();
  res.json({ prediction: r.rows[0] || null, locked: Date.now() >= start - 60 * 60 * 1000, wcStart: start });
});

app.post('/api/champions/submit', auth, async (req, res) => {
  try {
    const start = await getWcStart();
    if (Date.now() >= start - 60 * 60 * 1000) return res.status(403).json({ error: 'Locked — within 1 hour of the World Cup kickoff' });
    const payload = req.body.payload;
    if (!payload || typeof payload !== 'object') return res.status(400).json({ error: 'Invalid prediction' });
    await query(
      `INSERT INTO champions_predictions (user_id, payload) VALUES ($1,$2)
       ON CONFLICT (user_id) DO UPDATE SET payload=$2, submitted_at=now()`,
      [req.user.id, payload]);
    res.json({ ok: true });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Could not submit' }); }
});

app.get('/api/champions/:userId', auth, async (req, res) => {
  const shared = await query(
    `SELECT 1 FROM group_members a JOIN group_members b ON a.group_id=b.group_id
       WHERE a.user_id=$1 AND b.user_id=$2 LIMIT 1`, [req.user.id, req.params.userId]);
  if (!shared.rowCount) return res.status(403).json({ error: 'Not in a shared group' });
  const r = await query('SELECT payload, points FROM champions_predictions WHERE user_id=$1', [req.params.userId]);
  res.json({ prediction: r.rows[0] || null });
});

app.get('/api/standings/champions', auth, async (req, res) => {
  const groupId = req.query.groupId;
  let rows;
  if (groupId) {
    rows = await query(
      `SELECT u.id, u.nickname, COALESCE(c.points,0)::int AS points
       FROM users u JOIN group_members m ON m.user_id=u.id AND m.group_id=$1
       LEFT JOIN champions_predictions c ON c.user_id=u.id
       GROUP BY u.id, c.points ORDER BY points DESC, u.nickname`, [groupId]);
  } else {
    rows = await query(
      `SELECT u.id, u.nickname, COALESCE(c.points,0)::int AS points
       FROM users u LEFT JOIN champions_predictions c ON c.user_id=u.id
       ORDER BY points DESC, u.nickname LIMIT 100`);
  }
  res.json({ standings: rows.rows });
});

// ---- LIVE RESULTS SYNC ----
app.post('/api/admin/sync', async (req, res) => {
  if ((req.headers['x-admin-token'] || req.query.token) !== (process.env.ADMIN_TOKEN || 'dev-admin')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const r = await fetch(LIVE_FEED_URL, { cache: 'no-store' });
    const feed = await r.json();
    let updated = 0;
    for (const m of feed) {
      if (m.HomeTeamScore === null || m.AwayTeamScore === null) continue;
      await query('UPDATE matches SET home_score=$1, away_score=$2, finished=true WHERE match_number=$3',
        [m.HomeTeamScore, m.AwayTeamScore, m.MatchNumber]);
      updated++;
    }
    const finished = await query('SELECT match_number, home_score, away_score FROM matches WHERE finished=true');
    for (const fm of finished.rows) {
      const preds = await query('SELECT id, pred_home, pred_away FROM match_predictions WHERE match_number=$1', [fm.match_number]);
      for (const p of preds.rows) {
        const pts = scoreMatchPrediction(p.pred_home, p.pred_away, fm.home_score, fm.away_score);
        await query('UPDATE match_predictions SET points=$1 WHERE id=$2', [pts, p.id]);
      }
    }
    res.json({ ok: true, matchesUpdated: updated });
  } catch (e) { console.error(e); res.status(500).json({ error: 'Sync failed: ' + e.message }); }
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname, '..', 'public', 'index.html')));

const PORT = process.env.PORT || 3000;

// Set up the database, THEN start listening. This means you never have to run
// any manual command — the tables and fixtures are created on first boot.
ensureDatabase()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on :${PORT} (SMTP ${SMTP_CONFIGURED ? 'configured' : 'DEV mode'})`));
  })
  .catch((e) => {
    console.error('Could not start — database error:', e.message);
    // Start anyway so the health check can report, but routes needing DB will error.
    app.listen(PORT, () => console.log(`Server running on :${PORT} (DB INIT FAILED — check DATABASE_URL)`));
  });
