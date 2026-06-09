CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  nickname      TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otps (
  id          SERIAL PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed    BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);

CREATE TABLE IF NOT EXISTS groups (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  kind        TEXT DEFAULT 'friends',
  owner_id    INTEGER REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id    INTEGER REFERENCES groups(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joined_at   TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS matches (
  match_number   INTEGER PRIMARY KEY,
  round_number   INTEGER NOT NULL,
  grp            TEXT,
  date_utc       TIMESTAMPTZ NOT NULL,
  home_team      TEXT,
  away_team      TEXT,
  home_code      TEXT,
  away_code      TEXT,
  home_score     INTEGER,
  away_score     INTEGER,
  finished       BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS match_predictions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  match_number  INTEGER REFERENCES matches(match_number),
  pred_home     INTEGER NOT NULL,
  pred_away     INTEGER NOT NULL,
  points        INTEGER,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, match_number)
);

CREATE TABLE IF NOT EXISTS champions_predictions (
  id            SERIAL PRIMARY KEY,
  user_id       INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  payload       JSONB NOT NULL,
  points        INTEGER DEFAULT 0,
  submitted_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meta (
  key    TEXT PRIMARY KEY,
  value  TEXT
);
INSERT INTO meta (key, value) VALUES ('wc_start_utc', '2026-06-11T19:00:00Z')
  ON CONFLICT (key) DO NOTHING;
