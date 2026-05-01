/* tour.js — First-time-user onboarding (Welcome modal, macro tour).
   Layer 1 of the onboarding system. Per-view HOW THIS WORKS handles the
   micro tour (already wired per view; not in scope here). */
(function(){
  'use strict';

  var STORAGE_KEY = 'gold-ark-tour-seen';

  // ── Sections (copy authored inline; keep each ≤ ~120 words) ──
  var SECTIONS = [
    {
      id: 'welcome',
      title: 'Welcome',
      body:
        '<p><strong>Gold Ark</strong> is a free interactive map of 1,400+ years of Islamic history. ' +
        '1,962 figures, 2,211 events, 1,098 books, 21 tafsir works, 16 hadith collections, ' +
        '492 Quran translations.</p>' +
        '<p>No ads. No tracking. No login required to browse — sign up free to save bookmarks ' +
        'and reading progress. Take a minute to look around. Explore at your pace.</p>' +
        '<p style="color:#9aa3b2;font-size:13px;margin-top:18px">Look for <strong>HOW THIS WORKS</strong> ' +
        'in any view’s filter bar for view-specific details.</p>'
    },
    {
      id: 'tabs',
      title: 'Top tabs',
      body:
        '<p>Across the top: <strong>14 views</strong>, each a different way to explore. Click any ' +
        'tab to switch. Click <strong>◀ ▶</strong> at the row edges to scroll through them.</p>' +
        '<p>Each tab has a sober accent colour so you can recognise where you are. The active tab ' +
        'sits centred. Inactive tabs dim — click any to bring it forward.</p>'
    },
    {
      id: 'zoneb',
      title: 'Filter bar',
      body:
        '<p>Below the tabs: the <strong>filter bar</strong>. Every view has its own filters — ' +
        'pills, sliders, search boxes, dropdowns. Use them to narrow what you see.</p>' +
        '<p>The <strong>HOW THIS WORKS</strong> button on the right tells you what each filter does ' +
        'in this view.</p>'
    },
    {
      id: 'zoned',
      title: 'Bottom bar',
      body:
        '<p>The bottom bar drives <strong>animations</strong>: play, pause, stop, speed (0.5× / ' +
        '1× / 2× / 4×), and back/forward navigation. Available on views that animate ' +
        '(MAP, FOLLOW, EVENTS, TIMELINE, etc.).</p>' +
        '<p>Press play to watch history sweep across the canvas; pause anywhere to dwell.</p>'
    },
    {
      id: 'views',
      title: 'The 14 views',
      body:
        '<p><strong>TIMELINE</strong> — figures by century.<br>' +
        '<strong>SILSILA</strong> — teacher-student chains.<br>' +
        '<strong>FOLLOW</strong> — a figure’s life journey across the map.<br>' +
        '<strong>STUDY</strong> — slide decks and curated videos.<br>' +
        '<strong>BOOKS</strong> — 1,098 books with free reads.<br>' +
        '<strong>ERAS</strong> — visual overview of historical periods.<br>' +
        '<strong>EVENTS</strong> — 2,211 enriched events.<br>' +
        '<strong>THINK</strong> — concept map across 14 centuries.<br>' +
        '<strong>MAP</strong> — places + animate through years.<br>' +
        '<strong>TALK</strong> — AI conversation with scholars.<br>' +
        '<strong>ONE</strong> — deep figure profile.<br>' +
        '<strong>MONASTIC</strong> — hadith corpus.<br>' +
        '<strong>EXPLAIN</strong> — tafsir library.<br>' +
        '<strong>START</strong> — the Quran reader.</p>'
    },
    {
      id: 'start',
      title: 'START — the Quran',
      body:
        '<p>The Quran reader. 114 surahs, with side-by-side translations in many languages, ' +
        'scholastic word-by-word morphology, and access to 21 tafsir works.</p>' +
        '<p>MY VIEW lets you pick translations, tafsirs, morphology language, and cross-reference ' +
        'chips for the verses you read.</p>' +
        '<div style="margin-top:18px;padding:14px 16px;border:1px solid rgba(212,175,55,0.3);border-radius:6px;background:rgba(212,175,55,0.04)">' +
          '<div style="font-family:\'Cinzel\',serif;font-size:12px;letter-spacing:.1em;color:#D4AF37;margin-bottom:10px">CONCEPT MATCH SCORE (1–5)</div>' +
          '<div style="font-size:13px;color:#A0AEC0;margin-bottom:10px">Each concept tag on a Quran verse carries a 1–5 strength score. Brighter gold means stronger match.</div>' +
          '<div style="display:flex;flex-direction:column;gap:5px;font-size:13px;line-height:1.4">' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:rgba(212,175,55,0.45);font-weight:600">1</span><span style="color:#cfd2d6">Single shared word — weakest.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:rgba(212,175,55,0.7);font-weight:600">2</span><span style="color:#cfd2d6">Two-token overlap.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:#d4af37;font-weight:600">3</span><span style="color:#cfd2d6">Solid phrase match — most common.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:#e8c547;font-weight:700">4</span><span style="color:#cfd2d6">Strong multi-word match.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:#f5d24a;font-weight:700">5</span><span style="color:#cfd2d6">Exact phrase — strongest, rare.</span></div>' +
          '</div>' +
        '</div>'
    },
    {
      id: 'one',
      title: 'ONE — figure profile',
      body:
        '<p>Click any figure name anywhere in Gold Ark and you land in <strong>ONE</strong>: ' +
        'their full profile. Biography, era, century, places lived, books written, teachers, ' +
        'students, related events, hadith narrated.</p>' +
        '<p>1,962 profiles. The deepest single-person view in the app.</p>',
      tryView: 'ONE'
    },
    {
      id: 'map',
      title: 'MAP — places',
      body:
        '<p>Where figures lived and worked. Filter by year via the <strong>WHO WAS ALIVE IN</strong> ' +
        'slider; press <strong>ANIMATE</strong> to sweep through history at 0.5×–4× speed.</p>' +
        '<p>Empires can be toggled on for political context. Click a name chip for the figure’s ' +
        'profile.</p>',
      tryView: 'MAP'
    },
    {
      id: 'events',
      title: 'EVENTS',
      body:
        '<p>2,211 historical events with primary-source citations, figure tags, and Quranic links ' +
        'where applicable. Filter by category and century. Animate for chronological playback.</p>',
      tryView: 'EVENTS'
    },
    {
      id: 'monastic',
      title: 'MONASTIC — hadith',
      body:
        '<p>34,172 hadiths from the six canonical Sunni collections (Bukhari, Muslim, Abu Daʼud, ' +
        'al-Tirmidhi, an-Nasaʼi, Ibn Majah). Filter by collection, narrator, theme, period.</p>' +
        '<p>Cross-references link each hadith to verses, figures, events, and concepts.</p>' +
        '<div style="margin-top:18px;padding:14px 16px;border:1px solid rgba(212,175,55,0.3);border-radius:6px;background:rgba(212,175,55,0.04)">' +
          '<div style="font-family:\'Cinzel\',serif;font-size:12px;letter-spacing:.1em;color:#D4AF37;margin-bottom:10px">CONCEPT MATCH SCORE (1–5)</div>' +
          '<div style="font-size:13px;color:#A0AEC0;margin-bottom:10px">Each concept tag on a Quran verse carries a 1–5 strength score. Brighter gold means stronger match.</div>' +
          '<div style="display:flex;flex-direction:column;gap:5px;font-size:13px;line-height:1.4">' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:rgba(212,175,55,0.45);font-weight:600">1</span><span style="color:#cfd2d6">Single shared word — weakest.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:rgba(212,175,55,0.7);font-weight:600">2</span><span style="color:#cfd2d6">Two-token overlap.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:#d4af37;font-weight:600">3</span><span style="color:#cfd2d6">Solid phrase match — most common.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:#e8c547;font-weight:700">4</span><span style="color:#cfd2d6">Strong multi-word match.</span></div>' +
            '<div style="display:flex;align-items:center;gap:10px"><span style="display:inline-block;min-width:22px;text-align:center;color:#f5d24a;font-weight:700">5</span><span style="color:#cfd2d6">Exact phrase — strongest, rare.</span></div>' +
          '</div>' +
        '</div>'
    },
    {
      id: 'explain',
      title: 'EXPLAIN — tafsir',
      body:
        '<p>21 tafsir works across 29 editions in 6 languages. Browse by author, tradition, language, ' +
        'or surah. Click any work card to open the verse-by-verse reader.</p>',
      tryView: 'EXPLAIN'
    },
    {
      id: 'think',
      title: 'THINK — concepts',
      body:
        '<p>519 concepts mapped across 14 centuries. Trace how an idea (e.g. <em>tawhid</em>, ' +
        '<em>ijtihad</em>, <em>nafs</em>) develops through scholars, books, and traditions.</p>',
      tryView: 'THINK'
    },
    {
      id: 'bookmarks',
      title: 'Bookmarks & progress',
      body:
        '<p>Sign up free (Google or email) to save bookmarks and resume reading where you left ' +
        'off. Your data stays on your account; no ads, no tracking. You can sign out anytime.</p>'
    },
    {
      id: 'subscription',
      title: 'Subscription',
      body:
        '<p>Most of Gold Ark is free forever. A premium tier ($100/yr AUD) unlocks share, ' +
        'snapshot, feedback, and contributor tools.</p>' +
        '<p>Launch trial code available on the Discourse forum.</p>'
    },
    {
      id: 'sources',
      title: 'Sources & AI',
      body:
        '<p>Quran text from <strong>tanzil.net</strong>. Hadith from hadithapi.com. Tafsir from the ' +
        'Tanzil + Quran.com archives. Geography from natural-earth + Wikipedia. Figure data ' +
        'enriched from Wikidata.</p>' +
        '<p>Some event descriptions, biographical summaries, and cross-references are <strong>' +
        'AI-generated</strong>. We mark those with a small <em>AI</em> badge. Verify independently ' +
        'before citing.</p>'
    },
    {
      id: 'final',
      title: 'Start exploring',
      body:
        '<p>That’s the macro tour. Look for <strong>HOW THIS WORKS</strong> in any view’s ' +
        'filter bar for view-specific details.</p>' +
        '<p>Community: <a href="https://goldark.discourse.group" target="_blank" rel="noopener" ' +
        'style="color:#c9a961">goldark.discourse.group</a>.<br>' +
        'Support: <a href="mailto:fm1308@gmail.com" style="color:#c9a961">fm1308@gmail.com</a>.</p>' +
        '<p style="margin-top:20px"><strong style="color:#c9a961">Take a deep breath. Click anywhere ' +
        'to start exploring.</strong></p>'
    }
  ];

  var _activeIdx = 0;
  var _root = null;
  var _escHandler = null;
  var _dontShow = false;

  function shouldAutoOpen(){
    try {
      return localStorage.getItem(STORAGE_KEY) !== '1';
    } catch(e){ return false; }
  }

  function markSeen(){
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch(e){}
    // Best-effort Firestore sync for signed-in users.
    try {
      if(window.GoldArkAuth && typeof window.GoldArkAuth.setUserField === 'function'){
        window.GoldArkAuth.setUserField('tourSeen', true);
      }
    } catch(e){}
  }

  function _esc(s){ return String(s == null ? '' : s).replace(/[&<>]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]; }); }

  function close(){
    if(!_root) return;
    if(_root.parentNode) _root.parentNode.removeChild(_root);
    _root = null;
    if(_escHandler){ document.removeEventListener('keydown', _escHandler); _escHandler = null; }
    if(_dontShow) markSeen();
  }

  function _renderActive(){
    if(!_root) return;
    var rail = _root.querySelector('.gat-rail');
    if(rail){
      rail.querySelectorAll('.gat-rail-item').forEach(function(it, i){
        it.classList.toggle('gat-active', i === _activeIdx);
      });
    }
    var pane = _root.querySelector('.gat-pane');
    var s = SECTIONS[_activeIdx];
    if(pane && s){
      var tryHTML = '';
      if(s.tryView){
        tryHTML = '<div class="gat-tryrow"><button class="gat-try" type="button" data-tryview="'+_esc(s.tryView)+'">Try ' + _esc(s.tryView) + ' →</button></div>';
      }
      pane.innerHTML =
        '<div class="gat-pane-title">' + _esc(s.title) + '</div>'
        + '<div class="gat-pane-body">' + s.body + '</div>'
        + tryHTML;
      var tryBtn = pane.querySelector('.gat-try');
      if(tryBtn){
        tryBtn.addEventListener('click', function(){
          var view = tryBtn.getAttribute('data-tryview');
          if(_dontShow) markSeen();
          close();
          if(typeof window.setActiveTab === 'function'){
            try { window.setActiveTab(view); } catch(e){}
          } else {
            // Shell exposes setActiveTab via tab DOM clicks; fall back.
            var btns = document.querySelectorAll('.tab-btn');
            for(var i = 0; i < btns.length; i++){
              if(btns[i].dataset.tab === view){ btns[i].click(); break; }
            }
          }
        });
      }
    }
    var prev = _root.querySelector('.gat-prev');
    var next = _root.querySelector('.gat-next');
    if(prev) prev.disabled = (_activeIdx <= 0);
    if(next) next.disabled = (_activeIdx >= SECTIONS.length - 1);
    var pos = _root.querySelector('.gat-pos');
    if(pos) pos.textContent = (_activeIdx + 1) + ' / ' + SECTIONS.length;
  }

  function open(){
    if(_root) return;

    var ov = document.createElement('div');
    ov.className = 'gat-overlay';

    var modal = document.createElement('div');
    modal.className = 'gat-modal';

    // Header
    var hdr = document.createElement('div');
    hdr.className = 'gat-hdr';
    hdr.innerHTML =
      '<div class="gat-title">Welcome to Gold Ark</div>'
      + '<button class="gat-close" type="button" aria-label="Close">×</button>';

    // Body — left rail + right pane
    var body = document.createElement('div');
    body.className = 'gat-body';

    var rail = document.createElement('div');
    rail.className = 'gat-rail';
    SECTIONS.forEach(function(s, i){
      var it = document.createElement('button');
      it.className = 'gat-rail-item';
      it.type = 'button';
      it.textContent = s.title;
      it.addEventListener('click', function(){
        _activeIdx = i;
        _renderActive();
      });
      rail.appendChild(it);
    });

    var pane = document.createElement('div');
    pane.className = 'gat-pane';

    body.appendChild(rail);
    body.appendChild(pane);

    // Footer
    var ftr = document.createElement('div');
    ftr.className = 'gat-ftr';
    ftr.innerHTML =
      '<label class="gat-dontshow"><input type="checkbox" class="gat-dontshow-cb"> Don’t show again</label>'
      + '<div class="gat-nav">'
      +   '<button class="gat-prev" type="button">◀ Previous</button>'
      +   '<span class="gat-pos">1 / ' + SECTIONS.length + '</span>'
      +   '<button class="gat-next" type="button">Next ▶</button>'
      +   '<button class="gat-closebtn" type="button">Close</button>'
      + '</div>';

    modal.appendChild(hdr);
    modal.appendChild(body);
    modal.appendChild(ftr);
    ov.appendChild(modal);
    document.body.appendChild(ov);
    _root = ov;
    _activeIdx = 0;
    _dontShow = false;

    // Wire interactions
    hdr.querySelector('.gat-close').addEventListener('click', close);
    ftr.querySelector('.gat-closebtn').addEventListener('click', close);
    ftr.querySelector('.gat-prev').addEventListener('click', function(){
      if(_activeIdx > 0){ _activeIdx--; _renderActive(); }
    });
    ftr.querySelector('.gat-next').addEventListener('click', function(){
      if(_activeIdx < SECTIONS.length - 1){ _activeIdx++; _renderActive(); }
      else { if(_dontShow) markSeen(); close(); }
    });
    var dontShowCb = ftr.querySelector('.gat-dontshow-cb');
    dontShowCb.addEventListener('change', function(){ _dontShow = dontShowCb.checked; });

    ov.addEventListener('click', function(e){
      if(e.target === ov) close();
    });

    _escHandler = function(e){ if(e.key === 'Escape') close(); };
    document.addEventListener('keydown', _escHandler);

    _renderActive();
  }

  // ── CSS injected once ──
  function _injectCss(){
    if(document.getElementById('gat-css')) return;
    var st = document.createElement('style');
    st.id = 'gat-css';
    st.textContent =
      '.gat-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.78);z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Lato,sans-serif}'
    + '.gat-modal{background:#0e1420;border:1px solid #c9a961;border-radius:10px;width:80vw;max-width:900px;max-height:80vh;display:flex;flex-direction:column;color:#E5E7EB;box-shadow:0 12px 40px rgba(0,0,0,0.65)}'
    + '.gat-hdr{display:flex;align-items:center;justify-content:space-between;padding:14px 22px;border-bottom:1px solid rgba(212,175,55,0.35)}'
    + '.gat-title{font-family:Cinzel,serif;font-size:18px;color:#c9a961;letter-spacing:.06em;font-weight:600}'
    + '.gat-close{background:none;border:none;color:#888;font-size:24px;cursor:pointer;line-height:1;padding:0 6px}'
    + '.gat-close:hover{color:#c9a961}'
    + '.gat-body{flex:1;display:flex;min-height:0;overflow:hidden}'
    + '.gat-rail{width:200px;flex:0 0 200px;border-right:1px solid rgba(212,175,55,0.20);padding:10px 0;overflow-y:auto;background:rgba(212,175,55,0.04)}'
    + '.gat-rail-item{display:block;width:100%;text-align:left;background:transparent;border:none;color:#9aa3b2;font-family:Lato,sans-serif;font-size:13px;padding:8px 18px;cursor:pointer;border-left:3px solid transparent;transition:background .15s,color .15s,border-color .15s}'
    + '.gat-rail-item:hover{background:rgba(212,175,55,0.08);color:#E5E7EB}'
    + '.gat-rail-item.gat-active{background:rgba(212,175,55,0.16);color:#c9a961;border-left-color:#c9a961;font-weight:600}'
    + '.gat-pane{flex:1;padding:22px 28px;overflow-y:auto;line-height:1.6}'
    + '.gat-pane-title{font-family:Cinzel,serif;font-size:20px;color:#c9a961;letter-spacing:.05em;margin-bottom:14px;font-weight:600}'
    + '.gat-pane-body{color:#E5E7EB;font-size:14px}'
    + '.gat-pane-body p{margin:0 0 12px}'
    + '.gat-pane-body strong{color:#d4af37}'
    + '.gat-pane-body em{color:#cfd2d6}'
    + '.gat-tryrow{margin-top:18px;padding-top:14px;border-top:1px solid rgba(212,175,55,0.18)}'
    + '.gat-try{background:rgba(212,175,55,0.18);color:#c9a961;border:1px solid #c9a961;border-radius:14px;padding:7px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:Lato,sans-serif;letter-spacing:.04em;transition:.15s}'
    + '.gat-try:hover{background:rgba(212,175,55,0.32);color:#fff}'
    + '.gat-ftr{padding:12px 22px;border-top:1px solid rgba(212,175,55,0.35);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap}'
    + '.gat-dontshow{font-size:12px;color:#9aa3b2;display:flex;align-items:center;gap:6px;cursor:pointer;font-family:Lato,sans-serif}'
    + '.gat-dontshow input{accent-color:#c9a961}'
    + '.gat-nav{display:flex;align-items:center;gap:10px}'
    + '.gat-prev,.gat-next,.gat-closebtn{background:transparent;color:#9aa3b2;border:1px solid rgba(154,163,178,0.4);border-radius:14px;padding:6px 14px;font-size:12px;cursor:pointer;font-family:Lato,sans-serif;transition:.15s}'
    + '.gat-next{background:rgba(212,175,55,0.18);color:#c9a961;border-color:#c9a961;font-weight:600}'
    + '.gat-prev:hover,.gat-closebtn:hover{border-color:#c9a961;color:#c9a961}'
    + '.gat-next:hover{background:rgba(212,175,55,0.32);color:#fff}'
    + '.gat-prev:disabled,.gat-next:disabled{opacity:.35;cursor:default}'
    + '.gat-pos{font-size:11px;color:#6b7384;letter-spacing:.06em;min-width:40px;text-align:center}'
    + '@media (max-width:700px){.gat-rail{width:130px;flex:0 0 130px}.gat-rail-item{font-size:12px;padding:7px 12px}.gat-pane{padding:16px 18px}}'
    ;
    document.head.appendChild(st);
  }
  _injectCss();

  window.GoldArkTour = {
    open: open,
    close: close,
    shouldAutoOpen: shouldAutoOpen,
    markSeen: markSeen
  };
})();
