// ═══════════════════════════════════════════════════════════
// MAPBASE — Shared map utilities for MAP, FOLLOW, EVENTS
// ═══════════════════════════════════════════════════════════

// ── GeoJSON Empire State (shared across views) ──
var _mbGeoEmpData = null;
var _mbGeoEmpCenturies = [];

// ── Dark Tile URLs ──
var _MB_DARK_TILES = 'https://{s}.basemaps.cartocdn.com/positron_no_labels/{z}/{x}/{y}{r}.png';
var _MB_LABEL_TILES = 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png';
var _MB_BORDERS_URL = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson/ne_110m_admin_0_countries.geojson';

// ═══════════════════════════════════════════════════════════
// CREATE BASE MAP — dark tiles + borders + labels-on-top
// ═══════════════════════════════════════════════════════════
// Returns { map, labTile } so caller can manage label z-order
function _mbCreateMap(elementId, opts) {
  opts = opts || {};
  var el = document.getElementById(elementId);
  if (!el) return null;

  var map = L.map(el, {
    zoomControl: opts.zoomControl !== false,
    attributionControl: opts.attributionControl !== false,
    minZoom: opts.minZoom || 2,
    maxZoom: opts.maxZoom || 14,
    maxBounds: [[-85, -180], [85, 180]],
    maxBoundsViscosity: 1.0
  });

  // 1) Dark base — no labels
  L.tileLayer(_MB_DARK_TILES, {
    subdomains: 'abcd',
    attribution: '© <a href="https://carto.com/attributions">CARTO</a>',
    maxZoom: 19
  }).addTo(map);

  // 2) Country borders (subtle)
  fetch(_MB_BORDERS_URL)
    .then(function(r) { return r.json(); })
    .then(function(geo) {
      if (!map) return;
      L.geoJSON(geo, { style: { color: '#7a8a72', weight: 0.8, fillOpacity: 0, opacity: 0.8 } }).addTo(map);
    }).catch(function() {});

  // 3) Labels tile — added last so they float above empires
  var labTile = L.tileLayer(_MB_LABEL_TILES, {
    subdomains: 'abcd', maxZoom: 19, opacity: 1
  });
  // Don't add yet — caller adds after empires so labels stay on top

  // 4) User-drag tracking (for animation resilience)
  map._mbUserDrag = false;
  map.on('movestart', function() { map._mbUserDrag = true; });
  map.on('moveend', function() {
    setTimeout(function() { map._mbUserDrag = false; }, 300);
  });

  return { map: map, labTile: labTile };
}

// ═══════════════════════════════════════════════════════════
// LOAD GeoJSON EMPIRES — shared data, loaded once
// ═══════════════════════════════════════════════════════════
function _mbLoadGeoEmpires(cb) {
  if (_mbGeoEmpData) { cb(); return; }
  fetch(dataUrl('data/islamic/empire_overlays.json'))
    .then(function(r) { return r.json(); })
    .then(function(j) {
      _mbGeoEmpData = j || {};
      _mbGeoEmpCenturies = Object.keys(_mbGeoEmpData).sort(function(a, b) { return +a - +b; });
      cb();
    })
    .catch(function() { _mbGeoEmpData = {}; _mbGeoEmpCenturies = []; cb(); });
}

// ═══════════════════════════════════════════════════════════
// RENDER GeoJSON EMPIRES on any map for a given year
// Returns the L.geoJSON layer so caller can track/remove it
// ═══════════════════════════════════════════════════════════
function _mbRenderEmpires(map, year, existingLayer, labTile, legendContainerId) {
  if (!map) return null;
  if (existingLayer) { map.removeLayer(existingLayer); }
  if (year === null || !_mbGeoEmpData) {
    _removeEmpLegendFor(legendContainerId);
    return null;
  }

  // Find nearest century <= year
  var candidates = _mbGeoEmpCenturies.filter(function(c) { return +c <= year; });
  if (!candidates.length) {
    _removeEmpLegendFor(legendContainerId);
    return null;
  }
  var century = candidates[candidates.length - 1];
  var items = (_mbGeoEmpData[century]) || [];
  if (!items.length) {
    _removeEmpLegendFor(legendContainerId);
    return null;
  }

  // Filter to only empires that overlap the focus region (if provided)
  var filtered = items;
  if (arguments.length > 5 && arguments[5]) {
    var fb = arguments[5]; // L.latLngBounds — journey focus bounds
    var padded = fb.pad(0.15); // 15% padding — immediate neighbors only
    filtered = items.filter(function(it) {
      try {
        var coords = JSON.stringify(it.geometry.coordinates);
        var lats = [], lngs = [];
        coords.replace(/\[(-?\d+\.?\d*),\s*(-?\d+\.?\d*)\]/g, function(m, lng, lat) {
          lats.push(+lat); lngs.push(+lng);
        });
        if (!lats.length) return false;
        var empBounds = L.latLngBounds(
          [Math.min.apply(null, lats), Math.min.apply(null, lngs)],
          [Math.max.apply(null, lats), Math.max.apply(null, lngs)]
        );
        return padded.overlaps(empBounds);
      } catch(e) { return true; }
    });
  }

  var fc = {
    type: 'FeatureCollection',
    features: filtered.map(function(it) {
      return { type: 'Feature', properties: { name: it.name, color: it.color }, geometry: it.geometry };
    })
  };

  var layer = L.geoJSON(fc, {
    style: function(f) {
      return { fillColor: f.properties.color, fillOpacity: 0.25, color: f.properties.color, weight: 1.5, opacity: 0.5 };
    }
  }).addTo(map);

  // Build legend
  if (legendContainerId) {
    var legendItems = filtered.map(function(it) { return { name: it.name, color: it.color }; });
    _buildEmpLegendFor(legendContainerId, legendItems);
  }

  // Re-raise labels above empires
  if (labTile) {
    if (map.hasLayer(labTile)) map.removeLayer(labTile);
    labTile.addTo(map);
  }

  return layer;
}

// ═══════════════════════════════════════════════════════════
// FOCUSED BOUNDS — fit map tightly to activity points
// padding = fraction (0.05 = 5% margin each side)
// ═══════════════════════════════════════════════════════════
function _mbFitToPoints(map, points, padding) {
  if (!map || !points || !points.length) return;
  padding = padding || 0.08;
  var bounds = L.latLngBounds(points);
  map.fitBounds(bounds.pad(padding), { animate: false, maxZoom: 10 });
}

// Smart auto-pan during animation — only pan if active point is near edge
// Returns true if pan was needed
function _mbAutoPan(map, activePts, padding) {
  if (!map || !activePts || !activePts.length) return false;
  if (map._mbUserDrag) return false; // user is interacting, don't fight them

  try {
    var b = L.latLngBounds(activePts);
    var mapBounds = map.getBounds().pad(-0.15);
    if (!mapBounds.contains(b)) {
      if (activePts.length === 1) {
        map.panTo(activePts[0], { animate: true, duration: 0.5 });
      } else {
        map.fitBounds(b.pad(0.3), {
          animate: true, duration: 0.5,
          maxZoom: Math.max(map.getZoom(), 5)
        });
      }
      return true;
    }
  } catch (e) {
    console.warn('[MAPBASE] autoPan error:', e);
  }
  return false;
}

// ═══════════════════════════════════════════════════════════
// LEGEND HELPERS (kept compatible with existing code)
// ═══════════════════════════════════════════════════════════
// _buildEmpLegendFor and _removeEmpLegendFor are already defined in map.js
// These are fallback definitions in case mapbase.js loads first
if (typeof _buildEmpLegendFor === 'undefined') {
  function _buildEmpLegendFor(containerId, items) {
    var legId = 'empLeg-' + containerId;
    var colored = items.filter(function(it) {
      var m = (it.color || '').match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
      if (!m) return false;
      var r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
      return (Math.max(r, g, b) - Math.min(r, g, b)) > 35;
    });
    var el = document.getElementById(legId);
    if (!colored.length) { if (el) el.remove(); return; }
    if (!el) {
      el = document.createElement('div'); el.id = legId;
      el.style.cssText = "position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:800;display:flex;flex-wrap:wrap;gap:4px 10px;padding:6px 14px;background:rgba(0,0,0,0.85);border:1px solid rgba(212,175,55,0.3);border-radius:4px;max-width:90%;justify-content:center;";
      var mc = document.getElementById(containerId);
      if (mc) { mc.style.position = mc.style.position || 'relative'; mc.appendChild(el); }
    }
    el.innerHTML = colored.map(function(it) {
      return '<div style="display:flex;align-items:center;gap:6px"><span style="width:16px;height:16px;border-radius:2px;background:' + it.color + ';flex-shrink:0;opacity:0.9"></span><span style="font-family:Cinzel,serif;font-size:var(--fs-3);color:#ccc;letter-spacing:.04em;white-space:nowrap">' + it.name + '</span></div>';
    }).join('');
  }
  window._buildEmpLegendFor = _buildEmpLegendFor;
}

if (typeof _removeEmpLegendFor === 'undefined') {
  function _removeEmpLegendFor(containerId) {
    if (!containerId) return;
    var el = document.getElementById('empLeg-' + containerId);
    if (el) el.remove();
  }
  window._removeEmpLegendFor = _removeEmpLegendFor;
}

// Expose globally
window._mbCreateMap = _mbCreateMap;
window._mbLoadGeoEmpires = _mbLoadGeoEmpires;
window._mbRenderEmpires = _mbRenderEmpires;
window._mbFitToPoints = _mbFitToPoints;
window._mbAutoPan = _mbAutoPan;
