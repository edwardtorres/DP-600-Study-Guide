# Step 2 audit: Review fixes and Learn-sourced notes

Step 2 is pushed to `main` in five commits: `f32af42` (Part A fixes and the notes framework), `5aff8d3` (Front Office), `3a58ec9` (Spinning Floor & Dye House), `401e3e0` (Loom Hall), and `cd1bc70` (Gatehouse & Pattern Room, strict check on). All are authored as the noreply address and none has a session link.

## Results

| Check | Result |
|---|---|
| Typecheck, lint | pass |
| `npm test` | 39/39 pass in 6 files |
| `check:content` (strict: no floor pending) | pass. All 35 machines have notes, every bullet is covered, every item cites Learn, and all 9 required pairs are present. |
| `check:content -- --live` | live study guide still matches the recorded outline (41 bullets) |
| `check:links` (new) | 113/113 cited Learn URLs return 200 |
| `check:secrets` | pass |
| `npm run build` | pass |
| UI check (Playwright) | notes panel and Pattern Dictionary (154 terms) render at 1440 px and 390 px, with no page-level horizontal scroll and no page errors |

## Part A: fixes applied

1. Thread Intake, Carding Machine, Twisting Frame, Dye Vat, and Weave Planner are now **PL-300 · partial**, with your caveat text verbatim. The chip shows "partial" on the map. CLAUDE.md now has the rule that placement checks for partial-carryover machines use DP-600 tools and terms, never Power Query-only terms.
2. **Gate Keys → Remote Loom Control** uses your reason text, verified against service-premium-connect-tools.
3. **Gate Keys → Pattern Ledger** is marked verified against git-integration-process, which says only Admin can connect or disconnect.
4. **Pattern Ledger → Conveyor** reason: "Taught after Git integration so you can compare the two lifecycle tools; deployment pipelines don't require Git."
5. Neither edge is on the needs-verification list. That list is now data in the repo (each machine's `needsVerification`), and `check:content` prints it.

Verified edges show a "✓ verified on Microsoft Learn" link in the detail panel.

## Notes by floor

Word counts cover prose only: code isn't counted, but step explanations are.

| Floor | Machines | Words | Unique sources | Worked examples | Glossary terms |
|---|---|---|---|---|---|
| Front Office | 4 | 2,133 | 14 | 0 | 22 |
| Spinning Floor & Dye House | 12 | 7,042 | 47 | 14 | 53 |
| Loom Hall | 9 | 5,640 | 36 | 10 | 44 |
| Gatehouse & Pattern Room | 10 | 4,565 | 35 | 4 | 35 |
| **Total** | **35** | **19,380** | **113** (deduplicated) | **28** | **154** |

Worked examples by language: DAX 11, T-SQL 9, PySpark 3, TMSL 2, Spark SQL 1, KQL 1, Power Query M 1. All 14 machines that require code have at least one example, and every example is marked illustrative with an explanation per step.

## "Don't confuse" pairs (37)

The 9 you required are in **bold**.

- Workload vs item (Founding Charter)
- Capacity vs workspace (Water Wheel)
- **Lakehouse vs warehouse vs eventhouse**, by write, query, and store (Three Vats)
- Fabric trial capacity vs Power BI individual trial (Mill Lease)
- Shortcut vs mirroring vs copy (Copy job, Copy activity, COPY INTO) (Thread Intake)
- Dataflow Gen2 vs pipeline vs notebook (Thread Intake)
- OneLake catalog vs Real-Time hub (Bale Catalog)
- Warehouse vs SQL database in Fabric (Vat Selector)
- Eventhouse OneLake availability vs semantic model OneLake integration (Shared Spool)
- WHERE vs HAVING vs QUALIFY (Carding Machine)
- Merge (join) vs append (union) (Twisting Frame)
- SCD type 1 vs type 2 (Weave Planner)
- Star vs snowflake dimension (Weave Planner)
- Visual query editor vs SQL query editor (Inspection Bench)
- **SQL analytics endpoint vs warehouse**: read-only parts, and where views, functions, and procedures live (Recipe Book)
- KQL project vs extend (Kusto Tension Meter)
- DEFINE MEASURE vs model measure (DAX Scale)
- **Import vs DirectQuery vs Direct Lake vs composite** (Loom Gearbox)
- Regular vs limited relationship (Warp Frame)
- HASONEVALUE/SELECTEDVALUE vs ISINSCOPE (Punch-Card Reader)
- Calculation group vs field parameter (Jacquard Head)
- Dynamic format string vs FORMAT() (Jacquard Head)
- Dual table vs hybrid table (Double Loom)
- DAX query time vs visual display time (Speed Governor)
- **Direct Lake on OneLake vs Direct Lake on SQL analytics endpoint** (Direct Lake Shuttle)
- **Direct Lake fallback**: no fallback vs DirectQuery fallback, and DirectLakeBehavior (Direct Lake Shuttle)
- Framing vs Import refresh (Direct Lake Shuttle)
- Archive period vs incremental refresh period (Batch Winder)
- Member vs Contributor (Gate Keys)
- **Workspace roles vs item permissions vs RLS/CLS/OLS** (Item Locks)
- CLS vs semantic model OLS vs dynamic data masking (Thread Sieves)
- **Endorsement (promoted, certified, master data) vs sensitivity labels** (Seal & Stamp)
- Git commit vs update (Pattern Ledger)
- **Deployment pipelines vs Git integration** (Conveyor)
- Lineage view vs impact analysis (Ripple Map)
- XMLA read-only vs read-write (Remote Loom Control)
- **.pbix vs .pbip vs .pbit vs .pbids** (Pattern Book)

## Renamed features

Only renames that Learn states in words are listed.

- **Power BI dataset → semantic model.** Learn: "Microsoft renamed the Power BI dataset content type to … semantic model." The exam likely says "semantic model", because the current study guide uses it throughout.
- **Power BI dataflow → Dataflow Gen1.** Learn: the original Power BI Dataflow is "now called Gen1". The study guide says "dataflows"; expect Dataflow Gen2 in Fabric scenarios.
- **License mode → workspace type.** Learn: "This is a terminology change only." The study guide uses neither term.
- *Not listed*: **OneLake data hub → OneLake catalog.** The old Learn URL redirects to the OneLake catalog page, and the share-items page uses both names, but no page states the rename. It's on the needs-verification list.

## Preview labels (11)

- Fabric IQ (Founding Charter)
- BCP API for warehouse ingestion (Thread Intake)
- AI functions in Fabric Data Warehouse (Vat Selector)
- ALTER TABLE … ALTER COLUMN in Warehouse (Carding Machine)
- Nested common table expressions (Inspection Bench)
- Performance Analyzer "Evaluated parameters" (Speed Governor)
- Calculated tables in Direct Lake on OneLake (Direct Lake Shuttle)
- "User Context only" calculated columns in Direct Lake on OneLake (Direct Lake Shuttle)
- OneLake security enforcement in third-party engines (Thread Sieves)
- Git integration for semantic models, marked "(preview)" in Learn's supported-items list (Pattern Ledger)
- New deployment pipelines UI (Conveyor)

## Dated changes

- **Upcoming, 2026-12-01:** users without read-write permissions on workspace items can't use Git integration (Pattern Ledger).
- **Already in effect, recorded as exam traps:**
  - Default semantic models are no longer auto-created (since 2025-09-05) and existing ones were decoupled by 2025-11-30 (Three Vats, Loom Gearbox).
  - Deployment pipelines dropped support for semantic models without Enhanced Metadata from 2026-02-12 (Conveyor).

## Needs verification (Step 8 queue, 8 items)

1. Mill Lease: the trial page says "Real-Time Analytics" while the overview says "Real-Time Intelligence". No page states a rename.
2. Bale Catalog: OneLake data hub → OneLake catalog. Only the URL redirect and mixed usage are evidence.
3. Carding Machine: PySpark de-duplication and null-handling code. The Learn pages read show Data Wrangler operation names only, so the notes use T-SQL.
4. Recipe Book: whether scalar UDFs are supported in Fabric Warehouse. Inline TVFs are confirmed.
5. Recipe Book: materialized views. **Learn contradicts itself**: the warehouse overview lists them, the T-SQL surface area says they're unsupported.
6. Thread Sieves: whether OneLake security is GA apart from the third-party engine preview.
7. Conveyor: the exact role needed to deploy between stages.
8. Remote Loom Control: whether Tabular Editor 2 and SQL Server Profiler are Windows-only. This matters for Step 6 lab labels.

## Learn pages

**Unreachable:** none. Every page the notes cite returned 200 when written and again at the final link check.

**Guessed URLs that 404'd** (wrong guesses, not outages; I found and cited the right pages instead):
- fabric/data-warehouse/object-level-security → sql-granular-permissions
- fabric/data-warehouse/stored-procedures
- fabric/data-warehouse/cross-warehouse-query and create-table-as-select → covered by query-warehouse and ingest-data
- the non-Fabric QUALIFY path → select-qualify-clause-transact-sql?view=fabric
- dax/best-practices/dax-avoid-converting-blank-values
- two old Power BI "data hub" pages

**Redirects I didn't cite:**
- fabric/fundamentals/direct-lake-manage → direct-lake-security-integration. I used direct-lake-how-it-works instead.
- data-factory/decision-guide-data-transformation → a cost benchmark page.

## Deviations from the prompt

- **Some code isn't PySpark.** The Carding Machine examples are T-SQL only. Learn's Fabric pages show Data Wrangler's cleaning operations but not the PySpark calls, so I didn't write PySpark from memory (needs-verification item 3).
- **Raw sentence extracts weren't committed**, as planned. They stay outside the repo; Step 8 re-fetches the pages.
- **Past dated changes are traps, not "upcoming".** The field is for future dates, so changes that already happened (2025-09-05, 2025-11-30, 2026-02-12) are recorded as traps.
- **Extra code examples.** Shared Spool and Remote Loom Control have TMSL examples, though they weren't required to have code.
- **Glossary is stricter than asked.** Each term is defined once app-wide, enforced by the check.
- **New command:** `npm run check:links`. It isn't part of `npm run check` because it needs the network.
- **Small UI fix after the floor commits:** code-language chips no longer wrap on phones.
- **Phone layout:** the detail panel is a bottom sheet. To pick another machine on a phone you close the sheet first (Esc or ✕).

Step 3 starts only after approval.
