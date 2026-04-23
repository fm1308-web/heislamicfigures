/* ═══════════════════════════════════════════════════════════
   gate.js — Auth gate for Gold Ark.
   Keeps window.requireTester(action, cb) signature for
   back-compat. Backed by Firebase (via auth.js) instead of
   Formspree email capture.
   Also injects the top-right Sign In / user menu button
   into the app header.
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

var MODAL_ID = 'gaAuthModal';
var HEADER_WRAP_ID = 'gaAuthHeader';
var _pendingCallback = null;

// Stripe Payment Link — paste the full Stripe-hosted Payment Link URL here.
// Leaving the placeholder in place shows the Subscribe item but surfaces a
// "coming soon" message instead of redirecting.
var STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/9B63cufrZg4n15xb1v8so02';

// ───────────────────────────────────────────────────────────
// Tier / action gate
// ───────────────────────────────────────────────────────────
function requireTester(actionName, callback) {
  var auth = window.GoldArkAuth;
  if (auth && auth.isSignedIn() && auth.hasTier('tester')) {
    callback();
    return;
  }
  _showAuthModal(actionName, callback);
}
window.requireTester = requireTester;

function _authSuccessPending() {
  var overlay = document.getElementById(MODAL_ID);
  if (overlay) overlay.remove();
  var cb = _pendingCallback;
  _pendingCallback = null;
  if (cb) setTimeout(cb, 150);
}

// Wait until window._gaUser is populated after sign-in/up resolves
function _waitForUser(timeoutMs) {
  timeoutMs = timeoutMs || 8000;
  return new Promise(function(resolve, reject){
    if (window._gaUser) return resolve(window._gaUser);
    if (!window.GoldArkAuth) return reject(new Error('auth not loaded'));
    var deadline = Date.now() + timeoutMs;
    var off = window.GoldArkAuth.onStateChange(function(u){
      if (u) { off(); resolve(u); return; }
      if (Date.now() > deadline) { off(); reject(new Error('timeout')); }
    });
  });
}

// ───────────────────────────────────────────────────────────
// Modal
// ───────────────────────────────────────────────────────────
function _showAuthModal(actionName, callback) {
  if (document.getElementById(MODAL_ID)) return;
  _pendingCallback = callback || null;

  var overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.innerHTML =
    '<div class="ga-auth-box">' +
      '<button class="ga-auth-close" aria-label="Close">×</button>' +
      '<h2 class="ga-auth-title">Gold Ark</h2>' +
      (actionName
        ? '<p class="ga-auth-sub">Sign in to continue (' + _esc(actionName) + ')</p>'
        : '<p class="ga-auth-sub">Sign in to continue</p>') +
      '<div class="ga-auth-tabs">' +
        '<button class="ga-auth-tab active" data-tab="signin">Sign In</button>' +
        '<button class="ga-auth-tab" data-tab="signup">Sign Up</button>' +
      '</div>' +
      '<div class="ga-auth-body">' +
        /* Sign In panel */
        '<div class="ga-auth-panel" data-panel="signin">' +
          '<button class="ga-auth-google" data-provider="google">' +
            '<span class="ga-g-ico">G</span> Continue with Google' +
          '</button>' +
          '<div class="ga-auth-or"><span>or</span></div>' +
          '<input type="email" class="ga-auth-input" data-fld="si-email" placeholder="Email" autocomplete="email">' +
          '<input type="password" class="ga-auth-input" data-fld="si-password" placeholder="Password" autocomplete="current-password">' +
          '<button class="ga-auth-submit" data-action="signin">Sign In</button>' +
        '</div>' +
        /* Sign Up panel */
        '<div class="ga-auth-panel" data-panel="signup" style="display:none">' +
          '<button class="ga-auth-google" data-provider="google">' +
            '<span class="ga-g-ico">G</span> Continue with Google' +
          '</button>' +
          '<div class="ga-auth-or"><span>or</span></div>' +
          '<input type="text" class="ga-auth-input" data-fld="su-name" placeholder="Name" autocomplete="name">' +
          '<input type="email" class="ga-auth-input" data-fld="su-email" placeholder="Email" autocomplete="email">' +
          '<input type="password" class="ga-auth-input" data-fld="su-password" placeholder="Password (min 6 chars)" autocomplete="new-password">' +
          '<button class="ga-auth-submit" data-action="signup">Create Account</button>' +
        '</div>' +
      '</div>' +
      '<p class="ga-auth-error" data-role="error"></p>' +
    '</div>';

  document.body.appendChild(overlay);

  var box = overlay.querySelector('.ga-auth-box');
  var errorEl = overlay.querySelector('[data-role="error"]');

  function setError(msg) { errorEl.textContent = msg || ''; }
  function setBusy(btn, on, labelOn, labelOff) {
    btn.disabled = on;
    btn.textContent = on ? (labelOn || 'Please wait…') : (labelOff || btn.dataset.label || btn.textContent);
  }

  // Tabs
  overlay.querySelectorAll('.ga-auth-tab').forEach(function(tab){
    tab.addEventListener('click', function(){
      overlay.querySelectorAll('.ga-auth-tab').forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      var which = tab.getAttribute('data-tab');
      overlay.querySelectorAll('.ga-auth-panel').forEach(function(p){
        p.style.display = p.getAttribute('data-panel') === which ? '' : 'none';
      });
      setError('');
    });
  });

  // Close
  function closeModal() {
    overlay.remove();
    _pendingCallback = null;
  }
  overlay.querySelector('.ga-auth-close').addEventListener('click', closeModal);
  overlay.addEventListener('click', function(e){
    if (e.target === overlay) closeModal();
  });

  // Google
  overlay.querySelectorAll('[data-provider="google"]').forEach(function(btn){
    btn.addEventListener('click', function(){
      setError('');
      var orig = btn.textContent;
      setBusy(btn, true, 'Opening Google…', orig);
      window.GoldArkAuth.signInWithGoogle()
        .then(_waitForUser)
        .then(_authSuccessPending)
        .catch(function(e){
          setBusy(btn, false, '', orig);
          setError(_friendlyErr(e));
        });
    });
  });

  // Submit buttons
  overlay.querySelectorAll('.ga-auth-submit').forEach(function(btn){
    btn.dataset.label = btn.textContent;
    btn.addEventListener('click', function(){
      setError('');
      var action = btn.getAttribute('data-action');
      var p;
      if (action === 'signin') {
        var em = overlay.querySelector('[data-fld="si-email"]').value.trim();
        var pw = overlay.querySelector('[data-fld="si-password"]').value;
        if (!em || !pw) { setError('Enter email and password.'); return; }
        setBusy(btn, true, 'Signing in…');
        p = window.GoldArkAuth.signInWithEmail(em, pw);
      } else {
        var nm = overlay.querySelector('[data-fld="su-name"]').value.trim();
        var em2 = overlay.querySelector('[data-fld="su-email"]').value.trim();
        var pw2 = overlay.querySelector('[data-fld="su-password"]').value;
        if (!nm) { setError('Enter your name.'); return; }
        if (!em2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em2)) { setError('Enter a valid email.'); return; }
        if (!pw2 || pw2.length < 6) { setError('Password must be 6+ characters.'); return; }
        setBusy(btn, true, 'Creating account…');
        p = window.GoldArkAuth.signUpWithEmail(em2, pw2, nm);
      }
      p.then(_waitForUser)
       .then(_authSuccessPending)
       .catch(function(e){
          setBusy(btn, false);
          setError(_friendlyErr(e));
        });
    });
  });

  // Enter key submits active panel
  overlay.querySelectorAll('.ga-auth-input').forEach(function(inp){
    inp.addEventListener('keydown', function(e){
      if (e.key === 'Enter') {
        var activePanel = overlay.querySelector('.ga-auth-panel:not([style*="none"])');
        if (activePanel) activePanel.querySelector('.ga-auth-submit').click();
      }
    });
  });

  // Focus first field
  setTimeout(function(){
    var first = overlay.querySelector('.ga-auth-input');
    if (first) first.focus();
  }, 30);
}
window._gaOpenAuthModal = function(){ _showAuthModal(null, null); };

function _friendlyErr(e) {
  var code = (e && e.code) || '';
  if (code.indexOf('auth/invalid-credential') >= 0) return 'Incorrect email or password.';
  if (code.indexOf('auth/wrong-password') >= 0) return 'Incorrect password.';
  if (code.indexOf('auth/user-not-found') >= 0) return 'No account found with that email.';
  if (code.indexOf('auth/email-already-in-use') >= 0) return 'An account with that email already exists.';
  if (code.indexOf('auth/weak-password') >= 0) return 'Password is too weak.';
  if (code.indexOf('auth/invalid-email') >= 0) return 'Invalid email address.';
  if (code.indexOf('auth/popup-closed-by-user') >= 0) return 'Sign-in window closed.';
  if (code.indexOf('auth/popup-blocked') >= 0) return 'Popup was blocked by the browser.';
  if (code.indexOf('auth/network-request-failed') >= 0) return 'Network error. Check your connection.';
  return (e && e.message) || 'Something went wrong.';
}

// ───────────────────────────────────────────────────────────
// Header Sign In / user menu button
// ───────────────────────────────────────────────────────────
function _injectHeaderButton() {
  if (document.getElementById(HEADER_WRAP_ID)) return;
  var disc = document.getElementById('hdrRow1Disclosures');
  if (!disc) {
    // Retry in case DOM not ready
    setTimeout(_injectHeaderButton, 100);
    return;
  }
  var wrap = document.createElement('div');
  wrap.id = HEADER_WRAP_ID;
  wrap.className = 'ga-auth-hdr';
  wrap.innerHTML =
    '<button id="gaSignInBtn" class="ga-hdr-btn ga-hdr-btn-signin">SIGN IN</button>' +
    '<div id="gaUserBox" style="display:none">' +
      '<button id="gaUserBtn" class="ga-hdr-btn">' +
        '<span id="gaUserName"></span>' +
        '<span id="gaTierBadge" class="ga-tier-badge"></span>' +
        '<span class="ga-caret">▾</span>' +
      '</button>' +
      '<div id="gaUserMenu" class="ga-user-menu" style="display:none">' +
        '<div class="ga-menu-item ga-menu-subscribe" id="gaMenuSubscribe" style="display:none">Subscribe · $100/yr AUD</div>' +
        '<div class="ga-menu-item" id="gaMenuSignOut">Sign Out</div>' +
      '</div>' +
    '</div>';
  // Place the auth wrap on the SAME line as the UPDATES button, to its left.
  var updatesBtn = disc.querySelector('#updatesBtn');
  if (updatesBtn) {
    var row = document.createElement('div');
    row.className = 'ga-hdr-row';
    disc.insertBefore(row, updatesBtn);
    row.appendChild(wrap);
    row.appendChild(updatesBtn);
    // Zero the UPDATES button's inline margin-top since the row handles spacing
    updatesBtn.style.marginTop = '0';
  } else {
    disc.appendChild(wrap);
  }

  document.getElementById('gaSignInBtn').addEventListener('click', function(){
    _showAuthModal(null, null);
  });
  document.getElementById('gaUserBtn').addEventListener('click', function(e){
    e.stopPropagation();
    var m = document.getElementById('gaUserMenu');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
  });
  document.addEventListener('click', function(){
    var m = document.getElementById('gaUserMenu');
    if (m) m.style.display = 'none';
  });
  document.getElementById('gaMenuSignOut').addEventListener('click', function(){
    if (window.GoldArkAuth) window.GoldArkAuth.signOut();
  });
  document.getElementById('gaMenuSubscribe').addEventListener('click', function(){
    _goSubscribe();
  });
}

function _goSubscribe() {
  if (!window.GoldArkAuth || !window.GoldArkAuth.isSignedIn()) {
    _showAuthModal('subscribe', _goSubscribe);
    return;
  }
  if (!STRIPE_PAYMENT_LINK || STRIPE_PAYMENT_LINK.indexOf('PLACEHOLDER') >= 0) {
    alert('Subscription checkout is coming soon. Hang tight — you’ll be notified.');
    return;
  }
  // Append ?prefilled_email=<user> and ?client_reference_id=<uid> so the
  // eventual webhook / manual reconciliation can match the Stripe customer
  // back to the Firestore user doc.
  var u = window._gaUser || {};
  var url = STRIPE_PAYMENT_LINK;
  var sep = url.indexOf('?') >= 0 ? '&' : '?';
  var params = [];
  if (u.email) params.push('prefilled_email=' + encodeURIComponent(u.email));
  if (u.uid)   params.push('client_reference_id=' + encodeURIComponent(u.uid));
  if (params.length) url += sep + params.join('&');
  window.location.href = url;
}
window._gaSubscribe = _goSubscribe;

// ───────────────────────────────────────────────────────────
// Suggest Correction modal (contributor-only)
// ───────────────────────────────────────────────────────────
var CORR_MODAL_ID = 'gaCorrModal';

function _openCorrectionModal(opts) {
  opts = opts || {};
  var auth = window.GoldArkAuth;
  if (!auth || !auth.isSignedIn()) {
    _showAuthModal('suggest correction', function(){ _openCorrectionModal(opts); });
    return;
  }
  if (!auth.isContributor()) {
    alert('Contributor role required. Ask an admin for access.');
    return;
  }
  if (document.getElementById(CORR_MODAL_ID)) return;

  var overlay = document.createElement('div');
  overlay.id = CORR_MODAL_ID;
  overlay.innerHTML =
    '<div class="ga-corr-box">' +
      '<button class="ga-auth-close" aria-label="Close">×</button>' +
      '<h2 class="ga-auth-title">Suggest Correction</h2>' +
      '<p class="ga-auth-sub">Submit a proposed correction for admin review.</p>' +
      '<label class="ga-corr-label">Figure</label>' +
      '<input class="ga-auth-input" data-fld="figureName" value="' + _esc(opts.figureName || '') + '" readonly>' +
      '<label class="ga-corr-label">Field to correct <span class="ga-corr-req">*</span></label>' +
      '<input class="ga-auth-input" data-fld="fieldToCorrect" placeholder="e.g. dob_academic, city, tradition">' +
      '<label class="ga-corr-label">Suggested value <span class="ga-corr-req">*</span></label>' +
      '<textarea class="ga-auth-input ga-corr-ta" data-fld="suggestedValue" rows="3" placeholder="Your proposed value"></textarea>' +
      '<label class="ga-corr-label">Source URL <span class="ga-corr-req">*</span></label>' +
      '<input class="ga-auth-input" data-fld="sourceUrl" placeholder="https://…" type="url">' +
      '<label class="ga-corr-label">Note <span class="ga-corr-opt">(optional)</span></label>' +
      '<textarea class="ga-auth-input ga-corr-ta" data-fld="note" rows="2" placeholder="Context for the admin"></textarea>' +
      '<p class="ga-auth-error" data-role="error"></p>' +
      '<button class="ga-auth-submit" data-action="submit-corr">Submit Correction</button>' +
    '</div>';
  document.body.appendChild(overlay);

  function close() { overlay.remove(); }
  overlay.querySelector('.ga-auth-close').addEventListener('click', close);
  overlay.addEventListener('click', function(e){ if (e.target === overlay) close(); });

  var errorEl = overlay.querySelector('[data-role="error"]');
  var submit = overlay.querySelector('[data-action="submit-corr"]');
  submit.addEventListener('click', function(){
    var fld = overlay.querySelector('[data-fld="fieldToCorrect"]').value.trim();
    var val = overlay.querySelector('[data-fld="suggestedValue"]').value.trim();
    var src = overlay.querySelector('[data-fld="sourceUrl"]').value.trim();
    var note = overlay.querySelector('[data-fld="note"]').value.trim();
    if (!fld) { errorEl.textContent = 'Enter the field to correct.'; return; }
    if (!val) { errorEl.textContent = 'Enter the suggested value.'; return; }
    if (!src || !/^https?:\/\//.test(src)) { errorEl.textContent = 'Source URL must start with http(s)://'; return; }
    errorEl.textContent = '';
    submit.disabled = true; submit.textContent = 'Submitting…';
    window.GoldArkAuth.submitCorrection({
      figureSlug: opts.figureSlug || '',
      figureName: opts.figureName || '',
      fieldToCorrect: fld,
      suggestedValue: val,
      sourceUrl: src,
      note: note
    }).then(function(){
      close();
      _gaToast('Correction submitted for review');
    }).catch(function(e){
      submit.disabled = false; submit.textContent = 'Submit Correction';
      errorEl.textContent = (e && e.message) || 'Submit failed.';
    });
  });
}
window._gaOpenCorrectionModal = _openCorrectionModal;

function _gaToast(msg) {
  var el = document.getElementById('ga-toast');
  if (el) el.remove();
  el = document.createElement('div');
  el.id = 'ga-toast';
  el.className = 'toast-msg';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
  setTimeout(function(){ el.classList.remove('show'); setTimeout(function(){ el.remove(); }, 300); }, 3000);
}

function _renderAuthState(u) {
  var signInBtn = document.getElementById('gaSignInBtn');
  var userBox = document.getElementById('gaUserBox');
  if (!signInBtn || !userBox) return;
  if (!u) {
    signInBtn.style.display = '';
    userBox.style.display = 'none';
    return;
  }
  signInBtn.style.display = 'none';
  userBox.style.display = '';
  document.getElementById('gaUserName').textContent = u.displayName || u.email || 'Signed in';
  var badge = document.getElementById('gaTierBadge');
  badge.textContent = String(u.tier || 'tester').toUpperCase();
  badge.className = 'ga-tier-badge ga-tier-' + (u.tier || 'tester');
  // Show Subscribe menu item only for tester/free tiers (not already subscribed)
  var subItem = document.getElementById('gaMenuSubscribe');
  if (subItem) {
    var showSub = u.tier === 'tester' || u.tier === 'free';
    subItem.style.display = showSub ? '' : 'none';
  }
}

function _subscribeAuth() {
  function hook() {
    _injectHeaderButton();
    window.GoldArkAuth.onStateChange(_renderAuthState);
  }
  if (window.GoldArkAuth) { hook(); return; }
  document.addEventListener('gold-ark-auth-ready', hook, { once: true });
  // Also inject the button now so "SIGN IN" is visible even before auth loads
  _injectHeaderButton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', _subscribeAuth);
} else {
  _subscribeAuth();
}

// ───────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────
function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ───────────────────────────────────────────────────────────
// Styles
// ───────────────────────────────────────────────────────────
var style = document.createElement('style');
style.textContent =
  /* Header button + user menu */
  '.ga-hdr-row{display:flex;align-items:center;gap:8px;justify-content:flex-end;margin-top:4px}' +
  '.ga-auth-hdr{position:relative;display:inline-flex;align-items:center;gap:8px}' +
  '.ga-hdr-btn{padding:4px 14px;background:transparent;border:1px solid #D4AF37;color:#D4AF37;font-family:"Cinzel",serif;font-size:var(--fs-3);letter-spacing:.08em;cursor:pointer;border-radius:2px;transition:.2s;display:inline-flex;align-items:center;gap:8px}' +
  '.ga-hdr-btn:hover{background:rgba(212,175,55,0.1)}' +
  /* SIGN IN button: bright white pill, dark text — high-contrast attention-grabber */
  '.ga-hdr-btn-signin{background:#fff;color:#1a1a2e;border-color:#fff;font-weight:700;box-shadow:0 0 0 1px rgba(255,255,255,0.3),0 2px 6px rgba(0,0,0,0.3)}' +
  '.ga-hdr-btn-signin:hover{background:#f4e6a8;border-color:#D4AF37;color:#1a1a2e}' +
  '.ga-caret{font-size:10px;opacity:.7}' +
  '.ga-tier-badge{font-size:9px;letter-spacing:.1em;padding:2px 6px;border-radius:2px;background:rgba(212,175,55,0.15);color:#D4AF37;border:1px solid rgba(212,175,55,0.4)}' +
  '.ga-tier-subscriber{background:rgba(212,175,55,0.3);border-color:#D4AF37}' +
  '.ga-user-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#1a1a2e;border:1px solid #D4AF37;border-radius:4px;min-width:140px;z-index:10000;box-shadow:0 6px 20px rgba(0,0,0,0.6)}' +
  '.ga-menu-item{padding:10px 14px;font-family:"Source Sans 3",sans-serif;font-size:var(--fs-3);color:#e2e8f0;cursor:pointer}' +
  '.ga-menu-item:hover{background:rgba(212,175,55,0.1);color:#D4AF37}' +
  '.ga-menu-subscribe{color:#D4AF37;border-bottom:1px solid #2a2a3e;font-weight:600;letter-spacing:.03em}' +
  /* Modal overlay */
  '#' + MODAL_ID + '{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px)}' +
  '.ga-auth-box{position:relative;background:#1a1a2e;border:1px solid #D4AF37;border-radius:10px;padding:36px 36px 28px;max-width:420px;width:92%;box-shadow:0 12px 50px rgba(0,0,0,0.7)}' +
  '.ga-auth-close{position:absolute;top:10px;right:14px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1}' +
  '.ga-auth-close:hover{color:#D4AF37}' +
  '.ga-auth-title{font-family:"Cinzel",serif;font-size:var(--fs-1);font-weight:700;color:#D4AF37;margin:0 0 6px;text-align:center;letter-spacing:.08em}' +
  '.ga-auth-sub{font-family:"Source Sans 3",sans-serif;font-size:var(--fs-3);color:#a0aec0;margin:0 0 20px;text-align:center}' +
  '.ga-auth-tabs{display:flex;gap:0;border-bottom:1px solid #333;margin-bottom:18px}' +
  '.ga-auth-tab{flex:1;background:none;border:none;padding:10px 0;font-family:"Cinzel",serif;font-size:var(--fs-3);letter-spacing:.1em;color:#666;cursor:pointer;border-bottom:2px solid transparent;transition:.2s}' +
  '.ga-auth-tab:hover{color:#a0aec0}' +
  '.ga-auth-tab.active{color:#D4AF37;border-bottom-color:#D4AF37}' +
  '.ga-auth-panel{display:flex;flex-direction:column;gap:10px}' +
  '.ga-auth-google{display:flex;align-items:center;justify-content:center;gap:10px;padding:10px 14px;background:#fff;color:#333;font-family:"Source Sans 3",sans-serif;font-size:var(--fs-3);font-weight:600;border:none;border-radius:6px;cursor:pointer;transition:.15s}' +
  '.ga-auth-google:hover{background:#f0f0f0}' +
  '.ga-auth-google:disabled{opacity:.6;cursor:default}' +
  '.ga-g-ico{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#4285F4 0%,#34A853 35%,#FBBC05 68%,#EA4335 100%);color:#fff;font-weight:700;font-size:12px}' +
  '.ga-auth-or{position:relative;text-align:center;margin:6px 0}' +
  '.ga-auth-or::before{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:#333}' +
  '.ga-auth-or span{position:relative;background:#1a1a2e;padding:0 12px;color:#666;font-family:"Source Sans 3",sans-serif;font-size:var(--fs-4,12px);text-transform:uppercase;letter-spacing:.1em}' +
  '.ga-auth-input{display:block;width:100%;box-sizing:border-box;padding:10px 14px;border:1px solid #333;border-radius:6px;background:#0d0d1a;color:#e2e8f0;font-size:var(--fs-3);font-family:"Source Sans 3",sans-serif;outline:none;transition:border-color .2s}' +
  '.ga-auth-input:focus{border-color:#D4AF37}' +
  '.ga-auth-submit{padding:11px 14px;background:#D4AF37;color:#1a1a2e;font-family:"Cinzel",serif;font-size:var(--fs-3);font-weight:700;letter-spacing:.06em;border:none;border-radius:6px;cursor:pointer;margin-top:6px;transition:.15s}' +
  '.ga-auth-submit:hover{background:#E5C04A}' +
  '.ga-auth-submit:disabled{opacity:.6;cursor:default}' +
  '.ga-auth-error{font-family:"Source Sans 3",sans-serif;font-size:var(--fs-3);color:#e53e3e;margin:12px 0 0;min-height:18px;text-align:center}' +
  /* Correction modal (contributor) */
  '#' + CORR_MODAL_ID + '{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);backdrop-filter:blur(6px)}' +
  '.ga-corr-box{position:relative;background:#1a1a2e;border:1px solid #8fd4b5;border-radius:10px;padding:28px 30px 22px;max-width:480px;width:92%;box-shadow:0 12px 50px rgba(0,0,0,0.7)}' +
  '.ga-corr-label{display:block;font-family:"Source Sans 3",sans-serif;font-size:var(--fs-3);color:#a0aec0;margin:10px 0 4px;letter-spacing:.02em}' +
  '.ga-corr-req{color:#e53e3e}' +
  '.ga-corr-opt{color:#718096}' +
  '.ga-corr-ta{resize:vertical;min-height:60px;font-family:"Source Sans 3",sans-serif}' +
  /* Suggest-Correction button in ONE profile */
  '.one-correction-btn{display:inline-block;margin:0 0 10px;padding:5px 14px;background:rgba(143,212,181,0.12);color:#8fd4b5;border:1px solid rgba(143,212,181,0.45);border-radius:3px;font-family:"Cinzel",serif;font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;transition:.15s}' +
  '.one-correction-btn:hover{background:rgba(143,212,181,0.25);border-color:#8fd4b5;color:#cfecdc}';
document.head.appendChild(style);

})();
