# Step 4 audit: Answer-order fix and core game loop

Step 4 is pushed to `main` in seven commits, plus this audit:

| Commit | What it contains |
|---|---|
| `18d99a1` | Part A |
| `915aec2` | 20 new Front Office questions |
| `5a45d70` | Save v2 and game logic |
| `67c8be1` | Renderers, attempts, progression UI, and settings |
| `78111d8` | Result wording |
| `ddebf5b` | Placement attempts count when they start |

All commits use the noreply address and carry no session link.

## Results

| Check | Result |
|---|---|
| Typecheck, lint | Pass (0 warnings) |
| `npm test` | 97/97 pass in 13 files |
| `check:content` (strict) | Pass. 402 questions; multi-select and Yes/No distribution rules are on. |
| `check:links` | 132/132 Learn URLs return 200 |
| `check:secrets` | Pass (105 files) |
| `npm run build` | Pass |
| Playwright, 1440 px and 390 px | Full machine flow and placement flow pass at both widths, using taps only for matching and ordering. No page errors and no page-level horizontal scroll (details below). |

## Part A: answer order

1. **Render-time shuffle** (`src/game/shuffle.ts`).
   - Every format is shuffled per attempt: single-choice options, multi-select options, Yes/No statement order, matching choices (right-hand side), ordering items, and each drop-down slot's choices.
   - The shuffle uses a seeded PRNG (mulberry32), seeded by an attempt seed XOR a hash of the question id. That makes it stable within one attempt and new on every attempt.
   - Ids and keys are untouched, so explanations stay with their options.
   - Ordering items are re-shuffled until they're not in the answer order.
   - Tests cover stability, change between attempts for all 6 formats, and "never starts solved" for every ordering question across 200 seeds each.
2. **New `check:content` rules, reported in the summary.** The source files were rebalanced: a one-off script reordered each multi-select's option lines and relabelled ids, cycling the correct pair through all six position combinations. Every key still points at its "Correct." explanation (verified: 0 mismatches). The check passes on the bank itself, not on the render-time shuffle.

   | Distribution | Before | After |
   |---|---|---|
   | Multi-select (4 options) correct by position | 1 = 24/26 (92%), 2 = 26/26 (100%), 3 = 2/26 (8%), 4 = 0/26 (0%) | 1 = 13/27 (48.1%), 2 = 14/27 (51.9%), 3 = 14/27 (51.9%), 4 = 13/27 (48.1%) (limit 60%) |
   | Yes/No statements answered Yes | 71/132 (53.8%) | 79/144 (54.9%) (range 40–60%; no rebalancing needed) |

   The "after" counts include the new Front Office questions. Validator tests show both rules failing on skewed input.
3. **CLAUDE.md roadmap, Step 7:** "raise the difficulty-3 share of the question bank to about 25% (17% after Step 3) with new scenario questions, concentrated in Prepare data and Semantic models." It's 16.7% now (67 of 402).

## Front Office questions (your choice in planning)
Each Orientation machine went from 3 to 8 questions (FO-13 to FO-32), so it can support a 2-question start-up check and a 5-question inspection.
- **Sources:** written from freshly fetched Learn pages: the Fabric overview, OneLake overview, throttling, licenses, trial, lakehouse, warehouse, eventhouse, and medallion architecture.
- **Avoided topics:** the F4/F64 trial-size contradiction and the Real-Time Analytics rename.
- **Review:** a fresh reviewer agent matched 20/20 in the blind pass. The source pass found 19 supported and 1 partly supported; the partly supported one was fixed.
- **Fixes and log:** I also applied two wording fixes from the blind pass (FO-20 uses Learn's stage names; FO-15 says "of the following"). Everything is logged in `docs/reviews/step-3-question-review.md` (Step 4 addendum).

I also caught one error of my own before the review: FO-25 statement 3 was true but keyed No. It's fixed.

Orientation doesn't count toward domain shares, which are unchanged: Prepare 46.5%, Semantic 27.3%, Maintain 26.2%.

## Lifecycle as built (`src/game/state.ts`)

| Transition | Rule |
|---|---|
| locked → idle | Every prerequisite is certified, whether by inspection or by placement. |
| idle → running | The machine's notes were opened (opening the machine panel, where the notes live, records `notesOpenedAt`), **and** a 2-question start-up check came back 2/2. A failed check offers "Try again (new draw)". |
| running → certified | A 5-question inspection scores 4 or 5 (at least 80%). A failed inspection offers a new draw, with no cooldown. |
| any → certified (placed) | PL-300 carryover machines only (17), available even while locked. 5 placement-eligible questions, 5/5 required. One attempt per machine per **local** calendar day. The attempt is used **when it starts**, so closing without submitting can't be used to preview the pool. Passing certifies the machine with `kind: 'placement'` and unlocks its dependents. |

- Only `recordAttempt()` writes certification, and only from a passed inspection or placement.
- XP, badges, and readiness are read-only views of the save.
- A placed machine shows a yellow **Placed** chip on the map, in the panel, and in the legend.

## Draw rules as built (`src/game/draw.ts`)
- **Pool:** the machine's own questions, never case-study questions (reserved for the mock exam).
- **Inspection (5):**
  1. One question per bullet on the machine.
  2. At least one question at difficulty 2 or higher.
  3. The rest filled at random.
  4. Final order shuffled.

  Questions not in the previous inspection are preferred at every step. Repeats are used only when the pool is too small: the smallest pools have 7 questions, so a second attempt can repeat at most 3.
- **Start-up check (2):** difficulty 1–2 preferred; avoids the previous start-up draw. These questions may also appear in later inspections.
- **Placement (5):** placement-eligible questions only (8–16 per machine); avoids the previous placement draw.
- **Tests:** every machine, 20 seeds each. Each inspection has 5 distinct questions, covers every bullet, and has at least one at difficulty 2+. No draw contains a case-study question. Repeats are bounded as described above.

## Scoring
Full credit only (`src/game/score.ts`, recorded in CLAUDE.md):

| Format | Counts as correct only if |
|---|---|
| Single choice | The key is chosen |
| Multi-select | Exactly the keyed set is chosen |
| Yes/No | Every statement is right |
| Matching | Every pair is right |
| Ordering | The whole sequence is right |
| Drop-down | Every slot is right |

Tests cover each format, including partly wrong answers.

## Progression

### XP
XP is per correct answer, derived from the answer log and never stored.

| Difficulty | First correct answer to a question | Later correct answers to the same question |
|---|---|---|
| 1 | 10 | 2 |
| 2 | 20 | 5 |
| 3 | 30 | 7 |

The 25% repeat rule is my addition, to stop farming XP by retrying inspections. Answering all 402 questions correctly once is worth 7,860 XP (85×10 + 250×20 + 67×30), just past level 13.

### Levels and ranks
Reaching level L needs 50·L·(L−1) XP.

| Level | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| XP | 100 | 300 | 600 | 1,000 | 1,500 | 2,100 | 2,800 | 3,600 | 4,500 | 5,500 | 6,600 | 7,800 |

| Rank | Levels | From XP |
|---|---|---|
| Apprentice | 1–3 | 0 |
| Journeyman | 4–6 | 600 |
| Weaver | 7–9 | 2,100 |
| Master Weaver | 10+ | 4,500 |

### Streak
- A day counts once at least 10 questions are answered that local calendar day. Days are computed with `Intl.DateTimeFormat` in the device's time zone.
- The current streak runs back from today, or from yesterday if today isn't done yet. The best streak is also shown.
- Tests cover:
  - the same instant falling on different days in Los Angeles and Tokyo
  - the run surviving until the day ends, and breaking after a missed day
  - the US daylight-saving change on 2026-11-01

### Badges (13)
Derived from certifications and the answer log, each shown with the date earned.

| Badge | Earned when |
|---|---|
| Mill Keys | Every Front Office (Orientation) machine certified |
| Spinning Floor Foreman | Every Spinning Floor & Dye House machine certified |
| Loom Hall Foreman | Every Loom Hall machine certified |
| Gatekeeper | Every Gatehouse & Pattern Room machine certified |
| Kusto Tensioner | KQL (Kusto Tension Meter) certified |
| DAX Assayer | DAX Scale certified |
| Lake Shuttler | Direct Lake Shuttle certified |
| Transfer Papers | All 17 carryover machines placed or certified |
| Fast Track | First placement passed |
| Flawless Bolt | An inspection passed at 5/5 |
| Week at the Loom | A 7-day streak |
| Month at the Loom | A 30-day streak |
| Master of the Mill | The whole mill certified |

## Readiness (accuracy, never XP)
- **Per domain:** accuracy over your most recent **40** answers in that domain, multiplied by **coverage**. Coverage is the number of distinct bullets you've answered in the domain divided by the domain's bullet count, capped at 1.
  - All attempt types count.
  - Case-study questions will count toward their bullet's domain once the mock exam uses them.
  - A domain shows "—" until it has 10 answers.
- **Overall:** a weighted mean using each domain's official range midpoint, normalized: Prepare 47.5 → 46.3%, Semantic models 27.5 → 26.8%, Maintain 27.5 → 26.8%. It shows "—" until all three domains have a score.
- **Tests:** the weights, the accuracy × coverage math, the null threshold, and the weighted overall.
- **UI:** shown in the header with a plain-language tooltip.

## Save v2
- **New data:**
  - A compact answer log: `[questionId, 0|1, unixSeconds, 's'|'i'|'p']` per answer (start-up, inspection, placement), ready for Step 7.
  - Per-machine `notesOpenedAt`, `lastDraw`, `placementDays`, and `placementOpen`.
- **Migration:** `{ from: 1 }` adds an empty log. It's tested on a real v1 fixture (`src/save/fixtures/save-v1.json`), which keeps its machines and timestamps.
- **Settings:**
  - **Export:** downloads `fabric-mill-save-YYYY-MM-DD.json`.
  - **Import:** goes through the same parse → migrate → validate → prune path as loading. A bad file shows the reason and changes nothing; tested with invalid JSON, a non-object, and a failed validation.
  - **Reset:** asks for confirmation and copies the old save to the backup key first.

## Question renderer
- **One component per format:**
  - single choice (radio)
  - multi-select (checkboxes; Submit needs the stated count)
  - Yes/No set (Yes/No radios per statement)
  - matching (tap an item, then tap a choice; "Clear" per item)
  - ordering (↑/↓ buttons; screen-reader position announcements)
  - drop-down code completion (a native select per blank, inline in the code)
- **Input:** everything works by tap and keyboard, with no drag. RTL tests answer one question of each format with the keyboard only.
- **Code:** shown in a monospace box with T-SQL/KQL/DAX highlighting from a small in-house tokenizer (no new dependency; a test checks it never loses text). Long lines scroll sideways inside the box. The notes' worked examples now use the same highlighting.
- **Results** show, for each question:
  - correct or not
  - your answer next to the key
  - the explanation for every option, statement, pair, item, and slot
  - the Learn source links
  - a "Don't confuse: X vs Y →" link that opens the pair in the notes and focuses it (checked in Playwright at both widths: it focused `pair-storage-modes`)

## Playwright results
The run is a script against `vite preview` with `?seed=22`, a test hook that makes draws repeatable. It uses a touch-enabled context; matching and ordering use `tap()` only. The same results came back at **1440 px** and **390 px**.

| Flow | Result |
|---|---|
| Fresh save | Founding Charter idle; Water Wheel locked |
| Founding Charter start-up check (FO-01 single, FO-03 Yes/No) | 2/2, state **running** |
| Founding Charter inspection (FO-03, FO-15 multi, **FO-02 matching**, FO-14, FO-13) | 5/5, state **certified**; Water Wheel became **idle** (unlocked) |
| Loom Gearbox placement while **locked**, one answer wrong on purpose (includes **LG-05 matching**) | 4/5, not passed; same-day retry disabled: "One placement attempt per day. Try again tomorrow." |
| Warp Frame placement while **locked** (includes **WF-08 ordering**) | 5/5, **certified (placed)**; DAX Scale and Punch-Card Reader went from locked to **idle** |
| DAX Scale placement (includes **DS-02 DAX drop-down**) | 5/5, **certified (placed)** |
| Taps used | 16 for matching, 2 for ordering (the shuffle left WF-08 nearly in order) |
| Page width at the end | 1440 px desktop / **390 px phone**: no horizontal page scroll; code scrolls inside its box |
| Header afterwards | Apprentice · Level 3 · 385 XP · Streak 1 day · Today 10/10 ✓ · 3 badges · Readiness Models 23%, others "—" (under 10 answers) |
| Page errors | None |

Screenshots of every question, result screen, and the map were taken at both widths (kept outside the repo).

## Unsure, deviations, and things to know
- **"Open the notes"** is interpreted as opening the machine's panel, which is where the notes live. There's no separate "read" tracking or minimum reading time.
- **Placement attempts count when started.** I found the loophole (open, read, close, reopen for a new draw) after the first build and closed it in `ddebf5b`. An attempt started before midnight can still be submitted after midnight.
- **Badges:** the Front Office floor badge is "Mill Keys". I didn't add a second, duplicate "Front Office fully certified" badge, so there are four floor badges in all.
- **XP repeat rule (25%) and the readiness window (40 answers, minimum 10)** are my choices. Your prompt left the numbers open.
- **Overall readiness waits for all three domains** rather than showing a partial weighted number.
- **Start-up questions can reappear in that machine's inspection.** Pools are 7–21 questions, so excluding them would force more repeats elsewhere.
- **Commits:** save v2 and the game logic went into one commit, because the state code depends on the new schema. The plan listed them separately.
- **Orientation got 20 new questions.** You chose this during planning; they were reviewed the same way as Step 3.
- **The Playwright scripts live outside the repo,** as in earlier steps. The `?seed=` hook in `App.tsx` only makes randomness repeatable; it can't certify anything.

Step 5 isn't started.
