# Step 5 puzzle review

A fresh reviewer agent that didn't write the puzzles reviewed them in two passes. It worked only from the exported files and learn.microsoft.com, never the repo.

## Sample

`npm run export:puzzles` drew a fixed sample: at least 30% of each type, plus every Shuttle Fallback, Access Matrix, and Conveyor scenario. Query Oracle templates were played at seed 2026.

| Type | Total | Sampled |
|---|---|---|
| Query Oracle | 40 (T-SQL 14, KQL 13, DAX 13) | 13 (5 + 4 + 4) |
| Pattern Draft | 8 | 3 |
| Gearbox Picker | 26 (13 + 13) | 8 (4 + 4) |
| Shuttle Fallback | 14 | 14 (all) |
| Access Matrix | 10 | 10 (all) |
| Ripple | 5 | 2 |
| Conveyor | 6 | 6 (all) |
| **Total** | **109** | **56 puzzles, 168 decisions** |

## Blind pass

**Agreement: 168/168 decisions.** For the oracle puzzles, the reviewer computed every result by hand, and each matched exactly one candidate.

The replacements SF-15 and SF-16 were also answered blind before the source pass, and both matched.

## Disagreements with Learn and resolutions

| Item | Finding | Resolution |
|---|---|---|
| SF-08 (SQL analytics endpoint OLS, Automatic) | Learn contradicts itself. *How Direct Lake works* treats OLS as a fallback cause ("accept DirectQuery fallback"). *Integrate Direct Lake security* says the query "returns an error". | **Dropped.** The evaluator no longer encodes `sql-ols` (it returns null, so the content check rejects any scenario that uses it). |
| SF-05 (Direct Lake on OneLake + SQL endpoint RLS) | Learn contradicts itself. The overview says "queries will succeed, and SQL based RLS is not applied". The security page says an error is returned. | **Dropped.** Rule FB-2 was removed, and the evaluator returns null for this case. GB-S08's explanation no longer claims either outcome. |
| SF-15, SF-16 | Replacements. SF-15 is SQL RLS with DirectLakeOnly (error); SF-16 is a SQL view with DirectQueryOnly (DirectQuery). Both are stated on how-it-works and the security page. | Added. Answered blind; both matched. |
| PD-01, PD-03 key-Date (source pass) | The key accepted a meaningless surrogate. Learn: the date surrogate key "should store the date by using YYYYMMDD format and the int data type". | **Fixed.** Only the YYYYMMDD integer key is accepted. The choice was relabelled and its explanation now quotes Learn. |
| SF-07 (DDM, DirectLakeOnly) | Only how-it-works lists DDM as a fallback condition. No page contradicts it. | Kept, and flagged in the audit for Step 8. |
| QO-T09 choice r2 | The explanation said "1 PRECEDING". The table matches the frame UNBOUNDED PRECEDING AND 1 PRECEDING. | Wording fixed. |
| Oracle sources | Trap pages in other languages were cited (for example, KQL pages on T-SQL puzzles). QO-T01 cited QUALIFY without using it. | Each instance now cites only pages in its own language. DAX `ORDER BY` and `FILTER` pages were added to the matching traps, and QUALIFY was removed from QO-T01. |
| AM-01, AM-02, AM-09, AM-10 | Workspace action explanations repeated one generic paragraph. | Each now names the action, the roles that have it (from the roles table), and the user's role. Sharing also cites "You must be an admin or member in your workspace to share an item". |
| SF explanations | Wrong choices said only "Not here."; internal rule ids showed. | Each wrong choice now says "<outcome> isn't what happens here", followed by the rule. Rule ids are hidden. FB-6 again lists OLS among the conditions. Both pages agree OLS prevents Direct Lake; they disagree only on what happens instead. |
| PD grain | Wrong grain choices had a generic explanation. | They now restate why the accepted grain is right. |
| PD-06 scd-CustomerName | The intro didn't say how names change. | The story now says name changes are corrections. |
| RP-01, RP-03 (impact analysis "Limited access") | It wasn't stated whether the user can see the other workspace. | Every Ripple story now says "You have access to every workspace shown." |
| CN-03 b3 | "Tries a rule" could be read as the deployment failing. | Reworded: Mia looks for a rule, then deploys anyway. |
| CN-05 a3 | Deploying to an empty stage may also need capacity assignment rights. | The story now says everyone may assign workspaces to the capacity. Learn: without that permission, the workspace is created but content isn't copied. |
| GB-S07 | Assumed the default Direct Lake behavior. | Stated in the scenario. |
| AM-05, AM-07, AM-09, AM-10 | The correct answer-set choice always had id `s0`, which leaks in exported files and DOM attributes. | Set ids now follow label order. On screen, choices are also shuffled per play. |

**Kept as is, with notes:**
- PD-01 UnitPrice as a measure: Learn lists unit price as a non-additive measure.
- PD-06 grain: one row per transaction, which is Learn's bridge design.
- PD-03 date roles: the explanation says only one relationship is active.
- GB-D10: the SQL Server warehouse framing decides it.
- GB-S04: mirroring is an alternative, but Import is still the best answer.
- RP and impact analysis: the page was last updated in 2023, so recheck it in Step 8.
- Conveyor: the December 1, 2026 change for workspaces with protected sensitivity labels isn't used by any puzzle.

## Source pass verdict (after fixes)

The reviewer fetched all 63 cited URLs, and all returned 200. Verdicts by type:
- Query Oracle: supported.
- Pattern Draft: partly supported before the key-Date fix; supported after it.
- Gearbox Picker, Shuttle Fallback, Access Matrix, Ripple, Conveyor: supported.

`check:links`: 181 Learn URLs return 200.
