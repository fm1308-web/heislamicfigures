window.YearView = (function(){
  'use strict';

  var ERA_BANDS = [
    {name:'Prophetic Era',     start:-10000,end:632,  rgb:'210,170,50'},
    {name:'Rashidun',          start:632,   end:661,  rgb:'60,160,90'},
    {name:'Umayyad',           start:661,   end:750,  rgb:'50,180,180'},
    {name:'Abbasid Golden Age',start:750,   end:1258, rgb:'70,130,210'},
    {name:'Post-Mongol',       start:1258,  end:1500, rgb:'180,60,60'},
    {name:'Gunpowder Empires', start:1500,  end:1800, rgb:'50,140,90'},
    {name:'Colonial & Reform', start:1800,  end:1950, rgb:'200,150,60'},
    {name:'Contemporary',      start:1950,  end:2025, rgb:'80,160,200'}
  ];

  var TYPE_RANK = {
    'Prophet':1,'Sahaba':2,'Sahabiyya':2,'Caliph':3,
    "Tabi'un":4,'Founder':5,
    'Scholar':6,'Jurist':6,'Mystic':6,'Sufi':6,'Mufassir':6,
    'Ruler':7,'Philosopher':8,'Scientist':8,
    'Poet':9,'Historian':9,'Reformer':9,'Warrior':9,'Traveler':9
  };

  var Y_MIN = 500, Y_MAX = 2025;
  var state = { year: 661, range: 5, loaded: false };
  var _zoneC = null;

  function _esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  function _getDob(p){ return (p && p.dob_academic != null) ? p.dob_academic : (p ? p.dob : null); }
  function _getDod(p){ return (p && p.dod_academic != null) ? p.dod_academic : (p ? p.dod : null); }

  function _asYear(v){
    if(v == null) return null;
    if(typeof v === 'number') return v;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function _typeRank(p){
    var t = (p && p.type) || '';
    return TYPE_RANK[t] || 100;
  }

  function _isFigureAssumed(p){
    if(!p) return false;
    if(p.famous === 'Prophet Muhammad') return false;
    if(p._dobFromDod) return true;
    var s = ((p.dob_s||'') + (p.dod_s||'')).toLowerCase();
    if(/legendary|assumed|estimated|c\./.test(s)) return true;
    if((p.type === 'Founder' || p.type === 'Prophet') && p.dob != null && p.dob < 500) return true;
    return false;
  }

  function _sortFigures(a, b){
    var ra = _typeRank(a), rb = _typeRank(b);
    if(ra !== rb) return ra - rb;
    var na = (a.famous || '').toLowerCase();
    var nb = (b.famous || '').toLowerCase();
    return na < nb ? -1 : (na > nb ? 1 : 0);
  }

  function _firstVal(o, keys){
    for(var i=0;i<keys.length;i++){
      var v = o[keys[i]];
      if(v && typeof v === 'string' && v.trim()) return v.trim();
    }
    return null;
  }

  function _bornPhrase(p){
    var loc = _firstVal(p, ['dob_city','birth_city','birth_location','birthplace','birth_place','dob_location','pob']);
    if(loc) return 'born in ' + _esc(loc);
    return 'is born';
  }

  function _diedPhrase(p){
    var loc = _firstVal(p, ['dod_city','death_city','death_location','death_place','dod_location','pod']);
    var cause = _firstVal(p, ['death_reason','death_cause','dod_reason']);
    // Prophet Muhammad — never use the word "dies".
    if(p && p.famous === 'Prophet Muhammad'){
      if(loc) return 'passes away in ' + _esc(loc);
      return 'passes away';
    }
    if(loc && cause) return 'dies in ' + _esc(loc) + ' (' + _esc(cause) + ')';
    if(loc) return 'dies in ' + _esc(loc);
    if(cause) return 'dies of ' + _esc(cause);
    return 'passes away';
  }

  function _findBornInYear(year){
    if(!window.PEOPLE) return [];
    var out = [];
    for(var i=0;i<window.PEOPLE.length;i++){
      var p = window.PEOPLE[i];
      if(_isFigureAssumed(p)) continue;
      if(_asYear(_getDob(p)) === year) out.push(p);
    }
    out.sort(_sortFigures);
    return out;
  }

  function _findDiedInYear(year){
    if(!window.PEOPLE) return [];
    var out = [];
    for(var i=0;i<window.PEOPLE.length;i++){
      var p = window.PEOPLE[i];
      if(_isFigureAssumed(p)) continue;
      if(_asYear(_getDod(p)) === year) out.push(p);
    }
    out.sort(_sortFigures);
    return out;
  }

  function _findAroundFigures(year, range){
    if(!window.PEOPLE) return [];
    var lo = year - range, hi = year + range, out = [];
    for(var i=0;i<window.PEOPLE.length;i++){
      var p = window.PEOPLE[i];
      var dob = _asYear(_getDob(p));
      var dod = _asYear(_getDod(p));
      var assumed = _isFigureAssumed(p);
      if(dob != null && dob >= lo && dob <= hi){
        if(assumed || dob !== year){
          out.push({ p: p, kind: 'born', y: dob, assumed: assumed });
        }
      }
      if(dod != null && dod >= lo && dod <= hi){
        if(assumed || dod !== year){
          out.push({ p: p, kind: 'died', y: dod, assumed: assumed });
        }
      }
    }
    out.sort(function(a, b){
      var ra = _typeRank(a.p), rb = _typeRank(b.p);
      if(ra !== rb) return ra - rb;
      return Math.abs(a.y - year) - Math.abs(b.y - year);
    });
    return out;
  }

  function _aroundLine(item){
    var p = item.p;
    var verb = item.kind === 'born' ? 'born' : 'dies';
    var sym = item.assumed
      ? '<span class="yr-date-sym yr-date-sym-tri" title="Estimated for visual placement">&#9651;</span>&nbsp;'
      : '<span class="yr-date-sym">&sim;</span>';
    return '<div class="yr-row"><span class="yr-item-tag">[figure]</span> ' + _figChip(p) + ' ' + verb + ' ' + sym + item.y + '</div>';
  }

  function _evYear(e){
    if(e == null) return null;
    var keys = ['year','year_ce','date_ce','date','start_year','startYear','y'];
    for(var i=0;i<keys.length;i++){
      var v = _asYear(e[keys[i]]);
      if(v != null) return v;
    }
    return null;
  }

  function _evTitle(e){
    return _firstVal(e, ['title','name','label','headline']) || '(untitled event)';
  }

  function _evId(e){
    return _firstVal(e, ['id','slug','event_id','eid']) || '';
  }

  function _evImportance(e){
    var v = _firstVal(e, ['importance','priority','rank']);
    if(v){ var n = parseInt(v,10); if(!isNaN(n)) return n; }
    var tags = e.tags || [];
    if(Array.isArray(tags)){
      if(tags.indexOf('turning-point') !== -1) return 1;
      if(tags.indexOf('founding-moment') !== -1) return 2;
      if(tags.indexOf('quran-referenced') !== -1) return 3;
    }
    return 50;
  }

  function _sortEvents(a, b){
    var ra = _evImportance(a), rb = _evImportance(b);
    if(ra !== rb) return ra - rb;
    var ta = _evTitle(a).toLowerCase();
    var tb = _evTitle(b).toLowerCase();
    return ta < tb ? -1 : (ta > tb ? 1 : 0);
  }

  function _isAutoDeathEvent(e){
    var tags = e && e.tags;
    if(!Array.isArray(tags)) return false;
    if(tags.indexOf('death-block') !== -1) return true;
    if(tags.indexOf('auto-generated') !== -1) return true;
    var cat = (e.category || '').toLowerCase();
    if(cat.indexOf('death') !== -1) return true;
    return false;
  }

  function _findEventsInYear(year){
    var arr = [];
    if(window.eventsData){
      arr = window.eventsData.events || window.eventsData;
    }
    if(!Array.isArray(arr)) arr = [];
    var out = [];
    for(var i=0;i<arr.length;i++){
      var e = arr[i];
      if(_isAutoDeathEvent(e)) continue;
      if(_evYear(e) === year) out.push(e);
    }
    out.sort(_sortEvents);
    return out;
  }

  function _findBooksInYear(year){
    var arr = window.booksData || [];
    var out = [];
    for(var i=0;i<arr.length;i++){
      var b = arr[i];
      var y = (typeof b.year_display === 'number') ? b.year_display
            : (typeof b.year === 'number') ? b.year : null;
      if(y === year) out.push(b);
    }
    return out;
  }
  function _bookChip(b){
    var title = _esc(b.title || 'Untitled');
    var author = b.author_hidden ? '' : _esc(b.author_name || '');
    var bid = _esc(b.id || '');
    // Gold + underline on the title to signal clickability, matching the
    // [event] place-link style. Cursor pointer applied to whole chip.
    var inner = '<span class="yr-bk-title" style="color:var(--gold,#c9a961);text-decoration:underline;text-decoration-color:rgba(201,169,97,0.45);text-underline-offset:3px">' + title + '</span>';
    if(author) inner += ' <span class="yr-bk-author">&middot; ' + author + '</span>';
    return '<span class="yr-bk-chip" data-bid="' + bid + '" style="cursor:pointer">' + inner + '</span>';
  }

  // Walk window._journeyCache (populated by FOLLOW or by _loadData below).
  // Return entries where precision === 'year' AND entry.year === selected year.
  // Day/month precision is ignored — user spec: stick to year-level only.
  // Period/decade precision also ignored. Each returned item carries
  // {person, slug, location, event, category} for rendering.
  function _findJourneysInYear(year){
    var cache = window._journeyCache;
    if(!cache) return [];
    var out = [];
    var files = Object.keys(cache);
    for(var i=0;i<files.length;i++){
      var d = cache[files[i]];
      if(!d || !d.journey) continue;
      var j = d.journey;
      for(var k=0;k<j.length;k++){
        var e = j[k];
        if(e && e.precision === 'year' && e.year === year){
          out.push({
            person: d.person || '',
            slug: d.slug || '',
            location: e.location || '',
            event: e.event || '',
            category: e.category || ''
          });
        }
      }
    }
    return out;
  }

  function _findHadithsT1InYear(year){
    var arr = window.hadithIndex || [];
    var out = [];
    for(var i=0;i<arr.length;i++){
      var h = arr[i];
      if(h.tier === 'T1' && h.e === year) out.push(h);
    }
    return out;
  }
  function _findHadithsAroundWindow(year, range){
    var arr = window.hadithIndex || [];
    var lo = year - range, hi = year + range;
    var out = [];
    var TIER_RANK = {T2:0, T3:1, T4:2};
    for(var i=0;i<arr.length;i++){
      var h = arr[i];
      if(h.tier !== 'T2' && h.tier !== 'T3' && h.tier !== 'T4') continue;
      if(typeof h.e !== 'number' || typeof h.l !== 'number') continue;
      if(h.e > hi || h.l < lo) continue;
      out.push(h);
    }
    out.sort(function(a,b){
      var ta = TIER_RANK[a.tier], tb = TIER_RANK[b.tier];
      if(ta !== tb) return ta - tb;
      var ma = (a.e + a.l) / 2, mb = (b.e + b.l) / 2;
      return Math.abs(ma - year) - Math.abs(mb - year);
    });
    return out.slice(0, 25);
  }
  var _COLLECTION_NAMES = {
    'sahih-bukhari': 'Bukhari',
    'sahih-muslim': 'Muslim',
    'abu-dawood': 'Abu Dawood',
    'al-tirmidhi': 'Tirmidhi',
    'sunan-nasai': 'Nasa\'i',
    'ibn-e-majah': 'Ibn Majah',
    'muwatta-malik': 'Muwatta',
    'musnad-ahmad': 'Ahmad',
    'sunan-ad-darimi': 'Darimi',
    'riyad-as-salihin': 'Riyad',
    'shamail-al-muhammadiyah': 'Shamail',
    'bulugh-al-maram': 'Bulugh',
    'al-adab-al-mufrad': 'Adab',
    'mishkat-al-masabih': 'Mishkat',
    '40-hadith-nawawi': 'Nawawi 40',
    '40-hadith-qudsi': 'Qudsi 40',
    '40-hadith-shahwaliullah': 'Shah Waliullah 40'
  };
  function _hadithLabel(h){
    var id = h && h.id ? String(h.id) : '';
    var m = id.match(/^(.+?)-\d+$/);
    if(!m) return _esc(id || 'hadith');
    var key = m[1];
    // Use h.num (per-collection 1-based hadith number from v10 schema).
    // The number embedded in id is a global cumulative counter — NOT the
    // canonical hadith number scholars use. Always prefer h.num.
    var num = (h.num != null) ? String(h.num) : '?';
    var name = _COLLECTION_NAMES[key] || key;
    return _esc(name) + ' ' + _esc(num);
  }
  function _hadithChip(h, showRange){
    var hid = _esc(h.id || '');
    var tier = _esc(h.tier || '');
    var text = h.summary || h.snippet || '';
    var tags = (h.tags && h.tags.length) ? h.tags.slice(0, 3) : [];
    var escaped = _esc(text);
    // Wrap each tag occurrence in a gold span (case-insensitive, whole word-ish).
    for(var t=0; t<tags.length; t++){
      var raw = String(tags[t] || '').trim();
      if(!raw) continue;
      var safe = raw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp('(' + safe + ')', 'i');
      escaped = escaped.replace(re, '<span class="yr-hd-tag">$1</span>');
    }
    var inner = '<span class="yr-hd-summary">' + escaped + '</span>';
    if(showRange && typeof h.e === 'number'){
      var rng = (h.e === h.l) ? (h.e + ' CE') : (h.e + '–' + h.l + ' CE');
      inner += ' <span class="yr-hd-range">· ' + rng + '</span>';
    }
    var num = (h.num != null) ? String(h.num) : '';
    return '<span class="yr-hd-chip" data-hid="' + hid + '" data-num="' + _esc(num) + '" data-tier="' + tier + '">' + inner + '</span>';
  }

  function _figChip(p){
    var name = _esc(p.famous || p.slug || '?');
    var slug = _esc(p.slug || '');
    return '<span class="yr-fig-chip" data-slug="' + slug + '" data-name="' + name + '">' + name + '</span>';
  }

  function _evChip(e){
    var title = _evTitle(e);
    var id = _esc(_evId(e));
    var words = title.split(/\s+/);
    var last = words.pop() || title;
    var rest = words.join(' ');
    var html = '<span class="yr-ev-chip" data-evid="' + id + '">';
    if(rest) html += _esc(rest) + ' ';
    html += '<span class="yr-ev-chip-key">' + _esc(last) + '</span>';
    html += '</span>';
    return html;
  }

  function _erasInRange(year, range){
    var lo = year - range, hi = year + range, visible = [];
    for(var i = 0; i < ERA_BANDS.length; i++){
      var e = ERA_BANDS[i];
      if(e.end <= lo) continue;
      if(e.start >= hi) continue;
      var top = Math.min(e.end, hi), bot = Math.max(e.start, lo);
      var span = top - bot;
      if(span <= 0) continue;
      visible.push({ name:e.name, rgb:e.rgb, fromYear:bot, toYear:top, fraction: span/(hi-lo) });
    }
    return visible;
  }

  function _renderSpine(year, range){
    var pastYr2 = Math.round(year - range * 2/3);
    var pastYr1 = Math.round(year - range * 1/3);
    var futYr1  = Math.round(year + range * 1/3);
    var futYr2  = Math.round(year + range * 2/3);
    var bce = year < 0;
    var displayYear = Math.abs(year);
    var era = bce ? 'BCE' : 'CE';
    var html = '<div class="yr-spine-top">';
    html += '<div class="yr-spine-arrow yr-spine-up">&uarr;</div>';
    html += '<div class="yr-spine-range">&minus;' + range + '</div>';
    html += '<div class="yr-spine-tick">' + pastYr2 + '</div>';
    html += '<div class="yr-spine-tick">' + pastYr1 + '</div>';
    html += '</div>';
    html += '<div class="yr-spine-center">';
    html += '<div class="yr-spine-year-num">' + displayYear + '</div>';
    html += '<div class="yr-spine-year-era">' + era + '</div>';
    html += '</div>';
    html += '<div class="yr-spine-bot">';
    html += '<div class="yr-spine-tick">' + futYr1 + '</div>';
    html += '<div class="yr-spine-tick">' + futYr2 + '</div>';
    html += '<div class="yr-spine-range">+' + range + '</div>';
    html += '<div class="yr-spine-arrow yr-spine-down">&darr;</div>';
    html += '</div>';
    return html;
  }

  function _renderFigSection(label, items, phraseFn){
    var n = items.length;
    var countCls = n === 0 ? 'yr-count yr-count-zero' : 'yr-count';
    var html = '<div class="yr-section-head">';
    html += '<span class="yr-section-label">' + label + '</span>';
    html += '<span class="' + countCls + '">' + n + '</span>';
    html += '</div>';
    if(n === 0){
      html += '<div class="yr-empty">&mdash; none &mdash;</div>';
    } else {
      for(var i=0;i<items.length;i++){
        var p = items[i];
        html += '<div class="yr-row">&middot; ' + _figChip(p) + ' ' + phraseFn(p) + '</div>';
      }
    }
    return html;
  }

  function _renderYearlyInfoSection(events, books, hadiths, journeys){
    events   = events   || [];
    books    = books    || [];
    hadiths  = hadiths  || [];
    journeys = journeys || [];
    var total = events.length + books.length + hadiths.length + journeys.length;
    var countCls = total === 0 ? 'yr-count yr-count-zero' : 'yr-count';
    var html = '<div class="yr-section-head">';
    html += '<span class="yr-section-label">YEARLY INFORMATION</span>';
    html += '<span class="' + countCls + '">' + total + '</span>';
    html += '</div>';
    if(total === 0){
      html += '<div class="yr-empty">&mdash; none &mdash;</div>';
      return html;
    }
    for(var i=0;i<events.length;i++){
      html += '<div class="yr-row"><span class="yr-item-tag">[event]</span> ' + _evChip(events[i]) + '</div>';
    }
    for(var j=0;j<books.length;j++){
      html += '<div class="yr-row"><span class="yr-item-tag">[book]</span> ' + _bookChip(books[j]) + '</div>';
    }
    // [travel] — person in gold to signal clickability later; non-clickable for now.
    for(var t=0;t<journeys.length;t++){
      var jr = journeys[t];
      var person = _esc(jr.person || 'Unknown');
      var loc = _esc(jr.location || '');
      var evt = _esc(jr.event || '');
      var locBit = loc ? ' <span style="color:#9aa3b2">&middot; ' + loc + '</span>' : '';
      html += '<div class="yr-row"><span class="yr-item-tag">[travel]</span> ' +
              '<span style="color:var(--gold,#c9a961);font-weight:500">' + person + '</span>' +
              locBit +
              (evt ? ' <span style="color:#cfd2d6">&mdash; ' + evt + '</span>' : '') +
              '</div>';
    }
    for(var k=0;k<hadiths.length;k++){
      html += '<div class="yr-row"><span class="yr-item-tag">' + _hadithLabel(hadiths[k]) + '</span> ' + _hadithChip(hadiths[k], false) + '</div>';
    }
    return html;
  }

  function _renderLeft(year){
    if(!state.loaded){
      return '<div class="yr-left-title">CERTAIN &middot; ' + year + ' CE</div><div class="yr-empty">Loading...</div>';
    }
    var born = _findBornInYear(year);
    var died = _findDiedInYear(year);
    var events = _findEventsInYear(year);
    var books = _findBooksInYear(year);
    var hadithsT1 = _findHadithsT1InYear(year);
    var journeys = _findJourneysInYear(year);
    var html = '<div class="yr-left-title">CERTAIN &middot; ' + year + ' CE</div>';
    html += _renderFigSection('BORN', born, _bornPhrase);
    html += _renderFigSection('DIED', died, _diedPhrase);
    html += _renderYearlyInfoSection(events, books, hadithsT1, journeys);
    return html;
  }

  function _renderRight(year, range){
    var lo = year - range, hi = year + range;
    var eras = _erasInRange(year, range);
    var bgHtml = '<div class="yr-right-bg">';
    if(eras.length === 1){
      var only = eras[0];
      bgHtml += '<div class="yr-era-band" style="flex:1; background:rgba(' + only.rgb + ',0.18);"></div>';
    } else {
      for(var i = 0; i < eras.length; i++){
        var e = eras[i];
        bgHtml += '<div class="yr-era-band" style="flex:' + e.fraction.toFixed(4) + '; background:rgba(' + e.rgb + ',0.13);"></div>';
      }
    }
    bgHtml += '</div>';
    var lblHtml = '<div class="yr-right-labels">';
    for(var i = 0; i < eras.length; i++){
      var e = eras[i];
      lblHtml += '<div class="yr-era-label-row" style="flex:' + e.fraction.toFixed(4) + ';">';
      lblHtml += '<span class="yr-era-label" data-era="' + _esc(e.name) + '">';
      lblHtml += _esc(e.name) + ' &middot; ' + e.fromYear + '&ndash;' + e.toYear + ' &#8599;';
      lblHtml += '</span></div>';
    }
    lblHtml += '</div>';
    var cHtml = '<div class="yr-right-content">';
    var hadithsAround = _findHadithsAroundWindow(year, range);
    var around = _findAroundFigures(year, range);
    var aroundN = around.length;
    var aroundCountCls = aroundN === 0 ? 'yr-count yr-count-zero' : 'yr-count';
    if(hadithsAround.length){
      cHtml += '<div class="yr-section-head"><span class="yr-section-title">HADITHS NEAR &middot; ' + lo + '&ndash;' + hi + ' CE</span><span class="yr-count">' + hadithsAround.length + '</span></div>';
      for(var hi2=0; hi2<hadithsAround.length; hi2++){
        cHtml += '<div class="yr-row"><span class="yr-item-tag">' + _hadithLabel(hadithsAround[hi2]) + '</span> ' + _hadithChip(hadithsAround[hi2], true) + '</div>';
      }
    }
    cHtml += '<div class="yr-section-head"><span class="yr-section-title">AROUND &middot; ' + lo + '&ndash;' + hi + ' CE</span><span class="' + aroundCountCls + '">' + aroundN + '</span></div>';
    if(aroundN === 0){
      cHtml += '<div class="yr-empty">&mdash; none &mdash;</div>';
    } else {
      for(var ai=0;ai<around.length;ai++){
        cHtml += _aroundLine(around[ai]);
      }
    }
    cHtml += '</div>';
    return bgHtml + lblHtml + cHtml;
  }

  function _render(){
    if(!_zoneC) return;
    var y = state.year, r = state.range;
    var html = '<div id="year-view"><div class="yr-grid">';
    html += '<div class="yr-col yr-col-left">' + _renderLeft(y) + '</div>';
    html += '<div class="yr-col yr-col-spine">' + _renderSpine(y, r) + '</div>';
    html += '<div class="yr-col yr-col-right">' + _renderRight(y, r) + '</div>';
    html += '</div></div>';
    _zoneC.innerHTML = html;
    _bindInternal();
    _syncZoneB();
  }

  function _bindInternal(){
    var up = _zoneC.querySelector('.yr-spine-up');
    var dn = _zoneC.querySelector('.yr-spine-down');
    if(up) up.addEventListener('click', function(){ _stepYear(-1); });
    if(dn) dn.addEventListener('click', function(){ _stepYear(+1); });

    var labels = _zoneC.querySelectorAll('.yr-era-label');
    for(var i=0;i<labels.length;i++){
      labels[i].addEventListener('click', function(e){
        var eraName = e.currentTarget.getAttribute('data-era');
        window._yrJumpEra = eraName;
        if(typeof window.setActiveTab === 'function') window.setActiveTab('ERAS');
      });
    }

    var chips = _zoneC.querySelectorAll('.yr-fig-chip');
    for(var i=0;i<chips.length;i++){
      chips[i].addEventListener('click', function(e){
        var slug = e.currentTarget.getAttribute('data-slug');
        var name = e.currentTarget.getAttribute('data-name');
        window._tlFocusSlug = slug;
        window._tlFocusName = name;
        if(typeof window.setActiveTab === 'function') window.setActiveTab('TIMELINE');
        setTimeout(function(){
          if(typeof window.jumpTo === 'function'){
            try { window.jumpTo(name); } catch(err){ console.warn('[YEAR] jumpTo failed:', err); }
          }
        }, 120);
      });
    }

    var evChips = _zoneC.querySelectorAll('.yr-ev-chip');
    for(var i=0;i<evChips.length;i++){
      evChips[i].addEventListener('click', function(e){
        var evid = e.currentTarget.getAttribute('data-evid');
        console.log('[YEAR] event click -> EVENTS:', evid);
        window._evJumpId = evid;
        if(typeof window.setActiveTab === 'function') window.setActiveTab('EVENTS');

        var tries = 0, maxTries = 25;
        function tryScroll(){
          tries++;
          if(tries === 3){
            try { if(typeof window._evResetYears === 'function') window._evResetYears(); } catch(err){}
          }
          var sels = [
            '[data-event-id="' + evid + '"]',
            '[data-evid="' + evid + '"]',
            '[data-id="' + evid + '"]',
            '#event-' + evid,
            '#ev-' + evid,
            '#' + evid
          ];
          var el = null;
          for(var k=0;k<sels.length;k++){
            try { el = document.querySelector(sels[k]); } catch(err){}
            if(el) break;
          }
          if(el){
            // .ev-row has CSS display:contents — element has no box,
            // so scrollIntoView and getBoundingClientRect are useless on it.
            // Walk to first child with a real rendered box.
            var target = el;
            if(target.offsetHeight === 0 && target.children && target.children.length){
              for(var kk=0; kk<target.children.length; kk++){
                if(target.children[kk].offsetHeight > 0){ target = target.children[kk]; break; }
              }
            }
            function findScrollParent(node){
              var n = node.parentElement;
              while(n && n !== document.body && n !== document.documentElement){
                var s = window.getComputedStyle(n);
                var oy = s.overflowY;
                if((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 4){
                  return n;
                }
                n = n.parentElement;
              }
              return null;
            }
            function doScroll(){
              var sp = findScrollParent(target) || document.getElementById('evScroll');
              if(sp){
                var rT = target.getBoundingClientRect();
                var rS = sp.getBoundingClientRect();
                var newTop = sp.scrollTop + (rT.top - rS.top) - 80;
                sp.scrollTop = Math.max(0, newTop);
                console.log('[YEAR] scrolled #' + (sp.id||sp.tagName) +
                  ' to', sp.scrollTop,
                  'targetTag=', target.tagName,
                  'targetOH=', target.offsetHeight,
                  'scrollH=', sp.scrollHeight,
                  'clientH=', sp.clientHeight);
              } else {
                try { target.scrollIntoView({behavior:'auto', block:'center'}); } catch(e){}
                console.log('[YEAR] no scroll parent — fell back to scrollIntoView');
              }
            }
            console.log('[YEAR] scrolling to', evid, 'tries=', tries,
              'rowOH=', el.offsetHeight, 'targetOH=', target.offsetHeight);
            doScroll();
            setTimeout(doScroll, 400);
            setTimeout(doScroll, 1100);
            target.style.outline = '2px solid #c9a961';
            target.style.outlineOffset = '4px';
            setTimeout(function(){
              target.style.outline = '';
              target.style.outlineOffset = '';
            }, 2500);
            return;
          }
          if(tries < maxTries){
            setTimeout(tryScroll, 200);
          } else {
            console.warn('[YEAR] gave up after', tries, 'tries. evid:', evid);
            var any = document.querySelector('[data-event-id]');
            if(any){
              console.warn('[YEAR] DOM sample event id present:', any.getAttribute('data-event-id'));
            } else {
              console.warn('[YEAR] no [data-event-id] in DOM at all');
            }
          }
        }
        setTimeout(tryScroll, 250);
      });
    }
    var bkChips = _zoneC.querySelectorAll('.yr-bk-chip');
    for(var i=0;i<bkChips.length;i++){
      bkChips[i].addEventListener('click', function(e){
        var bid = e.currentTarget.getAttribute('data-bid');
        console.log('[YEAR] book click -> BOOKS:', bid);
        window._bkJumpId = bid;
        if(typeof window.setActiveTab === 'function') window.setActiveTab('BOOKS');
      });
    }
    var hdChips = _zoneC.querySelectorAll('.yr-hd-chip');
    for(var i=0;i<hdChips.length;i++){
      hdChips[i].addEventListener('click', function(e){
        var hid = e.currentTarget.getAttribute('data-hid');
        var num = e.currentTarget.getAttribute('data-num');
        if(!hid || !num){
          console.warn('[YEAR] hadith chip missing hid/num, skipping:', hid, num);
          return;
        }
        // Extract collection slug from the id prefix.
        // "ibn-e-majah-26221" -> col "ibn-e-majah". Number after
        // last hyphen is global counter and IGNORED — we use the
        // per-collection h.num (data-num) instead, which matches
        // MONASTIC's data-hnum on rendered rows (v10 schema).
        var m = hid.match(/^(.+?)-\d+$/);
        if(!m){
          console.warn('[YEAR] hadith id malformed, skipping:', hid);
          return;
        }
        // Clear MONASTIC's last-view snapshot so its 250ms restore tick
        // doesn't overwrite our collection filter with a stale one.
        window._monLastView = null;
        // MONASTIC reads window._stPendingHadith with shape {col, num}.
        // col resolves "ibn-e-majah" -> "ibnmajah" via XREF_TO_MON_KEY;
        // num is the per-collection 1-based hadith number.
        window._stPendingHadith = { col: m[1], num: num };
        console.log('[YEAR] hadith chip click -> MONASTIC:', m[1], num);
        if(typeof window.setActiveTab === 'function') window.setActiveTab('MONASTIC');
      });
    }
  }

  function _stepYear(delta){
    var y = state.year + delta;
    if(y < Y_MIN) y = Y_MIN;
    if(y > Y_MAX) y = Y_MAX;
    state.year = y;
    _render();
  }

  function _setRange(n){
    state.range = n;
    ['yrRange5','yrRange10','yrRange25','yrRange50'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.classList.remove('zb-active');
    });
    var active = document.getElementById('yrRange' + n);
    if(active) active.classList.add('zb-active');
    _render();
  }

  function _syncZoneB(){
    var s = document.getElementById('sliderInput');
    if(s && parseInt(s.value,10) !== state.year){ s.value = state.year; }
    var d = document.getElementById('yearDisplay');
    if(d) d.textContent = state.year + ' CE';
  }

  function _wireZoneB(){
    var q = document.getElementById('yearQuestion');
    if(q) q.textContent = 'YEAR';
    ['yrPrecisionPill','yearClearBtn','yrShiftHint'].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.style.display = 'none';
    });
    var track = document.getElementById('sliderTrack');
    if(track) track.style.display = 'none';
    var s = document.getElementById('sliderInput');
    if(s){
      s.style.position = 'static';
      s.style.opacity = '1';
      s.style.pointerEvents = 'auto';
      s.style.width = '260px';
      s.style.height = '20px';
      s.style.accentColor = '#c9a961';
      s.min = Y_MIN; s.max = Y_MAX; s.step = 1; s.value = state.year;
      s.addEventListener('input', function(){
        state.year = parseInt(s.value, 10);
        _render();
      });
      // YEAR label: keep visible, sized up, anchored left.
      var qLbl = document.getElementById('yearQuestion');
      if(qLbl){
        qLbl.style.display = '';
        qLbl.textContent = 'YEAR';
        qLbl.style.fontSize = '15px';
        qLbl.style.letterSpacing = '0.12em';
        qLbl.style.fontWeight = '600';
        qLbl.style.color = 'var(--gold)';
        qLbl.style.marginRight = '10px';
      }
      // Hide any leftover "500"/"2025" min/max labels in the slider's host.
      var hunt = s.parentNode ? [s.parentNode, s.parentNode.parentNode] : [];
      for(var hh=0; hh<hunt.length; hh++){
        var host = hunt[hh]; if(!host) continue;
        var kids = host.querySelectorAll('span, div, label, em, small');
        for(var kk=0; kk<kids.length; kk++){
          var tx = (kids[kk].textContent || '').trim();
          if(tx === String(Y_MIN) || tx === String(Y_MAX) || tx === '500' || tx === '2025'){
            kids[kk].style.display = 'none';
          }
        }
      }
      s.style.flex = '1 1 auto';
      s.style.minWidth = '320px';

      // Build a single left-anchored cluster:  YEAR  [GO TO]  ◀  [slider]  ▶  1204 CE
      if(!document.getElementById('yrJumpInput')){
        var inp = document.createElement('input');
        inp.id = 'yrJumpInput';
        inp.type = 'number';
        inp.min = String(Y_MIN);
        inp.max = String(Y_MAX);
        inp.placeholder = 'GO TO';
        inp.style.cssText = 'width:120px;height:36px;margin-right:12px;'
          + 'padding:0 14px;background:#0E1621;'
          + 'border:1px solid rgba(212,175,55,0.55);border-radius:18px;'
          + 'color:#E8EAEF;font-size:15px;font-weight:600;font-family:inherit;'
          + 'letter-spacing:0.06em;text-align:center;outline:none;'
          + '-moz-appearance:textfield;appearance:textfield;';
        if(!document.getElementById('yrJumpInputCss')){
          var st = document.createElement('style');
          st.id = 'yrJumpInputCss';
          st.textContent =
            '#yrJumpInput::-webkit-outer-spin-button,'
            + '#yrJumpInput::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}'
            + '.yr-step-btn{width:30px;height:30px;display:inline-flex;align-items:center;'
            + 'justify-content:center;background:#0E1621;border:1px solid rgba(212,175,55,0.55);'
            + 'border-radius:50%;color:var(--gold);cursor:pointer;'
            + 'font-size:14px;margin:0 6px;user-select:none;transition:background .15s;}'
            + '.yr-step-btn:hover{background:rgba(212,175,55,0.18);color:var(--gold-soft);}';
          document.head.appendChild(st);
        }

        function _doJump(){
          var v = parseInt(inp.value, 10);
          if(isNaN(v)) return;
          if(v < Y_MIN) v = Y_MIN;
          if(v > Y_MAX) v = Y_MAX;
          state.year = v; s.value = v; _render(); inp.value = '';
        }
        inp.addEventListener('keydown', function(e){
          if(e.key === 'Enter'){ e.preventDefault(); _doJump(); inp.blur(); }
        });
        inp.addEventListener('blur', function(){
          if(inp.value !== '') _doJump();
        });

        // Build left and right step buttons.
        var btnL = document.createElement('span');
        btnL.className = 'yr-step-btn'; btnL.id = 'yrStepL';
        btnL.textContent = '◀';
        btnL.addEventListener('click', function(){
          var v = parseInt(s.value,10) || state.year;
          v = Math.max(Y_MIN, v - 1);
          state.year = v; s.value = v; _render();
        });
        var btnR = document.createElement('span');
        btnR.className = 'yr-step-btn'; btnR.id = 'yrStepR';
        btnR.textContent = '▶';
        btnR.addEventListener('click', function(){
          var v = parseInt(s.value,10) || state.year;
          v = Math.min(Y_MAX, v + 1);
          state.year = v; s.value = v; _render();
        });

        // Insert order: GO TO box just before slider, then ◀ before slider, ▶ after slider.
        s.parentNode.insertBefore(inp, s);
        s.parentNode.insertBefore(btnL, s);
        if(s.nextSibling){ s.parentNode.insertBefore(btnR, s.nextSibling); }
        else { s.parentNode.appendChild(btnR); }
      }
    }
    [5,10,25,50].forEach(function(n){
      var el = document.getElementById('yrRange' + n);
      if(el) el.addEventListener('click', function(){ _setRange(n); });
    });
    var def = document.getElementById('yrRange' + state.range);
    if(def) def.classList.add('zb-active');
  }

  function _loadData(){
    var coreUrl = (typeof dataUrl === 'function') ? dataUrl('data/islamic/core.json') : 'data/islamic/core.json';
    var evUrl = (typeof dataUrl === 'function') ? dataUrl('data/islamic/events/master.json') : 'data/islamic/events/master.json';
    var bkUrl = (typeof dataUrl === 'function') ? dataUrl('data/islamic/books.json') : 'data/islamic/books.json';
    var hdUrl = (typeof dataUrl === 'function') ? dataUrl('data/islamic/hadith_year_index.json') : 'data/islamic/hadith_year_index.json';

    console.log('[YEAR] events URL:', evUrl);
    console.log('[YEAR] BEFORE fetch - window.eventsData =', window.eventsData);

    var coreReady = (window.PEOPLE && window.PEOPLE.length)
      ? Promise.resolve(window.PEOPLE)
      : fetch(coreUrl)
          .then(function(r){ return r.ok ? r.json() : []; })
          .catch(function(){ return []; })
          .then(function(arr){ window.PEOPLE = arr || []; return arr; });

    var evReady = fetch(evUrl)
      .then(function(r){
        console.log('[YEAR] FETCH status:', r.status, 'ok=', r.ok, 'url=', r.url);
        if(!r.ok) return null;
        return r.text();
      })
      .then(function(txt){
        if(txt == null){ console.warn('[YEAR] no text'); return null; }
        console.log('[YEAR] response length chars:', txt.length);
        console.log('[YEAR] first 300 chars:', txt.substring(0, 300));
        try {
          var d = JSON.parse(txt);
          console.log('[YEAR] PARSED typeof:', typeof d, 'isArray:', Array.isArray(d));
          if(d && typeof d === 'object' && !Array.isArray(d)){
            console.log('[YEAR] top-level keys:', Object.keys(d));
          }
          if(Array.isArray(d)) console.log('[YEAR] array length:', d.length, 'first item keys:', d[0] ? Object.keys(d[0]) : 'empty');
          else if(d && Array.isArray(d.events)) console.log('[YEAR] d.events length:', d.events.length, 'first item keys:', d.events[0] ? Object.keys(d.events[0]) : 'empty');
          window.eventsData = d;
          return d;
        } catch(e){
          console.warn('[YEAR] JSON.parse failed:', e);
          return null;
        }
      })
      .catch(function(e){
        console.warn('[YEAR] fetch error:', e);
        return null;
      });

    var bkReady = (window.booksData && window.booksData.length)
      ? Promise.resolve(window.booksData)
      : fetch(bkUrl)
          .then(function(r){ return r.ok ? r.json() : null; })
          .catch(function(){ return null; })
          .then(function(d){
            var arr = (d && Array.isArray(d.books)) ? d.books : (Array.isArray(d) ? d : []);
            window.booksData = arr;
            console.log('[YEAR] books loaded:', arr.length);
            return arr;
          });

    var hdReady = (window.hadithIndex && window.hadithIndex.length)
      ? Promise.resolve(window.hadithIndex)
      : fetch(hdUrl)
          .then(function(r){ return r.ok ? r.json() : null; })
          .catch(function(){ return null; })
          .then(function(d){
            var arr = Array.isArray(d) ? d : [];
            window.hadithIndex = arr;
            console.log('[YEAR] hadith index loaded:', arr.length);
            return arr;
          });

    // Journey cache. Reuse FOLLOW's window._journeyCache if populated.
    // Otherwise fetch index.json + every per-figure journey file in parallel.
    // FOLLOW's pattern: file basenames in index.json (not F-slugs).
    var jrReady;
    if(window._journeyCache && Object.keys(window._journeyCache).length){
      jrReady = Promise.resolve(window._journeyCache);
      console.log('[YEAR] reusing journey cache:', Object.keys(window._journeyCache).length, 'figures');
    } else {
      var jrIdxUrl = (typeof dataUrl === 'function') ? dataUrl('data/islamic/journeys/index.json') : 'data/islamic/journeys/index.json';
      jrReady = fetch(jrIdxUrl)
        .then(function(r){ return r.ok ? r.json() : []; })
        .catch(function(){ return []; })
        .then(function(idx){
          if(!Array.isArray(idx) || !idx.length){
            window._journeyCache = window._journeyCache || {};
            return window._journeyCache;
          }
          var cache = window._journeyCache || {};
          window._journeyCache = cache;
          return Promise.all(idx.map(function(item){
            var url = (typeof dataUrl === 'function') ? dataUrl('data/islamic/journeys/' + item.file) : 'data/islamic/journeys/' + item.file;
            return fetch(url)
              .then(function(r){ return r.ok ? r.json() : null; })
              .then(function(d){ if(d) cache[item.file] = d; })
              .catch(function(){});
          })).then(function(){
            console.log('[YEAR] journeys loaded:', Object.keys(cache).length, 'figures');
            return cache;
          });
        });
    }

    Promise.all([coreReady, evReady, bkReady, hdReady, jrReady]).then(function(){
      state.loaded = true;
      var nf = (window.PEOPLE||[]).length;
      var ne = 0;
      var arr = null;
      if(window.eventsData){
        arr = window.eventsData.events || window.eventsData;
        if(Array.isArray(arr)) ne = arr.length;
      }
      if(Array.isArray(arr) && arr.length){
        console.log('[YEAR] sample event:', JSON.stringify(arr[0]).substring(0,500));
      }
      console.log('[YEAR] FINAL loaded:', nf, 'figures,', ne, 'events');
      _render();
    });
  }

  function mount(zoneC, zoneB){
    _zoneC = zoneC;
    _wireZoneB();
    _render();
    _loadData();
  }

  function unmount(){ _zoneC = null; }

  function showHtw(){
    alert('YEAR view\n\nPick a year with the slider. Spine UP back in time, DOWN forward. Click a figure name to open TIMELINE with their lifeline centered. Click an event to open EVENTS view. Click an era label to jump to ERAS.');
  }

  return { mount: mount, unmount: unmount, showHtw: showHtw };
})();
