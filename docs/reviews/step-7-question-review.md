# Step 7 question review

**Scope:** the 62 new Step 7 questions.
- 47 difficulty-3 scenario questions: Prepare 20 (`prepare/hard.ts`), Semantic 18 (`semantic/hard.ts`), Maintain 9 (`maintain/hard.ts`).
- 15 case-study questions: CS5 Corrowmere Seed Cooperative (7) and CS6 Brindlecombe Transit (8), in `cases2.ts`.

**Method:** a separate reviewer agent, which didn't write the questions, reviewed them in two passes.
1. **Blind pass.** It answered all 62 from `npm run export:questions -- all <dir> '(-H\d+$|^CS[56]-)'` (stems and options only) before opening the key. `scripts/compare-review.ts` reported **62/62 match**, so there were no disagreements to settle.
2. **Source pass.** It fetched every cited learn.microsoft.com page (69 pages) and checked:
   - that each key is confirmed (with quotes)
   - that every explanation is accurate
   - that no distractor is also correct
   - that difficulty 3 really needs combined facts
   - that case questions are answerable from the case text plus Learn

**Company names:** a web search for each new company found no real company with that name. The closest hits were different names: Corocraft, Cormar Carpets, and Merrow for "Corrowmere"; Brimblecombe, Brinicombe, and Brimilcombe for "Brindlecombe".

## Findings and resolutions

| # | Question | Finding | Resolution |
|---|---|---|---|
| 1 | RB-H2 | Ambiguous: "see only the products in its own category" isn't delivered by a view that joins every product. | The requirement is now "query the product data without being granted access to the base tables". The explanation cites CREATE VIEW's "access data through the view without … permissions on the base tables". |
| 2 | JH-H1 (c) | The explanation said implicit aggregations "stop working"; Learn says existing implicit measures keep working, and new ones can't be created. | Explanation reworded to match Learn. |
| 3 | SL-H2 s2 | "Endorsement doesn't change who can access the item" isn't stated on the cited page. | Statement replaced with "Only users the Fabric admin specifies can certify items" (Yes), confirmed on the endorsement overview. |
| 4 | SL-H2 s3 | Wording. | Rewritten as "Promoting an item requires approval from a Fabric admin" (No: anyone with write permission can promote). Yes/No balance kept. |
| 5 | TI-H2 | "Changes show up immediately" isn't Learn's wording for shortcuts. | Stem now says "always reading the current files at the source". The explanation says a shortcut behaves like a symbolic link with no copy. |
| 6 | DL-H1 (a), CS6-04 (d) | "Hybrid tables are created by an incremental refresh policy" overstated it. | Now "usually created through an incremental refresh policy with real-time DirectQuery". |
| 7 | CS5-01 (a) | The claim about semantic model OneLake integration wasn't on the only cited page. | Added `onelake-integration-overview` as a source. |
| 8 | CM-H1 slot 3 (c) | Weak reason ("isn't used in Learn's examples"). | Now "NULLS LAST only controls where NULLs sort; DESC is what makes the newest row number 1". |
| 9 | IB-H1 | "Each week" implied a recurring job, but Save as table is a one-off CTAS. | "Each week" removed. |
| 10 | CS5-05 | The case didn't say how Viewers can read the data under Direct Lake on OneLake. | The case environment now says models connect with a fixed identity, a concept on Manage Direct Lake semantic models. |
| 11 | CS6-06, SL-H3, PB-H1, KT-H1, DLS-H2, TF-H1 | These need only one fact, so they aren't really difficulty 3. | All six lowered to difficulty 2. |

The remaining questions were confirmed with no issue. QUALIFY support in Fabric was checked on the QUALIFY page, which applies to the warehouse and the SQL analytics endpoint.

## Result

| | Before Step 7 | After |
|---|---|---|
| Questions | 402 | 464 |
| Difficulty 1 / 2 / 3 | 85 / 250 / 67 | 85 / 263 / 116 |
| Difficulty-3 share | 16.7% | 25.0% |
| Maintain / Prepare / Semantic | 26.2% / 46.5% / 27.3% | 25.7% / 45.6% / 28.7% |

Case studies: 6. All `check:content` rules pass.
