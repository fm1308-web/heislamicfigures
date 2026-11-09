/* ─────────────────────────────────────────────────────────────
   GOLD LIVE — day-level life of the Prophet Muhammad (MONASTIC tab)
   GOLD LIVE FACTORY 1, 9 Nov 2026.
   Opened by the GOLD LIVE pill that monastic.js adds to Zone B.
   Layout: left 20% gold time bar · middle 70% entries · right 10% chips.
   Data:  data/islamic/goldlive/sira-chronology.json (dates as quoted)
          data/islamic/goldlive/goldlive_links.json (entry -> existing event ids)
   Chips: ONLY links already in Gold Ark — event, the event's quranRef
          verses, event_hadith_chips.json. No new cross-tagging here.
   No images of anyone, ever.
   ───────────────────────────────────────────────────────────── */
(function(){
'use strict';

var P_DATA   = 'data/islamic/goldlive/sira-chronology.json';
var P_LINKS  = 'data/islamic/goldlive/goldlive_links.json';
var P_EVENTS = 'data/islamic/events/master.json';
var P_HCHIPS = 'data/islamic/event_hadith_chips.json';

var PREC_ORDER = ['day','month','year','range','traditional'];
var PREC_LABEL = { day:'Day', month:'Month', year:'Year', range:'Range', traditional:'Traditional' };
var TRAD_LABEL = { sunni:'Sunni', shia:'Shia', general:'General', 'western-academic':'Western academic' };

var _cache = null;
var _keyHandler = null;
var _resizeHandler = null;

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function _url(p){ return (typeof dataUrl === 'function') ? dataUrl(p) : p; }
function _json(p){
  return fetch(_url(p)).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; });
}

function load(){
  if(_cache) return Promise.resolve(_cache);
  return Promise.all([_json(P_DATA), _json(P_LINKS), _json(P_EVENTS), _json(P_HCHIPS)]).then(function(r){
    var doc = r[0];
    if(!doc || !Array.isArray(doc.entries)) return null;
    var evById = {};
    (Array.isArray(r[2]) ? r[2] : []).forEach(function(e){ if(e && e.id) evById[e.id] = e; });
    _cache = {
      doc: doc,
      entries: doc.entries.slice().sort(function(a,b){ return (a.order||0) - (b.order||0); }),
      links: r[1] || { map:{}, skip_quranRef:{} },
      events: evById,
      hchips: r[3] || {}
    };
    return _cache;
  });
}

function bestPrecision(entry){
  var best = null;
  (entry.opinions || []).forEach(function(o){
    var i = PREC_ORDER.indexOf(o.precision);
    if(i < 0) return;
    if(best === null || i < PREC_ORDER.indexOf(best)) best = o.precision;
  });
  return best || 'none';
}

// ── one date format everywhere: "12 Rabi al-Awwal 11 AH" / "8 June 632 CE" ──
// Only what a view states: day/month/year fields, or a year written in its
// quoted date text as "N AH" / "N BH" / a single CE year. Nothing converted.
var MONTH_NAME = { 'Jumada al-Ula':'Jumada al-Awwal', 'Jumada al-Akhira':'Jumada al-Thani' };
function monthName(m){ return m ? (MONTH_NAME[m] || m) : ''; }
function hijriYearOf(o){
  var h = o.hijri || {};
  if(h.year_ah != null) return +h.year_ah;
  var t = h.text || '', m, rx = /(\d{1,2})\s*(BH|AH|A\.H\.)/g, ys = [];
  while((m = rx.exec(t))) ys.push(m[2] === 'BH' ? -(+m[1]) : +m[1]);
  return ys.length === 1 ? ys[0] : null;
}
function ceYearOf(o){
  var g = o.gregorian || {};
  if(g.year != null) return +g.year;
  var t = g.text || '', m, rx = /\b(5[4-9]\d|6[0-4]\d)\b/g, ys = [];
  while((m = rx.exec(t))) ys.push(+m[1]);
  return ys.length === 1 ? ys[0] : null;
}
function fmtHY(n){ return n < 0 ? (-n) + ' BH' : n + ' AH'; }
function fmtSpanH(a, b){
  if(a === b) return fmtHY(a);
  if(a < 0 && b < 0) return (-a) + '–' + (-b) + ' BH';
  if(a > 0 && b > 0) return a + '–' + b + ' AH';
  return fmtHY(a) + ' – ' + fmtHY(b);
}
function fmtSpanG(a, b){ return a === b ? a + ' CE' : a + '–' + b + ' CE'; }
function joinDate(day, month, year){
  return [day != null ? String(day) : '', monthName(month), year || ''].filter(function(x){ return x; }).join(' ');
}
function fmtH(o){
  var h = o.hijri || {}, y = hijriYearOf(o);
  return joinDate(h.day, h.month, y != null ? fmtHY(y) + (o.year_rule ? ' (est.)' : '') : '');
}
function fmtG(o){
  var g = o.gregorian || {}, y = ceYearOf(o);
  return joinDate(g.day, g.month, y != null ? y + ' CE' : '');
}

// Date circle: two lines, Hijri on top, CE below. Each line always carries a
// year slot. Only what the sources state is used: years from the date fields,
// or written explicitly as "N AH" / "N BH" / a CE year in the quoted text.
// Nothing is converted between calendars. Where views give different years,
// the slot shows the span. Day and month are shown only when every view that
// gives them agrees and the year is a single year (or no year is stated).
function circleDate(entry){
  var ops = (entry.opinions || []).filter(function(o){ return o.role !== 'step'; });
  var hStated = false;
  function uniq(a){ var o = {}, r = []; a.forEach(function(x){ if(x != null && !o[x]){ o[x] = 1; r.push(x); } }); return r; }
  function hijriYears(){
    var ys = [];
    ops.forEach(function(o){
      var h = o.hijri || {};
      if(h.year_ah != null){ ys.push(+h.year_ah); if(!o.year_rule) hStated = true; }
      var t = h.text || '', m, rx = /(\d{1,2})\s*(BH|AH|A\.H\.)/g;
      while((m = rx.exec(t))){ ys.push(m[2] === 'BH' ? -(+m[1]) : +m[1]); hStated = true; }
    });
    return uniq(ys);
  }
  function ceYears(){
    var ys = [];
    ops.forEach(function(o){
      var g = o.gregorian || {};
      if(g.year != null) ys.push(+g.year);
      var t = g.text || '', m, rx = /\b(5[4-9]\d|6[0-4]\d)\b/g;
      while((m = rx.exec(t))) ys.push(+m[1]);
    });
    return uniq(ys);
  }
  function yearSlot(ys, span){
    if(!ys.length) return { txt:'', single:false, none:true };
    var n = ys.slice().sort(function(a,b){ return a - b; });
    return { txt: span(n[0], n[n.length-1]), single: n.length === 1, none:false };
  }
  function dayMonth(cal, yslot){
    var res = { month:null, day:null, differ:false };
    if(entry.date_disputed || !(yslot.single || yslot.none)) return res;
    var rows = [];
    ops.forEach(function(o){ var c = o[cal] || {}; if(c.month) rows.push({ m:c.month, d:c.day == null ? null : c.day }); });
    var months = uniq(rows.map(function(r){ return r.m; }));
    if(months.length !== 1){ res.differ = res.mc = months.length > 1; return res; }
    res.month = months[0];
    var days = uniq(rows.map(function(r){ return r.d; }));
    if(days.length === 1 && rows.every(function(r){ return r.d != null; })) res.day = days[0];
    else if(days.length) res.differ = res.dc = true;
    return res;
  }
  var HY = yearSlot(hijriYears(), fmtSpanH), GY = yearSlot(ceYears(), fmtSpanG);
  var HD = dayMonth('hijri', HY), GD = dayMonth('gregorian', GY);
  // Hijri leads (the sources date in Hijri; CE dates are their equivalents).
  // If the Hijri views disagree, the CE line may not look more exact than them.
  var hSpan = !HY.single && !HY.none;
  if(hSpan || HD.mc || HD.dc) GD.day = null;
  if(hSpan || HD.mc) GD.month = null;
  function line(D, Y, est){ return joinDate(D.day, D.month, Y.none ? '' : Y.txt + (est ? ' (est.)' : '')); }
  var prec = 'none';
  [[HD, HY], [GD, GY]].forEach(function(p){
    var D = p[0], Y = p[1], pr = 'none';
    if(!Y.none) pr = D.day != null ? 'day' : (D.month ? 'month' : 'year');
    if(pr !== 'none' && (prec === 'none' || PREC_ORDER.indexOf(pr) < PREC_ORDER.indexOf(prec))) prec = pr;
  });
  var differ = !!entry.date_disputed || HD.differ || GD.differ || (!HY.single && !HY.none) || (!GY.single && !GY.none);
  return { prec: prec, hijri: line(HD, HY, !HY.none && !hStated), ce: line(GD, GY, false), differ: differ };
}

// Verses from an event's quranRef text, e.g. "Al-Imran 3:144 — '...'" or "An-Nahl 16:41-42; Al-Ankabut 29:56"
function versesFromRef(txt){
  var out = [];
  if(!txt) return out;
  var rx = /(\d{1,3}):(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?/g, m;
  while((m = rx.exec(txt))){
    var s = +m[1], v = +m[2], ve = m[3] ? +m[3] : v;
    if(s >= 1 && s <= 114 && v >= 1 && ve >= v) out.push({ s:s, v:v, ve:ve });
  }
  return out;
}

// ── chips (existing Gold Ark links only) ──
function chipsFor(entry){
  var C = _cache;
  var evIds = (C.links.map && C.links.map[entry.id]) || [];
  var skip = C.links.skip_quranRef || {};
  var html = '';
  var seenV = {}, hadith = [], seenH = {};
  evIds.forEach(function(eid){
    var ev = C.events[eid];
    if(!ev) return;
    html += '<button type="button" class="gl-chip gl-chip-ev" data-ev="' + esc(eid) + '" title="' + esc('Open in EVENTS: ' + ev.title) + '">EVENT</button>';
    if(!skip[eid]){
      versesFromRef(ev.quranRef).forEach(function(q){
        var k = q.s + ':' + q.v + '-' + q.ve;
        if(seenV[k]) return; seenV[k] = 1;
        html += '<button type="button" class="gl-chip gl-chip-q" data-s="' + q.s + '" data-v="' + q.v + '" data-ve="' + q.ve + '" title="Open this verse in START">Q ' + q.s + ':' + q.v + (q.ve !== q.v ? '–' + q.ve : '') + '</button>';
      });
    }
    (C.hchips[eid] || []).forEach(function(h){ if(!seenH[h]){ seenH[h] = 1; hadith.push(h); } });
  });
  if(hadith.length){
    html += '<button type="button" class="gl-chip gl-chip-h" data-gl="' + esc(entry.id) + '" title="Hadith already linked to this event in Gold Ark (word match). Opens in MONASTIC.">HADITH ' + hadith.length.toLocaleString() + '</button>';
  }
  return { html: html, hadith: hadith };
}

// ── middle column: one entry ──
function dateLine(o){
  // Shown only when a view has no day/month/year to format (e.g. "20 years after 'Am al-Fil").
  var h = o.hijri || {}, g = o.gregorian || {}, parts = [];
  if(!fmtH(o) && h.text) parts.push('<span class="gl-cal"><span class="gl-cal-k">As stated</span> ' + esc(h.text) + '</span>');
  if(!fmtG(o) && g.text) parts.push('<span class="gl-cal"><span class="gl-cal-k">As stated</span> ' + esc(g.text) + '</span>');
  return parts.join('');
}
function opinionHtml(o){
  var h = '<div class="gl-op">';
  var fh = fmtH(o), fg = fmtG(o);
  var head = [o.weekday || '', fh, fg].filter(function(x){ return x; }).join(' \u00B7 ');
  if(head && o.role === 'step') head = 'Step \u00B7 ' + head;
  h += '<div class="gl-op-hd"><span class="gl-op-label">' + esc(head || o.label) + '</span>';
  if(o.tradition) h += '<span class="gl-tag">' + esc(TRAD_LABEL[o.tradition] || o.tradition) + '</span>';
  if(o.precision) h += '<span class="gl-prec gl-p-' + esc(o.precision) + '">' + esc(PREC_LABEL[o.precision] || o.precision) + '</span>';
  h += '</div>';
  if(head && o.label) h += '<div class="gl-op-sub">' + esc(o.label) + '</div>';
  if(o.year_rule) h += '<div class="gl-op-sub gl-est">Estimated: ' + esc(o.year_rule) + '</div>';
  var dl = dateLine(o);
  if(dl) h += '<div class="gl-op-cal">' + dl + '</div>';
  (o.sources || []).forEach(function(s){
    h += '<div class="gl-src">';
    if(s.quote && s.lang === 'ar') h += '<div class="gl-quote gl-ar" dir="rtl" lang="ar">' + esc(s.quote) + '</div>' + (s.quote_en ? '<div class="gl-quote-en">English (Factory, not checked by a scholar): ' + esc(s.quote_en) + '</div>' : '');
    else if(s.quote) h += '<span class="gl-quote">“' + esc(s.quote) + '”</span> ';
    h += '<a class="gl-src-a" href="' + esc(s.url) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()">' + esc(s.label || s.url) + '</a>';
    if(s.section) h += '<span class="gl-src-sec"> · ' + esc(s.section) + '</span>';
    h += '</div>';
  });
  return h + '</div>';
}

function rowHtml(entry){
  var chips = chipsFor(entry);
  var h = '<div class="gl-row" id="gl-row-' + esc(entry.id) + '" data-gl="' + esc(entry.id) + '">';
  h += '<div class="gl-main"><div class="gl-content">';
  h += '<div class="gl-hd"><span class="gl-title">' + esc(entry.title) + '</span></div>';
  h += '<div class="gl-desc">' + esc(entry.description) + '</div>';
  if(!(entry.opinions || []).length){
    h += '<div class="gl-op gl-op-none">No dated source found.</div>';
  }
  (entry.opinions || []).forEach(function(o){ h += opinionHtml(o); });
  if(entry.notes){
    h += '<details class="gl-notes" onclick="event.stopPropagation()"><summary>Research notes</summary><div>' + esc(entry.notes) + '</div></details>';
  }
  h += '</div></div>';
  h += '<div class="gl-tags">' + (chips.html || '<span class="gl-tags-none">—</span>') + '</div>';
  h += '</div>';
  return h;
}

// ── left column: gold line = life slider; one fixed date circle beside it ──
function barHtml(entries){
  var h = '<div class="gl-bar-line"></div>';
  ((_cache.doc && _cache.doc.milestones) || []).forEach(function(m){
    h += '<button type="button" class="gl-ms" data-gl="' + esc(m.id) + '" title="Go to: ' + esc(m.label) + '"><span class="gl-ms-tick"></span><span class="gl-ms-lbl">' + esc(m.label) + '</span></button>';
  });
  h += '<div class="gl-knob" title="Drag to move through his life"></div>';
  h += '<div class="gl-slab-wrap"><div class="gl-slab gl-t-none">' +
         '<span class="gl-slab-cal gl-h-cal">Hijri</span><span class="gl-slab-txt gl-h-txt"></span>' +
         '<span class="gl-slab-sep"></span>' +
         '<span class="gl-slab-cal gl-g-cal">CE</span><span class="gl-slab-txt gl-g-txt"></span>' +
         '<span class="gl-slab-txt gl-none-txt">No date in sources</span>' +
       '</div><div class="gl-slab-differ"></div><div class="gl-slab-title"></div></div>';
  return h;
}

function legendHtml(){
  return '<div class="gl-legend"><span class="gl-legend-t">Drag the dot</span></div>';
}

// ── jumps out of GOLD LIVE (same patterns monastic.js uses) ──
function _clickTab(label, dataView){
  var c = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="' + dataView + '"]');
  for(var i = 0; i < c.length; i++){
    var t = (c[i].textContent || '').trim().toUpperCase();
    if(t === label || c[i].getAttribute('data-view') === dataView){ c[i].click(); return true; }
  }
  return false;
}
function jumpEvent(eid){
  close();
  _clickTab('EVENTS', 'events');
  if(typeof window._stXrefJumpEvent !== 'function' && !window._monStartJsLoading){
    window._monStartJsLoading = true;
    var s = document.createElement('script');
    s.src = 'start.js?v=' + Date.now();
    document.head.appendChild(s);
  }
  var tries = 0;
  var iv = setInterval(function(){
    tries++;
    if(typeof window._stXrefJumpEvent === 'function'){
      clearInterval(iv);
      try { window._stXrefJumpEvent(eid); } catch(e){}
    } else if(tries > 60){ clearInterval(iv); console.warn('[goldlive] event jump never ready'); }
  }, 80);
}
function jumpVerse(s, v, ve){
  close();
  if(typeof window.openStartAtVerse === 'function') window.openStartAtVerse(s, v, ve);
}
function showHadith(glId){
  var e = null;
  (_cache.entries || []).forEach(function(x){ if(x.id === glId) e = x; });
  if(!e) return;
  var ids = chipsFor(e).hadith;
  close();
  if(ids.length && window.Monastic && typeof window.Monastic.showHadiths === 'function'){
    window.Monastic.showHadiths(ids, 'Hadith linked to: ' + e.title);
  }
}

function bind(ov){
  ov.addEventListener('click', function(ev){
    var t = ev.target;
    if(t.closest('#gl-close')){ close(); return; }
    var ce = t.closest('.gl-chip-ev'); if(ce){ ev.stopPropagation(); jumpEvent(ce.getAttribute('data-ev')); return; }
    var cq = t.closest('.gl-chip-q');  if(cq){ ev.stopPropagation(); jumpVerse(+cq.getAttribute('data-s'), +cq.getAttribute('data-v'), +cq.getAttribute('data-ve')); return; }
    var ch = t.closest('.gl-chip-h');  if(ch){ ev.stopPropagation(); showHadith(ch.getAttribute('data-gl')); return; }
  });
  _keyHandler = function(e){ if(e.key === 'Escape') close(); };
  document.addEventListener('keydown', _keyHandler);
}

// Slider: knob position = how far the list is scrolled; dragging the knob
// (or pressing anywhere on the line) scrolls the list. The date circle shows
// the event currently at the top of the list.
function setupSlider(ov){
  var sc = ov.querySelector('.gl-scroll'), bar = ov.querySelector('.gl-bar');
  var knob = ov.querySelector('.gl-knob'), slab = ov.querySelector('.gl-slab');
  var hd = ov.querySelector('.gl-colhd');
  if(!sc || !bar || !knob || !slab) return;
  var rows = Array.prototype.slice.call(sc.querySelectorAll('.gl-row'));
  var byId = {};
  (_cache.entries || []).forEach(function(e){ byId[e.id] = e; });
  var shownId = null;
  function maxScroll(){ return Math.max(1, sc.scrollHeight - sc.clientHeight); }
  function hdH(){ return hd ? hd.offsetHeight : 0; }
  // Reading line: the level of the date circle's centre, measured inside the list.
  var readline = document.createElement('div');
  readline.className = 'gl-readline';
  ov.appendChild(readline);
  function lineY(){
    var sr = sc.getBoundingClientRect(), cr = slab.getBoundingClientRect();
    return (cr.top + cr.height / 2) - sr.top;
  }
  function titleY(r){
    var t = r.querySelector('.gl-title');
    return t ? t.offsetTop + t.offsetHeight / 2 : r.offsetTop;
  }
  function scrollFor(r){ return Math.max(0, titleY(r) - lineY()); }
  function layout(){
    // let the last headline reach the reading line
    sc.style.paddingBottom = Math.max(30, Math.round(sc.clientHeight - lineY())) + 'px';
    var sr = sc.getBoundingClientRect(), cr = slab.getBoundingClientRect();
    readline.style.top = Math.round(cr.top + cr.height / 2) + 'px';
    readline.style.left = Math.round(cr.right + 6) + 'px';
    readline.style.width = Math.max(0, Math.round(sr.right - cr.right - 24)) + 'px';
  }
  function placePhases(){
    ov.querySelectorAll('.gl-ms').forEach(function(p){
      var r = document.getElementById('gl-row-' + p.getAttribute('data-gl'));
      if(!r) return;
      var pct = Math.max(0, Math.min(1, scrollFor(r) / maxScroll()));
      p.style.top = (pct * 100).toFixed(2) + '%';
    });
    // Keep labels from overlapping: tick stays on its true place, label moves.
    var H = bar.clientHeight, GAP = 30, list = [];
    ov.querySelectorAll('.gl-ms').forEach(function(p){ list.push({ el:p, y: parseFloat(p.style.top) / 100 * H }); });
    list.sort(function(a,b){ return a.y - b.y; });
    var pos = list.map(function(o){ return o.y; });
    for(var i = 1; i < pos.length; i++) if(pos[i] < pos[i-1] + GAP) pos[i] = pos[i-1] + GAP;
    for(var j = pos.length - 1; j >= 0; j--){
      var lim = j === pos.length - 1 ? H : pos[j+1] - GAP;
      if(pos[j] > lim) pos[j] = lim;
    }
    list.forEach(function(o, k){
      var lbl = o.el.querySelector('.gl-ms-lbl');
      if(lbl) lbl.style.transform = 'translateY(' + Math.round(pos[k] - o.y) + 'px)';
    });
  }
  // The circle shows the last event whose gold headline has reached the reading line.
  function topRow(){
    var y = sc.scrollTop + lineY() + 1, cur = rows[0];
    for(var i = 0; i < rows.length; i++){
      if(titleY(rows[i]) <= y) cur = rows[i]; else break;
    }
    return cur;
  }
  function showDate(entry){
    if(!entry || entry.id === shownId) return;
    shownId = entry.id;
    var cd = circleDate(entry);
    slab.className = 'gl-slab gl-t-' + cd.prec;
    function show(cls, on){ var el = slab.querySelector(cls); if(el) el.style.display = on ? '' : 'none'; }
    slab.querySelector('.gl-h-txt').textContent = cd.hijri;
    slab.querySelector('.gl-g-txt').textContent = cd.ce;
    show('.gl-h-cal', !!cd.hijri); show('.gl-h-txt', !!cd.hijri);
    show('.gl-g-cal', !!cd.ce);    show('.gl-g-txt', !!cd.ce);
    show('.gl-slab-sep', !!(cd.hijri && cd.ce));
    show('.gl-none-txt', !cd.hijri && !cd.ce);
    slab.title = cd.differ ? 'The sources give different dates; day and month are shown only where they all agree.' : 'All dated sources agree on this.';
    ov.querySelector('.gl-slab-differ').textContent = cd.differ ? 'views differ' : '';
    ov.querySelector('.gl-slab-title').textContent = entry.title || '';
  }
  function sync(){
    var pct = Math.max(0, Math.min(1, sc.scrollTop / maxScroll()));
    knob.style.top = (pct * 100).toFixed(2) + '%';
    var r = topRow();
    if(r) showDate(byId[r.getAttribute('data-gl')]);
  }
  function seek(clientY){
    var rc = bar.getBoundingClientRect();
    var pct = Math.max(0, Math.min(1, (clientY - rc.top) / Math.max(1, rc.height)));
    sc.scrollTop = pct * maxScroll();
    sync();
  }
  var dragging = false;
  ov.querySelectorAll('.gl-ms').forEach(function(m){
    m.addEventListener('click', function(ev){
      ev.stopPropagation();
      var r = document.getElementById('gl-row-' + m.getAttribute('data-gl'));
      if(r){ sc.scrollTop = scrollFor(r); sync(); }
    });
  });
  bar.addEventListener('pointerdown', function(e){
    if(e.target.closest('.gl-slab-wrap') || e.target.closest('.gl-ms')) return;
    dragging = true;
    bar.classList.add('gl-dragging');
    try { bar.setPointerCapture(e.pointerId); } catch(x){}
    seek(e.clientY);
    e.preventDefault();
  });
  bar.addEventListener('pointermove', function(e){ if(dragging) seek(e.clientY); });
  function stop(e){
    if(!dragging) return;
    dragging = false;
    bar.classList.remove('gl-dragging');
    try { bar.releasePointerCapture(e.pointerId); } catch(x){}
  }
  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);
  sc.addEventListener('scroll', sync, { passive: true });
  _resizeHandler = function(){ layout(); placePhases(); sync(); };
  window.addEventListener('resize', _resizeHandler);
  layout();
  placePhases();
  sync();
  setTimeout(function(){ layout(); placePhases(); sync(); }, 300);
}

function open(){
  close();
  var ov = document.createElement('div');
  ov.id = 'gl-overlay';
  ov.innerHTML =
    '<div class="gl-head">' +
      '<div class="gl-head-t">FOLLOW THE LIFE <span>· The life of the Prophet Muhammad, birth to death</span></div>' +
      '<button type="button" id="gl-close" aria-label="Close">✕</button>' +
    '</div>' +
    '<div class="gl-draft">Draft for review. Dates are shown only as the linked public sources state them; differing views are listed side by side, in no order of preference.</div>' +
    '<div class="gl-body"><div class="gl-loading">Loading…</div></div>';
  document.body.appendChild(ov);
  document.body.classList.add('gl-open');
  bind(ov);

  load().then(function(C){
    if(!document.getElementById('gl-overlay')) return;
    var body = ov.querySelector('.gl-body');
    if(!C){
      body.innerHTML = '<div class="gl-loading">This data file could not be read. Nothing is shown.</div>';
      return;
    }
    var rows = '';
    C.entries.forEach(function(e){ rows += rowHtml(e); });
    body.innerHTML =
      '<div class="gl-left">' + legendHtml() + '<div class="gl-bar">' + barHtml(C.entries) + '</div></div>' +
      '<div class="gl-scroll">' +
        '<div class="gl-colhd"><div>Entries in date order</div><div>Links</div></div>' +
        rows +
        '<div class="gl-foot">' + esc(C.entries.length) + ' entries · sources: Ibn Hisham al-Sira al-Nabawiyya, Ibn Sa\'d al-Tabaqat al-Kubra, Ibn Kathir al-Bidaya wa al-Nihaya, Ibn Qayyim Zad al-Ma\'ad, al-Tirmidhi al-Shama\'il (Arabic, OpenITI), Wikipedia, WikiShia, al-islam.org, sunnah.com, islamqa · summaries and English renderings by Gold Ark (Factory) · (est.) = year estimated by Gold Ark (AI)</div>' +
      '</div>';
    setupSlider(ov);
  });
}

function close(){
  if(_keyHandler){ document.removeEventListener('keydown', _keyHandler); _keyHandler = null; }
  if(_resizeHandler){ window.removeEventListener('resize', _resizeHandler); _resizeHandler = null; }
  var ov = document.getElementById('gl-overlay');
  if(ov) ov.remove();
  document.body.classList.remove('gl-open');
}

window.GoldLive = { open: open, close: close };
})();
