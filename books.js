/* ─────────────────────────────────────────────────────────────
   BOOKS view — verbatim lift from bv-app/books.js
   IIFE exposes window.BooksView = { mount, unmount }
   ───────────────────────────────────────────────────────────── */
window.BooksView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global — BOOKS uses 'books'
  var VIEW = 'books';
  window.VIEW = 'books';
  // stub: APP namespace
  var APP = window.APP || {
    Favorites: null, filterFavsOnly: false, _lang: 'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; }
  };
  window.APP = APP;
  // stub: setView — sandbox shell uses setActiveTab; books' wrappers around setView
  // early-exit when window.setView is not a function (already in lifted code).
  // We deliberately leave it undefined so the lifted IIFE wrappers no-op.
  // stub: jumpTo — bv-row click → "go to figure in TIMELINE"; in sandbox we log only.
  if(typeof window.jumpTo !== 'function') window.jumpTo = function(name){
    console.log('[books] jumpTo (stub):', name);
  };
  // stub: TRAD_COLORS (silsila-injected global). _bvGetTradColor null-checks.
  if(typeof window.TRAD_COLORS === 'undefined') window.TRAD_COLORS = null;
  // stub: AnimControls — leave undefined; lifted code at line 853 was unconditional —
  //       we guarded that one call site below.
  // stub: _resizeShell
  if(typeof window._resizeShell !== 'function') window._resizeShell = function(){};

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/books.js ▼▼▼
  // ═══════════════════════════════════════════════════════════

const _BV_ROW_H = 52;
const _BV_TOP_PAD = 40;
const _BV_BOT_PAD = 80;
const _BV_LEFT_W = 540;
const _BV_STEM_X = 600;

function _bYr(b){return b.year_display!=null?b.year_display:b.year;}

let _BOOKS_DATA = null;
var _ANCIENT_DATA = null;
var _ancientOn = false;
let _booksInited = false;
let _booksFilter = { source:new Set(), theme:new Set(), author:new Set(), search:'' };
var _IN_HOUSE_TAFSIR = {
  "tafsir ibn kathir": "en-tafisr-ibn-kathir",
  "tafsir al-tabari": "ar-tafsir-al-tabari",
  "jami al-bayan": "ar-tafsir-al-tabari",
  "tafsir al-jalalayn": "en-al-jalalayn",
  "tafsir al-qurtubi": "ar-tafsir-al-qurtubi",
  "al-jami li-ahkam al-quran": "ar-tafsir-al-qurtubi",
  "tafsir al-baghawi": "ar-tafsir-al-baghawi",
  "maalim al-tanzil": "ar-tafsir-al-baghawi",
  "tafsir al-muyassar": "ar-tafsir-muyassar",
  "tafsir al-wasit": "ar-tafsir-al-wasit",
  "tanwir al-miqbas": "en-tafsir-ibn-abbas",
  "tafsir ibn abbas": "en-tafsir-ibn-abbas",
  "tafsir al-sadi": "ar-tafseer-al-saddi",
  "taysir al-karim al-rahman": "ar-tafseer-al-saddi",
  "maariful quran": "en-tafsir-maarif-ul-quran",
  "ma'ariful quran": "en-tafsir-maarif-ul-quran",
  "tazkirul quran": "en-tazkirul-quran",
  "tafsir al-tustari": "en-tafsir-al-tustari",
  "lata'if al-isharat": "en-al-qushairi-tafsir",
  "lataif al-isharat": "en-al-qushairi-tafsir",
  "ta'wilat al-qur'an": "en-kashani-tafsir",
  "tawilat al-quran": "en-kashani-tafsir",
  "kashf al-asrar": "en-kashf-al-asrar-tafsir",
  "asbab al-nuzul": "en-asbab-al-nuzul-by-al-wahidi",
  "bayan ul quran": "ur-tafsir-bayan-ul-quran",
  "tafsir abu bakr zakaria": "bn-tafsir-abu-bakr-zakaria",
  "ahsanul bayaan": "bn-tafsir-ahsanul-bayaan",
  "fathul majid": "bn-tafisr-fathul-majid",
  "tafsir rebar": "kurd-tafsir-rebar"
};
var _IN_HOUSE_HADITH = {
  "sahih al-bukhari": "sahih-bukhari",
  "sahih bukhari": "sahih-bukhari",
  "the authentic collection": "sahih-bukhari",
  "sahih muslim": "sahih-muslim",
  "sunan abi dawud": "sunan-abi-daud",
  "sunan abu dawud": "sunan-abi-daud",
  "jami al-tirmidhi": "jami-al-tirmidhi",
  "jami at-tirmidhi": "jami-al-tirmidhi",
  "sunan an-nasai": "sunan-an-nasai",
  "sunan an-nasa'i": "sunan-an-nasai",
  "sunan ibn majah": "sunan-ibn-majah"
};
function _booksNormTitle(s){
  return String(s||'').toLowerCase()
    .replace(/[‘’ʾʿʼʻ'`]/g,'')
    .replace(/[\(\)\[\]\.,:;!?"]/g,'')
    .replace(/\s+/g,' ')
    .trim();
}
function _booksMatchInHouse(b){
  if(!b || !b.title) return null;
  var t = _booksNormTitle(b.title);
  // strip parenthetical bits e.g. "Sahih al-Bukhari (The Authentic Collection)"
  var bare = t.split(' (')[0].trim();
  if(_IN_HOUSE_TAFSIR[t]) return { type:'tafsir', id:_IN_HOUSE_TAFSIR[t] };
  if(_IN_HOUSE_TAFSIR[bare]) return { type:'tafsir', id:_IN_HOUSE_TAFSIR[bare] };
  if(_IN_HOUSE_HADITH[t]) return { type:'hadith', id:_IN_HOUSE_HADITH[t] };
  if(_IN_HOUSE_HADITH[bare]) return { type:'hadith', id:_IN_HOUSE_HADITH[bare] };
  return null;
}
var _booksTafsirXref = null;
var _booksTafsirLoading = false;
var _booksNameToSlug = null;
function _ensureBooksTafsirXref(){
  if(_booksTafsirXref || _booksTafsirLoading) return;
  _booksTafsirLoading = true;
  fetch(dataUrl('data/islamic/xref/tafsir_xref_books.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      _booksTafsirXref = j || {};
      _booksTafsirLoading = false;
      console.log('[BOOKS] tafsir xref: loaded', Object.keys(_booksTafsirXref).length, 'figure-book pairs');
      _bvHydrateTafsirChips();
      _ensureBooksConceptsXref();
    })
    .catch(function(e){ _booksTafsirLoading = false; console.warn('[BOOKS] tafsir xref load failed', e); });
}
var _booksConceptsXref = null;
var _booksConceptsLoading = false;
var _booksConceptCanon = null;
function _ensureBooksConceptsXref(){
  if(_booksConceptsXref || _booksConceptsLoading) return;
  _booksConceptsLoading = true;
  Promise.all([
    fetch(dataUrl('data/islamic/concepts/concept_reverse_books.json')).then(function(r){ return r.ok?r.json():null; }).catch(function(){return null;}),
    fetch(dataUrl('data/islamic/concepts/concept-canon.json')).then(function(r){ return r.ok?r.json():null; }).catch(function(){return null;})
  ]).then(function(res){
    _booksConceptsXref = res[0] || {};
    _booksConceptCanon = res[1] || {};
    _booksConceptsLoading = false;
    console.log('[BOOKS] concepts xref: loaded', Object.keys(_booksConceptsXref).length, 'figure-book pairs;', Object.keys(_booksConceptCanon).length, 'canon');
    _bvHydrateConceptChips();
  });
}
function _bvHydrateConceptChips(){
  if(!_booksConceptsXref) return;
  var ppl = window.PEOPLE || [];
  if(!_booksNameToSlug || Object.keys(_booksNameToSlug).length === 0){
    _booksNameToSlug = {};
    ppl.forEach(function(p){ if(p && p.famous && p.slug) _booksNameToSlug[p.famous] = p.slug; });
  }
  document.querySelectorAll('.bv-row').forEach(function(row){
    if(row.querySelector('.bv-concept-chip')) return;
    var name = row.getAttribute('data-name') || '';
    var bid = row.getAttribute('data-id') || '';
    if(!name || !bid) return;
    var slug = _booksNameToSlug[name];
    if(!slug) return;
    var key = slug + '-' + bid;
    var entries = _booksConceptsXref[key];
    if(!entries || !entries.length) return;
    var chip = document.createElement('span');
    chip.className = 'bv-concept-chip';
    chip.textContent = entries.length + ' concept' + (entries.length===1?'':'s');
    chip.title = 'Click to explore concepts in THINK';
    chip.style.cssText = 'position:absolute;left:88px;top:50%;transform:translateY(-50%);background:rgba(120,200,180,0.10);color:#78c8b4;border:1px solid rgba(120,200,180,0.45);border-radius:10px;padding:2px 8px;font-size:10px;font-family:Lato,sans-serif;letter-spacing:.05em;cursor:pointer;z-index:6;white-space:nowrap';
    chip.addEventListener('click', function(e){
      e.stopPropagation();
      window._booksShowConcepts(key, name, bid);
    });
    row.appendChild(chip);
  });
}
function _bvHydrateTafsirChips(){
  if(!_booksTafsirXref) return;
  var ppl = window.PEOPLE || [];
  if(!_booksNameToSlug || Object.keys(_booksNameToSlug).length === 0){
    _booksNameToSlug = {};
    ppl.forEach(function(p){ if(p && p.famous && p.slug) _booksNameToSlug[p.famous] = p.slug; });
  }
  document.querySelectorAll('.bv-row').forEach(function(row){
    if(row.querySelector('.bv-tafsir-chip')) return;
    var name = row.getAttribute('data-name') || '';
    var bid = row.getAttribute('data-id') || '';
    if(!name || !bid) return;
    var slug = _booksNameToSlug[name];
    if(!slug) return;
    var key = slug + '-' + bid;
    var entries = _booksTafsirXref[key];
    if(!entries || !entries.length) return;
    var chip = document.createElement('span');
    chip.className = 'bv-tafsir-chip';
    chip.textContent = entries.length + ' tafsir';
    chip.title = 'Click to view all tafsir mentions in EXPLAIN';
    chip.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);background:rgba(192,132,252,0.10);color:#c084fc;border:1px solid rgba(192,132,252,0.45);border-radius:10px;padding:2px 8px;font-size:10px;font-family:Lato,sans-serif;letter-spacing:.05em;cursor:pointer;z-index:6;white-space:nowrap';
    chip.addEventListener('click', function(e){
      e.stopPropagation();
      window._booksShowTafsirs(key, name, bid);
    });
    row.appendChild(chip);
  });
}
let _booksAnim = { mode:'stopped', timer:null, idx:0, rows:null, speedMs:1200, tick:null };

const _BV_TYPE_COLORS = {
  'Prophet':'#D4AF37','Founder':'#b8860b','Sahaba':'#e74c3c','Sahabiyya':'#ff6b6b',
  "Tabi'un":'#e67e22','Scholar':'#3498db','Mystic':'#2ECC71','Ruler':'#9b59b6',
  'Poet':'#e91e90','Philosopher':'#1abc9c','Scientist':'#00bcd4','Historian':'#8d6e63',
  'Reformer':'#ff9800','Jurist':'#5c6bc0','Caliph':'#ab47bc','Warrior':'#ef5350'
};
const _BV_TRAD_COLORS = {
  'Hadith Sciences':'#4fc3f7','Early Ascetics':'#66bb6a',
  'Islamic Jurisprudence':'#7986cb','Islamic Philosophy':'#4db6ac','Islamic Sciences':'#4dd0e1',
  'Islamic Theology':'#9575cd','Islamic Literature':'#f06292','Persian Poetry':'#ce93d8',
  'Khorasan School':'#a1887f','Baghdad School':'#90a4ae','Naqshbandiyya':'#7e57c2',
  'Shadhiliyya':'#26a69a','Qadiriyya':'#42a5f5','Chishti':'#ffa726','Suhrawardiyya':'#d4e157',
  'Mawlawiyya':'#ec407a','Qalandari':'#8d6e63','Yeseviyya':'#78909c','Kubrawiyya':'#5c6bc0',
  'Akbarian':'#ab47bc','Ishraqiyya':'#ffca28','Mughal':'#ef6c00','Genealogy':'#D4AF37'
};

const _BV_ERA_BANDS = [
  {name:'Prophetic Era',     start:-4000, end:632,  dates:'Before 632 CE', glow:'210,170,50'},
  {name:'Rashidun',          start:632,   end:661,  dates:'632–661 CE', glow:'60,160,90'},
  {name:'Umayyad',           start:661,   end:750,  dates:'661–750 CE', glow:'50,180,180'},
  {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750–1258 CE', glow:'70,130,210'},
  {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258–1500 CE', glow:'180,60,60'},
  {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500–1800 CE', glow:'50,140,90'},
  {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800–1950 CE', glow:'200,150,60'},
  {name:'Contemporary',      start:1950,  end:2025, dates:'1950–Present', glow:'80,160,200'}
];
window._BV_ERA_BANDS = _BV_ERA_BANDS;

function _booksYearToY(yr, books, rowMap){
  const withYear = books.filter(b=>_bYr(b)!=null);
  if(!withYear.length) return _BV_TOP_PAD;
  const first = withYear[0], last = withYear[withYear.length-1];
  if(yr <= _bYr(first)) return rowMap[first.id].midY;
  if(yr >= _bYr(last)) return rowMap[last.id].midY;
  for(let i=1; i<withYear.length; i++){
    if(_bYr(withYear[i]) >= yr){
      const prev = withYear[i-1];
      const curr = withYear[i];
      if(_bYr(curr)===_bYr(prev)) return rowMap[curr.id].midY;
      const ratio = (yr - _bYr(prev)) / (_bYr(curr) - _bYr(prev));
      return rowMap[prev.id].midY + ratio*(rowMap[curr.id].midY - rowMap[prev.id].midY);
    }
  }
  return rowMap[last.id].midY;
}

async function _loadBooksData(){
  if(_BOOKS_DATA) return _BOOKS_DATA;
  try{
    const res = await fetch(dataUrl('data/islamic/books.json'));
    _BOOKS_DATA = await res.json();
    // Lazy-load name_variants for author → slug resolution. Cached on window.
    if(!window._NAME_VARIANTS){
      try{
        const nvRes = await fetch(dataUrl('data/islamic/name_variants.json'));
        window._NAME_VARIANTS = nvRes.ok ? await nvRes.json() : {};
      } catch(e){
        window._NAME_VARIANTS = {};
      }
    }
    // Build reverse lookup: variant_string → slug
    if(!window._NAME_VAR_REVERSE){
      var rev = {};
      Object.keys(window._NAME_VARIANTS||{}).forEach(function(slug){
        var arr = window._NAME_VARIANTS[slug] || [];
        arr.forEach(function(v){ if(v) rev[String(v).toLowerCase()] = slug; });
      });
      window._NAME_VAR_REVERSE = rev;
    }
    return _BOOKS_DATA;
  }catch(e){
    console.error('books.json load failed',e);
    _BOOKS_DATA = {topline:{total:0,free:0},books:[]};
    return _BOOKS_DATA;
  }
}

async function _loadAncientData(){
  if(_ANCIENT_DATA) return _ANCIENT_DATA;
  try{
    const res = await fetch(dataUrl('data/islamic/ancient_books.json'));
    _ANCIENT_DATA = await res.json();
    return _ANCIENT_DATA;
  }catch(e){
    console.error('ancient_books.json load failed',e);
    _ANCIENT_DATA = {topline:{total:0,free:0},books:[]};
    return _ANCIENT_DATA;
  }
}

function _showViewDesc(txt){
  // Sandbox: no header tagline target. No-op.
}
function _hideViewDesc(){ /* no-op in sandbox */ }

function _booksEscape(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
var _bvShowCE=true,_bvShowHijri=true;
function _bvCeToHijri(ce){return Math.round((ce-622)*33/32);}
function _booksFmtYear(y){
  if(y==null||y==='') return '—';
  const n = typeof y==='number' ? y : parseInt(y,10);
  if(isNaN(n)) return '—';
  if(n<0) return Math.abs(n)+'<span class="year-era">BCE</span>';
  return n+'<span class="year-era">CE</span>';
}

function _booksInjectStyles(){
  const old=document.getElementById('booksViewStyles');
  if(old) old.remove();
  const css = `
  #books-view{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg0,#0E1621);width:100%;height:100%}
  #bv-toolbar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border2,#2D3748);background:var(--bg0,#0E1621);flex-wrap:wrap}
  #bv-anim-mount{margin-left:auto;display:flex;align-items:center;gap:10px}
  .bv-clear-all.active{opacity:1;border-color:rgba(212,175,55,.6)}
  #bv-scroll{flex:1;overflow-y:auto;overflow-x:hidden;position:relative}
  #bv-canvas{position:relative;width:100%}
  #bv-empty{padding:60px;text-align:center;color:var(--muted,#6B7B8C);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em}
  #bv-stem{position:absolute;left:${_BV_STEM_X - 2}px;width:5px;background:var(--gold,#D4AF37);box-shadow:0 0 18px rgba(212,175,55,.55);pointer-events:none;z-index:1}
  .bv-row{position:absolute;left:0;width:${_BV_LEFT_W}px;padding:8px 20px 8px 20px;cursor:pointer;transition:background .12s;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;z-index:4}
  .bv-row:hover{background:rgba(212,175,55,.06)}
  .bv-row.hi{background:rgba(212,175,55,.16);box-shadow:inset 3px 0 0 var(--gold,#D4AF37)}
  .bv-row-main{text-align:right}
  .bv-row-title{font-family:'Crimson Pro','Lato',serif;font-size:var(--fs-3);color:var(--text1,#E4E4E7);line-height:1.28;margin-bottom:2px}
  .bv-row-meta{font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);color:var(--muted,#6B7B8C);letter-spacing:.02em}
  .bv-read-btn{display:inline-block;margin-left:6px;padding:2px 8px;background:rgba(56,189,248,.14);border:1px solid #38bdf8;border-radius:2px;font-size:var(--fs-3);color:#38bdf8;letter-spacing:.08em;text-decoration:none;font-family:'Cinzel',serif;font-weight:600;vertical-align:middle}
  .bv-read-btn:hover{background:rgba(56,189,248,.3);color:#fff}
  .bv-read-btn.bv-read-inhouse{background:rgba(212,175,55,.14);border-color:#D4AF37;color:#D4AF37}
  .bv-read-btn.bv-read-inhouse:hover{background:#D4AF37;color:#0e1420}
  .bv-study-badge{display:inline-block;margin-left:6px;padding:1px 6px;border:1px solid rgba(212,175,55,.5);border-radius:2px;font-size:var(--fs-3);color:var(--gold,#D4AF37);letter-spacing:.08em;font-family:'Cinzel',serif;vertical-align:middle}
  .bv-year-chip{position:absolute;transform:translateY(-50%);text-align:right;font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);color:#6B7280;letter-spacing:.02em;z-index:5;white-space:nowrap;pointer-events:none}
  .bv-year-chip.year-multi{color:#D4AF37}
  .bv-year-chip.scripture{color:#D4AF37;font-weight:600;text-shadow:0 0 4px rgba(212,175,55,.4)}
  .bv-hij-chip{position:absolute;transform:translateY(-50%);text-align:left;font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);color:#8B7A3E;z-index:5;white-space:nowrap;pointer-events:none}
  .bv-ruler-toggle{position:absolute;display:flex;align-items:center;gap:4px;z-index:5}
  .bv-ruler-btn{font-size:var(--fs-3);color:#555;cursor:pointer;padding:2px 5px;border-radius:8px;border:1px solid transparent;transition:.2s;user-select:none;font-family:'Cinzel',serif;letter-spacing:.03em}
  .bv-ruler-btn.on{color:#D4AF37;border-color:#D4AF37}
  .bv-ruler-btn:hover{color:#D4AF37}
  .bv-ruler-sep{color:#444;font-size:var(--fs-3);pointer-events:none}
  .bv-row.is-scripture .bv-row-title{color:var(--gold,#D4AF37);font-weight:600;letter-spacing:.01em}
  .bv-row.is-scripture .bv-row-meta{color:rgba(212,175,55,.62);font-style:normal}
  svg.bv-leaves{position:absolute;top:0;left:0;width:100%;z-index:2;overflow:visible}
  svg.bv-leaves g.bv-leaf{cursor:pointer;pointer-events:all}
  .bv-leaf-label{position:absolute;white-space:nowrap;z-index:4}
  .bv-pinned-scripture{padding:8px 16px 7px;border-bottom:1px solid rgba(212,175,55,.4);margin-bottom:4px}
  `;
  const s=document.createElement('style');
  s.id='booksViewStyles';
  s.textContent=css;
  document.head.appendChild(s);
}

function _booksCollectSources(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {}, earliest = {};
  books.forEach(b=>{ (b.topics||[]).forEach(t=>{ if(t){ counts[t]=(counts[t]||0)+1; var y=_bYr(b); if(y!=null&&(earliest[t]==null||y<earliest[t])) earliest[t]=y; }}); });
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
}

function _booksCollectThemes(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {}, earliest = {};
  books.forEach(b=>{ (b.themes||[]).forEach(t=>{ if(t){ counts[t]=(counts[t]||0)+1; var y=_bYr(b); if(y!=null&&(earliest[t]==null||y<earliest[t])) earliest[t]=y; }}); });
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
}

function _booksCollectAuthors(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {}, earliest = {};
  books.forEach(b=>{ if(b.author_name && !b.author_hidden){ counts[b.author_name]=(counts[b.author_name]||0)+1; var y=_bYr(b); if(y!=null&&(earliest[b.author_name]==null||y<earliest[b.author_name])) earliest[b.author_name]=y; }});
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
}

function _booksFiltered(){
  const all = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const q = (_booksFilter.search||'').toLowerCase().trim();
  const src = _booksFilter.source;
  const thm = _booksFilter.theme;
  const aut = _booksFilter.author;
  let out = all.filter(b=>{
    if(src.size){
      let srcMatch = false;
      if(src.has('__scripture__') && (b.is_scripture===true || (b.tags||[]).includes('scripture'))) srcMatch = true;
      if(!srcMatch){ for(const s of src){ if(s!=='__scripture__' && (b.topics||[]).includes(s)){ srcMatch=true; break; } } }
      if(!srcMatch) return false;
    }
    if(thm.size){
      let thmMatch = false;
      for(const t of thm){ if((b.themes||[]).includes(t)){ thmMatch=true; break; } }
      if(!thmMatch) return false;
    }
    if(aut.size && !aut.has(b.author_name)) return false;
    if(q){
      const hay = ((b.title||'')+' '+(b.author_name||'')+' '+(b.revealed_to||'')+' '+((b.topics||[]).join(' '))+' '+((b.themes||[]).join(' '))).toLowerCase();
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  });
  out.sort((a,b)=>{
    const ay=_bYr(a)==null?99999:_bYr(a);
    const by=_bYr(b)==null?99999:_bYr(b);
    return ay-by;
  });
  return out;
}

function _booksBuildCanvas(){
  _booksSyncClearBtn();
  const canvas = document.getElementById('bv-canvas');
  if(!canvas) return;
  const islamicBooks = _booksFiltered();
  var merged = [];
  islamicBooks.forEach(function(b){ merged.push({book:b, ancient:false}); });
  if(_ancientOn && _ANCIENT_DATA && _ANCIENT_DATA.books){
    _ANCIENT_DATA.books.forEach(function(b){ merged.push({book:b, ancient:true}); });
  }
  merged.sort(function(a,b){
    var ay=_bYr(a.book)==null?99999:_bYr(a.book);
    var by=_bYr(b.book)==null?99999:_bYr(b.book);
    return ay-by;
  });
  if(!merged.length){
    canvas.style.height='200px';
    canvas.innerHTML='<div id="bv-empty">NO BOOKS MATCH YOUR FILTERS</div>';
    return;
  }
  const totalH = _BV_TOP_PAD + merged.length * _BV_ROW_H + _BV_BOT_PAD;
  canvas.style.height = totalH + 'px';

  const rowMap = {};
  const _yrCount = {};
  merged.forEach(function(entry){ var yr=_bYr(entry.book); if(yr!=null) _yrCount[yr]=(_yrCount[yr]||0)+1; });
  let html = '';
  html += '<div id="bv-stem" style="top:'+(_BV_TOP_PAD-10)+'px;height:'+(totalH - _BV_TOP_PAD - _BV_BOT_PAD + 20)+'px"></div>';
  html += '<div class="bv-ruler-toggle" style="top:'+(_BV_TOP_PAD-28)+'px;left:'+(_BV_STEM_X-22)+'px">';
  html += '<span class="bv-ruler-btn'+(_bvShowCE?' on':'')+'" data-ruler="ce">CE</span>';
  html += '<span class="bv-ruler-sep">│</span>';
  html += '<span class="bv-ruler-btn'+(_bvShowHijri?' on':'')+'" data-ruler="hij">هـ</span>';
  html += '</div>';

  merged.forEach(function(entry, idx){
    var b = entry.book;
    var isAnc = entry.ancient;
    const y = _BV_TOP_PAD + idx * _BV_ROW_H;
    const midY = y + _BV_ROW_H/2;
    rowMap[b.id] = { y:y, midY:midY, book:b };

    if(isAnc){
      var ancMeta = _booksEscape(b.region||'') + ' · ' + _booksEscape(b.genre||'');
      var ancBadge = '';
      if(b.url) ancBadge = '<a class="bv-read-btn" href="'+_booksEscape(b.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="border-color:#6B7280;color:#A0AEC0;background:rgba(107,114,128,.10)">READ</a>';
      var yearTxt = _booksFmtYear(b.year);
      html += '<div class="bv-row bv-row-ancient" data-id="'+_booksEscape(b.id)+'" data-name="" data-year="'+(b.year==null?'':b.year)+'" style="top:'+y+'px;height:'+_BV_ROW_H+'px;width:'+(_BV_LEFT_W-140)+'px">';
      html += '<div class="bv-row-main"><div class="bv-row-title" style="color:#8B9AAF;font-size:var(--fs-1);font-weight:500">'+_booksEscape(b.title)+'</div>';
      html += '<div class="bv-row-meta" style="color:#6B7280">'+ancMeta+ancBadge+'</div>';
      html += '</div></div>';
      var ancMulti = _bYr(b)!=null&&_yrCount[_bYr(b)]>1?' year-multi':'';
      html += '<div class="bv-year-chip'+ancMulti+'" style="top:'+midY+'px;left:'+(_BV_STEM_X-36-140)+'px;color:#B8C2CC;'+(_bvShowCE?'':'display:none')+'">'+yearTxt+'</div>';
      var _aHij=_bvCeToHijri(b.year||0);
      var _aHijLabel=_aHij<0?Math.abs(_aHij)+'<span class="year-era">ق.هـ</span>':_aHij+'<span class="year-era">هـ</span>';
      html += '<div class="bv-hij-chip" style="top:'+midY+'px;left:'+(_BV_STEM_X+10)+'px;'+(_bvShowHijri?'':'display:none')+'">'+_aHijLabel+'</div>';
      var ancDesc = _booksEscape(b.note||'');
      var ancFact = _booksEscape(b.fact||'');
      html += '<div class="bv-row-ancient-right" style="position:absolute;top:'+y+'px;height:'+_BV_ROW_H+'px;left:'+(_BV_STEM_X+90)+'px;right:20px;display:flex;flex-direction:column;justify-content:center;pointer-events:none;z-index:5">'
            + '<div style="color:#8B9AAF;font-size:var(--fs-1);font-weight:500;line-height:1.2">'+ancDesc+'</div>'
            + '<div style="color:#6B7280;font-size:var(--fs-3);font-style:normal;line-height:1.2;margin-top:3px">'+ancFact+'</div>'
            + '</div>';
    } else {
      const isScripture = b.is_scripture===true;
      let metaTxt='';
      if(isScripture && b.revealed_to) metaTxt='revealed to '+_booksEscape(b.revealed_to);
      else if(!b.author_hidden){
        var _aName = b.author_name||'';
        if(_aName){
          metaTxt='<a class="bv-author-link" href="#timeline" onclick="event.stopPropagation();window._booksGoToTimeline(\''+_booksEscape(_aName)+'\');return false;">'+_booksEscape(_aName)+'</a>';
        }
      }
      let badgeHtml='';
      var _inHouse = _booksMatchInHouse(b);
      if(_inHouse && _inHouse.type === 'tafsir'){
        badgeHtml += '<a class="bv-read-btn bv-read-inhouse" href="#explain" onclick="event.stopPropagation();window._booksReadTafsir(\''+_booksEscape(_inHouse.id)+'\');return false;" title="Open in EXPLAIN">READ</a>';
      } else if(_inHouse && _inHouse.type === 'hadith'){
        badgeHtml += '<a class="bv-read-btn bv-read-inhouse" href="#monastic" onclick="event.stopPropagation();window._booksReadHadith(\''+_booksEscape(_inHouse.id)+'\');return false;" title="Open in MONASTIC">READ</a>';
      } else if(b.is_free && b.url){
        badgeHtml+='<a class="bv-read-btn" href="'+_booksEscape(b.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">READ</a>';
      }
      if(b.has_study) badgeHtml+='<span class="bv-study-badge">STUDY</span>';
      const meta = metaTxt+badgeHtml;
      const nameAttr=_booksEscape(b.author_name||'');
      const idAttr=_booksEscape(b.id||'');
      const yearTxt=_booksFmtYear(_bYr(b));
      const _titleAttr=(b.year!=null&&b.year!==_bYr(b)?' title="Published '+b.year+'"':'');

      html += '<div class="bv-row'+(isScripture?' is-scripture':'')+'" data-id="'+idAttr+'" data-name="'+nameAttr+'" data-year="'+(_bYr(b)==null?'':_bYr(b))+'"'+_titleAttr+' style="top:'+y+'px;height:'+_BV_ROW_H+'px">';
      html += '<div class="bv-row-main"><div class="bv-row-title">'+_booksEscape(b.title)+'</div>';
      if(meta) html += '<div class="bv-row-meta">'+meta+'</div>';
      html += '</div></div>';

      var bkMulti = _bYr(b)!=null&&_yrCount[_bYr(b)]>1?' year-multi':'';
      var showYear = entry.ancient || (_bYr(b) > 610);
      if(showYear){
        html += '<div class="bv-year-chip'+(isScripture?' scripture':'')+bkMulti+'" style="top:'+midY+'px;left:'+(_BV_STEM_X-36)+'px;'+(_bvShowCE?'':'display:none')+'">'+yearTxt+'</div>';
        var _bHij=_bvCeToHijri(_bYr(b)||0);
        var _bHijLabel=_bHij<0?Math.abs(_bHij)+'<span class="year-era">ق.هـ</span>':_bHij+'<span class="year-era">هـ</span>';
        html += '<div class="bv-hij-chip" style="top:'+midY+'px;left:'+(_BV_STEM_X+10)+'px;'+(_bvShowHijri?'':'display:none')+'">'+_bHijLabel+'</div>';
      }
    }
  });

  canvas.innerHTML = html;

  canvas.querySelectorAll('.bv-row').forEach(row=>{
    row.addEventListener('click',function(e){
      if(e.target.closest('.bv-read-btn')) return;
      if(row.classList.contains('bv-row-ancient')) return;
      const name=row.getAttribute('data-name');
      if(!name) return;
      // sandbox: TIMELINE jump not wired — log only
      if(typeof window.jumpTo === 'function'){ window.jumpTo(name); }
    });
  });
  canvas.querySelectorAll('.bv-ruler-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var which=this.getAttribute('data-ruler');
      if(which==='ce'){_bvShowCE=!_bvShowCE;this.classList.toggle('on',_bvShowCE);canvas.querySelectorAll('.bv-year-chip').forEach(function(m){m.style.display=_bvShowCE?'':'none';});}
      if(which==='hij'){_bvShowHijri=!_bvShowHijri;this.classList.toggle('on',_bvShowHijri);canvas.querySelectorAll('.bv-hij-chip').forEach(function(m){m.style.display=_bvShowHijri?'':'none';});}
    });
  });

  var islamicOnly = merged.filter(function(e){ return !e.ancient; }).map(function(e){ return e.book; });
  _booksRenderErasStyle(islamicOnly, rowMap, totalH);
  if(typeof _bvHydrateTafsirChips === 'function') _bvHydrateTafsirChips();
    if(typeof _bvHydrateConceptChips === 'function') _bvHydrateConceptChips();
}

function _bvGetTradColor(b){
  var trad = b.author_tradition || '';
  var type = b.author_type || '';
  if(trad && typeof TRAD_COLORS !== 'undefined' && TRAD_COLORS && TRAD_COLORS[trad]) return TRAD_COLORS[trad];
  if(trad && _BV_TRAD_COLORS[trad]) return _BV_TRAD_COLORS[trad];
  if(type && _BV_TYPE_COLORS[type]) return _BV_TYPE_COLORS[type];
  if(b.is_scripture) return '#D4AF37';
  return 'rgba(212,175,55,0.4)';
}

function _booksRenderErasStyle(books, rowMap, totalH){
  var canvas = document.getElementById('bv-canvas');
  if(!canvas) return;
  var NS = 'http://www.w3.org/2000/svg';

  var byTag = {};
  books.forEach(function(b){
    if(b.author_tradition){
      var k = b.author_tradition;
      if(!byTag[k]) byTag[k] = {key:k, field:'trad', books:[], color:_bvGetTradColor(b)};
      byTag[k].books.push(b);
    }
    if(b.author_type){
      var k2 = b.author_type;
      if(!byTag[k2]) byTag[k2] = {key:k2, field:'type', books:[], color:_bvGetTradColor(b)};
      byTag[k2].books.push(b);
    }
  });
  var leaves = Object.values(byTag).filter(function(t){ return t.books.length > 0; });
  leaves.forEach(function(t){
    var ys = t.books.map(function(b){ return rowMap[b.id].midY; });
    t.y1 = Math.min.apply(null, ys);
    t.y2 = Math.max.apply(null, ys);
    t.count = t.books.length;
  });
  leaves.sort(function(a,b){ return a.y1 - b.y1; });
  if(!leaves.length) return;
  var maxCount = Math.max.apply(null, leaves.map(function(l){ return l.count; }));

  _BV_ERA_BANDS.forEach(function(era){
    var y1e = _booksYearToY(era.start, books, rowMap);
    var y2e = _booksYearToY(era.end, books, rowMap);
    if(y2e - y1e < 6) return;
    var gDiv = document.createElement('div');
    gDiv.className = 'bv-era-band';
    gDiv.style.cssText = 'top:'+y1e+'px;height:'+(y2e-y1e)+'px;background:linear-gradient(to left, rgba('+era.glow+',0.10) 0%, rgba('+era.glow+',0.04) 50%, transparent 85%)';
    canvas.appendChild(gDiv);
    var label = document.createElement('div');
    label.className = 'bv-era-label';
    label.style.top = (y1e+12)+'px';
    label.innerHTML = '<div class="bv-era-label-name" style="color:rgba('+era.glow+',0.85)">'+era.name+'</div>'
      + '<div class="bv-era-label-dates" style="color:rgba('+era.glow+',0.7)">'+era.dates+'</div>';
    canvas.appendChild(label);
  });

  var svg = document.createElementNS(NS, 'svg');
  svg.style.cssText = 'position:absolute;top:0;left:'+_BV_STEM_X+'px;overflow:visible;pointer-events:none;z-index:2';
  var rightW = Math.max(400, (canvas.clientWidth||1400) - _BV_STEM_X - 80);
  svg.setAttribute('width', rightW);
  svg.setAttribute('height', totalH);

  var maxLeafW = rightW * 0.6;
  var MIN_LEAF_W = 30;
  var totalLeaves = leaves.length;

  leaves.forEach(function(ld, idx){
    var y1 = ld.y1;
    var y2 = ld.y2;
    if(y2 - y1 < 10) y2 = y1 + 10;
    var leafW = Math.max(MIN_LEAF_W, (ld.count / maxCount) * maxLeafW);
    var xOffset = 15 + (idx / totalLeaves) * (rightW * 0.30);
    var midY = (y1 + y2) / 2;
    var peakX = xOffset + leafW;
    var stemX = 1;

    var cp1y = y1 + (midY - y1) * 0.3;
    var cp2y = y1 + (midY - y1) * 0.7;
    var cp3y = midY + (y2 - midY) * 0.3;
    var cp4y = midY + (y2 - midY) * 0.7;
    var d = 'M ' + stemX + ' ' + y1.toFixed(1) +
            ' C ' + (stemX + leafW * 0.1).toFixed(1) + ' ' + cp1y.toFixed(1) +
            ', ' + peakX.toFixed(1) + ' ' + cp2y.toFixed(1) +
            ', ' + peakX.toFixed(1) + ' ' + midY.toFixed(1) +
            ' C ' + peakX.toFixed(1) + ' ' + cp3y.toFixed(1) +
            ', ' + (stemX + leafW * 0.1).toFixed(1) + ' ' + cp4y.toFixed(1) +
            ', ' + stemX + ' ' + y2.toFixed(1) + ' Z';

    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'bv-leaf');
    g.setAttribute('data-tag', ld.key);
    g.style.cursor = 'pointer';
    g.style.pointerEvents = 'auto';

    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('fill-opacity', '0');
    path.setAttribute('stroke', ld.color);
    path.setAttribute('stroke-opacity', '0.5');
    path.setAttribute('stroke-width', '2.5');
    g.appendChild(path);

    var dot1 = document.createElementNS(NS, 'circle');
    dot1.setAttribute('cx', stemX); dot1.setAttribute('cy', y1);
    dot1.setAttribute('r', 2); dot1.setAttribute('fill', ld.color);
    dot1.style.pointerEvents = 'none';
    g.appendChild(dot1);
    var dot2 = document.createElementNS(NS, 'circle');
    dot2.setAttribute('cx', stemX); dot2.setAttribute('cy', y2);
    dot2.setAttribute('r', 2); dot2.setAttribute('fill', ld.color);
    dot2.style.pointerEvents = 'none';
    g.appendChild(dot2);
    svg.appendChild(g);

    ld._y1 = y1;
    ld._stemX = stemX;

    var clickHandler = function(e){
      e.stopPropagation();
      _booksFilter.source.clear(); _booksFilter.source.add(ld.key);
      _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'— SELECT A SOURCE —','sources');
      _booksBuildCanvas(); _booksAnimStop();
    };
    g.addEventListener('click', clickHandler);

    g.addEventListener('mouseenter', function(){
      if(_booksFilter.source.size) return;
      path.setAttribute('stroke-opacity', '0.9');
    });
    g.addEventListener('mouseleave', function(){
      if(_booksFilter.source.size) return;
      path.setAttribute('stroke-opacity', '0.5');
    });
  });

  canvas.appendChild(svg);

  var LABEL_H = 22;
  var LABEL_LEFT = _BV_STEM_X + 90;
  var labelInfos = [];
  leaves.forEach(function(ld){
    var naturalY = ld._y1 + 6;
    labelInfos.push({key:ld.key, count:ld.count, color:ld.color, naturalY:naturalY, anchorY:ld._y1, resolvedY:naturalY});
  });
  labelInfos.sort(function(a,b){ return a.naturalY - b.naturalY; });
  var lastBottom = -Infinity;
  labelInfos.forEach(function(li){
    if(li.resolvedY < lastBottom + 2) li.resolvedY = lastBottom + 2;
    lastBottom = li.resolvedY + LABEL_H;
  });
  labelInfos.forEach(function(li){
    var connY = li.anchorY;
    var connDiv = document.createElement('div');
    connDiv.style.cssText = 'position:absolute;top:'+connY+'px;left:'+(_BV_STEM_X+2)+'px;width:'+(LABEL_LEFT - _BV_STEM_X - 2)+'px;height:0;border-top:1px dashed rgba('+_bvColorToRgb(li.color)+',0.35);pointer-events:none;z-index:3';
    if(Math.abs(li.resolvedY - connY) > 2){
      var vertDiv = document.createElement('div');
      vertDiv.style.cssText = 'position:absolute;top:'+Math.min(connY, li.resolvedY + LABEL_H/2)+'px;left:'+(LABEL_LEFT - 1)+'px;width:0;height:'+Math.abs(li.resolvedY + LABEL_H/2 - connY)+'px;border-left:1px dashed rgba('+_bvColorToRgb(li.color)+',0.35);pointer-events:none;z-index:3';
      canvas.appendChild(vertDiv);
    }
    canvas.appendChild(connDiv);

    var extLabel = document.createElement('div');
    extLabel.className = 'bv-leaf-label';
    extLabel.setAttribute('data-tag', li.key);
    extLabel.style.cssText = 'position:absolute;top:'+li.resolvedY+'px;left:'+LABEL_LEFT+'px;white-space:nowrap;pointer-events:auto;cursor:pointer;font-family:\'Cinzel\',serif;font-size:var(--fs-3);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:'+li.color+';background:rgba(14,22,33,0.85);padding:2px 8px;border-radius:2px;border:1px solid rgba('+_bvColorToRgb(li.color)+',0.4);z-index:4';
    extLabel.textContent = li.key + ' (' + li.count + ')';
    extLabel.addEventListener('click', function(e){
      e.stopPropagation();
      _booksFilter.source.clear(); _booksFilter.source.add(li.key);
      _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'— SELECT A SOURCE —','sources');
      _booksBuildCanvas(); _booksAnimStop();
    });
    canvas.appendChild(extLabel);
  });
}

function _bvColorToRgb(c){
  if(!c) return '160,174,192';
  if(c.charAt(0)==='#'){
    var hex = c.slice(1);
    if(hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return parseInt(hex.substr(0,2),16)+','+parseInt(hex.substr(2,2),16)+','+parseInt(hex.substr(4,2),16);
  }
  var m = c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if(m) return m[1]+','+m[2]+','+m[3];
  return '160,174,192';
}

function _bvCk(on){ return '<span class="bv-ck'+(on?' on':'')+'"></span>'; }

function _bvSyncBtnLabel(btnId, filterSet, defaultLabel, singularNoun){
  const btn=document.getElementById(btnId);
  if(!btn) return;
  const n=filterSet.size;
  let txt=defaultLabel;
  if(n===1) txt=[...filterSet][0];
  else if(n>1) txt=n+' '+singularNoun+' selected';
  btn.innerHTML=_booksEscape(txt)+'  <span style="opacity:.6">▾</span>';
}

function _bvBuildPanel(scrollId, searchId, filterSet, items, pinnedRow, onchange){
  const scroll=document.getElementById(scrollId);
  if(!scroll) return;
  const si=document.getElementById(searchId);
  const q=(si&&si.value||'').toLowerCase().trim();
  const allOn = filterSet.size === 0;
  // Use shell standard .dd-item / .dd-checkbox for consistency with SILSILA / TIMELINE.
  let html = '<div class="dd-item dd-all'+(allOn?' selected':'')+'" data-val="__all__"><div class="dd-checkbox">'+(allOn?'✓':'')+'</div><span>All</span></div>';
  if(pinnedRow){
    const on=filterSet.has(pinnedRow.value);
    html += '<div class="dd-item'+(on?' selected':'')+'" data-val="'+_booksEscape(pinnedRow.value)+'"><div class="dd-checkbox">'+(on?'✓':'')+'</div><span style="color:var(--gold);font-weight:700;text-transform:uppercase;letter-spacing:.08em">'+_booksEscape(pinnedRow.label)+'</span></div>';
  }
  const filtered=items.filter(t=>!q||t.name.toLowerCase().indexOf(q)>-1);
  filtered.forEach(t=>{
    const on=filterSet.has(t.name);
    html += '<div class="dd-item'+(on?' selected':'')+'" data-val="'+_booksEscape(t.name)+'"><div class="dd-checkbox">'+(on?'✓':'')+'</div><span>'+_booksEscape(t.name)+'</span><span class="dd-count">'+t.count+'</span></div>';
  });
  scroll.innerHTML=html;
  scroll.querySelectorAll('.dd-item').forEach(el=>{
    el.addEventListener('click',function(){
      const v=this.getAttribute('data-val');
      if(v==='__all__'){
        filterSet.clear();
      } else {
        if(filterSet.has(v)) filterSet.delete(v); else filterSet.add(v);
      }
      onchange();
    });
  });
}

function _booksBuildSourcePanel(){
  _bvBuildPanel('bv-source-scroll','bv-source-search',_booksFilter.source,_booksCollectSources(),
    {value:'__scripture__',label:'Scripture'},
    function(){ _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'— SELECT A SOURCE —','sources'); _booksBuildSourcePanel(); _booksBuildCanvas(); _booksAnimStop(); });
}
function _booksBuildThemePanel(){
  _bvBuildPanel('bv-theme-scroll','bv-theme-search',_booksFilter.theme,_booksCollectThemes(),
    null,
    function(){ _bvSyncBtnLabel('bv-theme-btn',_booksFilter.theme,'— SELECT A THEME —','themes'); _booksBuildThemePanel(); _booksBuildCanvas(); _booksAnimStop(); });
}
function _booksBuildAuthorPanel(){
  _bvBuildPanel('bv-author-scroll','bv-author-search',_booksFilter.author,_booksCollectAuthors(),
    null,
    function(){ _bvSyncBtnLabel('bv-author-btn',_booksFilter.author,'— SELECT AN AUTHOR —','authors'); _booksBuildAuthorPanel(); _booksBuildCanvas(); _booksAnimStop(); });
}

function _booksSyncClearBtn(){
  const btn=document.getElementById('bv-clear-all');
  if(!btn) return;
  const hasFilter=_booksFilter.source.size||_booksFilter.theme.size||_booksFilter.author.size||_booksFilter.search;
  btn.classList.toggle('active',!!hasFilter);
}

var _booksAnimCtl = null;

function _bvCurfewYToYear(cursorY, canvas){
  var rows=[].slice.call(canvas.querySelectorAll('.bv-row'));
  for(var i=rows.length-1;i>=0;i--){
    var t=parseFloat(rows[i].style.top)||0;
    if(cursorY>=t){var yr=rows[i].getAttribute('data-year');if(yr!=='') return parseInt(yr,10);}
  }
  return null;
}

function _booksAnimPlay(){
  var canvas = document.getElementById('bv-canvas');
  var scroll = document.getElementById('bv-scroll');
  if(!canvas || !scroll) return;

  var cursor=document.getElementById('bv-curfew');
  if(!cursor){
    cursor=document.createElement('div');cursor.id='bv-curfew';cursor.className='bv-curfew-line';
    cursor.innerHTML='<span id="bv-curfew-year" class="bv-curfew-year"></span>';
    cursor.style.display='none';
    canvas.appendChild(cursor);
  }
  var blackout=document.getElementById('bv-blackout');
  if(!blackout){
    blackout=document.createElement('div');blackout.id='bv-blackout';
    blackout.style.cssText='display:none;position:absolute;left:0;right:0;background:#000;z-index:8;pointer-events:none';
    canvas.appendChild(blackout);
  }

  if(_booksAnim.mode === 'paused'){
    _booksAnim.mode = 'playing';
    cursor.style.display='';
    _booksAnim.timer = setInterval(_booksAnim.tick, _booksAnim.speedMs);
    return;
  }
  _booksAnim.mode = 'playing';
  _booksAnim.cursorY = _BV_TOP_PAD;
  _booksAnim.speedMs = _booksAnimCtl ? _booksAnimCtl.getSpeedMs() : 1200;
  var totalH=parseFloat(canvas.style.height)||2000;
  _booksAnim.maxY=totalH;
  if(blackout){blackout.style.display='';blackout.style.top='0px';blackout.style.height=totalH+'px';}
  cursor.style.display='';cursor.style.top=_booksAnim.cursorY+'px';

  var STEP=4;
  _booksAnim.tick=function(){
    if(_booksAnim.mode!=='playing') return;
    _booksAnim.cursorY+=STEP;
    if(_booksAnim.cursorY>_booksAnim.maxY*0.8){_booksAnimStop();return;}
    cursor.style.top=_booksAnim.cursorY+'px';
    var bo=document.getElementById('bv-blackout');
    if(bo){bo.style.top=(_booksAnim.cursorY+1)+'px';bo.style.height=(_booksAnim.maxY-_booksAnim.cursorY)+'px';}
    var yr=_bvCurfewYToYear(_booksAnim.cursorY,canvas);
    var yrEl=document.getElementById('bv-curfew-year');
    if(yrEl) yrEl.innerHTML=yr!=null?_booksFmtYear(yr):'';
    scroll.scrollTo({top:Math.max(0,_booksAnim.cursorY-scroll.clientHeight/2),behavior:'auto'});
  };
  _booksAnim.tick();
  _booksAnim.timer = setInterval(_booksAnim.tick, _booksAnim.speedMs);
}

function _booksAnimPause(){
  _booksAnim.mode = 'paused';
  if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = null; }
}

function _booksAnimStop(){
  _booksAnim.mode = 'stopped';
  if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = null; }
  _booksAnim.tick = null;
  var canvas=document.getElementById('bv-canvas');
  if(canvas){
    var bo=document.getElementById('bv-blackout');
    if(bo) bo.style.display='none';
  }
  var cursor=document.getElementById('bv-curfew');
  if(cursor) cursor.style.display='none';
  document.querySelectorAll('.bv-row.hi').forEach(function(r){ r.classList.remove('hi'); });
  if(_booksAnimCtl) _booksAnimCtl.forceStop();
}

async function initBooks(){
  _booksInjectStyles();
  const view=document.getElementById('books-view');
  if(!view) return;
  view.style.flexDirection='column';
  await _loadBooksData();

  let html='';
  // Hidden helper buttons — keep IDs so existing _bvSyncBtnLabel and panel-build code
  // continues to work. Actual visible filter buttons live in shell Zone B row 1.
  html+='<div style="display:none">';
  html+='<button id="bv-source-btn"></button>';
  html+='<button id="bv-theme-btn"></button>';
  html+='<button id="bv-author-btn"></button>';
  html+='<button id="bv-clear-all"></button>';
  html+='<button id="bv-ancient-toggle">+ ANCIENT</button>';
  html+='</div>';
  // Filter dropdown panels — appended to body on open; default hidden
  html+='<div class="dd-panel" id="bv-source-panel" style="position:fixed;display:none">';
  html+='<input class="dd-search" id="bv-source-search" placeholder="search sources…">';
  html+='<div id="bv-source-scroll"></div>';
  html+='</div>';
  html+='<div class="dd-panel" id="bv-theme-panel" style="position:fixed;display:none">';
  html+='<input class="dd-search" id="bv-theme-search" placeholder="search themes…">';
  html+='<div id="bv-theme-scroll"></div>';
  html+='</div>';
  html+='<div class="dd-panel" id="bv-author-panel" style="position:fixed;display:none">';
  html+='<input class="dd-search" id="bv-author-search" placeholder="search authors…">';
  html+='<div id="bv-author-scroll"></div>';
  html+='</div>';
  html+='<div id="bv-ancient-banner" style="display:none;padding:8px 16px;background:rgba(139,115,85,0.08);border-bottom:1px solid #4A5568;font-size:var(--fs-3);color:#A0AEC0;font-style:normal;font-family:\'Inter\',\'Source Sans 3\',system-ui,sans-serif">100 Ancient Texts — Reference add-on only. Not necessarily part of the Monotheistic Corpus.</div>';
  html+='<div id="bv-scroll"><div id="bv-canvas"></div></div>';
  view.innerHTML=html;

  _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'— SELECT A SOURCE —','sources');
  _bvSyncBtnLabel('bv-theme-btn',_booksFilter.theme,'— SELECT A THEME —','themes');
  _bvSyncBtnLabel('bv-author-btn',_booksFilter.author,'— SELECT AN AUTHOR —','authors');
  _booksBuildSourcePanel();
  _booksBuildThemePanel();
  _booksBuildAuthorPanel();
  _booksBuildCanvas();

  // Panel content live-search bindings (panels themselves are wired to shell buttons in _wireZoneB).
  ['bv-source-search','bv-theme-search','bv-author-search'].forEach(function(id, i){
    var el = document.getElementById(id);
    var build = [_booksBuildSourcePanel, _booksBuildThemePanel, _booksBuildAuthorPanel][i];
    if(el && build) el.addEventListener('input', build);
  });
  // Outside-click closes any open panel.
  document.addEventListener('click', function(e){
    ['bv-source-panel','bv-theme-panel','bv-author-panel'].forEach(function(pid){
      var p = document.getElementById(pid);
      if(!p) return;
      var srcBtn = window._bvShellBtns ? window._bvShellBtns[pid] : null;
      if(p.classList.contains('open') && !p.contains(e.target) && (!srcBtn || !srcBtn.contains(e.target))){
        p.classList.remove('open');
        p.style.display = 'none';
      }
    });
  });
  // AnimControls is undefined in sandbox; guard the call site so books mounts cleanly.
  if(window.AnimControls){
    _booksAnimCtl = window.AnimControls.create({
      mountEl: document.getElementById('bv-anim-mount'),
      idPrefix: 'bv',
      initialSpeed: '1x',
      onPlay: _booksAnimPlay,
      onPause: _booksAnimPause,
      onStop: _booksAnimStop,
      onSpeedChange: function(ms){ _booksAnim.speedMs = ms; if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = setInterval(_booksAnim.tick, ms); } }
    });
  }
  var _bvHowBtn=document.getElementById('bv-how-btn');
  if(_bvHowBtn) _bvHowBtn.addEventListener('click',function(e){e.stopPropagation();_showBooksMethodology();});
  document.getElementById('bv-ancient-toggle').addEventListener('click',async function(){
    _ancientOn=!_ancientOn;
    var btn=document.getElementById('bv-ancient-toggle');
    var banner=document.getElementById('bv-ancient-banner');
    if(_ancientOn){
      if(!_ANCIENT_DATA) await _loadAncientData();
      btn.textContent='✓ ANCIENT';
      btn.style.borderColor='#8B7355';
      btn.style.color='#C9A876';
      if(banner) banner.style.display='block';
    } else {
      btn.textContent='+ ANCIENT';
      btn.style.borderColor='#4A5568';
      btn.style.color='#6B7280';
      if(banner) banner.style.display='none';
    }
    _booksBuildCanvas();
    _booksAnimStop();
  });
  document.getElementById('bv-clear-all').addEventListener('click',function(){
    _booksFilter.source.clear(); _booksFilter.theme.clear(); _booksFilter.author.clear(); _booksFilter.search='';
    _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'— SELECT A SOURCE —','sources');
    _bvSyncBtnLabel('bv-theme-btn',_booksFilter.theme,'— SELECT A THEME —','themes');
    _bvSyncBtnLabel('bv-author-btn',_booksFilter.author,'— SELECT AN AUTHOR —','authors');
    _booksBuildSourcePanel(); _booksBuildThemePanel(); _booksBuildAuthorPanel();
    var sb=document.getElementById('search'); if(sb) sb.value='';
    _booksBuildCanvas(); _booksAnimStop(); _booksSyncClearBtn();
  });

  _booksSyncClearBtn();
  _booksInited=true;
}

function _showBooksMethodology(){
  if(document.getElementById('bv-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='bv-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="bv-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">A visual timeline of books by Islamic authors, drawn as leaf shapes positioned at their year of composition. Books with free online links are highlighted — click to read them.</p>'
    +'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin-top:16px">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('bv-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

  // Wire shell's Zone B controls (search input + Theme select + Free pill).
  function _wireZoneB(zoneBEl){
    // Search
    var searchInp = document.getElementById('search');
    if(searchInp){
      searchInp.placeholder = 'Search books…';
      searchInp.value = _booksFilter.search || '';
      searchInp.addEventListener('input', function(){
        _booksFilter.search = searchInp.value || '';
        _booksBuildCanvas();
        _booksAnimStop();
      });
    }

    if(!zoneBEl) return;
    var row1 = zoneBEl.querySelector('.zb-row2');
    if(!row1) return;
    var selects = row1.querySelectorAll('.zb-select');
    var pills   = row1.querySelectorAll('.zb-pill');

    // Map shell buttons by label → real ids used by existing logic
    var shellMap = { 'bv-source-panel':null, 'bv-theme-panel':null, 'bv-author-panel':null };
    selects.forEach(function(b){
      var t = (b.textContent||'').trim().toUpperCase();
      if(t === 'SOURCE'){ b.id = 'bv-source-shell'; shellMap['bv-source-panel'] = b; }
      else if(t === 'THEME'){ b.id = 'bv-theme-shell'; shellMap['bv-theme-panel'] = b; }
      else if(t === 'AUTHOR'){ b.id = 'bv-author-shell'; shellMap['bv-author-panel'] = b; }
    });
    window._bvShellBtns = shellMap;

    function _bvOpenPanel(panelId, btn){
      var panel = document.getElementById(panelId);
      if(!panel || !btn) return;
      // Close other panels
      ['bv-source-panel','bv-theme-panel','bv-author-panel'].forEach(function(id){
        if(id !== panelId){
          var p = document.getElementById(id);
          if(p){ p.classList.remove('open'); p.style.display = 'none'; }
        }
      });
      var nowOpen = !panel.classList.contains('open');
      panel.classList.toggle('open', nowOpen);
      if(nowOpen){
        var r = btn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.top  = (r.bottom + 4) + 'px';
        panel.style.left = r.left + 'px';
        panel.style.zIndex = 10000;
        panel.style.display = 'block';
        var s = panel.querySelector('.dd-search');
        if(s) s.focus();
      } else {
        panel.style.display = 'none';
      }
    }

    Object.keys(shellMap).forEach(function(panelId){
      var btn = shellMap[panelId];
      if(!btn) return;
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        _bvOpenPanel(panelId, btn);
      });
    });

    // ANCIENT pill — reuses existing hidden bv-ancient-toggle logic via click()
    var ancientShellBtn = null;
    pills.forEach(function(b){
      if((b.textContent||'').toUpperCase().indexOf('ANCIENT') !== -1) ancientShellBtn = b;
    });
    if(ancientShellBtn){
      ancientShellBtn.addEventListener('click', function(){
        var hidden = document.getElementById('bv-ancient-toggle');
        if(hidden) hidden.click();
        ancientShellBtn.classList.toggle('zb-active');
      });
      // Re-wire the hidden ancient-toggle to also re-render canvas
      // (existing handler does that, this is just to ensure it runs).
    }
  }

  // Free-only filter — wraps _booksFiltered output. Toggled by the shell's Free pill.
  var _bvFreeOnly = false;
  var _origBooksFiltered = _booksFiltered;
  _booksFiltered = function(){
    var out = _origBooksFiltered();
    if(_bvFreeOnly) out = out.filter(function(b){ return b.is_free && b.url; });
    return out;
  };

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('bk-mounted');
    _ensureBooksTafsirXref();

    // initBooks expects #books-view in the DOM.
    zoneCEl.innerHTML = '<div id="books-view"></div>';

    // Eager Promise.all: core.json (cross-view) + books.json. Mirrors timeline pattern.
    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });
    var p2 = _loadBooksData();

    Promise.all([p1, p2]).then(function(){
      initBooks().then(function(){
        _wireZoneB(zoneBEl);
      });
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('bk-mounted');

    // Stop animation, drop methodology overlay if open.
    try { _booksAnimStop(); } catch(e) {}
    var ov = document.getElementById('bv-method-overlay'); if(ov) ov.remove();

    // Remove the runtime-injected styles so re-mount injects fresh.
    var s = document.getElementById('booksViewStyles'); if(s) s.remove();

    _booksInited = false;
    _bvFreeOnly = false;

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return {
    mount: mount,
    unmount: unmount,
    showHtw: _showBooksMethodology,
    animateStart: _booksAnimPlay,
    animatePause: _booksAnimPause,
    animateStop:  _booksAnimStop,
    animateSetSpeed: function(label){
      var map = { '0.5x':2400, '1x':1200, '2x':600, '4x':300 };
      _booksAnim.speedMs = map[label] || 1200;
      if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = setInterval(_booksAnim.tick, _booksAnim.speedMs); }
    }
  };
})();

window._booksOpenAuthor = function(name){
  if(!name) return;
  // Click the ONE tab in top nav
  var candidates = document.querySelectorAll(
    '#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="one"], .tab-one'
  );
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'ONE' || dv === 'one'){ el.click(); break; }
  }
  if(typeof setView==='function') setView('one');
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    if(typeof window._oneClickName==='function'){
      try{ window._oneClickName(name); }catch(e){}
      clearInterval(iv); return;
    }
    if(tries>50){ clearInterval(iv); console.warn('[books] ONE not ready for', name); }
  },80);
};

window._booksGoToTimeline = function(name){
  if(!name) return;
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="timeline"], .tab-timeline');
  for(var i=0;i<c.length;i++){
    var el = c[i];
    var txt=(el.textContent||'').trim().toUpperCase();
    var dv=el.getAttribute('data-view')||'';
    if(txt==='TIMELINE'||dv==='timeline'){ el.click(); break; }
  }
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var fn = (typeof window.focusPersonInTimeline === 'function' && window.focusPersonInTimeline.toString().length > 60)
      ? window.focusPersonInTimeline
      : window.jumpTo;
    if(typeof fn === 'function' && fn.toString().length > 60 && (window.PEOPLE||[]).length){
      try { fn(name); } catch(e){}
      clearInterval(iv); return;
    }
    if(tries > 60) clearInterval(iv);
  },80);
};

window._booksReadTafsir = function(tafsirId){
  if(!tafsirId) return;
  var newHash = '#explain?tafsir='+encodeURIComponent(tafsirId)+'&surah=1&verse=1';
  try { history.replaceState(null,'',newHash); } catch(e){ location.hash = newHash; }
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="explain"], .tab-explain');
  for(var i=0;i<c.length;i++){
    var el = c[i];
    var txt=(el.textContent||'').trim().toUpperCase();
    var dv=el.getAttribute('data-view')||'';
    if(txt==='EXPLAIN'||dv==='explain'){ el.click(); return; }
  }
};

window._booksReadHadith = function(collectionKey){
  if(!collectionKey) return;
  window._stPendingHadith = { col: collectionKey, num: '1' };
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="monastic"], .tab-monastic');
  for(var i=0;i<c.length;i++){
    var el = c[i];
    var txt=(el.textContent||'').trim().toUpperCase();
    var dv=el.getAttribute('data-view')||'';
    if(txt==='MONASTIC'||dv==='monastic'){ el.click(); return; }
  }
};

window._booksShowTafsirs = function(key, authorName, bookId){
  if(!key) return;
  fetch(dataUrl('data/islamic/xref/tafsir_xref_books.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var entries = (j && j[key]) ? j[key] : [];
      if(!entries.length){ console.warn('[BOOKS] no tafsir entries for', key); return; }
      var label = (authorName || '') + (bookId ? (' — ' + bookId) : '');
      window._stPendingPinnedTafsir = { entries: entries.slice(), label: label };
      var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="explain"], .tab-explain');
      for(var i=0;i<c.length;i++){
        var el=c[i];
        var txt=(el.textContent||'').trim().toUpperCase();
        var dv=el.getAttribute('data-view')||'';
        if(txt==='EXPLAIN'||dv==='explain'){ el.click(); return; }
      }
      if(typeof setView==='function') setView('explain');
    })
    .catch(function(e){ console.warn('[BOOKS] tafsir xref fetch failed', e); });
};

window._booksShowConcepts = function(key, authorName, bookId){
  if(!key) return;
  function _bcpEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  Promise.all([
    fetch(dataUrl('data/islamic/concepts/concept_reverse_books.json')).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;}),
    fetch(dataUrl('data/islamic/concepts/concept-canon.json')).then(function(r){return r.ok?r.json():null;}).catch(function(){return null;})
  ]).then(function(res){
    var byKey = res[0] || {};
    var canon = res[1] || {};
    var entries = byKey[key] || [];
    if(!entries.length){ console.warn('[BOOKS] no concepts for', key); return; }
    entries = entries.slice().sort(function(a,b){ return (b.count||b.score||0) - (a.count||a.score||0); });
    var old = document.getElementById('books-concepts-popup'); if(old) old.remove();
    var ov = document.createElement('div');
    ov.id = 'books-concepts-popup';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.78);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
    var box = document.createElement('div');
    box.style.cssText = 'background:#1a1a2e;border:1px solid rgba(120,200,180,0.6);border-radius:8px;max-width:480px;width:92%;max-height:78vh;overflow-y:auto;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:13px';
    var label = (authorName || '') + (bookId ? (' — ' + bookId) : '');
    var h = '<button id="bcp-close" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1">×</button>';
    h += '<div style="font-family:Cinzel,serif;font-size:14px;letter-spacing:.08em;color:rgba(120,200,180,0.95);text-transform:uppercase;margin-bottom:6px">Linked Concepts</div>';
    h += '<div style="font-size:15px;color:#E5E7EB;margin-bottom:14px">' + _bcpEsc(label) + ' — ' + entries.length + ' concept' + (entries.length===1?'':'s') + '</div>';
    entries.forEach(function(c){
      var cid = c.concept_id || c.concept || c.id || '';
      if(!cid) return;
      var cMeta = canon[cid] || null;
      var name = cMeta ? (cMeta.name || cMeta.english_name || cMeta.display_name || cMeta.label || cid) : cid;
      var count = c.count != null ? c.count : (c.score != null ? c.score : 0);
      h += '<div class="bcp-row" data-cid="'+_bcpEsc(cid)+'" style="display:flex;align-items:center;gap:10px;padding:8px 10px;cursor:pointer;border-radius:3px;border-bottom:1px solid rgba(255,255,255,.04)">';
      h += '<span style="flex:1;color:#E5E7EB">' + _bcpEsc(name) + ' →</span>';
      h += '<span style="color:rgba(120,200,180,0.85);font-size:11px">' + count + '</span>';
      h += '</div>';
    });
    box.innerHTML = h;
    ov.appendChild(box);
    document.body.appendChild(ov);
    document.getElementById('bcp-close').addEventListener('click', function(){ ov.remove(); });
    ov.addEventListener('click', function(e){ if(e.target === ov) ov.remove(); });
    box.querySelectorAll('.bcp-row').forEach(function(row){
      row.addEventListener('mouseenter', function(){ row.style.background='rgba(120,200,180,0.08)'; });
      row.addEventListener('mouseleave', function(){ row.style.background=''; });
      row.addEventListener('click', function(){
        var cid = row.getAttribute('data-cid');
        if(!cid) return;
        ov.remove();
        if(typeof window._stConceptJump === 'function'){
          window._stConceptJump(cid);
        } else {
          var c2 = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="think"], .tab-think');
          for(var i=0;i<c2.length;i++){
            var el=c2[i];
            var txt=(el.textContent||'').trim().toUpperCase();
            var dv=el.getAttribute('data-view')||'';
            if(txt==='THINK'||dv==='think'){ el.click(); break; }
          }
          var tries=0;
          var iv=setInterval(function(){
            tries++;
            if(typeof window.thinkSelectConceptBySlug === 'function'){
              try{ window.thinkSelectConceptBySlug(cid); }catch(e){}
              clearInterval(iv); return;
            }
            if(tries>50) clearInterval(iv);
          },80);
        }
      });
    });
  });
};
