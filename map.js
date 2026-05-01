/* ─────────────────────────────────────────────────────────────
   MAP view — verbatim lift from bv-app/map.js + bv-app/mapbase.js
   IIFE exposes window.MapView = { mount, unmount }
   Leaflet (1.9.4) is lazy-loaded from CDN if not already present.
   ───────────────────────────────────────────────────────────── */
window.MapView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global
  var VIEW = 'map';
  window.VIEW = 'map';
  // stub: APP namespace
  var APP = window.APP || { Favorites:null, filterFavsOnly:false, _lang:'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; } };
  window.APP = APP;
  // stub: TIMELINE filter state — _getMapFiltered reads selTypes / selTrads / searchQ.
  if(typeof window.selTypes === 'undefined') window.selTypes = new Set();
  if(typeof window.selTrads === 'undefined') window.selTrads = new Set();
  if(typeof window.searchQ === 'undefined') window.searchQ = '';
  // stub: PROPHET_CHAIN / ASHRA_MUBASHSHARA / _IH_SUBLANE_REV — silsila/timeline globals.
  if(typeof window.PROPHET_CHAIN === 'undefined') window.PROPHET_CHAIN = new Set();
  if(typeof window.ASHRA_MUBASHSHARA === 'undefined') window.ASHRA_MUBASHSHARA = new Set();
  if(typeof window._IH_SUBLANE_REV === 'undefined') window._IH_SUBLANE_REV = {};
  // stub: CC / gc — TIMELINE century color helpers, used by _openMapCard.
  if(typeof window.CC === 'undefined') window.CC = {6:'#d4600a',7:'#c04a08',8:'#a07800',9:'#5a8a00',10:'#007a5c',11:'#c87832',12:'#b86820',13:'#c8902a',14:'#a07828',15:'#a01030',16:'#a01030',17:'#a03000',18:'#8a5a00',19:'#4a7800',20:'#008050'};
  if(typeof window.gc !== 'function') window.gc = function(y){if(y<600)return 6;if(y<700)return 7;if(y<800)return 8;if(y<900)return 9;if(y<1000)return 10;if(y<1100)return 11;if(y<1200)return 12;if(y<1300)return 13;if(y<1400)return 14;if(y<1500)return 15;if(y<1600)return 16;if(y<1700)return 17;if(y<1800)return 18;if(y<1900)return 19;return 20;};
  // stub: esc
  if(typeof window.esc !== 'function') window.esc = function(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');};
  // stub: jumpTo + focusPersonInTimeline — cross-view nav
  if(typeof window.jumpTo !== 'function') window.jumpTo = function(name){ console.log('[map] jumpTo (stub):', name); };
  if(typeof window.focusPersonInTimeline !== 'function') window.focusPersonInTimeline = function(name){ console.log('[map] focusPersonInTimeline (stub):', name); };
  // stub: _wikidata / _WD_OCC_LABELS / _getJourneyLocation — populated by other views.
  if(typeof window._wikidata === 'undefined') window._wikidata = {};
  if(typeof window._WD_OCC_LABELS === 'undefined') window._WD_OCC_LABELS = {};
  // stub: AnimControls — leave undefined; lifted code already null-checks.
  // stub: activeYear / _setSliderYear — TIMELINE-driven; the lifted _mapAnimPlay no-ops if absent.
  if(typeof window.activeYear === 'undefined') window.activeYear = null;

  // PEOPLE — populated by core.json fetch in mount(). Lifted code reads PEOPLE without typeof.
  // We hold a local view of it that gets synced on mount.
  var PEOPLE = window.PEOPLE || [];

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ LIFTED MAPBASE.JS (inlined; same definitions, no fetch v=Date.now) ▼▼▼
  // ═══════════════════════════════════════════════════════════

  var _mbGeoEmpData = null;
  var _mbGeoEmpCenturies = [];
  var _MB_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/positron_no_labels/{z}/{x}/{y}{r}.png';
  var _MB_LABEL_TILES = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';
  var _MB_BORDERS_URL = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson';

  function _mbCreateMap(elementId, opts){
    opts = opts || {};
    var el = document.getElementById(elementId);
    if(!el || typeof L === 'undefined') return null;
    var map = L.map(el, {
      zoomControl: opts.zoomControl !== false,
      attributionControl: opts.attributionControl !== false,
      minZoom: opts.minZoom || 2,
      maxZoom: opts.maxZoom || 14,
      maxBounds: [[-85,-180],[85,180]],
      maxBoundsViscosity: 1.0
    });
    L.tileLayer(_MB_DARK_TILES, { subdomains:'abcd', attribution:'© <a href="https://carto.com/attributions">CARTO</a>', maxZoom:19 }).addTo(map);
    fetch(_MB_BORDERS_URL).then(function(r){return r.json();}).then(function(geo){
      if(!map) return;
      L.geoJSON(geo, { style:{ color:'#7a8a72', weight:0.8, fillOpacity:0, opacity:0.8 } }).addTo(map);
    }).catch(function(){});
    var labTile = L.tileLayer(_MB_LABEL_TILES, { subdomains:'abcd', maxZoom:19, opacity:1 });
    map._mbUserDrag = false;
    map.on('movestart', function(){ map._mbUserDrag = true; });
    map.on('moveend', function(){ setTimeout(function(){ map._mbUserDrag = false; }, 300); });
    return { map:map, labTile:labTile };
  }
  function _mbLoadGeoEmpires(cb){
    if(_mbGeoEmpData){ cb(); return; }
    fetch(dataUrl('data/islamic/empire_overlays.json'))
      .then(function(r){ return r.json(); })
      .then(function(j){
        _mbGeoEmpData = j || {};
        _mbGeoEmpCenturies = Object.keys(_mbGeoEmpData).sort(function(a,b){return +a - +b;});
        cb();
      })
      .catch(function(){ _mbGeoEmpData = {}; _mbGeoEmpCenturies = []; cb(); });
  }
  function _mbFitToPoints(map, points, padding){
    if(!map || !points || !points.length || typeof L === 'undefined') return;
    padding = padding || 0.08;
    try { map.fitBounds(L.latLngBounds(points).pad(padding), { animate:false, maxZoom:10 }); } catch(e){}
  }
  function _mbAutoPan(map, activePts, padding){
    if(!map || !activePts || !activePts.length || typeof L === 'undefined') return false;
    if(map._mbUserDrag) return false;
    try {
      var b = L.latLngBounds(activePts);
      var mapBounds = map.getBounds().pad(-0.15);
      if(!mapBounds.contains(b)){
        if(activePts.length === 1){ map.panTo(activePts[0], { animate:true, duration:0.5 }); }
        else { map.fitBounds(b.pad(0.3), { animate:true, duration:0.5, maxZoom:Math.max(map.getZoom(),5) }); }
        return true;
      }
    } catch(e){}
    return false;
  }
  // Expose globally so any other view that loads after MAP can reuse them.
  window._mbCreateMap = _mbCreateMap;
  window._mbLoadGeoEmpires = _mbLoadGeoEmpires;
  window._mbFitToPoints = _mbFitToPoints;
  window._mbAutoPan = _mbAutoPan;

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/map.js ▼▼▼
  // ═══════════════════════════════════════════════════════════

let _lMap=null, _empLayer=null, _mrkLayer=null, _labTile=null;
let _mapYear=null;
const MAP_MIN=550, MAP_MAX=2025;
let _geoEmpData=null, _geoEmpLayer=null, _geoEmpOn=false;
let GEO_EMP_CENTURIES=[];
function fmtYr(y){return y<0?`${Math.abs(y)} BCE`:`${y} CE`;}

const MAP_EMPIRES=[
  {name:"Sumerian City-States",     years:"2900–2350 BCE",color:"#a07840",start:-2900,end:-2350,poly:[[34,43],[34,48],[30,48],[30,43]]},
  {name:"Babylonian Empire",        years:"1895–539 BCE", color:"#c8a020",start:-1895,end:-539, poly:[[35,39],[35,49],[29,49],[29,39]]},
  {name:"Assyrian Empire",          years:"1365–609 BCE", color:"#a04820",start:-1365,end:-609, poly:[[38,38],[38,48],[33,48],[33,38]]},
  {name:"Achaemenid Persian Empire",years:"550–330 BCE",  color:"#c8780a",start:-550, end:-330, poly:[[42,44],[42,74],[24,74],[24,44]]},
  {name:"Egyptian New Kingdom",     years:"1550–1070 BCE",color:"#f0c000",start:-1550,end:-1070,poly:[[34,24],[34,38],[16,38],[16,24]]},
  {name:"Roman Empire",             years:"27 BCE–476 CE",color:"#8b0000",start:-27,  end:476,  poly:[[56,-9],[56,44],[20,44],[20,-9]]},
  {name:"Byzantine Empire",         years:"330–1453 CE",  color:"#6a0572",start:330,  end:1453, poly:[[48,18],[48,42],[28,42],[28,18]]},
  {name:"Sassanid Persian Empire",  years:"224–651 CE",   color:"#c87020",start:224,  end:651,  poly:[[42,40],[42,72],[22,72],[22,40]]},
  {name:"Rashidun Caliphate",       years:"632–661 CE",   color:"#8f5210",start:632,  end:661,  poly:[[40,30],[40,60],[14,60],[14,30]]},
  {name:"Umayyad Caliphate",        years:"661–750 CE",   color:"#b06010",start:661,  end:750,  poly:[[44,-9],[44,74],[14,74],[14,-9]]},
  {name:"Abbasid Caliphate",        years:"750–1258 CE",  color:"#2a6a20",start:750,  end:1258, poly:[[42,36],[42,76],[14,76],[14,36]]},
  {name:"Fatimid Caliphate",        years:"909–1171 CE",  color:"#2a9060",start:909,  end:1171, poly:[[38,18],[38,40],[22,40],[22,18]]},
  {name:"Buyid Dynasty",            years:"934–1055 CE",  color:"#7a4a00",start:934,  end:1055, poly:[[38,44],[38,60],[26,60],[26,44]]},
  {name:"Seljuk Empire",            years:"1037–1194 CE", color:"#c87820",start:1037, end:1194, poly:[[44,32],[44,72],[28,72],[28,32]]},
  {name:"Ayyubid Sultanate",        years:"1171–1341 CE", color:"#d09020",start:1171, end:1341, poly:[[40,28],[40,44],[18,44],[18,28]]},
  {name:"Mamluk Sultanate",         years:"1250–1517 CE", color:"#a05000",start:1250, end:1517, poly:[[36,24],[36,40],[20,40],[20,24]]},
  {name:"Mongol Empire / Ilkhanate",years:"1206–1368 CE", color:"#5a7a00",start:1206, end:1368, poly:[[56,26],[56,134],[28,134],[28,26]]},
  {name:"Timurid Empire",           years:"1370–1507 CE", color:"#d08040",start:1370, end:1507, poly:[[42,48],[42,80],[28,80],[28,48]]},
  {name:"Safavid Empire",           years:"1501–1736 CE", color:"#117a65",start:1501, end:1736, poly:[[40,44],[40,64],[26,64],[26,44]]},
  {name:"Ottoman Empire",           years:"1299–1922 CE", color:"#806030",start:1299, end:1922, poly:[[48,22],[48,60],[22,60],[22,22]]},
  {name:"Mughal Empire",            years:"1526–1857 CE", color:"#006858",start:1526, end:1857, poly:[[38,60],[38,96],[8,96],[8,60]]},
  {name:"Delhi Sultanate",          years:"1206–1526 CE", color:"#009898",start:1206, end:1526, poly:[[36,66],[36,92],[14,92],[14,66]]},
  {name:"Mali Empire",              years:"1235–1600 CE", color:"#904820",start:1235, end:1600, poly:[[20,-16],[20,6],[8,6],[8,-16]]},
  {name:"Sokoto Caliphate",         years:"1804–1903 CE", color:"#8a4020",start:1804, end:1903, poly:[[16,-4],[16,16],[8,16],[8,-4]]}
];

function _setMapHeight(){
  const c=document.getElementById('mapContainer');
  const lm=document.getElementById('leafletMap');
  if(c) c.style.height='100%';
  if(c&&lm){
    lm.style.height = c.offsetHeight + 'px';
    lm.style.width  = '100%';
  }
  if(_lMap) _lMap.invalidateSize();
}

function _getMapFiltered(){
  return PEOPLE.filter(p=>{
    if(!p.lat||!p.lng) return false;
    if(selTypes.size>0){
      const passType=selTypes.has(p.type);
      const passChain=(selTypes.has('Genealogy')||selTypes.has('Prophetic Lineage'))&&PROPHET_CHAIN.has(p.famous);
      const passTags=(p.tags||[]).some(t=>selTypes.has(t));
      const passIHSub=[...selTypes].some(st=>_IH_SUBLANE_REV[st]&&_IH_SUBLANE_REV[st].has(p.type));
      const passAshra=(selTypes.has('Ashra Mubashshara')||selTypes.has('Companions'))&&ASHRA_MUBASHSHARA.has(p.famous);
      if(!passType&&!passChain&&!passTags&&!passIHSub&&!passAshra) return false;
    }
    if(selTrads.size>0&&!selTrads.has(p.tradition)) return false;
    if(searchQ){
      const q=searchQ.toLowerCase();
      const hay=[p.famous,p.full,p.primaryTitle,p.city,p.classif,p.tradition,p.type,...(p.tags||[])].join(' ').toLowerCase();
      if(!hay.includes(q)) return false;
    }
    if(_mapYear!==null){
      const dod=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
      if(p.dob>_mapYear||dod<_mapYear) return false;
    }
    if(APP.filterFavsOnly && APP.Favorites){
      if(!APP.Favorites.has(p.famous)) return false;
    }
    return true;
  });
}

function _drawEmpiresOnMap(map, year, existingLayer, legendContainerId){
  if(!map) return null;
  if(existingLayer){ map.removeLayer(existingLayer); }
  if(year === null){ _removeEmpLegendFor(legendContainerId); return null; }
  var layer = L.layerGroup();
  var activeEmps = [];
  MAP_EMPIRES.forEach(function(em){
    if(em.start > year || em.end < year) return;
    var poly = L.polygon(em.poly, { color:em.color, weight:1.5, fillColor:em.color, fillOpacity:0.13, opacity:0.55, dashArray:'5,4' });
    layer.addLayer(poly);
    activeEmps.push({name:em.name, color:em.color});
  });
  layer.addTo(map);
  if(legendContainerId) _buildEmpLegendFor(legendContainerId, activeEmps);
  return layer;
}

function _drawEmpires(){
  if(!_lMap) return;
  if(_empLayer){_lMap.removeLayer(_empLayer);_empLayer=null;}
  if(_geoEmpOn && _geoEmpData && _mapYear!==null){
    var candidates=GEO_EMP_CENTURIES.filter(function(c){return +c <= _mapYear;});
    if(!candidates.length){
      if(_geoEmpLayer){_lMap.removeLayer(_geoEmpLayer);_geoEmpLayer=null;}
      _removeEmpLegend();
      if(_labTile){if(_lMap.hasLayer(_labTile)) _lMap.removeLayer(_labTile);_labTile.addTo(_lMap);}
      return;
    }
    _renderGeoEmpires(candidates[candidates.length-1]);
  }
  if(_labTile){
    if(_lMap.hasLayer(_labTile)) _lMap.removeLayer(_labTile);
    _labTile.addTo(_lMap);
  }
}

function _markerTypeColor(p){
  const t=p.type||'';
  if(t==='Prophet'||t==='Genealogy'||t==='Founder') return '#D4AF37';
  if(t==='Sahaba')    return '#d4784a';
  if(t==='Sahabiyya') return '#d4784a';
  if(t==="Tabi'un")   return '#c08850';
  if(t==='Mystic')    return '#a855f7';
  if(t==='Ruler'||t==='Caliph'||t==='Warrior') return '#e05040';
  if(t==='Scientist') return '#38bdf8';
  if(t==='Philosopher') return '#38bdf8';
  if(t==='Poet')      return '#e07090';
  return '#2ecc9b';
}

const MAP_LEGEND=[
  {label:'Prophet / Lineage', color:'#D4AF37'},
  {label:'Companions',        color:'#d4784a'},
  {label:'Followers',         color:'#c08850'},
  {label:'Mystic / Sufi',     color:'#a855f7'},
  {label:'Scholar / Jurist',  color:'#2ecc9b'},
  {label:'Ruler / Caliph',    color:'#e05040'},
  {label:'Scientist / Philosopher', color:'#38bdf8'},
  {label:'Poet',              color:'#e07090'}
];

function _makeMarker(p, showLabel){
  if(typeof showLabel === 'undefined') showLabel = false;
  const col=_markerTypeColor(p);
  const hasFree=(p.books||[]).some(b=>b.url&&b.url.startsWith('http'));
  const name=p.famous.length>22?p.famous.slice(0,20)+'…':p.famous;
  const isProphet=(p.type==='Prophet'||p.type==='Genealogy'||p.type==='Founder');
  const isTheProphet=(p.famous==='Prophet Muhammad');
  const dotSz=isProphet?14:9;
  const dotBorder=isProphet?'2.5px solid rgba(255,220,80,.55)':'2px solid rgba(30,20,8,.9)';
  const dotGlow=isProphet?`0 0 0 2px ${col}55,0 0 8px ${col}88`:`0 0 0 1px ${col}`;
  const anchor=Math.round(dotSz/2);
  const labelSize=isProphet?'12.5px':'10.5px';
  const labelColor=isProphet?'#D4AF37':'#FFFFFF';
  const labelVisible=(isTheProphet||showLabel)?'flex':'none';
  const icon = L.divIcon({
    html: `<div class="map-marker-wrap">
      <div class="map-marker-dot" style="
        width:${dotSz}px;height:${dotSz}px;
        background:${col};border:${dotBorder};box-shadow:${dotGlow};">
      </div>
      <div class="map-marker-label${isTheProphet?' prophet-marker-label':''}" style="
        display:${labelVisible};
        border-left-color:${col};
        font-size:${labelSize};
        font-weight:${isProphet?900:700};
        color:${labelColor};">
          ${hasFree?'✦ ':''}${name}
      </div>
    </div>`,
    className: '',
    iconSize: [160, 40],
    iconAnchor: [isTheProphet ? 80 : anchor, anchor]
  });
  var _jLoc=null;
  if(window._getJourneyLocation&&p.slug&&_mapYear!=null){
    _jLoc=window._getJourneyLocation(p.slug,_mapYear);
  }
  const _lat=_jLoc?_jLoc.lat:(p._renderLat!=null?p._renderLat:p.lat);
  const _lng=_jLoc?_jLoc.lng:(p._renderLng!=null?p._renderLng:p.lng);
  const m=L.marker([_lat,_lng],{icon, zIndexOffset: isTheProphet ? 9999 : 0});
  m.on('mouseover',e=>{
    const el=m.getElement()||(e&&e.originalEvent&&e.originalEvent.target?e.originalEvent.target.closest('.map-marker-wrap'):null);
    if(el){
      const lbl=el.querySelector('.map-marker-label');
      const dot=el.querySelector('.map-marker-dot');
      if(lbl&&!isTheProphet) lbl.style.display='flex';
      if(dot) dot.style.transform='scale(1.5)';
    }
    if(_mapTTPinned) return;
    _showMapHoverTT(p, e.originalEvent.clientX, e.originalEvent.clientY);
  });
  m.on('mousemove',e=>{
    if(!_mapTTPinned) _posMapTT(e.originalEvent.clientX, e.originalEvent.clientY);
  });
  m.on('mouseout',e=>{
    const el=m.getElement()||(e&&e.originalEvent&&e.originalEvent.target?e.originalEvent.target.closest('.map-marker-wrap'):null);
    if(el){
      const lbl=el.querySelector('.map-marker-label');
      const dot=el.querySelector('.map-marker-dot');
      if(lbl&&!isTheProphet) lbl.style.display='none';
      if(dot) dot.style.transform='';
    }
    if(!_mapTTPinned) _hideMapTT();
  });
  m.on('click',e=>{
    e.originalEvent.stopPropagation();
    if(_mapTTPinnedPerson===p.famous && _mapTTPinned){
      _openMapCard(p, e.originalEvent.clientX, e.originalEvent.clientY);
    } else {
      _pinMapTT(p, e.originalEvent.clientX, e.originalEvent.clientY);
    }
  });
  return m;
}

let _mapTT=null, _mapTTPinned=false, _mapTTPinnedPerson=null;

function _ensureMapTT(){
  if(_mapTT) return;
  _mapTT=document.createElement('div');
  _mapTT.id='map-tt';
  _mapTT.style.cssText='position:fixed;pointer-events:none;display:none;z-index:9999;'+
    'background:var(--surface2);border:1.5px solid var(--border);border-radius:4px;'+
    'padding:7px 12px;font-size:var(--fs-3);color:var(--text);'+
    'box-shadow:0 4px 22px rgba(0,0,0,.7);max-width:240px;line-height:1.5;transition:opacity .1s';
  document.body.appendChild(_mapTT);
}
function _mapTTContent(p, pinned){
  const col=_markerTypeColor(p);
  const _rd=(p.dob_academic!=null)?p.dob_academic:null;
  const dob_s=(_rd!=null)?(_rd<0?`${Math.abs(_rd)} BCE`:`${_rd} CE`):(p.dob_s||'—');
  const nT=(p.teachers||[]).length, nS=(PEOPLE.filter(s=>s.teachers?.includes(p.famous))).length;
  const hint=pinned?`<span style="font-size:var(--fs-3);opacity:.5;margin-left:5px">→ CLICK AGAIN FOR FULL INFO</span>`:'';
  return `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;font-size:var(--fs-3);margin-bottom:2px">${esc(p.famous)}${hint}</div>`+
    `<div style="font-family:'Crimson Pro',serif;font-size:var(--fs-3);color:var(--text2);font-style:normal;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
    `<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;color:var(--muted)">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
    (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.05em;color:rgba(212,175,55,.55);margin-top:3px">`+
      (nT?`↑ ${nT} teacher${nT>1?'s':''}  `:'')+( nS?`↓ ${nS} student${nS>1?'s':''}`:'')+`</div>`:'');
}
function _posMapTT(x, y){
  if(!_mapTT) return;
  const tw=240, th=100;
  let lx=x+16, ly=y-10;
  if(lx+tw>window.innerWidth-8) lx=x-tw-16;
  if(ly+th>window.innerHeight-8) ly=window.innerHeight-th-8;
  if(ly<8) ly=8;
  _mapTT.style.left=lx+'px'; _mapTT.style.top=ly+'px';
}
function _showMapHoverTT(p, x, y){
  _ensureMapTT();
  _mapTT.innerHTML=_mapTTContent(p, false);
  _mapTT.style.pointerEvents='none';
  _mapTT.style.display='block';
  _posMapTT(x, y);
}
function _pinMapTT(p, x, y){
  _ensureMapTT();
  _mapTTPinned=true;
  _mapTTPinnedPerson=p.famous;
  _mapTT.innerHTML=_mapTTContent(p, true);
  _mapTT.style.pointerEvents='all';
  _mapTT.style.display='block';
  _posMapTT(x, y);
}
function _hideMapTT(){ if(_mapTT){ _mapTT.style.display='none'; } }
function _unpinMapTT(){ _mapTTPinned=false; _mapTTPinnedPerson=null; _hideMapTT(); }

let _mapCardEl=null;

function _ensureMapCard(){
  if(_mapCardEl) return;
  _mapCardEl=document.createElement('div');
  _mapCardEl.id='mapDetailCard';
  _mapCardEl.style.cssText=
    'position:fixed;z-index:2001;width:310px;max-height:75vh;'+
    'background:var(--ip-bg);border:1.5px solid var(--border2);'+
    'border-top:3px solid var(--accent);border-radius:4px;'+
    'box-shadow:0 8px 40px rgba(0,0,0,.7);'+
    'display:none;flex-direction:column;overflow:hidden;'+
    'font-family:\'Crimson Pro\',serif;'+
    'opacity:0;transform:scale(.97) translateY(4px);transition:opacity .15s,transform .15s;';
  _mapCardEl.innerHTML=
    `<div id="mcHdr" style="padding:14px 16px 11px;border-bottom:1px solid var(--ip-brd);background:var(--ip-surf);flex-shrink:0;position:relative">
      <button id="mcClose" style="position:absolute;top:8px;right:10px;background:none;border:none;color:var(--muted);font-size:var(--fs-2);cursor:pointer;line-height:1">✕</button>
      <div id="mcName" style="font-family:'Cinzel',serif;font-size:var(--fs-2);font-weight:700;line-height:1.2;padding-right:22px"></div>
      <div id="mcSub" style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;margin-top:3px;line-height:1.45"></div>
    </div>
    <div id="mcScroll" style="flex:1;overflow-y:auto;padding:14px 16px 18px">
      <div id="mcBody"></div>
      <button id="mcTimelineBtn" style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;margin-top:12px;padding:6px 14px;border-radius:3px;cursor:pointer;background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.3);color:var(--accent);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em;transition:background .12s,border-color .12s">
        ↗ OPEN IN TIMELINE
      </button>
    </div>`;
  document.body.appendChild(_mapCardEl);
  // Wire close button (the inline onclick="_closeMapCard()" was bv-app's global; use a real handler).
  _mapCardEl.querySelector('#mcClose').addEventListener('click', _closeMapCard);
  const sc=_mapCardEl.querySelector('#mcScroll');
  sc.style.cssText+=';scrollbar-width:thin;';
}

var _mapTafsirByPlace = null;
var _mapTafsirLoading = false;
function _ensureMapTafsirXref(){
  if(_mapTafsirByPlace || _mapTafsirLoading) return;
  _mapTafsirLoading = true;
  fetch(dataUrl('data/islamic/xref/tafsir_xref_places.json'))
    .then(function(r){ return r.ok ? r.json() : null; })
    .then(function(j){
      _mapTafsirByPlace = j || {};
      _mapTafsirLoading = false;
      console.log('[MAP] tafsir xref places: loaded', Object.keys(_mapTafsirByPlace).length, 'places');
    })
    .catch(function(e){ _mapTafsirLoading = false; console.warn('[MAP] tafsir xref load failed', e); });
}
function _mapTafsirEntriesForPlace(name){
  if(!_mapTafsirByPlace || !name) return [];
  if(_mapTafsirByPlace[name]) return _mapTafsirByPlace[name];
  var lc = String(name).toLowerCase();
  var keys = Object.keys(_mapTafsirByPlace);
  for(var i=0;i<keys.length;i++){
    if(keys[i].toLowerCase() === lc) return _mapTafsirByPlace[keys[i]];
  }
  return [];
}

function _openMapCard(p, cx, cy){
  _ensureMapCard();
  const col=p.type==='Genealogy'?'#D4AF37':(CC[gc(p.dob)]||'#A0AEC0');
  document.getElementById('mcName').textContent=p.famous;
  document.getElementById('mcName').style.color=col;
  document.getElementById('mcSub').textContent=p.primaryTitle||p.tradition||'';

  const _rDob=(p.dob_academic!=null)?p.dob_academic:null;
  const _rDod=(p.dod_academic!=null)?p.dod_academic:null;
  const dob_s=(_rDob!=null)?(_rDob<0?`${Math.abs(_rDob)} BCE`:`${_rDob} CE`):(p.dob_s||'—');
  const dod_s=(_rDod!=null)?(_rDod<0?`${Math.abs(_rDod)} BCE`:`${_rDod} CE`):(p.dod_s||'—');
  const studentsOf=PEOPLE.filter(s=>s.teachers?.includes(p.famous));

  let html=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
    <span style="padding:2px 8px;border-radius:2px;font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;border:1px solid ${col}55;color:${col}">${esc(p.type||'')}</span>
    <span style="padding:2px 8px;border-radius:2px;font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;border:1px solid var(--ip-brd);color:var(--ip-muted)">${esc(p.tradition||'')}</span>
    ${p.city?`<span style="padding:2px 8px;border-radius:2px;font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;border:1px solid var(--ip-brd);color:var(--ip-muted)">📍 ${esc(p.city)}</span>`:''}
  </div>
  ${(()=>{if(!window._wikidata||!window._wikidata[p.slug]||!window._wikidata[p.slug].occupations||!window._WD_OCC_LABELS) return '';const chips=window._wikidata[p.slug].occupations.slice(0,5).map(q=>window._WD_OCC_LABELS[q]).filter(Boolean);if(!chips.length) return '';return '<div class="map-wd-occupations">'+chips.map(l=>'<span class="map-wd-occ">'+esc(l)+'</span>').join('')+'</div>';})()}
  <div style="display:flex;gap:14px;margin-bottom:10px">
    <div><span style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em;color:var(--ip-muted);display:block">BORN</span><span style="font-size:var(--fs-3);font-weight:500;color:${col}">${dob_s}</span></div>
    <div><span style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em;color:var(--ip-muted);display:block">DIED</span><span style="font-size:var(--fs-3);font-weight:500;color:${col}">${dod_s}</span></div>
  </div>
  ${p.school?`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">BIOGRAPHY<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div><p style="font-size:var(--fs-3);line-height:1.65;color:var(--ip-text)">${esc(p.school)}</p>`:''}`;

  if(p.teachers?.length){
    const known=p.teachers.filter(t=>PEOPLE.find(pp=>pp.famous===t));
    if(known.length){
      html+=`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">TEACHERS<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${known.map(t=>`<span style="padding:3px 9px;background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;font-size:var(--fs-3);color:var(--ip-text);cursor:pointer" onclick="window.jumpTo('${t.replace(/'/g,"\\'")}');">⟵ ${esc(t)}</span>`).join('')}</div>`;
    }
  }
  if(studentsOf.length){
    html+=`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">STUDENTS (${studentsOf.length})<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>
    <div style="display:flex;flex-wrap:wrap;gap:5px">${studentsOf.map(s=>`<span style="padding:3px 9px;background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;font-size:var(--fs-3);color:var(--ip-text);cursor:pointer" onclick="window.jumpTo('${s.famous.replace(/'/g,"\\'")}');">▶ ${esc(s.famous)}</span>`).join('')}</div>`;
  }
  if(p.books?.length){
    const sortedBooks=[...p.books].sort((a,b)=>/quran/i.test(a.title)?-1:/quran/i.test(b.title)?1:0);
    html+=`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">WORKS & SOURCES<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>`;
    sortedBooks.forEach(b=>{
      html+=`<div style="margin-bottom:7px;font-size:var(--fs-3);color:var(--ip-text)">`+
        (b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">${esc(b.title)}</a>`:`<span>${esc(b.title)}</span>`)+
        (b.magnum?` <span style="color:var(--accent);font-size:var(--fs-3)">✦</span>`:'')+
        (b.note?`<div style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;margin-top:1px">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">quran.com</a>')}</div>`:'')+
        `</div>`;
    });
  }
  if(window._wikidata&&window._wikidata[p.slug]&&window._wikidata[p.slug].wikipedia&&window._wikidata[p.slug].wikipedia.en){
    html+=`<a class="map-wiki-link" href="https://en.wikipedia.org/wiki/${encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Wikipedia ↗</a>`;
  }

  if(p.city){
    var _mtEntries = _mapTafsirEntriesForPlace(p.city);
    if(_mtEntries.length){
      html += '<div style="margin:10px 0 4px"><span class="map-tafsir-chip" data-place="'+esc(p.city).replace(/"/g,'&quot;')+'" style="display:inline-block;padding:3px 10px;background:rgba(192,132,252,0.10);border:1px solid rgba(192,132,252,0.45);border-radius:2px;color:#c084fc;font-size:var(--fs-3);cursor:pointer;font-family:\'Cinzel\',serif;letter-spacing:.06em">'
        + _mtEntries.length + ' tafsir mention' + (_mtEntries.length===1?'':'s') + ' of ' + esc(p.city)
        + '</span></div>';
    }
  }
  document.getElementById('mcBody').innerHTML=html;
  document.getElementById('mcScroll').scrollTop=0;
  document.getElementById('mcTimelineBtn').onclick=()=>{ _closeMapCard(); _unpinMapTT(); window.focusPersonInTimeline(p.famous); };
  var _mtChip = document.querySelector('#mcBody .map-tafsir-chip');
  if(_mtChip){
    _mtChip.onclick = function(e){
      e.stopPropagation();
      var place = _mtChip.getAttribute('data-place') || '';
      var entries = _mapTafsirEntriesForPlace(place);
      if(!entries.length) return;
      _closeMapCard();
      window._stPendingPinnedTafsir = { entries: entries.slice(), label: place };
      var candidates = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="explain"], .tab-explain');
      for(var i=0;i<candidates.length;i++){
        var el = candidates[i];
        var txt = (el.textContent||'').trim().toUpperCase();
        var dv = el.getAttribute('data-view')||'';
        if(txt === 'EXPLAIN' || dv === 'explain'){ el.click(); return; }
      }
      if(typeof setView==='function') setView('explain');
    };
  }

  _mapCardEl.style.display='flex';
  requestAnimationFrame(()=>{
    const CW=_mapCardEl.offsetWidth||310, CH=Math.min(_mapCardEl.offsetHeight,window.innerHeight*0.75);
    const vw=window.innerWidth, vh=window.innerHeight;
    let left=cx+16, top=cy-40;
    if(left+CW>vw-10) left=cx-CW-16;
    if(top+CH>vh-10) top=vh-CH-10;
    if(top<8) top=8; if(left<8) left=8;
    _mapCardEl.style.left=left+'px'; _mapCardEl.style.top=top+'px';
    _mapCardEl.style.maxHeight=Math.min(window.innerHeight*0.75,640)+'px';
    _mapCardEl.style.opacity='1';
    _mapCardEl.style.transform='scale(1) translateY(0)';
  });
}

function _closeMapCard(){
  if(!_mapCardEl) return;
  _mapCardEl.style.opacity='0';
  _mapCardEl.style.transform='scale(.97) translateY(4px)';
  setTimeout(()=>{ if(_mapCardEl) _mapCardEl.style.display='none'; },160);
}
window._closeMapCard = _closeMapCard;

// Label-spread state. Replaces the prior cluster-with-number-badge system.
var _mapLabelOverlay = null;        // <div> over the map containing chips + SVG
var _mapLabelChips   = [];          // [{p, x, y, w, h, dotX, dotY}, ...]
var _mapLabelHoverEl = null;        // temp chip rendered on dot hover
var _mapMoveDebounce = null;
var _MAP_LABEL_MAX   = 30;          // top-N labelled by importance per viewport

function _figRank(p){
  if(p && p.famous === 'Prophet Muhammad') return 0;
  var t = (p && p.type) || '';
  if(t === 'Prophet')   return 1;
  if(t === 'Genealogy') return 2;
  if(t === 'Founder')   return 3;
  if(t === 'Companion') return 4;
  if(t === 'Scholar')   return 5;
  return 9;
}

function _ensureLabelOverlay(){
  var mapEl = document.getElementById('leafletMap');
  if(!mapEl) return null;
  if(_mapLabelOverlay && _mapLabelOverlay.parentNode === mapEl) return _mapLabelOverlay;
  var ov = document.createElement('div');
  ov.className = 'map-label-spread';
  var svgNS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('class', 'map-label-svg');
  ov.appendChild(svg);
  mapEl.appendChild(ov);
  _mapLabelOverlay = ov;
  return ov;
}

function _clearLabelOverlay(){
  if(!_mapLabelOverlay) return;
  // Keep the overlay element; clear its contents.
  var keepSvg = _mapLabelOverlay.querySelector('svg');
  _mapLabelOverlay.innerHTML = '';
  if(keepSvg){
    while(keepSvg.firstChild) keepSvg.removeChild(keepSvg.firstChild);
    _mapLabelOverlay.appendChild(keepSvg);
  }
}

function _placeMapLabels(){
  if(!_lMap) return;
  var mapEl = document.getElementById('leafletMap');
  if(!mapEl) return;
  var ov = _ensureLabelOverlay();
  if(!ov) return;
  _clearLabelOverlay();
  _mapLabelChips = [];

  var rect = mapEl.getBoundingClientRect();
  var W = rect.width, H = rect.height;
  if(W < 50 || H < 50) return;

  var pts = _getMapFiltered();
  // Filter to in-viewport, project to screen.
  var bounds = _lMap.getBounds();
  var dots = [];
  pts.forEach(function(p){
    if(p.lat < bounds.getSouth() || p.lat > bounds.getNorth()) return;
    if(p.lng < bounds.getWest()  || p.lng > bounds.getEast())  return;
    var pt;
    try { pt = _lMap.latLngToContainerPoint([p.lat, p.lng]); } catch(e){ return; }
    if(pt.x < -20 || pt.x > W + 20 || pt.y < -20 || pt.y > H + 20) return;
    dots.push({p:p, dotX:pt.x, dotY:pt.y});
  });

  // Pick top-N by importance for labelling.
  var ranked = dots.slice().sort(function(a,b){
    var d = _figRank(a.p) - _figRank(b.p);
    return d !== 0 ? d : (a.p.famous||'').localeCompare(b.p.famous||'');
  });
  var labelled = ranked.slice(0, _MAP_LABEL_MAX);

  // Build initial chip rectangles. Pick a starting offset that points
  // toward the empty side of the map relative to the dot.
  var chips = [];
  labelled.forEach(function(d){
    var name = d.p.famous || '';
    var w = Math.min(160, Math.max(48, 7 * Math.min(name.length, 22) + 16));
    var h = 22;
    // Initial offset: 30px outward along whichever axis has more space.
    var rightSpace = W - d.dotX, leftSpace = d.dotX;
    var aboveSpace = d.dotY,    belowSpace = H - d.dotY;
    var offX, offY;
    if(rightSpace >= leftSpace) offX = 30;
    else                        offX = -30 - w;
    if(belowSpace >= aboveSpace) offY = 18;
    else                         offY = -18 - h;
    var x = d.dotX + offX;
    var y = d.dotY + offY;
    // Clamp into viewport with 4px padding.
    x = Math.max(4, Math.min(W - w - 4, x));
    y = Math.max(4, Math.min(H - h - 4, y));
    chips.push({p:d.p, name:name, dotX:d.dotX, dotY:d.dotY, x:x, y:y, w:w, h:h, rank:_figRank(d.p)});
  });

  // Iterative resolver — push lower-rank chips out of overlaps.
  var ITERS = 50;
  for(var k = 0; k < ITERS; k++){
    var moved = false;
    for(var i = 0; i < chips.length; i++){
      var a = chips[i];
      var dx = 0, dy = 0;
      for(var j = 0; j < chips.length; j++){
        if(i === j) continue;
        var b = chips[j];
        var ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        var oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if(ox > 0 && oy > 0){
          // Lower rank yields more (higher rank value = lower importance).
          var weight = (a.rank > b.rank) ? 1.0 : (a.rank < b.rank ? 0.0 : 0.5);
          if(weight === 0) continue;
          if(ox < oy){
            dx += (a.x + a.w/2 < b.x + b.w/2 ? -1 : 1) * ox * weight * 1.05;
          } else {
            dy += (a.y + a.h/2 < b.y + b.h/2 ? -1 : 1) * oy * weight * 1.05;
          }
          moved = true;
        }
      }
      // Repulse from any nearby dot (avoid sitting on a different figure's dot).
      for(var d2 = 0; d2 < dots.length; d2++){
        var dt = dots[d2];
        if(dt.dotX >= a.x - 3 && dt.dotX <= a.x + a.w + 3 &&
           dt.dotY >= a.y - 3 && dt.dotY <= a.y + a.h + 3){
          // Skip pushing away from own dot.
          if(Math.abs(dt.dotX - a.dotX) < 0.5 && Math.abs(dt.dotY - a.dotY) < 0.5) continue;
          dy -= (a.h/2 + 4);
          moved = true;
        }
      }
      if(dx !== 0 || dy !== 0){
        a.x += dx; a.y += dy;
        a.x = Math.max(4, Math.min(W - a.w - 4, a.x));
        a.y = Math.max(4, Math.min(H - a.h - 4, a.y));
      }
    }
    if(!moved) break;
  }

  _mapLabelChips = chips;

  // Render SVG leader lines + chip elements.
  var svg = ov.querySelector('svg');
  if(svg){
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.width  = W + 'px';
    svg.style.height = H + 'px';
  }
  var svgNS = 'http://www.w3.org/2000/svg';
  chips.forEach(function(c){
    // Leader line from chip's nearest edge midpoint to dot.
    var cx = c.x + c.w/2, cy = c.y + c.h/2;
    var endX, endY;
    if(c.dotX < c.x)              { endX = c.x;          endY = cy; }
    else if(c.dotX > c.x + c.w)   { endX = c.x + c.w;    endY = cy; }
    else if(c.dotY < c.y)         { endX = cx;           endY = c.y; }
    else                          { endX = cx;           endY = c.y + c.h; }
    if(svg){
      var line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', c.dotX); line.setAttribute('y1', c.dotY);
      line.setAttribute('x2', endX);   line.setAttribute('y2', endY);
      line.setAttribute('stroke', 'rgba(212,175,55,0.55)');
      line.setAttribute('stroke-width', '1');
      svg.appendChild(line);
    }
    var chip = document.createElement('div');
    chip.className = 'map-label-chip';
    chip.textContent = c.name;
    chip.title = c.name;
    chip.style.left = c.x + 'px';
    chip.style.top  = c.y + 'px';
    chip.style.width = c.w + 'px';
    (function(p){
      chip.addEventListener('click', function(e){
        e.stopPropagation();
        if(typeof _showMapHoverTT === 'function'){
          var r = mapEl.getBoundingClientRect();
          _showMapHoverTT(p, r.left + (c.dotX), r.top + (c.dotY));
        }
      });
    })(c.p);
    ov.appendChild(chip);
  });
}

function _showHoverChip(p, dotX, dotY){
  if(_mapLabelHoverEl){ _mapLabelHoverEl.remove(); _mapLabelHoverEl = null; }
  // Skip if this figure is already labelled.
  for(var i = 0; i < _mapLabelChips.length; i++){
    if(_mapLabelChips[i].p === p) return;
  }
  var ov = _ensureLabelOverlay();
  if(!ov) return;
  var chip = document.createElement('div');
  chip.className = 'map-label-chip is-hover-temp';
  chip.textContent = p.famous || '';
  chip.style.left = (dotX + 14) + 'px';
  chip.style.top  = (dotY - 24) + 'px';
  ov.appendChild(chip);
  _mapLabelHoverEl = chip;
}
function _hideHoverChip(){
  if(_mapLabelHoverEl){ _mapLabelHoverEl.remove(); _mapLabelHoverEl = null; }
}

function _renderMarkers(){
  if(!_lMap) return;
  if(_mrkLayer){_lMap.removeLayer(_mrkLayer);_mrkLayer=null;}
  _hideHoverChip();

  const pts = _getMapFiltered();
  // Render each figure as a dot-only marker (no in-icon label).
  // The label-spread overlay handles names separately.
  var layers = pts.map(function(p){
    var m = _makeMarker(p, false);
    m.on('mouseover', function(e){
      try {
        var pt = _lMap.latLngToContainerPoint([p.lat, p.lng]);
        _showHoverChip(p, pt.x, pt.y);
      } catch(err){}
    });
    m.on('mouseout', function(){ _hideHoverChip(); });
    return m;
  });
  _mrkLayer = L.layerGroup(layers).addTo(_lMap);
  _updateArrows();
  _placeMapLabels();
}

function _updateArrows(){
  if(!_lMap) return;
  const mapEl=document.getElementById('leafletMap');
  if(!mapEl) return;
  mapEl.querySelectorAll('.map-arrow').forEach(e=>e.remove());
  const bounds=_lMap.getBounds();
  const all=_getMapFiltered();
  const dirs={N:0,NE:0,E:0,SE:0,S:0,SW:0,W:0,NW:0};
  const colDir={N:{},NE:{},E:{},SE:{},S:{},SW:{},W:{},NW:{}};
  all.forEach(p=>{
    const iLat=p.lat>=bounds.getSouth()&&p.lat<=bounds.getNorth();
    const iLng=p.lng>=bounds.getWest()&&p.lng<=bounds.getEast();
    if(iLat&&iLng) return;
    const dLat=p.lat-(bounds.getSouth()+bounds.getNorth())/2;
    const dLng=p.lng-(bounds.getWest()+bounds.getEast())/2;
    const ang=Math.atan2(dLng,dLat)*180/Math.PI;
    let d;
    if(ang>157.5||ang<=-157.5)d='S';
    else if(ang>-157.5&&ang<=-112.5)d='SW';
    else if(ang>-112.5&&ang<=-67.5)d='W';
    else if(ang>-67.5&&ang<=-22.5)d='NW';
    else if(ang>-22.5&&ang<=22.5)d='N';
    else if(ang>22.5&&ang<=67.5)d='NE';
    else if(ang>67.5&&ang<=112.5)d='E';
    else d='SE';
    dirs[d]++;
    const col=p.type==='Genealogy'?'#D4AF37':(CC[gc(p.dob)]||'#A0AEC0');
    colDir[d][col]=(colDir[d][col]||0)+1;
  });
  const ac={N:'↑',NE:'↗',E:'→',SE:'↘',S:'↓',SW:'↙',W:'←',NW:'↖'};
  const pos={
    N:'top:8px;left:50%;transform:translateX(-50%)',
    NE:'top:8px;right:8px',E:'top:50%;right:8px;transform:translateY(-50%)',
    SE:'bottom:80px;right:8px',S:'bottom:80px;left:50%;transform:translateX(-50%)',
    SW:'bottom:80px;left:8px',W:'top:50%;left:8px;transform:translateY(-50%)',
    NW:'top:8px;left:8px'
  };
  Object.entries(dirs).forEach(([d,n])=>{
    if(!n) return;
    const topCol=Object.entries(colDir[d]).sort((a,b)=>b[1]-a[1])[0]?.[0]||'#A0AEC0';
    const el=document.createElement('div');
    el.className='map-arrow';
    el.style.cssText=pos[d]+`;border-color:${topCol};color:${topCol};`;
    el.innerHTML=`<span>${ac[d]}</span>${n}`;
    mapEl.appendChild(el);
  });
}

function _applyMapYear(yr){
  _mapYear=yr;
  _drawEmpires();
  _renderMarkers();
}

function _initMapLegend(){
  const items=document.getElementById('mapLegendItems');
  if(!items||items.children.length) return;
  items.innerHTML=MAP_LEGEND.map(e=>
    `<div class="map-legend-row">
      <div class="map-legend-dot" style="background:${e.color};box-shadow:0 0 0 1px ${e.color}55"></div>
      <div class="map-legend-txt">${e.label}</div>
    </div>`
  ).join('');
}

function toggleMapLegend(){
  const body=document.getElementById('mapLegendBody');
  const label=document.getElementById('mapLegendLabel');
  if(!body) return;
  _initMapLegend();
  const open=body.classList.toggle('open');
  if(label) label.textContent=open?'CLOSE':'LEGEND';
}
window.toggleMapLegend = toggleMapLegend;

function _loadGeoEmpires(cb){
  if(_geoEmpData){cb();return;}
  fetch(dataUrl('data/islamic/empire_overlays.json'))
    .then(function(r){return r.json();})
    .then(function(j){
      _geoEmpData=j||{};
      GEO_EMP_CENTURIES=Object.keys(_geoEmpData).sort(function(a,b){return +a - +b;});
      cb();
    })
    .catch(function(){_geoEmpData={};GEO_EMP_CENTURIES=[];cb();});
}

function _renderGeoEmpires(century){
  if(!_lMap) return;
  if(_geoEmpLayer){_lMap.removeLayer(_geoEmpLayer);_geoEmpLayer=null;}
  var items=(_geoEmpData&&_geoEmpData[century])||[];
  if(!items.length){_removeEmpLegend();return;}
  var fc={type:'FeatureCollection',features:items.map(function(it){
    return {type:'Feature',properties:{name:it.name,color:it.color},geometry:it.geometry};
  })};
  _geoEmpLayer=L.geoJSON(fc,{
    style:function(f){return{fillColor:f.properties.color,fillOpacity:0.25,color:f.properties.color,weight:1.5,opacity:0.5};}
  }).addTo(_lMap);
  _buildEmpLegend(items);
  if(_labTile){
    if(_lMap.hasLayer(_labTile)) _lMap.removeLayer(_labTile);
    _labTile.addTo(_lMap);
  }
}
function _buildEmpLegend(items){
  var colored=items.filter(function(it){
    var m=(it.color||'').match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if(!m)return false;
    var r=parseInt(m[1],16),g=parseInt(m[2],16),b=parseInt(m[3],16);
    return(Math.max(r,g,b)-Math.min(r,g,b))>35;
  });
  var el=document.getElementById('empOverlayLegend');
  if(!colored.length){_removeEmpLegend();return;}
  if(!el){
    el=document.createElement('div');el.id='empOverlayLegend';
    el.style.cssText="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:800;display:flex;flex-wrap:wrap;gap:4px 10px;padding:6px 14px;background:rgba(0,0,0,0.85);border:1px solid rgba(212,175,55,0.3);border-radius:4px;max-width:90%;justify-content:center;";
    var mc=document.getElementById('mapContainer');
    if(mc)mc.appendChild(el);
  }
  el.innerHTML=colored.map(function(it){
    return '<div style="display:flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:2px;background:'+it.color+';flex-shrink:0;opacity:0.9"></span><span style="font-family:Cinzel,serif;font-size:var(--fs-3);color:#ccc;letter-spacing:.04em;white-space:nowrap">'+it.name+'</span></div>';
  }).join('');
}
function _removeEmpLegend(){ var el=document.getElementById('empOverlayLegend'); if(el)el.remove(); }

function _buildEmpLegendFor(containerId, items){
  var legId='empLeg-'+containerId;
  var colored=items.filter(function(it){
    var m=(it.color||'').match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if(!m)return false;
    var r=parseInt(m[1],16),g=parseInt(m[2],16),b=parseInt(m[3],16);
    return(Math.max(r,g,b)-Math.min(r,g,b))>35;
  });
  var el=document.getElementById(legId);
  if(!colored.length){if(el)el.remove();return;}
  if(!el){
    el=document.createElement('div');el.id=legId;
    el.style.cssText="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:800;display:flex;flex-wrap:wrap;gap:4px 10px;padding:6px 14px;background:rgba(0,0,0,0.85);border:1px solid rgba(212,175,55,0.3);border-radius:4px;max-width:90%;justify-content:center;";
    var mc=document.getElementById(containerId);
    if(mc){mc.style.position=mc.style.position||'relative';mc.appendChild(el);}
  }
  el.innerHTML=colored.map(function(it){
    return '<div style="display:flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:2px;background:'+it.color+';flex-shrink:0;opacity:0.9"></span><span style="font-family:Cinzel,serif;font-size:var(--fs-3);color:#ccc;letter-spacing:.04em;white-space:nowrap">'+it.name+'</span></div>';
  }).join('');
}
function _removeEmpLegendFor(containerId){
  if(!containerId)return;
  var el=document.getElementById('empLeg-'+containerId);
  if(el)el.remove();
}
window._buildEmpLegendFor=_buildEmpLegendFor;
window._removeEmpLegendFor=_removeEmpLegendFor;

function _buildEmpireToggle(){
  var toolbar=document.getElementById('mapToolbar');
  if(!toolbar||document.getElementById('geoEmpToggle')) return;
  if(!document.getElementById('geoEmpTtStyles')){
    var st=document.createElement('style');st.id='geoEmpTtStyles';
    st.textContent=".geo-emp-tt{background:rgba(0,0,0,0.85) !important;border:1px solid #D4AF37 !important;color:#fff !important;font-family:'Cinzel',serif !important;font-size:var(--fs-3) !important;font-weight:700 !important;letter-spacing:.06em !important;padding:5px 12px !important;border-radius:4px !important;box-shadow:0 0 10px rgba(0,0,0,.6) !important;white-space:nowrap !important}.geo-emp-tt::before{display:none !important}";
    document.head.appendChild(st);
  }
  var btn=document.createElement('button');
  btn.id='geoEmpToggle';
  btn.textContent='Empires';
  btn.style.cssText="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;cursor:pointer;transition:.2s;margin-left:8px";
  btn.onmouseover=function(){if(!_geoEmpOn){this.style.borderColor='#D4AF37';this.style.color='#D4AF37';}};
  btn.onmouseout=function(){if(!_geoEmpOn){this.style.borderColor='#555';this.style.color='#888';}};
  function _setActive(on){
    _geoEmpOn=on;
    btn.style.background=on?'rgba(212,175,55,0.15)':'transparent';
    btn.style.borderColor=on?'#D4AF37':'#555';
    btn.style.color=on?'#D4AF37':'#888';
    btn.textContent=on?'Empires ✕':'Empires';
  }
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    if(!_geoEmpOn){
      if(!_geoEmpData){
        btn.textContent='Loading…';btn.style.color='#D4AF37';btn.style.borderColor='#D4AF37';
        _loadGeoEmpires(function(){ _setActive(true); _drawEmpires(); });
      } else {
        _setActive(true); _drawEmpires();
      }
    } else {
      _setActive(false);
      if(_geoEmpLayer){_lMap.removeLayer(_geoEmpLayer);_geoEmpLayer=null;}
      _removeEmpLegend();
    }
  });
  var animMount=document.getElementById('map-anim-mount');
  if(animMount) toolbar.insertBefore(btn,animMount);
  else toolbar.appendChild(btn);
}

function renderMap(){
  if(typeof L==='undefined'){
    const scr=document.createElement('script');
    scr.src='https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    scr.onload=()=>_doRenderMap();
    scr.onerror=()=>{
      const s2=document.createElement('script');
      s2.src='https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      s2.onload=()=>_doRenderMap();
      document.head.appendChild(s2);
    };
    document.head.appendChild(scr);
    var lf = document.getElementById('leafletMap');
    if(lf) lf.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Cinzel,serif;font-size:var(--fs-3);color:#A0AEC0;letter-spacing:.1em">LOADING MAP…</div>';
    return;
  }
  _doRenderMap();
}

function _doRenderMap(){
  _setMapHeight();
  if(!_lMap){
    _lMap=L.map('leafletMap',{
      center:[30,45],zoom:3,zoomControl:true,minZoom:2,maxZoom:10,
      maxBounds:[[-85,-180],[85,180]],maxBoundsViscosity:1.0
    });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}{r}.png',{
      subdomains:'abcd',
      attribution:'© <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom:19
    }).addTo(_lMap);
    fetch('https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r=>r.json())
      .then(geo=>{
        if(!_lMap) return;
        L.geoJSON(geo,{style:{color:'#7a8a72',weight:0.8,fillOpacity:0,opacity:0.8}}).addTo(_lMap);
      }).catch(()=>{});
    _labTile=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',{
      subdomains:'abcd',maxZoom:19,opacity:1
    });
    _lMap.on('moveend zoomend', _updateArrows);
    // Zoom triggers a full re-render (markers + label spread).
    _lMap.on('zoomend', function(){ try { _renderMarkers(); } catch(e){} });
    // Pan reflows labels only — debounced so dragging stays smooth.
    _lMap.on('moveend', function(){
      if(_mapMoveDebounce) clearTimeout(_mapMoveDebounce);
      _mapMoveDebounce = setTimeout(function(){
        try { _placeMapLabels(); } catch(e){}
      }, 200);
    });
    // Hide hover chip / clear leader lines during interactive drag.
    _lMap.on('movestart zoomstart', function(){
      _hideHoverChip();
      if(_mapLabelOverlay){ _clearLabelOverlay(); }
    });
  }

  if(_geoEmpOn && _geoEmpData) _drawEmpires();
  _renderMarkers();

  const pts=_getMapFiltered();
  if(pts.length>0&&!_lMap._hasFit){
    _lMap._hasFit=true;
    try{_lMap.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lng])).pad(0.1));}catch(e){}
  }
  setTimeout(()=>{if(_lMap)_lMap.invalidateSize();},300);

  var oldGroup=document.querySelector('.map-anim-group');
  if(oldGroup) oldGroup.style.display='none';
  var oldEmp=document.getElementById('geoEmpToggle');
  if(oldEmp) oldEmp.style.display='none';
}

// Per-year tick interval (ms). Spec: 0.5x→200, 1x→100, 2x→50, 4x→25.
let _mapAnimTimer=null, _mapAnimMode='stopped', _mapAnimYr=500, _mapAnimSpeedMs=100, _mapAnimCtl=null;

function _mapAnimPlay(){
  if(typeof window._setSliderYear!=='function') return;
  if(_mapAnimMode==='stopped'){
    // Spec: start year = 500 (fixed) on fresh play. Resume from current year on pause.
    _mapAnimYr=500;
  }
  _mapAnimMode='playing';
  // Push the starting year to the slider immediately so the thumb jumps left.
  if(typeof window._setSliderYear === 'function') window._setSliderYear(_mapAnimYr);
  _mapAnimTimer=setTimeout(_mapAnimNextStep,_mapAnimSpeedMs);
}

function _mapAnimPause(){
  _mapAnimMode='paused';
  if(_mapAnimTimer){clearTimeout(_mapAnimTimer);_mapAnimTimer=null;}
}

function _mapAnimNextStep(){
  if(_mapAnimMode!=='playing') return;
  _mapAnimYr+=1;
  if(_mapAnimYr>2000){_mapAnimStop();return;}
  if(typeof window._setSliderYear === 'function') window._setSliderYear(_mapAnimYr);
  _mapAnimTimer=setTimeout(_mapAnimNextStep,_mapAnimSpeedMs);
}

function _mapAnimStop(){
  _mapAnimMode='stopped';
  if(_mapAnimTimer){clearTimeout(_mapAnimTimer);_mapAnimTimer=null;}
  _mapAnimYr=500;
  if(typeof window._setSliderYear === 'function') window._setSliderYear(500);
  // Spec: animation stop → return slider to inactive silver state.
  // Also flip the year-clear button + display back to default.
  try {
    var st = document.getElementById('sliderTrack');
    if(st) st.classList.add('sl-inactive');
    var ycb = document.getElementById('yearClearBtn');
    if(ycb) ycb.classList.remove('active');
    var yd = document.getElementById('yearDisplay');
    if(yd) yd.innerHTML = '&mdash;';
  } catch(e){}
  if(_mapAnimCtl) _mapAnimCtl.forceStop();
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

  // Lazy-load Leaflet CSS once.
  function _ensureLeafletCSS(){
    if(document.querySelector('link[data-map-leaflet]')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
    link.setAttribute('data-map-leaflet','1');
    document.head.appendChild(link);
  }

  // Document-level click handlers (mirroring bv-app behavior). Stored on window
  // so we can detach in unmount() and avoid leaking handlers across re-mounts.
  function _bindOutsideClickHandlers(){
    if(window._mapOutsideClickBound) return;
    window._mapOutsideClickBound = true;
    window._mapOutsideClickHandler = function(e){
      // Close pinned tooltip on outside click.
      if(_mapTTPinned && !e.target.closest('#map-tt') && !e.target.closest('.leaflet-marker-icon')){
        _unpinMapTT();
        _closeMapCard();
      }
      // Close detail card on outside click.
      if(_mapCardEl && _mapCardEl.style.display !== 'none'
        && !_mapCardEl.contains(e.target) && !e.target.closest('.leaflet-marker-icon')){
        _closeMapCard();
      }
    };
    document.addEventListener('click', window._mapOutsideClickHandler);
  }

  // Wire shell's Zone B controls — MAP spec:
  // { search:true, filters:[Type, Tradition], actions:[Recenter pill], htw:true }
  function _wireZoneB(zoneBEl){
    var searchInp = document.getElementById('search');
    if(searchInp){
      searchInp.placeholder = 'Search figures…';
      searchInp.addEventListener('input', function(){
        window.searchQ = searchInp.value || '';
        _renderMarkers();
      });
    }

    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;
    var selects = row2.querySelectorAll('.zb-select');
    var pills   = row2.querySelectorAll('.zb-pill');

    // Type / Tradition — sandbox shim: no in-view picker exists for MAP standalone,
    // so click is parked. Visual zb-active toggle still fires via shell.bindActiveToggle.
    // The filter sets are populated by SILSILA when that view runs; clicking those
    // filters there will reflect in MAP via window.selTypes/selTrads on next render.
    void selects; // intentional: parked

    // Recenter pill — fit map to filtered points.
    if(pills[0]){
      pills[0].addEventListener('click', function(){
        if(!_lMap) return;
        var pts = _getMapFiltered().map(function(p){ return [p.lat, p.lng]; });
        if(pts.length){
          try { _lMap.fitBounds(L.latLngBounds(pts).pad(0.1), { animate:true }); } catch(e){}
        } else {
          try { _lMap.setView([30,45], 3, { animate:true }); } catch(e){}
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function _injectScaffold(zoneCEl){
    zoneCEl.innerHTML =
      '<div id="mapView" class="active">' +
        '<div id="mapToolbar"></div>' +
        '<div id="mapContainer">' +
          '<div id="leafletMap"></div>' +
          '<div class="map-legend">' +
            '<button id="mapLegendToggle" onclick="window.toggleMapLegend()"><span id="mapLegendLabel">LEGEND</span></button>' +
            '<div id="mapLegendBody"><div id="mapLegendItems"></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('mp-mounted');
    _ensureLeafletCSS();
    _injectScaffold(zoneCEl);

    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });

    Promise.all([p1]).then(function(){
      PEOPLE = window.PEOPLE || [];
      _bindOutsideClickHandlers();
      renderMap();
      _wireZoneB(zoneBEl);
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('mp-mounted');

    try { _mapAnimStop(); } catch(e) {}
    _unpinMapTT();
    _closeMapCard();

    if(window._mapOutsideClickBound && window._mapOutsideClickHandler){
      document.removeEventListener('click', window._mapOutsideClickHandler);
      window._mapOutsideClickBound = false;
      window._mapOutsideClickHandler = null;
    }

    // Tear down Leaflet so re-mount creates a fresh instance.
    if(_lMap){
      try { _lMap.remove(); } catch(e) {}
      _lMap = null;
    }
    _empLayer = null; _mrkLayer = null; _labTile = null;
    _geoEmpLayer = null; _geoEmpOn = false;
    _mapAnimCtl = null;

    // Drop floating UI added to document.body.
    if(_mapTT && _mapTT.parentNode){ _mapTT.parentNode.removeChild(_mapTT); _mapTT = null; }
    if(_mapCardEl && _mapCardEl.parentNode){ _mapCardEl.parentNode.removeChild(_mapCardEl); _mapCardEl = null; }
    var ov = document.getElementById('map-method-overlay'); if(ov) ov.remove();

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

// ═══════════════════════════════════════════════════════════
// SANDBOX SHELL WIRING
// ═══════════════════════════════════════════════════════════
function _mapWireZoneB(zoneBEl){
  if(!zoneBEl) return;
  var row1 = zoneBEl.querySelector('.zb-row1');
  var row2 = zoneBEl.querySelector('.zb-row2');

  // Search input
  var sInp = zoneBEl.querySelector('.zb-search-input');
  if(sInp){
    sInp.placeholder = 'Search figures…';
    sInp.addEventListener('input', function(){
      window.searchQ = sInp.value || '';
      if(typeof _renderMarkers === 'function') _renderMarkers();
    });
  }

  // Year slider — drives _mapYear and re-renders
  var sliderInp = document.getElementById('sliderInput');
  var sliderTrack = document.getElementById('sliderTrack');
  var sliderFill = document.getElementById('sliderFill');
  var sliderThumb = document.getElementById('sliderThumb');
  var yearDisp = document.getElementById('yearDisplay');
  var yearClear = document.getElementById('yearClearBtn');
  if(sliderInp && sliderTrack){
    sliderInp.min = 500; sliderInp.max = 2025; sliderInp.value = 800;
    function _setSlider(yr){
      _mapYear = yr;
      if(typeof activeYear !== 'undefined') window.activeYear = yr;
      var pct = (yr - 500) / (2025 - 500) * 100;
      if(sliderFill) sliderFill.style.width = pct + '%';
      if(sliderThumb) sliderThumb.style.left = pct + '%';
      if(yearDisp) yearDisp.textContent = (yr < 0 ? Math.abs(yr) + ' BCE' : yr + ' CE');
      if(sliderTrack) sliderTrack.classList.remove('sl-inactive');
      if(yearClear) yearClear.classList.add('active');
      if(typeof _drawEmpires === 'function') _drawEmpires();
      if(typeof _renderMarkers === 'function') _renderMarkers();
    }
    window._setSliderYear = _setSlider;
    function _clickToYear(e){
      var rect = sliderTrack.getBoundingClientRect();
      var pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      _setSlider(Math.round(500 + pct * (2025 - 500)));
    }
    sliderTrack.addEventListener('click', _clickToYear);
    var dragging = false;
    sliderThumb.addEventListener('mousedown', function(e){ dragging = true; e.preventDefault(); });
    document.addEventListener('mousemove', function(e){ if(dragging) _clickToYear(e); });
    document.addEventListener('mouseup', function(){ dragging = false; });
    if(yearClear){
      yearClear.addEventListener('click', function(){
        _mapYear = null;
        if(sliderFill) sliderFill.style.width = '0%';
        if(sliderThumb) sliderThumb.style.left = '0%';
        if(yearDisp) yearDisp.innerHTML = '&mdash;';
        sliderTrack.classList.add('sl-inactive');
        yearClear.classList.remove('active');
        if(typeof _drawEmpires === 'function') _drawEmpires();
        if(typeof _renderMarkers === 'function') _renderMarkers();
      });
    }
  }

  // Type / Tradition filter dropdowns
  if(row2){
    var selects = row2.querySelectorAll('.zb-select');
    var typeBtn = null, tradBtn = null;
    selects.forEach(function(b){
      var t = (b.textContent||'').trim().toUpperCase();
      if(t === 'TYPE') typeBtn = b;
      else if(t === 'TRADITION') tradBtn = b;
    });
    function _ensurePanel(id, btn, items, getSet){
      var p = document.getElementById(id);
      if(!p){
        p = document.createElement('div');
        p.className = 'dd-panel';
        p.id = id;
        p.style.position = 'fixed';
        p.style.display = 'none';
        document.body.appendChild(p);
      }
      function _build(){
        var set = getSet();
        var allOn = set.size === 0;
        var html = '<div class="dd-item dd-all'+(allOn?' selected':'')+'" data-val="__all__"><div class="dd-checkbox">'+(allOn?'✓':'')+'</div><span>All</span></div>';
        items.forEach(function(t){
          var on = set.has(t);
          html += '<div class="dd-item'+(on?' selected':'')+'" data-val="'+t+'"><div class="dd-checkbox">'+(on?'✓':'')+'</div><span>'+t+'</span></div>';
        });
        p.innerHTML = html;
        p.querySelectorAll('.dd-item').forEach(function(el){
          el.addEventListener('click', function(){
            var v = this.getAttribute('data-val');
            if(v === '__all__') set.clear();
            else { if(set.has(v)) set.delete(v); else set.add(v); }
            _build();
            if(typeof _renderMarkers === 'function') _renderMarkers();
          });
        });
      }
      _build();
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var open = p.classList.toggle('open');
        if(open){
          var r = btn.getBoundingClientRect();
          p.style.top = (r.bottom + 4) + 'px';
          p.style.left = r.left + 'px';
          p.style.zIndex = 10000;
          p.style.display = 'block';
        } else { p.style.display = 'none'; }
      });
    }
    window._mapFilterTypes = window._mapFilterTypes || new Set();
    window._mapFilterTrads = window._mapFilterTrads || new Set();
    if(typeBtn){
      var types = [];
      try { types = Array.from(new Set((window.PEOPLE||[]).map(function(p){return p.type;}).filter(Boolean))).sort(); } catch(e){}
      _ensurePanel('map-type-panel', typeBtn, types, function(){return window._mapFilterTypes;});
    }
    if(tradBtn){
      var trads = [];
      try { trads = Array.from(new Set((window.PEOPLE||[]).map(function(p){return p.tradition;}).filter(Boolean))).sort(); } catch(e){}
      _ensurePanel('map-trad-panel', tradBtn, trads, function(){return window._mapFilterTrads;});
    }
    document.addEventListener('click', function(e){
      ['map-type-panel','map-trad-panel'].forEach(function(id){
        var p = document.getElementById(id);
        if(!p) return;
        if(p.classList.contains('open') && !p.contains(e.target) && (typeBtn?!typeBtn.contains(e.target):true) && (tradBtn?!tradBtn.contains(e.target):true)){
          p.classList.remove('open');
          p.style.display = 'none';
        }
      });
    });

    // Pills: Empires + Recenter
    var pills = row2.querySelectorAll('.zb-pill');
    pills.forEach(function(p){
      var t = (p.textContent||'').trim().toUpperCase();
      if(t.indexOf('EMPIRE') !== -1){
        p.addEventListener('click', function(){
          _geoEmpOn = !_geoEmpOn;
          p.classList.toggle('zb-active', _geoEmpOn);
          if(_geoEmpOn && !_geoEmpData){
            _loadGeoEmpires(function(){ _drawEmpires(); });
          } else { _drawEmpires(); }
        });
      } else if(t.indexOf('RECENT') !== -1){
        p.addEventListener('click', function(){
          if(_lMap){
            var pts = _getMapFiltered();
            if(pts.length){
              try { _lMap.fitBounds(L.latLngBounds(pts.map(function(x){return [x.lat,x.lng];})).pad(0.1)); } catch(e){}
            } else {
              _lMap.setView([30,45], 3);
            }
          }
        });
      }
    });

    // Kickstart: empires ON at year 500 from the moment MAP loads.
    _geoEmpOn = true;
    var _empPill = null;
    pills.forEach(function(p){
      if((p.textContent||'').toUpperCase().indexOf('EMPIRE') !== -1) _empPill = p;
    });
    if(_empPill) _empPill.classList.add('zb-active');
    _loadGeoEmpires(function(){
      if(typeof window._setSliderYear === 'function') window._setSliderYear(500);
      else {
        _mapYear = 500;
        if(typeof _drawEmpires === 'function') _drawEmpires();
        if(typeof _renderMarkers === 'function') _renderMarkers();
      }
    });
  }
}

function _showMapMethodology(){
  if(document.getElementById('map-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='map-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="map-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">An interactive world map showing where historical figures lived and worked. Use the slider to filter by year. Click Empires to overlay historical empire boundaries. Click any marker for details.</p>'
    +'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin-top:16px">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('map-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

return {
  mount: function(zoneCEl, zoneBEl){
    document.body.classList.add('map-mounted');
    _ensureMapTafsirXref();
    zoneCEl.innerHTML = '<div id="mapView" style="display:flex;flex-direction:column;height:100%;width:100%;overflow:hidden">'
      + '<div id="mapToolbar" style="display:none"></div>'
      + '<div id="mapContainer" style="flex:1;position:relative;width:100%;height:100%"><div id="leafletMap" style="width:100%;height:100%"></div></div>'
      + '</div>';
    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });
    p1.then(function(){
      renderMap();
      _mapWireZoneB(zoneBEl);
      setTimeout(function(){ _setMapHeight(); }, 100);
    });
  },
  unmount: function(){
    document.body.classList.remove('map-mounted');
    try { _mapAnimStop(); } catch(e){}
    if(_lMap){ try { _lMap.remove(); } catch(e){} _lMap = null; _empLayer = null; _mrkLayer = null; _labTile = null; }
    var zb = document.getElementById('zoneB'); if(zb) zb.innerHTML = '';
    var zc = document.getElementById('zoneC'); if(zc) zc.innerHTML = '';
  },
  showHtw: _showMapMethodology,
  animateStart: _mapAnimPlay,
  animatePause: _mapAnimPause,
  animateStop:  _mapAnimStop,
  animateSetSpeed: function(label){
    // Per-year tick interval — spec.
    var map = { '0.5x':200, '1x':100, '2x':50, '4x':25 };
    _mapAnimSpeedMs = map[label] || 100;
    // Live-apply: if currently playing, restart the timer with new interval
    // so the change takes effect immediately on the next tick.
    if(_mapAnimMode === 'playing'){
      if(_mapAnimTimer){ clearTimeout(_mapAnimTimer); _mapAnimTimer = null; }
      _mapAnimTimer = setTimeout(_mapAnimNextStep, _mapAnimSpeedMs);
    }
  }
};
})();
