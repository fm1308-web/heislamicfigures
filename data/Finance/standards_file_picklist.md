# TASK 3 — Standards file pick-list (RV, 2026-07-25)

Source: standards_lights.json (218 rows) checked against standards_files.json (194 mapped).

## A. Green standards with NO file mapping — pick the file

The "17 unmapped" premise is now stale. The mapping has since been filled.
Only ONE green standard is still unmapped today:

- **GS 16** (AAOIFI — Institutional framework for implementation of Ethics)
  - Candidate file: `AAOIFIGS16InstitutionalframeworkforimplementationofEthics.txt`
  - Suggested folder (matches other GS entries): `aaoifi/Governance/`
  - Action: confirm this file, then add `"GS 16": "aaoifi/Governance/<filename>.txt"` to standards_files.json.

## B. Red-marked standards that DO have readable files — flip their light

8 standards are marked light=red but already have a file path in standards_files.json.
The 6 you named:

- **FAS 3** — Mudaraba Financing → `aaoifi/accounting standard/Financial-Accounting-Standard-3-Mudaraba-Financing.txt`
- **FAS 27** — Investment Accounts → `aaoifi/accounting standard/Financial-Accounting-Standard-27-Investment-accounts.txt`
- **FAS 37** — Financial Reporting by Waqf Institutions → `aaoifi/accounting standard/FAS-37-Financial-reporting-by-Waqf-institutions-Final-15-December-2020-v2-clean.txt`
- **SS 55** — Competitions and Prizes → `aaoifi/shariah standards/SS-55.txt`
- **SS 57** — The Gold Standard → `aaoifi/shariah standards/SS-57.txt`
- **SS 60** — Waqf → `aaoifi/shariah standards/SS.-60.txt`

Two more found in the same state (red but have a file):

- **AAB 1/2025** — Withdrawal of FAS 26 + Transitional Provisions → `aaoifi/accounting standard/Statement-Withdrawal-of-Investment-in-Real-Estate-and-Related-Transitional-Provisions.txt`
- **Code_Ethics** — AAOIFI Code of Ethics → `aaoifi/AAOIFI-Code-of-Ethics-for-Islamic-finance-Professionals.txt`

Action: flip light red -> green for these 8 (or confirm which should stay red).

## C. Data note

standards_files.json has 194 entries. Two GS 1 keys point to the same file
(`GS 1` and `GS1 (Old I think)`) — a duplicate to clean when convenient.
