// Gold Ark — sandbox v2 runtime config
// Single source of truth for data origin. Flip USE_CDN to switch between R2 and local fixture.
window.GOLD_ARK_CONFIG = {
  CDN_BASE: 'https://gold-ark-data.hooman-92b.workers.dev',
  USE_CDN: true,
  FIXTURE_VERSION: 'fixture1'
};

// dataUrl(relPath) — builds the final URL for a data fetch.
// - When USE_CDN: prefixes CDN_BASE.
// - Always strips any pre-existing ?v=... query, then appends FIXTURE_VERSION.
window.dataUrl = function(relPath){
  var cfg = window.GOLD_ARK_CONFIG || {};
  var base = cfg.USE_CDN ? cfg.CDN_BASE : '';
  var v = cfg.FIXTURE_VERSION || 'fixture1';
  if(typeof relPath !== 'string') relPath = String(relPath || '');
  // Strip any existing ?v=... or &v=... fragment so we re-version cleanly
  var clean = relPath.replace(/[?&]v=[^&]*/g, '');
  // Tidy hanging ?/& if the strip left one
  clean = clean.replace(/[?&]$/, '');
  if(clean.charAt(0) === '/') clean = clean.slice(1);
  var sep = clean.indexOf('?') >= 0 ? '&' : '?';
  return (base ? base.replace(/\/$/, '') + '/' : '') + clean + sep + 'v=' + v;
};

console.log('[GoldArk] data source:', window.GOLD_ARK_CONFIG.USE_CDN
  ? 'CDN ' + window.GOLD_ARK_CONFIG.CDN_BASE
  : 'LOCAL');
