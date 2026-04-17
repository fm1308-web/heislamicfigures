// ═══════════════════════════════════════════════════════════
// BOOKS VIEW — Phase 3 final (unified canvas)
// ═══════════════════════════════════════════════════════════
const _BV_ROW_H = 52;
const _BV_TOP_PAD = 40;
const _BV_BOT_PAD = 80;
const _BV_LEFT_W = 540;
const _BV_STEM_X = 600;

function _bYr(b){return b.year_display!=null?b.year_display:b.year;}

let _BOOKS_DATA = null;
var _ANCIENT_DATA = null;
var _ancientOn = false;
let _booksInited = false;
let _booksFilter = { source:new Set(), theme:new Set(), author:new Set(), search:'' };
let _booksAnim = { mode:'stopped', timer:null, idx:0, rows:null, speedMs:1200, tick:null };

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
window._BV_ERA_BANDS = _BV_ERA_BANDS;

function _booksYearToY(yr, books, rowMap){
  const withYear = books.filter(b=>_bYr(b)!=null);
  if(!withYear.length) return _BV_TOP_PAD;
  const first = withYear[0], last = withYear[withYear.length-1];
  if(yr <= _bYr(first)) return rowMap[first.id].midY;
  if(yr >= _bYr(last)) return rowMap[last.id].midY;
  for(let i=1; i<withYear.length; i++){
    if(_bYr(withYear[i]) >= yr){
      const prev = withYear[i-1];
      const curr = withYear[i];
      if(_bYr(curr)===_bYr(prev)) return rowMap[curr.id].midY;
      const ratio = (yr - _bYr(prev)) / (_bYr(curr) - _bYr(prev));
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

async function _loadAncientData(){
  if(_ANCIENT_DATA) return _ANCIENT_DATA;
  try{
    const res = await fetch('data/islamic/ancient_books.json?v='+Date.now());
    _ANCIENT_DATA = await res.json();
    return _ANCIENT_DATA;
  }catch(e){
    console.error('ancient_books.json load failed',e);
    _ANCIENT_DATA = {topline:{total:0,free:0},books:[]};
    return _ANCIENT_DATA;
  }
}

function _showViewDesc(txt){
  var el=document.getElementById('viewDescInline');
  if(!el){
    var row=document.getElementById('hdrRow2');
    if(!row) return;
    el=document.createElement('span');
    el.id='viewDescInline';
    var sw=document.getElementById('searchWrap');
    row.insertBefore(el,sw);
  }
  el.textContent=txt;
  el.style.display='inline-block';
}
function _hideViewDesc(){
  var el=document.getElementById('viewDescInline');
  if(el) el.style.display='none';
}
// Auto-hide tagline on every view switch; specific views re-show in their own handlers
(function(){
  var _origSV2=window.setView;
  if(!_origSV2) return;
  window.setView=function(v){
    _hideViewDesc();
    _origSV2(v);
  };

})();

function _showBooksMethodology(){
  if(document.getElementById('bv-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='bv-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="bv-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:18px;margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'
    +'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 16px">A visual timeline of books by Islamic authors, drawn as leaf shapes positioned at their year of composition or publication. Books with free online links are highlighted in teal \u2014 click to read them. Filter by theme, source, or author to explore specific subjects. The gold count shows total books; the teal count shows free reads available.</p>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'
    +'<div style="font-size:13px;line-height:1.7">'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E6B450;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Gold badge</span><span style="color:#A0AEC0">Total number of books matching your current filters</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4FD1C5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Teal badge</span><span style="color:#A0AEC0">Number of those books with free legal online links</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#8B7355;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Leaf shape</span><span style="color:#A0AEC0">One book, positioned at its composition year on the timeline</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4FD1C5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Free read</span><span style="color:#A0AEC0">A link to a legally available translation on Archive.org, Project Gutenberg, or an academic repository</span></div>'
    +'</div>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'
    +'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 12px">Book metadata is compiled from Wikidata, Archive.org, and manual research. Publication years for medieval texts are approximate \u2014 many were composed over years or decades. Free links point to legally available English translations with full bibliographic attribution.</p>'
    +'<p style="color:#999;font-size:12px;font-style:italic;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('bv-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

function _booksEscape(s){
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
var _bvShowCE=true,_bvShowHijri=true;
function _bvCeToHijri(ce){return Math.round((ce-622)*33/32);}
function _booksFmtYear(y){
  if(y==null||y==='') return '—';
  const n = typeof y==='number' ? y : parseInt(y,10);
  if(isNaN(n)) return '—';
  if(n<0) return Math.abs(n)+'<span class="year-era">BCE</span>';
  return n+'<span class="year-era">CE</span>';
}

function _booksInjectStyles(){
  const old=document.getElementById('booksViewStyles');
  if(old) old.remove();
  const css = `
  #books-view{flex:1;display:none;overflow:hidden;background:var(--bg0,#0E1621);flex-direction:column}
  #bv-toolbar{flex-shrink:0;display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border2,#2D3748);background:var(--bg0,#0E1621);flex-wrap:wrap}
  #bv-anim-mount{margin-left:auto;display:flex;align-items:center;gap:10px}
  .bv-clear-all.active{opacity:1;border-color:rgba(212,175,55,.6)}
  #bv-scroll{flex:1;overflow-y:auto;overflow-x:hidden;position:relative}
  #bv-canvas{position:relative;width:100%}
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
  .bv-year-chip{position:absolute;transform:translateY(-50%);text-align:right;font-family:'Source Sans 3',sans-serif;font-size:11px;color:#6B7280;letter-spacing:.02em;z-index:5;white-space:nowrap;pointer-events:none}
  .bv-year-chip.year-multi{color:#D4AF37}
  .bv-year-chip.scripture{color:#D4AF37;font-weight:600;text-shadow:0 0 4px rgba(212,175,55,.4)}
  .bv-hij-chip{position:absolute;transform:translateY(-50%);text-align:left;font-family:'Source Sans 3',sans-serif;font-size:11px;color:#8B7A3E;z-index:5;white-space:nowrap;pointer-events:none}
  .bv-ruler-toggle{position:absolute;display:flex;align-items:center;gap:4px;z-index:5}
  .bv-ruler-btn{font-size:10px;color:#555;cursor:pointer;padding:2px 5px;border-radius:8px;border:1px solid transparent;transition:.2s;user-select:none;font-family:'Cinzel',serif;letter-spacing:.03em}
  .bv-ruler-btn.on{color:#D4AF37;border-color:#D4AF37}
  .bv-ruler-btn:hover{color:#D4AF37}
  .bv-ruler-sep{color:#444;font-size:10px;pointer-events:none}
  .bv-row.is-scripture .bv-row-title{color:var(--gold,#D4AF37);font-weight:600;letter-spacing:.01em}
  .bv-row.is-scripture .bv-row-meta{color:rgba(212,175,55,.62);font-style:italic}
  svg.bv-leaves{position:absolute;top:0;left:0;width:100%;z-index:2;overflow:visible}
  svg.bv-leaves g.bv-leaf{cursor:pointer;pointer-events:all}
  .bv-leaf-label{position:absolute;white-space:nowrap;z-index:4}
  .bv-pinned-scripture{padding:8px 16px 7px;border-bottom:1px solid rgba(212,175,55,.4);margin-bottom:4px}
  `;
  const s=document.createElement('style');
  s.id='booksViewStyles';
  s.textContent=css;
  document.head.appendChild(s);
}

function _booksCollectSources(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {}, earliest = {};
  books.forEach(b=>{ (b.topics||[]).forEach(t=>{ if(t){ counts[t]=(counts[t]||0)+1; var y=_bYr(b); if(y!=null&&(earliest[t]==null||y<earliest[t])) earliest[t]=y; }}); });
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
}

function _booksCollectThemes(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {}, earliest = {};
  books.forEach(b=>{ (b.themes||[]).forEach(t=>{ if(t){ counts[t]=(counts[t]||0)+1; var y=_bYr(b); if(y!=null&&(earliest[t]==null||y<earliest[t])) earliest[t]=y; }}); });
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
}

function _booksCollectAuthors(){
  const books = (_BOOKS_DATA && _BOOKS_DATA.books) || [];
  const counts = {}, earliest = {};
  books.forEach(b=>{ if(b.author_name && !b.author_hidden){ counts[b.author_name]=(counts[b.author_name]||0)+1; var y=_bYr(b); if(y!=null&&(earliest[b.author_name]==null||y<earliest[b.author_name])) earliest[b.author_name]=y; }});
  return Object.keys(counts).map(k=>({name:k,count:counts[k],_earliest:earliest[k]||9999})).sort((a,b)=>a._earliest-b._earliest);
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
    const ay=_bYr(a)==null?99999:_bYr(a);
    const by=_bYr(b)==null?99999:_bYr(b);
    return ay-by;
  });
  return out;
}

function _booksBuildCanvas(){
  _booksSyncClearBtn();
  const canvas = document.getElementById('bv-canvas');
  if(!canvas) return;
  const islamicBooks = _booksFiltered();
  // Merge ancient books when toggle is on
  var merged = [];
  islamicBooks.forEach(function(b){ merged.push({book:b, ancient:false}); });
  if(_ancientOn && _ANCIENT_DATA && _ANCIENT_DATA.books){
    _ANCIENT_DATA.books.forEach(function(b){ merged.push({book:b, ancient:true}); });
  }
  merged.sort(function(a,b){
    var ay=_bYr(a.book)==null?99999:_bYr(a.book);
    var by=_bYr(b.book)==null?99999:_bYr(b.book);
    return ay-by;
  });
  if(!merged.length){
    canvas.style.height='200px';
    canvas.innerHTML='<div id="bv-empty">NO BOOKS MATCH YOUR FILTERS</div>';
    return;
  }
  const totalH = _BV_TOP_PAD + merged.length * _BV_ROW_H + _BV_BOT_PAD;
  canvas.style.height = totalH + 'px';

  const rowMap = {};
  // Count books per year for multi-event highlighting
  const _yrCount = {};
  merged.forEach(function(entry){ var yr=_bYr(entry.book); if(yr!=null) _yrCount[yr]=(_yrCount[yr]||0)+1; });
  let html = '';
  html += '<div id="bv-stem" style="top:'+(_BV_TOP_PAD-10)+'px;height:'+(totalH - _BV_TOP_PAD - _BV_BOT_PAD + 20)+'px"></div>';
  html += '<div class="bv-ruler-toggle" style="top:'+(_BV_TOP_PAD-28)+'px;left:'+(_BV_STEM_X-22)+'px">';
  html += '<span class="bv-ruler-btn'+(_bvShowCE?' on':'')+'" data-ruler="ce">CE</span>';
  html += '<span class="bv-ruler-sep">\u2502</span>';
  html += '<span class="bv-ruler-btn'+(_bvShowHijri?' on':'')+'" data-ruler="hij">\u0647\u0640</span>';
  html += '</div>';

  merged.forEach(function(entry, idx){
    var b = entry.book;
    var isAnc = entry.ancient;
    const y = _BV_TOP_PAD + idx * _BV_ROW_H;
    const midY = y + _BV_ROW_H/2;
    rowMap[b.id] = { y:y, midY:midY, book:b };

    if(isAnc){
      // Ancient book row — muted grey styling
      var ancMeta = _booksEscape(b.region||'') + ' \u00B7 ' + _booksEscape(b.genre||'');
      var ancBadge = '';
      if(b.url) ancBadge = '<a class="bv-read-btn" href="'+_booksEscape(b.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()" style="border-color:#6B7280;color:#A0AEC0;background:rgba(107,114,128,.10)">READ</a>';
      var yearTxt = _booksFmtYear(b.year);
      html += '<div class="bv-row bv-row-ancient" data-id="'+_booksEscape(b.id)+'" data-name="" data-year="'+(b.year==null?'':b.year)+'" style="top:'+y+'px;height:'+_BV_ROW_H+'px;width:'+(_BV_LEFT_W-140)+'px">';
      html += '<div class="bv-row-main"><div class="bv-row-title" style="color:#8B9AAF;font-size:18px;font-weight:500">'+_booksEscape(b.title)+'</div>';
      html += '<div class="bv-row-meta" style="color:#6B7280">'+ancMeta+ancBadge+'</div>';
      html += '</div></div>';
      var ancMulti = _bYr(b)!=null&&_yrCount[_bYr(b)]>1?' year-multi':'';
      html += '<div class="bv-year-chip'+ancMulti+'" style="top:'+midY+'px;left:'+(_BV_STEM_X-36-140)+'px;color:#B8C2CC;'+(_bvShowCE?'':'display:none')+'">'+yearTxt+'</div>';
      var _aHij=_bvCeToHijri(b.year||0);
      var _aHijLabel=_aHij<0?Math.abs(_aHij)+'<span class="year-era">\u0642.\u0647\u0640</span>':_aHij+'<span class="year-era">\u0647\u0640</span>';
      html += '<div class="bv-hij-chip" style="top:'+midY+'px;left:'+(_BV_STEM_X+10)+'px;'+(_bvShowHijri?'':'display:none')+'">'+_aHijLabel+'</div>';
      var ancDesc = _booksEscape(b.note||'');
      var ancFact = _booksEscape(b.fact||'');
      html += '<div class="bv-row-ancient-right" style="position:absolute;top:'+y+'px;height:'+_BV_ROW_H+'px;left:'+(_BV_STEM_X+90)+'px;right:20px;display:flex;flex-direction:column;justify-content:center;pointer-events:none;z-index:5">'
            + '<div style="color:#8B9AAF;font-size:18px;font-weight:500;line-height:1.2">'+ancDesc+'</div>'
            + '<div style="color:#6B7280;font-size:11px;font-style:italic;line-height:1.2;margin-top:3px">'+ancFact+'</div>'
            + '</div>';
    } else {
      // Islamic book row — original styling
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
      const yearTxt=_booksFmtYear(_bYr(b));
      const _titleAttr=(b.year!=null&&b.year!==_bYr(b)?' title="Published '+b.year+'"':'');

      html += '<div class="bv-row'+(isScripture?' is-scripture':'')+'" data-id="'+idAttr+'" data-name="'+nameAttr+'" data-year="'+(_bYr(b)==null?'':_bYr(b))+'"'+_titleAttr+' style="top:'+y+'px;height:'+_BV_ROW_H+'px">';
      html += '<div class="bv-row-main"><div class="bv-row-title">'+_booksEscape(b.title)+'</div>';
      if(meta) html += '<div class="bv-row-meta">'+meta+'</div>';
      html += '</div></div>';

      var bkMulti = _bYr(b)!=null&&_yrCount[_bYr(b)]>1?' year-multi':'';
      var showYear = entry.ancient || (_bYr(b) > 610);
      if(showYear){
        html += '<div class="bv-year-chip'+(isScripture?' scripture':'')+bkMulti+'" style="top:'+midY+'px;left:'+(_BV_STEM_X-36)+'px;'+(_bvShowCE?'':'display:none')+'">'+yearTxt+'</div>';
        var _bHij=_bvCeToHijri(_bYr(b)||0);
        var _bHijLabel=_bHij<0?Math.abs(_bHij)+'<span class="year-era">\u0642.\u0647\u0640</span>':_bHij+'<span class="year-era">\u0647\u0640</span>';
        html += '<div class="bv-hij-chip" style="top:'+midY+'px;left:'+(_BV_STEM_X+10)+'px;'+(_bvShowHijri?'':'display:none')+'">'+_bHijLabel+'</div>';
      }
    }
  });

  canvas.innerHTML = html;

  canvas.querySelectorAll('.bv-row').forEach(row=>{
    row.addEventListener('click',function(e){
      if(e.target.closest('.bv-read-btn')) return;
      if(row.classList.contains('bv-row-ancient')) return; // ancients don't jump to timeline
      const name=row.getAttribute('data-name');
      if(!name) return;
      setView('timeline');
      setTimeout(()=>{if(typeof jumpTo==='function') jumpTo(name);},50);
    });
  });
  // Ruler toggle wiring
  canvas.querySelectorAll('.bv-ruler-btn').forEach(function(btn){
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var which=this.getAttribute('data-ruler');
      if(which==='ce'){_bvShowCE=!_bvShowCE;this.classList.toggle('on',_bvShowCE);canvas.querySelectorAll('.bv-year-chip').forEach(function(m){m.style.display=_bvShowCE?'':'none';});}
      if(which==='hij'){_bvShowHijri=!_bvShowHijri;this.classList.toggle('on',_bvShowHijri);canvas.querySelectorAll('.bv-hij-chip').forEach(function(m){m.style.display=_bvShowHijri?'':'none';});}
    });
  });

  // Only pass Islamic books for leaf rendering
  var islamicOnly = merged.filter(function(e){ return !e.ancient; }).map(function(e){ return e.book; });
  _booksRenderErasStyle(islamicOnly, rowMap, totalH);
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

  // ── Era bands — matches ERAS view approach (left:0 right:0 anchoring) ──
  _BV_ERA_BANDS.forEach(function(era){
    var y1e = _booksYearToY(era.start, books, rowMap);
    var y2e = _booksYearToY(era.end, books, rowMap);
    if(y2e - y1e < 6) return;
    var gDiv = document.createElement('div');
    gDiv.className = 'bv-era-band';
    gDiv.style.cssText = 'top:'+y1e+'px;height:'+(y2e-y1e)+'px;background:linear-gradient(to left, rgba('+era.glow+',0.10) 0%, rgba('+era.glow+',0.04) 50%, transparent 85%)';
    canvas.appendChild(gDiv);
    var label = document.createElement('div');
    label.className = 'bv-era-label';
    label.style.top = (y1e+12)+'px';
    label.innerHTML = '<div class="bv-era-label-name" style="color:rgba('+era.glow+',0.85)">'+era.name+'</div>'
      + '<div class="bv-era-label-dates" style="color:rgba('+era.glow+',0.7)">'+era.dates+'</div>';
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

    // Store leaf info for label pass
    ld._y1 = y1;
    ld._stemX = stemX;

    // Click → filter by this source
    var clickHandler = function(e){
      e.stopPropagation();
      _booksFilter.source.clear(); _booksFilter.source.add(ld.key);
      _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'\u2014 SELECT A SOURCE \u2014','sources');
      _booksBuildCanvas(); _booksAnimStop();
    };
    g.addEventListener('click', clickHandler);

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

  // ── Leaf labels — always visible, stacked to avoid overlap ──
  var LABEL_H = 22;
  var LABEL_LEFT = _BV_STEM_X + 90;
  var labelInfos = [];
  leaves.forEach(function(ld){
    var naturalY = ld._y1 + 6;
    labelInfos.push({key:ld.key, count:ld.count, color:ld.color, naturalY:naturalY, anchorY:ld._y1, resolvedY:naturalY});
  });
  // Sort by natural Y ascending
  labelInfos.sort(function(a,b){ return a.naturalY - b.naturalY; });
  // Stack: push down if overlapping previous
  var lastBottom = -Infinity;
  labelInfos.forEach(function(li){
    if(li.resolvedY < lastBottom + 2) li.resolvedY = lastBottom + 2;
    lastBottom = li.resolvedY + LABEL_H;
  });
  // Render labels + connector lines
  labelInfos.forEach(function(li){
    // Dashed connector from stem dot at y1 to label left edge
    var connY = li.anchorY;
    var connDiv = document.createElement('div');
    connDiv.style.cssText = 'position:absolute;top:'+connY+'px;left:'+(_BV_STEM_X+2)+'px;width:'+(LABEL_LEFT - _BV_STEM_X - 2)+'px;height:0;border-top:1px dashed rgba('+_bvColorToRgb(li.color)+',0.35);pointer-events:none;z-index:3';
    // If label was pushed down, draw an L-shaped connector
    if(Math.abs(li.resolvedY - connY) > 2){
      // Horizontal part at anchor Y, then vertical drop rendered as label's left border effect
      var vertDiv = document.createElement('div');
      vertDiv.style.cssText = 'position:absolute;top:'+Math.min(connY, li.resolvedY + LABEL_H/2)+'px;left:'+(LABEL_LEFT - 1)+'px;width:0;height:'+Math.abs(li.resolvedY + LABEL_H/2 - connY)+'px;border-left:1px dashed rgba('+_bvColorToRgb(li.color)+',0.35);pointer-events:none;z-index:3';
      canvas.appendChild(vertDiv);
    }
    canvas.appendChild(connDiv);

    var extLabel = document.createElement('div');
    extLabel.className = 'bv-leaf-label';
    extLabel.setAttribute('data-tag', li.key);
    extLabel.style.cssText = 'position:absolute;top:'+li.resolvedY+'px;left:'+LABEL_LEFT+'px;white-space:nowrap;pointer-events:auto;cursor:pointer;font-family:\'Cinzel\',serif;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:'+li.color+';background:rgba(14,22,33,0.85);padding:2px 8px;border-radius:2px;border:1px solid rgba('+_bvColorToRgb(li.color)+',0.4);z-index:4';
    extLabel.textContent = li.key + ' (' + li.count + ')';
    extLabel.addEventListener('click', function(e){
      e.stopPropagation();
      _booksFilter.source.clear(); _booksFilter.source.add(li.key);
      _bvSyncBtnLabel('bv-source-btn',_booksFilter.source,'\u2014 SELECT A SOURCE \u2014','sources');
      _booksBuildCanvas(); _booksAnimStop();
    });
    canvas.appendChild(extLabel);
  });
}

// Helper: convert hex/rgb color string to "r,g,b" for rgba()
function _bvColorToRgb(c){
  if(!c) return '160,174,192';
  if(c.charAt(0)==='#'){
    var hex = c.slice(1);
    if(hex.length===3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return parseInt(hex.substr(0,2),16)+','+parseInt(hex.substr(2,2),16)+','+parseInt(hex.substr(4,2),16);
  }
  var m = c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if(m) return m[1]+','+m[2]+','+m[3];
  return '160,174,192';
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

var _booksAnimCtl = null;

function _bvCurfewYToYear(cursorY, canvas){
  var rows=[].slice.call(canvas.querySelectorAll('.bv-row'));
  for(var i=rows.length-1;i>=0;i--){
    var t=parseFloat(rows[i].style.top)||0;
    if(cursorY>=t){var yr=rows[i].getAttribute('data-year');if(yr!=='') return parseInt(yr,10);}
  }
  return null;
}

function _booksAnimPlay(){
  var canvas = document.getElementById('bv-canvas');
  var scroll = document.getElementById('bv-scroll');
  if(!canvas || !scroll) return;

  // Ensure curfew line exists
  var cursor=document.getElementById('bv-curfew');
  if(!cursor){
    cursor=document.createElement('div');cursor.id='bv-curfew';cursor.className='bv-curfew-line';
    cursor.innerHTML='<span id="bv-curfew-year" class="bv-curfew-year"></span>';
    cursor.style.display='none';
    canvas.appendChild(cursor);
  }
  var blackout=document.getElementById('bv-blackout');
  if(!blackout){
    blackout=document.createElement('div');blackout.id='bv-blackout';
    blackout.style.cssText='display:none;position:absolute;left:0;right:0;background:#000;z-index:8;pointer-events:none';
    canvas.appendChild(blackout);
  }

  if(_booksAnim.mode === 'paused'){
    _booksAnim.mode = 'playing';
    cursor.style.display='';
    _booksAnim.timer = setInterval(_booksAnim.tick, _booksAnim.speedMs);
    return;
  }
  // Fresh start — hide everything
  _booksAnim.mode = 'playing';
  _booksAnim.cursorY = _BV_TOP_PAD;
  _booksAnim.speedMs = _booksAnimCtl ? _booksAnimCtl.getSpeedMs() : 1200;
  var totalH=parseFloat(canvas.style.height)||2000;
  _booksAnim.maxY=totalH;
  if(blackout){blackout.style.display='';blackout.style.top='0px';blackout.style.height=totalH+'px';}
  cursor.style.display='';cursor.style.top=_booksAnim.cursorY+'px';

  var STEP=4;
  _booksAnim.tick=function(){
    if(_booksAnim.mode!=='playing') return;
    _booksAnim.cursorY+=STEP;
    if(_booksAnim.cursorY>_booksAnim.maxY*0.8){_booksAnimStop();return;}
    cursor.style.top=_booksAnim.cursorY+'px';
    var bo=document.getElementById('bv-blackout');
    if(bo){bo.style.top=(_booksAnim.cursorY+1)+'px';bo.style.height=(_booksAnim.maxY-_booksAnim.cursorY)+'px';}
    var yr=_bvCurfewYToYear(_booksAnim.cursorY,canvas);
    var yrEl=document.getElementById('bv-curfew-year');
    if(yrEl) yrEl.innerHTML=yr!=null?_booksFmtYear(yr):'';
    scroll.scrollTo({top:Math.max(0,_booksAnim.cursorY-scroll.clientHeight/2),behavior:'auto'});
  };
  _booksAnim.tick();
  _booksAnim.timer = setInterval(_booksAnim.tick, _booksAnim.speedMs);
}

function _bvSvgBottomY(el){
  var tag=el.tagName.toLowerCase();
  if(tag==='path'){var b=el.getBBox();return b.y+b.height;}
  if(tag==='line'){var y1=parseFloat(el.getAttribute('y1')),y2=parseFloat(el.getAttribute('y2'));return Math.max(y1||0,y2||0);}
  if(tag==='circle') return parseFloat(el.getAttribute('cy'))||0;
  if(tag==='g'){var gb=el.getBBox();return gb.y+gb.height;}
  return null;
}

function _booksAnimPause(){
  _booksAnim.mode = 'paused';
  if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = null; }
}

function _booksAnimStop(){
  _booksAnim.mode = 'stopped';
  if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = null; }
  _booksAnim.tick = null;
  var canvas=document.getElementById('bv-canvas');
  if(canvas){
    var bo=document.getElementById('bv-blackout');
    if(bo) bo.style.display='none';
  }
  var cursor=document.getElementById('bv-curfew');
  if(cursor) cursor.style.display='none';
  document.querySelectorAll('.bv-row.hi').forEach(function(r){ r.classList.remove('hi'); });
  if(_booksAnimCtl) _booksAnimCtl.forceStop();
}

function _booksUpdateTopbar(){
  // No-op — stats are now populated once at boot from books.json
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
  html+='<div id="bv-l1" style="display:flex;align-items:center;gap:10px;padding:6px 16px;border-bottom:1px solid rgba(45,55,72,0.5)">';
  html+='<button id="bv-how-btn" style="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-size:12px;cursor:pointer;transition:.2s;font-family:\'Cinzel\',serif;letter-spacing:.05em" onmouseover="this.style.borderColor=\'#D4AF37\';this.style.color=\'#D4AF37\'" onmouseout="this.style.borderColor=\'#555\';this.style.color=\'#888\'">How This Works</button>';
  html+='<div id="bv-anim-mount" style="margin-left:auto;display:flex;align-items:center;gap:10px"><span id="bv-anim-year" style="font-family:\'Cinzel\',serif;font-size:11px;color:var(--gold,#D4AF37);letter-spacing:.05em;min-width:70px;text-align:right;opacity:0;transition:opacity .3s">\u2014</span></div>';
  html+='</div>';
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
  html+='<button id="bv-ancient-toggle" style="background:transparent;border:1px solid #4A5568;color:#6B7280;font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.04em;padding:4px 10px;cursor:pointer;border-radius:2px">+ ANCIENT</button>';
  html+='</div>';
  html+='<div id="bv-ancient-banner" style="display:none;padding:8px 16px;background:rgba(139,115,85,0.08);border-bottom:1px solid #4A5568;font-size:12px;color:#A0AEC0;font-style:italic;font-family:\'Inter\',\'Source Sans 3\',system-ui,sans-serif">100 Ancient Texts \u2014 Reference add-on only. Not necessarily part of the Monotheistic Corpus.</div>';
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
  _booksAnimCtl = window.AnimControls.create({
    mountEl: document.getElementById('bv-anim-mount'),
    idPrefix: 'bv',
    initialSpeed: '1x',
    onPlay: _booksAnimPlay,
    onPause: _booksAnimPause,
    onStop: _booksAnimStop,
    onSpeedChange: function(ms){ _booksAnim.speedMs = ms; if(_booksAnim.timer){ clearInterval(_booksAnim.timer); _booksAnim.timer = setInterval(_booksAnim.tick, ms); } }
  });
  var _bvHowBtn=document.getElementById('bv-how-btn');
  if(_bvHowBtn) _bvHowBtn.addEventListener('click',function(e){e.stopPropagation();_showBooksMethodology();});
  document.getElementById('bv-ancient-toggle').addEventListener('click',async function(){
    _ancientOn=!_ancientOn;
    var btn=document.getElementById('bv-ancient-toggle');
    var banner=document.getElementById('bv-ancient-banner');
    if(_ancientOn){
      if(!_ANCIENT_DATA) await _loadAncientData();
      btn.textContent='\u2713 ANCIENT';
      btn.style.borderColor='#8B7355';
      btn.style.color='#C9A876';
      if(banner) banner.style.display='block';
    } else {
      btn.textContent='+ ANCIENT';
      btn.style.borderColor='#4A5568';
      btn.style.color='#6B7280';
      if(banner) banner.style.display='none';
    }
    _booksBuildCanvas();
    _booksAnimStop();
  });
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

function _showBooksMethodology(){
  if(document.getElementById('bv-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='bv-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="bv-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:18px;margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'
    +'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 16px">A visual timeline of books by Islamic authors, drawn as leaf shapes positioned at their year of composition or publication. Books with free online links are highlighted in teal \u2014 click to read them. Filter by theme, source, or author to explore specific subjects. The gold count shows total books; the teal count shows free reads available.</p>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'
    +'<div style="font-size:13px;line-height:1.7">'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E6B450;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Gold badge</span><span style="color:#A0AEC0">Total number of books matching your current filters</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4FD1C5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Teal badge</span><span style="color:#A0AEC0">Number of those books with free legal online links</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#8B7355;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Leaf shape</span><span style="color:#A0AEC0">One book, positioned at its composition year on the timeline</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4FD1C5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Free read</span><span style="color:#A0AEC0">A link to a legally available translation on Archive.org, Project Gutenberg, or an academic repository</span></div>'
    +'</div>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'
    +'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 12px">Book metadata is compiled from Wikidata, Archive.org, and manual research. Publication years for medieval texts are approximate \u2014 many were composed over years or decades. Free links point to legally available English translations with full bibliographic attribution.</p>'
    +'<p style="color:#999;font-size:12px;font-style:italic;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('bv-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

window._captureState_books=function(){
  var scroll=document.getElementById('bv-scroll');
  return{
    source:Array.from(_booksFilter.source),theme:Array.from(_booksFilter.theme),
    author:Array.from(_booksFilter.author),search:_booksFilter.search,
    ancient:_ancientOn,scrollY:scroll?scroll.scrollTop:0
  };
};
window._restoreState_books=function(s){
  if(!s) return;
  _booksFilter.source=new Set(s.source||[]);_booksFilter.theme=new Set(s.theme||[]);
  _booksFilter.author=new Set(s.author||[]);_booksFilter.search=s.search||'';
  if(s.ancient!==undefined) _ancientOn=s.ancient;
  _booksBuildCanvas();
  if(s.scrollY){var scroll=document.getElementById('bv-scroll');if(scroll) scroll.scrollTop=s.scrollY;}
};

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
      _showViewDesc('Explore free books');
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

  window._scrollToBookId=function(bookId){
    function tryScroll(){
      var row=document.querySelector('.bv-row[data-id="'+bookId+'"]');
      if(!row) return false;
      row.scrollIntoView({behavior:'smooth',block:'center'});
      row.classList.add('bv-row-flash');
      setTimeout(function(){row.classList.remove('bv-row-flash');},1800);
      return true;
    }
    if(!tryScroll()) setTimeout(tryScroll,400);
    setTimeout(tryScroll,900);
  };

})();

function _showBooksMethodology(){
  if(document.getElementById('bv-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='bv-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="bv-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:22px;cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:18px;margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'
    +'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 16px">A visual timeline of books by Islamic authors, drawn as leaf shapes positioned at their year of composition or publication. Books with free online links are highlighted in teal \u2014 click to read them. Filter by theme, source, or author to explore specific subjects. The gold count shows total books; the teal count shows free reads available.</p>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'
    +'<div style="font-size:13px;line-height:1.7">'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E6B450;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Gold badge</span><span style="color:#A0AEC0">Total number of books matching your current filters</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4FD1C5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Teal badge</span><span style="color:#A0AEC0">Number of those books with free legal online links</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:#8B7355;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Leaf shape</span><span style="color:#A0AEC0">One book, positioned at its composition year on the timeline</span></div>'
    +'<div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4FD1C5;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Free read</span><span style="color:#A0AEC0">A link to a legally available translation on Archive.org, Project Gutenberg, or an academic repository</span></div>'
    +'</div>'
    +'<h3 style="color:#D4AF37;font-size:14px;margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'
    +'<p style="color:#ccc;font-size:13px;line-height:1.6;margin:0 0 12px">Book metadata is compiled from Wikidata, Archive.org, and manual research. Publication years for medieval texts are approximate \u2014 many were composed over years or decades. Free links point to legally available English translations with full bibliographic attribution.</p>'
    +'<p style="color:#999;font-size:12px;font-style:italic;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('bv-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
