// ═══════════════════════════════════════════════════════════
// BOOKS VIEW — Phase 3 final (unified canvas)
// ═══════════════════════════════════════════════════════════
const _BV_ROW_H = 52;
const _BV_TOP_PAD = 40;
const _BV_BOT_PAD = 80;
const _BV_LEFT_W = 540;
const _BV_STEM_X = 600;

let _BOOKS_DATA = null;
let _booksInited = false;
let _booksFilter = { source:new Set(), theme:new Set(), author:new Set(), search:'' };
let _booksAnim = { playing:false, timer:null };

const _BV_TYPE_COLORS = {
  'Prophet':'#D4AF37','Founder':'#b8860b','Sahaba':'#e74c3c','Sahabiyya':'#ff6b6b',
  "Tabi'un":'#e67e22','Scholar':'#3498db','Mystic':'#2ECC71','Ruler':'#9b59b6',
  'Poet':'#e91e90','Philosopher':'#1abc9c','Scientist':'#00bcd4','Historian':'#8d6e63',
  'Reformer':'#ff9800','Jurist':'#5c6bc0','Caliph':'#ab47bc','Warrior':'#ef5350'
};
const _BV_TRAD_COLORS = {
  'Hadith Sciences':'#4fc3f7','Early Ascetics':'#66bb6a',
  'Islamic Jurisprudence':'#7986cb','Islamic Philosophy':'#4db6ac','Islamic Sciences':'#4dd0e1',
  'Islamic Theology':'#9575cd','Islamic Literature':'#f06292','Persian Poetry':'#ce93d8',
  'Khorasan School':'#a1887f','Baghdad School':'#90a4ae','Naqshbandiyya':'#7e57c2',
  'Shadhiliyya':'#26a69a','Qadiriyya':'#42a5f5','Chishti':'#ffa726','Suhrawardiyya':'#d4e157',
  'Mawlawiyya':'#ec407a','Qalandari':'#8d6e63','Yeseviyya':'#78909c','Kubrawiyya':'#5c6bc0',
  'Akbarian':'#ab47bc','Ishraqiyya':'#ffca28','Mughal':'#ef6c00','Genealogy':'#D4AF37'
};

const _BV_ERA_BANDS = [
  {name:'Prophetic Era',     start:-4000, end:632,  dates:'Before 632 CE', glow:'210,170,50'},
  {name:'Rashidun',          start:632,   end:661,  dates:'632\u2013661 CE', glow:'60,160,90'},
  {name:'Umayyad',           start:661,   end:750,  dates:'661\u2013750 CE', glow:'50,180,180'},
  {name:'Abbasid Golden Age',start:750,   end:1258, dates:'750\u20131258 CE', glow:'70,130,210'},
  {name:'Post-Mongol',       start:1258,  end:1500, dates:'1258\u20131500 CE', glow:'180,60,60'},
  {name:'Gunpowder Empires', start:1500,  end:1800, dates:'1500\u20131800 CE', glow:'50,140,90'},
  {name:'Colonial & Reform', start:1800,  end:1950, dates:'1800\u20131950 CE', glow:'200,150,60'},
  {name:'Contemporary',      start:1950,  end:2025, dates:'1950\u2013Present', glow:'80,160,200'}
];

function _booksYearToY(yr, books, rowMap){
  const withYear = books.filter(b=>b.year!=null);
  if(!withYear.length) return _BV_TOP_PAD;
  const first = withYear[0], last = withYear[withYear.length-1];
  if(yr <= first.year) return rowMap[first.id].midY;
  if(yr >= last.year) return rowMap[last.id].midY;
  for(let i=1; i<withYear.length; i++){
    if(withYear[i].year >= yr){
      const prev = withYear[i-1];
      const curr = withYear[i];
      if(curr.year===prev.year) return rowMap[curr.id].midY;
      const ratio = (yr - prev.year) / (curr.year - prev.year);
      return rowMap[prev.id].midY + ratio*(rowMap[curr.id].midY - rowMap[prev.id].midY);
    }
  }
  return rowMap[last.id].midY;
}

async function _loadBooksData(){
  if(_BOOKS_DATA) return _BOOKS_DATA;
  try{
    const res = await fetch('data/islamic/books.json?v='+Date.now());
    _BOOKS_DATA = await res.json();
    return _BOOKS_DATA;
  }catch(e){
    console.error('books.json load failed',e);
    _BOOKS_DATA = {topline:{total:0,free:0},books:[]};
    return _BOOKS_DATA;
  }
}

function _booksEscape(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function _booksFmtYear(y){
  if(y==null||y==='') return '—';
  const n = typeof y==='number' ? y : parseInt(y,10);
  if(isNaN(n)) return '—';
  if(n<0) return Math.abs(n)+' BCE';
  return n+' CE';
}

function _booksInjectStyles(){
  const old=document.getElementById('booksViewStyles');
  if(old) old.remove();
  const css = `
  #books-view{flex:1;display:none;overflow:hidden;background:var(--bg0,#0E1621);flex-direction:column}
  #bv-toolbar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border2,#2D3748);background:var(--bg0,#0E1621);flex-wrap:wrap}
  #bv-anim-wrap{margin-left:auto;display:flex;align-items:center;gap:8px}
  #bv-anim-year{font-family:'Cinzel',serif;font-size:11px;color:var(--gold,#D4AF37);letter-spacing:.05em;min-width:80px;text-align:center;opacity:0;transition:opacity .3s}
  #bv-anim-year.live{opacity:1}
  #bv-anim-speed{background:#1a2330;border:1px solid var(--border2,#2D3748);color:var(--text1,#E4E4E7);font-family:'Source Sans 3',sans-serif;font-size:11px;padding:6px 8px;border-radius:2px;cursor:pointer}
  #bv-anim-btn{background:none;border:1px solid var(--gold,#D4AF37);color:var(--gold,#D4AF37);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.1em;padding:7px 14px;cursor:pointer;border-radius:2px}
  #bv-anim-btn:hover{background:rgba(212,175,55,.1)}
  .bv-clear-all.active{opacity:1;border-color:rgba(212,175,55,.6)}
  #bv-scroll{flex:1;overflow-y:auto;overflow-x:hidden;position:relative}
  #bv-canvas{position:relative;width:100%;min-width:1200px}
  #bv-empty{padding:60px;text-align:center;color:var(--muted,#6B7B8C);font-family:'Cinzel',serif;font-size:12px;letter-spacing:.1em}
  #bv-stem{position:absolute;left:${_BV_STEM_X - 2}px;width:5px;background:var(--gold,#D4AF37);box-shadow:0 0 18px rgba(212,175,55,.55);pointer-events:none;z-index:1}
  .bv-row{position:absolute;left:0;width:${_BV_LEFT_W}px;padding:8px 20px 8px 20px;cursor:pointer;transition:background .12s;display:flex;flex-direction:column;justify-content:center;box-sizing:border-box;z-index:4}
  .bv-row:hover{background:rgba(212,175,55,.06)}
  .bv-row.hi{background:rgba(212,175,55,.16);box-shadow:inset 3px 0 0 var(--gold,#D4AF37)}
  .bv-row-main{text-align:right}
  .bv-row-title{font-family:'Crimson Pro','Lato',serif;font-size:14px;color:var(--text1,#E4E4E7);line-height:1.28;margin-bottom:2px}
  .bv-row-meta{font-family:'Source Sans 3',sans-serif;font-size:11px;color:var(--muted,#6B7B8C);letter-spacing:.02em}
  .bv-read-btn{display:inline-block;margin-left:6px;padding:2px 8px;background:rgba(56,189,248,.14);border:1px solid #38bdf8;border-radius:2px;font-size:9px;color:#38bdf8;letter-spacing:.08em;text-decoration:none;font-family:'Cinzel',serif;font-weight:600;vertical-align:middle}
  .bv-read-btn:hover{background:rgba(56,189,248,.3);color:#fff}
  .bv-study-badge{display:inline-block;margin-left:6px;padding:1px 6px;border:1px solid rgba(212,175,55,.5);border-radius:2px;font-size:9px;color:var(--gold,#D4AF37);letter-spacing:.08em;font-family:'Cinzel',serif;vertical-align:middle}
  .bv-year-chip{position:absolute;transform:translateY(-50%);width:72px;text-align:center;font-family:'Cinzel',serif;font-size:10px;color:var(--gold,#D4AF37);background:var(--bg0,#0E1621);border:1px solid rgba(212,175,55,.5);border-radius:2px;padding:3px 4px;letter-spacing:.04em;z-index:5;white-space:nowrap;box-shadow:0 0 6px rgba(14,22,33,.9);pointer-events:none}
  .bv-year-chip.scripture{border-color:var(--gold,#D4AF37);background:#1a1610}
  .bv-row.is-scripture .bv-row-title{color:var(--gold,#D4AF37);font-weight:600;letter-spacing:.01em}
  .bv-row.is-scripture .bv-row-meta{color:rgba(212,175,55,.62);font-style:italic}
  svg.bv-leaves{position:absolute;top:0;left:0;width:100%;z-index:2;overflow:visible}
  svg.bv-leaves g.bv-leaf{cursor:pointer;pointer-events:all}
  .bv-leaf-label{position:absolute;font-family:'Cinzel',serif;font-size:9px;letter-spacing:.06em;pointer-events:none;white-space:nowrap;text-transform:uppercase;text-shadow:0 0 4px #000;z-index:3}
  .bv-pinned-scripture{padding:8px 16px 7px;border-bottom:1px solid rgba(212,175,55,.4);margin-bottom:4px}
  `;
  const s=document.createElement('style');
  s.id='booksViewStyles';
  s.textContent=css;
  document.head.appendChild(s);
}

function _booksCollectSources(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {};
  books.forEach(b=>{ (b.topics||[]).forEach(t=>{ if(t) counts[t]=(counts[t]||0)+1; }); });
  return Object.keys(counts).sort().map(k=>({name:k, count:counts[k]}));
}

function _booksCollectThemes(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {};
  books.forEach(b=>{ (b.themes||[]).forEach(t=>{ if(t) counts[t]=(counts[t]||0)+1; }); });
  return Object.keys(counts).sort().map(k=>({name:k, count:counts[k]}));
}

function _booksCollectAuthors(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {};
  books.forEach(b=>{ if(b.author_name && !b.author_hidden) counts[b.author_name]=(counts[b.author_name]||0)+1; });
  return Object.keys(counts).sort().map(k=>({name:k, count:counts[k]}));
}

function _booksFiltered(){
  const all = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const q = (_booksFilter.search||'').toLowerCase().trim();
  const src = _booksFilter.source;
  const thm = _booksFilter.theme;
  const aut = _booksFilter.author;
  let out = all.filter(b=>{
    if(src.size){
      let srcMatch = false;
      if(src.has('__scripture__') && (b.is_scripture===true || (b.tags||[]).includes('scripture'))) srcMatch = true;
      if(!srcMatch){ for(const s of src){ if(s!=='__scripture__' && (b.topics||[]).includes(s)){ srcMatch=true; break; } } }
      if(!srcMatch) return false;
    }
    if(thm.size){
      let thmMatch = false;
      for(const t of thm){ if((b.themes||[]).includes(t)){ thmMatch=true; break; } }
      if(!thmMatch) return false;
    }
    if(aut.size && !aut.has(b.author_name)) return false;
    if(q){
      const hay = ((b.title||'')+' '+(b.author_name||'')+' '+(b.revealed_to||'')+' '+((b.topics||[]).join(' '))+' '+((b.themes||[]).join(' '))).toLowerCase();
      if(hay.indexOf(q)===-1) return false;
    }
    return true;
  });
  out.sort((a,b)=>{
    const ay=a.year==null?99999:a.year;
    const by=b.year==null?99999:b.year;
    return ay-by;
  });
  return out;
}

function _booksBuildCanvas(){
  _booksSyncClearBtn();
  const canvas = document.getElementById('bv-canvas');
  if(!canvas) return;
  const books = _booksFiltered();
  if(!books.length){
    canvas.style.height='200px';
    canvas.innerHTML='<div id="bv-empty">NO BOOKS MATCH YOUR FILTERS</div>';
    return;
  }
  const totalH = _BV_TOP_PAD + books.length * _BV_ROW_H + _BV_BOT_PAD;
  canvas.style.height = totalH + 'px';

  const rowMap = {};
  let html = '';
  html += '<div id="bv-stem" style="top:'+(_BV_TOP_PAD-10)+'px;height:'+(totalH - _BV_TOP_PAD - _BV_BOT_PAD + 20)+'px"></div>';

  books.forEach((b, idx)=>{
    const y = _BV_TOP_PAD + idx * _BV_ROW_H;
    const midY = y + _BV_ROW_H/2;
    rowMap[b.id] = { y:y, midY:midY, book:b };

    const isScripture = b.is_scripture===true;
    let metaTxt='';
    if(isScripture && b.revealed_to) metaTxt='revealed to '+_booksEscape(b.revealed_to);
    else if(!b.author_hidden) metaTxt=_booksEscape(b.author_name||'');
    let badgeHtml='';
    if(b.is_free && b.url) badgeHtml+='<a class="bv-read-btn" href="'+_booksEscape(b.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">READ</a>';
    if(b.has_study) badgeHtml+='<span class="bv-study-badge">STUDY</span>';
    const meta = metaTxt+badgeHtml;
    const nameAttr=_booksEscape(b.author_name||'');
    const idAttr=_booksEscape(b.id||'');
    const yearTxt=_booksFmtYear(b.year);

    html += '<div class="bv-row'+(isScripture?' is-scripture':'')+'" data-id="'+idAttr+'" data-name="'+nameAttr+'" data-year="'+(b.year==null?'':b.year)+'" style="top:'+y+'px;height:'+_BV_ROW_H+'px">';
    html += '<div class="bv-row-main"><div class="bv-row-title">'+_booksEscape(b.title)+'</div>';
    if(meta) html += '<div class="bv-row-meta">'+meta+'</div>';
    html += '</div></div>';

    html += '<div class="bv-year-chip'+(isScripture?' scripture':'')+'" style="top:'+midY+'px;left:'+(_BV_STEM_X-36)+'px">'+yearTxt+'</div>';
  });

  canvas.innerHTML = html;

  canvas.querySelectorAll('.bv-row').forEach(row=>{
    row.addEventListener('click',function(e){
      if(e.target.closest('.bv-read-btn')) return;
      const name=row.getAttribute('data-name');
      if(!name) return;
      setView('timeline');
      setTimeout(()=>{if(typeof jumpTo==='function') jumpTo(name);},50);
    });
  });

  _booksRenderErasStyle(books, rowMap, totalH);
}

function _bvGetTradColor(b){
  var trad = b.author_tradition || '';
  var type = b.author_type || '';
  if(trad && typeof TRAD_COLORS !== 'undefined' && TRAD_COLORS[trad]) return TRAD_COLORS[trad];
  if(trad && _BV_TRAD_COLORS[trad]) return _BV_TRAD_COLORS[trad];
  if(type && _BV_TYPE_COLORS[type]) return _BV_TYPE_COLORS[type];
  if(b.is_scripture) return '#D4AF37';
  return 'rgba(212,175,55,0.4)';
}

// ── ERAS-style canvas renderer for BOOKS ──
// Uses the exact same leaf path formula, stroke style, label positioning as eras.js
function _booksRenderErasStyle(books, rowMap, totalH){
  var canvas = document.getElementById('bv-canvas');
  if(!canvas) return;
  var NS = 'http://www.w3.org/2000/svg';

  // ── Group books into tradition leaves (same as ERAS groups figures) ──
  var byTag = {};
  books.forEach(function(b){
    if(b.author_tradition){
      var k = b.author_tradition;
      if(!byTag[k]) byTag[k] = {key:k, field:'trad', books:[], color:_bvGetTradColor(b)};
      byTag[k].books.push(b);
    }
    if(b.author_type){
      var k2 = b.author_type;
      if(!byTag[k2]) byTag[k2] = {key:k2, field:'type', books:[], color:_bvGetTradColor(b)};
      byTag[k2].books.push(b);
    }
  });
  var leaves = Object.values(byTag).filter(function(t){ return t.books.length > 0; });
  leaves.forEach(function(t){
    var ys = t.books.map(function(b){ return rowMap[b.id].midY; });
    t.y1 = Math.min.apply(null, ys);
    t.y2 = Math.max.apply(null, ys);
    t.count = t.books.length;
  });
  leaves.sort(function(a,b){ return a.y1 - b.y1; });
  var maxCount = Math.max.apply(null, leaves.map(function(l){ return l.count; }));

  // ── Era bands (same as eras.js) ──
  _BV_ERA_BANDS.forEach(function(era){
    var y1e = _booksYearToY(era.start, books, rowMap);
    var y2e = _booksYearToY(era.end, books, rowMap);
    if(y2e - y1e < 6) return;
    var gDiv = document.createElement('div');
    gDiv.style.cssText = 'position:absolute;top:'+y1e+'px;height:'+(y2e-y1e)+'px;left:'+(_BV_STEM_X+18)+'px;right:0;background:linear-gradient(to left, rgba('+era.glow+',0.10) 0%, rgba('+era.glow+',0.04) 50%, transparent 85%);pointer-events:none;z-index:1';
    canvas.appendChild(gDiv);
    var label = document.createElement('div');
    label.style.cssText = 'position:absolute;top:'+(y1e+12)+'px;right:24px;font-family:\'Cinzel\',serif;text-align:right;pointer-events:none;z-index:1';
    label.innerHTML = '<div style="font-size:11px;letter-spacing:.14em;color:rgba('+era.glow+',0.85);text-transform:uppercase;font-weight:700">'+era.name+'</div>'
      + '<div style="font-size:9px;opacity:.6;margin-top:2px;font-weight:400;color:rgba('+era.glow+',0.7)">'+era.dates+'</div>';
    canvas.appendChild(label);
  });

  // ── Stem (vertical line at _BV_STEM_X — same role as eras-stem) ──
  // Already rendered in HTML as #bv-stem

  // ── SVG leaves — EXACT SAME formula as eras.js lines 262-293 ──
  var svg = document.createElementNS(NS, 'svg');
  svg.style.cssText = 'position:absolute;top:0;left:'+_BV_STEM_X+'px;overflow:visible;pointer-events:none;z-index:2';
  var rightW = Math.max(400, (canvas.clientWidth||1400) - _BV_STEM_X - 80);
  svg.setAttribute('width', rightW);
  svg.setAttribute('height', totalH);

  var maxLeafW = rightW * 0.6;
  var MIN_LEAF_W = 30;
  var totalLeaves = leaves.length;

  leaves.forEach(function(ld, idx){
    var y1 = ld.y1;
    var y2 = ld.y2;
    if(y2 - y1 < 10) y2 = y1 + 10;
    var leafW = Math.max(MIN_LEAF_W, (ld.count / maxCount) * maxLeafW);
    var xOffset = 15 + (idx / totalLeaves) * (rightW * 0.30);
    var midY = (y1 + y2) / 2;
    var peakX = xOffset + leafW;
    var stemX = 1;

    // Exact ERAS path formula
    var cp1y = y1 + (midY - y1) * 0.3;
    var cp2y = y1 + (midY - y1) * 0.7;
    var cp3y = midY + (y2 - midY) * 0.3;
    var cp4y = midY + (y2 - midY) * 0.7;
    var d = 'M ' + stemX + ' ' + y1.toFixed(1) +
            ' C ' + (stemX + leafW * 0.1).toFixed(1) + ' ' + cp1y.toFixed(1) +
            ', ' + peakX.toFixed(1) + ' ' + cp2y.toFixed(1) +
            ', ' + peakX.toFixed(1) + ' ' + midY.toFixed(1) +
            ' C ' + peakX.toFixed(1) + ' ' + cp3y.toFixed(1) +
            ', ' + (stemX + leafW * 0.1).toFixed(1) + ' ' + cp4y.toFixed(1) +
            ', ' + stemX + ' ' + y2.toFixed(1) + ' Z';

    var g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'bv-leaf');
    g.setAttribute('data-tag', ld.key);
    g.style.cursor = 'pointer';
    g.style.pointerEvents = 'auto';

    // Exact ERAS stroke style
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('fill-opacity', '0');
    path.setAttribute('stroke', ld.color);
    path.setAttribute('stroke-opacity', '0.5');
    path.setAttribute('stroke-width', '2.5');
    g.appendChild(path);

    // Dots at y1 and y2 (exact ERAS style — r=2)
    var dot1 = document.createElementNS(NS, 'circle');
    dot1.setAttribute('cx', stemX); dot1.setAttribute('cy', y1);
    dot1.setAttribute('r', 2); dot1.setAttribute('fill', ld.color);
    dot1.style.pointerEvents = 'none';
    g.appendChild(dot1);
    var dot2 = document.createElementNS(NS, 'circle');
    dot2.setAttribute('cx', stemX); dot2.setAttribute('cy', y2);
    dot2.setAttribute('r', 2); dot2.setAttribute('fill', ld.color);
    dot2.style.pointerEvents = 'none';
    g.appendChild(dot2);
    svg.appendChild(g);

    // Label outside leaf — exact ERAS positioning (peakX + 6, midY)
    var labelLeft = Math.max(peakX + 6, MIN_LEAF_W + xOffset + 6);
    var extLabel = document.createElement('div');
    extLabel.className = 'bv-leaf-label';
    extLabel.setAttribute('data-tag', ld.key);
    extLabel.style.cssText = 'position:absolute;top:'+midY+'px;left:'+(_BV_STEM_X + labelLeft)+'px;transform:translateY(-50%);white-space:nowrap;pointer-events:auto;cursor:pointer;font-family:\'Cinzel\',serif;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:'+ld.color+';text-shadow:0 0 4px #000';
    extLabel.textContent = ld.key + ' (' + ld.count + ')';
    canvas.appendChild(extLabel);

    // Click → filter by this source
    var clickHandler = function(e){
      e.stopPropagation();
      _booksFilter.source.clear(); _booksFilter.source.add(ld.key);
      _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'\u2014 SELECT A SOURCE \u2014','sources');
      _booksBuildCanvas(); _booksAnimStop();
    };
    g.addEventListener('click', clickHandler);
    extLabel.addEventListener('click', clickHandler);

    // Hover — exact ERAS behavior
    g.addEventListener('mouseenter', function(){
      if(_booksFilter.source.size) return;
      path.setAttribute('stroke-opacity', '0.9');
    });
    g.addEventListener('mouseleave', function(){
      if(_booksFilter.source.size) return;
      path.setAttribute('stroke-opacity', '0.5');
    });
  });

  canvas.appendChild(svg);
}

// ── Multi-select checkbox helpers ──
function _bvCk(on){ return '<span class="bv-ck'+(on?' on':'')+'"></span>'; }

function _bvSyncBtnLabel(btnId, filterSet, defaultLabel, singularNoun){
  const btn=document.getElementById(btnId);
  if(!btn) return;
  const n=filterSet.size;
  let txt=defaultLabel;
  if(n===1) txt=[...filterSet][0];
  else if(n>1) txt=n+' '+singularNoun+' selected';
  btn.innerHTML=_booksEscape(txt)+'  <span style="opacity:.6">\u25BE</span>';
}

function _bvBuildPanel(scrollId, searchId, filterSet, items, pinnedRow, onchange){
  const scroll=document.getElementById(scrollId);
  if(!scroll) return;
  const si=document.getElementById(searchId);
  const q=(si&&si.value||'').toLowerCase().trim();
  const n=filterSet.size;
  const toggleLabel=n>0?'Deselect all':'Select all';
  let html='<div style="display:flex;justify-content:flex-end;padding:2px 14px 4px"><span class="bv-dd-toggle-all" style="font-family:\'Cinzel\',serif;font-size:10px;color:var(--gold,#D4AF37);cursor:pointer;letter-spacing:.06em">'+toggleLabel+'</span></div>';
  if(pinnedRow){
    const on=filterSet.has(pinnedRow.value);
    html+='<div class="bv-ck-row bv-pinned-scripture'+(on?' checked':'')+'" data-val="'+_booksEscape(pinnedRow.value)+'">'+_bvCk(on)+'<span class="bv-ck-label" style="color:var(--gold,#D4AF37);font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:.08em">'+_booksEscape(pinnedRow.label)+'</span></div>';
  }
  const filtered=items.filter(t=>!q||t.name.toLowerCase().indexOf(q)>-1);
  filtered.forEach(t=>{
    const on=filterSet.has(t.name);
    html+='<div class="bv-ck-row'+(on?' checked':'')+'" data-val="'+_booksEscape(t.name)+'">'+_bvCk(on)+'<span class="bv-ck-label">'+_booksEscape(t.name)+'</span><span class="bv-ck-count">('+t.count+')</span></div>';
  });
  scroll.innerHTML=html;
  scroll.querySelectorAll('.bv-ck-row').forEach(el=>{
    el.addEventListener('click',function(){
      const v=this.getAttribute('data-val');
      if(filterSet.has(v)) filterSet.delete(v); else filterSet.add(v);
      onchange();
    });
  });
  scroll.querySelectorAll('.bv-dd-toggle-all').forEach(el=>{
    el.addEventListener('click',function(){
      if(filterSet.size>0){ filterSet.clear(); }
      else {
        if(pinnedRow) filterSet.add(pinnedRow.value);
        items.forEach(t=>filterSet.add(t.name));
      }
      onchange();
    });
  });
}

function _booksBuildSourcePanel(){
  _bvBuildPanel('bv-source-scroll','bv-source-search',_booksFilter.source,_booksCollectSources(),
    {value:'__scripture__',label:'Scripture'},
    function(){ _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'\u2014 SELECT A SOURCE \u2014','sources'); _booksBuildSourcePanel(); _booksBuildCanvas(); _booksAnimStop(); });
}
function _booksBuildThemePanel(){
  _bvBuildPanel('bv-theme-scroll','bv-theme-search',_booksFilter.theme,_booksCollectThemes(),
    null,
    function(){ _bvSyncBtnLabel('bv-theme-btn',_booksFilter.theme,'\u2014 SELECT A THEME \u2014','themes'); _booksBuildThemePanel(); _booksBuildCanvas(); _booksAnimStop(); });
}
function _booksBuildAuthorPanel(){
  _bvBuildPanel('bv-author-scroll','bv-author-search',_booksFilter.author,_booksCollectAuthors(),
    null,
    function(){ _bvSyncBtnLabel('bv-author-btn',_booksFilter.author,'\u2014 SELECT AN AUTHOR \u2014','authors'); _booksBuildAuthorPanel(); _booksBuildCanvas(); _booksAnimStop(); });
}

function _booksSyncClearBtn(){
  const btn=document.getElementById('bv-clear-all');
  if(!btn) return;
  const hasFilter=_booksFilter.source.size||_booksFilter.theme.size||_booksFilter.author.size||_booksFilter.search;
  btn.classList.toggle('active',!!hasFilter);
}

function _booksAnimStop(){
  _booksAnim.playing=false;
  if(_booksAnim.timer){clearInterval(_booksAnim.timer);_booksAnim.timer=null;}
  const b=document.getElementById('bv-anim-btn');
  if(b) b.textContent='▶ ANIMATE';
  const y=document.getElementById('bv-anim-year');
  if(y) y.classList.remove('live');
  document.querySelectorAll('.bv-row.hi').forEach(r=>r.classList.remove('hi'));
}
function _booksAnimStart(){
  const canvas = document.getElementById('bv-canvas');
  const scroll = document.getElementById('bv-scroll');
  if(!canvas || !scroll) return;
  const rows = [...canvas.querySelectorAll('.bv-row')].filter(r=>r.getAttribute('data-year')!=='');
  if(!rows.length) return;
  _booksAnim.playing=true;
  let idx=0;
  const speed = parseInt((document.getElementById('bv-anim-speed')||{}).value||'1200',10);
  const btn = document.getElementById('bv-anim-btn');
  if(btn) btn.textContent='⏸ PAUSE';
  const yEl = document.getElementById('bv-anim-year');
  if(yEl) yEl.classList.add('live');
  const tick=()=>{
    rows.forEach(r=>r.classList.remove('hi'));
    const row = rows[idx];
    if(!row){_booksAnimStop();return;}
    row.classList.add('hi');
    const rowTop = parseFloat(row.style.top) || 0;
    scroll.scrollTo({top: rowTop - scroll.clientHeight/3, behavior:'smooth'});
    const yr=row.getAttribute('data-year');
    if(yEl) yEl.textContent=_booksFmtYear(yr===''?null:parseInt(yr,10));
    idx++;
    if(idx>=rows.length){setTimeout(_booksAnimStop,speed);}
  };
  tick();
  _booksAnim.timer=setInterval(tick,speed);
}
function _booksAnimToggle(){ if(_booksAnim.playing) _booksAnimStop(); else _booksAnimStart(); }

function _booksUpdateTopbar(){
  const line1=document.getElementById('hdrStatsLine1');
  if(!line1) return;
  if(typeof VIEW!=='undefined' && VIEW==='books' && _BOOKS_DATA && _BOOKS_DATA.topline){
    if(!line1.dataset.origHtml) line1.dataset.origHtml=line1.innerHTML;
    const t=_BOOKS_DATA.topline;
    line1.innerHTML='<span style="color:var(--gold,#D4AF37);font-weight:600">'+t.total+' Books listed</span> &middot; '+t.free+' free reads &middot; click READ to open &middot; click title for author';
  } else if(line1.dataset.origHtml){
    line1.innerHTML=line1.dataset.origHtml;
    delete line1.dataset.origHtml;
  }
}

function _booksUpdateSearchBox(active){
  const box=document.getElementById('search');
  if(!box) return;
  if(active){
    if(!box.dataset.origPh) box.dataset.origPh=box.getAttribute('placeholder')||'';
    box.setAttribute('placeholder','Search books…');
    box.value=_booksFilter.search||'';
  } else {
    if(box.dataset.origPh){
      box.setAttribute('placeholder',box.dataset.origPh);
      delete box.dataset.origPh;
    }
  }
}

async function initBooks(){
  _booksInjectStyles();
  const view=document.getElementById('books-view');
  if(!view) return;
  view.style.flexDirection='column';
  await _loadBooksData();

  let html='';
  const _tl = (_BOOKS_DATA && _BOOKS_DATA.topline) || {total:0, free:0};
  html+='<div id="bv-toolbar">';
  html+='<div id="bv-count-badge" style="display:flex;align-items:center;gap:14px;padding:0 14px 0 2px;margin-right:6px;border-right:1px solid var(--border2,#2D3748);font-family:\'Cinzel\',serif;letter-spacing:.06em">';
  html+='<div style="display:flex;flex-direction:column;line-height:1.1"><span style="font-size:18px;font-weight:700;color:#E6B450">'+_tl.total+'</span><span style="font-size:9px;opacity:.65;text-transform:uppercase">Books</span></div>';
  html+='<div style="display:flex;flex-direction:column;line-height:1.1"><span style="font-size:18px;font-weight:700;color:#4FD1C5">'+_tl.free+'</span><span style="font-size:9px;opacity:.65;text-transform:uppercase">Free Reads</span></div>';
  html+='</div>';
  html+='<div class="bv-dd-wrap">';
  html+='<button class="bv-dd-btn" id="bv-source-btn">\u2014 SELECT A SOURCE \u2014  <span style="opacity:.6">\u25BE</span></button>';
  html+='<div class="bv-dd-panel" id="bv-source-panel">';
  html+='<input class="bv-dd-search" id="bv-source-search" placeholder="search sources\u2026">';
  html+='<div class="bv-dd-scroll" id="bv-source-scroll"></div>';
  html+='</div>';
  html+='</div>';
  html+='<div class="bv-dd-wrap">';
  html+='<button class="bv-dd-btn" id="bv-theme-btn">\u2014 SELECT A THEME \u2014  <span style="opacity:.6">\u25BE</span></button>';
  html+='<div class="bv-dd-panel" id="bv-theme-panel">';
  html+='<input class="bv-dd-search" id="bv-theme-search" placeholder="search themes\u2026">';
  html+='<div class="bv-dd-scroll" id="bv-theme-scroll"></div>';
  html+='</div>';
  html+='</div>';
  html+='<div class="bv-dd-wrap">';
  html+='<button class="bv-dd-btn" id="bv-author-btn">\u2014 SELECT AN AUTHOR \u2014  <span style="opacity:.6">\u25BE</span></button>';
  html+='<div class="bv-dd-panel" id="bv-author-panel">';
  html+='<input class="bv-dd-search" id="bv-author-search" placeholder="search authors\u2026">';
  html+='<div class="bv-dd-scroll" id="bv-author-scroll"></div>';
  html+='</div>';
  html+='</div>';
  html+='<button class="bv-clear-all" id="bv-clear-all" title="Clear all filters">\u00D7</button>';
  html+='<div id="bv-anim-wrap">';
  html+='<span id="bv-anim-year">—</span>';
  html+='<select id="bv-anim-speed"><option value="2400">Slow</option><option value="1200" selected>Medium</option><option value="500">Fast</option></select>';
  html+='<button id="bv-anim-btn">▶ ANIMATE</button>';
  html+='</div>';
  html+='</div>';
  html+='<div id="bv-scroll"><div id="bv-canvas"></div></div>';
  view.innerHTML=html;

  _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'\u2014 SELECT A SOURCE \u2014','sources');
  _bvSyncBtnLabel('bv-theme-btn',_booksFilter.theme,'\u2014 SELECT A THEME \u2014','themes');
  _bvSyncBtnLabel('bv-author-btn',_booksFilter.author,'\u2014 SELECT AN AUTHOR \u2014','authors');
  _booksBuildSourcePanel();
  _booksBuildThemePanel();
  _booksBuildAuthorPanel();
  _booksBuildCanvas();

  // Wire all 3 dropdowns with mutual-close logic
  const _ddPairs = [
    {btn:'bv-source-btn', panel:'bv-source-panel', search:'bv-source-search', build:_booksBuildSourcePanel},
    {btn:'bv-theme-btn', panel:'bv-theme-panel', search:'bv-theme-search', build:_booksBuildThemePanel},
    {btn:'bv-author-btn', panel:'bv-author-panel', search:'bv-author-search', build:_booksBuildAuthorPanel}
  ];
  _ddPairs.forEach(dd=>{
    const btn=document.getElementById(dd.btn);
    const panel=document.getElementById(dd.panel);
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      _ddPairs.forEach(o=>{ if(o.panel!==dd.panel) document.getElementById(o.panel).classList.remove('open'); });
      panel.classList.toggle('open');
      if(panel.classList.contains('open')){
        const s=document.getElementById(dd.search);
        if(s) s.focus();
      }
    });
    document.getElementById(dd.search).addEventListener('input',dd.build);
  });
  document.addEventListener('click',function(e){
    _ddPairs.forEach(dd=>{
      const panel=document.getElementById(dd.panel);
      const btn=document.getElementById(dd.btn);
      if(panel && !panel.contains(e.target) && e.target!==btn) panel.classList.remove('open');
    });
  });
  document.getElementById('bv-anim-btn').addEventListener('click',_booksAnimToggle);
  document.getElementById('bv-clear-all').addEventListener('click',function(){
    _booksFilter.source.clear(); _booksFilter.theme.clear(); _booksFilter.author.clear(); _booksFilter.search='';
    _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'\u2014 SELECT A SOURCE \u2014','sources');
    _bvSyncBtnLabel('bv-theme-btn',_booksFilter.theme,'\u2014 SELECT A THEME \u2014','themes');
    _bvSyncBtnLabel('bv-author-btn',_booksFilter.author,'\u2014 SELECT AN AUTHOR \u2014','authors');
    _booksBuildSourcePanel(); _booksBuildThemePanel(); _booksBuildAuthorPanel();
    var sb=document.getElementById('search'); if(sb) sb.value='';
    _booksBuildCanvas(); _booksAnimStop(); _booksSyncClearBtn();
  });

  _booksUpdateTopbar();
  _booksUpdateSearchBox(true);
  _booksSyncClearBtn();
  _booksInited=true;
}

(function(){
  const _origOnSearch=window.onSearch;
  window.onSearch=function(){
    if(typeof VIEW!=='undefined' && VIEW==='books'){
      const box=document.getElementById('search');
      _booksFilter.search=box?box.value:'';
      _booksBuildCanvas();
      _booksAnimStop();
      return;
    }
    if(typeof _origOnSearch==='function') _origOnSearch();
  };
})();

(function(){
  if(typeof window.setView!=='function') return;
  const _origSetView=window.setView;
  window.setView=function(v){
    _origSetView(v);
    const bv=document.getElementById('books-view');
    if(!bv) return;
    if(v==='books'){
      const ip=document.getElementById('infoPanel');
      const r3=document.getElementById('hdrRow3');
      const r4=document.getElementById('hdrRow4');
      if(ip) ip.style.display='none';
      if(r3) r3.style.display='none';
      if(r4) r4.style.display='none';
      bv.style.display='flex';
      bv.style.flexDirection='column';
      initBooks();
      if(typeof _resizeShell==='function') setTimeout(_resizeShell, 20);
    } else {
      bv.style.display='none';
      _booksAnimStop();
      _booksUpdateTopbar();
      _booksUpdateSearchBox(false);
      _booksFilter.search='';
      if(typeof _resizeShell==='function') setTimeout(_resizeShell, 20);
    }
  };
})();
