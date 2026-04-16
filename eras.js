// ═══════════════════════════════════════════════════════════
// ERAS VIEW — Direct clone of Books view (rewrite #5 final)
// Apr 16 2026
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

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
  {name:'Rashidun',          start:632,   end:661,  dates:'632\u2013661 CE',  glow:'60,160,90'},
  {name:'Umayyad',           start:661,   end:750,  dates:'661\u2013750 CE',  glow:'50,180,180'},
  {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750\u20131258 CE', glow:'70,130,210'},
  {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258\u20131500 CE',glow:'180,60,60'},
  {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500\u20131800 CE',glow:'50,140,90'},
  {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800\u20131950 CE',glow:'200,150,60'},
  {name:'Contemporary',      start:1950,  end:2025, dates:'1950\u2013Present',glow:'80,160,200'}
];

function _evEsc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _evFmtYear(y){
  if(y==null||y==='') return '\u2014';
  const n = typeof y==='number' ? y : parseInt(y,10);
  if(isNaN(n)) return '\u2014';
  if(n<0) return Math.abs(n)+'<span class="year-era">BCE</span>';
  return n+'<span class="year-era">CE</span>';
}
function _evDob(p){ return (p && p.dob_academic!=null) ? p.dob_academic : (p ? p.dob : null); }
function _evWiki(p){
  if(!window._wikidata||!p.slug||!window._wikidata[p.slug]||!window._wikidata[p.slug].wikipedia||!window._wikidata[p.slug].wikipedia.en) return '';
  return ' <a class="ev-wiki" href="https://en.wikipedia.org/wiki/'+encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))+'" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="Wikipedia">W</a>';
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
  #eras-view{flex:1;display:none;overflow:hidden;background:var(--bg0,#0E1621);flex-direction:column}
  #ev-toolbar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border2,#2D3748);background:var(--bg0,#0E1621);flex-wrap:wrap}
  .ev-dd-wrap{position:relative}
  .ev-dd-btn{background:none;border:1px solid var(--border2,#2D3748);color:var(--gold,#D4AF37);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.1em;padding:8px 14px;cursor:pointer;min-width:220px;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:10px;border-radius:2px}
  .ev-dd-btn:hover{border-color:var(--gold,#D4AF37)}
  .ev-dd-panel{position:absolute;top:calc(100% + 4px);left:0;width:300px;max-height:420px;background:#0E1621;border:1px solid var(--gold,#D4AF37);border-radius:2px;z-index:100;display:none;flex-direction:column;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.6)}
  .ev-dd-panel.open{display:flex}
  .ev-dd-search{margin:10px 10px 6px;padding:7px 9px;background:#1a2330;border:1px solid var(--border2,#2D3748);color:#fff;font-family:'Source Sans 3',sans-serif;font-size:12px;border-radius:2px;outline:none}
  .ev-dd-search:focus{border-color:var(--gold,#D4AF37)}
  .ev-dd-scroll{flex:1;overflow-y:auto;padding:4px 0 10px}
  .ev-ck-row{display:flex;align-items:center;gap:10px;padding:6px 14px;cursor:pointer;font-family:'Source Sans 3',sans-serif;font-size:12px;color:var(--text1,#E4E4E7)}
  .ev-ck-row:hover{background:rgba(212,175,55,.08)}
  .ev-ck-row.checked{background:rgba(212,175,55,.06);color:var(--gold,#D4AF37)}
  .ev-ck{width:12px;height:12px;border:1px solid var(--border2,#2D3748);border-radius:2px;flex-shrink:0}
  .ev-ck.on{background:var(--gold,#D4AF37);border-color:var(--gold,#D4AF37);box-shadow:inset 0 0 0 2px #0E1621}
  .ev-ck-label{flex:1}
  .ev-ck-count{font-size:10px;color:var(--muted,#6B7B8C);font-family:'Cinzel',serif}
  .ev-clear-all{background:none;border:1px solid var(--border2,#2D3748);color:var(--muted,#6B7B8C);width:32px;height:32px;cursor:pointer;border-radius:2px;font-size:14px;opacity:.4}
  .ev-clear-all.active{opacity:1;border-color:rgba(212,175,55,.6);color:var(--gold,#D4AF37)}
  #ev-anim-mount{margin-left:auto;display:flex;align-items:center;gap:10px}
  #ev-scroll{flex:1;overflow-y:auto;overflow-x:hidden;position:relative}
  #ev-canvas{position:relative;width:100%}
  #ev-empty{padding:60px;text-align:center;color:var(--muted,#6B7B8C);font-family:'Cinzel',serif;font-size:12px;letter-spacing:.1em}
  #ev-stem{position:absolute;left:${_EV_STEM_X - 2}px;width:5px;background:var(--gold,#D4AF37);box-shadow:0 0 18px rgba(212,175,55,.55);pointer-events:none;z-index:1}
  .ev-row{position:absolute;left:0;width:${_EV_LEFT_W}px;padding:4px 20px;cursor:pointer;transition:background .12s;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;z-index:4}
  .ev-row:hover{background:rgba(212,175,55,.06)}
  .ev-row.hi{background:rgba(212,175,55,.16);box-shadow:inset 3px 0 0 var(--gold,#D4AF37)}
  .ev-row-main{text-align:right}
  .ev-row-title{font-family:'Source Sans 3',sans-serif;font-size:13px;line-height:1.2}
  .ev-wiki{display:inline-block;margin-left:4px;color:rgba(212,175,55,.8);text-decoration:none;font-size:10px;font-family:'Cinzel',serif}
  .ev-wiki:hover{color:var(--gold,#D4AF37)}
  .ev-year-chip{position:absolute;transform:translateY(-50%);text-align:right;font-family:'Source Sans 3',sans-serif;font-size:11px;color:#6B7280;letter-spacing:.02em;z-index:5;white-space:nowrap;pointer-events:none}
  svg.ev-leaves{position:absolute;top:0;overflow:visible;pointer-events:none;z-index:2}
  svg.ev-leaves g.ev-leaf{cursor:pointer;pointer-events:all}
  .ev-leaf-label{position:absolute;white-space:nowrap;z-index:4}
  .ev-era-band{position:absolute;left:${_EV_STEM_X+18}px;right:0;pointer-events:none;z-index:1}
  .ev-era-label{position:absolute;right:24px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:.14em;pointer-events:none;z-index:1;text-align:right;font-weight:700;text-transform:uppercase}
  .ev-era-label-name{font-weight:700}
  .ev-era-label-dates{font-size:9px;opacity:.6;margin-top:2px;font-weight:400;letter-spacing:.08em}
  .ev-curfew-line{position:absolute;left:0;right:0;height:1px;background:rgba(212,175,55,0.4);pointer-events:none;z-index:10}
  .ev-curfew-year{position:absolute;right:40px;top:-10px;font-family:'Cinzel',serif;font-size:12px;color:var(--gold,#D4AF37);background:#0E1621;padding:2px 8px;border:1px solid rgba(212,175,55,.5);border-radius:2px}
  .ev-hidden-by-curfew{visibility:hidden}
  `;
  const s=document.createElement('style');
  s.id='erasViewStyles'; s.textContent=css;
  document.head.appendChild(s);
}

function _evCollectTypes(){
  const counts={};
  (typeof PEOPLE!=='undefined'?PEOPLE:[]).forEach(p=>{ if(p.type) counts[p.type]=(counts[p.type]||0)+1; });
  const out=Object.keys(counts).sort().map(k=>({name:k,count:counts[k]}));
  if(typeof PROPHET_CHAIN!=='undefined' && !out.some(t=>t.name==='Prophetic Lineage')){
    const pi=out.findIndex(t=>t.name==='Prophet');
    out.splice(pi>=0?pi+1:0,0,{name:'Prophetic Lineage',count:PROPHET_CHAIN.size});
  }
  return out;
}
function _evCollectTrads(){
  const counts={};
  (typeof PEOPLE!=='undefined'?PEOPLE:[]).forEach(p=>{
    if(p.tradition && !_EV_SKIP_TRADS[p.tradition]) counts[p.tradition]=(counts[p.tradition]||0)+1;
  });
  return Object.keys(counts).sort().map(k=>({name:k,count:counts[k]}));
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
  const canvas=document.getElementById('ev-canvas');
  if(!canvas) return;
  const people=_evFiltered();
  if(!people.length){
    canvas.style.height='200px';
    canvas.innerHTML='<div id="ev-empty">NO FIGURES MATCH YOUR FILTERS</div>';
    return;
  }
  const totalH=_EV_TOP_PAD + people.length*_EV_ROW_H + _EV_BOT_PAD;
  canvas.style.height=totalH+'px';
  const rowMap={};
  let html='';
  html+='<div id="ev-stem" style="top:'+(_EV_TOP_PAD-10)+'px;height:'+(totalH - _EV_TOP_PAD - _EV_BOT_PAD + 20)+'px"></div>';

  people.forEach((p,idx)=>{
    const y=_EV_TOP_PAD+idx*_EV_ROW_H;
    const midY=y+_EV_ROW_H/2;
    rowMap[p.slug]={y:y,midY:midY,person:p};
    const dob=_evDob(p);
    const nameCol=_evNameColor(p);
    const yrTxt=_evFmtYear(dob);

    html+='<div class="ev-row" data-slug="'+_evEsc(p.slug)+'" data-name="'+_evEsc(p.famous)+'" data-year="'+(dob==null?'':dob)+'" style="top:'+y+'px;height:'+_EV_ROW_H+'px">';
    html+='<div class="ev-row-main"><div class="ev-row-title" style="color:'+nameCol+'">'+_evEsc(p.famous)+_evWiki(p)+'</div></div>';
    html+='</div>';
    html+='<div class="ev-year-chip" style="top:'+midY+'px;left:'+(_EV_STEM_X-46)+'px;width:40px">'+yrTxt+'</div>';
  });
  canvas.innerHTML=html;

  canvas.querySelectorAll('.ev-row').forEach(row=>{
    row.addEventListener('click',function(e){
      if(e.target.closest('.ev-wiki')) return;
      const name=row.getAttribute('data-name');
      if(!name) return;
      if(typeof setView==='function') setView('timeline');
      setTimeout(()=>{ if(typeof jumpTo==='function') jumpTo(name); },50);
    });
  });

  _evRenderLeaves(people, rowMap, totalH);
}

function _evRenderLeaves(people, rowMap, totalH){
  const canvas=document.getElementById('ev-canvas');
  if(!canvas) return;
  const NS='http://www.w3.org/2000/svg';

  // Group into leaves by type + tradition + virtual Prophetic Lineage
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

  // Era bands — row-based yearToY
  _EV_ERA_BANDS.forEach(era=>{
    const y1e=_evYearToY(era.start,people,rowMap);
    const y2e=_evYearToY(era.end,people,rowMap);
    if(y2e-y1e<6) return;
    const gDiv=document.createElement('div');
    gDiv.className='ev-era-band';
    gDiv.style.cssText='top:'+y1e+'px;height:'+(y2e-y1e)+'px;background:linear-gradient(to left, rgba('+era.glow+',0.10) 0%, rgba('+era.glow+',0.04) 50%, transparent 85%)';
    canvas.appendChild(gDiv);
    const label=document.createElement('div');
    label.className='ev-era-label';
    label.style.top=(y1e+12)+'px';
    label.innerHTML='<div class="ev-era-label-name" style="color:rgba('+era.glow+',0.85)">'+era.name+'</div><div class="ev-era-label-dates" style="color:rgba('+era.glow+',0.7)">'+era.dates+'</div>';
    canvas.appendChild(label);
  });

  // SVG leaves — EXACT books.js formula
  const svg=document.createElementNS(NS,'svg');
  svg.setAttribute('class','ev-leaves');
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
    g.setAttribute('class','ev-leaf'); g.setAttribute('data-tag',ld.key);
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
      _evSyncBtnLabel('ev-type-btn',_EV_FILTER.types,'\u2014 SELECT A TYPE \u2014','types');
      _evSyncBtnLabel('ev-trad-btn',_EV_FILTER.trads,'\u2014 SELECT A TRADITION \u2014','traditions');
      _evBuildCanvas(); _evAnimStop();
    };
    g.addEventListener('click',clickH);
    g.addEventListener('mouseenter',function(){ if(_EV_FILTER.types.size||_EV_FILTER.trads.size) return; path.setAttribute('stroke-opacity','0.9'); });
    g.addEventListener('mouseleave',function(){ if(_EV_FILTER.types.size||_EV_FILTER.trads.size) return; path.setAttribute('stroke-opacity','0.5'); });
  });

  canvas.appendChild(svg);

  // Leaf labels — at STEM_X + 90 with dashed connectors (EXACT books.js approach)
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
    extLabel.className='ev-leaf-label';
    extLabel.setAttribute('data-tag',li.key);
    extLabel.style.cssText='position:absolute;top:'+li.resolvedY+'px;left:'+LABEL_LEFT+'px;white-space:nowrap;pointer-events:auto;cursor:pointer;font-family:\'Cinzel\',serif;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:'+li.color+';background:rgba(14,22,33,0.85);padding:2px 8px;border-radius:2px;border:1px solid rgba('+_evColorToRgb(li.color)+',0.4);z-index:4';
    extLabel.textContent=li.key+' ('+li.count+')';
    extLabel.addEventListener('click',function(e){
      e.stopPropagation();
      if(li.field==='type'){ _EV_FILTER.types.clear(); _EV_FILTER.types.add(li.key); }
      else { _EV_FILTER.trads.clear(); _EV_FILTER.trads.add(li.key); }
      _evSyncBtnLabel('ev-type-btn',_EV_FILTER.types,'\u2014 SELECT A TYPE \u2014','types');
      _evSyncBtnLabel('ev-trad-btn',_EV_FILTER.trads,'\u2014 SELECT A TRADITION \u2014','traditions');
      _evBuildCanvas(); _evAnimStop();
    });
    canvas.appendChild(extLabel);
  });
}

// ── Multi-select dropdown panels ──
function _evCk(on){ return '<span class="ev-ck'+(on?' on':'')+'"></span>'; }
function _evSyncBtnLabel(btnId,filterSet,defaultLabel,noun){
  const btn=document.getElementById(btnId); if(!btn) return;
  const n=filterSet.size; let txt=defaultLabel;
  if(n===1) txt=[...filterSet][0]; else if(n>1) txt=n+' '+noun+' selected';
  btn.innerHTML=_evEsc(txt)+'  <span style="opacity:.6">\u25BE</span>';
}
function _evBuildPanel(scrollId,searchId,filterSet,items,onchange){
  const scroll=document.getElementById(scrollId); if(!scroll) return;
  const si=document.getElementById(searchId);
  const q=(si&&si.value||'').toLowerCase().trim();
  const toggleLabel=filterSet.size>0?'Deselect all':'Select all';
  let html='<div style="display:flex;justify-content:flex-end;padding:2px 14px 4px"><span class="ev-dd-toggle-all" style="font-family:Cinzel,serif;font-size:10px;color:var(--gold,#D4AF37);cursor:pointer;letter-spacing:.06em">'+toggleLabel+'</span></div>';
  const filtered=items.filter(t=>!q||t.name.toLowerCase().indexOf(q)>-1);
  filtered.forEach(t=>{
    const on=filterSet.has(t.name);
    html+='<div class="ev-ck-row'+(on?' checked':'')+'" data-val="'+_evEsc(t.name)+'">'+_evCk(on)+'<span class="ev-ck-label">'+_evEsc(t.name)+'</span><span class="ev-ck-count">('+t.count+')</span></div>';
  });
  scroll.innerHTML=html;
  scroll.querySelectorAll('.ev-ck-row').forEach(el=>{
    el.addEventListener('click',function(){ const v=this.getAttribute('data-val'); if(filterSet.has(v)) filterSet.delete(v); else filterSet.add(v); onchange(); });
  });
  scroll.querySelectorAll('.ev-dd-toggle-all').forEach(el=>{
    el.addEventListener('click',function(){ if(filterSet.size>0) filterSet.clear(); else items.forEach(t=>filterSet.add(t.name)); onchange(); });
  });
}
function _evBuildTypePanel(){
  _evBuildPanel('ev-type-scroll','ev-type-search',_EV_FILTER.types,_evCollectTypes(),function(){
    _evSyncBtnLabel('ev-type-btn',_EV_FILTER.types,'\u2014 SELECT A TYPE \u2014','types');
    _evBuildTypePanel(); _evBuildCanvas(); _evAnimStop();
  });
}
function _evBuildTradPanel(){
  _evBuildPanel('ev-trad-scroll','ev-trad-search',_EV_FILTER.trads,_evCollectTrads(),function(){
    _evSyncBtnLabel('ev-trad-btn',_EV_FILTER.trads,'\u2014 SELECT A TRADITION \u2014','traditions');
    _evBuildTradPanel(); _evBuildCanvas(); _evAnimStop();
  });
}
function _evSyncClearBtn(){
  const btn=document.getElementById('ev-clear-all'); if(!btn) return;
  const has=_EV_FILTER.types.size||_EV_FILTER.trads.size||_EV_FILTER.search;
  btn.classList.toggle('active',!!has);
}

// ── Animation (curfew sweep, matches books.js) ──
function _evCurfewYToYear(cursorY,canvas){
  const rows=[].slice.call(canvas.querySelectorAll('.ev-row'));
  for(let i=rows.length-1;i>=0;i--){
    const t=parseFloat(rows[i].style.top)||0;
    if(cursorY>=t){ const yr=rows[i].getAttribute('data-year'); if(yr!=='') return parseInt(yr,10); }
  }
  return null;
}
function _evSvgBottomY(el){
  const tag=el.tagName.toLowerCase();
  if(tag==='path'){ const b=el.getBBox(); return b.y+b.height; }
  if(tag==='line'){ const y1=parseFloat(el.getAttribute('y1')),y2=parseFloat(el.getAttribute('y2')); return Math.max(y1||0,y2||0); }
  if(tag==='circle') return parseFloat(el.getAttribute('cy'))||0;
  if(tag==='g'){ const gb=el.getBBox(); return gb.y+gb.height; }
  return null;
}
function _evAnimPlay(){
  const canvas=document.getElementById('ev-canvas');
  const scroll=document.getElementById('ev-scroll');
  if(!canvas||!scroll) return;
  let cursor=document.getElementById('ev-curfew');
  if(!cursor){
    cursor=document.createElement('div'); cursor.id='ev-curfew'; cursor.className='ev-curfew-line';
    cursor.innerHTML='<span id="ev-curfew-year" class="ev-curfew-year"></span>';
    cursor.style.display='none'; canvas.appendChild(cursor);
  }
  if(_EV_ANIM.mode==='paused'){
    _EV_ANIM.mode='playing'; cursor.style.display='';
    _EV_ANIM.timer=setInterval(_EV_ANIM.tick,_EV_ANIM.speedMs); return;
  }
  _EV_ANIM.mode='playing';
  _EV_ANIM.cursorY=_EV_TOP_PAD;
  _EV_ANIM.speedMs=_EV_ANIM_CTL?_EV_ANIM_CTL.getSpeedMs():1200;
  canvas.querySelectorAll('.ev-row,.ev-year-chip,.ev-era-band,.ev-era-label,.ev-leaf-label').forEach(el=>el.classList.add('ev-hidden-by-curfew'));
  canvas.querySelectorAll('svg').forEach(sv=>{
    [].slice.call(sv.children).forEach(ch=>{
      if(ch.tagName==='defs') return;
      const orig=ch.getAttribute('opacity');
      if(orig&&orig!=='0') ch.setAttribute('data-orig-opacity',orig);
      ch.setAttribute('opacity','0');
    });
  });
  cursor.style.display=''; cursor.style.top=_EV_ANIM.cursorY+'px';
  _EV_ANIM.maxY=parseFloat(canvas.style.height)||2000;
  const STEP=4;
  _EV_ANIM.tick=function(){
    if(_EV_ANIM.mode!=='playing') return;
    _EV_ANIM.cursorY+=STEP;
    if(_EV_ANIM.cursorY>_EV_ANIM.maxY){ _evAnimStop(); return; }
    cursor.style.top=_EV_ANIM.cursorY+'px';
    canvas.querySelectorAll('.ev-hidden-by-curfew').forEach(el=>{
      const t=parseFloat(el.style.top);
      if(!isNaN(t)&&t<=_EV_ANIM.cursorY) el.classList.remove('ev-hidden-by-curfew');
    });
    canvas.querySelectorAll('svg').forEach(sv=>{
      [].slice.call(sv.children).forEach(ch=>{
        if(ch.getAttribute('opacity')!=='0') return;
        const bot=_evSvgBottomY(ch);
        if(bot!==null&&bot<=_EV_ANIM.cursorY){
          const orig=ch.getAttribute('data-orig-opacity');
          if(orig) ch.setAttribute('opacity',orig); else ch.removeAttribute('opacity');
        }
      });
    });
    const yr=_evCurfewYToYear(_EV_ANIM.cursorY,canvas);
    const yrEl=document.getElementById('ev-curfew-year');
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
  const canvas=document.getElementById('ev-canvas');
  if(canvas){
    canvas.querySelectorAll('.ev-hidden-by-curfew').forEach(el=>el.classList.remove('ev-hidden-by-curfew'));
    canvas.querySelectorAll('svg').forEach(sv=>{
      [].slice.call(sv.children).forEach(ch=>{
        if(ch.getAttribute('opacity')==='0'){
          const orig=ch.getAttribute('data-orig-opacity');
          if(orig) ch.setAttribute('opacity',orig); else ch.removeAttribute('opacity');
        }
      });
    });
  }
  const cursor=document.getElementById('ev-curfew'); if(cursor) cursor.style.display='none';
  if(_EV_ANIM_CTL) _EV_ANIM_CTL.forceStop();
}

function initEras(){
  _evInjectStyles();
  const view=document.getElementById('eras-view'); if(!view) return;
  view.style.flexDirection='column';

  let html='';
  html+='<div id="ev-toolbar">';
  html+='<div class="ev-dd-wrap"><button class="ev-dd-btn" id="ev-type-btn">\u2014 SELECT A TYPE \u2014  <span style="opacity:.6">\u25BE</span></button>';
  html+='<div class="ev-dd-panel" id="ev-type-panel"><input class="ev-dd-search" id="ev-type-search" placeholder="search types\u2026"><div class="ev-dd-scroll" id="ev-type-scroll"></div></div></div>';
  html+='<div class="ev-dd-wrap"><button class="ev-dd-btn" id="ev-trad-btn">\u2014 SELECT A TRADITION \u2014  <span style="opacity:.6">\u25BE</span></button>';
  html+='<div class="ev-dd-panel" id="ev-trad-panel"><input class="ev-dd-search" id="ev-trad-search" placeholder="search traditions\u2026"><div class="ev-dd-scroll" id="ev-trad-scroll"></div></div></div>';
  html+='<button class="ev-clear-all" id="ev-clear-all" title="Clear all filters">\u00D7</button>';
  html+='<div id="ev-anim-mount"></div>';
  html+='</div>';
  html+='<div id="ev-scroll"><div id="ev-canvas"></div></div>';
  view.innerHTML=html;

  _evBuildTypePanel(); _evBuildTradPanel(); _evBuildCanvas();

  const pairs=[
    {btn:'ev-type-btn',panel:'ev-type-panel',search:'ev-type-search',build:_evBuildTypePanel},
    {btn:'ev-trad-btn',panel:'ev-trad-panel',search:'ev-trad-search',build:_evBuildTradPanel}
  ];
  pairs.forEach(dd=>{
    const btn=document.getElementById(dd.btn),panel=document.getElementById(dd.panel);
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      pairs.forEach(o=>{ if(o.panel!==dd.panel) document.getElementById(o.panel).classList.remove('open'); });
      panel.classList.toggle('open');
      if(panel.classList.contains('open')){ const s=document.getElementById(dd.search); if(s) s.focus(); }
    });
    document.getElementById(dd.search).addEventListener('input',dd.build);
  });
  document.addEventListener('click',function(e){
    pairs.forEach(dd=>{
      const p=document.getElementById(dd.panel),b=document.getElementById(dd.btn);
      if(p&&!p.contains(e.target)&&e.target!==b&&!b.contains(e.target)) p.classList.remove('open');
    });
  });
  document.getElementById('ev-clear-all').addEventListener('click',function(e){
    e.stopPropagation();
    _EV_FILTER.types.clear(); _EV_FILTER.trads.clear(); _EV_FILTER.search='';
    _evSyncBtnLabel('ev-type-btn',_EV_FILTER.types,'\u2014 SELECT A TYPE \u2014','types');
    _evSyncBtnLabel('ev-trad-btn',_EV_FILTER.trads,'\u2014 SELECT A TRADITION \u2014','traditions');
    _evBuildTypePanel(); _evBuildTradPanel(); _evBuildCanvas(); _evAnimStop();
  });

  const mount=document.getElementById('ev-anim-mount');
  if(mount && window.AnimControls){
    _EV_ANIM_CTL=window.AnimControls.create({
      mountEl:mount, idPrefix:'ev', initialSpeed:'1x',
      onPlay:_evAnimPlay, onPause:_evAnimPause, onStop:_evAnimStop,
      onSpeedChange:function(ms){ _EV_ANIM.speedMs=ms; }
    });
  }

  _EV_INITED=true;
}

(function(){
  const _origOnSearch=window.onSearch;
  window.onSearch=function(){
    if(typeof VIEW!=='undefined' && VIEW==='eras'){
      const box=document.getElementById('search');
      _EV_FILTER.search=box?box.value:'';
      _evBuildCanvas(); _evAnimStop(); return;
    }
    if(typeof _origOnSearch==='function') _origOnSearch();
  };
})();

(function(){
  if(typeof window.setView!=='function') return;
  const _origSetView=window.setView;
  window.setView=function(v){
    _origSetView(v);
    const ev=document.getElementById('eras-view'); if(!ev) return;
    if(v==='eras'){ ev.style.display='flex'; ev.style.flexDirection='column'; if(!_EV_INITED) initEras(); }
    else { _evAnimStop(); }
  };
})();

window.initEras=initEras;
window._erasAnimStop=_evAnimStop;
window.toggleErasAnimate=function(){};

window._captureState_eras=function(){
  const s=document.getElementById('ev-scroll');
  return { types:Array.from(_EV_FILTER.types), trads:Array.from(_EV_FILTER.trads), search:_EV_FILTER.search, scrollY:s?s.scrollTop:0 };
};
window._restoreState_eras=function(s){
  if(!s) return;
  _EV_FILTER.types=new Set(s.types||[]); _EV_FILTER.trads=new Set(s.trads||[]); _EV_FILTER.search=s.search||'';
  _evSyncBtnLabel('ev-type-btn',_EV_FILTER.types,'\u2014 SELECT A TYPE \u2014','types');
  _evSyncBtnLabel('ev-trad-btn',_EV_FILTER.trads,'\u2014 SELECT A TRADITION \u2014','traditions');
  _evBuildTypePanel(); _evBuildTradPanel(); _evBuildCanvas();
  if(s.scrollY){ const sc=document.getElementById('ev-scroll'); if(sc) sc.scrollTop=s.scrollY; }
};

})();
