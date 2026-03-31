// ═══════════════════════════════════════════════════════════
// EVENTS VIEW — Historical events timeline (4-column grid)
// Uses #hdrRow3 in the fixed top bar for century pills + animate
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _inited = false;
var _animRunning = false;
var _animTimer = null;
var _animIdx = 0;
var _activeCentury = 0;
var _hdrRow3Original = null;

var CAT_COLORS = {
  'Politics':'#4a90d9','War':'#e74c3c','Theology':'#d4a84a',
  'Science':'#2db5a0','Trade':'#2ecc71','Art':'#9b59b6',
  'Sufism':'#e67e22'
};

var ERA_BANDS = [
  {name:'Prophetic Era',     start:-4000, end:632},
  {name:'Rashidun',          start:632,   end:661},
  {name:'Umayyad',           start:661,   end:750},
  {name:'Abbasid Golden Age',start:750,   end:1258},
  {name:'Post-Mongol',       start:1258,  end:1500},
  {name:'Gunpowder Empires', start:1500,  end:1800},
  {name:'Colonial & Reform', start:1800,  end:1950},
  {name:'Contemporary',      start:1950,  end:2025}
];

var CENTURIES = [
  {label:'6th',  start:500, end:600},
  {label:'7th',  start:600, end:700},
  {label:'8th',  start:700, end:800},
  {label:'9th',  start:800, end:900},
  {label:'10th', start:900, end:1000},
  {label:'11th', start:1000,end:1100},
  {label:'12th', start:1100,end:1200},
  {label:'13th', start:1200,end:1300},
  {label:'14th', start:1300,end:1400},
  {label:'15th', start:1400,end:1500},
  {label:'16th', start:1500,end:1600},
  {label:'17th', start:1600,end:1700},
  {label:'18th', start:1700,end:1800},
  {label:'19th', start:1800,end:1900},
  {label:'20th', start:1900,end:2000},
  {label:'21st', start:2000,end:2100}
];

var SPEED_OPTIONS = [
  {label:'Fast',      ms:800},
  {label:'Normal',    ms:2000},
  {label:'Slow',      ms:4000},
  {label:'Cinematic', ms:8000}
];

function getEraForYear(yr){
  for(var i=0;i<ERA_BANDS.length;i++){
    if(yr>=ERA_BANDS[i].start && yr<ERA_BANDS[i].end) return ERA_BANDS[i].name;
  }
  return '';
}

function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escAttr(s){ return esc(s).replace(/'/g,'&#39;').replace(/"/g,'&quot;'); }

// Extract figure name — handles both string and {name,role} object
function figName(fig){ return typeof fig === 'string' ? fig : (fig && fig.name ? fig.name : ''); }
function figRole(fig){ return (typeof fig === 'object' && fig && fig.role) ? fig.role : ''; }

// ── Repurpose hdrRow3 when entering/leaving events view ──
var _origSetView = window.setView;
window.setView = function(v){
  var r3 = document.getElementById('hdrRow3');
  if(window.VIEW === 'events' && v !== 'events' && r3 && _hdrRow3Original !== null){
    r3.innerHTML = _hdrRow3Original;
    _hdrRow3Original = null;
    _evStopAnimate();
  }
  _origSetView(v);
  if(v === 'events' && r3){
    if(_hdrRow3Original === null) _hdrRow3Original = r3.innerHTML;
    r3.innerHTML = _buildEventsHeaderHTML();
    r3.style.display = 'flex';
  }
  if(r3 && v === 'studyroom') r3.style.display = 'none';
};

function _buildEventsHeaderHTML(){
  var data = window.eventsData || [];
  var available = _availableCenturies(data);
  var html = '';
  html += '<select class="ev-speed-select" id="evSpeedSelect" style="margin-left:auto">';
  SPEED_OPTIONS.forEach(function(opt){
    var sel = opt.label === 'Normal' ? ' selected' : '';
    html += '<option value="' + opt.ms + '"' + sel + '>' + opt.label + ' (' + (opt.ms/1000) + 's)</option>';
  });
  html += '</select>';
  html += '<button class="ev-animate-btn" id="evAnimateBtn" onclick="window._evToggleAnimate()">\u25B6 ANIMATE</button>';
  return html;
}

function _availableCenturies(data){
  var has = {};
  data.forEach(function(ev){ has[Math.floor(ev.year / 100)] = true; });
  var avail = [];
  CENTURIES.forEach(function(c, i){
    if(has[Math.floor(c.start / 100)]) avail.push(i);
  });
  return avail;
}

function initEvents(){
  var container = document.getElementById('events-view');
  if(!container) return;
  var data = window.eventsData;
  if(!data || !data.length){
    container.innerHTML='<div style="padding:40px;color:var(--muted)">No events data loaded.</div>';
    return;
  }
  if(_inited) return;
  _inited = true;
  var available = _availableCenturies(data);
  _activeCentury = available.length ? available[0] : 0;
  container.innerHTML = '<div class="ev-scroll" id="evScroll"></div>';
  _renderCentury(data, _activeCentury);
}

// ── Build a single event row (4-column grid) ──
function _buildEventRow(ev, showYear, yearSpanCount){
  var catColor = CAT_COLORS[ev.category] || '#888';
  var h = '<div class="ev-row" data-year="'+ev.year+'">';

  // COL 1 — Year
  if(showYear){
    var era = getEraForYear(ev.year);
    h += '<div class="ev-col-year"' + (yearSpanCount > 1 ? ' style="grid-row:span '+yearSpanCount+'"' : '') + '>';
    h += '<div class="ev-yr-num">'+ev.year+'</div>';
    if(era) h += '<div class="ev-yr-era">'+esc(era)+'</div>';
    h += '</div>';
  }

  // COL 2 — Category
  h += '<div class="ev-col-cat"><span class="ev-cat-pill" style="background:'+catColor+'">'+esc(ev.category)+'</span></div>';

  // COL 3 — The Story
  h += '<div class="ev-col-story"><div class="ev-card">';
  h += '<div class="ev-card-title">'+esc(ev.title)+'</div>';
  if(ev.description) h += '<div class="ev-card-desc">'+esc(ev.description)+'</div>';

  // Quran reference
  if(ev.quranRef) h += '<div class="ev-quran-ref">'+esc(ev.quranRef)+'</div>';

  // Outcome
  if(ev.outcome) h += '<div class="ev-outcome">'+esc(ev.outcome)+'</div>';

  // Figures with roles
  var figs = ev.figures || [];
  if(figs.length){
    h += '<div class="ev-card-figures">';
    figs.forEach(function(fig){
      var name = figName(fig);
      var role = figRole(fig);
      if(!name) return;
      h += '<div class="ev-fig-wrap">';
      h += '<span class="ev-fig-chip" onclick="if(typeof jumpTo===\'function\')jumpTo(\''+escAttr(name)+'\')">'+esc(name)+'</span>';
      if(role) h += '<span class="ev-fig-role">'+esc(role)+'</span>';
      h += '</div>';
    });
    h += '</div>';
  }

  // Sources
  var sources = ev.sources || [];
  if(sources.length){
    h += '<div class="ev-sources">'+sources.map(function(s){ return esc(s); }).join(' \u00b7 ')+'</div>';
  }

  // Tags
  var tags = ev.tags || [];
  if(tags.length){
    h += '<div class="ev-tags">';
    tags.forEach(function(t){ h += '<span class="ev-tag">'+esc(t)+'</span>'; });
    h += '</div>';
  }

  h += '</div></div>'; // /ev-card /ev-col-story

  // COL 4 — The Visual (map placeholder)
  h += '<div class="ev-col-visual">';
  var loc = ev.location;
  if(loc && loc.lat && loc.lng){
    var tileUrl = 'https://tile.openstreetmap.org/5/'
      + _lonToTileX(loc.lng, 5) + '/' + _latToTileY(loc.lat, 5) + '.png';
    h += '<div class="ev-map-thumb">';
    h += '<img class="ev-map-img" src="'+tileUrl+'" alt="'+escAttr(loc.place || '')+'" loading="lazy">';
    h += '<div class="ev-map-pin">\u25C9</div>';
    h += '</div>';
    if(loc.place) h += '<div class="ev-map-place">'+esc(loc.place)+'</div>';
    if(loc.modern && loc.modern !== loc.place) h += '<div class="ev-map-modern">'+esc(loc.modern)+'</div>';
  } else {
    h += '<div class="ev-map-empty"></div>';
  }
  h += '</div>';

  h += '</div>'; // /ev-row
  return h;
}

// OSM tile coordinate helpers
function _lonToTileX(lon, zoom){ return Math.floor((lon + 180) / 360 * Math.pow(2, zoom)); }
function _latToTileY(lat, zoom){
  var r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1/Math.cos(r)) / Math.PI) / 2 * Math.pow(2, zoom));
}

function _renderCentury(data, centIdx){
  _evStopAnimate();
  var c = CENTURIES[centIdx];
  var filtered = data.filter(function(ev){ return ev.year >= c.start && ev.year < c.end; });
  filtered.sort(function(a,b){ return a.year - b.year || (a.id||'').localeCompare(b.id||''); });

  // Count events per year for grid-row spanning
  var yearCounts = {};
  filtered.forEach(function(ev){ yearCounts[ev.year] = (yearCounts[ev.year]||0) + 1; });

  var html = '<div class="ev-grid">';
  var lastYear = null;
  filtered.forEach(function(ev){
    var showYear = (ev.year !== lastYear);
    var spanCount = showYear ? yearCounts[ev.year] : 0;
    html += _buildEventRow(ev, showYear, spanCount);
    lastYear = ev.year;
  });
  html += '</div>';

  var scrollEl = document.getElementById('evScroll');
  scrollEl.innerHTML = html;
  scrollEl.scrollTop = 0;

  // Card reveal on scroll
  var cards = scrollEl.querySelectorAll('.ev-card');
  var cardObs = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(entry.isIntersecting){
        entry.target.classList.add('ev-card-visible');
        cardObs.unobserve(entry.target);
      }
    });
  }, {root: scrollEl, threshold: 0.1});
  cards.forEach(function(c){ cardObs.observe(c); });

  // Update pill active states
  document.querySelectorAll('.ev-cent-pill').forEach(function(pill){
    var ci = pill.dataset.cent;
    if(ci !== undefined){
      pill.classList.toggle('ev-cent-active', parseInt(ci) === centIdx);
      pill.classList.toggle('ev-cent-avail', parseInt(ci) !== centIdx);
    }
  });
}

window._evSelectCentury = function(idx){
  _activeCentury = idx;
  _renderCentury(window.eventsData, idx);
};

// ── ANIMATE ──────────────────────────────────────────────
window._evToggleAnimate = function(){
  if(_animRunning){ _evStopAnimate(); return; }
  var scrollEl = document.getElementById('evScroll');
  if(!scrollEl) return;
  var rows = scrollEl.querySelectorAll('.ev-row');
  if(!rows.length) return;
  rows.forEach(function(r){
    r.classList.add('ev-row-hidden');
    r.classList.remove('ev-row-reveal');
    var card = r.querySelector('.ev-card');
    if(card) card.classList.remove('ev-card-visible');
  });
  scrollEl.scrollTop = 0;
  _animRunning = true;
  _animIdx = 0;
  var btn = document.getElementById('evAnimateBtn');
  if(btn) btn.textContent = '\u25A0 STOP';
  _evAnimateNextRow(rows);
};

function _evAnimateNextRow(rows){
  if(!_animRunning) return;
  if(_animIdx >= rows.length){ _evStopAnimate(); return; }
  var row = rows[_animIdx];
  // display:contents rows have no box, so scroll the card's parent cell instead
  var scrollTarget = row.querySelector('.ev-col-story') || row.querySelector('.ev-card');
  var scrollEl = document.getElementById('evScroll');
  if(scrollTarget && scrollEl){
    var targetTop = scrollTarget.offsetTop - scrollEl.offsetTop;
    var center = targetTop - (scrollEl.clientHeight / 2) + (scrollTarget.offsetHeight / 2);
    scrollEl.scrollTo({top: Math.max(0, center), behavior: 'smooth'});
  }
  setTimeout(function(){
    if(!_animRunning) return;
    row.classList.remove('ev-row-hidden');
    row.classList.add('ev-row-reveal');
    var card = row.querySelector('.ev-card');
    if(card) card.classList.add('ev-card-visible');
  }, 200);
  _animIdx++;
  var speed = 2000;
  var sel = document.getElementById('evSpeedSelect');
  if(sel) speed = parseInt(sel.value) || 2000;
  _animTimer = setTimeout(function(){ _evAnimateNextRow(rows); }, speed);
}

function _evStopAnimate(){
  _animRunning = false;
  if(_animTimer){ clearTimeout(_animTimer); _animTimer = null; }
  var btn = document.getElementById('evAnimateBtn');
  if(btn) btn.textContent = '\u25B6 ANIMATE';
  var scrollEl = document.getElementById('evScroll');
  if(scrollEl){
    scrollEl.querySelectorAll('.ev-row').forEach(function(r){
      r.classList.remove('ev-row-hidden');
      r.classList.add('ev-row-reveal');
      var card = r.querySelector('.ev-card');
      if(card) card.classList.add('ev-card-visible');
    });
  }
}

window.initEvents = initEvents;
})();
