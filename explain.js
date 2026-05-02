/* ─────────────────────────────────────────────────────────────
   EXPLAIN view — verbatim lift from bv-app/explain.js
   IIFE exposes window.ExplainView = { mount, unmount }
   Hash routing: #explain?tafsir=<id>&surah=N&verse=X
   ───────────────────────────────────────────────────────────── */
window.ExplainView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global
  var VIEW = 'explain';
  window.VIEW = 'explain';
  // stub: APP namespace
  window.APP = window.APP || { Favorites:null, filterFavsOnly:false, _lang:'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; } };
  // stub: setView — sandbox shell uses setActiveTab. The lifted _exJumpToStart
  // calls setView('start') as part of the verse-chip jump; sandbox stubs it
  // to log so the click degrades to a hash-only nav.
  if(typeof window.setView !== 'function') window.setView = function(v){ console.log('[explain] setView (stub):', v); };
  // stub: openStartAtVerse — lifted code calls this after switching to START.
  if(typeof window.openStartAtVerse !== 'function') window.openStartAtVerse = function(s,v,e){ console.log('[explain] openStartAtVerse (stub):', s, v, e); };

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/explain.js ▼▼▼
  // (CSS block removed — moved to explain.css. setView wrapper
  //  IIFE at the bottom dropped — sandbox shell handles routing.)
  // ═══════════════════════════════════════════════════════════

var _exInited = false;
// xref state for inline link chips on tafsir cards
var _exForwardXref = null;             // {tafsirId: {surah: {verse: {figures, places, books, ...}}}}
window._exBookLookup = window._exBookLookup || null;
window._exBookLookupLoading = false;
function _exLoadBookLookup(cb){
  if(window._exBookLookup){ if(cb) cb(window._exBookLookup); return; }
  if(window._exBookLookupLoading){ setTimeout(function(){ _exLoadBookLookup(cb); }, 100); return; }
  window._exBookLookupLoading = true;
  fetch(dataUrl('data/islamic/books.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      var arr = (j && j.books) || (Array.isArray(j) ? j : []);
      var lookup = {};
      arr.forEach(function(b){
        if(!b || !b.id) return;
        lookup[b.id] = {
          title:  b.title || b.id,
          author: b.author_name || '',
          url:    b.url || b.free_url || '',
          is_free: !!b.is_free
        };
      });
      window._exBookLookup = lookup;
      window._exBookLookupLoading = false;
      console.log('[EXPLAIN] book lookup: loaded', Object.keys(lookup).length, 'books');
      if(cb) cb(lookup);
    })
    .catch(function(e){
      window._exBookLookup = {};
      window._exBookLookupLoading = false;
      console.warn('[EXPLAIN] book lookup load failed', e);
      if(cb) cb(window._exBookLookup);
    });
}
// Prime the lookup as soon as the module loads.
try { _exLoadBookLookup(); } catch(e){}
var _exForwardXrefLoading = false;
var _exEventsByTafsirVerse = null;     // "<tafsirId>|<surah>:<verse>" -> [eventId, ...]
var _exEventsXrefLoading = false;
var _exConceptsForward = null;         // {tafsirId: {surah: {verse: [concept_id|{...}]}}}
var _exConceptsForwardLoading = false;
var _exConceptCanon = null;
var _exConceptCanonLoading = false;

function _exEnsureForwardXref(){
  if(!_exForwardXref && !_exForwardXrefLoading){
    _exForwardXrefLoading = true;
    fetch(dataUrl('data/islamic/xref/tafsir_xref_forward.json'))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        _exForwardXref = j || {};
        _exForwardXrefLoading = false;
        console.log('[EXPLAIN] forward xref: loaded', Object.keys(_exForwardXref).length, 'tafsir editions');
        if(_exState.edition && _exState.loadedSurahData) _exRenderCards(_exState.loadedSurahData);
      })
      .catch(function(e){ _exForwardXrefLoading = false; console.warn('[EXPLAIN] forward xref load failed', e); });
  }
  if(!_exEventsByTafsirVerse && !_exEventsXrefLoading){
    _exEventsXrefLoading = true;
    fetch(dataUrl('data/islamic/xref/tafsir_xref_events.json'))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        var idx = {};
        Object.keys(j||{}).forEach(function(eid){
          (j[eid]||[]).forEach(function(ref){
            var k = ref.tafsir + '|' + ref.surah + ':' + ref.verse;
            (idx[k] = idx[k] || []).push(eid);
          });
        });
        _exEventsByTafsirVerse = idx;
        _exEventsXrefLoading = false;
        console.log('[EXPLAIN] events xref reverse: built', Object.keys(idx).length, 'tafsir-verse keys');
        if(_exState.edition && _exState.loadedSurahData) _exRenderCards(_exState.loadedSurahData);
      })
      .catch(function(e){ _exEventsXrefLoading = false; console.warn('[EXPLAIN] events xref load failed', e); });
  }
  if(!_exConceptsForward && !_exConceptsForwardLoading){
    _exConceptsForwardLoading = true;
    fetch(dataUrl('data/islamic/concepts/concept_forward_tafsir.json'))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        _exConceptsForward = j || {};
        _exConceptsForwardLoading = false;
        console.log('[EXPLAIN] concepts forward: loaded', Object.keys(_exConceptsForward).length, 'tafsir editions');
        if(_exState.edition && _exState.loadedSurahData) _exRenderCards(_exState.loadedSurahData);
      })
      .catch(function(e){ _exConceptsForwardLoading = false; console.warn('[EXPLAIN] concepts forward load failed', e); });
  }
  if(!_exConceptCanon && !_exConceptCanonLoading){
    _exConceptCanonLoading = true;
    fetch(dataUrl('data/islamic/concepts/concept-canon.json'))
      .then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){
        _exConceptCanon = j || {};
        _exConceptCanonLoading = false;
        console.log('[EXPLAIN] concept canon: loaded', Object.keys(_exConceptCanon).length, 'entries');
        if(_exState.edition && _exState.loadedSurahData) _exRenderCards(_exState.loadedSurahData);
      })
      .catch(function(e){ _exConceptCanonLoading = false; console.warn('[EXPLAIN] concept canon load failed', e); });
  }
}

function _exNameForFigure(item){
  // item may be string slug, string name, or object
  if(item && typeof item === 'object'){
    return { slug: item.slug || item.id || '', name: item.name || item.famous || item.label || item.slug || item.id || '' };
  }
  var s = String(item || '');
  // Try slug → famous lookup via global PEOPLE
  if(/^F\d{4}$/.test(s)){
    var ppl = window.PEOPLE || [];
    var p = ppl.find(function(x){ return x.slug === s; });
    return { slug: s, name: p ? (p.famous || s) : s };
  }
  // Otherwise treat as a name; reverse-lookup slug via PEOPLE
  var ppl2 = window.PEOPLE || [];
  var p2 = ppl2.find(function(x){ return x.famous === s; });
  return { slug: p2 ? p2.slug : '', name: s };
}

function _exBuildLinkChipsHtml(edition, surah, verse){
  var tafsirId = edition && edition.id ? edition.id : '';
  var fwd = _exForwardXref && _exForwardXref[tafsirId] && _exForwardXref[tafsirId][String(surah)] && _exForwardXref[tafsirId][String(surah)][String(verse)];
  if(!fwd && _exForwardXref && edition && edition.work_id){
    var enEd = EX_TAFSIR_REGISTRY.find(function(t){ return t.work_id === edition.work_id && t.lang === 'EN'; });
    if(enEd && enEd.id !== tafsirId){
      fwd = _exForwardXref[enEd.id] && _exForwardXref[enEd.id][String(surah)] && _exForwardXref[enEd.id][String(surah)][String(verse)];
    }
  }
  var figs = (fwd && fwd.figures) || [];
  var places = (fwd && fwd.places) || [];
  var books = (fwd && fwd.books) || [];
  var evKey = tafsirId + '|' + surah + ':' + verse;
  var events = (_exEventsByTafsirVerse && _exEventsByTafsirVerse[evKey]) || [];
  // Try EN-sibling key for events too
  if(!events.length && edition && edition.work_id){
    var enEd2 = EX_TAFSIR_REGISTRY.find(function(t){ return t.work_id === edition.work_id && t.lang === 'EN'; });
    if(enEd2){
      var altKey = enEd2.id + '|' + surah + ':' + verse;
      events = (_exEventsByTafsirVerse && _exEventsByTafsirVerse[altKey]) || [];
    }
  }
  var hasAny = figs.length || places.length || books.length || events.length;
  if(!hasAny){
    return '<div class="ex-c-link-empty">No cross-references<br>for this verse</div>';
  }
  var html = '';
  if(figs.length){
    html += '<div class="ex-c-link-hdr">FIGURES</div>';
    figs.forEach(function(f){
      var info = _exNameForFigure(f);
      if(!info.name) return;
      html += '<span class="ex-c-link-chip ex-c-link-fig" onclick="window._exClickFigure(\''+_exEsc(info.name)+'\')" title="'+_exEsc(info.name)+'">'+_exEsc(info.name)+'</span>';
    });
  }
  if(events.length){
    html += '<div class="ex-c-link-hdr">EVENTS</div>';
    events.forEach(function(eid){
      html += '<span class="ex-c-link-chip ex-c-link-event" onclick="window._stXrefJumpEvent(\''+_exEsc(eid)+'\')" title="'+_exEsc(eid)+'">'+_exEsc(eid)+'</span>';
    });
  }
  if(places.length){
    html += '<div class="ex-c-link-hdr">PLACES</div>';
    places.forEach(function(pl){
      var name = (typeof pl === 'object') ? (pl.name || pl.label || '') : String(pl||'');
      if(!name) return;
      html += '<span class="ex-c-link-chip ex-c-link-place" onclick="window._exClickPlace(\''+_exEsc(name)+'\')" title="'+_exEsc(name)+'">'+_exEsc(name)+'</span>';
    });
  }
  if(books.length){
    html += '<div class="ex-c-link-hdr">BOOKS</div>';
    var bookLookup = window._exBookLookup || {};
    books.forEach(function(bk){
      var bid, fallbackLabel;
      if(typeof bk === 'object'){
        bid = bk.id || bk.slug || '';
        fallbackLabel = bk.title || bk.name || bid || '';
      } else {
        bid = String(bk || '');
        fallbackLabel = bid;
      }
      if(!bid && !fallbackLabel) return;
      var rec = (bid && bookLookup[bid]) || null;
      var title  = rec ? rec.title  : fallbackLabel;
      var author = rec ? rec.author : '';
      var url    = rec ? rec.url    : '';
      var unresolved = !rec && bid && /^F\d+-B\d+$/.test(bid);
      var readTag = url
        ? '<span class="ex-c-book-readtag" title="Free to read">Read</span>'
        : '';
      var unkTag = unresolved
        ? '<span class="ex-c-book-unktag" title="Book ID not found in registry">?</span>'
        : '';
      var authorLine = author
        ? '<div class="ex-c-book-author">'+_exEsc(author)+'</div>'
        : '';
      html += '<div class="ex-c-link-chip ex-c-book-card" data-book-id="'+_exEsc(bid)+'" data-book-url="'+_exEsc(url)+'" data-book-title="'+_exEsc(title)+'" onclick="window._exClickBookCard(this, event)" title="'+_exEsc(title)+'">'
        + '<div class="ex-c-book-title">'+_exEsc(title)+readTag+unkTag+'</div>'
        + authorLine
        + '</div>';
    });
  }
  // CONCEPTS
  var cdat = _exConceptsForward && _exConceptsForward[tafsirId] && _exConceptsForward[tafsirId][String(surah)] && _exConceptsForward[tafsirId][String(surah)][String(verse)];
  if(!cdat && _exConceptsForward && edition && edition.work_id){
    var enEdC = EX_TAFSIR_REGISTRY.find(function(t){ return t.work_id === edition.work_id && t.lang === 'EN'; });
    if(enEdC && enEdC.id !== tafsirId){
      cdat = _exConceptsForward[enEdC.id] && _exConceptsForward[enEdC.id][String(surah)] && _exConceptsForward[enEdC.id][String(surah)][String(verse)];
    }
  }
  if(cdat && cdat.length){
    html += '<div class="ex-c-link-hdr">CONCEPTS</div>';
    cdat.forEach(function(c){
      var cid = (typeof c === 'object') ? (c.concept_id || c.concept || c.id || '') : String(c||'');
      if(!cid) return;
      var meta = (_exConceptCanon && _exConceptCanon[cid]) || null;
      var label = meta ? (meta.name || meta.english_name || meta.display_name || meta.label || cid) : cid;
      var titleAttr = label;
      if(typeof c === 'object' && c.count != null) titleAttr += ' · count ' + c.count;
      html += '<span class="ex-c-link-chip ex-c-link-concept" onclick="window._exClickConcept(\''+_exEsc(cid)+'\')" title="'+_exEsc(titleAttr)+'" style="background:rgba(120,200,180,0.10);color:#78c8b4;border:1px solid rgba(120,200,180,0.45)">'+_exEsc(label)+'</span>';
    });
  }
  return html;
}

window._exVerseGo = function(surah, verse){
  if(!surah || !verse) return;
  var s = parseInt(surah,10), v = parseInt(verse,10);
  if(!s || !v) return;
  if(window._exState){
    window._exState.surah = s;
    window._exState.targetVerse = v;
  }
  // Re-render reader at new surah; explain.js reader watches _exState.surah
  if(typeof _exRenderReader === 'function'){
    _exRenderReader();
  }
  // Defer scroll-to-verse until cards render
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var card = document.querySelector('.ex-tafsir-card[data-verse="'+v+'"]') || document.querySelector('.ex-tafsir-card');
    if(card){
      try{ card.scrollIntoView({behavior:'smooth', block:'start'}); }catch(e){ card.scrollIntoView(true); }
      clearInterval(iv); return;
    }
    if(tries > 40) clearInterval(iv);
  }, 80);
};
window._exNavVerse = function(dir){
  if(!window._exState) return;
  var s = window._exState.surah || 1;
  // Find current visible card; fall back to first
  var cards = document.querySelectorAll('.ex-tafsir-card[data-verse]');
  var curV = 1;
  if(cards.length){
    // Pick the card most centered in viewport (or first)
    var best = cards[0], bestDist = 1e9;
    for(var i=0;i<cards.length;i++){
      var r = cards[i].getBoundingClientRect();
      var d = Math.abs(r.top);
      if(d < bestDist){ bestDist = d; best = cards[i]; }
    }
    curV = parseInt(best.getAttribute('data-verse'),10) || 1;
  }
  var nextV = curV + (dir === 'next' ? 1 : -1);
  if(nextV < 1) return;
  // Clamp at top of surah; for next, just attempt scroll — if card doesn't exist, no-op
  window._exVerseGo(s, nextV);
};
window._exNavSurah = function(dir){
  if(!_exState) return;
  var s = _exState.surah || 1;
  var nextS = s + (dir === 'next' ? 1 : -1);
  if(nextS < 1 || nextS > 114) return;
  _exState.surah = nextS;
  _exState.targetVerse = 1;
  if(typeof _exRenderReader === 'function') _exRenderReader();
  var body = document.querySelector('#explain-view .ex-body');
  if(body) body.scrollTop = 0;
};

window._exClickConcept = function(cid){
  if(!cid) return;
  if(typeof window._stConceptJump === 'function'){
    window._stConceptJump(cid);
    return;
  }
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="think"], .tab-think');
  for(var i=0;i<c.length;i++){
    var el=c[i];
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
};

window._exClickFigure = function(famous){
  if(!famous) return;
  window._tlPendingFocus = famous;
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="timeline"], .tab-timeline');
  for(var i=0;i<c.length;i++){
    var el=c[i];
    var txt=(el.textContent||'').trim().toUpperCase();
    var dv=el.getAttribute('data-view')||'';
    if(txt==='TIMELINE'||dv==='timeline'){ el.click(); break; }
  }
  // Retry until TIMELINE finishes mount + exposes its real jumpTo / focusPersonInTimeline
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    var fn = (typeof window.focusPersonInTimeline === 'function' && window.focusPersonInTimeline.toString().length > 60)
      ? window.focusPersonInTimeline
      : window.jumpTo;
    if(typeof fn === 'function' && fn.toString().length > 60 && (window.PEOPLE||[]).length){
      try { fn(famous); } catch(e){}
      clearInterval(iv);
      return;
    }
    if(tries > 60) clearInterval(iv);
  }, 80);
};
window._exClickPlace = function(name){
  if(!name) return;
  window._mapPendingPlace = name;
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="map"], .tab-map');
  for(var i=0;i<c.length;i++){
    var el=c[i];
    var txt=(el.textContent||'').trim().toUpperCase();
    var dv=el.getAttribute('data-view')||'';
    if(txt==='MAP'||dv==='map'){ el.click(); return; }
  }
  if(typeof setView==='function') setView('map');
};
window._exClickBook = function(bookId, label){
  window._booksPendingBook = bookId || label || '';
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="books"], .tab-books');
  for(var i=0;i<c.length;i++){
    var el=c[i];
    var txt=(el.textContent||'').trim().toUpperCase();
    var dv=el.getAttribute('data-view')||'';
    if(txt==='BOOKS'||dv==='books'){ el.click(); return; }
  }
  if(typeof setView==='function') setView('books');
};
// Rich card variant: open free-read URL in a new tab if present, else fall
// through to the BOOKS-view jump above.
window._exClickBookCard = function(el, ev){
  if(ev){ try { ev.stopPropagation(); } catch(e){} }
  if(!el) return;
  var url = el.getAttribute('data-book-url') || '';
  var bid = el.getAttribute('data-book-id') || '';
  var title = el.getAttribute('data-book-title') || '';
  if(url){
    try { window.open(url, '_blank', 'noopener,noreferrer'); return; } catch(e){}
  }
  window._exClickBook(bid, title);
};
var _pinnedTafsirs = null;  // { entries: [{tafsir, surah, verse}], label: '' }

var EX_TAFSIR_REGISTRY = [
  {id:"ar-tafsir-ibn-kathir",          work:"Tafsir Ibn Kathir",                 work_id:"ibn-kathir",    author:"Ibn Kathir",               fcode:"F0741", lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"en-tafisr-ibn-kathir",          work:"Tafsir Ibn Kathir",                 work_id:"ibn-kathir",    author:"Ibn Kathir",               fcode:"F0741", lang:"EN", tradition:"sunni-classical", partial:false},
  {id:"ur-tafseer-ibn-e-kaseer",       work:"Tafsir Ibn Kathir",                 work_id:"ibn-kathir",    author:"Ibn Kathir",               fcode:"F0741", lang:"UR", tradition:"sunni-classical", partial:false},
  {id:"bn-tafseer-ibn-e-kaseer",       work:"Tafsir Ibn Kathir",                 work_id:"ibn-kathir",    author:"Ibn Kathir",               fcode:"F0741", lang:"BN", tradition:"sunni-classical", partial:false},
  {id:"ar-tafsir-al-tabari",           work:"Tafsir al-Tabari",                  work_id:"tabari",        author:"al-Tabari",                fcode:"F0345", lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"ar-tafsir-al-jalalayn",         work:"Tafsir al-Jalalayn",                work_id:"jalalayn",      author:"Mahalli + Suyuti",         fcode:"F2017,F0344", lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"en-al-jalalayn",                work:"Tafsir al-Jalalayn",                work_id:"jalalayn",      author:"Mahalli + Suyuti",         fcode:"F2017,F0344", lang:"EN", tradition:"sunni-classical", partial:false},
  {id:"ar-tafsir-al-qurtubi",          work:"Tafsir al-Qurtubi",                 work_id:"qurtubi",       author:"al-Qurtubi",               fcode:"F0315", lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"ar-tafsir-al-baghawi",          work:"Tafsir al-Baghawi",                 work_id:"baghawi",       author:"al-Baghawi",               fcode:"F0213", lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"ar-tafsir-muyassar",            work:"Tafsir al-Muyassar",                work_id:"muyassar",      author:"King Fahd Complex",        fcode:"",      lang:"AR", tradition:"sunni-modern",    partial:false},
  {id:"ar-tafsir-al-wasit",            work:"Tafsir al-Wasit",                   work_id:"wasit",         author:"Al-Azhar group",           fcode:"",      lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"ar-tafsir-tanwir-al-miqbas",    work:"Tanwir al-Miqbas",                  work_id:"tanwir-miqbas", author:"Ibn Abbas (attr.)",        fcode:"F0078", lang:"AR", tradition:"ibn-abbas",       partial:false},
  {id:"en-tafsir-ibn-abbas",           work:"Tanwir al-Miqbas",                  work_id:"tanwir-miqbas", author:"Ibn Abbas (attr.)",        fcode:"F0078", lang:"EN", tradition:"ibn-abbas",       partial:false},
  {id:"ar-tafseer-al-saddi",           work:"Tafsir al-Sa'di",                   work_id:"saadi",         author:"al-Sa'di",                 fcode:"F2019", lang:"AR", tradition:"sunni-classical", partial:false},
  {id:"ru-tafseer-al-saddi",           work:"Tafsir al-Sa'di",                   work_id:"saadi",         author:"al-Sa'di",                 fcode:"F2019", lang:"RU", tradition:"sunni-classical", partial:false},
  {id:"en-tafsir-maarif-ul-quran",     work:"Ma'ariful Quran",                   work_id:"maariful",      author:"Mufti Shafi Usmani",       fcode:"F2020", lang:"EN", tradition:"sunni-modern",    partial:false},
  {id:"en-tazkirul-quran",             work:"Tazkirul Quran",                    work_id:"tazkirul",      author:"Wahiduddin Khan",          fcode:"F1970", lang:"EN", tradition:"sunni-modern",    partial:false},
  {id:"ur-tazkirul-quran",             work:"Tazkirul Quran",                    work_id:"tazkirul",      author:"Wahiduddin Khan",          fcode:"F1970", lang:"UR", tradition:"sunni-modern",    partial:false},
  {id:"en-tafsir-al-tustari",          work:"Tafsir al-Tustari",                 work_id:"tustari",       author:"Sahl al-Tustari",          fcode:"F1231", lang:"EN", tradition:"sufi",            partial:false},
  {id:"en-al-qushairi-tafsir",         work:"Lata'if al-Isharat",                work_id:"qushayri",      author:"al-Qushayri",              fcode:"F0316", lang:"EN", tradition:"sufi",            partial:false},
  {id:"en-kashani-tafsir",             work:"Ta'wilat al-Qur'an",                work_id:"kashani",       author:"al-Kashani",               fcode:"F2027", lang:"EN", tradition:"sufi",            partial:true},
  {id:"en-kashf-al-asrar-tafsir",      work:"Kashf al-Asrar",                    work_id:"maybudi",       author:"al-Maybudi",               fcode:"F2026", lang:"EN", tradition:"sufi",            partial:true},
  {id:"en-asbab-al-nuzul-by-al-wahidi",work:"Asbab al-Nuzul",                    work_id:"wahidi",        author:"al-Wahidi",                fcode:"F2018", lang:"EN", tradition:"sunni-classical", partial:true},
  {id:"ur-tafsir-bayan-ul-quran",      work:"Bayan ul Quran",                    work_id:"bayan-israr",   author:"Dr. Israr Ahmad",          fcode:"F2021", lang:"UR", tradition:"sunni-modern",    partial:false},
  {id:"bn-tafsir-abu-bakr-zakaria",    work:"Tafsir Abu Bakr Zakaria",           work_id:"zakaria",       author:"Abu Bakr Zakaria",         fcode:"F2023", lang:"BN", tradition:"sunni-modern",    partial:false},
  {id:"bn-tafsir-ahsanul-bayaan",      work:"Ahsanul Bayaan",                    work_id:"ahsanul",       author:"Salahuddin Yusuf",         fcode:"F2024", lang:"BN", tradition:"sunni-modern",    partial:false},
  {id:"bn-tafisr-fathul-majid",        work:"Fathul Majid",                      work_id:"fathul",        author:"Aal al-Shaykh",            fcode:"F2022", lang:"BN", tradition:"sunni-modern",    partial:true},
  {id:"kurd-tafsir-rebar",             work:"Tafsir Rebar",                      work_id:"rebar",         author:"Mulla Rebar Kurdi",        fcode:"F2025", lang:"KU", tradition:"sunni-modern",    partial:false}
];
var EX_LANG_FULL = {AR:"Arabic", EN:"English", UR:"Urdu", BN:"Bengali", KU:"Kurdish", RU:"Russian"};
var EX_LANG_ORDER = ["EN","AR","UR","BN","KU","RU"];
var EX_TRADITION_NAMES = {"sunni-classical":"Sunni Classical","sunni-modern":"Sunni Modern","sufi":"Sufi","ibn-abbas":"Ibn Abbas (attr.)"};
var EX_WORKS = null;

var _exState = {
  edition: null,
  surah: 0,
  verse: 0,
  pendingScrollVerse: null,
  loadedSurahData: null,
  fileCache: {}
};
window._exState = _exState;

function initExplain(){
  var container = document.getElementById('explain-view');
  if(!container) return;
  if(!_exInited){
    _exBuildDOM(container);
    _exInited = true;
  }
  _exApplyHash();
}
window.initExplain = initExplain;

function _exEsc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _exBuildWorks(){
  var seen = {}; var out = [];
  EX_TAFSIR_REGISTRY.forEach(function(t){
    if(!seen[t.work_id]){
      var editions = EX_TAFSIR_REGISTRY.filter(function(x){ return x.work_id === t.work_id; });
      var anyPartial = editions.some(function(x){ return x.partial; });
      seen[t.work_id] = true;
      out.push({
        work_id: t.work_id,
        work: t.work,
        author: t.author,
        fcode: t.fcode,
        tradition: t.tradition,
        langs: editions.map(function(x){ return x.lang; }),
        editions: editions,
        partial: anyPartial
      });
    }
  });
  return out;
}

function _exAuthorLink(reg){
  var author = _exEsc(reg.author);
  if(!reg.fcode) return author;
  var codes = reg.fcode.split(',').map(function(c){ return c.trim(); }).filter(Boolean);
  if(codes.length === 0) return author;
  if(codes.length === 1){
    return '<a href="#one?f=' + codes[0] + '">' + author + '</a>';
  }
  var parts = reg.author.split(/\s*\+\s*/);
  if(parts.length === codes.length){
    return parts.map(function(p, i){
      return '<a href="#one?f=' + codes[i] + '">' + _exEsc(p) + '</a>';
    }).join(' + ');
  }
  return '<a href="#one?f=' + codes[0] + '">' + author + '</a>';
}

function _exNormalize(j){
  if(j && Array.isArray(j.ayahs)){
    return j.ayahs.map(function(e){ return { ayah: e.ayah, text: e.text || '' }; });
  }
  if(j && j.data && Array.isArray(j.data.ayahs)){
    return j.data.ayahs.map(function(e){ return { ayah: e.numberInSurah, text: e.text || '' }; });
  }
  return [];
}

function _exLoadSurah(tafsirId, surahId){
  var key = tafsirId + '/' + surahId;
  if(_exState.fileCache[key]) return Promise.resolve(_exState.fileCache[key]);
  var pad = ('000' + surahId).slice(-3);
  return fetch(dataUrl('data/islamic/tafsir/' + tafsirId + '/surah-' + pad + '.json'))
    .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
    .then(function(j){
      var list = _exNormalize(j);
      _exState.fileCache[key] = list;
      return list;
    });
}

function _exEditionsFor(workId){
  return EX_TAFSIR_REGISTRY.filter(function(t){ return t.work_id === workId; });
}

function _exPickDefaultEdition(workId){
  var editions = _exEditionsFor(workId);
  var langSel = document.getElementById('ex-langSel');
  var lang = langSel ? langSel.value : '';
  if(lang){
    var m = editions.find(function(e){ return e.lang === lang; });
    if(m) return m;
  }
  var en = editions.find(function(e){ return e.lang === 'EN'; });
  return en || editions[0] || null;
}

function _exFilteredWorks(){
  var lang = document.getElementById('ex-langSel').value;
  var trad = document.getElementById('ex-tradSel').value;
  var author = document.getElementById('ex-authorSel').value;
  return EX_WORKS.filter(function(w){
    if(lang && w.langs.indexOf(lang) === -1) return false;
    if(trad && w.tradition !== trad) return false;
    if(author && w.author !== author) return false;
    return true;
  });
}

function _exRenderBlank(){
  var main = document.getElementById('ex-main');
  if(!main) return;
  var list = _exFilteredWorks();
  var langCount = new Set(EX_TAFSIR_REGISTRY.map(function(t){return t.lang;})).size;
  var h = '<div class="ex-blank-intro">Select a tafsir to begin. ' + EX_WORKS.length + ' tafsir works · ' + EX_TAFSIR_REGISTRY.length + ' editions across ' + langCount + ' languages.</div>';
  if(list.length === 0){
    h += '<div class="ex-blank-intro">No works match current filters.</div>';
  } else {
    h += '<div class="ex-work-grid">';
    list.forEach(function(w){
      var langs = EX_LANG_ORDER.filter(function(L){ return w.langs.indexOf(L) >= 0; });
      h += '<div class="ex-work-card" data-work="' + _exEsc(w.work_id) + '">';
      if(w.partial) h += '<span class="ex-partial-badge">Partial</span>';
      h += '  <div class="ex-w-title">' + _exEsc(w.work) + '</div>';
      h += '  <div class="ex-w-author">' + _exAuthorLink(w) + '</div>';
      h += '  <div class="ex-w-langs">';
      langs.forEach(function(L){ h += '<span class="ex-lang-badge">' + L + '</span>'; });
      h += '  </div>';
      h += '  <div class="ex-w-tradition-row">';
      h += '    <span class="ex-trad-badge">' + _exEsc(EX_TRADITION_NAMES[w.tradition] || w.tradition) + '</span>';
      h += '  </div>';
      h += '</div>';
    });
    h += '</div>';
  }
  main.innerHTML = h;
  main.querySelectorAll('.ex-work-card').forEach(function(el){
    el.addEventListener('click', function(){
      var workId = el.getAttribute('data-work');
      _exOpenWork(workId);
    });
  });
}

function _exOpenWork(workId){
  var ed = _exPickDefaultEdition(workId);
  if(!ed){ _exRenderBlank(); return; }
  _exState.edition = ed;
  if(!_exState.surah) _exState.surah = 1;
  var surahSel = document.getElementById('ex-surahSel');
  if(surahSel) surahSel.value = String(_exState.surah);
  _exHashWrite();
  _exRenderReader();
}

function _exCloseReader(){
  _exState.edition = null;
  _exState.loadedSurahData = null;
  _exState.verse = 0;
  var verseSel = document.getElementById('ex-verseSel');
  if(verseSel){
    verseSel.innerHTML = '';
    var o = document.createElement('option');
    o.value = '0'; o.textContent = 'All verses'; verseSel.appendChild(o);
    verseSel.disabled = true;
  }
  _exHashWrite();
  _exRenderBlank();
}

function _exSwitchEdition(editionId){
  var ed = EX_TAFSIR_REGISTRY.find(function(t){ return t.id === editionId; });
  if(!ed) return;
  _exState.edition = ed;
  _exHashWrite();
  _exRenderReader();
}

function _exRenderReader(){
  if(!_exState.edition){ _exRenderBlank(); return; }
  var ed = _exState.edition;
  var main = document.getElementById('ex-main');
  if(!main) return;
  var workEds = _exEditionsFor(ed.work_id);

  var h = '<div class="ex-reader-head">';
  h += '  <div class="ex-reader-head-main" style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;flex:1 1 400px">';
  h += '    <h2 class="ex-reader-title" style="margin:0">' + _exEsc(ed.work) + '</h2>';
  h += '    <div class="ex-reader-meta" style="margin:0">' + _exAuthorLink(ed) + ' · ' + _exEsc(EX_TRADITION_NAMES[ed.tradition] || ed.tradition) + (ed.partial ? ' · <span class="ex-amber">partial coverage</span>' : '') + '</div>';
  h += '    <div class="ex-edition-pills" style="margin:0">';
  var pillLangs = EX_LANG_ORDER.filter(function(L){ return workEds.some(function(e){ return e.lang === L; }); });
  pillLangs.forEach(function(L){
    var e = workEds.find(function(x){ return x.lang === L; });
    var active = e.id === ed.id ? ' active' : '';
    h += '<button class="ex-edition-pill' + active + '" data-edition="' + e.id + '">' + L + '</button>';
  });
  h += '    </div>';
  h += '  </div>';
  h += '  <button class="ex-close-btn" id="ex-closeReader" title="Back to library">×</button>';
  h += '  <div class="ex-surah-nav" style="width:100%;display:flex;justify-content:space-between;align-items:center;padding-top:10px;margin-top:6px;border-top:1px dashed #2a3344">';
  h += '    <button onclick="window._exNavSurah(\'prev\')" style="background:rgba(212,175,55,0.10);color:#c9a961;border:1px solid rgba(212,175,55,0.55);border-radius:18px;padding:6px 18px;font-size:13px;cursor:pointer;font-family:Lato,sans-serif" title="Previous surah">◀  PREV SURAH</button>';
  h += '    <span style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.08em;color:#9aa3b2;text-transform:uppercase">Surah ' + (_exState.surah || 1) + ' / 114</span>';
  h += '    <button onclick="window._exNavSurah(\'next\')" style="background:rgba(212,175,55,0.10);color:#c9a961;border:1px solid rgba(212,175,55,0.55);border-radius:18px;padding:6px 18px;font-size:13px;cursor:pointer;font-family:Lato,sans-serif" title="Next surah">NEXT SURAH  ▶</button>';
  h += '  </div>';
  h += '</div>';

  if(!_exState.surah) _exState.surah = 1;
  h += '<div id="ex-cardArea"><div class="ex-loading">Loading Surah ' + _exState.surah + '…</div></div>';
  main.innerHTML = h;

  document.getElementById('ex-closeReader').addEventListener('click', _exCloseReader);
  main.querySelectorAll('.ex-edition-pill').forEach(function(p){
    p.addEventListener('click', function(){ _exSwitchEdition(p.getAttribute('data-edition')); });
  });

  _exLoadSurah(ed.id, _exState.surah).then(function(list){
    _exState.loadedSurahData = list;
    _exRenderCards(list);
  }).catch(function(e){
    var ca = document.getElementById('ex-cardArea');
    if(ca) ca.innerHTML = '<div class="ex-loading" style="color:#d66">Error loading ' + _exEsc(ed.id) + ' surah ' + _exState.surah + '.</div>';
    console.error(e);
  });
}

function _exRenderCards(list){
  var ed = _exState.edition;
  var bodyClass = ed.lang === 'AR' ? 'ex-c-body-ar' : (ed.lang === 'UR' ? 'ex-c-body-ur' : 'ex-c-body-en');
  var cardArea = document.getElementById('ex-cardArea');
  if(!cardArea) return;

  var byAyah = {};
  list.forEach(function(e){ byAyah[e.ayah] = e.text; });

  var rendered = {};
  var h = '';
  list.forEach(function(e){
    if(rendered[e.ayah]) return;
    if(!e.text) return;
    var start = e.ayah, end = e.ayah;
    while(byAyah[end + 1] !== undefined && byAyah[end + 1] === e.text) end++;
    for(var v = start; v <= end; v++) rendered[v] = true;

    var headLabel = start === end
      ? ('Surah ' + _exState.surah + ' : Verse ' + start)
      : ('Surah ' + _exState.surah + ' : Verses ' + start + '–' + end);
    var chipLabel = '→ Verse ' + _exState.surah + ':' + start;

    var linkChipsHtml = _exBuildLinkChipsHtml(_exState.edition, _exState.surah, start);
    var _exBmKey  = 't:' + _exState.edition + ':' + _exState.surah + ':' + start;
    var _exBmAuth = window.GoldArkAuth;
    var _exBmFilled = !!(_exBmAuth && _exBmAuth.isSignedIn && _exBmAuth.isSignedIn() && _exBmAuth.hasBookmarkKey && _exBmAuth.hasBookmarkKey(_exBmKey));
    var _exBmTitle = _exBmAuth && _exBmAuth.isSignedIn && _exBmAuth.isSignedIn()
      ? (_exBmFilled ? 'Remove bookmark' : 'Add bookmark')
      : 'Sign in to bookmark';
    var _exBmRibbon = '<svg width="12" height="16" viewBox="0 0 12 16" fill="' + (_exBmFilled?'#D4AF37':'none') + '" stroke="#D4AF37" stroke-width="1.4"><path d="M1 1 L1 15 L6 11 L11 15 L11 1 Z"/></svg>';
    h += '<div class="ex-tafsir-card" id="ex-tc-' + start + '" data-start="' + start + '" data-end="' + end + '" data-verse="' + start + '">';
    h += '  <div class="ex-tc-grid">';
    h += '    <div class="ex-c-links">' + linkChipsHtml + '</div>';
    h += '    <div class="ex-c-main">';
    h += '      <div class="ex-c-head" style="display:flex;align-items:center;justify-content:space-between;gap:10px"><span>' + headLabel + '</span>' +
         '<button class="ex-bmk-btn" data-bmkey="' + _exBmKey + '" title="' + _exBmTitle + '" style="background:none;border:none;cursor:pointer;padding:2px 4px;line-height:1">' + _exBmRibbon + '</button>' +
         '</div>';
    h += '      <div class="' + bodyClass + '">' + _exEsc(e.text) + '</div>';
    h += '      <div class="ex-chip-row">';
    h += '        <a class="ex-chip" href="#start?surah=' + _exState.surah + '&verse=' + start + '" onclick="window._exJumpToStart(' + _exState.surah + ',' + start + ');return false;">' + chipLabel + '</a>';
    h += '      </div>';
    h += '    </div>';
    h += '  </div>';
    h += '</div>';
  });
  cardArea.innerHTML = h ? h : '<div class="ex-loading">No entries for this surah.</div>';

  // Wire bookmark buttons on tafsir entries.
  cardArea.querySelectorAll('.ex-bmk-btn').forEach(function(btn){
    btn.addEventListener('click', function(ev){
      ev.stopPropagation();
      var key = btn.getAttribute('data-bmkey');
      if(!key) return;
      var doToggle = function(){
        var a = window.GoldArkAuth;
        if(!a || !a.isSignedIn()) return;
        var was = a.hasBookmarkKey(key);
        var p = was ? a.removeBookmarkKey(key) : a.addBookmarkKey(key);
        Promise.resolve(p).then(function(){
          var nowOn = !was;
          btn.innerHTML = '<svg width="12" height="16" viewBox="0 0 12 16" fill="' + (nowOn?'#D4AF37':'none') + '" stroke="#D4AF37" stroke-width="1.4"><path d="M1 1 L1 15 L6 11 L11 15 L11 1 Z"/></svg>';
          btn.title = nowOn ? 'Remove bookmark' : 'Add bookmark';
        }).catch(function(err){ console.warn('[ex-bmk] toggle failed', err); });
      };
      if(window.GoldArkAuth && window.GoldArkAuth.isSignedIn()){
        doToggle();
      } else if(typeof window.requireTester === 'function'){
        window.requireTester('bookmark', doToggle);
      }
    });
  });

  var verseSel = document.getElementById('ex-verseSel');
  if(verseSel){
    verseSel.innerHTML = '';
    var o = document.createElement('option');
    o.value = '0'; o.textContent = 'All verses'; verseSel.appendChild(o);
    list.forEach(function(e){
      if(!e.text) return;
      o = document.createElement('option');
      o.value = e.ayah; o.textContent = 'Verse ' + e.ayah; verseSel.appendChild(o);
    });
    verseSel.disabled = false;
    if(_exState.verse) verseSel.value = String(_exState.verse);
  }

  if(_exState.pendingScrollVerse != null){
    var jumpToVerse = _exState.pendingScrollVerse;
    _exState.pendingScrollVerse = null;
    setTimeout(function(){ _exScrollToVerse(jumpToVerse); }, 50);
  } else if(_exState.verse){
    setTimeout(function(){ _exScrollToVerse(_exState.verse); }, 50);
  }
}

function _exScrollToVerse(v){
  var container = document.getElementById('explain-view');
  if(!container) return;
  var cards = container.querySelectorAll('.ex-tafsir-card');
  if(!cards.length) return;
  var target = null;
  for(var i=0;i<cards.length;i++){
    var s = parseInt(cards[i].getAttribute('data-start'), 10);
    var e = parseInt(cards[i].getAttribute('data-end'), 10);
    if(v >= s && v <= e){ target = cards[i]; break; }
  }
  if(!target){
    // Partial tafsir — pick nearest card by start verse.
    var bestDiff = Infinity;
    for(var j=0;j<cards.length;j++){
      var sv = parseInt(cards[j].getAttribute('data-start'), 10);
      if(isNaN(sv)) continue;
      var diff = Math.abs(sv - v);
      if(diff < bestDiff){ bestDiff = diff; target = cards[j]; }
    }
  }
  if(!target) return;
  target.scrollIntoView({ behavior:'smooth', block:'start' });
  target.classList.add('pulse');
  setTimeout(function(){ target.classList.remove('pulse'); }, 1600);
}

// Verse-chip click → DOM-click START tab + retry openStartAtVerse.
// setView is a sandbox stub, so we navigate via the actual tab DOM.
window._exJumpToStart = function(s, v){
  location.hash = '#start?surah=' + s + '&verse=' + v;
  var clicked = false;
  var candidates = document.querySelectorAll(
    '#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="start"], .tab-start'
  );
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'START' || dv === 'start'){ el.click(); clicked = true; break; }
  }
  if(!clicked && typeof window.setView === 'function') window.setView('start');
  // Retry calling openStartAtVerse — START's data may still be loading.
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    if(typeof window.openStartAtVerse === 'function'){
      try{ window.openStartAtVerse(s, v, v); }catch(e){}
      clearInterval(iv);
      return;
    }
    if(tries > 50){ clearInterval(iv); console.warn('[explain] openStartAtVerse never ready'); }
  }, 80);
};

function _exOpenTafsir(id, surah, verse){
  var ed = EX_TAFSIR_REGISTRY.find(function(t){ return t.id === id; });
  if(!ed) { _exRenderBlank(); return; }
  var langSel = document.getElementById('ex-langSel');
  var pref = langSel ? langSel.value : '';
  if(pref && pref !== ed.lang){
    var alt = EX_TAFSIR_REGISTRY.find(function(t){ return t.work_id === ed.work_id && t.lang === pref; });
    if(alt) ed = alt;
  }
  _exState.edition = ed;
  _exState.surah = surah && surah >= 1 && surah <= 114 ? surah : 1;
  _exState.verse = verse && verse > 0 ? verse : 0;
  if(_exState.verse) _exState.pendingScrollVerse = _exState.verse;

  var surahSel = document.getElementById('ex-surahSel');
  if(surahSel) surahSel.value = String(_exState.surah);
  _exHashWrite();
  _exRenderReader();
}
window._exOpenTafsir = _exOpenTafsir;

function _exHandlePendingPinned(){
  var pp = window._stPendingPinnedTafsir;
  if(!pp || !pp.entries || !pp.entries.length) return false;
  console.log('[EXPLAIN] pending pinned tafsirs received', pp.entries.length, 'label:', pp.label);
  window._stPendingPinnedTafsir = null;
  _pinnedTafsirs = { entries: pp.entries.slice(), label: pp.label || '' };
  var tries=0;
  var iv = setInterval(function(){
    tries++;
    var main = document.getElementById('ex-main');
    if(main){
      clearInterval(iv);
      try { _exRenderPinned(); } catch(e){ console.warn('[EX] _exRenderPinned threw', e); }
    } else if(tries>50){
      clearInterval(iv);
      console.warn('[EX] ex-main never appeared for tafsir pin set');
    }
  },80);
  return true;
}

function _exRenderPinned(){
  if(!_pinnedTafsirs) return;
  var main = document.getElementById('ex-main');
  if(!main) return;
  var entries = _pinnedTafsirs.entries;
  var label = _pinnedTafsirs.label || '';
  var count = entries.length;

  var h = '<div id="ex-pin-banner" style="padding:10px 14px;background:rgba(212,175,55,.12);border:1px solid rgba(212,175,55,.4);border-radius:6px;color:#D4AF37;font-size:14px;margin:0 0 14px;display:flex;align-items:center;gap:12px;font-family:\'Cinzel\',serif;letter-spacing:.04em">'
    + '<span style="flex:1">'+_exEsc(label)+' — '+count+' tafsir entr'+(count!==1?'ies':'y')+'</span>'
    + '<span id="ex-pin-clear" style="cursor:pointer;opacity:.85;padding:2px 10px;border:1px solid rgba(212,175,55,.5);border-radius:3px">✕ Clear</span>'
    + '</div>'
    + '<div id="ex-pin-results"><div class="ex-loading">Loading '+count+' tafsir entries…</div></div>';
  main.innerHTML = h;
  var clearBtn = document.getElementById('ex-pin-clear');
  if(clearBtn) clearBtn.onclick = _exClearPinned;

  // Group by (tafsir,surah) for batch fetch — one network call per tafsir+surah pair
  var groupKeys = {};
  entries.forEach(function(e){
    var k = e.tafsir + '|' + e.surah;
    groupKeys[k] = { tafsir: e.tafsir, surah: e.surah };
  });
  var groups = Object.keys(groupKeys).map(function(k){ return groupKeys[k]; });

  var jobs = groups.map(function(g){
    return _exLoadSurah(g.tafsir, g.surah)
      .then(function(list){ return { tafsir: g.tafsir, surah: g.surah, list: list }; })
      .catch(function(err){ console.warn('[EX pin] fetch failed', g.tafsir, g.surah, err); return { tafsir: g.tafsir, surah: g.surah, list: null }; });
  });

  Promise.all(jobs).then(function(results){
    if(!_pinnedTafsirs) return; // user cleared mid-fetch
    var resultsEl = document.getElementById('ex-pin-results');
    if(!resultsEl) return;

    var resultMap = {};
    results.forEach(function(r){ resultMap[r.tafsir+'|'+r.surah] = r.list; });

    var html = '';
    entries.forEach(function(e){
      var ed = EX_TAFSIR_REGISTRY.find(function(x){ return x.id===e.tafsir; });
      var workLabel = ed ? (ed.work + (ed.author ? ' — ' + ed.author : '')) : e.tafsir;
      var langBadge = ed ? ed.lang : '';
      var bodyClass = ed && ed.lang === 'AR' ? 'ex-c-body-ar' : (ed && ed.lang === 'UR' ? 'ex-c-body-ur' : 'ex-c-body-en');
      var list = resultMap[e.tafsir+'|'+e.surah];
      var entry = list ? list.find(function(x){ return x.ayah===e.verse; }) : null;
      var hasText = entry && entry.text;

      html += '<div class="ex-tafsir-card" style="margin-bottom:14px">';
      html += '  <div class="ex-c-head" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">';
      html += '    <span style="flex:1;min-width:200px">'+_exEsc(workLabel)+'</span>';
      if(langBadge){
        html += '    <span style="font-size:11px;color:#c084fc;border:1px solid rgba(192,132,252,.4);border-radius:3px;padding:1px 6px">'+_exEsc(langBadge)+'</span>';
      }
      html += '    <span style="font-size:11px;color:#888">Surah '+e.surah+':'+e.verse+'</span>';
      html += '  </div>';
      if(hasText){
        html += '  <div class="'+bodyClass+'">'+_exEsc(entry.text)+'</div>';
      } else {
        html += '  <div class="'+bodyClass+'" style="color:#888;font-style:italic">[entry not found in source file]</div>';
      }
      html += '  <div class="ex-chip-row" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">';
      html += '    <a class="ex-chip" href="#start?surah='+e.surah+'&verse='+e.verse+'" onclick="window._exJumpToStart('+e.surah+','+e.verse+');return false;">→ Verse '+e.surah+':'+e.verse+'</a>';
      html += '    <a class="ex-chip" href="#" onclick="window._exClearPinnedAndOpen(\''+_exEsc(e.tafsir)+'\','+e.surah+','+e.verse+');return false;">Open in Reader</a>';
      html += '  </div>';
      html += '</div>';
    });
    resultsEl.innerHTML = html;
  });
}

function _exClearPinned(){
  _pinnedTafsirs = null;
  var b = document.getElementById('ex-pin-banner');
  if(b) b.remove();
  var r = document.getElementById('ex-pin-results');
  if(r) r.remove();
  _exRenderBlank();
}
window._exClearPinnedAndOpen = function(tafsirId, surah, verse){
  _pinnedTafsirs = null;
  _exOpenTafsir(tafsirId, surah, verse);
};

function _exApplyHash(){
  var h = location.hash || '';
  if(h.indexOf('#explain') !== 0){
    if(_exState.edition) { /* keep current view */ }
    else _exRenderBlank();
    return;
  }
  var qIdx = h.indexOf('?');
  if(qIdx < 0){
    _exRenderBlank();
    return;
  }
  var qs = h.substring(qIdx + 1);
  var params = {};
  qs.split('&').forEach(function(p){
    var kv = p.split('=');
    if(kv[0]) params[kv[0]] = decodeURIComponent(kv[1] || '');
  });
  if(params.tafsir){
    _exOpenTafsir(params.tafsir, parseInt(params.surah) || 1, parseInt(params.verse) || null);
  } else {
    _exRenderBlank();
  }
}

function _exHashWrite(){
  var parts = [];
  if(_exState.edition) parts.push('tafsir=' + _exState.edition.id);
  if(_exState.surah)   parts.push('surah=' + _exState.surah);
  if(_exState.verse)   parts.push('verse=' + _exState.verse);
  var newHash = parts.length ? ('#explain?' + parts.join('&')) : '#explain';
  if(location.hash !== newHash) history.replaceState(null, '', newHash);
}

function _exPopulateFilters(){
  var langSel   = document.getElementById('ex-langSel');
  var tradSel   = document.getElementById('ex-tradSel');
  var authorSel = document.getElementById('ex-authorSel');
  var surahSel  = document.getElementById('ex-surahSel');
  var verseSel  = document.getElementById('ex-verseSel');

  var o;
  o = document.createElement('option'); o.value = ''; o.textContent = 'All'; langSel.appendChild(o);
  EX_LANG_ORDER.forEach(function(L){
    var opt = document.createElement('option'); opt.value = L; opt.textContent = EX_LANG_FULL[L];
    langSel.appendChild(opt);
  });

  o = document.createElement('option'); o.value = ''; o.textContent = 'All'; tradSel.appendChild(o);
  Object.keys(EX_TRADITION_NAMES).forEach(function(k){
    var opt = document.createElement('option'); opt.value = k; opt.textContent = EX_TRADITION_NAMES[k];
    tradSel.appendChild(opt);
  });

  o = document.createElement('option'); o.value = ''; o.textContent = 'All'; authorSel.appendChild(o);
  var seen = {};
  EX_TAFSIR_REGISTRY.forEach(function(t){
    if(seen[t.author]) return;
    seen[t.author] = true;
    var opt = document.createElement('option'); opt.value = t.author; opt.textContent = t.author;
    authorSel.appendChild(opt);
  });

  o = document.createElement('option'); o.value = '0'; o.textContent = 'All'; surahSel.appendChild(o);
  for(var i=1;i<=114;i++){
    var opt = document.createElement('option'); opt.value = i; opt.textContent = 'Surah ' + i;
    surahSel.appendChild(opt);
  }

  o = document.createElement('option'); o.value = '0'; o.textContent = 'All verses'; verseSel.appendChild(o);
}

function _exWireFilters(){
  document.getElementById('ex-langSel').addEventListener('change', function(){
    if(_exState.edition){
      var workEds = _exEditionsFor(_exState.edition.work_id);
      var want = this.value;
      if(want){
        var m = workEds.find(function(e){ return e.lang === want; });
        if(m){ _exSwitchEdition(m.id); return; }
        _exCloseReader();
        return;
      }
      _exRenderReader();
    } else {
      _exRenderBlank();
    }
  });

  document.getElementById('ex-tradSel').addEventListener('change', function(){
    if(_exState.edition && this.value && _exState.edition.tradition !== this.value){
      _exCloseReader();
    } else if(!_exState.edition){
      _exRenderBlank();
    }
  });

  document.getElementById('ex-authorSel').addEventListener('change', function(){
    if(_exState.edition && this.value && _exState.edition.author !== this.value){
      _exCloseReader();
    } else if(!_exState.edition){
      _exRenderBlank();
    }
  });

  document.getElementById('ex-surahSel').addEventListener('change', function(){
    var n = parseInt(this.value, 10) || 0;
    _exState.surah = n;
    _exState.verse = 0;
    _exHashWrite();
    if(_exState.edition && n > 0) _exRenderReader();
  });

  document.getElementById('ex-verseSel').addEventListener('change', function(){
    var n = parseInt(this.value, 10) || 0;
    _exState.verse = n;
    _exHashWrite();
    if(n > 0) _exScrollToVerse(n);
  });
}

function _exBuildDOM(container){
  EX_WORKS = _exBuildWorks();

  // In-body header removed (shell row 2 owns Tafsir/Language/Surah/Verse). The
  // five legacy <select>s are kept hidden so existing _exPopulateFilters /
  // _exWireFilters / _exRenderCards code keeps working unchanged.
  container.innerHTML =
    '<div class="ex-body">' +
      '<div class="ex-stash" style="display:none">' +
        '<select id="ex-langSel"></select>' +
        '<select id="ex-tradSel"></select>' +
        '<select id="ex-authorSel"></select>' +
        '<select id="ex-surahSel"></select>' +
        '<select id="ex-verseSel" disabled></select>' +
      '</div>' +
      '<div class="ex-main content-body" id="ex-main"></div>' +
    '</div>';

  _exPopulateFilters();
  _exWireFilters();
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // The trailing setView IIFE wrapper from bv-app/explain.js was
  // dropped — sandbox shell handles tab switching via setActiveTab.
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // SHELL FILTER WIRING (.dd-panel pattern lifted from monastic.js)
  // ═══════════════════════════════════════════════════════════
  var _exShellDocClickBound = false;

  function _exFindShellBtn(row2, labelBase){
    var sels = row2.querySelectorAll('.zb-select');
    var lb = labelBase.toLowerCase();
    for(var i = 0; i < sels.length; i++){
      var t = (sels[i].textContent || '').trim().toLowerCase();
      if(t === lb || t.indexOf(lb + ':') === 0) return sels[i];
    }
    return null;
  }

  function _exTafsirEntries(){
    if(!EX_WORKS) EX_WORKS = _exBuildWorks();
    return EX_WORKS.map(function(w){
      return { value: w.work_id, label: w.work, count: w.langs.length };
    });
  }
  function _exLangEntries(){
    return EX_LANG_ORDER.map(function(L){
      return { value: L, label: EX_LANG_FULL[L] + ' (' + L + ')' };
    });
  }
  function _exSurahEntries(){
    var arr = [];
    for(var i = 1; i <= 114; i++) arr.push({ value: String(i), label: 'Surah ' + i });
    return arr;
  }
  function _exVerseEntries(){
    var max = 286;
    if(_exState.loadedSurahData && _exState.loadedSurahData.length){
      max = _exState.loadedSurahData[_exState.loadedSurahData.length - 1].ayah;
    }
    var arr = [];
    for(var i = 1; i <= max; i++) arr.push({ value: String(i), label: 'Verse ' + i });
    return arr;
  }

  function _exBuildShellPanel(kind, labelBase, entries, allLabel){
    var panel = document.createElement('div');
    panel.className = 'dd-panel ex-shell-panel';
    panel.dataset.kind = kind;

    var si = document.createElement('input');
    si.type = 'text'; si.className = 'dd-search'; si.placeholder = 'Search...';
    si.oninput = function(){
      var q = si.value.toLowerCase();
      panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){
        el.style.display = el.innerText.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
      });
    };
    panel.appendChild(si);

    var allRow = document.createElement('div');
    allRow.className = 'dd-item dd-all';
    allRow.innerHTML = '<div class="dd-checkbox">✓</div><span>' + _exEsc(allLabel || 'All') + '</span>';
    allRow.onclick = function(){ _exShellPick(kind, '', allLabel || 'All'); };
    panel.appendChild(allRow);

    entries.forEach(function(entry){
      var el = document.createElement('div');
      el.className = 'dd-item';
      el.dataset.val = entry.value;
      var inner = '<div class="dd-checkbox"></div><span>' + _exEsc(entry.label) + '</span>';
      if(entry.count != null) inner += '<span class="dd-count">' + entry.count + '</span>';
      el.innerHTML = inner;
      el.onclick = function(){ _exShellPick(kind, entry.value, entry.label); };
      panel.appendChild(el);
    });

    panel._exLabelBase = labelBase;
    return panel;
  }

  function _exRefreshShellPanel(kind){
    var portal = document.getElementById('ex-portal');
    if(!portal) return;
    var panel = portal.querySelector('.ex-shell-panel[data-kind="' + kind + '"]');
    if(!panel) return;
    panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){ el.remove(); });
    var entries;
    if(kind === 'tafsir')      entries = _exTafsirEntries();
    else if(kind === 'lang')   entries = _exLangEntries();
    else if(kind === 'surah')  entries = _exSurahEntries();
    else if(kind === 'verse')  entries = _exVerseEntries();
    else entries = [];
    entries.forEach(function(entry){
      var el = document.createElement('div');
      el.className = 'dd-item';
      el.dataset.val = entry.value;
      var inner = '<div class="dd-checkbox"></div><span>' + _exEsc(entry.label) + '</span>';
      if(entry.count != null) inner += '<span class="dd-count">' + entry.count + '</span>';
      el.innerHTML = inner;
      el.onclick = function(){ _exShellPick(kind, entry.value, entry.label); };
      panel.appendChild(el);
    });
  }

  function _exShellSyncBtnLabel(kind, value, label){
    var portal = document.getElementById('ex-portal');
    if(!portal) return;
    var panel = portal.querySelector('.ex-shell-panel[data-kind="' + kind + '"]');
    if(!panel) return;
    panel.querySelectorAll('.dd-item').forEach(function(item){
      var ck = item.querySelector('.dd-checkbox');
      var on = item.classList.contains('dd-all') ? value === '' : item.dataset.val === value;
      if(ck) ck.textContent = on ? '✓' : '';
      item.classList.toggle('selected', on);
    });
    var btn = panel._exBtn;
    if(btn){
      btn.textContent = (value === '' || value == null) ? panel._exLabelBase : (panel._exLabelBase + ': ' + label);
    }
  }

  function _exClosePanels(){
    var portal = document.getElementById('ex-portal');
    if(!portal) return;
    portal.querySelectorAll('.dd-panel.open').forEach(function(p){
      p.classList.remove('open');
      p.style.display = 'none';
    });
  }

  function _exShellPick(kind, value, label){
    _exShellSyncBtnLabel(kind, value, label);
    _exClosePanels();

    if(kind === 'tafsir'){
      if(value === ''){ _exCloseReader(); }
      else { _exOpenWork(value); }
      return;
    }
    if(kind === 'lang'){
      var langSel = document.getElementById('ex-langSel');
      if(langSel){
        langSel.value = value || '';
        langSel.dispatchEvent(new Event('change'));
      }
      return;
    }
    if(kind === 'surah'){
      var n = parseInt(value, 10) || 0;
      _exState.surah = n;
      _exState.verse = 0;
      var surahSel = document.getElementById('ex-surahSel');
      if(surahSel) surahSel.value = String(n || 0);
      _exHashWrite();
      if(_exState.edition && n > 0) _exRenderReader();
      _exShellSyncBtnLabel('verse', '', 'All');
      _exRefreshShellPanel('verse');
      return;
    }
    if(kind === 'verse'){
      var v = parseInt(value, 10) || 0;
      _exState.verse = v;
      _exHashWrite();
      if(v > 0) _exScrollToVerse(v);
      return;
    }
  }

  function _exWireShellFilters(zoneBEl){
    if(!zoneBEl) return;

    var searchInp = zoneBEl.querySelector('.zb-search-input');
    if(searchInp){
      searchInp.placeholder = 'Search tafsir works…';
      searchInp.addEventListener('input', function(){
        var q = (searchInp.value || '').toLowerCase();
        document.querySelectorAll('#ex-main .ex-work-card').forEach(function(card){
          var text = (card.textContent || '').toLowerCase();
          card.style.display = !q || text.indexOf(q) !== -1 ? '' : 'none';
        });
      });
    }

    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;

    var portal = document.getElementById('ex-portal');
    if(portal && portal.parentNode) portal.parentNode.removeChild(portal);
    portal = document.createElement('div');
    portal.id = 'ex-portal';
    document.body.appendChild(portal);

    var btnTafsir = _exFindShellBtn(row2, 'Tafsir');
    var btnLang   = _exFindShellBtn(row2, 'Language');

    var panelTafsir = _exBuildShellPanel('tafsir', 'Tafsir', _exTafsirEntries(), 'All');
    var panelLang   = _exBuildShellPanel('lang',   'Language', _exLangEntries(), 'All');

    portal.appendChild(panelTafsir);
    portal.appendChild(panelLang);

    function _attach(btn, panel){
      if(!btn || !panel) return;
      panel._exBtn = btn;
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var wasOpen = panel.classList.contains('open');
        _exClosePanels();
        if(!wasOpen){
          var r = btn.getBoundingClientRect();
          panel.style.cssText = 'position:fixed;top:' + (r.bottom + 4) + 'px;left:' + r.left + 'px;z-index:10000;display:block;background:#1a1a2e;border:1px solid rgba(212,175,55,0.55);border-radius:6px;min-width:240px;max-height:400px;overflow-y:auto;padding:6px 0;box-shadow:0 8px 24px rgba(0,0,0,.6)';
          panel.classList.add('open');
          var si = panel.querySelector('.dd-search');
          if(si){ si.value = ''; si.dispatchEvent(new Event('input')); si.focus(); }
        }
      });
    }

    _attach(btnTafsir, panelTafsir);
    _attach(btnLang,   panelLang);

    if(!_exShellDocClickBound){
      _exShellDocClickBound = true;
      document.addEventListener('click', function(e){
        var portalNow = document.getElementById('ex-portal');
        if(!portalNow) return;
        portalNow.querySelectorAll('.dd-panel.open').forEach(function(p){
          if(p.contains(e.target)) return;
          if(p._exBtn && p._exBtn.contains(e.target)) return;
          p.classList.remove('open');
          p.style.display = 'none';
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT / HTW
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function _exMount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;
    document.body.classList.add('ex-mounted');

    var view = document.getElementById('explain-view');
    if(!view){
      view = document.createElement('div');
      view.id = 'explain-view';
      zoneCEl.appendChild(view);
      _exInited = false;
    }
    view.style.display = 'flex';

    if(!_exInited){
      _exBuildDOM(view);
      _exInited = true;
    }

    _exEnsureForwardXref();
    if(!window.PEOPLE || !window.PEOPLE.length){
      fetch(dataUrl('data/islamic/core.json'))
        .then(function(r){ return r.ok ? r.json() : []; })
        .catch(function(){ return []; })
        .then(function(arr){
          window.PEOPLE = arr || [];
          if(_exState.edition && _exState.loadedSurahData) _exRenderCards(_exState.loadedSurahData);
        });
    }
    _exWireShellFilters(zoneBEl);
    var hadPin = _exHandlePendingPinned();
    if(!hadPin) _exApplyHash();

    setTimeout(function(){
      if(!zoneBEl || !window._exState) return;
      var row2 = zoneBEl.querySelector('.zb-row2');
      if(!row2) return;
      if(row2.querySelector('.ex-surah-picker')) return;
      var holder = document.createElement('div');
      holder.className = 'ex-verse-nav-pickers';
      holder.style.cssText = 'display:flex;gap:8px;margin-left:auto;align-items:center';
      holder.innerHTML = '<button class="zb-select ex-surah-picker" id="exSurahBtn">Surah <span id="exSurahLbl">--</span> ▾</button>'
        + '<button class="zb-select ex-verse-picker" id="exVerseBtn">Verse <span id="exVerseLbl">--</span> ▾</button>';
      row2.appendChild(holder);
      var sBtn = holder.querySelector('#exSurahBtn');
      var vBtn = holder.querySelector('#exVerseBtn');
      var sLbl = holder.querySelector('#exSurahLbl');
      var vLbl = holder.querySelector('#exVerseLbl');
      function refreshLbls(){
        sLbl.textContent = (window._exState && window._exState.surah) || '--';
        vLbl.textContent = (window._exState && window._exState.targetVerse) || '1';
      }
      refreshLbls();
      // Surah counts: 6236 ayahs across 114 surahs — load from quran-meta.json or hardcode
      var SURAH_AYAHS = [7,286,200,176,120,165,206,75,129,109,123,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
      function buildPanel(items, onPick){
        var old = document.querySelector('.dd-panel.ex-nav-dd'); if(old) old.remove();
        var p = document.createElement('div');
        p.className = 'dd-panel ex-nav-dd open';
        var inner = '<input class="dd-search" placeholder="search...">';
        items.forEach(function(it){
          inner += '<div class="dd-item" data-val="'+it.val+'"><div class="dd-checkbox">'+(it.sel?'✓':'')+'</div><span>'+it.label+'</span></div>';
        });
        p.innerHTML = inner;
        document.body.appendChild(p);
        var search = p.querySelector('.dd-search');
        search.addEventListener('input', function(){
          var q = search.value.toLowerCase();
          p.querySelectorAll('.dd-item').forEach(function(it){
            it.style.display = it.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
          });
        });
        p.querySelectorAll('.dd-item').forEach(function(it){
          it.addEventListener('click', function(){
            var v = parseInt(it.getAttribute('data-val'),10);
            onPick(v);
            p.remove();
          });
        });
        // Outside-click close
        setTimeout(function(){
          var closer = function(e){
            if(!p.contains(e.target)){ p.remove(); document.removeEventListener('click', closer); }
          };
          document.addEventListener('click', closer);
        }, 50);
        return p;
      }
      sBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var curS = (window._exState && window._exState.surah) || 1;
        var items = [];
        for(var i=1;i<=114;i++) items.push({val:i, label:'Surah '+i+' ('+SURAH_AYAHS[i-1]+' verses)', sel: i===curS});
        var p = buildPanel(items, function(v){
          window._exVerseGo(v, 1);
          refreshLbls();
        });
        var r = sBtn.getBoundingClientRect();
        p.style.position='fixed'; p.style.top=(r.bottom+4)+'px'; p.style.left=r.left+'px';
      });
      vBtn.addEventListener('click', function(e){
        e.stopPropagation();
        var curS = (window._exState && window._exState.surah) || 1;
        var curV = (window._exState && window._exState.targetVerse) || 1;
        var ayahs = SURAH_AYAHS[curS-1] || 1;
        var items = [];
        for(var i=1;i<=ayahs;i++) items.push({val:i, label:'Verse '+curS+':'+i, sel: i===curV});
        var p = buildPanel(items, function(v){
          window._exVerseGo(curS, v);
          refreshLbls();
        });
        var r = vBtn.getBoundingClientRect();
        p.style.position='fixed'; p.style.top=(r.bottom+4)+'px'; p.style.left=r.left+'px';
      });
      // Refresh labels whenever state changes via arrows
      var origVG = window._exVerseGo;
      window._exVerseGo = function(s, v){ origVG(s, v); setTimeout(refreshLbls, 100); };
    }, 400);
  }

  function _exUnmount(){
    if(!_mounted) return;
    _mounted = false;
    document.body.classList.remove('ex-mounted');

    var view = document.getElementById('explain-view');
    if(view) view.style.display = 'none';

    _exClosePanels();

    _exState.edition = null;
    _exState.surah = 0;
    _exState.verse = 0;
    _exState.pendingScrollVerse = null;
    _exState.loadedSurahData = null;
    _pinnedTafsirs = null;
    _exInited = false;

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  function _exShowHtw(){
    var body =
      'EXPLAIN — Tafsir Collection · The Explanation.\n\n' +
      'Browse 28 tafsir editions across 21 works in 6 languages (Arabic, English, Urdu, Bengali, Kurdish, Russian).\n\n' +
      'Filter by Tafsir or Language. Click any work card to read.';
    if(typeof window.openModal === 'function') window.openModal('How This Works — EXPLAIN', body);
  }

  function _exCaptureState(){
    var body = document.querySelector('#explain-view .ex-body');
    return {
      scroll: body ? body.scrollTop : 0,
      pinEntries: _pinnedTafsirs ? _pinnedTafsirs.entries.slice() : null,
      pinLabel: _pinnedTafsirs ? _pinnedTafsirs.label : ''
    };
  }
  function _exRestoreState(s){
    if(!s) return;
    if(s.pinEntries && s.pinEntries.length){
      _pinnedTafsirs = { entries: s.pinEntries.slice(), label: s.pinLabel || '' };
      setTimeout(function(){
        try { _exRenderPinned(); } catch(e){}
      }, 250);
    }
    if(typeof s.scroll === 'number'){
      setTimeout(function(){
        var body = document.querySelector('#explain-view .ex-body');
        if(body) body.scrollTop = s.scroll;
      }, 400);
    }
  }
  return { mount: _exMount, unmount: _exUnmount, showHtw: _exShowHtw, captureState: _exCaptureState, restoreState: _exRestoreState };
})();
