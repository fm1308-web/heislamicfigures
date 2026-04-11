// ═══════════════════════════════════════════════════════════
// THINK VIEW — Concept evolution timeline (5-column vertical)
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _data=null,_booksData=null,_inited=false,_selConceptSlug=null,_tooltip=null;
var _thinkAnimCtl=null,_thinkAnim={mode:'stopped',timer:null,cursorY:0,maxY:0,speedMs:600,tick:null};
var ROLE_COLORS={originator:'#2ECC71',developer:'#3B82F6',critic:'#E24B4A',reviver:'#F59E0B',synthesizer:'#14B8A6',transmitter:'#38BDF8'};
function _hexToRgba(hex,a){var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return 'rgba('+r+','+g+','+b+','+a+')';}
var CATEGORIES=['theology','philosophy','law','mysticism','science','politics','language'];
function _esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

async function _loadData(){
  if(_data) return;
  // Load think_books.json (book-level) + think_roles.json (role lookup) + think.json.old (bookless-author source)
  var raw=null,rolesIdx=null,oldDataIdx={};
  try{var r=await fetch('data/islamic/think.json?v='+Date.now());raw=await r.json();}
  catch(e){_data={concepts:[],stats:{}};return;}
  try{var rr=await fetch('data/islamic/think_roles.json?v='+Date.now());rolesIdx=await rr.json();}
  catch(e){rolesIdx={};}
  try{
    var ro=await fetch('data/islamic/think.json.old?v='+Date.now());
    var oldData=await ro.json();
    (oldData.concepts||[]).forEach(function(c){oldDataIdx[c.slug]=c.figures||[];});
  }catch(e){/* optional fallback data, silent if missing */}
  // Load books.json BEFORE transform so transform can resolve year_display per book id.
  if(!_booksData){
    try{
      if(window._BOOKS_DATA) _booksData=window._BOOKS_DATA;
      else{var r2=await fetch('data/islamic/books.json?v='+Date.now());_booksData=await r2.json();window._BOOKS_DATA=_booksData;}
    }catch(e){_booksData={books:[]};}
  }
  _data=_thinkTransform(raw,rolesIdx||{},oldDataIdx);
}

// Transform think_books.json (+ think.json.old bookless authors) into merged row list.
// Each "figure" entry is either a BOOK ROW (has _book) or an AUTHOR-ONLY ROW (_bookless:true, no _book).
function _thinkTransform(raw,rolesIdx,oldDataIdx){
  oldDataIdx=oldDataIdx||{};
  var out={stats:{},concepts:[]};
  var missingRoles=[];
  var missingYear=[];
  var missingRolesOld=[];
  // Lookup: book_id -> year_display (from books.json, already clamped to author lifespan).
  var _ydById={};
  if(_booksData&&_booksData.books){
    _booksData.books.forEach(function(x){if(x&&x.id&&x.year_display!=null)_ydById[x.id]=x.year_display;});
  }
  (raw.concepts||[]).forEach(function(c){
    var figs=[];
    var authorsWithBooks=new Set();
    // Book rows — one per book
    (c.books||[]).forEach(function(b){
      var sl=b.author_slug||'';
      if(!sl) return;
      authorsWithBooks.add(sl);
      var role=(rolesIdx[c.slug]&&rolesIdx[c.slug][sl])||'transmitter';
      if(!(rolesIdx[c.slug]&&rolesIdx[c.slug][sl])) missingRoles.push(c.slug+'/'+sl);
      var _rawYr=b.year;
      var _yd=(b.book_id&&_ydById[b.book_id]!=null)?_ydById[b.book_id]:null;
      var by=(_yd!=null?_yd:_rawYr);
      var hasYear=(by!=null);
      if(!hasYear){
        by=(b.author_dob!=null?b.author_dob+30:600);
        missingYear.push(c.slug+'/'+b.title);
      }
      figs.push({
        slug:sl,
        name:b.author_name||sl,
        role:role,
        dob:(b.author_dob!=null)?b.author_dob:null,
        dod:(b.author_dod!=null)?b.author_dod:null,
        tradition:b.author_tradition||'',
        type:b.author_type||'',
        _book:{
          id:b.book_id||'',
          title:b.title||'',
          year:by,
          hasYear:hasYear
        }
      });
    });
    // Author-only rows — bookless authors from think.json.old
    var oldFigs=oldDataIdx[c.slug]||[];
    oldFigs.forEach(function(of){
      if(!of.slug||authorsWithBooks.has(of.slug)) return;
      // Role: prefer think_roles.json, fall back to old figure's role, then transmitter
      var role=(rolesIdx[c.slug]&&rolesIdx[c.slug][of.slug])||of.role||'transmitter';
      if(!(rolesIdx[c.slug]&&rolesIdx[c.slug][of.slug])) missingRolesOld.push(c.slug+'/'+of.slug);
      figs.push({
        slug:of.slug,
        name:of.name||of.slug,
        role:(role||'transmitter').toLowerCase(),
        dob:(of.dob!=null)?of.dob:null,
        dod:(of.dod!=null)?of.dod:null,
        tradition:of.tradition||'',
        type:of.type||'',
        _bookless:true
        // no _book field — render will skip the right-side book row for this entry
      });
    });
    out.concepts.push({
      slug:c.slug,
      name:c.name,
      category:c.category,
      definition:c.definition,
      era_start:c.era_start,
      era_end:c.era_end,
      contested:c.contested,
      figure_count:figs.length,
      figures:figs
    });
  });
  var s=raw.stats||{};
  out.stats={
    concepts_with_figures:s.concepts_with_books||0,
    figures_tagged:s.books_tagged||0,
    total_assignments:s.total_assignments||0,
    books_tagged:s.books_tagged||0,
    concepts_with_books:s.concepts_with_books||0
  };
  if(missingRoles.length) console.warn('[THINK] '+missingRoles.length+' book-author pairs missing role — defaulted. First 5:',missingRoles.slice(0,5));
  if(missingYear.length) console.warn('[THINK] '+missingYear.length+' books missing year — fell back. First 5:',missingYear.slice(0,5));
  if(missingRolesOld.length) console.warn('[THINK] '+missingRolesOld.length+' bookless authors from think.json.old missing from think_roles.json — used old-file role or transmitter. First 5:',missingRolesOld.slice(0,5));
  return out;
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
  h+='<span class="think-legend-sep"></span>';
  h+='<span class="think-legend-item"><span class="think-legend-dot" style="background:#111;opacity:1"></span>High</span>';
  h+='<span class="think-legend-item"><span class="think-legend-dot" style="background:#111;opacity:0.6"></span>Medium</span>';
  h+='<span class="think-legend-item"><span class="think-legend-dot" style="background:#111;opacity:0.3"></span>Low</span>';
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
      onSpeedChange:function(ms){_thinkAnim.speedMs=Math.max(30,Math.round(ms/2));if(_thinkAnim.timer){clearInterval(_thinkAnim.timer);_thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);}}
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
  // Each figure is one row: BOOK ROW (has _book) or AUTHOR-ONLY ROW (_bookless:true).
  // Sort by row year: book.year for book rows, author.dob for bookless rows.
  var figs=(concept.figures||[]).slice().sort(function(a,b){
    var ya=a._book?a._book.year:(a.dob||9999);
    var yb=b._book?b._book.year:(b.dob||9999);
    if(ya!==yb) return ya-yb;
    if((a.dob||9999)!==(b.dob||9999)) return(a.dob||9999)-(b.dob||9999);
    return(a.name||'').localeCompare(b.name||'');
  });
  if(statsEl) statsEl.textContent=_esc(concept.name)+' \u2014 '+figs.length+' books';

  var slugSet=new Set();
  figs.forEach(function(f){slugSet.add(f.slug);});
  var rels=_findRelations(slugSet);

  // One event per row. Year = book year for book rows, author dob for bookless rows.
  var events=[];
  figs.forEach(function(f,i){
    var yr=f._book?f._book.year:(f.dob||600);
    events.push({type:'fig',yr:yr,f:f,idx:i});
  });

  var ROW_H=44,PAD=30,STEM_X=500,DOT_X=16,LEFT_W=STEM_X-40;
  var yPos=PAD;
  events.forEach(function(ev){ev.y=yPos;yPos+=ROW_H;});
  var totalH=yPos+PAD;

  // figYMap: first occurrence per author slug (for relation curve anchors)
  var figYMap={};
  events.forEach(function(ev){
    if(ev.type==='fig'&&!figYMap[ev.f.slug]) figYMap[ev.f.slug]={y:ev.y,f:ev.f};
  });

  // Build role band spans — consecutive runs of the same role
  var roleBands=[];
  var figEvents=events.filter(function(ev){return ev.type==='fig';});
  figEvents.forEach(function(ev){
    var role=(ev.f.role||'transmitter').toLowerCase();
    var last=roleBands.length?roleBands[roleBands.length-1]:null;
    if(last&&last.role===role){
      last.endY=ev.y+ROW_H;last.count++;
    } else {
      roleBands.push({role:role,startY:ev.y,endY:ev.y+ROW_H,count:1});
    }
  });

  var html='';

  // Thin gold line (school ruler — no glow)
  html+='<div class="tk-stem" style="top:'+(PAD-10)+'px;height:'+(totalH-PAD*2+20)+'px"></div>';

  // Year labels — only for years that have a connected author or book, deduplicated
  var _connectedYrs={};
  events.forEach(function(ev){
    var yr=ev.yr;
    if(!_connectedYrs[yr]) _connectedYrs[yr]={count:0,midY:ev.y+ROW_H/2};
    _connectedYrs[yr].count++;
  });
  var shownYrs={};
  Object.keys(_connectedYrs).forEach(function(yr){
    if(shownYrs[yr]) return;
    shownYrs[yr]=true;
    var info=_connectedYrs[yr];
    var n=Number(yr);
    var yrTxt=n<0?Math.abs(n)+'<span class="year-era">BCE</span>':n+'<span class="year-era">CE</span>';
    var multi=info.count>1?' year-multi':'';
    html+='<div class="tk-yr-mark tk-anim-el'+multi+'" data-y="'+info.midY+'" style="top:'+info.midY+'px">'+yrTxt+'</div>';
  });

  // Figure rows (LEFT of line)
  events.forEach(function(ev){
    if(ev.type!=='fig') return;
    var f=ev.f;
    var role=(f.role||'transmitter').toLowerCase();
    var color=ROLE_COLORS[role]||'#999';
    var dates='';if(f.dob)dates+=f.dob;if(f.dod)dates+='\u2013'+f.dod;if(dates)dates+=' CE';
    var midY=ev.y+ROW_H/2;
    var booklessStyle=f._bookless?';opacity:0.75':'';

    html+='<div class="tk-fig-row tk-anim-el'+(f._bookless?' tk-fig-bookless':'')+'" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+ev.y+'px;height:'+ROW_H+'px'+booklessStyle+'">';
    html+='<div class="tk-fig-main"><div class="tk-fig-title">'+_esc(f.name)+'</div>';
    if(dates) html+='<div class="tk-fig-meta">'+dates+'</div>';
    html+='</div></div>';
    // Fixed-position role dot at DOT_X
    html+='<div class="tk-role-dot tk-anim-el" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+midY+'px;background:'+color+(f._bookless?';opacity:0.75':'')+'"></div>';
    html+='<div class="tk-dash-left tk-anim-el" data-slug="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+midY+'px'+(f._bookless?';opacity:0.75':'')+'"></div>';
  });

  // Book rows (RIGHT of line) — one per figure row, aligned at the SAME Y
  var BOOK_ROW_H=ROW_H;
  events.forEach(function(ev){
    if(ev.type!=='fig') return;
    var f=ev.f, b=f._book;
    if(!b) return;
    var bkY=ev.y+(ROW_H-BOOK_ROW_H)/2;
    var midY=bkY+BOOK_ROW_H/2;
    var marker=b.hasYear?'':'<span class="tk-no-yr">?</span> ';
    html+='<div class="tk-book-row tk-anim-el" data-author="'+_esc(f.slug)+'" data-y="'+midY+'" style="top:'+bkY+'px;height:'+BOOK_ROW_H+'px;align-items:center">';
    var _bid=_esc(b.id||'');
    var _bookFull=(_booksData&&_booksData.books)?_booksData.books.find(function(x){return x.id===b.id;}):null;
    var _readBtn=(_bookFull&&_bookFull.is_free&&_bookFull.url)?'<a class="tk-book-read" href="'+_esc(_bookFull.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">READ</a>':'';
    html+=marker+'<span class="tk-book-icon">\uD83D\uDCD6</span><a class="tk-book-link" href="#books" data-book-id="'+_bid+'" onclick="event.preventDefault();setView(\'books\');setTimeout(function(){if(window._scrollToBookId)window._scrollToBookId(\''+_bid+'\');},350);return false;">'+_esc(b.title)+'</a>'+_readBtn;
    html+='</div>';
  });

  // LEFT background bands — role spans behind author column
  roleBands.forEach(function(band){
    var color=ROLE_COLORS[band.role]||'#999';
    var h2=band.endY-band.startY;
    html+='<div class="tk-role-band tk-anim-el" data-y="'+band.startY+'" style="top:'+band.startY+'px;height:'+h2+'px;background:linear-gradient(to right,rgba(0,0,0,0) 0%,'+_hexToRgba(color,0.08)+' 20%,'+_hexToRgba(color,0.06)+' 80%,transparent 100%);border-left:3px solid '+_hexToRgba(color,0.5)+'">';
    html+='<span class="tk-role-band-label" style="color:'+_hexToRgba(color,0.85)+'">'+band.role.toUpperCase()+'</span>';
    html+='</div>';
  });

  // RIGHT background bands — era bands behind books column (reuses _BV_ERA_BANDS from books.js)
  var tkEraBands=window._BV_ERA_BANDS||[];
  if(tkEraBands.length&&figEvents.length){
    var firstYr=figEvents[0].yr,lastYr=figEvents[figEvents.length-1].yr;
    // Map year to Y using event positions
    function _tkYrToY(yr){
      if(yr<=firstYr) return figEvents[0].y;
      if(yr>=lastYr) return figEvents[figEvents.length-1].y+ROW_H;
      for(var i=1;i<events.length;i++){
        if(events[i].yr>=yr){
          var prev=events[i-1],cur=events[i];
          if(cur.yr===prev.yr) return cur.y;
          var ratio=(yr-prev.yr)/(cur.yr-prev.yr);
          return prev.y+ratio*(cur.y-prev.y);
        }
      }
      return events[events.length-1].y+ROW_H;
    }
    tkEraBands.forEach(function(era){
      if(era.end<=firstYr||era.start>=lastYr) return;
      var ey1=_tkYrToY(Math.max(era.start,firstYr));
      var ey2=_tkYrToY(Math.min(era.end,lastYr));
      if(ey2-ey1<6) return;
      html+='<div class="tk-era-band tk-anim-el" data-y="'+ey1+'" style="top:'+ey1+'px;height:'+(ey2-ey1)+'px;background:linear-gradient(to right,transparent 15%,rgba('+era.glow+',0.04) 50%,rgba('+era.glow+',0.10) 100%)">';
      html+='<span class="tk-era-band-label" style="color:rgba('+era.glow+',0.85)">'+_esc(era.name)+'</span>';
      html+='<span class="tk-era-band-dates" style="color:rgba('+era.glow+',0.7)">'+era.dates+'</span>';
      html+='</div>';
    });
  }

  // Relation curves — overlay SVG, does NOT affect layout flow
  // Endpoints at role-dot center (fixed at DOT_CENTER_X=456)
  // Curves bulge left into the name column's empty space (max to ~100px from left edge)
  // Cap at 20 relations to prevent visual chaos
  var DOT_CENTER_X=456;
  var maxRels=20;
  var svgDefs='',svgPaths='';
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

    // Role-color tinting
    var roleFrom=(a.f.role||'transmitter').toLowerCase();
    var roleTo=(b.f.role||'transmitter').toLowerCase();
    var colorFrom=ROLE_COLORS[roleFrom]||'#999';
    var colorTo=ROLE_COLORS[roleTo]||'#999';
    var strokeAttr;
    if(roleFrom===roleTo){
      strokeAttr='stroke="'+colorFrom+'" stroke-opacity="0.3"';
    } else {
      var gradId='tk-rg-'+ri;
      var topY=Math.min(y1,y2),botY=Math.max(y1,y2);
      var topColor=y1<y2?colorFrom:colorTo;
      var botColor=y1<y2?colorTo:colorFrom;
      svgDefs+='<linearGradient id="'+gradId+'" x1="0" y1="'+topY+'" x2="0" y2="'+botY+'" gradientUnits="userSpaceOnUse">';
      svgDefs+='<stop offset="0%" stop-color="'+topColor+'" stop-opacity="0.3"/>';
      svgDefs+='<stop offset="100%" stop-color="'+botColor+'" stop-opacity="0.3"/>';
      svgDefs+='</linearGradient>';
      strokeAttr='stroke="url(#'+gradId+')"';
    }

    var curveBottomY=Math.max(y1,y2);
    svgPaths+='<path data-curfew-y="'+curveBottomY+'" d="M '+DOT_CENTER_X+' '+y1+' C '+arcX+' '+y1+' '+arcX+' '+y2+' '+DOT_CENTER_X+' '+y2+'" fill="none" '+strokeAttr+' stroke-width="1.2"'+dashAttr+'/>';
    // Inline pill label at curve apex
    var label=rtype;
    var lw=label.length*5+14;
    svgPaths+='<rect data-curfew-y="'+curveBottomY+'" x="'+(arcX-lw/2)+'" y="'+(midRelY-7)+'" width="'+lw+'" height="14" rx="7" fill="rgba(14,22,33,0.9)" stroke="rgba(139,149,165,0.2)" stroke-width="0.5"/>';
    svgPaths+='<text data-curfew-y="'+curveBottomY+'" x="'+arcX+'" y="'+(midRelY+3)+'" text-anchor="middle" fill="#7A8599" font-family="Source Sans 3,sans-serif" font-size="7" letter-spacing=".04em">'+_esc(label)+'</text>';
  });
  // SVG overlay: absolute, does NOT affect layout. Width matches name column only.
  if(svgPaths||svgDefs) html+='<svg class="tk-rel-svg" style="width:'+STEM_X+'px;height:'+totalH+'px">'+(svgDefs?'<defs>'+svgDefs+'</defs>':'')+svgPaths+'</svg>';

  // Curfew line — full-width, hidden until animate plays, year label rides on right end
  html+='<div id="think-cursor" class="tk-curfew-line" style="display:none;top:'+PAD+'px"><span id="tkAnimateYear" class="tk-curfew-year"></span></div>';

  // Store Y-to-year mapping for animate year label
  _thinkAnim._events=events;
  _thinkAnim._PAD=PAD;
  _thinkAnim._ROW_H=ROW_H;

  canvas.style.height=totalH+'px';
  canvas.innerHTML=html;
  _thinkAnim.maxY=totalH;

  // Author click-to-highlight
  var _selAuthor=null;
  function _clearHighlight(){
    _selAuthor=null;
    canvas.querySelectorAll('.tk-dimmed').forEach(function(el){el.classList.remove('tk-dimmed');});
    canvas.querySelectorAll('.tk-author-selected').forEach(function(el){el.classList.remove('tk-author-selected');});
    // Un-dim SVG connector lines
    canvas.querySelectorAll('line[data-author]').forEach(function(ln){ln.style.opacity='';});
  }
  function _highlightAuthor(slug){
    if(_selAuthor===slug){_clearHighlight();return;}
    _selAuthor=slug;
    // Author rows, dots, dash-left
    canvas.querySelectorAll('.tk-fig-row').forEach(function(el){
      if(el.dataset.slug===slug){el.classList.remove('tk-dimmed');el.classList.add('tk-author-selected');}
      else{el.classList.add('tk-dimmed');el.classList.remove('tk-author-selected');}
    });
    canvas.querySelectorAll('.tk-role-dot').forEach(function(el){
      el.classList.toggle('tk-dimmed',el.dataset.slug!==slug);
    });
    canvas.querySelectorAll('.tk-dash-left').forEach(function(el){
      el.classList.toggle('tk-dimmed',el.dataset.slug!==slug);
    });
    // Book rows
    canvas.querySelectorAll('.tk-book-row').forEach(function(el){
      el.classList.toggle('tk-dimmed',el.dataset.author!==slug);
    });
    // SVG connector lines
    canvas.querySelectorAll('line[data-author]').forEach(function(ln){
      ln.style.opacity=ln.getAttribute('data-author')===slug?'':'0.2';
    });
  }
  canvas.querySelectorAll('.tk-fig-row').forEach(function(el){
    el.addEventListener('click',function(e){
      e.stopPropagation();
      _highlightAuthor(el.dataset.slug);
    });
  });
  // Click empty space to clear
  canvas.addEventListener('click',function(e){
    if(!e.target.closest('.tk-fig-row')&&!e.target.closest('.tk-book-row')){
      _clearHighlight();
    }
  });
}

// ── Y-to-year conversion for animate label ──
function _tkYToYear(cursorY){
  var evts=_thinkAnim._events;
  if(!evts||!evts.length) return null;
  var PAD=_thinkAnim._PAD||30,ROW_H=_thinkAnim._ROW_H||44;
  for(var i=evts.length-1;i>=0;i--){
    if(cursorY>=evts[i].y+ROW_H/2) return evts[i].yr;
  }
  return evts[0].yr;
}
function _tkUpdateYearLabel(yr){
  var el=document.getElementById('tkAnimateYear');
  if(!el) return;
  if(yr==null){el.innerHTML='';return;}
  el.innerHTML=yr<0?Math.abs(yr)+'<span class="year-era">BCE</span>':yr+'<span class="year-era">CE</span>';
}

// ── Anim functions ──
function _thinkAnimPlay(){
  if(!_selConceptSlug) return;
  var canvas=document.getElementById('think-canvas');
  if(!canvas) return;
  var cursor=document.getElementById('think-cursor');

  if(_thinkAnim.mode==='paused'){
    _thinkAnim.mode='playing';
    if(cursor) cursor.style.display='';
    _thinkAnim.timer=setInterval(_thinkAnim.tick,_thinkAnim.speedMs);
    return;
  }

  // Fresh start — hide ALL HTML elements and ALL SVG children
  _thinkAnim.mode='playing';
  _thinkAnim.cursorY=_thinkAnim._PAD||20;
  _thinkAnim.speedMs=_thinkAnimCtl?Math.max(30,Math.round(_thinkAnimCtl.getSpeedMs()/2)):600;
  // Hide HTML elements via class
  canvas.querySelectorAll('.tk-anim-el').forEach(function(el){el.classList.add('tk-hidden-by-curfew');});
  // Hide every individual SVG child element (lines, paths, rects, text, circles)
  canvas.querySelectorAll('svg [data-curfew-y]').forEach(function(el){
    var orig=el.getAttribute('opacity');
    if(orig!==null&&orig!=='0') el.setAttribute('data-orig-opacity',orig);
    el.setAttribute('opacity','0');
  });
  if(cursor){cursor.style.display='';cursor.style.top=_thinkAnim.cursorY+'px';}

  var STEP=4;
  _thinkAnim.tick=function(){
    if(_thinkAnim.mode!=='playing') return;
    _thinkAnim.cursorY+=STEP;
    if(_thinkAnim.cursorY>_thinkAnim.maxY){_thinkAnimStop();return;}
    if(cursor) cursor.style.top=_thinkAnim.cursorY+'px';
    // Reveal HTML elements whose data-y <= cursorY
    canvas.querySelectorAll('.tk-hidden-by-curfew').forEach(function(el){
      var ey=parseFloat(el.dataset.y);
      if(!isNaN(ey)&&ey<=_thinkAnim.cursorY) el.classList.remove('tk-hidden-by-curfew');
    });
    // Reveal individual SVG children whose data-curfew-y <= cursorY
    canvas.querySelectorAll('svg [data-curfew-y]').forEach(function(el){
      if(el.getAttribute('opacity')==='0'){
        var cy=parseFloat(el.getAttribute('data-curfew-y'));
        if(!isNaN(cy)&&cy<=_thinkAnim.cursorY){
          var orig=el.getAttribute('data-orig-opacity');
          if(orig) el.setAttribute('opacity',orig);
          else el.removeAttribute('opacity');
        }
      }
    });
    // Update running year label
    _tkUpdateYearLabel(_tkYToYear(_thinkAnim.cursorY));
    // Scroll to follow curfew
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
  var canvas=document.getElementById('think-canvas');
  if(canvas){
    // Reveal all HTML elements
    canvas.querySelectorAll('.tk-hidden-by-curfew').forEach(function(el){el.classList.remove('tk-hidden-by-curfew');});
    // Reveal all SVG children — restore original opacity
    canvas.querySelectorAll('svg [data-curfew-y]').forEach(function(el){
      if(el.getAttribute('opacity')==='0'){
        var orig=el.getAttribute('data-orig-opacity');
        if(orig) el.setAttribute('opacity',orig);
        else el.removeAttribute('opacity');
      }
    });
  }
  var cursor=document.getElementById('think-cursor');
  if(cursor) cursor.style.display='none';
  _tkUpdateYearLabel(null);
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
