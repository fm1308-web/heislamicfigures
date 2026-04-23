// ===============================================================
// UPDATES VIEW — Project changelog panel
// ===============================================================
(function(){
'use strict';

var _open = false;
var _data = null;
var _prevView = null;

window._updatesOpen = false;

window._toggleUpdates = function(){
  var panel = document.getElementById('updates-view');
  var btn = document.getElementById('updatesBtn');
  if(!panel) return;

  if(_open){
    // Close updates, restore previous view
    _open = false;
    window._updatesOpen = false;
    panel.style.display = 'none';
    if(btn){ btn.style.borderColor='#555'; btn.style.color='#888'; }
    // Show all header rows below tile nav
    var r2 = document.getElementById('hdrRow2'); if(r2) r2.style.display = '';
    var r3 = document.getElementById('hdrRow3'); if(r3) r3.style.display = '';
    var r4 = document.getElementById('hdrRow4'); if(r4) r4.style.display = '';
    var fb = document.getElementById('filterBar'); if(fb) fb.style.display = '';
    if(_prevView && typeof setView === 'function') setView(_prevView);
    return;
  }

  // Open updates
  _prevView = window.VIEW || 'timeline';
  _open = true;
  window._updatesOpen = true;
  if(btn){ btn.style.borderColor='#D4AF37'; btn.style.color='#D4AF37'; }

  // Hide everything in mainShell except updates-view
  var shell = document.getElementById('mainShell');
  if(shell){
    Array.from(shell.children).forEach(function(ch){
      if(ch.id !== 'updates-view') ch.style.display = 'none';
    });
  }
  // Hide header rows below tile nav
  var r2 = document.getElementById('hdrRow2'); if(r2) r2.style.display = 'none';
  var r3 = document.getElementById('hdrRow3'); if(r3) r3.style.display = 'none';
  var r4 = document.getElementById('hdrRow4'); if(r4) r4.style.display = 'none';
  var fb = document.getElementById('filterBar'); if(fb) fb.style.display = 'none';
  // Deactivate all view tiles
  document.querySelectorAll('.hdr-tile').forEach(function(t){ t.classList.remove('active'); });

  panel.style.display = 'block';

  if(_data){
    _render(_data);
  } else {
    panel.innerHTML = '<div style="text-align:center;padding:60px;color:#6B7B8C">Loading...</div>';
    fetch('data/updates.json').then(function(r){ return r.json(); }).then(function(d){
      _data = d;
      _render(d);
    }).catch(function(){
      panel.innerHTML = '<div style="text-align:center;padding:60px;color:#6B7B8C">No updates yet.</div>';
    });
  }
};

function _render(entries){
  var panel = document.getElementById('updates-view');
  if(!panel) return;

  var h = '<div style="max-width:700px;margin:0 auto">';
  h += '<h2 style="color:#D4AF37;font-family:\'Cinzel\',serif;font-size:var(--fs-1);letter-spacing:.08em;margin:0 0 8px">Project Updates</h2>';
  h += '<p style="color:#6B7B8C;font-size:var(--fs-3);margin:0 0 32px">What changed in Gold Ark</p>';

  if(!entries || !entries.length){
    h += '<p style="color:#6B7B8C">No updates yet.</p>';
  } else {
    entries.forEach(function(e){
      h += '<div style="border-left:2px solid #D4AF37;padding:12px 0 12px 20px;margin:0 0 24px">';
      h += '<div style="font-family:\'Cinzel\',serif;font-size:var(--fs-3);color:#D4AF37;letter-spacing:.06em;margin:0 0 6px">' + _esc(e.date) + '</div>';
      h += '<div style="font-size:var(--fs-3);line-height:1.6;color:#ccc">' + _esc(e.text) + '</div>';
      h += '</div>';
    });
  }

  h += '</div>';
  panel.innerHTML = h;
}

function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Close updates when any view tile is clicked
document.addEventListener('click', function(e){
  if(!_open) return;
  var tile = e.target.closest('.hdr-tile');
  if(tile){
    _open = false;
    window._updatesOpen = false;
    var btn = document.getElementById('updatesBtn');
    if(btn){ btn.style.borderColor='#555'; btn.style.color='#888'; }
    var panel = document.getElementById('updates-view');
    if(panel) panel.style.display = 'none';
    // Restore mainShell children
    var shell = document.getElementById('mainShell');
    if(shell){
      Array.from(shell.children).forEach(function(ch){ ch.style.display = ''; });
    }
    var r2 = document.getElementById('hdrRow2'); if(r2) r2.style.display = '';
    var r3 = document.getElementById('hdrRow3'); if(r3) r3.style.display = '';
  }
});

})();
