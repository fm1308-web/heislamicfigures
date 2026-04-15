/* ═══════════════════════════════════════════════════════════
   feedback.js  –  Categorised feedback modal for Gold Ark
   Loaded AFTER gate.js, BEFORE app.js.
   ═══════════════════════════════════════════════════════════ */
(function(){

var MODAL_ID = 'gaFeedbackModal';

function openFeedbackModal(){
  if(document.getElementById(MODAL_ID)) return;

  var overlay = document.createElement('div');
  overlay.id = MODAL_ID;
  overlay.innerHTML =
    '<div class="gafb-box">' +
      '<h2 class="gafb-title">Send Feedback</h2>' +
      '<p class="gafb-sub">Help shape Gold Ark. What did you find?</p>' +

      '<label class="gafb-label">Category <span class="gafb-req">*</span></label>' +
      '<select id="gafbCategory" class="gafb-select">' +
        '<option value="">Select\u2026</option>' +
        '<option value="Bug">Bug</option>' +
        '<option value="Feature Request">Feature Request</option>' +
        '<option value="Data Error">Data Error</option>' +
        '<option value="Content Suggestion">Content Suggestion</option>' +
        '<option value="Other">Other</option>' +
      '</select>' +

      '<label class="gafb-label">Message <span class="gafb-req">*</span></label>' +
      '<textarea id="gafbMessage" class="gafb-textarea" rows="5" placeholder="Describe it\u2026"></textarea>' +

      '<label class="gafb-label">Where in the app? <span class="gafb-opt">(optional)</span></label>' +
      '<input type="text" id="gafbLocation" class="gafb-input" placeholder="View name, figure name\u2026">' +

      '<label class="gafb-label">Attach screenshot <span class="gafb-opt">(optional)</span></label>' +
      '<input type="file" id="gafbFile" class="gafb-input gafb-file" accept="image/png,image/jpeg" multiple>' +

      '<p id="gafbError" class="gafb-error"></p>' +
      '<div class="gafb-btns">' +
        '<button id="gafbCancel" class="gafb-btn gafb-cancel">Cancel</button>' +
        '<button id="gafbSubmit" class="gafb-btn gafb-submit">Submit</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(overlay);

  var catEl    = document.getElementById('gafbCategory');
  var msgEl    = document.getElementById('gafbMessage');
  var locEl    = document.getElementById('gafbLocation');
  var fileEl   = document.getElementById('gafbFile');
  var errorEl  = document.getElementById('gafbError');
  var submitBtn= document.getElementById('gafbSubmit');

  // Cancel
  document.getElementById('gafbCancel').addEventListener('click', function(){ overlay.remove(); });
  overlay.addEventListener('click', function(e){ if(e.target===overlay) overlay.remove(); });

  // Submit
  submitBtn.addEventListener('click', function(){
    var cat = catEl.value;
    var msg = msgEl.value.trim();
    var loc = locEl.value.trim();

    if(!cat){ errorEl.textContent='Please select a category.'; return; }
    if(msg.length<10){ errorEl.textContent='Message must be at least 10 characters.'; return; }

    var files = fileEl && fileEl.files ? Array.prototype.slice.call(fileEl.files) : [];
    var MAX_FILES = 10, MAX_PER = 25*1024*1024, MAX_TOTAL = 100*1024*1024;
    if(files.length > MAX_FILES){ errorEl.textContent='Max 10 screenshots allowed.'; return; }
    var total = 0;
    for(var i=0;i<files.length;i++){
      if(files[i].size > MAX_PER){ errorEl.textContent='Each screenshot must be under 25 MB.'; return; }
      total += files[i].size;
    }
    if(total > MAX_TOTAL){ errorEl.textContent='Total attachments must be under 100 MB.'; return; }

    errorEl.textContent='';
    submitBtn.disabled=true;
    submitBtn.textContent='Sending\u2026';

    var form = new FormData();
    form.append('email', localStorage.getItem('goldArkTester')||'');
    form.append('category', cat);
    form.append('message', msg);
    form.append('location', loc);
    form.append('view', window.VIEW||'');
    form.append('userAgent', navigator.userAgent);
    files.forEach(function(f){ form.append('attachment', f, f.name); });

    fetch('https://formspree.io/f/mdapbjpp',{
      method:'POST',
      headers:{'Accept':'application/json'},
      body: form
    })
    .then(function(r){ if(!r.ok) throw new Error('Server returned '+r.status); return r.json(); })
    .then(function(){
      overlay.remove();
      _fbToast('Thanks \u2014 feedback sent');
    })
    .catch(function(){
      errorEl.textContent='Something went wrong. Please try again.';
      submitBtn.disabled=false;
      submitBtn.textContent='Submit';
    });
  });
}

function _fbToast(msg){
  var el=document.getElementById('ga-toast');
  if(el) el.remove();
  el=document.createElement('div');
  el.id='ga-toast';
  el.className='toast-msg';
  el.textContent=msg;
  document.body.appendChild(el);
  requestAnimationFrame(function(){ el.classList.add('show'); });
  setTimeout(function(){ el.classList.remove('show'); setTimeout(function(){ el.remove(); },300); },3000);
}

/* ── Inject styles ── */
var style=document.createElement('style');
style.textContent=
  '#gaFeedbackModal{'+
    'position:fixed;inset:0;z-index:99999;'+
    'display:flex;align-items:center;justify-content:center;'+
    'background:rgba(0,0,0,0.65);backdrop-filter:blur(6px);'+
  '}'+
  '.gafb-box{'+
    'background:#1a1a2e;border:1px solid #D4AF37;border-radius:10px;'+
    'padding:28px 32px;max-width:460px;width:92%;'+
    'box-shadow:0 8px 40px rgba(0,0,0,0.6);'+
  '}'+
  '.gafb-title{'+
    'font-family:"Cinzel",serif;font-size:20px;font-weight:700;'+
    'color:#D4AF37;margin:0 0 8px;text-align:center;'+
  '}'+
  '.gafb-sub{'+
    'font-family:"Source Sans 3",sans-serif;font-size:13.5px;'+
    'color:#a0aec0;line-height:1.5;margin:0 0 16px;text-align:center;'+
  '}'+
  '.gafb-label{'+
    'display:block;font-family:"Source Sans 3",sans-serif;font-size:12px;'+
    'color:#a0aec0;margin:0 0 4px;letter-spacing:.02em;'+
  '}'+
  '.gafb-req{color:#e53e3e;font-size:11px}'+
  '.gafb-opt{color:#718096;font-size:11px}'+
  '.gafb-select,.gafb-input,.gafb-textarea{'+
    'display:block;width:100%;box-sizing:border-box;'+
    'padding:9px 12px;border:1px solid #333;border-radius:6px;'+
    'background:#0d0d1a;color:#e2e8f0;font-size:13.5px;'+
    'font-family:"Source Sans 3",sans-serif;outline:none;'+
    'transition:border-color .2s;margin-bottom:12px;'+
  '}'+
  '.gafb-select:focus,.gafb-input:focus,.gafb-textarea:focus{border-color:#D4AF37}'+
  '.gafb-textarea{resize:vertical;min-height:80px}'+
  '.gafb-select{cursor:pointer;-webkit-appearance:none;appearance:none;'+
    'background-image:url("data:image/svg+xml,%3Csvg width=\'10\' height=\'6\' viewBox=\'0 0 10 6\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 1l4 4 4-4\' stroke=\'%23a0aec0\' stroke-width=\'1.5\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E");'+
    'background-repeat:no-repeat;background-position:right 12px center;padding-right:32px;'+
  '}'+
  '.gafb-select option{background:#1a1a2e;color:#e2e8f0}'+
  '.gafb-error{'+
    'font-family:"Source Sans 3",sans-serif;font-size:12.5px;'+
    'color:#e53e3e;margin:4px 0 0;min-height:18px;text-align:center;'+
  '}'+
  '.gafb-btns{display:flex;gap:12px;margin-top:14px;justify-content:center}'+
  '.gafb-btn{'+
    'font-family:"Cinzel",serif;font-size:13px;font-weight:600;'+
    'padding:9px 28px;border-radius:6px;cursor:pointer;'+
    'letter-spacing:.04em;transition:opacity .15s;border:none;'+
  '}'+
  '.gafb-btn:hover{opacity:0.85}'+
  '.gafb-btn:disabled{opacity:0.5;cursor:default}'+
  '.gafb-cancel{background:transparent;border:1px solid #555;color:#a0aec0}'+
  '.gafb-submit{background:#D4AF37;color:#1a1a2e}';
document.head.appendChild(style);

/* ── Expose globally ── */
window.openFeedbackModal=openFeedbackModal;

})();
