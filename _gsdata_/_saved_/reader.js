/* ═══════════════════════════════════════════════════════════
   FOCUS READER — shared full-screen book mode (B4/B5)
   One component, reused by START / MONASTIC / EXPLAIN.
   - READ pill injected into Zone B row 1 of the 3 views
   - open(): app frame disappears (overlay covers it),
     the view's book content + its filter bar are MOVED into
     the reader and MOVED BACK on exit (no view code changes)
   - Top bar: menu ☰ · book title · A− / A+ · user icon
   - Bottom bar: prev/next · Page X of Y · bookmark · ⓘ · EXIT
   - Esc exits. Font size persists. Bookmarks persist (localStorage).
   Exposes window.FocusReader = { open(tab), close(), isOpen() }
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

var VIEWS = {
  START: {
    content: '#st-body',
    ready: function(){ return !!document.querySelector('#st-verses .st-verse'); },
    title: function(){
      var el = document.getElementById('st-surah-label');
      var t = el ? (el.textContent || '').trim() : '';
      return (t && t.toLowerCase() !== 'surah') ? t : 'The Qur’an';
    }
  },
  MONASTIC: {
    content: '#mon-results',
    ready: function(){ return !!document.querySelector('#mon-results .mon-row'); },
    title: function(){
      try {
        var M = window.Monastic;
        if(M && typeof M._exportSel === 'function'){
          var sel = M._exportSel();
          var c = (sel && sel.collection) || [];
          if(c.length === 1 && typeof M.collectionLabel === 'function') return M.collectionLabel(c[0]);
          if(c.length > 1) return 'Hadith · ' + c.length + ' collections';
        }
      } catch(e){}
      return 'Hadith Collections';
    }
  },
  EXPLAIN: {
    // Whole view wrapper, NOT #ex-main — explain.css scopes ~all its rules
    // to #explain-view, so the tag rail / chips lose styling if the id
    // stays behind in the app shell.
    content: '#explain-view',
    ready: function(){ return !!(window._exState && window._exState.edition); },
    title: function(){
      var el = document.querySelector('#ex-main .ex-reader-title');
      var t = el ? (el.textContent || '').trim() : '';
      return t || 'Tafsir Library';
    }
  }
};

var _open = false, _tab = null;
var _overlay = null, _viewport = null, _host = null;
var _contentEl = null, _contentPh = null;
var _zbEl = null, _zbPh = null;
var _scale = 1;
var _pages = { cur: 1, total: 1 };
var _mo = null, _rt = null;
var _bmkKey = '';

function _lsGet(k, d){ try { var v = localStorage.getItem(k); return v === null ? d : v; } catch(e){ return d; } }
function _lsSet(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
function _bmarks(){ try { return JSON.parse(_lsGet('goldark_fr_bookmarks', '{}')) || {}; } catch(e){ return {}; } }
function _bmarksSave(b){ _lsSet('goldark_fr_bookmarks', JSON.stringify(b)); }

var FLAG_SVG = '<svg width="12" height="15" viewBox="0 0 12 16" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M1 1 L1 15 L6 11 L11 15 L11 1 Z"/></svg>';

// ── open ────────────────────────────────────────────────────
function open(tab){
  if(_open) close();
  var cfg = VIEWS[tab];
  if(!cfg) return;
  var contentEl = document.querySelector(cfg.content);
  if(!contentEl){ console.warn('[FocusReader] content not found for', tab); return; }
  _tab = tab;
  _contentEl = contentEl;

  var discl = document.querySelector('.zd-disclaimer');
  var disclText = discl ? (discl.textContent || '').trim() : 'AI-generated · independently verify';

  _overlay = document.createElement('div');
  _overlay.id = 'fr-overlay';
  _overlay.innerHTML =
      '<div id="fr-top">'
    +   '<button class="fr-round" id="fr-menu-btn" type="button" title="Menu — filters &amp; options">☰</button>'
    +   '<div id="fr-title"></div>'
    +   '<button class="fr-font-btn" id="fr-font-m" type="button" title="Smaller text">A−</button>'
    +   '<button class="fr-font-btn" id="fr-font-p" type="button" title="Larger text">A+</button>'
    +   '<button class="fr-round" id="fr-user-btn" type="button" title="Account"></button>'
    + '</div>'
    + '<div id="fr-viewport"><div id="fr-host"></div></div>'
    + '<div id="fr-bottom">'
    +   '<button class="fr-round" id="fr-prev" type="button" title="Previous page">◀</button>'
    +   '<button class="fr-round" id="fr-next" type="button" title="Next page">▶</button>'
    +   '<span class="fr-spacer"></span>'
    +   '<span id="fr-page">Page 1 of 1</span>'
    +   '<span class="fr-spacer"></span>'
    +   '<button class="fr-round" id="fr-bmk" type="button" title="Bookmark this page">' + FLAG_SVG + '</button>'
    +   '<button id="fr-bmk-chip" type="button" style="display:none"></button>'
    +   '<button class="fr-round" id="fr-info" type="button" title="About this text">ⓘ</button>'
    +   '<button id="fr-exit" type="button" title="Exit reader (Esc)">EXIT</button>'
    + '</div>'
    + '<div id="fr-menu-panel"><div class="fr-menu-hdr">Filters &amp; options</div></div>'
    + '<div id="fr-info-bubble"></div>'
    + '<div id="fr-user-panel"></div>';
  document.body.appendChild(_overlay);
  document.body.classList.add('fr-active');

  _overlay.querySelector('#fr-info-bubble').textContent = disclText;

  // Move the view's filter bar (Zone B) into the menu panel.
  var zb = document.getElementById('zoneB');
  if(zb){
    _zbEl = zb;
    _zbPh = document.createComment('fr-zb-home');
    zb.parentNode.insertBefore(_zbPh, zb);
    _overlay.querySelector('#fr-menu-panel').appendChild(zb);
  }

  // Move the book content into the reader.
  _contentPh = document.createComment('fr-content-home');
  contentEl.parentNode.insertBefore(_contentPh, contentEl);
  _host = _overlay.querySelector('#fr-host');
  _host.appendChild(contentEl);
  _viewport = _overlay.querySelector('#fr-viewport');

  // Font scale (persisted).
  _scale = parseFloat(_lsGet('goldark_fr_scale', '1')) || 1;
  _applyScale();

  _wire();
  document.addEventListener('keydown', _onKey, true);
  _mo = new MutationObserver(_deferRecalc);
  _mo.observe(_host, { childList: true, subtree: true, characterData: true });
  _viewport.addEventListener('scroll', _onScroll);
  window.addEventListener('resize', _deferRecalc);

  _open = true;
  _recalc();
  setTimeout(_recalc, 400);
  setTimeout(_recalc, 1200);
}

// ── close / restore ─────────────────────────────────────────
function close(){
  if(!_overlay) return;
  _open = false;
  try { if(_mo) _mo.disconnect(); } catch(e){}
  _mo = null;
  document.removeEventListener('keydown', _onKey, true);
  window.removeEventListener('resize', _deferRecalc);

  // Put Zone B back where it lives.
  try {
    if(_zbEl && _zbPh && _zbPh.parentNode){
      _zbPh.parentNode.insertBefore(_zbEl, _zbPh);
      _zbPh.parentNode.removeChild(_zbPh);
    }
  } catch(e){}
  // Put the book content back (if its home still exists).
  try {
    if(_contentEl && _contentPh && _contentPh.parentNode){
      _contentPh.parentNode.insertBefore(_contentEl, _contentPh);
      _contentPh.parentNode.removeChild(_contentPh);
    }
  } catch(e){}

  try { _overlay.parentNode.removeChild(_overlay); } catch(e){}
  document.body.classList.remove('fr-active');
  _overlay = null; _viewport = null; _host = null;
  _contentEl = null; _contentPh = null; _zbEl = null; _zbPh = null;
  _tab = null;
}

// ── wiring ──────────────────────────────────────────────────
function _wire(){
  var q = function(s){ return _overlay.querySelector(s); };
  var menuPanel = q('#fr-menu-panel');
  var infoBubble = q('#fr-info-bubble');
  var userPanel = q('#fr-user-panel');

  q('#fr-menu-btn').addEventListener('click', function(e){
    e.stopPropagation();
    infoBubble.classList.remove('open');
    userPanel.classList.remove('open');
    menuPanel.classList.toggle('open');
  });
  q('#fr-exit').addEventListener('click', close);
  q('#fr-prev').addEventListener('click', function(){ _goto(_pages.cur - 1); });
  q('#fr-next').addEventListener('click', function(){ _goto(_pages.cur + 1); });
  q('#fr-font-m').addEventListener('click', function(){ _setScale(_scale - 0.1); });
  q('#fr-font-p').addEventListener('click', function(){ _setScale(_scale + 0.1); });
  q('#fr-info').addEventListener('click', function(e){
    e.stopPropagation();
    menuPanel.classList.remove('open');
    userPanel.classList.remove('open');
    infoBubble.classList.toggle('open');
  });
  q('#fr-bmk').addEventListener('click', function(){
    var b = _bmarks();
    if(b[_bmkKey] === _pages.cur) delete b[_bmkKey];
    else b[_bmkKey] = _pages.cur;
    _bmarksSave(b);
    _refreshBmk();
  });
  q('#fr-bmk-chip').addEventListener('click', function(){
    var b = _bmarks();
    if(b[_bmkKey]) _goto(b[_bmkKey]);
  });

  // User icon — initial from the shell's user pill.
  var pill = document.getElementById('userPill');
  var uname = pill ? (pill.textContent || '').trim() : '';
  if(!uname) uname = 'Visitor';
  q('#fr-user-btn').textContent = uname.charAt(0).toUpperCase();
  var uHtml = '<div class="fr-user-name"></div>';
  userPanel.innerHTML = uHtml;
  userPanel.querySelector('.fr-user-name').textContent = uname;
  if(uname.toLowerCase() !== 'visitor'){
    var so = document.createElement('button');
    so.className = 'fr-user-signout';
    so.type = 'button';
    so.textContent = 'Sign out';
    so.addEventListener('click', function(){
      var b = document.querySelector('#userDropdown [data-action="signout"]');
      close();
      if(b) b.click();
    });
    userPanel.appendChild(so);
  }
  q('#fr-user-btn').addEventListener('click', function(e){
    e.stopPropagation();
    menuPanel.classList.remove('open');
    infoBubble.classList.remove('open');
    userPanel.classList.toggle('open');
  });

  // Click-away closes the small panels (but never a dropdown's own panel).
  _overlay.addEventListener('click', function(e){
    if(e.target.closest('#fr-menu-panel') || e.target.closest('#fr-menu-btn')) return;
    if(e.target.closest('#fr-user-panel') || e.target.closest('#fr-user-btn')) return;
    if(e.target.closest('#fr-info-bubble') || e.target.closest('#fr-info')) return;
    if(e.target.closest('.dd-panel')) return;
    menuPanel.classList.remove('open');
    infoBubble.classList.remove('open');
    userPanel.classList.remove('open');
  });
}

function _onKey(e){
  if(!_open) return;
  if(e.key === 'Escape'){
    // Let an open dropdown panel take the Esc first.
    var openDd = document.querySelector('.dd-panel.open');
    if(openDd){ return; }
    e.preventDefault();
    e.stopPropagation();
    close();
    return;
  }
  var t = e.target;
  var typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
  if(typing) return;
  if(e.key === 'ArrowRight'){ _goto(_pages.cur + 1); }
  else if(e.key === 'ArrowLeft'){ _goto(_pages.cur - 1); }
}

// ── font scale ──────────────────────────────────────────────
function _setScale(v){
  _scale = Math.min(2, Math.max(0.6, Math.round(v * 10) / 10));
  _lsSet('goldark_fr_scale', String(_scale));
  _applyScale();
  _deferRecalc();
}
function _applyScale(){
  if(_host) _host.style.zoom = _scale;
}

// ── paragraph breaks (all 3 views) ──────────────────────────
// Long passages (tafsir bodies, hadith introductions, etc.) render as
// one wall of text. Inside the reader we insert empty
// <span class="fr-para-brk"> markers at sentence boundaries (every few
// sentences). THE TEXT IS NEVER CHANGED — the markers are empty and only
// styled inside the reader; outside it they are invisible inline spans.
var PARA_EVERY = 4;   // sentences per paragraph
var PARA_MIN = 500;   // only text blocks longer than this get breaks
function _paraSplit(){
  if(!_host) return;
  var walker = document.createTreeWalker(_host, NodeFilter.SHOW_TEXT, {
    acceptNode: function(n){
      if(!n.nodeValue || n.nodeValue.length < PARA_MIN) return NodeFilter.FILTER_REJECT;
      var pe = n.parentElement;
      if(!pe) return NodeFilter.FILTER_REJECT;
      if(pe.closest('[data-fr-para]')) return NodeFilter.FILTER_REJECT;
      var tag = pe.tagName;
      if(tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'BUTTON') return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  var nodes = [], n;
  while((n = walker.nextNode())) nodes.push(n);
  for(var i = 0; i < nodes.length; i++){
    var t = nodes[i];
    if(t.parentElement) t.parentElement.setAttribute('data-fr-para', '1');
    var count = 0, guard = 0;
    while(t && guard++ < 400){
      var sv = t.nodeValue || '';
      var re = /[.!?\u061F\u06D4](?=\s)/g, m, splitAt = -1;
      while((m = re.exec(sv))){
        count++;
        if(count >= PARA_EVERY){ splitAt = m.index + 1; count = 0; break; }
      }
      if(splitAt < 0) break;
      var rest = t.splitText(splitAt);
      var brk = document.createElement('span');
      brk.className = 'fr-para-brk';
      rest.parentNode.insertBefore(brk, rest);
      t = rest;
    }
  }
}

// ── paging ──────────────────────────────────────────────────
function _pageH(){ return Math.max(1, _viewport.clientHeight); }
function _recalc(){
  if(!_overlay || !_viewport) return;
  _paraSplit();
  var ph = _pageH();
  var total = Math.max(1, Math.ceil(_viewport.scrollHeight / ph));
  var cur = Math.min(total, Math.floor(_viewport.scrollTop / ph + 0.5) + 1);
  _pages = { cur: cur, total: total };
  var lbl = _overlay.querySelector('#fr-page');
  if(lbl) lbl.textContent = 'Page ' + cur + ' of ' + total;
  _refreshTitle();
  _refreshBmk();
}
function _deferRecalc(){ if(_rt) clearTimeout(_rt); _rt = setTimeout(_recalc, 150); }
function _onScroll(){ if(_rt) clearTimeout(_rt); _rt = setTimeout(_recalc, 80); }
function _goto(p){
  if(!_viewport) return;
  var ph = _pageH();
  var total = Math.max(1, Math.ceil(_viewport.scrollHeight / ph));
  p = Math.min(Math.max(1, p), total);
  _viewport.scrollTo({ top: (p - 1) * ph, behavior: 'smooth' });
}

// ── title + bookmark refresh ────────────────────────────────
function _refreshTitle(){
  if(!_overlay || !_tab) return;
  var cfg = VIEWS[_tab];
  var t = '';
  try { t = cfg.title() || ''; } catch(e){ t = ''; }
  var el = _overlay.querySelector('#fr-title');
  if(el && el.textContent !== t) el.textContent = t;
  _bmkKey = _tab + '|' + t;
}
function _refreshBmk(){
  if(!_overlay) return;
  var b = _bmarks();
  var saved = b[_bmkKey];
  var btn = _overlay.querySelector('#fr-bmk');
  var chip = _overlay.querySelector('#fr-bmk-chip');
  if(btn) btn.classList.toggle('fr-bmk-on', saved === _pages.cur);
  if(chip){
    if(saved){
      chip.style.display = '';
      chip.textContent = '↦ p.' + saved;
      chip.title = 'Go to bookmarked page ' + saved;
    } else {
      chip.style.display = 'none';
    }
  }
}

// ── READ pill injection + tab-change handling ───────────────
// The pill only APPEARS once a book is actually open in the view
// (Adam, 2026-08-04): EXPLAIN needs a tafsir open, MONASTIC needs
// hadiths loaded, START needs the surah rendered.
var _reopen = null;   // { tab, until } — reader follows jumps between the 3 views

function _ensurePill(){
  var tab = document.body.getAttribute('data-active-tab') || '';
  if(_open && tab !== _tab){
    // Leaving the view exits the reader; if the destination is another
    // reader view (tag jump), re-enter READ there once its book loads.
    var follow = !!VIEWS[tab];
    close();
    _reopen = follow ? { tab: tab, until: Date.now() + 12000 } : null;
  }
  if(!VIEWS[tab]){ _reopen = null; return; }
  var zb = document.getElementById('zoneB');
  if(!zb) return;
  if(!zb.querySelector('.fr-read-pill')){
    var row1 = zb.querySelector('.zb-row1');
    if(!row1) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'zb-pill fr-read-pill';
    btn.title = 'Focus reader — the book only, full screen';
    btn.textContent = '⛶ READ';
    btn.style.display = 'none';
    btn.addEventListener('click', function(){
      open(document.body.getAttribute('data-active-tab') || '');
    });
    row1.appendChild(btn);
  }
  _refreshPill();
}

function _refreshPill(){
  var tab = document.body.getAttribute('data-active-tab') || '';
  var cfg = VIEWS[tab];
  var zb = document.getElementById('zoneB');
  var btn = zb ? zb.querySelector('.fr-read-pill') : null;
  var ok = false;
  if(cfg){ try { ok = !!cfg.ready(); } catch(e){ ok = false; } }
  if(btn) btn.style.display = ok ? '' : 'none';
  // Follow-through: reopen the reader on the destination view when ready.
  if(_reopen){
    if(tab !== _reopen.tab || Date.now() > _reopen.until){ _reopen = null; }
    else if(ok && document.querySelector(cfg.content)){
      var t = _reopen.tab; _reopen = null;
      open(t);
    }
  }
}

function _boot(){
  _ensurePill();
  try {
    new MutationObserver(_ensurePill)
      .observe(document.body, { attributes: true, attributeFilter: ['data-active-tab'] });
  } catch(e){}
  var zb = document.getElementById('zoneB');
  if(zb){
    try { new MutationObserver(_ensurePill).observe(zb, { childList: true }); } catch(e){}
  }
  setInterval(_refreshPill, 800);
}
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _boot);
else _boot();

window.FocusReader = { open: open, close: close, isOpen: function(){ return _open; } };
})();
