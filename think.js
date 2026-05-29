/* ─────────────────────────────────────────────────────────────
   THINK view — verbatim lift from bv-app/think.js
   IIFE exposes window.ThinkView = { mount, unmount }
   ───────────────────────────────────────────────────────────── */
window.ThinkView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global — THINK uses 'think'
  var VIEW = 'think';
  window.VIEW = 'think';
  // stub: APP namespace
  var APP = window.APP || {
    Favorites: null, filterFavsOnly: false, _lang: 'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; }
  };
  window.APP = APP;
  // stub: setView — sandbox shell uses setActiveTab; the lifted view's setView
  // wrapper IIFE early-exits when window.setView is not a function.
  // stub: _showViewDesc / _resizeShell — sandbox no-ops
  if(typeof window._showViewDesc !== 'function') window._showViewDesc = function(){};
  if(typeof window._resizeShell !== 'function') window._resizeShell = function(){};
  // stub: AnimControls — leave undefined; lifted code already null-checks.
  // stub: _BV_ERA_BANDS — set by BOOKS view; null-checked in lifted code.
  if(typeof window._BV_ERA_BANDS === 'undefined') window._BV_ERA_BANDS = [
    {name:'Prophetic Era',     start:-4000, end:632,  dates:'Before 632 CE',    glow:'210,170,50'},
    {name:'Rashidun',          start:632,   end:661,  dates:'632–661 CE',  glow:'60,160,90'},
    {name:'Umayyad',           start:661,   end:750,  dates:'661–750 CE',  glow:'50,180,180'},
    {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750–1258 CE', glow:'70,130,210'},
    {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258–1500 CE',glow:'180,60,60'},
    {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500–1800 CE',glow:'50,140,90'},
    {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800–1950 CE',glow:'200,150,60'},
    {name:'Contemporary',      start:1950,  end:2025, dates:'1950–Present',glow:'80,160,200'}
  ];
  // stub: _scrollToBookId — used by tk-book-link onclick (cross-view jump). No-op.
  if(typeof window._scrollToBookId !== 'function') window._scrollToBookId = function(){};
  // stub: PEOPLE — populated by core.json fetch in mount(); typeof guards in lifted code.

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/think.js ▼▼▼
  // (outer IIFE wrapper unwrapped — we already wrap above)
  // ═══════════════════════════════════════════════════════════

var _data=null,_booksData=null,_inited=false,_selConceptSlugs=new Set(),_tooltip=null,_uiTrans=null,_thinkLang='en';
let _TK_CONF = 'h';   // 'h' | 'm' | 'l'
let _TK_V2 = null;            // raw think_v2.json
let _TK_V2_BY_SLUG = null;    // {conceptSlug: conceptObject}

function _tkLoadV2(){
  if(_TK_V2) return Promise.resolve(_TK_V2);
  var url = (typeof dataUrl === 'function')
    ? dataUrl('data/islamic/think_v2.json')
    : 'data/islamic/think_v2.json';
  return fetch(url)
    .then(function(r){ return r.ok ? r.json() : null; })
    .catch(function(){ return null; })
    .then(function(j){
      _TK_V2 = j || {concepts:[]};
      _TK_V2_BY_SLUG = {};
      (_TK_V2.concepts || []).forEach(function(c){
        if(c && c.slug) _TK_V2_BY_SLUG[c.slug] = c;
      });
      return _TK_V2;
    });
}

function _tkBandAllows(band){
  if(_TK_CONF === 'h') return band === 'h';
  if(_TK_CONF === 'm') return band === 'h' || band === 'm';
  return true;
}

function _tkGetConceptItems(conceptSlug){
  if(!_TK_V2_BY_SLUG) return {figures:[], books:[]};
  var c = _TK_V2_BY_SLUG[conceptSlug];
  if(!c) return {figures:[], books:[]};
  var figs = (c.figures || []).filter(function(f){ return _tkBandAllows(f.band); });
  var books = (c.books || []).filter(function(b){ return _tkBandAllows(b.band); });
  return {figures: figs, books: books};
}

function _tkConfLabel(){
  return _TK_CONF === 'h' ? 'HIGH'
       : _TK_CONF === 'm' ? 'MED'
       : 'LOW';
}
function _tkSyncConfBtn(){
  var btn = document.getElementById('thinkConfPill');
  if(!btn) return;
  btn.textContent = _tkConfLabel();
  btn.classList.remove('tk-conf-h','tk-conf-m','tk-conf-l');
  btn.classList.add('tk-conf-' + _TK_CONF);
}
function _tkConfCycle(){
  _TK_CONF = _TK_CONF === 'h' ? 'm'
           : _TK_CONF === 'm' ? 'l'
           : 'h';
  _tkSyncConfBtn();
  console.log('[think] confidence:', _TK_CONF);
  if(typeof _tkRedrawCurrent === 'function'){
    _tkRedrawCurrent();
  } else if(typeof _tkRender === 'function'){
    _tkRender();
  } else if(typeof _renderCanvas === 'function'){
    _renderCanvas();
  }
}
var _tkSummaryCache = null;
function _tkLoadSummaries(cb){
  if(_tkSummaryCache){ cb(_tkSummaryCache); return; }
  var url = (typeof dataUrl === 'function')
    ? dataUrl('data/islamic/concepts/concept-summaries.json')
    : 'data/islamic/concepts/concept-summaries.json';
  fetch(url).then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var map = {};
      if(j){
        if(Array.isArray(j)){
          j.forEach(function(it){ if(it && it.slug) map[it.slug] = it; });
        } else if(typeof j === 'object'){
          Object.keys(j).forEach(function(k){
            var v = j[k];
            if(typeof v === 'string') map[k] = { summary: v };
            else if(v && typeof v === 'object') map[k] = v;
          });
        }
      }
      _tkSummaryCache = map;
      cb(map);
    })
    .catch(function(){ _tkSummaryCache = {}; cb({}); });
}
var GA_LANG_LIST = (function(){
  var rest = [
    ['ar','Arabic'],['ur','Urdu'],['hi','Hindi'],['bn','Bengali'],['id','Indonesian'],
    ['tr','Turkish'],['fa','Persian'],['ms','Malay'],['ha','Hausa'],['sw','Swahili'],
    ['fr','French'],['de','German'],['es','Spanish'],['pt','Portuguese'],['zh','Chinese'],
    ['ru','Russian'],['ja','Japanese'],['it','Italian'],['nl','Dutch'],['pl','Polish'],
    ['ta','Tamil'],['te','Telugu'],['pa','Punjabi'],['ps','Pashto'],['tl','Tagalog'],
    ['vi','Vietnamese'],['th','Thai'],['ko','Korean'],['kk','Kazakh'],['uz','Uzbek']
  ].sort(function(a,b){ return a[1].localeCompare(b[1]); });
  return [['en','English']].concat(rest);
})();
var GA_RTL_LANGS = { ar:1, ur:1, fa:1, ps:1, ha:0 };
var _gaLangs = (function(){
  try {
    var s2 = localStorage.getItem('goldArkLangs2');
    if(s2) return new Set(JSON.parse(s2));
    var s1 = localStorage.getItem('goldArkLangs');
    var arr = s1 ? JSON.parse(s1) : [];
    if(arr.indexOf('en') === -1) arr.unshift('en');
    var set = new Set(arr);
    localStorage.setItem('goldArkLangs2', JSON.stringify(Array.from(set)));
    return set;
  } catch(e){ return new Set(['en']); }
})();
function _gaSaveLangs(){ try { localStorage.setItem('goldArkLangs2', JSON.stringify(Array.from(_gaLangs))); } catch(e){} }
function _gaLangName(code){ for(var i=0;i<GA_LANG_LIST.length;i++){ if(GA_LANG_LIST[i][0]===code) return GA_LANG_LIST[i][1]; } return code; }
function _gaLangFont(code){
  if(code==='ar') return "'Amiri',serif";
  if(code==='ur'||code==='ps') return "'Noto Nastaliq Urdu',serif";
  if(code==='zh'||code==='ja'||code==='ko') return "'Noto Sans CJK',sans-serif";
  return "'Noto Sans',sans-serif";
}
function _renderSummaryStacked(slug, map, fallback){
  var entry = map[slug] || {};
  if(typeof entry === 'string') entry = { summary: entry };
  if(_gaLangs.size === 0){
    return '<div class="tk-def-body tk-def-fallback" style="font-style:italic">No language selected — open the Languages dropdown.</div>';
  }
  var html = '';
  GA_LANG_LIST.forEach(function(pair){
    var code = pair[0], name = pair[1];
    if(!_gaLangs.has(code)) return;
    var t = (code === 'en') ? (entry.summary || entry.text || entry.body || fallback || '') : (entry['summary_'+code] || '');
    if(!t) return;
    var dir = GA_RTL_LANGS[code] ? 'rtl' : 'ltr';
    if(html) html += '<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(212,175,55,0.15)"></div>';
    html += '<div style="font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.08em;color:#8B7A3E;margin-bottom:4px">'+name.toUpperCase()+'</div>';
    html += '<div class="tk-def-body" dir="'+dir+'" style="font-family:'+_gaLangFont(code)+'">'+t+'</div>';
  });
  if(!html) html = '<div class="tk-def-body tk-def-fallback">No translation available for this concept in selected languages.</div>';
  return html;
}
var _thinkAnimCtl=null,_thinkAnim={mode:'stopped',timer:null,cursorY:0,maxY:0,speedMs:600,tick:null};
var ROLE_COLORS={originator:'#2ECC71',developer:'#3B82F6',critic:'#E24B4A',reviver:'#F59E0B',synthesizer:'#14B8A6',transmitter:'#38BDF8'};
function _hexToRgba(hex,a){var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return 'rgba('+r+','+g+','+b+','+a+')';}
var _showCE=true,_showHijri=true;
function _ceToHijri(ce){return Math.round((ce-622)*33/32);}
var CATEGORIES=['theology','philosophy','law','mysticism','science','politics','language'];
var CAT_TAG_COLORS={theology:'#D4AF37',philosophy:'#38BDF8',law:'#2ECC71',mysticism:'#A78BFA',science:'#14B8A6',politics:'#F59E0B',language:'#F472B6'};
var _TAG_PALETTE=['#D4AF37','#38BDF8','#2ECC71','#E24B4A','#F59E0B','#A78BFA','#14B8A6','#F472B6','#FB923C','#6EE7B7'];
function _esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

/* ── i18n helpers ── */
function _tkName(c){if(_thinkLang==='ar'&&c.name_ar)return c.name_ar;if(_thinkLang==='ur'&&c.name_ur)return c.name_ur;return c.name;}
function _tkDef(c){if(_thinkLang==='ar'&&c.definition_ar)return c.definition_ar;if(_thinkLang==='ur'&&c.definition_ur)return c.definition_ur;return c.definition;}
function _tkBookTitle(b){if(_thinkLang==='ar'&&b.title_ar)return b.title_ar;if(_thinkLang==='ur'&&b.title_ur)return b.title_ur;return b.title;}
function _tkRole(role){if(_uiTrans&&_thinkLang!=='en'){var k=_thinkLang==='ar'?'ar':'ur';var r=_uiTrans.roles&&_uiTrans.roles[role];if(r&&r[k])return r[k];}return role;}
function _tkCat(cat){if(_uiTrans&&_thinkLang!=='en'){var k=_thinkLang==='ar'?'ar':'ur';var r=_uiTrans.categories&&_uiTrans.categories[cat];if(r&&r[k])return r[k];}return cat;}
function _tkUI(key){if(_uiTrans&&_thinkLang!=='en'){var k=_thinkLang==='ar'?'ar':'ur';var r=_uiTrans.ui&&_uiTrans.ui[key];if(r&&r[k])return r[k];}return key;}
function _tkEra(label){if(_uiTrans&&_thinkLang!=='en'){var k=_thinkLang==='ar'?'ar':'ur';var r=_uiTrans.eras&&_uiTrans.eras[label];if(r&&r[k])return r[k];}return label;}
function _tkDir(){return(_thinkLang==='ar'||_thinkLang==='ur')?'rtl':'ltr';}
function _tkFont(){return _thinkLang==='ar'?"'Amiri',serif":_thinkLang==='ur'?"'Noto Nastaliq Urdu',serif":"'Cinzel',serif";}
function _tkFontBody(){return _thinkLang==='ar'?"'Amiri',serif":_thinkLang==='ur'?"'Noto Nastaliq Urdu',serif":"'Source Sans 3',sans-serif";}

function _tkNum(n){
  if(_thinkLang==='en') return String(n);
  return String(n).replace(/[0-9]/g,function(d){return '٠١٢٣٤٥٦٧٨٩'[d];});
}

function _tkFigName(f){
  if(_thinkLang==='ar'&&f.name_ar) return f.name_ar;
  if(_thinkLang==='ur'&&f.name_ur) return f.name_ur;
  if(_thinkLang!=='en'&&typeof PEOPLE!=='undefined'){
    var p=PEOPLE.find(function(pp){return pp.slug===f.slug;});
    if(p&&p.names_i18n&&p.names_i18n[_thinkLang]) return p.names_i18n[_thinkLang];
  }
  return f.name;
}

async function _loadData(){
  if(_data) return;
  var raw=null,rolesIdx=null,oldDataIdx={};
  try{var r=await fetch(dataUrl('data/islamic/think/think.json'));raw=await r.json();}
  catch(e){_data={concepts:[],stats:{}};return;}
  try{var rr=await fetch(dataUrl('data/islamic/think/think_roles.json'));rolesIdx=await rr.json();}
  catch(e){rolesIdx={};}
  try{
    var ro=await fetch(dataUrl('data/islamic/think/think.json.old'));
    var oldData=await ro.json();
    (oldData.concepts||[]).forEach(function(c){oldDataIdx[c.slug]=c.figures||[];});
  }catch(e){/* optional fallback data */}
  if(!_booksData){
    try{
      if(window._BOOKS_DATA) _booksData=window._BOOKS_DATA;
      else{var r2=await fetch(dataUrl('data/islamic/books.json'));_booksData=await r2.json();window._BOOKS_DATA=_booksData;}
    }catch(e){_booksData={books:[]};}
  }
  try{var rt=await fetch(dataUrl('data/islamic/think/think_ui_translations.json'));_uiTrans=await rt.json();}
  catch(e){_uiTrans=null;}
  _data=_thinkTransform(raw,rolesIdx||{},oldDataIdx);
}

function _thinkTransform(raw,rolesIdx,oldDataIdx){
  oldDataIdx=oldDataIdx||{};
  var out={stats:{},concepts:[]};
  var missingRoles=[];
  var missingYear=[];
  var missingRolesOld=[];
  var _ydById={};
  if(_booksData&&_booksData.books){
    _booksData.books.forEach(function(x){if(x&&x.id&&x.year_display!=null)_ydById[x.id]=x.year_display;});
  }
  (raw.concepts||[]).forEach(function(c){
    var figs=[];
    var authorsWithBooks=new Set();
    (c.books||[]).forEach(function(b){
      var sl=b.author_slug||'';
      if(!sl) return;
      authorsWithBooks.add(sl);
      var role=(rolesIdx[c.slug]&&rolesIdx[c.slug][sl])||'transmitter';
      if(!(rolesIdx[c.slug]&&rolesIdx[c.slug][sl])) missingRoles.push(c.slug+'/'+sl);
      var _rawYr=b.year;
      var _yd=(b.book_id&&_ydById[b.book_id]!=null)?_ydById[b.book_id]:null;
      var by=(_yd!=null?_yd:_rawYr);
      var hasYear=(by!=null);
      if(!hasYear){
        by=(b.author_dob!=null?b.author_dob+30:600);
        missingYear.push(c.slug+'/'+b.title);
      }
      figs.push({
        slug:sl,
        name:b.author_name||sl,
        name_ar:b.author_name_ar||'',
        name_ur:b.author_name_ur||'',
        role:role,
        dob:(b.author_dob!=null)?b.author_dob:null,
        dod:(b.author_dod!=null)?b.author_dod:null,
        tradition:b.author_tradition||'',
        type:b.author_type||'',
        _book:{
          id:b.book_id||'',
          title:b.title||'',
          title_ar:b.title_ar||'',
          title_ur:b.title_ur||'',
          year:by,
          hasYear:hasYear
        }
      });
    });
    var oldFigs=oldDataIdx[c.slug]||[];
    oldFigs.forEach(function(of){
      if(!of.slug||authorsWithBooks.has(of.slug)) return;
      var role=(rolesIdx[c.slug]&&rolesIdx[c.slug][of.slug])||of.role||'transmitter';
      if(!(rolesIdx[c.slug]&&rolesIdx[c.slug][of.slug])) missingRolesOld.push(c.slug+'/'+of.slug);
      figs.push({
        slug:of.slug,
        name:of.name||of.slug,
        role:(role||'transmitter').toLowerCase(),
        dob:(of.dob!=null)?of.dob:null,
        dod:(of.dod!=null)?of.dod:null,
        tradition:of.tradition||'',
        type:of.type||'',
        _bookless:true
      });
    });
    out.concepts.push({
      slug:c.slug,
      name:c.name,
      name_ar:c.name_ar||'',
      name_ur:c.name_ur||'',
      category:c.category,
      definition:c.definition,
      definition_ar:c.definition_ar||'',
      definition_ur:c.definition_ur||'',
      era_start:c.era_start,
      era_end:c.era_end,
      contested:c.contested,
      figure_count:figs.length,
      figures:figs
    });
  });
  var s=raw.stats||{};
  out.stats={
    concepts_with_figures:s.concepts_with_books||0,
    figures_tagged:s.books_tagged||0,
    total_assignments:s.total_assignments||0,
    books_tagged:s.books_tagged||0,
    concepts_with_books:s.concepts_with_books||0
  };
  if(missingRoles.length) console.warn('[THINK] '+missingRoles.length+' book-author pairs missing role — defaulted. First 5:',missingRoles.slice(0,5));
  if(missingYear.length) console.warn('[THINK] '+missingYear.length+' books missing year — fell back. First 5:',missingYear.slice(0,5));
  if(missingRolesOld.length) console.warn('[THINK] '+missingRolesOld.length+' bookless authors from think.json.old missing from think_roles.json. First 5:',missingRolesOld.slice(0,5));
  return out;
}

function _syncConceptBtn(){
  var btn=document.getElementById('think-concept-btn');if(!btn) return;
  var dir=_tkDir(),font=_tkFont();
  var n=_selConceptSlugs.size;
  if(n===0){
    var selTxt=_tkUI('SELECT A CONCEPT');
    btn.innerHTML='<span dir="'+dir+'" style="font-family:'+font+'">— '+_esc(selTxt)+' —</span>  <span style="opacity:.6">▾</span>';
  } else if(n===1){
    var slug=Array.from(_selConceptSlugs)[0];
    var c=(_data.concepts||[]).find(function(cc){return cc.slug===slug;});
    var label=c?_tkName(c):slug;
    btn.innerHTML='<span dir="'+dir+'" style="font-family:'+font+'">'+_esc(label)+'</span>  <span style="opacity:.6">▾</span>';
  } else {
    btn.innerHTML='<span dir="'+dir+'" style="font-family:'+font+'">'+n+' '+_tkUI('concepts')+'</span>  <span style="opacity:.6">▾</span>';
  }
}

function _buildConceptPanel(){
  var scroll=document.getElementById('think-concept-scroll');if(!scroll) return;
  var si=document.getElementById('think-concept-search');
  var q=(si&&si.value||'').toLowerCase().trim();
  // Cap dropdown panel scroll height so it does not flow off screen.
  scroll.style.maxHeight='60vh';
  scroll.style.overflowY='auto';
  // Build Monotheistic-set (slugs with at least 1 Quran verse) from the
  // already-loaded concepts.js reverse cache. Falls back to empty if not loaded.
  var monoSet=new Set();
  try {
    var rev=(window._gaConcepts && window._gaConcepts.quranByConcept) || null;
    if(rev){
      Object.keys(rev).forEach(function(k){
        if(rev[k] && rev[k].length) monoSet.add(k);
      });
    }
  } catch(e){}
  // Trigger background load if cache empty so next open of panel is correct.
  if(monoSet.size===0 && window.GoldArkConcepts && window.GoldArkConcepts.loadQuranReverse){
    window.GoldArkConcepts.loadQuranReverse(function(){ try { _buildConceptPanel(); } catch(e){} });
  }
  var mono=[], rest={};
  (_data.concepts||[]).forEach(function(c){
    if(c.figure_count===0) return;
    if(q&&c.name.toLowerCase().indexOf(q)===-1) return;
    if(monoSet.has(c.slug)){
      mono.push(c);
    } else {
      var cat=c.category||'other';
      if(!rest[cat]) rest[cat]=[];
      rest[cat].push(c);
    }
  });
  mono.sort(function(a,b){return (a.name||'').localeCompare(b.name||'');});
  var toggleLabel=_selConceptSlugs.size>0?'Deselect all':'Select all';
  var html='<div style="display:flex;justify-content:flex-end;padding:2px 14px 4px"><span class="tk-dd-toggle-all" style="font-family:Cinzel,serif;font-size:var(--fs-3);color:#D4AF37;cursor:pointer;letter-spacing:.06em">'+toggleLabel+'</span></div>';
  var dir=_tkDir(),font=_tkFont();
  function _rowHtml(c){
    var on=_selConceptSlugs.has(c.slug);
    var label=_tkName(c);
    return '<div class="dd-item'+(on?' selected':'')+'" data-val="'+_esc(c.slug)+'"><div class="dd-checkbox">'+(on?'✓':'')+'</div><span dir="'+dir+'" style="font-family:'+font+'">'+_esc(label)+'</span></div>';
  }
  // Monotheistic section — flat, no sub-headers
  if(mono.length){
    html+='<div dir="'+dir+'" style="padding:10px 14px 4px;font-family:'+font+';font-size:var(--fs-3);font-weight:700;color:#D4AF37;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;border-bottom:1px solid rgba(212,175,55,0.25);margin-bottom:4px">Monotheistic</div>';
    mono.forEach(function(c){ html+=_rowHtml(c); });
  }
  // Non-Monotheistic section — grouped by category
  var hasRest=Object.keys(rest).some(function(k){return rest[k] && rest[k].length;});
  if(hasRest){
    html+='<div dir="'+dir+'" style="padding:14px 14px 4px;font-family:'+font+';font-size:var(--fs-3);font-weight:700;color:#9AA;letter-spacing:.14em;text-transform:uppercase;pointer-events:none;border-bottom:1px solid rgba(154,170,170,0.25);margin-bottom:4px">Non-Monotheistic</div>';
    CATEGORIES.forEach(function(cat){
      if(!rest[cat]||!rest[cat].length) return;
      var catLabel=_tkCat(cat);
      html+='<div dir="'+dir+'" style="padding:6px 14px 2px;font-family:'+font+';font-size:var(--fs-3);font-weight:600;color:#9AA;letter-spacing:.10em;text-transform:uppercase;pointer-events:none">'+_esc(catLabel)+'</div>';
      rest[cat].forEach(function(c){ html+=_rowHtml(c); });
    });
  }
  scroll.innerHTML=html;
  scroll.querySelectorAll('.dd-item').forEach(function(el){
    el.addEventListener('click',function(){
      var v=this.getAttribute('data-val');
      if(_thinkAnim.mode!=='stopped') _thinkAnimStop();
      if(_selConceptSlugs.has(v)) _selConceptSlugs.delete(v); else _selConceptSlugs.add(v);
      _syncConceptBtn();_buildConceptPanel();_renderCanvas();
    });
  });
  scroll.querySelectorAll('.tk-dd-toggle-all').forEach(function(el){
    el.addEventListener('click',function(){
      if(_thinkAnim.mode!=='stopped') _thinkAnimStop();
      if(_selConceptSlugs.size>0){
        _selConceptSlugs.clear();
      } else {
        (_data.concepts||[]).forEach(function(c){if(c.figure_count>0) _selConceptSlugs.add(c.slug);});
      }
      _syncConceptBtn();_buildConceptPanel();_renderCanvas();
    });
  });
}

function _buildShell(view){
  if(!document.getElementById('think-i18n-fonts')){
    var lk=document.createElement('link');lk.id='think-i18n-fonts';lk.rel='stylesheet';
    lk.href='https://fonts.googleapis.com/css2?family=Amiri&family=Noto+Nastaliq+Urdu&display=swap';
    document.head.appendChild(lk);
  }
  var h='';
  h+='<div class="dd-panel" id="think-concept-panel" style="position:fixed;display:none"><input class="dd-search" id="think-concept-search" placeholder="search concepts…"><div id="think-concept-scroll"></div></div>';
  h+='<span id="think-definition" style="display:none"></span>';
  h+='<button id="think-concept-btn" style="display:none"></button>';
  h+='<button id="think-clear-all" style="display:none"></button>';
  h+='<div id="think-anim-mount" style="display:none"></div>';
  h+='<div id="think-canvas-wrap"><div id="think-canvas"></div></div>';
  view.innerHTML=h;
  _buildConceptPanel();
  var cPanel=document.getElementById('think-concept-panel');
  document.getElementById('think-concept-search').addEventListener('input',_buildConceptPanel);
  document.addEventListener('click',function(e){
    if(!cPanel) return;
    if(cPanel.contains(e.target)) return;
    var shellBtn = window._thShellBtn;
    if(shellBtn && shellBtn.contains(e.target)) return;
    cPanel.classList.remove('open');
    cPanel.style.display='none';
  });
  document.getElementById('think-clear-all').addEventListener('click',function(e){e.stopPropagation();if(_thinkAnim.mode!=='stopped')_thinkAnimStop();_selConceptSlugs.clear();_syncConceptBtn();_buildConceptPanel();_renderCanvas();});
  document.querySelectorAll('.tk-lang-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var lang=this.getAttribute('data-lang');
      _thinkLang=(_thinkLang===lang)?'en':lang;
      _syncLangButtons();_syncConceptBtn();_buildConceptPanel();_renderCanvas();
    });
  });
  function _syncLangButtons(){
    document.querySelectorAll('.tk-lang-btn').forEach(function(b){
      var on=(b.getAttribute('data-lang')===_thinkLang);
      b.style.borderColor=on?'#D4AF37':'#555';
      b.style.color=on?'#D4AF37':'#888';
    });
    var si=document.getElementById('think-concept-search');
    if(si) si.placeholder=_tkUI('search concepts');
    _syncLegend();
  }
  function _syncLegend(){
    var leg=document.getElementById('think-legend');if(!leg) return;
    var lh='';
    Object.keys(ROLE_COLORS).forEach(function(role){
      var label=_tkRole(role);if(_thinkLang==='en')label=label.charAt(0).toUpperCase()+label.slice(1);
      lh+='<span class="think-legend-item" dir="'+_tkDir()+'" style="font-family:'+_tkFont()+'"><span class="think-legend-dot" style="background:'+ROLE_COLORS[role]+'"></span>'+_esc(label)+'</span>';
    });
    leg.innerHTML=lh;
  }
  if(typeof _showViewDesc==='function') _showViewDesc('Select a thought to find all related figures and the roles they played');
  // Consume a pending concept selection. _thPendingConcepts (array) wins over
  // _thPendingConcept (single) if both are set.
  try {
    var _pcArr = Array.isArray(window._thPendingConcepts) ? window._thPendingConcepts : null;
    var _pcOne = (!_pcArr && window._thPendingConcept) ? window._thPendingConcept : null;
    window._thPendingConcepts = null;
    window._thPendingConcept = null;
    var _validSlugs = new Set((_data.concepts || []).map(function(c){ return c.slug; }));
    if(_pcArr){
      var _added = 0;
      _selConceptSlugs.clear();
      _pcArr.forEach(function(s){ if(_validSlugs.has(s)){ _selConceptSlugs.add(s); _added++; } });
      if(_added){ _syncConceptBtn(); _buildConceptPanel(); }
    } else if(_pcOne && _validSlugs.has(_pcOne)){
      _selConceptSlugs.clear();
      _selConceptSlugs.add(_pcOne);
      _syncConceptBtn();
      _buildConceptPanel();
    }
  } catch(e){ console.warn('[think] pending concept restore failed', e); }
  // Expose the slug index so concept-popover can check existence without re-fetching.
  try { window._thinkSlugSet = new Set((_data.concepts || []).map(function(c){ return c.slug; })); } catch(e){}
  _renderCanvas();
}

function _booksForSlug(slug){
  if(!_booksData||!_booksData.books) return[];
  return _booksData.books.filter(function(b){return b.slug===slug;});
}

function _findRelations(slugSet){
  if(typeof PEOPLE==='undefined') return[];
  var lines=[];
  PEOPLE.forEach(function(p){
    if(!p.slug||!slugSet.has(p.slug)) return;
    (p.teachers||[]).forEach(function(tName){
      var tp=PEOPLE.find(function(pp){return pp.famous===tName;});
      if(tp&&tp.slug&&slugSet.has(tp.slug)) lines.push({from:p.slug,to:tp.slug,type:'TEACHER'});
    });
    (p.relations||[]).forEach(function(r){
      var rp=PEOPLE.find(function(pp){return pp.famous===r.person;});
      if(rp&&rp.slug&&slugSet.has(rp.slug)) lines.push({from:p.slug,to:rp.slug,type:(r.relation||'RELATED').toUpperCase()});
    });
  });
  return lines;
}

function _showThinkMethodology(){
  if(document.getElementById('think-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='think-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var roles={originator:['#2ECC71','Originated or founded the concept'],developer:['#3B82F6','Expanded, refined, or systematized the concept'],critic:['#E24B4A','Challenged, opposed, or refuted the concept'],reviver:['#F59E0B','Revived or renewed interest in the concept'],synthesizer:['#14B8A6','Combined elements from multiple traditions'],transmitter:['#38BDF8','Passed on the concept through teaching or writing']};
  var rb='';
  Object.keys(roles).forEach(function(r){
    rb+='<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:'+roles[r][0]+';flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">'+r.charAt(0).toUpperCase()+r.slice(1)+'</span><span style="color:#A0AEC0">'+roles[r][1]+'</span></div>';
  });
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="think-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 16px">Each concept shows every historical figure who engaged with that idea, plotted on a timeline by their lifespan. Figures are color-coded by the role they played.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Role Definitions</h3>'
    +rb
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Confidence band</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Each concept now links to figures and books with rated evidence strength.</p>'
    +'<ul style="color:#ccc;font-size:var(--fs-3);line-height:1.6;padding-left:20px;margin:8px 0">'
    +'<li><b>HIGH</b> — strongest evidence. The figure or book is well-attested as central to this concept.</li>'
    +'<li><b>MED</b> — adds figures and books with secondary or partial evidence. Wider net, softer claims.</li>'
    +'<li><b>LOW</b> — adds figures and books with thin or contested links. Maximum breadth, weakest certainty.</li>'
    +'</ul>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Click the HIGH / MED / LOW pill in the filter row to cycle. The pill dims as confidence loosens. Counts shown on the canvas update with each click.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Evidence text</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Hover any figure or book to see a short note explaining why it is linked to this concept. These notes are AI-generated and verified against the figure\'s profile — treat them as starting points, not final scholarship.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Concept linking</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">A single figure can appear under many concepts at different confidence levels. Al-Ghazali is HIGH on tasawwuf and kalam, MED on falsafa. Walking concepts at different bands shows different views of the same figure.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:24px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em;border-top:1px solid rgba(212,175,55,0.25);padding-top:18px">Quran Verse Links — Method</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Concepts marked <b style="color:#D4AF37">Monotheistic</b> in the filter have at least one Quran verse linked to them. The link is built in three steps, each tightening confidence:</p>'
    +'<ul style="color:#ccc;font-size:var(--fs-3);line-height:1.6;padding-left:20px;margin:8px 0">'
    +'<li><b>Level 1 — Definition.</b> 485 concepts each have a written summary that defines the concept in plain language.</li>'
    +'<li><b>Level 2 — Root Match.</b> The Quran is filtered to verses that contain the concept\'s Arabic root word. Wide net (~42,700 candidate pairs). Low confidence on its own.</li>'
    +'<li><b>Level 3 — Meaning Check.</b> An AI (Claude Haiku 4.5) reads each Level-2 candidate verse against the Level-1 summary and answers YES or NO: does this verse genuinely teach this concept? Only YES verses are kept. About 90% of Level-2 candidates are dropped here.</li>'
    +'</ul>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Result: <b>4,311 verse links across 205 concepts</b>. Every verse shown survived all three filters. 270 concepts had no surviving verses and show no Quran chip — that is honest, not a bug.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Why some central concepts show few verses</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">The method is anchored on the concept\'s Arabic root word. If a verse teaches a concept without using its specific root, it does not appear here — even if the verse is widely understood to teach that concept. Example: tawhid shows 29 verses (where the root و-ح-د appears and the verse passes meaning-check). Many other verses also teach tawhid without using that root; they are not shown under this slug. This is the deliberate limit of a defensible method. We chose narrow and provable over wide and loose.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Confidence stamp</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Every Quran verse link carries the stamp <b>medium_ai</b>. Translation: the AI judged it YES under a clear rule, but a human scholar has not yet signed off each one. Human review is in progress. If you find a verse you believe was wrongly kept or wrongly dropped, use the feedback button — we want to know.</p>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What this is not</h3>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">This is not a list of every verse that teaches a concept. It is a list of verses where the concept\'s Arabic root word appears AND the verse passes a meaning check. Use it as a starting point for study, not as a complete index of Quranic teaching on the concept.</p>'
    +'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin-top:16px">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('think-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
}

function _renderCanvas(){
  var canvas=document.getElementById('think-canvas'),defEl=document.getElementById('think-definition'),statsEl=document.getElementById('think-stats');
  if(!canvas) return;
  if(_selConceptSlugs.size===0){
    canvas.innerHTML='<div class="think-empty">Pick a concept above to see its journey through history.</div>';
    if(defEl) defEl.style.display='none';
    var s=_data.stats||{};if(statsEl) statsEl.textContent=(s.concepts_with_figures||0)+' concepts / '+(s.figures_tagged||0)+' tagged';
    return;
  }
  var selConcepts=(_data.concepts||[]).filter(function(c){return _selConceptSlugs.has(c.slug);});
  var concept=selConcepts[0];
  if(defEl){
    if(selConcepts.length===1){
      defEl.style.display='';
      defEl.dir=_tkDir();
      defEl.style.fontFamily=_tkFontBody();
      var _fallback=_tkDef(concept)||'';
      defEl.innerHTML='<span class="tk-def-title">'+(_tkName(concept)||concept.slug||'Concept')+'</span><span class="tk-def-body tk-def-fallback">'+(_fallback||'Loading summary…')+'</span>';
      (function(slug, fallback){
        _tkLoadSummaries(function(map){
          if(defEl && _selConceptSlugs.has(slug)){
            defEl.innerHTML='<span class="tk-def-title">'+(_tkName(concept)||slug)+'</span>'+_renderSummaryStacked(slug, map, fallback);
            _tkDefApplyBaseHeight();
            _tkDefUpdateChev();
          }
        });
      })(concept.slug, _fallback);
    } else if(selConcepts.length>1){
      defEl.style.display='';
      defEl.classList.remove('tk-def-expanded');
      defEl.dir='ltr';
      var headHtml='<span class="tk-def-title tk-def-toggle"><span>'+selConcepts.length+' concept summaries</span><span class="tk-def-chev">▼</span></span>';
      defEl.innerHTML=headHtml+'<div class="tk-def-multi" style="display:none"><div class="tk-def-body tk-def-fallback">Loading summaries…</div></div>';
      _tkDefApplyBaseHeight();
      _tkDefUpdateChev();
      var _toggleEl=defEl.querySelector('.tk-def-toggle');
      var _chevEl=defEl.querySelector('.tk-def-chev');
      if(_toggleEl){
        _toggleEl.addEventListener('click', function(ev){
          ev.stopPropagation();
          var multi=defEl.querySelector('.tk-def-multi');
          if(!multi) return;
          var willOpen=multi.style.display==='none';
          multi.style.display=willOpen?'block':'none';
          if(_chevEl) _chevEl.textContent=willOpen?'▲':'▼';
          defEl.classList.toggle('tk-def-expanded', willOpen);
        });
      }
      (function(conceptsArr){
        _tkLoadSummaries(function(map){
          if(!defEl) return;
          // Bail if selection changed while we were fetching.
          var stillSame = conceptsArr.length === _selConceptSlugs.size && conceptsArr.every(function(c){ return _selConceptSlugs.has(c.slug); });
          if(!stillSame) return;
          var multi=defEl.querySelector('.tk-def-multi');
          if(!multi) return;
          var html='';
          conceptsArr.forEach(function(sc){
            var fallback=_tkDef(sc)||'';
            html+='<div class="tk-def-item">';
            html+='<span class="tk-def-item-title">'+(_tkName(sc)||sc.slug)+'</span>';
            html+=_renderSummaryStacked(sc.slug, map, fallback);
            html+='</div>';
          });
          multi.innerHTML=html;
          _tkDefUpdateChev();
        });
      })(selConcepts.slice());
    } else {
      defEl.classList.remove('tk-def-expanded');
      defEl.textContent='';
      defEl.style.display='none';
    }
  }
  var _allFigs=[];
  var _multiConcept=selConcepts.length>1;
  var _ciForColor=0;
  selConcepts.forEach(function(sc){
    var _cc=_TAG_PALETTE[_ciForColor%_TAG_PALETTE.length];
    var items = _TK_V2_BY_SLUG ? _tkGetConceptItems(sc.slug) : null;
    var srcFigs = (items && items.figures && items.figures.length) ? items.figures : (sc.figures||[]);
    srcFigs.forEach(function(f){
      var fc=_multiConcept?Object.assign({},f,{_cColor:_cc,_cSlug:sc.slug}):f;
      _allFigs.push(fc);
    });
    _ciForColor++;
  });
  var figs=_allFigs.sort(function(a,b){
    var ya=a._book?a._book.year:(a.dob||9999);
    var yb=b._book?b._book.year:(b.dob||9999);
    if(ya!==yb) return ya-yb;
    if((a.dob||9999)!==(b.dob||9999)) return(a.dob||9999)-(b.dob||9999);
    return(a.name||'').localeCompare(b.name||'');
  });
  var _statsLabel=selConcepts.length===1?_tkName(concept)+' — '+_tkNum(figs.length)+' '+_tkUI('BOOKS'):_tkNum(selConcepts.length)+' '+_tkUI('concepts')+' — '+_tkNum(figs.length)+' '+_tkUI('BOOKS');
  if(statsEl) statsEl.textContent=_statsLabel;

  var slugSet=new Set();
  figs.forEach(function(f){slugSet.add(f.slug);});
  var rels=_findRelations(slugSet);

  // Collect every selected concept that has Quran verses.
  // ONE start label, one pill per monotheistic concept.
  var _startList=[];
  try {
    var _rev=(window._gaConcepts && window._gaConcepts.quranByConcept) || null;
    if(_rev){
      selConcepts.forEach(function(sc){
        if(_rev[sc.slug] && _rev[sc.slug].length){
          _startList.push({slug:sc.slug, name:_tkName(sc), verses:_rev[sc.slug]});
        }
      });
    }
  } catch(e){}

  var events=[];
  if(_startList.length){
    // First entry carries the "Start" label. Each entry gets its own pill row.
    _startList.forEach(function(s, idx){
      events.push({type:'start', startEntry:s, isFirstStart:(idx===0), isLastStart:(idx===_startList.length-1)});
    });
  }
  figs.forEach(function(f,i){
    var yr=f._book?f._book.year:(f.dob||600);
    events.push({type:'fig',yr:yr,f:f,idx:i});
  });

  var ROW_H=44,PAD=30,STEM_X=500,DOT_X=16,LEFT_W=STEM_X-40;
  var yPos=PAD;
  events.forEach(function(ev){ev.y=yPos;yPos+=ROW_H;});
  var totalH=yPos+PAD;

  var figYMap={};
  events.forEach(function(ev){
    if(ev.type==='fig'&&!figYMap[ev.f.slug]) figYMap[ev.f.slug]={y:ev.y,f:ev.f};
  });

  var roleBands=[];
  var figEvents=events.filter(function(ev){return ev.type==='fig';});
  figEvents.forEach(function(ev){
    var role=(ev.f.role||'transmitter').toLowerCase();
    var last=roleBands.length?roleBands[roleBands.length-1]:null;
    if(last&&last.role===role){
      last.endY=ev.y+ROW_H;last.count++;
    } else {
      roleBands.push({role:role,startY:ev.y,endY:ev.y+ROW_H,count:1});
    }
  });

  var html='';

  // Stem starts from the BOTTOM EDGE of the last START pill (so the line
  // emerges from the centre-bottom of the brick stack). When no start row
  // exists, stem starts at the top PAD.
  var _stemTop=PAD-10;
  if(_startList.length){
    var _lastStartIdx=_startList.length-1;
    var _lastStartEv=events[_lastStartIdx];
    _stemTop=_lastStartEv.y+ROW_H; // bottom edge of last brick
  }
  html+='<div class="tk-stem" style="top:'+_stemTop+'px;height:'+(totalH-_stemTop-PAD+10)+'px"></div>';

  var _connectedYrs={};
  events.forEach(function(ev){
    if(ev.type==='start') return;  // skip start rows from year axis
    var yr=ev.yr;
    if(!_connectedYrs[yr]) _connectedYrs[yr]={count:0,midY:ev.y+ROW_H/2};
    _connectedYrs[yr].count++;
  });
  var shownYrs={};
  Object.keys(_connectedYrs).forEach(function(yr){
    if(shownYrs[yr]) return;
    shownYrs[yr]=true;
    var info=_connectedYrs[yr];
    var n=Number(yr);
    var yrTxt=n<0?_tkNum(Math.abs(n))+'<span class="year-era">'+_tkUI('BCE')+'</span>':_tkNum(n)+'<span class="year-era">'+_tkUI('CE')+'</span>';
    var multi=info.count>1?' year-multi':'';
    html+='<div class="tk-yr-mark tk-anim-el'+multi+'" data-y="'+info.midY+'" style="top:'+info.midY+'px;'+(_showCE?'':'display:none')+'">'+yrTxt+'</div>';
    var hij=_ceToHijri(n);
    var hijLabel=hij<0?_tkNum(Math.abs(hij))+'<span class="year-era">ق.هـ</span>':_tkNum(hij)+'<span class="year-era">هـ</span>';
    html+='<div class="tk-hij-mark tk-anim-el'+multi+'" data-y="'+info.midY+'" style="top:'+info.midY+'px;'+(_showHijri?'':'display:none')+'">'+hijLabel+'</div>';
  });

  html+='<div class="tk-ruler-toggle" style="top:'+(PAD-28)+'px">';
  html+='<span class="tk-ruler-btn'+ (_showCE?' on':'')+'" data-ruler="ce">CE</span>';
  html+='<span class="tk-ruler-sep">│</span>';
  html+='<span class="tk-ruler-btn'+ (_showHijri?' on':'')+'" data-ruler="hij">هـ</span>';
  html+='</div>';

  events.forEach(function(ev){
    if(ev.type==='start'){
      var sY=ev.y, sMid=sY+ROW_H/2;
      var sEntry=ev.startEntry;
      var sSlug=sEntry.slug;
      var sName=sEntry.name||sSlug;
      // Compress the row height to zero gap — bricks must touch.
      // Use ROW_H for layout slot but draw the pill flush to row edges.
      // First row prints the "Start" label above the bricks (offset up).
      if(ev.isFirstStart){
        html+='<div class="tk-fig-row tk-anim-el" data-start-row="1" data-y="'+sMid+'" style="top:'+(sY-22)+'px;height:20px">';
        html+='<div class="tk-fig-main"><div class="tk-fig-title" style="color:#D4AF37;font-family:Cinzel,serif;letter-spacing:.14em;text-transform:uppercase">Start</div></div>';
        html+='</div>';
      }
      // Determine corner radii so stacked pills look like bricks.
      // Single pill = fully rounded. Top of stack = rounded top only.
      // Middle = square. Bottom = rounded bottom only.
      var _isOnly=(ev.isFirstStart && ev.isLastStart);
      var _isTop=(ev.isFirstStart && !ev.isLastStart);
      var _isBot=(!ev.isFirstStart && ev.isLastStart);
      var _radius;
      if(_isOnly)      _radius='14px';
      else if(_isTop)  _radius='14px 14px 0 0';
      else if(_isBot)  _radius='0 0 14px 14px';
      else             _radius='0';
      // Pill sits centred on the stem X. Use absolute positioning so the
      // pill column aligns with the stem regardless of row flex.
      var _stemX=STEM_X;
      var _pillW=110;
      var _pillH=ROW_H; // brick height matches row slot — zero gap
      var _pillLeft=_stemX - _pillW/2;
      html+='<a class="tk-book-read tk-start-read" href="#start" data-slug="'+_esc(sSlug)+'" '+
        'style="position:absolute;left:'+_pillLeft+'px;top:'+sY+'px;width:'+_pillW+'px;height:'+_pillH+'px;'+
        'display:flex;align-items:center;justify-content:center;'+
        'background:linear-gradient(180deg,#e8c547,#d4af37);color:#0d1117;'+
        'border:1px solid rgba(212,175,55,1);'+
        'border-radius:'+_radius+';'+
        'font-weight:700;text-decoration:none;font-family:Cinzel,serif;letter-spacing:.12em;font-size:var(--fs-3)">READ</a>';
      // Concept name label sits to the right of the pill column.
      html+='<span class="tk-start-label" style="position:absolute;left:'+(_pillLeft+_pillW+12)+'px;top:'+sY+'px;height:'+_pillH+'px;display:flex;align-items:center;color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-3);letter-spacing:.10em;text-transform:uppercase;opacity:0.85">'+_esc(sName)+'</span>';
      return;
    }
    if(ev.type!=='fig') return;
    var f=ev.f;
    var role=(f.role||'transmitter').toLowerCase();
    var color=ROLE_COLORS[role]||'#999';
    var dates='';if(f.dob)dates+=_tkNum(f.dob);if(f.dod)dates+='–'+_tkNum(f.dod);if(dates)dates+=' '+_tkUI('CE');
    var midY=ev.y+ROW_H/2;
    var booklessStyle=f._bookless?';opacity:0.75':'';

    html+='<div class="tk-fig-row tk-anim-el'+(f._bookless?' tk-fig-bookless':'')+'" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+ev.y+'px;height:'+ROW_H+'px'+booklessStyle+'">';
    var _figLabel=_tkFigName(f);
    var _figIsRtl=(_thinkLang!=='en'&&_figLabel!==f.name);
    var _nameStyle=(_figIsRtl?'font-family:'+_tkFontBody()+';':'')+(f._cColor?'color:'+f._cColor:'');
    html+='<div class="tk-fig-main"><div class="tk-fig-title" dir="'+(_figIsRtl?'rtl':'ltr')+'"'+(_nameStyle?' style="'+_nameStyle+'"':'')+'>'+_esc(_figLabel)+'</div>';
    if(dates) html+='<div class="tk-fig-meta">'+dates+'</div>';
    html+='</div></div>';
    html+='<div class="tk-role-dot tk-anim-el" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+midY+'px;background:'+color+(f._bookless?';opacity:0.75':'')+'"></div>';
    html+='<div class="tk-dash-left tk-anim-el" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+midY+'px'+(f._bookless?';opacity:0.75':'')+'"></div>';
  });

  var BOOK_ROW_H=ROW_H;
  events.forEach(function(ev){
    if(ev.type!=='fig') return;
    var f=ev.f, b=f._book;
    if(!b) return;
    var bkY=ev.y+(ROW_H-BOOK_ROW_H)/2;
    var midY=bkY+BOOK_ROW_H/2;
    var marker=b.hasYear?'':'<span class="tk-no-yr">?</span> ';
    html+='<div class="tk-book-row tk-anim-el" data-author="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+bkY+'px;height:'+BOOK_ROW_H+'px;align-items:center">';
    var _bid=_esc(b.id||'');
    var _bookFull=(_booksData&&_booksData.books)?_booksData.books.find(function(x){return x.id===b.id;}):null;
    var _readBtn=(_bookFull&&_bookFull.is_free&&_bookFull.url)?'<a class="tk-book-read" href="'+_esc(_bookFull.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">READ</a>':'';
    var _bTitle=_tkBookTitle(b);
    var _bDir=(_thinkLang!=='en'&&_bTitle!==b.title)?_tkDir():'ltr';
    var _bFont=(_thinkLang!=='en'&&_bTitle!==b.title)?_tkFontBody():'';
    var _bStyle=(_bFont?'font-family:'+_bFont+';':'')+(f._cColor?'color:'+f._cColor:'');
    html+=marker+'<span class="tk-book-icon">📖</span><a class="tk-book-link" href="#books" data-book-id="'+_bid+'" dir="'+_bDir+'"'+(_bStyle?' style="'+_bStyle+'"':'')+' onclick="event.preventDefault();if(typeof setView===\'function\')setView(\'books\');setTimeout(function(){if(window._scrollToBookId)window._scrollToBookId(\''+_bid+'\');},350);return false;">'+_esc(_bTitle)+'</a>'+_readBtn;
    html+='</div>';
  });

  // Bind START pill clicks: pin verses for the concept and switch to START view.
  setTimeout(function(){
    var pillEls=document.querySelectorAll('.tk-start-read');
    pillEls.forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault();
        var sl=this.getAttribute('data-slug');
        var rev=(window._gaConcepts && window._gaConcepts.quranByConcept) || {};
        var raw=rev[sl] || [];
        var summary=(window.GoldArkConcepts && window.GoldArkConcepts.getSummary) ? window.GoldArkConcepts.getSummary(sl) : null;
        var label=(summary && (summary.title || summary.name)) || sl;
        var pinList=raw.map(function(v){
          if(Array.isArray(v)){
            if(typeof v[0]==='string' && v[0].indexOf(':')>0){var p=v[0].split(':');return {surah:+p[0],verse:+p[1],score:v[1]};}
            return {surah:+v[0],verse:+v[1],score:v[2]};
          }
          if(typeof v==='object') return {surah:+(v.surah||v.s),verse:+(v.verse||v.v),score:v.score};
          if(typeof v==='string' && v.indexOf(':')>0){var pp=v.split(':');return {surah:+pp[0],verse:+pp[1]};}
          return null;
        }).filter(function(x){return x && x.surah && x.verse;});
        window._stPendingPinnedVerses = { slug: sl, label: label, verses: pinList };
        var tabs=document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="start"], .tab-start');
        for(var i=0;i<tabs.length;i++){
          var elt=tabs[i];
          var txt=(elt.textContent||'').trim().toUpperCase();
          var dv=elt.getAttribute('data-view')||'';
          if(txt==='START' || dv==='start'){ elt.click(); return; }
        }
        if(typeof window.setView==='function') window.setView('start');
      });
    });
  }, 50);

  roleBands.forEach(function(band){
    var color=ROLE_COLORS[band.role]||'#999';
    var h2=band.endY-band.startY;
    html+='<div class="tk-role-band tk-anim-el" data-y="'+band.startY+'" style="top:'+band.startY+'px;height:'+h2+'px;background:linear-gradient(to right,rgba(0,0,0,0) 0%,'+_hexToRgba(color,0.08)+' 20%,'+_hexToRgba(color,0.06)+' 80%,transparent 100%);border-left:3px solid '+_hexToRgba(color,0.5)+'">';
    var _rLabel=_tkRole(band.role);if(_thinkLang==='en')_rLabel=_rLabel.toUpperCase();
    html+='<span class="tk-role-band-label" dir="'+_tkDir()+'" style="color:'+_hexToRgba(color,0.85)+';font-family:'+_tkFont()+'">'+_esc(_rLabel)+'</span>';
    html+='</div>';
  });

  var tkEraBands=window._BV_ERA_BANDS||[];
  if(tkEraBands.length&&figEvents.length){
    function _tkYrToY(yr){
      if(!figEvents.length) return PAD;
      if(figEvents.length===1) return figEvents[0].y+ROW_H/2;
      if(yr<=figEvents[0].yr){
        var f0=figEvents[0],f1=figEvents[1];
        if(f1.yr===f0.yr) return f0.y;
        var pxPerYr=(f1.y-f0.y)/(f1.yr-f0.yr);
        return Math.max(0, f0.y + pxPerYr*(yr-f0.yr));
      }
      if(yr>=figEvents[figEvents.length-1].yr){
        var fL=figEvents[figEvents.length-1],fP=figEvents[figEvents.length-2];
        if(fL.yr===fP.yr) return fL.y+ROW_H;
        var pxPerYr2=(fL.y-fP.y)/(fL.yr-fP.yr);
        return Math.min(totalH, fL.y + pxPerYr2*(yr-fL.yr));
      }
      for(var i=1;i<figEvents.length;i++){
        if(figEvents[i].yr>=yr){
          var prev=figEvents[i-1],cur=figEvents[i];
          if(cur.yr===prev.yr) return cur.y;
          var ratio=(yr-prev.yr)/(cur.yr-prev.yr);
          return prev.y+ratio*(cur.y-prev.y);
        }
      }
      return figEvents[figEvents.length-1].y+ROW_H;
    }
    tkEraBands.forEach(function(era){
      var ey1=_tkYrToY(era.start);
      var ey2=_tkYrToY(era.end);
      ey1=Math.max(0,ey1);
      ey2=Math.min(totalH,ey2);
      if(ey2<=ey1) return;
      var bandH=ey2-ey1;
      var showLabel=(bandH>=20);
      html+='<div class="tk-era-band tk-anim-el" data-y="'+ey1+'" style="top:'+ey1+'px;height:'+bandH+'px;background:linear-gradient(to right,transparent 15%,rgba('+era.glow+',0.04) 50%,rgba('+era.glow+',0.10) 100%)">';
      if(showLabel){
        html+='<span class="tk-era-band-label" dir="'+_tkDir()+'" style="color:rgba('+era.glow+',0.85);font-family:'+_tkFont()+'">'+_esc(_tkUI(era.name))+'</span>';
        var _eraDates=_tkUI(era.dates)||era.dates;
        _eraDates=_eraDates.replace(/[0-9]+/g,function(m){return _tkNum(parseInt(m,10));});
        html+='<span class="tk-era-band-dates" dir="'+_tkDir()+'" style="color:rgba('+era.glow+',0.7);font-family:'+_tkFont()+'">'+_esc(_eraDates)+'</span>';
      }
      html+='</div>';
    });
  }

  if(selConcepts.length>=1){
    var _ctSvgNS='http://www.w3.org/2000/svg';
    var _ctSvg=document.createElementNS(_ctSvgNS,'svg');
    _ctSvg.setAttribute('class','tk-concept-tags');
    _ctSvg.style.cssText='position:absolute;top:0;left:'+(STEM_X+6)+'px;width:600px;height:'+totalH+'px;pointer-events:none;z-index:0;opacity:0.7';
    var _ctIdx=0;
    selConcepts.forEach(function(sc){
      var _items2 = _TK_V2_BY_SLUG ? _tkGetConceptItems(sc.slug) : null;
      var _srcFigs2 = (_items2 && _items2.figures && _items2.figures.length) ? _items2.figures : (sc.figures||[]);
      var figSlugs=new Set();_srcFigs2.forEach(function(f){figSlugs.add(f.slug);});
      var minY=Infinity,maxY=-Infinity;
      events.forEach(function(ev){
        if(ev.type==='fig'&&figSlugs.has(ev.f.slug)){
          if(ev.y<minY) minY=ev.y;
          if(ev.y+ROW_H>maxY) maxY=ev.y+ROW_H;
        }
      });
      if(minY===Infinity) return;
      var color=_TAG_PALETTE[_ctIdx%_TAG_PALETTE.length];
      var xOff=50+(_ctIdx*34);
      var y1=minY-6,y2=maxY+6;
      if(y2-y1<30) y2=y1+30;
      var midY=(y1+y2)/2;
      var peakX=xOff+40;
      var d='M 0 '+y1.toFixed(1)+' C '+(peakX*0.4).toFixed(1)+' '+(y1+(midY-y1)*0.2).toFixed(1)+', '+peakX.toFixed(1)+' '+(y1+(midY-y1)*0.5).toFixed(1)+', '+peakX.toFixed(1)+' '+midY.toFixed(1)+' C '+peakX.toFixed(1)+' '+(midY+(y2-midY)*0.5).toFixed(1)+', '+(peakX*0.4).toFixed(1)+' '+(midY+(y2-midY)*0.8).toFixed(1)+', 0 '+y2.toFixed(1);
      var path=document.createElementNS(_ctSvgNS,'path');
      path.setAttribute('d',d);path.setAttribute('fill','none');
      path.setAttribute('stroke',color);path.setAttribute('stroke-opacity','0.45');path.setAttribute('stroke-width','2.5');
      _ctSvg.appendChild(path);
      var d1=document.createElementNS(_ctSvgNS,'circle');
      d1.setAttribute('cx','0');d1.setAttribute('cy',y1);d1.setAttribute('r','3');d1.setAttribute('fill',color);d1.setAttribute('fill-opacity','0.7');
      _ctSvg.appendChild(d1);
      var d2=document.createElementNS(_ctSvgNS,'circle');
      d2.setAttribute('cx','0');d2.setAttribute('cy',y2);d2.setAttribute('r','3');d2.setAttribute('fill',color);d2.setAttribute('fill-opacity','0.7');
      _ctSvg.appendChild(d2);
      var lblX=peakX+8;
      var lblY=y1+3;
      var conn=document.createElementNS(_ctSvgNS,'line');
      conn.setAttribute('x1','4');conn.setAttribute('y1',y1);
      conn.setAttribute('x2',lblX-2);conn.setAttribute('y2',lblY);
      conn.setAttribute('stroke',color);conn.setAttribute('stroke-opacity','0.3');
      conn.setAttribute('stroke-width','1');conn.setAttribute('stroke-dasharray','3,3');
      _ctSvg.appendChild(conn);
      var lbl=document.createElementNS(_ctSvgNS,'text');
      lbl.setAttribute('x',lblX.toFixed(1));lbl.setAttribute('y',lblY.toFixed(1));
      lbl.setAttribute('fill',color);lbl.setAttribute('fill-opacity','0.8');
      lbl.setAttribute('font-family','Cinzel,serif');lbl.setAttribute('font-size','10');
      lbl.setAttribute('letter-spacing','.06em');lbl.setAttribute('font-weight','600');
      lbl.textContent=(_thinkLang!=='en'?_tkName(sc):sc.name).toUpperCase();
      _ctSvg.appendChild(lbl);
      _ctIdx++;
    });
    window._tkPendingTagSvg=_ctSvg;
  } else {
    window._tkPendingTagSvg=null;
  }

  var DOT_CENTER_X=456;
  var maxRels=20;
  var svgDefs='',svgPaths='';
  var sortedRels=rels.slice().sort(function(a,b){
    var da=figYMap[a.from]&&figYMap[a.to]?Math.abs(figYMap[a.to].y-figYMap[a.from].y):0;
    var db=figYMap[b.from]&&figYMap[b.to]?Math.abs(figYMap[b.to].y-figYMap[b.from].y):0;
    return da-db;
  });
  if(sortedRels.length>maxRels) sortedRels=sortedRels.slice(0,maxRels);

  sortedRels.forEach(function(r,ri){
    var a=figYMap[r.from],b=figYMap[r.to];
    if(!a||!b) return;
    var y1=a.y+ROW_H/2,y2=b.y+ROW_H/2;
    var bulge=120+ri*18;
    var arcX=DOT_CENTER_X-bulge;
    if(arcX<100) arcX=100;
    var midRelY=(y1+y2)/2;

    var dashAttr='';
    var rtype=(r.type||'RELATED').toUpperCase();
    if(rtype==='FATHER'||rtype==='SON'||rtype==='MOTHER'||rtype==='DAUGHTER') dashAttr=' stroke-dasharray="6,4"';
    else if(rtype==='UNCLE'||rtype==='NEPHEW'||rtype==='COUSIN') dashAttr=' stroke-dasharray="2,3"';
    else if(rtype!=='TEACHER'&&rtype!=='STUDENT') dashAttr=' opacity="0.18"';

    var roleFrom=(a.f.role||'transmitter').toLowerCase();
    var roleTo=(b.f.role||'transmitter').toLowerCase();
    var colorFrom=ROLE_COLORS[roleFrom]||'#999';
    var colorTo=ROLE_COLORS[roleTo]||'#999';
    var strokeAttr;
    if(roleFrom===roleTo){
      strokeAttr='stroke="'+colorFrom+'" stroke-opacity="0.3"';
    } else {
      var gradId='tk-rg-'+ri;
      var topY=Math.min(y1,y2),botY=Math.max(y1,y2);
      var topColor=y1<y2?colorFrom:colorTo;
      var botColor=y1<y2?colorTo:colorFrom;
      svgDefs+='<linearGradient id="'+gradId+'" x1="0" y1="'+topY+'" x2="0" y2="'+botY+'" gradientUnits="userSpaceOnUse">';
      svgDefs+='<stop offset="0%" stop-color="'+topColor+'" stop-opacity="0.3"/>';
      svgDefs+='<stop offset="100%" stop-color="'+botColor+'" stop-opacity="0.3"/>';
      svgDefs+='</linearGradient>';
      strokeAttr='stroke="url(#'+gradId+')"';
    }

    var curveBottomY=Math.max(y1,y2);
    svgPaths+='<path data-curfew-y="'+curveBottomY+'" d="M '+DOT_CENTER_X+' '+y1+' C '+arcX+' '+y1+' '+arcX+' '+y2+' '+DOT_CENTER_X+' '+y2+'" fill="none" '+strokeAttr+' stroke-width="1.2"'+dashAttr+'/>';
    var label=_tkUI(rtype)||rtype;
    var lw=label.length*5+14;
    svgPaths+='<rect data-curfew-y="'+curveBottomY+'" x="'+(arcX-lw/2)+'" y="'+(midRelY-7)+'" width="'+lw+'" height="14" rx="7" fill="rgba(14,22,33,0.9)" stroke="rgba(139,149,165,0.2)" stroke-width="0.5"/>';
    svgPaths+='<text data-curfew-y="'+curveBottomY+'" x="'+arcX+'" y="'+(midRelY+3)+'" text-anchor="middle" direction="'+_tkDir()+'" fill="#7A8599" font-family="'+(_thinkLang!=='en'?_tkFontBody().replace(/'/g,''):'Source Sans 3,sans-serif')+'" font-size="7" letter-spacing=".04em">'+_esc(label)+'</text>';
  });
  if(svgPaths||svgDefs) html+='<svg class="tk-rel-svg" style="width:'+STEM_X+'px;height:'+totalH+'px">'+(svgDefs?'<defs>'+svgDefs+'</defs>':'')+svgPaths+'</svg>';

  html+='<div id="think-cursor" class="tk-curfew-line" style="display:none;top:'+PAD+'px"><span id="tkAnimateYear" class="tk-curfew-year"></span></div>';
  html+='<div id="think-blackout" style="display:none;position:absolute;left:0;right:0;background:#000;z-index:8;pointer-events:none"></div>';

  _thinkAnim._events=events;
  _thinkAnim._PAD=PAD;
  _thinkAnim._ROW_H=ROW_H;

  canvas.style.height=totalH+'px';
  canvas.innerHTML=html;
  if(window._tkPendingTagSvg){canvas.appendChild(window._tkPendingTagSvg);window._tkPendingTagSvg=null;}
  _thinkAnim.maxY=totalH;

  canvas.querySelectorAll('.tk-ruler-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var which=this.getAttribute('data-ruler');
      if(which==='ce'){_showCE=!_showCE;this.classList.toggle('on',_showCE);canvas.querySelectorAll('.tk-yr-mark').forEach(function(m){m.style.display=_showCE?'':'none';});}
      if(which==='hij'){_showHijri=!_showHijri;this.classList.toggle('on',_showHijri);canvas.querySelectorAll('.tk-hij-mark').forEach(function(m){m.style.display=_showHijri?'':'none';});}
    });
  });

  var _selAuthor=null;
  function _clearHighlight(){
    _selAuthor=null;
    canvas.querySelectorAll('.tk-dimmed').forEach(function(el){el.classList.remove('tk-dimmed');});
    canvas.querySelectorAll('.tk-author-selected').forEach(function(el){el.classList.remove('tk-author-selected');});
    canvas.querySelectorAll('line[data-author]').forEach(function(ln){ln.style.opacity='';});
  }
  function _highlightAuthor(slug){
    if(_selAuthor===slug){_clearHighlight();return;}
    _selAuthor=slug;
    canvas.querySelectorAll('.tk-fig-row').forEach(function(el){
      if(el.dataset.slug===slug){el.classList.remove('tk-dimmed');el.classList.add('tk-author-selected');}
      else{el.classList.add('tk-dimmed');el.classList.remove('tk-author-selected');}
    });
    canvas.querySelectorAll('.tk-role-dot').forEach(function(el){
      el.classList.toggle('tk-dimmed',el.dataset.slug!==slug);
    });
    canvas.querySelectorAll('.tk-dash-left').forEach(function(el){
      el.classList.toggle('tk-dimmed',el.dataset.slug!==slug);
    });
    canvas.querySelectorAll('.tk-book-row').forEach(function(el){
      el.classList.toggle('tk-dimmed',el.dataset.author!==slug);
    });
    canvas.querySelectorAll('line[data-author]').forEach(function(ln){
      ln.style.opacity=ln.getAttribute('data-author')===slug?'':'0.2';
    });
  }
  canvas.querySelectorAll('.tk-fig-row').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      _highlightAuthor(el.dataset.slug);
    });
    el.addEventListener('dblclick',function(e){
      e.stopPropagation();
      e.preventDefault();
      var slug = el.dataset.slug;
      if(!slug) return;
      // resolve famous English name from PEOPLE for DOM scroll fallback
      var famous = null;
      if(typeof PEOPLE !== 'undefined' && PEOPLE && PEOPLE.length){
        for(var i=0;i<PEOPLE.length;i++){
          if(PEOPLE[i].slug === slug){ famous = PEOPLE[i].famous; break; }
        }
      }
      // switch to TIMELINE
      try {
        if(typeof window.setActiveTab === 'function'){
          window.setActiveTab('TIMELINE');
        } else if(typeof setView === 'function'){
          setView('timeline');
        }
      } catch(err){}
      // scroll + focus after timeline mounts
      setTimeout(function(){
        try {
          if(typeof window.focusPersonInTimeline === 'function'){
            window.focusPersonInTimeline(slug);
            return;
          }
        } catch(err){}
        if(famous){
          var row = document.querySelector('.tc-famous[data-name="'+famous.replace(/"/g,'\\"')+'"]');
          if(row){
            row.scrollIntoView({block:'center', behavior:'smooth'});
            row.classList.add('tc-pulse');
            setTimeout(function(){ row.classList.remove('tc-pulse'); }, 1800);
          }
        }
      }, 380);
    });
  });
  canvas.addEventListener('click',function(e){
    if(!e.target.closest('.tk-fig-row')&&!e.target.closest('.tk-book-row')){
      _clearHighlight();
    }
  });
}

function _tkYToYear(cursorY){
  var evts=_thinkAnim._events;
  if(!evts||!evts.length) return null;
  var PAD=_thinkAnim._PAD||30,ROW_H=_thinkAnim._ROW_H||44;
  for(var i=evts.length-1;i>=0;i--){
    if(cursorY>=evts[i].y+ROW_H/2) return evts[i].yr;
  }
  return evts[0].yr;
}
function _tkUpdateYearLabel(yr){
  var el=document.getElementById('tkAnimateYear');
  if(!el) return;
  if(yr==null){el.innerHTML='';return;}
  var ceTxt=yr<0?_tkNum(Math.abs(yr))+'<span class="year-era">BCE</span>':_tkNum(yr)+'<span class="year-era">CE</span>';
  var hijTxt='';var hij=_ceToHijri(yr);if(hij!==null&&_showHijri) hijTxt=' <span style="opacity:.5">/</span> '+_tkNum(hij)+'<span class="year-era">هـ</span>';
  el.innerHTML=(_showCE?ceTxt:'')+hijTxt;
}

function _thinkAnimPlay(){
  if(_selConceptSlugs.size===0) return;
  var canvas=document.getElementById('think-canvas');
  if(!canvas) return;
  var cursor=document.getElementById('think-cursor');

  if(_thinkAnim.mode==='paused'){
    _thinkAnim.mode='playing';
    if(cursor) cursor.style.display='';
    _thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);
    return;
  }

  _thinkAnim.mode='playing';
  _thinkAnim.cursorY=_thinkAnim._PAD||20;
  _thinkAnim.speedMs=_thinkAnimCtl?Math.max(30,Math.round(_thinkAnimCtl.getSpeedMs()/2)):600;
  var blackout=document.getElementById('think-blackout');
  if(blackout){blackout.style.display='';blackout.style.top='0px';blackout.style.height=_thinkAnim.maxY+'px';}
  if(cursor){cursor.style.display='';cursor.style.top=_thinkAnim.cursorY+'px';}

  var STEP=4;
  _thinkAnim.tick=function(){
    if(_thinkAnim.mode!=='playing') return;
    _thinkAnim.cursorY+=STEP;
    if(_thinkAnim.cursorY>_thinkAnim.maxY*0.8){_thinkAnimStop();return;}
    if(cursor) cursor.style.top=_thinkAnim.cursorY+'px';
    var blackout=document.getElementById('think-blackout');
    if(blackout){blackout.style.top=(_thinkAnim.cursorY+1)+'px';blackout.style.height=(_thinkAnim.maxY-_thinkAnim.cursorY)+'px';}
    _tkUpdateYearLabel(_tkYToYear(_thinkAnim.cursorY));
    var wrap=document.getElementById('think-canvas-wrap');
    if(wrap) wrap.scrollTop=Math.max(0,_thinkAnim.cursorY-wrap.clientHeight/2);
  };
  _thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);
}

function _thinkAnimPause(){
  _thinkAnim.mode='paused';
  if(_thinkAnim.timer){clearInterval(_thinkAnim.timer);_thinkAnim.timer=null;}
}

function _thinkAnimStop(){
  _thinkAnim.mode='stopped';
  if(_thinkAnim.timer){clearInterval(_thinkAnim.timer);_thinkAnim.timer=null;}
  if(_thinkAnimCtl) _thinkAnimCtl.forceStop();
  var canvas=document.getElementById('think-canvas');
  if(canvas){
    var blackout=document.getElementById('think-blackout');
    if(blackout) blackout.style.display='none';
  }
  var cursor=document.getElementById('think-cursor');
  if(cursor) cursor.style.display='none';
  _tkUpdateYearLabel(null);
}

function _hideTooltip(){if(_tooltip) _tooltip.style.display='none';}

async function initThink(){
  var view=document.getElementById('think-view');if(!view) return;
  view.style.display='flex';view.style.flexDirection='column';
  await _loadData();
  if(!_inited){_buildShell(view);_inited=true;}
}

function thinkSelectConceptBySlug(slug){
  if(!slug) return false;
  if(!_data || !_data.concepts) return false;
  var target=String(slug).toLowerCase();
  var found=null;
  for(var i=0;i<_data.concepts.length;i++){
    var c=_data.concepts[i];
    if(c && c.slug && String(c.slug).toLowerCase()===target){found=c;break;}
  }
  if(!found){console.error('[think] concept not found: '+slug);return false;}
  if(!_selConceptSlugs.has(found.slug)) _selConceptSlugs.add(found.slug);
  _syncConceptBtn();
  _buildConceptPanel();
  _renderCanvas();
  return true;
}
window.thinkSelectConceptBySlug = thinkSelectConceptBySlug;

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

var _tkDefStored = (function(){ try { var v = parseInt(localStorage.getItem('tkDefHeight'),10); return (v>40 && v<2000) ? v : 140; } catch(e){ return 140; } })();
var _tkDefExpanded = false;
function _tkDefSaveHeight(h){ try { localStorage.setItem('tkDefHeight', String(Math.round(h))); } catch(e){} }
function _tkDefApplyBaseHeight(){
  var d = document.getElementById('think-definition');
  if(!d) return;
  if(_tkDefExpanded){
    d.style.maxHeight = 'none';
    d.classList.add('tk-def-expanded-full');
  } else {
    d.classList.remove('tk-def-expanded-full');
    d.style.maxHeight = _tkDefStored + 'px';
  }
}
function _tkDefUpdateChev(){
  var d = document.getElementById('think-definition');
  if(!d) return;
  var titleEl = d.querySelector('.tk-def-title');
  var btn = d.querySelector('.tk-def-chev-btn');
  if(!btn){
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tk-def-chev-btn';
    btn.innerHTML = '▾';
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      _tkDefExpanded = !_tkDefExpanded;
      btn.innerHTML = _tkDefExpanded ? '▴' : '▾';
      _tkDefApplyBaseHeight();
      setTimeout(_tkDefUpdateChev, 50);
    });
  }
  if(titleEl && btn.parentNode !== titleEl){
    titleEl.appendChild(btn);
  } else if(!titleEl && btn.parentNode !== d){
    d.appendChild(btn);
  }
  var grip = d.querySelector('.tk-def-resize');
  if(!grip){
    grip = document.createElement('div');
    grip.className = 'tk-def-resize';
    grip.title = 'Drag to resize';
    grip.addEventListener('mousedown', function(e){
      e.preventDefault();
      var startY = e.clientY;
      var startH = d.getBoundingClientRect().height;
      _tkDefExpanded = false;
      d.classList.remove('tk-def-expanded-full');
      document.body.classList.add('tk-def-resizing');
      function move(ev){
        var nh = Math.max(60, Math.min(window.innerHeight*0.8, startH + (ev.clientY - startY)));
        _tkDefStored = nh;
        d.style.maxHeight = nh + 'px';
      }
      function up(){
        document.removeEventListener('mousemove', move);
        document.removeEventListener('mouseup', up);
        document.body.classList.remove('tk-def-resizing');
        _tkDefSaveHeight(_tkDefStored);
        _tkDefUpdateChev();
      }
      document.addEventListener('mousemove', move);
      document.addEventListener('mouseup', up);
    });
    d.appendChild(grip);
  }
  setTimeout(function(){
    var overflow = d.scrollHeight > d.clientHeight + 4;
    btn.classList.toggle('is-visible', overflow || _tkDefExpanded);
    btn.innerHTML = _tkDefExpanded ? '▴' : '▾';
  }, 30);
}
function _gaBuildLangPanel(){
  if(document.getElementById('think-lang-panel')) return;
  var p = document.createElement('div');
  p.id = 'think-lang-panel';
  p.className = 'bv-dd-panel';
  p.style.width = '280px';
  var html = '<input id="think-lang-search" class="bv-dd-search" placeholder="Search languages…" />';
  html += '<div class="bv-dd-scroll" id="think-lang-scroll"></div>';
  p.innerHTML = html;
  document.body.appendChild(p);
  function paint(filter){
    var scr = document.getElementById('think-lang-scroll');
    if(!scr) return;
    var f = (filter||'').toLowerCase();
    var rows = '';
    GA_LANG_LIST.forEach(function(pair){
      var code = pair[0], name = pair[1];
      if(f && name.toLowerCase().indexOf(f) === -1) return;
      var on = _gaLangs.has(code);
      rows += '<div class="bv-ck-row'+(on?' checked':'')+'" data-code="'+code+'">';
      rows += '<span class="bv-ck'+(on?' on':'')+'"></span>';
      rows += '<span class="bv-ck-label">'+name+'</span>';
      rows += '</div>';
    });
    scr.innerHTML = rows;
    scr.querySelectorAll('.bv-ck-row').forEach(function(r){
      r.addEventListener('click', function(){
        var code = r.getAttribute('data-code');
        if(_gaLangs.has(code)) _gaLangs.delete(code); else _gaLangs.add(code);
        _gaSaveLangs();
        paint(document.getElementById('think-lang-search').value);
        var btn = window._thLangBtn; if(btn) _gaSyncLangBtn(btn);
        if(typeof _tkRenderDef === 'function') _tkRenderDef();
        else if(typeof _renderCanvas === 'function') _renderCanvas();
      });
    });
  }
  paint('');
  var si = document.getElementById('think-lang-search');
  if(si) si.addEventListener('input', function(){ paint(si.value); });
}
function _gaSyncLangBtn(btn){
  window._thLangBtn = btn;
  var n = _gaLangs.size;
  btn.textContent = n ? ('Languages ('+n+')') : 'Languages';
  btn.classList.toggle('zb-active', n>0);
}
  // Wire shell's Zone B controls — THINK spec: { search:false, filters:[Concept select], actions:[], htw:true }
  function _wireZoneB(zoneBEl){
    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;
    var legSlot = document.getElementById('think-shell-legend');
    if(legSlot){
      var lh = '';
      Object.keys(ROLE_COLORS).forEach(function(role){
        var label = role.charAt(0).toUpperCase() + role.slice(1);
        lh += '<span style="display:inline-flex;align-items:center;gap:5px"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+ROLE_COLORS[role]+'"></span>'+label+'</span>';
      });
      legSlot.innerHTML = lh;
    }
    var allSel = row2.querySelectorAll('.zb-select');
    var conceptBtn = null, langBtn = null;
    allSel.forEach(function(b){
      var t = (b.textContent||'').trim().toUpperCase();
      if(t.indexOf('LANG') !== -1) langBtn = b;
      else conceptBtn = b;
    });
    if(conceptBtn){
      window._thShellBtn = conceptBtn;
      conceptBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var cPanel = document.getElementById('think-concept-panel');
        if(!cPanel) return;
        var lp = document.getElementById('think-lang-panel'); if(lp){ lp.classList.remove('open'); lp.style.display='none'; }
        var nowOpen = !cPanel.classList.contains('open');
        cPanel.classList.toggle('open', nowOpen);
        if(nowOpen){
          var r = conceptBtn.getBoundingClientRect();
          cPanel.style.position = 'fixed';
          cPanel.style.top  = (r.bottom + 4) + 'px';
          cPanel.style.left = r.left + 'px';
          cPanel.style.zIndex = 10000;
          cPanel.style.display = 'block';
          var si=document.getElementById('think-concept-search');if(si)si.focus();
        } else {
          cPanel.style.display = 'none';
        }
      });
    }
    if(langBtn){
      _gaBuildLangPanel();
      _gaSyncLangBtn(langBtn);
      langBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var lp = document.getElementById('think-lang-panel'); if(!lp) return;
        var cp = document.getElementById('think-concept-panel'); if(cp){ cp.classList.remove('open'); cp.style.display='none'; }
        var nowOpen = !lp.classList.contains('open');
        lp.classList.toggle('open', nowOpen);
        if(nowOpen){
          var r = langBtn.getBoundingClientRect();
          var availH = Math.max(200, window.innerHeight - r.bottom - 16);
          lp.style.position = 'fixed';
          lp.style.top  = (r.bottom + 4) + 'px';
          lp.style.left = r.left + 'px';
          lp.style.zIndex = 10000;
          lp.style.display = 'flex';
          lp.style.maxHeight = availH + 'px';
        } else {
          lp.style.display = 'none';
        }
      });
      document.addEventListener('click', function(ev){
        var lp = document.getElementById('think-lang-panel');
        if(!lp) return;
        if(lp.contains(ev.target) || langBtn.contains(ev.target)) return;
        lp.classList.remove('open'); lp.style.display='none';
      });
    }

    var confBtn = document.getElementById('thinkConfPill');
    if(confBtn){
      _tkSyncConfBtn();
      confBtn.addEventListener('click', function(e){
        e.stopPropagation();
        _tkConfCycle();
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('th-mounted');

    zoneCEl.innerHTML = '<div id="think-view"></div>';

    // Eager Promise.all: core.json (figures, used by _findRelations + i18n names)
    // + think.json (concept tree). All other think_* files load inside _loadData.
    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });
    var p2 = _loadData();
    var p3 = _tkLoadV2();

    Promise.all([p1, p2, p3]).then(function(){
      initThink().then(function(){
        _wireZoneB(zoneBEl);
      });
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('th-mounted');

    try { _thinkAnimStop(); } catch(e) {}
    _hideTooltip();
    if(_tooltip && _tooltip.parentNode){ _tooltip.parentNode.removeChild(_tooltip); _tooltip = null; }

    var ov = document.getElementById('think-method-overlay'); if(ov) ov.remove();

    _inited = false;

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return {
    mount: mount,
    unmount: unmount,
    showHtw: _showThinkMethodology,
    animateStart: _thinkAnimPlay,
    animatePause: _thinkAnimPause,
    animateStop:  _thinkAnimStop,
    animateSetSpeed: function(label){
      var map = { '0.5x':1200, '1x':600, '2x':300, '4x':150 };
      _thinkAnim.speedMs = map[label] || 600;
      if(_thinkAnim.timer){ clearInterval(_thinkAnim.timer); _thinkAnim.timer = setInterval(_thinkAnim.tick, _thinkAnim.speedMs); }
    }
  };
})();
