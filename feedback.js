// ===============================================================
// FEEDBACK — modal form, opened by TOOLS menu Feedback item.
// Exposes window.GoldArkFeedback.open()
// Submits via window.GoldArkAuth.submitFeedback (auth.js).
// ===============================================================
(function(){
'use strict';

var _modalEl = null;

function _formHtml(){
  return ''
    + '<div style="font-family:\'Cinzel\',serif;font-size:18px;letter-spacing:.08em;color:#D4AF37;margin-bottom:14px">Send Feedback</div>'
    + '<div style="font-size:12px;color:#9aa3b2;margin-bottom:16px">We read every message. Reply by email if needed.</div>'
    + '<select id="fbCategory" style="width:100%;background:#0E1621;border:1px solid rgba(212,175,55,0.25);color:#E8EAEF;padding:8px;border-radius:3px;margin-bottom:12px;font-family:Lato,sans-serif;font-size:13px">'
    +   '<option value="bug">Bug</option>'
    +   '<option value="idea">Idea</option>'
    +   '<option value="praise">Praise</option>'
    +   '<option value="other" selected>Other</option>'
    + '</select>'
    + '<textarea id="fbMessage" rows="6" maxlength="2000" placeholder="Tell us what is on your mind..." style="width:100%;background:#0E1621;border:1px solid rgba(212,175,55,0.25);color:#E8EAEF;padding:8px;border-radius:3px;margin-bottom:6px;font-family:Lato,sans-serif;font-size:13px;resize:vertical;box-sizing:border-box"></textarea>'
    + '<div id="fbErr" style="color:#f0a0a0;font-size:12px;margin-bottom:10px;display:none"></div>'
    + '<div style="display:flex;justify-content:flex-end;gap:8px;margin-top:6px">'
    +   '<button id="fbCancel" type="button" style="background:transparent;border:1px solid #555;color:#888;font-family:\'Cinzel\',serif;letter-spacing:.06em;text-transform:uppercase;padding:8px 18px;border-radius:3px;font-size:12px;cursor:pointer">Cancel</button>'
    +   '<button id="fbSend" type="button" style="background:#D4AF37;border:1px solid #D4AF37;color:#0E1621;font-family:\'Cinzel\',serif;letter-spacing:.06em;text-transform:uppercase;font-weight:600;padding:8px 18px;border-radius:3px;font-size:12px;cursor:pointer">Send</button>'
    + '</div>';
}

function _wireFormButtons(card){
  var c = card.querySelector('#fbCancel'); if(c) c.addEventListener('click', _closeModal);
  var s = card.querySelector('#fbSend');   if(s) s.addEventListener('click', _submit);
}

function _buildModal(){
  if(_modalEl) return _modalEl;
  var ov = document.createElement('div');
  ov.id = 'fbOverlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  var card = document.createElement('div');
  card.id = 'fbCard';
  card.style.cssText = 'max-width:480px;width:90%;background:#131c2a;border:1px solid rgba(212,175,55,0.35);border-radius:6px;padding:24px;color:#E8EAEF;font-family:Lato,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,0.5)';
  card.innerHTML = _formHtml();
  ov.appendChild(card);
  document.body.appendChild(ov);
  ov.addEventListener('click', function(e){ if(e.target === ov) _closeModal(); });
  document.addEventListener('keydown', _escHandler);
  _wireFormButtons(card);
  _modalEl = ov;
  return ov;
}

function _escHandler(e){
  if(e.key === 'Escape' && _modalEl && _modalEl.style.display !== 'none') _closeModal();
}

function _openModal(){
  // Block guests — shell.js already gates Tools items, but double-check.
  if(window.GoldArkAuth && window.GoldArkAuth.isSignedIn && !window.GoldArkAuth.isSignedIn()){
    if(typeof window.requireTester === 'function'){
      window.requireTester('Feedback', function(){ _openModal(); });
    }
    return;
  }
  var ov = _buildModal();
  var card = ov.querySelector('#fbCard');
  if(card && !card.querySelector('#fbMessage')){
    card.innerHTML = _formHtml();
    _wireFormButtons(card);
  }
  var msg = ov.querySelector('#fbMessage'); if(msg) msg.value = '';
  var cat = ov.querySelector('#fbCategory'); if(cat) cat.value = 'other';
  var err = ov.querySelector('#fbErr'); if(err){ err.style.display = 'none'; err.textContent = ''; }
  var sendBtn = ov.querySelector('#fbSend'); if(sendBtn){ sendBtn.disabled = false; sendBtn.style.opacity = '1'; }
  ov.style.display = 'flex';
  setTimeout(function(){ var m = ov.querySelector('#fbMessage'); if(m) m.focus(); }, 50);
}

function _closeModal(){
  if(!_modalEl) return;
  _modalEl.style.display = 'none';
  var card = _modalEl.querySelector('#fbCard');
  if(card){ card.innerHTML = _formHtml(); _wireFormButtons(card); }
}

function _submit(){
  if(!_modalEl) return;
  var msgEl = _modalEl.querySelector('#fbMessage');
  var catEl = _modalEl.querySelector('#fbCategory');
  var errEl = _modalEl.querySelector('#fbErr');
  var sendBtn = _modalEl.querySelector('#fbSend');
  if(!msgEl || !errEl || !sendBtn) return;
  var message = (msgEl.value || '').trim();
  var category = catEl ? catEl.value : 'other';
  if(message.length < 5){
    errEl.textContent = 'Please write at least a few words.';
    errEl.style.display = 'block';
    return;
  }
  errEl.style.display = 'none';
  errEl.textContent = '';
  if(!window.GoldArkAuth || typeof window.GoldArkAuth.submitFeedback !== 'function'){
    errEl.textContent = 'Send failed. Try again.';
    errEl.style.display = 'block';
    return;
  }
  sendBtn.disabled = true;
  sendBtn.style.opacity = '0.6';
  var payload = { category: category, message: message, url: location.href, userAgent: navigator.userAgent };
  Promise.resolve(window.GoldArkAuth.submitFeedback(payload)).then(function(){
    var card = _modalEl.querySelector('#fbCard');
    if(card){
      card.innerHTML = '<div style="text-align:center;padding:36px 12px;color:#D4AF37;font-family:\'Cinzel\',serif;font-size:16px;letter-spacing:.06em">Thanks &mdash; feedback received.</div>';
    }
    setTimeout(function(){ _closeModal(); }, 1800);
  }).catch(function(err){
    console.error('[feedback] send failed', err);
    errEl.textContent = 'Send failed. Try again.';
    errEl.style.display = 'block';
    sendBtn.disabled = false;
    sendBtn.style.opacity = '1';
  });
}

window.GoldArkFeedback = { open: _openModal };

})();
