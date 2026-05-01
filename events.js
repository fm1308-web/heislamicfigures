/* ─────────────────────────────────────────────────────────────
   EVENTS view — verbatim lift from bv-app/events.js
   IIFE exposes window.EventsView = { mount, unmount }
   ───────────────────────────────────────────────────────────── */
window.EventsView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global — EVENTS uses 'events'
  var VIEW = 'events';
  window.VIEW = 'events';
  // stub: APP namespace
  var APP = window.APP || { Favorites:null, filterFavsOnly:false, _lang:'en',
    getDisplayName:function(p){ return p ? (p.famous || '') : ''; } };
  window.APP = APP;
  // stub: jumpTo — figure-name links inside event descriptions; sandbox logs only.
  if(typeof window.jumpTo !== 'function') window.jumpTo = function(name){
    console.log('[events] jumpTo (stub):', name);
  };
  // stub: setView — sandbox shell uses setActiveTab; the lifted view's setView wrapper
  // (lines 200–231) wraps a non-existent global; we leave it undefined so the wrapper
  // never fires, then call initEvents() directly from mount().
  // stub: ALL_CENTS / centIdx / setCW / updateCentHeaders / updateCentScrollbar — used
  // by _evGoToFigure when navigating back to TIMELINE; safe to leave undefined.
  // stub: searchQ — global driven by shell's #search input. We update it in _wireZoneB.
  if(typeof window.searchQ === 'undefined') window.searchQ = '';
  // stub: renderQuranRef — used to format Quran refs. Falls back to esc().
  if(typeof window.renderQuranRef !== 'function') window.renderQuranRef = function(s){
    return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  };
  // stub: AnimControls — leave undefined; lifted code already null-checks.
  // stub: _showViewDesc / _hideViewDesc
  if(typeof window._showViewDesc !== 'function') window._showViewDesc = function(){};
  if(typeof window._hideViewDesc !== 'function') window._hideViewDesc = function(){};
  // stub: Leaflet + mapbase — minimaps will silently no-op (lifted code already
  // bails if `typeof L==='undefined' || typeof _mbCreateMap==='undefined'`).
  // stub: Monastic.showHadiths — hadith chip click; sandbox no-op.
  if(typeof window.Monastic === 'undefined') window.Monastic = {
    showHadiths: function(ids, title){ console.log('[events] showHadiths (stub):', title, ids); }
  };
  // stub: PEOPLE — populated by core.json fetch in mount(); typeof guards in lifted code.

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/events.js ▼▼▼
  // (outer IIFE wrapper unwrapped — we already wrap above)
  // ═══════════════════════════════════════════════════════════

var _inited = false;
var _evAnimMode = 'stopped';
var _evAnimTimer = null;
var _evAnimIdx = 0;
var _evAnimRows = null;
var _evAnimSpeedMs = 1200;
var _evAnimCtl = null;
var _hdrRow3Original = null;
var _startYear = 500;
var _evTafsirByEvent = null;
var _evTafsirLoading = false;
function _ensureEvTafsirXref(){
  if(_evTafsirByEvent || _evTafsirLoading) return;
  _evTafsirLoading = true;
  fetch(dataUrl('data/islamic/xref/tafsir_xref_events.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      _evTafsirByEvent = j || {};
      _evTafsirLoading = false;
      console.log('[EVENTS] tafsir xref: loaded', Object.keys(_evTafsirByEvent).length, 'events with refs');
      var sc = document.getElementById('evScroll');
      if(sc) sc.querySelectorAll('.ev-tafsir-chip-slot').forEach(_evHydrateTafsirChip);
    })
    .catch(function(e){ _evTafsirLoading = false; console.warn('[EVENTS] tafsir xref load failed', e); });
}
function _evTafsirEntriesFor(eid){
  if(!_evTafsirByEvent || !eid) return [];
  if(_evTafsirByEvent[eid]) return _evTafsirByEvent[eid];
  var prefix = String(eid).split('-')[0];
  var keys = Object.keys(_evTafsirByEvent);
  for(var i=0;i<keys.length;i++){
    if(keys[i] === prefix) return _evTafsirByEvent[keys[i]];
    if(keys[i].split('-')[0] === prefix) return _evTafsirByEvent[keys[i]];
  }
  return [];
}
function _evHydrateTafsirChip(slot){
  if(!slot) return;
  if(slot.getAttribute('data-loaded') === '1') return;
  var eid = slot.getAttribute('data-eid') || '';
  var etitle = slot.getAttribute('data-etitle') || '';
  var entries = _evTafsirEntriesFor(eid);
  if(!entries.length) return;
  slot.setAttribute('data-loaded','1');
  slot.innerHTML = '<span class="ev-tafsir-chip" style="display:inline-block;margin:6px 6px 0 0;padding:3px 9px;background:rgba(192,132,252,0.10);border:1px solid rgba(192,132,252,0.45);border-radius:2px;color:#c084fc;font-size:var(--fs-3);cursor:pointer;font-family:\'Cinzel\',serif;letter-spacing:.06em">'
    + entries.length + ' tafsir mention' + (entries.length===1?'':'s')
    + '</span>';
  slot.querySelector('.ev-tafsir-chip').addEventListener('click', function(e){
    e.stopPropagation();
    window._evShowTafsirs(eid, etitle);
  });
}
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

function getEra(yr){
  for(var i=0;i<ERA_BANDS.length;i++)
    if(yr>=ERA_BANDS[i].start && yr<ERA_BANDS[i].end) return ERA_BANDS[i].name;
  return '';
}
function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function escAttr(s){return esc(s).replace(/'/g,'&#39;').replace(/"/g,'&quot;');}
function figName(f){return typeof f==='string'?f:(f&&f.name?f.name:'');}
function figRole(f){return(typeof f==='object'&&f&&f.role)?f.role:'';}

function _evBuildDescHTML(desc, figs){
  if(!desc) return '';
  var candidates = (figs||[])
    .map(function(f){ return { name: figName(f), slug: (f && f.slug) || '' }; })
    .filter(function(c){ return c.name; })
    .sort(function(a,b){ return b.name.length - a.name.length; });
  if(!candidates.length) return esc(desc);
  var used = Object.create(null);
  var out = '';
  var i = 0;
  var n = desc.length;
  outer: while(i < n){
    for(var k = 0; k < candidates.length; k++){
      var c = candidates[k];
      if(used[c.name]) continue;
      if(desc.substr(i, c.name.length) === c.name){
        var prev = i > 0 ? desc.charAt(i-1) : ' ';
        var next = desc.charAt(i + c.name.length) || ' ';
        if(!/[A-Za-z0-9]/.test(prev) && !/[A-Za-z0-9]/.test(next)){
          out += '<span class="event-fig-link" data-name="' + escAttr(c.name) + '">' + esc(c.name) + '</span>';
          i += c.name.length;
          used[c.name] = true;
          continue outer;
        }
      }
    }
    out += esc(desc.charAt(i));
    i++;
  }
  return out;
}

// One-time delegated click for inline figure links inside descriptions.
if(typeof document !== 'undefined' && !window._evFigLinkDelegated){
  window._evFigLinkDelegated = true;
  document.addEventListener('click', function(e){
    var el = e.target && e.target.closest && e.target.closest('.event-fig-link');
    if(!el) return;
    e.stopPropagation();
    var nm = el.dataset && el.dataset.name;
    if(nm && typeof jumpTo === 'function') jumpTo(nm);
  });
}

function _evGoToFigure(name){
  if(!name) return;
  // Sandbox: cross-view jumps not wired — log and bail.
  if(typeof window.jumpTo === 'function') window.jumpTo(name);
}
window._evGoToFigure=_evGoToFigure;

function _evFilterByTag(tag){
  var data=window.eventsData||[];
  var filtered=data.filter(function(e){
    return e.year>=_startYear&&e.year<=_endYear&&(e.tags||[]).indexOf(tag)!==-1;
  });
  var scrollEl=document.getElementById('evScroll');
  if(!scrollEl) return;
  var yearCounts={};
  filtered.forEach(function(e){yearCounts[e.year]=(yearCounts[e.year]||0)+1;});
  var html='<div class="ev-filter-banner">Showing: <strong>'+esc(tag)+'</strong> ('+filtered.length+') <span class="ev-filter-clear" onclick="window._evClearTagFilter()">✕ Clear</span></div>';
  html+='<div class="ev-grid">';
  var lastYear=null;
  filtered.forEach(function(ev){
    var showYear=(ev.year!==lastYear);
    html+=_buildRow(ev,showYear,showYear?yearCounts[ev.year]:0);
    lastYear=ev.year;
  });
  html+='</div>';
  scrollEl.innerHTML=html;
  setTimeout(_evInitMinimaps, 100);
  scrollEl.scrollTop=0;
  _populateEventHadithChips();
}
window._evFilterByTag=_evFilterByTag;

window._evShowTafsirs = function(eid, etitle){
  var entries = _evTafsirEntriesFor(eid);
  if(!entries.length) return;
  window._stPendingPinnedTafsir = { entries: entries.slice(), label: etitle || ('Event '+eid) };
  var candidates = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="explain"], .tab-explain');
  for(var i=0;i<candidates.length;i++){
    var el = candidates[i];
    var txt = (el.textContent||'').trim().toUpperCase();
    var dv = el.getAttribute('data-view')||'';
    if(txt === 'EXPLAIN' || dv === 'explain'){ el.click(); return; }
  }
  if(typeof setView==='function') setView('explain');
};

window._evClearTagFilter=function(){
  _renderRange(window.eventsData,_startYear,_endYear);
  var el=document.getElementById('evFilterCount');
  var data=window.eventsData||[];
  var count=data.filter(function(ev){return ev.year>=_startYear&&ev.year<=_endYear;}).length;
  if(el) el.textContent='showing '+count+' events';
};

window._evFilterChanged=function(){
  var s=document.getElementById('evStartYear');
  var e=document.getElementById('evEndYear');
  if(s) _startYear=parseInt(s.value)||500;
  if(e) _endYear=parseInt(e.value)||2025;
  if(_startYear>_endYear) _endYear=_startYear;
  _renderRange(window.eventsData,_startYear,_endYear);
  var data=window.eventsData||[];
  var count=data.filter(function(ev){return ev.year>=_startYear&&ev.year<=_endYear;}).length;
  var el=document.getElementById('evFilterCount');
  if(el) el.textContent='showing '+count+' events';
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

// ── Hadith chips ──
var _eventHadithChips = null;
var _eventHadithChipsLoading = null;
function _ensureEventHadithChips(){
  if(_eventHadithChips) return Promise.resolve(_eventHadithChips);
  if(_eventHadithChipsLoading) return _eventHadithChipsLoading;
  _eventHadithChipsLoading = fetch(dataUrl('data/islamic/event_hadith_chips.json'))
    .then(function(r){ return r.ok ? r.json() : {}; })
    .then(function(d){ _eventHadithChips = d || {}; return _eventHadithChips; })
    .catch(function(){ _eventHadithChips = {}; return _eventHadithChips; });
  return _eventHadithChipsLoading;
}
function _populateEventHadithChips(){
  _ensureEventHadithChips().then(function(chips){
    var slots = document.querySelectorAll('.ev-hadith-chip-slot');
    slots.forEach(function(slot){
      var eid = slot.getAttribute('data-eid');
      var etitle = slot.getAttribute('data-etitle') || eid;
      var ids = chips[eid];
      if(!ids || !ids.length) return;
      slot.innerHTML = '<span class="ev-tag" style="cursor:pointer;border-color:rgba(212,175,55,.5);color:#D4AF37">HADITHS</span>';
      var chip = slot.querySelector('span');
      if(chip){
        chip.onclick = function(ev){
          ev.stopPropagation();
          if(window.Monastic && typeof window.Monastic.showHadiths === 'function'){
            window.Monastic.showHadiths(ids, 'Hadiths about ' + etitle);
          }
        };
      }
    });
  });
}

function initEvents(){
  var ct=document.getElementById('events-view');
  if(!ct) return;
  var data=window.eventsData;
  if(!data||!data.length){ct.innerHTML='<div style="padding:40px;color:var(--muted)">No events data loaded.</div>';return;}
  if(_inited) return;
  _inited=true;
  var _css=document.createElement('style');
  _css.id='eventsViewStyles';
  _css.textContent='.ev-tag-link{border-color:#2D3748!important;color:#D4AF37!important;cursor:pointer}.ev-tag-link:hover{background:rgba(212,175,55,.15);color:#D4AF37!important}.ev-tag-filter{cursor:pointer}.ev-tag-filter:hover{background:rgba(212,175,55,.08)}.ev-filter-banner{padding:8px 16px;background:rgba(212,175,55,.08);border:1px solid #2D3748;border-radius:6px;color:#D4AF37;font-size:var(--fs-3);margin:0 0 8px;display:flex;align-items:center;gap:12px}.ev-filter-clear{cursor:pointer;opacity:.6;padding:2px 8px}.ev-filter-clear:hover{opacity:1}.ev-row.ev-anim-hidden{display:none !important}.ev-scroll{scroll-behavior:smooth}';
  document.head.appendChild(_css);
  _startYear=500;
  _endYear=2025;
  ct.style.display='flex';ct.style.flexDirection='column';
  ct.innerHTML='<div class="ev-scroll content-body" id="evScroll" style="flex:1;overflow-y:auto"></div>';
  // Anim + HTW handled by shell Zone D + Zone B respectively.
  _renderRange(data,_startYear,_endYear);
}

function _buildRow(ev,showYear,spanCount){
  var catColor=CAT_COLORS[ev.category]||'#A0AEC0';
  var isDeathBlock = (ev.tags||[]).indexOf('death-block') !== -1;
  var rowCls = 'ev-row' + (isDeathBlock ? ' event-death-block' : '');
  var h='<div class="'+rowCls+'" data-year="'+ev.year+'" data-event-id="'+ev.id+'">';

  if(showYear){
    var era=getEra(ev.year);
    h+='<div class="ev-col-year"'+(spanCount>1?' style="grid-row:span '+spanCount+'"':'')+'>';
    h+='<div class="ev-yr-num">'+ev.year+'</div>';
    if(era) h+='<div class="ev-yr-era">'+esc(era)+'</div>';
    h+='</div>';
  }

  h+='<div class="ev-col-story"><div class="ev-card">';
  h+='<div class="ev-card-title">'
    + '<span class="ev-cat-pill" style="background:'+catColor+'">'+esc(ev.category)+'</span>'
    + (isDeathBlock ? '<span class="event-death-glyph">✝</span>' : '')
    + '<span class="ev-card-title-text">'+esc(ev.title)+'</span>'
    + '</div>';
  if(ev.description) h+='<div class="ev-card-desc">'+_evBuildDescHTML(ev.description, ev.figures||[])+'</div>';
  if(ev.quranRef) h+='<div class="ev-quran-ref">'+(typeof renderQuranRef==="function"?renderQuranRef(ev.quranRef):esc(ev.quranRef))+'</div>';

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
  if(src.length) h+='<div class="ev-sources">'+src.map(function(s){return esc(s);}).join(' · ')+'</div>';
  if(ev.outcome) h+='<div class="ev-outcome">'+esc(ev.outcome)+'</div>';

  h+='<span class="ev-hadith-chip-slot" data-eid="'+escAttr(ev.id||'')+'" data-etitle="'+escAttr(ev.title||'')+'"></span>';
  h+='<span class="ev-tafsir-chip-slot" data-eid="'+escAttr(ev.id||'')+'" data-etitle="'+escAttr(ev.title||'')+'"></span>';

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

  h+='</div></div>';

  h+='<div class="ev-col-visual">';
  var loc=ev.location||{};
  var place=loc.place||'';
  var modern=loc.modern||'';
  var lat=loc.lat||0;
  var lng=loc.lng||0;

  if(lat||lng){
    h+='<div class="ev-minimap" id="ev-map-'+ev.id+'" data-lat="'+lat+'" data-lng="'+lng+'" data-year="'+ev.year+'" style="width:100%;height:220px;border-radius:6px;overflow:hidden"></div>';
  }
  if(place) h+='<div style="font-size:var(--fs-3);font-weight:600;color:#D4AF37;letter-spacing:0.1em;text-transform:uppercase;text-align:center;margin-top:6px">'+esc(place)+'</div>';
  if(modern) h+='<div style="font-size:var(--fs-3);color:#A0AEC0;text-align:center">'+esc(modern)+'</div>';
  h+='</div>';

  h+='</div>';
  return h;
}

function _renderRange(data,startYr,endYr){
  _evStopAnimate();

  var filtered=(data||[]).filter(function(e){return e.year>=startYr&&e.year<=endYr;});
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
  if(!scrollEl) return;
  scrollEl.innerHTML=html;
  setTimeout(_evInitMinimaps, 100);
  scrollEl.scrollTop=0;
  _populateEventHadithChips();

  scrollEl.querySelectorAll('.ev-tafsir-chip-slot').forEach(_evHydrateTafsirChip);
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

function _evMountMinimap(el){
  if(!el || el._evMapDone) return el && el._evMap;
  if(typeof L === 'undefined' || typeof _mbCreateMap === 'undefined') return null;
  el._evMapDone = true;
  var lat=parseFloat(el.dataset.lat);
  var lng=parseFloat(el.dataset.lng);
  var yr=parseInt(el.dataset.year);
  var mid=el.id;
  if(!mid){mid='ev-map-'+Math.random().toString(36).slice(2,8);el.id=mid;}
  var mb=_mbCreateMap(mid,{zoomControl:true,attributionControl:false,minZoom:3,maxZoom:10});
  if(!mb) return null;
  var map=mb.map;
  map.dragging.disable();
  map.scrollWheelZoom.disable();
  map.doubleClickZoom.disable();
  map.touchZoom.disable();
  _mbLoadGeoEmpires(function(){
    if(!el._evMap) return; // already torn down
    var focusBounds=L.latLngBounds([[lat-5,lng-10],[lat+5,lng+10]]);
    var empLayer=_mbRenderEmpires(map,yr,null,mb.labTile,null,focusBounds);
    if(empLayer){
      empLayer.eachLayer(function(layer){
        var name=layer.feature&&layer.feature.properties&&layer.feature.properties.name;
        var col=layer.feature&&layer.feature.properties&&layer.feature.properties.color;
        if(name&&layer.getBounds){
          try{
            var c=layer.getBounds().getCenter();
            L.marker(c,{icon:L.divIcon({className:'',html:'<div style="font-family:Cinzel,serif;font-size:var(--fs-3);font-weight:700;color:'+col+';text-shadow:0 0 3px rgba(0,0,0,0.9),0 0 6px rgba(0,0,0,0.7);white-space:nowrap;letter-spacing:.04em;pointer-events:none">'+name+'</div>',iconSize:[0,0],iconAnchor:[0,6]})}).addTo(map);
          }catch(e){}
        }
      });
    }
  });
  L.marker([lat,lng],{icon:L.divIcon({className:'',html:'<div style="width:10px;height:10px;background:#D4AF37;border:2px solid #000;border-radius:50%;box-shadow:0 0 6px rgba(212,175,55,0.6)"></div>',iconSize:[14,14],iconAnchor:[7,7]})}).addTo(map);
  map.setView([lat,lng],6);
  el._evMap = map;
  setTimeout(function(){ if(el._evMap) try { el._evMap.invalidateSize(); } catch(e){} }, 200);
  return map;
}

function _evUnmountMinimap(el){
  if(!el || !el._evMap) return;
  try { el._evMap.remove(); } catch(e){}
  el._evMap = null;
  el._evMapDone = false;
}

function _evInitMinimaps(){
  var maps=document.querySelectorAll('.ev-minimap');
  if(!maps.length||typeof L==='undefined'||typeof _mbCreateMap==='undefined') return;
  var observer=new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if(!entry.isIntersecting) return;
      var el=entry.target;
      if(el._evMapDone) return;
      observer.unobserve(el);
      _evMountMinimap(el);
    });
  },{rootMargin:'200px'});
  maps.forEach(function(el){observer.observe(el);});
}

// ── ANIMATE — one-at-a-time playback ──
// Per-event dwell (ms). Spec: 0.5x→8000, 1x→4000, 2x→2000, 4x→1000.
var _evAnimDwellMs = 4000;

function _evAnimRowList(){
  var scrollEl = document.getElementById('evScroll');
  if(!scrollEl) return [];
  return Array.prototype.slice.call(scrollEl.querySelectorAll('.ev-row'));
}

function _evAnimUnhighlightActive(){
  if(!_evAnimRows) return;
  _evAnimRows.forEach(function(r){
    r.classList.remove('ev-anim-hidden','ev-anim-visible','ev-anim-active','ev-anim-dim','ev-anim-future','ev-anim-past');
  });
}

function _evAnimUnmountAllExcept(activeRow){
  document.querySelectorAll('.ev-minimap').forEach(function(el){
    if(activeRow && activeRow.contains(el)) return;
    if(el._evMap) _evUnmountMinimap(el);
  });
}

function _evAnimShowRow(row){
  if(!row) return;
  if(!_evAnimRows || !_evAnimRows.length) _evAnimRows = _evAnimRowList();
  _evAnimUnmountAllExcept(row);

  var idx = _evAnimRows.indexOf(row);
  if(idx < 0) return;

  var scrollEl = document.getElementById('evScroll');
  if(!scrollEl) return;

  // Compute window of visible rows.
  // First 3 frames: 0..idx (1 row, then 2, then 3).
  // After that: rolling window of last 3 — [idx-2, idx].
  var startVisible = (idx < 3) ? 0 : (idx - 2);
  var endVisible = idx;

  _evAnimRows.forEach(function(r, i){
    if(i >= startVisible && i <= endVisible){
      r.classList.remove('ev-anim-hidden');
    } else {
      r.classList.add('ev-anim-hidden');
    }
  });

  // Always reset scroll — visible rows sit at top of collapsed grid.
  scrollEl.scrollTop = 0;

  var mapEl = row.querySelector('.ev-minimap');
  if(mapEl) _evMountMinimap(mapEl);
}

function _evAnimScheduleNext(){
  if(_evAnimMode !== 'playing') return;
  if(_evAnimTimer){ clearTimeout(_evAnimTimer); _evAnimTimer = null; }
  _evAnimTimer = setTimeout(_evAnimAdvance, _evAnimDwellMs);
}

function _evAnimAdvance(){
  if(_evAnimMode !== 'playing') return;
  _evAnimIdx++;
  if(!_evAnimRows || _evAnimIdx >= _evAnimRows.length){
    // End of loaded batch — try to load more.
    var more = document.querySelector('#showMore, .ev-show-more, [data-action="show-more"], button.show-next-100');
    if(!more){
      // Heuristic fallback — find a button whose text mentions "next" / "more" / "100".
      var btns = document.querySelectorAll('button, .zb-pill');
      for(var i=0;i<btns.length;i++){
        var t = (btns[i].textContent||'').toLowerCase();
        if(t.indexOf('next 100') !== -1 || t.indexOf('show more') !== -1){
          more = btns[i]; break;
        }
      }
    }
    if(more && more.offsetParent !== null){
      try { more.click(); } catch(e){}
      // Wait for new rows to render, then continue.
      setTimeout(function(){
        if(_evAnimMode !== 'playing') return;
        _evAnimRows = _evAnimRowList();
        if(_evAnimIdx < _evAnimRows.length){
          _evAnimShowRow(_evAnimRows[_evAnimIdx]);
          _evAnimScheduleNext();
        } else {
          _evStopAnimate();
        }
      }, 400);
      return;
    }
    _evStopAnimate();
    return;
  }
  _evAnimShowRow(_evAnimRows[_evAnimIdx]);
  _evAnimScheduleNext();
}

function _evAnimPlay(){
  var scrollEl = document.getElementById('evScroll');
  if(!scrollEl) return;

  if(_evAnimMode === 'paused' && _evAnimRows){
    _evAnimMode = 'playing';
    _evAnimScheduleNext();
    return;
  }
  _evAnimRows = _evAnimRowList();
  if(!_evAnimRows.length) return;
  _evAnimMode = 'playing';
  _evAnimIdx = 0;
  _evAnimShowRow(_evAnimRows[0]);
  _evAnimScheduleNext();
}

function _evAnimPause(){
  _evAnimMode = 'paused';
  if(_evAnimTimer){ clearTimeout(_evAnimTimer); _evAnimTimer = null; }
}

function _evStopAnimate(){
  _evAnimMode = 'stopped';
  if(_evAnimTimer){ clearTimeout(_evAnimTimer); _evAnimTimer = null; }
  _evAnimUnhighlightActive();
  _evAnimUnmountAllExcept(null);
  _evAnimRows = null;
  _evAnimIdx = 0;
  if(_evAnimCtl) _evAnimCtl.forceStop();
  var scrollEl = document.getElementById('evScroll');
  if(scrollEl){
    try { scrollEl.scrollTo({top:0, behavior:'smooth'}); }
    catch(e){ scrollEl.scrollTop = 0; }
    // Restore old reveal classes (no-op if absent).
    scrollEl.querySelectorAll('.ev-row').forEach(function(r){
      r.classList.remove('ev-row-hidden','ev-anim-future','ev-anim-past','ev-anim-active','ev-anim-dim','ev-anim-hidden','ev-anim-visible');
      r.classList.add('ev-row-reveal');
      r.classList.add('ev-row-reveal');
      var card = r.querySelector('.ev-card');
      if(card) card.classList.add('ev-card-visible');
    });
  }
  // Clean up legacy curfew/blackout DOM if a prior version left them behind.
  var legacy = document.getElementById('ev-curfew'); if(legacy) legacy.remove();
  var legacyBO = document.getElementById('ev-blackout'); if(legacyBO) legacyBO.remove();
}

function _showEventsMethodology(){
  if(document.getElementById('events-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='events-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="events-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">A chronological feed of historical events. Each card shows what happened, who was involved, where it took place, and primary sources.</p>'
    +'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin-top:16px">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('events-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

  // Wire shell's Zone B controls — EVENTS spec:
  // { search:true, filters:[Category select, Century select], actions:[Show next 100 pill], htw:true }
  function _wireZoneB(zoneBEl){
    var searchInp = document.getElementById('search');
    if(searchInp){
      searchInp.placeholder = 'Search events…';
      searchInp.addEventListener('input', function(){
        window.searchQ = searchInp.value || '';
        if(window._eventsApplySearch) window._eventsApplySearch();
      });
    }

    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;
    var selects = row2.querySelectorAll('.zb-select');

    var pills = zoneBEl.querySelectorAll('.zb-pill');
    pills.forEach(function(p){
      var t = (p.textContent||'').toUpperCase();
      if(t.indexOf('NEXT') !== -1 || t.indexOf('100') !== -1 || t.indexOf('MORE') !== -1){
        p.style.display = 'none';
      }
    });

    // Build dropdown panels once
    var panels = window._evPanels;
    if(!panels){
      panels = {};
      // Build CATEGORY panel — uses shell .dd-panel/.dd-item standard
      var catPanel = document.createElement('div');
      catPanel.className = 'dd-panel';
      catPanel.id = 'ev-cat-panel';
      var catRows = '<div class="dd-item dd-all selected" data-cat=""><div class="dd-checkbox">✓</div><span>All categories</span></div>';
      Object.keys(CAT_COLORS).forEach(function(c){
        catRows += '<div class="dd-item" data-cat="'+c+'"><div class="dd-checkbox"></div><span>'+c+'</span></div>';
      });
      catPanel.innerHTML = catRows;
      document.body.appendChild(catPanel);
      panels.cat = catPanel;

      // Build CENTURY panel — uses shell .dd-panel/.dd-item standard
      var centPanel = document.createElement('div');
      centPanel.className = 'dd-panel';
      centPanel.id = 'ev-cent-panel';
      var centRows = '<div class="dd-item dd-all selected" data-from="500" data-to="2025"><div class="dd-checkbox">✓</div><span>All centuries</span></div>';
      for(var c=6; c<=21; c++){
        var from = (c-1)*100;
        var to = c*100;
        var label = c+'th century ('+from+'–'+to+')';
        centRows += '<div class="dd-item" data-from="'+from+'" data-to="'+to+'"><div class="dd-checkbox"></div><span>'+label+'</span></div>';
      }
      centPanel.innerHTML = centRows;
      document.body.appendChild(centPanel);
      panels.cent = centPanel;

      window._evPanels = panels;
    }

    function openPanelBelow(panel, btn){
      // Close other
      Object.keys(panels).forEach(function(k){
        if(panels[k] !== panel){ panels[k].classList.remove('open'); }
      });
      var nowOpen = !panel.classList.contains('open');
      panel.classList.toggle('open', nowOpen);
      if(nowOpen){
        var r = btn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.top  = (r.bottom + 4) + 'px';
        panel.style.left = r.left + 'px';
        panel.style.zIndex = 10000;
      }
    }

    var catBtn = null, centBtn = null;
    selects.forEach(function(b){
      var t = (b.textContent||'').trim().toUpperCase();
      if(t.indexOf('CATEGORY') !== -1 || t.indexOf('CAT') === 0) catBtn = b;
      else if(t.indexOf('CENTURY') !== -1 || t.indexOf('CENT') === 0) centBtn = b;
    });

    if(catBtn){
      catBtn.addEventListener('click', function(e){
        e.stopPropagation();
        openPanelBelow(panels.cat, catBtn);
      });
      panels.cat.querySelectorAll('.dd-item').forEach(function(row){
        row.addEventListener('click', function(){
          var cat = row.getAttribute('data-cat') || '';
          panels.cat.querySelectorAll('.dd-item').forEach(function(r){ r.classList.remove('selected'); var cb=r.querySelector('.dd-checkbox'); if(cb) cb.textContent=''; });
          row.classList.add('selected');
          var cb = row.querySelector('.dd-checkbox'); if(cb) cb.textContent = '✓';
          catBtn.textContent = cat || 'CATEGORY';
          panels.cat.classList.remove('open');
          if(cat){ window._evFilterByTag(cat); }
          else  { window._evClearTagFilter(); }
        });
      });
    }

    if(centBtn){
      centBtn.addEventListener('click', function(e){
        e.stopPropagation();
        openPanelBelow(panels.cent, centBtn);
      });
      panels.cent.querySelectorAll('.dd-item').forEach(function(row){
        row.addEventListener('click', function(){
          var from = parseInt(row.getAttribute('data-from'), 10) || 500;
          var to   = parseInt(row.getAttribute('data-to'), 10)   || 2025;
          panels.cent.querySelectorAll('.dd-item').forEach(function(r){ r.classList.remove('selected'); var cb=r.querySelector('.dd-checkbox'); if(cb) cb.textContent=''; });
          row.classList.add('selected');
          var cb = row.querySelector('.dd-checkbox'); if(cb) cb.textContent = '✓';
          centBtn.textContent = (from === 500 && to === 2025) ? 'CENTURY' : (from+'–'+to);
          panels.cent.classList.remove('open');
          _startYear = from;
          _endYear   = to;
          window._evClearTagFilter();
          if(window._eventsApplySearch) window._eventsApplySearch();
        });
      });
    }

    // Outside-click closes panels
    if(!window._evPanelsOutsideWired){
      window._evPanelsOutsideWired = true;
      document.addEventListener('click', function(e){
        var p = window._evPanels;
        if(!p) return;
        Object.keys(p).forEach(function(k){
          if(p[k].classList.contains('open') && !p[k].contains(e.target)){
            p[k].classList.remove('open');
          }
        });
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;
    _ensureEvTafsirXref();

    document.body.classList.add('ev-mounted');

    // initEvents expects #events-view in the DOM.
    zoneCEl.innerHTML = '<div id="events-view"></div>';

    // Eager Promise.all: core.json (figures) + events/master.json (event data) +
    // event_hadith_chips.json (xref). Mirrors timeline pattern.
    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });
    var p2 = (window.eventsData && window.eventsData.length)
      ? Promise.resolve(window.eventsData)
      : fetch(dataUrl('data/islamic/events/master.json'))
          .then(function(r){ return r.ok ? r.json() : null; })
          .catch(function(){ return null; })
          .then(function(d){
            // master.json may be a bare array OR { events: [...] }.
            var arr = Array.isArray(d) ? d : (d && d.events) ? d.events : [];
            window.eventsData = arr;
            return arr;
          });
    var p3 = _ensureEventHadithChips();

    Promise.all([p1, p2, p3]).then(function(){
      initEvents();
      _wireZoneB(zoneBEl);
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('ev-mounted');

    try { _evStopAnimate(); } catch(e) {}

    var ov = document.getElementById('events-method-overlay'); if(ov) ov.remove();
    var s = document.getElementById('eventsViewStyles'); if(s) s.remove();

    _inited = false;

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return {
    mount: mount,
    unmount: unmount,
    showHtw: _showEventsMethodology,
    animateStart: _evAnimPlay,
    animatePause: _evAnimPause,
    animateStop:  _evStopAnimate,
    animateSetSpeed: function(label){
      // Per-event dwell time (ms) — one-at-a-time playback.
      var map = { '0.5x':8000, '1x':4000, '2x':2000, '4x':1000 };
      _evAnimDwellMs = map[label] || 4000;
      // Live-apply: if currently playing, restart the dwell timer for the
      // current event so the new speed takes effect on the next advance.
      if(_evAnimMode === 'playing' && _evAnimTimer){
        clearTimeout(_evAnimTimer); _evAnimTimer = null;
        _evAnimScheduleNext();
      }
    }
  };
})();
