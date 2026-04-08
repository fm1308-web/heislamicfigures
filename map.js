// ═══════════════════════════════════════════════════════════
// MAP VIEW
// ═══════════════════════════════════════════════════════════
let _lMap=null, _empLayer=null, _mrkLayer=null, _labTile=null;
let _mapYear=null; // null = all years
const MAP_MIN=550, MAP_MAX=2025;
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
      const passChain=selTypes.has('Genealogy')&&PROPHET_CHAIN.has(p.famous);
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
function _drawEmpiresOnMap(map, year, existingLayer) {
  if (!map) return null;
  if (existingLayer) { map.removeLayer(existingLayer); }
  var layer = L.layerGroup();

  MAP_EMPIRES.forEach(function(em) {
    if (year !== null) {
      if (em.start > year || em.end < year) return;
    }
    var poly = L.polygon(em.poly, {
      color: em.color, weight: 1.5, fillColor: em.color,
      fillOpacity: 0.13, opacity: 0.55, dashArray: '5,4'
    });
    layer.addLayer(poly);
    var cLat = em.poly.reduce(function(s, p) { return s + p[0]; }, 0) / em.poly.length;
    var cLng = em.poly.reduce(function(s, p) { return s + p[1]; }, 0) / em.poly.length;
    var lbl = L.marker([cLat, cLng], {
      icon: L.divIcon({
        html: '<div style="color:' + em.color + ';font-family:\'Cinzel\',Georgia,serif;font-size:12px;font-weight:900;white-space:nowrap;text-align:center;letter-spacing:.04em;line-height:1.3;pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,.7),0 0 8px rgba(0,0,0,.5);">' + em.name + '<br><span style="font-size:9px;font-weight:500;font-style:italic;opacity:.9;">' + em.years + '</span></div>',
        className: '', iconSize: [210, 38], iconAnchor: [105, 19]
      }),
      interactive: false, keyboard: false
    });
    layer.addLayer(lbl);
  });

  layer.addTo(map);
  return layer;
}

function _drawEmpires(){
  if(!_lMap) return;
  _empLayer=_drawEmpiresOnMap(_lMap, _mapYear, _empLayer);

  // Always keep label tile on top after re-drawing empires
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
    'padding:7px 12px;font-size:11px;color:var(--text);'+
    'box-shadow:0 4px 22px rgba(0,0,0,.7);max-width:240px;line-height:1.5;transition:opacity .1s';
  document.body.appendChild(_mapTT);
}
function _mapTTContent(p, pinned){
  const col=_markerTypeColor(p);
  const dob_s=p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`;
  const nT=(p.teachers||[]).length, nS=(PEOPLE.filter(s=>s.teachers?.includes(p.famous))).length;
  const hint=pinned?`<span style="font-size:8px;opacity:.5;margin-left:5px">→ CLICK AGAIN FOR FULL INFO</span>`:'';
  return `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;font-size:13px;margin-bottom:2px">${esc(p.famous)}${hint}</div>`+
    `<div style="font-family:'Crimson Pro',serif;font-size:12px;color:var(--text2);font-style:italic;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
    `<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.06em;color:var(--muted)">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
    (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.05em;color:rgba(212,175,55,.55);margin-top:3px">`+
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
      <button id="mcClose" style="position:absolute;top:8px;right:10px;background:none;border:none;color:var(--muted);font-size:15px;cursor:pointer;line-height:1" onclick="_closeMapCard()">✕</button>
      <div id="mcName" style="font-family:'Cinzel',serif;font-size:16px;font-weight:700;line-height:1.2;padding-right:22px"></div>
      <div id="mcSub" style="font-size:12px;color:var(--ip-muted);font-style:italic;margin-top:3px;line-height:1.45"></div>
    </div>
    <div id="mcScroll" style="flex:1;overflow-y:auto;padding:14px 16px 18px">
      <div id="mcBody"></div>
      <button id="mcTimelineBtn" style="display:flex;align-items:center;justify-content:center;gap:5px;width:100%;margin-top:12px;padding:6px 14px;border-radius:3px;cursor:pointer;background:rgba(212,175,55,.07);border:1px solid rgba(212,175,55,.3);color:var(--accent);font-family:'Cinzel',serif;font-size:9px;letter-spacing:.1em;transition:background .12s,border-color .12s" onmouseenter="this.style.background='rgba(212,175,55,.14)'" onmouseleave="this.style.background='rgba(212,175,55,.07)'">
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

  const dob_s=p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`;
  const dod_s=p.dod?(p.dod<0?`${Math.abs(p.dod)} BCE`:`${p.dod} CE`):'Unknown';
  const studentsOf=PEOPLE.filter(s=>s.teachers?.includes(p.famous));

  let html=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">
    <span style="padding:2px 8px;border-radius:2px;font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:.06em;border:1px solid ${col}55;color:${col}">${esc(p.type||'')}</span>
    <span style="padding:2px 8px;border-radius:2px;font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:.06em;border:1px solid var(--ip-brd);color:var(--ip-muted)">${esc(p.tradition||'')}</span>
    ${p.city?`<span style="padding:2px 8px;border-radius:2px;font-family:'Cinzel',serif;font-size:8.5px;letter-spacing:.06em;border:1px solid var(--ip-brd);color:var(--ip-muted)">📍 ${esc(p.city)}</span>`:''}
  </div>
  ${(()=>{if(!window._wikidata||!window._wikidata[p.slug]||!window._wikidata[p.slug].occupations||!window._WD_OCC_LABELS) return '';const chips=window._wikidata[p.slug].occupations.slice(0,5).map(q=>window._WD_OCC_LABELS[q]).filter(Boolean);if(!chips.length) return '';return '<div class="map-wd-occupations">'+chips.map(l=>'<span class="map-wd-occ">'+esc(l)+'</span>').join('')+'</div>';})()}
  <div style="display:flex;gap:14px;margin-bottom:10px">
    <div><span style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.1em;color:var(--ip-muted);display:block">BORN</span><span style="font-size:14px;font-weight:500;color:${col}">${dob_s}</span></div>
    <div><span style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.1em;color:var(--ip-muted);display:block">DIED</span><span style="font-size:14px;font-weight:500;color:${col}">${dod_s}</span></div>
  </div>
  ${p.school?`<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">BIOGRAPHY<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div><p style="font-size:13.5px;line-height:1.65;color:var(--ip-text)">${esc(p.school)}</p>`:''}`;

  if(p.teachers?.length){
    const known=p.teachers.filter(t=>PEOPLE.find(pp=>pp.famous===t));
    if(known.length){
      html+=`<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">TEACHERS<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>
      <div style="display:flex;flex-wrap:wrap;gap:5px">${known.map(t=>`<span style="padding:3px 9px;background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;font-size:12px;color:var(--ip-text);cursor:pointer;transition:border-color .12s,color .12s" onclick="jumpTo('${t.replace(/'/g,"\\'")}');_closeMapCard();" onmouseenter="this.style.borderColor='rgba(212,175,55,.5)';this.style.color='var(--ip-acc)'" onmouseleave="this.style.borderColor='var(--ip-brd)';this.style.color='var(--ip-text)'">⟵ ${esc(t)}</span>`).join('')}</div>`;
    }
  }
  if(studentsOf.length){
    html+=`<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">STUDENTS (${studentsOf.length})<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>
    <div style="display:flex;flex-wrap:wrap;gap:5px">${studentsOf.map(s=>`<span style="padding:3px 9px;background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;font-size:12px;color:var(--ip-text);cursor:pointer;transition:border-color .12s,color .12s" onclick="jumpTo('${s.famous.replace(/'/g,"\\'")}');_closeMapCard();" onmouseenter="this.style.borderColor='rgba(212,175,55,.5)';this.style.color='var(--ip-acc)'" onmouseleave="this.style.borderColor='var(--ip-brd)';this.style.color='var(--ip-text)'">▶ ${esc(s.famous)}</span>`).join('')}</div>`;
  }
  if(p.books?.length){
    const sortedBooks=[...p.books].sort((a,b)=>/quran/i.test(a.title)?-1:/quran/i.test(b.title)?1:0);
    html+=`<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.14em;color:var(--ip-muted);display:flex;align-items:center;gap:6px;margin:12px 0 7px">WORKS & SOURCES<span style="flex:1;height:1px;background:var(--ip-brd);display:inline-block"></span></div>`;
    sortedBooks.forEach(b=>{
      html+=`<div style="margin-bottom:7px;font-size:13px;color:var(--ip-text)">`+
        (b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none" onmouseenter="this.style.textDecoration='underline'" onmouseleave="this.style.textDecoration='none'">${esc(b.title)}</a>`:`<span>${esc(b.title)}</span>`)+
        (b.magnum?` <span style="color:var(--accent);font-size:10px">✦</span>`:'')+
        (b.note?`<div style="font-size:11px;color:var(--ip-muted);font-style:italic;margin-top:1px">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">quran.com</a>')}</div>`:'')+
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
    document.getElementById('leafletMap').innerHTML=
      '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:Cinzel,serif;font-size:12px;color:#A0AEC0;letter-spacing:.1em">LOADING MAP…</div>';
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

  _drawEmpires();
  _renderMarkers();

  // Fit to markers on first load
  const pts=_getMapFiltered();
  if(pts.length>0&&!_lMap._hasFit){
    _lMap._hasFit=true;
    try{_lMap.fitBounds(L.latLngBounds(pts.map(p=>[p.lat,p.lng])).pad(0.1));}catch(e){}
  }
  setTimeout(()=>{if(_lMap)_lMap.invalidateSize();},300);
}

// ═══════════════════════════════════════════════════════════
// MAP ANIMATE
// ═══════════════════════════════════════════════════════════
let _mapAnimTimer=null, _mapAnimRunning=false;

function _mapAnimToggle(){
  if(_mapAnimRunning){_mapAnimStop();return;}
  if(typeof _setSliderYear!=='function') return;
  let yr=activeYear||500;
  if(yr>=2000) yr=500;
  _mapAnimRunning=true;
  const btn=document.getElementById('mapAnimBtn');
  if(btn) btn.textContent='\u275A\u275A PAUSE';
  _mapAnimStep(yr);
}

function _mapAnimStep(yr){
  if(!_mapAnimRunning) return;
  if(yr>2000){_mapAnimStop();return;}
  _setSliderYear(yr);
  const sel=document.getElementById('mapAnimSpeed');
  const ms=sel?parseInt(sel.value)||1200:1200;
  _mapAnimTimer=setTimeout(function(){_mapAnimStep(yr+10);},ms);
}

function _mapAnimStop(){
  _mapAnimRunning=false;
  if(_mapAnimTimer){clearTimeout(_mapAnimTimer);_mapAnimTimer=null;}
  const btn=document.getElementById('mapAnimBtn');
  if(btn) btn.textContent='\u25B6 ANIMATE';
}

