/* ─────────────────────────────────────────────────────────────
   FINANCE view — PRIVATE Islamic-finance provenance timeline.
   window.FinanceView = { mount, unmount, showHtw }

   Demonstration-grade, UNVERIFIED data loaded verbatim from
   bv-app/data/Finance/. Nothing here is added, corrected, or
   re-sourced. Confidence badges map the data's assurance field:
     verified    -> Established (green)
     plausible   -> Illustrative (amber)
     needs_check -> Placeholder (grey)
   The word "verified" is never printed anywhere in the UI.

   Coordinate model mirrors THINK: fixed vertical gold stem at
   STEM_X, CE marks left / Hijri marks right, piecewise-linear
   _finYrToY, era bands on the right, concept-family arcs as
   cubic-bézier bulges off the stem.
   ───────────────────────────────────────────────────────────── */

// Standalone-only stub: define window.openStartAtVerse ONLY if the real app hasn't already,
// so the real app's Qur'an cross-link function is never overwritten.
if(typeof window.openStartAtVerse !== 'function'){
  window.openStartAtVerse = function(){ /* no-op in standalone — the app supplies the real START cross-link */ };
}

window.FinanceView = (function(){
  'use strict';

  // ── Data cache-bust version — bump this ONE constant on every data reship. ──
  var DATA_V = '17';

  // ── Layout constants (mirror THINK) ──
  var STEM_X = 500, ROW_H = 34, PAD = 30, PRESENT = 2025;   // compact single-line rows (title + chip only; detail lives in DETAILS)

  // ── Confidence mapping — NEVER print the raw assurance word ──
  var CONF = {
    verified:    { key:'est', label:'Established',  color:'#2ECC71' },
    plausible:   { key:'ill', label:'Illustrative', color:'#F59E0B' },
    needs_check: { key:'plc', label:'Placeholder',  color:'#8A94A2' }
  };
  function _conf(a){ return CONF[a] || CONF.needs_check; }
  var CONF_LABELS = ['Established','Illustrative','Placeholder'];

  var SECTS   = ['Sunni','Shia'];
  // Apostrophes here are ASCII (') to match the data's tradition_tags exactly.
  var SCHOOLS = ['Hanafi','Maliki','Shafi\'i','Hanbali','Ja\'fari'];

  var NOTICE = 'Private preview — demonstration data. Nothing here is independently checked. '
             + 'Illustrative only. Qualified Shariah-scholar review is a separate, later stage. Not certified.';

  // Era bands (same set THINK/BOOKS use); local copy so FINANCE is standalone.
  var FIN_ERAS = [
    {name:'Prophetic Era',      start:-4000, end:632,  dates:'Before 632 CE', glow:'210,170,50'},
    {name:'Rashidun',           start:632,   end:661,  dates:'632–661 CE',   glow:'60,160,90'},
    {name:'Umayyad',            start:661,   end:750,  dates:'661–750 CE',   glow:'50,180,180'},
    {name:'Abbasid Golden Age', start:750,   end:1258, dates:'750–1258 CE',  glow:'70,130,210'},
    {name:'Post-Mongol',        start:1258,  end:1500, dates:'1258–1500 CE', glow:'180,60,60'},
    {name:'Gunpowder Empires',  start:1500,  end:1800, dates:'1500–1800 CE', glow:'50,140,90'},
    {name:'Colonial & Reform',  start:1800,  end:1950, dates:'1800–1950 CE', glow:'200,150,60'},
    {name:'Contemporary',       start:1950,  end:2025, dates:'1950–Present', glow:'80,160,200'}
  ];

  var ORIGIN_YEARS = {
    'Prophetic/Companion':610, 'Prophetic':610, 'Prophetic/early fiqh':630, 'Prophetic (aqilah)':610,
    'early fiqh':750, 'medieval':1100, 'modern':1950, 'modern (classical sakk root)':1950,
    'Qur’anic':610, "Qur'anic":610, "Qur'anic (2:283)":610
  };
  function _originYear(p){
    if(ORIGIN_YEARS[p] != null) return ORIGIN_YEARS[p];
    var s = String(p||'').toLowerCase();
    if(s.indexOf('prophet')>=0 || s.indexOf('qur')>=0) return 610;
    if(s.indexOf('early fiqh')>=0) return 750;
    if(s.indexOf('medieval')>=0) return 1100;
    if(s.indexOf('modern')>=0) return 1950;
    return 900;
  }

  // ── State ──
  var D = null, _idx = {}, _entries = [];
  var WORD_COLORS = {}, CONTRACT_COLORS = {};   // data-driven term-lifeline palettes (built at load from D.terms)
  var _spineById = {};                          // crosslinks_spine edges indexed under BOTH endpoints (from/to)
  var _mounted = false, _sel = null, _docClick = null, _docKey = null;
  var _showCE = true, _showHijri = true;
  var _mode = 'home';       // home | ladder | lecture | timeline — JS-only, not stored
  var _readerCode = '';     // STANDARDS reader page: currently open standard code
  var _navStack = [];       // USUL page history for the toolbar Back button
  var _readerReturn = 'standards'; // STANDARDS reader: page to return to on Back
  var _ladSel = null;       // LADDER: id of the currently selected lineage row (hub)
  var _qSel   = null;       // HOME: id of the currently selected Qur'an-word card (hub)
  var _lecTopic = { kind:'master' };  // LECTURE: {kind:'master'} | {kind:'contract',id} | {kind:'word',id}
  var _stdSel  = null;      // STANDARDS: code of the currently selected standard row (hub)
  var _repSel  = null;      // REPORT: { idx, rec } of the open item drilled into the Details hub
  var _repActions = {};     // REPORT: scholar traffic-light choice per open-item id ('accept'|'hold'|'refer') — session only, never persisted
  var _repCase = null;      // REPORT: the business case currently selected in the CASE dropdown (null → default D.demo_case)
  var _repFabIdx = null;    // REPORT: index into D.compliance_reports of the selected FAB per-document report (null → none)
  var _fabSel  = null;      // REPORT/FAB: index of the FAB open item drilled into the panel (null → none)
  var _liveDoc = null;      // UPLOAD: { name, pages, text } of the extracted PDF — session only, never stored/sent
  var _docHighlight = null; // UPLOAD: quote to highlight + scroll to when jumping from a report
  var _liveCase = null;     // REPORT: AI-generated live report object (session only; replaced on each run; gone on refresh)
  var _liveSeqNext = 0;     // REPORT: session counter for live-case numbering (0 → 10.70, 1 → 10.71, …); resets on refresh
  var _pipe = null;         // REPORT: tiered live-review pipeline state { doc, tier1, tier2, tier3, usage:[], error, errorTier } — session only, reset per document
  var _famOpen = new Set(); // SETTINGS: family names currently expanded (accordion)
  var _famPillar = {};      // SETTINGS: { familyName: Set of selected pillars } — empty/missing Set = show all
  var _famDDOpen = null;    // SETTINGS: family whose in-page PILLAR dropdown panel is open (survives re-render)

  // LADDER stage colours (dark/gold-friendly). Also exposed as CSS vars.
  var STAGE_COLORS = {
    quran:              '#D4AF37',  // gold
    hadith:             '#4FD1C5',  // teal
    tafsir:             '#7C93A8',  // blue-grey
    classical_fiqh:     '#B8860B',  // bronze
    modern_codification:'#9DB86B',  // green-gold
    current_status:     '#C36A6A'   // muted red
  };
  function _stageName(st){
    var M = { quran:"Qur'an", hadith:'Hadith', tafsir:'Tafsir', classical_fiqh:'Classical fiqh',
      modern_codification:'Modern codification', current_status:'Current status',
      evidentiary_tier:'Evidence tier', cross_reference:'Cross-reference', structural_note:'Structural note',
      master_timeline:'Timeline' };
    return M[st] || String(st||'').replace(/_/g,' ');
  }
  var F = {
    conf:new Set(), sect:new Set(), school:new Set(), movement:new Set(),
    show:new Set(['scholars','books','events','lineage']), contract:new Set(), concepts:new Set(), pillar:new Set(), family:new Set(), qwords:new Set()
  };

  // ── Report-vetting scope (STANDARDS settings page) — persisted to localStorage ──
  var VET = { standards:new Set(), traditions:new Set(), confidence:'all' };
  var JURIS = new Set(['J01']);
  var _jurisInit = false;
  var VET_KEY = 'finproto_vet2';   // bumped from finproto_vet: multi-regulator standards reset scope, all new standards start selected
  function _vetAllCodes(){ return ((D && D.tracker && D.tracker.rows) || []).map(function(r){ return r.code; }); }
  function _vetSave(){
    try{ localStorage.setItem(VET_KEY, JSON.stringify({
      standards:  Array.from(VET.standards),
      traditions: Array.from(VET.traditions),
      confidence: VET.confidence
    })); }catch(e){}
  }
  function _vetInit(){
    var codes = _vetAllCodes(), saved = null;
    try{ var s = localStorage.getItem(VET_KEY); saved = s ? JSON.parse(s) : null; }catch(e){ saved = null; }
    if(saved && typeof saved === 'object'){                 // restore
      VET.standards  = new Set((saved.standards || []).filter(function(c){ return codes.indexOf(c) !== -1; }));
      VET.traditions = new Set(saved.traditions || []);
      VET.confidence = saved.confidence || 'all';
    } else {                                                // defaults: every standard selected, no traditions, all confidence
      VET.standards  = new Set(codes);
      VET.traditions = new Set();
      VET.confidence = 'all';
    }
  }
  function _vetReset(){
    VET.standards  = new Set(_vetAllCodes());
    VET.traditions = new Set();
    VET.confidence = 'all';
    _vetSave();
    if(_mode === 'standards') _renderStandards();
  }
  function _stdUpdateCount(){
    var el = document.getElementById('fin-vet-count');
    if(el) el.textContent = VET.standards.size + ' of ' + ((D && D.tracker && D.tracker.rows || []).length) + ' standards selected';
  }

  // ── Archived signed-off reports — persisted to localStorage (same pattern as VET) ──
  var ARCH_KEY = 'finance_archive_v1';   // JSON array of { id, savedAt, title, meta, html }
  var _archive = [];                     // in-memory copy
  var _archOpen = null;                  // id of the archive entry currently opened, or null for the list
  function _archInit(){
    try{ var s = localStorage.getItem(ARCH_KEY); var a = s ? JSON.parse(s) : null; _archive = Array.isArray(a) ? a : []; }
    catch(e){ _archive = []; }           // missing / corrupt → empty archive
  }
  function _archSave(list){
    if(list) _archive = list;
    try{ localStorage.setItem(ARCH_KEY, JSON.stringify(_archive)); }catch(e){}
  }

  // ── Scholar determinations for the FAB compliance report — persisted to localStorage (same plain pattern) ──
  var SCH_KEY = 'finance_scholar_det_v1';   // object keyed by report_id + '::' + open-item id → { stance, rationale, scholar_name, date }
  var _schDet = {};
  function _schInit(){
    try{ var s = localStorage.getItem(SCH_KEY); var o = s ? JSON.parse(s) : null; _schDet = (o && typeof o === 'object') ? o : {}; }
    catch(e){ _schDet = {}; }               // missing / corrupt → empty
  }
  function _schSave(){ try{ localStorage.setItem(SCH_KEY, JSON.stringify(_schDet)); }catch(e){} }
  function _fabActiveReport(){
    if(_repFabIdx === 'live') return _liveCase || null;
    return (_repFabIdx !== null && D && D.compliance_reports) ? (D.compliance_reports[_repFabIdx] || null) : null;
  }
  function _schKeyFor(itemId){
    var rep = _fabActiveReport();
    var rid = (rep && rep.report_id) || 'FAB';
    return rid + '::' + itemId;
  }
  function _schGet(itemId){ return _schDet[_schKeyFor(itemId)] || null; }
  // Merge a patch into an item's determination; auto-stamp today's date the first time a stance OR rationale is saved.
  function _schUpdate(itemId, patch){
    var k = _schKeyFor(itemId);
    var cur = _schDet[k] || { stance:'', rationale:'', scholar_name:'', date:'' };
    for(var p in patch){ if(patch.hasOwnProperty(p)) cur[p] = patch[p]; }
    if(!cur.date && (cur.stance || cur.rationale)){
      var d = ''; try{ d = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); }catch(e){ d = ''; }
      cur.date = d;
    }
    _schDet[k] = cur;
    _schSave();
    return cur;
  }

  // ── Live-demo API key — persisted to localStorage (same plain pattern; NEVER logged or written to any file) ──
  var API_KEY_LS = 'finance_api_key_v1';
  function _apiKeyGet(){ try{ return localStorage.getItem(API_KEY_LS) || ''; }catch(e){ return ''; } }
  function _apiKeySave(k){ try{ if(k) localStorage.setItem(API_KEY_LS, k); else localStorage.removeItem(API_KEY_LS); }catch(e){} }
  function _apiKeyClear(){ try{ localStorage.removeItem(API_KEY_LS); }catch(e){} }

  // ── Live-run model selection — persisted (same plain pattern). Single source of truth for the model list + pricing. ──
  var API_MODEL_LS = 'finance_api_model_v1';
  var LIVE_MODELS = [
    { value:'claude-fable-5',             label:'Claude Fable 5' },
    { value:'claude-sonnet-4-6',          label:'Claude Sonnet 4.6' },
    { value:'claude-haiku-4-5-20251001',  label:'Claude Haiku 4.5' }
  ];
  var LIVE_MODEL_DEFAULT = 'claude-sonnet-4-6';
  // Price per MILLION tokens { in, out }. Claude Fable 5 pricing is unknown → intentionally absent
  // (the cost line then omits the USD figure and points to console.anthropic.com).
  var LIVE_MODEL_PRICING = {
    'claude-sonnet-4-6':          { in:3, out:15 },
    'claude-haiku-4-5-20251001':  { in:1, out:5 }
  };
  function _apiModelGet(){ try{ var m = localStorage.getItem(API_MODEL_LS); return (m && LIVE_MODELS.some(function(x){ return x.value === m; })) ? m : LIVE_MODEL_DEFAULT; }catch(e){ return LIVE_MODEL_DEFAULT; } }
  function _apiModelSave(m){ try{ if(m) localStorage.setItem(API_MODEL_LS, m); }catch(e){} }
  function _modelLabel(v){ for(var i=0;i<LIVE_MODELS.length;i++){ if(LIVE_MODELS[i].value === v) return LIVE_MODELS[i].label; } return v || ''; }
  // Map a failed test to a short plain message — NEVER echoes the key.
  function _apiPlainErr(msg, status){
    if(status === 401 || status === 403) return 'invalid key';
    if(msg) return String(msg).slice(0, 140);
    return 'error (HTTP ' + status + ')';
  }
  // TEST CONNECTION — minimal browser-direct POST to Anthropic; 200 → green, anything else → red plain error.
  function _apiTestConnection(inputEl, setStatus){
    var key = inputEl ? String(inputEl.value || '').trim() : _apiKeyGet();
    if(inputEl) _apiKeySave(key);          // persist whatever is currently typed before testing
    if(!key){ setStatus('red', 'no key entered'); return; }
    setStatus('grey', 'testing…');
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model: _apiModelGet(), max_tokens: 10, messages: [{ role:'user', content:'ping' }] })
    }).then(function(r){
      if(r.status === 200){ setStatus('green', 'Connected — live demo ready'); return; }
      return r.json().then(function(j){
        var m = (j && j.error && j.error.message) ? j.error.message : '';
        setStatus('red', _apiPlainErr(m, r.status));
      }).catch(function(){ setStatus('red', _apiPlainErr('', r.status)); });
    }).catch(function(){ setStatus('red', 'network blocked'); });
  }

  // ── Small helpers ──
  function _esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  function _du(p){ return p; }
  function _py(v){ if(v==null) return null; var m = String(v).match(/-?\d{1,4}/); return m ? parseInt(m[0],10) : null; }
  function _ceToHijri(ce){ return Math.round((ce-622)*33/32); }
  function _anyIn(set, tags){ if(!set.size) return true; for(var i=0;i<tags.length;i++){ if(set.has(tags[i])) return true; } return false; }

  // Parse a term's earliest_date_ce ("~1600s", "7th c.", "c.610 CE", "795").
  function _termYear(s){
    if(s==null) return null; s = String(s);
    var full = s.match(/\d{3,4}/); if(full) return parseInt(full[0],10);
    var cen = s.match(/(\d+)\s*(?:st|nd|rd|th)?\s*c/i); if(cen) return (parseInt(cen[1],10)-1)*100+50;
    var any = s.match(/\d+/); return any ? parseInt(any[0],10) : null;
  }

  // ── Data load — STOP if any REQUIRED file is missing / unreadable.
  //    'kafalah_v4' is OPTIONAL (richer C08 rows); everything else is REQUIRED. No old lineage.json. ──
  function _load(){
    var files = ['contracts','terms','scholars','books','events','concept_families','crosslinks','_manifest','quran_finance_layer','new_terms_T201_T214','kafalah_v4','murabaha_v4','qard_v4','musharakah_v4','mudarabah_v4','ijarah_v4','salam_v4','istisna_v4','rahn_v4','wakala_v4','quran_word_filter_map','standards_tracker','standards_kb','standards_kb_multiregulator','standards_kb_IFSB','standards_kb_star','standards_kb_new_batch_1','standards_kb_new_batch_2','standards_kb_new_batch_3','standards_kb_new_batch_4','demo_case_kafalah','demo_case_fab_offer','demo_case_fab_murabaha','demo_case_fab_indemnity','demo_case_mib_guarantee','compliance_reports_all_cases','book_quran_root','enriched_terms_all','q_to_c_map','crosslinks_spine','standards_lights','jurisdictions','tradition_index','standards_files','term_lineage_links_C02_v2'];
    // The 10 per-contract v4 files (kafalah + the 9 new) and the word map are OPTIONAL — console.warn if missing.
    // NO lineage_v4 any more: TIMELINE lineage builds ONLY from the per-contract v4 files.
    var OPTIONAL = { kafalah_v4:true, murabaha_v4:true, qard_v4:true, musharakah_v4:true, mudarabah_v4:true, ijarah_v4:true, salam_v4:true, istisna_v4:true, rahn_v4:true, wakala_v4:true, quran_word_filter_map:true, demo_case_kafalah:true, demo_case_fab_offer:true, demo_case_fab_murabaha:true, demo_case_fab_indemnity:true, demo_case_mib_guarantee:true, compliance_reports_all_cases:true, book_quran_root:true, enriched_terms_all:true, q_to_c_map:true, crosslinks_spine:true, standards_kb_star:true, standards_kb_new_batch_1:true, standards_kb_new_batch_2:true, standards_kb_new_batch_3:true, standards_kb_new_batch_4:true, standards_lights:true, jurisdictions:true, tradition_index:true, standards_files:true, term_lineage_links_C02_v2:true };
    return Promise.all(files.map(function(f){
      return fetch(window.dataUrl('data/Finance/'+f+'.json'))
        .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); })
        .then(function(j){ return { f:f, j:j }; })
        .catch(function(e){ return { f:f, err:String((e && e.message) || e) }; });
    })).then(function(res){
      var out = {}, errs = [];
      res.forEach(function(x){
        if(x.err){ if(!OPTIONAL[x.f]) errs.push(x.f+'.json ('+x.err+')'); else console.warn('[finance] optional file not loaded: '+x.f+'.json ('+x.err+')'); }
        else out[x.f] = x.j;
      });
      return errs.length ? { error: errs } : { data: out };
    });
  }

  // Report data uses a legacy standard code that differs from the live standards_lights id.
  // Map it to the live id so the chip and the reader resolve (same document, different code).
  var _STD_ALIAS = { 'CBUAE-SG': 'SG Std' };
  function _stdCode(c){ return (c && _STD_ALIAS[c]) || c || ''; }

  function _lightsToTracker(lz){
    var src = (lz && lz.standards) || [];
    var byStatus = { processed_deep_note:0, pdf_on_disk_unprocessed:0, missing:0, superseded:0 };
    var byFamily = {};
    var rows = src.map(function(r){
      var st;
      if(r.superseded_or_withdrawn === true) st = 'superseded';
      else if(r.light === 'green')           st = 'processed_deep_note';
      else if(r.have_file === 'YES')         st = 'pdf_on_disk_unprocessed';
      else                                    st = 'missing';
      if(byStatus[st] != null) byStatus[st]++;
      var fam = r.family || '—';
      byFamily[fam] = (byFamily[fam] || 0) + 1;
      return { code:r.standard_id, family:fam, regulator:r.regulator,
               title:r.title, light:r.light, status_in_project:st };
    });
    return { rows: rows, counts: { total_rows: rows.length, by_status: byStatus, by_family: byFamily } };
  }

  function _ingest(out){
    D = {
      contracts: (out.contracts && out.contracts.rows) || [],
      terms:     (out.terms && out.terms.rows) || [],
      scholars:  (out.scholars && out.scholars.rows) || [],
      books:     (out.books && out.books.rows) || [],
      events:    (out.events && out.events.rows) || [],
      families:  (out.concept_families && out.concept_families.rows) || [],
      crosslinks:(out.crosslinks) || {},
      manifest:  (out._manifest) || {},
      qlayer:    out.quran_finance_layer || null,          // whole Qur'an-word layer: rows, tiers, worked_example_qard_hasan
      tracker:   (out.standards_lights
                   ? _lightsToTracker(out.standards_lights)
                   : (out.standards_tracker || { rows:[], counts:{} })), // multi-regulator coverage board (rows + counts)
      // Deep notes = base standards_kb + the multi-regulator KB files + the RV STAR regulator drop,
      // merged into ONE notes list (the STAR file keys its entries under `rows`; tolerate either key).
      kb: [].concat(
        (out.standards_kb && out.standards_kb.notes) || [],
        (out.standards_kb_multiregulator && out.standards_kb_multiregulator.notes) || [],
        (out.standards_kb_IFSB && out.standards_kb_IFSB.notes) || [],
        (out.standards_kb_star && (out.standards_kb_star.notes || out.standards_kb_star.rows)) || [],
        (out.standards_kb_new_batch_1 && out.standards_kb_new_batch_1.notes) || [],
        (out.standards_kb_new_batch_2 && out.standards_kb_new_batch_2.notes) || [],
        (out.standards_kb_new_batch_3 && out.standards_kb_new_batch_3.notes) || [],
        (out.standards_kb_new_batch_4 && out.standards_kb_new_batch_4.notes) || []
      ),
      // OPTIONAL demo business-case document (clauses + excerpt_map). null when the file did not load.
      demo_case: out.demo_case_kafalah || null
    };
    // All successfully-loaded business cases, kafalah FIRST — the report's CASE selector reads this.
    D.demo_cases = ['demo_case_kafalah','demo_case_fab_offer','demo_case_fab_murabaha','demo_case_fab_indemnity','demo_case_mib_guarantee']
      .map(function(k){ return out[k]; }).filter(Boolean);
    // RV term-lineage links (C02 pilot) — born_at_row / status per term, verbatim citations only.
    D.lineageLinks = {};
    (((out.term_lineage_links_C02_v2 || {}).links) || []).forEach(function(L){ if(L && L.term_id) D.lineageLinks[L.term_id] = L; });
    // FAB per-document compliance reports (3) — extra CASE options, rendered separately (NOT part of D.demo_cases).
    D.compliance_reports      = (out.compliance_reports_all_cases && out.compliance_reports_all_cases.reports) || [];
    D.compliance_reports_meta = (out.compliance_reports_all_cases && out.compliance_reports_all_cases._meta) || {};
    // Read-only Settings-page "Standards coverage lights" feed. Additive; independent of D.tracker.
    D.stdLights = out.standards_lights || null;
    D.juris = (out.jurisdictions && out.jurisdictions.rows) || [];
    // Tradition index (sect/school/movement/tradition-group tags) — id -> its tradition row.
    // id = the part after '#' in each row_ref (lineage v4 row id e.g. IJ002, or scholar id e.g. S001).
    // Labels = the non-empty of sect/school/movement/tradition_app. NOTHING invented.
    D.tradIndex = out.tradition_index || null;
    D.tradFilterMap = (out.tradition_index && out.tradition_index.filter_map) || {};
    D.tradById = {};
    ((out.tradition_index && out.tradition_index.rows) || []).forEach(function(r){
      if(!r || !r.row_ref) return;
      var id = String(r.row_ref).split('#')[1];
      if(!id) return;
      var labels = [];
      [r.sect, r.school, r.movement, r.tradition_app].forEach(function(x){
        if(x && labels.indexOf(x) === -1) labels.push(x);
      });
      D.tradById[id] = { labels:labels, sect:r.sect||'', school:r.school||'',
                         movement:r.movement||'', tradition_app:r.tradition_app||'', tag:r.tag||'' };
    });
    console.log('[finance] tradition tags loaded: ' + Object.keys(D.tradById).length);
    D.stdFiles = out.standards_files || {};   // standard code -> Standards/<path> for the full-text reader
    // Qur'an-root flags for books (glow + root_tag). Whole file on D.bookQuranRoot; lookup by book id.
    D.bookQuranRoot = out.book_quran_root || null;
    D.bookQuranRootById = {};
    ((out.book_quran_root && out.book_quran_root.rows) || []).forEach(function(r){ if(r && r.book_id) D.bookQuranRootById[r.book_id] = r; });
    // Qur'an word → contract filter map (optional).
    D.quranWordMap = out.quran_word_filter_map || null;
    // Q→C map (optional) — the SOLE authority for Qur'an-word → contract origin links; never derived by verse matching.
    D.qToC = out.q_to_c_map || null;
    D.qToCById = {};
    ((out.q_to_c_map && out.q_to_c_map.rows) || []).forEach(function(r){ if(r && r.contract_id) D.qToCById[r.contract_id] = r; });
    // Crosslinks spine (605-edge relation graph). Index each edge under BOTH endpoints so a term/id lookup
    // finds every edge it participates in (as from_id or to_id). No graph drawing yet — chips only.
    D.spine = (out.crosslinks_spine && out.crosslinks_spine.edges) || [];
    _spineById = {};
    D.spine.forEach(function(e){
      if(!e) return;
      if(e.from_id){ (_spineById[e.from_id] = _spineById[e.from_id] || []).push(e); }
      if(e.to_id){   (_spineById[e.to_id]   = _spineById[e.to_id]   || []).push(e); }
    });
    // TIMELINE lineage rows come ONLY from the 10 per-contract *_v4 files (kafalah_v4 + the 9 new),
    // one contract each — NO lineage_v4 any more. Supersession is BY CONTRACT ID: each v4 file owns
    // its contract's rows outright and they don't overlap, so the loaded *_v4 files ARE the full set.
    var _mergedLineage = [];
    Object.keys(out).forEach(function(k){
      if(!/_v4$/.test(k)) return;
      var rws = out[k] && out[k].rows;
      if(rws && rws.length) _mergedLineage = _mergedLineage.concat(rws);
    });
    D.lineage    = _mergedLineage;   // LADDER reads this
    D.lineage_v4 = _mergedLineage;   // LECTURE + REPORT read this (identical v4 rows)
    // Newly-minted Qur'an-layer terms (T201–T214) join D.terms BEFORE _idx is built,
    // so they resolve in _idx.term exactly like any other term.
    if(out.new_terms_T201_T214 && out.new_terms_T201_T214.rows){
      D.terms = D.terms.concat(out.new_terms_T201_T214.rows);
    }
    // Enriched terms file (T001–T214) SUPERSEDES terms + new_terms entirely — it preserves all original
    // fields and adds an `enrichment` object per row. Missing file → concat fallback above stays in effect.
    if(out.enriched_terms_all && Array.isArray(out.enriched_terms_all.rows) && out.enriched_terms_all.rows.length){
      D.terms = out.enriched_terms_all.rows;
    }
    _idx = { scholar:{}, contract:{}, term:{}, book:{}, event:{}, family:{}, kbnote:{}, standard:{}, lineage:{} };
    (D.lineage||[]).forEach(function(r){ if(r && r.id) _idx.lineage[r.id]=r; });   // lineage rows by id (TIMELINE spine + hub)
    D.scholars.forEach(function(s){ _idx.scholar[s.id]=s; });
    D.contracts.forEach(function(c){ _idx.contract[c.id]=c; });
    D.terms.forEach(function(t){ _idx.term[t.id]=t; });
    D.books.forEach(function(b){ _idx.book[b.id]=b; });
    D.events.forEach(function(e){ _idx.event[e.id]=e; });
    D.families.forEach(function(fm){ _idx.family[fm.id]=fm; });
    D.kb.forEach(function(n){ if(n && n.id) _idx.kbnote[n.id]=n; });          // deep notes by note id
    (D.tracker.rows||[]).forEach(function(r){ if(r && r.code) _idx.standard[r.code]=r; }); // tracker rows by code
    _buildTermColorMaps();
  }

  // Data-driven term-lifeline palettes. Distinct Qur'an-word ids (t.enrichment.quran_word_ids) and
  // distinct contract codes (C## inside t.parent_contract) are each sorted and spread around the hue
  // wheel — never hard-coded. WORD_COLORS is the primary key; CONTRACT_COLORS the fallback.
  function _firstContractCode(t){ var m = String((t && t.parent_contract) || '').match(/C\d\d/); return m ? m[0] : null; }
  function _buildTermColorMaps(){
    WORD_COLORS = {}; CONTRACT_COLORS = {};
    var words = {}, contracts = {};
    (D.terms || []).forEach(function(t){
      var en = t && t.enrichment;
      (en && en.quran_word_ids || []).forEach(function(w){ if(w) words[w] = true; });
      var cc = _firstContractCode(t); if(cc) contracts[cc] = true;
    });
    var wKeys = Object.keys(words).sort(), N = wKeys.length;
    wKeys.forEach(function(w, i){ WORD_COLORS[w] = 'hsl(' + Math.round(i * 360 / N) + ', 68%, 62%)'; });
    var cKeys = Object.keys(contracts).sort(), M = cKeys.length;
    cKeys.forEach(function(c, i){ CONTRACT_COLORS[c] = 'hsl(' + Math.round(i * 360 / M) + ', 55%, 55%)'; });
  }
  function _termColor(t){
    var en = t && t.enrichment, ids = en && en.quran_word_ids;
    if(ids && ids.length && WORD_COLORS[ids[0]]) return WORD_COLORS[ids[0]];
    var cc = _firstContractCode(t);
    if(cc && CONTRACT_COLORS[cc]) return CONTRACT_COLORS[cc];
    return '#D4AF37';
  }

  // ── Cross-reference helpers ──
  function _bookAuthorId(b){
    var x = (D.crosslinks.books_to_authors && D.crosslinks.books_to_authors[b.id]) || '';
    if(x) return x;
    if(b.author_id && /^S\d+/.test(b.author_id)) return b.author_id;
    return '';
  }
  function _bookAuthorLabel(b){
    var sid = _bookAuthorId(b);
    if(sid && _idx.scholar[sid]) return _idx.scholar[sid].name;
    var m = String(b.author_id||'').match(/\(classical:\s*(.+?)\)/i);
    if(m) return '(classical: '+m[1]+')';
    return b.author_id || '';
  }
  function _sTags(s){
    var t = (s.tradition_tags||[]).slice();
    if(s.sect) t.push(s.sect);
    if(s.madhhab) t.push(s.madhhab);
    return t;
  }
  function _movementOptions(){
    var counts = {};
    D.scholars.forEach(function(s){
      (s.tradition_tags||[]).forEach(function(t){
        if(SECTS.indexOf(t)===-1 && SCHOOLS.indexOf(t)===-1) counts[t] = (counts[t]||0)+1;
      });
    });
    return Object.keys(counts).sort().map(function(k){ return { val:k, count:counts[k] }; });
  }
  function _eventsForScholar(sid){
    var out = new Set();
    var m = D.crosslinks.scholars_to_events || {};
    (m[sid]||[]).forEach(function(e){ out.add(e); });
    D.events.forEach(function(e){ if((e.linked_scholars||[]).indexOf(sid)!==-1) out.add(e.id); });
    return out;
  }
  function _booksForScholar(sid){
    var out = new Set();
    D.books.forEach(function(b){ if(_bookAuthorId(b)===sid) out.add(b.id); });
    return out;
  }
  function _termContracts(t){ return String(t.parent_contract||'').match(/C\d{2}/g) || []; }
  // Origin year for a term from t.earliest_date_ce (trimmed). STRICT: only a PLAIN YEAR ONLY
  // (a full-string match on 3 or 4 digits, nothing else) plots on the spine → returns that int.
  // Anything else ('~1600s', '8th c.', '1980s', 'modern', ranges, undated, NEEDS_VERIFICATION,
  // missing) → null. No first-number extraction, no guessing.
  function _termOriginYear(t){
    var s = t && t.earliest_date_ce;
    if(s == null) return null;
    s = String(s).trim();
    return /^\d{3,4}$/.test(s) ? parseInt(s, 10) : null;
  }
  // LATEST year for a ROUGH/period date — plots an approximate tile at the END of the stated period
  // (Adam's locked rule: end of period, NEVER earlier). Recognises ONLY these shapes (case-insensitive,
  // trimmed, ignoring a trailing "(...)" note); anything else → null. Plain years are the exact parser's
  // job; undated / NEEDS_VERIFICATION / any other text yield no year here. Never reads any other field.
  function _termLatestYear(t){
    var s = t && t.earliest_date_ce;
    if(s == null) return null;
    s = String(s).trim().replace(/\s*\([^)]*\)\s*$/, '').trim();   // drop a trailing bracket note
    var m;
    if((m = s.match(/^~\s*(\d{3,4})s$/i)))                          return parseInt(m[1], 10) + 99;   // ~1600s → 1699
    if((m = s.match(/^(\d{3,4})s\s*[-–—]\s*(\d{3,4})$/i)))          return parseInt(m[2], 10);        // 1980s-2000 → 2000
    if((m = s.match(/^(\d{3,4})s$/i)))                              return parseInt(m[1], 10) + 9;    // 1980s → 1989
    if((m = s.match(/^(\d{1,2})(?:st|nd|rd|th)\s*[-–—]\s*(\d{1,2})(?:st|nd|rd|th)\s*c\.?$/i))) return parseInt(m[2], 10) * 100; // 8th-9th c. → 900
    if((m = s.match(/^(\d{1,2})(?:st|nd|rd|th)\s*c\.?$/i)))         return parseInt(m[1], 10) * 100;  // 8th c. → 800
    return null;
  }
  function _familyContracts(fm){
    var set = new Set();
    (fm.member_terms||[]).forEach(function(tid){
      var t = _idx.term[tid]; if(!t) return;
      _termContracts(t).forEach(function(c){ set.add(c); });
    });
    return set;
  }
  function _familyLinkedIds(fm){
    var cs = _familyContracts(fm), ids = new Set();
    D.books.forEach(function(b){
      if((b.contracts_covered||[]).some(function(c){ return cs.has(c); })){ ids.add(b.id); var a=_bookAuthorId(b); if(a) ids.add(a); }
    });
    D.events.forEach(function(e){
      if((e.linked_contracts||[]).some(function(c){ return cs.has(c); })){ ids.add(e.id); (e.linked_scholars||[]).forEach(function(s){ ids.add(s); }); }
    });
    return ids;
  }
  function _familyOrigin(fm){
    var years = [];
    (fm.member_terms||[]).forEach(function(tid){
      var t = _idx.term[tid]; if(!t) return;
      var y = _termYear(t.earliest_date_ce);
      if(y!=null && y>=-4000 && y<=2100) years.push(y);
    });
    if(years.length) return { year: Math.min.apply(null, years), approx:false };
    return { year: _originYear(fm.origin_period), approx:true };
  }

  // ── Qur'an verse extraction — parse ONLY text that already exists; invent nothing ──
  function _termLabel(t){
    var en = t.term_english || '', ar = t.term_arabic || '';
    return (en && ar) ? (en + ' — ' + ar) : (en || ar || t.id);
  }
  // A "S:A" match counts as a verse ONLY if the same field also mentions "Qur".
  function _versesFromText(text, citedFor){
    var out = [];
    if(text == null) return out;
    var s = String(text);
    if(!/qur/i.test(s)) return out;
    var re = /(\d{1,3}):(\d{1,3})/g, m;
    while((m = re.exec(s))){
      out.push({ surah: parseInt(m[1],10), ayah: parseInt(m[2],10), cited_for: citedFor });
    }
    return out;
  }
  function _dedupVerses(vs){
    var seen = {}, out = [];
    vs.forEach(function(v){ var k = v.surah+':'+v.ayah; if(!seen[k]){ seen[k]=1; out.push(v); } });
    return out;
  }
  // Contracts a row touches (shared by concept-arc highlight + verse resolution).
  function _rowContracts(kind, id){
    var cs = new Set();
    if(kind==='book'){ ((_idx.book[id]||{}).contracts_covered||[]).forEach(function(c){ cs.add(c); }); }
    else if(kind==='event'){ ((_idx.event[id]||{}).linked_contracts||[]).forEach(function(c){ cs.add(c); }); }
    else if(kind==='scholar'){
      _eventsForScholar(id).forEach(function(eid){ ((_idx.event[eid]||{}).linked_contracts||[]).forEach(function(c){ cs.add(c); }); });
      _booksForScholar(id).forEach(function(bid){ ((_idx.book[bid]||{}).contracts_covered||[]).forEach(function(c){ cs.add(c); }); });
    }
    return cs;
  }
  // Concept family selected: verses from origin_period + each member term's earliest_source.
  function _familyVerses(fm){
    var vs = [];
    _versesFromText(fm.origin_period, (fm.family_name || fm.id)).forEach(function(v){ vs.push(v); });
    (fm.member_terms||[]).forEach(function(tid){
      var t = _idx.term[tid]; if(!t) return;
      _versesFromText(t.earliest_source, _termLabel(t)).forEach(function(v){ vs.push(v); });
    });
    return _dedupVerses(vs);
  }
  // Row selected: contracts it touches -> terms whose parent_contract references those -> their verses.
  function _rowVerses(kind, id){
    var cs = _rowContracts(kind, id), vs = [];
    if(!cs.size) return vs;
    D.terms.forEach(function(t){
      if(_termContracts(t).some(function(c){ return cs.has(c); })){
        _versesFromText(t.earliest_source, _termLabel(t)).forEach(function(v){ vs.push(v); });
      }
    });
    return _dedupVerses(vs);
  }
  // Open a verse in START via the existing global — navigation is NOT reimplemented here.
  // Leaving USUL for a library view: drop fullscreen cleanly first (no broken half-state).
  function _exitFullIfNeeded(){
    if(document.body.classList.contains('fin-fullscreen')){
      document.body.classList.remove('fin-fullscreen');
      document.removeEventListener('keydown', _finFsEsc);
      _syncFullBtn();
    }
  }
  function _openVerse(S, A){
    _exitFullIfNeeded();
    if(typeof window.openStartAtVerse === 'function'){ window.openStartAtVerse(S, A, A); return; }
    location.hash = '#start?surah=' + S + '&verse=' + A;
    var tabs = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="start"], [data-tab="START"], .tab-btn, .tab-start');
    for(var i=0;i<tabs.length;i++){
      var el = tabs[i];
      var txt = (el.textContent||'').trim().toUpperCase();
      var dv = el.getAttribute('data-view')||'', dt = el.getAttribute('data-tab')||'';
      if(txt==='START' || dv==='start' || dt==='START'){ el.click(); break; }
    }
  }
  // Open START with the concept banner + verse chips, jumping to verse (S,A).
  // verses: [{surah,ayah}] gathered from the data. Invents nothing.
  function _openConceptInStart(name, verses, S, A){
    _exitFullIfNeeded();
    // START's concept-pin shape (see start.js _stRenderConceptPin): {surah, verse}.
    var pinVerses = (verses||[]).map(function(v){ return { surah: v.surah, verse: v.ayah }; });
    if(typeof window.openStartConcept === 'function'){
      window.openStartConcept(name, pinVerses); return;
    }
    if(typeof window.setStartConcept === 'function'){
      window.setStartConcept(name, pinVerses);
      _openVerse(S, A); return;
    }
    // Real hook: window._stPendingPinnedVerses = { label, verses:[{surah,verse}] },
    // consumed by _stRenderConceptPin() on START init (or immediately if already mounted).
    window._stPendingPinnedVerses = { label: name, verses: pinVerses };
    if(typeof window._stRenderConceptPin === 'function' && document.getElementById('st-reader')){
      try { window._stRenderConceptPin(); } catch(e){}
    }
    _openVerse(S, A);
  }

  // ── App integration — verse & hadith deep-links ──
  // In-app detection: the real app renders inside #appShell; the standalone prototype does not.
  var IN_APP = !!document.getElementById('appShell');
  // Hadith collection label → MONASTIC xref slug (matched by substring, lowercase).
  var HADITH_SLUGS = { 'bukhari':'sahih-bukhari', 'muslim':'sahih-muslim', 'abu dawud':'sunan-abi-daud', 'tirmidhi':'jami-al-tirmidhi', "nasa":'sunan-an-nasai', 'ibn majah':'sunan-ibn-majah' };

  // Parse "2:275" / "12:66" / "4:11-12" → surah, verse-start, verse-end (end = start when no range).
  // In-app → START via window.openStartAtVerse(S,VS,VE); otherwise keep the standalone behaviour.
  function _finOpenVerse(ref){
    _exitFullIfNeeded();
    var m = String(ref || '').match(/(\d+)\s*:\s*(\d+)(?:\s*[-–]\s*(\d+))?/);
    if(!m) return;
    var S = parseInt(m[1], 10), VS = parseInt(m[2], 10), VE = m[3] ? parseInt(m[3], 10) : VS;
    if(IN_APP && typeof window.openStartAtVerse === 'function'){ window.openStartAtVerse(S, VS, VE); return; }
    _openVerse(S, VS);   // standalone fallback (unchanged prototype behaviour)
  }
  // Small "→ read" affordance for a verse ref (self-contained inline style — no CSS file edits).
  function _finVerseTag(ref){
    return ' <span class="fin-verse-read" data-fin-verse="'+_esc(ref)+'" style="cursor:pointer;color:#4FD1C5;'
         + 'font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.06em;margin-left:6px">→ read</span>';
  }
  // Hadith: label → slug (first substring match); in-app hand off to MONASTIC; else nothing visible.
  function _finOpenHadith(collection_label, number){
    _exitFullIfNeeded();
    var low = String(collection_label || '').toLowerCase(), slug = null;
    for(var k in HADITH_SLUGS){ if(HADITH_SLUGS.hasOwnProperty(k) && low.indexOf(k) !== -1){ slug = HADITH_SLUGS[k]; break; } }
    if(!slug){ console.warn('[finance] no MONASTIC slug for hadith collection:', collection_label); return; }
    if(IN_APP){
      window._stPendingHadith = { col: slug, num: String(number) };
      var monBtn = document.querySelector('.tab-btn[data-tab="MONASTIC"]');   // exactly how start.js switches
      if(monBtn) monBtn.click();
    }
    // when not IN_APP the local prototype hadith panel is the fallback (rendered by the READ pill)
  }
  // "→ open in Monastic" link (IN_APP only) for a hadith citation.
  function _finHadithTag(col, num){
    if(!IN_APP) return '';
    return ' <span class="fin-mon-open" data-fin-hadith="1" data-fin-hcol="'+_esc(col||'')+'" data-fin-hnum="'+_esc(String(num||''))+'"'
         + ' style="cursor:pointer;color:#4FD1C5;font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.06em;margin-left:8px">→ open in Monastic</span>';
  }
  // Wire both jump affordances inside any freshly-rendered container.
  function _wireFinJumps(container){
    if(!container) return;
    container.querySelectorAll('[data-fin-verse]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _finOpenVerse(this.getAttribute('data-fin-verse')); });
    });
    container.querySelectorAll('[data-fin-hadith]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _finOpenHadith(this.getAttribute('data-fin-hcol'), this.getAttribute('data-fin-hnum')); });
    });
  }
  // Concept families whose contracts intersect the contracts a row (or contract) touches.
  function _famsForContracts(cs){
    var fams = [];
    D.families.forEach(function(fm){
      var fc = _familyContracts(fm), hit = false;
      cs.forEach(function(c){ if(fc.has(c)) hit = true; });
      if(hit) fams.push(fm.id);
    });
    return fams;
  }
  // Verses cited for a single contract: terms whose parent_contract references it.
  function _contractVerses(cid){
    var vs = [];
    D.terms.forEach(function(t){
      if(_termContracts(t).indexOf(cid) !== -1){
        _versesFromText(t.earliest_source, _termLabel(t)).forEach(function(v){ vs.push(v); });
      }
    });
    return _dedupVerses(vs);
  }

  // ── Build the row list under the active filters ──
  function _scholarTradOk(s){ var t=_sTags(s); return _anyIn(F.sect,t) && _anyIn(F.school,t) && _anyIn(F.movement,t); }
  // Tradition labels for a spine row. Scholars: real tradition_tags+sect+madhhab.
  // Lineage: tradition_index tags. NOTHING invented.
  function _rowTradLabels(kind, id){
    if(kind === 'lineage'){ var e = D.tradById && D.tradById[id]; return (e && e.labels) || []; }
    if(kind === 'scholar'){ var s = _idx.scholar[id]; return s ? _sTags(s) : []; }
    return [];
  }
  // 'all'=no tradition picked · 'untagged'=no tag, always shown+marked ·
  // 'match'=tags satisfy picks, stays lit · 'off'=tagged but no match, greyed.
  function _tradState(kind, id){
    if(!(F.sect.size || F.school.size || F.movement.size)) return 'all';
    if(kind !== 'lineage' && kind !== 'scholar') return 'all';
    var labels = _rowTradLabels(kind, id);
    if(!labels.length) return 'untagged';
    return (_anyIn(F.sect,labels) && _anyIn(F.school,labels) && _anyIn(F.movement,labels)) ? 'match' : 'off';
  }
  function _confOk(a){ return !F.conf.size || F.conf.has(_conf(a).label); }
  function _contractOk(ids){ if(!F.contract.size) return true; return (ids||[]).some(function(id){ return F.contract.has(id); }); }

  // ── lineage_v4 rows on the TIMELINE spine ────────────────────────────────
  //    Uses ONLY the fields named in the spec; never fabricates a year.
  var _LINEAGE_STAGES = { quran:1, hadith:1, tafsir:1, classical_fiqh:1, modern_codification:1, current_status:1 };
  function _clip(s, n){ s = String(s == null ? '' : s); if(s.length <= n) return s; return s.slice(0, n-1).replace(/\s+\S*$/, '') + '…'; }
  // Respect the CONTRACT filter (one contract → only its lineage rows) and the CONFIDENCE filter (by assurance).
  function _linRowOk(r){
    if(F.contract.size && !F.contract.has(r.contract)) return false;
    if(!_confOk(r.assurance)) return false;
    return true;
  }
  // Concise one-line meta: plain-language stage + evidence citation + (hadith) grading + period note.
  function _linMeta(r){
    var parts = [];
    var lbl = r.stage_label || _stageName(r.stage);
    if(lbl) parts.push(lbl);
    if(r.evidence_display) parts.push(_clip(r.evidence_display, 72));
    if(r.stage === 'hadith' && r.hadith_meta && r.hadith_meta.grading_app) parts.push('grading ' + r.hadith_meta.grading_app);
    if(r.display_note) parts.push(_clip(r.display_note, 60));
    if(r.confidence === 'period_only') parts.push('period only');
    return parts.join(' · ');
  }
  function _linEntry(r){
    var _nm = (r.name && String(r.name).trim()) ? r.name : (r.stage_label || _stageName(r.stage));
    return { kind:'lineage', id:r.id, yr:(typeof r.timeline_year === 'number' ? r.timeline_year : null),
             yr_end:(r.timeline_year_end != null ? r.timeline_year_end : null),
             title:(r.contract_name ? r.contract_name + ' · ' : '') + _nm,   // "{contract_name} · {name}"
             meta:_linMeta(r), conf:_conf(r.assurance), stage:r.stage,
             note:(r.display_note || ''), tradState:_tradState('lineage', r.id) };   // substantive note; NOT the dating fallback
  }
  // Dated lineage rows (timeline_order 1, real integer year). `taken` = title@year keys already on the
  // spine from scholar/book/event rows → DEDUP: prefer the lineage row for lineage stages (all rows here
  // are lineage stages, so both are kept); scholar/book/event rows are never dropped.
  function _lineageDated(taken){
    var out = [];
    (D.lineage || []).forEach(function(r){
      if(r.timeline_order !== 1 || r.stage === 'quran' || typeof r.timeline_year !== 'number') return;   // Qur'an rows never dated on the spine
      if(!_linRowOk(r)) return;
      var key = String(r.name || '').trim().toLowerCase() + '@' + r.timeline_year;
      if(taken && taken[key] && !_LINEAGE_STAGES[r.stage]) return;
      out.push(_linEntry(r));
    });
    return out;
  }
  // (Qur'an rows are timeline_order 0 / stage 'quran' — they are NEVER spine rows; their verses feed
  //  the QUR'AN READ pill only, and stay undated everywhere.)

  function _buildEntries(){
    // Tradition filter greys non-matching rows (see _tradState); it no longer hides.
    var schOk = D.scholars.filter(function(s){ return _confOk(s.assurance); });
    var entries = [];
    if(F.show.has('scholars')){
      schOk.forEach(function(s){
        var yr = _py(s.birth_year); if(yr==null) return;
        // CONTRACT filter → HIDE (never render) scholars that don't touch a selected contract. When the
        // filter is empty this is skipped, so default behaviour (all scholars shown) is unchanged.
        if(F.contract.size && !_contractOk(Array.from(_rowContracts('scholar', s.id)))) return;
        var death = (s.death_year==='living') ? 'living' : (_py(s.death_year)!=null ? _py(s.death_year) : (s.death_year||'?'));
        var meta = 'b.'+yr+(death?'–'+death:'')
                 + (s.sect?' · '+s.sect:'')
                 + (s.madhhab && s.madhhab!=='non-denominational' ? ' · '+s.madhhab : '');
        entries.push({ kind:'scholar', id:s.id, yr:yr, title:s.name, meta:meta, conf:_conf(s.assurance), tradState:_tradState('scholar', s.id) });
      });
    }
    if(F.show.has('books')){
      D.books.forEach(function(b){
        var yr = _py(b.year_ce); if(yr==null) return;
        if(!_confOk(b.assurance)) return;
        if(!_contractOk(b.contracts_covered)) return;
        var meta = _bookAuthorLabel(b)+' · '+yr+' CE'+(b.year_ah?' · '+b.year_ah+' AH':'');
        entries.push({ kind:'book', id:b.id, yr:yr, title:(b.title_english||b.title_original||b.id), meta:meta, conf:_conf(b.assurance), url:(b.public_url||'') });
      });
    }
    if(F.show.has('events')){
      D.events.forEach(function(e){
        var yr = _py(e.year); if(yr==null) return;
        if(!_confOk(e.assurance)) return;
        if(!_contractOk(e.linked_contracts)) return;
        var meta = (e.country?e.country+' · ':'')+String(e.type||'').replace(/_/g,' ');
        entries.push({ kind:'event', id:e.id, yr:yr, title:e.event, meta:meta, conf:_conf(e.assurance) });
      });
    }
    // Dated lineage_v4 rows join the same spine, by year. DEDUP keys off the scholar/book/event titles above.
    if(F.show.has('lineage')){
      var _taken = {};
      entries.forEach(function(en){ _taken[String(en.title||'').trim().toLowerCase()+'@'+en.yr] = true; });
      _lineageDated(_taken).forEach(function(en){ entries.push(en); });
    }
    entries.sort(function(a,b){ if(a.yr!==b.yr) return a.yr-b.yr; return String(a.title||'').localeCompare(String(b.title||'')); });
    return entries;
  }

  // ── Year -> Y (piecewise-linear over rendered rows; mirrors _tkYrToY) ──
  function _finYrToY(yr, rows, totalH){
    if(!rows.length) return PAD;
    if(rows.length===1) return rows[0].y + ROW_H/2;
    var first = rows[0], last = rows[rows.length-1];
    if(yr <= first.yr){
      var a=rows[0], b=rows[1];
      if(b.yr===a.yr) return a.y;
      return Math.max(0, a.y + ((b.y-a.y)/(b.yr-a.yr))*(yr-a.yr));
    }
    if(yr >= last.yr){
      var L=rows[rows.length-1], P=rows[rows.length-2];
      if(L.yr===P.yr) return L.y + ROW_H;
      return Math.min(totalH, L.y + ((L.y-P.y)/(L.yr-P.yr))*(yr-L.yr));
    }
    for(var i=1;i<rows.length;i++){
      if(rows[i].yr >= yr){
        var pr=rows[i-1], cu=rows[i];
        if(cu.yr===pr.yr) return cu.y;
        return pr.y + ((yr-pr.yr)/(cu.yr-pr.yr))*(cu.y-pr.y);
      }
    }
    return last.y + ROW_H;
  }

  function _eraBandsHtml(rows, totalH){
    var h = '';
    FIN_ERAS.forEach(function(era){
      var y1 = Math.max(0, _finYrToY(era.start, rows, totalH));
      var y2 = Math.min(totalH, _finYrToY(era.end, rows, totalH));
      if(y2 - y1 <= 0) return;
      var bandH = y2 - y1;
      h += '<div class="fin-era-band" style="top:'+y1+'px;height:'+bandH+'px;background:linear-gradient(to right,transparent 15%,rgba('+era.glow+',0.04) 50%,rgba('+era.glow+',0.10) 100%)">';
      if(bandH >= 20){
        h += '<span class="fin-era-band-label" style="color:rgba('+era.glow+',0.85)">'+_esc(era.name)+'</span>';
        h += '<span class="fin-era-band-dates" style="color:rgba('+era.glow+',0.7)">'+_esc(era.dates)+'</span>';
      }
      h += '</div>';
    });
    return h;
  }

  // ── Concept-family parabolic arcs (right of stem) ──
  function _buildArcs(rows, totalH){
    if(!F.concepts.size) return null;
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'fin-concept-arcs');
    // Bounded width + capped peak so arcs stay inside .fin-canvas, never reaching the hub.
    svg.style.cssText = 'position:absolute;top:0;left:'+(STEM_X+6)+'px;width:300px;height:'+totalH+'px;pointer-events:none;z-index:0;overflow:hidden';
    var sel = D.families.filter(function(fm){ return F.concepts.has(fm.id); });
    var i = 0;
    sel.forEach(function(fm){
      var orig = _familyOrigin(fm);
      var y1 = _finYrToY(orig.year, rows, totalH);
      var y2 = _finYrToY(PRESENT, rows, totalH);
      if(y2 < y1){ var t=y1; y1=y2; y2=t; }
      if(y2 - y1 < 24) y2 = y1 + 24;
      var midY = (y1+y2)/2;
      var peakX = Math.min(280, 44 + i*22);   // cap ~300px from the spine
      var color = fm.color || '#D4AF37';
      var d = 'M 0 '+y1.toFixed(1)
            + ' C '+(peakX*0.4).toFixed(1)+' '+(y1+(midY-y1)*0.2).toFixed(1)
            + ', '+peakX.toFixed(1)+' '+(y1+(midY-y1)*0.5).toFixed(1)
            + ', '+peakX.toFixed(1)+' '+midY.toFixed(1)
            + ' C '+peakX.toFixed(1)+' '+(midY+(y2-midY)*0.5).toFixed(1)
            + ', '+(peakX*0.4).toFixed(1)+' '+(midY+(y2-midY)*0.8).toFixed(1)
            + ', 0 '+y2.toFixed(1);
      var path = document.createElementNS(NS,'path');
      path.setAttribute('d', d); path.setAttribute('fill','none'); path.setAttribute('stroke', color);
      path.setAttribute('stroke-opacity','0.75'); path.setAttribute('stroke-width','2.5');
      path.setAttribute('data-fam', fm.id); path.style.pointerEvents = 'stroke'; path.style.cursor = 'pointer';
      svg.appendChild(path);
      [y1, y2].forEach(function(yy){
        var c = document.createElementNS(NS,'circle');
        c.setAttribute('cx','0'); c.setAttribute('cy', yy.toFixed(1)); c.setAttribute('r','3.5');
        c.setAttribute('fill', color); c.setAttribute('data-fam', fm.id);
        c.style.pointerEvents = 'all'; c.style.cursor = 'pointer';
        svg.appendChild(c);
      });
      var lbl = document.createElementNS(NS,'text');
      lbl.setAttribute('x', (peakX+8).toFixed(1)); lbl.setAttribute('y', (y1+3).toFixed(1));
      lbl.setAttribute('fill', color); lbl.setAttribute('fill-opacity','0.92');
      lbl.setAttribute('font-family','Cinzel,serif'); lbl.setAttribute('font-size','10');
      lbl.setAttribute('letter-spacing','.06em'); lbl.setAttribute('font-weight','600');
      lbl.setAttribute('data-fam', fm.id); lbl.style.pointerEvents = 'all'; lbl.style.cursor = 'pointer';
      lbl.textContent = String(fm.family_name||fm.id).toUpperCase()+' · '+(orig.approx?'c.':'')+orig.year+' CE';
      svg.appendChild(lbl);
      i++;
    });
    return svg;
  }

  // ── Render the canvas ──
  function _render(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var entries = _buildEntries();
    _entries = entries;
    // Qur'an material is UNDATED and NEVER a spine row — its verses feed the QUR'AN READ pill only.
    var ro = document.getElementById('finance-readout');
    if(ro) ro.textContent = entries.length + ' rows';
    if(!entries.length){
      canvas.style.height = '';
      canvas.innerHTML = '<div class="fin-empty">No rows match the current filters.<br>Adjust the filter bar above, or press RESET.</div>';
      return;
    }
    // THINK-style Qur'an rows: one per SHOWN concept (CONCEPTS filter) that has a cited verse.
    var startConcepts = D.families
      .filter(function(fm){ return F.concepts.has(fm.id); })
      .map(function(fm){ return { fm:fm, verses:_familyVerses(fm) }; })
      .filter(function(s){ return s.verses.length; });
    var startN = startConcepts.length;

    // ── Spine header Qur'an pill (mirror LADDER's fin-qpill / fin-qread split) ──
    //    The gold QUR'AN pill is a PERMANENT fixture of the spine — always visible,
    //    exactly like LADDER, whether or not anything is selected. The SEPARATE READ
    //    pill beside it is what toggles by data: live (gold, clickable) only when a
    //    contract's lineage quran row cites verses (SAME resolution LADDER uses), or a
    //    concept with a cited verse is selected; otherwise pale/inactive. No fabrication.
    var _pill = null;   // { active:bool, row:<quran-verses row | synthetic | null> }
    // A selected QUR'AN WORD drives the pill first: glow:true → its verses[] light READ gold; glow:false → pale.
    var _qwSel = F.qwords.size ? _qwordById(Array.from(F.qwords)[0]) : null;
    if(_qwSel){
      var _qwLive = !!(_qwSel.glow && _qwSel.verses && _qwSel.verses.length);
      _pill = { active:_qwLive, row:(_qwLive ? { stage:'quran', stage_label:(_qwSel.english || _qwSel.arabic || "Qur'an word"),
                crosstag:{ quran_verses:_qwSel.verses.slice() } } : null) };
    }
    var _pillC = (F.contract.size === 1) ? Array.from(F.contract)[0] : null;
    if(!_pill && _pillC && /^C\d{2}$/.test(_pillC)){
      var _pillLin = (D && D.lineage) || [];
      var _pillRow = _pillLin.filter(function(r){ return r.contract === _pillC && r.stage === 'quran'; })[0] || null;
      var _pillV = _pillRow && _pillRow.crosstag && _pillRow.crosstag.quran_verses;
      // QUR'AN pill always shows for a chosen contract; READ is live only when verses are actually cited.
      _pill = { active:!!(_pillV && _pillV.length), row:_pillRow };
    } else if(!_pill && startConcepts.length){
      var _pillSc = startConcepts[0];
      _pill = { active:true, row:{ stage:'quran', stage_label:_pillSc.fm.family_name,
                crosstag:{ quran_verses:_pillSc.verses.map(function(v){ return v.surah+':'+v.ayah; }) } } };
    }

    var PILL_BAND = 64;                                       // reserved band above the first dated row — clears title/era text
    var pillY  = PAD + startN*ROW_H + PILL_BAND/2;            // pill centre, in its own clear band

    // ── Term buckets — run for ONE OR MORE ticked contracts. Three-way split on the FINAL enriched date
    //    rules (see _termOriginYear), computed PER ticked contract (a term belongs to a contract when its
    //    parent_contract C## codes include it — a term tied to two ticked contracts appears under both):
    //      PLOTTED    → plain-year terms → coloured tiles + a weaving vein per contract.
    //      QUR'AN BLOCK → earliest_date_ce contains 'undated (Qur'an block rule)' → chip strip below the pill.
    //      PENDING    → everything else (NEEDS_VERIFICATION + non-plain formats) → bottom strip, not plotted.
    // Lanes are assigned in ticked-code order (sorted) so the layout is deterministic.
    var _cids = Array.from(F.contract).filter(function(c){ return /^C\d{2}$/.test(c); }).sort();
    var _tByC = _cids.map(function(cid){
      var cterms = D.terms.filter(function(t){ return _termContracts(t).indexOf(cid) !== -1; });
      var plotted = [], qblock = [], pending = [];
      cterms.forEach(function(t){
        var yr = _termOriginYear(t);
        if(yr != null){ plotted.push({ t:t, yr:yr, approx:false }); return; }
        var lyr = _termLatestYear(t);   // rough/period date → plot at the END of the period, marked approx
        if(lyr != null){ plotted.push({ t:t, yr:lyr, approx:true }); return; }
        var raw = (t.earliest_date_ce == null ? '' : String(t.earliest_date_ce));
        if(/undated \(qur['’]?an block rule\)/i.test(raw)) qblock.push(t);
        else pending.push(t);
      });
      plotted.sort(function(a,b){ return a.yr - b.yr; });
      return { cid:cid, plotted:plotted, qblock:qblock, pending:pending };
    });
    // Union of qblock / pending across ticked contracts (each term shown ONCE) → the two strips + band size.
    var _qUnion = [], _pUnion = [], _seenQ = {}, _seenP = {};
    _tByC.forEach(function(b){
      b.qblock.forEach(function(t){ if(!_seenQ[t.id]){ _seenQ[t.id] = 1; _qUnion.push(t); } });
      b.pending.forEach(function(t){ if(!_seenP[t.id]){ _seenP[t.id] = 1; _pUnion.push(t); } });
    });
    var _hasTerms = _cids.length > 0;

    // Reserve a band below the pill for the QUR'AN-BLOCK chip strip so it never overlaps the spine.
    // Estimate wrapped height from the chip count (~6 chips/row); corrected by measurement after render.
    var _qbCount = _qUnion.length;
    var QBLOCK_BAND = _qbCount ? (30 + Math.ceil(_qbCount / 6) * 28) : 0;
    var topPad = PAD + startN*ROW_H + PILL_BAND + QBLOCK_BAND;   // dated spine begins below pill (+ qblock band)

    // Left flow is the real dated `entries` only. Plotted term origins are NOT woven in here — they
    // render as coloured tiles on the RIGHT of the stem (see below). Era bands, concept arcs and year
    // math are therefore exactly as before.
    var layoutRows = entries;
    layoutRows.forEach(function(en, i){ en.y = topPad + i*ROW_H; });
    var totalH = topPad + layoutRows.length*ROW_H + PAD;
    var rows = entries; // year-mapping / arcs / era bands use the real dated rows only

    var html = '';
    html += '<div class="fin-stem-cap" style="top:2px">CE</div>';
    var stemTop = topPad - 6;
    html += '<div class="fin-stem" style="top:'+stemTop+'px;height:'+(totalH-stemTop-PAD+6)+'px"></div>';

    // Spine header — the gold QUR'AN pill is ALWAYS rendered; only the READ pill toggles
    // (live/clickable when verses are cited, else pale/inactive).
    var _pillActive = !!(_pill && _pill.active);
    html += '<div class="fin-qpill-wrap" style="top:'+pillY+'px">'
          + '<span class="fin-qpill">QUR\'AN</span>'
          + '<span class="fin-qread'+(_pillActive ? '' : ' fin-qread-off')+'"'+(_pillActive ? ' data-fin-pill-read="1"' : '')+'>READ</span>'
          + '</div>';

    // QUR'AN-BLOCK terms — undated by the Qur'an block rule. Chip strip directly below the gold pill,
    // in the qblock band reserved above. Chips route to the term details panel (data-term-chip → _selectTerm).
    if(_qUnion.length){
      var _qbTop = PAD + startN*ROW_H + PILL_BAND - 8;
      html += '<div class="fin-term-qblock" id="fin-term-qblock" style="top:'+_qbTop+'px">'
            + '<div class="fin-term-qblock-head">QUR\'ANIC-ERA TERMS · undated ('+_qUnion.length+')</div>'
            + '<div class="fin-term-qblock-chips">'
            + _qUnion.map(function(t){ return '<span class="fin-term-undated-chip" data-term-chip="'+_esc(t.id)+'">'+_esc(t.term_english||t.id)+'</span>'; }).join('')
            + '</div></div>';
    }

    // Qur'an READ rows near the spine (mirror THINK's stacked READ pills).
    startConcepts.forEach(function(s, idx){
      var y = PAD + idx*ROW_H, v = s.verses[0], color = s.fm.color || '#D4AF37';
      html += '<span class="fin-start-tag" style="top:'+y+'px;height:'+ROW_H+'px">QUR\'AN ('+s.verses.length+')</span>';
      html += '<a class="fin-start-read" href="#start?surah='+v.surah+'&verse='+v.ayah+'" data-fam="'+_esc(s.fm.id)+'" data-s="'+v.surah+'" data-a="'+v.ayah+'" style="top:'+(y+8)+'px">READ</a>';
      html += '<span class="fin-start-label" data-fam="'+_esc(s.fm.id)+'" style="top:'+y+'px;height:'+ROW_H+'px;color:'+color+'">'+_esc(s.fm.family_name)+'</span>';
    });

    var shown = {};
    entries.forEach(function(en){
      var midY = en.y + ROW_H/2;
      if(shown[en.yr]){ shown[en.yr].count++; return; }
      shown[en.yr] = { midY:midY, count:1 };
    });
    Object.keys(shown).forEach(function(yr){
      var info = shown[yr], n = Number(yr), multi = info.count>1 ? ' year-multi' : '';
      html += '<div class="fin-yr-mark'+multi+'" style="top:'+info.midY+'px;'+(_showCE?'':'display:none')+'">'+Math.abs(n)+'<span class="year-era">'+(n<0?'BCE':'CE')+'</span></div>';
      var hij = _ceToHijri(n);
      html += '<div class="fin-hij-mark'+multi+'" style="top:'+info.midY+'px;'+(_showHijri?'':'display:none')+'">'+(hij<0?Math.abs(hij)+'<span class="year-era">ق.هـ</span>':hij+'<span class="year-era">هـ</span>')+'</div>';
    });

    html += '<div class="fin-ruler-toggle" style="top:'+(PAD-28)+'px">'
          + '<span class="fin-ruler-btn'+(_showCE?' on':'')+'" data-ruler="ce">CE</span>'
          + '<span class="fin-ruler-sep">│</span>'
          + '<span class="fin-ruler-btn'+(_showHijri?' on':'')+'" data-ruler="hij">هـ</span></div>';

    html += _eraBandsHtml(rows, totalH);

    // ORIGIN 610–632 band — labels the top origin rows. The main dated spine begins at 632; rows ≥632
    // flow normally. Neutral stone tone (gold stays reserved). Its label is pushed DOWN (margin-top)
    // so it never collides with the "Prophetic Era / Before 632 CE" era label pinned at the band top.
    if(rows.some(function(r){ return r.yr >= 610 && r.yr <= 632; })){
      var _oy1 = Math.max(0, _finYrToY(610, rows, totalH));
      var _oy2 = Math.min(totalH, _finYrToY(632, rows, totalH));
      if(_oy2 - _oy1 > 4){
        html += '<div class="fin-era-band" style="top:'+_oy1+'px;height:'+(_oy2-_oy1)+'px;background:linear-gradient(to right,transparent 15%,rgba(201,191,168,0.05) 50%,rgba(201,191,168,0.12) 100%)">'
              + '<span class="fin-era-band-label" style="color:rgba(201,191,168,0.9);margin-top:34px">ORIGIN 610–632</span>'
              + '<span class="fin-era-band-dates" style="color:rgba(201,191,168,0.75)">origin band</span>'
              + '</div>';
      }
    }

    // Single-line spine rows: title + confidence/assurance chip ONLY. All detail (evidence, dating,
    // grading, notes, verse refs, book URL) lives in the DETAILS panel shown on click.
    layoutRows.forEach(function(en){
      var midY = en.y + ROW_H/2;
      var _tdim = (en.tradState === 'off') ? ' fin-row-tdim' : '';
      var _utag = (en.tradState === 'untagged') ? '<span class="fin-tag fin-tag-untagged">untagged</span>' : '';
      html += '<div class="fin-row fin-row-1l'+_tdim+'" data-kind="'+en.kind+'" data-id="'+_esc(en.id)+'"'+(en.kind==='lineage' ? ' data-stage="'+_esc(en.stage||'')+'"' : '')+' data-y="'+midY+'" style="top:'+en.y+'px;height:'+ROW_H+'px">';
      html += '<div class="fin-row-title">'+_esc(en.title)+'<span class="fin-badge fin-badge-'+en.conf.key+'">'+en.conf.label+'</span>'+(en.note && en.note.length <= 30 ? '<span class="fin-tag">'+_esc(en.note)+'</span>' : '')+_utag+'</div>';
      html += '</div>';
      html += '<div class="fin-conf-dot'+_tdim+'" data-id="'+_esc(en.id)+'" style="top:'+midY+'px;background:'+en.conf.color+'"></div>';
    });

    // ── Term origins — shown when ONE OR MORE contracts are ticked (buckets computed above). Each ticked
    //    contract gets its OWN weaving lifeline (own lane, colour, earliest-evidence start, dashed cap) in a
    //    SHARED tile column. PLOTTED → tiles + veins; QUR'AN-BLOCK / PENDING → union strips. 0 ticked → none.
    if(_hasTerms){
      var TILE_H = 80, STEM_RIGHT = 506, LANE0 = 545, LANE_STEP = 26, _lifeBot = totalH - PAD;
      var _nTicked = _cids.length;
      var TILE_LEFT = 605 + (_nTicked - 1) * LANE_STEP;   // shift tiles right so the last lane never runs under them
      var BRANCH_END = TILE_LEFT - 2;                      // veins peak at the tile column's left edge
      var _tileHtml = '', _svg = '';

      // A left-spine entry's contracts: books/events/scholars via _rowContracts; lineage via _idx.lineage.
      var _entryHasC = function(en, cid){
        if(en.kind === 'lineage'){ var lr = _idx.lineage[en.id]; return !!(lr && lr.contract === cid); }
        return _rowContracts(en.kind, en.id).has(cid);
      };
      // Earliest documented left-row Y for a contract (rows are year-sorted) — never guesses a year.
      var _earliestYForC = function(cid, fallbackY){
        for(var _r = 0; _r < rows.length; _r++){ if(_entryHasC(rows[_r], cid)) return _finYrToY(rows[_r].yr, rows, totalH); }
        return fallbackY;
      };

      // Collect ALL plotted tiles across ticked contracts; ONE global nudge pass (by year) so tiles from
      // different contracts never overlap. Each tile keeps its contract index (lane) and its own colour.
      var _allTiles = [];
      _tByC.forEach(function(b, ci){
        b.plotted.forEach(function(d){
          _allTiles.push({ ci:ci, cid:b.cid, t:d.t, yr:d.yr, approx:!!d.approx, col:_termColor(d.t), attachY:_finYrToY(d.yr, rows, totalH) });
        });
      });
      _allTiles.sort(function(a, b){ return (a.attachY - b.attachY) || (a.yr - b.yr); });
      var _prevTileY = -1e9;
      _allTiles.forEach(function(tile){ var y = tile.attachY; if(y < _prevTileY + TILE_H) y = _prevTileY + TILE_H; _prevTileY = y; tile.tileY = y; });

      if(_allTiles.length){
        // Tiles (shared column). Border colour, badge, click unchanged. APPROX tiles (rough/period dates,
        // plotted at the END of their period) get a dashed border + a small "by ~<yr>" first line — the one
        // exception to the no-year rule, since the position alone would overstate precision.
        _allTiles.forEach(function(tile){
          var t = tile.t, cf = CONF[t.assurance];
          var badge = (cf && cf.key !== 'plc') ? '<span class="fin-badge fin-badge-'+cf.key+'">'+cf.label+'</span>' : '';
          _tileHtml += '<div class="fin-term-tile'+(tile.approx ? ' fin-term-tile-approx' : '')+'" data-term-origin="'+_esc(t.id)+'" style="top:'+tile.tileY+'px;left:'+TILE_LEFT+'px;border-left-color:'+tile.col+'"'
                     + ' title="'+_esc((t.term_english||t.id)+(tile.approx ? ' — by ~'+tile.yr+' CE (approx)' : ' — origin '+tile.yr+' CE'))+'">'
                     + (tile.approx ? '<div class="fin-tile-approx-yr">by ~'+tile.yr+'</div>' : '')
                     + '<div class="fin-tile-en">'+_esc(t.term_english || t.id)+'</div>'
                     + (t.term_arabic ? '<div class="fin-tile-ar">'+_esc(t.term_arabic)+'</div>' : '')
                     + badge
                     + '</div>';
        });

        // One weaving vein PER ticked contract — its own lane (545 + i*26), colour, earliest-evidence start,
        // dashed Qur'anic cap, weaving out to touch ITS OWN tiles at their final nudged Ys, down to today.
        var _svgInner = '';
        _tByC.forEach(function(b, ci){
          var cid = b.cid;
          var _myTiles = _allTiles.filter(function(x){ return x.ci === ci; });   // year-sorted (from the global pass)
          var _trunkCol = CONTRACT_COLORS[cid] || (b.plotted[0] ? _termColor(b.plotted[0].t) : '#D4AF37');
          var _laneBase = LANE0 + ci * LANE_STEP;
          var _fallbackY = _myTiles.length ? _myTiles[0].attachY : _finYrToY(rows[0].yr, rows, totalH);
          var _trunkTop = _earliestYForC(cid, _fallbackY);
          var _laneX = function(yy){ return _laneBase + 8 * Math.sin((yy - _trunkTop) / 70); };

          var _P = [{ x: STEM_RIGHT, y: _trunkTop }], _prevY = _trunkTop;
          _myTiles.forEach(function(tile){
            var _midY = (_prevY + tile.tileY) / 2;
            _P.push({ x: _laneX(_midY), y: _midY });        // back in the lane between tiles
            _P.push({ x: BRANCH_END,   y: tile.tileY });    // outward peak at the shared tile column
            _prevY = tile.tileY;
          });
          var _lastMid = (_prevY + _lifeBot) / 2;
          _P.push({ x: _laneX(_lastMid), y: _lastMid });
          _P.push({ x: _laneX(_lifeBot), y: _lifeBot });     // down to today

          var _weaveD = 'M ' + _P[0].x.toFixed(1) + ' ' + _P[0].y.toFixed(1);
          for(var _i = 0; _i < _P.length - 1; _i++){
            var _q0 = _P[_i-1] || _P[_i], _q1 = _P[_i], _q2 = _P[_i+1], _q3 = _P[_i+2] || _P[_i+1];
            var _c1x = _q1.x + (_q2.x - _q0.x) / 6, _c1y = _q1.y + (_q2.y - _q0.y) / 6;
            var _c2x = _q2.x - (_q3.x - _q1.x) / 6, _c2y = _q2.y - (_q3.y - _q1.y) / 6;
            _weaveD += ' C ' + _c1x.toFixed(1) + ' ' + _c1y.toFixed(1) + ', ' + _c2x.toFixed(1) + ' ' + _c2y.toFixed(1) + ', ' + _q2.x.toFixed(1) + ' ' + _q2.y.toFixed(1);
          }
          _svgInner += '<path d="'+_weaveD+'" fill="none" stroke="'+_trunkCol+'" stroke-width="3" stroke-opacity="0.9"/>'
                     + '<circle cx="'+STEM_RIGHT+'" cy="'+_trunkTop.toFixed(1)+'" r="3" fill="'+_trunkCol+'"/>';   // ruler touch-point
          if(D.qToCById && D.qToCById[cid]){
            var _tipTop = Math.max(pillY, _trunkTop - 80);
            if(_tipTop < _trunkTop - 2){
              _svgInner += '<path d="M '+STEM_RIGHT+' '+_trunkTop.toFixed(1)+' L '+STEM_RIGHT+' '+_tipTop.toFixed(1)+'"'
                         + ' fill="none" stroke="'+_trunkCol+'" stroke-width="2" stroke-opacity="0.7" stroke-dasharray="4 4"/>';
            }
          }
          // Junction dots at this contract's outward peaks (tile colour ties tile to its vein).
          _myTiles.forEach(function(tile){ _svgInner += '<circle cx="'+BRANCH_END+'" cy="'+tile.tileY.toFixed(1)+'" r="3" fill="'+tile.col+'"/>'; });
        });
        _svg = '<svg class="fin-term-lifelines-svg" width="1300" height="'+totalH+'" style="position:absolute;left:0;top:0;pointer-events:none;z-index:3;overflow:visible">'
             + _svgInner + '</svg>';
      }
      html += _svg + _tileHtml;   // weaving-vein SVG (z3, pointer-events:none) + tiles (z4)

      if(_pUnion.length){
        html += '<div class="fin-term-undated" id="fin-term-undated" style="top:'+totalH+'px">'
              + '<div class="fin-term-undated-head">TERM ORIGINS — NOT PLOTTED ('+_pUnion.length+')</div>'
              + '<div class="fin-term-undated-chips">'
              + _pUnion.map(function(t){
                  var raw = (t.earliest_date_ce == null ? '' : String(t.earliest_date_ce).trim());
                  var showDate = raw && !/NEEDS_VERIFICATION/i.test(raw);
                  return '<span class="fin-term-undated-chip" data-term-chip="'+_esc(t.id)+'">'+_esc(t.term_english||t.id)
                       + (showDate ? ' <span class="fin-term-chip-date">('+_esc(raw)+')</span>' : '')
                       + '</span>';
                }).join('')
              + '</div></div>';
      }
    }

    canvas.style.height = totalH+'px';
    canvas.innerHTML = html;
    var svg = _buildArcs(rows, totalH);
    if(svg) canvas.appendChild(svg);
    _wireCanvas(canvas);

    // Grow the canvas so the undated strip (absolute, below the spine) is fully scrollable into view.
    var _ub = canvas.querySelector('#fin-term-undated');
    if(_ub) canvas.style.height = (totalH + _ub.offsetHeight + 48) + 'px';

    // Spine header pill READ → the SAME Verses panel LADDER opens (reuse; no new panel).
    if(_pill && _pill.active){
      var _pr = canvas.querySelector('[data-fin-pill-read]');
      if(_pr) _pr.addEventListener('click', function(e){ e.stopPropagation(); _renderQuranVersesHub(_pill.row); });
    }

    // Reapply any active selection after a re-render.
    if(_sel){
      if(_sel.type==='row') _selectRow(_sel.kind, _sel.id);
      else if(_sel.type==='family') _selectFamily(_sel.id);
      else if(_sel.type==='contract') _selectContract(_sel.id, _sel.noDim);
      else if(_sel.type==='term') _renderHub();
      else if(_sel.type==='qword'){ _applyQwordDim(_sel.id); _renderHub(); }
    } else if(F.qwords.size){
      _applyQwordDim(Array.from(F.qwords)[0]);   // word-filter dim persists even after a cleared selection
    }
  }

  // ── Mode dispatch (TIMELINE | LADDER | STORY | RIVERS) ──
  //    TIMELINE is the original view; the others swap the canvas only.
  //    Toolbar, notice bar and right-hand hub always stay mounted.
  function _renderMode(){
    if(_mode === 'home')           _renderHome();
    else if(_mode === 'ladder')    _renderLadder();
    else if(_mode === 'lecture')   _renderLecture();
    else if(_mode === 'standards') _renderStandards();
    else if(_mode === 'report')    _renderReport();
    else if(_mode === 'archive')   _renderArchive();
    else if(_mode === 'upload')    _renderUpload();
    else if(_mode === 'reader')    _renderStandardsReader();
    else if(_mode === 'htw')       _renderHtwPage();
    else if(_mode === 'prism')     _renderPrism();
    else if(_mode === 'trace')     _renderTrace();
    else                           _render();
  }
  // Reflect the active mode on #finance-view so per-mode CSS can hide filters.
  function _applyModeAttr(){ var fv = document.getElementById('finance-view'); if(fv) fv.setAttribute('data-mode', _mode); }
  // Always-visible name of the page the user is on (shown as a chip in the toolbar).
  function _pageLabel(m){
    var L = { home:'HOME', trace:'TRACE', timeline:'TIMELINE', ladder:'LADDER', prism:'PRISM',
              reader:'STANDARDS', lecture:'LECTURE', htw:'HOW THIS WORKS', upload:'UPLOAD',
              standards:'SETTINGS', report:'REPORT', archive:'ARCHIVE' };
    return L[m] || String(m || '').toUpperCase();
  }
  function _setMode(m, _fromBack){
    if(m === _mode) return;
    if(!_fromBack){ _navStack.push(_mode); if(_navStack.length > 40) _navStack.shift(); }
    _mode = m;
    var _pc = document.getElementById('fin-cur-page'); if(_pc) _pc.textContent = _pageLabel(m);
    _applyModeAttr();
    _clearSelection();   // drop any timeline selection; hub returns to its hint state
    var tb = document.getElementById('finance-toolbar');
    if(tb) tb.querySelectorAll('.fin-mode-btn').forEach(function(b){
      b.classList.toggle('on', b.getAttribute('data-mode') === m);
    });
    _renderMode();
    _syncBackBtn();
  }
  function _goBack(){ if(_navStack.length){ _setMode(_navStack.pop(), true); } }
  function _syncBackBtn(){ var b = document.getElementById('fin-back-btn'); if(b) b.disabled = (_navStack.length === 0); }

  // ── LECTURE mode — the "elevator ride": read a topic top-to-bottom as a document ──
  //    Master course → word lectures (D.qlayer) + contract lectures (D.lineage_v4).
  var LEC_STAGE_ORDER = ['quran','hadith','tafsir','classical_fiqh','modern_codification','current_status'];

  function _lecBadge(a){ var c = _conf(a); return '<span class="fin-badge fin-badge-'+c.key+'">'+c.label+'</span>'; }
  function _lecEntityTag(et){
    if(et === 'scholar')     return '<span class="fin-lec-enttag">Scholar</span>';
    if(et === 'institution') return '<span class="fin-lec-enttag">Institution</span>';
    return '';   // 'revelation' (and anything else) → nothing
  }
  // ── Per-row v4 enrichment (display only) — surfaces fields the base entry drops.
  //    opts.skipGrading / skipEvidence / skipBasis suppress a field the calling section already prints. ──
  function _lecDatingLine(da){
    if(!da || !da.range) return '';
    var e = da.range.earliest, l = da.range.latest;
    if(e == null && l == null) return '';
    var span = (l == null || l === e) ? String(e) : String(e) + '–' + String(l);
    var out = 'app dating ' + span + ' CE';
    if(da.confidence) out += ', ' + da.confidence + ' confidence';
    return out;
  }
  function _lecMeta(r, opts){
    opts = opts || {};
    var hm = r.hadith_meta || {};
    var chips = '';
    var stageLbl = r.stage_label || _stageName(r.stage);
    if(stageLbl)
      chips += '<span class="fin-lec-mchip fin-lec-mstage">' + _esc(stageLbl) + '</span>';
    if(r.confidence)
      chips += '<span class="fin-lec-mchip fin-lec-mconf">confidence: ' + _esc(String(r.confidence).replace(/_/g,' ')) + '</span>';
    if(!opts.skipGrading && hm.grading_app)
      chips += '<span class="fin-lec-mchip fin-lec-mgrade">grading: ' + _esc(hm.grading_app) + '</span>';
    if(r.display_note)
      chips += '<span class="fin-lec-mchip fin-lec-mnote">' + _esc(r.display_note) + '</span>';
    var h = '';
    if(chips) h += '<div class="fin-lec-mchips">' + chips + '</div>';
    var dat = _lecDatingLine(hm.dating_app);
    var parts = [];
    if(dat) parts.push(_esc(dat));
    if(!opts.skipBasis && r.timeline_year_basis) parts.push(_esc(r.timeline_year_basis));
    if(parts.length) h += '<div class="fin-lec-mbasis">' + parts.join(' · ') + '</div>';
    if(!opts.skipEvidence && r.evidence_display)
      h += '<div class="fin-lec-mevi">Evidence: ' + _linkifyStandards(r.evidence_display) + '</div>';
    if(r.internal_ref)   // provenance footnote — the record-source line (display only)
      h += '<div class="fin-lec-msrc">' + _esc(r.internal_ref) + '</div>';
    if(r.id) h += '<div class="fin-lec-mid">' + _esc(r.id) + '</div>';
    return h;
  }
  function _setLecTopic(topic){ _lecTopic = topic || { kind:'master' }; _renderLecture(); }

  function _renderLecture(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    if(!_lecTopic) _lecTopic = { kind:'master' };
    canvas.style.height = '';
    if(_lecTopic.kind === 'contract')  _renderLectureContract(_lecTopic.id);
    else if(_lecTopic.kind === 'word') _renderLectureWord(_lecTopic.id);
    else                               _renderLectureMaster();
    var wrap = document.getElementById('finance-canvas-wrap'); if(wrap) wrap.scrollTop = 0;
  }

  // Wire all lecture cross-links (word / contract / back-to-master / view-ladder).
  function _wireLecture(canvas){
    canvas.querySelectorAll('[data-lec-word]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _setLecTopic({ kind:'word', id:this.getAttribute('data-lec-word') }); });
    });
    canvas.querySelectorAll('[data-lec-contract]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _setLecTopic({ kind:'contract', id:this.getAttribute('data-lec-contract') }); });
    });
    canvas.querySelectorAll('[data-lec-master]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _setLecTopic({ kind:'master' }); });
    });
    canvas.querySelectorAll('[data-lec-ladder]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _openLadderForContract(this.getAttribute('data-lec-ladder')); });
    });
    _wireStdLinks(canvas);   // clickable standard codes inside evidence / standard-landing lines
    _wireFinJumps(canvas);   // "→ read" verse affordances in lecture verse sub-titles
  }
  // Cross-mode hook → set the CONTRACT filter to exactly this contract, then show its ladder.
  function _openLadderForContract(cid){
    F.contract = new Set([cid]);
    _syncAllDD();
    if(_mode === 'ladder') _renderLadder(); else _setMode('ladder');
  }

  // ── Master course ──
  function _renderLectureMaster(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var ql = D.qlayer || {}, words = ql.rows || [], tiers = ql.tiers || {};
    var CHAP = { A:'Chapter 1', B:'Chapter 2', C:'Chapter 3' };

    var h = '<div class="fin-lecture">';
    h += '<h1 class="fin-lec-h1">Master course — Islamic finance from the Qur\'an down</h1>';

    // Chapters 1–3 = tiers A/B/C: heading + tier description + word list.
    ['A','B','C'].forEach(function(tier){
      var tw = words.filter(function(w){ return w.tier === tier; });
      if(!tw.length) return;
      h += '<h2 class="fin-lec-h2">'+CHAP[tier]+' · Tier '+tier+'</h2>';
      if(tiers[tier]) h += '<p class="fin-lec-tierdesc">'+_esc(tiers[tier])+'</p>';
      h += '<ul class="fin-lec-list">';
      tw.forEach(function(w){
        h += '<li><a class="fin-lec-link" data-lec-word="'+_esc(w.id)+'">'+_esc(w.arabic)+' — '+_esc(w.english)+'</a></li>';
      });
      h += '</ul>';
    });

    // Chapter 4 — the ten contracts.
    h += '<h2 class="fin-lec-h2">Chapter 4 · The ten contracts</h2><ul class="fin-lec-list">';
    D.contracts.forEach(function(c){
      if(!/^C\d{2}$/.test(c.id)) return;
      h += '<li><a class="fin-lec-link" data-lec-contract="'+_esc(c.id)+'">'+_esc(c.name)+' — '+_esc(c.description||'')+'</a></li>';
    });
    h += '</ul></div>';

    canvas.innerHTML = h;
    _wireLecture(canvas);
    if(ro) ro.textContent = 'Master course';
  }

  // ── Contract lecture — built ONLY from D.lineage_v4 rows, grouped by fixed stage order ──
  function _renderLectureContract(cid){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var c = _idx.contract[cid] || {};
    var rows = (D.lineage_v4 || []).filter(function(r){ return r.contract === cid; });

    var h = '<div class="fin-lecture">';
    h += '<a class="fin-lec-back" data-lec-master="1">← Master course</a>';
    h += '<h1 class="fin-lec-h1">'+_esc(c.name || cid)+'</h1>';
    if(c.description) h += '<p class="fin-lec-desc">'+_esc(c.description)+'</p>';
    h += '<p class="fin-lec-banner">'+_esc(NOTICE)+'</p>';
    h += '<a class="fin-lec-cross" data-lec-ladder="'+_esc(cid)+'">View ladder →</a>';

    // One section per stage that has rows, in the fixed elevator order. Skip empties.
    LEC_STAGE_ORDER.forEach(function(stage){
      var srows = rows.filter(function(r){ return r.stage === stage; });
      if(!srows.length) return;
      var label = srows[0].stage_label || _stageName(stage);
      h += '<section class="fin-lec-sec"><h2 class="fin-lec-h2">'+_esc(label)+'</h2>';
      if(stage === 'quran')                h += _lecQuranSection(srows);
      else if(stage === 'hadith')          h += _lecHadithSection(srows);
      else if(stage === 'current_status')  h += _lecTodaySection(srows);
      else                                 h += _lecScholarSection(srows);   // tafsir / classical / modern
      h += '</section>';
    });

    h += '</div>';
    canvas.innerHTML = h;
    _wireLecture(canvas);
    if(ro) ro.textContent = 'Lecture · ' + (c.name || cid);
  }
  // Qur'an section — never a year. Verse chips + detail + detail_long + badge.
  function _lecQuranSection(rows){
    var h = '';
    rows.forEach(function(r){
      if(r.position === 'no_direct_verse') h += '<div class="fin-lec-honesty">No dedicated verse</div>';
      var verses = (r.crosstag && r.crosstag.quran_verses) || [];
      if(verses.length){
        h += '<div class="fin-lec-chips">' + verses.map(function(v){ return '<span class="fin-lec-vchip">'+_esc(v)+'</span>'; }).join('') + '</div>';
      }
      if(r.detail)      h += '<p class="fin-lec-body">'+_esc(r.detail)+'</p>';
      if(r.detail_long) h += '<p class="fin-lec-body">'+_esc(r.detail_long)+'</p>';
      h += '<div class="fin-lec-badgeline">'+_lecBadge(r.assurance)+'</div>';
      h += _lecMeta(r);
    });
    return h;
  }
  // Hadith section — sahih first; da'eef corralled under "Supporting narrations only".
  function _lecHadithIsDaeef(r){ return !!(r.hadith_meta && /da/i.test(r.hadith_meta.grading_app || '')); }
  function _lecHadithEntry(r, dim){
    var hm = r.hadith_meta || {};
    var h = '<div class="fin-lec-entry'+(dim ? ' fin-lec-dim' : '')+'">';
    h += '<div class="fin-lec-subtitle">'+_esc(r.name || '')+' '+_lecBadge(r.assurance)+'</div>';
    var coll = _esc(hm.collection_label || ''), num = hm.number ? (' · '+_esc(hm.number)) : '';
    if(coll) h += '<div class="fin-lec-cite">'+coll+num+'</div>';
    if(hm.grading_app) h += '<div><span class="fin-lec-grade">'+_esc(hm.grading_app)+'</span></div>';
    if(hm.narrator)    h += '<div class="fin-lec-narr">Narrator: '+_esc(hm.narrator)+'</div>';
    var body = r.detail_long || r.detail;
    if(body) h += '<p class="fin-lec-body">'+_esc(body)+'</p>';
    h += _lecMeta(r, { skipGrading:true });
    h += '</div>';
    return h;
  }
  function _lecHadithSection(rows){
    var h = '';
    var noHadith  = rows.filter(function(r){ return r.position === 'no_direct_hadith'; });
    var rest      = rows.filter(function(r){ return r.position !== 'no_direct_hadith'; });
    var main      = rest.filter(function(r){ return !_lecHadithIsDaeef(r); });
    var support   = rest.filter(_lecHadithIsDaeef);
    noHadith.forEach(function(r){ h += '<div class="fin-lec-honesty">'+_esc(r.detail_long || r.detail || 'No direct hadith')+'</div>'; });
    main.forEach(function(r){ h += _lecHadithEntry(r, false); });
    if(support.length){
      h += '<h3 class="fin-lec-h3">Supporting narrations only</h3>';
      support.forEach(function(r){ h += _lecHadithEntry(r, true); });
    }
    return h;
  }
  // Year display for a v4 lineage row: single year, or "start–end" when timeline_year_end differs.
  function _lecYear(r){
    if(r.timeline_year == null) return '';
    var y = String(r.timeline_year);
    if(r.timeline_year_end != null && r.timeline_year_end !== r.timeline_year) y += '–' + String(r.timeline_year_end);
    return y;
  }
  // Tafsir / Classical / Modern — scholar/institution sub-entries with date basis.
  function _lecScholarSection(rows){
    var h = '';
    rows.forEach(function(r){
      var yr = (r.timeline_year != null) ? ' ('+_esc(_lecYear(r))+')' : '';
      h += '<div class="fin-lec-entry">';
      h += '<div class="fin-lec-subtitle">'+_esc(r.name || '')+yr+' '+_lecEntityTag(r.entity_type)+' '+_lecBadge(r.assurance)+'</div>';
      if(r.work_title) h += '<div class="fin-lec-work"><em>'+_esc(r.work_title)+'</em></div>';
      var body = r.detail_long || r.detail;
      if(body) h += '<p class="fin-lec-body">'+_esc(body)+'</p>';
      if(r.evidence_display) h += '<p class="fin-lec-evidence"><em>'+_linkifyStandards(r.evidence_display)+'</em></p>';
      if(r.timeline_year_basis) h += '<div class="fin-lec-basis">date basis: '+_esc(r.timeline_year_basis)+'</div>';
      h += _lecMeta(r, { skipEvidence:true, skipBasis:true });
      h += '</div>';
    });
    return h;
  }
  // Today (current_status) — statement + badge + position chip.
  function _lecTodaySection(rows){
    var h = '';
    rows.forEach(function(r){
      var body = r.detail_long || r.detail;
      h += '<div class="fin-lec-entry">';
      if(body) h += '<p class="fin-lec-body">'+_esc(body)+' '+_lecBadge(r.assurance)+'</p>';
      else     h += '<div class="fin-lec-badgeline">'+_lecBadge(r.assurance)+'</div>';
      if(r.position) h += '<div class="fin-lec-chips"><span class="fin-ladder-pos">'+_esc(r.position)+'</span></div>';
      h += _lecMeta(r);
      h += '</div>';
    });
    return h;
  }

  // ── Word lecture — from D.qlayer row ──
  function _renderLectureWord(qid){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var w = ((D.qlayer && D.qlayer.rows) || []).filter(function(x){ return x.id === qid; })[0];
    if(!w){ canvas.innerHTML = '<div class="fin-empty">Word not found.</div>'; return; }

    var h = '<div class="fin-lecture">';
    h += '<a class="fin-lec-back" data-lec-master="1">← Master course</a>';
    h += '<h1 class="fin-lec-h1">'+_esc(w.arabic)+' — '+_esc(w.english)+'</h1>';
    h += '<p class="fin-lec-banner">'+_esc(NOTICE)+'</p>';

    // In the Qur'an (undated).
    var vr = w.verse_refs || [];
    h += '<h2 class="fin-lec-h2">In the Qur\'an (undated)</h2>';
    if(vr.length){
      vr.forEach(function(v){
        h += '<div class="fin-lec-entry"><div class="fin-lec-subtitle">'+_esc(v.ref)+' '+_lecBadge(v.tag)+_finVerseTag(v.ref)+'</div>';
        if(v.gist) h += '<p class="fin-lec-body">'+_esc(v.gist)+'</p>';
        h += '</div>';
      });
    } else {
      h += '<p class="fin-lec-body">No Qur\'an verse in this layer — see the origin note below.</p>';
    }

    // Meaning.
    if(w.meaning_summary && w.meaning_summary.text){
      h += '<h2 class="fin-lec-h2">Meaning</h2><p class="fin-lec-body">'+_esc(w.meaning_summary.text)+' '+_lecBadge(w.meaning_summary.tag)+'</p>';
    }
    // Developed into.
    if(w.developed_into){
      h += '<h2 class="fin-lec-h2">Developed into</h2><p class="fin-lec-body">'+_esc(w.developed_into)+'</p>';
    }
    // Where it lands in the standards.
    var sl = w.standard_landing || [];
    if(sl.length){
      h += '<h2 class="fin-lec-h2">Where it lands in the standards</h2>';
      sl.forEach(function(s){ h += '<p class="fin-lec-body">'+_linkifyStandards(s.ref)+' '+_lecBadge(s.tag)+'</p>'; });
    }
    // Covered by terms — resolved term-name chips.
    var termChips = (w.existing_term_ids || []).map(function(tid){
      var t = _idx.term[tid]; if(!t) return '';
      return '<span class="fin-hub-chip fin-ladder-link" title="'+_esc(tid)+'">'+_esc(t.term_english || t.term_arabic || tid)+'</span>';
    }).filter(Boolean);
    if(termChips.length){
      h += '<h2 class="fin-lec-h2">Covered by terms</h2><div class="fin-lec-chips">'+termChips.join('')+'</div>';
    }
    // Honesty box for gap (same style as HOME).
    var honesty = '';
    if(w.gap && w.gap.note) honesty += '<div class="fin-honesty-line">'+_esc(w.gap.note)+'</div>';
    if(w.origin_flag)       honesty += '<div class="fin-honesty-line">'+_esc(w.origin_flag)+'</div>';
    if(honesty) h += '<div class="fin-honesty">'+honesty+'</div>';

    // SPECIAL CASE — qard: append the worked example "One word's journey".
    var we = D.qlayer && D.qlayer.worked_example_qard_hasan;
    if(we && /^qard/i.test(String(w.arabic || ''))){
      h += '<h2 class="fin-lec-h2">One word\'s journey</h2>';
      if(we.headline) h += '<div class="fin-lec-subtitle">'+_esc(we.headline)+'</div>';
      (we.chain || []).forEach(function(item){
        var sname = _stageName(item.stage);   // maps known stages; falls back to underscores→spaces
        h += '<div class="fin-lec-entry"><div class="fin-lec-subtitle">'+_esc(sname)+' '+(item.tag ? _lecBadge(item.tag) : '')+'</div>';
        if(item.content) h += '<p class="fin-lec-body">'+_esc(item.content)+'</p>';
        if(item.source)  h += '<div class="fin-lec-basis">'+_esc(item.source)+'</div>';
        h += '</div>';
      });
    }

    // Link chips → contract lectures, when a covering term points at a C-id contract.
    var cset = {};
    (w.existing_term_ids || []).forEach(function(tid){
      var t = _idx.term[tid]; if(!t) return;
      _termContracts(t).forEach(function(cc){ cset[cc] = 1; });
    });
    var cids = Object.keys(cset).filter(function(cc){ return _idx.contract[cc]; }).sort();
    if(cids.length){
      h += '<h2 class="fin-lec-h2">Full chain</h2><div class="fin-lec-chips">';
      cids.forEach(function(cc){ h += '<a class="fin-lec-cchip" data-lec-contract="'+_esc(cc)+'">Full chain: '+_esc(_idx.contract[cc].name)+'</a>'; });
      h += '</div>';
    }

    h += '</div>';
    canvas.innerHTML = h;
    _wireLecture(canvas);
    if(ro) ro.textContent = 'Lecture · ' + (w.arabic || '');
  }

  // ── STANDARDS mode — AAOIFI coverage board (D.tracker) + deep notes (D.kb) ──
  var STD_STATUS = {
    processed_deep_note:     { color:'#2ECC71', word:'Deep note ready',                 strike:false },
    pdf_on_disk_unprocessed: { color:'#F59E0B', word:'PDF on disk — not yet processed', strike:false },
    missing:                 { color:'#C36A6A', word:'Not yet acquired',                strike:false },
    superseded:              { color:'#8A94A2', word:'Superseded',                       strike:true  }
  };
  function _stdStatus(s){ return STD_STATUS[s] || { color:'#8A94A2', word:String(s || ''), strike:false }; }
  // Name-check glyph by name_tag (raw tag word never shown — the mapped word rides the title attribute).
  var STD_GLYPH = { verified:'●', plausible:'◐', needs_check:'○' };
  // Flatten a KB array element to display text: strings verbatim; objects → their string values, verbatim, joined.
  function _kbFlat(x){
    if(x == null) return '';
    if(typeof x === 'string') return x;
    if(typeof x === 'object') return Object.keys(x).map(function(k){ return (typeof x[k] === 'string') ? x[k] : null; }).filter(Boolean).join(' — ');
    return String(x);
  }
  // Read-only "Standards coverage lights" section for SETTINGS. Fed ONLY by D.stdLights
  // (standards_lights.json). Purely display — never feeds coverage or report-vetting logic.
  function _stdLightsHtml(){
    if(!D.stdLights || !D.stdLights.standards || !D.stdLights.standards.length){
      return '<div class="fin-lite-empty">standards_lights.json not loaded</div>';
    }
    var rows = D.stdLights.standards;
    // Counts — COMPUTED from rows, never hard-coded.
    var green = 0, red = 0;
    rows.forEach(function(r){ if(r.light === 'green') green++; else if(r.light === 'red') red++; });
    var total = rows.length;

    var h = '<div class="fin-lite-head">'
          + '<span class="fin-lite-title">Standards coverage lights</span>'
          + '<span class="fin-lite-chip">'+green+' covered · '+red+' not held · '+total+' total</span>'
          + '</div>';

    // Group by regulator in first-seen order (never hard-coded).
    var regsOrder = [], byReg = {};
    rows.forEach(function(r){
      var reg = r.regulator || '';
      if(!byReg[reg]){ byReg[reg] = []; regsOrder.push(reg); }
      byReg[reg].push(r);
    });

    function rowHtml(r){
      var color = (r.light === 'green') ? '#2ECC71' : '#C36A6A';
      var cls = 'fin-lite-row' + (r.light === 'red' ? ' fin-lite-red' : '');
      return '<div class="'+cls+'">'
           + '<span class="fin-lite-dot" style="background:'+color+'"></span>'
           + '<span class="fin-lite-id">'+_esc(r.standard_id)+'</span>'
           + '<span class="fin-lite-ttl">'+_esc(r.title)+'</span>'
           + '</div>';
    }

    regsOrder.forEach(function(reg){
      var regRows = byReg[reg];
      var active = regRows.filter(function(r){ return r.superseded_or_withdrawn !== true; });
      var gone   = regRows.filter(function(r){ return r.superseded_or_withdrawn === true; });
      h += '<div class="fin-lite-reg">'+_esc(reg)+'</div>';
      // Sub-group active rows by governance group = leading letters of standard_id.
      var grpOrder = [], byGrp = {};
      active.forEach(function(r){
        var m = String(r.standard_id||'').match(/^[A-Za-z]+/);
        var g = m ? m[0] : '—';
        if(!byGrp[g]){ byGrp[g] = []; grpOrder.push(g); }
        byGrp[g].push(r);
      });
      grpOrder.forEach(function(g){
        h += '<div class="fin-lite-grp">'+_esc(g)+'</div>';
        byGrp[g].forEach(function(r){ h += rowHtml(r); });
      });
      if(gone.length){
        h += '<details class="fin-lite-gone"><summary>Superseded / withdrawn ('+gone.length+')</summary>';
        gone.forEach(function(r){ h += rowHtml(r); });
        h += '</details>';
      }
    });
    return h;
  }

  // Map ONE jurisdiction's stack[] to the codes of standards we actually hold.
  // Keyword match on regulator + family. Stack entries with no regulator we
  // hold (SBP, DSN-MUI, "National standards") match nothing — honest.
  function _jxCodes(jrow){
    var out = new Set();
    (jrow && jrow.stack || []).forEach(function(s){
      s = String(s);
      var reg = /^AAOIFI/i.test(s) ? 'AAOIFI'
              : /CBUAE/i.test(s)   ? 'CBUAE'
              : /^BNM/i.test(s)    ? 'BNM'
              : /^SAMA/i.test(s)   ? 'SAMA'
              : /^SC\b/i.test(s)   ? 'SC'
              : /^IFSB/i.test(s)   ? 'IFSB' : null;
      if(!reg) return;
      var fam = /\bSS\b/.test(s) ? 'SS'
              : /\bGS\b/.test(s) ? 'GS'
              : /\bFAS\b/.test(s)? 'FAS'
              : /HSA/i.test(s)   ? 'HSA'
              : /\bSG\b/i.test(s)? 'SG'
              : /policy doc/i.test(s) ? 'PD' : null;
      ((D.tracker && D.tracker.rows) || []).forEach(function(r){
        if(r.regulator === reg && (!fam || r.family === fam)) out.add(r.code);
      });
    });
    return out;
  }
  function _applyJuris(){
    var codes = new Set();
    (D.juris || []).forEach(function(j){
      if(JURIS.has(j.id)) _jxCodes(j).forEach(function(c){ codes.add(c); });
    });
    VET.standards = codes;
  }

  function _renderStandards(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    _stdSel = null;
    var tr = D.tracker || {}, rows = tr.rows || [], counts = tr.counts || {};
    if(!_jurisInit){ _applyJuris(); _jurisInit = true; }

    // Distinct families in first-seen order (never hard-coded).
    var famsAll = [];
    rows.forEach(function(r){ var f = r.family; if(f && famsAll.indexOf(f) === -1) famsAll.push(f); });

    // Totals line — computed from the data. The multi-regulator tracker nests status/family
    // counts under counts.by_status / counts.by_family; fall back to the old flat shape.
    var bs = counts.by_status || counts;
    var famCount = counts.by_family ? Object.keys(counts.by_family).length : famsAll.length;
    var totals = [
      (counts.total_rows || rows.length) + ' standards',
      (bs.processed_deep_note || 0) + ' deep notes',
      (bs.pdf_on_disk_unprocessed || 0) + ' on disk',
      (bs.missing || 0) + ' missing',
      (bs.superseded || 0) + ' superseded',
      famCount + ' families'
    ].join(' · ');

    // Pillars are per-regulator (AAOIFI: SS/FAS/GS/SOAA/Ethics; IFSB: IFSB-Prudential/…; BNM: BNM-Contract/…).
    // Derive the full pillar set from the data in first-seen order — never hard-coded — so every family renders.
    var pillarsAll = [];
    rows.forEach(function(r){ if(r.pillar && pillarsAll.indexOf(r.pillar) === -1) pillarsAll.push(r.pillar); });
    var showP = pillarsAll.filter(function(p){ return !F.pillar.size || F.pillar.has(p); });

    var h = '<div class="fin-std">';
    // ── LIVE DEMO — API CONNECTION panel (top of SETTINGS). Key value is set in JS, never inlined into this string. ──
    h += '<div class="fin-api">'
       + '<div class="fin-api-title">LIVE DEMO — API CONNECTION</div>'
       + '<div class="fin-api-row">'
       +   '<label class="fin-api-lbl" for="fin-api-key">Anthropic API key</label>'
       +   '<input type="password" id="fin-api-key" class="fin-api-input" placeholder="paste key — stored on this device only" autocomplete="off" spellcheck="false">'
       +   '<button type="button" id="fin-api-test" class="fin-api-btn">TEST CONNECTION</button>'
       +   '<button type="button" id="fin-api-clear" class="fin-api-btn fin-api-clear">CLEAR</button>'
       + '</div>'
       + '<div class="fin-api-row">'
       +   '<label class="fin-api-lbl" for="fin-api-model">Model for live runs</label>'
       +   '<select id="fin-api-model" class="fin-api-input fin-api-model">'
       +     LIVE_MODELS.map(function(m){ return '<option value="'+_esc(m.value)+'"'+((_apiModelGet() === m.value) ? ' selected' : '')+'>'+_esc(m.label)+'</option>'; }).join('')
       +   '</select>'
       + '</div>'
       + '<div class="fin-api-status grey" id="fin-api-status">not connected</div>'
       + '<div class="fin-api-note">Key stays in this browser. Do not use on a public site.</div>'
       + '</div>';
    // ── Read-only Standards coverage lights (additive; independent of the AAOIFI coverage board below) ──
    h += '<div class="fin-std-head"><div class="fin-std-title">Standards coverage</div>'
       + '<div class="fin-std-totals">'+_esc(totals)+'</div></div>';
    // Legend — defined once under the header (two groups on one slim line).
    h += '<div class="fin-std-legend">'
       + '<span class="fin-std-leg-grp"><span class="fin-std-leg-k">Coverage:</span> '
       +   '<span class="fin-std-leg-dot" style="color:#2ECC71">●</span> Available · '
       +   '<span class="fin-std-leg-dot" style="color:#C36A6A">●</span> Not held</span>'
       + '</div>';

    // ── Report-vetting settings bar (pinned above the columns) ──
    var mv = _movementOptions();
    var tradOpts = SECTS.map(function(s){ return {val:s, prefix:'Sect', label:s}; })
      .concat(SCHOOLS.map(function(s){ return {val:s, prefix:'School', label:s}; }))
      .concat(mv.map(function(m){ return {val:m.val, prefix:'Movement', label:m.val, count:m.count}; }));
    h += '<div class="fin-vet-bar">';
    h += '<div class="fin-vet-head"><span class="fin-vet-title">Report vetting scope</span>'
       + '<span class="fin-vet-count" id="fin-vet-count">'+VET.standards.size+' of '+rows.length+' standards selected</span>'
       + '<span class="fin-vet-reset" data-vet-reset="1">Reset scope</span></div>';
    h += '<div class="fin-vet-picker"><span class="fin-vet-plabel">Jurisdiction</span>';
    (D.juris || []).forEach(function(j){
      var muted = (j.tag === 'plausible') ? ' muted' : '';
      h += '<span class="fin-vet-chip'+(JURIS.has(j.id) ? ' sel' : '')+muted+'" data-juris="'+_esc(j.id)+'">'
         + _esc(j.name)
         + ' <span class="fin-jx-tier">'+_esc(j.tier)+'</span></span>';
    });
    h += '</div>';
    h += '<div class="fin-vet-picker"><span class="fin-vet-plabel">Tradition</span>'
       + '<span class="fin-vet-hint"'+(VET.traditions.size ? ' style="display:none"' : '')+'>All traditions</span>';
    tradOpts.forEach(function(o){
      h += '<span class="fin-vet-chip'+(VET.traditions.has(o.val) ? ' sel' : '')+'" data-trad="'+_esc(o.val)+'">'
         + '<span class="fin-vet-chip-pre">'+_esc(o.prefix)+'</span> '+_esc(o.label)
         + (o.count != null ? ' <span class="fin-vet-chip-n">'+o.count+'</span>' : '')+'</span>';
    });
    h += '</div>';
    var CONFOPTS = [['all','All'],['est_ill','Established + Illustrative'],['est','Established only']];
    h += '<div class="fin-vet-picker"><span class="fin-vet-plabel">Confidence</span>';
    CONFOPTS.forEach(function(c){ h += '<span class="fin-vet-chip'+(VET.confidence === c[0] ? ' sel' : '')+'" data-conf="'+c[0]+'">'+_esc(c[1])+'</span>'; });
    h += '</div></div>';
    h += '<div class="fin-vet-note">These selections define the ruleset the demonstration report is vetted against.</div>';

    // ── Issuer → Standard group → standards. Native <details> for collapsing.
    //    Vetting checkboxes (data-vetcode) preserved. Names are the standard
    //    bodies' own category names (RV can override via data later).
    var ISSUER_ORDER = ['AAOIFI','IFSB','BNM','CBUAE','SAMA','SC'];
    var ISSUER_LABEL = {
      AAOIFI:'AAOIFI — Accounting and Auditing Organization for Islamic Financial Institutions',
      IFSB:'IFSB — Islamic Financial Services Board',
      BNM:'BNM — Bank Negara Malaysia',
      CBUAE:'CBUAE — Central Bank of the UAE',
      SAMA:'SAMA — Saudi Central Bank',
      SC:'SC — Securities Commission Malaysia'
    };
    var GROUP_LABEL = {
      SS:"Shari'ah Standards", GS:'Governance Standards', FAS:'Financial Accounting Standards',
      ASIFI:'Auditing Standards', CF:'Conceptual Framework', COE:'Code of Ethics',
      AAB:'AAOIFI Accounting Board', AGEB:'AAOIFI Governance & Ethics Board',
      IFSB:'IFSB Standards', GN:'Guidance Notes', TN:'Technical Notes',
      PD:'Policy Documents', SG:"Shari'ah Governance", HSA:"Higher Shari'ah Authority",
      SC:'Rulings & Guidelines', OTHER:'Other'
    };
    var famActive = F.family.size > 0;
    var issuers = [];
    ISSUER_ORDER.forEach(function(rg){ if(rows.some(function(r){ return r.regulator === rg; })) issuers.push(rg); });
    rows.forEach(function(r){ if(r.regulator && issuers.indexOf(r.regulator) === -1) issuers.push(r.regulator); });
    issuers.forEach(function(rg){
      var iRows = rows.filter(function(r){ return r.regulator === rg && (!famActive || F.family.has(r.family)); });
      if(!iRows.length) return;
      h += '<details class="fin-iss" open><summary class="fin-iss-sum">'
         + '<span class="fin-iss-name">'+_esc(ISSUER_LABEL[rg] || rg)+'</span>'
         + '<span class="fin-iss-n">'+iRows.length+'</span>'
         + '<span class="fin-ckall'+(iRows.every(function(r){ return VET.standards.has(r.code); }) ? ' on' : '')+'" data-ckall="1" title="Select / deselect every standard under this issuer">&#10003; ALL</span></summary>';
      var gOrder = [], byG = {};
      iRows.forEach(function(r){ var f = r.family || 'OTHER'; if(!byG[f]){ byG[f] = []; gOrder.push(f); } byG[f].push(r); });
      gOrder.forEach(function(f){
        var gRows = byG[f];
        var gLabel = (GROUP_LABEL[f] || f) + ' (' + f + ')';
        h += '<details class="fin-grp"><summary class="fin-grp-sum">'
           + '<span class="fin-grp-name">'+_esc(gLabel)+'</span>'
           + '<span class="fin-grp-n">'+gRows.length+'</span>'
           + '<span class="fin-ckall'+(gRows.every(function(r){ return VET.standards.has(r.code); }) ? ' on' : '')+'" data-ckall="1" title="Select / deselect every standard in this group">&#10003; ALL</span></summary>';
        gRows.forEach(function(r){
          var avail = (r.light === 'green');
          var dot = avail ? '#2ECC71' : '#C36A6A';
          h += '<div class="fin-sr fin-sr-open" data-stdcode="'+_esc(r.code)+'">'
             + '<span class="bv-ck fin-std-ck'+(VET.standards.has(r.code) ? ' on' : '')+'" data-vetcode="'+_esc(r.code)+'"></span>'
             + '<span class="fin-sr-dot" style="background:'+dot+'"></span>'
             + '<span class="fin-sr-id">'+_esc(r.code)+'</span>'
             + '<span class="fin-sr-ttl'+(avail ? '' : ' fin-sr-off')+'" title="'+_esc(r.title || '')+'">'+_esc(r.title || '')+'</span>'
             + '</div>';
        });
        h += '</details>';
      });
      h += '</details>';
    });
    // Footer — RUN REPORT pins the UPLOAD → SETTINGS → REPORT flow to the report page.
    h += '<div class="fin-run-bar">'
       + '<span class="fin-run-note">Review the scope above, then generate the demonstration report.</span>'
       + '<button type="button" class="fin-run-btn" id="fin-run-report">RUN REPORT →</button>'
       + '</div>';
    h += '</div>';   // close .fin-std

    canvas.style.height = '';
    canvas.innerHTML = h;
    // LIVE DEMO — API CONNECTION wiring. Key is restored via JS (not embedded in HTML); saved on change; never logged.
    var apiKey = canvas.querySelector('#fin-api-key');
    var apiStatus = canvas.querySelector('#fin-api-status');
    function _apiSetStatus(cls, txt){ if(apiStatus){ apiStatus.className = 'fin-api-status ' + cls; apiStatus.textContent = txt; } }
    if(apiKey){
      apiKey.value = _apiKeyGet();
      apiKey.addEventListener('click', function(e){ e.stopPropagation(); });
      apiKey.addEventListener('change', function(e){ e.stopPropagation(); _apiKeySave(String(this.value || '').trim()); });
    }
    var apiTest = canvas.querySelector('#fin-api-test');
    if(apiTest) apiTest.addEventListener('click', function(e){ e.stopPropagation(); _apiTestConnection(apiKey, _apiSetStatus); });
    var apiClear = canvas.querySelector('#fin-api-clear');
    if(apiClear) apiClear.addEventListener('click', function(e){ e.stopPropagation(); _apiKeyClear(); if(apiKey) apiKey.value = ''; _apiSetStatus('grey', 'not connected'); });
    // Model for live runs — restore saved selection; persist on change. Used by TEST CONNECTION + RUN LIVE REVIEW.
    var apiModel = canvas.querySelector('#fin-api-model');
    if(apiModel){
      apiModel.value = _apiModelGet();
      apiModel.addEventListener('click', function(e){ e.stopPropagation(); });
      apiModel.addEventListener('change', function(e){ e.stopPropagation(); _apiModelSave(this.value); });
    }
    var runBtn = canvas.querySelector('#fin-run-report');
    if(runBtn) runBtn.addEventListener('click', function(e){ e.stopPropagation(); _setMode('report'); });
    // Row checkbox → toggle standard selection; must NOT open the hub card.
    canvas.querySelectorAll('.fin-std-ck').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var code = this.getAttribute('data-vetcode');
        if(VET.standards.has(code)) VET.standards.delete(code); else VET.standards.add(code);
        this.classList.toggle('on', VET.standards.has(code));
        _vetSave(); _stdUpdateCount();
      });
    });
    // Tick-all chip on an issuer/group heading → select every standard under it,
    // or deselect all if they are already all selected. Updates in place (no collapse).
    canvas.querySelectorAll('.fin-ckall').forEach(function(el){
      el.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var box = this.closest('details'); if(!box) return;
        var cks = box.querySelectorAll('.fin-std-ck[data-vetcode]');
        var codes = Array.prototype.map.call(cks, function(c){ return c.getAttribute('data-vetcode'); });
        var all = codes.length && codes.every(function(c){ return VET.standards.has(c); });
        codes.forEach(function(c){ if(all) VET.standards.delete(c); else VET.standards.add(c); });
        Array.prototype.forEach.call(cks, function(c){ c.classList.toggle('on', VET.standards.has(c.getAttribute('data-vetcode'))); });
        // Refresh the filled/outline state of EVERY ✓ALL chip (issuer chips cover group chips too).
        canvas.querySelectorAll('.fin-ckall').forEach(function(chip){
          var d = chip.closest('details'); if(!d) return;
          var cc = d.querySelectorAll('.fin-std-ck[data-vetcode]');
          var allSel = cc.length && Array.prototype.every.call(cc, function(c){ return VET.standards.has(c.getAttribute('data-vetcode')); });
          chip.classList.toggle('on', !!allSel);
        });
        _vetSave(); _stdUpdateCount();
      });
    });
    // Standard row → open the full-text reader (fixes audit A).
    canvas.querySelectorAll('.fin-sr-open').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); openReader(this.getAttribute('data-stdcode')); });
    });
    // Pillar All / None (its own rows only)
    canvas.querySelectorAll('[data-pill-all]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var p = this.getAttribute('data-pill-all');
        rows.forEach(function(r){ if(r.pillar === p) VET.standards.add(r.code); });
        _vetSave(); _renderStandards();
      });
    });
    canvas.querySelectorAll('[data-pill-none]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var p = this.getAttribute('data-pill-none');
        rows.forEach(function(r){ if(r.pillar === p) VET.standards.delete(r.code); });
        _vetSave(); _renderStandards();
      });
    });
    // Family accordion bar → expand/collapse this family; never opens a hub card.
    canvas.querySelectorAll('[data-fam-toggle]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var fm = this.getAttribute('data-fam-toggle');
        if(_famOpen.has(fm)){ _famOpen.delete(fm); if(_famDDOpen === fm) _famDDOpen = null; }
        else _famOpen.add(fm);
        _renderStandards();
      });
    });
    // Per-family PILLAR dropdown (bv-dd widget inside a family body) — same interaction as the toolbar dropdowns.
    canvas.querySelectorAll('.fin-fam-body .bv-dd-wrap[data-dd="fampillar"]').forEach(function(wrap){
      var sec = wrap.closest('.fin-fam-sec'); if(!sec) return;
      var fm = sec.getAttribute('data-fam');
      if(!_famPillar[fm]) _famPillar[fm] = new Set();
      var set = _famPillar[fm];
      var btn = wrap.querySelector('.bv-dd-btn'), panel = wrap.querySelector('.bv-dd-panel'), base = btn.getAttribute('data-base');
      // Reflect current selection on the checkmarks + button count.
      wrap.querySelectorAll('.bv-ck-row').forEach(function(r){
        var on = set.has(r.getAttribute('data-val'));
        r.classList.toggle('checked', on);
        r.querySelector('.bv-ck').classList.toggle('on', on);
      });
      btn.innerHTML = _esc(base)+(set.size ? ' ('+set.size+')' : '')+' <span style="opacity:.6">▾</span>';
      if(_famDDOpen === fm) panel.classList.add('open');   // restore open state across the re-render
      btn.addEventListener('click', function(e){ e.stopPropagation();
        var isOpen = panel.classList.contains('open');
        canvas.querySelectorAll('.fin-fam-body .bv-dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
        if(isOpen){ panel.classList.remove('open'); _famDDOpen = null; }
        else { panel.classList.add('open'); _famDDOpen = fm; }
      });
      panel.addEventListener('click', function(e){ e.stopPropagation(); });
      wrap.querySelectorAll('.bv-ck-row').forEach(function(row){
        row.addEventListener('click', function(e){ e.stopPropagation();
          var v = this.getAttribute('data-val');
          if(set.has(v)) set.delete(v); else set.add(v);
          _famDDOpen = fm; _renderStandards();
        });
      });
      var allEl = wrap.querySelector('[data-all]'), noneEl = wrap.querySelector('[data-none]');
      if(allEl) allEl.addEventListener('click', function(e){ e.stopPropagation(); wrap.querySelectorAll('.bv-ck-row').forEach(function(r){ set.add(r.getAttribute('data-val')); }); _famDDOpen = fm; _renderStandards(); });
      if(noneEl) noneEl.addEventListener('click', function(e){ e.stopPropagation(); set.clear(); _famDDOpen = fm; _renderStandards(); });
    });
    // Jurisdiction chips (multi-select) → set VET.standards from selected jurisdictions' stacks
    canvas.querySelectorAll('[data-juris]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var id = this.getAttribute('data-juris');
        if(JURIS.has(id)) JURIS.delete(id); else JURIS.add(id);
        _applyJuris();
        _renderStandards();
      });
    });
    // Tradition chips (multi-select) — empty = all traditions
    canvas.querySelectorAll('[data-trad]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var v = this.getAttribute('data-trad');
        if(VET.traditions.has(v)) VET.traditions.delete(v); else VET.traditions.add(v);
        this.classList.toggle('sel', VET.traditions.has(v));
        var hint = canvas.querySelector('.fin-vet-hint'); if(hint) hint.style.display = VET.traditions.size ? 'none' : '';
        _vetSave();
      });
    });
    // Confidence chips (single-select) → 'all' | 'est_ill' | 'est'
    canvas.querySelectorAll('[data-conf]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        VET.confidence = this.getAttribute('data-conf');
        canvas.querySelectorAll('[data-conf]').forEach(function(c){ c.classList.toggle('sel', c.getAttribute('data-conf') === VET.confidence); });
        _vetSave();
      });
    });
    // Reset scope → defaults
    canvas.querySelectorAll('[data-vet-reset]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _vetReset(); });
    });
    canvas.addEventListener('click', function(){
      _stdSel = null;
      canvas.querySelectorAll('.fin-std-row.sel').forEach(function(el){ el.classList.remove('sel'); });
      _renderHub();
    });
    _renderHub();
    if(ro) ro.textContent = rows.length + ' standards';
  }
  var _stdRdrEsc = function(e){ if(e.key === 'Escape') _closeStandardText(); };
  function _openStandardText(code){
    _closeStandardText();
    var rel = (D.stdFiles || {})[code];
    var r = _idx.standard[code];
    var title = (r && r.title) || '';
    var ov = document.createElement('div'); ov.className = 'fin-rdr'; ov.id = 'fin-rdr';
    ov.innerHTML = '<div class="fin-rdr-box">'
      + '<div class="fin-rdr-head"><span class="fin-rdr-code">' + _esc(code) + '</span>'
      + '<span class="fin-rdr-title">' + _esc(title) + '</span>'
      + '<button type="button" class="fin-rdr-x" id="fin-rdr-x">&#10005;</button></div>'
      + '<div class="fin-rdr-body" id="fin-rdr-body">Loading…</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function(e){ if(e.target === ov) _closeStandardText(); });
    document.getElementById('fin-rdr-x').addEventListener('click', _closeStandardText);
    document.addEventListener('keydown', _stdRdrEsc);
    var body = document.getElementById('fin-rdr-body');
    if(!rel){ body.textContent = 'Full text not held for this standard yet.'; return; }
    fetch('data/Finance/Standards/' + rel.split('/').map(encodeURIComponent).join('/'))
      .then(function(x){ if(!x.ok) throw new Error('HTTP ' + x.status); return x.text(); })
      .then(function(t){ var b = document.getElementById('fin-rdr-body'); if(b) b.textContent = t; })
      .catch(function(e){ var b = document.getElementById('fin-rdr-body'); if(b) b.textContent = 'Could not load the file (' + e.message + ').'; });
  }
  function _closeStandardText(){ document.removeEventListener('keydown', _stdRdrEsc); var o = document.getElementById('fin-rdr'); if(o) o.remove(); }
    function _renderStandardsReader(){
      var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
      var codes = Object.keys(_idx.standard || {}).sort(function(a,b){ return a.localeCompare(b, undefined, {numeric:true}); });
      var opts = '<option value="">— choose a standard —</option>';
      codes.forEach(function(c){
        var r = _idx.standard[c] || {}; var has = !!(D.stdFiles||{})[c];
        opts += '<option value="'+_esc(c)+'">'+_esc(c)+' — '+_esc(r.title||'')+(has?'':' (no text yet)')+'</option>';
      });
      canvas.innerHTML =
        '<div class="fin-reader-page">'
        + '<div class="fin-reader-head">'
        +   '<button type="button" id="fin-reader-back" class="fin-reader-back">← Back</button>'
        +   '<label class="fin-reader-lbl">Standard</label>'
        +   '<select id="fin-reader-sel" class="fin-reader-sel">'+opts+'</select></div>'
        + '<div class="fin-reader-body" id="fin-reader-body"><div class="fin-reader-empty">Choose a standard above to read its full text.</div></div>'
        + '</div>';
      var sel = document.getElementById('fin-reader-sel');
      sel.addEventListener('change', function(){ _readerLoad(this.value); });
      var _rback = document.getElementById('fin-reader-back');
      if(_rback) _rback.addEventListener('click', function(e){ e.stopPropagation(); _setMode(_readerReturn || 'standards'); });
      if(_readerCode){ sel.value = _readerCode; _readerLoad(_readerCode); }
      _renderHub();
    }
    function _readerLoad(code){
      code = _stdCode(code);
      _readerCode = code || '';
      var body = document.getElementById('fin-reader-body'); if(!body) return;
      var r = _idx.standard[code] || {};
      if(!code){ body.innerHTML = '<div class="fin-reader-empty">Choose a standard above to read its full text.</div>'; return; }
      var rel = (D.stdFiles || {})[code];
      if(!rel){ body.innerHTML = '<div class="fin-reader-ttl">'+_esc(code)+' — '+_esc(r.title||'')+'</div><div class="fin-reader-empty">Full text not held for this standard yet.</div>'; return; }
      body.innerHTML = '<div class="fin-reader-ttl">'+_esc(code)+' — '+_esc(r.title||'')+'</div><pre class="fin-reader-text" id="fin-reader-text">Loading…</pre>';
      fetch('data/Finance/Standards/' + rel.split('/').map(encodeURIComponent).join('/'))
        .then(function(x){ if(!x.ok) throw new Error('HTTP '+x.status); return x.text(); })
        .then(function(t){ var b=document.getElementById('fin-reader-text'); if(b) b.textContent = t; })
        .catch(function(e){ var b=document.getElementById('fin-reader-text'); if(b) b.textContent = 'Could not load the file ('+e.message+').'; });
    }
    function openReader(code){
      _readerCode = code || '';
      if(_mode !== 'reader'){ _readerReturn = _mode; _setMode('reader'); } else { _renderStandardsReader(); }
    }

  function _renderStandardHub(r){
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    var st = _stdStatus(r.status_in_project);

    // Header: code + name + plain-language status.
    var h = '<div class="fin-hub-head"><span class="fin-hub-title">'+_esc(r.code)+' — '+_esc(r.name)+'</span></div>';
    h += '<div class="fin-hub-field"><span class="fin-hub-v">'+_esc(st.word)+'</span></div>';

    var note = (r.note_id && _idx.kbnote[r.note_id]) || null;
    if(!note){
      h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-style:italic;color:#8B95A5">Deep note not yet written.</span></div>';
      h += _reportBackTag(r.code, r.note_id);
      hub.innerHTML = h; _wireStdLinks(hub); return;
    }

    // display_card AS-IS (no rewording): string → body; object → one_liner / what_it_is / why / source_label.
    var dc = note.display_card;
    if(typeof dc === 'string'){
      h += '<div class="fin-hub-sec">Note</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(dc)+'</span></div>';
    } else if(dc && typeof dc === 'object'){
      if(dc.one_liner)                 h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-weight:600">'+_esc(dc.one_liner)+'</span></div>';
      if(dc.what_it_is)                h += '<div class="fin-hub-sec">What it is</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(dc.what_it_is)+'</span></div>';
      if(dc.why_it_matters_to_timeline)h += '<div class="fin-hub-sec">Why it matters</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(dc.why_it_matters_to_timeline)+'</span></div>';
      if(dc.source_label)              h += '<div class="fin-hub-field"><span class="fin-hub-k">Source</span><span class="fin-hub-v">'+_esc(dc.source_label)+'</span></div>';
    }

    // Effective date.
    if(note.timeline_bridge && note.timeline_bridge.effective_date){
      h += '<div class="fin-hub-field"><span class="fin-hub-v">Effective: '+_esc(note.timeline_bridge.effective_date)+'</span></div>';
    }

    // Related standards — muted chips.
    var rel = note.related_standards || [];
    if(rel.length){
      h += '<div class="fin-hub-sec">Related standards</div><div class="fin-hub-chips">'
         + rel.map(function(x){ var t = (typeof x === 'string') ? x : (x.ref || _kbFlat(x)); return '<span class="fin-hub-chip fin-ladder-link">'+_linkifyStandards(t)+'</span>'; }).join('')
         + '</div>';
    }

    // Disputes — collapsible, each rendered verbatim.
    var dis = note.disputes || [];
    if(dis.length){
      h += '<details class="fin-std-debates"><summary>Recorded debates ('+dis.length+')</summary>';
      dis.forEach(function(x){ h += '<div class="fin-std-debate">'+_esc(_kbFlat(x))+'</div>'; });
      h += '</details>';
    }

    // Assurance checkpoints — small chips.
    var kr = note.key_rules_for_assurance || [];
    if(kr.length){
      h += '<div class="fin-hub-sec">Assurance checkpoints</div><div class="fin-hub-chips">'
         + kr.map(function(x){ var t = (typeof x === 'string') ? x : (x.rule || _kbFlat(x)); return '<span class="fin-hub-chip fin-std-rulechip">'+_esc(t)+'</span>'; }).join('')
         + '</div>';
    }

    // Source link — source.url or display_card.source_url, new tab, rel=noopener.
    var url = (note.source && note.source.url) || (dc && typeof dc === 'object' && dc.source_url) || '';
    if(/^https?:\/\//i.test(url)){
      h += '<div class="fin-hub-sec">Source</div><div class="fin-hub-chips"><a class="fin-std-source" href="'+_esc(url)+'" target="_blank" rel="noopener">Source ↗</a></div>';
    }

    h += _reportBackTag(r.code, r.note_id);
    hub.innerHTML = h;
    _wireStdLinks(hub);
  }

  // ── Clickable standard codes — linkify text + open the standard card in the hub (any mode) ──
  // Wraps (SS|FAS|GS|SOAA) + space + number in a link ONLY when that exact code exists in _idx.standard.
  function _linkifyStandards(text){
    if(text == null) return '';
    var s = _esc(String(text));
    return s.replace(/\b(SS|FAS|GS|SOAA)\s+(\d+)\b/g, function(m){
      return _idx.standard[m] ? '<span class="fin-std-link" data-std="'+_esc(m)+'">'+m+'</span>' : m;
    });
  }
  function _wireStdLinks(container){
    if(!container) return;
    container.querySelectorAll('.fin-std-link').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); openReader(this.getAttribute('data-std')); });
    });
    // Back-tag chips: "Cited in demo report →" (appear in any hub that renders a REPORT_REFS record).
    container.querySelectorAll('[data-goto-report]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _setMode('report'); });
    });
  }
  // Small back-tag chip, returned only when one of the given ids/codes is in REPORT_REFS.
  function _reportBackTag(){
    for(var i=0;i<arguments.length;i++){ if(arguments[i] && REPORT_REFS.indexOf(arguments[i]) !== -1)
      return '<div class="fin-hub-chips" style="padding-top:6px"><span class="fin-report-backtag" data-goto-report="1">Cited in demo report →</span></div>'; }
    return '';
  }

  // ── LADDER "Standards coverage" strip — shown in the hub when no node is selected ──
  function _coverageStripHtml(){
    var counts = (D.tracker && D.tracker.counts) || {}, rows = (D.tracker && D.tracker.rows) || [];
    var byFam  = counts.by_family || {};
    var NAMES = { SS:'Shariah (SS)', FAS:'Accounting (FAS)', IFSB:'IFSB', GS:'Governance (GS)',
                  PD:'Regulator PDs', GN:'Guidance Notes', TN:'Technical Notes', ASIFI:'Audit (ASIFI)',
                  SG:'Shariah Gov', HSA:'CBUAE HSA', SC:'SC Malaysia', AAB:'AAOIFI Board',
                  CF:'Conceptual', COE:'Code of Ethics', OTHER:'Other' };
    var proc = {};
    rows.forEach(function(r){
      if(r.status_in_project === 'processed_deep_note') proc[r.family] = (proc[r.family]||0)+1;
    });
    var fams = Object.keys(byFam).sort(function(a,b){ return (byFam[b]||0)-(byFam[a]||0); });
    var h = '<div class="fin-cov"><div class="fin-hub-sec">Standards coverage</div>';
    fams.forEach(function(f){
      var total = byFam[f] || 0; if(!total) return;
      var p = proc[f] || 0;
      var pct = total ? Math.round(p / total * 100) : 0;
      var label = NAMES[f] || f;
      h += '<div class="fin-cov-row"><span class="fin-cov-label">'+_esc(label)+' · '+total+'</span>'
         + '<span class="fin-std-bar" title="'+p+' processed of '+total+'"><span class="fin-std-bar-proc" style="width:'+pct+'%"></span></span></div>';
    });
    h += '<div class="fin-cov-foot"><a class="fin-cov-open" data-open-standards="1">Open standards board →</a></div></div>';
    return h;
  }
  function _wireCoverageStrip(hub){
    var link = hub && hub.querySelector('[data-open-standards]');
    if(link) link.addEventListener('click', function(e){ e.stopPropagation(); _setMode('standards'); });
  }

  // ── REPORT mode — demonstration compliance report on ONE product family (Kafalah / C08) ──
  //    Built ONLY by pulling existing records; every content line names its source. No authored content.
  var REPORT_REFS = ['Q01','Q15','K018','K019','K020','SS 5','SS 19','KB-GS1','C08'];
  function _capFirst(s){ s = String(s || ''); return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
  function _notLoaded(){ return '<span class="fin-rep-missing">record not loaded</span>'; }

  // Cross-tag navigation used by the report ---------------------------------
  function _reportToLadderStage(stage){
    F.contract = new Set(['C08']); _syncAllDD(); _setMode('ladder');
    if(!stage) return;
    var c08 = (D.lineage || []).filter(function(r){ return r.contract === 'C08'; });  // LADDER renders lineage.json (L-ids)
    var row = c08.filter(function(r){ return r.stage === stage; })[0];
    if(row) _selectLadderNode(row.id, c08);
  }
  function _reportToLadderRecord(id){
    var rec = ((D.lineage_v4 || []).concat(D.lineage || [])).filter(function(r){ return r.id === id; })[0];
    _reportToLadderStage(rec ? rec.stage : null);   // open that record's stage in the C08 ladder
  }
  function _reportToWord(qid){ _setMode('home'); _selectQWord(qid); }
  function _reportToLecture(){ _lecTopic = { kind:'contract', id:'C08' }; _setMode('lecture'); }
  function _wireReport(canvas){
    // PRINT — the print stylesheet already turns the report into a clean white sheet.
    var pb = canvas.querySelector('#fin-rep-print');
    if(pb) pb.addEventListener('click', function(e){ e.stopPropagation(); window.print(); });
    // SIGN OFF & ARCHIVE — snapshot the current sheet into the localStorage archive.
    var ab = canvas.querySelector('#fin-rep-archive');
    if(ab) ab.addEventListener('click', function(e){ e.stopPropagation(); _archiveCurrentReport(canvas); });
    // RUN LIVE REVIEW — only wired when an API key is present (button is otherwise disabled).
    var liveBtn = canvas.querySelector('#fin-live-run');
    if(liveBtn && _apiKeyGet()) liveBtn.addEventListener('click', function(e){ e.stopPropagation(); _runPipeline(); });
    // CASE selector — switch the business case; decisions are per-document so reset selection + actions.
    var csel = canvas.querySelector('#fin-rep-caseselect');
    if(csel){
      csel.addEventListener('click', function(e){ e.stopPropagation(); });
      csel.addEventListener('change', function(e){ e.stopPropagation();
        var v = this.value;
        // Blank-start placeholder — stay in the blank state; clear any panel selection so no stale item shows.
        if(v === 'blank'){ _repFabIdx = null; _fabSel = null; _repSel = null; _renderReport(); return; }
        if(v === 'live'){ _repFabIdx = 'live'; _fabSel = null; _renderReport(); return; }
        if(v.indexOf('fab') === 0){
          _repFabIdx = parseInt(v.slice(3), 10); _fabSel = null;   // FAB report has its own panel state; leave _repActions/_repSel untouched
          _renderReport();
          return;
        }
        _repFabIdx = null;
        var idx = parseInt(v, 10);
        _repCase = (D.demo_cases || [])[idx] || null;
        _repSel = null; _repActions = {};
        _renderReport();   // re-renders the hub too
      });
    }
    // Source link — let it open normally (target=_blank) but do not bubble to the sheet.
    canvas.querySelectorAll('[data-rep-source]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); });
    });
    // Clicking anywhere on an open-item row (but not on a traffic light) selects it into the Details hub.
    canvas.querySelectorAll('.fin-rep-open-item').forEach(function(li){
      li.addEventListener('click', function(e){
        var idx = parseInt(this.getAttribute('data-oi'), 10);
        var list = _reportOpenListView();
        _repSel = { idx: idx, rec: list[idx] };
        canvas.querySelectorAll('.fin-rep-open-item').forEach(function(x){ x.classList.remove('sel'); });
        this.classList.add('sel');
        _renderHub();
      });
    });
    // Scholar decisions live on the Details hub (ACCEPT / HOLD / REFER BACK); the list only shows a status dot.
    canvas.querySelectorAll('.fin-oi-dbtn').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation();
        var wrap = this.closest ? this.closest('.fin-oi-decide') : null; if(!wrap) return;
        var id = wrap.getAttribute('data-oiid'), act = this.getAttribute('data-oi-act');
        if(_repActions[id] === act) delete _repActions[id]; else _repActions[id] = act;  // toggle off when re-chosen
        var keep = _repSel;          // preserve the drilled item across the report re-render (which nulls _repSel)
        _renderReport();             // rebuild list dots / dim / count
        _repSel = keep;
        var cv = document.getElementById('finance-canvas');
        if(cv && _repSel){ var li = cv.querySelector('.fin-rep-open-item[data-oi="'+_repSel.idx+'"]'); if(li) li.classList.add('sel'); }
        _renderHub();                // rebuild hub card with the chosen button highlighted, same item selected
      });
    });
    canvas.querySelectorAll('[data-report-stage]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _reportToLadderStage(this.getAttribute('data-report-stage')); });
    });
    canvas.querySelectorAll('[data-report-kl]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _reportToLadderRecord(this.getAttribute('data-report-kl')); });
    });
    canvas.querySelectorAll('[data-report-q]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _reportToWord(this.getAttribute('data-report-q')); });
    });
    canvas.querySelectorAll('[data-report-lecture]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _reportToLecture(); });
    });
    canvas.querySelectorAll('[data-goto-standards]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _setMode('standards'); });
    });
    // ── FAB compliance report wiring ──
    // Row → open its panel in the hub.
    canvas.querySelectorAll('.fin-fab-item').forEach(function(li){
      li.addEventListener('click', function(e){
        _fabSel = parseInt(this.getAttribute('data-fabidx'), 10);
        canvas.querySelectorAll('.fin-fab-item').forEach(function(x){ x.classList.remove('sel'); });
        this.classList.add('sel');
        _renderHub();
      });
    });
    // Scholar stance buttons — toggle (re-click clears), persist, refresh row dot + panel.
    canvas.querySelectorAll('[data-fab-stance]').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation();
        var box = this.closest ? this.closest('.fin-fab-det') : null; if(!box) return;
        var id = box.getAttribute('data-fabid'), act = this.getAttribute('data-fab-stance');
        var cur = _schGet(id) || {};
        var newStance = (cur.stance === act) ? '' : act;
        var ta = box.querySelector('[data-fab-rationale]'), ni = box.querySelector('[data-fab-name]');
        _schUpdate(id, { stance:newStance, rationale: ta ? ta.value : (cur.rationale || ''), scholar_name: ni ? ni.value : (cur.scholar_name || '') });
        _renderReport();   // rebuild list dot + panel; _fabSel persists
      });
    });
    // Rationale / name — save on change (no full re-render, to preserve the cursor); refresh the date line inline.
    canvas.querySelectorAll('[data-fab-rationale]').forEach(function(ta){
      ta.addEventListener('click', function(e){ e.stopPropagation(); });
      ta.addEventListener('change', function(e){ e.stopPropagation();
        var box = this.closest('.fin-fab-det'); if(!box) return; var id = box.getAttribute('data-fabid');
        var ni = box.querySelector('[data-fab-name]');
        var cur = _schUpdate(id, { rationale:this.value, scholar_name: ni ? ni.value : '' });
        var ds = box.querySelector('.fin-fab-date'); if(ds) ds.textContent = cur.date ? ('Date: ' + cur.date) : '';
      });
    });
    canvas.querySelectorAll('[data-fab-name]').forEach(function(ni){
      ni.addEventListener('click', function(e){ e.stopPropagation(); });
      ni.addEventListener('change', function(e){ e.stopPropagation();
        var box = this.closest('.fin-fab-det'); if(!box) return; var id = box.getAttribute('data-fabid');
        var ta = box.querySelector('[data-fab-rationale]');
        var cur = _schUpdate(id, { scholar_name:this.value, rationale: ta ? ta.value : '' });
        var ds = box.querySelector('.fin-fab-date'); if(ds) ds.textContent = cur.date ? ('Date: ' + cur.date) : '';
      });
    });
    _wireStdLinks(canvas);   // tracker-code chips (.fin-std-link) open the standards card
    canvas.querySelectorAll('.fin-rep-quote-jump').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _jumpToDocQuote(el.getAttribute('data-q')); });
    });
  }

  // Fixed dropdown label for a FAB per-document report (same source of truth the selector uses).
  function _fabReportLabel(i){
    var LBL = [
      '10.50 · Facility Offer Letter — LME Murabaha',
      '10.51 · Murabaha Agreement — Sale & Purchase of Commodities',
      '10.60 · Indemnity Undertaking (FAB as Investment Agent)'
    ];
    var rep = (D.compliance_reports || [])[i];
    return LBL[i] || (rep && rep.exhibit ? (rep.exhibit + ' · ' + (rep.case || '')) : ('Report ' + (i+1)));
  }
  // Snapshot the live report sheet into the archive: strip controls, freeze traffic lights to static dots.
  function _archiveCurrentReport(canvas){
    var sheet = canvas.querySelector('.fin-report'); if(!sheet) return;
    var clone = sheet.cloneNode(true);
    var isFab = (_repFabIdx !== null), isLive = (_repFabIdx === 'live');
    // Drop the controls from the frozen copy. The per-item status dot (.fin-oi-dot) is already static — keep as-is.
    // The red AI-GENERATED banner (.fin-live-banner) is deliberately NOT in this list, so it stays in the archived copy.
    // The live-review strip + sign-off hint/confirmation are removed only for the LIVE case (saved cases never carry them).
    var _archStrip = ['#fin-rep-print','#fin-rep-archive','#fin-rep-archived','.fin-rep-caseselect-wrap'];
    if(isLive) _archStrip = _archStrip.concat(['#fin-live-strip','#fin-pipe-extra','.fin-rep-signoff-hint','#fin-rep-signedoff']);
    _archStrip.forEach(function(sel){
      var el = clone.querySelector(sel); if(el && el.parentNode) el.parentNode.removeChild(el);
    });
    if(isFab){
      // The determination buttons/inputs live in the hub, never in the sheet, so the clone already has none.
      // Freeze each item's saved rationale + scholar name + date as static text under its row (stance = its dot).
      clone.querySelectorAll('.fin-fab-item').forEach(function(li){
        var det = _schGet(li.getAttribute('data-fabid'));
        if(det && (det.rationale || det.scholar_name || det.date)){
          var parts = '';
          if(det.rationale)    parts += '<div>Rationale: '+_esc(det.rationale)+'</div>';
          if(det.scholar_name) parts += '<div>Signed: '+_esc(det.scholar_name)+'</div>';
          if(det.date)         parts += '<div>Date: '+_esc(det.date)+'</div>';
          var block = document.createElement('div');
          block.style.cssText = 'margin:4px 0 10px 6px;font-size:12px;color:#5A5A5A;line-height:1.5;';
          block.innerHTML = parts;
          li.appendChild(block);
        }
      });
    }
    var titleEl = sheet.querySelector('.fin-rep-casev');   // first caserow value = business-case title
    var metaEl  = sheet.querySelector('.fin-rep-meta');
    var savedAt = ''; try{ savedAt = new Date().toLocaleString(); }catch(e){ savedAt = ''; }
    var liveN = isLive ? (((_liveCase && _liveCase.open_items) || []).length) : 0;
    _archive.push({
      id:      String(Date.now()),
      savedAt: savedAt,
      title:   isLive ? _liveLabel() : (isFab ? _fabReportLabel(_repFabIdx) : (titleEl ? titleEl.textContent : '')),
      meta:    isLive ? ('LIVE review · ' + liveN + ' open items') : (metaEl ? metaEl.textContent : ''),
      html:    clone.innerHTML
    });
    _archSave(_archive);
    if(isLive){
      // Persistent green confirmation line under the SIGN OFF button.
      var g = canvas.querySelector('#fin-rep-signedoff');
      if(g) g.style.display = '';
    } else {
      // Inline "Archived ✓" confirmation next to the button for 2 seconds.
      var note = canvas.querySelector('#fin-rep-archived');
      if(note){ note.style.display = ''; setTimeout(function(){ if(note) note.style.display = 'none'; }, 2000); }
    }
  }

  // Report-cell chips -------------------------------------------------------
  //   outOfScope → row dimmed (fin-dimmed) with one appended muted exclusion line. Content is never reworded.
  function _repRow(n, check, src, status, outOfScope){
    var excl = outOfScope ? '<div class="fin-rep-excluded">Outside selected ruleset — excluded from this vetting.</div>' : '';
    return '<tr class="fin-rep-row'+(outOfScope ? ' fin-dimmed' : '')+'"><td class="fin-rep-num">'+_esc(n)+'</td><td class="fin-rep-check">'+_esc(check)+'</td>'
         + '<td class="fin-rep-src">'+src+excl+'</td><td class="fin-rep-stat">'+status+'</td></tr>';
  }
  function _qChip(id){ var w = ((D.qlayer && D.qlayer.rows) || []).filter(function(x){ return x.id === id; })[0];
    return '<span class="fin-rep-chip fin-rep-ref" data-report-q="'+_esc(id)+'">'+_esc(id)+(w ? ' '+_esc(w.arabic) : '')+' →</span>'; }
  function _klChip(id){ return '<span class="fin-rep-chip fin-rep-ref" data-report-kl="'+_esc(id)+'">'+_esc(id)+' →</span>'; }
  function _trackerChip(code){ return _idx.standard[code] ? '<span class="fin-std-link" data-std="'+_esc(code)+'">'+_esc(code)+'</span>' : _esc(code); }

  // ── Report vetting scope (reads VET) ──
  // Confidence floor: which assurance tags are IN. 'est' = Established only (plausible-and-below out);
  // 'est_ill' = Established + Illustrative (needs_check out); 'all' = everything in.
  function _confIn(tag){
    var t = String(tag || '').toLowerCase();
    if(VET.confidence === 'est')     return t === 'verified';
    if(VET.confidence === 'est_ill') return t === 'verified' || t === 'plausible';
    return true;
  }
  // A row/record is out of scope when its cited standard code is unticked, or its assurance is below the floor.
  function _rowInScope(code, assurance){
    if(code && !VET.standards.has(code)) return false;
    if(!_confIn(assurance)) return false;
    return true;
  }
  function _confLabel(){ return { all:'All', est_ill:'Established + Illustrative', est:'Established only' }[VET.confidence] || 'All'; }

  // Honest status of every cited record (computed) — each carries its cited code + assurance for scoping.
  function _reportUsedRecords(){
    var ql = (D.qlayer && D.qlayer.rows) || [];
    var c08 = (D.lineage_v4 || []).filter(function(r){ return r.contract === 'C08'; });
    function qw(id){ return ql.filter(function(w){ return w.id === id; })[0]; }
    function kr(id){ return c08.filter(function(r){ return r.id === id; })[0]; }
    function tr(code){ return _idx.standard[code]; }
    var out = [];
    var q01 = qw('Q01'); if(q01){ var l = (q01.standard_landing || []).filter(function(s){ return /^SS 19/.test(s.ref); })[0]; var lt = l ? l.tag : '';
      out.push({ id:'Q01', code:'SS 19', assurance:lt, label:'riba — SS 19 landing', honest:_conf(lt).label, verified: lt === 'verified' }); }
    var q15 = qw('Q15'); if(q15){ var v = (q15.verse_refs || [])[0]; var vt = v ? v.tag : '';
      out.push({ id:'Q15', code:null, assurance:vt, label:'dayn + documentation — '+(v ? v.ref : ''), honest:_conf(vt).label, verified: vt === 'verified' }); }
    [['K018','OIC Fiqh Academy'],['K019','AAOIFI'],['K020','Industry practice']].forEach(function(p){
      var r = kr(p[0]); if(r) out.push({ id:p[0], code:null, assurance:r.assurance, label:p[1], honest:_conf(r.assurance).label, verified: r.assurance === 'verified' });
    });
    ['SS 5','SS 19'].forEach(function(code){
      var r = tr(code); if(r) out.push({ id:code, code:code, assurance:r.name_tag, label:r.name, honest:_stdStatus(r.status_in_project).word, verified: r.status_in_project === 'processed_deep_note' });
    });
    var gs1 = tr('GS 1'); if(gs1) out.push({ id:'KB-GS1', code:'GS 1', assurance:gs1.name_tag, label:gs1.name, honest:_stdStatus(gs1.status_in_project).word, verified: gs1.status_in_project === 'processed_deep_note' });
    return out;
  }
  // The in-scope, not-verified open items — the SAME list section 3 and the Details hub both read.
  function _reportOpenList(){
    return _reportUsedRecords().filter(function(u){ return _rowInScope(u.code, u.assurance) && !u.verified; });
  }
  // Case-scoped view of the open list: when the active case sets open_items_from_map, keep only ids that are
  // keys in its excerpt_map. Kafalah (no flag) is unaffected. This is what the report + hub actually display/count.
  function _reportOpenListView(){
    var list = _reportOpenList();
    var ac = _activeCase();
    if(ac && ac.open_items_from_map){
      var em = ac.excerpt_map || {};
      return list.filter(function(u){ return Object.prototype.hasOwnProperty.call(em, u.id); });
    }
    return list;
  }
  // Count of open items with NO green (accept) action yet — the number shown in the hub header.
  function _openReviewCount(){
    return _reportOpenListView().filter(function(u){ return _repActions[u.id] !== 'accept'; }).length;
  }
  // Refresh the hub's permanent count line in place after a traffic-light click (no full re-render).
  function _updateOpenCount(){
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    var c = hub.querySelector('.fin-rep-hub-count'); if(!c) return;
    var n = _openReviewCount();
    c.textContent = n + ' open item' + (n === 1 ? '' : 's') + ' for scholar review';
  }

  // The business case the report is currently showing — the CASE dropdown selection, else the kafalah default.
  function _activeCase(){ return _repCase || D.demo_case; }

  // ── LIVE REVIEW — send _liveDoc to Claude and install the result as a session-only case ──
  // Structural example = a real saved report with its open-item TEXTS stripped, so the model copies the exact shape.
  function _liveExample(){
    var base = (D.compliance_reports && D.compliance_reports[0]) ? D.compliance_reports[0] : null;
    var ex;
    try{ ex = base ? JSON.parse(JSON.stringify(base)) : {}; }catch(e){ ex = {}; }
    ex.report_id = 'LIVE-REPORT-ID';
    ex.case = '';
    ex.provenance_statement = '';
    // Keep ONE stripped open item as the shape guide (all text fields blanked; tag fixed to plausible).
    ex.open_items = [{
      id: 'OI-1', severity: 'high|medium|low', title: '',
      from_document: { case:'', clause_ref:'', quoted_text:'A VERBATIM SPAN COPIED CHARACTER-FOR-CHARACTER FROM THE DOCUMENT' },
      affected_standards: [{ code:'SS 8', name:'Murabahah', status:'pdf_on_disk_unprocessed' }],
      principle: { text:'', clause_ref:'', tag:'plausible' },
      issue_summary: '',
      scholar_determination: { stance:'', rationale:'', scholar_name:'', date:'' }
    }];
    return ex;
  }
  function _buildLivePrompt(){
    var content =
      'You are a Shari\'ah compliance analyst. Review the DOCUMENT provided below.\n'
    + 'Scope: AAOIFI + CBUAE standards as adopted in the United Arab Emirates. Tradition: Sunni. School: Maliki. '
    + 'You are reviewing from the perspective of the financing bank (the financier).\n'
    + 'Produce between 6 and 9 open items (potential Shari\'ah issues).\n'
    + 'CRITICAL RULES:\n'
    + '- EVERY from_document.quoted_text MUST be copied VERBATIM (character-for-character) from the DOCUMENT text below. Never paraphrase, never summarise, never invent a quote.\n'
    + '- If a clause cannot be quoted verbatim from the DOCUMENT, DROP that item entirely.\n'
    + '- Every principle.tag MUST be exactly "plausible".\n'
    + '- Respond with ONLY raw JSON. No markdown, no code fences, no commentary before or after.\n'
    + 'Return ONLY the JSON object. Do not write any text before or after it. Do not use markdown code fences.\n'
    + 'The JSON MUST match EXACTLY this shape (same keys). open_items is an array of 6 to 9 items, each shaped like the single example item shown:\n'
    + JSON.stringify(_liveExample()) + '\n'
    + '=== DOCUMENT START ===\n'
    + String((_liveDoc && _liveDoc.text) || '').slice(0, 100000) + '\n'
    + '=== DOCUMENT END ===';
    return { model: _apiModelGet(), max_tokens: 50000, messages: [{ role: 'user', content: content }] };
  }
  // Strip accidental ``` fences / prose, then JSON.parse. Returns object or null.
  function _parseLiveJson(txt){
    if(!txt) return null;
    var s = String(txt).trim();
    s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/,'').trim();
    var first = s.indexOf('{'), last = s.lastIndexOf('}');
    if(first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
    try{ return JSON.parse(s); }catch(e){ return null; }
  }
  // Hardened parse for the Tier-3 report: remove ``` fences + a leading "json" label, cut to the first "{"
  // and last "}", straighten curly quotes/apostrophes, then JSON.parse. Returns object or null.
  function _parseTier3Json(txt){
    if(!txt) return null;
    var s = String(txt).trim();
    s = s.replace(/```/g, '').replace(/^json\s*/i, '').trim();
    var first = s.indexOf('{'), last = s.lastIndexOf('}');
    if(first !== -1 && last !== -1 && last > first) s = s.slice(first, last + 1);
    var noTrail = function(x){ return x.replace(/,(\s*[}\]])/g, '$1'); };          // remove trailing commas
    var tries = [
      s,                                                                            // 1) as-is (keeps quotes inside clauses intact)
      noTrail(s),                                                                   // 2) drop trailing commas
      noTrail(s.replace(/[\r\n\t]+/g, ' ')),                                         // 3) collapse line breaks inside strings
      noTrail(s.replace(/[\r\n\t]+/g, ' ').replace(/[“”„‟]/g, '"').replace(/[‘’‚‛]/g, "'"))  // 4) last resort: straighten quotes
    ];
    for(var i = 0; i < tries.length; i++){
      try{ var o = JSON.parse(tries[i]); if(o && typeof o === 'object') return o; }catch(e){}
    }
    return null;
  }
  // Live-case sequential number as a string: 0 → "10.70", 1 → "10.71", …
  function _liveNumStr(i){ return '10.' + (70 + i); }
  // The live case's full label used in the dropdown / header: "10.70 · <filename>".
  function _liveLabel(){ return _liveCase ? (_liveCase._liveNum + ' · ' + (_liveCase._liveName || 'document')) : ''; }
  // True only when a live case exists and EVERY open item carries a saved scholar stance.
  function _liveAllDecided(){
    var rep = _liveCase; if(!rep) return false;
    var items = rep.open_items || [];
    if(!items.length) return false;
    return items.every(function(it){ var d = _schGet(it.id); return !!(d && d.stance); });
  }
  // Grey cost/usage line for a completed live run (empty until usage is recorded).
  // Uses the single price table above; carried verbatim into the archived copy as static text.
  function _liveCostLine(rep){
    if(!rep || !rep._liveUsage) return '';
    var u = rep._liveUsage, model = rep._liveModel || '';
    var tin = u.input_tokens || 0, tout = u.output_tokens || 0;
    var tierSeg = rep._liveTiers ? (' · ' + rep._liveTiers + ' tiers') : '';   // tiered pipeline → "· 3 tiers"
    var s = 'Live review · ' + _modelLabel(model) + tierSeg + ' · ' + tin + ' in + ' + tout + ' out tokens';
    var pr = LIVE_MODEL_PRICING[model];
    if(pr){ var usd = (tin / 1e6) * pr.in + (tout / 1e6) * pr.out; return s + ' ≈ $' + usd.toFixed(2) + ' USD'; }
    return s + ' · pricing: see console.anthropic.com';   // Fable 5 — pricing unknown
  }
  // Normalise a parsed report and install it as the live case, then re-render selected.
  function _installLiveCase(report){
    // Fresh, unique id per live run — NEVER reuse the id the AI echoes from the example ('LIVE-REPORT-ID').
    // Scholar determinations are keyed report_id + '::' + item id, so a shared id would let one document
    // inherit another's saved stances. A distinct id per run keeps each live report's stances its own.
    report.report_id  = 'LIVE-' + Date.now();
    report.case       = report.case || report.title || report.business_case || (_liveDoc ? _liveDoc.name : 'Live document');
    report._liveName = _liveDoc ? _liveDoc.name : '';
    // Sequential live numbering (session only): the first document reviewed → 10.70; a re-run of the
    // SAME document keeps its number; a different document takes the next number (10.71, 10.72, …).
    if(_liveCase && _liveCase._liveNum && _liveCase._liveName === report._liveName){
      report._liveNum = _liveCase._liveNum;
    } else {
      report._liveNum = _liveNumStr(_liveSeqNext);
      _liveSeqNext++;
    }
    report.exhibit    = report._liveNum;   // exhibit reference = the live case number
    report.institution = report.institution || '';
    report.source_url = '';   // live doc — no external source link
    report.applied_standards = Array.isArray(report.applied_standards) ? report.applied_standards : [];
    report.open_items = Array.isArray(report.open_items) ? report.open_items : [];
    // Keep only items that actually carry a verbatim quote; normalise each.
    report.open_items = report.open_items.filter(function(it){ return it && it.from_document && String(it.from_document.quoted_text || '').trim(); });
    report.open_items.forEach(function(it, i){
      it.id = it.id || ('OI-' + (i + 1));
      it.from_document = it.from_document || {};
      it.affected_standards = Array.isArray(it.affected_standards) ? it.affected_standards : [];
      it.principle = it.principle || {};
      it.principle.tag = 'plausible';   // guardrail
      it.scholar_determination = { stance:'', rationale:'', scholar_name:'', date:'' };
    });
    report._live = true;
    _liveCase = report;           // replaces any previous live case
    _repFabIdx = 'live';
    _fabSel = null;
    _renderReport();
  }
  function _runLiveReview(){
    var key = _apiKeyGet();
    if(!key || !_liveDoc || !_liveDoc.text) return;
    var model = _apiModelGet();   // captured at request time so the cost line matches what was actually sent
    var statusEl = document.getElementById('fin-live-status');
    var btn = document.getElementById('fin-live-run');
    function setStatus(cls, txt){ if(statusEl){ statusEl.className = 'fin-live-status ' + cls; statusEl.textContent = txt; } }
    function fail(reason){
      setStatus('red', 'Live review failed — ' + String(reason || 'unknown error').slice(0, 140) + '. Saved demo cases are unaffected.');
      var b = document.getElementById('fin-live-run'); if(b) b.disabled = false;
    }
    if(btn) btn.disabled = true;
    setStatus('amber', 'Reviewing document with Claude — this takes 1–2 minutes...');
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify(_buildLivePrompt())
    }).then(function(r){
      return r.json().then(function(j){ return { status: r.status, j: j }; }).catch(function(){ return { status: r.status, j: null }; });
    }).then(function(res){
      if(res.status !== 200){
        fail((res.j && res.j.error && res.j.error.message) ? res.j.error.message : ('HTTP ' + res.status));
        return;
      }
      // Truncated response — the model hit the token ceiling, so the JSON is incomplete. Give a specific hint.
      if(res.j && res.j.stop_reason === 'max_tokens'){
        setStatus('red', 'Document too long for a single pass — try a shorter document or a saved case.');
        var bMax = document.getElementById('fin-live-run'); if(bMax) bMax.disabled = false;
        return;
      }
      var txt = '';
      try{ txt = (res.j.content || []).map(function(c){ return c.text || ''; }).join(''); }catch(e){ txt = ''; }
      var report = _parseLiveJson(txt);
      if(!report || typeof report !== 'object'){
        console.error('Live review — raw AI response (could not be parsed as JSON):\n', txt);   // full text to console only, never the UI
        setStatus('red', 'Live review failed — the AI response could not be read. Try again, or use a saved case.');
        var bParse = document.getElementById('fin-live-run'); if(bParse) bParse.disabled = false;
        return;
      }
      var items = Array.isArray(report.open_items) ? report.open_items.filter(function(it){ return it && it.from_document && String(it.from_document.quoted_text || '').trim(); }) : [];
      if(!items.length){ fail('no quotable open items were returned'); return; }
      // Record the model + token usage for the cost line (carried into the live case + its archive).
      var usage = (res.j && res.j.usage) || {};
      report._liveModel = model;
      report._liveUsage = { input_tokens: usage.input_tokens || 0, output_tokens: usage.output_tokens || 0 };
      _installLiveCase(report);
    }).catch(function(){ fail('network blocked'); });
  }

  // ══ TIERED LIVE-REVIEW PIPELINE — Tier 1 → Tier 2 → Tier 3 ═══════════════════════════
  //    Replaces the single-pass path on the RUN button. _liveExample() + _installLiveCase()
  //    are shared with the pipeline (schema + assembly); _buildLivePrompt / _runLiveReview
  //    stay intact but unreachable.

  // RECIPE MODULE — the single home for every tier's instruction text. Assembled at runtime
  // from fragments (never stored as one readable block). All tiers read from here.
  var _pipelineRecipe = (function(){
    var _scope = [
      'Scope: AAOIFI + CBUAE standards as adopted in the United Arab Emirates.',
      'Tradition: Sunni. School: Maliki.',
      'You review from the perspective of the financing bank (the financier).'
    ];
    var _jsonOnly = [
      'Respond with ONLY raw JSON. No markdown, no code fences, no commentary before or after.'
    ];
    var _t1Task = [
      'You are a Shari\'ah compliance analyst performing TIER 1 of a tiered review — a fast scan.',
      'Read the DOCUMENT below and identify every Islamic-finance-relevant term, instrument, and risk word actually present in it',
      '(e.g. profit benchmarks, indices, floors, guarantees, indemnities, agency roles, late-payment devices, tawarruq / commodity mechanics).',
      'List at most 20, most material first. Include ONLY terms genuinely present in the document text.'
    ];
    var _t1Shape = [
      'Return ONLY this JSON object (same keys):',
      '{ "terms": [ { "term": "...", "why_flagged": "one line" } ] }'
    ];
    var _t2Task = [
      'You are a Shari\'ah compliance analyst performing TIER 2 of a tiered review — verbatim clause extraction.',
      'You are given the FLAGGED TERMS found in Tier 1 and the same DOCUMENT.',
      'For each flagged term, locate the clause(s) in the DOCUMENT where that term operates and return the clause text COPIED VERBATIM (character-for-character) from the DOCUMENT — never paraphrase, never summarise, never invent.',
      'Each quoted_text MUST be ONE CONTIGUOUS span of at most 60 words, copied character-for-character, with NO ellipses, no "...", and no summarising.',
      'If a clause is longer than 60 words, quote only its most operative 60-word span.',
      'Include a clause reference: the clause number or heading if the DOCUMENT has one, otherwise a short locator.',
      'Add one line on what the clause does.',
      'If a term has no real clause in the DOCUMENT, return that entry with "no_clause": true instead of inventing any text.',
      'Return at most 15 clause entries; prefer the highest-risk terms.'
    ];
    var _t2Shape = [
      'Return ONLY this JSON object (same keys):',
      '{ "clauses": [ { "term":"...", "clause_ref":"...", "quoted_text":"...", "function":"one line", "no_clause":false } ] }'
    ];
    // Amended brief for the automatic retry after a truncated (max_tokens) Tier-2 response — fewer, shorter quotes.
    var _t2Tight = [
      'TIGHTER BRIEF (the previous response was cut off — this overrides the count/length above):',
      '- Return AT MOST 10 clause entries.',
      '- Each quoted_text must be at most 40 words.'
    ];
    var _t3Task = [
      'You are a Shari\'ah compliance analyst performing TIER 3 of a tiered review — testing the extracted clauses against the standards.',
      'You are given the CLAUSES extracted and verbatim-checked in Tier 2.',
      'For each clause where a genuine Shari\'ah issue exists, produce one open item. Produce between 3 and 9 open items in total — fewer strong items beat forced weak ones, but never return an empty list when any listed clause raises a genuine question.',
      'Prefer clauses whose quote was verbatim-confirmed; a clause flagged "unverified quote" may be used but is weaker evidence.'
    ];
    var _t3Rules = [
      'CRITICAL RULES:',
      '- EVERY open item MUST include from_document with quoted_text — the Tier-2 quoted_text of the clause it is about, copied EXACTLY — never rewrite, paraphrase, summarise, shorten, or add ellipses. An item without a clause quote is invalid and must not be returned.',
      '- If a clause carries no genuine issue, do not force an item for it.',
      '- Every principle.tag MUST be exactly "plausible".',
      '- Respond with ONLY raw JSON. No markdown, no code fences, no commentary before or after.',
      'Return ONLY the JSON object. Do not write any text before or after it. Do not use markdown code fences.',
      'The JSON MUST match EXACTLY this shape (same keys). open_items is an array of 6 to 9 items, each shaped like the single example item shown:'
    ];
    // Amended brief for the automatic retry after a truncated (max_tokens) response — fewer, shorter items.
    var _t3Tight = [
      'TIGHTER BRIEF (the previous response was too long and was cut off — this overrides the item count above):',
      '- Produce AT MOST 6 open items.',
      '- principle.text must be at most 60 words.',
      '- issue_summary must be at most 60 words.'
    ];
    function _join(parts){ return parts.join('\n'); }
    function _doc(text){ return '=== DOCUMENT START ===\n' + String(text || '').slice(0, 100000) + '\n=== DOCUMENT END ==='; }
    function _terms(list){ return '=== FLAGGED TERMS (from Tier 1) ===\n' + list + '\n=== END TERMS ==='; }
    // Serialise the Tier-2 clauses (drop no_clause / empty) for the Tier-3 prompt, carrying the verbatim status.
    function _clauseBlock(clauses){
      var lines = (clauses || []).filter(function(c){ return !c.no_clause && c.quoted_text; }).map(function(c, i){
        return (i + 1) + '. term: ' + c.term
          + '\n   clause_ref: ' + (c.clause_ref || '(none)')
          + '\n   verbatim_status: ' + (c.unverified_quote ? 'UNVERIFIED — weaker evidence' : 'verbatim-confirmed')
          + '\n   function: ' + (c.function || '')
          + '\n   quoted_text: ' + c.quoted_text;
      });
      return '=== TIER-2 CLAUSES ===\n' + lines.join('\n') + '\n=== END CLAUSES ===';
    }
    return {
      // Tier 1 — term / instrument / risk-word scan.
      tier1: function(text){ return _join([].concat(_t1Task, _scope, _t1Shape, _jsonOnly)) + '\n' + _doc(text); },
      // Tier 2 — verbatim clause extraction, chained on Tier 1's terms.
      // tight=true appends the amended brief used for the automatic retry after a truncated response.
      tier2: function(text, terms, tight){
        var listStr = (terms || []).map(function(t){ return '- ' + t.term + (t.why_flagged ? ' — ' + t.why_flagged : ''); }).join('\n');
        return _join([].concat(_t2Task, (tight ? _t2Tight : []), _scope, _t2Shape, _jsonOnly)) + '\n' + _terms(listStr) + '\n' + _doc(text);
      },
      // Tier 3 — issue-finding against standards; open items must reuse Tier-2 quotes EXACTLY.
      // Uses _liveExample() so the JSON shape is byte-for-byte the existing live-report schema.
      // tight=true appends the amended brief used for the automatic retry after a truncated response.
      tier3: function(clauses, tight){
        return _join([].concat(_t3Task, (tight ? _t3Tight : []), _scope, _t3Rules)) + '\n' + JSON.stringify(_liveExample()) + '\n' + _clauseBlock(clauses);
      }
    };
  })();

  // One browser-direct POST to Anthropic; resolves { status, j }. Rejects { reason } on network failure.
  function _pipeApiCall(key, model, promptText, maxTokens, tools, toolChoice){
    var body = { model: model, max_tokens: maxTokens, messages: [{ role: 'user', content: promptText }] };
    if(tools){ body.tools = tools; if(toolChoice) body.tool_choice = toolChoice; }
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    }).then(function(r){
      return r.json().then(function(j){ return { status: r.status, j: j }; }).catch(function(){ return { status: r.status, j: null }; });
    }, function(){ throw { reason: 'network blocked' }; });
  }
  function _pipeReason(err){
    if(err && err.reason)  return String(err.reason).slice(0, 140);
    if(err && err.message) return String(err.message).slice(0, 140);
    return 'unknown error';
  }
  // Shared normalisation for the verbatim guard: straighten curly quotes/apostrophes, collapse all
  // whitespace/newlines to single spaces, trim. Case preserved.
  function _normText(s){
    s = String(s == null ? '' : s);
    s = s.replace(/[‘’‚‛′]/g, "'").replace(/[“”„‟″]/g, '"');
    return s.replace(/\s+/g, ' ').trim();
  }
  // Normalise a model-returned quote for comparison: shared normalisation, then strip any leading/trailing
  // ellipsis (… or "..") or quote marks the model may have added around the span.
  function _normQuote(s){
    return _normText(s).replace(/^(?:["'…\s]|\.{2,})+/, '').replace(/(?:["'…\s]|\.{2,})+$/, '').trim();
  }
  // Progress strip — one segment per tier. Amber while running, green ✓ on complete, red + plain reason on failure.
  function _pipeStripHtml(pipe){
    if(!pipe) return '';
    var segs = [];
    function fail(n, reason){ return '<span class="fin-pipe-seg red">TIER ' + n + ' failed — ' + _esc(reason) + '. Saved demo cases are unaffected.</span>'; }
    // TIER 1
    if(pipe.error && pipe.errorTier === 1){
      segs.push(fail(1, pipe.error));
    } else if(pipe.tier1){
      var n1 = (pipe.tier1.terms || []).length;
      segs.push('<span class="fin-pipe-seg green">TIER 1 &#10003; ' + n1 + ' term' + (n1 === 1 ? '' : 's') + '</span>');
    } else {
      segs.push('<span class="fin-pipe-seg amber">TIER 1 — scanning terms…</span>');
    }
    // TIER 2 — shown once Tier 1 has completed (or Tier 2 itself failed).
    if(pipe.error && pipe.errorTier === 2){
      segs.push(fail(2, pipe.error));
    } else if(pipe.tier2){
      var n2 = (pipe.tier2.clauses || []).length, m2 = pipe.tier2.verbatim_ok || 0;
      segs.push('<span class="fin-pipe-seg green">TIER 2 &#10003; ' + n2 + ' clause' + (n2 === 1 ? '' : 's') + ' (' + m2 + ' verbatim-checked)</span>');
    } else if(pipe.tier2Notice && pipe.tier1 && !pipe.error){
      segs.push('<span class="fin-pipe-seg amber">' + _esc(pipe.tier2Notice) + '</span>');   // transient truncation/retry notice
    } else if(pipe.tier1 && !pipe.error){
      segs.push('<span class="fin-pipe-seg amber">TIER 2 — reading clauses…</span>');
    }
    // TIER 3 — shown once Tier 2 has completed (or Tier 3 itself failed).
    if(pipe.error && pipe.errorTier === 3){
      segs.push(fail(3, pipe.error));
    } else if(pipe.tier3){
      segs.push('<span class="fin-pipe-seg green">TIER 3 &#10003; — report ready</span>');
    } else if(pipe.tier3Notice && pipe.tier2 && !pipe.error){
      segs.push('<span class="fin-pipe-seg red">' + _esc(pipe.tier3Notice) + '</span>');   // transient truncation/retry notice
    } else if(pipe.tier2 && !pipe.error){
      segs.push('<span class="fin-pipe-seg amber">TIER 3 — testing against standards…</span>');
    }
    return segs.join('<span class="fin-pipe-sep"> · </span>');
  }
  // Under-strip block — Tier-1 term chips, then (after Tier 2) the compact clause list + Tier-3 note.
  function _pipeExtraHtml(pipe){
    if(!pipe || pipe.error || !pipe.tier1) return '';
    var h = '';
    // Tier-1 term chips.
    var terms = pipe.tier1.terms || [];
    if(terms.length){
      h += '<div class="fin-pipe-chips"><span class="fin-pipe-chips-lbl">terms found:</span> '
         + terms.map(function(t){ return '<span class="fin-pipe-chip"' + (t.why_flagged ? ' title="' + _esc(t.why_flagged) + '"' : '') + '>' + _esc(t.term) + '</span>'; }).join(' ')
         + '</div>';
    } else {
      h += '<div class="fin-pipe-chips fin-pipe-none">No Islamic-finance terms were flagged in this document.</div>';
    }
    // Tier-2 clause list (compact) + stop note.
    if(pipe.tier2){
      var clauses = pipe.tier2.clauses || [];
      if(clauses.length){
        h += '<div class="fin-pipe-clauses"><div class="fin-pipe-clauses-lbl">clauses extracted:</div>';
        clauses.forEach(function(c){
          var ref = c.clause_ref ? _esc(c.clause_ref) : '—';
          h += '<div class="fin-pipe-clause">'
             + '<span class="fin-pipe-clause-term">' + _esc(c.term) + '</span>'
             + '<span class="fin-pipe-clause-ref">' + ref + '</span>';
          if(c.no_clause){
            h += '<span class="fin-pipe-clause-none">no clause found</span>';
          } else {
            h += '<span class="fin-pipe-clause-quote"' + (c.quoted_text ? ' title="' + _esc(c.quoted_text) + '"' : '') + '>&ldquo;' + _esc(_clip(c.quoted_text, 120)) + '&rdquo;</span>'
               + (c.unverified_quote
                    ? '<span class="fin-pipe-clause-flag">unverified quote</span>'
                    : '<span class="fin-pipe-clause-ok">&#10003; verbatim</span>');
          }
          h += '</div>';
        });
        h += '</div>';
      } else {
        h += '<div class="fin-pipe-chips fin-pipe-none">No clauses were extracted.</div>';
      }
    }
    return h;
  }
  // Repaint strip + extra block from current _pipe state (during a run, between full _renderReport calls).
  function _pipePaint(){
    var statusEl = document.getElementById('fin-live-status');
    var extraEl  = document.getElementById('fin-pipe-extra');
    if(statusEl){ statusEl.className = 'fin-live-status'; statusEl.innerHTML = _pipeStripHtml(_pipe); }
    if(extraEl){ extraEl.innerHTML = _pipeExtraHtml(_pipe); }
  }
  // TIER 1 — scan the document for Islamic-finance terms. Stores terms + token usage on _pipe.
  function _pipeTier1(key, model){
    var promptText = _pipelineRecipe.tier1((_liveDoc && _liveDoc.text) || '');
    return _pipeApiCall(key, model, promptText, 2000).then(function(res){
      if(res.status !== 200){
        throw { reason: (res.j && res.j.error && res.j.error.message) ? res.j.error.message : ('HTTP ' + res.status) };
      }
      if(res.j && res.j.stop_reason === 'max_tokens'){ throw { reason: 'the term scan was truncated — try a shorter document' }; }
      var txt = '';
      try{ txt = (res.j.content || []).map(function(c){ return c.text || ''; }).join(''); }catch(e){ txt = ''; }
      var parsed = _parseLiveJson(txt);   // tolerant JSON extraction — same helper as the single-pass path
      if(!parsed || !Array.isArray(parsed.terms)){
        console.error('Tier 1 — raw AI response (could not be parsed as JSON):\n', txt);   // console only, never the UI
        throw { reason: 'the term-scan response could not be read' };
      }
      var terms = parsed.terms
        .filter(function(t){ return t && String(t.term || '').trim(); })
        .slice(0, 20)
        .map(function(t){ return { term: String(t.term).trim(), why_flagged: String(t.why_flagged || '').trim() }; });
      _pipe.tier1 = { terms: terms };
      var u = (res.j && res.j.usage) || {};
      _pipe.usage.push({ tier: 'tier1', model: model, input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0 });
      _pipePaint();
    }).catch(function(err){ throw { tier: 1, reason: _pipeReason(err) }; });
  }
  // TIER 2 — verbatim clause extraction, chained on Tier 1's terms. Stores clauses + usage on _pipe.
  function _pipeTier2(key, model, tight){
    var terms = (_pipe && _pipe.tier1 && _pipe.tier1.terms) || [];
    var promptText = _pipelineRecipe.tier2((_liveDoc && _liveDoc.text) || '', terms, !!tight);
    return _pipeApiCall(key, model, promptText, 50000).then(function(res){
      var stop   = res.j && res.j.stop_reason;
      var outTok = (res.j && res.j.usage && res.j.usage.output_tokens) || 0;
      console.info('Tier 2 attempt' + (tight ? ' (tight retry)' : '') + ' — status: ' + res.status + ', stop_reason: ' + stop + ', output_tokens: ' + outTok);   // diagnosable
      if(res.status !== 200){
        throw { reason: (res.j && res.j.error && res.j.error.message) ? res.j.error.message : ('HTTP ' + res.status) };
      }
      // Truncation → do NOT fail. First time: amber notice + one automatic retry with the tighter brief.
      if(stop === 'max_tokens'){
        if(!tight){
          if(_pipe) _pipe.tier2Notice = 'TIER 2 — response cut off, retrying with a tighter brief…';
          _pipePaint();
          return _pipeTier2(key, model, true);
        }
        throw { reason: 'the clause pass was truncated even after the tighter retry — try a shorter document' };
      }
      if(_pipe) _pipe.tier2Notice = null;   // full response arrived — clear any retry notice
      var txt = '';
      try{ txt = (res.j.content || []).map(function(c){ return c.text || ''; }).join(''); }catch(e){ txt = ''; }
      var parsed = _parseLiveJson(txt);   // tolerant JSON extraction — same helper as the other passes
      if(!parsed || !Array.isArray(parsed.clauses)){
        console.error('Tier 2 — raw AI response (could not be parsed as JSON):\n', txt);   // console only, never the UI
        throw { reason: 'the clause response could not be read' };
      }
      var normDoc = _normText((_liveDoc && _liveDoc.text) || '');
      var clauses = parsed.clauses
        .filter(function(c){ return c && (String(c.term || '').trim() || String(c.quoted_text || '').trim()); })
        .slice(0, 15)
        .map(function(c){
          var cleanQuote = _normQuote(c.quoted_text || '');   // straighten quotes, collapse whitespace, strip stray ellipsis/quote marks
          var noClause    = (c.no_clause === true) || !cleanQuote;
          // VERBATIM GUARD — code-side, not trust: the cleaned quote must actually appear in the document.
          var verified = (!noClause && cleanQuote) ? (normDoc.indexOf(cleanQuote) !== -1) : false;
          return {
            term: String(c.term || '').trim(),
            clause_ref: String(c.clause_ref || '').trim(),
            quoted_text: cleanQuote,
            function: String(c.function || '').trim(),
            no_clause: noClause,
            unverified_quote: (!noClause && cleanQuote) ? !verified : false
          };
        });
      var verbatimN = clauses.filter(function(c){ return !c.no_clause && c.quoted_text && !c.unverified_quote; }).length;
      _pipe.tier2 = { clauses: clauses, verbatim_ok: verbatimN };
      var u = (res.j && res.j.usage) || {};
      _pipe.usage.push({ tier: 'tier2', model: model, input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0 });
      _pipePaint();
    }).catch(function(err){ throw { tier: 2, reason: _pipeReason(err) }; });
  }
  // Guarantee quote fidelity: overwrite each open item's from_document.quoted_text with the matching
  // Tier-2 verbatim text (matched by clause_ref first, then by quote containment). Tier-2 text always wins.
  function _t3EnforceQuotes(report, clauses){
    var items = (report && Array.isArray(report.open_items)) ? report.open_items : [];
    var pool  = (clauses || []).filter(function(c){ return !c.no_clause && c.quoted_text; });
    if(!pool.length) return;
    items.forEach(function(it){
      if(!it || !it.from_document) return;
      var fd = it.from_document;
      var ref = _normText(fd.clause_ref || '');
      var q   = _normQuote(fd.quoted_text || '');
      var match = null;
      var byRef = ref ? pool.filter(function(c){ return _normText(c.clause_ref) === ref; }) : [];
      if(byRef.length === 1){ match = byRef[0]; }
      else if(byRef.length > 1){ match = byRef.filter(function(c){ return _normQuote(c.quoted_text) === q; })[0] || byRef[0]; }
      if(!match && q){
        match = pool.filter(function(c){ var cq = _normQuote(c.quoted_text); return cq === q || cq.indexOf(q) !== -1 || q.indexOf(cq) !== -1; })[0];
      }
      if(match){
        fd.quoted_text = match.quoted_text;                                  // fidelity — Tier-2 verbatim wins
        if(!String(fd.clause_ref || '').trim() && match.clause_ref) fd.clause_ref = match.clause_ref;
      }
    });
  }
  // TIER 3 — test the Tier-2 clauses against the standards → the live-report schema, then install the case.
  // Shrink the Tier-2 clause pool for Tier 3: all verbatim-confirmed clauses + at most 3 flagged unverified ones.
  function _t3SendClauses(){
    var full = (_pipe && _pipe.tier2 && _pipe.tier2.clauses) || [];
    var usable = full.filter(function(c){ return !c.no_clause && c.quoted_text; });
    var confirmed  = usable.filter(function(c){ return !c.unverified_quote; });
    var unverified = usable.filter(function(c){ return c.unverified_quote; }).slice(0, 3);
    return confirmed.concat(unverified);
  }
  function _pipeTier3(key, model, tight, attempt){
    attempt = attempt || 1;                             // demo-proofing: up to 3 automatic attempts before failing
    var sendClauses = _t3SendClauses();                 // fewer, better-grounded clauses (item 2)
    var fullPool    = (_pipe && _pipe.tier2 && _pipe.tier2.clauses) || [];   // match quotes against the whole pool
    var promptText  = _pipelineRecipe.tier3(sendClauses, !!tight);
    // One retry path for every recoverable Tier-3 outcome (empty items / unreadable response):
    // silently re-ask with the tighter brief instead of failing the whole run.
    function _t3RetryOrFail(msg){
      if(attempt < 3){
        if(_pipe) _pipe.tier3Notice = 'TIER 3 — ' + msg + ' Retrying automatically (attempt ' + (attempt + 1) + ' of 3)…';
        _pipePaint();
        return _pipeTier3(key, model, true, attempt + 1);
      }
      throw { reason: msg + ' (3 attempts made). Run again or pick a saved case' };
    }
    var _t3Tool = [{ name:'emit_review', description:'Return the Tier-3 Shari\'ah review as structured JSON.', input_schema:{ type:'object', properties:{ report_id:{type:'string'}, case:{type:'string'}, provenance_statement:{type:'string'}, open_items:{ type:'array', minItems:1, items:{ type:'object', properties:{ from_document:{ type:'object', properties:{ clause_ref:{type:'string'}, quoted_text:{type:'string'} }, required:['quoted_text'] } }, required:['from_document'] } } }, required:['open_items'] } }];
    return _pipeApiCall(key, model, promptText, 50000, _t3Tool, { type:'tool', name:'emit_review' }).then(function(res){
      var stop   = res.j && res.j.stop_reason;
      var outTok = (res.j && res.j.usage && res.j.usage.output_tokens) || 0;
      console.info('Tier 3 attempt' + (tight ? ' (tight retry)' : '') + ' — status: ' + res.status + ', stop_reason: ' + stop + ', output_tokens: ' + outTok);   // diagnosable (item 4)
      if(res.status !== 200){
        throw { reason: (res.j && res.j.error && res.j.error.message) ? res.j.error.message : ('HTTP ' + res.status) };
      }
      // Truncation → do NOT parse. First time: transient red notice + one automatic retry with the tighter brief.
      if(stop === 'max_tokens'){
        return _t3RetryOrFail('response too long and was cut off.');
      }
      if(_pipe) _pipe.tier3Notice = null;   // full response arrived — clear any retry notice
      var report = null;
      try{ var tu = (res.j.content || []).filter(function(c){ return c && c.type === 'tool_use'; })[0]; if(tu) report = tu.input; }catch(e){}
      if(!report || typeof report !== 'object'){
        var txt = ''; try{ txt = (res.j.content || []).map(function(c){ return c.text || ''; }).join(''); }catch(e){ txt = ''; }
        report = _parseTier3Json(txt);
      }
      if(!report || typeof report !== 'object'){
        console.error('Tier 3 — could not read the AI response. Raw:', res.j);
        return _t3RetryOrFail('could not read the AI response.');
      }
      _t3EnforceQuotes(report, fullPool);   // overwrite each quote with the Tier-2 verbatim text
      var items = Array.isArray(report.open_items) ? report.open_items.filter(function(it){ return it && it.from_document && String(it.from_document.quoted_text || '').trim(); }) : [];
      if(!items.length){ return _t3RetryOrFail('no quotable open items were returned.'); }
      report.open_items = items;   // keep only quote-backed items — drop any stragglers without a clause quote
      _pipe.tier3 = { report: report };
      var u = (res.j && res.j.usage) || {};
      _pipe.usage.push({ tier: 'tier3', model: model, input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0 });
      // Combined cost line — sum usage across all three tiers, carried into the live case + its archive.
      var totalIn = 0, totalOut = 0;
      _pipe.usage.forEach(function(x){ totalIn += x.input_tokens || 0; totalOut += x.output_tokens || 0; });
      report._liveModel = model;
      report._liveUsage = { input_tokens: totalIn, output_tokens: totalOut };
      report._liveTiers = 3;
      _installLiveCase(report);   // 10.7x numbering, red UNVERIFIED banner, rich renderer, scholar boxes, archive gating
    }).catch(function(err){ throw { tier: 3, reason: _pipeReason(err) }; });
  }
  // RUN → tiered pipeline: Tier 1 → Tier 2 → Tier 3, then the assembled live case.
  function _runPipeline(){
    var key = _apiKeyGet();
    if(!key || !_liveDoc || !_liveDoc.text) return;
    var model = _apiModelGet();   // captured at request time so the cost line matches what was sent
    var btn = document.getElementById('fin-live-run');
    _pipe = { doc: _liveDoc, tier1: null, tier2: null, tier3: null, usage: [], error: null, errorTier: 0, tier2Notice: null, tier3Notice: null };
    if(btn) btn.disabled = true;
    _pipePaint();   // TIER 1 — scanning terms… (amber)
    _pipeTier1(key, model)
      .then(function(){ return _pipeTier2(key, model); })   // Tier 2 chains on Tier 1's terms
      .then(function(){ return _pipeTier3(key, model); })   // Tier 3 chains on Tier 2's clauses → installs the case
      .then(function(){ if(btn) btn.disabled = false; })
      .catch(function(err){
        if(_pipe){ _pipe.error = _pipeReason(err); _pipe.errorTier = (err && err.tier) || 1; }
        _pipePaint();
        if(btn) btn.disabled = false;
      });
  }

  function _renderReport(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var ql = (D.qlayer && D.qlayer.rows) || [];
    var c08 = (D.lineage_v4 || []).filter(function(r){ return r.contract === 'C08'; });   // v4/kafalah — has crosstag + hadith_meta
    function qword(id){ return ql.filter(function(w){ return w.id === id; })[0] || null; }
    function krow(id){ return c08.filter(function(r){ return r.id === id; })[0] || null; }
    function trow(code){ return _idx.standard[code] || null; }
    function kbn(id){ return _idx.kbnote[id] || null; }

    _repSel = null;   // fresh report → no open item drilled yet

    // Blank-start state: a live document is loaded but no live review has run and no case is chosen yet.
    var liveBlank = (_repFabIdx === null && _liveDoc && !_liveCase);
    // Default the selection to 10.50 when none is chosen yet — EXCEPT in the blank-start state.
    if(_repFabIdx === null && !liveBlank && (D.compliance_reports || []).length) _repFabIdx = 0;

    var h = '<div class="fin-report">';

    // PRINT — top-right of the sheet; hidden in the print stylesheet so it never appears on paper. Not in blank state.
    if(_repFabIdx !== null){
      h += '<button type="button" id="fin-rep-print" class="fin-rep-print">PRINT</button>';
    }
    // SIGN OFF & ARCHIVE — stores a static, read-only snapshot of this sheet; also print-hidden.
    // Shown for every selected case (saved + live); hidden only in the blank-start state.
    // On a LIVE case it stays disabled (with a grey hint) until every open item has a saved scholar stance.
    if(_repFabIdx !== null){
      if(_repFabIdx === 'live'){
        var allDecided = _liveAllDecided();
        h += '<button type="button" id="fin-rep-archive" class="fin-rep-print"'+(allDecided ? '' : ' disabled')+'>SIGN OFF &amp; ARCHIVE</button>';
        if(!allDecided) h += '<span class="fin-rep-signoff-hint">Decide all open items to sign off</span>';
        h += '<span id="fin-rep-signedoff" class="fin-rep-signedoff" style="display:none">Signed off — stored in ARCHIVE</span>';
      } else {
        h += '<button type="button" id="fin-rep-archive" class="fin-rep-print">SIGN OFF &amp; ARCHIVE</button>';
        h += '<span id="fin-rep-archived" class="fin-rep-archived" style="display:none">Archived &#10003;</span>';
      }
    }

    var ac = _activeCase();
    // LIVE-REVIEW strip — shown whenever an extracted PDF is loaded; sits above the CASE dropdown.
    if(_liveDoc){
      var hasKey = !!_apiKeyGet();
      h += '<div class="fin-live-strip" id="fin-live-strip">'
         + '<span class="fin-live-doc">Live document loaded: <strong>'+_esc(_liveDoc.name)+'</strong></span>'
         + '<button type="button" id="fin-live-run" class="fin-live-run"'+(hasKey ? '' : ' disabled')+'>RUN LIVE REVIEW →</button>'
         + (hasKey ? '' : '<span class="fin-live-hint">Connect your API key in SETTINGS first</span>')
         + '<span class="fin-live-status" id="fin-live-status">'+_pipeStripHtml(_pipe)+'</span>'
         + '</div>';
      // Tiered-pipeline extra block — Tier-1 term chips + "next build step" note, painted from _pipe.
      h += '<div class="fin-pipe-extra" id="fin-pipe-extra">'+_pipeExtraHtml(_pipe)+'</div>';
      // Cost/usage line for the completed live run — grey, small; sits directly under the strip.
      // Only on the LIVE report view, so it stays with the live case (and its archive), not saved cases.
      var costLine = (_repFabIdx === 'live') ? _liveCostLine(_liveCase) : '';
      if(costLine) h += '<div class="fin-live-cost" id="fin-live-cost">'+_esc(costLine)+'</div>';
    }
    // CASE selector — REPORT lists ONLY the three rich compliance reports (the five demo cases are unreachable here).
    // Fixed labels for the 3 FAB per-document compliance reports (order matches D.compliance_reports).
    var fabLabels = [
      '10.50 · Facility Offer Letter — LME Murabaha',
      '10.51 · Murabaha Agreement — Sale & Purchase of Commodities',
      '10.60 · Indemnity Undertaking (FAB as Investment Agent)'
    ];
    var freports = D.compliance_reports || [];
    if(freports.length || _liveCase || liveBlank){
      var csel = '<div class="fin-rep-caseselect-wrap">CASE: <select id="fin-rep-caseselect" class="fin-rep-caseselect">';
      // Blank-start placeholder — selected so the dropdown shows the live document, never auto-defaulting to 10.50.
      if(liveBlank){
        csel += '<option value="blank" selected>'+_esc((_liveDoc && _liveDoc.name) || 'Live document')+'</option>';
      }
      freports.forEach(function(rep, i){
        var label = fabLabels[i] || (rep.exhibit ? (rep.exhibit + ' · ' + (rep.case || '')) : ('Report ' + (i+1)));
        csel += '<option value="fab'+i+'"'+((_repFabIdx === i) ? ' selected' : '')+'>'+_esc(label)+'</option>';
      });
      if(_liveCase){
        csel += '<option value="live"'+((_repFabIdx === 'live') ? ' selected' : '')+'>'+_esc(_liveLabel())+'</option>';
      }
      csel += '</select></div>';
      h += csel;
    }

    // ── Blank-start state — live doc loaded, nothing run/selected yet: empty body, just a grey prompt line. ──
    if(_repFabIdx === null){
      h += '<div class="fin-live-blank" style="color:#5A5A5A;font-size:13px;margin:18px 0 0">Run the live review, or pick a saved case from the dropdown.</div>';
      h += '</div>';   // close .fin-report
      canvas.style.height = '';
      canvas.innerHTML = h;
      _wireReport(canvas);
      _renderHub();
      if(ro) ro.textContent = '';
      return;
    }

    // ── FAB / LIVE per-document compliance report — own shell (banner, header, 1 Provenance, 2 Open items, 3 Checklist, sign-off) ──
    if(_repFabIdx !== null && _fabActiveReport()){
      var fab = _fabActiveReport(), fmeta = D.compliance_reports_meta || {}, isLive = (_repFabIdx === 'live');
      var fdateStr = ''; try { fdateStr = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); } catch(e){ fdateStr = ''; }
      var fitems = fab.open_items || [];
      // Applied standards for the checklist. Saved cases use their applied_standards array.
      // LIVE cases derive their own list from the union of affected_standards codes across open items
      // (the AI often echoes the example's applied_standards, so that array is not trusted for live).
      var applied;
      if(isLive){
        var _liveSeen = {}; applied = [];
        fitems.forEach(function(it){
          (it.affected_standards || []).forEach(function(a){
            var c = a && a.code;
            if(c && !_liveSeen[c]){ _liveSeen[c] = 1; applied.push(c); }
          });
        });
        if(!applied.length && Array.isArray(fab.applied_standards)) applied = fab.applied_standards.slice();
      } else {
        applied = fab.applied_standards || [];
      }
      // Severity counts computed from open_items (NOT from any counts object in the file).
      var sevC = { high:0, medium:0, low:0 };
      fitems.forEach(function(oi){ if(sevC[oi.severity] != null) sevC[oi.severity]++; });

      // Live-case guardrail banner — sits ABOVE the ILLUSTRATIVE banner.
      if(isLive){
        h += '<div class="fin-live-banner">AI-GENERATED — UNVERIFIED. Produced live by Claude. Not reviewed, not a ruling.</div>';
      }
      h += '<div class="fin-rep-demo">'+_esc(fmeta.banner || 'ILLUSTRATIVE')+'</div>';
      // Business-case header — case, exhibit reference, institution (— when unnamed). source_url on its own line.
      h += '<div class="fin-rep-casebox">'
         + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Business case</span><span class="fin-rep-casev">'+_esc(fab.case || '')+'</span></div>'
         + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Exhibit reference</span><span class="fin-rep-casev">'+_esc(fab.exhibit || '—')+'</span></div>'
         + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Institution</span><span class="fin-rep-casev">'+_esc(fab.institution || '—')+'</span></div>'
         + '</div>';
      if(fab.source_url){
        h += '<div class="fin-rep-source">Source: <a href="'+_esc(fab.source_url)+'" target="_blank" rel="noopener" data-rep-source="1">'+_esc(fab.source_url)+'</a></div>';
      }
      h += '<h1 class="fin-rep-h1">Shari\'ah Compliance Review — '+_esc(isLive ? _liveLabel() : (fab.case || ''))+'</h1>';
      // Counts line under the title (severities computed above).
      h += '<div class="fin-rep-meta">'+fitems.length+' open items · '+sevC.high+' high · '+sevC.medium+' medium · '+sevC.low+' low · scope: AAOIFI + CBUAE (UAE)</div>';
      // Header strip: reviewer role (fixed short label) + UAE scope line.
      h += '<div class="fin-rep-meta">Reviewer acting as: <strong>Financier / Bank</strong> &nbsp;·&nbsp; Scope: AAOIFI + CBUAE (UAE-adopted) &nbsp;·&nbsp; '+_esc(fdateStr)+'</div>';

      // Section 1 — Provenance (built from variables; key values in the gold-tint fin-prov-hl highlight, print-safe).
      // Locked madhab mapping for the FAB/UAE documents — same across all three reports.
      var pvFrameworks = 'AAOIFI + CBUAE', pvJurisdiction = 'United Arab Emirates', pvTradition = 'Sunni', pvSchool = 'Maliki';
      function pvHl(v){ return '<span class="fin-prov-hl">'+_esc(v)+'</span>'; }
      h += '<h2 class="fin-rep-h2">1 · Provenance</h2>';
      h += '<p class="fin-rep-prov">This review was prepared under the following vetting scope: '
         + pvHl(pvFrameworks)+' standards as adopted for the jurisdiction of '
         + pvHl(pvJurisdiction)+', applying the '
         + pvHl(pvTradition)+' tradition, '
         + pvHl(pvSchool)+' school, reviewer acting as the financing bank. '
         + 'Each open item ties a clause in this document to a specific standard parameter and states the potential issue. '
         + 'Standards not yet processed are flagged for manual reference.</p>';

      // Section 2 — Open items (all rows: OI-n — title + severity chip + saved-stance dot).
      h += '<h2 class="fin-rep-h2">2 · Open items for the scholar</h2>';
      if(fitems.length){
        h += '<ul class="fin-rep-open">';
        fitems.forEach(function(item, i){
          var det = _schGet(item.id), st = det && det.stance;
          var tone = (st === 'accept') ? 'green' : (st === 'hold') ? 'orange' : (st === 'refer') ? 'red' : 'hollow';
          h += '<li class="fin-fab-item'+((_fabSel === i) ? ' sel' : '')+'" data-fabidx="'+i+'" data-fabid="'+_esc(item.id)+'">'
             + '<span class="fin-rep-oinum">'+_esc(item.id)+'</span> — <span class="fin-fab-title">'+_esc(item.title)+'</span> '
             + _fabSevChip(item.severity)
             + '<span class="fin-oi-dot '+tone+'" title="Scholar stance"></span>'
             + '</li>';
        });
        h += '</ul>';
      } else { h += '<div class="fin-rep-open-none">No open items.</div>'; }

      // Section 3 — Checklist: applied → amber "REVIEWED"; remaining in-scope by status; out-of-scope families greyed.
      h += '<div class="fin-rep-sec3"><h2 class="fin-rep-h2">3 · Checklist</h2>';
      h += '<table class="fin-rep-table"><thead><tr><th>#</th><th>Standard</th><th>Result</th></tr></thead><tbody>';
      var fabAllRows = (D.tracker && D.tracker.rows) || [];
      var inFams = { AAOIFI:1, CBUAE:1 };
      var appliedSet = {}; applied.forEach(function(c){ appliedSet[c] = 1; });
      var fRow = 0;
      // 1) Applied standards — one amber row.
      fRow++;
      h += '<tr class="fin-rep-row"><td class="fin-rep-num">'+fRow+'</td>'
         + '<td class="fin-rep-check">'+(applied.length ? applied.map(function(c){ return _esc(c); }).join(', ') : '—')+'</td>'
         + '<td class="fin-rep-stat"><span class="fin-rep-status fin-fab-badge-amber">REVIEWED — OPEN ITEM RAISED</span></td></tr>';
      // 2) Remaining in-scope (AAOIFI + CBUAE, not applied) grouped by data status — existing badges.
      var remOrder = [], remMap = {};
      fabAllRows.forEach(function(r){
        if(inFams[r.family] && !appliedSet[r.code]){
          var s = r.status_in_project;
          if(!remMap[s]){ remMap[s] = 0; remOrder.push(s); }
          remMap[s]++;
        }
      });
      remOrder.forEach(function(s){
        fRow++;
        var ok = (s === 'processed_deep_note');
        var word = ok ? 'Deep note ready' : _stdStatus(s).word;
        h += '<tr class="fin-rep-row"><td class="fin-rep-num">'+fRow+'</td>'
           + '<td class="fin-rep-check"><strong>AAOIFI + CBUAE</strong> — '+remMap[s]+' standard'+(remMap[s] === 1 ? '' : 's')+'</td>'
           + '<td class="fin-rep-stat"><span class="fin-rep-status'+(ok ? ' fin-rep-ok' : '')+'">'+_esc(word)+'</span></td></tr>';
      });
      // 3) Out-of-scope families (IFSB / BNM / SAMA / SC) — greyed row per family.
      var outOrder = [], outMap = {};
      fabAllRows.forEach(function(r){
        if(r.family && !inFams[r.family]){
          if(!outMap[r.family]){ outMap[r.family] = 0; outOrder.push(r.family); }
          outMap[r.family]++;
        }
      });
      outOrder.forEach(function(fam){
        fRow++;
        h += '<tr class="fin-rep-row fin-fab-greyrow"><td class="fin-rep-num">'+fRow+'</td>'
           + '<td class="fin-rep-check"><strong>'+_esc(fam)+'</strong> — '+outMap[fam]+' standard'+(outMap[fam] === 1 ? '' : 's')+'</td>'
           + '<td class="fin-rep-stat"><span class="fin-rep-status fin-fab-badge-grey">OUT OF SCOPE FOR THIS JURISDICTION</span></td></tr>';
      });
      h += '</tbody></table>';
      // Sign-off + footer.
      h += '<div class="fin-rep-signoff">'
         + '<div class="fin-rep-sig"><div class="fin-rep-sigline"></div><div class="fin-rep-siglabel">Scholar 1</div></div>'
         + '<div class="fin-rep-sig"><div class="fin-rep-sigline"></div><div class="fin-rep-siglabel">Scholar 2</div></div></div>';
      h += '<div class="fin-rep-signote">AAOIFI governance requires qualified Shari\'ah board approval before any certification.</div>';
      h += '</div></div>';

      canvas.style.height = '';
      canvas.innerHTML = h;
      _wireReport(canvas);
      _renderHub();
      if(ro) ro.textContent = (fab.exhibit ? ('Ex ' + fab.exhibit + ' · ') : '') + fitems.length + ' open items';
      return;
    }

    // Report head — banner shows the case's real-world notice when present, else the demonstration line.
    var bannerText = (ac && ac.real_world_notice) ? ac.real_world_notice : 'DEMONSTRATION REPORT — ILLUSTRATIVE MAPPING, NOT A RULING. NOT SCHOLAR-CERTIFIED.';
    h += '<div class="fin-rep-demo">'+_esc(bannerText)+'</div>';
    var dateStr = ''; try { dateStr = new Date().toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }); } catch(e){ dateStr = ''; }
    // Business-case header — identifies which case this report covers; fields read from the active case.
    var caseTitle = (ac && ac.title)       ? ac.title       : 'Letter of Guarantee (Kafalah) facility';
    var caseInst  = (ac && ac.institution) ? ac.institution : '—';   // em dash when no institution named
    var caseRef   = (ac && ac.reference)   ? ac.reference   : 'DEMO-KAFALAH-001';
    h += '<div class="fin-rep-casebox">'
       + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Business case</span><span class="fin-rep-casev">'+_esc(caseTitle)+'</span></div>'
       + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Institution</span><span class="fin-rep-casev">'+_esc(caseInst)+'</span></div>'
       + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Product type</span><span class="fin-rep-casev">Guarantee / surety (kafalah)</span></div>'
       + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Reference</span><span class="fin-rep-casev">'+_esc(caseRef)+'</span></div>'
       + '<div class="fin-rep-caserow"><span class="fin-rep-casek">Prepared</span><span class="fin-rep-casev">'+_esc(dateStr)+'</span></div>'
       + '</div>';
    // Source link — only when the active case carries a non-empty source_url. No fetching.
    if(ac && ac.source_url){
      h += '<div class="fin-rep-source">Source: <a href="'+_esc(ac.source_url)+'" target="_blank" rel="noopener" data-rep-source="1">'+_esc(ac.source_url)+'</a></div>';
    }
    h += '<h1 class="fin-rep-h1">Shari\'ah Compliance Review — Letter of Guarantee (Kafalah)</h1>';
    // Standards in scope for THIS report = VET selection, further narrowed by the case's families_in_scope (when set).
    var allRows = (D.tracker && D.tracker.rows) || [];
    var caseFams = (ac && Array.isArray(ac.families_in_scope) && ac.families_in_scope.length) ? ac.families_in_scope : null;
    function _inCaseFam(r){ return !caseFams || caseFams.indexOf(r.family) !== -1; }
    var scopeRows = allRows.filter(function(r){ return VET.standards.has(r.code) && _inCaseFam(r); });
    var scopeN = scopeRows.length;
    var totalStd = allRows.length;   // TOTAL stays the full tracker length
    // Meta "Traditions:" shows the case's single tradition when present, else the VET traditions list.
    var tradNames = (ac && ac.tradition) ? ac.tradition : (VET.traditions.size ? Array.from(VET.traditions).join(', ') : 'All');
    h += '<div class="fin-rep-meta">Ruleset: '+scopeN+' of '+totalStd+' standards &nbsp;·&nbsp; Traditions: '+_esc(tradNames)
       + ' &nbsp;·&nbsp; Confidence: '+_esc(_confLabel())+' &nbsp;·&nbsp; '+_esc(dateStr)+' &nbsp;·&nbsp; Prepared for scholar review</div>';

    // Section 1 — Provenance (a written paragraph built ONLY from runtime scope values; no chips, no links)
    h += '<h2 class="fin-rep-h2">1 · Provenance</h2>';
    var provTotal = totalStd;
    var provN = scopeN;
    var famSeen = {}, famList = [];
    scopeRows.forEach(function(r){ if(r.family && !famSeen[r.family]){ famSeen[r.family] = 1; famList.push(r.family); } });
    var provFam = famList.length ? famList.join(', ') : 'not selected';
    var evidenceTail = '. Evidence was traced through Qur\'an, hadith, tafsir, classical law schools and modern codification layers where records exist in the loaded data.</p>';
    if(ac && ac.tradition){
      // Per-case: single tradition + jurisdiction, four highlighted values.
      h += '<p class="fin-rep-prov">This review was prepared under the following vetting scope: '
         + '<span class="fin-prov-hl">' + provN + ' of ' + provTotal + ' standards</span> across '
         + '<span class="fin-prov-hl">' + _esc(provFam) + '</span>, for the jurisdiction of '
         + '<span class="fin-prov-hl">' + _esc(ac.jurisdiction || 'not stated') + '</span>, applying the '
         + '<span class="fin-prov-hl">' + _esc(ac.tradition) + '</span> tradition'
         + evidenceTail;
    } else {
      var provTrad = VET.traditions.size ? Array.from(VET.traditions).join(', ') : 'not selected';
      h += '<p class="fin-rep-prov">This review was prepared under the following vetting scope: '
         + provN + ' of ' + provTotal + ' standards across ' + _esc(provFam)
         + ', with the following traditions enabled: ' + _esc(provTrad)
         + evidenceTail;
    }

    // Section 2 — Open items for the scholar
    h += '<h2 class="fin-rep-h2">2 · Open items for the scholar</h2>';
    var open = _reportOpenListView();
    if(open.length){
      h += '<ul class="fin-rep-open">';
      open.forEach(function(u, i){
        var act = _repActions[u.id];
        // ONE non-clickable status dot reflecting the decision made in the Details hub (hollow when undecided).
        var tone = (act === 'accept') ? 'green' : (act === 'hold') ? 'orange' : (act === 'refer') ? 'red' : 'hollow';
        h += '<li class="fin-rep-open-item'+((_repSel && _repSel.idx === i) ? ' sel' : '')+(act === 'accept' ? ' oi-accepted' : '')+'" data-oi="'+i+'" data-oiid="'+_esc(u.id)+'">'
           + '<span class="fin-rep-oinum">OI-'+(i+1)+'</span> '
           + '<span class="fin-rep-openid">'+_esc(u.id)+'</span> — '+_esc(u.label)+' — <span class="fin-rep-openstatus">'+_esc(u.honest)+'</span>'
           + '<span class="fin-oi-check">✓</span>'
           + '<span class="fin-oi-dot '+tone+'" title="Decision status"></span>'
           + '</li>';
      });
      h += '</ul>';
    } else { h += '<div class="fin-rep-open-none">No open items.</div>'; }

    // Section 3 — Checklist (fin-rep-sec3 → starts on a fresh page in print); sign-off at the very end.
    h += '<div class="fin-rep-sec3"><h2 class="fin-rep-h2">3 · Checklist</h2>';
    h += '<table class="fin-rep-table"><thead><tr><th>#</th><th>Standard</th><th>Result</th></tr></thead><tbody>';
    if(scopeRows.length){
      // Result string for a row — same logic as before (deep-note phrase, else honest status word).
      function _rowResult(r){ return (r.status_in_project === 'processed_deep_note') ? 'Checked — deep note applied' : _stdStatus(r.status_in_project).word; }
      var deepResult = 'Checked — deep note applied';
      // Group by family (first-seen order); within each family, group by result string (first-seen order).
      var famOrder = [], famBuckets = {};
      scopeRows.forEach(function(r){
        var fam = r.family || '';
        if(!famBuckets[fam]){ famBuckets[fam] = { order:[], byResult:{}, count:0 }; famOrder.push(fam); }
        var b = famBuckets[fam], res = _rowResult(r);
        if(!b.byResult[res]){ b.byResult[res] = []; b.order.push(res); }
        b.byResult[res].push(r);
        b.count++;
      });
      var rowNum = 0;
      famOrder.forEach(function(fam){
        var b = famBuckets[fam];
        if(b.order.length === 1){
          // All in-scope rows in this family share one result → single ALL row.
          var res = b.order[0], ok = (res === deepResult);
          rowNum++;
          h += '<tr class="fin-rep-row"><td class="fin-rep-num">'+rowNum+'</td>'
             + '<td class="fin-rep-check"><strong>'+_esc(fam)+'</strong> — ALL ('+b.count+')</td>'
             + '<td class="fin-rep-stat"><span class="fin-rep-status'+(ok ? ' fin-rep-ok' : '')+'">'+_esc(res)+'</span></td></tr>';
        } else {
          // Mixed results → one row per (family, result) pair, listing the codes in that group.
          b.order.forEach(function(res){
            var ok = (res === deepResult);
            var codes = b.byResult[res].map(function(r){ return r.code; }).join(', ');
            rowNum++;
            h += '<tr class="fin-rep-row"><td class="fin-rep-num">'+rowNum+'</td>'
               + '<td class="fin-rep-check"><strong>'+_esc(fam)+'</strong> — '+_esc(codes)+'</td>'
               + '<td class="fin-rep-stat"><span class="fin-rep-status'+(ok ? ' fin-rep-ok' : '')+'">'+_esc(res)+'</span></td></tr>';
          });
        }
      });
    } else {
      h += '<tr class="fin-rep-row"><td class="fin-rep-num">—</td><td class="fin-rep-check">No standards selected in the current vetting scope.</td><td class="fin-rep-stat"></td></tr>';
    }
    h += '</tbody></table><div class="fin-rep-checkfoot">'+scopeRows.length+' standard'+(scopeRows.length === 1 ? '' : 's')+' in scope.</div>';

    // Sign-off — at the very end, after the checklist.
    h += '<div class="fin-rep-signoff">'
       + '<div class="fin-rep-sig"><div class="fin-rep-sigline"></div><div class="fin-rep-siglabel">Scholar 1</div></div>'
       + '<div class="fin-rep-sig"><div class="fin-rep-sigline"></div><div class="fin-rep-siglabel">Scholar 2</div></div></div>';
    h += '<div class="fin-rep-signote">AAOIFI governance requires qualified Shari\'ah board approval before any certification.</div>';
    h += '</div></div>';

    canvas.style.height = '';
    canvas.innerHTML = h;
    _wireReport(canvas);
    _renderHub();
    if(ro) ro.textContent = 'Demonstration report · Kafalah';
  }

  // ── UPLOAD mode — static placeholder (no file input, no fetch, nothing stored) ──
  // ── pdf.js — loaded lazily from cdnjs on first use (UPLOAD mode only). No bundling; nothing preloaded. ──
  var PDFJS_VER = '3.11.174';
  var PDFJS_BASE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/' + PDFJS_VER + '/';
  var _pdfjsPromise = null;
  function _ensurePdfJs(){
    if(window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if(_pdfjsPromise) return _pdfjsPromise;
    _pdfjsPromise = new Promise(function(resolve, reject){
      var s = document.createElement('script');
      s.src = PDFJS_BASE + 'pdf.min.js';
      s.onload = function(){
        if(window.pdfjsLib){
          try{ window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_BASE + 'pdf.worker.min.js'; }catch(e){}
          resolve(window.pdfjsLib);
        } else { _pdfjsPromise = null; reject(new Error('could not load PDF reader')); }
      };
      s.onerror = function(){ _pdfjsPromise = null; reject(new Error('could not load PDF reader')); };
      document.head.appendChild(s);
    });
    return _pdfjsPromise;
  }
  // Extract ALL text from a PDF File in the browser → { pages, text }. Pages read in order.
  function _extractPdf(file){
    var lib;
    return _ensurePdfJs().then(function(l){ lib = l; return file.arrayBuffer(); })
      .then(function(buf){ return lib.getDocument({ data: buf }).promise; })
      .then(function(pdf){
        var pages = pdf.numPages, out = [], p = 0;
        function next(){
          if(p >= pages) return Promise.resolve();
          p++;
          var pn = p;
          return pdf.getPage(pn)
            .then(function(page){ return page.getTextContent(); })
            .then(function(tc){ out.push((tc.items || []).map(function(it){ return it.str; }).join(' ')); return next(); });
        }
        return next().then(function(){ return { pages: pages, text: out.join('\n\n') }; });
      });
  }
  function _setUploadStatus(el, cls, txt){ if(el){ el.className = 'fin-upload-status ' + cls; el.textContent = txt; } }
  // Handle a chosen/dropped file: validate PDF, extract, store in _liveDoc (session only), re-render on success.
  function _handlePdfFile(file, statusEl){
    if(!file) return;
    var nm = (file.name || '').toLowerCase();
    var isPdf = (file.type === 'application/pdf') || /\.pdf$/.test(nm);
    if(!isPdf){ _setUploadStatus(statusEl, 'red', 'Please choose a PDF file'); return; }
    _setUploadStatus(statusEl, 'amber', 'extracting...');
    _extractPdf(file).then(function(res){
      var text = res.text || '';
      if(!text.replace(/\s/g, '').length){
        _setUploadStatus(statusEl, 'red', 'This PDF has no selectable text — it may be a scan');
        return;
      }
      _liveDoc = { name: file.name, pages: res.pages, text: text };   // session only — never stored or sent
      // New live document → drop ALL previous live/report state so REPORT opens in the blank-start state:
      // no stale live report, no old case entry selected, no drilled open item, no leftover "reviewing..." status.
      _liveCase  = null;   // previous live report object — gone
      _pipe      = null;   // previous tiered-pipeline state (Tier-1 terms, usage) — gone
      _repFabIdx = null;   // clear the selected case entry → blank-start (not old live, not 10.50)
      _fabSel    = null;   // clear the drilled open item in the right-hand panel (FAB/live)
      _repSel    = null;   // clear any demo-case open-item selection too
      _renderUpload();
    }).catch(function(err){
      var m = (err && err.message) || '';
      _setUploadStatus(statusEl, 'red', m === 'could not load PDF reader' ? m : 'could not read this PDF — it may be damaged or not a valid PDF');
    });
  }

  // Find a quote inside the document text, tolerant of whitespace differences. Returns {start,end} or null.
  function _docNormStr(q){
    return String(q||'')
      .replace(/[‘’‛′`]/g,"'")
      .replace(/[“”″]/g,'"')
      .replace(/\s+/g,' ').trim();
  }
  function _docNormMap(txt){
    var s='', map=[], prev=false;
    for(var i=0;i<txt.length;i++){
      var c=txt.charAt(i);
      if(/\s/.test(c)){ if(prev) continue; s+=' '; map.push(i); prev=true; continue; }
      prev=false;
      if(c==='‘'||c==='’'||c==='‛'||c==='′'||c==='`') c="'";
      else if(c==='“'||c==='”'||c==='″') c='"';
      s+=c; map.push(i);
    }
    return { s:s, map:map };
  }
  function _docFindRange(txt, quote){
    if(!txt || !quote) return null;
    var nq = _docNormStr(quote); if(!nq) return null;
    var nd = _docNormMap(txt);
    var i = nd.s.indexOf(nq);
    if(i === -1){ var raw = txt.indexOf(quote); return raw === -1 ? null : { start:raw, end:raw+quote.length }; }
    return { start: nd.map[i], end: nd.map[i + nq.length - 1] + 1 };
  }
  // Build the document preview HTML, wrapping the highlighted quote (if any) in a marker.
  function _docPreviewHtml(txt){
    var r = _docHighlight ? _docFindRange(txt, _docHighlight) : null;
    if(!r) return _esc(txt);
    return _esc(txt.slice(0, r.start)) + '<mark class="fin-doc-hit">' + _esc(txt.slice(r.start, r.end)) + '</mark>' + _esc(txt.slice(r.end));
  }
  // Jump from a report quote to the document viewer, highlighting that quote.
  function _jumpToDocQuote(q){
    if(!q || !_liveDoc) return;
    _docHighlight = q;
    _setMode('upload');
  }
  function _renderUpload(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var doc = _liveDoc;
    var h = '<div class="fin-upload">'
      + '<h1 class="fin-upload-h1">UPLOAD A BUSINESS CASE</h1>'
      + '<div class="fin-upload-drop" id="fin-upload-drop">'
      +   '<div class="fin-upload-drop-main">Drop a PDF here, or click to choose a file</div>'
      +   '<div class="fin-upload-drop-sub">PDF only — read in your browser, never uploaded</div>'
      + '</div>'
      + '<input type="file" id="fin-upload-file" accept="application/pdf,.pdf" style="display:none">'
      + '<div class="fin-upload-status '+(doc ? 'green' : 'grey')+'" id="fin-upload-status">'
      +   (doc ? 'Text extracted — ready for live review' : 'no file selected') + '</div>';
    if(doc){
      var chars = doc.text.length;
      h += '<div class="fin-upload-meta">'
         +   '<span class="fin-upload-metak">File</span> '+_esc(doc.name)
         +   ' &nbsp;·&nbsp; <span class="fin-upload-metak">Pages</span> '+doc.pages
         +   ' &nbsp;·&nbsp; <span class="fin-upload-metak">Characters</span> '+chars
         + '</div>'
         + '<div class="fin-upload-prevlbl">FULL DOCUMENT — extracted text (scroll to read all)</div>'
         + '<div class="fin-upload-preview">'+_docPreviewHtml(doc.text)+'</div>';
    }
    h += '<div class="fin-upload-note">The document is read on this device only. Nothing is stored or sent until you run the live review.</div>'
      + '<div class="fin-upload-actions">'
      +   '<button class="fin-upload-continue" id="fin-upload-continue" type="button">CONTINUE TO SETTINGS →</button>'
      +   '<button class="fin-upload-continue fin-upload-toreport" id="fin-upload-toreport" type="button"'+(doc ? '' : ' disabled')+'>CONTINUE TO REPORT →</button>'
      + '</div>'
      + '</div>';
    canvas.style.height = '';
    canvas.innerHTML = h;

    var fileInput = canvas.querySelector('#fin-upload-file');
    var dropZone  = canvas.querySelector('#fin-upload-drop');
    var statusEl  = canvas.querySelector('#fin-upload-status');
    if(dropZone && fileInput){
      dropZone.addEventListener('click', function(e){ e.stopPropagation(); fileInput.click(); });
      dropZone.addEventListener('dragover', function(e){ e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag'); });
      dropZone.addEventListener('dragleave', function(e){ e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag'); });
      dropZone.addEventListener('drop', function(e){ e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag');
        var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if(f) _handlePdfFile(f, statusEl);
      });
      fileInput.addEventListener('click', function(e){ e.stopPropagation(); });
      fileInput.addEventListener('change', function(e){ e.stopPropagation(); var f = this.files && this.files[0]; if(f) _handlePdfFile(f, statusEl); });
    }
    var cont = canvas.querySelector('#fin-upload-continue');
    if(cont) cont.addEventListener('click', function(e){ e.stopPropagation(); _setMode('standards'); });
    var toRep = canvas.querySelector('#fin-upload-toreport');
    if(toRep && _liveDoc) toRep.addEventListener('click', function(e){ e.stopPropagation(); _setMode('report'); });

    if(_docHighlight){ var _dhit = canvas.querySelector('.fin-doc-hit'); if(_dhit) _dhit.scrollIntoView({ block:'center' }); }
    _renderHub();   // upload keeps the default hub hint — nothing new
    if(ro) ro.textContent = '';
  }

  // ── ARCHIVE mode — signed-off report snapshots stored in localStorage (read-only) ──
  function _renderArchive(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var entry = _archOpen ? _archive.filter(function(x){ return x.id === _archOpen; })[0] : null;
    if(_archOpen && !entry) _archOpen = null;   // opened entry was deleted → fall back to the list

    var h;
    if(entry){
      // OPEN one entry: back + print controls, then the frozen sheet (non-interactive via .fin-arch-view).
      h = '<div class="fin-report fin-arch-open">'
        + '<button type="button" id="fin-arch-back" class="fin-rep-print fin-arch-back">&#8592; ARCHIVE</button>'
        + '<button type="button" id="fin-arch-print" class="fin-rep-print">PRINT</button>'
        + '<div class="fin-arch-view">' + entry.html + '</div>'
        + '</div>';
    } else {
      // LIST all entries.
      h = '<div class="fin-report fin-arch-listpage">'
        + '<h1 class="fin-rep-h1">ARCHIVED REPORTS &#8212; SCHOLAR SIGNED</h1>';
      if(!_archive.length){
        h += '<div class="fin-arch-empty">No archived reports yet. Sign off a report to store it here.</div>';
      } else {
        h += '<div class="fin-arch-list">';
        _archive.forEach(function(en){
          h += '<div class="fin-arch-row">'
             + '<div class="fin-arch-info">'
             +   '<div class="fin-arch-title">'+_esc(en.title)+'</div>'
             +   '<div class="fin-arch-metaline">'+_esc(en.meta)+'</div>'
             +   '<div class="fin-arch-date">'+_esc(en.savedAt)+'</div>'
             + '</div>'
             + '<div class="fin-arch-actions">'
             +   '<button type="button" class="fin-arch-open-btn" data-arch-open="'+_esc(en.id)+'">OPEN</button>'
             +   '<button type="button" class="fin-arch-del" data-arch-del="'+_esc(en.id)+'" title="Delete">&#10005;</button>'
             + '</div>'
             + '</div>';
        });
        h += '</div>';
      }
      h += '</div>';
    }

    canvas.style.height = '';
    canvas.innerHTML = h;

    var back = canvas.querySelector('#fin-arch-back');
    if(back) back.addEventListener('click', function(e){ e.stopPropagation(); _archOpen = null; _renderArchive(); });
    var pr = canvas.querySelector('#fin-arch-print');
    if(pr) pr.addEventListener('click', function(e){ e.stopPropagation(); window.print(); });
    canvas.querySelectorAll('[data-arch-open]').forEach(function(b){
      b.addEventListener('click', function(e){ e.stopPropagation(); _archOpen = this.getAttribute('data-arch-open'); _renderArchive(); });
    });
    canvas.querySelectorAll('[data-arch-del]').forEach(function(b){
      b.addEventListener('click', function(e){ e.stopPropagation();
        if(!window.confirm('Delete this archived report?')) return;
        var id = this.getAttribute('data-arch-del');
        _archSave(_archive.filter(function(x){ return x.id !== id; }));
        if(_archOpen === id) _archOpen = null;
        _renderArchive();
      });
    });

    _renderHub();   // archive keeps the default hub hint
    if(ro) ro.textContent = entry ? 'Archived report' : (_archive.length + ' archived report' + (_archive.length === 1 ? '' : 's'));
  }

  // ── PRISM mode — cross-tradition comparison of where authorities diverge ──
  //    Read-only. Renders ONLY tradition_index.divergences. Positions shown verbatim.
  //    needs_check (unverified) positions render greyed — NEVER filled. standard_refs linkified.
  function _prismTermChip(id){
    var t = _idx.term && _idx.term[id];
    var nm = t ? (t.term_english || t.id) : id;
    var ar = (t && t.term_arabic) ? '  '+t.term_arabic : '';
    return '<span class="fin-prism-term">'+_esc(nm)+_esc(ar)+'</span>';
  }
  function _prismCol(label, list){
    if(!list.length) return '';
    var h = '<div class="fin-prism-col"><div class="fin-prism-collabel">'+_esc(label)+'</div>';
    list.forEach(function(p){
      var pend = (p.tag !== 'verified');
      h += '<div class="fin-prism-pos'+(pend ? ' fin-prism-pending' : '')+'">'
         + '<div class="fin-prism-auth">'+_esc(p.authority || p.tradition || '')
         + (pend ? '<span class="fin-tag fin-tag-untagged">needs check</span>'
                 : '<span class="fin-badge fin-badge-est">verified</span>')+'</div>'
         + '<div class="fin-prism-text">'+_esc(p.position || '')+'</div>'
         + (p.basis ? '<div class="fin-prism-basis">'+_esc(p.basis)+'</div>' : '')
         + '</div>';
    });
    return h + '</div>';
  }
  function _renderPrism(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var topics = (D.tradIndex && D.tradIndex.divergences) || [];
    var h = '<div class="fin-prism">'
          + '<h1 class="fin-prism-h1">PRISM &#8212; where the traditions differ</h1>'
          + '<p class="fin-prism-intro">One question, seen through every authority and school. '
          + 'Positions are shown word-for-word. Greyed positions are pending a direct citation &#8212; never filled in.</p>';
    if(!topics.length){
      h += '<div class="fin-prism-empty">No comparison topics loaded yet.</div>';
    } else {
      topics.forEach(function(t){
        var regs   = (t.positions||[]).filter(function(p){ return p.authority_type === 'regulator'; });
        var schs   = (t.positions||[]).filter(function(p){ return p.authority_type === 'school'; });
        var others = (t.positions||[]).filter(function(p){ return p.authority_type !== 'regulator' && p.authority_type !== 'school'; });
        var _poss = t.positions || [];
        var _ver = _poss.filter(function(p){ return p.tag === 'verified'; }).length;
        var _cName = (t.contract && _idx.contract[t.contract]) ? _idx.contract[t.contract].name : '';
        h += '<section class="fin-prism-topic" data-prism-topic="'+_esc(t.topic_id||'')+'">'
           + '<div class="fin-prism-q">'+_esc(t.topic || t.topic_id || '')+'</div>'
           + (t.why_it_matters ? '<div class="fin-prism-why">'+_esc(t.why_it_matters)+'</div>' : '')
           + '<div class="fin-prism-summary">'+_poss.length+' positions &#183; '+_ver+' verified &#183; '+(_poss.length-_ver)+' pending citation</div>'
           + '<div class="fin-prism-refs">'
           +   (t.contract ? '<span class="fin-prism-ref fin-prism-cx" data-prism-c="'+_esc(t.contract)+'">&#8594; '+_esc(_cName || t.contract)+' ('+_esc(t.contract)+')</span>' : '')
           +   (t.standard_refs||[]).map(function(s){ return '<span class="fin-prism-ref">'+_linkifyStandards(s)+'</span>'; }).join('')
           + '</div>'
           + ((t.term_refs && t.term_refs.length) ? '<div class="fin-prism-terms">'+t.term_refs.map(_prismTermChip).join('')+'</div>' : '')
           + _prismCol('Regulators & bodies', regs)
           + _prismCol('Schools', schs)
           + _prismCol('Other', others)
           + '</section>';
      });
    }
    h += '</div>';
    canvas.style.height = '';
    canvas.innerHTML = h;
    _wireStdLinks(canvas);   // standard-code refs (SS/FAS/GS/SOAA) open the STANDARDS reader page
    canvas.querySelectorAll('[data-prism-c]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        F.contract = new Set([this.getAttribute('data-prism-c')]); _syncAllDD(); _setMode('timeline');
      });
    });
    _renderHub();
    if(ro) ro.textContent = topics.length + ' comparison topic' + (topics.length === 1 ? '' : 's');
    // Optional focus from a TRACE "Scholars differ" chip — scroll that topic block into view, then reset.
    if(_prismFocus){
      var _ft = canvas.querySelector('[data-prism-topic="'+_prismFocus+'"]');
      if(_ft && _ft.scrollIntoView) _ft.scrollIntoView({ behavior:'smooth', block:'start' });
      _prismFocus = null;
    }
  }

  // ── TRACE mode — "from today back to the Qur'an" ──────────────────────────
  //    Search any modern term → one vertical journey card, newest first:
  //    TODAY → STANDARDS TODAY → PARENT CONTRACT → DATED HISTORY → QUR'ANIC ORIGIN.
  //    Reuses existing helpers only (_esc, _conf, _linkifyStandards, _selChips,
  //    _termOriginYear/_termLatestYear, _finOpenVerse, _select). No new data, no fetches.
  var _traceQuery = '', _traceSelId = null;
  var _prismFocus = null;   // DV## topic id to scroll to when PRISM next renders (set from TRACE)
  var _traceDocClick = null; // outside-click closer for the TRACE filter dropdowns
  var _traceRowSel = null;   // id of the selected DATED HISTORY lineage row (gold border)

  // Standard codes covered by the currently selected jurisdiction(s) — reuses SETTINGS'
  // JURIS selection and the same _jxCodes regulator/family matching that sets the vetting scope.
  function _traceJurisCodes(){
    var codes = new Set();
    (D.juris || []).forEach(function(j){ if(JURIS.has(j.id)) _jxCodes(j).forEach(function(c){ codes.add(c); }); });
    return codes;
  }
  // Display names of the selected jurisdiction(s), in data order.
  function _traceJurisNames(){
    return (D.juris || []).filter(function(j){ return JURIS.has(j.id); })
      .map(function(j){ return j.name || j.id; }).join(', ');
  }
  // Parse a tracker-style code ("SS 8", "FAS 3", "GS 16") out of a standard display string.
  function _traceStdCode(name){
    var m = String(name||'').match(/\b(SS|FAS|GS|SOAA|ASIFI|IFSB|GN|TN|PD|SG|HSA)\b[\s-]*(\d+)/i);
    return m ? (m[1].toUpperCase() + ' ' + m[2]) : null;
  }

  // A Qur'an-layer row (D.qlayer) by its Q## id — the origin verses come from here.
  function _traceQRow(qid){
    var rows = (D.qlayer && D.qlayer.rows) || [];
    for(var i=0;i<rows.length;i++){ if(rows[i] && rows[i].id === qid) return rows[i]; }
    return null;
  }
  // Up to 12 D.terms matching term_english or term_arabic (case-insensitive substring).
  function _traceMatch(q){
    q = String(q||'').trim().toLowerCase();
    if(!q) return [];
    var out = [];
    (D.terms||[]).forEach(function(t){
      if(out.length >= 12) return;
      var en = String(t.term_english||'').toLowerCase();
      var ar = String(t.term_arabic||'').toLowerCase();
      if(en.indexOf(q) !== -1 || ar.indexOf(q) !== -1) out.push(t);
    });
    return out;
  }
  function _traceResultsHtml(list){
    if(!list.length) return '<div class="fin-trace-none">No matching terms.</div>';
    return list.map(function(t){
      return '<div class="fin-trace-res'+(t.id===_traceSelId?' on':'')+'" data-trace-term="'+_esc(t.id)+'">'
        + '<span class="fin-trace-res-en">'+_esc(t.term_english||t.id)+'</span>'
        + (t.term_arabic ? '<span class="fin-trace-res-ar">'+_esc(t.term_arabic)+'</span>' : '')
        + '<span class="fin-trace-res-yr">'+_esc(t.earliest_date_ce==null?'':t.earliest_date_ce)+'</span>'
        + '</div>';
    }).join('');
  }
  // The journey card for one selected term — full-width layout: a compact top row (TODAY +
  // PARENT CONTRACT + scholars-differ), then STANDARDS grid, DATED HISTORY, QUR'ANIC ORIGIN grid.
  function _traceJourneyHtml(t){
    var conf = _conf(t.assurance);
    var pc = String(t.parent_contract||'');
    var cm = pc.match(/C\d{2}/); var cc = cm ? cm[0] : null;

    var h = '<div class="fin-trace-journey">';

    // ── TOP ROW — TODAY (left) + PARENT CONTRACT (beside it on wide screens) ──
    h += '<div class="fin-trace-top">';
    // 1) TODAY — english + arabic + assurance chip + first-recorded line + earliest source.
    h += '<section class="fin-trace-sec fin-trace-today"><div class="fin-trace-sec-h">TODAY</div>'
       + '<div class="fin-trace-term-line">'
       +   '<span class="fin-trace-term-en">'+_esc(t.term_english||t.id)+'</span>'
       +   (t.term_arabic ? '<span class="fin-trace-term-ar">'+_esc(t.term_arabic)+'</span>' : '')
       +   '<span class="fin-badge fin-badge-'+conf.key+'">'+conf.label+'</span>'
       + '</div>'
       + '<div class="fin-trace-first">first recorded: '+_esc(t.earliest_date_ce==null?'—':t.earliest_date_ce)+' CE</div>'
       + ((t.earliest_source && !_isUnresolved(t.earliest_source)) ? '<div class="fin-trace-src">'+_esc(t.earliest_source)+'</div>' : '')
       + '</section>';
    // 3) PARENT CONTRACT — parse a C## out of the (messy) parent_contract string.
    h += '<section class="fin-trace-sec fin-trace-parent"><div class="fin-trace-sec-h">PARENT CONTRACT</div>';
    if(cc){
      var cname = (_idx.contract[cc]||{}).name || cc;
      h += '<div class="fin-hub-chips">'+_selChips([{kind:'contract', id:cc, label:cname}])+'</div>';
    } else {
      h += '<div class="fin-trace-src">'+_esc(pc||'—')+'</div>';
    }
    h += '</section>';
    h += '</div>';   // .fin-trace-top

    // "Scholars differ" — divergence topics whose term_refs include this term, or whose
    // contract equals its parsed C##. Amber chip → opens PRISM focused on that topic.
    var _divs = (D.tradIndex && D.tradIndex.divergences) || [];
    var _matched = _divs.filter(function(dv){
      return ((dv.term_refs||[]).indexOf(t.id) !== -1) || (cc && dv.contract === cc);
    });
    if(_matched.length){
      h += '<div class="fin-trace-diverge-row">';
      _matched.forEach(function(dv){
        h += '<div class="fin-trace-diverge" data-prism-topic="'+_esc(dv.topic_id||'')+'" title="Open in PRISM">'
           + '⚖ Scholars differ: '+_esc(dv.topic||dv.topic_id||'')+' →</div>';
      });
      h += '</div>';
    }

    // 2) STANDARDS TODAY — each standard a card, laid out in a responsive grid.
    //    Each is tagged in-/out-of-scope for the SETTINGS jurisdiction selection
    //    (JURIS + _jxCodes — the same regulator/family matching the vetting scope uses).
    var srefs = (t.enrichment && t.enrichment.standard_refs) || [];
    h += '<section class="fin-trace-sec"><div class="fin-trace-sec-h">STANDARDS TODAY</div>';
    h += '<div class="fin-trace-juris-note">Jurisdiction scope: '+_esc(_traceJurisNames() || 'none selected')+'</div>';
    if(srefs.length){
      var _jCodes = _traceJurisCodes();
      h += '<div class="fin-trace-std-grid">';
      srefs.forEach(function(sr){
        var _sc = _traceStdCode(sr.standard || '');
        var _inScope = _sc ? _jCodes.has(_sc) : false;
        h += '<div class="fin-trace-std'+(_inScope ? '' : ' fin-trace-std-out')+'">';
        h += '<div class="fin-term-std-name">'+_linkifyStandards(sr.standard||'')
           + (_inScope ? '' : '<span class="fin-tag fin-trace-std-outchip">outside selected jurisdiction</span>')
           + '</div>';
        (sr.clauses||[]).forEach(function(cl){ h += '<div class="fin-term-std-clause">'+_esc(cl)+'</div>'; });
        if(sr.verified) h += '<div class="fin-term-std-ver">verified: '+_esc(sr.verified)+'</div>';
        h += '</div>';
      });
      h += '</div>';
    } else {
      h += '<div class="fin-hub-none">No modern standard clauses linked yet.</div>';
    }
    h += '</section>';

    // Sections 4 & 5 only exist when a C## resolved.
    if(cc){
      // 4) DATED HISTORY — all lineage rows for this contract, undated/nulls first.
      var oy = _termOriginYear(t); if(oy == null) oy = _termLatestYear(t);
      var rows = (D.lineage||[]).filter(function(r){ return r.contract === cc; }).slice();
      rows.sort(function(a,b){
        var ay = a.timeline_year, by = b.timeline_year;
        if(ay == null && by == null) return 0;
        if(ay == null) return -1;           // nulls / undated first
        if(by == null) return 1;
        return ay - by;
      });
      // Closest recorded step BEFORE the term: the max timeline_year <= the term's origin year.
      var closestYr = null;
      if(oy != null){
        rows.forEach(function(r){
          if(r.timeline_year != null && r.timeline_year <= oy && (closestYr == null || r.timeline_year > closestYr)) closestYr = r.timeline_year;
        });
      }
      h += '<section class="fin-trace-sec"><div class="fin-trace-sec-h">DATED HISTORY</div>';
      // TRADITION filter active → one small line naming the selection (steps not attributed to it are greyed).
      var _tradActive = !!(F.sect.size || F.school.size || F.movement.size);
      if(_tradActive){
        var _tradLabels = [].concat(Array.from(F.sect), Array.from(F.school), Array.from(F.movement));
        h += '<div class="fin-trace-trad-note">Viewing through: '+_esc(_tradLabels.join(', '))
           + ' &#8212; greyed steps are not attributed to this selection.</div>';
      }
      if(!rows.length){
        h += '<div class="fin-hub-none">No dated lineage rows for this contract.</div>';
      } else {
        rows.forEach(function(r){
          var isHit = (closestYr != null && r.timeline_year === closestYr);
          // Reuse TIMELINE's tradition machinery: 'all' | 'match' | 'off' | 'untagged'.
          var ts = _tradState('lineage', r.id);
          var trCls = (ts === 'off') ? ' fin-trace-hrow-off' : (ts === 'match') ? ' fin-trace-hrow-trad' : '';
          // Clickable when the row has an id → opens TIMELINE's lineage hub (_selectRow). Selected → gold border.
          var canClk = !!r.id;
          var clkCls = canClk ? ' clk' : '';
          var selCls = (canClk && _traceRowSel && r.id === _traceRowSel) ? ' fin-trace-hrow-sel' : '';
          var clkAttr = canClk ? ' data-trace-lineage="'+_esc(r.id)+'"' : '';
          var yr = (r.timeline_year != null) ? String(r.timeline_year)
                 : (r.stage === 'quran' ? 'undated by rule' : '—');
          h += '<div class="fin-trace-hrow'+clkCls+(isHit?' fin-trace-hrow-hit':'')+trCls+selCls+'"'+clkAttr+'>'
             + '<span class="fin-trace-hrow-yr">'+_esc(yr)+'</span>'
             + '<span class="fin-trace-hrow-stage">'+_esc(r.stage_label||'')+'</span>'
             + '<span class="fin-trace-hrow-name">'+_esc(r.name||'')+'</span>'
             + (r.sect ? '<span class="fin-trace-hrow-sect">'+_esc(r.sect)+'</span>' : '')
             + ((ts === 'untagged') ? '<span class="fin-tag fin-tag-untagged">untagged</span>' : '')
             + '</div>'
             + (isHit ? '<div class="fin-trace-hrow-flag">closest recorded step before this term</div>' : '');
        });
      }
      h += '</section>';

      // 5) QUR'ANIC ORIGIN — q_to_c_map links for this contract; verses from the Q-layer row.
      var qrow = (D.qToCById && D.qToCById[cc]) || null;
      var links = (qrow && qrow.links) || [];
      h += '<section class="fin-trace-sec fin-trace-origin"><div class="fin-trace-sec-h">QUR\'ANIC ORIGIN</div>';
      if(!links.length){
        h += '<div class="fin-hub-none">No sourced Qur\'anic origin link for this contract.</div>';
      } else {
        links.forEach(function(lk){
          var a = String(lk.assurance||'').toLowerCase();
          var qw = _traceQRow(lk.quran_word_id);
          var lab = qw ? ((qw.arabic ? qw.arabic + ' ' : '') + (qw.english || '')).trim() : lk.quran_word_id;
          var cls = 'fin-hub-chip' + (a === 'plausible' ? ' fin-qc-plausible' : (a === 'illustrative' ? ' fin-qc-illustrative' : ''));
          // Clickable when the word exists in D.qlayer → opens the word's hub card (same as HOME).
          var _estCss = (a === 'established') ? 'color:#2ECC71;border-color:rgba(46,204,113,0.5);background:rgba(46,204,113,0.08);' : '';
          var _css = _estCss + (qw ? 'cursor:pointer;' : '');
          var _qAttr = qw ? ' data-trace-qword="'+_esc(lk.quran_word_id)+'"' : '';
          h += '<div class="fin-hub-chips"><span class="'+cls+'"'+_qAttr+(_css?' style="'+_css+'"':'')+' title="'+_esc(lk.note||'')+'">'+_esc(lab||lk.quran_word_id)+'</span></div>';
          if((a === 'plausible' || a === 'illustrative') && lk.note){ h += '<div class="fin-qc-note">'+_esc(lk.note)+'</div>'; }
          var _vhtml = '';
          ((qw && qw.verse_refs) || []).forEach(function(v){
            var ref = (v && v.ref != null) ? String(v.ref) : String(v);
            var p = ref.split(':'); var S = p[0], A = p.slice(1).join(':');
            _vhtml += '<div class="fin-q-card"><div class="fin-q-line">'
              + '<span class="fin-q-ref">Qur\'an '+_esc(S)+':'+_esc(A)+'</span>'
              + '<a class="fin-q-read" href="#start?surah='+_esc(S)+'&verse='+_esc(A)+'" data-s="'+_esc(S)+'" data-a="'+_esc(A)+'">READ</a>'
              + '</div></div>';
          });
          if(_vhtml) h += '<div class="fin-trace-q-grid">'+_vhtml+'</div>';
        });
      }
      h += '</section>';
    }

    h += '</div>';
    return h;
  }
  // ── TRACE's own in-page filter row — three compact bv-dd dropdowns (same component as the
  //    toolbar), writing to the SAME shared state: Tradition/School → F.sect / F.school (so
  //    _tradState works unchanged); Jurisdiction → JURIS (+ _applyJuris, the state SETTINGS reads).
  function _traceFiltersHtml(){
    // Only labels actually present in the tradition data (honest — same _tradCount SETTINGS uses). Sorted A–Z.
    var sects   = SECTS.filter(function(s){ return _tradCount(s) > 0; }).slice().sort(function(a,b){ return a.localeCompare(b); });
    var schools = SCHOOLS.filter(function(s){ return _tradCount(s) > 0; }).slice().sort(function(a,b){ return a.localeCompare(b); });
    // Jurisdictions A–Z, with "International (AAOIFI baseline)" pinned first.
    var jopts = (D.juris||[]).map(function(j){ return {val:j.id, label:(j.name||j.id)}; }).sort(function(a,b){
      var pa = (a.label === 'International (AAOIFI baseline)') ? 0 : 1;
      var pb = (b.label === 'International (AAOIFI baseline)') ? 0 : 1;
      return (pa !== pb) ? (pa - pb) : a.label.localeCompare(b.label);
    });
    var h = '';
    h += _ddHtml('tracetrad','TRADITION',  sects.map(function(s){ return {val:s, label:s, count:_tradCount(s)}; }), {});
    h += _ddHtml('traceschool','SCHOOL',   schools.map(function(s){ return {val:s, label:s, count:_tradCount(s)}; }), {});
    h += _ddHtml('tracejuris','JURISDICTION', jopts, {});
    h += '<span class="fin-trace-fclear" data-trace-filter-clear="1">clear filters</span>';
    return h;
  }
  // Which shared set a TRACE dropdown value belongs to (jurisdiction handled via JURIS).
  function _traceDDHas(dd, v){ return dd==='tracejuris' ? JURIS.has(v) : dd==='tracetrad' ? F.sect.has(v) : F.school.has(v); }
  // Mark checked rows + the active-count on the button for one TRACE dropdown (mirrors _syncDD).
  function _traceSyncDD(wrap){
    var dd = wrap.getAttribute('data-dd'), count = 0;
    wrap.querySelectorAll('.bv-ck-row').forEach(function(r){
      var on = _traceDDHas(dd, r.getAttribute('data-val'));
      if(on) count++;
      r.classList.toggle('checked', on);
      var ck = r.querySelector('.bv-ck'); if(ck) ck.classList.toggle('on', on);
    });
    var btn = wrap.querySelector('.bv-dd-btn'), base = btn.getAttribute('data-base');
    btn.innerHTML = _esc(base)+(count?' ('+count+')':'')+' <span style="opacity:.6">▾</span>';
  }
  // After any filter change, re-render only the current journey (dropdowns stay open for multi-select).
  function _traceApplyFilters(){
    if(_traceSelId) _traceRenderJourney(_traceSelId);
    _syncAllDD();   // keep the (hidden) toolbar dropdowns reflecting F.sect / F.school
  }
  function _wireTraceFilters(box){
    if(!box) return;
    box.querySelectorAll('.bv-dd-wrap').forEach(function(wrap){
      var dd = wrap.getAttribute('data-dd');
      var btn = wrap.querySelector('.bv-dd-btn'), panel = wrap.querySelector('.bv-dd-panel');
      _traceSyncDD(wrap);   // initial checked state + count
      btn.addEventListener('click', function(e){ e.stopPropagation();
        var open = panel.classList.contains('open');
        box.querySelectorAll('.bv-dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
        if(!open) panel.classList.add('open');
      });
      panel.addEventListener('click', function(e){ e.stopPropagation(); });
      wrap.querySelectorAll('.bv-ck-row').forEach(function(row){
        row.addEventListener('click', function(){
          var v = this.getAttribute('data-val');
          if(dd === 'tracejuris'){ if(JURIS.has(v)) JURIS.delete(v); else JURIS.add(v); _applyJuris(); }
          else { var set = (dd==='tracetrad') ? F.sect : F.school; if(set.has(v)) set.delete(v); else set.add(v); }
          _traceSyncDD(wrap);
          _traceApplyFilters();
        });
      });
    });
    box.querySelectorAll('[data-trace-filter-clear]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        F.sect.clear(); F.school.clear(); JURIS.clear(); _applyJuris();
        box.querySelectorAll('.bv-dd-wrap').forEach(_traceSyncDD);
        _traceApplyFilters();
      });
    });
    // Outside-click closes any open TRACE dropdown (the toolbar's _docClick only covers the toolbar).
    if(_traceDocClick) document.removeEventListener('click', _traceDocClick);
    _traceDocClick = function(){ var fb = document.getElementById('fin-trace-filters');
      if(fb) fb.querySelectorAll('.bv-dd-panel.open').forEach(function(p){ p.classList.remove('open'); }); };
    document.addEventListener('click', _traceDocClick);
  }

  // The small gold "selected" chip shown under the search box once a term is picked
  // (term_english + arabic + an "×" to clear). Inline-styled so no CSS file changes.
  function _traceSelChipHtml(){
    var t = _traceSelId && _idx.term[_traceSelId];
    if(!t) return '';
    return '<span class="fin-trace-selchip" style="display:inline-flex;align-items:center;gap:8px;padding:5px 6px 5px 12px;border:1px solid var(--gold,#D4AF37);border-radius:16px;background:rgba(212,175,55,.12);">'
      + '<span style="font-family:\'Source Sans 3\',sans-serif;font-weight:600;font-size:13px;color:#E8C977;">'+_esc(t.term_english||t.id)+'</span>'
      + (t.term_arabic ? '<span style="font-family:\'Crimson Pro\',serif;font-size:13px;color:#C9BFA8;direction:rtl;">'+_esc(t.term_arabic)+'</span>' : '')
      + '<span class="fin-trace-selchip-x" data-trace-clear="1" title="Clear" style="cursor:pointer;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(201,162,74,.28);color:#E8C977;font-size:13px;line-height:1;">×</span>'
      + '</span>';
  }
  function _traceRenderResults(){
    var box     = document.getElementById('fin-trace-results');
    var chipBox = document.getElementById('fin-trace-selchip');
    // Selection active → collapse the results list, show only the selected-term chip.
    if(chipBox) chipBox.innerHTML = _traceSelId ? _traceSelChipHtml() : '';
    if(box){
      if(_traceSelId){
        box.innerHTML = '';   // hide all result rows while a term is selected
      } else {
        box.innerHTML = _traceResultsHtml(_traceMatch(_traceQuery));
        box.querySelectorAll('[data-trace-term]').forEach(function(el){
          el.addEventListener('click', function(e){ e.stopPropagation();
            _traceSelId = el.getAttribute('data-trace-term'); _traceRowSel = null;
            _traceRenderResults(); _traceRenderJourney(_traceSelId);
            _selectTerm(_traceSelId);   // CHANGE 2 — term's own details card appears in the hub immediately
          });
        });
      }
    }
    // "×" on the chip → clear the selection and bring the live results back.
    if(chipBox){
      chipBox.querySelectorAll('[data-trace-clear]').forEach(function(el){
        el.addEventListener('click', function(e){ e.stopPropagation(); _traceSelId = null; _traceRenderResults(); });
      });
    }
  }
  function _traceRenderJourney(tid){
    var box = document.getElementById('fin-trace-journey'); if(!box) return;
    var t = _idx.term[tid]; if(!t){ box.innerHTML = ''; return; }
    box.innerHTML = _traceJourneyHtml(t);
    _wireStdLinks(box);   // SS/FAS/GS/SOAA refs open the STANDARDS reader
    _wireFinJumps(box);   // verse/hadith jump affordances (if any)
    // Contract chip → open the contract's details in the hub (same wiring the hub uses).
    box.querySelectorAll('[data-sel-kind]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _select(el.getAttribute('data-sel-kind'), el.getAttribute('data-sel-id')); });
    });
    // READ pills → open the verse in START (mirrors the contract panel's behaviour).
    box.querySelectorAll('.fin-q-read').forEach(function(a){
      if(!a.hasAttribute('data-s')) return;
      a.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); _finOpenVerse(a.getAttribute('data-s')+':'+a.getAttribute('data-a')); });
    });
    // "Scholars differ" chip → open PRISM, focused on the topic (scrolled into view there).
    box.querySelectorAll('[data-prism-topic]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        _prismFocus = el.getAttribute('data-prism-topic'); _setMode('prism');
      });
    });
    // DATED HISTORY row → the SAME lineage hub TIMELINE shows (_selectRow → _renderLadderHub). Gold selected border.
    _traceEnsureRowStyle();
    box.querySelectorAll('[data-trace-lineage]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var id = el.getAttribute('data-trace-lineage');
        box.querySelectorAll('.fin-trace-hrow-sel').forEach(function(r){ r.classList.remove('fin-trace-hrow-sel'); });
        el.classList.add('fin-trace-hrow-sel');
        _traceRowSel = id;
        _selectRow('lineage', id);   // reuse TIMELINE's lineage hub renderer + wiring
        _traceAddHubBack();          // "← back to term" restores the term's own card
      });
    });
    // QUR'ANIC ORIGIN word chip → that word's hub card (same as HOME's word selection).
    box.querySelectorAll('[data-trace-qword]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectQWord(el.getAttribute('data-trace-qword')); _traceAddHubBack(); });
    });
  }
  // After a row/word drill-down replaces the hub, prepend a "← back to term" link that restores
  // the selected term's own details card (_selectTerm → _hubTerm). TRACE-only; TIMELINE/HOME untouched.
  function _traceAddHubBack(){
    var hub = document.getElementById('finance-hub'); if(!hub || !_traceSelId) return;
    var t = _idx.term[_traceSelId]; if(!t) return;
    var bar = document.createElement('div');
    bar.className = 'fin-trace-hubback';
    bar.innerHTML = '<span class="fin-trace-hubback-link">&#8592; back to '+_esc(t.term_english||t.id)+'</span>';
    bar.querySelector('.fin-trace-hubback-link').addEventListener('click', function(e){ e.stopPropagation(); _selectTerm(_traceSelId); });
    hub.insertBefore(bar, hub.firstChild);
  }
  // Hover + selected styling for clickable DATED HISTORY rows (injected once — no finance.css change).
  function _traceEnsureRowStyle(){
    if(document.getElementById('fin-trace-hrow-style')) return;
    var st = document.createElement('style');
    st.id = 'fin-trace-hrow-style';
    st.textContent =
        '.fin-trace-hrow.clk{cursor:pointer;transition:background .12s;}'
      + '.fin-trace-hrow.clk:hover{background:rgba(212,175,55,.08);}'
      + '.fin-trace-hrow.fin-trace-hrow-sel{border-left-color:var(--gold,#D4AF37);background:rgba(212,175,55,.12);}';
    document.head.appendChild(st);
  }
  function _renderTrace(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var h = '<div class="fin-trace-page">'
          + '<div class="fin-trace-head">'
          +   '<h1 class="fin-trace-h1">TRACE &#8212; from today back to the Qur\'an</h1>'
          +   '<p class="fin-trace-sub">Search any modern term and follow it to its origin.</p>'
          + '</div>'
          + '<input type="text" id="fin-trace-search" class="fin-trace-search" placeholder="Search a term (e.g. murabaha, guarantee, ijara)…" autocomplete="off">'
          + '<div class="fin-trace-filters" id="fin-trace-filters"></div>'
          + '<div class="fin-trace-selchip-wrap" id="fin-trace-selchip"></div>'
          + '<div class="fin-trace-results" id="fin-trace-results"></div>'
          + '<div class="fin-trace-journey-wrap" id="fin-trace-journey"></div>'
          + '</div>';
    canvas.style.height = '';
    canvas.innerHTML = h;
    var input = canvas.querySelector('#fin-trace-search');
    if(input){
      input.value = _traceQuery || '';
      // Typing again clears the selection chip and brings the live results back.
      input.addEventListener('input', function(){ _traceQuery = this.value; _traceSelId = null; _traceRenderResults(); });
    }
    var fbar = canvas.querySelector('#fin-trace-filters');
    if(fbar){ fbar.innerHTML = _traceFiltersHtml(); _wireTraceFilters(fbar); }
    _traceRenderResults();
    if(_traceSelId && _idx.term[_traceSelId]){ _traceRenderJourney(_traceSelId); _selectTerm(_traceSelId); }  // term card in the hub by default
    else { _renderHub(); }   // no term picked → the TRACE hint
    if(ro) ro.textContent = (D.terms||[]).length + ' terms searchable';
  }

  // ── HOME mode — "Financial words of the Qur'an" (the undated ceiling) ──
  //    A scrolling page of the Qur'an-word layer, three tier shelves. No years anywhere.
  // trace_status chip: capitalise first letter; traced → green tone, anything else → amber tone.
  function _traceChip(ts){
    var s = String(ts || ''); if(!s) return '';
    var MAP = { traced:'Traced', partial:'Partial', traced_from_hadith:'From hadith', origin_clear_no_modern_standard:'Origin clear' };
    var lbl = MAP[s] || (s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g,' '));
    var cls = (s === 'traced') ? 'fin-trace-traced' : 'fin-trace-partial';
    return '<span class="fin-q-trace '+cls+'" title="'+_esc(s)+'">'+_esc(lbl)+'</span>';
  }
  function _renderHome(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    _qSel = null;
    var ql = D && D.qlayer;
    var words = (ql && ql.rows) || [], tiers = (ql && ql.tiers) || {};

    if(!words.length){
      canvas.style.height = '';
      if(ro) ro.textContent = '';
      canvas.innerHTML = '<div class="fin-empty">The Qur\'an-word layer is empty.</div>';
      _renderHub();
      return;
    }

    var h = '<div class="fin-home">';
    // Page header — no years, ever, on this page.
    h += '<div class="fin-home-head">'
       + '<div class="fin-home-title">Financial words of the Qur\'an</div>'
       + '<div class="fin-home-sub">The undated ceiling — every trace starts here.</div>'
       + '</div>';
    var _nC = (D.contracts||[]).length, _nT = (D.terms||[]).length, _nS = (D.tracker && D.tracker.counts && D.tracker.counts.total_rows) || 0;
    h += '<div class="fin-home-stats">'
       + '<span class="fin-home-stat"><b>'+words.length+'</b> Qur\'an terms</span>'
       + '<span class="fin-home-stat"><b>'+_nC+'</b> contracts</span>'
       + '<span class="fin-home-stat"><b>'+_nT+'</b> fiqh terms</span>'
       + '<span class="fin-home-stat"><b>'+_nS+'</b> standards mapped</span>'
       + '</div>';

    // Three shelves in tier order A, B, C.
    ['A','B','C'].forEach(function(tier){
      var tw = words.filter(function(w){ return w.tier === tier; });
      if(!tw.length) return;
      h += '<div class="fin-home-shelf"><div class="fin-shelf-head">'
         + '<span class="fin-shelf-title">Tier '+_esc(tier)+'</span>'
         + (tiers[tier] ? '<span class="fin-shelf-desc">'+_esc(tiers[tier])+'</span>' : '')
         + '</div><div class="fin-home-grid">';
      tw.forEach(function(w){
        var n = (w.verse_refs || []).length;
        // READ pill: ON (glowing, opens the first verse) when a cited verse root exists;
        // OFF (pale, inert) when 0 verses. State carried by the .fin-read-off class only.
        var readPill = n
          ? '<span class="fin-word-read" data-fin-verse="'+_esc(w.verse_refs[0].ref)+'">READ</span>'
          : '<span class="fin-word-read fin-read-off" title="No direct Qur\'an verse — this concept is traced via hadith / standards">no verse</span>';
        h += '<div class="fin-q-card fin-word-card'+(_qSel === w.id ? ' sel' : '')+'" data-qid="'+_esc(w.id)+'">'
           + '<div class="fin-word-ar">'+_esc(w.arabic)+'</div>'
           + '<div class="fin-word-en">'+_esc(w.english)+'</div>'
           + '<div class="fin-word-count">'+n+' verse'+(n === 1 ? '' : 's')+'</div>'
           + readPill
           + _traceChip(w.trace_status)
           + '<div class="fin-word-id">'+_esc(w.id)+'</div>'
           + '</div>';
      });
      h += '</div></div>';
    });

    // CONTRACTS shelf — a front-door card per root contract (id order C01..C10). Term counts come
    // straight from the data (_termContracts over D.terms); the 4px left border is the contract colour.
    if(D.contracts && D.contracts.length){
      h += '<div class="fin-home-shelf"><div class="fin-shelf-head">'
         + '<span class="fin-shelf-title">Contracts</span>'
         + '<span class="fin-shelf-desc">The ten root contracts — every term descends from one.</span>'
         + '</div><div class="fin-home-grid">';
      D.contracts.slice().sort(function(a,b){ return String(a.id).localeCompare(String(b.id)); }).forEach(function(cn){
        var col = CONTRACT_COLORS[cn.id] || '#D4AF37';
        var nterms = D.terms.filter(function(t){ return _termContracts(t).indexOf(cn.id) !== -1; }).length;
        var ar = cn.name_arabic || cn.arabic || cn.arabic_name || cn.name_ar || '';
        h += '<div class="fin-c-card" data-cid="'+_esc(cn.id)+'" style="border-left-color:'+col+'">'
           + '<div class="fin-c-name">'+_esc(cn.name || cn.id)+'</div>'
           + (ar ? '<div class="fin-c-ar">'+_esc(ar)+'</div>' : '')
           + '<div class="fin-c-terms">'+nterms+' term'+(nterms === 1 ? '' : 's')+'</div>'
           + '</div>';
      });
      h += '</div></div>';
    }
    h += '</div>';

    canvas.style.height = '';
    canvas.innerHTML = h;

    // Card click → select the word into the Details hub + highlight the card.
    canvas.querySelectorAll('[data-qid]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectQWord(this.getAttribute('data-qid')); });
    });
    // Contract card click → land on TIMELINE with that contract selected + its details panel open
    // (same state as ticking it in the CONTRACT dropdown). stopPropagation so the bg click can't clear it.
    canvas.querySelectorAll('[data-cid]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var cid = this.getAttribute('data-cid');
        F.contract = new Set([cid]);
        _syncAllDD();
        _setMode('timeline');
        _selectContract(cid, true);
      });
    });
    _wireFinJumps(canvas);   // glowing READ pill → open its first cited verse (stopPropagation built in)
    canvas.addEventListener('click', function(){
      _qSel = null;
      canvas.querySelectorAll('.fin-word-card.sel').forEach(function(el){ el.classList.remove('sel'); });
      _renderHub();
    });

    _renderHub();
    if(ro) ro.textContent = words.length + ' Qur\'an terms';
  }
  function _selectQWord(qid){
    _qSel = qid;
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    canvas.querySelectorAll('.fin-word-card').forEach(function(el){
      el.classList.toggle('sel', el.getAttribute('data-qid') === qid);
    });
    var word = ((D.qlayer && D.qlayer.rows) || []).filter(function(w){ return w.id === qid; })[0];
    if(word) _selectQWordHub(word);
  }
  function _selectQWordHub(w){
    var hub = document.getElementById('finance-hub'); if(!hub) return;

    // Header: arabic — english, tier letter chip.
    var h = '<div class="fin-hub-head">'
          + '<span class="fin-hub-title">'+_esc(w.arabic)+' — '+_esc(w.english)+'</span>'
          + '<span class="fin-tier-chip">Tier '+_esc(w.tier)+'</span></div>';

    // Verses (undated) — bold ref, gist under, tag via the existing CONF mapping.
    var vr = w.verse_refs || [];
    h += '<div class="fin-hub-sec">Verses (undated)</div>';
    if(vr.length){
      vr.forEach(function(v){
        var cf = _conf(v.tag);
        h += '<div class="fin-q-card">'
           + '<div class="fin-q-ref">'+_esc(v.ref)+'<span class="fin-badge fin-badge-'+cf.key+'">'+cf.label+'</span>'+_finVerseTag(v.ref)+'</div>'
           + '<div class="fin-q-cited">'+_esc(v.gist)+'</div></div>';
      });
    } else {
      h += '<div class="fin-hub-none">No Qur\'an verse in this layer — see the origin note below.</div>';
    }

    // Meaning.
    if(w.meaning_summary && w.meaning_summary.text){
      var mcf = _conf(w.meaning_summary.tag);
      h += '<div class="fin-hub-sec">Meaning</div><div class="fin-hub-field"><span class="fin-hub-v">'
         + _esc(w.meaning_summary.text)+' <span class="fin-badge fin-badge-'+mcf.key+'">'+mcf.label+'</span></span></div>';
    }

    // Developed into.
    if(w.developed_into){
      h += '<div class="fin-hub-sec">Developed into</div><div class="fin-hub-field"><span class="fin-hub-v">'
         + _esc(w.developed_into)+'</span></div>';
    }

    // Where it lands in the standards.
    var sl = w.standard_landing || [];
    if(sl.length){
      h += '<div class="fin-hub-sec">Where it lands in the standards</div>';
      sl.forEach(function(s){
        var scf = _conf(s.tag);
        h += '<div class="fin-hub-field"><span class="fin-hub-v">'+_linkifyStandards(s.ref)
           + ' <span class="fin-badge fin-badge-'+scf.key+'">'+scf.label+'</span></span></div>';
      });
    }

    // Covered by terms — chips of existing_term_ids resolved via _idx.term (skip unresolved).
    var termChips = (w.existing_term_ids || []).map(function(tid){
      var t = _idx.term[tid]; if(!t) return '';
      return '<span class="fin-hub-chip fin-ladder-link" title="'+_esc(tid)+'">'+_esc(t.term_english || t.term_arabic || tid)+'</span>';
    }).filter(Boolean);
    if(termChips.length){
      h += '<div class="fin-hub-sec">Covered by terms</div><div class="fin-hub-chips">'+termChips.join('')+'</div>';
    }

    // Honesty box (amber) — gap.note and/or a non-Qur'an origin flag, both verbatim. Nothing invented.
    var honesty = '';
    if(w.gap && w.gap.note) honesty += '<div class="fin-honesty-line">'+_esc(w.gap.note)+'</div>';
    if(w.origin_flag)       honesty += '<div class="fin-honesty-line">'+_esc(w.origin_flag)+'</div>';
    if(honesty) h += '<div class="fin-honesty">'+honesty+'</div>';

    // trace_status chip at the bottom.
    if(w.trace_status) h += '<div class="fin-hub-chips" style="padding-top:8px">'+_traceChip(w.trace_status)+'</div>';

    h += _reportBackTag(w.id);
    hub.innerHTML = h;
    _wireStdLinks(hub);
    _wireFinJumps(hub);   // HOME word verse "→ read"
  }

  // ── LADDER mode — a real vertical timeline for one contract ──
  //    Reuses TIMELINE's stem / year-axis / era-band look, but on an ADAPTIVE
  //    piecewise scale (empty centuries squeeze). Row text lives in the hub.
  var LAD_TODAY_YR = 2024;
  var LAD_MIN_GAP = 64, LAD_MAX_GAP = 110;   // px between consecutive dated nodes (compress empty centuries; 64 fits a 3-line label)
  var LAD_BASE_X = 520, LAD_SWAY = 22;       // lifeline sway amplitude
  var LAD_STEM_X = 500, LAD_GAP_X = 512;     // stem centre / dashed-connector x

  // Resolve a links[] id to its display name (T/S/B/E); fallback to the raw id.
  function _linkName(id){
    if(!id) return id;
    var p = String(id).charAt(0);
    if(p === 'T' && _idx.term[id])    return _idx.term[id].term_english || _idx.term[id].term_arabic || id;
    if(p === 'S' && _idx.scholar[id]) return _idx.scholar[id].name || id;
    if(p === 'B' && _idx.book[id])    return _idx.book[id].title_english || _idx.book[id].title_original || id;
    if(p === 'E' && _idx.event[id])   return _idx.event[id].event || id;
    return id;
  }
  // Entity-type → on-screen label (v4). 'revelation' (and anything else) → no label.
  function _entityLabel(et){ return et === 'scholar' ? 'Scholar' : et === 'institution' ? 'Institution' : ''; }
  // Contract "family colour": first concept family whose contracts include cid; fallback gold.
  function _contractColor(cid){
    var fams = _famsForContracts(new Set([cid]));
    for(var i=0;i<fams.length;i++){ var fm = _idx.family[fams[i]]; if(fm && fm.color) return fm.color; }
    return '#D4AF37';
  }
  function _ladderNodeHtml(r, labelStyle){
    var sc = STAGE_COLORS[r.stage] || '#D4AF37', conf = _conf(r.assurance);
    var lbl = r.stage_label || _stageName(r.stage);   // plain-language label, never the raw key
    var title = (r.name && String(r.name).trim()) ? r.name : lbl;
    var etag = _entityLabel(r.entity_type);
    var selCls = (_ladSel === r.id) ? ' sel' : '';
    var nx = (r.__x != null) ? r.__x : LAD_BASE_X;
    var h = '<div class="fin-ladder-node'+selCls+'" data-lid="'+_esc(r.id)+'" style="left:'+nx+'px;top:'+r.__y+'px;background:'+sc+'"></div>';
    h += '<div class="fin-ladder-node-label'+selCls+'" data-lid="'+_esc(r.id)+'" style="top:'+r.__y+'px;'+(labelStyle||'')+'">';
    h += '<div class="fin-ladder-node-title">'+_esc(title)
       + (etag ? '<span class="fin-tag">'+etag+'</span>' : '')
       + '<span class="fin-badge fin-badge-'+conf.key+'">'+conf.label+'</span>'
       + (r.stage === 'current_status' ? '<span class="fin-ladder-today">Today</span>' : '')
       + (r.stage === 'hadith' ? '<span class="fin-read-pill" data-read-hadith="'+_esc(r.id)+'">READ</span>' : '')
       + '</div>';
    var meta = [_esc(lbl)];
    if(r.timeline_year != null) meta.push(_esc(String(r.timeline_year)));
    var trad = [r.sect, r.school, r.movement].filter(Boolean).join(' · ');
    if(trad) meta.push(_esc(trad));
    h += '<div class="fin-ladder-node-meta">'+meta.join(' • ')+'</div></div>';
    return h;
  }
  function _renderLadderHub(r){
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    var conf = _conf(r.assurance), sc = STAGE_COLORS[r.stage] || '#D4AF37';
    var lbl = r.stage_label || _stageName(r.stage);
    var title = _esc(lbl) + (r.timeline_year != null ? ' · '+_esc(String(r.timeline_year)) : '');

    // Header (no badge here — confidence badge is placed near the end per spec order).
    var h = '<div class="fin-hub-head"><span class="fin-hub-swatch" style="background:'+sc+'"></span>'
          + '<span class="fin-hub-title">'+title+'</span></div>';

    // Cross-mode hook → read the same contract as a lecture.
    if(r.contract) h += '<div class="fin-hub-lecline"><a class="fin-lec-cross" data-lad-lecture="'+_esc(r.contract)+'">Read as lecture →</a></div>';

    // Detail
    h += '<div class="fin-hub-sec">Detail</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(r.detail)+'</span></div>';

    // Substantive note (display_note, e.g. "Da'eef — supporting only") as a small chip — NOT dating text.
    if(r.display_note) h += '<div class="fin-hub-chips"><span class="fin-hub-chip">'+_esc(r.display_note)+'</span></div>';

    // Work (v4 work_title)
    if(r.work_title) h += '<div class="fin-hub-field"><span class="fin-hub-k">Work</span><span class="fin-hub-v">'+_esc(r.work_title)+'</span></div>';

    // Citation from v4 hadith_meta (collection_label · number + grading chip)
    if(r.hadith_meta && (r.hadith_meta.collection_label || r.hadith_meta.number)){
      var hm = r.hadith_meta;
      var refTxt = _esc(hm.collection_label || '') + (hm.number ? ' · '+_esc(hm.number) : '');
      var grade  = hm.grading_app ? ' <span class="fin-lec-grade">'+_esc(hm.grading_app)+'</span>' : '';
      h += '<div class="fin-hub-sec">Citation</div><div class="fin-hub-field"><span class="fin-cite">'+refTxt+'</span>'+grade
         + _finHadithTag(hm.collection_label, hm.number)+'</div>';
    }

    // Dating (hadith_meta.dating_app) — earliest–latest + confidence, moved off the spine into DETAILS
    if(r.hadith_meta && r.hadith_meta.dating_app && r.hadith_meta.dating_app.range){
      var _dr = r.hadith_meta.dating_app.range;
      if(_dr.earliest != null || _dr.latest != null){
        var _dc = r.hadith_meta.dating_app.confidence ? ' · ' + r.hadith_meta.dating_app.confidence + ' confidence' : '';
        var _dt = (_dr.earliest != null ? _dr.earliest : '?') + '–' + (_dr.latest != null ? _dr.latest : '?') + ' CE' + _dc;
        h += '<div class="fin-hub-field"><span class="fin-hub-k">Dating</span><span class="fin-hub-v">'+_esc(_dt)+'</span></div>';
      }
    }

    // Person (name) with its entity-type label; tradition from sect/school/movement
    if(r.name){
      var el = _entityLabel(r.entity_type);
      h += '<div class="fin-hub-field">' + (el ? '<span class="fin-hub-k">'+el+'</span>' : '') + '<span class="fin-hub-v">'+_esc(r.name)+'</span></div>';
    }
    var trad = [r.sect, r.school, r.movement].filter(Boolean).join(' · ');
    if(trad) h += '<div class="fin-hub-field"><span class="fin-hub-k">Tradition</span><span class="fin-hub-v">'+_esc(trad)+'</span></div>';

    // Position chip
    if(r.position) h += '<div class="fin-hub-chips"><span class="fin-ladder-pos">'+_esc(r.position)+'</span></div>';

    // Date basis (timeline_year_basis), muted
    if(r.timeline_year_basis) h += '<div class="fin-hub-anchor">date basis: '+_esc(r.timeline_year_basis)+'</div>';

    // Evidence — evidence_display ONLY; when empty, render nothing.
    if(r.evidence_display) h += '<div class="fin-hub-field"><span class="fin-hub-k">Evidence</span><span class="fin-hub-v" style="font-style:italic">'+_linkifyStandards(r.evidence_display)+'</span></div>';

    // Confidence — assurance badge + the raw confidence grade (high/medium/low/period_only)
    h += '<div class="fin-hub-sec">Confidence</div><div class="fin-hub-chips"><span class="fin-badge fin-badge-'+conf.key+'">'+conf.label+'</span>'
       + (r.confidence ? ' <span class="fin-hub-chip">'+_esc(r.confidence)+'</span>' : '') + '</div>';

    // Links — v4 sources only: crosstag.quran_verses, finance_scholar_id, source_link.
    var linkChips = [];
    ((r.crosstag && r.crosstag.quran_verses) || []).forEach(function(v){ linkChips.push('<span class="fin-hub-chip fin-ladder-link">'+_esc(v)+_finVerseTag(v)+'</span>'); });
    if(r.finance_scholar_id && _idx.scholar[r.finance_scholar_id]) linkChips.push('<span class="fin-hub-chip fin-ladder-link">'+_esc(_idx.scholar[r.finance_scholar_id].name)+'</span>');
    if(/^https?:\/\//i.test(r.source_link || '')) linkChips.push('<a class="fin-hub-chip fin-ladder-link" href="'+_esc(r.source_link)+'" target="_blank" rel="noopener">Source ↗</a>');
    if(linkChips.length) h += '<div class="fin-hub-sec">Links</div><div class="fin-hub-chips">'+linkChips.join('')+'</div>';
    h += _reportBackTag(r.id, r.contract);
    hub.innerHTML = h;
    var lecLink = hub.querySelector('[data-lad-lecture]');
    if(lecLink) lecLink.addEventListener('click', function(e){
      e.stopPropagation();
      _lecTopic = { kind:'contract', id:this.getAttribute('data-lad-lecture') };
      _setMode('lecture');
    });
    _wireStdLinks(hub);
    _wireFinJumps(hub);   // verse "→ read" chips + hadith "→ open in Monastic" link
  }
  function _selectLadderNode(lid, rows){
    _ladSel = lid;
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    canvas.querySelectorAll('[data-lid]').forEach(function(el){
      el.classList.toggle('sel', el.getAttribute('data-lid') === lid);
    });
    var r = rows.filter(function(x){ return x.id === lid; })[0];
    if(r) _renderLadderHub(r);
  }
  // First quran_finance_layer verse_refs entry {ref,gist,tag} that matches this ref, or null.
  function _qlayerVerse(ref){
    var ql = (D.qlayer && D.qlayer.rows) || [];
    for(var i=0;i<ql.length;i++){
      var vrs = ql[i].verse_refs || [];
      for(var j=0;j<vrs.length;j++){ if(vrs[j].ref === ref) return vrs[j]; }
    }
    return null;
  }
  // READ · Qur'an → Verses panel: each ref bold; gist + badge from the QFL when present; then the row's story once.
  function _renderQuranVersesHub(r){
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    var sc = STAGE_COLORS[r.stage] || '#D4AF37', lbl = r.stage_label || _stageName(r.stage);
    var h = '<div class="fin-hub-head"><span class="fin-hub-swatch" style="background:'+sc+'"></span>'
          + '<span class="fin-hub-title">'+_esc(lbl)+' · Verses</span></div>';
    var verses = (r.crosstag && r.crosstag.quran_verses) || [];
    h += '<div class="fin-hub-sec">Verses</div>';
    if(verses.length){
      verses.forEach(function(v){
        h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-weight:600">'+_esc(v)+_finVerseTag(v)+'</span></div>';
        var g = _qlayerVerse(v);
        if(g && g.gist) h += '<div class="fin-hub-field"><span class="fin-hub-v">'+_esc(g.gist)+' '+_lecBadge(g.tag)+'</span></div>';
      });
    } else {
      h += '<div class="fin-hub-none">No verses recorded for this row.</div>';
    }
    var story = r.detail_long || r.detail;
    if(story) h += '<div class="fin-hub-field" style="padding-top:8px"><span class="fin-hub-v" style="font-style:italic">'+_esc(story)+'</span></div>';
    hub.innerHTML = h;
    _wireFinJumps(hub);   // verse "→ read" affordances in the ladder Qur'an-pill Verses panel
  }

  // ── QUR'AN WORDS filter (D.quranWordMap = quran_word_filter_map.json) ──
  function _qwordById(wid){
    var rows = (D.quranWordMap && D.quranWordMap.rows) || [];
    for(var i=0;i<rows.length;i++){ if(rows[i].word_id === wid) return rows[i]; }
    return null;
  }
  // Rows to KEEP lit for a selected word: rows whose contract is in highlight_contract_ids, plus rows
  // whose contract belongs to any highlight_term_ids term; plus the Q17 special L095–L103 chain.
  function _qwordKeepIds(w){
    var keepC = {};
    (w.highlight_contract_ids || []).forEach(function(c){ keepC[c] = true; });
    (w.highlight_term_ids || []).forEach(function(tid){
      var t = _idx.term[tid]; if(!t) return;
      _termContracts(t).forEach(function(c){ keepC[c] = true; });
    });
    var keep = new Set();
    (_entries || []).forEach(function(en){
      var cs;
      if(en.kind === 'lineage'){ var lr = _idx.lineage[en.id]; cs = (lr && lr.contract) ? [lr.contract] : []; }
      else { cs = Array.from(_rowContracts(en.kind, en.id)); }
      if(cs.some(function(c){ return keepC[c]; })) keep.add(en.id);
    });
    // Q17 special (exact ids from the map's special field): also light the wadiah lineage chain L095–L103.
    if((w.special || '').indexOf('L095') >= 0){
      for(var n = 95; n <= 103; n++){ keep.add('L' + (n < 100 ? '0' + n : n)); }
    }
    return keep;
  }
  function _applyQwordDim(wid){
    var w = _qwordById(wid); if(!w) return;
    var keep = _qwordKeepIds(w);
    if(!keep.size) return;               // word maps to no timeline rows (e.g. a principle-only word) → don't grey the whole spine
    _applyDim(keep, null);               // otherwise dim non-matching rows, same pattern as the other selections
  }
  function _selectQword(wid){
    _sel = wid ? { type:'qword', id:wid } : null;
    _renderMode();               // rebuild so the READ pill reflects the word; reapply block dims + fills DETAILS
    if(!wid) _renderHub();        // deselected → DETAILS back to its hint
  }
  // DETAILS on word select: arabic — english, tier, origin, verse list (or origin-hadith badge), mapping_tag note.
  function _renderQwordHub(w){
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    var h = '<div class="fin-hub-head"><span class="fin-hub-swatch" style="background:'+(w.glow ? '#D4AF37' : '#8B95A5')+'"></span>'
          + '<span class="fin-hub-title">'+_esc(w.arabic || '')+' — '+_esc(w.english || '')+'</span></div>';
    h += '<div class="fin-hub-chips">'
       + (w.tier ? '<span class="fin-hub-chip">tier '+_esc(w.tier)+'</span>' : '')
       + '<span class="fin-hub-chip">origin: '+_esc(w.origin || '')+'</span></div>';
    h += '<div class="fin-hub-sec">Verses</div>';
    if(w.glow && w.verses && w.verses.length){
      w.verses.forEach(function(v){ h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-weight:600">'+_esc(v)+_finVerseTag(v)+'</span></div>'; });
    } else {
      h += '<div class="fin-hub-none">origin: '+_esc(w.origin || 'hadith')+' — no verse cited (never fabricated)</div>';
    }
    if(w.mapping_tag) h += '<div class="fin-hub-anchor">'+_esc(w.mapping_tag)+'</div>';
    hub.innerHTML = h;
    _wireFinJumps(hub);   // verse "→ read" affordances
  }
  // READ · Hadith → Hadith panel from hadith_meta; story from detail_long/detail; fixed closing line.
  function _renderHadithHub(r){
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    var hm = r.hadith_meta || {}, sc = STAGE_COLORS[r.stage] || '#D4AF37';
    var heading = _esc(hm.collection_label || '') + (hm.number ? ' · '+_esc(hm.number) : '');
    var h = '<div class="fin-hub-head"><span class="fin-hub-swatch" style="background:'+sc+'"></span>'
          + '<span class="fin-hub-title">'+(heading || _esc(r.name || 'Hadith'))+'</span></div>';
    if(IN_APP) h += '<div class="fin-hub-field">'+_finHadithTag(hm.collection_label, hm.number)+'</div>';   // → open in Monastic (IN_APP only)
    if(hm.grading_app){
      var da = /da/i.test(hm.grading_app);
      h += '<div class="fin-hub-chips"><span class="fin-lec-grade'+(da ? ' fin-lec-dim' : '')+'">'+_esc(hm.grading_app)+'</span>'
         + (da ? ' <span class="fin-hub-none" style="font-style:normal">Supporting narration only</span>' : '') + '</div>';
    }
    if(hm.narrator) h += '<div class="fin-hub-field"><span class="fin-hub-v">Narrator: '+_esc(hm.narrator)+'</span></div>';
    var topics = (hm.topics_app || []).join(' · ');
    if(topics) h += '<div class="fin-hub-field"><span class="fin-hub-v" style="color:#8B95A5">'+_esc(topics)+'</span></div>';
    var story = r.detail_long || r.detail;
    if(story) h += '<div class="fin-hub-sec">Story</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(story)+'</span></div>';
    h += '<div class="fin-hub-anchor" style="margin-top:8px">Citation reference — full text is not stored in this prototype.</div>';
    hub.innerHTML = h;
    _wireFinJumps(hub);   // "→ open in Monastic" link (IN_APP)
  }
  function _renderLadder(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var ro = document.getElementById('finance-readout');
    var lin = (D && D.lineage) || [];
    _ladSel = null;

    // The CONTRACT dropdown is the selector; need exactly one C-contract chosen.
    var chosen = (F.contract.size === 1) ? Array.from(F.contract)[0] : null;
    if(!chosen || !/^C\d{2}$/.test(chosen)){
      canvas.style.height = '';
      if(ro) ro.textContent = '';
      canvas.innerHTML = '<div class="fin-empty">Choose one contract above to see its evidence ladder.</div>';
      _renderHub();
      return;
    }

    var c    = _idx.contract[chosen] || {};
    var rows = lin.filter(function(r){ return r.contract === chosen; });
    // Every row is a node (v4 has no evidentiary_tier header row).
    var nodeRows = rows;

    // FIX 3 — centre the ladder: put the gold stem at 46% of the canvas width so the assembly uses the
    // dead right half. Fall back to the fixed x when the width is unknown (0). DX offsets everything that
    // sits on/right of the stem; the left-side labels keep left:0 and simply GAIN width up to the stem.
    var _cw   = canvas.clientWidth || 0;
    var stemX = _cw ? Math.round(_cw * 0.46) : LAD_STEM_X;
    var DX    = stemX - LAD_STEM_X;
    var baseX = LAD_BASE_X + DX, gapX = LAD_GAP_X + DX, noteXbase = 458 + DX;
    var yrX   = 470 + DX, hijX = 582 + DX, eraX = 506 + DX;
    var labelW = Math.max(160, stemX - 48);                 // left labels: right edge stays next to the stem
    var _labelStyle = 'width:'+labelW+'px;';                // node labels keep left:0, widen as the stem moves

    // Header band — mirror TIMELINE's arrangement: CE/هـ toggle up top, then the QUR'AN pill + READ
    // side by side below it, with clear vertical spacing so nothing overlaps at any zoom.
    var rulerY = 60;                  // CE/هـ toggle, clear of the sticky contract header
    var pillY  = 118;                 // QUR'AN pill + READ, clear gap below the toggle

    // Bucket rows. The Qur'an row (stage 'quran', undated by rule) is the START of every lineage —
    // pin it at the TOP, directly under the pill, never in the bottom undated shelf. Note rows
    // (no_direct_verse / no_direct_hadith) stay pinned beside the pill; everything dated weaves in.
    var notes = [], dated = [], undated = [], quranTops = [];
    nodeRows.forEach(function(r){
      if(r.stage === 'quran'){ quranTops.push(r); return; }
      if(r.position === 'no_direct_verse' || r.position === 'no_direct_hadith'){ notes.push(r); return; }
      var yr = (r.stage === 'current_status') ? LAD_TODAY_YR : (r.timeline_year != null ? r.timeline_year : null);
      if(yr == null){ undated.push(r); } else { r.__yr = yr; dated.push(r); }
    });
    dated.sort(function(a,b){ return a.__yr - b.__yr; });

    var quranTopY  = pillY + 44;                             // Qur'an node(s) directly under the pill
    var quranSlotH = quranTops.length ? (quranTops.length * 48 + 12) : 0;
    var firstNodeY = pillY + 62 + quranSlotH;                // first dated node sits below the pill (+ Qur'an slot)

    // ── Adaptive piecewise scale: gap ∝ year-gap, clamped [64,220]px. ──
    var years = [];
    dated.forEach(function(r){ if(years.indexOf(r.__yr) < 0) years.push(r.__yr); });
    years.sort(function(a,b){ return a - b; });
    var anchorY = {}, yacc = firstNodeY;
    years.forEach(function(yr, i){
      if(i === 0){ anchorY[yr] = yacc; }
      else { var g = yr - years[i-1]; yacc += Math.max(LAD_MIN_GAP, Math.min(LAD_MAX_GAP, g)); anchorY[yr] = yacc; }
    });
    // Map ANY year through the same anchors (piecewise-linear, extrapolate at ends).
    function mapYear(q){
      if(!years.length) return firstNodeY;
      if(years.length === 1) return anchorY[years[0]];
      var n = years.length;
      if(q <= years[0]){
        var s0 = (anchorY[years[1]] - anchorY[years[0]]) / (years[1] - years[0]);
        return anchorY[years[0]] + s0 * (q - years[0]);
      }
      if(q >= years[n-1]){
        var s1 = (anchorY[years[n-1]] - anchorY[years[n-2]]) / (years[n-1] - years[n-2]);
        return anchorY[years[n-1]] + s1 * (q - years[n-1]);
      }
      for(var i=1;i<n;i++){
        if(years[i] >= q){ var a = years[i-1], b = years[i];
          return anchorY[a] + (anchorY[b] - anchorY[a]) * (q - a) / (b - a); }
      }
      return anchorY[years[n-1]];
    }

    // Node Y from its year anchor, then nudge duplicate-year collisions.
    // 58px minimum — a row label is up to 3 lines (title+badge, READ pill, meta); 30px caused overlap.
    dated.forEach(function(r){ r.__y = anchorY[r.__yr]; });
    var prevY = -1e9;
    dated.forEach(function(r){ if(r.__y < prevY + 58) r.__y = prevY + 58; prevY = r.__y; });

    // All dated rows are lifeline nodes (sway x). Note rows are pinned by the pill. (baseX carries DX.)
    dated.forEach(function(r, i){ r.__x = baseX + (i % 2 ? LAD_SWAY : 0); });
    var noteX = noteXbase;
    notes.forEach(function(r, i){ r.__x = noteX; r.__y = pillY + (i - (notes.length - 1) / 2) * 16; });
    // Qur'an origin node(s) pinned at the top, on the lifeline, before the first dated node.
    quranTops.forEach(function(r, i){ r.__y = quranTopY + i * 48; r.__x = baseX; });
    var lastQuranY = quranTops.length ? quranTops[quranTops.length-1].__y : 0;

    var lastDatedY = dated.length ? dated[dated.length-1].__y : (pillY + 30);
    var shelfTop = lastDatedY + 90;
    undated.forEach(function(r, i){ r.__y = shelfTop + i * 32; r.__x = baseX; });

    var color = _contractColor(chosen);
    var drawLife = dated.length > 0;
    var hasNotes = notes.length > 0;
    var hasQuran = quranTops.length > 0;

    // Curve points. The Qur'an node is the lifeline ORIGIN when present; otherwise (no notes) the
    // lifeline starts at the pill. With notes but no Qur'an origin, a dashed connector spans pill → node.
    var pts = [];
    if(hasQuran) quranTops.forEach(function(r){ pts.push({ x: r.__x, y: r.__y }); });
    else if(drawLife && !hasNotes) pts.push({ x: stemX, y: pillY });
    dated.forEach(function(r){ pts.push({ x: r.__x, y: r.__y }); });
    var gap = (hasNotes && drawLife && !hasQuran) ? { y1: pillY, y2: dated[0].__y } : null;

    // Stem + lifeline END at the last dated node (TODAY). Nothing past it. Reach the Qur'an node too.
    var stemTop = pillY - 16;
    var stemBot = dated.length ? lastDatedY : Math.max(pillY + 30, lastQuranY + 12);
    var lowest  = Math.max(stemBot, lastQuranY, undated.length ? (shelfTop + (undated.length - 1) * 32) : 0);
    var totalH  = lowest + 120;

    var html = '';
    // Sticky header strip: contract name only (the Qur'an pill on the spine is the sole header element).
    html += '<div class="fin-ladder-header"><span class="fin-ladder-contract">'+_esc(c.name || chosen)+'</span></div>';

    // Era bands through the adaptive mapping, clamped to the content.
    FIN_ERAS.forEach(function(era){
      var y1 = Math.max(0, mapYear(era.start));
      var y2 = Math.min(stemBot, mapYear(era.end));
      var bandH = y2 - y1; if(bandH <= 0) return;
      // FIX 4 — era label sits just right of the lifeline lane (~120px right of the stem), vertically
      // centred, 11px. Background tint stays full-width to the right of the stem (shifted with it).
      html += '<div class="fin-era-band fin-era-band-lad" style="left:'+eraX+'px;top:'+y1+'px;height:'+bandH+'px;background:linear-gradient(to right,transparent 15%,rgba('+era.glow+',0.04) 50%,rgba('+era.glow+',0.10) 100%)">';
      if(bandH >= 20){
        html += '<span class="fin-era-band-label" style="color:rgba('+era.glow+',0.85)">'+_esc(era.name)+'</span>';
        html += '<span class="fin-era-band-dates" style="color:rgba('+era.glow+',0.7)">'+_esc(era.dates)+'</span>';
      }
      html += '</div>';
    });

    html += '<div class="fin-stem" style="left:'+stemX+'px;top:'+stemTop+'px;height:'+(stemBot - stemTop)+'px"></div>';
    // CE/هـ ruler toggle — pinned above the QUR'AN pill (matches TIMELINE), replacing the old CE cap
    // that overlapped the pill. The pill + READ sit clearly below it (see pillY).
    html += '<div class="fin-ruler-toggle" style="left:'+stemX+'px;top:'+rulerY+'px">'
          + '<span class="fin-ruler-btn'+(_showCE?' on':'')+'" data-ruler="ce">CE</span>'
          + '<span class="fin-ruler-sep">│</span>'
          + '<span class="fin-ruler-btn'+(_showHijri?' on':'')+'" data-ruler="hij">هـ</span></div>';

    // Dashed "derived" connector — line only, no text.
    if(gap){
      html += '<div class="fin-ladder-gap" style="left:'+gapX+'px;top:'+gap.y1+'px;height:'+Math.max(2, gap.y2 - gap.y1)+'px"></div>';
    }

    // Curved contract lifeline (SVG). Nodes sit exactly on it.
    if(pts.length >= 2){
      var d = 'M '+pts[0].x+' '+pts[0].y.toFixed(1);
      for(var pi=1; pi<pts.length; pi++){
        var p0 = pts[pi-1], p1 = pts[pi], cy = ((p0.y + p1.y) / 2).toFixed(1);
        d += ' C '+p0.x+' '+cy+', '+p1.x+' '+cy+', '+p1.x+' '+p1.y.toFixed(1);
      }
      html += '<svg class="fin-ladder-life-svg" width="'+Math.max(720, stemX + 260)+'" height="'+totalH+'" '
            + 'style="position:absolute;left:0;top:0;pointer-events:none;z-index:2;overflow:visible">'
            + '<path d="'+d+'" fill="none" stroke="'+color+'" stroke-width="3" stroke-linecap="round"/></svg>';
    }

    // Spine header — fixed gold QUR'AN pill + a SEPARATE READ pill (identical to TIMELINE).
    // READ is live only when the quran-stage row actually cites verses; else pale/non-clickable.
    var quranRow = rows.filter(function(r){ return r.stage === 'quran'; })[0];
    var _ladV    = quranRow && quranRow.crosstag && quranRow.crosstag.quran_verses;
    var _ladRead = (_ladV && _ladV.length)
      ? '<span class="fin-qread" data-read-quran="'+_esc(quranRow.id)+'">READ</span>'
      : '<span class="fin-qread fin-qread-off">READ</span>';
    html += '<div class="fin-qpill-wrap" style="left:'+stemX+'px;top:'+pillY+'px"><span class="fin-qpill">QUR\'AN</span>'+_ladRead+'</div>';

    // Year marks (CE left of stem, AH right) — ONE label per year GROUP (first row only), so a cluster of
    // same-year rows reads as a single tight block. `dated` is year-sorted, so tracking the last year does it.
    // Visibility follows the CE/هـ toggle.
    var _lastYrLabel = null;
    dated.forEach(function(r){
      if(r.__yr === _lastYrLabel) return;
      _lastYrLabel = r.__yr;
      var n = r.__yr, hij = _ceToHijri(n);
      html += '<div class="fin-yr-mark" style="left:'+yrX+'px;top:'+r.__y+'px;'+(_showCE?'':'display:none')+'">'+Math.abs(n)+'<span class="year-era">'+(n<0?'BCE':'CE')+'</span></div>';
      html += '<div class="fin-hij-mark fin-ladder-hij" style="left:'+hijX+'px;top:'+r.__y+'px;'+(_showHijri?'':'display:none')+'">'+(hij<0?Math.abs(hij)+'<span class="year-era">ق.هـ</span>':hij+'<span class="year-era">هـ</span>')+'</div>';
    });

    // Nodes.
    dated.forEach(function(r){ html += _ladderNodeHtml(r, _labelStyle); });
    // Qur'an origin node(s) pinned at the TOP, directly under the pill, before the first dated node.
    quranTops.forEach(function(r){ html += _ladderNodeHtml(r, _labelStyle); });

    // Note-dots (no direct verse/hadith) pinned beside the pill, clickable.
    notes.forEach(function(r){
      html += '<div class="fin-ladder-note'+(_ladSel === r.id ? ' sel' : '')+'" data-lid="'+_esc(r.id)+'" '
            + 'style="left:'+r.__x+'px;top:'+r.__y+'px" title="'+_esc(r.stage_label || r.stage)+'"></div>';
    });

    // Undated shelf (now empty for all contracts — render nothing when empty).
    if(undated.length){
      html += '<div class="fin-ladder-shelf" style="width:'+labelW+'px;top:'+(shelfTop - 26)+'px">Undated</div>';
      undated.forEach(function(r){ html += _ladderNodeHtml(r, _labelStyle); });
    }

    canvas.style.height = totalH + 'px';
    canvas.innerHTML = html;

    // CE/هـ ruler toggle → show/hide the year marks (same behaviour as TIMELINE).
    canvas.querySelectorAll('.fin-ruler-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var w = this.getAttribute('data-ruler');
        if(w==='ce'){ _showCE=!_showCE; this.classList.toggle('on',_showCE); canvas.querySelectorAll('.fin-yr-mark').forEach(function(m){ m.style.display=_showCE?'':'none'; }); }
        if(w==='hij'){ _showHijri=!_showHijri; this.classList.toggle('on',_showHijri); canvas.querySelectorAll('.fin-hij-mark').forEach(function(m){ m.style.display=_showHijri?'':'none'; }); }
      });
    });

    // Wire node selection → Details hub.
    canvas.querySelectorAll('[data-lid]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectLadderNode(this.getAttribute('data-lid'), rows); });
    });
    // READ pills → dedicated panels (stopPropagation so the node isn't selected).
    canvas.querySelectorAll('[data-read-quran]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var row = rows.filter(function(x){ return x.id === el.getAttribute('data-read-quran'); })[0];
        if(row) _renderQuranVersesHub(row);
      });
    });
    canvas.querySelectorAll('[data-read-hadith]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation();
        var row = rows.filter(function(x){ return x.id === el.getAttribute('data-read-hadith'); })[0];
        if(!row) return;
        var hm = row.hadith_meta || {};
        if(IN_APP) _finOpenHadith(hm.collection_label, hm.number);   // in-app → MONASTIC, filtered
        else _renderHadithHub(row);                                  // standalone → local story panel
      });
    });
    canvas.addEventListener('click', function(){
      _ladSel = null;
      canvas.querySelectorAll('.sel').forEach(function(el){ el.classList.remove('sel'); });
      _renderHub();
    });

    _renderHub();
    if(ro) ro.textContent = nodeRows.length + ' lineage rows';
  }

  // ── Canvas interactions ──
  function _wireCanvas(canvas){
    canvas.querySelectorAll('.fin-ruler-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var w = this.getAttribute('data-ruler');
        if(w==='ce'){ _showCE=!_showCE; this.classList.toggle('on',_showCE); canvas.querySelectorAll('.fin-yr-mark').forEach(function(m){ m.style.display=_showCE?'':'none'; }); }
        if(w==='hij'){ _showHijri=!_showHijri; this.classList.toggle('on',_showHijri); canvas.querySelectorAll('.fin-hij-mark').forEach(function(m){ m.style.display=_showHijri?'':'none'; }); }
      });
    });
    canvas.querySelectorAll('.fin-row').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectRow(el.getAttribute('data-kind'), el.getAttribute('data-id')); });
    });
    canvas.querySelectorAll('[data-fam]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectFamily(el.getAttribute('data-fam')); });
    });
    canvas.querySelectorAll('.fin-start-read').forEach(function(a){
      a.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var fm = _idx.family[this.getAttribute('data-fam')];
        var S = parseInt(this.getAttribute('data-s'),10), A = parseInt(this.getAttribute('data-a'),10);
        if(fm) _openConceptInStart(fm.family_name, _familyVerses(fm), S, A);
        else _openVerse(S, A);
      });
    });
    // Term origin markers + undated chips → select the term in the details panel. stopPropagation so the
    // canvas-background click (which clears the selection) and other row handlers never fire.
    canvas.querySelectorAll('[data-term-origin]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectTerm(el.getAttribute('data-term-origin')); });
    });
    canvas.querySelectorAll('[data-term-chip]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectTerm(el.getAttribute('data-term-chip')); });
    });
    canvas.addEventListener('click', function(){ _clearSelection(); });
  }

  function _rowLinkedIds(kind, id){
    var ids = new Set();
    if(kind==='scholar'){
      _eventsForScholar(id).forEach(function(e){ ids.add(e); });
      _booksForScholar(id).forEach(function(b){ ids.add(b); });
    } else if(kind==='book'){
      var b = _idx.book[id]; if(b){ var a=_bookAuthorId(b); if(a) ids.add(a); }
    } else if(kind==='event'){
      var e = _idx.event[id];
      if(e) (e.linked_scholars||[]).forEach(function(s){ ids.add(s); });
      var m = D.crosslinks.events_to_scholars || {};
      (m[id]||[]).forEach(function(s){ ids.add(s); });
    }
    return ids;
  }
  function _rowTouchedFams(kind, id){
    var cs = _rowContracts(kind, id);
    var fams = new Set();
    D.families.forEach(function(fm){
      if(!F.concepts.has(fm.id)) return;
      var fc = _familyContracts(fm), hit = false;
      cs.forEach(function(c){ if(fc.has(c)) hit = true; });
      if(hit) fams.add(fm.id);
    });
    return fams;
  }
  function _applyDim(keepIds, keepFams){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    canvas.querySelectorAll('.fin-row').forEach(function(el){
      var on = keepIds.has(el.getAttribute('data-id'));
      el.classList.toggle('fin-dimmed', !on);
      el.classList.toggle('fin-selected', !!(_sel && el.getAttribute('data-id')===_sel.id && _sel.type==='row'));
    });
    canvas.querySelectorAll('.fin-conf-dot').forEach(function(el){ el.classList.toggle('fin-dimmed', !keepIds.has(el.getAttribute('data-id'))); });
    canvas.querySelectorAll('[data-fam]').forEach(function(el){
      if(!keepFams){ el.classList.remove('fin-dimmed'); return; }
      el.classList.toggle('fin-dimmed', !keepFams.has(el.getAttribute('data-fam')));
    });
  }
  function _select(kind, id){
    if(kind==='family') _selectFamily(id);
    else if(kind==='contract') _selectContract(id);
    else _selectRow(kind, id);
  }
  function _selectRow(kind, id){
    _sel = { type:'row', kind:kind, id:id };
    var linked = _rowLinkedIds(kind, id); linked.add(id);
    var keepFams = F.concepts.size ? _rowTouchedFams(kind, id) : null;
    _applyDim(linked, keepFams);
    _renderHub();
  }
  function _selectFamily(fid){
    var fm = _idx.family[fid]; if(!fm) return;
    _sel = { type:'family', id:fid };
    _applyDim(_familyLinkedIds(fm), new Set([fid]));
    _renderHub();
  }
  // noDim: filter-driven selection (a single contract picked in the CONTRACT filter). Show the
  // contract's details panel, but keep EVERY filter-passed row at full opacity — no spine dim.
  // Dimming is reserved for click-selection (contract chip / row / family clicks) where noDim is falsy.
  function _selectContract(cid, noDim){
    var c = _idx.contract[cid]; if(!c) return;
    _sel = { type:'contract', id:cid, noDim:!!noDim };
    if(noDim){
      var canvas = document.getElementById('finance-canvas');
      if(canvas){
        canvas.querySelectorAll('.fin-dimmed').forEach(function(el){ el.classList.remove('fin-dimmed'); });
        canvas.querySelectorAll('.fin-selected').forEach(function(el){ el.classList.remove('fin-selected'); });
      }
      _renderHub();
      return;
    }
    var keepIds = new Set();
    D.books.forEach(function(b){ if((b.contracts_covered||[]).indexOf(cid)!==-1){ keepIds.add(b.id); var a=_bookAuthorId(b); if(a) keepIds.add(a); } });
    D.events.forEach(function(e){ if((e.linked_contracts||[]).indexOf(cid)!==-1){ keepIds.add(e.id); (e.linked_scholars||[]).forEach(function(s){ keepIds.add(s); }); } });
    var keepFams = new Set();
    D.families.forEach(function(fm){ if(F.concepts.has(fm.id) && _familyContracts(fm).has(cid)) keepFams.add(fm.id); });
    _applyDim(keepIds, F.concepts.size ? keepFams : null);
    _renderHub();
  }
  // Select a finance term → its details panel. No spine dim; clear any prior dim so the panel is the focus.
  function _selectTerm(id){
    if(!_idx.term[id]) return;
    _sel = { type:'term', id:id };
    var canvas = document.getElementById('finance-canvas');
    if(canvas){
      canvas.querySelectorAll('.fin-dimmed').forEach(function(el){ el.classList.remove('fin-dimmed'); });
      canvas.querySelectorAll('.fin-selected').forEach(function(el){ el.classList.remove('fin-selected'); });
    }
    _renderHub();
  }
  function _clearSelection(){
    _sel = null;
    var canvas = document.getElementById('finance-canvas');
    if(canvas){
      canvas.querySelectorAll('.fin-dimmed').forEach(function(el){ el.classList.remove('fin-dimmed'); });
      canvas.querySelectorAll('.fin-selected').forEach(function(el){ el.classList.remove('fin-selected'); });
    }
    _renderHub();
  }

  // ── Info hub (right column) — shows EVERYTHING tagged to the selection ──
  function _label(k){ return k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g,' '); }
  // Unresolved-status value? (case-insensitive, ignoring spaces/underscores) — the Assurance chip carries this signal.
  function _isUnresolved(v){
    var s = String(v == null ? '' : v).toLowerCase().replace(/[\s_]+/g, '');
    return s === 'needsverification' || s === 'needscheck' || s === 'unverified';
  }
  function _fmtField(k, v){
    if(k==='assurance') return _esc(_conf(v).label);   // map — never print the raw word
    if(Array.isArray(v)) return v.map(function(x){ return _esc(String(x)); }).join(', ');
    if(v && typeof v==='object') return _esc(JSON.stringify(v));
    return _esc(String(v));
  }
  function _allFieldsHtml(rec, skip){
    var h = '';
    Object.keys(rec).forEach(function(k){
      if(skip && skip.indexOf(k)!==-1) return;
      if(/verified/i.test(k) || /needs[\s_]*(?:check|verification)/i.test(k)) return;  // key's label would carry a banned word
      var v = rec[k];
      if(v==null) return;
      if(typeof v==='string' && v.trim()==='') return;
      if(typeof v==='string' && _isUnresolved(v)) return;   // skip unresolved-status values (badge carries the signal)
      if(Array.isArray(v) && !v.length) return;
      h += '<div class="fin-hub-field"><span class="fin-hub-k">'+_esc(_label(k))+'</span><span class="fin-hub-v">'+_fmtField(k,v)+'</span></div>';
    });
    return h;
  }
  function _selChips(items){
    if(!items.length) return '<span class="fin-hub-none">none</span>';
    return items.map(function(it){
      return '<span class="fin-hub-chip" data-sel-kind="'+_esc(it.kind)+'" data-sel-id="'+_esc(it.id)+'"'
        + (it.color?' style="border-color:'+it.color+';color:'+it.color+'"':'') + '>'+_esc(it.label)+'</span>';
    }).join('');
  }
  function _termCardHtml(t){
    var en = t.enrichment;
    var hasEn = !!(en && typeof en === 'object');
    return '<div class="fin-term-card">'
      + '<div class="fin-term-ar">'+_esc(t.term_arabic||'')+'</div>'
      + '<div class="fin-term-en">'+_esc(t.term_english||'')+' <span class="fin-badge fin-badge-'+_conf(t.assurance).key+'">'+_conf(t.assurance).label+'</span></div>'
      + ((t.earliest_source && !_isUnresolved(t.earliest_source))?'<div class="fin-term-src">'+_esc(t.earliest_source)+'</div>':'')
      + (hasEn ? ('<span class="fin-term-links-toggle" data-term-enrich-toggle="1">▸ links</span>'
                 + '<div class="fin-term-enrich">' + _termEnrichHtml(en) + '</div>') : '')
      + '</div>';
  }
  // Look up a Qur'an-word row by its word_id in the filter map (used for enrichment word chips).
  function _qWordById(id){
    var rows = (D.quranWordMap && D.quranWordMap.rows) || [];
    for(var i=0;i<rows.length;i++){ if(rows[i] && rows[i].word_id === id) return rows[i]; }
    return null;
  }
  // Expandable enrichment body for a term card. Sections in order: Qur'an words → Contracts → Concept
  // family → Standards; each skipped when empty. If none of the four link kinds exist, one muted line.
  // lineage_refs and the internal *_link_tag strings are intentionally NOT shown.
  function _termEnrichHtml(en){
    var qids  = (en.quran_word_ids   || []);
    var qvers = (en.quran_word_verses|| []);
    var cids  = (en.contract_ids     || []);
    var fids  = (en.family_ids       || []);
    var srefs = (en.standard_refs    || []);
    if(!qids.length && !cids.length && !fids.length && !srefs.length){
      return '<div class="fin-hub-none">No approved links yet for this term.</div>';
    }
    var h = '';
    // a) Qur'an words — word chips, then verse cards (same markup as _versesHtml).
    if(qids.length || qvers.length){
      h += '<div class="fin-term-enrich-sec">Qur\'an words</div>';
      if(qids.length){
        h += '<div class="fin-hub-chips">' + qids.map(function(id){
          var w = _qWordById(id); var lab = w ? (w.arabic || w.english || id) : id;
          return '<span class="fin-hub-chip">'+_esc(lab)+'</span>';
        }).join('') + '</div>';
      }
      qvers.forEach(function(vs){
        var p = String(vs).split(':'); var S = p[0]; var A = p.slice(1).join(':');
        h += '<div class="fin-q-card"><div class="fin-q-line">'
          + '<span class="fin-q-ref">Qur\'an '+_esc(S)+':'+_esc(A)+'</span>'
          + '<a class="fin-q-read" href="#start?surah='+_esc(S)+'&verse='+_esc(A)+'" data-s="'+_esc(S)+'" data-a="'+_esc(A)+'">READ</a>'
          + '</div></div>';
      });
    }
    // b) Contracts — clickable selection chips.
    if(cids.length){
      h += '<div class="fin-term-enrich-sec">Contracts</div><div class="fin-hub-chips">'
         + _selChips(cids.map(function(c){ return {kind:'contract', id:c, label:(_idx.contract[c]||{}).name||c}; })) + '</div>';
    }
    // c) Concept family — clickable selection chips with family colour.
    if(fids.length){
      h += '<div class="fin-term-enrich-sec">Concept family</div><div class="fin-hub-chips">'
         + _selChips(fids.map(function(f){ var fm=_idx.family[f]||{}; return {kind:'family', id:f, label:fm.family_name||f, color:fm.color}; })) + '</div>';
    }
    // d) Standards (clause-verified) — name, then each clause row, then a muted verified tag.
    if(srefs.length){
      h += '<div class="fin-term-enrich-sec">Standards (clause-verified)</div>';
      srefs.forEach(function(sr){
        h += '<div class="fin-term-std-name">'+_esc(sr.standard||'')+'</div>';
        (sr.clauses||[]).forEach(function(cl){ h += '<div class="fin-term-std-clause">'+_esc(cl)+'</div>'; });
        if(sr.verified) h += '<div class="fin-term-std-ver">verified: '+_esc(sr.verified)+'</div>';
      });
    }
    return h;
  }
  function _versesHtml(verses){
    var h = '<div class="fin-hub-sec">Qur\'an references ('+verses.length+')<span class="fin-hub-sub"> · from dataset citations — pending vetting</span></div>';
    if(!verses.length){
      h += '<div class="fin-hub-none">No Qur\'an verse cited in the dataset for this — needs sourcing.</div>';
    } else {
      verses.forEach(function(v){
        h += '<div class="fin-q-card"><div class="fin-q-line">'
          + '<span class="fin-q-ref">Qur\'an '+v.surah+':'+v.ayah+'</span>'
          + '<a class="fin-q-read" href="#start?surah='+v.surah+'&verse='+v.ayah+'" data-s="'+v.surah+'" data-a="'+v.ayah+'">READ</a></div>'
          + '<div class="fin-q-cited">cited for '+_esc(v.cited_for||'')+'</div></div>';
      });
    }
    return h;
  }
  function _hubHeader(title, conf, color){
    var badge = conf ? '<span class="fin-badge fin-badge-'+conf.key+'">'+conf.label+'</span>' : '';
    var sw = color ? '<span class="fin-hub-swatch" style="background:'+color+'"></span>' : '';
    return '<div class="fin-hub-head">'+sw+'<span class="fin-hub-title">'+title+'</span>'+badge+'</div>';
  }
  function _hubRow(kind, id){
    var rec = _idx[kind][id]; if(!rec) return '';
    var title = (kind==='scholar') ? rec.name : (kind==='book') ? (rec.title_english||rec.title_original||rec.id) : rec.event;
    var h = _hubHeader(_esc(title), _conf(rec.assurance), null);
    h += '<div class="fin-hub-sec">Details</div>';
    h += _allFieldsHtml(rec, (kind==='scholar')?['name']:(kind==='book')?['title_english']:['event']);

    var cs = Array.from(_rowContracts(kind, id));
    if(kind==='scholar'){
      var bks = Array.from(_booksForScholar(id)).map(function(b){ return {kind:'book', id:b, label:(_idx.book[b]||{}).title_english||b}; });
      var evs = Array.from(_eventsForScholar(id)).map(function(e){ return {kind:'event', id:e, label:(_idx.event[e]||{}).event||e}; });
      h += '<div class="fin-hub-sec">Linked books</div><div class="fin-hub-chips">'+_selChips(bks)+'</div>';
      h += '<div class="fin-hub-sec">Linked events</div><div class="fin-hub-chips">'+_selChips(evs)+'</div>';
    } else if(kind==='book'){
      var a = _bookAuthorId(rec);
      var authHtml = (a && _idx.scholar[a]) ? _selChips([{kind:'scholar', id:a, label:_idx.scholar[a].name}]) : '<span class="fin-hub-none">'+_esc(_bookAuthorLabel(rec))+'</span>';
      h += '<div class="fin-hub-sec">Author</div><div class="fin-hub-chips">'+authHtml+'</div>';
      if(rec.public_url) h += '<div class="fin-hub-sec">Read</div><a class="fin-q-read" href="'+_esc(rec.public_url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">READ ↗</a>';
    } else {
      var scs = (rec.linked_scholars||[]).map(function(s){ return {kind:'scholar', id:s, label:(_idx.scholar[s]||{}).name||s}; });
      var m = D.crosslinks.events_to_scholars || {};
      (m[id]||[]).forEach(function(s){ if(!scs.some(function(x){ return x.id===s; })) scs.push({kind:'scholar', id:s, label:(_idx.scholar[s]||{}).name||s}); });
      h += '<div class="fin-hub-sec">Linked scholars</div><div class="fin-hub-chips">'+_selChips(scs)+'</div>';
    }
    h += '<div class="fin-hub-sec">Contracts touched</div><div class="fin-hub-chips">'
       + _selChips(cs.map(function(c){ return {kind:'contract', id:c, label:(_idx.contract[c]||{}).name||c}; })) + '</div>';
    h += '<div class="fin-hub-sec">Concepts touched</div><div class="fin-hub-chips">'
       + _selChips(_famsForContracts(new Set(cs)).map(function(fid){ var fm=_idx.family[fid]; return {kind:'family', id:fid, label:fm.family_name, color:fm.color}; })) + '</div>';
    h += _versesHtml(_rowVerses(kind, id));
    return h;
  }
  // Qur'anic origin section from q_to_c_map.json (D.qToCById) for a contract. SOLE authority for Q→C;
  // nothing here is derived by verse matching. Assurance drives chip weight: established (green) >
  // plausible (amber) > illustrative (muted, dashed). Juristic-derivation notes (plausible/illustrative)
  // show as a visible muted line, not hover-only.
  function _qcOriginHtml(cid){
    var row = (D.qToCById && D.qToCById[cid]) || null;
    if(!row) return '';   // no Q→C data (or file not loaded) → no section
    var h = '<div class="fin-hub-sec">Qur\'anic origin</div>';
    var links = row.links || [];
    if(!links.length){
      return h + '<div class="fin-hub-none">No sourced Qur\'anic origin link — juristic development only.</div>';
    }
    links.forEach(function(lk){
      var a = String(lk.assurance || '').toLowerCase();
      var w = _qWordById(lk.quran_word_id);
      var lab = w ? (w.arabic || w.english || lk.quran_word_id) : lk.quran_word_id;
      var cls = 'fin-hub-chip' + (a === 'plausible' ? ' fin-qc-plausible' : (a === 'illustrative' ? ' fin-qc-illustrative' : ''));
      // 'established' → existing green treatment (matches the Established assurance colour used across the view).
      var est = (a === 'established') ? ' style="color:#2ECC71;border-color:rgba(46,204,113,0.5);background:rgba(46,204,113,0.08)"' : '';
      h += '<div class="fin-hub-chips"><span class="'+cls+'"'+est+' title="'+_esc(lk.note||'')+'">'+_esc(lab)+'</span></div>';
      // Juristic-derivation caveat visible (not hover-only) for the softer assurances.
      if((a === 'plausible' || a === 'illustrative') && lk.note){
        h += '<div class="fin-qc-note">'+_esc(lk.note)+'</div>';
      }
      // verse_refs → the existing fin-q-card READ pattern (wired by the hub's .fin-q-read handler, which stopPropagation()s).
      (lk.verse_refs || []).forEach(function(vs){
        var p = String(vs).split(':'); var S = p[0], A = p.slice(1).join(':');
        h += '<div class="fin-q-card"><div class="fin-q-line">'
          + '<span class="fin-q-ref">Qur\'an '+_esc(S)+':'+_esc(A)+'</span>'
          + '<a class="fin-q-read" href="#start?surah='+_esc(S)+'&verse='+_esc(A)+'" data-s="'+_esc(S)+'" data-a="'+_esc(A)+'">READ</a>'
          + '</div></div>';
      });
      if(lk.evidence){ h += '<div class="fin-qc-evidence">'+_esc(lk.evidence)+'</div>'; }
    });
    return h;
  }
  function _hubContract(c){
    if(!c) return '';
    var h = _hubHeader(_esc(c.name), _conf(c.assurance), null);
    h += '<div class="fin-hub-sec">Details</div>' + _allFieldsHtml(c, ['name']);
    h += _qcOriginHtml(c.id);   // Qur'anic origin — after Details, before Terms
    var terms = D.terms.filter(function(t){ return _termContracts(t).indexOf(c.id)!==-1; });
    h += '<div class="fin-hub-sec">Terms under this contract ('+terms.length+')</div>';
    terms.forEach(function(t){ h += _termCardHtml(t); });
    var bks = D.books.filter(function(b){ return (b.contracts_covered||[]).indexOf(c.id)!==-1; }).map(function(b){ return {kind:'book', id:b.id, label:b.title_english||b.id}; });
    var evs = D.events.filter(function(e){ return (e.linked_contracts||[]).indexOf(c.id)!==-1; }).map(function(e){ return {kind:'event', id:e.id, label:e.event}; });
    h += '<div class="fin-hub-sec">Books</div><div class="fin-hub-chips">'+_selChips(bks)+'</div>';
    h += '<div class="fin-hub-sec">Events</div><div class="fin-hub-chips">'+_selChips(evs)+'</div>';
    h += _versesHtml(_contractVerses(c.id));
    h += _reportBackTag(c.id);
    return h;
  }
  // Details panel for a single term (from a term origin marker or an undated chip).
  // Plain-language heading for a spine relation; unknown relations show the raw name (underscores → spaces).
  function _spineRelLabel(rel){
    return rel === 'descends_from' ? 'Comes from'
         : rel === 'revealed_in'   ? "Qur'an word"
         : rel === 'governed_by'   ? 'Governed by'
         : String(rel || '').replace(/_/g, ' ');
  }
  function _spineTagColor(tag){ return tag === 'verified' ? '#2ECC71' : tag === 'plausible' ? '#F59E0B' : '#8A94A2'; }
  // Connections section for a term: every crosslinks_spine edge it touches, grouped by relation, each
  // edge a tag-coloured chip for the OTHER endpoint. C##/T### clickable; Q## shows the word; else plain.
  // Returns '' when the term has no edges (caller then renders no section). Never drops an edge.
  function _spineConnectionsHtml(termId){
    var edges = _spineById[termId] || [];
    if(!edges.length) return '';
    var order = [], groups = {};
    edges.forEach(function(e){
      var rel = e.relation || 'related';
      if(!groups[rel]){ groups[rel] = []; order.push(rel); }
      groups[rel].push(e);
    });
    var h = '<div class="fin-hub-sec">Connections</div>';
    order.forEach(function(rel){
      h += '<div class="fin-spine-rel">'+_esc(_spineRelLabel(rel))+'</div><div class="fin-hub-chips">';
      groups[rel].forEach(function(e){
        var other = (e.from_id === termId) ? e.to_id : e.from_id;
        var col = _spineTagColor(e.tag);
        var titleAttr = e.evidence ? ' title="'+_esc(e.evidence)+'"' : '';
        var label, clickAttr = '', clk = '';
        if(/^C\d{2}$/.test(other)){
          label = (_idx.contract[other] || {}).name || other;
          clickAttr = ' data-sel-kind="contract" data-sel-id="'+_esc(other)+'"'; clk = ' clk';
        } else if(/^T\d+$/.test(other)){
          label = (_idx.term[other] || {}).term_english || other;
          clickAttr = ' data-spine-term="'+_esc(other)+'"'; clk = ' clk';
        } else if(/^Q\d+$/.test(other)){
          var qw = ((D.qlayer && D.qlayer.rows) || []).filter(function(w){ return w.id === other; })[0];
          label = qw ? ((qw.arabic ? qw.arabic + ' ' : '') + (qw.english || '')).trim() : other;
        } else {
          label = other;   // standards text / lineage row ids → plain, verbatim
        }
        h += '<span class="fin-spine-chip'+clk+'" style="border-color:'+col+'"'+clickAttr+titleAttr+'>'+_esc(label)+'</span>';
      });
      h += '</div>';
    });
    return h;
  }
  function _hubTerm(t){
    if(!t) return '';
    var h = _hubHeader(_esc(t.term_english || t.id), _conf(t.assurance), null);
    if(t.term_arabic) h += '<div class="fin-hub-field"><span class="fin-hub-k">Arabic</span><span class="fin-hub-v" style="direction:rtl;text-align:right">'+_esc(t.term_arabic)+'</span></div>';
    // Details — every field except the ones already shown (english/arabic/assurance) and the enrichment object.
    h += '<div class="fin-hub-sec">Details</div>' + _allFieldsHtml(t, ['term_english','term_arabic','assurance','enrichment']);
    var en = t.enrichment;
    if(en && typeof en === 'object'){
      h += '<div class="fin-hub-sec">Links</div>' + _termEnrichHtml(en);   // reuse existing enrichment renderer
    }
    // Lineage birth-row (RV term_lineage_links) — rendered verbatim from the data file; no composed claims.
    var _ll = (D.lineageLinks || {})[t.id];
    if(_ll){
      h += '<div class="fin-hub-sec">Lineage</div>';
      if(_ll.status === 'CITED' && _ll.born_at_row){
        h += '<div class="fin-hub-field"><span class="fin-hub-k">Born at row</span><span class="fin-hub-v">'+_esc(_ll.born_at_row)+' <span style="color:#7BD88F;border:1px solid #7BD88F;border-radius:3px;padding:0 4px;font-size:10px;letter-spacing:.5px">CITED</span></span></div>';
        if(_ll.evidence_quote) h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-style:italic">&#8220;'+_esc(_ll.evidence_quote)+'&#8221;</span></div>';
        if(_ll.source) h += '<div class="fin-hub-field"><span class="fin-hub-v" style="color:#8B95A5;font-size:11px">'+_esc(_ll.source)+'</span></div>';
      } else {
        h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-style:italic;color:#8B95A5">No cited birth row yet &#8212; needs verification.</span></div>';
      }
    }
    h += _spineConnectionsHtml(t.id);   // Connections — crosslinks_spine edges (skipped when there are none)
    h += '<div class="fin-hub-sec">Parent contract</div><div class="fin-hub-chips">'
       + _selChips(_termContracts(t).map(function(c){ return {kind:'contract', id:c, label:(_idx.contract[c]||{}).name||c}; })) + '</div>';
    return h;
  }
  function _hubFamily(fm){
    if(!fm) return '';
    var orig = _familyOrigin(fm);
    var h = _hubHeader(_esc(fm.family_name), null, fm.color);
    h += '<div class="fin-hub-sec">Details</div>' + _allFieldsHtml(fm, ['family_name','member_terms','color']);
    h += '<div class="fin-hub-field"><span class="fin-hub-k">Origin (year)</span><span class="fin-hub-v">'+(orig.approx?'c.':'')+orig.year+' CE</span></div>';
    var terms = (fm.member_terms||[]).map(function(tid){ return _idx.term[tid]; }).filter(Boolean);
    h += '<div class="fin-hub-sec">Member terms ('+terms.length+')</div>';
    terms.forEach(function(t){ h += _termCardHtml(t); });
    h += '<div class="fin-hub-sec">Contracts</div><div class="fin-hub-chips">'
       + _selChips(Array.from(_familyContracts(fm)).map(function(c){ return {kind:'contract', id:c, label:(_idx.contract[c]||{}).name||c}; })) + '</div>';
    var pl=[], bl=[], evl=[];
    Array.from(_familyLinkedIds(fm)).forEach(function(idv){
      if(_idx.scholar[idv]) pl.push({kind:'scholar', id:idv, label:_idx.scholar[idv].name});
      else if(_idx.book[idv]) bl.push({kind:'book', id:idv, label:_idx.book[idv].title_english||idv});
      else if(_idx.event[idv]) evl.push({kind:'event', id:idv, label:_idx.event[idv].event});
    });
    h += '<div class="fin-hub-sec">Linked scholars</div><div class="fin-hub-chips">'+_selChips(pl)+'</div>';
    h += '<div class="fin-hub-sec">Linked books</div><div class="fin-hub-chips">'+_selChips(bl)+'</div>';
    h += '<div class="fin-hub-sec">Linked events</div><div class="fin-hub-chips">'+_selChips(evl)+'</div>';
    h += _versesHtml(_familyVerses(fm));
    return h;
  }
  // Banner label + verse list for the current selection (used when opening START).
  function _selVerses(){
    if(!_sel) return { label:'', verses:[] };
    if(_sel.type==='family'){ var fm=_idx.family[_sel.id]; return { label:(fm?fm.family_name:''), verses:(fm?_familyVerses(fm):[]) }; }
    if(_sel.type==='contract'){ var c=_idx.contract[_sel.id]; return { label:(c?c.name:''), verses:_contractVerses(_sel.id) }; }
    var rec=_idx[_sel.kind][_sel.id];
    var title = !rec ? '' : (_sel.kind==='scholar') ? rec.name : (_sel.kind==='book') ? (rec.title_english||rec.title_original||rec.id) : rec.event;
    return { label:title, verses:_rowVerses(_sel.kind, _sel.id) };
  }
  // REPORT Details card — built ONLY from fields already in the record's data. Never composes new sentences.
  function _repHubCard(sel){
    var u = sel.rec || {}, id = u.id || '';
    var h = '<div class="fin-hub-head"><span class="fin-hub-title">OI-'+(sel.idx + 1)+' · '+_esc(id)+'</span></div>';

    // 1 — From the document: verbatim clause texts mapped to this item in the active case's excerpt_map.
    h += '<div class="fin-hub-sec">From the document</div>';
    var dc = _activeCase();
    if(!dc){
      h += '<div class="fin-hub-none">demo case file not loaded</div>';
    } else {
      var refs = (dc.excerpt_map && dc.excerpt_map[id]) || null;
      var clauses = dc.clauses || [];
      if(refs && refs.length){
        refs.forEach(function(no){
          var cl = clauses.filter(function(c){ return c.no === no; })[0];
          if(cl) h += '<div class="fin-rep-quote">Clause '+_esc(no)+': '+_esc(cl.text)+'</div>';
        });
      } else {
        h += '<div class="fin-hub-none">No excerpt mapped for this item.</div>';
      }
    }

    // 2 — Possibly affected standards: the name + honest status already linked to this item.
    h += '<div class="fin-hub-sec">Possibly affected standards</div>';
    if(u.label)  h += '<div class="fin-hub-field"><span class="fin-hub-v" style="font-weight:600">'+_esc(u.label)+'</span></div>';
    if(u.honest) h += '<div class="fin-hub-field"><span class="fin-hub-k">Status</span><span class="fin-hub-v">'+_esc(u.honest)+'</span></div>';

    // 3 — Cross-reference pill (kept here in the hub only) + 4 — existing evidence fields, ladder order.
    var pill = '';
    if(/^K\d/.test(id)){                                   // K-id → its C08 ladder record's own fields
      var kr = (D.lineage_v4 || []).filter(function(r){ return r.contract === 'C08' && r.id === id; })[0];
      if(kr){
        if(kr.detail)           h += '<div class="fin-hub-sec">Detail</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(kr.detail)+'</span></div>';
        if(kr.evidence_display) h += '<div class="fin-hub-field"><span class="fin-hub-k">Evidence</span><span class="fin-hub-v">'+_esc(kr.evidence_display)+'</span></div>';
        if(id === 'K020' && kr.position) h += '<div class="fin-hub-field"><span class="fin-hub-k">Position</span><span class="fin-hub-v">'+_esc(kr.position)+'</span></div>';
      }
      pill = '<span class="fin-hub-chip fin-rep-chip" data-report-kl="'+_esc(id)+'">Open in LADDER →</span>';
    } else if(/^Q\d/.test(id)){                            // Q-id → cited verse ref + gist, or the standard_landing ref used
      var w = ((D.qlayer && D.qlayer.rows) || []).filter(function(x){ return x.id === id; })[0];
      if(w){
        if(u.code){
          var land = (w.standard_landing || []).filter(function(s){ return String(s.ref || '').indexOf(u.code) === 0; })[0];
          if(land && land.ref) h += '<div class="fin-hub-sec">Cited landing</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(land.ref)+'</span></div>';
        } else {
          var v = (w.verse_refs || [])[0];
          if(v){
            if(v.ref)  h += '<div class="fin-hub-sec">Cited verse</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(v.ref)+_finVerseTag(v.ref)+'</span></div>';
            if(v.gist) h += '<div class="fin-hub-field"><span class="fin-hub-v">'+_esc(v.gist)+'</span></div>';
          }
        }
      }
      pill = '<span class="fin-hub-chip fin-rep-chip" data-report-q="'+_esc(id)+'">Open word →</span>';
    } else {                                               // standard code / KB-GS1 → name+status (already above) + KB implication line
      if(id === 'KB-GS1'){
        var note = _idx.kbnote['KB-GS1'];
        if(note && note.implications && note.implications.length)
          h += '<div class="fin-hub-sec">Implication</div><div class="fin-hub-field"><span class="fin-hub-v">'+_esc(_kbFlat(note.implications[0]))+'</span></div>';
      }
      if(u.code && _idx.standard[u.code]) pill = '<span class="fin-std-link fin-hub-chip" data-std="'+_esc(u.code)+'">Open '+_esc(u.code)+' card →</span>';
    }
    if(pill) h += '<div class="fin-hub-chips" style="padding-top:8px">'+pill+'</div>';

    // Scholar decision — ACCEPT / HOLD / REFER BACK. Session-only; click the chosen one again to clear.
    var act = _repActions[id];
    h += '<div class="fin-hub-sec">Scholar decision</div>'
       + '<div class="fin-oi-decide" data-oiid="'+_esc(id)+'">'
       + '<button type="button" class="fin-oi-dbtn green'+(act === 'accept' ? ' chosen' : '')+'" data-oi-act="accept">ACCEPT</button>'
       + '<button type="button" class="fin-oi-dbtn orange'+(act === 'hold' ? ' chosen' : '')+'" data-oi-act="hold">HOLD</button>'
       + '<button type="button" class="fin-oi-dbtn red'+(act === 'refer' ? ' chosen' : '')+'" data-oi-act="refer">REFER BACK</button>'
       + '</div>';
    return h;
  }
  // FAB severity chip (high=red, medium=amber, low=grey) and principle confidence chip (verified=green, plausible=amber).
  function _fabSevChip(sev){
    var c = (sev === 'high') ? 'high' : (sev === 'medium') ? 'med' : 'low';
    return '<span class="fin-fab-sev '+c+'">'+_esc(sev || '')+'</span>';
  }
  function _fabConfChip(tag){
    var c = (tag === 'verified') ? 'green' : (tag === 'plausible') ? 'amber' : 'grey';
    return '<span class="fin-fab-conf '+c+'">'+_esc(tag || '')+'</span>';
  }
  // FAB open-item panel — three labelled blocks, affected-standards chips, then the persisted scholar box.
  function _fabHubCard(item, idx){
    item = item || {};
    var h = '<div class="fin-hub-head"><span class="fin-hub-title">'+_esc(item.id || '')+' · '+_esc(item.title || '')+'</span></div>';

    // a) FROM THE DOCUMENT — quoted text + "case · clause_ref" sub-line.
    var fd = item.from_document || {};
    h += '<div class="fin-hub-sec">From the document</div>';
    if(fd.quoted_text){
      var _qr = (_liveDoc && _liveDoc.text) ? _docFindRange(_liveDoc.text, fd.quoted_text) : null;
      if(_liveDoc && _liveDoc.text) h += '<div class="fin-rep-quote fin-rep-quote-jump" data-q="'+_esc(fd.quoted_text)+'">'+_esc(fd.quoted_text)+'<span class="fin-doc-jump-tag">→ open in document</span></div>';
      else    h += '<div class="fin-rep-quote">'+_esc(fd.quoted_text)+'</div>';
    }
    h += '<div class="fin-fab-sub">'+_esc((fd.case || '') + ' · ' + (fd.clause_ref || ''))+'</div>';

    // b) THE STANDARD SAYS — principle text, clause_ref bold tag, confidence chip.
    var pr = item.principle || {};
    h += '<div class="fin-hub-sec">The standard says</div>';
    if(pr.text)       h += '<div class="fin-hub-field"><span class="fin-hub-v">'+_esc(pr.text)+'</span></div>';
    if(pr.clause_ref) h += '<div class="fin-fab-clausetag">'+_esc(pr.clause_ref)+'</div>';
    // Guardrail: live (AI-generated) items always show PLAUSIBLE, never a stronger tag.
    var chipTag = (_repFabIdx === 'live') ? 'plausible' : pr.tag;
    if(chipTag)       h += _fabConfChip(chipTag);

    // c) POTENTIAL ISSUE — issue summary + repeated severity chip.
    h += '<div class="fin-hub-sec">Potential issue</div>';
    if(item.issue_summary) h += '<div class="fin-hub-field"><span class="fin-hub-v">'+_esc(item.issue_summary)+'</span></div>';
    h += '<div style="margin-top:6px">'+_fabSevChip(item.severity)+'</div>';

    // AFFECTED STANDARDS — clickable to the standards card when processed_deep_note; else a status label.
    h += '<div class="fin-hub-sec">Affected standards</div><div class="fin-hub-chips">';
    (item.affected_standards || []).forEach(function(a){
      var code  = _stdCode(a.code || '');
      var label = _esc(a.code || '') + ' — ' + _esc(a.name || '');
      if(a.status === 'processed_deep_note' && _idx.standard[code]){
        h += '<span class="fin-std-link fin-hub-chip" data-std="'+_esc(code)+'">'+label+'</span>';
      } else {
        var stlabel = (a.status === 'pdf_on_disk_unprocessed') ? 'pdf on disk / not processed' : _esc(a.status || '');
        h += '<span class="fin-hub-chip fin-fab-stdchip fin-std-link" data-std="'+_esc(code)+'">'+label+' <span class="fin-fab-stdstatus">'+stlabel+'</span></span>';
      }
    });
    h += '</div>';

    // SCHOLAR DETERMINATION — persisted box (stance / rationale / signed name + auto date).
    var det = _schGet(item.id) || { stance:'', rationale:'', scholar_name:'', date:'' };
    h += '<div class="fin-hub-sec">Scholar determination</div>';
    h += '<div class="fin-fab-det" data-fabid="'+_esc(item.id || '')+'">'
       + '<div class="fin-oi-decide">'
       +   '<button type="button" class="fin-oi-dbtn green'+(det.stance === 'accept' ? ' chosen' : '')+'" data-fab-stance="accept">ACCEPT</button>'
       +   '<button type="button" class="fin-oi-dbtn orange'+(det.stance === 'hold' ? ' chosen' : '')+'" data-fab-stance="hold">HOLD</button>'
       +   '<button type="button" class="fin-oi-dbtn red'+(det.stance === 'refer' ? ' chosen' : '')+'" data-fab-stance="refer">REFER BACK</button>'
       + '</div>'
       + '<textarea class="fin-fab-rationale" data-fab-rationale rows="4" placeholder="Scholar\'s reasoning, conditions, or required amendment...">'+_esc(det.rationale || '')+'</textarea>'
       + '<div class="fin-fab-signrow"><span class="fin-fab-signk">Signed:</span>'
       +   '<input type="text" class="fin-fab-name" data-fab-name placeholder="Scholar name" value="'+_esc(det.scholar_name || '')+'">'
       +   '<span class="fin-fab-date">'+(det.date ? ('Date: ' + _esc(det.date)) : '')+'</span></div>'
       + '</div>';
    return h;
  }
  function _renderHub(){
    if(!_mounted) return;
    var hub = document.getElementById('finance-hub'); if(!hub) return;
    if(_mode === 'report'){
      // FAB compliance report → its own panel (separate from the 5 demo cases' hub).
      if(_repFabIdx !== null){
        var frep = _fabActiveReport();
        var fitems = (frep && frep.open_items) || [];
        var flabel = (_repFabIdx === 'live') ? ((frep && frep._liveNum) ? frep._liveNum : 'LIVE') : (frep && frep.exhibit ? ('Ex ' + frep.exhibit) : 'FAB report');
        var frh;
        if(_fabSel === null || !fitems[_fabSel]){
          frh = '<div class="fin-rep-hub-count">'+fitems.length+' open item'+(fitems.length === 1 ? '' : 's')+' — '+_esc(flabel)+'</div>'
              + '<div class="fin-hub-hint">Select an open item to inspect it.</div>';
        } else {
          frh = _fabHubCard(fitems[_fabSel], _fabSel);
        }
        hub.innerHTML = frh;
        _wireReport(hub);
        return;
      }
      // Blank-start state (live doc loaded, no case selected yet) — neutral hint, no saved-case count.
      if(_repFabIdx === null){
        hub.innerHTML = '<div class="fin-hub-hint">Run the live review, or pick a saved case, to see its open items here.</div>';
        return;
      }
      // Permanent first line: the open-item count = items with no green (accept) action yet.
      var n = _openReviewCount();
      var rh = '<div class="fin-rep-hub-count">'+n+' open item'+(n === 1 ? '' : 's')+' for scholar review</div>';
      if(!_repSel || !_repSel.rec){
        rh += '<div class="fin-hub-hint">Select Details → on an open item to inspect it.</div>';
      } else {
        rh += _repHubCard(_repSel);
      }
      hub.innerHTML = rh;
      _wireReport(hub);   // reuse the exact report jump wiring (data-report-kl / data-report-q / .fin-std-link)
      _wireFinJumps(hub);   // verse "→ read" pill on Cited verse
      return;
    }
    if(!_sel){
      var lead = (_mode === 'ladder') ? _coverageStripHtml() : '';
      var _hint = (_mode === 'trace') ? 'Pick a term — its full definition appears here.'
                                      : 'Select any person, book, event or concept to see everything tagged to it.';
      hub.innerHTML = lead
        + '<div class="fin-hub-head"><span class="fin-hub-title">Details</span></div>'
        + '<div class="fin-hub-hint">'+_hint+'</div>';
      if(_mode === 'ladder') _wireCoverageStrip(hub);
      return;
    }
    // lineage rows → the same rich lineage panel LADDER uses (sets hub.innerHTML + wires itself).
    if(_sel.type==='qword'){ var _qw = _qwordById(_sel.id); if(_qw){ _renderQwordHub(_qw); return; } }
    if(_sel.type==='row' && _sel.kind==='lineage'){
      var _lr = _idx.lineage[_sel.id];
      if(_lr){ _renderLadderHub(_lr); return; }
    }
    var h = (_sel.type==='family') ? _hubFamily(_idx.family[_sel.id])
          : (_sel.type==='contract') ? _hubContract(_idx.contract[_sel.id])
          : (_sel.type==='term') ? _hubTerm(_idx.term[_sel.id])
          : _hubRow(_sel.kind, _sel.id);
    hub.innerHTML = h;
    hub.querySelectorAll('[data-sel-kind]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _select(el.getAttribute('data-sel-kind'), el.getAttribute('data-sel-id')); });
    });
    // Connections T### chips → open that term's details (contract chips use the [data-sel-kind] wiring above).
    hub.querySelectorAll('[data-spine-term]').forEach(function(el){
      el.addEventListener('click', function(e){ e.stopPropagation(); _selectTerm(el.getAttribute('data-spine-term')); });
    });
    hub.querySelectorAll('.fin-q-read').forEach(function(a){
      if(!a.hasAttribute('data-s')) return;   // skip the external book "READ ↗" link
      a.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        var sv = _selVerses();
        _openConceptInStart(sv.label, sv.verses, parseInt(this.getAttribute('data-s'),10), parseInt(this.getAttribute('data-a'),10));
      });
    });
    // Term-card enrichment toggle — expand/collapse the "▸ links" section; stopPropagation so the card/hub is not re-selected.
    hub.querySelectorAll('[data-term-enrich-toggle]').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var card = el.closest('.fin-term-card');
        var sec = card && card.querySelector('.fin-term-enrich');
        if(sec){ var open = sec.classList.toggle('open'); el.textContent = (open ? '▾ links' : '▸ links'); }
      });
    });
    _wireStdLinks(hub);   // standard-code links + report back-tag chips inside timeline hubs
  }

  // ── Toolbar (all multi-select .bv-dd-* dropdowns) ──
  function _ddHtml(id, label, opts, cfg){
    cfg = cfg || {};
    var h = '<div class="bv-dd-wrap" data-dd="'+id+'"><button class="bv-dd-btn" type="button" data-base="'+_esc(label)+'">'+_esc(label)+' <span style="opacity:.6">▾</span></button>';
    h += '<div class="bv-dd-panel">';
    if(cfg.search) h += '<input class="bv-dd-search" placeholder="search…">';
    if(cfg.allnone) h += '<div class="bv-dd-allnone"><span data-all="1">All</span><span data-none="1">None</span></div>';
    h += '<div class="bv-dd-scroll">';
    opts.forEach(function(o){
      h += '<div class="bv-ck-row'+(o.cls?' '+_esc(o.cls):'')+'" data-val="'+_esc(o.val)+'"><span class="bv-ck"></span>'
         + (o.color?'<span class="bv-ck-swatch" style="background:'+_esc(o.color)+'"></span>':'')
         + (o.prefix?'<span class="bv-ck-prefix">'+_esc(o.prefix)+'</span> ':'')
         + '<span class="bv-ck-label">'+_esc(o.label)+'</span>'
         + (o.badge?'<span class="fin-qword-badge">'+_esc(o.badge)+'</span>':'')
         + (o.count!=null?'<span class="bv-ck-count">'+o.count+'</span>':'')+'</div>';
    });
    h += '</div></div></div>';
    return h;
  }
  function _buildToolbar(){
    var tb = document.getElementById('finance-toolbar'); if(!tb) return;
    var mv = _movementOptions();
    var h = '';
    // Leftmost: view-mode switch (styled like the .fin-ruler-btn ruler toggle),
    // regrouped into SOURCE (gold) + a lone LECTURE; USER (green) is appended far-right below.
    function _modeBtn(mode, label){
      return '<span class="fin-ruler-btn fin-mode-btn'+(_mode===mode?' on':'')+'" data-mode="'+mode+'">'+label+'</span>';
    }
    h += '<div class="fin-mode-switch fin-group-source">'
       + _modeBtn('home','HOME')
       + '<span class="fin-pages-wrap">'
       +   '<span class="fin-ruler-btn" id="fin-pages-btn">PAGES ▾</span>'
       +   '<div class="bv-dd-panel fin-pages-panel" id="fin-pages-panel">'
       +     _modeBtn('trace','TRACE') + _modeBtn('timeline','TIMELINE') + _modeBtn('ladder','LADDER') + _modeBtn('prism','PRISM') + _modeBtn('reader','STANDARDS') + _modeBtn('lecture','LECTURE') + '<div class="fin-pages-div"></div>' + '<span class="fin-ruler-btn fin-mode-btn fin-pages-htw" data-mode="htw">How this works</span>'
       +   '</div>'
       + '</span>'
       + '<span id="fin-cur-page">' + _pageLabel(_mode) + '</span>'
       + '</div>';
    // TRADITION = SECT + SCHOOL + MOVEMENT merged. Options carry a muted group prefix;
    // clicks route into F.sect / F.school / F.movement by SECTS/SCHOOLS membership (see _tradSet).
    var tradOpts = SECTS.map(function(s){ return {val:s, prefix:'Sect ·', label:s, count:_tradCount(s)}; })
      .concat(SCHOOLS.map(function(s){ return {val:s, prefix:'School ·', label:s, count:_tradCount(s)}; }))
      .concat(mv.map(function(m){ return {val:m.val, prefix:'Movement ·', label:m.val, count:_tradCount(m.val)}; }));
    h += _ddHtml('tradition','TRADITION', tradOpts, {search:true});
    h += _ddHtml('show','SHOW', [{val:'scholars',label:'Scholars'},{val:'books',label:'Books'},{val:'events',label:'Events'},{val:'lineage',label:'Lineage'}], {});
    h += _ddHtml('contract','CONTRACT', D.contracts.map(function(c){ return {val:c.id,label:c.id+' · '+c.name}; }), {search:true});
    h += _ddHtml('concepts','CONCEPTS', D.families.map(function(fm){ return {val:fm.id,label:fm.family_name,color:fm.color}; }), {allnone:true,search:true});
    // QUR'AN WORDS filter removed (did nothing for the user). D.quranWordMap still loads for word tiles.
    // STANDARD FAMILY — regulator families (AAOIFI / IFSB / …) discovered from the data at runtime.
    // Visible only in standards mode via CSS; empty = all families.
    var _fams = [];
    ((D.tracker && D.tracker.rows) || []).forEach(function(r){ if(r.family && _fams.indexOf(r.family) === -1) _fams.push(r.family); });
    h += _ddHtml('family','FAMILY', _fams.map(function(f){ return {val:f,label:f}; }), {});
    // STANDARD PILLAR — narrows the columns shown on the standards board (visible only in standards mode via CSS).
    h += _ddHtml('pillar','PILLAR', ['SS','FAS','GS','SOAA','Ethics'].map(function(p){ return {val:p,label:p}; }), {});
    h += '<button class="fin-reset-btn" id="fin-reset" type="button">RESET</button>';
    h += '<button class="fin-reset-btn" id="fin-fullscreen-btn" type="button">FULLSCREEN</button>';
    // USER group (green) sits at the far right, after RESET, before the row-count readout.
    h += '<div class="fin-mode-switch fin-group-user">'
       + '<button class="fin-back-btn" id="fin-back-btn" type="button" disabled>← BACK</button>'
       + _modeBtn('upload','UPLOAD') + _modeBtn('standards','SETTINGS') + _modeBtn('report','REPORT') + _modeBtn('archive','ARCHIVE')
       + '</div>';
    h += '<span id="finance-readout"></span>';
    // HOW THIS WORKS now lives in the PAGES dropdown as a static page (see _renderHtwPage).
    tb.innerHTML = h;
    _wireToolbar(tb);
    var _bb = tb.querySelector('#fin-back-btn'); if(_bb) _bb.addEventListener('click', function(e){ e.stopPropagation(); _goBack(); });
    // (HOW THIS WORKS button removed — now a PAGES entry.)
    var _fsb = document.getElementById('fin-fullscreen-btn');
    if(_fsb) _fsb.addEventListener('click', _toggleFinFullscreen);
    var _pb = document.getElementById('fin-pages-btn');
    var _pp = document.getElementById('fin-pages-panel');
    if(_pb && _pp){
      _pb.addEventListener('click', function(e){ e.stopPropagation(); _pp.classList.toggle('open'); });
      _pp.querySelectorAll('.fin-mode-btn').forEach(function(b){
        b.addEventListener('click', function(){ _pp.classList.remove('open'); });
      });
    }
    _syncFullBtn();
    _syncAllDD();
  }
  // TRADITION routing: a value belongs to F.sect, F.school, or (else) F.movement.
  // ── FINANCE demo fullscreen — toggles a body class; shell.css hides the library
  //    top/bottom frame. Scoped to the FINANCE tab so it auto-restores on tab change. ──
  function _finIsFull(){ return document.body.classList.contains('fin-fullscreen'); }
  function _syncFullBtn(){ var b = document.getElementById('fin-fullscreen-btn'); if(b) b.textContent = _finIsFull() ? 'EXIT FULLSCREEN' : 'FULLSCREEN'; }
  function _finFsEsc(e){ if(e.key === 'Escape' && _finIsFull()){ document.body.classList.remove('fin-fullscreen'); document.removeEventListener('keydown', _finFsEsc); _syncFullBtn(); } }
  function _toggleFinFullscreen(){
    var on = document.body.classList.toggle('fin-fullscreen');
    if(on) document.addEventListener('keydown', _finFsEsc); else document.removeEventListener('keydown', _finFsEsc);
    _syncFullBtn();
  }

  function _tradSet(v){ return (SECTS.indexOf(v) !== -1) ? F.sect : (SCHOOLS.indexOf(v) !== -1) ? F.school : F.movement; }
  // Honest coverage: how many tradition-index rows are assigned this label (lineage + scholars).
  function _tradCount(v){
    var n = 0, m = D.tradById || {};
    for(var k in m){ var L = m[k].labels; if(L && L.indexOf(v) !== -1) n++; }
    return n;
  }
  function _syncDD(wrap){
    var setName = wrap.getAttribute('data-dd');
    if(setName === 'tradition'){
      wrap.querySelectorAll('.bv-ck-row').forEach(function(r){
        var v = r.getAttribute('data-val'), on = _tradSet(v).has(v);
        r.classList.toggle('checked', on);
        r.querySelector('.bv-ck').classList.toggle('on', on);
      });
      var tbtn = wrap.querySelector('.bv-dd-btn'), tbase = tbtn.getAttribute('data-base');
      var tn = F.sect.size + F.school.size + F.movement.size;   // total across all three sets
      tbtn.innerHTML = _esc(tbase)+(tn?' ('+tn+')':'')+' <span style="opacity:.6">▾</span>';
      return;
    }
    var set = F[setName];
    wrap.querySelectorAll('.bv-ck-row').forEach(function(r){
      var on = set.has(r.getAttribute('data-val'));
      r.classList.toggle('checked', on);
      r.querySelector('.bv-ck').classList.toggle('on', on);
    });
    var btn = wrap.querySelector('.bv-dd-btn'), base = btn.getAttribute('data-base'), n = set.size;
    btn.innerHTML = _esc(base)+(n?' ('+n+')':'')+' <span style="opacity:.6">▾</span>';
  }
  function _syncAllDD(){ var tb=document.getElementById('finance-toolbar'); if(!tb) return; tb.querySelectorAll('.bv-dd-wrap').forEach(_syncDD); }
  function _wireToolbar(tb){
    tb.querySelectorAll('.fin-mode-btn').forEach(function(btn){
      btn.addEventListener('click', function(e){ e.stopPropagation(); _setMode(this.getAttribute('data-mode')); });
    });
    tb.querySelectorAll('.bv-dd-wrap').forEach(function(wrap){
      var btn = wrap.querySelector('.bv-dd-btn'), panel = wrap.querySelector('.bv-dd-panel'), setName = wrap.getAttribute('data-dd');
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = panel.classList.contains('open');
        tb.querySelectorAll('.bv-dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
        if(!open) panel.classList.add('open');
      });
      panel.addEventListener('click', function(e){ e.stopPropagation(); });
      var search = wrap.querySelector('.bv-dd-search');
      if(search) search.addEventListener('input', function(){
        var q = this.value.toLowerCase();
        wrap.querySelectorAll('.bv-ck-row').forEach(function(r){ r.style.display = (r.querySelector('.bv-ck-label').textContent.toLowerCase().indexOf(q)>=0)?'':'none'; });
      });
      wrap.querySelectorAll('.bv-ck-row').forEach(function(row){
        row.addEventListener('click', function(){
          var v = this.getAttribute('data-val');
          if(setName === 'qwords'){                       // QUR'AN WORDS is single-select (toggle off if re-clicked)
            var had = F.qwords.has(v); F.qwords.clear(); if(!had) F.qwords.add(v);
            _syncDD(wrap); _selectQword(had ? null : v); return;
          }
          var set = (setName === 'tradition') ? _tradSet(v) : F[setName];
          if(set.has(v)) set.delete(v); else set.add(v);
          _syncDD(wrap);
          if(setName === 'contract'){
            // Discoverability: the timeline still re-filters exactly as before, but the details panel is
            // driven by the contract count. Exactly ONE contract selected → open its details (the SAME
            // selection state as clicking a contract chip → _hubContract). 2+ or 0 selected → leave
            // whatever panel is shown; never clear it.
            if(F.contract.size === 1){ _postFilter(); _selectContract(Array.from(F.contract)[0], true); }
            else { _renderMode(); }
            return;
          }
          _postFilter();
        });
      });
      var allEl = wrap.querySelector('[data-all]'), noneEl = wrap.querySelector('[data-none]');
      if(allEl) allEl.addEventListener('click', function(e){ e.stopPropagation(); wrap.querySelectorAll('.bv-ck-row').forEach(function(r){ F[setName].add(r.getAttribute('data-val')); }); _syncDD(wrap); _postFilter(); });
      if(noneEl) noneEl.addEventListener('click', function(e){ e.stopPropagation(); F[setName].clear(); _syncDD(wrap); _postFilter(); });
    });
    var reset = tb.querySelector('#fin-reset');
    if(reset) reset.addEventListener('click', function(){
      F.conf.clear(); F.sect.clear(); F.school.clear(); F.movement.clear(); F.contract.clear(); F.concepts.clear(); F.pillar.clear(); F.family.clear(); F.qwords.clear();
      F.show = new Set(['scholars','books','events','lineage']);
      _showCE = true; _showHijri = true;
      _clearSelection(); _buildToolbar(); _renderMode();
    });
  }
  function _postFilter(){ _clearSelection(); _renderMode(); }

  // ── "How this works" overlay ──
  function _showHtw(){ _setMode('htw'); }
  function _renderHtwPage(){
    var canvas = document.getElementById('finance-canvas'); if(!canvas) return;
    var box = document.createElement('div');
    box.style.cssText = 'max-width:820px;margin:0 auto;padding:24px 28px;font-family:\'Source Sans 3\',system-ui,sans-serif;';
    function badge(cls, txt){ return '<span class="fin-badge fin-badge-'+cls+'" style="margin-left:0">'+txt+'</span>'; }
    box.innerHTML =
        '<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:20px;margin:0 0 6px;letter-spacing:.06em">How this works</h2>'
      + '<p style="color:#C9A961;font-size:12px;margin:0 0 18px;font-style:italic">'+_esc(NOTICE)+'</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">DISCLOSURE — HOW THIS REVIEW WAS PRODUCED</h3>'
      + '<ul style="color:#ccc;font-size:13px;line-height:1.6;padding-left:0;margin:6px 0 10px;list-style:none">'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>AI models used: Claude Fable 5 (saved case processing) · live demo runs use the model selected in SETTINGS.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>LIVE demo runs execute the three-tier pipeline in real time: Tier 1 scans the document\'s finance terms, Tier 2 extracts the operative clauses verbatim (each quote machine-checked against the document), Tier 3 tests them against the stated scope and assembles the report. If a response comes back unusable, the pipeline retries itself automatically (up to 3 attempts) before reporting a failure. Findings are marked PLAUSIBLE — the model reasons from the stated scope, not yet from the loaded standard texts — and remain unverified until scholar review.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Tier 1 — Word-level vetting: individual contract terms checked against the loaded standards vocabulary.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Tier 2 — Sentence-level vetting: each clause sentence read against the applicable standard\'s parameters.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Tier 3 — Concept/standard-level vetting: main terms and structures tested against each in-scope standard (AAOIFI + CBUAE for UAE cases).</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Jurisdiction filter applied first: only standards adopted in the document\'s jurisdiction are in scope; others are greyed out.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Reviewer role declared: the review reads the document from the financier/bank side.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Human scholar layer: every open item carries an empty SCHOLAR DETERMINATION box — no stance is pre-filled; certification requires a qualified Shari\'ah board.</li>'
      + '<li style="margin:0 0 7px"><span style="color:#2ECC71;font-weight:700;margin-right:8px">✓</span>Nothing here is a ruling. Demonstration mapping only.</li>'
      + '</ul>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">THE PAGES</h3>'
      + '<ul style="color:#ccc;font-size:13px;line-height:1.7;padding-left:18px;margin:6px 0 10px">'
      + '<li><b>HOME</b> — the 24 financial words of the Qur\'an, in three tiers; every trace starts here. READ opens the verses.</li>'
      + '<li><b>TRACE</b> — search any of the 214 modern terms and follow it back to its Qur\'anic origin: today\'s usage, parent contract, standards, dated history, and (where cited) the exact row where the term was born. All 214 terms are routed to the 24 words.</li>'
      + '<li><b>TIMELINE</b> — the full evidence spine per contract: Qur\'an at top, hadith, tafsir, law schools, modern standards; term tiles and lifelines to the right.</li>'
      + '<li><b>LADDER</b> — one contract\'s chain as a single climbing lifeline with READ links into the library.</li>'
      + '<li><b>PRISM</b> — where the traditions differ: 18 comparison topics, each showing every authority\'s and school\'s position verbatim, tagged verified / plausible / pending citation. Amber ⚖ chips elsewhere jump here.</li>'
      + '<li><b>STANDARDS</b> — full-text reader for the standards held on disk; every standard code shown anywhere is one click from its text.</li>'
      + '<li><b>LECTURE</b> — the master course: read a topic top-to-bottom as a document.</li>'
      + '<li><b>UPLOAD</b> — load your own PDF for a live three-tier review.</li>'
      + '<li><b>SETTINGS</b> — API key + model for live runs, and the report vetting scope: jurisdiction, tradition, confidence, and the standards board (✓ ALL chips select or clear a whole group; filled = fully selected).</li>'
      + '<li><b>REPORT</b> — the assembled review: provenance, open items ranked HIGH / MEDIUM / LOW, checklist, scholar boxes.</li>'
      + '<li><b>ARCHIVE</b> — signed-off reports, read-only, reopenable and printable.</li>'
      + '</ul>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">The teal chip in the toolbar always names the page you are on. The dark ← BACK button retraces your steps inside USUL (pale when there is nowhere to go back to).</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">BASIC USER FLOW</h3>'
      + '<ol style="color:#ccc;font-size:13px;line-height:1.7;padding-left:20px;margin:6px 0 10px">'
      + '<li>UPLOAD a document (or pick a saved case in REPORT\'s CASE dropdown).</li>'
      + '<li>SETTINGS — confirm the vetting scope: jurisdiction, tradition, standards.</li>'
      + '<li>RUN LIVE REVIEW — Tier 1 → Tier 2 → Tier 3; progress shows per tier.</li>'
      + '<li>REPORT — read Provenance, the standards applied, and the open items.</li>'
      + '<li>Click an open item — see three blocks: what the document says, what the standard says, the potential issue. Standard codes open the full text; cited verses open the Qur\'an reader.</li>'
      + '<li>SCHOLAR DETERMINATION — a scholar records ACCEPT / HOLD / REFER BACK with reasoning; inputs are saved on this device.</li>'
      + '<li>SIGN OFF &amp; ARCHIVE — the report is stored read-only and can be reopened or printed.</li>'
      + '</ol>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">THE COLOUR CODE</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px"><b>Gold is reserved for the Qur\'an</b> — the spine, the Qur\'an pill and verse READ controls, and nothing else. Amber with the ⚖ symbol always means "scholars differ" and opens PRISM. Teal marks things you can press. Green tags mean source-verified; grey/amber tags mean pending.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What this is</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">A private research/demo timeline tracing Islamic-finance contracts, terms, scholars, books and events back toward their classical origins. It is an investor/scholar demonstration and a seed for a later compliance tool. It is <b>not public and not certified</b>.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">The data</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">The rows are real finance vocabulary, people, books and events that were assembled for this demo. They are loaded exactly as delivered — nothing here has been independently checked. Treat every row as a starting point, not settled fact. A qualified Shariah scholar has not signed any of it off.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Confidence badges</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 6px">Every fact-bearing row carries one badge, showing how firm that row is:</p>'
      + '<ul style="color:#ccc;font-size:13px;line-height:1.7;padding-left:18px;margin:6px 0 10px">'
      + '<li>'+badge('est','Established')+' — strongest of the three tiers in this demo set.</li>'
      + '<li>'+badge('ill','Illustrative')+' — a real, well-known entity, shown for illustration and not individually re-checked.</li>'
      + '<li>'+badge('plc','Placeholder')+' — condensed or incomplete; must look provisional, never settled.</li>'
      + '</ul>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">Other tags you will meet: <b>CITED</b> (green, on a TRACE lineage row) — the exact source clause is quoted; <b>needs verification</b> — no source states the link yet, said plainly. PRISM positions carry <b>VERIFIED</b> (read on an official source), <b>plausible</b> (reliable secondary source, upgrade path noted), or <b>needs check</b> (no source read — never silently filled). On HOME, <b>TRACED / PARTIAL</b> shows how far a Qur\'anic word\'s chain to today is complete.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Tracing a term (TRACE)</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">Type any modern term — tawarruq, sukuk, urf. The page shows: TODAY (what the term is now, with its first-recorded date and source), an amber ⚖ bar if scholars differ on it (click → PRISM), STANDARDS TODAY (the clauses that govern it, jurisdiction-scoped, each verified date shown), the DATED HISTORY down the page, and QUR\'ANIC ORIGIN at the bottom — the gold READ pill opens the verses. The right panel holds the term\'s full details: its Qur\'an words, contracts, concept family, clause-verified standards, connections, and — where a source states it — the cited row where the term was born. Narrow everything with the TRADITION, SCHOOL and JURISDICTION dropdowns.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Tradition tags</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">Scholars carry tradition tags (sect, school of law, and movements such as Deobandi or Azhari). On TIMELINE, the single TRADITION dropdown merges sect + school + movement, with coverage counts per option; rows that do not match are greyed — never hidden — and untagged rows are marked as untagged. Standards are never filtered by madhhab (locked rule): jurisdiction and regulator only.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Concept families</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">The CONCEPTS dropdown turns on any of 18 editorial concept families. Each selected family draws a coloured arc off the stem, from its origin year up to the present, labelled with that origin year (a leading “c.” means the year is approximate). Click an arc to highlight the people, books and events its contracts touch.</p>'
      + '<h3 style="color:#D4AF37;font-size:13px;margin:18px 0 6px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Reading the timeline</h3>'
      + '<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 10px">The gold stem runs oldest (top) to present (bottom). CE years sit to the left of the stem and Hijri years to the right — toggle either with the CE│هـ control. Rows to the left are scholars, books and events anchored to their year. Click a row to highlight everything it links to and open a detail panel; click empty space to clear.</p>'
      + '<p style="color:#999;font-size:12px;margin-top:16px">Demonstration data · unverified · not certified</p>';
    canvas.innerHTML = '';
    canvas.appendChild(box);
    _renderHub();
  }

  function _renderError(errs){
    var c = document.getElementById('finance-canvas'); if(!c) return;
    c.innerHTML = '<div class="fin-error">'
      + '<b>Some reference data didn\'t load.</b><br>'
      + 'To keep everything accurate, the view paused instead of showing partial data.<br><br>'
      + 'Please refresh the page. If it keeps happening, check your connection and try again.'
      + '<details style="margin-top:14px;opacity:.65"><summary style="cursor:pointer;font-size:12px">Technical details</summary>'
      + '<div style="font-size:12px;margin-top:6px">Missing or unreadable: ' + errs.map(_esc).join(', ')
      + '<br>Expected under <code>bv-app/data/Finance/</code>.</div></details>'
      + '</div>';
  }

  // ── Mount / unmount ──
  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;
    zoneCEl.innerHTML =
        '<div id="finance-view">'
      +   '<div id="finance-notice"></div>'
      +   '<div id="finance-toolbar"></div>'
      +   '<div id="finance-main">'
      +     '<div id="finance-canvas-wrap" class="fin-canvas"><div id="finance-canvas"><div class="fin-empty">Loading finance provenance data…</div></div></div>'
      +     '<div id="finance-hub" class="fin-hub"></div>'
      +   '</div>'
      + '</div>';

    var notice = document.getElementById('finance-notice');
    // Slim one-line banner. Long NOTICE string stays for the How-this-works overlay only.
    notice.innerHTML = '<img id="usul-fs-logo" src="assets/Usul-Eng-Logo.png" alt="Usul" onerror="this.style.display=\'none\'">'
      + '<span class="fin-notice-text">Private preview — demonstration data. Not scholar-certified.</span>';
    // HOW THIS WORKS now lives in the mode row (see _buildToolbar), not the banner.

    // Info hub starts in its "nothing selected" state.
    _renderHub();

    // Close any open filter panel when clicking outside the toolbar.
    _docClick = function(){ var tb=document.getElementById('finance-toolbar'); if(tb) tb.querySelectorAll('.bv-dd-panel.open').forEach(function(p){ p.classList.remove('open'); }); };
    document.addEventListener('click', _docClick);
    _docKey = function(e){ if(e.key === 'Escape'){ document.querySelectorAll('.bv-dd-panel.open').forEach(function(p){ p.classList.remove('open'); }); } };
    document.addEventListener('keydown', _docKey);

    _load().then(function(res){
      if(!_mounted) return;
      if(res.error){ _renderError(res.error); return; }
      _ingest(res.data);
      _vetInit();               // restore report-vetting scope from localStorage (or default: all standards)
      _archInit();              // restore signed-off report archive from localStorage (or empty)
      _schInit();               // restore FAB scholar determinations from localStorage (or empty)
      _buildToolbar();
      _applyModeAttr();
      _renderMode();
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;
    if(_docClick){ document.removeEventListener('click', _docClick); _docClick = null; }
    if(_docKey){ document.removeEventListener('keydown', _docKey); _docKey = null; }
    // The hub lives inside zoneC and is cleared with it below; no floating nodes remain.
    var ov = document.getElementById('fin-htw-overlay'); if(ov) ov.remove();
    _sel = null;
    var zc = document.getElementById('zoneC'); if(zc) zc.innerHTML = '';
    var zb = document.getElementById('zoneB'); if(zb) zb.innerHTML = '';
  }

  return { mount: mount, unmount: unmount, showHtw: _showHtw };
})();
