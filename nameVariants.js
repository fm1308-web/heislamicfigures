/* nameVariants.js — compat reader for name_variants.json
   Handles BOTH shapes transparently:
   - Legacy flat array: "F0199": ["Aisha", "Ayesha", ...]
   - New object shape:  "F0199": { spellings: [...], titles: [...] }
   Exposes window.GA_nameVariants with 4 methods. */
(function(){
  function _entry(slug){
    var nv = window._NAME_VARIANTS;
    if(!nv || !slug) return null;
    return nv[slug] || null;
  }
  function getSpellings(slug){
    var e = _entry(slug);
    if(!e) return [];
    if(Array.isArray(e)) return e.slice();
    if(e && Array.isArray(e.spellings)) return e.spellings.slice();
    return [];
  }
  function getTitles(slug){
    var e = _entry(slug);
    if(!e) return [];
    if(Array.isArray(e)) return [];
    if(e && Array.isArray(e.titles)) return e.titles.slice();
    return [];
  }
  function getAllForSearch(slug){
    return getSpellings(slug);
  }
  function getAllForResolve(slug){
    var e = _entry(slug);
    if(!e) return [];
    if(Array.isArray(e)) return e.slice();
    var out = [];
    if(Array.isArray(e.spellings)) out = out.concat(e.spellings);
    if(Array.isArray(e.titles)) out = out.concat(e.titles);
    return out;
  }
  window.GA_nameVariants = {
    getSpellings: getSpellings,
    getTitles: getTitles,
    getAllForSearch: getAllForSearch,
    getAllForResolve: getAllForResolve
  };
})();
