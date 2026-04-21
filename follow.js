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
var _fwLabTile = null;          // labels-on-top tile from mapbase

var _fwPlaying = false;
var _fwTimer = null;
var _fwSpeed = 1200;
var _fwAnimCtl = null;
var _fwTickFn = null;

var _fwDDOpen = false;          // add-figures dropdown open?
var _fwUserDrag = false;        // true while user is dragging/zooming map
var _fwLastEmpYear = null;       // throttle empire re-rendering

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
        onSpeedChange: function(ms){ _fwSpeed = ms; if(_fwPlaying){ clearTimeout(_fwTimer); _fwTimer = setTimeout(_fwTickFn, _fwSpeed); } }
      });
    }
    var _fwHowBtn=document.getElementById('fw-how-btn');
    if(_fwHowBtn) _fwHowBtn.addEventListener('click',function(e){e.stopPropagation();_showFollowMethodology();});
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
      '<div id="fw-l1" style="display:flex;align-items:center;gap:10px;padding:6px 16px;border-bottom:1px solid rgba(45,55,72,0.5)">' +
        '<div id="fw-add-wrap">' +
          '<button id="fw-add-btn" onclick="_fwToggleDD(event)">\u25BC Add figures to follow</button>' +
          '<div id="fw-add-panel" style="display:none"></div>' +
        '</div>' +
        '<div id="fw-following-list"></div>' +
        '<div style="flex:1"></div>' +
        '<div id="fw-grades-inline">' +
          '<span class="fw-grade-pill" style="background:#4a7c59">A</span> Highly' +
          '<span class="fw-gi-sep">\u00b7</span>' +
          '<span class="fw-grade-pill" style="background:#4a6d8c">B</span> Mostly' +
          '<span class="fw-gi-sep">\u00b7</span>' +
          '<span class="fw-grade-pill" style="background:#b08030">C</span> Some' +
          '<span class="fw-gi-sep">\u00b7</span>' +
          '<span class="fw-grade-pill" style="background:#707070">D</span> Weak' +
        '</div>' +
      '</div>' +
      '<div id="fw-l2" style="display:flex;align-items:center;gap:10px;padding:6px 16px;border-bottom:1px solid rgba(45,55,72,0.5)">' +
        '<button id="fw-how-btn" style="height:26px;padding:0 12px;border-radius:13px;border:1px solid #555;background:transparent;color:#888;font-size:var(--fs-3);cursor:pointer;transition:.2s;font-family:\'Cinzel\',serif;letter-spacing:.05em;flex-shrink:0" onmouseover="this.style.borderColor=\'#D4AF37\';this.style.color=\'#D4AF37\'" onmouseout="this.style.borderColor=\'#555\';this.style.color=\'#888\'">How This Works</button>' +
        '<div id="fw-anim-mount" style="display:flex;align-items:center;flex-shrink:0"></div>' +
        '<div id="fw-scrubber" style="flex:1;min-width:0">' +
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
      '</div>' +
    '</div>' +
    '<div id="fw-body">' +
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
        fetch('data/islamic/journeys/' + item.file + '?v=' + Date.now())
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

    var chip = document.createElement('span');
    chip.className = 'fw-follow-chip';

    var dot = document.createElement('span');
    dot.className = 'fw-follow-dot';
    dot.style.background = col;
    chip.appendChild(dot);

    var name = document.createElement('span');
    name.className = 'fw-follow-chipname';
    name.textContent = item.name;
    chip.appendChild(name);

    if (conf && conf.grade) {
      var badge = document.createElement('span');
      badge.className = 'fw-grade-pill';
      badge.textContent = conf.grade;
      badge.style.background = _fwGradeColor(conf.grade);
      badge.style.marginLeft = '4px';
      chip.appendChild(badge);
    }

    var x = document.createElement('span');
    x.className = 'fw-follow-chipx';
    x.textContent = '\u00d7';
    x.onclick = function(ev) {
      ev.stopPropagation();
      _fwToggleSelection(file);
    };
    chip.appendChild(x);

    list.appendChild(chip);
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
  _fwLastEmpYear = null;

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      var mb = _mbCreateMap('fw-leaflet');
      if (!mb) return;
      _fwMap = mb.map;
      _fwLabTile = mb.labTile;

      // Focused bounds — tight fit to journey points only
      var pts = [];
      allLats.forEach(function(lat, i) { pts.push([lat, allLngs[i]]); });
      _mbFitToPoints(_fwMap, pts, 0.08);

      // GeoJSON empire overlays — filtered to journey region only
      var _fwJourneyBounds = L.latLngBounds(pts);
      _mbLoadGeoEmpires(function() {
        if (_fwMap) _fwEmpLayer = _mbRenderEmpires(_fwMap, _fwYear, _fwEmpLayer, _fwLabTile, 'fw-map-wrap', _fwJourneyBounds);
      });

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

    var _birthSvg = '<svg viewBox="0 0 56 56" width="56" height="56"><defs><filter id="bs" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/></filter></defs><path d="M28 8 L32.5 21 L46 21 L35 30 L39 43 L28 35 L17 43 L21 30 L10 21 L23.5 21 Z" fill="rgba(0,0,0,0.25)" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" filter="url(#bs)"/></svg>';
    var _burialSvg = '<svg viewBox="0 0 56 56" width="56" height="56"><defs><filter id="bd" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.6"/></filter></defs><path d="M16 46 L16 24 Q16 14 28 14 Q40 14 40 24 L40 46 Z" fill="rgba(0,0,0,0.25)" stroke="currentColor" stroke-width="3.5" stroke-linejoin="round" filter="url(#bd)"/><rect x="13" y="43" width="30" height="4" rx="1" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
    var _lastIdx = fig.journey.length - 1;

    // Collect birth + burial coords for dot suppression
    var _birthLat = fig.journey[0] ? fig.journey[0].lat : null;
    var _birthLng = fig.journey[0] ? fig.journey[0].lng : null;
    var _burialLat = (_lastIdx > 0 && fig.journey[_lastIdx]) ? fig.journey[_lastIdx].lat : null;
    var _burialLng = (_lastIdx > 0 && fig.journey[_lastIdx]) ? fig.journey[_lastIdx].lng : null;
    var _TOL = 0.01;

    fig.journey.forEach(function(entry, i) {
      var m;
      var isFirst = (i === 0);
      var isLast = (i === _lastIdx && _lastIdx > 0);

      if (isFirst) {
        m = L.marker([entry.lat, entry.lng], {
          icon: L.divIcon({
            className: 'fw-birth-icon',
            html: '<span style="color:' + figCol + ';display:block">' + _birthSvg + '</span>',
            iconSize: [56, 56],
            iconAnchor: [28, 28]
          }),
          zIndexOffset: 1000
        });
        m._fwPinned = true;
        m.bindTooltip(
          '<b style="color:' + figCol + '">' + fig.person + '</b><br>' +
          'Born ' + (entry.year || '') + ' \u2014 ' + (entry.location || ''),
          { direction: 'top', offset: [0, -26], className: 'fw-tooltip' }
        );
      } else if (isLast) {
        var verb = entry.category === 'burial' ? 'Buried' : 'Died';
        m = L.marker([entry.lat, entry.lng], {
          icon: L.divIcon({
            className: 'fw-burial-icon',
            html: '<span style="color:' + figCol + ';display:block">' + _burialSvg + '</span>',
            iconSize: [56, 56],
            iconAnchor: [28, 28]
          }),
          zIndexOffset: 1000
        });
        m._fwPinned = true;
        m.bindTooltip(
          '<b style="color:' + figCol + '">' + fig.person + '</b><br>' +
          verb + ' ' + (entry.year || '') + ' \u2014 ' + (entry.location || ''),
          { direction: 'top', offset: [0, -26], className: 'fw-tooltip' }
        );
      } else {
        // Suppress journey dots that overlap birth or burial coordinates
        var _skipDot = false;
        if (_birthLat !== null && Math.abs(entry.lat - _birthLat) < _TOL && Math.abs(entry.lng - _birthLng) < _TOL) _skipDot = true;
        if (_burialLat !== null && Math.abs(entry.lat - _burialLat) < _TOL && Math.abs(entry.lng - _burialLng) < _TOL) _skipDot = true;

        var catCol = _fwCatColor(entry.category);
        var isPeriod = entry.precision === 'period';
        var radius = isPeriod ? 14 : entry.precision === 'day' ? 7 :
                     entry.precision === 'month' ? 6 : 5;
        m = L.circleMarker([entry.lat, entry.lng], {
          radius: _skipDot ? 0 : radius,
          fillColor: figCol,
          color: catCol,
          weight: _skipDot ? 0 : 2,
          fillOpacity: _skipDot ? 0 : 0.85,
          opacity: _skipDot ? 0 : (isPeriod ? 0.5 : 1)
        });
        if (_skipDot) m._fwSuppressed = true;
        m.bindTooltip(
          '<b style="color:' + figCol + '">' + fig.person + '</b><br>' +
          entry.location + '<br>' + _fwFmtDate(entry),
          { direction: 'top', offset: [0, -8], className: 'fw-tooltip' }
        );
      }

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
      if (m.setStyle && !m._fwSuppressed) m.setStyle({ fillOpacity: 0.4, opacity: 0.4, weight: 1.5 });
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

  // Throttle empire re-rendering: only when 50-year bracket changes
  var _empBrk = Math.floor(year / 50);
  var _lastBrk = _fwLastEmpYear !== null ? Math.floor(_fwLastEmpYear / 50) : -1;
  if (_empBrk !== _lastBrk) {
    try {
      var _jPts = [];
      _fwSelectedFiles().forEach(function(file) {
        var fig = _fwFigures[file];
        if (fig) fig.journey.forEach(function(e) { _jPts.push([e.lat, e.lng]); });
      });
      var _jBounds = _jPts.length ? L.latLngBounds(_jPts) : null;
      _fwEmpLayer = _mbRenderEmpires(_fwMap, year, _fwEmpLayer, _fwLabTile, 'fw-map-wrap', _jBounds);
      _fwLastEmpYear = year;
    } catch(e) {}
  }

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
        if (m.setStyle && !m._fwSuppressed) {
          m.setStyle({
            fillColor: figCol, color: catCol,
            fillOpacity: 0.5, opacity: 0.7, weight: 1.5
          });
          m.setRadius(isPeriod ? 12 : entry.precision === 'day' ? 6 :
                      entry.precision === 'month' ? 5 : 4);
        }
      } else {
        if (m._fwVisible && !m._fwPinned) { _fwMap.removeLayer(m); m._fwVisible = false; }
      }
    });

    if (lastIdx >= 0) {
      var m = markers[lastIdx];
      var entry = fig.journey[lastIdx];
      var catCol = _fwCatColor(entry.category);
      var isPeriod = entry.precision === 'period';
      var isExact = entry.year === year;

      if (m.setStyle && !m._fwSuppressed) {
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
      }
      m.bringToFront();
      activePts.push([entry.lat, entry.lng]);
    }

    // Re-raise pinned birth/burial markers above journey dots
    markers.forEach(function(pm){ if(pm._fwPinned && pm._fwVisible && pm.setZIndexOffset) pm.setZIndexOffset(1000); });

    lines.forEach(function(l, i) {
      if (i + 1 <= lastIdx) {
        if (!l._fwVisible) { l.addTo(_fwMap); l._fwVisible = true; }
        l.setStyle({ opacity: 0.5 });
      } else {
        if (l._fwVisible) { _fwMap.removeLayer(l); l._fwVisible = false; }
      }
    });
  });

  _mbAutoPan(_fwMap, activePts);
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
    try {
      var next = _fwYearIdx + 1;
      if (next >= _fwAllYears.length) { _fwAnimStopFull(); return; }
      _fwYearIdx = next;
      _fwGoToYear(_fwAllYears[next]);
    } catch(e) {
      console.warn('[FOLLOW] Tick error:', e);
    }
    // Chain next tick only after this one finishes (prevents pile-up)
    if (_fwPlaying) _fwTimer = setTimeout(_fwTickFn, _fwSpeed);
  };
  _fwTimer = setTimeout(_fwTickFn, _fwSpeed);
}

function _fwAnimPause() {
  _fwPlaying = false;
  if (_fwTimer) { clearTimeout(_fwTimer); _fwTimer = null; }
}

function _fwAnimStopFull() {
  _fwPlaying = false;
  if (_fwTimer) { clearTimeout(_fwTimer); _fwTimer = null; }
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

window._captureState_follow=function(){
  var files=Object.keys(_fwSelected).filter(function(f){return _fwSelected[f];});
  return{selected:files,yearIdx:_fwYearIdx};
};
window._restoreState_follow=function(s){
  if(!s||!s.selected) return;
  _fwSelected={};
  s.selected.forEach(function(f){_fwSelected[f]=true;});
  if(typeof _fwRebuild==='function') _fwRebuild();
};

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
  return fetch('data/islamic/journeys/index.json?v='+Date.now())
    .then(function(r){ return r.json(); })
    .then(function(arr){
      _fwIndex = arr;
      var set = new Set();
      arr.forEach(function(item){
        var p = _fwResolveName(item.name);
        if(p && p.slug) set.add(p.slug);
      });
      window._journeyFigures = set;
      window._journeyIndexCount = arr.length;
      // Update header stat
      var el = document.getElementById('hdrStatLives');
      if(el) el.textContent = arr.length.toLocaleString();
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
      if(typeof _showViewDesc==='function'){
        var n=window._journeyIndexCount||0;
        if(n>0){
          _showViewDesc('');
          var el=document.getElementById('viewDescInline');
          if(el) el.innerHTML='Follow <span class="hdr-stat-num">'+n.toLocaleString()+'</span> figures through their life journey';
          var _fc=document.getElementById('fw-l1-center'); if(_fc) _fc.innerHTML='Follow <span style="color:#D4AF37;font-weight:700">'+n.toLocaleString()+'</span> figures through their life journey';
        } else {
          _showViewDesc('Follow figures through their life journey');
        }
      }
    }
  };
})();

function _showFollowMethodology(){
  if(document.getElementById('fw-method-overlay')) return;
  var ov=document.createElement('div');
  ov.id='fw-method-overlay';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;';
  var box=document.createElement('div');
  box.style.cssText='background:#1a1a2e;border:1px solid #D4AF37;border-radius:12px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;padding:32px;position:relative;font-family:system-ui,sans-serif;';
  box.innerHTML='<button id="fw-method-close" style="position:absolute;top:12px;right:16px;background:none;border:none;color:#888;font-size:var(--fs-1);cursor:pointer;line-height:1">\u00D7</button>'
    +'<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);margin:0 0 20px;letter-spacing:.06em">How This Works</h2>'
    +'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">What You Are Seeing</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 16px">An animated map tracing a historical figure\u2019s life journey. Events appear chronologically in the side feed, synchronized with the map. Empire overlays show political control. Use play/pause and speed control.</p>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Key Terms</h3>'+'<div style="font-size:var(--fs-3);line-height:1.7"><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#D4AF37;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Journey point</span><span style="color:#A0AEC0">A documented place the figure visited</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4a7c59;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Grade A</span><span style="color:#A0AEC0">Highly confident date</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#4a6d8c;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Grade B</span><span style="color:#A0AEC0">Mostly confident</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#b08030;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Grade C</span><span style="color:#A0AEC0">Some uncertainty</span></div><div style="display:flex;align-items:center;gap:10px;margin:6px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#707070;flex-shrink:0"></span><span style="color:#D4AF37;font-weight:600;min-width:100px">Grade D</span><span style="color:#A0AEC0">Weak / traditional</span></div></div>'+'<h3 style="color:#D4AF37;font-size:var(--fs-3);margin:20px 0 8px;font-family:\'Cinzel\',serif;letter-spacing:.04em">Data & Disclaimers</h3>'+'<p style="color:#ccc;font-size:var(--fs-3);line-height:1.6;margin:0 0 12px">Journey data manually researched with GPS coordinates and source citations. Routes between points are illustrative. Empire borders simplified.</p>'+'<p style="color:#999;font-size:var(--fs-3);font-style:normal;margin:0">AI-generated \u00B7 independently verify</p>';
  ov.appendChild(box);
  document.body.appendChild(ov);
  document.getElementById('fw-method-close').addEventListener('click',function(){ov.remove();});
  ov.addEventListener('click',function(e){if(e.target===ov)ov.remove();});
  document.addEventListener('keydown',function _esc(e){if(e.key==='Escape'){ov.remove();document.removeEventListener('keydown',_esc);}});
}
