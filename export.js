// Gold Ark — Export feature (PNG / PDF / single-tall-PDF)
(function(){
'use strict';

var H2C_URL = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
var JSPDF_URL = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

var _libsLoaded = false;
function _loadLibs(cb){
  if(_libsLoaded){ cb(); return; }
  var s1 = document.createElement('script'); s1.src = H2C_URL;
  var s2 = document.createElement('script'); s2.src = JSPDF_URL;
  var loaded = 0;
  function done(){ loaded++; if(loaded===2){ _libsLoaded = true; cb(); } }
  s1.onload = done; s2.onload = done;
  document.head.appendChild(s1); document.head.appendChild(s2);
}

function _openDialog(){
  if(document.getElementById('ga-export-modal')) return;
  var bd = document.createElement('div');
  bd.id = 'ga-export-modal';
  bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center';
  bd.innerHTML =
    '<div style="background:#131c2a;border:1px solid rgba(212,175,55,0.55);border-radius:10px;padding:24px;min-width:340px;max-width:420px;color:#E8EAEF;font-family:Lato,sans-serif">'+
    '<h3 style="margin:0 0 6px;font-family:Cinzel,serif;color:#c9a961;letter-spacing:0.06em">EXPORT VIEW</h3>'+
    '<div style="font-size:12px;color:#9aa3b2;margin-bottom:18px">Captures the full body, including content below the fold.</div>'+
    '<button id="gaExpPng"      style="display:block;width:100%;margin:6px 0;padding:11px;background:transparent;color:#c9a961;border:1px solid rgba(212,175,55,0.55);border-radius:6px;cursor:pointer;font-family:Lato,sans-serif;font-size:13px;text-align:left">PNG &nbsp;·&nbsp; one tall image</button>'+
    '<button id="gaExpPdfMulti" style="display:block;width:100%;margin:6px 0;padding:11px;background:transparent;color:#c9a961;border:1px solid rgba(212,175,55,0.55);border-radius:6px;cursor:pointer;font-family:Lato,sans-serif;font-size:13px;text-align:left">PDF &nbsp;·&nbsp; US Letter, multi-page</button>'+
    '<button id="gaExpCancel"   style="display:block;width:100%;margin-top:14px;padding:9px;background:transparent;color:#9aa3b2;border:1px solid #3a4658;border-radius:6px;cursor:pointer;font-family:Lato,sans-serif;font-size:12px">Cancel</button>'+
    '<div id="gaExpStatus" style="margin-top:14px;font-size:12px;color:#c9a961;text-align:center;display:none"></div>'+
    '</div>';
  document.body.appendChild(bd);
  function close(){ bd.remove(); }
  document.getElementById('gaExpCancel').onclick = close;
  bd.addEventListener('click', function(e){ if(e.target===bd) close(); });
  document.getElementById('gaExpPng').onclick      = function(){ _run('png',      bd); };
  document.getElementById('gaExpPdfMulti').onclick = function(){ _run('pdfMulti', bd); };
}

function _setStatus(bd, msg){
  var s = bd.querySelector('#gaExpStatus');
  if(s){ s.style.display='block'; s.textContent = msg; }
}

function _stamp(){
  var d = new Date(), p = function(n){ return n<10?'0'+n:n; };
  return d.getFullYear()+''+p(d.getMonth()+1)+p(d.getDate())+'-'+p(d.getHours())+p(d.getMinutes());
}

function _currentView(){
  var v = (window.VIEW || (window.state && window.state.activeTab) || 'view');
  return String(v).toLowerCase().replace(/\s+/g,'-');
}

// Pre-scroll Zone C top→bottom→top so lazy cards render before capture.
function _preScroll(zc){
  return new Promise(function(resolve){
    var orig = zc.scrollTop;
    var max = zc.scrollHeight - zc.clientHeight;
    if(max <= 0){ resolve(orig); return; }
    var step = Math.max(zc.clientHeight * 0.8, 400);
    var pos = 0;
    function tick(){
      pos = Math.min(pos + step, max);
      zc.scrollTop = pos;
      if(pos >= max){
        setTimeout(function(){ zc.scrollTop = orig; resolve(orig); }, 250);
      } else {
        setTimeout(tick, 120);
      }
    }
    tick();
  });
}

// Build export wrapper: Gold Ark logo header + cloned Zone C contents (white bg, dark text).
function _buildExportNode(zc){
  var wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;left:-99999px;top:0;width:'+zc.scrollWidth+'px;background:#ffffff;color:#222;padding:24px;font-family:Lato,sans-serif;z-index:-1';
  // Header with text logo
  var hdr = document.createElement('div');
  hdr.style.cssText = 'text-align:center;padding:8px 0 18px;border-bottom:1px solid #d4af37;margin-bottom:18px';
  hdr.innerHTML = '<img src="assets/gold-ark-logo-text.png" alt="Gold Ark" style="max-height:48px;display:inline-block">';
  wrap.appendChild(hdr);
  // Clone Zone C body
  var clone = zc.cloneNode(true);
  clone.style.cssText = 'background:#ffffff;color:#222;width:100%';
  // Force readable text on white in the clone tree
  var all = clone.querySelectorAll('*');
  for(var i=0;i<all.length;i++){
    var el = all[i];
    var cs = window.getComputedStyle(el);
    var bg = cs.backgroundColor;
    // Strip dark backgrounds
    if(bg && /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/.test(bg)){
      var m = bg.match(/\d+/g);
      if(m && m.length >= 3){
        var r = +m[0], g = +m[1], b = +m[2];
        var lum = (0.299*r + 0.587*g + 0.114*b);
        if(lum < 80) el.style.backgroundColor = '#ffffff';
      }
    }
    var col = cs.color;
    if(col){
      var cm = col.match(/\d+/g);
      if(cm && cm.length >= 3){
        var cr=+cm[0], cg=+cm[1], cb=+cm[2];
        var clum = (0.299*cr + 0.587*cg + 0.114*cb);
        if(clum > 180) el.style.color = '#222';   // light text → dark
      }
    }
  }
  wrap.appendChild(clone);
  // Footer
  var ftr = document.createElement('div');
  ftr.style.cssText = 'text-align:center;font-size:10px;color:#888;padding-top:18px;margin-top:18px;border-top:1px solid #ddd';
  ftr.textContent = 'hoomanlibrary.com/gold-ark · AI-generated · independently verify';
  wrap.appendChild(ftr);
  document.body.appendChild(wrap);
  return wrap;
}

function _run(mode, bd){
  var zc = document.getElementById('zoneC');
  if(!zc){ _setStatus(bd, 'Zone C not found'); return; }
  _setStatus(bd, 'Loading…');
  _loadLibs(function(){
    _setStatus(bd, 'Preparing content…');
    _preScroll(zc).then(function(){
      _setStatus(bd, 'Rendering…');
      // Per-view hook wins if defined
      var view = (window.VIEW || '').toLowerCase();
      var hookName = '_' + view.slice(0,2) + 'GetExportNode';  // _tlGetExportNode, _evGetExportNode...
      var customHookMap = { timeline: '_tlGetExportNode' };
      var hookKey = customHookMap[view];
      var node = null;
      if(hookKey && typeof window[hookKey] === 'function'){
        try { node = window[hookKey](); } catch(e){ console.warn('[export] view hook failed', e); node = null; }
      }
      if(node){
        node.style.position = 'fixed';
        node.style.left = '0';
        node.style.top = '0';
        node.style.zIndex = '-1';
        node.style.opacity = '0';
        node.style.pointerEvents = 'none';
        document.body.appendChild(node);
      } else {
        node = _buildExportNode(zc);
      }
      // Wait one frame for layout
      setTimeout(function(){
        window.html2canvas(node, {
          backgroundColor: '#ffffff',
          scale: 2,
          useCORS: true,
          logging: false,
          windowWidth: node.scrollWidth,
          windowHeight: node.scrollHeight
        }).then(function(canvas){
          node.remove();
          var view = _currentView();
          var stamp = _stamp();
          if(mode === 'png'){
            var srcCanvas = canvas;
            var MAX_DIM = 16000;
            if(canvas.height > MAX_DIM || canvas.width > MAX_DIM){
              var ratio = Math.min(MAX_DIM / canvas.height, MAX_DIM / canvas.width);
              var sc = document.createElement('canvas');
              sc.width = Math.floor(canvas.width * ratio);
              sc.height = Math.floor(canvas.height * ratio);
              sc.getContext('2d').drawImage(canvas, 0, 0, sc.width, sc.height);
              srcCanvas = sc;
            }
            var pngUrl;
            try { pngUrl = srcCanvas.toDataURL('image/png'); }
            catch(e){ pngUrl = srcCanvas.toDataURL('image/jpeg', 0.92); }
            if(!pngUrl || pngUrl === 'data:,'){
              _setStatus(bd, 'PNG too large — try PDF');
              return;
            }
            var a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'gold-ark-'+view+'-'+stamp+'.png';
            document.body.appendChild(a); a.click();
            setTimeout(function(){ a.remove(); }, 100);
            _setStatus(bd, 'Done.');
            setTimeout(function(){ bd.remove(); }, 800);
            return;
          }
          // PDF paths
          var jsPDF = window.jspdf && window.jspdf.jsPDF;
          if(!jsPDF){ _setStatus(bd, 'PDF library missing'); return; }
          var imgData = canvas.toDataURL('image/jpeg', 0.92);
          if(mode === 'pdfLong'){
            // Single page, custom height = canvas height (in points). 1px ≈ 0.75pt at 96dpi.
            var pxToPt = 0.5;  // tuned for scale:2 capture
            var pdfW = canvas.width * pxToPt;
            var pdfH = canvas.height * pxToPt;
            var pdf = new jsPDF({ orientation: pdfH>pdfW?'p':'l', unit:'pt', format:[pdfW, pdfH] });
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
            pdf.save('gold-ark-'+view+'-'+stamp+'.pdf');
          } else {
            // pdfMulti — US Letter
            var pdf2 = new jsPDF({ orientation:'p', unit:'pt', format:'letter' });
            var pageW = pdf2.internal.pageSize.getWidth();   // 612
            var pageH = pdf2.internal.pageSize.getHeight();  // 792
            var imgW = pageW;
            var imgH = canvas.height * (pageW / canvas.width);
            var heightLeft = imgH;
            var position = 0;
            pdf2.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
            heightLeft -= pageH;
            while(heightLeft > 0){
              position = heightLeft - imgH;
              pdf2.addPage();
              pdf2.addImage(imgData, 'JPEG', 0, position, imgW, imgH);
              heightLeft -= pageH;
            }
            pdf2.save('gold-ark-'+view+'-'+stamp+'.pdf');
          }
          _setStatus(bd, 'Done.');
          setTimeout(function(){ bd.remove(); }, 800);
        }).catch(function(err){
          if(node && node.parentNode) node.remove();
          console.error('[export] failed', err);
          _setStatus(bd, 'Export failed: ' + (err && err.message ? err.message : 'unknown'));
        });
      }, 60);
    });
  });
}

function _download(blob, name){
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click();
  setTimeout(function(){ a.remove(); URL.revokeObjectURL(url); }, 100);
}

window.GoldArkExport = { open: _openDialog };

})();
