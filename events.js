// ═══════════════════════════════════════════════════════════
// EVENTS VIEW — 4-column grid with enriched data + images
// Uses #hdrRow3 in the fixed top bar for year range filter + animate
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _inited = false;
var _evAnimMode = 'stopped';
var _evAnimTimer = null;
var _evAnimIdx = 0;
var _evAnimRows = null;
var _evAnimSpeedMs = 1200;
var _evAnimCtl = null;
var _hdrRow3Original = null;
var _startYear = 500;
var _endYear = 2025;

var CAT_COLORS = {
  'Politics':'#4a90d9','War':'#e74c3c','Theology':'#D4AF37',
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

var YEAR_STEPS_FROM = [500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500,1550,1600,1650,1700,1750,1800,1850,1900,1950,2000];
var YEAR_STEPS_TO = [550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1400,1450,1500,1550,1600,1650,1700,1750,1800,1850,1900,1950,2000,2025];

var SPEED_OPTIONS = [
  {label:'Slow',ms:2400},{label:'Medium',ms:1200},
  {label:'Fast',ms:500}
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
    if(typeof _hideViewDesc==='function') _hideViewDesc();
    // Restore search placeholder
    var box=document.getElementById('search');
    if(box&&box.dataset.evOrigPh){
      box.setAttribute('placeholder',box.dataset.evOrigPh);
      delete box.dataset.evOrigPh;
    }
  }
  _origSetView(v);
  if(v==='events'&&r3){
    if(_hdrRow3Original===null) _hdrRow3Original=r3.innerHTML;
    r3.innerHTML=_buildHeaderHTML();
    r3.style.display='flex';
    // Update search placeholder
    var box=document.getElementById('search');
    if(box){
      if(!box.dataset.evOrigPh) box.dataset.evOrigPh=box.getAttribute('placeholder')||'';
      box.setAttribute('placeholder','Search events\u2026');
    }
    if(typeof _showViewDesc==='function') _showViewDesc('Important historical events');
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
  h+='<span class="dd-clear-x" id="evYearClearX" onclick="window._evResetYears()" title="Reset year range" style="font-size:16px;margin:0 4px;display:none">\u00D7</span>';
  h+='<span class="ev-filter-count" id="evFilterCount">showing '+count+' events</span>';
  // RIGHT: filter count details
  h+='<span class="ev-filter-count" style="opacity:.5;margin-left:6px">16 centuries \u00B7 500\u20132025 CE</span>';
  return h;
}

// ── Filter changed ──
window._evFilterChanged=function(){
  var s=document.getElementById('evStartYear');
  var e=document.getElementById('evEndYear');
  if(s) _startYear=parseInt(s.value)||500;
  if(e) _endYear=parseInt(e.value)||2025;
  if(_startYear>_endYear) _endYear=_startYear;
  _renderRange(window.eventsData,_startYear,_endYear);
  // Update count
  var data=window.eventsData||[];
  var count=data.filter(function(ev){return ev.year>=_startYear&&ev.year<=_endYear;}).length;
  var el=document.getElementById('evFilterCount');
  if(el) el.textContent='showing '+count+' events';
  // Show/hide year reset ×
  var xBtn=document.getElementById('evYearClearX');
  if(xBtn) xBtn.style.display=(_startYear!==500||_endYear!==2025)?'inline-block':'none';
};

window._evResetYears=function(){
  _startYear=500; _endYear=2025;
  var s=document.getElementById('evStartYear');
  var e=document.getElementById('evEndYear');
  if(s) s.value='500';
  if(e) e.value='2025';
  window._evFilterChanged();
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
  _css.textContent='.ev-tag-link{border-color:#2D3748!important;color:#D4AF37!important;cursor:pointer}.ev-tag-link:hover{background:rgba(212,175,55,.15);color:#D4AF37!important}.ev-tag-filter{cursor:pointer}.ev-tag-filter:hover{background:rgba(212,175,55,.08)}.ev-filter-banner{padding:8px 16px;background:rgba(212,175,55,.08);border:1px solid #2D3748;border-radius:6px;color:#D4AF37;font-size:13px;margin:0 0 8px;display:flex;align-items:center;gap:12px}.ev-filter-clear{cursor:pointer;opacity:.6;padding:2px 8px}.ev-filter-clear:hover{opacity:1}';
  document.head.appendChild(_css);
  _startYear=500;
  _endYear=2025;
  ct.style.display='flex';ct.style.flexDirection='column';
  ct.innerHTML='<div id="ev-l1" style="display:flex;align-items:center;gap:10px;padding:6px 16px;border-bottom:1px solid rgba(45,55,72,0.5)"><button id="events-how-btn" style="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-size:12px;cursor:pointer;transition:.2s;font-family:\'Cinzel\',serif;letter-spacing:.05em" onmouseover="this.style.borderColor=\'#D4AF37\';this.style.color=\'#D4AF37\'" onmouseout="this.style.borderColor=\'#555\';this.style.color=\'#888\'">How This Works</button><div id="ev-anim-mount" style="margin-left:auto;display:flex;align-items:center;gap:10px"></div></div><div class="ev-scroll" id="evScroll" style="flex:1;overflow-y:auto"></div>';
  var _evMountL1=document.getElementById('ev-anim-mount');
  if(_evMountL1&&window.AnimControls){
    _evAnimCtl=window.AnimControls.create({
      mountEl:_evMountL1, idPrefix:'ev', initialSpeed:'1x',
      onPlay:_evAnimPlay, onPause:_evAnimPause, onStop:_evStopAnimate,
      onSpeedChange:function(ms){ _evAnimSpeedMs=ms; }
    });
  }
  var _evHowBtnL1=document.getElementById('events-how-btn');
  if(_evHowBtnL1) _evHowBtnL1.onclick=function(e){e.stopPropagation();_showEventsMethodology();};
  _renderRange(data,_startYear,_endYear);
}

// ── BUILD ONE EVENT ROW ──
function _buildRow(ev,showYear,spanCount){
  var catColor=CAT_COLORS[ev.category]||'#A0AEC0';
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
  if(place) h+='<div style="font-size:12px;font-weight:600;color:#D4AF37;letter-spacing:0.1em;text-transform:uppercase;text-align:center;margin-top:6px">'+esc(place)+'</div>';
  if(modern) h+='<div style="font-size:10px;color:#A0AEC0;text-align:center">'+esc(modern)+'</div>';
  h+='</div>';

  h+='</div>'; // /ev-row
  return h;
}

// ── RENDER BY YEAR RANGE ──
function _renderRange(data,startYr,endYr){
  _evStopAnimate();

  var filtered=data.filter(function(e){return e.year>=startYr&&e.year<=endYr;});
  var q = (typeof searchQ !== 'undefined' && searchQ) ? searchQ.toLowerCase().trim() : '';
  if(q){
    filtered = filtered.filter(function(e){
      var hay = [
        e.title || '',
        e.description || '',
        e.outcome || '',
        (e.tags || []).join(' '),
        (e.sources || []).join(' '),
        (e.figures || []).map(function(f){ return typeof f === 'string' ? f : (f && f.name) || ''; }).join(' '),
        (e.location && e.location.place) || '',
        (e.location && e.location.modern) || ''
      ].join(' ').toLowerCase();
      return hay.indexOf(q) > -1;
    });
  }
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

window._eventsApplySearch = function(){
  var data = window.eventsData;
  if(!data || !data.length) return;
  _renderRange(data, _startYear, _endYear);
};

// ── ANIMATE — curfew-based (matches THINK global standard) ──
var _evCurfewY=0,_evCurfewMaxY=0;

function _evAnimPlay(){
  var scrollEl=document.getElementById('evScroll');
  if(!scrollEl) return;

  // Ensure curfew line exists
  var cursor=document.getElementById('ev-curfew');
  if(!cursor){
    cursor=document.createElement('div');cursor.id='ev-curfew';cursor.className='ev-curfew-line';
    cursor.innerHTML='<span id="ev-curfew-year" class="ev-curfew-year"></span>';
    cursor.style.display='none';
    scrollEl.style.position='relative';
    scrollEl.appendChild(cursor);
  }
  var blackout=document.getElementById('ev-blackout');
  if(!blackout){
    blackout=document.createElement('div');blackout.id='ev-blackout';
    blackout.style.cssText='display:none;position:absolute;left:0;right:0;background:#000;z-index:8;pointer-events:none';
    scrollEl.appendChild(blackout);
  }

  if(_evAnimMode==='paused'&&_evAnimRows){
    _evAnimMode='playing';
    cursor.style.display='';
    _evAnimSpeedMs=_evAnimCtl?_evAnimCtl.getSpeedMs():1200;
    _evAnimTimer=setInterval(_evAnimTick,_evAnimSpeedMs);
    return;
  }
  _evAnimRows=scrollEl.querySelectorAll('.ev-row');
  if(!_evAnimRows.length) return;
  scrollEl.scrollTop=0;
  _evAnimMode='playing';
  _evCurfewY=0;
  _evCurfewMaxY=scrollEl.scrollHeight;
  _evAnimSpeedMs=_evAnimCtl?_evAnimCtl.getSpeedMs():1200;
  if(blackout){blackout.style.display='';blackout.style.top='0px';blackout.style.height=_evCurfewMaxY+'px';}
  cursor.style.display='';cursor.style.top='0px';
  _evAnimTimer=setInterval(_evAnimTick,_evAnimSpeedMs);
}

function _evAnimTick(){
  if(_evAnimMode!=='playing') return;
  var scrollEl=document.getElementById('evScroll');
  var cursor=document.getElementById('ev-curfew');
  if(!scrollEl) return;
  _evCurfewY+=8;
  if(_evCurfewY>_evCurfewMaxY*0.8){_evStopAnimate();return;}
  if(cursor) cursor.style.top=_evCurfewY+'px';
  var bo=document.getElementById('ev-blackout');
  if(bo){bo.style.top=(_evCurfewY+1)+'px';bo.style.height=(_evCurfewMaxY-_evCurfewY)+'px';}
  // Year label from revealed rows
  var revealedYr=null;
  if(_evAnimRows) _evAnimRows.forEach(function(r){
    var firstChild=r.querySelector('div');
    var rowTop=firstChild?firstChild.offsetTop-scrollEl.offsetTop:0;
    if(rowTop<=_evCurfewY){
      revealedYr=parseInt(r.getAttribute('data-year'),10);
    }
  });
  if(revealedYr) _evLastRevealedYr=revealedYr;
  var yrEl=document.getElementById('ev-curfew-year');
  if(yrEl&&_evLastRevealedYr) yrEl.innerHTML=_evLastRevealedYr+'<span class="year-era">CE</span>';
  scrollEl.scrollTop=Math.max(0,_evCurfewY-scrollEl.clientHeight/2);
}
var _evLastRevealedYr=null;

function _evAnimPause(){
  _evAnimMode='paused';
  if(_evAnimTimer){clearInterval(_evAnimTimer);_evAnimTimer=null;}
}

function _evStopAnimate(){
  _evAnimMode='stopped';
  if(_evAnimTimer){clearInterval(_evAnimTimer);_evAnimTimer=null;}
  _evAnimRows=null;_evLastRevealedYr=null;
  if(_evAnimCtl) _evAnimCtl.forceStop();
  var scrollEl=document.getElementById('evScroll');
  if(scrollEl){
    var bo=document.getElementById('ev-blackout');
    if(bo) bo.style.display='none';
    scrollEl.querySelectorAll('.ev-row').forEach(function(r){
      r.classList.remove('ev-row-hidden');r.classList.add('ev-row-reveal');
      var card=r.querySelector('.ev-card');if(card)card.classList.add('ev-card-visible');
    });
  }
  var cursor=document.getElementById('ev-curfew');
  if(cursor) cursor.style.display='none';
}

window.initEvents=initEvents;

window._captureState_events=function(){
  var scroll=document.getElementById('evScroll');
  return{search:typeof searchQ!=='undefined'?searchQ:'',scrollY:scroll?scroll.scrollTop:0};
};
window._restoreState_events=function(s){
  if(!s) return;
  if(s.scrollY){var scroll=document.getElementById('evScroll');if(scroll) scroll.scrollTop=s.scrollY;}
};


function _showEventsMethodology(){
  if(document.getElementById('events-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='events-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="events-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:18px;margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'+'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 16px">A chronological feed of 403 historical events spanning 14 centuries. Each card shows what happened, who was involved, where it took place, and primary sources. Events with Quranic references are marked.</p>'+'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Categories</h3>'+'<div style="font-size:13px;line-height:1.7"><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E53E3E;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">War</span><span style="color:#A0AEC0">Battles, sieges, conquests</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#3182CE;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Politics</span><span style="color:#A0AEC0">Treaties, successions, founding of states</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#38A169;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Science</span><span style="color:#A0AEC0">Discoveries, inventions, scholarly works</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#805AD5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Theology</span><span style="color:#A0AEC0">Doctrinal debates, creedal formulations</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#D69E2E;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Sufism</span><span style="color:#A0AEC0">Mystical milestones, Sufi orders</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#DD6B20;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Trade</span><span style="color:#A0AEC0">Economic events, trade routes</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E53E8C;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Art</span><span style="color:#A0AEC0">Cultural achievements, landmarks</span></div></div>'+'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'+'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 12px">Event descriptions generated by AI and verified against primary sources. Quran references manually verified. Treat as educational starting points.</p>'+'<p style="color:#999;font-size:12px;font-style:italic;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('events-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
})();
