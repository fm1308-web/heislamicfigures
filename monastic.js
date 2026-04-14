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
  {id:'early_makkan', label:'Early Makkan',  years:'610\u2013622 CE', span:12, color:'#8B6F47'},
  {id:'madinan',      label:'Madinan',       years:'622\u2013632 CE', span:10, color:'#D4AF37'},
  {id:'post_prophet', label:'Post-Prophet',  years:'632\u2013661 CE', span:29, color:'#6B8E6B'},
  {id:'successor',    label:'Successor Era', years:'661\u2013700 CE', span:39, color:'#5C7A8C'}
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
    var relHtml = nr.reliability_grade ? ' <span style="color:rgba(212,175,55,0.8)">\u00B7 ' + esc(String(nr.reliability_grade)) + '</span>' : '';
    var tail = isTerm
      ? '<div style="color:rgba(212,175,55,0.65);font-size:10px;font-style:italic;margin-top:2px">\u2191 heard from the Prophet</div>'
      : (isComp ? '<div style="color:rgba(160,174,192,0.6);font-size:10px;font-style:italic;margin-top:2px">(compiler\'s direct source)</div>' : '');
    rows += '<div style="padding:4px 0;display:flex;gap:8px;align-items:baseline">' +
              '<span style="color:rgba(212,175,55,0.7);font-size:11px;min-width:18px">' + pos + '.</span>' +
              '<div style="flex:1">' +
                '<div style="color:#E5E7EB;font-size:12px">' + esc(nm) + '</div>' +
                '<div style="color:rgba(160,174,192,0.7);font-size:10px;margin-top:2px">' + esc(grade + dy) + relHtml + '</div>' +
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
    var br = (i < MON_PERIODS.length - 1) ? 'border-right:1px solid rgba(0,0,0,0.25);' : '';
    html += '<div class="mon-period-seg" data-period="' + p.id + '" style="' +
      'flex:' + p.span + ';background:' + p.color + ';opacity:0.3;' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.1em;text-transform:uppercase;' +
      'color:#D4AF37;transition:opacity .2s;' + br + '">' + esc(p.label) + '</div>';
  });
  _bandEl.style.cssText = 'display:flex;width:100%;height:28px;margin:12px 0 8px;border-radius:2px;overflow:hidden;border:1px solid rgba(255,255,255,0.08)';
  _bandEl.innerHTML = html;
}

function _syncBand(){
  if(!_bandEl) return;
  var sel = _monSel.period;
  _bandEl.querySelectorAll('.mon-period-seg').forEach(function(seg){
    if(!sel || sel.size === 0) seg.style.opacity = '0.3';
    else seg.style.opacity = sel.has(seg.dataset.period) ? '1' : '0.1';
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
      '<div style="font-size:13px;color:#E5E7EB;line-height:1.5">' + esc(truncate(text, 400)) + _datingLine(h) + '</div>';
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

  _resultsEl.innerHTML = '<div style="text-align:center;padding:40px;color:#6B7280;font-size:13px">Select a filter to browse hadiths.</div>';
}

return {
  init: init,
  toggleDD: _monToggleDD,
  ddClearAll: _monDDClearAll,
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
