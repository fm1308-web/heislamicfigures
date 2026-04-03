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
function _erasDod(p){ return (p.dod != null && p.dod > 0) ? p.dod : p.dob + 70; }

var SKIP_TRADITIONS = {'Islamic History':true};

var TYPE_COLORS = {
  'Prophet':'#D4AF37','Founder':'#b8860b','Sahaba':'#e74c3c','Sahabiyya':'#ff6b6b',
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
  'Mughal':'#ef6c00','Sindhi/Punjabi Sufism':'#00897b','Genealogy':'#D4AF37'
};

var ERA_BANDS = [
  {name:'Prophetic Era',     start:-4000, end:632,  dates:'Before 632 CE',  glow:'210,170,50'},
  {name:'Rashidun',          start:632,   end:661,  dates:'632\u2013661 CE', glow:'60,160,90'},
  {name:'Umayyad',           start:661,   end:750,  dates:'661\u2013750 CE', glow:'50,180,180'},
  {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750\u20131258 CE',glow:'70,130,210'},
  {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258\u20131500 CE',glow:'180,60,60'},
  {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500\u20131800 CE',glow:'50,140,90'},
  {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800\u20131950 CE',glow:'200,150,60'},
  {name:'Contemporary',      start:1950,  end:2025, dates:'1950\u2013Present',glow:'80,160,200'}
];

var _inited = false;
var _scrollEl = null;
var _yearBadge = null;
var _selectedTag = null;
var _leafEls = [];
var _nameListEl = null;
var _leftPanel = null;
var _dropdown = null;
var _buildAllNames = null;

function initEras(){
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
  adamLabel.style.color = '#D4AF37';
  adamLabel.textContent = 'Adam';
  _leftPanel.appendChild(adamLabel);
  var adamYrLabel = document.createElement('div');
  adamYrLabel.className = 'eras-stem-yr-label';
  adamYrLabel.style.top = (adamY - 6) + 'px';
  adamYrLabel.style.color = 'rgba(212,175,55,.8)';
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
  muhLabel.style.color = '#D4AF37';
  muhLabel.textContent = 'Muhammad \uFDFA';
  _leftPanel.appendChild(muhLabel);
  var muhYrLabel = document.createElement('div');
  muhYrLabel.className = 'eras-stem-yr-label';
  muhYrLabel.style.top = (muhY - 6) + 'px';
  muhYrLabel.style.color = 'rgba(212,175,55,.8)';
  muhYrLabel.textContent = '570 CE';
  _leftPanel.appendChild(muhYrLabel);

  // ── Era labels + boundary lines + gradient shading (RIGHT panel only) ──
  var _eraBandEls = [];
  ERA_BANDS.forEach(function(era){
    var y1 = yearToY(era.start);
    var y2 = yearToY(era.end);

    // Gradient shading — subtle colored glow on the right edge
    if(era.glow){
      var gDiv = document.createElement('div');
      gDiv.className = 'eras-era-glow';
      gDiv.style.top = y1 + 'px';
      gDiv.style.height = (y2 - y1) + 'px';
      gDiv.style.background = 'linear-gradient(to left, rgba(' + era.glow + ',0.10) 0%, rgba(' + era.glow + ',0.04) 50%, transparent 85%)';
      rightPanel.appendChild(gDiv);
    }

    // Era name + dates label — top-aligned at era start
    var label = document.createElement('div');
    label.className = 'eras-era-band-text';
    label.style.top = (y1 + 12) + 'px';
    label.innerHTML =
      '<div class="eras-era-band-name">' + esc(era.name) + '</div>' +
      (era.dates ? '<div class="eras-era-band-dates">' + esc(era.dates) + '</div>' : '');
    rightPanel.appendChild(label);

    // Boundary line at top of era (right panel only)
    var line = document.createElement('div');
    line.className = 'eras-era-boundary';
    line.style.top = y1 + 'px';
    rightPanel.appendChild(line);

    _eraBandEls.push({start:era.start, end:era.end, label:label, line:line});
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
      var d = (p.dod != null && p.dod > 0) ? p.dod : p.dob + 70;
      if(d > lastDod) lastDod = d;
    });
    if(people.length > maxCount) maxCount = people.length;
    var color = tag.field === 'type' ? (TYPE_COLORS[tag.key]||'#A0AEC0') : (TRAD_COLORS[tag.key]||'#A0AEC0');
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

    // ClipPath for dynamic year clipping
    var clipId = 'eras-clip-' + idx;
    var clipEl = document.createElementNS(NS, 'clipPath');
    clipEl.setAttribute('id', clipId);
    var clipRect = document.createElementNS(NS, 'rect');
    clipRect.setAttribute('x', '-10');
    clipRect.setAttribute('y', '0');
    clipRect.setAttribute('width', (rightW + 20).toString());
    clipRect.setAttribute('height', TOTAL_H.toString());
    clipEl.appendChild(clipRect);
    svg.appendChild(clipEl);
    g.setAttribute('clip-path', 'url(#' + clipId + ')');

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
    path.setAttribute('fill', 'none');
    path.setAttribute('fill-opacity', '0');
    path.setAttribute('stroke', ld.color);
    path.setAttribute('stroke-opacity', '0.5');
    path.setAttribute('stroke-width', '2.5');
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
      path.setAttribute('fill-opacity', '0');
      path.setAttribute('stroke-opacity', '0.9');
    });
    g.addEventListener('mouseleave', function(){
      if(_selectedTag) return;
      path.setAttribute('fill-opacity', '0');
      path.setAttribute('stroke-opacity', '0.5');
    });
    g.addEventListener('click', function(e){
      e.stopPropagation();
      _selectTag(ld.key, false);
    });

    _leafEls.push({key:ld.key, group:g, path:path, people:ld.people, color:ld.color, count:ld.count, extLabel:extLabel, midY:midY, clipRect:clipRect, y1:y1});
  });

  _scrollEl.addEventListener('click', function(e){
    if(!e.target.closest('.eras-leaf') && !e.target.closest('.eras-name-entry') && !e.target.closest('.eras-dropdown')){
      _deselectAll();
    }
  });

  _scrollEl.addEventListener('scroll', _onScroll);
  _onScroll();
  _scrollEl.scrollTop = Math.max(0, yearToY(500) - 200);

  // ── Fixed horizontal marker line (on #eras-view, NOT inside scroll) ──
  var cursorOverlay = document.createElement('div');
  cursorOverlay.className = 'eras-cursor-overlay';
  cursorOverlay.innerHTML = '<div class="eras-cursor-line"></div><div class="eras-cursor-label"></div>';
  root.appendChild(cursorOverlay);
  var cursorLabel = cursorOverlay.querySelector('.eras-cursor-label');

  // ── Slider dot on the vertical stem (moves with scroll inside canvas) ──
  var sliderDot = document.createElement('div');
  sliderDot.className = 'eras-stem-marker eras-slider-dot';
  rightPanel.appendChild(sliderDot);

  _buildAllNames = function(yr){
    if(!_nameListEl) return;
    _nameListEl.innerHTML = '';
    var alive = PEOPLE.filter(function(p){
      return p.dob <= yr && _erasDod(p) >= yr;
    });
    // Sort by dob descending — most recently born at top (just below the line)
    var sorted = alive.sort(function(a,b){ return b.dob - a.dob; });
    var lineY = yearToY(yr);
    var ROW_H = 26;
    var nextY = lineY + 4; // start just below the fixed line position
    sorted.forEach(function(p){
      var el = document.createElement('div');
      el.className = 'eras-name-entry';
      el.style.top = nextY + 'px';
      el.style.color = TYPE_COLORS[p.type] || '#aaa';
      el.textContent = p.famous;
      el.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof jumpTo === 'function') jumpTo(p.famous);
      });
      _nameListEl.appendChild(el);
      nextY += ROW_H;
    });
  };

  function _filterLeafLabels(yr){
    if(!yr){
      // Show all labels, curves, and era bands; reset clips
      _leafEls.forEach(function(le){
        le.extLabel.style.display = '';
        le.group.style.display = '';
        le.clipRect.setAttribute('height', TOTAL_H.toString());
        le.clipRect.setAttribute('y', '0');
      });
      _eraBandEls.forEach(function(eb){
        eb.label.style.display = '';
        eb.line.style.display = '';
      });
      return;
    }
    // Filter leaf/tag labels and curves by alive figures
    _leafEls.forEach(function(le){
      var aliveMembers = le.people.filter(function(p){
        return p.dob <= yr && _erasDod(p) >= yr;
      });
      if(!aliveMembers.length){
        le.extLabel.style.display = 'none';
        le.group.style.display = 'none';
        return;
      }
      le.extLabel.style.display = '';
      le.group.style.display = '';
      // Clip curve: show from group start down to Y of last alive member's dod
      var maxDod = -Infinity;
      aliveMembers.forEach(function(p){ var d = _erasDod(p); if(d > maxDod) maxDod = d; });
      var clipBottom = yearToY(maxDod);
      le.clipRect.setAttribute('y', (le.y1 - 5).toString());
      le.clipRect.setAttribute('height', (clipBottom - le.y1 + 10).toString());
    });
    // Filter era band labels — visible only if slider year falls within the era
    _eraBandEls.forEach(function(eb){
      var visible = eb.start <= yr && eb.end >= yr;
      eb.label.style.display = visible ? '' : 'none';
      eb.line.style.display = visible ? '' : 'none';
    });
  }

  function syncErasToSlider(yr){
    if(yr == null){
      cursorOverlay.style.display = 'none';
      sliderDot.style.display = 'none';
      // Revert names to default (tag-selected or empty)
      if(!_selectedTag && _nameListEl) _nameListEl.innerHTML = '';
      _filterLeafLabels(null);
      return;
    }
    cursorOverlay.style.display = '';
    cursorLabel.textContent = yr + ' CE';
    // Position dot on stem at correct year
    var targetY = yearToY(yr);
    sliderDot.style.display = '';
    sliderDot.style.top = (targetY - 7) + 'px';
    // Show alive figures when slider is active (and no tag selected)
    if(!_selectedTag) _buildAllNames(yr);
    // Filter leaf/tag labels by alive figures
    _filterLeafLabels(yr);
    // Scroll chart so selected year aligns with fixed line (1/3 from top)
    var offset = _scrollEl.clientHeight / 3;
    _scrollEl.scrollTop = targetY - offset;
  }

  window._onSliderYear = function(yr){
    if(typeof VIEW!=='undefined' && VIEW==='eras') syncErasToSlider(yr);
  };

  // Init from current slider state
  syncErasToSlider(typeof activeYear !== 'undefined' ? activeYear : null);

  console.log('[ERAS] Leaves created: ' + leafData.length);
}

function _onScroll(){
  if(!_scrollEl || !_yearBadge) return;
  _yearBadge.textContent = fmtYr(yToYear(_scrollEl.scrollTop + _scrollEl.clientHeight / 2));
}

function _selectTag(tagKey, fromDropdown){
  if(_animRunning) _stopAnim();
  if(_selectedTag === tagKey && !fromDropdown){ _deselectAll(); return; }
  _selectedTag = tagKey;

  // Sync dropdown
  if(_dropdown && !fromDropdown) _dropdown.value = tagKey;

  _leafEls.forEach(function(le){
    if(le.key === tagKey){
      le.group.classList.remove('eras-leaf-faded');
      le.group.classList.add('eras-leaf-active');
      le.path.setAttribute('fill-opacity', '0');
      le.path.setAttribute('stroke-opacity', '1.0');
      le.extLabel.style.display = '';
    } else {
      le.group.classList.remove('eras-leaf-active');
      le.group.classList.add('eras-leaf-faded');
      le.path.setAttribute('fill-opacity', '0');
      le.path.setAttribute('stroke-opacity', '0.08');
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
    le.path.setAttribute('fill-opacity', '0');
    le.path.setAttribute('stroke-opacity', '0.5');
    le.extLabel.style.display = '';
  });
  if(_nameListEl) _nameListEl.innerHTML = '';
  // If slider is active, rebuild filtered names list
  if(typeof activeYear !== 'undefined' && activeYear != null && typeof _buildAllNames === 'function') _buildAllNames(activeYear);
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
      '<span class="eras-name-text" style="color:#FFFFFF">' + esc(p.famous) + '</span>' +
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
  // Stop any running animation when leaving a view
  if(_animRunning) _stopAnim();
  if(typeof _mapAnimStop === 'function') _mapAnimStop();
  _origSetView(v);
  var r3 = document.getElementById('hdrRow3');
  if(r3) r3.style.display = v === 'studyroom' ? 'none' : 'flex';
  var ab = document.getElementById('erasAnimateBtn');
  if(ab) ab.style.display = v === 'eras' ? '' : 'none';
  var as = document.getElementById('erasAnimSpeed');
  if(as) as.style.display = v === 'eras' ? '' : 'none';
};

// ── ERAS Animate ──
var _animTimer = null;
var _animRunning = false;
var ANIM_FROM = 500, ANIM_TO = 2000, ANIM_STEP = 10;

window.toggleErasAnimate = function(){
  if(_animRunning){ _stopAnim(); return; }
  var yr = (typeof activeYear !== 'undefined' && activeYear != null) ? activeYear : ANIM_FROM;
  if(yr >= ANIM_TO) yr = ANIM_FROM;
  _animRunning = true;
  var btn = document.getElementById('erasAnimateBtn');
  if(btn) btn.textContent = '\u275A\u275A PAUSE';
  _animNextStep(yr);
};

function _animNextStep(yr){
  if(!_animRunning) return;
  if(yr > ANIM_TO){ _stopAnim(); return; }
  if(typeof _setSliderYear === 'function') _setSliderYear(yr);
  var sel = document.getElementById('erasAnimSpeed');
  var ms = sel ? parseInt(sel.value) || 1000 : 1000;
  _animTimer = setTimeout(function(){ _animNextStep(yr + ANIM_STEP); }, ms);
}

function _stopAnim(){
  _animRunning = false;
  if(_animTimer){ clearTimeout(_animTimer); _animTimer = null; }
  var btn = document.getElementById('erasAnimateBtn');
  if(btn) btn.textContent = '\u25B6 ANIMATE';
}
window._erasAnimStop = _stopAnim;

window.initEras = initEras;
})();
