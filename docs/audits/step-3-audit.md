# Step 3 audit: Review fixes and question bank

Step 3 is pushed to `main` in seven commits:

| Commit | Contents |
|---|---|
| `c65710c` | Part A fixes, question types and validator, export script, `/review` page |
| `5b2449d` | Front Office questions (12) |
| `f7b7b66` | Spinning Floor & Dye House questions (161) |
| `89e214a` | Loom Hall questions (93) |
| `1cbf5b1` | Gatehouse & Pattern Room questions (86) |
| `abbe8a6` | Four case studies (30 questions), strict checks, `/review` phone fix |
| `6b5b589` | Link check covers question sources; case-study rule test |

Every commit is authored with the noreply address, and none carries a session link.

## Results

| Check | Result |
|---|---|
| Typecheck, lint | Pass |
| `npm test` | 50/50 pass in 7 files |
| `check:content` (strict: no floor pending, case studies on) | Pass. Every rule below holds. |
| `check:content -- --live` | The live study guide still matches the recorded outline (41 bullets). |
| `check:links` | 132/132 Learn URLs return 200. This now includes every question source; before Step 3 it covered only notes and edges. |
| `check:secrets` | Pass (84 files) |
| `npm run build` | Pass |
| `/review` (Playwright) | Renders at 1440 px and 390 px with no page errors. At 390 px a horizontal-scroll bug was found and fixed: the machine picker had made the page 756 px wide; it is now 390 px. |

`check:content` now fails on any of these:

- a bullet with fewer than 6 questions
- a domain share outside the official range
- a question with no Learn source or a missing explanation for any option, statement, item, pair, or slot
- an unknown machine, bullet, or trap pair
- option-count rules broken
- any answer position above 35% of 4-option single-choice questions
- the correct option being strictly the longest more than 40% of the time
- near-duplicate stems (Jaccard ≥ 0.8)
- Preview questions above 5%
- a PL-300 carryover machine with fewer than 8 placement-eligible questions
- a placement question on a partial-carryover machine keyed to Power Query
- banned needs-verification terms, or "all/none of the above"
- duplicate ids
- a case study without 6–8 questions spanning all three domains
- other than 4 case studies

## Part A: fixes applied

1. **Conveyor (deployment pipelines).** Added from *understand-the-deployment-process*:
   - **Permissions:**
     - Deploying between stages needs pipeline admin plus at least Contributor on both workspaces.
     - Deploying to an empty stage needs pipeline admin plus Contributor on the source workspace.
     - Assigning a workspace needs pipeline admin plus Admin of that workspace.
     - "Pipelines only have one permission, Admin", and it grants no workspace access.
   - **Direct Lake autobind:** a Direct Lake model "doesn't automatically bind to items in the target stage… Use datasource rules". This is now a trap, and two questions test it.
   - **Upcoming change, 2026-12-01:** users without read-write permission on all workspace items can't deploy to, or assign, workspaces whose items have sensitivity labels with protection policies.

   Needs-verification item 7 is resolved and removed.
2. **Remote Loom Control.** Lab platform set to `windows`. A new `labNote` reads "Tabular Editor 2 and SQL Server Profiler are Windows applications. Resolved outside Learn (lab logistics, not exam content)", and the detail panel shows it. CLAUDE.md records that lab-logistics facts may be resolved outside Learn and are never used in questions. Item 8 is resolved and removed.
3. **Kusto Tension Meter now has 7 KQL worked examples**, each cited to a Learn KQL page (`?view=microsoft-fabric`):

   | Example | Operators | Source |
   |---|---|---|
   | Filter, shape, and aggregate events | where, extend, summarize … by bin(), sort | learn-common-operators, summarize |
   | Filter rows and choose columns | where … between, project | where-operator, project-operator |
   | Add a calculated column and keep everything else | extend, project | extend-operator |
   | Count events per hour | summarize count() by bin(StartTime, 1h), sort … asc | summarize, bin-function, sort-operator |
   | Rank rows | sort by (multi-column), top 3 by | sort-operator, top-operator |
   | Preview a table quickly | take 5 | take-operator |
   | Combine two tables | summarize, join kind=inner, project, sort | join-operator, join tutorial |

   New "don't confuse" pair **`sql-vs-kql`** (WHERE ↔ where with `==`, SELECT ↔ project, GROUP BY ↔ summarize … by, ORDER BY ↔ sort by, TOP … ORDER BY ↔ top n by, plus the `-- explain` translation tip), sourced from the SQL-to-KQL cheat sheet. Also added: traps for innerunique join, smaller-table-left, descending default sort, no automatic hourly bins, nulls ignored, and take vs top; and glossary terms take, top (KQL), and join (KQL).
4. **Needs-verification items 1–6 stay queued.** `BANNED_TERMS` blocks any question that mentions:
   - materialized views
   - scalar functions or UDFs
   - "OneLake data hub"
   - "Real-Time Analytics"
   - dropDuplicates / fillna
   - claims that OneLake security is generally available

   No question depends on these items.

## Question counts

**382 questions** (370 exam-domain questions plus 12 Front Office orientation questions, which are excluded from domain shares). 384 were written and 2 were dropped by review.

### By domain

| Domain | Questions | Share | Official range |
|---|---|---|---|
| Prepare data | 172 | 46.5% | 45–50% |
| Implement and manage semantic models | 101 | 27.3% | 25–30% |
| Maintain a data analytics solution | 97 | 26.2% | 25–30% |

### By bullet (minimum 6)

| | | | | | | |
|---|---|---|---|---|---|---|
| P1.1 7 | P1.2 9 | P1.3 14 | P1.4 11 | P1.5 9 | P2.1 11 | P2.2 10 |
| P2.3 16 | P2.4 6 | P2.5 8 | P2.6 7 | P2.7 8 | P2.8 7 | P2.9 6 |
| P3.1 8 | P3.2 8 | P3.3 15 | P3.4 12 | S1.1 10 | S1.2 6 | S1.3 8 |
| S1.4 10 | S1.5 11 | S1.6 8 | S1.7 9 | S2.1 6 | S2.2 7 | S2.3 7 |
| S2.4 8 | S2.5 11 | M1.1 9 | M1.2 10 | M1.3 13 | M1.4 7 | M1.5 6 |
| M2.1 8 | M2.2 8 | M2.3 10 | M2.4 8 | M2.5 8 | M2.6 10 | |

### By machine (including case-study questions)

| Floor | Machine (bullets) | Questions |
|---|---|---|
| Front Office | Founding Charter, Water Wheel, Three Vats, Mill Lease | 3 each |
| Prepare | Thread Intake (P1.1, P1.3) | 21 |
| | Bale Catalog (P1.2) | 9 |
| | Vat Selector (P1.4) | 11 |
| | Shared Spool (P1.5) | 9 |
| | Carding Machine (P2.7–P2.9) | 21 |
| | Twisting Frame (P2.5, P2.6) | 15 |
| | Dye Vat (P2.2) | 10 |
| | Weave Planner (P2.3, P2.4) | 22 |
| | Inspection Bench (P3.1, P3.2) | 16 |
| | Recipe Book (P2.1) | 11 |
| | Kusto Tension Meter (P3.3) | 15 |
| | DAX Scale (P3.4) | 12 |
| Semantic | Loom Gearbox (S1.1) | 10 |
| | Warp Frame (S1.2, S1.3) | 14 |
| | Punch-Card Reader (S1.4) | 10 |
| | Jacquard Head (S1.5) | 11 |
| | Wide Beam (S1.6) | 8 |
| | Double Loom (S1.7) | 9 |
| | Speed Governor (S2.1, S2.2) | 13 |
| | Direct Lake Shuttle (S2.3, S2.4) | 15 |
| | Batch Winder (S2.5) | 11 |
| Maintain | Gate Keys (M1.1) | 9 |
| | Item Locks (M1.2) | 10 |
| | Thread Sieves (M1.3) | 13 |
| | Seal & Stamp (M1.4, M1.5) | 13 |
| | Pattern Ledger (M2.1) | 8 |
| | Draft Table (M2.2) | 8 |
| | Conveyor (M2.3) | 10 |
| | Ripple Map (M2.4) | 8 |
| | Remote Loom Control (M2.5) | 8 |
| | Pattern Book (M2.6) | 10 |

## Mix

| Format | Count | Share |
|---|---|---|
| Single choice | 261 | 68.3% |
| Yes/No statement sets (incl. problem-solution style) | 44 | 11.5% |
| Multi-select ("choose two") | 26 | 6.8% |
| Matching | 20 | 5.2% |
| Drop-down code completion (T-SQL 12, KQL 2, DAX 4) | 18 | 4.7% |
| Ordering | 13 | 3.4% |

**Difficulty:** level 1 = 79 (20.7%), level 2 = 238 (62.3%), level 3 = 65 (17.0%).

**Answer position** (261 four-option single-choice): A 66, B 65, C 65, D 65, i.e. 25.3/24.9/24.9/24.9%. The correct option is strictly the longest in 72 of 261 (27.6%; cap 40%).

**Preview:** 1 of 382 (0.3%, cap 5%). That question is IB-12, about nested CTEs being preview.

**Trap links:** 129 questions link to a "don't confuse" pair.

## Placement-eligible questions per PL-300 carryover machine (minimum 8)

| Machine | Overlap | Placement | | Machine | Overlap | Placement |
|---|---|---|---|---|---|---|
| Thread Intake | partial | 11 | | Jacquard Head | partial | 10 |
| Carding Machine | partial | 12 | | Speed Governor | full | 10 |
| Twisting Frame | partial | 9 | | Batch Winder | partial | 8 |
| Dye Vat | partial | 9 | | Gate Keys | full | 8 |
| Weave Planner | partial | 16 | | Item Locks | full | 8 |
| DAX Scale | full | 11 | | Thread Sieves | partial | 11 |
| Loom Gearbox | full | 9 | | Seal & Stamp | full | 11 |
| Warp Frame | full | 11 | | Pattern Book | partial | 9 |
| Punch-Card Reader | full | 9 | | | | |

All placement questions test what DP-600 adds, in Fabric tools and terms: T-SQL in a warehouse, PySpark notebooks, Dataflow Gen2, pipelines, KQL, Direct Lake, DAX queries, and so on. The check rejects any placement question on a partial-carryover machine whose correct option names Power Query.

## Case studies

Each case is a fictional company with environment, requirements, and constraints. Each one's questions span all three domains.

| Case | Scenario | Questions (P/S/M) |
|---|---|---|
| Fernhollow Outfitters: retail sales platform | A retailer moves sales reporting from an on-premises ERP into a Fabric medallion lakehouse, a warehouse star schema, and Direct Lake, with region-restricted managers and Dev/Test/Prod pipelines. | 7 (3/2/2) |
| Quillmere Health: patient telemetry | A hospital network streams device telemetry into an eventhouse. It needs near-real-time ward dashboards, research access without patient names, and label-protected exports. | 7 (3/1/3) |
| Saltmarsh Haulage: shipment analytics lifecycle | A freight company adds Git, .pbip, incremental refresh, the large storage format, and XMLA deployment to a growing shipment model used by four workspaces. | 8 (2/2/4) |
| Lumenvale Utilities: finance and metering models | A utility's PL-300-trained finance team standardizes calculation groups, format strings, DAX validation, trusted master data, and templates. | 8 (3/3/2) |

## Independent review

Each floor and the case set were reviewed by a separate general-purpose agent that didn't write the questions. Four reviewer agents were used, one for each pair of passes.

1. **Blind pass:** the reviewer answered from stems and options only. It was told not to open the repo or the key. `scripts/compare-review.ts` diffed its answers against the key.
2. **Source pass:** the same reviewer read the keyed export and fetched every cited Learn page once. It reported a verdict for each question.

The full log, with every flag, finding, and resolution, is in `docs/reviews/step-3-question-review.md`.

| Set | Blind agreement | Source pass | Fixed | Dropped |
|---|---|---|---|---|
| Front Office | 12/12 | 11 supported, 1 partly | 7 items (FO-02 source, FO-08 and FO-12 explanations, FO-11 statement replaced, 3 sources added) | 0 |
| Spinning Floor & Dye House | 161/161 | 158 supported, 3 partly | 9 blind-pass flags and 3 source items (TI-11 distractor, SS-06 explanation, WP-12 source) | 0 |
| Loom Hall | 94/94 | 88 supported, 5 partly | 5 blind-pass flags and 5 source items (SG-11, PC-08, DL-03, DLS-12, BW-02) | **DLS-05** |
| Gatehouse & Pattern Room | 87/87 | 82 supported, 5 partly | 8 blind-pass flags and 3 source items (GK-07, GK-08, TS-06); RL-04 kept, since its source states the key verbatim | **SL-09** |
| Case studies | 30/30 | 27 supported, 3 partly | 7 blind-pass flags, including renaming all four companies after "Tidewater" was found to be a real company, and 5 source items | 0 |

No answer key was found unsupported. Every disagreement the reviewers raised was about ambiguity, explanation wording, a missing citation, or a giveaway, and all are fixed or dropped.

**Dropped questions:**

- **DLS-05.** Learn contradicts itself on guardrail scope. *How Direct Lake works* says one table over a guardrail "prevents Direct Lake mode for the entire model". The overview says the other guardrails "are evaluated per query".
- **SL-09.** "Endorsement doesn't change who can access an item" is a sound inference, but no Learn page states it.

## Questions skipped for verification gaps

These are topics I deliberately didn't write questions on, or rewrote to avoid:

- **Needs-verification items 1–6.** Materialized views, scalar UDFs, the OneLake data hub → catalog rename, the Real-Time Analytics → Intelligence rename, PySpark dropDuplicates/fillna, and OneLake security GA are all blocked by `BANNED_TERMS`. The Carding Machine questions use T-SQL and Data Wrangler instead of PySpark de-duplication calls.
- **Trial capacity size.** Learn says F4/F64 on one page and only 64 CUs on another. A new needs-verification item was added (Mill Lease), and FO-11 was rewritten to avoid it.
- **DLS-05 and SL-09:** see above.
- **"Avoid converting BLANKs to values."** This DAX best-practice page now returns 404. A draft Speed Governor question that relied on it was replaced with Learn's FILTER-with-a-measure example. No question cites the dead URL.
- **Snowflake as a Direct Lake on SQL source.** The support rests only on a creation-experience table, so DLS-13 now uses SQL views instead.
- **Two drop-downs mislabeled as T-SQL.** TI-10 was PySpark and RL-03 was TMSL JSON. Both were converted to single-choice, because drop-downs are limited to T-SQL, KQL, and DAX.

**For Step 8:**

- The SQL analytics endpoint page now says "Scalar UDFs are supported when inlineable".
- The Fabric `CREATE FUNCTION` page says "Scalar UDFs and external UDFs are preview features in Fabric Data Warehouse".

Together these likely resolve needs-verification item 5 as "scalar UDFs are preview". The item stays queued as you asked.

## 10 sample questions

The letters below are as shipped. `arrange()` rotates single-choice answer positions, so the letters can differ from the source files.

### LG-01 · single choice · difficulty 2

Data engineers maintain several billion-row Delta tables in a Fabric lakehouse. You need a semantic model with VertiPaq query performance, without copying the data into the model, and with refreshes that finish in seconds. Which storage mode should you use?

- A. **Direct Lake ✅** — Correct. Direct Lake loads Delta columns into VertiPaq on demand, and its refresh copies only metadata (framing), which takes seconds.
- B. Import — Import copies the whole data volume into the model, and its refresh can take considerable time and capacity.
- C. DirectQuery — DirectQuery doesn't copy data, but it federates every query to the source instead of using VertiPaq.
- D. Dual — Dual acts as Import or DirectQuery per query, so it still needs an Import copy of the data.

Source: fabric/fundamentals/direct-lake-overview

### KT-12 · multi-select · difficulty 3

For each name in the dependencies table, you need the number of distinct type values. A fast estimate is acceptable. Which two KQL queries meet the goal? Choose two.

- A. **`dependencies | summarize dcount(type) by name` ✅** — dcount() returns an estimate of the distinct values per group, which the stem allows. Learn's cheat sheet maps COUNT(DISTINCT) to it.
- B. **`dependencies | summarize by name, type | summarize count() by name` ✅** — The first summarize leaves one row per name and type; the second counts them per name, giving an exact count.
- C. `dependencies | summarize count() by name, type` — This counts rows per name and type pair, not distinct types per name.
- D. `dependencies | distinct name | count` — This returns the number of distinct names, a single value.

Sources: kusto/query/sql-cheat-sheet; kusto/query/dcount-aggregation-function

### CS1-07 · Yes/No problem-solution set · difficulty 3 · case Fernhollow Outfitters

After deploying the Direct Lake model from Sales-Test to Sales-Prod, Prod reports show Test data. For each proposed solution, select Yes if it meets the goal.

- Add a datasource rule in the Sales-Prod stage that points the model to the Prod gold warehouse, then deploy again. → **Yes.** Direct Lake models don't autobind to the target stage's items; datasource rules fix the binding.
- Refresh the semantic model in Sales-Prod. → **No.** Refresh reframes against the source the model is bound to, which is still in Test.
- Redeploy only the reports to Sales-Prod. → **No.** Reports autobind to the Prod model; the model itself is still bound to Test.

Sources: deployment-pipelines/understand-the-deployment-process; deployment-pipelines/create-rules

### WP-08 · ordering · difficulty 2

A pipeline runs the nightly ETL for a Fabric warehouse star schema. Put the steps in the order Learn recommends.

1. Truncate the staging tables. Staging contents should be removed at the start of the ETL process.
2. Load the staging tables with source data. Source data is staged before it is transformed into the dimensional model.
3. Process the dimension tables, applying SCD changes. Dimensions come before facts so every new member exists.
4. Load the fact table, looking up the surrogate key for each dimension. Each fact row needs the current surrogate key of members that now exist.

Source: data-warehouse/dimensional-modeling-load-tables

### KT-08 · matching · difficulty 1

A SQL developer is moving to KQL. Match each SQL construct to its KQL equivalent.

- `SELECT name, type` → **`| project name, type`**. project chooses the output columns, like a SELECT list.
- `WHERE type = 'blob'` → **`| where type == "blob"`**. where filters rows; KQL uses == for equality.
- `GROUP BY name with COUNT(*)` → **`| summarize count() by name`**. summarize combines the aggregation and the grouping in one operator.
- `SELECT TOP 100 … ORDER BY Count DESC` → **`| top 100 by Count desc`**. top n by replaces SELECT TOP with ORDER BY.

Source: kusto/query/sql-cheat-sheet

### CM-02 · drop-down (T-SQL) · difficulty 2

You need to return one row per OrderID from a warehouse table, keeping the row with the latest LoadDate. Complete the T-SQL query.

```sql
SELECT OrderID, Amount, LoadDate
FROM staging.Orders
[[1]] ROW_NUMBER() OVER ([[2]] OrderID ORDER BY LoadDate [[3]]) = 1;
```

- [[1]] **QUALIFY ✅** (filters on window results) · HAVING (filters groups) · WHERE (runs before window functions)
- [[2]] **PARTITION BY ✅** (restarts numbering per OrderID) · GROUP BY (not valid in OVER) · ORDER BY (sets order, not grouping)
- [[3]] **DESC ✅** (latest first, so row 1 is newest) · ASC (oldest first) · NULLS LAST (not the direction)

Source: sql/t-sql/queries/select-qualify-clause (view=fabric)

### KT-02 · drop-down (KQL) · difficulty 2

You need the number of Texas storm events per hour, oldest hour first, from a KQL database. Complete the KQL query.

```kql
StormEvents
| where State == 'TEXAS'
| [[1]] EventCount = count() by [[2]](StartTime, 1h)
| [[3]] by StartTime asc
```

- [[1]] **summarize ✅** (groups and counts) · extend (adds a column per row) · project (chooses columns)
- [[2]] **bin ✅** (rounds each time down to the hour) · ago (relative to now) · between (range test in where)
- [[3]] **sort ✅** (orders buckets oldest first) · top (needs a row count) · take (arbitrary rows, no by)

Sources: kusto summarize-operator, bin-function, sort-operator

### PC-01 · drop-down (DAX) · difficulty 2

You are rewriting a year-over-year growth measure so the prior-year value is calculated once and reused. Complete the DAX.

```dax
Sales YoY Growth % =
[[1]] SalesPriorYear =
    CALCULATE([Sales], PARALLELPERIOD('Date'[Date], -12, MONTH))
[[2]]
    [[3]]([Sales] - SalesPriorYear, SalesPriorYear)
```

- [[1]] **VAR ✅** (stores the result) · DEFINE (DAX query block) · MEASURE (belongs in DEFINE)
- [[2]] **RETURN ✅** (result expression) · EVALUATE (DAX queries only) · THEN (not DAX)
- [[3]] **DIVIDE ✅** (safe on zero or blank) · FORMAT (returns text) · SUMX (needs a table)

Sources: dax/best-practices/dax-variables; dax/best-practices/dax-divide-function-operator

### DLS-08 · single choice · difficulty 2

A new Direct Lake model must combine Delta tables from two lakehouses and a KQL database that has OneLake availability turned on. Which Direct Lake option should you choose?

- A. Direct Lake on SQL analytics endpoints — It uses a single Fabric source and doesn't support KQL databases.
- B. Either option, because both read any Delta table — Only Direct Lake on OneLake supports several sources and KQL databases.
- C. **Direct Lake on OneLake ✅** — It can use Delta tables from one or more Fabric items, including KQL databases with OneLake availability.
- D. Neither; KQL data needs a separate DirectQuery model — Direct Lake on OneLake supports KQL databases with OneLake availability on.

Source: fabric/fundamentals/direct-lake-overview

### CS3-03 · multi-select · difficulty 3 · case Saltmarsh Haulage

Saltmarsh must keep six years of shipments and reload only the last seven days each night. Shipments carry a LastModified column, and the policy partitions on ShipDate. Which two settings should the incremental refresh policy use? Choose two.

- **Archive data starting 6 years before the refresh date, and incrementally refresh 7 days before ✅** — The archive period keeps history; the refresh period is the reloaded window.
- **Detect data changes using the LastModified column ✅** — Only periods whose LastModified value changed are refreshed, and it isn't the partition column.
- Detect data changes using the ShipDate column — Learn says the detect-changes column shouldn't be the column used to partition.
- Archive data starting 7 days before, and incrementally refresh 6 years before — This swaps the periods and reloads six years each night.

Source: power-bi/connect-data/incremental-refresh-configure

## Deviations from the prompt and plan

- **Total is 382, not ~360.** Domain shares are inside the ranges, and the extra questions mostly sit on wide bullets (P2.3, P1.3, P3.3).
- **Format mix is heavier on single choice than planned:**

  | Format | Plan | Actual |
  |---|---|---|
  | Single choice | ~62% | 68% |
  | Drop-down | ~8% | 4.7% |
  | Ordering | ~6% | 3.4% |
  | Yes/No | ~8% | 11.5% |

  Two drop-down drafts were converted to single choice (TI-10, RL-03) because they weren't T-SQL, KQL, or DAX. Several code questions were written as single choice, with whole statements as options. Step 5's puzzles add more code completion.
- **Difficulty is 21/62/17**, against a planned 30/50/20. Most questions are scenario-style level 2. Case-study questions lean level 2–3.
- **Placement on full-overlap machines.** Questions are marked placement-eligible only when they test what DP-600 adds. PL-300-level questions on these machines (for example LG-08 on refresh limits, WF-03 on fact vs dimension, PC-10 on REMOVEFILTERS) aren't marked.
- **Four reviewer agents, not one.** One fresh agent per floor and one for the case studies. Each ran both passes. None of them wrote questions.
- **New checks beyond the list:** case-study structure (4 cases, 6–8 questions, all domains), banned terms, and duplicate ids. `check:links` now also fetches question sources.
- **One Preview question only** (IB-12). The prompt allowed up to 5%, and none was needed.
- **Commits went straight to `main`**, as in Steps 1–2. Front Office was its own commit before the Prepare floor.

Step 4 isn't started.
