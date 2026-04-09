// ═══════════════════════════════════════════════════════════
// THINK VIEW — Concept evolution timeline (5-column vertical)
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _data=null,_booksData=null,_inited=false,_selConceptSlug=null,_tooltip=null;
var _thinkAnimCtl=null,_thinkAnim={mode:'stopped',timer:null,cursorY:0,maxY:0,speedMs:1200,tick:null};
var ROLE_COLORS={originator:'#EF9F27',developer:'#1D9E75',critic:'#D85A30',reviver:'#7F77DD',synthesizer:'#16A39C',transmitter:'#999999'};
var CATEGORIES=['theology','philosophy','law','mysticism','science','politics','language'];
function _esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

async function _loadData(){
  if(_data) return;
  try{var r=await fetch('data/islamic/think.json?v='+Date.now());_data=await r.json();}
  catch(e){_data={concepts:[],stats:{}};}
  if(!_booksData){
    try{
      if(window._BOOKS_DATA) _booksData=window._BOOKS_DATA;
      else{var r2=await fetch('data/islamic/books.json?v='+Date.now());_booksData=await r2.json();window._BOOKS_DATA=_booksData;}
    }catch(e){_booksData={books:[]};}
  }
}

function _syncConceptBtn(){
  var btn=document.getElementById('think-concept-btn');if(!btn) return;
  if(_selConceptSlug){var c=(_data.concepts||[]).find(function(cc){return cc.slug===_selConceptSlug;});
    btn.innerHTML=_esc(c?c.name:_selConceptSlug)+'  <span style="opacity:.6">\u25BE</span>';
  } else btn.innerHTML='\u2014 SELECT A CONCEPT \u2014  <span style="opacity:.6">\u25BE</span>';
}

function _buildConceptPanel(){
  var scroll=document.getElementById('think-concept-scroll');if(!scroll) return;
  var si=document.getElementById('think-concept-search');
  var q=(si&&si.value||'').toLowerCase().trim();
  var grouped={};
  (_data.concepts||[]).forEach(function(c){
    if(c.figure_count===0) return;
    if(q&&c.name.toLowerCase().indexOf(q)===-1) return;
    var cat=c.category||'other';if(!grouped[cat]) grouped[cat]=[];grouped[cat].push(c);
  });
  var html='';
  CATEGORIES.forEach(function(cat){
    if(!grouped[cat]||!grouped[cat].length) return;
    html+='<div style="padding:6px 14px 2px;font-family:\'Cinzel\',serif;font-size:9px;font-weight:700;color:#D4AF37;letter-spacing:.12em;text-transform:uppercase;pointer-events:none">'+_esc(cat)+'</div>';
    grouped[cat].forEach(function(c){
      var on=(_selConceptSlug===c.slug);
      html+='<div class="bv-ck-row'+(on?' checked':'')+'" data-val="'+_esc(c.slug)+'"><span class="bv-ck'+(on?' on':'')+'"></span><span class="bv-ck-label">'+_esc(c.name)+'</span><span class="bv-ck-count">('+c.figure_count+')</span></div>';
    });
  });
  scroll.innerHTML=html;
  scroll.querySelectorAll('.bv-ck-row').forEach(function(el){
    el.addEventListener('click',function(){
      var v=this.getAttribute('data-val');
      if(_thinkAnim.mode!=='stopped') _thinkAnimStop();
      _selConceptSlug=(_selConceptSlug===v)?null:v;
      _syncConceptBtn();_buildConceptPanel();_renderCanvas();
      var panel=document.getElementById('think-concept-panel');if(panel) panel.classList.remove('open');
    });
  });
}

function _buildShell(view){
  var s=_data.stats||{};
  var h='<div id="think-toolbar">';
  h+='<div class="bv-dd-wrap"><button class="bv-dd-btn" id="think-concept-btn">\u2014 SELECT A CONCEPT \u2014 <span style="opacity:.6">\u25BE</span></button>';
  h+='<div class="bv-dd-panel" id="think-concept-panel"><input class="bv-dd-search" id="think-concept-search" placeholder="search concepts\u2026"><div class="bv-dd-scroll" id="think-concept-scroll"></div></div></div>';
  h+='<button class="bv-clear-all" id="think-clear-all" title="Clear" style="opacity:.4">\u00D7</button>';
  h+='<div id="think-anim-mount" style="margin-left:auto;display:flex;align-items:center;gap:10px"><span id="think-stats" style="font-family:\'Cinzel\',serif;font-size:11px;color:#A0AEC0;letter-spacing:.06em">'+(s.concepts_with_figures||0)+' concepts / '+(s.figures_tagged||0)+' tagged</span></div>';
  h+='</div>';
  h+='<div id="think-legend">';
  Object.keys(ROLE_COLORS).forEach(function(role){
    h+='<span class="think-legend-item"><span class="think-legend-dot" style="background:'+ROLE_COLORS[role]+'"></span>'+role.charAt(0).toUpperCase()+role.slice(1)+'</span>';
  });
  h+='</div>';
  h+='<div id="think-definition" style="display:none"></div>';
  h+='<div id="think-canvas-wrap"><div id="think-canvas"></div></div>';
  view.innerHTML=h;
  _buildConceptPanel();
  var cBtn=document.getElementById('think-concept-btn'),cPanel=document.getElementById('think-concept-panel');
  cBtn.addEventListener('click',function(e){e.stopPropagation();cPanel.classList.toggle('open');
    if(cPanel.classList.contains('open')){var si=document.getElementById('think-concept-search');if(si)si.focus();}});
  document.getElementById('think-concept-search').addEventListener('input',_buildConceptPanel);
  document.addEventListener('click',function(e){if(cPanel&&!cPanel.contains(e.target)&&e.target!==cBtn&&!cBtn.contains(e.target)) cPanel.classList.remove('open');});
  document.getElementById('think-clear-all').addEventListener('click',function(e){e.stopPropagation();if(_thinkAnim.mode!=='stopped')_thinkAnimStop();_selConceptSlug=null;_syncConceptBtn();_buildConceptPanel();_renderCanvas();});
  // Mount anim pill
  var animMount=document.getElementById('think-anim-mount');
  if(animMount&&window.AnimControls){
    _thinkAnimCtl=window.AnimControls.create({
      mountEl:animMount,idPrefix:'think',initialSpeed:'1x',
      onPlay:_thinkAnimPlay,onPause:_thinkAnimPause,onStop:_thinkAnimStop,
      onSpeedChange:function(ms){_thinkAnim.speedMs=ms;if(_thinkAnim.timer){clearInterval(_thinkAnim.timer);_thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);}}
    });
  }

  if(typeof _showViewDesc==='function') _showViewDesc('Select a thought to find all related figures and the roles they played');
  _renderCanvas();
}

function _booksForSlug(slug){
  if(!_booksData||!_booksData.books) return[];
  return _booksData.books.filter(function(b){return b.slug===slug;});
}

function _findRelations(slugSet){
  if(typeof PEOPLE==='undefined') return[];
  var lines=[];
  PEOPLE.forEach(function(p){
    if(!p.slug||!slugSet.has(p.slug)) return;
    (p.teachers||[]).forEach(function(tName){
      var tp=PEOPLE.find(function(pp){return pp.famous===tName;});
      if(tp&&tp.slug&&slugSet.has(tp.slug)) lines.push({from:p.slug,to:tp.slug,type:'TEACHER'});
    });
    (p.relations||[]).forEach(function(r){
      var rp=PEOPLE.find(function(pp){return pp.famous===r.person;});
      if(rp&&rp.slug&&slugSet.has(rp.slug)) lines.push({from:p.slug,to:rp.slug,type:(r.relation||'RELATED').toUpperCase()});
    });
  });
  return lines;
}

function _renderCanvas(){
  var canvas=document.getElementById('think-canvas'),defEl=document.getElementById('think-definition'),statsEl=document.getElementById('think-stats');
  if(!canvas) return;
  var concept=_selConceptSlug?(_data.concepts||[]).find(function(c){return c.slug===_selConceptSlug;}):null;
  if(!concept){
    canvas.innerHTML='<div class="think-empty">Pick a concept above to see its journey through history.</div>';
    if(defEl) defEl.style.display='none';
    var s=_data.stats||{};if(statsEl) statsEl.textContent=(s.concepts_with_figures||0)+' concepts / '+(s.figures_tagged||0)+' tagged';
    return;
  }
  if(defEl){defEl.textContent=concept.definition||'';defEl.style.display=concept.definition?'':'none';}
  var figs=(concept.figures||[]).slice().sort(function(a,b){return(a.dob||0)-(b.dob||0);});
  if(statsEl) statsEl.textContent=_esc(concept.name)+' \u2014 '+figs.length+' figures';

  var allBooks=[];
  var slugSet=new Set(),figBySlug={};
  figs.forEach(function(f){slugSet.add(f.slug);figBySlug[f.slug]=f;
    _booksForSlug(f.slug).forEach(function(b){
      allBooks.push({book:b,yr:b.year!=null?b.year:(f.dod||f.dob+70),hasYear:b.year!=null,authorSlug:f.slug});
    });
  });
  allBooks.sort(function(a,b){return a.yr-b.yr;});
  var rels=_findRelations(slugSet);

  // Merge events, sort, assign Y with min gap (density-adaptive)
  var events=[];
  figs.forEach(function(f,i){events.push({type:'fig',yr:f.dob||600,f:f,idx:i});});
  allBooks.forEach(function(b,i){events.push({type:'book',yr:b.yr,b:b,idx:i});});
  events.sort(function(a,b){return a.yr-b.yr||(a.type==='fig'?-1:1);});

  var ROW_H=44,PAD=30,STEM_X=500,DOT_X=16,LEFT_W=STEM_X-40;
  var yPos=PAD;
  events.forEach(function(ev){ev.y=yPos;yPos+=ROW_H;});
  var totalH=yPos+PAD;

  var figYMap={};
  events.forEach(function(ev){if(ev.type==='fig') figYMap[ev.f.slug]={y:ev.y,f:ev.f};});

  // Role tags
  var roleTags={};
  figs.forEach(function(f){
    var role=(f.role||'transmitter').toLowerCase();
    if(!roleTags[role]) roleTags[role]={role:role,count:0,y:figYMap[f.slug]?figYMap[f.slug].y:0};
    roleTags[role].count++;
  });

  var html='';

  // Thin gold line (school ruler — no glow)
  html+='<div class="tk-stem" style="top:'+(PAD-10)+'px;height:'+(totalH-PAD*2+20)+'px"></div>';

  // Year labels — only where an event sits, plain muted text
  var lastYrY=-999;
  events.forEach(function(ev){
    var midY=ev.y+ROW_H/2;
    if(midY-lastYrY<ROW_H) return;
    var yrTxt=ev.yr<0?Math.abs(ev.yr)+' BCE':String(ev.yr);
    html+='<div class="tk-yr-mark tk-anim-el" data-y="'+midY+'" style="top:'+midY+'px">'+yrTxt+'</div>';
    lastYrY=midY;
  });

  // Figure rows (LEFT of line)
  events.forEach(function(ev){
    if(ev.type!=='fig') return;
    var f=ev.f;
    var role=(f.role||'transmitter').toLowerCase();
    var color=ROLE_COLORS[role]||'#999';
    var dates='';if(f.dob)dates+=f.dob;if(f.dod)dates+='\u2013'+f.dod;if(dates)dates+=' CE';
    var midY=ev.y+ROW_H/2;

    html+='<div class="tk-fig-row tk-anim-el" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+ev.y+'px;height:'+ROW_H+'px">';
    html+='<div class="tk-fig-main"><div class="tk-fig-title">'+_esc(f.name)+'</div>';
    if(dates) html+='<div class="tk-fig-meta">'+dates+'</div>';
    html+='</div></div>';
    // Fixed-position role dot at DOT_X
    html+='<div class="tk-role-dot tk-anim-el" data-y="'+midY+'" style="top:'+midY+'px;background:'+color+'"></div>';
    html+='<div class="tk-dash-left tk-anim-el" data-y="'+midY+'" style="top:'+midY+'px"></div>';
  });

  // Book rows (RIGHT of line)
  events.forEach(function(ev){
    if(ev.type!=='book') return;
    var b=ev.b;
    var midY=ev.y+ROW_H/2;
    var marker=b.hasYear?'':'<span class="tk-no-yr">?</span> ';
    html+='<div class="tk-book-row tk-anim-el" data-y="'+midY+'" style="top:'+ev.y+'px;height:'+ROW_H+'px">';
    html+=marker+'<a class="tk-book-link" href="#books" onclick="event.preventDefault();setView(\'books\');return false;">'+_esc(b.book.title)+'</a>';
    html+='</div>';
    html+='<div class="tk-dash-right tk-anim-el" data-y="'+midY+'" style="top:'+midY+'px"></div>';
  });

  // Role tag pop-outs
  Object.keys(roleTags).forEach(function(role){
    var t=roleTags[role];var color=ROLE_COLORS[role]||'#999';var midY=t.y+ROW_H/2;
    html+='<div class="tk-role-tag tk-anim-el" data-y="'+midY+'" style="top:'+midY+'px;border-color:'+color+';color:'+color+'">'+role.toUpperCase()+' ('+t.count+')</div>';
  });

  // Relation curves — overlay SVG, does NOT affect layout flow
  // Endpoints at role-dot center (fixed at DOT_CENTER_X=456)
  // Curves bulge left into the name column's empty space (max to ~100px from left edge)
  // Cap at 20 relations to prevent visual chaos
  var DOT_CENTER_X=456;
  var maxRels=20;
  var svgPaths='';
  var sortedRels=rels.slice().sort(function(a,b){
    var da=figYMap[a.from]&&figYMap[a.to]?Math.abs(figYMap[a.to].y-figYMap[a.from].y):0;
    var db=figYMap[b.from]&&figYMap[b.to]?Math.abs(figYMap[b.to].y-figYMap[b.from].y):0;
    return da-db;
  });
  if(sortedRels.length>maxRels) sortedRels=sortedRels.slice(0,maxRels);

  sortedRels.forEach(function(r,ri){
    var a=figYMap[r.from],b=figYMap[r.to];
    if(!a||!b) return;
    var y1=a.y+ROW_H/2,y2=b.y+ROW_H/2;
    // Fan out lanes: each curve bulges to a different depth (100–400px left of dot)
    var bulge=120+ri*18;
    var arcX=DOT_CENTER_X-bulge;
    if(arcX<100) arcX=100;
    var midRelY=(y1+y2)/2;

    // Dash pattern by relation type
    var dashAttr='';
    var rtype=(r.type||'RELATED').toUpperCase();
    if(rtype==='FATHER'||rtype==='SON'||rtype==='MOTHER'||rtype==='DAUGHTER') dashAttr=' stroke-dasharray="6,4"';
    else if(rtype==='UNCLE'||rtype==='NEPHEW'||rtype==='COUSIN') dashAttr=' stroke-dasharray="2,3"';
    else if(rtype!=='TEACHER'&&rtype!=='STUDENT') dashAttr=' opacity="0.18"';

    svgPaths+='<path d="M '+DOT_CENTER_X+' '+y1+' C '+arcX+' '+y1+' '+arcX+' '+y2+' '+DOT_CENTER_X+' '+y2+'" fill="none" stroke="rgba(139,149,165,0.3)" stroke-width="1.2"'+dashAttr+'/>';
    // Inline pill label at curve apex
    var label=rtype;
    var lw=label.length*5+14;
    svgPaths+='<rect x="'+(arcX-lw/2)+'" y="'+(midRelY-7)+'" width="'+lw+'" height="14" rx="7" fill="rgba(14,22,33,0.9)" stroke="rgba(139,149,165,0.2)" stroke-width="0.5"/>';
    svgPaths+='<text x="'+arcX+'" y="'+(midRelY+3)+'" text-anchor="middle" fill="#7A8599" font-family="Source Sans 3,sans-serif" font-size="7" letter-spacing=".04em">'+_esc(label)+'</text>';
  });
  // SVG overlay: absolute, does NOT affect layout. Width matches name column only.
  if(svgPaths) html+='<svg class="tk-rel-svg" style="width:'+STEM_X+'px;height:'+totalH+'px">'+svgPaths+'</svg>';

  // Anim cursor line (hidden until playing)
  html+='<div id="think-cursor" style="position:absolute;left:460px;width:80px;height:2px;background:rgba(212,175,55,0.7);box-shadow:0 0 8px rgba(212,175,55,0.5);z-index:10;display:none;pointer-events:none;top:'+PAD+'px"></div>';

  canvas.style.height=totalH+'px';
  canvas.innerHTML=html;
  _thinkAnim.maxY=totalH;

  // Wire click only (no hover tooltip)
  canvas.querySelectorAll('.tk-fig-row').forEach(function(el){
    var slug=el.dataset.slug;
    el.addEventListener('click',function(){
      if(typeof PEOPLE!=='undefined'){var p=PEOPLE.find(function(pp){return pp.slug===slug;});
        if(p&&typeof jumpTo==='function') jumpTo(p.famous);}
    });
  });
}

// ── Anim functions ──
function _thinkAnimPlay(){
  if(!_selConceptSlug) return;
  var canvas=document.getElementById('think-canvas');
  if(!canvas) return;
  var cursor=document.getElementById('think-cursor');

  if(_thinkAnim.mode==='paused'){
    // Resume from current position
    _thinkAnim.mode='playing';
    if(cursor) cursor.style.display='';
    _thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);
    return;
  }

  // Fresh start — hide all animatable elements
  _thinkAnim.mode='playing';
  _thinkAnim.cursorY=20;
  _thinkAnim.speedMs=_thinkAnimCtl?_thinkAnimCtl.getSpeedMs():1200;
  canvas.querySelectorAll('.tk-anim-el').forEach(function(el){el.style.opacity='0.08';});
  var relSvg=canvas.querySelector('.tk-rel-svg');
  if(relSvg) relSvg.style.opacity='0';
  if(cursor){cursor.style.display='';cursor.style.top='20px';}

  var STEP=4; // px per tick
  _thinkAnim.tick=function(){
    if(_thinkAnim.mode!=='playing') return;
    _thinkAnim.cursorY+=STEP;
    if(_thinkAnim.cursorY>_thinkAnim.maxY){_thinkAnimStop();return;}
    if(cursor) cursor.style.top=_thinkAnim.cursorY+'px';
    // Reveal elements whose data-y <= cursorY
    canvas.querySelectorAll('.tk-anim-el').forEach(function(el){
      var ey=parseFloat(el.dataset.y);
      if(ey<=_thinkAnim.cursorY) el.style.opacity='';
    });
    // Show relation SVG once enough figures revealed
    if(relSvg&&_thinkAnim.cursorY>100) relSvg.style.opacity='';
    // Scroll to follow cursor
    var wrap=document.getElementById('think-canvas-wrap');
    if(wrap) wrap.scrollTop=Math.max(0,_thinkAnim.cursorY-wrap.clientHeight/2);
  };
  _thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);
}

function _thinkAnimPause(){
  _thinkAnim.mode='paused';
  if(_thinkAnim.timer){clearInterval(_thinkAnim.timer);_thinkAnim.timer=null;}
}

function _thinkAnimStop(){
  _thinkAnim.mode='stopped';
  if(_thinkAnim.timer){clearInterval(_thinkAnim.timer);_thinkAnim.timer=null;}
  if(_thinkAnimCtl) _thinkAnimCtl.forceStop();
  // Show all elements
  var canvas=document.getElementById('think-canvas');
  if(canvas) canvas.querySelectorAll('.tk-anim-el').forEach(function(el){el.style.opacity='';});
  var relSvg=canvas&&canvas.querySelector('.tk-rel-svg');
  if(relSvg) relSvg.style.opacity='';
  var cursor=document.getElementById('think-cursor');
  if(cursor) cursor.style.display='none';
}

function _showTooltip(e,f){
  if(!_tooltip){_tooltip=document.createElement('div');_tooltip.className='think-tooltip';document.body.appendChild(_tooltip);}
  var role=(f.role||'transmitter').toLowerCase();var color=ROLE_COLORS[role]||'#999';
  var h='<div class="tt-name">'+_esc(f.name)+'</div>';
  h+='<div class="tt-role" style="color:'+color+'">'+_esc(role)+'</div>';
  if(f.confidence) h+='<div style="font-size:10px;color:#6B7280">confidence: '+_esc(f.confidence)+'</div>';
  if(f.evidence) h+='<div class="tt-evidence">'+_esc(f.evidence)+'</div>';
  _tooltip.innerHTML=h;_tooltip.style.display='block';_moveTooltip(e);
}
function _moveTooltip(e){if(!_tooltip)return;var x=e.clientX+16,y=e.clientY-10;
  if(x+320>window.innerWidth) x=e.clientX-330;_tooltip.style.left=x+'px';_tooltip.style.top=y+'px';}
function _hideTooltip(){if(_tooltip) _tooltip.style.display='none';}

async function initThink(){
  var view=document.getElementById('think-view');if(!view) return;
  view.style.display='flex';view.style.flexDirection='column';
  await _loadData();
  if(!_inited){_buildShell(view);_inited=true;}
}

window._captureState_think=function(){
  var wrap=document.getElementById('think-canvas-wrap');
  return{concept:_selConceptSlug,scrollY:wrap?wrap.scrollTop:0};
};
window._restoreState_think=function(s){
  if(s.concept&&s.concept!==_selConceptSlug){
    _selConceptSlug=s.concept;_syncConceptBtn();_buildConceptPanel();_renderCanvas();
  }
  if(s.scrollY){var wrap=document.getElementById('think-canvas-wrap');if(wrap) wrap.scrollTop=s.scrollY;}
};

(function(){
  if(typeof window.setView!=='function') return;
  var _origSetView=window.setView;
  window.setView=function(v){
    _origSetView(v);
    var tv=document.getElementById('think-view');if(!tv) return;
    if(v==='think'){
      var ip=document.getElementById('infoPanel'),r3=document.getElementById('hdrRow3'),r4=document.getElementById('hdrRow4');
      if(ip) ip.style.display='none';if(r3) r3.style.display='none';if(r4) r4.style.display='none';
      initThink();if(typeof _resizeShell==='function') setTimeout(_resizeShell,20);
    } else {tv.style.display='none';if(_thinkAnim.mode!=='stopped')_thinkAnimStop();_hideTooltip();if(typeof _resizeShell==='function') setTimeout(_resizeShell,20);}
  };
})();
window.initThink=initThink;
})();
