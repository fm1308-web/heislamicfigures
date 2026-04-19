// ═══════════════════════════════════════════════════════════
// QuranAudio — per-ayah recitation via cdn.islamic.network.
// Uses HTML <audio> elements only (no fetch, no Web Audio, no CORS).
// URL: https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{globalAyah}.mp3
// ═══════════════════════════════════════════════════════════
window.QuranAudio = (function(){
  var BITRATES = [128, 64, 48];
  var FALLBACK_RECITER = 'ar.husary';

  var ayahCountsBySurah = null;  // length 114, 0-indexed
  var cumStart = null;           // cumStart[i] = sum of ayahs for surahs 1..i (exclusive)
  var currentReciter = 'ar.alafasy';
  var primary = null, next = null;
  var state = null;              // { surah, ayah, reciter, bitrateIdx, usedFallbackReciter }
  var onChangeCb = null, onErrorCb = null;

  function init(opts){
    opts = opts || {};
    ayahCountsBySurah = opts.ayahCountsBySurah;
    if(!Array.isArray(ayahCountsBySurah) || ayahCountsBySurah.length !== 114){
      console.error('[QuranAudio] init requires ayahCountsBySurah of length 114');
      return;
    }
    if(opts.defaultReciter) currentReciter = opts.defaultReciter;

    // Cumulative ayah offsets: cumStart[s-1] = ayahs before surah s
    cumStart = [0];
    var total = 0;
    for(var i=0; i<ayahCountsBySurah.length; i++){
      total += ayahCountsBySurah[i];
      cumStart.push(total);
    }

    primary = _ensureAudioEl('qa-primary');
    next = _ensureAudioEl('qa-next');
    _attachPrimaryListeners(primary);
  }

  function _ensureAudioEl(id){
    var el = document.getElementById(id);
    if(el) return el;
    el = document.createElement('audio');
    el.id = id;
    el.preload = 'auto';
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }

  function _attachPrimaryListeners(el){
    el.addEventListener('ended', _onEnded);
    el.addEventListener('error', _onPlaybackError);
  }
  function _detachPrimaryListeners(el){
    el.removeEventListener('ended', _onEnded);
    el.removeEventListener('error', _onPlaybackError);
  }

  function _globalAyah(surah, ayah){
    return cumStart[surah - 1] + ayah;
  }

  function _url(surah, ayah, reciter, bitrate){
    return 'https://cdn.islamic.network/quran/audio/' + bitrate + '/' + reciter + '/' + _globalAyah(surah, ayah) + '.mp3';
  }

  function _fire(cb, arg){
    if(typeof cb === 'function'){
      try{ cb(arg); }catch(e){ console.error('[QuranAudio] callback error', e); }
    }
  }

  function _preloadNext(){
    if(!state) return;
    var cnt = ayahCountsBySurah[state.surah - 1];
    if(state.ayah + 1 > cnt){
      next.removeAttribute('src');
      try{ next.load(); }catch(e){}
      return;
    }
    next.src = _url(state.surah, state.ayah + 1, state.reciter, BITRATES[0]);
  }

  function play(surah, ayah){
    if(!cumStart){ console.error('[QuranAudio] not initialized'); return; }
    if(surah < 1 || surah > 114) return;
    var cnt = ayahCountsBySurah[surah - 1];
    if(ayah < 1 || ayah > cnt) return;

    // Stop both without firing change (change fires below).
    _hardStop(false);

    state = {
      surah: surah,
      ayah: ayah,
      reciter: currentReciter,
      bitrateIdx: 0,
      usedFallbackReciter: false
    };
    primary.src = _url(surah, ayah, state.reciter, BITRATES[0]);
    primary.play().catch(function(){ /* autoplay-policy, ignore */ });
    _fire(onChangeCb, { surah: surah, ayah: ayah });
    _preloadNext();
  }

  function pause(){
    if(primary) try{ primary.pause(); }catch(e){}
  }

  function stop(){
    _hardStop(true);
  }

  function _hardStop(fireChange){
    if(primary){
      try{ primary.pause(); }catch(e){}
      primary.removeAttribute('src');
      try{ primary.load(); }catch(e){}
    }
    if(next){
      try{ next.pause(); }catch(e){}
      next.removeAttribute('src');
      try{ next.load(); }catch(e){}
    }
    state = null;
    if(fireChange) _fire(onChangeCb, null);
  }

  function setReciter(id){
    currentReciter = id;
    // If currently playing, restart current ayah with the new reciter.
    if(state){
      var s = state.surah, a = state.ayah;
      play(s, a);
    }
  }

  function getCurrent(){
    return state ? { surah: state.surah, ayah: state.ayah } : null;
  }

  function onChange(fn){ onChangeCb = fn; }
  function onError(fn){ onErrorCb = fn; }

  function _onEnded(){
    if(!state) return;
    var cnt = ayahCountsBySurah[state.surah - 1];
    // Per-ayah (single-shot) playback — don't auto-advance.
    if(!window._stSurahPlayMode){
      stop();
      return;
    }
    if(state.ayah + 1 > cnt){
      // End of surah — do NOT auto-advance into next surah.
      stop();
      return;
    }
    // Swap primary <-> next. Old primary (finished) becomes the preload slot.
    var oldPrimary = primary;
    _detachPrimaryListeners(oldPrimary);
    try{ oldPrimary.pause(); }catch(e){}
    oldPrimary.removeAttribute('src');
    try{ oldPrimary.load(); }catch(e){}

    primary = next;
    next = oldPrimary;
    _attachPrimaryListeners(primary);

    state.ayah += 1;
    primary.play().catch(function(){});
    _fire(onChangeCb, { surah: state.surah, ayah: state.ayah });
    _preloadNext();
  }

  function _onPlaybackError(ev){
    if(!state) return;
    // Same reciter, next-lower bitrate
    if(state.bitrateIdx + 1 < BITRATES.length){
      state.bitrateIdx += 1;
      primary.src = _url(state.surah, state.ayah, state.reciter, BITRATES[state.bitrateIdx]);
      primary.play().catch(function(){});
      return;
    }
    // Fall back to husary at 64kbps
    if(!state.usedFallbackReciter){
      state.usedFallbackReciter = true;
      state.reciter = FALLBACK_RECITER;
      state.bitrateIdx = 1;
      primary.src = _url(state.surah, state.ayah, state.reciter, BITRATES[state.bitrateIdx]);
      primary.play().catch(function(){});
      return;
    }
    // Give up
    var s = state.surah, a = state.ayah;
    _fire(onErrorCb, { surah: s, ayah: a });
    stop();
  }

  return {
    init: init,
    play: play,
    pause: pause,
    stop: stop,
    setReciter: setReciter,
    getCurrent: getCurrent,
    onChange: onChange,
    onError: onError
  };
})();
