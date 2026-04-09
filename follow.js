// ═══════════════════════════════════════════════════════════
// FOLLOW VIEW — Multi-figure life journey map
// ═══════════════════════════════════════════════════════════

// ── State ──
var _fwMap = null;
var _fwInited = false;
var _fwIndex = [];              // index.json
var _fwFigures = {};            // filename -> journey data
var _fwConfCache = {};          // filename -> confidence block
var _fwSelected = {};           // filename -> true (selected figures)
var _fwFigColors = {};          // filename -> assigned colour

var _fwYear = null;             // current animation year
var _fwYearMin = 570;
var _fwYearMax = 661;
var _fwAllYears = [];           // sorted unique event years across selected
var _fwYearIdx = -1;            // index into _fwAllYears

var _fwMarkers = {};            // filename -> [L.circleMarker]
var _fwLines = {};              // filename -> [L.polyline]
var _fwEmpLayer = null;         // empire overlay layer group

var _fwPlaying = false;
var _fwTimer = null;
var _fwSpeed = 1200;
var _fwAnimCtl = null;
var _fwTickFn = null;

var _fwDDOpen = false;          // add-figures dropdown open?

// ── Figure colour palette (fixed order) ──
var _FW_FIG_PALETTE = ['#c9a84c','#6b9fb8','#8fbc8f','#b87a6b','#9b8ab8'];

// ── Category colours (for marker border rings) ──
var _FW_CAT_COLORS = {};
var _FW_CAT_PALETTE = [
  '#D4AF37','#c08850','#8a6d3b','#38bdf8','#e07090','#2ecc9b',
  '#a855f7','#e8c547','#50C878','#e05040','#c0392b','#27ae60',
  '#1abc9c','#e74c3c','#3498db','#e67e22','#d35400','#8e44ad',
  '#7f8c8d','#16a085','#2980b9'
];
var _fwCatPalIdx = 0;

// ── Grade colours ──
var _FW_GRADE_COLORS = {'A':'#4a7c59','B':'#4a6d8c','C':'#b08030','D':'#707070'};

// ═══════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════
function _fwBirthYear(file) {
  var fig = _fwFigures[file];
  if (!fig || !fig.lifespan) return 9999;
  var ls = fig.lifespan;
  if (typeof ls === 'object' && ls.birth != null) return ls.birth;
  if (typeof ls === 'string') { var n = parseInt(ls, 10); if (!isNaN(n)) return n; }
  if (fig.journey && fig.journey.length) return fig.journey[0].year || 9999;
  return 9999;
}

function _fwCatColor(cat) {
  if (!_FW_CAT_COLORS[cat]) {
    _FW_CAT_COLORS[cat] = _FW_CAT_PALETTE[_fwCatPalIdx % _FW_CAT_PALETTE.length];
    _fwCatPalIdx++;
  }
  return _FW_CAT_COLORS[cat];
}

function _fwGradeColor(g) { return _FW_GRADE_COLORS[g] || '#707070'; }

function _fwFigColor(file) {
  if (_fwFigColors[file]) return _fwFigColors[file];
  if (file === 'prophet-muhammad.json') {
    _fwFigColors[file] = _FW_FIG_PALETTE[0];
  } else {
    var idx = 1;
    for (var i = 0; i < _fwIndex.length; i++) {
      if (_fwIndex[i].file === 'prophet-muhammad.json') continue;
      if (_fwIndex[i].file === file) {
        _fwFigColors[file] = _FW_FIG_PALETTE[idx % _FW_FIG_PALETTE.length];
        break;
      }
      idx++;
    }
  }
  return _fwFigColors[file] || _FW_FIG_PALETTE[0];
}

function _fwFmtDate(entry) {
  var M = ['','January','February','March','April','May','June',
    'July','August','September','October','November','December'];
  if (entry.precision === 'day' && entry.day && entry.month)
    return entry.day + ' ' + M[entry.month] + ' ' + entry.year + ' CE';
  if (entry.precision === 'month' && entry.month)
    return M[entry.month] + ' ' + entry.year + ' CE';
  if (entry.precision === 'period' && entry.period_end)
    return entry.year + ' \u2013 ' + entry.period_end + ' CE';
  if (entry.precision === 'decade')
    return entry.year + 's CE';
  return entry.year + ' CE';
}

function _fwPrecLabel(p) {
  if (p === 'day') return 'Exact date';
  if (p === 'month') return 'Month-level';
  if (p === 'year') return 'Year-level';
  if (p === 'period') return 'Approximate period';
  if (p === 'decade') return 'Approximate decade';
  return p;
}

function _fwSelectedFiles() {
  var out = [];
  for (var f in _fwSelected) { if (_fwSelected[f]) out.push(f); }
  return out;
}

function _fwSelectedCount() {
  var n = 0;
  for (var f in _fwSelected) { if (_fwSelected[f]) n++; }
  return n;
}

function _fwEventAtYear(file, year) {
  var fig = _fwFigures[file];
  if (!fig) return null;
  var best = null;
  for (var i = 0; i < fig.journey.length; i++) {
    if (fig.journey[i].year <= year) best = { idx: i, entry: fig.journey[i] };
    else break;
  }
  return best;
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
function initFollow() {
  document.body.classList.add('fw-active');
  var container = document.getElementById('follow-view');
  if (!container) return;

  if (!_fwInited) {
    _fwBuildDOM(container);
    _fwInited = true;
    var fwMount = document.getElementById('fw-anim-mount');
    if(fwMount && window.AnimControls){
      _fwAnimCtl = window.AnimControls.create({
        mountEl: fwMount, idPrefix: 'fw', initialSpeed: '1x',
        onPlay: _fwAnimPlay, onPause: _fwAnimPause, onStop: _fwAnimStopFull,
        onSpeedChange: function(ms){ _fwSpeed = ms; if(_fwPlaying){ clearInterval(_fwTimer); _fwTimer = setInterval(_fwTickFn, _fwSpeed); } }
      });
    }
    window.addEventListener('resize', function() {
      if (VIEW === 'follow' && _fwMap) _fwMap.invalidateSize();
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', function(ev) {
      if (!_fwDDOpen) return;
      var panel = document.getElementById('fw-add-panel');
      var btn = document.getElementById('fw-add-btn');
      if (panel && !panel.contains(ev.target) && btn && !btn.contains(ev.target)) {
        _fwCloseDD();
      }
    });
  }

  _fwLoadAll(function() {
    _fwAssignColors();
    _fwBuildLeftRail();
    if (_fwSelectedCount() === 0 && _fwIndex.length > 0) {
      _fwSelected[_fwIndex[0].file] = true;
    }
    _fwUpdateFollowingList();
    _fwRebuild();
  });
}

// ═══════════════════════════════════════════════════════════
// DOM — FIX 2: #fw-topbar is first child, above #fw-body
// ═══════════════════════════════════════════════════════════
function _fwBuildDOM(container) {
  container.innerHTML =
    '<div id="fw-topbar">' +
      '<div id="fw-scrubber">' +
        '<div id="fw-scrubber-track">' +
          '<div id="fw-scrubber-fill"></div>' +
          '<div id="fw-scrubber-marks"></div>' +
          '<div id="fw-scrubber-thumb"></div>' +
        '</div>' +
        '<div id="fw-scrubber-labels">' +
          '<span id="fw-scrub-start"></span>' +
          '<span id="fw-scrub-current"></span>' +
          '<span id="fw-scrub-end"></span>' +
        '</div>' +
      '</div>' +
      '<div id="fw-anim-mount" style="display:flex;align-items:center;margin-left:auto"></div>' +
    '</div>' +
    '<div id="fw-body">' +
      '<div id="fw-left-rail">' +
        '<div id="fw-grades-section">' +
          '<div class="fw-rail-header">GRADES</div>' +
          '<div class="fw-grade-legend-row"><span class="fw-grade-pill" style="background:#4a7c59">A</span> Highly confident</div>' +
          '<div class="fw-grade-legend-row"><span class="fw-grade-pill" style="background:#4a6d8c">B</span> Mostly confident</div>' +
          '<div class="fw-grade-legend-row"><span class="fw-grade-pill" style="background:#b08030">C</span> Some uncertainty</div>' +
          '<div class="fw-grade-legend-row"><span class="fw-grade-pill" style="background:#707070">D</span> Weak / traditional</div>' +
        '</div>' +
        '<div class="fw-rail-divider"></div>' +
        '<div id="fw-add-wrap">' +
          '<button id="fw-add-btn" onclick="_fwToggleDD(event)">\u25BC Add figures to follow</button>' +
          '<div id="fw-add-panel" style="display:none"></div>' +
        '</div>' +
        '<div class="fw-rail-divider"></div>' +
        '<div id="fw-following-section">' +
          '<div class="fw-rail-header">FOLLOWING</div>' +
          '<div id="fw-following-list"></div>' +
        '</div>' +
      '</div>' +
      '<div id="fw-map-wrap">' +
        '<div id="fw-leaflet"></div>' +
      '</div>' +
      '<div id="fw-feed">' +
        '<div id="fw-feed-inner"></div>' +
      '</div>' +
    '</div>';
}

// ═══════════════════════════════════════════════════════════
// LOAD ALL DATA
// ═══════════════════════════════════════════════════════════
function _fwLoadAll(cb) {
  if (_fwIndex.length > 0 && Object.keys(_fwFigures).length === _fwIndex.length) { cb(); return; }
  fetch('data/islamic/journeys/index.json?v=' + Date.now())
    .then(function(r) { return r.json(); })
    .then(function(arr) {
      console.log('[FOLLOW] index.json loaded:', arr.length, 'figures');
      _fwIndex = arr;
      var pending = arr.length;
      if (pending === 0) { cb(); return; }
      arr.forEach(function(item) {
        fetch('data/islamic/journeys/' + item.file)
          .then(function(r) { return r.json(); })
          .then(function(data) {
            data.journey.sort(function(a, b) {
              return a.year !== b.year ? a.year - b.year : (a.month || 0) - (b.month || 0);
            });
            _fwFigures[item.file] = data;
            _fwConfCache[item.file] = data.confidence || null;
          })
          .catch(function(e) { console.warn('[FOLLOW] Load failed:', item.file, e); })
          .then(function() { pending--; if (pending === 0) { _fwExposeCache(); cb(); } });
      });
    })
    .catch(function() { _fwIndex = []; cb(); });
}

// ── Expose journey cache for MAP view ──
function _fwExposeCache(){
  window._journeyCache = _fwFigures;
  // Build slug -> filename reverse map
  var _slugToFile = {};
  _fwIndex.forEach(function(item){
    var d = _fwFigures[item.file];
    if(d && d.slug) _slugToFile[d.slug] = item.file;
  });
  window._getJourneyLocation = function(slug, year){
    var file = _slugToFile[slug];
    if(!file) return null;
    var d = _fwFigures[file];
    if(!d || !d.journey || !d.journey.length) return null;
    var j = d.journey;
    if(year < j[0].year) return {lat: j[0].lat, lng: j[0].lng};
    var best = j[0];
    for(var i = 1; i < j.length; i++){
      if(j[i].year <= year) best = j[i];
      else break;
    }
    return (best.lat != null && best.lng != null) ? {lat: best.lat, lng: best.lng} : null;
  };
}

function _fwAssignColors() {
  _fwFigColors = {};
  _fwIndex.forEach(function(item) { _fwFigColor(item.file); });
}

// ═══════════════════════════════════════════════════════════
// FIX 4: LEFT RAIL — Dropdown picker + Following list
// ═══════════════════════════════════════════════════════════
function _fwBuildLeftRail() {
  _fwBuildAddPanel();
  _fwUpdateFollowingList();
}

function _fwBuildAddPanel() {
  var panel = document.getElementById('fw-add-panel');
  if (!panel) return;
  console.log('[FOLLOW] Building add-panel with', _fwIndex.length, 'figures');
  panel.innerHTML = '';

  // Search input
  var search = document.createElement('input');
  search.type = 'text';
  search.id = 'fw-add-search';
  search.placeholder = 'Search figures...';
  search.onclick = function(ev) { ev.stopPropagation(); };
  search.oninput = function() {
    var q = search.value.toLowerCase();
    var rows = panel.querySelectorAll('.fw-dd-row');
    rows.forEach(function(row) {
      var name = row.querySelector('.fw-dd-name');
      var match = !q || (name && name.textContent.toLowerCase().indexOf(q) !== -1);
      row.style.display = match ? '' : 'none';
    });
  };
  panel.appendChild(search);

  // Sort index chronologically by birth year (earliest first), tiebreak alphabetical
  var sorted = _fwIndex.slice().sort(function(a, b){
    var da = _fwBirthYear(a.file);
    var db = _fwBirthYear(b.file);
    if(da !== db) return da - db;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach(function(item) {
    var conf = _fwConfCache[item.file];
    var col = _fwFigColor(item.file);

    var row = document.createElement('div');
    row.className = 'fw-dd-row';
    row.dataset.file = item.file;

    var ck = document.createElement('span');
    ck.className = 'fw-dd-ck';
    ck.textContent = _fwSelected[item.file] ? '\u2713' : '';
    row.appendChild(ck);

    var dot = document.createElement('span');
    dot.className = 'fw-follow-dot';
    dot.style.background = col;
    row.appendChild(dot);

    var name = document.createElement('span');
    name.className = 'fw-dd-name';
    name.textContent = item.name;
    row.appendChild(name);

    if (conf && conf.grade) {
      var badge = document.createElement('span');
      badge.className = 'fw-grade-pill';
      badge.textContent = conf.grade;
      badge.style.background = _fwGradeColor(conf.grade);
      row.appendChild(badge);
    }

    row.onclick = function(ev) {
      ev.stopPropagation();
      _fwToggleSelection(item.file);
    };
    panel.appendChild(row);
  });
}

function _fwToggleDD(ev) {
  if (ev) ev.stopPropagation();
  var panel = document.getElementById('fw-add-panel');
  if (!panel) return;
  _fwDDOpen = !_fwDDOpen;
  panel.style.display = _fwDDOpen ? 'block' : 'none';
  if (_fwDDOpen) {
    var search = document.getElementById('fw-add-search');
    if (search) { search.value = ''; }
    var rows = panel.querySelectorAll('.fw-dd-row');
    rows.forEach(function(r) { r.style.display = ''; });
    _fwUpdateDDChecks();
  }
}

function _fwCloseDD() {
  _fwDDOpen = false;
  var panel = document.getElementById('fw-add-panel');
  if (panel) panel.style.display = 'none';
}

function _fwUpdateDDChecks() {
  var rows = document.querySelectorAll('.fw-dd-row');
  rows.forEach(function(row) {
    var file = row.dataset.file;
    var ck = row.querySelector('.fw-dd-ck');
    if (ck) ck.textContent = _fwSelected[file] ? '\u2713' : '';
    row.classList.toggle('selected', !!_fwSelected[file]);
  });
}

function _fwToggleSelection(file) {
  if (_fwSelected[file]) {
    if (_fwSelectedCount() <= 1) return;
    delete _fwSelected[file];
  } else {
    _fwSelected[file] = true;
  }
  _fwUpdateDDChecks();
  _fwUpdateFollowingList();
  _fwAnimStopFull();
  _fwYear = null;
  _fwYearIdx = -1;
  _fwRebuild();
}

function _fwUpdateFollowingList() {
  var list = document.getElementById('fw-following-list');
  if (!list) return;
  list.innerHTML = '';

  _fwSelectedFiles().forEach(function(file) {
    var item = null;
    for (var i = 0; i < _fwIndex.length; i++) {
      if (_fwIndex[i].file === file) { item = _fwIndex[i]; break; }
    }
    if (!item) return;
    var conf = _fwConfCache[file];
    var col = _fwFigColor(file);

    var row = document.createElement('div');
    row.className = 'fw-follow-row';

    var dot = document.createElement('span');
    dot.className = 'fw-follow-dot';
    dot.style.background = col;
    row.appendChild(dot);

    var name = document.createElement('span');
    name.className = 'fw-follow-name';
    name.textContent = item.name;
    row.appendChild(name);

    if (conf && conf.grade) {
      var badge = document.createElement('span');
      badge.className = 'fw-grade-pill';
      badge.textContent = conf.grade;
      badge.style.background = _fwGradeColor(conf.grade);
      row.appendChild(badge);
    }

    var x = document.createElement('span');
    x.className = 'fw-follow-x';
    x.textContent = '\u00d7';
    x.title = 'Remove';
    x.onclick = function(ev) {
      ev.stopPropagation();
      _fwToggleSelection(file);
    };
    row.appendChild(x);

    list.appendChild(row);
  });
}

// ═══════════════════════════════════════════════════════════
// REBUILD — called when selection changes
// ═══════════════════════════════════════════════════════════
function _fwRebuild() {
  _fwComputeYearRange();
  _fwInitMap();
  _fwBuildScrubber();
  _fwBuildFeed();
}

function _fwComputeYearRange() {
  var yearsSet = {};
  var minY = Infinity, maxY = -Infinity;
  _fwSelectedFiles().forEach(function(file) {
    var fig = _fwFigures[file];
    if (!fig) return;
    fig.journey.forEach(function(e) {
      yearsSet[e.year] = true;
      if (e.year < minY) minY = e.year;
      var end = e.period_end || e.year;
      if (end > maxY) maxY = end;
    });
  });
  var years = [];
  for (var y in yearsSet) years.push(parseInt(y));
  years.sort(function(a, b) { return a - b; });
  _fwAllYears = years;
  _fwYearMin = minY === Infinity ? 570 : minY;
  _fwYearMax = maxY === -Infinity ? 661 : maxY;
}

// ═══════════════════════════════════════════════════════════
// TIMELINE FEED (right column)
// FIX 3: Only show entries where year <= _fwYear
// FIX 5: Compact single-line format with expand
// ═══════════════════════════════════════════════════════════
var _fwFeedEntries = [];
var _fwExpandedIdx = -1; // only one expanded at a time when paused

function _fwBuildFeed() {
  var container = document.getElementById('fw-feed-inner');
  if (!container) return;

  // Merge all journey entries from selected figures, sorted by year
  _fwFeedEntries = [];
  _fwSelectedFiles().forEach(function(file) {
    var fig = _fwFigures[file];
    if (!fig) return;
    var conf = _fwConfCache[file];
    fig.journey.forEach(function(entry) {
      _fwFeedEntries.push({
        file: file,
        name: fig.person,
        color: _fwFigColor(file),
        year: entry.year,
        entry: entry,
        conf: conf
      });
    });
  });
  _fwFeedEntries.sort(function(a, b) {
    return a.year !== b.year ? a.year - b.year : (a.entry.month || 0) - (b.entry.month || 0);
  });

  // Build all rows (visibility controlled by _fwUpdateFeedActive)
  var html = '';
  _fwFeedEntries.forEach(function(item, idx) {
    var e = item.entry;
    var shortName = item.name.split(' ').slice(0, 2).join(' ');
    var cat = (e.category || '').charAt(0).toUpperCase() + (e.category || '').slice(1);
    var ageStr = (e.age !== undefined) ? 'Age ' + e.age + ' ' : '';

    html += '<div class="fw-feed-row" data-idx="' + idx + '" data-year="' + item.year + '" onclick="_fwFeedClick(' + idx + ')" style="display:none">';
    html += '<div class="fw-feed-summary">';
    html += '<span class="fw-feed-year">' + item.year + '</span> ';
    html += '<span class="fw-feed-dot" style="background:' + item.color + '"></span> ';
    html += '<span class="fw-feed-figname">' + shortName + '</span>';
    html += ' <span class="fw-feed-title">\u2014 ' + ageStr + cat + '</span>';
    html += ' <span class="fw-feed-arrow">\u25BE</span>';
    html += '</div>';
    html += '<div class="fw-feed-detail">';
    html += '<div class="fw-feed-loc">' + e.location + (e.modern ? ', ' + e.modern : '') + '</div>';
    html += '<div class="fw-feed-desc">' + (e.event || '') + '</div>';
    html += '<div class="fw-feed-source">' + (e.source || '') + '</div>';
    html += '<div class="fw-feed-meta">' + _fwPrecLabel(e.precision) + '</div>';
    html += '</div>';
    html += '</div>';
  });

  if (_fwFeedEntries.length === 0) {
    html = '<div class="fw-feed-empty">Select figures to see their journey</div>';
  }

  container.innerHTML = html;
  _fwExpandedIdx = -1;
  _fwUpdateFeedActive();
}

function _fwFeedClick(idx) {
  var item = _fwFeedEntries[idx];
  if (!item) return;

  // Jump scrubber to this year
  _fwGoToYear(item.year);

  // Pan map to this location
  if (_fwMap) {
    _fwMap.panTo([item.entry.lat, item.entry.lng], { animate: true, duration: 0.5 });
  }

  // Toggle expand when paused — only one at a time
  if (!_fwPlaying) {
    if (_fwExpandedIdx === idx) {
      _fwExpandedIdx = -1;
    } else {
      _fwExpandedIdx = idx;
    }
    _fwApplyExpanded();
  }
}

function _fwApplyExpanded() {
  var rows = document.querySelectorAll('.fw-feed-row');
  rows.forEach(function(row) {
    var i = parseInt(row.dataset.idx);
    var isExp = (i === _fwExpandedIdx);
    row.classList.toggle('expanded', isExp);
    var arrow = row.querySelector('.fw-feed-arrow');
    if (arrow) arrow.textContent = isExp ? '\u25B4' : '\u25BE';
  });
}

function _fwUpdateFeedActive() {
  var rows = document.querySelectorAll('.fw-feed-row');
  var activeRow = null;
  var currentYear = _fwYear;

  rows.forEach(function(row) {
    var yr = parseInt(row.dataset.year);
    var idx = parseInt(row.dataset.idx);

    // FIX 3: Only show entries at or before current year
    var visible = (currentYear !== null && yr <= currentYear);
    row.style.display = visible ? '' : 'none';

    // Active = the most recent visible entry matching current year
    var isActive = (currentYear !== null && yr === currentYear);
    row.classList.toggle('active', isActive);
    if (isActive) activeRow = row;

    // During playback, auto-expand only the active row
    if (_fwPlaying) {
      var isExp = isActive;
      row.classList.toggle('expanded', isExp);
      var arrow = row.querySelector('.fw-feed-arrow');
      if (arrow) arrow.textContent = isExp ? '\u25B4' : '\u25BE';
      if (isExp) _fwExpandedIdx = idx;
    }
  });

  // Auto-scroll active row to center of feed
  if (activeRow) {
    var feed = document.getElementById('fw-feed');
    if (feed) {
      var feedH = feed.clientHeight;
      var rowTop = activeRow.offsetTop - feed.offsetTop;
      var rowH = activeRow.offsetHeight;
      feed.scrollTop = rowTop - (feedH / 2) + (rowH / 2);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// LEAFLET MAP
// ═══════════════════════════════════════════════════════════
function _fwInitMap() {
  var files = _fwSelectedFiles();
  if (files.length === 0) return;

  var allLats = [], allLngs = [];
  files.forEach(function(file) {
    var fig = _fwFigures[file];
    if (!fig) return;
    fig.journey.forEach(function(e) {
      allLats.push(e.lat);
      allLngs.push(e.lng);
    });
  });
  if (allLats.length === 0) return;

  if (_fwMap) { _fwMap.remove(); _fwMap = null; }
  _fwMarkers = {};
  _fwLines = {};
  _fwEmpLayer = null;

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var mapEl = document.getElementById('fw-leaflet');
      if (!mapEl) return;

      var bounds = L.latLngBounds(
        [Math.min.apply(null, allLats) - 1, Math.min.apply(null, allLngs) - 2],
        [Math.max.apply(null, allLats) + 1, Math.max.apply(null, allLngs) + 2]
      );

      _fwMap = L.map(mapEl, { zoomControl: true, attributionControl: true });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '\u00a9 <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors \u00a9 <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(_fwMap);

      _fwMap.fitBounds(bounds, { padding: [30, 30] });

      // Empire overlay (below markers)
      _fwEmpLayer = _drawEmpiresOnMap(_fwMap, _fwYear, _fwEmpLayer);

      _fwBuildMarkers();

      setTimeout(function() {
        if (_fwMap) _fwMap.invalidateSize();
      }, 800);
    });
  });
}

function _fwBuildMarkers() {
  var files = _fwSelectedFiles();
  files.forEach(function(file) {
    var fig = _fwFigures[file];
    if (!fig) return;
    var figCol = _fwFigColor(file);
    var markers = [];
    var lines = [];

    fig.journey.forEach(function(entry, i) {
      var catCol = _fwCatColor(entry.category);
      var isPeriod = entry.precision === 'period';
      var radius = isPeriod ? 14 : entry.precision === 'day' ? 7 :
                   entry.precision === 'month' ? 6 : 5;

      var m = L.circleMarker([entry.lat, entry.lng], {
        radius: radius,
        fillColor: figCol,
        color: catCol,
        weight: 2,
        fillOpacity: 0.85,
        opacity: isPeriod ? 0.5 : 1
      });

      m.bindTooltip(
        '<b style="color:' + figCol + '">' + fig.person + '</b><br>' +
        entry.location + '<br>' + _fwFmtDate(entry),
        { direction: 'top', offset: [0, -8], className: 'fw-tooltip' }
      );

      m.on('click', function() {
        _fwGoToYear(entry.year);
      });

      m._fwVisible = false;
      markers.push(m);

      if (i > 0) {
        var prev = fig.journey[i - 1];
        var line = L.polyline(
          [[prev.lat, prev.lng], [entry.lat, entry.lng]],
          { color: figCol, weight: 2, opacity: 0.35, dashArray: '6,4' }
        );
        line._fwVisible = false;
        lines.push(line);
      }
    });

    _fwMarkers[file] = markers;
    _fwLines[file] = lines;
  });

  _fwShowAll();
}

function _fwShowAll() {
  _fwSelectedFiles().forEach(function(file) {
    var markers = _fwMarkers[file] || [];
    var lines = _fwLines[file] || [];
    markers.forEach(function(m) {
      if (!m._fwVisible) { m.addTo(_fwMap); m._fwVisible = true; }
      m.setStyle({ fillOpacity: 0.4, opacity: 0.4, weight: 1.5 });
    });
    lines.forEach(function(l) {
      if (!l._fwVisible) { l.addTo(_fwMap); l._fwVisible = true; }
      l.setStyle({ opacity: 0.15 });
    });
  });
}

// ═══════════════════════════════════════════════════════════
// UPDATE MAP FOR YEAR
// ═══════════════════════════════════════════════════════════
function _fwUpdateMapForYear(year) {
  if (!_fwMap) return;

  _fwEmpLayer = _drawEmpiresOnMap(_fwMap, year, _fwEmpLayer);

  var activePts = [];

  _fwSelectedFiles().forEach(function(file) {
    var fig = _fwFigures[file];
    if (!fig) return;
    var markers = _fwMarkers[file] || [];
    var lines = _fwLines[file] || [];
    var figCol = _fwFigColor(file);
    var lastIdx = -1;

    markers.forEach(function(m, i) {
      var entry = fig.journey[i];
      var catCol = _fwCatColor(entry.category);
      var isPeriod = entry.precision === 'period';
      if (entry.year <= year) {
        if (!m._fwVisible) { m.addTo(_fwMap); m._fwVisible = true; }
        lastIdx = i;
        m.setStyle({
          fillColor: figCol, color: catCol,
          fillOpacity: 0.5, opacity: 0.7, weight: 1.5
        });
        m.setRadius(isPeriod ? 12 : entry.precision === 'day' ? 6 :
                    entry.precision === 'month' ? 5 : 4);
      } else {
        if (m._fwVisible) { _fwMap.removeLayer(m); m._fwVisible = false; }
      }
    });

    if (lastIdx >= 0) {
      var m = markers[lastIdx];
      var entry = fig.journey[lastIdx];
      var catCol = _fwCatColor(entry.category);
      var isPeriod = entry.precision === 'period';
      var isExact = entry.year === year;

      if (isExact) {
        m.setStyle({
          fillColor: figCol, color: '#FFFFFF',
          fillOpacity: 1, opacity: 1, weight: 3
        });
        m.setRadius(isPeriod ? 16 : 9);
      } else {
        m.setStyle({
          fillColor: figCol, color: catCol,
          fillOpacity: 0.35, opacity: 0.5, weight: 2
        });
        m.setRadius(isPeriod ? 14 : 7);
      }
      m.bringToFront();
      activePts.push([entry.lat, entry.lng]);
    }

    lines.forEach(function(l, i) {
      if (i + 1 <= lastIdx) {
        if (!l._fwVisible) { l.addTo(_fwMap); l._fwVisible = true; }
        l.setStyle({ opacity: 0.5 });
      } else {
        if (l._fwVisible) { _fwMap.removeLayer(l); l._fwVisible = false; }
      }
    });
  });

  if (activePts.length > 0) {
    var b = L.latLngBounds(activePts);
    var mapBounds = _fwMap.getBounds().pad(-0.15);
    if (!mapBounds.contains(b)) {
      if (activePts.length === 1) {
        _fwMap.panTo(activePts[0], { animate: true, duration: 0.5 });
      } else {
        _fwMap.fitBounds(b.pad(0.4), {
          animate: true, duration: 0.5,
          maxZoom: Math.max(_fwMap.getZoom(), 5)
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════
// SCRUBBER
// ═══════════════════════════════════════════════════════════
function _fwBuildScrubber() {
  var startEl = document.getElementById('fw-scrub-start');
  var endEl = document.getElementById('fw-scrub-end');
  if (startEl) startEl.textContent = _fwYearMin + ' CE';
  if (endEl) endEl.textContent = _fwYearMax + ' CE';

  var marksEl = document.getElementById('fw-scrubber-marks');
  if (!marksEl) return;
  marksEl.innerHTML = '';
  var range = _fwYearMax - _fwYearMin || 1;

  _fwSelectedFiles().forEach(function(file) {
    var fig = _fwFigures[file];
    if (!fig) return;
    var col = _fwFigColor(file);
    fig.journey.forEach(function(entry) {
      var pct = ((entry.year - _fwYearMin) / range) * 100;
      var tick = document.createElement('div');
      tick.className = 'fw-scrub-tick';
      tick.style.left = pct + '%';
      tick.style.background = col;
      tick.title = fig.person + ': ' + entry.location + ' (' + entry.year + ')';
      tick.onclick = function(ev) { ev.stopPropagation(); _fwGoToYear(entry.year); };
      marksEl.appendChild(tick);
    });
  });

  var track = document.getElementById('fw-scrubber-track');
  if (track) {
    track.onmousedown = function(ev) { _fwScrubStart(ev); };
    track.ontouchstart = function(ev) { _fwScrubStart(ev); };
  }

  _fwUpdateScrubberUI();
}

function _fwScrubStart(ev) {
  ev.preventDefault();
  _fwScrubMove(ev);
  var onMove = function(e) { _fwScrubMove(e); };
  var onUp = function() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('touchend', onUp);
  };
  document.addEventListener('mousemove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchmove', onMove);
  document.addEventListener('touchend', onUp);
}

function _fwScrubMove(ev) {
  var track = document.getElementById('fw-scrubber-track');
  var rect = track.getBoundingClientRect();
  var clientX = ev.touches ? ev.touches[0].clientX : ev.clientX;
  var pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  var targetYear = Math.round(_fwYearMin + pct * (_fwYearMax - _fwYearMin));

  var best = _fwAllYears[0] || _fwYearMin;
  var bestDist = Infinity;
  _fwAllYears.forEach(function(y) {
    var d = Math.abs(y - targetYear);
    if (d < bestDist) { bestDist = d; best = y; }
  });
  _fwGoToYear(best);
}

function _fwUpdateScrubberUI() {
  var fill = document.getElementById('fw-scrubber-fill');
  var thumb = document.getElementById('fw-scrubber-thumb');
  var cur = document.getElementById('fw-scrub-current');

  if (!fill || !thumb) return;

  if (_fwYear === null) {
    fill.style.width = '0%';
    thumb.style.left = '0%';
    thumb.style.opacity = '0';
    if (cur) cur.textContent = '';
    return;
  }

  var range = _fwYearMax - _fwYearMin || 1;
  var pct = ((_fwYear - _fwYearMin) / range) * 100;
  fill.style.width = pct + '%';
  thumb.style.left = pct + '%';
  thumb.style.opacity = '1';
  if (cur) cur.textContent = _fwYear + ' CE';
}

// ═══════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════
function _fwGoToYear(year) {
  _fwYear = year;
  for (var i = 0; i < _fwAllYears.length; i++) {
    if (_fwAllYears[i] >= year) { _fwYearIdx = i; break; }
  }
  _fwUpdateMapForYear(year);
  _fwUpdateScrubberUI();
  _fwUpdateFeedActive();
}

// ═══════════════════════════════════════════════════════════
// ANIMATION
// ═══════════════════════════════════════════════════════════
function _fwAnimPlay() {
  if (_fwAllYears.length === 0) return;
  _fwSpeed = _fwAnimCtl ? _fwAnimCtl.getSpeedMs() : 1200;

  if (!_fwTickFn || _fwYearIdx < 0 || _fwYearIdx >= _fwAllYears.length - 1) {
    // Fresh start — reset markers
    _fwYearIdx = -1;
    _fwYear = null;
    _fwSelectedFiles().forEach(function(file) {
      (_fwMarkers[file] || []).forEach(function(m) {
        if (m._fwVisible) { _fwMap.removeLayer(m); m._fwVisible = false; }
      });
      (_fwLines[file] || []).forEach(function(l) {
        if (l._fwVisible) { _fwMap.removeLayer(l); l._fwVisible = false; }
      });
    });
  }
  // else: resume from current _fwYearIdx

  _fwPlaying = true;
  _fwTickFn = function() {
    var next = _fwYearIdx + 1;
    if (next >= _fwAllYears.length) { _fwAnimStopFull(); return; }
    _fwYearIdx = next;
    _fwGoToYear(_fwAllYears[next]);
  };
  _fwTimer = setInterval(_fwTickFn, _fwSpeed);
}

function _fwAnimPause() {
  _fwPlaying = false;
  if (_fwTimer) { clearInterval(_fwTimer); _fwTimer = null; }
}

function _fwAnimStopFull() {
  _fwPlaying = false;
  if (_fwTimer) { clearInterval(_fwTimer); _fwTimer = null; }
  _fwYearIdx = -1;
  _fwYear = null;
  _fwTickFn = null;
  if (_fwAnimCtl) _fwAnimCtl.forceStop();
  // Reveal all markers for selected figures
  _fwSelectedFiles().forEach(function(file) {
    (_fwMarkers[file] || []).forEach(function(m) {
      if (!m._fwVisible) { m.addTo(_fwMap); m._fwVisible = true; }
    });
    (_fwLines[file] || []).forEach(function(l) {
      if (!l._fwVisible) { l.addTo(_fwMap); l._fwVisible = true; }
    });
  });
  _fwUpdateScrubberUI();
}

// ═══════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════
function _fwCleanup() {
  _fwAnimStopFull();
  document.body.classList.remove('fw-active');
}

// ═══════════════════════════════════════════════════════════
// PRELOAD JOURNEY INDEX + GLOBAL EXPOSE
// ═══════════════════════════════════════════════════════════
window._journeyFigures = null; // Set of F-code slugs

// Hardcoded fallback for journey names that don't match core.json famous exactly
var _FW_NAME_MAP = {
  'Abd al-Qadir al-Jilani':'Abdul Qadir al-Jilani',
  'Abu Bakr as-Siddiq':'Abu Bakr al-Siddiq',
  'Abu Dawud al-Sijistani':'Abu Dawud',
  'Abu Hanifa':'Imam Abu Hanifa',
  'Bayazid Bistami':'Abu Yazid al-Bistami',
  'Junayd al-Baghdadi':'Junayd of Baghdad',
  'Rabia al-Adawiyya':'Rabia al-Basri',
  'Evliya \u00C7elebi':'Evliya Celebi',
  'Hayreddin Barbarossa':'Khayr al-Din Barbarossa'
};

function _fwResolveName(journeyName){
  if(typeof PEOPLE==='undefined') return null;
  // Exact match
  var p = PEOPLE.find(function(pp){ return pp.famous===journeyName; });
  if(p) return p;
  // Hardcoded fallback
  var mapped = _FW_NAME_MAP[journeyName];
  if(mapped){ p = PEOPLE.find(function(pp){ return pp.famous===mapped; }); if(p) return p; }
  // Core famous is substring of journey name (handles parentheticals like "Al-Zahrawi (Abulcasis)")
  var matches = PEOPLE.filter(function(pp){ return pp.famous && pp.famous.length>3 && journeyName.indexOf(pp.famous)!==-1; });
  if(matches.length===1) return matches[0];
  return null;
}

window._fwGetSelectedSlug = function(){
  var files = _fwSelectedFiles();
  if(!files.length) return null;
  var fig = _fwFigures[files[0]];
  if(!fig) return null;
  var p = _fwResolveName(fig.name || _fwIndex.find(function(i){return i.file===files[0];})?.name);
  return p ? p.slug : null;
};

window._preloadJourneyIndex = function(){
  if(window._journeyFigures) return Promise.resolve(window._journeyFigures);
  return fetch('data/islamic/journeys/index.json')
    .then(function(r){ return r.json(); })
    .then(function(arr){
      _fwIndex = arr;
      var set = new Set();
      arr.forEach(function(item){
        var p = _fwResolveName(item.name);
        if(p && p.slug) set.add(p.slug);
      });
      window._journeyFigures = set;
      // Update header stat
      var el = document.getElementById('statFollowLives');
      if(el) el.textContent = 'Follow ' + set.size + ' Lives';
      return set;
    })
    .catch(function(){ window._journeyFigures = new Set(); return window._journeyFigures; });
};

window._followShowFigure = function(slug){
  if(!slug) return;
  // Find the journey file for this slug
  var file = null;
  if(typeof PEOPLE!=='undefined'){
    var p = PEOPLE.find(function(pp){ return pp.slug===slug; });
    if(p){
      for(var i=0; i<_fwIndex.length; i++){
        // Check direct name match or resolved match
        var resolved = _fwResolveName(_fwIndex[i].name);
        if(resolved && resolved.slug===slug){ file=_fwIndex[i].file; break; }
      }
    }
  }
  if(!file) return;
  // Switch to follow view
  if(typeof setView==='function') setView('follow');
  // Wait for follow to init, then select the figure
  _fwLoadAll(function(){
    _fwSelected = {};
    _fwSelected[file] = true;
    _fwUpdateDDChecks();
    _fwUpdateFollowingList();
    _fwAnimStopFull();
    _fwYear = null;
    _fwYearIdx = -1;
    _fwRebuild();
  });
};

// Show tagline when entering follow view
(function(){
  var _origSV=window.setView;
  if(!_origSV) return;
  window.setView=function(v){
    _origSV(v);
    if(v==='follow'){
      if(typeof _showViewDesc==='function') _showViewDesc('Follow a figure through their life');
    }
  };
})();
