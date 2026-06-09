import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query } from './db.js';
import { FIXTURES } from './fixtures.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Runs automatically when the server boots. Safe to run every time:
// CREATE TABLE IF NOT EXISTS + ON CONFLICT make it idempotent.
export async function ensureDatabase() {
  try {
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await query(schema);

    // Safe migration: add 'kind' column if an older database is missing it
    await query("ALTER TABLE groups ADD COLUMN IF NOT EXISTS kind TEXT DEFAULT 'friends'");

    // Only seed fixtures if the matches table is empty (fast check)
    const c = await query('SELECT COUNT(*)::int AS n FROM matches');
    if (c.rows[0].n === 0) {
      for (const f of FIXTURES) {
        await query(
          `INSERT INTO matches (match_number, round_number, grp, date_utc, home_team, away_team, home_code, away_code)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
           ON CONFLICT (match_number) DO NOTHING`,
          [f.n, f.r, f.g, f.d, f.h, f.a, f.hc, f.ac]
        );
      }
      console.log(`[init] Seeded ${FIXTURES.length} matches.`);
    } else {
      console.log(`[init] Database ready (${c.rows[0].n} matches already present).`);
    }
  } catch (e) {
    console.error('[init] Database setup failed:', e.message);
    throw e;
  }
}
