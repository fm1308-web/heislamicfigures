/* ─────────────────────────────────────────────────────────────
   STUDY view — verbatim lift from bv-app/study.js
   IIFE exposes window.StudyView = { mount, unmount }
   ───────────────────────────────────────────────────────────── */
window.StudyView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global — STUDY uses 'studyroom' in the lifted code
  var VIEW = 'studyroom';
  window.VIEW = 'studyroom';
  // stub: APP namespace (favourites + i18n)
  var APP = window.APP || {
    Favorites: null,
    filterFavsOnly: false,
    _lang: 'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; }
  };
  window.APP = APP;
  // stub: requireTester — auth gate skipped in sandbox; star toggle still works
  function requireTester(action, cb){ if(typeof cb === 'function') cb(); }
  window.requireTester = requireTester;
  // stub: _updateFavFilterBtn — header SAVED toggle in bv-app; sandbox no-op
  function _updateFavFilterBtn(){ /* no-op */ }
  window._updateFavFilterBtn = _updateFavFilterBtn;
  // stub: setView — sandbox shell uses setActiveTab; openStudyRoom is parked
  if(typeof window.setView !== 'function') window.setView = function(){};
  // stub: _showViewDesc — sandbox has no header tagline target; no-op
  if(typeof window._showViewDesc !== 'function') window._showViewDesc = function(){};

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/study.js ▼▼▼
  // ═══════════════════════════════════════════════════════════

const _SR_SCHOLARS={
  'F0241': {name:'Al-Hallaj',              death:'d. 922 CE',  dod:922},
  'F0229': {name:'Al-Farabi',              death:'d. 950 CE',  dod:950},
  'F0605': {name:'Firdowsi',              death:'d. 1020 CE', dod:1020},
  'F0222': {name:'Al-Biruni',              death:'d. 1048 CE', dod:1048},
  'F0737': {name:'Ibn Hazm',               death:'d. 1064 CE', dod:1064},
  'F0316': {name:'Al-Qushayri',            death:'d. 1072 CE', dod:1072},
  'F0363': {name:'Ali al-Hujwiri',         death:'d. 1072 CE', dod:1072},
  'F0238': {name:'Al-Ghazali',             death:'d. 1111 CE', dod:1111},
  'F0031': {name:'Abdul Qadir al-Jilani',  death:'d. 1166 CE', dod:1166},
  'F0756': {name:'Ibn Tufayl',             death:'d. 1185 CE', dod:1185},
  'F0751': {name:'Ibn Rushd',              death:'d. 1198 CE', dod:1198},
  'F0580': {name:'Farid ud-Din Attar',     death:'d. 1221 CE', dod:1221},
  'F1432': {name:'Umar Ibn al-Farid',     death:'d. 1235 CE', dod:1235},
  'F0728': {name:'Ibn Arabi',              death:'d. 1240 CE', dod:1240},
  'F0574': {name:'Fakhr al-Din Iraqi',    death:'d. 1289 CE', dod:1289},
  'F0755': {name:'Ibn Taymiyya',           death:'d. 1328 CE', dod:1328},
  'F0727': {name:'Ibn al-Qayyim',          death:'d. 1350 CE', dod:1350},
  'F0743': {name:'Ibn Khaldun',            death:'d. 1406 CE', dod:1406}
};
let _srActive=null;
let _srOpenScholar=null;
let _srBookData={}; // slug -> [{book_id, title, types: {slides:entry, summary:entry, video:entry}}]

async function _fetchScholarBooks(slug){
  if(_srBookData[slug]) return _srBookData[slug];
  const books={};
  const cats=['slides','summary','video'];
  for(const cat of cats){
    try{
      const res=await fetch(dataUrl('data/islamic/studyroom/'+cat+'/'+slug+'-manifest.json'));
      if(!res.ok) continue;
      const items=await res.json();
      items.forEach(function(item){
        const bid=item.book_id||'unknown';
        if(!books[bid]) books[bid]={book_id:bid, title:item.title||bid, types:{}};
        books[bid].types[cat]=item;
      });
    }catch(e){}
  }
  const arr=Object.values(books);
  _srBookData[slug]=arr;
  return arr;
}

function _buildStudySidebar(){
  const panel=document.getElementById('sr-left');
  if(!panel) return;
  panel.innerHTML='';
  const sorted=Object.keys(_SR_SCHOLARS).sort(function(a,b){return _SR_SCHOLARS[a].dod-_SR_SCHOLARS[b].dod;});
  const showFavsOnly=APP.filterFavsOnly&&APP.Favorites;
  sorted.forEach(function(slug){
    const s=_SR_SCHOLARS[slug];
    if(showFavsOnly&&!APP.Favorites.has(s.name)) return;

    var card=document.createElement('div');
    card.className='sr-card';
    card.dataset.slug=slug;

    var nameDiv=document.createElement('div');
    nameDiv.className='sr-card-name';
    nameDiv.textContent=s.name;

    var dateDiv=document.createElement('div');
    dateDiv.className='sr-card-date';
    dateDiv.textContent=s.death;

    var star=document.createElement('span');
    star.className='sr-card-fav';
    var isFav=APP.Favorites&&APP.Favorites.has(s.name);
    star.textContent=isFav?'★':'☆';
    if(isFav) star.classList.add('active');
    star.onclick=function(e){
      e.stopPropagation();
      if(!APP.Favorites) return;
      requireTester('save', function(){
        var nowFav=APP.Favorites.toggle(s.name);
        star.textContent=nowFav?'★':'☆';
        star.classList.toggle('active',nowFav);
        _updateFavFilterBtn();
        if(APP.filterFavsOnly) _buildStudySidebar();
      });
    };

    var chevron=document.createElement('span');
    chevron.className='sr-card-chevron';
    chevron.textContent='▸';

    card.appendChild(chevron);
    card.appendChild(nameDiv);
    card.appendChild(dateDiv);
    card.appendChild(star);

    var dropdown=document.createElement('div');
    dropdown.className='sr-book-dropdown';
    dropdown.dataset.slug=slug;

    card.onclick=function(e){
      if(e.target.closest('.sr-card-fav')) return;
      _toggleScholarDropdown(slug, dropdown, card, chevron);
    };

    panel.appendChild(card);
    panel.appendChild(dropdown);
  });
}

async function _toggleScholarDropdown(slug, dropdown, card, chevron){
  if(_srOpenScholar===slug){
    dropdown.classList.remove('open');
    card.classList.remove('sel');
    chevron.textContent='▸';
    _srOpenScholar=null;
    return;
  }
  document.querySelectorAll('.sr-book-dropdown.open').forEach(function(d){d.classList.remove('open');});
  document.querySelectorAll('.sr-card.sel').forEach(function(c){c.classList.remove('sel');});
  document.querySelectorAll('.sr-card-chevron').forEach(function(ch){ch.textContent='▸';});

  card.classList.add('sel');
  chevron.textContent='▾';
  _srOpenScholar=slug;
  _srActive=slug;

  var s=_SR_SCHOLARS[slug];
  document.getElementById('sr-heading').textContent=s?s.name:slug;

  dropdown.innerHTML='<div class="sr-book-loading">Loading…</div>';
  dropdown.classList.add('open');

  var books=await _fetchScholarBooks(slug);
  dropdown.innerHTML='';

  if(!books.length){
    dropdown.innerHTML='<div class="sr-book-empty">No content yet</div>';
    return;
  }

  books.forEach(function(book){
    var bookEl=document.createElement('div');
    bookEl.className='sr-book-item';

    var titleEl=document.createElement('div');
    titleEl.className='sr-book-title';
    titleEl.textContent=book.title;
    bookEl.appendChild(titleEl);

    var btns=document.createElement('div');
    btns.className='sr-book-btns';

    if(book.types.slides){
      var sb=document.createElement('button');
      sb.className='sr-tab sr-book-tab';
      sb.setAttribute('data-type','slides');
      sb.textContent='📖 Slides';
      sb.onclick=function(e){e.stopPropagation();_loadBookContent(slug,'slides',book);_highlightBtn(btns,sb);};
      btns.appendChild(sb);
    }
    if(book.types.summary){
      var ub=document.createElement('button');
      ub.className='sr-tab sr-book-tab';
      ub.setAttribute('data-type','summary');
      ub.textContent='📄 Summary';
      ub.onclick=function(e){e.stopPropagation();_loadBookContent(slug,'summary',book);_highlightBtn(btns,ub);};
      btns.appendChild(ub);
    }
    if(book.types.video){
      var vb=document.createElement('button');
      vb.className='sr-tab sr-book-tab';
      vb.setAttribute('data-type','video');
      vb.textContent='🎥 Video';
      vb.onclick=function(e){e.stopPropagation();_loadBookContent(slug,'video',book);_highlightBtn(btns,vb);};
      btns.appendChild(vb);
    }

    bookEl.appendChild(btns);
    dropdown.appendChild(bookEl);
  });

  if(books.length){
    var first=books[0];
    var type=first.types.slides?'slides':first.types.summary?'summary':first.types.video?'video':null;
    if(type){
      _loadBookContent(slug,type,first);
      var firstBtn=dropdown.querySelector('.sr-book-tab');
      if(firstBtn) firstBtn.classList.add('active');
    }
  }
}

function _highlightBtn(container, btn){
  document.querySelectorAll('.sr-book-tab.active').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
}

function _loadBookContent(slug, type, book){
  var body=document.getElementById('sr-body');
  body.querySelectorAll('iframe').forEach(function(f){f.src='about:blank';});
  body.innerHTML='';

  var s=_SR_SCHOLARS[slug];
  document.getElementById('sr-heading').innerHTML=
    '<span style="opacity:0.5;font-size:var(--fs-3)">'+(s?s.name:'')+'</span><br>'+
    '<span>'+_esc(book.title)+'</span>';

  var entry=book.types[type];
  if(!entry) return;

  if(type==='slides'){
    var url=dataUrl('data/islamic/studyroom/slides/'+encodeURIComponent(entry.file));
    var wrap=document.createElement('div');
    wrap.style.cssText='position:relative;margin-bottom:32px';
    var f=document.createElement('iframe');
    f.setAttribute('allowfullscreen','');
    f.setAttribute('webkitallowfullscreen','');
    f.style.cssText='width:100%;height:600px;border:none;display:block;border-radius:5px';
    wrap.appendChild(f);
    var fsBtn=document.createElement('button');
    fsBtn.textContent='⛶';
    fsBtn.style.cssText='position:absolute;bottom:10px;right:10px;z-index:10;background:rgba(0,0,0,0.5);border:1px solid var(--border2);border-radius:4px;color:var(--accent);font-size:var(--fs-1);padding:4px 8px;cursor:pointer';
    fsBtn.onmouseenter=function(){fsBtn.style.background='rgba(212,175,55,.15)';fsBtn.style.borderColor='var(--accent)';};
    fsBtn.onmouseleave=function(){fsBtn.style.background='rgba(0,0,0,0.5)';fsBtn.style.borderColor='var(--border2)';};
    fsBtn.onclick=function(){
      if(wrap.dataset.expanded==='1'){
        wrap.style.cssText='position:relative;margin-bottom:32px';
        f.style.width='100%';f.style.height='600px';
        fsBtn.textContent='⛶';wrap.dataset.expanded='0';
      }else{
        wrap.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#000;margin:0';
        f.style.width='100%';f.style.height='100%';
        fsBtn.textContent='✖';wrap.dataset.expanded='1';
      }
    };
    wrap.appendChild(fsBtn);
    document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&wrap.dataset.expanded==='1')fsBtn.click();});
    body.appendChild(wrap);
    f.src=url;
  }

  if(type==='summary'){
    var url2=dataUrl('data/islamic/studyroom/summary/'+encodeURIComponent(entry.file));
    var f=document.createElement('iframe');
    f.style.cssText='width:100%;height:600px;border:none;display:block;border-radius:5px;margin-bottom:32px';
    body.appendChild(f);
    f.src=url2;
  }

  if(type==='video'){
    var wrap=document.createElement('div');
    wrap.style.cssText='position:relative;margin-bottom:32px';
    var f=document.createElement('iframe');
    f.setAttribute('allowfullscreen','');
    f.setAttribute('allow','accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    f.style.cssText='width:100%;height:400px;border:none;display:block;border-radius:5px';
    f.src=entry.url;
    wrap.appendChild(f);
    body.appendChild(wrap);
  }
}

function _esc(s){return(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function selectStudyScholar(slug){
  _srActive=slug;
  var panel=document.getElementById('sr-left');
  if(panel&&!panel.children.length) _buildStudySidebar();
  var card=panel.querySelector('.sr-card[data-slug="'+slug+'"]');
  if(card) card.click();
}
window.selectStudyScholar = selectStudyScholar;

async function selectStudyTab(tab){
  if(!_srActive) return;
  var books=await _fetchScholarBooks(_srActive);
  for(var i=0;i<books.length;i++){
    if(books[i].types[tab]){
      _loadBookContent(_srActive,tab,books[i]);
      return;
    }
  }
}
window.selectStudyTab = selectStudyTab;

function openStudyRoom(slug){
  setView('studyroom');
  selectStudyScholar(slug);
}
window.openStudyRoom = openStudyRoom;

const _SR_BADGE_NAMES=new Set(['Al-Hallaj','Al-Farabi','Firdowsi','Al-Biruni','Ali al-Hujwiri','Ibn Arabi','Al-Qushayri','Al-Ghazali','Umar Ibn al-Farid','Ibn Rushd','Ibn Tufayl','Farid ud-Din Attar','Abdul Qadir al-Jilani','Fakhr al-Din Iraqi','Ibn Taymiyya','Ibn al-Qayyim','Ibn Hazm','Ibn Khaldun']);
const _SR_SLUG_MAP={'Al-Hallaj':'F0241','Al-Farabi':'F0229','Firdowsi':'F0605','Al-Biruni':'F0222','Ali al-Hujwiri':'F0363','Ibn Arabi':'F0728','Al-Qushayri':'F0316','Al-Ghazali':'F0238','Umar Ibn al-Farid':'F1432','Ibn Rushd':'F0751','Ibn Tufayl':'F0756','Farid ud-Din Attar':'F0580','Abdul Qadir al-Jilani':'F0031','Fakhr al-Din Iraqi':'F0574','Ibn Taymiyya':'F0755','Ibn al-Qayyim':'F0727','Ibn Hazm':'F0737','Ibn Khaldun':'F0743'};
window._SR_SLUG_MAP = _SR_SLUG_MAP;

function _showStudyMethodology(){
  if(document.getElementById('sr-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='sr-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="sr-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">×</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6">Curated educational content — slide decks, visual summaries, and video lectures about key Islamic scholars.</p>'
    +'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin-top:16px">AI-generated · independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('sr-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // ═══════════════════════════════════════════════════════════

  function _injectScaffold(zoneCEl){
    zoneCEl.innerHTML =
      '<div id="studyRoomView" class="active">' +
        '<div id="sr-left"></div>' +
        '<div id="sr-right">' +
          '<div id="sr-heading"></div>' +
          '<div id="sr-body"></div>' +
        '</div>' +
      '</div>';
  }

  // Wire shell's Zone B controls (search + Writer / Topic selects).
  // Per HARD RULES, view only attaches handlers — does not inject Zone B DOM.
  function _wireZoneB(zoneBEl){
    // Search input → filter sidebar by name (live).
    var searchInp = document.getElementById('search');
    if(searchInp){
      searchInp.placeholder = 'Search writers…';
      searchInp.addEventListener('input', function(){
        var q = (searchInp.value || '').toLowerCase();
        document.querySelectorAll('#sr-left .sr-card').forEach(function(card){
          var name = (card.querySelector('.sr-card-name') || {}).textContent || '';
          var match = !q || name.toLowerCase().indexOf(q) !== -1;
          card.style.display = match ? '' : 'none';
          // Hide adjacent dropdown alongside the card
          var dd = card.nextElementSibling;
          if(dd && dd.classList && dd.classList.contains('sr-book-dropdown')){
            dd.style.display = match ? '' : 'none';
          }
        });
      });
    }

    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;
    // Writer / Topic selects: handlers parked — picker UI not implemented in sandbox.
    // Click toggles zb-active state via shell.bindActiveToggle, which is already bound.
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('sr-mounted');
    _injectScaffold(zoneCEl);
    _wireZoneB(zoneBEl);

    // Reset transient state so re-mount rebuilds cleanly.
    _srOpenScholar = null;
    _srActive = null;

    // Eagerly load core.json (used by jump-to-figure cross-view chips) and the three
    // studyroom manifest categories for the first scholar so the auto-load is instant
    // when the user clicks. Mirrors timeline's Promise.all pattern.
    var p1 = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(dataUrl('data/islamic/core.json'))
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });

    // Pre-warm manifests for the first (earliest dod) scholar so first click is instant.
    var firstSlug = Object.keys(_SR_SCHOLARS).sort(function(a,b){
      return _SR_SCHOLARS[a].dod - _SR_SCHOLARS[b].dod;
    })[0];
    var p2 = firstSlug ? _fetchScholarBooks(firstSlug) : Promise.resolve([]);

    Promise.all([p1, p2]).then(function(){
      _buildStudySidebar();
    });
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('sr-mounted');

    // Stop iframes so PDFs/videos release before zoneC is wiped.
    document.querySelectorAll('#sr-body iframe').forEach(function(f){
      try { f.src = 'about:blank'; } catch(e) {}
    });

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return { mount: mount, unmount: unmount, showHtw: _showStudyMethodology };
})();
