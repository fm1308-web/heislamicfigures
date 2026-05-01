(function(){
'use strict';

function _activeViewName(){
  // Try shell's current view; fall back to 'view'
  try {
    if(typeof window.getCurrentView === 'function'){
      var v = window.getCurrentView();
      if(v) return String(v).toLowerCase();
    }
    var active = document.querySelector('.tab-button.active, .tab-btn.active, [aria-current="page"]');
    if(active && active.textContent) return active.textContent.trim().toLowerCase().replace(/\s+/g,'-');
  } catch(e){}
  return 'view';
}

function _ts(){
  var d = new Date();
  function p(n){ return n < 10 ? '0' + n : '' + n; }
  return d.getFullYear() + p(d.getMonth()+1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
}

function _toast(msg, isError){
  var t = document.createElement('div');
  t.textContent = msg;
  t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:' + (isError ? '#5a1a1a' : '#131c2a') + ';color:#E8EAEF;border:1px solid ' + (isError ? '#f0a0a0' : 'rgba(212,175,55,0.4)') + ';padding:10px 18px;border-radius:4px;z-index:99999;font-family:Lato,sans-serif;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,0.5)';
  document.body.appendChild(t);
  setTimeout(function(){ t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(function(){ if(t.parentNode) t.parentNode.removeChild(t); }, 500); }, 2200);
}

function _capture(){
  if(typeof window.domtoimage === 'undefined' || typeof window.domtoimage.toBlob !== 'function'){
    _toast('Snapshot library not loaded', true);
    return;
  }
  var shell = document.getElementById('appShell');
  var target = shell || document.body;
  _toast('Capturing snapshot…');
  var opts = {
    bgcolor: '#0E1621',
    cacheBust: true,
    width: target.scrollWidth * (window.devicePixelRatio > 1 ? 2 : 1),
    height: target.scrollHeight * (window.devicePixelRatio > 1 ? 2 : 1),
    style: {
      transform: 'scale(' + (window.devicePixelRatio > 1 ? 2 : 1) + ')',
      transformOrigin: 'top left',
      width: target.scrollWidth + 'px',
      height: target.scrollHeight + 'px'
    }
  };
  window.domtoimage.toBlob(target, opts).then(function(blob){
    if(!blob){ _toast('Snapshot failed', true); return; }
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'gold-ark-' + _activeViewName() + '-' + _ts() + '.png';
    document.body.appendChild(a);
    a.click();
    setTimeout(function(){ document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    _toast('Snapshot saved');
  }).catch(function(err){
    console.error('[snapshot] capture failed', err);
    _toast('Snapshot failed: ' + (err && err.message ? err.message : 'unknown'), true);
  });
}

window.GoldArkSnapshot = { capture: _capture };

})();
