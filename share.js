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

function _buildShareURL(){
  var view = _currentView();
  var url = location.origin + location.pathname + '#' + view;

  // Pick up additional state from common globals if present
  var extras = [];
  try {
    if(view === 'start' && typeof window._stSurah !== 'undefined' && window._stSurah){
      extras.push('surah=' + window._stSurah);
    }
    if((view === 'timeline' || view === 'silsila' || view === 'map' || view === 'eras' || view === 'events') && window.activeYear){
      extras.push('year=' + window.activeYear);
    }
    if((view === 'one' || view === 'follow') && window.activePerson && window.activePerson.slug){
      extras.push('slug=' + window.activePerson.slug);
    }
  } catch(e){}

  if(extras.length) url += '?' + extras.join('&');
  return url;
}

function _copyToClipboard(text){
  // Prefer modern API
  if(navigator.clipboard && navigator.clipboard.writeText){
    return navigator.clipboard.writeText(text);
  }
  // Fallback: hidden textarea + execCommand
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

window.GoldArkShare = { open: _open };

})();
