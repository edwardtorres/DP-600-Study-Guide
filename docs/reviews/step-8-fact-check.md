# Step 8 fact-check report

- **Checked:** 2026-10-06, against the current text of every cited Learn page (243 pages, all HTTP 200).
- **Method:**
  - Every cited page was snapshotted once.
  - `scripts/export-claims.ts` split the content into claim units.
  - Five separate checker agents, none of which wrote the content, split the units into atomic claims. Each claim was matched to the sentence on its cited page that supports it, and given one verdict.
  - Every claim that wasn't confirmed was then fixed.
- **Per-claim ledgers:** `step-8-claims/<group>.md`.

## 1. Needs-verification queue (Part B)

| # | Item | Verdict | What Learn says (exact sentences) | What changed |
|---|---|---|---|---|
| 1 | OneLake data hub → OneLake catalog | **Unsupported** (as a stated rename) | No Learn page states the rename. The old URL `fabric/get-started/onelake-data-hub` redirects to the OneLake catalog overview. Current pages still use the old name, for example Power Query Lakehouse connector: "In the OneLake data hub, select the lakehouse you want to connect to." | The rename claim was removed from the queue. The notes now say both names appear on current Learn pages. Kept in `BANNED_TERMS`. |
| 2 | Real-Time Analytics → Real-Time Intelligence | **Unsupported** (as a stated rename) | Trial page: "Use all Fabric workloads, including Data Factory, Data Science, Data Engineering, Real-Time Analytics, and Power BI." RTI overview: "Real-Time Intelligence is a powerful service…" No page states the rename. | The trial note says the workload list still uses the old name, and to expect Real-Time Intelligence. Kept in `BANNED_TERMS`. |
| 3 | PySpark de-duplication and nulls | **Resolved** | Learn training unit *Shape and clean data* (DP-600 course): `deduped_df = df.dropDuplicates()`, "# Or deduplicate by a business key (keeps one row per order_id) deduped_df = df.dropDuplicates(["order_id"])", `clean_df = deduped_df.fillna({"region": "Unknown", "discount": 0})`, `clean_df = deduped_df.dropna(subset=["customer_id"])` | PySpark concept and worked example added to Carding Machine. Ban removed. 3 new questions. |
| 4 | Scalar UDFs in Fabric Warehouse | **Resolved: preview** | CREATE FUNCTION (Fabric): "Scalar UDFs and external UDFs are preview features in Fabric Data Warehouse." … "In Fabric Data Warehouse, scalar UDFs must be inlineable for use with SELECT ... FROM queries on user tables, but you can still create functions that aren't inlineable…" How-to page: "Scalar UDFs are currently a preview feature in Fabric Data Warehouse." | Preview label, trap, and glossary entry added. Ban removed. 2 new preview questions. |
| 5 | Materialized views | **Still contradictory** | Warehouse overview: "…full multi-table ACID transaction support, materialized views, functions, and stored procedures." T-SQL surface area, under "Currently, the following commands aren't supported": "Materialized views" | Both readings are shown as a "Learn pages disagree" block. Kept out of questions (banned). |
| 6 | OneLake security release status | **Unsupported** (GA claim) | Get started: "Enforce OneLake security in authorized third-party engines (preview)". Integrations page title: "OneLake security integrations overview (preview)". What's New lists only "OneLake security Members and Data UX (Generally Available)". No page calls OneLake security as a whole GA. | A trap says Learn marks only the third-party parts as preview. GA claims stay banned. |
| 7 | Contributor vs Member to deploy an existing semantic model or paginated report | **Still contradictory** (same page) | Permissions table, Contributor: "Deploy items (must be at least a contributor in both source and target workspaces)". "Granted permissions" table: Semantic model → "Workspace member"; Paginated report → "Workspace member". | Contested block added; new banned pattern. |
| 8 | Direct Lake on SQL with SQL OLS/CLS | **Still contradictory** | How it works: "OLS defined at SQL analytics endpoint | Move object-level security to the semantic model, or accept DirectQuery fallback." Security page: "If a query touches a table or column that's restricted by SQL analytics endpoint OLS or column-level security (CLS), the query returns an error." | Contested block; banned pattern; the evaluator still doesn't encode this case. |
| 9 | Direct Lake on OneLake with SQL RLS | **Still contradictory** | Overview: "When Direct Lake on OneLake is employed, queries will succeed, and SQL based RLS is not applied." Security page: "Direct Lake on OneLake doesn't support fallback to DirectQuery mode. If any table in the SQL analytics endpoint enforces RLS … an error result is returned" | Contested block; the evaluator still doesn't encode this case. |
| 10 | DDM as a fallback cause | **Resolved** (one page, stated twice, not contradicted) | How it works: "The semantic model doesn't reference any tables that have SQL dynamic data masking (DDM) defined at the SQL analytics endpoint." and "RLS or DDM defined at SQL analytics endpoint | … accept DirectQuery fallback." | Puzzle SF-07 kept. 2 new questions. |
| 11 | Impact analysis page age (2023-05-23) | **Resolved** (current) | Still Fabric's page. It agrees with the Power BI semantic model impact analysis page (2025-11-01): "In order to perform impact analysis on a semantic model, you must have write permissions to it." It also agrees with the lineage page (2026-04-17): "To explore an item's downstream connections outside the workspace, open the item's impact analysis." | No change; its claims were checked in Part C. |
| 12 | Export PBIDS for a Fabric warehouse | **Unsupported** | "The PBIDS file type only supports data connections that Power BI Desktop also supports, with the following exceptions: Wiki URLs, Live Connect, and Blank Query." There is no Fabric warehouse example. | The Lab 14 step is now an experiment the player reports on; its checkpoint makes no claim. |

## 2. Claim counts by verdict (Part C)

| Group | Units | Claims | Confirmed | Outdated | Wrong | Unsupported | Source changed |
|---|---|---|---|---|---|---|---|
| Front Office | 102 | 213 | 193 | 0 | 1 | 19 | 0 |
| Prepare data | 472 | 782 | 747 | 0 | 5 | 29 | 1 |
| Semantic models | 330 | 568 | 546 | 0 | 4 | 15 | 3 |
| Maintain | 292 | 583 | 550 | 0 | 6 | 25 | 2 |
| Puzzles and labs | 339 | 509 | 487 | 0 | 4 | 17 | 1 |
| **Total** | **1,535** | **2,655** | **2,523 (95.0%)** | **0** | **20** | **105** | **7** |

Every non-confirmed claim was fixed: rewritten to match Learn, re-sourced to a page that states it, or removed. The changes are listed in section 4.

## 3. Changes to answer keys, puzzle answers, and evaluator rules

| Item | Before | After | Learn sentence | Review |
|---|---|---|---|---|
| **WP-09** (question key) | End-of-day StockOnHand "can be summed across products for one day, but not across days" | AgeInDays per item, sampled nightly: "summed across the items on a shelf for one night, but not across nights" | "A stock balance measure in an inventory fact table can't be summed across other products." / "you shouldn't sum the age of an inventory item sampled nightly, but you could sum the age of all inventory items on a shelf, each night." | Blind re-review: 1/1 match |
| **QO-D01** (Query Oracle; same computed answer, new basis) | Revenue = `SUM(Sales[Amount])`; the answer relied on SUM over no rows being BLANK, which no Learn page states | Revenue = `IF(COUNTROWS(Sales) > 0, SUM(Sales[Amount]))` | IF: "If omitted, BLANK is returned." COUNTROWS of an empty table is blank (countrows page). | Engine tests pass; the empty category is still dropped |
| Pattern Draft stock puzzle (explanation only) | "sum it across products or warehouses, but not across days" | Learn's two semi-additive rules, quoted | As for WP-09 | The accepted answer (measure) is unchanged |
| Evaluator rules | — | No change | All 31 rules confirmed (fallback, access, deployment, lineage) | — |

Several other questions had a distractor explanation or option text reworded. None of these changed which option is correct. One example is DT-05's correct option, which now reads "Only metadata was deployed, not the data".

## 4. Fixes by group

### Front Office: fixes

- **N:mill-lease:traps[3] (wrong):** now names both reasons for a missing "Start trial": trials disabled for the tenant, or an existing Power BI individual trial. In the second case, create a Fabric item to get the trial prompt.
- **FO-16 s2:** the connector count is removed, because Learn gives 200+ on one page and 170+ on another. The statement now says Data Factory provides connectors for on-premises and cloud sources. Key unchanged (Yes); the Data Factory overview is added as a source.
- **Exam-framing statements:**
  - Re-sourced to the DP-600 study guide: founding-charter overview[3] and traps[0], water-wheel renamed[0], three-vats overview[0] and [4].
  - Reworded: water-wheel overview[5].
- **founding-charter:**
  - overview[4]: "Everything you create is an item" → "The objects you create inside a workspace … are called items".
  - traps[1]: "Azure subscription or account" → "Learn says you don't need an Azure account".
  - traps[2]: intro-to-deployment-pipelines added as a source.
- **three-vats dontConfuse:** the eventhouse sources are now Eventstream, Kafka, Logstash, SDKs, and dataflows (not "pipelines").
- **mill-lease overview[4]:** the browser and "labs need Windows" inference are removed. It now states only Desktop's listed system requirements.
- **water-wheel traps[2]:** "Pro license" → "Pro or PPU license, or a Power BI individual trial".
- **Questions (keys unchanged):**
  - FO-03: re-sourced (deployment pipelines).
  - FO-23: re-sourced, with c and d explanations reworded to Learn's terms.
  - FO-26: re-sourced (terminology, DAX query view).
  - FO-28: option b explanation reworded.
### Semantic: fixes

- **Wrong (4):**
  - punch-card-reader glossary: window functions are now described as relative (OFFSET), absolute (INDEX), or either (WINDOW).
  - double-loom concept and glossary: "made of one or more source groups".
  - WF-11 s3 explanation: Dual is only available when both tables come from the same source.
  - PC-04 d explanation: partitioning by month accumulates the same month across years.
- **Source-changed (3):** `S.dlManage` now points to direct-lake-security-integration (the target of the redirect). This affects DLS-10, DLS-13, and the Corrowmere case.
- **Unsupported, now reworded or re-sourced:**
  - loom-gearbox:
    - DirectQuery: "Import size limits don't apply".
    - Import refresh: "considerable time".
    - The dataset rename: the unsupported sentence is removed and the study guide is cited.
    - VertiPaq: "in-memory, cache of the columns".
  - warp-frame overview: bi-directional filtering only as needed, re-sourced to relationships.
  - jacquard-head field parameter: + direct-lake-overview.
  - wide-beam trap and WB-06 b: "in-memory model size limit".
  - double-loom chaining: the maximum chain length is three.
  - batch-winder trap: re-sourced to incremental-refresh-overview.
  - Question explanations:
    - WF-09 c, PC-03 d, PC-07 b and d, and CS3-04 d: reworded to what the cited pages say.
    - DL-08 p4: the chain limit.
- **Keys:** none changed.
### Maintain: fixes

- **Wrong (6):**
  - gate-keys Member vs Contributor: a Contributor can share an item if given Reshare permission.
  - item-locks access layers: OneLake security roles are Grant roles (deny by default) that give Viewers access. Only T-SQL and model RLS/CLS/OLS narrow access.
  - thread-sieves RLS steps: define, publish, add members, then Test as role.
  - seal-and-stamp: "almost every item type (Power BI dashboards can't be endorsed)".
  - remote-loom-control TMSL glossary: "export" is replaced by alter and delete (from the TMSL commands reference).
  - conveyor 2026-12-01 change: "assign it to certain stages".
- **Source-changed (2):** CS5-05 and the Corrowmere case now cite direct-lake-security-integration (through S.dlManage).
- **Unsupported in notes:**
  - gate-keys: "broadest control", and Manage access re-sourced to give-access-workspaces.
  - item-locks ReadData/ReadAll: + roles-workspaces.
  - thread-sieves DENY example: narrowed.
  - thread-sieves preview label: re-sourced earlier.
  - seal-and-stamp: endorsement access claims replaced with Learn's "find trusted content".
  - draft-table: "must refresh" removed.
  - conveyor: "many teams use both" removed.
  - Git dated change: "loss of access to certain items".
- **Unsupported in question explanations (17):** reworded to what the cited pages say, or re-sourced:
  - GK-03, IL-05, IL-07 (+ give-access-workspaces), IL-08, IL-09
  - TS-01 (+ CREATE SECURITY POLICY reference), TS-03
  - DT-01, DT-05, DT-H1, RM-04, RM-07, RL-05, RL-07, CS3-05, CS6-05
  - DT-05's correct option now reads "Only metadata was deployed, not the data"; same key.
- **Confirmed but tightened:**
  - Deployment plan marked "(preview)".
  - "Data Factory pipeline".
  - Refresh after a first deployment; data is kept when possible on later ones.
- **Keys:** none changed.
### Puzzles and labs: fixes

- **Evaluator rules:** none changed; all confirmed.
- **Oracle traps:**
  - kql-innerunique (wrong): "kind=inner keeps every matching left row, duplicates included".
  - running-total-frame: reworded so a frame need not end at the current row.
  - Re-sourced (T-SQL SUM, KQL tabular expression statements, T-SQL LEAD, SET ANSI_NULLS, comparison operators and KQL numerical operators, DAX overview filter context): nulls-ignored, operator-order, lag-vs-lead, case-first-match, range-boundary, filter-context.
- **QO-D01:** no Learn page states that DAX SUM over no rows returns BLANK, so the Revenue expression is now `IF ( COUNTROWS ( Sales ) > 0, SUM ( Sales[Amount] ) )`. The IF page says "If omitted, BLANK is returned". The computed answer is unchanged (the empty category is still dropped); the puzzle now rests on stated Learn behaviour.
- **Labs:**
  - L02 s4 trap: + decision-guide-lakehouse-warehouse.
  - L02 s9: new shortcut URL; checkpoint no longer relies on a "shortcut icon".
  - L03 s3 trap: + T-SQL UNION.
  - L07 s2 trap: + direct-lake-overview.
  - L07 s3: delete the model and create it again after a sync error.
  - L09 s6: checkpoint "Mark as date table shows On".
  - L11 s1 (wrong): Contributor can share with Reshare permission.
  - L11 s9: createOrReplace claim removed.
  - L11 c1: unsupported parenthetical removed.
  - L13 s2: README claim removed.
  - L13 s3 (wrong): connect to a new empty folder; unsupported items are ignored (+ intro-to-git supported items).
  - L13 s6 and s9: checkpoints match Learn.
  - L15 s4: archive at least 2 years.
  - L15 s9: XMLA Read Write is needed to script metadata.
  - L15 c2 (wrong): workspaces move to Pro; non-Power BI Fabric items become inactive.
### Prepare: fixes

- **WP-09 (KEY CHANGED):** rewritten on Learn's own semi-additive example (AgeInDays per item per night).
  - Before: "end-of-day StockOnHand can be summed across products for one day, but not across days".
  - Learn says a stock balance "can't be summed across other products".
  - After: "summed across the items on a shelf for one night, but not across nights".
  - Blind re-review matched (1/1).
- **Pattern Draft stock puzzle:** the OnHandQty explanation no longer says it sums across products. The accepted answer (measure) is unchanged.
- **Wrong in notes (4):**
  - Mirroring glossary: database vs metadata mirroring.
  - ALTER TABLE preview note: + NOT ENFORCED constraints.
  - KQL between example: end is now 23:59:59.
  - summarize nulls: count() counts nulls.
- **Source-changed:** the Corrowmere case (fixed through S.dlManage).
- **Unsupported in notes:**
  - dataflow rename: + study guide.
  - Vat Selector: "in order" removed.
  - "usually the latest" → "for example the latest".
  - Filtering early: + training unit.
  - DAX calculated-column clause removed.
  - KQL example: + between and string-operator pages.
- **Unsupported question explanations:**
  - Re-sourced:
    - BC-08: KQL queryset, Copy job.
    - VS-05: mirroring.
    - VS-09: database shortcut.
    - CM-02: OVER clause.
    - CM-03: NULLIF, CONCAT.
    - CM-11: CAST, FORMAT.
    - CM-20: WHERE.
    - WP-17: UNION, EXCEPT.
    - IB-09: KQL sort.
    - RB-01: CREATE VIEW, CTE.
    - RB-08, RB-10: CREATE PROCEDURE.
    - TF-05, TF-10, DV-01: training units.
  - Reworded to Learn-backed statements: SS-03, TF-05, TF-08, TF-10, DV-09, RB-08, RB-10, RB-H2, IB-H2, CS2-01.
- **Contested:** an inline TVF release-status entry (the CREATE FUNCTION page labels it both ways).

## 5. Sweeps

- **Preview/GA:**
  - All 11 Preview labels match their pages: Fabric IQ, BCP API, AI functions, ALTER COLUMN, nested CTEs, Performance Analyzer's Evaluated parameters, Direct Lake on OneLake calculated tables and columns, OneLake security third-party engines, Git for semantic models, and the new deployment pipeline UI.
  - The OneLake security third-party label cited a page that doesn't mention it, so it was re-sourced.
  - New labels: scalar UDFs (preview) and the deployment plan (preview).
  - GA statements confirmed: MERGE is GA; standard and sequential CTEs are GA.
  - Preview questions: 3 of 471 (0.6%).
- **Renames:** all three are confirmed. License mode → workspace type ("License mode is now called workspace type."); Power BI dataflow → Dataflow Gen1 ("the original Power BI Dataflow (now called Gen1)"); dataset → semantic model. The OneLake data hub and Real-Time Analytics renames aren't stated on Learn (queue items 1 and 2).
- **Dated changes:**
  - Git integration, 2026-12-01: confirmed ("Starting December 1, 2026, users without read-write permissions on workspace items can't use Git integration…"). The note now says "loss of access to certain items".
  - Deployment pipelines, 2026-12-01: confirmed, now with "to certain stages".
  - Default semantic models: confirmed, not created since September 5, 2025, and decoupled by November 30, 2025 (four pages agree).
- **Deprecations found on cited pages:** P SKUs being retired (the notes already say so); deployment pipelines dropping models not upgraded to Enhanced Metadata (the notes already say so); KQL automatic hourly bins removed (KT-10 already teaches that hourly bins aren't automatic); argmax() alias deprecated (not used); 32-bit Desktop unsupported (not used).

## 6. New questions for resolved items

CM-V1–V3 (PySpark), RB-V1–V2 (scalar UDFs, preview), and DS-V1–V2 (DDM fallback). Reviewed blind 7/7; 3 minor fixes (see `step-8-question-review.md`).

## 7. check:freshness and the live outline

- `npm run check:freshness` (2026-10-06): "Checked 243 cited pages … Freshness check passed: no cited page changed since it was verified."
  - The 20 microsoftlearning.github.io exercise pages publish no date, so they're listed as not comparable.
- `npm run check:content -- --live`: "Live page matches the recorded outline (41 bullets)."
  - The October 19, 2026 outline takes effect after this step; re-run it after that date.
