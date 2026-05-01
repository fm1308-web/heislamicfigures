/* ─────────────────────────────────────────────────────────────
   SILSILA view — verbatim lift from bv-app/silsila.js
   IIFE exposes window.SilsilaView = { mount, unmount, animate* }
   ───────────────────────────────────────────────────────────── */
window.SilsilaView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (no-ops so lifted code can run cleanly)
  // ═══════════════════════════════════════════════════════════
  // stub: requireTester — auth gate skipped in sandbox
  function requireTester(action, cb){ if(typeof cb === 'function') cb(); }
  // stub: canShowImage — Wikipedia thumb fetch skipped in sandbox
  function canShowImage(p){ return false; }
  // stub: fetchWikiImage — no-op
  function fetchWikiImage(){}
  // stub: pushFigureHistory
  function pushFigureHistory(){}
  // stub: openStudyRoom
  function openStudyRoom(){}
  // stub: jumpTo — silsila card "teacher/student" links: open silsila card for that person if found
  function jumpTo(name){
    var p = PEOPLE.find(function(pp){ return pp.famous === name; });
    if(p){ activePerson = p; openSilsilaCard(p, window.innerWidth/2, window.innerHeight/2); }
  }
  window.jumpTo = jumpTo;
  // stub: focusPersonInTimeline — would switch to TIMELINE in full app; here just close card
  function focusPersonInTimeline(name){
    closeSilsilaCard();
    // In sandbox: log only. Real shell could route via setActiveTab('TIMELINE').
    console.log('[silsila] focusPersonInTimeline (stub):', name);
  }
  window.focusPersonInTimeline = focusPersonInTimeline;
  // stub: toggleFavFilter / clearAllFilters
  function toggleFavFilter(){
    // stub: ★ SAVED button — favourites not wired in sandbox
  }
  window.toggleFavFilter = toggleFavFilter;
  function clearAllFilters(){
    selTypes.clear();
    selTrads.clear();
    syncSLDD('type'); syncSLDD('trad');
    applyFilterAndFocus();
  }
  window.clearAllFilters = clearAllFilters;
  // stub: syncDD — main (TIMELINE) dropdown sync; no-op in sandbox
  function syncDD(){ /* no main timeline DDs in sandbox */ }
  window.syncDD = syncDD;
  // stub: APP namespace (favourites + i18n)
  var APP = window.APP || {
    Favorites: null,
    filterFavsOnly: false,
    _lang: 'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; }
  };
  window.APP = APP;
  // stub: VIEW global — SILSILA always 'silsila' here
  var VIEW = 'silsila';
  window.VIEW = 'silsila';
  // stub: AnimControls — silsila uses its own anim engine via _slAnimCtl. In sandbox we drive
  // animation from Zone D, so leave AnimControls undefined (lifted code already null-checks).
  // stub: window._wikidata, window._WD_OCC_LABELS
  if(typeof window._wikidata === 'undefined') window._wikidata = {};
  if(typeof window._WD_OCC_LABELS === 'undefined') window._WD_OCC_LABELS = {};
  // stub: SL_NM / SL_STUDENTS / SL_EDGES — declared in original app.js, redeclared in silsila.js renderSilsila.
  // We declare them up here so they're in IIFE scope and reset() in renderSilsila assigns work.
  var SL_NM = {};
  var SL_STUDENTS = {};
  var SL_EDGES = [];
  var SL_ALL_LANES = [];
  var SL_LANES_KEY = '';

  // ═══════════════════════════════════════════════════════════
  // CONSTANTS (lifted; lineage chain shared with TIMELINE)
  // ═══════════════════════════════════════════════════════════
  function gc(y){if(y<600)return 6;if(y<700)return 7;if(y<800)return 8;if(y<900)return 9;
    if(y<1000)return 10;if(y<1100)return 11;if(y<1200)return 12;if(y<1300)return 13;
    if(y<1400)return 14;if(y<1500)return 15;if(y<1600)return 16;if(y<1700)return 17;
    if(y<1800)return 18;if(y<1900)return 19;return 20;}
  var CC = {6:'#d4600a',7:'#c04a08',8:'#a07800',9:'#5a8a00',10:'#007a5c',11:'#c87832',
            12:'#b86820',13:'#c8902a',14:'#a07828',15:'#a01030',16:'#a01030',17:'#a03000',
            18:'#8a5a00',19:'#4a7800',20:'#008050'};
  function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

  var LINEAGE_CHAIN = [
    'Adam','Shith ibn Adam','Yanash','Qaynan ibn Anush','Mahlail ibn Qaynan',
    'Yared ibn Mahlail','Idris','Mattushalakh ibn Idris','Lamak ibn Mattushalakh','Nuh',
    'Sam ibn Nuh','Arfakhshadh ibn Sam','Shalikh ibn Arfakhshadh','Abir ibn Shalikh',
    "Faligh ibn Abir","Ra'u ibn Faligh","Sarugh ibn Ra'u",'Nahur ibn Sarugh',
    'Azar ibn Nahur','Ibrahim','Ismail','Nabit ibn Ismail',
    'Yashjub ibn Nabit',"Ya'rub ibn Yashjub","Tayrah ibn Ya'rub",'Nahur ibn Tayrah',
    'Muqawwam ibn Nahur','Udd ibn Muqawwam',
    'Adnan',"Ma'ad ibn Adnan","Nizar ibn Ma'ad",'Mudar ibn Nizar','Ilyas ibn Mudar',
    'Mudrikah ibn Ilyas','Khuzayma ibn Mudrikah','Kinana ibn Khuzayma',
    'al-Nadr ibn Kinana','Malik ibn al-Nadr','Fihr ibn Malik','Ghalib ibn Fihr',
    "Lu'ayy ibn Ghalib","Ka'b ibn Lu'ayy","Murrah ibn Ka'b",'Kilab ibn Murrah',
    'Qusayy ibn Kilab','Abd Manaf ibn Qusayy','Hashim ibn Abd Manaf',
    'Abd al-Muttalib ibn Hashim','Abd Allah ibn Abd al-Muttalib','Prophet Muhammad'
  ];
  var PROPHET_CHAIN = new Set(LINEAGE_CHAIN);
  var ASHRA_MUBASHSHARA = new Set([
    'Abu Bakr al-Siddiq','Umar ibn al-Khattab','Uthman ibn Affan','Ali ibn Abi Talib',
    'Talha ibn Ubayd Allah','Zubayr ibn al-Awwam','Abd al-Rahman ibn Awf',
    "Sa'd ibn Abi Waqqas","Sa'id ibn Zayd",'Abu Ubayda ibn al-Jarrah'
  ]);

  // ═══════════════════════════════════════════════════════════
  // STATE (lifted; previously globals in app.js)
  // ═══════════════════════════════════════════════════════════
  var PEOPLE = window.PEOPLE || [];
  var activeYear = null;
  var activePerson = null;
  var selTypes = new Set();
  var selTrads = new Set();
  var searchQ = '';

  // Filter — minimal version mirroring TIMELINE's getFiltered
  function getFiltered(){
    return PEOPLE.filter(function(p){
      if(selTypes.size>0){
        var passType = selTypes.has(p.type);
        var passTags = (p.tags||[]).some(function(t){return selTypes.has(t);});
        var passIHSub = Array.from(selTypes).some(function(st){return _IH_SUBLANE_REV[st]&&_IH_SUBLANE_REV[st].has(p.type);});
        var passAshra = (selTypes.has('Ashra Mubashshara')||selTypes.has('Companions')) && ASHRA_MUBASHSHARA.has(p.famous);
        if(!passType && !passTags && !passIHSub && !passAshra) return false;
      }
      if(selTrads.size>0&&!selTrads.has(p.tradition))return false;
      return true;
    });
  }
  function applyFilterAndFocus(){
    renderSilsila();
  }

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/silsila.js ▼▼▼
  // ═══════════════════════════════════════════════════════════

const TRAD_COLORS={
  'Prophetic Lineage':'#D4AF37',
  'Islamic History':  '#d4784a',
  'Early Ascetics':   '#88c878',
  'Hadith Sciences':  '#D4AF37',
  'Islamic Sciences': '#40b0c0',
  'Islamic Jurisprudence':'#7ab870',
  'Islamic Philosophy':'#d07060',
  'Islamic Theology': '#d06080',
  'Khorasan School':  '#e09050',
  'Baghdad School':   '#5ac890',
  'Qadiriyya':        '#60d090',
  'Naqshbandiyya':    '#b0c840',
  'Shadhiliyya':      '#e09840',
  'Chishti':          '#e06870',
  'Suhrawardiyya':    '#a860d0',
  'Persian Poetry':   '#D4AF37',
  'Mawlawiyya':       '#f070a8',
  'Akbarian':         '#D4AF37',
  'Kubrawiyya':       '#50d8b0',
  'Mughal':           '#c09840',
  'Yeseviyya':        '#70c880',
  'Qalandari':        '#d8a8c8',
  'Badawiyya':        '#d8d860',
  'Burhaniyya':       '#80c8a8',
  'Ishraqiyya':       '#f8c8a0',
  'Sindhi/Punjabi Sufism':'#e07060',
  // ── Islamic History sub-lane colours ──
  'Quranic Prophets':     '#D4AF37',
  'Companions':           '#d4784a',
  'Companions (Women)':   '#d06878',
  'Followers':            '#c08850',
  'Caliphs & Rulers':     '#b85840',
  'Tijaniyya':        '#4a90e2',
  'Bektashiyya':      '#e8b04a',
  "Ni'matullahi":     '#9b59b6',
  'Nizari Ismaili':   '#c0392b',
  'Tayyibi Ismaili':  '#e67e22',
  'Zaydi':            '#27ae60',
  'Ibadi':            '#16a085',
  'Sanusiyya':        '#d35400',
  'Sudanese Mahdiyya':'#8e44ad',
  'Ahmadiyya':        '#2980b9',
  'Deobandi':         '#7f8c8d',
  'Almohad':          '#c0392b',
};

// ── Islamic-History sub-lane machinery ──────────────────────────────────────
const IH_SUBLANE_ORDER=['Quranic Prophets','Companions','Companions (Women)','Followers','Caliphs & Rulers','Islamic History'];
const IH_TYPE_MAP={'Prophet':'Quranic Prophets','Sahaba':'Companions','Sahabiyya':'Companions (Women)',"Tabi'un":'Followers','Caliph':'Caliphs & Rulers','Ruler':'Caliphs & Rulers','Warrior':'Caliphs & Rulers'};
function getIHSubLane(p){
  if(p.tradition!=='Islamic History') return null;
  return IH_TYPE_MAP[p.type]||'Islamic History';
}
// Reverse map: IH sub-lane display name → Set of actual p.type values
const _IH_SUBLANE_REV={};
Object.entries(IH_TYPE_MAP).forEach(([t,sl])=>{
  if(!_IH_SUBLANE_REV[sl]) _IH_SUBLANE_REV[sl]=new Set();
  _IH_SUBLANE_REV[sl].add(t);
});

function isLineageMember(p){
  return p.type==='Genealogy' || PROPHET_CHAIN.has(p.famous);
}

let SL_LIN_OPEN=false;
let _slAnimTimer=null, _slAnimMode='stopped', _slAnimYr=500, _slAnimSpeedMs=1200, _slAnimCtl=null;

// ── Build the full (unfiltered) lane list once from PEOPLE ──────────────────
function _buildSLAllLanes(){
  if(SL_ALL_LANES.length) return;
  const PL='Prophetic Lineage';
  const tradSet=[...new Set(PEOPLE.map(p=>p.tradition).filter(Boolean))];
  // Remove 'Islamic History' — it's replaced by sub-lanes
  const otherTrads=tradSet.filter(t=>t!=='Islamic History');
  const tradEarly={};
  otherTrads.forEach(t=>{
    const mb=PEOPLE.filter(p=>p.tradition===t&&!isLineageMember(p));
    tradEarly[t]=mb.length?Math.min(...mb.map(p=>p.dob)):9999;
  });
  const sortedOther=[...otherTrads].sort((a,b)=>tradEarly[a]-tradEarly[b]);
  // Only include IH sub-lanes that have people
  const ihSubs=IH_SUBLANE_ORDER.filter(sl=>{
    return PEOPLE.some(p=>!isLineageMember(p)&&getIHSubLane(p)===sl);
  });
  // Lineage → IH sub-lanes → other traditions sorted by earliest DOB
  SL_ALL_LANES=[PL,...ihSubs,...sortedOther];
}

// ── Return only the lanes that should be VISIBLE under the current filter ───
function _getActiveSLLanes(){
  _buildSLAllLanes();
  if(selTypes.size===0&&selTrads.size===0) return [...SL_ALL_LANES];
  const activeLanes=new Set();
  PEOPLE.forEach(p=>{
    if(isLineageMember(p)) return;
    if(selTypes.size>0){
      const passType=selTypes.has(p.type);
      const passTags=(p.tags||[]).some(t=>selTypes.has(t));
      const passIHSub=[...selTypes].some(st=>_IH_SUBLANE_REV[st]&&_IH_SUBLANE_REV[st].has(p.type));
      const passAshra=(selTypes.has('Ashra Mubashshara')||selTypes.has('Companions'))&&ASHRA_MUBASHSHARA.has(p.famous);
      if(!passType&&!passTags&&!passIHSub&&!passAshra) return;
    }
    if(selTrads.size>0&&!selTrads.has(p.tradition)) return;
    const ihSub=getIHSubLane(p);
    if(ihSub) activeLanes.add(ihSub);
    else if(p.tradition) activeLanes.add(p.tradition);
  });
  return SL_ALL_LANES.filter((lane,li)=>li===0||activeLanes.has(lane));
}

function _slIsAlive(p, yr){
  if(yr === null || yr === undefined) return true;
  var dod = (p.dod !== undefined && p.dod !== null) ? p.dod : p.dob + 60;
  return p.dob <= yr && dod >= yr;
}

function _setSliderYear(yr){
  // stub: silsila has no slider in sandbox — store year and re-render
  activeYear = yr;
  window.activeYear = yr;
  renderSilsila();
}

function _slAnimPlay(){
  if(typeof _setSliderYear!=='function') return;
  if(_slAnimMode==='stopped'){
    var yr=activeYear||500;
    if(yr>=2000) yr=500;
    _slAnimYr=yr;
  }
  _slAnimMode='playing';
  // _slAnimSpeedMs is set externally by SilsilaView.animateSetSpeed
  _slAnimNextStep();
}

function _slAnimPause(){
  _slAnimMode='paused';
  if(_slAnimTimer){clearTimeout(_slAnimTimer);_slAnimTimer=null;}
}

function _slAnimNextStep(){
  if(_slAnimMode!=='playing') return;
  if(_slAnimYr>2000){_slAnimStop();return;}
  _setSliderYear(_slAnimYr);
  // Auto-scroll silsilaMain to bottom so new figures stay visible
  var main=document.getElementById('silsilaMain');
  if(main) main.scrollTop=main.scrollHeight;
  _slAnimYr+=10;
  _slAnimTimer=setTimeout(_slAnimNextStep,_slAnimSpeedMs);
}

function _slAnimStop(){
  _slAnimMode='stopped';
  if(_slAnimTimer){clearTimeout(_slAnimTimer);_slAnimTimer=null;}
  _slAnimYr=500;
  if(_slAnimCtl) _slAnimCtl.forceStop();
}

function _slAnimSetSpeed(ms){
  _slAnimSpeedMs = ms;
}

function renderSilsila(){
  if(!PEOPLE.length)return;

  const PL='Prophetic Lineage';
  const LANES=_getActiveSLLanes();
  const _slYr = (typeof activeYear !== 'undefined' && activeYear !== null) ? activeYear : null;
  const newKey=LANES.join('\x00') + '|' + (_slYr !== null ? _slYr : 'all');

  if(document.getElementById('silsilaSVG')){
    if(newKey===SL_LANES_KEY){updateSilsilaHighlight();return;}
    document.getElementById('silsilaMain').innerHTML='';
    document.getElementById('silsilaLanesInner').innerHTML='';
    SL_NM={}; SL_STUDENTS={}; SL_EDGES=[];
  }
  SL_LANES_KEY=newKey;

  const getLI=p=>{
    if(isLineageMember(p)) return 0;
    const ihSub=getIHSubLane(p);
    if(ihSub){ const idx=LANES.indexOf(ihSub); return idx>=1?idx:-1; }
    const idx=LANES.indexOf(p.tradition||'');
    return idx>=1?idx:-1;
  };

  const _SL_ACTIVE = (typeof activeYear!=='undefined' && activeYear!==null);

  const PRE_W=320;
  const _slMain = document.getElementById('silsilaMain');
  const _containerW = (_slMain && _slMain.clientWidth) ? _slMain.clientWidth : 1500;
  const MAIN_W = Math.max(700, _containerW - PRE_W - 8);
  const TW = PRE_W + MAIN_W;
  const NR=6, PT=12, PB=10;
  const NODE_DIAM=NR*2+6;
  const ROW_H=13;
  const LANE_PAD=4;
  const MIN_LH=24;
  const GRID_COLS=5;
  const GRID_CELL_W=160;
  const GRID_CELL_H=16;
  const LIN_CELL_H=38;
  const LIN_PAD=6;

  const EARLY_W = MAIN_W * 0.34;
  const LATE_W  = MAIN_W - EARLY_W;
  const x2px=dob=>{
    if(dob<600) return Math.max(4, Math.min(PRE_W-8, (dob+4200)/4800*(PRE_W-8)));
    if(dob<=800) return PRE_W + ((dob-600)/200)*EARLY_W;
    return PRE_W + EARLY_W + Math.min(1,(dob-800)/1200)*LATE_W;
  };

  const grps={};
  const _slActiveG = (typeof activeYear!=='undefined' && activeYear!==null);
  PEOPLE.forEach(p=>{
    if(_slYr !== null && !_slIsAlive(p, _slYr)) return;
    const li=getLI(p);
    if(li<0) return;
    if(li===0 && _slActiveG && !SL_LIN_OPEN && _slAnimMode!=='playing' && p.famous!=='Prophet Muhammad') return;
    (grps[li]=grps[li]||[]).push(p);
  });

  const _hasTypeSearch=selTypes.size>0||selTrads.size>0;
  if(_hasTypeSearch){
    const _fSet=new Set(getFiltered().map(p=>p.famous));
    Object.keys(grps).forEach(liS=>{
      const li=+liS; if(li===0) return;
      grps[li]=grps[li].filter(p=>_fSet.has(p.famous));
      if(!grps[li].length) delete grps[li];
    });
  }

  const isGridLane={};
  Object.keys(grps).forEach(liS=>{
    const li=+liS; if(li===0) return;
    isGridLane[li]=true;
  });

  function laneH(li){
    const n=(grps[li]||[]).length;
    if(_SL_ACTIVE && n===0) return 0;
    const rows=Math.ceil(n/GRID_COLS);
    return Math.max(MIN_LH, rows*GRID_CELL_H + LANE_PAD*2);
  }

  SL_NM={}; SL_STUDENTS={}; SL_EDGES=[];
  let linMembers=LINEAGE_CHAIN.map(n=>PEOPLE.find(p=>p.famous===n)).filter(Boolean);
  const _slActive = (typeof activeYear!=='undefined' && activeYear!==null);
  if(_slActive && !SL_LIN_OPEN){
    linMembers=linMembers.filter(p=>p.famous==='Prophet Muhammad');
  }
  const LIN_ROWS=Math.ceil(linMembers.length/GRID_COLS);
  const LH_LIN=LIN_ROWS*LIN_CELL_H+LIN_PAD*2;

  const TRAD_OFFSET=PT+LH_LIN;
  const laneStartY={};
  let curY=TRAD_OFFSET;
  LANES.forEach((lane,li)=>{
    if(li===0) return;
    laneStartY[li]=curY;
    curY+=laneH(li);
  });
  const SVG_H=curY+PB;

  const qProphets=new Set(['Adam','Idris','Nuh','Hud','Salih','Ibrahim','Lut','Ismail','Ishaq','Yaqub','Yusuf',"Shu'ayb",'Ayyub','Musa','Harun','Dawud','Sulayman','Ilyas','Yunus','Zakariyya','Yahya','Isa','Prophet Muhammad']);
  linMembers.forEach((p,idx)=>{
    const posInRow=idx%GRID_COLS;
    const gr=Math.floor(idx/GRID_COLS);
    const visualCol=(gr%2===1)?(GRID_COLS-1-posInRow):posInRow;
    const x=8+visualCol*GRID_CELL_W+GRID_CELL_W*0.5;
    const y=PT+LIN_PAD+gr*LIN_CELL_H+14;
    SL_NM[p.famous]={x, y, li:0, col:'#D4AF37'};
  });

  Object.keys(grps).forEach(liS=>{
    const li=+liS; if(li===0) return;
    const tradCol=TRAD_COLORS[LANES[li]];
    const sorted=grps[li].slice().sort((a,b)=>a.dob-b.dob);
    sorted.forEach((p,idx)=>{
      const col=tradCol||CC[gc(p.dob)]||'#D4AF37';
      const gridCol=idx%GRID_COLS;
      const gridRow=Math.floor(idx/GRID_COLS);
      const x=8+gridCol*GRID_CELL_W+NR;
      const y=laneStartY[li]+LANE_PAD+gridRow*GRID_CELL_H+GRID_CELL_H*0.5;
      SL_NM[p.famous]={x, y, li, col, _grid:true};
    });
  });
  PEOPLE.forEach(p=>{
    (p.teachers||[]).forEach(t=>{(SL_STUDENTS[t]=SL_STUDENTS[t]||[]).push(p.famous);});
  });

  const P=[];

  P.push(`<defs>
    <filter id="slg" x="-70%" y="-70%" width="240%" height="240%">
      <feGaussianBlur stdDeviation="4.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="slg2" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="2.5" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <marker id="arr-gold" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
      <path d="M0,0 L0,7 L7,3.5 z" fill="#D4AF37" opacity="0.8"/>
    </marker>
  </defs>`);

  P.push(`<rect x="0" y="${PT}" width="${TW}" height="${LH_LIN}" fill="#222D3A" />`);
  P.push(`<rect x="0" y="${PT}" width="5" height="${LH_LIN}" fill="#D4AF37" opacity="0.7" />`);
  P.push(`<line x1="0" y1="${PT+LH_LIN}" x2="${TW}" y2="${PT+LH_LIN}" stroke="rgba(212,175,55,0.35)" stroke-width="1.5"/>`);

  LANES.forEach((lane,li)=>{
    if(li===0) return;
    const y=laneStartY[li], h=laneH(li);
    const col=TRAD_COLORS[lane]||(grps[li]&&grps[li][0]?CC[gc(grps[li][0].dob)]:'#D4AF37')||'#D4AF37';
    P.push(`<rect x="0" y="${y}" width="${TW}" height="${h}" fill="${li%2===1?'rgba(0,0,0,0.11)':'rgba(0,0,0,0.04)'}" />`);
    P.push(`<rect x="0" y="${y}" width="2" height="${h}" fill="${col}" opacity="0.45" />`);
    P.push(`<line x1="0" y1="${y+h}" x2="${TW}" y2="${y+h}" stroke="rgba(45,55,72,.28)" stroke-width="1" />`);
  });

  P.push(`<line x1="${PRE_W}" y1="0" x2="${PRE_W}" y2="${SVG_H}" stroke="rgba(212,175,55,0.16)" stroke-width="1.5" />`);
  if(!(_SL_ACTIVE && activeYear>500)){
    P.push(`<text x="${(PRE_W/2).toFixed(1)}" y="22" font-family="Cinzel,serif" font-size="9" text-anchor="middle" fill="#A0AEC0" letter-spacing="1.5">PRE-ISLAMIC</text>`);
  }
  for(let yr=600;yr<=2000;yr+=100){
    const x=x2px(yr).toFixed(1), c=gc(yr);
    P.push(`<line x1="${x}" y1="0" x2="${x}" y2="${SVG_H}" stroke="rgba(212,175,55,.04)" stroke-width="1" />`);
  }

  PEOPLE.forEach(p=>{
    if(!p.teachers?.length) return;
    const to=SL_NM[p.famous]; if(!to) return;
    p.teachers.forEach(tn=>{
      const fr=SL_NM[tn]; if(!fr) return;
      const dx=to.x-fr.x;
      const st=Math.min(Math.abs(dx)*.42,110)+18;
      const d=`M${fr.x.toFixed(1)},${fr.y.toFixed(1)} C${(fr.x+st).toFixed(1)},${fr.y.toFixed(1)} ${(to.x-st).toFixed(1)},${to.y.toFixed(1)} ${to.x.toFixed(1)},${to.y.toFixed(1)}`;
      SL_EDGES.push({from:tn, to:p.famous, col:fr.col, d});
    });
  });

  const SL_CONNECTED=new Set();
  SL_EDGES.forEach(e=>{SL_CONNECTED.add(e.from);SL_CONNECTED.add(e.to);});
  linMembers.forEach(p=>SL_CONNECTED.add(p.famous));

  P.push(`<g id="sl-active-edges"></g>`);

  PEOPLE.forEach(p=>{
    if(isLineageMember(p)) return;
    const nd=SL_NM[p.famous]; if(!nd) return;
    const hasFree=p.books&&p.books.some(b=>b.url&&b.url.startsWith('http'));
    const r=hasFree?NR:NR-1;
    P.push(`<circle class="sl-node" data-name="${esc(p.famous)}" cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="${r}" fill="${nd.col}" fill-opacity="0.85" stroke="${nd.col}" stroke-width="1.4" stroke-opacity="0.9"/>`);
    const _sn=p.famous.length>14?p.famous.slice(0,13)+'…':p.famous;
    P.push(`<text class="sl-node-text" data-name="${esc(p.famous)}" x="${(nd.x+r+3).toFixed(1)}" y="${(nd.y+3.5).toFixed(1)}" font-size="11" font-family="Cinzel,serif" font-weight="500" fill="${nd.col}" fill-opacity="0.85" pointer-events="none">${esc(_sn)}</text>`);
  });

  {
    for(let r=0;r<LIN_ROWS;r++){
      const start=r*GRID_COLS;
      const end=Math.min(start+GRID_COLS, linMembers.length);
      const pts=[];
      for(let i=start;i<end;i++){
        const nd=SL_NM[linMembers[i].famous];
        if(nd) pts.push(nd);
      }
      if(pts.length>1){
        let d=`M${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
        for(let i=1;i<pts.length;i++) d+=` L${pts[i].x.toFixed(1)},${pts[i].y.toFixed(1)}`;
        P.push(`<path d="${d}" stroke="#D4AF37" stroke-width="2" fill="none" opacity="0.7"/>`);
      }
      if(r<LIN_ROWS-1){
        const tailNd=SL_NM[linMembers[end-1].famous];
        const headNd=SL_NM[linMembers[end].famous];
        if(tailNd&&headNd){
          const bulge=(r%2===0)?28:-28;
          const bx=tailNd.x+bulge;
          const my=(tailNd.y+headNd.y)/2;
          P.push(`<path d="M${tailNd.x.toFixed(1)},${tailNd.y.toFixed(1)} C${bx.toFixed(1)},${tailNd.y.toFixed(1)} ${bx.toFixed(1)},${headNd.y.toFixed(1)} ${headNd.x.toFixed(1)},${headNd.y.toFixed(1)}" stroke="#D4AF37" stroke-width="1.6" fill="none" opacity="0.55"/>`);
        }
      }
    }
    const lastNd=SL_NM[linMembers[linMembers.length-1].famous];
    if(lastNd){
      P.push(`<path d="M${(lastNd.x-6).toFixed(1)},${lastNd.y.toFixed(1)} L${(lastNd.x-14).toFixed(1)},${lastNd.y.toFixed(1)}" stroke="#D4AF37" stroke-width="2.5" fill="none" opacity="0.88" marker-end="url(#arr-gold)"/>`);
    }
  }

  {
    const bigSet=new Set(['Adam','Idris','Nuh','Ibrahim','Ismail','Prophet Muhammad']);
    linMembers.forEach(p=>{
      const nd=SL_NM[p.famous]; if(!nd) return;
      const isPM=p.famous==='Prophet Muhammad';
      const isQ=qProphets.has(p.famous);
      const isBig=bigSet.has(p.famous);
      const r=isPM?10:isBig?7:isQ?6:4;
      const _pmHide = isPM && _slActive && activeYear>632;
      const _pmStar = isPM && _slActive && activeYear<570;
      if(_pmHide) return;
      if(isPM && !_pmStar){
        P.push(`<circle cx="${nd.x.toFixed(1)}" cy="${nd.y}" r="16" fill="none" stroke="#D4AF37" stroke-width="1.1"><animate attributeName="r" values="14;24;14" dur="3.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="3.8s" repeatCount="indefinite"/></circle>`);
      }
      const flt=isPM?'filter="url(#slg)"':isQ?'filter="url(#slg2)"':'';
      if(_pmStar){
        P.push(`<text class="sl-node sl-lin-node" data-name="${esc(p.famous)}" x="${nd.x.toFixed(1)}" y="${(nd.y+7).toFixed(1)}" text-anchor="middle" font-size="26" fill="none" stroke="#D4AF37" stroke-width="1.2" style="cursor:pointer">☆</text>`);
      } else {
        P.push(`<circle class="sl-node sl-lin-node" data-name="${esc(p.famous)}" cx="${nd.x.toFixed(1)}" cy="${nd.y}" r="${r}" fill="#D4AF37" fill-opacity="${isPM?.95:isQ?.85:.6}" stroke="#D4AF37" stroke-width="${isPM?2.5:isQ?1.6:1}" stroke-opacity=".8" ${flt}/>`);
      }
      const labelY=nd.y+r+11;
      let shortName;
      if(isPM) shortName='Prophet Muhammad ☆';
      else if(isBig) shortName=p.famous.split(' ')[0];
      else{
        const parts=p.famous.split(' ');
        const cutIdx=parts.findIndex((w,i)=>i>0&&(w==='ibn'||w==='bin'||w==='bint'));
        shortName=(cutIdx>0?parts.slice(0,cutIdx):parts.slice(0,2)).join(' ');
        if(shortName.length>14) shortName=shortName.slice(0,13)+'…';
      }
      const fw=isBig?'700':'500';
      P.push(`<text x="${nd.x.toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="middle" font-size="11" font-family="Cinzel,serif" fill="#D4AF37" font-weight="${fw}" fill-opacity="0.85" pointer-events="none">${esc(shortName)}</text>`);
    });
  }
  const mainDiv=document.getElementById('silsilaMain');
  mainDiv.innerHTML=`<svg id="silsilaSVG" xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${SVG_H}" style="display:block;min-width:${TW}px">${P.join('\n')}</svg>`;

  // (Lifted code originally injected a "How This Works" button + AnimControls into a row above silsilaBody.
  // In the sandbox shell, ANIMATE lives in Zone D and HTW lives in Zone B. Skip that injection.)

  const inner=document.getElementById('silsilaLanesInner');
  let lh=`<div style="height:${PT}px;display:flex;align-items:flex-end;padding:0 12px 5px;font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.12em;color:rgba(212,175,55,.16)">TRADITION / CHAIN</div>`;
  if(!_SL_ACTIVE){
    lh+=`<div class="sl-lane-label" data-lane="${esc(PL)}" style="height:${LH_LIN}px;background:#222D3A">
      <span class="sl-lane-dot" style="background:#D4AF37;box-shadow:0 0 6px rgba(212,175,55,.6)"></span>
      <span class="sl-lane-name" style="color:#D4AF37">${SL_LIN_OPEN?'◉':'⭕'} Prophets' Lineage</span>
      <span class="sl-lane-count">${linMembers.length}</span>
    </div>`;
  } else {
    lh+=`<div class="sl-lane-label" data-lane="${esc(PL)}" style="height:${LH_LIN}px;background:#222D3A"></div>`;
  }
  LANES.forEach((lane,li)=>{
    if(li===0) return;
    const col=TRAD_COLORS[lane]||(grps[li]&&grps[li][0]?CC[gc(grps[li][0].dob)]:'#D4AF37')||'#D4AF37';
    const count=(grps[li]||[]).length;
    const hideLbl = _SL_ACTIVE && (lane==='Prophets' || lane==='Quranic Prophets' || count===0);
    if(hideLbl){
      lh+=`<div class="sl-lane-label" data-lane="${esc(lane)}" style="height:${laneH(li)}px;visibility:hidden"></div>`;
    } else {
      lh+=`<div class="sl-lane-label" data-lane="${esc(lane)}" style="height:${laneH(li)}px">
        <span class="sl-lane-dot" style="background:${col};box-shadow:0 0 5px ${col}55"></span>
        <span class="sl-lane-name" style="color:${col}">${esc(lane)}</span>
        <span class="sl-lane-count">${count}</span>
      </div>`;
    }
  });
  inner.innerHTML=lh;

  if(!mainDiv._slScrollBound){
    mainDiv._slScrollBound=true;
    mainDiv.addEventListener('scroll',()=>{
      const _inn=document.getElementById('silsilaLanesInner');
      if(_inn) _inn.style.transform=`translateY(-${mainDiv.scrollTop}px)`;
    },{passive:true});
  }

  const lanesWrap=document.getElementById('silsilaLanes');
  if(!lanesWrap._slBound){
    lanesWrap._slBound=true;
    lanesWrap.addEventListener('click',e=>{
      const lbl=e.target.closest('.sl-lane-label'); if(!lbl) return;
      const t=lbl.dataset.lane;
      if(t==='Prophetic Lineage'){
        SL_LIN_OPEN=!SL_LIN_OPEN;
        SL_LANES_KEY='';
        document.getElementById('silsilaMain').innerHTML='';
        document.getElementById('silsilaLanesInner').innerHTML='';
        renderSilsila();
        return;
      }
      const isIHSub=IH_SUBLANE_ORDER.includes(t);
      const tradKey=isIHSub?'Islamic History':t;
      if(selTrads.size===1&&selTrads.has(tradKey)) selTrads.clear();
      else { selTrads.clear(); selTrads.add(tradKey); }
      syncDD('trad'); syncSLDD('trad'); applyFilterAndFocus();
    });
  }

  let tt=document.getElementById('sl-tt');
  if(!tt){
    tt=document.createElement('div'); tt.id='sl-tt';
    tt.style.cssText='position:fixed;pointer-events:none;display:none;z-index:9999;'+
      'background:var(--surface2);border:1.5px solid var(--border);border-radius:4px;'+
      'padding:7px 12px;font-size:var(--fs-3);color:var(--text);'+
      'box-shadow:0 4px 22px rgba(0,0,0,.7);max-width:240px;line-height:1.5;'+
      'transition:opacity .1s';
    document.body.appendChild(tt);
  }
  let ttPinned=false;

  function pinTooltip(p, x, y){
    const col=SL_NM[p.famous]?.col||'#A0AEC0';
    const _rd=(p.dob_academic!=null)?p.dob_academic:null;
    const dob_s=(_rd!=null)?(_rd<0?`${Math.abs(_rd)} BCE`:`${_rd} CE`):(p.dob_s||'—');
    const nT=(p.teachers||[]).length, nS=(SL_STUDENTS[p.famous]||[]).length;
    tt.innerHTML=
      `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;font-size:var(--fs-3);margin-bottom:2px;cursor:pointer;border-bottom:1px solid rgba(212,175,55,.3);padding-bottom:5px;margin-bottom:6px" id="tt-name-link" data-name="${esc(p.famous)}">${esc(p.famous)}<span style="font-size:var(--fs-3);opacity:.5;margin-left:5px">→ TIMELINE</span></div>`+
      `<div style="font-family:'Crimson Pro',serif;font-size:var(--fs-3);color:${col};font-style:normal;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
      `<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;color:${col};opacity:0.7">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
      (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.05em;color:rgba(212,175,55,.55);margin-top:3px">`+
        (nT?`↑ ${nT} teacher${nT>1?'s':''}  `:'')+( nS?`↓ ${nS} student${nS>1?'s':''}`:'')+`</div>`:'');
    tt.style.pointerEvents='all';
    tt.style.cursor='default';
    tt.style.display='block';
    ttPinned=true;
    const nameLink=tt.querySelector('#tt-name-link');
    if(nameLink) nameLink.onclick=e=>{
      e.stopPropagation();
      const name=nameLink.dataset.name;
      unpinTooltip();
      closeSilsilaCard();
      focusPersonInTimeline(name);
    };
    tt.onclick=e=>e.stopPropagation();
    const tw=240, th=90;
    let lx=x+16, ly=y-10;
    if(lx+tw>window.innerWidth-8) lx=x-tw-16;
    if(ly+th>window.innerHeight-8) ly=window.innerHeight-th-8;
    if(ly<8) ly=8;
    tt.style.left=lx+'px'; tt.style.top=ly+'px';
  }

  function showHoverTooltip(p, x, y){
    if(ttPinned) return;
    const col=SL_NM[p.famous]?.col||'#A0AEC0';
    const _rd=(p.dob_academic!=null)?p.dob_academic:null;
    const dob_s=(_rd!=null)?(_rd<0?`${Math.abs(_rd)} BCE`:`${_rd} CE`):(p.dob_s||'—');
    const nT=(p.teachers||[]).length, nS=(SL_STUDENTS[p.famous]||[]).length;
    tt.innerHTML=
      `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;margin-bottom:3px;font-size:var(--fs-3)">${esc(p.famous)}</div>`+
      `<div style="font-family:'Crimson Pro',serif;font-size:var(--fs-3);color:${col};font-style:normal;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
      `<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;color:${col};opacity:0.7">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
      (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.05em;color:rgba(212,175,55,.55);margin-top:3px">`+
        (nT?`↑ ${nT} teacher${nT>1?'s':''}  `:'')+( nS?`↓ ${nS} student${nS>1?'s':''}`:'')+`</div>`:'');
    tt.style.pointerEvents='none';
    tt.style.display='block';
  }

  function unpinTooltip(){
    ttPinned=false;
    tt.style.pointerEvents='none';
    tt.style.display='none';
  }

  const svg=document.getElementById('silsilaSVG');
  let _silsilaHighlighted=null;

  function getDirectChain(name){
    const p=PEOPLE.find(pp=>pp.famous===name);
    const teachers=new Set(p?.teachers||[]);
    const students=new Set(SL_STUDENTS[name]||[]);
    return {self:name, teachers, students, all:new Set([name,...teachers,...students])};
  }

  function renderChainEdges(name){
    const {teachers, students, all}=getDirectChain(name);
    const grp=svg.querySelector('#sl-active-edges'); if(!grp) return;
    const paths=SL_EDGES
      .filter(e=>(e.to===name && teachers.has(e.from)) || (e.from===name && students.has(e.to)))
      .map(e=>`<path class="sl-edge sl-chain-edge" data-from="${esc(e.from)}" data-to="${esc(e.to)}" d="${e.d}" stroke="${e.col}" stroke-width="1.8" fill="none" opacity="0.82"/>`)
      .join('\n');
    grp.innerHTML=paths;
  }

  function clearChainEdges(){
    const grp=svg.querySelector('#sl-active-edges'); if(!grp) return;
    grp.innerHTML='';
  }

  function _silsilaClearHighlight(){
    _silsilaHighlighted=null;
    clearChainEdges();
    svg.querySelectorAll('.sl-node,.sl-node-text').forEach(n=>n.classList.remove('sl-dim','sl-selected'));
    if(tt){tt.style.display='none';tt.style.pointerEvents='none';}
    ttPinned=false;
  }

  svg.addEventListener('click',e=>{
    const nd=e.target.closest('.sl-node'); if(!nd) return;
    const name=nd.dataset.name;
    const p=PEOPLE.find(pp=>pp.famous===name); if(!p) return;
    activePerson=p;

    if(_silsilaHighlighted===name){
      const col=SL_NM[p.famous]?.col||'#A0AEC0';
      const _rd=(p.dob_academic!=null)?p.dob_academic:null;
      const dob_s=(_rd!=null)?(_rd<0?`${Math.abs(_rd)} BCE`:`${_rd} CE`):(p.dob_s||'—');
      const nT=(p.teachers||[]).length, nS=(SL_STUDENTS[p.famous]||[]).length;
      tt.innerHTML=
        `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;font-size:var(--fs-3);margin-bottom:2px">${esc(p.famous)}</div>`+
        `<div style="font-family:'Crimson Pro',serif;font-size:var(--fs-3);color:var(--text2);font-style:normal;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
        `<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.06em;color:var(--muted)">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
        (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.05em;color:rgba(212,175,55,.55);margin-top:3px">`+
          (nT?`↑ ${nT} teacher${nT>1?'s':''}  `:'')+( nS?`↓ ${nS} student${nS>1?'s':''}`:'')+`</div>`:'')+
        `<button id="sl-tt-timeline-btn" style="background:var(--accent);color:var(--bg);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:0.1em;padding:4px 12px;border:none;border-radius:2px;cursor:pointer;margin-top:6px;display:block">TIMELINE</button>`;
      tt.style.pointerEvents='all';
      tt.style.display='block';
      ttPinned=true;
      const tw=240, th=90;
      let lx=e.clientX+16, ly=e.clientY-10;
      if(lx+tw>window.innerWidth-8) lx=e.clientX-tw-16;
      if(ly+th>window.innerHeight-8) ly=window.innerHeight-th-8;
      if(ly<8) ly=8;
      tt.style.left=lx+'px'; tt.style.top=ly+'px';
      const tlBtn=tt.querySelector('#sl-tt-timeline-btn');
      if(tlBtn) tlBtn.onclick=ev=>{ev.stopPropagation();unpinTooltip();closeSilsilaCard();focusPersonInTimeline(name);};
      tt.onclick=ev=>ev.stopPropagation();
      return;
    }

    _silsilaHighlighted=name;
    svg.querySelectorAll('.sl-node.sl-selected').forEach(n=>n.classList.remove('sl-selected'));
    nd.classList.add('sl-selected');
    renderChainEdges(p.famous);
    const teachers=new Set(p.teachers||[]);
    const students=new Set(SL_STUDENTS[name]||[]);
    const connected=new Set([name,...teachers,...students]);
    svg.querySelectorAll('.sl-node,.sl-node-text').forEach(n=>{
      n.classList.toggle('sl-dim',!connected.has(n.dataset.name));
    });
    const inner2=document.getElementById('silsilaLanesInner');
    if(inner2){
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>l.classList.remove('sl-lane-sel'));
      const tl=isLineageMember(p)?PL:(getIHSubLane(p)||p.tradition||'');
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>{if(l.dataset.lane===tl)l.classList.add('sl-lane-sel');});
    }
    if(tt){tt.style.display='none';tt.style.pointerEvents='none';}
    ttPinned=false;
  });

  if(activePerson){
    svg.querySelectorAll('.sl-node').forEach(nd=>{
      if(nd.dataset.name===activePerson.famous) nd.classList.add('sl-selected');
    });
  }

  if(!window._slOutsideClickBound){
    window._slOutsideClickBound=true;
    window._slOutsideClickHandler=function(e){
      const _svg=document.getElementById('silsilaSVG'); if(!_svg) return;
      if(e.target.closest('.sl-node')||e.target.closest('#silsilaCard')||e.target.closest('#sl-tt')) return;
      _silsilaClearHighlight();
    };
    document.addEventListener('click',window._slOutsideClickHandler);
  }

  updateSilsilaHighlight();
}


function updateSilsilaHighlight(){
  const svg=document.getElementById('silsilaSVG'); if(!svg) return;

  const _slYr2 = (typeof activeYear !== 'undefined' && activeYear !== null) ? activeYear : null;
  const newKey=_getActiveSLLanes().join('\x00') + '|' + (_slYr2 !== null ? _slYr2 : 'all');
  if(newKey!==SL_LANES_KEY){
    renderSilsila();
    return;
  }

  svg.querySelectorAll('.sl-node').forEach(nd=>{
    const name=nd.dataset.name;
    let op=1;
    if(activeYear!==null){
      const p=PEOPLE.find(pp=>pp.famous===name);
      if(p){
        const dod=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
        if(p.dob>activeYear||dod<activeYear) op=0.06;
      }
    }
    nd.style.opacity=op<1?String(op):'';
  });
  const grp=svg.querySelector('#sl-active-edges');
  if(grp && grp.children.length){
    grp.innerHTML='';
    svg.querySelectorAll('.sl-node').forEach(n=>{n.style.opacity='';});
  }

  syncSLDD('type'); syncSLDD('trad');

  if(typeof searchQ!=='undefined'&&searchQ){
    silsilaSearch(searchQ);
  }
}

function silsilaLocate(name){
  const svg=document.getElementById('silsilaSVG');
  const mainDiv=document.getElementById('silsilaMain');
  if(!svg||!mainDiv) return;
  const nd=SL_NM[name]; if(!nd) return;

  const vw=mainDiv.clientWidth, vh=mainDiv.clientHeight;
  const targetX=Math.max(0, nd.x - vw/2);
  const targetY=Math.max(0, nd.y - vh/2);
  mainDiv.scrollTo({left:targetX, top:targetY, behavior:'smooth'});

  const inner=document.getElementById('silsilaLanesInner');
  if(inner) setTimeout(()=>{ inner.style.transform=`translateY(-${mainDiv.scrollTop}px)`; },320);

  const circle=svg.querySelector(`.sl-node[data-name="${name.replace(/"/g,'&quot;')}"]`);
  if(circle){
    const origR=circle.getAttribute('r');
    const origFilter=circle.getAttribute('filter')||'';
    circle.style.transition='r .15s, filter .15s';
    circle.setAttribute('r',Math.round(+origR*2.4));
    circle.setAttribute('filter','url(#slg)');
    setTimeout(()=>{
      circle.setAttribute('r',origR);
      if(!origFilter) circle.removeAttribute('filter');
      else circle.setAttribute('filter',origFilter);
    },520);
  }
}

// ═══════════════════════════════════════════════════════════
// SILSILA FLOATING DETAIL CARD
// ═══════════════════════════════════════════════════════════
function openSilsilaCard(p, cx, cy){
  const card=document.getElementById('silsilaCard');
  if(!card) return;
  const col=isLineageMember(p)?'#D4AF37':(TRAD_COLORS[p.tradition]||'#A0AEC0');
  document.getElementById('scCardName').textContent=p.famous;
  document.getElementById('scCardName').style.color=col;
  document.getElementById('scCardSub').textContent=p.primaryTitle||p.tradition||'';

  const _rDob=(p.dob_academic!=null)?p.dob_academic:null;
  const _rDod=(p.dod_academic!=null)?p.dod_academic:null;
  const dob_s=(_rDob!=null)?(_rDob<0?`${Math.abs(_rDob)} BCE`:`${_rDob} CE`):(p.dob_s||'—');
  const dod_s=(_rDod!=null)?(_rDod<0?`${Math.abs(_rDod)} BCE`:`${_rDod} CE`):(p.dod_s||'—');
  const studentsOf=PEOPLE.filter(s=>s.teachers?.includes(p.famous));

  let html=`
    ${canShowImage(p) ? `
    <div id="scWikiImgWrap" style="float:right;margin:0 0 10px 12px;max-width:90px;text-align:center">
      <img id="scWikiImg" style="display:none;width:100%;max-width:90px;border-radius:4px;border:1px solid var(--ip-brd);object-fit:cover"
        alt="${esc(p.famous)}"
        onerror="this.style.display='none';document.getElementById('scWikiImgCaption').style.display='none';" />
      <div id="scWikiImgCaption" style="display:none;font-size:var(--fs-3);color:var(--ip-muted);font-family:'Cinzel',serif;letter-spacing:.06em;margin-top:3px">via Wikipedia</div>
    </div>` : ''}
    <div class="sc-tags">
      <span class="sc-tag hi" style="color:${col};border-color:${col}55">${esc(p.type||'')}</span>
      <span class="sc-tag hi" style="color:${col};border-color:${col}55">${esc(p.tradition||'')}</span>
      ${p.city?`<span class="sc-tag">📍 ${esc(p.city)}</span>`:''}
    </div>
    ${(()=>{if(!window._wikidata||!window._wikidata[p.slug]||!window._wikidata[p.slug].occupations||!window._WD_OCC_LABELS) return '';const chips=window._wikidata[p.slug].occupations.slice(0,5).map(q=>window._WD_OCC_LABELS[q]).filter(Boolean);if(!chips.length) return '';return '<div class="sl-wd-occupations">'+chips.map(l=>'<span class="sl-wd-occ">'+esc(l)+'</span>').join('')+'</div>';})()}
    <div class="sc-dates">
      <div class="sc-di"><span class="dl">BORN</span><span class="dv" style="color:${col}">${dob_s}</span></div>
      <div class="sc-di"><span class="dl">DIED</span><span class="dv" style="color:${col}">${dod_s}</span></div>
    </div>
    ${p.school?`<div class="sc-sec">BIOGRAPHY</div><p class="sc-bio">${esc(p.school)}</p>`:''}
  `;

  if(p.teachers?.length){
    const known=p.teachers.filter(t=>PEOPLE.find(pp=>pp.famous===t));
    if(known.length){
      html+=`<div class="sc-sec">TEACHERS</div><div class="sc-link-row">
        ${known.map(t=>`<span class="sc-link" onclick="jumpTo('${t.replace(/'/g,"\\'")}')">⟵ ${esc(t)}</span>`).join('')}
      </div>`;
    }
  }
  if(studentsOf.length){
    html+=`<div class="sc-sec">STUDENTS (${studentsOf.length})</div><div class="sc-link-row">
      ${studentsOf.map(s=>`<span class="sc-link" onclick="jumpTo('${s.famous.replace(/'/g,"\\'")}')">▶ ${esc(s.famous)}</span>`).join('')}
    </div>`;
  }
  if(p.books?.length){
    const sortedBooks=[...p.books].sort((a,b)=>/quran/i.test(a.title)?-1:/quran/i.test(b.title)?1:0);
    html+=`<div class="sc-sec">WORKS & SOURCES</div>`;
    sortedBooks.forEach(b=>{
      html+=`<div class="sc-book">
        ${b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">${esc(b.title)}</a>`:`<span style="color:var(--ip-text);font-size:var(--fs-3)">${esc(b.title)}</span>`}
        ${b.magnum?` <span style="color:var(--accent);font-size:var(--fs-3)">✦</span>`:''}
        ${b.note?`<div style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;margin-top:1px">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">quran.com</a>')}</div>`:''}
      </div>`;
    });
  }
  if(p.source){
    html+=`<div style="font-size:var(--fs-3);color:var(--ip-muted);font-style:normal;margin-top:12px;padding-top:8px;border-top:1px solid var(--ip-brd)">Sources: ${esc(p.source)}</div>`;
  }

  if(window._wikidata&&window._wikidata[p.slug]&&window._wikidata[p.slug].wikipedia&&window._wikidata[p.slug].wikipedia.en){
    html+=`<a class="sl-wiki-link" href="https://en.wikipedia.org/wiki/${encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">Wikipedia ↗</a>`;
  }

  document.getElementById('scCardBody').innerHTML=html;
  document.getElementById('scCardScroll').scrollTop=0;

  if (canShowImage(p)) {
    var scImgEl = document.getElementById('scWikiImg');
    var scCapEl = document.getElementById('scWikiImgCaption');
    if (scImgEl) fetchWikiImage(p.source, scImgEl, scCapEl);
  }

  card.style.display='flex';
  requestAnimationFrame(()=>{
    const CW=card.offsetWidth||310, CH=Math.min(card.offsetHeight,window.innerHeight*0.75);
    const vw=window.innerWidth, vh=window.innerHeight;
    let left=cx+16, top=cy-40;
    if(left+CW>vw-10) left=cx-CW-16;
    if(top+CH>vh-10) top=vh-CH-10;
    if(top<8) top=8;
    if(left<8) left=8;
    card.style.left=left+'px'; card.style.top=top+'px';
    card.style.maxHeight=Math.min(window.innerHeight*0.75,640)+'px';
    card.classList.add('visible');
  });
}

function closeSilsilaCard(){
  const card=document.getElementById('silsilaCard');
  if(card){card.classList.remove('visible');setTimeout(()=>{card.style.display='none';},160);}
  const tt=document.getElementById('sl-tt');
  if(tt){tt.style.pointerEvents='none';tt.style.display='none';}
  const svg=document.getElementById('silsilaSVG');
  if(svg){
    svg.querySelectorAll('.sl-node.sl-selected').forEach(n=>n.classList.remove('sl-selected'));
    const grp=svg.querySelector('#sl-active-edges'); if(grp) grp.innerHTML='';
  }
  activePerson=null;
}
window.closeSilsilaCard=closeSilsilaCard;

// Close card on outside click — bind once, persistent
if(!window._slCardOutsideClickBound){
  window._slCardOutsideClickBound=true;
  window._slCardOutsideClickHandler=function(e){
    const card=document.getElementById('silsilaCard');
    if(!card||!card.classList.contains('visible')) return;
    if(!card.contains(e.target)&&!e.target.closest('.sl-node')) closeSilsilaCard();
  };
  document.addEventListener('click',window._slCardOutsideClickHandler);
}

// ═══════════════════════════════════════════════════════════
// SILSILA FILTER DROPDOWNS (in top bar)
// ═══════════════════════════════════════════════════════════
function buildSLDD(kind, values){
  ['sl','map'].forEach(prefix=>{
    const panel=document.getElementById(prefix+'-'+(kind==='type'?'typePanel':'tradPanel'));
    if(!panel) return;
    // Only build once per panel
    if(panel.querySelector('.sl-dd-search')) return;
    const si=document.createElement('input');
    si.type='text';si.className='sl-dd-search';si.placeholder='Search...';
    si.oninput=function(){
      const q=si.value.toLowerCase();
      panel.querySelectorAll('.sl-dd-item:not(.sl-dd-all)').forEach(function(el){
        el.style.display=el.innerText.toLowerCase().includes(q)?'':'none';
      });
    };
    panel.appendChild(si);
    values.forEach(v=>{
      const el=document.createElement('div');
      el.className='sl-dd-item'; el.dataset.val=v;
      el.innerHTML=`<div class="sl-dd-ck"></div><span>${v}</span>`;
      el.onclick=()=>slDDToggle(kind,v);
      panel.appendChild(el);
    });
  });
}

function toggleSLDD(kind){
  const prefix=VIEW==='map'?'map':'sl';
  const panel=document.getElementById(prefix+'-'+(kind==='type'?'typePanel':'tradPanel'));
  const btn=document.getElementById(prefix+'-'+(kind==='type'?'typeBtn':'tradBtn'));
  if(!panel||!btn) return;
  const wasOpen=panel.classList.contains('open');
  document.querySelectorAll('.sl-dd-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.sl-dd-btn.open').forEach(b=>b.classList.remove('open'));
  document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.dd-btn.open').forEach(b=>b.classList.remove('open'));
  if(!wasOpen){
    panel.classList.add('open');btn.classList.add('open');
    var si=panel.querySelector('.sl-dd-search');
    if(si){si.value='';si.dispatchEvent(new Event('input'));si.focus();}
  }
}
window.toggleSLDD=toggleSLDD;

function slDDClearAll(kind){
  const sel=kind==='type'?selTypes:selTrads;
  sel.clear();
  syncDD(kind); syncSLDD(kind); applyFilterAndFocus();
}
window.slDDClearAll=slDDClearAll;

function slDDToggle(kind,v){
  const sel=kind==='type'?selTypes:selTrads;
  sel.has(v)?sel.delete(v):sel.add(v);
  syncDD(kind); syncSLDD(kind); applyFilterAndFocus();
}

function syncSLDD(kind){
  const sel=kind==='type'?selTypes:selTrads;
  const panelId=kind==='type'?'typePanel':'tradPanel';
  const btnId=kind==='type'?'typeBtn':'tradBtn';
  const lblId=kind==='type'?'typeLbl':'tradLbl';
  const allCkId=kind==='type'?'typeAllCk':'tradAllCk';

  ['sl','map'].forEach(prefix=>{
    const panel=document.getElementById(prefix+'-'+panelId);
    const btn=document.getElementById(prefix+'-'+btnId);
    const lbl=document.getElementById(prefix+'-'+lblId);
    const allCk=document.getElementById(prefix+'-'+allCkId);
    if(!panel) return;

    panel.querySelectorAll('.sl-dd-item:not(.sl-dd-all)').forEach(item=>{
      const on=sel.has(item.dataset.val);
      item.classList.toggle('selected',on);
      item.querySelector('.sl-dd-ck').textContent=on?'✓':'';
    });
    if(allCk) allCk.textContent=sel.size===0?'✓':'';
    if(btn) btn.classList.toggle('filtered',sel.size>0);
    if(lbl){
      if(sel.size===1) lbl.textContent=[...sel][0].length>14?[...sel][0].slice(0,12)+'…':[...sel][0];
      else if(sel.size>1) lbl.textContent=(kind==='type'?'TYPE':'TRADITION')+` (${sel.size})`;
      else lbl.textContent=kind==='type'?'TYPE':'TRADITION';
    }
    if(btn){
      var oldX=btn.querySelector('.dd-clear-x');
      if(oldX) oldX.remove();
      if(sel.size>0){
        var xEl=document.createElement('span');
        xEl.className='dd-clear-x';
        xEl.textContent='×';
        xEl.onclick=function(e){e.stopPropagation();slDDClearAll(kind);};
        btn.appendChild(xEl);
      }
    }
  });

  const parts=[];
  if(selTypes.size>0) parts.push([...selTypes].join(', '));
  if(selTrads.size>0) parts.push([...selTrads].join(', '));
  const sumEl=document.getElementById('sl-filterSummary');
  const clrEl=document.getElementById('sl-clearAll');
  if(sumEl){sumEl.textContent=parts.length?'↳ '+parts.join(' · '):'';sumEl.classList.toggle('visible',parts.length>0);}
  if(clrEl) clrEl.classList.toggle('visible',selTypes.size>0||selTrads.size>0);
}

if(!window._slDDOutsideBound){
  window._slDDOutsideBound=true;
  window._slDDOutsideHandler=function(e){
    if(!e.target.closest('.sl-dd-wrap')){
      document.querySelectorAll('.sl-dd-panel.open').forEach(p=>p.classList.remove('open'));
      document.querySelectorAll('.sl-dd-btn.open').forEach(b=>b.classList.remove('open'));
    }
  };
  document.addEventListener('click',window._slDDOutsideHandler);
}

// ═══════════════════════════════════════════════════════════
// SILSILA SEARCH — dim non-matching figures via sl-dim
// ═══════════════════════════════════════════════════════════
var _slSearchActive=false;

function silsilaSearch(query){
  var svg=document.getElementById('silsilaSVG'); if(!svg) return;
  var q=(query||'').trim().toLowerCase();

  svg.querySelectorAll('.sl-node,.sl-node-text').forEach(function(n){
    n.classList.remove('sl-dim','sl-selected');
  });
  var grp=svg.querySelector('#sl-active-edges'); if(grp) grp.innerHTML='';

  if(!q){ _slSearchActive=false; return; }
  _slSearchActive=true;

  var firstMatch=null;
  svg.querySelectorAll('.sl-node').forEach(function(nd){
    var name=nd.dataset.name;
    var p=PEOPLE.find(function(pp){return pp.famous===name;});
    if(!p) return;
    var vars=window._NAME_VARIANTS&&p.slug?window._NAME_VARIANTS[p.slug]||[]:[];
    var hay=[p.famous,p.full,p.primaryTitle,p.titles||'',p.city,p.classif,p.tradition,p.type].concat(p.tags||[]).concat(vars).join(' ').toLowerCase();
    var match=hay.indexOf(q)!==-1;
    nd.classList.toggle('sl-dim',!match);
    if(!firstMatch&&match) firstMatch=nd;
  });
  svg.querySelectorAll('.sl-node-text').forEach(function(nd){
    var name=nd.dataset.name;
    var p=PEOPLE.find(function(pp){return pp.famous===name;});
    if(!p) return;
    var vars=window._NAME_VARIANTS&&p.slug?window._NAME_VARIANTS[p.slug]||[]:[];
    var hay=[p.famous,p.full,p.primaryTitle,p.titles||'',p.city,p.classif,p.tradition,p.type].concat(p.tags||[]).concat(vars).join(' ').toLowerCase();
    nd.classList.toggle('sl-dim',hay.indexOf(q)===-1);
  });

  if(firstMatch){
    var mainDiv=document.getElementById('silsilaMain');
    if(mainDiv){
      var nd=SL_NM[firstMatch.dataset.name];
      if(nd){
        var vw=mainDiv.clientWidth, vh=mainDiv.clientHeight;
        mainDiv.scrollTo({left:Math.max(0,nd.x-vw/2), top:Math.max(0,nd.y-vh/2), behavior:'smooth'});
      }
    }
  }
}
window.silsilaSearch=silsilaSearch;

// (NOTE: original silsila.js auto-bound to #search input on load; we wire that in mount() instead.)

window._captureState_silsila=function(){
  var m=document.getElementById('silsilaMain');
  return{scrollY:m?m.scrollTop:0,year:typeof activeYear!=='undefined'?activeYear:null};
};
window._restoreState_silsila=function(s){
  if(!s) return;
  if(s.year!=null&&typeof _setSliderYear==='function') _setSliderYear(s.year);
  if(s.scrollY){var m=document.getElementById('silsilaMain');if(m) m.scrollTop=s.scrollY;}
};

function _showSilsilaMethodology(){
  if(document.getElementById('sl-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='sl-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="sl-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 16px">Chains of knowledge transmission — who taught whom across generations. Colors represent intellectual traditions. This is how Islamic scholarship was preserved: person to person, century after century.</p>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'+'<div style="font-size:var(--fs-3);line-height:1.7"><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#D4AF37;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Silsila</span><span style="color:#A0AEC0">Arabic for “chain” — unbroken teacher-to-student transmission</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#7C8FBF;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Tradition color</span><span style="color:#A0AEC0">Each tradition (Sunni, Shia, Sufi, etc.) has its own color</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ccc;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Line</span><span style="color:#A0AEC0">A documented teacher → student relationship</span></div></div>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 12px">Teacher–student relationships from classical biographical dictionaries. Not all links are documented. Some figures taught hundreds; only the most significant are included.</p>'+'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin:0">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('sl-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

  // ═══════════════════════════════════════════════════════════
  // SCAFFOLD INJECTION + ZONE B WIRING + MOUNT/UNMOUNT
  // ═══════════════════════════════════════════════════════════
  function _injectScaffold(zoneCEl){
    zoneCEl.innerHTML =
      '<div id="silsilaView" class="active">' +
        '<div id="silsilaBody" style="display:flex;flex:1;overflow:hidden">' +
          '<div id="silsilaLanes"><div id="silsilaLanesInner"></div></div>' +
          '<div id="silsilaMain"></div>' +
        '</div>' +
      '</div>' +
      '<div id="silsilaCard">' +
        '<div id="scCardHdr">' +
          '<button id="scCardClose" onclick="closeSilsilaCard()">✕</button>' +
          '<div id="scCardName" title="Click to view in Timeline"></div>' +
          '<div id="scCardNameHint">click name to open in timeline →</div>' +
          '<div id="scCardSub"></div>' +
        '</div>' +
        '<div id="scCardScroll"><div id="scCardBody"></div></div>' +
      '</div>';
  }

  // Year-slider engine — drives activeYear and re-renders silsila.
  // Mirrors the TIMELINE _setSliderYear / _initSlider pattern.
  var MIN_YR = 500, MAX_YR = 2000;
  function _setSliderYear(yr){
    if(yr < MIN_YR) yr = MIN_YR;
    if(yr > MAX_YR) yr = MAX_YR;
    activeYear = yr;
    window.activeYear = yr;
    var pct = ((yr - MIN_YR) / (MAX_YR - MIN_YR)) * 100;
    var thumb = document.getElementById('sliderThumb');
    var fill  = document.getElementById('sliderFill');
    var trk   = document.getElementById('sliderTrack');
    var yd    = document.getElementById('yearDisplay');
    var cb    = document.getElementById('yearClearBtn');
    if(thumb) thumb.style.left = pct + '%';
    if(fill)  fill.style.width  = pct + '%';
    if(trk)   trk.classList.remove('sl-inactive');
    if(yd)    yd.textContent = yr + ' CE';
    if(cb)    cb.classList.add('active');
    renderSilsila();
  }
  function _clearSliderYear(){
    activeYear = null;
    window.activeYear = null;
    var thumb = document.getElementById('sliderThumb');
    var fill  = document.getElementById('sliderFill');
    var trk   = document.getElementById('sliderTrack');
    var yd    = document.getElementById('yearDisplay');
    var cb    = document.getElementById('yearClearBtn');
    if(thumb) thumb.style.left = '0%';
    if(fill)  fill.style.width  = '0%';
    if(trk)   trk.classList.add('sl-inactive');
    if(yd)    yd.textContent = '—';
    if(cb)    cb.classList.remove('active');
    renderSilsila();
  }
  function _initSilsilaSlider(){
    var track = document.getElementById('sliderTrack');
    var thumb = document.getElementById('sliderThumb');
    if(!track || !thumb) return;
    function px2yr(px, w){
      var raw = MIN_YR + Math.max(0, Math.min(1, px / w)) * (MAX_YR - MIN_YR);
      return Math.round(raw / 5) * 5;
    }
    var dragging = false;
    function doMove(e){
      var r = track.getBoundingClientRect();
      var x = e.touches ? e.touches[0].clientX : e.clientX;
      _setSliderYear(px2yr(x - r.left, r.width));
    }
    thumb.addEventListener('mousedown',  function(e){ dragging = true; e.preventDefault(); doMove(e); });
    thumb.addEventListener('touchstart', function(e){ dragging = true; e.preventDefault(); doMove(e); }, { passive:false });
    track.addEventListener('click',      function(e){ var r = track.getBoundingClientRect(); _setSliderYear(px2yr(e.clientX - r.left, r.width)); });
    document.addEventListener('mousemove',  function(e){ if(!dragging) return; doMove(e); });
    document.addEventListener('touchmove',  function(e){ if(!dragging) return; doMove(e); }, { passive:false });
    document.addEventListener('mouseup',    function(){ dragging = false; });
    document.addEventListener('touchend',   function(){ dragging = false; });
    var clearBtn = document.getElementById('yearClearBtn');
    if(clearBtn) clearBtn.addEventListener('click', _clearSliderYear);
  }

  // Wire Zone B controls (built by shell.renderZoneB('SILSILA'))
  // Spec: search:true, slider:true, filters:[TYPE,TRADITION,HAS], actions:[★ Saved, Reset]
  function _wireZoneB(zoneBEl){
    // Search input
    var searchInp = document.getElementById('search');
    if(searchInp){
      searchInp.placeholder = 'Search figures…';
      searchInp.addEventListener('input', function(){
        searchQ = searchInp.value;
        silsilaSearch(searchQ);
      });
    }

    // Year slider (mounted by shell when spec.slider=true)
    if(document.getElementById('sliderTrack')) _initSilsilaSlider();

    if(!zoneBEl) return;
    var selects = zoneBEl.querySelectorAll('.zb-row2 .zb-select');
    var pills   = zoneBEl.querySelectorAll('.zb-pill');
    // Skip the HOW THIS WORKS pill when wiring view actions
    pills = Array.prototype.filter.call(pills, function(p){ return p.id !== 'zbHtwPill'; });

    // Wrap each select in a .sl-dd-wrap and inject the matching panel.
    function _wrapSelect(btn, kind){
      if(!btn) return;
      var wrap = document.createElement('span');
      wrap.className = 'sl-dd-wrap';
      btn.parentNode.insertBefore(wrap, btn);
      wrap.appendChild(btn);
      // Aliases the silsila code looks up by id
      btn.id = 'sl-' + (kind==='type'?'typeBtn':'tradBtn');
      // Label span (so syncSLDD can rewrite text)
      var lbl = document.createElement('span');
      lbl.id = 'sl-' + (kind==='type'?'typeLbl':'tradLbl');
      lbl.textContent = btn.textContent;
      btn.textContent = '';
      btn.appendChild(lbl);
      var caret = document.createElement('span');
      caret.className = 'dd-caret';
      caret.textContent = '▾';
      btn.appendChild(caret);
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var pnId = 'sl-' + (kind==='type'?'typePanel':'tradPanel');
        var pn = document.getElementById(pnId);
        if(pn){
          var r = btn.getBoundingClientRect();
          pn.style.position = 'fixed';
          pn.style.top      = (r.bottom + 4) + 'px';
          pn.style.left     = r.left + 'px';
        }
        toggleSLDD(kind);
      });
      // Panel — uses shell's dd-panel/.dd-item/.dd-checkbox classes (same as TIMELINE)
      var panel = document.createElement('div');
      panel.className = 'dd-panel';
      panel.id = 'sl-' + (kind==='type'?'typePanel':'tradPanel');
      var allItem = document.createElement('div');
      allItem.className = 'dd-item dd-all';
      allItem.addEventListener('click', function(){ slDDClearAll(kind); });
      var allCk = document.createElement('div');
      allCk.className = 'dd-checkbox';
      allCk.id = 'sl-' + (kind==='type'?'typeAllCk':'tradAllCk');
      allCk.textContent = '✓';
      allItem.appendChild(allCk);
      var allLbl = document.createElement('span');
      allLbl.textContent = kind==='type'?'All Types':'All Traditions';
      allItem.appendChild(allLbl);
      panel.appendChild(allItem);
      wrap.appendChild(panel);
    }
    if(selects[0]) _wrapSelect(selects[0], 'type');
    if(selects[1]) _wrapSelect(selects[1], 'trad');

    // Pills: [0] = ★ Saved, [1] = Reset
    if(pills[0]){
      pills[0].id = 'sl-favFilterBtn';
      pills[0].addEventListener('click', function(){ toggleFavFilter(); });
    }
    if(pills[1]){
      pills[1].addEventListener('click', function(){ clearAllFilters(); });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('sl-mounted');
    _injectScaffold(zoneCEl);

    // Sync our PEOPLE with whatever the global is (TIMELINE may have populated it)
    if(window.PEOPLE && window.PEOPLE.length){
      PEOPLE = window.PEOPLE;
      _afterPeopleReady(zoneBEl);
    } else {
      // Fetch core.json fresh
      fetch(dataUrl('data/islamic/core.json'))
        .then(function(r){ return r.ok ? r.json() : []; })
        .catch(function(){ return []; })
        .then(function(arr){
          PEOPLE = arr || [];
          window.PEOPLE = PEOPLE;
          _afterPeopleReady(zoneBEl);
        });
    }
  }

  function _afterPeopleReady(zoneBEl){
    _buildSLAllLanes();
    var typeSet = new Set();
    var tradSet = new Set();
    PEOPLE.forEach(function(p){
      if(p.type) typeSet.add(p.type);
      if(p.tradition) tradSet.add(p.tradition);
    });
    // Wire Zone B FIRST so panels exist before buildSLDD populates them.
    _wireZoneB(zoneBEl);
    buildSLDD('type', [...typeSet].sort());
    buildSLDD('trad', [...tradSet].sort());
    renderSilsila();
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('sl-mounted');

    // Stop animation
    _slAnimStop();

    // Remove document-level listeners we attached
    if(window._slOutsideClickBound && window._slOutsideClickHandler){
      document.removeEventListener('click', window._slOutsideClickHandler);
      window._slOutsideClickBound = false;
      window._slOutsideClickHandler = null;
    }
    if(window._slCardOutsideClickBound && window._slCardOutsideClickHandler){
      document.removeEventListener('click', window._slCardOutsideClickHandler);
      window._slCardOutsideClickBound = false;
      window._slCardOutsideClickHandler = null;
    }
    if(window._slDDOutsideBound && window._slDDOutsideHandler){
      document.removeEventListener('click', window._slDDOutsideHandler);
      window._slDDOutsideBound = false;
      window._slDDOutsideHandler = null;
    }

    // Remove tooltip
    var tt = document.getElementById('sl-tt');
    if(tt) tt.remove();

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  // ═══════════════════════════════════════════════════════════
  // ANIMATION HOOKS (called by shell.js when ANIMATE/SPEED/PAUSE clicked)
  // ═══════════════════════════════════════════════════════════
  function animateStart(){
    _slAnimPlay();
  }
  function animatePause(){
    _slAnimPause();
  }
  function animateSetSpeed(speed){
    var map = { '0.5x':2400, '1x':1200, '2x':600, '4x':300 };
    var ms = map[speed] || 1200;
    _slAnimSetSpeed(ms);
  }

  return {
    mount: mount,
    unmount: unmount,
    animateStart: animateStart,
    animatePause: animatePause,
    animateSetSpeed: animateSetSpeed,
    showHtw: _showSilsilaMethodology
  };
})();
