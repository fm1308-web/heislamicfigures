// ===============================================================
// PRINT / SAVE AS PDF — the full text of the main reading area, through the
// browser's own print window (choose "Save as PDF" there). Text stays real
// text (searchable, selectable), long surahs and tafsirs print in full, and
// no extra libraries are loaded.
// Exposes window.GoldArkPrint = { open(), preview(on) }
// ===============================================================
(function(){
'use strict';

var CSS =
  // Everything that is not on the way to the main reading box is hidden…
  '.ga-print-path > *:not(.ga-print-path):not(.ga-print-main):not(#ga-print-head):not(#ga-print-foot){display:none !important}' +
  // …and the boxes on the way stop clipping, so the whole text flows onto pages.
  '.ga-print-path{background:#fff !important;border:none !important}' +
  '.ga-print-path, .ga-print-main{display:block !important;height:auto !important;max-height:none !important;min-height:0 !important;overflow:visible !important;position:static !important;inset:auto !important;transform:none !important;margin-bottom:0 !important}' +
  // Dark-on-white, because printers drop the app\'s dark background.
  '.ga-print-main, .ga-print-main *{color:#111 !important;background:transparent !important;box-shadow:none !important;text-shadow:none !important;border-color:#ccc !important}' +
  '.ga-print-main svg *{fill:none !important;stroke:#999 !important}' +
  '.ga-print-main button, .ga-print-main .st-xref-chip, .ga-print-main .ex-bmk-btn{display:none !important}' +
  '#ga-print-head, #ga-print-foot{display:block !important;color:#111 !important;font-family:Lato,sans-serif}' +
  '#ga-print-head{border-bottom:1px solid #c9a961;padding:0 0 8px;margin:0 0 12px}' +
  '#ga-print-head .t{font-family:Cinzel,serif;font-size:16px;letter-spacing:.06em}' +
  '#ga-print-head .s{font-size:11px;color:#555 !important}' +
  '#ga-print-foot{border-top:1px solid #ccc;margin-top:14px;padding-top:6px;font-size:10px;color:#666 !important}';

function _style(){
  if(document.getElementById('ga-print-style')) return;
  var st = document.createElement('style');
  st.id = 'ga-print-style';
  // Same rules for real printing and for the on-screen check (preview).
  st.textContent = '@media print{' + CSS.replace(/(^|\})\s*([^{}]+)\{/g, function(m, b, sel){
      return b + sel.split(',').map(function(x){ return 'body.ga-printing ' + x.trim(); }).join(',') + '{';
    }) + '}' +
    CSS.replace(/(^|\})\s*([^{}]+)\{/g, function(m, b, sel){
      return b + sel.split(',').map(function(x){ return 'body.ga-print-preview ' + x.trim(); }).join(',') + '{';
    }) +
    'body.ga-print-preview{background:#fff !important;overflow:auto !important;height:auto !important}' +
    '@media print{html, body.ga-printing{background:#fff !important}}' +
    '#ga-print-head, #ga-print-foot{display:none}' +
    'body.ga-printing #ga-print-head, body.ga-printing #ga-print-foot, body.ga-print-preview #ga-print-head, body.ga-print-preview #ga-print-foot{display:block}';
  document.head.appendChild(st);
}

// The box the user is reading: READ mode's page, else the biggest scrolling
// box in the view, else the whole view area.
function _main(){
  var vp = document.getElementById('fr-viewport');
  if(vp && window.FocusReader && window.FocusReader.isOpen()) return vp;
  var zc = document.getElementById('zoneC'), best = null, area = 0;
  if(!zc) return null;
  zc.querySelectorAll('*').forEach(function(el){
    if(el.scrollHeight <= el.clientHeight + 4 || el.clientHeight < 120) return;
    var oy = getComputedStyle(el).overflowY;
    if(oy !== 'auto' && oy !== 'scroll') return;
    var r = el.getBoundingClientRect(), a = r.width * r.height;
    if(a > area){ area = a; best = el; }
  });
  return best || zc;
}

function _title(){
  var tab = document.body.getAttribute('data-active-tab') || '';
  var bits = [];
  ['#fr-title', '#st-surah-label', '.ex-reader-title', '#sr-heading', '#mon-count'].some(function(s){
    var e = document.querySelector(s);
    var t = e && e.offsetParent !== null ? (e.textContent || '').replace(/\s+/g, ' ').trim() : '';
    if(t && t.toLowerCase() !== 'surah'){ bits.push(t); return true; }
    return false;
  });
  return 'Gold Ark — ' + tab + (bits.length ? ' — ' + bits[0] : '');
}

var _marked = [], _scroll = [], _hash = '';
function _mark(main){
  _clear();
  // Remember where the reader is, so closing the print view puts them back.
  _hash = location.hash;
  _scroll = [main].concat((function(){ var a = [], q = main.parentElement; while(q){ a.push(q); q = q.parentElement; } return a; })())
    .map(function(el){ return [el, el.scrollTop, el.scrollLeft]; });
  main.classList.add('ga-print-main'); _marked.push(main);
  var p = main.parentElement;
  while(p && p !== document.documentElement){ p.classList.add('ga-print-path'); _marked.push(p); p = p.parentElement; }
  var head = document.createElement('div');
  head.id = 'ga-print-head';
  var link = location.hash ? ('hoomanlibrary.com/gold-ark' + location.hash) : 'hoomanlibrary.com/gold-ark';
  head.innerHTML = '<div class="t"></div><div class="s"></div>';
  head.querySelector('.t').textContent = _title();
  head.querySelector('.s').textContent = new Date().toLocaleString() + ' · ' + link;
  main.parentElement.insertBefore(head, main);
  var foot = document.createElement('div');
  foot.id = 'ga-print-foot';
  foot.textContent = 'hoomanlibrary.com/gold-ark · AI-generated · independently verify';
  main.parentElement.insertBefore(foot, main.nextSibling);
}
function _clear(){
  _marked.forEach(function(el){ el.classList.remove('ga-print-main', 'ga-print-path'); });
  _marked = [];
  ['ga-print-head', 'ga-print-foot'].forEach(function(id){ var e = document.getElementById(id); if(e) e.remove(); });
  document.body.classList.remove('ga-printing');
  _scroll.forEach(function(x){ x[0].scrollTop = x[1]; x[0].scrollLeft = x[2]; });
  _scroll = [];
  if(_hash && location.hash !== _hash){ try { history.replaceState(history.state, '', _hash); } catch(e){} }
  _hash = '';
}

function open(){
  _style();
  var main = _main(); if(!main) return;
  _mark(main);
  document.body.classList.add('ga-printing');
  var done = function(){ window.removeEventListener('afterprint', done); _clear(); };
  window.addEventListener('afterprint', done);
  setTimeout(function(){ window.print(); setTimeout(function(){ if(document.body.classList.contains('ga-printing')) done(); }, 500); }, 60);
}

// On-screen check of the print layout (for testing; no print window).
function preview(on){
  _style();
  if(on){ var m = _main(); if(m){ _mark(m); document.body.classList.add('ga-print-preview'); } }
  else { document.body.classList.remove('ga-print-preview'); _clear(); }
}

window.GoldArkPrint = { open: open, preview: preview };
})();
