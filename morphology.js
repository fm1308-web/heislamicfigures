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
  // Dictionary is the 2nd <details> (WBW=0, Dictionary=1, Tafsir=2, Translations=3)
  var details = card.querySelectorAll("details");
  var dictDetails = details[1];
  if(!dictDetails) return;
  dictDetails.open = true;
  var body = dictDetails.querySelector(".dv-body");
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
