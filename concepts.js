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
function loadHadithTags(cb){     _fetchOnce('hadithByKey',    'concept_tags_hadith_wordmatch.json',cb || function(){}); }
function loadHadithReverse(cb){  _fetchOnce('hadithByConcept','concept_reverse_hadith_wordmatch.json',cb || function(){}); }
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

// Look up concepts for a hadith. Handles two shapes:
//   flat:   { "sahih-bukhari-1": [slug,...] }
//   nested: { "sahih-bukhari": { "1": [slug,...] } }
function getForHadith(coll, num){
  if(!CACHE.hadithByKey) return [];
  var d = CACHE.hadithByKey;
  var raw = d[coll + '-' + num];
  if(!raw && d[coll] && typeof d[coll] === 'object'){ raw = d[coll][num]; }
  if(!raw) return [];
  if(!Array.isArray(raw)) return [];
  return raw.map(function(item){
    if(typeof item === 'string') return { slug: item };
    return { slug: item.slug || item.id || item.concept };
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
