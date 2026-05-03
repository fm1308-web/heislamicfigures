/* ── APP Namespace ── */
var APP = window.APP || {};
APP.Features = {
  SMART_FILTERING: true,
  SEARCH: true,
  FAVORITES: false,
  SHUFFLE: false,
  LINEAGE_NAV: false,
  ANIMATIONS: true,
  isEnabled: function(key) {
    try {
      var p = new URLSearchParams(window.location.search).get('features');
      if (p) return p.split(',').includes(key);
    } catch(e) {}
    return !!APP.Features[key];
  }
};

/* ── Language toggle for multilingual names ── */
APP._lang = 'en';
APP._RTL_LANGS = new Set(['ar', 'fa', 'ur', 'ps', 'sd', 'ckb']);
APP._LANG_LABELS = {
  en: 'English', ar: 'العربية', fa: 'فارسی', tr: 'Türkçe',
  ur: 'اردو', ms: 'Bahasa Melayu', id: 'Bahasa Indonesia',
  fr: 'Français', de: 'Deutsch', es: 'Español',
  hi: 'हिन्दी', bn: 'বাংলা', zh: '中文', ja: '日本語',
  ko: '한국어', ru: 'Русский', sw: 'Kiswahili',
  ha: 'Hausa', ta: 'தமிழ்', tt: 'Татарча'
};
APP.getDisplayName = function(p) {
  if (!p) return '';
  if (APP._lang === 'en') return p.famous || '';
  if (p.names_i18n && p.names_i18n[APP._lang]) return p.names_i18n[APP._lang];
  return p.famous || '';
};
APP.isRTL = function() { return APP._RTL_LANGS.has(APP._lang); };

APP.safeInit = function(name, fn) {
  try { fn(); console.log('[APP] ' + name + ' ✓'); }
  catch(e) { console.warn('[APP] ' + name + ' failed — continuing', e); }
};
window.onerror = function(msg, src, line) {
  console.warn('[APP Error]', msg, 'line', line);
  return false;
};

// ═══════════════════════════════════════════════════════════
// FAVORITES MODULE
// ═══════════════════════════════════════════════════════════
APP.filterFavsOnly = false;

APP.safeInit('Favorites', function() {
  var STORE_KEY = 'islamic_app_favorites_v1';
  var _storage = (function() {
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      return localStorage;
    } catch(e) {
      var _mem = {};
      return {
        getItem:    function(k)    { return _mem[k] || null; },
        setItem:    function(k, v) { _mem[k] = v; },
        removeItem: function(k)    { delete _mem[k]; }
      };
    }
  })();

  function _load() {
    try { return new Set(JSON.parse(_storage.getItem(STORE_KEY) || '[]')); }
    catch(e) { return new Set(); }
  }
  function _save(set) {
    try { _storage.setItem(STORE_KEY, JSON.stringify([...set])); }
    catch(e) { console.warn('[APP] Favorites save failed', e); }
  }

  var _favs = _load();

  APP.Favorites = {
    has:    function(name) { return _favs.has(name); },
    toggle: function(name) {
      if (_favs.has(name)) _favs.delete(name);
      else _favs.add(name);
      _save(_favs);
      return _favs.has(name);
    },
    list:   function() { return [..._favs]; },
    count:  function() { return _favs.size; }
  };

  console.log('[APP] Favorites loaded:', _favs.size, 'saved');
});

function _updateFavFilterBtn() {
  if (!APP.Favorites) return;
  var n = APP.Favorites.count();
  var html = '★ SAVED' + (n > 0
    ? ' <span style="color:#D4AF37;font-size:var(--fs-3)">(' + n + ')</span>'
    : '');
  ['favFilterBtn','sl-favFilterBtn','map-favFilterBtn'].forEach(function(id){
    var btn = document.getElementById(id);
    if(btn) btn.innerHTML = html;
  });
}

function toggleFavFilter() {
  APP.filterFavsOnly = !APP.filterFavsOnly;
  ['favFilterBtn','sl-favFilterBtn','map-favFilterBtn'].forEach(function(id){
    var btn = document.getElementById(id);
    if(btn) btn.classList.toggle('filtered', APP.filterFavsOnly);
  });
  applyFilterAndFocus();
  if(VIEW==='map') _renderMarkers();
  if(VIEW==='silsila') renderSilsila();
  if(VIEW==='studyroom'&&typeof _buildStudySidebar==='function') _buildStudySidebar();
}

// ═══════════════════════════════════════════════════════════
// UNIVERSAL BADGE SYSTEM (S W F B T)
// ═══════════════════════════════════════════════════════════
const _TALK_NAMES=new Set(['Al-Ghazali','Ibn Arabi','Jalal al-Din Rumi','Ibn Khaldun']);
const _TALK_IDS={'Al-Ghazali':'ghazali','Ibn Arabi':'ibn-arabi','Jalal al-Din Rumi':'rumi','Ibn Khaldun':'ibn-khaldun'};
var _freeBkSlugs=null;
function _getFreeBkSlugs(){
  if(_freeBkSlugs) return _freeBkSlugs;
  _freeBkSlugs=new Set();
  var bd=window._BOOKS_DATA;
  if(bd&&bd.books) bd.books.forEach(function(b){if(b.is_free&&b.url) _freeBkSlugs.add(b.slug);});
  return _freeBkSlugs;
}
function getFigureBadges(slug,famous){
  var badges=[];
  if(typeof _SR_SLUG_MAP!=='undefined'&&_SR_SLUG_MAP[famous]) badges.push('S');
  if(window._wikidata&&window._wikidata[slug]&&window._wikidata[slug].wikipedia&&window._wikidata[slug].wikipedia.en) badges.push('W');
  if(window._journeyFigures&&window._journeyFigures.has(slug)) badges.push('F');
  if(_getFreeBkSlugs().has(slug)) badges.push('B');
  if(_TALK_NAMES.has(famous)) badges.push('T');
  return badges;
}
function _renderBadgesHtml(slug,famous,context){
  var badges=getFigureBadges(slug,famous);
  if(!badges.length) return '';
  var cls=context==='one'?'one-badge':'tl-badge';
  var html='';
  badges.forEach(function(b){
    if(b==='S'){
      var sSlug=_SR_SLUG_MAP[famous];
      html+='<span class="'+cls+'" onclick="event.stopPropagation();openStudyRoom(\''+sSlug+'\')" title="Study Room">S</span>';
    } else if(b==='W'){
      var wd=window._wikidata[slug].wikipedia.en;
      html+='<a class="'+cls+'" href="https://en.wikipedia.org/wiki/'+encodeURIComponent(wd.replace(/ /g,'_'))+'" target="_blank" rel="noopener" title="Wikipedia" onclick="event.stopPropagation()">W</a>';
    } else if(b==='F'){
      html+='<span class="'+cls+'" onclick="event.stopPropagation();window._followShowFigure(\''+slug+'\')" title="Follow Journey">F</span>';
    } else if(b==='B'){
      html+='<span class="'+cls+'" onclick="event.stopPropagation();window._badgeOpenBooks(\''+famous.replace(/'/g,"\\'")+'\',\''+slug+'\')" title="Free Books">B</span>';
    } else if(b==='T'){
      var tid=_TALK_IDS[famous]||'';
      html+='<span class="'+cls+'" onclick="event.stopPropagation();setView(\'talk\');setTimeout(function(){window._talkSelectScholar(\''+tid+'\')},100)" title="Talk">T</span>';
    }
  });
  return html;
}
window._badgeOpenBooks=function(famous,slug){
  if(typeof _booksFilter!=='undefined'){
    _booksFilter.author.clear();
    _booksFilter.author.add(famous);
  }
  setView('books');
};
window._badgeInvalidateBooks=function(){_freeBkSlugs=null;};

// ═══════════════════════════════════════════════════════════
// WIKIPEDIA IMAGE SUPPORT
// ═══════════════════════════════════════════════════════════
/* Figures who must NEVER show an image */
const NO_IMAGE_FIGURES = new Set([
  'Prophet Muhammad', 'Ibrahim', 'Musa', 'Isa', 'Dawud', 'Sulayman',
  'Yusuf', 'Yaqub', 'Ishaq', 'Ismail', 'Nuh', 'Adam', 'Idris',
  'Hud', 'Salih', 'Lut', 'Shuayb', 'Yunus', 'Ayyub', 'Ilyas',
  'Al-Yasa', 'Dhul-Kifl', 'Harun', 'Zakariyya', 'Yahya',
  'Fatimah al-Zahra', 'Aisha bint Abi Bakr', 'Khadijah bint Khuwaylid',
  'Khadija bint Khuwaylid', 'Ali ibn Abi Talib', 'Hasan ibn Ali',
  'Husayn ibn Ali'
]);

function canShowImage(person) {
  if (!person) return false;
  if (person.type === 'Prophet') return false;
  if (person.type === 'Founder') return false;
  if (NO_IMAGE_FIGURES.has(person.famous)) return false;
  if (!person.source || !person.source.includes('wikipedia.org')) return false;
  return true;
}

function fetchWikiImage(wikiUrl, imgEl, captionEl) {
  try {
    var url = new URL(wikiUrl);
    var title = decodeURIComponent(url.pathname.replace('/wiki/', ''));
    if (!title) return;
    var apiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
      + encodeURIComponent(title);
    fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (!data) return;
        var thumb = data.thumbnail || data.originalimage;
        if (thumb && thumb.source) {
          imgEl.src = thumb.source;
          imgEl.style.display = 'block';
          if (captionEl) captionEl.style.display = 'block';
        }
      })
      .catch(function() {});
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const MIN_YR=500,MAX_YR=2000;
const ALL_CENTS=[0,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]; // 0 = Pre-Islamic
const CC={6:'#d4600a',7:'#c04a08',8:'#a07800',9:'#5a8a00',10:'#007a5c',11:'#c87832',
          12:'#b86820',13:'#c8902a',14:'#a07828',15:'#a01030',16:'#a01030',17:'#a03000',
          18:'#8a5a00',19:'#4a7800',20:'#008050'};
function gc(y){if(y<600)return 6;if(y<700)return 7;if(y<800)return 8;if(y<900)return 9;
  if(y<1000)return 10;if(y<1100)return 11;if(y<1200)return 12;if(y<1300)return 13;
  if(y<1400)return 14;if(y<1500)return 15;if(y<1600)return 16;if(y<1700)return 17;
  if(y<1800)return 18;if(y<1900)return 19;return 20;}
function centLabel(c){return c===1?'1st':c===2?'2nd':c===3?'3rd':`${c}th`}

// Academic-date accessors: prefer scholarly-estimated years (matches what the info card shows).
// Used by Timeline centre column (sort, visibility filter, timescale, lifespans, tooltips).
function _dobOf(p) {
  return (p.dob_academic !== undefined && p.dob_academic !== null) ? p.dob_academic : p.dob;
}
function _dodOf(p) {
  return (p.dod_academic !== undefined && p.dod_academic !== null) ? p.dod_academic : p.dod;
}

// Single source of truth for Timeline row height, read from CSS var --row-h.
const ROW_H = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--row-h')) || 88;
const ROW_MID = ROW_H / 2;

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let PEOPLE=[],VIEW='timeline',activeYear=null,activePerson=null;
window.VIEW=VIEW;
let tlFocusName = null;
let _viewYears={timeline:null,silsila:null,map:null};
let selTypes=new Set(),selTrads=new Set(),searchQ='',selBadge='';
let _lastSortedPeople=[]; // tracks exactly the sorted array used in the last renderRows call

window._captureState_timeline=function(){
  return{types:Array.from(selTypes),trads:Array.from(selTrads),search:searchQ,year:activeYear};
};
window._restoreState_timeline=function(s){
  if(!s) return;
  selTypes=new Set(s.types||[]);selTrads=new Set(s.trads||[]);
  searchQ=s.search||'';
  var box=document.getElementById('search');if(box) box.value=searchQ;
  if(s.year!=null&&typeof _setSliderYear==='function') _setSliderYear(s.year);
  syncDD('type');syncDD('trad');applyFilterAndFocus();
};

// ── Figure history stack (in-app back navigation) ──
var _figureHistory=[];
var _figureHistoryMax=20;
function pushFigureHistory(name){
  if(_figureHistory.length&&_figureHistory[_figureHistory.length-1]===name) return;
  _figureHistory.push(name);
  if(_figureHistory.length>_figureHistoryMax) _figureHistory.shift();
  _updateBackBtn();
}
function popFigureHistory(){
  if(_figureHistory.length<2) return null;
  _figureHistory.pop();
  var prev=_figureHistory[_figureHistory.length-1];
  _updateBackBtn();
  return prev;
}
function _updateBackBtn(){
  var btn=document.getElementById('figureBackBtn');
  if(btn) btn.style.display=_figureHistory.length>1?'inline-flex':'none';
}
let CW=[0,6,7]; // Default: PRE-ISLAMIC | 6TH C. | 7TH C.
let centIdx=1; // Index of 6 in ALL_CENTS=[0,6,7,...]

// ═══════════════════════════════════════════════════════════
// LAZY-LOAD DETAIL CHUNKS
// ═══════════════════════════════════════════════════════════
const _SUFI_ORDER_TRADS=new Set([
  'Naqshbandiyya','Shadhiliyya','Qadiriyya','Chishti',
  'Suhrawardiyya','Mawlawiyya','Qalandari','Yeseviyya',
  'Kubrawiyya','Badawiyya','Burhaniyya','Akbarian',
  'Ishraqiyya','Sindhi/Punjabi Sufism'
]);
function getChunkName(p){
  const t=p.type||'', tr=p.tradition||'';
  if(t==='Prophet'||t==='Founder') return 'lineage';
  if(t==='Sahaba') return 'sahaba';
  if(t==='Sahabiyya') return 'sahabiyya';
  if(t==="Tabi'un") return 'tabiun';
  if(t==='Ruler'||t==='Caliph') return 'rulers';
  if(t==='Poet') return 'poets';
  if(t==='Philosopher') return 'philosophy';
  if(t==='Scientist') return 'sciences';
  if(t==='Mystic') return _SUFI_ORDER_TRADS.has(tr)?'sufis-orders':'sufis-early';
  if(tr==='Hadith Sciences') return 'hadith';
  if(tr==='Early Ascetics'||tr==='Khorasan School'||tr==='Baghdad School') return 'sufis-early';
  return 'scholars';
}

const _detailCache={};   // chunk name -> array of detail records
const _detailLoading={}; // chunk name -> promise (in-flight)

async function _loadChunk(chunk){
  if(_detailCache[chunk]) return _detailCache[chunk];
  if(_detailLoading[chunk]) return _detailLoading[chunk];
  _detailLoading[chunk]=(async()=>{
    try{
      const r=await fetch(`data/islamic/details/${chunk}.json?v=${Date.now()}`);
      if(!r.ok) throw new Error(r.status);
      const arr=await r.json();
      _detailCache[chunk]=arr;
      delete _detailLoading[chunk];
      return arr;
    }catch(_){
      _detailCache[chunk]=[];
      delete _detailLoading[chunk];
      return [];
    }
  })();
  return _detailLoading[chunk];
}

async function _ensureDetails(p){
  if(p._detailLoaded) return p;
  const chunk=getChunkName(p);
  const arr=await _loadChunk(chunk);
  const det=arr.find(d=>d.famous===p.famous);
  if(det){
    if(det.school) p.school=det.school;
    if(det.books)  p.books=det.books;
    if(det.parents)  p.parents=det.parents;
    if(det.children) p.children=det.children;
    if(det.spouses)  p.spouses=det.spouses;
    if(det.quotes) p.quotes=det.quotes;
    if(det.quranDetail) p.quranDetail=det.quranDetail;
  }
  p._detailLoaded=true;
  return p;
}

// Wrapper functions — use these instead of calling renderInfo / openSilsilaCard / _openMapCard directly from click handlers
async function renderInfoWithDetails(p){
  await _ensureDetails(p);
  renderInfo(p);
  pushFigureHistory(p.famous);
}
async function openSilsilaCardWithDetails(p,cx,cy){
  await _ensureDetails(p);
  openSilsilaCard(p,cx,cy);
}
async function showMapCardWithDetails(p,cx,cy){
  await _ensureDetails(p);
  _openMapCard(p,cx,cy);
}

// ═══════════════════════════════════════════════════════════
// TILE NAV
// ═══════════════════════════════════════════════════════════
function _tileNavInit(){
  document.querySelectorAll('.hdr-tile').forEach(function(btn){
    btn.addEventListener('click',function(){
      setView(btn.dataset.view);
    });
  });
}
function _tileNavSync(v){
  document.querySelectorAll('.hdr-tile').forEach(function(btn){
    btn.classList.toggle('active',btn.dataset.view===v);
  });
}


// ═══════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════
async function boot(){
  try{const r=await fetch(dataUrl('data/islamic/core.json'));PEOPLE=await r.json();}
  catch(e){try{const r=await fetch('./data/islamic/core.json?v=fixture1');PEOPLE=await r.json();}catch(_){PEOPLE=[];}}

  try{const r=await fetch(dataUrl('data/islamic/name_variants.json'));window._NAME_VARIANTS=await r.json();}
  catch(e){window._NAME_VARIANTS={};}

  try{const r=await fetch(dataUrl('data/islamic/figure_sources.json'));window._FIGURE_SOURCES=await r.json();}
  catch(e){try{const r=await fetch('./data/islamic/figure_sources.json?v=fixture1');window._FIGURE_SOURCES=await r.json();}catch(_){window._FIGURE_SOURCES={};}}

  try{const r=await fetch(dataUrl('data/islamic/events/master.json'));window.eventsData=await r.json();}
  catch(e){window.eventsData=[];}

  // Event ID → Name lookup. Loaded once at boot, cached on window.
  window._eventNameLookup = {};
  fetch(dataUrl('data/islamic/event_id_to_name.json'))
    .then(function(r){ return r.ok ? r.json() : {}; })
    .then(function(j){ window._eventNameLookup = j || {}; console.log('[GoldArk] event name lookup loaded:', Object.keys(window._eventNameLookup).length); })
    .catch(function(e){ console.warn('[GoldArk] event name lookup failed', e); });

  // Quran cross-references: figure → [{surah, verse_start, verse_end, ref_text}, ...]
  try{
    const r=await fetch(dataUrl('data/islamic/quran/quran_xref.json'));
    const xref=await r.json();
    window.QURAN_XREF=xref;
    const bySlug={};
    (xref.figure_refs||[]).forEach(ref=>{
      if(!ref.slug) return;
      (bySlug[ref.slug]=bySlug[ref.slug]||[]).push({
        surah:ref.surah, verse_start:ref.verse_start, verse_end:ref.verse_end, ref_text:ref.ref_text
      });
    });
    Object.keys(bySlug).forEach(k=>bySlug[k].sort((a,b)=>(a.surah-b.surah)||(a.verse_start-b.verse_start)));
    window.QURAN_XREF_BY_SLUG=bySlug;
  } catch(e){ window.QURAN_XREF={}; window.QURAN_XREF_BY_SLUG={}; }

  // One-time click delegation for .quran-chip buttons anywhere in the app (info card now, elsewhere later).
  if(!window._quranChipDelegated){
    document.addEventListener('click', function(e){
      const chip=e.target.closest('.quran-chip');
      if(!chip) return;
      e.stopPropagation();
      const surah=+chip.dataset.surah;
      const vstart=+chip.dataset.vstart;
      const vend=+chip.dataset.vend;
      if(typeof window.openStartAtVerse==='function') window.openStartAtVerse(surah, vstart, vend);
    });
    window._quranChipDelegated=true;
  }

  const his=PEOPLE.filter(p=>p.dob>=550);
  if(his.length){
    const mn=Math.min(...his.map(p=>p.dob));
    const mx=Math.max(...PEOPLE.map(p=>(p.dod||p.dob)).filter(y=>y<2100));
    try{document.getElementById('hdrStatFigures').textContent=PEOPLE.length.toLocaleString();}catch(e){}
    const relCount=PEOPLE.reduce((s,p)=>s+(p.teachers?.length||0)+(p.relations?.length||0),0);
    try{document.getElementById('hdrStatRelations').textContent=relCount.toLocaleString();}catch(e){}

    // Count books from books.json (total + free reads)
    fetch(dataUrl('data/islamic/books.json')).then(function(r){return r.json();}).then(function(d){
      if(!window._BOOKS_DATA) window._BOOKS_DATA=d;
      if(typeof window._badgeInvalidateBooks==='function') window._badgeInvalidateBooks();
      var books=(d&&d.books)||[];
      try{document.getElementById('hdrStatBooks').textContent=books.length.toLocaleString();}catch(e){}
      var freeCount=books.filter(function(b){return b.is_free===true;}).length;
      try{document.getElementById('hdrStatFreeReads').textContent=freeCount.toLocaleString();}catch(e){}
    }).catch(function(){});

    // Study writers count
    try{
      if(typeof _SR_SCHOLARS!=='undefined') document.getElementById('hdrStatStudyWriters').textContent=Object.keys(_SR_SCHOLARS).length.toLocaleString();
    }catch(e){}

  }

  // Sort types and traditions by the earliest DOB of any person in that group
  // This ensures Prophet comes first (Adam ~4000 BCE), then Founders, Sahaba etc.
  function chronoSort(values, field){
    const earliest = {};
    values.forEach(v => {
      const members = PEOPLE.filter(p => p[field] === v);
      earliest[v] = members.length ? Math.min(...members.map(p => p.dob)) : 9999;
    });
    return [...values].sort((a,b) => earliest[a] - earliest[b]);
  }
  const types = chronoSort([...new Set(PEOPLE.map(p=>p.type).filter(Boolean))], 'type');
  // Inject tag-based virtual types that don't correspond to p.type
  // Place Ashra Mubashshara right after Sahaba (they are Sahaba/Caliphs)
  const sahabaIdx = types.indexOf('Sahaba');
  const insertAt = sahabaIdx >= 0 ? sahabaIdx + 1 : types.length;
  // Inject Prophetic Lineage as the 2nd type (right after Prophet)
  const _plIdx = types.indexOf('Prophet');
  if(!types.includes('Prophetic Lineage')) types.splice(_plIdx >= 0 ? _plIdx + 1 : 1, 0, 'Prophetic Lineage');

  types.splice(insertAt, 0, 'Ashra Mubashshara');
  // Inject Mujaddid tag-based virtual type (renewers of the faith)
  if(!types.includes('Mujaddid')) types.push('Mujaddid');
  // Inject IH sub-lane display names as virtual type filters
  IH_SUBLANE_ORDER.forEach(sl=>{ if(sl!=='Islamic History'&&!types.includes(sl)) types.push(sl); });
  const trads = chronoSort([...new Set(PEOPLE.map(p=>p.tradition).filter(Boolean))], 'tradition');
  buildDD('type',types); buildDD('trad',trads);
  buildSLDD('type',types); buildSLDD('trad',trads);

  setHeight(); window.addEventListener('resize',()=>{setHeight();if(VIEW==='map')_setMapHeight();});
  document.addEventListener('click',e=>{
    if(!e.target.closest('.dd-wrap')){
      document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
      document.querySelectorAll('.dd-btn.open').forEach(b=>b.classList.remove('open'));
    }
  });

  try{if(window._ensureWikidata) await window._ensureWikidata();}catch(e){}
  try{if(window._preloadJourneyIndex) await window._preloadJourneyIndex();}catch(e){}
  try{var _flEl=document.getElementById('hdrStatLives');if(_flEl&&window._journeyIndexCount)_flEl.textContent=window._journeyIndexCount.toLocaleString();}catch(e){}

  initSlider();
  initCentScrollbar();
  updateCentHeaders();
  updateCentScrollbar();
  // Default info card: Adam (first figure in scripture lineage) — card is always visible on Timeline
  if(!activePerson && PEOPLE.length){
    activePerson = PEOPLE.find(p=>p.famous==='Adam') || PEOPLE[0];
    renderInfoWithDetails(activePerson);
  }
  renderAll();

  _tileNavInit();
  _updateFavFilterBtn();
  // If silsila tab was already active (e.g. URL hash loaded) trigger render now
  if(VIEW==='silsila') renderSilsila();

  // ── URL share restore (takes priority over hash) ──
  if(window.location.search&&typeof window._shareRestoreFromURL==='function'){
    window._shareRestoreFromURL();
  } else {
    // ── Browser history: set initial state ──
    history.replaceState({view:VIEW},'','#'+VIEW);
    var _bootHash=location.hash.replace('#','');
    if(_bootHash&&_bootHash!==VIEW){
      var _bhParts=_bootHash.split('/');
      var _bhView=_bhParts[0];
      setView(_bhView);
      if(_bhView==='talk'&&_bhParts[1]&&typeof window._talkSelectScholar==='function'){
        setTimeout(function(){window._talkSelectScholar(_bhParts[1]);},100);
      }
      if(_bhView==='one'&&_bhParts[1]&&typeof window._oneClickName==='function'){
        setTimeout(function(){window._oneClickName(decodeURIComponent(_bhParts[1]));},100);
      }
    }
  }

  // ── Run validators (non-blocking, logs only) ──
  try{
    var vk=Object.keys(window._validators||{});
    vk.forEach(function(k){try{window._validators[k]();}catch(e){console.warn('[validator:'+k+'] error',e);}});
  }catch(e){}
}

// ── Browser history: handle Back/Forward ──
window.addEventListener('popstate',function(e){
  window._popstateInProgress=true;
  var state=e.state;
  if(state&&state.view){
    setView(state.view);
    if(state.scholar&&typeof window._talkSelectScholar==='function'){
      window._talkSelectScholar(state.scholar);
    }
    if(state.view==='talk'&&!state.scholar&&typeof window._talkBack==='function'){
      window._talkBack();
    }
    if(state.figure){
      var idx=_lastSortedPeople.findIndex(function(p){return p.famous===state.figure;});
      if(idx>=0) selectRow(idx);
      if(state.view==='one'&&typeof window._oneClickName==='function'){
        window._oneClickName(state.figure);
      }
    }
  } else {
    setView('timeline');
  }
  window._popstateInProgress=false;
});

function setHeight(){
  const topBar=document.getElementById('topBar');
  const barH=topBar?topBar.offsetHeight:0;
  const fbar=document.getElementById('filterBar');
  const fbarH=(fbar && fbar.offsetParent !== null) ? fbar.offsetHeight : 0;
  const foot=document.querySelector('footer').offsetHeight;
  const ms=document.getElementById('mainShell');
  ms.style.marginTop=(barH+fbarH)+'px';
  ms.style.height=`calc(100vh - ${barH+fbarH+foot}px)`;
}
const _resizeShell=setHeight;

// ═══════════════════════════════════════════════════════════
// DROPDOWNS
// ═══════════════════════════════════════════════════════════
function buildDD(kind,values){
  const panel=document.getElementById(kind==='type'?'typePanel':'tradPanel');
  const si=document.createElement('input');
  si.type='text';si.className='dd-search';si.placeholder='Search...';
  si.oninput=function(){
    const q=si.value.toLowerCase();
    panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){
      el.style.display=el.innerText.toLowerCase().includes(q)?'':'none';
    });
  };
  panel.appendChild(si);
  values.forEach(v=>{
    const el=document.createElement('div');
    el.className='dd-item'; el.dataset.val=v;
    el.innerHTML=`<div class="dd-checkbox"></div><span>${v}</span>`;
    el.onclick=()=>ddToggle(kind,v); panel.appendChild(el);
  });
}
function toggleDD(kind){
  var panelId=kind==='type'?'typePanel':kind==='trad'?'tradPanel':kind==='badge'?'badgePanel':null;
  var btnId=kind==='type'?'typeBtn':kind==='trad'?'tradBtn':kind==='badge'?'badgeBtn':null;
  if(!panelId) return;
  const panel=document.getElementById(panelId);
  const btn=document.getElementById(btnId);
  const wasOpen=panel.classList.contains('open');
  document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.dd-btn.open').forEach(b=>b.classList.remove('open'));
  if(!wasOpen){
    panel.classList.add('open');btn.classList.add('open');
    var si=panel.querySelector('.dd-search');
    if(si){si.value='';si.dispatchEvent(new Event('input'));si.focus();}
  }
}
function ddClearAll(kind){
  const sel=kind==='type'?selTypes:selTrads;
  sel.clear(); syncDD(kind); applyFilterAndFocus();
}
function ddToggle(kind,v){
  const sel=kind==='type'?selTypes:selTrads;
  sel.has(v)?sel.delete(v):sel.add(v);
  syncDD(kind); applyFilterAndFocus();
}
function clearAllFilters(){
  selTypes.clear(); selTrads.clear(); selBadge='';
  syncDD('type'); syncDD('trad'); _syncBadgeDD();
  applyFilterAndFocus();
}
function _badgeSelect(val){
  selBadge=val;
  _syncBadgeDD();
  applyFilterAndFocus();
  document.querySelectorAll('.dd-panel.open').forEach(function(p){p.classList.remove('open');});
  document.querySelectorAll('.dd-btn.open').forEach(function(b){b.classList.remove('open');});
}
function _syncBadgeDD(){
  var btn=document.getElementById('badgeBtn');
  var panel=document.getElementById('badgePanel');
  if(!btn||!panel) return;
  panel.querySelectorAll('.dd-item').forEach(function(item){
    item.classList.toggle('selected',item.dataset.val===selBadge);
    var ck=item.querySelector('.dd-checkbox');
    if(ck) ck.textContent=item.dataset.val===selBadge?'✓':'';
  });
  var labelSpan=btn.querySelector('span');
  if(selBadge){
    var labels={'S':'Study','W':'Wiki','F':'Follow','B':'Books','T':'Talk'};
    if(labelSpan) labelSpan.textContent=labels[selBadge]||'HAS';
    btn.classList.add('filtered');
    var oldX=btn.querySelector('.dd-clear-x');
    if(oldX) oldX.remove();
    var xEl=document.createElement('span');
    xEl.className='dd-clear-x';
    xEl.textContent='\u00D7';
    xEl.onclick=function(e){e.stopPropagation();_badgeSelect('');};
    btn.appendChild(xEl);
  } else {
    if(labelSpan) labelSpan.textContent='HAS';
    btn.classList.remove('filtered');
    var oldX2=btn.querySelector('.dd-clear-x');
    if(oldX2) oldX2.remove();
  }
  updateFilterSummary();
}
function syncDD(kind){
  const sel=kind==='type'?selTypes:selTrads;
  const panel=document.getElementById(kind==='type'?'typePanel':'tradPanel');
  const cnt=document.getElementById(kind==='type'?'typeCount':'tradCount');
  const allCk=document.getElementById(kind==='type'?'typeAllCk':'tradAllCk');
  const btn=document.getElementById(kind==='type'?'typeBtn':'tradBtn');
  const dot=document.getElementById(kind==='type'?'typeDot':'tradDot');

  panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(item=>{
    const on=sel.has(item.dataset.val);
    item.classList.toggle('selected',on);
    item.querySelector('.dd-checkbox').textContent=on?'✓':'';
  });
  allCk.textContent=sel.size===0?'✓':'';

  if(sel.size>0){
    cnt.textContent=sel.size; cnt.style.display='';
    btn.classList.add('filtered');
    dot.style.display='inline-block';
  } else {
    cnt.style.display='none';
    btn.classList.remove('filtered');
    dot.style.display='none';
  }

  // Inline × clear button
  var oldX=btn.querySelector('.dd-clear-x');
  if(oldX) oldX.remove();
  if(sel.size>0){
    var xEl=document.createElement('span');
    xEl.className='dd-clear-x';
    xEl.textContent='\u00D7';
    xEl.onclick=function(e){e.stopPropagation();ddClearAll(kind);applyFilterAndFocus();};
    btn.appendChild(xEl);
  }

  // Update summary label
  updateFilterSummary();
}
function updateFilterSummary(){
  const parts=[];
  if(selTypes.size>0) parts.push([...selTypes].join(', '));
  if(selTrads.size>0) parts.push([...selTrads].join(', '));
  if(selBadge) parts.push('Has: '+{S:'Study',W:'Wiki',F:'Follow',B:'Books',T:'Talk'}[selBadge]);
  const sumEl=document.getElementById('filterSummary');
  const clrEl=document.getElementById('filterClearAll');
  if(parts.length>0){
    sumEl.textContent='↳ '+parts.join(' · ');
    sumEl.classList.add('visible');
    clrEl.classList.add('visible');
  } else {
    sumEl.classList.remove('visible');
    clrEl.classList.remove('visible');
  }
}
function onSearch(){searchQ=document.getElementById('search').value.trim();applyFilterAndFocus();}
function _toggleSearchClear(){
  var i=document.getElementById('search');
  var b=document.getElementById('searchClearBtn');
  if(!i||!b) return;
  b.style.visibility = i.value.length>0 ? 'visible' : 'hidden';
}
function _clearSearchBox(){
  var i=document.getElementById('search');
  if(!i) return;
  i.value='';
  onSearch();
  _toggleSearchClear();
  i.focus();
}

// ═══════════════════════════════════════════════════════════
// FILTER
// ═══════════════════════════════════════════════════════════
// Full Adam→Muhammad prophetic lineage chain (50 members).
// Verified against lineage_adam_to_muhammad_FINAL.xlsx — 27 Mar 2026.
// Used by isLineageMember() for Silsila lane assignment and type filtering.
const LINEAGE_CHAIN=[
  'Adam','Shith ibn Adam','Yanash','Qaynan ibn Anush','Mahlail ibn Qaynan',
  'Yared ibn Mahlail','Idris','Mattushalakh ibn Idris','Lamak ibn Mattushalakh','Nuh',
  'Sam ibn Nuh','Arfakhshadh ibn Sam','Shalikh ibn Arfakhshadh','Abir ibn Shalikh',
  "Faligh ibn Abir","Ra'u ibn Faligh","Sarugh ibn Ra'u",'Nahur ibn Sarugh',
  'Azar ibn Nahur','Ibrahim','Ismail','Nabit ibn Ismail',
  'Yashjub ibn Nabit',"Ya'rub ibn Yashjub","Tayrah ibn Ya'rub",'Nahur ibn Tayrah',
  'Muqawwam ibn Nahur','Udd ibn Muqawwam',
  'Adnan',"Ma'ad ibn Adnan","Nizar ibn Ma'ad",'Mudar ibn Nizar','Ilyas ibn Mudar',
  'Mudrikah ibn Ilyas','Khuzayma ibn Mudrikah','Kinana ibn Khuzayma',
  'al-Nadr ibn Kinana','Malik ibn al-Nadr','Fihr ibn Malik','Ghalib ibn Fihr',
  "Lu'ayy ibn Ghalib","Ka'b ibn Lu'ayy","Murrah ibn Ka'b",'Kilab ibn Murrah',
  'Qusayy ibn Kilab','Abd Manaf ibn Qusayy','Hashim ibn Abd Manaf',
  'Abd al-Muttalib ibn Hashim','Abd Allah ibn Abd al-Muttalib','Prophet Muhammad'
];
const PROPHET_CHAIN = new Set(LINEAGE_CHAIN);

// The ten Companions promised Paradise — hardcoded for virtual type filter
const ASHRA_MUBASHSHARA = new Set([
  'Abu Bakr al-Siddiq','Umar ibn al-Khattab','Uthman ibn Affan','Ali ibn Abi Talib',
  'Talha ibn Ubayd Allah','Zubayr ibn al-Awwam','Abd al-Rahman ibn Awf',
  "Sa'd ibn Abi Waqqas","Sa'id ibn Zayd",'Abu Ubayda ibn al-Jarrah'
]);

// Silsila global state — built once by renderSilsila()
let SL_NM={};        // name → {x, y, li, col}
let SL_STUDENTS={};  // name → [student famous names]
let SL_EDGES=[];     // [{from, to, col, d}] — stored as data, rendered on demand
let SL_HOVERED=null; // currently hovered person name (for hover-dim logic)
let SL_ALL_LANES=[];  // full tradition lane list, built once from PEOPLE
let SL_LANES_KEY='';  // fingerprint of currently-rendered lanes — drives re-render on filter change

function getFiltered(){
  return PEOPLE.filter(p=>{
    if(selTypes.size>0){
      const passType = selTypes.has(p.type);
      const passChainProphet = (selTypes.has('Genealogy') || selTypes.has('Prophetic Lineage')) && PROPHET_CHAIN.has(p.famous);
      // Tag-based type filters (e.g. Ashra Mubashshara stored in p.tags)
      const passTags = (p.tags||[]).some(t=>selTypes.has(t));
      // IH sub-lane virtual type filters (e.g. "Prophets" matches type=Prophet)
      const passIHSub = [...selTypes].some(st=>_IH_SUBLANE_REV[st]&&_IH_SUBLANE_REV[st].has(p.type));
      // Ashra Mubashshara: match by hardcoded name list; also include them under "Companions"
      const passAshra = (selTypes.has('Ashra Mubashshara')||selTypes.has('Companions')) && ASHRA_MUBASHSHARA.has(p.famous);
      if(!passType && !passChainProphet && !passTags && !passIHSub && !passAshra) return false;
    }
    if(selTrads.size>0&&!selTrads.has(p.tradition))return false;
    if(searchQ){
      const q=searchQ.toLowerCase();
      const vars=window._NAME_VARIANTS&&p.slug?window._NAME_VARIANTS[p.slug]||[]:[];
      const hay=[p.famous,p.full,p.primaryTitle,p.titles||'',p.city,p.classif,p.tradition,p.type,...(p.tags||[]),...vars].join(' ').toLowerCase();
      if(!hay.includes(q))return false;
    }
    /* Saved figures filter */
    if(APP.filterFavsOnly && APP.Favorites){
      if(!APP.Favorites.has(p.famous)) return false;
    }
    /* Badge filter */
    if(selBadge){
      var badges=getFigureBadges(p.slug,p.famous);
      if(badges.indexOf(selBadge)===-1) return false;
    }
    return true;
  });
}

// ═══════════════════════════════════════════════════════════
// AUTO-FOCUS: centre century on first visible person
// ═══════════════════════════════════════════════════════════
function applyFilterAndFocus(){
  const filtered=getFiltered();
  // Sort chronologically to find the earliest person for auto-focus
  const sorted=[...filtered].sort((a,b)=>a.dob-b.dob);
  let firstP=null;
  for(const p of sorted){
    if(activeYear!==null){
      const dod=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
      if(p.dob>activeYear||dod<activeYear) continue;
    }
    firstP=p; break;
  }
  if(firstP){
    const cent=gc(firstP.dob);
    const idx=ALL_CENTS.indexOf(cent);
    if(idx!==-1){centIdx=Math.max(idx,1); setCW();}
    updateCentHeaders(); updateCentScrollbar();
  }
  renderAll(filtered);
  if(VIEW==='silsila') updateSilsilaHighlight();
  if(VIEW==='map') _renderMarkers();
  if(VIEW==='events' && typeof window._eventsApplySearch === 'function') window._eventsApplySearch();
}

function setCW(){
  // Centre column (CW[1]) is ALWAYS at least 6th century (ALL_CENTS index >= 1).
  // centIdx=0 is allowed only to mean "show pre-Islamic in left column".
  // This prevents CW=[0,0,6] (duplicate pre-Islamic).
  const safeIdx = Math.max(centIdx, 1); // centre never uses index 0
  const c    = ALL_CENTS[safeIdx];                                      // centre = 6th+
  const prev = safeIdx === 1 ? 0 : ALL_CENTS[safeIdx-1];               // left = pre-Islamic when at 6th
  const next = ALL_CENTS[Math.min(ALL_CENTS.length-1, safeIdx+1)];     // right = next century
  CW = [prev, c, next];
}

// ═══════════════════════════════════════════════════════════
// CENTURY HEADERS
// ═══════════════════════════════════════════════════════════
function updateCentHeaders(){
  // Century header elements removed in Step 1.3 — function is now a no-op.
  if(!document.getElementById('ch0t')) return;
  const [c0,c1,c2]=CW;
  function lbl(c){return c===0?'PRE-ISLAMIC':centLabel(c)+' C.'}
  function yrLbl(c){return c===0?'Pre-600 CE':c>0?((c-1)*100)+' – '+(c*100):''}
  document.getElementById('ch0t').textContent=lbl(c0);
  document.getElementById('ch1t').textContent=lbl(c1);
  document.getElementById('ch2t').textContent=lbl(c2);
  document.getElementById('ch0y').textContent=yrLbl(c0);
  document.getElementById('ch1y').textContent=yrLbl(c1);
  document.getElementById('ch2y').textContent=yrLbl(c2);
}

// ═══════════════════════════════════════════════════════════
// CENTURY SCROLLBAR (at bottom)
// ═══════════════════════════════════════════════════════════
function initCentScrollbar(){
  const track=document.getElementById('centScrollTrack');
  const thumb=document.getElementById('centScrollThumb');

  function setFromPx(px,w){
    const ratio=Math.max(0,Math.min(1,px/w));
    const idx=Math.round(ratio*(ALL_CENTS.length-1));
    if(idx!==centIdx){
      centIdx=idx; setCW();
      updateCentHeaders(); updateCentScrollbar(); renderAll();
    }
  }

  let dragging=false;
  thumb.addEventListener('mousedown',e=>{
    dragging=true; thumb.classList.add('dragging'); e.preventDefault();
    const r=track.getBoundingClientRect(); setFromPx(e.clientX-r.left,r.width);
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const r=track.getBoundingClientRect(); setFromPx(e.clientX-r.left,r.width);
  });
  document.addEventListener('mouseup',()=>{dragging=false;thumb.classList.remove('dragging');});
  track.addEventListener('click',e=>{
    const r=track.getBoundingClientRect(); setFromPx(e.clientX-r.left,r.width);
  });
  thumb.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){centIdx=Math.min(ALL_CENTS.length-1,centIdx+1);setCW();updateCentHeaders();updateCentScrollbar();renderAll();}
    if(e.key==='ArrowLeft'){centIdx=Math.max(0,centIdx-1);setCW();updateCentHeaders();updateCentScrollbar();renderAll();}
  });
}

function updateCentScrollbar(){
  const total=ALL_CENTS.length;
  const pct=(centIdx/(total-1))*100;
  const thumbW=Math.round(100/total);
  const thumbLeft=Math.max(0,Math.min(100-thumbW,pct-thumbW/2));
  document.getElementById('centScrollThumb').style.left=thumbLeft+'%';
  document.getElementById('centScrollThumb').style.width=thumbW+'%';
  document.getElementById('centScrollFill').style.width=pct+'%';
}

// ═══════════════════════════════════════════════════════════
// YEAR SLIDER — Shift precision helper (universal)
// Hold Shift → slider steps at fineStep; release → coarseStep.
// Works for native <input type="range"> year sliders.
// The main custom slider wires its own shift handling in initSlider().
// ═══════════════════════════════════════════════════════════
window._enableShiftPrecision=function(sliderEl,coarseStep,fineStep){
  if(!sliderEl) return;
  sliderEl.step=coarseStep;
  document.addEventListener('keydown',function(e){
    if(e.key==='Shift') sliderEl.step=fineStep;
  });
  document.addEventListener('keyup',function(e){
    if(e.key==='Shift') sliderEl.step=coarseStep;
  });
  window.addEventListener('blur',function(){sliderEl.step=coarseStep;});
};

// ═══════════════════════════════════════════════════════════
// YEAR SLIDER
// ═══════════════════════════════════════════════════════════
function initSlider(){
  const track=document.getElementById('sliderTrack');
  const thumb=document.getElementById('sliderThumb');
  const fill=document.getElementById('sliderFill');

  function yr2pct(yr){return((yr-MIN_YR)/(MAX_YR-MIN_YR))*100;}
  function px2yr(px,w){
    var step=window._yrSliderShift?1:5;
    var raw=MIN_YR+Math.max(0,Math.min(1,px/w))*(MAX_YR-MIN_YR);
    return Math.round(raw/step)*step;
  }

  function setYear(yr){
    const pct=yr2pct(yr);
    thumb.style.left=pct+'%'; fill.style.width=pct+'%';
    const _trk=document.getElementById('sliderTrack'); if(_trk) _trk.classList.remove('sl-inactive');
    activeYear=yr;
    _viewYears[VIEW]=yr;
    if(VIEW==='map'&&typeof _applyMapYear==='function') _applyMapYear(yr);
    if(typeof _onSliderYear==='function') _onSliderYear(yr);
    // For years before 600 CE, keep centre at 6th century (centIdx=1)
    const cent=yr<600?6:Math.ceil(yr/100);
    const idx=ALL_CENTS.indexOf(cent);
    if(idx!==-1){centIdx=Math.max(idx,1); setCW();}
    document.getElementById('yearDisplay').textContent=yr+' CE';
    const cb=document.getElementById('yearClearBtn'); if(cb) cb.classList.add('active');
    updateCentHeaders(); updateCentScrollbar();
    renderAll();
  }
  window._setSliderYear=setYear;

  let dragging=false;
  function doMove(e){
    if(typeof _mapAnimStop==='function') _mapAnimStop();
    const r=track.getBoundingClientRect();
    const x=e.touches?e.touches[0].clientX:e.clientX;
    setYear(px2yr(x-r.left,r.width));
  }
  thumb.addEventListener('mousedown',e=>{dragging=true;thumb.classList.add('dragging');e.preventDefault();doMove(e);});
  thumb.addEventListener('touchstart',e=>{dragging=true;thumb.classList.add('dragging');e.preventDefault();doMove(e);},{passive:false});
  track.addEventListener('click',e=>{const r=track.getBoundingClientRect();setYear(px2yr(e.clientX-r.left,r.width));});
  document.addEventListener('mousemove',e=>{if(!dragging)return;doMove(e);});
  document.addEventListener('touchmove',e=>{if(!dragging)return;doMove(e);},{passive:false});
  document.addEventListener('mouseup',()=>{dragging=false;thumb.classList.remove('dragging');});
  document.addEventListener('touchend',()=>{dragging=false;thumb.classList.remove('dragging');});
  thumb.addEventListener('keydown',e=>{
    let yr=activeYear||800;
    var step=e.shiftKey?1:5;
    if(e.key==='ArrowRight'||e.key==='ArrowUp')yr=Math.min(MAX_YR,yr+step);
    if(e.key==='ArrowLeft'||e.key==='ArrowDown')yr=Math.max(MIN_YR,yr-step);
    if(e.key==='PageUp')yr=Math.min(MAX_YR,yr+100);
    if(e.key==='PageDown')yr=Math.max(MIN_YR,yr-100);
    setYear(yr);
  });

  // Shift precision: 5yr default → 1yr while Shift held (drag + arrow keys)
  window._yrSliderShift=false;
  var pill=document.getElementById('yrPrecisionPill');
  var nativeSl=document.getElementById('sliderInput');
  function setShift(on){
    if(window._yrSliderShift===on) return;
    window._yrSliderShift=on;
    if(nativeSl) nativeSl.step=on?1:5;
    if(pill) pill.classList.toggle('show',on);
    // Mid-drag toggles take effect on next mousemove automatically.
  }
  document.addEventListener('keydown',function(e){if(e.key==='Shift')setShift(true);});
  document.addEventListener('keyup',function(e){if(e.key==='Shift')setShift(false);});
  window.addEventListener('blur',function(){setShift(false);});
  // Slider starts at left edge — inactive until user clicks YEAR FILTER
  thumb.style.left='0%'; fill.style.width='0%';
  track.classList.add('sl-inactive');
}

function toggleYearSlider(){
  // Slider is now always visible in hdrRow3 — toggle is a no-op
}

function clearYear(){
  activeYear=null;
  _viewYears[VIEW]=null;
  if(VIEW==='map'&&typeof _applyMapYear==='function') _applyMapYear(null);
  if(typeof _onSliderYear==='function') _onSliderYear(null);
  document.getElementById('yearDisplay').textContent='\u2014';
  const cb=document.getElementById('yearClearBtn'); if(cb) cb.classList.remove('active');
  const _trk2=document.getElementById('sliderTrack'); if(_trk2) _trk2.classList.add('sl-inactive');
  updateCentHeaders(); updateCentScrollbar();
  renderAll();
}

// ═══════════════════════════════════════════════════════════
// VIEW
// ═══════════════════════════════════════════════════════════
function _syncSliderUI(){
  const thumb=document.getElementById('sliderThumb');
  const fill=document.getElementById('sliderFill');
  const track=document.getElementById('sliderTrack');
  const cb=document.getElementById('yearClearBtn');
  if(activeYear!==null){
    const pct=((activeYear-MIN_YR)/(MAX_YR-MIN_YR))*100;
    thumb.style.left=pct+'%'; fill.style.width=pct+'%';
    document.getElementById('yearDisplay').textContent=activeYear+' CE';
    if(cb) cb.classList.add('active');
    if(track) track.classList.remove('sl-inactive');
  } else {
    thumb.style.left='0%'; fill.style.width='0%';
    document.getElementById('yearDisplay').textContent='\u2014';
    if(cb) cb.classList.remove('active');
    if(track) track.classList.add('sl-inactive');
  }
}

function setView(v){
  if(typeof Monastic === 'object' && Monastic && typeof Monastic.onLeave === 'function') Monastic.onLeave();
  // Push to in-app nav history
  if(typeof window._navPush==='function') window._navPush(v);
  // Save current view's year, restore new view's year
  _viewYears[VIEW]=activeYear;
  activeYear=_viewYears[v]!=null?_viewYears[v]:null;
  if(v==='map') _mapYear=activeYear;
  _syncSliderUI();

  VIEW=v; window.VIEW=v;
  document.querySelectorAll('.view-tab').forEach(t=>{
    const txt=t.textContent.trim().toLowerCase().replace(/\s+/g,'');
    t.classList.toggle('active',txt===v.toLowerCase().replace(/\s+/g,''));
  });
  document.getElementById('leftPanel').style.display=v==='timeline'?'flex':'none';
  document.getElementById('filterBar').style.display=v==='timeline'?'flex':'none';
  document.getElementById('hdrRow4').style.display=v==='timeline'?'flex':'none';
  if(v==='timeline'&&!document.getElementById('tl-how-btn')){var _r4=document.getElementById('hdrRow4');var _tlHB=document.createElement('button');_tlHB.id='tl-how-btn';_tlHB.textContent='How This Works';_tlHB.style.cssText="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-size:var(--fs-3);cursor:pointer;transition:.2s;font-family:'Cinzel',serif;letter-spacing:.05em;margin-right:8px";_tlHB.onmouseover=function(){this.style.borderColor='#D4AF37';this.style.color='#D4AF37';};_tlHB.onmouseout=function(){this.style.borderColor='#555';this.style.color='#888';};_tlHB.onclick=function(e){e.stopPropagation();_showTimelineMethodology();};if(_r4) _r4.prepend(_tlHB);}
  const ip=document.getElementById('infoPanel');
  if(v==='map'||v==='silsila'||v==='studyroom'||v==='eras'||v==='events'||v==='think'||v==='one'||v==='follow'||v==='talk'||v==='monastic'){
    ip.style.display='none'; ip.style.flex=''; ip.style.minWidth='';
  } else {
    ip.style.display=''; ip.style.flex=''; ip.style.minWidth='';
  }
  const tlC=document.getElementById('tlCenter');
  if(tlC) tlC.classList.toggle('hidden', v!=='timeline');
  document.getElementById('silsilaView').classList.toggle('active',v==='silsila');
  document.getElementById('mapView').classList.toggle('active',v==='map');
  document.getElementById('studyRoomView').classList.toggle('active',v==='studyroom');
  document.getElementById('eras-view').style.display=v==='eras'?'flex':'none';
  document.getElementById('events-view').style.display=v==='events'?'flex':'none';
  var _tkEl=document.getElementById('think-view');
  if(_tkEl) _tkEl.style.display=v==='think'?'flex':'none';
  document.getElementById('one-view').style.display=v==='one'?'flex':'none';
  var _fvEl=document.getElementById('follow-view');
  _fvEl.style.display=v==='follow'?'flex':'none';
  if(v==='follow') _fvEl.style.flexDirection='column';
  document.getElementById('talk-view').style.display=v==='talk'?'flex':'none';
  var _monEl=document.getElementById('monastic-view');
  if(_monEl) _monEl.style.display=v==='monastic'?'flex':'none';
  // Show year controls only on views that use the slider
  const yc=document.getElementById('hdrYearControls');
  if(yc) yc.style.display=(v==='timeline'||v==='silsila'||v==='map'||v==='eras')?'flex':'none';
  if(v==='studyroom'||v==='eras'||v==='events'||v==='think'||v==='one'||v==='follow'||v==='talk'||v==='monastic'){
    document.getElementById('leftPanel').style.display='none';
    document.getElementById('filterBar').style.display='none';
  }
  // Re-measure topBar height after row visibility change
  _resizeShell();
  if(v!=='map'){ _unpinMapTT(); _closeMapCard(); }
  if(v==='silsila') renderSilsila();
  if(v==='map'){ _setMapHeight(); renderMap(); }
  if(v==='eras'&&typeof initEras==='function') initEras();
  if(v==='events'&&typeof initEvents==='function') initEvents();
  if(v==='one'&&typeof initOne==='function') initOne();
  if(v==='follow'&&typeof initFollow==='function') initFollow();
  if(v!=='follow'&&typeof _fwCleanup==='function') _fwCleanup();
  if(v==='talk'&&typeof initTalk==='function') initTalk();
  if(v==='monastic'&&window.Monastic&&typeof window.Monastic.init==='function') window.Monastic.init();
  if(v === 'monastic' && typeof Monastic === 'object' && Monastic && typeof Monastic.onEnter === 'function') Monastic.onEnter();
  if(v==='studyroom'&&typeof _buildStudySidebar==='function') _buildStudySidebar();
  // Push browser history on view change
  if(!window._popstateInProgress){
    history.pushState({view:v},'','#'+v);
  }
  // Reset info card scroll on view change so top of card is visible
  try {
    var _ipScroll = document.getElementById('infoScroll');
    if(_ipScroll) _ipScroll.scrollTop = 0;
  } catch(e){}
  _tileNavSync(v);
}

// ═══════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════
function renderAll(filtered){
  if(!filtered) filtered=getFiltered();
  const sorted = [...filtered].sort((a,b)=>_dobOf(a)-_dobOf(b));
  const visible = sorted.filter(p => _dobOf(p) != null);
  // Shared colour map — single source of truth for left-list dot AND centre-column lifespan.
  const TL_PALETTE = [
    '#E6833A', '#4A90D9', '#9B59B6', '#2ECC71', '#E74C3C',
    '#1ABC9C', '#F39C12', '#8E44AD', '#16A085', '#D35400',
    '#3498DB', '#E91E63', '#00BCD4', '#CDDC39', '#FF5722'
  ];
  window._tlColorMap = {};
  visible.forEach((p, vi) => {
    const isGold = p.slug === 'adam' || p.slug === 'F0172'
                 || p.famous === 'Prophet Muhammad'
                 || p.type === 'Genealogy';
    window._tlColorMap[p.famous] = isGold ? '#D4AF37' : TL_PALETTE[vi % TL_PALETTE.length];
  });
  renderRows(sorted);
  _tlRenderCenter(visible);
  if(activePerson){
    const still=sorted.find(p=>p.famous===activePerson.famous);
    if(still) renderInfoWithDetails(still); else{activePerson=null;showEmptyInfo();}
  }
  if(VIEW==='silsila') updateSilsilaHighlight();
}

// Sacred-rule single source of truth (retained post-wipe for the left-list name colour).
// Only type:'Prophet' figures — plus Adam explicitly — render in soft gold.
function _tlIsSacred(p){
  if(!p) return false;
  if(p.slug === 'adam' || p.slug === 'F0172') return true;
  return p.type === 'Prophet';
}

// ═══════════════════════════════════════════════════════════
// TIMELINE CENTRE COLUMN (Step 3.1) — era title + left-edge gold scale + dob chips.
// ═══════════════════════════════════════════════════════════
function _tlRenderCenter(visible){
  const col = document.getElementById('tlCenter');
  const titleEl = document.getElementById('tlEraTitle');
  const scaleEl = document.getElementById('tlScale');
  if(!col || !titleEl || !scaleEl) return;

  if(!visible.length){
    titleEl.classList.add('empty');
    titleEl.textContent = '';
    scaleEl.innerHTML = '';
    scaleEl.style.height = '0';
    col.style.setProperty('--tl-era-bg', 'transparent');
    col.style.setProperty('--tl-era-border', 'var(--gold)');
    _tlSyncScroll();
    return;
  }
  titleEl.classList.remove('empty');

  const compressionOn = document.body.classList.contains('tl-focus')
    && document.querySelector('.tl-row.tl-compressed') != null;

  // Era determined by 4th visible figure (or last if fewer than 4).
  const anchor = visible[3] || visible[visible.length - 1];
  const era = _getEra(_dobOf(anchor));
  titleEl.textContent = era.name;
  // era.border is 'rgb(r,g,b)' — derive a 25%-alpha column tint from it.
  const borderRgb = era.border.replace('rgb(', '').replace(')', '');
  col.style.setProperty('--tl-era-bg', 'rgba(' + borderRgb + ', 0.25)');
  col.style.setProperty('--tl-era-border', era.border);

  // Dob chips — one per row, always at its DOM-measured midpoint (no synthetic math, no dedup).
  const goldYs = [];
  const rowYs = new Array(visible.length);
  let html = '';
  const rs0 = document.getElementById('rowsScroll');
  const rowEls = rs0 ? rs0.querySelectorAll('.tl-row') : [];
  if(compressionOn && rowEls.length){
    rowEls.forEach(el => {
      const idx = parseInt(el.dataset.idx);
      if(isNaN(idx) || idx >= visible.length) return;
      const p = visible[idx];
      if(!p) return;
      const mid = el.offsetTop + (el.offsetHeight / 2);
      rowYs[idx] = mid;
      const dob = _dobOf(p);
      if(dob == null) return;
      goldYs.push(mid);
      const label = dob < 0 ? Math.abs(dob) : dob;
      html += '<div class="tl-dob-chip" style="top:' + mid + 'px">' + label + '</div>';
    });
  } else {
    visible.forEach((p, vi) => {
      const dob = _dobOf(p);
      if(dob == null) return;
      const y = vi * ROW_H + ROW_MID;
      rowYs[vi] = y;
      goldYs.push(y);
      const label = dob < 0 ? Math.abs(dob) : dob;
      html += '<div class="tl-dob-chip" style="top:' + y + 'px">' + label + '</div>';
    });
  }

  // Row-anchored non-linear scale: interpolate years → Y using adjacent visible dobs.
  function yearToY(yr){
    if(!visible.length) return 0;
    const firstDob = _dobOf(visible[0]);
    const lastDob  = _dobOf(visible[visible.length-1]);
    const getY = (i) => (rowYs[i] != null) ? rowYs[i] : (i * ROW_H + ROW_MID);
    const maxY = getY(visible.length - 1);
    if(yr <= firstDob) return getY(0);
    if(yr >= lastDob)  return maxY;
    let lo = 0, hi = visible.length - 1;
    while(lo < hi - 1){
      const mid = (lo + hi) >> 1;
      if(_dobOf(visible[mid]) < yr) lo = mid; else hi = mid;
    }
    const yA = getY(lo), yB = getY(hi);
    const dA = _dobOf(visible[lo]), dB = _dobOf(visible[hi]);
    if(dA === dB) return yA;
    return yA + ((yr - dA) / (dB - dA)) * (yB - yA);
  }

  // Centre-column colour rule — read from the shared map built in renderAll.
  const dotCol = (pp) => (window._tlColorMap && window._tlColorMap[pp.famous]) || '#A0AEC0';

  // Viewport window: only the ~15 rows currently on-screen render lifespans.
  const _rs = document.getElementById('rowsScroll');
  const _st = _rs ? _rs.scrollTop : 0;
  const _vh = _rs ? _rs.clientHeight : ROW_H * 15;
  const winStart = Math.max(0, Math.floor(_st / ROW_H));
  const winEndRaw = Math.min(visible.length - 1, Math.floor((_st + _vh) / ROW_H));
  const winEnd = Math.min(winEndRaw, winStart + 14);

  // Same-year breathing space: track horizontal offset per yStart / yEnd bucket so clustered arcs fan out.
  const _yStartBuckets = {};
  const _yEndBuckets   = {};

  let barsHtml = '';
  const silverChips = [];

  // Build the set of indices to render arcs for.
  const renderSet = new Set();
  for(let vi = winStart; vi <= winEnd; vi++) renderSet.add(vi);
  // If focus mode, also include the focused figure's index wherever they sit.
  if(tlFocusName){
    const fIdx = visible.findIndex(pp => pp.famous === tlFocusName);
    if(fIdx >= 0) renderSet.add(fIdx);
  }
  const renderIdxs = Array.from(renderSet).sort((a,b)=>a-b);
  for(const vi of renderIdxs){
    const p = visible[vi];
    if(!p) continue;
    const dob = _dobOf(p); if(dob == null) continue;
    const dod = _dodOf(p);
    const yStart = (rowYs[vi] != null) ? rowYs[vi] : (vi * ROW_H + ROW_MID);
    let endYear, yEnd;
    if(dod != null){ endYear = dod; yEnd = yearToY(dod); }
    else           { endYear = dob + 30; yEnd = yearToY(endYear); }
    if(yEnd - yStart < 4) yEnd = yStart + 4;
    if(compressionOn){
      // Prefer the DOM-measured y of the row whose dob == endYear (if any).
      let bestIdx = -1, bestDiff = Infinity;
      for(let q = 0; q < visible.length; q++){
        const vd = _dobOf(visible[q]);
        if(vd == null) continue;
        const diff = Math.abs(vd - endYear);
        if(diff < bestDiff){ bestDiff = diff; bestIdx = q; }
      }
      if(bestIdx >= 0 && rowYs[bestIdx] != null) yEnd = rowYs[bestIdx];
      if(yEnd - yStart < 4) yEnd = yStart + 4;
    }
    // Clamp runaway arcs (dense eras push yEnd thousands of px below yStart).
    // Cap at 6 row-heights so arc remains visually meaningful inside the column.
    const isFocus = tlFocusName && p.famous === tlFocusName;
    const MAX_H = ROW_H * 6;
    let truncated = false;
    if(!isFocus && yEnd - yStart > MAX_H){
      yEnd = yStart + MAX_H;
      truncated = true;
    }

    const kS = Math.round(yStart);
    const kE = Math.round(yEnd);
    const offS = _yStartBuckets[kS] || 0;
    const offE = _yEndBuckets[kE] || 0;
    const xShift = Math.max(offS, offE) * 10;
    _yStartBuckets[kS] = offS + 1;
    _yEndBuckets[kE]   = offE + 1;

    const colr = dotCol(p);
    const h = yEnd - yStart;
    // peakPx = visual peak of the arc (what the eye sees at t=0.5).
    // Quadratic control point must be 2x the peak to achieve that peak.
    const peakPx = Math.max(18, Math.min(115, h * 0.55));
    const ctrlX  = peakPx * 2 - 2;
    const svgW   = Math.ceil(peakPx) + 12;

    const dashAttr = truncated ? ' stroke-dasharray="4,4"' : '';
    const safeName = esc(p.famous);
    const clickName = p.famous.replace(/'/g, "\\'");
    const focusCls = (tlFocusName && p.famous === tlFocusName) ? ' focus-target' : '';
    barsHtml += '<svg class="tl-life-arc' + focusCls + '" data-famous="' + safeName + '" onclick="_tlFocusByName(\'' + clickName + '\')" style="left:' + (61 + xShift) + 'px;top:' + yStart + 'px;height:' + h + 'px;width:' + svgW + 'px" viewBox="0 0 ' + svgW + ' ' + h + '" preserveAspectRatio="none">'
             +  '<path d="M 2 0 Q ' + ctrlX + ' ' + (h / 2) + ' 2 ' + h + '" fill="none" stroke="' + colr + '" stroke-width="3" stroke-linecap="round" opacity="0.9"' + dashAttr + '/>'
             +  '</svg>';

    const matchesVisibleDob = visible.some(q => _dobOf(q) === endYear);
    if(!matchesVisibleDob && !truncated) silverChips.push({ y: yEnd, year: endYear });
  }

  silverChips.sort((a, b) => a.y - b.y);
  const placedYs = goldYs.slice();
  let silverHtml = '';
  silverChips.forEach(s => {
    let y = s.y, tries = 0;
    while(tries < 40 && placedYs.some(py => Math.abs(py - y) < 14)){
      y += 14; tries++;
    }
    placedYs.push(y);
    const label = s.year < 0 ? Math.abs(s.year) : s.year;
    silverHtml += '<div class="tl-dod-chip-silver" style="top:' + y + 'px">' + label + '</div>';
  });

  scaleEl.innerHTML = html + barsHtml + silverHtml;
  if(compressionOn){
    const rs = document.getElementById('rowsScroll');
    const lastRow = rs ? rs.querySelector('.tl-row:last-child') : null;
    if(lastRow){
      scaleEl.style.height = (lastRow.offsetTop + lastRow.offsetHeight) + 'px';
    } else {
      scaleEl.style.height = (visible.length * ROW_H) + 'px';
    }
  } else {
    scaleEl.style.height = (visible.length * ROW_H) + 'px';
  }

  window._tlVisibleCache = visible; // reused by the scroll-driven title update
  _tlSyncScroll();

  // If focus is active, re-apply after re-render (scroll/filter rebuilds arcs).
  if(tlFocusName) _tlApplyFocus();
}

// Scroll handler — updates era title + tint from the 4th row visible on-screen.
function _tlExitFocus(){
  window._tlFocusScrolled = false;
  tlFocusName = null;
  document.body.classList.remove('tl-focus');
  const tc = document.getElementById('tlCenter');
  if(tc) tc.classList.remove('focus-mode');
  document.querySelectorAll('.tl-row.focus-target').forEach(r=>r.classList.remove('focus-target'));
  document.querySelectorAll('.tl-row.focus-overlap').forEach(r=>r.classList.remove('focus-overlap'));
  document.querySelectorAll('.tl-row.tl-compressed').forEach(r=>r.classList.remove('tl-compressed'));
  document.querySelectorAll('.tl-life-arc.focus-target').forEach(a=>a.classList.remove('focus-target'));
  const pillName = document.getElementById('tlFocusPillName');
  if(pillName) pillName.textContent = '';
  if(window._tlVisibleCache) _tlRenderCenter(window._tlVisibleCache);
}

function _tlApplyFocus(){
  if(!tlFocusName) return;
  document.body.classList.add('tl-focus');
  const tc = document.getElementById('tlCenter');
  if(tc) tc.classList.add('focus-mode');
  const pillName = document.getElementById('tlFocusPillName');
  if(pillName) pillName.textContent = tlFocusName;

  const target = _lastSortedPeople.find(pp => pp.famous === tlFocusName);
  const tDob = target ? _dobOf(target) : null;
  const tDod = target ? (_dodOf(target) != null ? _dodOf(target) : tDob + 60) : null;
  let targetRow = null;
  document.querySelectorAll('.tl-row').forEach(r=>{
    const idx = parseInt(r.dataset.idx);
    const pp = _lastSortedPeople[idx];
    if(!pp){ r.classList.remove('focus-target','focus-overlap'); return; }
    const isSelf = pp.famous === tlFocusName;
    let overlaps = false;
    if(tDob != null && tDod != null){
      const pDob = _dobOf(pp);
      const pDod = _dodOf(pp) != null ? _dodOf(pp) : (pDob != null ? pDob + 60 : null);
      if(pDob != null && pDod != null){
        overlaps = !(pDod < tDob || pDob > tDod);
      }
    }
    r.classList.toggle('focus-target', isSelf);
    r.classList.toggle('focus-overlap', !isSelf && overlaps);
    if(isSelf) targetRow = r;
  });
  document.querySelectorAll('.tl-life-arc').forEach(a=>{
    a.classList.toggle('focus-target', a.dataset.famous === tlFocusName);
  });

  // Compression: if the target's dob-row to dod-row range exceeds 15 rows in the sorted list,
  // compress every row strictly between those two row indices so the arc stays usable.
  document.querySelectorAll('.tl-row.tl-compressed').forEach(r => r.classList.remove('tl-compressed'));
  if(target){
    const sorted = _lastSortedPeople;
    const tIdx = sorted.findIndex(pp => pp.famous === tlFocusName);
    if(tIdx >= 0){
      let endIdx = tIdx;
      for(let j = tIdx + 1; j < sorted.length; j++){
        const pDob = _dobOf(sorted[j]);
        if(pDob != null && pDob <= tDod) endIdx = j;
        else if(pDob != null && pDob > tDod) break;
      }
      const span = endIdx - tIdx;
      if(span > 15){
        document.querySelectorAll('.tl-row').forEach(r => {
          const idx = parseInt(r.dataset.idx);
          if(idx > tIdx && idx < endIdx) r.classList.add('tl-compressed');
        });
      }
    }
  }

  if(!window._tlFocusScrolled){
    window._tlFocusScrolled = true;
    const rs = document.getElementById('rowsScroll');
    if(targetRow && rs){
      const offsetTop = targetRow.offsetTop;
      const viewH = rs.clientHeight;
      const rowH = targetRow.offsetHeight || ROW_H;
      const desired = Math.max(0, offsetTop - Math.floor(viewH / 3) + rowH / 2);
      rs.scrollTo({ top: desired, behavior: 'smooth' });
    }
  }

  if(window._tlVisibleCache){
    // Defer one frame so compressed row heights are applied in layout before we measure.
    requestAnimationFrame(() => _tlRenderCenter(window._tlVisibleCache));
  }
}

window._tlFocusByName = function(name){
  if(tlFocusName === name){ _tlExitFocus(); return; }
  tlFocusName = name;
  const p = PEOPLE.find(pp => pp.famous === name);
  if(p){ activePerson = p; renderInfoWithDetails(p); }
  _tlApplyFocus();
};

function _tlUpdateEraTitleOnScroll(){
  const rs = document.getElementById('rowsScroll');
  const col = document.getElementById('tlCenter');
  const titleEl = document.getElementById('tlEraTitle');
  if(!rs || !col || !titleEl) return;
  const sortedVisible = window._tlVisibleCache || [];
  if(!sortedVisible.length) return;

  const topRowIdx = Math.floor(rs.scrollTop / ROW_H);
  const fourthIdx = Math.min(topRowIdx + 3, sortedVisible.length - 1);
  const anchor = sortedVisible[fourthIdx];
  if(!anchor) return;

  const era = _getEra(_dobOf(anchor));
  titleEl.textContent = era.name;
  const borderRgb = era.border.replace('rgb(', '').replace(')', '');
  col.style.setProperty('--tl-era-bg', 'rgba(' + borderRgb + ', 0.25)');
  col.style.setProperty('--tl-era-border', era.border);
}

// One-time mirror: figure-list scroll → centre column scroll, so dob chips stay aligned.
function _tlSyncScroll(){
  const rs = document.getElementById('rowsScroll');
  const ts = document.getElementById('tlCenterScroll');
  if(!rs || !ts || ts.dataset.synced) return;
  ts.dataset.synced = '1';
  let _tlTitlePending = false;
  rs.addEventListener('scroll', () => {
    ts.scrollTop = rs.scrollTop;
    if(_tlTitlePending) return;
    _tlTitlePending = true;
    requestAnimationFrame(() => {
      _tlTitlePending = false;
      _tlUpdateEraTitleOnScroll();
      if(window._tlVisibleCache) _tlRenderCenter(window._tlVisibleCache);
    });
  });

  const fcBtn = document.getElementById('tlFocusClose');
  if(fcBtn && !fcBtn.dataset.bound){
    fcBtn.dataset.bound = '1';
    fcBtn.addEventListener('click', function(e){ e.stopPropagation(); _tlExitFocus(); });
  }
}

// ── Era definitions for timeline bands ──
const _ERA_BANDS=[
  {min:-Infinity,max:632,  name:'Prophetic Era',      dates:'Before 632 CE',    bg:'rgba(139,105,20,0.08)', border:'rgb(139,105,20)'},
  {min:632,      max:661,  name:'Rashidun',            dates:'632\u2013661 CE',  bg:'rgba(45,90,61,0.10)',  border:'rgb(45,90,61)'},
  {min:661,      max:750,  name:'Umayyad',             dates:'661\u2013750 CE',  bg:'rgba(90,61,45,0.10)',  border:'rgb(90,61,45)'},
  {min:750,      max:1258, name:'Abbasid Golden Age',  dates:'750\u20131258 CE', bg:'rgba(45,61,90,0.10)',  border:'rgb(45,61,90)'},
  {min:1258,     max:1500, name:'Post-Mongol',         dates:'1258\u20131500 CE',bg:'rgba(74,45,74,0.10)',  border:'rgb(74,45,74)'},
  {min:1500,     max:1800, name:'Gunpowder Empires',   dates:'1500\u20131800 CE',bg:'rgba(61,74,45,0.10)',  border:'rgb(61,74,45)'},
  {min:1800,     max:1950, name:'Colonial & Reform',   dates:'1800\u20131950 CE',bg:'rgba(90,74,45,0.10)',  border:'rgb(90,74,45)'},
  {min:1950,     max:Infinity,name:'Contemporary',     dates:'1950\u2013Present',bg:'rgba(45,74,74,0.10)',  border:'rgb(45,74,74)'}
];
function _getEra(dob){
  for(let i=0;i<_ERA_BANDS.length;i++){
    if(dob<_ERA_BANDS[i].max) return _ERA_BANDS[i];
  }
  return _ERA_BANDS[_ERA_BANDS.length-1];
}

function renderRows(filtered){
  _lastSortedPeople=filtered; // FIX: store so selectRow uses same sorted array
  const container=document.getElementById('rowsScroll');
  let html='';

  filtered.forEach((p,i)=>{
    // Auto-hide: if year filter active and person wasn't alive, skip entirely
    if(activeYear!==null){
      const dob=p.dob;
      const dod=p.dod!==undefined&&p.dod!==null?p.dod:dob+60;
      if(dob>activeYear||dod<activeYear) return;
    }

    const era=_getEra(p.dob);
    // Dot colour comes from the shared map built in renderAll so it always matches the centre-column lifespan.
    const col = (window._tlColorMap && window._tlColorMap[p.famous]) || '#A0AEC0';
    const isSel=activePerson&&activePerson.famous===p.famous;
    const isProphet=p.famous==='Prophet Muhammad';
    // Step 2.8 — sacred rule: only type:'Prophet' figures (and Adam explicitly) get the gold treatment.
    const isSacred = _tlIsSacred(p);

    html+=`<div class="tl-row${isSel?' sel':''}${isProphet?' prophet-row':''}" data-idx="${i}" data-era-bg="${era.bg}" onclick="selectRow(${i})" style="background:${era.bg}">
      <div class="tc-name${isSacred?' is-sacred':''}">
        <div class="tc-texts">
          <div class="tc-famous">${esc(p.famous)}${_renderBadgesHtml(p.slug,p.famous,'tl')}</div>
          <div class="tc-sub">${esc(p.primaryTitle||p.classif||'')}</div>
        </div>
        <div class="tc-dot" style="background:${col}${isProphet?';box-shadow:0 0 8px '+col+'90':''}"></div>
      </div>
    </div>`;
  });

  container.innerHTML=html;
  if(activePerson){
    const sel=container.querySelector('.sel');
    if(sel)sel.scrollIntoView({block:'nearest'});
  }
  // Era-tinted column headers on scroll
  if(!container._eraScrollBound){
    container._eraScrollBound=true;
    const fb=document.getElementById('filterBar');
    container.addEventListener('scroll',function(){
      const rows=container.querySelectorAll('.tl-row');
      for(let r=0;r<rows.length;r++){
        const rect=rows[r].getBoundingClientRect();
        if(rect.bottom>container.getBoundingClientRect().top){
          const bg=rows[r].dataset.eraBg;
          if(bg&&fb) fb.style.background=bg;
          break;
        }
      }
    });
  }
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function selectRow(idx){
  // FIX: use _lastSortedPeople (the sorted array that renderRows used to assign data-idx)
  // Previously used getFiltered() which returns unsorted JSON order — causing 577/611 wrong selections
  const p=_lastSortedPeople[idx]; if(!p)return;
  if(activePerson && activePerson.famous === p.famous && tlFocusName === p.famous){
    _tlExitFocus();
    return;
  }
  activePerson=p;
  if(VIEW === 'timeline'){
    tlFocusName = p.famous;
    _tlApplyFocus();
  }
  document.querySelectorAll('.tl-row').forEach(r=>r.classList.toggle('sel',parseInt(r.dataset.idx)===idx));
  renderInfoWithDetails(p);
}

// ═══════════════════════════════════════════════════════════
// INFO PANEL
// ═══════════════════════════════════════════════════════════
function showEmptyInfo(){
  document.getElementById('infoScroll').innerHTML=
    `<div class="i-empty"><div class="ie-icon">☽</div><div class="ie-msg">Click a name to explore</div></div>`;
}


function _isAssumedDate(p){
  if(p.famous==='Prophet Muhammad')return false;
  if(p._dobFromDod)return true;
  const s=((p.dob_s||'')+(p.dod_s||'')).toLowerCase();
  if(/legendary|assumed|estimated|c\./.test(s))return true;
  if((p.type==='Founder'||p.type==='Prophet')&&p.dob<500)return true;
  return false;
}
const _assumedBadge='<span style="font-size:var(--fs-3);color:rgba(212,175,55,.55);cursor:help;margin-left:3px" title="Date estimated for visual placement — not historically confirmed">△</span>';

var _figureHadithChips = null;
var _figureHadithChipsLoading = null;
function _ensureFigureHadithChips(){
  if(_figureHadithChips) return Promise.resolve(_figureHadithChips);
  if(_figureHadithChipsLoading) return _figureHadithChipsLoading;
  _figureHadithChipsLoading = fetch(dataUrl('data/islamic/figure_hadith_chips.json'))
    .then(function(r){ return r.ok ? r.json() : {}; })
    .then(function(d){ _figureHadithChips = d || {}; return _figureHadithChips; })
    .catch(function(){ _figureHadithChips = {}; return _figureHadithChips; });
  return _figureHadithChipsLoading;
}
function _populateFigureHadithChip(p){
  var slot = document.getElementById('figHadithChipSlot');
  if(!slot) return;
  _ensureFigureHadithChips().then(function(chips){
    var ids = chips[p.slug];
    if(!ids || !ids.length) return;
    slot.innerHTML = '<span class="i-tag" id="figHadithChip" style="cursor:pointer;border-color:rgba(212,175,55,.5);color:#D4AF37">HADITHS</span>';
    var chip = document.getElementById('figHadithChip');
    if(chip){
      chip.onclick = function(ev){
        ev.stopPropagation();
        if(window.Monastic && typeof window.Monastic.showHadiths === 'function'){
          window.Monastic.showHadiths(ids, 'Hadiths about ' + (p.famous || p.slug));
        }
      };
    }
  });
}

function renderInfo(p){
  const col = p.type==='Genealogy' ? '#D4AF37' : (CC[gc(p.dob)]||'#A0AEC0');
  const _dobMain = p.dob_academic!=null ? p.dob_academic : p.dob;
  const _dodMain = p.dod_academic!=null ? p.dod_academic : p.dod;
  const dob_s=_dobMain!=null?(_dobMain<0?`${Math.abs(_dobMain)} BCE`:`${_dobMain} CE`):'Unknown';
  const dod_s=_dodMain!=null?(_dodMain<0?`${Math.abs(_dodMain)} BCE`:`${_dodMain} CE`):'Unknown';
  const _ab=_isAssumedDate(p)?_assumedBadge:'';


  // Quran references section
  let quranHtml='';
  if(p.quranRef){
    const qr=p.quranRef;
    if(typeof qr==='object'&&qr.count!=null){
      quranHtml=`<div class="i-sec"><div class="i-sl">Quranic References</div>
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:5px">
          <span style="font-family:'Cinzel',serif;font-size:var(--fs-1);font-weight:700;color:var(--ip-acc);line-height:1">${qr.count}×</span>
          <span style="font-size:var(--fs-3);color:var(--ip-muted)">mentioned in the Quran</span>
          <span style="font-size:var(--fs-3)">${typeof renderQuranRef==="function"?renderQuranRef(qr.firstVerse):esc(qr.firstVerse)}</span>
        </div>
        <div style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal">${esc(qr.epithet)}</div>
      </div>`;
    } else {
      quranHtml=`<div class="i-sec"><div class="i-sl">Quranic References</div>
        <div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">
          <span style="color:var(--ip-acc);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em">VERSES: </span>${typeof renderQuranRef==="function"?renderQuranRef(String(qr)):esc(String(qr))}
        </div></div>`;
    }
  } else if(p.quran_refs){
    const qlink=p.quran_link?`<a href="${p.quran_link}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none;font-size:var(--fs-3)"> — Open in Quran.com 🌐</a>`:'';
    quranHtml=`<div class="i-sec"><div class="i-sl">Quranic References</div>
      <div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">
        <span style="color:var(--ip-acc);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em">VERSES: </span>${typeof renderQuranRef==="function"?renderQuranRef(p.quran_refs):esc(p.quran_refs)}
      </div></div>`;
  }

  // Verse chips from quran_xref.json — one section, sorted by surah then verse_start.
  let quranChipsHtml='';
  const _xrefs=(window.QURAN_XREF_BY_SLUG && window.QURAN_XREF_BY_SLUG[p.slug]) || null;
  if(_xrefs && _xrefs.length){
    quranChipsHtml=`<section class="info-quran"><h4>QURAN</h4><div class="quran-chips">${_xrefs.map(r=>
      `<button class="quran-chip" data-surah="${r.surah}" data-vstart="${r.verse_start}" data-vend="${r.verse_end}">${esc(r.ref_text)}</button>`
    ).join('')}</div></section>`;
  }

  let booksHtml='';
  if(p.books?.length && p.type!=='Prophet'){
    const sortedBooks=[...p.books].sort((a,b)=>/quran/i.test(a.title)?-1:/quran/i.test(b.title)?1:0);
    booksHtml=`<div class="i-sec"><div class="i-sl">Works &amp; Sources</div>
      <div class="i-books">${sortedBooks.map(b=>`
        <div class="i-book">
          <span style="color:${col};font-size:var(--fs-3);flex-shrink:0">▸</span>
          <div>${b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">${esc(b.title)}</a>`:`<span>${esc(b.title)}</span>`}
          ${b.magnum?` <span style="color:var(--ip-acc);font-size:var(--fs-3)">✦</span>`:''}
          ${b.note?`<div class="i-bnote">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">quran.com</a>')}</div>`:''}</div>
        </div>`).join('')}
      </div></div>`;
  }
  // Scripture section for prophets (from figure_sources.json)
  const _fSrc=window._FIGURE_SOURCES&&window._FIGURE_SOURCES[p.slug];
  if(_fSrc&&_fSrc.scripture_or_refs&&_fSrc.scripture_or_refs.length){
    booksHtml+=`<div class="i-sec"><div class="i-sl">Scripture</div>
      <div class="i-books">${_fSrc.scripture_or_refs.map(ref=>`
        <div class="i-book">
          <span style="color:${col};font-size:var(--fs-3);flex-shrink:0">▸</span>
          <div><span>${esc(ref.title)}</span>
          ${ref.revealed_to?`<div class="i-bnote">Revealed to ${esc(ref.revealed_to)}</div>`:''}</div>
        </div>`).join('')}
      </div></div>`;
  }
  let teachHtml='';
  if(p.famous!=='Prophet Muhammad'&&p.teachers?.length){
    teachHtml=`<div class="i-sec"><div class="i-sl">Teachers</div>
      <div class="i-teachers">
        ${p.teachers.map(t=>`<span class="i-teacher" onclick="jumpTo('${t.replace(/'/g,"\\'")}')">⟵ ${esc(t)}</span>`).join('')}
      </div></div>`;
  }

  // Students (people who list this figure as a teacher)
  const studentsOf=PEOPLE.filter(s=>s.teachers?.includes(p.famous));
  let studHtml='';
  if(p.famous!=='Prophet Muhammad'&&studentsOf.length){
    studHtml=`<div class="i-sec"><div class="i-sl">Students (${studentsOf.length})</div>
      <div class="i-teachers">
        ${studentsOf.map(s=>`<span class="i-student" onclick="jumpTo('${s.famous.replace(/'/g,"\\'")}')">▶ ${esc(s.famous)}</span>`).join('')}
      </div></div>`;
  }

  let relHtml='';
  if(p.relations?.length){
    relHtml=`<div class="i-sec"><div class="i-sl">Relations</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
        ${p.relations.map(r=>{
          const inData=PEOPLE.find(pp=>pp.famous===r.person);
          const relLabel=`<span class="i-rel-type">${esc(r.relation)}</span>`;
          const name=esc(r.person);
          if(inData){
            return `<span class="i-rel-chip clickable" data-rel="${esc(r.relation)}" onclick="jumpTo('${r.person.replace(/'/g,"\\'")}')" title="Go to ${esc(r.person)}">${relLabel} ${name}</span>`;
          } else {
            return `<span class="i-rel-chip" data-rel="${esc(r.relation)}">${relLabel} ${name}</span>`;
          }
        }).join('')}
      </div></div>`;
  }

  // Locate-in-silsila button (only when silsila view active and node exists)
  const locateBtn=VIEW==='silsila'&&SL_NM[p.famous]
    ?`<button class="sl-locate-btn" onclick="silsilaLocate('${p.famous.replace(/'/g,"\\'")}')">`+
      `<span class="slb-icon">◎</span>LOCATE IN CHAIN</button>`:'';

  var _isFav = APP.Favorites ? APP.Favorites.has(p.famous) : false;
  var _starHTML = '<button id="favToggleBtn" data-name="' + esc(p.famous) + '" '
    + 'title="' + (_isFav ? 'Remove from saved' : 'Save figure') + '" '
    + 'style="background:none;border:none;cursor:pointer;font-size:var(--fs-1);'
    + 'color:' + (_isFav ? '#D4AF37' : 'rgba(160,174,192,0.25)') + ';'
    + 'float:right;margin-left:10px;padding:2px;line-height:1;'
    + 'transition:color 0.15s,transform 0.15s;">'
    + (_isFav ? '★' : '☆') + '</button>';

  let quotesHtml = '';
  if (p.quotes && p.quotes.length) {
    const qItems = p.quotes.map(q =>
      '<blockquote style="margin:0 0 10px 0;padding:10px 14px;' +
      'border-left:3px solid var(--ip-acc);' +
      'background:rgba(212,175,55,.05);' +
      'font-family:\'Source Sans 3\',sans-serif;font-size:var(--fs-3);' +
      'font-style:normal;color:var(--ip-text);line-height:1.65;">' +
      esc(q) + '</blockquote>'
    ).join('');
    quotesHtml =
      '<div style="margin-top:18px;padding-top:14px;' +
      'border-top:1px solid var(--ip-brd);">' +
      '<div style="font-family:\'Cinzel\',serif;font-size:var(--fs-3);' +
      'letter-spacing:.14em;color:var(--ip-muted);display:flex;' +
      'align-items:center;gap:6px;margin-bottom:10px;">' +
      'IN THEIR OWN WORDS' +
      '<span style="flex:1;height:1px;background:var(--ip-brd);' +
      'display:inline-block;"></span></div>' +
      qItems + '</div>';
  }


  document.getElementById('infoScroll').innerHTML=`
    ${locateBtn}
    ${_starHTML}
    ${canShowImage(p) ? `
    <div id="wikiImgWrap" style="float:right;margin:0 0 12px 14px;max-width:120px;text-align:center">
      <img id="wikiImg" style="display:none;width:100%;max-width:120px;border-radius:4px;border:1px solid var(--ip-brd);object-fit:cover"
        alt="${esc(p.famous)}"
        onerror="this.style.display='none';document.getElementById('wikiImgCaption').style.display='none';" />
      <div id="wikiImgCaption" style="display:none;font-size:var(--fs-3);color:var(--ip-muted);font-family:'Cinzel',serif;letter-spacing:.06em;margin-top:4px">via Wikipedia</div>
    </div>` : ''}
    <div class="i-name">${esc(p.famous)}${p.names_i18n?'<span class="i18n-trigger" id="i18nTrigger" title="View name in other languages" style="display:inline-block;margin-left:8px;font-size:var(--fs-3);color:var(--ip-muted);cursor:pointer;vertical-align:middle;opacity:.5;transition:opacity .15s" onmouseenter="this.style.opacity=1" onmouseleave="this.style.opacity=.5">🌐</span>':''}</div>
    ${p.full&&p.full!==p.famous?`<div class="i-full">${esc(p.full)}</div>`:''}
    <div class="i-primary">${esc(p.primaryTitle||'')}</div>
    ${p.tags&&p.tags.length?`<div style="margin-bottom:10px;display:flex;flex-wrap:wrap;gap:5px">${p.tags.map(t=>`<span class="i-badge">${esc(t)}</span>`).join('')}</div>`:''}
    <div class="i-tags">
      <span class="i-tag hi">${esc(p.type||'')}</span>
      <span class="i-tag hi">${esc(p.tradition||'')}</span>
      ${p.classif?`<span class="i-tag">${esc(p.classif)}</span>`:''}
      ${p.city?`<span class="i-tag">📍 ${esc(p.city)}</span>`:''}
      ${p.lang?`<span class="i-tag">🌐 ${esc(p.lang)}</span>`:''}
      <span id="figHadithChipSlot"></span>
    </div>
    ${(()=>{if(!window._wikidata||!window._wikidata[p.slug]||!window._wikidata[p.slug].occupations||!window._WD_OCC_LABELS) return '';const chips=window._wikidata[p.slug].occupations.slice(0,5).map(q=>window._WD_OCC_LABELS[q]).filter(Boolean);if(!chips.length) return '';return '<div class="info-wd-occupations">'+chips.map(l=>'<span class="info-wd-occ">'+esc(l)+'</span>').join('')+'</div>';})()}
    ${window._journeyFigures&&window._journeyFigures.has(p.slug)?`<a class="info-follow-link" href="#follow" onclick="event.preventDefault();window._followShowFigure('${p.slug}');return false;">&#9654; Follow their life on the map</a>`:''}
    <div class="i-dates">
      <div class="i-di"><span class="dl">BORN</span><span style="white-space:nowrap"><span class="dv" style="color:${col}">${dob_s}</span>${_ab}${p.dob_s?`<span style="font-size:var(--fs-3);color:rgba(160,174,192,.75);margin-left:6px">${esc(p.dob_s)}</span>`:''}</span>${p.dating_source?`<span class="ds" style="font-style:normal;opacity:.75;display:block;margin-top:2px">${esc(p.dating_source)}</span>`:''}</div>
      <div class="i-di"><span class="dl">DIED</span><span style="white-space:nowrap"><span class="dv" style="color:${col}">${dod_s}</span>${_ab}${p.dod_s?`<span style="font-size:var(--fs-3);color:rgba(160,174,192,.75);margin-left:6px">${esc(p.dod_s)}</span>`:''}</span>${p.dating_source?`<span class="ds" style="font-style:normal;opacity:.75;display:block;margin-top:2px">${esc(p.dating_source)}</span>`:''}</div>
      ${p.dob>0&&p.dod?`<div class="i-di"><span class="dl">CENTURY</span><span class="dv" style="color:${col}">${centLabel(gc(p.dob))} C.</span></div>`:''}
    </div>
    ${((p.dob_s||'')+(p.dod_s||'')).toLowerCase().includes('legendary')?`<div style="font-size:var(--fs-3);color:rgba(160,174,192,.55);margin:-4px 0 10px 2px;line-height:1.4">Source: Ibn Ishaq, <i>Sirat Rasul Allah</i>; al-Tabari, <i>Tarikh al-Rusul wa al-Muluk</i></div>`:''}
    ${p.dateNote?`<div style="display:flex;align-items:flex-start;gap:5px;margin:-6px 0 13px;padding:5px 9px;background:rgba(212,175,55,.08);border:1px dashed rgba(212,175,55,.35);border-radius:3px;font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;line-height:1.45"><span style="flex-shrink:0">⚠</span><span>${esc(p.dateNote)}</span></div>`:''}
    ${(p.famous==='Prophet Muhammad'?(p.school||'The Last Prophet'):p.school)?`<div class="i-sec"><div class="i-sl">Biography</div><p>${p.famous==='Prophet Muhammad'?(p.school||'The Last Prophet'):p.school}</p></div>`:''}
    ${p.titles?`<div class="i-sec"><div class="i-sl">Titles &amp; Epithets</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${p.titles.split('·').map(t=>t.trim()).filter(Boolean).map(t=>`<span class="i-badge">${esc(t)}</span>`).join('')}</div></div>`:''}
    ${quranHtml}${quranChipsHtml}${teachHtml}${studHtml}${relHtml}${booksHtml}
    ${quotesHtml}
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--ip-brd);display:flex;gap:8px;flex-wrap:wrap;">
      <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(p.famous)}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:2px;
        background:var(--ip-surf);border:1px solid var(--ip-brd);
        font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.12em;
        color:var(--ip-muted);text-decoration:none;
        transition:color .15s,border-color .15s;"
        onmouseenter="this.style.color='var(--ip-acc)';this.style.borderColor='rgba(212,175,55,.4)'"
        onmouseleave="this.style.color='var(--ip-muted)';this.style.borderColor='var(--ip-brd)'">
        <span style="font-size:var(--fs-3);">𝒮</span> SCHOLARSHIP
      </a>
    </div>
    ${p.source?`<div class="i-source">Sources: ${(()=>{
      const s=p.source;
      if(/^https?:\/\//.test(s)){
        try{
          const u=new URL(s);
          const host=u.hostname.replace(/^www\./,'');
          let label;
          if(host.includes('wikipedia')){
            const name=decodeURIComponent(u.pathname.split('/').pop()||'').replace(/_/g,' ');
            label=name?'Wikipedia — '+name+' ↗':'Wikipedia ↗';
          } else if(host.includes('sunnah.com')){
            label='Sunnah.com ↗';
          } else {
            label=host+' ↗';
          }
          return '<a href="'+esc(s)+'" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">'+esc(label)+'</a>';
        }catch(_){return esc(s);}
      }
      return esc(s);
    })()}</div>`:''}
  `;

  // Fetch Wikipedia image if eligible
  if (canShowImage(p)) {
    var imgEl = document.getElementById('wikiImg');
    var capEl = document.getElementById('wikiImgCaption');
    if (imgEl) fetchWikiImage(p.source, imgEl, capEl);
  }

  // Wire star button click handler
  (function() {
    var btn = document.getElementById('favToggleBtn');
    if (!btn || !APP.Favorites) return;
    btn.addEventListener('click', function() {
      var self = this;
      requireTester('save', function() {
        var name = self.dataset.name;
        var nowFav = APP.Favorites.toggle(name);
        self.textContent   = nowFav ? '★' : '☆';
        self.style.color   = nowFav ? '#D4AF37' : 'rgba(160,174,192,0.25)';
        self.title         = nowFav ? 'Remove from saved' : 'Save figure';
        self.style.transform = 'scale(1.5)';
        setTimeout(function() { self.style.transform = 'scale(1)'; }, 180);
        _updateFavFilterBtn();
      });
    });
  })();

  // Wire i18n hover popup
  (function() {
    var trigger = document.getElementById('i18nTrigger');
    if (!trigger || !activePerson || !activePerson.names_i18n) return;
    var names = activePerson.names_i18n;
    trigger.addEventListener('click', function(e) {
      e.stopPropagation();
      var existing = document.getElementById('i18nPopup');
      if (existing) { existing.remove(); return; }
      var langs = Object.keys(names).filter(function(k) { return names[k] && APP._LANG_LABELS[k]; });
      if (!langs.length) return;
      var rows = langs.map(function(lang) {
        var isRtl = APP._RTL_LANGS.has(lang);
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--ip-brd)">' +
          '<span style="font-size:var(--fs-3);color:var(--ip-muted);min-width:70px">' + APP._LANG_LABELS[lang] + '</span>' +
          '<span style="font-size:var(--fs-3);color:var(--ip-text);font-family:\'Source Sans 3\',sans-serif;text-align:right"' +
          (isRtl ? ' dir="rtl"' : '') + '>' + names[lang] + '</span></div>';
      }).join('');
      var popup = document.createElement('div');
      popup.id = 'i18nPopup';
      popup.innerHTML =
        '<div style="font-family:\'Cinzel\',serif;font-size:var(--fs-3);letter-spacing:.12em;color:var(--ip-muted);margin-bottom:8px;display:flex;align-items:center;gap:6px">NAME IN OTHER LANGUAGES<span style="flex:1;height:1px;background:var(--ip-brd)"></span><span style="cursor:pointer;font-size:var(--fs-3);color:var(--ip-muted)" onclick="document.getElementById(\'i18nPopup\').remove()">×</span></div>' + rows;
      popup.style.cssText = 'position:absolute;top:' + (trigger.getBoundingClientRect().bottom - trigger.closest('#infoScroll').getBoundingClientRect().top + 8) + 'px;left:10px;right:10px;background:var(--ip-bg);border:1px solid var(--ip-brd);border-radius:4px;padding:10px 14px;z-index:100;box-shadow:0 4px 16px rgba(0,0,0,.3)';
      trigger.closest('#infoScroll').style.position = 'relative';
      trigger.closest('#infoScroll').appendChild(popup);
      function closeOnOutside(ev) {
        if (!popup.contains(ev.target) && ev.target !== trigger) {
          popup.remove();
          document.removeEventListener('click', closeOnOutside);
        }
      }
      setTimeout(function() { document.addEventListener('click', closeOnOutside); }, 10);
    });
  })();

  _populateFigureHadithChip(p);
}

function selectPerson(name) {
  jumpTo(name);
}

function jumpTo(name){
  // In silsila mode: locate node in the SVG and render info
  if(VIEW==='silsila'){
    const p=PEOPLE.find(pp=>pp.famous===name); if(!p)return;
    activePerson=p; renderInfoWithDetails(p);
    silsilaLocate(name);
    const svg=document.getElementById('silsilaSVG'); if(!svg)return;
    svg.querySelectorAll('.sl-node.sl-selected').forEach(n=>n.classList.remove('sl-selected'));
    svg.querySelectorAll('.sl-node').forEach(n=>{
      if(n.dataset.name===name) n.classList.add('sl-selected');
    });
    // Sync lane label
    const inner2=document.getElementById('silsilaLanesInner');
    if(inner2){
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>l.classList.remove('sl-lane-sel'));
      const tl=isLineageMember(p)?'Prophetic Lineage':p.tradition||'';
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>{if(l.dataset.lane===tl)l.classList.add('sl-lane-sel');});
    }
    return;
  }
  // Timeline mode — use _lastSortedPeople (matches display order)
  let idx=_lastSortedPeople.findIndex(p=>p.famous===name);
  if(idx===-1){
    const p=PEOPLE.find(pp=>pp.famous===name);
    if(p) renderInfoWithDetails(p);
    return;
  }
  const rows=document.querySelectorAll('.tl-row');
  const target=[...rows].find(r=>parseInt(r.dataset.idx)===idx);
  const _person = _lastSortedPeople[idx];
  const _preIslamic = _person && _person.dob != null && _person.dob < 570;
  if(target && !_preIslamic){
    var _sc=document.getElementById('rowsScroll');
    if(_sc){
      var _tr=target.getBoundingClientRect(),_cr=_sc.getBoundingClientRect();
      _sc.scrollTo({top: _sc.scrollTop+(_tr.top-_cr.top)-(_cr.height/2)+(_tr.height/2), behavior:'smooth'});
      // Horizontal centering on birth century band
      if(_person.dob != null){
        var _cent = _person.dob<600 ? 6 : Math.ceil(_person.dob/100);
        var _band = _sc.querySelector('[data-cent="'+_cent+'"]') || document.querySelector('[data-cent="'+_cent+'"]');
        if(_band){
          var _br = _band.getBoundingClientRect();
          _sc.scrollTo({left: _sc.scrollLeft+(_br.left-_cr.left)-(_cr.width/2)+(_br.width/2), behavior:'smooth'});
        }
      }
    }else{
      target.scrollIntoView({block:'center', inline:'center', behavior:'smooth'});
    }
    target.classList.remove('tl-jump-pulse');
    void target.offsetWidth;
    target.classList.add('tl-jump-pulse');
    setTimeout(function(){ target.classList.remove('tl-jump-pulse'); }, 1500);
  } else if(target){
    var _sc2=document.getElementById('rowsScroll');
    if(_sc2){
      var _tr2=target.getBoundingClientRect(),_cr2=_sc2.getBoundingClientRect();
      _sc2.scrollTop+=(_tr2.top-_cr2.top)-(_cr2.height/2)+(_tr2.height/2);
    }else{
      target.scrollIntoView({block:'center',behavior:'smooth'});
    }
  }
  selectRow(idx);
}
// Switches to Timeline, centres the century columns on the person, scrolls the row into view,
// and highlights it — works correctly from Map, Silsila, or any other view.
function focusPersonInTimeline(name){
  const p=PEOPLE.find(pp=>pp.famous===name); if(!p) return;

  // Lift year filter if the person wouldn't be visible under it
  if(activeYear!==null){
    const dod=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
    if(p.dob>activeYear||dod<activeYear){
      activeYear=null;
      _viewYears[VIEW]=null;
      if(VIEW==='map'&&typeof _applyMapYear==='function') _applyMapYear(null);
      document.getElementById('yearDisplay').textContent='\u2014';
      const cb=document.getElementById('yearClearBtn'); if(cb) cb.classList.remove('active');
    }
  }

  setView('timeline');

  // Horizontal: centre on midpoint of lifespan, not just birth century
  const deathYr = (p.dod!=null) ? p.dod : (p.dob!=null ? p.dob+60 : null);
  if(p.dob!=null){
    const mid = (deathYr!=null) ? Math.floor((p.dob+deathYr)/2) : p.dob;
    const cent = mid<600 ? 6 : Math.ceil(mid/100);
    const idx = ALL_CENTS.indexOf(cent);
    if(idx!==-1){ centIdx = Math.max(idx,1); setCW(); }
    updateCentHeaders(); updateCentScrollbar();
  }

  renderAll();

  // Wait for layout, then select + centre + pulse
  requestAnimationFrame(()=>{ requestAnimationFrame(()=>{
    activePerson=p;
    renderInfoWithDetails(p);
    const rows=document.querySelectorAll('.tl-row');
    let target=null;
    rows.forEach(r=>{
      const nm=r.querySelector('.tc-famous');
      if(nm && nm.textContent.trim().indexOf(name)===0){
        r.classList.add('sel'); target=r;
      } else {
        r.classList.remove('sel');
      }
    });
    if(target){
      target.scrollIntoView({block:'center', inline:'center', behavior:'smooth'});
      target.classList.remove('focus-pulse');
      void target.offsetWidth;            // force reflow so animation restarts
      target.classList.add('focus-pulse');
      setTimeout(()=>{ target.classList.remove('focus-pulse'); }, 1600);
    }
  });});
}

function _showTimelineMethodology(){
  if(document.getElementById('tl-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='tl-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="tl-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 16px">Every figure in the database arranged chronologically, grouped by century. Use type and tradition filters to narrow the view. Click any figure for their info card. Use the year slider to highlight who was alive at a specific time.</p>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Figure Types</h3>'+'<div style="font-size:var(--fs-3);line-height:1.7"><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#D4AF37;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Prophet</span><span style="color:#A0AEC0">A messenger of God. Never depicted visually</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4A90D9;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Companion</span><span style="color:#A0AEC0">Met the Prophet Muhammad and accepted Islam. Never depicted</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E6833A;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Scholar</span><span style="color:#A0AEC0">Contributions to Islamic sciences, law, theology, or philosophy</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#C0392B;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Ruler</span><span style="color:#A0AEC0">Caliph, sultan, emir, or governor</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#9B59B6;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Poet</span><span style="color:#A0AEC0">Remembered primarily for literary or poetic works</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#2ECC71;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Sufi</span><span style="color:#A0AEC0">Associated with Islamic mysticism and spiritual practice</span></div></div>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 12px">Biographical data from classical Islamic sources including al-Dhahabi and Ibn Sa\u2019d, cross-referenced with Wikipedia. Dates marked \u2248 are approximate. Dates marked \u25B3 are estimated for visual placement and not historically confirmed \u2014 these are typically legendary figures, figures with no recorded dates, or rough century estimates (e.g. \u201Cc. 800 CE\u201D). When a death year is missing, it is sometimes estimated from the birth year using an average life span. Tradition classifications are simplified.</p>'+'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('tl-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

// ═══════════════════════════════════════════════════════════
// TIMELINE ANIMATION — uses the shared window.AnimControls pill.
// Readout (#tlAnimReadout) lives as a sibling of #tlAnimPanel (the mount).
// ═══════════════════════════════════════════════════════════
(function(){
  let animActive = false;
  let animPaused = false;
  let animIndex = 0;
  let animTimer = null;
  let dwellMs = 1200; // initial 1x from AnimControls SPEED_MAP

  function _getAnimVisible(){
    const filtered = (typeof getFiltered === 'function') ? getFiltered() : PEOPLE;
    return [...filtered].sort((a,b)=>_dobOf(a)-_dobOf(b)).filter(p => _dobOf(p) != null);
  }

  function _animTick(){
    const visible = _getAnimVisible();
    if(!visible.length || animIndex >= visible.length){ _animStop(); return; }
    const p = visible[animIndex];

    if(typeof selectRow === 'function'){
      const rendered = (typeof _lastSortedPeople !== 'undefined' && _lastSortedPeople.length) ? _lastSortedPeople : visible;
      const rowIdx = rendered.indexOf(p);
      if(rowIdx >= 0) selectRow(rowIdx);
    }

    const rs = document.getElementById('rowsScroll');
    if(rs){
      const visIdx = visible.indexOf(p);
      const desiredTop = Math.max(0, (visIdx - 8)) * ROW_H;
      rs.scrollTop = desiredTop;
    }

    const readout = document.getElementById('tlAnimReadout');
    if(readout){
      const d = _dobOf(p);
      readout.textContent = (d < 0 ? Math.abs(d) + ' BCE' : d + ' CE');
    }

    animIndex++;
    animTimer = setTimeout(_animTick, dwellMs);
  }

  function _animStart(){
    animActive = true;
    animPaused = false;
    if(animIndex === 0 || animIndex >= _getAnimVisible().length) animIndex = 0;
    const tc = document.getElementById('tlCenter');
    if(tc) tc.classList.add('anim-active');
    _animTick();
  }

  function _animPause(){
    if(animTimer){ clearTimeout(animTimer); animTimer = null; }
    animPaused = true;
  }

  function _animStop(){
    if(animTimer){ clearTimeout(animTimer); animTimer = null; }
    animActive = false;
    animPaused = false;
    animIndex = 0;
    const tc = document.getElementById('tlCenter');
    if(tc) tc.classList.remove('anim-active');
    const readout = document.getElementById('tlAnimReadout');
    if(readout) readout.textContent = '\u2014';
  }

  function _wire(){
    const mount = document.getElementById('tlAnimPanel');
    if(!mount || !window.AnimControls || typeof window.AnimControls.create !== 'function') return;
    if(mount.dataset.acMounted) return;
    mount.dataset.acMounted = '1';
    window.AnimControls.create({
      mountEl: mount,
      idPrefix: 'tl',
      initialSpeed: '1x',
      onPlay: _animStart,
      onPause: _animPause,
      onStop: _animStop,
      onSpeedChange: function(ms){ dwellMs = ms; }
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', _wire);
  } else {
    _wire();
  }
})();

// ── TIMELINE export hook (BV42) ────────────────────────────
window._tlGetExportNode = function(){
  console.log('[TL EXPORT] hook fired');
  var ip = document.getElementById('infoPanel');
  if(!ip){ console.warn('[TL EXPORT] no infoPanel'); return null; }
  var wrap = document.createElement('div');
  wrap.style.cssText = 'background:#0E1621;color:#E8EAEF;padding:32px;font-family:Lato,sans-serif;width:780px;max-height:3200px;overflow:hidden';
  var hdr = document.createElement('div');
  hdr.style.cssText = 'text-align:center;padding:8px 0 18px;border-bottom:1px solid #d4af37;margin-bottom:24px';
  hdr.innerHTML = '<img src="assets/gold-ark-logo-text.png" alt="Gold Ark" style="max-height:40px;display:inline-block">';
  wrap.appendChild(hdr);
  var inner = document.createElement('div');
  inner.innerHTML = ip.innerHTML;
  inner.style.cssText = 'width:100%;height:auto;position:static;display:block';
  var all = inner.querySelectorAll('*');
  for(var i=0;i<all.length;i++){
    var el = all[i];
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';
    el.style.position = 'static';
    el.style.transform = 'none';
    el.style.height = 'auto';
  }
  wrap.appendChild(inner);
  console.log('[TL EXPORT] node ready, height=', wrap.scrollHeight);
  return wrap;
};
