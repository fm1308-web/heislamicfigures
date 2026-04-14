window.Monastic = (function(){
'use strict';

var COLLECTIONS = [
  {key:'bukhari',  label:'Sahih Bukhari',      file:'data/hadith/bukhari.json'},
  {key:'muslim',   label:'Sahih Muslim',        file:'data/hadith/muslim.json'},
  {key:'abudawud', label:"Sunan Abi Da'ud",     file:'data/hadith/abudawud.json'},
  {key:'tirmidhi', label:"Jami' al-Tirmidhi",   file:'data/hadith/tirmidhi.json'},
  {key:'nasai',    label:"Sunan an-Nasa'i",      file:'data/hadith/nasai.json'},
  {key:'ibnmajah', label:'Sunan Ibn Majah',     file:'data/hadith/ibnmajah.json'}
];

var MON_PERIODS = [
  {id:'early_makkan', label:'Early Makkan',  years:'610\u2013622 CE', span:12, color:'#8B6F47', rgb:'139,111,71'},
  {id:'madinan',      label:'Madinan',       years:'622\u2013632 CE', span:10, color:'#D4AF37', rgb:'212,175,55'},
  {id:'post_prophet', label:'Post-Prophet',  years:'632\u2013661 CE', span:29, color:'#6B8E6B', rgb:'107,142,107'},
  {id:'successor',    label:'Successor Era', years:'661\u2013700 CE', span:39, color:'#5C7A8C', rgb:'92,122,140'}
];

var CONF_STYLES = {
  high:        {bg:'#D4AF37', text:'#0E1621', label:'HIGH'},
  medium:      {bg:'#6B8E6B', text:'#FFFFFF', label:'MEDIUM'},
  low:         {bg:'#5C7A8C', text:'#FFFFFF', label:'LOW'},
  period_only: {bg:'#666',    text:'#FFFFFF', label:'PERIOD ONLY'}
};

var _inited = false;
var _cache = {};
var MAX_ROWS = 500;

var _resultsEl, _loadingEl, _countEl, _bandEl;
var _periodTotals = null;
var _narratorIndex = [];
var _topicList = null;
var _clickBound = false;
var _peopleIndex = null;

var _monSel = {
  period:     new Set(),
  topic:      new Set(),
  narrator:   new Set(),
  collection: new Set()
};
var _monDDBound = false;
var _monSearchBoxPrev = null;
var MON_GLOSSARY = {
  'thiqah':           {def:'Trustworthy. Highest reliability rating for a narrator.', src:'Classical rijal'},
  'thiqah thiqah':    {def:'Doubly trustworthy. Emphatic reliability; used for the most reliable narrators.', src:'Classical rijal'},
  'sadooq':           {def:'Truthful. Reliable but a step below thiqah; may make minor errors.', src:'Classical rijal'},
  'hasan al-hadith':  {def:'Good in hadith. Narrations are acceptable but not top-tier.', src:'Classical rijal'},
  'saduq hasan':      {def:'Truthful and good. Acceptable reliability.', src:'Classical rijal'},
  'maqbul':           {def:'Acceptable. Reliable when corroborated by others.', src:'Classical rijal'},
  'layyin':           {def:'Soft. Mild weakness in memory or precision.', src:'Classical rijal'},
  'daif':             {def:'Weak. Narration falls below the threshold of acceptance.', src:'Classical rijal'},
  "da'if":            {def:'Weak. Narration falls below the threshold of acceptance.', src:'Classical rijal'},
  'matruk':           {def:'Abandoned. Narrator discarded due to serious defects.', src:'Classical rijal'},
  'kadhdhab':         {def:'Liar. Accused of fabricating hadith.', src:'Classical rijal'},
  'majhool':          {def:'Unknown. Identity or reliability not established.', src:'Classical rijal'},
  'unknown-majhool':  {def:'Unknown. Narrator whose identity or character is unclear.', src:'Classical rijal'},
  'companion':        {def:'Sahabi. Met the Prophet as a Muslim and died believing.', src:'Hadith sciences'},
  "tabi'i":           {def:'Follower. Met a Companion; second generation.', src:'Hadith sciences'},
  "taba' tabi'i":     {def:'Successor of the Follower. Third generation.', src:'Hadith sciences'}
};

function _glossKey(s){
  if(!s) return null;
  var k = String(s).toLowerCase().replace(/\s*\(\d+(st|nd|rd|th)\s*gen\)\s*$/, '').trim();
  return MON_GLOSSARY[k] ? k : null;
}

function _glossWrap(label){
  var k = _glossKey(label);
  if(!k) return esc(label);
  var g = MON_GLOSSARY[k];
  return '<span class="mon-gloss" tabindex="0">' + esc(label) +
         '<span class="mon-gloss-pop"><span class="mon-gloss-def">' + esc(g.def) + '</span>' +
         '<span class="mon-gloss-src">' + esc(g.src) + '</span></span></span>';
}

var _wizardState = null;
var _wizardAllHadith = null;

function esc(s){
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function truncate(s, max){
  if(!s) return '';
  return s.length > max ? s.substring(0, max) + '\u2026' : s;
}

function getField(obj, names){
  for(var i = 0; i < names.length; i++){
    if(obj[names[i]] != null && obj[names[i]] !== '') return obj[names[i]];
  }
  return '';
}

function getNumber(h){ return getField(h, ['hadith_no','hadithNumber','number','id']); }
function getText(h){ return getField(h, ['matn_en','text','english','body','hadith_text']); }
function getNarrator(h){
  var narrs = h.narrators;
  if(Array.isArray(narrs) && narrs.length){
    var last = narrs[narrs.length - 1];
    var name = (last.name || '').split('(')[0].trim();
    if(name) return name;
  }
  var raw = getField(h, ['narrator','chain','narrated_by']);
  if(typeof raw === 'string' && raw.indexOf(',') !== -1){
    var parts = raw.split(',');
    return parts[parts.length - 1].trim();
  }
  if(typeof raw === 'string' && raw.indexOf('|') !== -1){
    var parts2 = raw.split('|');
    return parts2[parts2.length - 1].trim();
  }
  return raw;
}
function getLabel(key){
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key) return COLLECTIONS[i].label;
  }
  return key;
}

function _monPeriodInfo(id){
  for(var i = 0; i < MON_PERIODS.length; i++){
    if(MON_PERIODS[i].id === id) return MON_PERIODS[i];
  }
  return null;
}

function _normName(s){
  return (s||'').toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim();
}
function _buildPeopleIndex(){
  if(_peopleIndex && Object.keys(_peopleIndex).length) return;
  var arr = (typeof PEOPLE !== 'undefined' && PEOPLE && PEOPLE.length) ? PEOPLE : null;
  if(!arr){ _peopleIndex = null; return; }
  _peopleIndex = {};
  arr.forEach(function(p){
    var n = _normName(p.famous);
    if(n) _peopleIndex[n] = p.famous;
    var s = _normName(p.slug);
    if(s) _peopleIndex[s] = p.famous;
  });
}
function _matchNarrator(name){
  _buildPeopleIndex();
  if(!_peopleIndex || !Object.keys(_peopleIndex).length) return null;
  var n = _normName(name);
  if(!n) return null;
  if(_peopleIndex[n]) return _peopleIndex[n];
  var keys = Object.keys(_peopleIndex);
  for(var i = 0; i < keys.length; i++){
    var k = keys[i];
    if(k.length < 4 || n.length < 4) continue;
    if(k === n) return _peopleIndex[k];
    // substring match in either direction
    if((' '+k+' ').indexOf(' '+n+' ') !== -1) return _peopleIndex[k];
    if((' '+n+' ').indexOf(' '+k+' ') !== -1) return _peopleIndex[k];
    if(k.indexOf(n) !== -1) return _peopleIndex[k];
    if(n.indexOf(k) !== -1) return _peopleIndex[k];
  }
  return null;
}

function showLoading(on){
  if(_loadingEl) _loadingEl.style.display = on ? 'block' : 'none';
  if(_resultsEl) _resultsEl.style.display = on ? 'none' : 'block';
}

function fetchCollection(key){
  if(_cache[key]) return Promise.resolve(_cache[key]);
  var col = null;
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key){ col = COLLECTIONS[i]; break; }
  }
  if(!col) return Promise.resolve([]);
  return fetch(col.file).then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    if(!Array.isArray(data)) data = [];
    _cache[key] = data;
    return data;
  }).catch(function(e){
    console.warn('Failed to load ' + col.file + ':', e);
    _cache[key] = [];
    return [];
  });
}

function fetchAll(){
  var promises = COLLECTIONS.map(function(c){ return fetchCollection(c.key); });
  return Promise.all(promises).then(function(results){
    var all = [];
    results.forEach(function(arr, i){
      arr.forEach(function(h){ h._colKey = COLLECTIONS[i].key; });
      all = all.concat(arr);
    });
    return all;
  });
}

function _stripArabic(s){
  return String(s || '').replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

function _narratorCell(name){
  name = _stripArabic(name);
  if(!name) return '';
  var matched = _matchNarrator(name);
  if(matched){
    return '<span class="mon-narrator-tag" data-famous="' + esc(matched) + '" style="cursor:pointer;padding:2px 8px;border:1px solid rgba(212,175,55,0.4);border-radius:3px;background:rgba(212,175,55,0.08);color:#D4AF37;font-weight:500;font-size:12px">' + esc(name) + '</span>';
  }
  return '<span style="color:rgba(229,231,235,0.75)">' + esc(name) + '</span>';
}

function _gradeShort(g){
  if(!g) return '';
  var s = String(g), m;
  if(s.indexOf('Comp.(RA)') !== -1) return 'Companion';
  if((m = s.match(/Follower\(Tabi'\)\s*\[(\d+)(st|nd|rd|th)\s*Generation\]/i))) return "Tabi'i (" + m[1] + m[2] + ' gen)';
  if((m = s.match(/Succ\.\s*\(Taba'\s*Tabi'\)\s*\[(\d+)(st|nd|rd|th)\s*generation\]/i))) return "Taba' Tabi'i (" + m[1] + m[2] + ' gen)';
  if((m = s.match(/(\d+)(st|nd|rd|th)\s*Century\s*AH/i))) return m[1] + m[2] + ' century AH';
  return s;
}

function _narratorBlock(h){
  var narrs = Array.isArray(h.narrators) ? h.narrators : [];
  if(!narrs.length){
    return '<div style="color:rgba(160,174,192,0.7);font-style:italic;font-size:12px">(Chain omitted in source)</div>';
  }
  var terminal = narrs[narrs.length - 1];
  var termName = _stripArabic((terminal.name || '').split('(')[0].trim());
  var termCell = _narratorCell(termName);
  var N = narrs.length;
  var toggle = '<button class="mon-chain-toggle" type="button" style="display:block;margin-top:6px;background:transparent;border:none;padding:0;color:rgba(212,175,55,0.7);font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;cursor:pointer">\u25BC CHAIN (' + N + ')</button>';
  var rows = '';
  for(var i = N - 1, pos = 1; i >= 0; i--, pos++){
    var nr = narrs[i];
    var nm = _stripArabic((nr.name || '').split('(')[0].trim()) || '(unknown)';
    var isTerm = (pos === 1);
    var isComp = (i === 0);
    var grade = isTerm ? 'Companion' : _gradeShort(nr.grade);
    var dy = (nr.death_year != null && nr.death_year !== '') ? ' \u00B7 d. ' + String(nr.death_year) : '';
    var gradeHtml = _glossWrap(grade) + esc(dy);
    var relHtml = nr.reliability_grade ? ' <span style="color:rgba(212,175,55,0.8)">\u00B7 ' + _glossWrap(String(nr.reliability_grade)) + '</span>' : '';
    var tail = isTerm
      ? '<div style="color:rgba(212,175,55,0.65);font-size:10px;font-style:italic;margin-top:2px">\u2191 heard from the Prophet</div>'
      : (isComp ? '<div style="color:rgba(160,174,192,0.6);font-size:10px;font-style:italic;margin-top:2px">(compiler\'s direct source)</div>' : '');
    rows += '<div style="padding:4px 0;display:flex;gap:8px;align-items:baseline">' +
              '<span style="color:rgba(212,175,55,0.7);font-size:11px;min-width:18px">' + pos + '.</span>' +
              '<div style="flex:1">' +
                '<div style="color:#E5E7EB;font-size:12px">' + esc(nm) + '</div>' +
                '<div style="color:rgba(160,174,192,0.7);font-size:10px;margin-top:2px">' + gradeHtml + relHtml + '</div>' +
                tail +
              '</div>' +
            '</div>';
  }
  var panel = '<div class="mon-chain" style="display:none;margin-top:8px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:4px">' +
                '<div style="font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.1em;color:rgba(212,175,55,0.85);text-transform:uppercase;margin-bottom:6px">Chain of Narration</div>' +
                rows +
              '</div>';
  return termCell + toggle + panel;
}

// ── Dating line builder ──
function _datingLine(h){
  var rangeText, confidence, tooltip;

  if(h.dating && h.dating.range){
    rangeText = '~' + h.dating.range.earliest + '\u2013' + h.dating.range.latest + ' CE';
    confidence = h.dating.confidence || 'low';
    if(h.dating.evidence && h.dating.evidence.length){
      tooltip = h.dating.evidence.map(function(e){ return e.layer + ': ' + e.note; }).join('\n');
    } else {
      tooltip = 'Based on narrator period only';
    }
  } else {
    var pi = _monPeriodInfo(h.period);
    rangeText = pi ? (pi.label + ' Era \u00B7 ' + pi.years) : 'Unknown period';
    confidence = 'period_only';
    tooltip = 'Based on narrator period only';
  }

  var cs = CONF_STYLES[confidence] || CONF_STYLES.period_only;

  return '<div class="mon-dating" style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:\'Lato\',sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:rgba(160,174,192,0.8)">' +
    '<span>Tentative Dating</span>' +
    '<span style="color:rgba(255,255,255,0.3)">\u00B7</span>' +
    '<span>' + esc(rangeText) + '</span>' +
    '<span class="mon-conf-badge" title="' + esc(tooltip) + '" style="cursor:help;padding:2px 7px;border-radius:3px;font-size:9px;font-weight:600;letter-spacing:.08em;background:' + cs.bg + ';color:' + cs.text + '">' + cs.label + '</span>' +
    '</div>';
}

// ── Timeline band ──
function _buildBand(){
  if(!_bandEl) return;
  var html = '';
  MON_PERIODS.forEach(function(p, i){
    var br = (i < MON_PERIODS.length - 1) ? 'border-right:1px solid rgba(0,0,0,0.35);' : '';
    html += '<div class="mon-period-seg" data-period="' + p.id + '" data-rgb="' + p.rgb + '" style="' +
      'position:relative;flex:' + p.span + ';background:rgba(' + p.rgb + ',0.55);' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:\'Cinzel\',serif;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;' +
      'color:#FFFFFF;text-shadow:0 1px 2px rgba(0,0,0,0.85),0 0 3px rgba(0,0,0,0.6);' +
      'transition:background .2s;' + br + '">' +
      '<span>' + esc(p.label) + '</span>' +
      '<span class="mon-period-count" data-period="' + p.id + '" style="' +
        'position:absolute;right:6px;bottom:2px;' +
        'font-family:\'Lato\',sans-serif;font-size:9px;font-weight:400;letter-spacing:.04em;text-transform:none;' +
        'color:rgba(255,255,255,0.55);text-shadow:0 1px 2px rgba(0,0,0,0.7);' +
        '"></span>' +
      '</div>';
  });
  _bandEl.style.cssText = 'display:flex;width:100%;height:34px;margin:12px 0 8px;border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,0.12)';
  _bandEl.innerHTML = html;
  _paintBandCounts();
}

function _paintBandCounts(){
  if(!_bandEl || !_periodTotals) return;
  _bandEl.querySelectorAll('.mon-period-count').forEach(function(el){
    var n = _periodTotals[el.dataset.period] || 0;
    el.textContent = n ? n.toLocaleString() : '';
  });
}

function _computePeriodTotals(){
  if(_periodTotals) { _paintBandCounts(); return; }
  fetchAll().then(function(all){
    var out = {};
    MON_PERIODS.forEach(function(p){ out[p.id] = 0; });
    all.forEach(function(h){ if(out[h.period] != null) out[h.period]++; });
    _periodTotals = out;
    _paintBandCounts();
  });
}

function _syncBand(){
  if(!_bandEl) return;
  var sel = _monSel.period;
  _bandEl.querySelectorAll('.mon-period-seg').forEach(function(seg){
    var rgb = seg.dataset.rgb;
    if(!sel || sel.size === 0){
      seg.style.background = 'rgba(' + rgb + ',0.55)';
    } else if(sel.has(seg.dataset.period)){
      seg.style.background = 'rgba(' + rgb + ',0.95)';
    } else {
      seg.style.background = 'rgba(' + rgb + ',0.18)';
    }
  });
}

// ── Methodology modal ──
function _openMethodology(e){
  e.stopPropagation();
  if(document.getElementById('mon-modal')) return;

  var overlay = document.createElement('div');
  overlay.id = 'mon-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';

  overlay.innerHTML =
    '<div style="background:#1A2332;border:1px solid rgba(212,175,55,0.3);border-radius:6px;max-width:680px;width:100%;max-height:85vh;overflow-y:auto;padding:28px 32px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB">' +
      '<button id="mon-modal-close" style="position:absolute;top:10px;right:14px;background:transparent;border:none;color:#A0AEC0;font-size:24px;cursor:pointer;line-height:1">\u00D7</button>' +
      '<h2 style="font-family:\'Cinzel\',serif;font-size:18px;letter-spacing:.12em;color:#D4AF37;margin:0 0 16px">TENTATIVE DATING \u2014 METHODOLOGY</h2>' +
      '<p style="font-size:13px;line-height:1.6;margin:0 0 16px">Hadiths are reports about events from the Prophet\u2019s life (610\u2013632 CE) and after. None carry an exact date. What you see here is a best-effort reconstruction built by layering evidence. This is tentative by design and will keep improving as we connect more sources.</p>' +
      '<h3 style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.1em;color:#D4AF37;margin:20px 0 10px">CONFIDENCE LEVELS</h3>' +
      '<div style="font-size:13px;line-height:1.7">' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#D4AF37;color:#0E1621;margin-right:8px">HIGH</span>Hadith text names a specific dated event (e.g. Battle of Badr, 624 CE). Range typically 1\u20133 years.</p>' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#6B8E6B;color:#FFFFFF;margin-right:8px">MEDIUM</span>Multiple contextual clues line up (companion mentioned, location cue, surah cited). Range typically 5\u201315 years.</p>' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#5C7A8C;color:#FFFFFF;margin-right:8px">LOW</span>Only one weak clue beyond narrator period. Range usually covers most of the narrator\u2019s active life.</p>' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#666;color:#FFFFFF;margin-right:8px">PERIOD ONLY</span>No clues in the text itself \u2014 dating falls back to the narrator\u2019s broad period.</p>' +
      '</div>' +
      '<h3 style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.1em;color:#D4AF37;margin:20px 0 10px">LAYERS CURRENTLY APPLIED</h3>' +
      '<div style="font-size:13px;line-height:1.6">' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L1 \u2014 Narrator period (100% coverage)</strong><br>The last narrator in the chain is the companion who heard it from the Prophet. Their known lifespan gives a broad window.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L2 \u2014 Named dated event (4.4%)</strong><br>The hadith text names a specific event with a known year \u2014 Battle of Badr (624), Treaty of Hudaybiyyah (628), etc. Highest confidence.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L3 \u2014 Book of Maghazi (1.7%)</strong><br>Hadith is in the Military Expeditions section of a collection, which scholars organized around the Madinan period.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L4 \u2014 Named companion (20.8%)</strong><br>Text mentions a companion other than the narrator, whose lifespan narrows the window.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L5 \u2014 Location clue (2.6%)</strong><br>Text mentions Madinah, Ansar, Muhajirun etc. \u2014 implies post-Hijrah.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L6 \u2014 Quranic surah cited (13.4%)</strong><br>Makkan surahs point to 610\u2013622; Madinan surahs to 622\u2013632.</p>' +
      '</div>' +
      '<h3 style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.1em;color:#D4AF37;margin:20px 0 10px">PLANNED LAYERS</h3>' +
      '<ul style="font-size:13px;line-height:1.6;margin:0;padding-left:20px">' +
        '<li>Sunnah.com expedition cross-references</li>' +
        '<li>Manual scholar review for high-traffic hadiths</li>' +
        '<li>Cross-collection corroboration</li>' +
      '</ul>' +
      '<p style="font-size:12px;color:#A0AEC0;margin:20px 0 0;font-style:italic">This is not precise dating. Treat all ranges as approximate.</p>' +
    '</div>';

  document.body.appendChild(overlay);

  function _close(){ var m = document.getElementById('mon-modal'); if(m) m.remove(); }
  overlay.querySelector('#mon-modal-close').addEventListener('click', _close);
  overlay.addEventListener('click', function(ev){ if(ev.target === overlay) _close(); });
  document.addEventListener('keydown', function _esc(ev){
    if(ev.key === 'Escape'){ _close(); document.removeEventListener('keydown', _esc); }
  });
}

// ── Filter + render ──
function _applyAllFilters(){
  _syncBand();
  showLoading(true);

  var colSet = _monSel.collection;
  var periodSet = _monSel.period;
  var topicSet = _monSel.topic;
  var narSet = _monSel.narrator;

  var promise;
  if(colSet.size === 0){
    promise = fetchAll();
  } else {
    var keys = Array.from(colSet);
    promise = Promise.all(keys.map(function(k){
      return fetchCollection(k).then(function(data){
        data.forEach(function(h){ h._colKey = k; });
        return data;
      });
    })).then(function(arrs){
      var all = []; arrs.forEach(function(a){ all = all.concat(a); });
      return all;
    });
  }

  promise.then(function(hadiths){
    if(periodSet.size > 0){
      hadiths = hadiths.filter(function(h){ return periodSet.has(h.period); });
    }
    if(topicSet.size > 0){
      hadiths = hadiths.filter(function(h){ return topicSet.has(h.topic); });
    }
    if(narSet.size > 0){
      var narLowers = Array.from(narSet).map(function(s){ return s.toLowerCase(); });
      hadiths = hadiths.filter(function(h){
        var n = (getNarrator(h) || '').toLowerCase();
        for(var i = 0; i < narLowers.length; i++){
          if(n.indexOf(narLowers[i]) !== -1) return true;
        }
        return false;
      });
    }

    showLoading(false);
    _renderRows(hadiths, colSet.size === 1 ? Array.from(colSet)[0] : '');
  });
}

function _renderRows(filtered, colKey){
  _resultsEl.innerHTML = '';
  _countEl.textContent = filtered.length + ' hadith' + (filtered.length !== 1 ? 's' : '') + ' found';

  if(!filtered.length){
    _resultsEl.innerHTML = '<div style="text-align:center;padding:40px;color:#6B7280;font-size:13px">No hadiths match these filters.</div>';
    return;
  }

  var frag = document.createDocumentFragment();

  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:grid;grid-template-columns:160px 180px 1fr;gap:14px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15);font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(160,174,192,0.7)';
  hdr.innerHTML = '<div>Source</div><div>Narrator</div><div>Hadith</div>';
  frag.appendChild(hdr);

  var limit = Math.min(filtered.length, MAX_ROWS);
  for(var i = 0; i < limit; i++){
    var h = filtered[i];
    var label = getLabel(h._colKey || colKey || '');
    var num = getNumber(h);
    var narrator = getNarrator(h);
    var text = getText(h);
    var topic = h.topic ? String(h.topic) : '';

    var topicHtml = topic
      ? '<div style="font-family:\'Lato\',sans-serif;font-size:10px;letter-spacing:.08em;color:#FFFFFF;margin-top:16px">' + esc(topic) + '</div>'
      : '';

    var _pi = _monPeriodInfo(h.period);
    var periodLabel = _pi ? _pi.label : '';
    var periodColor = _pi ? _pi.color : 'rgba(160,174,192,0.75)';
    var periodHtml = periodLabel
      ? '<div style="font-family:\'Lato\',sans-serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:' + periodColor + ';margin-top:3px">' + esc(periodLabel) + '</div>'
      : '';

    var row = document.createElement('div');
    row.className = 'mon-row';
    row.style.cssText = 'display:grid;grid-template-columns:160px 180px 1fr;gap:14px;align-items:start;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);';
    row.innerHTML =
      '<div><div style="font-family:\'Cinzel\',serif;font-size:11px;color:rgba(212,175,55,0.85);letter-spacing:.06em;margin-bottom:4px">#' + esc(String(num)) + '</div>' +
      '<div style="font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(212,175,55,0.65)">' + esc(label) + '</div>' +
      topicHtml + periodHtml + '</div>' +
      '<div class="mon-narrator">' + _narratorBlock(h) + '</div>' +
      '<div style="font-size:13px;color:#E5E7EB;line-height:1.5">' + esc(text) + _datingLine(h) + '</div>';
    frag.appendChild(row);
  }

  _resultsEl.appendChild(frag);

  if(filtered.length > MAX_ROWS){
    var trunc = document.createElement('div');
    trunc.style.cssText = 'text-align:center;padding:12px;color:#D4AF37;font-size:11px;letter-spacing:.06em;border-top:1px solid #2D3748';
    trunc.textContent = '\u2026 ' + (filtered.length - MAX_ROWS) + ' more results truncated. Narrow your filters to see them.';
    _resultsEl.appendChild(trunc);
  }
}

// ── Topic population ──
function _populateTopics(){
  if(_topicList) return Promise.resolve();
  return fetchCollection('bukhari').then(function(data){
    var set = {};
    data.forEach(function(h){ if(h.topic) set[h.topic] = true; });
    _topicList = Object.keys(set).sort();
    _topicList.forEach(function(t){
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      _topicSel.appendChild(opt);
    });
  });
}

// ── Multi-select dropdown helpers ──
function _monPanelId(kind){ return 'mon-' + kind + 'Panel'; }
function _monBtnId(kind){   return 'mon-' + kind + 'Btn'; }
function _monCountId(kind){ return 'mon-' + kind + 'Count'; }
function _monDotId(kind){   return 'mon-' + kind + 'Dot'; }
function _monAllCkId(kind){ return 'mon-' + kind + 'AllCk'; }

function _monBuildPanel(kind, entries){
  var panel = document.getElementById(_monPanelId(kind));
  if(!panel) return;
  panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){ el.remove(); });
  var oldSearch = panel.querySelector('.dd-search');
  if(oldSearch) oldSearch.remove();

  var si = document.createElement('input');
  si.type = 'text'; si.className = 'dd-search'; si.placeholder = 'Search...';
  si.oninput = function(){
    var q = si.value.toLowerCase();
    panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){
      el.style.display = el.innerText.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
  };
  panel.appendChild(si);

  entries.forEach(function(entry){
    var el = document.createElement('div');
    el.className = 'dd-item';
    el.dataset.val = entry.value;
    el.innerHTML = '<div class="dd-checkbox"></div><span>' + esc(entry.label) + '</span>';
    el.onclick = function(){ _monDDToggleItem(kind, entry.value); };
    panel.appendChild(el);
  });
}

function _monSyncDD(kind){
  var sel = _monSel[kind];
  var panel = document.getElementById(_monPanelId(kind));
  var btn   = document.getElementById(_monBtnId(kind));
  var cnt   = document.getElementById(_monCountId(kind));
  var dot   = document.getElementById(_monDotId(kind));
  var allCk = document.getElementById(_monAllCkId(kind));
  if(!panel || !btn) return;

  panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(item){
    var on = sel.has(item.dataset.val);
    item.classList.toggle('selected', on);
    var ck = item.querySelector('.dd-checkbox');
    if(ck) ck.textContent = on ? '\u2713' : '';
  });
  if(allCk) allCk.textContent = sel.size === 0 ? '\u2713' : '';

  if(sel.size > 0){
    if(cnt){ cnt.textContent = sel.size; cnt.style.display = ''; }
    btn.classList.add('filtered');
    if(dot) dot.style.display = 'inline-block';
  } else {
    if(cnt) cnt.style.display = 'none';
    btn.classList.remove('filtered');
    if(dot) dot.style.display = 'none';
  }
}

function _monDDToggleItem(kind, v){
  var sel = _monSel[kind];
  if(sel.has(v)) sel.delete(v); else sel.add(v);
  _monSyncDD(kind);
  _applyAllFilters();
}

function _monToggleDD(kind){
  var panel = document.getElementById(_monPanelId(kind));
  var btn   = document.getElementById(_monBtnId(kind));
  if(!panel || !btn) return;
  var wasOpen = panel.classList.contains('open');
  document.querySelectorAll('#mon-filters .dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
  document.querySelectorAll('#mon-filters .dd-btn.open').forEach(function(b){ b.classList.remove('open'); });
  if(!wasOpen){
    panel.classList.add('open'); btn.classList.add('open');
    var si = panel.querySelector('.dd-search');
    if(si){ si.value = ''; si.dispatchEvent(new Event('input')); si.focus(); }
  }
}

function _monDDClearAll(kind){
  _monSel[kind].clear();
  _monSyncDD(kind);
  _applyAllFilters();
}

// ── Init ──
function init(){
  if(_inited) return;
  _inited = true;

  _resultsEl = document.getElementById('mon-results');
  _loadingEl = document.getElementById('mon-loading');
  _countEl   = document.getElementById('mon-count');
  _bandEl    = document.getElementById('mon-timeline-band');

  // Populate period panel
  _monBuildPanel('period', MON_PERIODS.map(function(p){
    return { value: p.id, label: p.label + ' (' + p.years + ')' };
  }));

  // Populate collection panel
  _monBuildPanel('collection', COLLECTIONS.map(function(c){
    return { value: c.key, label: c.label };
  }));

  // Populate narrators from index (with counts)
  fetch('data/hadith/narrator_index.json').then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    if(!Array.isArray(data) || !data.length) throw new Error('empty');
    _narratorIndex = data.sort(function(a,b){ return b.count - a.count; });
    _monBuildPanel('narrator', _narratorIndex.map(function(n){
      return { value: n.name, label: n.name + ' (' + n.count.toLocaleString() + ')' };
    }));
  }).catch(function(e){
    console.warn('narrator_index.json not available:', e);
  });

  // Populate topics from bukhari
  if(!_topicList){
    fetchCollection('bukhari').then(function(data){
      var set = {};
      data.forEach(function(h){ if(h.topic) set[h.topic] = true; });
      _topicList = Object.keys(set).sort();
      _monBuildPanel('topic', _topicList.map(function(t){
        return { value: t, label: t };
      }));
    });
  }

  _buildBand();
  _syncBand();
  _computePeriodTotals();

  var methBtn = document.getElementById('mon-methodology-btn');
  if(methBtn) methBtn.addEventListener('click', _openMethodology);

  // Delegated narrator-pill click (existing Timeline jump)
  if(!_clickBound){
    _clickBound = true;
    _resultsEl.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){ e.stopPropagation(); return; }
      var toggle = e.target.closest('.mon-chain-toggle');
      if(toggle){
        e.stopPropagation();
        var cell = toggle.parentElement;
        var panel = cell ? cell.querySelector('.mon-chain') : null;
        if(!panel) return;
        var open = panel.style.display !== 'none';
        _resultsEl.querySelectorAll('.mon-chain').forEach(function(p){ p.style.display = 'none'; });
        _resultsEl.querySelectorAll('.mon-chain-toggle').forEach(function(t){
          t.textContent = t.textContent.replace('\u25B2', '\u25BC');
        });
        if(!open){
          panel.style.display = 'block';
          toggle.textContent = toggle.textContent.replace('\u25BC', '\u25B2');
        }
        return;
      }
      var tag = e.target.closest('.mon-narrator-tag');
      if(!tag) return;
      e.stopPropagation();
      var famous = tag.getAttribute('data-famous');
      if(famous && typeof focusPersonInTimeline === 'function'){
        focusPersonInTimeline(famous);
      }
    });
  }

  // Close any open mon panel on outside click
  if(!_monDDBound){
    _monDDBound = true;
    document.addEventListener('click', function(e){
      if(e.target.closest('#mon-filters')) return;
      document.querySelectorAll('#mon-filters .dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
      document.querySelectorAll('#mon-filters .dd-btn.open').forEach(function(b){ b.classList.remove('open'); });
    });
  }

  // Hide global search box while Monastic is visible; restore on leave
  var _monSearchBox = document.querySelector('#searchBox, #globalSearch, input[placeholder*="Search figures"]');
  if(_monSearchBox && !_monSearchBoxPrev){
    _monSearchBoxPrev = _monSearchBox.style.display || '';
  }

  _resultsEl.innerHTML = '';
}

var _WIZARD_STEPS_ALL = [
  { key:'topic',      label:'Topic',    prompt:'Which topic interests you?' },
  { key:'period',     label:'Period',   prompt:'From which period?' },
  { key:'narrator',   label:'Narrator', prompt:'Narrated by whom?' },
  { key:'collection', label:'Book',     prompt:'From which collection?' }
];

function _wizardStepsFrom(startKey){
  var keys = ['topic','period','narrator','collection'];
  var i = keys.indexOf(startKey);
  if(i < 0) i = 0;
  var order = keys.slice(i).concat(keys.slice(0, i));
  return order.map(function(k){
    for(var j = 0; j < _WIZARD_STEPS_ALL.length; j++){
      if(_WIZARD_STEPS_ALL[j].key === k) return _WIZARD_STEPS_ALL[j];
    }
  });
}

function _wizardOptionsFor(stepKey){
  if(stepKey === 'topic'){
    return (_topicList || []).map(function(t){ return { value: t, label: t }; });
  }
  if(stepKey === 'period'){
    return MON_PERIODS.map(function(p){ return { value: p.id, label: p.label + ' (' + p.years + ')' }; });
  }
  if(stepKey === 'narrator'){
    return (_narratorIndex || []).slice(0, 150).map(function(n){
      return { value: n.name, label: n.name };
    });
  }
  if(stepKey === 'collection'){
    return COLLECTIONS.map(function(c){ return { value: c.key, label: c.label }; });
  }
  return [];
}

function _wizardApplyPicksExcept(excludeKey){
  if(!_wizardAllHadith) return null;
  var picks = _wizardState.picks;
  var list = _wizardAllHadith;
  if(excludeKey !== 'collection' && picks.collection.length){
    list = list.filter(function(h){ return picks.collection.indexOf(h._colKey) !== -1; });
  }
  if(excludeKey !== 'period' && picks.period.length){
    list = list.filter(function(h){ return picks.period.indexOf(h.period) !== -1; });
  }
  if(excludeKey !== 'topic' && picks.topic.length){
    list = list.filter(function(h){ return picks.topic.indexOf(h.topic) !== -1; });
  }
  if(excludeKey !== 'narrator' && picks.narrator.length){
    var qs = picks.narrator.map(function(s){ return s.toLowerCase(); });
    list = list.filter(function(h){
      var n = (getNarrator(h) || '').toLowerCase();
      for(var i=0;i<qs.length;i++){ if(n.indexOf(qs[i]) !== -1) return true; }
      return false;
    });
  }
  return list;
}

function _wizardCountForValue(stepKey, value){
  var base = _wizardApplyPicksExcept(stepKey);
  if(!base) return 0;
  if(stepKey === 'collection') return base.filter(function(h){ return h._colKey === value; }).length;
  if(stepKey === 'period')     return base.filter(function(h){ return h.period === value; }).length;
  if(stepKey === 'topic')      return base.filter(function(h){ return h.topic === value; }).length;
  if(stepKey === 'narrator'){
    var q = String(value).toLowerCase();
    return base.filter(function(h){
      var n = (getNarrator(h) || '').toLowerCase();
      return n.indexOf(q) !== -1;
    }).length;
  }
  return 0;
}

function _wizardCount(){
  if(!_wizardAllHadith) return null;
  var picks = _wizardState.picks;
  var list = _wizardAllHadith;
  if(picks.collection.length){ list = list.filter(function(h){ return picks.collection.indexOf(h._colKey) !== -1; }); }
  if(picks.period.length){     list = list.filter(function(h){ return picks.period.indexOf(h.period) !== -1; }); }
  if(picks.topic.length){      list = list.filter(function(h){ return picks.topic.indexOf(h.topic) !== -1; }); }
  if(picks.narrator.length){
    var qs = picks.narrator.map(function(s){ return s.toLowerCase(); });
    list = list.filter(function(h){
      var n = (getNarrator(h) || '').toLowerCase();
      for(var i=0;i<qs.length;i++){ if(n.indexOf(qs[i]) !== -1) return true; }
      return false;
    });
  }
  return list.length;
}

function _wizardOpen(){
  var prior = document.getElementById('mon-wizard'); if(prior) prior.remove();

  _wizardState = {
    step: -1,
    picks: { topic:[], period:[], narrator:[], collection:[] },
    steps: _wizardStepsFrom('topic')
  };

  var overlay = document.createElement('div');
  overlay.id = 'mon-wizard';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:\'Lato\',sans-serif';
  overlay.innerHTML =
    '<div id="mon-wizard-card" style="background:#1A2332;border:1px solid rgba(212,175,55,0.4);border-radius:6px;width:520px;max-width:92vw;max-height:86vh;display:flex;flex-direction:column;color:#E5E7EB;box-shadow:0 12px 40px rgba(0,0,0,0.6)">' +
      '<div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between">' +
        '<div style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.12em;color:#D4AF37;text-transform:uppercase">Guided Search</div>' +
        '<div id="mon-wizard-close" style="cursor:pointer;color:#9CA3AF;font-size:20px;line-height:1;padding:0 6px">\u00D7</div>' +
      '</div>' +
      '<div id="mon-wizard-body" style="padding:18px;overflow-y:auto;flex:1"></div>' +
      '<div style="padding:12px 18px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">' +
        '<div id="mon-wizard-count" style="flex:1;min-width:0"></div>' +
        '<div style="display:flex;gap:8px">' +
          '<button id="mon-wizard-back" style="padding:6px 14px;background:transparent;border:1px solid rgba(255,255,255,0.25);border-radius:3px;color:#E5E7EB;font-size:12px;cursor:pointer">Back</button>' +
          '<button id="mon-wizard-next" style="padding:6px 14px;background:rgba(212,175,55,0.18);border:1px solid rgba(212,175,55,0.6);border-radius:3px;color:#D4AF37;font-size:12px;cursor:pointer;font-weight:600">Next \u25B8</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('mon-wizard-close').onclick = _wizardClose;
  overlay.addEventListener('click', function(ev){ if(ev.target === overlay) _wizardClose(); });
  document.getElementById('mon-wizard-back').onclick = function(){
    if(_wizardState.step > 0){ _wizardState.step--; _wizardRender(); }
    else if(_wizardState.step === 0){ _wizardState.step = -1; _wizardRender(); }
  };
  document.getElementById('mon-wizard-next').onclick = function(){
    if(_wizardState.step < _wizardState.steps.length - 1){ _wizardState.step++; _wizardRender(); }
    else { _wizardApply(); }
  };
  document.addEventListener('keydown', _wizardKey);

  var prep = Promise.resolve();
  if(!_topicList){
    prep = prep.then(function(){ return fetchCollection('bukhari').then(function(data){
      var set = {}; data.forEach(function(h){ if(h.topic) set[h.topic] = true; });
      _topicList = Object.keys(set).sort();
    }); });
  }
  prep.then(function(){
    if(!_wizardAllHadith){
      return fetchAll().then(function(all){ _wizardAllHadith = all; });
    }
  }).then(function(){
    _wizardRender();
  });

  document.getElementById('mon-wizard-body').innerHTML = '<div style="text-align:center;padding:40px;color:rgba(160,174,192,0.7);font-size:13px">Loading\u2026</div>';
  document.getElementById('mon-wizard-count').textContent = '';
}

function _wizardKey(ev){ if(ev.key === 'Escape') _wizardClose(); }

function _wizardClose(){
  var el = document.getElementById('mon-wizard'); if(el) el.remove();
  document.removeEventListener('keydown', _wizardKey);
  _wizardState = null;
}

function _wizardCollectionLabel(key){
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key) return COLLECTIONS[i].label;
  }
  return key;
}

function _wizardPeriodLabel(id){
  var pi = _monPeriodInfo(id);
  return pi ? pi.label : id;
}

function _wizardBreadcrumb(){
  if(!_wizardState) return '';
  var p = _wizardState.picks;
  var parts = [];

  if(p.narrator.length) parts.push('<span style="color:rgba(160,174,192,0.7)">Narrated by</span> <span style="color:#D4AF37">' + p.narrator.map(esc).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                  parts.push('<span style="color:rgba(160,174,192,0.5)">Any narrator</span>');

  if(p.topic.length)    parts.push('<span style="color:rgba(160,174,192,0.7)">on</span> <span style="color:#D4AF37">' + p.topic.map(esc).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                  parts.push('<span style="color:rgba(160,174,192,0.5)">any topic</span>');

  if(p.period.length)   parts.push('<span style="color:rgba(160,174,192,0.7)">from</span> <span style="color:#D4AF37">' + p.period.map(function(x){ return esc(_wizardPeriodLabel(x)); }).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                  parts.push('<span style="color:rgba(160,174,192,0.5)">any period</span>');

  if(p.collection.length) parts.push('<span style="color:rgba(160,174,192,0.7)">in</span> <span style="color:#D4AF37">' + p.collection.map(function(x){ return esc(_wizardCollectionLabel(x)); }).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                    parts.push('<span style="color:rgba(160,174,192,0.5)">any book</span>');

  return parts.join(' <span style="color:rgba(255,255,255,0.2)">\u00B7</span> ');
}

function _wizardPeriodBreakdown(){
  var base = _wizardApplyPicksExcept('period');
  if(!base) return null;
  var out = {};
  MON_PERIODS.forEach(function(p){ out[p.id] = 0; });
  base.forEach(function(h){ if(out[h.period] != null) out[h.period]++; });
  return out;
}

function _wizardRender(){
  if(!_wizardState) return;
  var body = document.getElementById('mon-wizard-body');
  var backBtn = document.getElementById('mon-wizard-back');
  var nextBtn = document.getElementById('mon-wizard-next');
  var countEl = document.getElementById('mon-wizard-count');

  if(_wizardState.step === -1){
    var startOpts = [
      { key:'topic',      label:'Topic',    desc:'Start by subject matter (e.g. Marriage, Hajj, Jihad)' },
      { key:'period',     label:'Period',   desc:'Start by era (e.g. Madinan, Post-Prophet)' },
      { key:'narrator',   label:'Narrator', desc:'Start by companion (e.g. Abu Hurairah, \'Aisha)' },
      { key:'collection', label:'Book',     desc:'Start by collection (e.g. Bukhari, Muslim)' }
    ];

    var html = '';
    html += '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,175,55,0.7);font-family:\'Cinzel\',serif;margin-bottom:6px">Begin</div>';
    html += '<div style="font-size:15px;color:#E5E7EB;margin-bottom:14px">Where do you want to begin?</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    startOpts.forEach(function(o){
      html += '<div class="mon-wiz-start" data-key="' + o.key + '" style="padding:12px 14px;border:1px solid rgba(255,255,255,0.12);border-radius:3px;cursor:pointer;background:transparent;transition:background .15s,border-color .15s">' +
        '<div style="font-size:14px;color:#E5E7EB;font-weight:600;margin-bottom:3px">' + esc(o.label) + '</div>' +
        '<div style="font-size:11px;color:rgba(160,174,192,0.8)">' + esc(o.desc) + '</div>' +
        '</div>';
    });
    html += '</div>';
    body.innerHTML = html;

    body.querySelectorAll('.mon-wiz-start').forEach(function(el){
      el.onmouseenter = function(){ el.style.background='rgba(212,175,55,0.08)'; el.style.borderColor='rgba(212,175,55,0.4)'; };
      el.onmouseleave = function(){ el.style.background='transparent'; el.style.borderColor='rgba(255,255,255,0.12)'; };
      el.onclick = function(){
        var k = el.getAttribute('data-key');
        _wizardState.steps = _wizardStepsFrom(k);
        _wizardState.step = 0;
        _wizardRender();
      };
    });

    backBtn.disabled = true;
    backBtn.style.opacity = '0.3';
    backBtn.style.cursor = 'not-allowed';
    nextBtn.style.display = 'none';
    countEl.innerHTML = _wizardAllHadith
      ? '<div style="font-family:\'Cinzel\',serif;font-size:16px;color:#D4AF37;letter-spacing:.08em">TOTAL ' + _wizardAllHadith.length.toLocaleString() + '</div>'
      : 'Loading\u2026';
    return;
  }

  nextBtn.style.display = '';
  var stepDef = _wizardState.steps[_wizardState.step];
  var opts = _wizardOptionsFor(stepDef.key);
  var currentArr = _wizardState.picks[stepDef.key];

  var baseList = _wizardApplyPicksExcept(stepDef.key);
  var anyTotal = baseList ? baseList.length : null;

  var optsWithCounts = opts.map(function(o){
    return { value: o.value, label: o.label, n: _wizardCountForValue(stepDef.key, o.value) };
  });
  optsWithCounts = optsWithCounts.filter(function(o){ return o.n > 0; });
  optsWithCounts.sort(function(a,b){ return b.n - a.n; });

  var html = '';
  html += '<div style="font-size:12px;line-height:1.55;margin-bottom:14px;padding:10px 12px;background:rgba(212,175,55,0.04);border-left:2px solid rgba(212,175,55,0.4);border-radius:2px">' + _wizardBreadcrumb() + '</div>';
  html += '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,175,55,0.7);font-family:\'Cinzel\',serif;margin-bottom:6px">Step ' + (_wizardState.step + 1) + ' of ' + _wizardState.steps.length + ' \u00B7 ' + stepDef.label + '</div>';
  html += '<div style="font-size:15px;color:#E5E7EB;margin-bottom:14px">' + esc(stepDef.prompt) + '</div>';
  html += '<div style="display:flex;flex-direction:column;gap:6px">';

  var anySelected = (currentArr.length === 0);
  var anyCountStr = (anyTotal === null) ? '\u2026' : anyTotal.toLocaleString();
  html += '<div class="mon-wiz-opt" data-val="__any__" style="padding:8px 12px;border:1px solid ' + (anySelected ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.12)') + ';border-radius:3px;cursor:pointer;background:' + (anySelected ? 'rgba(212,175,55,0.10)' : 'transparent') + ';font-size:13px;color:' + (anySelected ? '#D4AF37' : '#E5E7EB') + ';font-style:italic;display:flex;justify-content:space-between;align-items:center;gap:10px">' +
    '<span>Any (skip this filter)</span>' +
    '<span style="font-style:normal;font-size:11px;color:rgba(160,174,192,0.85);white-space:nowrap">' + anyCountStr + '</span>' +
    '</div>';

  optsWithCounts.forEach(function(o){
    var on = (currentArr.indexOf(o.value) !== -1);
    var borderCol = on ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.12)';
    var bg        = on ? 'rgba(212,175,55,0.10)' : 'transparent';
    var textCol   = on ? '#D4AF37' : '#E5E7EB';
    html += '<div class="mon-wiz-opt" data-val="' + esc(o.value) + '" style="padding:8px 12px;border:1px solid ' + borderCol + ';border-radius:3px;cursor:pointer;background:' + bg + ';font-size:13px;color:' + textCol + ';display:flex;justify-content:space-between;align-items:center;gap:10px">' +
      '<span>' + esc(o.label) + '</span>' +
      '<span style="font-size:12px;font-weight:600;color:' + (on ? '#D4AF37' : '#E5E7EB') + ';white-space:nowrap">' + o.n.toLocaleString() + '</span>' +
      '</div>';
  });
  if(optsWithCounts.length === 0){
    html += '<div style="padding:16px;text-align:center;color:rgba(160,174,192,0.7);font-size:12px;font-style:italic">No ' + esc(stepDef.label.toLowerCase()) + ' has any match. Use "Any" to skip, or Back to change a prior pick.</div>';
  }
  html += '</div>';

  body.innerHTML = html;

  body.querySelectorAll('.mon-wiz-opt').forEach(function(el){
    el.onclick = function(){
      var v = el.getAttribute('data-val');
      var arr = _wizardState.picks[stepDef.key];
      if(v === '__any__'){
        _wizardState.picks[stepDef.key] = [];
      } else {
        var idx = arr.indexOf(v);
        if(idx === -1) arr.push(v); else arr.splice(idx, 1);
      }
      _wizardRender();
    };
  });

  backBtn.disabled = false;
  backBtn.style.opacity = '1';
  backBtn.style.cursor = 'pointer';
  var isLast = _wizardState.step === _wizardState.steps.length - 1;
  nextBtn.textContent = isLast ? 'Show me \u25B8' : 'Next \u25B8';

  var n = _wizardCount();
  var totalStr = (n === null) ? '\u2026' : n.toLocaleString();
  var breakdown = _wizardPeriodBreakdown();
  var breakdownHtml = '';
  if(breakdown){
    var parts = MON_PERIODS.map(function(p){
      return '<span style="color:' + p.color + '">' + p.label.toUpperCase() + '</span> <span style="color:#E5E7EB;font-weight:600">' + (breakdown[p.id] || 0).toLocaleString() + '</span>';
    });
    breakdownHtml = '<div style="font-size:10px;letter-spacing:.05em;color:rgba(160,174,192,0.85);margin-top:4px;display:flex;flex-wrap:wrap;gap:10px">' + parts.join('<span style="color:rgba(255,255,255,0.25)">\u00B7</span>') + '</div>';
  }
  countEl.innerHTML =
    '<div style="font-family:\'Cinzel\',serif;font-size:18px;color:#D4AF37;letter-spacing:.1em;font-weight:600">TOTAL ' + totalStr + '</div>' +
    breakdownHtml;
}

function _wizardApply(){
  if(!_wizardState) return;
  var picks = _wizardState.picks;

  _monSel.topic.clear();
  _monSel.period.clear();
  _monSel.narrator.clear();
  _monSel.collection.clear();
  picks.topic.forEach(function(v){ _monSel.topic.add(v); });
  picks.period.forEach(function(v){ _monSel.period.add(v); });
  picks.narrator.forEach(function(v){ _monSel.narrator.add(v); });
  picks.collection.forEach(function(v){ _monSel.collection.add(v); });

  _monSyncDD('topic');
  _monSyncDD('period');
  _monSyncDD('narrator');
  _monSyncDD('collection');

  _wizardClose();
  _applyAllFilters();
}

return {
  init: init,
  toggleDD: _monToggleDD,
  ddClearAll: _monDDClearAll,
  openWizard: _wizardOpen,
  onEnter: function(){
    var box = document.querySelector('#searchBox, #globalSearch, input[placeholder*="Search figures"]');
    if(box){ if(_monSearchBoxPrev === null) _monSearchBoxPrev = box.style.display || ''; box.style.display = 'none'; }
  },
  onLeave: function(){
    var box = document.querySelector('#searchBox, #globalSearch, input[placeholder*="Search figures"]');
    if(box){ box.style.display = (_monSearchBoxPrev === null ? '' : _monSearchBoxPrev); }
  }
};
})();
