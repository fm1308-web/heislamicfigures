/* ─────────────────────────────────────────────────────────────
   NARRATORS — Tier-B/C narrator figures (lazy, localhost-gated)

   Data: data/islamic/narrators/
     narrators_index.json   {version, count, shards{file:n}} (slug_to_shard{} pre-batch-2)
     narrators_001..007.json  flat arrays of records (3,425 total)
     narrator_id_to_slug.json arees id -> narrator slug (4,197)

   RULES (see feature spec):
   - Nothing is fetched at boot. The index loads on first use; a shard loads
     only when one of its narrators is opened, or when the Timeline lists them.
   - Narrators NEVER enter core.json or the global PEOPLE array. They are
     merged into the Timeline row list at render time only.
   - NO images for any narrator, ever. This file renders no <img>.
   - Gated by window.GOLD_ARK_CONFIG.NARRATORS_ON (live for all visitors).
   ───────────────────────────────────────────────────────────── */
window.GA_Narrators = (function(){
  'use strict';

  var BASE = 'data/islamic/narrators/';

  // Assumed-lifespan span used to place a death-only narrator on the Timeline.
  // Mirrors the existing core.json convention for figures known only by their
  // death year (dob = dod - 65, flagged _dobFromDod so the Timeline's
  // _isAssumedDate() renders its "estimated date" triangle).
  var ASSUMED_SPAN = 65;

  var _index = null, _indexP = null;   // narrators_index.json
  var _shard = {},   _shardP = {};     // shard file name -> records / in-flight
  var _bySlug = {};                    // slug -> record (populated per shard)
  var _listing = null, _listingP = null; // dated narrators, sorted by dob

  function enabled(){
    var c = window.GOLD_ARK_CONFIG;
    return !!(c && c.NARRATORS_ON);
  }

  function _esc(s){
    return String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function _getJson(rel){
    return fetch(window.dataUrl(BASE + rel)).then(function(r){
      if(!r.ok) throw new Error(rel + ' ' + r.status);
      return r.json();
    });
  }

  // ── LOADERS ───────────────────────────────────────────────

  function ensureIndex(){
    if(_index) return Promise.resolve(_index);
    if(_indexP) return _indexP;
    _indexP = _getJson('narrators_index.json').then(function(j){
      _index = j || {};
      _indexP = null;
      return _index;
    }).catch(function(e){
      console.warn('[narrators] index load failed', e);
      _index = { shards:{}, slug_to_shard:{} };
      _indexP = null;
      return _index;
    });
    return _indexP;
  }

  // Fill in what the Timeline needs, without inventing anything it can't flag.
  function _prep(rec){
    if(!rec || rec._narrator) return rec;
    rec._narrator = true;
    if(!rec.type) rec.type = 'Narrator';
    var dod = (typeof rec.dod === 'number') ? rec.dod : null;
    if(dod != null && typeof rec.dob !== 'number'){
      rec.dob = dod - ASSUMED_SPAN;
      rec._dobFromDod = true;   // drives the △ "date estimated" badge
    }
    return rec;
  }

  function ensureShard(file){
    if(_shard[file]) return Promise.resolve(_shard[file]);
    if(_shardP[file]) return _shardP[file];
    _shardP[file] = _getJson(file).then(function(arr){
      var recs = Array.isArray(arr) ? arr : [];
      recs.forEach(function(r){ _prep(r); if(r && r.slug) _bySlug[r.slug] = r; });
      _shard[file] = recs;
      delete _shardP[file];
      return recs;
    }).catch(function(e){
      console.warn('[narrators] shard load failed: ' + file, e);
      _shard[file] = [];
      delete _shardP[file];
      return [];
    });
    return _shardP[file];
  }

  // Single-narrator path: resolve slug -> shard via the index, load that shard
  // only. The batch-2 index (2026-09-19) dropped slug_to_shard, so when it is
  // absent we fall back to ensureListing(), which loads every shard and fills
  // _bySlug. Still lazy — on first use, never at boot — and cached after.
  function ensureBySlug(slug){
    if(!slug) return Promise.resolve(null);
    if(_bySlug[slug]) return Promise.resolve(_bySlug[slug]);
    return ensureIndex().then(function(idx){
      var map = idx && idx.slug_to_shard;
      if(map){
        var file = map[slug];
        if(!file) return null;
        return ensureShard(file).then(function(){ return _bySlug[slug] || null; });
      }
      return ensureListing().then(function(){ return _bySlug[slug] || null; });
    });
  }

  // Listing path: the index carries no dates, so deciding who belongs on the
  // Timeline needs every shard. Still lazy — this runs on first Timeline
  // render, never at boot.
  function ensureListing(){
    if(_listing) return Promise.resolve(_listing);
    if(_listingP) return _listingP;
    _listingP = ensureIndex().then(function(idx){
      var files = Object.keys((idx && idx.shards) || {});
      if(!files.length) files = ['narrators_001.json','narrators_002.json',
                                 'narrators_003.json','narrators_004.json'];
      return Promise.all(files.map(ensureShard));
    }).then(function(all){
      var out = [];
      all.forEach(function(recs){
        recs.forEach(function(r){
          // Undated narrators never appear in the Timeline.
          if(r && typeof r.dod === 'number') out.push(r);
        });
      });
      out.sort(function(a,b){ return a.dob - b.dob; });
      _listing = out;
      _listingP = null;
      return _listing;
    }).catch(function(e){
      console.warn('[narrators] listing failed', e);
      _listing = [];
      _listingP = null;
      return _listing;
    });
    return _listingP;
  }

  // Returns the dated narrators if already loaded, else [] and kicks off the
  // load, calling onReady(rows) once when it lands.
  function timelineRows(onReady){
    if(!enabled()) return [];
    if(_listing) return _listing;
    ensureListing().then(function(rows){
      if(rows.length && typeof onReady === 'function') onReady(rows);
    });
    return [];
  }

  // Mirror of the Timeline's own filter semantics, for narrator rows only.
  // Narrators carry no tradition / badges / bookmarks, so any of those filters
  // being active simply excludes them.
  function applyFilters(rows, o){
    o = o || {};
    var types = o.types, q = (o.q || '').toLowerCase();
    if(o.trads && o.trads.size > 0) return [];
    if(o.favsOnly) return [];
    if(o.badge) return [];
    return rows.filter(function(r){
      if(types && types.size > 0 && !types.has('Narrator')) return false;
      if(q){
        var hay = [r.famous, r.full, r.full_name_ar, r.kunya, r.city,
                   (r.classif || []).join(' '), r.generation]
                  .join(' ').toLowerCase();
        if(hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  // ── ROW CHIP ──────────────────────────────────────────────

  function tierChip(tier){
    if(tier !== 'B' && tier !== 'C') return '';
    var isB = (tier === 'B');
    // Same sticker palette as the card badge — never gold.
    var col = isB ? 'rgba(127,168,165,.85)' : 'rgba(154,163,173,.75)';
    return '<span class="nr-tier-chip" title="' + _esc(tierText(tier)) + '" ' +
      'style="display:inline-block;margin-left:6px;padding:0 4px;border-radius:2px;' +
      'border:1px solid ' + col + ';color:' + col + ';font-family:' + STICKER_FONT + ';' +
      'font-size:9px;font-weight:700;line-height:13px;letter-spacing:.08em;' +
      'vertical-align:middle;opacity:.9">' + tier + '</span>';
  }

  // A death year is "estimated" when it was converted from a Hijri year or
  // inferred from the narrator's generation, rather than recorded directly.
  function isEstimatedDod(p){
    return !!(p && (p._dodFromAH || p._dodFromGeneration));
  }

  // Death-year label for a Timeline narrator row. Estimated years are prefixed
  // "c.", dimmed and dotted-underlined, and carry the full dod_s on hover.
  function rowYear(p){
    if(!p || typeof p.dod !== 'number') return '';
    var est = isEstimatedDod(p);
    var title = (est && p.dod_s) ? ' title="' + _esc(p.dod_s) + '"' : '';
    var shade = est
      ? 'color:rgba(160,174,192,.55);border-bottom:1px dotted rgba(160,174,192,.45);'
      : 'color:rgba(160,174,192,.8);';
    return '<span class="nr-year' + (est ? ' nr-year-est' : '') + '"' + title +
      ' style="display:inline-block;margin-left:6px;font-size:10px;line-height:13px;' +
      'font-variant-numeric:tabular-nums;vertical-align:middle;' + shade +
      'cursor:' + (est ? 'help' : 'default') + '">' +
      _esc((est ? 'c. ' : '') + p.dod) + '</span>';
  }

  function tierText(tier){
    if(tier === 'B') return 'Verified record — key facts confirmed against listed sources';
    if(tier === 'C') return 'Limited record — name, era and chain data only';
    return '';
  }

  // ── AREES ID → SLUG (hadith chain cross-links) ────────────
  // Batch 2 (2026-09-19) ships the real map, so it is now the primary source:
  //   narrators/narrator_id_to_slug.json  {'11579':'arees-11579-…'} — 4,197 ids,
  //                                 exact id → narrator slug, no name-matching.
  //   arees/core_to_arees_slug.json {lookup:{F0002:'arees-1806-…'}}, self-
  //                                 described "Confirmed matches only. Never
  //                                 name-matched." — 392 core figures.
  // Core "F" slugs still take precedence over narrator slugs.
  // narrators_index.json is kept as a fallback source for the id map so a
  // pre-batch-2 index (which carried slug_to_shard) still resolves.
  var ID_MAP_URL = 'narrator_id_to_slug.json';
  var CORE_MAP_URL = 'data/islamic/arees/core_to_arees_slug.json';
  var _idMap = null, _idMapP = null;

  function _areesIdOf(slug){
    var m = /^arees-(\d+)-/.exec(slug || '');
    return m ? m[1] : null;
  }

  function ensureIdMap(){
    if(_idMap) return Promise.resolve(_idMap);
    if(_idMapP) return _idMapP;
    _idMapP = Promise.all([
      ensureIndex(),
      fetch(window.dataUrl(CORE_MAP_URL))
        .then(function(r){ return r.ok ? r.json() : null; })
        .catch(function(){ return null; }),
      _getJson(ID_MAP_URL).catch(function(){ return null; })
    ]).then(function(res){
      var idx = res[0] || {}, core = res[1], ids = res[2];
      var map = {};
      // Narrators first — the shipped id→slug map, else a legacy index…
      if(ids && typeof ids === 'object'){
        Object.keys(ids).forEach(function(id){
          var slug = ids[id];
          if(id && typeof slug === 'string') map[String(id).trim()] = slug;
        });
      } else {
        Object.keys((idx && idx.slug_to_shard) || {}).forEach(function(slug){
          var id = _areesIdOf(slug);
          if(id) map[id] = slug;
        });
      }
      // …then core figures, which win.
      var lookup = (core && core.lookup) || null;
      if(lookup){
        Object.keys(lookup).forEach(function(fslug){
          var id = _areesIdOf(lookup[fslug]);
          if(id) map[id] = fslug;
        });
      }
      _idMap = map;
      _idMapP = null;
      return _idMap;
    }).catch(function(e){
      console.warn('[narrators] id map build failed', e);
      _idMap = {};
      _idMapP = null;
      return _idMap;
    });
    return _idMapP;
  }

  // Exact lookup only — an unknown id returns null and the caller must leave
  // the name as plain text.
  function slugForId(id){
    if(!_idMap || id == null || id === '') return null;
    return _idMap[String(id).trim()] || null;
  }

  function _clickTab(name){
    var sel = '#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a,' +
              '[data-view="' + name.toLowerCase() + '"]';
    var cands = document.querySelectorAll(sel);
    for(var i = 0; i < cands.length; i++){
      var el = cands[i];
      if((el.textContent || '').trim().toUpperCase() === name ||
         el.getAttribute('data-view') === name.toLowerCase()){ el.click(); return true; }
    }
    if(typeof window.setView === 'function'){ window.setView(name); return true; }
    return false;
  }

  // Cross-view entry point: from anywhere (e.g. a MONASTIC chain), switch to
  // TIMELINE and perform the full figure selection — row highlight, lifeline,
  // info card, and a figure-history entry so BACK walks the trail.
  function gotoFigure(slug){
    if(!slug) return;
    var isCore = /^F/.test(slug);
    var ready = function(){
      if(typeof window._tlFocusFigureBySlug !== 'function') return false;
      if(!document.getElementById('rowsScroll')) return false;
      // For a narrator the listing must be in the row list, or the focus call
      // would fall back to an info-panel-only render.
      if(!isCore && !(_listing && _listing.length)) return false;
      return true;
    };
    var go = function(){
      if(isCore) window._tlFocusFigureBySlug(slug);
      else focusNarrator(slug);
    };
    if(ready()){ go(); return; }
    _clickTab('TIMELINE');
    var tries = 0;
    var iv = setInterval(function(){
      tries++;
      if(ready()){ clearInterval(iv); go(); return; }
      if(tries > 200){ clearInterval(iv); console.warn('[narrators] gotoFigure timed out for', slug); }
    }, 100);
  }

  // ── HADITH INDEX ──────────────────────────────────────────
  // narrator_hadith_index.json = { chain:{slug:{bookSlug:[nums]}}, narrated:{...} }
  // Loaded on first use only — never at boot, never with the shards.

  // hadith_narrated[].book (display name) -> the index's bookSlug, which is
  // also the xref slug MONASTIC's _parseHadithId/XREF_TO_MON_KEY expects.
  var BOOK_SLUG = {
    'Sahih Bukhari':     'sahih-bukhari',
    'Sahih Muslim':      'sahih-muslim',
    "Sunan Abi Da'ud":   'abu-dawood',
    "Jami' al-Tirmidhi": 'al-tirmidhi',
    "Sunan an-Nasa'i":   'sunan-nasai',
    'Sunan Ibn Majah':   'ibn-e-majah'
  };

  var _hidx = null, _hidxP = null;

  function ensureHadithIndex(){
    if(_hidx) return Promise.resolve(_hidx);
    if(_hidxP) return _hidxP;
    _hidxP = _getJson('narrator_hadith_index.json').then(function(j){
      _hidx = j && typeof j === 'object' ? j : {};
      if(!_hidx.chain) _hidx.chain = {};
      if(!_hidx.narrated) _hidx.narrated = {};
      _hidxP = null;
      return _hidx;
    }).catch(function(e){
      console.warn('[narrators] hadith index load failed', e);
      _hidx = { chain:{}, narrated:{} };
      _hidxP = null;
      return _hidx;
    });
    return _hidxP;
  }

  // Merged, de-duplicated hadith numbers for one narrator in one book —
  // the chain list and the narrated list combined. Numbers arrive as both
  // ints and strings, so everything is normalised to string keys.
  function hadithNums(slug, bookSlug){
    if(!_hidx || !slug || !bookSlug) return [];
    var seen = {}, out = [];
    ['chain','narrated'].forEach(function(sec){
      var byBook = _hidx[sec] && _hidx[sec][slug];
      var nums = byBook && byBook[bookSlug];
      if(!Array.isArray(nums)) return;
      nums.forEach(function(n){
        var k = String(n);
        if(k && !seen[k]){ seen[k] = 1; out.push(k); }
      });
    });
    out.sort(function(a,b){
      var na = parseInt(a,10), nb = parseInt(b,10);
      if(isNaN(na) || isNaN(nb)) return a < b ? -1 : (a > b ? 1 : 0);
      return na - nb;
    });
    return out;
  }

  // Open MONASTIC pinned to exactly these hadiths. Mirrors the proven
  // handshake in start.js (_stXrefPinAllHadiths): set _stPendingPinned, then
  // DOM-click the tab; MonasticView.mount() -> onEnter() consumes it.
  function openHadiths(slug, bookSlug, label){
    var nums = hadithNums(slug, bookSlug);
    if(!nums.length) return;
    window._stPendingPinned = {
      ids: nums.map(function(n){ return bookSlug + '-' + n; }),
      label: label || ''
    };
    var sel = '#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a,' +
              '[data-view="monastic"], .tab-monastic';
    var cands = document.querySelectorAll(sel);
    for(var i = 0; i < cands.length; i++){
      var el = cands[i];
      var txt = (el.textContent || '').trim().toUpperCase();
      if(txt === 'MONASTIC' || el.getAttribute('data-view') === 'monastic'){
        el.click();
        return;
      }
    }
    if(typeof window.setView === 'function') window.setView('MONASTIC');
  }

  // ── TIER STICKER ──────────────────────────────────────────
  // Reads as an information sticker slapped onto the record, not as app
  // content: plain system sans (the app uses Cinzel / Source Sans 3), muted
  // slate-teal for B and muted grey for C, never gold, slightly rotated with
  // an offset shadow edge.
  var STICKER_FONT = "system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

  function tierSticker(tier){
    var isB = (tier === 'B');
    var isC = (tier === 'C');
    if(!isB && !isC) return '';
    var ink    = isB ? '#7FA8A5' : '#9AA3AD';   // muted teal / muted grey
    var edge   = isB ? 'rgba(127,168,165,.55)' : 'rgba(154,163,173,.5)';
    var fill   = isB ? 'rgba(127,168,165,.10)' : 'rgba(154,163,173,.08)';
    var tilt   = isB ? '-1.1deg' : '0.9deg';
    return '<div class="nr-tier-sticker nr-tier-' + tier + '" ' +
      'style="display:inline-block;margin:2px 0 16px;padding:7px 12px 8px;' +
      'font-family:' + STICKER_FONT + ';font-size:12px;line-height:1.4;' +
      'color:var(--ip-text);background:' + fill + ';' +
      'border:1px solid ' + edge + ';border-radius:2px;' +
      'box-shadow:3px 3px 0 0 ' + fill + ',3px 3px 0 1px ' + edge + ';' +
      'transform:rotate(' + tilt + ');transform-origin:left center;">' +
      '<span style="display:block;font-family:' + STICKER_FONT + ';' +
      'font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;' +
      'color:' + ink + ';margin-bottom:3px">Tier ' + _esc(tier) + '</span>' +
      '<span style="font-family:' + STICKER_FONT + '">' + _esc(tierText(tier)) + '</span>' +
      '</div>';
  }

  // ── CARD ──────────────────────────────────────────────────

  function _sec(label, bodyHtml){
    if(!bodyHtml) return '';
    return '<div class="i-sec"><div class="i-sl">' + _esc(label) + '</div>' + bodyHtml + '</div>';
  }

  // Teacher / student list. A name with an entry in the links map becomes a
  // link: "F…" slugs go to the core figure's existing card via jumpTo(), any
  // other slug opens that narrator's card. Unlinked names stay plain text.
  // Teacher / student list, rendered with the app's own relation-chip
  // component (.i-teachers > .i-teacher / .i-student) — the same rectangular
  // boxes core figure cards use. A name with an entry in the links map becomes
  // a clickable chip ("F…" slugs go to the core figure, others to the narrator
  // record); unlinked names render as plain muted text, never as a chip.
  function _peopleList(names, links, kind){
    if(!Array.isArray(names) || !names.length) return '';
    links = links || {};
    var cls  = (kind === 'student') ? 'i-student' : 'i-teacher';
    var mark = (kind === 'student') ? '▶ ' : '⟵ ';
    var html = names.map(function(nm){
      var slug = links[nm];
      var isCore = slug && /^F/.test(slug);
      // Only link a core figure we can actually resolve in PEOPLE.
      if(isCore && !_coreBySlug(slug)) slug = null;
      if(!slug){
        return '<span class="nr-plain" style="padding:3px 2px;font-size:var(--fs-3);' +
          'color:var(--ip-muted);opacity:.85">' + _esc(nm) + '</span>';
      }
      var call = isCore
        ? "window.GA_Narrators.openCoreFigure('" + _jsq(slug) + "')"
        : "window.GA_Narrators.focusNarrator('" + _jsq(slug) + "')";
      return '<span class="' + cls + '" ' +
        'onclick="event.stopPropagation();' + call + '" ' +
        'title="' + (isCore ? 'Go to ' + _esc(nm) : 'Open narrator record') + '">' +
        mark + _esc(nm) + '</span>';
    }).join('');
    return '<div class="i-teachers">' + html + '</div>';
  }

  // Escape a slug for embedding inside a single-quoted inline handler.
  function _jsq(s){
    return String(s == null ? '' : s).replace(/\\/g,'\\\\').replace(/'/g,"\\'");
  }

  function _coreBySlug(slug){
    var P = window.PEOPLE;
    if(!Array.isArray(P) || !slug) return null;
    for(var i = 0; i < P.length; i++){ if(P[i] && P[i].slug === slug) return P[i]; }
    return null;
  }

  // Cross-link to a core figure — full app selection (row highlight, lifeline,
  // info card), not just a panel swap.
  function openCoreFigure(slug){
    var core = _coreBySlug(slug);
    if(!core) return;
    if(typeof window._tlFocusFigure === 'function'){ window._tlFocusFigure(core); return; }
    if(typeof window.jumpTo === 'function') window.jumpTo(core.famous);
  }

  // Cross-link to another narrator — loads its shard if needed, then performs
  // the same full selection.
  function focusNarrator(slug){
    return ensureBySlug(slug).then(function(rec){
      if(!rec) return null;
      if(typeof window._tlFocusFigure === 'function') window._tlFocusFigure(rec);
      else openCard(rec);
      return rec;
    });
  }

  function _srcLabel(url){
    try {
      var u = new URL(url);
      var host = u.hostname.replace(/^www\./,'');
      if(host.indexOf('wikipedia') >= 0){
        var nm = decodeURIComponent((u.pathname.split('/').pop() || '')).replace(/_/g,' ');
        return nm ? 'Wikipedia — ' + nm + ' ↗' : 'Wikipedia ↗';
      }
      return host + ' ↗';
    } catch(e){ return url; }
  }

  function _sourcesHtml(p){
    var urls = [];
    function add(s){
      if(typeof s === 'string' && /^https?:\/\//.test(s) && urls.indexOf(s) === -1) urls.push(s);
    }
    add(p.source);
    (Array.isArray(p.sources) ? p.sources : []).forEach(add);
    add(p.bio_full_source);
    if(!urls.length) return '';
    return '<div class="i-source">Sources: ' + urls.map(function(u){
      return '<a href="' + _esc(u) + '" target="_blank" rel="noopener" ' +
             'onclick="event.stopPropagation()" ' +
             'style="color:#D4AF37;text-decoration:none">' + _esc(_srcLabel(u)) + '</a>';
    }).join(' · ') + '</div>';
  }

  // Every narrator card — B and C alike — uses this one accent. Deliberately
  // NOT the app's gold: gold is reserved for Quran and Prophets.
  var CARD_ACCENT = 'rgba(143,179,176,.95)';   // muted teal

  function cardHtml(p){
    if(!p) return '';
    var tier = p.tier;
    var accent = CARD_ACCENT;

    var badge = tierSticker(tier);

    // Dates — the record's own display strings (dob_s / dod_s) are shown
    // verbatim when present; they already carry their "c." and their
    // provenance ("converted from 129 AH" / "estimated from generation").
    // The bare-year + Hijri fallback applies only to records without them.
    function _dateRow(label, s, yr, hijri){
      if(!s && typeof yr !== 'number' && typeof hijri !== 'number') return '';
      var val = s ? s : (typeof yr === 'number' ? yr + ' CE' : 'Unknown');
      // Only add the AH sub-line when no string already states the Hijri year.
      var sub = (!s && typeof hijri === 'number')
        ? '<span class="ds" style="font-style:normal;opacity:.75;display:block;margin-top:2px">' +
          hijri + ' AH</span>' : '';
      return '<div class="i-di"><span class="dl">' + label + '</span>' +
        '<span class="dv" style="color:' + accent + '">' + _esc(val) + '</span>' +
        sub + '</div>';
    }

    var dateRows =
      _dateRow('BORN', p.dob_s, p.dob, p.birth_date_hijri) +
      _dateRow('DIED', p.dod_s, p.dod, p.death_date_hijri);

    // Estimated-placement note when the birth year was derived from the death year.
    var estNote = p._dobFromDod
      ? '<div style="display:flex;align-items:flex-start;gap:5px;margin:-4px 0 12px;padding:5px 9px;' +
        'background:rgba(212,175,55,.08);border:1px dashed rgba(212,175,55,.35);border-radius:3px;' +
        'font-size:var(--fs-3);color:var(--ip-muted);line-height:1.45">' +
        '<span style="flex-shrink:0">△</span><span>Birth year unknown. Timeline position is ' +
        'estimated from the death year for placement only.</span></div>'
      : '';

    // Roles (classif) + city as chips.
    var roles = Array.isArray(p.classif) ? p.classif.filter(Boolean) : [];
    var tags = '';
    if(roles.length || p.city || p.generation){
      tags = '<div class="i-tags">' +
        roles.map(function(r){ return '<span class="i-tag hi">' + _esc(r) + '</span>'; }).join('') +
        (p.city ? '<span class="i-tag">📍 ' + _esc(p.city) + '</span>' : '') +
        '</div>';
    }

    var genHtml = p.generation
      ? _sec('Generation', '<div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">' +
             _esc(p.generation) + '</div>')
      : '';

    var bioHtml = p.bio
      ? _sec('Biography', '<div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">' +
             _esc(p.bio) + '</div>')
      : '';

    // Hadith narrated — identical table for every tier. A row becomes a link
    // when the hadith index holds numbers for this narrator in that book;
    // rows with no index entry stay plain text.
    var hadHtml = '';
    var hn = Array.isArray(p.hadith_narrated) ? p.hadith_narrated.filter(function(h){ return h && h.book; }) : [];
    if(hn.length){
      var rows = hn.map(function(h){
        var bookSlug = BOOK_SLUG[h.book] || null;
        var nums = bookSlug ? hadithNums(p.slug, bookSlug) : [];
        var listed = h.count;
        // "(in this app: N)" only when N differs from the source's own count.
        var inApp = (nums.length && String(nums.length) !== String(listed))
          ? '<span style="margin-left:6px;font-size:10px;color:var(--ip-muted)">' +
            '(in this app: ' + nums.length + ')</span>' : '';
        var cells =
          '<span style="font-size:var(--fs-3)">' + _esc(h.book) + '</span>' +
          '<span style="font-size:var(--fs-3);color:' + accent + ';' +
          'font-variant-numeric:tabular-nums;white-space:nowrap">' +
          _esc(listed) + inApp + '</span>';
        var rowStyle = 'display:flex;justify-content:space-between;gap:10px;' +
          'align-items:baseline;padding:4px 0;border-bottom:1px dotted var(--ip-brd);';
        if(nums.length){
          var label = (p.famous || p.slug) + ' — ' + h.book;
          return '<a href="#monastic" class="nr-hadith-row nr-hadith-link" ' +
            'onclick="event.stopPropagation();event.preventDefault();' +
            'window.GA_Narrators.openHadiths(\'' + _jsq(p.slug) + '\',\'' +
            _jsq(bookSlug) + '\',\'' + _jsq(label) + '\');return false;" ' +
            'title="Open these ' + nums.length + ' hadiths in MONASTIC" ' +
            'style="' + rowStyle + 'text-decoration:none;color:var(--ip-text);cursor:pointer">' +
            cells + '</a>';
        }
        return '<div class="nr-hadith-row" style="' + rowStyle +
          'color:var(--ip-text)">' + cells + '</div>';
      }).join('');
      var total = (typeof p.hadith_narrations_count === 'number')
        ? '<div style="margin-top:6px;font-size:var(--fs-3);color:var(--ip-muted)">Total narrations: ' +
          p.hadith_narrations_count + '</div>' : '';
      hadHtml = _sec('Hadith Narrated', rows + total);
    } else if(typeof p.hadith_narrations_count === 'number'){
      hadHtml = _sec('Hadith Narrated',
        '<div style="font-size:var(--fs-3);color:var(--ip-text)">Total narrations: ' +
        p.hadith_narrations_count + '</div>');
    }

    var teachHtml = _sec('TEACHERS', _peopleList(p.teachers, p.teachers_links, 'teacher'));
    var studHtml  = _sec('STUDENTS', _peopleList(p.students, p.students_links, 'student'));

    // Fixed section order, identical for Tier B and Tier C:
    //   badge · names · dates · generation · biography (if any) ·
    //   hadith narrated · teachers · students · sources
    // NOTE: no image is rendered for a narrator under any circumstance.
    var namesHtml =
      '<div class="i-name">' + _esc(p.famous || p.full || p.slug) + '</div>' +
      (p.full_name_ar
        ? '<div class="i-full" dir="rtl" lang="ar" style="font-size:var(--fs-2)">' +
          _esc(p.full_name_ar) + '</div>' : '') +
      (p.full && p.full !== p.famous
        ? '<div class="i-primary">' + _esc(p.full) + '</div>' : '') +
      (p.kunya ? '<div class="i-primary" style="opacity:.8">' + _esc(p.kunya) + '</div>' : '') +
      tags;

    return '' +
      badge +
      namesHtml +
      '<div class="i-dates">' + dateRows + '</div>' +
      estNote +
      genHtml +
      bioHtml +
      hadHtml +
      teachHtml +
      studHtml +
      _sourcesHtml(p);
  }

  var _shownSlug = null;

  function openCard(p){
    var el = document.getElementById('infoScroll');
    if(!el || !p) return;
    _shownSlug = p.slug || null;
    el.innerHTML = cardHtml(p);
    // First card opened is the first use of the hadith index: fetch it, then
    // re-render so its rows become links. Cached thereafter, so this is a
    // one-time second paint and never re-fetches.
    if(!_hidx){
      ensureHadithIndex().then(function(){
        if(_shownSlug !== (p.slug || null)) return;   // user moved on
        var el2 = document.getElementById('infoScroll');
        if(el2) el2.innerHTML = cardHtml(p);
      });
    }
  }

  function openCardBySlug(slug){
    return ensureBySlug(slug).then(function(rec){
      if(rec) openCard(rec);
      return rec;
    });
  }

  return {
    enabled: enabled,
    ensureIndex: ensureIndex,
    ensureShard: ensureShard,
    ensureBySlug: ensureBySlug,
    ensureListing: ensureListing,
    timelineRows: timelineRows,
    applyFilters: applyFilters,
    tierChip: tierChip,
    tierText: tierText,
    tierSticker: tierSticker,
    rowYear: rowYear,
    isEstimatedDod: isEstimatedDod,
    ensureHadithIndex: ensureHadithIndex,
    hadithNums: hadithNums,
    ensureIdMap: ensureIdMap,
    slugForId: slugForId,
    gotoFigure: gotoFigure,
    openHadiths: openHadiths,
    openCoreFigure: openCoreFigure,
    cardHtml: cardHtml,
    openCard: openCard,
    openCardBySlug: openCardBySlug,
    focusNarrator: focusNarrator
  };
})();
