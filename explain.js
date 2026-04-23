// ═══════════════════════════════════════════════════════════
// EXPLAIN VIEW — Tafsir Library
// Mounted as #explain route. Mirrors the data shape of
// DIVE_TAFSIR_REGISTRY (from dive.js); the registry is inlined
// here so load order doesn't matter.
// ═══════════════════════════════════════════════════════════

var _exInited = false;

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

// State
var _exState = {
  edition: null,
  surah: 0,
  verse: 0,
  pendingScrollVerse: null,
  loadedSurahData: null,
  fileCache: {}
};

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
  return fetch('data/islamic/tafsir/' + tafsirId + '/surah-' + pad + '.json')
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
  var h = '<div class="ex-blank-intro">Select a tafsir to begin. ' + EX_TAFSIR_REGISTRY.length + ' editions across ' + EX_WORKS.length + ' works.</div>';
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
  h += '  <div class="ex-reader-head-main">';
  h += '    <h2 class="ex-reader-title">' + _exEsc(ed.work) + '</h2>';
  h += '    <div class="ex-reader-meta">' + _exAuthorLink(ed) + ' · ' + _exEsc(EX_TRADITION_NAMES[ed.tradition] || ed.tradition) + (ed.partial ? ' · <span class="ex-amber">partial coverage</span>' : '') + '</div>';
  h += '    <div class="ex-edition-pills">';
  var pillLangs = EX_LANG_ORDER.filter(function(L){ return workEds.some(function(e){ return e.lang === L; }); });
  pillLangs.forEach(function(L){
    var e = workEds.find(function(x){ return x.lang === L; });
    var active = e.id === ed.id ? ' active' : '';
    h += '<button class="ex-edition-pill' + active + '" data-edition="' + e.id + '">' + L + '</button>';
  });
  h += '    </div>';
  h += '  </div>';
  h += '  <button class="ex-close-btn" id="ex-closeReader" title="Back to library">×</button>';
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

    h += '<div class="ex-tafsir-card" id="ex-tc-' + start + '" data-start="' + start + '" data-end="' + end + '">';
    h += '  <div class="ex-c-head">' + headLabel + '</div>';
    h += '  <div class="' + bodyClass + '">' + _exEsc(e.text) + '</div>';
    h += '  <div class="ex-chip-row">';
    h += '    <a class="ex-chip" href="javascript:void(0)" onclick="_exJumpToStart(' + _exState.surah + ',' + start + ');return false;">' + chipLabel + '</a>';
    h += '  </div>';
    h += '</div>';
  });
  cardArea.innerHTML = h || '<div class="ex-loading">No entries for this surah.</div>';

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
    var jumpTo = _exState.pendingScrollVerse;
    _exState.pendingScrollVerse = null;
    setTimeout(function(){ _exScrollToVerse(jumpTo); }, 50);
  } else if(_exState.verse){
    setTimeout(function(){ _exScrollToVerse(_exState.verse); }, 50);
  }
}

function _exScrollToVerse(v){
  var container = document.getElementById('explain-view');
  if(!container) return;
  var cards = container.querySelectorAll('.ex-tafsir-card');
  var target = null;
  for(var i=0;i<cards.length;i++){
    var s = parseInt(cards[i].getAttribute('data-start'), 10);
    var e = parseInt(cards[i].getAttribute('data-end'), 10);
    if(v >= s && v <= e){ target = cards[i]; break; }
  }
  if(!target) return;
  target.scrollIntoView({ behavior:'smooth', block:'start' });
  target.classList.add('pulse');
  setTimeout(function(){ target.classList.remove('pulse'); }, 1600);
}

// Invoked by verse-chip onclick in an entry card
window._exJumpToStart = function(s, v){
  location.hash = '#start';
  if(typeof window.setView === 'function') window.setView('start');
  setTimeout(function(){
    if(typeof window.openStartAtVerse === 'function') window.openStartAtVerse(s, v, v);
  }, 120);
};

// Open a tafsir deep-link: called by _exApplyHash and by external _dvOpenExplain
function _exOpenTafsir(id, surah, verse){
  var ed = EX_TAFSIR_REGISTRY.find(function(t){ return t.id === id; });
  if(!ed) { _exRenderBlank(); return; }
  // Respect language filter if it's set to something other than this edition's lang
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

// Hash format: #explain?tafsir=<id>&surah=N&verse=X
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

// Populate filters and wire events (one-time)
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

  var css =
    '#explain-view{display:flex;flex-direction:column;flex:1;width:100%;height:100%;overflow:hidden;background:#0e1420;color:#ccc;font-family:Georgia,serif}' +
    '#explain-view *{box-sizing:border-box}' +
    '#explain-view .ex-hdr{flex-shrink:0;background:#0a1018;border-bottom:1px solid #2a3344;padding:12px 22px;display:flex;flex-direction:column;gap:10px}' +
    '#explain-view .ex-top-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}' +
    '#explain-view .ex-h1{font-family:\'Cinzel\',serif;font-weight:600;font-size:20px;letter-spacing:.08em;color:#D4AF37;margin:0}' +
    '#explain-view .ex-filter-row{display:flex;align-items:center;gap:12px;flex-wrap:wrap}' +
    '#explain-view .ex-filter-row label{display:flex;align-items:center;gap:6px;font-family:\'Cinzel\',serif;letter-spacing:.08em;font-size:11px;color:#6B7B8C;text-transform:uppercase}' +
    '#explain-view .ex-filter-row select{background:#151d2b;color:#ccc;border:1px solid #2a3344;padding:6px 10px;font-family:Georgia,serif;font-size:13px;border-radius:3px;text-transform:none;letter-spacing:normal}' +
    '#explain-view .ex-filter-row select:hover,#explain-view .ex-filter-row select:focus{border-color:#D4AF37;outline:none}' +
    '#explain-view .ex-filter-row select:disabled{opacity:.4;cursor:not-allowed}' +
    '#explain-view .ex-body{flex:1;overflow-y:auto}' +
    '#explain-view .ex-main{max-width:1200px;margin:0 auto;padding:30px 20px 80px}' +
    '#explain-view .ex-blank-intro{text-align:center;color:#6B7B8C;font-size:14px;margin:20px 0 24px;font-style:italic}' +
    '#explain-view .ex-work-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px}' +
    '#explain-view .ex-work-card{background:#151d2b;border:1px solid #2a3344;border-radius:6px;padding:16px 16px 14px;cursor:pointer;transition:border-color .15s;display:flex;flex-direction:column;gap:8px;position:relative;min-height:150px}' +
    '#explain-view .ex-work-card:hover{border-color:#D4AF37}' +
    '#explain-view .ex-w-title{font-family:\'Cinzel\',serif;color:#D4AF37;font-size:15px;letter-spacing:.06em;margin:0;line-height:1.3;padding-right:80px}' +
    '#explain-view .ex-w-author{color:#6B7B8C;font-size:12px;margin:0;font-style:italic}' +
    '#explain-view .ex-w-author a{color:inherit;text-decoration:underline}' +
    '#explain-view .ex-w-author a:hover{color:#D4AF37}' +
    '#explain-view .ex-w-langs{display:flex;flex-wrap:wrap;gap:4px}' +
    '#explain-view .ex-w-tradition-row{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:8px}' +
    '#explain-view .ex-lang-badge{font-family:\'Cinzel\',serif;letter-spacing:.08em;font-size:10px;color:#D4AF37;border:1px solid #D4AF37;padding:2px 7px;border-radius:2px}' +
    '#explain-view .ex-trad-badge{font-family:\'Cinzel\',serif;letter-spacing:.08em;font-size:10px;color:#6B7B8C;border:1px solid #6B7B8C;padding:2px 7px;border-radius:2px;text-transform:uppercase}' +
    '#explain-view .ex-partial-badge{position:absolute;top:12px;right:12px;font-family:\'Cinzel\',serif;letter-spacing:.06em;font-size:10px;color:#E0A960;border:1px solid #E0A960;background:rgba(212,175,55,0.10);padding:2px 7px;border-radius:2px;text-transform:uppercase}' +
    '#explain-view .ex-reader-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;border-bottom:1px solid #2a3344;padding-bottom:14px;margin-bottom:22px;flex-wrap:wrap}' +
    '#explain-view .ex-reader-head-main{flex:1 1 400px}' +
    '#explain-view .ex-reader-title{font-family:\'Cinzel\',serif;color:#D4AF37;font-size:19px;letter-spacing:.06em;margin:0}' +
    '#explain-view .ex-reader-meta{color:#6B7B8C;font-size:13px;margin-top:4px;font-style:italic}' +
    '#explain-view .ex-reader-meta a{color:inherit;text-decoration:underline}' +
    '#explain-view .ex-reader-meta a:hover{color:#D4AF37}' +
    '#explain-view .ex-amber{color:#E0A960}' +
    '#explain-view .ex-edition-pills{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}' +
    '#explain-view .ex-edition-pill{background:#151d2b;color:#D4AF37;border:1px solid #D4AF37;padding:4px 10px;font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.06em;text-transform:uppercase;border-radius:3px;cursor:pointer;line-height:1.3}' +
    '#explain-view .ex-edition-pill:hover{background:#1f2a3d}' +
    '#explain-view .ex-edition-pill.active{background:#D4AF37;color:#0e1420}' +
    '#explain-view .ex-close-btn{background:none;border:1px solid #555;color:#888;cursor:pointer;width:32px;height:32px;border-radius:50%;font-size:18px;line-height:1;padding:0;flex:0 0 auto}' +
    '#explain-view .ex-close-btn:hover{border-color:#D4AF37;color:#D4AF37}' +
    '#explain-view .ex-tafsir-card{background:#151d2b;border:1px solid #2a3344;border-radius:4px;margin:0 0 16px;padding:14px 18px;scroll-margin-top:140px}' +
    '#explain-view .ex-tafsir-card.pulse{animation:ex-pulse 1.5s ease-out}' +
    '@keyframes ex-pulse{0%{box-shadow:0 0 0 2px #D4AF37,0 0 30px rgba(212,175,55,.5);background:rgba(212,175,55,.10)}100%{box-shadow:0 0 0 0 transparent,0 0 0 transparent;background:#151d2b}}' +
    '#explain-view .ex-c-head{font-family:\'Cinzel\',serif;color:#D4AF37;font-size:12px;letter-spacing:.1em;margin:0 0 8px;padding-bottom:6px;border-bottom:1px dashed #2a3344}' +
    '#explain-view .ex-c-body-en{font-family:Georgia,serif;font-size:16px;line-height:1.65;color:#ccc;white-space:pre-wrap}' +
    '#explain-view .ex-c-body-ar{font-family:\'Noto Naskh Arabic\',\'Amiri\',serif;font-size:22px;line-height:2;color:#eee;direction:rtl;text-align:right;white-space:pre-wrap}' +
    '#explain-view .ex-c-body-ur{font-family:\'Noto Nastaliq Urdu\',\'Noto Naskh Arabic\',serif;font-size:22px;line-height:2;color:#eee;direction:rtl;text-align:right;white-space:pre-wrap}' +
    '#explain-view .ex-chip-row{margin-top:12px;padding-top:10px;border-top:1px dashed #2a3344;display:flex;flex-wrap:wrap;gap:8px}' +
    '#explain-view .ex-chip{background:#1a2434;color:#D4AF37;border:1px solid #D4AF37;font-family:\'Cinzel\',serif;letter-spacing:.06em;font-size:11px;padding:3px 10px;border-radius:3px;cursor:pointer;text-decoration:none}' +
    '#explain-view .ex-chip:hover{background:#D4AF37;color:#0e1420}' +
    '#explain-view .ex-loading{text-align:center;padding:60px;color:#6B7B8C}';

  container.innerHTML =
    '<style>' + css + '</style>' +
    '<div class="ex-hdr">' +
      '<div class="ex-top-row">' +
        '<h1 class="ex-h1">EXPLAIN — Tafsir Library</h1>' +
      '</div>' +
      '<div class="ex-filter-row">' +
        '<label>Language <select id="ex-langSel"></select></label>' +
        '<label>Tradition <select id="ex-tradSel"></select></label>' +
        '<label>Author <select id="ex-authorSel"></select></label>' +
        '<label>Surah <select id="ex-surahSel"></select></label>' +
        '<label>Verse <select id="ex-verseSel" disabled></select></label>' +
      '</div>' +
    '</div>' +
    '<div class="ex-body">' +
      '<div class="ex-main" id="ex-main"></div>' +
    '</div>';

  _exPopulateFilters();
  _exWireFilters();
}

// ═══════════════════════════════════════════════════════════
// SETVIEW INTEGRATION — same pattern as start.js
// ═══════════════════════════════════════════════════════════
(function(){
  var _origSV = window.setView;
  if(!_origSV) return;
  window.setView = function(v){
    var ev = document.getElementById('explain-view');
    if(v !== 'explain'){
      if(ev) ev.style.display = 'none';
    }
    _origSV(v);
    if(v === 'explain'){
      ['leftPanel','silsilaView','mapView','studyRoomView',
       'follow-view','events-view','eras-view','think-view','one-view',
       'talk-view','books-view','monastic-view','updates-view','start-view'].forEach(function(id){
        var el = document.getElementById(id); if(el) el.style.display = 'none';
      });
      var ip = document.getElementById('infoPanel'); if(ip) ip.style.display = 'none';
      var cs = document.getElementById('centScrollStrip'); if(cs) cs.style.display = 'none';
      if(ev) ev.style.display = 'flex';
      initExplain();
    }
  };
})();
