// ═══════════════════════════════════════════════════════════
// ANIM CONTROLS — Shared play/pause/stop pill for all views
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

var SPEED_MAP = { '0.5x': 2400, '1x': 1200, '2x': 500 };

window.AnimControls = {
  create: function(opts){
    var mountEl = opts.mountEl;
    if(!mountEl) return null;
    var prefix = opts.idPrefix || 'ac';
    var mode = 'stopped';
    var currentSpeed = opts.initialSpeed || '1x';

    // Build HTML
    var pill = document.createElement('div');
    pill.className = 'anim-pill';

    var playBtn = document.createElement('button');
    playBtn.className = 'anim-btn anim-play';
    playBtn.id = prefix + '-anim-play';
    playBtn.title = 'Play';
    playBtn.textContent = '\u25B6';

    var stopBtn = document.createElement('button');
    stopBtn.className = 'anim-btn anim-stop';
    stopBtn.id = prefix + '-anim-stop';
    stopBtn.title = 'Stop';
    stopBtn.textContent = '\u23F9';
    stopBtn.disabled = true;

    var speedSel = document.createElement('select');
    speedSel.className = 'anim-speed';
    speedSel.id = prefix + '-anim-speed';
    ['0.5x','1x','2x'].forEach(function(v){
      var o = document.createElement('option');
      o.value = v; o.textContent = v;
      if(v === currentSpeed) o.selected = true;
      speedSel.appendChild(o);
    });

    pill.appendChild(playBtn);
    pill.appendChild(stopBtn);
    pill.appendChild(speedSel);
    mountEl.appendChild(pill);

    // Play/Pause toggle
    playBtn.addEventListener('click', function(){
      if(mode === 'playing'){
        mode = 'paused';
        playBtn.textContent = '\u25B6';
        if(opts.onPause) opts.onPause();
      } else {
        mode = 'playing';
        playBtn.textContent = '\u23F8';
        stopBtn.disabled = false;
        if(opts.onPlay) opts.onPlay();
      }
    });

    // Stop
    stopBtn.addEventListener('click', function(){
      mode = 'stopped';
      playBtn.textContent = '\u25B6';
      stopBtn.disabled = true;
      if(opts.onStop) opts.onStop();
    });

    // Speed change
    speedSel.addEventListener('change', function(){
      currentSpeed = speedSel.value;
      if(opts.onSpeedChange) opts.onSpeedChange(SPEED_MAP[currentSpeed]);
    });

    return {
      getMode: function(){ return mode; },
      getSpeedMs: function(){ return SPEED_MAP[currentSpeed]; },
      forceStop: function(){
        mode = 'stopped';
        playBtn.textContent = '\u25B6';
        stopBtn.disabled = true;
      }
    };
  }
};

})();
