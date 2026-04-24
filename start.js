// ═══════════════════════════════════════════════════════════
// START VIEW — Quran Reader
// Two-column: Arabic (30%) | Translation (70%)
// ═══════════════════════════════════════════════════════════

var _stIndex = null;
var _stText = null;
var _stInited = false;
var _stSurah = 1;
var _stJuz = 0;
var _stHizb = 0;
var _stManzil = 0;
var _stReciters = [];
var _stCurrentReciter = 'ar.alafasy';
var _stCurrentReciterName = 'Mishary Alafasy';
var _stType = '';
var _stTrans = {eng_saheeh:true};
var _stDDOpen = null;
var _stMode = 'both';   // 'both'|'arabic'|'trans'
var _stFontSize = 20;  // base px for both columns
var _stTransIndex = [];
var _stFileCache = {};
var _stFileLoading = {};
var _ST_EMBED_MAP = {arabic:'ar', eng_saheeh:'en', transliteration:'tr'};
var _stXref = null;
var _stXrefLookup = {};
var _stXrefSurahFigs = {};
var _stHadithByVerse = null;    // null = not loaded, {} = loaded
var _stHadithLoading = false;
var _stRevData = {};  // surah id -> revelation info

var _ST_JUZ_START = [
  null,
  [1,1],[2,142],[2,253],[3,92],[4,24],[4,148],[5,82],[6,111],[7,88],[8,41],
  [9,93],[11,6],[12,53],[15,1],[17,1],[18,75],[21,1],[23,1],[25,21],[27,56],
  [29,45],[33,31],[36,28],[39,32],[41,47],[46,1],[51,31],[58,1],[67,1],[78,1]
];

function _stEsc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}

function _stJuzOf(surah,verse){
  for(var j=_ST_JUZ_START.length-1;j>=1;j--){
    var b=_ST_JUZ_START[j];
    if(surah>b[0]||(surah===b[0]&&verse>=b[1]))return j;
  }
  return 1;
}

function _stSurahJuz(sid){
  if(!_stIndex)return[];
  var si=null;
  for(var i=0;i<_stIndex.length;i++){if(_stIndex[i].id===sid){si=_stIndex[i];break;}}
  if(!si)return[];
  var s=_stJuzOf(sid,1),e=_stJuzOf(sid,si.verses),out=[];
  for(var j=s;j<=e;j++)out.push(j);
  return out;
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
function initStart(){
  document.body.classList.add('st-active');
  var container=document.getElementById('start-view');
  if(!container)return;

  if(!_stInited){
    _stBuildDOM(container);
    _stInited=true;
    document.addEventListener('click',function(ev){
      if(!_stDDOpen)return;
      var panel=document.getElementById('st-dd-'+_stDDOpen);
      var btn=document.getElementById('st-btn-'+_stDDOpen);
      if(panel&&!panel.contains(ev.target)&&btn&&!btn.contains(ev.target))_stCloseDD();
    });
  }

  _stLoadData(function(){
    _stBuildSurahDD();
    _stBuildJuzDD();
    _stBuildHizbDD();
    _stBuildManzilBar();
    _stBuildTypeDD();
    _stBuildTransDD();
    _stRenderSurah();
  });
}

// ═══════════════════════════════════════════════════════════
// DOM
// ═══════════════════════════════════════════════════════════
function _stBuildDOM(container){
  container.innerHTML=
    '<div id="st-topbar">'+
      '<div id="st-l1"><span>Read the Quran</span><span class="st-src">tanzil.net \u00B7 Saheeh International \u00B7 qurancomplex.gov.sa</span></div>'+
      '<div id="st-l2">'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-surah" onclick="_stToggleDD(\'surah\',event)"><span id="st-surah-label">Surah</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel" id="st-dd-surah" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-juz" onclick="_stToggleDD(\'juz\',event)"><span id="st-juz-label">Juz</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow" id="st-dd-juz" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-hizb" onclick="_stToggleDD(\'hizb\',event)"><span id="st-hizb-label">Hizb</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow" id="st-dd-hizb" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-manzil" onclick="_stToggleDD(\'manzil\',event)"><span id="st-manzil-label">Manzil</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow" id="st-dd-manzil" style="display:none"></div>'+
        '</div>'+
        '<div style="flex:1"></div>'+
        '<div class="st-col-toggle">'+
          '<button class="st-col-btn" id="st-col-ar" onclick="_stSetMode(\'arabic\')" title="Arabic only">ع</button>'+
          '<button class="st-col-btn active" id="st-col-both" onclick="_stSetMode(\'both\')" title="Both columns">ع | T</button>'+
          '<button class="st-col-btn" id="st-col-tr" onclick="_stSetMode(\'trans\')" title="Translation only">T</button>'+
        '</div>'+
        '<div class="st-font-ctl">'+
          '<button class="st-font-btn" onclick="_stFontAdj(-2)" title="Smaller">A\u2212</button>'+
          '<button class="st-font-btn" onclick="_stFontAdj(2)" title="Larger">A+</button>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-reciter" onclick="_stToggleDD(\'reciter\',event)"><span id="st-reciter-label">Reciter</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow st-dd-right" id="st-dd-reciter" style="display:none"></div>'+
        '</div>'+
        '<div class="st-surah-play-pill">'+
          '<button class="st-surah-play-btn" id="st-surah-play-btn" onclick="_stSurahPlayClick(event)" title="Play surah">\u25B6</button>'+
          '<span class="st-surah-play-label">PLAY SURAH</span>'+
        '</div>'+
        '<div class="st-dd-wrap">'+
          '<button class="st-dd-btn" id="st-btn-trans" onclick="_stToggleDD(\'trans\',event)"><span id="st-trans-label">\u2630 Translation</span> <span class="st-dd-caret">\u25BE</span></button>'+
          '<div class="st-dd-panel st-dd-narrow st-dd-right" id="st-dd-trans" style="display:none"></div>'+
        '</div>'+
        '<div class="st-dd-wrap" id="st-dv-lang-wrap" style="display:none">'+
          '<button class="st-dd-btn" id="st-btn-dvlang" onclick="_stToggleDD(\'dvlang\',event)"><span id="st-dvlang-label">Tafsir Language</span> <span class="st-dd-caret">▾</span></button>'+
          '<div class="st-dd-panel st-dd-narrow st-dd-right" id="st-dd-dvlang" style="display:none">'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'\')">All Languages</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'AR\')">Arabic</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'EN\')">English</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'UR\')">Urdu</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'BN\')">Bengali</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'KU\')">Kurdish</div>'+
            '<div class="st-dd-item" onclick="_dvPickLang(\'RU\')">Russian</div>'+
          '</div>'+
        '</div>'+
        '<button class="st-dd-btn st-dv-toggle" id="st-btn-dive" onclick="_dvSetMode(!window._stDive)" title="Toggle scholastic Quran mode">DIVE: OFF</button>'+
      '</div>'+
    '</div>'+
    '<div id="st-body">'+
      '<div id="st-reader">'+
        '<div id="st-loading">Loading Quran data\u2026</div>'+
      '</div>'+
    '</div>';
}

// ═══════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════
function _stLoadData(cb){
  if(_stIndex&&_stText){cb();return;}
  var base='data/islamic/quran/';
  var v='?v='+Date.now();

  // Load 11 division files in parallel (non-blocking — populates window._stDivisions).
  // Individual failures log + set that key to null; other keys still land.
  (function(){
    var dBase=base+'divisions/';
    var divFiles=[
      ['juz','juz.json'],
      ['hizb','hizb.json'],
      ['manzil','manzil.json'],
      ['length','length_categories.json'],
      ['chronology','chronology_traditional.json'],
      ['noldeke','noldeke_phases.json'],
      ['sajdah','sajdah.json'],
      ['muqattaat','muqattaat.json'],
      ['families','surah_families.json'],
      ['rub','rub_al_hizb.json'],
      ['ruku','ruku_placeholder.json'],
      ['sajdah_pos','sajdah_positions.json'],
      ['rub_pos','rub_al_hizb_positions.json'],
      ['waqf','waqf_marks.json']
    ];
    Promise.all(divFiles.map(function(p){
      var key=p[0],file=p[1];
      return fetch(dBase+file+v).then(function(r){
        if(!r.ok)throw new Error('HTTP '+r.status);
        return r.json();
      }).catch(function(e){
        console.error('[divisions] failed to load:',file,e);
        return null;
      });
    })).then(function(results){
      var div={};
      divFiles.forEach(function(p,i){div[p[0]]=results[i];});
      window._stDivisions=div;
      (function(){
        var lookup={};
        var wq=div.waqf&&div.waqf.mark_types;
        if(wq){
          Object.keys(wq).forEach(function(k){
            var m=wq[k];
            if(!m||!m.unicode)return;
            var hex=String(m.unicode).replace(/^U\+/,'');
            var cp=parseInt(hex,16);
            if(isNaN(cp))return;
            var ch=String.fromCodePoint(cp);
            lookup[ch]={arabic_sign:m.sign||'',hover_def:m.hover_def||m.label||''};
          });
        }
        lookup['\u06E9']={arabic_sign:'\u06E9',hover_def:'Prostration verse'};
        lookup['\u06DE']={arabic_sign:'\u06DE',hover_def:'Quarter-hizb section marker'};
        window._stWaqfLookup=lookup;
      })();
      var j=div.juz,h=div.hizb,m=div.manzil,lg=div.length,ch=div.chronology,nl=div.noldeke,sa=div.sajdah,mu=div.muqattaat,fa=div.families,ru=div.rub,rk=div.ruku;
      console.log('[divisions] loaded:',{
        juz:        j  && j.juz         ? j.juz.length        : 0,
        hizb:       h  && h.hizb        ? h.hizb.length       : 0,
        manzil:     m  && m.manzil      ? m.manzil.length     : 0,
        length:     lg && lg.categories ? lg.categories.length: 0,
        chronology: ch && ch.order      ? ch.order.length     : 0,
        noldeke:    nl && nl.phases     ? nl.phases.length    : 0,
        sajdah:     sa && sa.verses     ? sa.verses.length    : 0,
        muqattaat:  mu && mu.groups     ? mu.groups.length    : 0,
        families:   fa && fa.families   ? fa.families.length  : 0,
        rub:        ru && typeof ru.total==='number' ? ru.total : 0,
        ruku:       rk && typeof rk.total==='number' ? rk.total : 0
      });
    });
  })();

  Promise.all([
    fetch(base+'quran_index.json'+v).then(function(r){return r.json();}),
    fetch(base+'quran_text.json'+v).then(function(r){return r.json();}),
    fetch(base+'translations_index.json'+v).then(function(r){return r.json();}).catch(function(){return{translations:[]};}),
    fetch(base+'quran_xref.json'+v).then(function(r){return r.json();}).catch(function(){return{};}),
    fetch(base+'quran_revelation.json'+v).then(function(r){return r.json();}).catch(function(){return{surahs:[]};}),
    fetch(base+'reciters.json'+v).then(function(r){return r.json();}).catch(function(){return[];})
  ]).then(function(res){
    _stIndex=res[0];
    _stText=res[1];
    var _ti=res[2]||{}; _stTransIndex=_ti.translations||[];
    _stXref=res[3]||{};
    var _rv=res[4]||{};(_rv.surahs||[]).forEach(function(s){_stRevData[s.id]=s;});
    _stBuildXrefLookup();
    _stReciters=Array.isArray(res[5])?res[5]:[];
    if(_stReciters.length){
      var _defR=_stReciters.find(function(r){return r.id==='ar.alafasy';})||_stReciters[0];
      _stCurrentReciter=_defR.id;
      _stCurrentReciterName=_defR.name||_defR.id;
    }
    // Build ayah counts (length 114, index i -> surah i+1) and init audio.
    if(window.QuranAudio&&_stIndex){
      var _ac=new Array(114);
      _stIndex.forEach(function(s){_ac[s.id-1]=s.verses;});
      try{
        window.QuranAudio.init({ayahCountsBySurah:_ac, defaultReciter:_stCurrentReciter});
        window.QuranAudio.onChange(_stOnAudioChange);
        window.QuranAudio.onError(_stOnAudioError);
      }catch(e){console.error('[START] QuranAudio.init failed',e);}
    }
    _stBuildReciterDD();
    _stUpdateReciterLabel();
    cb();
    setTimeout(function(){ _stLoadHadithXrefIntoVerse(); }, 1500);
  }).catch(function(e){
    console.error('[START] Load failed:',e);
    var el=document.getElementById('st-loading');
    if(el)el.textContent='Failed to load Quran data.';
  });
}

// ═══════════════════════════════════════════════════════════
// DROPDOWN BUILDERS
// ═══════════════════════════════════════════════════════════
function _stBuildSurahDD(){
  var panel=document.getElementById('st-dd-surah');
  if(!panel)return;
  panel.innerHTML='';

  var search=document.createElement('input');
  search.className='st-dd-search';search.type='text';search.placeholder='Search surahs\u2026';
  search.onclick=function(ev){ev.stopPropagation();};
  search.oninput=function(){
    var q=search.value.toLowerCase();
    panel.querySelectorAll('.st-dd-item').forEach(function(r){
      r.style.display=(!q||(r.dataset.stxt||'').toLowerCase().indexOf(q)!==-1)?'':'none';
    });
  };
  panel.appendChild(search);

  var filtered=_stFilteredSurahs();
  filtered.forEach(function(s){
    var row=document.createElement('div');
    row.className='st-dd-item'+(s.id===_stSurah?' selected':'');
    row.dataset.id=s.id;
    row.dataset.stxt=s.id+' '+s.name_ar+' '+s.name_en+' '+s.meaning;
    var _srvd=_stRevData[s.id]||{};var _sdot=(_srvd.disputed)?'st-dot-disp':(_srvd.type==='meccan'||(!_srvd.type&&s.type==='meccan'))?'st-dot-mec':'st-dot-med';
    row.innerHTML='<span class="st-dd-sdot '+_sdot+'"></span><span class="st-dd-snum">'+s.id+'</span>'+
      '<span class="st-dd-sar">'+_stEsc(s.name_ar)+'</span>'+
      '<span class="st-dd-sen">'+_stEsc(s.name_en)+'</span>'+
      '<span class="st-dd-smn">'+_stEsc(s.meaning)+'</span>';
    (function(sid){
      row.onclick=function(ev){ev.stopPropagation();_stSelectSurah(sid);_stCloseDD();};
    })(s.id);
    panel.appendChild(row);
  });
  _stUpdateSurahLabel();
}

function _stBuildJuzDD(){
  var panel=document.getElementById('st-dd-juz');if(!panel)return;
  panel.innerHTML='';
  var all=document.createElement('div');
  all.className='st-dd-item'+(_stJuz===0?' selected':'');
  all.textContent='All Juz';
  all.onclick=function(ev){ev.stopPropagation();_stSelectJuz(0);_stCloseDD();};
  panel.appendChild(all);
  for(var j=1;j<=30;j++){
    var row=document.createElement('div');
    row.className='st-dd-item'+(j===_stJuz?' selected':'');
    row.textContent='Juz '+j;
    (function(jj){row.onclick=function(ev){ev.stopPropagation();_stSelectJuz(jj);_stCloseDD();};})(j);
    panel.appendChild(row);
  }
}

function _stBuildTypeDD(){
  var panel=document.getElementById('st-dd-type');if(!panel)return;
  panel.innerHTML='';
  [{val:'',label:'All'},{val:'meccan',label:'Makkan'},{val:'medinan',label:'Madinan'},{val:'disputed',label:'Disputed'}].forEach(function(o){
    var row=document.createElement('div');
    row.className='st-dd-item'+(o.val===_stType?' selected':'');
    row.textContent=o.label;
    row.onclick=function(ev){ev.stopPropagation();_stSelectType(o.val);_stCloseDD();};
    panel.appendChild(row);
  });
}

function _stBuildTransDD(){
  var panel=document.getElementById('st-dd-trans');if(!panel)return;
  panel.innerHTML='';

  // Search
  var search=document.createElement('input');
  search.className='st-dd-search';search.type='text';search.placeholder='Search languages\u2026';
  search.onclick=function(ev){ev.stopPropagation();};
  search.oninput=function(){
    var q=search.value.toLowerCase();
    panel.querySelectorAll('.st-dd-item').forEach(function(r){
      var t=(r.dataset.stxt||'').toLowerCase();
      r.style.display=(!q||t.indexOf(q)!==-1)?'':'none';
    });
  };
  panel.appendChild(search);

  // All translations from v2 index
  _stTransIndex.forEach(function(t){
    if(t.slug==='arabic')return;

    var row=document.createElement('div');
    row.className='st-dd-item'+(_stTrans[t.slug]?' selected':'');
    row.dataset.key=t.slug;
    row.dataset.stxt=t.native_name+' '+t.english_name+' '+t.translator;
    row.title=t.english_name;

    var loading=_stFileLoading[t.slug]?' \u23F3':'';
    row.innerHTML=
      '<span class="st-dd-ck">'+(_stTrans[t.slug]?'\u2713':'')+'</span>'+
      '<div class="st-dd-tinfo">'+
        '<div class="st-dd-tname">'+_stEsc(t.native_name)+loading+'</div>'+
        '<div class="st-dd-tauth">'+_stEsc(t.translator)+'</div>'+
      '</div>';

    (function(slug){
      row.onclick=function(ev){ev.stopPropagation();_stToggleTrans(slug);};
    })(t.slug);
    panel.appendChild(row);
  });

  _stUpdateTransLabel();
}

// ═══════════════════════════════════════════════════════════
// DROPDOWN TOGGLE
// ═══════════════════════════════════════════════════════════
function _stToggleDD(which,ev){
  if(ev)ev.stopPropagation();
  if(_stDDOpen===which){_stCloseDD();return;}
  _stCloseDD();
  _stDDOpen=which;
  var panel=document.getElementById('st-dd-'+which);
  if(panel)panel.style.display='block';
  var btn=document.getElementById('st-btn-'+which);
  if(btn)btn.classList.add('active');
  if(which==='surah'){
    var si=panel?panel.querySelector('.st-dd-search'):null;
    if(si){si.value='';si.dispatchEvent(new Event('input'));si.focus();}
  }
}

function _stCloseDD(){
  if(!_stDDOpen)return;
  var panel=document.getElementById('st-dd-'+_stDDOpen);
  if(panel)panel.style.display='none';
  var btn=document.getElementById('st-btn-'+_stDDOpen);
  if(btn)btn.classList.remove('active');
  _stDDOpen=null;
}

// ═══════════════════════════════════════════════════════════
// FILTER ACTIONS
// ═══════════════════════════════════════════════════════════
function _stFilteredSurahs(){
  if(!_stIndex)return[];
  return _stIndex.filter(function(s){
    if(_stType==='disputed'){if(!_stRevData[s.id]||!_stRevData[s.id].disputed)return false;}
    else if(_stType&&s.type!==_stType)return false;
    if(_stJuz>0){if(_stSurahJuz(s.id).indexOf(_stJuz)===-1)return false;}
    return true;
  });
}

function _stSelectSurah(id){
  _stSurah=id;
  _stRenderSurah();
  _stBuildSurahDD();
  var reader=document.getElementById('st-reader');
  if(reader)reader.scrollTop=0;
  // Stop any ongoing surah playback — new surah means fresh reading state.
  if(window._stSurahPlayMode){
    window._stSurahPlayMode=false;
    if(window.QuranAudio)window.QuranAudio.stop();
    _stUpdateSurahPlayBtn();
  }
  // Division-driven surah changes (from Hizb/Manzil) set this guard so we don't
  // immediately zero out the just-set division state.
  if(window._stSuppressDivReset) return;
  if(_stJuz!==0){_stJuz=0;_stBuildJuzDD();_stUpdateJuzLabel();}
  if(_stHizb!==0){_stHizb=0;_stBuildHizbDD();_stUpdateHizbLabel();}
  if(_stManzil!==0){_stManzil=0;_stBuildManzilBar();}
}

function _stSelectJuz(j){
  _stJuz=j;
  var f=_stFilteredSurahs();
  if(f.length&&!f.find(function(s){return s.id===_stSurah;}))_stSurah=f[0].id;
  // Picking a Juz clears Hizb + Manzil.
  if(_stHizb!==0){_stHizb=0;_stUpdateHizbLabel();}
  if(_stManzil!==0){_stManzil=0;}
  _stBuildSurahDD();_stBuildJuzDD();_stBuildHizbDD();_stBuildManzilBar();_stRenderSurah();_stUpdateJuzLabel();
}

function _stSelectType(t){
  _stType=t;
  var f=_stFilteredSurahs();
  if(f.length&&!f.find(function(s){return s.id===_stSurah;}))_stSurah=f[0].id;
  _stBuildSurahDD();_stBuildTypeDD();_stRenderSurah();_stUpdateTypeLabel();
}

function _stToggleTrans(slug){
  var active=Object.keys(_stTrans).filter(function(k){return _stTrans[k];});
  if(active.length===1&&_stTrans[slug])return;
  _stTrans[slug]=!_stTrans[slug];

  if(_stTrans[slug]&&!_ST_EMBED_MAP[slug]&&!_stFileCache[slug]&&!_stFileLoading[slug]){
    _stLoadFileTrans(slug);
  }

  _stBuildTransDD();_stRenderSurah();_stUpdateTransLabel();
}

function _stLoadFileTrans(slug){
  var entry=null;
  for(var i=0;i<_stTransIndex.length;i++){
    if(_stTransIndex[i].slug===slug){entry=_stTransIndex[i];break;}
  }
  if(!entry||!entry.file){
    console.warn('[START] No file path for',slug);
    delete _stTrans[slug];
    _stBuildTransDD();return;
  }

  _stFileLoading[slug]=true;
  _stBuildTransDD();

  fetch('data/islamic/quran/'+entry.file+'?v='+Date.now()).then(function(r){
    if(!r.ok)throw new Error('HTTP '+r.status);
    return r.json();
  }).then(function(data){
    var idx={};
    if(data&&data.quran){
      data.quran.forEach(function(v){
        if(!idx[v.chapter])idx[v.chapter]={};
        idx[v.chapter][v.verse]=v.text;
      });
    }
    if(Object.keys(idx).length===0)throw new Error('Empty data for '+slug);
    _stFileCache[slug]=idx;
    delete _stFileLoading[slug];
    console.log('[START] Loaded translation:',slug,'('+Object.keys(idx).length+' surahs)');
    _stBuildTransDD();
    if(_stTrans[slug])_stRenderSurah();
  }).catch(function(e){
    console.error('[START] Failed to load',slug,e);
    delete _stFileLoading[slug];
    delete _stTrans[slug];
    _stBuildTransDD();_stRenderSurah();
  });
}




function _stGetVerseText(slug,surahId,verseId,verseObj){
  var field=_ST_EMBED_MAP[slug];
  if(field)return verseObj[field]||'';
  if(_stFileCache[slug]&&_stFileCache[slug][surahId])return _stFileCache[slug][surahId][verseId]||'';
  return _stFileLoading[slug]?'\u23F3 Loading\u2026':'';
}

function _stTransLabel(slug){
  for(var i=0;i<_stTransIndex.length;i++){
    if(_stTransIndex[i].slug===slug)return _stTransIndex[i].native_name;
  }
  return slug;
}

function _stTransDir(slug){
  for(var i=0;i<_stTransIndex.length;i++){
    if(_stTransIndex[i].slug===slug)return _stTransIndex[i].direction||'ltr';
  }
  return'ltr';
}

// ═══════════════════════════════════════════════════════════
// LABEL UPDATES
// ═══════════════════════════════════════════════════════════
function _stUpdateSurahLabel(){
  var el=document.getElementById('st-surah-label');if(!el)return;
  var s=null;
  if(_stIndex)for(var i=0;i<_stIndex.length;i++){if(_stIndex[i].id===_stSurah){s=_stIndex[i];break;}}
  el.textContent=s?(s.id+'. '+s.name_en):'Surah';
}

function _stUpdateJuzLabel(){
  var el=document.getElementById('st-juz-label');if(!el)return;
  el.textContent=_stJuz>0?'Juz '+_stJuz:'Juz';
  var btn=document.getElementById('st-btn-juz');
  if(btn)btn.classList.toggle('filtered',_stJuz>0);
}

function _stUpdateTypeLabel(){
  var el=document.getElementById('st-type-label');if(!el)return;
  el.textContent=_stType?(_stType==='meccan'?'Makkan':(_stType==='medinan'?'Madinan':'Disputed')):'Revelation';
  var btn=document.getElementById('st-btn-type');
  if(btn)btn.classList.toggle('filtered',!!_stType);
}

function _stUpdateTransLabel(){
  var el=document.getElementById('st-trans-label');if(!el)return;
  var active=Object.keys(_stTrans).filter(function(k){return _stTrans[k];});
  var names=active.map(function(k){return _stTransLabel(k);});
  el.textContent='\u2630 '+names.join(', ');
}

// ═══════════════════════════════════════════════════════════
// RENDER SURAH
// ═══════════════════════════════════════════════════════════
function _stRenderSurah(){
  var reader=document.getElementById('st-reader');
  if(!reader||!_stIndex||!_stText)return;

  var meta=null,data=null;
  for(var i=0;i<_stIndex.length;i++){if(_stIndex[i].id===_stSurah){meta=_stIndex[i];break;}}
  for(var j=0;j<_stText.length;j++){if(_stText[j].id===_stSurah){data=_stText[j];break;}}
  if(!meta||!data){reader.innerHTML='<div id="st-loading">Surah not found.</div>';return;}

  var aKeys=Object.keys(_stTrans).filter(function(k){return _stTrans[k];});
  var multi=aKeys.length>1;
  var startJuz=_stJuzOf(_stSurah,1);

  var h='';

  // Header
  h+='<div class="st-surah-hdr">';
  var _rv=_stRevData[_stSurah]||{type:meta.type};
  var _rvType=_rv.type||meta.type;
  var _rvDisp=_rv.disputed||false;
  var _dotCls=_rvDisp?'st-dot-disp':(_rvType==='meccan'?'st-dot-mec':'st-dot-med');
  var _rvTxt='';
  if(_rvDisp){
    _rvTxt='<span class="st-rev-dot '+_dotCls+'"></span><span class="st-rev-disp-text" onclick="_stRevNote('+_stSurah+',event)">'+_stEsc((_rv.note||'Disputed').split('.')[0])+'</span>';
  } else {
    _rvTxt='<span class="st-rev-dot '+_dotCls+'"></span>'+(_rvType==='meccan'?'Makkan':'Madinan');
  }
  h+='<div class="st-hdr-l1">'+_stEsc(meta.name_ar)+'</div>';
  h+='<div class="st-hdr-l2">'+_stEsc(meta.name_en)+' \u00B7 '+_stEsc(meta.meaning)+' \u00B7 '+_rvTxt+' \u00B7 '+meta.verses+' verses \u00B7 Juz '+startJuz+'</div>';
  h+='</div>';

  // Nav state (shared by top bismillah row and bottom nav)
  var filtered=_stFilteredSurahs();
  var ci=-1;
  for(var fi=0;fi<filtered.length;fi++){if(filtered[fi].id===_stSurah){ci=fi;break;}}
  var prevSurah=(ci>0)?filtered[ci-1]:null;
  var nextSurah=(ci>=0&&ci<filtered.length-1)?filtered[ci+1]:null;
  var prevBtnHtml=prevSurah?('<button class="st-nav-btn" onclick="_stSelectSurah('+prevSurah.id+')">\u2190 '+_stEsc(prevSurah.name_en)+'</button>'):'';
  var nextBtnHtml=nextSurah?('<button class="st-nav-btn" onclick="_stSelectSurah('+nextSurah.id+')">'+_stEsc(nextSurah.name_en)+' \u2192</button>'):'';

  // Bismillah row (top): prev | bismillah | next. Skip bismillah for surah 1 (verse 1 IS bismillah) and 9 (At-Tawbah has none).
  var showBism=_stSurah!==9;
  h+='<div class="st-bism-row">';
  h+='<div class="st-bism-prev">'+prevBtnHtml+'</div>';
  if(showBism){
    h+='<div class="st-bismillah">\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064E\u0647\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650</div>';
  } else {
    h+='<div></div>';
  }
  h+='<div class="st-bism-next">'+nextBtnHtml+'</div>';
  h+='</div>';

  // Column headers
  h+='<div id="st-verses"><div class="st-goldline" id="st-goldline"></div>';
  h+='<div class="st-col-hdr">';
  h+='<div class="st-col-hdr-link">Links</div>';
  h+='<div>Translation</div>';
  h+='<div class="st-col-hdr-vnum">Verse</div>';
  h+='<div></div>';
  h+='<div></div>';
  h+='<div class="st-col-hdr-markers">Markers<span class="st-hdr-mkr-legend"><span class="st-leg-j">J</span><span class="st-leg-sep">|</span><span class="st-leg-h">H</span><span class="st-leg-sep">|</span><span class="st-leg-m">M</span></span></div>';
  h+='</div>';

  // Verses (wrapped so the markers overlay can span from first verse to last).
  h+='<div class="st-verses-list">';
  h+='<div class="st-markers-overlay"><div class="st-line st-line-manzil"></div><div class="st-line st-line-hizb"></div><div class="st-line st-line-juz"></div></div>';
  data.verses.forEach(function(v){
    h+='<div class="st-verse" data-verse-id="'+v.id+'">';
    var _vlnk=_stXrefChip(_stSurah,v.id);
    if(_stMode!=='trans'){_vlnk+='<button class="st-play-btn" data-surah="'+_stSurah+'" data-ayah="'+v.id+'" onclick="_stPlayClick('+_stSurah+','+v.id+',event)" title="Play verse">\u25B6</button>';}
    h+='<div class="st-vlink">'+_vlnk+'</div>';
    h+='<div class="st-vtr">';
    aKeys.forEach(function(k){
      var vtxt=_stGetVerseText(k,_stSurah,v.id,v);
      var dir=_stTransDir(k);
      var dirCss=dir==='rtl'?' style="direction:rtl;text-align:right"':'';
      if(multi){
        h+='<div class="st-vtr-block st-lang-'+k+'"'+dirCss+'>'+_stEsc(vtxt)+'</div>';
      } else {
        h+='<div class="st-lang-'+k+'"'+dirCss+'>'+_stEsc(vtxt)+'</div>';
      }
    });
    h+='</div>';
    h+='<div class="st-vcenter"><span data-bmk-verse="'+v.id+'">'+v.id+'</span></div>';
    var _vex=_stVerseException(_stSurah,v.id);
    var _ar=_stWrapMarks(v.ar);
    if(_vex){
      h+='<div class="st-var">'+_ar+'<span class="st-rev-marker st-rev-'+_vex.type+'" onclick="_stExNote('+_stSurah+','+v.id+',event)" title="'+_stEsc(_vex.note||'')+'"></span></div>';
    } else {
      h+='<div class="st-var">'+_ar+'</div>';
    }
    h+='<div class="st-vleg">'+_stBuildVerseLegends(_stSurah,v.id)+'</div>';
    h+='<div class="st-vmark"></div>';
    if(window._stDive && typeof _dvRenderCard === "function"){
      var _tr = _stGetVerseText("transliteration", _stSurah, v.id, v);
      h += _dvRenderCard(_stSurah, v.id, _tr || "");
    }
    h+='</div>';
  });
  h+='</div>';
  h+='</div>';

  // Bottom nav (uses prevBtnHtml/nextBtnHtml from above)
  h+='<div class="st-nav">'+prevBtnHtml+nextBtnHtml+'</div>';

  h+='<div class="st-source-credit">Translation: Saheeh International \u00B7 Source: quran-json (MIT)</div>';

  reader.innerHTML=h;
  reader.className='st-mode-'+_stMode;
  _stApplyFont();
  _stInitQmarkTooltip();
  _stLayoutMarkers();
  // goldline positioned by CSS
  if(typeof _dvPrefetchSurah === "function"){
    _dvPrefetchSurah(_stSurah, function(){ if(typeof _dvUpdateTafsirChips==="function") _dvUpdateTafsirChips(); });
  }
  window._stCurrentSurah=_stSurah;
  setTimeout(function(){ try{ _stBmkRender(); _stBmkInjectTopbarBtn(); }catch(e){} },50);
}


// ═══════════════════════════════════════════════════════════
// COLUMN MODE + FONT SIZE
// ═══════════════════════════════════════════════════════════
function _stSetMode(m){
  _stMode=m;
  var reader=document.getElementById('st-reader');
  if(reader){reader.className='st-mode-'+m;}
  // Toggle buttons
  ['ar','both','tr'].forEach(function(k){
    var btn=document.getElementById('st-col-'+k);
    if(btn)btn.classList.toggle('active',k===(m==='arabic'?'ar':m==='trans'?'tr':'both'));
  });
  _stApplyFont();
}

function _stFontAdj(delta){
  _stFontSize=Math.max(12,Math.min(36,_stFontSize+delta));
  _stApplyFont();
}

function _stApplyFont(){
  var reader=document.getElementById('st-reader');
  if(!reader)return;
  reader.style.setProperty('--st-font',_stFontSize+'px');
  // Shift column ratio: bigger font -> need more space
  var arFr=_stMode==='arabic'?1:(_stMode==='trans'?0:30);
  var trFr=_stMode==='trans'?1:(_stMode==='arabic'?0:70);
  reader.style.setProperty('--st-ar-fr',arFr);
  reader.style.setProperty('--st-tr-fr',trFr);
  // Row heights just changed — recompute marker label positions.
  setTimeout(_stLayoutMarkers,50);
}


// ═══════════════════════════════════════════════════════════
// REVERSE XREF — link verses back to events/figures
// ═══════════════════════════════════════════════════════════
function _stParseVerses(str){
  var out=[];
  String(str).split(',').forEach(function(part){
    part=part.trim();
    var rng=part.split('-');
    if(rng.length===2){
      var a=parseInt(rng[0],10),b=parseInt(rng[1],10);
      for(var v=a;v<=b;v++)out.push(v);
    } else {
      var n=parseInt(part,10);
      if(!isNaN(n))out.push(n);
    }
  });
  return out;
}

function _stBuildXrefLookup(){
  _stXrefLookup={};
  _stXrefSurahFigs={};
  if(!_stXref)return;

  // figure_refs: verse-range (same shape as event_refs)
  // _stXrefSurahFigs intentionally stays empty — per-verse data supersedes it.
  (_stXref.figure_refs||[]).forEach(function(f){
    var s=f.surah;
    if(!_stXrefLookup[s])_stXrefLookup[s]={};
    var vs=f.verse_start||1, ve=f.verse_end||vs;
    for(var v=vs;v<=ve;v++){
      if(!_stXrefLookup[s][v])_stXrefLookup[s][v]=[];
      _stXrefLookup[s][v].push({type:'figure',slug:f.slug,name:f.name});
    }
  });

  // event_refs: verse-range
  (_stXref.event_refs||[]).forEach(function(e){
    var s=e.surah;
    if(!_stXrefLookup[s])_stXrefLookup[s]={};
    var vs=e.verse_start||1, ve=e.verse_end||vs;
    for(var v=vs;v<=ve;v++){
      if(!_stXrefLookup[s][v])_stXrefLookup[s][v]=[];
      _stXrefLookup[s][v].push({type:'event',id:e.event_id,title:e.event_title,year:e.event_year});
    }
  });

  // concept_refs: verse-range, one concept fans out across multiple refs
  (_stXref.concept_refs||[]).forEach(function(c){
    (c.refs||[]).forEach(function(r){
      var s=r.surah;
      if(!_stXrefLookup[s])_stXrefLookup[s]={};
      var vs=r.verse_start||1, ve=r.verse_end||vs;
      for(var v=vs;v<=ve;v++){
        if(!_stXrefLookup[s][v])_stXrefLookup[s][v]=[];
        _stXrefLookup[s][v].push({type:'concept',slug:c.slug,name:c.name});
      }
    });
  });
}

async function _stLoadHadithXrefIntoVerse(){
  if(_stHadithByVerse || _stHadithLoading) return _stHadithByVerse;
  _stHadithLoading = true;
  var colls = ['sahih-bukhari','sahih-muslim','sunan-abi-daud','jami-al-tirmidhi','sunan-an-nasai','sunan-ibn-majah'];
  var map = {};
  window._hadithXrefCache = window._hadithXrefCache || {};
  await Promise.all(colls.map(async function(c){
    try{
      var idx;
      if(window._hadithXrefCache[c]){
        idx = window._hadithXrefCache[c];
      } else {
        var res = await fetch('data/islamic/hadith_xref/'+c+'.json');
        if(!res.ok) return;
        var json = await res.json();
        idx = json.hadith_index || {};
        window._hadithXrefCache[c] = idx;
      }
      Object.keys(idx).forEach(function(hkey){
        var entry = idx[hkey];
        var verses = (entry && entry.quran_verses) || [];
        var parts = hkey.split('-');
        var num = parts[parts.length-1];
        var col = parts.slice(0,-1).join('-');
        verses.forEach(function(v){
          var k = v.surah+':'+v.verse;
          (map[k] = map[k] || []).push({col:col,num:num,tokens:v.shared_tokens||0});
        });
      });
    } catch(e){ console.warn('hadith xref load failed', c, e); }
  }));
  _stHadithByVerse = map;
  _stHadithLoading = false;
  // re-render current surah so chips appear with counts
  if(typeof _stRenderSurah === 'function' && typeof _stSurah !== 'undefined') _stRenderSurah();
  return map;
}

function _stXrefChip(surah,verse){
  var items=(_stXrefLookup[surah]||{})[verse];
  var hadithList = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  var hadithCount = hadithList.length;
  if((!items||!items.length) && !hadithCount) return '';
  var evCount=0,concCount=0,figCount=0;
  (items||[]).forEach(function(it){
    if(it.type==='event')evCount++;
    else if(it.type==='concept')concCount++;
    else if(it.type==='figure')figCount++;
  });
  var h='';
  var onclick=' onclick="_stXrefPopup('+surah+','+verse+',event)"';
  if(evCount){
    h+='<div class="st-xref-chip st-xref-event"'+onclick+'>'+evCount+(evCount===1?' event':' events')+'</div>';
  }
  if(concCount){
    h+='<div class="st-xref-chip st-xref-concept"'+onclick+'>'+concCount+(concCount===1?' concept':' concepts')+'</div>';
  }
  if(figCount){
    h+='<div class="st-xref-chip st-xref-fig"'+onclick+'>'+figCount+(figCount===1?' figure':' figures')+'</div>';
  }
  if(hadithCount){
    h+='<div class="st-xref-chip st-xref-hadith"'+onclick+'>'+hadithCount+(hadithCount===1?' hadith':' hadiths')+'</div>';
  }
  if(typeof _dvTafsirChipHTML === "function"){
    h += _dvTafsirChipHTML(surah, verse);
  }
  return h;
}

function _stXrefPopup(surah,verse,ev){
  if(ev)ev.stopPropagation();
  var items=(_stXrefLookup[surah]||{})[verse] || [];
  var hadithsForPopup = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  if(!items.length && !hadithsForPopup.length) return;

  var old=document.getElementById('st-xref-popup');
  if(old)old.remove();

  var ov=document.createElement('div');
  ov.id='st-xref-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';

  var h='<button onclick="document.getElementById(\'st-xref-popup\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>';
  h+='<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-3);margin:0 0 16px;letter-spacing:.06em">Surah '+surah+' : Verse '+verse+'</h3>';

  var events=items.filter(function(it){return it.type==='event';});
  var figures=items.filter(function(it){return it.type==='figure';});

  if(events.length){
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif">Linked Events</div>';
    events.forEach(function(e){
      h+='<div class="st-xref-row" onclick="_stXrefJumpEvent(\''+_stEsc(e.id)+'\')"><span class="st-xref-year">'+e.year+' CE</span><span>'+_stEsc(e.title)+'</span></div>';
    });
  }

  var concepts=items.filter(function(it){return it.type==='concept';});
  if(concepts.length){
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif">Linked Concepts</div>';
    concepts.forEach(function(c){
      h+='<div class="st-xref-row" onclick="_stConceptJump(\''+_stEsc(c.slug||'')+'\',event)"><span>'+_stEsc(c.name)+' \u2192</span></div>';
    });
  }

  if(figures.length){
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif">Linked Figures</div>';
    figures.forEach(function(f){
      h+='<div class="st-xref-row" onclick="_stXrefJumpFigure(\''+_stEsc(f.slug||'')+'\',\''+_stEsc(f.name||'')+'\')"><span>'+_stEsc(f.name)+'</span></div>';
    });
  }

  var hadiths = _stHadithByVerse ? (_stHadithByVerse[surah+':'+verse] || []) : [];
  if(hadiths.length){
    hadiths.sort(function(a,b){ return (b.tokens||0) - (a.tokens||0); });
    var shown = hadiths.slice(0, 25);
    h+='<div style="font-size:var(--fs-3);color:#D4AF37;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 6px;font-family:\'Cinzel\',serif">Linked Hadiths ('+hadiths.length+')</div>';
    var collLabels = {'sahih-bukhari':'Bukhari','sahih-muslim':'Muslim','sunan-abi-daud':'Abu Dawud','jami-al-tirmidhi':'Tirmidhi','sunan-an-nasai':'Nasa\u02bci','sunan-ibn-majah':'Ibn Majah'};
    shown.forEach(function(hd){
      var lbl = (collLabels[hd.col]||hd.col) + ' #' + hd.num;
      h+='<div class="st-xref-row" onclick="_stXrefJumpHadith(\''+_stEsc(hd.col)+'\',\''+_stEsc(hd.num)+'\')"><span>'+_stEsc(lbl)+'</span><span style="color:#8fd4b5;font-size:10px">'+(hd.tokens||0)+' tok</span></div>';
    });
    if(hadiths.length > 25){
      h+='<div style="font-size:var(--fs-3);color:#888;margin-top:6px">\u2026 '+(hadiths.length-25)+' more</div>';
    }
  }

  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;max-height:70vh;overflow-y:auto;padding:24px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
  box.innerHTML=h;
  ov.appendChild(box);
  document.body.appendChild(ov);

  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

window._stXrefPopup=_stXrefPopup;

function _stXrefJumpHadith(col, num){
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  window._stPendingHadith = {col:col, num:num};
  if(typeof setView==='function') setView('monastic');
}
window._stXrefJumpHadith=_stXrefJumpHadith;

function _stXrefJumpEvent(eventId){
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  if(typeof setView==='function')setView('events');

  // Retry loop: handles first-time init of events view + late layout.
  // Root cause being fixed: .ev-row has display:contents, so el.offsetTop
  // returns 0 for browsers. Use getBoundingClientRect on a real child.
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var sc=document.getElementById('evScroll');
    if(!sc){if(tries>40)clearInterval(iv);return;}

    // Force every row + card visible (bypass intersection-observer fade).
    sc.querySelectorAll('.ev-row').forEach(function(r){
      r.classList.remove('ev-row-hidden');r.classList.add('ev-row-reveal');
      var c=r.querySelector('.ev-card');if(c)c.classList.add('ev-card-visible');
    });

    var el=document.querySelector('[data-event-id="'+eventId+'"]');
    if(!el){if(tries>40)clearInterval(iv);return;}

    // ev-row has display:contents (no box). Measure via a child div.
    var firstChild=el.querySelector('div');
    if(!firstChild){if(tries>40)clearInterval(iv);return;}

    var cr=firstChild.getBoundingClientRect();
    var sr=sc.getBoundingClientRect();
    var rowTop=cr.top - sr.top + sc.scrollTop;

    // If layout not ready (zero height), wait and retry.
    if(cr.height===0 && tries<20){return;}

    clearInterval(iv);

    var target=Math.max(0, rowTop - Math.round(sc.clientHeight/3));
    sc.scrollTop=target;

    // Pulse highlight on the card (inline - no styles.css edit needed).
    var card=el.querySelector('.ev-card');
    if(card){
      card.style.transition='box-shadow .3s ease';
      card.style.boxShadow='0 0 0 2px #D4AF37, 0 0 24px rgba(212,175,55,0.55)';
      setTimeout(function(){card.style.boxShadow='';},2500);
    }

    // Re-assert scroll after minimaps/layout settle (200ms of IntersectionObserver + iframe loads).
    setTimeout(function(){
      var fc=el.querySelector('div');
      if(!fc)return;
      var cr2=fc.getBoundingClientRect();
      var sr2=sc.getBoundingClientRect();
      var rt=cr2.top - sr2.top + sc.scrollTop;
      sc.scrollTop=Math.max(0, rt - Math.round(sc.clientHeight/3));
    },700);
  },80);
}
window._stXrefJumpEvent=_stXrefJumpEvent;

function _stFigPopup(surah,ev){
  if(ev)ev.stopPropagation();
  var figs=_stXrefSurahFigs[surah]||[];
  if(!figs.length)return;
  var old=document.getElementById('st-xref-popup');if(old)old.remove();
  var ov=document.createElement('div');
  ov.id='st-xref-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var h='<button onclick="document.getElementById(\'st-xref-popup\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>';
  h+='<h3 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-3);margin:0 0 16px;letter-spacing:.06em">Figures Referenced in This Surah</h3>';
  figs.forEach(function(f){
    h+='<div class="st-xref-row" onclick="_stXrefJumpFigure(\''+_stEsc(f.slug||'')+'\',\''+_stEsc(f.name||'')+'\')"><span>'+_stEsc(f.name)+'</span></div>';
  });
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;max-height:70vh;overflow-y:auto;padding:24px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
  box.innerHTML=h;
  ov.appendChild(box);
  document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
window._stFigPopup=_stFigPopup;

function _stXrefJumpFigure(slug,name){
  var pop=document.getElementById('st-xref-popup');if(pop)pop.remove();
  if(typeof PEOPLE==='undefined'||!PEOPLE.length){if(typeof setView==='function')setView('timeline');return;}
  var p=null;
  for(var i=0;i<PEOPLE.length;i++){
    if(PEOPLE[i].slug===slug){p=PEOPLE[i];break;}
  }
  if(!p&&name){
    for(var j=0;j<PEOPLE.length;j++){
      if(PEOPLE[j].famous===name){p=PEOPLE[j];break;}
    }
  }
  if(p&&typeof setView==='function'){
    setView('timeline');
    setTimeout(function(){
      if(typeof jumpTo==='function')jumpTo(p.famous);
    },800);
  } else {
    if(typeof setView==='function')setView('timeline');
  }
}
window._stXrefJumpFigure=_stXrefJumpFigure;

// External entry point: switch to START, load the given surah, scroll to + flash the verse range.
// Called from info-card .quran-chip delegation.
window.openStartAtVerse=function(surah, vstart, vend){
  if(typeof setView==='function') setView('start'); // start.js's setView patch runs initStart()
  // setView triggers initStart, which fires its own async _stLoadData → _stRenderSurah.
  // Poll until the reader has rendered SOMETHING (first .st-verse), then do our switch.
  // Mirrors _stConceptJump pattern (80ms tick, ~3.2s cap).
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    var reader=document.getElementById('st-reader');
    if(reader && reader.querySelector('.st-verse')){
      clearInterval(iv);
      if(_stSurah !== surah) _stSelectSurah(surah); // synchronous re-render to target surah
      requestAnimationFrame(function(){
        var r2=document.getElementById('st-reader');
        if(!r2) return;
        var target=r2.querySelector('.st-verse[data-verse-id="'+vstart+'"]');
        if(target) target.scrollIntoView({behavior:'smooth', block:'center'});
        for(var v=vstart; v<=vend; v++){
          (function(vv){
            var row=r2.querySelector('.st-verse[data-verse-id="'+vv+'"]');
            if(!row) return;
            row.classList.add('quran-verse-flash');
            setTimeout(function(){ row.classList.remove('quran-verse-flash'); }, 1800);
          })(v);
        }
      });
      return;
    }
    if(tries>40){ clearInterval(iv); console.warn('[openStartAtVerse] START reader never ready'); }
  }, 80);
};

function _stConceptJump(slug,ev){
  if(ev)ev.stopPropagation();
  // close popup
  var pop=document.getElementById('st-xref-popup'); if(pop) pop.remove();
  // switch view
  if(typeof setView==='function') setView('think');
  // retry selection for up to 2s — Think view may still be initializing
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    if(typeof window.thinkSelectConceptBySlug==='function'){
      var ok=window.thinkSelectConceptBySlug(slug);
      if(ok){clearInterval(iv); return;}
    }
    if(tries>25){clearInterval(iv); console.error('[start] think API never ready or slug missing: '+slug);}
  },80);
}
window._stConceptJump=_stConceptJump;

function _stPositionLine(){
  setTimeout(function(){
    var vc=document.querySelector('.st-vcenter');
    var vs=document.getElementById('st-verses');
    var ln=document.getElementById('st-goldline');
    if(!vc||!vs||!ln)return;
    var vr=vc.getBoundingClientRect();
    var pr=vs.getBoundingClientRect();
    var cx=vr.left+vr.width/2-pr.left;
    ln.style.left=(cx-4)+'px';
  },50);
}


// ═══════════════════════════════════════════════════════════
// REVELATION DATA — badges, markers, popups
// ═══════════════════════════════════════════════════════════
function _stVerseException(surah,verse){
  var rv=_stRevData[surah];
  if(!rv||!rv.exceptions||!rv.exceptions.length)return null;
  for(var i=0;i<rv.exceptions.length;i++){
    var ex=rv.exceptions[i];
    var vlist=_stParseVerses(ex.verses);
    if(vlist.indexOf(verse)!==-1)return ex;
  }
  return null;
}

function _stRevNote(surah,ev){
  if(ev)ev.stopPropagation();
  var rv=_stRevData[surah];
  if(!rv||!rv.note)return;
  var old=document.getElementById('st-rev-popup');if(old)old.remove();
  var ov=document.createElement('div');ov.id='st-rev-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:var(--fs-3);line-height:1.7';
  box.innerHTML='<button onclick="document.getElementById(\'st-rev-popup\').remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer">\u00D7</button><h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-3);margin:0 0 12px">Disputed Revelation</h3><p>'+_stEsc(rv.note)+'</p>';
  ov.appendChild(box);document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
window._stRevNote=_stRevNote;

function _stExNote(surah,verse,ev){
  if(ev)ev.stopPropagation();
  var ex=_stVerseException(surah,verse);
  if(!ex)return;
  var old=document.getElementById('st-rev-popup');if(old)old.remove();
  var ov=document.createElement('div');ov.id='st-rev-popup';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  var typeLabel=ex.type==='meccan'?'Makkan':'Madinan';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:var(--fs-3);line-height:1.7';
  box.innerHTML='<button onclick="document.getElementById(\'st-rev-popup\').remove()" style="position:absolute;top:10px;right:14px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer">\u00D7</button><h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-3);margin:0 0 12px">Verse Exception</h3><p>Verse '+verse+' is classified as <strong style="color:'+(ex.type==='meccan'?'#D4AF37':'#2ecc9b')+'">'+typeLabel+'</strong> unlike the rest of this surah.</p>'+(ex.note?'<p style="color:var(--muted);font-style:normal;margin-top:8px">'+_stEsc(ex.note)+'</p>':'');
  ov.appendChild(box);document.body.appendChild(ov);
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
window._stExNote=_stExNote;


// ═══════════════════════════════════════════════════════════
// HIZB + MANZIL (reading divisions from window._stDivisions)
// ═══════════════════════════════════════════════════════════
function _stBuildHizbDD(){
  var panel=document.getElementById('st-dd-hizb');if(!panel)return;
  panel.innerHTML='';
  var list=(window._stDivisions&&window._stDivisions.hizb&&window._stDivisions.hizb.hizb)||[];

  var none=document.createElement('div');
  none.className='st-dd-item'+(_stHizb===0?' selected':'');
  none.textContent='\u2014';
  none.onclick=function(ev){ev.stopPropagation();_stSelectHizb(0);_stCloseDD();};
  panel.appendChild(none);

  list.forEach(function(h){
    var row=document.createElement('div');
    row.className='st-dd-item'+(h.number===_stHizb?' selected':'');
    row.textContent='Hizb '+h.number;
    (function(hh){row.onclick=function(ev){ev.stopPropagation();_stSelectHizb(hh);_stCloseDD();};})(h.number);
    panel.appendChild(row);
  });
  _stUpdateHizbLabel();
}

function _stSelectHizb(n){
  _stHizb=n;
  if(n===0){_stBuildHizbDD();_stUpdateHizbLabel();return;}

  // Picking a Hizb clears Juz + Manzil.
  if(_stJuz!==0){_stJuz=0;_stBuildJuzDD();_stUpdateJuzLabel();}
  if(_stManzil!==0){_stManzil=0;_stBuildManzilBar();}

  var list=(window._stDivisions&&window._stDivisions.hizb&&window._stDivisions.hizb.hizb)||[];
  var entry=null;
  for(var i=0;i<list.length;i++){if(list[i].number===n){entry=list[i];break;}}
  if(!entry||!entry.start){_stBuildHizbDD();_stUpdateHizbLabel();return;}

  var parts=String(entry.start).split(':');
  var s=parseInt(parts[0],10), v=parseInt(parts[1]||'1',10);
  _stBuildHizbDD();_stUpdateHizbLabel();
  // Guard so _qlJump's internal _stSelectSurah won't zero our _stHizb/_stManzil.
  // _qlJump uses a retry loop (up to ~4s); clear guard well after that.
  window._stSuppressDivReset=true;
  if(typeof window._qlJump==='function') window._qlJump(s,v);
  else _stSelectSurah(s);
  setTimeout(function(){window._stSuppressDivReset=false;},5000);
}

function _stUpdateHizbLabel(){
  var el=document.getElementById('st-hizb-label');if(!el)return;
  el.textContent=_stHizb>0?'Hizb '+_stHizb:'Hizb';
  var btn=document.getElementById('st-btn-hizb');
  if(btn)btn.classList.toggle('filtered',_stHizb>0);
}

function _stBuildManzilBar(){
  var panel=document.getElementById('st-dd-manzil');if(!panel)return;
  panel.innerHTML='';
  var list=(window._stDivisions&&window._stDivisions.manzil&&window._stDivisions.manzil.manzil)||[];

  var none=document.createElement('div');
  none.className='st-dd-item'+(_stManzil===0?' selected':'');
  none.textContent='\u2014';
  none.onclick=function(ev){ev.stopPropagation();_stSelectManzil(0);_stCloseDD();};
  panel.appendChild(none);

  list.forEach(function(m){
    var row=document.createElement('div');
    row.className='st-dd-item'+(m.number===_stManzil?' selected':'');
    row.textContent='Manzil '+m.number;
    row.title=m.description||('Manzil '+m.number);
    (function(mm){row.onclick=function(ev){ev.stopPropagation();_stSelectManzil(mm);_stCloseDD();};})(m.number);
    panel.appendChild(row);
  });
  _stUpdateManzilLabel();
}

function _stUpdateManzilLabel(){
  var el=document.getElementById('st-manzil-label');if(!el)return;
  el.textContent=_stManzil>0?'Manzil '+_stManzil:'Manzil';
  var btn=document.getElementById('st-btn-manzil');
  if(btn)btn.classList.toggle('filtered',_stManzil>0);
}

function _stSelectManzil(n){
  _stManzil=n;
  if(n===0){_stBuildManzilBar();_stUpdateManzilLabel();return;}

  // Picking a Manzil clears Juz + Hizb dropdowns.
  if(_stJuz!==0){_stJuz=0;_stBuildJuzDD();_stUpdateJuzLabel();}
  if(_stHizb!==0){_stHizb=0;_stBuildHizbDD();_stUpdateHizbLabel();}

  var list=(window._stDivisions&&window._stDivisions.manzil&&window._stDivisions.manzil.manzil)||[];
  var entry=null;
  for(var i=0;i<list.length;i++){if(list[i].number===n){entry=list[i];break;}}
  _stBuildManzilBar();_stUpdateManzilLabel();
  if(!entry||!entry.surah_range)return;
  var parts=String(entry.surah_range).split('-');
  var firstId=parseInt(parts[0],10);
  if(!isNaN(firstId)){
    window._stSuppressDivReset=true;
    _stSelectSurah(firstId);
    window._stSuppressDivReset=false;
  }
}


// ═══════════════════════════════════════════════════════════
// VERSE MARKERS (Juz / Hizb boundaries + Sajdah glyph)
// ═══════════════════════════════════════════════════════════
function _stCurrentJuzAt(surah,verse){
  var div=window._stDivisions;
  if(!div||!div.juz||!div.juz.juz)return null;
  var cur=null;
  var list=div.juz.juz;
  for(var i=0;i<list.length;i++){
    var j=list[i];
    if(!j.start)continue;
    var p=String(j.start).split(':');
    var s=parseInt(p[0],10), v=parseInt(p[1]||'1',10);
    if(s<surah||(s===surah&&v<=verse))cur=j.number;
    else break;
  }
  return cur;
}
function _stCurrentHizbAt(surah,verse){
  var div=window._stDivisions;
  if(!div||!div.hizb||!div.hizb.hizb)return null;
  var cur=null;
  var list=div.hizb.hizb;
  for(var i=0;i<list.length;i++){
    var hz=list[i];
    if(!hz.start)continue;
    var p=String(hz.start).split(':');
    var s=parseInt(p[0],10), v=parseInt(p[1]||'1',10);
    if(s<surah||(s===surah&&v<=verse))cur=hz.number;
    else break;
  }
  return cur;
}
function _stCurrentManzilAt(surah){
  var div=window._stDivisions;
  if(!div||!div.manzil||!div.manzil.manzil)return null;
  var list=div.manzil.manzil;
  for(var i=0;i<list.length;i++){
    var m=list[i];
    if(!m.surah_range)continue;
    var parts=String(m.surah_range).split('-');
    var s1=parseInt(parts[0],10), s2=parseInt(parts[1]||parts[0],10);
    if(surah>=s1&&surah<=s2)return m.number;
  }
  return null;
}

function _stBuildVerseMarkers(surah,verse){
  var div=window._stDivisions;
  if(!div)return'';

  // On verse 1, always label all three lines with the current division numbers.
  // On other verses, label only when that specific division STARTS at this verse.
  var firstVerse=(verse===1);

  var juzLabel=null;
  if(div.juz&&div.juz.juz){
    if(firstVerse){juzLabel=_stCurrentJuzAt(surah,verse);}
    else {
      for(var i=0;i<div.juz.juz.length;i++){
        var j=div.juz.juz[i];
        if(!j.start)continue;
        var p=String(j.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){juzLabel=j.number;break;}
      }
    }
  }
  var hizbLabel=null;
  if(div.hizb&&div.hizb.hizb){
    if(firstVerse){hizbLabel=_stCurrentHizbAt(surah,verse);}
    else {
      for(var i=0;i<div.hizb.hizb.length;i++){
        var hz=div.hizb.hizb[i];
        if(!hz.start)continue;
        var p=String(hz.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){hizbLabel=hz.number;break;}
      }
    }
  }
  var manzilLabel=null;
  if(firstVerse)manzilLabel=_stCurrentManzilAt(surah);

  function line(cls,labelN){
    var has=(labelN!==null);
    var inner=has?'<span class="st-vm-num">'+labelN+'</span>':'';
    return '<span class="st-vm-line '+cls+'">'+inner+'</span>';
  }
  var h='';
  h+=line('st-vm-manzil',manzilLabel);
  h+=line('st-vm-hizb',hizbLabel);
  h+=line('st-vm-juz',juzLabel);
  return h;
}

function _stBuildVerseLegends(surah,verse){
  var div=window._stDivisions;
  if(!div)return'';
  var h='';
  // Sajdah (۩) — prefer positions file, fall back to sajdah.json.verses
  var hasSaj=false;
  var sajList=(div.sajdah_pos&&div.sajdah_pos.marks)||(div.sajdah&&div.sajdah.verses)||[];
  for(var i=0;i<sajList.length;i++){
    var sj=sajList[i];
    if(sj.surah===surah&&sj.verse===verse){hasSaj=true;break;}
  }
  if(hasSaj) h+='<span class="st-legend st-legend-sajdah" title="Sajdah (prostration)">\u06E9</span>';

  // Rub al-Hizb (۞) — only from rub_positions (it marks in-text positions)
  var hasRub=false;
  if(div.rub_pos&&div.rub_pos.marks){
    for(var j=0;j<div.rub_pos.marks.length;j++){
      var rb=div.rub_pos.marks[j];
      if(rb.surah===surah&&rb.verse===verse){hasRub=true;break;}
    }
  }
  if(hasRub) h+='<span class="st-legend st-legend-rub" title="Rub al-Hizb (quarter section)">\u06DE</span>';

  return h;
}

// Wrap inline waqf / sajdah / rub marks in Arabic verse text with .qmark spans
// so hover can surface their definition. Other diacritics and letters untouched.
function _stWrapMarks(s){
  if(!s)return s;
  return String(s).replace(/[\u06D6-\u06DC\u06DE\u06E9]/g,function(c){
    return '<span class="qmark" data-mark="'+c+'">'+c+'</span>';
  });
}

// Delegated hover tooltip for in-text waqf/sajdah/rub marks.
function _stInitQmarkTooltip(){
  if(window._stQmarkInited)return;
  window._stQmarkInited=true;
  var tip=document.createElement('div');
  tip.id='st-qmark-tip';
  tip.style.cssText='position:fixed;z-index:9999;display:none;font-size:var(--fs-3);color:#FFF;background:#1a1a1a;padding:6px 8px;border-radius:4px;border:1px solid rgba(255,255,255,0.12);pointer-events:none;white-space:nowrap;font-family:Lato,sans-serif';
  document.body.appendChild(tip);
  document.addEventListener('mouseover',function(ev){
    var t=ev.target; if(!t||!t.classList||!t.classList.contains('qmark'))return;
    var mark=t.getAttribute('data-mark');
    var info=(window._stWaqfLookup||{})[mark];
    if(!info)return;
    tip.textContent=(info.arabic_sign||mark)+' \u2014 '+(info.hover_def||'');
    tip.style.display='block';
    var r=t.getBoundingClientRect();
    var tr=tip.getBoundingClientRect();
    tip.style.left=Math.max(4,(r.left+r.width/2-tr.width/2))+'px';
    tip.style.top=Math.max(4,(r.top-tr.height-6))+'px';
  });
  document.addEventListener('mouseout',function(ev){
    var t=ev.target; if(!t||!t.classList||!t.classList.contains('qmark'))return;
    tip.style.display='none';
  });
}


// ═══════════════════════════════════════════════════════════
// MARKERS OVERLAY — one container, 3 continuous lines, floating labels
// ═══════════════════════════════════════════════════════════
function _stMarkersFor(surah,verse,isFirst){
  var div=window._stDivisions;
  var r={juz:null,hizb:null,manzil:null};
  if(!div)return r;
  if(div.juz&&div.juz.juz){
    if(isFirst){r.juz=_stCurrentJuzAt(surah,verse);}
    else {
      for(var i=0;i<div.juz.juz.length;i++){
        var j=div.juz.juz[i];
        if(!j.start)continue;
        var p=String(j.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){r.juz=j.number;break;}
      }
    }
  }
  if(div.hizb&&div.hizb.hizb){
    if(isFirst){r.hizb=_stCurrentHizbAt(surah,verse);}
    else {
      for(var i=0;i<div.hizb.hizb.length;i++){
        var hz=div.hizb.hizb[i];
        if(!hz.start)continue;
        var p=String(hz.start).split(':');
        if(parseInt(p[0],10)===surah&&parseInt(p[1]||'1',10)===verse){r.hizb=hz.number;break;}
      }
    }
  }
  if(isFirst)r.manzil=_stCurrentManzilAt(surah);
  return r;
}

function _stLayoutMarkers(){
  var list=document.querySelector('.st-verses-list');
  var overlay=document.querySelector('.st-markers-overlay');
  if(!list||!overlay)return;
  // Clear stale labels but keep the 3 line divs.
  overlay.querySelectorAll('.st-vm-num').forEach(function(n){n.remove();});

  var rows=list.querySelectorAll('.st-verse');
  rows.forEach(function(row,idx){
    var vid=parseInt(row.getAttribute('data-verse-id'),10);
    if(isNaN(vid))return;
    var isFirst=(idx===0);
    var labels=_stMarkersFor(_stSurah,vid,isFirst);
    var which=[];
    if(labels.manzil!==null)which.push(['manzil',labels.manzil]);
    if(labels.hizb!==null)which.push(['hizb',labels.hizb]);
    if(labels.juz!==null)which.push(['juz',labels.juz]);
    if(!which.length)return;
    var baseTop=isFirst?0:row.offsetTop;
    var stagger=(which.length>1)?18:0;
    which.forEach(function(p,i){
      var type=p[0], n=p[1];
      var el=document.createElement('span');
      el.className='st-vm-num st-vm-num-'+type;
      if(isFirst){
        // Starting numbers: stack from the top, no vertical centering.
        el.style.top=(baseTop+i*16)+'px';
        el.style.transform='translateX(-50%)';
      } else {
        // Division change: pill visually centered on the line.
        el.style.top=(baseTop+i*stagger)+'px';
        el.style.transform='translate(-50%,-50%)';
      }
      el.textContent=String(n);
      overlay.appendChild(el);
    });
  });
}
window._stLayoutMarkers=_stLayoutMarkers;

(function(){
  var to=null;
  window.addEventListener('resize',function(){
    clearTimeout(to);
    to=setTimeout(function(){if(typeof _stLayoutMarkers==='function')_stLayoutMarkers();},120);
  });
})();



// ═══════════════════════════════════════════════════════════
// PLAY SURAH — whole-surah playback control (header pill)
// ═══════════════════════════════════════════════════════════
window._stSurahPlayMode=false;

function _stSurahPlayClick(ev){
  if(ev)ev.stopPropagation();
  if(!window.QuranAudio)return;
  var el=document.getElementById('qa-primary');
  var cur=window.QuranAudio.getCurrent();
  if(window._stSurahPlayMode&&cur&&el){
    // Already in surah-play mode — toggle pause/resume.
    if(!el.paused){
      window.QuranAudio.pause();
    } else {
      el.play().catch(function(){});
    }
    _stUpdateSurahPlayBtn();
    return;
  }
  // Idle or stopped — start fresh from ayah 1.
  window._stSurahPlayMode=true;
  window.QuranAudio.play(_stSurah,1);
  _stUpdateSurahPlayBtn();
}
window._stSurahPlayClick=_stSurahPlayClick;

function _stUpdateSurahPlayBtn(){
  var btn=document.getElementById('st-surah-play-btn');
  if(!btn)return;
  var el=document.getElementById('qa-primary');
  var cur=window.QuranAudio&&window.QuranAudio.getCurrent();
  var playing=(window._stSurahPlayMode&&cur&&el&&!el.paused);
  btn.textContent=playing?'\u23F8':'\u25B6';
  btn.classList.toggle('playing',playing);
}

// ═══════════════════════════════════════════════════════════
// QURAN AUDIO WIRING — reciter dropdown + per-ayah play button
// ═══════════════════════════════════════════════════════════
function _stBuildReciterDD(){
  var panel=document.getElementById('st-dd-reciter');if(!panel)return;
  panel.innerHTML='';
  (_stReciters||[]).forEach(function(r){
    var row=document.createElement('div');
    row.className='st-dd-item'+(_stCurrentReciter===r.id?' selected':'');
    row.textContent=r.name||r.id;
    (function(rid,rname){
      row.onclick=function(ev){ev.stopPropagation();_stSelectReciter(rid,rname);_stCloseDD();};
    })(r.id,r.name||r.id);
    panel.appendChild(row);
  });
}

function _stSelectReciter(id,name){
  _stCurrentReciter=id;
  _stCurrentReciterName=name||id;
  if(window.QuranAudio)window.QuranAudio.setReciter(id);
  _stBuildReciterDD();
  _stUpdateReciterLabel();
}

function _stUpdateReciterLabel(){
  var el=document.getElementById('st-reciter-label');if(!el)return;
  el.textContent=_stCurrentReciterName||'Reciter';
}

function _stPlayClick(s,a,ev){
  if(ev)ev.stopPropagation();
  if(!window.QuranAudio)return;
  // Single-shot: leaving surah-play mode ensures no auto-advance past this ayah.
  window._stSurahPlayMode=false;
  _stUpdateSurahPlayBtn();
  var cur=window.QuranAudio.getCurrent();
  var el=document.getElementById('qa-primary');
  if(cur&&cur.surah===s&&cur.ayah===a){
    // Toggle pause/resume on the already-current ayah.
    if(el&&!el.paused){
      window.QuranAudio.pause();
      var btn=ev&&ev.currentTarget;
      if(btn){btn.textContent='\u25B6';btn.classList.remove('playing');}
    } else if(el){
      el.play().catch(function(){});
      var btn2=ev&&ev.currentTarget;
      if(btn2){btn2.textContent='\u23F8';btn2.classList.add('playing');}
    }
  } else {
    window.QuranAudio.play(s,a);
  }
}
window._stPlayClick=_stPlayClick;

function _stOnAudioChange(cur){
  document.querySelectorAll('.st-play-btn').forEach(function(btn){
    var s=parseInt(btn.getAttribute('data-surah'),10);
    var a=parseInt(btn.getAttribute('data-ayah'),10);
    if(cur&&s===cur.surah&&a===cur.ayah){
      btn.textContent='\u23F8';btn.classList.add('playing');
    } else {
      btn.textContent='\u25B6';btn.classList.remove('playing');
    }
  });
  // Surah-play: scroll target row into view; bail out on null (end-of-surah stop).
  if(cur===null&&window._stSurahPlayMode){
    window._stSurahPlayMode=false;
  }
  _stUpdateSurahPlayBtn();
  if(cur&&window._stSurahPlayMode){
    var row=document.querySelector('.st-verse[data-verse-id="'+cur.ayah+'"]');
    if(row)row.scrollIntoView({behavior:'smooth',block:'center'});
  }
}

function _stOnAudioError(err){
  console.warn('[START] audio playback failed:',err);
  if(!err)return;
  var btn=document.querySelector('.st-play-btn[data-surah="'+err.surah+'"][data-ayah="'+err.ayah+'"]');
  if(btn){
    btn.classList.add('st-play-err');
    setTimeout(function(){btn.classList.remove('st-play-err');},1000);
  }
}

// ═══════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════
function _stCleanup(){
  document.body.classList.remove('st-active');
}

// ═══════════════════════════════════════════════════════════
// SETVIEW INTEGRATION
// ═══════════════════════════════════════════════════════════
(function(){
  var _origSV=window.setView;
  if(!_origSV)return;
  window.setView=function(v){
    // Leaving start
    var sv=document.getElementById('start-view');
    if(v!=='start'){
      if(sv)sv.style.display='none';
      document.body.classList.remove('st-active');
    }

    _origSV(v);

    if(v==='start'){
      // Hide everything setView might not know about
      ['leftPanel','silsilaView','mapView','studyRoomView',
       'follow-view','events-view','eras-view','think-view','one-view',
       'talk-view','books-view','monastic-view','updates-view'].forEach(function(id){
        var el=document.getElementById(id);if(el)el.style.display='none';
      });
      // Hide info panel and related
      var ip=document.getElementById('infoPanel');if(ip)ip.style.display='none';
      var cs=document.getElementById('centScrollStrip');if(cs)cs.style.display='none';

      if(sv)sv.style.display='flex';
      document.body.classList.add('st-active');

      if(typeof _showViewDesc==='function'){
        _showViewDesc('');
        var vd=document.getElementById('viewDescInline');
        if(vd)vd.innerHTML='Read the Quran \u2014 <span class="hdr-stat-num">114</span> Surahs \u00B7 <span class="hdr-stat-num">6,236</span> Verses';
      }

      initStart();
    }
  };
})();

function _dvPickLang(code){
  DIVE_TLANG_FILTER = code || "";
  var lbl = document.getElementById("st-dvlang-label");
  if(lbl) lbl.textContent = code ? ("Tafsir: "+DIVE_LANG_FULL[code]) : "Tafsir Language";
  _stCloseDD();
  // Invalidate all loaded tafsir slots so they re-render with filter
  document.querySelectorAll(".dv-tafsir-slot").forEach(function(s){ s.setAttribute("data-loaded","0"); s.innerHTML=""; });
  // Reopen any currently-open tafsir details so they repopulate
  document.querySelectorAll(".dv-card details").forEach(function(d){
    var slot = d.querySelector(".dv-tafsir-slot");
    if(slot && d.open) _dvPopulateTafsirSlot(slot);
  });
}
window._dvPickLang = _dvPickLang;

window._stEsc=_stEsc;

// ══════════════════════════════════════════════════════════
// BOOKMARKS
// ══════════════════════════════════════════════════════════
function _stBmkRender(){
  var auth=window.GoldArkAuth;
  var signedIn=auth&&auth.isSignedIn();
  // Remove any old ribbons (from any previous location)
  document.querySelectorAll('#st-verses .st-bmk').forEach(function(x){ x.remove(); });
  // Find each verse row and put the ribbon in the LINKS column (.st-vlink)
  document.querySelectorAll('#st-verses .st-verse').forEach(function(row){
    var centerSpan=row.querySelector('.st-vcenter span[data-bmk-verse]');
    if(!centerSpan) return;
    var v=parseInt(centerSpan.getAttribute('data-bmk-verse'));
    if(!v) return;
    var linkCol=row.querySelector('.st-vlink');
    if(!linkCol) return;
    var s=window._stCurrentSurah||1;
    var filled=signedIn&&auth.hasBookmark(s,v);
    var btn=document.createElement('button');
    btn.className='st-bmk'+(filled?' on':'');
    btn.title=signedIn?(filled?'Remove bookmark':'Add bookmark'):'Sign in to bookmark';
    btn.innerHTML='<svg width="12" height="16" viewBox="0 0 12 16" fill="'+(filled?'#D4AF37':'none')+'" stroke="#D4AF37" stroke-width="1.4"><path d="M1 1 L1 15 L6 11 L11 15 L11 1 Z"/></svg>';
    btn.onclick=function(e){
      e.stopPropagation();
      window.requireTester('bookmark',function(){
        var a=window.GoldArkAuth;
        var surah=window._stCurrentSurah||1;
        var p=a.hasBookmark(surah,v)?a.removeBookmark(surah,v):a.addBookmark(surah,v);
        p.then(function(){
          setTimeout(function(){
            try{ _stBmkRender(); _stBmkInjectTopbarBtn(); }catch(e){}
          },200);
        }).catch(function(err){console.error(err);});
      });
    };
    linkCol.appendChild(btn);
  });
}
window._stBmkRender=_stBmkRender;

function _stBmkPopup(){
  var auth=window.GoldArkAuth;
  if(!auth||!auth.isSignedIn()){
    window.requireTester('bookmarks',function(){ _stBmkPopup(); });
    return;
  }
  var bmks=auth.getBookmarks();
  var old=document.getElementById('st-bmk-popup'); if(old) old.remove();
  var overlay=document.createElement('div');
  overlay.id='st-bmk-popup';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';
  overlay.onclick=function(e){ if(e.target===overlay) overlay.remove(); };
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:8px;max-width:440px;width:90%;max-height:70vh;overflow-y:auto;padding:24px;position:relative;font-family:Lato,sans-serif;color:#E5E7EB;font-size:var(--fs-3)';
  var h='<button onclick="document.getElementById(\'st-bmk-popup\').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>';
  h+='<h3 style="color:#D4AF37;font-family:Cinzel,serif;font-size:var(--fs-2);margin:0 0 16px;letter-spacing:.06em">My Bookmarks</h3>';
  if(!bmks.length){
    h+='<div style="color:#888;font-style:italic">No bookmarks yet. Click the ribbon next to any verse to save it.</div>';
  } else {
    h+='<div style="display:flex;flex-direction:column;gap:6px">';
    bmks.sort(function(a,b){
      var pa=a.split(':').map(Number), pb=b.split(':').map(Number);
      return pa[0]-pb[0]||pa[1]-pb[1];
    }).forEach(function(k){
      var p=k.split(':'); var s=parseInt(p[0]), v=parseInt(p[1]);
      h+='<button class="st-bmk-item" data-s="'+s+'" data-v="'+v+'" style="text-align:left;background:rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.3);color:#E5E7EB;padding:8px 12px;border-radius:4px;cursor:pointer;font-family:Lato,sans-serif;font-size:var(--fs-3)">Surah '+s+' : Verse '+v+'</button>';
    });
    h+='</div>';
  }
  box.innerHTML=h;
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  box.querySelectorAll('.st-bmk-item').forEach(function(btn){
    btn.onclick=function(){
      var s=parseInt(btn.getAttribute('data-s'));
      var v=parseInt(btn.getAttribute('data-v'));
      overlay.remove();
      // Try every known surah-loader, then scroll to verse
      var loaded=false;
      var fns=['_stLoadSurah','_stGoto','_stOpenSurah','_stJumpTo','_stShowSurah','_stSelectSurah'];
      for(var i=0;i<fns.length;i++){
        if(typeof window[fns[i]]==='function'){
          try{ window[fns[i]](s,v); loaded=true; break; }catch(e){}
        }
      }
      // Fallback: set surah dropdown if it exists, then scroll to verse
      if(!loaded){
        var sel=document.querySelector('#st-surah-select,#st-surah-dd,select[data-st-surah]');
        if(sel){
          sel.value=s;
          sel.dispatchEvent(new Event('change',{bubbles:true}));
        }
      }
      // Scroll to the verse once rendered
      setTimeout(function(){
        var verseEl=document.querySelector('#st-verses .st-verse [data-bmk-verse="'+v+'"]');
        if(verseEl){
          var row=verseEl.closest('.st-verse');
          if(row){
            row.scrollIntoView({behavior:'smooth',block:'center'});
            row.classList.add('qref-pulse');
            setTimeout(function(){ row.classList.remove('qref-pulse'); },2500);
          }
        }
      },500);
    };
  });
}
window._stBmkPopup=_stBmkPopup;

function _stBmkInjectTopbarBtn(){
  var bar=document.getElementById('st-topbar');
  if(!bar) return;
  var btn=document.getElementById('st-bmk-btn');
  if(!btn){
    btn=document.createElement('button');
    btn.id='st-bmk-btn';
    btn.className='st-topbar-btn';
    btn.type='button';
    btn.onclick=_stBmkPopup;
    bar.appendChild(btn);
  }
  var auth=window.GoldArkAuth;
  var count=(auth&&auth.isSignedIn())?auth.getBookmarks().length:0;
  var hasAny=count>0;
  var color=hasAny?'#D4AF37':'#A0AEC0';
  var borderCol=hasAny?'rgba(212,175,55,0.8)':'rgba(160,174,192,0.5)';
  btn.title=hasAny?('View my '+count+' bookmark(s)'):'No bookmarks yet';
  btn.innerHTML='★ BOOKMARKS'+(hasAny?' ('+count+')':'');
  btn.style.cssText='margin-left:6px;padding:4px 12px;background:transparent;border:1px solid '+borderCol+';color:'+color+';font-family:Cinzel,serif;font-size:var(--fs-3);letter-spacing:.06em;text-transform:uppercase;cursor:pointer;border-radius:2px';
}
window._stBmkInjectTopbarBtn=_stBmkInjectTopbarBtn;

// Re-render bookmark ribbons + topbar button when auth state changes
if(window.GoldArkAuth&&window.GoldArkAuth.onStateChange){
  window.GoldArkAuth.onStateChange(function(){
    try{ _stBmkRender(); _stBmkInjectTopbarBtn(); }catch(e){}
  });
}
