# FIX OVERNIGHT RUN — 2026-08-02

Autonomous run in `C:\TEST\bv-app`. No git, no deploy, no Sync, **no API calls (zero spend)**.
Every step appends its own entry below with proof lines.

---

## STEP 0 — SETUP — **DONE**

Backups written to `..\bv-app_backups\`:

```
finance_2026-08-02.js    411448 bytes
shell_2026-08-02.js       60113 bytes
index_2026-08-02.html      8915 bytes
```

Baseline checksums recorded for the protected files (re-checked in Step 8):

```
88f5d05ed73b1f51b1c48db8d20a4864  gate.js
8a7cf0da9fa2a3608a1ff9635b15402f  auth.js
235963c18265ff84e205bf6198b0e546  data/Finance/standards_kb.json
e908c80b22bb11ef7e6faa6b14a17d61  data/Finance/standards_kb_IFSB.json
2607ce8044a2ac95df6644bf1bade802  data/Finance/standards_kb_multiregulator.json
fb5c8a3adc099f8821200d232c393ef0  data/Finance/standards_kb_star.json
7b5bca71556005b4d034673065a04ac7  data/Finance/reliability_log.json
45662a23a29980d8789910573a50ffdb  data/Finance/standards_kb_fix4.json  (SS 5 note, 36 rules, pre-existing)
```

Log file created: `data\Finance\FIX_OVERNIGHT_LOG.md`.

---

## STEP 1 — MURABAHA DEEP NOTE — **DONE**

Source located via `standards_files.json`: **SS 8 Murabahah (Revised)** →
`data\Finance\Standards\aaoifi\shariah standards\SS-08.txt`

```
VERIFICATION GATE: 59 extracted, 59 PASS, 0 FAIL
EARLIER NOTES BYTE-UNCHANGED: True
APPENDED KB-AAOIFI-SS8 — 59 verified rules
```

Method identical to the SS 5 kafalah note: quotes are **sliced from the source file by code**, never
typed; page furniture (page numbers, running headers) is never crossed; each quote re-checked
whitespace-normalised against the source. Rules carry a stable `rule_id` (e.g. `SS8-2/2/3`).

## STEP 2 — MORE DEEP NOTES — **DONE (8 of 8 topics)**

One standard at a time, same extractor, same gate. Earlier notes re-verified byte-unchanged after
every append (all reported `True`).

| # | Topic | Standard | Source file on disk | Rules | Gate |
|---|---|---|---|---|---|
| 1 | ijarah | SS 9 Ijarah and Ijarah Muntahia Bittamleek | `SS-09.txt` | 40 | 40/40 PASS |
| 2 | wakala | SS 23 Agency / Uncommissioned Agent | `SS-23.txt` | 21 | 21/21 PASS |
| 3 | mudaraba | SS 13 Mudarabah (Revised) | `SS-13.txt` | 23 | 23/23 PASS |
| 4 | musharaka | SS 12 Sharikah (Musharakah) | `SS-12.txt` | 72 | 72/72 PASS |
| 5 | salam | SS 10 Salam and Parallel Salam | `SS-10.txt` | 25 | 25/25 PASS |
| 6 | istisna | SS 11 Istisna'a and Parallel Istisna'a | `SS-11.txt` | 39 | 39/39 PASS |
| 7 | tawarruq | SS 30 Monetization (Tawarruq) | `SS-30.txt` | 13 | 13/13 PASS |
| 8 | late payment / charity | SS 3 Procrastinating Debtor | `SS-03.txt` | 8 | 8/8 PASS |

**Full independent re-verification of the whole file** (separate script, re-reads the written JSON
and re-checks every quote against its own source):

```
KB-AAOIFI-SS05  SS 5 Guarantees                    36/36 PASS
KB-AAOIFI-SS8   SS 8 Murabahah                     59/59 PASS
KB-AAOIFI-SS9   SS 9 Ijarah / IMB                  40/40 PASS
KB-AAOIFI-SS23  SS 23 Agency (Wakalah)             21/21 PASS
KB-AAOIFI-SS13  SS 13 Mudarabah                    23/23 PASS
KB-AAOIFI-SS12  SS 12 Sharikah (Musharakah)        72/72 PASS
KB-AAOIFI-SS10  SS 10 Salam                        25/25 PASS
KB-AAOIFI-SS11  SS 11 Istisna'a                    39/39 PASS
KB-AAOIFI-SS30  SS 30 Monetization (Tawarruq)      13/13 PASS
KB-AAOIFI-SS3   SS 3 Procrastinating Debtor         8/8  PASS
TOTAL: 336/336 quotes verbatim across 10 notes — 0 FAIL, 0 deleted
```

The canonical late-payment rule is now captured verbatim:

```
SS3-2/1/2  "It is not permitted to stipulate any financial compensation, either in cash or in
            other consideration, as a penalty clause in respect of a delay by a debtor..."
SS3-2/1/8  "It is permissible in contracts involving indebtedness (such as Murabahah) to
            stipulate an undertaking by the debtor, that in case ct: procrastinating ..."
```

**Note on glosses (deliberate trade-off).** The SS 5 note keeps its hand-written glosses. The nine
new notes carry glosses that are **mechanically condensed from each clause's own words** and
labelled `GLOSS (PROHIBITION|REQUIREMENT|PERMISSION|RULE; auto-condensed from the clause text
above, not added knowledge)`. With API calls barred (zero spend) this is the only way to add a
gloss at this volume without inventing wording. Quotes are unaffected — they are pure verbatim.

**Not extracted (available if wanted):** SS 46 Al-Wakalah Bi Al-Istithmar (investment agency),
SS 40 Profit Distribution, SS 43 Insolvency, plus BNM/IFSB/FAS variants for most topics — all on
disk. One standard per topic was taken, as instructed.

---

## STEP 3 — WIRE THE RULES FILE — **DONE**

```
finance.js:305   fetch list  … 'standards_kb_star','standards_kb_fix4','standards_kb_new_batch_1' …
finance.js:308   OPTIONAL    … standards_kb_star:true, standards_kb_fix4:true, …   (fail-soft)
finance.js:310   SILENT      var SILENT = { reliability_log:true, standards_kb_fix4:true };
finance.js:382   kb merge    (out.standards_kb_fix4 && out.standards_kb_fix4.notes) || []
```

Merged into the single `D.kb` deep-notes list exactly like `standards_kb_star`. Marked OPTIONAL and
SILENT, so a missing file degrades quietly instead of breaking boot. `node --check` OK; the served
file returns HTTP 200.

## STEP 4 — FIX-4 RULE CHECKLIST ENGINE — **DONE**

Engine (new block in `finance.js` above `_pipelineRecipe`):

```
FIX4_MAX_RULES = 40          prompt-size cap; overflow is logged, never silent
FIX4_TOPICS                  topic words per standard — scope decided by CODE, not the model
_fix4AllRules()              flattens every rule_id / clause / quote from the loaded notes
_fix4RulesFor(docText)       selects in-scope rules, round-robin across standards when capping
_fix4Block(rules)            the prompt section; returns '' when no rules, so the prompt is unchanged
_fix4Reconcile(rules, raw)   THE CODE GATE
```

Pipeline wiring: rules chosen in `_pipeTier3` before the call; `rules_verdicts` is added to the tool
schema **only when rules are in scope**; `_fix4Reconcile` runs after the response, beside the FIX-3
guard, before `_installLiveCase`. The report renders a **Rule checklist** table (rule id, standard +
clause, verdict badge, document quote). Archive stores `rules_verdicts`. Open-items section untouched.

Gate behaviour, all verified by harness:

* verdict citing an unknown rule id → **dropped and logged**
* rule with no verdict returned → **filled in as UNCERTAIN by code**
* `NON_COMPLIANT` with no document quote → **downgraded to UNCERTAIN** (nothing to show a scholar)
* duplicate verdicts for one rule id → ignored

**Two defects found and fixed during testing** (both would otherwise have shipped silently):

1. The SS 5 note predates `rule_id`, so its 36 rules were invisible — only 300 of 336 loaded.
   `_fix4AllRules` now derives `rule_id` from the clause ref when absent → **336/336**.
2. The cap took the first 40 of a flat list, which was **all SS 8** — a murabaha document would
   never have had its late-payment rules tested. Selection is now round-robin across in-scope
   standards → SS 3 and SS 8 both represented.

## STEP 5 — FIX-6 REPORT EXPORT — **DONE**

`EXPORT` button beside PRINT (`finance.js:3718`), wired at `finance.js:2280` to `_repExport()`.
It clones the `.fin-report` sheet, strips every control using the same list the archive snapshot
uses, inlines the same-origin `finance.css` / `finance-shim.css` rules, opens a blank window, writes
a standalone document and calls `print()` for Save-as-PDF. **No server, no library, no network.**
Pop-up blocking is detected and logged rather than failing silently. `#fin-rep-export` was also added
to the archive strip list so the button can never be baked into an archived snapshot.

## STEP 6 — FIX-5 CONSENSUS VOTING (BUILT, OFF) — **DONE — FLAG LEFT OFF**

```
finance.js:3678   var RELI_CONSENSUS = false;      <-- default, NOT enabled
finance.js:3679   var RELI_CONSENSUS_RUNS = 3;
finance.js:3682   if(!RELI_CONSENSUS){ _installLiveCase(report); return; }
```

`_t3Deliver()` replaces the direct install at the end of Tier 3. **With the flag false it calls
`_installLiveCase(report)` immediately — same behaviour, same single API call, same cost as today.**
With it true, Tier 3 runs 3 times and `_t3Consensus()` keeps only what appears in at least 2 of 3:
rule verdicts matched by `rule_id` (no majority → UNCERTAIN), free-form findings matched with the
reliability scorer's own `_reliPairScore` quote-similarity matcher. Not enabled.

## STEP 7 — REPORT-PAGE &lt;UNKNOWN&gt; — **DONE**

New `_repCaseName(fab)` applies the `_reliArchDoc` rule to the report header (`finance.js:3899`):
the literal `<UNKNOWN>` is treated as absent and falls back to the document title. Verified:
`<UNKNOWN>` → `My Doc.pdf`, `<unknown>` → `My Doc.pdf`, `Real Case` → `Real Case`,
`""` → `Fallback.pdf`, `<UNKNOWN>` with no fallback → empty.

## STEP 8 — FULL REGRESSION SWEEP — **DONE — ALL CHECKS PASS**

```
node --check          finance.js OK   shell.js OK
JSON.parse            standards_kb_fix4.json OK   reliability_log.json OK
Chrome parse test     finance.js PARSES OK in Chrome, 427913 chars
Browser boot          no console errors after a clean reload
Browser fetch         standards_kb_fix4.json -> 10 notes / 336 rules, served at v=34

PROTECTED FILES vs baseline md5 (Step 0):
  gate.js                                        OK (unchanged)
  auth.js                                        OK (unchanged)
  data/Finance/standards_kb.json                 OK (unchanged)
  data/Finance/standards_kb_IFSB.json            OK (unchanged)
  data/Finance/standards_kb_multiregulator.json  OK (unchanged)
  data/Finance/standards_kb_star.json            OK (unchanged)
  data/Finance/reliability_log.json              OK (unchanged)
  data/Finance/standards_kb_fix4.json            CHANGED - intended (this run appended 9 notes)

Z:\ path scan across every edited file: CLEAN (no matches)

HARNESS SUITE (20 checks, re-runnable - now locates functions by name, not line number):
  FIX-3 citation guard ....... 3/3 PASS   all real saved findings survive; fabricated + uncited dropped
  FIX zero-finding scorer .... 5/5 PASS   100/null/0 rules, empty-vs-missing, em dash, null-skipping avg
  FIX-4 rule engine .......... 8/8 PASS   336 rules, scope, cap, gate, downgrade, free-form untouched
  FIX-5 + FIX-7 .............. 4/4 PASS   flag off, immediate install, <UNKNOWN> fallback
  ================ ALL CHECKS PASS ================
```

## STEP 9 — FINISH — **DONE**

```
shell.js:237    var _cb = '?v=152'     (was ?v=151)
index.html:181  shell.js?v=34          (was ?v=33)
```

---

# MORNING SUMMARY

| Step | What | Result |
|---|---|---|
| 0 | Setup, backups, baseline checksums | **DONE** |
| 1 | Murabaha deep note (SS 8) | **DONE** — 59 rules, 59/59 PASS |
| 2 | 8 more deep notes, one at a time | **DONE** — 8/8 topics, 241 rules, all PASS |
| 3 | Wire `standards_kb_fix4.json` into loader | **DONE** — fail-soft |
| 4 | FIX-4 rule checklist engine, code gate, render | **DONE** — 2 defects found and fixed |
| 5 | FIX-6 report export to print/PDF | **DONE** — self-contained |
| 6 | FIX-5 consensus voting | **DONE, LEFT OFF** (`RELI_CONSENSUS = false`) |
| 7 | Report header `<UNKNOWN>` fallback | **DONE** |
| 8 | Full regression sweep | **DONE** — 20/20 checks pass |
| 9 | Cache bump and close log | **DONE** |

**Nothing skipped. No step failed its verification.**

### Files changed

```
finance.js                             edited   (steps 3,4,5,6,7)
finance.css                            edited   (rule-checklist styles only, appended)
shell.js                               edited   (cache tag only)
index.html                             edited   (cache tag only)
data/Finance/standards_kb_fix4.json    extended (1 note -> 10 notes, 36 -> 336 rules)
data/Finance/FIX_OVERNIGHT_LOG.md      created  (this file)
..\bv-app_backups\finance_2026-08-02.js    created
..\bv-app_backups\shell_2026-08-02.js      created
..\bv-app_backups\index_2026-08-02.html    created
```

### Rules honoured

No git, no deploy.py, no Sync.py, **no API call to any AI service (zero spend)**.
`gate.js` and `auth.js` byte-unchanged. Nothing in `Z:\` touched. Existing `standards_kb*.json`
byte-unchanged apart from the loader wiring in step 3. Consensus flag left **off**.

### Not verified on screen (needs your eye)

The Rule-checklist section, the EXPORT button and the `<UNKNOWN>` header fix are **code-verified and
harness-tested but never rendered in a live run**, because a live run costs an API call. To exercise
them, run a live review on a murabaha or guarantee document — the checklist should appear carrying
SS 3 and SS 8 rules. Consensus is untested end-to-end by design; trying it would cost 3x a run.
