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
let _booksFilter = { tag:null, author:null, search:'' };
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
  .bv-dd-wrap{position:relative}
  .bv-dd-btn{background:none;border:1px solid var(--border2,#2D3748);color:var(--gold,#D4AF37);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.1em;padding:8px 14px;cursor:pointer;min-width:220px;text-align:left;display:flex;justify-content:space-between;align-items:center;gap:10px;border-radius:2px}
  .bv-dd-btn:hover{border-color:var(--gold,#D4AF37)}
  .bv-dd-panel{position:absolute;top:calc(100% + 4px);left:0;width:300px;max-height:420px;background:#0E1621;border:1px solid var(--gold,#D4AF37);border-radius:2px;z-index:100;display:none;flex-direction:column;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.6)}
  .bv-dd-panel.open{display:flex}
  .bv-dd-search{margin:10px 10px 6px;padding:7px 9px;background:#1a2330;border:1px solid var(--border2,#2D3748);color:#fff;font-family:'Source Sans 3',sans-serif;font-size:12px;border-radius:2px;outline:none}
  .bv-dd-search:focus{border-color:var(--gold,#D4AF37)}
  .bv-dd-scroll{flex:1;overflow-y:auto;padding:4px 0 10px}
  .bv-dd-section-hdr{font-family:'Cinzel',serif;font-size:10px;letter-spacing:.12em;color:var(--muted,#6B7B8C);padding:8px 14px 4px;text-transform:uppercase;font-weight:700}
  .bv-dd-item{font-family:'Source Sans 3',sans-serif;font-size:12px;color:var(--text1,#E4E4E7);padding:6px 20px;cursor:pointer}
  .bv-dd-item.cinzel{font-family:'Cinzel',serif;font-size:11px;text-transform:uppercase;letter-spacing:.04em}
  .bv-dd-item:hover{background:rgba(212,175,55,.12);color:var(--gold,#D4AF37)}
  .bv-dd-item.sel{color:var(--gold,#D4AF37);background:rgba(212,175,55,.1)}
  .bv-dd-clear{font-family:'Cinzel',serif;font-size:10px;letter-spacing:.1em;color:var(--gold,#D4AF37);padding:9px 14px;border-bottom:1px solid var(--border2,#2D3748);cursor:pointer;text-transform:uppercase;text-align:center}
  .bv-dd-clear:hover{background:rgba(212,175,55,.1)}
  #bv-anim-wrap{margin-left:auto;display:flex;align-items:center;gap:8px}
  #bv-anim-year{font-family:'Cinzel',serif;font-size:11px;color:var(--gold,#D4AF37);letter-spacing:.05em;min-width:80px;text-align:center;opacity:0;transition:opacity .3s}
  #bv-anim-year.live{opacity:1}
  #bv-anim-speed{background:#1a2330;border:1px solid var(--border2,#2D3748);color:var(--text1,#E4E4E7);font-family:'Source Sans 3',sans-serif;font-size:11px;padding:6px 8px;border-radius:2px;cursor:pointer}
  #bv-anim-btn{background:none;border:1px solid var(--gold,#D4AF37);color:var(--gold,#D4AF37);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.1em;padding:7px 14px;cursor:pointer;border-radius:2px}
  #bv-anim-btn:hover{background:rgba(212,175,55,.1)}
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
  `;
  const s=document.createElement('style');
  s.id='booksViewStyles';
  s.textContent=css;
  document.head.appendChild(s);
}

function _booksCollectTags(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const types = new Set();
  const trads = new Set();
  books.forEach(b=>{
    if(b.author_type) types.add(b.author_type);
    if(b.author_tradition) trads.add(b.author_tradition);
  });
  return { types:[...types].sort(), trads:[...trads].sort() };
}

function _booksCollectAuthors(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const set = new Set();
  books.forEach(b=>{ if(b.author_name && !b.author_hidden) set.add(b.author_name); });
  return [...set].sort();
}

function _booksFiltered(){
  const all = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const q = (_booksFilter.search||'').toLowerCase().trim();
  const tag = _booksFilter.tag;
  const author = _booksFilter.author;
  let out = all.filter(b=>{
    if(tag && b.author_type!==tag && b.author_tradition!==tag) return false;
    if(author && b.author_name!==author) return false;
    if(q){
      const hay = ((b.title||'')+' '+(b.author_name||'')+' '+(b.revealed_to||'')+' '+((b.topics||[]).join(' '))).toLowerCase();
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

  _booksRenderLeaves(books, rowMap, totalH);
}

function _booksRenderLeaves(books, rowMap, totalH){
  const canvas = document.getElementById('bv-canvas');
  if(!canvas) return;

  const byTag = {};
  books.forEach(b=>{
    const addTo = (key, field)=>{
      if(!key) return;
      if(!byTag[key]) byTag[key] = {key, field, books:[], color:(field==='type'?_BV_TYPE_COLORS[key]:_BV_TRAD_COLORS[key])||'#A0AEC0'};
      byTag[key].books.push(b);
    };
    if(b.author_type) addTo(b.author_type,'type');
    if(b.author_tradition) addTo(b.author_tradition,'trad');
  });
  const leaves = Object.values(byTag).filter(t=>t.books.length>0);
  if(!leaves.length) return;

  leaves.forEach(t=>{
    const ys = t.books.map(b=>rowMap[b.id].midY);
    t.y1 = Math.min(...ys);
    t.y2 = Math.max(...ys);
    t.count = t.books.length;
  });
  leaves.sort((a,b)=>a.y1 - b.y1);

  _BV_ERA_BANDS.forEach(era=>{
    const y1e = _booksYearToY(era.start, books, rowMap);
    const y2e = _booksYearToY(era.end,   books, rowMap);
    if(y2e - y1e < 6) return;
    const band = document.createElement('div');
    band.style.cssText = 'position:absolute;top:'+y1e+'px;height:'+(y2e-y1e)+'px;left:'+(_BV_STEM_X+18)+'px;right:0;background:linear-gradient(to left, rgba('+era.glow+',0.13) 0%, rgba('+era.glow+',0.05) 55%, transparent 95%);pointer-events:none;z-index:1';
    canvas.appendChild(band);
    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;top:'+(y1e+10)+'px;right:24px;font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.14em;color:rgba('+era.glow+',0.85);text-transform:uppercase;pointer-events:none;z-index:1;text-align:right;font-weight:700';
    label.innerHTML = era.name + '<div style="font-size:9px;opacity:.6;margin-top:2px;font-weight:400">'+era.dates+'</div>';
    canvas.appendChild(label);
  });

  const canvasW = canvas.clientWidth || 1600;
  const rightW = Math.max(900, canvasW - _BV_STEM_X - 80);
  const PEAK_X = rightW * 0.72;
  const LABEL_X = PEAK_X + 14;
  const LABEL_H = 22;
  const TOP_OFFSET = 18;

  const NS='http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS,'svg');
  svg.setAttribute('class','bv-leaves');
  svg.style.position = 'absolute';
  svg.style.top = '0';
  svg.style.left = (_BV_STEM_X) + 'px';
  svg.style.width = rightW + 'px';
  svg.style.pointerEvents = 'none';
  svg.setAttribute('height', totalH);

  const records = [];

  leaves.forEach((ld, idx)=>{
    let y1 = ld.y1;
    let y2 = ld.y2;
    if(y2 - y1 < 20) y2 = y1 + 20;
    const stemX = 1;
    const labelNaturalY = y1 + TOP_OFFSET;

    // Upside-down leaf: fat top near y1, tapered tip at y2
    // Top arc sweeps out to PEAK_X near y1, then tapers down to stemX at y2
    const d = 'M ' + stemX + ' ' + y1.toFixed(1) +
              ' C ' + (stemX + PEAK_X*0.35).toFixed(1) + ' ' + (y1 - 6).toFixed(1) +
              ', ' + PEAK_X.toFixed(1) + ' ' + y1.toFixed(1) +
              ', ' + PEAK_X.toFixed(1) + ' ' + labelNaturalY.toFixed(1) +
              ' C ' + PEAK_X.toFixed(1) + ' ' + (y1 + (y2-y1)*0.55).toFixed(1) +
              ', ' + (stemX + PEAK_X*0.25).toFixed(1) + ' ' + (y2 - 4).toFixed(1) +
              ', ' + stemX + ' ' + y2.toFixed(1) + ' Z';

    const g = document.createElementNS(NS,'g');
    g.setAttribute('class','bv-leaf');
    g.setAttribute('data-tag', ld.key);
    g.style.cursor = 'pointer';
    g.style.pointerEvents = 'auto';
    const path = document.createElementNS(NS,'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', ld.color);
    path.setAttribute('fill-opacity', '0.06');
    path.setAttribute('stroke', ld.color);
    path.setAttribute('stroke-opacity','0.65');
    path.setAttribute('stroke-width','2');
    g.appendChild(path);

    const dot1 = document.createElementNS(NS,'circle');
    dot1.setAttribute('cx', stemX); dot1.setAttribute('cy', y1);
    dot1.setAttribute('r', 3); dot1.setAttribute('fill', ld.color);
    g.appendChild(dot1);
    const dot2 = document.createElementNS(NS,'circle');
    dot2.setAttribute('cx', stemX); dot2.setAttribute('cy', y2);
    dot2.setAttribute('r', 2); dot2.setAttribute('fill', ld.color);
    dot2.setAttribute('fill-opacity', '0.7');
    g.appendChild(dot2);

    svg.appendChild(g);

    records.push({ ld, g, path, labelNaturalY, y1, targetY: labelNaturalY });
  });

  // ── De-collide labels: push overlapping ones down, preserving order by y1 ──
  records.sort((a,b)=>a.labelNaturalY - b.labelNaturalY);
  let lastBottom = -Infinity;
  records.forEach(r=>{
    if(r.targetY < lastBottom + LABEL_H){
      r.targetY = lastBottom + LABEL_H;
    }
    lastBottom = r.targetY;
  });

  // ── Paint labels + optional dashed connector from leaf tip to displaced label ──
  records.forEach(r=>{
    const ld = r.ld;

    if(Math.abs(r.targetY - r.labelNaturalY) > 2){
      const line = document.createElementNS(NS,'line');
      line.setAttribute('x1', PEAK_X);
      line.setAttribute('y1', r.labelNaturalY);
      line.setAttribute('x2', PEAK_X + 10);
      line.setAttribute('y2', r.targetY);
      line.setAttribute('stroke', ld.color);
      line.setAttribute('stroke-opacity', '0.5');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-dasharray', '2,3');
      svg.appendChild(line);
    }

    const label = document.createElement('div');
    label.className = 'bv-leaf-label';
    label.setAttribute('data-tag', ld.key);
    label.style.position = 'absolute';
    label.style.left = (_BV_STEM_X + LABEL_X) + 'px';
    label.style.top = r.targetY + 'px';
    label.style.transform = 'translateY(-50%)';
    label.style.color = ld.color;
    label.style.whiteSpace = 'nowrap';
    label.style.cursor = 'pointer';
    label.style.fontFamily = "'Cinzel', serif";
    label.style.fontSize = '12px';
    label.style.fontWeight = '700';
    label.style.letterSpacing = '0.08em';
    label.style.textTransform = 'uppercase';
    label.style.pointerEvents = 'auto';
    label.textContent = ld.key + ' (' + ld.count + ')';
    canvas.appendChild(label);

    const clickHandler = function(e){
      e.stopPropagation();
      _booksFilter.tag = ld.key;
      _booksSetTagBtnLabel(ld.key);
      _booksBuildCanvas();
      _booksAnimStop();
    };
    r.g.addEventListener('click', clickHandler);
    label.addEventListener('click', clickHandler);
    r.g.addEventListener('mouseenter', function(){
      if(_booksFilter.tag) return;
      r.path.setAttribute('stroke-opacity','1');
      r.path.setAttribute('stroke-width','3');
      r.path.setAttribute('fill-opacity','0.18');
    });
    r.g.addEventListener('mouseleave', function(){
      if(_booksFilter.tag) return;
      r.path.setAttribute('stroke-opacity','0.65');
      r.path.setAttribute('stroke-width','2');
      r.path.setAttribute('fill-opacity','0.06');
    });
  });

  canvas.appendChild(svg);
}

function _booksSetTagBtnLabel(label){
  const btn = document.getElementById('bv-tag-btn');
  if(!btn) return;
  btn.innerHTML = _booksEscape(label)+'  <span style="opacity:.6">▾</span>';
}
function _booksSetAuthorBtnLabel(label){
  const btn = document.getElementById('bv-author-btn');
  if(!btn) return;
  btn.innerHTML = _booksEscape(label)+'  <span style="opacity:.6">▾</span>';
}

function _booksBuildTagPanel(){
  const scroll = document.getElementById('bv-tag-scroll');
  if(!scroll) return;
  const tags = _booksCollectTags();
  const si = document.getElementById('bv-tag-search');
  const q = (si && si.value || '').toLowerCase().trim();
  const matches = arr=>arr.filter(t=>!q || t.toLowerCase().indexOf(q)>-1);
  let html='';
  html+='<div class="bv-dd-clear" data-clear="1">— CLEAR TAG FILTER —</div>';
  const tm=matches(tags.types), trm=matches(tags.trads);
  if(tm.length){
    html+='<div class="bv-dd-section-hdr">TYPES</div>';
    tm.forEach(t=>{
      const sel=(_booksFilter.tag===t)?' sel':'';
      html+='<div class="bv-dd-item cinzel'+sel+'" data-tag="'+_booksEscape(t)+'">'+_booksEscape(t)+'</div>';
    });
  }
  if(trm.length){
    html+='<div class="bv-dd-section-hdr">TRADITIONS</div>';
    trm.forEach(t=>{
      const sel=(_booksFilter.tag===t)?' sel':'';
      html+='<div class="bv-dd-item cinzel'+sel+'" data-tag="'+_booksEscape(t)+'">'+_booksEscape(t)+'</div>';
    });
  }
  scroll.innerHTML=html;
  scroll.querySelectorAll('.bv-dd-item').forEach(el=>{
    el.addEventListener('click',function(){
      _booksFilter.tag=this.getAttribute('data-tag');
      _booksSetTagBtnLabel(_booksFilter.tag);
      document.getElementById('bv-tag-panel').classList.remove('open');
      _booksBuildCanvas();
      _booksAnimStop();
    });
  });
  scroll.querySelectorAll('[data-clear]').forEach(el=>{
    el.addEventListener('click',function(){
      _booksFilter.tag=null;
      _booksSetTagBtnLabel('— SELECT A TAG —');
      document.getElementById('bv-tag-panel').classList.remove('open');
      _booksBuildCanvas();
      _booksAnimStop();
    });
  });
}

function _booksBuildAuthorPanel(){
  const scroll = document.getElementById('bv-author-scroll');
  if(!scroll) return;
  const authors = _booksCollectAuthors();
  const si = document.getElementById('bv-author-search');
  const q = (si && si.value || '').toLowerCase().trim();
  const matches = authors.filter(t=>!q || t.toLowerCase().indexOf(q)>-1);
  let html='';
  html+='<div class="bv-dd-clear" data-clear="1">— CLEAR AUTHOR FILTER —</div>';
  html+='<div class="bv-dd-section-hdr">AUTHORS ('+matches.length+')</div>';
  matches.forEach(a=>{
    const sel=(_booksFilter.author===a)?' sel':'';
    html+='<div class="bv-dd-item'+sel+'" data-author="'+_booksEscape(a)+'">'+_booksEscape(a)+'</div>';
  });
  scroll.innerHTML=html;
  scroll.querySelectorAll('[data-author]').forEach(el=>{
    el.addEventListener('click',function(){
      _booksFilter.author=this.getAttribute('data-author');
      _booksSetAuthorBtnLabel(_booksFilter.author);
      document.getElementById('bv-author-panel').classList.remove('open');
      _booksBuildCanvas();
      _booksAnimStop();
    });
  });
  scroll.querySelectorAll('[data-clear]').forEach(el=>{
    el.addEventListener('click',function(){
      _booksFilter.author=null;
      _booksSetAuthorBtnLabel('— SELECT AN AUTHOR —');
      document.getElementById('bv-author-panel').classList.remove('open');
      _booksBuildCanvas();
      _booksAnimStop();
    });
  });
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
  html+='<button class="bv-dd-btn" id="bv-tag-btn">— SELECT A TAG —  <span style="opacity:.6">▾</span></button>';
  html+='<div class="bv-dd-panel" id="bv-tag-panel">';
  html+='<input class="bv-dd-search" id="bv-tag-search" placeholder="search tags…">';
  html+='<div class="bv-dd-scroll" id="bv-tag-scroll"></div>';
  html+='</div>';
  html+='</div>';
  html+='<div class="bv-dd-wrap">';
  html+='<button class="bv-dd-btn" id="bv-author-btn">— SELECT AN AUTHOR —  <span style="opacity:.6">▾</span></button>';
  html+='<div class="bv-dd-panel" id="bv-author-panel">';
  html+='<input class="bv-dd-search" id="bv-author-search" placeholder="search authors…">';
  html+='<div class="bv-dd-scroll" id="bv-author-scroll"></div>';
  html+='</div>';
  html+='</div>';
  html+='<div id="bv-anim-wrap">';
  html+='<span id="bv-anim-year">—</span>';
  html+='<select id="bv-anim-speed"><option value="2400">Slow</option><option value="1200" selected>Medium</option><option value="500">Fast</option></select>';
  html+='<button id="bv-anim-btn">▶ ANIMATE</button>';
  html+='</div>';
  html+='</div>';
  html+='<div id="bv-scroll"><div id="bv-canvas"></div></div>';
  view.innerHTML=html;

  if(_booksFilter.tag) _booksSetTagBtnLabel(_booksFilter.tag);
  if(_booksFilter.author) _booksSetAuthorBtnLabel(_booksFilter.author);
  _booksBuildTagPanel();
  _booksBuildAuthorPanel();
  _booksBuildCanvas();

  const tagBtn=document.getElementById('bv-tag-btn');
  const tagPanel=document.getElementById('bv-tag-panel');
  tagBtn.addEventListener('click',function(e){
    e.stopPropagation();
    tagPanel.classList.toggle('open');
    const other=document.getElementById('bv-author-panel');
    if(other) other.classList.remove('open');
    if(tagPanel.classList.contains('open')){
      const s=document.getElementById('bv-tag-search');
      if(s) s.focus();
    }
  });
  const aBtn=document.getElementById('bv-author-btn');
  const aPanel=document.getElementById('bv-author-panel');
  aBtn.addEventListener('click',function(e){
    e.stopPropagation();
    aPanel.classList.toggle('open');
    const other=document.getElementById('bv-tag-panel');
    if(other) other.classList.remove('open');
    if(aPanel.classList.contains('open')){
      const s=document.getElementById('bv-author-search');
      if(s) s.focus();
    }
  });
  document.addEventListener('click',function(e){
    if(tagPanel && !tagPanel.contains(e.target) && e.target!==tagBtn) tagPanel.classList.remove('open');
    if(aPanel && !aPanel.contains(e.target) && e.target!==aBtn) aPanel.classList.remove('open');
  });
  document.getElementById('bv-tag-search').addEventListener('input',_booksBuildTagPanel);
  document.getElementById('bv-author-search').addEventListener('input',_booksBuildAuthorPanel);
  document.getElementById('bv-anim-btn').addEventListener('click',_booksAnimToggle);

  _booksUpdateTopbar();
  _booksUpdateSearchBox(true);
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
