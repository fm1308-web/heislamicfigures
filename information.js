/* information.js — INFORMATION panel.
   Replaces the first-visit welcome tour (tour.js) and the per-view HOW THIS WORKS
   pills. Opened from the INFORMATION button beside the logo (shell.js).

   Right-side drawer: sidebar of pages + content pane.
   - View pages render the view's own infoHtml(). The text lives in each view
     file, next to the code it describes. A view that isn't loaded yet has its
     script fetched first (window._gaEnsureViewScript in shell.js); it is not mounted.
   - Shared pages show live counts read from the data files when the page is
     opened. Nothing here is fetched at boot, and no number is hardcoded. */
window.InformationPanel = (function(){
  'use strict';

  var VIEWS = ['START','TIMELINE','YEAR','RELATIONS','FOLLOW','STUDY','BOOKS','ERAS',
               'EVENTS','THINK','MAP','TALK','ONE','MONASTIC','EXPLAIN'];
  var SHARED = [
    { key:'SOURCES', title:'Where Data Comes From' },
    { key:'CHECKED', title:'How It Was Checked' }
  ];

  var _panel = null, _nav = null, _content = null;
  var _page = 'START';
  var _renderSeq = 0;

  function _t(s){
    var I = window.GoldArkI18n;
    return (I && typeof I.tt === 'function') ? I.tt(s) : s;
  }
  function _esc(s){
    return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function _num(n){ return (typeof n === 'number') ? n.toLocaleString('en-US') : '—'; }
  function _json(path){
    return fetch(window.dataUrl ? window.dataUrl(path) : path)
      .then(function(r){ if(!r.ok) throw new Error(path + ' ' + r.status); return r.json(); });
  }

  // ── Live counts ──────────────────────────────────────────
  // Each loader resolves to a number, or null when the file can't be read.
  var COUNTS = {
    figures: function(){
      if(window.PEOPLE && window.PEOPLE.length) return Promise.resolve(window.PEOPLE.length);
      // Same load + cache as the views, so a later view mount reuses it.
      return _json('data/islamic/core.json').then(function(arr){
        window.PEOPLE = arr || [];
        return window.PEOPLE.length;
      });
    },
    narrators: function(){
      var N = window.GA_Narrators;
      if(!N || !N.enabled()) return Promise.resolve(null);
      return N.ensureIndex().then(function(ix){ return (ix && typeof ix.count === 'number') ? ix.count : null; });
    },
    events: function(){
      if(window.eventsData && window.eventsData.length) return Promise.resolve(window.eventsData.length);
      return _json('data/islamic/events/master.json').then(function(d){
        return (Array.isArray(d) ? d : (d && d.events) || []).length;
      });
    },
    booksCurated: function(){
      return _json('data/islamic/books.json').then(function(d){ return ((d && d.books) || []).length; });
    },
    booksOpeniti: function(){
      return _json('data/openiti/books_openiti.json').then(function(d){ return ((d && d.books) || []).length; });
    },
    // Narrator records per tier — reads every shard, so only on the CHECKED page.
    narratorTiers: function(){
      var N = window.GA_Narrators;
      if(!N || !N.enabled()) return Promise.resolve(null);
      return N.ensureIndex().then(function(ix){
        var files = Object.keys((ix && ix.shards) || {});
        return Promise.all(files.map(function(f){ return N.ensureShard(f); })).then(function(shards){
          var tiers = {};
          shards.forEach(function(recs){
            (recs || []).forEach(function(r){
              var k = (r && r.tier) || '?';
              tiers[k] = (tiers[k] || 0) + 1;
            });
          });
          return tiers;
        });
      });
    }
  };
  var _countCache = {};
  function _count(key){
    if(!_countCache[key]){
      _countCache[key] = COUNTS[key]().catch(function(e){
        console.warn('[info] count failed:', key, e);
        delete _countCache[key];
        return null;
      });
    }
    return _countCache[key];
  }

  // ── Shared pages ─────────────────────────────────────────
  function _statRow(label, id, src){
    return '<tr><td>' + _esc(_t(label)) + '</td>' +
      '<td class="info-stat" id="' + id + '">…</td>' +
      '<td class="info-src">' + _esc(src) + '</td></tr>';
  }
  function _fill(id, val){
    var el = document.getElementById(id);
    if(el) el.textContent = (val == null) ? _t('unavailable') : _num(val);
  }

  function _renderSources(){
    _content.innerHTML =
      '<h2>' + _esc(_t('Where Data Comes From')) + '</h2>' +
      '<p class="info-lede">' + _esc(_t('Counted from the data files when you open this page.')) + '</p>' +
      '<table class="info-stats">' +
        _statRow('Figures', 'info-n-figures', 'core.json') +
        _statRow('Narrator records', 'info-n-narrators', 'narrators/narrators_index.json') +
        _statRow('Events', 'info-n-events', 'events/master.json') +
        _statRow('Books (curated)', 'info-n-books', 'books.json') +
        _statRow('Books (OpenITI)', 'info-n-openiti', 'openiti/books_openiti.json') +
      '</table>';
    _count('figures').then(function(n){ _fill('info-n-figures', n); });
    _count('narrators').then(function(n){ _fill('info-n-narrators', n); });
    _count('events').then(function(n){ _fill('info-n-events', n); });
    _count('booksCurated').then(function(n){ _fill('info-n-books', n); });
    _count('booksOpeniti').then(function(n){ _fill('info-n-openiti', n); });
  }

  function _renderChecked(){
    var N = window.GA_Narrators;
    _content.innerHTML =
      '<h2>' + _esc(_t('How It Was Checked')) + '</h2>' +
      '<p class="info-lede">' + _esc(_t('Narrator records by tier, counted from the narrator files when you open this page.')) + '</p>' +
      '<table class="info-stats" id="info-tier-table">' +
        '<tr><td colspan="3" class="info-src">' + _esc(_t('Counting…')) + '</td></tr>' +
      '</table>';
    var seq = _renderSeq;
    _count('narratorTiers').then(function(tiers){
      if(seq !== _renderSeq) return;
      var tbl = document.getElementById('info-tier-table');
      if(!tbl) return;
      if(!tiers){ tbl.innerHTML = '<tr><td class="info-src">' + _esc(_t('unavailable')) + '</td></tr>'; return; }
      tbl.innerHTML = Object.keys(tiers).sort().map(function(k){
        var desc = (N && N.tierText) ? N.tierText(k) : '';
        return '<tr><td>' + _esc(_t('Tier')) + ' ' + _esc(k) + '</td>' +
          '<td class="info-stat">' + _num(tiers[k]) + '</td>' +
          '<td class="info-src">' + _esc(desc) + '</td></tr>';
      }).join('');
    });
  }

  // ── View pages ───────────────────────────────────────────
  function _renderView(key){
    var seq = _renderSeq;
    _content.innerHTML = '<h2>' + _esc(_t(key)) + '</h2><p class="info-lede">' + _esc(_t('Loading…')) + '</p>';
    var ensure = window._gaEnsureViewScript;
    if(typeof ensure !== 'function') return;
    ensure(key, function(api){
      if(seq !== _renderSeq) return;   // user moved on while the script loaded
      var html = '';
      try { html = (api && typeof api.infoHtml === 'function') ? api.infoHtml() : ''; }
      catch(e){ console.warn('[info] infoHtml failed for', key, e); }
      _content.innerHTML = '<h2>' + _esc(_t(key)) + '</h2>' +
        (html ? '<div class="info-view-body">' + html + '</div>'
              : '<p class="info-lede">' + _esc(_t('No information page for this view yet.')) + '</p>');
    });
  }

  function _renderPage(key){
    _page = key;
    _renderSeq++;
    _syncNav();
    _content.scrollTop = 0;
    if(key === 'SOURCES') _renderSources();
    else if(key === 'CHECKED') _renderChecked();
    else _renderView(key);
  }

  // ── DOM ──────────────────────────────────────────────────
  function _navBtn(key, label){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'info-nav-btn';
    b.dataset.page = key;
    b.textContent = _t(label);
    b.addEventListener('click', function(){ _renderPage(key); });
    return b;
  }
  function _buildNav(){
    _nav.innerHTML = '';
    VIEWS.forEach(function(v){ _nav.appendChild(_navBtn(v, v)); });
    _nav.appendChild(document.createElement('hr'));
    SHARED.forEach(function(p){ _nav.appendChild(_navBtn(p.key, p.title)); });
  }
  function _syncNav(){
    if(!_nav) return;
    _nav.querySelectorAll('.info-nav-btn').forEach(function(b){
      b.classList.toggle('active', b.dataset.page === _page);
    });
  }

  function _build(){
    if(_panel) return;
    _panel = document.createElement('aside');
    _panel.id = 'information-panel';
    _panel.className = 'information-panel';
    _panel.setAttribute('aria-label', 'Information');
    _panel.hidden = true;
    _panel.innerHTML =
      '<button type="button" class="info-close" aria-label="Close">×</button>' +
      '<nav class="info-sidebar"><div class="info-sidebar-title">' + _esc(_t('INFORMATION')) + '</div><div class="info-nav"></div></nav>' +
      '<div class="info-content"></div>';
    document.body.appendChild(_panel);
    _nav = _panel.querySelector('.info-nav');
    _content = _panel.querySelector('.info-content');
    _buildNav();
    _panel.querySelector('.info-close').addEventListener('click', close);
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && isOpen()) close();
    });
    // Re-render in the new language (view text uses each view's own translator).
    document.addEventListener('gold-ark-lang-changed', function(){
      if(!_panel) return;
      _panel.querySelector('.info-sidebar-title').textContent = _t('INFORMATION');
      _buildNav();
      if(isOpen()) _renderPage(_page);
    });
  }

  function _pageFor(view){
    return (VIEWS.indexOf(view) !== -1) ? view : 'START';
  }
  function isOpen(){ return !!(_panel && !_panel.hidden); }
  function _syncBtn(){
    var b = document.getElementById('infoBtn');
    if(b) b.classList.toggle('active', isOpen());
  }

  function open(view){
    _build();
    _panel.hidden = false;
    document.body.classList.add('info-open');
    _syncBtn();
    _renderPage(_pageFor(view));
  }
  function close(){
    if(!_panel) return;
    _panel.hidden = true;
    document.body.classList.remove('info-open');
    _syncBtn();
  }
  function toggle(view){ if(isOpen()) close(); else open(view); }

  // Called by shell.js on every tab change: an open panel follows the view.
  function setCurrentView(view){
    if(isOpen() && VIEWS.indexOf(view) !== -1 && view !== _page) _renderPage(view);
  }

  return { open: open, close: close, toggle: toggle, isOpen: isOpen, setCurrentView: setCurrentView };
})();
