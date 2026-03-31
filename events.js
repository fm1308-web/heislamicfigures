// ═══════════════════════════════════════════════════════════
// EVENTS VIEW — Historical events timeline (3-column layout)
// Uses #hdrRow3 in the fixed top bar for century pills + animate
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _inited = false;
var _animRunning = false;
var _animTimer = null;
var _animIdx = 0;
var _activeCentury = 0;
var _hdrRow3Original = null; // saved original innerHTML

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

// ── Repurpose hdrRow3 when entering/leaving events view ──
var _origSetView = window.setView;
window.setView = function(v){
  var r3 = document.getElementById('hdrRow3');

  // Leaving events view — restore original hdrRow3
  if(window.VIEW === 'events' && v !== 'events' && r3 && _hdrRow3Original !== null){
    r3.innerHTML = _hdrRow3Original;
    _hdrRow3Original = null;
    _evStopAnimate();
  }

  _origSetView(v);

  // Entering events view — repurpose hdrRow3
  if(v === 'events' && r3){
    if(_hdrRow3Original === null){
      _hdrRow3Original = r3.innerHTML;
    }
    r3.innerHTML = _buildEventsHeaderHTML();
    r3.style.display = 'flex';
  }

  // Hide hdrRow3 for studyroom (keep visible for events since we repurposed it)
  if(r3 && v === 'studyroom'){
    r3.style.display = 'none';
  }
};

function _buildEventsHeaderHTML(){
  var data = window.eventsData || [];
  var available = _availableCenturies(data);

  var html = '';
  // Century pills — left aligned
  CENTURIES.forEach(function(c, i){
    var isAvail = available.indexOf(i) !== -1;
    if(isAvail){
      var cls = (i === _activeCentury) ? 'ev-cent-pill ev-cent-active' : 'ev-cent-pill ev-cent-avail';
      html += '<span class="'+cls+'" data-cent="'+i+'" onclick="window._evSelectCentury('+i+')">' + c.label + '</span>';
    } else {
      html += '<span class="ev-cent-pill ev-cent-disabled">' + c.label + '</span>';
    }
  });

  // Right side — speed + animate, pushed right with margin-left:auto
  html += '<span class="ev-header-note" style="margin-left:auto">More centuries coming</span>';
  html += '<select class="ev-speed-select" id="evSpeedSelect">';
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

  // events-view only contains the scrollable area — header is in hdrRow3
  container.innerHTML = '<div class="ev-scroll" id="evScroll"></div>';

  _renderCentury(data, _activeCentury);
}

function _renderCentury(data, centIdx){
  _evStopAnimate();

  var c = CENTURIES[centIdx];
  var filtered = data.filter(function(ev){ return ev.year >= c.start && ev.year < c.end; });
  filtered.sort(function(a,b){ return a.year - b.year; });

  var lastYear = null;
  var rows = [];
  filtered.forEach(function(ev){
    var yr = ev.year;
    var first = (yr !== lastYear);
    rows.push({ev:ev, year:yr, isFirstOfYear:first, era: first ? getEraForYear(yr) : ''});
    lastYear = yr;
  });

  var yearCounts = {};
  filtered.forEach(function(ev){
    yearCounts[ev.year] = (yearCounts[ev.year]||0) + 1;
  });

  var html = '<table class="ev-table"><tbody>';
  rows.forEach(function(r, idx){
    var ev = r.ev;
    var catColor = CAT_COLORS[ev.category] || '#888';
    html += '<tr class="ev-row" data-year="'+r.year+'" data-idx="'+idx+'">';
    if(r.isFirstOfYear){
      html += '<td class="ev-col-year" rowspan="'+yearCounts[r.year]+'">';
      html += '<div class="ev-yr-num">'+r.year+'</div>';
      if(r.era) html += '<div class="ev-yr-era">'+esc(r.era)+'</div>';
      html += '</td>';
    }
    html += '<td class="ev-col-cat"><span class="ev-cat-pill" style="background:'+catColor+'">'+esc(ev.category)+'</span></td>';
    html += '<td class="ev-col-content"><div class="ev-card">';
    html += '<div class="ev-card-title">'+esc(ev.title)+'</div>';
    if(ev.description) html += '<div class="ev-card-desc">'+esc(ev.description)+'</div>';
    if(ev.figures && ev.figures.length){
      html += '<div class="ev-card-figures">';
      ev.figures.forEach(function(fig){
        html += '<span class="ev-fig-chip" onclick="if(typeof jumpTo===\'function\')jumpTo(\''+escAttr(fig)+'\')">'+esc(fig)+'</span>';
      });
      html += '</div>';
    }
    html += '</div></td></tr>';
  });
  html += '</tbody></table>';

  var scrollEl = document.getElementById('evScroll');
  scrollEl.innerHTML = html;
  scrollEl.scrollTop = 0;

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

  // Update pill active states in hdrRow3
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
  var trs = scrollEl.querySelectorAll('.ev-row');
  if(!trs.length) return;

  trs.forEach(function(tr){
    tr.classList.add('ev-row-hidden');
    tr.classList.remove('ev-row-reveal');
    var card = tr.querySelector('.ev-card');
    if(card) card.classList.remove('ev-card-visible');
  });

  scrollEl.scrollTop = 0;
  _animRunning = true;
  _animIdx = 0;

  var btn = document.getElementById('evAnimateBtn');
  if(btn) btn.textContent = '\u25A0 STOP';
  _evAnimateNextRow(trs);
};

function _evAnimateNextRow(trs){
  if(!_animRunning) return;
  if(_animIdx >= trs.length){ _evStopAnimate(); return; }
  var tr = trs[_animIdx];
  tr.scrollIntoView({block:'center', behavior:'smooth'});
  setTimeout(function(){
    if(!_animRunning) return;
    tr.classList.remove('ev-row-hidden');
    tr.classList.add('ev-row-reveal');
    var card = tr.querySelector('.ev-card');
    if(card) card.classList.add('ev-card-visible');
  }, 200);
  _animIdx++;
  var speed = 2000;
  var sel = document.getElementById('evSpeedSelect');
  if(sel) speed = parseInt(sel.value) || 2000;
  _animTimer = setTimeout(function(){ _evAnimateNextRow(trs); }, speed);
}

function _evStopAnimate(){
  _animRunning = false;
  if(_animTimer){ clearTimeout(_animTimer); _animTimer = null; }
  var btn = document.getElementById('evAnimateBtn');
  if(btn) btn.textContent = '\u25B6 ANIMATE';
  var scrollEl = document.getElementById('evScroll');
  if(scrollEl){
    scrollEl.querySelectorAll('.ev-row').forEach(function(tr){
      tr.classList.remove('ev-row-hidden');
      tr.classList.add('ev-row-reveal');
      var card = tr.querySelector('.ev-card');
      if(card) card.classList.add('ev-card-visible');
    });
  }
}

window.initEvents = initEvents;
})();
