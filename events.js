// ═══════════════════════════════════════════════════════════
// EVENTS VIEW — 4-column grid with enriched data + images
// Uses #hdrRow3 in the fixed top bar for year range filter + animate
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _inited = false;
var _animRunning = false;
var _animTimer = null;
var _animIdx = 0;
var _hdrRow3Original = null;
var _startYear = 500;
var _endYear = 1500;

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

var YEAR_STEPS_FROM = [500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450];
var YEAR_STEPS_TO = [550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500];

var SPEED_OPTIONS = [
  {label:'Fast',ms:800},{label:'Normal',ms:2000},
  {label:'Slow',ms:4000},{label:'Cinematic',ms:8000}
];

function getEra(yr){
  for(var i=0;i<ERA_BANDS.length;i++)
    if(yr>=ERA_BANDS[i].start && yr<ERA_BANDS[i].end) return ERA_BANDS[i].name;
  return '';
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return esc(s).replace(/'/g,'&#39;').replace(/"/g,'&quot;');}
function figName(f){return typeof f==='string'?f:(f&&f.name?f.name:'');}
function figRole(f){return(typeof f==='object'&&f&&f.role)?f.role:'';}

// ── Navigate to figure in Timeline ──
function _evGoToFigure(name){
  if(!name) return;
  var p = typeof PEOPLE!=='undefined' && PEOPLE.find(function(x){return x.famous===name;});
  var mid = null;
  if(p){
    var dob=p.dob, dod=p.dod;
    mid = (dob&&dod) ? Math.round((dob+dod)/2) : (dob||dod||null);
  }

  // Set century columns to center on this figure's lifetime
  if(mid && typeof ALL_CENTS!=='undefined'){
    var cent = Math.floor(mid/100)+1;
    var idx = ALL_CENTS.indexOf(cent);
    if(idx===-1){
      idx=0;
      for(var i=1;i<ALL_CENTS.length;i++){
        if(Math.abs(ALL_CENTS[i]-cent)<Math.abs(ALL_CENTS[idx]-cent)) idx=i;
      }
    }
    centIdx = idx;
    if(typeof setCW==='function') setCW();
    if(typeof updateCentHeaders==='function') updateCentHeaders();
    if(typeof updateCentScrollbar==='function') updateCentScrollbar();
  }

  // Set year slider
  if(mid){
    var sl=document.getElementById('sliderInput');
    if(sl){
      var v=Math.max(+sl.min,Math.min(+sl.max,mid));
      sl.value=v;
      sl.dispatchEvent(new Event('input',{bubbles:true}));
    }
  }

  // Switch to timeline and jump
  if(typeof setView==='function') setView('timeline');
  setTimeout(function(){
    // Re-apply century after setView (which calls renderAll)
    if(mid && typeof ALL_CENTS!=='undefined'){
      var cent2=Math.floor(mid/100)+1;
      var idx2=ALL_CENTS.indexOf(cent2);
      if(idx2===-1){idx2=0;for(var i=1;i<ALL_CENTS.length;i++){if(Math.abs(ALL_CENTS[i]-cent2)<Math.abs(ALL_CENTS[idx2]-cent2))idx2=i;}}
      centIdx=idx2;
      if(typeof setCW==='function') setCW();
      if(typeof updateCentHeaders==='function') updateCentHeaders();
      if(typeof updateCentScrollbar==='function') updateCentScrollbar();
      if(typeof renderAll==='function') renderAll();
    }
    if(typeof jumpTo==='function') jumpTo(name);
    var fb=document.getElementById('filterBar');
    if(fb) fb.style.display='flex';
  },250);
}
window._evGoToFigure=_evGoToFigure;

// ── Filter events by tag ──
function _evFilterByTag(tag){
  var data=window.eventsData||[];
  var filtered=data.filter(function(e){
    return e.year>=_startYear&&e.year<=_endYear&&(e.tags||[]).indexOf(tag)!==-1;
  });
  var scrollEl=document.getElementById('evScroll');
  if(!scrollEl) return;
  var yearCounts={};
  filtered.forEach(function(e){yearCounts[e.year]=(yearCounts[e.year]||0)+1;});
  var html='<div class="ev-filter-banner">Showing: <strong>'+esc(tag)+'</strong> ('+filtered.length+') <span class="ev-filter-clear" onclick="window._evClearTagFilter()">\u2715 Clear</span></div>';
  html+='<div class="ev-grid">';
  var lastYear=null;
  filtered.forEach(function(ev){
    var showYear=(ev.year!==lastYear);
    html+=_buildRow(ev,showYear,showYear?yearCounts[ev.year]:0);
    lastYear=ev.year;
  });
  html+='</div>';
  scrollEl.innerHTML=html;
  scrollEl.scrollTop=0;
}
window._evFilterByTag=_evFilterByTag;

window._evClearTagFilter=function(){
  _renderRange(window.eventsData,_startYear,_endYear);
  var el=document.getElementById('evFilterCount');
  var data=window.eventsData||[];
  var count=data.filter(function(ev){return ev.year>=_startYear&&ev.year<=_endYear;}).length;
  if(el) el.textContent='showing '+count+' events';
};

// Compute max year in data, rounded up to nearest 50
function _maxYear(data){
  var mx=0;
  data.forEach(function(e){if(e.year>mx)mx=e.year;});
  return Math.ceil(mx/50)*50;
}

// ── hdrRow3 repurposing ──
var _origSetView = window.setView;
window.setView = function(v){
  var r3=document.getElementById('hdrRow3');
  if(_hdrRow3Original!==null&&v!=='events'){
    if(r3){
      r3.innerHTML=_hdrRow3Original;
    }
    _hdrRow3Original=null;
    _evStopAnimate();
  }
  _origSetView(v);
  if(v==='events'&&r3){
    if(_hdrRow3Original===null) _hdrRow3Original=r3.innerHTML;
    r3.innerHTML=_buildHeaderHTML();
    r3.style.display='flex';
  }
  if(r3&&v==='studyroom') r3.style.display='none';
};

function _buildHeaderHTML(){
  var data=window.eventsData||[];

  var h='';
  // LEFT: year range dropdowns
  h+='<span class="ev-filter-label">EVENTS FROM</span>';
  h+='<select class="ev-speed-select" id="evStartYear" onchange="window._evFilterChanged()">';
  YEAR_STEPS_FROM.forEach(function(y){
    var sel=(y===_startYear)?' selected':'';
    h+='<option value="'+y+'"'+sel+'>'+y+'</option>';
  });
  h+='</select>';
  h+='<span class="ev-filter-label">TO</span>';
  h+='<select class="ev-speed-select" id="evEndYear" onchange="window._evFilterChanged()">';
  YEAR_STEPS_TO.forEach(function(y){
    var sel=(y===_endYear)?' selected':'';
    h+='<option value="'+y+'"'+sel+'>'+y+'</option>';
  });
  h+='</select>';
  // Count
  var count=data.filter(function(e){return e.year>=_startYear&&e.year<=_endYear;}).length;
  h+='<span class="ev-filter-count" id="evFilterCount">showing '+count+' events</span>';

  // RIGHT: speed + animate
  h+='<select class="ev-speed-select" id="evSpeedSelect" style="margin-left:auto">';
  SPEED_OPTIONS.forEach(function(o){
    var sel=o.label==='Normal'?' selected':'';
    h+='<option value="'+o.ms+'"'+sel+'>'+o.label+' ('+o.ms/1000+'s)</option>';
  });
  h+='</select>';
  h+='<button class="ev-animate-btn" id="evAnimateBtn" onclick="window._evToggleAnimate()">\u25B6 ANIMATE</button>';
  return h;
}

// ── Filter changed ──
window._evFilterChanged=function(){
  var s=document.getElementById('evStartYear');
  var e=document.getElementById('evEndYear');
  if(s) _startYear=parseInt(s.value)||500;
  if(e) _endYear=parseInt(e.value)||999;
  if(_startYear>_endYear) _endYear=_startYear;
  _renderRange(window.eventsData,_startYear,_endYear);
  // Update count
  var data=window.eventsData||[];
  var count=data.filter(function(ev){return ev.year>=_startYear&&ev.year<=_endYear;}).length;
  var el=document.getElementById('evFilterCount');
  if(el) el.textContent='showing '+count+' events';
};

// ── INIT ──
function initEvents(){
  var ct=document.getElementById('events-view');
  if(!ct) return;
  var data=window.eventsData;
  if(!data||!data.length){ct.innerHTML='<div style="padding:40px;color:var(--muted)">No events data loaded.</div>';return;}
  if(_inited) return;
  _inited=true;
  var _css=document.createElement('style');
  _css.textContent='.ev-tag-link{border-color:rgba(201,168,76,.35)!important;color:rgba(201,168,76,.8)!important;cursor:pointer}.ev-tag-link:hover{background:rgba(201,168,76,.15);color:#c9a84c!important}.ev-tag-filter{cursor:pointer}.ev-tag-filter:hover{background:rgba(255,255,255,.1)}.ev-filter-banner{padding:8px 16px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:6px;color:#c9a84c;font-size:13px;margin:0 0 8px;display:flex;align-items:center;gap:12px}.ev-filter-clear{cursor:pointer;opacity:.6;padding:2px 8px}.ev-filter-clear:hover{opacity:1}';
  document.head.appendChild(_css);
  _startYear=500;
  _endYear=1500;
  ct.innerHTML='<div class="ev-scroll" id="evScroll"></div>';
  _renderRange(data,_startYear,_endYear);
}

// ── BUILD ONE EVENT ROW ──
function _buildRow(ev,showYear,spanCount){
  var catColor=CAT_COLORS[ev.category]||'#888';
  var h='<div class="ev-row" data-year="'+ev.year+'">';

  // COL 1 — Year
  if(showYear){
    var era=getEra(ev.year);
    h+='<div class="ev-col-year"'+(spanCount>1?' style="grid-row:span '+spanCount+'"':'')+'>';
    h+='<div class="ev-yr-num">'+ev.year+'</div>';
    if(era) h+='<div class="ev-yr-era">'+esc(era)+'</div>';
    h+='</div>';
  }

  // COL 2 — Category
  h+='<div class="ev-col-cat"><span class="ev-cat-pill" style="background:'+catColor+'">'+esc(ev.category)+'</span></div>';

  // COL 3 — The Story
  h+='<div class="ev-col-story"><div class="ev-card">';
  h+='<div class="ev-card-title">'+esc(ev.title)+'</div>';
  if(ev.description) h+='<div class="ev-card-desc">'+esc(ev.description)+'</div>';
  if(ev.quranRef) h+='<div class="ev-quran-ref">'+esc(ev.quranRef)+'</div>';

  var figs=ev.figures||[];
  if(figs.length){
    h+='<div class="ev-card-figures">';
    figs.forEach(function(f){
      var nm=figName(f),rl=figRole(f);
      if(!nm) return;
      h+='<div class="ev-fig-wrap">';
      h+='<span class="ev-fig-chip" onclick="window._evGoToFigure(\''+escAttr(nm)+'\')">'+esc(nm)+'</span>';
      if(rl) h+='<span class="ev-fig-role">'+esc(rl)+'</span>';
      h+='</div>';
    });
    h+='</div>';
  }

  var src=ev.sources||[];
  if(src.length) h+='<div class="ev-sources">'+src.map(function(s){return esc(s);}).join(' \u00b7 ')+'</div>';
  if(ev.outcome) h+='<div class="ev-outcome">'+esc(ev.outcome)+'</div>';

  var tags=ev.tags||[];
  if(tags.length){
    h+='<div class="ev-tags">';
    tags.forEach(function(t){
      var isFig=typeof PEOPLE!=='undefined'&&PEOPLE.some(function(p){return p.famous===t;});
      if(isFig){
        h+='<span class="ev-tag ev-tag-link" onclick="window._evGoToFigure(\''+escAttr(t)+'\')" title="View in Timeline">'+esc(t)+'</span>';
      } else {
        h+='<span class="ev-tag ev-tag-filter" onclick="window._evFilterByTag(\''+escAttr(t)+'\')" title="Filter by tag">'+esc(t)+'</span>';
      }
    });
    h+='</div>';
  }

  h+='</div></div>'; // /ev-card /ev-col-story

  // COL 4 — OSM iframe embed
  h+='<div class="ev-col-visual">';
  var loc=ev.location||{};
  var place=loc.place||'';
  var modern=loc.modern||'';
  var lat=loc.lat||0;
  var lng=loc.lng||0;

  if(lat||lng){
    var bbox=(lng-1)+','+(lat-1)+','+(lng+1)+','+(lat+1);
    h+='<iframe src="https://www.openstreetmap.org/export/embed.html?bbox='+bbox+'&amp;layer=mapnik&amp;marker='+lat+','+lng+'" style="width:100%;height:220px;border:none;border-radius:6px" loading="lazy"></iframe>';
  }
  if(place) h+='<div style="font-size:12px;font-weight:600;color:#c9a84c;letter-spacing:0.1em;text-transform:uppercase;text-align:center;margin-top:6px">'+esc(place)+'</div>';
  if(modern) h+='<div style="font-size:10px;color:#666;text-align:center">'+esc(modern)+'</div>';
  h+='</div>';

  h+='</div>'; // /ev-row
  return h;
}

// ── RENDER BY YEAR RANGE ──
function _renderRange(data,startYr,endYr){
  _evStopAnimate();

  var filtered=data.filter(function(e){return e.year>=startYr&&e.year<=endYr;});
  filtered.sort(function(a,b){return a.year-b.year||(a.id||'').localeCompare(b.id||'');});

  var yearCounts={};
  filtered.forEach(function(e){yearCounts[e.year]=(yearCounts[e.year]||0)+1;});

  var html='<div class="ev-grid">';
  var lastYear=null;
  filtered.forEach(function(ev){
    var showYear=(ev.year!==lastYear);
    html+=_buildRow(ev,showYear,showYear?yearCounts[ev.year]:0);
    lastYear=ev.year;
  });
  html+='</div>';

  var scrollEl=document.getElementById('evScroll');
  scrollEl.innerHTML=html;
  scrollEl.scrollTop=0;

  // Card fade-in observer
  var cards=scrollEl.querySelectorAll('.ev-card');
  var cardObs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('ev-card-visible');cardObs.unobserve(en.target);}
    });
  },{root:scrollEl,threshold:0.1});
  cards.forEach(function(c){cardObs.observe(c);});
}

// ── ANIMATE ──
window._evToggleAnimate=function(){
  if(_animRunning){_evStopAnimate();return;}
  var scrollEl=document.getElementById('evScroll');
  if(!scrollEl) return;
  var rows=scrollEl.querySelectorAll('.ev-row');
  if(!rows.length) return;
  rows.forEach(function(r){
    r.classList.add('ev-row-hidden');r.classList.remove('ev-row-reveal');
    var card=r.querySelector('.ev-card');if(card)card.classList.remove('ev-card-visible');
  });
  scrollEl.scrollTop=0;
  _animRunning=true;_animIdx=0;
  var btn=document.getElementById('evAnimateBtn');
  if(btn)btn.textContent='\u25A0 STOP';
  _animNext(rows);
};

function _animNext(rows){
  if(!_animRunning) return;
  if(_animIdx>=rows.length){_evStopAnimate();return;}
  var row=rows[_animIdx];
  var target=row.querySelector('.ev-col-story');
  var scrollEl=document.getElementById('evScroll');
  if(target&&scrollEl){
    var top=target.offsetTop-scrollEl.offsetTop;
    var center=top-(scrollEl.clientHeight/2)+(target.offsetHeight/2);
    scrollEl.scrollTo({top:Math.max(0,center),behavior:'smooth'});
  }
  setTimeout(function(){
    if(!_animRunning) return;
    row.classList.remove('ev-row-hidden');row.classList.add('ev-row-reveal');
    var card=row.querySelector('.ev-card');if(card)card.classList.add('ev-card-visible');
  },200);
  _animIdx++;
  var speed=2000;
  var sel=document.getElementById('evSpeedSelect');
  if(sel) speed=parseInt(sel.value)||2000;
  _animTimer=setTimeout(function(){_animNext(rows);},speed);
}

function _evStopAnimate(){
  _animRunning=false;
  if(_animTimer){clearTimeout(_animTimer);_animTimer=null;}
  var btn=document.getElementById('evAnimateBtn');
  if(btn) btn.textContent='\u25B6 ANIMATE';
  var scrollEl=document.getElementById('evScroll');
  if(scrollEl){
    scrollEl.querySelectorAll('.ev-row').forEach(function(r){
      r.classList.remove('ev-row-hidden');r.classList.add('ev-row-reveal');
      var card=r.querySelector('.ev-card');if(card)card.classList.add('ev-card-visible');
    });
  }
}

window.initEvents=initEvents;
})();
