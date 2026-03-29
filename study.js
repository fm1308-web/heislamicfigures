// ═══════════════════════════════════════════════════════════
// STUDY ROOM
// ═══════════════════════════════════════════════════════════
const _SR_SCHOLARS={
  'F0241': {name:'Al-Hallaj',          death:'d. 922 CE'},
  'F0728': {name:'Ibn Arabi',           death:'d. 1240 CE'},
  'F0316': {name:'Al-Qushayri',         death:'d. 1072 CE'},
  'F0238': {name:'Al-Ghazali',          death:'d. 1111 CE'},
  'F1432': {name:'Umar Ibn al-Farid',  death:'d. 1235 CE'}
};
let _srActive=null;
let _srTab=null;

function selectStudyScholar(slug){
  _srActive=slug;
  document.querySelectorAll('.sr-card').forEach(c=>c.classList.toggle('sel',c.dataset.slug===slug));
  document.getElementById('sr-heading').textContent=_SR_SCHOLARS[slug].name;
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
const _SR_BADGE_NAMES=new Set(['Al-Hallaj','Ibn Arabi','Al-Qushayri','Al-Ghazali','Umar Ibn al-Farid']);
const _SR_SLUG_MAP={'Al-Hallaj':'F0241','Ibn Arabi':'F0728','Al-Qushayri':'F0316','Al-Ghazali':'F0238','Umar Ibn al-Farid':'F1432'};

