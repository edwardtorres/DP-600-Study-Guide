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
| `npm run check:links` | Fetches every Learn URL cited in notes and verified edges; fails on non-200 |
| `npm run check` | All of the above except build, `--live`, and `check:links` |

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

## Notes (Step 2)

- Notes are typed data in `src/content/notes/<floor>.ts` (types in `src/content/types.ts`). Every statement is a `Cited` item with at least one `learn.microsoft.com` URL.
- **Writing workflow:** fetch the Learn page, extract the exact sentences you rely on (kept outside the repo), then write the note in your own words and cite the page. Never fill gaps from memory. If Learn doesn't confirm a fact, put it in that machine's `needsVerification` list (the Step 8 queue) and don't state it as fact. If a needed Learn page is unreachable, stop and tell the user.
- Each machine has: overview; per-bullet tools, key concepts, and how-to; worked examples (marked illustrative, one explanation per step) where the skill involves code; exam traps; "don't confuse" pairs; renamed features (old → new, which name the exam likely uses, based on the current study guide's wording); Preview labels; dated upcoming changes; glossary terms (each term defined once across the app).
- `check:content` enforces all of this (`src/content/validate.ts`, `src/content/requirements.ts`). `npm run check:links` fetches every cited URL (network needed).

## Question bank (Step 3)

- Questions are typed data in `src/content/questions/<floor>.ts` plus `cases.ts` (types in `types.ts`, rules in `requirements.ts`, checks in `validate.ts`). Formats: `single`, `multi` ("choose two/three"), `yesno` statement sets, `order`, `match`, `dropdown` (T-SQL/KQL/DAX code completion).
- Every question has: id, machineId, bulletIds, format, difficulty 1–3, a scenario-style stem, a key, an explanation for **every** option/statement/item/pair/slot option, at least one learn.microsoft.com source that confirms the key, optional `trapPairId` (a notes "don't confuse" pair), `preview`, `placement`, `caseStudyId`.
- Rules enforced by `check:content`: ≥6 questions per bullet; domain shares inside the official ranges; ≤35% of 4-option answers in any one position; correct option strictly longest ≤40%; no near-duplicate stems (Jaccard ≥ 0.8); Preview ≤5%; every PL-300 carryover machine has ≥8 placement-eligible questions; placement questions on partial-carryover machines are never keyed to Power Query; no "all/none of the above"; no phrases tied to open needs-verification items (`BANNED_TERMS`).
- **Never write a question whose answer depends on a needs-verification item** or anything not confirmed on Learn.
- Each floor's questions are checked by an **independent reviewer agent** that answers blind (`npm run export:questions -- <floor> <dir>` writes blind and keyed JSON outside the repo; `scripts/compare-review.ts` diffs answers), then checks each key against its sources. Disagreements are fixed or dropped and logged in `docs/reviews/step-3-question-review.md`.
- Hidden review page: `/review` (or `#/review`). Not linked from the game. **Step 9 must add an SPA fallback** so `/review` serves `index.html` in production.

## Platform note

The user works on both Windows and Mac. Fabric runs in the browser, but Power BI Desktop and `.pbip` work are Windows-only. Every hands-on lab must show its platform. `labPlatform` on each machine is `browser`, `windows`, or `tbd`. It's preliminary until Step 6 verifies each lab on Learn. Lab-logistics facts (for example, which desktop tools run on Windows) may be resolved outside Learn; they're recorded in `Machine.labNote`, marked as such, and never used in questions.

## Save system

- `src/save/schema.ts` (types + validator), `migrations.ts`, `storage.ts`. Current `SAVE_VERSION = 1`, key `fabric-mill:save`.
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
src/game/                       state derivation, map layout
src/save/                       versioned save
src/components/                 MillMap, MachineNode, Threads, MachineDetail, NotesView, Glossary, Header, Legend
```

## Roadmap

1. ✅ Outline + content check, skill tree data + tests, mill map UI, save v1, this file.
2. Learn-sourced notes for every machine: worked SQL/KQL/DAX examples, glossary, "don't confuse" pairs (e.g. Direct Lake on OneLake vs on SQL analytics endpoint; import vs DirectQuery vs Direct Lake).
3. Question bank covering every bullet, weighted to the domain percentages, using the formats above.
4. Core game loop: XP, levels, streaks, badges, 5-question machine inspections (80% to certify), PL-300 placement checks.
5. Puzzles: SQL/KQL/DAX predict-the-result, star schema builder, storage-mode picker, Direct Lake fallback scenarios.
6. Hands-on Fabric trial labs (label Windows-only ones).
7. Spaced repetition and a timed mock exam with a case study.
8. Fact-check all content against Microsoft Learn.
9. Deploy to dp600.edwardtorres.dev.
