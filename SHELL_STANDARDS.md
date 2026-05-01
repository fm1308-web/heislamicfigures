# SHELL_STANDARDS.md — APP-V2 GLOBAL DESIGN STANDARD
**Version 2 — extracted from approved SILSILA, TIMELINE, FOLLOW, BOOKS, STUDY code on Apr 28 2026.**

Read this file BEFORE fixing or building ANY view. Once an element is approved here, it is the global standard for all 14 views — never re-styled per view.

═══════════════════════════════════════════════════════════
1. COLORS — locked in shell.css :root
═══════════════════════════════════════════════════════════
--bg-navy:    #0E1621   (deepest navy, body bg)
--bg-navy-2:  #131c2a   (zone-a bg, zb-row2 bg)
--bg-navy-3:  #1a2434   (zone-b row1 bg, menu-dropdown bg)
--gold:       #c9a961   (active state, accents, links)
--gold-soft:  #d4a96a   (logo, hover text)
--gold-dim:   rgba(212,175,55,0.55)  (default borders)
--gold-faint: rgba(212,175,55,0.18)  (hover bg, active bg)
--text:       #E8EAEF   (primary body text)
--text-dim:   #9aa3b2   (zone-b default text, secondary)
--text-faint: #6b7384   (placeholders, disabled)

Per-view CSS uses these via var(). NEVER hardcode hex.

═══════════════════════════════════════════════════════════
2. ZONE LAYOUT — fixed for every view
═══════════════════════════════════════════════════════════
ZONE A — Top bar       built once by shell. Logo + tabs + tools + user pill.
ZONE B — Filter bar    2 rows. shell builds DOM from FILTER_SPECS[VIEW]; view only attaches handlers.
ZONE C — View body     view's mount(zoneCEl, zoneBEl) injects scaffold here.
ZONE D — Bottom bar    built once. Per-view enable via ZONE_D_RULES[VIEW].

Views NEVER touch Zone A or Zone D DOM. Views NEVER inject Zone B HTML.

═══════════════════════════════════════════════════════════
3. SHELL ELEMENTS — every visual primitive
═══════════════════════════════════════════════════════════

3.1 SHELL FILTER BUTTON         class="zb-select"
    Height 32px, pill-shape (border-radius 16px).
    bg #0E1621, border 1px var(--gold-dim).
    Color var(--text), font-size 13px, padding 0 14px (right 30px for caret).
    Caret ▾ via ::after, gold.
    Hover: border var(--gold), color var(--gold-soft).
    Active (zb-active class): border + color var(--gold), gold-faint bg, gold glow.
    Spec: { type:'select', label:'TYPE' }

3.2 SHELL PILL ACTION           class="zb-pill"
    Same base as zb-select. UPPERCASE, font-weight 600, letter-spacing 0.08em, font-size 12px.
    Spec: { type:'pill', label:'SAVED' }

3.3 SHELL SEARCH                class="zb-search" wrapper + class="zb-search-input"
    240px fixed slot. Magnifying-glass via ::before/::after.
    Placeholder color var(--text-faint).
    Spec: search: true

3.4 SHELL SLIDER                class="zb-slider"
    Flex 1, padding 0 16px, gap 10px.
    Label class="zb-slider-label" 12px uppercase letter-spacing 0.06em color var(--text-dim).
    Range input accent-color var(--gold), width 100px.

3.5 SHELL ICON BUTTON           class="zb-icon-btn"
    32×32 circular. font-size 14px.
    Spec: { type:'iconbtn', icon:'♪' }

3.6 SHELL TITLE / HINT          class="zb-slot-hint"
    Lives in row 2 only.
    Position absolute, centered (left:50% transform translate(-50%,-50%)).
    Font 'Cinzel' serif, font-size 13px, letter-spacing 0.08em, color var(--text-muted, #A0AEC0).
    pointer-events:none — never blocks clicks.
    Spec: hint:'Some text', hintInRow2:true

3.7 SHELL HTW BUTTON            class="zb-pill zb-slot-htw"
    Pill, far right of row 1. Click → activeViewApi.showHtw().
    Spec: htw:true
    REQUIREMENT: view MUST export showHtw fn or button is dead.

3.8 SHELL DIVIDER               class="zb-divider"
    1px × 24px gold-dim.

3.9 SHELL ANIMATE / SPEED / AUDIO (Zone D)
    animate button — gold pill bottom-center.
    speed pill — cycles 0.5x → 1x → 2x → 4x.
    audio iconbtn — view-handled.
    Spec in shell.js: ZONE_D_RULES[VIEW] = { animate:bool, audio:bool }
    REQUIREMENT: animate:true → view exports animateStart, animatePause; optional animateStop, animateSetSpeed(label).

═══════════════════════════════════════════════════════════
4. SHELL DROPDOWN PANEL — single global standard
═══════════════════════════════════════════════════════════
Defined in shell.css. Use these classes ONLY. Never invent .bv-dd-*, .era-dd-*, .ev-shell-dd, etc.

Markup pattern (build in JS, position fixed below the button):

  <div class="dd-panel">
    <input class="dd-search" placeholder="search…">
    <div class="dd-item dd-all">
      <div class="dd-checkbox">✓</div>
      <span>All Items</span>
    </div>
    <div class="dd-item">
      <div class="dd-checkbox">✓</div>
      <span>Item label</span>
      <span class="dd-count">42</span>      <!-- optional -->
    </div>
    ...
  </div>

Open by adding .open. Toggle:
  panel.classList.toggle('open');
Position when opening:
  var r = btn.getBoundingClientRect();
  panel.style.position = 'fixed';
  panel.style.top  = (r.bottom + 4) + 'px';
  panel.style.left = r.left + 'px';

Outside-click closes.
Multi-select: toggle .selected on .dd-item; .dd-checkbox shows ✓ when .selected via CSS.

CSS specs (already in shell.css — DO NOT redefine):
  .dd-panel        bg #1a1a2e, border 1px var(--gold-dim), border-radius 6px, min-width 220, max-h 400, padding 6px 0, box-shadow 0 8px 24px rgba(0,0,0,.6), z-index 999999.
  .dd-search       bg rgba(255,255,255,.04), border 1px rgba(212,175,55,.25), border-radius 4, color #E5E7EB, font-size 13.
  .dd-item         flex gap 10, padding 7px 14px, color #cfd2d6, font-size 13.
  .dd-item:hover   bg gold-faint, color gold.
  .dd-item.selected color gold.
  .dd-item.dd-all  border-bottom 1px gold-dim, font-weight 600.
  .dd-checkbox     14×14, border 1px gold-dim, border-radius 3, color gold, ✓ inside.
  .dd-count        gold bg, dark text, pill 1px 6px, border-radius 8.

═══════════════════════════════════════════════════════════
5. ROW LAYOUT
═══════════════════════════════════════════════════════════
ZB ROW 1   height 52px. Slots in order: search (240) · slider (flex) · spacer · saved · htw.
ZB ROW 2   height 44px. Filters left-aligned, hint absolute centered, actions right.
           If empty: .zb-row2.is-empty { display:none }.

═══════════════════════════════════════════════════════════
6. MANDATORY VIEW API (every view's IIFE return object)
═══════════════════════════════════════════════════════════
return {
  mount:           function(zoneCEl, zoneBEl){...},   // required
  unmount:         function(){...},                    // required
  showHtw:         function(){...},                    // required if htw:true
  animateStart:    function(){...},                    // required if animate:true
  animatePause:    function(){...},                    // required if animate:true
  animateSetSpeed: function(label){...},               // optional
  animateStop:     function(){...}                     // optional
};

Missing showHtw → HTW button silently dead. Most common bug.

═══════════════════════════════════════════════════════════
7. VIEW CSS RULES — never override shell
═══════════════════════════════════════════════════════════
Per-view CSS files MUST NOT touch:
  .zb-* · .zd-* · .tab-* · body · .zone-* · .app-shell · .menu-* · #userPill · #flagHome · #tabRow1 · #tabRow2 · .dd-panel · .dd-item · .dd-search · .dd-checkbox · .dd-count.

Per-view CSS scope: #zoneC #<view-id> ... only.

═══════════════════════════════════════════════════════════
8. SANDBOX LIFT CHECKLIST
═══════════════════════════════════════════════════════════
1. Wrap view in window.<View>View = (function(){ 'use strict'; ... })();
2. Stub external globals at top: VIEW, APP, requireTester, _updateFavFilterBtn, setView, _showViewDesc.
3. NEVER stub _mb* functions. Local stubs shadow real window globals from mapbase.js. (BV29 disaster — wasted hours.)
4. Verify ALL original body DOM survived the lift — view headers, legends, footer markers, status text often dropped.
5. Add mount / unmount / showHtw to return object.
6. Update FILTER_SPECS[VIEW] in shell.js: search/filters/actions/hint/htw.
7. Update ZONE_D_RULES[VIEW] if animate/audio needed.
8. For dropdown filters: build .dd-panel + .dd-item markup (NOT .bv-dd-*, .era-dd-*, .ev-shell-dd). Wire to row 2 .zb-select buttons via getBoundingClientRect for fixed positioning.
9. Test order: Title visible → HTW opens → Filters render → Filter dropdowns work → Body matches bv-app reference → Animate plays.

═══════════════════════════════════════════════════════════
9. RECURRING BUGS — DO NOT REPEAT
═══════════════════════════════════════════════════════════
1. Title wrong style/position → just set hint+hintInRow2. Don't reinvent.
2. HTW dead → view didn't export showHtw. Add it.
3. Filter dropdowns dead → wire shell row 2 .zb-select to a real .dd-panel.
4. Per-view dropdown look (BV28-29 disaster) → ALL views use .dd-panel/.dd-item from shell.css. Never a custom panel class.
5. Body has extra row of buttons / animate pill → bv-app version had its own toolbar. Strip it. Anim controls live in Zone D only. HTW button lives in Zone B only.
6. Mapbase functions no-op → IIFE has shadowing stubs. Delete them.
7. Browser cache lies → after JS edits, right-click refresh → Empty Cache and Hard Reload.
