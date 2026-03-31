// ═══════════════════════════════════════════════════════════
// EVENTS VIEW — 4-column grid with enriched data + images
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
  {label:'6th',start:500,end:600},{label:'7th',start:600,end:700},
  {label:'8th',start:700,end:800},{label:'9th',start:800,end:900},
  {label:'10th',start:900,end:1000},{label:'11th',start:1000,end:1100},
  {label:'12th',start:1100,end:1200},{label:'13th',start:1200,end:1300},
  {label:'14th',start:1300,end:1400},{label:'15th',start:1400,end:1500},
  {label:'16th',start:1500,end:1600},{label:'17th',start:1600,end:1700},
  {label:'18th',start:1700,end:1800},{label:'19th',start:1800,end:1900},
  {label:'20th',start:1900,end:2000},{label:'21st',start:2000,end:2100}
];

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
  var avail=_availCenturies(data);
  var h='';
  h+='<select class="ev-speed-select" id="evSpeedSelect" style="margin-left:auto">';
  SPEED_OPTIONS.forEach(function(o){
    var sel=o.label==='Normal'?' selected':'';
    h+='<option value="'+o.ms+'"'+sel+'>'+o.label+' ('+o.ms/1000+'s)</option>';
  });
  h+='</select>';
  h+='<button class="ev-animate-btn" id="evAnimateBtn" onclick="window._evToggleAnimate()">\u25B6 ANIMATE</button>';
  return h;
}

function _availCenturies(data){
  var has={};
  data.forEach(function(e){has[Math.floor(e.year/100)]=true;});
  var a=[];
  CENTURIES.forEach(function(c,i){if(has[Math.floor(c.start/100)])a.push(i);});
  return a;
}

// ── INIT ──
function initEvents(){
  var ct=document.getElementById('events-view');
  if(!ct) return;
  var data=window.eventsData;
  if(!data||!data.length){ct.innerHTML='<div style="padding:40px;color:var(--muted)">No events data loaded.</div>';return;}
  if(_inited) return;
  _inited=true;
  var avail=_availCenturies(data);
  _activeCentury=avail.length?avail[0]:0;
  ct.innerHTML='<div class="ev-scroll" id="evScroll"></div>';
  _renderCentury(data,_activeCentury);
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

  // Figures
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

  // Sources
  var src=ev.sources||[];
  if(src.length) h+='<div class="ev-sources">'+src.map(function(s){return esc(s);}).join(' \u00b7 ')+'</div>';

  // Outcome
  if(ev.outcome) h+='<div class="ev-outcome">'+esc(ev.outcome)+'</div>';

  // Tags
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

  if(vis.url){
    // Real Wikimedia image
    h+='<div class="ev-vis-frame">';
    h+='<img class="ev-vis-img" src="'+escAttr(vis.url)+'" alt="'+escAttr(vis.caption||ev.title)+'" loading="lazy" onerror="this.style.display=\'none\'">';
    if(vis.caption){
      h+='<div class="ev-vis-caption-bar"><span class="ev-vis-caption">'+esc(vis.caption)+'</span></div>';
    }
    h+='</div>';
    if(vis.credit) h+='<div class="ev-vis-credit">'+esc(vis.credit)+'</div>';
  } else if(loc.lat&&loc.lng){
    // Fallback: static OpenStreetMap
    var mapUrl='https://staticmap.openstreetmap.de/staticmap.php?center='+loc.lat+','+loc.lng+'&zoom=8&size=400x250&maptype=mapnik&markers='+loc.lat+','+loc.lng+',ol-marker';
    h+='<div class="ev-vis-frame">';
    h+='<img class="ev-vis-img" src="'+escAttr(mapUrl)+'" alt="'+escAttr(loc.place||'')+'" loading="lazy">';
    h+='</div>';
    if(loc.place) h+='<div class="ev-map-place">'+esc(loc.place)+'</div>';
    if(loc.modern&&loc.modern!==loc.place) h+='<div class="ev-map-modern">'+esc(loc.modern)+'</div>';
  } else {
    h+='<div class="ev-vis-empty"></div>';
  }
  h+='</div>';

  h+='</div>'; // /ev-row
  return h;
}

// ── RENDER CENTURY ──
function _renderCentury(data,centIdx){
  _evStopAnimate();
  var c=CENTURIES[centIdx];
  var filtered=data.filter(function(e){return e.year>=c.start&&e.year<c.end;});
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

  // Card reveal on scroll
  var cards=scrollEl.querySelectorAll('.ev-card');
  var obs=new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){en.target.classList.add('ev-card-visible');obs.unobserve(en.target);}
    });
  },{root:scrollEl,threshold:0.1});
  cards.forEach(function(c){obs.observe(c);});

  // Update pills
  document.querySelectorAll('.ev-cent-pill').forEach(function(p){
    var ci=p.dataset.cent;
    if(ci!==undefined){
      p.classList.toggle('ev-cent-active',parseInt(ci)===centIdx);
      p.classList.toggle('ev-cent-avail',parseInt(ci)!==centIdx);
    }
  });
}

window._evSelectCentury=function(idx){
  _activeCentury=idx;
  _renderCentury(window.eventsData,idx);
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
  // Scroll: find the story column (has a box, unlike display:contents row)
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
