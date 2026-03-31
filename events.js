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
  if(window.VIEW==='events'&&v!=='events'&&r3&&_hdrRow3Original!==null){
    r3.innerHTML=_hdrRow3Original;
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
  _startYear=500;
  _endYear=1500;
  ct.innerHTML='<div class="ev-scroll" id="evScroll"></div>';
  // Ensure Leaflet is loaded for mini maps
  if(typeof L==='undefined'){
    var scr=document.createElement('script');
    scr.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    scr.onload=function(){_renderRange(data,_startYear,_endYear);};
    scr.onerror=function(){
      var s2=document.createElement('script');
      s2.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s2.onload=function(){_renderRange(data,_startYear,_endYear);};
      document.head.appendChild(s2);
    };
    document.head.appendChild(scr);
  } else {
    _renderRange(data,_startYear,_endYear);
  }
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
      h+='<span class="ev-fig-chip" onclick="if(typeof jumpTo===\'function\')jumpTo(\''+escAttr(nm)+'\')">'+esc(nm)+'</span>';
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
    tags.forEach(function(t){h+='<span class="ev-tag">'+esc(t)+'</span>';});
    h+='</div>';
  }

  h+='</div></div>'; // /ev-card /ev-col-story

  // COL 4 — The Visual
  h+='<div class="ev-col-visual">';
  var vis=ev.visual||{};
  var loc=ev.location||{};
  var caption=vis.caption||loc.place||'';
  var modern=vis.modern||loc.modern||'';
  var evId=(ev.id||'ev'+ev.year).replace(/[^a-zA-Z0-9_-]/g,'');

  if(vis.type==='portrait'&&vis.url){
    // Portrait: Wikipedia image with fallback to mini map
    h+='<div class="ev-vis-frame">';
    h+='<img class="ev-vis-img ev-vis-portrait" src="'+vis.url.replace(/"/g,'&quot;')+'" alt="" loading="lazy"';
    h+=' data-lat="'+(loc.lat||0)+'" data-lng="'+(loc.lng||0)+'"';
    h+=' onerror="this.onerror=null;this.style.display=\'none\';window._evInitMiniMap(\'evMiniMap_'+evId+'\','+(loc.lat||0)+','+(loc.lng||0)+',8)"';
    h+='>';
    h+='<div id="evMiniMap_'+evId+'" class="ev-mini-map" style="display:none"></div>';
    h+='</div>';
  } else {
    // Map types (map/osm/era_map): render as Leaflet mini map
    h+='<div class="ev-vis-frame">';
    h+='<div id="evMiniMap_'+evId+'" class="ev-mini-map" data-lat="'+(loc.lat||0)+'" data-lng="'+(loc.lng||0)+'" data-zoom="'+(vis.zoom||8)+'"></div>';
    h+='</div>';
  }
  if(caption) h+='<div class="ev-map-place">'+esc(caption)+'</div>';
  if(modern) h+='<div class="ev-map-modern">'+esc(modern)+'</div>';
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

  var cards=scrollEl.querySelectorAll('.ev-card');
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('ev-card-visible');obs.unobserve(en.target);}
    });
  },{root:scrollEl,threshold:0.1});
  cards.forEach(function(c){obs.observe(c);});

  // Initialize mini Leaflet maps (lazy — only when scrolled into view)
  _initMiniMaps(scrollEl);
}

// ── MINI LEAFLET MAPS ──
var _miniMaps={};

function _initMiniMaps(scrollEl){
  // Clean up previous maps
  Object.keys(_miniMaps).forEach(function(k){
    try{_miniMaps[k].remove();}catch(e){}
  });
  _miniMaps={};

  var divs=scrollEl.querySelectorAll('.ev-mini-map[data-lat]');
  if(!divs.length||typeof L==='undefined') return;

  var mapObs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){
        var el=en.target;
        mapObs.unobserve(el);
        var lat=parseFloat(el.dataset.lat)||0;
        var lng=parseFloat(el.dataset.lng)||0;
        var zoom=parseInt(el.dataset.zoom)||8;
        if(!lat&&!lng) return;
        el.style.display='block';
        var m=L.map(el.id,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false,boxZoom:false,keyboard:false});
        m.setView([lat,lng],zoom);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(m);
        L.marker([lat,lng]).addTo(m);
        _miniMaps[el.id]=m;
        setTimeout(function(){m.invalidateSize();},100);
      }
    });
  },{root:scrollEl,threshold:0.05});
  divs.forEach(function(d){mapObs.observe(d);});
}

// Fallback: init a mini map when portrait image fails
window._evInitMiniMap=function(divId,lat,lng,zoom){
  var el=document.getElementById(divId);
  if(!el||typeof L==='undefined') return;
  el.style.display='block';
  var m=L.map(divId,{zoomControl:false,attributionControl:false,dragging:false,scrollWheelZoom:false,doubleClickZoom:false,touchZoom:false,boxZoom:false,keyboard:false});
  m.setView([lat,lng],zoom||8);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(m);
  L.marker([lat,lng]).addTo(m);
  _miniMaps[divId]=m;
  setTimeout(function(){m.invalidateSize();},100);
};

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
