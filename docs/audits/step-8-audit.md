# Step 8 audit: mock freshness, needs-verification queue, full claim audit, staying current

Full detail: `docs/reviews/step-8-fact-check.md` (report) and `docs/reviews/step-8-claims/` (one ledger per checker group, one row per claim).

## Part A: mock freshness

- A full mock counts toward ready to book only if at least **50%** of its main-section questions weren't answered, in any attempt type (puzzles excluded), in the **14 days before it started**.
- **Stale mocks:** a stale mock is skipped. It neither counts nor breaks the run of two.
- **Where freshness shows:**
  - each record
  - the results page ("Freshness: 72% of main-section questions not answered in the 14 days before this mock")
  - the history ("fresh 72%" and a "doesn't count" tag)
  - the ready-to-book panel, which lists each stale mock and why it didn't count
- **Save v6:**
  - `freshness` on `MockRecord` and `ActiveMock`.
  - Migration `{ from: 5 }` computes it from the answer log, excluding case questions.
  - Tested on a **real v5 save captured from the Step 7 app**, plus a synthetic case.
- **Tests:**
  - freshness boundaries (exactly 14 days, after the start, puzzles, each code)
  - stale mock skipped, stale passing mock not counted, stale mock between two passing fresh mocks
  - the reasons the panel shows
  - the v5 migration
  - a component test of the panel
  - e2e checks of freshness in results and history

## Part B: needs-verification queue

| # | Item | Verdict |
|---|---|---|
| 1 | OneLake data hub → OneLake catalog | Unsupported as a stated rename (both names appear on current pages) |
| 2 | Real-Time Analytics → Real-Time Intelligence | Unsupported as a stated rename (the trial page still uses the old name) |
| 3 | PySpark de-duplication and nulls | **Resolved** (Learn training unit shows dropDuplicates, fillna, dropna) |
| 4 | Scalar UDFs in Fabric Warehouse | **Resolved: preview**, must be inlineable for SELECT … FROM on user tables |
| 5 | Materialized views | Still contradictory (overview vs T-SQL surface area) |
| 6 | OneLake security release status | Unsupported as GA (only the third-party parts are labelled preview) |
| 7 | Contributor vs Member to deploy | Still contradictory (two tables on one page) |
| 8 | SQL OLS/CLS under Direct Lake on SQL | Still contradictory (fallback vs error) |
| 9 | Direct Lake on OneLake with SQL RLS | Still contradictory (success vs error) |
| 10 | DDM as a fallback cause | **Resolved** (How Direct Lake works, stated twice, not contradicted) |
| 11 | Impact analysis page age | **Resolved** (still current; agrees with newer pages) |
| 12 | Export PBIDS for a warehouse | Unsupported (the lab step is now a reported experiment) |

- The exact Learn sentences for each verdict are in section 1 of the report.
- **Notes now carry a "Learn pages disagree" block** for every contested point.
- **`BANNED_TERMS`:**
  - Removed: scalar UDF, dropDuplicates/fillna.
  - Added: patterns for the OLS/CLS fallback claim and the Contributor deploy claim.
  - The queue is now empty.
- **New questions:**
  - CM-V1–V3: PySpark.
  - RB-V1–V2: scalar UDFs, preview.
  - DS-V1–V2: DDM fallback.
  - Blind review: 7/7 match, 3 minor fixes.

## Part C: claim audit

| Group | Claims | Confirmed | Wrong | Unsupported | Source changed | Outdated |
|---|---|---|---|---|---|---|
| Front Office | 213 | 193 | 1 | 19 | 0 | 0 |
| Prepare data | 782 | 747 | 5 | 29 | 1 | 0 |
| Semantic models | 568 | 546 | 4 | 15 | 3 | 0 |
| Maintain | 583 | 550 | 6 | 25 | 2 | 0 |
| Puzzles and labs | 509 | 487 | 4 | 17 | 1 | 0 |
| **Total** | **2,655** | **2,523 (95.0%)** | **20** | **105** | **7** | **0** |

- Every non-confirmed claim was fixed.
- **Changes to keys, puzzle answers, and evaluator rules:**
  - **WP-09 (key changed):** the old key said an end-of-day stock balance sums across products. Learn: "A stock balance measure in an inventory fact table can't be summed across other products." The question was rewritten on Learn's own semi-additive example. Blind re-review: 1/1.
  - **QO-D01 (same computed answer, new basis):** the answer relied on "SUM over no rows is BLANK", which no Learn page states. The query now uses `IF(COUNTROWS(Sales) > 0, SUM(...))`. Learn: "If omitted, BLANK is returned."
  - **Evaluator rules:** all 31 confirmed; none changed.

## Sweeps

- **Preview labels:** all 11 confirmed; one re-sourced. Two labels added (scalar UDFs, deployment plan).
- **GA statements:** confirmed.
- **Renames:** all three confirmed.
- **Dated changes:**
  - The 2026-12-01 Git and deployment items are confirmed. Both were reworded to Learn's exact scope ("certain items", "certain stages").
  - The default semantic model changes are confirmed.
- **Deprecations:** P SKU retirement, Enhanced Metadata for pipelines, and KQL automatic bins are already handled. Nothing the app teaches is newly deprecated.

## Part D: staying current

- **verifiedAt dates:** every cited page (243) and every machine (35) has a verifiedAt date of 2026-10-06. `check:content` enforces it.
- **Machine panel:** shows "Last checked on Learn: 2026-10-06".
- **`npm run check:freshness`:** "Checked 243 cited pages … Freshness check passed: no cited page changed since it was verified." The 20 lab-exercise pages publish no date.
- **Live outline:** `check:content -- --live` reports "Live page matches the recorded outline (41 bullets)". Re-run it after October 19, 2026.

## Tests and checks

| Check | Result |
|---|---|
| `npm test` | 263 passed (26 files) |
| `npm run check` | passes |
| `npm run build` (+ bundle check) | passes |
| `npm run check:links` | 243 URLs return 200; 212 lab sections exist |
| `npm run check:freshness` | passes |
| `npm run e2e` | 12 passed (6 specs × 1440 and 390 px) |
| `npm run check:secrets` | passes |

**Bank:** 471 questions.

| Measure | Value |
|---|---|
| Maintain | 25.3% |
| Prepare | 46.0% |
| Semantic | 28.7% |
| Difficulty 1 / 2 / 3 | 85 / 268 / 118 (25.1% at difficulty 3) |
| Preview | 0.6% |

## Unsure, and deviations

- **Spot-check skipped:** the plan said I would spot-check a sample of the Prepare checker's confirmed verdicts. Usage limits interrupted the checkers twice; each restarted checker resumed from the saved verdicts, so no unit was skipped or checked twice. I did not separately spot-check confirmed verdicts.
- **No checker for my Part B pages:** the Part B pages I added (PySpark training unit, scalar UDF pages) were reviewed through the 7 new questions and by the Prepare checker. I verified the notes I wrote from them myself.
- **Training unit as a source:** the PySpark source is a Learn training unit (learn.microsoft.com/training), not product documentation. Its knowledge-check questions were not used.
- **Questions on a preview feature:** RB-V1 and RB-V2 are about a preview feature (scalar UDFs). Microsoft says preview features may appear when commonly used.
- **Single-source verdict:** DDM is resolved on a single Learn page that states it twice.
- **Distractors reworded, not sourced:** some distractor explanations about general PySpark or T-SQL behaviour had no Learn page that states them. They were reworded to what the cited pages say rather than kept.
- **verifiedAt is the check date:** it records the day of this fact-check (2026-10-06) for every source. A page fixed later in the day keeps that date.
- **Save version bump:** the save moved to v6 for the freshness field, as the save rules require.

Step 9 waits for your approval.
