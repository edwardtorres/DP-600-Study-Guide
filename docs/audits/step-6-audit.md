# Step 6 audit: Part A fixes + hands-on Fabric trial labs

Commits on `main`:
- 4658b35 Part A and save v4
- cd489eb lab content, lab logic, and lab checks
- 1f5abee Workshop tab, Labs page, lab view, debrief, and lab e2e
- cee450b CLAUDE.md labs section; DLS-13 wording
- the review fixes, review log, and this audit

**The labs are untested in Fabric.** Every step cites a source and was checked by a separate reviewer, but nobody has run them in a trial yet. Expect some steps not to match your screen. Use "Report a problem with this step", then **Export lab notes** and paste the file back to me.

## Part A results

### 1. Deployment permissions (Contributor vs Member for semantic models and paginated reports)

I scanned every question, case study, note, glossary entry, and puzzle for deployment combined with Contributor/Member or with semantic model/paginated report.

| Item | Change |
|---|---|
| Question **CV-01** (`questions/maintain/lifecycle.ts`) | The stem now says "deploy **a notebook** from Development to Test" (was "content"). Key unchanged: at least Contributor in both workspaces. |
| Question **CV-06**, prompt p1 | Now "Deploy **a notebook** from Development to an existing Test workspace". Key unchanged. |
| Conveyor notes, permissions concept (`notes/maintain.ts`) | Adds the nuance. The action table says Contributor on both stages; the "Granted permissions" item table says deploying an existing semantic model or paginated report needs Member (and a dataflow needs its owner). Both are cited. |
| Conveyor `needsVerification` (Step 8 queue) | New entry: Contributor vs Member to deploy an existing semantic model or paginated report. |

Checked and left unchanged:
- The other deployment questions (semantic model must be deployed before its report; autobinding; deployment rules; data isn't copied). None depends on the role.
- Conveyor puzzle CN scenarios. Their actors are Members or admins, which satisfies both readings, and the deployment evaluator already refuses the disputed case.

### 2. The other Step 5 contradictions

| Contradiction | Item | Change |
|---|---|---|
| SQL endpoint **OLS/CLS** (fallback vs error) | Semantic notes, fallback concept (`notes/semantic.ts`) | Lists only what the pages agree on (SQL RLS, unmaterialized views, guardrails, unframed tables). It now says the Learn pages differ on OLS/CLS. The sentence "one table over a guardrail prevents Direct Lake for the whole model" is removed (it also contradicted the per-table guardrail rule). |
| | Thread Sieves notes, trap (`notes/maintain.ts`) | Rewritten to give both readings for OLS/CLS. Sources: How Direct Lake works, the Direct Lake overview, Integrate Direct Lake security, and warehouse CLS. |
| | Direct Lake Shuttle `needsVerification` | New entry for OLS/CLS: fallback or error. |
| **Direct Lake on OneLake + SQL RLS** (succeeds vs error) | Semantic notes, the "On OneLake …" line and the "SQL views and SQL security" line | Both now say OneLake doesn't check permissions through the SQL analytics endpoint and that the pages differ on whether such queries succeed or error. |
| | Question **DLS-10**, statement s3 (`questions/semantic/model-b.ts`) | Was "SQL endpoint RLS is enforced for Direct Lake on OneLake (No)". Now "Direct Lake on OneLake checks permissions through the SQL analytics endpoint (No)", a claim both pages agree on. Sources add Manage Direct Lake semantic models. |
| | Question **DLS-13**, option d explanation (found in a later rescan during Step 6) | "on OneLake ignores it" → "on OneLake doesn't check permissions through the endpoint". The key is unchanged and adds Manage Direct Lake semantic models as a source. |
| | Direct Lake Shuttle `needsVerification` | New entry for OneLake + SQL RLS: success or error. |
| **DDM as a fallback cause** (single source) | Semantic and Thread Sieves notes | DDM is now attributed to How Direct Lake works only. |
| | Direct Lake Shuttle `needsVerification` | New entry: DDM as a fallback cause has one source. Puzzle **SF-07** relies on it. It's kept because Learn states it and nothing contradicts it, and it's flagged here. |

Checked and left unchanged:
- Case question CS1-04 (Direct Lake on OneLake with model RLS; doesn't depend on SQL RLS).
- Gearbox GB-S08 (its key is Direct Lake on SQL for SQL RLS, which both pages agree on).
- The Step 5 fallback evaluator (already returns null for SQL OLS and has no OneLake + SQL RLS case).

No new `BANNED_TERMS`: no phrase could be pinned to a disputed claim without also blocking valid uses. The needs-verification entries cover them.

### 3. Readiness puzzle cap

- `readinessWindow()` (`src/game/progress.ts`) walks back from the newest counted answer in each domain. It takes up to 40, accepting at most the 10 most recent puzzle plays (`READINESS_MAX_PUZZLES = 10`).
- Coverage still uses every counted answer.
- `READINESS_CODES` adds `'l'` (lab debrief).
- The tooltip and caption say "at most 10 of them puzzle plays, the most recent".
- Tests:
  - 30 puzzle plays + 20 inspections → a window of 10 puzzle plays and 20 inspections.
  - The most recent puzzle plays are the ones kept.
  - 100 interleaved answers → 40 entries, of which 10 are puzzle plays.
  - `'l'` answers count.

### 4. Trial size (Mill Lease)

- Confirmed on the fabric-trial page: the trial is configured as either F4 or F64, and an eligible capacity or tenant admin can increase it from 4 to 64 capacity units (Trial tab of the capacities page). Changing the size doesn't extend the 60 days.
- Mill Lease notes updated and cited.
- The needs-verification item is removed.
- There was no `BANNED_TERMS` entry for it.

### Save v4

- Adds `labs` (step ticks, problem notes up to 2,000 characters, `completedAt`), an optional `trialStart`, and answer code `'l'`.
- Migration `{ from: 3 }` adds `labs: {}`. It's tested on a real v3 save captured from the Step 5 app (`src/save/fixtures/save-v3.json`), and the v2 → v4 and v1 → v4 chains are tested too.

## Trial facts (confirmed on the fabric-trial page)

- 60 days, and another trial isn't guaranteed.
- When it ends, workspaces revert to Pro. Non-Power BI Fabric items become inactive until the workspace is reassigned to a paid capacity. Content is kept for 7 days.
- Copilot, Trusted Workspace Access, data agents, AI functions, and AI services aren't supported.
- F4 or F64; up to 1 TB of OneLake storage.

The Labs page shows these in a "Before you start" box. `check:content` rejects lab text that mentions an unsupported feature.

## The labs

| # | Lab | Platform | Time | Prerequisites | Bullets |
|---|---|---|---|---|---|
| L01 | Open the mill: start the trial and set up two workspaces | browser | 30 min | — | orientation (Mill Lease, Water Wheel, Founding Charter) |
| L02 | Thread intake: load data into a lakehouse four ways | browser | 1 h 30 | L01 | P1.1, P1.3, P1.2, P1.4 |
| L03 | Carding and twisting: clean, join, and aggregate in a Spark notebook | browser | 1 h 15 | L02 | P2.7, P2.8, P2.9, P2.5, P2.6, P2.2 |
| L04 | Weave planner: a star schema in a warehouse with T-SQL | browser | 1 h 30 | L01 | P2.3, P2.4, P2.1 |
| L05 | Inspection bench: the Visual query editor and the SQL query editor | browser | 45 min | L01 | P3.1, P3.2 |
| L06 | Tension meter: an eventhouse, KQL, and OneLake availability | browser | 1 h | L01 | P3.3, P1.5, P1.2 |
| L07 | Warp frame: build a Direct Lake semantic model | browser | 1 h 30 | L01 | S1.2, S1.3, S1.4, S1.1 |
| L08 | Direct Lake shuttle: two flavors, fallback, and a composite model | browser | 1 h 15 | L07 | S2.3, S2.4, S1.7, S1.1 |
| L09 | Jacquard head: calculation groups, dynamic format strings, field parameters | browser + Windows | 1 h 30 | L07 | S1.5, S1.4 |
| L10 | Speed governor: Performance analyzer, DAX query view, and faster DAX | browser + Windows | 1 h 15 | L07 | S2.1, S2.2, P3.4 |
| L11 | Gatehouse: workspace roles, item permissions, and data-level security | browser (one optional Windows step) | 1 h 30 | L02, L04, L07 | M1.1, M1.2, M1.3 |
| L12 | Seal and stamp: endorsement, labels, lineage, and impact analysis | browser | 45 min | L07 | M1.5, M1.4, M2.4 |
| L13 | Pattern ledger and conveyor: Git integration and a deployment pipeline | browser | 1 h 30 | L02, L07 | M2.1, M2.3 |
| L14 | Draft table and pattern book: .pbip, .pbit, .pbids, and shared models | **Windows** | 1 h 15 | L04, L07 | M2.2, M2.6 |
| L15 | Batch winder and remote loom control: incremental refresh, large models, XMLA, OneLake integration | **Windows** | 1 h 45 | L02, L04 | S2.5, S1.6, M2.5, P1.5 |

**Total: 15 labs, 1,125 minutes (about 18.8 hours).**

- 124 steps and 19 cleanup steps; 9 are optional.
- 22 steps need Windows (Power BI Desktop or SSMS).
- 40 "trap you'll see" callouts link to a notes "don't confuse" pair.

By platform: 11 browser, 2 mixed, 2 Windows. On a Mac you can do every browser step. In L09 and L10 you can skip the Windows steps and still complete the lab; L14 and L15 need Windows.

**Sources:**
- Every step cites at least one learn.microsoft.com page or Microsoft's official lab exercise (microsoftlearning.github.io/mslearn-fabric), linked to its section.
- `check:links` confirms all 216 URLs return 200 and all 202 cited sections exist on their pages.
- The exercises are used for steps only, never for notes or questions.
- Workspaces: everything happens in DP600-Dev (deploying goes to DP600-Test). The labs skip each exercise's "Create a workspace" and Copilot sections.

### App features

| Feature | Where |
|---|---|
| **Workshop** tab in each machine's panel, listing its labs with platform, time, and status | `MachineDetail`, `components/labs/Workshop.tsx` |
| **Labs** page (header button): "Before you start" trial facts, trial clock, suggested schedule, all labs in recommended order, partial-coverage notes | `components/labs/LabsPage.tsx` |
| Trial clock: you enter the start date; it shows "N of 60 days left" and the last day. The schedule spreads the remaining labs in order (prerequisites first) up to 5 days before the end, or suggests today if there's no room. | `game/labs.ts` `trialClock`, `suggestSchedule` |
| Lab view: goal, platform, time, prerequisites (links; open ones marked "not done"), machines, numbered steps with a checkbox, source links, a "Check:" checkpoint, a trap callout with a link to the notes pair, Optional/Windows/cost badges, and a per-step **Report a problem** note (saved on this device) | `components/labs/LabView.tsx` |
| **Export lab notes**: downloads `fabric-mill-lab-notes-YYYY-MM-DD.txt` with the trial day, each started lab's status and ticked count, and every problem note with its step text and id. The file starts with a reminder not to include tenant details. | `exportLabNotes` |
| Completion: self-reported, once every required step and cleanup step is ticked. Earns a fixed **75 XP**, shown in the level bar. **Never certifies**; machine progress is untouched (unit tested and checked in e2e). | `completeLab`, `labXp` |
| Debrief: opens after completion. 3 bank questions on the lab's bullets (never case-study questions), spread over different bullets. Logged as `[id, 0|1, t, 'l']`, counted in readiness like inspections. Earns normal question XP; certifies nothing. | `drawDebrief`, `recordDebrief`, the `AttemptPanel` debrief mode |

Privacy: problem notes stay in localStorage and the save export. `check:content` rejects lab text that looks like an email/UPN, an XMLA workspace URL, a warehouse connection string, a workspace URL, a GUID, a GitHub token, or a password. Steps that show tenant-specific strings (OneLake path, server name, repository URL, token, workspace URL) warn you not to paste them.

### Checks added

- `check:content` (`src/content/labs/validate.ts`):
  - schema, ids, and order
  - machines and bullets; a bullet must belong to one of the lab's machines
  - prerequisites: earlier in the order, acyclic
  - every step has ≥1 source, from the two allowed sites only
  - cleanup present
  - trap pairs exist
  - a cost warning only on optional steps
  - Windows steps vs the lab's platform
  - each machine's `labPlatform` matches its labs
  - `BANNED_TERMS`, trial-unavailable features, and private patterns
  - checkpoints mention no numbers except trial facts (4, 60, 64)
  - every lab has a debrief pool of ≥3 non-case questions
  - every bullet is covered or listed in `LABS_UNCOVERED`
  - it also prints the lab summary
- `check:links` now includes lab pages and checks every cited `#section` id.
- Machine `labPlatform` values now come from the labs (no `tbd` left). A `mixed` value was added. The panel shows "Browser, plus some steps that need Power BI Desktop (Windows)", and the map chip reads "Lab · part Windows".

## Exam bullets with no hands-on lab

**None.** All 41 bullets are covered (`LABS_UNCOVERED` is empty). Four are covered only in part (`LABS_PARTIAL`, shown on the Labs page):

| Bullet | Why only in part |
|---|---|
| S1.3 (bridge tables, many-to-many) | Lab 7 builds one-to-many and inactive relationships. The lab data has no many-to-many case, so no step builds a bridge table. |
| M1.4 (sensitivity labels) | Needs Microsoft Purview labels published in your tenant. Lab 12 asks you to record it if none exist. |
| M1.3 (RLS/CLS/OLS/file-level) | Checking CLS and what another user sees needs a second account (optional steps). Semantic model OLS needs Power BI Desktop (optional Windows step). Warehouse RLS, DDM, OneLake security roles, and semantic model RLS with Test as role run in the browser. |
| M1.2 (item permissions) | Sharing with someone needs a second account. Without one, Lab 11 shows the share options only. |

## Labs most likely to have stale steps

UI-heavy, browser model editor, Preview, or tenant-setting dependent:

1. **L08 Direct Lake shuttle.** It relies on the browser model editor (Editing mode, Get data, the Direct Lake behavior property) and on DAX query view in the browser. That view needs the Preview workspace setting "User can edit data models in the Power BI service (preview)".
2. **L09 and L10 (browser parts).** Calculation groups and dynamic format strings in the browser editor; Learn's dynamic format string steps are written for the Desktop ribbon. Performance analyzer in the browser; DAX query view (same Preview setting).
3. **L11 Gatehouse.** RLS roles in the browser editor, and OneLake security roles in a lakehouse (OneLake security's release status is an open Step 8 item).
4. **L06 Tension meter.** The Real-Time Intelligence sample tile and the Real-Time hub UI change often.
5. **L13 Pattern ledger and conveyor.** Git integration depends on tenant switches you may not control; the deployment pipeline UI was redesigned recently.
6. **L15 Batch winder.** Incremental refresh on a column converted in Power Query, OneLake integration (tenant setting and SKU list), and SSMS's partition view.
7. **L03 Carding (Data Wrangler).** The operation names and the export UI.
8. **L01 Open the mill.** The Account manager trial flow and the workspace type picker.

## Reviewer findings and resolutions

A separate reviewer agent walked all 15 labs and fetched every cited page (all 200, every section present). It reported **47 findings: 2 blockers, 15 major, 30 minor**. All 47 are resolved. Full log: `docs/reviews/step-6-lab-review.md`. The main ones:

| # | Lab | Finding | Resolution |
|---|---|---|---|
| R1 (blocker) | L07 | The inactive ship-date relationship was never created, so the USERELATIONSHIP measure would fail. | All four relationships are created; the checkpoint checks the inactive one. |
| R2 (blocker) | L04 (optional) | The SCD sections need tables a new warehouse doesn't have. | Run the exercise's table sections first. |
| R4, R11, R12 | L11, L14, L15 | Missing prerequisites (Mill_Warehouse, a lakehouse). | Prerequisites added; items named. |
| R5 | L07, L11 | Test as role needs a saved report. | L07 saves "Sales Report"; L9–L11 use it. |
| R6, R7, R8 | L08, L10, L11 | Browser steps cited Desktop pages or had no how-to; DAX query view's workspace setting wasn't mentioned. | Rewritten with `service-edit-data-models` and `direct-lake-web-modeling`; the setting is named. |
| R9 | L06 | Database-level OneLake availability skips existing tables. | "Apply to existing tables" or table level; the delay is mentioned. |
| R13 | L15 | Sample orders are dated January–June 2026, so a careless range loads nothing. | The range and archive period are spelled out. |
| R14 | L14 | Export PBIDS for a Fabric warehouse isn't confirmed on Learn. | "Report it and skip" instruction; added to the Step 8 queue. |
| R15, R16 | L13 | An empty repo has no branch; the first sync makes the commit step empty. | Create the repo with a README; connect-and-sync replaces the first commit step. |

I checked the evidence for the blockers and the main major findings on Learn myself before fixing them.

## e2e results (`npm run e2e`)

| Spec | desktop-1440 | phone-390 |
|---|---|---|
| **lab-flow (new)**: open Labs → set the trial start date (4 days ago) → "56 of 60 days left" and a 15-item schedule → open Lab 5 → tick a step → add and save a problem note (trap callout visible) → export (filename and contents: lab, step id, note, "day 5 of 60") → tick all required steps → complete (+75 XP exactly, `completedAt` saved, no machine progress) → debrief 3 of 3 (logged as three `'l'` answers, XP rises, no machine progress) → the machine's Workshop tab shows Complete and opens the lab | ✓ | ✓ |
| machine-flow | ✓ | ✓ |
| placement-flow | ✓ | ✓ |
| puzzle-flow | ✓ | ✓ |

**8 passed.** Interaction is by tap. The date and note fields are filled with text, since typing is the only way to enter them. Every spec asserts no page errors, and the lab flow asserts no sideways scrolling at 390 px. Screenshots: `PW_SHOTS=<dir>`.

## Tests and checks

| Check | Result |
|---|---|
| `npm test` | 219 passed (22 files). New: `src/game/labs.test.ts` (13) and `src/content/labs/validate.test.ts` (12). |
| `npm run check` (typecheck, lint, content, secrets, tests) | Passes |
| `npm run build` (+ bundle check) | Passes; the `?seed=` hook isn't in the production bundle |
| `npm run check:links` | 216 URLs return 200; 202 lab sections exist |
| `npm run e2e` | 8 passed (4 specs × 2 widths) |
| `npm run check:secrets` | Passes |

## Things I'm unsure of

- **Every lab is untested in Fabric.** In particular:
  - adding an Import table in the browser editor (L08/s6)
  - the TABLETRAITS fallback reason for a view table (L08/s3)
  - a dynamic format string in the browser with a calculation group present (L09/s4)
  - incremental refresh on a date converted in Power Query (L15/s2)
  - Export PBIDS for a Fabric warehouse (L14/s5)
- **OneLake security roles** (L11/s7): the lab tells you to report it if your lakehouse doesn't offer them; its release status is still an open Step 8 item.
- **The trial-size admin path** (L01/s3) depends on your role; most learners can only read the size.
- **The DAX expressions I wrote for L10/s3–s4 and L09/s4** (SUMMARIZECOLUMNS, DEFINE MEASURE, an IF-based format string) follow the cited DAX reference pages but haven't been run against the lab model.

## Deviations from the request

- **15 labs instead of about 14.** The suggested "Lifecycle tools" lab became two Windows labs (L14 for .pbip/.pbit/.pbids/shared models, L15 for incremental refresh, large format, XMLA, and OneLake integration), so the total is 18.8 hours rather than the plan's ~15.
- **L01 has no exam bullets** (orientation only). Its debrief draws from the orientation machines' questions.
- **The debrief opens only after completion.** It's reached by completing the lab, as in your e2e sequence.
- **A `mixed` platform value** was added, for labs that are mostly browser with optional or skippable Windows steps. Machine `labPlatform` is now derived from the labs and enforced.
- **One extra Part A change** (DLS-13's explanation) came from a later rescan.
- **The reviewer agent couldn't write its findings file**, so it returned them as text; I saved them to the review log.

## Step 8 queue added in Step 6

- Conveyor: Contributor vs Member to deploy an existing semantic model or paginated report.
- Direct Lake Shuttle: SQL endpoint OLS/CLS (fallback vs error); OneLake + SQL RLS (success vs error); DDM as a fallback cause (single source).
- Pattern Book: Export PBIDS for a Fabric warehouse source.
- Removed: the Mill Lease trial-size item (resolved).

Step 7 waits for your approval.
