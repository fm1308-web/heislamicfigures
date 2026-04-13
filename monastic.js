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

var _inited = false;
var _cache = {};
var MAX_ROWS = 500;

var _periodSel, _topicSel, _narSel, _colSel;
var _resultsEl, _loadingEl, _countEl, _bandEl;
var _narratorIndex = [];
var _topicList = null;
var _clickBound = false;
var _peopleIndex = null;

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

function _normName(s){
  return (s||'').toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim();
}
function _buildPeopleIndex(){
  if(_peopleIndex) return;
  _peopleIndex = {};
  if(!window.PEOPLE || !window.PEOPLE.length) return;
  window.PEOPLE.forEach(function(p){
    var n = _normName(p.famous);
    if(n) _peopleIndex[n] = p.famous;
    var s = _normName(p.slug);
    if(s) _peopleIndex[s] = p.famous;
  });
}
function _matchNarrator(name){
  _buildPeopleIndex();
  if(!_peopleIndex) return null;
  var n = _normName(name);
  if(_peopleIndex[n]) return _peopleIndex[n];
  var keys = Object.keys(_peopleIndex);
  for(var i = 0; i < keys.length; i++){
    if(keys[i].length > 5 && n.length > 5 && (keys[i].indexOf(n) === 0 || n.indexOf(keys[i]) === 0)){
      return _peopleIndex[keys[i]];
    }
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

function _narratorCell(name){
  var matched = _matchNarrator(name);
  if(matched){
    return '<span class="mon-narrator-tag" data-famous="' + esc(matched) + '" style="cursor:pointer;padding:2px 8px;border:1px solid rgba(212,175,55,0.4);border-radius:3px;background:rgba(212,175,55,0.08);color:#D4AF37;font-weight:500;font-size:12px">' + esc(name) + '</span>';
  }
  return '<span style="color:rgba(229,231,235,0.75)">' + esc(name) + '</span>';
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
  var val = _periodSel ? _periodSel.value : '';
  _bandEl.querySelectorAll('.mon-period-seg').forEach(function(seg){
    if(!val) seg.style.opacity = '0.3';
    else seg.style.opacity = (seg.dataset.period === val) ? '1' : '0.1';
  });
}

// ── Filter + render ──
function _applyAllFilters(){
  var colVal = _colSel.value;
  var periodVal = _periodSel.value;
  var topicVal = _topicSel.value;
  var narVal = _narSel.value;

  _syncBand();
  showLoading(true);

  var promise;
  if(!colVal){
    promise = fetchAll();
  } else {
    promise = fetchCollection(colVal).then(function(data){
      data.forEach(function(h){ h._colKey = colVal; });
      return data;
    });
  }

  promise.then(function(hadiths){
    // Apply period filter
    if(periodVal){
      hadiths = hadiths.filter(function(h){ return h.period === periodVal; });
    }
    // Apply topic filter
    if(topicVal){
      hadiths = hadiths.filter(function(h){ return h.topic === topicVal; });
    }
    // Apply narrator filter
    if(narVal){
      var narLower = narVal.toLowerCase();
      hadiths = hadiths.filter(function(h){
        var n = getNarrator(h);
        return n.toLowerCase().indexOf(narLower) !== -1;
      });
    }

    showLoading(false);
    _renderRows(hadiths, colVal);
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

  // Header row
  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:grid;grid-template-columns:70px 160px 180px 1fr;gap:14px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15);font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(160,174,192,0.7)';
  hdr.innerHTML = '<div>#</div><div>Source</div><div>Narrator</div><div>Hadith</div>';
  frag.appendChild(hdr);

  var limit = Math.min(filtered.length, MAX_ROWS);
  for(var i = 0; i < limit; i++){
    var h = filtered[i];
    var label = getLabel(h._colKey || colKey || '');
    var num = getNumber(h);
    var narrator = getNarrator(h);
    var text = getText(h);

    var row = document.createElement('div');
    row.className = 'mon-row';
    row.style.cssText = 'display:grid;grid-template-columns:70px 160px 180px 1fr;gap:14px;align-items:start;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);';
    row.innerHTML =
      '<div style="font-family:\'Cinzel\',serif;font-size:11px;color:rgba(212,175,55,0.85);letter-spacing:.06em">#' + esc(String(num)) + '</div>' +
      '<div style="font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(212,175,55,0.65)">' + esc(label) + '</div>' +
      '<div class="mon-narrator">' + _narratorCell(narrator) + '</div>' +
      '<div style="font-size:13px;color:#E5E7EB;line-height:1.5">' + esc(truncate(text, 400)) + '</div>';
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

// ── Init ──
function init(){
  if(_inited) return;
  _inited = true;

  _periodSel = document.getElementById('mon-period');
  _topicSel  = document.getElementById('mon-topic');
  _narSel    = document.getElementById('mon-narrator');
  _colSel    = document.getElementById('mon-collection');
  _resultsEl = document.getElementById('mon-results');
  _loadingEl = document.getElementById('mon-loading');
  _countEl   = document.getElementById('mon-count');
  _bandEl    = document.getElementById('mon-timeline-band');

  // Populate period dropdown
  MON_PERIODS.forEach(function(p){
    var opt = document.createElement('option');
    opt.value = p.id;
    opt.textContent = p.label + ' (' + p.years + ')';
    _periodSel.appendChild(opt);
  });

  // Populate collection dropdown
  COLLECTIONS.forEach(function(c){
    var opt = document.createElement('option');
    opt.value = c.key;
    opt.textContent = c.label;
    _colSel.appendChild(opt);
  });

  // Populate narrator dropdown from index
  fetch('data/hadith/narrator_index.json').then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    if(!Array.isArray(data) || !data.length) throw new Error('empty');
    _narratorIndex = data.sort(function(a,b){ return b.count - a.count; });
    _narratorIndex.forEach(function(n){
      var opt = document.createElement('option');
      opt.value = n.name;
      opt.textContent = n.name + ' (' + n.count.toLocaleString() + ')';
      _narSel.appendChild(opt);
    });
  }).catch(function(e){
    console.warn('narrator_index.json not available:', e);
  });

  // Populate topics (lazy from bukhari)
  _populateTopics();

  // Build timeline band
  _buildBand();
  _syncBand();

  // Bind all 4 filters
  _periodSel.addEventListener('change', _applyAllFilters);
  _topicSel.addEventListener('change', _applyAllFilters);
  _narSel.addEventListener('change', _applyAllFilters);
  _colSel.addEventListener('change', _applyAllFilters);

  // Delegated click handler for narrator tags and links
  if(!_clickBound){
    _clickBound = true;
    _resultsEl.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){ e.stopPropagation(); return; }
      var tag = e.target.closest('.mon-narrator-tag');
      if(!tag) return;
      e.stopPropagation();
      var famous = tag.getAttribute('data-famous');
      if(famous && typeof focusPersonInTimeline === 'function'){
        focusPersonInTimeline(famous);
      }
    });
  }

  // Initial state
  _resultsEl.innerHTML = '<div style="text-align:center;padding:40px;color:#6B7280;font-size:13px">Select a filter to browse hadiths.</div>';
}

return { init: init };
})();
