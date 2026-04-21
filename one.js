/* ═══════════════════════════════════════════════════════════
   ONE VIEW — Single-page-per-figure deep profile
   ═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── State ── */
var _inited = false;
var _selected = [];
var _addMode = false;   // "+" button toggled: next click adds to selection

/* ── Wikidata cache ── */
var _wikidata = null;    // keyed by F-code (e.g. "F0006")
var _wdLoading = false;
var _WD_OCC_LABELS = {"Q215536":"Merchant","Q372436":"Statesperson","Q82955":"Politician","Q132050":"Governor","Q65997":"Caliph","Q49757":"Poet","Q4991371":"Soldier","Q42759":"Mujahid","Q901":"Scientist","Q1397808":"Resistance fighter","Q36180":"Writer","Q189459":"Ulema","Q1172458":"Muhaddith","Q16031530":"Music theorist","Q4964182":"Philosopher","Q1234713":"Theologian","Q2369218":"Murshid","Q201788":"Historian","Q1999841":"Islamic jurist","Q12912932":"Mufassir","Q12859263":"Orator","Q17638669":"Rawi","Q42603":"Priest","Q188711":"Companion","Q1402561":"Military leader","Q185992":"Mufti","Q1622272":"University teacher","Q2892720":"Sufi","Q2304859":"Sovereign","Q193391":"Diplomat","Q217029":"Qadi","Q13570226":"Literary historian","Q1930187":"Journalist","Q432386":"Preacher","Q6673651":"Literary scholar","Q639669":"Musician","Q779458":"Ascetic","Q12328016":"Mystic","Q20826540":"Scholar","Q11063":"Astronomer","Q170790":"Mathematician","Q155647":"Astrologer","Q3595924":"Qari","Q16012028":"Legal scholar","Q185166":"Sheikh","Q974144":"Educator","Q37226":"Teacher","Q673566":"Mujtahid","Q15995642":"Religious leader","Q4231368":"Wali","Q125482":"Imam","Q18814623":"Autobiographer","Q12307965":"Debater","Q1097498":"Ruler","Q116":"Monarch","Q47064":"Military personnel","Q916292":"Scribe","Q12270170":"Mutakallim","Q901402":"Geographer","Q2374149":"Botanist","Q593644":"Chemist","Q270141":"Polymath","Q1734662":"Cartographer","Q333634":"Translator","Q4773904":"Anthropologist","Q169470":"Physicist","Q14467526":"Linguist","Q18524037":"Indologist","Q105186":"Pharmacist","Q10527030":"Humanist","Q18805":"Naturalist","Q350979":"Zoologist","Q124634459":"Journal editor","Q15991187":"Grammarian","Q1350189":"Egyptologist","Q12356615":"Traveler","Q864503":"Biologist","Q205375":"Inventor","Q81096":"Engineer","Q3109488":"Gnomonist","Q39631":"Physician","Q16390131":"Cryptologist","Q2306091":"Sociologist","Q1238570":"Political scientist","Q16533":"Judge","Q864380":"Biographer","Q10873124":"Chess player","Q2627699":"Chess composer","Q774306":"Surgeon","Q10872101":"Anatomist","Q2700922":"Clockmaker","Q185351":"Jurist","Q40348":"Lawyer","Q11774202":"Essayist","Q11499147":"Political activist","Q3155377":"Islamicist","Q19641":"Marji","Q4853732":"Children's writer","Q12087689":"Wali","Q3133901":"Herbalist","Q2632248":"Akhoond","Q2259532":"Cleric","Q36834":"Composer","Q7311283":"Religious","Q599151":"Official","Q20474860":"Divan poet","Q11545923":"Military commander","Q482980":"Author","Q119982309":"Islamic revisionist","Q1028181":"Painter","Q998628":"Illuminator","Q3303330":"Calligrapher","Q12059906":"Herder","Q220098":"Warlord","Q1278335":"Instrumentalist","Q42857":"Prophet","Q168827":"Prophet of Islam","Q3621491":"Archaeologist","Q11900058":"Explorer","Q15472169":"Patron of the arts","Q620573":"Arabist","Q8359428":"Social activist","Q58968":"Intellectual","Q6051619":"Opinion journalist","Q2911636":"Islamic leader","Q822146":"Lyricist","Q3400985":"Academic","Q1714828":"Hunter","Q967769":"Dai","Q2114605":"Pharmacologist","Q137733929":"Arithmetician","Q998550":"Bookseller","Q10429346":"Bibliographer","Q21185790":"Exegete","Q188094":"Economist","Q3813950":"Katib","Q5403434":"Ethicist","Q109920757":"Dream interpreter","Q137351830":"Islamic theologian","Q842811":"Dietitian","Q1349880":"Thaumaturge","Q15954519":"Alchemist","Q189290":"Military officer","Q43845":"Businessperson","Q29051324":"Wholesale merchant","Q1250916":"Warrior","Q132851":"Admiral","Q201559":"Privateer","Q10729326":"Pirate","Q14972848":"Lexicographer","Q16880249":"Dialectologist","Q12097":"King","Q1476215":"Human rights defender","Q107637527":"Muslim minister","Q182436":"Librarian","Q47740":"Muslim","Q205766":"Ummah","Q2624172":"Sage","Q12144794":"Prose writer","Q18663593":"Seerah writer","Q1759959":"Color guard","Q3282637":"Film producer","Q2526255":"Film director","Q15958642":"Political writer","Q184299":"Shah","Q11573099":"Royalty","Q214917":"Playwright","Q4479442":"Founder","Q42973":"Architect","Q2248623":"Scholar","Q24885626":"Thinker","Q175240":"Vizier","Q719039":"Queen consort","Q1162909":"Power behind the throne","Q177220":"Singer","Q877558":"Consignor","Q28692502":"Women's rights activist","Q763779":"Reformer","Q662729":"Public figure","Q124985058":"Reformer","Q11085831":"Interpreter","Q16743941":"Metaphysician","Q1731155":"Orientalist","Q6090396":"Quranic exegete","Q21512362":"Jihadist","Q102083":"Knight","Q15980158":"Non-fiction writer","Q3242115":"Revolutionary","Q48352":"Head of state","Q1251441":"Leader","Q4175034":"Legislator","Q30242234":"Freedom fighter","Q38126150":"Housewife","Q110007257":"Livestock worker","Q188830":"Wife","Q186360":"Nurse","Q254651":"Navigator","Q179294":"Eunuch","Q33999":"Actor","Q131524":"Entrepreneur","Q932945":"Khatib","Q3745071":"Science writer","Q7492880":"Shaykh","Q6625963":"Novelist","Q4263842":"Literary critic","Q28389":"Screenwriter","Q219477":"Missionary","Q14565331":"Logician","Q4594605":"Magistrate","Q4504549":"Religious figure","Q2732142":"Statistician","Q3362826":"Papermaker","Q24262584":"Bible translator","Q6430706":"Critic","Q80687":"Secretary"};
var _WD_PORTRAIT_BLOCKED_SLUGS = {'F1132':1,'F0114':1,'F1433':1,'F1629':1,'F0366':1,'F0863':1,'F0199':1,'F0599':1,'F0667':1,'F0708':1};
var _WD_BLOCKED_TYPES = {'Prophet':1,'Sahaba':1,'Sahabiyya':1};

function _ensureWikidata(){
  if(_wikidata) return Promise.resolve(_wikidata);
  if(_wdLoading) return _wdLoading;
  _wdLoading=fetch('data/islamic/wikidata.json?v='+Date.now()).then(function(r){return r.json();}).then(function(d){
    _wikidata=d; window._wikidata=d; return d;
  }).catch(function(){ _wikidata={}; return {}; });
  return _wdLoading;
}
window._ensureWikidata=_ensureWikidata;
window._WD_OCC_LABELS=_WD_OCC_LABELS;

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
  if(t==='Prophet'||t==='Genealogy'||t==='Founder') return '#D4AF37';
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
        '<button id="one-how-btn" style="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-size:var(--fs-3);cursor:pointer;transition:.2s;font-family:\'Cinzel\',serif;letter-spacing:.05em;margin-right:8px" onmouseover="this.style.borderColor=\'#D4AF37\';this.style.color=\'#D4AF37\'" onmouseout="this.style.borderColor=\'#555\';this.style.color=\'#888\'" onclick="event.stopPropagation();_showOneMethodology();">How This Works</button>'+
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

window._captureState_one=function(){
  var scroll=document.getElementById('one-main');
  var slug=_selected&&_selected.length?_selected[0].slug:null;
  return{figSlug:slug,scrollY:scroll?scroll.scrollTop:0};
};
window._restoreState_one=function(s){
  if(!s||!s.figSlug) return;
  if(typeof PEOPLE!=='undefined'){
    var p=PEOPLE.find(function(pp){return pp.slug===s.figSlug;});
    if(p) setTimeout(function(){window._oneClickName(p.famous);if(s.scrollY){var sc=document.getElementById('one-main');if(sc) sc.scrollTop=s.scrollY;}},100);
  }
};

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
  var clearFns={
    oneEraBtn:window._oneClearEras,
    oneCentBtn:window._oneClearCents,
    oneCityBtn:window._oneClearCities,
    oneTypeBtn:window._oneClearTypes,
    oneTradBtn:window._oneClearTrads
  };
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
    // Inline × clear button
    var oldX=btn.querySelector('.dd-clear-x');
    if(oldX) oldX.remove();
    if(n>0){
      var xEl=document.createElement('span');
      xEl.className='dd-clear-x';
      xEl.textContent='\u00D7';
      xEl.onclick=function(e){e.stopPropagation();if(clearFns[m.btnId]) clearFns[m.btnId]();};
      btn.appendChild(xEl);
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
  var _realDob = (p.dob_academic!=null) ? p.dob_academic : null;
  var _realDod = (p.dod_academic!=null) ? p.dod_academic : null;
  var dob_s = (_realDob!=null) ? (_realDob<0?Math.abs(_realDob)+' BCE':_realDob+' CE') : (p.dob_s || '\u2014');
  var dod_s = (_realDod!=null) ? (_realDod<0?Math.abs(_realDod)+' BCE':_realDod+' CE') : (p.dod_s || '\u2014');
  var age = (_realDob!=null && _realDod!=null) ? (_realDod - _realDob) : null;
  var cent = (_realDob!=null) ? _centStr(Math.ceil(_realDob/100)) : (p.dob!=null ? _centStr(Math.ceil(p.dob/100)) : '');
  var isFav=APP.Favorites?APP.Favorites.has(p.famous):false;

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
  h+='<div id="one-portrait"></div>';
  h+='<div class="one-hero-text">';
  h+='<div class="one-famous" style="color:'+col+'">'+_e(p.famous);
  h+=' <button class="one-fav-btn" data-name="'+_e(p.famous)+'" onclick="window._oneToggleFav(this)" style="color:'+(isFav?'#D4AF37':'rgba(160,174,192,0.25)')+'">'+( isFav?'\u2605':'\u2606')+'</button>';
  if(typeof _renderBadgesHtml==='function') h+=('<span class="one-badges">'+_renderBadgesHtml(p.slug,p.famous,'one')+'</span>');
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
  h+='<div id="one-occupations"></div>';
  if(window._journeyFigures&&window._journeyFigures.has(p.slug)){
    h+='<a class="one-follow-link" href="#follow" onclick="event.preventDefault();window._followShowFigure(\''+_safe(p.slug)+'\');return false;">&#9654; Follow their life on the map</a>';
  }
  // Dates
  h+='<div class="one-dates">';
  h+='<span class="one-date"><span class="one-dl">BORN</span><span class="one-dv" style="color:'+col+'">'+dob_s+'</span></span>';
  h+='<span class="one-date"><span class="one-dl">DIED</span><span class="one-dv" style="color:'+col+'">'+dod_s+'</span></span>';
  if(age!==null) h+='<span class="one-date"><span class="one-dl">AGE</span><span class="one-dv">'+age+'</span></span>';
  if(cent) h+='<span class="one-date"><span class="one-dl">CENTURY</span><span class="one-dv">'+cent+'</span></span>';
  h+='</div>';
  h+='</div></div>'; // hero-text, hero

  /* ── Hadith Narrations (shown only for narrators) ── */
  if(p.hadith_narrations_count && p.hadith_narrations_count > 0){
    var _hnCount = p.hadith_narrations_count.toLocaleString();
    var _hnColls = p.hadith_source_collections || [];
    var _hnJoined = '';
    if(_hnColls.length === 1) _hnJoined = _e(_hnColls[0]);
    else if(_hnColls.length === 2) _hnJoined = _e(_hnColls[0]) + ' and ' + _e(_hnColls[1]);
    else if(_hnColls.length > 2) _hnJoined = _hnColls.slice(0,-1).map(_e).join(', ') + ', and ' + _e(_hnColls[_hnColls.length-1]);
    h+='<div class="one-hadith-block" style="margin:10px 0;padding:10px 12px;background:rgba(212,175,55,0.06);border-left:2px solid rgba(212,175,55,0.4);border-radius:2px;">';
    h+='<div style="font-family:\'Cinzel\',serif;font-size:var(--fs-3);letter-spacing:.08em;text-transform:uppercase;color:rgba(212,175,55,0.85);margin-bottom:4px">Hadith Narrations</div>';
    h+='<div style="font-size:var(--fs-3);color:#E5E7EB;line-height:1.4">Narrator of <strong>'+_hnCount+'</strong> hadiths across '+_hnJoined+'</div>';
    h+='<div style="font-size:var(--fs-3);color:#6B7280;margin-top:6px;font-style:normal">Source: sahih-explorer dataset (see /about for full attribution)</div>';
    h+='</div>';
  }

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
        if(qr.firstVerse) qh+='<div class="one-quran-link">'+(typeof renderQuranRef==="function"?renderQuranRef(qr.firstVerse):_e(qr.firstVerse))+'</div>';
        if(qr.epithet) qh+='<div class="one-quran-epithet">'+_e(qr.epithet)+'</div>';
      } else if(p.type==='Prophet'){
        qh+='<div>'+(typeof renderQuranRef==="function"?renderQuranRef(String(qr)):_e(String(qr)))+'</div>';
      } else {
        qh+='<div>'+(typeof renderQuranRef==="function"?renderQuranRef(String(qr)):_e(String(qr)))+'</div>';
      }
    } else if(p.quran_refs){
      qh+='<div>'+(typeof renderQuranRef==="function"?renderQuranRef(p.quran_refs):_e(p.quran_refs))+'</div>';
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
    tsH+='<div class="one-section-jump"><a href="#silsila" onclick="event.preventDefault();setView(\'silsila\');setTimeout(function(){if(typeof silsilaLocate===\'function\')silsilaLocate(\''+_safe(p.famous)+'\');},300);return false;">View in SILSILA \u2192</a></div>';
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

  /* ── SECTION 6b: BOOKS FROM CATALOG (books.json) ── */
  var _catBooks=[];
  if(window._BOOKS_DATA&&window._BOOKS_DATA.books&&p.slug){
    _catBooks=window._BOOKS_DATA.books.filter(function(b){return b.slug===p.slug;});
  }
  if(!window._BOOKS_DATA&&p.slug){
    fetch('data/islamic/books.json?v='+Date.now()).then(function(r){return r.json();}).then(function(d){
      window._BOOKS_DATA=d;if(typeof _renderMain==='function')_renderMain();
    }).catch(function(){});
  }
  if(_catBooks.length){
    var cbH='<div class="one-catalog-list">';
    _catBooks.forEach(function(b){
      cbH+='<div class="one-catalog-row">';
      cbH+='<div class="one-catalog-title">'+_e(b.title)+'</div>';
      var cmeta=[];
      if(b.year!=null) cmeta.push(b.year<0?Math.abs(b.year)+' BCE':b.year+' CE');
      if(b.topics&&b.topics.length) cmeta.push(b.topics.slice(0,3).join(' \u00B7 '));
      if(cmeta.length) cbH+='<div class="one-catalog-meta">'+_e(cmeta.join(' \u2014 '))+'</div>';
      if(b.url) cbH+='<a class="one-catalog-link" href="'+_e(b.url)+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">READ \u2197</a>';
      cbH+='</div>';
    });
    cbH+='</div>';
    cbH+='<div class="one-section-jump"><a href="#books" onclick="event.preventDefault();setView(\'books\');return false;">View in BOOKS \u2192</a></div>';
    h+=_sec('\uD83D\uDCD6','Books in Catalog',_catBooks.length,cbH,false);
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
    evH+='<div class="one-section-jump"><a href="#events" onclick="event.preventDefault();setView(\'events\');return false;">View in EVENTS \u2192</a></div>';
    h+=_sec('\u23F3','Historical Events',events.length,evH,false);
  }

  /* ── SECTION 7b: LIFE JOURNEY ── */
  var _hasJourney=false;
  if(p.slug&&window._journeyFigures&&window._journeyFigures.has(p.slug)) _hasJourney=true;
  if(!window._journeyFigures&&p.slug){
    if(typeof window._preloadJourneyIndex==='function'){
      window._preloadJourneyIndex().then(function(){if(typeof _renderMain==='function')_renderMain();});
    }
  }
  if(_hasJourney){
    var jH='<div class="one-journey-card">';
    jH+='<div class="one-journey-text">This figure has a researched life journey with mapped locations and chronological events.</div>';
    jH+='<a class="one-journey-btn" href="#follow" onclick="event.preventDefault();if(typeof window._followShowFigure===\'function\')window._followShowFigure(\''+_safe(p.slug)+'\');return false;">\u25B6 FOLLOW THEIR LIFE</a>';
    jH+='</div>';
    h+=_sec('\uD83D\uDDFA\uFE0F','Life Journey',0,jH,false);
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
    mH+='<div class="one-section-jump"><a href="#map" onclick="event.preventDefault();setView(\'map\');return false;">View in MAP \u2192</a></div>';
    h+=_sec('\uD83D\uDCCD','Map & Place',0,mH,false);
  }

  /* ── SECTION 10: STUDY ROOM ── */
  if(typeof _SR_SLUG_MAP!=='undefined'&&_SR_SLUG_MAP[p.famous]){
    var slug=_SR_SLUG_MAP[p.famous];
    var srH='<div class="one-study-cards">'+
      '<div class="one-study-card" onclick="openStudyRoom(\''+_e(slug)+'\');">\uD83D\uDCD6 Slides</div>'+
      '<div class="one-study-card" onclick="openStudyRoom(\''+_e(slug)+'\');setTimeout(function(){selectStudyTab(\'summary\');},100);">\uD83D\uDCC4 Summary</div>'+
      '<div class="one-study-card" onclick="openStudyRoom(\''+_e(slug)+'\');setTimeout(function(){selectStudyTab(\'video\');},100);">\uD83C\uDFA5 Video</div>'+
    '</div>';
    h+=_sec('\uD83D\uDCD6','Study Room',0,srH,false);
  }

  /* ── SECTION 11: PUBLIC LINKS (always) ── */
  var plH='<div class="one-links-row">';
  if(p.source&&/^https?:\/\//.test(p.source)){
    plH+='<a href="'+_e(p.source)+'" target="_blank" rel="noopener" class="one-ext-link">Wikipedia \u2197</a>';
  }
  if(p.archive_org_url&&/^https?:\/\//.test(p.archive_org_url)){
    plH+='<a href="'+_e(p.archive_org_url)+'" target="_blank" rel="noopener" class="one-ext-link">Browse on Archive.org \u2197</a>';
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

  h+='<div id="one-wikilinks"></div>';

  /* ── Set HTML ── */
  container.innerHTML=h;

  /* ── Wikidata enrichment ── */
  _ensureWikidata().then(function(wd){
    if(!wd||!p.slug) return;
    var entry=wd[p.slug];
    if(!entry) return;

    /* a) Portrait — only if image field exists AND not blocked */
    if(entry.image && !_WD_BLOCKED_TYPES[p.type] && !_WD_PORTRAIT_BLOCKED_SLUGS[p.slug]){
      var portraitDiv=container.querySelector('#one-portrait');
      if(portraitDiv){
        var img=document.createElement('img');
        img.className='one-wd-portrait';
        img.alt=p.famous;
        img.src=entry.image;
        img.onerror=function(){ this.style.display='none'; };
        portraitDiv.appendChild(img);
      }
    }

    /* b) Occupation chips */
    if(entry.occupations&&entry.occupations.length){
      var occDiv=container.querySelector('#one-occupations');
      if(occDiv){
        var shown=entry.occupations.slice(0,5);
        shown.forEach(function(qid){
          var label=_WD_OCC_LABELS[qid]||null;
          if(!label) return;
          var chip=document.createElement('span');
          chip.className='one-wd-occ';
          chip.textContent=label;
          occDiv.appendChild(chip);
        });
      }
    }

    /* c) Wikipedia language links */
    if(entry.wikipedia){
      var langs=[['en','EN'],['ar','AR'],['fa','FA'],['ur','UR'],['tr','TR']];
      var wlDiv=container.querySelector('#one-wikilinks');
      if(wlDiv){
        var any=false;
        langs.forEach(function(pair){
          var code=pair[0], lbl=pair[1];
          var article=entry.wikipedia[code];
          if(!article) return;
          any=true;
          var a=document.createElement('a');
          a.className='one-wd-wikilink';
          a.href='https://'+code+'.wikipedia.org/wiki/'+encodeURIComponent(article.replace(/ /g,'_'));
          a.target='_blank';
          a.rel='noopener';
          a.textContent=lbl;
          wlDiv.appendChild(a);
        });
        if(any){
          var label=document.createElement('span');
          label.className='one-wd-wikilink-label';
          label.textContent='Wikipedia:';
          wlDiv.insertBefore(label,wlDiv.firstChild);
        }
      }
    }
  });
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

window._oneGetSelected=function(){ return _selected.slice(); };

window._oneToggleFav=function(btn){
  if(!APP.Favorites) return;
  requireTester('save', function(){
    var name=btn.dataset.name;
    var nowFav=APP.Favorites.toggle(name);
    btn.textContent=nowFav?'\u2605':'\u2606';
    btn.style.color=nowFav?'#D4AF37':'rgba(160,174,192,0.25)';
    if(typeof _updateFavFilterBtn==='function') _updateFavFilterBtn();
  });
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
    document.body.classList.toggle('view-one',v==='one');
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

function _showOneMethodology(){
  if(document.getElementById('one-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='one-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="one-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 16px">A detailed profile for a single historical figure \u2014 lifespan, location, tradition, teachers, students, relations, books, events, and Quranic references for prophets. Compare up to 3 figures side by side.</p>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'+'<div style="font-size:var(--fs-3);line-height:1.7"><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#D4AF37;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Teachers</span><span style="color:#A0AEC0">Figures documented as having directly taught this person</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#3B82F6;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Students</span><span style="color:#A0AEC0">Figures documented as having learned from this person</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#14B8A6;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Relations</span><span style="color:#A0AEC0">Family ties, intellectual connections, personal links</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#E6B450;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Quran refs</span><span style="color:#A0AEC0">For prophets \u2014 verses where mentioned (manually verified)</span></div></div>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 12px">Profile data from classical Islamic biographical dictionaries, cross-referenced with Wikipedia. Teacher\u2013student links are documented relationships only. Prophets and companions never depicted.</p>'+'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('one-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
