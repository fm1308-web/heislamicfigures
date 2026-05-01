(function(){
'use strict';

var EL = null;
var THINK_SLUGS = null;

function _close(){
  if(EL && EL.parentNode){ EL.parentNode.removeChild(EL); }
  EL = null;
  document.removeEventListener('click', _outsideClick, true);
}
function _outsideClick(e){
  if(!EL) return;
  if(!EL.contains(e.target) && !e.target.classList.contains('ga-concept-chip')) _close();
}
function _esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function _normVerse(v){
  if(v==null) return null;
  var s, n, sc;
  if(Array.isArray(v)){
    var first = v[0];
    if(typeof first === 'string' && first.indexOf(':') > 0){
      var parts = first.split(':');
      s = +parts[0]; n = +parts[1]; sc = v[1];
    } else {
      s = +v[0]; n = +v[1]; sc = v[2];
    }
  } else if(typeof v === 'object'){
    s = +(v.surah==null ? v.s : v.surah);
    n = +(v.verse==null ? v.v : v.verse);
    sc = v.score==null ? v.weight : v.score;
  } else if(typeof v === 'string' && v.indexOf(':') > 0){
    var p = v.split(':'); s = +p[0]; n = +p[1];
  }
  if(!s || !n || isNaN(s) || isNaN(n) || s<1 || s>114 || n<1) return null;
  return { surah: s, verse: n, score: (sc==null ? null : sc) };
}

// Cache the THINK slug set the first time we open. Tries the live exposed
// set first (set by think.js after initThink), else fetches think.json once.
function _ensureThinkSlugs(cb){
  if(THINK_SLUGS){ cb(); return; }
  if(window._thinkSlugSet){ THINK_SLUGS = window._thinkSlugSet; cb(); return; }
  var url = (typeof window.dataUrl === 'function') ? window.dataUrl('data/islamic/think/think.json') : 'data/islamic/think/think.json';
  fetch(url).then(function(r){ return r.ok ? r.json() : null; }).catch(function(){ return null; })
    .then(function(j){
      try { THINK_SLUGS = new Set(((j && j.concepts) || []).map(function(c){ return c.slug; })); }
      catch(e){ THINK_SLUGS = new Set(); }
      cb();
    });
}

function _open(slug, anchorEl){
  _close();
  if(!window.GoldArkConcepts) return;
  var GC = window.GoldArkConcepts;
  GC.loadSummaries(function(){
    GC.loadQuranReverse(function(){
      _ensureThinkSlugs(function(){
        var summary = GC.getSummary(slug);
        var verses  = (GC.getVersesForConcept(slug) || []).slice();
        var title   = (summary && (summary.title || summary.name)) || slug;
        var inThink = THINK_SLUGS.has(slug);

        var html = '<button class="gcp-close" type="button">×</button>';
        html += '<div class="gcp-title' + (inThink ? '' : ' gcp-title-dim') + '">' + _esc(title) + '</div>';
        html += '<div class="gcp-meta">' + _esc(slug) + (inThink ? '' : ' · not in THINK') + '</div>';

        if(verses.length){
          html += '<div class="gcp-section-hdr">Quran Links (' + verses.length + ')</div>';
          html += '<div class="gcp-verse-grid">';
          verses.forEach(function(raw){
            var v = _normVerse(raw);
            if(!v) return;
            var sc = v.score;
            var scColors = {1:'rgba(212,175,55,0.45)',2:'rgba(212,175,55,0.7)',3:'#d4af37',4:'#e8c547',5:'#f5d24a'};
            var scBold = sc >= 4 ? 'font-weight:700;' : '';
            var scoreHtml = sc ? '<span class="gcp-verse-score" style="color:' + (scColors[sc] || '#d4af37') + ';' + scBold + 'margin-left:4px;font-size:10px">' + sc + '</span>' : '';
            html += '<span class="gcp-verse-chip" data-surah="' + v.surah + '" data-verse="' + v.verse + '">' + v.surah + ':' + v.verse + scoreHtml + '</span>';
          });
          html += '</div>';
          if(verses.length > 1){
            html += '<button class="gcp-seeall ga-cc-seeall" type="button" data-slug="' + _esc(slug) + '">See All ' + verses.length + ' →</button>';
          }
        } else {
          html += '<div class="gcp-section-hdr">Quran Links</div>';
          html += '<div class="gcp-empty">No tagged verses yet.</div>';
        }

        if(inThink){
          html += '<button class="gcp-explore" type="button" data-slug="' + _esc(slug) + '">Explore Concept in THINK ▶</button>';
        } else {
          html += '<button class="gcp-explore gcp-explore-disabled" type="button" disabled title="Not yet in THINK view">Explore Concept (unavailable)</button>';
        }

        EL = document.createElement('div');
        EL.id = 'ga-concept-pop';
        EL.innerHTML = html;
        document.body.appendChild(EL);

        var rect = anchorEl ? anchorEl.getBoundingClientRect() : { left:200, bottom:200, top:200 };
        var top = rect.bottom + 6;
        var left = rect.left;
        var w = EL.offsetWidth;
        if(left + w > window.innerWidth - 12) left = window.innerWidth - w - 12;
        if(top + EL.offsetHeight > window.innerHeight - 12) top = rect.top - EL.offsetHeight - 6;
        if(top < 12) top = 12;
        EL.style.top = top + 'px';
        EL.style.left = left + 'px';

        EL.querySelector('.gcp-close').addEventListener('click', _close);

        EL.querySelectorAll('.gcp-verse-chip').forEach(function(row){
          row.addEventListener('click', function(){
            var s = +row.dataset.surah, v = +row.dataset.verse;
            _close();
            // DOM-click the START tab so start.js lazy-loads, then poll for the real
            // openStartAtVerse (not the monastic.js stub) before calling.
            var tabs = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="start"], .tab-start');
            for(var i=0;i<tabs.length;i++){
              var el=tabs[i];
              var txt=(el.textContent||'').trim().toUpperCase();
              var dv=el.getAttribute('data-view')||'';
              if(txt==='START' || dv==='start'){ el.click(); break; }
            }
            var tries=0;
            var iv=setInterval(function(){
              tries++;
              var fn=window.openStartAtVerse;
              var src=(typeof fn==='function')?String(fn):'';
              if(src && src.indexOf('(stub)')===-1 && src.length>120){
                try{ fn(s, v, v); }catch(err){ console.warn('[gcp] openStartAtVerse failed', err); }
                clearInterval(iv); return;
              }
              if(tries>60){ clearInterval(iv); console.warn('[gcp] openStartAtVerse never ready'); }
            }, 80);
          });
        });

        var explore = EL.querySelector('.gcp-explore');
        if(explore && !explore.disabled){
          explore.addEventListener('click', function(){
            var sl = explore.dataset.slug;
            _close();
            window._thPendingConcept = sl;
            // DOM-click the THINK tab.
            var tabs = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="think"], .tab-think');
            for(var i=0;i<tabs.length;i++){
              var el=tabs[i];
              var txt=(el.textContent||'').trim().toUpperCase();
              var dv=el.getAttribute('data-view')||'';
              if(txt==='THINK' || dv==='think'){ el.click(); return; }
            }
            if(typeof window.setView === 'function') window.setView('think');
          });
        }

        var seeAll = EL.querySelector('.gcp-seeall');
        if(seeAll){
          seeAll.addEventListener('click', function(){
            var sl = seeAll.dataset.slug;
            var pinList = (verses || []).map(_normVerse).filter(function(x){ return x; });
            window._stPendingPinnedVerses = { slug: sl, label: title, verses: pinList };
            _close();
            var tabs = document.querySelectorAll('#tabRow1 button, #tabRow1 a, #tabRow2 button, #tabRow2 a, [data-view="start"], .tab-start');
            for(var i=0;i<tabs.length;i++){
              var el=tabs[i];
              var txt=(el.textContent||'').trim().toUpperCase();
              var dv=el.getAttribute('data-view')||'';
              if(txt==='START' || dv==='start'){ el.click(); return; }
            }
            if(typeof window.setView === 'function') window.setView('start');
          });
        }

        setTimeout(function(){ document.addEventListener('click', _outsideClick, true); }, 50);
      });
    });
  });
}

document.addEventListener('click', function(e){
  var t = e.target;
  if(!t || !t.closest) return;
  var chip = t.closest('.ga-concept-chip');
  if(!chip || !chip.dataset.concept) return;
  e.preventDefault();
  e.stopPropagation();
  _open(chip.dataset.concept, chip);
});

window.GoldArkConceptPop = { open: _open, close: _close };
})();
