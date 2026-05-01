/* ─────────────────────────────────────────────────────────────
   ERAS view — verbatim lift from bv-app/eras.js
   IIFE exposes window.ErasView = { mount, unmount }
   ───────────────────────────────────────────────────────────── */
window.ErasView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global — ERAS uses 'eras'
  var VIEW = 'eras';
  window.VIEW = 'eras';
  // stub: APP namespace
  var APP = window.APP || {
    Favorites: null, filterFavsOnly: false, _lang: 'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; }
  };
  window.APP = APP;
  // stub: setView — sandbox shell uses setActiveTab; eras' wrapper IIFE around setView
  // early-exits when window.setView is not a function (already in lifted code).
  // stub: jumpTo — bv-row click → "go to figure in TIMELINE"; in sandbox we log only.
  if(typeof window.jumpTo !== 'function') window.jumpTo = function(name){
    console.log('[eras] jumpTo (stub):', name);
  };
  // stub: PROPHET_CHAIN (silsila/timeline-injected global). _evNameColor null-checks.
  if(typeof window.PROPHET_CHAIN === 'undefined') window.PROPHET_CHAIN = new Set();
  // stub: _wikidata for the "W" Wikipedia link. _evWiki already null-checks.
  if(typeof window._wikidata === 'undefined') window._wikidata = {};
  // stub: AnimControls — leave undefined; lifted code already null-checks (line 600).
  // stub: _resizeShell
  if(typeof window._resizeShell !== 'function') window._resizeShell = function(){};

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/eras.js ▼▼▼
  // (outer IIFE wrapper unwrapped — we already wrap above)
  // ═══════════════════════════════════════════════════════════

const _EV_ROW_H   = 32;
const _EV_TOP_PAD = 40;
const _EV_BOT_PAD = 80;
const _EV_LEFT_W  = 340;
const _EV_STEM_X  = 400;

let _EV_FILTER = { types:new Set(), trads:new Set(), search:'' };
let _EV_ANIM   = { mode:'stopped', timer:null, cursorY:0, maxY:0, speedMs:1200, tick:null };
let _EV_INITED = false;
let _EV_ANIM_CTL = null;

const _EV_TYPE_COLORS = {
  'Prophet':'#D4AF37','Founder':'#b8860b','Sahaba':'#e74c3c','Sahabiyya':'#ff6b6b',
  "Tabi'un":'#e67e22','Scholar':'#3498db','Mystic':'#2ECC71','Ruler':'#9b59b6',
  'Poet':'#e91e90','Philosopher':'#1abc9c','Scientist':'#00bcd4','Historian':'#8d6e63',
  'Reformer':'#ff9800','Jurist':'#5c6bc0','Caliph':'#ab47bc','Warrior':'#ef5350',
  'Prophetic Lineage':'rgba(212,175,55,0.55)'
};
const _EV_TRAD_COLORS = {
  'Hadith Sciences':'#4fc3f7','Early Ascetics':'#66bb6a',
  'Islamic Jurisprudence':'#7986cb','Islamic Philosophy':'#4db6ac','Islamic Sciences':'#4dd0e1',
  'Islamic Theology':'#9575cd','Islamic Literature':'#f06292','Persian Poetry':'#ce93d8',
  'Khorasan School':'#a1887f','Baghdad School':'#90a4ae','Naqshbandiyya':'#7e57c2',
  'Shadhiliyya':'#26a69a','Qadiriyya':'#42a5f5','Chishti':'#ffa726','Suhrawardiyya':'#d4e157',
  'Mawlawiyya':'#ec407a','Qalandari':'#8d6e63','Yeseviyya':'#78909c','Kubrawiyya':'#5c6bc0',
  'Akbarian':'#ab47bc','Ishraqiyya':'#ffca28','Mughal':'#ef6c00','Genealogy':'#D4AF37'
};
const _EV_SKIP_TRADS = {'Islamic History':true};
const _EV_ERA_BANDS = [
  {name:'Prophetic Era',     start:-10000,end:632,  dates:'Before 632 CE',    glow:'210,170,50'},
  {name:'Rashidun',          start:632,   end:661,  dates:'632–661 CE',  glow:'60,160,90'},
  {name:'Umayyad',           start:661,   end:750,  dates:'661–750 CE',  glow:'50,180,180'},
  {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750–1258 CE', glow:'70,130,210'},
  {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258–1500 CE',glow:'180,60,60'},
  {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500–1800 CE',glow:'50,140,90'},
  {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800–1950 CE',glow:'200,150,60'},
  {name:'Contemporary',      start:1950,  end:2025, dates:'1950–Present',glow:'80,160,200'}
];

function _evEsc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
var _evShowCE=true,_evShowHijri=true;
function _evCeToHijri(ce){return Math.round((ce-622)*33/32);}
function _evFmtYear(y){
  if(y==null||y==='') return '—';
  const n = typeof y==='number' ? y : parseInt(y,10);
  if(isNaN(n)) return '—';
  if(n<0) return Math.abs(n)+'<span class="year-era">BCE</span>';
  return n+'<span class="year-era">CE</span>';
}
function _evDob(p){ return (p && p.dob_academic!=null) ? p.dob_academic : (p ? p.dob : null); }
function _evWiki(p){
  if(!window._wikidata||!p.slug||!window._wikidata[p.slug]||!window._wikidata[p.slug].wikipedia||!window._wikidata[p.slug].wikipedia.en) return '';
  return ' <a class="era-wiki" href="https://en.wikipedia.org/wiki/'+encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))+'" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Wikipedia">W</a>';
}
function _evNameColor(p){
  if(p.type==='Prophet') return '#D4AF37';
  if(typeof PROPHET_CHAIN!=='undefined' && PROPHET_CHAIN.has(p.famous)) return 'rgba(212,175,55,0.65)';
  if(p.type && _EV_TYPE_COLORS[p.type]) return _EV_TYPE_COLORS[p.type];
  if(p.tradition && !_EV_SKIP_TRADS[p.tradition] && _EV_TRAD_COLORS[p.tradition]) return _EV_TRAD_COLORS[p.tradition];
  return '#A0AEC0';
}
function _evColorToRgb(c){
  if(!c) return '160,174,192';
  if(c.charAt(0)==='#'){
    var hex=c.slice(1); if(hex.length===3) hex=hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return parseInt(hex.substr(0,2),16)+','+parseInt(hex.substr(2,2),16)+','+parseInt(hex.substr(4,2),16);
  }
  var m=c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if(m) return m[1]+','+m[2]+','+m[3];
  return '160,174,192';
}

function _evYearToY(yr, people, rowMap){
  const withY = people.filter(p=>_evDob(p)!=null);
  if(!withY.length) return _EV_TOP_PAD;
  const first=withY[0], last=withY[withY.length-1];
  const fd=_evDob(first), ld=_evDob(last);
  if(yr<=fd) return rowMap[first.slug].midY;
  if(yr>=ld) return rowMap[last.slug].midY;
  for(let i=1;i<withY.length;i++){
    const d=_evDob(withY[i]);
    if(d>=yr){
      const prev=withY[i-1], pd=_evDob(prev);
      if(d===pd) return rowMap[withY[i].slug].midY;
      const r=(yr-pd)/(d-pd);
      return rowMap[prev.slug].midY + r*(rowMap[withY[i].slug].midY - rowMap[prev.slug].midY);
    }
  }
  return rowMap[last.slug].midY;
}

function _evInjectStyles(){
  const old=document.getElementById('erasViewStyles');
  if(old) old.remove();
  const css = `
  #eras-view{flex:1;display:flex;flex-direction:column;overflow:hidden;background:var(--bg0,#0E1621);width:100%;height:100%}
  #era-toolbar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border2,#2D3748);background:var(--bg0,#0E1621);flex-wrap:wrap}
  .era-dd-wrap{position:relative}
  .era-dd-btn{background:none;border:1px solid var(--border2,#2D3748);color:var(--gold,#D4AF37);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em;padding:8px 14px;cursor:pointer;min-width:220px;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:10px;border-radius:2px}
  .era-dd-btn:hover{border-color:var(--gold,#D4AF37)}
  .era-dd-panel{position:absolute;top:calc(100% + 4px);left:0;width:300px;max-height:420px;background:#0E1621;border:1px solid var(--gold,#D4AF37);border-radius:2px;z-index:100;display:none;flex-direction:column;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.6)}
  .era-dd-panel.open{display:flex}
  .era-dd-search{margin:10px 10px 6px;padding:7px 9px;background:#1a2330;border:1px solid var(--border2,#2D3748);color:#fff;font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);border-radius:2px;outline:none}
  .era-dd-search:focus{border-color:var(--gold,#D4AF37)}
  .era-dd-scroll{flex:1;overflow-y:auto;padding:4px 0 10px}
  .era-ck-row{display:flex;align-items:center;gap:10px;padding:6px 14px;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);color:var(--text1,#E4E4E7)}
  .era-ck-row:hover{background:rgba(212,175,55,.08)}
  .era-ck-row.checked{background:rgba(212,175,55,.06);color:var(--gold,#D4AF37)}
  .era-ck{width:12px;height:12px;border:1px solid var(--border2,#2D3748);border-radius:2px;flex-shrink:0}
  .era-ck.on{background:var(--gold,#D4AF37);border-color:var(--gold,#D4AF37);box-shadow:inset 0 0 0 2px #0E1621}
  .era-ck-label{flex:1}
  .era-ck-count{font-size:var(--fs-3);color:var(--muted,#6B7B8C);font-family:'Cinzel',serif}
  .era-clear-all{background:none;border:1px solid var(--border2,#2D3748);color:var(--muted,#6B7B8C);width:32px;height:32px;cursor:pointer;border-radius:2px;font-size:var(--fs-3);opacity:.4}
  .era-clear-all.active{opacity:1;border-color:rgba(212,175,55,.6);color:var(--gold,#D4AF37)}
  #era-anim-mount{margin-left:auto;display:flex;align-items:center;gap:10px}
  #era-scroll{flex:1;overflow-y:auto;overflow-x:hidden;position:relative}
  #era-canvas{position:relative;width:100%}
  #era-empty{padding:60px;text-align:center;color:var(--muted,#6B7B8C);font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.1em}
  #era-stem{position:absolute;left:${_EV_STEM_X - 2}px;width:5px;background:var(--gold,#D4AF37);box-shadow:0 0 18px rgba(212,175,55,.55);pointer-events:none;z-index:1}
  .era-row{position:absolute;left:0;width:${_EV_LEFT_W}px;padding:4px 20px;cursor:pointer;transition:background .12s;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;z-index:4}
  .era-row:hover{background:rgba(212,175,55,.06)}
  .era-row.hi{background:rgba(212,175,55,.16);box-shadow:inset 3px 0 0 var(--gold,#D4AF37)}
  .era-row-main{text-align:right}
  .era-row-title{font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);line-height:1.2}
  .era-wiki{display:inline-block;margin-left:4px;color:rgba(212,175,55,.8);text-decoration:none;font-size:var(--fs-3);font-family:'Cinzel',serif}
  .era-wiki:hover{color:var(--gold,#D4AF37)}
  .era-year-chip{position:absolute;transform:translateY(-50%);text-align:right;font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);color:#6B7280;letter-spacing:.02em;z-index:5;white-space:nowrap;pointer-events:none}
  .era-hij-chip{position:absolute;transform:translateY(-50%);text-align:left;font-family:'Source Sans 3',sans-serif;font-size:var(--fs-3);color:#8B7A3E;z-index:5;white-space:nowrap;pointer-events:none}
  .era-ruler-toggle{position:absolute;display:flex;align-items:center;gap:4px;z-index:5}
  .era-ruler-btn{font-size:var(--fs-3);color:#555;cursor:pointer;padding:2px 5px;border-radius:8px;border:1px solid transparent;transition:.2s;user-select:none;font-family:'Cinzel',serif;letter-spacing:.03em}
  .era-ruler-btn.on{color:#D4AF37;border-color:#D4AF37}
  .era-ruler-btn:hover{color:#D4AF37}
  .era-ruler-sep{color:#444;font-size:var(--fs-3);pointer-events:none}
  svg.era-leaves{position:absolute;top:0;overflow:visible;pointer-events:none;z-index:2}
  svg.era-leaves g.era-leaf{cursor:pointer;pointer-events:all}
  .era-leaf-label{position:absolute;white-space:nowrap;z-index:4}
  .era-era-band{position:absolute;left:${_EV_STEM_X+18}px;right:0;pointer-events:none;z-index:1}
  .era-era-label{position:absolute;right:24px;font-family:'Cinzel',serif;font-size:var(--fs-3);letter-spacing:.14em;pointer-events:none;z-index:1;text-align:right;font-weight:700;text-transform:uppercase}
  .era-era-label-name{font-weight:700}
  .era-era-label-dates{font-size:var(--fs-3);opacity:.6;margin-top:2px;font-weight:400;letter-spacing:.08em}
  .era-curfew-line{position:absolute;left:0;right:0;height:1px;background:rgba(212,175,55,0.4);pointer-events:none;z-index:10}
  .era-curfew-year{position:absolute;right:40px;top:-10px;font-family:'Cinzel',serif;font-size:var(--fs-3);color:var(--gold,#D4AF37);background:#0E1621;padding:2px 8px;border:1px solid rgba(212,175,55,.5);border-radius:2px}
  .era-hidden-by-curfew{visibility:hidden}
  `;
  const s=document.createElement('style');
  s.id='erasViewStyles'; s.textContent=css;
  document.head.appendChild(s);
}

function _evCollectTypes(){
  const counts={};
  const earliest={};
  (typeof PEOPLE!=='undefined'?PEOPLE:[]).forEach(p=>{
    if(!p.type) return;
    counts[p.type]=(counts[p.type]||0)+1;
    var d=_evDob(p); if(d!=null&&(earliest[p.type]==null||d<earliest[p.type])) earliest[p.type]=d;
  });
  const out=Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999}));
  out.sort((a,b)=>a._earliest-b._earliest);
  if(typeof PROPHET_CHAIN!=='undefined' && PROPHET_CHAIN.size && !out.some(t=>t.name==='Prophetic Lineage')){
    const pi=out.findIndex(t=>t.name==='Prophet');
    out.splice(pi>=0?pi+1:0,0,{name:'Prophetic Lineage',count:PROPHET_CHAIN.size,_earliest:-4000});
  }
  return out;
}
function _evCollectTrads(){
  const counts={};
  const earliest={};
  (typeof PEOPLE!=='undefined'?PEOPLE:[]).forEach(p=>{
    if(!p.tradition || _EV_SKIP_TRADS[p.tradition]) return;
    counts[p.tradition]=(counts[p.tradition]||0)+1;
    var d=_evDob(p); if(d!=null&&(earliest[p.tradition]==null||d<earliest[p.tradition])) earliest[p.tradition]=d;
  });
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
}

function _evFiltered(){
  const all=(typeof PEOPLE!=='undefined')?PEOPLE:[];
  const q=(_EV_FILTER.search||'').toLowerCase().trim();
  const ts=_EV_FILTER.types, tr=_EV_FILTER.trads;
  let out=all.filter(p=>{
    if(ts.size){
      let match=false;
      if(ts.has('Prophetic Lineage') && typeof PROPHET_CHAIN!=='undefined' && PROPHET_CHAIN.has(p.famous)) match=true;
      if(!match){ for(const t of ts){ if(t!=='Prophetic Lineage' && p.type===t){ match=true; break; } } }
      if(!match) return false;
    }
    if(tr.size && !tr.has(p.tradition)) return false;
    if(q){
      const hay=((p.famous||'')+' '+(p.type||'')+' '+(p.tradition||'')).toLowerCase();
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  });
  out.sort((a,b)=>{
    const ay=_evDob(a), by=_evDob(b);
    return (ay==null?99999:ay) - (by==null?99999:by);
  });
  return out;
}

function _evBuildCanvas(){
  _evSyncClearBtn();
  const canvas=document.getElementById('era-canvas');
  if(!canvas) return;
  const people=_evFiltered();
  if(!people.length){
    canvas.style.height='200px';
    canvas.innerHTML='<div id="era-empty">NO FIGURES MATCH YOUR FILTERS</div>';
    return;
  }
  const totalH=_EV_TOP_PAD + people.length*_EV_ROW_H + _EV_BOT_PAD;
  canvas.style.height=totalH+'px';
  const rowMap={};
  let html='';
  html+='<div id="era-stem" style="top:'+(_EV_TOP_PAD-10)+'px;height:'+(totalH - _EV_TOP_PAD - _EV_BOT_PAD + 20)+'px"></div>';

  people.forEach((p,idx)=>{
    const y=_EV_TOP_PAD+idx*_EV_ROW_H;
    const midY=y+_EV_ROW_H/2;
    rowMap[p.slug]={y:y,midY:midY,person:p};
    const dob=_evDob(p);
    const nameCol=_evNameColor(p);
    const yrTxt=_evFmtYear(dob);

    html+='<div class="era-row" data-slug="'+_evEsc(p.slug)+'" data-name="'+_evEsc(p.famous)+'" data-year="'+(dob==null?'':dob)+'" style="top:'+y+'px;height:'+_EV_ROW_H+'px">';
    html+='<div class="era-row-main"><div class="era-row-title" style="color:'+nameCol+'">'+_evEsc(p.famous)+_evWiki(p)+'</div></div>';
    html+='</div>';
    html+='<div class="era-year-chip" style="top:'+midY+'px;left:'+(_EV_STEM_X-46)+'px;width:40px;'+(_evShowCE?'':'display:none')+'">'+yrTxt+'</div>';
    var _hij=_evCeToHijri(dob);
    var _hijLabel=_hij<0?Math.abs(_hij)+'<span class="year-era">ق.هـ</span>':_hij+'<span class="year-era">هـ</span>';
    html+='<div class="era-hij-chip" style="top:'+midY+'px;left:'+(_EV_STEM_X+10)+'px;'+(_evShowHijri?'':'display:none')+'">'+_hijLabel+'</div>';
  });
  html+='<div class="era-ruler-toggle" style="top:'+(_EV_TOP_PAD-28)+'px;left:'+(_EV_STEM_X-22)+'px">';
  html+='<span class="era-ruler-btn'+(_evShowCE?' on':'')+'" data-ruler="ce">CE</span>';
  html+='<span class="era-ruler-sep">│</span>';
  html+='<span class="era-ruler-btn'+(_evShowHijri?' on':'')+'" data-ruler="hij">هـ</span>';
  html+='</div>';
  canvas.innerHTML=html;

  canvas.querySelectorAll('.era-row').forEach(row=>{
    row.addEventListener('click',function(e){
      if(e.target.closest('.era-wiki')) return;
      const name=row.getAttribute('data-name');
      if(!name) return;
      // sandbox: TIMELINE jump not wired — log only
      if(typeof window.jumpTo === 'function'){ window.jumpTo(name); }
    });
  });
  canvas.querySelectorAll('.era-ruler-btn').forEach(btn=>{
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var which=this.getAttribute('data-ruler');
      if(which==='ce'){_evShowCE=!_evShowCE;this.classList.toggle('on',_evShowCE);canvas.querySelectorAll('.era-year-chip').forEach(m=>{m.style.display=_evShowCE?'':'none';});}
      if(which==='hij'){_evShowHijri=!_evShowHijri;this.classList.toggle('on',_evShowHijri);canvas.querySelectorAll('.era-hij-chip').forEach(m=>{m.style.display=_evShowHijri?'':'none';});}
    });
  });

  _evRenderLeaves(people, rowMap, totalH);
}

function _evRenderLeaves(people, rowMap, totalH){
  const canvas=document.getElementById('era-canvas');
  if(!canvas) return;
  const NS='http://www.w3.org/2000/svg';

  const byTag={};
  people.forEach(p=>{
    if(p.type){
      if(!byTag[p.type]) byTag[p.type]={key:p.type,field:'type',people:[],color:_EV_TYPE_COLORS[p.type]||'#A0AEC0'};
      byTag[p.type].people.push(p);
    }
    if(p.tradition && !_EV_SKIP_TRADS[p.tradition]){
      if(!byTag[p.tradition]) byTag[p.tradition]={key:p.tradition,field:'trad',people:[],color:_EV_TRAD_COLORS[p.tradition]||'#A0AEC0'};
      byTag[p.tradition].people.push(p);
    }
  });
  if(typeof PROPHET_CHAIN!=='undefined'){
    const chain=people.filter(p=>PROPHET_CHAIN.has(p.famous));
    if(chain.length) byTag['Prophetic Lineage']={key:'Prophetic Lineage',field:'type',people:chain,color:'rgba(212,175,55,0.55)'};
  }
  const leaves=Object.values(byTag).filter(t=>t.people.length>0);
  if(!leaves.length) return;

  leaves.forEach(t=>{
    const ys=t.people.map(p=>rowMap[p.slug].midY);
    t.y1=Math.min.apply(null,ys); t.y2=Math.max.apply(null,ys);
    t.count=t.people.length;
  });
  leaves.sort((a,b)=>a.y1-b.y1);
  const maxCount=Math.max.apply(null,leaves.map(l=>l.count));

  _EV_ERA_BANDS.forEach(era=>{
    const y1e=_evYearToY(era.start,people,rowMap);
    const y2e=_evYearToY(era.end,people,rowMap);
    if(y2e-y1e<6) return;
    const gDiv=document.createElement('div');
    gDiv.className='era-era-band';
    gDiv.style.cssText='top:'+y1e+'px;height:'+(y2e-y1e)+'px;background:linear-gradient(to left, rgba('+era.glow+',0.10) 0%, rgba('+era.glow+',0.04) 50%, transparent 85%)';
    canvas.appendChild(gDiv);
    const label=document.createElement('div');
    label.className='era-era-label';
    label.style.top=(y1e+12)+'px';
    label.innerHTML='<div class="era-era-label-name" style="color:rgba('+era.glow+',0.85)">'+era.name+'</div><div class="era-era-label-dates" style="color:rgba('+era.glow+',0.7)">'+era.dates+'</div>';
    canvas.appendChild(label);
  });

  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('class','era-leaves');
  svg.style.left=_EV_STEM_X+'px';
  const rightW=Math.max(400,(canvas.clientWidth||1400)-_EV_STEM_X-80);
  svg.setAttribute('width',rightW);
  svg.setAttribute('height',totalH);

  const maxLeafW=rightW*0.6;
  const MIN_LEAF_W=30;
  const totalLeaves=leaves.length;

  leaves.forEach((ld,idx)=>{
    let y1=ld.y1, y2=ld.y2;
    if(y2-y1<10) y2=y1+10;
    const leafW=Math.max(MIN_LEAF_W,(ld.count/maxCount)*maxLeafW);
    const xOffset=15+(idx/totalLeaves)*(rightW*0.30);
    const midY=(y1+y2)/2;
    const peakX=xOffset+leafW;
    const stemX=1;

    const cp1y=y1+(midY-y1)*0.3;
    const cp2y=y1+(midY-y1)*0.7;
    const cp3y=midY+(y2-midY)*0.3;
    const cp4y=midY+(y2-midY)*0.7;
    const d='M '+stemX+' '+y1.toFixed(1)+
      ' C '+(stemX+leafW*0.1).toFixed(1)+' '+cp1y.toFixed(1)+
      ', '+peakX.toFixed(1)+' '+cp2y.toFixed(1)+
      ', '+peakX.toFixed(1)+' '+midY.toFixed(1)+
      ' C '+peakX.toFixed(1)+' '+cp3y.toFixed(1)+
      ', '+(stemX+leafW*0.1).toFixed(1)+' '+cp4y.toFixed(1)+
      ', '+stemX+' '+y2.toFixed(1)+' Z';

    const g=document.createElementNS(NS,'g');
    g.setAttribute('class','era-leaf'); g.setAttribute('data-tag',ld.key);
    g.style.cursor='pointer'; g.style.pointerEvents='auto';
    const path=document.createElementNS(NS,'path');
    path.setAttribute('d',d); path.setAttribute('fill','none'); path.setAttribute('fill-opacity','0');
    path.setAttribute('stroke',ld.color); path.setAttribute('stroke-opacity','0.5'); path.setAttribute('stroke-width','2.5');
    g.appendChild(path);
    const dot1=document.createElementNS(NS,'circle');
    dot1.setAttribute('cx',stemX); dot1.setAttribute('cy',y1); dot1.setAttribute('r',2); dot1.setAttribute('fill',ld.color);
    dot1.style.pointerEvents='none'; g.appendChild(dot1);
    const dot2=document.createElementNS(NS,'circle');
    dot2.setAttribute('cx',stemX); dot2.setAttribute('cy',y2); dot2.setAttribute('r',2); dot2.setAttribute('fill',ld.color);
    dot2.style.pointerEvents='none'; g.appendChild(dot2);
    svg.appendChild(g);

    ld._y1=y1; ld._stemX=stemX;

    const clickH=function(e){
      e.stopPropagation();
      if(ld.field==='type'){ _EV_FILTER.types.clear(); _EV_FILTER.types.add(ld.key); }
      else { _EV_FILTER.trads.clear(); _EV_FILTER.trads.add(ld.key); }
      _evSyncBtnLabel('era-type-btn',_EV_FILTER.types,'— SELECT A TYPE —','types');
      _evSyncBtnLabel('era-trad-btn',_EV_FILTER.trads,'— SELECT A TRADITION —','traditions');
      _evBuildCanvas(); _evAnimStop();
    };
    g.addEventListener('click',clickH);
    g.addEventListener('mouseenter',function(){ if(_EV_FILTER.types.size||_EV_FILTER.trads.size) return; path.setAttribute('stroke-opacity','0.9'); });
    g.addEventListener('mouseleave',function(){ if(_EV_FILTER.types.size||_EV_FILTER.trads.size) return; path.setAttribute('stroke-opacity','0.5'); });
  });

  canvas.appendChild(svg);

  const LABEL_H=22;
  const LABEL_LEFT=_EV_STEM_X+90;
  const labelInfos=[];
  leaves.forEach(ld=>{
    const naturalY=ld._y1+6;
    labelInfos.push({key:ld.key,count:ld.count,color:ld.color,field:ld.field,naturalY:naturalY,anchorY:ld._y1,resolvedY:naturalY});
  });
  labelInfos.sort((a,b)=>a.naturalY-b.naturalY);
  let lastBottom=-Infinity;
  labelInfos.forEach(li=>{
    if(li.resolvedY<lastBottom+2) li.resolvedY=lastBottom+2;
    lastBottom=li.resolvedY+LABEL_H;
  });
  labelInfos.forEach(li=>{
    const connY=li.anchorY;
    const connDiv=document.createElement('div');
    connDiv.style.cssText='position:absolute;top:'+connY+'px;left:'+(_EV_STEM_X+2)+'px;width:'+(LABEL_LEFT-_EV_STEM_X-2)+'px;height:0;border-top:1px dashed rgba('+_evColorToRgb(li.color)+',0.35);pointer-events:none;z-index:3';
    if(Math.abs(li.resolvedY-connY)>2){
      const vertDiv=document.createElement('div');
      vertDiv.style.cssText='position:absolute;top:'+Math.min(connY,li.resolvedY+LABEL_H/2)+'px;left:'+(LABEL_LEFT-1)+'px;width:0;height:'+Math.abs(li.resolvedY+LABEL_H/2-connY)+'px;border-left:1px dashed rgba('+_evColorToRgb(li.color)+',0.35);pointer-events:none;z-index:3';
      canvas.appendChild(vertDiv);
    }
    canvas.appendChild(connDiv);
    const extLabel=document.createElement('div');
    extLabel.className='era-leaf-label';
    extLabel.setAttribute('data-tag',li.key);
    extLabel.style.cssText='position:absolute;top:'+li.resolvedY+'px;left:'+LABEL_LEFT+'px;white-space:nowrap;pointer-events:auto;cursor:pointer;font-family:\'Cinzel\',serif;font-size:var(--fs-3);font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:'+li.color+';background:rgba(14,22,33,0.85);padding:2px 8px;border-radius:2px;border:1px solid rgba('+_evColorToRgb(li.color)+',0.4);z-index:4';
    extLabel.textContent=li.key+' ('+li.count+')';
    extLabel.addEventListener('click',function(e){
      e.stopPropagation();
      if(li.field==='type'){ _EV_FILTER.types.clear(); _EV_FILTER.types.add(li.key); }
      else { _EV_FILTER.trads.clear(); _EV_FILTER.trads.add(li.key); }
      _evSyncBtnLabel('era-type-btn',_EV_FILTER.types,'— SELECT A TYPE —','types');
      _evSyncBtnLabel('era-trad-btn',_EV_FILTER.trads,'— SELECT A TRADITION —','traditions');
      _evBuildCanvas(); _evAnimStop();
    });
    canvas.appendChild(extLabel);
  });
}

function _evCk(on){ return '<span class="era-ck'+(on?' on':'')+'"></span>'; }
function _evSyncBtnLabel(btnId,filterSet,defaultLabel,noun){
  const btn=document.getElementById(btnId); if(!btn) return;
  const n=filterSet.size; let txt=defaultLabel;
  if(n===1) txt=[...filterSet][0]; else if(n>1) txt=n+' '+noun+' selected';
  btn.innerHTML=_evEsc(txt)+'  <span style="opacity:.6">▾</span>';
}
function _evBuildPanel(scrollId,searchId,filterSet,items,onchange){
  const scroll=document.getElementById(scrollId); if(!scroll) return;
  const si=document.getElementById(searchId);
  const q=(si&&si.value||'').toLowerCase().trim();
  const toggleLabel=filterSet.size>0?'Deselect all':'Select all';
  let html='<div style="display:flex;justify-content:flex-end;padding:2px 14px 4px"><span class="era-dd-toggle-all" style="font-family:Cinzel,serif;font-size:var(--fs-3);color:var(--gold,#D4AF37);cursor:pointer;letter-spacing:.06em">'+toggleLabel+'</span></div>';
  const filtered=items.filter(t=>!q||t.name.toLowerCase().indexOf(q)>-1);
  filtered.forEach(t=>{
    const on=filterSet.has(t.name);
    html+='<div class="dd-item'+(on?' selected':'')+'" data-val="'+_evEsc(t.name)+'"><div class="dd-checkbox">'+(on?'✓':'')+'</div><span>'+_evEsc(t.name)+'</span><span class="dd-count">'+t.count+'</span></div>';
  });
  scroll.innerHTML=html;
  scroll.querySelectorAll('.dd-item').forEach(el=>{
    el.addEventListener('click',function(){ const v=this.getAttribute('data-val'); if(filterSet.has(v)) filterSet.delete(v); else filterSet.add(v); onchange(); });
  });
  scroll.querySelectorAll('.era-dd-toggle-all').forEach(el=>{
    el.addEventListener('click',function(){ if(filterSet.size>0) filterSet.clear(); else items.forEach(t=>filterSet.add(t.name)); onchange(); });
  });
}
function _evBuildTypePanel(){
  _evBuildPanel('era-type-scroll','era-type-search',_EV_FILTER.types,_evCollectTypes(),function(){
    _evSyncBtnLabel('era-type-btn',_EV_FILTER.types,'— SELECT A TYPE —','types');
    _evBuildTypePanel(); _evBuildCanvas(); _evAnimStop();
  });
}
function _evBuildTradPanel(){
  _evBuildPanel('era-trad-scroll','era-trad-search',_EV_FILTER.trads,_evCollectTrads(),function(){
    _evSyncBtnLabel('era-trad-btn',_EV_FILTER.trads,'— SELECT A TRADITION —','traditions');
    _evBuildTradPanel(); _evBuildCanvas(); _evAnimStop();
  });
}
function _evSyncClearBtn(){
  const btn=document.getElementById('era-clear-all'); if(!btn) return;
  const has=_EV_FILTER.types.size||_EV_FILTER.trads.size||_EV_FILTER.search;
  btn.classList.toggle('active',!!has);
}

function _evCurfewYToYear(cursorY,canvas){
  const rows=[].slice.call(canvas.querySelectorAll('.era-row'));
  for(let i=rows.length-1;i>=0;i--){
    const t=parseFloat(rows[i].style.top)||0;
    if(cursorY>=t){ const yr=rows[i].getAttribute('data-year'); if(yr!=='') return parseInt(yr,10); }
  }
  return null;
}
function _evAnimPlay(){
  const canvas=document.getElementById('era-canvas');
  const scroll=document.getElementById('era-scroll');
  if(!canvas||!scroll) return;
  let cursor=document.getElementById('era-curfew');
  if(!cursor){
    cursor=document.createElement('div'); cursor.id='era-curfew'; cursor.className='era-curfew-line';
    cursor.innerHTML='<span id="era-curfew-year" class="era-curfew-year"></span>';
    cursor.style.display='none'; canvas.appendChild(cursor);
  }
  var blackout=document.getElementById('era-blackout');
  if(!blackout){
    blackout=document.createElement('div'); blackout.id='era-blackout';
    blackout.style.cssText='display:none;position:absolute;left:0;right:0;background:#000;z-index:8;pointer-events:none';
    canvas.appendChild(blackout);
  }
  if(_EV_ANIM.mode==='paused'){
    _EV_ANIM.mode='playing'; cursor.style.display='';
    _EV_ANIM.timer=setInterval(_EV_ANIM.tick,_EV_ANIM.speedMs); return;
  }
  _EV_ANIM.mode='playing';
  _EV_ANIM.cursorY=_EV_TOP_PAD;
  _EV_ANIM.speedMs=_EV_ANIM_CTL?_EV_ANIM_CTL.getSpeedMs():1200;
  if(blackout){blackout.style.display='';blackout.style.top='0px';blackout.style.height=(_EV_ANIM.maxY||2000)+'px';}
  cursor.style.display=''; cursor.style.top=_EV_ANIM.cursorY+'px';
  _EV_ANIM.maxY=parseFloat(canvas.style.height)||2000;
  const STEP=4;
  _EV_ANIM.tick=function(){
    if(_EV_ANIM.mode!=='playing') return;
    _EV_ANIM.cursorY+=STEP;
    if(_EV_ANIM.cursorY>_EV_ANIM.maxY*0.8){ _evAnimStop(); return; }
    cursor.style.top=_EV_ANIM.cursorY+'px';
    var bo=document.getElementById('era-blackout');
    if(bo){bo.style.top=(_EV_ANIM.cursorY+1)+'px';bo.style.height=(_EV_ANIM.maxY-_EV_ANIM.cursorY)+'px';}
    const yr=_evCurfewYToYear(_EV_ANIM.cursorY,canvas);
    const yrEl=document.getElementById('era-curfew-year');
    if(yrEl) yrEl.innerHTML=yr!=null?_evFmtYear(yr):'';
    scroll.scrollTo({top:Math.max(0,_EV_ANIM.cursorY-scroll.clientHeight/2),behavior:'auto'});
  };
  _EV_ANIM.tick();
  _EV_ANIM.timer=setInterval(_EV_ANIM.tick,_EV_ANIM.speedMs);
}
function _evAnimPause(){
  _EV_ANIM.mode='paused';
  if(_EV_ANIM.timer){ clearInterval(_EV_ANIM.timer); _EV_ANIM.timer=null; }
}
function _evAnimStop(){
  _EV_ANIM.mode='stopped';
  if(_EV_ANIM.timer){ clearInterval(_EV_ANIM.timer); _EV_ANIM.timer=null; }
  _EV_ANIM.tick=null;
  const canvas=document.getElementById('era-canvas');
  if(canvas){
    var bo=document.getElementById('era-blackout');
    if(bo) bo.style.display='none';
  }
  const cursor=document.getElementById('era-curfew'); if(cursor) cursor.style.display='none';
  if(_EV_ANIM_CTL) _EV_ANIM_CTL.forceStop();
}

function initEras(){
  _evInjectStyles();
  const view=document.getElementById('eras-view'); if(!view) return;
  view.style.flexDirection='column';

  let html='';
  // Hidden helper buttons — keep IDs so existing _evSyncBtnLabel etc. continues to work.
  html+='<div style="display:none">';
  html+='<button id="era-type-btn"></button>';
  html+='<button id="era-trad-btn"></button>';
  html+='<button id="era-clear-all"></button>';
  html+='</div>';
  // Filter dropdown panels — fixed-positioned on open below shell row 2 buttons.
  html+='<div class="dd-panel" id="era-type-panel" style="position:fixed;display:none">';
  html+='<input class="dd-search" id="era-type-search" placeholder="search types…">';
  html+='<div id="era-type-scroll"></div>';
  html+='</div>';
  html+='<div class="dd-panel" id="era-trad-panel" style="position:fixed;display:none">';
  html+='<input class="dd-search" id="era-trad-search" placeholder="search traditions…">';
  html+='<div id="era-trad-scroll"></div>';
  html+='</div>';
  html+='<div id="era-scroll"><div id="era-canvas"></div></div>';
  view.innerHTML=html;

  _evBuildTypePanel(); _evBuildTradPanel(); _evBuildCanvas();

  // Panel content live-search bindings (panels themselves are wired to shell buttons in _wireZoneB).
  ['era-type-search','era-trad-search'].forEach(function(id, i){
    var el = document.getElementById(id);
    var build = [_evBuildTypePanel, _evBuildTradPanel][i];
    if(el && build) el.addEventListener('input', build);
  });
  // Outside-click closes any open panel.
  document.addEventListener('click', function(e){
    ['era-type-panel','era-trad-panel'].forEach(function(pid){
      var p = document.getElementById(pid);
      if(!p) return;
      var srcBtn = window._evShellBtns ? window._evShellBtns[pid] : null;
      if(p.classList.contains('open') && !p.contains(e.target) && (!srcBtn || !srcBtn.contains(e.target))){
        p.classList.remove('open');
        p.style.display = 'none';
      }
    });
  });
  document.getElementById('era-clear-all').addEventListener('click',function(e){
    e.stopPropagation();
    _EV_FILTER.types.clear(); _EV_FILTER.trads.clear(); _EV_FILTER.search='';
    _evSyncBtnLabel('era-type-btn',_EV_FILTER.types,'— SELECT A TYPE —','types');
    _evSyncBtnLabel('era-trad-btn',_EV_FILTER.trads,'— SELECT A TRADITION —','traditions');
    _evBuildTypePanel(); _evBuildTradPanel(); _evBuildCanvas(); _evAnimStop();
  });
  var _evHowBtn=document.getElementById('era-how-btn');
  if(_evHowBtn) _evHowBtn.addEventListener('click',function(e){e.stopPropagation();_showErasMethodology();});

  const animMount=document.getElementById('era-anim-mount');
  if(animMount && window.AnimControls){
    _EV_ANIM_CTL=window.AnimControls.create({
      mountEl:animMount, idPrefix:'era', initialSpeed:'1x',
      onPlay:_evAnimPlay, onPause:_evAnimPause, onStop:_evAnimStop,
      onSpeedChange:function(ms){ _EV_ANIM.speedMs=ms; }
    });
  }

  _EV_INITED=true;
}

function _showErasMethodology(){
  if(document.getElementById('eras-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='eras-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="eras-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">A vertical timeline where each figure appears as a leaf shape spanning their lifespan. Filter by type and tradition to see how groups overlapped across centuries.</p>'
    +'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin-top:16px">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('eras-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

  // Wire shell's Zone B controls — ERAS spec: { search:false, filters:[Era select], actions:[], htw:true }
  function _wireZoneB(zoneBEl){
    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;
    var selects = row2.querySelectorAll('.zb-select');

    var shellMap = { 'era-type-panel': null, 'era-trad-panel': null };
    selects.forEach(function(b){
      var t = (b.textContent||'').trim().toUpperCase();
      if(t === 'TYPE'){ shellMap['era-type-panel'] = b; }
      else if(t === 'TRADITION'){ shellMap['era-trad-panel'] = b; }
    });
    window._evShellBtns = shellMap;

    function _evOpenPanel(panelId, btn){
      var panel = document.getElementById(panelId);
      if(!panel || !btn) return;
      ['era-type-panel','era-trad-panel'].forEach(function(id){
        if(id !== panelId){
          var p = document.getElementById(id);
          if(p){ p.classList.remove('open'); p.style.display = 'none'; }
        }
      });
      var nowOpen = !panel.classList.contains('open');
      panel.classList.toggle('open', nowOpen);
      if(nowOpen){
        var r = btn.getBoundingClientRect();
        panel.style.position = 'fixed';
        panel.style.top  = (r.bottom + 4) + 'px';
        panel.style.left = r.left + 'px';
        panel.style.zIndex = 10000;
        panel.style.display = 'block';
        var s = panel.querySelector('.dd-search');
        if(s) s.focus();
      } else {
        panel.style.display = 'none';
      }
    }

    Object.keys(shellMap).forEach(function(panelId){
      var btn = shellMap[panelId];
      if(!btn) return;
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        _evOpenPanel(panelId, btn);
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('er-mounted');

    // initEras expects #eras-view in the DOM.
    zoneCEl.innerHTML = '<div id="eras-view"></div>';

    // Eager Promise.all: core.json (figures) + events/master.json (per task spec).
    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });
    var p2 = (window.eventsData && window.eventsData.events)
      ? Promise.resolve(window.eventsData)
      : fetch(dataUrl('data/islamic/events/master.json'))
          .then(function(r){ return r.ok ? r.json() : null; })
          .catch(function(){ return null; })
          .then(function(d){ if(d) window.eventsData = d; return d; });

    Promise.all([p1, p2]).then(function(){
      initEras();
      _wireZoneB(zoneBEl);
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('er-mounted');

    try { _evAnimStop(); } catch(e) {}

    var ov = document.getElementById('eras-method-overlay'); if(ov) ov.remove();
    var s = document.getElementById('erasViewStyles'); if(s) s.remove();

    _EV_INITED = false;

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return {
    mount: mount,
    unmount: unmount,
    showHtw: _showErasMethodology,
    animateStart: _evAnimPlay,
    animatePause: _evAnimPause,
    animateStop:  _evAnimStop,
    animateSetSpeed: function(label){
      var map = { '0.5x':2400, '1x':1200, '2x':600, '4x':300 };
      _EV_ANIM.speedMs = map[label] || 1200;
    }
  };
})();
