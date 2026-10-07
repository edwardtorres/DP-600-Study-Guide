/**
 * A migration upgrades a save from `from` to `from + 1`.
 * To change the save shape: bump SAVE_VERSION, add the new type and validator
 * in schema.ts, append a migration here, and add a test with a real old save.
 */
import { mockFreshness } from '../game/mock'
import type { AnswerEntry } from './schema'

/**
 * Case-study question ids (CS1-01 … CS6-08). A pattern instead of importing the
 * case studies keeps the question bank out of the first-load chunk; a test checks
 * that it matches every case question and no other question.
 */
export const CASE_QUESTION_ID = /^CS\d+-\d+$/

export interface Migration {
  from: number
  migrate: (old: Record<string, unknown>) => Record<string, unknown>
}

export const migrations: Migration[] = [
  {
    // v1 → v2 (Step 4): add the answer log. Machine progress keeps its shape;
    // the new per-machine fields (notesOpenedAt, lastDraw, placementDays) are optional.
    from: 1,
    migrate: (old) => ({ ...old, answers: [] }),
  },
  {
    // v2 → v3 (Step 5): the answer log may now hold puzzle plays (code 'z'), and
    // machines may record failed-inspection days. Both are additive, so the data is unchanged.
    from: 2,
    migrate: (old) => ({ ...old }),
  },
  {
    // v3 → v4 (Step 6): hands-on lab progress, an optional trial start date, and
    // answer code 'l' (lab debriefs). Existing data is unchanged.
    from: 3,
    migrate: (old) => ({ ...old, labs: {} }),
  },
  {
    // v4 → v5 (Step 7): mock exam history and an optional mock in progress, plus
    // answer codes 'r' (daily review) and 'm' (mock exam). Existing data is unchanged.
    from: 4,
    migrate: (old) => ({ ...old, mocks: [] }),
  },
  {
    // v5 → v6 (Step 8): each mock stores its freshness (share of main-section
    // questions not answered in the 14 days before it started), computed here
    // from the answer log. Mocks list case questions first; those are excluded.
    from: 5,
    migrate: (old) => {
      const answers = (Array.isArray(old.answers) ? old.answers : []) as AnswerEntry[]
      const mocks = (Array.isArray(old.mocks) ? old.mocks : []) as { questionIds?: unknown; startedAt?: unknown }[]
      const withFreshness = (ids: unknown, startedAt: unknown) =>
        Array.isArray(ids) && typeof startedAt === 'string' ? mockFreshness(ids.filter((id: unknown): id is string => typeof id === 'string' && !CASE_QUESTION_ID.test(id)), answers, startedAt) : 0
      const active = old.activeMock as { mainIds?: unknown; startedAt?: unknown } | undefined
      return {
        ...old,
        mocks: mocks.map((m) => ({ ...m, freshness: withFreshness(m.questionIds, m.startedAt) })),
        ...(active ? { activeMock: { ...active, freshness: withFreshness(active.mainIds, active.startedAt) } } : {}),
      }
    },
  },
]

export function runMigrations(
  data: Record<string, unknown>,
  target: number,
  list: Migration[] = migrations,
): Record<string, unknown> {
  let current = data
  let version = typeof current.version === 'number' ? current.version : NaN
  if (!Number.isInteger(version)) throw new Error('Save has no version')
  if (version > target) throw new Error(`Save version ${version} is newer than this app (${target})`)
  while (version < target) {
    const step = list.find((m) => m.from === version)
    if (!step) throw new Error(`No migration from save version ${version}`)
    current = { ...step.migrate(current), version: version + 1 }
    version += 1
  }
  return current
}
