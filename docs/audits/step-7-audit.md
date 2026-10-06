# Step 7 audit: bridge-table lab fix, harder questions, case studies, spaced review, Weak Spots, mock exam

Commits on `main`:
- fec73ee Part A
- b57c70e questions, case studies, save v5, review/weak/mock logic
- 4791ecb question review fixes and log
- d83c3a6 UI and e2e
- fdfbebb bundle check fix
- the CLAUDE.md update and this audit

## Part A: bridge tables (S1.3)

| Lab step | What it does | Sources |
|---|---|---|
| **L04 s9** (optional) | CTAS a bridge in Mill_Warehouse from data the lab already loads: `CREATE TABLE dbo.bridge_customer_product AS SELECT DISTINCT customer_key, product_key FROM fact.sales`. It notes that dbo exists and that the bridge must be re-created if `fact.sales` is reloaded. | T-SQL CTAS (Fabric syntax section), Learn's many-to-many guidance, exercise 26d |
| **L07 s8** (optional, needs Lab 4 step 9) | Build Bridge Model from the warehouse (how-to from *Create a semantic model*): customer → bridge and product → bridge one-to-many, product → fact one-to-many; **Both** on the product-to-bridge relationship; no customer → fact relationship (an ambiguous path) and no many-to-many cardinality; hide the bridge and key columns. It explains what the result means and that a real bridge is needed when the fact lacks the other key (Learn's accounts and customers). The checkpoint is non-additive customer totals. The required cleanup now deletes Bridge Model. | Many-to-many guidance (both sections), relationships (cross-filter direction, path ambiguity), editing models in the service, warehouse model creation |

- **S1.3 removed from `LABS_PARTIAL`.** The labs now cover 41/41 bullets; three remain partial (M1.2, M1.3, M1.4).
- **Lab reviewer on these two steps:** 0 blockers, 2 major, 7 minor, all fixed. See `docs/reviews/step-7-lab-review.md`.
  - The main finding: the customer value is "sales of products that customer bought", not the customer's own sales. The step now explains this.
  - The CTAS link pointed at the Synapse syntax section; it now points at the Fabric one (`#syntax-1`).
- `check:links`: all 208 lab sections exist.

## Part B: harder content

**62 new questions** = 47 scenario questions (`prepare/hard.ts`, `semantic/hard.ts`, `maintain/hard.ts`) + 15 in two new case studies (`cases2.ts`).

| Domain | Scenario questions | Case questions | New total | Bank total | Share (official) | Difficulty 3 in domain |
|---|---|---|---|---|---|---|
| Prepare data | 20 | 5 | 25 | 197 | 45.6% (45–50) | 46 |
| Semantic models | 18 | 5 | 23 | 124 | 28.7% (25–30) | 44 |
| Maintain | 9 | 5 | 14 | 111 | 25.7% (25–30) | 24 |

**New questions by bullet:**
- **Maintain:** M1.1 1, M1.3 1, M1.4 2, M1.5 2, M2.1 2, M2.2 1, M2.4 2, M2.5 2, M2.6 1
- **Prepare:** P1.1 1, P1.2 2, P1.3 2, P1.4 1, P1.5 1, P2.1 2, P2.2 1, P2.3 3, P2.4 2, P2.5 1, P2.6 1, P2.7 3, P2.8 1, P2.9 1, P3.1 1, P3.2 1, P3.3 2
- **Semantic:** S1.1 1, S1.2 2, S1.3 1, S1.4 2, S1.5 3, S1.6 2, S1.7 2, S2.1 2, S2.2 1, S2.3 2, S2.4 2, S2.5 3

New questions were aimed at bullets with the fewest difficulty-3 questions (for example P1.1, P1.2, P2.4, P2.7, S1.2, and M1.5 had none).

**Formats of the new questions:** single 44, yesno 6, multi 5, dropdown 4 (T-SQL, KQL, DAX), match 2, order 1.

**Difficulty mix**

| | Before (Step 6) | After |
|---|---|---|
| Questions | 402 | 464 |
| Difficulty 1 / 2 / 3 | 85 / 250 / 67 | 85 / 263 / 116 |
| Difficulty-3 share | **16.7%** | **25.0%** |
| New questions | — | 49 at difficulty 3, 13 at difficulty 2 (6 lowered after review) |

Every `check:content` rule still passes:
- answer positions 25.2 / 25.2 / 24.8 / 24.8%
- correct option strictly longest 34.6% (limit 40%)
- multi-select positions 47–53%
- Yes/No answered Yes 53.7%
- Preview 0.2%
- no near-duplicate stems
- no banned terms
- ≥6 questions per bullet

### The two new case studies

Names were checked by web search; no real company has either name.

| Case | Scenario | Questions (bullet) |
|---|---|---|
| **CS5 Corrowmere Seed Cooperative** | A farming cooperative. Soil-moisture sensors stream into an eventhouse (months of history), seed orders in a warehouse with resent versions, grower data in a lakehouse in another workspace, analysts' targets in a spreadsheet, a fixed-identity model, Git plus a 3-stage deployment pipeline. | OneLake availability with "Apply to existing tables" (P1.5); Direct Lake on OneLake plus an Import table (S2.4); hourly KQL (P3.3); QUALIFY de-duplication (P2.7); semantic model RLS for Viewers (M1.3); a cross-workspace shortcut (P1.3); Update vs Commit after a merged PR (M2.1) |
| **CS6 Brindlecombe Transit** | A transit authority. A 7 GB Import ridership model growing past 10 GB, six years of history, live fares in a SQL source, renamed stops, Tabular Editor saves failing, a protected sensitivity label, reports in other workspaces. | Incremental refresh periods and filter (S2.5); large storage format (S1.6); XMLA read-write (M2.5); Dual dimensions (S1.7); impact analysis (M2.4); label protection on export (M1.4, choose two); SCD type 2 (P2.3); field parameter (S1.5) |

`CASE_STUDY_COUNT` is now 6. Case questions are used only in mocks (never in inspections, debriefs, or daily review).

## Reviewer disagreements and resolutions

A separate reviewer agent first answered all 62 new questions blind: **62/62 matched the key** (`compare-review.ts`), so there were no disagreements. In a second pass it fetched all 69 cited pages and reported 11 findings. All are fixed and logged in `docs/reviews/step-7-question-review.md`:

1. **RB-H2 (ambiguous):** a view joining every product doesn't restrict rows to one category. The requirement is now "query the product data without being granted access to the base tables".
2. **JH-H1:** the explanation now says existing implicit measures keep working; new ones can't be created.
3. **SL-H2 s2 (unsupported):** replaced with a statement Learn confirms (only admin-specified users certify).
4. **SL-H2 s3:** reworded (promotion needs no admin approval).
5. **TI-H2:** "immediately" removed; the explanation now says a shortcut behaves like a symbolic link, with no copy.
6. **DL-H1 and CS6-04:** "hybrid tables are *usually* created through an incremental refresh policy".
7. **CS5-01:** added the semantic model OneLake integration page as a source.
8. **CM-H1:** the NULLS LAST explanation now gives a real reason.
9. **IB-H1:** "each week" removed (Save as table is a one-off CTAS).
10. **CS5-05:** the case now states the model uses a fixed identity.
11. **Difficulty:** six single-fact questions lowered to difficulty 2 (CS6-06, SL-H3, PB-H1, KT-H1, DLS-H2, TF-H1).

## Part C: review intervals, daily cap, maintenance threshold

**Intervals.** A question's streak is the number of correct answers in a row; a miss resets it to 0.

| Streak | 0 (miss) | 1 | 2 | 3 | 4 | 5+ |
|---|---|---|---|---|---|---|
| Comes back after | 1 day | 2 days | 4 days | 7 days | 14 days | 30 days |

Days are local calendar days, counted from the day of the last answer.

**Daily cap: 20 review answers per local day.**
- The queue takes due questions first: most overdue, then shortest streak.
- If fewer are due than the cap allows, it tops up from the weakest bullets, round-robin, unseen questions first. The top-up order is seeded by the day.
- Case-study questions are never reviewed.
- Answers log as `'r'`: they count in readiness, earn normal XP with the repeat rule, and never certify.

**Maintenance.** A certified machine needs maintenance when its last 8 review or mock answers (at least 5) score **below 60%**.
- The map shows a "Needs maintenance" mark, and there is a legend entry.
- The machine panel and the Daily review page offer a 5-question set, recent misses first.
- The certification is never removed (unit tests and e2e).

**Weak Spots.**
- Bullets are ranked by accuracy over their last 20 answers (inspection, placement, debrief, review, mock), each showing its correct/total count. Bullets with fewer than 3 answers are listed as "not enough data".
- It lists the "don't confuse" pairs missed most.
- Each weak bullet links to its notes, a puzzle (opens if the machine is unlocked), and a lab.

## Part D: mock exam

**Facts from Microsoft's pages (fetched 2026-10-06, recorded in CLAUDE.md)**

| Fact | Source |
|---|---|
| "You will have 100 minutes to complete this assessment." | DP-600 certification page |
| Associate role-based exams without labs: 100 minutes (120 minutes seat time) | Exam duration and exam experience |
| "Most Microsoft Certification exams typically contain between 40-60 questions; however, the number can vary depending on the exam." **No DP-600-specific count is stated.** | Exam duration and exam experience |
| Scores run 1–1,000; 700 passes; "As this is a scaled score, it may not equal 70% of the points." | Exam scoring and score reports |
| In a case study, after a break you can't return to questions seen before it. | Exam duration and exam experience |
| Free DP-600 practice assessment (assessmentId=90) | Linked from the certification page |

**How the draw works (`drawMock`)**
1. **Case study (Section 1):** one you haven't seen in any mock; once all six are used, the least recently used one, and the start screen says so. All its questions are included (7 or 8).
2. **Main section (Section 2):** the mock totals **50**.
   - The domain counts come from the official weight midpoints (47.5 / 27.5 / 27.5, normalized) for all 50, minus the case study's own domain counts. Unit tests check every domain within ±1 of its weighted share.
3. **Within each domain:** questions are spread round-robin over its bullets.
   - It **excludes the last mock's questions** (unless the domain would run short).
   - It **prefers questions not answered in the last 14 days**, then the least recently answered.
   - Orientation-only questions are never drawn.
4. **Order:** Section 2 and every question's options are shuffled with a seed saved in the mock, so a reload shows the same order.

**Exam experience**
- **Timer:** a visible timer computed from `activeMock.startedAt` in the save, so it keeps running across reloads. At zero the mock submits itself, and a mock that expired while the app was closed is submitted on load.
- **Mark for review**, number pills (answered or marked), and a review screen with jump links before submitting.
- **No feedback** until the end. Unanswered questions count as wrong (the submit dialog warns you).
- **Case lock:** "Leave case study" shows a warning ("You can't return to this section…"). Confirming locks Section 1, and its questions disappear from navigation and can't be changed (also enforced in `setMockResponse`).

**Results**
- Raw percentage overall, by domain (with bars), and by bullet, weakest first.
- Every question with your answer, the key, every explanation, and its sources.
- The trap pairs you fell for, linked to the notes.
- A history of all mocks: score, domains, case study, time, and timed-out.
- The note: "Microsoft reports exam scores on a scale of 1 to 1,000, and 700 passes. Learn says that because it's a scaled score, it may not equal 70% of the points, so this raw percentage can't predict your exam score exactly."

**Ready to book:** shown only when the two most recent full mocks each score **≥ 80%** overall with **every domain ≥ 70%**. Short (dev) mocks don't count. The panel links Microsoft's free practice assessment as an outside check.

**Logging:** mock answers log as `'m'` (one per question): they count in readiness, earn XP, and never certify.

## Save v5

- **Adds:** codes `'r'` and `'m'`, `mocks` (finished mocks with ids, correct flags, responses, seed, and timing), and an optional `activeMock`.
- **Migration `{ from: 4 }`** adds `mocks: []`. It's tested on a **real v4 save captured from the Step 6 app** (`src/save/fixtures/save-v4.json`: start-up answers, a completed lab with a problem note, a trial start date, and three `'l'` debrief answers). The v3, v2, and v1 chains are still tested.
- **Validators:** `isSaveV4` and earlier now reject codes they couldn't contain.

## e2e results (`npm run e2e`)

| Spec | desktop-1440 | phone-390 |
|---|---|---|
| **review-flow (new):** a fixture with 6 due questions, 15 reviews already today, and a certified machine with 5 recent wrong reviews. The machine shows the maintenance mark and stays certified. The Daily review page shows "6 due", "Reviewed today: 15 of 20", and the maintenance list. The session has 5 questions (the cap), answered with one wrong: "4 of 5 correct". Five `'r'` entries are logged, the certification is unchanged, and the header then shows "Daily review (1)" and "reached today's review cap". | ✓ | ✓ |
| **mock-flow (new, `?mock=short`):** start (not ready to book). Section 1 shows the case study and a 10:00 timer. Answer the case questions with no feedback. "Leave case study" → warning → Stay → leave again → confirm. Only the 6 main questions remain in navigation (`caseLocked`). Answer and mark one question, answer another, then **reload**: the timer kept counting down and both answers and the mark are kept. Answer all but one, open the review screen ("1 unanswered · 1 marked", Section 1 locked), and submit after the unanswered warning. Results show the overall %, 3 domains, bullets, the traps section, the scaled-score note, and every question (with wrong ones marked). Every answer is logged as `'m'`, no machine changes, and the history shows "(short)". | ✓ | ✓ |
| lab-flow, machine-flow, placement-flow, puzzle-flow | ✓ | ✓ |

**12 passed.**
- Interaction is by tap; the mark checkbox is tapped too.
- Every spec asserts no page errors and checks for sideways scrolling at 390 px.
- Screenshots: `PW_SHOTS=<dir>`.
- One regression was found and fixed during e2e: the daily queue's top-up consumed the app's seeded random source on every render, which shifted puzzle seeds. It now uses its own per-day seed.

## Tests and checks

| Check | Result |
|---|---|
| `npm test` | **252 passed** (25 files). New: `review.test.ts`, `weak.test.ts`, `mock.test.ts`, short-mock hook tests, r/m readiness and XP, and the v4 → v5 migration. |
| `npm run check` (typecheck, lint, content, secrets, tests) | Passes |
| `npm run build` (+ bundle check) | Passes. The bundle check now also fails on the `?mock=short` hook, and its positive control reads both hook sources. |
| `npm run check:links` | Passes: 218 URLs return 200, and all 208 lab sections exist |
| `npm run e2e` | 12 passed (6 specs × 2 widths) |
| `npm run check:secrets` | Passes |

**Unit-test coverage by area:**
- **Intervals:** miss → next day, 1/2/4/7/14/30, time-zone days, puzzles ignored.
- **Daily queue:** most overdue first, the cap counting today's reviews, top-up from the weakest bullets, case questions excluded, `'r'` logging.
- **Maintenance:** under 60% flags, 60% doesn't, at least 5 answers needed, last-8 window, certified only, no certification change, the 5-question set with misses first.
- **Weak Spots:** ranking, the minimum answer count, window and code filtering, trap-pair counts.
- **Mock draw:** an unseen case then the least recent, 50 questions with domains within ±1, an exact main-section size for every case, bullet spread, last-mock avoidance, recency preference, no orientation questions, short mode.
- **Mock timer:** remaining time from the start, persisting through a save round-trip, never negative.
- **Mock case lock:** responses and marks.
- **Mock scoring:** full credit, unanswered counts wrong, `'m'` logging, no machine changes, per-domain and per-bullet tallies.
- **Ready to book:** two in a row, the domain floor, short mocks ignored.

## Things I'm unsure of

- **The interval and threshold values** (1/2/4/7/14/30 days, 20 a day, 60% over 8 answers, 14 days "recent") are design choices, not Microsoft facts. They're documented in CLAUDE.md and easy to tune.
- **"50 questions"** is my reading of Microsoft's general 40–60 statement; no DP-600 count is published.
- **Raw mock percentages and the 80%/70% ready-to-book rule** can't be mapped to Microsoft's scaled 700; the UI says so.
- **The CS5 fixed-identity detail** was added so the RLS question has a clear premise. Learn describes fixed identity on Manage Direct Lake semantic models, but the case doesn't test it.
- **The bridge-table lab steps (L04 s9, L07 s8)** are still untested in Fabric, like the other labs.

## Deviations from the request

- **47 scenario questions instead of about 45:** Maintain got 9 instead of 7, to keep its share above 25% once the Prepare and Semantic questions were added (it dipped to 23.8% in between).
- **Difficulty 3 lands at exactly 25.0%:** after the reviewer's finding, six questions were lowered to difficulty 2 rather than rewritten.
- **The case study is Section 1 (first):** the request didn't fix its position; putting it first makes the "can't go back" lock meaningful.
- **Dev short mode:** 6 main questions plus the whole case study (7–8), so a short mock has 13–14 questions.
- **A mock in progress reopens automatically on reload** (with its timer). An expired one is submitted on load.
- **Weak Spots has no e2e spec** (not requested); its logic is unit-tested.

Step 8 waits for your approval.
