/* Gold Ark — Relations 3D overlay module
   window.Relations3D = { open(slug, data), close() }
   Three.js r128 loaded lazily on first open().
*/
(function(){
'use strict';

/* ── DOM helper: all overlay element IDs are prefixed r3d- ────── */
function _id(n){ return document.getElementById('r3d-'+n); }

/* ── Module state (reset on every open) ────────────────────────── */
var CORE=null,ENRICH_BY_SLUG={},NAME2SLUG=null,CORE_BY_SLUG={},STUDENTS_OF=null;
var renderer=null,scene=null,camera=null,sceneGroup=null;
var clickTargets=[],_labels=[],_ticks=[];
var _camTargetY=0,_flyRyTarget=null,_flyMesh=null;
var _ADJ=null,_pathWalk=null;
var viewMode='group',detailKind=null;
var focusStack=[],currentFocusSlug=null,currentFocusFig=null;
var _drag=false,_lastMX=0,_lastMY=0,_clickX=0,_clickY=0,_clickT=0;
var _autoRot=true,_autoRotTimer=null;
var _cvs=null,_rc=null,_mp=null;
var _rafId=null,_resizeHandler=null,_escHandler=null;

/* ── Overlay CSS ─────────────────────────────────────────────────── */
var R3D_CSS=[
'#r3d-overlay{position:fixed;inset:0;z-index:1200;overflow:hidden;background:#06060f;color:#f5f0e8}',
'#r3d-overlay #r3d-canvas{position:absolute;inset:0;display:block;cursor:grab}',
'#r3d-overlay #r3d-canvas.dragging{cursor:grabbing}',
'#r3d-overlay #r3d-inner-overlay{position:absolute;inset:0;pointer-events:none;overflow:hidden}',
'#r3d-overlay .p-label{position:absolute;font:11px/1.2 Georgia,serif;color:rgba(245,240,232,.80);text-shadow:0 0 10px #000,0 0 5px #000;white-space:nowrap;pointer-events:none;transform:translate(13px,-50%);transition:opacity .15s}',
'#r3d-overlay .p-label.focus-lbl{font-size:14px;font-weight:700;color:#ffe47a;letter-spacing:.03em;transform:translate(-50%,-170%);text-shadow:0 0 20px rgba(255,200,0,.55),0 0 7px #000}',
'#r3d-overlay .p-label.group-lbl{font-size:13px;font-weight:700;color:#fff;letter-spacing:.01em;transform:translate(14px,-50%);text-shadow:0 0 14px #000,0 0 6px #000,0 0 28px rgba(0,0,0,.9)}',
'#r3d-overlay .tick-label{position:absolute;pointer-events:none;text-align:right;line-height:1.4;user-select:none}',
'#r3d-overlay .tick-ce{font:10px/1 Georgia,serif;color:rgba(212,168,74,.80)}',
'#r3d-overlay .tick-ah{font:9px/1 Georgia,serif;color:rgba(212,168,74,.36)}',
'#r3d-overlay #r3d-legend{position:absolute;top:18px;left:18px;background:rgba(6,6,15,.88);border:1px solid rgba(212,168,74,.18);border-radius:2px;padding:13px 16px 11px;pointer-events:none;backdrop-filter:blur(4px)}',
'#r3d-overlay .leg-hd{font:9px/1 Georgia,serif;letter-spacing:.13em;text-transform:uppercase;color:rgba(212,168,74,.55);margin-bottom:10px}',
'#r3d-overlay .leg-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}',
'#r3d-overlay .leg-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}',
'#r3d-overlay .leg-lbl{font:11px/1 Georgia,serif;color:rgba(245,240,232,.62)}',
'#r3d-overlay #r3d-nav-bar{position:absolute;top:14px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:10px;pointer-events:auto;z-index:10}',
'#r3d-overlay #r3d-breadcrumb{font:12px Georgia,serif;color:rgba(245,240,232,.50);max-width:440px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
'#r3d-overlay .bc{color:#d4a84a}',
'#r3d-overlay .sep{color:#444;margin:0 5px}',
'#r3d-overlay #r3d-back-btn{padding:4px 12px;background:rgba(6,6,15,.88);border:1px solid rgba(212,168,74,.30);border-radius:1px;color:#d4a84a;font:11px Georgia,serif;cursor:pointer;transition:background .15s}',
'#r3d-overlay #r3d-back-btn:hover{background:rgba(212,168,74,.12)}',
'#r3d-overlay #r3d-back-btn.hidden{display:none}',
'#r3d-overlay #r3d-mode-badge{position:absolute;top:46px;left:50%;transform:translateX(-50%);font:9px/1 Georgia,serif;letter-spacing:.18em;text-transform:uppercase;color:rgba(212,168,74,.40);pointer-events:none;white-space:nowrap}',
'#r3d-overlay #r3d-info-panel{position:absolute;top:50%;right:20px;transform:translateY(-50%);width:222px;background:rgba(6,6,15,.93);border:1px solid rgba(212,168,74,.24);border-radius:2px;padding:17px 17px 14px;pointer-events:auto;backdrop-filter:blur(6px);z-index:10}',
'#r3d-overlay #r3d-info-panel.hidden{display:none}',
'#r3d-overlay .ip-close{position:absolute;top:8px;right:11px;cursor:pointer;color:rgba(255,255,255,.28);font-size:14px;line-height:1;transition:color .15s}',
'#r3d-overlay .ip-close:hover{color:#e8c878}',
'#r3d-overlay .ip-name{font:600 14px/1.3 Georgia,serif;color:#e8c878;margin-bottom:4px;padding-right:14px}',
'#r3d-overlay .ip-years{font:11px/1 Georgia,serif;color:#888;margin-bottom:6px}',
'#r3d-overlay .ip-title{font:italic 11px/1.4 Georgia,serif;color:#aaa;margin-bottom:9px;min-height:2px}',
'#r3d-overlay .ip-rel{font:11px/1 Georgia,serif;color:#8ab4d4;margin-bottom:12px;padding:5px 7px;background:rgba(90,155,212,.07);border-left:2px solid #5a9bd4;border-radius:0 2px 2px 0}',
'#r3d-overlay .ip-drill{display:block;width:100%;padding:7px 0;background:transparent;border:1px solid rgba(212,168,74,.30);border-radius:1px;color:#d4a84a;font:11px Georgia,serif;cursor:pointer;text-align:center;transition:background .15s}',
'#r3d-overlay .ip-drill:hover{background:rgba(212,168,74,.10)}',
'#r3d-overlay #r3d-hint{position:absolute;bottom:28px;left:50%;transform:translateX(-50%);font:11px/1.5 Georgia,serif;color:rgba(245,240,232,.28);pointer-events:none;white-space:nowrap;text-align:center}',
'#r3d-overlay #r3d-count-badge{position:absolute;bottom:12px;left:50%;transform:translateX(-50%);font:10px/1 Georgia,serif;letter-spacing:.06em;color:rgba(245,240,232,.20);pointer-events:none;white-space:nowrap}',
'#r3d-overlay #r3d-loading{position:absolute;inset:0;background:#06060f;display:flex;align-items:center;justify-content:center;z-index:200}',
'#r3d-overlay #r3d-loading.gone{display:none}',
'#r3d-overlay .ld-inner{text-align:center}',
'#r3d-overlay .ld-ring{width:40px;height:40px;margin:0 auto 16px;border:2px solid rgba(212,168,74,.12);border-top-color:#d4a84a;border-radius:50%;animation:r3d-spin .75s linear infinite}',
'@keyframes r3d-spin{to{transform:rotate(360deg)}}',
'#r3d-overlay .ld-msg{font:13px Georgia,serif;color:#888;margin-bottom:6px}',
'#r3d-overlay .ld-err{color:#c88;margin-top:12px;font:12px/1.6 Georgia,serif;max-width:380px;text-align:left;padding:12px;border:1px solid rgba(200,100,100,.2);background:rgba(200,100,100,.04)}',
'#r3d-overlay #r3d-tools-bar{position:absolute;top:14px;right:54px;display:flex;gap:8px;align-items:flex-start;pointer-events:auto;z-index:10}',
'#r3d-overlay .tool-btn{padding:4px 11px;background:rgba(6,6,15,.88);border:1px solid rgba(212,168,74,.28);border-radius:1px;color:#d4a84a;font:11px Georgia,serif;cursor:pointer;transition:background .15s;white-space:nowrap}',
'#r3d-overlay .tool-btn:hover{background:rgba(212,168,74,.12)}',
'#r3d-overlay .tool-btn.active{background:rgba(212,168,74,.18);border-color:rgba(212,168,74,.55)}',
'#r3d-overlay #r3d-search-wrap{position:relative}',
'#r3d-overlay #r3d-search-input{display:block;width:210px;margin-top:4px;padding:5px 10px;background:rgba(6,6,15,.97);border:1px solid rgba(212,168,74,.35);border-radius:1px;color:#f5f0e8;font:12px Georgia,serif;outline:none}',
'#r3d-overlay #r3d-search-input::placeholder{color:rgba(245,240,232,.30)}',
'#r3d-overlay #r3d-search-results{position:absolute;top:100%;left:0;width:100%;background:rgba(6,6,15,.98);border:1px solid rgba(212,168,74,.22);border-top:none;max-height:260px;overflow-y:auto;z-index:20}',
'#r3d-overlay .sr-item{padding:7px 10px;cursor:pointer;font:11px/1.3 Georgia,serif;color:rgba(245,240,232,.78);border-bottom:1px solid rgba(255,255,255,.04)}',
'#r3d-overlay .sr-item:hover{background:rgba(212,168,74,.10);color:#fff}',
'#r3d-overlay .sr-type{font-size:10px;color:#888;margin-left:6px}',
'#r3d-overlay #r3d-path-wrap{position:relative}',
'#r3d-overlay #r3d-path-panel{position:absolute;top:calc(100% + 4px);right:0;width:264px;background:rgba(6,6,15,.96);border:1px solid rgba(212,168,74,.22);border-radius:2px;padding:14px 14px 12px;z-index:20}',
'#r3d-overlay .pp-hd{font:9px/1 Georgia,serif;letter-spacing:.14em;text-transform:uppercase;color:rgba(212,168,74,.55);margin-bottom:12px}',
'#r3d-overlay .pp-lbl{font:10px/1 Georgia,serif;color:#888;margin-bottom:4px}',
'#r3d-overlay .pp-iw{position:relative;margin-bottom:8px}',
'#r3d-overlay .pp-inp{width:100%;padding:5px 8px;background:rgba(255,255,255,.05);border:1px solid rgba(212,168,74,.22);border-radius:1px;color:#f5f0e8;font:11px Georgia,serif;outline:none}',
'#r3d-overlay .pp-ac{position:absolute;top:100%;left:0;width:100%;background:rgba(6,6,15,.98);border:1px solid rgba(212,168,74,.18);border-top:none;max-height:130px;overflow-y:auto;z-index:30;display:none}',
'#r3d-overlay #r3d-path-find-btn{width:100%;padding:6px 0;margin-top:2px;background:transparent;border:1px solid rgba(212,168,74,.30);border-radius:1px;color:#d4a84a;font:11px Georgia,serif;cursor:pointer;transition:background .15s}',
'#r3d-overlay #r3d-path-find-btn:hover{background:rgba(212,168,74,.10)}',
'#r3d-overlay #r3d-path-result{margin-top:10px;font:11px/1.8 Georgia,serif;color:rgba(245,240,232,.72);max-height:190px;overflow-y:auto}',
'#r3d-overlay .ps-row{display:flex;align-items:baseline;gap:6px;margin-bottom:1px}',
'#r3d-overlay .ps-num{color:#666;font-size:10px;flex-shrink:0;width:14px;text-align:right}',
'#r3d-overlay .ps-name{color:#e8c878;cursor:pointer}',
'#r3d-overlay .ps-name:hover{text-decoration:underline}',
'#r3d-overlay .ps-rel{font-size:10px;color:rgba(212,168,74,.50);font-style:italic;flex-shrink:0}',
'#r3d-overlay .ps-arrow{color:#444;font-size:10px;flex-shrink:0}',
'#r3d-overlay #r3d-path-walk-btn{display:block;width:100%;padding:6px 0;margin-top:8px;background:rgba(212,168,74,.08);border:1px solid rgba(212,168,74,.25);border-radius:1px;color:#d4a84a;font:11px Georgia,serif;cursor:pointer;transition:background .15s}',
'#r3d-overlay #r3d-path-walk-btn:hover{background:rgba(212,168,74,.14)}',
'#r3d-overlay .hidden{display:none!important}',
'#r3d-close{position:absolute;top:14px;right:14px;z-index:1300;width:32px;height:32px;background:rgba(6,6,15,.88);border:1px solid rgba(212,168,74,.30);border-radius:1px;color:#d4a84a;font:16px/32px Georgia,serif;cursor:pointer;text-align:center;transition:background .15s}',
'#r3d-close:hover{background:rgba(212,168,74,.15)}'
].join('\n');

/* ── Overlay HTML template ───────────────────────────────────────── */
var R3D_HTML=''
+'<canvas id="r3d-canvas"></canvas>'
+'<div id="r3d-inner-overlay"><div id="r3d-tick-layer"></div><div id="r3d-label-layer"></div></div>'
+'<div id="r3d-legend">'
+'<div class="leg-hd">Relations</div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#d4a84a"></span><span class="leg-lbl">Prophet</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#2fa6a0"></span><span class="leg-lbl">Teachers</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#5a9bd4"></span><span class="leg-lbl">Parents</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#b06cc4"></span><span class="leg-lbl">Spouses</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#9a7ad9"></span><span class="leg-lbl">Siblings</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#6fa86f"></span><span class="leg-lbl">Family</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#c9a227"></span><span class="leg-lbl">Companions</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#d97a3a"></span><span class="leg-lbl">Students</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#c87a9a"></span><span class="leg-lbl">Narrators</span></div>'
+'<div class="leg-row"><span class="leg-dot" style="background:#b83030"></span><span class="leg-lbl">Adversaries</span></div>'
+'</div>'
+'<div id="r3d-nav-bar"><div id="r3d-breadcrumb"></div><button id="r3d-back-btn" class="hidden">\u2190 Back</button></div>'
+'<div id="r3d-mode-badge">GROUP VIEW</div>'
+'<div id="r3d-info-panel" class="hidden">'
+'<span class="ip-close" id="r3d-ip-close">\u2715</span>'
+'<div class="ip-name" id="r3d-ip-name"></div>'
+'<div class="ip-years" id="r3d-ip-years"></div>'
+'<div class="ip-title" id="r3d-ip-title"></div>'
+'<div class="ip-rel" id="r3d-ip-rel"></div>'
+'<button class="ip-drill" id="r3d-ip-drill">Explore this person \u2192</button>'
+'</div>'
+'<div id="r3d-tools-bar">'
+'<div id="r3d-search-wrap">'
+'<button class="tool-btn" id="r3d-search-btn">\u2315 Search</button>'
+'<input id="r3d-search-input" type="text" placeholder="Search any figure\u2026" autocomplete="off" spellcheck="false" style="display:none">'
+'<div id="r3d-search-results" style="display:none"></div>'
+'</div>'
+'<div id="r3d-path-wrap">'
+'<button class="tool-btn" id="r3d-path-btn">Path \u27f2</button>'
+'<div id="r3d-path-panel" style="display:none">'
+'<div class="pp-hd">Find Connection</div>'
+'<div class="pp-lbl">From</div>'
+'<div class="pp-iw"><input class="pp-inp" id="r3d-path-from" type="text" autocomplete="off" placeholder="Current figure"><div class="pp-ac" id="r3d-path-from-ac"></div></div>'
+'<div class="pp-lbl">To</div>'
+'<div class="pp-iw"><input class="pp-inp" id="r3d-path-to" type="text" autocomplete="off" placeholder="Search target\u2026"><div class="pp-ac" id="r3d-path-to-ac"></div></div>'
+'<button id="r3d-path-find-btn">Find shortest path</button>'
+'<div id="r3d-path-result"></div>'
+'<button id="r3d-path-walk-btn" style="display:none">Walk path \u2192</button>'
+'</div>'
+'</div>'
+'</div>'
+'<div id="r3d-hint">colour bands = relation groups \u00b7 click to explore \u00b7 drag to spin \u00b7 scroll to zoom</div>'
+'<div id="r3d-count-badge"></div>'
+'<div id="r3d-loading"><div class="ld-inner"><div class="ld-ring"></div><div class="ld-msg" id="r3d-ld-msg">Initialising\u2026</div><div class="ld-err" id="r3d-ld-err" style="display:none"></div></div></div>'
+'<button id="r3d-close" title="Close 3D view">\u2715</button>';

/* ── Data logic ──────────────────────────────────────────────────── */
function _norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''); }

function buildResolver(){
  if(NAME2SLUG) return;
  NAME2SLUG={}; CORE_BY_SLUG={};
  for(var i=0;i<CORE.length;i++){
    var c=CORE[i]; if(!c||!c.slug) continue;
    CORE_BY_SLUG[c.slug]=c;
    var kf=_norm(c.famous||''); if(kf) NAME2SLUG[kf]=c.slug;
    var kn=_norm(c.full||'');   if(kn&&!NAME2SLUG[kn]) NAME2SLUG[kn]=c.slug;
  }
}
function resolveName(n){ buildResolver(); return NAME2SLUG[_norm(n)]||null; }
function getEnrich(s){ return ENRICH_BY_SLUG[s]||null; }

function buildReverseTeachers(){
  if(STUDENTS_OF) return; buildResolver(); STUDENTS_OF={};
  for(var i=0;i<CORE.length;i++){
    var c=CORE[i]; if(!c||!c.slug) continue;
    if(c.dob!=null&&c.dod!=null){var ls=c.dod-c.dob;if(ls>0&&ls<13)continue;}
    var tn=[];
    if(Array.isArray(c.teachers)) tn=tn.concat(c.teachers);
    var ce=getEnrich(c.slug); if(ce&&Array.isArray(ce.teachers)) tn=tn.concat(ce.teachers);
    var seen={};
    for(var t=0;t<tn.length;t++){
      var tt=tn[t]; if(typeof tt==='object') tt=tt.name||tt.english_name||'';
      tt=String(tt||'').trim(); if(!tt) continue;
      var ts=resolveName(tt); if(!ts||ts===c.slug||seen[ts]) continue;
      seen[ts]=1; (STUDENTS_OF[ts]||(STUDENTS_OF[ts]=[])).push(c);
    }
  }
}

var CONN_COLOR={parent:'#5a9bd4',teacher:'#2fa6a0',student:'#d97a3a',companion:'#c9a227',family:'#6fa86f',sibling:'#9a7ad9',wife:'#b06cc4',narration:'#c87a9a',adversary:'#b83030'};
var KIND_LABELS={teacher:'Teachers',parent:'Parents',wife:'Spouses',sibling:'Siblings',family:'Family',companion:'Companions',student:'Students',narration:'Narrators',adversary:'Adversaries'};
var KIND_ORDER=['teacher','parent','wife','sibling','family','companion','student','narration','adversary'];
var ALWAYS_EXPAND={wife:1,sibling:1};
var PARENT_RELS={father:1,mother:1,parent:1,'foster mother':1,'foster father':1,'milk mother':1,'wet nurse':1};
var SIBLING_RELS={brother:1,sister:1,sibling:1,'half-brother':1,'half-sister':1};
var WIFE_RELS={wife:1,husband:1,spouse:1};

function bucketRel(rel){
  var r=(rel||'').toLowerCase().trim();
  if(PARENT_RELS[r]) return 'parent';
  if(SIBLING_RELS[r]) return 'sibling';
  if(WIFE_RELS[r]) return 'wife';
  if(r==='companion') return 'companion';
  if(r==='student'||r==='silsila after'||r==='has follower') return 'student';
  if(r==='teacher'||r==='silsila before'||r==='follower of') return 'teacher';
  if(r==='narration'||r==='narrator') return 'narration';
  if(r==='adversary') return 'adversary';
  return 'family';
}

function getRelations(focusSlug){
  var f=CORE_BY_SLUG[focusSlug]; if(!f) return [];
  buildReverseTeachers();
  var out=[],seen={};
  function push(fig,kind,relWord){
    if(!fig||!fig.slug||fig.slug===focusSlug||seen[fig.slug]) return;
    seen[fig.slug]=1; out.push({fig:fig,kind:kind,relWord:relWord||kind});
  }
  var tn=[]; if(Array.isArray(f.teachers)) tn=tn.concat(f.teachers);
  var enr=getEnrich(focusSlug); if(enr&&Array.isArray(enr.teachers)) tn=tn.concat(enr.teachers);
  for(var i=0;i<tn.length;i++){
    var t=tn[i]; if(typeof t==='object') t=t.name||t.english_name||'';
    t=String(t||'').trim(); if(!t) continue;
    var sl=resolveName(t); if(!sl||!CORE_BY_SLUG[sl]) continue;
    push(CORE_BY_SLUG[sl],'teacher','teacher');
  }
  var studs=STUDENTS_OF[focusSlug]||[];
  for(var j=0;j<studs.length;j++) push(studs[j],'student','student');
  if(Array.isArray(f.relations)){
    for(var k=0;k<f.relations.length;k++){
      var r=f.relations[k]; if(!r||!r.person) continue;
      var sl2=resolveName(r.person); if(!sl2||!CORE_BY_SLUG[sl2]) continue;
      push(CORE_BY_SLUG[sl2],bucketRel(r.relation),r.relation);
    }
  }
  if(enr){
    if(enr.parents){
      var ps=typeof enr.parents==='string'?enr.parents.split('/'):(Array.isArray(enr.parents)?enr.parents:[]);
      for(var p=0;p<ps.length;p++){
        var pn=(typeof ps[p]==='string'?ps[p]:((ps[p]&&(ps[p].name||ps[p].english_name))||'')).trim();
        if(!pn) continue;
        var sl3=resolveName(pn); if(!sl3||!CORE_BY_SLUG[sl3]) continue;
        push(CORE_BY_SLUG[sl3],'parent','parent');
      }
    }
    if(Array.isArray(enr.family)){
      for(var m=0;m<enr.family.length;m++){
        var fn=typeof enr.family[m]==='string'?enr.family[m]:((enr.family[m]&&(enr.family[m].name||enr.family[m].english_name))||'');
        fn=(fn||'').trim(); if(!fn) continue;
        var sl4=resolveName(fn); if(!sl4||!CORE_BY_SLUG[sl4]) continue;
        push(CORE_BY_SLUG[sl4],'family','family');
      }
    }
  }
  return out;
}

/* ── Adjacency + path finder ────────────────────────────────────── */
function _buildAdj(){
  if(_ADJ) return;
  buildResolver(); buildReverseTeachers();
  _ADJ={};
  function addE(a,b,lbl){
    if(!a||!b||a===b||!CORE_BY_SLUG[a]||!CORE_BY_SLUG[b]) return;
    (_ADJ[a]||(_ADJ[a]=[])).push({s:b,l:lbl});
  }
  for(var i=0;i<CORE.length;i++){
    var c=CORE[i]; if(!c||!c.slug) continue;
    var tn=[];
    if(Array.isArray(c.teachers)) tn=tn.concat(c.teachers);
    var enr=getEnrich(c.slug); if(enr&&Array.isArray(enr.teachers)) tn=tn.concat(enr.teachers);
    for(var t=0;t<tn.length;t++){
      var tt=tn[t]; if(typeof tt==='object') tt=tt.name||tt.english_name||'';
      tt=String(tt||'').trim(); if(!tt) continue;
      var ts=resolveName(tt); if(!ts||ts===c.slug) continue;
      addE(c.slug,ts,'student of'); addE(ts,c.slug,'teacher of');
    }
    if(Array.isArray(c.relations)){
      for(var r=0;r<c.relations.length;r++){
        var rel=c.relations[r]; if(!rel||!rel.person) continue;
        var rs=resolveName(rel.person); if(!rs||rs===c.slug) continue;
        addE(c.slug,rs,rel.relation||'related');
      }
    }
  }
  for(var tslug in STUDENTS_OF){
    if(!STUDENTS_OF.hasOwnProperty(tslug)) continue;
    var stds=STUDENTS_OF[tslug];
    for(var j=0;j<stds.length;j++){
      var st=stds[j]; if(!st||!st.slug) continue;
      addE(st.slug,tslug,'student of'); addE(tslug,st.slug,'teacher of');
    }
  }
}

function findPath(fromSlug,toSlug){
  if(!fromSlug||!toSlug) return null;
  if(fromSlug===toSlug) return [{slug:fromSlug,label:''}];
  _buildAdj();
  var visited={},prev={},queue=[fromSlug];
  visited[fromSlug]=true;
  while(queue.length){
    var curr=queue.shift();
    var nbrs=_ADJ[curr]||[];
    for(var i=0;i<nbrs.length;i++){
      var nb=nbrs[i]; if(visited[nb.s]) continue;
      visited[nb.s]=true; prev[nb.s]={from:curr,label:nb.l};
      if(nb.s===toSlug){
        var path=[],s=toSlug;
        while(s!==fromSlug){var pv=prev[s];path.unshift({slug:s,label:pv.label});s=pv.from;}
        path.unshift({slug:fromSlug,label:''});
        return path;
      }
      queue.push(nb.s);
    }
  }
  return null;
}

function _searchFigs(query,maxN){
  if(!query||query.length<2) return [];
  var q=query.toLowerCase(),out=[];
  for(var i=0;i<CORE.length&&out.length<maxN;i++){
    var f=CORE[i]; if(!f||!f.slug) continue;
    if((f.famous||f.full||'').toLowerCase().indexOf(q)!==-1) out.push(f);
  }
  return out;
}

function flyToSphere(mesh){
  if(!mesh||!mesh.position) return;
  _autoRot=false;
  if(_autoRotTimer){clearTimeout(_autoRotTimer);_autoRotTimer=null;}
  var sx=mesh.position.x,sz=mesh.position.z;
  var sphereAngle=Math.atan2(sz,sx);
  var targetRy=-sphereAngle;
  var curr=sceneGroup.rotation.y;
  var diff=targetRy-curr;
  while(diff>Math.PI) diff-=Math.PI*2;
  while(diff<-Math.PI) diff+=Math.PI*2;
  _flyRyTarget=curr+diff; _camTargetY=mesh.position.y; _flyMesh=mesh;
}

/* ── Three.js constants ─────────────────────────────────────────── */
var SPINE_R=0.055,BOW_R=3.0,TUBE_R=0.014,SPH_R=0.13,SPH_FOCUS_R=0.09,SPH_GROUP_R=0.28,GOLD=0xd4a84a;
var YSCALE_GROUP=-0.04,YSCALE_DETAIL=-0.16,AUTO_EXPAND_THRESHOLD=5;

function _isProphet(fig){
  if(!fig) return false;
  var tags=Array.isArray(fig.tags)?fig.tags:[];
  var t=(fig.type||'').toLowerCase();
  return t==='prophet'||tags.indexOf('prophet')!==-1||tags.indexOf('Prophet')!==-1;
}
function _figColor(fig,kind){ return _isProphet(fig)?new THREE.Color(GOLD):new THREE.Color(CONN_COLOR[kind]||'#888888'); }
function _focusSpineColor(fig){ return _isProphet(fig)?GOLD:0xb0c0d4; }
function _yearStr(y){ return y<0?Math.abs(y)+' BCE':y+' CE'; }
function _esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _cap(s){ return s?s[0].toUpperCase()+s.slice(1):s; }
function _hexToRgb(h){ var r=parseInt(h.slice(1,3),16),g=parseInt(h.slice(3,5),16),b=parseInt(h.slice(5,7),16); return r+','+g+','+b; }

/* ── Three.js init ──────────────────────────────────────────────── */
function initThree(){
  renderer=new THREE.WebGLRenderer({canvas:_id('canvas'),antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.setSize(window.innerWidth,window.innerHeight);
  renderer.setClearColor(0x06060f,1);
  scene=new THREE.Scene();
  scene.fog=new THREE.FogExp2(0x06060f,0.006);
  camera=new THREE.PerspectiveCamera(50,window.innerWidth/window.innerHeight,0.1,500);
  camera.position.set(0,0,17); camera.lookAt(0,0,0);
  scene.add(new THREE.AmbientLight(0xffffff,0.38));
  var kl=new THREE.PointLight(0xf0d888,1.5,100); kl.position.set(2,5,16); scene.add(kl);
  var fl=new THREE.PointLight(0x304898,0.48,80);  fl.position.set(-14,-10,-6); scene.add(fl);
  var rl=new THREE.PointLight(0x883020,0.20,60);  rl.position.set(8,-5,-14); scene.add(rl);
  sceneGroup=new THREE.Group(); scene.add(sceneGroup);
  _resizeHandler=function(){
    camera.aspect=window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth,window.innerHeight);
  };
  window.addEventListener('resize',_resizeHandler);
}

/* ── Scene builders ─────────────────────────────────────────────── */
function _clearScene(){
  while(sceneGroup.children.length) sceneGroup.remove(sceneGroup.children[0]);
  clickTargets=[]; _labels=[]; _ticks=[];
  _id('label-layer').innerHTML='';
  _id('tick-layer').innerHTML='';
}

function _buildSegmentedSpine(fig,focusDob,YSCALE,yMin,yMax){
  var DIM_COL=0x30304a,DIM_OP=0.55,lifeCol=_focusSpineColor(fig);
  var spineBot=yMin-4.5,spineTop=yMax+4.5;
  _camTargetY=(spineBot+spineTop)*0.5;
  var dobY=fig.dob!=null?(fig.dob-focusDob)*YSCALE:null;
  var dodY=fig.dod!=null?(fig.dod-focusDob)*YSCALE:null;
  if(dobY==null&&dodY==null){_addSpineSeg(spineBot,spineTop,0x666680,0.50);return;}
  var lifeTop=dobY!=null?dobY:spineTop,lifeBot=dodY!=null?dodY:spineBot;
  if(lifeTop<lifeBot){var _t=lifeTop;lifeTop=lifeBot;lifeBot=_t;}
  if(lifeTop<spineTop-0.05) _addSpineSeg(lifeTop,spineTop,DIM_COL,DIM_OP);
  if(lifeTop-lifeBot>0.02){_addSpineSeg(lifeBot,lifeTop,lifeCol,1.0);}
  else{_addSpineSeg(lifeTop-0.08,lifeTop+0.08,lifeCol,1.0);}
  if(lifeBot>spineBot+0.05) _addSpineSeg(spineBot,lifeBot,DIM_COL,DIM_OP);
  if(dobY!=null) _addSpineDisc(dobY,lifeCol);
  if(dodY!=null) _addSpineDisc(dodY,lifeCol);
}
function _addSpineSeg(yBot,yTop,color,opacity){
  var h=yTop-yBot; if(h<0.02) return;
  var geo=new THREE.CylinderGeometry(SPINE_R,SPINE_R,h,10,1);
  var mat=new THREE.MeshStandardMaterial({color:color,metalness:.80,roughness:.22,transparent:opacity<0.99,opacity:opacity,emissive:color,emissiveIntensity:opacity*0.12});
  var m=new THREE.Mesh(geo,mat); m.position.y=(yBot+yTop)*0.5; sceneGroup.add(m);
}
function _addSpineDisc(y,color){
  var geo=new THREE.CylinderGeometry(SPINE_R*4,SPINE_R*4,0.035,16,1);
  var mat=new THREE.MeshStandardMaterial({color:color,metalness:.92,roughness:.08,emissive:color,emissiveIntensity:.60});
  var m=new THREE.Mesh(geo,mat); m.position.y=y; sceneGroup.add(m);
}
function _buildFocusLabel(fig){ _addLabel(fig.famous||fig.slug,0,SPH_FOCUS_R+0.10,0,'focus-lbl'); }
function _buildTicks(yMin,yMax,YSCALE,focusDob){
  var ce1=focusDob+yMin/YSCALE,ce2=focusDob+yMax/YSCALE;
  var ceMin=Math.min(ce1,ce2)-30,ceMax=Math.max(ce1,ce2)+30;
  var step=Math.abs(YSCALE)>=0.12?25:50,start=Math.ceil(ceMin/step)*step;
  for(var ce=start;ce<=ceMax;ce+=step){
    var ty=(ce-focusDob)*YSCALE;
    if(ty<yMin-2.5||ty>yMax+3.5) continue;
    var hijri=Math.round(ce-622);
    var el=document.createElement('div'); el.className='tick-label';
    el.innerHTML='<span class="tick-ce">'+_esc(ce<0?Math.abs(ce)+' BCE':ce+' CE')+'</span><br>'
      +'<span class="tick-ah">'+_esc(hijri<0?Math.abs(hijri)+' BH':hijri+' AH')+'</span>';
    _id('tick-layer').appendChild(el);
    _ticks.push({el:el,wy:ty});
  }
}
function _buildTubeLeg(spineY,apexY,ca,sa,col,opacity){
  var midR=SPINE_R+(BOW_R-SPINE_R)*0.50,midY=spineY+(apexY-spineY)*0.55;
  var pts=[new THREE.Vector3(SPINE_R*ca,spineY,SPINE_R*sa),new THREE.Vector3(midR*ca,midY,midR*sa),new THREE.Vector3(BOW_R*ca,apexY,BOW_R*sa)];
  var curve=new THREE.CatmullRomCurve3(pts,false,'catmullrom',0.50);
  var geo=new THREE.TubeGeometry(curve,16,TUBE_R,5,false);
  var mat=new THREE.MeshStandardMaterial({color:col,transparent:true,opacity:opacity||0.72,metalness:.08,roughness:.72});
  sceneGroup.add(new THREE.Mesh(geo,mat));
}

/* ── Group view ─────────────────────────────────────────────────── */
function buildGroupView(slug){
  viewMode='group'; detailKind=null; _clearScene();
  var fig=CORE_BY_SLUG[slug];
  if(!fig){_showErr('Unknown slug: '+slug);return;}
  currentFocusSlug=slug; currentFocusFig=fig;
  var YSCALE=YSCALE_GROUP,focusDob=(fig.dob!=null)?fig.dob:570;
  var rels=getRelations(slug),groups={};
  for(var i=0;i<rels.length;i++){(groups[rels[i].kind]||(groups[rels[i].kind]=[])).push(rels[i]);}
  var yMin=0,yMax=0;
  for(var i=0;i<rels.length;i++){
    var rf=rels[i].fig;
    var dobY=rf.dob!=null?(rf.dob-focusDob)*YSCALE:null;
    var dodY=rf.dod!=null?(rf.dod-focusDob)*YSCALE:null;
    if(dobY!=null){if(dobY<yMin)yMin=dobY;if(dobY>yMax)yMax=dobY;}
    if(dodY!=null){if(dodY<yMin)yMin=dodY;if(dodY>yMax)yMax=dodY;}
  }
  if(fig.dob!=null){var fy0=0;if(fy0<yMin)yMin=fy0;if(fy0>yMax)yMax=fy0;}
  if(fig.dod!=null){var fy1=(fig.dod-focusDob)*YSCALE;if(fy1<yMin)yMin=fy1;if(fy1>yMax)yMax=fy1;}
  if(yMin===yMax){yMin-=2;yMax+=2;}
  _buildSegmentedSpine(fig,focusDob,YSCALE,yMin,yMax);
  _buildFocusLabel(fig);
  _buildTicks(yMin,yMax,YSCALE,focusDob);
  var presentKinds=KIND_ORDER.filter(function(k){return groups[k]&&groups[k].length;});
  var nK=presentKinds.length,totalRels=rels.length;
  for(var ki=0;ki<nK;ki++){
    var kind=presentKinds[ki],krels=groups[kind];
    var angle=(ki/nK)*Math.PI*2+(Math.PI*0.08);
    var col=new THREE.Color(CONN_COLOR[kind]||'#888');
    if(krels.length<=AUTO_EXPAND_THRESHOLD||ALWAYS_EXPAND[kind]){
      for(var gi=0;gi<krels.length;gi++){
        var subAngle=angle+(gi-(krels.length-1)*0.5)*0.28;
        _buildIndivWishbone(subAngle,krels[gi].fig,focusDob,YSCALE,_figColor(krels[gi].fig,kind),kind,krels[gi].relWord,true);
      }
    } else {
      _buildGroupWishbone(angle,kind,krels,focusDob,YSCALE,col,slug);
    }
  }
  _id('mode-badge').textContent='GROUP VIEW';
  _id('mode-badge').style.color='rgba(212,168,74,.40)';
  _id('hint').textContent='colour bands = relation groups \u00b7 click large band to explore \u00b7 click small sphere for info';
  _id('count-badge').textContent=totalRels+' relations \u00b7 '+nK+' groups \u00b7 '+_esc(fig.famous||slug);
  updateNavUI();
}

function _buildGroupWishbone(angle,kind,krels,focusDob,YSCALE,col,focusSlug){
  var ca=Math.cos(angle),sa=Math.sin(angle),count=krels.length;
  var allY=[];
  for(var i=0;i<krels.length;i++){var rf=krels[i].fig;if(rf.dob!=null)allY.push((rf.dob-focusDob)*YSCALE);if(rf.dod!=null)allY.push((rf.dod-focusDob)*YSCALE);}
  if(!allY.length) allY=[0];
  var kyMin=Math.min.apply(null,allY),kyMax=Math.max.apply(null,allY),kyMed=(kyMin+kyMax)*0.5;
  var sGeo=new THREE.SphereGeometry(SPH_GROUP_R,12,10);
  var sMat=new THREE.MeshStandardMaterial({color:col,metalness:.28,roughness:.42,emissive:col,emissiveIntensity:.50});
  var sMesh=new THREE.Mesh(sGeo,sMat);
  sMesh.position.set(BOW_R*ca,kyMed,BOW_R*sa);
  sMesh.userData={type:'group',slug:focusSlug,kind:kind,count:count};
  sceneGroup.add(sMesh); clickTargets.push(sMesh);
  var tubeR=Math.min(0.22,Math.max(0.08,0.06+count*0.0010));
  _buildGroupTube(angle,kyMin,kyMax,col,tubeR,focusSlug,kind,count);
  _buildTubeLeg(kyMax,kyMed,ca,sa,col,0.78);
  if(Math.abs(kyMax-kyMin)>0.20) _buildTubeLeg(kyMin,kyMed,ca,sa,col,0.78);
  _addLabel((KIND_LABELS[kind]||kind)+' \u00b7 '+count,BOW_R*ca,kyMed,BOW_R*sa,'group-lbl');
}
function _buildGroupTube(angle,kyMin,kyMax,col,tubeR,focusSlug,kind,count){
  var ca=Math.cos(angle),sa=Math.sin(angle);
  var h=Math.max(0.30,kyMax-kyMin),kMid=(kyMin+kyMax)*0.5;
  var geo=new THREE.CylinderGeometry(tubeR,tubeR,h,8,1);
  var mat=new THREE.MeshStandardMaterial({color:col,metalness:.12,roughness:.65,emissive:col,emissiveIntensity:.18,transparent:true,opacity:.70});
  var m=new THREE.Mesh(geo,mat);
  m.position.set(BOW_R*ca,kMid,BOW_R*sa);
  m.userData={type:'group',slug:focusSlug,kind:kind,count:count};
  sceneGroup.add(m); clickTargets.push(m);
}

/* ── Individual wishbone ────────────────────────────────────────── */
function _buildIndivWishbone(angle,fig,focusDob,YSCALE,col,kind,relWord,showLabel){
  var ca=Math.cos(angle),sa=Math.sin(angle);
  var dobY=fig.dob!=null?(fig.dob-focusDob)*YSCALE:null;
  var dodY=fig.dod!=null?(fig.dod-focusDob)*YSCALE:null;
  var sphereY;
  if(dobY!=null&&dodY!=null) sphereY=(dobY+dodY)*0.5;
  else if(dobY!=null)         sphereY=dobY;
  else if(dodY!=null)         sphereY=dodY-20*YSCALE;
  else                        sphereY=0;
  var geo=new THREE.SphereGeometry(SPH_R,9,7);
  var mat=new THREE.MeshStandardMaterial({color:col,metalness:.22,roughness:.50,emissive:col,emissiveIntensity:.32});
  var mesh=new THREE.Mesh(geo,mat);
  mesh.position.set(BOW_R*ca,sphereY,BOW_R*sa);
  mesh.userData={type:'person',fig:fig,kind:kind,relWord:relWord};
  sceneGroup.add(mesh); clickTargets.push(mesh);
  if(dobY!=null) _buildTubeLeg(dobY,sphereY,ca,sa,col,0.70);
  if(dodY!=null&&(dobY==null||Math.abs(dodY-dobY)>0.05)) _buildTubeLeg(dodY,sphereY,ca,sa,col,0.55);
  if(showLabel) _addLabel(fig.famous||fig.slug,BOW_R*ca,sphereY,BOW_R*sa,'');
}

/* ── Detail view ────────────────────────────────────────────────── */
function buildDetailView(slug,kind){
  viewMode='detail'; detailKind=kind; _clearScene();
  var fig=CORE_BY_SLUG[slug]; if(!fig) return;
  currentFocusSlug=slug; currentFocusFig=fig;
  var YSCALE=YSCALE_DETAIL,focusDob=(fig.dob!=null)?fig.dob:570;
  var allRels=getRelations(slug);
  var rels=allRels.filter(function(r){return r.kind===kind;});
  var total=rels.length,MAX_R=280;
  if(total>MAX_R) rels=rels.slice(0,MAX_R);
  var n=rels.length;
  rels.sort(function(a,b){
    var da=a.fig.dob!=null?a.fig.dob:(a.fig.dod!=null?a.fig.dod-50:focusDob);
    var db=b.fig.dob!=null?b.fig.dob:(b.fig.dod!=null?b.fig.dod-50:focusDob);
    return da-db;
  });
  var yMin=0,yMax=0;
  for(var i=0;i<n;i++){
    var rf=rels[i].fig;
    var dy=rf.dob!=null?(rf.dob-focusDob)*YSCALE:null;
    var dd=rf.dod!=null?(rf.dod-focusDob)*YSCALE:null;
    if(dy!=null){if(dy<yMin)yMin=dy;if(dy>yMax)yMax=dy;}
    if(dd!=null){if(dd<yMin)yMin=dd;if(dd>yMax)yMax=dd;}
  }
  if(fig.dob!=null){var fy0=0;if(fy0<yMin)yMin=fy0;if(fy0>yMax)yMax=fy0;}
  if(fig.dod!=null){var fy1=(fig.dod-focusDob)*YSCALE;if(fy1<yMin)yMin=fy1;if(fy1>yMax)yMax=fy1;}
  if(yMin===yMax){yMin-=3;yMax+=3;}
  _buildSegmentedSpine(fig,focusDob,YSCALE,yMin,yMax);
  _buildFocusLabel(fig);
  _buildTicks(yMin,yMax,YSCALE,focusDob);
  var SPREAD=Math.PI*1.45,MAX_LBL=55;
  for(var i=0;i<n;i++){
    var rel=rels[i],angle=n>1?-SPREAD*.5+(i/(n-1))*SPREAD:0;
    _buildIndivWishbone(angle,rel.fig,focusDob,YSCALE,_figColor(rel.fig,kind),kind,rel.relWord,i<MAX_LBL);
  }
  var kc=CONN_COLOR[kind]||'#888';
  _id('mode-badge').textContent='\u21b3 '+(KIND_LABELS[kind]||kind).toUpperCase();
  _id('mode-badge').style.color=kc;
  _id('hint').textContent='each sphere: two legs = born & died on the timeline \u00b7 click for info';
  _id('count-badge').textContent=(total>MAX_R?MAX_R+' of '+total:n)+' '+(KIND_LABELS[kind]||kind).toLowerCase()+' \u00b7 '+_esc(fig.famous||slug);
  updateNavUI();
}

/* ── Labels + overlay projection ────────────────────────────────── */
function _addLabel(text,wx,wy,wz,cls){
  var el=document.createElement('div');
  el.className='p-label'+(cls?' '+cls:'');
  el.textContent=text;
  _id('label-layer').appendChild(el);
  _labels.push({el:el,wx:wx,wy:wy,wz:wz,cls:cls});
}
function _project(wx,wy,wz){
  var v=new THREE.Vector3(wx,wy,wz);
  v.applyEuler(sceneGroup.rotation); v.project(camera);
  return{sx:(v.x+1)*.5*window.innerWidth,sy:(-v.y+1)*.5*window.innerHeight,nz:v.z};
}
function updateOverlay(){
  var ry=sceneGroup.rotation.y;
  for(var i=0;i<_labels.length;i++){
    var lb=_labels[i],p=_project(lb.wx,lb.wy,lb.wz);
    if(p.nz>=1){lb.el.style.opacity='0';continue;}
    var f;
    if(lb.cls==='focus-lbl'||lb.cls==='group-lbl') f=1.0;
    else{var wz2=lb.wx*Math.sin(ry)+lb.wz*Math.cos(ry);f=Math.max(0.08,0.18+0.82*((wz2+BOW_R)/(BOW_R*2)));}
    lb.el.style.opacity=f.toFixed(2);
    lb.el.style.left=p.sx+'px';
    lb.el.style.top=p.sy+'px';
  }
  for(var j=0;j<_ticks.length;j++){
    var tk=_ticks[j],p2=_project(0,tk.wy,0);
    if(p2.nz>=1){tk.el.style.opacity='0';continue;}
    tk.el.style.opacity='1';
    tk.el.style.top=(p2.sy-10)+'px';
    tk.el.style.left=(p2.sx-108)+'px';
  }
}

/* ── Info panel ─────────────────────────────────────────────────── */
function _showInfo(fig,kind,relWord){
  _id('ip-name').textContent=fig.famous||fig.slug||'?';
  var ys='';
  if(fig.dob!=null) ys+='b. '+_yearStr(fig.dob);
  if(fig.dod!=null) ys+=(ys?'  \u00b7  ':'')+'d. '+_yearStr(fig.dod);
  _id('ip-years').textContent=ys||'Dates unknown';
  _id('ip-title').textContent=fig.primaryTitle||'';
  var relEl=_id('ip-rel');
  if(relWord&&currentFocusFig){
    relEl.textContent=_cap(relWord)+' of '+(currentFocusFig.famous||currentFocusSlug);
    relEl.style.borderLeftColor=CONN_COLOR[kind]||'#888';
    relEl.style.background='rgba('+_hexToRgb(CONN_COLOR[kind]||'#888888')+',0.06)';
    relEl.style.display='block';
  } else { relEl.style.display='none'; }
  _id('ip-drill').onclick=function(){_drillInto(fig.slug);};
  _id('info-panel').classList.remove('hidden');
}
function _drillInto(slug){
  if(!CORE_BY_SLUG[slug]) return;
  _id('info-panel').classList.add('hidden');
  focusStack.push(currentFocusSlug);
  buildGroupView(slug);
}
function updateNavUI(){
  var parts=[];
  for(var i=0;i<focusStack.length;i++){
    var s=focusStack[i],f=CORE_BY_SLUG[s];
    parts.push('<span class="bc">'+_esc(f?f.famous:s)+'</span>');
  }
  if(currentFocusFig) parts.push('<span class="bc" style="color:#ffe47a;font-weight:700">'+_esc(currentFocusFig.famous||currentFocusSlug)+'</span>');
  if(viewMode==='detail'&&detailKind){
    var kc=CONN_COLOR[detailKind]||'#fff';
    parts.push('<span class="bc" style="color:'+kc+'">'+_esc(KIND_LABELS[detailKind]||detailKind)+'</span>');
  }
  _id('breadcrumb').innerHTML=parts.join('<span class="sep">\u203a</span>');
  _id('back-btn').classList.toggle('hidden',viewMode==='group'&&focusStack.length===0);
}

function _setMsg(t){ var e=_id('ld-msg'); if(e) e.textContent=t; }
function _showErr(t){ var e=_id('ld-err'); if(e){e.innerHTML=String(t).replace(/\n/g,'<br>');e.style.display='block';}}

/* ── Interaction ────────────────────────────────────────────────── */
function _handleClick(e){
  var rect=_cvs.getBoundingClientRect();
  _mp.x=((e.clientX-rect.left)/rect.width)*2-1;
  _mp.y=-((e.clientY-rect.top)/rect.height)*2+1;
  _rc.setFromCamera(_mp,camera);
  var hits=_rc.intersectObjects(clickTargets);
  if(!hits.length) return;
  var hit=hits[0].object;
  if(hit.userData.type==='group'){
    buildDetailView(hit.userData.slug,hit.userData.kind);
  } else if(hit.userData.type==='person'){
    hit.scale.setScalar(1.70);
    setTimeout(function(){if(hit)hit.scale.setScalar(1.0);},180);
    _showInfo(hit.userData.fig,hit.userData.kind,hit.userData.relWord);
  }
}

function _initInteraction(){
  _cvs=_id('canvas');
  _rc=new THREE.Raycaster();
  _mp=new THREE.Vector2();
  _cvs.addEventListener('pointerdown',function(e){
    _drag=true; _cvs.classList.add('dragging');
    if(_autoRotTimer){clearTimeout(_autoRotTimer);_autoRotTimer=null;}
    _autoRot=false;
    _lastMX=e.clientX; _lastMY=e.clientY;
    _clickX=e.clientX; _clickY=e.clientY; _clickT=Date.now();
    _cvs.setPointerCapture(e.pointerId);
  });
  _cvs.addEventListener('pointermove',function(e){
    if(!_drag) return;
    var dx=e.clientX-_lastMX,dy=e.clientY-_lastMY;
    _lastMX=e.clientX; _lastMY=e.clientY;
    sceneGroup.rotation.y+=dx*.0088;
    sceneGroup.rotation.x=Math.max(-.55,Math.min(.55,sceneGroup.rotation.x+dy*.0068));
  });
  _cvs.addEventListener('pointerup',function(e){
    _drag=false; _cvs.classList.remove('dragging');
    var dx=e.clientX-_clickX,dy=e.clientY-_clickY;
    if(Math.sqrt(dx*dx+dy*dy)<7&&Date.now()-_clickT<320) _handleClick(e);
    _autoRotTimer=setTimeout(function(){_autoRot=true;_autoRotTimer=null;},4200);
  });
  _cvs.addEventListener('pointercancel',function(){_drag=false;_cvs.classList.remove('dragging');});
  _cvs.addEventListener('wheel',function(e){
    e.preventDefault();
    camera.position.z=Math.max(4,Math.min(90,camera.position.z+e.deltaY*.038));
  },{passive:false});
  _id('ip-close').addEventListener('click',function(){_id('info-panel').classList.add('hidden');});
  _id('back-btn').addEventListener('click',function(){
    _id('info-panel').classList.add('hidden');
    if(viewMode==='detail') buildGroupView(currentFocusSlug);
    else if(focusStack.length) buildGroupView(focusStack.pop());
  });
}

/* ── Search UI ──────────────────────────────────────────────────── */
function _initSearchUI(){
  var searchBtn=_id('search-btn'),searchInput=_id('search-input'),searchResults=_id('search-results');
  var searchOpen=false;
  function toggleSearch(){
    searchOpen=!searchOpen;
    searchBtn.classList.toggle('active',searchOpen);
    searchInput.style.display=searchOpen?'block':'none';
    searchResults.style.display='none';
    if(searchOpen){searchInput.value='';searchInput.focus();}
  }
  searchBtn.addEventListener('click',toggleSearch);
  searchInput.addEventListener('input',function(){
    var q=this.value.trim();
    if(q.length<2){searchResults.style.display='none';return;}
    var hits=_searchFigs(q,9);
    if(!hits.length){searchResults.innerHTML='<div class="sr-item" style="color:#666">No results</div>';}
    else{searchResults.innerHTML=hits.map(function(f){return '<div class="sr-item" data-slug="'+_esc(f.slug)+'">'+_esc(f.famous||f.slug)+'<span class="sr-type">'+_esc(f.type||'')+'</span></div>';}).join('');}
    searchResults.style.display='block';
  });
  searchResults.addEventListener('click',function(e){
    var item=e.target.closest('.sr-item');
    if(!item||!item.dataset.slug) return;
    var slug=item.dataset.slug;
    searchInput.value=''; searchResults.style.display='none'; toggleSearch();
    var found=false;
    for(var i=0;i<clickTargets.length;i++){
      var m=clickTargets[i];
      if(m.userData&&m.userData.type==='person'&&m.userData.fig.slug===slug){flyToSphere(m);found=true;break;}
    }
    if(!found){if(slug!==currentFocusSlug)focusStack.push(currentFocusSlug);buildGroupView(slug);}
  });
  // ESC inside search — captured here so overlay ESC doesn't also fire
  searchInput.addEventListener('keydown',function(e){
    if(e.key==='Escape'){e.stopPropagation();if(searchOpen)toggleSearch();}
  });
}

/* ── Path finder UI ─────────────────────────────────────────────── */
function _initPathUI(){
  var pathBtn=_id('path-btn'),pathPanel=_id('path-panel');
  var fromInput=_id('path-from'),toInput=_id('path-to');
  var fromAc=_id('path-from-ac'),toAc=_id('path-to-ac');
  var findBtn=_id('path-find-btn'),resultDiv=_id('path-result'),walkBtn=_id('path-walk-btn');
  var panelOpen=false,_fromSlug=null,_toSlug=null;
  function togglePanel(){
    panelOpen=!panelOpen;
    pathBtn.classList.toggle('active',panelOpen);
    pathPanel.style.display=panelOpen?'block':'none';
    if(panelOpen){
      if(currentFocusFig){fromInput.value=currentFocusFig.famous||currentFocusSlug;_fromSlug=currentFocusSlug;}
      resultDiv.innerHTML=''; walkBtn.style.display='none';
    }
  }
  pathBtn.addEventListener('click',togglePanel);
  function makeAc(input,acDiv,onSelect){
    input.addEventListener('input',function(){
      var q=this.value.trim(); acDiv.innerHTML=''; acDiv.style.display='none';
      if(q.length<2) return;
      var hits=_searchFigs(q,7);
      if(!hits.length) return;
      hits.forEach(function(f){
        var d=document.createElement('div'); d.className='sr-item'; d.textContent=f.famous||f.slug;
        d.addEventListener('click',function(){input.value=f.famous||f.slug;acDiv.style.display='none';onSelect(f.slug);});
        acDiv.appendChild(d);
      });
      acDiv.style.display='block';
    });
    document.addEventListener('click',function(e){if(!input.contains(e.target)&&!acDiv.contains(e.target))acDiv.style.display='none';});
  }
  makeAc(fromInput,fromAc,function(slug){_fromSlug=slug;});
  makeAc(toInput,toAc,function(slug){_toSlug=slug;});
  findBtn.addEventListener('click',function(){
    resultDiv.innerHTML='<span style="color:#888">Searching\u2026</span>';
    walkBtn.style.display='none'; _pathWalk=null;
    setTimeout(function(){
      if(!_fromSlug||!_toSlug){resultDiv.innerHTML='<span style="color:#c88">Select both figures.</span>';return;}
      var path=findPath(_fromSlug,_toSlug);
      if(!path){resultDiv.innerHTML='<span style="color:#c88">No connection found.</span>';return;}
      var html='<div style="color:#888;font-size:10px;margin-bottom:8px">'+(path.length-1)+' step'+(path.length-1===1?'':'s')+'</div>';
      for(var i=0;i<path.length;i++){
        var step=path[i],fig2=CORE_BY_SLUG[step.slug],name=fig2?(fig2.famous||fig2.slug):step.slug;
        html+='<div class="ps-row"><span class="ps-num">'+(i+1)+'</span><span class="ps-name" data-slug="'+_esc(step.slug)+'">'+_esc(name)+'</span>'+(step.label?'<span class="ps-rel">'+_esc(step.label)+'</span>':'')+'</div>';
        if(i<path.length-1) html+='<div class="ps-row"><span class="ps-num"></span><span class="ps-arrow">\u2193</span></div>';
      }
      resultDiv.innerHTML=html;
      resultDiv.querySelectorAll('.ps-name').forEach(function(el){
        el.addEventListener('click',function(){
          var slug=this.dataset.slug;
          if(slug!==currentFocusSlug)focusStack.push(currentFocusSlug);
          buildGroupView(slug);
        });
      });
      _pathWalk={path:path,idx:0};
      walkBtn.textContent='Walk path: start \u2192'; walkBtn.style.display='block';
    },10);
  });
  walkBtn.addEventListener('click',function(){
    if(!_pathWalk) return;
    _pathWalk.idx++;
    if(_pathWalk.idx>=_pathWalk.path.length){walkBtn.textContent='End of path';return;}
    var step=_pathWalk.path[_pathWalk.idx];
    if(step.slug!==currentFocusSlug){focusStack.push(currentFocusSlug);buildGroupView(step.slug);}
    var remaining=_pathWalk.path.length-_pathWalk.idx-1;
    if(remaining>0){var nxt=CORE_BY_SLUG[_pathWalk.path[_pathWalk.idx+1].slug];walkBtn.textContent='Next: '+(nxt?nxt.famous||nxt.slug:'\u2026')+' \u2192';}
    else{walkBtn.textContent='End of path';}
  });
}

/* ── Animation loop ─────────────────────────────────────────────── */
function _animateLoop(){
  _rafId=requestAnimationFrame(_animateLoop);
  if(_flyRyTarget!==null){
    var diff=_flyRyTarget-sceneGroup.rotation.y;
    sceneGroup.rotation.y+=diff*0.10;
    if(Math.abs(diff)<0.008){
      sceneGroup.rotation.y=_flyRyTarget; _flyRyTarget=null;
      var arrived=_flyMesh; _flyMesh=null;
      if(arrived&&arrived.userData&&arrived.userData.type==='person'){
        arrived.scale.setScalar(1.8);
        setTimeout(function(){if(arrived)arrived.scale.setScalar(1.0);},300);
        _showInfo(arrived.userData.fig,arrived.userData.kind,arrived.userData.relWord);
      }
      _autoRotTimer=setTimeout(function(){_autoRot=true;_autoRotTimer=null;},3000);
    }
  }
  if(_autoRot&&!_drag&&_flyRyTarget===null) sceneGroup.rotation.y+=.0020;
  camera.position.y+=(_camTargetY-camera.position.y)*.055;
  camera.lookAt(0,camera.position.y,0);
  updateOverlay();
  renderer.render(scene,camera);
}

/* ── open() ─────────────────────────────────────────────────────── */
function open(slug,data){
  CORE         =data.core||[];
  CORE_BY_SLUG =data.coreBySlug||{};
  NAME2SLUG    =data.name2Slug||null;
  STUDENTS_OF  =data.studentsOf||null;
  ENRICH_BY_SLUG=data.enrichBySlug||{};

  var styleEl=document.createElement('style');
  styleEl.id='r3d-css';
  styleEl.textContent=R3D_CSS;
  document.head.appendChild(styleEl);

  var overlayEl=document.createElement('div');
  overlayEl.id='r3d-overlay';
  overlayEl.innerHTML=R3D_HTML;
  document.body.appendChild(overlayEl);

  document.getElementById('r3d-close').addEventListener('click',close);

  // ESC closes overlay only when no tool panel intercepts it
  _escHandler=function(e){
    if(e.key!=='Escape') return;
    var si=document.getElementById('r3d-search-input');
    var pp=document.getElementById('r3d-path-panel');
    if(si&&si.style.display!=='none') return;
    if(pp&&pp.style.display!=='none') return;
    close();
  };
  document.addEventListener('keydown',_escHandler);

  if(!NAME2SLUG&&CORE.length) buildResolver();

  function proceed(){
    initThree();
    _initInteraction();
    _initSearchUI();
    _initPathUI();
    if(!STUDENTS_OF) buildReverseTeachers();
    var loadEl=document.getElementById('r3d-loading');
    if(loadEl) loadEl.classList.add('gone');
    buildGroupView(slug||'F1132');
    _animateLoop();
  }

  if(window.THREE){
    proceed();
  } else {
    var s=document.createElement('script');
    s.src='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    s.onload=proceed;
    s.onerror=function(){_showErr('Failed to load Three.js. Check your connection.');};
    document.head.appendChild(s);
  }
}

/* ── close() ────────────────────────────────────────────────────── */
function close(){
  if(_rafId!==null){cancelAnimationFrame(_rafId);_rafId=null;}
  if(sceneGroup){
    var ch=sceneGroup.children.slice();
    for(var i=0;i<ch.length;i++){
      if(ch[i].geometry) ch[i].geometry.dispose();
      if(ch[i].material) ch[i].material.dispose();
    }
  }
  if(renderer){renderer.dispose();renderer=null;}
  scene=null; camera=null; sceneGroup=null;
  if(_resizeHandler){window.removeEventListener('resize',_resizeHandler);_resizeHandler=null;}
  if(_escHandler){document.removeEventListener('keydown',_escHandler);_escHandler=null;}
  if(_autoRotTimer){clearTimeout(_autoRotTimer);_autoRotTimer=null;}
  var ov=document.getElementById('r3d-overlay'); if(ov) ov.remove();
  var cs=document.getElementById('r3d-css'); if(cs) cs.remove();
  CORE=null; CORE_BY_SLUG={}; NAME2SLUG=null; STUDENTS_OF=null; ENRICH_BY_SLUG={};
  clickTargets=[]; _labels=[]; _ticks=[];
  focusStack=[]; currentFocusSlug=null; currentFocusFig=null;
  viewMode='group'; detailKind=null;
  _ADJ=null; _pathWalk=null; _cvs=null; _rc=null; _mp=null;
  _autoRot=true; _camTargetY=0; _flyRyTarget=null; _flyMesh=null; _drag=false;
}

window.Relations3D={open:open,close:close};
})();
