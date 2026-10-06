# Fabric Mill — DP-600 study game

A study game for Microsoft exam **DP-600: Implementing Analytics Solutions Using Microsoft Fabric** (Microsoft Certified: Fabric Analytics Engineer Associate). The player runs a textile mill that weaves raw data threads into finished analytics fabric. It should feel like a game, not a notes site.

The learner has passed PL-300 study (Power BI basics, DAX fundamentals, star schemas). Microsoft Fabric is new to them.

## Working rules

- Build in **steps** (see Roadmap). Each step ends with an **audit** the user reviews. Do not start the next step until the user approves.
- Start each step in plan mode and show the plan before writing code.

## Stack

- Vite + React + TypeScript (`strict`, `noUncheckedIndexedAccess`) + Tailwind CSS v4 (`@tailwindcss/vite`).
- No backend. Progress lives in `localStorage` under a versioned save schema (see Save system).
- Vitest + Testing Library (jsdom). Lint: oxlint. Scripts run with `tsx`.

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Typecheck + production build |
| `npm test` | Vitest unit and component tests |
| `npm run typecheck` / `npm run lint` | tsc / oxlint |
| `npm run check:content` | Fails if the app's structure drifts from `scripts/official-outline.json` |
| `npm run check:content -- --live` | Also re-fetches the study guide and diffs every bullet |
| `npm run check:secrets` | Fails on local paths, private links, or token-like strings in the repo |
| `npm run check:links` | Fetches every URL cited in notes, verified edges, questions, puzzles, and labs; fails on non-200, or on a lab source whose #section is missing |
| `npm run check` | All of the above except build, `--live`, and `check:links` |
| `npm run e2e` | Playwright flows (machine, placement, puzzle, lab, review, mock) at 1440 px and 390 px, tap-only, against the dev server. Needs a browser, so it's not in `npm test`. Set `PW_CHROMIUM` to a Chromium binary if Playwright's own isn't installed |

`npm run build` also runs `scripts/check-bundle.ts`, which fails if a dev-only hook is in the production bundle: `?seed=` (`src/game/seed.ts`) or `?mock=short` (`src/game/mockShort.ts`), both reachable only behind `import.meta.env.DEV`.

## Git rules

- Commit as `12915571+edwardtorres@users.noreply.github.com` (name `edwardtorres`). The repo's local git config is set to this.
- **Never commit private links, tokens, or local file paths.** Run `npm run check:secrets` before every commit. This includes session links in commit trailers: do not add `Claude-Session:` or any other private URL to commit messages.

## Content rules

- **Only source: learn.microsoft.com.** If a fact can't be verified there, flag it in the audit instead of guessing.
- **Never use exam dumps** or questions copied from any real exam or the official practice assessment. Write original questions.
- The exam outline is recorded verbatim in `scripts/official-outline.json` from the study guide's **"Skills measured as of October 19, 2026"** section: 3 domains, 7 sections, 41 bullets (Maintain 11, Prepare 18, Semantic models 12). Don't edit it by hand. If Microsoft changes the page, re-sync it and update the mapping. `check:content` enforces the counts and the mapping.
- Study guide: https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-600 (page last updated 2026-09-18, retrieved 2026-10-04).
- Microsoft Learn course DP-600T00 learning paths, in order: (1) Explore analytics data stores in Microsoft Fabric, (2) Design and transform analytics data in Microsoft Fabric, (3) Design and manage semantic models in Microsoft Fabric, (4) Prepare AI-ready analytics data in Microsoft Fabric, (5) Secure and govern analytics data in Microsoft Fabric. Path 4 (Fabric IQ, ontologies, semantic models for AI) has **no matching outline bullet**, so it isn't mapped to a machine.

## The exam (as published by Microsoft, retrieved 2026-10-04)

Sources: the certification page (https://learn.microsoft.com/en-us/credentials/certifications/fabric-analytics-engineer-associate/), "Exam duration and exam experience" (https://learn.microsoft.com/en-us/credentials/support/exam-duration-exam-experience), and "Practice Assessments for Microsoft Certifications" (https://learn.microsoft.com/en-us/credentials/certifications/practice-assessments-for-microsoft-certifications).

- 100 minutes, proctored. Passing score is 700. "You may have interactive components to complete as part of this exam."
- Rechecked 2026-10-06 for the mock exam (Step 7):
  - **Time:** the certification page says "You will have 100 minutes to complete this assessment". The exam duration page lists 100 minutes (120 minutes seat time) for associate role-based exams without labs.
  - **Question count:** "Most Microsoft Certification exams typically contain between 40-60 questions"; no DP-600-specific count is published.
  - **Scoring:** "Exam scoring and score reports" (https://learn.microsoft.com/en-us/credentials/certifications/exam-scoring-reports) says scores are on a scale of 1 to 1,000 and 700 passes: "As this is a scaled score, it may not equal 70% of the points."
  - **Practice:** Microsoft's free DP-600 practice assessment is linked from the certification page (practice/assessment?assessmentId=90).
- The English version updates on October 19, 2026.
- Microsoft Learn is available inside the exam in a split screen (no extra time). Q&A, practice assessments, and your profile are blocked.
- Most questions cover GA features. Preview features may appear if commonly used.

**Question formats.** Microsoft says it does **not** identify the formats used on a specific exam. The exam sandbox demonstrates the types a role-based exam may use:

- Multiple choice (single and multiple answer)
- Drag and drop
- Build list (put steps in order)
- Hot area (select regions of an image or code)
- Active screen (choose settings in a mock UI, e.g. dropdowns)
- **Case studies**: a long scenario (business requirements, existing environment, technical requirements) followed by several questions. You can take a break during a case study, but you can't return to questions seen before the break.
- **Problem-solution sets**: one problem stated several times, each with a different proposed solution; answer Yes/No to "Does this solution meet the goal?". You can't go back once answered, and breaks aren't allowed during these sets.
- Labs (some role-based exams; Microsoft doesn't list which)
- Mark for review, review screen, navigation and timer

The free practice assessment shows "the style, wording, and difficulty"; the real exam "may have additional question types, multiple case studies, and labs". Later steps (3, 7) should mirror these formats with original content.

## The game: Fabric Mill

- **Floors** follow the flow of work (top to bottom on the map):
  - Front Office: Orientation (up to 4 machines of Fabric background the outline assumes)
  - Spinning Floor & Dye House: Prepare data (45–50%)
  - Loom Hall: Implement and manage semantic models (25–30%)
  - Gatehouse & Pattern Room: Maintain a data analytics solution (25–30%)
- **Machines** = skill-tree nodes. Each non-orientation machine owns 1–3 related outline bullets; every bullet belongs to exactly one machine. A machine always shows its themed name **and** its real skill name. Data: `src/data/machines.ts`.
- **States**: locked (a prerequisite isn't certified), idle, running (started), certified.
- **Prerequisite threads** (`src/data/edges.ts`): each edge has a one-line reason. Tests require the graph to be acyclic, fully reachable from the start node, and free of redundant edges (no edge already implied by others).
- **Tags**: `orientation`; `pl300` (overlaps PL-300). Each PL-300 tag quotes the PL-300 study-guide bullets it overlaps (skills measured as of April 20, 2026). A `caveat` marks a partial overlap and the chip reads "PL-300 · partial". PL-300 machines get a placement check (Step 4), and their notes open with "What DP-600 adds beyond PL-300".
- **Placement checks for partial-carryover machines must be written in DP-600's tools and terms** (T-SQL in a warehouse, notebooks/PySpark, Dataflow Gen2, pipelines, KQL), never in Power Query-only terms. Passing a Power Query question must not certify a Fabric skill. This applies to Thread Intake, Carding Machine, Twisting Frame, Dye Vat, and Weave Planner, and to any other machine whose PL-300 tag has a caveat.
- **Verified edges**: an edge whose reason was checked on Learn carries `verified: { source }`, shown as "verified on Microsoft Learn" in the detail panel.
- **The game never certifies anything without a passed test.** Certification is only written to the save by a passed inspection or placement check.
- **Lifecycle (Step 4, `src/game/state.ts`):** locked → idle when every prerequisite is certified; idle → running after the notes are opened and a 2-question start-up check is passed (both correct); running → certified by a 5-question inspection at 80% (4 of 5). The first failed inspection can be retried at once (new draw); after a second failure on the same machine in one local day, its inspections lock until the next day, with a message saying why. PL-300 carryover machines also offer a placement check, even while locked: 5 placement-eligible questions, all 5 correct, one attempt per machine per local day (the attempt is used when it starts, so the pool can't be previewed); passing certifies the machine as **placed**.
- **Draws (`src/game/draw.ts`):** a machine's own questions, never case-study questions (reserved for the mock exam). Inspections cover every bullet on the machine, include at least one difficulty-2+ question, and avoid the previous attempt's questions where the pool allows.
- **Scoring is full credit only (`src/game/score.ts`):** a question counts as correct only if every part is right: both picks of a multi-select, every Yes/No statement, every matching pair, every drop-down slot, the whole ordering. No partial credit anywhere.
- **Rewards never replace tests.** XP, levels, ranks, streaks, badges, and readiness (`src/game/progress.ts`) are all derived from the answer log and certifications; none of them can certify a machine. Readiness is based on recent accuracy and bullet coverage, weighted by the official domain percentages, never on XP. It counts only inspection, placement, puzzle, lab-debrief, daily-review, and mock answers (`READINESS_CODES = i, p, z, l, r, m`); start-up checks don't count. A domain's 40-answer window holds at most the 10 most recent puzzle plays (`readinessWindow`).

## Notes (Step 2)

- Notes are typed data in `src/content/notes/<floor>.ts` (types in `src/content/types.ts`). Every statement is a `Cited` item with at least one `learn.microsoft.com` URL.
- **Writing workflow:** fetch the Learn page, extract the exact sentences you rely on (kept outside the repo), then write the note in your own words and cite the page. Never fill gaps from memory. If Learn doesn't confirm a fact, put it in that machine's `needsVerification` list (the Step 8 queue) and don't state it as fact. If a needed Learn page is unreachable, stop and tell the user.
- Each machine has: overview; per-bullet tools, key concepts, and how-to; worked examples (marked illustrative, one explanation per step) where the skill involves code; exam traps; "don't confuse" pairs; renamed features (old → new, which name the exam likely uses, based on the current study guide's wording); Preview labels; dated upcoming changes; glossary terms (each term defined once across the app).
- `check:content` enforces all of this (`src/content/validate.ts`, `src/content/requirements.ts`). `npm run check:links` fetches every cited URL (network needed).

## Question bank (Step 3)

- Questions are typed data in `src/content/questions/<floor>.ts` (Step 7's difficulty-3 additions are in each floor's `hard.ts`) plus `cases.ts` and `cases2.ts` (6 case studies) (types in `types.ts`, rules in `requirements.ts`, checks in `validate.ts`). Formats: `single`, `multi` ("choose two/three"), `yesno` statement sets, `order`, `match`, `dropdown` (T-SQL/KQL/DAX code completion).
- Every question has: id, machineId, bulletIds, format, difficulty 1–3, a scenario-style stem, a key, an explanation for **every** option/statement/item/pair/slot option, at least one learn.microsoft.com source that confirms the key, optional `trapPairId` (a notes "don't confuse" pair), `preview`, `placement`, `caseStudyId`.
- Rules enforced by `check:content`: ≥6 questions per bullet; domain shares inside the official ranges; ≤35% of 4-option answers in any one position; correct option strictly longest ≤40%; no near-duplicate stems (Jaccard ≥ 0.8); Preview ≤5%; every PL-300 carryover machine has ≥8 placement-eligible questions; placement questions on partial-carryover machines are never keyed to Power Query; no "all/none of the above"; no phrases tied to open needs-verification items (`BANNED_TERMS`).
- Answer order is controlled twice. In the bank, `arrange()` rotates single-choice answers, multi-select sources are balanced (no position correct in more than 60% of questions with that option count), and Yes/No statements are 40–60% "Yes"; `check:content` enforces and prints all three. At render time, `src/game/shuffle.ts` shuffles every format with a seeded PRNG: stable within one attempt, new per attempt, and ordering items start with at least half of them (rounded up) out of place.
- **Never write a question whose answer depends on a needs-verification item** or anything not confirmed on Learn.
- Each floor's questions are checked by an **independent reviewer agent** that answers blind (`npm run export:questions -- <floor|cases|all> <dir> [idPattern]` writes blind and keyed JSON outside the repo; `scripts/compare-review.ts` diffs answers), then checks each key against its sources. Disagreements are fixed or dropped and logged in `docs/reviews/step-3-question-review.md` (Step 7: `step-7-question-review.md`).
- Hidden review page: `/review` (or `#/review`). Not linked from the game. **Step 9 must add an SPA fallback** so `/review` serves `index.html` in production.

## Puzzles (Step 5)

- Puzzles are practice. A play logs one `[puzzleId, 0|1, t, 'z']` entry (correct = at least 80% of its decisions right; single-decision puzzles must be right). They earn XP (10/20/30 by difficulty, 25% on repeats) and feed readiness, and **never certify** a machine (`src/game/puzzles.ts` only appends to the log). Each puzzle sits on one or more machines' **Puzzle bench**, which opens once the machine is unlocked. Each puzzle's bullets must sit in one domain. Puzzle ids must not collide with question ids (they share the log).
- Every puzzle is a list of scored **decisions** (`src/puzzles/types.ts`): `buttons` (radio group), `select` (native drop-down), or `toggle`. All work by tap and keyboard at 390 px. Choices with more than 2 options are shuffled per play (`src/puzzles/play.ts`).
- **Query Oracle** (`src/puzzles/oracle/`): seeded templates (T-SQL, KQL, DAX; at least 12 each). Each template generates 5–10-row tables, then computes the correct result and three distractors with the reference engine (`engine.ts`). Each distractor applies one named trap from `traps.ts` (each trap cites Learn). **Answers are never hand-written.** A variant that makes two candidates identical or ambiguous is rejected and the next variant is used.
- **Evaluators** (`src/puzzles/evaluators/`): Shuttle Fallback (Direct Lake), Access Matrix (roles, item permissions, RLS/CLS/OLS/DDM), Ripple (impact analysis), Conveyor (pipeline permissions, autobinding). Each rule cites its Learn page. A case Learn doesn't settle returns null or throws, so `check:content` rejects a scenario that uses it. Scenarios for these types (`src/content/puzzles/`) store inputs only.
- Pattern Draft and Gearbox keys are authored from Learn guidance, with every Learn-allowed answer accepted.
- `check:content` validates puzzle schema, links, domains, sources, banned terms, trap pairs, template generation (50 seeds each), and minimum counts (`src/content/puzzles/requirements.ts`). `check:links` includes puzzle and trap sources.
- Review: `npm run export:puzzles -- <dir>` writes a blind sample (at least 30% of each type, plus every Fallback, Access, and Conveyor scenario) and its key; `scripts/compare-puzzle-review.ts` diffs a reviewer's answers. Log: `docs/reviews/step-5-puzzle-review.md`.

## Spaced review, Weak Spots, and the mock exam (Step 7)

- **Daily review (`src/game/review.ts`):** derived from the answer log; no stored schedule.
  - Every answered bank question has a streak of correct answers in a row; a miss resets it to 0.
  - It is due on the day of its last answer plus `INTERVALS[streak]` = 1, 2, 4, 7, 14, then 30 days. A miss comes back the next day.
  - The session lists due questions (most overdue first, then shortest streak), capped at `DAILY_CAP = 20` review answers per local day. If fewer are due, it tops up from the weakest bullets (round-robin, unseen questions first), with the top-up order seeded by the day.
  - Case-study questions are excluded. Answers log as `'r'`, count in readiness, earn normal XP (with the repeat rule), and never certify.
- **Maintenance:** a certified machine needs maintenance when its last `MAINT_WINDOW = 8` review or mock answers (at least `MAINT_MIN = 5`) score below `MAINT_THRESHOLD = 60%`.
  - The map shows a mark, and the machine panel and the Daily review page offer a 5-question maintenance set (recent misses first).
  - It never removes a certification.
- **Weak Spots (`src/game/weak.ts`):** bullets ranked by accuracy over their last `WEAK_WINDOW = 20` answers (codes i, p, l, r, m), with the answer count each rests on. Bullets with fewer than 3 answers are listed as "not enough data".
  - It also lists the "don't confuse" pairs missed most (wrong answers on questions with that `trapPairId`).
  - Each weak bullet links to its machine's notes, a puzzle (if the machine is unlocked), and a lab.
- **Mock exam (`src/game/mock.ts`):** `MOCK_MINUTES = 100` and `MOCK_SIZE = 50`, from Microsoft's stated time and its general 40–60 range.
  - **Section 1:** one case study not used in any previous mock (the least recently used one once all six have been seen).
  - **Section 2:** the rest, allocated so the whole mock follows the official domain midpoints (counting the case questions), spread round-robin over bullets. It avoids the last mock's questions and prefers questions not answered in the last 14 days, then the least recently answered. Orientation-only questions are never drawn.
  - **Timer and saving:** the timer runs from `activeMock.startedAt` in the save, so it survives reloads; at zero the mock submits itself. Responses, marks, and the seed are saved as you go.
  - **Case lock:** leaving the case study (after a warning) sets `caseLocked`, and its questions can't be opened again.
  - **During the exam:** no feedback until the end. Mark for review and a review screen come before submitting.
  - **Scoring:** full credit only, and unanswered questions count as wrong. Results show raw percentages overall, by domain, and by bullet, every question with its explanation and sources, the trap pairs fallen for, the history, and the scaled-score note.
  - **Logging:** answers log as `'m'`, count in readiness, earn XP, and never certify.
  - **Dev-only short mode:** `?mock=short` gives 6 main questions plus the case study and 10 minutes, for e2e.
- **Ready to book:** shown only when the two most recent full (not short) mocks each score at least 80% overall with every domain at least 70% (`readyToBook`). It links to Microsoft's free practice assessment as an outside check. This is a raw-percentage signal; Microsoft's 700 is a scaled score.
- UI: header buttons Daily review (with the due count), Weak Spots, and Mock exam (`src/components/review/`, `weak/`, `mock/`).

## Labs (Step 6)

- Lab content is typed data in `src/content/labs/` (`prepare.ts`, `semantic.ts`, `maintain.ts`; types in `types.ts`; source helpers in `sources.ts`; `LABS_UNCOVERED` and `LABS_PARTIAL` in `index.ts`). 15 labs, about 19 hours, run in a Fabric trial in two workspaces (DP600-Dev and DP600-Test, made in Lab 1, removed in Lab 15's cleanup).
- **Sources:** every step cites at least one source, linked to its section (`#anchor`), not a long click path. Lab steps may cite learn.microsoft.com or Microsoft's official lab exercises (microsoftlearning.github.io/mslearn-fabric). The exercises are for **lab steps only**, never for exam facts, notes, or questions.
- Each lab has a goal, machines, bullets, platform (`browser`, `windows`, `mixed`), minutes, prerequisite labs, numbered steps with data-free checkpoints, "trap you'll see" callouts (a notes don't-confuse `trapPairId`), and cleanup. Optional steps (`optional`) don't block completion. A step needing Power BI Desktop or SSMS is marked `windows`. A cost warning (`cost`) is allowed only on optional steps; no lab needs a paid Azure resource.
- **Trial limits:** no lab may depend on Copilot, data agents, AI functions or services, or Trusted Workspace Access. `check:content` rejects lab text that mentions them (`TRIAL_UNAVAILABLE`).
- **Privacy:** never write tenant names, workspace URLs, connection strings, tokens, or emails into the repo. `check:content` rejects lab text that matches `PRIVATE_PATTERNS`. Problem notes the player types stay in localStorage and the save export only.
- `check:content` (`src/content/labs/validate.ts`) checks schema, ids, machines and bullets, prerequisites (earlier in order, acyclic), allowed source sites, cleanup present, trap pairs, platform consistency (each machine's `labPlatform` must equal its labs' platform), banned and trial-unavailable terms, private patterns, numbers in checkpoints (only trial facts 4, 60, 64), a debrief pool of ≥3 non-case questions, and that every bullet is covered or listed in `LABS_UNCOVERED` with a reason.
- **Game (`src/game/labs.ts`):** completion is self-reported. It needs every required step and cleanup step ticked, earns a fixed `LAB_XP` (75), and **never certifies** a machine. The debrief draws 3 non-case bank questions on the lab's bullets (`drawDebrief`), opens once the lab is complete, and logs `[id, 0|1, t, 'l']`; `'l'` counts in readiness like an inspection. The trial clock uses the player's `trialStart` (local days, 60-day trial), and `suggestSchedule` spreads the remaining labs in order up to 5 days before the end. **Export lab notes** downloads `fabric-mill-lab-notes-YYYY-MM-DD.txt`.
- UI: a **Workshop** tab in each machine's panel lists its labs; the header **Labs** button opens the Labs page (trial facts, trial clock and schedule, all labs, export), and the lab view (`src/components/labs/`).
- Labs are untested until the player runs them. Problems they report come back as exported notes; fix the lab and log it. Review log: `docs/reviews/step-6-lab-review.md`.

## Platform note

The user works on both Windows and Mac. Fabric runs in the browser, but Power BI Desktop and `.pbip` work are Windows-only. Every hands-on lab must show its platform. `labPlatform` on each machine is `browser`, `windows`, or `mixed`, and must match the platform of the labs that list it (Step 6; enforced by `check:content`). Lab-logistics facts (for example, which desktop tools run on Windows) may be resolved outside Learn; they're recorded in `Machine.labNote`, marked as such, and never used in questions.

## Save system

- `src/save/schema.ts` (types + validator), `migrations.ts`, `storage.ts`. Current `SAVE_VERSION = 5`, key `fabric-mill:save`. v2 added a compact answer log (`answers: [id, 0|1, unixSeconds, code][]`, kept for Step 7 spaced repetition) and per-machine `notesOpenedAt`, `lastDraw`, and `placementDays`. v3 adds code `'z'` (one entry per puzzle play) next to `'s'|'i'|'p'` (start-up/inspection/placement), and per-machine `inspectionFails` (local days of failed inspections). v4 adds code `'l'` (lab debrief answers), `labs` (per-lab step checks, problem notes up to 2,000 characters, completion time) and an optional `trialStart` day. v5 adds codes `'r'` (daily review) and `'m'` (mock exam), `mocks` (finished mocks: ids in exam order, per-question correct, responses, timing) and an optional `activeMock` (start time, sections, responses, marks, seed, `caseLocked`). Migrations `{ from: 1 }` (adds an empty log), `{ from: 2 }` (no data change), `{ from: 3 }` (adds `labs: {}`), and `{ from: 4 }` (adds `mocks: []`) are tested on real saves: `src/save/fixtures/save-v1.json`, `save-v2.json` (captured from the Step 4 app), `save-v3.json` (Step 5 app), and `save-v4.json` (Step 6 app).
- Settings can export the save as JSON, import a save (same parse → migrate → validate path as loading; a bad file changes nothing), and reset progress (the old save is copied to the backup key first).
- On load: parse → run migrations up to the current version → validate → drop unknown machine ids. If any step fails, the raw save is copied to `fabric-mill:save:corrupt-backup` and a fresh save starts. The UI shows a notice.
- **To change the save shape:** bump `SAVE_VERSION`, add the new type and validator, append a migration `{ from: n }`, and add a test that loads a real version-n save.

## Code map

```
scripts/official-outline.json   verbatim outline
scripts/check-content.ts        content check (+ --live)
scripts/check-secrets.ts        secrets/paths check
src/content/                    notes data, notes types, notes validator, requirements
src/content/questions/          question bank, case studies, question validator
src/review/                     hidden /review page
src/data/                       outline loader, machines, edges, floors, graph utils, shared validators
src/game/                       state derivation, map layout, draws, scoring, progress, labs, review, weak spots, mock
src/save/                       versioned save
src/content/puzzles/            puzzle scenarios, puzzle registry, puzzle validator
src/puzzles/                    puzzle types, builders, play/scoring, Query Oracle engine + templates, evaluators
src/components/                 MillMap, MachineNode, Threads, MachineDetail, NotesView, Glossary, Header, Legend
src/components/puzzles/         Puzzle bench, PuzzlePanel, decision inputs
src/content/labs/               lab content, sources, lab validator, coverage
src/components/labs/            Workshop tab, Labs page, lab view
src/components/review/          Daily review page
src/components/weak/            Weak Spots page
src/components/mock/            Mock exam, results, history
e2e/                            Playwright flows (npm run e2e)
```

## Roadmap

1. ✅ Outline + content check, skill tree data + tests, mill map UI, save v1, this file.
2. ✅ Learn-sourced notes for every machine: worked SQL/KQL/DAX examples, glossary, "don't confuse" pairs (e.g. Direct Lake on OneLake vs on SQL analytics endpoint; import vs DirectQuery vs Direct Lake).
3. ✅ Question bank covering every bullet, weighted to the domain percentages, using the formats above.
4. ✅ Core game loop: XP, levels, streaks, badges, 5-question machine inspections (80% to certify), PL-300 placement checks.
5. ✅ Puzzles: Query Oracle (T-SQL/KQL/DAX predict-the-result), Pattern Draft, Gearbox Picker, Shuttle Fallback, Gatehouse Access Matrix, Ripple & Conveyor.
6. ✅ Hands-on Fabric trial labs (label Windows-only ones).
7. ✅ Spaced repetition and a timed mock exam with a case study. Also raise the difficulty-3 share of the question bank to about 25% (17% after Step 3) with new scenario questions, concentrated in Prepare data and Semantic models.
8. Fact-check all content against Microsoft Learn.
9. Deploy to dp600.edwardtorres.dev.
