// ═══════════════════════════════════════════════════════════
// STUDY ROOM
// ═══════════════════════════════════════════════════════════
const _SR_SCHOLARS={
  'F0241': {name:'Al-Hallaj',              death:'d. 922 CE',  dod:922},
  'F0316': {name:'Al-Qushayri',            death:'d. 1072 CE', dod:1072},
  'F0238': {name:'Al-Ghazali',             death:'d. 1111 CE', dod:1111},
  'F0031': {name:'Abdul Qadir al-Jilani',  death:'d. 1166 CE', dod:1166},
  'F0756': {name:'Ibn Tufayl',             death:'d. 1185 CE', dod:1185},
  'F0751': {name:'Ibn Rushd',              death:'d. 1198 CE', dod:1198},
  'F1432': {name:'Umar Ibn al-Farid',     death:'d. 1235 CE', dod:1235},
  'F0728': {name:'Ibn Arabi',              death:'d. 1240 CE', dod:1240},
  'F0755': {name:'Ibn Taymiyya',           death:'d. 1328 CE', dod:1328}
};
let _srActive=null;
let _srTab=null;

function _buildStudySidebar(){
  const panel=document.getElementById('sr-left');
  if(!panel) return;
  panel.innerHTML='';
  const sorted=Object.keys(_SR_SCHOLARS).sort((a,b)=>_SR_SCHOLARS[a].dod-_SR_SCHOLARS[b].dod);
  const showFavsOnly=APP.filterFavsOnly&&APP.Favorites;
  sorted.forEach(slug=>{
    const s=_SR_SCHOLARS[slug];
    if(showFavsOnly&&!APP.Favorites.has(s.name)) return;
    const card=document.createElement('div');
    card.className='sr-card'+(slug===_srActive?' sel':'');
    card.dataset.slug=slug;
    card.onclick=function(){selectStudyScholar(slug);};
    const nameDiv=document.createElement('div');
    nameDiv.className='sr-card-name';
    nameDiv.textContent=s.name;
    const dateDiv=document.createElement('div');
    dateDiv.className='sr-card-date';
    dateDiv.textContent=s.death;
    const star=document.createElement('span');
    star.className='sr-card-fav';
    const isFav=APP.Favorites&&APP.Favorites.has(s.name);
    star.textContent=isFav?'\u2605':'\u2606';
    if(isFav) star.classList.add('active');
    star.onclick=function(e){
      e.stopPropagation();
      if(!APP.Favorites) return;
      const nowFav=APP.Favorites.toggle(s.name);
      star.textContent=nowFav?'\u2605':'\u2606';
      star.classList.toggle('active',nowFav);
      _updateFavFilterBtn();
      if(APP.filterFavsOnly) _buildStudySidebar();
    };
    card.appendChild(nameDiv);
    card.appendChild(dateDiv);
    card.appendChild(star);
    panel.appendChild(card);
  });
}

function selectStudyScholar(slug){
  _srActive=slug;
  // Ensure sidebar is populated
  const panel=document.getElementById('sr-left');
  if(panel&&!panel.children.length) _buildStudySidebar();
  document.querySelectorAll('.sr-card').forEach(c=>c.classList.toggle('sel',c.dataset.slug===slug));
  const s=_SR_SCHOLARS[slug];
  document.getElementById('sr-heading').textContent=s?s.name:slug;
  _srTab=null;
  const body=document.getElementById('sr-body');
  body.querySelectorAll('iframe').forEach(f=>{f.src='about:blank'});
  body.innerHTML='';
  selectStudyTab('slides');
}

async function selectStudyTab(tab){
  _srTab=tab;
  document.querySelectorAll('.sr-tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===tab));
  const slug=_srActive;
  if(!slug) return;
  const body=document.getElementById('sr-body');
  body.innerHTML='';
  const placeholder='<em style="color:rgba(200,168,74,.7)">Content coming soon \u2014 drop files to activate.</em>';

  if(tab==='slides'){
    try{
      const res=await fetch('data/islamic/studyroom/slides/'+slug+'-manifest.json?v='+Date.now());
      if(res.ok){
        const books=await res.json();
        if(books.length){
          const base='data/islamic/studyroom/slides/';
          const bust='?v='+Date.now();
          books.forEach(function(b,i){
            if(i>0){const hr=document.createElement('div');hr.style.cssText='border-top:1px solid rgba(201,168,76,.25);margin:24px 0';body.appendChild(hr);}
            const t=document.createElement('div');
            t.style.cssText="font-family:'Cinzel',serif;font-size:1em;font-weight:700;color:#c9a84c;letter-spacing:.06em;margin-bottom:10px";
            t.textContent=b.title;
            body.appendChild(t);
            const wrap=document.createElement('div');
            wrap.style.cssText='position:relative;margin-bottom:32px';
            const f=document.createElement('iframe');
            f.setAttribute('allowfullscreen','');
            f.setAttribute('webkitallowfullscreen','');
            f.style.cssText='width:100%;height:600px;border:none;display:block;border-radius:5px';
            wrap.appendChild(f);
            const fsBtn=document.createElement('button');
            fsBtn.textContent='\u26F6';
            fsBtn.style.cssText='position:absolute;bottom:10px;right:10px;z-index:10;background:rgba(0,0,0,0.5);border:1px solid var(--border2);border-radius:4px;color:var(--accent);font-size:18px;padding:4px 8px;cursor:pointer';
            fsBtn.onmouseenter=function(){fsBtn.style.background='rgba(232,200,120,0.15)';fsBtn.style.borderColor='var(--accent)'};
            fsBtn.onmouseleave=function(){fsBtn.style.background='rgba(0,0,0,0.5)';fsBtn.style.borderColor='var(--border2)'};
            fsBtn.onclick=function(){
              if(wrap.dataset.expanded==='1'){
                wrap.style.cssText='position:relative;margin-bottom:32px';
                f.style.width='100%';f.style.height='600px';
                fsBtn.textContent='\u26F6';
                wrap.dataset.expanded='0';
              }else{
                wrap.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#000;margin:0';
                f.style.width='100%';f.style.height='100%';
                fsBtn.textContent='\u2716';
                wrap.dataset.expanded='1';
              }
            };
            wrap.appendChild(fsBtn);
            document.addEventListener('keydown',function(ev){if(ev.key==='Escape'&&wrap.dataset.expanded==='1')fsBtn.click();});
            body.appendChild(wrap);
            f.src=base+encodeURIComponent(b.file)+bust;
          });
          return;
        }
      }
    }catch(e){}
    body.innerHTML=placeholder;
    return;
  }

  if(tab==='summary'){
    try{
      const res=await fetch('data/islamic/studyroom/summary/'+slug+'-manifest.json?v='+Date.now());
      if(res.ok){
        const items=await res.json();
        if(items.length){
          const base='data/islamic/studyroom/summary/';
          const bust='?v='+Date.now();
          items.forEach(function(b,i){
            if(i>0){const hr=document.createElement('div');hr.style.cssText='border-top:1px solid rgba(201,168,76,.25);margin:24px 0';body.appendChild(hr);}
            const t=document.createElement('div');
            t.style.cssText="font-family:'Cinzel',serif;font-size:1em;font-weight:700;color:#c9a84c;letter-spacing:.06em;margin-bottom:10px";
            t.textContent=b.title;
            body.appendChild(t);
            const f=document.createElement('iframe');
            f.style.cssText='width:100%;height:600px;border:none;display:block;border-radius:5px;margin-bottom:32px';
            body.appendChild(f);
            f.src=base+encodeURIComponent(b.file)+bust;
          });
          return;
        }
      }
    }catch(e){}
    body.innerHTML=placeholder;
    return;
  }

  if(tab==='quotes'){
    const p=PEOPLE.find(function(x){return x.slug===slug});
    if(p){
      await _ensureDetails(p);
      if(p.quotes&&p.quotes.length){
        body.innerHTML=p.quotes.map(function(q){
          return '<blockquote style="margin:0 0 14px 0;padding:10px 14px;'+
            'border-left:3px solid var(--accent);'+
            'background:rgba(212,168,74,0.05);'+
            "font-family:'Source Sans 3',sans-serif;font-size:13px;"+
            'font-style:normal;color:var(--text);line-height:1.65;">'+
            esc(q)+
            '<div style="font-size:10px;font-style:italic;color:rgba(200,168,74,.45);margin-top:6px">Source: to be linked \u2014 coming soon</div>'+
            '</blockquote>';
        }).join('');
        return;
      }
    }
    body.innerHTML=placeholder;
    return;
  }

  if(tab==='quiz'){
    body.innerHTML='<em style="color:rgba(200,168,74,.7)">Quiz coming soon</em>';
    return;
  }

  body.innerHTML=placeholder;
}

function openStudyRoom(slug){
  setView('studyroom');
  selectStudyScholar(slug);
}
const _SR_BADGE_NAMES=new Set(['Al-Hallaj','Ibn Arabi','Al-Qushayri','Al-Ghazali','Umar Ibn al-Farid','Ibn Rushd','Ibn Tufayl','Abdul Qadir al-Jilani','Ibn Taymiyya']);
const _SR_SLUG_MAP={'Al-Hallaj':'F0241','Ibn Arabi':'F0728','Al-Qushayri':'F0316','Al-Ghazali':'F0238','Umar Ibn al-Farid':'F1432','Ibn Rushd':'F0751','Ibn Tufayl':'F0756','Abdul Qadir al-Jilani':'F0031','Ibn Taymiyya':'F0755'};

// Build sidebar immediately so it's ready when study view is shown
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){ _buildStudySidebar(); });
} else {
  _buildStudySidebar();
}
