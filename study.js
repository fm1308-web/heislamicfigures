// ═══════════════════════════════════════════════════════════
// STUDY ROOM
// ═══════════════════════════════════════════════════════════
const _SR_SCHOLARS={
  'F0241': {name:'Al-Hallaj',              death:'d. 922 CE',  dod:922},
  'F0229': {name:'Al-Farabi',              death:'d. 950 CE',  dod:950},
  'F0222': {name:'Al-Biruni',              death:'d. 1048 CE', dod:1048},
  'F0316': {name:'Al-Qushayri',            death:'d. 1072 CE', dod:1072},
  'F0363': {name:'Ali al-Hujwiri',         death:'d. 1072 CE', dod:1072},
  'F0238': {name:'Al-Ghazali',             death:'d. 1111 CE', dod:1111},
  'F0031': {name:'Abdul Qadir al-Jilani',  death:'d. 1166 CE', dod:1166},
  'F0756': {name:'Ibn Tufayl',             death:'d. 1185 CE', dod:1185},
  'F0751': {name:'Ibn Rushd',              death:'d. 1198 CE', dod:1198},
  'F0580': {name:'Farid ud-Din Attar',     death:'d. 1221 CE', dod:1221},
  'F1432': {name:'Umar Ibn al-Farid',     death:'d. 1235 CE', dod:1235},
  'F0728': {name:'Ibn Arabi',              death:'d. 1240 CE', dod:1240},
  'F0755': {name:'Ibn Taymiyya',           death:'d. 1328 CE', dod:1328},
  'F0727': {name:'Ibn al-Qayyim',          death:'d. 1350 CE', dod:1350}
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
      const res=await fetch('data/islamic/studyroom/'+cat+'/'+slug+'-manifest.json?v='+Date.now());
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

    // Scholar card
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
    star.textContent=isFav?'\u2605':'\u2606';
    if(isFav) star.classList.add('active');
    star.onclick=function(e){
      e.stopPropagation();
      if(!APP.Favorites) return;
      requireTester('save', function(){
        var nowFav=APP.Favorites.toggle(s.name);
        star.textContent=nowFav?'\u2605':'\u2606';
        star.classList.toggle('active',nowFav);
        _updateFavFilterBtn();
        if(APP.filterFavsOnly) _buildStudySidebar();
      });
    };

    // Chevron
    var chevron=document.createElement('span');
    chevron.className='sr-card-chevron';
    chevron.textContent='\u25B8';

    card.appendChild(chevron);
    card.appendChild(nameDiv);
    card.appendChild(dateDiv);
    card.appendChild(star);

    // Book dropdown container (hidden by default)
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
  // If already open, close it
  if(_srOpenScholar===slug){
    dropdown.classList.remove('open');
    card.classList.remove('sel');
    chevron.textContent='\u25B8';
    _srOpenScholar=null;
    return;
  }
  // Close any previously open
  document.querySelectorAll('.sr-book-dropdown.open').forEach(function(d){d.classList.remove('open');});
  document.querySelectorAll('.sr-card.sel').forEach(function(c){c.classList.remove('sel');});
  document.querySelectorAll('.sr-card-chevron').forEach(function(ch){ch.textContent='\u25B8';});

  card.classList.add('sel');
  chevron.textContent='\u25BE';
  _srOpenScholar=slug;
  _srActive=slug;

  // Update heading
  var s=_SR_SCHOLARS[slug];
  document.getElementById('sr-heading').textContent=s?s.name:slug;

  // Fetch book data
  dropdown.innerHTML='<div class="sr-book-loading">Loading\u2026</div>';
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
      sb.textContent='\uD83D\uDCD6 Slides';
      sb.onclick=function(e){e.stopPropagation();_loadBookContent(slug,'slides',book);_highlightBtn(btns,sb);};
      btns.appendChild(sb);
    }
    if(book.types.summary){
      var ub=document.createElement('button');
      ub.className='sr-tab sr-book-tab';
      ub.setAttribute('data-type','summary');
      ub.textContent='\uD83D\uDCC4 Summary';
      ub.onclick=function(e){e.stopPropagation();_loadBookContent(slug,'summary',book);_highlightBtn(btns,ub);};
      btns.appendChild(ub);
    }
    if(book.types.video){
      var vb=document.createElement('button');
      vb.className='sr-tab sr-book-tab';
      vb.setAttribute('data-type','video');
      vb.textContent='\uD83C\uDFA5 Video';
      vb.onclick=function(e){e.stopPropagation();_loadBookContent(slug,'video',book);_highlightBtn(btns,vb);};
      btns.appendChild(vb);
    }

    bookEl.appendChild(btns);
    dropdown.appendChild(bookEl);
  });

  // Auto-load first book's first available type
  if(books.length){
    var first=books[0];
    var type=first.types.slides?'slides':first.types.summary?'summary':first.types.video?'video':null;
    if(type){
      _loadBookContent(slug,type,first);
      // Highlight the button
      var firstBtn=dropdown.querySelector('.sr-book-tab');
      if(firstBtn) firstBtn.classList.add('active');
    }
  }
}

function _highlightBtn(container, btn){
  // Clear all active tabs across entire sidebar
  document.querySelectorAll('.sr-book-tab.active').forEach(function(b){b.classList.remove('active');});
  btn.classList.add('active');
}

function _loadBookContent(slug, type, book){
  var body=document.getElementById('sr-body');
  body.querySelectorAll('iframe').forEach(function(f){f.src='about:blank';});
  body.innerHTML='';

  // Update heading to show book title
  var s=_SR_SCHOLARS[slug];
  document.getElementById('sr-heading').innerHTML=
    '<span style="opacity:0.5;font-size:14px">'+(s?s.name:'')+'</span><br>'+
    '<span>'+_esc(book.title)+'</span>';

  var entry=book.types[type];
  if(!entry) return;

  if(type==='slides'){
    var base='data/islamic/studyroom/slides/';
    var bust='?v='+Date.now();
    var wrap=document.createElement('div');
    wrap.style.cssText='position:relative;margin-bottom:32px';
    var f=document.createElement('iframe');
    f.setAttribute('allowfullscreen','');
    f.setAttribute('webkitallowfullscreen','');
    f.style.cssText='width:100%;height:600px;border:none;display:block;border-radius:5px';
    wrap.appendChild(f);
    var fsBtn=document.createElement('button');
    fsBtn.textContent='\u26F6';
    fsBtn.style.cssText='position:absolute;bottom:10px;right:10px;z-index:10;background:rgba(0,0,0,0.5);border:1px solid var(--border2);border-radius:4px;color:var(--accent);font-size:18px;padding:4px 8px;cursor:pointer';
    fsBtn.onmouseenter=function(){fsBtn.style.background='rgba(212,175,55,.15)';fsBtn.style.borderColor='var(--accent)';};
    fsBtn.onmouseleave=function(){fsBtn.style.background='rgba(0,0,0,0.5)';fsBtn.style.borderColor='var(--border2)';};
    fsBtn.onclick=function(){
      if(wrap.dataset.expanded==='1'){
        wrap.style.cssText='position:relative;margin-bottom:32px';
        f.style.width='100%';f.style.height='600px';
        fsBtn.textContent='\u26F6';wrap.dataset.expanded='0';
      }else{
        wrap.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#000;margin:0';
        f.style.width='100%';f.style.height='100%';
        fsBtn.textContent='\u2716';wrap.dataset.expanded='1';
      }
    };
    wrap.appendChild(fsBtn);
    document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&wrap.dataset.expanded==='1')fsBtn.click();});
    body.appendChild(wrap);
    f.src=base+encodeURIComponent(entry.file)+bust;
  }

  if(type==='summary'){
    var base='data/islamic/studyroom/summary/';
    var bust='?v='+Date.now();
    var f=document.createElement('iframe');
    f.style.cssText='width:100%;height:600px;border:none;display:block;border-radius:5px;margin-bottom:32px';
    body.appendChild(f);
    f.src=base+encodeURIComponent(entry.file)+bust;
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
  // Find and click the scholar card to open dropdown
  var card=panel.querySelector('.sr-card[data-slug="'+slug+'"]');
  if(card) card.click();
}

async function selectStudyTab(tab){
  // Legacy compatibility: if called with just a tab name, load first book of that type
  if(!_srActive) return;
  var books=await _fetchScholarBooks(_srActive);
  for(var i=0;i<books.length;i++){
    if(books[i].types[tab]){
      _loadBookContent(_srActive,tab,books[i]);
      return;
    }
  }
}

function openStudyRoom(slug){
  setView('studyroom');
  selectStudyScholar(slug);
}
const _SR_BADGE_NAMES=new Set(['Al-Hallaj','Al-Farabi','Al-Biruni','Ali al-Hujwiri','Ibn Arabi','Al-Qushayri','Al-Ghazali','Umar Ibn al-Farid','Ibn Rushd','Ibn Tufayl','Farid ud-Din Attar','Abdul Qadir al-Jilani','Ibn Taymiyya','Ibn al-Qayyim']);
const _SR_SLUG_MAP={'Al-Hallaj':'F0241','Al-Farabi':'F0229','Al-Biruni':'F0222','Ali al-Hujwiri':'F0363','Ibn Arabi':'F0728','Al-Qushayri':'F0316','Al-Ghazali':'F0238','Umar Ibn al-Farid':'F1432','Ibn Rushd':'F0751','Ibn Tufayl':'F0756','Farid ud-Din Attar':'F0580','Abdul Qadir al-Jilani':'F0031','Ibn Taymiyya':'F0755','Ibn al-Qayyim':'F0727'};

// Build sidebar immediately so it's ready when study view is shown
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ _buildStudySidebar(); });
} else {
  _buildStudySidebar();
}
