// ============================================================
// WORLD CUP 2026 CHALLENGE — Frontend
// ============================================================
const API = '';  // same origin
let token = localStorage.getItem('wc_token') || null;
let me = null;
let myGroups = [];
let activeGroupId = null;
let matches = [];

function flag(code, sm) {
  if (!code) return '';
  return `<img class="${sm ? 'flag-sm' : 'flag'}" src="https://flagcdn.com/w40/${code}.png" alt="">`;
}
function api(path, opts = {}) {
  opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (token) opts.headers.Authorization = 'Bearer ' + token;
  return fetch(API + path, opts).then(async r => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || ('HTTP ' + r.status));
    return data;
  });
}
const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
function localTime(utc) { return new Date(utc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function localDateLabel(utc) { return new Date(utc).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }); }
function localDateKey(utc) { return new Date(utc).toLocaleDateString('en-CA'); }
function shortLabel(key) { return new Date(key + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric' }); }

// ---- MODE SWITCHING ----
function enterMode(mode) {
  document.getElementById('landing').classList.add('hidden');
  ['sim', 'live', 'challenge'].forEach(m => document.getElementById('mode-' + m).classList.toggle('active', m === mode));
  if (mode === 'sim') {
    const f = document.getElementById('simFrame');
    if (!f.src) f.src = '/simulator.html';
  } else if (mode === 'live') {
    const f = document.getElementById('liveFrame');
    if (!f.src) f.src = '/simulator.html#live';
  } else if (mode === 'challenge') {
    renderChallenge();
  }
  window.scrollTo(0, 0);
}
function goHome() {
  document.getElementById('landing').classList.remove('hidden');
  ['sim', 'live', 'challenge'].forEach(m => document.getElementById('mode-' + m).classList.remove('active'));
  window.scrollTo(0, 0);
}

// ============================================================
// CHALLENGE ROUTER
// ============================================================
async function renderChallenge() {
  const body = document.getElementById('challengeBody');
  if (!token) { renderAuthChoice(); return; }
  // verify token still valid
  try { me = await api('/api/me'); } catch { token = null; localStorage.removeItem('wc_token'); renderAuthChoice(); return; }
  if (!me) { token = null; localStorage.removeItem('wc_token'); renderAuthChoice(); return; }
  await loadGroups();
  if (!myGroups.length) { renderGroupChoice(); return; }
  renderDashboard();
}

// ---- AUTH ----
function renderAuthChoice() {
  document.getElementById('challengeBody').innerHTML = `
    <div class="center-box">
      <div class="panel">
        <h2>Join the Challenge</h2>
        <div class="sub">Compete with friends and colleagues. First, let's get you in.</div>
        <div class="choice-row">
          <div class="choice" onclick="renderAuthForm('signin')">
            <div class="ci">🔑</div><h3>Sign In</h3><p>Already have an account</p>
          </div>
          <div class="choice" onclick="renderAuthForm('signup')">
            <div class="ci">✨</div><h3>Create Account</h3><p>New here — quick setup</p>
          </div>
        </div>
        <div class="info-box" style="margin:16px 0 0;">🔒 <strong>No passwords.</strong> We email you a one-time code each time you sign in.</div>
      </div>
    </div>`;
}

function renderAuthForm(kind) {
  const isSignup = kind === 'signup';
  document.getElementById('challengeBody').innerHTML = `
    <div class="center-box">
      <div class="panel">
        <h2>${isSignup ? 'Create Account' : 'Sign In'}</h2>
        <div class="sub">${isSignup ? 'Fill in your details — we\'ll send a verification code.' : 'Enter your email — we\'ll send a sign-in code.'}</div>
        <div id="authMsg"></div>
        ${isSignup ? `
          <label class="label">Nickname (shown on leaderboards)</label>
          <input class="input" id="f_nick" placeholder="e.g. Mehdi">
          <label class="label">Full name</label>
          <input class="input" id="f_full" placeholder="e.g. Mehdi Noukaz">
        ` : ''}
        <label class="label">Email address</label>
        <input class="input" id="f_email" type="email" placeholder="you@example.com">
        <button class="btn btn-purple" style="width:100%" id="reqBtn" onclick="requestOtp(${isSignup})">Send me a code →</button>
        <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderAuthChoice()">← Back</span></div>
      </div>
    </div>`;
}

let pendingAuth = {};
async function requestOtp(isSignup) {
  const email = document.getElementById('f_email').value.trim();
  const msg = document.getElementById('authMsg');
  msg.innerHTML = '';
  if (!email || !email.includes('@')) { msg.innerHTML = `<div class="msg err">Enter a valid email.</div>`; return; }
  const nick = isSignup ? document.getElementById('f_nick').value.trim() : '';
  const full = isSignup ? document.getElementById('f_full').value.trim() : '';
  if (isSignup && (!nick || !full)) { msg.innerHTML = `<div class="msg err">Nickname and full name are required.</div>`; return; }
  pendingAuth = { email, nickname: nick, fullName: full, isSignup };
  const btn = document.getElementById('reqBtn'); btn.disabled = true; btn.textContent = 'Sending…';
  try {
    const r = await api('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) });
    renderOtpForm(r.devCode);
  } catch (e) {
    msg.innerHTML = `<div class="msg err">${e.message}</div>`;
    btn.disabled = false; btn.textContent = 'Send me a code →';
  }
}

function renderOtpForm(devCode) {
  document.getElementById('challengeBody').innerHTML = `
    <div class="center-box">
      <div class="panel">
        <h2>Enter your code</h2>
        <div class="sub">We sent a 6-digit code to <b>${pendingAuth.email}</b>. It expires in 10 minutes.</div>
        <div id="otpMsg"></div>
        ${devCode ? `<div class="dev-code">Dev mode — your code is:<br><b>${devCode}</b></div>` : ''}
        <label class="label">Verification code</label>
        <input class="input" id="f_otp" inputmode="numeric" maxlength="6" placeholder="______" style="letter-spacing:10px;text-align:center;font-size:22px;">
        <button class="btn btn-purple" style="width:100%" id="verBtn" onclick="verifyOtp()">Verify &amp; continue →</button>
        <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderAuthForm(pendingAuth.isSignup?'signup':'signin')">← Use a different email</span></div>
      </div>
    </div>`;
  if (devCode) document.getElementById('f_otp').value = devCode;
}

async function verifyOtp() {
  const code = document.getElementById('f_otp').value.trim();
  const msg = document.getElementById('otpMsg');
  msg.innerHTML = '';
  if (code.length < 4) { msg.innerHTML = `<div class="msg err">Enter the code.</div>`; return; }
  const btn = document.getElementById('verBtn'); btn.disabled = true; btn.textContent = 'Verifying…';
  try {
    const r = await api('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email: pendingAuth.email, code, nickname: pendingAuth.nickname, fullName: pendingAuth.fullName })
    });
    token = r.token; localStorage.setItem('wc_token', token); me = r.user;
    await renderChallenge();
  } catch (e) {
    if (e.message && e.message.includes('needs nickname')) {
      msg.innerHTML = `<div class="msg err">This email is new — please create an account.</div>`;
      setTimeout(() => renderAuthForm('signup'), 1200);
    } else {
      msg.innerHTML = `<div class="msg err">${e.message}</div>`;
      btn.disabled = false; btn.textContent = 'Verify & continue →';
    }
  }
}

function signOut() { token = null; me = null; myGroups = []; activeGroupId = null; localStorage.removeItem('wc_token'); renderAuthChoice(); }

// ---- GROUPS ----
async function loadGroups() {
  const r = await api('/api/groups/mine');
  myGroups = r.groups || [];
  if (myGroups.length && !activeGroupId) activeGroupId = myGroups[0].id;
}

function renderGroupChoice() {
  document.getElementById('challengeBody').innerHTML = `
    <div class="userbar">Signed in as <b>${me.nickname}</b> · <span style="cursor:pointer;color:var(--purple)" onclick="signOut()">Sign out</span></div>
    <div class="center-box">
      <div class="panel">
        <h2>Get into a group</h2>
        <div class="sub">Groups are how you compete with your friends and colleagues.</div>
        <div class="choice-row">
          <div class="choice" onclick="renderCreateGroup()"><div class="ci">➕</div><h3>Create a Group</h3><p>Name it &amp; get a share code</p></div>
          <div class="choice" onclick="renderJoinGroup()"><div class="ci">🔗</div><h3>Join a Group</h3><p>Enter a code from a friend</p></div>
        </div>
      </div>
    </div>`;
}

function renderCreateGroup() {
  document.getElementById('challengeBody').innerHTML = `
    <div class="center-box"><div class="panel">
      <h2>Create your group</h2><div class="sub">Pick a name. You'll get a code to share.</div>
      <div id="grpMsg"></div>
      <label class="label">Group name</label>
      <input class="input" id="f_gname" placeholder="e.g. Office League 2026">
      <button class="btn btn-purple" style="width:100%" id="createBtn" onclick="doCreateGroup()">Create group →</button>
      <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderGroupChoice()">← Back</span></div>
    </div></div>`;
}
async function doCreateGroup() {
  const name = document.getElementById('f_gname').value.trim();
  const msg = document.getElementById('grpMsg');
  if (!name) { msg.innerHTML = `<div class="msg err">Enter a group name.</div>`; return; }
  const btn = document.getElementById('createBtn'); btn.disabled = true; btn.textContent = 'Creating…';
  try {
    const r = await api('/api/groups/create', { method: 'POST', body: JSON.stringify({ name }) });
    document.getElementById('challengeBody').innerHTML = `
      <div class="center-box"><div class="panel" style="text-align:center;">
        <h2>Group created! 🎉</h2>
        <div class="sub">Share this code with your friends so they can join <b>${r.group.name}</b>:</div>
        <div class="code-display"><div class="code">${r.group.code}</div></div>
        <button class="btn btn-ghost" onclick="copyCode('${r.group.code}')">📋 Copy code</button>
        <button class="btn btn-purple" style="width:100%;margin-top:12px;" onclick="afterGroup(${r.group.id})">Enter group →</button>
      </div></div>`;
  } catch (e) { msg.innerHTML = `<div class="msg err">${e.message}</div>`; btn.disabled = false; btn.textContent = 'Create group →'; }
}
function copyCode(c) { navigator.clipboard?.writeText(c); }

function renderJoinGroup() {
  document.getElementById('challengeBody').innerHTML = `
    <div class="center-box"><div class="panel">
      <h2>Join a group</h2><div class="sub">Enter the 6-character code a friend shared with you.</div>
      <div id="joinMsg"></div>
      <label class="label">Group code</label>
      <input class="input" id="f_gcode" maxlength="6" placeholder="ABC123" style="letter-spacing:6px;text-align:center;text-transform:uppercase;font-size:20px;">
      <button class="btn btn-purple" style="width:100%" id="joinBtn" onclick="doJoinGroup()">Join group →</button>
      <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderGroupChoice()">← Back</span></div>
    </div></div>`;
}
async function doJoinGroup() {
  const code = document.getElementById('f_gcode').value.trim().toUpperCase();
  const msg = document.getElementById('joinMsg');
  if (code.length < 4) { msg.innerHTML = `<div class="msg err">Enter the code.</div>`; return; }
  const btn = document.getElementById('joinBtn'); btn.disabled = true; btn.textContent = 'Joining…';
  try {
    const r = await api('/api/groups/join', { method: 'POST', body: JSON.stringify({ code }) });
    afterGroup(r.group.id);
  } catch (e) { msg.innerHTML = `<div class="msg err">${e.message}</div>`; btn.disabled = false; btn.textContent = 'Join group →'; }
}
async function afterGroup(id) { await loadGroups(); activeGroupId = id; renderDashboard(); }

// ============================================================
// DASHBOARD (two competitions)
// ============================================================
let currentComp = 'international';
let currentSub = 'predict';

async function renderDashboard() {
  if (!matches.length) { try { const r = await api('/api/matches'); matches = r.matches; } catch {} }
  const body = document.getElementById('challengeBody');
  body.innerHTML = `
    <div class="userbar">
      <span>Signed in as <b>${me.nickname}</b></span> ·
      <span>Group:</span>
      ${myGroups.map(g => `<span class="group-chip ${g.id===activeGroupId?'active':''}" onclick="switchGroup(${g.id})">${g.name} <b>(${g.code})</b></span>`).join('')}
      <span class="group-chip" onclick="renderGroupChoice()">＋ group</span>
      <span style="cursor:pointer;color:var(--purple)" onclick="signOut()">Sign out</span>
    </div>
    <div class="tabs">
      <button class="tab ${currentComp==='international'?'active':''}" onclick="setComp('international')">🎯 International Fantasy</button>
      <button class="tab ${currentComp==='champions'?'active':''}" onclick="setComp('champions')">👑 Champions Fantasy</button>
    </div>
    <div id="compBody"></div>`;
  renderComp();
}
function switchGroup(id) { activeGroupId = id; renderDashboard(); }
function setComp(c) { currentComp = c; currentSub = (c === 'international') ? 'predict' : 'predict'; renderDashboard(); }

function renderComp() {
  if (currentComp === 'international') renderInternational();
  else renderChampions();
}

// ============================================================
// INTERNATIONAL FANTASY
// ============================================================
let myMatchPreds = {};
let liveDayKey = null;

async function renderInternational() {
  const cb = document.getElementById('compBody');
  cb.innerHTML = `
    <div class="info-box">🎯 <strong>International Fantasy:</strong> predict the <strong>exact score</strong> of every match. Exact score = <b>4 pts</b>, correct winner = <b>2 pts</b>, correct draw = <b>4 pts</b>, wrong = 0. Edit up to <strong>1 hour before kickoff</strong>.</div>
    <div class="sub-tabs">
      <button class="sub-tab ${currentSub==='predict'?'active':''}" onclick="setSub('predict')">📝 My Predictions</button>
      <button class="sub-tab ${currentSub==='group'?'active':''}" onclick="setSub('group')">👥 Group Standings</button>
      <button class="sub-tab ${currentSub==='global'?'active':''}" onclick="setSub('global')">🌍 Global Standings</button>
      <button class="sub-tab ${currentSub==='friends'?'active':''}" onclick="setSub('friends')">🔍 Friends' Picks</button>
    </div>
    <div id="subBody"></div>`;
  if (currentSub === 'predict') renderMatchPredict();
  else if (currentSub === 'group') renderStandings('international', activeGroupId);
  else if (currentSub === 'global') renderStandings('international', null);
  else if (currentSub === 'friends') renderFriendsList('international');
}
function setSub(s) { currentSub = s; renderComp(); }

async function renderMatchPredict() {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  try { const r = await api('/api/predictions/match'); myMatchPreds = {}; r.predictions.forEach(p => myMatchPreds[p.match_number] = p); } catch {}
  // day tabs
  const dates = [...new Set(matches.map(m => localDateKey(m.date_utc)))].sort();
  if (!liveDayKey) {
    const todayKey = new Date().toLocaleDateString('en-CA');
    liveDayKey = dates.find(d => d >= todayKey) || dates[0];
  }
  const tabsHtml = dates.map(d => {
    const md = matches.find(m => localDateKey(m.date_utc) === d);
    const lbl = md.round_number <= 3 ? 'MD' + md.round_number : roundShort(md.round_number);
    return `<button class="md-tab ${d===liveDayKey?'active':''}" onclick="setLiveDay('${d}')"><span style="font-size:8px;display:block;opacity:.6">${lbl}</span>${shortLabel(d)}</button>`;
  }).join('');

  const dayMatches = matches.filter(m => localDateKey(m.date_utc) === liveDayKey);
  let rows = `<div class="day-title">${localDateLabel(dayMatches[0].date_utc)}</div>`;
  dayMatches.forEach(m => {
    const isKO = m.round_number > 3;
    const locked = Date.now() >= new Date(m.date_utc).getTime() - 3600000;
    const finished = m.finished;
    const pred = myMatchPreds[m.match_number];
    const grpBadge = isKO ? roundShort(m.round_number) : ('GRP ' + (m.grp || ''));
    let center;
    if (isKO) {
      center = `<div class="si"><span class="sep" style="font-size:11px;color:var(--muted)">vs</span></div>`;
    } else {
      const ph = pred ? pred.pred_home : '';
      const pa = pred ? pred.pred_away : '';
      center = `<div class="si">
        <input class="sib ${locked?'locked':''}" type="number" min="0" max="30" value="${ph}" ${locked?'disabled':''} onchange="savePred(${m.match_number},'h',this.value)" id="ph${m.match_number}">
        <span class="sep">:</span>
        <input class="sib ${locked?'locked':''}" type="number" min="0" max="30" value="${pa}" ${locked?'disabled':''} onchange="savePred(${m.match_number},'a',this.value)" id="pa${m.match_number}">
      </div>`;
    }
    const right = finished
      ? `<span class="pts-badge">${pred && pred.points != null ? '+' + pred.points : '–'}<br><span style="font-size:9px;color:var(--muted)">${m.home_score}-${m.away_score}</span></span>`
      : (locked && !isKO ? `<span class="lock-badge">🔒 LOCKED</span>` : '');
    rows += `<div class="match-row">
      <span class="mn">#${m.match_number}</span>
      <span class="gb">${grpBadge}</span>
      <div class="tc"><div class="t">${localTime(m.date_utc)}</div><div class="d">${m.date_utc.slice(5,10).replace('-','/')}</div></div>
      <div class="teams">
        <div class="tm"><span class="tn" style="text-align:right">${shortName(m.home_team)}</span>${flag(m.home_code,true)}</div>
        ${center}
        <div class="tm r">${flag(m.away_code,true)}<span class="tn">${shortName(m.away_team)}</span></div>
      </div>
      ${right}
    </div>`;
  });
  sb.innerHTML = `<div class="md-tabs" style="padding:10px 16px 0;">${tabsHtml}</div><div class="list">${rows}<div class="muted" style="text-align:center;padding:10px;">${matches.some(m=>m.round_number>3)?'Knockout matches open for prediction once teams are confirmed.':''}</div></div>`;
}
function setLiveDay(d) { liveDayKey = d; renderMatchPredict(); }
function roundShort(r) { return ({4:'R32',5:'R16',6:'QF',7:'SF',8:'FINAL'})[r] || 'KO'; }
function shortName(n) { return n && n.length > 12 ? n : n; }

let saveTimers = {};
function savePred(matchNumber, side, val) {
  const ph = document.getElementById('ph' + matchNumber).value;
  const pa = document.getElementById('pa' + matchNumber).value;
  if (ph === '' || pa === '') return; // need both
  clearTimeout(saveTimers[matchNumber]);
  saveTimers[matchNumber] = setTimeout(async () => {
    try {
      await api('/api/predictions/match', { method: 'POST', body: JSON.stringify({ matchNumber, home: parseInt(ph), away: parseInt(pa) }) });
      myMatchPreds[matchNumber] = { match_number: matchNumber, pred_home: parseInt(ph), pred_away: parseInt(pa) };
    } catch (e) { alert(e.message); }
  }, 400);
}

// ---- STANDINGS ----
async function renderStandings(comp, groupId) {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  try {
    const q = groupId ? ('?groupId=' + groupId) : '';
    const r = await api(`/api/standings/${comp}${q}`);
    const rows = r.standings || [];
    if (!rows.length) { sb.innerHTML = `<div class="loading">No players yet.</div>`; return; }
    sb.innerHTML = `<div class="standings-table">
      ${groupId ? `<div class="muted" style="text-align:center;margin-bottom:10px;">Group: <b>${myGroups.find(g=>g.id===groupId)?.name||''}</b></div>` : `<div class="muted" style="text-align:center;margin-bottom:10px;">🌍 Global — all players</div>`}
      ${rows.map((row, i) => `<div class="st-row ${row.id===me.id?'me':''}">
        <div class="st-rank">${i+1}</div>
        <div class="st-name">${row.nickname}${row.id===me.id?' <span class="muted">(you)</span>':''}${row.scored!=null?` <div class="st-sub">${row.scored} matches scored</div>`:''}</div>
        <div class="st-pts">${row.points}</div>
      </div>`).join('')}
    </div>`;
  } catch (e) { sb.innerHTML = `<div class="msg err" style="margin:16px;">${e.message}</div>`; }
}

// ---- FRIENDS' PICKS ----
async function renderFriendsList(comp) {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  try {
    const r = await api(`/api/groups/${activeGroupId}/members`);
    const members = (r.members || []).filter(m => m.id !== me.id);
    if (!members.length) { sb.innerHTML = `<div class="loading">No other members yet — share your group code!</div>`; return; }
    sb.innerHTML = `<div class="list">
      <div class="muted" style="text-align:center;margin-bottom:10px;">Tap a friend to see their predictions</div>
      ${members.map(mem => `<div class="match-row" style="cursor:pointer" onclick="viewFriend(${mem.id},'${mem.nickname.replace(/'/g,"")}','${comp}')">
        <div class="teams"><div class="tm" style="justify-content:flex-start;"><b>${mem.nickname}</b> <span class="muted">${mem.full_name}</span></div></div>
        <span class="muted">View →</span>
      </div>`).join('')}
    </div>`;
  } catch (e) { sb.innerHTML = `<div class="msg err" style="margin:16px;">${e.message}</div>`; }
}

async function viewFriend(userId, nick, comp) {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  try {
    if (comp === 'international') {
      const r = await api(`/api/predictions/match/${userId}`);
      const preds = {}; r.predictions.forEach(p => preds[p.match_number] = p);
      let rows = '';
      matches.filter(m => m.round_number <= 3).forEach(m => {
        const p = preds[m.match_number];
        rows += `<div class="match-row">
          <span class="mn">#${m.match_number}</span>
          <div class="teams"><div class="tm"><span class="tn" style="text-align:right">${m.home_team}</span>${flag(m.home_code,true)}</div>
          <div class="si"><span class="sib" style="display:inline-flex;align-items:center;justify-content:center;">${p?p.pred_home:'–'}</span><span class="sep">:</span><span class="sib" style="display:inline-flex;align-items:center;justify-content:center;">${p?p.pred_away:'–'}</span></div>
          <div class="tm r">${flag(m.away_code,true)}<span class="tn">${m.away_team}</span></div></div>
          ${p&&p.points!=null?`<span class="pts-badge">+${p.points}</span>`:''}
        </div>`;
      });
      sb.innerHTML = `<div class="list"><div class="day-title">${nick}'s predictions</div><div style="text-align:center;margin-bottom:8px;"><span class="muted" style="cursor:pointer" onclick="renderFriendsList('international')">← Back to friends</span></div>${rows}</div>`;
    } else {
      const r = await api(`/api/champions/${userId}`);
      sb.innerHTML = `<div class="list"><div class="day-title">${nick}'s Champions prediction</div>
        <div style="text-align:center;margin-bottom:8px;"><span class="muted" style="cursor:pointer" onclick="renderFriendsList('champions')">← Back</span></div>
        ${r.prediction ? renderChampionsView(r.prediction.payload, r.prediction.points) : '<div class="loading">No prediction submitted yet.</div>'}</div>`;
    }
  } catch (e) { sb.innerHTML = `<div class="msg err" style="margin:16px;">${e.message}</div>`; }
}

// ============================================================
// CHAMPIONS FANTASY  (uses the same simulator logic, then submits)
// ============================================================
async function renderChampions() {
  const cb = document.getElementById('compBody');
  cb.innerHTML = `
    <div class="info-box">👑 <strong>Champions Fantasy:</strong> predict the whole tournament. Scoring per team — Group 1st <b>3</b>, 2nd <b>2</b>, 3rd <b>1</b>; each best-3rd <b>3</b>; R32 winner <b>3</b>, R16 <b>5</b>, QF <b>10</b>, SF <b>15</b>, Champion <b>30</b>. Submit up to <strong>1 hour before the World Cup kicks off</strong>.</div>
    <div class="sub-tabs">
      <button class="sub-tab ${currentSub==='predict'?'active':''}" onclick="setSub('predict')">🔮 My Prediction</button>
      <button class="sub-tab ${currentSub==='group'?'active':''}" onclick="setSub('group')">👥 Group Standings</button>
      <button class="sub-tab ${currentSub==='global'?'active':''}" onclick="setSub('global')">🌍 Global Standings</button>
      <button class="sub-tab ${currentSub==='friends'?'active':''}" onclick="setSub('friends')">🔍 Friends' Picks</button>
    </div>
    <div id="subBody"></div>`;
  if (currentSub === 'predict') renderChampionsPredict();
  else if (currentSub === 'group') renderStandings('champions', activeGroupId);
  else if (currentSub === 'global') renderStandings('champions', null);
  else if (currentSub === 'friends') renderFriendsList('champions');
}

async function renderChampionsPredict() {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  let info;
  try { info = await api('/api/champions/mine'); } catch (e) { sb.innerHTML = `<div class="msg err" style="margin:16px;">${e.message}</div>`; return; }
  const locked = info.locked;
  const start = new Date(info.wcStart);
  if (locked) {
    sb.innerHTML = `<div class="list">
      <div class="msg info">🔒 Predictions are locked — the tournament has started (or is within 1 hour of kickoff).</div>
      ${info.prediction ? renderChampionsView(info.prediction.payload, info.prediction.points) : '<div class="loading">You did not submit a prediction.</div>'}
    </div>`;
    return;
  }
  // Open: embed the simulator for picking, with a Submit button.
  sb.innerHTML = `<div class="list">
    <div class="msg info">⏳ Submission closes 1 hour before kickoff (${start.toLocaleString()}). Build your prediction in the simulator below, then submit.</div>
    <div style="text-align:center;margin:12px 0;">
      <button class="btn btn-purple" onclick="openChampSim()">🎮 Open prediction builder</button>
      ${info.prediction ? `<div class="msg ok" style="margin-top:10px;">✓ You've submitted a prediction. You can update it until the deadline.</div>${renderChampionsView(info.prediction.payload, info.prediction.points)}` : ''}
    </div>
  </div>`;
}

// The Champions prediction reuses the simulator. We open it in an overlay iframe;
// the simulator posts the final payload back via postMessage.
function openChampSim() {
  const ov = document.createElement('div');
  ov.id = 'champOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:1000;background:var(--dark);display:flex;flex-direction:column;';
  ov.innerHTML = `
    <div style="padding:10px 16px;background:var(--dark2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
      <span style="color:var(--purple);font-weight:700;">👑 Build your Champions prediction</span>
      <div>
        <button class="btn btn-gold" onclick="submitChampFromSim()">✓ Submit prediction</button>
        <button class="btn btn-ghost" onclick="closeChampSim()">Cancel</button>
      </div>
    </div>
    <iframe id="champFrame" src="/simulator.html#champions" style="flex:1;border:none;width:100%;"></iframe>`;
  document.body.appendChild(ov);
}
function closeChampSim() { document.getElementById('champOverlay')?.remove(); }
function submitChampFromSim() {
  const frame = document.getElementById('champFrame');
  frame.contentWindow.postMessage({ type: 'GET_CHAMPIONS_PREDICTION' }, '*');
}
window.addEventListener('message', async (ev) => {
  if (ev.data && ev.data.type === 'CHAMPIONS_PREDICTION') {
    const payload = ev.data.payload;
    try {
      await api('/api/champions/submit', { method: 'POST', body: JSON.stringify({ payload }) });
      closeChampSim();
      renderChampionsPredict();
    } catch (e) { alert(e.message); }
  }
});

function renderChampionsView(payload, points) {
  if (!payload) return '<div class="loading">No prediction.</div>';
  const groups = payload.groups || {};
  const groupHtml = Object.keys(groups).sort().map(g => `
    <div class="scoring-card" style="display:block;text-align:left;">
      <b>Group ${g}</b><br>
      ${(groups[g]||[]).map((c,i)=>`${i+1}. ${flag(c,true)} ${c?c.toUpperCase():'—'}`).join('<br>')}
    </div>`).join('');
  const champ = payload.bracket ? payload.bracket['final'] : null;
  return `<div style="margin-top:14px;">
    ${points != null ? `<div class="msg ok">Current points: <b>${points}</b></div>` : ''}
    ${champ ? `<div style="text-align:center;margin-bottom:12px;"><div class="muted">Predicted champion</div><div style="font-size:28px;">${flag(champ)} <b>${champ.toUpperCase()}</b></div></div>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">${groupHtml}</div>
    <div class="muted" style="text-align:center;margin-top:10px;">Best 3rds: ${(payload.best3||[]).map(c=>c.toUpperCase()).join(', ')||'—'}</div>
  </div>`;
}

// ============================================================
// INIT
// ============================================================
// Nothing auto-runs until a mode is chosen. If a token exists, challenge will resume.
