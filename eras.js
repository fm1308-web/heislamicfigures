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

var _origYearToY = function(yr){
  if(yr <= BREAK_YR) return TOP_PAD + ((yr + 4000) / PRE_RANGE) * PRE_PX;
  return TOP_PAD + PRE_PX + ((yr - BREAK_YR) / POST_RANGE) * POST_PX;
};
var _origYToYear = function(y){
  var y2 = y - TOP_PAD;
  if(y2 <= PRE_PX) return (y2 / PRE_PX) * PRE_RANGE - 4000;
  return BREAK_YR + ((y2 - PRE_PX) / POST_PX) * POST_RANGE;
};
var yearToY = _origYearToY;
var yToYear = _origYToYear;
function fmtYr(y){ return y<=0 ? Math.abs(Math.round(y))+' BCE' : Math.round(y)+' CE'; }
function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _erasDod(p){ return (p.dod != null && p.dod > 0) ? p.dod : p.dob + 70; }
function _erasWikiLink(p){
  if(!window._wikidata||!p.slug||!window._wikidata[p.slug]||!window._wikidata[p.slug].wikipedia||!window._wikidata[p.slug].wikipedia.en) return '';
  return '<a class="eras-wiki-link" href="https://en.wikipedia.org/wiki/'+encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))+'" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Open in Wikipedia">W</a>';
}

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
var _erasSelTypes = new Set();
var _erasSelTrads = new Set();
var _leafEls = [];
var _nameListEl = null;
var _leftPanel = null;
var _dropdown = null;
var _buildAllNames = null;
var _activeTotalH = TOTAL_H;
var _eraBandEls = [];
var _erasMarkers = [];
var _erasSvgEl = null;
var _erasCanvasEl = null;
var _erasRightPanel = null;

function initEras(){
  if(_inited) return;
  if(typeof PEOPLE==='undefined'||!PEOPLE.length) return;
  _inited = true;

  var root = document.getElementById('eras-view');
  if(!root) return;

  root.innerHTML =
    '<div class="eras-toolbar" id="eras-toolbar"></div>' +
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
  _dropdown = null; // replaced by multi-select panels
  var rightPanel = root.querySelector('.eras-right-panel');
  var canvas = root.querySelector('.eras-canvas');
  _erasRightPanel = rightPanel;
  _erasCanvasEl = canvas;

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
  adamYrLabel.style.color = '#6B7280';
  adamYrLabel.innerHTML = '0<span class="year-era">CE</span>';
  _leftPanel.appendChild(adamYrLabel);
  _erasMarkers.push({year:-4000, isAdam:true, dotEl:adamDot, labelEl:adamLabel, yrLabelEl:adamYrLabel});

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
  muhYrLabel.style.color = '#6B7280';
  muhYrLabel.innerHTML = '570<span class="year-era">CE</span>';
  _leftPanel.appendChild(muhYrLabel);
  _erasMarkers.push({year:570, isAdam:false, dotEl:muhDot, labelEl:muhLabel, yrLabelEl:muhYrLabel});

  // ── Era labels + boundary lines + gradient shading (RIGHT panel only) ──
  _eraBandEls = [];
  ERA_BANDS.forEach(function(era){
    var y1 = yearToY(era.start);
    var y2 = yearToY(era.end);

    // Gradient shading — subtle colored glow on the right edge
    var gDiv = null;
    if(era.glow){
      gDiv = document.createElement('div');
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

    _eraBandEls.push({start:era.start, end:era.end, label:label, line:line, glowEl:gDiv});
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

  // ── Populate multi-select filter panels ──
  var typeItems = [], tradItems = [];
  leafData.forEach(function(ld){
    var item = {name:ld.key, count:ld.count};
    if(ld.field === 'type') typeItems.push(item);
    else tradItems.push(item);
  });
  typeItems.sort(function(a,b){ return a.name.localeCompare(b.name); });
  tradItems.sort(function(a,b){ return a.name.localeCompare(b.name); });

  var toolbar = document.getElementById('eras-toolbar');
  if(toolbar) _erasBuildToolbar(toolbar, typeItems, tradItems);

  // ── Build SVG ──
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'eras-svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', TOTAL_H);
  rightPanel.appendChild(svg);
  _erasSvgEl = svg;

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

    _leafEls.push({key:ld.key, field:ld.field, group:g, path:path, people:ld.people, color:ld.color, count:ld.count, extLabel:extLabel, midY:midY, clipRect:clipRect, y1:y1, firstDob:ld.firstDob, lastDod:ld.lastDod, leafW:leafW, peakX:peakX, dot1:dot1, dot2:dot2});
  });

  _scrollEl.addEventListener('click', function(e){
    if(!e.target.closest('.eras-leaf') && !e.target.closest('.eras-name-entry') && !e.target.closest('.eras-dropdown') && !e.target.closest('.bv-dd-wrap') && !e.target.closest('.bv-clear-all')){
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
      el.innerHTML = esc(p.famous) + _erasWikiLink(p);
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
        le.clipRect.setAttribute('height', _activeTotalH.toString());
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
  if(_erasAnimMode !== 'stopped') _erasAnimStopFull();
  // Legacy single-click on a leaf: toggle that one tag
  if(!fromDropdown){
    if(_selectedTag === tagKey){ _deselectAll(); return; }
    _erasSelTypes.clear(); _erasSelTrads.clear();
    var le = _leafEls.find(function(l){ return l.key === tagKey; });
    if(le){
      if(le.field === 'type') _erasSelTypes.add(tagKey);
      else _erasSelTrads.add(tagKey);
    }
  }
  _selectedTag = tagKey;
  _erasApplyFilter();
  _erasSyncBtnLabels();
  _erasRebuildPanels();
}

function _erasRelayout(){
  // Resize SVG and canvas
  if(_erasSvgEl) _erasSvgEl.setAttribute('height', _activeTotalH);
  if(_erasCanvasEl) _erasCanvasEl.style.minHeight = _activeTotalH + 'px';

  // Reposition era bands — hide if fully outside compressed canvas
  _eraBandEls.forEach(function(eb){
    var y1 = yearToY(eb.start);
    var y2 = yearToY(eb.end);
    var bandFullyOutside = (y2 < 0) || (y1 > _activeTotalH);
    if(bandFullyOutside){
      if(eb.glowEl) eb.glowEl.style.display = 'none';
      eb.label.style.display = 'none';
      eb.line.style.display = 'none';
      return;
    }
    var cy1 = Math.max(0, y1);
    var cy2 = Math.min(_activeTotalH, y2);
    if(eb.glowEl){
      eb.glowEl.style.display = '';
      eb.glowEl.style.top = cy1 + 'px';
      eb.glowEl.style.height = (cy2 - cy1) + 'px';
    }
    eb.label.style.display = '';
    eb.label.style.top = (cy1 + 12) + 'px';
    eb.line.style.display = '';
    eb.line.style.top = cy1 + 'px';
  });

  // Reposition markers (Adam, Muhammad) — hide if outside compressed canvas
  _erasMarkers.forEach(function(m){
    var y = yearToY(m.year);
    var outside = (y < 0) || (y > _activeTotalH);
    if(outside){
      m.dotEl.style.display = 'none';
      m.labelEl.style.display = 'none';
      m.yrLabelEl.style.display = 'none';
      return;
    }
    m.dotEl.style.display = '';
    m.labelEl.style.display = '';
    m.yrLabelEl.style.display = '';
    m.dotEl.style.top = (y - 6.5) + 'px';
    m.labelEl.style.top = (m.isAdam ? y + 16 : y) + 'px';
    m.yrLabelEl.style.top = (y - 6) + 'px';
  });

  // Reposition leaf SVG paths, dots, labels
  _leafEls.forEach(function(le){
    var y1 = yearToY(le.firstDob);
    var y2 = yearToY(le.lastDod);
    if(y2 - y1 < 10) y2 = y1 + 10;
    var midY = (y1 + y2) / 2;
    var stemX = 1;
    var cp1y = y1 + (midY - y1) * 0.3;
    var cp2y = y1 + (midY - y1) * 0.7;
    var cp3y = midY + (y2 - midY) * 0.3;
    var cp4y = midY + (y2 - midY) * 0.7;
    var d = 'M ' + stemX + ' ' + y1.toFixed(1) +
            ' C ' + (stemX + le.leafW * 0.1).toFixed(1) + ' ' + cp1y.toFixed(1) +
            ', ' + le.peakX.toFixed(1) + ' ' + cp2y.toFixed(1) +
            ', ' + le.peakX.toFixed(1) + ' ' + midY.toFixed(1) +
            ' C ' + le.peakX.toFixed(1) + ' ' + cp3y.toFixed(1) +
            ', ' + (stemX + le.leafW * 0.1).toFixed(1) + ' ' + cp4y.toFixed(1) +
            ', ' + stemX + ' ' + y2.toFixed(1) + ' Z';
    le.path.setAttribute('d', d);
    le.dot1.setAttribute('cy', y1);
    le.dot2.setAttribute('cy', y2);
    le.extLabel.style.top = midY + 'px';
    le.y1 = y1;
    le.midY = midY;
    le.clipRect.setAttribute('y', '0');
    le.clipRect.setAttribute('height', _activeTotalH.toString());
  });
}

function _erasApplyFilter(){
  var hasType = _erasSelTypes.size > 0;
  var hasTrad = _erasSelTrads.size > 0;
  var hasAny = hasType || hasTrad;

  _leafEls.forEach(function(le){
    var visible;
    if(!hasAny){
      visible = true;
    } else {
      visible = (le.field === 'type' && _erasSelTypes.has(le.key)) ||
                (le.field === 'tradition' && _erasSelTrads.has(le.key));
    }
    if(visible){
      le.group.classList.remove('eras-leaf-faded');
      le.group.classList.add('eras-leaf-active');
      le.path.setAttribute('fill-opacity', '0');
      le.path.setAttribute('stroke-opacity', hasAny ? '1.0' : '0.5');
      le.extLabel.style.display = '';
    } else {
      le.group.classList.remove('eras-leaf-active');
      le.group.classList.add('eras-leaf-faded');
      le.path.setAttribute('fill-opacity', '0');
      le.path.setAttribute('stroke-opacity', '0.08');
      le.extLabel.style.display = 'none';
    }
  });

  // Canvas compression — shrink to filtered year range
  if(hasAny){
    var filteredPeople = [];
    _leafEls.forEach(function(le){
      var vis = (le.field === 'type' && _erasSelTypes.has(le.key)) ||
                (le.field === 'tradition' && _erasSelTrads.has(le.key));
      if(vis) filteredPeople = filteredPeople.concat(le.people);
    });
    if(filteredPeople.length){
      var minYr = Infinity, maxYr = -Infinity;
      filteredPeople.forEach(function(p){
        if(p.dob < minYr) minYr = p.dob;
        var d = _erasDod(p);
        if(d > maxYr) maxYr = d;
      });
      var pad = Math.max(50, (maxYr - minYr) * 0.1);
      minYr -= pad; maxYr += pad;
      var span = maxYr - minYr;
      var targetH = Math.max(600, Math.min(1100, (window.innerHeight || 900) - 220));
      var newH = targetH;
      var usable = newH - TOP_PAD - 80;
      yearToY = function(yr){ return TOP_PAD + ((yr - minYr) / span) * usable; };
      yToYear = function(y){ return minYr + ((y - TOP_PAD) / usable) * span; };
      _activeTotalH = newH;
      _erasRelayout();
    }
  } else {
    yearToY = _origYearToY;
    yToYear = _origYToYear;
    _activeTotalH = TOTAL_H;
    _erasRelayout();
  }

  // Build name list from all matching leaves (AFTER compression so yearToY is final)
  if(_nameListEl){
    if(!hasAny){
      _nameListEl.innerHTML = '';
      if(typeof activeYear !== 'undefined' && activeYear != null && typeof _buildAllNames === 'function') _buildAllNames(activeYear);
    } else {
      var allPeople = [], color = '#D4AF37';
      _leafEls.forEach(function(le){
        var visible = (le.field === 'type' && _erasSelTypes.has(le.key)) ||
                      (le.field === 'tradition' && _erasSelTrads.has(le.key));
        if(visible){
          allPeople = allPeople.concat(le.people);
          color = le.color;
        }
      });
      // Deduplicate by slug
      var seen = {};
      allPeople = allPeople.filter(function(p){ if(seen[p.slug]) return false; seen[p.slug]=true; return true; });
      _buildNameList(allPeople, color);
    }
  }

  _erasSyncClearBtn();
}

function _deselectAll(){
  _selectedTag = null;
  _erasSelTypes.clear();
  _erasSelTrads.clear();
  _erasApplyFilter();
  _erasSyncBtnLabels();
  _erasRebuildPanels();
}

// ── Multi-select toolbar builder ──
var _erasTypeItems = [];
var _erasTradItems = [];

function _erasBuildToolbar(toolbar, typeItems, tradItems){
  _erasTypeItems = typeItems;
  _erasTradItems = tradItems;
  var h = '';
  h += '<div class="bv-dd-wrap"><button class="bv-dd-btn" id="eras-type-btn">\u2014 SELECT A TYPE \u2014  <span style="opacity:.6">\u25BE</span></button>';
  h += '<div class="bv-dd-panel" id="eras-type-panel"><input class="bv-dd-search" id="eras-type-search" placeholder="search types\u2026"><div class="bv-dd-scroll" id="eras-type-scroll"></div></div></div>';
  h += '<div class="bv-dd-wrap"><button class="bv-dd-btn" id="eras-trad-btn">\u2014 SELECT A TRADITION \u2014  <span style="opacity:.6">\u25BE</span></button>';
  h += '<div class="bv-dd-panel" id="eras-trad-panel"><input class="bv-dd-search" id="eras-trad-search" placeholder="search traditions\u2026"><div class="bv-dd-scroll" id="eras-trad-scroll"></div></div></div>';
  h += '<button class="bv-clear-all" id="eras-clear-all" title="Clear all filters" style="opacity:.4">\u00D7</button>';
  h += '<div id="eras-anim-mount" style="margin-left:auto;display:flex;align-items:center"></div>';
  toolbar.innerHTML = h + toolbar.innerHTML;

  // Mount AnimControls pill
  var erasMount = document.getElementById('eras-anim-mount');
  if(erasMount && window.AnimControls){
    _erasAnimCtl = window.AnimControls.create({
      mountEl: erasMount,
      idPrefix: 'eras',
      initialSpeed: '1x',
      onPlay: _erasAnimPlay,
      onPause: _erasAnimPause,
      onStop: _erasAnimStopFull,
      onSpeedChange: function(ms){ _erasAnimSpeedMs = ms; }
    });
  }

  _erasRebuildPanels();

  // Wire dropdown open/close
  var pairs = [
    {btn:'eras-type-btn',panel:'eras-type-panel',search:'eras-type-search'},
    {btn:'eras-trad-btn',panel:'eras-trad-panel',search:'eras-trad-search'}
  ];
  pairs.forEach(function(dd){
    var btn = document.getElementById(dd.btn);
    var panel = document.getElementById(dd.panel);
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      pairs.forEach(function(o){ if(o.panel !== dd.panel) document.getElementById(o.panel).classList.remove('open'); });
      panel.classList.toggle('open');
      if(panel.classList.contains('open')){
        var si = document.getElementById(dd.search);
        if(si) si.focus();
      }
    });
    document.getElementById(dd.search).addEventListener('input', function(){ _erasRebuildPanels(); });
  });
  document.addEventListener('click', function(e){
    pairs.forEach(function(dd){
      var panel = document.getElementById(dd.panel);
      var btn = document.getElementById(dd.btn);
      if(panel && !panel.contains(e.target) && e.target !== btn && !btn.contains(e.target)) panel.classList.remove('open');
    });
  });
  document.getElementById('eras-clear-all').addEventListener('click', function(e){
    e.stopPropagation();
    _deselectAll();
  });
}

function _erasRebuildPanels(){
  _erasBuildCheckPanel('eras-type-scroll','eras-type-search',_erasSelTypes,_erasTypeItems,function(){
    _erasSyncBtnLabels();
    _erasApplyFilter();
    _erasRebuildPanels();
  });
  _erasBuildCheckPanel('eras-trad-scroll','eras-trad-search',_erasSelTrads,_erasTradItems,function(){
    _erasSyncBtnLabels();
    _erasApplyFilter();
    _erasRebuildPanels();
  });
  _erasSyncBtnLabels();
}

function _erasBuildCheckPanel(scrollId, searchId, filterSet, items, onchange){
  var scroll = document.getElementById(scrollId);
  if(!scroll) return;
  var si = document.getElementById(searchId);
  var q = (si && si.value || '').toLowerCase().trim();
  var n = filterSet.size;
  var toggleLabel = n > 0 ? 'Deselect all' : 'Select all';
  var html = '<div style="display:flex;justify-content:flex-end;padding:2px 14px 4px"><span class="eras-dd-toggle-all" style="font-family:\'Cinzel\',serif;font-size:10px;color:var(--gold,#D4AF37);cursor:pointer;letter-spacing:.06em">'+toggleLabel+'</span></div>';
  var filtered = items.filter(function(t){ return !q || t.name.toLowerCase().indexOf(q) > -1; });
  filtered.forEach(function(t){
    var on = filterSet.has(t.name);
    html += '<div class="bv-ck-row'+(on?' checked':'')+'" data-val="'+t.name+'"><span class="bv-ck'+(on?' on':'')+'"></span><span class="bv-ck-label">'+t.name+'</span><span class="bv-ck-count">('+t.count+')</span></div>';
  });
  scroll.innerHTML = html;
  scroll.querySelectorAll('.bv-ck-row').forEach(function(el){
    el.addEventListener('click', function(){
      var v = this.getAttribute('data-val');
      if(filterSet.has(v)) filterSet.delete(v); else filterSet.add(v);
      onchange();
    });
  });
  scroll.querySelectorAll('.eras-dd-toggle-all').forEach(function(el){
    el.addEventListener('click', function(){
      if(filterSet.size > 0) filterSet.clear();
      else items.forEach(function(t){ filterSet.add(t.name); });
      onchange();
    });
  });
}

function _erasSyncBtnLabels(){
  _erasSyncOneBtn('eras-type-btn', _erasSelTypes, '\u2014 SELECT A TYPE \u2014', 'types');
  _erasSyncOneBtn('eras-trad-btn', _erasSelTrads, '\u2014 SELECT A TRADITION \u2014', 'traditions');
}

function _erasSyncOneBtn(btnId, filterSet, defaultLabel, noun){
  var btn = document.getElementById(btnId);
  if(!btn) return;
  var n = filterSet.size;
  var txt = defaultLabel;
  if(n === 1) txt = [...filterSet][0];
  else if(n > 1) txt = n + ' ' + noun + ' selected';
  btn.innerHTML = txt + '  <span style="opacity:.6">\u25BE</span>';
}

function _erasSyncClearBtn(){
  var btn = document.getElementById('eras-clear-all');
  if(!btn) return;
  var active = _erasSelTypes.size > 0 || _erasSelTrads.size > 0;
  btn.style.opacity = active ? '1' : '.4';
  btn.style.borderColor = active ? 'var(--gold,#D4AF37)' : 'var(--border2,#2D3748)';
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
      '<span class="eras-name-text" style="color:#FFFFFF">' + esc(p.famous) + _erasWikiLink(p) + '</span>' +
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
  _erasAnimStopFull();
  if(typeof _mapAnimStop === 'function') _mapAnimStop();
  _origSetView(v);
  var r3 = document.getElementById('hdrRow3');
  if(r3) r3.style.display = v === 'studyroom' ? 'none' : 'flex';
  // Hide old hdrRow3 anim elements (now replaced by pill in eras-toolbar)
  var ab = document.getElementById('erasAnimateBtn');
  if(ab) ab.style.display = 'none';
  var as = document.getElementById('erasAnimSpeed');
  if(as) as.style.display = 'none';
};

// ── ERAS Animate — curfew-based (global standard) ──
var _erasAnimTimer = null;
var _erasAnimMode = 'stopped';
var _erasAnimSpeedMs = 1200;
var _erasAnimCtl = null;
var _erasCurfewY = 0;

function _erasAnimPlay(){
  var rp = _erasRightPanel;
  if(!rp) return;

  // Ensure curfew line exists
  var cursor = document.getElementById('eras-curfew');
  if(!cursor){
    cursor = document.createElement('div');
    cursor.id = 'eras-curfew';
    cursor.className = 'eras-curfew-line';
    cursor.innerHTML = '<span id="eras-curfew-year" class="eras-curfew-year"></span>';
    cursor.style.display = 'none';
    rp.appendChild(cursor);
  }

  if(_erasAnimMode === 'paused'){
    _erasAnimMode = 'playing';
    cursor.style.display = '';
    _erasAnimTimer = setInterval(_erasAnimTick, _erasAnimSpeedMs);
    return;
  }

  // Fresh start — hide everything except .eras-stem
  _erasAnimMode = 'playing';
  _erasCurfewY = TOP_PAD;
  _erasAnimSpeedMs = _erasAnimCtl ? _erasAnimCtl.getSpeedMs() : 1200;

  // Hide HTML elements in right panel (bands, labels, markers, leaf labels)
  rp.querySelectorAll('.eras-era-glow,.eras-era-band-text,.eras-era-boundary,.eras-stem-marker,.eras-leaf-ext-label,.eras-slider-dot').forEach(function(el){
    el.classList.add('eras-hidden-by-curfew');
  });
  // Hide HTML elements in left panel (name labels, year labels)
  if(_leftPanel) _leftPanel.querySelectorAll('.eras-perm-label,.eras-stem-yr-label').forEach(function(el){
    el.classList.add('eras-hidden-by-curfew');
  });
  // Hide name list entries
  if(_nameListEl) _nameListEl.querySelectorAll('.eras-name-entry').forEach(function(el){
    el.classList.add('eras-hidden-by-curfew');
  });
  // Hide SVG leaf groups
  if(_erasSvgEl){
    _erasSvgEl.querySelectorAll('.eras-leaf').forEach(function(g){
      g.setAttribute('opacity','0');
    });
  }

  cursor.style.display = '';
  cursor.style.top = _erasCurfewY + 'px';

  // Scroll to top
  if(_scrollEl) _scrollEl.scrollTop = Math.max(0, _erasCurfewY - 200);

  _erasAnimTimer = setInterval(_erasAnimTick, _erasAnimSpeedMs);
}

function _erasAnimTick(){
  if(_erasAnimMode !== 'playing') return;
  var rp = _erasRightPanel;
  if(!rp) return;
  _erasCurfewY += 6;
  if(_erasCurfewY > TOTAL_H){ _erasAnimStopFull(); return; }
  var cursor = document.getElementById('eras-curfew');
  if(cursor) cursor.style.top = _erasCurfewY + 'px';

  // Reveal HTML elements by their top
  rp.querySelectorAll('.eras-hidden-by-curfew').forEach(function(el){
    var t = parseFloat(el.style.top);
    if(!isNaN(t) && t <= _erasCurfewY) el.classList.remove('eras-hidden-by-curfew');
  });
  // Reveal left panel elements
  if(_leftPanel) _leftPanel.querySelectorAll('.eras-hidden-by-curfew').forEach(function(el){
    var t = parseFloat(el.style.top);
    if(!isNaN(t) && t <= _erasCurfewY) el.classList.remove('eras-hidden-by-curfew');
  });
  // Reveal name list entries
  if(_nameListEl) _nameListEl.querySelectorAll('.eras-hidden-by-curfew').forEach(function(el){
    var t = parseFloat(el.style.top);
    if(!isNaN(t) && t <= _erasCurfewY) el.classList.remove('eras-hidden-by-curfew');
  });
  // Reveal SVG leaf groups by their bottom Y
  if(_erasSvgEl){
    _erasSvgEl.querySelectorAll('.eras-leaf[opacity="0"]').forEach(function(g){
      try{
        var bb = g.getBBox();
        var bottomY = bb.y + bb.height;
        if(bottomY <= _erasCurfewY) g.removeAttribute('opacity');
      }catch(e){}
    });
  }

  // Year label on curfew line
  var yr = yToYear(_erasCurfewY);
  var yrEl = document.getElementById('eras-curfew-year');
  if(yrEl){
    var rounded = Math.round(yr);
    yrEl.innerHTML = rounded <= 0
      ? Math.abs(rounded) + '<span class="year-era">BCE</span>'
      : rounded + '<span class="year-era">CE</span>';
  }

  // Scroll to follow curfew
  if(_scrollEl) _scrollEl.scrollTop = Math.max(0, _erasCurfewY - _scrollEl.clientHeight / 2);
}

function _erasAnimPause(){
  _erasAnimMode = 'paused';
  if(_erasAnimTimer){ clearInterval(_erasAnimTimer); _erasAnimTimer = null; }
}

function _erasAnimStopFull(){
  _erasAnimMode = 'stopped';
  if(_erasAnimTimer){ clearInterval(_erasAnimTimer); _erasAnimTimer = null; }
  if(_erasAnimCtl) _erasAnimCtl.forceStop();

  // Reveal all HTML elements
  var rp = _erasRightPanel;
  if(rp) rp.querySelectorAll('.eras-hidden-by-curfew').forEach(function(el){ el.classList.remove('eras-hidden-by-curfew'); });
  if(_leftPanel) _leftPanel.querySelectorAll('.eras-hidden-by-curfew').forEach(function(el){ el.classList.remove('eras-hidden-by-curfew'); });
  if(_nameListEl) _nameListEl.querySelectorAll('.eras-hidden-by-curfew').forEach(function(el){ el.classList.remove('eras-hidden-by-curfew'); });
  // Reveal all SVG leaves
  if(_erasSvgEl) _erasSvgEl.querySelectorAll('.eras-leaf[opacity="0"]').forEach(function(g){ g.removeAttribute('opacity'); });
  // Hide curfew line
  var cursor = document.getElementById('eras-curfew');
  if(cursor) cursor.style.display = 'none';
}

window._erasAnimStop = _erasAnimStopFull;
window.toggleErasAnimate = function(){}; // stub for old onclick in index.html

window.initEras = initEras;

window._captureState_eras=function(){
  var scroll=document.querySelector('.eras-scroll');
  return{types:Array.from(_erasSelTypes),trads:Array.from(_erasSelTrads),scrollY:scroll?scroll.scrollTop:0};
};
window._restoreState_eras=function(s){
  if(!s) return;
  _erasSelTypes=new Set(s.types||[]);_erasSelTrads=new Set(s.trads||[]);
  _erasApplyFilter();_erasSyncBtnLabels();_erasRebuildPanels();
  if(s.scrollY){var scroll=document.querySelector('.eras-scroll');if(scroll) scroll.scrollTop=s.scrollY;}
};

})();
