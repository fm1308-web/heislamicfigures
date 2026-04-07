/* ═══════════════════════════════════════════════════════════
   gate.js  –  Tester email gate for Gold Ark
   Loaded BEFORE app.js. Exposes window.requireTester(action, cb)
   ═══════════════════════════════════════════════════════════ */
(function(){

var STORE_KEY = 'goldArkTester';
var MODAL_ID  = 'gaTesterModal';

function requireTester(actionName, callback) {
  var email = localStorage.getItem(STORE_KEY);
  if (email) { callback(); return; }
  _showModal(actionName, callback);
}

/* ── Modal ── */
function _showModal(actionName, callback) {
  // Prevent duplicate
  if (document.getElementById(MODAL_ID)) return;

  var overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.innerHTML =
    '<div class="ga-modal-box">' +
      '<h2 class="ga-modal-title">Register as a Tester</h2>' +
      '<p class="ga-modal-sub">Gold Ark is in tester preview. Drop your email to unlock saving, feedback, and other tester features. We\u2019ll only contact you about Gold Ark.</p>' +
      '<input type="email" id="gaEmailInput" class="ga-modal-input" placeholder="your@email.com" autocomplete="email">' +
      '<p id="gaModalError" class="ga-modal-error"></p>' +
      '<div class="ga-modal-btns">' +
        '<button id="gaModalCancel" class="ga-modal-btn ga-cancel">Cancel</button>' +
        '<button id="gaModalSubmit" class="ga-modal-btn ga-submit">Submit</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var emailInput = document.getElementById('gaEmailInput');
  var errorEl    = document.getElementById('gaModalError');
  var submitBtn  = document.getElementById('gaModalSubmit');

  emailInput.focus();

  // Cancel
  document.getElementById('gaModalCancel').addEventListener('click', function() {
    overlay.remove();
  });
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.remove();
  });

  // Submit
  function doSubmit() {
    var email = (emailInput.value || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      return;
    }
    errorEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending\u2026';

    fetch('https://formspree.io/f/mjgplzvj', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email, action: actionName })
    })
    .then(function(r) {
      if (!r.ok) throw new Error('Server returned ' + r.status);
      return r.json();
    })
    .then(function() {
      localStorage.setItem(STORE_KEY, email);
      overlay.remove();
      callback();
    })
    .catch(function(err) {
      errorEl.textContent = 'Something went wrong. Please try again.';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    });
  }

  submitBtn.addEventListener('click', doSubmit);
  emailInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doSubmit();
  });
}

/* ── Inject styles ── */
var style = document.createElement('style');
style.textContent =
  '#gaTesterModal{' +
    'position:fixed;inset:0;z-index:99999;' +
    'display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);' +
  '}' +
  '.ga-modal-box{' +
    'background:#1a1a2e;border:1px solid #D4AF37;border-radius:10px;' +
    'padding:32px 36px;max-width:420px;width:90%;' +
    'box-shadow:0 8px 40px rgba(0,0,0,0.6);' +
  '}' +
  '.ga-modal-title{' +
    'font-family:"Cinzel",serif;font-size:20px;font-weight:700;' +
    'color:#D4AF37;margin:0 0 10px;text-align:center;' +
  '}' +
  '.ga-modal-sub{' +
    'font-family:"Source Sans 3",sans-serif;font-size:13.5px;' +
    'color:#a0aec0;line-height:1.5;margin:0 0 18px;text-align:center;' +
  '}' +
  '.ga-modal-input{' +
    'display:block;width:100%;box-sizing:border-box;' +
    'padding:10px 14px;border:1px solid #333;border-radius:6px;' +
    'background:#0d0d1a;color:#e2e8f0;font-size:14px;' +
    'font-family:"Source Sans 3",sans-serif;outline:none;' +
    'transition:border-color .2s;' +
  '}' +
  '.ga-modal-input:focus{border-color:#D4AF37;}' +
  '.ga-modal-error{' +
    'font-family:"Source Sans 3",sans-serif;font-size:12.5px;' +
    'color:#e53e3e;margin:8px 0 0;min-height:18px;text-align:center;' +
  '}' +
  '.ga-modal-btns{' +
    'display:flex;gap:12px;margin-top:18px;justify-content:center;' +
  '}' +
  '.ga-modal-btn{' +
    'font-family:"Cinzel",serif;font-size:13px;font-weight:600;' +
    'padding:9px 28px;border-radius:6px;cursor:pointer;' +
    'letter-spacing:.04em;transition:opacity .15s;border:none;' +
  '}' +
  '.ga-modal-btn:hover{opacity:0.85;}' +
  '.ga-modal-btn:disabled{opacity:0.5;cursor:default;}' +
  '.ga-cancel{background:transparent;border:1px solid #555;color:#a0aec0;}' +
  '.ga-submit{background:#D4AF37;color:#1a1a2e;}';
document.head.appendChild(style);

/* ── Expose globally ── */
window.requireTester = requireTester;

})();
