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

## Gatehouse & Pattern Room (87 written, 86 kept)

**Blind pass: 87/87 match.**

Reviewer flags from the blind pass:

| Question | Flag | Resolution |
|---|---|---|
| SL-06 | Giveaway: the key was a bare "No". | Key now reads "No, label access control isn't supported across tenants"; distractors balanced. |
| GK-06 | The stem led with a Contributor scenario but asked about Viewers. | Stem rewritten neutrally. |
| GK-09 | Contributors and Viewers can share if they have Reshare. | Stem now says "by default … a Contributor without Reshare permission". GK-01's explanation was updated to match. |
| GK-03 | "RLS applies only to Viewers" overstated (users with item access but no role are also filtered). | Key reworded: "RLS doesn't apply to Contributors or higher roles". |
| CV-09 | Rules can only be set on items that already exist in the target stage. | Rebuilt as 5 steps: deploy to Production, define the rule, redeploy. Matches create-rules: "Your rules don't apply until you deploy". |
| RL-06 | Two prompts share a choice, and one choice is unused. | Stem now says choices may be reused or left unused. |
| RM-05 | The correct option was the most specific. | Distractor lengthened. |
| TS-05 s3, TS-11 | Asked to confirm the source and preview status. | CREATE USER sentence is on the cited sql-granular-permissions page. ReadWrite isn't labeled preview; only third-party engine enforcement is. |

**Source pass: 82 supported, 5 partly supported, 0 not supported, 0 unreachable** (32 pages fetched).

| Question | Finding | Resolution |
|---|---|---|
| GK-07 | The cited pages don't *recommend* security groups. | OneLake security get-started page added ("Simplify the management of Fabric workspace roles by assigning them to security groups"). |
| GK-08 | "Data plane" is defined on an uncited page. | Same page added ("Data plane permissions: Govern what data you can see or change"). |
| TS-06 | The stem didn't fix DirectLakeBehavior, so "they fail" was defensible. | Stem now says the setting is left at its default. How Direct Lake works (cited) marks Automatic as "(Default)". Distractor explanations corrected. |
| RL-04 s1 | Pro-workspace XMLA claim judged implied. | No change: the cited large-models page says "Semantic models in Pro workspaces do not support XMLA-based write operations." |
| SL-09 | No cited page says endorsement doesn't change access; the key was an inference. | **Dropped.** |

**Dropped: SL-09** (key not stated on Learn).

## Case studies (4 cases, 30 questions)

**Blind pass: 30/30 match.**

Reviewer flags from the blind pass:

| Question | Flag | Resolution |
|---|---|---|
| Company names | "Tidewater" is a real company (Tidewater Inc.), and "Brightwell" may resemble real firms. | All four renamed to invented names: Fernhollow Outfitters, Quillmere Health, Saltmarsh Haulage, Lumenvale Utilities. |
| CS1-04 | Without "Direct Lake" in the stem, Import was defensible. | Stem names Direct Lake. Import and DirectQuery options replaced with Direct Lake on SQL variants. |
| CS1-06 | Muddled option wording. | Fixed: "A security policy in the gold warehouse". |
| CS2-05 | The case says researchers have no role, yet the stem had them querying the warehouse. | Stem now says the warehouse is shared with them (Read All with SQL analytics endpoint). |
| CS3-02 | "What does Learn suggest" sounded like a giveaway. | Reworded. |
| CS3-04 | "Meets both needs" overclaimed the XMLA link. | Stem asks for the setting required beyond 10 GB and recommended for XMLA writes, which is exactly Learn's wording. |
| CS3-07 | Asked to confirm the XMLA default. | Confirmed: "By default, read-only connectivity using the endpoint is enabled." |

**Source pass: 27 supported, 3 partly supported, 0 not supported, 0 unreachable** (40 pages fetched).

| Question | Finding | Resolution |
|---|---|---|
| CS1-07 | s1 said "Prod lakehouse", but this case's gold layer is a warehouse. | Changed to "the Prod gold warehouse". |
| CS2-04 | Dual needs Import and DirectQuery tables from the same source; the stem didn't say so. | Stem now says admissions, Ward, and Date come from the same Azure SQL database. |
| CS2-06 | Option c's explanation was wrong: Viewers don't get ReadAll. | Explanation rewritten. |
| CS3-03, CS2-01 | Minor explanation wording. | Aligned with Learn. |
| CS3-06 | The lineage-view explanation relied on an uncited page. | Lineage page added as a source. |

**Dropped: none.**

## Totals

- Questions written: 384. Dropped: 2 (DLS-05, SL-09). Kept: **382**.
- Blind-pass agreement before fixes: 384/384.
- Source passes: 0 keys unsupported. Every partly supported item was fixed or dropped as listed above.
