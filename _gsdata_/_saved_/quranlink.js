// ═══════════════════════════════════════════════════════════
// QURANLINK — Clickable Quran references across all views
// renderQuranRef(refString) → HTML with <a class="qref"> links
// _qlJump(surah, ayah) → switch to START view, scroll, highlight
// ═══════════════════════════════════════════════════════════
(function(){
'use strict';

function _qlEsc(s){var d=document.createElement('div');d.textContent=s||'';return d.innerHTML;}

// Parse all surah:verse refs from a string
// Handles: "2:255", "Al-Imran 3:123", "Quran 2:255", "Q. 2:255", "3:1-4"
function _qlParseAll(s){
  if(!s)return[];
  var str=String(s);
  var re=/(?:(?:Quran|Q\.?|Surah)\s+)?(?:[A-Za-z][A-Za-z'\u2018\u2019\-\s]*?\s+)?(\d{1,3})\s*:\s*(\d{1,3})(?:\s*[-\u2013]\s*\d+)?/g;
  var out=[];var m;
  while((m=re.exec(str))!==null){
    out.push({start:m.index,end:m.index+m[0].length,text:m[0].trim(),surah:parseInt(m[1],10),ayah:parseInt(m[2],10)});
  }
  return out;
}

// Main: convert ref string to HTML with clickable links
function renderQuranRef(ref){
  if(!ref)return'';
  var s=String(ref);
  var matches=_qlParseAll(s);
  if(!matches.length)return _qlEsc(s);

  var out='';var last=0;
  matches.forEach(function(mt){
    out+=_qlEsc(s.slice(last,mt.start));
    out+='<a class="qref" data-surah="'+mt.surah+'" data-ayah="'+mt.ayah+'" href="#quran/'+mt.surah+'/'+mt.ayah+'" onclick="_qlJump('+mt.surah+','+mt.ayah+',event)">'+_qlEsc(mt.text)+'</a>';
    last=mt.end;
  });
  out+=_qlEsc(s.slice(last));
  return out;
}

// Jump to START view at surah:ayah
window._qlJump=function(surah,ayah,ev){
  if(ev){ev.preventDefault();ev.stopPropagation();}
  history.replaceState(null,'','#quran/'+surah+'/'+ayah);
  if(typeof setView==='function')setView('start');
  _qlScrollTo(surah,ayah);
};

function _qlScrollTo(surah,ayah){
  var attempts=0;
  var check=function(){
    attempts++;
    if(attempts>40)return;
    var reader=document.getElementById('st-reader');
    if(typeof _stSelectSurah==='function'&&reader){
      _stSelectSurah(surah);
      setTimeout(function(){_qlHighlight(ayah);},300);
    } else {
      setTimeout(check,100);
    }
  };
  check();
}

function _qlHighlight(ayah){
  var verses=document.querySelectorAll('.st-verse');
  for(var i=0;i<verses.length;i++){
    var center=verses[i].querySelector('.st-vcenter span');
    if(center&&parseInt(center.textContent,10)===ayah){
      verses[i].scrollIntoView({behavior:'smooth',block:'center'});
      verses[i].classList.add('qref-pulse');
      setTimeout(function(el){return function(){el.classList.remove('qref-pulse');};}(verses[i]),2500);
      return;
    }
  }
}

// Hash deep-link on page load: #quran/2/255
window.addEventListener('load',function(){
  var h=location.hash;
  var m=h.match(/^#quran\/(\d+)\/(\d+)$/);
  if(m){
    setTimeout(function(){
      _qlJump(parseInt(m[1],10),parseInt(m[2],10));
    },800);
  }
});

// Expose
window.renderQuranRef=renderQuranRef;
window._qlScrollTo=_qlScrollTo;
window._qlHighlight=_qlHighlight;

})();
