(function(){
'use strict';

var COLLECTIONS = [
  {key:'bukhari',  label:'Sahih Bukhari',      file:'data/hadith/bukhari.json'},
  {key:'muslim',   label:'Sahih Muslim',        file:'data/hadith/muslim.json'},
  {key:'abudawud', label:"Sunan Abi Da'ud",     file:'data/hadith/abudawud.json'},
  {key:'tirmidhi', label:"Jami' al-Tirmidhi",   file:'data/hadith/tirmidhi.json'},
  {key:'nasai',    label:"Sunan an-Nasa'i",      file:'data/hadith/nasai.json'},
  {key:'ibnmajah', label:'Sunan Ibn Majah',     file:'data/hadith/ibnmajah.json'}
];

var _cache = {};
var MAX_ROWS = 500;

var _colSel, _narSel, _resultsEl, _loadingEl, _countEl;
var _narratorIndex = [];

function esc(s){
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function truncate(s, max){
  if(!s) return '';
  return s.length > max ? s.substring(0, max) + '…' : s;
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
  return getField(h, ['narrator','chain','narrated_by']);
}
function getLabel(key){
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key) return COLLECTIONS[i].label;
  }
  return key;
}

function showLoading(on){
  _loadingEl.style.display = on ? 'block' : 'none';
  _resultsEl.style.display = on ? 'none' : 'block';
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
      arr.forEach(function(h){
        h._colKey = COLLECTIONS[i].key;
      });
      all = all.concat(arr);
    });
    return all;
  });
}

function render(hadiths, colKey){
  _resultsEl.innerHTML = '';
  if(!hadiths || !hadiths.length){
    _resultsEl.innerHTML = '<div class="hp-empty">No hadiths match these filters.</div>';
    _countEl.textContent = '';
    return;
  }

  var narFilter = _narSel.value;
  var filtered = hadiths;
  if(narFilter !== 'all'){
    var narLower = narFilter.toLowerCase();
    filtered = hadiths.filter(function(h){
      var n = getNarrator(h);
      return n.toLowerCase().indexOf(narLower) !== -1;
    });
  }

  _countEl.textContent = filtered.length + ' hadith' + (filtered.length !== 1 ? 's' : '') + ' found';

  if(!filtered.length){
    _resultsEl.innerHTML = '<div class="hp-empty">No hadiths match these filters.</div>';
    return;
  }

  var frag = document.createDocumentFragment();
  var limit = Math.min(filtered.length, MAX_ROWS);
  for(var i = 0; i < limit; i++){
    var h = filtered[i];
    var label = getLabel(h._colKey || colKey || '');
    var num = getNumber(h);
    var narrator = getNarrator(h);
    var text = getText(h);

    var row = document.createElement('div');
    row.className = 'hp-row';
    row.style.cssText = 'padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);';
    row.innerHTML =
      '<div style="font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(212,175,55,0.7);margin-bottom:4px">' +
        esc(label) + ' · #' + esc(String(num)) + ' · Narrator: ' + esc(narrator) +
      '</div>' +
      '<div style="font-size:13px;color:#E5E7EB;line-height:1.5">' + esc(truncate(text, 400)) + '</div>';
    frag.appendChild(row);
  }

  _resultsEl.appendChild(frag);

  if(filtered.length > MAX_ROWS){
    var trunc = document.createElement('div');
    trunc.className = 'hp-truncated';
    trunc.textContent = '…' + (filtered.length - MAX_ROWS) + ' more results truncated';
    _resultsEl.appendChild(trunc);
  }
}

function applyFilters(){
  var colVal = _colSel.value;
  showLoading(true);

  if(colVal === 'all'){
    fetchAll().then(function(all){
      showLoading(false);
      render(all, null);
    });
  } else {
    fetchCollection(colVal).then(function(data){
      data.forEach(function(h){ h._colKey = colVal; });
      showLoading(false);
      render(data, colVal);
    });
  }
}

document.addEventListener('DOMContentLoaded', function(){
  _colSel    = document.getElementById('hp-collection');
  _narSel    = document.getElementById('hp-narrator');
  _resultsEl = document.getElementById('hp-results');
  _loadingEl = document.getElementById('hp-loading');
  _countEl   = document.getElementById('hp-count');

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

  _colSel.addEventListener('change', applyFilters);
  _narSel.addEventListener('change', applyFilters);

  // Delegated click handler for any links inside results
  _resultsEl.addEventListener('click', function(e){
    if(e.target.tagName === 'A') e.stopPropagation();
  });

  // Initial state — show empty
  _resultsEl.innerHTML = '<div class="hp-empty">Select a collection or narrator to browse hadiths.</div>';
});
})();
