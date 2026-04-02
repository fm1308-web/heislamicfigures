/* ═══════════════════════════════════════════════════════════
   ONE VIEW — Single-page-per-figure deep profile
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── State ── */
var _inited = false;
var _selected = [];
var _addMode = false;   // "+" button toggled: next click adds to selection
var _oneSearch = '';
var _oneTypes = new Set();
var _oneTrads = new Set();
var _oneEras = new Set();
var _oneCents = new Set();
var _oneCities = new Set();

/* ── Era definitions ── */
var _ERA_DEFS=[
  {label:'Prophetic Era (pre-632)',   min:-Infinity, max:632},
  {label:'Rashidun (632\u2013661)',   min:632, max:661},
  {label:'Umayyad (661\u2013750)',    min:661, max:750},
  {label:'Abbasid Golden Age (750\u20131258)', min:750, max:1258},
  {label:'Post-Mongol (1258\u20131500)',       min:1258, max:1500},
  {label:'Gunpowder Empires (1500\u20131800)', min:1500, max:1800},
  {label:'Colonial & Reform (1800\u20131950)', min:1800, max:1950},
  {label:'Contemporary (1950\u20132025)',      min:1950, max:2025}
];
var _CENT_OPTIONS=[];
(function(){for(var i=6;i<=21;i++) _CENT_OPTIONS.push(i);})();

/* ── Helpers ── */
function _e(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function _typeColor(p){
  if(typeof _markerTypeColor==='function') return _markerTypeColor(p);
  var t=p.type||'';
  if(t==='Prophet'||t==='Genealogy'||t==='Founder') return '#e8c050';
  if(t==='Sahaba'||t==='Sahabiyya') return '#d4784a';
  if(t==="Tabi'un") return '#c08850';
  if(t==='Mystic') return '#a855f7';
  if(t==='Ruler'||t==='Caliph'||t==='Warrior') return '#e05040';
  if(t==='Scientist'||t==='Philosopher') return '#38bdf8';
  if(t==='Poet') return '#e07090';
  return '#2ecc9b';
}

function _safe(s){ return (s||'').replace(/'/g,"\\'"); }

function _getUniqueTypes(){
  var s=new Set(); PEOPLE.forEach(function(p){ if(p.type) s.add(p.type); });
  return Array.from(s).sort();
}
function _getUniqueTrads(){
  var s=new Set(); PEOPLE.forEach(function(p){ if(p.tradition) s.add(p.tradition); });
  return Array.from(s).sort();
}
function _getUniqueCities(){
  var s=new Set(); PEOPLE.forEach(function(p){ if(p.city) s.add(p.city); });
  return Array.from(s).sort();
}
function _dobInEra(dob,era){
  return dob>=era.min && dob<era.max;
}
function _dobInCent(dob,c){
  // century c: e.g. 6 means 500-599
  return dob>=(c-1)*100 && dob<c*100;
}

/* ── Filtered + sorted people ── */
function _getFilteredPeople(){
  var arr=PEOPLE.slice();
  if(_oneTypes.size>0) arr=arr.filter(function(p){ return _oneTypes.has(p.type); });
  if(_oneTrads.size>0) arr=arr.filter(function(p){ return _oneTrads.has(p.tradition); });
  if(_oneCities.size>0) arr=arr.filter(function(p){ return _oneCities.has(p.city); });
  if(_oneEras.size>0) arr=arr.filter(function(p){
    if(p.dob==null) return false;
    for(var i=0;i<_ERA_DEFS.length;i++){
      if(_oneEras.has(_ERA_DEFS[i].label)&&_dobInEra(p.dob,_ERA_DEFS[i])) return true;
    }
    return false;
  });
  if(_oneCents.size>0) arr=arr.filter(function(p){
    if(p.dob==null) return false;
    var found=false;
    _oneCents.forEach(function(c){ if(_dobInCent(p.dob,c)) found=true; });
    return found;
  });
  if(_oneSearch){
    var q=_oneSearch.toLowerCase();
    arr=arr.filter(function(p){
      var vars=window._NAME_VARIANTS&&p.slug?window._NAME_VARIANTS[p.slug]||[]:[];
      var hay=[p.famous,p.full,p.primaryTitle,p.titles||'',p.city,p.classif,p.tradition,p.type].concat(p.tags||[]).concat(vars).join(' ').toLowerCase();
      return hay.indexOf(q)!==-1;
    });
  }
  arr.sort(function(a,b){
    // Always sort Prophet Muhammad first when search matches muhammad/prophet variants
    if(_oneSearch){
      var q=_oneSearch.toLowerCase();
      var muhTerms=['muhammad','mohammed','mohamed','muhammed','mohamad','mohammad','prophet','nabi','rasul','mustafa'];
      var isMuhQ=muhTerms.some(function(t){ return q.indexOf(t)!==-1 || t.indexOf(q)!==-1; });
      if(isMuhQ){
        if(a.slug==='F1132') return -1;
        if(b.slug==='F1132') return 1;
      }
    }
    return (a.famous||'').localeCompare(b.famous||'');
  });
  return arr;
}

/* ═══════════════════════════════════════════════════════════
   initOne
   ═══════════════════════════════════════════════════════════ */
function initOne(){
  if(_inited){ return; }
  _inited=true;

  var container=document.getElementById('one-view');
  if(!container) return;

  // Force hide hdrRow3 (events.js override may re-show it)
  var r3=document.getElementById('hdrRow3'); if(r3) r3.style.display='none';

  // Build dropdown items
  var erasHtml=_ERA_DEFS.map(function(e){
    return '<div class="one-dd-item" data-val="'+_e(e.label)+'" onclick="window._oneToggleEra(\''+_safe(e.label)+'\')"><div class="one-dd-ck"></div><span>'+_e(e.label)+'</span></div>';
  }).join('');
  var centsHtml=_CENT_OPTIONS.map(function(c){
    return '<div class="one-dd-item" data-val="'+c+'" onclick="window._oneToggleCent('+c+')"><div class="one-dd-ck"></div><span>'+_centStr(c)+' Century</span></div>';
  }).join('');
  var citiesHtml=_getUniqueCities().map(function(c){
    return '<div class="one-dd-item" data-val="'+_e(c)+'" onclick="window._oneToggleCity(\''+_safe(c)+'\')"><div class="one-dd-ck"></div><span>'+_e(c)+'</span></div>';
  }).join('');
  var typesHtml=_getUniqueTypes().map(function(t){
    return '<div class="one-dd-item" data-val="'+_e(t)+'" onclick="window._oneToggleType(\''+_safe(t)+'\')"><div class="one-dd-ck"></div><span>'+_e(t)+'</span></div>';
  }).join('');
  var tradsHtml=_getUniqueTrads().map(function(t){
    return '<div class="one-dd-item" data-val="'+_e(t)+'" onclick="window._oneToggleTrad(\''+_safe(t)+'\')"><div class="one-dd-ck"></div><span>'+_e(t)+'</span></div>';
  }).join('');

  container.innerHTML=
    /* ── ROW 1: topbar ── */
    '<div id="one-topbar">'+
      '<div class="one-tb-left">'+
        '<input id="oneSearch" type="text" placeholder="Search figures..." oninput="window._oneSearchChanged(this.value)">'+
        _ddWrap('oneEraPanel','ERA',erasHtml,'window._oneClearEras()','oneEraBtn')+
        _ddWrap('oneCentPanel','CENTURY',centsHtml,'window._oneClearCents()','oneCentBtn')+
        _ddWrap('oneCityPanel','CITY',citiesHtml,'window._oneClearCities()','oneCityBtn')+
        _ddWrap('oneTypePanel','TYPE',typesHtml,'window._oneClearTypes()','oneTypeBtn')+
        _ddWrap('oneTradPanel','TRADITION',tradsHtml,'window._oneClearTrads()','oneTradBtn')+
      '</div>'+
      '<div class="one-tb-right">'+
        '<span id="oneSelectedCount"></span>'+
        '<button class="one-add-btn" id="oneAddBtn" onclick="window._oneToggleAdd()" title="Click then pick a name to compare (max 3)">+</button>'+
        '<button class="one-dd-btn" id="oneClearBtn" style="display:none" onclick="window._oneClearAll()">\u2715 CLEAR</button>'+
      '</div>'+
    '</div>'+
    /* ── ROW 2: alphabet letter dropdowns ── */
    '<div id="one-alpha-row"></div>'+
    /* ── Main content ── */
    '<div id="one-main"></div>';

  // Close dropdowns on outside click
  document.addEventListener('click',function(e){
    if(!e.target.closest('.one-dd-wrap') && !e.target.closest('.one-letter-dd-wrap')){
      document.querySelectorAll('.one-dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
      _closeLetterDD();
    }
  });

  _renderAlpha();
}
window.initOne=initOne;

/* ── dropdown builder helper ── */
function _ddWrap(panelId,label,itemsHtml,clearFn,btnId){
  return '<div class="one-dd-wrap">'+
    '<button class="one-dd-btn" id="'+btnId+'" data-label="'+_e(label)+'" onclick="window._oneToggleDD(\''+panelId+'\')"><span class="one-dd-btn-text">'+label+'</span> <span class="dd-caret">\u25BE</span></button>'+
    '<div class="one-dd-panel" id="'+panelId+'">'+
      '<div class="one-dd-item one-dd-all" onclick="'+clearFn+'"><div class="one-dd-ck">\u2713</div><span>All</span></div>'+
      itemsHtml+
    '</div>'+
  '</div>';
}

/* ═══════════════════════════════════════════════════════════
   _renderAlpha — alphabet row with letter dropdowns
   ═══════════════════════════════════════════════════════════ */
var _openLetter=null; // currently open letter dropdown

function _renderAlpha(){
  var people=_getFilteredPeople();
  _cachedFiltered=people; // cache for letter DD rendering

  // Group by first letter
  var groups={};
  people.forEach(function(p){
    var l=(p.famous||'A')[0].toUpperCase();
    if(!groups[l]) groups[l]=[];
    groups[l].push(p);
    // Dual-list Prophet Muhammad under M as well as P
    if(p.slug==='F1132' && l!=='M'){
      if(!groups['M']) groups['M']=[];
      groups['M'].unshift(p); // first in M
    }
  });

  var row=document.getElementById('one-alpha-row');
  if(!row) return;
  var letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  var html='';
  letters.forEach(function(l){
    var n=(groups[l]||[]).length;
    var cls='one-letter'+(n===0?' empty':'');
    html+='<span class="one-letter-dd-wrap"><span class="'+cls+'" data-letter="'+l+'" onclick="window._oneToggleLetter(\''+l+'\')">'+l+' <span class="one-letter-n">('+n+')</span></span></span>';
  });
  html+='<span class="one-alpha-total">'+people.length+' figures</span>';
  row.innerHTML=html;

  // If a letter DD was open, refresh it
  if(_openLetter && groups[_openLetter]) _showLetterDD(_openLetter);
  else _openLetter=null;

  _syncUI();
  _syncFilterBtns();
}
var _cachedFiltered=[];

function _closeLetterDD(){
  _openLetter=null;
  document.querySelectorAll('.one-letter-dd-panel').forEach(function(p){ p.remove(); });
  document.querySelectorAll('.one-letter.active').forEach(function(l){ l.classList.remove('active'); });
}

function _showLetterDD(letter){
  // Remove any existing
  document.querySelectorAll('.one-letter-dd-panel').forEach(function(p){ p.remove(); });
  document.querySelectorAll('.one-letter.active').forEach(function(l){ l.classList.remove('active'); });

  var people=_cachedFiltered.filter(function(p){ return (p.famous||'A')[0].toUpperCase()===letter; });
  // Dual-list Prophet Muhammad under M
  if(letter==='M'){
    var hasProphet=people.some(function(p){ return p.slug==='F1132'; });
    if(!hasProphet){
      var pm=_cachedFiltered.filter(function(p){ return p.slug==='F1132'; })[0];
      if(pm) people.unshift(pm); // first in M list
    }
  }
  if(!people.length) return;

  // Find the wrap element
  var wraps=document.querySelectorAll('.one-letter-dd-wrap');
  var wrap=null;
  wraps.forEach(function(w){ if(w.querySelector('[data-letter="'+letter+'"]')) wrap=w; });
  if(!wrap) return;
  wrap.querySelector('.one-letter').classList.add('active');

  var panel=document.createElement('div');
  panel.className='one-letter-dd-panel';
  // Search within letter
  panel.innerHTML='<input class="one-letter-dd-search" type="text" placeholder="Filter '+letter+'..." oninput="window._oneFilterLetterDD(this)">';
  people.forEach(function(p){
    var col=_typeColor(p);
    var sel=_selected.indexOf(p.famous)!==-1;
    var div=document.createElement('div');
    div.className='one-dd-name-row'+(sel?' sel':'');
    div.dataset.name=p.famous;
    div.style.borderLeftColor=col;
    div.innerHTML='<span class="one-dd-name-text">'+_e(p.famous)+'</span><span class="one-dd-name-type">'+_e(p.type||'')+'</span>';
    div.addEventListener('click',function(e){
      // Shift-click for compare
      if(e.shiftKey){
        var idx=_selected.indexOf(p.famous);
        if(idx!==-1) _selected.splice(idx,1);
        else if(_selected.length<3) _selected.push(p.famous);
      } else {
        window._oneClickName(p.famous);
      }
      _closeLetterDD();
      _syncUI(); _renderMain();
    });
    panel.appendChild(div);
  });

  wrap.appendChild(panel);
  // Check right-edge overflow
  var rect=panel.getBoundingClientRect();
  if(rect.right>window.innerWidth){
    panel.style.left='auto';
    panel.style.right='0';
  }
  _openLetter=letter;
}

/* ── Sync filter button indicators ── */
function _syncFilterBtns(){
  var map=[
    {btnId:'oneEraBtn',set:_oneEras},
    {btnId:'oneCentBtn',set:_oneCents},
    {btnId:'oneCityBtn',set:_oneCities},
    {btnId:'oneTypeBtn',set:_oneTypes},
    {btnId:'oneTradBtn',set:_oneTrads}
  ];
  map.forEach(function(m){
    var btn=document.getElementById(m.btnId);
    if(!btn) return;
    var label=btn.dataset.label||'';
    var n=m.set.size;
    var textEl=btn.querySelector('.one-dd-btn-text');
    if(n>0){
      btn.classList.add('filtered');
      if(textEl) textEl.innerHTML=label+' <span class="one-dd-dot">\u25CF</span> ('+n+')';
    } else {
      btn.classList.remove('filtered');
      if(textEl) textEl.textContent=label;
    }
  });
}

/* ═══════════════════════════════════════════════════════════
   _syncUI — update selection count, + btn, clear btn
   ═══════════════════════════════════════════════════════════ */
function _syncUI(){
  var cnt=document.getElementById('oneSelectedCount');
  if(cnt){
    if(_selected.length===0) cnt.innerHTML='<span class="one-hint">click a name to begin</span>';
    else if(_selected.length===1) cnt.innerHTML='1 SELECTED <span class="one-hint">\u00B7 to compare, click +</span>';
    else if(_selected.length===2) cnt.innerHTML='2 SELECTED \u00B7 <span class="one-sel-note">comparing</span>';
    else cnt.innerHTML='3 SELECTED \u00B7 <span class="one-sel-note">max reached</span>';
  }
  var clr=document.getElementById('oneClearBtn');
  if(clr) clr.style.display=_selected.length>=1?'':'none';
  var addBtn=document.getElementById('oneAddBtn');
  if(addBtn){
    addBtn.classList.toggle('filtered',_addMode);
    addBtn.style.display=_selected.length>=3?'none':'';
  }

  // Sync name rows in any open letter DD
  document.querySelectorAll('.one-dd-name-row').forEach(function(r){
    r.classList.toggle('sel',_selected.indexOf(r.dataset.name)!==-1);
  });
}

/* ═══════════════════════════════════════════════════════════
   _oneClickName — handles normal click and + mode
   ═══════════════════════════════════════════════════════════ */
window._oneClickName=function(name){
  if(!PEOPLE.find(function(p){return p.famous===name;})) return;
  if(_addMode){
    var idx=_selected.indexOf(name);
    if(idx!==-1){ _selected.splice(idx,1); }
    else if(_selected.length<3){ _selected.push(name); }
    _addMode=false;
  } else {
    _selected=[name];
  }
  _closeLetterDD();
  _syncUI();
  _renderMain();
  if(!window._popstateInProgress&&_selected.length===1){
    history.pushState({view:'one',figure:name},'','#one/'+encodeURIComponent(name));
  }
};

/* ═══════════════════════════════════════════════════════════
   _renderMain
   ═══════════════════════════════════════════════════════════ */
function _renderMain(){
  var main=document.getElementById('one-main');
  if(!main) return;

  if(!_selected.length){
    main.className='';
    main.innerHTML='<div class="one-empty"><div class="one-empty-icon">\u263D</div><div>Select a figure from the strip above</div></div>';
    return;
  }

  var n=Math.min(_selected.length,3);
  main.className='one-cols-'+n;
  main.innerHTML='<div class="one-loading">Loading\u2026</div>';

  var promises=_selected.map(function(name){
    var p=PEOPLE.find(function(pp){return pp.famous===name;});
    if(!p) return Promise.resolve(null);
    if(typeof _ensureDetails==='function') return _ensureDetails(p).then(function(){return p;});
    return Promise.resolve(p);
  });

  Promise.all(promises).then(function(persons){
    main.innerHTML='';
    persons.forEach(function(p){
      if(!p) return;
      var col=document.createElement('div');
      col.className='one-col';
      main.appendChild(col);
      _renderPerson(p,col);
    });
  });
}

/* ═══════════════════════════════════════════════════════════
   _renderPerson — THE CORE
   ═══════════════════════════════════════════════════════════ */
async function _renderPerson(p,container){
  if(typeof _ensureDetails==='function') await _ensureDetails(p);

  var col=_typeColor(p);
  var dob_s=p.dob!=null?(p.dob<0?Math.abs(p.dob)+' BCE':p.dob+' CE'):'Unknown';
  var dod_s=p.dod!=null?(p.dod<0?Math.abs(p.dod)+' BCE':p.dod+' CE'):'Unknown';
  var age=(p.dob!=null&&p.dod!=null)?(p.dod-p.dob):null;
  var cent=p.dob!=null?_centStr(Math.ceil(p.dob/100)):'';
  var isFav=APP.Favorites?APP.Favorites.has(p.famous):false;
  var imgId='one-img-'+Math.random().toString(36).substr(2,8);

  var h='';

  /* ── PREV / NEXT NAV ── */
  if(_selected.length===1){
    var _fp=_getFilteredPeople();
    var _ci=_fp.findIndex(function(x){return x.famous===p.famous;});
    var _prevN=_ci>0?_fp[_ci-1].famous:null;
    var _nextN=_ci>=0&&_ci<_fp.length-1?_fp[_ci+1].famous:null;
    h+='<div class="one-nav-bar">';
    if(_prevN) h+='<span class="one-nav-arrow" onclick="window._oneClickName(\''+_safe(_prevN)+'\')">\u2190 '+_e(_prevN)+'</span>';
    else h+='<span class="one-nav-arrow disabled"></span>';
    h+='<span class="one-nav-pos">'+(_ci+1)+' / '+_fp.length+'</span>';
    if(_nextN) h+='<span class="one-nav-arrow" onclick="window._oneClickName(\''+_safe(_nextN)+'\')">' +_e(_nextN)+' \u2192</span>';
    else h+='<span class="one-nav-arrow disabled"></span>';
    h+='</div>';
  }

  /* ── HERO ── */
  h+='<div class="one-hero">';
  if(canShowImage(p)){
    h+='<img id="'+imgId+'" class="one-hero-img" style="display:none" alt="'+_e(p.famous)+'" onerror="this.style.display=\'none\'">';
  }
  h+='<div class="one-hero-text">';
  h+='<div class="one-famous" style="color:'+col+'">'+_e(p.famous);
  h+=' <button class="one-fav-btn" data-name="'+_e(p.famous)+'" onclick="window._oneToggleFav(this)" style="color:'+(isFav?'#D4AF37':'rgba(245,240,232,0.25)')+'">'+( isFav?'\u2605':'\u2606')+'</button>';
  h+='</div>';
  if(p.full&&p.full!==p.famous) h+='<div class="one-full">'+_e(p.full)+'</div>';
  if(p.primaryTitle) h+='<div class="one-primary">'+_e(p.primaryTitle)+'</div>';
  // Tags
  h+='<div class="one-chips-row">';
  if(p.type) h+='<span class="one-tag hi">'+_e(p.type)+'</span>';
  if(p.tradition) h+='<span class="one-tag hi">'+_e(p.tradition)+'</span>';
  if(p.city) h+='<span class="one-tag">\uD83D\uDCCD '+_e(p.city)+'</span>';
  if(p.lang) h+='<span class="one-tag">\uD83C\uDF10 '+_e(p.lang)+'</span>';
  if(p.classif) h+='<span class="one-tag">'+_e(p.classif)+'</span>';
  if(p.tags&&p.tags.length) p.tags.forEach(function(t){ h+='<span class="one-tag gold">'+_e(t)+'</span>'; });
  h+='</div>';
  // Dates
  h+='<div class="one-dates">';
  h+='<span class="one-date"><span class="one-dl">BORN</span><span class="one-dv" style="color:'+col+'">'+dob_s+'</span></span>';
  h+='<span class="one-date"><span class="one-dl">DIED</span><span class="one-dv" style="color:'+col+'">'+dod_s+'</span></span>';
  if(age!==null) h+='<span class="one-date"><span class="one-dl">AGE</span><span class="one-dv">'+age+'</span></span>';
  if(cent) h+='<span class="one-date"><span class="one-dl">CENTURY</span><span class="one-dv">'+cent+'</span></span>';
  h+='</div>';
  h+='</div></div>'; // hero-text, hero

  /* ── SECTION 1: BIOGRAPHY ── */
  var bio=(p.famous==='Prophet Muhammad')?(p.school||'The Last Prophet'):p.school;
  if(bio){
    h+=_sec('\uD83D\uDCDC','Biography',0,'<div class="one-bio">'+bio+'</div>',true);
  }

  /* ── SECTION 2: QURANIC REFERENCES ── */
  if(p.quranRef||p.quran_refs){
    var qh='';
    if(p.quranRef){
      var qr=p.quranRef;
      if(typeof qr==='object'&&qr.count!=null){
        qh+='<div class="one-quran-count">'+qr.count+'\u00D7</div>';
        qh+='<div class="one-quran-sub">mentioned in the Quran</div>';
        if(qr.firstVerse) qh+='<a href="'+_e(qr.url||'')+'" target="_blank" rel="noopener" class="one-quran-link">First verse: '+_e(qr.firstVerse)+' \u2197</a>';
        if(qr.epithet) qh+='<div class="one-quran-epithet">'+_e(qr.epithet)+'</div>';
      } else {
        qh+='<div>'+_e(String(qr))+'</div>';
      }
    } else if(p.quran_refs){
      qh+='<div>'+_e(p.quran_refs)+'</div>';
      if(p.quran_link) qh+='<a href="'+_e(p.quran_link)+'" target="_blank" rel="noopener" class="one-quran-link">Open in Quran.com \uD83C\uDF10</a>';
    }
    if(p.quranDetail) qh+='<div class="one-quran-detail">'+_e(p.quranDetail)+'</div>';
    h+=_sec('\uD83D\uDD4C','Quranic References',0,qh,false);
  }

  /* ── SECTION 3: QUOTES ── */
  if(p.quotes&&p.quotes.length){
    var quotesH=p.quotes.map(function(q){
      return '<div class="one-quote">'+_e(q)+'</div>';
    }).join('');
    h+=_sec('\uD83D\uDCAC','In Their Own Words',p.quotes.length,quotesH,false);
  }

  /* ── SECTION 4: TEACHERS & STUDENTS ── */
  var teachers=(p.famous!=='Prophet Muhammad'&&p.teachers&&p.teachers.length)?p.teachers:[];
  var studentsOf=PEOPLE.filter(function(s){return s.teachers&&s.teachers.indexOf(p.famous)!==-1;});
  if(teachers.length||studentsOf.length){
    var tsH='';
    if(teachers.length){
      tsH+='<div class="one-sub-label">TEACHERS ('+teachers.length+')</div><div class="one-chip-wrap">';
      teachers.forEach(function(t){
        var tp=PEOPLE.find(function(pp){return pp.famous===t;});
        var tc=tp?_typeColor(tp):'#888';
        tsH+='<span class="one-link-chip" style="border-left-color:'+tc+'" onclick="window._oneClickName(\''+_safe(t)+'\')">\u27F5 '+_e(t)+'</span>';
      });
      tsH+='</div>';
    }
    if(studentsOf.length){
      tsH+='<div class="one-sub-label">STUDENTS ('+studentsOf.length+')</div><div class="one-chip-wrap">';
      studentsOf.forEach(function(s){
        var sc=_typeColor(s);
        tsH+='<span class="one-link-chip" style="border-left-color:'+sc+'" onclick="window._oneClickName(\''+_safe(s.famous)+'\')">\u25B6 '+_e(s.famous)+'</span>';
      });
      tsH+='</div>';
    }
    h+=_sec('\uD83D\uDD17','Teachers & Students',teachers.length+studentsOf.length,tsH,false);
  }

  /* ── SECTION 5: FAMILY RELATIONS ── */
  if(p.relations&&p.relations.length){
    var relH='<div class="one-chip-wrap">';
    p.relations.forEach(function(r){
      var inData=PEOPLE.find(function(pp){return pp.famous===r.person;});
      var relLabel='<span class="one-rel-type">'+_e(r.relation)+'</span> ';
      if(inData){
        var rc=_typeColor(inData);
        relH+='<span class="one-link-chip" style="border-left-color:'+rc+'" onclick="window._oneClickName(\''+_safe(r.person)+'\')">'+relLabel+_e(r.person)+'</span>';
      } else {
        relH+='<span class="one-link-chip noclick">'+relLabel+_e(r.person)+'</span>';
      }
    });
    relH+='</div>';
    h+=_sec('\uD83D\uDC65','Family Relations',p.relations.length,relH,false);
  }

  /* ── SECTION 6: WORKS & FREE BOOKS ── */
  if(p.books&&p.books.length){
    var bkH='<div class="one-books-list">';
    p.books.forEach(function(b){
      bkH+='<div class="one-book"><span class="one-book-bullet" style="color:'+col+'">\u25B8</span><div>';
      if(b.url) bkH+='<a href="'+_e(b.url)+'" target="_blank" rel="noopener" class="one-book-link">'+_e(b.title)+'</a>';
      else bkH+='<span>'+_e(b.title)+'</span>';
      if(b.magnum) bkH+=' <span class="one-magnum">\u2726 Magnum Opus</span>';
      if(b.note) bkH+='<div class="one-book-note">'+_e(b.note)+'</div>';
      bkH+='</div></div>';
    });
    bkH+='</div>';
    h+=_sec('\uD83D\uDCDA','Works & Free Books',p.books.length,bkH,false);
  }

  /* ── SECTION 7: HISTORICAL EVENTS ── */
  var events=(window.eventsData||[]).filter(function(ev){
    if(!ev.figures) return false;
    return ev.figures.some(function(f){
      if(typeof f==='string') return f===p.famous;
      return f.name===p.famous;
    });
  });
  if(events.length){
    var evH=events.map(function(ev){
      var role='';
      ev.figures.forEach(function(f){
        if(typeof f==='object'&&f.name===p.famous) role=f.role||'';
      });
      return '<div class="one-event">'+
        '<span class="one-ev-year">'+ev.year+'</span>'+
        '<span class="one-ev-cat">'+_e(ev.category||'')+'</span>'+
        '<span class="one-ev-title">'+_e(ev.title)+'</span>'+
        (role?'<span class="one-ev-role">('+_e(role)+')</span>':'')+
        (ev.description?'<div class="one-ev-desc">'+_e(ev.description)+'</div>':'')+
      '</div>';
    }).join('');
    h+=_sec('\u23F3','Historical Events',events.length,evH,false);
  }

  /* ── SECTION 8: CONTEMPORARIES ── */
  if(typeof _getContemporaries==='function'){
    var contemp=_getContemporaries(p);
    if(contemp.west.length||contemp.islamic.length||contemp.east.length){
      var cH='<div class="one-contemp-grid">';
      [{key:'west',label:'WEST'},{key:'islamic',label:'ISLAMIC WORLD'},{key:'east',label:'EAST'}].forEach(function(r){
        if(!contemp[r.key].length) return;
        cH+='<div class="one-contemp-col"><div class="one-contemp-label">'+r.label+'</div>';
        contemp[r.key].forEach(function(q){
          var qc=_typeColor(q);
          cH+='<span class="one-link-chip" style="border-left-color:'+qc+'" onclick="window._oneClickName(\''+_safe(q.famous)+'\')">'+_e(q.famous)+'</span>';
        });
        cH+='</div>';
      });
      cH+='</div>';
      h+=_sec('\uD83C\uDF0D','Contemporaries',0,cH,false);
    }
  }

  /* ── SECTION 9: MAP & PLACE ── */
  if(p.lat&&p.lng){
    var mH='';
    if(p.city) mH+='<div class="one-place">'+_e(p.city)+'</div>';
    mH+='<div class="one-place-coords">'+p.lat.toFixed(2)+', '+p.lng.toFixed(2)+'</div>';
    mH+='<iframe class="one-map-iframe" src="https://www.openstreetmap.org/export/embed.html?bbox='+
      (p.lng-2)+','+(p.lat-2)+','+(p.lng+2)+','+(p.lat+2)+
      '&layer=mapnik&marker='+p.lat+','+p.lng+'" loading="lazy"></iframe>';
    h+=_sec('\uD83D\uDCCD','Map & Place',0,mH,false);
  }

  /* ── SECTION 10: STUDY ROOM ── */
  if(typeof _SR_SLUG_MAP!=='undefined'&&_SR_SLUG_MAP[p.famous]){
    var slug=_SR_SLUG_MAP[p.famous];
    var srH='<div class="one-study-cards">'+
      '<div class="one-study-card" onclick="openStudyRoom(\''+_e(slug)+'\');">\uD83D\uDCD6 Slides</div>'+
      '<div class="one-study-card" onclick="openStudyRoom(\''+_e(slug)+'\');setTimeout(function(){selectStudyTab(\'summary\');},100);">\uD83D\uDCC4 Summary</div>'+
      '<div class="one-study-card" onclick="openStudyRoom(\''+_e(slug)+'\');setTimeout(function(){selectStudyTab(\'quotes\');},100);">\uD83D\uDCAC Quotes</div>'+
    '</div>';
    h+=_sec('\uD83D\uDCD6','Study Room',0,srH,false);
  }

  /* ── SECTION 11: PUBLIC LINKS (always) ── */
  var plH='<div class="one-links-row">';
  if(p.source&&/^https?:\/\//.test(p.source)){
    plH+='<a href="'+_e(p.source)+'" target="_blank" rel="noopener" class="one-ext-link">Wikipedia \u2197</a>';
  }
  plH+='<a href="https://scholar.google.com/scholar?q='+encodeURIComponent(p.famous)+'" target="_blank" rel="noopener" class="one-ext-link">\uD835\uDCAE Google Scholar</a>';
  plH+='<span class="one-ext-link" onclick="focusPersonInTimeline(\''+_safe(p.famous)+'\')">VIEW IN TIMELINE \u2192</span>';
  plH+='</div>';
  h+=_sec('\uD83D\uDD17','Public Links',0,plH,false);

  /* ── SECTION 12: NAME VARIANTS & DATA (always) ── */
  var vars=window._NAME_VARIANTS&&p.slug?window._NAME_VARIANTS[p.slug]:null;
  var vH='';
  if(vars&&vars.length) vH+='<div class="one-variants">'+vars.join(' \u00B7 ')+'</div>';
  vH+='<table class="one-facts"><tbody>';
  [['Slug',p.slug],['Type',p.type],['Tradition',p.tradition],
   ['Born (text)',p.dob_s],['Died (text)',p.dod_s],
   ['Language',p.lang],['Source',p.source],['Date Note',p.dateNote]
  ].forEach(function(f){
    if(f[1]) vH+='<tr><td class="one-fact-key">'+_e(f[0])+'</td><td>'+_e(String(f[1]))+'</td></tr>';
  });
  vH+='</tbody></table>';
  h+=_sec('\uD83D\uDD24','Name Variants & Data',0,vH,false);

  /* ── Set HTML ── */
  container.innerHTML=h;

  /* ── Fetch wiki image ── */
  if(canShowImage(p)){
    var imgEl=document.getElementById(imgId);
    if(imgEl) fetchWikiImage(p.source,imgEl,null);
  }
}

/* ── Collapsible section helper ── */
function _sec(icon,title,count,bodyHtml,openByDefault){
  var badge=count?'<span class="one-sec-badge">'+count+'</span>':'';
  var cls=openByDefault?' open':'';
  return '<div class="one-section'+cls+'">'+
    '<div class="one-sec-header" onclick="this.parentElement.classList.toggle(\'open\')">'+
      '<span class="one-sec-icon">'+icon+'</span>'+
      '<span class="one-sec-title">'+_e(title)+'</span>'+
      badge+
      '<span class="one-sec-chev">\u25B8</span>'+
    '</div>'+
    '<div class="one-sec-body">'+bodyHtml+'</div>'+
  '</div>';
}

/* ── Century string helper ── */
function _centStr(c){
  if(c<=0) return '';
  if(c===1) return '1st';
  if(c===2) return '2nd';
  if(c===3) return '3rd';
  return c+'th';
}

/* ═══════════════════════════════════════════════════════════
   Global handlers
   ═══════════════════════════════════════════════════════════ */
window.openOneView=function(name){
  _selected=[name];
  _addMode=false;
  setView('one');
};

window._oneToggleLetter=function(letter){
  // Close filter dropdowns first
  document.querySelectorAll('.one-dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
  if(_openLetter===letter){ _closeLetterDD(); return; }
  _closeLetterDD();
  _showLetterDD(letter);
};

window._oneFilterLetterDD=function(input){
  var q=(input.value||'').toLowerCase();
  var panel=input.closest('.one-letter-dd-panel');
  if(!panel) return;
  panel.querySelectorAll('.one-dd-name-row').forEach(function(r){
    r.style.display=r.dataset.name.toLowerCase().indexOf(q)!==-1?'':'none';
  });
};

window._oneSearchChanged=function(val){
  _oneSearch=(val||'').trim();
  _renderAlpha();
};

window._oneToggleDD=function(panelId){
  _closeLetterDD();
  var panel=document.getElementById(panelId);
  if(!panel) return;
  var wasOpen=panel.classList.contains('open');
  document.querySelectorAll('.one-dd-panel.open').forEach(function(p){p.classList.remove('open');});
  if(!wasOpen) panel.classList.add('open');
};

/* ── Era filter ── */
window._oneToggleEra=function(val){
  if(_oneEras.has(val)) _oneEras.delete(val); else _oneEras.add(val);
  _syncDD('oneEraPanel',_oneEras);
  _renderAlpha();
};
window._oneClearEras=function(){
  _oneEras.clear();
  _syncDD('oneEraPanel',_oneEras);
  _renderAlpha();
};

/* ── Century filter ── */
window._oneToggleCent=function(val){
  // val is a number
  if(_oneCents.has(val)) _oneCents.delete(val); else _oneCents.add(val);
  _syncDDNum('oneCentPanel',_oneCents);
  _renderAlpha();
};
window._oneClearCents=function(){
  _oneCents.clear();
  _syncDDNum('oneCentPanel',_oneCents);
  _renderAlpha();
};

/* ── City filter ── */
window._oneToggleCity=function(val){
  if(_oneCities.has(val)) _oneCities.delete(val); else _oneCities.add(val);
  _syncDD('oneCityPanel',_oneCities);
  _renderAlpha();
};
window._oneClearCities=function(){
  _oneCities.clear();
  _syncDD('oneCityPanel',_oneCities);
  _renderAlpha();
};

/* ── Type filter ── */
window._oneToggleType=function(val){
  if(_oneTypes.has(val)) _oneTypes.delete(val); else _oneTypes.add(val);
  _syncDD('oneTypePanel',_oneTypes);
  _renderAlpha();
};
window._oneClearTypes=function(){
  _oneTypes.clear();
  _syncDD('oneTypePanel',_oneTypes);
  _renderAlpha();
};

/* ── Tradition filter ── */
window._oneToggleTrad=function(val){
  if(_oneTrads.has(val)) _oneTrads.delete(val); else _oneTrads.add(val);
  _syncDD('oneTradPanel',_oneTrads);
  _renderAlpha();
};
window._oneClearTrads=function(){
  _oneTrads.clear();
  _syncDD('oneTradPanel',_oneTrads);
  _renderAlpha();
};

/* ── DD sync helpers ── */
function _syncDD(panelId,filterSet){
  var panel=document.getElementById(panelId);
  if(!panel) return;
  panel.querySelectorAll('.one-dd-item:not(.one-dd-all)').forEach(function(item){
    var on=filterSet.has(item.dataset.val);
    item.classList.toggle('selected',on);
    item.querySelector('.one-dd-ck').textContent=on?'\u2713':'';
  });
  var allCk=panel.querySelector('.one-dd-all .one-dd-ck');
  if(allCk) allCk.textContent=filterSet.size===0?'\u2713':'';
  _syncFilterBtns();
}
function _syncDDNum(panelId,filterSet){
  var panel=document.getElementById(panelId);
  if(!panel) return;
  panel.querySelectorAll('.one-dd-item:not(.one-dd-all)').forEach(function(item){
    var on=filterSet.has(Number(item.dataset.val));
    item.classList.toggle('selected',on);
    item.querySelector('.one-dd-ck').textContent=on?'\u2713':'';
  });
  var allCk=panel.querySelector('.one-dd-all .one-dd-ck');
  if(allCk) allCk.textContent=filterSet.size===0?'\u2713':'';
  _syncFilterBtns();
}

/* ── + button: toggle add mode ── */
window._oneToggleAdd=function(){
  _addMode=!_addMode;
  _syncUI();
};

/* ── Clear all selections ── */
window._oneClearAll=function(){
  _selected=[];
  _addMode=false;
  _syncUI();
  _renderMain();
};

window._oneToggleFav=function(btn){
  if(!APP.Favorites) return;
  var name=btn.dataset.name;
  var nowFav=APP.Favorites.toggle(name);
  btn.textContent=nowFav?'\u2605':'\u2606';
  btn.style.color=nowFav?'#D4AF37':'rgba(245,240,232,0.25)';
  if(typeof _updateFavFilterBtn==='function') _updateFavFilterBtn();
};

})();

/* ═══════════════════════════════════════════════════════════
   setView override — must be OUTSIDE the IIFE so it wraps
   the current window.setView (including events.js override)
   ═══════════════════════════════════════════════════════════ */
(function(){
  var _origSetViewOne=window.setView;
  window.setView=function(v){
    _origSetViewOne(v);
    var ov=document.getElementById('one-view');
    if(ov) ov.style.display=v==='one'?'flex':'none';
    if(v==='one'||v==='talk'){
      var r3=document.getElementById('hdrRow3');
      if(r3) r3.style.display='none';
      var r4=document.getElementById('hdrRow4');
      if(r4) r4.style.display='none';
      document.getElementById('leftPanel').style.display='none';
      document.getElementById('infoPanel').style.display='none';
      if(v==='one') initOne();
    }
  };
})();
