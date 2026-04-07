/* ═══════════════════════════════════════════════════════════
   share.js  –  SHARE (URL state) + SNAPSHOT (PNG export)
   Loaded AFTER all view scripts. Buttons injected into header.
   ═══════════════════════════════════════════════════════════ */
(function(){

/* ── Toast helper ── */
function _showToast(msg){
  var existing=document.getElementById('ga-toast');
  if(existing) existing.remove();
  var el=document.createElement('div');
  el.id='ga-toast';
  el.className='toast-msg';
  el.textContent=msg;
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
  setTimeout(function(){ el.classList.remove('show'); setTimeout(function(){ el.remove(); },300); },1500);
}

/* ══════════════════════════════════════════════════════════
   PART 1: SHARE — encode current state into URL
   ══════════════════════════════════════════════════════════ */
function _getShareURL(){
  var params=new URLSearchParams();
  var v=window.VIEW||'timeline';
  params.set('view',v);

  if(v==='one'){
    // ONE view: get selected figure
    if(window._oneGetSelected){
      var sel=window._oneGetSelected();
      if(sel&&sel.length>0){
        var p=window.PEOPLE&&window.PEOPLE.find(function(pp){return pp.famous===sel[0];});
        if(p&&p.slug) params.set('slug',p.slug);
      }
    }
  } else if(v==='follow'){
    // FOLLOW view: get first selected figure slug
    if(window._fwGetSelectedSlug){
      var slug=window._fwGetSelectedSlug();
      if(slug) params.set('slug',slug);
    }
  } else if(v==='timeline'){
    // Timeline: active person + year
    if(window.activePerson&&window.activePerson.slug) params.set('slug',window.activePerson.slug);
    if(window.activeYear) params.set('year',window.activeYear);
  } else if(v==='events'){
    if(window.activeYear) params.set('year',window.activeYear);
  } else if(v==='silsila'||v==='map'||v==='eras'||v==='studyroom'){
    if(window.activePerson&&window.activePerson.slug) params.set('slug',window.activePerson.slug);
    if(window.activeYear) params.set('year',window.activeYear);
  }

  return window.location.origin+window.location.pathname+'?'+params.toString();
}

function doShare(){
  requireTester('share', function(){
    var url=_getShareURL();
    var title='Islamic Figures';
    var text='Check out this on Islamic Figures';

    if(navigator.share){
      navigator.share({title:title,text:text,url:url}).catch(function(err){
        if(err&&err.name==='AbortError') return;
        _openMailto(url,title,text);
      });
    } else {
      _openMailto(url,title,text);
    }
  });
}

function _openMailto(url,title,text){
  try{
    var mailto='mailto:?subject='+encodeURIComponent(title)+'&body='+encodeURIComponent(text+':\n\n'+url);
    window.open(mailto,'_blank');
  } catch(e){
    _fallbackCopy(url);
  }
}

function _fallbackCopy(text){
  var ta=document.createElement('textarea');
  ta.value=text; ta.style.position='fixed'; ta.style.opacity='0';
  document.body.appendChild(ta); ta.select();
  try{ document.execCommand('copy'); _showToast('Link copied'); }
  catch(e){ _showToast('Could not copy link'); }
  document.body.removeChild(ta);
}

/* ══════════════════════════════════════════════════════════
   PART 1b: RESTORE — parse URL params on boot
   ══════════════════════════════════════════════════════════ */
window._shareRestoreFromURL=function(){
  var params;
  try{ params=new URLSearchParams(window.location.search); }catch(e){ return; }
  if(!params.has('view')) return;

  var v=params.get('view');
  var slug=params.get('slug')||'';
  var year=params.get('year')?parseInt(params.get('year')):null;

  // Switch view
  if(typeof setView==='function') setView(v);

  // Restore year if applicable
  if(year&&(v==='timeline'||v==='events'||v==='silsila'||v==='map'||v==='eras')){
    if(typeof _applyYear==='function') _applyYear(year);
    else if(window.activeYear!==undefined){
      window.activeYear=year;
      var slider=document.getElementById('sliderInput');
      if(slider){ slider.value=year; }
      if(typeof _syncSliderUI==='function') _syncSliderUI();
      if(typeof applyFilterAndFocus==='function') applyFilterAndFocus();
    }
  }

  if(!slug) return;

  // Find person by slug
  var person=window.PEOPLE&&window.PEOPLE.find(function(p){ return p.slug===slug; });

  if(v==='one'&&person){
    setTimeout(function(){
      if(typeof window._oneClickName==='function') window._oneClickName(person.famous);
    },200);
  } else if(v==='follow'){
    setTimeout(function(){
      if(typeof window._followShowFigure==='function') window._followShowFigure(slug);
    },200);
  } else if(v==='timeline'&&person){
    setTimeout(function(){
      if(typeof jumpTo==='function') jumpTo(person.famous);
    },200);
  } else if((v==='silsila'||v==='map')&&person){
    setTimeout(function(){
      if(typeof jumpTo==='function') jumpTo(person.famous);
    },200);
  }

  // Clean URL without reloading
  if(window.history&&window.history.replaceState){
    window.history.replaceState({},'',window.location.pathname+'#'+v);
  }
};

/* ══════════════════════════════════════════════════════════
   PART 2: SNAPSHOT — PNG export with watermark
   ══════════════════════════════════════════════════════════ */
function _getCaptureTarget(){
  var v=window.VIEW||'timeline';
  var targets={
    'timeline':'mainShell',
    'silsila':'silsilaView',
    'map':'mapView',
    'studyroom':'studyRoomView',
    'eras':'eras-view',
    'events':'events-view',
    'one':'one-view',
    'follow':'follow-view',
    'talk':'talk-view'
  };
  return document.getElementById(targets[v]||'mainShell');
}

function _datestamp(){
  var d=new Date();
  return d.getFullYear()+
    String(d.getMonth()+1).padStart(2,'0')+
    String(d.getDate()).padStart(2,'0');
}

function doSnapshot(){
  requireTester('snapshot', function(){
  var v=window.VIEW||'timeline';
  var target=_getCaptureTarget();
  if(!target){ _showToast('Nothing to capture'); return; }

  // 1. Add snapshot-mode
  document.body.classList.add('snapshot-mode');

  // 2. Inject watermark
  var wm=document.createElement('div');
  wm.className='snapshot-watermark';
  wm.textContent='hoomanexperiment.com/mystics';
  target.style.position=target.style.position||'relative';
  target.appendChild(wm);

  // 3. Capture
  var useMap=(v==='map'||v==='follow');
  var filename='islamic-figures-'+v+'-'+_datestamp()+'.png';

  var capturePromise;
  if(useMap&&window.domtoimage){
    capturePromise=window.domtoimage.toPng(target,{bgcolor:'#0a1628'})
      .then(function(dataUrl){
        return fetch(dataUrl).then(function(r){return r.blob();});
      });
  } else if(window.html2canvas){
    capturePromise=window.html2canvas(target,{backgroundColor:'#0a1628',useCORS:true,scale:2})
      .then(function(canvas){
        return new Promise(function(resolve){
          canvas.toBlob(function(blob){ resolve(blob); },'image/png');
        });
      });
  } else {
    _cleanup(wm);
    _showToast('Capture library not loaded');
    return;
  }

  capturePromise.then(function(blob){
    // Download
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download=filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    _cleanup(wm);
    _showToast('Image saved');
  }).catch(function(err){
    console.warn('[Snapshot] capture failed',err);
    _cleanup(wm);
    _showToast('Capture failed');
  });
  });
}

function _cleanup(wm){
  if(wm&&wm.parentNode) wm.parentNode.removeChild(wm);
  document.body.classList.remove('snapshot-mode');
}

/* ══════════════════════════════════════════════════════════
   Inject buttons into header
   ══════════════════════════════════════════════════════════ */
function _injectButtons(){
  var row1Right=document.getElementById('hdrRow1Right');
  if(!row1Right) return;

  var wrap=document.createElement('div');
  wrap.id='shareSnapshotBtns';
  wrap.innerHTML=
    '<button class="share-btn hide-on-snapshot" onclick="window._doShare()" title="Copy shareable link">SHARE</button>'+
    '<button class="snapshot-btn hide-on-snapshot" onclick="window._doSnapshot()" title="Save as image">SNAPSHOT</button>'+
    '<button class="feedback-btn hide-on-snapshot" onclick="requireTester(\'feedback\',function(){openFeedbackModal();})" title="Send feedback">FEEDBACK</button>';
  row1Right.appendChild(wrap);
}

// Wait for DOM
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',_injectButtons);
} else {
  _injectButtons();
}

/* ── Expose globally ── */
window._doShare=doShare;
window._doSnapshot=doSnapshot;

})();
