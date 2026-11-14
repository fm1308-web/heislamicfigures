// ===============================================================
// concepts.js — lazy loader + helpers for concept tags
// Six JSON files on R2 under data/islamic/concepts/. Each is fetched
// once on first access and cached on window._gaConcepts.
// ===============================================================
(function(){
'use strict';

var CACHE = window._gaConcepts = window._gaConcepts || {
  quranByVerse: null,    // { "S:V": [{slug,score}, ...] }
  quranByConcept: null,  // { slug: [{surah,verse,score}, ...] }
  hadithByKey:   null,   // { "coll-num": [slug, ...] } OR { "coll": { "num": [...] } }
  hadithByConcept: null, // { slug: [{coll,num}, ...] }
  summaries: null,       // { slug: { title, summary, ... } }
  hierarchy: null,       // { tree | parents | nodes }
  _pending: {}           // in-flight fetches keyed by file
};

function _du(rel){ return (typeof window.dataUrl === 'function') ? window.dataUrl(rel) : rel; }

function _fetchOnce(key, rel, then){
  if(CACHE[key]){ then(CACHE[key]); return; }
  if(CACHE._pending[key]){ CACHE._pending[key].push(then); return; }
  CACHE._pending[key] = [then];
  fetch(_du('data/islamic/concepts/' + rel))
    .then(function(r){ return r.ok ? r.json() : null; })
    .catch(function(){ return null; })
    .then(function(j){
      CACHE[key] = j || {};
      var queue = CACHE._pending[key] || [];
      CACHE._pending[key] = null;
      queue.forEach(function(cb){ try{ cb(CACHE[key]); }catch(e){} });
    });
}

function loadQuranTags(cb){      _fetchOnce('quranByVerse',   'concept_tags_quran.json',          cb || function(){}); }
function loadQuranReverse(cb){   _fetchOnce('quranByConcept', 'concept_reverse_quran.json',       cb || function(){}); }
function loadHadithTags(cb){     _fetchOnce('hadithByKey',    'concept_tags_hadith.json',         cb || function(){}); }
function loadHadithReverse(cb){  _fetchOnce('hadithByConcept','concept_reverse_hadith.json',      cb || function(){}); }
function loadSummaries(cb){      _fetchOnce('summaries',      'concept-summaries.json',           cb || function(){}); }
function loadHierarchy(cb){      _fetchOnce('hierarchy',      'concept-hierarchy.json',           cb || function(){}); }

// Look up concepts for a single verse. Handles two possible shapes:
//   flat:   { "1:1": [{slug,score}], ... }
//   nested: { "1": { "1": [{slug,score}], ... } }
// Returns array of {slug, score} (score may be undefined if data is just a slug).
function getForVerse(surah, verse){
  if(!CACHE.quranByVerse) return [];
  var d = CACHE.quranByVerse;
  var raw = d[surah + ':' + verse];
  if(!raw && d[surah] && typeof d[surah] === 'object'){ raw = d[surah][verse]; }
  if(!raw) return [];
  if(!Array.isArray(raw)) return [];
  return raw.map(function(item){
    if(typeof item === 'string') return { slug: item };
    return { slug: item.slug || item.id || item.concept, score: item.score || item.weight };
  }).filter(function(x){ return x.slug; });
}

// Look up concepts for a hadith (14 Nov 2026 file concept_tags_hadith.json).
// Key = "<MONASTIC collection key>-<number>" (al-Kafi / al-Faqih: "<volume>.<number>").
// Each item: {s: slug, m: how made} — m: r = read one by one by AI, c = from the chapter, w = old word match.
// Any book name form (xref slug, file name, MONASTIC key) is mapped to the MONASTIC key.
var H_COLL_ALIAS = {"bukhari":"bukhari","sahih-bukhari":"bukhari","muslim":"muslim","sahih-muslim":"muslim","abudawud":"abudawud","abu-dawood":"abudawud","tirmidhi":"tirmidhi","al-tirmidhi":"tirmidhi","nasai":"nasai","sunan-nasai":"nasai","ibnmajah":"ibnmajah","ibn-e-majah":"ibnmajah","muwatta":"muwatta","muwatta-malik":"muwatta","musnad-ahmad":"musnad-ahmad","darimi":"darimi","sunan-ad-darimi":"darimi","riyad":"riyad","riyad-as-salihin":"riyad","shamail":"shamail","shamail-al-muhammadiyah":"shamail","bulugh":"bulugh","bulugh-al-maram":"bulugh","adab-mufrad":"adab-mufrad","al-adab-al-mufrad":"adab-mufrad","mishkat":"mishkat","mishkat-al-masabih":"mishkat","40-nawawi":"40-nawawi","40-hadith-nawawi":"40-nawawi","40-qudsi":"40-qudsi","40-hadith-qudsi":"40-qudsi","40-shahwaliullah":"40-shahwaliullah","40-hadith-shahwaliullah":"40-shahwaliullah","amali-mufid":"amali-mufid","al-amali-mufid":"amali-mufid","amali-saduq":"amali-saduq","al-amali-saduq":"amali-saduq","kafi":"kafi","al-kafi-volume-1-kulayni":"kafi","al-kafi-volume-2-kulayni":"kafi","al-kafi-volume-3-kulayni":"kafi","al-kafi-volume-4-kulayni":"kafi","al-kafi-volume-5-kulayni":"kafi","al-kafi-volume-6-kulayni":"kafi","al-kafi-volume-7-kulayni":"kafi","al-kafi-volume-8-kulayni":"kafi","khisal":"khisal","al-khisal-saduq":"khisal","tawhid":"tawhid","al-tawhid-saduq":"tawhid","fadail-shia":"fadail-shia","fadail-al-shia-saduq":"fadail-shia","kamal-din":"kamal-din","kamal-al-din-wa-tamam-al-nima-saduq":"kamal-din","kamil-ziyarat":"kamil-ziyarat","kamil-al-ziyarat-qummi":"kamil-ziyarat","ghayba-numani":"ghayba-numani","kitab-al-ghayba-numani":"ghayba-numani","mumin-ahwazi":"mumin-ahwazi","kitab-al-mumin-ahwazi":"mumin-ahwazi","zuhd-ahwazi":"zuhd-ahwazi","kitab-al-zuhd-ahwazi":"zuhd-ahwazi","faqih":"faqih","man-la-yahduruh-al-faqih-volume-1-saduq":"faqih","man-la-yahduruh-al-faqih-volume-2-saduq":"faqih","man-la-yahduruh-al-faqih-volume-3-saduq":"faqih","man-la-yahduruh-al-faqih-volume-4-saduq":"faqih","sunan-abi-daud":"abudawud","jami-al-tirmidhi":"tirmidhi","sunan-an-nasai":"nasai","sunan-ibn-majah":"ibnmajah"};
function getForHadith(coll, num){
  if(!CACHE.hadithByKey) return [];
  var d = CACHE.hadithByKey;
  coll = H_COLL_ALIAS[coll] || coll;
  var raw = d[coll + '-' + num];
  if(!raw || !Array.isArray(raw)) return [];
  return raw.map(function(item){
    if(typeof item === 'string') return { slug: item };
    return { slug: item.s || item.slug || item.id || item.concept, src: item.m || item.src };
  }).filter(function(x){ return x.slug; });
}

// Reverse lookups
function getVersesForConcept(slug){
  if(!CACHE.quranByConcept) return [];
  return CACHE.quranByConcept[slug] || [];
}
function getHadithsForConcept(slug){
  if(!CACHE.hadithByConcept) return [];
  return CACHE.hadithByConcept[slug] || [];
}

// Summary card data
function getSummary(slug){
  if(!CACHE.summaries) return null;
  return CACHE.summaries[slug] || null;
}

window.GoldArkConcepts = {
  loadAll: function(cb){
    var pending = 6;
    function done(){ if(--pending === 0 && cb) cb(); }
    loadQuranTags(done);
    loadQuranReverse(done);
    loadHadithTags(done);
    loadHadithReverse(done);
    loadSummaries(done);
    loadHierarchy(done);
  },
  loadQuranTags: loadQuranTags,
  loadQuranReverse: loadQuranReverse,
  loadHadithTags: loadHadithTags,
  loadHadithReverse: loadHadithReverse,
  loadSummaries: loadSummaries,
  loadHierarchy: loadHierarchy,
  getForVerse: getForVerse,
  getForHadith: getForHadith,
  getVersesForConcept: getVersesForConcept,
  getHadithsForConcept: getHadithsForConcept,
  getSummary: getSummary,
  cache: CACHE
};

// Kick off background load so chips are ready when the user lands on a view.
setTimeout(function(){ window.GoldArkConcepts.loadAll(); }, 1200);

})();
