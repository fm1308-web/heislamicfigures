(function(){
  if(document.getElementById('st-mv-css')) return;
  var s = document.createElement('style');
  s.id = 'st-mv-css';
  s.textContent = ''
    + ':root{--st-mv-scale:1}'
    + '#st-btn-dive,#st-btn-dvlang{display:none !important}'
    + 'body.st-myview-active #tabRow1, body.st-myview-active #tabRow2{display:none !important}'
    + 'body.st-myview-active[data-tab-mode] .zone-a-row2, body.st-myview-active[data-tab-mode] .zone-a-row3{display:none !important}'
    + 'body.st-myview-active .tab-arrow{display:none !important}'
    + 'html body.st-myview-active .zone-a{height:48px !important;min-height:0 !important}'
    + 'html body.st-myview-active .zone-a-row1{height:48px !important;padding:6px 18px !important}'
    + 'html body.st-myview-active .zone-a-row2,html body.st-myview-active .zone-a-row3{display:none !important;height:0 !important;padding:0 !important;margin:0 !important}'
    + 'body.st-myview-active .zb-row1, body.st-myview-active .zb-row2{display:none !important}'
    + 'body.st-myview-active #zoneB{display:none !important}'
    + 'body.st-myview-active .app-shell{padding-top:0 !important}'
    + 'body.st-myview-active{overflow-x:hidden}'
    + 'body.st-myview-active .dv-card{display:none !important}'
    + 'body.st-myview-active .st-prev-surah, body.st-myview-active .st-next-surah, body.st-myview-active .st-surah-nav{display:none !important}'
    + 'body.st-myview-active .st-bismillah{display:none !important}'
    + 'body.st-myview-active #st-fixed-cols{padding:0 !important;border-bottom:none !important;min-height:0 !important;height:auto !important}'
    + 'body.st-myview-active #st-fixed-cols .st-col-hdr{display:block !important;grid-template-columns:none !important;text-align:center !important;padding:6px 40px !important;margin:0 !important;min-height:0 !important;height:auto !important}'
    + 'body.st-myview-active #st-fixed-cols .st-h-links,body.st-myview-active #st-fixed-cols .st-h-tr,body.st-myview-active #st-fixed-cols .st-h-mark,body.st-myview-active #st-fixed-cols .st-h-var,body.st-myview-active #st-fixed-cols .st-h-leg{display:none !important}'
    + 'body.st-myview-active #st-fixed-cols .st-h-verse{display:block !important;grid-column:auto !important;text-align:center !important;width:100% !important;margin:0 !important;padding:0 !important;font-size:0 !important;letter-spacing:0 !important;color:transparent !important;line-height:1 !important;min-height:0 !important;height:auto !important}'
    + 'body.st-myview-active #st-fixed-cols .st-h-verse > *{display:none !important}'
    + 'body.st-myview-active #st-fixed-cols .st-h-verse::before{content:"بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ" !important;display:inline-block !important;font-family:"Amiri",serif !important;font-size:calc(28px * var(--st-mv-scale)) !important;color:#c9a961 !important;letter-spacing:.02em !important;font-weight:400 !important;line-height:1.4 !important}'
    + 'body.st-myview-active #st-body .st-bism-row{display:none !important}'
    + 'body.st-myview-active #st-reader{padding:0 40px 40px 40px !important}'
    + 'body.st-myview-active #st-reader #st-verses{padding:0 !important;margin:0 !important}'
    + 'body.st-myview-active #st-body .st-verses-list{position:relative !important;padding:0 !important;margin:0 !important}'
    + 'body.st-myview-active #st-body .st-verses-list::before{content:"" !important;position:absolute !important;top:0 !important;bottom:0 !important;left:60px !important;width:1px !important;background:rgba(201,169,97,0.55) !important;pointer-events:none !important;z-index:1 !important}'
    + 'body.st-myview-active #st-body .st-verses-list::after{content:"" !important;position:absolute !important;top:0 !important;bottom:0 !important;right:80px !important;width:1px !important;background:rgba(201,169,97,0.55) !important;pointer-events:none !important;z-index:1 !important}'
    + '#st-body .st-verses-list{position:relative}'
    + 'body.st-mode-hybrid #st-body .st-verses-list::after,body.st-mode-arabic #st-body .st-verses-list::after,body.st-mode-translation #st-body .st-verses-list::after{content:"";position:absolute;top:0;bottom:0;right:96px;width:1px;background:rgba(201,169,97,0.45);pointer-events:none;z-index:1}'
    + 'body.st-myview-active #st-body .st-verse{display:grid !important;grid-template-columns:auto 1fr auto 44px 80px !important;align-items:center !important;gap:0 !important;padding:8px 0 8px 70px !important;border-bottom:1px solid rgba(45,55,72,0.3) !important;min-height:0 !important;position:relative !important}'
    + 'body.st-myview-active #st-body .st-verse:hover{background:rgba(212,175,55,0.04)}'
    + 'body.st-myview-active #st-body .st-verse .st-vlink{grid-column:1 !important;grid-row:1 !important;display:flex !important;flex-direction:row !important;align-items:center !important;flex-wrap:wrap !important;gap:8px !important;padding:0 !important;margin:0 !important;text-align:left !important;align-self:center !important}'
    + 'body.st-myview-active #st-body .st-verse .st-vcenter{grid-column:4 !important;grid-row:1 !important;align-self:center !important;padding:0 8px !important;margin:0 !important;font-size:calc(22px * var(--st-mv-scale)) !important;color:#c9a961 !important;text-align:center !important;display:flex !important;align-items:center !important;justify-content:center !important}'
    + 'body.st-myview-active #st-body .st-verse .st-vmark{grid-column:5 !important;grid-row:1 !important;display:flex !important;flex-direction:column !important;align-items:center !important;justify-content:center !important;padding:4px 8px !important;gap:4px !important}'
    + 'body.st-myview-active #st-body .st-verse .st-vcenter span{margin:0 !important;padding:2px 6px !important;align-self:center !important;vertical-align:middle !important}'
    + 'body.st-myview-active #st-body .st-verse .st-var{grid-column:3 !important;grid-row:1 !important;align-self:center !important;text-align:right !important;direction:rtl !important;padding:0 !important;margin:0 !important;display:block !important;font-size:calc(28px * var(--st-mv-scale)) !important;line-height:1.95 !important;max-width:60vw !important}'
    + 'body.st-myview-active #st-body .st-verse .st-vtr,body.st-myview-active #st-body .st-verse .st-vleg{display:none !important}'
    + 'body.st-myview-active #st-body .st-mv-slot{margin:4px 70px 12px 70px !important;padding:14px 24px !important;background:rgba(14,20,32,0.6) !important;border-left:none !important;border-radius:4px !important;width:auto !important}'
    + 'body.st-myview-active #st-body .st-mv-slot .st-mv-section-hdr{font-family:Cinzel,serif !important}'
    + 'body.st-myview-active #st-body .st-mv-slot .st-mv-tr-text,body.st-myview-active #st-body .st-mv-slot .st-mv-tf-text,body.st-myview-active #st-body .st-mv-slot .st-mv-mp,body.st-myview-active #st-body .st-mv-slot .st-mv-dict{font-size:calc(16px * var(--st-mv-scale)) !important;line-height:1.75 !important;color:#E5E7EB !important}'
    + 'body.st-myview-active #st-body .st-mv-slot .st-mv-mp{direction:rtl !important;text-align:right !important}'
    + 'body.st-myview-active #st-body .st-mv-slot .st-mv-dict{direction:ltr !important;text-align:left !important}'
    + '.st-var .qmark{display:none !important}'
    + 'body #st-body .st-vmark .qmark-gutter,body .st-verses-list .qmark-gutter,.qmark-gutter{display:block !important;color:#c9a961 !important;font-size:50px !important;line-height:1 !important;text-align:center !important;cursor:help !important;font-family:"Amiri","Scheherazade New",serif !important;direction:rtl !important;margin:0 !important;padding:2px 0 !important;font-weight:400 !important;pointer-events:auto !important;position:relative !important;z-index:5 !important}'
    + '.qmark-gutter:hover{color:#e0c578 !important;text-shadow:0 0 4px rgba(201,169,97,0.6)}'
    + '.st-vmark{padding:6px 4px 6px 12px !important;display:flex !important;flex-direction:column !important;align-items:flex-start !important;justify-content:center !important;gap:4px !important}'
    + '#st-body .st-vmark{display:flex !important;flex-direction:column !important;align-items:flex-start !important;justify-content:center !important;padding:6px 4px 6px 12px !important;gap:4px !important}'
    + 'body.st-mode-hybrid #st-body .st-vmark{display:flex !important}'
    + 'body.st-mode-arabic #st-body .st-vmark{display:flex !important}'
    + 'body.st-mode-translation #st-body .st-vmark{display:flex !important}'
    + '.stp-wiz, .stp-wiz *:not(input):not(button){font-size:16px !important;line-height:1.45 !important}'
    + '.stp-wiz button{font-size:15px !important}'
    + '.stp-wiz input[type="checkbox"], .stp-wiz input[type="radio"]{width:18px !important;height:18px !important}'
    + '.stp-num{appearance:textfield !important}'
    + '.stp-num::-webkit-inner-spin-button,.stp-num::-webkit-outer-spin-button{-webkit-appearance:none !important;appearance:none !important;margin:0 !important}';
  document.head.appendChild(s);
})();
/* ─────────────────────────────────────────────────────────────
   START view — Quran reader. Bundles five bv-app source files
   (start.js + dive.js + quranlink.js + quran-audio.js +
   morphology.js) inside a single window.StartView IIFE so the
   sandbox shell can lazy-load + mount/unmount cleanly.

   All fetch URLs already swapped to dataUrl(). The trailing
   setView wrapper IIFE from start.js was stripped.

   ── SACRED RULE ──
   .st-vcenter holds ONLY the verse number. NEVER add icons,
   chips, badges, or bookmarks to it. All chips/bookmarks/hadith
   counts go in the LINKS column (.st-vlink).
   Per PROJECT_RULES.md: "CENTER GOLD SPINE in START view is SACRED."
   ───────────────────────────────────────────────────────────── */
(function(){
'use strict';

// ═══════════════════════════════════════════════════════════
// STUBBED EXTERNALS (mirror timeline.js stub style)
// ═══════════════════════════════════════════════════════════
window.VIEW = 'start';
window.APP = window.APP || { Favorites:null, filterFavsOnly:false, _lang:'en',
  getDisplayName: function(p){ return p ? (p.famous || '') : ''; } };

// stub: setView — sandbox shell uses setActiveTab. The lifted code calls
// setView('start') / setView('monastic') for cross-view jumps; we provide a
// logging stub so those clicks degrade to no-op + console.
if(typeof window.setView !== 'function') window.setView = function(v){ console.log('[start] setView (stub):', v); };

// stub: requireTester — auth gate skipped in sandbox; bookmarks fall through.
if(typeof window.requireTester !== 'function') window.requireTester = function(action, cb){ if(typeof cb === 'function') cb(); };

// stub: GoldArkAuth — bookmarks UI gates on this. Sandbox: signed-out scaffold.
if(typeof window.GoldArkAuth === 'undefined') window.GoldArkAuth = {
  isSignedIn: function(){ return false; },
  isContributor: function(){ return false; },
  hasBookmark: function(){ return false; },
  addBookmark: function(){ return Promise.resolve(); },
  removeBookmark: function(){ return Promise.resolve(); },
  getBookmarks: function(){ return []; },
  onStateChange: function(cb){ /* no-op — never fires in sandbox */ }
};

// stub: _showViewDesc — sandbox has no header tagline target; no-op.
if(typeof window._showViewDesc !== 'function') window._showViewDesc = function(){};

// stub: cross-view chip-click targets used by the LINKS column.
if(typeof window.jumpTo !== 'function') window.jumpTo = function(name){ console.log('[start] jumpTo (stub):', name); };
if(typeof window._stXrefJumpEvent !== 'function') window._stXrefJumpEvent = function(eid){ console.log('[start] _stXrefJumpEvent (stub):', eid); };

// Shared cache key for hadith xref (per CLAUDE.md). Initialised here so the
// lifted code can populate it without a typeof guard.
if(typeof window._hadithXrefCache === 'undefined') window._hadithXrefCache = {};

// Hadith handshake: window._stPendingHadith is read by MONASTIC.onEnter().
// Initialised to null so verse-count chips can write to it.
if(typeof window._stPendingHadith === 'undefined') window._stPendingHadith = null;
if(typeof window._stPendingPinned === 'undefined') window._stPendingPinned = null;
if(typeof window._stPendingPinnedVerses === 'undefined') window._stPendingPinnedVerses = null;
if(typeof window._stPendingPinnedTafsir === 'undefined') window._stPendingPinnedTafsir = null;

// ═══════════════════════════════════════════════════════════
// ▼▼▼ VERBATIM LIFTED CODE — bundles 5 bv-app files ▼▼▼
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// START VIEW — Quran Reader
// Two-column: Arabic (30%) | Translation (70%)
// ═══════════════════════════════════════════════════════════

var _stIndex = null;
var _stText = null;
var _stInited = false;
var _stSurah = 1;
var _stJuz = 0;
var _stHizb = 0;
var _stManzil = 0;
var _stReciters = [];
var _stCurrentReciter = 'ar.alafasy';
var _stCurrentReciterName = 'Mishary Alafasy';
var _stType = '';
var _stTrans = {eng_saheeh:true};
var _stDDOpen = null;
var _stMode = 'both';   // 'both'|'arabic'|'trans'
var _stFontSize = 20;  // base px for both columns
var _stTransIndex = [];
var _stTransRegistry = {languages:{}};
var _stFileCache = {};
var _stFileLoading = {};
var _ST_EMBED_MAP = {arabic:'ar', eng_saheeh:'en', transliteration:'tr'};
var _stXref = null;
var _stXrefLookup = {};
var _stXrefSurahFigs = {};
var _stHadithByVerse = null;    // null = not loaded, {} = loaded
var _stHadithLoading = false;
var _stTafsirByVerse = null;     // null = not loaded, {} = loaded — keys "S:V"
var _stTafsirXrefLoading = false;
var _stConceptsByVerse = null;     // {"S:V": [{concept_id, count}]}
var _stConceptCanon = null;        // {"<concept_id>": {name, ...}}
var _stConceptXrefLoading = false;
var _stRevData = {};  // surah id -> revelation info

var _ST_JUZ_START = [
  null,
  [1,1],[2,142],[2,253],[3,92],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,45],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
];

function _stEsc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}

function _stJuzOf(surah,verse){
  for(var j=_ST_JUZ_START.length-1;j>=1;j--){
    var b=_ST_JUZ_START[j];
    if(surah>b[0]||(surah===b[0]&&verse>=b[1]))return j;
  }
  return 1;
}

function _stSurahJuz(sid){
  if(!_stIndex)return[];
  var si=null;
  for(var i=0;i<_stIndex.length;i++){if(_stIndex[i].id===sid){si=_stIndex[i];break;}}
  if(!si)return[];
  var s=_stJuzOf(sid,1),e=_stJuzOf(sid,si.verses),out=[];
  for(var j=s;j<=e;j++)out.push(j);
  return out;
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
function initStart(){
  document.body.classList.add('st-topalign');
  document.body.classList.add('st-active');
  var container=document.getElementById('start-view');
  if(!container)return;

  if(!_stInited){
    _stBuildDOM(container);
    _stInited=true;
    document.addEventListener('click',function(ev){
      if(!_stDDOpen)return;
      var panel=document.getElementById('st-dd-'+_stDDOpen);
      var btn=document.getElementById('st-btn-'+_stDDOpen);
      if(panel&&!panel.contains(ev.target)&&btn&&!btn.contains(ev.target))_stCloseDD();
    });
  }

  _stLoadData(function(){
    _stBuildSurahDD();
    _stBuildJuzDD();
    _stBuildHizbDD();
    _stBuildManzilBar();
    _stBuildTypeDD();
    _stBuildTransDD();
    _stRenderSurah();
    try { _stRenderConceptPin(); } catch(e){ console.warn('[start] concept pin render failed', e); }
  });
}

// ═══════════════════════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════════════════════
function _stBuildDOM(container){
  container.innerHTML=
    '<div id="st-topbar">'+
      '<div id="st-l1"><span>Read the Quran</span><span class="st-src">tanzil.net \u00B7 Saheeh International \u00B7 qurancomplex.gov.sa</span></div>'+
      '<div id="st-l2">'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-surah" onclick="_stToggleDD(\'surah\',event)"><span id="st-surah-label">Surah</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel" id="st-dd-surah" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-juz" onclick="_stToggleDD(\'juz\',event)"><span id="st-juz-label">Juz</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow" id="st-dd-juz" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-hizb" onclick="_stToggleDD(\'hizb\',event)"><span id="st-hizb-label">Hizb</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow" id="st-dd-hizb" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-manzil" onclick="_stToggleDD(\'manzil\',event)"><span id="st-manzil-label">Manzil</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow" id="st-dd-manzil" style="display:none"></div>'+
        '</div>'+
        '<div style="flex:1"></div>'+
        '<div class="st-col-toggle">'+
          // Phase 2: ع (arabic-only) and T (translation-only) hidden — hybrid only.
          // '<button class="st-col-btn" id="st-col-ar" onclick="_stSetMode(\'arabic\')" title="Arabic only">ع</button>'+
          '<button class="st-col-btn active" id="st-col-both" onclick="_stSetMode(\'both\')" title="Both columns">ع | T</button>'+
          // '<button class="st-col-btn" id="st-col-tr" onclick="_stSetMode(\'trans\')" title="Translation only">T</button>'+
        '</div>'+
        '<div class="st-font-ctl">'+
          '<button class="st-font-btn" onclick="_stFontAdj(-2)" title="Smaller">A\u2212</button>'+
          '<button class="st-font-btn" onclick="_stFontAdj(2)" title="Larger">A+</button>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-reciter" onclick="_stToggleDD(\'reciter\',event)"><span id="st-reciter-label">Reciter</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow st-dd-right" id="st-dd-reciter" style="display:none"></div>'+
        '</div>'+
        '<div class="st-surah-play-pill">'+
          '<button class="st-surah-play-btn" id="st-surah-play-btn" onclick="_stSurahPlayClick(event)" title="Play surah">\u25B6</button>'+
          '<span class="st-surah-play-label">PLAY SURAH</span>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-trans" onclick="_stToggleDD(\'trans\',event)"><span id="st-trans-label">\u2630 Translation</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow st-dd-right" id="st-dd-trans" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap" id="st-dv-lang-wrap" style="display:none">'+
          '<button class="st-dd-btn" id="st-btn-dvlang" onclick="_stToggleDD(\'dvlang\',event)"><span id="st-dvlang-label">Tafsir Language</span> <span class="st-dd-caret">▾</span></button>'+
          '<div class="st-dd-panel st-dd-narrow st-dd-right" id="st-dd-dvlang" style="display:none">'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'\')">All Languages</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'AR\')">Arabic</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'EN\')">English</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'UR\')">Urdu</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'BN\')">Bengali</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'KU\')">Kurdish</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'RU\')">Russian</div>'+
          '</div>'+
        '</div>'+
        '<button class="st-dd-btn st-dv-toggle" id="st-btn-dive" onclick="_dvSetMode(!window._stDive)" title="Toggle scholastic Quran mode">DIVE: OFF</button>'+
      '</div>'+
    '</div>'+
    '<div id="st-body">'+
      '<div id="st-fixed-hdr"></div>'+
      '<div id="st-fixed-cols"></div>'+
      '<div id="st-reader" class="content-body">'+
        '<div id="st-loading">Loading Quran data\u2026</div>'+
      '</div>'+
    '</div>';
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════
function _stLoadData(cb){
  if(_stIndex&&_stText){cb();return;}
  var base='data/islamic/quran/';

  // Load 11 division files in parallel (non-blocking — populates window._stDivisions).
  // Individual failures log + set that key to null; other keys still land.
  (function(){
    var dBase=base+'divisions/';
    var divFiles=[
      ['juz','juz.json'],
      ['hizb','hizb.json'],
      ['manzil','manzil.json'],
      ['length','length_categories.json'],
      ['chronology','chronology_traditional.json'],
      ['noldeke','noldeke_phases.json'],
      ['sajdah','sajdah.json'],
      ['muqattaat','muqattaat.json'],
      ['families','surah_families.json'],
      ['rub','rub_al_hizb.json'],
      ['ruku','ruku_placeholder.json'],
      ['sajdah_pos','sajdah_positions.json'],
      ['rub_pos','rub_al_hizb_positions.json'],
      ['waqf','waqf_marks.json']
    ];
    Promise.all(divFiles.map(function(p){
      var key=p[0],file=p[1];
      return fetch(dataUrl(dBase+file)).then(function(r){
        if(!r.ok)throw new Error('HTTP '+r.status);
        return r.json();
      }).catch(function(e){
        console.error('[divisions] failed to load:',file,e);
        return null;
      });
    })).then(function(results){
      var div={};
      divFiles.forEach(function(p,i){div[p[0]]=results[i];});
      window._stDivisions=div;
      (function(){
        var lookup={};
        var wq=div.waqf&&div.waqf.mark_types;
        if(wq){
          Object.keys(wq).forEach(function(k){
            var m=wq[k];
            if(!m||!m.unicode)return;
            var hex=String(m.unicode).replace(/^U\+/,'');
            var cp=parseInt(hex,16);
            if(isNaN(cp))return;
            var ch=String.fromCodePoint(cp);
            lookup[ch]={arabic_sign:m.sign||'',hover_def:m.hover_def||m.label||''};
          });
        }
        lookup['\u06E9']={arabic_sign:'\u06E9',hover_def:'Prostration verse'};
        lookup['\u06DE']={arabic_sign:'\u06DE',hover_def:'Quarter-hizb section marker'};
        // Complete fallback for waqf stop marks
        var _waqfFallback = {
          '\u06D6': {arabic_sign:'\u06D6', hover_def:'Waqf laazim \u2014 preferred stop'},
          '\u06D7': {arabic_sign:'\u06D7', hover_def:'Waqf with three dots \u2014 alternative stop'},
          '\u06D8': {arabic_sign:'\u06D8', hover_def:'Madda \u2014 elongation'},
          '\u06D9': {arabic_sign:'\u06D9', hover_def:'Lam-Alef ligature'},
          '\u06DA': {arabic_sign:'\u06DA', hover_def:'Waqf jaa\'iz \u2014 permissible stop'},
          '\u06DB': {arabic_sign:'\u06DB', hover_def:'Three dots \u2014 empty stop'},
          '\u06DC': {arabic_sign:'\u06DC', hover_def:'Sila \u2014 small high seen'},
          '\u06ED': {arabic_sign:'\u06ED', hover_def:'Small low meem \u2014 silent meem'}
        };
        Object.keys(_waqfFallback).forEach(function(k){
          if(!lookup[k]) lookup[k] = _waqfFallback[k];
        });
        window._stWaqfLookup=lookup;
      })();
      var j=div.juz,h=div.hizb,m=div.manzil,lg=div.length,ch=div.chronology,nl=div.noldeke,sa=div.sajdah,mu=div.muqattaat,fa=div.families,ru=div.rub,rk=div.ruku;
      console.log('[divisions] loaded:',{
        juz:        j  && j.juz         ? j.juz.length        : 0,
        hizb:       h  && h.hizb        ? h.hizb.length       : 0,
        manzil:     m  && m.manzil      ? m.manzil.length     : 0,
        length:     lg && lg.categories ? lg.categories.length: 0,
        chronology: ch && ch.order      ? ch.order.length     : 0,
        noldeke:    nl && nl.phases     ? nl.phases.length    : 0,
        sajdah:     sa && sa.verses     ? sa.verses.length    : 0,
        muqattaat:  mu && mu.groups     ? mu.groups.length    : 0,
        families:   fa && fa.families   ? fa.families.length  : 0,
        rub:        ru && typeof ru.total==='number' ? ru.total : 0,
        ruku:       rk && typeof rk.total==='number' ? rk.total : 0
      });
    });
  })();

  Promise.all([
    fetch(dataUrl(base+'quran_index.json')).then(function(r){return r.json();}),
    fetch(dataUrl(base+'quran_text.json')).then(function(r){return r.json();}),
    fetch(dataUrl('data/islamic/quran/translations/registry.json')).then(function(r){return r.json();}).catch(function(){return{translations:[],languages:{}};}),
    fetch(dataUrl(base+'quran_xref.json')).then(function(r){return r.json();}).catch(function(){return{};}),
    fetch(dataUrl(base+'quran_revelation.json')).then(function(r){return r.json();}).catch(function(){return{surahs:[]};}),
    fetch(dataUrl(base+'reciters.json')).then(function(r){return r.json();}).catch(function(){return[];})
  ]).then(function(res){
    _stIndex=res[0];
    _stText=res[1];
    var _ti=res[2]||{};
    var _tList=_ti.translations||[];
    // Adapter: shape new-registry entries into the legacy _stTransIndex shape
    // the picker + loader were written against.
    _stTransIndex=_tList.map(function(t){
      return {
        slug: t.id,                                  // unique id, e.g. "eng-ajarberry"
        english_name: t.language||'',                // group label
        native_name: t.translator||t.id,             // shown in picker as primary line
        translator: t.translator||'',                // shown in picker as second line
        direction: 'ltr',                            // updated when surah loads
        lang_code: t.lang_code||'',                  // for per-surah path
        sub_slug: t.slug||'',                        // for per-surah path
        script: t.script||'original',                // 'original' or 'romanised' — drives ROM badge
        file: 'translations/'+(t.lang_code||'')+'/'+(t.slug||'')+'/surah-001.json' // placeholder
      };
    });
    // Restore multi-select from localStorage; default to current _stTrans if nothing saved.
    try {
      var _stMultiRaw = localStorage.getItem('gold-ark-st-trans-multi');
      if(_stMultiRaw){
        var _stMultiArr = JSON.parse(_stMultiRaw);
        if(Array.isArray(_stMultiArr) && _stMultiArr.length){
          _stTrans = {};
          _stMultiArr.forEach(function(s){ _stTrans[s] = true; });
        }
      }
    } catch(e){}
    window._stRegistry=_ti;
    console.log('[START] translation registry:',_stTransIndex.length,'editions across',Object.keys(_ti.languages||{}).length,'languages');
    // Preload selected translations for the boot surah
    setTimeout(function(){_stPreloadActiveTrans();},0);
    _stXref=res[3]||{};
    var _rv=res[4]||{};(_rv.surahs||[]).forEach(function(s){_stRevData[s.id]=s;});
    _stBuildXrefLookup();
    _stReciters=Array.isArray(res[5])?res[5]:[];
    if(_stReciters.length){
      var _defR=_stReciters.find(function(r){return r.id==='ar.alafasy';})||_stReciters[0];
      _stCurrentReciter=_defR.id;
      _stCurrentReciterName=_defR.name||_defR.id;
    }
    // Build ayah counts (length 114, index i -> surah i+1) and init audio.
    if(window.QuranAudio&&_stIndex){
      var _ac=new Array(114);
      _stIndex.forEach(function(s){_ac[s.id-1]=s.verses;});
      try{
        window.QuranAudio.init({ayahCountsBySurah:_ac, defaultReciter:_stCurrentReciter});
        window.QuranAudio.onChange(_stOnAudioChange);
        window.QuranAudio.onError(_stOnAudioError);
      }catch(e){console.error('[START] QuranAudio.init failed',e);}
    }
    _stBuildReciterDD();
    _stUpdateReciterLabel();
    cb();
    setTimeout(function(){ _stLoadHadithXrefIntoVerse(); }, 1500);
      setTimeout(function(){ _stLoadTafsirXrefForVerses(); }, 1700);
      setTimeout(function(){ _stLoadConceptXref(); }, 1900);
  }).catch(function(e){
    console.error('[START] Load failed:',e);
    var el=document.getElementById('st-loading');
    if(el)el.textContent='Failed to load Quran data.';
  });
}

// ═══════════════════════════════════════════════════════════
// DROPDOWN BUILDERS
// ═══════════════════════════════════════════════════════════
function _stBuildSurahDD(){
  var panel=document.getElementById('st-dd-surah');
  if(!panel)return;
  panel.innerHTML='';

  var search=document.createElement('input');
  search.className='st-dd-search';search.type='text';search.placeholder='Search surahs\u2026';
  search.onclick=function(ev){ev.stopPropagation();};
  search.oninput=function(){
    var q=search.value.toLowerCase();
    panel.querySelectorAll('.st-dd-item').forEach(function(r){
      r.style.display=(!q||(r.dataset.stxt||'').toLowerCase().indexOf(q)!==-1)?'':'none';
    });
  };
  panel.appendChild(search);

  var filtered=_stFilteredSurahs();
  filtered.forEach(function(s){
    var row=document.createElement('div');
    row.className='st-dd-item'+(s.id===_stSurah?' selected':'');
    row.dataset.id=s.id;
    row.dataset.stxt=s.id+' '+s.name_ar+' '+s.name_en+' '+s.meaning;
    var _srvd=_stRevData[s.id]||{};var _sdot=(_srvd.disputed)?'st-dot-disp':(_srvd.type==='meccan'||(!_srvd.type&&s.type==='meccan'))?'st-dot-mec':'st-dot-med';
    row.innerHTML='<span class="st-dd-sdot '+_sdot+'"></span><span class="st-dd-snum">'+s.id+'</span>'+
      '<span class="st-dd-sar">'+_stEsc(s.name_ar)+'</span>'+
      '<span class="st-dd-sen">'+_stEsc(s.name_en)+'</span>'+
      '<span class="st-dd-smn">'+_stEsc(s.meaning)+'</span>';
    (function(sid){
      row.onclick=function(ev){ev.stopPropagation();_stSelectSurah(sid);_stCloseDD();};
    })(s.id);
    panel.appendChild(row);
  });
  _stUpdateSurahLabel();
}

function _stBuildJuzDD(){
  var panel=document.getElementById('st-dd-juz');if(!panel)return;
  panel.innerHTML='';
  var all=document.createElement('div');
  all.className='st-dd-item'+(_stJuz===0?' selected':'');
  all.textContent='All Juz';
  all.onclick=function(ev){ev.stopPropagation();_stSelectJuz(0);_stCloseDD();};
  panel.appendChild(all);
  for(var j=1;j<=30;j++){
    var row=document.createElement('div');
    row.className='st-dd-item'+(j===_stJuz?' selected':'');
    row.textContent='Juz '+j;
    (function(jj){row.onclick=function(ev){ev.stopPropagation();_stSelectJuz(jj);_stCloseDD();};})(j);
    panel.appendChild(row);
  }
}

function _stBuildTypeDD(){
  var panel=document.getElementById('st-dd-type');if(!panel)return;
  panel.innerHTML='';
  [{val:'',label:'All'},{val:'meccan',label:'Makkan'},{val:'medinan',label:'Madinan'},{val:'disputed',label:'Disputed'}].forEach(function(o){
    var row=document.createElement('div');
    row.className='st-dd-item'+(o.val===_stType?' selected':'');
    row.textContent=o.label;
    row.onclick=function(ev){ev.stopPropagation();_stSelectType(o.val);_stCloseDD();};
    panel.appendChild(row);
  });
}

function _stBuildTransDD(){
  var panel=document.getElementById('st-dd-trans');if(!panel)return;
  // Phase 3: render the shared rich picker (same UI as MY VIEW Step 2).
  panel.innerHTML='';
  panel.style.padding = '14px';
  panel.style.background = '#0e1420';
  panel.style.fontFamily = 'Lato,sans-serif';
  panel.style.fontSize = '13px';
  panel.style.color = '#E5E7EB';
  if(typeof _stRenderRichTrans === 'function'){
    _stRenderRichTrans(panel, {
      getSel: function(){ return Object.keys(_stTrans).filter(function(k){ return _stTrans[k]; }); },
      onChange: function(slugs){
        Object.keys(_stTrans).forEach(function(k){ delete _stTrans[k]; });
        slugs.forEach(function(s){
          _stTrans[s] = true;
          if(typeof _ST_EMBED_MAP !== 'undefined' && !_ST_EMBED_MAP[s]
              && typeof _stLoadFileTrans === 'function' && typeof _stSurah !== 'undefined'){
            try{ _stLoadFileTrans(s, _stSurah); }catch(e){}
          }
        });
        if(typeof _stPersistTransMulti === 'function') _stPersistTransMulti();
        if(typeof _stRenderSurah === 'function') _stRenderSurah();
        if(typeof _stUpdateTransLabel === 'function') _stUpdateTransLabel();
      }
    });
    if(typeof _stUpdateTransLabel === 'function') _stUpdateTransLabel();
    return;
  }
  // Legacy fallback (unused once _stRenderRichTrans loads):
  panel.innerHTML='';

  // Counts header \u2014 Selected: N / total + Select All / Clear All
  var totalAvail = _stTransIndex.filter(function(t){ return t.slug!=='arabic'; }).length;
  var pickedCount = Object.keys(_stTrans).filter(function(k){ return _stTrans[k]; }).length;
  var hdr=document.createElement('div');
  hdr.style.cssText='display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:rgba(212,175,55,0.10);border-bottom:1px solid rgba(212,175,55,0.25);gap:8px;font-family:Lato,sans-serif';
  hdr.onclick=function(ev){ev.stopPropagation();};
  hdr.innerHTML=
    '<div style="color:#c9a961;font-size:12px;font-weight:700">Selected: '+pickedCount+' <span style="color:#9aa3b2;font-weight:400">/ '+totalAvail+'</span></div>'+
    '<div style="display:flex;gap:6px">'+
      '<button id="st-dd-trans-selall" type="button" style="background:rgba(212,175,55,0.18);color:#c9a961;border:1px solid rgba(212,175,55,0.6);border-radius:14px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:Lato,sans-serif;font-weight:600">Select All</button>'+
      '<button id="st-dd-trans-clear" type="button" style="background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:14px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:Lato,sans-serif">\u2715 Clear All</button>'+
    '</div>';
  panel.appendChild(hdr);
  hdr.querySelector('#st-dd-trans-selall').onclick=function(ev){ev.stopPropagation();_stTransSelectAll();};
  hdr.querySelector('#st-dd-trans-clear').onclick=function(ev){ev.stopPropagation();_stTransClearAll();};

  // Search
  var search=document.createElement('input');
  search.className='st-dd-search';search.type='text';search.placeholder='Search languages\u2026';
  search.onclick=function(ev){ev.stopPropagation();};
  search.oninput=function(){
    var q=search.value.toLowerCase();
    panel.querySelectorAll('.st-dd-item, .st-dd-langhdr').forEach(function(r){
      var t=(r.dataset.stxt||'').toLowerCase();
      r.style.display=(!q||t.indexOf(q)!==-1)?'':'none';
    });
  };
  panel.appendChild(search);

  // Group all translations by language
  var _byLang={};
  _stTransIndex.forEach(function(t){
    if(t.slug==='arabic')return;
    var lang=t.english_name||'Other';
    if(!_byLang[lang])_byLang[lang]=[];
    _byLang[lang].push(t);
  });
  var _langs=Object.keys(_byLang).sort(function(a,b){
    // Most-populated languages float up
    return _byLang[b].length-_byLang[a].length;
  });
  _langs.forEach(function(lang){
    var items=_byLang[lang];
    var hasSelected=items.some(function(t){return _stTrans[t.slug];});
    var grpId='st-dd-grp-'+lang.replace(/[^a-z0-9]/gi,'_');

    var hdr=document.createElement('div');
    hdr.className='st-dd-langhdr'+(hasSelected?' selected':'');
    hdr.dataset.stxt=lang;
    hdr.innerHTML=
      '<span class="st-dd-langcaret">\u25B8</span>'+
      '<span class="st-dd-langname">'+_stEsc(lang)+'</span>'+
      '<span class="st-dd-langcount">'+items.length+'</span>';
    panel.appendChild(hdr);

    var grp=document.createElement('div');
    grp.className='st-dd-langgrp';
    grp.id=grpId;
    grp.style.display=hasSelected?'block':'none';

    items.forEach(function(t){
      var row=document.createElement('div');
      row.className='st-dd-item st-dd-tsubitem'+(_stTrans[t.slug]?' selected':'');
      row.dataset.key=t.slug;
      row.dataset.stxt=t.native_name+' '+t.english_name+' '+t.translator;
      row.title=t.translator;
      var loading=_stFileLoading[t.slug]?' \u23F3':'';
      var romBadge = (t.script === 'romanised')
        ? ' <span class="st-dd-rom" style="background:rgba(154,163,178,0.18);color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:8px;padding:1px 6px;font-size:10px;font-weight:600;margin-left:6px;letter-spacing:.05em">ROM</span>'
        : '';
      row.innerHTML=
        '<span class="st-dd-ck">'+(_stTrans[t.slug]?'\u2713':'')+'</span>'+
        '<span class="st-dd-tlabel">'+_stEsc(t.translator||t.native_name)+romBadge+loading+'</span>';
      (function(slug){
        row.onclick=function(ev){ev.stopPropagation();_stToggleTrans(slug);};
      })(t.slug);
      grp.appendChild(row);
    });
    panel.appendChild(grp);

    (function(headerEl,groupEl){
      headerEl.onclick=function(ev){
        ev.stopPropagation();
        var open=groupEl.style.display!=='none';
        groupEl.style.display=open?'none':'block';
        headerEl.querySelector('.st-dd-langcaret').textContent=open?'\u25B8':'\u25BE';
      };
    })(hdr,grp);
    if(hasSelected) hdr.querySelector('.st-dd-langcaret').textContent='\u25BE';
  });

  // Source credit (Tanzil Project)
  var credit=document.createElement('div');
  credit.style.cssText='padding:8px 12px;font-size:10.5px;color:#7a7a7a;border-top:1px solid rgba(212,175,55,0.18);font-style:italic';
  credit.textContent='Source: tanzil.net (Tanzil Project)';
  panel.appendChild(credit);

  _stUpdateTransLabel();
}

// ═══════════════════════════════════════════════════════════
// DROPDOWN TOGGLE
// ═══════════════════════════════════════════════════════════
function _stToggleDD(which,ev){
  if(ev)ev.stopPropagation();
  if(_stDDOpen===which){_stCloseDD();return;}
  _stCloseDD();
  _stDDOpen=which;
  var panel=document.getElementById('st-dd-'+which);
  if(panel)panel.style.display='block';
  var btn=document.getElementById('st-btn-'+which);
  if(btn)btn.classList.add('active');
  if(which==='surah'){
    var si=panel?panel.querySelector('.st-dd-search'):null;
    if(si){si.value='';si.dispatchEvent(new Event('input'));si.focus();}
  }
}

function _stCloseDD(){
  if(!_stDDOpen)return;
  var panel=document.getElementById('st-dd-'+_stDDOpen);
  if(panel)panel.style.display='none';
  var btn=document.getElementById('st-btn-'+_stDDOpen);
  if(btn)btn.classList.remove('active');
  _stDDOpen=null;
}

// ═══════════════════════════════════════════════════════════
// FILTER ACTIONS
// ═══════════════════════════════════════════════════════════
function _stFilteredSurahs(){
  if(!_stIndex)return[];
  return _stIndex.filter(function(s){
    if(_stType==='disputed'){if(!_stRevData[s.id]||!_stRevData[s.id].disputed)return false;}
    else if(_stType&&s.type!==_stType)return false;
    if(_stJuz>0){if(_stSurahJuz(s.id).indexOf(_stJuz)===-1)return false;}
    return true;
  });
}

function _stSelectSurah(id){
  if(window._stPendingJump && typeof window._stPendingJump.surah === 'number' && window._stPendingJump.surah > 0 && window._stPendingJump.surah !== id){
    id = window._stPendingJump.surah;
  }
  _stSurah=id;
  _stPreloadActiveTrans();
  _stRenderSurah();
  _stBuildSurahDD();
  var reader=document.getElementById('st-reader');
  if(reader)reader.scrollTop=0;
  // Stop any ongoing surah playback — new surah means fresh reading state.
  if(window._stSurahPlayMode){
    window._stSurahPlayMode=false;
    if(window.QuranAudio)window.QuranAudio.stop();
    _stUpdateSurahPlayBtn();
  }
  // Division-driven surah changes (from Hizb/Manzil) set this guard so we don't
  // immediately zero out the just-set division state.
  if(window._stSuppressDivReset) return;
  if(_stJuz!==0){_stJuz=0;_stBuildJuzDD();_stUpdateJuzLabel();}
  if(_stHizb!==0){_stHizb=0;_stBuildHizbDD();_stUpdateHizbLabel();}
  if(_stManzil!==0){_stManzil=0;_stBuildManzilBar();}
  // Save reading progress on surah change.
  if(typeof _stSaveProgress === 'function') _stSaveProgress(id, 1);
}
window._stSelectSurah=_stSelectSurah;

function _stRenderConceptPin(){
  var pin = window._stPendingPinnedVerses;
  var existing = document.getElementById('st-concept-pin');
  if(existing) existing.remove();
  if(!pin || !pin.verses || !pin.verses.length) return;

  // Defensive normalize — accept {surah,verse}, {s,v}, [s,v], [s,v,score], etc.
  var clean = [];
  for(var i=0; i<pin.verses.length; i++){
    var v = pin.verses[i];
    if(!v) continue;
    var sn = v.surah; if(sn==null) sn = v.s; if(sn==null && Array.isArray(v)) sn = v[0];
    var vn = v.verse; if(vn==null) vn = v.v; if(vn==null && Array.isArray(v)) vn = v[1];
    if(sn==null || vn==null) continue;
    sn = parseInt(sn, 10); vn = parseInt(vn, 10);
    if(isNaN(sn) || isNaN(vn) || sn < 1 || sn > 114 || vn < 1) continue;
    var sc = v.score; if(sc==null) sc = v.weight; if(sc==null && Array.isArray(v)) sc = v[2];
    clean.push({ surah: sn, verse: vn, score: (sc==null ? null : sc) });
  }
  if(!clean.length){ console.warn('[start] concept pin: no valid verses', pin); return; }

  var reader = document.getElementById('st-reader');
  if(!reader || !reader.parentNode) return;
  var box = document.createElement('div');
  box.id = 'st-concept-pin';
  box.style.cssText = 'position:sticky;top:0;z-index:50;padding:10px 16px 12px;background:rgba(14,22,33,0.97);border-bottom:1px solid rgba(212,175,55,0.4);box-shadow:0 4px 12px rgba(0,0,0,0.3)';
  var header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px"><div><span style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#D4AF37">Concept: '+(pin.label||pin.slug||'')+'</span><span style="font-family:\'Source Sans 3\',sans-serif;font-size:12px;color:#A0AEC0;margin-left:10px">'+clean.length+' verses · click any to jump</span></div><button id="st-concept-pin-close" style="background:transparent;border:1px solid rgba(212,175,55,0.5);color:#D4AF37;padding:2px 9px;border-radius:3px;cursor:pointer;font-size:13px">×</button></div>';
  var chipsHtml = '<div style="display:flex;flex-wrap:wrap;gap:6px;max-height:90px;overflow-y:auto">';
  clean.forEach(function(v){
    var sc = (v.score!=null) ? '<span style="font-size:10px;color:rgba(212,175,55,0.85);margin-left:4px">'+v.score+'</span>' : '';
    chipsHtml += '<span class="st-cpin-chip" data-surah="'+v.surah+'" data-verse="'+v.verse+'" style="display:inline-flex;align-items:center;padding:3px 9px;font-size:13px;font-family:\'Cinzel\',serif;letter-spacing:.05em;color:#8fd4b5;background:rgba(150,200,180,0.10);border:1px solid rgba(150,200,180,0.35);border-radius:3px;cursor:pointer">'+v.surah+':'+v.verse+sc+'</span>';
  });
  chipsHtml += '</div>';
  box.innerHTML = header + chipsHtml;
  reader.parentNode.insertBefore(box, reader);

  box.querySelector('#st-concept-pin-close').addEventListener('click', function(){
    window._stPendingPinnedVerses = null;
    box.remove();
  });

  function _jumpInline(s, vv){
    try { if(typeof _stSelectSurah === 'function') _stSelectSurah(s); } catch(e){}
    requestAnimationFrame(function(){
      requestAnimationFrame(function(){
        var r = document.getElementById('st-reader');
        if(!r) return;
        var row = r.querySelector('.st-verse[data-verse-id="' + vv + '"]');
        if(row){
          row.scrollIntoView({behavior:'smooth', block:'center'});
          row.classList.add('quran-verse-flash');
          setTimeout(function(){ row.classList.remove('quran-verse-flash'); }, 1800);
        }
      });
    });
  }
  box.querySelectorAll('.st-cpin-chip').forEach(function(chip){
    chip.addEventListener('click', function(){
      _jumpInline(+chip.dataset.surah, +chip.dataset.verse);
    });
  });
  var first = clean[0];
  if(first){
    setTimeout(function(){ _jumpInline(first.surah, first.verse); }, 50);
  }
}
window._stRenderConceptPin = _stRenderConceptPin;

function _stSelectJuz(j){
  _stJuz=j;
  var f=_stFilteredSurahs();
  if(f.length&&!f.find(function(s){return s.id===_stSurah;}))_stSurah=f[0].id;
  // Picking a Juz clears Hizb + Manzil.
  if(_stHizb!==0){_stHizb=0;_stUpdateHizbLabel();}
  if(_stManzil!==0){_stManzil=0;}
  _stBuildSurahDD();_stBuildJuzDD();_stBuildHizbDD();_stBuildManzilBar();_stRenderSurah();_stUpdateJuzLabel();
}

function _stSelectType(t){
  _stType=t;
  var f=_stFilteredSurahs();
  if(f.length&&!f.find(function(s){return s.id===_stSurah;}))_stSurah=f[0].id;
  _stBuildSurahDD();_stBuildTypeDD();_stRenderSurah();_stUpdateTypeLabel();
}

function _stRegistryToIndex(reg){
  var out=[];
  if(!reg||!reg.languages)return out;
  var rtlCodes={ar:1,fa:1,ur:1,ps:1,ckb:1,sd:1,ug:1,he:1};
  Object.keys(reg.languages).forEach(function(code){
    var lang=reg.languages[code]||{};
    var langName=lang.name||code;
    (lang.translations||[]).forEach(function(tr){
      out.push({
        slug:tr.translation_id,
        lang_code:code,
        lang_name:langName,
        native_name:tr.translator,
        english_name:tr.translator,
        translator:tr.translator,
        direction:rtlCodes[code]?'rtl':'ltr'
      });
    });
  });
  out.sort(function(a,b){
    var la=(a.lang_name||'').toLowerCase(),lb=(b.lang_name||'').toLowerCase();
    if(la<lb)return -1;if(la>lb)return 1;
    var ta=(a.translator||'').toLowerCase(),tb=(b.translator||'').toLowerCase();
    return ta<tb?-1:(ta>tb?1:0);
  });
  return out;
}

// Track per-surah loading state: _stFileLoading[slug+'@'+surahId] = true
function _stLoadFileTrans(slug){
  // Convenience entrypoint — load current surah
  _stEnsureSurahLoaded(slug,_stSurah);
}

function _stEnsureSurahLoaded(slug,surahId){
  var entry=null;
  for(var i=0;i<_stTransIndex.length;i++){
    if(_stTransIndex[i].slug===slug){entry=_stTransIndex[i];break;}
  }
  if(!entry||!entry.lang_code||!entry.sub_slug){
    console.warn('[START] No path data for',slug);
    delete _stTrans[slug];
    _stBuildTransDD();return;
  }
  // Already cached for this surah?
  if(_stFileCache[slug]&&_stFileCache[slug][surahId])return;
  var loadKey=slug+'@'+surahId;
  if(_stFileLoading[loadKey])return;

  _stFileLoading[loadKey]=true;
  _stFileLoading[slug]=true; // back-compat for picker spinner
  _stBuildTransDD();

  var pad=('00'+surahId).slice(-3);
  var path='data/islamic/quran/translations/'+entry.lang_code+'/'+entry.sub_slug+'/surah-'+pad+'.json';

  fetch(dataUrl(path)).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(data){
    if(!_stFileCache[slug])_stFileCache[slug]={};
    var bucket={};
    (data.ayahs||[]).forEach(function(a){
      bucket[a.ayah]=a.text||'';
    });
    _stFileCache[slug][surahId]=bucket;
    // Cache direction on the registry entry for _stTransDir
    if(data.direction)entry.direction=data.direction;
    delete _stFileLoading[loadKey];
    // Clear back-compat key only if no other surahs are loading for this slug
    var anyLoading=Object.keys(_stFileLoading).some(function(k){
      return k!==slug && k.indexOf(slug+'@')===0;
    });
    if(!anyLoading)delete _stFileLoading[slug];
    _stBuildTransDD();
    if(_stTrans[slug])_stRenderSurah();
  }).catch(function(e){
    console.error('[START] Failed to load',slug,'surah',surahId,e);
    delete _stFileLoading[loadKey];
    delete _stFileLoading[slug];
    // Don't auto-disable on per-surah failure — user might just have hit a missing surah
    _stBuildTransDD();
  });
}

// Called whenever the active surah changes — preload all selected translations
function _stPreloadActiveTrans(){
  Object.keys(_stTrans||{}).forEach(function(slug){
    if(_ST_EMBED_MAP[slug])return; // arabic/transliteration are embedded, skip
    _stEnsureSurahLoaded(slug,_stSurah);
  });
}

function _stPersistTransMulti(){
  try {
    var arr = Object.keys(_stTrans).filter(function(k){ return _stTrans[k]; });
    localStorage.setItem('gold-ark-st-trans-multi', JSON.stringify(arr));
  } catch(e){}
}

function _stToggleTrans(slug){
  _stTrans[slug]=!_stTrans[slug];
  if(_stTrans[slug] && !_ST_EMBED_MAP[slug]){
    _stLoadFileTrans(slug, _stSurah);
  }
  _stPersistTransMulti();
  _stBuildTransDD();_stRenderSurah();_stUpdateTransLabel();
}

function _stTransClearAll(){
  Object.keys(_stTrans).forEach(function(k){ delete _stTrans[k]; });
  _stPersistTransMulti();
  _stBuildTransDD();_stRenderSurah();_stUpdateTransLabel();
}

function _stTransSelectAll(){
  _stTransIndex.forEach(function(t){
    if(t.slug==='arabic') return;
    if(!_stTrans[t.slug]){
      _stTrans[t.slug] = true;
      if(!_ST_EMBED_MAP[t.slug]) _stLoadFileTrans(t.slug, _stSurah);
    }
  });
  _stPersistTransMulti();
  _stBuildTransDD();_stRenderSurah();_stUpdateTransLabel();
}




function _stGetVerseText(slug,surahId,verseId,verseObj){
  var field=_ST_EMBED_MAP[slug];
  if(field)return verseObj[field]||'';
  if(_stFileCache[slug]&&_stFileCache[slug][surahId])return _stFileCache[slug][surahId][verseId]||'';
  return (_stFileLoading[slug+'@'+surahId]||_stFileLoading[slug])?'\u23F3 Loading\u2026':'';
}

function _stTransLabel(slug){
  for(var i=0;i<_stTransIndex.length;i++){
    if(_stTransIndex[i].slug===slug)return _stTransIndex[i].native_name;
  }
  return slug;
}

function _stTransDir(slug){
  for(var i=0;i<_stTransIndex.length;i++){
    if(_stTransIndex[i].slug===slug)return _stTransIndex[i].direction||'ltr';
  }
  return'ltr';
}

// ═══════════════════════════════════════════════════════════
// LABEL UPDATES
// ═══════════════════════════════════════════════════════════
function _stUpdateSurahLabel(){
  var el=document.getElementById('st-surah-label');if(!el)return;
  var s=null;
  if(_stIndex)for(var i=0;i<_stIndex.length;i++){if(_stIndex[i].id===_stSurah){s=_stIndex[i];break;}}
  el.textContent=s?(s.id+'. '+s.name_en):'Surah';
}

function _stUpdateJuzLabel(){
  var el=document.getElementById('st-juz-label');if(!el)return;
  el.textContent=_stJuz>0?'Juz '+_stJuz:'Juz';
  var btn=document.getElementById('st-btn-juz');
  if(btn)btn.classList.toggle('filtered',_stJuz>0);
}

function _stUpdateTypeLabel(){
  var el=document.getElementById('st-type-label');if(!el)return;
  el.textContent=_stType?(_stType==='meccan'?'Makkan':(_stType==='medinan'?'Madinan':'Disputed')):'Revelation';
  var btn=document.getElementById('st-btn-type');
  if(btn)btn.classList.toggle('filtered',!!_stType);
}

function _stUpdateTransLabel(){
  var el=document.getElementById('st-trans-label');
  var active=Object.keys(_stTrans).filter(function(k){return _stTrans[k];});
  if(el){
    el.textContent = '\u2630 ' + (active.length ? ('Translation \u00b7 ' + active.length) : 'Translation');
  }
  // Refresh zone-B filter pill label too
  if(typeof window._stShellRefreshLabels === 'function'){
    try{ window._stShellRefreshLabels(); }catch(e){}
  }
}

// ═══════════════════════════════════════════════════════════
// RENDER SURAH
// ═══════════════════════════════════════════════════════════
function _stRenderSurah(){
  try { _stLoadWbw(_stSurah); _stInitWbwTooltip(); _stLoadGrammarLabels(); } catch(e){}
  var reader=document.getElementById('st-reader');
  if(!reader||!_stIndex||!_stText)return;
  try {
    Object.keys(_stTrans).forEach(function(k){
      if(_stTrans[k] && !_ST_EMBED_MAP[k]){
        if(!_stFileCache[k] || !_stFileCache[k][_stSurah]){
          _stLoadFileTrans(k, _stSurah);
        }
      }
    });
  } catch(e) {}
  try { if(typeof window._stShellRefreshLabels === 'function') window._stShellRefreshLabels(); } catch(e){}

  var meta=null,data=null;
  for(var i=0;i<_stIndex.length;i++){if(_stIndex[i].id===_stSurah){meta=_stIndex[i];break;}}
  for(var j=0;j<_stText.length;j++){if(_stText[j].id===_stSurah){data=_stText[j];break;}}
  if(!meta||!data){reader.innerHTML='<div id="st-loading">Surah not found.</div>';return;}

  var aKeys=Object.keys(_stTrans).filter(function(k){return _stTrans[k];});
  var multi=aKeys.length>1;
  var startJuz=_stJuzOf(_stSurah,1);

  var h='';

  // Header — rendered into separate frozen container OUTSIDE #st-reader
  var _rv=_stRevData[_stSurah]||{type:meta.type};
  var _rvType=_rv.type||meta.type;
  var _rvDisp=_rv.disputed||false;
  var _dotCls=_rvDisp?'st-dot-disp':(_rvType==='meccan'?'st-dot-mec':'st-dot-med');
  var _rvLabel=_rvDisp?'Disputed':(_rvType==='meccan'?'Makkan':'Madinan');
  var _hdrHtml='<div class="st-surah-hdr">'+
    '<div class="st-surah-hdr-inner">'+
      '<div class="st-surah-hdr-spacer"></div>'+
      '<div class="st-surah-hdr-name"><span class="st-shdr-ar">'+_stEsc(meta.name_ar)+'</span><span class="st-shdr-sep">\u00B7</span><span class="st-shdr-en">'+_stEsc(meta.name_en)+'</span></div>'+
      '<div class="st-surah-hdr-rev"><span class="st-rev-dot '+_dotCls+'"></span>'+_rvLabel+'</div>'+
    '</div>'+
  '</div>';
  var _fhdr=document.getElementById('st-fixed-hdr');
  if(_fhdr) _fhdr.innerHTML=_hdrHtml;

  // Nav state (shared by top bismillah row and bottom nav)
  var filtered=_stFilteredSurahs();
  var ci=-1;
  for(var fi=0;fi<filtered.length;fi++){if(filtered[fi].id===_stSurah){ci=fi;break;}}
  var prevSurah=(ci>0)?filtered[ci-1]:null;
  var nextSurah=(ci>=0&&ci<filtered.length-1)?filtered[ci+1]:null;
  var prevBtnHtml=prevSurah?('<button class="st-nav-btn" onclick="_stSelectSurah('+prevSurah.id+')">\u2190 '+_stEsc(prevSurah.name_en)+'</button>'):'';
  var nextBtnHtml=nextSurah?('<button class="st-nav-btn" onclick="_stSelectSurah('+nextSurah.id+')">'+_stEsc(nextSurah.name_en)+' \u2192</button>'):'';

  // Bismillah row (top): prev | bismillah | next. Skip bismillah for surah 1 (verse 1 IS bismillah) and 9 (At-Tawbah has none).
  var showBism=_stSurah!==9;
  h+='<div class="st-bism-row">';
  h+='<div class="st-bism-prev">'+prevBtnHtml+'</div>';
  if(showBism){
    h+='<div class="st-bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650</div>';
  } else {
    h+='<div></div>';
  }
  h+='<div class="st-bism-next">'+nextBtnHtml+'</div>';
  h+='</div>';

  // Column headers — rendered into separate frozen container OUTSIDE #st-reader
  var _colsHtml='<div class="st-col-hdr">'+
    '<div class="st-h-links">LINKS</div>'+
    '<div class="st-h-tr">TRANSLATION</div>'+
    '<div class="st-h-verse">VERSE</div>'+
    '<div class="st-h-var"></div>'+
    '<div class="st-h-leg"></div>'+
    '<div class="st-h-mark">MARKERS</div>'+
  '</div>';
  var _fcols=document.getElementById('st-fixed-cols');
  if(_fcols) _fcols.innerHTML=_colsHtml;

  h+='<div id="st-verses"><div class="st-goldline" id="st-goldline"></div>';

  // Verses (wrapped so the markers overlay can span from first verse to last).
  h+='<div class="st-verses-list">';
  h+='<div class="st-markers-overlay"><div class="st-line st-line-manzil"></div><div class="st-line st-line-hizb"></div><div class="st-line st-line-juz"></div></div>';
  data.verses.forEach(function(v){
    h+='<div class="st-verse" data-verse-id="'+v.id+'">';
    var _vlnk=_stXrefChip(_stSurah,v.id);
    // Concept chips (AI-scored Quran tags). Loader is deferred — chips render
    // only when cache is ready; otherwise an empty string is returned.
    try {
      if(window.GoldArkConcepts && window.GoldArkConcepts.cache && window.GoldArkConcepts.cache.quranByVerse){
        var _ccs = window.GoldArkConcepts.getForVerse(_stSurah, v.id) || [];
        if(_ccs.length){
          var _scColors = {1:'rgba(212,175,55,0.45)',2:'rgba(212,175,55,0.7)',3:'#d4af37',4:'#e8c547',5:'#f5d24a'};
          _vlnk += _ccs.slice(0, 4).map(function(c){
            var sc = Math.max(1, Math.min(5, +c.score || 1));
            var col = _scColors[sc];
            var bold = sc >= 4 ? 'font-weight:700;' : '';
            var lbl = c.slug.replace(/-/g, ' ');
            return '<span class="ga-concept-chip" style="color:' + col + ';' + bold + '" data-concept="' + c.slug + '" title="Match strength: ' + sc + '/5">' + lbl + '<span class="ga-cc-sup" style="color:' + col + ';' + bold + '">' + sc + '</span></span>';
          }).join('');
        }
      } else if(window.GoldArkConcepts){
        // Trigger load + re-render once ready
        window.GoldArkConcepts.loadQuranTags(function(){ if(typeof _stRenderSurah === 'function') _stRenderSurah(); });
      }
    } catch(e){}
    _vlnk+='<button class="st-play-btn" data-surah="'+_stSurah+'" data-ayah="'+v.id+'" onclick="_stPlayClick('+_stSurah+','+v.id+',event)" title="Play verse">\u25B6</button>';
    h+='<div class="st-vlink">'+_vlnk+'</div>';
    h+='<div class="st-vtr">';
    aKeys.forEach(function(k){
      var vtxt=_stGetVerseText(k,_stSurah,v.id,v);
      var dir=_stTransDir(k);
      var dirCss=dir==='rtl'?' style="direction:rtl;text-align:right"':'';
      if(multi){
        h+='<div class="st-vtr-block st-lang-'+k+'"'+dirCss+'>'+_stEsc(vtxt)+'</div>';
      } else {
        h+='<div class="st-lang-'+k+'"'+dirCss+'>'+_stEsc(vtxt)+'</div>';
      }
    });
    h+='</div>';
    h+='<div class="st-vcenter"><span data-bmk-verse="'+v.id+'">'+v.id+'</span></div>';
    var _vex=_stVerseException(_stSurah,v.id);
    var _ar=_stWrapWords(v.ar, _stSurah, v.id);
    if(_vex){
      h+='<div class="st-var">'+_ar+'<span class="st-rev-marker st-rev-'+_vex.type+'" onclick="_stExNote('+_stSurah+','+v.id+',event)" title="'+_stEsc(_vex.note||'')+'"></span></div>';
    } else {
      h+='<div class="st-var">'+_ar+'</div>';
    }
    h+='<div class="st-vleg">'+_stBuildVerseLegends(_stSurah,v.id)+'</div>';
    h+='<div class="st-vmark">'+(function(){
      var marks = _stExtractMarks(v.ar);
      if(!marks.length) return '';
      var defs = window._stMarkDefs || {};
      return marks.map(function(c){
        var meaning = defs[c] || 'Quranic mark';
        return '<span class="qmark qmark-gutter" data-mark="'+c+'" title="'+meaning.replace(/"/g,'&quot;')+'">'+c+'</span>';
      }).join('');
    })()+'</div>';
    if(window._stDive && typeof _dvRenderCard === "function"){
      var _tr = _stGetVerseText("transliteration", _stSurah, v.id, v);
      h += _dvRenderCard(_stSurah, v.id, _tr || "");
    }
    h+='</div>';
  });
  h+='</div>';
  h+='</div>';

  // Bottom nav (uses prevBtnHtml/nextBtnHtml from above)
  h+='<div class="st-nav">'+prevBtnHtml+nextBtnHtml+'</div>';

  h+='<div class="st-source-credit">Translation: Saheeh International \u00B7 Source: quran-json (MIT)</div>';

  reader.innerHTML=h;
  reader.className='st-mode-'+_stMode;
  _stApplyFont();
  _stInitQmarkTooltip();
  // Force tooltip listener to re-bind after marks render
  setTimeout(_stInitQmarkTooltip, 100);
  _stLayoutMarkers();
  // goldline positioned by CSS
  if(typeof _dvPrefetchSurah === "function"){
    _dvPrefetchSurah(_stSurah, function(){ if(typeof _dvUpdateTafsirChips==="function") _dvUpdateTafsirChips(); });
  }
  window._stCurrentSurah=_stSurah;
  // Set up verse-tracking IntersectionObserver after render. Updates
  // lastVerse + furthest-per-surah, saved with a 2.5s debounce.
  setTimeout(function(){ try { _stProgressAttachObserver(); } catch(e){} }, 200);
  setTimeout(function(){ try{ _stBmkRender(); _stBmkInjectTopbarBtn(); }catch(e){} try { if(typeof window._stShellBmkRefresh === 'function') window._stShellBmkRefresh(); } catch(e){} },50);
}


// ═══════════════════════════════════════════════════════════
// COLUMN MODE + FONT SIZE
// ═══════════════════════════════════════════════════════════
function _stSetMode(m){
  _stMode=m;
  var reader=document.getElementById('st-reader');
  if(reader){reader.className='st-mode-'+m;}
  // Body class — spec-renamed values: 'trans' → 'translation', 'both' → 'hybrid'.
  var bodyClass = m==='trans' ? 'st-mode-translation' : (m==='both' ? 'st-mode-hybrid' : 'st-mode-arabic');
  document.body.classList.remove('st-mode-arabic','st-mode-translation','st-mode-hybrid');
  document.body.classList.add(bodyClass);
  // Toggle buttons
  ['ar','both','tr'].forEach(function(k){
    var btn=document.getElementById('st-col-'+k);
    if(btn)btn.classList.toggle('active',k===(m==='arabic'?'ar':m==='trans'?'tr':'both'));
  });
  _stApplyFont();
}

function _stFontAdj(delta){
  _stFontSize=Math.max(12,Math.min(36,_stFontSize+delta));
  _stApplyFont();
}

function _stApplyFont(){
  var reader=document.getElementById('st-reader');
  if(!reader)return;
  reader.style.setProperty('--st-font',_stFontSize+'px');
  // Shift column ratio: bigger font -> need more space
  var arFr=_stMode==='arabic'?1:(_stMode==='trans'?0:30);
  var trFr=_stMode==='trans'?1:(_stMode==='arabic'?0:70);
  reader.style.setProperty('--st-ar-fr',arFr);
  reader.style.setProperty('--st-tr-fr',trFr);
  // Row heights just changed — recompute marker label positions.
  setTimeout(_stLayoutMarkers,50);
}


// ═══════════════════════════════════════════════════════════
// REVERSE XREF — link verses back to events/figures
// ═══════════════════════════════════════════════════════════
function _stParseVerses(str){
  var out=[];
  String(str).split(',').forEach(function(part){
    part=part.trim();
    var rng=part.split('-');
    if(rng.length===2){
      var a=parseInt(rng[0],10),b=parseInt(rng[1],10);
      for(var v=a;v<=b;v++)out.push(v);
    } else {
      var n=parseInt(part,10);
      if(!isNaN(n))out.push(n);
    }
  });
  return out;
}

function _stBuildXrefLookup(){
  _stXrefLookup={};
  _stXrefSurahFigs={};
  if(!_stXref)return;

  // figure_refs: verse-range (same shape as event_refs)
  // _stXrefSurahFigs intentionally stays empty — per-verse data supersedes it.
  (_stXref.figure_refs||[]).forEach(function(f){
    var s=f.surah;
    if(!_stXrefLookup[s])_stXrefLookup[s]={};
    var vs=f.verse_start||1, ve=f.verse_end||vs;
    for(var v=vs;v<=ve;v++){
      if(!_stXrefLookup[s][v])_stXrefLookup[s][v]=[];
      _stXrefLookup[s][v].push({type:'figure',slug:f.slug,name:f.name});
    }
  });

  // event_refs: verse-range
  (_stXref.event_refs||[]).forEach(function(e){
    var s=e.surah;
    if(!_stXrefLookup[s])_stXrefLookup[s]={};
    var vs=e.verse_start||1, ve=e.verse_end||vs;
    for(var v=vs;v<=ve;v++){
      if(!_stXrefLookup[s][v])_stXrefLookup[s][v]=[];
      _stXrefLookup[s][v].push({type:'event',id:e.event_id,title:e.event_title,year:e.event_year});
    }
  });

  // concept_refs: verse-range, one concept fans out across multiple refs
  (_stXref.concept_refs||[]).forEach(function(c){
    (c.refs||[]).forEach(function(r){
      var s=r.surah;
      if(!_stXrefLookup[s])_stXrefLookup[s]={};
      var vs=r.verse_start||1, ve=r.verse_end||vs;
      for(var v=vs;v<=ve;v++){
        if(!_stXrefLookup[s][v])_stXrefLookup[s][v]=[];
        _stXrefLookup[s][v].push({type:'concept',slug:c.slug,name:c.name});
      }
    });
  });
}

async function _stLoadConceptXref(){
  if(_stConceptsByVerse || _stConceptXrefLoading) return _stConceptsByVerse;
  _stConceptXrefLoading = true;
  try {
    var rVerse = await fetch(dataUrl('data/islamic/concepts/verse-concepts.json'));
    var rCanon = await fetch(dataUrl('data/islamic/concepts/concept-canon.json'));
    if(rVerse.ok) _stConceptsByVerse = await rVerse.json();
    if(rCanon.ok) _stConceptCanon = await rCanon.json();
    var vCount = _stConceptsByVerse ? Object.keys(_stConceptsByVerse).length : 0;
    var cCount = _stConceptCanon ? Object.keys(_stConceptCanon).length : 0;
    console.log('[START] concepts: loaded', vCount, 'verses,', cCount, 'canonical concepts');
    _stConceptXrefLoading = false;
    if(typeof _stRenderSurah === 'function') _stRenderSurah();
    return _stConceptsByVerse;
  } catch(e){
    console.warn('[START] concept xref load failed', e);
    _stConceptXrefLoading = false;
    return null;
  }
}

async function _stLoadTafsirXrefForVerses(){
  if(_stTafsirByVerse || _stTafsirXrefLoading) return _stTafsirByVerse;
  _stTafsirXrefLoading = true;
  try {
    var r = await fetch(dataUrl('data/islamic/xref/tafsir_xref_quran.json'));
    if(!r.ok){ _stTafsirXrefLoading = false; return null; }
    var json = await r.json();
    var map = {};
    Object.keys(json).forEach(function(k){
      var nk = k.replace(/-/g, ':');
      if(Array.isArray(json[k])) map[nk] = json[k];
    });
    _stTafsirByVerse = map;
    console.log('[START] tafsir xref: loaded', Object.keys(map).length, 'verses with tafsir refs');
    _stTafsirXrefLoading = false;
    if(typeof _stRenderSurah === 'function') _stRenderSurah();
    return map;
  } catch(e){
    console.warn('[START] tafsir xref load failed', e);
    _stTafsirXrefLoading = false;
    return null;
  }
}

async function _stLoadHadithXrefIntoVerse(){
  if(_stHadithByVerse || _stHadithLoading) return _stHadithByVerse;
  _stHadithLoading = true;
  var map = {};

  // PRIMARY: try the v2 consolidated reverse file (one fetch).
  try{
    var rRev = await fetch(dataUrl('data/islamic/xref/quran_hadith_reverse.json'));
    if(rRev.ok){
      var revJson = await rRev.json();
      // Normalise: keys are "<surah>:<ayah>" or "<surah>-<ayah>"; values are array of hadith refs.
      Object.keys(revJson).forEach(function(rawKey){
        var k = rawKey.replace(/-/g,':');
        var refs = revJson[rawKey];
        if(!Array.isArray(refs))return;
        map[k] = refs.map(function(r){
          // Accept several plausible shapes
          if(typeof r === 'string'){
            // "sahih-bukhari-1" → {col,num}
            var p = r.split('-');
            return { col: p.slice(0,-1).join('-'), num: p[p.length-1], tokens: 0 };
          }
          if(r && r.col && r.num != null) return { col: r.col, num: r.num, tokens: r.tokens||r.score||0 };
          if(r && r.collection && r.hadithNumber != null) return { col: r.collection, num: r.hadithNumber, tokens: r.score||r.tokens||0 };
          if(r && r.collection && r.number != null) return { col: r.collection, num: r.number, tokens: r.score||r.tokens||0 };
          if(r && r.id){
            var p2 = String(r.id).split('-');
            return { col: p2.slice(0,-1).join('-'), num: p2[p2.length-1], tokens: r.tokens||r.score||0 };
          }
          return null;
        }).filter(Boolean);
      });
      var v2Count = Object.keys(map).length;
      console.log('[START] hadith xref v2: loaded', v2Count, 'verses with hadith refs');
      if(v2Count === 0){
        // Schema mismatch — log a sample so we can adapt the parser next round.
        var sampleKeys = Object.keys(revJson).slice(0,3);
        console.warn('[START] hadith xref v2 parsed to 0 verses. Sample keys:', sampleKeys,
          'Sample value:', revJson[sampleKeys[0]]);
        // fall through to legacy loader
        map = {};
      } else {
        _stHadithByVerse = map;
        _stHadithLoading = false;
        if(typeof _stRenderSurah === 'function' && typeof _stSurah !== 'undefined') _stRenderSurah();
        return map;
      }
    }
  } catch(e){
    console.warn('[START] hadith xref v2 fetch failed, falling back to per-collection', e);
  }

  // FALLBACK: legacy 6 per-collection files
  var colls = ['sahih-bukhari','sahih-muslim','sunan-abi-daud','jami-al-tirmidhi','sunan-an-nasai','sunan-ibn-majah'];
  window._hadithXrefCache = window._hadithXrefCache || {};
  await Promise.all(colls.map(async function(c){
    try{
      var idx;
      if(window._hadithXrefCache[c]){
        idx = window._hadithXrefCache[c];
      } else {
        var res = await fetch(dataUrl('data/islamic/hadith_xref/'+c+'.json'));
        if(!res.ok) return;
        var json = await res.json();
        idx = json.hadith_index || {};
        window._hadithXrefCache[c] = idx;
      }
      Object.keys(idx).forEach(function(hkey){
        var entry = idx[hkey];
        var verses = (entry && entry.quran_verses) || [];
        var parts = hkey.split('-');
        var num = parts[parts.length-1];
        var col = parts.slice(0,-1).join('-');
        verses.forEach(function(v){
          var k = v.surah+':'+v.verse;
          (map[k] = map[k] || []).push({col:col,num:num,tokens:v.shared_tokens||0});
        });
      });
    } catch(e){ console.warn('hadith xref load failed', c, e); }
  }));
  _stHadithByVerse = map;
  _stHadithLoading = false;
  if(typeof _stRenderSurah === 'function' && typeof _stSurah !== 'undefined') _stRenderSurah();
  return map;
}

function _stXrefChip(surah,verse){
  var items=(_stXrefLookup[surah]||{})[verse];
  var hadithList = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  var hadithCount = hadithList.length;
  var tafsirList = _stTafsirByVerse ? (_stTafsirByVerse[surah+':'+verse] || []) : [];
  var tafsirCount = tafsirList.length;
  var newConceptList = _stConceptsByVerse ? (_stConceptsByVerse[surah+':'+verse] || []) : [];
  var newConceptCount = newConceptList.length;
  if((!items||!items.length) && !hadithCount && !tafsirCount && !newConceptCount) return '';
  var evCount=0,concCount=0,figCount=0;
  (items||[]).forEach(function(it){
    if(it.type==='event')evCount++;
    else if(it.type==='concept')concCount++;
    else if(it.type==='figure')figCount++;
  });
  if(_stConceptsByVerse) concCount = newConceptCount;
  var h='';
  var onclick=' onclick="_stXrefPopup('+surah+','+verse+',event)"';
  if(evCount){
    h+='<div class="st-xref-chip st-xref-event"'+onclick+'>'+evCount+(evCount===1?' event':' events')+'</div>';
  }
  if(concCount){
    h+='<div class="st-xref-chip st-xref-concept"'+onclick+'>'+concCount+(concCount===1?' concept':' concepts')+'</div>';
  }
  if(figCount){
    h+='<div class="st-xref-chip st-xref-fig"'+onclick+'>'+figCount+(figCount===1?' figure':' figures')+'</div>';
  }
  if(hadithCount){
    h+='<div class="st-xref-chip st-xref-hadith"'+onclick+'>'+hadithCount+(hadithCount===1?' hadith':' hadiths')+'</div>';
  }
  if(tafsirCount){
    h+='<div class="st-xref-chip st-xref-tafsir" onclick="_stTafsirChipPopup('+surah+','+verse+',event)">Tafsir</div>';
  }
  return h;
}

function _stXrefPopup(surah,verse,ev){
  if(ev)ev.stopPropagation();
  var items=(_stXrefLookup[surah]||{})[verse] || [];
  var hadithsForPopup = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  var tafsirsForPopup = _stTafsirByVerse ? (_stTafsirByVerse[surah+':'+verse] || []) : [];
  var conceptsForGuard = _stConceptsByVerse ? (_stConceptsByVerse[surah+':'+verse] || []) : [];
  var scoredForGuard = [];
  try { if(window.GoldArkConcepts && window.GoldArkConcepts.cache && window.GoldArkConcepts.cache.quranByVerse){ scoredForGuard = window.GoldArkConcepts.getForVerse(surah, verse) || []; } } catch(e){}
  if(!items.length && !hadithsForPopup.length && !tafsirsForPopup.length && !conceptsForGuard.length && !scoredForGuard.length) return;

  var old=document.getElementById('st-xref-popup');
  if(old)old.remove();

  var ov=document.createElement('div');
  ov.id='st-xref-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';

  var h='<button onclick="document.getElementById(\'st-xref-popup\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>';
  h+='<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-3);margin:0 0 16px;letter-spacing:.06em">Surah '+surah+' : Verse '+verse+'</h3>';

  var events=items.filter(function(it){return it.type==='event';});
  var figures=items.filter(function(it){return it.type==='figure';});

  if(events.length){
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif">Linked Events</div>';
    events.forEach(function(e){
      h+='<div class="st-xref-row" onclick="_stXrefJumpEvent(\''+_stEsc(e.id)+'\')"><span class="st-xref-year">'+e.year+' CE</span><span>'+_stEsc(e.title)+'</span></div>';
    });
  }

  // Merge concept lists from all 3 sources, dedupe by slug, attach 1-5 score where available
  var _scMap = {};
  try {
    if(window.GoldArkConcepts && window.GoldArkConcepts.cache && window.GoldArkConcepts.cache.quranByVerse){
      var _scored = window.GoldArkConcepts.getForVerse(surah, verse) || [];
      _scored.forEach(function(s){ if(s.slug) _scMap[s.slug] = +s.score || 0; });
    }
  } catch(e){}
  var _allConcepts = [];
  var _seen = {};
  // Source 1: AI-scored tags
  Object.keys(_scMap).forEach(function(slug){
    var canon = _stConceptCanon ? _stConceptCanon[slug] : null;
    var name = canon ? (canon.name || canon.english_name || canon.display_name || canon.label || slug) : slug.replace(/-/g, ' ');
    _allConcepts.push({ slug: slug, name: name, score: _scMap[slug] });
    _seen[slug] = true;
  });
  // Source 2: verse-concepts.json
  if(_stConceptsByVerse && _stConceptsByVerse[surah+':'+verse]){
    _stConceptsByVerse[surah+':'+verse].forEach(function(c){
      if(!c || !c.concept_id || _seen[c.concept_id]) return;
      var canon = _stConceptCanon ? _stConceptCanon[c.concept_id] : null;
      var nm = canon ? (canon.name || canon.english_name || canon.display_name || canon.label || c.concept_id) : c.concept_id;
      _allConcepts.push({ slug: c.concept_id, name: nm, score: _scMap[c.concept_id] || 0 });
      _seen[c.concept_id] = true;
    });
  }
  // Source 3: legacy xref items
  items.filter(function(it){return it.type==='concept';}).forEach(function(c){
    var slug = c.slug || '';
    if(!slug || _seen[slug]) return;
    _allConcepts.push({ slug: slug, name: c.name || slug, score: _scMap[slug] || 0 });
    _seen[slug] = true;
  });
  if(_allConcepts.length){
    var _scCol = {1:'rgba(212,175,55,0.45)',2:'rgba(212,175,55,0.7)',3:'#d4af37',4:'#e8c547',5:'#f5d24a'};
    // Sort: scored first (high to low), then unscored alphabetical
    _allConcepts.sort(function(a,b){
      if((b.score||0) !== (a.score||0)) return (b.score||0) - (a.score||0);
      return (a.name||'').localeCompare(b.name||'');
    });
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif;display:flex;align-items:center;justify-content:space-between"><span>Linked Concepts ('+_allConcepts.length+')</span><span style="font-size:9px;color:#A0AEC0;text-transform:none;letter-spacing:0;font-family:\'Source Sans 3\',sans-serif" title="1=weak (single shared word), 5=strong (exact phrase)">match score 1-5</span></div>';
    _allConcepts.forEach(function(c){
      var sc = c.score;
      var scHtml = sc ? '<span style="color:' + _scCol[Math.max(1,Math.min(5,sc))] + ';font-weight:' + (sc>=4?700:600) + ';font-size:12px;margin-left:6px;min-width:14px;display:inline-block;text-align:right" title="Match strength: '+sc+'/5">'+sc+'</span>' : '';
      h+='<div class="st-xref-row" onclick="_stConceptJump(\''+_stEsc(c.slug)+'\',event)"><span>'+_stEsc(c.name)+' \u2192</span>'+scHtml+'</div>';
    });
  }

  if(figures.length){
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif">Linked Figures</div>';
    figures.forEach(function(f){
      h+='<div class="st-xref-row" onclick="_stXrefJumpFigure(\''+_stEsc(f.slug||'')+'\',\''+_stEsc(f.name||'')+'\')"><span>'+_stEsc(f.name)+'</span></div>';
    });
  }

  var hadiths = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  if(hadiths.length){
    hadiths.sort(function(a,b){ return (b.tokens||0) - (a.tokens||0); });
    var shown = hadiths.slice(0, 25);
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif;display:flex;align-items:center;justify-content:space-between"><span>Linked Hadiths ('+hadiths.length+')</span><span onclick="_stXrefPinAllHadiths('+surah+','+verse+')" style="font-size:11px;text-transform:uppercase;color:#D4AF37;border:1px solid rgba(212,175,55,.5);border-radius:3px;padding:2px 8px;cursor:pointer;letter-spacing:.04em">See all '+hadiths.length+'</span></div>';
    var collLabels = {'sahih-bukhari':'Bukhari','sahih-muslim':'Muslim','sunan-abi-daud':'Abu Dawud','jami-al-tirmidhi':'Tirmidhi','sunan-an-nasai':'Nasa\u02bci','sunan-ibn-majah':'Ibn Majah'};
    shown.forEach(function(hd){
      var lbl = (collLabels[hd.col]||hd.col) + ' #' + hd.num;
      h+='<div class="st-xref-row" onclick="_stXrefJumpHadith(\''+_stEsc(hd.col)+'\',\''+_stEsc(hd.num)+'\')"><span>'+_stEsc(lbl)+'</span><span style="color:#8fd4b5;font-size:10px">'+(hd.tokens||0)+' tok</span></div>';
    });
    if(hadiths.length > 25){
      h+='<div style="font-size:var(--fs-3);color:#888;margin-top:6px">\u2026 '+(hadiths.length-25)+' more</div>';
    }
  }

  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;max-height:70vh;overflow-y:auto;padding:24px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
  box.innerHTML=h;
  ov.appendChild(box);
  document.body.appendChild(ov);

  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

window._stXrefPopup=_stXrefPopup;

function _stXrefJumpHadith(col, num){
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  window._stPendingHadith = {col:col, num:num};

  // DOM-click the real MONASTIC tab — setView is a sandbox stub
  var candidates = document.querySelectorAll(
    '#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="monastic"], .tab-monastic'
  );
  var clicked = false;
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'MONASTIC' || dv === 'monastic'){ el.click(); clicked = true; break; }
  }
  if(!clicked && typeof setView==='function') setView('monastic');

  // Re-fire the pending handler in case onEnter already ran before pending was set
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    if(window._stPendingHadith === null){ clearInterval(iv); return; }
    if(window.Monastic && typeof window.Monastic.onEnter === 'function'){
      try{ window.Monastic.onEnter(); }catch(e){}
    }
    if(tries>50){ clearInterval(iv); }
  },80);
}
window._stXrefJumpHadith=_stXrefJumpHadith;

function _stXrefPinAllHadiths(surah, verse){
  console.log('[XREF→MON pinall]', surah, verse);
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  var hadiths = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  if(!hadiths.length) return;
  var ids = hadiths.map(function(h){ return h.col + '-' + h.num; });
  window._stPendingPinned = { ids: ids, label: 'Verse ' + surah + ':' + verse };
  var candidates = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="monastic"], .tab-monastic');
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'MONASTIC' || dv === 'monastic'){ el.click(); return; }
  }
  if(typeof setView==='function') setView('monastic');
}
window._stXrefPinAllHadiths=_stXrefPinAllHadiths;

function _stXrefJumpEvent(eventId){
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  if(typeof setView==='function')setView('events');

  // Retry loop: handles first-time init of events view + late layout.
  // Root cause being fixed: .ev-row has display:contents, so el.offsetTop
  // returns 0 for browsers. Use getBoundingClientRect on a real child.
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var sc=document.getElementById('evScroll');
    if(!sc){if(tries>40)clearInterval(iv);return;}

    // Force every row + card visible (bypass intersection-observer fade).
    sc.querySelectorAll('.ev-row').forEach(function(r){
      r.classList.remove('ev-row-hidden');r.classList.add('ev-row-reveal');
      var c=r.querySelector('.ev-card');if(c)c.classList.add('ev-card-visible');
    });

    var el=document.querySelector('[data-event-id="'+eventId+'"]');
    if(!el){if(tries>40)clearInterval(iv);return;}

    // ev-row has display:contents (no box). Measure via a child div.
    var firstChild=el.querySelector('div');
    if(!firstChild){if(tries>40)clearInterval(iv);return;}

    var cr=firstChild.getBoundingClientRect();
    var sr=sc.getBoundingClientRect();
    var rowTop=cr.top - sr.top + sc.scrollTop;

    // If layout not ready (zero height), wait and retry.
    if(cr.height===0 && tries<20){return;}

    clearInterval(iv);

    var target=Math.max(0, rowTop - Math.round(sc.clientHeight/3));
    sc.scrollTop=target;

    // Pulse highlight on the card (inline - no styles.css edit needed).
    var card=el.querySelector('.ev-card');
    if(card){
      card.style.transition='box-shadow .3s ease';
      card.style.boxShadow='0 0 0 2px #D4AF37, 0 0 24px rgba(212,175,55,0.55)';
      setTimeout(function(){card.style.boxShadow='';},2500);
    }

    // Re-assert scroll after minimaps/layout settle (200ms of IntersectionObserver + iframe loads).
    setTimeout(function(){
      var fc=el.querySelector('div');
      if(!fc)return;
      var cr2=fc.getBoundingClientRect();
      var sr2=sc.getBoundingClientRect();
      var rt=cr2.top - sr2.top + sc.scrollTop;
      sc.scrollTop=Math.max(0, rt - Math.round(sc.clientHeight/3));
    },700);
  },80);
}
window._stXrefJumpEvent=_stXrefJumpEvent;

  // Build a lookup: tafsirId -> sorted array of {surah, verse} this tafsir covers.
  // Scans _stTafsirByVerse once; cached.
  var _stTafsirCoverage = null;
  function _stBuildTafsirCoverage(){
    if(_stTafsirCoverage) return _stTafsirCoverage;
    var cov = {};
    if(!_stTafsirByVerse) return cov;
    Object.keys(_stTafsirByVerse).forEach(function(key){
      var parts = key.split(':');
      var s = +parts[0], v = +parts[1];
      var arr = _stTafsirByVerse[key] || [];
      arr.forEach(function(e){
        if(!e || !e.tafsir) return;
        if(!cov[e.tafsir]) cov[e.tafsir] = [];
        cov[e.tafsir].push({surah: s, verse: v});
      });
    });
    Object.keys(cov).forEach(function(tid){
      cov[tid].sort(function(a,b){ return a.surah===b.surah ? a.verse-b.verse : a.surah-b.surah; });
    });
    _stTafsirCoverage = cov;
    return cov;
  }

  // Find the verse in a tafsir's coverage closest to the requested (surah, verse).
  // Returns {surah, verse, exact:true|false} or null if tafsir has no coverage.
  function _stNearestTafsirVerse(tafsirId, surah, verse){
    var cov = _stBuildTafsirCoverage();
    var list = cov[tafsirId];
    if(!list || !list.length) return null;
    // Exact match first
    for(var i=0;i<list.length;i++){
      if(list[i].surah===surah && list[i].verse===verse) return {surah:surah, verse:verse, exact:true};
    }
    // Same surah, nearest verse
    var sameSurah = list.filter(function(x){return x.surah===surah;});
    if(sameSurah.length){
      var best = sameSurah[0], bd = Math.abs(sameSurah[0].verse-verse);
      sameSurah.forEach(function(x){
        var d = Math.abs(x.verse-verse);
        if(d < bd){ bd = d; best = x; }
      });
      return {surah:best.surah, verse:best.verse, exact:false};
    }
    // No same-surah coverage — return absolute nearest by surah distance, fallback to first entry
    var bestAbs = list[0];
    var bestSd = Math.abs(list[0].surah-surah);
    list.forEach(function(x){
      var sd = Math.abs(x.surah-surah);
      if(sd < bestSd){ bestSd = sd; bestAbs = x; }
    });
    return {surah:bestAbs.surah, verse:bestAbs.verse, exact:false};
  }

  // Popup: all 28 tafsir editions for this verse, grouped by language.
  // Each row: clicking jumps to EXPLAIN at exact verse if available, else nearest.
  function _stTafsirChipPopup(surah, verse, ev){
    if(ev) ev.stopPropagation();
    var old = document.getElementById('st-xref-popup'); if(old) old.remove();
    var registry = (typeof DIVE_TAFSIR_REGISTRY !== 'undefined') ? DIVE_TAFSIR_REGISTRY : [];
    if(!registry.length){ console.warn('[start] tafsir registry not loaded'); return; }

    var LANG_FULL = {AR:'Arabic', EN:'English', UR:'Urdu', BN:'Bengali', KU:'Kurdish', RU:'Russian'};
    var byLang = {};
    registry.forEach(function(t){
      var lg = t.lang || 'XX';
      if(!byLang[lg]) byLang[lg] = [];
      byLang[lg].push(t);
    });
    var langOrder = ['AR','EN','UR','BN','KU','RU'];

    var ov = document.createElement('div');
    ov.id = 'st-xref-popup';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    var h = '<button onclick="document.getElementById(\'st-xref-popup\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>';
    h += '<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-3);margin:0 0 14px;letter-spacing:.06em">Tafsir — Surah '+surah+' : Verse '+verse+'</h3>';

    langOrder.forEach(function(lg){
      var arr = byLang[lg]; if(!arr || !arr.length) return;
      h += '<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:14px 0 6px;font-family:\'Cinzel\',serif">'+(LANG_FULL[lg]||lg)+'</div>';
      arr.forEach(function(t){
        var workLabel = t.work + (t.author ? ' — ' + t.author : '');
        h += '<div class="st-xref-row" onclick="_stXrefJumpTafsir(\''+_stEsc(t.id)+'\','+surah+','+verse+')"><span>'+_stEsc(workLabel)+'</span></div>';
      });
    });

    var box = document.createElement('div');
    box.style.cssText = 'background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:520px;width:92%;max-height:80vh;overflow-y:auto;padding:24px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
    box.innerHTML = h;
    ov.appendChild(box);
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target===ov) ov.remove(); });
  }
  window._stTafsirChipPopup = _stTafsirChipPopup;

function _stXrefJumpTafsir(tafsirId, surah, verse){
  var pop=document.getElementById('st-xref-popup'); if(pop)pop.remove();
  var newHash = '#explain?tafsir='+encodeURIComponent(tafsirId)+'&surah='+surah+'&verse='+verse;
  try { history.replaceState(null,'',newHash); } catch(e){ location.hash = newHash; }
  var candidates = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="explain"], .tab-explain');
  var clicked = false;
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'EXPLAIN' || dv === 'explain'){ el.click(); clicked = true; break; }
  }
  if(!clicked && typeof setView==='function') setView('explain');
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    if(window.ExplainView && typeof window._exOpenTafsir === 'function'){
      try { window._exOpenTafsir(tafsirId, surah, verse); } catch(e){}
      clearInterval(iv); return;
    }
    if(tries>50) clearInterval(iv);
  },80);
}
window._stXrefJumpTafsir=_stXrefJumpTafsir;

function _stXrefPinAllTafsirs(surah, verse){
  console.log('[XREF→EXPLAIN pinall]', surah, verse);
  var pop=document.getElementById('st-xref-popup'); if(pop)pop.remove();
  var entries = _stTafsirByVerse ? (_stTafsirByVerse[surah+':'+verse] || []) : [];
  if(!entries.length) return;
  window._stPendingPinnedTafsir = { entries: entries.slice(), label: 'Verse '+surah+':'+verse };
  var candidates = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="explain"], .tab-explain');
  var clicked = false;
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'EXPLAIN' || dv === 'explain'){ el.click(); clicked = true; break; }
  }
  if(!clicked && typeof setView==='function') setView('explain');
}
window._stXrefPinAllTafsirs=_stXrefPinAllTafsirs;

function _stFigPopup(surah,ev){
  if(ev)ev.stopPropagation();
  var figs=_stXrefSurahFigs[surah]||[];
  if(!figs.length)return;
  var old=document.getElementById('st-xref-popup');if(old)old.remove();
  var ov=document.createElement('div');
  ov.id='st-xref-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var h='<button onclick="document.getElementById(\'st-xref-popup\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>';
  h+='<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-3);margin:0 0 16px;letter-spacing:.06em">Figures Referenced in This Surah</h3>';
  figs.forEach(function(f){
    h+='<div class="st-xref-row" onclick="_stXrefJumpFigure(\''+_stEsc(f.slug||'')+'\',\''+_stEsc(f.name||'')+'\')"><span>'+_stEsc(f.name)+'</span></div>';
  });
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;max-height:70vh;overflow-y:auto;padding:24px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
  box.innerHTML=h;
  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
window._stFigPopup=_stFigPopup;

function _stXrefJumpFigure(slug,name){
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  if(typeof PEOPLE==='undefined'||!PEOPLE.length){if(typeof setView==='function')setView('timeline');return;}
  var p=null;
  for(var i=0;i<PEOPLE.length;i++){
    if(PEOPLE[i].slug===slug){p=PEOPLE[i];break;}
  }
  if(!p&&name){
    for(var j=0;j<PEOPLE.length;j++){
      if(PEOPLE[j].famous===name){p=PEOPLE[j];break;}
    }
  }
  if(p&&typeof setView==='function'){
    setView('timeline');
    setTimeout(function(){
      if(typeof jumpTo==='function')jumpTo(p.famous);
    },800);
  } else {
    if(typeof setView==='function')setView('timeline');
  }
}
window._stXrefJumpFigure=_stXrefJumpFigure;

// External entry point: switch to START, load the given surah, scroll to + flash the verse range.
// Called from info-card .quran-chip delegation and monastic xref chip clicks.
window.openStartAtVerse = function(surah, vstart, vend){
  var S = +surah, V = +vstart, VE = +(vend || vstart);
  if(!S || !V) { console.warn('[openStartAtVerse] bad args:', surah, vstart, vend); return; }
  window._stPendingJump = { surah: S, vstart: V, vend: VE };
  // DOM-click the START tab — setView is a stub inside this IIFE.
  var _stTabs = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="start"], .tab-start');
  for(var _i=0;_i<_stTabs.length;_i++){
    var _el=_stTabs[_i];
    var _txt=(_el.textContent||'').trim().toUpperCase();
    var _dv=_el.getAttribute('data-view')||'';
    if(_txt==='START' || _dv==='start'){ _el.click(); break; }
  }
  if(typeof setView === 'function') setView('start');
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var reader = document.getElementById('st-reader');
    var hasIdx = (typeof _stIndex !== 'undefined' && _stIndex && _stIndex.length);
    var hasText = (typeof _stText !== 'undefined' && _stText && _stText.length);
    if(reader && hasIdx && hasText){
      clearInterval(iv);
      window._stPendingJump = null;
      try {
        var newHash = '#start?surah=' + S + '&verse=' + V;
        if(history.replaceState) history.replaceState(null, '', newHash);
        else location.hash = newHash;
      } catch(e){}
      try {
        if(typeof _stSelectSurah === 'function') _stSelectSurah(S);
      } catch(e){ console.warn('[openStartAtVerse] selectSurah failed:', e); }
      // Two frames so the new surah render commits before we query verse rows.
      requestAnimationFrame(function(){
        requestAnimationFrame(function(){
          var r2 = document.getElementById('st-reader'); if(!r2) return;
          var first = r2.querySelector('.st-verse[data-verse-id="' + V + '"]');
          if(first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
          for(var v = V; v <= VE; v++){
            (function(vv){
              var row = r2.querySelector('.st-verse[data-verse-id="' + vv + '"]');
              if(!row) return;
              row.classList.add('quran-verse-flash');
              setTimeout(function(){ row.classList.remove('quran-verse-flash'); }, 1800);
            })(v);
          }
        });
      });
      return;
    }
    if(tries > 80){ clearInterval(iv); console.warn('[openStartAtVerse] START reader never ready'); }
  }, 80);
};

function _stConceptJump(slug,ev){
  if(ev)ev.stopPropagation();
  var pop=document.getElementById('st-xref-popup'); if(pop) pop.remove();

  // Find and click the real THINK tab in top nav.
  var tabClicked = false;
  var candidates = document.querySelectorAll(
    '#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="think"], .tab-think'
  );
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'THINK' || dv === 'think'){
      el.click();
      tabClicked = true;
      break;
    }
  }
  // Belt-and-suspenders fallback
  if(!tabClicked && typeof setView==='function') setView('think');
  if(typeof window.initThink==='function'){
    try{ window.initThink(); }catch(e){}
  }

  // Retry selection up to 8s — Think loads data asynchronously
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    if(tries === 12 || tries === 50){
      if(typeof window.initThink==='function'){
        try{ window.initThink(); }catch(e){}
      }
    }
    if(typeof window.thinkSelectConceptBySlug==='function'){
      var ok=window.thinkSelectConceptBySlug(slug);
      if(ok){clearInterval(iv); return;}
    }
    if(tries>100){clearInterval(iv); console.error('[start] think API never ready or slug missing: '+slug);}
  },80);
}
window._stConceptJump=_stConceptJump;

function _stPositionLine(){
  setTimeout(function(){
    var vc=document.querySelector('.st-vcenter');
    var vs=document.getElementById('st-verses');
    var ln=document.getElementById('st-goldline');
    if(!vc||!vs||!ln)return;
    var vr=vc.getBoundingClientRect();
    var pr=vs.getBoundingClientRect();
    var cx=vr.left+vr.width/2-pr.left;
    ln.style.left=(cx-4)+'px';
  },50);
}


// ═══════════════════════════════════════════════════════════
// REVELATION DATA — badges, markers, popups
// ═══════════════════════════════════════════════════════════
function _stVerseException(surah,verse){
  var rv=_stRevData[surah];
  if(!rv||!rv.exceptions||!rv.exceptions.length)return null;
  for(var i=0;i<rv.exceptions.length;i++){
    var ex=rv.exceptions[i];
    var vlist=_stParseVerses(ex.verses);
    if(vlist.indexOf(verse)!==-1)return ex;
  }
  return null;
}

function _stRevNote(surah,ev){
  if(ev)ev.stopPropagation();
  var rv=_stRevData[surah];
  if(!rv||!rv.note)return;
  var old=document.getElementById('st-rev-popup');if(old)old.remove();
  var ov=document.createElement('div');ov.id='st-rev-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:var(--fs-3);line-height:1.7';
  box.innerHTML='<button onclick="document.getElementById(\'st-rev-popup\').remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer">\u00D7</button><h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-3);margin:0 0 12px">Disputed Revelation</h3><p>'+_stEsc(rv.note)+'</p>';
  ov.appendChild(box);document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
window._stRevNote=_stRevNote;

function _stExNote(surah,verse,ev){
  if(ev)ev.stopPropagation();
  var ex=_stVerseException(surah,verse);
  if(!ex)return;
  var old=document.getElementById('st-rev-popup');if(old)old.remove();
  var ov=document.createElement('div');ov.id='st-rev-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var typeLabel=ex.type==='meccan'?'Makkan':'Madinan';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:var(--fs-3);line-height:1.7';
  box.innerHTML='<button onclick="document.getElementById(\'st-rev-popup\').remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer">\u00D7</button><h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-3);margin:0 0 12px">Verse Exception</h3><p>Verse '+verse+' is classified as <strong style="color:'+(ex.type==='meccan'?'#D4AF37':'#2ecc9b')+'">'+typeLabel+'</strong> unlike the rest of this surah.</p>'+(ex.note?'<p style="color:var(--muted);font-style:normal;margin-top:8px">'+_stEsc(ex.note)+'</p>':'');
  ov.appendChild(box);document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
window._stExNote=_stExNote;


// ═══════════════════════════════════════════════════════════
// HIZB + MANZIL (reading divisions from window._stDivisions)
// ═══════════════════════════════════════════════════════════
function _stBuildHizbDD(){
  var panel=document.getElementById('st-dd-hizb');if(!panel)return;
  panel.innerHTML='';
  var list=(window._stDivisions&&window._stDivisions.hizb&&window._stDivisions.hizb.hizb)||[];

  var none=document.createElement('div');
  none.className='st-dd-item'+(_stHizb===0?' selected':'');
  none.textContent='\u2014';
  none.onclick=function(ev){ev.stopPropagation();_stSelectHizb(0);_stCloseDD();};
  panel.appendChild(none);

  list.forEach(function(h){
    var row=document.createElement('div');
    row.className='st-dd-item'+(h.number===_stHizb?' selected':'');
    row.textContent='Hizb '+h.number;
    (function(hh){row.onclick=function(ev){ev.stopPropagation();_stSelectHizb(hh);_stCloseDD();};})(h.number);
    panel.appendChild(row);
  });
  _stUpdateHizbLabel();
}

function _stSelectHizb(n){
  _stHizb=n;
  if(n===0){_stBuildHizbDD();_stUpdateHizbLabel();return;}

  // Picking a Hizb clears Juz + Manzil.
  if(_stJuz!==0){_stJuz=0;_stBuildJuzDD();_stUpdateJuzLabel();}
  if(_stManzil!==0){_stManzil=0;_stBuildManzilBar();}

  var list=(window._stDivisions&&window._stDivisions.hizb&&window._stDivisions.hizb.hizb)||[];
  var entry=null;
  for(var i=0;i<list.length;i++){if(list[i].number===n){entry=list[i];break;}}
  if(!entry||!entry.start){_stBuildHizbDD();_stUpdateHizbLabel();return;}

  var parts=String(entry.start).split(':');
  var s=parseInt(parts[0],10), v=parseInt(parts[1]||'1',10);
  _stBuildHizbDD();_stUpdateHizbLabel();
  // Guard so _qlJump's internal _stSelectSurah won't zero our _stHizb/_stManzil.
  // _qlJump uses a retry loop (up to ~4s); clear guard well after that.
  window._stSuppressDivReset=true;
  if(typeof window._qlJump==='function') window._qlJump(s,v);
  else _stSelectSurah(s);
  setTimeout(function(){window._stSuppressDivReset=false;},5000);
}

function _stUpdateHizbLabel(){
  var el=document.getElementById('st-hizb-label');if(!el)return;
  el.textContent=_stHizb>0?'Hizb '+_stHizb:'Hizb';
  var btn=document.getElementById('st-btn-hizb');
  if(btn)btn.classList.toggle('filtered',_stHizb>0);
}

function _stBuildManzilBar(){
  var panel=document.getElementById('st-dd-manzil');if(!panel)return;
  panel.innerHTML='';
  var list=(window._stDivisions&&window._stDivisions.manzil&&window._stDivisions.manzil.manzil)||[];

  var none=document.createElement('div');
  none.className='st-dd-item'+(_stManzil===0?' selected':'');
  none.textContent='\u2014';
  none.onclick=function(ev){ev.stopPropagation();_stSelectManzil(0);_stCloseDD();};
  panel.appendChild(none);

  list.forEach(function(m){
    var row=document.createElement('div');
    row.className='st-dd-item'+(m.number===_stManzil?' selected':'');
    row.textContent='Manzil '+m.number;
    row.title=m.description||('Manzil '+m.number);
    (function(mm){row.onclick=function(ev){ev.stopPropagation();_stSelectManzil(mm);_stCloseDD();};})(m.number);
    panel.appendChild(row);
  });
  _stUpdateManzilLabel();
}

function _stUpdateManzilLabel(){
  var el=document.getElementById('st-manzil-label');if(!el)return;
  el.textContent=_stManzil>0?'Manzil '+_stManzil:'Manzil';
  var btn=document.getElementById('st-btn-manzil');
  if(btn)btn.classList.toggle('filtered',_stManzil>0);
}

function _stSelectManzil(n){
  _stManzil=n;
  if(n===0){_stBuildManzilBar();_stUpdateManzilLabel();return;}

  // Picking a Manzil clears Juz + Hizb dropdowns.
  if(_stJuz!==0){_stJuz=0;_stBuildJuzDD();_stUpdateJuzLabel();}
  if(_stHizb!==0){_stHizb=0;_stBuildHizbDD();_stUpdateHizbLabel();}

  var list=(window._stDivisions&&window._stDivisions.manzil&&window._stDivisions.manzil.manzil)||[];
  var entry=null;
  for(var i=0;i<list.length;i++){if(list[i].number===n){entry=list[i];break;}}
  _stBuildManzilBar();_stUpdateManzilLabel();
  if(!entry||!entry.surah_range)return;
  var parts=String(entry.surah_range).split('-');
  var firstId=parseInt(parts[0],10);
  if(!isNaN(firstId)){
    window._stSuppressDivReset=true;
    _stSelectSurah(firstId);
    window._stSuppressDivReset=false;
  }
}


// ═══════════════════════════════════════════════════════════
// VERSE MARKERS (Juz / Hizb boundaries + Sajdah glyph)
// ═══════════════════════════════════════════════════════════
function _stCurrentJuzAt(surah,verse){
  var div=window._stDivisions;
  if(!div||!div.juz||!div.juz.juz)return null;
  var cur=null;
  var list=div.juz.juz;
  for(var i=0;i<list.length;i++){
    var j=list[i];
    if(!j.start)continue;
    var p=String(j.start).split(':');
    var s=parseInt(p[0],10), v=parseInt(p[1]||'1',10);
    if(s<surah||(s===surah&&v<=verse))cur=j.number;
    else break;
  }
  return cur;
}
function _stCurrentHizbAt(surah,verse){
  var div=window._stDivisions;
  if(!div||!div.hizb||!div.hizb.hizb)return null;
  var cur=null;
  var list=div.hizb.hizb;
  for(var i=0;i<list.length;i++){
    var hz=list[i];
    if(!hz.start)continue;
    var p=String(hz.start).split(':');
    var s=parseInt(p[0],10), v=parseInt(p[1]||'1',10);
    if(s<surah||(s===surah&&v<=verse))cur=hz.number;
    else break;
  }
  return cur;
}
function _stCurrentManzilAt(surah){
  var div=window._stDivisions;
  if(!div||!div.manzil||!div.manzil.manzil)return null;
  var list=div.manzil.manzil;
  for(var i=0;i<list.length;i++){
    var m=list[i];
    if(!m.surah_range)continue;
    var parts=String(m.surah_range).split('-');
    var s1=parseInt(parts[0],10), s2=parseInt(parts[1]||parts[0],10);
    if(surah>=s1&&surah<=s2)return m.number;
  }
  return null;
}

function _stBuildVerseMarkers(surah,verse){
  var div=window._stDivisions;
  if(!div)return'';

  // On verse 1, always label all three lines with the current division numbers.
  // On other verses, label only when that specific division STARTS at this verse.
  var firstVerse=(verse===1);

  var juzLabel=null;
  if(div.juz&&div.juz.juz){
    if(firstVerse){juzLabel=_stCurrentJuzAt(surah,verse);}
    else {
      for(var i=0;i<div.juz.juz.length;i++){
        var j=div.juz.juz[i];
        if(!j.start)continue;
        var p=String(j.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){juzLabel=j.number;break;}
      }
    }
  }
  var hizbLabel=null;
  if(div.hizb&&div.hizb.hizb){
    if(firstVerse){hizbLabel=_stCurrentHizbAt(surah,verse);}
    else {
      for(var i=0;i<div.hizb.hizb.length;i++){
        var hz=div.hizb.hizb[i];
        if(!hz.start)continue;
        var p=String(hz.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){hizbLabel=hz.number;break;}
      }
    }
  }
  var manzilLabel=null;
  if(firstVerse)manzilLabel=_stCurrentManzilAt(surah);

  function line(cls,labelN){
    var has=(labelN!==null);
    var inner=has?'<span class="st-vm-num">'+labelN+'</span>':'';
    return '<span class="st-vm-line '+cls+'">'+inner+'</span>';
  }
  var h='';
  h+=line('st-vm-manzil',manzilLabel);
  h+=line('st-vm-hizb',hizbLabel);
  h+=line('st-vm-juz',juzLabel);
  return h;
}

function _stBuildVerseLegends(surah,verse){
  var div=window._stDivisions;
  if(!div)return'';
  var h='';
  // Sajdah (۩) — prefer positions file, fall back to sajdah.json.verses
  var hasSaj=false;
  var sajList=(div.sajdah_pos&&div.sajdah_pos.marks)||(div.sajdah&&div.sajdah.verses)||[];
  for(var i=0;i<sajList.length;i++){
    var sj=sajList[i];
    if(sj.surah===surah&&sj.verse===verse){hasSaj=true;break;}
  }
  if(hasSaj) h+='<span class="st-legend st-legend-sajdah" title="Sajdah (prostration)">\u06E9</span>';

  // Rub al-Hizb (۞) — only from rub_positions (it marks in-text positions)
  var hasRub=false;
  if(div.rub_pos&&div.rub_pos.marks){
    for(var j=0;j<div.rub_pos.marks.length;j++){
      var rb=div.rub_pos.marks[j];
      if(rb.surah===surah&&rb.verse===verse){hasRub=true;break;}
    }
  }
  if(hasRub) h+='<span class="st-legend st-legend-rub" title="Rub al-Hizb (quarter section)">\u06DE</span>';

  return h;
}

// ── Word-by-word (WBW) gloss layer ──
// Cache keyed first by language, then surah, then verse, then wordIdx.
var _stWbwByLang = {};       // lang -> { surah -> { verse -> { wordIdx -> gloss } } }
var _stWbwLoading = {};      // "lang|surah" -> bool
window._stWbwLangs = ['en','ur','fr','id','tr','fa','bn','hi','ta','inh'];
window._stWbwLangNames = {en:'English',ur:'Urdu',fr:'French',id:'Indonesian',tr:'Turkish',fa:'Persian',bn:'Bengali',hi:'Hindi',ta:'Tamil',inh:'Ingush'};

window._stGrammarLabels = window._stGrammarLabels || null;
function _stLoadGrammarLabels(){
  if(window._stGrammarLabels) return;
  fetch(dataUrl('data/islamic/morphology/grammar_labels.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){ if(j) window._stGrammarLabels = j; })
    .catch(function(){});
}

// Translate a grammar tag (e.g. "NOUN") to chosen language.
// Falls back to the original English tag if iso missing.
window._stGrammarTr = function(tag, lang){
  lang = lang || _stWbwActiveLang();
  var tbl = window._stGrammarLabels && window._stGrammarLabels[lang];
  if(tbl && tbl[tag]) return tbl[tag];
  return tag;
};

function _stWbwActiveLang(){
  try {
    var v = localStorage.getItem('gold-ark-st-wbw-lang');
    if(v && window._stWbwLangs.indexOf(v) !== -1) return v;
  } catch(e){}
  return 'en';
}

function _stLoadWbw(surah, lang){
  lang = lang || _stWbwActiveLang();
  var key = lang + '|' + surah;
  if(!_stWbwByLang[lang]) _stWbwByLang[lang] = {};
  if(_stWbwByLang[lang][surah] || _stWbwLoading[key]) return;
  _stWbwLoading[key] = true;
  var pad = ('00'+surah).slice(-3);
  function ingest(j){
    if(!j || !j.ayahs){ _stWbwLoading[key] = false; return false; }
    var idx = {};
    j.ayahs.forEach(function(a){
      var byW = {};
      (a.words||[]).forEach(function(w){ if(w && w.w!=null) byW[w.w] = w.t || ''; });
      idx[a.ayah] = byW;
    });
    _stWbwByLang[lang][surah] = idx;
    _stWbwLoading[key] = false;
    console.log('[START] WBW loaded surah', surah, lang, '—', Object.keys(idx).length, 'verses');
    return true;
  }
  fetch(dataUrl('data/islamic/wbw/'+lang+'/surah-'+pad+'.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      if(ingest(j)) return;
      // Fall back to English silently if the chosen language has no file for this surah
      if(lang !== 'en'){
        fetch(dataUrl('data/islamic/wbw/en/surah-'+pad+'.json'))
          .then(function(r){ return r.ok ? r.json() : null; })
          .then(function(j2){
            if(j2 && j2.ayahs){
              var idx = {};
              j2.ayahs.forEach(function(a){
                var byW = {};
                (a.words||[]).forEach(function(w){ if(w && w.w!=null) byW[w.w] = w.t || ''; });
                idx[a.ayah] = byW;
              });
              _stWbwByLang[lang][surah] = idx; // store under requested lang so tooltip finds it
              _stWbwLoading[key] = false;
              console.log('[START] WBW fallback en for', lang, 'surah', surah);
            } else { _stWbwLoading[key] = false; }
          })
          .catch(function(){ _stWbwLoading[key] = false; });
      }
    })
    .catch(function(e){ console.warn('[START] WBW load failed', lang, surah, e); _stWbwLoading[key] = false; });
}

/* Single source of truth for Quranic mark meanings used by both the
   rendered <span title="..."> fallback and the JS hover tooltip. */
window._stMarkDefs = window._stMarkDefs || {
  'ۖ': 'Preferred to stop',
  'ۗ': 'Compulsory stop',
  'ۘ': 'Madda — elongation',
  'ۙ': 'Lam-Alef ligature',
  'ۚ': 'Permissible stop',
  'ۛ': 'Stop at one of two points (whichever is taken, do not stop at the other)',
  'ۜ': 'Brief pause without breaking breath',
  '۝': 'End of verse',
  '۞': 'Rub el Hizb (quarter Hizb marker)',
  '۩': 'Sajdah (prostration required)',
  'ۭ': 'Small low meem — silent meem',
  'ؕ': 'Brief pause without breaking breath',
  'ﷲ': 'Allah',
  '﷽': 'Bismillah',
  'ۥ': 'Small waw',
  'ۦ': 'Small ya',
  'ۤ': 'Small high madda'
};

function _stExtractMarks(s){
  if(!s) return [];
  var m = String(s).match(/[ۖ-۝۞۩ۭؕﷲ﷽ۤ-ۦ]/g);
  return m || [];
}

function _stWrapWords(s, surah, verse){
  if(!s) return s;
  var tokens = String(s).split(/(\s+)/);
  var wIdx = 0;
  return tokens.map(function(tok){
    if(!tok) return tok;
    if(/^\s+$/.test(tok)) return tok;
    wIdx++;
    var marked = _stWrapMarks(tok);
    return '<span class="qword" data-s="'+surah+'" data-v="'+verse+'" data-w="'+wIdx+'">'+marked+'</span>';
  }).join('');
}

function _stInitWbwTooltip(){
  if(window._stWbwInited) return;
  window._stWbwInited = true;
  var tip = document.createElement('div');
  tip.id = 'st-wbw-tip';
  tip.style.cssText = 'position:fixed;z-index:9998;display:none;font-size:13px;color:#FFF;background:#1a1a2e;padding:6px 10px;border-radius:4px;border:1px solid rgba(192,132,252,0.45);pointer-events:none;font-family:Lato,sans-serif;max-width:280px;line-height:1.35;box-shadow:0 4px 12px rgba(0,0,0,0.5);text-align:center';
  document.body.appendChild(tip);
  document.addEventListener('mouseover', function(ev){
    var t = ev.target;
    if(!t || !t.closest) return;
    if(t.closest('.qmark')) return;
    if(t.closest('.st-rev-marker')) return;
    var word = t.closest('.qword');
    if(!word) return;
    var s = parseInt(word.getAttribute('data-s'), 10);
    var v = parseInt(word.getAttribute('data-v'), 10);
    var w = parseInt(word.getAttribute('data-w'), 10);
    if(!s || !v || !w) return;
    var lang = _stWbwActiveLang();
    var langCache = _stWbwByLang[lang];
    if(!langCache || !langCache[s]){
      // Trigger load for this language; bail until it arrives.
      try { _stLoadWbw(s, lang); } catch(e){}
      return;
    }
    var idx = langCache[s];
    if(!idx || !idx[v]) return;
    var gloss = idx[v][w];
    if(!gloss) return;
    tip.textContent = gloss;
    tip.style.display = 'block';
    var r = word.getBoundingClientRect();
    var tr = tip.getBoundingClientRect();
    tip.style.left = Math.max(4, Math.min(window.innerWidth - tr.width - 4, r.left + r.width/2 - tr.width/2)) + 'px';
    tip.style.top  = Math.max(4, r.top - tr.height - 6) + 'px';
  });
  document.addEventListener('mouseout', function(ev){
    var t = ev.target;
    if(!t || !t.closest) return;
    if(t.closest('.qword')) tip.style.display = 'none';
  });
}

// Wrap inline waqf / sajdah / rub marks in Arabic verse text with .qmark spans
// so hover can surface their definition. Other diacritics and letters untouched.
function _stWrapMarks(s){
  if(!s)return s;
  return String(s).replace(/[\u06D6-\u06DC\u06DE\u06E9\u06ED]/g,function(c){
    return '<span class="qmark" data-mark="'+c+'">'+c+'</span>';
  });
}

// Delegated hover tooltip for in-text waqf/sajdah/rub marks.
function _stInitQmarkTooltip(){
  if(window._stQmarkInited)return;
  window._stQmarkInited=true;
  // Sync _stMarkDefs into legacy _stWaqfLookup so older callers keep working.
  window._stWaqfLookup = window._stWaqfLookup || {};
  Object.keys(window._stMarkDefs || {}).forEach(function(k){
    window._stWaqfLookup[k] = window._stWaqfLookup[k] || { arabic_sign: k, hover_def: window._stMarkDefs[k] };
  });
  var tip=document.createElement('div');
  tip.id='st-qmark-tip';
  tip.style.cssText='position:fixed;z-index:99999;display:none;opacity:0;transition:opacity 100ms ease-out;font-size:12px;color:#FFF;background:#1a1a1a;padding:6px 10px;border-radius:14px;border:1px solid #c9a961;pointer-events:none;font-family:Lato,sans-serif;box-shadow:0 4px 12px rgba(0,0,0,0.6);max-width:320px;white-space:normal;line-height:1.35';
  document.body.appendChild(tip);
  function findMark(t){
    while(t && t.nodeType === 1){
      if(t.classList && t.classList.contains('qmark')) return t;
      t = t.parentNode;
    }
    return null;
  }
  document.addEventListener('mouseover',function(ev){
    var t=findMark(ev.target); if(!t)return;
    var mark=t.getAttribute('data-mark');
    var defs = window._stMarkDefs || {};
    var meaning = defs[mark] || (window._stWaqfLookup && window._stWaqfLookup[mark] && window._stWaqfLookup[mark].hover_def);
    if(!meaning) return;
    tip.textContent = mark + ' \u2014 ' + meaning;
    tip.style.display='block';
    var r=t.getBoundingClientRect();
    var tr=tip.getBoundingClientRect();
    tip.style.left=Math.max(4,Math.min(window.innerWidth-tr.width-4,r.left+r.width/2-tr.width/2))+'px';
    tip.style.top=Math.max(4,(r.top-tr.height-6))+'px';
    requestAnimationFrame(function(){ tip.style.opacity='1'; });
  });
  document.addEventListener('mouseout',function(ev){
    var t=findMark(ev.target); if(!t)return;
    tip.style.opacity='0';
    setTimeout(function(){ if(tip.style.opacity==='0') tip.style.display='none'; }, 120);
  });
}


// ═══════════════════════════════════════════════════════════
// MARKERS OVERLAY — one container, 3 continuous lines, floating labels
// ═══════════════════════════════════════════════════════════
function _stMarkersFor(surah,verse,isFirst){
  var div=window._stDivisions;
  var r={juz:null,hizb:null,manzil:null};
  if(!div)return r;
  if(div.juz&&div.juz.juz){
    if(isFirst){r.juz=_stCurrentJuzAt(surah,verse);}
    else {
      for(var i=0;i<div.juz.juz.length;i++){
        var j=div.juz.juz[i];
        if(!j.start)continue;
        var p=String(j.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){r.juz=j.number;break;}
      }
    }
  }
  if(div.hizb&&div.hizb.hizb){
    if(isFirst){r.hizb=_stCurrentHizbAt(surah,verse);}
    else {
      for(var i=0;i<div.hizb.hizb.length;i++){
        var hz=div.hizb.hizb[i];
        if(!hz.start)continue;
        var p=String(hz.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){r.hizb=hz.number;break;}
      }
    }
  }
  if(isFirst)r.manzil=_stCurrentManzilAt(surah);
  return r;
}

function _stLayoutMarkers(){
  var list=document.querySelector('.st-verses-list');
  var overlay=document.querySelector('.st-markers-overlay');
  if(!list||!overlay)return;
  // Clear stale labels but keep the 3 line divs.
  overlay.querySelectorAll('.st-vm-num').forEach(function(n){n.remove();});

  var rows=list.querySelectorAll('.st-verse');
  rows.forEach(function(row,idx){
    var vid=parseInt(row.getAttribute('data-verse-id'),10);
    if(isNaN(vid))return;
    var isFirst=(idx===0);
    var labels=_stMarkersFor(_stSurah,vid,isFirst);
    var which=[];
    if(labels.manzil!==null)which.push(['manzil',labels.manzil]);
    if(labels.hizb!==null)which.push(['hizb',labels.hizb]);
    if(labels.juz!==null)which.push(['juz',labels.juz]);
    if(!which.length)return;
    var baseTop=isFirst?0:row.offsetTop;
    var stagger=(which.length>1)?18:0;
    which.forEach(function(p,i){
      var type=p[0], n=p[1];
      var el=document.createElement('span');
      el.className='st-vm-num st-vm-num-'+type;
      if(isFirst){
        // Starting numbers: stack from the top, no vertical centering.
        el.style.top=(baseTop+i*16)+'px';
        el.style.transform='translateX(-50%)';
      } else {
        // Division change: pill visually centered on the line.
        el.style.top=(baseTop+i*stagger)+'px';
        el.style.transform='translate(-50%,-50%)';
      }
      el.textContent=String(n);
      overlay.appendChild(el);
    });
  });
}
window._stLayoutMarkers=_stLayoutMarkers;

(function(){
  var to=null;
  window.addEventListener('resize',function(){
    clearTimeout(to);
    to=setTimeout(function(){if(typeof _stLayoutMarkers==='function')_stLayoutMarkers();},120);
  });
})();



// ═══════════════════════════════════════════════════════════
// PLAY SURAH — whole-surah playback control (header pill)
// ═══════════════════════════════════════════════════════════
window._stSurahPlayMode=false;

function _stSurahPlayClick(ev){
  if(ev)ev.stopPropagation();
  if(!window.QuranAudio)return;
  var el=document.getElementById('qa-primary');
  var cur=window.QuranAudio.getCurrent();
  if(window._stSurahPlayMode&&cur&&el){
    // Already in surah-play mode — toggle pause/resume.
    if(!el.paused){
      window.QuranAudio.pause();
    } else {
      el.play().catch(function(){});
    }
    _stUpdateSurahPlayBtn();
    return;
  }
  // Idle or stopped — start fresh from ayah 1.
  window._stSurahPlayMode=true;
  window.QuranAudio.play(_stSurah,1);
  _stUpdateSurahPlayBtn();
}
window._stSurahPlayClick=_stSurahPlayClick;

function _stUpdateSurahPlayBtn(){
  var btn=document.getElementById('st-surah-play-btn');
  if(!btn)return;
  var el=document.getElementById('qa-primary');
  var cur=window.QuranAudio&&window.QuranAudio.getCurrent();
  var playing=(window._stSurahPlayMode&&cur&&el&&!el.paused);
  btn.textContent=playing?'\u23F8':'\u25B6';
  btn.classList.toggle('playing',playing);
}

// ═══════════════════════════════════════════════════════════
// QURAN AUDIO WIRING — reciter dropdown + per-ayah play button
// ═══════════════════════════════════════════════════════════
function _stBuildReciterDD(){
  var panel=document.getElementById('st-dd-reciter');if(!panel)return;
  panel.innerHTML='';
  (_stReciters||[]).forEach(function(r){
    var row=document.createElement('div');
    row.className='st-dd-item'+(_stCurrentReciter===r.id?' selected':'');
    row.textContent=r.name||r.id;
    (function(rid,rname){
      row.onclick=function(ev){ev.stopPropagation();_stSelectReciter(rid,rname);_stCloseDD();};
    })(r.id,r.name||r.id);
    panel.appendChild(row);
  });
}

function _stSelectReciter(id,name){
  _stCurrentReciter=id;
  _stCurrentReciterName=name||id;
  if(window.QuranAudio)window.QuranAudio.setReciter(id);
  _stBuildReciterDD();
  _stUpdateReciterLabel();
}

function _stUpdateReciterLabel(){
  var el=document.getElementById('st-reciter-label');if(!el)return;
  el.textContent=_stCurrentReciterName||'Reciter';
}

function _stPlayClick(s,a,ev){
  if(ev)ev.stopPropagation();
  if(!window.QuranAudio)return;
  // Single-shot: leaving surah-play mode ensures no auto-advance past this ayah.
  window._stSurahPlayMode=false;
  _stUpdateSurahPlayBtn();
  var cur=window.QuranAudio.getCurrent();
  var el=document.getElementById('qa-primary');
  if(cur&&cur.surah===s&&cur.ayah===a){
    // Toggle pause/resume on the already-current ayah.
    if(el&&!el.paused){
      window.QuranAudio.pause();
      var btn=ev&&ev.currentTarget;
      if(btn){btn.textContent='\u25B6';btn.classList.remove('playing');}
    } else if(el){
      el.play().catch(function(){});
      var btn2=ev&&ev.currentTarget;
      if(btn2){btn2.textContent='\u23F8';btn2.classList.add('playing');}
    }
  } else {
    window.QuranAudio.play(s,a);
  }
}
window._stPlayClick=_stPlayClick;

function _stOnAudioChange(cur){
  document.querySelectorAll('.st-play-btn').forEach(function(btn){
    var s=parseInt(btn.getAttribute('data-surah'),10);
    var a=parseInt(btn.getAttribute('data-ayah'),10);
    if(cur&&s===cur.surah&&a===cur.ayah){
      btn.textContent='\u23F8';btn.classList.add('playing');
    } else {
      btn.textContent='\u25B6';btn.classList.remove('playing');
    }
  });
  // Surah-play: scroll target row into view; bail out on null (end-of-surah stop).
  if(cur===null&&window._stSurahPlayMode){
    window._stSurahPlayMode=false;
  }
  _stUpdateSurahPlayBtn();
  if(cur&&window._stSurahPlayMode){
    var row=document.querySelector('.st-verse[data-verse-id="'+cur.ayah+'"]');
    if(row)row.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

function _stOnAudioError(err){
  console.warn('[START] audio playback failed:',err);
  if(!err)return;
  var btn=document.querySelector('.st-play-btn[data-surah="'+err.surah+'"][data-ayah="'+err.ayah+'"]');
  if(btn){
    btn.classList.add('st-play-err');
    setTimeout(function(){btn.classList.remove('st-play-err');},1000);
  }
}

// ═══════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════
function _stCleanup(){
  document.body.classList.remove('st-active');
}

// ═══════════════════════════════════════════════════════════
// SETVIEW INTEGRATION
// ═══════════════════════════════════════════════════════════

function _dvPickLang(code){
  DIVE_TLANG_FILTER = code || "";
  var lbl = document.getElementById("st-dvlang-label");
  if(lbl) lbl.textContent = code ? ("Tafsir: "+DIVE_LANG_FULL[code]) : "Tafsir Language";
  _stCloseDD();
  // Invalidate all loaded tafsir slots so they re-render with filter
  document.querySelectorAll(".dv-tafsir-slot").forEach(function(s){ s.setAttribute("data-loaded","0"); s.innerHTML=""; });
  // Reopen any currently-open tafsir details so they repopulate
  document.querySelectorAll(".dv-card details").forEach(function(d){
    var slot = d.querySelector(".dv-tafsir-slot");
    if(slot && d.open) _dvPopulateTafsirSlot(slot);
  });
}
window._dvPickLang = _dvPickLang;

window._stEsc=_stEsc;

// ══════════════════════════════════════════════════════════
// BOOKMARKS
// ══════════════════════════════════════════════════════════
function _stBmkRender(){
  var auth=window.GoldArkAuth;
  var signedIn=auth&&auth.isSignedIn();
  document.querySelectorAll('#st-verses .st-bmk').forEach(function(x){ x.remove(); });
  document.querySelectorAll('#st-verses .st-verse').forEach(function(row){
    var centerSpan=row.querySelector('.st-vcenter span[data-bmk-verse]');
    if(!centerSpan) return;
    var v=parseInt(centerSpan.getAttribute('data-bmk-verse'));
    if(!v) return;
    var linkCol=row.querySelector('.st-vlink');
    if(!linkCol) return;
    var s=window._stCurrentSurah||1;
    var filled=signedIn&&auth.hasBookmark(s,v);
    var btn=document.createElement('button');
    btn.className='st-bmk'+(filled?' on':'');
    btn.title=signedIn?(filled?'Remove bookmark':'Add bookmark'):'Sign in to bookmark';
    btn.innerHTML='<svg width="12" height="16" viewBox="0 0 12 16" fill="'+(filled?'#D4AF37':'none')+'" stroke="#D4AF37" stroke-width="1.4"><path d="M1 1 L1 15 L6 11 L11 15 L11 1 Z"/></svg>';
    btn.onclick=function(e){
      e.stopPropagation();
      window.requireTester('bookmark',function(){
        var a=window.GoldArkAuth;
        var surah=window._stCurrentSurah||1;
        var p=a.hasBookmark(surah,v)?a.removeBookmark(surah,v):a.addBookmark(surah,v);
        p.then(function(){
          setTimeout(function(){
            try{ _stBmkRender(); }catch(e){}
            try { if(typeof window._stShellBmkRefresh === 'function') window._stShellBmkRefresh(); } catch(e){}
          },200);
        }).catch(function(err){console.error(err);});
      });
    };
    linkCol.appendChild(btn);
  });
}
window._stBmkRender=_stBmkRender;

// ══════════════════════════════════════════════════════════
// READING PROGRESS — last read + furthest-reached per surah
// ══════════════════════════════════════════════════════════
var _stProgressTimer = null;
var _stProgressObs = null;

function _stSaveProgress(surah, verse){
  if(!surah) return;
  var auth = window.GoldArkAuth;
  var existing = (auth && auth.getProgress) ? (auth.getProgress() || {}) : {};
  var furthest = (existing.furthest && typeof existing.furthest === 'object') ? existing.furthest : {};
  var key = String(surah);
  var prevMax = parseInt(furthest[key] || 0, 10);
  if(verse && verse > prevMax) furthest[key] = verse;
  var data = {
    lastSurah: surah,
    lastVerse: verse || 1,
    furthest: furthest,
    updatedAt: Date.now()
  };
  // Debounce Firestore writes — local mirror always immediate.
  if(_stProgressTimer){ clearTimeout(_stProgressTimer); _stProgressTimer = null; }
  _stProgressTimer = setTimeout(function(){
    if(auth && auth.setProgress){
      try { auth.setProgress(data); } catch(e){ console.warn('[progress] save failed', e); }
    } else {
      try { localStorage.setItem('gold-ark-progress', JSON.stringify(data)); } catch(e){}
    }
  }, 2500);
}
window._stSaveProgress = _stSaveProgress;

function _stProgressAttachObserver(){
  if(_stProgressObs){ try { _stProgressObs.disconnect(); } catch(e){} _stProgressObs = null; }
  var rows = document.querySelectorAll('#st-verses .st-verse');
  if(!rows.length) return;
  _stProgressObs = new IntersectionObserver(function(entries){
    var topmost = null, topY = Infinity;
    entries.forEach(function(en){
      if(!en.isIntersecting) return;
      var bb = en.boundingClientRect;
      if(bb.top < topY){ topY = bb.top; topmost = en.target; }
    });
    if(!topmost) return;
    var span = topmost.querySelector('.st-vcenter span[data-bmk-verse]');
    if(!span) return;
    var v = parseInt(span.getAttribute('data-bmk-verse'), 10);
    var s = window._stCurrentSurah || 1;
    if(v > 0) _stSaveProgress(s, v);
  }, { threshold: [0.5] });
  rows.forEach(function(r){ _stProgressObs.observe(r); });
}

function _stRenderResumePill(){
  // Place a banner above #st-verses showing the resume target.
  var auth = window.GoldArkAuth;
  var prog = (auth && auth.getProgress) ? auth.getProgress() : null;
  if(!prog || !prog.lastSurah) return;
  // Don't show in this session if user dismissed.
  try { if(sessionStorage.getItem('gold-ark-resume-dismissed') === '1') return; } catch(e){}
  // Don't show if already on the saved surah.
  if(window._stCurrentSurah && parseInt(prog.lastSurah,10) === parseInt(window._stCurrentSurah,10)) return;

  var existing = document.getElementById('st-resume-pill');
  if(existing) existing.remove();

  var verses = document.getElementById('st-verses');
  if(!verses || !verses.parentNode) return;

  var pill = document.createElement('div');
  pill.id = 'st-resume-pill';
  pill.style.cssText = 'margin:8px 16px;padding:8px 14px;display:flex;align-items:center;gap:10px;background:rgba(212,175,55,0.10);border:1px solid rgba(212,175,55,0.45);border-radius:6px;color:#D4AF37;font-family:Cinzel,serif;font-size:13px;letter-spacing:.04em';
  pill.innerHTML = '<span style="flex:1;cursor:pointer" id="st-resume-link">▶ Resume reading at Surah ' + prog.lastSurah + ' : Verse ' + (prog.lastVerse || 1) + '</span>'
    + '<button id="st-resume-dismiss" title="Dismiss" style="background:none;border:none;color:#888;cursor:pointer;font-size:18px;line-height:1;padding:0 4px">×</button>';
  verses.parentNode.insertBefore(pill, verses);

  var link = pill.querySelector('#st-resume-link');
  link.onclick = function(){
    var s = parseInt(prog.lastSurah, 10);
    var v = parseInt(prog.lastVerse || 1, 10);
    if(typeof window._stSelectSurah === 'function') window._stSelectSurah(s);
    setTimeout(function(){
      var verseEl = document.querySelector('#st-verses .st-verse [data-bmk-verse="'+v+'"]');
      if(verseEl){
        var row = verseEl.closest('.st-verse');
        if(row){
          row.scrollIntoView({behavior:'smooth', block:'center'});
          row.classList.add('qref-pulse');
          setTimeout(function(){ row.classList.remove('qref-pulse'); }, 2500);
        }
      }
      pill.remove();
    }, 600);
  };
  pill.querySelector('#st-resume-dismiss').onclick = function(){
    try { sessionStorage.setItem('gold-ark-resume-dismissed', '1'); } catch(e){}
    pill.remove();
  };
}
window._stRenderResumePill = _stRenderResumePill;

function _stBmkPopup(){
  var auth=window.GoldArkAuth;
  if(!auth||!auth.isSignedIn()){
    window.requireTester('bookmarks',function(){ _stBmkPopup(); });
    return;
  }
  var old=document.getElementById('st-bmk-popup'); if(old) old.remove();
  var overlay=document.createElement('div');
  overlay.id='st-bmk-popup';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.onclick=function(e){ if(e.target===overlay) overlay.remove(); };
  var box=document.createElement('div');
  box.id='st-bmk-box';
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:480px;width:92%;max-height:74vh;overflow-y:auto;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Pretty label for hadith collection keys, e.g. "bukhari" → "Sahih Bukhari".
  var COLL_LABELS = {
    bukhari:  'Sahih Bukhari',
    muslim:   'Sahih Muslim',
    abudawud: 'Sunan Abu Dawud',
    tirmidhi: 'Jami at-Tirmidhi',
    nasai:    'Sunan an-Nasai',
    ibnmajah: 'Sunan Ibn Majah'
  };
  function _hadithLabel(colKey){
    if(COLL_LABELS[colKey]) return COLL_LABELS[colKey];
    // fallback: title-case the slug
    return String(colKey||'').split('-').map(function(w){ return w ? w.charAt(0).toUpperCase()+w.slice(1) : ''; }).join(' ');
  }

  // Parse a bookmark string into a typed entry.
  // Quran legacy "s:v" → {type:'q', surah, verse, key}
  // "q:s:v"          → {type:'q', surah, verse, key}
  // "h:col:num"      → {type:'h', col, num, key}
  // "t:slug:s:v"     → {type:'t', slug, surah, verse, key}
  function _parseBmk(k){
    if(!k) return null;
    if(k.indexOf('h:') === 0){
      var hp = k.slice(2).split(':');
      if(hp.length < 2) return null;
      var hCol = hp.slice(0, hp.length-1).join(':');
      var hNum = parseInt(hp[hp.length-1], 10);
      if(!hCol || isNaN(hNum)) return null;
      return { type:'h', col:hCol, num:hNum, key:k };
    }
    if(k.indexOf('t:') === 0){
      var tp = k.slice(2).split(':');
      if(tp.length < 3) return null;
      var tSlug = tp.slice(0, tp.length-2).join(':');
      var tS = parseInt(tp[tp.length-2], 10);
      var tV = parseInt(tp[tp.length-1], 10);
      if(!tSlug || isNaN(tS) || isNaN(tV)) return null;
      return { type:'t', slug:tSlug, surah:tS, verse:tV, key:k };
    }
    if(k.indexOf('q:') === 0){
      var qp = k.slice(2).split(':');
      if(qp.length !== 2) return null;
      var qS = parseInt(qp[0], 10), qV = parseInt(qp[1], 10);
      if(isNaN(qS) || isNaN(qV)) return null;
      return { type:'q', surah:qS, verse:qV, key:k };
    }
    // Legacy bare "s:v"
    var lp = k.split(':');
    if(lp.length === 2){
      var lS = parseInt(lp[0], 10), lV = parseInt(lp[1], 10);
      if(!isNaN(lS) && !isNaN(lV)) return { type:'q', surah:lS, verse:lV, key:k, legacy:true };
    }
    return null;
  }

  function _renderBody(){
    var a=window.GoldArkAuth;
    var raw=(a&&a.getBookmarks)?a.getBookmarks():[];
    var entries = raw.map(_parseBmk).filter(function(x){ return !!x; });

    // Group: Quran first (sorted by surah:verse), Hadith second (sorted by col, num)
    var quran = entries.filter(function(e){ return e.type==='q'; })
      .sort(function(a,b){ return a.surah-b.surah || a.verse-b.verse; });
    var hadith = entries.filter(function(e){ return e.type==='h'; })
      .sort(function(a,b){ if(a.col!==b.col) return a.col<b.col?-1:1; return a.num-b.num; });
    var tafsir = entries.filter(function(e){ return e.type==='t'; });

    var h='<button id="st-bmk-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>';
    h+='<h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-2);margin:0 0 16px;letter-spacing:.06em">My Bookmarks</h3>';

    if(!entries.length){
      h+='<div style="color:#888;font-style:italic">No bookmarks yet. Use the bookmark icon next to any verse or hadith to save it.</div>';
    } else {
      function _section(title, list){
        if(!list.length) return '';
        var sec = '<div style="font-family:Cinzel,serif;font-size:var(--fs-3);letter-spacing:.08em;color:rgba(212,175,55,0.7);text-transform:uppercase;margin:14px 0 6px">'+title+'</div>';
        sec += '<div style="display:flex;flex-direction:column;gap:6px">';
        list.forEach(function(e){
          var label = '';
          if(e.type==='q')      label = 'Surah ' + e.surah + ' : Verse ' + e.verse;
          else if(e.type==='h') label = _hadithLabel(e.col) + ' · Hadith #' + e.num;
          else if(e.type==='t') label = 'Tafsir ' + e.slug + ' · ' + e.surah + ':' + e.verse;
          sec += '<div class="st-bmk-row" style="display:flex;align-items:stretch;gap:6px">'
            + '<button class="st-bmk-item" data-key="' + e.key + '" data-type="' + e.type + '" style="flex:1;text-align:left;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.3);color:#E5E7EB;padding:8px 12px;border-radius:4px;cursor:pointer;font-family:Lato,sans-serif;font-size:var(--fs-3)">' + label + '</button>'
            + '<button class="st-bmk-x" data-key="' + e.key + '" data-type="' + e.type + (e.legacy?'" data-legacy="1':'') + '" title="Remove bookmark" style="width:36px;background:rgba(220,80,80,0.08);border:1px solid rgba(220,80,80,0.4);color:#e87a7a;border-radius:4px;cursor:pointer;font-size:var(--fs-2);line-height:1;padding:0">×</button>'
            + '</div>';
        });
        sec += '</div>';
        return sec;
      }
      h += _section('Verses (Quran)', quran);
      h += _section('Hadiths', hadith);
      h += _section('Tafsir', tafsir);
    }

    box.innerHTML=h;
    document.getElementById('st-bmk-close').onclick=function(){ overlay.remove(); };

    // Remove handler
    box.querySelectorAll('.st-bmk-x').forEach(function(xBtn){
      xBtn.onclick=function(ev){
        ev.stopPropagation();
        var key = xBtn.getAttribute('data-key');
        var type = xBtn.getAttribute('data-type');
        var legacy = xBtn.getAttribute('data-legacy') === '1';
        var a = window.GoldArkAuth;
        if(!a) return;
        var p;
        if(type === 'q' && legacy && a.removeBookmark){
          // Legacy bare "s:v" — use the old removeBookmark(s,v) signature.
          var lp = key.split(':');
          p = a.removeBookmark(parseInt(lp[0],10), parseInt(lp[1],10));
        } else if(a.removeBookmarkKey){
          p = a.removeBookmarkKey(key);
        } else if(type === 'q' && a.removeBookmark){
          var qp = key.replace(/^q:/,'').split(':');
          p = a.removeBookmark(parseInt(qp[0],10), parseInt(qp[1],10));
        } else { return; }
        Promise.resolve(p).then(function(){ _renderBody(); })
          .catch(function(err){ console.warn('[bmk] remove failed', err); });
      };
    });

    // Click-to-jump handler
    box.querySelectorAll('.st-bmk-item').forEach(function(btn){
      btn.onclick=function(){
        var key = btn.getAttribute('data-key');
        var type = btn.getAttribute('data-type');
        var entry = _parseBmk(key);
        if(!entry) return;
        overlay.remove();

        if(entry.type === 'h'){
          // Hand off to MONASTIC via the existing pending-hadith handshake.
          window._stPendingHadith = { col: entry.col, num: entry.num };
          var monBtn = document.querySelector('.tab-btn[data-tab="MONASTIC"]');
          if(monBtn) monBtn.click();
          return;
        }
        if(entry.type === 't'){
          // Tafsir entry — open EXPLAIN view (deep-link not yet wired in modal).
          var expBtn = document.querySelector('.tab-btn[data-tab="EXPLAIN"]');
          if(expBtn) expBtn.click();
          return;
        }
        // Quran verse — switch to START tab (if not already there) and scroll to verse.
        var s = entry.surah, v = entry.verse;
        var onStartTab = !!document.getElementById('st-verses');
        var doScroll = function(){
          var verseEl=document.querySelector('#st-verses .st-verse [data-bmk-verse="'+v+'"]');
          if(verseEl){
            var row=verseEl.closest('.st-verse');
            if(row){
              row.scrollIntoView({behavior:'smooth',block:'center'});
              row.classList.add('qref-pulse');
              setTimeout(function(){ row.classList.remove('qref-pulse'); },2500);
            }
          }
        };
        var doLoad = function(){
          var loaded=false;
          var fns=['_stLoadSurah','_stGoto','_stOpenSurah','_stJumpTo','_stShowSurah','_stSelectSurah'];
          for(var i=0;i<fns.length;i++){
            if(typeof window[fns[i]]==='function'){
              try{ window[fns[i]](s,v); loaded=true; break; }catch(e){}
            }
          }
          if(!loaded){
            var sel=document.querySelector('#st-surah-select,#st-surah-dd,select[data-st-surah]');
            if(sel){ sel.value=s; sel.dispatchEvent(new Event('change',{bubbles:true})); }
          }
          setTimeout(doScroll, 500);
        };
        if(onStartTab){
          doLoad();
        } else {
          // Use the same handshake pattern as hadith jumps. Set a pending verse
          // and switch to START tab. start.js mount/restore reads it after init.
          window._stPendingVerse = { surah: s, verse: v };
          var startBtn = document.querySelector('.tab-btn[data-tab="START"]');
          if(startBtn) startBtn.click();
          // Poll until START's DOM is ready, then load + scroll.
          var pollAttempts = 0;
          var pollIv = setInterval(function(){
            pollAttempts++;
            if(document.getElementById('st-verses')){
              clearInterval(pollIv);
              window._stPendingVerse = null;
              doLoad();
            } else if(pollAttempts > 80){
              clearInterval(pollIv);
              console.warn('[bmk] START view never mounted for cross-view jump');
            }
          }, 100);
        }
      };
    });
  }

  _renderBody();
}
window._stBmkPopup=_stBmkPopup;

function _stBmkInjectTopbarBtn(){
  var bar=document.getElementById('st-topbar');
  if(!bar) return;
  var btn=document.getElementById('st-bmk-btn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='st-bmk-btn';
    btn.className='st-topbar-btn';
    btn.type='button';
    btn.onclick=_stBmkPopup;
    /* lower BOOKMARKS pill disabled — shell pill is the single source */
  }
  var auth=window.GoldArkAuth;
  var count=(auth&&auth.isSignedIn())?auth.getBookmarks().length:0;
  var hasAny=count>0;
  var color=hasAny?'#D4AF37':'#A0AEC0';
  var borderCol=hasAny?'rgba(212,175,55,0.8)':'rgba(160,174,192,0.5)';
  btn.title=hasAny?('View my '+count+' bookmark(s)'):'No bookmarks yet';
  btn.innerHTML='★ BOOKMARKS'+(hasAny?' ('+count+')':'');
  btn.style.cssText='margin-left:6px;padding:4px 12px;background:transparent;border:1px solid '+borderCol+';color:'+color+';font-family:Cinzel,serif;font-size:var(--fs-3);letter-spacing:.06em;text-transform:uppercase;cursor:pointer;border-radius:2px';
}
window._stBmkInjectTopbarBtn=_stBmkInjectTopbarBtn;

// Re-render bookmark ribbons + topbar button when auth state changes
if(window.GoldArkAuth&&window.GoldArkAuth.onStateChange){
  window.GoldArkAuth.onStateChange(function(){
    try{ _stBmkRender(); _stBmkInjectTopbarBtn(); }catch(e){}
    try { if(typeof window._stShellBmkRefresh === 'function') window._stShellBmkRefresh(); } catch(e){}
  });
}
// ══════════════════════════════════════════════════════════
// HARD CONTRACT — DO NOT VIOLATE
// ══════════════════════════════════════════════════════════
// #st-topbar (the "Read the Quran" line + filter row +
// DIVE button) MUST remain visible 100% of the time while
// the START view is open. No DIVE state change, no chip
// click, no scroll position, no surah re-render is allowed
// to hide, collapse, or scroll it off the viewport.
//
// If a future change causes it to disappear, the fix is in
// styles.css (#st-topbar sticky rules) or start.js
// (ensure _stRenderSurah only writes into #st-reader, never
// replaces #st-topbar).
// ══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// DIVE — Scholastic Quran extension for START view
// Activates when _stDive = true. Adds per-verse expandable
// card below each verse row with Transliteration / Word-by-word
// (pending) / Dictionary (pending) / Tafsir (multi) /
// Translations (multi). Center spine stays sacred.
// ═══════════════════════════════════════════════════════════

var _dvTafsirCache = {};        // _dvTafsirCache[id][surah] = ayahs[]
var _dvTafsirAvail  = {};        // _dvTafsirAvail[surah][verse] = [tafsir ids]
var _dvFetchedSurahs = {};       // surahId -> true once all 29 fetched

// Expose tafsir registry to MY VIEW (which lives outside this IIFE scope).
// We assign window._stTafsirRegistry right after the array literal is built.
window._stTafsirRegistry = window._stTafsirRegistry || []; var DIVE_TAFSIR_REGISTRY = window._stTafsirRegistry; DIVE_TAFSIR_REGISTRY.length = 0; DIVE_TAFSIR_REGISTRY.push.apply(DIVE_TAFSIR_REGISTRY, [
  {id:"ar-tafsir-ibn-kathir",          work:"Tafsir Ibn Kathir",         work_id:"ibn-kathir",    author:"Ibn Kathir",           fcode:"F0741", lang:"AR", tradition:"sunni-classical"},
  {id:"en-tafisr-ibn-kathir",          work:"Tafsir Ibn Kathir",         work_id:"ibn-kathir",    author:"Ibn Kathir",           fcode:"F0741", lang:"EN", tradition:"sunni-classical"},
  {id:"ur-tafseer-ibn-e-kaseer",       work:"Tafsir Ibn Kathir",         work_id:"ibn-kathir",    author:"Ibn Kathir",           fcode:"F0741", lang:"UR", tradition:"sunni-classical"},
  {id:"bn-tafseer-ibn-e-kaseer",       work:"Tafsir Ibn Kathir",         work_id:"ibn-kathir",    author:"Ibn Kathir",           fcode:"F0741", lang:"BN", tradition:"sunni-classical"},
  {id:"ar-tafsir-al-tabari",           work:"Tafsir al-Tabari",          work_id:"tabari",        author:"al-Tabari",            fcode:"F0345", lang:"AR", tradition:"sunni-classical"},
  {id:"ar-tafsir-al-jalalayn",         work:"Tafsir al-Jalalayn",        work_id:"jalalayn",      author:"Mahalli + Suyuti",     fcode:"F2017,F0344", lang:"AR", tradition:"sunni-classical"},
  {id:"en-al-jalalayn",                work:"Tafsir al-Jalalayn",        work_id:"jalalayn",      author:"Mahalli + Suyuti",     fcode:"F2017,F0344", lang:"EN", tradition:"sunni-classical"},
  {id:"ar-tafsir-al-qurtubi",          work:"Tafsir al-Qurtubi",         work_id:"qurtubi",       author:"al-Qurtubi",           fcode:"F0315", lang:"AR", tradition:"sunni-classical"},
  {id:"ar-tafsir-al-baghawi",          work:"Tafsir al-Baghawi",         work_id:"baghawi",       author:"al-Baghawi",           fcode:"F0213", lang:"AR", tradition:"sunni-classical"},
  {id:"ar-tafsir-muyassar",            work:"Tafsir al-Muyassar",        work_id:"muyassar",      author:"King Fahd Complex",    fcode:"",      lang:"AR", tradition:"sunni-modern"},
  {id:"ar-tafsir-al-wasit",            work:"Tafsir al-Wasit",           work_id:"wasit",         author:"Al-Azhar group",       fcode:"",      lang:"AR", tradition:"sunni-classical"},
  {id:"ar-tafsir-tanwir-al-miqbas",    work:"Tanwir al-Miqbas",          work_id:"tanwir-miqbas", author:"Ibn Abbas (attr.)",    fcode:"F0078", lang:"AR", tradition:"ibn-abbas"},
  {id:"en-tafsir-ibn-abbas",           work:"Tanwir al-Miqbas",          work_id:"tanwir-miqbas", author:"Ibn Abbas (attr.)",    fcode:"F0078", lang:"EN", tradition:"ibn-abbas"},
  {id:"ar-tafseer-al-saddi",           work:"Tafsir al-Sa'di",           work_id:"saadi",         author:"al-Sa'di",             fcode:"F2019", lang:"AR", tradition:"sunni-classical"},
  {id:"ru-tafseer-al-saddi",           work:"Tafsir al-Sa'di",           work_id:"saadi",         author:"al-Sa'di",             fcode:"F2019", lang:"RU", tradition:"sunni-classical"},
  {id:"en-tafsir-maarif-ul-quran",     work:"Ma'ariful Quran",           work_id:"maariful",      author:"Mufti Shafi Usmani",   fcode:"F2020", lang:"EN", tradition:"sunni-modern"},
  {id:"en-tazkirul-quran",             work:"Tazkirul Quran",            work_id:"tazkirul",      author:"Wahiduddin Khan",      fcode:"F1970", lang:"EN", tradition:"sunni-modern"},
  {id:"ur-tazkirul-quran",             work:"Tazkirul Quran",            work_id:"tazkirul",      author:"Wahiduddin Khan",      fcode:"F1970", lang:"UR", tradition:"sunni-modern"},
  {id:"en-tafsir-al-tustari",          work:"Tafsir al-Tustari",         work_id:"tustari",       author:"Sahl al-Tustari",      fcode:"F1231", lang:"EN", tradition:"sufi"},
  {id:"en-al-qushairi-tafsir",         work:"Lata'if al-Isharat",        work_id:"qushayri",      author:"al-Qushayri",          fcode:"F0316", lang:"EN", tradition:"sufi"},
  {id:"en-kashani-tafsir",             work:"Ta'wilat al-Qur'an",        work_id:"kashani",       author:"al-Kashani",           fcode:"F2027", lang:"EN", tradition:"sufi"},
  {id:"en-kashf-al-asrar-tafsir",      work:"Kashf al-Asrar",            work_id:"maybudi",       author:"al-Maybudi",           fcode:"F2026", lang:"EN", tradition:"sufi"},
  {id:"en-asbab-al-nuzul-by-al-wahidi",work:"Asbab al-Nuzul",            work_id:"wahidi",        author:"al-Wahidi",            fcode:"F2018", lang:"EN", tradition:"sunni-classical"},
  {id:"ur-tafsir-bayan-ul-quran",      work:"Bayan ul Quran",            work_id:"bayan-israr",   author:"Dr. Israr Ahmad",      fcode:"F2021", lang:"UR", tradition:"sunni-modern"},
  {id:"bn-tafsir-abu-bakr-zakaria",    work:"Tafsir Abu Bakr Zakaria",   work_id:"zakaria",       author:"Abu Bakr Zakaria",     fcode:"F2023", lang:"BN", tradition:"sunni-modern"},
  {id:"bn-tafsir-ahsanul-bayaan",      work:"Ahsanul Bayaan",            work_id:"ahsanul",       author:"Salahuddin Yusuf",     fcode:"F2024", lang:"BN", tradition:"sunni-modern"},
  {id:"bn-tafisr-fathul-majid",        work:"Fathul Majid",              work_id:"fathul",        author:"Aal al-Shaykh",        fcode:"F2022", lang:"BN", tradition:"sunni-modern"},
  {id:"kurd-tafsir-rebar",             work:"Tafsir Rebar",              work_id:"rebar",         author:"Mulla Rebar Kurdi",    fcode:"F2025", lang:"KU", tradition:"sunni-modern"}
]);
var DIVE_LANG_FULL = {AR:"Arabic", EN:"English", UR:"Urdu", BN:"Bengali", KU:"Kurdish", RU:"Russian"};
var DIVE_LANG_ORDER = ["EN","AR","UR","BN","KU","RU"];
var DIVE_TLANG_FILTER = "";     // "" = all, else one of AR/EN/UR/BN/KU/RU

// ── PREFERENCES WIZARD STATE ─────────────────────────────────────
var _STP_KEY = 'gold-ark-st-prefs';
var _stPrefs = null;
function _stPrefsLoad(){
  if(_stPrefs) return _stPrefs;
  try {
    var raw = localStorage.getItem(_STP_KEY);
    if(raw){ _stPrefs = JSON.parse(raw); return _stPrefs; }
  } catch(e){}
  _stPrefs = null;
  return null;
}
function _stPrefsSave(p){
  _stPrefs = p;
  try { localStorage.setItem(_STP_KEY, JSON.stringify(p)); } catch(e){}
}
function _stPrefsEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ═══════════════════════════════════════════════════════════
// SHARED translation registry cache + reusable rich picker UI.
// Used by both MY VIEW Step 2 (wizard) and the Translation
// filter pill dropdown so the two surfaces stay in sync.
// ═══════════════════════════════════════════════════════════
window._stTransRegCache = window._stTransRegCache || null;
window._stTransRegLoading = false;
function _stLoadTransRegistry(cb){
  if(window._stTransRegCache){ cb(window._stTransRegCache); return; }
  if(window._stTransRegLoading){ setTimeout(function(){ _stLoadTransRegistry(cb); }, 100); return; }
  window._stTransRegLoading = true;
  fetch(dataUrl('data/islamic/quran/translations/registry.json'))
    .then(function(r){ return r.ok ? r.json() : {translations:[], languages:{}}; })
    .then(function(j){ window._stTransRegCache = j; window._stTransRegLoading = false; cb(j); })
    .catch(function(){ window._stTransRegCache = {translations:[], languages:{}}; window._stTransRegLoading = false; cb(window._stTransRegCache); });
}

function _stRichTransEsc(s){
  return String(s == null ? '' : s).replace(/[&<>"]/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
  });
}

// Reusable rich translation picker — language-grouped, multi-select,
// script-filter pills, ROM badges. Drives both MY VIEW Step 2 and the
// Translation pill dropdown.
//   opts.getSel()  -> array of currently-selected slugs
//   opts.onChange(slugs) -> called with the new array on every change
function _stRenderRichTrans(el, opts){
  el.innerHTML = '<div style="color:#9aa3b2;font-size:14px;padding:14px">Loading translations…</div>';
  _stLoadTransRegistry(function(reg){
    var list = reg.translations || [];
    var langMeta = reg.languages || {};
    function langName(t){
      var code = t.lang_code || t.lang || '';
      if(langMeta[code] && langMeta[code].name) return langMeta[code].name;
      if(langMeta[code] && typeof langMeta[code] === 'string') return langMeta[code];
      var FALLBACK = {AA:'Afar',ACE:'Acehnese',AF:'Afrikaans',AM:'Amharic',AR:'Arabic',AS:'Assamese',AZ:'Azerbaijani',BER:'Berber',BG:'Bulgarian',BM:'Bambara',BN:'Bengali',BS:'Bosnian',CA:'Catalan',CS:'Czech',DA:'Danish',DAG:'Dagbani',DE:'German',DV:'Divehi',EN:'English',EO:'Esperanto',ES:'Spanish',FA:'Persian',FF:'Fula',FI:'Finnish',FIL:'Filipino',FR:'French',GU:'Gujarati',HA:'Hausa',HE:'Hebrew',HI:'Hindi',HR:'Croatian',HU:'Hungarian',ID:'Indonesian',IS:'Icelandic',IT:'Italian',JA:'Japanese',JV:'Javanese',KK:'Kazakh',KM:'Khmer',KN:'Kannada',KO:'Korean',KU:'Kurdish',KY:'Kyrgyz',LT:'Lithuanian',LV:'Latvian',MAL:'Malayalam',MK:'Macedonian',ML:'Malayalam',MR:'Marathi',MS:'Malay',NL:'Dutch',NO:'Norwegian',OR:'Odia',OM:'Oromo',PA:'Punjabi',PL:'Polish',PS:'Pashto',PT:'Portuguese',RO:'Romanian',RU:'Russian',SI:'Sinhala',SK:'Slovak',SO:'Somali',SQ:'Albanian',SR:'Serbian',SV:'Swedish',SW:'Swahili',TA:'Tamil',TE:'Telugu',TG:'Tajik',TH:'Thai',TK:'Turkmen',TR:'Turkish',UG:'Uyghur',UK:'Ukrainian',UR:'Urdu',UZ:'Uzbek',VI:'Vietnamese',YO:'Yoruba',ZH:'Chinese'};
      return FALLBACK[code] || code || 'Other';
    }
    var validList = list.filter(function(t){ return t.lang_code && t.slug; });
    var scriptFilter = (window._stpScriptFilter !== undefined) ? window._stpScriptFilter : 'all';
    var esc = _stRichTransEsc;
    // Build a slug→bool lookup for fast registry-membership check
    var _validSlugs = {};
    validList.forEach(function(t){ _validSlugs[t.slug] = true; });

    function render(){
      var sel = (opts.getSel ? opts.getSel() : []) || [];
      var picked = sel.length;
      var openLangs = {};
      el.querySelectorAll('details[data-lang]').forEach(function(d){ if(d.open) openLangs[d.getAttribute('data-lang')] = true; });

      var filtered = validList.filter(function(t){
        if(scriptFilter === 'all') return true;
        return (t.script || 'original') === scriptFilter;
      });
      var byLang = {};
      filtered.forEach(function(t){ var L = langName(t); (byLang[L]=byLang[L]||[]).push(t); });
      var langs = Object.keys(byLang).sort();

      var nOrig = validList.filter(function(t){ return (t.script||'original') === 'original'; }).length;
      var nRom  = validList.filter(function(t){ return t.script === 'romanised'; }).length;

      function fbtn(key, label, n, isActive){
        return '<button data-script="'+key+'" type="button" class="strt-script-btn" style="background:'+(isActive?'rgba(212,175,55,0.30)':'transparent')+';color:'+(isActive?'#c9a961':'#cfd2d6')+';border:1px solid '+(isActive?'#c9a961':'rgba(154,163,178,0.45)')+';border-radius:16px;padding:6px 12px;cursor:pointer;font-family:Lato,sans-serif;font-weight:600;font-size:12px">'+label+' <span style="color:#6b7384;font-weight:400">('+n+')</span></button>';
      }

      var hi = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:10px 12px;background:rgba(212,175,55,0.10);border:1px solid rgba(212,175,55,0.30);border-radius:6px;position:sticky;top:0;z-index:5">'
        + '<div style="color:#c9a961;font-weight:700;font-size:13px">Selected: '+picked+' <span style="color:#9aa3b2;font-weight:400">/ '+validList.length+'</span></div>'
        + '<button class="strt-clear" type="button" style="background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.5);border-radius:14px;padding:5px 12px;cursor:pointer;font-family:Lato,sans-serif;font-size:12px">✕ Clear All</button>'
        + '</div>';
      hi += '<div style="display:flex;gap:6px;margin-bottom:12px;align-items:center;flex-wrap:wrap">'
        + '<span style="color:#9aa3b2;margin-right:4px;font-size:12px">Script:</span>'
        + fbtn('all','All',validList.length, scriptFilter==='all')
        + fbtn('original','Original script',nOrig, scriptFilter==='original')
        + fbtn('romanised','Romanised',nRom, scriptFilter==='romanised')
        + '</div>';

      hi += '<div style="display:flex;flex-direction:column;gap:5px">';
      langs.forEach(function(L){
        var arr = byLang[L];
        var nSel = arr.filter(function(t){ return sel.indexOf(t.slug) !== -1; }).length;
        var hdrColor = nSel > 0 ? '#c9a961' : '#E5E7EB';
        var openAttr = openLangs[L] ? ' open' : '';
        hi += '<details data-lang="'+esc(L)+'"'+openAttr+' style="background:rgba(255,255,255,0.03);border-radius:5px;border:1px solid rgba(255,255,255,0.05)">';
        hi += '<summary style="cursor:pointer;color:'+hdrColor+';font-family:Cinzel,serif;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:10px 14px;list-style:revert;font-size:13px">'
            + esc(L)+' <span style="color:#6b7384;font-weight:400">· '+arr.length+'</span>'
            + (nSel>0?' <span style="color:#c9a961;font-weight:700">('+nSel+' picked)</span>':'')
            + '</summary>';
        hi += '<div style="padding:6px 14px 12px 18px;display:flex;flex-direction:column;gap:3px">';
        arr.forEach(function(t){
          var slug = t.slug; var checked = sel.indexOf(slug) !== -1;
          var label = t.translator || t.title || slug;
          var romBadge = (t.script === 'romanised') ? ' <span style="background:rgba(154,163,178,0.18);color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:8px;padding:1px 6px;font-size:10px;font-weight:600;margin-left:6px;letter-spacing:.05em">ROM</span>' : '';
          hi += '<label class="strt-row" style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:3px;cursor:pointer;line-height:1.35;font-size:13px">'
              + '<input type="checkbox" data-slug="'+esc(slug)+'" '+(checked?'checked':'')+' style="accent-color:#c9a961;flex:0 0 auto">'
              + '<span style="color:#E5E7EB">'+esc(label)+romBadge+'</span></label>';
        });
        hi += '</div></details>';
      });
      hi += '</div>';

      el.innerHTML = hi;
      el.querySelectorAll('.strt-row input').forEach(function(cb){
        cb.addEventListener('change', function(){
          var slug = cb.getAttribute('data-slug');
          var cur = ((opts.getSel ? opts.getSel() : []) || []).slice();
          var i = cur.indexOf(slug);
          if(cb.checked && i === -1) cur.push(slug);
          else if(!cb.checked && i !== -1) cur.splice(i,1);
          if(opts.onChange) opts.onChange(cur);
          render();
        });
      });
      el.querySelectorAll('.strt-script-btn').forEach(function(b){
        b.addEventListener('click', function(){ scriptFilter = b.getAttribute('data-script'); window._stpScriptFilter = scriptFilter; render(); });
      });
      var clr = el.querySelector('.strt-clear');
      if(clr) clr.addEventListener('click', function(){ if(opts.onChange) opts.onChange([]); render(); });
    }
    render();
  });
}

window._stOpenPrefs = function(opts){
  var existing = document.getElementById('st-prefs-overlay');
  if(existing){ existing.remove(); }
  // Working draft — start fresh from saved or defaults
  var draft = _stPrefsLoad() ? JSON.parse(JSON.stringify(_stPrefsLoad())) : {
    range: { mode:'whole', value:null },
    translations: [],
    morphology: true,
    dictionary: true,
    tafsirs: [],
    chips: { figures:true, events:true, concepts:true, hadiths:true, tafsirs:true }
  };
  if(!draft.chips) draft.chips = { figures:true, events:true, concepts:true, hadiths:true, tafsirs:true };
  if(!draft.range) draft.range = { mode:'whole', value:null };
  if(!draft.translations) draft.translations = [];
  if(!draft.tafsirs) draft.tafsirs = [];
  // Sync MY VIEW translation selection FROM live _stTrans so the wizard
  // reflects whatever the Translation pill currently has selected.
  try {
    if(typeof _stTrans !== 'undefined' && _stTrans){
      draft.translations = Object.keys(_stTrans).filter(function(k){ return _stTrans[k]; });
    }
  } catch(e){}

  var step = 1;
  var TOTAL_STEPS = 6;
  var _trCache = null;        // translation registry
  var _trCacheLoading = false;

  var ov = document.createElement('div');
  ov.id = 'st-prefs-overlay';
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px';
  var box = document.createElement('div');
  box.className = 'stp-wiz';
  box.style.cssText = 'background:#0e1420;border:1px solid rgba(212,175,55,0.55);border-radius:10px;max-width:720px;width:62vw;max-height:90vh;display:flex;flex-direction:column;font-family:Lato,sans-serif;color:#E5E7EB';
  ov.appendChild(box);
  document.body.appendChild(ov);

  function close(){ ov.remove(); }
  ov.addEventListener('click', function(e){ if(e.target === ov) close(); });

  var STEP_TITLES = [
    'Reading Range',
    'Translations',
    'Morphology (Word-by-Word)',
    'Dictionary (Lane\'s Lexicon)',
    'Tafsir Selection',
    'Cross-reference Chips'
  ];

  function loadTranslations(cb){
    if(_trCache){ cb(_trCache); return; }
    if(_trCacheLoading) { setTimeout(function(){ loadTranslations(cb); }, 100); return; }
    _trCacheLoading = true;
    fetch(dataUrl('data/islamic/quran/translations/registry.json'))
      .then(function(r){ return r.ok?r.json():{translations:[],languages:{}}; })
      .then(function(j){ _trCache = j; _trCacheLoading=false; cb(j); })
      .catch(function(){ _trCache = {translations:[],languages:{}}; _trCacheLoading=false; cb(_trCache); });
  }

  function render(){
    var hd = '<div style="padding:18px 22px;border-bottom:1px solid rgba(212,175,55,0.35);display:flex;align-items:center;justify-content:space-between">'
      + '<div><div style="font-family:Cinzel,serif;font-size:11px;letter-spacing:.14em;color:rgba(212,175,55,0.9);text-transform:uppercase">My View — Step '+step+' of '+TOTAL_STEPS+'</div>'
      + '<div style="font-size:18px;color:#E5E7EB;margin-top:4px;font-weight:600">'+STEP_TITLES[step-1]+'</div></div>'
      + '<button id="stp-close" style="background:none;border:none;color:#888;font-size:26px;cursor:pointer;line-height:1;padding:0 6px">×</button>'
      + '</div>';

    var body = '<div id="stp-body" style="padding:20px 22px;overflow-y:auto;flex:1;min-height:200px"></div>';

    var ft = '<div style="padding:14px 22px;border-top:1px solid rgba(212,175,55,0.35);display:flex;align-items:center;justify-content:space-between;gap:10px">'
      + '<button id="stp-back" style="background:rgba(255,255,255,0.06);color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:18px;padding:8px 18px;font-size:12px;cursor:pointer;font-family:Lato,sans-serif">◀ Back</button>'
      + '<button id="stp-update" type="button" style="background:rgba(212,175,55,0.28);color:#fff;border:1px solid #c9a961;border-radius:18px;padding:8px 22px;font-size:12px;cursor:pointer;font-family:Lato,sans-serif;font-weight:700;letter-spacing:.05em">⟳ Update Now</button>'
      + '<div style="display:flex;gap:10px">'
      + (step < TOTAL_STEPS ? '<button id="stp-next" style="background:rgba(212,175,55,0.18);color:#c9a961;border:1px solid rgba(212,175,55,0.7);border-radius:18px;padding:8px 22px;font-size:12px;cursor:pointer;font-family:Lato,sans-serif;font-weight:600">Next ▶</button>' : '<button id="stp-save" style="background:rgba(212,175,55,0.28);color:#fff;border:1px solid #c9a961;border-radius:18px;padding:8px 24px;font-size:12px;cursor:pointer;font-family:Lato,sans-serif;font-weight:700;letter-spacing:.05em">Save & Apply ✓</button>')
      + '</div></div>';

    box.innerHTML = hd + body + ft;
    document.getElementById('stp-close').addEventListener('click', close);
    var backBtn = document.getElementById('stp-back');
    backBtn.disabled = (step === 1);
    backBtn.style.opacity = (step === 1) ? '.4' : '1';
    backBtn.addEventListener('click', function(){ if(step>1){ step--; render(); }});
    var nx = document.getElementById('stp-next');
    if(nx) nx.addEventListener('click', function(){ if(step<TOTAL_STEPS){ step++; render(); }});
    function _stpDoSave(){
      _stPrefsSave(draft);
      console.log('[STP] saved prefs', draft);
      close();
      try{
        var rng = draft.range || {};
        if(rng.mode === 'surah' && rng.value && typeof _stSelectSurah === 'function') _stSelectSurah(rng.value);
        else if(rng.mode === 'juz' && rng.value && typeof _stSelectJuz === 'function') _stSelectJuz(rng.value);
        else if(rng.mode === 'manzil' && rng.value && typeof _stSelectManzil === 'function') _stSelectManzil(rng.value);
        else if(rng.mode === 'hizb' && rng.value && typeof _stSelectHizb === 'function') _stSelectHizb(rng.value);
      } catch(e){ console.warn('[STP] range jump failed', e); }
      window._stMyViewOn = true;
      _stRefreshMyViewBtn();
      window._stApplyMyView();
    }
    var upd = document.getElementById('stp-update');
    if(upd) upd.addEventListener('click', _stpDoSave);
    var sv = document.getElementById('stp-save');
    if(sv) sv.addEventListener('click', function(){
      _stpDoSave();
    });

    var bodyEl = document.getElementById('stp-body');
    if(step === 1) renderRange(bodyEl);
    else if(step === 2) renderTranslations(bodyEl);
    else if(step === 3) renderMorphologyStep(bodyEl);
    else if(step === 4) renderToggle(bodyEl, 'dictionary', 'Enable Lane\'s Lexicon dictionary lookups?', 'Click any root in WBW to view its Arabic dictionary entry.');
    else if(step === 5) renderTafsirs(bodyEl);
    else if(step === 6) renderChips(bodyEl);
  }

  function renderRange(el){
    var modes = [
      {k:'whole', label:'Whole Quran', sub:'114 surahs, 6,236 verses', max:0},
      {k:'surah', label:'Single Surah', sub:'1–114', max:114},
      {k:'juz',   label:'Juz (Para)',  sub:'1–30',  max:30},
      {k:'manzil',label:'Manzil',      sub:'1–7',   max:7},
      {k:'hizb',  label:'Hizb',        sub:'1–60',  max:60}
    ];
    var h = '<div style="display:flex;flex-direction:column;gap:8px">';
    modes.forEach(function(m){
      var active = draft.range.mode === m.k;
      h += '<label class="stp-row" data-mode="'+m.k+'" style="display:flex;gap:12px;align-items:center;padding:12px 14px;border:1px solid '+(active?'rgba(212,175,55,0.7)':'rgba(255,255,255,0.08)')+';border-radius:6px;cursor:pointer;background:'+(active?'rgba(212,175,55,0.10)':'transparent')+'">'
        + '<div style="width:16px;height:16px;border:2px solid '+(active?'#c9a961':'rgba(255,255,255,0.3)')+';border-radius:50%;display:flex;align-items:center;justify-content:center">'+(active?'<div style="width:7px;height:7px;background:#c9a961;border-radius:50%"></div>':'')+'</div>'
        + '<div style="flex:1"><div style="color:#E5E7EB;font-weight:600">'+m.label+'</div><div style="color:#6b7384;font-size:11px;margin-top:2px">'+m.sub+'</div></div>';
      if(m.max && active){
        h += '<div class="stp-num-wrap" style="display:inline-flex;align-items:center;gap:6px;margin-left:auto">'
          + '<button type="button" class="stp-num-minus" data-mode="'+m.k+'" style="width:40px;height:40px;background:rgba(212,175,55,0.12);color:#c9a961;border:1px solid rgba(212,175,55,0.6);border-radius:6px;font-size:22px;font-weight:700;cursor:pointer;font-family:Lato,sans-serif;line-height:1">−</button>'
          + '<input type="text" inputmode="numeric" pattern="[0-9]*" value="'+(draft.range.value||1)+'" class="stp-num" data-max="'+m.max+'" style="width:80px;height:40px;padding:0;background:#0e1420;border:1px solid rgba(212,175,55,0.6);border-radius:6px;color:#c9a961;font-size:20px;font-weight:700;text-align:center;font-family:Lato,sans-serif">'
          + '<button type="button" class="stp-num-plus" data-mode="'+m.k+'" style="width:40px;height:40px;background:rgba(212,175,55,0.12);color:#c9a961;border:1px solid rgba(212,175,55,0.6);border-radius:6px;font-size:22px;font-weight:700;cursor:pointer;font-family:Lato,sans-serif;line-height:1">+</button>'
          + '</div>';
      }
      h += '</label>';
    });
    h += '</div>';
    el.innerHTML = h;
    el.querySelectorAll('.stp-row').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.classList.contains('stp-num')) return;
        var m = row.getAttribute('data-mode');
        draft.range.mode = m;
        if(m === 'whole') draft.range.value = null;
        else if(!draft.range.value) draft.range.value = 1;
        render();
      });
    });
    var nm = el.querySelector('.stp-num');
    if(nm){
      nm.addEventListener('input', function(){
        var max = parseInt(nm.getAttribute('data-max'),10) || 1;
        var v = parseInt(nm.value,10) || 1;
        if(v < 1) v = 1; if(v > max) v = max;
        draft.range.value = v;
      });
      nm.addEventListener('blur', function(){
        var max = parseInt(nm.getAttribute('data-max'),10) || 1;
        var v = parseInt(nm.value,10) || 1;
        if(v < 1) v = 1; if(v > max) v = max;
        nm.value = v;
        draft.range.value = v;
      });
    }
    var minus = el.querySelector('.stp-num-minus');
    if(minus) minus.addEventListener('click', function(){
      var max = parseInt(nm.getAttribute('data-max'),10) || 1;
      var v = (parseInt(nm.value,10) || 1) - 1;
      if(v < 1) v = 1;
      nm.value = v; draft.range.value = v;
    });
    var plus = el.querySelector('.stp-num-plus');
    if(plus) plus.addEventListener('click', function(){
      var max = parseInt(nm.getAttribute('data-max'),10) || 1;
      var v = (parseInt(nm.value,10) || 1) + 1;
      if(v > max) v = max;
      nm.value = v; draft.range.value = v;
    });
  }

  function renderTranslations(el){
    // Delegate to the shared rich picker; write through to _stTrans so
    // the Translation pill dropdown stays in sync (no save-on-apply gap).
    _stRenderRichTrans(el, {
      getSel: function(){ return draft.translations.slice(); },
      onChange: function(slugs){
        draft.translations = slugs.slice();
        console.log('[STP] step2 translations changed — count=' + slugs.length, slugs);
        try {
          if(typeof _stTrans !== 'undefined' && _stTrans){
            Object.keys(_stTrans).forEach(function(k){ delete _stTrans[k]; });
            slugs.forEach(function(s){
              _stTrans[s] = true;
              if(typeof _ST_EMBED_MAP !== 'undefined' && !_ST_EMBED_MAP[s]
                  && typeof _stLoadFileTrans === 'function' && typeof _stSurah !== 'undefined'){
                try{ _stLoadFileTrans(s, _stSurah); }catch(e){}
              }
            });
          }
          if(typeof _stPersistTransMulti === 'function') _stPersistTransMulti();
          // Live-save to prefs so step 2 selections survive close-without-save and re-open
          try { if(typeof _stPrefsSave === 'function') _stPrefsSave(draft); } catch(e){}
          if(typeof _stRenderSurah === 'function') _stRenderSurah();
          if(typeof _stUpdateTransLabel === 'function') _stUpdateTransLabel();
        } catch(e){}
      }
    });
    return;
    // (legacy body retained below as dead code so prior comments survive a future revert)
    el.innerHTML = '<div style="color:#9aa3b2;font-size:16px">Loading translations…</div>';
    loadTranslations(function(reg){
      var list = reg.translations || [];
      var langMeta = reg.languages || {};
      function langName(t){
        var code = t.lang_code || t.lang || '';
        if(langMeta[code] && langMeta[code].name) return langMeta[code].name;
        if(langMeta[code] && typeof langMeta[code] === 'string') return langMeta[code];
        var FALLBACK = {AA:'Afar',ACE:'Acehnese',AF:'Afrikaans',AM:'Amharic',AR:'Arabic',AS:'Assamese',AZ:'Azerbaijani',BER:'Berber',BG:'Bulgarian',BM:'Bambara',BN:'Bengali',BS:'Bosnian',CA:'Catalan',CS:'Czech',DA:'Danish',DAG:'Dagbani',DE:'German',DV:'Divehi',EN:'English',EO:'Esperanto',ES:'Spanish',FA:'Persian',FF:'Fula',FI:'Finnish',FIL:'Filipino',FR:'French',GU:'Gujarati',HA:'Hausa',HE:'Hebrew',HI:'Hindi',HR:'Croatian',HU:'Hungarian',ID:'Indonesian',IS:'Icelandic',IT:'Italian',JA:'Japanese',JV:'Javanese',KK:'Kazakh',KM:'Khmer',KN:'Kannada',KO:'Korean',KU:'Kurdish',KY:'Kyrgyz',LT:'Lithuanian',LV:'Latvian',MAL:'Malayalam',MK:'Macedonian',ML:'Malayalam',MR:'Marathi',MS:'Malay',NL:'Dutch',NO:'Norwegian',OR:'Odia',OM:'Oromo',PA:'Punjabi',PL:'Polish',PS:'Pashto',PT:'Portuguese',RO:'Romanian',RU:'Russian',SI:'Sinhala',SK:'Slovak',SO:'Somali',SQ:'Albanian',SR:'Serbian',SV:'Swedish',SW:'Swahili',TA:'Tamil',TE:'Telugu',TG:'Tajik',TH:'Thai',TK:'Turkmen',TR:'Turkish',UG:'Uyghur',UK:'Ukrainian',UR:'Urdu',UZ:'Uzbek',VI:'Vietnamese',YO:'Yoruba',ZH:'Chinese'};
        return FALLBACK[code] || code || 'Other';
      }
      var validList = list.filter(function(t){ return t.lang_code && t.slug; });
      // script filter state — local closure
      var scriptFilter = (window._stpScriptFilter !== undefined) ? window._stpScriptFilter : 'all';

      function _stpRenderTr(){
        var picked = draft.translations.length;
        var openLangs = {};
        el.querySelectorAll('details[data-lang]').forEach(function(d){ if(d.open) openLangs[d.getAttribute('data-lang')] = true; });

        // Apply script filter
        var filtered = validList.filter(function(t){
          if(scriptFilter === 'all') return true;
          return (t.script || 'original') === scriptFilter;
        });

        var byLang = {};
        filtered.forEach(function(t){ var L = langName(t); (byLang[L]=byLang[L]||[]).push(t); });
        var langs = Object.keys(byLang).sort();

        // Counts for filter buttons
        var nOrig = validList.filter(function(t){ return (t.script||'original') === 'original'; }).length;
        var nRom  = validList.filter(function(t){ return t.script === 'romanised'; }).length;

        function fbtn(key, label, n, isActive){
          return '<button data-script="'+key+'" type="button" class="stp-script-btn" style="background:'+(isActive?'rgba(212,175,55,0.30)':'transparent')+';color:'+(isActive?'#c9a961':'#cfd2d6')+';border:1px solid '+(isActive?'#c9a961':'rgba(154,163,178,0.45)')+';border-radius:16px;padding:7px 16px;cursor:pointer;font-family:Lato,sans-serif;font-weight:600">'+label+' <span style="color:#6b7384;font-weight:400">('+n+')</span></button>';
        }

        var hi = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:12px 16px;background:rgba(212,175,55,0.10);border:1px solid rgba(212,175,55,0.30);border-radius:6px;position:sticky;top:0;z-index:5">'
          + '<div style="color:#c9a961;font-weight:700">Selected: '+picked+' <span style="color:#9aa3b2;font-weight:400">  /  '+validList.length+'</span></div>'
          + '<button id="stp-tr-clear" type="button" style="background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.5);border-radius:16px;padding:7px 16px;cursor:pointer;font-family:Lato,sans-serif">✕ Clear All</button>'
          + '</div>';

        hi += '<div style="display:flex;gap:8px;margin-bottom:14px;align-items:center">'
          + '<span style="color:#9aa3b2;margin-right:4px">Script:</span>'
          + fbtn('all','All',validList.length, scriptFilter==='all')
          + fbtn('original','Original script',nOrig, scriptFilter==='original')
          + fbtn('romanised','Romanised',nRom, scriptFilter==='romanised')
          + '</div>';

        hi += '<div style="display:flex;flex-direction:column;gap:6px">';
        langs.forEach(function(L){
          var arr = byLang[L];
          var nSel = arr.filter(function(t){ return draft.translations.indexOf(t.slug) !== -1; }).length;
          var hdrColor = nSel > 0 ? '#c9a961' : '#E5E7EB';
          var openAttr = openLangs[L] ? ' open' : '';
          hi += '<details data-lang="'+_stPrefsEsc(L)+'"'+openAttr+' style="background:rgba(255,255,255,0.03);border-radius:5px;border:1px solid rgba(255,255,255,0.05)">';
          hi += '<summary style="cursor:pointer;color:'+hdrColor+';font-family:Cinzel,serif;font-weight:600;letter-spacing:.05em;text-transform:uppercase;padding:12px 16px;list-style:revert">'
              + _stPrefsEsc(L)+' <span style="color:#6b7384;font-weight:400">· '+arr.length+'</span>'
              + (nSel>0?' <span style="color:#c9a961;font-weight:700">('+nSel+' picked)</span>':'')
              + '</summary>';
          hi += '<div style="padding:6px 14px 14px 18px;display:flex;flex-direction:column;gap:4px">';
          arr.forEach(function(t){
            var slug = t.slug; var checked = draft.translations.indexOf(slug) !== -1;
            var label = t.translator || t.title || slug;
            var romBadge = (t.script === 'romanised') ? ' <span style="background:rgba(154,163,178,0.18);color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:8px;padding:1px 7px;font-size:11px;font-weight:600;margin-left:6px;letter-spacing:.05em">ROM</span>' : '';
            hi += '<label class="stp-tr" style="display:flex;align-items:center;gap:10px;padding:7px 8px;border-radius:3px;cursor:pointer;line-height:1.4">'
                + '<input type="checkbox" data-slug="'+_stPrefsEsc(slug)+'" '+(checked?'checked':'')+' style="accent-color:#c9a961;flex:0 0 auto">'
                + '<span style="color:#E5E7EB">'+_stPrefsEsc(label)+romBadge+'</span></label>';
          });
          hi += '</div></details>';
        });
        hi += '</div>';

        el.innerHTML = hi;
        el.querySelectorAll('.stp-tr input').forEach(function(cb){
          cb.addEventListener('change', function(){
            var slug = cb.getAttribute('data-slug');
            var idx = draft.translations.indexOf(slug);
            if(cb.checked && idx === -1) draft.translations.push(slug);
            else if(!cb.checked && idx !== -1) draft.translations.splice(idx,1);
            _stpRenderTr();
          });
        });
        el.querySelectorAll('.stp-script-btn').forEach(function(b){
          b.addEventListener('click', function(){ scriptFilter = b.getAttribute('data-script'); window._stpScriptFilter = scriptFilter; _stpRenderTr(); });
        });
        var clr = document.getElementById('stp-tr-clear');
        if(clr) clr.addEventListener('click', function(){ draft.translations = []; _stpRenderTr(); });
      }
      _stpRenderTr();
    });
  }

  function renderMorphologyStep(el){
    var on = !!draft.morphology;
    var langs = window._stWbwLangs || ['en'];
    var names = window._stWbwLangNames || {en:'English'};
    var curLang = (typeof _stWbwActiveLang === 'function') ? _stWbwActiveLang() : 'en';
    var langOpts = langs.map(function(c){
      return '<option value="'+c+'"'+(c===curLang?' selected':'')+'>'+(names[c]||c)+'</option>';
    }).join('');
    el.innerHTML =
      '<div style="display:flex;flex-direction:column;gap:14px">'
      + '<div style="font-size:14px;color:#E5E7EB">Show word-by-word morphology + grammar tags under each verse?</div>'
      + '<div style="font-size:12px;color:#9aa3b2">Recommended for advanced study. When ON, choose the WBW translation language below.</div>'
      + '<div style="display:flex;gap:14px;margin-top:6px">'
      + '<button class="stp-tg" data-v="1" style="flex:1;padding:14px;border-radius:6px;border:1px solid '+(on?'#c9a961':'rgba(255,255,255,0.15)')+';background:'+(on?'rgba(212,175,55,0.15)':'transparent')+';color:'+(on?'#c9a961':'#9aa3b2')+';cursor:pointer;font-family:Lato,sans-serif;font-size:14px;font-weight:'+(on?'700':'500')+'">✓ ON</button>'
      + '<button class="stp-tg" data-v="0" style="flex:1;padding:14px;border-radius:6px;border:1px solid '+(!on?'#c9a961':'rgba(255,255,255,0.15)')+';background:'+(!on?'rgba(212,175,55,0.15)':'transparent')+';color:'+(!on?'#c9a961':'#9aa3b2')+';cursor:pointer;font-family:Lato,sans-serif;font-size:14px;font-weight:'+(!on?'700':'500')+'">× OFF</button>'
      + '</div>'
      + '<div id="stp-wbw-lang-wrap" style="display:'+(on?'flex':'none')+';flex-direction:column;gap:8px;margin-top:6px;padding:14px;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.25);border-radius:6px">'
      + '<div style="color:#c9a961;font-family:Cinzel,serif;font-size:11px;letter-spacing:.08em;text-transform:uppercase;font-weight:700">WBW translation language</div>'
      + '<select id="stp-wbw-lang" style="padding:10px 12px;background:#0e1420;color:#E5E7EB;border:1px solid rgba(212,175,55,0.5);border-radius:5px;font-family:Lato,sans-serif;font-size:14px;cursor:pointer">'
      + langOpts
      + '</select>'
      + '<div style="color:#6b7384;font-size:11px;line-height:1.4">If a language is missing for a surah it falls back to English silently.</div>'
      + '</div>'
      + '</div>';
    el.querySelectorAll('.stp-tg').forEach(function(b){
      b.addEventListener('click', function(){
        draft.morphology = (b.getAttribute('data-v') === '1');
        render();
      });
    });
    var sel = document.getElementById('stp-wbw-lang');
    if(sel){
      sel.addEventListener('change', function(){
        var v = sel.value;
        try { localStorage.setItem('gold-ark-st-wbw-lang', v); } catch(e){}
        // Pre-warm the cache for current surah so the first hover is instant.
        try { if(typeof _stLoadWbw === 'function' && typeof _stSurah !== 'undefined') _stLoadWbw(_stSurah, v); } catch(e){}
      });
    }
  }

  function renderToggle(el, key, prompt, hint){
    var on = !!draft[key];
    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px">'
      + '<div style="font-size:14px;color:#E5E7EB">'+prompt+'</div>'
      + '<div style="font-size:12px;color:#9aa3b2">'+hint+'</div>'
      + '<div style="display:flex;gap:14px;margin-top:6px">'
      + '<button class="stp-tg" data-v="1" style="flex:1;padding:14px;border-radius:6px;border:1px solid '+(on?'#c9a961':'rgba(255,255,255,0.15)')+';background:'+(on?'rgba(212,175,55,0.15)':'transparent')+';color:'+(on?'#c9a961':'#9aa3b2')+';cursor:pointer;font-family:Lato,sans-serif;font-size:14px;font-weight:'+(on?'700':'500')+'">✓ ON</button>'
      + '<button class="stp-tg" data-v="0" style="flex:1;padding:14px;border-radius:6px;border:1px solid '+(!on?'#c9a961':'rgba(255,255,255,0.15)')+';background:'+(!on?'rgba(212,175,55,0.15)':'transparent')+';color:'+(!on?'#c9a961':'#9aa3b2')+';cursor:pointer;font-family:Lato,sans-serif;font-size:14px;font-weight:'+(!on?'700':'500')+'">× OFF</button>'
      + '</div></div>';
    el.querySelectorAll('.stp-tg').forEach(function(b){
      b.addEventListener('click', function(){
        draft[key] = (b.getAttribute('data-v') === '1');
        render();
      });
    });
  }

  function renderTafsirs(el){
    var reg = window._stTafsirRegistry || [];
    var byLang = {};
    var LANG_FULL = {AR:'Arabic',EN:'English',UR:'Urdu',BN:'Bengali',KU:'Kurdish',RU:'Russian'};
    reg.forEach(function(t){ var L = LANG_FULL[t.lang] || t.lang || 'Other'; (byLang[L] = byLang[L] || []).push(t); });
    var langs = Object.keys(byLang).sort();
    function _stpRenderTf(){
      var picked = draft.tafsirs.length;
      var openLangs = {};
      el.querySelectorAll('details[data-lang]').forEach(function(d){ if(d.open) openLangs[d.getAttribute('data-lang')] = true; });
      var h = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;padding:8px 10px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.25);border-radius:5px">'
        + '<div style="color:#c9a961;font-size:12px;font-weight:600">Selected: '+picked+'</div>'
        + '<button id="stp-tf-clear" type="button" style="background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:14px;padding:4px 12px;font-size:11px;cursor:pointer;font-family:Lato,sans-serif">✕ Clear All</button>'
        + '</div>';
      h += '<div style="margin-bottom:8px;color:#9aa3b2;font-size:11px">'+reg.length+' editions available · grouped by language.</div>';
      h += '<div style="display:flex;flex-direction:column;gap:4px">';
      langs.forEach(function(L){
        var arr = byLang[L];
        var nSel = arr.filter(function(t){ return draft.tafsirs.indexOf(t.id) !== -1; }).length;
        var hdrColor = nSel > 0 ? '#c9a961' : '#9aa3b2';
        var isOpen = (openLangs[L] !== undefined) ? openLangs[L] : true;
        var openAttr = isOpen ? ' open' : '';
        h += '<details data-lang="'+_stPrefsEsc(L)+'"'+openAttr+'><summary style="cursor:pointer;color:'+hdrColor+';font-family:Cinzel,serif;font-size:14px;letter-spacing:.08em;text-transform:uppercase;padding:8px 12px;border-radius:4px;background:rgba(255,255,255,0.04)">'+_stPrefsEsc(L)+' · <span style="color:#6b7384;font-weight:400">'+arr.length+'</span>'+(nSel>0?' <span style="color:#c9a961;font-weight:700">('+nSel+' picked)</span>':'')+'</summary>';
        h += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:4px 14px;padding:8px 0 10px 14px">';
        arr.forEach(function(t){
          var checked = draft.tafsirs.indexOf(t.id) !== -1;
          h += '<label class="stp-tf" style="display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:3px;cursor:pointer;font-size:14px;line-height:1.35">'
            + '<input type="checkbox" data-id="'+_stPrefsEsc(t.id)+'" '+(checked?'checked':'')+' style="accent-color:#c9a961">'
            + '<span style="color:#E5E7EB">'+_stPrefsEsc(t.name||t.id)+'</span></label>';
        });
        h += '</div></details>';
      });
      h += '</div>';
      el.innerHTML = h;
      el.querySelectorAll('.stp-tf input').forEach(function(cb){
        cb.addEventListener('change', function(){
          var id = cb.getAttribute('data-id');
          var idx = draft.tafsirs.indexOf(id);
          if(cb.checked && idx === -1) draft.tafsirs.push(id);
          else if(!cb.checked && idx !== -1) draft.tafsirs.splice(idx,1);
          _stpRenderTf();
        });
      });
      var clr = document.getElementById('stp-tf-clear');
      if(clr) clr.addEventListener('click', function(){ draft.tafsirs = []; _stpRenderTf(); });
    }
    _stpRenderTf();
  }

  function renderChips(el){
    var types = [
      {k:'figures',  label:'Figures',  color:'#c9a961', desc:'People mentioned in/connected to the verse'},
      {k:'events',   label:'Events',   color:'#e67e22', desc:'Historical events linked to the verse'},
      {k:'concepts', label:'Concepts', color:'#78c8b4', desc:'Theological/philosophical concepts in the verse'},
      {k:'hadiths',  label:'Hadiths',  color:'#5dccc4', desc:'Hadith narrations referencing the verse'},
      {k:'tafsirs',  label:'Tafsirs',  color:'#c084fc', desc:'Tafsir entries that comment on the verse'}
    ];
    var h = '<div style="margin-bottom:10px;color:#9aa3b2;font-size:12px">Choose which cross-reference chips appear in the LINKS column next to each verse.</div>';
    h += '<div style="display:flex;flex-direction:column;gap:8px">';
    types.forEach(function(ct){
      var on = !!draft.chips[ct.k];
      h += '<label class="stp-cp" data-k="'+ct.k+'" style="display:flex;gap:12px;align-items:center;padding:11px 14px;border:1px solid '+(on?ct.color:'rgba(255,255,255,0.08)')+';border-radius:6px;cursor:pointer;background:'+(on?ct.color+'1a':'transparent')+'">'
        + '<input type="checkbox" '+(on?'checked':'')+' style="accent-color:'+ct.color+'">'
        + '<div style="flex:1"><div style="color:'+ct.color+';font-weight:600">'+ct.label+'</div><div style="color:#6b7384;font-size:11px;margin-top:2px">'+ct.desc+'</div></div></label>';
    });
    h += '</div>';
    el.innerHTML = h;
    el.querySelectorAll('.stp-cp').forEach(function(row){
      row.addEventListener('click', function(e){
        if(e.target.tagName === 'INPUT'){
          draft.chips[row.getAttribute('data-k')] = e.target.checked;
        } else {
          var cb = row.querySelector('input');
          cb.checked = !cb.checked;
          draft.chips[row.getAttribute('data-k')] = cb.checked;
        }
        render();
      });
    });
  }

  render();
};
// ── MY VIEW STATE + APPLY LAYER ──────────────────────────────
window._stMyViewOn = false;
window._stMyViewFontScale = 1.0; // Multiplier — applied via CSS var to all slot text
function _stMyViewSetScale(s){
  if(s < 0.7) s = 0.7;
  if(s > 2.2) s = 2.2;
  window._stMyViewFontScale = s;
  document.documentElement.style.setProperty('--st-mv-scale', s);
  var lbl = document.getElementById('mv-bs-scale-lbl');
  if(lbl) lbl.textContent = Math.round(s * 100) + '%';
  try { localStorage.setItem('gold-ark-st-mv-scale', String(s)); } catch(e){}
}
function _stMyViewLoadScale(){
  try {
    var v = parseFloat(localStorage.getItem('gold-ark-st-mv-scale'));
    if(v && v > 0.5 && v < 3) _stMyViewSetScale(v);
    else _stMyViewSetScale(1.0);
  } catch(e){ _stMyViewSetScale(1.0); }
}

function _stRefreshMyViewBtn(){
  var btn = document.querySelector('.st-myview-btn');
  if(!btn) return;
  var hasPrefs = !!_stPrefsLoad();
  if(window._stMyViewOn){
    btn.textContent = 'MY VIEW: ON';
    btn.classList.add('zb-active');
    btn.style.background = 'rgba(212,175,55,0.22)';
    btn.style.color = '#c9a961';
    btn.style.borderColor = '#c9a961';
  } else {
    btn.textContent = hasPrefs ? 'MY VIEW: OFF' : 'MY VIEW';
    btn.classList.remove('zb-active');
    btn.style.background = '';
    btn.style.color = '';
    btn.style.borderColor = '';
  }
}
window._stRefreshMyViewBtn = _stRefreshMyViewBtn;

window._stApplyPrefs = function(){
  // Hook for wizard save — flips body class, triggers render
  if(window._stMyViewOn) window._stApplyMyView();
};

// Toggle handler — entry point from button click
window._stMyViewToggle = function(){
  var prefs = _stPrefsLoad();
  if(!prefs){
    // No prefs yet → open wizard
    window._stOpenPrefs();
    return;
  }
  window._stMyViewOn = !window._stMyViewOn;
  _stRefreshMyViewBtn();
  if(window._stMyViewOn){
    window._stApplyMyView();
  } else {
    window._stClearMyView();
  }
};

// Render-loop driver — adds body class, triggers re-render of START.
window._stApplyMyView = function(){
  document.body.classList.add('st-myview-active');
  // Apply prefs.translations to _stTrans system
  var prefs = _stPrefsLoad();
  if(prefs && prefs.translations && prefs.translations.length){
    // Save the previous _stTrans state
    if(typeof _stTrans !== 'undefined' && !window._stTransSavedBeforeMyView){
      window._stTransSavedBeforeMyView = JSON.parse(JSON.stringify(_stTrans));
    }
    // Wipe and apply ours
    if(typeof _stTrans !== 'undefined'){
      Object.keys(_stTrans).forEach(function(k){ delete _stTrans[k]; });
      prefs.translations.forEach(function(slug){
        _stTrans[slug] = true;
        if(typeof _stLoadFileTrans === 'function' && typeof _ST_EMBED_MAP !== 'undefined' && !_ST_EMBED_MAP[slug] && typeof _stSurah !== 'undefined'){
          try{ _stLoadFileTrans(slug, _stSurah); }catch(e){}
        }
      });
    }
  }
  // Inject book-mode shell strip
  _stMyViewBuildBookShell();
  // Force start to re-render so verses pick up new layout
  if(typeof _stRenderSurah === 'function') _stRenderSurah();
  // Inject inline content under each verse (delayed so render finishes)
  setTimeout(_stMyViewInjectInline, 350);
  setTimeout(_stMyViewInjectInline, 800); // second pass for late translations
};

window._stClearMyView = function(){
  document.body.classList.remove('st-myview-active');
  // Reset font scale on root
  document.documentElement.style.removeProperty('--st-mv-scale');
  // Strip injected MY VIEW slots
  document.querySelectorAll('.st-mv-slot').forEach(function(el){ el.remove(); });
  // Strip book shell
  var bs = document.getElementById('st-mv-bookshell');
  if(bs) bs.remove();
  // Restore prior _stTrans state
  if(window._stTransSavedBeforeMyView && typeof _stTrans !== 'undefined'){
    Object.keys(_stTrans).forEach(function(k){ delete _stTrans[k]; });
    var saved = window._stTransSavedBeforeMyView;
    Object.keys(saved).forEach(function(k){ _stTrans[k] = saved[k]; });
    window._stTransSavedBeforeMyView = null;
  }
  if(typeof _stRenderSurah === 'function') _stRenderSurah();
};

// Build slim MY VIEW shell strip — single row floating above body.
function _stMyViewBuildBookShell(){
  var existing = document.getElementById('st-mv-bookshell');
  if(existing) existing.remove();
  var strip = document.createElement('div');
  strip.id = 'st-mv-bookshell';
  var _zaEl = document.querySelector('.zone-a');
  var _zaBottom = _zaEl ? Math.round(_zaEl.getBoundingClientRect().bottom) : 60;
  strip.style.cssText = 'position:fixed;top:' + _zaBottom + 'px;left:0;right:0;height:46px;background:#0e1420;border-bottom:1px solid rgba(212,175,55,0.4);z-index:50;display:flex;align-items:center;gap:14px;padding:0 22px;font-family:Lato,sans-serif';
  strip.innerHTML = ''
    + '<button id="mv-bs-toggle" style="background:rgba(212,175,55,0.22);color:#c9a961;border:1px solid #c9a961;border-radius:18px;padding:6px 14px;font-size:11px;cursor:pointer;font-weight:700;letter-spacing:.05em;font-family:Lato,sans-serif">MY VIEW: ON</button>'
    + '<button id="mv-bs-edit" style="background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.45);border-radius:50%;width:30px;height:30px;font-size:13px;cursor:pointer;padding:0;line-height:1" title="Edit My View">✎</button>'
    + '<button id="mv-bs-cancel" style="background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.45);border-radius:50%;width:30px;height:30px;font-size:14px;cursor:pointer;padding:0;line-height:1" title="Exit My View">×</button>'
    + '<button id="mv-bs-bookmarks" style="background:rgba(212,175,55,0.10);color:#c9a961;border:1px solid rgba(212,175,55,0.4);border-radius:18px;padding:6px 14px;font-size:11px;cursor:pointer;font-family:Lato,sans-serif">★ BOOKMARKS</button>'
    + '<div style="display:inline-flex;align-items:center;gap:4px;margin-left:8px">'
    + '<button id="mv-bs-fontm" style="background:rgba(212,175,55,0.15);color:#c9a961;border:1px solid #c9a961;border-radius:16px;padding:6px 14px;font-size:14px;font-weight:700;cursor:pointer;font-family:Lato,sans-serif;letter-spacing:.02em" title="Smaller text">A−</button>'
    + '<span id="mv-bs-scale-lbl" style="color:#c9a961;font-size:13px;font-weight:600;min-width:50px;text-align:center;font-family:Lato,sans-serif">100%</span>'
    + '<button id="mv-bs-fontp" style="background:rgba(212,175,55,0.15);color:#c9a961;border:1px solid #c9a961;border-radius:16px;padding:6px 14px;font-size:14px;font-weight:700;cursor:pointer;font-family:Lato,sans-serif;letter-spacing:.02em" title="Larger text">A+</button>'
    + '</div>'
    + '<div style="flex:1"></div>'
    + '<div style="font-family:Cinzel,serif;font-size:11px;letter-spacing:.10em;color:rgba(212,175,55,0.7);text-transform:uppercase">Read the Quran</div>';
  document.body.appendChild(strip);
  document.getElementById('mv-bs-toggle').addEventListener('click', function(){
    if(typeof window._stMyViewToggle === 'function') window._stMyViewToggle();
  });
  document.getElementById('mv-bs-cancel').addEventListener('click', function(){
    if(typeof window._stMyViewToggle === 'function') window._stMyViewToggle();
  });
  document.getElementById('mv-bs-edit').addEventListener('click', function(){
    if(typeof window._stOpenPrefs === 'function') window._stOpenPrefs();
  });
  document.getElementById('mv-bs-bookmarks').addEventListener('click', function(){
    var btn = document.querySelector('#zoneB .zb-row1 button.zb-pill');
    if(btn) btn.click();
    else if(typeof _stShellOpenBookmarks === 'function') _stShellOpenBookmarks();
    else { var any = Array.prototype.find.call(document.querySelectorAll('button'), function(b){ return /bookmark/i.test(b.textContent||''); }); if(any) any.click(); }
  });
  document.getElementById('mv-bs-fontm').addEventListener('click', function(){ _stMyViewSetScale(window._stMyViewFontScale - 0.1); });
  document.getElementById('mv-bs-fontp').addEventListener('click', function(){ _stMyViewSetScale(window._stMyViewFontScale + 0.1); });
  _stMyViewLoadScale();
  // JS hide any prev/next-surah buttons and column header strips that survive CSS
  setTimeout(function(){
    document.querySelectorAll('a, button, div').forEach(function(el){
      var t = (el.textContent || '').trim();
      // Match patterns like "← Al-Fatihah", "Al-Baqarah →"
      if(/^←\s+\S+/.test(t) || /\S+\s+→$/.test(t) || /^\S+\s*→\s*$/.test(t)){
        if(t.length < 40 && el.closest('.st-mv-slot') === null && el.id !== 'mv-bs-toggle'){
          el.style.display = 'none';
        }
      }
    });
    // Hide any element whose text is exactly 'LINKS', 'VERSE', 'TRANSLATION', 'MARKERS' (column headers)
    document.querySelectorAll('div, span').forEach(function(el){
      var t = (el.textContent || '').trim();
      if((t === 'LINKS' || t === 'VERSE' || t === 'TRANSLATION' || t === 'MARKERS') && el.children.length === 0){
        if(el.parentNode) el.parentNode.style.display = 'none';
      }
    });
  }, 400);
  function _stMvRepos(){
    var s = document.getElementById('st-mv-bookshell');
    var z = document.querySelector('.zone-a');
    if(s && z) s.style.top = Math.round(z.getBoundingClientRect().bottom) + 'px';
  }
  window.addEventListener('resize', _stMvRepos);
  // Several passes — CSS application + zone-A height collapse happen async
  setTimeout(_stMvRepos, 50);
  setTimeout(_stMvRepos, 200);
  setTimeout(_stMvRepos, 500);
  setTimeout(_stMvRepos, 1200);
}

// Inject inline content under each verse row based on prefs.
function _stMyViewInjectInline(){
  if(!window._stMyViewOn) return;
  var prefs = _stPrefsLoad();
  if(!prefs) return;
  var rows = document.querySelectorAll('.st-verse');
  rows.forEach(function(row){
    if(row.nextSibling && row.nextSibling.classList && row.nextSibling.classList.contains('st-mv-slot')) return;
    var verseId = row.getAttribute('data-verse-id') || '';
    var v = parseInt(verseId, 10);
    if(!v) return;
    var s = (typeof _stSurah !== 'undefined') ? _stSurah : null;
    if(!s) return;

    var slot = document.createElement('div');
    slot.className = 'st-mv-slot';
    slot.style.cssText = 'grid-column:1 / -1;background:rgba(14,20,32,0.85);border-left:3px solid rgba(212,175,55,0.3);margin:8px 0 16px 0;padding:14px 18px;border-radius:0 4px 4px 0';

    var html = '';

    // Translations block
    if(prefs.translations && prefs.translations.length){
      html += '<div class="st-mv-tr-wrap" style="margin-bottom:14px">';
      html += '<div class="st-mv-section-hdr" style="font-family:Cinzel,serif;font-size:11px;letter-spacing:.10em;color:rgba(192,132,252,0.85);text-transform:uppercase;margin-bottom:6px">Translations</div>';
      var RTL_LANGS = {ar:1,ur:1,fa:1,ps:1,sd:1,ug:1,he:1,iw:1,ku:1,dv:1,prs:1,ckb:1};
      prefs.translations.forEach(function(slug){
        var entry = _stMyViewFindTrans(slug);
        if(!entry) return;
        var text = _stMyViewGetTransText(slug, s, v);
        var label = entry.translator || entry.title || slug;
        var lc = (entry.lang_code || entry.lang || '').toLowerCase();
        var script = '';
        try{
          var reg = window._stRegistry || {};
          var regEntry = (reg.translations || []).find(function(t){ return (t.slug===slug)||(t.id===slug); });
          if(regEntry && regEntry.script) script = regEntry.script;
        }catch(e){}
        var langAttr = (script === 'original' && lc) ? lc : '';
        var isRtl = (script !== 'romanised') && !!RTL_LANGS[lc];
        var dirStyle = isRtl ? 'direction:rtl;text-align:right;' : 'direction:ltr;text-align:left;';
        var lblAlign = isRtl ? 'text-align:right;' : 'text-align:left;';
        html += '<div class="st-mv-tr-item" data-slug="'+_stPrefsEsc(slug)+'" data-s="'+s+'" data-v="'+v+'" style="margin-bottom:8px">'
          + '<div style="color:rgba(212,175,55,0.65);font-size:12px;margin-bottom:2px;'+lblAlign+'">'+_stPrefsEsc(label)+'</div>'
          + '<div class="st-mv-tr-text" data-lang="'+_stPrefsEsc(langAttr)+'" style="color:#E5E7EB;'+dirStyle+'">'+(text || '<span style="color:#6b7384;font-style:italic">(loading...)</span>')+'</div>'
          + '</div>';
      });
      html += '</div>';
    }

    // Morphology block
    if(prefs.morphology){
      html += '<div class="st-mv-mp-wrap" data-s="'+s+'" data-v="'+v+'" style="margin-bottom:14px;padding:10px 0 0 0;border-top:1px solid rgba(255,255,255,0.05)">'
        + '<div class="st-mv-section-hdr" style="font-family:Cinzel,serif;font-size:11px;letter-spacing:.10em;color:rgba(192,132,252,0.85);text-transform:uppercase;margin-bottom:6px">Morphology</div>'
        + '<div class="st-mv-mp" style="color:#E5E7EB"><span style="color:#9aa3b2;font-style:italic">Loading word-by-word…</span></div>'
        + '</div>';
    }
    // Dictionary block (Lane's Lexicon entries for unique roots in this verse)
    if(prefs.dictionary){
      html += '<div class="st-mv-dict-wrap" data-s="'+s+'" data-v="'+v+'" style="margin-bottom:14px;padding:10px 0 0 0;border-top:1px solid rgba(255,255,255,0.05)">'
        + '<div class="st-mv-section-hdr" style="font-family:Cinzel,serif;font-size:11px;letter-spacing:.10em;color:rgba(192,132,252,0.85);text-transform:uppercase;margin-bottom:6px">Dictionary</div>'
        + '<div class="st-mv-dict" style="color:#E5E7EB"><span style="color:#9aa3b2;font-style:italic">Loading roots…</span></div>'
        + '</div>';
    }

    // Tafsirs (auto-load each picked tafsir for this verse)
    if(prefs.tafsirs && prefs.tafsirs.length){
      prefs.tafsirs.forEach(function(tid){
        html += '<div class="st-mv-tf" data-tid="'+_stPrefsEsc(tid)+'" data-s="'+s+'" data-v="'+v+'" style="margin-bottom:14px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05)"><div style="color:#9aa3b2;font-style:italic">Loading tafsir…</div></div>';
      });
    }

    if(!html){ return; }
    slot.innerHTML = html;
    row.parentNode.insertBefore(slot, row.nextSibling);

    // Trigger morphology load → flatten WBW cards into a single inline-text line.
    if(prefs.morphology){
      var mpEl = slot.querySelector('.st-mv-mp');
      if(mpEl){
        if(typeof _mpPopulateWBW === 'function'){
          try{
            _mpPopulateWBW(mpEl, s, v);
            setTimeout(function(){ _stMvFlattenMorphology(mpEl); }, 120);
            setTimeout(function(){ _stMvFlattenMorphology(mpEl); }, 350);
            setTimeout(function(){ _stMvFlattenMorphology(mpEl); }, 800);
            setTimeout(function(){ _stMvFlattenMorphology(mpEl); }, 1500);
          } catch(e){ mpEl.innerHTML = '<span style="color:#e74c3c">Morphology load failed</span>'; }
        } else {
          mpEl.innerHTML = '<span style="color:#9aa3b2;font-style:italic">Morphology unavailable</span>';
        }
      }
    }
    // Trigger dictionary load
    if(prefs.dictionary){
      var dictEl = slot.querySelector('.st-mv-dict');
      if(dictEl) _stMvLoadDict(dictEl, s, v);
    }

    // Trigger tafsir loads
    if(prefs.tafsirs && prefs.tafsirs.length){
      prefs.tafsirs.forEach(function(tid){
        var tfEl = slot.querySelector('.st-mv-tf[data-tid="'+tid+'"]');
        if(!tfEl) return;
        _stMyViewLoadTafsir(tid, s, v, tfEl);
      });
    }

    // Trigger any missing translations
    if(prefs.translations && prefs.translations.length){
      prefs.translations.forEach(function(slug){
        _stMyViewEnsureTrans(slug, s, v, slot);
      });
    }
  });

  // Hide chip types user disabled (default: all chips visible if pref absent)
  var chips = (prefs.chips || {figures:true,events:true,concepts:true,hadiths:true,tafsirs:true});
  ['figures','events','concepts','hadiths','tafsirs'].forEach(function(k){
    if(chips[k] !== false && chips[k] !== true) chips[k] = true;
  });
  var chipMap = {figures:'st-xref-fig', events:'st-xref-event', concepts:'st-xref-concept', hadiths:'st-xref-hadith', tafsirs:'st-xref-tafsir'};
  Object.keys(chipMap).forEach(function(k){
    var sel = '.'+chipMap[k];
    document.querySelectorAll(sel).forEach(function(el){
      el.style.display = (chips[k] === false) ? 'none' : '';
    });
  });

  // Hide dictionary section per pref (Lane's used inline only when WBW root clicked)
  // (No top-level Dictionary slot under each verse — it stays click-driven inside WBW.)
}

function _stMvLoadDict(el, s, v){
  var morphCache = window._stMorphologyCache || {};
  // Try to read roots from already-rendered or cached morphology data
  var roots = [];
  // Best-effort: scan for .mp-seg-root in this verse's morphology slot if rendered
  var slot = el.closest('.st-mv-slot');
  var mpEl = slot ? slot.querySelector('.st-mv-mp') : null;
  function _grabRoots(){
    var found = {};
    if(mpEl){
      mpEl.querySelectorAll('.mp-seg-root').forEach(function(r){
        var t = (r.textContent || '').trim().replace(/[—_-]/g,'').replace(/\s/g,'');
        if(t && t.length >= 2 && t.length <= 6) found[t] = true;
      });
    }
    return Object.keys(found);
  }
  function _render(){
    roots = _grabRoots();
    if(!roots.length){
      el.innerHTML = '<span style="color:#6b7384;font-style:italic">No roots in this verse</span>';
      return;
    }
    var lex = window._stLaneLexiconByRoot;
    if(!lex){
      el.innerHTML = '<span style="color:#9aa3b2;font-style:italic">Loading dictionary…</span>';
      if(!window._stLaneLexiconLoading){
        window._stLaneLexiconLoading = true;
        fetch(dataUrl('data/islamic/morphology/lane_lexicon.json'))
          .then(function(r){ return r.ok?r.json():null; })
          .then(function(j){ window._stLaneLexiconByRoot = j || {}; window._stLaneLexiconLoading=false; _render(); })
          .catch(function(){ window._stLaneLexiconByRoot = {}; window._stLaneLexiconLoading=false; el.innerHTML='<span style="color:#9aa3b2;font-style:italic">Dictionary unavailable</span>'; });
      }
      return;
    }
    var pieces = [];
    roots.forEach(function(rt){
      var entry = lex[rt];
      if(!entry) return;
      var text = (typeof entry === 'string') ? entry : (entry.text || entry.entry || entry.definition || '');
      if(!text) return;
      // Truncate very long entries
      var trimmed = text.length > 800 ? (text.substring(0,800).trim() + '…') : text;
      pieces.push('<div style="margin-bottom:10px"><span style="font-family:\'Amiri\',serif;color:#c9a961;margin-right:8px">'+_stPrefsEsc(rt)+'</span><span style="color:#E5E7EB">'+_stPrefsEsc(trimmed).replace(/\n/g,'<br>')+'</span></div>');
    });
    el.innerHTML = pieces.length ? pieces.join('') : '<span style="color:#6b7384;font-style:italic">No dictionary entries for this verse\'s roots</span>';
  }
  // Wait briefly for morphology to populate before reading roots
  setTimeout(_render, 500);
  setTimeout(_render, 1200);
}

function _stMvFlattenMorphology(mpEl){
  if(!mpEl) return;
  var words = mpEl.querySelectorAll('.mp-word');
  if(!words.length) return;
  var parts = [];
  words.forEach(function(w){
    var num = w.querySelector('.mp-word-num');
    var idx = num ? num.textContent.trim() : '';
    var segs = w.querySelectorAll('.mp-seg');
    var segParts = [];
    segs.forEach(function(sg){
      var form = sg.querySelector('.mp-seg-form');
      var pos = sg.querySelector('.mp-seg-pos');
      var root = sg.querySelector('.mp-seg-root');
      var formT = form ? form.textContent.trim() : '';
      var posT = pos ? pos.textContent.trim() : '';
      var rootT = root ? root.textContent.trim() : '';
      var line = '';
      if(formT) line += '<span style="font-family:\'Amiri\',serif;font-size:18px;color:#E5E7EB">'+_stPrefsEsc(formT)+'</span>';
      if(posT && posT !== '—') line += ' <span style="color:rgba(212,175,55,0.85);font-size:11px;text-transform:uppercase;letter-spacing:.05em">'+_stPrefsEsc(posT)+'</span>';
      if(rootT && rootT !== '—' && rootT !== '_') line += ' <span style="color:#9aa3b2;font-size:13px">('+_stPrefsEsc(rootT)+')</span>';
      if(line) segParts.push(line);
    });
    if(idx && segParts.length){
      parts.push('<span style="white-space:nowrap"><span style="color:rgba(212,175,55,0.55);font-size:11px;margin-right:4px">'+_stPrefsEsc(idx)+'</span>'+segParts.join(' · ')+'</span>');
    }
  });
  mpEl.innerHTML = parts.length ? parts.join(' &nbsp;—&nbsp; ') : '<span style="color:#6b7384;font-style:italic;font-size:13px">No morphology data</span>';
}

function _stMyViewFindTrans(slug){
  // Primary: legacy adapter array used by main translation system
  if(typeof _stTransIndex !== 'undefined' && _stTransIndex && _stTransIndex.length){
    for(var i=0;i<_stTransIndex.length;i++){
      if(_stTransIndex[i].slug === slug) return _stTransIndex[i];
    }
  }
  // Fallback: registry (id keyed)
  var reg = window._stRegistry || window._stTransRegistry;
  if(reg && reg.translations){
    return reg.translations.find(function(t){ return (t.slug === slug) || (t.id === slug); });
  }
  return null;
}

function _stMyViewGetTransText(slug, s, v){
  // Primary: real translation system cache (object: _stFileCache[slug][surah][ayah] = string)
  if(typeof _stFileCache !== 'undefined' && _stFileCache[slug] && _stFileCache[slug][s]){
    var bucket = _stFileCache[slug][s];
    if(bucket && bucket[v]) return _stPrefsEsc(bucket[v]);
  }
  // Fallback: my-view custom cache (array shape)
  if(window._stTransCache && window._stTransCache[slug] && window._stTransCache[slug][s]){
    var arr = window._stTransCache[slug][s];
    var entry = arr.find ? arr.find(function(x){ return x.ayah === v || x.verse === v; }) : null;
    if(entry) return _stPrefsEsc(entry.text || entry.translation || '');
  }
  return null;
}

function _stMyViewEnsureTrans(slug, s, v, slot){
  var entry = _stMyViewFindTrans(slug);
  if(!entry) return;
  // Targeted update — never walks all divs
  function _stpUpdateTextDiv(){
    var t = _stMyViewGetTransText(slug, s, v);
    if(!t) return false;
    var sel = '.st-mv-tr-item[data-slug="' + slug.replace(/"/g,'\\"') + '"] .st-mv-tr-text';
    var target = slot.querySelector(sel);
    if(target){ target.innerHTML = t; return true; }
    return false;
  }
  if(_stpUpdateTextDiv()) return; // already cached
  // Kick the main loader to populate _stFileCache — preferred path
  if(typeof _stEnsureSurahLoaded === 'function'){
    try{ _stEnsureSurahLoaded(slug, s); }catch(e){}
    setTimeout(_stpUpdateTextDiv, 400);
    setTimeout(_stpUpdateTextDiv, 1200);
    setTimeout(_stpUpdateTextDiv, 2500);
  }
  // Fallback fetch — only fills our private cache, no re-injection
  var pad = ('00'+s).slice(-3);
  var path = 'data/islamic/quran/translations/'+(entry.lang_code||'')+'/'+(entry.sub_slug||entry.slug||'')+'/surah-'+pad+'.json';
  fetch(dataUrl(path)).then(function(r){ return r.ok?r.json():null; }).then(function(j){
    if(!j) return;
    window._stTransCache = window._stTransCache || {};
    window._stTransCache[slug] = window._stTransCache[slug] || {};
    var arr = j.ayahs || j.verses || j;
    window._stTransCache[slug][s] = arr;
    _stpUpdateTextDiv();
  }).catch(function(){});
}

function _stMyViewLoadTafsir(tid, s, v, el){
  var pad = ('00'+s).slice(-3);
  var path = 'data/islamic/tafsir/'+tid+'/surah-'+pad+'.json';
  function _hideEmpty(){
    if(!el || !el.parentNode) return;
    el.remove();
    var slot = el.closest ? null : null; // can't traverse after remove
  }
  fetch(dataUrl(path)).then(function(r){ return r.ok?r.json():null; }).then(function(j){
    if(!j){ if(el && el.parentNode) el.parentNode.removeChild(el); return; }
    var arr = j.ayahs || j.verses || [];
    var entry = arr.find ? arr.find(function(x){ return x.ayah === v; }) : null;
    var text = entry ? entry.text : '';
    if(!text){ if(el && el.parentNode) el.parentNode.removeChild(el); return; }
    var reg = (window._stTafsirRegistry || []).find(function(x){return x && x.id===tid;}) || null;
    var label = reg ? (reg.name || tid) : tid;
    el.innerHTML = '<div class="st-mv-section-hdr" style="font-family:Cinzel,serif;font-size:11px;letter-spacing:.10em;color:rgba(192,132,252,0.85);text-transform:uppercase;margin-bottom:6px">'+_stPrefsEsc(label)+'</div>'
      + (function(){var lang=(reg?(reg.lang||'').toUpperCase():'');var TR={AR:1,UR:1,KU:1,FA:1,PS:1,HE:1};var rtl=!!TR[lang];var ds=rtl?'direction:rtl;text-align:right;':'direction:ltr;text-align:left;';return '<div class="st-mv-tf-text" data-lang="'+_stPrefsEsc(lang.toLowerCase())+'" style="color:#E5E7EB;'+ds+'">'+_stPrefsEsc(text).replace(/\n/g,'<br>').replace(/(\.|\?|!)\s+/g, '$1<br><br>')+'</div>';})();
  }).catch(function(){
    if(el && el.parentNode) el.parentNode.removeChild(el);
  });
}
// ────────────────────────────────────────────────────────────────

function _dvPad3(n){ return String(n).padStart ? String(n).padStart(3,"0") : ("00"+n).slice(-3); }

function _dvFetchTafsir(id, surah){
  if(!_dvTafsirCache[id]) _dvTafsirCache[id] = {};
  if(_dvTafsirCache[id][surah] !== undefined) return Promise.resolve(_dvTafsirCache[id][surah]);
  var url = dataUrl("data/islamic/tafsir/"+id+"/surah-"+_dvPad3(surah)+".json");
  return fetch(url).then(function(r){
    if(!r.ok) throw new Error("404");
    return r.json();
  }).then(function(j){
    var ay = (j && j.ayahs) || [];
    _dvTafsirCache[id][surah] = ay;
    return ay;
  }).catch(function(){
    _dvTafsirCache[id][surah] = null;
    return null;
  });
}

function _dvPrefetchSurah(surah, done){
  if(_dvFetchedSurahs[surah]){ if(done)done(); return; }
  var jobs = DIVE_TAFSIR_REGISTRY.map(function(t){ return _dvFetchTafsir(t.id, surah); });
  Promise.all(jobs).then(function(){
    // build availability index
    _dvTafsirAvail[surah] = {};
    DIVE_TAFSIR_REGISTRY.forEach(function(t){
      var ayahs = (_dvTafsirCache[t.id]||{})[surah];
      if(!ayahs || !ayahs.length) return;
      ayahs.forEach(function(a){
        if(!a || !a.text || !String(a.text).trim()) return;
        var v = a.ayah;
        if(!_dvTafsirAvail[surah][v]) _dvTafsirAvail[surah][v] = [];
        _dvTafsirAvail[surah][v].push(t.id);
      });
    });
    _dvFetchedSurahs[surah] = true;
    if(done)done();
  });
}

function _dvTafsirCount(surah, verse){
  var a = _dvTafsirAvail[surah];
  if(!a) return -1;            // -1 = not yet known
  return (a[verse] || []).length;
}

function _dvRangeFor(id, surah, verse){
  var ayahs = (_dvTafsirCache[id]||{})[surah];
  if(!ayahs) return null;
  var entry = null, idx = -1;
  for(var i=0;i<ayahs.length;i++){
    if(ayahs[i].ayah === verse){ entry = ayahs[i]; idx = i; break; }
  }
  if(!entry || !entry.text || !String(entry.text).trim()) return null;
  var txt = entry.text;
  var start = verse, end = verse;
  for(var j=idx-1;j>=0;j--){ if(ayahs[j] && ayahs[j].text === txt){ start = ayahs[j].ayah; } else break; }
  for(var k=idx+1;k<ayahs.length;k++){ if(ayahs[k] && ayahs[k].text === txt){ end = ayahs[k].ayah; } else break; }
  return { text: txt, start: start, end: end };
}

function _dvEsc(s){ var d=document.createElement("div"); d.textContent = s||""; return d.innerHTML; }

function _dvAuthorChip(fcode, author){
  if(!fcode) return '<span class="dv-author-plain">'+_dvEsc(author)+'</span>';
  var codes = String(fcode).split(",");
  return codes.map(function(c){
    return '<a class="dv-author-chip" href="#one?f='+_dvEsc(c.trim())+'">'+_dvEsc(author)+'</a>';
  }).join(" + ");
}

function _dvReadChip(id, surah, verse){
  return '<a class="dv-read-chip" href="javascript:void(0)" onclick="_dvOpenExplain(\''+_dvEsc(id)+'\','+surah+','+verse+');return false;">Read full tafsir →</a>';
}

function _dvOpenExplain(id, surah, verse){
  if(typeof setView !== 'function') return;
  location.hash = '#explain?tafsir='+encodeURIComponent(id)+'&surah='+surah+'&verse='+verse;
  setView('explain');
}
window._dvOpenExplain = _dvOpenExplain;

// Build the DIVE card HTML for a given verse. translitText is optional.
function _dvRenderCard(surah, verse, translitText){
  var h = '<div class="dv-card" data-dv-surah="'+surah+'" data-dv-verse="'+verse+'">';
  h += '<details open><summary>Word-by-word / Root / Morphology</summary><div class="dv-body dv-wbw-slot" data-mp-loaded="0"><span class="dv-pending">Open to load morphology…</span></div></details>';
  h += '<details><summary>Dictionary</summary><div class="dv-body dv-dict-slot"><span class="dv-pending">Click any root above to look up its Lane\'s Lexicon entry.</span></div></details>';
  h += '<details><summary>Tafsir (multi)</summary><div class="dv-body dv-tafsir-slot" data-loaded="0"></div></details>';
  h += '</div>';
  return h;
}

// Populate the Tafsir slot on first open.
function _dvPopulateTafsirSlot(slot){
  if(slot.getAttribute("data-loaded") === "1") return;
  var card = slot.closest(".dv-card");
  var surah = parseInt(card.getAttribute("data-dv-surah"),10);
  var verse = parseInt(card.getAttribute("data-dv-verse"),10);
  slot.innerHTML = '<span class="dv-pending">Loading…</span>';
  _dvPrefetchSurah(surah, function(){
    var avail = (_dvTafsirAvail[surah]||{})[verse] || [];
    if(DIVE_TLANG_FILTER){
      avail = avail.filter(function(id){
        var t = DIVE_TAFSIR_REGISTRY.find(function(x){return x.id===id;});
        return t && t.lang === DIVE_TLANG_FILTER;
      });
    }
    if(!avail.length){
      slot.innerHTML = '<span class="dv-pending">— no tafsir entries for this verse —</span>';
      slot.setAttribute("data-loaded","1");
      return;
    }
    // group by lang
    var byLang = {};
    avail.forEach(function(id){
      var t = DIVE_TAFSIR_REGISTRY.find(function(x){return x.id===id;});
      if(!t) return;
      if(!byLang[t.lang]) byLang[t.lang] = [];
      byLang[t.lang].push(t);
    });
    var h = '';
    DIVE_LANG_ORDER.forEach(function(lg){
      var arr = byLang[lg]; if(!arr || !arr.length) return;
      h += '<div class="dv-lang-group"><div class="dv-lang-label">'+DIVE_LANG_FULL[lg]+'</div><div class="dv-btn-row">';
      arr.forEach(function(t){
        h += '<button class="dv-btn" data-tafsir-id="'+t.id+'">'+_dvEsc(t.author)+'</button>';
      });
      h += '</div></div>';
    });
    h += '<div class="dv-panel" style="display:none"></div>';
    slot.innerHTML = h;
    slot.setAttribute("data-loaded","1");
    // bind button clicks
    slot.querySelectorAll(".dv-btn").forEach(function(btn){
      btn.addEventListener("click", function(){
        var id = btn.getAttribute("data-tafsir-id");
        var active = btn.classList.contains("active");
        slot.querySelectorAll(".dv-btn").forEach(function(b){ b.classList.remove("active"); });
        var panel = slot.querySelector(".dv-panel");
        if(active){ panel.style.display="none"; panel.innerHTML=""; return; }
        btn.classList.add("active");
        var t = DIVE_TAFSIR_REGISTRY.find(function(x){return x.id===id;});
        var rng = _dvRangeFor(id, surah, verse);
        if(!t || !rng){ panel.innerHTML = '<span class="dv-pending">— unavailable —</span>'; panel.style.display="block"; return; }
        var rngLbl = rng.start === rng.end ? ("Verse "+rng.start) : ("Verses "+rng.start+"–"+rng.end);
        var langName = DIVE_LANG_FULL[t.lang] || t.lang;
        var dirStyle = (t.lang==="AR"||t.lang==="UR") ? ' style="direction:rtl;text-align:right"' : '';
        var fontClass = t.lang==="AR" ? "dv-text-ar" : (t.lang==="UR" ? "dv-text-ur" : "dv-text-en");
        var pan  = '<div class="dv-panel-hdr">'+_dvEsc(t.work)+' · '+_dvAuthorChip(t.fcode, t.author)+' '+_dvReadChip(id, surah, verse)+' · '+langName+'</div>';
            pan += '<div class="dv-panel-sub">'+rngLbl+'</div>';
            pan += '<div class="dv-panel-body '+fontClass+'"'+dirStyle+'>'+_dvEsc(rng.text).replace(/\n/g,"<br>")+'</div>';
        panel.innerHTML = pan;
        panel.style.display = "block";
      });
    });
  });
}

// Delegate: expand Tafsir slot triggers populate.
document.addEventListener("toggle", function(e){
  var t = e.target;
  if(t && t.tagName === "DETAILS" && t.open){
    var slot = t.querySelector(".dv-tafsir-slot");
    if(slot && slot.getAttribute("data-loaded") !== "1") _dvPopulateTafsirSlot(slot);
    var wbw = t.querySelector(".dv-wbw-slot");
    if(wbw && wbw.getAttribute("data-mp-loaded") !== "1" && typeof _mpPopulateWBW === "function"){
      var card = wbw.closest(".dv-card");
      if(card){
        var s = parseInt(card.getAttribute("data-dv-surah"),10);
        var v = parseInt(card.getAttribute("data-dv-verse"),10);
        _mpPopulateWBW(wbw, s, v);
      }
    }
  }
}, true);

// Toggle DIVE mode on/off. Called from START.
function _dvSetMode(on){
  window._stDive = false;
  document.body.classList.toggle("st-dive-on", !!on);
  var btn = document.getElementById("st-btn-dive");
  if(btn){
    btn.classList.toggle("active", !!on);
    btn.textContent = on ? "DIVE: ON" : "DIVE: OFF";
  }
  var lf = document.getElementById("st-dv-lang-wrap");
  if(lf) lf.style.display = on ? "" : "none";
  // HARD: close any open ST dropdowns so they don't float over the page
  _dvCloseAllStartDropdowns();
  // Re-render current surah so cards show/hide and tafsir chips refresh
  if(typeof _stRenderSurah === "function") _stRenderSurah();
  // Re-measure topbar anchor + refresh chip active state
  setTimeout(function(){
    if(typeof _dvUpdateTafsirChips==="function") _dvUpdateTafsirChips();
    _dvMeasureTopbar();
  }, 50);
}
window._dvSetMode = _dvSetMode;

// Update all "N tafsirs" chips in the Links column with real counts.
function _dvUpdateTafsirChips(){
  var on = !!window._stDive;
  document.querySelectorAll(".st-xref-chip.st-xref-tafsir").forEach(function(chip){
    var s = parseInt(chip.getAttribute("data-surah"),10);
    var v = parseInt(chip.getAttribute("data-verse"),10);
    var n = _dvTafsirCount(s,v);
    if(n > 0){ chip.textContent = "Tafsir"; chip.style.display = ""; }
    else if(n === 0){ chip.style.display = "none"; }
    chip.classList.toggle("active", on);
  });
}
window._dvUpdateTafsirChips = _dvUpdateTafsirChips;

// Called from start.js _stXrefChip. Always emits a chip; real count
// fills in after prefetch completes.
function _dvTafsirChipHTML(surah, verse){
  return '<div class="st-xref-chip st-xref-tafsir" data-surah="'+surah+'" data-verse="'+verse+'" onclick="_dvTafsirChipClick('+surah+','+verse+',event)">tafsirs</div>';
}
window._dvTafsirChipHTML = _dvTafsirChipHTML;

function _dvTafsirChipClick(surah, verse, ev){
  if(ev) ev.stopPropagation();
  _dvCloseAllStartDropdowns();
  if(window._stDive){
    // Already in DIVE -> turn OFF and return to base view
    _dvSetMode(false);
    // scroll the verse row back into view
    setTimeout(function(){
      var row = document.querySelector('.st-verse[data-verse-id="'+verse+'"]');
      if(row) row.scrollIntoView({behavior:"smooth", block:"start"});
    }, 120);
    return;
  }
  _dvSetMode(true);
  setTimeout(function(){
    var row = document.querySelector('.st-verse[data-verse-id="'+verse+'"]');
    if(!row) return;
    var card = row.querySelector(".dv-card");
    if(!card) return;
    var slots = card.querySelectorAll("details");
    // Tafsir is the 4th <details>
    var tslot = slots[3];
    if(tslot){
      tslot.open = true;
      // scroll so the card is visible BUT st-topbar stays at top (sticky)
      tslot.scrollIntoView({behavior:"smooth", block:"start"});
    }
  }, 120);
}
window._dvTafsirChipClick = _dvTafsirChipClick;

// ══════════════════════════════════════════════════════════
// TOPBAR SURVIVAL ENGINE
// Measures the global app header (everything above #st-topbar)
// and writes its height to --st-topbar-top so the fixed
// #st-topbar sits immediately below it. Also measures its own
// height into --st-topbar-height so #st-reader can pad-top.
// ══════════════════════════════════════════════════════════
function _dvMeasureTopbar(){
  var bar = document.getElementById("st-topbar");
  if(!bar) return;
  // Compute the highest point the topbar should occupy:
  // iterate previous siblings and ancestor chain until we hit body,
  // summing visible non-scrolling blocks above the start-view.
  // Simpler: use the position of #start-view's top as the anchor.
  var sv = document.getElementById("start-view");
  if(!sv){ return; }
  var rect = sv.getBoundingClientRect();
  // Convert viewport-relative top to the stable header height by
  // reading the topmost fixed/sticky ancestor stack. Fallback: use
  // start-view's offsetTop from document.
  var topPx = sv.offsetTop || 0;
  // But if start-view is inside a scroller, offsetTop is 0 and we need
  // the rect top BEFORE we set fixed positioning. Use getBoundingClientRect
  // when the page is scrolled to 0. If user has scrolled, the rect shifts;
  // stash the first clean measurement in window._dvTopbarAnchor.
  if(window._dvTopbarAnchor === undefined && window.scrollY === 0){
    window._dvTopbarAnchor = rect.top;
  }
  var anchor = (window._dvTopbarAnchor !== undefined) ? window._dvTopbarAnchor : rect.top;
  document.documentElement.style.setProperty("--st-topbar-top", anchor + "px");
  // Measure bar height for content padding
  var h = bar.offsetHeight || 100;
  document.documentElement.style.setProperty("--st-topbar-height", (anchor + h) + "px");
  document.documentElement.style.setProperty("--st-topbar-own-height", h + "px");
}
window._dvMeasureTopbar = _dvMeasureTopbar;

function _dvCloseAllStartDropdowns(){
  document.querySelectorAll("#st-topbar .st-dd-panel").forEach(function(p){
    p.style.display = "none";
  });
  if(typeof window._stDDOpen !== "undefined") window._stDDOpen = null;
}
window._dvCloseAllStartDropdowns = _dvCloseAllStartDropdowns;

// Hook measurements into load / resize
window.addEventListener("load", function(){ setTimeout(_dvMeasureTopbar, 50); });
window.addEventListener("resize", _dvMeasureTopbar);
// Also measure after every render — start.js calls _stRenderSurah often
// — so use a short poll after any DOM mutation on #st-topbar
(new MutationObserver(function(){ _dvMeasureTopbar(); })).observe(
  document.documentElement, { childList:true, subtree:true }
);
// ═══════════════════════════════════════════════════════════
// QURANLINK — Clickable Quran references across all views
// renderQuranRef(refString) → HTML with <a class="qref"> links
// _qlJump(surah, ayah) → switch to START view, scroll, highlight
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

function _qlEsc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}

// Parse all surah:verse refs from a string
// Handles: "2:255", "Al-Imran 3:123", "Quran 2:255", "Q. 2:255", "3:1-4"
function _qlParseAll(s){
  if(!s)return[];
  var str=String(s);
  var re=/(?:(?:Quran|Q\.?|Surah)\s+)?(?:[A-Za-z][A-Za-z'\u2018\u2019\-\s]*?\s+)?(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-\u2013]\s*\d+)?/g;
  var out=[];var m;
  while((m=re.exec(str))!==null){
    out.push({start:m.index,end:m.index+m[0].length,text:m[0].trim(),surah:parseInt(m[1],10),ayah:parseInt(m[2],10)});
  }
  return out;
}

// Main: convert ref string to HTML with clickable links
function renderQuranRef(ref){
  if(!ref)return'';
  var s=String(ref);
  var matches=_qlParseAll(s);
  if(!matches.length)return _qlEsc(s);

  var out='';var last=0;
  matches.forEach(function(mt){
    out+=_qlEsc(s.slice(last,mt.start));
    out+='<a class="qref" data-surah="'+mt.surah+'" data-ayah="'+mt.ayah+'" href="#quran/'+mt.surah+'/'+mt.ayah+'" onclick="_qlJump('+mt.surah+','+mt.ayah+',event)">'+_qlEsc(mt.text)+'</a>';
    last=mt.end;
  });
  out+=_qlEsc(s.slice(last));
  return out;
}

// Jump to START view at surah:ayah
window._qlJump=function(surah,ayah,ev){
  if(ev){ev.preventDefault();ev.stopPropagation();}
  history.replaceState(null,'','#quran/'+surah+'/'+ayah);
  if(typeof setView==='function')setView('start');
  _qlScrollTo(surah,ayah);
};

function _qlScrollTo(surah,ayah){
  var attempts=0;
  var check=function(){
    attempts++;
    if(attempts>40)return;
    var reader=document.getElementById('st-reader');
    if(typeof _stSelectSurah==='function'&&reader){
      _stSelectSurah(surah);
      setTimeout(function(){_qlHighlight(ayah);},300);
    } else {
      setTimeout(check,100);
    }
  };
  check();
}

function _qlHighlight(ayah){
  var verses=document.querySelectorAll('.st-verse');
  for(var i=0;i<verses.length;i++){
    var center=verses[i].querySelector('.st-vcenter span');
    if(center&&parseInt(center.textContent,10)===ayah){
      verses[i].scrollIntoView({behavior:'smooth',block:'center'});
      verses[i].classList.add('qref-pulse');
      setTimeout(function(el){return function(){el.classList.remove('qref-pulse');};}(verses[i]),2500);
      return;
    }
  }
}

// Hash deep-link on page load: #quran/2/255
window.addEventListener('load',function(){
  var h=location.hash;
  var m=h.match(/^#quran\/(\d+)\/(\d+)$/);
  if(m){
    setTimeout(function(){
      _qlJump(parseInt(m[1],10),parseInt(m[2],10));
    },800);
  }
});

// Expose
window.renderQuranRef=renderQuranRef;
window._qlScrollTo=_qlScrollTo;
window._qlHighlight=_qlHighlight;

})();
// ═══════════════════════════════════════════════════════════
// QuranAudio — per-ayah recitation via cdn.islamic.network.
// Uses HTML <audio> elements only (no fetch, no Web Audio, no CORS).
// URL: https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{globalAyah}.mp3
// ═══════════════════════════════════════════════════════════
window.QuranAudio = (function(){
  var BITRATES = [128, 64, 48];
  var FALLBACK_RECITER = 'ar.husary';

  var ayahCountsBySurah = null;  // length 114, 0-indexed
  var cumStart = null;           // cumStart[i] = sum of ayahs for surahs 1..i (exclusive)
  var currentReciter = 'ar.alafasy';
  var primary = null, next = null;
  var state = null;              // { surah, ayah, reciter, bitrateIdx, usedFallbackReciter }
  var onChangeCb = null, onErrorCb = null;

  function init(opts){
    opts = opts || {};
    ayahCountsBySurah = opts.ayahCountsBySurah;
    if(!Array.isArray(ayahCountsBySurah) || ayahCountsBySurah.length !== 114){
      console.error('[QuranAudio] init requires ayahCountsBySurah of length 114');
      return;
    }
    if(opts.defaultReciter) currentReciter = opts.defaultReciter;

    // Cumulative ayah offsets: cumStart[s-1] = ayahs before surah s
    cumStart = [0];
    var total = 0;
    for(var i=0; i<ayahCountsBySurah.length; i++){
      total += ayahCountsBySurah[i];
      cumStart.push(total);
    }

    primary = _ensureAudioEl('qa-primary');
    next = _ensureAudioEl('qa-next');
    _attachPrimaryListeners(primary);
  }

  function _ensureAudioEl(id){
    var el = document.getElementById(id);
    if(el) return el;
    el = document.createElement('audio');
    el.id = id;
    el.preload = 'auto';
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }

  function _attachPrimaryListeners(el){
    el.addEventListener('ended', _onEnded);
    el.addEventListener('error', _onPlaybackError);
  }
  function _detachPrimaryListeners(el){
    el.removeEventListener('ended', _onEnded);
    el.removeEventListener('error', _onPlaybackError);
  }

  function _globalAyah(surah, ayah){
    return cumStart[surah - 1] + ayah;
  }

  function _url(surah, ayah, reciter, bitrate){
    return 'https://cdn.islamic.network/quran/audio/' + bitrate + '/' + reciter + '/' + _globalAyah(surah, ayah) + '.mp3';
  }

  function _fire(cb, arg){
    if(typeof cb === 'function'){
      try{ cb(arg); }catch(e){ console.error('[QuranAudio] callback error', e); }
    }
  }

  function _preloadNext(){
    if(!state) return;
    var cnt = ayahCountsBySurah[state.surah - 1];
    if(state.ayah + 1 > cnt){
      next.removeAttribute('src');
      try{ next.load(); }catch(e){}
      return;
    }
    next.src = _url(state.surah, state.ayah + 1, state.reciter, BITRATES[0]);
  }

  function play(surah, ayah){
    if(!cumStart){ console.error('[QuranAudio] not initialized'); return; }
    if(surah < 1 || surah > 114) return;
    var cnt = ayahCountsBySurah[surah - 1];
    if(ayah < 1 || ayah > cnt) return;

    // Stop both without firing change (change fires below).
    _hardStop(false);

    state = {
      surah: surah,
      ayah: ayah,
      reciter: currentReciter,
      bitrateIdx: 0,
      usedFallbackReciter: false
    };
    primary.src = _url(surah, ayah, state.reciter, BITRATES[0]);
    primary.play().catch(function(){ /* autoplay-policy, ignore */ });
    _fire(onChangeCb, { surah: surah, ayah: ayah });
    _preloadNext();
  }

  function pause(){
    if(primary) try{ primary.pause(); }catch(e){}
  }

  function stop(){
    _hardStop(true);
  }

  function _hardStop(fireChange){
    if(primary){
      try{ primary.pause(); }catch(e){}
      primary.removeAttribute('src');
      try{ primary.load(); }catch(e){}
    }
    if(next){
      try{ next.pause(); }catch(e){}
      next.removeAttribute('src');
      try{ next.load(); }catch(e){}
    }
    state = null;
    if(fireChange) _fire(onChangeCb, null);
  }

  function setReciter(id){
    currentReciter = id;
    // If currently playing, restart current ayah with the new reciter.
    if(state){
      var s = state.surah, a = state.ayah;
      play(s, a);
    }
  }

  function getCurrent(){
    return state ? { surah: state.surah, ayah: state.ayah } : null;
  }

  function onChange(fn){ onChangeCb = fn; }
  function onError(fn){ onErrorCb = fn; }

  function _onEnded(){
    if(!state) return;
    var cnt = ayahCountsBySurah[state.surah - 1];
    // Per-ayah (single-shot) playback — don't auto-advance.
    if(!window._stSurahPlayMode){
      stop();
      return;
    }
    if(state.ayah + 1 > cnt){
      // End of surah — do NOT auto-advance into next surah.
      stop();
      return;
    }
    // Swap primary <-> next. Old primary (finished) becomes the preload slot.
    var oldPrimary = primary;
    _detachPrimaryListeners(oldPrimary);
    try{ oldPrimary.pause(); }catch(e){}
    oldPrimary.removeAttribute('src');
    try{ oldPrimary.load(); }catch(e){}

    primary = next;
    next = oldPrimary;
    _attachPrimaryListeners(primary);

    state.ayah += 1;
    primary.play().catch(function(){});
    _fire(onChangeCb, { surah: state.surah, ayah: state.ayah });
    _preloadNext();
  }

  function _onPlaybackError(ev){
    if(!state) return;
    // Same reciter, next-lower bitrate
    if(state.bitrateIdx + 1 < BITRATES.length){
      state.bitrateIdx += 1;
      primary.src = _url(state.surah, state.ayah, state.reciter, BITRATES[state.bitrateIdx]);
      primary.play().catch(function(){});
      return;
    }
    // Fall back to husary at 64kbps
    if(!state.usedFallbackReciter){
      state.usedFallbackReciter = true;
      state.reciter = FALLBACK_RECITER;
      state.bitrateIdx = 1;
      primary.src = _url(state.surah, state.ayah, state.reciter, BITRATES[state.bitrateIdx]);
      primary.play().catch(function(){});
      return;
    }
    // Give up
    var s = state.surah, a = state.ayah;
    _fire(onErrorCb, { surah: s, ayah: a });
    stop();
  }

  return {
    init: init,
    play: play,
    pause: pause,
    stop: stop,
    setReciter: setReciter,
    getCurrent: getCurrent,
    onChange: onChange,
    onError: onError
  };
})();
// ═══════════════════════════════════════════════════════════
// MORPHOLOGY — Word-by-word (Quranic Corpus) + Dictionary (Lane's)
// Called by dive.js. Lazy loaded.
// ═══════════════════════════════════════════════════════════

window._mpCorpusCache = window._mpCorpusCache || {};
window._mpLaneCache = window._mpLaneCache || {};
window._mpLaneIndex = null;

function _mpPad3(n){ return ("00"+n).slice(-3); }

function _mpLoadSurah(surah){
  if(window._mpCorpusCache[surah] !== undefined) return Promise.resolve(window._mpCorpusCache[surah]);
  return fetch(dataUrl("data/islamic/morphology/corpus/surah-"+_mpPad3(surah)+".json"))
    .then(function(r){ if(!r.ok) throw new Error("404"); return r.json(); })
    .then(function(j){ window._mpCorpusCache[surah] = j; return j; })
    .catch(function(){ window._mpCorpusCache[surah] = null; return null; });
}

function _mpLoadLaneIndex(){
  if(window._mpLaneIndex) return Promise.resolve(window._mpLaneIndex);
  return fetch(dataUrl("data/islamic/morphology/lane_letter_index.json"))
    .then(function(r){ return r.json(); })
    .then(function(j){ window._mpLaneIndex = j; return j; })
    .catch(function(){ window._mpLaneIndex = {}; return {}; });
}

function _mpLoadLaneLetter(letter){
  if(window._mpLaneCache[letter] !== undefined) return Promise.resolve(window._mpLaneCache[letter]);
  return _mpLoadLaneIndex().then(function(idx){
    var fn = idx[letter];
    if(!fn){ window._mpLaneCache[letter] = {}; return {}; }
    return fetch(dataUrl("data/islamic/morphology/lane/"+fn))
      .then(function(r){ return r.json(); })
      .then(function(j){ window._mpLaneCache[letter] = j; return j; })
      .catch(function(){ window._mpLaneCache[letter] = {}; return {}; });
  });
}

function _mpEsc(s){ var d = document.createElement("div"); d.textContent = s||""; return d.innerHTML; }

var _MP_POS_LABELS = {
  N:"noun", V:"verb", P:"particle", PN:"proper noun", ADJ:"adjective",
  PRON:"pronoun", DEM:"demonstrative", REL:"relative", T:"time", LOC:"location",
  CONJ:"conjunction", NEG:"negation", INTG:"interrogative", VOC:"vocative",
  RSLT:"result", COND:"conditional", EMPH:"emphasis", SUP:"supplication"
};

// Render word-by-word panel for a verse. Returns HTML string.
function _mpRenderWBW(surah, verse, data){
  if(!data){ return '<span class="dv-pending">— morphology unavailable —</span>'; }
  var ayah = (data.ayahs||{})[String(verse)];
  if(!ayah){ return '<span class="dv-pending">— no morphology for this verse —</span>'; }
  var h = '<div class="mp-wbw">';
  var wordNums = Object.keys(ayah).sort(function(a,b){ return parseInt(a)-parseInt(b); });
  wordNums.forEach(function(wn){
    var segs = ayah[wn] || [];
    h += '<div class="mp-word">';
    h += '<div class="mp-word-num">W'+wn+'</div>';
    segs.forEach(function(s){
      h += '<div class="mp-seg">';
      h += '<div class="mp-seg-form">'+_mpEsc(s.form||"")+'</div>';
      var posLabel = _MP_POS_LABELS[s.tag] || s.tag || "";
      h += '<div class="mp-seg-pos">'+_mpEsc(posLabel)+'</div>';
      if(s.root){
        h += '<div class="mp-seg-root"><span class="mp-root-chip" onclick="_mpRootClick(\''+encodeURIComponent(s.root)+'\',event)">√ '+_mpEsc(s.root)+'</span></div>';
      } else {
        h += '<div class="mp-seg-root mp-seg-root-empty">—</div>';
      }
      if(s.lemma){
        h += '<div class="mp-seg-lemma">lemma: '+_mpEsc(s.lemma)+'</div>';
      }
      if(s.gloss){
        h += '<div class="mp-seg-gloss">'+_mpEsc(s.gloss)+'</div>';
      }
      h += '</div>';
    });
    h += '</div>';
  });
  h += '</div>';
  return h;
}
window._mpRenderWBW = _mpRenderWBW;

// Root chip click → expand Dictionary slot in same card, render Lane entry.
function _mpNormalizeRoot(root){
  if(!root) return "";
  var r = String(root);
  // Hamza variants → alif
  r = r.replace(/[أإآءئؤ]/g, "ا");
  // Alif maqsura → ya
  r = r.replace(/ى/g, "ي");
  return r;
}
function _mpLaneLookup(root){
  // Try Lane with: exact, normalised, geminate collapse.
  var tries = [root, _mpNormalizeRoot(root)];
  var normal = _mpNormalizeRoot(root);
  if(normal.length === 3 && normal[1] === normal[2]){
    tries.push(normal.slice(0,2));
  }
  // Unique
  var seen = {};
  tries = tries.filter(function(t){ if(!t || seen[t]) return false; seen[t]=1; return true; });
  // Sequential lookup, first hit wins
  function tryNext(i){
    if(i >= tries.length) return Promise.resolve({hit:null, keyTried: tries});
    var k = tries[i];
    var letter = k[0];
    return _mpLoadLaneLetter(letter).then(function(entries){
      if(entries[k]) return {hit:{key:k, text:entries[k]}, keyTried: tries};
      return tryNext(i+1);
    });
  }
  return tryNext(0);
}
window._mpLaneLookup = _mpLaneLookup;

function _mpRootClick(rootEncoded, ev){
  if(ev){ ev.stopPropagation(); ev.preventDefault(); }
  var root = decodeURIComponent(rootEncoded);
  var chip = ev && ev.target && ev.target.closest(".mp-root-chip");
  if(!chip) return;
  var card = chip.closest(".dv-card");
  if(!card) return;
  // Dictionary slot — find by class, not index (index drifts when slots reorder)
  var body = card.querySelector(".dv-dict-slot");
  if(!body) return;
  var dictDetails = body.closest("details");
  if(!dictDetails) return;
  dictDetails.open = true;
  if(!body) return;
  body.innerHTML = '<span class="dv-pending">Looking up '+_mpEsc(root)+'…</span>';
  _mpLaneLookup(root).then(function(res){
    if(!res.hit){
      body.innerHTML = '<div class="mp-dict-hdr">Root: <span class="mp-dict-root">'+_mpEsc(root)+'</span></div><div class="mp-dict-missing">Not in Lane\'s Lexicon</div>';
      return;
    }
    var note = (res.hit.key !== root) ? (' <span class="mp-dict-normalised">(matched as '+_mpEsc(res.hit.key)+')</span>') : '';
    body.innerHTML = '<div class="mp-dict-hdr">Root: <span class="mp-dict-root">'+_mpEsc(root)+'</span>'+note+' · Lane\'s Lexicon</div><div class="mp-dict-body">'+_mpEsc(res.hit.text).replace(/\n/g,"<br>")+'</div>';
  });
  dictDetails.scrollIntoView({behavior:"smooth", block:"nearest"});
}
window._mpRootClick = _mpRootClick;

// Populate a WBW slot on first open.
function _mpPopulateWBW(slot, surah, verse){
  if(slot.getAttribute("data-mp-loaded") === "1") return;
  slot.setAttribute("data-mp-loaded","1");
  slot.innerHTML = '<span class="dv-pending">Loading morphology…</span>';
  _mpLoadSurah(surah).then(function(data){
    slot.innerHTML = _mpRenderWBW(surah, verse, data);
  });
}
window._mpPopulateWBW = _mpPopulateWBW;

// ═══════════════════════════════════════════════════════════
// ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
// ═══════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════
// StartView — sandbox mount/unmount wrapper
// ═══════════════════════════════════════════════════════════
window.StartView = (function(){
  'use strict';

  // ── Shell-standard .dd-panel system (per SHELL_STANDARDS.md §4) ──
  var _stShellPanels = {};
  var _stShellOpen = null;

  function _stShellCloseAll(){
    if(_stShellOpen && _stShellPanels[_stShellOpen]){
      _stShellPanels[_stShellOpen].classList.remove('open');
      _stShellPanels[_stShellOpen].style.display = 'none';
    }
    _stShellOpen = null;
  }

  function _stShellEnsurePanel(name){
    if(_stShellPanels[name]) return _stShellPanels[name];
    var p = document.createElement('div');
    p.className = 'dd-panel';
    p.style.display = 'none';
    p.setAttribute('data-st-shell', name);
    document.body.appendChild(p);
    _stShellPanels[name] = p;
    return p;
  }

  function _stShellRender(name, items, opts){
    var panel = _stShellEnsurePanel(name);
    panel.innerHTML = '';
    if(opts.searchable){
      var inp = document.createElement('input');
      inp.className = 'dd-search';
      inp.type = 'text';
      inp.placeholder = 'search…';
      inp.addEventListener('click', function(e){ e.stopPropagation(); });
      inp.addEventListener('input', function(){
        var q = inp.value.toLowerCase();
        panel.querySelectorAll('.dd-item').forEach(function(r){
          if(r.classList.contains('dd-header')){ r.style.display = ''; return; }
          var t = (r.dataset.q || '').toLowerCase();
          r.style.display = (!q || t.indexOf(q) !== -1) ? '' : 'none';
        });
      });
      panel.appendChild(inp);
    }
    items.forEach(function(it){
      if(it.isHeader){
        var h = document.createElement('div');
        h.className = 'dd-item dd-header';
        h.style.cssText = 'color:var(--gold,#c9a961);font-family:Cinzel,serif;font-size:11px;letter-spacing:.08em;text-transform:uppercase;padding:8px 14px 4px;border-top:1px solid rgba(212,175,55,.18);pointer-events:none';
        h.textContent = it.label;
        panel.appendChild(h);
        return;
      }
      var row = document.createElement('div');
      row.className = 'dd-item' + (it.isAll ? ' dd-all' : '');
      row.dataset.q = it.label + ' ' + (it.sub || '');
      var sel = !!opts.isSelected(it.value);
      var ck = document.createElement('div');
      ck.className = 'dd-checkbox';
      ck.textContent = sel ? '✓' : '';
      var sp = document.createElement('span');
      sp.textContent = it.label;
      row.appendChild(ck);
      row.appendChild(sp);
      if(sel) row.classList.add('selected');
      row.addEventListener('click', function(e){
        e.stopPropagation();
        opts.onPick(it.value);
        if(!opts.multi) _stShellCloseAll();
        else _stShellRender(name, items, opts);
      });
      panel.appendChild(row);
    });
  }

  function _stShellOpenPanel(name, btnEl){
    if(_stShellOpen === name){ _stShellCloseAll(); return; }
    _stShellCloseAll();
    var panel = _stShellPanels[name];
    if(!panel) return;
    var r = btnEl.getBoundingClientRect();
    panel.style.position = 'fixed';
    panel.style.top = (r.bottom + 4) + 'px';
    // first show panel to measure its width
    panel.style.display = 'block';
    panel.classList.add('open');
    var pw = panel.offsetWidth;
    var vw = window.innerWidth;
    var left = r.left;
    if (left + pw > vw - 12) {
      left = vw - pw - 12;
    }
    if (left < 12) left = 12;
    panel.style.left = left + 'px';
    _stShellOpen = name;
  }

  if(!window._stShellOutsideBound){
    document.addEventListener('click', function(e){
      if(!_stShellOpen) return;
      var p = _stShellPanels[_stShellOpen];
      if(p && (p === e.target || p.contains(e.target))) return;
      _stShellCloseAll();
    });
    window._stShellOutsideBound = true;
  }

  function _stShellSurahMeta(sid){
    if(_stIndex && _stIndex.surahs){
      return (_stIndex.surahs.find ? _stIndex.surahs.find(function(x){return x.id===sid;}) : null);
    }
    if(Array.isArray(_stIndex)){
      for(var i=0;i<_stIndex.length;i++){ if(_stIndex[i].id===sid) return _stIndex[i]; }
    }
    return null;
  }

  function _stItemsSurah(){
    var out = [];
    var arr = (_stIndex && _stIndex.surahs) ? _stIndex.surahs : (Array.isArray(_stIndex) ? _stIndex : null);
    if(arr && arr.length){
      arr.forEach(function(s){
        var nm = s.english || s.name_en || s.name_arabic || s.name_ar || ('Surah '+s.id);
        out.push({ value: s.id, label: s.id + ' — ' + nm });
      });
    } else {
      for(var i=1;i<=114;i++) out.push({ value:i, label:'Surah '+i });
    }
    return out;
  }
  function _stItemsVerse(){
    var out = [];
    var sid = _stSurah || 1;
    var s = _stShellSurahMeta(sid);
    var n = s ? (s.verses || s.ayah_count || s.count || 0) : 0;
    if(!n) n = 286;
    for(var v=1; v<=n; v++) out.push({ value:v, label:'Verse '+v });
    return out;
  }
  function _stItemsJuz(){
    var out = [{ value:0, label:'All Juz', isAll:true }];
    for(var j=1;j<=30;j++) out.push({ value:j, label:'Juz '+j });
    return out;
  }
  function _stItemsHizb(){
    var out = [{ value:0, label:'All Hizb', isAll:true }];
    for(var h=1;h<=60;h++) out.push({ value:h, label:'Hizb '+h });
    return out;
  }
  function _stItemsManzil(){
    var out = [{ value:0, label:'All Manzil', isAll:true }];
    for(var m=1;m<=7;m++) out.push({ value:m, label:'Manzil '+m });
    return out;
  }
  function _stItemsReciter(){
    return (_stReciters || []).map(function(r){ return { value:r.id, label:r.name || r.id }; });
  }
  function _stItemsTranslation(){
    if(!window._stTransLogged && _stTransIndex && _stTransIndex.length){
      console.log('[START] sample translation entry:', _stTransIndex[0]);
      window._stTransLogged = true;
    }
    var out = [];
    var lastLang = null;
    (_stTransIndex || []).forEach(function(t){
      if(t.slug === 'arabic') return;
      if(t.lang_name && t.lang_name !== lastLang){
        var cnt = _stTransIndex.filter(function(x){ return x.lang_name === t.lang_name && x.slug !== 'arabic'; }).length;
        out.push({ isHeader:true, label: t.lang_name + ' · ' + cnt + ' translation' + (cnt>1?'s':'') });
        lastLang = t.lang_name;
      }
      var nm = t.translator || t.translator_name || t.name || t.native_name || t.english_name || t.slug || '(unknown)';
      out.push({ value: t.slug, label: nm, sub: t.lang_name });
    });
    return out;
  }

  function _stShellScrollToVerse(v){
    var row = document.querySelector('.st-verse[data-verse-id="'+v+'"]');
    if(row && row.scrollIntoView) row.scrollIntoView({behavior:'smooth', block:'start'});
  }

  window._stShellRefreshLabels = function(){
    var setLbl = function(name, txt){
      var btn = document.querySelector('#zoneB .zb-row2 .zb-select[data-st-shell="' + name + '"]');
      if(!btn) return;
      btn.textContent = txt;
    };
    setLbl('surah', 'Surah');
    setLbl('verse',  'Verse');
    setLbl('juz',    _stJuz   ? ('Juz ' + _stJuz) : 'Juz');
    setLbl('hizb',   _stHizb  ? ('Hizb ' + _stHizb) : 'Hizb');
    setLbl('manzil', _stManzil? ('Manzil '+ _stManzil) : 'Manzil');
    setLbl('reciter', 'Reciter');
    var tCount = Object.keys(_stTrans || {}).filter(function(k){ return _stTrans[k]; }).length;
    setLbl('translation', tCount ? ('Translation · ' + tCount) : 'Translation');
  };

  function _stShellBmkRefresh(){
    var btn = document.getElementById('st-shell-bmk');
    if(!btn) return;
    var auth = window.GoldArkAuth;
    var count = (auth && auth.isSignedIn && auth.isSignedIn()) ? (auth.getBookmarks ? auth.getBookmarks().length : 0) : 0;
    var hasAny = count > 0;
    btn.textContent = '★ BOOKMARKS' + (hasAny ? ' (' + count + ')' : '');
    btn.title = hasAny ? ('View my ' + count + ' bookmark(s)') : 'No bookmarks yet';
    btn.classList.toggle('zb-active', hasAny);
  }
  window._stShellBmkRefresh = _stShellBmkRefresh;

  // Wire shell's Zone B controls — START spec.
  function _wireZoneB(zoneBEl){
    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    var row1 = zoneBEl.querySelector('.zb-row1');
    if(!row2) return;

    var bindings = [
      { label:'Surah',       name:'surah',       items:_stItemsSurah,       multi:false, searchable:true,  isSelected:function(v){ return v === _stSurah; }, onPick:function(v){ _stSelectSurah(v); _stShellRefreshLabels(); } },
      { label:'Verse',       name:'verse',       items:_stItemsVerse,       multi:false, searchable:true,  isSelected:function(v){ return false; },          onPick:function(v){ _stShellScrollToVerse(v); _stShellRefreshLabels(); } },
      { label:'Juz',         name:'juz',         items:_stItemsJuz,         multi:false, searchable:false, isSelected:function(v){ return v === _stJuz; },   onPick:function(v){ _stSelectJuz(v); _stShellRefreshLabels(); } },
      { label:'Hizb',        name:'hizb',        items:_stItemsHizb,        multi:false, searchable:false, isSelected:function(v){ return v === _stHizb; },  onPick:function(v){ _stSelectHizb(v); _stShellRefreshLabels(); } },
      { label:'Manzil',      name:'manzil',      items:_stItemsManzil,      multi:false, searchable:false, isSelected:function(v){ return v === _stManzil; },onPick:function(v){ _stSelectManzil(v); _stShellRefreshLabels(); } },
      { label:'Reciter',     name:'reciter',     items:_stItemsReciter,     multi:false, searchable:true,  isSelected:function(v){ return v === _stCurrentReciter; }, onPick:function(v){ var r = (_stReciters||[]).find(function(x){return x.id===v;}); _stSelectReciter(v, r && r.name); _stShellRefreshLabels(); } },
      { label:'Translation', name:'translation', items:_stItemsTranslation, multi:true,  searchable:true,  isSelected:function(v){ return !!_stTrans[v]; },  onPick:function(v){ _stToggleTrans(v); _stShellRefreshLabels(); } }
    ];

    Array.prototype.slice.call(row2.querySelectorAll('.zb-select')).forEach(function(btn){
      var lbl = (btn.textContent || '').replace(/[▾▼]/g,'').trim();
      var b = bindings.find(function(x){ return x.label === lbl; });
      if(!b) return;
      btn.setAttribute('data-st-shell', b.name);

      // Translation pill → rich language-grouped picker (shared with MY VIEW Step 2).
      if(b.name === 'translation' && typeof _stRenderRichTrans === 'function'){
        btn.addEventListener('click', function(e){
          e.stopPropagation();
          var panel = _stShellEnsurePanel('translation');
          panel.classList.add('st-trans-rich');
          panel.style.width = '560px';
          panel.style.maxWidth = '90vw';
          panel.style.maxHeight = '70vh';
          panel.style.overflowY = 'auto';
          panel.style.padding = '14px';
          panel.style.background = '#0e1420';
          panel.style.border = '1px solid rgba(212,175,55,0.55)';
          panel.style.borderRadius = '8px';
          panel.style.fontFamily = 'Lato,sans-serif';
          panel.style.fontSize = '13px';
          panel.style.color = '#E5E7EB';
          _stRenderRichTrans(panel, {
            getSel: function(){ return Object.keys(_stTrans).filter(function(k){ return _stTrans[k]; }); },
            onChange: function(slugs){
              Object.keys(_stTrans).forEach(function(k){ delete _stTrans[k]; });
              slugs.forEach(function(s){
                _stTrans[s] = true;
                if(typeof _ST_EMBED_MAP !== 'undefined' && !_ST_EMBED_MAP[s]
                    && typeof _stLoadFileTrans === 'function' && typeof _stSurah !== 'undefined'){
                  try{ _stLoadFileTrans(s, _stSurah); }catch(err){}
                }
              });
              if(typeof _stPersistTransMulti === 'function') _stPersistTransMulti();
              if(typeof _stRenderSurah === 'function') _stRenderSurah();
              if(typeof _stUpdateTransLabel === 'function') _stUpdateTransLabel();
              if(typeof _stShellRefreshLabels === 'function') _stShellRefreshLabels();
            }
          });
          _stShellOpenPanel('translation', btn);
        });
        return;
      }

      btn.addEventListener('click', function(e){
        e.stopPropagation();
        _stShellRender(b.name, b.items(), { multi:b.multi, searchable:b.searchable, isSelected:b.isSelected, onPick:b.onPick });
        _stShellOpenPanel(b.name, btn);
      });
    });

    // MY VIEW toggle button + edit pill (left side of row 1)
    if(row1 && !row1.querySelector('.st-myview-btn')){
      var mvWrap = document.createElement('div');
      mvWrap.style.cssText = 'display:flex;gap:4px;margin-right:10px;align-items:center';
      var mvBtn = document.createElement('button');
      mvBtn.className = 'zb-pill st-myview-btn';
      mvBtn.textContent = 'MY VIEW';
      mvBtn.title = 'Toggle My View on/off';
      mvBtn.addEventListener('click', function(){ if(typeof window._stMyViewToggle === 'function') window._stMyViewToggle(); });
      var mvEdit = document.createElement('button');
      mvEdit.className = 'zb-pill st-myview-edit';
      mvEdit.textContent = '✎';
      mvEdit.title = 'Edit My View preferences';
      mvEdit.style.cssText = 'min-width:32px;padding:0 8px';
      mvEdit.addEventListener('click', function(e){ e.stopPropagation(); if(typeof window._stOpenPrefs === 'function') window._stOpenPrefs(); });
      mvWrap.appendChild(mvBtn);
      mvWrap.appendChild(mvEdit);
      row1.insertBefore(mvWrap, row1.firstChild);
      setTimeout(_stRefreshMyViewBtn, 50);
    }
    // Row 1 pills.
    if(row1){
      var pillRoot = row1;
      Array.prototype.slice.call(pillRoot.querySelectorAll('.zb-pill')).forEach(function(pill){
        var t = (pill.textContent || '').trim();
        if(t === 'A−'){
          pill.addEventListener('click', function(e){
            if(typeof _stFontAdj === 'function') _stFontAdj(-2);
            pill.classList.remove('zb-active');
            pill.blur();
          });
        } else if(t === 'A+'){
          pill.addEventListener('click', function(e){
            if(typeof _stFontAdj === 'function') _stFontAdj(2);
            pill.classList.remove('zb-active');
            pill.blur();
          });
        }
        else if(t === 'ع' || t === 'ع | T' || t === 'T'){
          var mode = (t === 'ع') ? 'arabic' : (t === 'T' ? 'trans' : 'both');
          pill.addEventListener('click', function(){
            if(typeof _stSetMode === 'function') _stSetMode(mode);
            // Flip .zb-active on all three column-mode pills.
            pillRoot.querySelectorAll('.zb-pill').forEach(function(p){
              var pt = (p.textContent || '').trim();
              if(pt === 'ع' || pt === 'ع | T' || pt === 'T'){
                var pmode = (pt === 'ع') ? 'arabic' : (pt === 'T' ? 'trans' : 'both');
                p.classList.toggle('zb-active', pmode === mode);
              }
            });
          }, { passive:true });
        }
        else if(t === 'DIVE')      pill.addEventListener('click', function(){ if(typeof _dvSetMode==='function') _dvSetMode(!window._stDive); pill.classList.toggle('zb-active', !!window._stDive); });
      });

      try {
        pillRoot.querySelectorAll('.zb-pill').forEach(function(p){
          var pt = (p.textContent || '').trim();
          if(pt === 'ع' || pt === 'ع | T' || pt === 'T'){
            var pmode = (pt === 'ع') ? 'arabic' : (pt === 'T' ? 'trans' : 'both');
            p.classList.toggle('zb-active', pmode === _stMode);
          }
        });
      } catch(e){}
    }

    var searchSlot = row1 ? row1.querySelector('.zb-slot-search') : null;
    if(searchSlot){
      searchSlot.innerHTML = '';
      var bmkBtn = document.createElement('button');
      bmkBtn.id = 'st-shell-bmk';
      bmkBtn.type = 'button';
      bmkBtn.className = 'zb-pill';
      bmkBtn.style.marginLeft = '8px';
      bmkBtn.addEventListener('click', function(){
        if(typeof window.requireTester === 'function'){
          window.requireTester('bookmarks', function(){ if(typeof _stBmkPopup === 'function') _stBmkPopup(); });
        } else if(typeof _stBmkPopup === 'function'){
          _stBmkPopup();
        }
      });
      searchSlot.appendChild(bmkBtn);
      _stShellBmkRefresh();
    }

    _stShellRefreshLabels();

    try {
      var spacer = row2 ? row2.querySelector('.zb-slot-spacer') : null;
      var recBtn = row2 ? row2.querySelector('.zb-select[data-st-shell="reciter"]') : null;
      var trBtn  = row2 ? row2.querySelector('.zb-select[data-st-shell="translation"]') : null;
      if(spacer && recBtn) row2.insertBefore(recBtn, spacer.nextSibling);
      if(spacer && trBtn)  row2.appendChild(trBtn);
    } catch(e){}
  }

  function animateStart(){
    // Zone D "PLAY SURAH" → start whole-surah audio.
    try { if(typeof _stSurahPlayClick === 'function') _stSurahPlayClick(); } catch(e){}
  }
  function animatePause(){
    try {
      if(window.QuranAudio && typeof window.QuranAudio.pause === 'function') window.QuranAudio.pause();
    } catch(e){}
    window._stSurahPlayMode = false;
  }
  function animateSetSpeed(label){ /* surah play has no speed concept — no-op */ }

  function showHtw(){
    var body =
      'START — Read the Quran.\n\n' +
      'Use Surah / Juz / Hizb / Manzil to navigate. Reciter picks the audio voice. ' +
      'Translation switches the side-by-side text. Verse jumps to a specific ayah. ' +
      'A− / A+ adjust font size. ع / ع|T / T switch column layout. ' +
      'DIVE opens scholastic mode (word-by-word, tafsir, multiple translations).\n\n' +
      'Zone D PLAY SURAH plays the full surah with the chosen reciter.\n\n' +
      'Sources: tanzil.net · Saheeh International · qurancomplex.gov.sa';
    if(typeof window.openModal === 'function') window.openModal('How This Works — START', body);
  }

  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;
    document.body.classList.add('st-mounted');
    zoneCEl.innerHTML = '<div id="start-view" style="display:flex;flex-direction:column;flex:1"></div>';
    if(typeof _stInited !== 'undefined') _stInited = false;
    // PHASE 2: force HYBRID mode on entry. Arabic-only and translation-only parked.
    _stMode = 'both';
    document.body.classList.remove('st-mode-arabic','st-mode-translation');
    document.body.classList.add('st-mode-hybrid');
    if(typeof initStart === 'function') initStart();
    _wireZoneB(zoneBEl);
    // Show resume-reading pill if progress exists and user isn't already there.
    setTimeout(function(){ try { _stRenderResumePill(); } catch(e){} }, 600);
    // Re-render the pill on auth state change (sign in / out).
    if(window.GoldArkAuth && typeof window.GoldArkAuth.onStateChange === 'function' && !window._stProgressAuthBound){
      window._stProgressAuthBound = true;
      window.GoldArkAuth.onStateChange(function(){
        setTimeout(function(){ try { _stRenderResumePill(); } catch(e){} }, 100);
      });
    }
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('st-mounted');
    document.body.classList.remove('st-active');
    document.body.classList.remove('st-dive-on');

    // Pause any in-flight audio so playback stops with the view.
    try {
      if(window.QuranAudio && typeof window.QuranAudio.pause === 'function'){
        window.QuranAudio.pause();
      }
      // Hard-stop the underlying <audio> element if QuranAudio injected one.
      var au = document.getElementById('qa-primary');
      if(au){ try { au.pause(); au.removeAttribute('src'); au.load(); } catch(e) {} }
    } catch(e) {}

    // Reset surah-play mode.
    window._stSurahPlayMode = false;

    // Drop floating overlays + popups appended to document.body.
    var bp = document.getElementById('st-bmk-popup'); if(bp) bp.remove();

    // Reset _stInited so the next mount rebuilds DOM cleanly.
    if(typeof _stInited !== 'undefined') _stInited = false;

    try {
      Object.keys(_stShellPanels).forEach(function(n){ if(_stShellPanels[n] && _stShellPanels[n].parentNode) _stShellPanels[n].parentNode.removeChild(_stShellPanels[n]); });
      _stShellPanels = {};
      _stShellOpen = null;
    } catch(e){}

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return { mount: mount, unmount: unmount, animateStart: animateStart, animatePause: animatePause, animateSetSpeed: animateSetSpeed, showHtw: showHtw };
})();

/* Translation-only RTL detection: toggle body.st-trans-rtl based on the
   active translation's script. Uses the same RTL_LANGS list as MY VIEW.
   Guarded against observer feedback loops: only toggles when desired
   state differs from current, and a busy flag suppresses mutations
   triggered by our own classList change. */
window._stUpdateTransRtl = function(){
  try {
    var b = document.body;
    var want = false;
    if(b.classList.contains('st-mode-translation')){
      var RTL = {ar:1,ur:1,fa:1,ps:1,sd:1,ug:1,he:1,iw:1,ku:1,dv:1,prs:1,ckb:1};
      var slug = null;
      if(typeof _stTrans !== 'undefined' && _stTrans){
        var keys = Object.keys(_stTrans).filter(function(k){ return _stTrans[k]; });
        slug = keys[0];
      }
      if(slug){
        var entry = (typeof _stMyViewFindTrans === 'function') ? _stMyViewFindTrans(slug) : null;
        var lc = entry ? ((entry.lang_code || entry.lang || '') + '').toLowerCase() : '';
        want = !!RTL[lc];
      }
    }
    var has = b.classList.contains('st-trans-rtl');
    if(want === has) return; // no-op — prevents observer feedback loop
    window._stRtlObserverBusy = true;
    if(want) b.classList.add('st-trans-rtl');
    else b.classList.remove('st-trans-rtl');
    window._stRtlObserverBusy = false;
  } catch(e) { window._stRtlObserverBusy = false; }
};
(function(){
  function init(){
    if(!document.body) { setTimeout(init, 100); return; }
    if(window._stRtlObserver) return;
    window._stRtlObserver = new MutationObserver(function(){
      if(window._stRtlObserverBusy) return; // ignore our own writes
      window._stUpdateTransRtl();
    });
    window._stRtlObserver.observe(document.body, {attributes:true, attributeFilter:['class']});
    window._stUpdateTransRtl();
  }
  init();
})();

})(); // close outer StartView wrapper
