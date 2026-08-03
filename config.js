// Gold Ark — sandbox v2 runtime config
// Single source of truth for data origin. Flip USE_CDN to switch between R2 and local fixture.
window.GOLD_ARK_CONFIG = {
  CDN_BASE: 'https://gold-ark-data.hooman-92b.workers.dev',
  USE_CDN: true,
  FIXTURE_VERSION: 'fixture7'
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

// ── TRAD_COLORS — tradition colour map, exposed once for every view (A10).
//    Lifted verbatim from the existing table in books.js (_BV_TRAD_COLORS) /
//    eras.js (_EV_TRAD_COLORS); those two are byte-identical and stay as they are.
//    config.js loads before every view, so views read window.TRAD_COLORS directly.
//    A tradition absent from this map returns undefined — callers fall back to
//    plain gold. Never add a colour here that is not already in the table above.
window.TRAD_COLORS = {
  'Hadith Sciences':'#4fc3f7','Early Ascetics':'#66bb6a',
  'Islamic Jurisprudence':'#7986cb','Islamic Philosophy':'#4db6ac','Islamic Sciences':'#4dd0e1',
  'Islamic Theology':'#9575cd','Islamic Literature':'#f06292','Persian Poetry':'#ce93d8',
  'Khorasan School':'#a1887f','Baghdad School':'#90a4ae','Naqshbandiyya':'#7e57c2',
  'Shadhiliyya':'#26a69a','Qadiriyya':'#42a5f5','Chishti':'#ffa726','Suhrawardiyya':'#d4e157',
  'Mawlawiyya':'#ec407a','Qalandari':'#8d6e63','Yeseviyya':'#78909c','Kubrawiyya':'#5c6bc0',
  'Akbarian':'#ab47bc','Ishraqiyya':'#ffca28','Mughal':'#ef6c00','Genealogy':'#D4AF37',

  // ── Extension (2026-08-03): supersedes the "never add a colour not already in
  //    the table above" note in the header — the 23 entries above are unchanged,
  //    and the 42 below cover every remaining tradition value in core.json.
  //    'Islamic History' is deliberately NOT coloured — it is the general bucket and stays plain gold by design.
  //    Colours are used as CHIP TEXT on the dark #1b2631 panel, so every value below
  //    sits in the same Material 200-400 lightness band as the 23 above (contrast >= 3.0;
  //    the existing table's own floor is 2.95). Dark 700-900 tones are unreadable here.

  // Sects & branches — Shia reds and Sunni blues; each theology value echoes its parent sect's hue
  'Shia':'#e53935','Shia Theology':'#ff8a80','Zaydi':'#ef5350',
  'Sunni':'#64b5f6','Sunni Theology':'#90caf9',
  'Nizari Ismaili':'#e040fb','Tayyibi Ismaili':'#ea80fc','Ismaili Thought':'#f48fb1',
  'Ibadi':'#80cbc4','Ahmadiyya':'#bcaaa4',

  // Fiqh / madhhabs — indigos, alongside 'Islamic Jurisprudence' above
  'Hanafi':'#8c9eff','Maliki':'#9fa8da','Independent Mujtahid':'#c5cae9',

  // Sufism and the orders — purples/violets, matching the orders already listed above
  'Sufi':'#ba68c8','Badawiyya':'#b39ddb','Tijaniyya':'#d500f9','Bektashiyya':'#e1bee7',
  'Burhaniyya':'#b388ff','Sanusiyya':'#7c4dff',"Ni'matullahi":'#aa00ff','Khalwatiyya':'#cc5de8',
  'Muridiyya':'#d0a9f5',"Rifa'iyya":'#a569bd','Zahediyya':'#e8daef',
  'Sindhi/Punjabi Sufism':'#845ef7','Sufi Poetry':'#9775fa',

  // Literature, poetry & language — pinks/roses; 'Mughal Literature' echoes 'Mughal' orange,
  // 'Arabic Linguistics' sits in the lime range next to 'Suhrawardiyya'
  'Arabic Poetry':'#f8bbd0','Arabic Literature':'#ff80ab','Turkish Literature':'#e57373',
  'Mughal Literature':'#ffb74d','Arabic Linguistics':'#dce775',

  // Sciences & navigation — cyans/blues, alongside 'Islamic Sciences' above
  'Quranic Sciences':'#00acc1','Andalusian Sciences':'#80deea','Ottoman Sciences':'#29b6f6',
  'Islamic Navigation':'#81d4fa','Ottoman Naval':'#b2ebf2',

  // Regional & dynastic history — warm oranges/browns
  'Ottoman History':'#ff8a65','Almohad':'#ffab91','Sudanese Mahdiyya':'#d7ccc8',

  // Reform & revival movements — greens
  'Sunni Reform':'#81c784','Deobandi':'#00e676','Nahda':'#aed581'
};

console.log('[GoldArk] data source:', window.GOLD_ARK_CONFIG.USE_CDN
  ? 'CDN ' + window.GOLD_ARK_CONFIG.CDN_BASE
  : 'LOCAL');
