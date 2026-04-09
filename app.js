/* ── APP Namespace ── */
var APP = window.APP || {};
APP.Features = {
  SMART_FILTERING: true,
  SEARCH: true,
  FAVORITES: false,
  SHUFFLE: false,
  LINEAGE_NAV: false,
  ANIMATIONS: true,
  isEnabled: function(key) {
    try {
      var p = new URLSearchParams(window.location.search).get('features');
      if (p) return p.split(',').includes(key);
    } catch(e) {}
    return !!APP.Features[key];
  }
};
APP.safeInit = function(name, fn) {
  try { fn(); console.log('[APP] ' + name + ' ✓'); }
  catch(e) { console.warn('[APP] ' + name + ' failed — continuing', e); }
};
window.onerror = function(msg, src, line) {
  console.warn('[APP Error]', msg, 'line', line);
  return false;
};

// ═══════════════════════════════════════════════════════════
// FAVORITES MODULE
// ═══════════════════════════════════════════════════════════
APP.filterFavsOnly = false;

APP.safeInit('Favorites', function() {
  var STORE_KEY = 'islamic_app_favorites_v1';
  var _storage = (function() {
    try {
      localStorage.setItem('__test__', '1');
      localStorage.removeItem('__test__');
      return localStorage;
    } catch(e) {
      var _mem = {};
      return {
        getItem:    function(k)    { return _mem[k] || null; },
        setItem:    function(k, v) { _mem[k] = v; },
        removeItem: function(k)    { delete _mem[k]; }
      };
    }
  })();

  function _load() {
    try { return new Set(JSON.parse(_storage.getItem(STORE_KEY) || '[]')); }
    catch(e) { return new Set(); }
  }
  function _save(set) {
    try { _storage.setItem(STORE_KEY, JSON.stringify([...set])); }
    catch(e) { console.warn('[APP] Favorites save failed', e); }
  }

  var _favs = _load();

  APP.Favorites = {
    has:    function(name) { return _favs.has(name); },
    toggle: function(name) {
      if (_favs.has(name)) _favs.delete(name);
      else _favs.add(name);
      _save(_favs);
      return _favs.has(name);
    },
    list:   function() { return [..._favs]; },
    count:  function() { return _favs.size; }
  };

  console.log('[APP] Favorites loaded:', _favs.size, 'saved');
});

function _updateFavFilterBtn() {
  if (!APP.Favorites) return;
  var n = APP.Favorites.count();
  var html = '★ SAVED' + (n > 0
    ? ' <span style="color:#D4AF37;font-size:9px">(' + n + ')</span>'
    : '');
  ['favFilterBtn','sl-favFilterBtn','map-favFilterBtn'].forEach(function(id){
    var btn = document.getElementById(id);
    if(btn) btn.innerHTML = html;
  });
}

function toggleFavFilter() {
  APP.filterFavsOnly = !APP.filterFavsOnly;
  ['favFilterBtn','sl-favFilterBtn','map-favFilterBtn'].forEach(function(id){
    var btn = document.getElementById(id);
    if(btn) btn.classList.toggle('filtered', APP.filterFavsOnly);
  });
  applyFilterAndFocus();
  if(VIEW==='map') _renderMarkers();
  if(VIEW==='silsila') renderSilsila();
  if(VIEW==='studyroom'&&typeof _buildStudySidebar==='function') _buildStudySidebar();
}

// ═══════════════════════════════════════════════════════════
// WIKIPEDIA IMAGE SUPPORT
// ═══════════════════════════════════════════════════════════
/* Figures who must NEVER show an image */
const NO_IMAGE_FIGURES = new Set([
  'Prophet Muhammad', 'Ibrahim', 'Musa', 'Isa', 'Dawud', 'Sulayman',
  'Yusuf', 'Yaqub', 'Ishaq', 'Ismail', 'Nuh', 'Adam', 'Idris',
  'Hud', 'Salih', 'Lut', 'Shuayb', 'Yunus', 'Ayyub', 'Ilyas',
  'Al-Yasa', 'Dhul-Kifl', 'Harun', 'Zakariyya', 'Yahya',
  'Fatimah al-Zahra', 'Aisha bint Abi Bakr', 'Khadijah bint Khuwaylid',
  'Khadija bint Khuwaylid', 'Ali ibn Abi Talib', 'Hasan ibn Ali',
  'Husayn ibn Ali'
]);

function canShowImage(person) {
  if (!person) return false;
  if (person.type === 'Prophet') return false;
  if (person.type === 'Founder') return false;
  if (NO_IMAGE_FIGURES.has(person.famous)) return false;
  if (!person.source || !person.source.includes('wikipedia.org')) return false;
  return true;
}

function fetchWikiImage(wikiUrl, imgEl, captionEl) {
  try {
    var url = new URL(wikiUrl);
    var title = decodeURIComponent(url.pathname.replace('/wiki/', ''));
    if (!title) return;
    var apiUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/'
      + encodeURIComponent(title);
    fetch(apiUrl, { headers: { 'Accept': 'application/json' } })
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(data) {
        if (!data) return;
        var thumb = data.thumbnail || data.originalimage;
        if (thumb && thumb.source) {
          imgEl.src = thumb.source;
          imgEl.style.display = 'block';
          if (captionEl) captionEl.style.display = 'block';
        }
      })
      .catch(function() {});
  } catch(e) {}
}

// ═══════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════
const MIN_YR=500,MAX_YR=2000;
const ALL_CENTS=[0,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20]; // 0 = Pre-Islamic
const CC={6:'#d4600a',7:'#c04a08',8:'#a07800',9:'#5a8a00',10:'#007a5c',11:'#c87832',
          12:'#b86820',13:'#c8902a',14:'#a07828',15:'#a01030',16:'#a01030',17:'#a03000',
          18:'#8a5a00',19:'#4a7800',20:'#008050'};
function gc(y){if(y<600)return 6;if(y<700)return 7;if(y<800)return 8;if(y<900)return 9;
  if(y<1000)return 10;if(y<1100)return 11;if(y<1200)return 12;if(y<1300)return 13;
  if(y<1400)return 14;if(y<1500)return 15;if(y<1600)return 16;if(y<1700)return 17;
  if(y<1800)return 18;if(y<1900)return 19;return 20;}
function centLabel(c){return c===1?'1st':c===2?'2nd':c===3?'3rd':`${c}th`}

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
let PEOPLE=[],VIEW='timeline',activeYear=null,activePerson=null;
let _viewYears={timeline:null,silsila:null,map:null};
let selTypes=new Set(),selTrads=new Set(),searchQ='';
let _lastSortedPeople=[]; // tracks exactly the sorted array used in the last renderRows call

// ── Figure history stack (in-app back navigation) ──
var _figureHistory=[];
var _figureHistoryMax=20;
function pushFigureHistory(name){
  if(_figureHistory.length&&_figureHistory[_figureHistory.length-1]===name) return;
  _figureHistory.push(name);
  if(_figureHistory.length>_figureHistoryMax) _figureHistory.shift();
  _updateBackBtn();
}
function popFigureHistory(){
  if(_figureHistory.length<2) return null;
  _figureHistory.pop();
  var prev=_figureHistory[_figureHistory.length-1];
  _updateBackBtn();
  return prev;
}
function _updateBackBtn(){
  var btn=document.getElementById('figureBackBtn');
  if(btn) btn.style.display=_figureHistory.length>1?'inline-flex':'none';
}
let CW=[0,6,7]; // Default: PRE-ISLAMIC | 6TH C. | 7TH C.
let centIdx=1; // Index of 6 in ALL_CENTS=[0,6,7,...]

// ═══════════════════════════════════════════════════════════
// LAZY-LOAD DETAIL CHUNKS
// ═══════════════════════════════════════════════════════════
const _SUFI_ORDER_TRADS=new Set([
  'Naqshbandiyya','Shadhiliyya','Qadiriyya','Chishti',
  'Suhrawardiyya','Mawlawiyya','Qalandari','Yeseviyya',
  'Kubrawiyya','Badawiyya','Burhaniyya','Akbarian',
  'Ishraqiyya','Sindhi/Punjabi Sufism'
]);
function getChunkName(p){
  const t=p.type||'', tr=p.tradition||'';
  if(t==='Prophet'||t==='Founder') return 'lineage';
  if(t==='Sahaba') return 'sahaba';
  if(t==='Sahabiyya') return 'sahabiyya';
  if(t==="Tabi'un") return 'tabiun';
  if(t==='Ruler'||t==='Caliph') return 'rulers';
  if(t==='Poet') return 'poets';
  if(t==='Philosopher') return 'philosophy';
  if(t==='Scientist') return 'sciences';
  if(t==='Mystic') return _SUFI_ORDER_TRADS.has(tr)?'sufis-orders':'sufis-early';
  if(tr==='Hadith Sciences') return 'hadith';
  if(tr==='Early Ascetics'||tr==='Khorasan School'||tr==='Baghdad School') return 'sufis-early';
  return 'scholars';
}

const _detailCache={};   // chunk name -> array of detail records
const _detailLoading={}; // chunk name -> promise (in-flight)

async function _loadChunk(chunk){
  if(_detailCache[chunk]) return _detailCache[chunk];
  if(_detailLoading[chunk]) return _detailLoading[chunk];
  _detailLoading[chunk]=(async()=>{
    try{
      const r=await fetch(`data/islamic/details/${chunk}.json?v=${Date.now()}`);
      if(!r.ok) throw new Error(r.status);
      const arr=await r.json();
      _detailCache[chunk]=arr;
      delete _detailLoading[chunk];
      return arr;
    }catch(_){
      _detailCache[chunk]=[];
      delete _detailLoading[chunk];
      return [];
    }
  })();
  return _detailLoading[chunk];
}

async function _ensureDetails(p){
  if(p._detailLoaded) return p;
  const chunk=getChunkName(p);
  const arr=await _loadChunk(chunk);
  const det=arr.find(d=>d.famous===p.famous);
  if(det){
    if(det.school) p.school=det.school;
    if(det.books)  p.books=det.books;
    if(det.parents)  p.parents=det.parents;
    if(det.children) p.children=det.children;
    if(det.spouses)  p.spouses=det.spouses;
    if(det.quotes) p.quotes=det.quotes;
    if(det.quranDetail) p.quranDetail=det.quranDetail;
  }
  p._detailLoaded=true;
  return p;
}

// Wrapper functions — use these instead of calling renderInfo / openSilsilaCard / _openMapCard directly from click handlers
async function renderInfoWithDetails(p){
  await _ensureDetails(p);
  renderInfo(p);
  pushFigureHistory(p.famous);
}
async function openSilsilaCardWithDetails(p,cx,cy){
  await _ensureDetails(p);
  openSilsilaCard(p,cx,cy);
}
async function showMapCardWithDetails(p,cx,cy){
  await _ensureDetails(p);
  _openMapCard(p,cx,cy);
}

// ═══════════════════════════════════════════════════════════
// DIAL NAV
// ═══════════════════════════════════════════════════════════
function _dialInit(){
  var VIEWS=[
    {key:'timeline',label:'TIMELINE'},{key:'silsila',label:'SILSILA'},{key:'map',label:'MAP'},
    {key:'studyroom',label:'STUDY'},{key:'eras',label:'ERAS'},{key:'events',label:'EVENTS'},
    {key:'one',label:'ONE'},{key:'follow',label:'FOLLOW'},{key:'talk',label:'TALK'},{key:'books',label:'BOOKS'}
  ];
  var N=VIEWS.length;
  var dialOffset=0;
  var NS='http://www.w3.org/2000/svg';

  var TILE_TINTS=['#1F2937','#243042','#1A2435','#222C3D','#1D2738'];

  function build(){
    var svg=document.getElementById('dialSvg');
    if(!svg) return;
    svg.innerHTML='';
    svg.setAttribute('viewBox','0 0 800 220');
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');

    var cx=400,cy=110;
    var rOuterX=380,rOuterY=100,rInnerX=200,rInnerY=50;

    // Variable-width segments proportional to label length
    var weights=VIEWS.map(function(v){return Math.max(6,v.label.length);});
    var totalWeight=weights.reduce(function(a,b){return a+b;},0);

    var slotAngles=[];
    var running=0;
    for(var s=0;s<N;s++){
      var w=weights[(s+dialOffset)%N];
      slotAngles.push({start:running,span:(w/totalWeight)*360});
      running+=(w/totalWeight)*360;
    }
    var slot0Center=slotAngles[0].start+slotAngles[0].span/2;
    var shift=90-slot0Center;

    function ept(rx,ry,deg){var rad=deg*Math.PI/180;return[cx+rx*Math.cos(rad),cy+ry*Math.sin(rad)];}

    for(var s2=0;s2<N;s2++){
      var viewIdx=(s2+dialOffset)%N;
      var startDeg=slotAngles[s2].start+shift;
      var endDeg=startDeg+slotAngles[s2].span;
      var centerDeg=startDeg+slotAngles[s2].span/2;

      var p1o=ept(rOuterX,rOuterY,startDeg),p2o=ept(rOuterX,rOuterY,endDeg);
      var p1i=ept(rInnerX,rInnerY,endDeg),p2i=ept(rInnerX,rInnerY,startDeg);
      var la=(slotAngles[s2].span>180)?1:0;
      var d='M '+p1o[0]+' '+p1o[1]+
            ' A '+rOuterX+' '+rOuterY+' 0 '+la+' 1 '+p2o[0]+' '+p2o[1]+
            ' L '+p1i[0]+' '+p1i[1]+
            ' A '+rInnerX+' '+rInnerY+' 0 '+la+' 0 '+p2i[0]+' '+p2i[1]+' Z';

      var isActive=(s2===0);
      var tint=TILE_TINTS[viewIdx%TILE_TINTS.length];
      var path=document.createElementNS(NS,'path');
      path.setAttribute('d',d);
      path.setAttribute('fill',isActive?'#D4AF37':tint);
      path.setAttribute('stroke','#0E1621');
      path.setAttribute('stroke-width',isActive?'2':'1');
      path.setAttribute('class','dial-segment');
      path.dataset.viewKey=VIEWS[viewIdx].key;
      path.addEventListener('click',(function(idx){return function(){activate(idx);};})(viewIdx));
      svg.appendChild(path);

      var rLabelX=(rOuterX+rInnerX)/2,rLabelY=(rOuterY+rInnerY)/2;
      var lp=ept(rLabelX,rLabelY,centerDeg);
      var text=document.createElementNS(NS,'text');
      text.setAttribute('x',lp[0]);
      text.setAttribute('y',lp[1]+4);
      text.setAttribute('text-anchor','middle');
      text.setAttribute('class','dial-label'+(isActive?' active':''));
      text.textContent=VIEWS[viewIdx].label;
      svg.appendChild(text);
    }

    // Inner ellipse
    var disc=document.createElementNS(NS,'ellipse');
    disc.setAttribute('cx',cx);disc.setAttribute('cy',cy);
    disc.setAttribute('rx',rInnerX);disc.setAttribute('ry',rInnerY);
    disc.setAttribute('class','dial-inner-disc');
    svg.appendChild(disc);

    // Boat icon
    var boat=document.createElementNS(NS,'g');
    boat.setAttribute('transform','translate('+cx+','+(cy-12)+')');
    boat.innerHTML='<path d="M -28 6 Q 0 16 28 6 L 25 14 Q 0 22 -25 14 Z" fill="none" stroke="#D4AF37" stroke-width="1.6" stroke-linecap="round"/>'+
      '<line x1="0" y1="-14" x2="0" y2="6" stroke="#D4AF37" stroke-width="1.4"/>'+
      '<path d="M 0 -12 L 14 -4 L 0 -4 Z" fill="#D4AF37" stroke="none"/>';
    svg.appendChild(boat);

    // GOLD ARK wordmark
    var wm=document.createElementNS(NS,'text');
    wm.setAttribute('x',cx);wm.setAttribute('y',cy+22);
    wm.setAttribute('class','dial-logo-text');
    wm.textContent='GOLD ARK';
    svg.appendChild(wm);
  }

  function activate(viewIndex){
    dialOffset=viewIndex;
    build();
    setView(VIEWS[viewIndex].key);
  }

  window._dialSyncToView=function(viewKey){
    var idx=VIEWS.findIndex(function(v){return v.key===viewKey;});
    if(idx>=0&&idx!==dialOffset){dialOffset=idx;build();}
  };

  // Scroll arrows flanking the dial
  var center=document.getElementById('hdrDialCenter');
  ['dialArrowL','dialArrowR'].forEach(function(id){var el=document.getElementById(id);if(el&&el.parentElement!==center)el.remove();});
  if(center&&!document.getElementById('dialArrowL')){
    center.style.position='relative';
    var aL=document.createElement('button');
    aL.id='dialArrowL';aL.className='dial-arrow dial-arrow-left';
    aL.setAttribute('aria-label','Previous view');
    aL.innerHTML='<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20,6 10,16 20,26"/><polyline points="26,6 16,16 26,26"/></svg>';
    aL.addEventListener('click',function(){activate((dialOffset-1+N)%N);});
    center.appendChild(aL);
    var aR=document.createElement('button');
    aR.id='dialArrowR';aR.className='dial-arrow dial-arrow-right';
    aR.setAttribute('aria-label','Next view');
    aR.innerHTML='<svg viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="12,6 22,16 12,26"/><polyline points="6,6 16,16 6,26"/></svg>';
    aR.addEventListener('click',function(){activate((dialOffset+1)%N);});
    center.appendChild(aR);
  }

  build();
  var cur=(typeof VIEW!=='undefined')?VIEW:'timeline';
  window._dialSyncToView(cur);
}

// ═══════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════
async function boot(){
  try{const r=await fetch('data/islamic/core.json');PEOPLE=await r.json();}
  catch(e){try{const r=await fetch('./data/islamic/core.json');PEOPLE=await r.json();}catch(_){PEOPLE=[];}}

  try{const r=await fetch('data/islamic/name_variants.json');window._NAME_VARIANTS=await r.json();}
  catch(e){window._NAME_VARIANTS={};}

  try{const r=await fetch('data/islamic/events/master.json');window.eventsData=await r.json();}
  catch(e){window.eventsData=[];}

  const his=PEOPLE.filter(p=>p.dob>=550);
  if(his.length){
    const mn=Math.min(...his.map(p=>p.dob));
    const mx=Math.max(...PEOPLE.map(p=>(p.dod||p.dob)).filter(y=>y<2100));
    document.getElementById('statFigures').textContent=PEOPLE.length.toLocaleString()+' Figures';
    const relCount=PEOPLE.reduce((s,p)=>s+(p.teachers?.length||0)+(p.relations?.length||0),0);
    document.getElementById('statRelations').textContent=relCount.toLocaleString()+' Relations';

    // Count free books across all detail chunks (background)
    const CHUNKS=['hadith','lineage','philosophy','poets','rulers','sahaba','sahabiyya','scholars','sciences','sufis-early','sufis-orders','tabiun'];
    let _freeBookCount=0;
    const el=document.getElementById('statBooks');
    Promise.all(CHUNKS.map(c=>_loadChunk(c))).then(arrs=>{
      arrs.forEach(arr=>arr.forEach(rec=>{
        if(rec.books) rec.books.forEach(b=>{ if(b.url) _freeBookCount++; });
      }));
      el.textContent=_freeBookCount.toLocaleString()+' Free Books';
    });
  }

  // Sort types and traditions by the earliest DOB of any person in that group
  // This ensures Prophet comes first (Adam ~4000 BCE), then Founders, Sahaba etc.
  function chronoSort(values, field){
    const earliest = {};
    values.forEach(v => {
      const members = PEOPLE.filter(p => p[field] === v);
      earliest[v] = members.length ? Math.min(...members.map(p => p.dob)) : 9999;
    });
    return [...values].sort((a,b) => earliest[a] - earliest[b]);
  }
  const types = chronoSort([...new Set(PEOPLE.map(p=>p.type).filter(Boolean))], 'type');
  // Inject tag-based virtual types that don't correspond to p.type
  // Place Ashra Mubashshara right after Sahaba (they are Sahaba/Caliphs)
  const sahabaIdx = types.indexOf('Sahaba');
  const insertAt = sahabaIdx >= 0 ? sahabaIdx + 1 : types.length;
  types.splice(insertAt, 0, 'Ashra Mubashshara');
  // Inject Mujaddid tag-based virtual type (renewers of the faith)
  if(!types.includes('Mujaddid')) types.push('Mujaddid');
  // Inject IH sub-lane display names as virtual type filters
  IH_SUBLANE_ORDER.forEach(sl=>{ if(sl!=='Islamic History'&&!types.includes(sl)) types.push(sl); });
  const trads = chronoSort([...new Set(PEOPLE.map(p=>p.tradition).filter(Boolean))], 'tradition');
  buildDD('type',types); buildDD('trad',trads);
  buildSLDD('type',types); buildSLDD('trad',trads);

  setHeight(); window.addEventListener('resize',()=>{setHeight();if(VIEW==='map')_setMapHeight();});
  document.addEventListener('click',e=>{
    if(!e.target.closest('.dd-wrap')){
      document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
      document.querySelectorAll('.dd-btn.open').forEach(b=>b.classList.remove('open'));
    }
  });

  try{if(window._ensureWikidata) await window._ensureWikidata();}catch(e){}
  try{if(window._preloadJourneyIndex) await window._preloadJourneyIndex();}catch(e){}
  try{var _flEl=document.getElementById('statFollowLives');if(_flEl&&window._journeyFigures)_flEl.textContent='Follow '+window._journeyFigures.size+' Lives';}catch(e){}

  initSlider();
  initCentScrollbar();
  updateCentHeaders();
  updateCentScrollbar();
  renderAll();

  _dialInit();
  _updateFavFilterBtn();
  // If silsila tab was already active (e.g. URL hash loaded) trigger render now
  if(VIEW==='silsila') renderSilsila();

  // ── URL share restore (takes priority over hash) ──
  if(window.location.search&&typeof window._shareRestoreFromURL==='function'){
    window._shareRestoreFromURL();
  } else {
    // ── Browser history: set initial state ──
    history.replaceState({view:VIEW},'','#'+VIEW);
    var _bootHash=location.hash.replace('#','');
    if(_bootHash&&_bootHash!==VIEW){
      var _bhParts=_bootHash.split('/');
      var _bhView=_bhParts[0];
      setView(_bhView);
      if(_bhView==='talk'&&_bhParts[1]&&typeof window._talkSelectScholar==='function'){
        setTimeout(function(){window._talkSelectScholar(_bhParts[1]);},100);
      }
      if(_bhView==='one'&&_bhParts[1]&&typeof window._oneClickName==='function'){
        setTimeout(function(){window._oneClickName(decodeURIComponent(_bhParts[1]));},100);
      }
    }
  }

  // ── Run validators (non-blocking, logs only) ──
  try{
    var vk=Object.keys(window._validators||{});
    vk.forEach(function(k){try{window._validators[k]();}catch(e){console.warn('[validator:'+k+'] error',e);}});
  }catch(e){}
}

// ── Browser history: handle Back/Forward ──
window.addEventListener('popstate',function(e){
  window._popstateInProgress=true;
  var state=e.state;
  if(state&&state.view){
    setView(state.view);
    if(state.scholar&&typeof window._talkSelectScholar==='function'){
      window._talkSelectScholar(state.scholar);
    }
    if(state.view==='talk'&&!state.scholar&&typeof window._talkBack==='function'){
      window._talkBack();
    }
    if(state.figure){
      var idx=_lastSortedPeople.findIndex(function(p){return p.famous===state.figure;});
      if(idx>=0) selectRow(idx);
      if(state.view==='one'&&typeof window._oneClickName==='function'){
        window._oneClickName(state.figure);
      }
    }
  } else {
    setView('timeline');
  }
  window._popstateInProgress=false;
});

function setHeight(){
  const topBar=document.getElementById('topBar');
  const barH=topBar?topBar.offsetHeight:0;
  const foot=document.querySelector('footer').offsetHeight;
  const ms=document.getElementById('mainShell');
  ms.style.marginTop=barH+'px';
  ms.style.height=`calc(100vh - ${barH+foot}px)`;
}
const _resizeShell=setHeight;

// ═══════════════════════════════════════════════════════════
// DROPDOWNS
// ═══════════════════════════════════════════════════════════
function buildDD(kind,values){
  const panel=document.getElementById(kind==='type'?'typePanel':'tradPanel');
  const si=document.createElement('input');
  si.type='text';si.className='dd-search';si.placeholder='Search...';
  si.oninput=function(){
    const q=si.value.toLowerCase();
    panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){
      el.style.display=el.innerText.toLowerCase().includes(q)?'':'none';
    });
  };
  panel.appendChild(si);
  values.forEach(v=>{
    const el=document.createElement('div');
    el.className='dd-item'; el.dataset.val=v;
    el.innerHTML=`<div class="dd-checkbox"></div><span>${v}</span>`;
    el.onclick=()=>ddToggle(kind,v); panel.appendChild(el);
  });
}
function toggleDD(kind){
  const panel=document.getElementById(kind==='type'?'typePanel':'tradPanel');
  const btn=document.getElementById(kind==='type'?'typeBtn':'tradBtn');
  const wasOpen=panel.classList.contains('open');
  document.querySelectorAll('.dd-panel.open').forEach(p=>p.classList.remove('open'));
  document.querySelectorAll('.dd-btn.open').forEach(b=>b.classList.remove('open'));
  if(!wasOpen){
    panel.classList.add('open');btn.classList.add('open');
    var si=panel.querySelector('.dd-search');
    if(si){si.value='';si.dispatchEvent(new Event('input'));si.focus();}
  }
}
function ddClearAll(kind){
  const sel=kind==='type'?selTypes:selTrads;
  sel.clear(); syncDD(kind); applyFilterAndFocus();
}
function ddToggle(kind,v){
  const sel=kind==='type'?selTypes:selTrads;
  sel.has(v)?sel.delete(v):sel.add(v);
  syncDD(kind); applyFilterAndFocus();
}
function clearAllFilters(){
  selTypes.clear(); selTrads.clear();
  syncDD('type'); syncDD('trad');
  applyFilterAndFocus();
}
function syncDD(kind){
  const sel=kind==='type'?selTypes:selTrads;
  const panel=document.getElementById(kind==='type'?'typePanel':'tradPanel');
  const cnt=document.getElementById(kind==='type'?'typeCount':'tradCount');
  const allCk=document.getElementById(kind==='type'?'typeAllCk':'tradAllCk');
  const btn=document.getElementById(kind==='type'?'typeBtn':'tradBtn');
  const dot=document.getElementById(kind==='type'?'typeDot':'tradDot');

  panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(item=>{
    const on=sel.has(item.dataset.val);
    item.classList.toggle('selected',on);
    item.querySelector('.dd-checkbox').textContent=on?'✓':'';
  });
  allCk.textContent=sel.size===0?'✓':'';

  if(sel.size>0){
    cnt.textContent=sel.size; cnt.style.display='';
    btn.classList.add('filtered');
    dot.style.display='inline-block';
  } else {
    cnt.style.display='none';
    btn.classList.remove('filtered');
    dot.style.display='none';
  }

  // Inline × clear button
  var oldX=btn.querySelector('.dd-clear-x');
  if(oldX) oldX.remove();
  if(sel.size>0){
    var xEl=document.createElement('span');
    xEl.className='dd-clear-x';
    xEl.textContent='\u00D7';
    xEl.onclick=function(e){e.stopPropagation();ddClearAll(kind);applyFilterAndFocus();};
    btn.appendChild(xEl);
  }

  // Update summary label
  updateFilterSummary();
}
function updateFilterSummary(){
  const parts=[];
  if(selTypes.size>0) parts.push([...selTypes].join(', '));
  if(selTrads.size>0) parts.push([...selTrads].join(', '));
  const sumEl=document.getElementById('filterSummary');
  const clrEl=document.getElementById('filterClearAll');
  if(parts.length>0){
    sumEl.textContent='↳ '+parts.join(' · ');
    sumEl.classList.add('visible');
    clrEl.classList.add('visible');
  } else {
    sumEl.classList.remove('visible');
    clrEl.classList.remove('visible');
  }
}
function onSearch(){searchQ=document.getElementById('search').value.trim();applyFilterAndFocus();}

// ═══════════════════════════════════════════════════════════
// FILTER
// ═══════════════════════════════════════════════════════════
// Full Adam→Muhammad prophetic lineage chain (50 members).
// Verified against lineage_adam_to_muhammad_FINAL.xlsx — 27 Mar 2026.
// Used by isLineageMember() for Silsila lane assignment and type filtering.
const LINEAGE_CHAIN=[
  'Adam','Shith ibn Adam','Yanash','Qaynan ibn Anush','Mahlail ibn Qaynan',
  'Yared ibn Mahlail','Idris','Mattushalakh ibn Idris','Lamak ibn Mattushalakh','Nuh',
  'Sam ibn Nuh','Arfakhshadh ibn Sam','Shalikh ibn Arfakhshadh','Abir ibn Shalikh',
  "Faligh ibn Abir","Ra'u ibn Faligh","Sarugh ibn Ra'u",'Nahur ibn Sarugh',
  'Azar ibn Nahur','Ibrahim','Ismail','Nabit ibn Ismail',
  'Yashjub ibn Nabit',"Ya'rub ibn Yashjub","Tayrah ibn Ya'rub",'Nahur ibn Tayrah',
  'Muqawwam ibn Nahur','Udd ibn Muqawwam',
  'Adnan',"Ma'ad ibn Adnan","Nizar ibn Ma'ad",'Mudar ibn Nizar','Ilyas ibn Mudar',
  'Mudrikah ibn Ilyas','Khuzayma ibn Mudrikah','Kinana ibn Khuzayma',
  'al-Nadr ibn Kinana','Malik ibn al-Nadr','Fihr ibn Malik','Ghalib ibn Fihr',
  "Lu'ayy ibn Ghalib","Ka'b ibn Lu'ayy","Murrah ibn Ka'b",'Kilab ibn Murrah',
  'Qusayy ibn Kilab','Abd Manaf ibn Qusayy','Hashim ibn Abd Manaf',
  'Abd al-Muttalib ibn Hashim','Abd Allah ibn Abd al-Muttalib','Prophet Muhammad'
];
const PROPHET_CHAIN = new Set(LINEAGE_CHAIN);

// The ten Companions promised Paradise — hardcoded for virtual type filter
const ASHRA_MUBASHSHARA = new Set([
  'Abu Bakr al-Siddiq','Umar ibn al-Khattab','Uthman ibn Affan','Ali ibn Abi Talib',
  'Talha ibn Ubayd Allah','Zubayr ibn al-Awwam','Abd al-Rahman ibn Awf',
  "Sa'd ibn Abi Waqqas","Sa'id ibn Zayd",'Abu Ubayda ibn al-Jarrah'
]);

// Silsila global state — built once by renderSilsila()
let SL_NM={};        // name → {x, y, li, col}
let SL_STUDENTS={};  // name → [student famous names]
let SL_EDGES=[];     // [{from, to, col, d}] — stored as data, rendered on demand
let SL_HOVERED=null; // currently hovered person name (for hover-dim logic)
let SL_ALL_LANES=[];  // full tradition lane list, built once from PEOPLE
let SL_LANES_KEY='';  // fingerprint of currently-rendered lanes — drives re-render on filter change

function getFiltered(){
  return PEOPLE.filter(p=>{
    if(selTypes.size>0){
      const passType = selTypes.has(p.type);
      const passChainProphet = selTypes.has('Genealogy') && PROPHET_CHAIN.has(p.famous);
      // Tag-based type filters (e.g. Ashra Mubashshara stored in p.tags)
      const passTags = (p.tags||[]).some(t=>selTypes.has(t));
      // IH sub-lane virtual type filters (e.g. "Prophets" matches type=Prophet)
      const passIHSub = [...selTypes].some(st=>_IH_SUBLANE_REV[st]&&_IH_SUBLANE_REV[st].has(p.type));
      // Ashra Mubashshara: match by hardcoded name list; also include them under "Companions"
      const passAshra = (selTypes.has('Ashra Mubashshara')||selTypes.has('Companions')) && ASHRA_MUBASHSHARA.has(p.famous);
      if(!passType && !passChainProphet && !passTags && !passIHSub && !passAshra) return false;
    }
    if(selTrads.size>0&&!selTrads.has(p.tradition))return false;
    if(searchQ){
      const q=searchQ.toLowerCase();
      const vars=window._NAME_VARIANTS&&p.slug?window._NAME_VARIANTS[p.slug]||[]:[];
      const hay=[p.famous,p.full,p.primaryTitle,p.titles||'',p.city,p.classif,p.tradition,p.type,...(p.tags||[]),...vars].join(' ').toLowerCase();
      if(!hay.includes(q))return false;
    }
    /* Saved figures filter */
    if(APP.filterFavsOnly && APP.Favorites){
      if(!APP.Favorites.has(p.famous)) return false;
    }
    return true;
  });
}

// ═══════════════════════════════════════════════════════════
// AUTO-FOCUS: centre century on first visible person
// ═══════════════════════════════════════════════════════════
function applyFilterAndFocus(){
  const filtered=getFiltered();
  // Sort chronologically to find the earliest person for auto-focus
  const sorted=[...filtered].sort((a,b)=>a.dob-b.dob);
  let firstP=null;
  for(const p of sorted){
    if(activeYear!==null){
      const dod=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
      if(p.dob>activeYear||dod<activeYear) continue;
    }
    firstP=p; break;
  }
  if(firstP){
    const cent=gc(firstP.dob);
    const idx=ALL_CENTS.indexOf(cent);
    if(idx!==-1){centIdx=Math.max(idx,1); setCW();}
    updateCentHeaders(); updateCentScrollbar();
  }
  renderAll(filtered);
  if(VIEW==='silsila') updateSilsilaHighlight();
  if(VIEW==='map') _renderMarkers();
  if(VIEW==='events' && typeof window._eventsApplySearch === 'function') window._eventsApplySearch();
}

function setCW(){
  // Centre column (CW[1]) is ALWAYS at least 6th century (ALL_CENTS index >= 1).
  // centIdx=0 is allowed only to mean "show pre-Islamic in left column".
  // This prevents CW=[0,0,6] (duplicate pre-Islamic).
  const safeIdx = Math.max(centIdx, 1); // centre never uses index 0
  const c    = ALL_CENTS[safeIdx];                                      // centre = 6th+
  const prev = safeIdx === 1 ? 0 : ALL_CENTS[safeIdx-1];               // left = pre-Islamic when at 6th
  const next = ALL_CENTS[Math.min(ALL_CENTS.length-1, safeIdx+1)];     // right = next century
  CW = [prev, c, next];
}

// ═══════════════════════════════════════════════════════════
// CENTURY HEADERS
// ═══════════════════════════════════════════════════════════
function updateCentHeaders(){
  const [c0,c1,c2]=CW;
  function lbl(c){return c===0?'PRE-ISLAMIC':centLabel(c)+' C.'}
  function yrLbl(c){return c===0?'Pre-600 CE':c>0?((c-1)*100)+' – '+(c*100):''}
  document.getElementById('ch0t').textContent=lbl(c0);
  document.getElementById('ch1t').textContent=lbl(c1);
  document.getElementById('ch2t').textContent=lbl(c2);
  document.getElementById('ch0y').textContent=yrLbl(c0);
  document.getElementById('ch1y').textContent=yrLbl(c1);
  document.getElementById('ch2y').textContent=yrLbl(c2);
}

// ═══════════════════════════════════════════════════════════
// CENTURY SCROLLBAR (at bottom)
// ═══════════════════════════════════════════════════════════
function initCentScrollbar(){
  const track=document.getElementById('centScrollTrack');
  const thumb=document.getElementById('centScrollThumb');

  function setFromPx(px,w){
    const ratio=Math.max(0,Math.min(1,px/w));
    const idx=Math.round(ratio*(ALL_CENTS.length-1));
    if(idx!==centIdx){
      centIdx=idx; setCW();
      updateCentHeaders(); updateCentScrollbar(); renderAll();
    }
  }

  let dragging=false;
  thumb.addEventListener('mousedown',e=>{
    dragging=true; thumb.classList.add('dragging'); e.preventDefault();
    const r=track.getBoundingClientRect(); setFromPx(e.clientX-r.left,r.width);
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const r=track.getBoundingClientRect(); setFromPx(e.clientX-r.left,r.width);
  });
  document.addEventListener('mouseup',()=>{dragging=false;thumb.classList.remove('dragging');});
  track.addEventListener('click',e=>{
    const r=track.getBoundingClientRect(); setFromPx(e.clientX-r.left,r.width);
  });
  thumb.addEventListener('keydown',e=>{
    if(e.key==='ArrowRight'){centIdx=Math.min(ALL_CENTS.length-1,centIdx+1);setCW();updateCentHeaders();updateCentScrollbar();renderAll();}
    if(e.key==='ArrowLeft'){centIdx=Math.max(0,centIdx-1);setCW();updateCentHeaders();updateCentScrollbar();renderAll();}
  });
}

function updateCentScrollbar(){
  const total=ALL_CENTS.length;
  const pct=(centIdx/(total-1))*100;
  const thumbW=Math.round(100/total);
  const thumbLeft=Math.max(0,Math.min(100-thumbW,pct-thumbW/2));
  document.getElementById('centScrollThumb').style.left=thumbLeft+'%';
  document.getElementById('centScrollThumb').style.width=thumbW+'%';
  document.getElementById('centScrollFill').style.width=pct+'%';
}

// ═══════════════════════════════════════════════════════════
// YEAR SLIDER
// ═══════════════════════════════════════════════════════════
function initSlider(){
  const track=document.getElementById('sliderTrack');
  const thumb=document.getElementById('sliderThumb');
  const fill=document.getElementById('sliderFill');

  function yr2pct(yr){return((yr-MIN_YR)/(MAX_YR-MIN_YR))*100;}
  function px2yr(px,w){return Math.round((MIN_YR+Math.max(0,Math.min(1,px/w))*(MAX_YR-MIN_YR))/5)*5;}

  function setYear(yr){
    const pct=yr2pct(yr);
    thumb.style.left=pct+'%'; fill.style.width=pct+'%';
    activeYear=yr;
    _viewYears[VIEW]=yr;
    if(VIEW==='map'&&typeof _applyMapYear==='function') _applyMapYear(yr);
    if(typeof _onSliderYear==='function') _onSliderYear(yr);
    // For years before 600 CE, keep centre at 6th century (centIdx=1)
    const cent=yr<600?6:Math.ceil(yr/100);
    const idx=ALL_CENTS.indexOf(cent);
    if(idx!==-1){centIdx=Math.max(idx,1); setCW();}
    document.getElementById('yearDisplay').textContent=yr+' CE';
    const cb=document.getElementById('yearClearBtn'); if(cb) cb.classList.add('active');
    updateCentHeaders(); updateCentScrollbar();
    renderAll();
  }
  window._setSliderYear=setYear;

  let dragging=false;
  function doMove(e){
    if(typeof _mapAnimStop==='function') _mapAnimStop();
    const r=track.getBoundingClientRect();
    const x=e.touches?e.touches[0].clientX:e.clientX;
    setYear(px2yr(x-r.left,r.width));
  }
  thumb.addEventListener('mousedown',e=>{dragging=true;thumb.classList.add('dragging');e.preventDefault();doMove(e);});
  thumb.addEventListener('touchstart',e=>{dragging=true;thumb.classList.add('dragging');e.preventDefault();doMove(e);},{passive:false});
  track.addEventListener('click',e=>{const r=track.getBoundingClientRect();setYear(px2yr(e.clientX-r.left,r.width));});
  document.addEventListener('mousemove',e=>{if(!dragging)return;doMove(e);});
  document.addEventListener('touchmove',e=>{if(!dragging)return;doMove(e);},{passive:false});
  document.addEventListener('mouseup',()=>{dragging=false;thumb.classList.remove('dragging');});
  document.addEventListener('touchend',()=>{dragging=false;thumb.classList.remove('dragging');});
  thumb.addEventListener('keydown',e=>{
    let yr=activeYear||800;
    if(e.key==='ArrowRight'||e.key==='ArrowUp')yr=Math.min(MAX_YR,yr+5);
    if(e.key==='ArrowLeft'||e.key==='ArrowDown')yr=Math.max(MIN_YR,yr-5);
    if(e.key==='PageUp')yr=Math.min(MAX_YR,yr+100);
    if(e.key==='PageDown')yr=Math.max(MIN_YR,yr-100);
    setYear(yr);
  });
  // Slider starts at left edge — inactive until user clicks YEAR FILTER
  thumb.style.left='0%'; fill.style.width='0%';
}

function toggleYearSlider(){
  // Slider is now always visible in hdrRow3 — toggle is a no-op
}

function clearYear(){
  activeYear=null;
  _viewYears[VIEW]=null;
  if(VIEW==='map'&&typeof _applyMapYear==='function') _applyMapYear(null);
  if(typeof _onSliderYear==='function') _onSliderYear(null);
  document.getElementById('yearDisplay').textContent='\u2014';
  const cb=document.getElementById('yearClearBtn'); if(cb) cb.classList.remove('active');
  updateCentHeaders(); updateCentScrollbar();
  renderAll();
}

// ═══════════════════════════════════════════════════════════
// VIEW
// ═══════════════════════════════════════════════════════════
function _syncSliderUI(){
  const thumb=document.getElementById('sliderThumb');
  const fill=document.getElementById('sliderFill');
  const cb=document.getElementById('yearClearBtn');
  if(activeYear!==null){
    const pct=((activeYear-MIN_YR)/(MAX_YR-MIN_YR))*100;
    thumb.style.left=pct+'%'; fill.style.width=pct+'%';
    document.getElementById('yearDisplay').textContent=activeYear+' CE';
    if(cb) cb.classList.add('active');
  } else {
    thumb.style.left='0%'; fill.style.width='0%';
    document.getElementById('yearDisplay').textContent='\u2014';
    if(cb) cb.classList.remove('active');
  }
}

function setView(v){
  // Save current view's year, restore new view's year
  _viewYears[VIEW]=activeYear;
  activeYear=_viewYears[v]!=null?_viewYears[v]:null;
  if(v==='map') _mapYear=activeYear;
  _syncSliderUI();

  VIEW=v;
  document.querySelectorAll('.view-tab').forEach(t=>{
    const txt=t.textContent.trim().toLowerCase().replace(/\s+/g,'');
    t.classList.toggle('active',txt===v.toLowerCase().replace(/\s+/g,''));
  });
  document.getElementById('leftPanel').style.display=v==='timeline'?'flex':'none';
  document.getElementById('filterBar').style.display=v==='timeline'?'flex':'none';
  document.getElementById('hdrRow4').style.display=v==='timeline'?'flex':'none';
  const ip=document.getElementById('infoPanel');
  if(v==='map'||v==='silsila'||v==='studyroom'||v==='eras'||v==='events'||v==='one'||v==='follow'||v==='talk'){
    ip.style.display='none'; ip.style.flex=''; ip.style.minWidth='';
  } else {
    ip.style.display=''; ip.style.flex=''; ip.style.minWidth='';
  }
  document.getElementById('silsilaView').classList.toggle('active',v==='silsila');
  document.getElementById('mapView').classList.toggle('active',v==='map');
  document.getElementById('studyRoomView').classList.toggle('active',v==='studyroom');
  document.getElementById('eras-view').style.display=v==='eras'?'flex':'none';
  document.getElementById('events-view').style.display=v==='events'?'flex':'none';
  document.getElementById('one-view').style.display=v==='one'?'flex':'none';
  var _fvEl=document.getElementById('follow-view');
  _fvEl.style.display=v==='follow'?'flex':'none';
  if(v==='follow') _fvEl.style.flexDirection='column';
  document.getElementById('talk-view').style.display=v==='talk'?'flex':'none';
  // Show year controls only on views that use the slider
  const yc=document.getElementById('hdrYearControls');
  if(yc) yc.style.display=(v==='timeline'||v==='silsila'||v==='map'||v==='eras')?'flex':'none';
  if(v==='studyroom'||v==='eras'||v==='events'||v==='one'||v==='follow'||v==='talk'){
    document.getElementById('leftPanel').style.display='none';
    document.getElementById('filterBar').style.display='none';
  }
  // Re-measure topBar height after row visibility change
  _resizeShell();
  if(v!=='map'){ _unpinMapTT(); _closeMapCard(); }
  if(v==='silsila') renderSilsila();
  if(v==='map'){ _setMapHeight(); renderMap(); }
  if(v==='eras'&&typeof initEras==='function') initEras();
  if(v==='events'&&typeof initEvents==='function') initEvents();
  if(v==='one'&&typeof initOne==='function') initOne();
  if(v==='follow'&&typeof initFollow==='function') initFollow();
  if(v!=='follow'&&typeof _fwCleanup==='function') _fwCleanup();
  if(v==='talk'&&typeof initTalk==='function') initTalk();
  if(v==='studyroom'&&typeof _buildStudySidebar==='function') _buildStudySidebar();
  // Push browser history on view change
  if(!window._popstateInProgress){
    history.pushState({view:v},'','#'+v);
  }
  if(typeof window._dialSyncToView==='function') window._dialSyncToView(v);
}

// ═══════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════
function renderAll(filtered){
  if(!filtered) filtered=getFiltered();
  const sorted = [...filtered].sort((a,b)=>a.dob-b.dob);
  renderRows(sorted);
  if(activePerson){
    const still=sorted.find(p=>p.famous===activePerson.famous);
    if(still) renderInfoWithDetails(still); else{activePerson=null;showEmptyInfo();}
  }
  if(VIEW==='silsila') updateSilsilaHighlight();
}

// ── Era definitions for timeline bands ──
const _ERA_BANDS=[
  {min:-Infinity,max:632,  name:'Prophetic Era',      dates:'Before 632 CE',    bg:'rgba(139,105,20,0.08)', border:'rgb(139,105,20)'},
  {min:632,      max:661,  name:'Rashidun',            dates:'632\u2013661 CE',  bg:'rgba(45,90,61,0.10)',  border:'rgb(45,90,61)'},
  {min:661,      max:750,  name:'Umayyad',             dates:'661\u2013750 CE',  bg:'rgba(90,61,45,0.10)',  border:'rgb(90,61,45)'},
  {min:750,      max:1258, name:'Abbasid Golden Age',  dates:'750\u20131258 CE', bg:'rgba(45,61,90,0.10)',  border:'rgb(45,61,90)'},
  {min:1258,     max:1500, name:'Post-Mongol',         dates:'1258\u20131500 CE',bg:'rgba(74,45,74,0.10)',  border:'rgb(74,45,74)'},
  {min:1500,     max:1800, name:'Gunpowder Empires',   dates:'1500\u20131800 CE',bg:'rgba(61,74,45,0.10)',  border:'rgb(61,74,45)'},
  {min:1800,     max:1950, name:'Colonial & Reform',   dates:'1800\u20131950 CE',bg:'rgba(90,74,45,0.10)',  border:'rgb(90,74,45)'},
  {min:1950,     max:Infinity,name:'Contemporary',     dates:'1950\u2013Present',bg:'rgba(45,74,74,0.10)',  border:'rgb(45,74,74)'}
];
function _getEra(dob){
  for(let i=0;i<_ERA_BANDS.length;i++){
    if(dob<_ERA_BANDS[i].max) return _ERA_BANDS[i];
  }
  return _ERA_BANDS[_ERA_BANDS.length-1];
}

function renderRows(filtered){
  _lastSortedPeople=filtered; // FIX: store so selectRow uses same sorted array
  const container=document.getElementById('rowsScroll');
  const [c0,c1,c2]=CW;
  let html='';

  // Pre-compute era assignments for begin/end badges
  // We need two passes: first to find visible rows, then to mark first/last per era
  const _visibleRows=[];
  filtered.forEach((p,i)=>{
    if(activeYear!==null){
      const dob=p.dob;
      const dod=p.dod!==undefined&&p.dod!==null?p.dod:dob+60;
      if(dob>activeYear||dod<activeYear) return;
    }
    _visibleRows.push({p,i,era:_getEra(p.dob)});
  });
  const _eraFirst=new Set(), _eraLast=new Set();
  let _prevEn='';
  _visibleRows.forEach((r,vi)=>{
    if(r.era.name!==_prevEn){ _eraFirst.add(r.i); _prevEn=r.era.name; }
  });
  _prevEn='';
  for(let vi=_visibleRows.length-1;vi>=0;vi--){
    const r=_visibleRows[vi];
    if(r.era.name!==_prevEn){ _eraLast.add(r.i); _prevEn=r.era.name; }
  }

  // ── Pre-Islamic scale ──────────────────────────────────────────────────
  const PRE_START = -10000;
  const PRE_END   = 600;
  const PRE_RANGE = PRE_END - PRE_START; // 10600 years
  const PRE_MIN_W = 5.5; // minimum bar width % — always visible

  filtered.forEach((p,i)=>{
    // Auto-hide: if year filter active and person wasn't alive, skip entirely
    if(activeYear!==null){
      const dob=p.dob;
      const dod=p.dod!==undefined&&p.dod!==null?p.dod:dob+60;
      if(dob>activeYear||dod<activeYear) return;
    }

    const era=_getEra(p.dob);

    // Genealogy chain gets a distinct gold colour regardless of century
    const col = p.type==='Genealogy' ? '#D4AF37' : (CC[gc(p.dob)]||'#A0AEC0');
    const isSel=activePerson&&activePerson.famous===p.famous;
    const isProphet=p.famous==='Prophet Muhammad';

    let cellsHtml='';
    [c0,c1,c2].forEach((c,ci)=>{
      // c===0: Pre-Islamic column — BCE figures AND CE figures born before 500
      // (ALL_CENTS jumps 0→6th century, so dob 0-499 CE has no other column)
      // CE figures 500+ (Prophet Muhammad etc.) show in century cells instead
      if(c===0){
        let barHtml2='';
        const dod2=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
        if(p.dob < 500 && !(p.dob >= 0 && dod2 > 500)){
          // FIX: was "p.dob < 0" — excluded 16 prophetic lineage figures born 0-499 CE
          // who had no century column at all (gap: ALL_CENTS skips 1st-5th centuries)
          const bL = Math.max(0, Math.min(94, ((p.dob - PRE_START) / PRE_RANGE) * 100));
          const bW = PRE_MIN_W;
          barHtml2=`<div class="lbar" style="left:${bL.toFixed(1)}%;width:${bW}%;background:linear-gradient(90deg,${col}ee,${col}88);box-shadow:0 0 5px ${col}66"></div>`;
        }
        cellsHtml+=`<div class="tc-cent${ci===1?' hi':''}">${barHtml2}</div>`;
        return;
      }
      const cStart=(c-1)*100,cEnd=c*100;
      const dob=p.dob,dod=p.dod!==undefined&&p.dod!==null?p.dod:dob+60;
      let barHtml='',mrkHtml='';
      // Pre-Islamic BCE figures (dob<0) are handled exclusively by c===0 column.
      // CE figures born before 600 (e.g. Prophet Muhammad 570 CE) still show in century cells.
      if(dob>=0 && dob<cEnd&&dod>cStart){
        const bL=Math.max(0,(dob-cStart)/(cEnd-cStart))*100;
        const bR=Math.min(100,(dod-cStart)/(cEnd-cStart))*100;
        const bW=Math.max(3,bR-bL);
        barHtml=`<div class="lbar" style="left:${bL.toFixed(1)}%;width:${bW.toFixed(1)}%;`+
                `background:linear-gradient(90deg,${col}e8,${col}70);`+
                `box-shadow:0 0 6px ${col}55"></div>`;
      }
      if(ci===1&&activeYear!==null){
        const pct=Math.max(0,Math.min(100,((activeYear-cStart)/(cEnd-cStart))*100));
        mrkHtml=`<div class="yr-line" style="left:${pct.toFixed(1)}%"></div>`;
      }
      cellsHtml+=`<div class="tc-cent${ci===1?' hi':''}">${barHtml}${mrkHtml}</div>`;
    });

    let badgeHtml='';
    if(_eraFirst.has(i)){
      badgeHtml+=`<div class="era-badge" style="border-color:${era.border};background:${era.bg}"><div class="era-badge-name">${era.name}</div><div class="era-badge-label">begins</div></div>`;
    }
    if(_eraLast.has(i)){
      badgeHtml+=`<div class="era-badge era-badge-end" style="border-color:${era.border};background:${era.bg}"><div class="era-badge-name">${era.name}</div><div class="era-badge-label">ends</div></div>`;
    }

    html+=`<div class="tl-row${isSel?' sel':''}${isProphet?' prophet-row':''}" data-idx="${i}" data-era-bg="${era.bg}" onclick="selectRow(${i})" style="background:${era.bg}">
      <div class="tc-name">
        <div class="tc-dot" style="background:${col};width:${p.dob<0?3:p.dob<600?5:7}px;height:${p.dob<0?3:p.dob<600?5:7}px;opacity:${p.dob<0?0.45:p.dob<600?0.7:1}${isProphet?';box-shadow:0 0 5px '+col+'90':''}"></div>
        <div class="tc-texts">
          <div class="tc-famous"${_SR_BADGE_NAMES.has(p.famous)?' style="color:#D4AF37"':''}>${esc(p.famous)}${_SR_BADGE_NAMES.has(p.famous)?`<span class="sr-study-badge" onclick="event.stopPropagation();openStudyRoom('${_SR_SLUG_MAP[p.famous]}')" title="Available in Study Space">✦</span>`:''}${window._wikidata&&window._wikidata[p.slug]&&window._wikidata[p.slug].wikipedia&&window._wikidata[p.slug].wikipedia.en?`<a class="tl-wiki-link" href="https://en.wikipedia.org/wiki/${encodeURIComponent(window._wikidata[p.slug].wikipedia.en.replace(/ /g,'_'))}" target="_blank" rel="noopener" title="Open in Wikipedia" onclick="event.stopPropagation()">W</a>`:''}</div>
          <div class="tc-sub">${esc(p.primaryTitle||p.classif||'')}</div>
        </div>
      </div>
      <div class="tc-cents">${cellsHtml}${badgeHtml}</div>
    </div>`;
  });

  container.innerHTML=html;
  if(activePerson){
    const sel=container.querySelector('.sel');
    if(sel)sel.scrollIntoView({block:'nearest'});
  }
  // Era-tinted column headers on scroll
  if(!container._eraScrollBound){
    container._eraScrollBound=true;
    const fb=document.getElementById('filterBar');
    container.addEventListener('scroll',function(){
      const rows=container.querySelectorAll('.tl-row');
      for(let r=0;r<rows.length;r++){
        const rect=rows[r].getBoundingClientRect();
        if(rect.bottom>container.getBoundingClientRect().top){
          const bg=rows[r].dataset.eraBg;
          if(bg&&fb) fb.style.background=bg;
          break;
        }
      }
    });
  }
}

function esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function selectRow(idx){
  // FIX: use _lastSortedPeople (the sorted array that renderRows used to assign data-idx)
  // Previously used getFiltered() which returns unsorted JSON order — causing 577/611 wrong selections
  const p=_lastSortedPeople[idx]; if(!p)return;
  activePerson=p;
  document.querySelectorAll('.tl-row').forEach(r=>r.classList.toggle('sel',parseInt(r.dataset.idx)===idx));
  renderInfoWithDetails(p);
}

// ═══════════════════════════════════════════════════════════
// INFO PANEL
// ═══════════════════════════════════════════════════════════
function showEmptyInfo(){
  document.getElementById('infoScroll').innerHTML=
    `<div class="i-empty"><div class="ie-icon">☽</div><div class="ie-msg">Click a name to explore</div></div>`;
  document.getElementById('infoFilterSpacer').textContent='SELECT A FIGURE FROM THE LIST';
}

function _getContemporaries(p) {
  const dod = p.dod !== undefined && p.dod !== null
    ? p.dod : p.dob + 60;
  const results = { west: [], islamic: [], east: [] };
  PEOPLE.forEach(other => {
    if (other.famous === p.famous) return;
    if (!other.lat || !other.lng) return;
    const odod = other.dod !== undefined && other.dod !== null
      ? other.dod : other.dob + 60;
    const overlaps = !(odod < p.dob || other.dob > dod);
    if (!overlaps) return;
    if (other.lng < 15) results.west.push(other);
    else if (other.lng >= 15 && other.lng <= 75)
      results.islamic.push(other);
    else results.east.push(other);
  });
  const sorter = (a, b) =>
    Math.abs(a.dob - p.dob) - Math.abs(b.dob - p.dob);
  results.west = results.west.sort(sorter).slice(0, 7);
  results.islamic = results.islamic.sort(sorter).slice(0, 7);
  results.east = results.east.sort(sorter).slice(0, 7);
  return results;
}

function _isAssumedDate(p){
  if(p.famous==='Prophet Muhammad')return false;
  if(p._dobFromDod)return true;
  const s=((p.dob_s||'')+(p.dod_s||'')).toLowerCase();
  if(/legendary|assumed|estimated|c\./.test(s))return true;
  if((p.type==='Founder'||p.type==='Prophet')&&p.dob<500)return true;
  return false;
}
const _assumedBadge='<span style="font-size:9px;color:rgba(212,175,55,.55);cursor:help;margin-left:3px" title="Date estimated for visual placement — not historically confirmed">△</span>';

function renderInfo(p){
  const col = p.type==='Genealogy' ? '#D4AF37' : (CC[gc(p.dob)]||'#A0AEC0');
  const dob_s=p.dob!=null?(p.dob<0?`${Math.abs(p.dob)} BCE`:`${p.dob} CE`):'Unknown';
  const dod_s=p.dod!=null?(p.dod<0?`${Math.abs(p.dod)} BCE`:`${p.dod} CE`):'Unknown';
  const _ab=_isAssumedDate(p)?_assumedBadge:'';

  document.getElementById('infoFilterSpacer').textContent=
    `${centLabel(gc(p.dob)).toUpperCase()} CENTURY · ${p.tradition||''} · ${p.type||''}`;

  // Quran references section
  let quranHtml='';
  if(p.quranRef){
    const qr=p.quranRef;
    if(typeof qr==='object'&&qr.count!=null){
      quranHtml=`<div class="i-sec"><div class="i-sl">Quranic References</div>
        <div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:5px">
          <span style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:var(--ip-acc);line-height:1">${qr.count}×</span>
          <span style="font-size:11px;color:var(--ip-muted)">mentioned in the Quran</span>
          <a href="${esc(qr.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none;font-size:12px;font-weight:600">First verse: ${esc(qr.firstVerse)} ↗</a>
        </div>
        <div style="font-size:11.5px;color:var(--ip-muted);font-style:italic">${esc(qr.epithet)}</div>
      </div>`;
    } else {
      quranHtml=`<div class="i-sec"><div class="i-sl">Quranic References</div>
        <div style="font-size:13px;color:var(--ip-text);line-height:1.7">
          <span style="color:var(--ip-acc);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.06em">VERSES: </span>${esc(String(qr))}
        </div></div>`;
    }
  } else if(p.quran_refs){
    const qlink=p.quran_link?`<a href="${p.quran_link}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none;font-size:12px"> — Open in Quran.com 🌐</a>`:'';
    quranHtml=`<div class="i-sec"><div class="i-sl">Quranic References</div>
      <div style="font-size:13px;color:var(--ip-text);line-height:1.7">
        <span style="color:var(--ip-acc);font-family:'Cinzel',serif;font-size:10px;letter-spacing:.06em">VERSES: </span>${esc(p.quran_refs)}${qlink}
      </div></div>`;
  }

  let booksHtml='';
  if(p.books?.length){
    const sortedBooks=[...p.books].sort((a,b)=>/quran/i.test(a.title)?-1:/quran/i.test(b.title)?1:0);
    booksHtml=`<div class="i-sec"><div class="i-sl">Works &amp; Sources</div>
      <div class="i-books">${sortedBooks.map(b=>`
        <div class="i-book">
          <span style="color:${col};font-size:11px;flex-shrink:0">▸</span>
          <div>${b.url?`<a href="${esc(b.url)}" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">${esc(b.title)}</a>`:`<span>${esc(b.title)}</span>`}
          ${b.magnum?` <span style="color:var(--ip-acc);font-size:10px">✦</span>`:''}
          ${b.note?`<div class="i-bnote">${esc(b.note).replace(/quran\.com/g,'<a href="https://quran.com" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">quran.com</a>')}</div>`:''}</div>
        </div>`).join('')}
      </div></div>`;
  }
  let teachHtml='';
  if(p.famous!=='Prophet Muhammad'&&p.teachers?.length){
    teachHtml=`<div class="i-sec"><div class="i-sl">Teachers</div>
      <div class="i-teachers">
        ${p.teachers.map(t=>`<span class="i-teacher" onclick="jumpTo('${t.replace(/'/g,"\\'")}')">⟵ ${esc(t)}</span>`).join('')}
      </div></div>`;
  }

  // Students (people who list this figure as a teacher)
  const studentsOf=PEOPLE.filter(s=>s.teachers?.includes(p.famous));
  let studHtml='';
  if(p.famous!=='Prophet Muhammad'&&studentsOf.length){
    studHtml=`<div class="i-sec"><div class="i-sl">Students (${studentsOf.length})</div>
      <div class="i-teachers">
        ${studentsOf.map(s=>`<span class="i-student" onclick="jumpTo('${s.famous.replace(/'/g,"\\'")}')">▶ ${esc(s.famous)}</span>`).join('')}
      </div></div>`;
  }

  let relHtml='';
  if(p.relations?.length){
    relHtml=`<div class="i-sec"><div class="i-sl">Relations</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
        ${p.relations.map(r=>{
          const inData=PEOPLE.find(pp=>pp.famous===r.person);
          const relLabel=`<span class="i-rel-type">${esc(r.relation)}</span>`;
          const name=esc(r.person);
          if(inData){
            return `<span class="i-rel-chip clickable" data-rel="${esc(r.relation)}" onclick="jumpTo('${r.person.replace(/'/g,"\\'")}')" title="Go to ${esc(r.person)}">${relLabel} ${name}</span>`;
          } else {
            return `<span class="i-rel-chip" data-rel="${esc(r.relation)}">${relLabel} ${name}</span>`;
          }
        }).join('')}
      </div></div>`;
  }

  // Locate-in-silsila button (only when silsila view active and node exists)
  const locateBtn=VIEW==='silsila'&&SL_NM[p.famous]
    ?`<button class="sl-locate-btn" onclick="silsilaLocate('${p.famous.replace(/'/g,"\\'")}')">`+
      `<span class="slb-icon">◎</span>LOCATE IN CHAIN</button>`:'';

  var _isFav = APP.Favorites ? APP.Favorites.has(p.famous) : false;
  var _starHTML = '<button id="favToggleBtn" data-name="' + esc(p.famous) + '" '
    + 'title="' + (_isFav ? 'Remove from saved' : 'Save figure') + '" '
    + 'style="background:none;border:none;cursor:pointer;font-size:22px;'
    + 'color:' + (_isFav ? '#D4AF37' : 'rgba(160,174,192,0.25)') + ';'
    + 'float:right;margin-left:10px;padding:2px;line-height:1;'
    + 'transition:color 0.15s,transform 0.15s;">'
    + (_isFav ? '★' : '☆') + '</button>';

  let quotesHtml = '';
  if (p.quotes && p.quotes.length) {
    const qItems = p.quotes.map(q =>
      '<blockquote style="margin:0 0 10px 0;padding:10px 14px;' +
      'border-left:3px solid var(--ip-acc);' +
      'background:rgba(212,175,55,.05);' +
      'font-family:\'Source Sans 3\',sans-serif;font-size:13px;' +
      'font-style:normal;color:var(--ip-text);line-height:1.65;">' +
      esc(q) + '</blockquote>'
    ).join('');
    quotesHtml =
      '<div style="margin-top:18px;padding-top:14px;' +
      'border-top:1px solid var(--ip-brd);">' +
      '<div style="font-family:\'Cinzel\',serif;font-size:8px;' +
      'letter-spacing:.14em;color:var(--ip-muted);display:flex;' +
      'align-items:center;gap:6px;margin-bottom:10px;">' +
      'IN THEIR OWN WORDS' +
      '<span style="flex:1;height:1px;background:var(--ip-brd);' +
      'display:inline-block;"></span></div>' +
      qItems + '</div>';
  }

  const contemp = _getContemporaries(p);
  const hasContemp = contemp.west.length ||
    contemp.islamic.length || contemp.east.length;
  let contempHtml = '';
  if (hasContemp) {
    const colStyle =
      'display:flex;flex-direction:column;gap:4px;min-width:0;flex:1;';
    const headStyle =
      'font-family:\'Cinzel\',serif;font-size:7.5px;' +
      'letter-spacing:.14em;color:var(--ip-muted);margin-bottom:5px;';
    const chipStyle = (col) =>
      'display:inline-block;padding:2px 7px;border-radius:2px;' +
      'font-size:11.5px;font-family:\'Crimson Pro\',serif;' +
      'color:var(--ip-text);background:var(--ip-surf);' +
      'border:1px solid var(--ip-brd);cursor:pointer;' +
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;' +
      'max-width:100%;transition:border-color .12s,color .12s;' +
      'border-left:2px solid ' + col + ';';
    const makeChips = (group) => group.map(q => {
      const qcol = typeof _markerTypeColor === 'function'
        ? _markerTypeColor(q) : '#888';
      const safe = q.famous.replace(/'/g, "\\'");
      return '<span style="' + chipStyle(qcol) + '" ' +
        'onclick="selectPerson(\'' + safe + '\')" ' +
        'onmouseenter="this.style.color=\'var(--ip-acc)\';' +
        'this.style.borderColor=\'rgba(212,175,55,.4)\'" ' +
        'onmouseleave="this.style.color=\'var(--ip-text)\';' +
        'this.style.borderColor=\'var(--ip-brd)\'">' +
        esc(q.famous) + '</span>';
    }).join('');
    contempHtml =
      '<div style="margin-top:18px;padding-top:14px;' +
      'border-top:1px solid var(--ip-brd);">' +
      '<div style="font-family:\'Cinzel\',serif;font-size:8px;' +
      'letter-spacing:.14em;color:var(--ip-muted);display:flex;' +
      'align-items:center;gap:6px;margin-bottom:10px;">' +
      'CONTEMPORARIES' +
      '<span style="flex:1;height:1px;background:var(--ip-brd);' +
      'display:inline-block;"></span>' +
      '<span style="font-size:7px;opacity:.5;">ALIVE AT THE SAME TIME' +
      '</span></div>' +
      '<div style="display:flex;gap:10px;align-items:flex-start;">' +
      (contemp.west.length ?
        '<div style="' + colStyle + '"><div style="' + headStyle +
        '">WEST</div>' + makeChips(contemp.west) + '</div>' : '') +
      (contemp.islamic.length ?
        '<div style="' + colStyle + '"><div style="' + headStyle +
        '">ISLAMIC WORLD</div>' + makeChips(contemp.islamic) +
        '</div>' : '') +
      (contemp.east.length ?
        '<div style="' + colStyle + '"><div style="' + headStyle +
        '">EAST</div>' + makeChips(contemp.east) + '</div>' : '') +
      '</div></div>';
  }

  document.getElementById('infoScroll').innerHTML=`
    ${locateBtn}
    ${_starHTML}
    ${canShowImage(p) ? `
    <div id="wikiImgWrap" style="float:right;margin:0 0 12px 14px;max-width:120px;text-align:center">
      <img id="wikiImg" style="display:none;width:100%;max-width:120px;border-radius:4px;border:1px solid var(--ip-brd);object-fit:cover"
        alt="${esc(p.famous)}"
        onerror="this.style.display='none';document.getElementById('wikiImgCaption').style.display='none';" />
      <div id="wikiImgCaption" style="display:none;font-size:9px;color:var(--ip-muted);font-family:'Cinzel',serif;letter-spacing:.06em;margin-top:4px">via Wikipedia</div>
    </div>` : ''}
    <div class="i-name">${esc(p.famous)}</div>
    ${p.full&&p.full!==p.famous?`<div class="i-full">${esc(p.full)}</div>`:''}
    <div class="i-primary">${esc(p.primaryTitle||'')}</div>
    ${p.tags&&p.tags.length?`<div style="margin-bottom:10px;display:flex;flex-wrap:wrap;gap:5px">${p.tags.map(t=>`<span class="i-badge">${esc(t)}</span>`).join('')}</div>`:''}
    <div class="i-tags">
      <span class="i-tag hi">${esc(p.type||'')}</span>
      <span class="i-tag hi">${esc(p.tradition||'')}</span>
      ${p.classif?`<span class="i-tag">${esc(p.classif)}</span>`:''}
      ${p.city?`<span class="i-tag">📍 ${esc(p.city)}</span>`:''}
      ${p.lang?`<span class="i-tag">🌐 ${esc(p.lang)}</span>`:''}
    </div>
    ${(()=>{if(!window._wikidata||!window._wikidata[p.slug]||!window._wikidata[p.slug].occupations||!window._WD_OCC_LABELS) return '';const chips=window._wikidata[p.slug].occupations.slice(0,5).map(q=>window._WD_OCC_LABELS[q]).filter(Boolean);if(!chips.length) return '';return '<div class="info-wd-occupations">'+chips.map(l=>'<span class="info-wd-occ">'+esc(l)+'</span>').join('')+'</div>';})()}
    ${window._journeyFigures&&window._journeyFigures.has(p.slug)?`<a class="info-follow-link" href="#follow" onclick="event.preventDefault();window._followShowFigure('${p.slug}');return false;">&#9654; Follow their life on the map</a>`:''}
    <div class="i-dates">
      <div class="i-di"><span class="dl">BORN</span><span class="dv" style="color:${col}">${dob_s}</span>${_ab}${p.dob_s?`<span class="ds"${String(p.dob_s).startsWith('~')?' style="font-style:italic"':''}>${esc(p.dob_s)}</span>`:''}</div>
      <div class="i-di"><span class="dl">DIED</span><span class="dv" style="color:${col}">${dod_s}</span>${_ab}${p.dod_s?`<span class="ds"${String(p.dod_s).startsWith('~')?' style="font-style:italic"':''}>${esc(p.dod_s)}</span>`:''}</div>
      ${p.dob>0&&p.dod?`<div class="i-di"><span class="dl">CENTURY</span><span class="dv" style="color:${col}">${centLabel(gc(p.dob))} C.</span></div>`:''}
    </div>
    ${p.dateNote?`<div style="display:flex;align-items:flex-start;gap:5px;margin:-6px 0 13px;padding:5px 9px;background:rgba(212,175,55,.08);border:1px dashed rgba(212,175,55,.35);border-radius:3px;font-size:10.5px;color:var(--ip-muted);font-style:italic;line-height:1.45"><span style="flex-shrink:0">⚠</span><span>${esc(p.dateNote)}</span></div>`:''}
    ${(p.famous==='Prophet Muhammad'?(p.school||'The Last Prophet'):p.school)?`<div class="i-sec"><div class="i-sl">Biography</div><p>${p.famous==='Prophet Muhammad'?(p.school||'The Last Prophet'):p.school}</p></div>`:''}
    ${p.titles?`<div class="i-sec"><div class="i-sl">Titles &amp; Epithets</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">${p.titles.split('·').map(t=>t.trim()).filter(Boolean).map(t=>`<span class="i-badge">${esc(t)}</span>`).join('')}</div></div>`:''}
    ${quranHtml}${teachHtml}${studHtml}${relHtml}${booksHtml}
    ${quotesHtml}
    ${contempHtml}
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--ip-brd);display:flex;gap:8px;flex-wrap:wrap;">
      <a href="https://scholar.google.com/scholar?q=${encodeURIComponent(p.famous)}" target="_blank" rel="noopener"
        style="display:inline-flex;align-items:center;gap:6px;padding:5px 12px;border-radius:2px;
        background:var(--ip-surf);border:1px solid var(--ip-brd);
        font-family:'Cinzel',serif;font-size:8px;letter-spacing:.12em;
        color:var(--ip-muted);text-decoration:none;
        transition:color .15s,border-color .15s;"
        onmouseenter="this.style.color='var(--ip-acc)';this.style.borderColor='rgba(212,175,55,.4)'"
        onmouseleave="this.style.color='var(--ip-muted)';this.style.borderColor='var(--ip-brd)'">
        <span style="font-size:11px;">𝒮</span> SCHOLARSHIP
      </a>
    </div>
    ${p.source?`<div class="i-source">Sources: ${(()=>{
      const s=p.source;
      if(/^https?:\/\//.test(s)){
        try{
          const u=new URL(s);
          const host=u.hostname.replace(/^www\./,'');
          let label;
          if(host.includes('wikipedia')){
            const name=decodeURIComponent(u.pathname.split('/').pop()||'').replace(/_/g,' ');
            label=name?'Wikipedia — '+name+' ↗':'Wikipedia ↗';
          } else if(host.includes('sunnah.com')){
            label='Sunnah.com ↗';
          } else {
            label=host+' ↗';
          }
          return '<a href="'+esc(s)+'" target="_blank" rel="noopener" style="color:#D4AF37;text-decoration:none">'+esc(label)+'</a>';
        }catch(_){return esc(s);}
      }
      return esc(s);
    })()}</div>`:''}
  `;

  // Fetch Wikipedia image if eligible
  if (canShowImage(p)) {
    var imgEl = document.getElementById('wikiImg');
    var capEl = document.getElementById('wikiImgCaption');
    if (imgEl) fetchWikiImage(p.source, imgEl, capEl);
  }

  // Wire star button click handler
  (function() {
    var btn = document.getElementById('favToggleBtn');
    if (!btn || !APP.Favorites) return;
    btn.addEventListener('click', function() {
      var self = this;
      requireTester('save', function() {
        var name = self.dataset.name;
        var nowFav = APP.Favorites.toggle(name);
        self.textContent   = nowFav ? '★' : '☆';
        self.style.color   = nowFav ? '#D4AF37' : 'rgba(160,174,192,0.25)';
        self.title         = nowFav ? 'Remove from saved' : 'Save figure';
        self.style.transform = 'scale(1.5)';
        setTimeout(function() { self.style.transform = 'scale(1)'; }, 180);
        _updateFavFilterBtn();
      });
    });
  })();
}

function selectPerson(name) {
  jumpTo(name);
}

function jumpTo(name){
  // In silsila mode: locate node in the SVG and render info
  if(VIEW==='silsila'){
    const p=PEOPLE.find(pp=>pp.famous===name); if(!p)return;
    activePerson=p; renderInfoWithDetails(p);
    silsilaLocate(name);
    const svg=document.getElementById('silsilaSVG'); if(!svg)return;
    svg.querySelectorAll('.sl-node.sl-selected').forEach(n=>n.classList.remove('sl-selected'));
    svg.querySelectorAll('.sl-node').forEach(n=>{
      if(n.dataset.name===name) n.classList.add('sl-selected');
    });
    // Sync lane label
    const inner2=document.getElementById('silsilaLanesInner');
    if(inner2){
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>l.classList.remove('sl-lane-sel'));
      const tl=isLineageMember(p)?'Prophetic Lineage':p.tradition||'';
      inner2.querySelectorAll('.sl-lane-label').forEach(l=>{if(l.dataset.lane===tl)l.classList.add('sl-lane-sel');});
    }
    return;
  }
  // Timeline mode — use _lastSortedPeople (matches display order)
  let idx=_lastSortedPeople.findIndex(p=>p.famous===name);
  if(idx===-1){
    const p=PEOPLE.find(pp=>pp.famous===name);
    if(p) renderInfoWithDetails(p);
    return;
  }
  const rows=document.querySelectorAll('.tl-row');
  const target=[...rows].find(r=>parseInt(r.dataset.idx)===idx);
  if(target)target.scrollIntoView({block:'center',behavior:'smooth'});
  selectRow(idx);
}
// Switches to Timeline, centres the century columns on the person, scrolls the row into view,
// and highlights it — works correctly from Map, Silsila, or any other view.
function focusPersonInTimeline(name){
  const p=PEOPLE.find(pp=>pp.famous===name); if(!p) return;

  // 1. Clear any year-filter so the person is always visible
  //    (keep activeYear so the top slider doesn't jump, but ensure person passes filter)
  //    We do NOT clear — we just make sure the person is visible by temporarily lifting filter.
  //    If the person wouldn't appear under the current year filter, lift the filter for this jump.
  if(activeYear!==null){
    const dod=p.dod!==undefined&&p.dod!==null?p.dod:p.dob+60;
    if(p.dob>activeYear||dod<activeYear){
      // Lift year filter so the person is visible
      activeYear=null;
      _viewYears[VIEW]=null;
      if(VIEW==='map'&&typeof _applyMapYear==='function') _applyMapYear(null);
      document.getElementById('yearDisplay').textContent='\u2014';
      const cb=document.getElementById('yearClearBtn'); if(cb) cb.classList.remove('active');
    }
  }

  // 2. Switch to timeline view
  setView('timeline');

  // 3. Centre the century columns on the person's birth century
  const cent=p.dob<600?6:Math.ceil(p.dob/100);
  const idx=ALL_CENTS.indexOf(cent);
  if(idx!==-1){centIdx=Math.max(idx,1); setCW();}
  updateCentHeaders(); updateCentScrollbar();

  // 4. Re-render so the row exists in the DOM
  renderAll();

  // 5. Select and scroll to the row
  setTimeout(()=>{
    activePerson=p;
    renderInfoWithDetails(p);
    // Find row by name (more reliable than index after filter/sort changes)
    const rows=document.querySelectorAll('.tl-row');
    let target=null;
    rows.forEach(r=>{
      const nm=r.querySelector('.tc-famous');
      if(nm&&nm.textContent.trim()===name){
        r.classList.add('sel'); target=r;
      } else {
        r.classList.remove('sel');
      }
    });
    if(target) target.scrollIntoView({block:'center',behavior:'smooth'});
  }, 60);
}

