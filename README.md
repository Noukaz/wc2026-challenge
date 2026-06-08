# ⚽ World Cup 2026 — Challenge Your Friends

A complete website with three parts:
1. **Simulate to the Final** — build your own bracket
2. **Actual Live Path** — follow real results
3. **Challenge Your Friends** — accounts, groups, and two fantasy games with leaderboards

You do **NOT** need to run any commands or open any "shell". The app sets up its own
database automatically the first time it starts. Just get the files into GitHub and
connect Render. Follow the steps below exactly.

---

# 🟢 STEP-BY-STEP DEPLOY (for total beginners)

## Part 1 — Put the files on GitHub

You have two easy ways. **Way A (drag & drop in the browser) is easiest.**

### Way A — Upload in the browser (no software)
1. Go to **github.com** and sign in.
2. Click the **+** (top right) → **New repository**.
3. Name it `wc2026-challenge`. Leave everything else default. Click **Create repository**.
4. On the next page, click the link **“uploading an existing file”**.
5. **Unzip** the file I gave you (`wc2026-challenge.zip`) on your computer first.
   Open the unzipped folder. You should see: `backend`, `public`, `package.json`,
   `render.yaml`, `README.md`, and a few small files.
6. **Select ALL of those items** and drag them into the GitHub upload box.
   ⚠️ Important: drag the *contents* (the `backend` folder, `public` folder, `package.json`,
   `render.yaml` …), **NOT** the outer `wc2026-challenge` folder itself.
7. Scroll down, click **Commit changes**.

✅ Your repo should now show `package.json` and `render.yaml` at the top level
(not inside another folder). If they’re inside a folder, delete and re-upload the *contents*.

---

## Part 2 — Deploy on Render (the magic button)

1. Go to **dashboard.render.com** and sign in.
2. Click **New +** (top right) → **Blueprint**.
3. Choose your `wc2026-challenge` GitHub repo and click **Connect**.
4. Render reads the `render.yaml` file and shows it will create:
   - a **Web Service** (the website)
   - a **PostgreSQL database**
5. Click **Apply** / **Create**.
6. Wait a few minutes while it builds. When the Web Service shows **“Live”**, click its URL.

🎉 That’s it. The database tables and all 104 matches are created automatically on first start.
No commands, no shell.

> First load after the app sleeps can take 30–60 seconds on the free plan. That’s normal.

---

## Part 3 — Connect your Cloudflare domain (optional)

1. In Render, open your Web Service → **Settings** → **Custom Domains** → **Add Custom Domain**.
   Type your domain (e.g. `worldcup.yourdomain.com`) and copy the target Render gives you
   (something like `wc2026-challenge.onrender.com`).
2. In **Cloudflare** → your domain → **DNS** → **Add record**:
   - Type: **CNAME**
   - Name: the subdomain you chose (e.g. `worldcup`) — or `@` for the root
   - Target: the `…onrender.com` address from Render
   - Proxy status: **DNS only** (grey cloud) for the first verification, you can turn the
     orange cloud back on after Render says “Verified”.
3. Back in Render, click **Verify**. Done in a few minutes.

---

# ✉️ Sending real verification emails (recommended)

By default the app shows the 6-digit code **on screen** (great for testing). To email codes
to your friends instead, sign up for a free email-sending service (e.g. **Brevo** — free tier),
get its SMTP details, then in Render:

Web Service → **Environment** → add these (then it redeploys automatically):

```
SMTP_HOST   = (from your email provider)
SMTP_PORT   = 587
SMTP_USER   = (from your email provider)
SMTP_PASS   = (from your email provider)
SMTP_FROM   = World Cup Challenge <no-reply@yourdomain.com>
```

After that, codes are emailed and no longer shown on screen.

---

# 🔄 Keeping scores updated during the tournament

After matches finish you trigger a quick “sync” that pulls real scores and updates everyone’s
points. Easiest hands-off way: use a free scheduler like **cron-job.org**:

1. In Render → your Web Service → **Environment**, find the value of **ADMIN_TOKEN** (copy it).
2. On **cron-job.org**, create a job that runs every 10 minutes during match days, calling:
   ```
   https://YOUR-APP.onrender.com/api/admin/sync
   ```
   with a request **header**: `x-admin-token` = your ADMIN_TOKEN value, and method **POST**.

(You can also just paste that URL with the token once in a while to refresh manually.)

---

# ⚠️ Two things to know about Render’s FREE plan

1. **The site sleeps after ~15 min idle** and takes 30–60s to wake. Fine for friends; upgrade
   the Web Service to the $7/mo plan for always-on.
2. **The free database is deleted 30 days after you create it.** The World Cup lasts ~6 weeks,
   so a free DB made at kickoff could vanish mid-tournament. Two safe options:
   - Upgrade the Render database to a paid plan, **or**
   - Use a **free Supabase or Neon** database (these don’t expire). Create one there, copy its
     connection string, and in Render set the Web Service env var **DATABASE_URL** to it.
     Everything else stays the same.

---

# 🧩 What each folder is (for reference)

```
backend/   — the server (accounts, groups, predictions, scoring, results sync)
public/    — what people see (landing page, the challenge app, the simulator)
package.json, render.yaml — tell Render how to build and run everything
```

You don’t need to edit any of these to deploy.
