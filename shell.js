(function(){
'use strict';

var TABS_ROW1 = ['TIMELINE','SILSILA','FOLLOW','STUDY','BOOKS','ERAS','EVENTS'];
var TABS_ROW2 = ['THINK','MAP','TALK','ONE','MONASTIC','EXPLAIN','START'];
var ALL_TABS = TABS_ROW1.concat(TABS_ROW2);

var _tabFocused = false;
var state = {
  tier: 'visitor',
  activeTab: 'TIMELINE',
  animating: false,
  audioPlaying: false,
  speed: '1x'
};

// ---------- View navigation history ----------
var NAV_MAX = 50;
var navHistory = { back: [], forward: [] };
var _pendingRestore = null;

function _captureCurrent(){
  var zc = document.getElementById('zoneC');
  var vs = null;
  try {
    if(_activeViewApi && typeof _activeViewApi.captureState === 'function'){
      vs = _activeViewApi.captureState();
    }
  } catch(e){}
  return {
    tab: state.activeTab,
    hash: location.hash || '',
    scroll: zc ? zc.scrollTop : 0,
    viewState: vs
  };
}

function _updateNavButtons(){
  var b = document.getElementById('zdBack');
  var f = document.getElementById('zdForward');
  if(b) b.disabled = navHistory.back.length === 0;
  if(f) f.disabled = navHistory.forward.length === 0;
}

function navBack(){
  if(navHistory.back.length === 0) return;
  navHistory.forward.push(_captureCurrent());
  if(navHistory.forward.length > NAV_MAX) navHistory.forward.shift();
  var entry = navHistory.back.pop();
  if(entry.hash){
    try { history.replaceState(null, '', entry.hash); } catch(e){ location.hash = entry.hash; }
  }
  setActiveTab(entry.tab, { skipHistory: true, restoreData: entry });
}

function navForward(){
  if(navHistory.forward.length === 0) return;
  navHistory.back.push(_captureCurrent());
  if(navHistory.back.length > NAV_MAX) navHistory.back.shift();
  var entry = navHistory.forward.pop();
  if(entry.hash){
    try { history.replaceState(null, '', entry.hash); } catch(e){ location.hash = entry.hash; }
  }
  setActiveTab(entry.tab, { skipHistory: true, restoreData: entry });
}
window.userTier = 'visitor';
window.userRole = 'user';

// Two-field tier model per CV21:
//   tier: 'visitor' | 'tester' | 'subscriber'   (auth.js also surfaces 'free' as alias for tester)
//   role: 'user'    | 'contributor' | 'admin'
// SHARE/SNAPSHOT/FEEDBACK unlock at tier !== 'visitor'.
// Suggest Correction unlocks at role === 'contributor' or 'admin'.
var TIER_RANK = { visitor:0, tester:1, free:1, subscriber:2 };
var ROLE_RANK = { user:0, contributor:1, admin:2 };
var _displayName = '';

function setUserTier(tier){
  if(!(tier in TIER_RANK)) tier = 'visitor';
  state.tier = tier;
  window.userTier = tier;
  _renderUserPill();
  _refreshToolsLocks();
}
function setUserRole(role){
  if(!(role in ROLE_RANK)) role = 'user';
  window.userRole = role;
  _renderUserPill();
  _refreshToolsLocks();
}
function setUserDisplayName(name){
  _displayName = name ? String(name) : '';
  _renderUserPill();
}

function _renderUserPill(){
  var pill = document.getElementById('userPill');
  if(!pill) return;
  var tier = state.tier || 'visitor';
  var role = window.userRole || 'user';
  var dn = _displayName || 'Signed in';
  if(tier === 'visitor'){
    pill.textContent = 'VISITOR';
  } else if(tier === 'subscriber'){
    pill.textContent = dn + ' · SCHOLAR';
  } else if(tier === 'tester' || tier === 'free'){
    if(role === 'contributor' || role === 'admin'){
      pill.textContent = dn + ' · ' + role.toUpperCase();
    } else {
      pill.textContent = dn + ' · TESTER';
    }
  } else {
    pill.textContent = dn;
  }
}

function _refreshToolsLocks(){
  var dd = document.getElementById('toolsDropdown');
  if(!dd) return;
  var tier = state.tier || 'visitor';
  var role = window.userRole || 'user';
  dd.querySelectorAll('.menu-item').forEach(function(item){
    var lockKey = item.dataset.lock;
    if(!lockKey) return;
    var locked;
    var needRole = item.dataset.needRole;
    if(needRole === 'contributor'){
      locked = (ROLE_RANK[role] || 0) < ROLE_RANK.contributor;
    } else {
      locked = (tier === 'visitor');
    }
    item.classList.toggle('locked', locked);
    var base = item.textContent.replace(/\s*🔒\s*$/, '').trim();
    item.textContent = locked ? (base + ' 🔒') : base;
  });
}
window.setUserTier = setUserTier;
window.setUserRole = setUserRole;
window.setUserDisplayName = setUserDisplayName;

// Zone D per-view rules: which controls are enabled
var ZONE_D_RULES = {
  TIMELINE:  { animate: true,  audio: false },
  SILSILA:   { animate: true,  audio: false },
  FOLLOW:    { animate: true,  audio: false },
  STUDY:     { animate: false, audio: false },
  BOOKS:     { animate: true,  audio: false },
  ERAS:      { animate: true,  audio: false },
  EVENTS:    { animate: true,  audio: false },
  THINK:     { animate: true,  audio: false },
  MAP:       { animate: true,  audio: false },
  TALK:      { animate: false, audio: false },
  ONE:       { animate: false, audio: false },
  MONASTIC:  { animate: false, audio: false },
  EXPLAIN:   { animate: false, audio: false },
  START:     { animate: true,  audio: false }
};

// ---------- Filter specs (slot model) ----------
// Universal Zone B layout: [SEARCH 240px] [filters...] [spacer] [actions...] [HOW THIS WORKS]
// Each view declares: { search, filters, actions, htw }
// ---------- View registry (lazy-loaded view modules) ----------
var VIEW_REGISTRY = {
  TIMELINE: { script: 'timeline.js', css: 'timeline.css', api: 'TimelineView' },
  SILSILA:  { script: 'silsila.js',  css: 'silsila.css',  api: 'SilsilaView' },
  FOLLOW:   { script: 'follow.js',   css: 'follow.css',   api: 'FollowView' },
  STUDY:    { script: 'study.js',    css: 'study.css',    api: 'StudyView' },
  BOOKS:    { script: 'books.js',    css: 'books.css',    api: 'BooksView' },
  ERAS:     { script: 'eras.js',     css: 'eras.css',     api: 'ErasView' },
  EVENTS:   { script: 'events.js',   css: 'events.css',   api: 'EventsView' },
  THINK:    { script: 'think.js',    css: 'think.css',    api: 'ThinkView' },
  MAP:      { script: 'map.js',      css: 'map.css',      api: 'MapView' },
  TALK:     { script: 'talk.js',     css: 'talk.css',     api: 'TalkView' },
  ONE:      { script: 'one.js',      css: 'one.css',      api: 'OneView' },
  MONASTIC: { script: 'monastic.js', css: 'monastic.css', api: 'MonasticView' },
  EXPLAIN:  { script: 'explain.js',  css: 'explain.css',  api: 'ExplainView' },
  START:    { script: 'start.js',    css: 'start.css',    api: 'StartView' }
};

var _activeViewApi = null;
var _loadedViews = {};  // cache loaded scripts

function loadAndMountView(name){
  var cfg = VIEW_REGISTRY[name];
  if(!cfg) return false;
  var zoneC = document.getElementById('zoneC');
  var zoneB = document.getElementById('zoneB');
  // Clear Zone C only — Zone B is owned by shell renderZoneB; the view wires handlers to its existing DOM.
  zoneC.innerHTML = '';
  function doMount(){
    _activeViewApi = window[cfg.api];
    if(_activeViewApi && typeof _activeViewApi.mount === 'function'){
      _activeViewApi.mount(zoneC, zoneB);
    }
    if(_pendingRestore){
      var rd = _pendingRestore;
      _pendingRestore = null;
      try {
        var zc = document.getElementById('zoneC');
        if(zc && typeof rd.scroll === 'number'){
          setTimeout(function(){ zc.scrollTop = rd.scroll; }, 0);
        }
      } catch(e){}
      if(rd.viewState && _activeViewApi && typeof _activeViewApi.restoreState === 'function'){
        try { _activeViewApi.restoreState(rd.viewState); } catch(e){}
      }
    }
    _updateNavButtons();
  }
  if(_loadedViews[name]){
    doMount();
    return true;
  }
  // load CSS once (with cache-bust to defeat browser caching during dev)
  var _cb = '?v=' + Date.now();
  if(cfg.css){
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = cfg.css + _cb;
    document.head.appendChild(l);
  }
  var s = document.createElement('script');
  s.src = cfg.script + _cb;
  s.onload = function(){
    _loadedViews[name] = true;
    doMount();
  };
  document.head.appendChild(s);
  return true;
}

var FILTER_SPECS = {
  TIMELINE: {
    search: true,
    filters: [
      { type:'select', label:'TYPE' },
      { type:'select', label:'TRADITION' },
      { type:'select', label:'HAS' }
    ],
    actions: [],
    htw: true
  },
  SILSILA: {
    search: true,
    slider: true,
    filters: [
      { type:'select', label:'TYPE' },
      { type:'select', label:'TRADITION' }
    ],
    actions: [ { type:'pill', label:'★ Saved' }, { type:'pill', label:'Reset' } ],
    actionsInRow1: true,
    hint: 'Click node to highlight · Click again for details',
    hintInRow2: true,
    htw: true
  },
  FOLLOW: {
    search: false,
    filters: [],
    actions: [],
    htw: true
  },
  STUDY: {
    search: true,
    filters: [],
    actions: [],
    hint: 'Browse slide decks, summaries, and curated video content',
    hintInRow2: true,
    htw: true
  },
  BOOKS: {
    search: true,
    filters: [
      { type:'select', label:'SOURCE' },
      { type:'select', label:'THEME' },
      { type:'select', label:'AUTHOR' }
    ],
    actions: [
      { type:'pill', label:'+ ANCIENT' }
    ],
    hint: 'Browse the book library across themes, eras, and traditions',
    hintInRow2: true,
    htw: true
  },
  ERAS: {
    search: false,
    filters: [
      { type:'select', label:'TYPE' },
      { type:'select', label:'TRADITION' }
    ],
    actions: [],
    hint: 'Explore the time lines individually',
    hintInRow2: true,
    htw: true
  },
  EVENTS: {
    search: true,
    filters: [
      { type:'select', label:'CATEGORY' },
      { type:'select', label:'CENTURY' }
    ],
    actions: [ { type:'pill', label:'Show next 100' } ],
    hint: 'Important historical events',
    hintInRow2: true,
    htw: true
  },
  THINK: {
    search: false,
    filters: [ { type:'select', label:'Concept' } ],
    actions: [ { type:'pill', label:'عربية' }, { type:'pill', label:'اردو' } ],
    hint: 'Follow a concept through history',
    hintInRow2: true,
    htw: true
  },
  MAP: {
    search: true,
    slider: true,
    filters: [
      { type:'select', label:'Type' },
      { type:'select', label:'Tradition' }
    ],
    actions: [ { type:'pill', label:'Empires' }, { type:'pill', label:'Recenter' } ],
    hint: 'See the people on the maps at the same time',
    hintInRow2: true,
    htw: true
  },
  TALK: {
    search: false,
    filters: [],
    actions: [],
    hint: 'Talk to a scholar',
    hintInRow2: true,
    htw: false
  },
  ONE: {
    search: true,
    filters: [
      { type:'select', label:'Era' },
      { type:'select', label:'Century' },
      { type:'select', label:'City' },
      { type:'select', label:'Type' },
      { type:'select', label:'Tradition' }
    ],
    actions: [ { type:'pill', label:'+ Compare' } ],
    htw: false
  },
  MONASTIC: {
    search: true,
    filters: [
      { type:'select', label:'Narrators' },
      { type:'select', label:'Collections' }
    ],
    actions: [
      { type:'pill', label:'✦ Guided' },
      { type:'pill', label:'⛭ DRILL' },
      { type:'pill', label:'EN' },
      { type:'pill', label:'AR' },
      { type:'pill', label:'UR' }
    ],
    actionsInRow1: true,
    bookmarks: true,
    hint: 'Hadith — six canonical and other major collections',
    hintInRow2: true,
    htw: false
  },
  EXPLAIN: {
    search: true,
    filters: [
      { type:'select', label:'Tafsir' },
      { type:'select', label:'Language' }
    ],
    actions: [],
    bookmarks: true,
    hint: 'Tafsir Collection — The Explanation',
    hintInRow2: true,
    htw: false
  },
  START: {
    search: false,
    filters: [
      { type:'select', label:'Surah' },
      { type:'select', label:'Verse' },
      { type:'select', label:'Juz' },
      { type:'select', label:'Hizb' },
      { type:'select', label:'Manzil' },
      { type:'select', label:'Reciter' },
      { type:'select', label:'Translation' }
    ],
    actions: [
      // Phase 2: A−/A+ hidden — global font control at top of app handles this.
      // { type:'pill', label:'A−' },
      // { type:'pill', label:'A+' },
      // Phase 2: ع (arabic-only) and T (translation-only) hidden — hybrid only.
      // { type:'pill', label:'ع' },
      { type:'pill', label:'ع | T' }
      // { type:'pill', label:'T' }
    ],
    actionsInRow1: true,
    hint: 'READ THE QURAN',
    hintInRow2: false,
    htw: false
  }
};

// ---------- Entry door ----------
function showEntry(){
  document.getElementById('entryDoor').hidden = false;
  document.getElementById('appShell').hidden = true;
}
function showShell(){
  document.getElementById('entryDoor').hidden = true;
  document.getElementById('appShell').hidden = false;
  // Entry door always lands on TIMELINE in browse mode — clear any stale hash.
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){ location.hash = ''; }
  state.activeTab = 'TIMELINE';
  setActiveTab('TIMELINE');
}

// ---------- Tabs ----------
function buildTabs(){
  var r1 = document.getElementById('tabRow1');
  var r2 = document.getElementById('tabRow2');
  if(!r1 || !r2) return;
  r1.innerHTML = '';
  r2.innerHTML = '';
  TABS_ROW1.forEach(function(t){ r1.appendChild(makeTab(t)); });
  TABS_ROW2.forEach(function(t){ r2.appendChild(makeTab(t)); });
  document.body.setAttribute('data-tab-mode', 'browse');
  _tabFocused = false;
}

function _enterFocusedMode(){
  if(_tabFocused) return;
  _tabFocused = true;

  var r1 = document.getElementById('tabRow1');
  var r2 = document.getElementById('tabRow2');
  if(!r1 || !r2) return;

  // Move row2 tabs into row1 in their original order.
  while(r2.firstChild){ r1.appendChild(r2.firstChild); }

  // Wrap row1 in a viewport with prev/next arrows (idempotent).
  if(r1.parentNode && r1.parentNode.id !== 'tabViewport'){
    var vp = document.createElement('div');
    vp.id = 'tabViewport';
    vp.className = 'tab-viewport';
    r1.parentNode.insertBefore(vp, r1);
    vp.appendChild(r1);

    var prev = document.createElement('button');
    prev.className = 'tab-arrow tab-arrow-prev';
    prev.type = 'button';
    prev.setAttribute('aria-label', 'Previous tab');
    prev.textContent = '◀';
    prev.addEventListener('click', function(){
      var idx = ALL_TABS.indexOf(state.activeTab);
      if(idx > 0) setActiveTab(ALL_TABS[idx - 1]);
    });
    var next = document.createElement('button');
    next.className = 'tab-arrow tab-arrow-next';
    next.type = 'button';
    next.setAttribute('aria-label', 'Next tab');
    next.textContent = '▶';
    next.addEventListener('click', function(){
      var idx = ALL_TABS.indexOf(state.activeTab);
      if(idx >= 0 && idx < ALL_TABS.length - 1) setActiveTab(ALL_TABS[idx + 1]);
    });
    vp.appendChild(prev);
    vp.appendChild(next);
  }

  if(!window._tabResizeBound){
    window._tabResizeBound = true;
    window.addEventListener('resize', function(){ _centerActiveTab(); });
  }

  document.body.setAttribute('data-tab-mode', 'focused');
  setTimeout(_centerActiveTab, 0);
}
// Translate the tab row so the active tab's centre aligns with the
// viewport's centre. Also flips the prev/next arrow disabled state.
function _centerActiveTab(){
  if(!_tabFocused) return;
  var vp = document.getElementById('tabViewport');
  var row = document.getElementById('tabRow1');
  if(!vp || !row) return;
  var active = row.querySelector('.tab-btn.active');
  if(!active){
    row.style.transform = 'translateX(0)';
  } else {
    var vpW = vp.clientWidth;
    var aLeft = active.offsetLeft;
    var aW = active.offsetWidth;
    var dx = (vpW / 2) - (aLeft + aW / 2);
    row.style.transform = 'translateX(' + dx + 'px)';
  }
  var idx = ALL_TABS.indexOf(state.activeTab);
  var prev = vp.querySelector('.tab-arrow-prev');
  var next = vp.querySelector('.tab-arrow-next');
  if(prev) prev.disabled = (idx <= 0);
  if(next) next.disabled = (idx < 0 || idx >= ALL_TABS.length - 1);
}

function makeTab(name){
  var b = document.createElement('button');
  b.className = 'tab-btn';
  b.dataset.tab = name;
  b.textContent = name;
  b.addEventListener('click', function(){
    _enterFocusedMode();
    setActiveTab(name);
  });
  return b;
}
function setActiveTab(name, opts){
  opts = opts || {};
  // Push outgoing state onto back stack ONLY for user-driven new tab clicks
  if(!opts.skipHistory && _activeViewApi && state.activeTab !== name){
    navHistory.back.push(_captureCurrent());
    if(navHistory.back.length > NAV_MAX) navHistory.back.shift();
    navHistory.forward = [];
  }
  if(opts.restoreData){ _pendingRestore = opts.restoreData; }
  try { document.body.setAttribute('data-active-tab', String(name).toUpperCase()); } catch(e){}
  state.activeTab = name;
  document.body.setAttribute('data-active-tab', name);
  // Reset transient zone D state on tab change
  if(_animTickTimer){ clearTimeout(_animTickTimer); _animTickTimer = null; }
  state.animating = false;
  state.audioPlaying = false;
  document.querySelectorAll('.tab-btn').forEach(function(b){
    b.classList.toggle('active', b.dataset.tab === name);
  });
  _centerActiveTab();

  // If we have a previously-active view, unmount it before swapping content
  if(_activeViewApi && typeof _activeViewApi.unmount === 'function'){
    try { _activeViewApi.unmount(); } catch(e) {}
    _activeViewApi = null;
  }

  // Always render Zone B from spec (universal row 1 + view-specific row 2)
  renderZoneB(name);

  if(VIEW_REGISTRY[name]){
    // Real view: lazy-load and mount; the view wires its own handlers to the shell-built Zone B DOM
    loadAndMountView(name);
  } else {
    // Placeholder fallback for unimplemented views
    var zoneC = document.getElementById('zoneC');
    if(zoneC){
      zoneC.innerHTML = '<div class="view-placeholder" id="viewPlaceholder">'
        + '<div class="placeholder-name" id="placeholderName">' + name + '</div>'
        + '<div class="placeholder-sub">View body placeholder</div>'
        + '</div>';
    }
    _pendingRestore = null;
  }

  _renderShellBookmarkPill(name);
  syncZoneD();
  if(!opts.skipHistory){
    if(history.replaceState) history.replaceState(null, '', '#' + name.toLowerCase());
    else location.hash = name.toLowerCase();
  }
  _updateNavButtons();
}

// ---------- Zone B render (2 rows) ----------
// Row 1 — universal, locked slot positions: [Search] [Slider] [spacer] [Saved] [HTW]
// Row 2 — view-specific filters + actions, collapsible if empty
function renderZoneB(viewName){
  var zb = document.getElementById('zoneB');
  zb.innerHTML = '';
  var spec = FILTER_SPECS[viewName] || { search:false, filters:[], actions:[], htw:true };

  // ── ROW 1 ──
  var row1 = document.createElement('div');
  row1.className = 'zb-row1';

  // Search slot
  var searchSlot = document.createElement('div');
  searchSlot.className = 'zb-slot-search';
  if(spec.search){
    var sLbl = document.createElement('label');
    sLbl.className = 'zb-search';
    var sInp = document.createElement('input');
    sInp.type = 'text';
    sInp.id = 'search';
    sInp.className = 'zb-search-input';
    sInp.placeholder = 'Search…';
    sLbl.appendChild(sInp);
    bindActiveToggle(sLbl, sInp);
    searchSlot.appendChild(sLbl);
  }
  if(viewName === 'FOLLOW'){
    searchSlot.style.position = 'relative';
    searchSlot.innerHTML =
      '<div id="fw-add-wrap" style="position:relative">' +
        '<button id="fw-add-btn" class="zb-select" type="button">+ Add figures</button>' +
        '<div id="fw-add-panel" style="display:none"></div>' +
      '</div>';
  }
  row1.appendChild(searchSlot);

  // Year-slider slot — DOM built for TIMELINE or any view declaring spec.slider
  var sliderSlot = document.createElement('div');
  sliderSlot.className = 'zb-slot-slider';
  if(viewName === 'TIMELINE' || spec.slider){
    sliderSlot.innerHTML =
      '<div id="hdrYearControls">' +
        '<span id="yearQuestion">WHO WAS ALIVE IN</span>' +
        '<span class="hdr-range-cap">500</span>' +
        '<div id="sliderOuter">' +
          '<input id="sliderInput" type="range" min="500" max="2000" value="800" step="5">' +
          '<div id="sliderTrack" class="sl-inactive">' +
            '<div id="sliderFill"></div>' +
            '<div id="sliderThumb" tabindex="0"></div>' +
          '</div>' +
        '</div>' +
        '<span id="yearDisplay">&mdash;</span>' +
        '<span id="yrPrecisionPill">1 YR</span>' +
        '<button id="yearClearBtn" type="button" aria-label="Clear year">&times;</button>' +
        '<span id="yrShiftHint" class="hdr-range-cap">hold &#8679; for 1yr</span>' +
      '</div>';
  }
  if(viewName === 'FOLLOW'){
    sliderSlot.innerHTML = '<div id="fw-title" style="font-family:Cinzel,serif;font-size:var(--fs-3);letter-spacing:.08em;color:var(--muted);text-align:center;font-variant:small-caps;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Follow figures through their life journey</div>';
    sliderSlot.style.flex = '1';
  }
  if(viewName === 'THINK'){
    sliderSlot.innerHTML = '<div id="think-shell-legend" style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;width:100%;font-family:\'Source Sans 3\',sans-serif;font-size:var(--fs-3);color:#A0AEC0;letter-spacing:.04em"></div>';
    sliderSlot.style.flex = '1';
  }
  row1.appendChild(sliderSlot);

  // Spacer
  var sp1 = document.createElement('span');
  sp1.className = 'zb-slot-spacer';
  row1.appendChild(sp1);

  // Hint slot in row 1 — only if spec.hint set AND not pushed to row 2
  if(spec.hint && !spec.hintInRow2){
    var hintSlot = document.createElement('span');
    hintSlot.className = 'zb-slot-hint';
    hintSlot.textContent = spec.hint;
    row1.appendChild(hintSlot);
  }

  // Saved slot — TIMELINE has its own pill; if spec.actionsInRow1, render actions here
  var savedSlot = document.createElement('div');
  savedSlot.className = 'zb-slot-saved';
  if(viewName === 'TIMELINE'){
    var sBtn = document.createElement('button');
    sBtn.className = 'zb-pill';
    sBtn.id = 'zbSavedPill';
    sBtn.type = 'button';
    sBtn.textContent = 'SAVED';
    savedSlot.appendChild(sBtn);
  } else if(viewName === 'FOLLOW'){
    savedSlot.innerHTML =
      '<div id="fw-grades-inline">' +
        '<span class="fw-grade-pill" style="background:#4a7c59">A</span>Highly' +
        '<span class="fw-gi-sep">·</span>' +
        '<span class="fw-grade-pill" style="background:#4a6d8c">B</span>Mostly' +
        '<span class="fw-gi-sep">·</span>' +
        '<span class="fw-grade-pill" style="background:#b08030">C</span>Some' +
        '<span class="fw-gi-sep">·</span>' +
        '<span class="fw-grade-pill" style="background:#707070">D</span>Weak' +
      '</div>';
  } else if(spec.actionsInRow1 && spec.actions){
    spec.actions.forEach(function(a){
      var el = makeZBItem(a);
      if(el) savedSlot.appendChild(el);
    });
  }
  row1.appendChild(savedSlot);

  // HTW (always far right)
  if(spec.htw !== false){
    var htw = document.createElement('button');
    htw.className = 'zb-pill zb-slot-htw';
    htw.id = 'zbHtwPill';
    htw.type = 'button';
    htw.textContent = 'How This Works';
    htw.addEventListener('click', function(){
      var api = _activeViewApi;
      if(api && typeof api.showHtw === 'function') api.showHtw();
    });
    row1.appendChild(htw);
  }

  zb.appendChild(row1);

  // ── ROW 2 ──
  var row2 = document.createElement('div');
  row2.className = 'zb-row2';
  var filters = spec.filters || [];
  var actions = spec.actions || [];
  var actionsForRow2 = spec.actionsInRow1 ? [] : actions;
  var hintForRow2 = (spec.hint && spec.hintInRow2) ? spec.hint : '';
  if(filters.length === 0 && actionsForRow2.length === 0 && !hintForRow2){
    row2.classList.add('is-empty');
  } else {
    filters.forEach(function(f){
      var el = makeZBItem(f);
      if(el) row2.appendChild(el);
    });
    var sp2 = document.createElement('span');
    sp2.className = 'zb-slot-spacer';
    row2.appendChild(sp2);
    if(hintForRow2){
      var hintR2 = document.createElement('span');
      hintR2.className = 'zb-slot-hint';
      hintR2.textContent = hintForRow2;
      row2.appendChild(hintR2);
    }
    actionsForRow2.forEach(function(a){
      var el = makeZBItem(a);
      if(el) row2.appendChild(el);
    });
  }
  if(viewName === 'FOLLOW'){
    row2.classList.remove('is-empty');
    row2.innerHTML =
      '<div id="fw-scrubber" style="flex:1;min-width:0">' +
        '<div id="fw-scrubber-track">' +
          '<div id="fw-scrubber-fill"></div>' +
          '<div id="fw-scrubber-marks"></div>' +
          '<div id="fw-scrubber-thumb"></div>' +
        '</div>' +
        '<div id="fw-scrubber-labels">' +
          '<span id="fw-scrub-start"></span>' +
          '<span id="fw-scrub-current"></span>' +
          '<span id="fw-scrub-end"></span>' +
        '</div>' +
      '</div>';
  }
  zb.appendChild(row2);
}

function makeZBItem(item){
  var el;
  switch(item.type){
    case 'search':
      el = document.createElement('label');
      el.className = 'zb-search';
      if(item.width) el.style.width = item.width + 'px';
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'zb-search-input';
      inp.placeholder = item.placeholder || 'Search…';
      el.appendChild(inp);
      bindActiveToggle(el, inp);
      return el;
    case 'select':
      el = document.createElement('button');
      el.className = 'zb-select';
      el.type = 'button';
      el.textContent = item.label || 'Select';
      if(item.width) el.style.width = item.width + 'px';
      bindActiveToggle(el);
      return el;
    case 'pill':
      el = document.createElement('button');
      el.className = 'zb-pill';
      el.type = 'button';
      el.textContent = item.label || 'Pill';
      bindActiveToggle(el);
      return el;
    case 'iconbtn':
      el = document.createElement('button');
      el.className = 'zb-icon-btn';
      el.type = 'button';
      el.textContent = item.icon || '•';
      if(item.title) el.title = item.title;
      bindActiveToggle(el);
      return el;
    case 'divider':
      el = document.createElement('span');
      el.className = 'zb-divider';
      return el;
    case 'spacer':
      el = document.createElement('span');
      el.className = 'zb-spacer';
      return el;
  }
  return null;
}

function bindActiveToggle(el, focusTarget){
  el.addEventListener('click', function(e){
    if(focusTarget && e.target === focusTarget) return;
    el.classList.toggle('zb-active');
  });
  if(focusTarget){
    focusTarget.addEventListener('focus', function(){ el.classList.add('zb-active'); });
    focusTarget.addEventListener('blur',  function(){
      if(!focusTarget.value) el.classList.remove('zb-active');
    });
  }
}

// ---------- Universal bookmarks pill ----------
// Injects a "★ BOOKMARKS (N)" pill into row 1 search slot for any view whose
// FILTER_SPEC has bookmarks:true. Click delegates to window.openBookmarksModal,
// which lazy-loads start.js if needed to use the existing modal.
function _renderShellBookmarkPill(viewName){
  var spec = FILTER_SPECS[viewName];
  if(!spec || !spec.bookmarks) return;
  var zb = document.getElementById('zoneB');
  if(!zb) return;
  var row1 = zb.querySelector('.zb-row1');
  if(!row1) return;
  var slot = row1.querySelector('.zb-slot-search');
  if(!slot) return;

  // Avoid duplicate (start.js may inject its own pill on START view).
  if(slot.querySelector('#ga-shell-bmk')) return;

  var btn = document.createElement('button');
  btn.id = 'ga-shell-bmk';
  btn.type = 'button';
  btn.className = 'zb-pill';
  btn.style.marginLeft = '8px';
  btn.addEventListener('click', function(){
    if(typeof window.requireTester === 'function'){
      window.requireTester('bookmarks', function(){
        if(typeof window.openBookmarksModal === 'function') window.openBookmarksModal();
      });
    } else if(typeof window.openBookmarksModal === 'function'){
      window.openBookmarksModal();
    }
  });
  slot.appendChild(btn);
  _refreshShellBookmarkPill();
}

function _refreshShellBookmarkPill(){
  var btn = document.getElementById('ga-shell-bmk');
  if(!btn) return;
  var auth = window.GoldArkAuth;
  var count = (auth && auth.isSignedIn && auth.isSignedIn() && auth.getBookmarks)
    ? auth.getBookmarks().length : 0;
  var hasAny = count > 0;
  btn.textContent = '★ BOOKMARKS' + (hasAny ? ' (' + count + ')' : '');
  btn.title = hasAny ? ('View my ' + count + ' bookmark(s)') : 'No bookmarks yet';
}

// Open bookmarks modal. Lazy-load start.js if its modal function isn't defined yet.
window.openBookmarksModal = function(){
  if(typeof window._stBmkPopup === 'function'){ window._stBmkPopup(); return; }
  // Lazy-load start.js to bring in _stBmkPopup, then open.
  if(window._loadingStartJsForBmk) return;
  window._loadingStartJsForBmk = true;
  var s = document.createElement('script');
  s.src = 'start.js?v=' + Date.now();
  s.onload = function(){
    window._loadingStartJsForBmk = false;
    if(typeof window._stBmkPopup === 'function') window._stBmkPopup();
  };
  s.onerror = function(){ window._loadingStartJsForBmk = false; };
  document.head.appendChild(s);
};

// Refresh the pill count when auth state changes.
if(typeof window !== 'undefined'){
  document.addEventListener('gold-ark-auth-ready', function(){
    if(window.GoldArkAuth && typeof window.GoldArkAuth.onStateChange === 'function'){
      window.GoldArkAuth.onStateChange(function(){ _refreshShellBookmarkPill(); });
    }
  });
}

// ---------- Zone D ----------
function syncZoneD(){
  var rules = ZONE_D_RULES[state.activeTab] || { animate:false, audio:false };
  var animBtn   = document.getElementById('zdAnimate');
  var animIcon  = document.getElementById('zdAnimateIcon');
  var animLabel = document.getElementById('zdAnimateLabel');
  var speedBtn  = document.getElementById('zdSpeed');

  // ANIMATE
  animBtn.disabled = !rules.animate;
  animBtn.classList.toggle('zd-active', state.animating && rules.animate);
  var isStart = (state.activeTab === 'START');
  if(state.animating && rules.animate){
    animIcon.textContent  = '⏸';
    animLabel.textContent = isStart ? 'PAUSE' : 'PAUSE';
  } else {
    animIcon.textContent  = '▶';
    animLabel.textContent = isStart ? 'PLAY SURAH' : 'ANIMATE';
  }

  // SPEED — enabled only when ANIMATE enabled AND active
  speedBtn.disabled = !(rules.animate && state.animating);
  speedBtn.textContent = 'SPEED ' + state.speed;
}

// ---------- Animation engine (drives year slider) ----------
var _animTickTimer = null;
var SPEED_TICK_MS = { '0.5x': 200, '1x': 100, '2x': 50, '4x': 25 };
var ANIM_STEP_YR = 5;

function _animStop(reset){
  if(_animTickTimer){ clearTimeout(_animTickTimer); _animTickTimer = null; }
  state.animating = false;
  if(reset && typeof window._clearSliderYear === 'function') window._clearSliderYear();
  syncZoneD();
}

function _animTick(){
  if(!state.animating) return;
  if(typeof window._setSliderYear !== 'function'){ _animStop(false); return; }
  var range = window._YR_RANGE || { MIN:500, MAX:2000 };
  var cur = (typeof window.activeYear === 'number' && window.activeYear !== null) ? window.activeYear : range.MIN;
  var next = cur + ANIM_STEP_YR;
  if(next >= range.MAX){
    // Pin slider at MAX, pause animation, KEEP last activePerson + slider position (no reset)
    window._setSliderYear(range.MAX);
    _animStop(false);
    return;
  }
  window._setSliderYear(next);
  var ms = SPEED_TICK_MS[state.speed] || 100;
  _animTickTimer = setTimeout(_animTick, ms);
}

function _animStart(){
  if(_animTickTimer){ clearTimeout(_animTickTimer); _animTickTimer = null; }
  var range = window._YR_RANGE || { MIN:500, MAX:2000 };
  // Begin from current year if in range; otherwise from MIN
  var cur = (typeof window.activeYear === 'number' && window.activeYear !== null) ? window.activeYear : null;
  if(cur === null || cur >= range.MAX) {
    if(typeof window._setSliderYear === 'function') window._setSliderYear(range.MIN);
  }
  state.animating = true;
  syncZoneD();
  _animTick();
}

function bindZoneD(){
  document.getElementById('zdAnimate').addEventListener('click', function(){
    var rules = ZONE_D_RULES[state.activeTab] || {};
    if(!rules.animate) return;
    var api = _activeViewApi;
    // View-specific animation delegation (e.g. SILSILA drives its own engine).
    if(api && typeof api.animateStart === 'function' && typeof api.animatePause === 'function'){
      if(state.animating){
        api.animatePause();
        state.animating = false;
        console.log('animate paused for ' + state.activeTab + ' (view-driven)');
      } else {
        api.animateStart();
        state.animating = true;
        console.log('animate started for ' + state.activeTab + ' (view-driven)');
      }
      syncZoneD();
      return;
    }
    // Fallback: shell year-driven engine (TIMELINE)
    if(state.animating){
      if(_animTickTimer){ clearTimeout(_animTickTimer); _animTickTimer = null; }
      state.animating = false;
      console.log('animate paused for ' + state.activeTab);
      syncZoneD();
    } else {
      _animStart();
      console.log('animate started for ' + state.activeTab);
    }
  });
  document.getElementById('zdSpeed').addEventListener('click', function(){
    var rules = ZONE_D_RULES[state.activeTab] || {};
    if(!(rules.animate && state.animating)) return;
    var seq = ['0.5x','1x','2x','4x'];
    var i = seq.indexOf(state.speed);
    state.speed = seq[(i+1) % seq.length];
    var api = _activeViewApi;
    if(api && typeof api.animateSetSpeed === 'function'){
      api.animateSetSpeed(state.speed);
    }
    syncZoneD();
  });
  document.getElementById('zdBack').addEventListener('click', function(){ navBack(); });
  document.getElementById('zdForward').addEventListener('click', function(){ navForward(); });
  document.getElementById('zdTip').addEventListener('click', function(){
    openModal('Tip for ' + state.activeTab, 'Placeholder tip body for ' + state.activeTab + '. Real tips will be authored per view.');
  });
}

// ---------- User pill (Sign out dropdown) ----------
function bindUserPill(){
  var btn = document.getElementById('userPill');
  var dd  = document.getElementById('userDropdown');
  if(!btn || !dd) return;
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    dd.hidden = !dd.hidden;
    var td = document.getElementById('toolsDropdown'); if(td) td.hidden = true;
  });
  document.addEventListener('click', function(e){
    if(!dd.hidden && !dd.contains(e.target) && e.target !== btn) dd.hidden = true;
  });
  dd.querySelectorAll('.menu-item').forEach(function(item){
    item.addEventListener('click', function(){
      dd.hidden = true;
      var act = item.dataset.action;
      if(act === 'signout'){
        if(window.GoldArkAuth && typeof window.GoldArkAuth.signOut === 'function'){
          window.GoldArkAuth.signOut().catch(function(e){ console.error('[shell] signOut error', e); });
        }
        showEntry();
      }
    });
  });
}

// ---------- Tools dropdown ----------
function bindTools(){
  var btn = document.getElementById('toolsBtn');
  var dd  = document.getElementById('toolsDropdown');
  if(!btn || !dd) return;
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    dd.hidden = !dd.hidden;
    // close ⋯ menu if open
    var md = document.getElementById('menuDropdown'); if(md) md.hidden = true;
  });
  document.addEventListener('click', function(e){
    if(!dd.hidden && !dd.contains(e.target) && e.target !== btn) dd.hidden = true;
  });
  // Strip the locked styling and lock emoji from items the current user can use.
  // Re-runs whenever auth state changes.
  function _refreshToolsLockState(){
    var user = window.GoldArkAuth && window.GoldArkAuth.getCurrentUser && window.GoldArkAuth.getCurrentUser();
    var signedIn = !!user;
    var isContrib = !!(user && (user.role === 'contributor' || user.role === 'admin'));
    dd.querySelectorAll('.menu-item').forEach(function(item){
      var key = item.dataset.lock;
      if(!key) return;
      var unlocked = false;
      if(key === 'correction'){ unlocked = isContrib; }
      else { unlocked = signedIn; } // share / snapshot / feedback unlock at any signed-in tier
      if(unlocked){
        item.classList.remove('locked');
        // Strip trailing lock emoji from label.
        item.textContent = item.textContent.replace(/\s*🔒\s*$/, '').trim();
      } else {
        if(!/🔒\s*$/.test(item.textContent)){
          item.textContent = item.textContent.replace(/\s*$/, '') + ' 🔒';
        }
        item.classList.add('locked');
      }
    });
  }
  _refreshToolsLockState();
  if(window.GoldArkAuth && typeof window.GoldArkAuth.onStateChange === 'function'){
    window.GoldArkAuth.onStateChange(function(){ _refreshToolsLockState(); });
  }
  dd.querySelectorAll('.menu-item').forEach(function(item){
    item.addEventListener('click', function(){
      dd.hidden = true;
      var act = item.dataset.action;
      var key = item.dataset.lock;

      // Locked items: send guests to the sign-in / sign-up modal.
      // After sign-in (free account), the action runs.
      if(item.classList.contains('locked')){
        var actionLabel = (key || 'this feature').replace(/^./, function(c){ return c.toUpperCase(); });
        if(typeof window.requireTester === 'function'){
          window.requireTester(actionLabel, function(){
            // Contributor-gated action — needs role check
            if(key === 'correction'){
              if(window.GoldArkAuth && window.GoldArkAuth.isContributor()){
                console.log('[tools] correction — open correction modal in ONE view');
              } else {
                openModal('Contributor access', 'Suggest Correction is open to contributors. Contact us via Feedback to request contributor access.');
              }
              return;
            }
            // Free-account features — placeholders until built out
            console.log('[tools] ' + key + ' — feature placeholder, build pending');
            openModal(actionLabel, actionLabel + ' — feature coming soon.');
          });
        } else {
          openModal('Sign in required', 'Please sign in to use ' + actionLabel + '.');
        }
        return;
      }

      if(act === 'tour'){
        if(window.GoldArkTour && typeof window.GoldArkTour.open === 'function'){
          window.GoldArkTour.open();
        }
      } else if(act === 'updates'){
        openModal('Updates', 'Updates feed placeholder.');
      } else if(act === 'community'){
        window.open('https://goldark.discourse.group', '_blank', 'noopener');
      } else {
        if(act === 'feedback' || key === 'feedback'){
          if(window.GoldArkFeedback && typeof window.GoldArkFeedback.open === 'function'){
            window.GoldArkFeedback.open();
          } else {
            console.warn('[tools] feedback opener not loaded');
          }
        } else if(act === 'snapshot' || key === 'snapshot'){
          if(window.GoldArkSnapshot && typeof window.GoldArkSnapshot.capture === 'function'){
            window.GoldArkSnapshot.capture();
          } else {
            console.warn('[tools] snapshot not loaded');
          }
        } else if(act === 'share' || key === 'share'){
          if(window.GoldArkShare && typeof window.GoldArkShare.open === 'function'){
            window.GoldArkShare.open();
          } else {
            console.warn('[tools] share not loaded');
          }
        } else {
          console.log('[tools] ' + (act || key));
        }
      }
    });
  });
}

// ---------- Modals ----------
function openModal(title, body){
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').textContent = body;
  document.getElementById('modalBackdrop').hidden = false;
}
function bindModal(){
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modalBackdrop').addEventListener('click', function(e){
    if(e.target.id === 'modalBackdrop') closeModal();
  });
}
function closeModal(){ document.getElementById('modalBackdrop').hidden = true; }

// ---------- Entry buttons ----------
function bindEntry(){
  document.getElementById('btnGuest').addEventListener('click', function(){
    setUserTier('visitor');
    setUserRole('user');
    setUserDisplayName(null);
    showShell();
  });
  document.getElementById('btnSignIn').addEventListener('click', function(){
    if(typeof window._gaOpenAuthModal === 'function'){
      window._gaOpenAuthModal();
    } else {
      console.warn('[shell] auth modal not ready — gate.js still loading');
    }
  });
  document.getElementById('flagHome').addEventListener('click', showEntry);
}

// ---------- Firebase auth state subscription ----------
function _entryDoorVisible(){
  var ed = document.getElementById('entryDoor');
  return !!(ed && !ed.hidden);
}
function _hideEntryDoor(){
  document.getElementById('entryDoor').hidden = true;
  document.getElementById('appShell').hidden = false;
  try { history.replaceState(null, '', location.pathname + location.search); } catch(e){ location.hash = ''; }
  state.activeTab = 'TIMELINE';
  setActiveTab('TIMELINE');
}

function _wireGoldArkAuth(){
  if(!window.GoldArkAuth || typeof window.GoldArkAuth.onStateChange !== 'function'){
    console.warn('[shell] GoldArkAuth not available');
    return;
  }
  window.GoldArkAuth.onStateChange(function(user){
    if(user){
      var tier = user.tier || 'tester';
      var role = user.role || 'user';
      setUserTier(tier);
      setUserRole(role);
      setUserDisplayName(user.displayName || user.email || '');
      if(_entryDoorVisible()) _hideEntryDoor();
    } else {
      setUserTier('visitor');
      setUserRole('user');
      setUserDisplayName(null);
    }
  });
}
function _bindAuth(){
  if(window.GoldArkAuth){
    _wireGoldArkAuth();
  } else {
    document.addEventListener('gold-ark-auth-ready', _wireGoldArkAuth, { once: true });
  }
}

// ---------- Global font scale ----------
function bindFontScale(){
  var KEY = 'gold-ark-font-scale';
  var MIN = 0.8, MAX = 2.0, STEP = 0.1;
  var cur = parseFloat(localStorage.getItem(KEY) || '1') || 1;
  cur = Math.max(MIN, Math.min(MAX, cur));

  if(!document.getElementById('shell-fs-css')){
    var st = document.createElement('style');
    st.id = 'shell-fs-css';
    st.textContent = ''
      + ':root{--content-font-scale:1}'
      + '.content-body{zoom:var(--content-font-scale)}'
      + '.fs-group{display:flex;align-items:center;gap:4px;margin-right:8px;background:rgba(14,20,32,.6);padding:3px 6px;border-radius:18px;border:1px solid rgba(123,157,196,.35)}'
      + '.fs-btn{background:transparent;color:#7B9DC4;border:1px solid #7B9DC4;border-radius:14px;padding:3px 9px;font-size:12px;font-weight:700;cursor:pointer;font-family:Lato,sans-serif;letter-spacing:.02em;line-height:1;transition:.15s}'
      + '.fs-btn:hover{background:rgba(123,157,196,0.15);border-color:#A8BCD9;color:#A8BCD9}'
      + '.fs-btn:disabled{opacity:.35;cursor:default}'
      + '.fs-lbl{color:#c9a961;font-size:11px;font-weight:700;font-family:Lato,sans-serif;min-width:34px;text-align:center}';
    document.head.appendChild(st);
  }

  function injectBtns(){
    if(document.getElementById('fsGroup')) return true;
    var anchor = document.getElementById('toolsBtn');
    var parent = anchor && anchor.parentNode;
    if(!parent) parent = document.querySelector('.row1-right');
    if(!parent) parent = document.querySelector('.zone-a-row1');
    if(!parent) parent = document.querySelector('.zone-a');
    if(!parent) return false;
    var grp = document.createElement('div');
    grp.id = 'fsGroup';
    grp.className = 'fs-group';
    grp.innerHTML = '<button class="fs-btn" id="fsMinus" title="Smaller text">A−</button>'
      + '<span class="fs-lbl" id="fsLbl">100%</span>'
      + '<button class="fs-btn" id="fsPlus" title="Larger text">A+</button>';
    if(anchor && anchor.parentNode === parent) parent.insertBefore(grp, anchor);
    else parent.insertBefore(grp, parent.firstChild);
    return true;
  }

  function bindClicks(){
    var minus = document.getElementById('fsMinus');
    var plus  = document.getElementById('fsPlus');
    if(minus && !minus._fsBound){ minus._fsBound = true; minus.addEventListener('click', function(){ cur = Math.max(MIN, +(cur - STEP).toFixed(2)); apply(); }); }
    if(plus  && !plus._fsBound){  plus._fsBound  = true; plus.addEventListener('click',  function(){ cur = Math.min(MAX, +(cur + STEP).toFixed(2)); apply(); }); }
  }

  function apply(){
    document.documentElement.style.setProperty('--content-font-scale', cur);
    var lbl = document.getElementById('fsLbl');
    if(lbl) lbl.textContent = Math.round(cur*100) + '%';
    var minus = document.getElementById('fsMinus');
    var plus  = document.getElementById('fsPlus');
    if(minus) minus.disabled = (cur <= MIN + 0.001);
    if(plus)  plus.disabled  = (cur >= MAX - 0.001);
    localStorage.setItem(KEY, String(cur));
    try{ window.dispatchEvent(new CustomEvent('content-font-scale-change', {detail:{scale:cur}})); }catch(e){}
  }

  // Try inject now and on retries (zone-a may render slightly later)
  var ok = injectBtns(); bindClicks(); apply();
  if(!ok){
    var tries = 0;
    var iv = setInterval(function(){
      tries++;
      if(injectBtns() || tries > 20){ clearInterval(iv); bindClicks(); apply(); }
    }, 200);
  }
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', function(){
  buildTabs();
  // Wire HOW TO USE button — opens the tour modal directly.
  // PRE-DEPLOY TODO: tour content needs review and improvement before launch.
  var _htuBtn = document.getElementById('howToUseBtn');
  if(_htuBtn){
    _htuBtn.addEventListener('click', function(){
      if(window.GoldArkTour && typeof window.GoldArkTour.open === 'function'){
        window.GoldArkTour.open();
      } else {
        openModal('How to use Gold Ark', 'Tour content loading…');
      }
    });
  }
  bindEntry();
  bindUserPill();
  bindTools();
  setUserTier('visitor');
  setUserRole('user');
  setUserDisplayName(null);
  _bindAuth();
  bindModal();
  bindZoneD();
  bindFontScale();
  // First-time-user welcome modal — fires once unless dismissed.
  setTimeout(function(){
    try {
      if(window.GoldArkTour && window.GoldArkTour.shouldAutoOpen()){
        window.GoldArkTour.open();
      }
    } catch(e){}
  }, 1000);
});
})();
