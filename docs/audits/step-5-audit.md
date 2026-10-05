# Step 5 audit: Part A fixes + puzzles

Commits on `main`:
- 3c8e385 Part A
- f410415 puzzle engine and content
- 60ff855 Puzzle bench UI
- a3e92fe review tooling
- cbe65b9 blind-review fixes
- the source-pass fixes and this audit

## Part A results

| Fix | Result |
|---|---|
| 1. Inspection retry lock | After a second failed inspection on a machine in one local day, its inspections lock until the next day. The panel and the result screen show: "Two inspections failed today. Inspections for this machine reopen tomorrow…". The first retry stays immediate, with a new draw. Failure days are stored per machine (`inspectionFails`, save v3). Tests cover the lock, the 23:59 and 00:01 boundaries in America/Los_Angeles and Asia/Tokyo, other machines unaffected, and a pass after one fail. e2e checks the lock at both widths. |
| 2. Readiness inputs | Only `READINESS_CODES = ['i','p','z']` count (Step 7 adds review and mock). Start-up checks are excluded, and puzzle plays count toward accuracy and bullet coverage. Tooltip and caption updated; tests added. |
| 3. `?seed=` dev only | Moved to `src/game/seed.ts` behind `import.meta.env.DEV` (`src/game/random.ts`). A unit test stubs DEV=false and shows the seed is ignored. `npm run build` now runs `scripts/check-bundle.ts`, which fails if the hook's marker or a `get("seed")` lookup is in the production JS. Control: a dev-mode build does contain it. |
| 4. Ordering shuffle | At least ceil(n/2) items start out of place (bounded reshuffle, then a rotation fallback). The 200-seed test over every ordering question passes against the new rule. |
| 5. `npm run e2e` | `@playwright/test` 1.63.0 and `playwright.config.ts` (dev server, desktop-1440 and phone-390 projects, `hasTouch`). Specs: `machine-flow`, `placement-flow`, and (new) `puzzle-flow`. Tap only; native selects use `selectOption`. Excluded from Vitest. |
| Save v3 | Adds answer code `'z'` and per-machine `inspectionFails`. Migration `{ from: 2 }` changes no data. Tested on `src/save/fixtures/save-v2.json`, a real save captured from the Step 4 app, and still on the v1 fixture. |

## e2e results (`npm run e2e`)

| Spec | desktop-1440 | phone-390 |
|---|---|---|
| machine-flow (notes → start-up → inspection → certified → Water Wheel idle; then two failed inspections → lock message, button disabled) | ✓ | ✓ |
| placement-flow (Loom Gearbox 4/5 fails and blocks same-day retry; Warp Frame 5/5 placed and DAX Scale unlocks; DAX Scale 5/5 placed) | ✓ | ✓ |
| puzzle-flow (one puzzle of each type solved by tap; XP rises each time; machines stay idle; a locked machine's bench is disabled) | ✓ | ✓ |

**6 passed.** Every spec asserts no page errors and no sideways scrolling at 390 px. Screenshots of every puzzle type at both widths can be produced with `PW_SHOTS=<dir>`.

## Puzzles

Puzzles are practice. A play logs one `[id, 0|1, t, 'z']` entry; it's correct when at least 80% of its decisions are right, or the single decision is right. Plays earn XP (10/20/30 by difficulty, 25% on repeats) and feed readiness. `recordPuzzle` only appends to the log and never touches machine progress (tested, and checked in e2e). The Puzzle bench opens once a machine is unlocked.

### Counts by type

| Type | Count | Notes |
|---|---|---|
| Query Oracle | 40 | T-SQL 14, KQL 13, DAX 13 (minimum 12 each) |
| Pattern Draft | 8 | minimum 8 |
| Gearbox Picker | 26 | storage 13, data store 13 (minimum 12 each) |
| Shuttle Fallback | 14 | minimum 12 |
| Gatehouse Access Matrix | 10 | minimum 10 |
| Ripple + Conveyor | 5 + 6 = 11 | minimum 10 |
| **Total** | **109** | 315 scored decisions |

### By domain

| Domain | Puzzles | Types |
|---|---|---|
| Prepare data | 49 | oracle 32 (T-SQL, KQL, DAX queries), pattern 4, gearbox (data store) 13 |
| Implement and manage semantic models | 39 | oracle 8 (DAX calculations), pattern 4, gearbox (storage) 13, fallback 14 |
| Maintain a data analytics solution | 21 | access 10, ripple 5, conveyor 6 |

### By machine

| Machine | Puzzles |
|---|---|
| tension-meter | 13 |
| vat-selector | 13 |
| direct-lake-shuttle | 18 |
| punch-card-reader | 8 |
| thread-sieves | 7 |
| loom-gearbox | 6 |
| conveyor | 6 |
| dax-scale | 5 |
| inspection-bench | 5 |
| twisting-frame | 5 |
| ripple-map | 5 |
| carding-machine | 4 |
| warp-frame | 4 |
| weave-planner | 4 |
| double-loom | 3 |
| gate-keys | 3 |
| item-locks | 3 |

A shared puzzle counts once for each machine it's on. Each puzzle's bullets sit in one domain (enforced).

## Query Oracle: templates

Each template generates seeded 5–10-row tables. The reference engine (`src/puzzles/oracle/engine.ts`) computes the correct result and three distractors, each produced by one named mistake. No answer is hand-written. A data variant with two identical candidates, or an ambiguous order (ties), is rejected and the next variant is used.

`check:content` builds 50 seeds per template, and the tests build 100. T-SQL queries run on Fabric Warehouse syntax, including QUALIFY, which Learn documents for Warehouse and the SQL analytics endpoint.

| Id | Lang | Title | Machine (bullet) | Diff | Traps |
|---|---|---|---|---|---|
| QO-T01 | tsql | Row filter, then group filter | inspection-bench (P3.2) | 2 | where-vs-having, range-boundary |
| QO-T02 | tsql | Keep the latest row per customer | carding-machine (P2.7) | 2 | asc-vs-desc, window-partition, distinct-not-dedupe |
| QO-T03 | tsql | Customers with and without orders | twisting-frame (P2.6) | 2 | inner-vs-left, count-star-vs-column, left-vs-right |
| QO-T04 | tsql | Open orders, every customer listed | twisting-frame (P2.6) | 3 | left-join-filter-in-where, ignored-predicate, null-not-zero |
| QO-T05 | tsql | Counting leads with missing emails | carding-machine (P2.7) | 1 | nulls-ignored, count-star-vs-column, distinct-count |
| QO-T06 | tsql | Average rating with unrated rows | carding-machine (P2.7) | 2 | nulls-ignored, count-star-vs-column |
| QO-T07 | tsql | Top three products by revenue | inspection-bench (P3.2) | 1 | asc-vs-desc, take-vs-top, operator-order |
| QO-T08 | tsql | Ranking with ties | inspection-bench (P3.2) | 2 | rank-ties, asc-vs-desc |
| QO-T09 | tsql | Running total by date | twisting-frame (P2.5) | 2 | running-total-frame, asc-vs-desc |
| QO-T10 | tsql | Month-over-month change | inspection-bench (P3.2) | 2 | lag-vs-lead, null-not-zero |
| QO-T11 | tsql | Orders by channel with missing values | carding-machine (P2.7) | 3 | null-group |
| QO-T12 | tsql | Combining two buyer lists | twisting-frame (P2.6) | 1 | union-vs-union-all, asc-vs-desc |
| QO-T13 | tsql | Bucketing orders by size | twisting-frame (P2.5) | 2 | case-first-match, range-boundary |
| QO-T14 | tsql | Customers and revenue since July | inspection-bench (P3.2) | 2 | distinct-count, asc-vs-desc, ignored-predicate |
| QO-K01 | kql | Join with no kind | tension-meter (P3.3) | 3 | kql-innerunique, inner-vs-left, kql-dedupe-side |
| QO-K02 | kql | Devices and their alerts | tension-meter (P3.3) | 2 | kql-innerunique, kql-leftanti, null-not-zero |
| QO-K03 | kql | Top three by damage | tension-meter (P3.3) | 1 | asc-vs-desc, take-vs-top, operator-order |
| QO-K04 | kql | Sorting by two columns | tension-meter (P3.3) | 2 | kql-sort-default, asc-vs-desc |
| QO-K05 | kql | Filter rows, then filter totals | tension-meter (P3.3) | 2 | operator-order, range-boundary |
| QO-K06 | kql | Average temperature with gaps | tension-meter (P3.3) | 2 | nulls-ignored, count-star-vs-column |
| QO-K07 | kql | Attempts and failures per user | tension-meter (P3.3) | 1 | ignored-predicate, operator-order |
| QO-K08 | kql | Latest state per device | tension-meter (P3.3) | 2 | asc-vs-desc, max-vs-argmax, take-vs-top |
| QO-K09 | kql | Distinct pages per user | tension-meter (P3.3) | 1 | distinct-count, distinct-not-dedupe, kql-sort-default |
| QO-K10 | kql | Request durations in buckets | tension-meter (P3.3) | 2 | bin-rounds-down, kql-sort-default |
| QO-K11 | kql | Orders across two quarters | tension-meter (P3.3) | 2 | union-vs-union-all, asc-vs-desc |
| QO-K12 | kql | Net amount filter | tension-meter (P3.3) | 1 | ignored-predicate, range-boundary, project-vs-extend |
| QO-K13 | kql | Top two regions by total | tension-meter (P3.3) | 2 | asc-vs-desc, operator-order, take-vs-top |
| QO-D01 | dax | Revenue and orders by category | dax-scale (P3.4) | 1 | summarizecolumns-blank, filter-context, distinct-count |
| QO-D02 | dax | A filtered measure by color | punch-card-reader (S1.4) | 2 | calculate-replaces-filter, filter-context |
| QO-D03 | dax | KEEPFILTERS by color | punch-card-reader (S1.4) | 3 | calculate-replaces-filter, summarizecolumns-blank, null-not-zero |
| QO-D04 | dax | Share of total by category | punch-card-reader (S1.4) | 2 | all-vs-removefilters, asc-vs-desc |
| QO-D05 | dax | Profit per unit with free samples | punch-card-reader (S1.4) | 2 | divide-blank, summarizecolumns-blank, iterator-vs-aggregate |
| QO-D06 | dax | Orders and customers per region | dax-scale (P3.4) | 2 | distinctcount-blank, distinct-count |
| QO-D07 | dax | Revenue from quantity and price | punch-card-reader (S1.4) | 1 | iterator-vs-aggregate, filter-context |
| QO-D08 | dax | Cost through a relationship | punch-card-reader (S1.4) | 2 | iterator-vs-aggregate, filter-context, summarizecolumns-blank |
| QO-D09 | dax | Measure vs plain SUM in ADDCOLUMNS | punch-card-reader (S1.4) | 3 | context-transition |
| QO-D10 | dax | Average discount with blanks | dax-scale (P3.4) | 2 | nulls-ignored, distinct-count |
| QO-D11 | dax | Top two products with a tie | dax-scale (P3.4) | 2 | topn-ties, asc-vs-desc, take-vs-top |
| QO-D12 | dax | A variable inside CALCULATE | punch-card-reader (S1.4) | 3 | var-evaluated-once, filter-context |
| QO-D13 | dax | Filter regions by total | dax-scale (P3.4) | 2 | where-vs-having, range-boundary |

## Query Oracle: trap list (39)

| Trap | Label | Rule | Learn sources |
|---|---|---|---|
| `where-vs-having` | WHERE vs HAVING | WHERE filters rows before grouping; HAVING filters groups after the aggregates are computed. | sql/t-sql/queries/select-qualify-clause-transact-sql?view=fabric<br>sql/t-sql/queries/select-having-transact-sql?view=fabric |
| `where-vs-qualify` | WHERE vs QUALIFY | QUALIFY filters after window functions are computed, so it can keep, for example, row number 1 per partition. WHERE runs before window functions. | sql/t-sql/queries/select-qualify-clause-transact-sql?view=fabric |
| `window-partition` | Missing PARTITION BY | Without PARTITION BY, a window function treats the whole result set as one partition. | sql/t-sql/queries/select-over-clause-transact-sql?view=fabric |
| `distinct-not-dedupe` | DISTINCT isn’t one row per key | SELECT DISTINCT removes only rows that are identical in every selected column; it doesn’t keep one row per key. | sql/t-sql/queries/select-clause-transact-sql?view=fabric |
| `inner-vs-left` | Inner vs left outer join | An inner join keeps only matching rows. A left outer join also keeps every unmatched row from the left side, with nulls for the right side. | sql/t-sql/queries/from-transact-sql?view=fabric<br>kusto/query/join-leftouter?view=microsoft-fabric |
| `left-vs-right` | Left vs right join | A left outer join preserves the left table’s rows, not the right table’s. | sql/t-sql/queries/from-transact-sql?view=fabric |
| `left-join-filter-in-where` | Filter in ON vs WHERE | A condition in a LEFT JOIN’s ON clause only limits which right rows match. The same condition in WHERE removes left rows whose right side is NULL, turning it into an inner join. | sql/t-sql/queries/from-transact-sql?view=fabric<br>sql/t-sql/queries/where-transact-sql?view=fabric |
| `ignored-predicate` | Ignored condition | Every condition in the query applies; dropping one changes which rows qualify. | sql/t-sql/queries/where-transact-sql?view=fabric<br>kusto/query/where-operator?view=microsoft-fabric |
| `kql-innerunique` | KQL innerunique default | A KQL join with no kind uses innerunique, which removes duplicate keys from the left side before matching. kind=inner keeps every left row. | kusto/query/join-innerunique?view=microsoft-fabric<br>kusto/query/join-operator?view=microsoft-fabric |
| `kql-dedupe-side` | Which side innerunique deduplicates | innerunique deduplicates the left side only. Duplicates on the right side all match. | kusto/query/join-innerunique?view=microsoft-fabric |
| `kql-leftanti` | leftouter vs leftanti | leftanti returns only left rows with no match; leftouter returns every left row, matched or not. | kusto/query/join-leftanti?view=microsoft-fabric<br>kusto/query/join-leftouter?view=microsoft-fabric |
| `asc-vs-desc` | Ascending vs descending | Check the sort direction. T-SQL ORDER BY defaults to ASC; KQL sort and top default to desc. | sql/t-sql/queries/select-order-by-clause-transact-sql?view=fabric<br>kusto/query/sort-operator?view=microsoft-fabric<br>kusto/query/top-operator?view=microsoft-fabric<br>dax/dax-queries |
| `kql-sort-default` | KQL sort default per column | In KQL, each sort column without asc or desc defaults to desc, even when an earlier column says asc. | kusto/query/sort-operator?view=microsoft-fabric |
| `nulls-ignored` | Nulls ignored by aggregates | AVG, SUM, and COUNT(column) skip nulls (KQL avg too, and DAX AVERAGE skips blanks), so a null isn’t treated as zero. | sql/t-sql/functions/avg-transact-sql?view=fabric<br>sql/t-sql/functions/count-transact-sql?view=fabric<br>kusto/query/avg-aggregation-function?view=microsoft-fabric<br>dax/average-function-dax<br>dax/countrows-function-dax |
| `null-not-zero` | Null isn’t zero | A missing value stays null (or blank); it isn’t shown as 0 unless the query replaces it. | sql/t-sql/functions/lag-transact-sql?view=fabric<br>kusto/query/scalar-data-types/null-values?view=microsoft-fabric<br>dax/divide-function-dax |
| `count-star-vs-column` | COUNT(*) vs COUNT(column) | COUNT(*) counts rows, including nulls and duplicates. COUNT(column) counts non-null values. | sql/t-sql/functions/count-transact-sql?view=fabric |
| `distinct-count` | Distinct vs total count | A distinct count counts each value once; a plain count counts every row. | sql/t-sql/functions/count-transact-sql?view=fabric<br>kusto/query/distinct-operator?view=microsoft-fabric<br>dax/distinctcount-function-dax |
| `take-vs-top` | take vs top | top N by an expression sorts first and returns N rows. take returns N rows with no guaranteed order unless the input is already sorted. T-SQL TOP with ORDER BY returns the first N rows in that order. | kusto/query/take-operator?view=microsoft-fabric<br>kusto/query/top-operator?view=microsoft-fabric<br>sql/t-sql/queries/top-transact-sql?view=fabric |
| `operator-order` | Operator order | Each step works on the output of the step before it, so the order of operators (or clauses) changes the result. | kusto/query/summarize-operator?view=microsoft-fabric<br>kusto/query/top-operator?view=microsoft-fabric<br>sql/t-sql/queries/top-transact-sql?view=fabric |
| `rank-ties` | ROW_NUMBER vs RANK vs DENSE_RANK | ROW_NUMBER numbers every row uniquely. RANK gives ties the same rank and then skips. DENSE_RANK gives ties the same rank without gaps. | sql/t-sql/functions/rank-transact-sql?view=fabric<br>sql/t-sql/functions/dense-rank-transact-sql?view=fabric<br>sql/t-sql/functions/row-number-transact-sql?view=fabric |
| `running-total-frame` | Window frame | With ORDER BY and a ROWS frame, a windowed SUM adds the rows from the start of the frame to the current row. Without ORDER BY in OVER, it sums the whole partition on every row. | sql/t-sql/queries/select-over-clause-transact-sql?view=fabric<br>sql/t-sql/functions/sum-transact-sql?view=fabric |
| `lag-vs-lead` | LAG vs LEAD | LAG reads a previous row; LEAD reads a following row. With no default, the missing row gives NULL. | sql/t-sql/functions/lag-transact-sql?view=fabric |
| `null-group` | Nulls in GROUP BY | GROUP BY puts all NULL keys into one group; it doesn’t drop them. Replacing NULL with a value merges them with any existing rows that have that value. | sql/t-sql/queries/select-group-by-transact-sql?view=fabric<br>sql/t-sql/language-elements/coalesce-transact-sql?view=fabric |
| `union-vs-union-all` | UNION vs UNION ALL | T-SQL UNION removes duplicate rows; UNION ALL keeps them. KQL union returns the rows of all inputs, like UNION ALL. | sql/t-sql/language-elements/set-operators-union-transact-sql?view=fabric<br>kusto/query/union-operator?view=microsoft-fabric |
| `case-first-match` | CASE returns the first match | CASE evaluates WHEN clauses in order and returns the first one that’s true. A NULL comparison isn’t true, so it falls to ELSE. | sql/t-sql/language-elements/case-transact-sql?view=fabric |
| `range-boundary` | Boundary values | >= includes the boundary value; > excludes it. | sql/t-sql/queries/where-transact-sql?view=fabric<br>sql/t-sql/queries/select-having-transact-sql?view=fabric<br>kusto/query/where-operator?view=microsoft-fabric<br>dax/filter-function-dax |
| `max-vs-argmax` | max() vs arg_max() | arg_max returns the other columns from the row with the maximum value. max(column) returns the largest value of that column itself. | kusto/query/arg-max-aggregation-function?view=microsoft-fabric<br>kusto/query/max-aggregation-function?view=microsoft-fabric |
| `bin-rounds-down` | bin() rounds down | bin(value, size) rounds down to a multiple of size; it never rounds to the nearest or up. | kusto/query/bin-function?view=microsoft-fabric |
| `project-vs-extend` | project vs extend | extend adds a column and keeps the others; project keeps only the columns it lists. | kusto/query/project-operator?view=microsoft-fabric<br>kusto/query/extend-operator?view=microsoft-fabric |
| `summarizecolumns-blank` | SUMMARIZECOLUMNS drops blank rows | SUMMARIZECOLUMNS only returns rows where at least one expression is non-blank. | dax/summarizecolumns-function-dax |
| `filter-context` | Filter context | An aggregation inside a grouped query is evaluated in that row’s filter context unless something changes it. | dax/calculate-function-dax<br>dax/summarizecolumns-function-dax |
| `all-vs-removefilters` | ALL / REMOVEFILTERS vs no removal | ALL or REMOVEFILTERS in CALCULATE clears the filter on the column, giving the grand total; without it, the denominator is the current group. | dax/all-function-dax<br>dax/removefilters-function-dax |
| `calculate-replaces-filter` | CALCULATE replaces vs KEEPFILTERS | A CALCULATE filter on a column replaces the existing filter on that column. KEEPFILTERS intersects it with the existing filter instead. | dax/calculate-function-dax<br>dax/keepfilters-function-dax |
| `divide-blank` | DIVIDE by zero | DIVIDE returns BLANK (or the alternate result, when given) instead of an error when the denominator is 0. | dax/divide-function-dax |
| `distinctcount-blank` | DISTINCTCOUNT counts BLANK | DISTINCTCOUNT counts BLANK as a value; DISTINCTCOUNTNOBLANK skips it. | dax/distinctcount-function-dax |
| `iterator-vs-aggregate` | Iterator vs aggregate | SUMX evaluates the expression for each row and then sums. Multiplying two SUMs gives a different number. | dax/sumx-function-dax<br>dax/sum-function-dax |
| `context-transition` | Context transition | A measure reference in row context gets an implicit CALCULATE, which turns the row into a filter. A plain SUM in row context isn’t filtered by the row. | dax/calculate-function-dax<br>dax/addcolumns-function-dax |
| `topn-ties` | TOPN ties | If rows tie at the N-th position, TOPN returns all of them, so it can return more than N rows. | dax/topn-function-dax |
| `var-evaluated-once` | Variables are evaluated once | A variable is evaluated where it’s defined, outside the filters CALCULATE applies in RETURN; its value doesn’t change. | dax/var-dax<br>dax/best-practices/dax-variables |

## Evaluators: rules and sources

All answers for these types are computed. The scenario files store inputs only. A case Learn doesn't settle returns null or throws, and the content check rejects it.

### Shuttle Fallback (`src/puzzles/evaluators/fallback.ts`)

Inputs are the Direct Lake flavor, DirectLakeBehavior, and the situation; the first rule that applies decides.

**Not encoded, because Learn pages disagree:**
- SQL analytics endpoint OLS: fallback vs error.
- OneLake with SQL RLS: succeeds vs error.

**Avoided, from DLS-05:** guardrail scope (per query vs whole model). Every guardrail scenario queries the oversized table itself.

| Rule | Text | Outcome | Source |
|---|---|---|---|
| FB-1 | Direct Lake on OneLake doesn’t fall back to DirectQuery, and DirectLakeBehavior only applies to Direct Lake on SQL analytics endpoints. With every condition met, the query runs in Direct Lake. | directlake | fabric/fundamentals/direct-lake-how-it-works |
| FB-3 | With Direct Lake on OneLake, queries involving unprocessed tables return an error. | error | fabric/fundamentals/direct-lake-overview |
| FB-4 | If guardrails are exceeded with Direct Lake on OneLake, refresh fails and the model can’t be queried until the Delta tables are optimized within the limits. | error | fabric/fundamentals/direct-lake-overview |
| FB-5 | DirectLakeBehavior = DirectQueryOnly: the query always uses DirectQuery mode. | directquery | fabric/fundamentals/direct-lake-how-it-works |
| FB-6 | Direct Lake on SQL analytics endpoints stays in Direct Lake when every condition holds: no SQL RLS, OLS, or DDM on the referenced tables, no non-materialized SQL views, no table over a guardrail, and the model was refreshed (framed). | directlake | fabric/fundamentals/direct-lake-how-it-works |
| FB-7 | DirectLakeBehavior = Automatic (the default): if a Direct Lake condition isn’t met, the query silently falls back to DirectQuery. | directquery | fabric/fundamentals/direct-lake-how-it-works |
| FB-8 | DirectLakeBehavior = DirectLakeOnly: if a Direct Lake condition isn’t met, the query fails with an error. | error | fabric/fundamentals/direct-lake-how-it-works |

### Gatehouse Access Matrix (`src/puzzles/evaluators/access.ts`)

**Encodes:**
- the Fabric workspace roles table (action → roles)
- the default item permissions per role (Read/ReadData/ReadAll)
- SQL GRANT on tables and columns
- warehouse RLS policies, which apply to everyone
- DDM unmasking (Admin/Member/Contributor or UNMASK)
- semantic model RLS and OLS, which apply to Viewers only; RLS roles are additive

**Refused:**
- DENY
- a contributor or viewer with extra item permissions sharing
- column grants on top of ReadData
- a viewer in no RLS role ("typically" sees no data, so it isn't firm)
- item-only users for model RLS/OLS

| Rule | Text | Source |
|---|---|---|
| AC-ROLE | Workspace roles grant the capabilities in the Fabric workspace roles table (for example, only Admin can update or delete the workspace or connect it to Git; Admin and Member can add members and share; Viewer can’t write or run items but can view run output). | fabric/fundamentals/roles-workspaces |
| AC-SHARE | You must be an Admin or Member in the workspace to share an item. | fabric/data-warehouse/share-warehouse-manage-permissions |
| AC-CONNECT | To connect to a warehouse or SQL analytics endpoint, a user needs a workspace role or at least the item Read permission. | fabric/data-warehouse/sql-granular-permissions |
| AC-READ | Read alone only lets a user connect; they can’t query any table or view unless a T-SQL GRANT gives them access. | fabric/data-warehouse/share-warehouse-manage-permissions |
| AC-READDATA | ReadData (“Read all data using SQL”) lets a user read every table and view with T-SQL, like db_datareader. Every workspace role, Viewer included, has it by default. | fabric/data-warehouse/share-warehouse-manage-permissions |
| AC-READALL | ReadAll (“Read all data using Apache Spark”) lets a user read the files through OneLake and Spark. Admin, Member, and Contributor have it by default; Viewer doesn’t. | fabric/data-warehouse/share-warehouse-manage-permissions |
| AC-CLS | Column-level security is a GRANT SELECT on listed columns; a query that includes any other column fails with a permission error. | fabric/data-warehouse/column-level-security |
| AC-WH-RLS | Warehouse row-level security policies apply to every user, including dbo and members of Admin, Member, and Contributor; the policy itself must allow anyone who needs all rows. | fabric/data-warehouse/row-level-security |
| AC-DDM | Users see masked values unless they’re Admin, Member, or Contributor (which carry CONTROL) or have UNMASK. | fabric/data-warehouse/dynamic-data-masking |
| AC-SM-RLS | Semantic model RLS only restricts users with Viewer permissions (Build doesn’t change that). Admin, Member, and Contributor can edit the model, so RLS doesn’t apply to them. Roles are additive. | fabric/security/service-admin-row-level-security |
| AC-SM-OLS | Object-level security only applies to Viewers. For them a secured column behaves as if it doesn’t exist; Admin, Member, and Contributor aren’t affected. | fabric/security/service-admin-object-level-security |

Workspace-action explanations are generated per action from the roles table. They name the roles that hold the right and the user's role.

### Ripple (`src/puzzles/evaluators/lineage.ts`)

Edges are `[upstream, downstream]`. All downstream items are the transitive closure, and Child items are the direct children. Upstream items are never listed. Graphs are checked to be acyclic.

| Rule | Text | Source |
|---|---|---|
| LN-ALL | Impact analysis can list all affected downstream items: everything that depends on the changed item, directly or through other items, in any workspace. | fabric/governance/impact-analysis |
| LN-CHILD | The Child items tab lists only direct children: items one step downstream of the changed item. | fabric/governance/impact-analysis |
| LN-VIEW | A workspace’s lineage view doesn’t show downstream items in other workspaces; impact analysis does. | fabric/governance/lineage |

### Conveyor (`src/puzzles/evaluators/deployment.ts`)

**Refused:** a Contributor deploying a semantic model or report. Learn's action table says Contributor in both stages, but its item table says Member for semantic models and paginated reports.

| Rule | Text | Source |
|---|---|---|
| DP-ADMIN | Pipeline admin is the lowest pipeline permission and is required for every deployment pipeline operation. Deleting the pipeline, managing settings, and viewing deployment history need only pipeline admin. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-DEPLOY | Deploying to the next stage needs pipeline admin plus at least Contributor in both the source and target workspaces. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-EMPTY | Deploying to an empty stage needs pipeline admin plus Contributor (or higher) in the source workspace. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-DATAFLOW | To deploy a dataflow you must be its owner. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-COMPARE | Comparing two stages needs pipeline admin plus Contributor, Member, or Admin in both stages’ workspaces. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-ASSIGN | Assigning a workspace to a stage needs pipeline admin plus Admin of that workspace. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-RULE | Viewing or setting a deployment rule needs pipeline admin, Contributor (or higher) in the target workspace, and ownership of the item. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-BIND | When a deployed item depends on an item that exists in the target stage, deployment autobinds it to the target-stage item. If the item it depends on isn’t deployed and isn’t in the target stage, the deployment fails. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-DL-BIND | A deployed Direct Lake semantic model doesn’t autobind: it still points at the source-stage lakehouse until a datasource rule rebinds it. Other semantic models autobind to the paired item. | fabric/cicd/deployment-pipelines/understand-the-deployment-process |
| DP-DL-RULES | Deployment pipeline rules can rebind the data source for Direct Lake on SQL, but not for Direct Lake on OneLake. | fabric/fundamentals/direct-lake-overview |

### Authored keys (Pattern Draft, Gearbox)

Keys are written from Learn guidance:
- star schema
- Fabric dimensional modeling (fact and dimension tables, SCD)
- many-to-many, bidirectional, and active/inactive relationship guidance
- storage mode, DirectQuery, composite models, Direct Lake overview and how it works
- the data store and lakehouse-vs-warehouse decision guides

**More than one accepted answer:** GB-S09 accepts Direct Lake on OneLake and Composite, because a OneLake + Import model is a composite model by Learn's definition.

**Changed in review:** the Date-key decisions accept only the YYYYMMDD int key, which Learn prescribes.

## Reviewer disagreements and resolutions

See `docs/reviews/step-5-puzzle-review.md`.

**Blind pass:**
- 168/168 decisions agreed: 56 puzzles, at least 30% of each type, every Fallback, Access, and Conveyor scenario.
- The 2 replacements were also answered blind, and both matched.

**Source pass:**
- All 63 cited URLs return 200.
- **Dropped:** SF-05 and SF-08 (Learn contradicts itself), replaced by SF-15 and SF-16.
- **Fixed:**
  - Date-key decisions (Learn says YYYYMMDD int)
  - oracle sources now cite only their own language
  - QO-T09 wording
  - specific workspace-action explanations and a sharing source
  - Fallback wrong-choice explanations, with rule ids hidden
  - Pattern grain explanations
  - scenario wording: PD-06, every Ripple story, CN-03, CN-05, GB-S07
  - neutral answer-set ids

## One sample per type (answer and explanation)

- **Query Oracle, QO-T02 (seed 7):**
  - Data: `dbo.CustomerUpdates` has 8 rows for customers 11, 12, and 15.
  - Query: `QUALIFY ROW_NUMBER() OVER (PARTITION BY CustomerID ORDER BY ModifiedAt DESC) = 1`.
  - **Answer:** 11 ben@… 2026-07-07; 12 femi3@… 2026-07-01; 15 dara@… 2026-07-11.
  - Why: ROW_NUMBER restarts per customer, newest first, and QUALIFY keeps row 1 after the window is computed.
  - Distractors:
    - earliest row (asc-vs-desc)
    - only the single newest row (missing PARTITION BY)
    - every row (DISTINCT isn't one row per key)
- **Pattern Draft, PD-03 (support tickets), 18 decisions:**
  - Grain: one row per ticket.
  - Columns: TicketNumber is a fact attribute (degenerate dimension); HoursToResolve is a measure; TeamName goes in the Agent dimension (denormalized); OpenedDate and ClosedDate are roles of Date.
  - Keys: surrogate keys for Agent (required by SCD 2) and Customer; a YYYYMMDD int key for Date.
  - Changes: TeamName is SCD type 2 (tickets stay with the team at the time); AgentName typos are type 1.
  - Relationships: all one-to-many, single direction, with one active Date relationship.
- **Gearbox, GB-S06:** a non-materialized SQL view must be a model table next to Direct Lake tables.
  - **Answer:** Direct Lake on SQL analytics endpoint.
  - Why: it reads views by falling back to DirectQuery, and Learn says a Direct Lake on OneLake table can't be built on a non-materialized view.
- **Shuttle Fallback, SF-03:** Direct Lake on SQL, DirectLakeOnly, the table is based on a SQL view.
  - **Answer:** the query fails with an error (FB-8: with DirectLakeOnly, an unmet condition fails the query).
- **Access Matrix, AM-05:** a warehouse security policy maps Ana (Admin) → East, Ben (Viewer) → West, Cai (Contributor) → East and West.
  - **Answers:** Ana East; Ben West; Cai East, West.
  - Why: warehouse RLS applies to everyone, including dbo and Admin/Member/Contributor (unlike semantic model RLS).
- **Ripple, RP-04:** the Raw lakehouse feeds a dataflow, then a warehouse, then a model, then a report; a pipeline loads Raw.
  - **Child items:** the dataflow only.
  - **All downstream items:** dataflow, warehouse, model, report.
  - The upstream pipeline is never listed.
- **Conveyor, CN-03:** Mia owns three models deployed Dev → Test.
  - Mia's datasource rule succeeds (owner, pipeline admin, Contributor+ in Test); Lee's fails (not the owner).
  - Direct Lake on SQL with no rule stays on the source-stage lakehouse; with Mia's rule it binds to the Test lakehouse.
  - Direct Lake on OneLake stays on the source stage (rules aren't supported).
  - The Import model autobinds to the Test item.

## Unsure items and deviations

- **QUALIFY:** the page returned 404 once while I was fetching, then loaded on retry. It documents QUALIFY for Fabric Warehouse and the SQL analytics endpoint, so the T-SQL templates use it.
- **Learn contradictions:**
  - Direct Lake SQL endpoint OLS, and OneLake with SQL RLS: not encoded, scenarios dropped.
  - Deployment of semantic models by Contributors (action table vs item table): refused by the evaluator.
  - These are queued for Step 8.
- **Single-page facts:**
  - DDM as a Direct Lake fallback cause (SF-07)
  - impact analysis (page last updated in 2023)
  - Flagged for Step 8.
- **Pattern Draft domain split:** weave-planner scenarios (Prepare domain) also ask relationship cardinality and direction, which the outline places under semantic models (S1.3). I kept them, because the brief asks every scenario to cover all five decision kinds, and a puzzle's bullets must stay in one domain. The puzzle is tagged P2.3 (P2.4 for PD-03).
- **Gearbox options:** cards are single-pick with fixed deck options. "More than one acceptable" is handled by `accepted` lists (GB-S09).
- **Puzzle availability:** the bench is open once the machine is unlocked (idle, running, or certified), not while it's locked. The brief didn't say.
- **Seed for puzzles:** in dev, `?seed=` also makes puzzle data repeatable. Production uses Math.random.
- **Shared answer log:** puzzle ids must not collide with question ids. The check caught `CV-`, so the Conveyor scenarios use `CN-`.
- **Bundle size:** the production JS grew with the puzzle engine and content. Vite warns that the chunk is over 500 kB; I haven't split it yet (Step 9).

## Test and check results

| Check | Result |
|---|---|
| `npm test` | 191 tests in 20 files, all pass |
| `npm run typecheck` / `npm run lint` | clean |
| `npm run check:content` | passes; prints puzzle counts by type, deck, domain, and machine |
| `npm run check:secrets` | passes |
| `npm run build` | passes, including `check-bundle` (no `?seed=` hook in production JS) |
| `npm run check:links` | 181 Learn URLs return 200 |
| `npm run e2e` | 6/6 pass (3 specs × 1440 and 390 px) |

Step 6 waits for your approval.
