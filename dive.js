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

var DIVE_TAFSIR_REGISTRY = [
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
];
var DIVE_LANG_FULL = {AR:"Arabic", EN:"English", UR:"Urdu", BN:"Bengali", KU:"Kurdish", RU:"Russian"};
var DIVE_LANG_ORDER = ["EN","AR","UR","BN","KU","RU"];
var DIVE_TLANG_FILTER = "";     // "" = all, else one of AR/EN/UR/BN/KU/RU

function _dvPad3(n){ return String(n).padStart ? String(n).padStart(3,"0") : ("00"+n).slice(-3); }

function _dvFetchTafsir(id, surah){
  if(!_dvTafsirCache[id]) _dvTafsirCache[id] = {};
  if(_dvTafsirCache[id][surah] !== undefined) return Promise.resolve(_dvTafsirCache[id][surah]);
  var url = "data/islamic/tafsir/"+id+"/surah-"+_dvPad3(surah)+".json";
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
  h += '<details open><summary>Transliteration</summary><div class="dv-body">'+ (translitText ? _dvEsc(translitText) : '<span class="dv-pending">— pending data —</span>') +'</div></details>';
  h += '<details><summary>Word-by-word / Root / Morphology</summary><div class="dv-body"><span class="dv-pending">— pending data —</span></div></details>';
  h += '<details><summary>Dictionary</summary><div class="dv-body"><span class="dv-pending">— pending data —</span></div></details>';
  h += '<details><summary>Tafsir (multi)</summary><div class="dv-body dv-tafsir-slot" data-loaded="0"></div></details>';
  h += '<details><summary>Translations (multi)</summary><div class="dv-body"><span class="dv-pending">— pending data —</span></div></details>';
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
  }
}, true);

// Toggle DIVE mode on/off. Called from START.
function _dvSetMode(on){
  window._stDive = !!on;
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
    if(n > 0){ chip.textContent = n + (n===1 ? " tafsir" : " tafsirs"); chip.style.display = ""; }
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
