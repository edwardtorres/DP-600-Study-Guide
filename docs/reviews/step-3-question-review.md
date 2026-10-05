# Step 3 question review log

Each floor's questions are reviewed by a separate agent that didn't write them:

1. **Blind pass**: the agent answers the questions without the key, and `scripts/compare-review.ts` diffs its answers against the key.
2. **Source pass**: the agent reads the keyed questions, fetches every cited Learn page, and reports whether each source supports the key and the explanations.

Every disagreement or unsupported item is listed below with its resolution.

## Front Office (12 questions)

**Blind pass: 12/12 match.**

Reviewer flags (keys unchanged):

| Question | Flag | Resolution |
|---|---|---|
| FO-04 | The PPU option isn't a capacity, so it's a weak distractor for "smallest capacity". | Stem reworded to "What should you assign the workspace to?", so PPU is a fair distractor. |
| FO-09 | SQL database in Fabric also runs T-SQL procedures. | Explanation now says why the warehouse fits better (Learn positions SQL database for OLTP). |
| FO-11 s1 | The trial is "either F4 or F64", which may surprise learners. | Superseded: statement replaced (see the source pass). |
| FO-12 | An optional "agree to terms" step sits between Start trial and Activate. | Order still unambiguous; no change. |

**Source pass: 11 supported, 1 partly supported, 0 not supported.**

| Question | Finding | Resolution |
|---|---|---|
| FO-02 | Partly: "170+ sources" is outdated (the overview says 200+ connectors), and "Copy job" isn't on the cited pages. | Prompt reworded without a count. Copy job removed from the explanation. Data Factory overview added as a source. |
| FO-08 | Option c's explanation called OneLake availability eventhouse-only, but the warehouse overview also mentions it. | Explanation rewritten: availability and sync don't convert CSV files; only Delta tables appear in the endpoint. |
| FO-12 | Explanation said "home region", but Learn says "trial capacity region" (default = home region). | Explanation corrected. |
| FO-06 | The "workspace folders" explanation wasn't backed by a cited page. | Workspaces page (folders) added as a source. |
| FO-07 | The eventhouse distractor explanation wasn't backed by a cited page. | Eventhouse overview added as a source. |
| FO-10 | The ".pbix export" claim wasn't on the cited page. | Explanation rewritten to state only Learn's guidance. |
| FO-11 s1 | **Learn contradicts itself.** The trial page says F4 or F64; the licenses page lists the trial only as 64 CUs. | Statement replaced with a different, unambiguous trial fact. The contradiction is added to Mill Lease's needs-verification list (Step 8). |

**Dropped: none.**

## Spinning Floor & Dye House (161 questions)

**Blind pass: 161/161 match.**

Reviewer flags from the blind pass (keys unchanged):

| Question | Flag | Resolution |
|---|---|---|
| KT-13 | The stem said "August 1 to 30 inclusive", but `datetime(2007-08-30)` stops at midnight. | Stem and option now use Learn's exact range: `datetime(2007-08-01 00:00:00) .. datetime(2007-08-30 23:59:59)`. |
| TI-13 s1 | Tables shortcuts are top-level only, but in a schema-enabled lakehouse a shortcut can point at a schema. | Stem now says the lakehouse doesn't use schemas. |
| CM-20 | Distractor `TOP (1) WITH TIES` ordered by `ROW_NUMBER()` could also return one row per color. | Replaced with `GROUP BY Color, Product`. |
| KT-12 | `dcount()` returns an estimate, not an exact `COUNT(DISTINCT)`. | Stem now says an estimate is acceptable. The dcount reference page was added as a source ("Calculates an estimate"). |
| TF-11 | The tutorial uses a temporary view with GROUP BY, then `CREATE OR REPLACE TABLE … AS SELECT`. | Option text now describes both steps. |
| DV-09 | Questioned the `` delta.`Tables/...` `` path syntax. | No syntax change: it is the tutorial's exact syntax. The stem now says the lakehouse has schemas enabled. |
| KT-10 s2 | "Aggregations ignore nulls" was too broad, because `count()` counts nulls. | Statement now names sum() and avg(). The explanation notes that count() is the exception. |
| BC-05, SS-06, TF-04, VS-07 | The correct option was noticeably the longest. | Distractors lengthened. |
| BC-04, TF-06, CM-17, BC-06 | Unsure of the source. | Confirmed in the source pass (below). |

**Source pass: 158 supported, 3 partly supported, 0 not supported, 0 unreachable** (58 pages fetched).

| Question | Finding | Resolution |
|---|---|---|
| TI-11 | A distractor's explanation claimed "COPY INTO is recommended for new ingestion code", which isn't on the page. Learn says BULK INSERT maps to COPY INTO behavior, so it is arguably high-throughput too. | BULK INSERT distractor replaced with "Batches of INSERT … VALUES statements". |
| SS-06 | A distractor's explanation described the database-level option, but the stem is about a table. | Explanation now quotes Learn: "Turning on at the table level makes only that table and its data available in OneLake." |
| WP-12 | "NOT NULL dimension keys" is on the fact-tables page, not the cited load-tables page. | Fact-tables page added as a source. |

**Found while writing (not reviewer items):**

- The DAX best-practice page "Avoid converting BLANKs to values" (`dax/best-practices/dax-avoid-converting-blank-values`) returns 404. No question cites it, and the Loom Hall draft that relied on it was replaced.
- The SQL analytics endpoint page now says "Scalar UDFs are supported when inlineable". The Fabric `CREATE FUNCTION` page says "Scalar UDFs … are preview features". This bears on needs-verification item 5 (Recipe Book). The item stays queued for Step 8, and no question uses scalar UDFs.

**Dropped: none.**

## Loom Hall (94 written, 93 kept)

**Blind pass: 94/94 match.**

Reviewer flags from the blind pass:

| Question | Flag | Resolution |
|---|---|---|
| DLS-05 | **Learn contradicts itself.** How Direct Lake works says one table over a guardrail "prevents Direct Lake mode for the entire model". The overview says the other guardrails "are evaluated per query". | **Dropped.** The key depends on an unresolved conflict. |
| DLS-13 | The Snowflake option rests only on the creation-experience support table, so the key is fragile. | Replaced with "Use a SQL view in the SQL analytics endpoint as a model table" (only on SQL can read SQL views by falling back). |
| BW-10 | The key said to convert "the parameters", which contradicted the stem's "must stay Date/Time". | Key reworded: convert their values in the filter step. |
| WB-05 | The key needed to make clear the Pro workspace isn't on Reserved Capacity for Pro Workspaces. | Key now states it. |
| WF-08 | "Hide the bridging table" could happen at any point. | Step removed; the order now has 3 steps. |
| PC-09 s3 | Awkward wording about EARLIER. | Reworded to Learn's point: variables remove the need for EARLIER/EARLIEST. |

**Source pass: 88 supported, 5 partly supported, 0 not supported, 0 unreachable** (35 pages fetched).

| Question | Finding | Resolution |
|---|---|---|
| SG-11 | No source says "compare timings" in step i3. | Step reworded to "run the query to check it". |
| PC-08 | The filter-functions page also lists OFFSET, so the "filter function" label fit two prompts. | Labels now use the outline's own terms: "Windowing" and "Table filtering (CALCULATE filter modifier)". |
| DL-03 | Neither cited page uses the term "hybrid table". | The storage-modes page ("The easiest way to create a hybrid table…") added as a source. Also added to BW-06. |
| DLS-12 | The "recommended for new models" sentence is on How Direct Lake works, not the overview. | How Direct Lake works added as a source. |
| BW-02 | A distractor explanation ("keeps no rows") was wrong. | Rewritten: it drops the start boundary and loads rows after RangeEnd. |

**Dropped: DLS-05** (Learn contradiction, see above).
