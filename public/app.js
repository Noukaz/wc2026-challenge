// ============================================================
// WORLD CUP 2026 CHALLENGE — Frontend
// ============================================================
const API = '';
let token = localStorage.getItem('wc_token') || null;
let me = null;
let myGroups = [];
let activeGroupId = null;
let matches = [];

// ---------- i18n (English / French) ----------
let LANG = localStorage.getItem('wc_lang') || 'en';
const T = {
  en: {
    home: 'Home', signIn: 'Sign In', createAccount: 'Create Account', signOut: 'Sign out',
    joinChallenge: 'Join the Challenge',
    joinChallengeSub: "Compete with friends and colleagues. First, let's get you in.",
    alreadyHave: 'Already have an account', newHere: 'New here — quick setup',
    noPasswords: 'No passwords.', noPasswordsRest: ' We email you a one-time code each time you sign in.',
    fillDetails: "Fill in your details — we'll send a verification code.",
    enterEmail: "Enter your email — we'll send a sign-in code.",
    nickname: 'Nickname (shown on leaderboards)', fullName: 'Full name', email: 'Email address',
    sendCode: 'Send me a code →', back: '← Back', enterCode: 'Enter your code',
    sentCodeTo: 'We sent a 6-digit code to', expires: 'It expires in 10 minutes.',
    devCodeIs: 'Dev mode — your code is:', verifyCode: 'Verify & continue →',
    diffEmail: '← Use a different email', verificationCode: 'Verification code',
    getInGroup: 'Get into a group',
    groupsSub: 'Groups are how you compete with your friends and colleagues.',
    createGroup: 'Create a Group', createGroupSub: 'Name it & get a share code',
    joinGroup: 'Join a Group', joinGroupSub: 'Enter a code from a friend',
    groupName: 'Group name', groupType: 'Group type', friends: 'Friends', colleagues: 'Colleagues', family: 'Family',
    createGroupBtn: 'Create group →', groupCreated: 'Group created! 🎉',
    shareCode: 'Share this code so they can join',
    copyCode: '📋 Copy code', copied: '✓ Copied!', enterGroup: 'Enter group →',
    groupCode: 'Group code', clear: 'Clear', joinGroupBtn: 'Join group →',
    signedInAs: 'Signed in as', group: 'Group', addGroup: '+ group',
    intlFantasy: '🎯 International Fantasy', champFantasy: '👑 Champions Fantasy',
    myPredictions: '📝 My Predictions', myPrediction: '🔮 My Prediction',
    groupStandings: '👥 Group Standings', globalStandings: '🌍 Global Standings', friendsPicks: "🔍 Friends' Picks",
    intlInfo: 'International Fantasy: predict the exact score of every match. Exact score = 4 pts, correct winner = 2 pts, correct draw = 4 pts, wrong = 0. Edit up to 1 hour before kickoff.',
    champInfo: 'Champions Fantasy: predict the whole tournament. Group 1st 3, 2nd 2, 3rd 1; each best-3rd 3; R32 winner 3, R16 5, QF 10, SF 15, Champion 30. Submit up to 1 hour before the World Cup kicks off.',
    predictAll: '📋 Predict All', saveDay: '💾 Save this day', saveAll: '💾 Save all predictions',
    saved: '✓ Saved!', savedAll: '✓ All saved!', locked: '🔒 LOCKED',
    localTimeShown: 'Times shown in your local time',
    timezone: 'Time zone', vs: 'vs', groupRank: 'Group rank (your prediction)',
    noPlayers: 'No players yet.', globalAll: '🌍 Global — all players',
    matchesScored: 'matches scored', you: '(you)',
    tapFriend: 'Tap a friend to see their predictions', noOtherMembers: 'No other members yet — share your group code!',
    view: 'View →', backFriends: '← Back to friends',
    predictionsLockedMsg: '🔒 Predictions are locked — the tournament has started (or is within 1 hour of kickoff).',
    noPredSubmitted: 'No prediction submitted yet.',
    submissionCloses: 'Submission closes 1 hour before kickoff', buildInSim: 'Build your prediction in the builder, then submit.',
    openBuilder: '🎮 Open prediction builder', submitted: "✓ You've submitted a prediction. You can update it until the deadline.",
    currentPoints: 'Current points:', predictedChamp: '🏆 Predicted champion',
    groupFinish: '📋 Group stage finish', best3rds: 'Best 3rds:', knockoutPath: '🏆 Your knockout path',
    r32w: 'Round of 32 winners', r16w: 'Round of 16 winners', qfw: 'Quarter-final winners', sfw: 'Semi-final winners (finalists)',
    predictAllTitle: 'Predict every match', predictAllSub: 'Fill in all the scores you can, then save everything at once.',
    perDayHint: 'Pick a day, predict its matches, and tap Save.',
    pageTitle: 'Challenge Your Friends', pageSub: 'Fantasy Predictions · World Cup 2026',
    submit: 'Submit', close: 'Close', builder: 'Build your Champions prediction',
  },
  fr: {
    home: 'Accueil', signIn: 'Se connecter', createAccount: 'Créer un compte', signOut: 'Déconnexion',
    joinChallenge: 'Rejoindre le défi',
    joinChallengeSub: "Affrontez vos amis et collègues. D'abord, connectons-vous.",
    alreadyHave: "J'ai déjà un compte", newHere: 'Nouveau ici — inscription rapide',
    noPasswords: 'Aucun mot de passe.', noPasswordsRest: ' Nous envoyons un code à usage unique à chaque connexion.',
    fillDetails: 'Remplissez vos informations — nous enverrons un code.',
    enterEmail: 'Entrez votre e-mail — nous enverrons un code.',
    nickname: 'Surnom (affiché dans les classements)', fullName: 'Nom complet', email: 'Adresse e-mail',
    sendCode: 'Envoyez-moi un code →', back: '← Retour', enterCode: 'Entrez votre code',
    sentCodeTo: 'Code à 6 chiffres envoyé à', expires: 'Il expire dans 10 minutes.',
    devCodeIs: 'Mode test — votre code est :', verifyCode: 'Vérifier et continuer →',
    diffEmail: '← Utiliser un autre e-mail', verificationCode: 'Code de vérification',
    getInGroup: 'Rejoindre un groupe',
    groupsSub: 'Les groupes vous permettent de jouer avec vos amis et collègues.',
    createGroup: 'Créer un groupe', createGroupSub: 'Nommez-le et obtenez un code',
    joinGroup: 'Rejoindre un groupe', joinGroupSub: "Entrez le code d'un ami",
    groupName: 'Nom du groupe', groupType: 'Type de groupe', friends: 'Amis', colleagues: 'Collègues', family: 'Famille',
    createGroupBtn: 'Créer le groupe →', groupCreated: 'Groupe créé ! 🎉',
    shareCode: 'Partagez ce code pour qu’ils rejoignent',
    copyCode: '📋 Copier le code', copied: '✓ Copié !', enterGroup: 'Entrer →',
    groupCode: 'Code du groupe', clear: 'Effacer', joinGroupBtn: 'Rejoindre →',
    signedInAs: 'Connecté :', group: 'Groupe', addGroup: '+ groupe',
    intlFantasy: '🎯 Fantasy International', champFantasy: '👑 Fantasy Champions',
    myPredictions: '📝 Mes pronostics', myPrediction: '🔮 Mon pronostic',
    groupStandings: '👥 Classement du groupe', globalStandings: '🌍 Classement global', friendsPicks: '🔍 Pronostics des amis',
    intlInfo: 'Fantasy International : pronostiquez le score exact de chaque match. Score exact = 4 pts, bon vainqueur = 2 pts, bon nul = 4 pts, faux = 0. Modifiable jusqu’à 1 h avant le coup d’envoi.',
    champInfo: 'Fantasy Champions : pronostiquez tout le tournoi. Groupe 1er 3, 2e 2, 3e 1 ; chaque meilleur 3e 3 ; vainqueur R32 3, R16 5, QF 10, SF 15, Champion 30. À soumettre jusqu’à 1 h avant le début.',
    predictAll: '📋 Tout pronostiquer', saveDay: '💾 Enregistrer ce jour', saveAll: '💾 Tout enregistrer',
    saved: '✓ Enregistré !', savedAll: '✓ Tout enregistré !', locked: '🔒 VERROUILLÉ',
    localTimeShown: 'Heures dans votre fuseau horaire',
    timezone: 'Fuseau', vs: 'vs', groupRank: 'Classement du groupe (votre pronostic)',
    noPlayers: 'Aucun joueur.', globalAll: '🌍 Global — tous les joueurs',
    matchesScored: 'matchs comptés', you: '(vous)',
    tapFriend: 'Touchez un ami pour voir ses pronostics', noOtherMembers: 'Aucun autre membre — partagez votre code !',
    view: 'Voir →', backFriends: '← Retour aux amis',
    predictionsLockedMsg: '🔒 Pronostics verrouillés — le tournoi a commencé (ou est à moins d’1 h du coup d’envoi).',
    noPredSubmitted: 'Aucun pronostic soumis.',
    submissionCloses: 'Clôture 1 h avant le coup d’envoi', buildInSim: 'Construisez votre pronostic, puis soumettez.',
    openBuilder: '🎮 Ouvrir le constructeur', submitted: '✓ Pronostic soumis. Modifiable jusqu’à la date limite.',
    currentPoints: 'Points actuels :', predictedChamp: '🏆 Champion prédit',
    groupFinish: '📋 Classement des groupes', best3rds: 'Meilleurs 3es :', knockoutPath: '🏆 Votre parcours',
    r32w: 'Vainqueurs R32', r16w: 'Vainqueurs R16', qfw: 'Vainqueurs QF', sfw: 'Vainqueurs SF (finalistes)',
    predictAllTitle: 'Pronostiquer tous les matchs', predictAllSub: 'Remplissez tous les scores, puis enregistrez d’un coup.',
    perDayHint: 'Choisissez un jour, pronostiquez, puis Enregistrer.',
    pageTitle: 'Défiez vos amis', pageSub: 'Pronostics Fantasy · Coupe du Monde 2026',
    submit: 'Soumettre', close: 'Fermer', builder: 'Construisez votre pronostic Champions',
  }
};
function t(key) { return (T[LANG] && T[LANG][key]) || T.en[key] || key; }
function setLang(l) { LANG = l; localStorage.setItem('wc_lang', l); renderChallenge(); }

// ---------- helpers ----------
function flag(code, sm) { if (!code) return ''; return `<img class="${sm ? 'flag-sm' : 'flag'}" src="https://flagcdn.com/w40/${code}.png" alt="">`; }
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
function localTime(utc) { return new Date(utc).toLocaleTimeString(LANG === 'fr' ? 'fr-FR' : [], { hour: '2-digit', minute: '2-digit' }); }
function localDateLabel(utc) { return new Date(utc).toLocaleDateString(LANG === 'fr' ? 'fr-FR' : [], { weekday: 'long', month: 'long', day: 'numeric' }); }
function localDateKey(utc) { return new Date(utc).toLocaleDateString('en-CA'); }
function shortLabel(key) { return new Date(key + 'T12:00:00').toLocaleDateString(LANG === 'fr' ? 'fr-FR' : [], { month: 'short', day: 'numeric' }); }
function roundShort(r) { return ({ 4: 'R32', 5: 'R16', 6: 'QF', 7: 'SF', 8: 'FINAL' })[r] || 'KO'; }
function langToggle() {
  return `<div class="lang-toggle"><button class="${LANG==='en'?'active':''}" onclick="setLang('en')">EN</button><button class="${LANG==='fr'?'active':''}" onclick="setLang('fr')">FR</button></div>`;
}

// ---------- MODE SWITCHING ----------
function enterMode(mode) {
  document.getElementById('landing').classList.add('hidden');
  ['sim', 'live', 'challenge'].forEach(m => document.getElementById('mode-' + m).classList.toggle('active', m === mode));
  if (mode === 'sim') { const f = document.getElementById('simFrame'); if (!f.src) f.src = '/simulator.html'; }
  else if (mode === 'live') { const f = document.getElementById('liveFrame'); if (!f.src) f.src = '/simulator.html#live'; }
  else if (mode === 'challenge') { renderChallenge(); }
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
  if (!token) { renderAuthChoice(); return; }
  try { me = await api('/api/me'); } catch { token = null; localStorage.removeItem('wc_token'); renderAuthChoice(); return; }
  if (!me) { token = null; localStorage.removeItem('wc_token'); renderAuthChoice(); return; }
  await loadGroups();
  if (!myGroups.length) { renderGroupChoice(); return; }
  renderDashboard();
}

// ---- AUTH ----
function renderAuthChoice() {
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="center-box"><div class="panel">
      <h2>${t('joinChallenge')}</h2>
      <div class="sub">${t('joinChallengeSub')}</div>
      <div class="choice-row">
        <div class="choice" onclick="renderAuthForm('signin')"><div class="ci">🔑</div><h3>${t('signIn')}</h3><p>${t('alreadyHave')}</p></div>
        <div class="choice" onclick="renderAuthForm('signup')"><div class="ci">✨</div><h3>${t('createAccount')}</h3><p>${t('newHere')}</p></div>
      </div>
      <div class="info-box" style="margin:16px 0 0;">🔒 <strong>${t('noPasswords')}</strong>${t('noPasswordsRest')}</div>
    </div></div>`;
}
function renderAuthForm(kind) {
  const isSignup = kind === 'signup';
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="center-box"><div class="panel">
      <h2>${isSignup ? t('createAccount') : t('signIn')}</h2>
      <div class="sub">${isSignup ? t('fillDetails') : t('enterEmail')}</div>
      <div id="authMsg"></div>
      ${isSignup ? `
        <label class="label">${t('nickname')}</label>
        <input class="input" id="f_nick" placeholder="Mehdi" autocomplete="nickname">
        <label class="label">${t('fullName')}</label>
        <input class="input" id="f_full" placeholder="Mehdi Noukaz" autocomplete="name">` : ''}
      <label class="label">${t('email')}</label>
      <input class="input" id="f_email" type="email" inputmode="email" autocomplete="email" placeholder="you@example.com">
      <button class="btn btn-purple" style="width:100%" id="reqBtn" onclick="requestOtp(${isSignup})">${t('sendCode')}</button>
      <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderAuthChoice()">${t('back')}</span></div>
    </div></div>`;
}
let pendingAuth = {};
async function requestOtp(isSignup) {
  const email = document.getElementById('f_email').value.trim();
  const msg = document.getElementById('authMsg'); msg.innerHTML = '';
  if (!email || !email.includes('@')) { msg.innerHTML = `<div class="msg err">${t('email')}</div>`; return; }
  const nick = isSignup ? document.getElementById('f_nick').value.trim() : '';
  const full = isSignup ? document.getElementById('f_full').value.trim() : '';
  if (isSignup && (!nick || !full)) { msg.innerHTML = `<div class="msg err">${t('nickname')} / ${t('fullName')}</div>`; return; }
  pendingAuth = { email, nickname: nick, fullName: full, isSignup };
  const btn = document.getElementById('reqBtn'); btn.disabled = true; btn.textContent = '…';
  try { const r = await api('/api/auth/request-otp', { method: 'POST', body: JSON.stringify({ email }) }); renderOtpForm(r.devCode); }
  catch (e) { msg.innerHTML = `<div class="msg err">${e.message}</div>`; btn.disabled = false; btn.textContent = t('sendCode'); }
}
function renderOtpForm(devCode) {
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="center-box"><div class="panel">
      <h2>${t('enterCode')}</h2>
      <div class="sub">${t('sentCodeTo')} <b>${pendingAuth.email}</b>. ${t('expires')}</div>
      <div id="otpMsg"></div>
      ${devCode ? `<div class="dev-code">${t('devCodeIs')}<br><b>${devCode}</b></div>` : ''}
      <label class="label">${t('verificationCode')}</label>
      <input class="input" id="f_otp" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" placeholder="______" style="letter-spacing:10px;text-align:center;font-size:22px;">
      <button class="btn btn-purple" style="width:100%" id="verBtn" onclick="verifyOtp()">${t('verifyCode')}</button>
      <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderAuthForm(pendingAuth.isSignup?'signup':'signin')">${t('diffEmail')}</span></div>
    </div></div>`;
  if (devCode) document.getElementById('f_otp').value = devCode;
}
async function verifyOtp() {
  const code = document.getElementById('f_otp').value.trim();
  const msg = document.getElementById('otpMsg'); msg.innerHTML = '';
  if (code.length < 4) { msg.innerHTML = `<div class="msg err">${t('verificationCode')}</div>`; return; }
  const btn = document.getElementById('verBtn'); btn.disabled = true; btn.textContent = '…';
  try {
    const r = await api('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: pendingAuth.email, code, nickname: pendingAuth.nickname, fullName: pendingAuth.fullName }) });
    token = r.token; localStorage.setItem('wc_token', token); me = r.user; await renderChallenge();
  } catch (e) {
    if (e.message && e.message.includes('needs nickname')) { msg.innerHTML = `<div class="msg err">${t('newHere')}</div>`; setTimeout(() => renderAuthForm('signup'), 1200); }
    else { msg.innerHTML = `<div class="msg err">${e.message}</div>`; btn.disabled = false; btn.textContent = t('verifyCode'); }
  }
}
function signOut() { token = null; me = null; myGroups = []; activeGroupId = null; localStorage.removeItem('wc_token'); renderAuthChoice(); }

// ---- GROUPS ----
async function loadGroups() {
  const r = await api('/api/groups/mine');
  myGroups = r.groups || [];
  if (myGroups.length && !activeGroupId) activeGroupId = myGroups[0].id;
}
function kindLabel(k) { return ({ friends: '👥 ' + t('friends'), colleagues: '💼 ' + t('colleagues'), family: '👨‍👩‍👧 ' + t('family') })[k] || ('👥 ' + t('friends')); }

function renderGroupChoice() {
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="userbar">${t('signedInAs')} <b>${me.nickname}</b> · <span style="cursor:pointer;color:var(--purple)" onclick="signOut()">${t('signOut')}</span></div>
    <div class="center-box"><div class="panel">
      <h2>${t('getInGroup')}</h2>
      <div class="sub">${t('groupsSub')}</div>
      <div class="choice-row">
        <div class="choice" onclick="renderCreateGroup()"><div class="ci">➕</div><h3>${t('createGroup')}</h3><p>${t('createGroupSub')}</p></div>
        <div class="choice" onclick="renderJoinGroup()"><div class="ci">🔗</div><h3>${t('joinGroup')}</h3><p>${t('joinGroupSub')}</p></div>
      </div>
    </div></div>`;
}
let newGroupKind = 'friends';
function renderCreateGroup() {
  newGroupKind = 'friends';
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="center-box"><div class="panel">
      <h2>${t('createGroup')}</h2><div class="sub">${t('createGroupSub')}</div>
      <div id="grpMsg"></div>
      <label class="label">${t('groupName')}</label>
      <input class="input" id="f_gname" placeholder="Office League 2026">
      <label class="label">${t('groupType')}</label>
      <div class="choice-row" id="kindRow" style="margin-bottom:14px;">
        <div class="kind-opt active" data-k="friends" onclick="pickKind('friends')">👥 ${t('friends')}</div>
        <div class="kind-opt" data-k="colleagues" onclick="pickKind('colleagues')">💼 ${t('colleagues')}</div>
        <div class="kind-opt" data-k="family" onclick="pickKind('family')">👨‍👩‍👧 ${t('family')}</div>
      </div>
      <button class="btn btn-purple" style="width:100%" id="createBtn" onclick="doCreateGroup()">${t('createGroupBtn')}</button>
      <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderGroupChoice()">${t('back')}</span></div>
    </div></div>`;
}
function pickKind(k) { newGroupKind = k; document.querySelectorAll('#kindRow .kind-opt').forEach(el => el.classList.toggle('active', el.dataset.k === k)); }
async function doCreateGroup() {
  const name = document.getElementById('f_gname').value.trim();
  const msg = document.getElementById('grpMsg');
  if (!name) { msg.innerHTML = `<div class="msg err">${t('groupName')}</div>`; return; }
  const btn = document.getElementById('createBtn'); btn.disabled = true; btn.textContent = '…';
  try {
    const r = await api('/api/groups/create', { method: 'POST', body: JSON.stringify({ name, kind: newGroupKind }) });
    document.getElementById('challengeBody').innerHTML = `
      ${langToggle()}
      <div class="center-box"><div class="panel" style="text-align:center;">
        <h2>${t('groupCreated')}</h2>
        <div class="sub">${t('shareCode')} <b>${r.group.name}</b> (${kindLabel(r.group.kind)}):</div>
        <div class="code-display"><div class="code">${r.group.code}</div></div>
        <button class="btn btn-ghost" id="copyBtn" onclick="copyCode('${r.group.code}')">${t('copyCode')}</button>
        <button class="btn btn-purple" style="width:100%;margin-top:12px;" onclick="afterGroup(${r.group.id})">${t('enterGroup')}</button>
      </div></div>`;
  } catch (e) { msg.innerHTML = `<div class="msg err">${e.message}</div>`; btn.disabled = false; btn.textContent = t('createGroupBtn'); }
}
function copyCode(c) { navigator.clipboard?.writeText(c); const b = document.getElementById('copyBtn'); if (b) { b.textContent = t('copied'); setTimeout(() => b.textContent = t('copyCode'), 1500); } }
function renderJoinGroup() {
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="center-box"><div class="panel">
      <h2>${t('joinGroup')}</h2><div class="sub">${t('joinGroupSub')}</div>
      <div id="joinMsg"></div>
      <label class="label">${t('groupCode')}</label>
      <div style="display:flex;gap:8px;">
        <input class="input" id="f_gcode" maxlength="6" autocapitalize="characters" autocomplete="off" placeholder="ABC123" style="letter-spacing:6px;text-align:center;text-transform:uppercase;font-size:20px;margin-bottom:0;">
        <button class="btn btn-ghost" type="button" onclick="document.getElementById('f_gcode').value=''" style="white-space:nowrap;">${t('clear')}</button>
      </div>
      <button class="btn btn-purple" style="width:100%;margin-top:12px;" id="joinBtn" onclick="doJoinGroup()">${t('joinGroupBtn')}</button>
      <div style="text-align:center;margin-top:14px;"><span class="muted" style="cursor:pointer" onclick="renderGroupChoice()">${t('back')}</span></div>
    </div></div>`;
}
async function doJoinGroup() {
  const code = document.getElementById('f_gcode').value.trim().toUpperCase();
  const msg = document.getElementById('joinMsg');
  if (code.length < 4) { msg.innerHTML = `<div class="msg err">${t('groupCode')}</div>`; return; }
  const btn = document.getElementById('joinBtn'); btn.disabled = true; btn.textContent = '…';
  try { const r = await api('/api/groups/join', { method: 'POST', body: JSON.stringify({ code }) }); afterGroup(r.group.id); }
  catch (e) { msg.innerHTML = `<div class="msg err">${e.message}</div>`; btn.disabled = false; btn.textContent = t('joinGroupBtn'); }
}
async function afterGroup(id) { await loadGroups(); activeGroupId = id; renderDashboard(); }

// ============================================================
// DASHBOARD
// ============================================================
let currentComp = 'international';
let currentSub = 'predict';
async function renderDashboard() {
  if (!matches.length) { try { const r = await api('/api/matches'); matches = r.matches; } catch {} }
  document.getElementById('challengeBody').innerHTML = `
    ${langToggle()}
    <div class="userbar">
      <span>${t('signedInAs')} <b>${me.nickname}</b></span> · <span>${t('group')}:</span>
      ${myGroups.map(g => `<span class="group-chip ${g.id===activeGroupId?'active':''}" onclick="switchGroup(${g.id})">${kindLabel(g.kind)} ${g.name} <b>(${g.code})</b></span>`).join('')}
      <span class="group-chip" onclick="renderGroupChoice()">${t('addGroup')}</span>
      <span style="cursor:pointer;color:var(--purple)" onclick="signOut()">${t('signOut')}</span>
    </div>
    <div class="tabs">
      <button class="tab ${currentComp==='international'?'active':''}" onclick="setComp('international')">${t('intlFantasy')}</button>
      <button class="tab ${currentComp==='champions'?'active':''}" onclick="setComp('champions')">${t('champFantasy')}</button>
    </div>
    <div id="compBody"></div>`;
  renderComp();
}
function switchGroup(id) { activeGroupId = id; renderDashboard(); }
function setComp(c) { currentComp = c; currentSub = 'predict'; renderDashboard(); }
function renderComp() { if (currentComp === 'international') renderInternational(); else renderChampions(); }
function setSub(s) { currentSub = s; renderComp(); }

// ============================================================
// INTERNATIONAL FANTASY
// ============================================================
let myMatchPreds = {};
let liveDayKey = null;
let dirtyPreds = {};
async function renderInternational() {
  document.getElementById('compBody').innerHTML = `
    <div class="info-box">🎯 <strong>${t('intlInfo')}</strong></div>
    <div class="sub-tabs">
      <button class="sub-tab ${currentSub==='all'?'active':''}" onclick="setSub('all')">${t('predictAll')}</button>
      <button class="sub-tab ${currentSub==='predict'?'active':''}" onclick="setSub('predict')">${t('myPredictions')}</button>
      <button class="sub-tab ${currentSub==='group'?'active':''}" onclick="setSub('group')">${t('groupStandings')}</button>
      <button class="sub-tab ${currentSub==='global'?'active':''}" onclick="setSub('global')">${t('globalStandings')}</button>
      <button class="sub-tab ${currentSub==='friends'?'active':''}" onclick="setSub('friends')">${t('friendsPicks')}</button>
    </div>
    <div id="subBody"></div>`;
  if (currentSub === 'predict') renderMatchPredict();
  else if (currentSub === 'all') renderPredictAll();
  else if (currentSub === 'group') renderStandings('international', activeGroupId);
  else if (currentSub === 'global') renderStandings('international', null);
  else if (currentSub === 'friends') renderFriendsList('international');
}
async function loadMyMatchPreds() {
  try { const r = await api('/api/predictions/match'); myMatchPreds = {}; r.predictions.forEach(p => myMatchPreds[p.match_number] = p); } catch {}
}

// Stages group the tournament into clickable sections; each expands to day-by-day tabs.
const STAGE_DEFS = [
  { id: 'group', label: { en: 'Group Stage', fr: 'Phase de groupes' }, rounds: [1, 2, 3] },
  { id: 'r32', label: { en: 'Round of 32', fr: '16es de finale' }, rounds: [4] },
  { id: 'r16', label: { en: 'Round of 16', fr: '8es de finale' }, rounds: [5] },
  { id: 'qf', label: { en: 'Quarter-finals', fr: 'Quarts' }, rounds: [6] },
  { id: 'sf', label: { en: 'Semi-finals', fr: 'Demi-finales' }, rounds: [7] },
  { id: 'final', label: { en: 'Final & 3rd place', fr: 'Finale & 3e place' }, rounds: [8] },
];
function stageLabel(s) { return s.label[LANG] || s.label.en; }
function stageOfRound(r) { return STAGE_DEFS.find(s => s.rounds.includes(r)) || STAGE_DEFS[0]; }
function stagesWithMatches() {
  return STAGE_DEFS.filter(s => matches.some(m => s.rounds.includes(m.round_number)));
}
function daysInStage(stage) {
  const seen = [];
  matches.filter(m => stage.rounds.includes(m.round_number))
    .sort((a, b) => new Date(a.date_utc) - new Date(b.date_utc))
    .forEach(m => { const k = localDateKey(m.date_utc); if (!seen.includes(k)) seen.push(k); });
  return seen;
}
let currentStage = null;
async function renderMatchPredict() {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  await loadMyMatchPreds();
  const stages = stagesWithMatches();
  // Default stage = the one containing today, else first
  if (!currentStage) {
    const todayKey = new Date().toLocaleDateString('en-CA');
    const todayMatch = [...matches].sort((a,b)=>new Date(a.date_utc)-new Date(b.date_utc))
      .find(m => localDateKey(m.date_utc) >= todayKey);
    currentStage = todayMatch ? stageOfRound(todayMatch.round_number).id : stages[0].id;
  }
  const stageTabs = stages.map(s =>
    `<button class="md-tab ${s.id===currentStage?'active':''}" onclick="setStage('${s.id}')">${stageLabel(s)}</button>`
  ).join('');
  sb.innerHTML = `
    <div class="muted" style="text-align:center;padding:6px 16px 0;">🌍 ${t('localTimeShown')} (${userTZ})</div>
    <div class="md-tabs" style="padding:8px 16px 4px;">${stageTabs}</div>
    <div id="dayTabsWrap" style="padding:0 16px;"></div>
    <div class="list" id="dayList"></div>`;
  renderStageDays();
}
function setStage(id) {
  currentStage = id;
  liveDayKey = null; // reset day selection within the new stage
  renderMatchPredict();
}
function renderStageDays() {
  const stage = STAGE_DEFS.find(s => s.id === currentStage);
  const days = daysInStage(stage);
  if (!liveDayKey || !days.includes(liveDayKey)) {
    const todayKey = new Date().toLocaleDateString('en-CA');
    liveDayKey = days.find(d => d >= todayKey) || days[0];
  }
  const dayTabs = days.map(k =>
    `<button class="md-tab ${k===liveDayKey?'active':''}" onclick="setLiveDay('${k}')">${shortLabel(k)}</button>`
  ).join('');
  const wrap = document.getElementById('dayTabsWrap');
  if (wrap) wrap.innerHTML = `<div class="md-tabs" style="margin-top:4px;border-top:1px solid var(--border);padding-top:8px;">${dayTabs}</div>`;
  renderDayMatches();
}
function setLiveDay(d) { liveDayKey = d; renderStageDaysActiveOnly(); }
function renderStageDaysActiveOnly() {
  // just re-highlight day tabs + re-render matches (no full rebuild)
  const stage = STAGE_DEFS.find(s => s.id === currentStage);
  const days = daysInStage(stage);
  const wrap = document.getElementById('dayTabsWrap');
  if (wrap) wrap.innerHTML = `<div class="md-tabs" style="margin-top:4px;border-top:1px solid var(--border);padding-top:8px;">${
    days.map(k => `<button class="md-tab ${k===liveDayKey?'active':''}" onclick="setLiveDay('${k}')">${shortLabel(k)}</button>`).join('')
  }</div>`;
  renderDayMatches();
}
function predLocked(m) { return Date.now() >= new Date(m.date_utc).getTime() - 3600000; }
function renderDayMatches() {
  const list = document.getElementById('dayList');
  const dayMatches = matches.filter(m => localDateKey(m.date_utc) === liveDayKey);
  const groupsToday = [...new Set(dayMatches.filter(m => m.grp).map(m => m.grp))].sort();
  dirtyPreds = {};
  let html = `<div class="day-title">${localDateLabel(dayMatches[0].date_utc)}</div>`;
  dayMatches.forEach(m => { html += matchPredRow(m); });
  const anyEditable = dayMatches.some(m => m.round_number <= 3 && !predLocked(m));
  if (anyEditable) {
    html += `<div style="text-align:center;margin:14px 0;">
      <button class="btn btn-purple" id="saveDayBtn" onclick="saveDay()">${t('saveDay')}</button>
      <span id="saveDayMsg" class="muted" style="margin-left:10px;"></span></div>`;
  }
  if (groupsToday.length) html += `<div id="dayRanks"></div>`;
  list.innerHTML = html;
  if (groupsToday.length) renderDayGroupRanks(groupsToday);
}
function matchPredRow(m) {
  const isKO = m.round_number > 3;
  const locked = predLocked(m);
  const finished = m.finished;
  const pred = myMatchPreds[m.match_number];
  const grpBadge = isKO ? roundShort(m.round_number) : ('GRP ' + (m.grp || ''));
  let center;
  if (isKO) { center = `<div class="si"><span class="sep" style="font-size:11px;color:var(--muted)">${t('vs')}</span></div>`; }
  else {
    const ph = pred ? pred.pred_home : ''; const pa = pred ? pred.pred_away : '';
    center = `<div class="si">
      <input class="sib ${locked?'locked':''}" type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="30" value="${ph}" ${locked?'disabled':''} oninput="markDirty(${m.match_number})" id="ph${m.match_number}">
      <span class="sep">:</span>
      <input class="sib ${locked?'locked':''}" type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="30" value="${pa}" ${locked?'disabled':''} oninput="markDirty(${m.match_number})" id="pa${m.match_number}">
    </div>`;
  }
  const right = finished
    ? `<span class="pts-badge">${pred && pred.points != null ? '+' + pred.points : '–'}<br><span style="font-size:9px;color:var(--muted)">${m.home_score}-${m.away_score}</span></span>`
    : (locked && !isKO ? `<span class="lock-badge">${t('locked')}</span>` : '');
  return `<div class="match-row">
    <span class="mn">#${m.match_number}</span><span class="gb">${grpBadge}</span>
    <div class="tc"><div class="t">${localTime(m.date_utc)}</div><div class="d">${m.date_utc.slice(5,10).replace('-','/')}</div></div>
    <div class="teams">
      <div class="tm"><span class="tn" style="text-align:right">${m.home_team}</span>${flag(m.home_code,true)}</div>
      ${center}
      <div class="tm r">${flag(m.away_code,true)}<span class="tn">${m.away_team}</span></div>
    </div>${right}
  </div>`;
}
function markDirty(matchNumber) {
  const ph = document.getElementById('ph' + matchNumber); const pa = document.getElementById('pa' + matchNumber);
  if (!ph || !pa) return;
  dirtyPreds[matchNumber] = { home: ph.value, away: pa.value };
  const dayMatches = matches.filter(m => localDateKey(m.date_utc) === liveDayKey);
  const groupsToday = [...new Set(dayMatches.filter(m => m.grp).map(m => m.grp))].sort();
  if (groupsToday.length && document.getElementById('dayRanks')) renderDayGroupRanks(groupsToday);
}
async function saveDay() {
  const btn = document.getElementById('saveDayBtn'); const msg = document.getElementById('saveDayMsg');
  if (btn) { btn.disabled = true; btn.textContent = '…'; }
  const dayMatches = matches.filter(m => localDateKey(m.date_utc) === liveDayKey);
  let saved = 0;
  for (const m of dayMatches) {
    if (m.round_number > 3 || predLocked(m)) continue;
    const ph = document.getElementById('ph' + m.match_number); const pa = document.getElementById('pa' + m.match_number);
    if (!ph || !pa || ph.value === '' || pa.value === '') continue;
    try { await api('/api/predictions/match', { method: 'POST', body: JSON.stringify({ matchNumber: m.match_number, home: parseInt(ph.value), away: parseInt(pa.value) }) });
      myMatchPreds[m.match_number] = { match_number: m.match_number, pred_home: parseInt(ph.value), pred_away: parseInt(pa.value) }; saved++; } catch (e) {}
  }
  dirtyPreds = {};
  if (btn) { btn.disabled = false; btn.textContent = t('saveDay'); }
  if (msg) { msg.textContent = t('saved') + ' (' + saved + ')'; setTimeout(() => msg.textContent = '', 2500); }
}
function computePredictedRanks(groupLetters) {
  const std = {};
  matches.filter(m => m.round_number <= 3 && m.grp).forEach(m => {
    if (!std[m.grp]) std[m.grp] = {};
    [[m.home_team, m.home_code], [m.away_team, m.away_code]].forEach(([n, c]) => { if (!std[m.grp][n]) std[m.grp][n] = { name: n, code: c, pts: 0, gf: 0, gd: 0, mp: 0 }; });
  });
  matches.filter(m => m.round_number <= 3 && m.grp).forEach(m => {
    let hs, as; const d = dirtyPreds[m.match_number]; const p = myMatchPreds[m.match_number];
    if (d && d.home !== '' && d.away !== '') { hs = parseInt(d.home); as = parseInt(d.away); }
    else if (p) { hs = p.pred_home; as = p.pred_away; } else return;
    if (isNaN(hs) || isNaN(as)) return;
    const H = std[m.grp][m.home_team], A = std[m.grp][m.away_team];
    H.mp++; A.mp++; H.gf += hs; H.gd += hs - as; A.gf += as; A.gd += as - hs;
    if (hs > as) H.pts += 3; else if (hs < as) A.pts += 3; else { H.pts++; A.pts++; }
  });
  const out = {};
  groupLetters.forEach(g => { const rows = Object.values(std[g] || {}); rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.name.localeCompare(b.name)); out[g] = rows; });
  return out;
}
function renderDayGroupRanks(groupLetters) {
  const box = document.getElementById('dayRanks'); if (!box) return;
  const ranks = computePredictedRanks(groupLetters);
  box.innerHTML = `<div class="day-title" style="margin-top:16px;">📊 ${t('groupRank')} — ${groupLetters.join(', ')}</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
    ${groupLetters.map(g => {
      const rows = ranks[g] || []; const anyMp = rows.some(r => r.mp > 0);
      return `<div class="scoring-card" style="display:block;text-align:left;min-width:150px;">
        <b>${t('group')} ${g}</b><br>
        ${rows.map((r, i) => `${i + 1}. ${flag(r.code, true)} ${r.name} ${anyMp ? `<span class="muted">(${r.pts})</span>` : ''}`).join('<br>')}
      </div>`;
    }).join('')}</div>`;
}
// PREDICT ALL
async function renderPredictAll() {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  await loadMyMatchPreds();
  const groupMatches = matches.filter(m => m.round_number <= 3).sort((a, b) => new Date(a.date_utc) - new Date(b.date_utc));
  const byDay = {}; groupMatches.forEach(m => { const k = localDateKey(m.date_utc); (byDay[k] = byDay[k] || []).push(m); });
  let html = `<div class="info-box">📋 <strong>${t('predictAllTitle')}.</strong> ${t('predictAllSub')}</div>
    <div style="text-align:center;margin:10px 0;"><button class="btn btn-purple" id="saveAllBtn" onclick="saveAll()">${t('saveAll')}</button>
    <span id="saveAllMsg" class="muted" style="margin-left:10px;"></span></div><div class="list">`;
  Object.keys(byDay).sort().forEach(k => { html += `<div class="day-title">${localDateLabel(byDay[k][0].date_utc)}</div>`; byDay[k].forEach(m => { html += matchPredRow(m); }); });
  html += `<div style="text-align:center;margin:16px 0;"><button class="btn btn-purple" onclick="saveAll()">${t('saveAll')}</button></div></div>`;
  sb.innerHTML = html;
}
async function saveAll() {
  const b = document.getElementById('saveAllBtn'); if (b) { b.disabled = true; b.textContent = '…'; }
  const groupMatches = matches.filter(m => m.round_number <= 3); let saved = 0;
  for (const m of groupMatches) {
    if (predLocked(m)) continue;
    const ph = document.getElementById('ph' + m.match_number); const pa = document.getElementById('pa' + m.match_number);
    if (!ph || !pa || ph.value === '' || pa.value === '') continue;
    try { await api('/api/predictions/match', { method: 'POST', body: JSON.stringify({ matchNumber: m.match_number, home: parseInt(ph.value), away: parseInt(pa.value) }) });
      myMatchPreds[m.match_number] = { match_number: m.match_number, pred_home: parseInt(ph.value), pred_away: parseInt(pa.value) }; saved++; } catch (e) {}
  }
  if (b) { b.disabled = false; b.textContent = t('saveAll'); }
  const msg = document.getElementById('saveAllMsg'); if (msg) { msg.textContent = t('savedAll') + ' (' + saved + ')'; setTimeout(() => msg.textContent = '', 3000); }
}
// STANDINGS
async function renderStandings(comp, groupId) {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  try {
    const q = groupId ? ('?groupId=' + groupId) : '';
    const r = await api(`/api/standings/${comp}${q}`);
    const rows = r.standings || [];
    if (!rows.length) { sb.innerHTML = `<div class="loading">${t('noPlayers')}</div>`; return; }
    sb.innerHTML = `<div class="standings-table">
      ${groupId ? `<div class="muted" style="text-align:center;margin-bottom:10px;">${t('group')}: <b>${myGroups.find(g=>g.id===groupId)?.name||''}</b></div>` : `<div class="muted" style="text-align:center;margin-bottom:10px;">${t('globalAll')}</div>`}
      ${rows.map((row, i) => `<div class="st-row ${row.id===me.id?'me':''}">
        <div class="st-rank">${i+1}</div>
        <div class="st-name">${row.nickname}${row.id===me.id?' <span class="muted">'+t('you')+'</span>':''}${row.scored!=null?` <div class="st-sub">${row.scored} ${t('matchesScored')}</div>`:''}</div>
        <div class="st-pts">${row.points}</div></div>`).join('')}
    </div>`;
  } catch (e) { sb.innerHTML = `<div class="msg err" style="margin:16px;">${e.message}</div>`; }
}
// FRIENDS
async function renderFriendsList(comp) {
  const sb = document.getElementById('subBody');
  sb.innerHTML = `<div class="loading"><span class="spinner"></span></div>`;
  try {
    const r = await api(`/api/groups/${activeGroupId}/members`);
    const members = (r.members || []).filter(m => m.id !== me.id);
    if (!members.length) { sb.innerHTML = `<div class="loading">${t('noOtherMembers')}</div>`; return; }
    sb.innerHTML = `<div class="list"><div class="muted" style="text-align:center;margin-bottom:10px;">${t('tapFriend')}</div>
      ${members.map(mem => `<div class="match-row" style="cursor:pointer" onclick="viewFriend(${mem.id},'${mem.nickname.replace(/'/g,"")}','${comp}')">
        <div class="teams"><div class="tm" style="justify-content:flex-start;"><b>${mem.nickname}</b> <span class="muted">${mem.full_name}</span></div></div>
        <span class="muted">${t('view')}</span></div>`).join('')}
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
        rows += `<div class="match-row"><span class="mn">#${m.match_number}</span>
          <div class="teams"><div class="tm"><span class="tn" style="text-align:right">${m.home_team}</span>${flag(m.home_code,true)}</div>
          <div class="si"><span class="sib" style="display:inline-flex;align-items:center;justify-content:center;">${p?p.pred_home:'–'}</span><span class="sep">:</span><span class="sib" style="display:inline-flex;align-items:center;justify-content:center;">${p?p.pred_away:'–'}</span></div>
          <div class="tm r">${flag(m.away_code,true)}<span class="tn">${m.away_team}</span></div></div>
          ${p&&p.points!=null?`<span class="pts-badge">+${p.points}</span>`:''}</div>`;
      });
      sb.innerHTML = `<div class="list"><div class="day-title">${nick}</div><div style="text-align:center;margin-bottom:8px;"><span class="muted" style="cursor:pointer" onclick="renderFriendsList('international')">${t('backFriends')}</span></div>${rows}</div>`;
    } else {
      const r = await api(`/api/champions/${userId}`);
      sb.innerHTML = `<div class="list"><div class="day-title">${nick}</div>
        <div style="text-align:center;margin-bottom:8px;"><span class="muted" style="cursor:pointer" onclick="renderFriendsList('champions')">${t('backFriends')}</span></div>
        ${r.prediction ? renderChampionsView(r.prediction.payload, r.prediction.points) : `<div class="loading">${t('noPredSubmitted')}</div>`}</div>`;
    }
  } catch (e) { sb.innerHTML = `<div class="msg err" style="margin:16px;">${e.message}</div>`; }
}

// ============================================================
// CHAMPIONS FANTASY
// ============================================================
let lastChampPayload = null;
async function renderChampions() {
  document.getElementById('compBody').innerHTML = `
    <div class="info-box">👑 <strong>${t('champInfo')}</strong></div>
    <div class="sub-tabs">
      <button class="sub-tab ${currentSub==='predict'?'active':''}" onclick="setSub('predict')">${t('myPrediction')}</button>
      <button class="sub-tab ${currentSub==='group'?'active':''}" onclick="setSub('group')">${t('groupStandings')}</button>
      <button class="sub-tab ${currentSub==='global'?'active':''}" onclick="setSub('global')">${t('globalStandings')}</button>
      <button class="sub-tab ${currentSub==='friends'?'active':''}" onclick="setSub('friends')">${t('friendsPicks')}</button>
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
  lastChampPayload = info.prediction ? info.prediction.payload : null;
  const start = new Date(info.wcStart);
  if (info.locked) {
    sb.innerHTML = `<div class="list"><div class="msg info">${t('predictionsLockedMsg')}</div>
      ${info.prediction ? renderChampionsView(info.prediction.payload, info.prediction.points) : `<div class="loading">${t('noPredSubmitted')}</div>`}</div>`;
    return;
  }
  sb.innerHTML = `<div class="list">
    <div class="msg info">⏳ ${t('submissionCloses')} (${start.toLocaleString(LANG==='fr'?'fr-FR':[])}). ${t('buildInSim')}</div>
    <div style="text-align:center;margin:12px 0;">
      <button class="btn btn-purple" onclick="openChampSim()">${t('openBuilder')}</button>
      ${info.prediction ? `<div class="msg ok" style="margin-top:10px;">${t('submitted')}</div>${renderChampionsView(info.prediction.payload, info.prediction.points)}` : ''}
    </div></div>`;
}
function openChampSim() {
  const ov = document.createElement('div');
  ov.id = 'champOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:1000;background:var(--dark);display:flex;flex-direction:column;';
  ov.innerHTML = `
    <div style="padding:10px 16px;background:var(--dark2);border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
      <span style="color:var(--purple);font-weight:700;">👑 ${t('builder')}</span>
      <div><button class="btn btn-gold" onclick="submitChampFromSim()">✓ ${t('submit')}</button>
      <button class="btn btn-ghost" onclick="closeChampSim()">${t('close')}</button></div>
    </div>
    <iframe id="champFrame" src="/simulator.html#champions" style="flex:1;border:none;width:100%;"></iframe>`;
  document.body.appendChild(ov);
  const frame = document.getElementById('champFrame');
  frame.addEventListener('load', () => { if (lastChampPayload) frame.contentWindow.postMessage({ type: 'LOAD_CHAMPIONS_PREDICTION', payload: lastChampPayload }, '*'); });
}
function closeChampSim() {
  const frame = document.getElementById('champFrame');
  if (frame) frame.contentWindow.postMessage({ type: 'GET_CHAMPIONS_PREDICTION', autoSave: true }, '*');
  else document.getElementById('champOverlay')?.remove();
}
function submitChampFromSim() {
  const frame = document.getElementById('champFrame');
  frame.contentWindow.postMessage({ type: 'GET_CHAMPIONS_PREDICTION' }, '*');
}
window.addEventListener('message', async (ev) => {
  if (ev.data && ev.data.type === 'CHAMPIONS_PREDICTION') {
    const payload = ev.data.payload;
    try { await api('/api/champions/submit', { method: 'POST', body: JSON.stringify({ payload }) }); lastChampPayload = payload; }
    catch (e) { if (!ev.data.autoSave) alert(e.message); }
    document.getElementById('champOverlay')?.remove();
    if (currentComp === 'champions') renderChampionsPredict();
  }
});
// ---- Champions bracket graphic data (mirrors the simulator) ----
const CH_BRACKET_TREE = {
  r16_1: ['r32_1', 'r32_2'], r16_2: ['r32_3', 'r32_4'], r16_3: ['r32_5', 'r32_6'], r16_4: ['r32_7', 'r32_8'],
  r16_5: ['r32_9', 'r32_10'], r16_6: ['r32_11', 'r32_12'], r16_7: ['r32_13', 'r32_14'], r16_8: ['r32_15', 'r32_16'],
  qf_1: ['r16_1', 'r16_2'], qf_2: ['r16_3', 'r16_4'], qf_3: ['r16_5', 'r16_6'], qf_4: ['r16_7', 'r16_8'],
  sf_1: ['qf_1', 'qf_2'], sf_2: ['qf_3', 'qf_4'], final: ['sf_1', 'sf_2'],
};
// bracket id -> official match number
const CH_MATCH_NUM = {
  r32_3:73, r32_1:74, r32_9:75, r32_2:76, r32_4:77, r32_12:78, r32_10:79, r32_8:80,
  r32_11:81, r32_7:82, r32_6:83, r32_5:84, r32_13:85, r32_14:86, r32_15:87, r32_16:88,
  r16_1:89, r16_2:90, r16_5:91, r16_6:92, r16_3:93, r16_4:94, r16_7:95, r16_8:96,
  qf_1:97, qf_2:98, qf_3:99, qf_4:100, sf_1:101, sf_2:102, final:104,
};
// R32 slot labels (for showing who plays whom when no team picked yet)
const CH_R32_SLOTS = {
  r32_1:['1E','3rd A/B/C/D/F'], r32_2:['1I','3rd C/D/F/G/H'], r32_3:['2A','2B'], r32_4:['1F','2C'],
  r32_5:['2K','2L'], r32_6:['1H','2J'], r32_7:['1D','3rd B/E/F/I/J'], r32_8:['1G','3rd A/E/H/I/J'],
  r32_9:['1C','2F'], r32_10:['1A','3rd C/E/F/H/I'], r32_11:['1L','3rd E/H/I/J/K'], r32_12:['1B','2E'],
  r32_13:['1J','2H'], r32_14:['2D','2G'], r32_15:['1K','3rd D/E/I/J/L'], r32_16:['2I','3rd A/B/E/F/G'],
};

// Returns the two team codes feeding a match id (from picks), or [null,null]
function chFeeders(bracket, bid) {
  if (bid.startsWith('r32_')) return [null, null]; // R32 source = slot labels, handled separately
  const from = CH_BRACKET_TREE[bid];
  if (!from) return [null, null];
  return [bracket[from[0]] || null, bracket[from[1]] || null];
}

// Build the bracket graphic, highlighting the user's picked winners in green
function renderChampionsBracket(payload) {
  const bracket = payload.bracket || {};
  const cell = (bid) => {
    const winner = bracket[bid] || null;
    let a, b;
    if (bid.startsWith('r32_')) {
      const slot = CH_R32_SLOTS[bid] || ['?', '?'];
      a = { code: null, label: slot[0] };
      b = { code: null, label: slot[1] };
    } else {
      const [fa, fb] = chFeeders(bracket, bid);
      a = { code: fa, label: 'Winner #' + (CH_MATCH_NUM[CH_BRACKET_TREE[bid][0]] || '?') };
      b = { code: fb, label: 'Winner #' + (CH_MATCH_NUM[CH_BRACKET_TREE[bid][1]] || '?') };
    }
    const teamRow = (team) => {
      const isWinner = team.code && winner && team.code === winner;
      if (!team.code) return `<div class="br-team tbd"><span class="bn">${team.label}</span></div>`;
      return `<div class="br-team ${isWinner ? 'winner' : ''}">${flag(team.code, true)}<span class="bn">${team.code.toUpperCase()}</span>${isWinner ? '<span style="color:var(--green);font-size:9px">★</span>' : ''}</div>`;
    };
    return `<div class="br-match"><div class="br-mnum">#${CH_MATCH_NUM[bid] || ''}</div>${teamRow(a)}${teamRow(b)}</div>`;
  };
  const roundCol = (title, ids) => `<div class="br-round"><div class="br-round-title">${title}</div><div class="br-matches">${ids.map(cell).join('')}</div></div>`;

  const champ = bracket['final'] || null;
  // Left half / center final / right half
  const left = `
    ${roundCol('R32', ['r32_1','r32_2','r32_3','r32_4','r32_5','r32_6','r32_7','r32_8'])}
    ${roundCol('R16', ['r16_1','r16_2','r16_3','r16_4'])}
    ${roundCol('QF', ['qf_1','qf_2'])}
    ${roundCol('SF', ['sf_1'])}`;
  const center = `<div class="br-round" style="min-width:150px;max-width:150px;">
    <div class="br-round-title" style="color:var(--gold2);border-color:rgba(201,168,76,.4)">FINAL <span>#104</span></div>
    <div class="br-matches" style="justify-content:center;gap:7px;">
      <div style="text-align:center;font-size:32px;">🏆</div>
      ${cell('final')}
      ${champ ? `<div class="champ-mini"><div style="margin-bottom:3px">${flag(champ)}</div><div style="font-size:9px;color:var(--gold);letter-spacing:1px;">${t('predictedChamp')}</div><div style="font-family:'Bebas Neue',sans-serif;font-size:16px;color:var(--gold2);">${champ.toUpperCase()}</div></div>` : ''}
    </div></div>`;
  const right = `
    ${roundCol('SF', ['sf_2'])}
    ${roundCol('QF', ['qf_3','qf_4'])}
    ${roundCol('R16', ['r16_5','r16_6','r16_7','r16_8'])}
    ${roundCol('R32', ['r32_9','r32_10','r32_11','r32_12','r32_13','r32_14','r32_15','r32_16'])}`;

  return `<div class="ch-bracket-outer"><div class="ch-bracket-inner">${left}${center}${right}</div></div>`;
}

function renderChampionsView(payload, points) {
  if (!payload) return `<div class="loading">${t('noPredSubmitted')}</div>`;
  const groups = payload.groups || {};
  const groupHtml = Object.keys(groups).sort().map(g => `
    <div class="scoring-card" style="display:block;text-align:left;">
      <b>${t('group')} ${g}</b><br>
      ${(groups[g]||[]).map((c,i)=>`${i+1}. ${flag(c,true)} ${c?c.toUpperCase():'—'}`).join('<br>')}
    </div>`).join('');
  const bracket = payload.bracket || {};
  const champ = bracket['final'] || null;
  const hasPicks = Object.keys(bracket).some(k => k !== 'final' && bracket[k]);
  return `<div style="margin-top:14px;">
    ${points != null ? `<div class="msg ok">${t('currentPoints')} <b>${points}</b></div>` : ''}
    ${champ ? `<div style="text-align:center;margin-bottom:12px;"><div class="muted">${t('predictedChamp')}</div><div style="font-size:30px;">${flag(champ)} <b>${champ.toUpperCase()}</b></div></div>` : ''}
    <div class="day-title" style="margin-top:6px;">${t('groupFinish')}</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">${groupHtml}</div>
    <div class="muted" style="text-align:center;margin-top:10px;">${t('best3rds')} ${(payload.best3||[]).map(c=>c.toUpperCase()).join(', ')||'—'}</div>
    ${hasPicks || champ ? `<div class="day-title" style="margin-top:18px;">${t('knockoutPath')}</div>
      <div class="muted" style="text-align:center;margin-bottom:8px;">${LANG==='fr'?'Vos vainqueurs sont en vert · numéro de match indiqué':'Your picked winners are in green · match number shown'}</div>
      ${renderChampionsBracket(payload)}` : ''}
  </div>`;
}
