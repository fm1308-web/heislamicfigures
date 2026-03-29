// ═══════════════════════════════════════════════════════════
// ERAS VIEW — Vertical stem with leaf shapes for all types & traditions
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var TOTAL_H = 8060; // 60 top pad + 400 pre + 7600 post
var NS = 'http://www.w3.org/2000/svg';
var TOP_PAD = 60;
var PRE_PX = 400;
var POST_PX = 7600;
var BREAK_YR = 570;
var PRE_RANGE = BREAK_YR - (-4000);
var POST_RANGE = 2025 - BREAK_YR;

function yearToY(yr){
  if(yr <= BREAK_YR) return TOP_PAD + ((yr + 4000) / PRE_RANGE) * PRE_PX;
  return TOP_PAD + PRE_PX + ((yr - BREAK_YR) / POST_RANGE) * POST_PX;
}
function yToYear(y){
  var y2 = y - TOP_PAD;
  if(y2 <= PRE_PX) return (y2 / PRE_PX) * PRE_RANGE - 4000;
  return BREAK_YR + ((y2 - PRE_PX) / POST_PX) * POST_RANGE;
}
function fmtYr(y){ return y<=0 ? Math.abs(Math.round(y))+' BCE' : Math.round(y)+' CE'; }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

var SKIP_TRADITIONS = {'Islamic History':true};

var TYPE_COLORS = {
  'Prophet':'#c9a84c','Founder':'#b8860b','Sahaba':'#e74c3c','Sahabiyya':'#ff6b6b',
  "Tabi'un":'#e67e22','Scholar':'#3498db','Mystic':'#2ECC71','Ruler':'#9b59b6',
  'Poet':'#e91e90','Philosopher':'#1abc9c','Scientist':'#00bcd4','Historian':'#8d6e63',
  'Reformer':'#ff9800','Jurist':'#5c6bc0','Caliph':'#ab47bc','Warrior':'#ef5350'
};
var TRAD_COLORS = {
  'Hadith Sciences':'#4fc3f7','Early Ascetics':'#66bb6a',
  'Islamic Jurisprudence':'#7986cb','Islamic Philosophy':'#4db6ac','Islamic Sciences':'#4dd0e1',
  'Islamic Theology':'#9575cd','Islamic Literature':'#f06292','Persian Poetry':'#ce93d8',
  'Khorasan School':'#a1887f','Baghdad School':'#90a4ae','Naqshbandiyya':'#7e57c2',
  'Shadhiliyya':'#26a69a','Qadiriyya':'#42a5f5','Chishti':'#ffa726','Suhrawardiyya':'#d4e157',
  'Mawlawiyya':'#ec407a','Qalandari':'#8d6e63','Yeseviyya':'#78909c','Kubrawiyya':'#5c6bc0',
  'Badawiyya':'#c0ca33','Burhaniyya':'#29b6f6','Akbarian':'#ab47bc','Ishraqiyya':'#ffca28',
  'Mughal':'#ef6c00','Sindhi/Punjabi Sufism':'#00897b','Genealogy':'#c8a84a'
};

var ERA_BANDS = [
  {name:'Prophetic Era',     start:-4000, end:632,  dates:'Before 632 CE'},
  {name:'Rashidun',          start:632,   end:661,  dates:'632\u2013661 CE'},
  {name:'Umayyad',           start:661,   end:750,  dates:'661\u2013750 CE'},
  {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750\u20131258 CE'},
  {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258\u20131500 CE'},
  {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500\u20131800 CE'},
  {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800\u20131950 CE'},
  {name:'Contemporary',      start:1950,  end:2025, dates:'1950\u2013Present'}
];

var _inited = false;
var _scrollEl = null;
var _yearBadge = null;
var _selectedTag = null;
var _leafEls = [];
var _nameListEl = null;
var _leftPanel = null;
var _dropdown = null;

function initEras(){
  var ys = document.getElementById('yearSection');
  if(ys) ys.style.display = 'none';

  if(_inited) return;
  if(typeof PEOPLE==='undefined'||!PEOPLE.length) return;
  _inited = true;

  var root = document.getElementById('eras-view');
  if(!root) return;

  root.innerHTML =
    '<div class="eras-toolbar"><select class="eras-dropdown"><option value="">— Select a tag —</option></select></div>' +
    '<div class="eras-scroll">' +
      '<div class="eras-canvas">' +
        '<div class="eras-left-panel"><div class="eras-namelist"></div></div>' +
        '<div class="eras-right-panel"></div>' +
      '</div>' +
    '</div>' +
    '<div class="eras-year-badge"></div>';

  _scrollEl = root.querySelector('.eras-scroll');
  _yearBadge = root.querySelector('.eras-year-badge');
  _nameListEl = root.querySelector('.eras-namelist');
  _leftPanel = root.querySelector('.eras-left-panel');
  _dropdown = root.querySelector('.eras-dropdown');
  var rightPanel = root.querySelector('.eras-right-panel');
  var canvas = root.querySelector('.eras-canvas');

  // ── Stem line ──
  var stem = document.createElement('div');
  stem.className = 'eras-stem';
  rightPanel.appendChild(stem);

  // ── Adam marker ──
  var adamY = yearToY(-4000);
  var adamDot = document.createElement('div');
  adamDot.className = 'eras-stem-marker eras-sm-lg';
  adamDot.style.top = (adamY - 6.5) + 'px';
  rightPanel.appendChild(adamDot);
  var adamLabel = document.createElement('div');
  adamLabel.className = 'eras-perm-label eras-perm-prominent';
  adamLabel.style.top = (adamY + 16) + 'px';
  adamLabel.style.color = '#f0d060';
  adamLabel.textContent = 'Adam';
  _leftPanel.appendChild(adamLabel);
  var adamYrLabel = document.createElement('div');
  adamYrLabel.className = 'eras-stem-yr-label';
  adamYrLabel.style.top = (adamY - 6) + 'px';
  adamYrLabel.style.color = 'rgba(240,208,96,0.8)';
  adamYrLabel.textContent = '0';
  _leftPanel.appendChild(adamYrLabel);

  // ── Muhammad marker ──
  var muhY = yearToY(570);
  var muhDot = document.createElement('div');
  muhDot.className = 'eras-stem-marker eras-sm-lg';
  muhDot.style.top = (muhY - 6.5) + 'px';
  rightPanel.appendChild(muhDot);
  var muhLabel = document.createElement('div');
  muhLabel.className = 'eras-perm-label eras-perm-prominent';
  muhLabel.style.top = muhY + 'px';
  muhLabel.style.color = '#f0d060';
  muhLabel.textContent = 'Muhammad \uFDFA';
  _leftPanel.appendChild(muhLabel);
  var muhYrLabel = document.createElement('div');
  muhYrLabel.className = 'eras-stem-yr-label';
  muhYrLabel.style.top = (muhY - 6) + 'px';
  muhYrLabel.style.color = 'rgba(240,208,96,0.8)';
  muhYrLabel.textContent = '570 CE';
  _leftPanel.appendChild(muhYrLabel);

  // ── Era labels + boundary lines (RIGHT panel only, no background fills) ──
  ERA_BANDS.forEach(function(era){
    var y1 = yearToY(era.start);
    var y2 = yearToY(era.end);
    var midY = (y1 + y2) / 2;

    // Era name + dates label positioned in right panel
    var label = document.createElement('div');
    label.className = 'eras-era-band-text';
    label.style.top = midY + 'px';
    label.innerHTML =
      '<div class="eras-era-band-name">' + esc(era.name) + '</div>' +
      (era.dates ? '<div class="eras-era-band-dates">' + esc(era.dates) + '</div>' : '');
    rightPanel.appendChild(label);

    // Boundary line at top of era (right panel only)
    var line = document.createElement('div');
    line.className = 'eras-era-boundary';
    line.style.top = y1 + 'px';
    rightPanel.appendChild(line);
  });

  // ── Build leaf tags dynamically ──
  var typeCounts = {}, tradCounts = {};
  PEOPLE.forEach(function(p){
    if(p.type) typeCounts[p.type] = (typeCounts[p.type]||0) + 1;
    if(p.tradition) tradCounts[p.tradition] = (tradCounts[p.tradition]||0) + 1;
  });

  var allTags = [];
  Object.keys(typeCounts).sort().forEach(function(k){ allTags.push({key:k, field:'type'}); });
  Object.keys(tradCounts).sort().forEach(function(k){
    if(SKIP_TRADITIONS[k]) return;
    allTags.push({key:k, field:'tradition'});
  });

  var leafData = [];
  var maxCount = 0;
  allTags.forEach(function(tag){
    var people = PEOPLE.filter(function(p){ return p[tag.field] === tag.key; });
    if(!people.length) return;
    people.sort(function(a,b){ return a.dob - b.dob; });
    var firstDob = Infinity, lastDod = -Infinity;
    people.forEach(function(p){
      if(p.dob < firstDob) firstDob = p.dob;
      var d = (p.dod != null) ? p.dod : p.dob + 60;
      if(d > lastDod) lastDod = d;
    });
    if(people.length > maxCount) maxCount = people.length;
    var color = tag.field === 'type' ? (TYPE_COLORS[tag.key]||'#888') : (TRAD_COLORS[tag.key]||'#888');
    leafData.push({key:tag.key, field:tag.field, color:color, people:people, count:people.length, firstDob:firstDob, lastDod:lastDod});
  });

  // ── Populate dropdown ──
  var typeKeys = [], tradKeys = [];
  leafData.forEach(function(ld){
    if(ld.field === 'type') typeKeys.push(ld.key);
    else tradKeys.push(ld.key);
  });
  var typesGroup = document.createElement('optgroup');
  typesGroup.label = 'TYPES';
  typeKeys.sort().forEach(function(k){ var o = document.createElement('option'); o.value = k; o.textContent = k; typesGroup.appendChild(o); });
  _dropdown.appendChild(typesGroup);
  var tradsGroup = document.createElement('optgroup');
  tradsGroup.label = 'TRADITIONS';
  tradKeys.sort().forEach(function(k){ var o = document.createElement('option'); o.value = k; o.textContent = k; tradsGroup.appendChild(o); });
  _dropdown.appendChild(tradsGroup);

  _dropdown.addEventListener('change', function(){
    var val = _dropdown.value;
    if(!val){ _deselectAll(); return; }
    _selectTag(val, true);
  });

  // ── Build SVG ──
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'eras-svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', TOTAL_H);
  rightPanel.appendChild(svg);

  var rightW = rightPanel.offsetWidth || 600;
  var maxLeafW = rightW * 0.6;
  var MIN_LEAF_W = 30;
  _leafEls = [];
  var totalLeaves = leafData.length;

  leafData.forEach(function(ld, idx){
    var y1 = yearToY(ld.firstDob);
    var y2 = yearToY(ld.lastDod);
    if(y2 - y1 < 10) y2 = y1 + 10;
    var leafW = Math.max(MIN_LEAF_W, (ld.count / maxCount) * maxLeafW);
    var xOffset = 15 + (idx / totalLeaves) * (rightW * 0.30);
    var midY = (y1 + y2) / 2;
    var peakX = xOffset + leafW;
    var isType = ld.field === 'type';

    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'eras-leaf');
    g.dataset.tag = ld.key;

    var stemX = 1;
    var cp1y = y1 + (midY - y1) * 0.3;
    var cp2y = y1 + (midY - y1) * 0.7;
    var cp3y = midY + (y2 - midY) * 0.3;
    var cp4y = midY + (y2 - midY) * 0.7;
    var d = 'M ' + stemX + ' ' + y1.toFixed(1) +
            ' C ' + (stemX + leafW * 0.1).toFixed(1) + ' ' + cp1y.toFixed(1) +
            ', ' + peakX.toFixed(1) + ' ' + cp2y.toFixed(1) +
            ', ' + peakX.toFixed(1) + ' ' + midY.toFixed(1) +
            ' C ' + peakX.toFixed(1) + ' ' + cp3y.toFixed(1) +
            ', ' + (stemX + leafW * 0.1).toFixed(1) + ' ' + cp4y.toFixed(1) +
            ', ' + stemX + ' ' + y2.toFixed(1) + ' Z';

    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', ld.color);
    path.setAttribute('fill-opacity', '0.10');
    path.setAttribute('stroke', ld.color);
    path.setAttribute('stroke-opacity', '0.4');
    path.setAttribute('stroke-width', '1.5');
    if(isType) path.setAttribute('stroke-dasharray', '4,3');
    g.appendChild(path);

    var dot1 = document.createElementNS(NS, 'circle');
    dot1.setAttribute('cx', stemX); dot1.setAttribute('cy', y1);
    dot1.setAttribute('r', 2); dot1.setAttribute('fill', ld.color);
    dot1.style.pointerEvents = 'none';
    g.appendChild(dot1);
    var dot2 = document.createElementNS(NS, 'circle');
    dot2.setAttribute('cx', stemX); dot2.setAttribute('cy', y2);
    dot2.setAttribute('r', 2); dot2.setAttribute('fill', ld.color);
    dot2.style.pointerEvents = 'none';
    g.appendChild(dot2);
    svg.appendChild(g);

    // White label outside leaf
    var labelLeft = Math.max(peakX + 6, MIN_LEAF_W + xOffset + 6);
    var extLabel = document.createElement('div');
    extLabel.className = 'eras-leaf-ext-label';
    extLabel.style.top = midY + 'px';
    extLabel.style.left = labelLeft + 'px';
    extLabel.textContent = ld.key;
    extLabel.dataset.tag = ld.key;
    rightPanel.appendChild(extLabel);

    g.addEventListener('mouseenter', function(){
      if(_selectedTag) return;
      path.setAttribute('fill-opacity', '0.25');
      path.setAttribute('stroke-opacity', '0.8');
    });
    g.addEventListener('mouseleave', function(){
      if(_selectedTag) return;
      path.setAttribute('fill-opacity', '0.10');
      path.setAttribute('stroke-opacity', '0.4');
    });
    g.addEventListener('click', function(e){
      e.stopPropagation();
      _selectTag(ld.key, false);
    });

    _leafEls.push({key:ld.key, group:g, path:path, people:ld.people, color:ld.color, count:ld.count, extLabel:extLabel, midY:midY});
  });

  _scrollEl.addEventListener('click', function(e){
    if(!e.target.closest('.eras-leaf') && !e.target.closest('.eras-name-entry') && !e.target.closest('.eras-dropdown')){
      _deselectAll();
    }
  });

  _scrollEl.addEventListener('scroll', _onScroll);
  _onScroll();
  _scrollEl.scrollTop = Math.max(0, yearToY(500) - 200);

  console.log('[ERAS] Leaves created: ' + leafData.length);
}

function _onScroll(){
  if(!_scrollEl || !_yearBadge) return;
  _yearBadge.textContent = fmtYr(yToYear(_scrollEl.scrollTop + _scrollEl.clientHeight / 2));
}

function _selectTag(tagKey, fromDropdown){
  if(_selectedTag === tagKey && !fromDropdown){ _deselectAll(); return; }
  _selectedTag = tagKey;

  // Sync dropdown
  if(_dropdown && !fromDropdown) _dropdown.value = tagKey;

  _leafEls.forEach(function(le){
    if(le.key === tagKey){
      le.group.classList.remove('eras-leaf-faded');
      le.group.classList.add('eras-leaf-active');
      le.path.setAttribute('fill-opacity', '0.30');
      le.path.setAttribute('stroke-opacity', '1.0');
      le.extLabel.style.display = '';
    } else {
      le.group.classList.remove('eras-leaf-active');
      le.group.classList.add('eras-leaf-faded');
      le.path.setAttribute('fill-opacity', '0.03');
      le.path.setAttribute('stroke-opacity', '0.05');
      le.extLabel.style.display = 'none';
    }
  });

  var entry = _leafEls.find(function(le){ return le.key === tagKey; });
  if(entry){
    if(_nameListEl) _buildNameList(entry.people, entry.color);
    // Auto-scroll to center the leaf
    if(fromDropdown && _scrollEl){
      var targetY = entry.midY - _scrollEl.clientHeight / 2;
      _scrollEl.scrollTo({top: Math.max(0, targetY), behavior:'smooth'});
    }
  }
}

function _deselectAll(){
  _selectedTag = null;
  if(_dropdown) _dropdown.value = '';
  _leafEls.forEach(function(le){
    le.group.classList.remove('eras-leaf-faded');
    le.group.classList.remove('eras-leaf-active');
    le.path.setAttribute('fill-opacity', '0.10');
    le.path.setAttribute('stroke-opacity', '0.4');
    le.extLabel.style.display = '';
  });
  if(_nameListEl) _nameListEl.innerHTML = '';
}

function _buildNameList(people, color){
  if(!_nameListEl) return;
  _nameListEl.innerHTML = '';
  var sorted = people.slice().sort(function(a,b){ return a.dob - b.dob; });
  var ROW_H = 26;
  var lastBottom = -Infinity;
  sorted.forEach(function(p){
    var idealY = yearToY(p.dob);
    var y = Math.max(idealY, lastBottom + ROW_H);
    lastBottom = y;
    var el = document.createElement('div');
    el.className = 'eras-name-entry';
    el.style.top = y + 'px';
    el.innerHTML =
      '<span class="eras-name-dot" style="background:' + color + '"></span>' +
      '<span class="eras-name-text" style="color:#ffffff">' + esc(p.famous) + '</span>' +
      '<span class="eras-name-yr" style="color:rgba(255,255,255,0.6)">' + fmtYr(p.dob) + '</span>';
    el.addEventListener('click', function(e){
      e.stopPropagation();
      if(typeof jumpTo === 'function') jumpTo(p.famous);
    });
    _nameListEl.appendChild(el);
  });
}

var _origSetView = window.setView;
window.setView = function(v){
  _origSetView(v);
  var ys = document.getElementById('yearSection');
  if(ys) ys.style.display = (v === 'eras' || v === 'studyroom') ? 'none' : '';
};

window.initEras = initEras;
})();
