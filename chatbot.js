/* ══════════════════════════════════════════════════════════════
   ASK ME — Floating Chat Module
   ══════════════════════════════════════════════════════════════ */
(function(){
const _SCHOLAR_API_KEY = 'YOUR_KEY_HERE';
const _SCHOLAR_MODEL  = 'claude-sonnet-4-20250514';
const _FREE_LIMIT     = 5;
const _DATASET_SUMMARY = 'This dataset contains 1,712 Islamic historical figures from 550 CE to 2025 CE, including prophets, companions, scholars, sufis, rulers, philosophers, poets, and scientists.';
const _SYSTEM_PROMPT = 'You are a scholarly assistant for Islamic history and intellectual tradition. You have access to a curated dataset of 1,712 Islamic historical figures spanning 14 centuries. Answer questions using the provided figure data. Be accurate, cite specific figures by name, and mention their dates. If the data does not contain enough information to fully answer, say so honestly. Keep responses concise (2-3 paragraphs max). Never make up quotes or facts not in the provided data.';

/* ── Inject CSS ── */
const _chatCSS = document.createElement('style');
_chatCSS.textContent = `
/* Chat FAB */
#scholarFab{
  position:fixed;bottom:24px;right:24px;z-index:2500;
  width:56px;height:56px;border-radius:50%;border:2px solid var(--border2);
  background:linear-gradient(135deg,#c89040,#D4AF37);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 20px rgba(200,144,64,.45);transition:transform .2s,box-shadow .2s;
}
#scholarFab:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(200,144,64,.6);}
#scholarFab svg{width:28px;height:28px;fill:#0F1724;}
#scholarFab.pulse{animation:scholarPulse 1.2s ease-in-out 3;}
@keyframes scholarPulse{
  0%,100%{box-shadow:0 4px 20px rgba(200,144,64,.45)}
  50%{box-shadow:0 4px 32px rgba(200,144,64,.85)}
}

/* Chat Panel */
#scholarPanel{
  position:fixed;bottom:24px;right:24px;z-index:2600;
  width:380px;height:500px;
  background:var(--bg);border:1px solid var(--border2);border-radius:14px;
  display:none;flex-direction:column;overflow:hidden;
  box-shadow:0 8px 40px rgba(0,0,0,.6);
  font-family:'Lato','Crimson Pro',Georgia,serif;
}
#scholarPanel.open{display:flex;}
@media(max-width:600px){
  #scholarPanel{width:100%;height:100%;bottom:0;right:0;border-radius:0;}
}

/* Header */
.sch-header{
  display:flex;align-items:center;padding:10px 14px;
  background:var(--surface2);border-bottom:1px solid var(--border);
  flex-shrink:0;
}
.sch-header h3{
  font-family:'Cinzel',serif;font-size:14px;font-weight:700;
  color:var(--gold);letter-spacing:.08em;flex:1;margin:0;
}
.sch-hbtn{
  background:none;border:none;color:var(--text2);cursor:pointer;
  padding:4px 6px;font-size:16px;line-height:1;border-radius:4px;
  transition:color .2s,background .2s;
}
.sch-hbtn:hover{color:var(--gold);background:rgba(200,144,64,.12);}

/* Messages */
.sch-messages{
  flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;
}
.sch-msg{
  max-width:85%;padding:10px 14px;border-radius:12px;
  font-size:13.5px;line-height:1.65;word-wrap:break-word;
}
.sch-msg.user{
  align-self:flex-end;background:#c89040;color:#0F1724;
  border-bottom-right-radius:4px;font-weight:400;
}
.sch-msg.ai{
  align-self:flex-start;background:var(--surface2);color:var(--text);
  border-bottom-left-radius:4px;border:1px solid var(--border);
}
.sch-msg.ai a.sch-figlink{
  color:#D4AF37;cursor:pointer;text-decoration:underline;
  text-decoration-style:dotted;text-underline-offset:2px;
}
.sch-msg.ai a.sch-figlink:hover{color:var(--gold);text-decoration-style:solid;}
.sch-msg.error{
  align-self:center;background:rgba(200,60,60,.15);color:#e88;
  border:1px solid rgba(200,60,60,.25);font-size:12.5px;text-align:center;
}
.sch-typing{
  align-self:flex-start;padding:10px 18px;
  background:var(--surface2);border-radius:12px;border:1px solid var(--border);
  font-size:18px;letter-spacing:3px;color:var(--gold);
}
.sch-typing span{animation:typeDot 1.4s infinite;opacity:.3;}
.sch-typing span:nth-child(2){animation-delay:.2s;}
.sch-typing span:nth-child(3){animation-delay:.4s;}
@keyframes typeDot{0%,80%,100%{opacity:.3}40%{opacity:1}}

/* Input area */
.sch-inputarea{
  display:flex;padding:10px 12px;gap:8px;
  background:var(--surface);border-top:1px solid var(--border);flex-shrink:0;
}
.sch-inputarea input{
  flex:1;padding:8px 12px;border-radius:8px;
  border:1px solid var(--border);background:var(--surface2);
  color:var(--text);font-size:13.5px;font-family:inherit;outline:none;
  transition:border-color .2s;
}
.sch-inputarea input:focus{border-color:var(--accent);}
.sch-inputarea input::placeholder{color:var(--muted);}
#scholarSendBtn{
  padding:8px 14px;border-radius:8px;border:none;
  background:#c89040;color:#0F1724;font-weight:700;font-size:13px;
  cursor:pointer;font-family:inherit;transition:background .2s;
}
#scholarSendBtn:hover{background:var(--gold);}
#scholarSendBtn:disabled{opacity:.4;cursor:not-allowed;}

/* Footer */
.sch-footer{
  padding:4px 14px 8px;text-align:center;font-size:11px;
  color:var(--muted);flex-shrink:0;
}

/* Settings panel */
.sch-settings{
  display:none;padding:14px;background:var(--surface);
  border-top:1px solid var(--border);flex-direction:column;gap:8px;
  flex-shrink:0;
}
.sch-settings.open{display:flex;}
.sch-settings label{font-size:12px;color:var(--text2);font-family:'Cinzel',serif;letter-spacing:.05em;}
.sch-settings input{
  padding:7px 10px;border-radius:6px;border:1px solid var(--border);
  background:var(--surface2);color:var(--text);font-size:13px;font-family:inherit;
  outline:none;width:100%;
}
.sch-settings input:focus{border-color:var(--accent);}
.sch-settings .sch-sbtn-row{display:flex;gap:8px;align-items:center;}
.sch-settings button{
  padding:6px 14px;border-radius:6px;border:1px solid var(--border);
  background:var(--surface2);color:var(--text);font-size:12px;
  cursor:pointer;font-family:inherit;transition:background .2s,border-color .2s;
}
.sch-settings button:hover{border-color:var(--accent);background:rgba(200,144,64,.1);}
.sch-settings .sch-hint{font-size:11px;color:var(--muted);}
`;
document.head.appendChild(_chatCSS);

/* ── Build DOM ── */
// FAB
const fab = document.createElement('div');
fab.id = 'scholarFab';
fab.className = 'pulse';
fab.title = 'Ask Me \u2014 AI Scholar Assistant';
fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.34 1.2 4.44 3.11 5.9L4 20l4.35-2.17C9.5 18.27 10.72 18.5 12 18.5c5.52 0 10-3.58 10-8S17.52 2 12 2zm0 14.5c-1.1 0-2.15-.2-3.11-.56l-.62-.25-2.72 1.36.74-2.73-.46-.38C4.3 12.73 3.5 11.43 3.5 10c0-3.58 3.81-6.5 8.5-6.5s8.5 2.92 8.5 6.5-3.81 6.5-8.5 6.5z"/><path d="M7.5 9.5a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm4.5 0a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm4.5 0a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5z"/></svg>';
document.body.appendChild(fab);
setTimeout(()=>fab.classList.remove('pulse'),3600);

// Panel
const panel = document.createElement('div');
panel.id = 'scholarPanel';
panel.innerHTML = `
  <div class="sch-header">
    <h3>ASK ME</h3>
    <button class="sch-hbtn" id="schClearBtn" title="Clear chat">&#x1D5EB;</button>
    <button class="sch-hbtn" id="schSettingsBtn" title="Settings">⚙</button>
    <button class="sch-hbtn" id="schCloseBtn" title="Close">✕</button>
  </div>
  <div class="sch-messages" id="schMessages"></div>
  <div class="sch-settings" id="schSettings">
    <label>YOUR CLAUDE API KEY</label>
    <input type="password" id="schApiKeyInput" placeholder="sk-ant-..." autocomplete="off">
    <div class="sch-sbtn-row">
      <button id="schKeySave">Save</button>
      <button id="schKeyClear">Clear</button>
    </div>
    <div class="sch-hint">Get a key at console.anthropic.com</div>
  </div>
  <div class="sch-inputarea">
    <input type="text" id="schInput" placeholder="Ask about any Islamic figure..." autocomplete="off">
    <button id="scholarSendBtn">Send</button>
  </div>
  <div class="sch-footer" id="schFooter"></div>
`;
document.body.appendChild(panel);

/* ── References ── */
const msgBox    = document.getElementById('schMessages');
const input     = document.getElementById('schInput');
const sendBtn   = document.getElementById('scholarSendBtn');
const footer    = document.getElementById('schFooter');
const settingsP = document.getElementById('schSettings');
const keyInput  = document.getElementById('schApiKeyInput');

/* ── Open / Close ── */
fab.addEventListener('click',()=>{
  panel.classList.add('open'); fab.style.display='none'; input.focus();
  // Show onboarding if no messages yet and no working key
  if(msgBox.children.length===0 && _activeKey()==='YOUR_KEY_HERE' && !_hasCustomKey()){
    const w=document.createElement('div');
    w.className='sch-msg ai';
    w.innerHTML='Welcome to <strong>Ask Me</strong> \u2014 your AI-powered Islamic history assistant.<br><br>'+
      'To start exploring 1,712 Islamic scholars through conversation, you need a Claude API key.<br><br>'+
      '1. Visit <a href="https://console.anthropic.com" target="_blank" rel="noopener" style="color:#D4AF37;">console.anthropic.com</a><br>'+
      '2. Create an account and add credit ($5 minimum)<br>'+
      '3. Generate an API key<br>'+
      '4. Tap the \u2699 icon above and paste your key<br><br>'+
      'Then ask me anything \u2014 \u201CWho were Al-Ghazali\u2019s teachers?\u201D or \u201CCompare Ibn Arabi and Al-Hallaj\u201D';
    msgBox.appendChild(w);
  }
});
document.getElementById('schCloseBtn').addEventListener('click',()=>{ panel.classList.remove('open'); fab.style.display='flex'; });
document.getElementById('schClearBtn').addEventListener('click',()=>{ msgBox.innerHTML=''; });
document.getElementById('schSettingsBtn').addEventListener('click',()=>{
  settingsP.classList.toggle('open');
  if(settingsP.classList.contains('open')){
    const stored=localStorage.getItem('islamic_app_api_key');
    keyInput.value=stored||'';
  }
});

/* ── API Key management ── */
document.getElementById('schKeySave').addEventListener('click',()=>{
  const v=keyInput.value.trim();
  if(v){ localStorage.setItem('islamic_app_api_key',v); settingsP.classList.remove('open'); _updateFooter(); }
});
document.getElementById('schKeyClear').addEventListener('click',()=>{
  localStorage.removeItem('islamic_app_api_key'); keyInput.value=''; _updateFooter();
});

/* ── Freemium counter ── */
function _getUsage(){
  try{
    const raw=localStorage.getItem('islamic_app_chat_count');
    if(!raw) return {date:'',count:0};
    return JSON.parse(raw);
  }catch(e){ return {date:'',count:0}; }
}
function _today(){ return new Date().toISOString().slice(0,10); }
function _getCount(){
  const u=_getUsage();
  return u.date===_today()?u.count:0;
}
function _incCount(){
  const d=_today(), u=_getUsage();
  const c=(u.date===d?u.count:0)+1;
  localStorage.setItem('islamic_app_chat_count',JSON.stringify({date:d,count:c}));
}
function _hasCustomKey(){ return !!localStorage.getItem('islamic_app_api_key'); }
function _activeKey(){ return localStorage.getItem('islamic_app_api_key')||_SCHOLAR_API_KEY; }
function _canSend(){
  if(_hasCustomKey()) return true;
  return _getCount()<_FREE_LIMIT;
}
function _updateFooter(){
  if(_hasCustomKey()){ footer.textContent='Using your API key'; }
  else{ const rem=Math.max(0,_FREE_LIMIT-_getCount()); footer.textContent=rem+' of '+_FREE_LIMIT+' free questions remaining'; }
  sendBtn.disabled=!_canSend();
}
_updateFooter();

/* ── Context search ── */
function _searchFigures(query){
  const q=query.toLowerCase();
  const scored=[];
  for(const p of PEOPLE){
    let s=0;
    const famous=(p.famous||'').toLowerCase(), full=(p.full||'').toLowerCase();
    const trad=(p.tradition||'').toLowerCase(), type=(p.type||'').toLowerCase();
    const tags=((p.tags||[]).join(' ')).toLowerCase();
    if(famous&&q.includes(famous)) s+=10;
    else if(famous&&famous.includes(q)) s+=8;
    if(full&&q.includes(full)) s+=6;
    // check individual words from the query
    const words=q.split(/\s+/).filter(w=>w.length>2);
    for(const w of words){
      if(famous.includes(w)) s+=3;
      if(full.includes(w)) s+=2;
      if(trad.includes(w)) s+=2;
      if(type.includes(w)) s+=2;
      if(tags.includes(w)) s+=1;
    }
    if(s>0) scored.push({p,s});
  }
  scored.sort((a,b)=>b.s-a.s);
  return scored.slice(0,5).map(x=>x.p);
}

async function _buildContext(query){
  const matches=_searchFigures(query);
  let ctx=_DATASET_SUMMARY+'\n\n';
  if(matches.length===0){
    ctx+='No specific figures matched the query. Answer based on your general knowledge of the dataset described above.\n';
    return ctx;
  }
  ctx+='RELEVANT FIGURES FROM THE DATASET:\n\n';
  for(const p of matches){
    await _ensureDetails(p);
    ctx+='--- '+p.famous+' ---\n';
    ctx+='Slug: '+(p.slug||'')+'\n';
    ctx+='Famous name: '+(p.famous||'')+'\n';
    ctx+='Full name: '+(p.full||'')+'\n';
    ctx+='Type: '+(p.type||'')+'\n';
    ctx+='Tradition: '+(p.tradition||'')+'\n';
    ctx+='Born: '+(p.dob!=null?p.dob:'unknown')+'\n';
    ctx+='Died: '+(p.dod!=null?p.dod:'unknown')+'\n';
    ctx+='City: '+(p.city||'unknown')+'\n';
    ctx+='Teachers: '+((p.teachers||[]).join(', ')||'unknown')+'\n';
    ctx+='School/Bio: '+(p.school||'N/A')+'\n';
    if(p.books&&p.books.length) ctx+='Books: '+p.books.map(b=>b.title||(typeof b==='string'?b:'')).filter(Boolean).join(', ')+'\n';
    if(p.quotes&&p.quotes.length) ctx+='Quotes: '+p.quotes.slice(0,3).map(q=>'"'+q+'"').join(' | ')+'\n';
    ctx+='\n';
  }
  return ctx;
}

/* ── Add messages to DOM ── */
function _addMsg(text,cls){
  const div=document.createElement('div');
  div.className='sch-msg '+cls;
  div.textContent=text;
  msgBox.appendChild(div);
  msgBox.scrollTop=msgBox.scrollHeight;
  return div;
}
function _addAIMsg(text){
  const div=document.createElement('div');
  div.className='sch-msg ai';
  // Linkify figure names
  let html=text.replace(/\n/g,'<br>');
  for(const p of PEOPLE){
    if(!p.famous||p.famous.length<3) continue;
    const escaped=p.famous.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
    const re=new RegExp('\\b'+escaped+'\\b','g');
    html=html.replace(re,'<a class="sch-figlink" data-famous="'+p.famous.replace(/"/g,'&quot;')+'">'+p.famous+'</a>');
  }
  div.innerHTML=html;
  // Attach click handlers
  div.querySelectorAll('.sch-figlink').forEach(a=>{
    a.addEventListener('click',()=>{
      const name=a.getAttribute('data-famous');
      if(typeof focusPersonInTimeline==='function') focusPersonInTimeline(name);
      panel.classList.remove('open'); fab.style.display='flex';
    });
  });
  msgBox.appendChild(div);
  msgBox.scrollTop=msgBox.scrollHeight;
  return div;
}
function _showTyping(){
  const div=document.createElement('div');
  div.className='sch-typing';
  div.innerHTML='<span>.</span><span>.</span><span>.</span>';
  msgBox.appendChild(div);
  msgBox.scrollTop=msgBox.scrollHeight;
  return div;
}

/* ── API call ── */
async function _askClaude(question){
  if(!_canSend()){
    _addMsg('Daily free limit reached. Enter your own Claude API key in settings to continue.','error');
    return;
  }
  _addMsg(question,'user');
  input.value=''; sendBtn.disabled=true;
  const typing=_showTyping();

  try{
    const ctx=await _buildContext(question);
    const userContent=ctx+'\n\nUSER QUESTION: '+question;
    const key=_activeKey();

    const reqBody={
      model:_SCHOLAR_MODEL,
      max_tokens:1000,
      system:_SYSTEM_PROMPT,
      messages:[{role:'user',content:userContent}]
    };
    const reqHeaders={
      'Content-Type':'application/json',
      'x-api-key':key,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    };
    console.log('[ScholarAI] Request headers (key hidden):',Object.assign({},reqHeaders,{'x-api-key':'sk-ant-***'}));
    console.log('[ScholarAI] Request body:',JSON.parse(JSON.stringify(reqBody)));

    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:reqHeaders,
      body:JSON.stringify(reqBody)
    });

    typing.remove();

    if(!resp.ok){
      const errBody=await resp.text().catch(()=>'');
      console.error('[ScholarAI] API error '+resp.status+':',errBody);
      if(resp.status===401) _addMsg('Invalid API key. Please check your key in settings.','error');
      else if(resp.status===429) _addMsg('Rate limit exceeded. Please wait a moment and try again.','error');
      else _addMsg('Something went wrong ('+resp.status+'). Please try again later.','error');
      sendBtn.disabled=!_canSend();
      return;
    }

    const data=await resp.json();
    const answer=(data.content&&data.content[0]&&data.content[0].text)||'No response received.';
    if(!_hasCustomKey()) _incCount();
    _addAIMsg(answer);
  }catch(e){
    typing.remove();
    _addMsg('Network error. Please check your connection and try again.','error');
  }
  _updateFooter();
  sendBtn.disabled=!_canSend();
}

/* ── Event listeners ── */
sendBtn.addEventListener('click',()=>{ const q=input.value.trim(); if(q) _askClaude(q); });
input.addEventListener('keydown',(e)=>{ if(e.key==='Enter'&&!sendBtn.disabled){ const q=input.value.trim(); if(q) _askClaude(q); }});

})();
/* ══════════════ END ASK ME ══════════════ */
