import { hashString, mulberry32, shuffled } from '../../game/shuffle'
import type { DataTable, Puzzle, PuzzleInstance, PuzzleMeta } from '../types'
import { canonical, type Rand } from './engine'
import { trapById, type TrapId } from './traps'

export type OracleLanguage = 'tsql' | 'kql' | 'dax'

export interface Distractor {
  trap: TrapId
  /** What this specific wrong result did, in one sentence. */
  why: string
  table: DataTable
}

/** One generated case: data, query, the reference result, and three mistakes. */
export interface OracleCase {
  tables: DataTable[]
  query: string
  correct: DataTable
  /** Why the correct result is right, in one or two sentences. */
  explain: string
  distractors: Distractor[]
  /** Set when this data variant can't be used (for example, a tie that makes the order ambiguous). */
  reject?: string
}

export interface OracleTemplate {
  meta: Omit<PuzzleMeta, 'type'>
  language: OracleLanguage
  /** Scenario sentence shown above the tables. */
  intro: string
  /** Every trap its distractors use. */
  traps: TrapId[]
  /** Generates data from the seeded random source and computes every candidate. */
  generate(rand: Rand): OracleCase
}

export const MIN_ROWS = 5
export const MAX_ROWS = 10
const MAX_TRIES = 60

/** Checks a generated case: 3 distractors, 4 distinct results, 5–10 rows per input table. */
export function caseProblems(c: OracleCase): string[] {
  const problems: string[] = []
  if (c.reject) problems.push(c.reject)
  if (c.distractors.length !== 3) problems.push(`has ${c.distractors.length} distractors, needs 3`)
  const ids = [c.correct, ...c.distractors.map((d) => d.table)].map(canonical)
  if (new Set(ids).size !== ids.length) problems.push('two candidate results are identical')
  for (const t of c.tables) {
    if (t.rows.length < MIN_ROWS || t.rows.length > MAX_ROWS) problems.push(`table ${t.name} has ${t.rows.length} rows`)
  }
  if (c.tables.length < 1 || c.tables.length > 2) problems.push(`has ${c.tables.length} input tables`)
  return problems
}

/**
 * Generates a valid case for a seed. If a seed's data makes two candidates
 * collide, it tries the next data variant, so every seed yields a playable case.
 */
export function generateCase(template: OracleTemplate, seed: number): OracleCase {
  for (let attempt = 0; attempt < MAX_TRIES; attempt++) {
    const c = template.generate(mulberry32((seed + attempt * 7919) >>> 0))
    if (caseProblems(c).length === 0) return c
  }
  throw new Error(`${template.meta.id}: no valid data variant for seed ${seed}`)
}

const letters = ['A', 'B', 'C', 'D']

export function oracleInstance(template: OracleTemplate, seed: number): PuzzleInstance {
  const c = generateCase(template, seed)
  const candidates = [
    { table: c.correct, explain: `Correct. ${c.explain}`, correct: true },
    ...c.distractors.map((d) => ({
      table: d.table,
      explain: `${trapById.get(d.trap)?.label ?? d.trap}: ${d.why}`,
      correct: false,
    })),
  ]
  const order = shuffled(candidates, mulberry32((seed ^ hashString(template.meta.id)) >>> 0))
  const choices = order.map((x, i) => ({ id: `r${i + 1}`, label: `Result ${letters[i]}`, table: x.table, explain: x.explain }))
  const answer = choices[order.findIndex((x) => x.correct)]!.id
  const sources = [...new Set([...template.meta.sources, ...c.distractors.flatMap((d) => trapById.get(d.trap)?.sources ?? [])])]
  return {
    meta: { ...template.meta, type: 'oracle' },
    intro: template.intro,
    context: { kind: 'oracle', language: template.language, tables: c.tables, query: c.query },
    decisions: [
      {
        id: 'result',
        prompt: 'Which result does the query return?',
        ui: 'buttons',
        choices,
        accepted: [answer],
        explain: c.explain,
        sources,
      },
    ],
    seed,
  }
}

export function oraclePuzzle(template: OracleTemplate): Puzzle {
  return { meta: { ...template.meta, type: 'oracle' }, build: (seed) => oracleInstance(template, seed) }
}
