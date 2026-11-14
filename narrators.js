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
      // Tag definitions ride along so row tier chips carry them on first paint.
      return Promise.all(files.map(ensureShard).concat([ensureTagDefs()]));
    }).then(function(all){
      all = all.slice(0, -1);
      var out = [];
      all.forEach(function(recs){
        recs.forEach(function(r){
          // Undated narrators never appear in the Timeline. Hidden (name-only)
          // records stay off the list but remain reachable by direct link.
          if(r && typeof r.dod === 'number' && r.hidden !== true) out.push(r);
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
  // "+ NARRATORS" pill: off = no narrators on the Timeline, on = all of them
  // (Tier B and Tier C). The listing still loads lazily, only once it's on.
  var _tierCOn = false;

  function setTierC(on){ _tierCOn = !!on; }
  function tierCOn(){ return _tierCOn; }

  function timelineRows(onReady){
    if(!enabled()) return [];
    if(!_tierCOn) return [];
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
    if(o.badge && o.badge !== 'H') return [];
    return rows.filter(function(r){
      if(o.badge === 'H' && r.tier !== 'B') return false;
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
    var td = _tagDef('Tier ' + tier);
    return '<span class="nr-tier-chip" title="' + _esc(td ? td.def : tierText(tier)) + '" ' +
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
    if(tier === 'B') return 'Linked narrator — appears in hadith held here; narrations cross-tagged';
    if(tier === 'C') return 'Register narrator — listed in the classical registers; no hadith held here';
    return '';
  }

  // ── TAG DEFINITIONS ───────────────────────────────────────
  // tag_definitions.json {tags:{label:definition}} — lazy, cached, fail-soft.
  var _tagDefs = null, _tagDefsP = null;

  function ensureTagDefs(){
    if(_tagDefs) return Promise.resolve(_tagDefs);
    if(_tagDefsP) return _tagDefsP;
    _tagDefsP = _getJson('tag_definitions.json').then(function(j){
      _tagDefs = (j && j.tags && typeof j.tags === 'object') ? j.tags : {};
      _tagDefsP = null;
      return _tagDefs;
    }).catch(function(e){
      console.warn('[narrators] tag definitions load failed', e);
      _tagDefs = {};
      _tagDefsP = null;
      return _tagDefs;
    });
    return _tagDefsP;
  }

  // {label, def} for a chip's text: exact label (case-insensitive), else the
  // longest tag that is a prefix of the chip text. null when nothing matches.
  function _tagDef(text){
    if(!_tagDefs || !text) return null;
    var t = String(text).toLowerCase(), best = null;
    for(var k in _tagDefs){
      var kl = k.toLowerCase();
      if(kl === t) return { label:k, def:_tagDefs[k] };
      if(t.indexOf(kl) === 0 && (!best || k.length > best.label.length)) best = { label:k, def:_tagDefs[k] };
    }
    return best;
  }

  // Chip click: show "<Label> — <definition>" under the chips row; clicking the
  // same chip again hides it, another chip replaces it.
  function toggleTagNote(el){
    if(!el) return;
    var box = document.getElementById('nrTagNote');
    if(!box) return;
    var key = el.getAttribute('data-tag') || '';
    var m = _tagDef(key);
    if(!m) return;
    if(box.style.display !== 'none' && box.getAttribute('data-for') === key){
      box.style.display = 'none';
      box.setAttribute('data-for', '');
      return;
    }
    box.textContent = m.label + ' — ' + m.def;
    box.setAttribute('data-for', key);
    box.style.display = 'block';
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

  // True when the loaded hadith index lists at least one book for this slug
  // (chain or narrated). False until the index has loaded.
  function hasHadith(slug){
    if(!_hidx || !slug) return false;
    var c = _hidx.chain && _hidx.chain[slug];
    var n = _hidx.narrated && _hidx.narrated[slug];
    return !!((c && Object.keys(c).length) || (n && Object.keys(n).length));
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
    var td     = _tagDef('Tier ' + tier);
    return '<div class="nr-tier-sticker nr-tier-' + tier + '"' +
      (td ? ' title="' + _esc(td.def) + '"' : '') + ' ' +
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

    var hiddenNote = p.hidden === true
      ? '<div style="display:flex;align-items:flex-start;gap:5px;margin:-4px 0 12px;padding:5px 9px;' +
        'background:rgba(212,175,55,.08);border:1px dashed rgba(212,175,55,.35);border-radius:3px;' +
        'font-size:var(--fs-3);color:var(--ip-muted);line-height:1.45">' +
        '<span>Name-only entry: the classical registers give one name and no lineage, ' +
        'so this person is kept off the Timeline list.</span></div>'
      : '';

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

    // Note box — same look as estNote.
    function _noteBox(text, extra){
      return '<div style="display:flex;align-items:flex-start;gap:5px;margin:-4px 0 12px;padding:5px 9px;' +
        'background:rgba(212,175,55,.08);border:1px dashed rgba(212,175,55,.35);border-radius:3px;' +
        'font-size:var(--fs-3);color:var(--ip-muted);line-height:1.45' + (extra || '') + '">' +
        '<span>' + _esc(text) + '</span></div>';
    }

    // death_note sits full-width directly under the dates (BORN/DIED wrap row).
    var dateRows =
      _dateRow('BORN', p.dob_s, p.dob, p.birth_date_hijri) +
      _dateRow('DIED', p.dod_s, p.dod, p.death_date_hijri) +
      (p.death_note ? _noteBox('Death date: ' + p.death_note, ';flex-basis:100%;margin:0') : '');

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
      // Chips with a tag definition get it as a title and toggle the
      // definition line (#nrTagNote) on click.
      var _chip = function(cls, text, shown){
        var m = _tagDef(text);
        if(!m) return '<span class="' + cls + '">' + shown + '</span>';
        return '<span class="' + cls + '" data-tag="' + _esc(text) + '" title="' + _esc(m.def) + '" ' +
          'style="cursor:help" onclick="event.stopPropagation();' +
          'window.GA_Narrators.toggleTagNote(this)">' + shown + '</span>';
      };
      tags = '<div class="i-tags">' +
        roles.map(function(r){ return _chip('i-tag hi', r, _esc(r)); }).join('') +
        (p.city ? _chip('i-tag', p.city, '📍 ' + _esc(p.city)) : '') +
        '</div>' +
        '<div id="nrTagNote" data-for="" style="display:none;margin:6px 0 12px;padding:5px 9px;' +
        'background:rgba(212,175,55,.08);border:1px dashed rgba(212,175,55,.35);border-radius:3px;' +
        'font-size:var(--fs-3);color:var(--ip-muted);line-height:1.45"></div>';
    }

    var genHtml = p.generation
      ? _sec('Generation', '<div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">' +
             _esc(p.generation) + '</div>')
      : '';
    if(p.companion_note) genHtml += _noteBox('Companion status: ' + p.companion_note);

    var bioHtml = p.bio
      ? _sec('Biography', '<div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">' +
             _esc(p.bio) + '</div>')
      : (typeof p.bio_auto === 'string' && p.bio_auto.trim())
        ? _sec('Biography', '<div style="font-size:var(--fs-3);color:var(--ip-text);line-height:1.7">' +
               _esc(p.bio_auto) + '</div>' +
               '<div style="margin-top:6px;font-size:var(--fs-3);color:var(--ip-muted);font-style:italic">' +
               'Auto-generated from the chain data and narrator registers held in this app — ' +
               'no biography text survives for this person.</div>')
        : '';
    if(p.register_note) bioHtml += _noteBox(p.register_note);

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
    }
    // No hadith_narrated list: build the table from the loaded hadith index,
    // one linked row per source collection that has numbers for this narrator.
    var idxRows = '', idxTotal = 0;
    if(!hn.length){
      (p.hadith_source_collections || []).forEach(function(bookSlug){
        var nums = hadithNums(p.slug, bookSlug);
        if(!nums.length) return;
        var book = bookSlug;
        for(var k in BOOK_SLUG){ if(BOOK_SLUG[k] === bookSlug){ book = k; break; } }
        var rowStyle = 'display:flex;justify-content:space-between;gap:10px;' +
          'align-items:baseline;padding:4px 0;border-bottom:1px dotted var(--ip-brd);';
        var label = (p.famous || p.slug) + ' — ' + book;
        idxTotal += nums.length;
        idxRows += '<a href="#monastic" class="nr-hadith-row nr-hadith-link" ' +
          'onclick="event.stopPropagation();event.preventDefault();' +
          'window.GA_Narrators.openHadiths(\'' + _jsq(p.slug) + '\',\'' +
          _jsq(bookSlug) + '\',\'' + _jsq(label) + '\');return false;" ' +
          'title="Open these ' + nums.length + ' hadiths in MONASTIC" ' +
          'style="' + rowStyle + 'text-decoration:none;color:var(--ip-text);cursor:pointer">' +
          '<span style="font-size:var(--fs-3)">' + _esc(book) + '</span>' +
          '<span style="font-size:var(--fs-3);color:' + accent + ';' +
          'font-variant-numeric:tabular-nums;white-space:nowrap">' + nums.length + '</span></a>';
      });
    }
    if(idxRows){
      hadHtml = _sec('Hadith Narrated', idxRows +
        '<div style="margin-top:6px;font-size:var(--fs-3);color:var(--ip-muted)">Total in this app: ' +
        idxTotal + '</div>');
    } else if(!hn.length && typeof p.hadith_narrations_count === 'number'){
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

    var _pkKey = 's:' + p.slug;
    var _pk = !!(window._tlIsPickedKey && window._tlIsPickedKey(_pkKey));
    var pickBtn = '<button id="cardPickBtn" title="Pick / unpick" ' +
      'onclick="event.stopPropagation();window._tlTogglePickKey(\'' + _jsq(_pkKey) + '\')" ' +
      'style="background:none;border:none;cursor:pointer;float:right;margin-left:10px;padding:2px;line-height:1;' +
      'color:' + (_pk ? '#fff' : 'rgba(255,255,255,.35)') + '">' +
      '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M3 8.5 L6.5 12 L13 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';

    return '' +
      pickBtn +
      badge +
      hiddenNote +
      namesHtml +
      '<div class="i-dates">' + dateRows + '</div>' +
      estNote +
      genHtml +
      bioHtml +
      hadHtml +
      '<div class="nr-graph-slot" style="display:none"></div>' +
      teachHtml +
      studHtml +
      _sourcesHtml(p);
  }

  // ── TEACHERS & STUDENTS GRAPH ─────────────────────────────
  // Drawn ONLY from narrator_chain_links.json {id:{teachers:[ids],students:[ids]}}.
  // No link is guessed or added. Old slugs are mapped through
  // narrator_redirects.json first so one person never appears twice.
  // A person who is both teacher and student is drawn once, one line with
  // arrows at both ends. No images. No colour by grade.
  var GRAPH_FIRST = 30;                 // per side, then "show all N"
  var _links = null, _linksP = null, _redir = {};
  var _graphOpen = {};                  // slug -> {t:bool, s:bool} "show all" state

  function ensureLinks(){
    if(_links) return Promise.resolve(_links);
    if(_linksP) return _linksP;
    _linksP = Promise.all([
      _getJson('narrator_chain_links.json'),
      _getJson('narrator_redirects.json').catch(function(){ return {}; })
    ]).then(function(res){
      _links = (res[0] && typeof res[0] === 'object') ? res[0] : {};
      _redir = (res[1] && typeof res[1] === 'object') ? res[1] : {};
      _linksP = null;
      return _links;
    }).catch(function(e){
      console.warn('[narrators] links load failed', e);
      _links = {};
      _linksP = null;
      return _links;
    });
    return _linksP;
  }

  function _canon(id){
    var n = 0;
    while(id && _redir[id] && _redir[id] !== id && n < 10){ id = _redir[id]; n++; }
    return id;
  }

  // Teacher / student id lists for one person, redirects applied, de-duplicated,
  // self removed. File order kept. Entries filed under an old slug are merged in.
  function _graphLists(slug){
    if(!_links || !slug) return null;
    var me = _canon(slug);
    var keys = [me];
    if(slug !== me) keys.push(slug);
    Object.keys(_redir).forEach(function(old){
      if(_canon(old) === me && keys.indexOf(old) === -1) keys.push(old);
    });
    var t = [], s = [], seenT = {}, seenS = {};
    keys.forEach(function(k){
      var e = _links[k];
      if(!e) return;
      (e.teachers || []).forEach(function(id){
        id = _canon(id);
        if(id && id !== me && !seenT[id]){ seenT[id] = 1; t.push(id); }
      });
      (e.students || []).forEach(function(id){
        id = _canon(id);
        if(id && id !== me && !seenS[id]){ seenS[id] = 1; s.push(id); }
      });
    });
    if(!t.length && !s.length) return null;
    return { me: me, t: t, s: s, both: seenT, inS: seenS };
  }

  // The record behind an id: core figure (F…) or narrator. null = not found.
  function _personRec(id){
    if(/^F/.test(id)) return _coreBySlug(id);
    return _bySlug[id] || null;
  }

  function _deathText(r){
    if(!r) return '';
    if(typeof r.death_date_hijri === 'number') return 'd. ' + r.death_date_hijri + ' AH';
    if(typeof r.dod === 'number') return 'd. ' + (isEstimatedDod(r) ? 'c. ' : '') + r.dod + ' CE';
    return '';
  }

  function _personTitle(r){
    if(!r) return '';
    var bits = [r.famous || r.full || r.slug];
    if(r.full_name_ar) bits.push(r.full_name_ar);
    if(r.dod_s) bits.push('Died: ' + r.dod_s);
    else if(typeof r.death_date_hijri === 'number') bits.push('Died: ' + r.death_date_hijri + ' AH');
    if(r.generation) bits.push(r.generation);
    if(typeof r.reliability_grade === 'string' && r.reliability_grade.trim()) bits.push('Grade: ' + r.reliability_grade);
    return bits.join(' · ');
  }

  function _openCall(id){
    return /^F/.test(id)
      ? "window.GA_Narrators.openCoreFigure('" + _jsq(id) + "')"
      : "window.GA_Narrators.focusNarrator('" + _jsq(id) + "')";
  }

  function _graphCss(){
    if(document.getElementById('nr-graph-css')) return;
    var st = document.createElement('style');
    st.id = 'nr-graph-css';
    st.textContent =
      '.nr-graph{margin:4px 0 2px}' +
      '.nr-g-body{position:relative;display:grid;grid-template-columns:1fr 34px 1fr;align-items:start}' +
      '.nr-g-lines{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible}' +
      '.nr-g-mid{grid-column:1 / -1;grid-row:1;display:flex;justify-content:center;margin-bottom:22px;position:relative;z-index:1}' +
      '.nr-g-me{max-width:78%;padding:7px 12px;text-align:center;border:1px solid ' + CARD_ACCENT + ';' +
        'border-radius:3px;background:rgba(143,179,176,.10);color:var(--ip-text);font-size:var(--fs-3);' +
        'line-height:1.3;word-break:break-word}' +
      '.nr-g-head{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ip-muted);margin-bottom:2px}' +
      '.nr-g-col{grid-row:2;display:flex;flex-direction:column;gap:5px;position:relative;z-index:1;min-width:0}' +
      '.nr-g-t{grid-column:1}.nr-g-s{grid-column:3}' +
      '.nr-g-s .nr-g-head{text-align:end}' +
      '.nr-g-node{display:block;width:100%;box-sizing:border-box;text-align:start;padding:4px 7px;' +
        'background:var(--ip-surf);border:1px solid var(--ip-brd);border-radius:2px;color:var(--ip-text);' +
        'font:inherit;font-size:var(--fs-3);line-height:1.25;cursor:pointer;min-width:0}' +
      '.nr-g-node:hover,.nr-g-node:focus{border-color:#D4AF37;color:var(--ip-acc);outline:none}' +
      '.nr-g-nm{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}' +
      '.nr-g-ar{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;opacity:.75;font-size:11px}' +
      '.nr-g-sub{display:block;font-size:10px;color:var(--ip-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
      '.nr-g-both{color:' + CARD_ACCENT + ';margin-inline-end:3px}' +
      '.nr-g-more{margin-top:6px;padding:3px 8px;background:none;border:1px dashed var(--ip-brd);' +
        'border-radius:2px;color:var(--ip-muted);font:inherit;font-size:10px;letter-spacing:.06em;cursor:pointer;width:100%}' +
      '.nr-g-more:hover{border-color:#D4AF37;color:var(--ip-acc)}' +
      '.nr-g-key{margin-top:8px;font-size:10px;color:var(--ip-muted);line-height:1.5}' +
      '.nr-g-list{margin-top:8px;font-size:var(--fs-3);color:var(--ip-text)}' +
      '.nr-g-list summary{cursor:pointer;color:var(--ip-muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}' +
      '.nr-g-list ol{margin:6px 0 8px;padding-inline-start:22px;line-height:1.55}' +
      '.nr-g-list a{color:var(--ip-text);text-decoration:none;cursor:pointer}' +
      '.nr-g-list a:hover{color:var(--ip-acc)}' +
      '.nr-g-src{margin-top:8px;font-size:10px;color:var(--ip-muted);font-style:italic}';
    document.head.appendChild(st);
  }

  function _nodeHtml(id, kind, both){
    var r = _personRec(id);
    var nm = r ? (r.famous || r.full || r.full_name_ar || id) : id;
    var ar = (r && r.full_name_ar && r.full_name_ar !== nm) ? r.full_name_ar : '';
    var grade = (r && typeof r.reliability_grade === 'string' && r.reliability_grade.trim()) ? r.reliability_grade : '';
    var sub = [_deathText(r), grade].filter(Boolean).join(' · ');
    return '<button type="button" class="nr-g-node" data-id="' + _esc(id) + '" data-kind="' + kind + '"' +
      (both ? ' data-both="1"' : '') +
      ' title="' + _esc(_personTitle(r)) + '"' +
      ' onclick="event.stopPropagation();' + _openCall(id) + '">' +
      '<span class="nr-g-nm" dir="auto">' + (both ? '<span class="nr-g-both" aria-label="both teacher and student">⇄</span>' : '') +
      _esc(nm) + '</span>' +
      (ar ? '<span class="nr-g-ar" dir="rtl" lang="ar">' + _esc(ar) + '</span>' : '') +
      (sub ? '<span class="nr-g-sub">' + _esc(sub) + '</span>' : '') +
      '</button>';
  }

  function _listHtml(ids, label){
    if(!ids.length) return '';
    return '<div><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--ip-muted);margin-top:6px">' +
      _esc(label) + ' (' + ids.length + ')</div><ol>' +
      ids.map(function(id){
        var r = _personRec(id);
        var nm = r ? (r.famous || r.full || r.full_name_ar || id) : id;
        var extra = [r && r.full_name_ar && r.full_name_ar !== nm ? '<span dir="rtl" lang="ar">' + _esc(r.full_name_ar) + '</span>' : '',
                     _esc(_deathText(r))].filter(Boolean).join(' · ');
        return '<li><a href="#" dir="auto" onclick="event.stopPropagation();event.preventDefault();' +
          _openCall(id) + ';return false;">' + _esc(nm) + '</a>' + (extra ? ' <span style="color:var(--ip-muted)">— ' + extra + '</span>' : '') + '</li>';
      }).join('') + '</ol></div>';
  }

  // Adam, 14 Nov 2026 (answer "1B"): leave out links whose recorded dates
  // cannot be true — the student's recorded death (death_date_hijri) is more
  // than 80 years before the teacher's recorded death. Both values must be
  // recorded; estimates are never used. List sent to research for checking.
  var IMPOSSIBLE_GAP = 80;
  // Research decisions 14 Nov 2026 (goldark-narrator-link-decisions.json):
  // links checked and KEPT are always shown; links on HOLD are always hidden.
  var GRAPH_SHOW = { 'F0482|F1061': 1, 'F1629|arees-448-abdur-rahman-ibn-al-harith': 1 };
  var GRAPH_HOLD = { 'F1433|F1711': 1 };   // F1711 holds two people; split first
  function _datesImpossible(teacherId, studentId){
    var key = teacherId + '|' + studentId;
    if(GRAPH_SHOW[key]) return false;
    if(GRAPH_HOLD[key]) return true;
    var t = _personRec(teacherId), s = _personRec(studentId);
    var td = t && t.death_date_hijri, sd = s && s.death_date_hijri;
    if(typeof td !== 'number' || typeof sd !== 'number') return false;
    return sd < td - IMPOSSIBLE_GAP;
  }

  function _graphHtml(p, g){
    var me = _personRec(g.me) || p;
    var tFound = g.t.filter(function(id){ return !!_personRec(id); });
    var sFound = g.s.filter(function(id){ return !!_personRec(id); });
    var missing = (g.t.length - tFound.length) + (g.s.length - sFound.length);
    var tAll = tFound.filter(function(id){ return !_datesImpossible(id, g.me); });
    var sAll = sFound.filter(function(id){ return !_datesImpossible(g.me, id); });
    var dropped = (tFound.length - tAll.length) + (sFound.length - sAll.length);
    // Mutual pairs: drawn once, on the teachers side.
    var inT = {}, inS = {};
    tAll.forEach(function(id){ inT[id] = 1; });
    sAll.forEach(function(id){ inS[id] = 1; });
    var mutual = tAll.filter(function(id){ return inS[id]; });
    var sOnly  = sAll.filter(function(id){ return !inT[id]; });
    var st = _graphOpen[g.me] || {};
    var tShow = st.t ? tAll : tAll.slice(0, GRAPH_FIRST);
    var sShow = st.s ? sOnly : sOnly.slice(0, GRAPH_FIRST);
    var meName = me.famous || me.full || me.full_name_ar || g.me;
    var meGrade = (typeof me.reliability_grade === 'string' && me.reliability_grade.trim()) ? me.reliability_grade : '';
    var MIDHTML =
        '<div class="nr-g-mid"><div class="nr-g-me" dir="auto">' + _esc(meName) +
          (me.full_name_ar && me.full_name_ar !== meName ? '<span class="nr-g-ar" dir="rtl" lang="ar" style="white-space:normal">' + _esc(me.full_name_ar) + '</span>' : '') +
          (meGrade ? '<span class="nr-g-sub">' + _esc(meGrade) + '</span>' : '') +
        '</div></div>';
    var html = '<div class="nr-graph" data-slug="' + _esc(g.me) + '">' +
      '<div class="nr-g-body">' +
        '<svg class="nr-g-lines" aria-hidden="true"></svg>' +
        MIDHTML +
        '<div class="nr-g-col nr-g-t"><div class="nr-g-head">Teachers ' + tAll.length + '</div>' + tShow.map(function(id){ return _nodeHtml(id, 't', !!inS[id]); }).join('') +
          (tAll.length > GRAPH_FIRST
            ? '<button type="button" class="nr-g-more" onclick="event.stopPropagation();window.GA_Narrators._graphToggle(\'' +
              _jsq(g.me) + '\',\'t\')">' + (st.t ? 'Show first ' + GRAPH_FIRST : 'Show all ' + tAll.length) + '</button>' : '') +
        '</div>' +
        '<div class="nr-g-col nr-g-s"><div class="nr-g-head">Students ' + sAll.length + '</div>' + sShow.map(function(id){ return _nodeHtml(id, 's', false); }).join('') +
          (sOnly.length > GRAPH_FIRST
            ? '<button type="button" class="nr-g-more" onclick="event.stopPropagation();window.GA_Narrators._graphToggle(\'' +
              _jsq(g.me) + '\',\'s\')">' + (st.s ? 'Show first ' + GRAPH_FIRST : 'Show all ' + sAll.length + (mutual.length ? ' (' + mutual.length + ' ⇄ on teachers side)' : '')) + '</button>' : '') +
        '</div>' +
      '</div>' +
      '<div class="nr-g-key">Arrows run teacher → student. Tap a name to open that person.' +
        (mutual.length ? ' ⇄ ' + mutual.length + (mutual.length === 1 ? ' person is' : ' people are') +
          ' both teacher and student — drawn once, on the teachers side.' : '') +
        (missing ? ' ' + missing + ' listed ' + (missing === 1 ? 'link is' : 'links are') +
          ' not shown: no record for that person in the app.' : '') +
        (dropped ? ' ' + dropped + ' listed ' + (dropped === 1 ? 'link is' : 'links are') +
          ' not shown: the recorded dates do not fit (being checked).' : '') +
      '</div>' +
      '<details class="nr-g-list"><summary>Full list as text</summary>' +
        _listHtml(tAll, 'Teachers') + _listHtml(sAll, 'Students') +
      '</details>' +
      '<div class="nr-g-src">Links: teacher/student lists from the app\'s narrator data (muslimscholars.info).</div>' +
      '</div>';
    return html;
  }

  // Lines: from each node's inner edge to the centre box. Curved, arrowheads
  // via markers. Redrawn on resize and after "show all".
  function _drawLines(root){
    if(!root) return;
    var body = root.querySelector('.nr-g-body');
    var svg = root.querySelector('.nr-g-lines');
    var meEl = root.querySelector('.nr-g-me');
    if(!body || !svg || !meEl) return;
    var b = body.getBoundingClientRect();
    if(!b.width || !b.height) return;
    var m = meEl.getBoundingClientRect();
    var col = 'rgba(160,174,192,.45)';
    var acc = 'rgba(143,179,176,.9)';
    var parts = ['<defs>' +
      '<marker id="nrgA" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
      '<path d="M0,0 L8,4 L0,8 z" fill="' + acc + '"/></marker></defs>'];
    var mcx = m.left - b.left + m.width / 2, my = m.bottom - b.top;
    root.querySelectorAll('.nr-g-node').forEach(function(n){
      var r = n.getBoundingClientRect();
      var y = r.top - b.top + Math.min(r.height / 2, 14);
      var kind = n.getAttribute('data-kind');
      var both = n.getAttribute('data-both') === '1';
      // Lines drop from under the centre box down the middle gutter, then
      // turn into the side of the node that faces the gutter.
      var nodeLeft = (r.left + r.width / 2) < (m.left + m.width / 2);
      var x1 = nodeLeft ? (r.right - b.left) : (r.left - b.left);
      var sx = mcx + (nodeLeft ? -6 : 6);
      var d = 'M' + sx + ',' + my + ' C' + sx + ',' + y + ' ' + sx + ',' + y + ' ' + x1 + ',' + y;
      // Path runs centre -> node. Student: arrow at node end. Teacher: arrow at centre end.
      var mk = both ? ' marker-start="url(#nrgA)" marker-end="url(#nrgA)"'
             : (kind === 's' ? ' marker-end="url(#nrgA)"' : ' marker-start="url(#nrgA)"');
      parts.push('<path d="' + d + '" fill="none" stroke="' + (both ? acc : col) + '" stroke-width="1"' + mk + '/>');
    });
    svg.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
    svg.setAttribute('width', b.width);
    svg.setAttribute('height', b.height);
    svg.innerHTML = parts.join('');
  }

  var _graphRO = null;
  function _watchGraph(root){
    if(!root) return;
    requestAnimationFrame(function(){ _drawLines(root); });
    if(typeof ResizeObserver === 'function'){
      if(_graphRO) _graphRO.disconnect();
      _graphRO = new ResizeObserver(function(){ _drawLines(root); });
      _graphRO.observe(root);
    }
  }

  // Load any narrator shards the names need (normally already loaded — the
  // card itself is opened through the same loader).
  function _ensureGraphPeople(g){
    var need = g.t.concat(g.s).filter(function(id){ return !/^F/.test(id) && !_bySlug[id]; });
    if(!need.length) return Promise.resolve();
    return ensureBySlug(need[0]).then(function(){});
  }

  function _fillGraph(p){
    var slot = document.querySelector('#infoScroll .nr-graph-slot');
    if(!slot || !p || !p.slug) return;
    var slug = p.slug;
    ensureLinks().then(function(){
      var g = _graphLists(slug);
      if(!g) return null;
      return _ensureGraphPeople(g).then(function(){ return g; });
    }).then(function(g){
      if(_shownSlug !== slug) return;           // user moved on
      var s2 = document.querySelector('#infoScroll .nr-graph-slot');
      if(!s2) return;
      if(!g){ s2.innerHTML = ''; s2.style.display = 'none'; return; }  // no links: nothing shown
      _graphCss();
      s2.style.display = '';
      s2.innerHTML = _sec('TEACHERS & STUDENTS', _graphHtml(p, g));
      _watchGraph(s2.querySelector('.nr-graph'));
    });
  }

  function _graphToggle(slug, side){
    var st = _graphOpen[slug] || (_graphOpen[slug] = {});
    st[side] = !st[side];
    var rec = _bySlug[_shownSlug] || null;
    if(rec) _fillGraph(rec);
  }

  var _shownSlug = null;

  function openCard(p){
    var el = document.getElementById('infoScroll');
    if(!el || !p) return;
    _shownSlug = p.slug || null;
    el.innerHTML = '<div class="nr-card-wrap">' + cardHtml(p) + '</div>';
    _fillGraph(p);
    // First card opened is the first use of the hadith index and the tag
    // definitions: fetch them, then re-render so rows become links and chips
    // get their definitions. Cached thereafter — a one-time second paint.
    if(!_hidx || !_tagDefs){
      Promise.all([ensureHadithIndex(), ensureTagDefs()]).then(function(){
        if(_shownSlug !== (p.slug || null)) return;   // user moved on
        var el2 = document.getElementById('infoScroll');
        if(el2){ el2.innerHTML = '<div class="nr-card-wrap">' + cardHtml(p) + '</div>'; _fillGraph(p); }
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
    setTierC: setTierC,
    tierCOn: tierCOn,
    applyFilters: applyFilters,
    tierChip: tierChip,
    tierText: tierText,
    ensureTagDefs: ensureTagDefs,
    toggleTagNote: toggleTagNote,
    tierSticker: tierSticker,
    rowYear: rowYear,
    isEstimatedDod: isEstimatedDod,
    ensureHadithIndex: ensureHadithIndex,
    hadithNums: hadithNums,
    hasHadith: hasHadith,
    ensureIdMap: ensureIdMap,
    slugForId: slugForId,
    gotoFigure: gotoFigure,
    openHadiths: openHadiths,
    openCoreFigure: openCoreFigure,
    cardHtml: cardHtml,
    openCard: openCard,
    openCardBySlug: openCardBySlug,
    focusNarrator: focusNarrator,
    ensureLinks: ensureLinks,
    _graphToggle: _graphToggle
  };
})();
