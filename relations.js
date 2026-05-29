(function(){
'use strict';

var ROOT = null;
var ACTIVE_CAT = null;     // current category slug (single, across both strips)
var ACTIVE_BLOCK = null;   // slug of the currently expanded figure block
var ACTIVE_NODE = null;    // { blockSlug, nodeKind } — derived from DRILL[0] via syncLegacy()
var ROW_EXPANDED = false;  // true when the row "More ▾" tile is clicked to show all figures
var DRILL = [];            // drill stack: [{ slug, kind }] — kind null until a node is picked
var CHAIN_TO_PROPHET = null;   // { arees_slug: [arees_slug, ...] } from RV's chains object
var CHAIN_STATE = 'idle';      // idle | loading | ready | error
var CORESLUG_TO_AREES = null;  // core slug -> arees slug (built once from AREES figures)
var AREES_BY_AREESSLUG = null; // arees slug -> arees figure (display lookup)

// Per-source data + state, lazy-loaded on first use.
var AREES  = null; var AREES_STATE  = 'idle';  // 'idle' | 'loading' | 'ready' | 'error'
var AREES_BY_ID = null;        // arees_id -> arees figure
var CORE2AREES  = null;        // core slug -> arees slug (strong matches only)
var AREES2CORE  = null;        // arees slug -> core slug (strong matches only)
var MATCHES = null; var MATCHES_STATE = 'idle';
var CORE   = null; var CORE_STATE   = 'idle';
var ENRICH = null; var ENRICH_STATE = 'idle';  // map keyed by core_slug (F-NNNN)

var R2_BASE    = 'https://gold-ark-data.hooman-92b.workers.dev/data/islamic/';
var AREES_URL  = R2_BASE + 'arees/arees_figures.json';
var MATCHES_URL = R2_BASE + 'arees/arees_to_core_matches.json';
var CORE_URL   = R2_BASE + 'core.json';
var ENRICH_URL_R2    = R2_BASE + 'arees/arees_enrichment.json';
var CHAIN_URL  = R2_BASE + 'arees/arees_chain_to_prophet.json';
var ENRICH_URL_LOCAL = '/data/islamic/arees_enrichment.json';

// ── matcher helpers ──
function _label(f){ return (f && f.generation_label) ? String(f.generation_label) : ''; }
function _startsWith(f, prefix){ return _label(f).indexOf(prefix) === 0; }
function _coreYear(f){
  var d = (f && typeof f.dod === 'number') ? f.dod : parseInt(f && f.dod, 10);
  return isNaN(d) ? null : d;
}

// Total narrations across all books (narrations is a list of {book,count,url}).
function narrationTotal(f){
  if(!f || !Array.isArray(f.narrations)) return 0;
  var n = 0;
  for(var i=0;i<f.narrations.length;i++){
    var c = f.narrations[i] && f.narrations[i].count;
    if(typeof c === 'number') n += c;
  }
  return n;
}

// Extract a clean year from the verbose Arees death string, e.g.
// "11 AH/632 CE (12th Rabi' awwal (Medina)[ Natural ]" -> "632 CE".
function trimYear(s){
  if(!s) return '';
  var str = String(s);
  var m = str.match(/(\d+)\s*CE/);
  if(m) return m[1] + ' CE';
  m = str.match(/(\d+)\s*AH/);
  if(m) return m[1] + ' AH';
  return '';
}

// Category strips. source: 'arees' (default) or 'core'. Slugs are unique across all groups.
// NOTE: Companions/Followers/Successors use the generation_label prefix (the data has
// no generation_number === 3, so a numeric matcher would zero out Successors).
// Helper — checks both singular f.type and plural f.types[] for a value.
function _hasType(f, t){
  if(!f) return false;
  if(f.type === t) return true;
  if(Array.isArray(f.types)){
    for(var i=0;i<f.types.length;i++){ if(f.types[i] === t) return true; }
  }
  return false;
}

// TEMP allowlist — these 13 figures are part of the Adam→Muhammad chain
// but tagged only as "Founder" in core.json (data fix queued for RV).
// Once RV adds "Lineage of Prophet" to their types[], this allowlist can be removed.
var LINEAGE_ALLOWLIST = {
  'F1304':1,  // Shith ibn Adam
  'F1264':1,  // Sam ibn Nuh
  'F1654':1,  // Yashjub ibn Nabit
  'F1644':1,  // Ya'rub ibn Yashjub
  'F1373':1,  // Tayrah ibn Ya'rub
  'F1099':1,  // Nahur ibn Tayrah
  'F1070':1,  // Muqawwam ibn Nahur
  'F1414':1,  // Udd ibn Muqawwam
  'F0178':1,  // Adnan
  'F0603':1,  // Fihr ibn Malik
  'F0671':1,  // Hashim ibn Abd Manaf
  'F0008':1,  // Abd al-Muttalib ibn Hashim
  'F1158':1,  // Qusayy ibn Kilab
  'F0079':1   // Abdullah ibn Abd al-Muttalib — Prophet's father
};

var CAT_GROUPS = [
  { key:'gen', label:'Generation', expanded:false, cats:[
    { slug:'prophets', label:'Prophets', sub:'25 Quranic Prophets', source:'core',
      match:function(f){ return _hasType(f, 'Prophet'); } },
    { slug:'full-lineage', label:'Full Lineage', sub:'Adam → Muhammad chain', source:'core',
      match:function(f){
        return _hasType(f, 'Prophet')
            || _hasType(f, 'Lineage of Prophet')
            || !!LINEAGE_ALLOWLIST[f.slug];
      }
    }
  ]}
];

// Flat lookups, built once.
var CAT_BY_SLUG = {};
var GROUP_BY_KEY = {};
(function(){
  for(var g=0; g<CAT_GROUPS.length; g++){
    GROUP_BY_KEY[CAT_GROUPS[g].key] = CAT_GROUPS[g];
    var cats = CAT_GROUPS[g].cats;
    for(var i=0; i<cats.length; i++){ CAT_BY_SLUG[cats[i].slug] = cats[i]; }
  }
})();

function mount(zoneC, zoneB){
  ROOT = zoneC;
  ensureSource('arees');
  ensureSource('core');           // make sure CORE is loaded for search
  ensureMatches();
  ensureChain();                  // load shortest-path chains to Prophet
  render();

  if(!window._rlResizeBound){
    window._rlResizeBound = true;
    window.addEventListener('resize', function(){
      try { drawConnectors(); } catch(e){}
    });
  }

  // Wire the shell's top search bar to drill into figures by name.
  bindTopSearch();
}

// Load the teaching-chain-to-Prophet index (shortest paths).
function ensureChain(){
  if(CHAIN_TO_PROPHET || CHAIN_STATE === 'loading') return;
  CHAIN_STATE = 'loading';
  fetch(CHAIN_URL)
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(d){
      // RV's file shape: { prophet_slug, chains: { arees_slug: [path...] }, unreachable_slugs: [] }
      CHAIN_TO_PROPHET = (d && d.chains) ? d.chains : (d || {});
      CHAIN_STATE = 'ready';
      console.log('[relations] chain-to-prophet loaded:', Object.keys(CHAIN_TO_PROPHET).length, 'figures');
      buildAreesBridge();
    })
    .catch(function(e){ console.error('[relations] chain load failed', e); CHAIN_STATE = 'error'; });
}

// Build the bridge between core slugs and arees slugs using AREES figures'
// linked_core_slug field. Also indexes arees figures by their arees slug for
// fast display lookup when walking a chain.
function buildAreesBridge(){
  if(!CORESLUG_TO_AREES) CORESLUG_TO_AREES = {};
  if(!AREES_BY_AREESSLUG) AREES_BY_AREESSLUG = {};

  // Index Arees figures by their arees slug for display walking.
  if(Array.isArray(AREES)){
    for(var i=0; i<AREES.length; i++){
      var a = AREES[i];
      var asl = a.arees_slug || a.slug;
      if(asl && !AREES_BY_AREESSLUG[asl]){ AREES_BY_AREESSLUG[asl] = a; }
      var cs = a.linked_core_slug;
      if(cs && asl && !CORESLUG_TO_AREES[cs]){ CORESLUG_TO_AREES[cs] = asl; }
    }
  }

  // Authoritative bridge file from RV — 392 core ↔ arees pairs.
  // Shape: { version, count, lookup: { coreSlug: areesSlug }, detail: {...} }
  if(!window._rlBridgeLoaded){
    window._rlBridgeLoaded = true;
    fetch(R2_BASE + 'arees/core_to_arees_slug.json')
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(file){
        var lookup = (file && file.lookup) ? file.lookup : file;
        if(!lookup || typeof lookup !== 'object') return;
        var added = 0;
        for(var k in lookup){
          if(!CORESLUG_TO_AREES[k]){ CORESLUG_TO_AREES[k] = lookup[k]; added++; }
          else if(CORESLUG_TO_AREES[k] !== lookup[k]){ CORESLUG_TO_AREES[k] = lookup[k]; added++; }
        }
        console.log('[relations] bridge file loaded — core→arees mappings:', Object.keys(CORESLUG_TO_AREES).length, '(+', added, 'from file)');
      })
      .catch(function(e){ console.warn('[relations] bridge file load failed:', e.message); });
  }
}

function unmount(){
  unbindTopSearch();
  if(ROOT){ ROOT.innerHTML = ''; ROOT = null; }
}

// ── lazy data loading, per source ──
function asArray(d){
  if(Array.isArray(d)) return d;
  if(d && Array.isArray(d.figures)) return d.figures;
  if(d && Array.isArray(d.people))  return d.people;
  return [];
}
function ensureSource(source){
  if(source === 'core'){
    if(CORE || CORE_STATE === 'loading') return;
    CORE_STATE = 'loading';
    fetch(CORE_URL)
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(d){ CORE = asArray(d); buildResolver(); CORE_STATE = 'ready'; render(); })
      .catch(function(e){ console.error('[relations] core load failed', e); CORE_STATE = 'error'; render(); });
  } else {
    if(AREES || AREES_STATE === 'loading') return;
    AREES_STATE = 'loading';
    fetch(AREES_URL)
      .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function(d){ AREES = asArray(d); buildAreesIndex(); AREES_STATE = 'ready'; render(); })
      .catch(function(e){ console.error('[relations] arees load failed', e); AREES_STATE = 'error'; render(); });
  }
}

// Load arees_enrichment.json once (~0.8MB). Keyed by core_slug (F-NNNN).
// Merges on top of core figures — core wins, Arees fills gaps.
function ensureEnrich(){
  if(ENRICH || ENRICH_STATE === 'loading' || ENRICH_STATE === 'error') return;
  ENRICH_STATE = 'loading';
  function processEnrich(d){
    if(Array.isArray(d)){
      var m = {};
      for(var i=0;i<d.length;i++){ var rec = d[i]; if(rec && rec.core_slug) m[rec.core_slug] = rec; }
      ENRICH = m;
    } else {
      ENRICH = d || {};
    }
    STUDENTS_OF = null;
    ENRICH_STATE = 'ready';
    console.log('[relations] enrichment loaded for', Object.keys(ENRICH).length, 'figures');
    render();
  }
  fetch(ENRICH_URL_R2)
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(processEnrich)
    .catch(function(e){
      console.warn('[relations] enrichment cloud load failed, trying local copy', e);
      fetch(ENRICH_URL_LOCAL)
        .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(processEnrich)
        .catch(function(e2){ console.error('[relations] enrichment load failed (cloud and local)', e2); ENRICH_STATE = 'error'; });
    });
}

// Build arees_id -> figure lookup once AREES is loaded.
function buildAreesIndex(){
  if(AREES_BY_ID || !AREES) return;
  AREES_BY_ID = {};
  for(var i=0;i<AREES.length;i++){
    var f = AREES[i];
    if(f && f.arees_id != null) AREES_BY_ID[f.arees_id] = f;
  }
  console.log('[relations] arees indexed:', Object.keys(AREES_BY_ID).length, 'figures');
}

// Given an Arees figure and a kind ('teacher'|'student'), return entries:
// { name, areesId|null, areesFig|null }. areesFig set only if the id resolves
// to a real Arees figure (so it can be drilled further). Nothing invented.
function areesRelEntries(af, kind){
  if(!af) return [];
  var list = (kind === 'teacher') ? af.teachers : (kind === 'student') ? af.students : null;
  if(!Array.isArray(list)) return [];
  var seen = {}, out = [];
  for(var i=0;i<list.length;i++){
    var it = list[i];
    var nm = (it && (it.name||it.english_name)) ? String(it.name||it.english_name).trim() : '';
    var id = (it && it.id != null) ? it.id : null;
    if(!nm && id == null) continue;
    var key = id != null ? ('id:'+id) : ('nm:'+_norm(nm));
    if(seen[key]) continue; seen[key]=1;
    var rf = (id != null && AREES_BY_ID) ? AREES_BY_ID[id] : null;
    out.push({ name: nm || (rf ? figEn(rf) : ''), areesId: id, areesFig: rf || null });
  }
  return out;
}

// Build the verified core<->arees bridges from STRONG matches ONLY.
// Weak/ambiguous matches are deliberately ignored (false-link risk).
function buildBridges(){
  if(CORE2AREES || !MATCHES) return;
  CORE2AREES = {}; AREES2CORE = {};
  var n = 0;
  for(var areesSlug in MATCHES){
    if(!MATCHES.hasOwnProperty(areesSlug)) continue;
    var rec = MATCHES[areesSlug];
    var s = rec && rec.strong;
    if(!s) continue;
    var coreSlug = (typeof s === 'string') ? s : (s.core_slug || null);
    if(!coreSlug) continue;
    CORE2AREES[coreSlug] = areesSlug;
    AREES2CORE[areesSlug] = coreSlug;
    n++;
  }
  console.log('[relations] strong bridges built:', n);
}

// Lazy-load the matches file once.
function ensureMatches(){
  if(MATCHES || MATCHES_STATE === 'loading' || MATCHES_STATE === 'error') return;
  MATCHES_STATE = 'loading';
  fetch(MATCHES_URL)
    .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(d){ MATCHES = d || {}; MATCHES_STATE = 'ready'; buildBridges(); render(); })
    .catch(function(e){ console.error('[relations] matches load failed', e); MATCHES_STATE = 'error'; });
}

function getEnrich(slug){
  if(!ENRICH || !slug) return null;
  return ENRICH[slug] || null;
}

// ── name → slug resolver (lazily built once CORE is ready) ──
var NAME2SLUG = null;      // norm(name) -> slug
var CORE_BY_SLUG = null;   // slug -> figure

function _norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }

function buildResolver(){
  if(NAME2SLUG || !CORE) return;
  NAME2SLUG = {}; CORE_BY_SLUG = {};
  for(var i=0;i<CORE.length;i++){
    var f = CORE[i], slug = f.slug; if(!slug) continue;
    CORE_BY_SLUG[slug] = f;
    var names = [f.famous, f.full];
    if(Array.isArray(f.titles)) names = names.concat(f.titles);
    for(var n=0;n<names.length;n++){
      var k = _norm(names[n]);
      if(k && !NAME2SLUG[k]) NAME2SLUG[k] = slug;
    }
  }
  // Fold in name_variants if the shell loaded it (bonus ~1%). Never overwrite.
  var nv = window._NAME_VARIANTS;
  if(nv){
    for(var s in nv){ if(!nv.hasOwnProperty(s)) continue;
      var e = nv[s];
      var arr = Array.isArray(e) ? e
              : [].concat(e.spellings||[], e.titles||[]);
      for(var a=0;a<arr.length;a++){
        var kk = _norm(arr[a]);
        if(kk && !NAME2SLUG[kk]) NAME2SLUG[kk] = s;
      }
    }
  }
}
function resolveName(name){
  buildResolver();
  if(!NAME2SLUG) return null;
  return NAME2SLUG[_norm(name)] || null;
}

// Reverse teacher index: who lists THIS slug as their teacher = their students.
// Built once from core teachers[] + enrichment teachers[], resolved to slugs.
// Safe: only people who already name someone as a teacher appear as that
// person's student. Nothing invented.
var STUDENTS_OF = null;   // teacherSlug -> [studentCoreFigure]
function buildReverseTeachers(){
  if(STUDENTS_OF || !CORE) return;
  buildResolver();
  STUDENTS_OF = {};
  for(var i=0;i<CORE.length;i++){
    var c = CORE[i]; if(!c || !c.slug) continue;
    var tnames = [];
    if(Array.isArray(c.teachers)) tnames = tnames.concat(c.teachers);
    var ce = getEnrich(c.slug);
    if(ce && Array.isArray(ce.teachers)) tnames = tnames.concat(ce.teachers);
    var localSeen = {};
    for(var t=0;t<tnames.length;t++){
      var tn = tnames[t];
      if(typeof tn === 'object') tn = tn.name || tn.english_name || '';
      tn = String(tn||'').trim(); if(!tn) continue;
      var tslug = resolveName(tn); if(!tslug) continue;
      if(tslug === c.slug) continue;
      if(localSeen[tslug]) continue; localSeen[tslug] = 1;
      (STUDENTS_OF[tslug] || (STUDENTS_OF[tslug] = [])).push(c);
    }
  }
}

// Companions index: all core figures typed Sahaba/Sahabiyya. Built once.
// Used ONLY for Prophet Muhammad (slug F1132), since "Companion" means
// companion of the Prophet by definition.
var COMPANIONS = null;
var PROPHET_SLUG = 'F1132';
function isSahabaType(f){
  if(!f) return false;
  if(f.type === 'Sahaba' || f.type === 'Sahabiyya') return true;
  if(Array.isArray(f.types)){
    for(var i=0;i<f.types.length;i++){
      if(f.types[i] === 'Sahaba' || f.types[i] === 'Sahabiyya') return true;
    }
  }
  return false;
}
function buildCompanions(){
  if(COMPANIONS || !CORE) return;
  COMPANIONS = [];
  for(var i=0;i<CORE.length;i++){
    var c = CORE[i];
    if(c && c.slug && c.slug !== PROPHET_SLUG && isSahabaType(c)) COMPANIONS.push(c);
  }
}

// Drive the legacy single-level flags from the DRILL stack so drawConnectors()
// and renderCategory's lock check keep working unchanged.
function syncLegacy(){
  ACTIVE_BLOCK = DRILL.length ? DRILL[0].slug : null;
  ACTIVE_NODE  = (DRILL.length && DRILL[0].kind)
    ? { blockSlug: DRILL[0].slug, nodeKind: DRILL[0].kind } : null;
}

function render(){
  if(!ROOT) return;
  ensureEnrich();

  // If a figure is locked via search-drill, show the drill chain even when
  // no category is active. Otherwise show the active category or the prompt.
  var bodyHtml;
  if(DRILL.length){
    bodyHtml = renderStep(0);
  } else if(!ACTIVE_CAT){
    bodyHtml = '<div class="rl-empty">Pick a category above to begin.</div>';
  } else {
    bodyHtml = renderCategory(ACTIVE_CAT);
  }

  var stripsHtml = '';
  for(var g=0; g<CAT_GROUPS.length; g++){
    var grp = CAT_GROUPS[g];
    stripsHtml += '<div class="rl-zone-label">' + escapeHtml(grp.label) + '</div>'
      + '<div class="rl-cat-strip">';
    for(var i=0; i<grp.cats.length; i++){
      stripsHtml += catBtn(grp.cats[i].slug, grp.cats[i].label, grp.cats[i].sub);
    }
    stripsHtml += '</div>';
  }

  ROOT.innerHTML = ''
    + '<div id="relationsView" class="active">'
    +   '<svg id="rl-lines" class="rl-lines"></svg>'
    +   '<div class="rl-canvas">'
    +     stripsHtml
    +     '<div id="rl-body">' + bodyHtml + '</div>'
    +   '</div>'
    + '</div>';

  // Wire category clicks
  var btns = ROOT.querySelectorAll('.rl-cat[data-cat]');
  for(var b=0;b<btns.length;b++){ btns[b].addEventListener('click', onCatClick); }
  // Wire More/Less toggles
  var moreBtns = ROOT.querySelectorAll('.rl-cat[data-more]');
  for(var m=0;m<moreBtns.length;m++){ moreBtns[m].addEventListener('click', onMoreClick); }
  // Wire figure-block clicks (browse pills + drill-chain ancestor pills; NOT child pills)
  var blocks = ROOT.querySelectorAll('.rl-block[data-slug]:not(.rl-child-pill)');
  for(var k=0;k<blocks.length;k++){ blocks[k].addEventListener('click', onBlockClick); }
  // Wire relation-node clicks
  var nodes = ROOT.querySelectorAll('.rl-node');
  for(var nn=0;nn<nodes.length;nn++){ nodes[nn].addEventListener('click', onNodeClick); }
  // Wire child-pill drill-down (only resolved pills carry data-slug)
  var childPills = ROOT.querySelectorAll('.rl-child-pill[data-slug]');
  for(var cp=0;cp<childPills.length;cp++){ childPills[cp].addEventListener('click', onChildPillClick); }
  // Wire leaf child-grid filter inputs (only present when >20 children)
  var childSearches = ROOT.querySelectorAll('.rl-child-search');
  for(var csi=0;csi<childSearches.length;csi++){
    childSearches[csi].addEventListener('input', function(ev){
      var q = String(ev.target.value||'').toLowerCase().trim();
      var row = ev.target.closest('.rl-row-child'); if(!row) return;
      var pills = row.querySelectorAll('.rl-child-pill');
      for(var pp=0;pp<pills.length;pp++){
        var txt = (pills[pp].textContent||'').toLowerCase();
        pills[pp].style.display = (!q || txt.indexOf(q) !== -1) ? '' : 'none';
      }
    });
  }
  // Wire drill back/collapse controls
  var backs = ROOT.querySelectorAll('.rl-drill-back[data-back]');
  for(var bk=0;bk<backs.length;bk++){ backs[bk].addEventListener('click', onBackClick); }

  // Wire row "More ▾" tile and "Show less" link
  var moreTile = ROOT.querySelector('#rl-row-more');
  if(moreTile){ moreTile.addEventListener('click', function(){ ROW_EXPANDED = true; render(); }); }
  var lessLink = ROOT.querySelector('#rl-row-less');
  if(lessLink){ lessLink.addEventListener('click', function(){ ROW_EXPANDED = false; render(); }); }

  // Recompute connectors after layout settles (flex space-between row heights finalise).
  requestAnimationFrame(drawConnectors);
}

function catBtn(slug, label, sub){
  var active = (ACTIVE_CAT === slug) ? ' rl-cat-active' : '';
  var idAttr = (ACTIVE_CAT === slug) ? ' id="rl-active-cat"' : '';
  return '<div class="rl-cat' + active + '" data-cat="' + escapeHtml(slug) + '"' + idAttr + '>'
    + escapeHtml(label)
    + '<span class="rl-ct">' + escapeHtml(sub) + '</span>'
    + '</div>';
}

function onCatClick(e){
  var slug = e.currentTarget.getAttribute('data-cat');
  if(!slug) return;
  ACTIVE_CAT = (ACTIVE_CAT === slug) ? null : slug;
  ACTIVE_BLOCK = null;  // clear expansion on category change
  ACTIVE_NODE = null;
  ROW_EXPANDED = false;
  render();
}

function onMoreClick(e){
  var key = e.currentTarget.getAttribute('data-more');
  var grp = GROUP_BY_KEY[key];
  if(grp){ grp.expanded = !grp.expanded; render(); }
}

function onBlockClick(e){
  e.stopPropagation();
  var slug = e.currentTarget.getAttribute('data-slug');
  if(!slug) return;
  // Toggle the top pill off, otherwise start a fresh drill at this figure.
  if(DRILL.length && DRILL[0].slug === slug){ DRILL = []; }
  else { DRILL = [{ slug: slug, kind: null }]; }
  syncLegacy(); render();
}

function onNodeClick(e){
  e.stopPropagation();
  var el = e.currentTarget;
  var lvl = +el.getAttribute('data-drill');
  var kind = el.getAttribute('data-kind');
  if(kind === 'narration') return;        // count only — not drillable
  if(!DRILL[lvl]) return;
  DRILL = DRILL.slice(0, lvl + 1);
  DRILL[lvl].kind = (DRILL[lvl].kind === kind) ? null : kind;  // toggle
  syncLegacy(); render();
}

function onChildPillClick(e){
  e.stopPropagation();
  var el = e.currentTarget;
  var lvl = +el.getAttribute('data-drill');
  var slug = el.getAttribute('data-slug');
  var aid  = el.getAttribute('data-arees');
  if(!slug && !aid) return;
  DRILL = DRILL.slice(0, lvl + 1);
  if(slug){ DRILL.push({ slug: slug, kind: null }); }
  else { DRILL.push({ slug: null, areesId: +aid, kind: null }); }
  syncLegacy(); render();
}

function onBackClick(e){
  e.stopPropagation();
  var i = +e.currentTarget.getAttribute('data-back');
  DRILL = DRILL.slice(0, i);
  syncLegacy(); render();
}

function renderCategory(slug){
  var cat = CAT_BY_SLUG[slug];
  if(!cat) return '<div class="rl-empty">Coming soon.</div>';

  // Will sort pool by dob ascending where applicable (oldest first).
  // Helper available throughout this function.
  function _sortByDob(arr){
    return arr.slice().sort(function(a, b){
      var ay = (typeof a.dob === 'number') ? a.dob : 9999;
      var by = (typeof b.dob === 'number') ? b.dob : 9999;
      return ay - by;
    });
  }

  var source = cat.source || 'arees';
  ensureSource(source);
  var data  = (source === 'core') ? CORE : AREES;
  var state = (source === 'core') ? CORE_STATE : AREES_STATE;

  if(state === 'error') return '<div class="rl-empty">Could not load figures. Please refresh.</div>';
  if(!data) return '<div class="rl-empty">Loading figures…</div>';

  // Drill mode: a figure is locked → render the drill chain (no browse grid / snake).
  if(ACTIVE_BLOCK){ return renderStep(0); }

  var matched = _sortByDob(data.filter(cat.match));

  // Hard rule: Full Lineage view ends at Prophet Muhammad (F1132). Nothing after.
  // Truncate while still in dob order, even if later data adds figures with a
  // later dob than the Prophet.
  if(slug === 'full-lineage'){
    var stopIdx = -1;
    for(var li=0; li<matched.length; li++){
      if(matched[li].slug === 'F1132'){ stopIdx = li; break; }
    }
    if(stopIdx !== -1){ matched = matched.slice(0, stopIdx + 1); }
  }

  var total = matched.length;
  if(total === 0){
    return '<div class="rl-empty">No figures found for ' + escapeHtml(cat.label) + '.</div>';
  }

  // For Prophets and Full Lineage: bounded chronological chains — show all,
  // no More tile, KEEP chronological order (do NOT re-sort by narrations).
  var SHOW_ALL_CATS = { 'prophets':1, 'full-lineage':1 };
  var forceShowAll  = !!SHOW_ALL_CATS[slug];

  // Rank by total narrations (desc) ONLY for non-lineage views. For Prophets
  // and Full Lineage, keep the dob-ascending order so Prophet Muhammad is the
  // last pill and the gold connector line naturally ends at him.
  if(!forceShowAll){
    matched.sort(function(a, b){ return narrationTotal(b) - narrationTotal(a); });
  }

  var LIMIT = 19;
  var showAll = forceShowAll || ROW_EXPANDED;
  var visible = showAll ? matched : matched.slice(0, LIMIT);
  var headCount;
  if(forceShowAll){
    headCount = 'all ' + total;
  } else if(showAll){
    headCount = 'all ' + total;
  } else if(total <= LIMIT){
    headCount = 'showing ' + total;
  } else {
    headCount = 'top ' + LIMIT + ' of ' + total;
  }

  var hasActive = ACTIVE_BLOCK && visible.some(function(f){ return blockSlug(f) === ACTIVE_BLOCK; });

  var html = ''
    + '<div class="rl-row' + (hasActive ? ' rl-row-has-active' : '') + '" id="rl-main-row" data-cat="' + escapeHtml(slug) + '">'
    +   '<div class="rl-row-head">'
    +     '<div class="rl-row-title">' + escapeHtml(cat.label) + ' <span class="rl-from">· ' + headCount + '</span></div>'
    + (showAll && !forceShowAll ? '<div class="rl-row-collapse" id="rl-row-less">▲ Show less</div>' : '')
    +   '</div>'
    +   '<div class="rl-row-body">';

  // Browse: rows of 4, with a full-height spacer row between rows so the snake-line
  // can U-turn through empty space. Odd rows are emitted reversed (boustrophedon)
  // so each row-end U-turn stays on a single side. data-seq preserves dob order.
  var ROW = 4;
  for(var start=0; start<visible.length; start += ROW){
    var rowItems = [];
    for(var c=0; c<ROW && (start + c) < visible.length; c++){
      rowItems.push({ f: visible[start + c], seq: start + c });
    }
    if(((start / ROW) % 2) === 1){ rowItems.reverse(); }
    for(var r=0; r<rowItems.length; r++){
      html += renderBlock(rowItems[r].f, rowItems[r].seq);
    }
    if(start + ROW < visible.length){
      html += '<div class="rl-spacer-row" aria-hidden="true"></div>';
    }
  }

  // "More ▾" tile at the end of the body if there are more figures to show.
  // Never emitted for forceShowAll categories (Prophets / Full Lineage).
  if(!ACTIVE_BLOCK && !forceShowAll && !showAll && total > LIMIT){
    var remaining = total - LIMIT;
    html += ''
      + '<div class="rl-more-tile" id="rl-row-more">'
      +   '<div class="rl-more-label">More ▾</div>'
      +   '<div class="rl-more-sub">+ ' + remaining + ' more</div>'
      + '</div>';
  }

  html += '</div></div>';
  return html;
}

// One level of the drill chain: a back control, the locked figure pill (with its
// relation-node chips), then either a deeper level (if the user drilled in) or the
// grid of child figures for the selected relation kind.
function renderStep(i){
  var step = DRILL[i]; if(!step) return '';
  buildResolver();
  var f = null;
  if(step.slug){ f = CORE_BY_SLUG ? CORE_BY_SLUG[step.slug] : null; }
  else if(step.areesId != null && AREES_BY_ID){ f = AREES_BY_ID[step.areesId]; }
  if(!f) return '';

  var html = '<div class="rl-drill-level" data-level="' + i + '">';
  html += '<div class="rl-drill-back" data-back="' + i + '">▲ ' + (i === 0 ? 'Show all' : 'Back') + '</div>';
  var connKind = (i > 0 && DRILL[i-1] && DRILL[i-1].kind) ? DRILL[i-1].kind : null;
  html += renderBlock(f, null, i, connKind);   // active pill; chips carry data-drill="i"
  if(step.kind){
    // Reserve flow space for the absolute-positioned node chips before the children.
    html += '<div class="rl-drill-gap" style="height:46px"></div>';
    if(DRILL[i+1]){
      html += renderStep(i+1);                  // drilled deeper → recurse
    } else {
      html += renderChildGrid(f, step.kind, i); // show the child pills
    }
  }
  html += '</div>';
  return html;
}

function renderChildGrid(f, kind, lvl){
  var labels = { parent:'Parents', teacher:'Teachers', student:'Students', family:'Family', sibling:'Siblings' };
  var figs = getRelationFigures(f, kind);
  // Slugs already in the drill path up to (and incl.) this level. Drilling into one
  // would loop back to an ancestor — show it, but make it non-drillable.
  var ancestors = {};
  for(var a=0; a<=lvl && a<DRILL.length; a++){ ancestors[DRILL[a].slug] = 1; }
  var body = '';
  if(!figs.length){
    body = '<div class="rl-empty" style="grid-column:1/-1;padding:20px">No ' + (labels[kind]||kind).toLowerCase() + ' recorded.</div>';
  } else {
    for(var i=0;i<figs.length;i++){
      var it = figs[i];
      if(it.slug && !ancestors[it.slug]){
        body += '<div class="rl-block rl-child-pill" data-slug="' + escapeHtml(it.slug) + '" data-drill="' + lvl + '">'
              + '<div class="rl-nm-en">' + escapeHtml(figEn(it.fig) || it.name) + '</div></div>';
      } else if(it.areesId != null && it.fig){
        body += '<div class="rl-block rl-child-pill" data-arees="' + escapeHtml(String(it.areesId)) + '" data-drill="' + lvl + '">'
              + '<div class="rl-nm-en">' + escapeHtml(figEn(it.fig) || it.name) + '</div></div>';
      } else if(it.slug){
        // Back-reference to an ancestor in the path: shown but NOT drillable (no data-slug),
        // so the existing child-pill click handler skips it and the chain can't loop.
        body += '<div class="rl-block rl-child-pill rl-backref">'
              + '<div class="rl-nm-en">' + escapeHtml(figEn(it.fig) || it.name) + '</div></div>';
      } else {
        body += '<div class="rl-block rl-child-pill rl-unlinked" data-drill="' + lvl + '">'
              + '<div class="rl-nm-en">' + escapeHtml(it.name) + '</div></div>';
      }
    }
  }
  var searchHtml = (figs.length > 20)
    ? '<div class="rl-child-search-wrap" style="padding:6px 0 10px;">'
      + '<input class="rl-child-search" type="text" placeholder="Filter ' + figs.length + ' names…" '
      + 'style="width:100%;max-width:360px;padding:8px 12px;border-radius:8px;border:1px solid rgba(255,255,255,0.18);background:rgba(0,0,0,0.25);color:#e8e8e8;font-size:14px;outline:none;">'
      + '</div>'
    : '';
  return '<div class="rl-row rl-row-child" data-parent-kind="' + escapeHtml(kind) + '">'
       + '<div class="rl-row-head"><div class="rl-row-title">'
       + '<span class="rl-row-dot rl-dot-' + escapeHtml(kind) + '"></span>'
       + escapeHtml(labels[kind]||kind) + ' <span class="rl-from">of ' + escapeHtml(figEn(f)) + '</span>'
       + '</div></div>' + searchHtml + '<div class="rl-row-body">' + body + '</div></div>';
}

// ── figure field accessors (handle both Arees and core shapes) ──
function figEn(f){ return f.english_name || f.famous || f.name || '(unnamed)'; }
function figAr(f){ return f.arabic_name || f.name_ar || f.arabicName || ''; }
function figYear(f){
  if(f.death) return trimYear(f.death);
  if(typeof f.dod === 'number') return f.dod + ' CE';
  if(f.dod){ var m = String(f.dod).match(/-?\d+/); if(m) return m[0] + ' CE'; }
  if(f.died_ce) return f.died_ce + ' CE';
  return '';
}
function blockSlug(f){ return String(f.slug || f.arees_id || figEn(f)); }

function renderBlock(f, seq, lvl, connKind){
  var en = escapeHtml(figEn(f));
  var ar = escapeHtml(figAr(f));
  var year = escapeHtml(figYear(f));
  var nt = narrationTotal(f);

  var slug = blockSlug(f);
  // Drill-chain pills (lvl provided) always render their chips; browse pills don't.
  var isActive = (lvl != null) || (ACTIVE_BLOCK === slug);
  var activeCls = isActive ? ' rl-block-active' : '';
  var isProphet = (f.type === 'Prophet') || (Array.isArray(f.types) && f.types.indexOf('Prophet') !== -1);
  var prophetCls = isProphet ? ' rl-block-prophet' : '';
  var connCls = (!isProphet && connKind) ? ' rl-conn-' + connKind : '';
  var areesCls = (f && f.arees_id != null) ? ' rl-arees' : '';

  var nodesHtml = '';
  if(isActive){
    var counts = getDummyCounts(f);
    var nodeList = [
      ['parent',    'Parents',    counts.parents],
      ['teacher',   'Teachers',   counts.teachers],
      ['student',   'Students',   counts.students],
      ['companion', 'Companions', counts.companions || 0],
      ['wife',      'Wives',      counts.wives || 0],
      ['family',    'Family',     counts.family],
      ['sibling',   'Siblings',   counts.siblings],
      ['narration', 'Narrations', counts.narrations]
    ];
    var nonZero = '';
    for(var n=0;n<nodeList.length;n++){
      if(nodeList[n][2] > 0){
        nonZero += nodeHtml(nodeList[n][0], nodeList[n][1], nodeList[n][2], lvl);
      }
    }
    if(nonZero){
      nodesHtml = '<div class="rl-nodes">' + nonZero + '</div>';
    } else {
      nodesHtml = '<div class="rl-no-relations">No connections recorded yet.</div>';
    }
  }

  return ''
    + '<div class="rl-block' + activeCls + prophetCls + connCls + areesCls + '" data-slug="' + escapeHtml(slug) + '"' + (seq != null ? ' data-seq="' + seq + '"' : '') + '>'
    +   '<div class="rl-nm-en">' + en + '</div>'
    +   (ar ? '<div class="rl-nm-ar">' + ar + '</div>' : '')
    +   (nt > 0 ? '<div class="rl-yr">' + nt.toLocaleString() + ' narrations</div>' : '')
    +   nodesHtml
    + '</div>';
}

function nodeHtml(kind, label, count, lvl){
  var L = (lvl || 0);
  var isActive = !!(DRILL[L] && DRILL[L].kind === kind);
  var activeCls = isActive ? ' rl-node-active' : '';
  return '<div class="rl-node rl-n-' + kind + activeCls + '" data-kind="' + kind + '" data-drill="' + L + '">'
    + '<span class="rl-n-label">' + label + '</span>'
    + '<span class="rl-n-count">' + count + '</span>'
    + '</div>';
}

// Relation kinds in core.json relations[] (from inspection of all 1,964 records).
var PARENT_KINDS  = { father:1, mother:1 };
var SIBLING_KINDS = { sibling:1, brother:1, sister:1, 'half-sibling':1, 'half-brother':1 };
var WIFE_KINDS    = { wife:1, husband:1, spouse:1 };
var FAMILY_KINDS  = { child:1, son:1, daughter:1, cousin:1, uncle:1, aunt:1,
                      nephew:1, niece:1, 'nephew/niece':1, 'uncle/aunt':1, grandson:1 };
// "silsila after" / "silsila before" intentionally excluded — ambiguous bucket.
var EXCLUDED_KINDS = { 'silsila after':1, 'silsila before':1 };

// Single source of truth for bucketing a relation string into a kind group.
// Parents bucket is STRICT: only an exact "father" / "mother" qualifies. Anything
// else (maternal grandfather, foster mother, wet nurse, step-father, generic
// "parent", …) falls through to Family. silsila kinds stay unbucketed.
function classifyRelationKind(relation){
  var relLower = String(relation || '').toLowerCase().trim();
  var isParent = (relLower === 'father' || relLower === 'mother');
  if(isParent)                 return 'parent';
  if(WIFE_KINDS[relLower])     return 'wife';
  if(SIBLING_KINDS[relLower])  return 'sibling';
  if(EXCLUDED_KINDS[relLower]) return null;
  return 'family';
}

function _uniqLower(items){
  var seen = {}; var n = 0;
  for(var i=0;i<items.length;i++){
    var s = items[i];
    if(!s) continue;
    if(typeof s === 'object') s = s.name || s.english_name || '';
    s = String(s).trim().toLowerCase();
    if(!s || seen[s]) continue;
    seen[s] = 1; n++;
  }
  return n;
}

function getDummyCounts(f){
  // Merged counts: core.json fields + arees_enrichment overlay (if present).
  // Core figures: parses relations[] by kind + teachers[] (name strings).
  // Arees figures: parents as "A / B" string, teachers/students as object arrays.
  var parents = [], teachers = [], students = [], family = [], siblings = [], wives = [], narrCount = 0;

  // Core relations[] — bucket by kind
  if(Array.isArray(f.relations)){
    for(var i=0;i<f.relations.length;i++){
      var r = f.relations[i]; if(!r || !r.person) continue;
      var bkt = classifyRelationKind(r.relation);
      if(bkt === 'parent')       parents.push(r.person);
      else if(bkt === 'wife')    wives.push(r.person);
      else if(bkt === 'sibling') siblings.push(r.person);
      else if(bkt === 'family')  family.push(r.person);
    }
  }
  // teachers[] — works for both shapes; _uniqLower normalises strings vs objects
  if(Array.isArray(f.teachers)){
    for(var j=0;j<f.teachers.length;j++) teachers.push(f.teachers[j]);
  }
  // Arees parents-as-string
  if(typeof f.parents === 'string' && f.parents.trim()){
    var parts = f.parents.split('/');
    for(var p=0;p<parts.length;p++){ var s = parts[p].trim(); if(s) parents.push(s); }
  } else if(Array.isArray(f.parents)){
    for(var pa=0;pa<f.parents.length;pa++) parents.push(f.parents[pa]);
  }
  if(Array.isArray(f.students)){
    for(var u=0;u<f.students.length;u++) students.push(f.students[u]);
  }
  narrCount = narrationTotal(f);
  if(f && f.arees_id != null){
    var atc = areesRelEntries(f, 'teacher'); for(var aq=0;aq<atc.length;aq++) teachers.push(atc[aq].name);
    var asc = areesRelEntries(f, 'student'); for(var aw=0;aw<asc.length;aw++) students.push(asc[aw].name);
  }

  // Arees enrichment overlay for core figures (keyed by f.slug)
  var e = getEnrich(f.slug);
  if(e){
    if(Array.isArray(e.parents))  for(var ep=0;ep<e.parents.length;ep++)  parents.push(e.parents[ep]);
    if(Array.isArray(e.teachers)) for(var et=0;et<e.teachers.length;et++) teachers.push(e.teachers[et]);
    if(Array.isArray(e.students)) for(var es=0;es<e.students.length;es++) students.push(e.students[es]);
    if(Array.isArray(e.family))   for(var ef=0;ef<e.family.length;ef++)   family.push(e.family[ef]);
    if(typeof e.narration_count === 'number' && e.narration_count > narrCount){
      narrCount = e.narration_count;
    }
  }

  // Reverse teacher link: anyone who names f as a teacher is f's student.
  if(f && f.slug){
    buildReverseTeachers();
    var rs = STUDENTS_OF && STUDENTS_OF[f.slug];
    if(rs){ for(var rsi=0;rsi<rs.length;rsi++){ students.push(figEn(rs[rsi])); } }
  }

  // Companions count — Prophet only.
  var companionsCount = 0;
  if(f && f.slug === PROPHET_SLUG){ buildCompanions(); companionsCount = COMPANIONS ? COMPANIONS.length : 0; }

  return {
    parents:    _uniqLower(parents),
    teachers:   _uniqLower(teachers),
    students:   _uniqLower(students),
    family:     _uniqLower(family),
    siblings:   _uniqLower(siblings),
    wives:      _uniqLower(wives),
    companions: companionsCount,
    narrations: narrCount
  };
}

// Deduped list of { name, slug|null, fig|null } for one relation bucket of figure f.
// Reuses the same bucketing rules as getDummyCounts. narration kind → [] (count only).
function getRelationFigures(f, kind){
  if(f && f.arees_id != null && (kind === 'teacher' || kind === 'student')){
    var aents = areesRelEntries(f, kind);
    var aout = [];
    for(var ai=0; ai<aents.length; ai++){
      var ae = aents[ai];
      aout.push({ name: ae.name, slug: null, fig: ae.areesFig, areesId: ae.areesId });
    }
    return aout;
  }
  var names = [];
  if(kind === 'teacher'){
    if(Array.isArray(f.teachers)) names = names.concat(f.teachers);
    var et = getEnrich(f.slug); if(et && Array.isArray(et.teachers)) names = names.concat(et.teachers);
  } else if(kind === 'student'){
    if(Array.isArray(f.students)) names = names.concat(f.students);
    var es = getEnrich(f.slug); if(es && Array.isArray(es.students)) names = names.concat(es.students);
  } else if(kind === 'narration'){
    return [];
  } else {
    if((kind==='parent'||kind==='sibling'||kind==='family'||kind==='wife') && Array.isArray(f.relations)){
      for(var i=0;i<f.relations.length;i++){
        var r=f.relations[i];
        if(r && r.person && classifyRelationKind(r.relation) === kind) names.push(r.person);
      }
    }
    var ee = getEnrich(f.slug);
    if(ee){
      if(kind==='parent' && typeof ee.parents==='string'){ var ps=ee.parents.split('/'); for(var p=0;p<ps.length;p++){var t=ps[p].trim(); if(t) names.push(t);} }
      else if(kind==='parent' && Array.isArray(ee.parents)) names=names.concat(ee.parents);
      else if(kind==='family' && Array.isArray(ee.family)) names=names.concat(ee.family);
    }
  }
  var seen={}, out=[];
  for(var j=0;j<names.length;j++){
    var nm=names[j]; if(typeof nm==='object') nm=nm.name||nm.english_name||'';
    nm=String(nm).trim(); if(!nm) continue;
    var key=_norm(nm); if(!key||seen[key]) continue; seen[key]=1;
    var slug=resolveName(nm);
    out.push({ name:nm, slug:slug, fig: slug?CORE_BY_SLUG[slug]:null });
  }
  if(kind === 'student' && f && f.slug){
    buildReverseTeachers();
    var rev = STUDENTS_OF && STUDENTS_OF[f.slug];
    if(rev){
      for(var rv=0;rv<rev.length;rv++){
        var rc = rev[rv]; var rnm = figEn(rc);
        var rkey = _norm(rnm); if(!rkey || seen[rkey]) continue; seen[rkey]=1;
        out.push({ name:rnm, slug:rc.slug, fig:rc });
      }
    }
  }
  if(kind === 'companion' && f && f.slug === PROPHET_SLUG){
    buildCompanions();
    if(COMPANIONS){
      for(var cv=0;cv<COMPANIONS.length;cv++){
        var cc = COMPANIONS[cv]; var cnm = figEn(cc);
        var ckey = _norm(cnm); if(!ckey || seen[ckey]) continue; seen[ckey]=1;
        out.push({ name:cnm, slug:cc.slug, fig:cc });
      }
    }
  }
  return out;
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(c){
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function drawConnectors(){
  var svg = ROOT && ROOT.querySelector('#rl-lines');
  var view = ROOT && ROOT.querySelector('#relationsView');
  if(!svg || !view) return;
  var vb = view.getBoundingClientRect();
  var scrollTop = view.scrollTop || 0;
  // The SVG must cover the FULL scrollable content height so rows below the
  // fold still get their connector segments.
  svg.setAttribute('width', view.clientWidth);
  svg.setAttribute('height', view.scrollHeight);
  svg.style.height = view.scrollHeight + 'px';
  svg.innerHTML = '';

  // ── ONE continuous gold line connecting pill edges, NEVER inside a pill ──
  // Same row: short segment from right-edge of pill A to left-edge of pill B,
  // drawn at row.cy (in the column gap only — pills are opaque rectangles, so
  // even though the path's start/end Y is pill-centre, the segment between
  // pills lives entirely in the empty gap between them).
  // Row turn: exit the row-end pill's outer edge, U-curve outside the grid,
  // enter the next row's row-end pill outer edge. Never crosses any pill.
  var mainRow = view.querySelector('#rl-main-row');
  if(mainRow && !ACTIVE_BLOCK){
    var blocks = Array.prototype.slice.call(mainRow.querySelectorAll('.rl-block[data-seq]'));
    if(blocks.length > 1){
      blocks.sort(function(a, b){ return (+a.getAttribute('data-seq')) - (+b.getAttribute('data-seq')); });
      var P = blocks.map(function(el){
        var r = el.getBoundingClientRect();
        return {
          left:   r.left   - vb.left,
          right:  r.right  - vb.left,
          cx:     r.left + r.width / 2  - vb.left,
          top:    r.top    - vb.top + scrollTop,
          bottom: r.bottom - vb.top + scrollTop,
          cy:     r.top + r.height / 2 - vb.top + scrollTop
        };
      });

      var segs = []; // each seg: { d: '...' }
      for(var i=1;i<P.length;i++){
        var a = P[i-1], b = P[i];
        if(Math.abs(a.cy - b.cy) < 5){
          // Same row. Draw from A's right edge to B's left edge (gap only).
          // If b is to the left of a (shouldn't happen in flow order), swap edges.
          var ax = (b.cx > a.cx) ? a.right : a.left;
          var bx = (b.cx > a.cx) ? b.left  : b.right;
          segs.push('M ' + ax.toFixed(1) + ' ' + a.cy.toFixed(1)
                  + ' L ' + bx.toFixed(1) + ' ' + b.cy.toFixed(1));
        } else {
          // Row turn. Determine turn side from A's column position vs row-end.
          // Find the same-row blocks of A to know who is row-end on each side.
          var aRow = []; var bRow = [];
          for(var k=0;k<P.length;k++){
            if(Math.abs(P[k].cy - a.cy) < 5) aRow.push(P[k]);
            if(Math.abs(P[k].cy - b.cy) < 5) bRow.push(P[k]);
          }
          var aRowMaxCx = -Infinity, aRowMinCx = Infinity;
          for(var k2=0;k2<aRow.length;k2++){
            if(aRow[k2].cx > aRowMaxCx) aRowMaxCx = aRow[k2].cx;
            if(aRow[k2].cx < aRowMinCx) aRowMinCx = aRow[k2].cx;
          }
          var turnRight = (a.cx >= aRowMaxCx - 1);
          // Exit edge of A on the turn side; enter edge of B on the same side.
          var edgeAx = turnRight ? a.right : a.left;
          var edgeBx = turnRight ? b.right : b.left;
          var pad    = 24;
          var outX   = turnRight ? (edgeAx + pad) : (edgeAx - pad);
          var outXb  = turnRight ? (edgeBx + pad) : (edgeBx - pad);
          // Bezier U-curve in the empty outer band.
          segs.push('M ' + edgeAx.toFixed(1) + ' ' + a.cy.toFixed(1)
                  + ' C ' + outX.toFixed(1)  + ' ' + a.cy.toFixed(1)
                  + ', ' + outXb.toFixed(1)  + ' ' + b.cy.toFixed(1)
                  + ', ' + edgeBx.toFixed(1) + ' ' + b.cy.toFixed(1));
        }
      }

      var snake = document.createElementNS('http://www.w3.org/2000/svg','path');
      snake.setAttribute('d', segs.join(' '));
      snake.setAttribute('stroke', '#D4AF37');
      snake.setAttribute('stroke-width', '1.75');
      snake.setAttribute('stroke-linecap', 'round');
      snake.setAttribute('stroke-linejoin', 'round');
      snake.setAttribute('fill', 'none');
      snake.setAttribute('opacity', '0.85');
      svg.appendChild(snake);
    }
  }

  var pairs = [];

  // Side connector: arc through the right free space from one locked pill's right
  // edge to the next locked pill's right edge. Coloured by the lower pill's kind.
  var CONN_COLOR = {
    parent:'#5a9bd4', teacher:'#5d7a8c', student:'#d97a3a',
    companion:'#5d7a8c',
    family:'#6fa86f', sibling:'#9a7ad9', narration:'#c87a9a'
  };
  for(var dl=0; dl<DRILL.length; dl++){
    var kind = DRILL[dl].kind;
    if(!kind || kind === 'narration') continue;
    var fromPill = view.querySelector('.rl-drill-level[data-level="' + dl + '"] > .rl-block-active');
    var toPill   = view.querySelector('.rl-drill-level[data-level="' + (dl+1) + '"] > .rl-block-active');
    if(fromPill && toPill) pairs.push({ from: fromPill, to: toPill, color: CONN_COLOR[kind] || '#8aa0b8' });
  }

  for(var i=0;i<pairs.length;i++){
    var p = pairs[i];
    var fb = p.from.getBoundingClientRect();
    var tb = p.to.getBoundingClientRect();
    var x1 = fb.right - vb.left;
    var y1 = fb.top + fb.height/2 - vb.top + scrollTop;
    var x2 = tb.right - vb.left;
    var y2 = tb.top + tb.height/2 - vb.top + scrollTop;
    var bulge = Math.max(x1, x2) + 40;

    var path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1)
      + ' C ' + bulge.toFixed(1) + ' ' + y1.toFixed(1)
      + ', ' + bulge.toFixed(1) + ' ' + y2.toFixed(1)
      + ', ' + x2.toFixed(1) + ' ' + y2.toFixed(1));
    path.setAttribute('stroke', p.color);
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('opacity', '0.75');
    svg.appendChild(path);

    var dot1 = document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot1.setAttribute('cx', x1); dot1.setAttribute('cy', y1);
    dot1.setAttribute('r', 3); dot1.setAttribute('fill', p.color);
    svg.appendChild(dot1);

    var dot2 = document.createElementNS('http://www.w3.org/2000/svg','circle');
    dot2.setAttribute('cx', x2); dot2.setAttribute('cy', y2);
    dot2.setAttribute('r', 3); dot2.setAttribute('fill', p.color);
    svg.appendChild(dot2);
  }
}

// ─── Top-bar search wiring ────────────────────────────────────────────
// The shell renders an #search input in Zone B. We listen for typing,
// show a dropdown of figure suggestions, and on click drill straight
// into that figure's relations.
var _searchHandler = null;
var _searchBlurHandler = null;
var _searchDocClickHandler = null;
var _searchFocusHandler = null;
var _searchKeyHandler = null;
var _searchEl = null;

function bindTopSearch(){
  var inp = document.getElementById('search');
  if(!inp) return;
  _searchEl = inp;

  _searchHandler = function(){
    var q = inp.value.trim();
    if(q.length < 2){ closeSearchDropdown(); return; }
    var hits = searchFigures(q);
    renderSearchDropdown(hits, inp);
  };
  _searchFocusHandler = function(){
    if(inp.value.trim().length >= 2){ _searchHandler(); }
  };
  _searchKeyHandler = function(e){
    if(e.key === 'Escape'){ closeSearchDropdown(); inp.blur(); }
  };
  // Close the dropdown only on outside click — NOT on input blur.
  // Input blur closes too fast for click-on-suggestion to register.
  _searchDocClickHandler = function(e){
    var dd = document.getElementById('rl-search-dd');
    if(!dd) return;
    if(dd.contains(e.target)) return;
    if(_searchEl && _searchEl.contains(e.target)) return;
    closeSearchDropdown();
  };

  inp.addEventListener('input', _searchHandler);
  inp.addEventListener('focus', _searchFocusHandler);
  inp.addEventListener('keydown', _searchKeyHandler);
  document.addEventListener('mousedown', _searchDocClickHandler, true);
}

function unbindTopSearch(){
  if(_searchDocClickHandler){
    document.removeEventListener('mousedown', _searchDocClickHandler, true);
  }
  if(!_searchEl) return;
  if(_searchHandler)      _searchEl.removeEventListener('input', _searchHandler);
  if(_searchFocusHandler) _searchEl.removeEventListener('focus', _searchFocusHandler);
  if(_searchKeyHandler)   _searchEl.removeEventListener('keydown', _searchKeyHandler);
  closeSearchDropdown();
  _searchEl = null;
  _searchHandler = _searchFocusHandler = _searchBlurHandler = _searchKeyHandler = _searchDocClickHandler = null;
}

function searchFigures(q){
  var norm = _norm(q);
  if(!norm) return [];
  var hits = [];
  // Core figures only — Arees deliberately excluded from search.
  // Arees data still powers chain-walking and deep drill-down through
  // teacher/student relations, but is too noisy for the search field
  // (25k entries, mostly minor narrators).
  if(Array.isArray(CORE)){
    for(var i=0; i<CORE.length; i++){
      var f = CORE[i];
      var en = figEn(f);
      if(_norm(en).indexOf(norm) !== -1){
        hits.push({ name: en, slug: f.slug, source: 'core', fig: f });
      }
    }
  }
  // Three-tier sort: famous figures first, then prefix matches, then alpha.
  // "Famous" = figure has narrations OR is a prophet/companion type.
  function fameScore(h){
    var f = h.fig || {};
    var n = (typeof f.narration_count === 'number') ? f.narration_count : 0;
    if(!n && f.narrations) n = f.narrations;
    var isProphet = (f.type === 'Prophet') || (Array.isArray(f.types) && f.types.indexOf('Prophet') !== -1);
    var isCompanion = (Array.isArray(f.types) && (f.types.indexOf('Sahaba') !== -1 || f.types.indexOf('Sahabiyya') !== -1));
    if(isProphet) return 1000000;
    if(isCompanion) return 500000 + n;
    return n;
  }
  hits.sort(function(a, b){
    // 1. Prefix match wins over substring match.
    var ap = _norm(a.name).indexOf(norm) === 0 ? 0 : 1;
    var bp = _norm(b.name).indexOf(norm) === 0 ? 0 : 1;
    if(ap !== bp) return ap - bp;
    // 2. Famous figures float to the top.
    var af = fameScore(a), bf = fameScore(b);
    if(af !== bf) return bf - af;
    // 3. Alphabetical fallback.
    return a.name.localeCompare(b.name);
  });
  return hits.slice(0, 50);
}

function renderSearchDropdown(hits, inp){
  closeSearchDropdown();
  var rect = inp.getBoundingClientRect();
  var dd = document.createElement('div');
  dd.id = 'rl-search-dd';
  dd.style.cssText =
    'position:fixed;left:' + Math.round(rect.left) + 'px;' +
    'top:' + Math.round(rect.bottom + 4) + 'px;' +
    'width:' + Math.round(rect.width) + 'px;' +
    'max-height:380px;overflow-y:auto;z-index:99999;' +
    'background:rgba(12,26,43,0.98);' +
    'border:1.5px solid rgba(212,175,55,0.55);' +
    'border-radius:10px;' +
    'box-shadow:0 8px 24px rgba(0,0,0,0.55);' +
    'font-family:var(--sans);' +
    'pointer-events:auto;isolation:isolate;';

  if(!hits.length){
    dd.innerHTML = '<div style="padding:14px 16px;color:rgba(255,255,255,0.55);font-size:13px;">No matches.</div>';
  } else {
    for(var i=0; i<hits.length; i++){
      var h = hits[i];
      var row = document.createElement('div');
      row.className = 'rl-search-row';
      row.style.cssText =
        'padding:10px 16px;cursor:pointer;color:#e8e8e8;font-size:13px;' +
        'border-bottom:1px solid rgba(255,255,255,0.05);display:flex;justify-content:space-between;align-items:center;gap:10px;';
      row.innerHTML = '<span>' + escapeHtml(h.name) + '</span>';
      (function(hit){
        row.addEventListener('mouseenter', function(){ row.style.background = 'rgba(212,175,55,0.10)'; });
        row.addEventListener('mouseleave', function(){ row.style.background = 'transparent'; });
        // Use mousedown so we beat the input blur. Stop propagation so the
        // dropdown-level swallow below doesn't kill our handler.
        row.addEventListener('mousedown', function(e){
          e.preventDefault();
          e.stopPropagation();
          drillIntoFigureFromSearch(hit);
        }, true);
      })(h);
      dd.appendChild(row);
    }
  }
  // Swallow pointerdown/mousedown on EMPTY parts of the dropdown only
  // (background, padding, gaps). Row handlers above already called
  // stopPropagation, so this won't reach them.
  dd.addEventListener('mousedown', function(e){
    if(e.target === dd){ e.preventDefault(); }
  });

  document.body.appendChild(dd);
}

function closeSearchDropdown(){
  var dd = document.getElementById('rl-search-dd');
  if(dd) dd.remove();
}

function drillIntoFigureFromSearch(hit){
  closeSearchDropdown();
  if(_searchEl){ _searchEl.value = ''; }

  // Ensure the Arees bridge is built (no-op if already done).
  buildAreesBridge();

  // Resolve the figure's Arees slug — that's how chains are keyed.
  var areesSlug = null;
  if(hit.fig && (hit.fig.arees_slug || hit.fig.slug)){
    // Direct hit from an Arees figure.
    var maybe = hit.fig.arees_slug || hit.fig.slug;
    if(maybe && maybe.indexOf('arees-') === 0) areesSlug = maybe;
  }
  if(!areesSlug && hit.slug && CORESLUG_TO_AREES){
    areesSlug = CORESLUG_TO_AREES[hit.slug] || null;
  }
  if(!areesSlug && hit.areesId != null){
    areesSlug = 'arees-' + hit.areesId;
  }

  // Look up the chain. RV's shape: { shortest_path: [areesSlug,...], shortest_len: N }
  // Path is oldest-first (Prophet first, searched figure last).
  // If the searched figure is not in the path's last position, we append it.
  var path = null;
  if(CHAIN_TO_PROPHET && areesSlug){
    var entry = CHAIN_TO_PROPHET[areesSlug];
    if(entry && entry.shortest_path) path = entry.shortest_path.slice();
    else if(entry && entry.path) path = entry.path.slice();
    else if(Array.isArray(entry)) path = entry.slice();

    // If the path is only intermediate hops (does not include the searched
    // figure as last element), append it.
    if(path && path.length && path[path.length - 1] !== areesSlug){
      path.push(areesSlug);
    }
  }

  DRILL = [];
  if(Array.isArray(path) && path.length >= 2){
    // Walk the chain, oldest-first. Convert each arees slug into a DRILL
    // step. Prefer the linked core figure if one exists (so we keep full
    // chip info); otherwise drop in the Arees figure.
    for(var p=0; p<path.length; p++){
      var node = path[p];
      var aSlug = (typeof node === 'string') ? node : (node && (node.slug || node.arees_slug));
      if(!aSlug) continue;
      var areesFig = AREES_BY_AREESSLUG && AREES_BY_AREESSLUG[aSlug];
      var coreSlug = areesFig && areesFig.linked_core_slug ? areesFig.linked_core_slug : null;
      var step = { kind: (p < path.length - 1 ? 'student' : null) };
      if(coreSlug){
        step.slug = coreSlug;
      } else if(areesFig && areesFig.arees_id != null){
        step.slug = null;
        step.areesId = areesFig.arees_id;
      } else {
        // Last-ditch: try the arees-N-slug numeric extraction.
        var m = String(aSlug).match(/^arees-(\d+)/);
        if(m){ step.slug = null; step.areesId = +m[1]; }
        else { step.slug = aSlug; }
      }
      DRILL.push(step);
    }
  } else {
    // No chain — drill into the figure alone.
    if(hit.slug){
      DRILL = [{ slug: hit.slug, kind: null }];
    } else if(hit.areesId != null){
      DRILL = [{ slug: null, areesId: hit.areesId, kind: null }];
    } else {
      return;
    }
  }

  ACTIVE_BLOCK = (DRILL[0] && DRILL[0].slug) || null;
  syncLegacy();
  render();

  // Scroll the LAST (searched) pill into view.
  setTimeout(function(){
    if(ROOT){
      var actives = ROOT.querySelectorAll('.rl-block-active');
      var last = actives && actives[actives.length - 1];
      if(last && last.scrollIntoView){
        last.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, 80);
}

function showHtw(){
  var existing = document.getElementById('rl-htw-modal');
  if(existing){ existing.remove(); return; }

  var html = ''
    + '<div id="rl-htw-modal" class="rl-htw-modal" role="dialog" aria-modal="true">'
    + '  <div class="rl-htw-backdrop"></div>'
    + '  <div class="rl-htw-panel">'
    + '    <button type="button" class="rl-htw-close" aria-label="Close">×</button>'
    + '    <h2>How RELATIONS Works</h2>'

    + '    <p>RELATIONS is the connecting tissue of Gold Ark. Every figure in the database '
    + '    is linked to every other figure they touched in life — by blood, by marriage, by '
    + '    teaching, by narration. This view lets you walk those connections.</p>'

    + '    <h3>Two ways in</h3>'
    + '    <ul>'
    + '      <li><strong>Search</strong> — type a name in the gold search bar at top to jump '
    + '      straight to any figure.</li>'
    + '      <li><strong>Browse</strong> — pick a category: <em>Prophets</em> (the 25 Quranic '
    + '      prophets) or <em>Full Lineage</em> (the Adam → Muhammad chain).</li>'
    + '    </ul>'

    + '    <h3>Relation kinds (colour-coded)</h3>'
    + '    <ul>'
    + '      <li><strong>Parents</strong> — biological father and mother only.</li>'
    + '      <li><strong>Teachers / Students</strong> — direct scholarly transmission.</li>'
    + '      <li><strong>Wives</strong> — spouses.</li>'
    + '      <li><strong>Companions</strong> — Sahaba / Sahabiyya (shown on the Prophet only).</li>'
    + '      <li><strong>Family</strong> — children, siblings, cousins, uncles, aunts, '
    + '      grandparents, wet nurses, foster relations.</li>'
    + '      <li><strong>Narrations</strong> — count of hadith narrations recorded for that figure.</li>'
    + '    </ul>'

    + '    <h3>Drilling deeper</h3>'
    + '    <p>Click any chip to expand that relation. Click any pill inside to drill into that '
    + '    person — their relations open below. Keep going as far as the data takes you.</p>'

    + '    <h3>A.E. — Arees Enhancement</h3>'
    + '    <p>Pills marked with a small <strong>A.E.</strong> are figures sourced from the '
    + '    Muslim Scholars Database (Arees Institute). These are mostly hadith narrators who '
    + '    do not have a full Gold Ark profile yet. They appear as underlined names — chainable '
    + '    through relations, but without their own detail page. They exist so that narrator '
    + '    chains can be traced all the way back to the Prophet without gaps.</p>'

    + '    <h3>The gold spine</h3>'
    + '    <p>The thin gold line connecting pills in Prophets and Full Lineage views is the '
    + '    chronological spine — it runs through figures in birth-date order. It never crosses '
    + '    a pill; it stays in the gaps between them.</p>'

    + '    <h3>Honest data flags</h3>'
    + '    <ul>'
    + '      <li>Unresolved or dim pills mean we know the name appears in a relation but we '
    + '      have not yet built a full profile for them.</li>'
    + '      <li>Bidirectional links (X is Y’s teacher AND Y is X’s student) are '
    + '      being built across the full corpus by our data team.</li>'
    + '      <li>We never invent. If a figure or link is missing, it is missing.</li>'
    + '    </ul>'

    + '    <h3>Sources</h3>'
    + '    <p>Core figures: Gold Ark canonical dataset (1,962 figures). Narrators: Arees '
    + '    Institute Muslim Scholars Database (25,000+). Cross-checked against classical '
    + '    biographical sources (Ibn Hisham, al-Tabari, Tahdheeb al-Tahdheeb, and others) '
    + '    for the Prophet’s immediate family.</p>'

    + '  </div>'
    + '</div>';

  var wrap = document.createElement('div');
  wrap.innerHTML = html;
  var modal = wrap.firstElementChild;
  document.body.appendChild(modal);

  function close(){ modal.remove(); }
  modal.querySelector('.rl-htw-close').addEventListener('click', close);
  modal.querySelector('.rl-htw-backdrop').addEventListener('click', close);
  document.addEventListener('keydown', function esc(e){
    if(e.key === 'Escape'){ close(); document.removeEventListener('keydown', esc); }
  });
}

window.RelationsView = { mount: mount, unmount: unmount, showHtw: showHtw };
})();
