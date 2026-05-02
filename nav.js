// ═══════════════════════════════════════════════════════════
// NAV — In-app back/forward history with state preservation
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var _history = [];
var _idx = -1;
var MAX = 20;
var _navigating = false; // true during back/forward to suppress push

function _captureFn(view){
  var fn = window['_captureState_' + view];
  return typeof fn === 'function' ? fn : null;
}
function _restoreFn(view){
  var fn = window['_restoreState_' + view];
  return typeof fn === 'function' ? fn : null;
}

function captureCurrentState(){
  if(_idx < 0 || _idx >= _history.length) return;
  var entry = _history[_idx];
  var fn = _captureFn(entry.view);
  if(fn) entry.state = fn();
}
window._navCaptureCurrent = captureCurrentState;

function restoreState(entry){
  if(!entry) return;
  var fn = _restoreFn(entry.view);
  if(fn && entry.state) setTimeout(function(){ fn(entry.state); }, 50);
}

window._navPush = function(view){
  if(_navigating) return;
  // Capture outgoing view state
  captureCurrentState();
  // Truncate forward stack
  if(_idx < _history.length - 1) _history = _history.slice(0, _idx + 1);
  // Push new entry
  _history.push({ view: view, state: {} });
  _idx = _history.length - 1;
  // FIFO cap
  if(_history.length > MAX){ _history.shift(); _idx--; }
  updateNavButtons();
};

window._navBack = function(){
  if(_idx <= 0) return;
  captureCurrentState();
  _idx--;
  var entry = _history[_idx];
  _navigating = true;
  setView(entry.view);
  restoreState(entry);
  _navigating = false;
  updateNavButtons();
};

window._navForward = function(){
  if(_idx >= _history.length - 1) return;
  captureCurrentState();
  _idx++;
  var entry = _history[_idx];
  _navigating = true;
  setView(entry.view);
  restoreState(entry);
  _navigating = false;
  updateNavButtons();
};

function updateNavButtons(){
  var bk = document.getElementById('navBackBtn');
  var fw = document.getElementById('navFwdBtn');
  if(bk){
    bk.disabled = (_idx <= 0);
    bk.title = (_idx > 0) ? 'Back to ' + _history[_idx-1].view.toUpperCase() : 'Back';
  }
  if(fw){
    fw.disabled = (_idx >= _history.length - 1);
    fw.title = (_idx < _history.length - 1) ? 'Forward to ' + _history[_idx+1].view.toUpperCase() : 'Forward';
  }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e){
  if(e.altKey && e.key === 'ArrowLeft'){ e.preventDefault(); window._navBack(); }
  if(e.altKey && e.key === 'ArrowRight'){ e.preventDefault(); window._navForward(); }
});

window._navUpdateButtons = updateNavButtons;
window._navCaptureCurrent = captureCurrentState;
Object.defineProperty(window, '_navDebug', {
  get: function(){ return { history: _history.slice(), idx: _idx, navigating: _navigating }; }
});

})();
