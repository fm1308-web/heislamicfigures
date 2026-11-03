// ===============================================================
// SHARE — copy-to-clipboard / native share sheet of current state
// Triggered from TOOLS → Share menu item.
// Exposes window.GoldArkShare.open()
// ===============================================================
(function(){
'use strict';

function _toast(msg, isError){
  var t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + (isError ? '#5a1a1a' : '#131c2a') + ';color:#E8EAEF;border:1px solid ' + (isError ? '#f0a0a0' : 'rgba(212,175,55,0.4)') + ';padding:10px 18px;border-radius:4px;z-index:99999;font-family:Lato,sans-serif;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,0.5)';
  document.body.appendChild(t);
  setTimeout(function(){ t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 500); }, 2000);
}

function _currentView(){
  try {
    if(typeof window.getCurrentView === 'function'){
      var v = window.getCurrentView();
      if(v) return String(v).toLowerCase();
    }
  } catch(e){}
  // Fallback: read hash
  var h = (location.hash || '').replace(/^#/,'').split('?')[0].split('&')[0];
  return h || 'timeline';
}

// The app runs inside the page www.hoomanlibrary.com/gold-ark (in a frame), so
// links point there. On a local test server they point at the local copy.
var PUBLIC_BASE = 'https://www.hoomanlibrary.com/gold-ark';
function _isLocal(){ return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname); }

// The address bar already holds the exact place (Back/Forward keeps it up to
// date): #start?surah=18&verse=66, #explain?tafsir=…&surah=…&verse=…,
// #one/<figure>. TIMELINE with a figure card open shares that figure's profile.
function _buildShareURL(){
  var hash = location.hash || '';
  try {
    var tab = document.body.getAttribute('data-active-tab') || '';
    if(tab === 'TIMELINE' && window.TimelineView && typeof window.TimelineView.captureState === 'function'){
      var st = window.TimelineView.captureState();
      if(st && st.person) hash = '#one/' + encodeURIComponent(st.person);
    }
  } catch(e){}
  if(!hash) hash = '#' + _currentView();
  var base = _isLocal() ? (location.origin + location.pathname) : PUBLIC_BASE;
  return base + hash;
}

function _copyToClipboard(text){
  // Prefer modern API. Inside the website's frame it can be refused, so fall
  // back to the older copy method when it fails (not only when it is missing).
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text).catch(function(){ return _copyOld(text); });
  }
  return _copyOld(text);
}
function _copyOld(text){
  return new Promise(function(resolve, reject){
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-1000px;left:-1000px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      ok ? resolve() : reject(new Error('execCommand failed'));
    } catch(e){ reject(e); }
  });
}

function _open(){
  var url = _buildShareURL();
  var title = 'Gold Ark';
  var text = 'Have a look at this on Gold Ark';

  // Native share sheet (mobile / supported browsers)
  if(navigator.share){
    navigator.share({ title: title, text: text, url: url }).then(function(){
      // user picked a target; nothing to do
    }).catch(function(err){
      if(err && err.name === 'AbortError') return; // user cancelled — silent
      // Fallback to clipboard
      _copyToClipboard(url).then(function(){ _toast('Link copied'); })
        .catch(function(){ _toast('Could not copy link', true); });
    });
    return;
  }

  // Desktop / no native share — clipboard
  _copyToClipboard(url).then(function(){
    _toast('Link copied to clipboard');
  }).catch(function(err){
    console.error('[share] copy failed', err);
    _toast('Could not copy link', true);
  });
}

window.GoldArkShare = { open: _open, copy: _copyToClipboard, toast: _toast,
  base: function(){ return _isLocal() ? (location.origin + location.pathname) : PUBLIC_BASE; } };

})();
