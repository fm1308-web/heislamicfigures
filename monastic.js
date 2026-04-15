window.Monastic = (function(){
'use strict';

var COLLECTIONS = [
  {key:'bukhari',  label:'Sahih Bukhari',      file:'data/hadith/bukhari.json'},
  {key:'muslim',   label:'Sahih Muslim',        file:'data/hadith/muslim.json'},
  {key:'abudawud', label:"Sunan Abi Da'ud",     file:'data/hadith/abudawud.json'},
  {key:'tirmidhi', label:"Jami' al-Tirmidhi",   file:'data/hadith/tirmidhi.json'},
  {key:'nasai',    label:"Sunan an-Nasa'i",      file:'data/hadith/nasai.json'},
  {key:'ibnmajah', label:'Sunan Ibn Majah',     file:'data/hadith/ibnmajah.json'}
];

var MON_PERIODS = [
  {id:'early_makkan', label:'Early Makkan',  years:'610\u2013622 CE', span:12, color:'#8B6F47', rgb:'139,111,71'},
  {id:'madinan',      label:'Madinan',       years:'622\u2013632 CE', span:10, color:'#D4AF37', rgb:'212,175,55'},
  {id:'post_prophet', label:'Post-Prophet',  years:'632\u2013661 CE', span:29, color:'#6B8E6B', rgb:'107,142,107'},
  {id:'successor',    label:'Successor Era', years:'661\u2013700 CE', span:39, color:'#5C7A8C', rgb:'92,122,140'}
];

var CONF_STYLES = {
  high:        {bg:'#D4AF37', text:'#0E1621', label:'HIGH'},
  medium:      {bg:'#6B8E6B', text:'#FFFFFF', label:'MEDIUM'},
  low:         {bg:'#5C7A8C', text:'#FFFFFF', label:'LOW'},
  period_only: {bg:'#666',    text:'#FFFFFF', label:'PERIOD ONLY'}
};

var _inited = false;
var _cache = {};
var MAX_ROWS = 500;

var _resultsEl, _loadingEl, _countEl, _bandEl;
var _periodTotals = null;
var _narratorIndex = [];
var _topicList = null;
var _clickBound = false;
var _peopleIndex = null;

var _monSel = {
  period:     new Set(),
  topic:      new Set(),
  narrator:   new Set(),
  collection: new Set()
};
var _monDDBound = false;
var _monSearchBoxPrev = null;
var MON_GLOSSARY = {
  'thiqah':           {def:'Trustworthy. Highest reliability rating for a narrator.', src:'Classical rijal'},
  'thiqah thiqah':    {def:'Doubly trustworthy. Emphatic reliability; used for the most reliable narrators.', src:'Classical rijal'},
  'sadooq':           {def:'Truthful. Reliable but a step below thiqah; may make minor errors.', src:'Classical rijal'},
  'hasan al-hadith':  {def:'Good in hadith. Narrations are acceptable but not top-tier.', src:'Classical rijal'},
  'saduq hasan':      {def:'Truthful and good. Acceptable reliability.', src:'Classical rijal'},
  'maqbul':           {def:'Acceptable. Reliable when corroborated by others.', src:'Classical rijal'},
  'layyin':           {def:'Soft. Mild weakness in memory or precision.', src:'Classical rijal'},
  'daif':             {def:'Weak. Narration falls below the threshold of acceptance.', src:'Classical rijal'},
  "da'if":            {def:'Weak. Narration falls below the threshold of acceptance.', src:'Classical rijal'},
  'matruk':           {def:'Abandoned. Narrator discarded due to serious defects.', src:'Classical rijal'},
  'kadhdhab':         {def:'Liar. Accused of fabricating hadith.', src:'Classical rijal'},
  'majhool':          {def:'Unknown. Identity or reliability not established.', src:'Classical rijal'},
  'unknown-majhool':  {def:'Unknown. Narrator whose identity or character is unclear.', src:'Classical rijal'},
  'companion':        {def:'Sahabi. Met the Prophet as a Muslim and died believing.', src:'Hadith sciences'},
  "tabi'i":           {def:'Follower. Met a Companion; second generation.', src:'Hadith sciences'},
  "taba' tabi'i":     {def:'Successor of the Follower. Third generation.', src:'Hadith sciences'}
};

function _glossKey(s){
  if(!s) return null;
  var k = String(s).toLowerCase().replace(/\s*\(\d+(st|nd|rd|th)\s*gen\)\s*$/, '').trim();
  return MON_GLOSSARY[k] ? k : null;
}

function _glossWrap(label){
  var k = _glossKey(label);
  if(!k) return esc(label);
  var g = MON_GLOSSARY[k];
  return '<span class="mon-gloss" tabindex="0">' + esc(label) +
         '<span class="mon-gloss-pop"><span class="mon-gloss-def">' + esc(g.def) + '</span>' +
         '<span class="mon-gloss-src">' + esc(g.src) + '</span></span></span>';
}

var _drillOn = false;
var _drillEl = null;
var _drillPicks = { period:[], topic:[], narrator:[], collection:[] };
var _drillAllHadith = null;

var DRILL_YEAR_MIN = 590;
var DRILL_YEAR_MAX = 700;
var DRILL_COLLAPSED_TICKS = [590, 610, 622, 632, 661, 700];
var _drillExpanded = false;
var _drillYearRow = 22;
var _drillMarkerRow = 60;
var _drillActiveTiers = { T1:true, T2:false, T3:false, T4:false, T5:false };
var _drillPath = [];  // Each step: {sourceColumn, sourceTileKey:'earliest-latest', splitBy:'topic', value:'Prayer'}
var _drillSplitMenu = null;

function _drillFetch(){
  if(_drillAllHadith) return Promise.resolve(_drillAllHadith);
  return fetchAll().then(function(all){ _drillAllHadith = all; return all; });
}

function _drillTierOf(h){
  var d = h.dating || {};
  var r = d.range;
  if(!r || r.earliest == null || r.latest == null) return 'T5';
  var span = r.latest - r.earliest;
  if(span <= 3) return 'T1';
  if(span <= 10) return 'T2';
  if(span <= 25) return 'T3';
  return 'T4';
}

function _drillPeriodRange(periodId){
  var pi = _monPeriodInfo(periodId);
  if(!pi) return null;
  var m = /(\d+)\D+(\d+)/.exec(pi.years);
  if(!m) return null;
  return { earliest: parseInt(m[1],10), latest: parseInt(m[2],10) };
}

function _drillHadithRange(h){
  var r = (h.dating || {}).range;
  if(r && r.earliest != null && r.latest != null) return { earliest:r.earliest, latest:r.latest };
  return _drillPeriodRange(h.period);
}

function _drillClassify(list){
  var buckets = { T1:[], T2:[], T3:[], T4:[], T5:[] };
  list.forEach(function(h){ buckets[_drillTierOf(h)].push(h); });
  return buckets;
}

function _drillApplyPath(list){
  _drillPath.forEach(function(step){
    list = list.filter(function(h){
      if(step.splitBy === 'topic')      return h.topic === step.value;
      if(step.splitBy === 'collection') return h._colKey === step.value;
      if(step.splitBy === 'narrator'){
        var n = (getNarrator(h) || '').toLowerCase();
        return n.indexOf(step.value.toLowerCase()) !== -1;
      }
      return true;
    });
  });
  return list;
}

function _drillUsedSplits(){
  return _drillPath.map(function(s){ return s.splitBy; });
}

function _drillAvailableSplits(){
  var used = _drillUsedSplits();
  return ['topic','narrator','collection'].filter(function(k){ return used.indexOf(k) === -1; });
}

function _drillSplitLabel(k){
  if(k === 'topic') return 'Topic';
  if(k === 'narrator') return 'Narrator';
  if(k === 'collection') return 'Collection';
  return k;
}

function _drillValueLabel(splitBy, value){
  if(splitBy === 'collection') return _wizardCollectionLabel(value);
  return value;
}

function _drillCloseUI(){
  _drillOn = false;
  var drillBtn = document.getElementById('mon-drill-btn');
  if(drillBtn){
    drillBtn.classList.remove('active');
    drillBtn.style.background = 'rgba(212,175,55,0.25)';
    drillBtn.style.borderColor = 'rgba(212,175,55,0.8)';
    drillBtn.style.color = '#FFFFFF';
  }
  if(_resultsEl) _resultsEl.style.display = '';
  if(_drillEl)   _drillEl.style.display = 'none';
  var cnt = document.getElementById('mon-count'); if(cnt) cnt.style.display = '';
  document.body.classList.remove('mon-drill-on');
  _drillExpanded = false;
}

function _drillTimescaleHtml(){
  var totalH = _drillExpanded
    ? (DRILL_YEAR_MAX - DRILL_YEAR_MIN) * _drillYearRow
    : (DRILL_COLLAPSED_TICKS.length - 1) * _drillMarkerRow + 20;

  var ticks = '';
  if(_drillExpanded){
    for(var y = DRILL_YEAR_MIN; y <= DRILL_YEAR_MAX; y++){
      var top = (y - DRILL_YEAR_MIN) * _drillYearRow;
      var isMajor = (y % 10 === 0) || y === 622 || y === 632;
      var isHijra = y === 622;
      var isDeath = y === 632;
      var labelColor = isHijra ? '#D4AF37' : (isDeath ? '#B45454' : 'rgba(160,174,192,0.7)');
      var fontSize = isMajor ? '11px' : '9px';
      var fontWeight = (isHijra || isDeath) ? '600' : '400';
      ticks +=
        '<div style="position:absolute;top:' + top + 'px;left:0;width:10px;height:1px;background:' + (isMajor ? labelColor : 'rgba(212,175,55,0.2)') + '"></div>' +
        (isMajor ? '<div style="position:absolute;top:' + (top - 6) + 'px;right:14px;font-family:\'Cinzel\',serif;font-size:' + fontSize + ';color:' + labelColor + ';font-weight:' + fontWeight + ';white-space:nowrap">' + (isHijra ? 'HIJRA 622' : (isDeath ? 'PROPHET D. 632' : y + ' CE')) + '</div>' : '');
    }
  } else {
    DRILL_COLLAPSED_TICKS.forEach(function(y, i){
      var top = i * _drillMarkerRow + 10;
      var isHijra = y === 622;
      var isDeath = y === 632;
      var labelColor = isHijra ? '#D4AF37' : (isDeath ? '#B45454' : 'rgba(160,174,192,0.8)');
      var fontWeight = (isHijra || isDeath) ? '600' : '400';
      ticks +=
        '<div style="position:absolute;top:' + top + 'px;left:0;width:10px;height:1px;background:' + labelColor + '"></div>' +
        '<div style="position:absolute;top:' + (top - 7) + 'px;right:14px;font-family:\'Cinzel\',serif;font-size:10px;color:' + labelColor + ';font-weight:' + fontWeight + ';white-space:nowrap">' + (isHijra ? 'HIJRA 622' : (isDeath ? 'PROPHET D. 632' : y + ' CE')) + '</div>';
    });
  }

  var toggleIcon = _drillExpanded ? '−' : '+';
  var toggleLabel = _drillExpanded ? 'Collapse' : 'Expand years';

  return '' +
    '<div style="flex:none;width:140px;padding-right:12px">' +
      '<button id="mon-drill-time-toggle" type="button" style="display:block;margin:0 0 12px auto;padding:3px 8px;background:transparent;border:1px solid rgba(212,175,55,0.4);border-radius:2px;color:#D4AF37;font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">' + toggleIcon + ' ' + toggleLabel + '</button>' +
      '<div id="mon-drill-stem" style="position:relative;height:' + totalH + 'px;border-right:1.5px solid rgba(212,175,55,0.5)">' +
        ticks +
      '</div>' +
    '</div>';
}

function _drillBindTimescale(){
  var toggle = document.getElementById('mon-drill-time-toggle');
  if(toggle){
    toggle.onclick = function(){
      _drillExpanded = !_drillExpanded;
      _drillRender();
    };
  }
}

function _drillRender(){
  if(!_drillEl) return;
  _drillEl.innerHTML = '<div style="padding:40px;text-align:center;color:#6B7280">Loading\u2026</div>';
  _drillFetch().then(function(all){
    var buckets = _drillClassify(all);
    var total = all.length;
    var tight = buckets.T1.length + buckets.T2.length + buckets.T3.length + buckets.T4.length;
    var tightPct = (tight / total * 100).toFixed(1);

    var TIER_META = [
      { key:'T1', label:'Year',        span:'\u22643y',    color:'#D4AF37', sub:'Named dated event' },
      { key:'T2', label:'Decade',      span:'4\u201310y',  color:'#8FC8A6', sub:'Multiple clues' },
      { key:'T3', label:'Era',         span:'11\u201325y', color:'#6BA0C4', sub:'Period-level' },
      { key:'T4', label:'Broad',       span:'>25y',         color:'#A07CB0', sub:'Narrator lifespan' },
      { key:'T5', label:'Period only', span:'period',       color:'#7A7A7A', sub:'L1 fallback' }
    ];

    var chips = '';
    TIER_META.forEach(function(m){
      var n = buckets[m.key].length;
      var on = _drillActiveTiers[m.key];
      var bg = on ? 'rgba(' + _drillHexToRgb(m.color) + ',0.3)' : 'transparent';
      var bd = on ? m.color : 'rgba(255,255,255,0.15)';
      var tc = on ? m.color : 'rgba(160,174,192,0.5)';
      chips +=
        '<button class="mon-drill-tier-chip" data-tier="' + m.key + '" type="button" style="' +
          'flex:1;min-width:130px;padding:6px 12px;background:' + bg + ';border:1px solid ' + bd + ';border-radius:3px;' +
          'color:' + tc + ';font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;' +
          'cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px">' +
          '<span style="width:10px;height:10px;background:' + m.color + ';border-radius:50%;' + (on ? '' : 'opacity:0.25') + '"></span>' +
          '<span>' + m.key + ' ' + esc(m.label) + '</span>' +
          '<span style="font-weight:700">' + n.toLocaleString() + '</span>' +
        '</button>';
    });

    var activeHadiths = [];
    var tierColorFor = {};
    TIER_META.forEach(function(m){
      if(_drillActiveTiers[m.key]){
        buckets[m.key].forEach(function(h){
          activeHadiths.push(h);
          tierColorFor[h.id || h] = m.color;
        });
      }
    });

    var primaryMeta = TIER_META.find(function(m){ return _drillActiveTiers[m.key]; }) || TIER_META[0];

    _drillEl.innerHTML =
      '<div style="padding:20px 24px 20px 24px;box-sizing:border-box">' +
        '<div style="display:flex;align-items:baseline;gap:18px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(212,175,55,0.15);flex-wrap:wrap">' +
          '<div><span style="font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.12em;color:rgba(212,175,55,0.8);text-transform:uppercase">Total</span> <span style="font-family:\'Cinzel\',serif;font-size:22px;color:#D4AF37;font-weight:600;margin-left:6px">' + total.toLocaleString() + '</span></div>' +
          '<div style="font-size:12px;color:rgba(229,231,235,0.75);line-height:1.4">All 34,441 placed by broad period \u00B7 <span style="color:#D4AF37">' + tight.toLocaleString() + '</span> (' + tightPct + '%) have extra dating layers. Toggle tiers below to include/exclude.</div>' +
        '</div>' +
        '<div id="mon-drill-chip-row" style="display:flex;gap:8px;margin-bottom:14px;position:sticky;top:0;z-index:5;background:#0E1621;padding:6px 0">' + chips + '</div>' +
        '<div id="mon-drill-body" style="display:flex;gap:12px;align-items:flex-start;overflow-x:auto;overflow-y:visible;padding:0 48px 12px 0;width:100%;box-sizing:border-box">' +
          _drillAllColumnsHtml(activeHadiths, tierColorFor, primaryMeta) +
          '<div id="mon-drill-inline-panel" style="display:none"></div>' +
        '</div>' +
      '</div>';

    _drillBindTierChips();
    _drillBindTileActions();
    _drillAdjustConnectors();
  });
}

function _drillAllColumnsHtml(col1Hadiths, tierColorMap, primaryMeta){
  var html = '';

  html += '<div data-drill-col="0" style="flex:none;width:240px">' + _drillColumnHeader(0) + _drillColumnHtml(primaryMeta, col1Hadiths, tierColorMap) + '</div>';

  var sourceHadiths = col1Hadiths;

  _drillPath.forEach(function(step, i){
    var inTile = sourceHadiths.filter(function(h){
      var r = _drillHadithRange(h);
      return r && r.earliest === step.sourceEarliest && r.latest === step.sourceLatest;
    });

    if(step.value === null){
      var tileAccent = step.sourceAccent || '#D4AF37';
      html += '<div data-drill-col="' + (i+1) + '" data-picker="1" style="flex:none;width:240px">' +
                _drillColumnHeader(i+1) +
                _drillExpandColumnHtml(step, inTile, tileAccent) +
              '</div>';
      return;
    }

    var matched = inTile.filter(function(h){
      if(step.splitBy === 'topic')      return h.topic === step.value;
      if(step.splitBy === 'collection') return h._colKey === step.value;
      if(step.splitBy === 'narrator'){
        var n = (getNarrator(h) || '').toLowerCase();
        return n.indexOf(step.value.toLowerCase()) !== -1;
      }
      return true;
    });

    var tileAccent = step.sourceAccent || '#D4AF37';
    html += '<div data-drill-col="' + (i+1) + '" data-picker="1" style="flex:none;width:240px">' +
              _drillColumnHeader(i+1) +
              _drillExpandColumnHtml(step, inTile, tileAccent) +
            '</div>';
    sourceHadiths = matched;
  });

  return html;
}

function _drillExpandColumnHtml(step, sourceHadiths, accentColor){
  var rangeLabel = step.sourceEarliest === step.sourceLatest
    ? (step.sourceEarliest + ' CE')
    : (step.sourceEarliest + '\u2013' + step.sourceLatest + ' CE');

  var counts = {};
  sourceHadiths.forEach(function(h){
    var v;
    if(step.splitBy === 'topic') v = h.topic;
    else if(step.splitBy === 'collection') v = h._colKey;
    else if(step.splitBy === 'narrator') v = _stripArabic((getNarrator(h) || '').split('(')[0].trim());
    if(v) counts[v] = (counts[v] || 0) + 1;
  });
  var options = Object.keys(counts).map(function(k){ return { value:k, count:counts[k] }; });
  options.sort(function(a,b){ return b.count - a.count; });

  var totalSum = options.reduce(function(s, o){ return s + o.count; }, 0);

  accentColor = accentColor || '#D4AF37';
  var rgbAccent = _drillHexToRgb(accentColor);

  var header =
    '<div style="margin-bottom:10px;font-size:12px;color:rgba(160,174,192,0.75);padding-bottom:6px;border-bottom:1px solid rgba(' + rgbAccent + ',0.1);display:flex;align-items:baseline;gap:8px">' +
      '<span>' + sourceHadiths.length.toLocaleString() + ' hadiths \u00B7 ' + options.length + ' ' + esc(_drillSplitLabel(step.splitBy).toLowerCase()) + 's</span>' +
      '<button class="mon-drill-step-close" data-step-index="' + step.sourceColumn + '" type="button" style="margin-left:auto;padding:2px 8px;background:transparent;border:1px solid rgba(' + rgbAccent + ',0.4);border-radius:2px;color:' + accentColor + ';font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">\u2715</button>' +
    '</div>';

  var warn = '';
  if(totalSum !== sourceHadiths.length){
    warn = '<div style="font-size:10px;color:#B45454;margin-bottom:6px">Note: ' + (sourceHadiths.length - totalSum) + ' hadiths have no ' + esc(step.splitBy) + ' value.</div>';
  }

  var ROW_H = 56;
  var TILE_H = 48;
  var TILE_GAP = 8;

  var tilesHtml = '';
  var columnIsCommitted = (step.value !== null);
  var canExpandFurther = _drillAvailableSplits().filter(function(k){ return k !== step.splitBy; }).length > 0;
  options.forEach(function(o, i){
    var top = i * ROW_H + 4;
    var isSelected = step.value === o.value;
    var isDim = columnIsCommitted && !isSelected;
    var selectedGlow = isSelected ? 'box-shadow:0 0 0 3px ' + accentColor + ', 0 0 28px 4px rgba(' + rgbAccent + ',0.75), inset 0 0 14px rgba(' + rgbAccent + ',0.28);' : '';
    var dimStyle = isDim ? 'opacity:0.22;filter:saturate(0.4);' : '';
    var viewFlex = canExpandFurther ? '1' : '1 1 100%';
    var expandBtnHtml = canExpandFurther
      ? '<button class="mon-drill-pick-expand-btn" data-val="' + esc(o.value) + '" type="button" style="flex:1;padding:3px 6px;background:transparent;border:none;border-top:1px solid rgba(' + rgbAccent + ',0.25);border-left:1px solid rgba(' + rgbAccent + ',0.25);color:#E5E7EB;font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">Expand \u25BE</button>'
      : '';
    tilesHtml +=
      '<div class="mon-drill-tile' + (isSelected ? ' mon-drill-tile-source' : '') + '" data-val="' + esc(o.value) + '" style="' +
        'position:absolute;top:' + top + 'px;left:0;right:0;height:' + TILE_H + 'px;' +
        'background:transparent;border:3px solid ' + accentColor + ';border-radius:3px;overflow:hidden;display:flex;flex-direction:column;' + selectedGlow + dimStyle + '">' +
        '<div style="padding:4px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex:1">' +
          '<span style="font-family:\'Lato\',sans-serif;font-size:12px;color:#E5E7EB;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(_drillValueLabel(step.splitBy, o.value)) + '</span>' +
          '<span style="font-family:\'Cinzel\',serif;font-size:14px;color:#FFFFFF;font-weight:700;flex:none">' + o.count.toLocaleString() + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:0;flex:none;border-top:1px solid rgba(' + rgbAccent + ',0.25)">' +
          '<button class="mon-drill-pick-view" data-val="' + esc(o.value) + '" type="button" style="flex:' + viewFlex + ';padding:3px 6px;background:transparent;border:none;color:#E5E7EB;font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">View</button>' +
          expandBtnHtml +
        '</div>' +
      '</div>';
  });

  var totalH = Math.max(options.length * ROW_H, 200);

  var ROW_H_LOCAL = 56;
  var firstTileY = 4 + 24;
  var lastTileY = (options.length - 1) * ROW_H_LOCAL + 4 + 24;
  var bracketSvg =
    '<svg width="24" height="' + totalH + '" style="position:absolute;top:0;left:0;overflow:visible">' +
      '<path d="M22,' + firstTileY + ' Q10,' + firstTileY + ' 10,' + (firstTileY + 10) + ' L10,' + (lastTileY - 10) + ' Q10,' + lastTileY + ' 22,' + lastTileY + '" stroke="' + accentColor + '" stroke-width="1.5" fill="none" opacity="0.8"/>';
  bracketSvg += '</svg>';

  var bracketMidY = (firstTileY + lastTileY) / 2;
  var connectorSvg =
    '<svg class="mon-drill-connector-svg" width="40" height="' + totalH + '" style="position:absolute;top:0;left:-40px;overflow:visible;pointer-events:none">' +
      '<line class="mon-drill-connector-line" x1="0" y1="' + bracketMidY + '" x2="40" y2="' + bracketMidY + '" stroke="' + accentColor + '" stroke-width="1.5" stroke-dasharray="4,3" opacity="0.7"/>' +
      '<circle class="mon-drill-connector-dot" cx="40" cy="' + bracketMidY + '" r="3" fill="' + accentColor + '"/>' +
    '</svg>';

  return header + warn +
    '<div style="position:relative;display:flex;gap:0;align-items:flex-start">' +
      '<div style="flex:none;width:24px;position:relative;height:' + totalH + 'px">' + connectorSvg + bracketSvg + '</div>' +
      '<div style="flex:none;width:200px;position:relative;height:' + totalH + 'px">' + tilesHtml + '</div>' +
    '</div>';
}

function _drillColumnHeader(columnIndex){
  if(columnIndex === 0){
    return '<div style="margin-bottom:8px;height:20px;display:flex;align-items:center;font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.1em;color:rgba(212,175,55,0.8);text-transform:uppercase">Years</div>';
  }
  var step = _drillPath[columnIndex - 1];
  if(!step) return '';
  var rangeLabel = step.sourceEarliest === step.sourceLatest ? (step.sourceEarliest + ' CE') : (step.sourceEarliest + '\u2013' + step.sourceLatest + ' CE');
  var valuePart = step.value !== null ? ': ' + esc(_drillValueLabel(step.splitBy, step.value)) : '';
  return '<div style="margin-bottom:8px;height:20px;display:flex;align-items:center;gap:6px;overflow:hidden;white-space:nowrap">' +
    '<span style="font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.1em;color:rgba(212,175,55,0.8);text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1" title="' + esc(_drillSplitLabel(step.splitBy) + valuePart.replace(/^: /, ': ')) + '">' + esc(_drillSplitLabel(step.splitBy)) + valuePart + '</span>' +
    '<span style="font-size:10px;color:rgba(160,174,192,0.55);flex:none">' + esc(rangeLabel) + '</span>' +
    '</div>';
}

function _drillBindTileActions(){
  if(!_drillEl) return;

  _drillEl.querySelectorAll('.mon-drill-col-close').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.getAttribute('data-col'), 10);
      _drillPath = _drillPath.slice(0, idx - 1);
      _drillRender();
    };
  });

  _drillEl.querySelectorAll('.mon-drill-expand').forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      var available = _drillAvailableSplits();
      if(!available.length){
        alert('All filters used. No further splits possible.');
        return;
      }
      var colWrapper = btn.closest('[data-drill-col]');
      var columnIndex = colWrapper ? parseInt(colWrapper.getAttribute('data-drill-col'), 10) : 0;
      var groupKey = btn.getAttribute('data-group-key');
      var tile = btn.closest('.mon-drill-tile');
      var tColor = tile ? tile.getAttribute('data-tile-color') : null;
      _drillShowSplitMenu(btn, columnIndex, groupKey, available, null, tColor);
    };
  });

  _drillEl.querySelectorAll('.mon-drill-view').forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      var groupKey = btn.getAttribute('data-group-key');
      var parts = groupKey.split('-');
      var earliest = parseInt(parts[0], 10);
      var latest = parseInt(parts[1], 10);
      _drillOpenTileInMain(earliest, latest);
    };
  });

  _drillEl.querySelectorAll('.mon-drill-step-close').forEach(function(btn){
    btn.onclick = function(){
      var idx = parseInt(btn.getAttribute('data-step-index'), 10);
      _drillPath = _drillPath.slice(0, idx);
      _drillRender();
    };
  });

  _drillEl.querySelectorAll('.mon-drill-pick-view').forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      var val = btn.getAttribute('data-val');
      var colWrapper = btn.closest('[data-drill-col]');
      var columnIndex = colWrapper ? parseInt(colWrapper.getAttribute('data-drill-col'), 10) : 0;
      var stepIndex = columnIndex - 1;
      if(stepIndex < 0 || !_drillPath[stepIndex]) return;
      _drillPath = _drillPath.slice(0, stepIndex + 1);
      _drillPath[stepIndex].value = val;
      _drillOpenPathInMain();
    };
  });

  _drillEl.querySelectorAll('.mon-drill-pick-expand-btn').forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      var val = btn.getAttribute('data-val');
      var colWrapper = btn.closest('[data-drill-col]');
      var columnIndex = colWrapper ? parseInt(colWrapper.getAttribute('data-drill-col'), 10) : 0;
      var stepIndex = columnIndex - 1;
      if(stepIndex < 0 || !_drillPath[stepIndex]) return;
      _drillPath = _drillPath.slice(0, stepIndex + 1);
      _drillPath[stepIndex].value = val;
      var available = _drillAvailableSplits();
      if(!available.length){
        alert('All filters used. No further splits possible.');
        _drillRender();
        return;
      }
      var chainAccent = _drillPath[stepIndex] ? _drillPath[stepIndex].sourceAccent : null;
      if(!chainAccent){
        for(var ci = stepIndex; ci >= 0; ci--){ if(_drillPath[ci] && _drillPath[ci].sourceAccent){ chainAccent = _drillPath[ci].sourceAccent; break; } }
      }
      _drillShowSplitMenu(btn, -1, '', available, function(splitBy){
        var srcStep = _drillPath[stepIndex];
        var srcKey = srcStep.sourceEarliest + '-' + srcStep.sourceLatest;
        _drillAdvanceToSplitValue(_drillPath.length, srcKey, splitBy, chainAccent);
      });
    };
  });
}

function _drillAdjustConnectors(){
  if(!_drillEl) return;
  var cols = _drillEl.querySelectorAll('[data-drill-col]');
  cols.forEach(function(col){
    var colIdx = parseInt(col.getAttribute('data-drill-col'), 10);
    if(colIdx === 0) return;
    var step = _drillPath[colIdx - 1];
    if(!step) return;
    var priorCol = _drillEl.querySelector('[data-drill-col="' + (colIdx - 1) + '"]');
    if(!priorCol) return;
    var sourceTile = null;
    if(step.sourceColumn === 0){
      sourceTile = priorCol.querySelector('[data-group-key="' + step.sourceEarliest + '-' + step.sourceLatest + '"]');
    } else {
      var priorStep = _drillPath[colIdx - 2];
      if(priorStep && priorStep.value !== null){
        sourceTile = priorCol.querySelector('[data-val="' + (priorStep.value + '').replace(/"/g, '\\"') + '"]');
      }
    }
    if(!sourceTile) return;
    var svg = col.querySelector('.mon-drill-connector-svg');
    var line = col.querySelector('.mon-drill-connector-line');
    var dot = col.querySelector('.mon-drill-connector-dot');
    if(!svg || !line) return;
    var svgRect = svg.getBoundingClientRect();
    var tileRect = sourceTile.getBoundingClientRect();
    var sourceY = (tileRect.top + tileRect.height/2) - svgRect.top;
    line.setAttribute('y1', sourceY);
    if(dot){
      // keep the dot on the bracket side where the line currently ends
      // (existing y2 already equals bracketMidY — leave as is)
    }
  });
}

function _drillShowSplitMenu(anchorBtn, columnIndex, groupKey, available, onPick, tileColor){
  var prior = document.getElementById('mon-drill-splitmenu');
  if(prior) prior.remove();

  var menu = document.createElement('div');
  menu.id = 'mon-drill-splitmenu';
  menu.style.cssText = 'position:absolute;background:#1A2332;border:1px solid rgba(212,175,55,0.5);border-radius:4px;padding:6px;z-index:100;box-shadow:0 6px 20px rgba(0,0,0,0.6);display:flex;flex-direction:column;gap:4px;min-width:140px';

  var headerDiv = document.createElement('div');
  headerDiv.style.cssText = 'font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.08em;color:rgba(212,175,55,0.7);text-transform:uppercase;padding:4px 8px 2px';
  headerDiv.textContent = 'Split by';
  menu.appendChild(headerDiv);

  available.forEach(function(k){
    var b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = 'padding:6px 12px;background:transparent;border:1px solid rgba(212,175,55,0.3);border-radius:2px;color:#E5E7EB;font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;text-align:left';
    b.textContent = _drillSplitLabel(k);
    b.onmouseenter = function(){ b.style.background = 'rgba(212,175,55,0.15)'; };
    b.onmouseleave = function(){ b.style.background = 'transparent'; };
    b.onclick = function(){
      menu.remove();
      if(typeof onPick === 'function'){
        onPick(k);
      } else {
        _drillAdvanceToSplitValue(columnIndex, groupKey, k, tileColor);
      }
    };
    menu.appendChild(b);
  });

  document.body.appendChild(menu);
  var rect = anchorBtn.getBoundingClientRect();
  menu.style.left = (rect.left + window.scrollX) + 'px';
  menu.style.top = (rect.bottom + window.scrollY + 4) + 'px';

  var closer = function(ev){
    if(!menu.contains(ev.target)){
      menu.remove();
      document.removeEventListener('click', closer, true);
    }
  };
  setTimeout(function(){ document.addEventListener('click', closer, true); }, 10);
}

function _drillAdvanceToSplitValue(columnIndex, groupKey, splitBy, sourceAccent){
  var parts = groupKey.split('-');
  var earliest = parseInt(parts[0], 10);
  var latest = parseInt(parts[1], 10);

  _drillPath = _drillPath.slice(0, columnIndex);
  _drillPath.push({
    sourceColumn: columnIndex,
    sourceTileKey: groupKey,
    sourceEarliest: earliest,
    sourceLatest: latest,
    splitBy: splitBy,
    value: null,
    sourceAccent: sourceAccent || null
  });
  _drillRender();
}

function _drillShowValuePicker(splitBy, options, earliest, latest, columnIndex){
  var prior = document.getElementById('mon-drill-valuepicker');
  if(prior) prior.remove();

  if(!options.length){
    alert('No distinct values to split by.');
    return;
  }

  var overlay = document.createElement('div');
  overlay.id = 'mon-drill-valuepicker';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px';

  var card = document.createElement('div');
  card.style.cssText = 'background:#1A2332;border:1px solid rgba(212,175,55,0.5);border-radius:6px;max-width:520px;width:100%;max-height:80vh;display:flex;flex-direction:column;padding:20px';

  var title = document.createElement('div');
  title.style.cssText = 'font-family:\'Cinzel\',serif;font-size:14px;letter-spacing:.08em;color:#D4AF37;text-transform:uppercase;margin-bottom:4px';
  title.textContent = 'Pick a ' + _drillSplitLabel(splitBy);
  card.appendChild(title);

  var sub = document.createElement('div');
  sub.style.cssText = 'font-size:11px;color:rgba(160,174,192,0.75);margin-bottom:14px';
  sub.textContent = (earliest === latest ? earliest + ' CE' : earliest + '\u2013' + latest + ' CE') + ' \u00B7 ' + options.length + ' options';
  card.appendChild(sub);

  var list = document.createElement('div');
  list.style.cssText = 'overflow-y:auto;display:flex;flex-direction:column;gap:4px;flex:1';
  options.forEach(function(o){
    var b = document.createElement('button');
    b.type = 'button';
    b.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 12px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:3px;color:#E5E7EB;font-size:12px;cursor:pointer;text-align:left';
    b.innerHTML = '<span>' + esc(_drillValueLabel(splitBy, o.value)) + '</span><span style="font-weight:600;color:rgba(160,174,192,0.85)">' + o.count.toLocaleString() + '</span>';
    b.onmouseenter = function(){ b.style.background = 'rgba(212,175,55,0.1)'; b.style.borderColor = 'rgba(212,175,55,0.5)'; };
    b.onmouseleave = function(){ b.style.background = 'rgba(255,255,255,0.03)'; b.style.borderColor = 'rgba(212,175,55,0.2)'; };
    b.onclick = function(){
      overlay.remove();
      _drillPath = _drillPath.slice(0, columnIndex);
      _drillPath.push({ splitBy: splitBy, value: o.value });
      _drillRender();
    };
    list.appendChild(b);
  });
  card.appendChild(list);

  var cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.textContent = 'Cancel';
  cancel.style.cssText = 'margin-top:12px;padding:6px 14px;background:transparent;border:1px solid rgba(255,255,255,0.25);border-radius:3px;color:#E5E7EB;font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;align-self:flex-end';
  cancel.onclick = function(){ overlay.remove(); };
  card.appendChild(cancel);

  overlay.appendChild(card);
  overlay.onclick = function(ev){ if(ev.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

function _drillOpenTileInMain(earliest, latest){
  _drillShowInlineHadiths(earliest, latest);
}

function _drillOpenPathInMain(){
  _drillShowInlineHadiths(null, null);
}

function _drillShowInlineHadiths(earliest, latest){
  var panel = document.getElementById('mon-drill-inline-panel');
  if(!panel) return;
  var drillBody = document.getElementById('mon-drill-body');
  var col0El = null;
  if(drillBody){
    drillBody.querySelectorAll('[data-drill-col]').forEach(function(el){
      var idx = parseInt(el.getAttribute('data-drill-col'), 10);
      if(idx === 0) col0El = el;
      else el.style.display = 'none';
    });
  }
  _drillFetch().then(function(all){
    var filtered = [];
    var buckets = _drillClassify(all);
    Object.keys(_drillActiveTiers).forEach(function(k){
      if(_drillActiveTiers[k]) filtered = filtered.concat(buckets[k]);
    });
    var rangeE = earliest, rangeL = latest;
    if((rangeE == null || rangeL == null) && _drillPath.length > 0){
      rangeE = _drillPath[0].sourceEarliest;
      rangeL = _drillPath[0].sourceLatest;
    }
    if(rangeE != null && rangeL != null){
      filtered = filtered.filter(function(h){
        var r = _drillHadithRange(h);
        return r && r.earliest === rangeE && r.latest === rangeL;
      });
    }
    filtered = _drillApplyPath(filtered);
    var hasColFilter = _drillPath.some(function(s){ return s.splitBy === 'collection' && s.value !== null; });
    var hasNarFilter = _drillPath.some(function(s){ return s.splitBy === 'narrator' && s.value !== null; });
    var hasTopicFilter = _drillPath.some(function(s){ return s.splitBy === 'topic' && s.value !== null; });

    var html = '';
    html += '<div class="mon-drill-compact-row">';
    var yearLabel = '';
    if(earliest != null && latest != null){
      yearLabel = (earliest === latest) ? (earliest + ' CE') : (earliest + '\u2013' + latest + ' CE');
    } else if(_drillPath.length > 0){
      var s0 = _drillPath[0];
      yearLabel = (s0.sourceEarliest === s0.sourceLatest) ? (s0.sourceEarliest + ' CE') : (s0.sourceEarliest + '\u2013' + s0.sourceLatest + ' CE');
    }
    if(yearLabel){
      html += '<div class="mon-drill-compact-tile" style="border-color:#D4AF37">' +
        '<button class="mon-drill-compact-x" data-remove="years" type="button">\u2715</button>' +
        '<div class="mon-drill-compact-label">Years</div>' +
        '<div class="mon-drill-compact-value">' + esc(yearLabel) + '</div>' +
      '</div>';
    }
    _drillPath.forEach(function(step, idx){
      if(step.value === null) return;
      var accent = step.sourceAccent || '#D4AF37';
      html += '<div class="mon-drill-compact-tile" style="border-color:' + accent + '">' +
        '<button class="mon-drill-compact-x" data-remove-step="' + idx + '" type="button">\u2715</button>' +
        '<div class="mon-drill-compact-label">' + esc(_drillSplitLabel(step.splitBy)) + '</div>' +
        '<div class="mon-drill-compact-value">' + esc(_drillValueLabel(step.splitBy, step.value)) + '</div>' +
      '</div>';
    });
    html += '<div class="mon-drill-compact-tile mon-drill-compact-count" style="border-color:#D4AF37">' +
      '<div class="mon-drill-compact-label">Hadiths</div>' +
      '<div class="mon-drill-compact-value">' + filtered.length.toLocaleString() + '</div>' +
    '</div>';
    html += '</div>';

    if(!filtered.length){
      html += '<div style="text-align:center;padding:40px;color:#6B7280;font-size:13px">No hadiths match this drill path.</div>';
    } else {
      html += '<div class="mon-drill-inline-row mon-drill-inline-row-hdr">' +
        '<div class="mon-drill-inline-col-a">Source</div>' +
        '<div class="mon-drill-inline-col-b">Hadith</div>' +
      '</div>';
      var limit = Math.min(filtered.length, MAX_ROWS);
      for(var i = 0; i < limit; i++){
        var h = filtered[i];
        var label = getLabel(h._colKey || '');
        var num = getNumber(h);
        var text = getText(h);
        var colA = '<div style="font-family:\'Cinzel\',serif;font-size:11px;color:rgba(212,175,55,0.85);letter-spacing:.06em;margin-bottom:6px">#' + esc(String(num)) + '</div>';
        if(!hasTopicFilter && h.topic){
          colA += '<div class="mon-drill-src-field"><span class="mon-drill-src-label">Topic</span><span class="mon-drill-src-val">' + esc(h.topic) + '</span></div>';
        }
        if(!hasColFilter){
          colA += '<div class="mon-drill-src-field"><span class="mon-drill-src-label">Book</span><span class="mon-drill-src-val">' + esc(label) + '</span></div>';
        }
        if(!hasNarFilter){
          var termNar = getNarrator(h) || '';
          termNar = _stripArabic((termNar + '').split('(')[0].trim());
          if(termNar){
            colA += '<div class="mon-drill-src-field"><span class="mon-drill-src-label">Narrator</span><span class="mon-drill-src-val">' + esc(termNar) + '</span></div>';
          }
        }
        colA += '<div class="mon-narrator-chainonly" style="margin-top:8px">' + _chainOnlyBlock(h) + '</div>';
        html += '<div class="mon-drill-inline-row">' +
          '<div class="mon-drill-inline-col-a">' + colA + '</div>' +
          '<div class="mon-drill-inline-col-b">' +
            '<div style="font-size:13px;color:#E5E7EB;line-height:1.55">' + esc(text) + '</div>' +
            _datingLine(h) +
          '</div>' +
        '</div>';
      }
      if(filtered.length > MAX_ROWS){
        html += '<div style="text-align:center;padding:12px;color:#D4AF37;font-size:11px;letter-spacing:.06em;border-top:1px solid #2D3748">\u2026 ' + (filtered.length - MAX_ROWS) + ' more results truncated.</div>';
      }
    }

    panel.innerHTML = html;
    panel.style.display = 'block';

    panel.querySelectorAll('.mon-drill-compact-x').forEach(function(btn){
      btn.onclick = function(ev){
        ev.stopPropagation();
        var stepAttr = btn.getAttribute('data-remove-step');
        var removeYears = btn.getAttribute('data-remove') === 'years';
        if(col0El){ col0El.style.transform = ''; col0El.style.transition = ''; }
        if(removeYears){
          _drillPath = [];
          _drillRender();
          return;
        }
        if(stepAttr !== null){
          var idx = parseInt(stepAttr, 10);
          _drillPath = _drillPath.slice(0, idx);
        }
        _drillRender();
      };
    });

    if(col0El && rangeE != null && rangeL != null){
      col0El.style.transform = '';
      var tileKey = rangeE + '-' + rangeL;
      var srcTile = col0El.querySelector('[data-group-key="' + tileKey + '"]');
      var yearLabelEl = null;
      var yearTargets = ['' + rangeE + ' CE', 'HIJRA ' + rangeE, 'PROPHET D. ' + rangeE];
      var allDivs = col0El.querySelectorAll('div');
      for(var di = 0; di < allDivs.length; di++){
        var d = allDivs[di];
        if(d.children.length !== 0) continue;
        var txt = (d.textContent || '').trim();
        if(yearTargets.indexOf(txt) !== -1){ yearLabelEl = d; break; }
      }
      var col0Rect = col0El.getBoundingClientRect();
      var topY = null;
      if(srcTile){
        var tr = srcTile.getBoundingClientRect();
        topY = tr.top - col0Rect.top;
      }
      if(yearLabelEl){
        var yr = yearLabelEl.getBoundingClientRect();
        var yTop = yr.top - col0Rect.top;
        if(topY === null || yTop < topY) topY = yTop;
      }
      if(topY !== null){
        var offset = topY - 8;
        if(offset < 0) offset = 0;
        col0El.style.transform = 'translateY(' + (-offset) + 'px)';
        col0El.style.transition = 'transform 0.3s ease';
      }
    }
    panel.querySelectorAll('.mon-chain-toggle').forEach(function(btn){
      btn.onclick = function(){
        var chain = btn.parentNode.querySelector('.mon-chain');
        if(!chain) return;
        chain.style.display = (chain.style.display !== 'none') ? 'none' : 'block';
      };
    });
  });
}

function _drillHexToRgb(hex){
  var h = hex.replace('#','');
  var r = parseInt(h.substr(0,2),16);
  var g = parseInt(h.substr(2,2),16);
  var b = parseInt(h.substr(4,2),16);
  return r + ',' + g + ',' + b;
}

function _drillLaneHeight(){
  return _drillExpanded
    ? (DRILL_YEAR_MAX - DRILL_YEAR_MIN) * _drillYearRow
    : (DRILL_COLLAPSED_TICKS.length - 1) * _drillMarkerRow + 20;
}

function _drillYearToPx(year){
  if(year < DRILL_YEAR_MIN) year = DRILL_YEAR_MIN;
  if(year > DRILL_YEAR_MAX) year = DRILL_YEAR_MAX;
  if(_drillExpanded){
    return (year - DRILL_YEAR_MIN) * _drillYearRow;
  }
  for(var i = 0; i < DRILL_COLLAPSED_TICKS.length - 1; i++){
    var a = DRILL_COLLAPSED_TICKS[i], b = DRILL_COLLAPSED_TICKS[i+1];
    if(year >= a && year <= b){
      var t = (year - a) / (b - a);
      return (i + t) * _drillMarkerRow + 10;
    }
  }
  return 0;
}

function _drillJitterPct(h, bound){
  var s = (h.id || '') + '';
  var hash = 0;
  for(var i=0;i<s.length;i++){ hash = (hash * 31 + s.charCodeAt(i)) & 0xffffffff; }
  var norm = (Math.abs(hash) % 1000) / 1000;
  return bound.min + norm * (bound.max - bound.min);
}

function _drillDecadeCounts(hadiths){
  var DEC_MIN = Math.floor(DRILL_YEAR_MIN / 10) * 10;
  var DEC_MAX = Math.ceil(DRILL_YEAR_MAX / 10) * 10;
  var decades = [];
  for(var y = DEC_MIN; y < DEC_MAX; y += 10) decades.push(y);
  var counts = {};
  decades.forEach(function(y){ counts[y] = 0; });

  hadiths.forEach(function(h){
    var r = _drillHadithRange(h);
    if(!r) return;
    var first = Math.max(DEC_MIN, Math.floor(r.earliest / 10) * 10);
    var last  = Math.min(DEC_MAX - 10, Math.floor(r.latest / 10) * 10);
    if(last < first) last = first;
    var n = ((last - first) / 10) + 1;
    var share = 1 / n;
    for(var d = first; d <= last; d += 10){
      if(counts[d] != null) counts[d] += share;
    }
  });
  return { decades: decades, counts: counts };
}

function _drillTierLaneHtml(meta, hadiths){
  var laneH = _drillLaneHeight();
  var rgb = _drillHexToRgb(meta.color);

  var marks = '';

  if(meta.key === 'T1' || meta.key === 'T2'){
    hadiths.forEach(function(h){
      var r = _drillHadithRange(h);
      if(!r) return;
      var topA = _drillYearToPx(r.earliest);
      var topB = _drillYearToPx(r.latest);
      if(topB < topA){ var t = topA; topA = topB; topB = t; }
      var barH = Math.max(2, topB - topA);
      var leftPct = _drillJitterPct(h, {min:12, max:88});

      if(meta.key === 'T1'){
        marks += '<div title="' + esc(h.id||'') + ' \u00B7 ' + r.earliest + (r.latest !== r.earliest ? '\u2013' + r.latest : '') + ' CE" style="position:absolute;top:' + topA + 'px;left:' + leftPct + '%;transform:translate(-50%,-50%);width:5px;height:5px;border-radius:50%;background:' + meta.color + ';opacity:0.85"></div>';
      } else {
        marks += '<div title="' + esc(h.id||'') + ' \u00B7 ' + r.earliest + '\u2013' + r.latest + ' CE" style="position:absolute;top:' + topA + 'px;left:' + leftPct + '%;transform:translateX(-50%);width:3px;height:' + barH + 'px;background:' + meta.color + ';opacity:0.7;border-radius:1px"></div>';
      }
    });
  } else {
    var dc = _drillDecadeCounts(hadiths);
    var maxC = 0;
    dc.decades.forEach(function(y){ if(dc.counts[y] > maxC) maxC = dc.counts[y]; });
    if(maxC === 0) maxC = 1;

    dc.decades.forEach(function(y){
      var c = dc.counts[y];
      if(c === 0) return;
      var topA = _drillYearToPx(y);
      var topB = _drillYearToPx(y + 10);
      var h = Math.max(3, topB - topA);
      var alpha = 0.15 + 0.75 * (c / maxC);
      marks += '<div title="' + y + 's: ' + c.toFixed(1) + ' hadiths" style="position:absolute;top:' + topA + 'px;left:6%;right:6%;height:' + h + 'px;background:rgba(' + rgb + ',' + alpha.toFixed(3) + ');border-top:1px solid rgba(' + rgb + ',0.35)"></div>' +
        '<div style="position:absolute;top:' + (topA + h/2 - 6) + 'px;left:0;right:0;text-align:center;font-size:9px;color:rgba(229,231,235,0.85);font-weight:600;pointer-events:none">' + Math.round(c).toLocaleString() + '</div>';
    });
  }

  return '' +
    '<div style="flex:1;min-width:140px;max-width:220px">' +
      '<div style="margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid rgba(' + rgb + ',0.3)">' +
        '<div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">' +
          '<div style="font-family:\'Cinzel\',serif;font-size:11px;letter-spacing:.08em;color:' + meta.color + ';text-transform:uppercase;font-weight:600">' + meta.key + ' \u00B7 ' + esc(meta.label) + '</div>' +
          '<div style="font-size:11px;color:#E5E7EB;font-weight:600">' + hadiths.length.toLocaleString() + '</div>' +
        '</div>' +
        '<div style="font-size:10px;color:rgba(160,174,192,0.65);margin-top:2px">' + esc(meta.sub) + ' \u00B7 ' + esc(meta.span) + '</div>' +
      '</div>' +
      '<div style="position:relative;height:' + laneH + 'px;background:rgba(' + rgb + ',0.03);border-radius:2px">' + marks + '</div>' +
    '</div>';
}

function _drillColumnHtml(meta, hadiths, tierColorMap){
  if(!hadiths.length){
    return '<div style="padding:40px;text-align:center;color:rgba(160,174,192,0.7)">No hadiths in this tier.</div>';
  }

  var CONNECTOR_PALETTE = ['#5CAA9E','#A06C6C','#7C6CA0','#C97B5C','#6CA09C','#A09C6C','#9E5C8B','#8BA05C'];

  var groups = {};
  hadiths.forEach(function(h){
    var r = _drillHadithRange(h);
    if(!r) return;
    var key = r.earliest + '-' + r.latest;
    if(!groups[key]){ groups[key] = { earliest:r.earliest, latest:r.latest, hadiths:[] }; }
    groups[key].hadiths.push(h);
  });
  var groupList = Object.keys(groups).map(function(k){ return groups[k]; });
  if(!groupList.length){
    return '<div style="padding:40px;text-align:center;color:rgba(160,174,192,0.7)">No dated hadiths in this tier.</div>';
  }
  groupList.sort(function(a,b){
    if(a.earliest !== b.earliest) return a.earliest - b.earliest;
    return (a.latest - a.earliest) - (b.latest - b.earliest);
  });

  var sourceTileKeys = {};
  _drillPath.forEach(function(step){
    sourceTileKeys[step.sourceEarliest + '-' + step.sourceLatest] = true;
  });

  var ROW_H = 56;
  var rows = [];
  var yearAnchored = {};

  groupList.forEach(function(g){
    var anchor = null;
    if(g.earliest === g.latest){
      if(!yearAnchored[g.earliest]) anchor = g.earliest;
    } else {
      for(var y = g.earliest; y <= g.latest; y++){
        if(!yearAnchored[y]){ anchor = y; break; }
      }
    }
    var shaded = (anchor === null);
    var rowIdx = rows.length;
    rows.push({ group: g, labelYear: anchor, shaded: shaded, rowIndex: rowIdx });
    if(anchor !== null) yearAnchored[anchor] = rowIdx;
  });

  var totalH = rows.length * ROW_H;

  var sourceYearSet = {};
  if(_drillPath.length > 0){
    for(var sk in sourceTileKeys){
      var sp = sk.split('-');
      var sE = parseInt(sp[0],10), sL = parseInt(sp[1],10);
      for(var sy = sE; sy <= sL; sy++) sourceYearSet[sy] = true;
    }
  }

  var yearCol = '';
  rows.forEach(function(r){
    if(r.labelYear === null) return;
    var top = r.rowIndex * ROW_H;
    var y = r.labelYear;
    var isHijra = y === 622;
    var isDeath = y === 632;
    var isSourceYear = !!sourceYearSet[y];
    var drillActive = _drillPath.length > 0;
    var labelColor, fontWeight, tickBg;
    if(isSourceYear){
      labelColor = '#D4AF37';
      fontWeight = '700';
      tickBg = '#D4AF37';
    } else if(isHijra){
      labelColor = drillActive ? 'rgba(212,175,55,0.3)' : '#D4AF37';
      fontWeight = '600';
      tickBg = drillActive ? 'rgba(160,174,192,0.15)' : 'rgba(160,174,192,0.5)';
    } else if(isDeath){
      labelColor = drillActive ? 'rgba(180,84,84,0.3)' : '#B45454';
      fontWeight = '600';
      tickBg = drillActive ? 'rgba(160,174,192,0.15)' : 'rgba(160,174,192,0.5)';
    } else {
      labelColor = drillActive ? 'rgba(160,174,192,0.2)' : 'rgba(160,174,192,0.75)';
      fontWeight = '400';
      tickBg = drillActive ? 'rgba(160,174,192,0.1)' : 'rgba(160,174,192,0.5)';
    }
    var label = isHijra ? 'HIJRA 622' : (isDeath ? 'PROPHET D. 632' : y + ' CE');
    yearCol +=
      '<div style="position:absolute;top:' + (top + ROW_H/2 - 7) + 'px;left:0;right:14px;text-align:right;font-family:\'Cinzel\',serif;font-size:' + (isSourceYear ? '11px' : '10px') + ';color:' + labelColor + ';font-weight:' + fontWeight + ';white-space:nowrap">' + label + '</div>' +
      '<div style="position:absolute;top:' + (top + ROW_H/2) + 'px;right:0;width:' + (isSourceYear ? '14px' : '8px') + ';height:' + (isSourceYear ? '2px' : '1px') + ';background:' + tickBg + '"></div>';
  });

  var SPINE_X = 6;
  var spineOpacity = _drillPath.length > 0 ? '0.15' : '0.6';
  var braceSvg = '<line x1="' + SPINE_X + '" y1="0" x2="' + SPINE_X + '" y2="' + totalH + '" stroke="#D4AF37" stroke-width="1.5" opacity="' + spineOpacity + '"/>';
  var BRACE_W = 40;
  var TIP_X   = BRACE_W;
  var multiIdx = 0;

  rows.forEach(function(r){
    r._connectorColor = null;
    if(r.group.earliest === r.group.latest) return;
    var color = CONNECTOR_PALETTE[multiIdx % CONNECTOR_PALETTE.length];
    multiIdx++;
    r._connectorColor = color;
    var tileY = r.rowIndex * ROW_H + ROW_H/2;

    var firstY = null, lastY = null;
    for(var y = r.group.earliest; y <= r.group.latest; y++){
      if(yearAnchored[y] != null){
        if(firstY === null) firstY = y;
        lastY = y;
      }
    }
    if(firstY === null){ firstY = r.group.earliest; lastY = r.group.latest; }
    var topY = (yearAnchored[firstY] != null ? yearAnchored[firstY] * ROW_H + ROW_H/2 : r.rowIndex * ROW_H + ROW_H/2);
    var botY = (yearAnchored[lastY]  != null ? yearAnchored[lastY]  * ROW_H + ROW_H/2 : r.rowIndex * ROW_H + ROW_H/2);

    var lineOpacity = (_drillPath.length > 0 && !sourceTileKeys[r.group.earliest + '-' + r.group.latest]) ? '0.15' : '0.95';
    if(topY === botY){
      braceSvg += '<line x1="' + SPINE_X + '" y1="' + topY + '" x2="' + TIP_X + '" y2="' + tileY + '" stroke="' + color + '" stroke-width="2" opacity="' + lineOpacity + '"/>';
    } else {
      braceSvg += '<line x1="' + SPINE_X + '" y1="' + topY + '" x2="' + TIP_X + '" y2="' + tileY + '" stroke="' + color + '" stroke-width="2" opacity="' + lineOpacity + '"/>';
      braceSvg += '<line x1="' + SPINE_X + '" y1="' + botY + '" x2="' + TIP_X + '" y2="' + tileY + '" stroke="' + color + '" stroke-width="2" opacity="' + lineOpacity + '"/>';
    }
    braceSvg += '<circle cx="' + SPINE_X + '" cy="' + topY + '" r="3" fill="' + color + '" opacity="' + lineOpacity + '"/>';
    if(topY !== botY){
      braceSvg += '<circle cx="' + SPINE_X + '" cy="' + botY + '" r="3" fill="' + color + '" opacity="' + lineOpacity + '"/>';
    }
  });

  rows.forEach(function(r){
    if(!sourceTileKeys[r.group.earliest + '-' + r.group.latest]) return;
    if(r.group.earliest !== r.group.latest) return;
    var tileY = r.rowIndex * ROW_H + ROW_H/2;
    braceSvg += '<line x1="' + SPINE_X + '" y1="' + tileY + '" x2="' + TIP_X + '" y2="' + tileY + '" stroke="#D4AF37" stroke-width="2.5" opacity="0.95"/>';
    braceSvg += '<circle cx="' + SPINE_X + '" cy="' + tileY + '" r="3.5" fill="#D4AF37"/>';
  });

  var tilesHtml = '';
  rows.forEach(function(r){
    var g = r.group;
    var tileTierColor = null;
    if(tierColorMap){
      var colorCounts = {};
      g.hadiths.forEach(function(h){
        var c = tierColorMap[h.id || h] || meta.color;
        colorCounts[c] = (colorCounts[c] || 0) + 1;
      });
      var topC = null, topN = 0;
      for(var c in colorCounts){ if(colorCounts[c] > topN){ topN = colorCounts[c]; topC = c; } }
      tileTierColor = topC;
    }
    var tileColor = r._connectorColor || tileTierColor || meta.color;
    var rgb = _drillHexToRgb(tileColor);
    var top = r.rowIndex * ROW_H + 4;
    var tileH = ROW_H - 8;
    var rangeLabel = g.earliest === g.latest ? (g.earliest + ' CE') : (g.earliest + '\u2013' + g.latest + ' CE');
    tilesHtml +=
      (function(){
        var isSource = !!sourceTileKeys[g.earliest + '-' + g.latest];
        var anyDrillActive = _drillPath.length > 0;
        var isDim = anyDrillActive && !isSource;
        var ringShadow = isSource ? 'box-shadow:0 0 0 3px ' + tileColor + ', 0 0 28px 4px rgba(' + rgb + ',0.75), inset 0 0 14px rgba(' + rgb + ',0.28);' : '';
        var dimStyle = isDim ? 'opacity:0.22;filter:saturate(0.4);' : '';
        return '<div class="mon-drill-tile' + (isSource ? ' mon-drill-tile-source' : '') + '" data-group-key="' + g.earliest + '-' + g.latest + '" data-tile-color="' + tileColor + '" style="' +
          'position:absolute;top:' + top + 'px;left:0;right:0;height:' + tileH + 'px;' +
          'background:transparent;border:3px solid ' + tileColor + ';border-radius:3px;overflow:hidden;display:flex;flex-direction:column;' + ringShadow + dimStyle + '">';
      })() +
        '<div style="padding:4px 10px;display:flex;align-items:center;justify-content:space-between;gap:8px;flex:1">' +
          '<span style="font-family:\'Cinzel\',serif;font-size:14px;color:#FFFFFF;font-weight:700">' + g.hadiths.length.toLocaleString() + '</span>' +
          '<span style="font-size:10px;color:#E5E7EB;font-family:\'Lato\',sans-serif">' + esc(rangeLabel) + '</span>' +
        '</div>' +
        '<div style="display:flex;gap:0;flex:none;border-top:1px solid rgba(' + rgb + ',0.25)">' +
          '<button class="mon-drill-view" data-group-key="' + g.earliest + '-' + g.latest + '" type="button" style="flex:1;padding:3px 6px;background:transparent;border:none;color:#E5E7EB;font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">View</button>' +
          '<button class="mon-drill-expand" data-group-key="' + g.earliest + '-' + g.latest + '" type="button" style="flex:1;padding:3px 6px;background:transparent;border:none;border-left:1px solid rgba(' + rgb + ',0.25);color:#E5E7EB;font-family:\'Cinzel\',serif;font-size:9px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer">Expand</button>' +
        '</div>' +
      '</div>';
  });

  var headerHtml =
    '<div style="margin-bottom:10px;font-size:12px;color:rgba(160,174,192,0.75);padding-bottom:6px;border-bottom:1px solid rgba(212,175,55,0.1)">' +
      hadiths.length.toLocaleString() + ' hadiths \u00B7 ' + groupList.length + ' date groups' +
    '</div>';

  var body =
    '<div>' + headerHtml +
      '<div style="display:flex;gap:0;align-items:flex-start">' +
        '<div style="flex:none;width:60px;position:relative;height:' + totalH + 'px;margin-right:8px">' + yearCol + '</div>' +
        '<div style="flex:none;width:40px;position:relative;height:' + totalH + 'px;margin-right:-2px">' +
          '<svg width="40" height="' + totalH + '" style="position:absolute;inset:0;overflow:visible">' + braceSvg + '</svg>' +
        '</div>' +
        '<div style="flex:none;position:relative;width:130px;height:' + totalH + 'px">' + tilesHtml + '</div>' +
      '</div>' +
    '</div>';

  return body;
}

function _drillBindTierChips(){
  _drillEl.querySelectorAll('.mon-drill-tier-chip').forEach(function(btn){
    btn.onclick = function(){
      var k = btn.getAttribute('data-tier');
      _drillActiveTiers[k] = !_drillActiveTiers[k];
      var anyOn = Object.keys(_drillActiveTiers).some(function(kk){ return _drillActiveTiers[kk]; });
      if(!anyOn) _drillActiveTiers[k] = true;
      _drillRender();
    };
  });
}
var _wizardState = null;
var _wizardAllHadith = null;

function esc(s){
  var d = document.createElement('div');
  d.textContent = s || '';
  return d.innerHTML;
}

function truncate(s, max){
  if(!s) return '';
  return s.length > max ? s.substring(0, max) + '\u2026' : s;
}

function getField(obj, names){
  for(var i = 0; i < names.length; i++){
    if(obj[names[i]] != null && obj[names[i]] !== '') return obj[names[i]];
  }
  return '';
}

function getNumber(h){ return getField(h, ['hadith_no','hadithNumber','number','id']); }
function getText(h){ return getField(h, ['matn_en','text','english','body','hadith_text']); }
function getNarrator(h){
  var narrs = h.narrators;
  if(Array.isArray(narrs) && narrs.length){
    var last = narrs[narrs.length - 1];
    var name = (last.name || '').split('(')[0].trim();
    if(name) return name;
  }
  var raw = getField(h, ['narrator','chain','narrated_by']);
  if(typeof raw === 'string' && raw.indexOf(',') !== -1){
    var parts = raw.split(',');
    return parts[parts.length - 1].trim();
  }
  if(typeof raw === 'string' && raw.indexOf('|') !== -1){
    var parts2 = raw.split('|');
    return parts2[parts2.length - 1].trim();
  }
  return raw;
}
function getLabel(key){
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key) return COLLECTIONS[i].label;
  }
  return key;
}

function _monPeriodInfo(id){
  for(var i = 0; i < MON_PERIODS.length; i++){
    if(MON_PERIODS[i].id === id) return MON_PERIODS[i];
  }
  return null;
}

function _normName(s){
  return (s||'').toLowerCase().replace(/[^a-z ]/g,'').replace(/\s+/g,' ').trim();
}
function _buildPeopleIndex(){
  if(_peopleIndex && Object.keys(_peopleIndex).length) return;
  var arr = (typeof PEOPLE !== 'undefined' && PEOPLE && PEOPLE.length) ? PEOPLE : null;
  if(!arr){ _peopleIndex = null; return; }
  _peopleIndex = {};
  arr.forEach(function(p){
    var n = _normName(p.famous);
    if(n) _peopleIndex[n] = p.famous;
    var s = _normName(p.slug);
    if(s) _peopleIndex[s] = p.famous;
  });
}
function _matchNarrator(name){
  _buildPeopleIndex();
  if(!_peopleIndex || !Object.keys(_peopleIndex).length) return null;
  var n = _normName(name);
  if(!n) return null;
  if(_peopleIndex[n]) return _peopleIndex[n];
  var keys = Object.keys(_peopleIndex);
  for(var i = 0; i < keys.length; i++){
    var k = keys[i];
    if(k.length < 4 || n.length < 4) continue;
    if(k === n) return _peopleIndex[k];
    // substring match in either direction
    if((' '+k+' ').indexOf(' '+n+' ') !== -1) return _peopleIndex[k];
    if((' '+n+' ').indexOf(' '+k+' ') !== -1) return _peopleIndex[k];
    if(k.indexOf(n) !== -1) return _peopleIndex[k];
    if(n.indexOf(k) !== -1) return _peopleIndex[k];
  }
  return null;
}

function showLoading(on){
  if(_loadingEl) _loadingEl.style.display = on ? 'block' : 'none';
  if(_resultsEl) _resultsEl.style.display = on ? 'none' : 'block';
}

function fetchCollection(key){
  if(_cache[key]) return Promise.resolve(_cache[key]);
  var col = null;
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key){ col = COLLECTIONS[i]; break; }
  }
  if(!col) return Promise.resolve([]);
  return fetch(col.file).then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    if(!Array.isArray(data)) data = [];
    _cache[key] = data;
    return data;
  }).catch(function(e){
    console.warn('Failed to load ' + col.file + ':', e);
    _cache[key] = [];
    return [];
  });
}

function fetchAll(){
  var promises = COLLECTIONS.map(function(c){ return fetchCollection(c.key); });
  return Promise.all(promises).then(function(results){
    var all = [];
    results.forEach(function(arr, i){
      arr.forEach(function(h){ h._colKey = COLLECTIONS[i].key; });
      all = all.concat(arr);
    });
    return all;
  });
}

function _stripArabic(s){
  return String(s || '').replace(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g, '').replace(/\s+/g, ' ').trim();
}

function _narratorCell(name){
  name = _stripArabic(name);
  if(!name) return '';
  var matched = _matchNarrator(name);
  if(matched){
    return '<span class="mon-narrator-tag" data-famous="' + esc(matched) + '" style="cursor:pointer;padding:2px 8px;border:1px solid rgba(212,175,55,0.4);border-radius:3px;background:rgba(212,175,55,0.08);color:#D4AF37;font-weight:500;font-size:12px">' + esc(name) + '</span>';
  }
  return '<span style="color:rgba(229,231,235,0.75)">' + esc(name) + '</span>';
}

function _gradeShort(g){
  if(!g) return '';
  var s = String(g), m;
  if(s.indexOf('Comp.(RA)') !== -1) return 'Companion';
  if((m = s.match(/Follower\(Tabi'\)\s*\[(\d+)(st|nd|rd|th)\s*Generation\]/i))) return "Tabi'i (" + m[1] + m[2] + ' gen)';
  if((m = s.match(/Succ\.\s*\(Taba'\s*Tabi'\)\s*\[(\d+)(st|nd|rd|th)\s*generation\]/i))) return "Taba' Tabi'i (" + m[1] + m[2] + ' gen)';
  if((m = s.match(/(\d+)(st|nd|rd|th)\s*Century\s*AH/i))) return m[1] + m[2] + ' century AH';
  return s;
}

function _chainOnlyBlock(h){
  var narrs = Array.isArray(h.narrators) ? h.narrators : [];
  if(!narrs.length){
    return '<div style="color:rgba(160,174,192,0.7);font-style:italic;font-size:11px">(Chain omitted)</div>';
  }
  var N = narrs.length;
  var toggle = '<button class="mon-chain-toggle" type="button" style="display:inline-flex;align-items:center;gap:4px;background:transparent;border:1px solid rgba(212,175,55,0.3);border-radius:2px;padding:3px 8px;color:rgba(212,175,55,0.85);font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;cursor:pointer">\u25BC CHAIN (' + N + ')</button>';
  var rows = '';
  for(var i = N - 1, pos = 1; i >= 0; i--, pos++){
    var nr = narrs[i];
    var nm = _stripArabic((nr.name || '').split('(')[0].trim()) || '(unknown)';
    var isTerm = (pos === 1);
    var grade = isTerm ? 'Companion' : _gradeShort(nr.grade);
    var dy = (nr.death_year != null && nr.death_year !== '') ? ' \u00B7 d. ' + String(nr.death_year) : '';
    var gradeHtml = _glossWrap(grade) + esc(dy);
    rows += '<div style="padding:4px 0;display:flex;gap:8px;align-items:baseline">' +
              '<span style="color:rgba(212,175,55,0.7);font-size:11px;min-width:18px">' + pos + '.</span>' +
              '<div style="flex:1">' +
                '<div style="color:#E5E7EB;font-size:12px">' + esc(nm) + '</div>' +
                '<div style="color:rgba(160,174,192,0.7);font-size:10px;margin-top:2px">' + gradeHtml + '</div>' +
              '</div>' +
            '</div>';
  }
  var panel = '<div class="mon-chain" style="display:none;margin-top:6px;padding:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:3px">' + rows + '</div>';
  return toggle + panel;
}

function _narratorBlock(h){
  var narrs = Array.isArray(h.narrators) ? h.narrators : [];
  if(!narrs.length){
    return '<div style="color:rgba(160,174,192,0.7);font-style:italic;font-size:12px">(Chain omitted in source)</div>';
  }
  var terminal = narrs[narrs.length - 1];
  var termName = _stripArabic((terminal.name || '').split('(')[0].trim());
  var termCell = _narratorCell(termName);
  var N = narrs.length;
  var toggle = '<button class="mon-chain-toggle" type="button" style="display:block;margin-top:6px;background:transparent;border:none;padding:0;color:rgba(212,175,55,0.7);font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;cursor:pointer">\u25BC CHAIN (' + N + ')</button>';
  var rows = '';
  for(var i = N - 1, pos = 1; i >= 0; i--, pos++){
    var nr = narrs[i];
    var nm = _stripArabic((nr.name || '').split('(')[0].trim()) || '(unknown)';
    var isTerm = (pos === 1);
    var isComp = (i === 0);
    var grade = isTerm ? 'Companion' : _gradeShort(nr.grade);
    var dy = (nr.death_year != null && nr.death_year !== '') ? ' \u00B7 d. ' + String(nr.death_year) : '';
    var gradeHtml = _glossWrap(grade) + esc(dy);
    var relHtml = nr.reliability_grade ? ' <span style="color:rgba(212,175,55,0.8)">\u00B7 ' + _glossWrap(String(nr.reliability_grade)) + '</span>' : '';
    var tail = isTerm
      ? '<div style="color:rgba(212,175,55,0.65);font-size:10px;font-style:italic;margin-top:2px">\u2191 heard from the Prophet</div>'
      : (isComp ? '<div style="color:rgba(160,174,192,0.6);font-size:10px;font-style:italic;margin-top:2px">(compiler\'s direct source)</div>' : '');
    rows += '<div style="padding:4px 0;display:flex;gap:8px;align-items:baseline">' +
              '<span style="color:rgba(212,175,55,0.7);font-size:11px;min-width:18px">' + pos + '.</span>' +
              '<div style="flex:1">' +
                '<div style="color:#E5E7EB;font-size:12px">' + esc(nm) + '</div>' +
                '<div style="color:rgba(160,174,192,0.7);font-size:10px;margin-top:2px">' + gradeHtml + relHtml + '</div>' +
                tail +
              '</div>' +
            '</div>';
  }
  var panel = '<div class="mon-chain" style="display:none;margin-top:8px;padding:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(212,175,55,0.2);border-radius:4px">' +
                '<div style="font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.1em;color:rgba(212,175,55,0.85);text-transform:uppercase;margin-bottom:6px">Chain of Narration</div>' +
                rows +
              '</div>';
  return termCell + toggle + panel;
}

// ── Dating line builder ──
function _datingLine(h){
  var rangeText, confidence, tooltip;

  if(h.dating && h.dating.range){
    rangeText = '~' + h.dating.range.earliest + '\u2013' + h.dating.range.latest + ' CE';
    confidence = h.dating.confidence || 'low';
    if(h.dating.evidence && h.dating.evidence.length){
      tooltip = h.dating.evidence.map(function(e){ return e.layer + ': ' + e.note; }).join('\n');
    } else {
      tooltip = 'Based on narrator period only';
    }
  } else {
    var pi = _monPeriodInfo(h.period);
    rangeText = pi ? (pi.label + ' Era \u00B7 ' + pi.years) : 'Unknown period';
    confidence = 'period_only';
    tooltip = 'Based on narrator period only';
  }

  var cs = CONF_STYLES[confidence] || CONF_STYLES.period_only;

  return '<div class="mon-dating" style="margin-top:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:\'Lato\',sans-serif;font-size:10px;letter-spacing:.06em;text-transform:uppercase;color:rgba(160,174,192,0.8)">' +
    '<span>Tentative Dating</span>' +
    '<span style="color:rgba(255,255,255,0.3)">\u00B7</span>' +
    '<span>' + esc(rangeText) + '</span>' +
    '<span class="mon-conf-badge" title="' + esc(tooltip) + '" style="cursor:help;padding:2px 7px;border-radius:3px;font-size:9px;font-weight:600;letter-spacing:.08em;background:' + cs.bg + ';color:' + cs.text + '">' + cs.label + '</span>' +
    '</div>';
}

// ── Timeline band ──
function _buildBand(){
  if(!_bandEl) return;
  var html = '';
  MON_PERIODS.forEach(function(p, i){
    var br = (i < MON_PERIODS.length - 1) ? 'border-right:1px solid rgba(0,0,0,0.35);' : '';
    html += '<div class="mon-period-seg" data-period="' + p.id + '" data-rgb="' + p.rgb + '" style="' +
      'position:relative;flex:' + p.span + ';background:rgba(' + p.rgb + ',0.55);' +
      'display:flex;align-items:center;justify-content:center;' +
      'font-family:\'Cinzel\',serif;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;' +
      'color:#FFFFFF;text-shadow:0 1px 2px rgba(0,0,0,0.85),0 0 3px rgba(0,0,0,0.6);' +
      'transition:background .2s;' + br + '">' +
      '<span>' + esc(p.label) + '</span>' +
      '<span class="mon-period-count" data-period="' + p.id + '" style="' +
        'position:absolute;right:6px;bottom:2px;' +
        'font-family:\'Lato\',sans-serif;font-size:9px;font-weight:400;letter-spacing:.04em;text-transform:none;' +
        'color:rgba(255,255,255,0.55);text-shadow:0 1px 2px rgba(0,0,0,0.7);' +
        '"></span>' +
      '</div>';
  });
  _bandEl.style.cssText = 'display:flex;width:100%;height:34px;margin:12px 0 8px;border-radius:3px;overflow:hidden;border:1px solid rgba(255,255,255,0.12)';
  _bandEl.innerHTML = html;
  _paintBandCounts();
}

function _paintBandCounts(){
  if(!_bandEl || !_periodTotals) return;
  _bandEl.querySelectorAll('.mon-period-count').forEach(function(el){
    var n = _periodTotals[el.dataset.period] || 0;
    el.textContent = n ? n.toLocaleString() : '';
  });
}

function _computePeriodTotals(){
  if(_periodTotals) { _paintBandCounts(); return; }
  fetchAll().then(function(all){
    var out = {};
    MON_PERIODS.forEach(function(p){ out[p.id] = 0; });
    all.forEach(function(h){ if(out[h.period] != null) out[h.period]++; });
    _periodTotals = out;
    _paintBandCounts();
  });
}

function _syncBand(){
  if(!_bandEl) return;
  var sel = _monSel.period;
  _bandEl.querySelectorAll('.mon-period-seg').forEach(function(seg){
    var rgb = seg.dataset.rgb;
    if(!sel || sel.size === 0){
      seg.style.background = 'rgba(' + rgb + ',0.55)';
    } else if(sel.has(seg.dataset.period)){
      seg.style.background = 'rgba(' + rgb + ',0.95)';
    } else {
      seg.style.background = 'rgba(' + rgb + ',0.18)';
    }
  });
}


// ── Methodology modal ──
function _openMethodology(e){
  e.stopPropagation();
  if(document.getElementById('mon-modal')) return;

  var overlay = document.createElement('div');
  overlay.id = 'mon-modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';

  overlay.innerHTML =
    '<div style="background:#1A2332;border:1px solid rgba(212,175,55,0.3);border-radius:6px;max-width:680px;width:100%;max-height:85vh;overflow-y:auto;padding:28px 32px;position:relative;font-family:\'Lato\',sans-serif;color:#E5E7EB">' +
      '<button id="mon-modal-close" style="position:absolute;top:10px;right:14px;background:transparent;border:none;color:#A0AEC0;font-size:24px;cursor:pointer;line-height:1">\u00D7</button>' +
      '<h2 style="font-family:\'Cinzel\',serif;font-size:18px;letter-spacing:.12em;color:#D4AF37;margin:0 0 16px">TENTATIVE DATING \u2014 METHODOLOGY</h2>' +
      '<p style="font-size:13px;line-height:1.6;margin:0 0 16px">Hadiths are reports about events from the Prophet\u2019s life (610\u2013632 CE) and after. None carry an exact date. What you see here is a best-effort reconstruction built by layering evidence. This is tentative by design and will keep improving as we connect more sources.</p>' +
      '<h3 style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.1em;color:#D4AF37;margin:20px 0 10px">CONFIDENCE LEVELS</h3>' +
      '<div style="font-size:13px;line-height:1.7">' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#D4AF37;color:#0E1621;margin-right:8px">HIGH</span>Hadith text names a specific dated event (e.g. Battle of Badr, 624 CE). Range typically 1\u20133 years.</p>' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#6B8E6B;color:#FFFFFF;margin-right:8px">MEDIUM</span>Multiple contextual clues line up (companion mentioned, location cue, surah cited). Range typically 5\u201315 years.</p>' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#5C7A8C;color:#FFFFFF;margin-right:8px">LOW</span>Only one weak clue beyond narrator period. Range usually covers most of the narrator\u2019s active life.</p>' +
        '<p style="margin:0 0 8px"><span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.08em;background:#666;color:#FFFFFF;margin-right:8px">PERIOD ONLY</span>No clues in the text itself \u2014 dating falls back to the narrator\u2019s broad period.</p>' +
      '</div>' +
      '<h3 style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.1em;color:#D4AF37;margin:20px 0 10px">LAYERS CURRENTLY APPLIED</h3>' +
      '<div style="font-size:13px;line-height:1.6">' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L1 \u2014 Narrator period (100% coverage)</strong><br>The last narrator in the chain is the companion who heard it from the Prophet. Their known lifespan gives a broad window.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L2 \u2014 Named dated event (4.4%)</strong><br>The hadith text names a specific event with a known year \u2014 Battle of Badr (624), Treaty of Hudaybiyyah (628), etc. Highest confidence.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L3 \u2014 Book of Maghazi (1.7%)</strong><br>Hadith is in the Military Expeditions section of a collection, which scholars organized around the Madinan period.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L4 \u2014 Named companion (20.8%)</strong><br>Text mentions a companion other than the narrator, whose lifespan narrows the window.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L5 \u2014 Location clue (2.6%)</strong><br>Text mentions Madinah, Ansar, Muhajirun etc. \u2014 implies post-Hijrah.</p>' +
        '<p style="margin:0 0 10px"><strong style="color:#D4AF37">L6 \u2014 Quranic surah cited (13.4%)</strong><br>Makkan surahs point to 610\u2013622; Madinan surahs to 622\u2013632.</p>' +
      '</div>' +
      '<h3 style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.1em;color:#D4AF37;margin:20px 0 10px">PLANNED LAYERS</h3>' +
      '<ul style="font-size:13px;line-height:1.6;margin:0;padding-left:20px">' +
        '<li>Sunnah.com expedition cross-references</li>' +
        '<li>Manual scholar review for high-traffic hadiths</li>' +
        '<li>Cross-collection corroboration</li>' +
      '</ul>' +
      '<p style="font-size:12px;color:#A0AEC0;margin:20px 0 0;font-style:italic">This is not precise dating. Treat all ranges as approximate.</p>' +
    '</div>';

  document.body.appendChild(overlay);

  function _close(){ var m = document.getElementById('mon-modal'); if(m) m.remove(); }
  overlay.querySelector('#mon-modal-close').addEventListener('click', _close);
  overlay.addEventListener('click', function(ev){ if(ev.target === overlay) _close(); });
  document.addEventListener('keydown', function _esc(ev){
    if(ev.key === 'Escape'){ _close(); document.removeEventListener('keydown', _esc); }
  });
}

// ── Filter + render ──
function _applyAllFilters(){
  _syncBand();
  showLoading(true);

  var colSet = _monSel.collection;
  var periodSet = _monSel.period;
  var topicSet = _monSel.topic;
  var narSet = _monSel.narrator;

  var promise;
  if(colSet.size === 0){
    promise = fetchAll();
  } else {
    var keys = Array.from(colSet);
    promise = Promise.all(keys.map(function(k){
      return fetchCollection(k).then(function(data){
        data.forEach(function(h){ h._colKey = k; });
        return data;
      });
    })).then(function(arrs){
      var all = []; arrs.forEach(function(a){ all = all.concat(a); });
      return all;
    });
  }

  promise.then(function(hadiths){
    if(periodSet.size > 0){
      hadiths = hadiths.filter(function(h){ return periodSet.has(h.period); });
    }
    if(topicSet.size > 0){
      hadiths = hadiths.filter(function(h){ return topicSet.has(h.topic); });
    }
    if(narSet.size > 0){
      var narLowers = Array.from(narSet).map(function(s){ return s.toLowerCase(); });
      hadiths = hadiths.filter(function(h){
        var n = (getNarrator(h) || '').toLowerCase();
        for(var i = 0; i < narLowers.length; i++){
          if(n.indexOf(narLowers[i]) !== -1) return true;
        }
        return false;
      });
    }

    showLoading(false);
    _renderRows(hadiths, colSet.size === 1 ? Array.from(colSet)[0] : '');
  });
}

function _renderRows(filtered, colKey){
  _resultsEl.innerHTML = '';
  _countEl.textContent = filtered.length + ' hadith' + (filtered.length !== 1 ? 's' : '') + ' found';

  if(!filtered.length){
    _resultsEl.innerHTML = '<div style="text-align:center;padding:40px;color:#6B7280;font-size:13px">No hadiths match these filters.</div>';
    return;
  }

  var frag = document.createDocumentFragment();

  var hdr = document.createElement('div');
  hdr.style.cssText = 'display:grid;grid-template-columns:160px 180px 1fr;gap:14px;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.15);font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(160,174,192,0.7)';
  hdr.innerHTML = '<div>Source</div><div>Narrator</div><div>Hadith</div>';
  frag.appendChild(hdr);

  var limit = Math.min(filtered.length, MAX_ROWS);
  for(var i = 0; i < limit; i++){
    var h = filtered[i];
    var label = getLabel(h._colKey || colKey || '');
    var num = getNumber(h);
    var narrator = getNarrator(h);
    var text = getText(h);
    var topic = h.topic ? String(h.topic) : '';

    var topicHtml = topic
      ? '<div style="font-family:\'Lato\',sans-serif;font-size:10px;letter-spacing:.08em;color:#FFFFFF;margin-top:16px">' + esc(topic) + '</div>'
      : '';

    var _pi = _monPeriodInfo(h.period);
    var periodLabel = _pi ? _pi.label : '';
    var periodColor = _pi ? _pi.color : 'rgba(160,174,192,0.75)';
    var periodHtml = periodLabel
      ? '<div style="font-family:\'Lato\',sans-serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:' + periodColor + ';margin-top:3px">' + esc(periodLabel) + '</div>'
      : '';

    var row = document.createElement('div');
    row.className = 'mon-row';
    row.style.cssText = 'display:grid;grid-template-columns:160px 180px 1fr;gap:14px;align-items:start;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);';
    row.innerHTML =
      '<div><div style="font-family:\'Cinzel\',serif;font-size:11px;color:rgba(212,175,55,0.85);letter-spacing:.06em;margin-bottom:4px">#' + esc(String(num)) + '</div>' +
      '<div style="font-family:\'Cinzel\',serif;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(212,175,55,0.65)">' + esc(label) + '</div>' +
      topicHtml + periodHtml + '</div>' +
      '<div class="mon-narrator">' + _narratorBlock(h) + '</div>' +
      '<div style="font-size:13px;color:#E5E7EB;line-height:1.5">' + esc(text) + _datingLine(h) + '</div>';
    frag.appendChild(row);
  }

  _resultsEl.appendChild(frag);

  if(filtered.length > MAX_ROWS){
    var trunc = document.createElement('div');
    trunc.style.cssText = 'text-align:center;padding:12px;color:#D4AF37;font-size:11px;letter-spacing:.06em;border-top:1px solid #2D3748';
    trunc.textContent = '\u2026 ' + (filtered.length - MAX_ROWS) + ' more results truncated. Narrow your filters to see them.';
    _resultsEl.appendChild(trunc);
  }
}

// ── Topic population ──
function _populateTopics(){
  if(_topicList) return Promise.resolve();
  return fetchCollection('bukhari').then(function(data){
    var set = {};
    data.forEach(function(h){ if(h.topic) set[h.topic] = true; });
    _topicList = Object.keys(set).sort();
    _topicList.forEach(function(t){
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      _topicSel.appendChild(opt);
    });
  });
}

// ── Multi-select dropdown helpers ──
function _monPanelId(kind){ return 'mon-' + kind + 'Panel'; }
function _monBtnId(kind){   return 'mon-' + kind + 'Btn'; }
function _monCountId(kind){ return 'mon-' + kind + 'Count'; }
function _monDotId(kind){   return 'mon-' + kind + 'Dot'; }
function _monAllCkId(kind){ return 'mon-' + kind + 'AllCk'; }

function _monBuildPanel(kind, entries){
  var panel = document.getElementById(_monPanelId(kind));
  if(!panel) return;
  panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){ el.remove(); });
  var oldSearch = panel.querySelector('.dd-search');
  if(oldSearch) oldSearch.remove();

  var si = document.createElement('input');
  si.type = 'text'; si.className = 'dd-search'; si.placeholder = 'Search...';
  si.oninput = function(){
    var q = si.value.toLowerCase();
    panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(el){
      el.style.display = el.innerText.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
  };
  panel.appendChild(si);

  entries.forEach(function(entry){
    var el = document.createElement('div');
    el.className = 'dd-item';
    el.dataset.val = entry.value;
    el.innerHTML = '<div class="dd-checkbox"></div><span>' + esc(entry.label) + '</span>';
    el.onclick = function(){ _monDDToggleItem(kind, entry.value); };
    panel.appendChild(el);
  });
}

function _monSyncDD(kind){
  var sel = _monSel[kind];
  var panel = document.getElementById(_monPanelId(kind));
  var btn   = document.getElementById(_monBtnId(kind));
  var cnt   = document.getElementById(_monCountId(kind));
  var dot   = document.getElementById(_monDotId(kind));
  var allCk = document.getElementById(_monAllCkId(kind));
  if(!panel || !btn) return;

  panel.querySelectorAll('.dd-item:not(.dd-all)').forEach(function(item){
    var on = sel.has(item.dataset.val);
    item.classList.toggle('selected', on);
    var ck = item.querySelector('.dd-checkbox');
    if(ck) ck.textContent = on ? '\u2713' : '';
  });
  if(allCk) allCk.textContent = sel.size === 0 ? '\u2713' : '';

  if(sel.size > 0){
    if(cnt){ cnt.textContent = sel.size; cnt.style.display = ''; }
    btn.classList.add('filtered');
    if(dot) dot.style.display = 'inline-block';
  } else {
    if(cnt) cnt.style.display = 'none';
    btn.classList.remove('filtered');
    if(dot) dot.style.display = 'none';
  }
}

function _monDDToggleItem(kind, v){
  var sel = _monSel[kind];
  if(sel.has(v)) sel.delete(v); else sel.add(v);
  _monSyncDD(kind);
  _applyAllFilters();
}

function _monToggleDD(kind){
  var panel = document.getElementById(_monPanelId(kind));
  var btn   = document.getElementById(_monBtnId(kind));
  if(!panel || !btn) return;
  var wasOpen = panel.classList.contains('open');
  document.querySelectorAll('#mon-filters .dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
  document.querySelectorAll('#mon-filters .dd-btn.open').forEach(function(b){ b.classList.remove('open'); });
  if(!wasOpen){
    panel.classList.add('open'); btn.classList.add('open');
    var si = panel.querySelector('.dd-search');
    if(si){ si.value = ''; si.dispatchEvent(new Event('input')); si.focus(); }
  }
}

function _monDDClearAll(kind){
  _monSel[kind].clear();
  _monSyncDD(kind);
  _applyAllFilters();
}

// ── Init ──
function init(){
  if(_inited) return;
  _inited = true;

  _resultsEl = document.getElementById('mon-results');

  _drillEl = document.createElement('div');
  _drillEl.id = 'mon-drill';
  _drillEl.style.cssText = 'display:none;width:100%;box-sizing:border-box;padding:0;color:#E5E7EB;font-size:13px;max-height:calc(100vh - 260px);overflow-y:auto;overflow-x:hidden';
  if(_resultsEl && _resultsEl.parentNode){
    _resultsEl.parentNode.insertBefore(_drillEl, _resultsEl.nextSibling);
  }
  _loadingEl = document.getElementById('mon-loading');
  _countEl   = document.getElementById('mon-count');
  _bandEl    = document.getElementById('mon-timeline-band');

  // Populate period panel
  _monBuildPanel('period', MON_PERIODS.map(function(p){
    return { value: p.id, label: p.label + ' (' + p.years + ')' };
  }));

  // Populate collection panel
  _monBuildPanel('collection', COLLECTIONS.map(function(c){
    return { value: c.key, label: c.label };
  }));

  // Populate narrators from index (with counts)
  fetch('data/hadith/narrator_index.json').then(function(r){
    if(!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function(data){
    if(!Array.isArray(data) || !data.length) throw new Error('empty');
    _narratorIndex = data.sort(function(a,b){ return b.count - a.count; });
    _monBuildPanel('narrator', _narratorIndex.map(function(n){
      return { value: n.name, label: n.name + ' (' + n.count.toLocaleString() + ')' };
    }));
  }).catch(function(e){
    console.warn('narrator_index.json not available:', e);
  });

  // Populate topics from bukhari
  if(!_topicList){
    fetchCollection('bukhari').then(function(data){
      var set = {};
      data.forEach(function(h){ if(h.topic) set[h.topic] = true; });
      _topicList = Object.keys(set).sort();
      _monBuildPanel('topic', _topicList.map(function(t){
        return { value: t, label: t };
      }));
    });
  }

  _buildBand();
  _syncBand();
  _computePeriodTotals();

  var methBtn = document.getElementById('mon-methodology-btn');
  if(methBtn) methBtn.addEventListener('click', _openMethodology);

  var drillBtn = document.getElementById('mon-drill-btn');
  if(drillBtn){
    drillBtn.addEventListener('click', function(){
      var backBtn = document.getElementById('mon-back-to-drill');
      var inDrillFlow = _drillOn || !!backBtn;

      if(inDrillFlow){
        _drillOn = false;
        drillBtn.classList.remove('active');
        drillBtn.style.background = '';
        drillBtn.style.borderColor = '';
        drillBtn.style.color = '';
        if(_drillEl) _drillEl.style.display = 'none';
        var cnt = document.getElementById('mon-count'); if(cnt) cnt.style.display = '';
        document.body.classList.remove('mon-drill-on');

        _drillPicks = { period:[], topic:[], narrator:[], collection:[] };
        _drillExpanded = false;
        if(backBtn) backBtn.remove();

        _monSel.topic.clear();
        _monSel.period.clear();
        _monSel.narrator.clear();
        _monSel.collection.clear();
        _monSyncDD('topic');
        _monSyncDD('period');
        _monSyncDD('narrator');
        _monSyncDD('collection');

        if(_resultsEl){
          _resultsEl.style.display = '';
          _resultsEl.innerHTML = '';
        }
        if(cnt) cnt.textContent = '';
        return;
      }

      _drillOn = true;
      drillBtn.classList.add('active');
      drillBtn.style.background = '#D4AF37';
      drillBtn.style.borderColor = '#D4AF37';
      drillBtn.style.color = '#0E1621';
      if(_resultsEl) _resultsEl.style.display = 'none';
      if(_drillEl)   _drillEl.style.display = 'block';
      var cnt2 = document.getElementById('mon-count'); if(cnt2) cnt2.style.display = 'none';
      document.body.classList.add('mon-drill-on');
      _drillExpanded = false;
      _drillRender();
    });
  }

  // Delegated narrator-pill click (existing Timeline jump)
  if(!_clickBound){
    _clickBound = true;
    _resultsEl.addEventListener('click', function(e){
      if(e.target.tagName === 'A'){ e.stopPropagation(); return; }
      var toggle = e.target.closest('.mon-chain-toggle');
      if(toggle){
        e.stopPropagation();
        var cell = toggle.parentElement;
        var panel = cell ? cell.querySelector('.mon-chain') : null;
        if(!panel) return;
        var open = panel.style.display !== 'none';
        _resultsEl.querySelectorAll('.mon-chain').forEach(function(p){ p.style.display = 'none'; });
        _resultsEl.querySelectorAll('.mon-chain-toggle').forEach(function(t){
          t.textContent = t.textContent.replace('\u25B2', '\u25BC');
        });
        if(!open){
          panel.style.display = 'block';
          toggle.textContent = toggle.textContent.replace('\u25BC', '\u25B2');
        }
        return;
      }
      var tag = e.target.closest('.mon-narrator-tag');
      if(!tag) return;
      e.stopPropagation();
      var famous = tag.getAttribute('data-famous');
      if(famous && typeof focusPersonInTimeline === 'function'){
        focusPersonInTimeline(famous);
      }
    });
  }

  // Close any open mon panel on outside click
  if(!_monDDBound){
    _monDDBound = true;
    document.addEventListener('click', function(e){
      if(e.target.closest('#mon-filters')) return;
      document.querySelectorAll('#mon-filters .dd-panel.open').forEach(function(p){ p.classList.remove('open'); });
      document.querySelectorAll('#mon-filters .dd-btn.open').forEach(function(b){ b.classList.remove('open'); });
    });
  }

  // Hide global search box while Monastic is visible; restore on leave
  var _monSearchBox = document.querySelector('#searchBox, #globalSearch, input[placeholder*="Search figures"]');
  if(_monSearchBox && !_monSearchBoxPrev){
    _monSearchBoxPrev = _monSearchBox.style.display || '';
  }

  _resultsEl.innerHTML = '';
}

var _WIZARD_STEPS_ALL = [
  { key:'topic',      label:'Topic',    prompt:'Which topic interests you?' },
  { key:'period',     label:'Period',   prompt:'From which period?' },
  { key:'narrator',   label:'Narrator', prompt:'Narrated by whom?' },
  { key:'collection', label:'Book',     prompt:'From which collection?' }
];

function _wizardStepsFrom(startKey){
  var keys = ['topic','period','narrator','collection'];
  var i = keys.indexOf(startKey);
  if(i < 0) i = 0;
  var order = keys.slice(i).concat(keys.slice(0, i));
  return order.map(function(k){
    for(var j = 0; j < _WIZARD_STEPS_ALL.length; j++){
      if(_WIZARD_STEPS_ALL[j].key === k) return _WIZARD_STEPS_ALL[j];
    }
  });
}

function _wizardOptionsFor(stepKey){
  if(stepKey === 'topic'){
    return (_topicList || []).map(function(t){ return { value: t, label: t }; });
  }
  if(stepKey === 'period'){
    return MON_PERIODS.map(function(p){ return { value: p.id, label: p.label + ' (' + p.years + ')' }; });
  }
  if(stepKey === 'narrator'){
    return (_narratorIndex || []).slice(0, 150).map(function(n){
      return { value: n.name, label: n.name };
    });
  }
  if(stepKey === 'collection'){
    return COLLECTIONS.map(function(c){ return { value: c.key, label: c.label }; });
  }
  return [];
}

function _wizardApplyPicksExcept(excludeKey){
  if(!_wizardAllHadith) return null;
  var picks = _wizardState.picks;
  var list = _wizardAllHadith;
  if(excludeKey !== 'collection' && picks.collection.length){
    list = list.filter(function(h){ return picks.collection.indexOf(h._colKey) !== -1; });
  }
  if(excludeKey !== 'period' && picks.period.length){
    list = list.filter(function(h){ return picks.period.indexOf(h.period) !== -1; });
  }
  if(excludeKey !== 'topic' && picks.topic.length){
    list = list.filter(function(h){ return picks.topic.indexOf(h.topic) !== -1; });
  }
  if(excludeKey !== 'narrator' && picks.narrator.length){
    var qs = picks.narrator.map(function(s){ return s.toLowerCase(); });
    list = list.filter(function(h){
      var n = (getNarrator(h) || '').toLowerCase();
      for(var i=0;i<qs.length;i++){ if(n.indexOf(qs[i]) !== -1) return true; }
      return false;
    });
  }
  return list;
}

function _wizardCountForValue(stepKey, value){
  var base = _wizardApplyPicksExcept(stepKey);
  if(!base) return 0;
  if(stepKey === 'collection') return base.filter(function(h){ return h._colKey === value; }).length;
  if(stepKey === 'period')     return base.filter(function(h){ return h.period === value; }).length;
  if(stepKey === 'topic')      return base.filter(function(h){ return h.topic === value; }).length;
  if(stepKey === 'narrator'){
    var q = String(value).toLowerCase();
    return base.filter(function(h){
      var n = (getNarrator(h) || '').toLowerCase();
      return n.indexOf(q) !== -1;
    }).length;
  }
  return 0;
}

function _wizardCount(){
  if(!_wizardAllHadith) return null;
  var picks = _wizardState.picks;
  var list = _wizardAllHadith;
  if(picks.collection.length){ list = list.filter(function(h){ return picks.collection.indexOf(h._colKey) !== -1; }); }
  if(picks.period.length){     list = list.filter(function(h){ return picks.period.indexOf(h.period) !== -1; }); }
  if(picks.topic.length){      list = list.filter(function(h){ return picks.topic.indexOf(h.topic) !== -1; }); }
  if(picks.narrator.length){
    var qs = picks.narrator.map(function(s){ return s.toLowerCase(); });
    list = list.filter(function(h){
      var n = (getNarrator(h) || '').toLowerCase();
      for(var i=0;i<qs.length;i++){ if(n.indexOf(qs[i]) !== -1) return true; }
      return false;
    });
  }
  return list.length;
}

function _wizardOpen(){
  var prior = document.getElementById('mon-wizard'); if(prior) prior.remove();

  _wizardState = {
    step: -1,
    picks: { topic:[], period:[], narrator:[], collection:[] },
    steps: _wizardStepsFrom('topic')
  };

  var overlay = document.createElement('div');
  overlay.id = 'mon-wizard';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:\'Lato\',sans-serif';
  overlay.innerHTML =
    '<div id="mon-wizard-card" style="background:#1A2332;border:1px solid rgba(212,175,55,0.4);border-radius:6px;width:520px;max-width:92vw;max-height:86vh;display:flex;flex-direction:column;color:#E5E7EB;box-shadow:0 12px 40px rgba(0,0,0,0.6)">' +
      '<div style="padding:14px 18px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between">' +
        '<div style="font-family:\'Cinzel\',serif;font-size:13px;letter-spacing:.12em;color:#D4AF37;text-transform:uppercase">Guided Search</div>' +
        '<div id="mon-wizard-close" style="cursor:pointer;color:#9CA3AF;font-size:20px;line-height:1;padding:0 6px">\u00D7</div>' +
      '</div>' +
      '<div id="mon-wizard-body" style="padding:18px;overflow-y:auto;flex:1"></div>' +
      '<div style="padding:12px 18px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap">' +
        '<div id="mon-wizard-count" style="flex:1;min-width:0"></div>' +
        '<div style="display:flex;gap:8px">' +
          '<button id="mon-wizard-back" style="padding:6px 14px;background:transparent;border:1px solid rgba(255,255,255,0.25);border-radius:3px;color:#E5E7EB;font-size:12px;cursor:pointer">Back</button>' +
          '<button id="mon-wizard-next" style="padding:6px 14px;background:rgba(212,175,55,0.18);border:1px solid rgba(212,175,55,0.6);border-radius:3px;color:#D4AF37;font-size:12px;cursor:pointer;font-weight:600">Next \u25B8</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  document.getElementById('mon-wizard-close').onclick = _wizardClose;
  overlay.addEventListener('click', function(ev){ if(ev.target === overlay) _wizardClose(); });
  document.getElementById('mon-wizard-back').onclick = function(){
    if(_wizardState.step > 0){ _wizardState.step--; _wizardRender(); }
    else if(_wizardState.step === 0){ _wizardState.step = -1; _wizardRender(); }
  };
  document.getElementById('mon-wizard-next').onclick = function(){
    if(_wizardState.step < _wizardState.steps.length - 1){ _wizardState.step++; _wizardRender(); }
    else { _wizardApply(); }
  };
  document.addEventListener('keydown', _wizardKey);

  var prep = Promise.resolve();
  if(!_topicList){
    prep = prep.then(function(){ return fetchCollection('bukhari').then(function(data){
      var set = {}; data.forEach(function(h){ if(h.topic) set[h.topic] = true; });
      _topicList = Object.keys(set).sort();
    }); });
  }
  prep.then(function(){
    if(!_wizardAllHadith){
      return fetchAll().then(function(all){ _wizardAllHadith = all; });
    }
  }).then(function(){
    _wizardRender();
  });

  document.getElementById('mon-wizard-body').innerHTML = '<div style="text-align:center;padding:40px;color:rgba(160,174,192,0.7);font-size:13px">Loading\u2026</div>';
  document.getElementById('mon-wizard-count').textContent = '';
}

function _wizardKey(ev){ if(ev.key === 'Escape') _wizardClose(); }

function _wizardClose(){
  var el = document.getElementById('mon-wizard'); if(el) el.remove();
  document.removeEventListener('keydown', _wizardKey);
  _wizardState = null;
}

function _wizardCollectionLabel(key){
  for(var i = 0; i < COLLECTIONS.length; i++){
    if(COLLECTIONS[i].key === key) return COLLECTIONS[i].label;
  }
  return key;
}

function _wizardPeriodLabel(id){
  var pi = _monPeriodInfo(id);
  return pi ? pi.label : id;
}

function _wizardBreadcrumb(){
  if(!_wizardState) return '';
  var p = _wizardState.picks;
  var parts = [];

  if(p.narrator.length) parts.push('<span style="color:rgba(160,174,192,0.7)">Narrated by</span> <span style="color:#D4AF37">' + p.narrator.map(esc).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                  parts.push('<span style="color:rgba(160,174,192,0.5)">Any narrator</span>');

  if(p.topic.length)    parts.push('<span style="color:rgba(160,174,192,0.7)">on</span> <span style="color:#D4AF37">' + p.topic.map(esc).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                  parts.push('<span style="color:rgba(160,174,192,0.5)">any topic</span>');

  if(p.period.length)   parts.push('<span style="color:rgba(160,174,192,0.7)">from</span> <span style="color:#D4AF37">' + p.period.map(function(x){ return esc(_wizardPeriodLabel(x)); }).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                  parts.push('<span style="color:rgba(160,174,192,0.5)">any period</span>');

  if(p.collection.length) parts.push('<span style="color:rgba(160,174,192,0.7)">in</span> <span style="color:#D4AF37">' + p.collection.map(function(x){ return esc(_wizardCollectionLabel(x)); }).join(' <span style="color:rgba(160,174,192,0.5)">or</span> ') + '</span>');
  else                    parts.push('<span style="color:rgba(160,174,192,0.5)">any book</span>');

  return parts.join(' <span style="color:rgba(255,255,255,0.2)">\u00B7</span> ');
}

function _wizardPeriodBreakdown(){
  var base = _wizardApplyPicksExcept('period');
  if(!base) return null;
  var out = {};
  MON_PERIODS.forEach(function(p){ out[p.id] = 0; });
  base.forEach(function(h){ if(out[h.period] != null) out[h.period]++; });
  return out;
}

function _wizardRender(){
  if(!_wizardState) return;
  var body = document.getElementById('mon-wizard-body');
  var backBtn = document.getElementById('mon-wizard-back');
  var nextBtn = document.getElementById('mon-wizard-next');
  var countEl = document.getElementById('mon-wizard-count');

  if(_wizardState.step === -1){
    var startOpts = [
      { key:'topic',      label:'Topic',    desc:'Start by subject matter (e.g. Marriage, Hajj, Jihad)' },
      { key:'period',     label:'Period',   desc:'Start by era (e.g. Madinan, Post-Prophet)' },
      { key:'narrator',   label:'Narrator', desc:'Start by companion (e.g. Abu Hurairah, \'Aisha)' },
      { key:'collection', label:'Book',     desc:'Start by collection (e.g. Bukhari, Muslim)' }
    ];

    var html = '';
    html += '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,175,55,0.7);font-family:\'Cinzel\',serif;margin-bottom:6px">Begin</div>';
    html += '<div style="font-size:15px;color:#E5E7EB;margin-bottom:14px">Where do you want to begin?</div>';
    html += '<div style="display:flex;flex-direction:column;gap:8px">';
    startOpts.forEach(function(o){
      html += '<div class="mon-wiz-start" data-key="' + o.key + '" style="padding:12px 14px;border:1px solid rgba(255,255,255,0.12);border-radius:3px;cursor:pointer;background:transparent;transition:background .15s,border-color .15s">' +
        '<div style="font-size:14px;color:#E5E7EB;font-weight:600;margin-bottom:3px">' + esc(o.label) + '</div>' +
        '<div style="font-size:11px;color:rgba(160,174,192,0.8)">' + esc(o.desc) + '</div>' +
        '</div>';
    });
    html += '</div>';
    body.innerHTML = html;

    body.querySelectorAll('.mon-wiz-start').forEach(function(el){
      el.onmouseenter = function(){ el.style.background='rgba(212,175,55,0.08)'; el.style.borderColor='rgba(212,175,55,0.4)'; };
      el.onmouseleave = function(){ el.style.background='transparent'; el.style.borderColor='rgba(255,255,255,0.12)'; };
      el.onclick = function(){
        var k = el.getAttribute('data-key');
        _wizardState.steps = _wizardStepsFrom(k);
        _wizardState.step = 0;
        _wizardRender();
      };
    });

    backBtn.disabled = true;
    backBtn.style.opacity = '0.3';
    backBtn.style.cursor = 'not-allowed';
    nextBtn.style.display = 'none';
    countEl.innerHTML = _wizardAllHadith
      ? '<div style="font-family:\'Cinzel\',serif;font-size:16px;color:#D4AF37;letter-spacing:.08em">TOTAL ' + _wizardAllHadith.length.toLocaleString() + '</div>'
      : 'Loading\u2026';
    return;
  }

  nextBtn.style.display = '';
  var stepDef = _wizardState.steps[_wizardState.step];
  var opts = _wizardOptionsFor(stepDef.key);
  var currentArr = _wizardState.picks[stepDef.key];

  var baseList = _wizardApplyPicksExcept(stepDef.key);
  var anyTotal = baseList ? baseList.length : null;

  var optsWithCounts = opts.map(function(o){
    return { value: o.value, label: o.label, n: _wizardCountForValue(stepDef.key, o.value) };
  });
  optsWithCounts = optsWithCounts.filter(function(o){ return o.n > 0; });
  optsWithCounts.sort(function(a,b){ return b.n - a.n; });

  var html = '';
  html += '<div style="font-size:12px;line-height:1.55;margin-bottom:14px;padding:10px 12px;background:rgba(212,175,55,0.04);border-left:2px solid rgba(212,175,55,0.4);border-radius:2px">' + _wizardBreadcrumb() + '</div>';
  html += '<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:rgba(212,175,55,0.7);font-family:\'Cinzel\',serif;margin-bottom:6px">Step ' + (_wizardState.step + 1) + ' of ' + _wizardState.steps.length + ' \u00B7 ' + stepDef.label + '</div>';
  html += '<div style="font-size:15px;color:#E5E7EB;margin-bottom:14px">' + esc(stepDef.prompt) + '</div>';
  html += '<div style="display:flex;flex-direction:column;gap:6px">';

  var anySelected = (currentArr.length === 0);
  var anyCountStr = (anyTotal === null) ? '\u2026' : anyTotal.toLocaleString();
  html += '<div class="mon-wiz-opt" data-val="__any__" style="padding:8px 12px;border:1px solid ' + (anySelected ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.12)') + ';border-radius:3px;cursor:pointer;background:' + (anySelected ? 'rgba(212,175,55,0.10)' : 'transparent') + ';font-size:13px;color:' + (anySelected ? '#D4AF37' : '#E5E7EB') + ';font-style:italic;display:flex;justify-content:space-between;align-items:center;gap:10px">' +
    '<span>Any (skip this filter)</span>' +
    '<span style="font-style:normal;font-size:11px;color:rgba(160,174,192,0.85);white-space:nowrap">' + anyCountStr + '</span>' +
    '</div>';

  optsWithCounts.forEach(function(o){
    var on = (currentArr.indexOf(o.value) !== -1);
    var borderCol = on ? 'rgba(212,175,55,0.6)' : 'rgba(255,255,255,0.12)';
    var bg        = on ? 'rgba(212,175,55,0.10)' : 'transparent';
    var textCol   = on ? '#D4AF37' : '#E5E7EB';
    html += '<div class="mon-wiz-opt" data-val="' + esc(o.value) + '" style="padding:8px 12px;border:1px solid ' + borderCol + ';border-radius:3px;cursor:pointer;background:' + bg + ';font-size:13px;color:' + textCol + ';display:flex;justify-content:space-between;align-items:center;gap:10px">' +
      '<span>' + esc(o.label) + '</span>' +
      '<span style="font-size:12px;font-weight:600;color:' + (on ? '#D4AF37' : '#E5E7EB') + ';white-space:nowrap">' + o.n.toLocaleString() + '</span>' +
      '</div>';
  });
  if(optsWithCounts.length === 0){
    html += '<div style="padding:16px;text-align:center;color:rgba(160,174,192,0.7);font-size:12px;font-style:italic">No ' + esc(stepDef.label.toLowerCase()) + ' has any match. Use "Any" to skip, or Back to change a prior pick.</div>';
  }
  html += '</div>';

  body.innerHTML = html;

  body.querySelectorAll('.mon-wiz-opt').forEach(function(el){
    el.onclick = function(){
      var v = el.getAttribute('data-val');
      var arr = _wizardState.picks[stepDef.key];
      if(v === '__any__'){
        _wizardState.picks[stepDef.key] = [];
      } else {
        var idx = arr.indexOf(v);
        if(idx === -1) arr.push(v); else arr.splice(idx, 1);
      }
      _wizardRender();
    };
  });

  backBtn.disabled = false;
  backBtn.style.opacity = '1';
  backBtn.style.cursor = 'pointer';
  var isLast = _wizardState.step === _wizardState.steps.length - 1;
  nextBtn.textContent = isLast ? 'Show me \u25B8' : 'Next \u25B8';

  var n = _wizardCount();
  var totalStr = (n === null) ? '\u2026' : n.toLocaleString();
  var breakdown = _wizardPeriodBreakdown();
  var breakdownHtml = '';
  if(breakdown){
    var parts = MON_PERIODS.map(function(p){
      return '<span style="color:' + p.color + '">' + p.label.toUpperCase() + '</span> <span style="color:#E5E7EB;font-weight:600">' + (breakdown[p.id] || 0).toLocaleString() + '</span>';
    });
    breakdownHtml = '<div style="font-size:10px;letter-spacing:.05em;color:rgba(160,174,192,0.85);margin-top:4px;display:flex;flex-wrap:wrap;gap:10px">' + parts.join('<span style="color:rgba(255,255,255,0.25)">\u00B7</span>') + '</div>';
  }
  countEl.innerHTML =
    '<div style="font-family:\'Cinzel\',serif;font-size:18px;color:#D4AF37;letter-spacing:.1em;font-weight:600">TOTAL ' + totalStr + '</div>' +
    breakdownHtml;
}

function _wizardApply(){
  if(!_wizardState) return;
  var picks = _wizardState.picks;

  _monSel.topic.clear();
  _monSel.period.clear();
  _monSel.narrator.clear();
  _monSel.collection.clear();
  picks.topic.forEach(function(v){ _monSel.topic.add(v); });
  picks.period.forEach(function(v){ _monSel.period.add(v); });
  picks.narrator.forEach(function(v){ _monSel.narrator.add(v); });
  picks.collection.forEach(function(v){ _monSel.collection.add(v); });

  _monSyncDD('topic');
  _monSyncDD('period');
  _monSyncDD('narrator');
  _monSyncDD('collection');

  _wizardClose();
  _applyAllFilters();
}

return {
  init: init,
  toggleDD: _monToggleDD,
  ddClearAll: _monDDClearAll,
  openWizard: _wizardOpen,
  onEnter: function(){
    var box = document.querySelector('#searchBox, #globalSearch, input[placeholder*="Search figures"]');
    if(box){ if(_monSearchBoxPrev === null) _monSearchBoxPrev = box.style.display || ''; box.style.display = 'none'; }
  },
  onLeave: function(){
    var box = document.querySelector('#searchBox, #globalSearch, input[placeholder*="Search figures"]');
    if(box){ box.style.display = (_monSearchBoxPrev === null ? '' : _monSearchBoxPrev); }
  }
};
})();
