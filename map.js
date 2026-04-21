// ═══════════════════════════════════════════════════════════
// MAP VIEW
// ═══════════════════════════════════════════════════════════
let _lMap=null, _empLayer=null, _mrkLayer=null, _labTile=null;
let _mapYear=null; // null = all years
const MAP_MIN=550, MAP_MAX=2025;
let _geoEmpData=null, _geoEmpLayer=null, _geoEmpOn=false;
let GEO_EMP_CENTURIES=[];
function fmtYr(y){return y<0?`${Math.abs(y)} BCE`:`${y} CE`;}

// Empire overlay data
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
  {name:"Sokoto Caliphate",         years:"1804–1903 CE", color:"#8a4020",start:1804, end:1903, poly:[[16,-4],[16,16],[8,16],[8,-4]]},
];

function _setMapHeight(){
  const c=document.getElementById('mapContainer');
  const lm=document.getElementById('leafletMap');
  if(c&&lm) lm.style.height=c.offsetHeight+'px';
  if(_lMap) _lMap.invalidateSize();
}

function _getMapFiltered(){
  // Use same getFiltered() but also require lat+lng
  // Year filter uses _mapYear, not activeYear (map has its own slider)
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
    /* Saved figures filter */
    if(APP.filterFavsOnly && APP.Favorites){
      if(!APP.Favorites.has(p.famous)) return false;
    }
    return true;
  });
}

// Shared helper: draw empire overlays on any Leaflet map for a given year
// Returns the L.layerGroup so caller can track/remove it
function _drawEmpiresOnMap(map, year, existingLayer, legendContainerId) {
  if (!map) return null;
  if (existingLayer) { map.removeLayer(existingLayer); }
  if (year === null) { _removeEmpLegendFor(legendContainerId); return null; }
  var layer = L.layerGroup();
  var activeEmps = [];

  MAP_EMPIRES.forEach(function(em) {
    if (em.start > year || em.end < year) return;
    var poly = L.polygon(em.poly, {
      color: em.color, weight: 1.5, fillColor: em.color,
      fillOpacity: 0.13, opacity: 0.55, dashArray: '5,4'
    });
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
  {label:'Poet',              color:'#e07090'},
];

function _makeMarker(p, showLabel=false){
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
  // Journey-aware pin: use FOLLOW data if available
  var _jLoc=null;
  if(window._getJourneyLocation&&p.slug&&_mapYear!=null){
    _jLoc=window._getJourneyLocation(p.slug,_mapYear);
  }
  const _lat=_jLoc?_jLoc.lat:(p._renderLat!=null?p._renderLat:p.lat);
  const _lng=_jLoc?_jLoc.lng:(p._renderLng!=null?p._renderLng:p.lng);
  const m=L.marker([_lat,_lng],{icon, zIndexOffset: isTheProphet ? 9999 : 0});
  // First hover: show small tooltip
  m.on('mouseover',e=>{
    const el=m.getElement()||(e&&e.originalEvent&&e.originalEvent.target
      ?e.originalEvent.target.closest('.map-marker-wrap'):null);
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
    const el=m.getElement()||(e&&e.originalEvent&&e.originalEvent.target
      ?e.originalEvent.target.closest('.map-marker-wrap'):null);
    if(el){
      const lbl=el.querySelector('.map-marker-label');
      const dot=el.querySelector('.map-marker-dot');
      if(lbl&&!isTheProphet) lbl.style.display='none';
      if(dot) dot.style.transform='';
    }
    if(!_mapTTPinned) _hideMapTT();
  });
  // First click: pin tooltip; second click (already pinned on same person): open card
  m.on('click',e=>{
    e.originalEvent.stopPropagation();
    if(_mapTTPinnedPerson===p.famous && _mapTTPinned){
      // Second click → open big card
      showMapCardWithDetails(p, e.originalEvent.clientX, e.originalEvent.clientY);
    } else {
      // First click → pin the tooltip
      _pinMapTT(p, e.originalEvent.clientX, e.originalEvent.clientY);
    }
  });
  return m;
}

// ── Map hover tooltip + click card (mirrors silsila system) ──
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
  const dob_s=(_rd!=null)?(_rd<0?`${Math.abs(_rd)} BCE`:`${_rd} CE`):(p.dob_s||'\u2014');
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
function _hideMapTT(){
  if(_mapTT){ _mapTT.style.display='none'; }
}
function _unpinMapTT(){
  _mapTTPinned=false; _mapTTPinnedPerson=null;
  _hideMapTT();
}

// Close map tooltip when clicking outside markers
document.addEventListener('click',e=>{
  if(_mapTTPinned && !e.target.closest('#map-tt') && !e.target.closest('.leaflet-marker-icon')){
    _unpinMapTT();
    _closeMapCard();
  }
});

// ── Map detail card ──────────────────────────────────────────
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
      <button id="mcClose" style="position:absolute;top:8px;right:10px;background:none;border:none;color:var(--muted);font-size:var(--fs-2);cursor:pointer;line-height:1" onclick="_closeMapCard()">✕</button>
      <div id="mcName" style="font-family:'Cinzel',serif;font-size:var(--fs-2);font-weight:700;line-height:1.2;padding-right:22px"></div>
      <div id="mcSub" style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;margin-top:3px;line-height:1.45"></div>
    </div>
    <div id="mcScroll" style="flex:1;overflow-y:auto;padding:14px 16px 18px">
      <div id="mcBody"></div>
      <button id="mcTimelineBtn" style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;margin-top:12px;padding:6px 14px;border-radius:3px;cursor:pointer;background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.3);color:var(--accent);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em;transition:background .12s,border-color .12s" onmouseenter="this.style.background='rgba(212,175,55,.14)'" onmouseleave="this.style.background='rgba(212,175,55,.07)'">
        ↗ OPEN IN TIMELINE
      </button>
    </div>`;
  document.body.appendChild(_mapCardEl);
  // Scrollbar style
  const sc=_mapCardEl.querySelector('#mcScroll');
  sc.style.cssText+=';scrollbar-width:thin;';
}

function _openMapCard(p, cx, cy){
  _ensureMapCard();
  const col=p.type==='Genealogy'?'#D4AF37':(CC[gc(p.dob)]||'#A0AEC0');
  document.getElementById('mcName').textContent=p.famous;
  document.getElementById('mcName').style.color=col;
  document.getElementById('mcSub').textContent=p.primaryTitle||p.tradition||'';

  const _rDob=(p.dob_academic!=null)?p.dob_academic:null;
  const _rDod=(p.dod_academic!=null)?p.dod_academic:null;
  const dob_s=(_rDob!=null)?(_rDob<0?`${Math.abs(_rDob)} BCE`:`${_rDob} CE`):(p.dob_s||'\u2014');
  const dod_s=(_rDod!=null)?(_rDod<0?`${Math.abs(_rDod)} BCE`:`${_rDod} CE`):(p.dod_s||'\u2014');
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
      <div style="display:flex;flex-wrap:wrap;gap:5px">${known.map(t=>`<span style="padding:3px 9px;background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;font-size:var(--fs-3);color:var(--ip-text);cursor:pointer;transition:border-color .12s,color .12s" onclick="jumpTo('${t.replace(/'/g,"\\'")}');_closeMapCard();" onmouseenter="this.style.borderColor='rgba(212,175,55,.5)';this.style.color='var(--ip-acc)'" onmouseleave="this.style.borderColor='var(--ip-brd)';this.style.color='var(--ip-text)'">⟵ ${esc(t)}</span>`).join('')}</div>`;
    }
  }
  if(studentsOf.length){
    html+=`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">STUDENTS (${studentsOf.length})<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>
    <div style="display:flex;flex-wrap:wrap;gap:5px">${studentsOf.map(s=>`<span style="padding:3px 9px;background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;font-size:var(--fs-3);color:var(--ip-text);cursor:pointer;transition:border-color .12s,color .12s" onclick="jumpTo('${s.famous.replace(/'/g,"\\'")}');_closeMapCard();" onmouseenter="this.style.borderColor='rgba(212,175,55,.5)';this.style.color='var(--ip-acc)'" onmouseleave="this.style.borderColor='var(--ip-brd)';this.style.color='var(--ip-text)'">▶ ${esc(s.famous)}</span>`).join('')}</div>`;
  }
  if(p.books?.length){
    const sortedBooks=[...p.books].sort((a,b)=>/quran/i.test(a.title)?-1:/quran/i.test(b.title)?1:0);
    html+=`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">WORKS & SOURCES<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>`;
    sortedBooks.forEach(b=>{
      html+=`<div style="margin-bottom:7px;font-size:var(--fs-3);color:var(--ip-text)">`+
        (b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none" onmouseenter="this.style.textDecoration='underline'" onmouseleave="this.style.textDecoration='none'">${esc(b.title)}</a>`:`<span>${esc(b.title)}</span>`)+
        (b.magnum?` <span style="color:var(--accent);font-size:var(--fs-3)">✦</span>`:'')+
        (b.note?`<div style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;margin-top:1px">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">quran.com</a>')}</div>`:'')+
        `</div>`;
    });
  }

  if(window._wikidata&&window._wikidata[p.slug]&&window._wikidata[p.slug].wikipedia&&window._wikidata[p.slug].wikipedia.en){
    html+=`<a class="map-wiki-link" href="https://en.wikipedia.org/wiki/${encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Wikipedia ↗</a>`;
  }

  document.getElementById('mcBody').innerHTML=html;
  document.getElementById('mcScroll').scrollTop=0;
  document.getElementById('mcTimelineBtn').onclick=()=>{ _closeMapCard(); _unpinMapTT(); focusPersonInTimeline(p.famous); };

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

// Close map card on outside click
document.addEventListener('click',e=>{
  if(!_mapCardEl||_mapCardEl.style.display==='none') return;
  if(!_mapCardEl.contains(e.target)&&!e.target.closest('.leaflet-marker-icon')) _closeMapCard();
});

function _renderMarkers(){
  if(!_lMap) return;
  if(_mrkLayer){_lMap.removeLayer(_mrkLayer);_mrkLayer=null;}
  const pts=_getMapFiltered();
  // Spread figures that share the same coordinates
  const _coordGroups={};
  pts.forEach(p=>{
    const key=p.lat.toFixed(2)+','+p.lng.toFixed(2);
    if(!_coordGroups[key]) _coordGroups[key]=[];
    _coordGroups[key].push(p.famous);
  });
  pts.forEach(p=>{
    const key=p.lat.toFixed(2)+','+p.lng.toFixed(2);
    const grp=_coordGroups[key];
    const idx=grp.indexOf(p.famous);
    if(grp.length>1){
      const ang=(idx/grp.length)*2*Math.PI;
      const r=0.18;
      p._renderLat=p.lat+Math.cos(ang)*r;
      p._renderLng=p.lng+Math.sin(ang)*r;
    } else {
      p._renderLat=p.lat;
      p._renderLng=p.lng;
    }
  });
  const _showLbls=_mapYear!==null;
  _mrkLayer=L.layerGroup(pts.map(p=>_makeMarker(p,_showLbls))).addTo(_lMap);
  _updateArrows();
}

function _updateArrows(){
  if(!_lMap) return;
  const mapEl=document.getElementById('leafletMap');
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
  label.textContent=open?'CLOSE':'LEGEND';
}

function _loadGeoEmpires(cb){
  if(_geoEmpData){cb();return;}
  fetch('data/islamic/empire_overlays.json?v='+Date.now())
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
function _removeEmpLegend(){
  var el=document.getElementById('empOverlayLegend');
  if(el)el.remove();
}
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
  // Tooltip CSS
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
    btn.textContent=on?'Empires \u2715':'Empires';
  }
  btn.addEventListener('click',function(e){
    e.stopPropagation();
    if(!_geoEmpOn){
      if(!_geoEmpData){
        btn.textContent='Loading\u2026';btn.style.color='#D4AF37';btn.style.borderColor='#D4AF37';
        _loadGeoEmpires(function(){
          _setActive(true);
          _drawEmpires();
        });
      } else {
        _setActive(true);
        _drawEmpires();
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
  var _mfb=document.getElementById('map-favFilterBtn');if(_mfb)_mfb.style.display='none';
  if(!document.getElementById('map-how-btn')){var _mt=document.getElementById('mapToolbar');if(_mt){var _mhb=document.createElement('button');_mhb.id='map-how-btn';_mhb.textContent='How This Works';_mhb.style.cssText="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-size:var(--fs-3);cursor:pointer;transition:.2s;font-family:'Cinzel',serif;letter-spacing:.05em;margin-right:8px";_mhb.onmouseover=function(){this.style.borderColor='#D4AF37';this.style.color='#D4AF37';};_mhb.onmouseout=function(){this.style.borderColor='#555';this.style.color='#888';};_mhb.onclick=function(e){e.stopPropagation();_showMapMethodology();};_mt.prepend(_mhb);}}
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
    document.getElementById('leafletMap').innerHTML=
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Cinzel,serif;font-size:var(--fs-3);color:#A0AEC0;letter-spacing:.1em">LOADING MAP…</div>';
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

    // 1) Base — no labels
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_matter_no_labels/{z}/{x}/{y}{r}.png',{
      subdomains:'abcd',
      attribution:'© <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom:19
    }).addTo(_lMap);

    // 2) Country borders (subtle)
    fetch('https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson')
      .then(r=>r.json())
      .then(geo=>{
        if(!_lMap) return;
        L.geoJSON(geo,{style:{color:'#7a8a72',weight:0.8,fillOpacity:0,opacity:0.8}}).addTo(_lMap);
      }).catch(()=>{});

    // 3) Empire overlays drawn by _drawEmpires()

    // 4) Country name labels tile — MUST be added LAST so labels float above empires
    _labTile=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',{
      subdomains:'abcd',maxZoom:19,opacity:1
    });
    // Added inside _drawEmpires() to guarantee z-order

    _lMap.on('moveend zoomend',_updateArrows);
  }

  if(_geoEmpOn && _geoEmpData) _drawEmpires();
  _renderMarkers();

  // Fit to markers on first load
  const pts=_getMapFiltered();
  if(pts.length>0&&!_lMap._hasFit){
    _lMap._hasFit=true;
    try{_lMap.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lng])).pad(0.1));}catch(e){}
  }
  setTimeout(()=>{if(_lMap)_lMap.invalidateSize();},300);

  // Mount AnimControls pill (once)
  if(!_mapAnimCtl){
    // Hide old controls
    var oldGroup=document.querySelector('.map-anim-group');
    if(oldGroup) oldGroup.style.display='none';
    var toolbar=document.getElementById('mapToolbar');
    if(toolbar&&window.AnimControls){
      var mount=document.createElement('div');
      mount.id='map-anim-mount';
      mount.style.cssText='display:flex;align-items:center;margin-left:8px';
      toolbar.appendChild(mount);
      _mapAnimCtl=window.AnimControls.create({
        mountEl:mount, idPrefix:'map', initialSpeed:'1x',
        onPlay:_mapAnimPlay, onPause:_mapAnimPause, onStop:_mapAnimStop,
        onSpeedChange:function(ms){ _mapAnimSpeedMs=ms; }
      });
    }
  }
  if(!document.getElementById('geoEmpToggle')){ _buildEmpireToggle(); }
}

// ═══════════════════════════════════════════════════════════
// MAP ANIMATE
// ═══════════════════════════════════════════════════════════
let _mapAnimTimer=null, _mapAnimMode='stopped', _mapAnimYr=500, _mapAnimSpeedMs=1200, _mapAnimCtl=null;

function _mapAnimPlay(){
  if(typeof _setSliderYear!=='function') return;
  if(_mapAnimMode==='stopped'){
    let yr=activeYear||500;
    if(yr>=2000) yr=500;
    _mapAnimYr=yr;
  }
  _mapAnimMode='playing';
  _mapAnimSpeedMs=_mapAnimCtl?_mapAnimCtl.getSpeedMs():1200;
  _mapAnimNextStep();
}

function _mapAnimPause(){
  _mapAnimMode='paused';
  if(_mapAnimTimer){clearTimeout(_mapAnimTimer);_mapAnimTimer=null;}
}

function _mapAnimNextStep(){
  if(_mapAnimMode!=='playing') return;
  if(_mapAnimYr>2000){_mapAnimStop();return;}
  _setSliderYear(_mapAnimYr);
  _mapAnimYr+=10;
  _mapAnimTimer=setTimeout(_mapAnimNextStep,_mapAnimSpeedMs);
}

function _mapAnimStop(){
  _mapAnimMode='stopped';
  if(_mapAnimTimer){clearTimeout(_mapAnimTimer);_mapAnimTimer=null;}
  _mapAnimYr=500;
  if(_mapAnimCtl) _mapAnimCtl.forceStop();
}

window._captureState_map=function(){return{year:typeof activeYear!=='undefined'?activeYear:null};};
window._restoreState_map=function(s){
  if(s&&s.year!=null&&typeof _setSliderYear==='function') _setSliderYear(s.year);
};

function _showMapMethodology(){
  if(document.getElementById('map-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='map-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="map-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 16px">An interactive world map showing where historical figures lived and worked. Markers cluster when zoomed out \u2014 click to expand. The map reveals the geographic spread of Islamic civilisation.</p>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'+'<div style="font-size:var(--fs-3);line-height:1.7"><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#D4AF37;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Marker</span><span style="color:#A0AEC0">A single figure at their primary known location</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#5B8DEF;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Cluster</span><span style="color:#A0AEC0">A group of figures in the same area</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#A0AEC0;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Primary location</span><span style="color:#A0AEC0">The city most associated with a figure</span></div></div>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 12px">GPS coordinates from Wikipedia, OpenStreetMap, and manual research. Most are city-level, not building-level. Historical place names mapped to modern equivalents.</p>'+'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('map-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
