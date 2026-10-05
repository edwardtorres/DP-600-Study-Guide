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
