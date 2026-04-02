// ═══════════════════════════════════════════════════════════
// SILSILA — chain-of-transmission view
// ═══════════════════════════════════════════════════════════

const TRAD_COLORS={
  'Prophetic Lineage':'#e8c878',
  'Islamic History':  '#d4784a',
  'Early Ascetics':   '#88c878',
  'Hadith Sciences':  '#c8a050',
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
  'Persian Poetry':   '#d8a040',
  'Mawlawiyya':       '#f070a8',
  'Akbarian':         '#f0d060',
  'Kubrawiyya':       '#50d8b0',
  'Mughal':           '#c09840',
  'Yeseviyya':        '#70c880',
  'Qalandari':        '#d8a8c8',
  'Badawiyya':        '#d8d860',
  'Burhaniyya':       '#80c8a8',
  'Ishraqiyya':       '#f8c8a0',
  'Sindhi/Punjabi Sufism':'#e07060',
  // ── Islamic History sub-lane colours ──
  'Prophets':             '#e8a040',
  'Companions':           '#d4784a',
  'Companions (Women)':   '#d06878',
  'Followers':            '#c08850',
  'Caliphs & Rulers':     '#b85840',
};

// ── Islamic-History sub-lane machinery ──────────────────────────────────────
const IH_SUBLANE_ORDER=['Prophets','Companions','Companions (Women)','Followers','Caliphs & Rulers','Islamic History'];
const IH_TYPE_MAP={'Prophet':'Prophets','Sahaba':'Companions','Sahabiyya':'Companions (Women)',"Tabi'un":'Followers','Caliph':'Caliphs & Rulers','Ruler':'Caliphs & Rulers','Warrior':'Caliphs & Rulers'};
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
// Lineage (index 0) is always included. Tradition lanes are included only when
// they contain at least one person matching the active type/tradition filters.
function _getActiveSLLanes(){
  _buildSLAllLanes();
  if(selTypes.size===0&&selTrads.size===0) return [...SL_ALL_LANES];
  const activeLanes=new Set();
  PEOPLE.forEach(p=>{
    if(isLineageMember(p)) return;
    // Apply type filter
    if(selTypes.size>0){
      const passType=selTypes.has(p.type);
      const passTags=(p.tags||[]).some(t=>selTypes.has(t));
      const passIHSub=[...selTypes].some(st=>_IH_SUBLANE_REV[st]&&_IH_SUBLANE_REV[st].has(p.type));
      const passAshra=(selTypes.has('Ashra Mubashshara')||selTypes.has('Companions'))&&ASHRA_MUBASHSHARA.has(p.famous);
      if(!passType&&!passTags&&!passIHSub&&!passAshra) return;
    }
    // Apply tradition filter
    if(selTrads.size>0&&!selTrads.has(p.tradition)) return;
    // Determine effective lane name
    const ihSub=getIHSubLane(p);
    if(ihSub) activeLanes.add(ihSub);
    else if(p.tradition) activeLanes.add(p.tradition);
  });
  return SL_ALL_LANES.filter((lane,li)=>li===0||activeLanes.has(lane));
}

function renderSilsila(){
  if(!PEOPLE.length)return;

  const PL='Prophetic Lineage';
  // Determine which lanes the current filter requires
  const LANES=_getActiveSLLanes();
  const newKey=LANES.join('\x00');

  if(document.getElementById('silsilaSVG')){
    if(newKey===SL_LANES_KEY){updateSilsilaHighlight();return;}
    // Lanes changed (filter applied/cleared) — clear SVG and rebuild
    document.getElementById('silsilaMain').innerHTML='';
    document.getElementById('silsilaLanesInner').innerHTML='';
    SL_NM={}; SL_STUDENTS={}; SL_EDGES=[];
  }
  SL_LANES_KEY=newKey;

  // getLI: returns lane index within the current (filtered) LANES array.
  // Returns -1 for people whose tradition is not in the active lane set.
  const getLI=p=>{
    if(isLineageMember(p)) return 0;
    // Islamic History people route to their sub-lane
    const ihSub=getIHSubLane(p);
    if(ihSub){ const idx=LANES.indexOf(ihSub); return idx>=1?idx:-1; }
    const idx=LANES.indexOf(p.tradition||'');
    return idx>=1?idx:-1;
  };

  // ── Geometry ──────────────────────────────────────────────
  const PRE_W=320, MAIN_W=3200, TW=PRE_W+MAIN_W;
  const NR=6, PT=12, PB=10;
  const NODE_DIAM=NR*2+6; // minimum px gap to avoid overlap
  const ROW_H=13;          // px per sub-row (compact)
  const LANE_PAD=4;        // padding top+bottom inside each lane
  const MIN_LH=24;         // minimum lane height
  const LH_LIN=148;        // lineage lane fixed height
  const GRID_CELL_W=130;   // tight cell width for left-aligned packing
  const GRID_COLS=Math.floor(TW/GRID_CELL_W); // columns per row
  const GRID_CELL_H=16;    // row height in grid

  // X mapping: pre-Islamic compressed; 600-800 CE expanded 2x; 800+ linear
  // This gives the Sahaba era (600-700 CE) much more horizontal room
  const EARLY_W = 1100; // px for 600-800 CE (was ~456 before)
  const LATE_W  = MAIN_W - EARLY_W; // px for 800-2000 CE
  const x2px=dob=>{
    if(dob<600) return Math.max(4, Math.min(PRE_W-8, (dob+4200)/4800*(PRE_W-8)));
    if(dob<=800) return PRE_W + ((dob-600)/200)*EARLY_W;
    return PRE_W + EARLY_W + Math.min(1,(dob-800)/1200)*LATE_W;
  };

  // ── Build grps (lane index → people array) — skip hidden lanes (li = -1) ──
  const grps={};
  PEOPLE.forEach(p=>{const li=getLI(p);if(li>=0)(grps[li]=grps[li]||[]).push(p);});

  // When type/search filters are active, restrict non-lineage grps to only matching people
  // so that ONLY filtered dots appear in the SVG (year filter dims via opacity separately)
  const _hasTypeSearch=selTypes.size>0||selTrads.size>0||searchQ;
  if(_hasTypeSearch){
    const _fSet=new Set(getFiltered().map(p=>p.famous));
    Object.keys(grps).forEach(liS=>{
      const li=+liS; if(li===0) return;
      grps[li]=grps[li].filter(p=>_fSet.has(p.famous));
      if(!grps[li].length) delete grps[li];
    });
  }

  // ── All non-lineage lanes use left-aligned grid layout ─────
  const isGridLane={};
  Object.keys(grps).forEach(liS=>{
    const li=+liS; if(li===0) return;
    isGridLane[li]=true;
  });

  // Lane height based on grid rows needed
  function laneH(li){
    const n=(grps[li]||[]).length;
    const rows=Math.ceil(n/GRID_COLS);
    return Math.max(MIN_LH, rows*GRID_CELL_H + LANE_PAD*2);
  }

  // ── Cumulative Y offsets ───────────────────────────────────
  const TRAD_OFFSET=PT+LH_LIN;
  const laneStartY={};
  let curY=TRAD_OFFSET;
  LANES.forEach((lane,li)=>{
    if(li===0) return;
    laneStartY[li]=curY;
    curY+=laneH(li);
  });
  const SVG_H=curY+PB;

  // ── U-shape positions for lineage ─────────────────────────
  SL_NM={}; SL_STUDENTS={}; SL_EDGES=[];
  const linMembers=LINEAGE_CHAIN.map(n=>PEOPLE.find(p=>p.famous===n)).filter(Boolean);
  const MID=Math.ceil(linMembers.length/2);
  const topRow=linMembers.slice(0,MID);
  const botRow=linMembers.slice(MID);
  const LIN_Y_TOP = PT + Math.round(LH_LIN*0.28);
  const LIN_Y_BOT = PT + Math.round(LH_LIN*0.72);
  const LIN_X_L=60, LIN_X_R=Math.round(TW*0.50);
  topRow.forEach((p,i)=>{
    const x=LIN_X_L + i*(LIN_X_R-LIN_X_L)/Math.max(topRow.length-1,1);
    SL_NM[p.famous]={x, y:LIN_Y_TOP, li:0, col:'#e8c878'};
  });
  botRow.forEach((p,i)=>{
    const x=LIN_X_R - i*(LIN_X_R-LIN_X_L)/Math.max(botRow.length-1,1);
    SL_NM[p.famous]={x, y:LIN_Y_BOT, li:0, col:'#e8c878'};
  });

  // ── Assign tradition node positions (left-aligned grid) ───
  Object.keys(grps).forEach(liS=>{
    const li=+liS; if(li===0) return;
    const tradCol=TRAD_COLORS[LANES[li]];
    const sorted=grps[li].slice().sort((a,b)=>a.dob-b.dob);
    sorted.forEach((p,idx)=>{
      const col=tradCol||CC[gc(p.dob)]||'#c8a84a';
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

  // ── SVG parts ─────────────────────────────────────────────
  const P=[];

  // Defs
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
      <path d="M0,0 L0,7 L7,3.5 z" fill="#e8c878" opacity="0.8"/>
    </marker>
  </defs>`);

  // ── Lane background bands ──────────────────────────────────
  // Lineage lane (dark, taller)
  P.push(`<rect x="0" y="${PT}" width="${TW}" height="${LH_LIN}" fill="rgba(18,10,2,0.82)" />`);
  P.push(`<rect x="0" y="${PT}" width="5" height="${LH_LIN}" fill="#e8c878" opacity="0.7" />`);
  P.push(`<line x1="0" y1="${PT+LH_LIN}" x2="${TW}" y2="${PT+LH_LIN}" stroke="rgba(232,200,120,0.35)" stroke-width="1.5"/>`);

  // Tradition lanes (auto-height)
  LANES.forEach((lane,li)=>{
    if(li===0) return;
    const y=laneStartY[li], h=laneH(li);
    const col=TRAD_COLORS[lane]||(grps[li]&&grps[li][0]?CC[gc(grps[li][0].dob)]:'#c8a84a')||'#c8a84a';
    P.push(`<rect x="0" y="${y}" width="${TW}" height="${h}" fill="${li%2===1?'rgba(0,0,0,0.11)':'rgba(0,0,0,0.04)'}" />`);
    P.push(`<rect x="0" y="${y}" width="2" height="${h}" fill="${col}" opacity="0.45" />`);
    P.push(`<line x1="0" y1="${y+h}" x2="${TW}" y2="${y+h}" stroke="rgba(74,90,68,0.28)" stroke-width="1" />`);
  });

  // ── Century grid lines + labels ────────────────────────────
  P.push(`<line x1="${PRE_W}" y1="0" x2="${PRE_W}" y2="${SVG_H}" stroke="rgba(232,200,120,0.16)" stroke-width="1.5" />`);
  P.push(`<text x="${(PRE_W/2).toFixed(1)}" y="22" font-family="Cinzel,serif" font-size="9" text-anchor="middle" fill="rgba(240,237,226,0.2)" letter-spacing="1.5">PRE-ISLAMIC</text>`);
  for(let yr=600;yr<=2000;yr+=100){
    const x=x2px(yr).toFixed(1), c=gc(yr);
    P.push(`<line x1="${x}" y1="0" x2="${x}" y2="${SVG_H}" stroke="rgba(255,255,255,0.05)" stroke-width="1" />`);
    // Century labels removed — chronology is approximate
  }

  // ── Build edge DATA (no SVG rendered yet — injected on click) ────────────
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

  // Nodes that have at least one valid connection in the dataset
  const SL_CONNECTED=new Set();
  SL_EDGES.forEach(e=>{SL_CONNECTED.add(e.from);SL_CONNECTED.add(e.to);});
  // Lineage members are always shown
  linMembers.forEach(p=>SL_CONNECTED.add(p.famous));

  // ── Empty group for on-demand chain edges ─────────────────────────────────
  P.push(`<g id="sl-active-edges"></g>`);

  // ── Tradition nodes — ALL dots visible at full opacity by default ────────
  PEOPLE.forEach(p=>{
    if(isLineageMember(p)) return;
    const nd=SL_NM[p.famous]; if(!nd) return;
    const hasFree=p.books&&p.books.some(b=>b.url&&b.url.startsWith('http'));
    const r=hasFree?NR:NR-1;
    P.push(`<circle class="sl-node" data-name="${esc(p.famous)}" cx="${nd.x.toFixed(1)}" cy="${nd.y.toFixed(1)}" r="${r}" fill="${nd.col}" fill-opacity="0.85" stroke="${nd.col}" stroke-width="1.4" stroke-opacity="0.9"/>`);
    // Always-visible short name label
    const _sn=p.famous.length>14?p.famous.slice(0,13)+'…':p.famous;
    P.push(`<text x="${(nd.x+r+3).toFixed(1)}" y="${(nd.y+3.5).toFixed(1)}" font-size="11" font-family="Cinzel,serif" font-weight="500" fill="${nd.col}" fill-opacity="0.85" pointer-events="none">${esc(_sn)}</text>`);
  });

  // ── Cover rect: blank lineage lane left of Adam (hides any edge bleed) ──────
  P.push(`<rect x="0" y="${PT}" width="${LIN_X_L - 11}" height="${LH_LIN}" fill="rgba(18,10,2,0.82)"/>`);
  P.push(`<rect x="0" y="${PT}" width="5" height="${LH_LIN}" fill="#e8c878" opacity="0.7"/>`);

  // ── U-SHAPE: Single continuous unbroken path, always on top ──────────────────
  {
    const tPts=topRow.map(p=>SL_NM[p.famous]).filter(Boolean);
    const bPts=botRow.map(p=>SL_NM[p.famous]).filter(Boolean);
    if(tPts.length>0 && bPts.length>0){
      const curveR=(LIN_Y_BOT-LIN_Y_TOP)/2;
      const cxBulge=LIN_X_R+curveR+14;
      const LIN_Y_MID=(LIN_Y_TOP+LIN_Y_BOT)/2;
      // Single path: Adam → top row → U-curve → bottom row → Muhammad
      let d=`M${tPts[0].x.toFixed(1)},${LIN_Y_TOP}`;
      for(let i=1;i<tPts.length;i++) d+=` L${tPts[i].x.toFixed(1)},${LIN_Y_TOP}`;
      // Smooth U-curve at the right using two quadratic beziers
      d+=` Q${cxBulge},${LIN_Y_TOP} ${cxBulge},${LIN_Y_MID.toFixed(1)}`;
      d+=` Q${cxBulge},${LIN_Y_BOT} ${bPts[0].x.toFixed(1)},${LIN_Y_BOT}`;
      // Bottom row going left back to Muhammad
      for(let i=1;i<bPts.length;i++) d+=` L${bPts[i].x.toFixed(1)},${LIN_Y_BOT}`;
      P.push(`<path d="${d}" stroke="#e8c878" stroke-width="2.5" fill="none" opacity="0.88" marker-end="url(#arr-gold)"/>`);
    }
  }

  // ── Lineage nodes (rendered last — always on top of U-shape and edges) ───────
  const qProphets=new Set(['Adam','Idris','Nuh','Hud','Salih','Ibrahim','Lut','Ismail','Ishaq','Yaqub','Yusuf',"Shu'ayb",'Ayyub','Musa','Harun','Dawud','Sulayman','Ilyas','Yunus','Zakariyya','Yahya','Isa','Prophet Muhammad']);
  const labelSet=new Set(['Adam','Idris','Nuh','Ibrahim','Ismail','Prophet Muhammad']);

  linMembers.forEach(p=>{
    const nd=SL_NM[p.famous]; if(!nd) return;
    const isPM=p.famous==='Prophet Muhammad';
    const isQ=qProphets.has(p.famous);
    const r=isPM?13:isQ?9:6;
    const isTop=nd.y===LIN_Y_TOP;
    const shortName=isPM?'Prophet Muhammad ☆':p.famous.split(' ')[0];
    const labelY=isTop?nd.y-r-6:nd.y+r+13;
    if(isPM){
      P.push(`<circle cx="${nd.x.toFixed(1)}" cy="${nd.y}" r="20" fill="none" stroke="#e8c878" stroke-width="1.1"><animate attributeName="r" values="18;30;18" dur="3.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0.5" dur="3.8s" repeatCount="indefinite"/></circle>`);
    }
    const flt=isPM?'filter="url(#slg)"':isQ?'filter="url(#slg2)"':'';
    P.push(`<circle class="sl-node sl-lin-node" data-name="${esc(p.famous)}" cx="${nd.x.toFixed(1)}" cy="${nd.y}" r="${r}" fill="#e8c878" fill-opacity="${isPM?.95:isQ?.85:.65}" stroke="#e8c878" stroke-width="${isPM?2.5:isQ?1.8:1.1}" stroke-opacity=".8" ${flt}/>`);
    if(labelSet.has(p.famous)){
      P.push(`<text x="${nd.x.toFixed(1)}" y="${labelY}" text-anchor="middle" font-size="${isPM?11:9}" font-family="Cinzel,serif" fill="#e8c878" font-weight="700" opacity="0.9" pointer-events="none">${shortName}</text>`);
    }
  });
  // ── Inject SVG ────────────────────────────────────────────
  const mainDiv=document.getElementById('silsilaMain');
  mainDiv.innerHTML=`<svg id="silsilaSVG" xmlns="http://www.w3.org/2000/svg" width="${TW}" height="${SVG_H}" style="display:block;min-width:${TW}px">${P.join('\n')}</svg>`;

  // ── Lane labels sidebar ────────────────────────────────────
  const inner=document.getElementById('silsilaLanesInner');
  let lh=`<div style="height:${PT}px;display:flex;align-items:flex-end;padding:0 12px 5px;font-family:'Cinzel',serif;font-size:7px;letter-spacing:.12em;color:rgba(240,237,226,0.16)">TRADITION / CHAIN</div>`;
  // Lineage row
  lh+=`<div class="sl-lane-label" data-lane="${esc(PL)}" style="height:${LH_LIN}px;background:rgba(18,10,2,0.82)">
    <span class="sl-lane-dot" style="background:#e8c878;box-shadow:0 0 6px rgba(232,200,120,.6)"></span>
    <span class="sl-lane-name" style="color:#e8c878">⭕ Prophets' Lineage</span>
    <span class="sl-lane-count">${linMembers.length}</span>
  </div>`;
  LANES.forEach((lane,li)=>{
    if(li===0) return;
    const col=TRAD_COLORS[lane]||(grps[li]&&grps[li][0]?CC[gc(grps[li][0].dob)]:'#c8a84a')||'#c8a84a';
    const count=(grps[li]||[]).length;
    lh+=`<div class="sl-lane-label" data-lane="${esc(lane)}" style="height:${laneH(li)}px">
      <span class="sl-lane-dot" style="background:${col};box-shadow:0 0 5px ${col}55"></span>
      <span class="sl-lane-name" style="color:${col}">${esc(lane)}</span>
      <span class="sl-lane-count">${count}</span>
    </div>`;
  });
  inner.innerHTML=lh;

  // ── Scroll sync (vertical) — attach only once ────────────
  if(!mainDiv._slScrollBound){
    mainDiv._slScrollBound=true;
    mainDiv.addEventListener('scroll',()=>{
      const _inn=document.getElementById('silsilaLanesInner');
      if(_inn) _inn.style.transform=`translateY(-${mainDiv.scrollTop}px)`;
    },{passive:true});
  }

  // ── Lane label click → filter by tradition — attach only once ──
  const lanesWrap=document.getElementById('silsilaLanes');
  if(!lanesWrap._slBound){
    lanesWrap._slBound=true;
    lanesWrap.addEventListener('click',e=>{
      const lbl=e.target.closest('.sl-lane-label'); if(!lbl) return;
      const t=lbl.dataset.lane; if(t==='Prophetic Lineage') return;
      // IH sub-lanes filter by 'Islamic History' tradition
      const isIHSub=IH_SUBLANE_ORDER.includes(t);
      const tradKey=isIHSub?'Islamic History':t;
      if(selTrads.size===1&&selTrads.has(tradKey)) selTrads.clear();
      else { selTrads.clear(); selTrads.add(tradKey); }
      syncDD('trad'); syncSLDD('trad'); applyFilterAndFocus();
    });
  }

  // ── Hover tooltip ─────────────────────────────────────────
  let tt=document.getElementById('sl-tt');
  if(!tt){
    tt=document.createElement('div'); tt.id='sl-tt';
    tt.style.cssText='position:fixed;pointer-events:none;display:none;z-index:9999;'+
      'background:var(--surface2);border:1.5px solid var(--border);border-radius:4px;'+
      'padding:7px 12px;font-size:11px;color:var(--text);'+
      'box-shadow:0 4px 22px rgba(0,0,0,.7);max-width:240px;line-height:1.5;'+
      'transition:opacity .1s';
    document.body.appendChild(tt);
  }
  let ttPinned=false; // true when tooltip is pinned by click

  function pinTooltip(p, x, y){
    const col=SL_NM[p.famous]?.col||'#888';
    const dob_s=p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`;
    const nT=(p.teachers||[]).length, nS=(SL_STUDENTS[p.famous]||[]).length;
    tt.innerHTML=
      `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;font-size:13px;margin-bottom:2px;cursor:pointer;border-bottom:1px solid rgba(232,200,120,.3);padding-bottom:5px;margin-bottom:6px" id="tt-name-link" data-name="${esc(p.famous)}">${esc(p.famous)}<span style="font-size:8px;opacity:.5;margin-left:5px">→ TIMELINE</span></div>`+
      `<div style="font-family:'Crimson Pro',serif;font-size:12px;color:${col};font-style:italic;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
      `<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.06em;color:${col};opacity:0.7">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
      (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.05em;color:rgba(232,200,120,.55);margin-top:3px">`+
        (nT?`↑ ${nT} teacher${nT>1?'s':''}  `:'')+( nS?`↓ ${nS} student${nS>1?'s':''}`:'')+`</div>`:'');
    tt.style.pointerEvents='all';
    tt.style.cursor='default';
    tt.style.display='block';
    ttPinned=true;
    // Name link → jump to timeline
    const nameLink=tt.querySelector('#tt-name-link');
    if(nameLink) nameLink.onclick=e=>{
      e.stopPropagation();
      const name=nameLink.dataset.name;
      unpinTooltip();
      closeSilsilaCard();
      focusPersonInTimeline(name);
    };
    // Clicking elsewhere in tooltip does nothing (so user can read it)
    tt.onclick=e=>e.stopPropagation();
    // Position
    const tw=240, th=90;
    let lx=x+16, ly=y-10;
    if(lx+tw>window.innerWidth-8) lx=x-tw-16;
    if(ly+th>window.innerHeight-8) ly=window.innerHeight-th-8;
    if(ly<8) ly=8;
    tt.style.left=lx+'px'; tt.style.top=ly+'px';
  }

  function showHoverTooltip(p, x, y){
    if(ttPinned) return; // don't overwrite pinned tooltip
    const col=SL_NM[p.famous]?.col||'#888';
    const dob_s=p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`;
    const nT=(p.teachers||[]).length, nS=(SL_STUDENTS[p.famous]||[]).length;
    tt.innerHTML=
      `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;margin-bottom:3px;font-size:12.5px">${esc(p.famous)}</div>`+
      `<div style="font-family:'Crimson Pro',serif;font-size:12px;color:${col};font-style:italic;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
      `<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.06em;color:${col};opacity:0.7">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
      (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.05em;color:rgba(232,200,120,.55);margin-top:3px">`+
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
  let _silsilaHighlighted=null; // tracks first-click highlighted node

  // ── Full chain traversal (ancestors + descendants) ────────────────────────
  function getDirectChain(name){
    // Only the clicked person + their immediate teachers + their immediate students
    // No recursive traversal — avoids drawing the entire connected graph
    const p=PEOPLE.find(pp=>pp.famous===name);
    const teachers=new Set(p?.teachers||[]);
    const students=new Set(SL_STUDENTS[name]||[]);
    return {self:name, teachers, students, all:new Set([name,...teachers,...students])};
  }

  function renderChainEdges(name){
    const {teachers, students, all}=getDirectChain(name);
    const grp=svg.querySelector('#sl-active-edges'); if(!grp) return;
    // Only edges where this person is one endpoint
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

  // ── Helper: clear all highlights ────────────
  function _silsilaClearHighlight(){
    _silsilaHighlighted=null;
    clearChainEdges();
    svg.querySelectorAll('.sl-node').forEach(n=>n.classList.remove('sl-dim','sl-selected'));
    if(tt){tt.style.display='none';tt.style.pointerEvents='none';}
    ttPinned=false;
  }

  // ── Node click → two-stage interaction ────────────
  svg.addEventListener('click',e=>{
    const nd=e.target.closest('.sl-node'); if(!nd) return;
    const name=nd.dataset.name;
    const p=PEOPLE.find(pp=>pp.famous===name); if(!p) return;
    activePerson=p;

    if(_silsilaHighlighted===name){
      // SECOND CLICK — show popup with TIMELINE button
      const col=SL_NM[p.famous]?.col||'#888';
      const dob_s=p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`;
      const nT=(p.teachers||[]).length, nS=(SL_STUDENTS[p.famous]||[]).length;
      tt.innerHTML=
        `<div style="color:${col};font-family:'Cinzel',serif;font-weight:700;font-size:13px;margin-bottom:2px">${esc(p.famous)}</div>`+
        `<div style="font-family:'Crimson Pro',serif;font-size:12px;color:var(--text2);font-style:italic;margin-bottom:4px">${esc(p.primaryTitle||p.tradition||'')}</div>`+
        `<div style="font-family:'Cinzel',serif;font-size:8px;letter-spacing:.06em;color:var(--muted)">${dob_s}${p.tradition?` · ${esc(p.tradition)}`:''}</div>`+
        (nT||nS?`<div style="font-family:'Cinzel',serif;font-size:7.5px;letter-spacing:.05em;color:rgba(232,200,120,.55);margin-top:3px">`+
          (nT?`↑ ${nT} teacher${nT>1?'s':''}  `:'')+( nS?`↓ ${nS} student${nS>1?'s':''}`:'')+`</div>`:'')+
        `<button id="sl-tt-timeline-btn" style="background:var(--accent);color:var(--bg);font-family:'Cinzel',serif;font-size:9px;letter-spacing:0.1em;padding:4px 12px;border:none;border-radius:2px;cursor:pointer;margin-top:6px;display:block">TIMELINE</button>`;
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

    // FIRST CLICK — highlight connections, dim others
    _silsilaHighlighted=name;
    svg.querySelectorAll('.sl-node.sl-selected').forEach(n=>n.classList.remove('sl-selected'));
    nd.classList.add('sl-selected');
    renderChainEdges(p.famous);
    const teachers=new Set(p.teachers||[]);
    const students=new Set(SL_STUDENTS[name]||[]);
    const connected=new Set([name,...teachers,...students]);
    svg.querySelectorAll('.sl-node').forEach(n=>{
      n.classList.toggle('sl-dim',!connected.has(n.dataset.name));
    });
    // Sync lane highlight
    const inner2=document.getElementById('silsilaLanesInner');
    if(inner2){
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>l.classList.remove('sl-lane-sel'));
      const tl=isLineageMember(p)?PL:(getIHSubLane(p)||p.tradition||'');
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>{if(l.dataset.lane===tl)l.classList.add('sl-lane-sel');});
    }
    // Hide any tooltip
    if(tt){tt.style.display='none';tt.style.pointerEvents='none';}
    ttPinned=false;
  });

  if(activePerson){
    svg.querySelectorAll('.sl-node').forEach(nd=>{
      if(nd.dataset.name===activePerson.famous) nd.classList.add('sl-selected');
    });
  }

  // Clear selection when clicking empty space — attach only once
  if(!window._slOutsideClickBound){
    window._slOutsideClickBound=true;
    document.addEventListener('click',e=>{
      const _svg=document.getElementById('silsilaSVG'); if(!_svg) return;
      if(e.target.closest('.sl-node')||e.target.closest('#silsilaCard')||e.target.closest('#sl-tt')) return;
      _silsilaClearHighlight();
    });
  }

  updateSilsilaHighlight();
}


function updateSilsilaHighlight(){
  const svg=document.getElementById('silsilaSVG'); if(!svg) return;

  // If the filter has changed which lanes should be visible, rebuild the SVG
  // so that only Lineage + selected lane(s) are shown and layout is compact.
  const newKey=_getActiveSLLanes().join('\x00');
  if(newKey!==SL_LANES_KEY){
    renderSilsila(); // rebuilds with correct filtered lanes
    return;
  }

  // Only the year filter dims dots — everything else is full opacity
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
  // Edges are rendered on-demand on click; clear any active chain when filters change
  const grp=svg.querySelector('#sl-active-edges');
  if(grp && grp.children.length){
    grp.innerHTML='';
    svg.querySelectorAll('.sl-node').forEach(n=>{n.style.opacity='';});
  }

  // Sync silsila filter dropdowns UI
  syncSLDD('type'); syncSLDD('trad');
}

// Scroll the SVG to centre on a named figure, then briefly pulse it
function silsilaLocate(name){
  const svg=document.getElementById('silsilaSVG');
  const mainDiv=document.getElementById('silsilaMain');
  if(!svg||!mainDiv) return;
  const nd=SL_NM[name]; if(!nd) return;

  // Centre the view on the node
  const vw=mainDiv.clientWidth, vh=mainDiv.clientHeight;
  const targetX=Math.max(0, nd.x - vw/2);
  const targetY=Math.max(0, nd.y - vh/2);
  mainDiv.scrollTo({left:targetX, top:targetY, behavior:'smooth'});

  // Sync sidebar scroll
  const inner=document.getElementById('silsilaLanesInner');
  if(inner) setTimeout(()=>{ inner.style.transform=`translateY(-${mainDiv.scrollTop}px)`; },320);

  // Pulse animation: temporarily enlarge the node's SVG circle
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
  const col=isLineageMember(p)?'#e8c878':(TRAD_COLORS[p.tradition]||'#888');
  document.getElementById('scCardName').textContent=p.famous;
  document.getElementById('scCardName').style.color=col;
  document.getElementById('scCardSub').textContent=p.primaryTitle||p.tradition||'';

  const dob_s=p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`;
  const dod_s=p.dod?(p.dod<0?`${Math.abs(p.dod)} BCE`:`${p.dod} CE`):'Unknown';
  const studentsOf=PEOPLE.filter(s=>s.teachers?.includes(p.famous));

  let html=`
    ${canShowImage(p) ? `
    <div id="scWikiImgWrap" style="float:right;margin:0 0 10px 12px;max-width:90px;text-align:center">
      <img id="scWikiImg" style="display:none;width:100%;max-width:90px;border-radius:4px;border:1px solid var(--ip-brd);object-fit:cover"
        alt="${esc(p.famous)}"
        onerror="this.style.display='none';document.getElementById('scWikiImgCaption').style.display='none';" />
      <div id="scWikiImgCaption" style="display:none;font-size:8px;color:var(--ip-muted);font-family:'Cinzel',serif;letter-spacing:.06em;margin-top:3px">via Wikipedia</div>
    </div>` : ''}
    <div class="sc-tags">
      <span class="sc-tag hi" style="color:${col};border-color:${col}55">${esc(p.type||'')}</span>
      <span class="sc-tag hi" style="color:${col};border-color:${col}55">${esc(p.tradition||'')}</span>
      ${p.city?`<span class="sc-tag">📍 ${esc(p.city)}</span>`:''}
    </div>
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
        ${b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#c89040;text-decoration:none">${esc(b.title)}</a>`:`<span style="color:var(--ip-text);font-size:13px">${esc(b.title)}</span>`}
        ${b.magnum?` <span style="color:var(--accent);font-size:10px">✦</span>`:''}
        ${b.note?`<div style="font-size:11px;color:var(--ip-muted);font-style:italic;margin-top:1px">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#c89040;text-decoration:none">quran.com</a>')}</div>`:''}
      </div>`;
    });
  }
  if(p.source){
    html+=`<div style="font-size:11px;color:var(--ip-muted);font-style:italic;margin-top:12px;padding-top:8px;border-top:1px solid var(--ip-brd)">Sources: ${esc(p.source)}</div>`;
  }

  document.getElementById('scCardBody').innerHTML=html;
  document.getElementById('scCardScroll').scrollTop=0;

  // Fetch Wikipedia image for silsila card
  if (canShowImage(p)) {
    var scImgEl = document.getElementById('scWikiImg');
    var scCapEl = document.getElementById('scWikiImgCaption');
    if (scImgEl) fetchWikiImage(p.source, scImgEl, scCapEl);
  }

  // Position near click but keep in viewport
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

// Close card on outside click
document.addEventListener('click',e=>{
  const card=document.getElementById('silsilaCard');
  if(!card||!card.classList.contains('visible')) return;
  if(!card.contains(e.target)&&!e.target.closest('.sl-node')) closeSilsilaCard();
});

// ═══════════════════════════════════════════════════════════
// SILSILA FILTER DROPDOWNS (in top bar)
// ═══════════════════════════════════════════════════════════
function buildSLDD(kind, values){
  ['sl','map'].forEach(prefix=>{
    const panel=document.getElementById(prefix+'-'+(kind==='type'?'typePanel':'tradPanel'));
    if(!panel) return;
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
  // Close all SL dropdowns and main dropdowns
  document.querySelectorAll('.sl-dd-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.sl-dd-btn.open').forEach(b=>b.classList.remove('open'));
  document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.dd-btn.open').forEach(b=>b.classList.remove('open'));
  if(!wasOpen){panel.classList.add('open');btn.classList.add('open');}
}

function slDDClearAll(kind){
  const sel=kind==='type'?selTypes:selTrads;
  sel.clear();
  syncDD(kind); syncSLDD(kind); applyFilterAndFocus();
}

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
  });

  // Update summary
  const parts=[];
  if(selTypes.size>0) parts.push([...selTypes].join(', '));
  if(selTrads.size>0) parts.push([...selTrads].join(', '));
  const sumEl=document.getElementById('sl-filterSummary');
  const clrEl=document.getElementById('sl-clearAll');
  if(sumEl){sumEl.textContent=parts.length?'↳ '+parts.join(' · '):'';sumEl.classList.toggle('visible',parts.length>0);}
  if(clrEl) clrEl.classList.toggle('visible',selTypes.size>0||selTrads.size>0);
}

// Close silsila dropdowns when clicking outside
document.addEventListener('click',e=>{
  if(!e.target.closest('.sl-dd-wrap')){
    document.querySelectorAll('.sl-dd-panel.open').forEach(p=>p.classList.remove('open'));
    document.querySelectorAll('.sl-dd-btn.open').forEach(b=>b.classList.remove('open'));
  }
});
