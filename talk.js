/* ─────────────────────────────────────────────────────────────
   TALK view — verbatim lift from bv-app/talk.js
   IIFE exposes window.TalkView = { mount, unmount }
   ───────────────────────────────────────────────────────────── */
window.TalkView = (function(){
  'use strict';

  // ═══════════════════════════════════════════════════════════
  // STUBBED EXTERNALS (mirror timeline.js stub style)
  // ═══════════════════════════════════════════════════════════
  // stub: VIEW global
  var VIEW = 'talk';
  window.VIEW = 'talk';
  // stub: APP namespace
  var APP = window.APP || { Favorites:null, filterFavsOnly:false, _lang:'en',
    getDisplayName: function(p){ return p ? (p.famous || '') : ''; } };
  window.APP = APP;
  // stub: _showViewDesc — sandbox no-op
  if(typeof window._showViewDesc !== 'function') window._showViewDesc = function(){};

  // ═══════════════════════════════════════════════════════════
  // ▼▼▼ VERBATIM LIFTED CODE FROM bv-app/talk.js ▼▼▼
  // (outer IIFE wrapper unwrapped — we already wrap above)
  // ═══════════════════════════════════════════════════════════

var _inited = false;
var _activeScholar = null;

var TALK_SCHOLARS = [
  {
    id: 'ghazali',
    name: 'Al-Ghazali',
    death: 'd. 1111 CE',
    field: 'Theology & Sufism',
    tradition: 'sufi',
    books: 4,
    samples: [
      {
        q: 'What is the purpose of doubt in seeking truth?',
        a: 'In my Munqidh min al-Dalal, I subjected every belief to radical doubt — not to destroy faith, but to rebuild it on firm ground. True certainty cannot be inherited; it must be earned through honest struggle. The senses deceive, reason has limits, and only direct experience of the Divine light resolves the crisis. Doubt is not the enemy of faith — complacency is.',
        source: 'Munqidh min al-Dalal (Deliverance from Error)'
      },
      {
        q: 'How do you reconcile philosophy with religion?',
        a: 'I addressed this in Tahafut al-Falasifa. The philosophers erred not in using reason, but in claiming reason alone could reach truths that require revelation. On twenty points I found their arguments self-contradictory. Reason is a servant of truth, not its master. When the philosophers spoke on mathematics and logic they were sound; when they spoke on metaphysics without guidance, they stumbled.',
        source: 'Tahafut al-Falasifa (The Incoherence of the Philosophers)'
      }
    ]
  },
  {
    id: 'ibn-arabi',
    name: 'Ibn Arabi',
    death: 'd. 1240 CE',
    field: 'Mystical philosophy',
    tradition: 'sufi',
    books: 3,
    samples: [
      {
        q: 'What do you mean by the unity of being?',
        a: 'What I describe in the Fusus al-Hikam is not that creation is God — that would be heresy. Rather, there is no true existence except His existence. Every created thing is a place where His names manifest, like sunlight through coloured glass. The glass does not become the sun, but without the sun there is no colour.',
        source: 'Fusus al-Hikam (Bezels of Wisdom)'
      },
      {
        q: 'How should a seeker approach knowledge of God?',
        a: 'In the Futuhat al-Makkiyya I explain that there are three kinds of knowledge: intellectual, transmitted, and knowledge of spiritual states. The first two any student can acquire. The third comes only through unveiling — it cannot be taught, only tasted. The seeker must prepare the vessel through purification, then wait for what is poured into it.',
        source: 'Al-Futuhat al-Makkiyya (The Meccan Revelations)'
      }
    ]
  },
  {
    id: 'rumi',
    name: 'Jalal al-Din Rumi',
    death: 'd. 1273 CE',
    field: 'Poetry & Sufism',
    tradition: 'sufi',
    books: 5,
    samples: [
      {
        q: 'Why do you use love as a path to the divine?',
        a: 'In the Masnavi I say that love is the astrolabe of God’s mysteries. When the human heart is consumed by longing for the Beloved, it burns away everything false — pride, pretence, the illusion of separation. The reed flute weeps because it remembers the reed-bed from which it was cut. That is the human condition: we are separated from our origin, and love is the memory of home.',
        source: 'Masnavi-i Ma’navi, Book I'
      },
      {
        q: 'What is the role of the spiritual master?',
        a: 'The master is not the destination but the door. In the Fihi Ma Fihi I explained: you cannot see the back of your own head without a mirror. The sheikh is that mirror. He reflects your true state back to you, the parts you hide from yourself. But beware — if the mirror is distorted, so is everything you see in it. Choose your guide with more care than you choose your physician.',
        source: 'Fihi Ma Fihi (In It What Is In It), Discourse 4'
      }
    ]
  },
  {
    id: 'ibn-khaldun',
    name: 'Ibn Khaldun',
    death: 'd. 1406 CE',
    field: 'History & sociology',
    tradition: 'scholar',
    books: 2,
    samples: [
      {
        q: 'What is asabiyyah and why does it matter?',
        a: 'In the Muqaddimah I observed that no dynasty or civilisation rises without asabiyyah — group solidarity, the bond that makes people willing to sacrifice for each other. Nomadic peoples have it in abundance; city dwellers gradually lose it as luxury softens their resolve. Every dynasty follows the same arc: a founder with strong bonds conquers, his heirs enjoy the spoils, and within three to four generations the solidarity dissolves.',
        source: 'Muqaddimah, Chapter 2'
      },
      {
        q: 'Why do civilisations decline?',
        a: 'Civilisation itself carries the seeds of its own decay. In the Muqaddimah I show that as a dynasty gains power, the ruler no longer needs the group that brought him to power. He replaces them with mercenaries and clients. Luxury increases, taxes rise, the productive class is squeezed, and the economy contracts. This is not a moral judgment — it is a pattern as regular as the seasons.',
        source: 'Muqaddimah, Chapter 3'
      }
    ]
  }
];

var TRADITION_COLORS = {
  sufi:       { bg: 'rgba(160,85,247,.12)', text: '#c4a0f7', border: 'rgba(160,85,247,.35)' },
  philosophy: { bg: 'rgba(45,181,160,.12)', text: '#5dcaa5', border: 'rgba(45,181,160,.35)' },
  scholar:    { bg: 'rgba(74,144,217,.12)', text: '#85b7eb', border: 'rgba(74,144,217,.35)' },
  poetry:     { bg: 'rgba(224,112,144,.12)', text: '#f0997b', border: 'rgba(224,112,144,.35)' }
};

function _e(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function _getInitials(name){
  var parts = name.split(/\s+/);
  if(parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length-1][0]).toUpperCase();
}

function _getTradColor(tradition){
  return TRADITION_COLORS[tradition] || TRADITION_COLORS.scholar;
}

function initTalk(){
  var ct = document.getElementById('talk-view');
  if(!ct) return;
  if(!_inited){
    _inited = true;
  }
  _activeScholar = null;
  _renderSelection(ct);
}
window.initTalk = initTalk;

function _renderSelection(ct){
  var h = '<div class="talk-container">';
  h += '<div class="talk-header">';
  h += '<span class="talk-badge">Coming soon</span>';
  h += '<h2 class="talk-heading">Talk to a scholar</h2>';
  h += '<p class="talk-subtitle">Choose a historical figure and converse with them. Answers are grounded in their actual translated works.</p>';
  h += '</div>';

  h += '<div class="talk-scholar-grid">';
  TALK_SCHOLARS.forEach(function(s){
    var tc = _getTradColor(s.tradition);
    h += '<div class="talk-scholar-card" onclick="window._talkSelectScholar(\''+s.id+'\')" style="border-color:'+tc.border+'">';
    h += '<div class="talk-avatar" style="background:'+tc.bg+';color:'+tc.text+';border-color:'+tc.border+'">'+_getInitials(s.name)+'</div>';
    h += '<div class="talk-card-info">';
    h += '<div class="talk-card-name">'+_e(s.name)+'</div>';
    h += '<div class="talk-card-death">'+_e(s.death)+'</div>';
    h += '<div class="talk-card-field">'+_e(s.field)+'</div>';
    h += '</div>';
    h += '<span class="talk-book-pill" style="background:'+tc.bg+';color:'+tc.text+';border-color:'+tc.border+'">'+s.books+' books</span>';
    h += '</div>';
  });
  h += '</div>';

  h += '<div class="talk-how">';
  h += '<div class="talk-how-heading">How it will work</div>';
  h += '<div class="talk-steps">';
  h += '<div class="talk-step"><div class="talk-step-num">1</div><div class="talk-step-title">Pick a scholar</div><div class="talk-step-desc">Select from figures with digitised works in the study room</div></div>';
  h += '<div class="talk-step"><div class="talk-step-num">2</div><div class="talk-step-title">Ask anything</div><div class="talk-step-desc">Type your question in plain English. The AI searches their books for relevant passages</div></div>';
  h += '<div class="talk-step"><div class="talk-step-num">3</div><div class="talk-step-title">Grounded answers</div><div class="talk-step-desc">Responses cite specific works and chapters. Nothing invented.</div></div>';
  h += '</div>';
  h += '</div>';

  h += '</div>';
  ct.innerHTML = h;
}

function _renderChat(ct, scholar){
  var tc = _getTradColor(scholar.tradition);
  var initials = _getInitials(scholar.name);

  var h = '<div class="talk-container">';

  h += '<div class="talk-chat-topbar">';
  h += '<div class="talk-avatar talk-avatar-sm" style="background:'+tc.bg+';color:'+tc.text+';border-color:'+tc.border+'">'+initials+'</div>';
  h += '<div class="talk-chat-topinfo">';
  h += '<span class="talk-chat-topname">'+_e(scholar.name)+'</span>';
  h += '<span class="talk-chat-topfield">'+_e(scholar.field)+'</span>';
  h += '</div>';
  h += '<button class="talk-change-btn" onclick="window._talkBack()">Change</button>';
  h += '</div>';

  h += '<div class="talk-notice">This feature is under development. Below are sample exchanges showing how <strong>'+_e(scholar.name)+'</strong> might respond based on their indexed works.</div>';

  h += '<div class="talk-chat-area">';
  scholar.samples.forEach(function(s){
    h += '<div class="talk-bubble-row talk-bubble-row-user">';
    h += '<div class="talk-bubble-user">'+_e(s.q)+'</div>';
    h += '</div>';
    h += '<div class="talk-bubble-row talk-bubble-row-scholar">';
    h += '<div class="talk-avatar talk-avatar-xs" style="background:'+tc.bg+';color:'+tc.text+';border-color:'+tc.border+'">'+initials+'</div>';
    h += '<div class="talk-bubble-scholar">';
    h += '<div class="talk-bubble-text">'+_e(s.a)+'</div>';
    h += '<div class="talk-source-tag">'+_e(s.source)+'</div>';
    h += '</div>';
    h += '</div>';
  });
  h += '</div>';

  h += '<div class="talk-input-area">';
  h += '<input class="talk-disabled-input" type="text" placeholder="Ask a question..." disabled>';
  h += '<button class="talk-ask-btn" disabled>Ask</button>';
  h += '</div>';

  h += '<div class="talk-disclaimer">AI-generated responses based on translated works. Independently verify all claims.</div>';

  h += '</div>';
  ct.innerHTML = h;
}

window._talkSelectScholar = function(id){
  var scholar = TALK_SCHOLARS.find(function(s){ return s.id === id; });
  if(!scholar) return;
  _activeScholar = scholar;
  var ct = document.getElementById('talk-view');
  if(ct) _renderChat(ct, scholar);
};

window._talkBack = function(){
  _activeScholar = null;
  var ct = document.getElementById('talk-view');
  if(ct) _renderSelection(ct);
};

  // ═══════════════════════════════════════════════════════════
  // ▲▲▲ END VERBATIM LIFTED CODE ▲▲▲
  // The bv-app setView wrapper IIFE was dropped — sandbox shell
  // handles view switching via shell.js / setActiveTab.
  // The pushState/popstate hash routing was also dropped (#talk/<id>) —
  // sandbox shell owns the URL hash and routes by tab name only.
  // ═══════════════════════════════════════════════════════════

  // Wire shell's Zone B controls — TALK spec:
  // { search:true, filters:[Figure select], actions:[], htw:true }
  function _wireZoneB(zoneBEl){
    var searchInp = document.getElementById('search');
    if(searchInp){
      searchInp.placeholder = 'Search scholars…';
      searchInp.addEventListener('input', function(){
        // Live-filter the scholar grid by name/field.
        var q = (searchInp.value || '').toLowerCase();
        document.querySelectorAll('#talk-view .talk-scholar-card').forEach(function(card){
          var name  = (card.querySelector('.talk-card-name')  || {}).textContent || '';
          var field = (card.querySelector('.talk-card-field') || {}).textContent || '';
          var match = !q || (name + ' ' + field).toLowerCase().indexOf(q) !== -1;
          card.style.display = match ? '' : 'none';
        });
      });
    }

    if(!zoneBEl) return;
    var row2 = zoneBEl.querySelector('.zb-row2');
    if(!row2) return;
    var sel = row2.querySelector('.zb-select');
    if(sel){
      // Figure select — sandbox shim: cycle through scholars.
      sel.addEventListener('click', function(e){
        e.stopPropagation();
        var current = sel.dataset.tkScholar || '';
        var idx = TALK_SCHOLARS.findIndex(function(s){ return s.id === current; });
        var next = (idx + 1) % (TALK_SCHOLARS.length + 1);
        if(next === TALK_SCHOLARS.length){
          // Wrap back to selection grid.
          sel.dataset.tkScholar = '';
          sel.textContent = 'FIGURE';
          window._talkBack();
        } else {
          var s = TALK_SCHOLARS[next];
          sel.dataset.tkScholar = s.id;
          sel.textContent = s.name.toUpperCase();
          window._talkSelectScholar(s.id);
        }
      });
    }
  }

  // ═══════════════════════════════════════════════════════════
  // MOUNT / UNMOUNT
  // ═══════════════════════════════════════════════════════════
  var _mounted = false;

  function mount(zoneCEl, zoneBEl){
    if(_mounted) return;
    _mounted = true;

    document.body.classList.add('tk-mounted');

    // initTalk expects #talk-view in the DOM, then renders into it.
    zoneCEl.innerHTML = '<div id="talk-view" style="display:flex"></div>';

    initTalk();
    _wireZoneB(zoneBEl);
  }

  function unmount(){
    if(!_mounted) return;
    _mounted = false;

    document.body.classList.remove('tk-mounted');

    // Reset transient state so next mount starts on the selection grid.
    _activeScholar = null;
    _inited = false;

    var zb = document.getElementById('zoneB');
    var zc = document.getElementById('zoneC');
    if(zb) zb.innerHTML = '';
    if(zc) zc.innerHTML = '';
  }

  return { mount: mount, unmount: unmount, initTalk: initTalk };
})();
