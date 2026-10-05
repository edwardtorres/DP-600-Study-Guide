import type { Difficulty } from '../content/questions/types'

/**
 * Puzzles are practice: they earn XP and feed readiness and the answer log
 * (code 'z'), but they never certify a machine.
 */
export type PuzzleType = 'oracle' | 'pattern' | 'gearbox' | 'fallback' | 'access' | 'ripple' | 'conveyor'

export const puzzleTypeName: Record<PuzzleType, string> = {
  oracle: 'Query Oracle',
  pattern: 'Pattern Draft',
  gearbox: 'Gearbox Picker',
  fallback: 'Shuttle Fallback',
  access: 'Gatehouse Access Matrix',
  ripple: 'Ripple',
  conveyor: 'Conveyor',
}

export interface PuzzleMeta {
  /** Stable id, used in the answer log. Seeded variants of a template share it. */
  id: string
  type: PuzzleType
  title: string
  /** Machines whose Puzzle bench shows this puzzle. */
  machineIds: string[]
  /** Outline bullets practised. All in one exam domain. */
  bulletIds: string[]
  difficulty: Difficulty
  /** learn.microsoft.com pages that confirm the answer. */
  sources: string[]
  /** A "don't confuse" pair id from the notes, when the puzzle drills one. */
  trapPairId?: string
  preview?: true
}

export type Cell = string | number | null

/** A small table shown as input or as a candidate result. */
export interface DataTable {
  name: string
  columns: string[]
  rows: Cell[][]
}

export interface PuzzleChoice {
  id: string
  label: string
  /** For Query Oracle, the candidate result table. */
  table?: DataTable
  /** Why this choice is right or wrong. */
  explain: string
}

/**
 * One scored decision. A puzzle is a list of them. `accepted` holds every
 * answer Learn allows (usually one).
 * - buttons: one tap picks a choice (radio group)
 * - select: a native drop-down (many choices, for example assigning a column)
 * - toggle: tap to mark (yes) or unmark (no); starts as `initial`
 */
export interface Decision {
  id: string
  /** Heading the decision is listed under (for example "Grain" or a user's name). */
  group?: string
  prompt: string
  ui: 'buttons' | 'select' | 'toggle'
  choices: PuzzleChoice[]
  accepted: string[]
  /** For toggles: the starting value. */
  initial?: string
  /** Why the accepted answer is right. */
  explain: string
  sources: string[]
}

export type PuzzleContext =
  | { kind: 'oracle'; language: 'tsql' | 'kql' | 'dax'; tables: DataTable[]; query: string }
  | { kind: 'facts'; facts: { label: string; value: string }[]; tables?: DataTable[] }
  | {
      kind: 'graph'
      nodes: { id: string; label: string; itemType: string; workspace: string }[]
      /** [upstream, downstream]: the second item depends on the first. */
      edges: [string, string][]
      changed: string
    }

/** A puzzle ready to play. Seeded puzzles build a new instance per play. */
export interface PuzzleInstance {
  meta: PuzzleMeta
  intro: string
  context: PuzzleContext
  decisions: Decision[]
  /** Seed the instance was built with (Query Oracle variants). */
  seed?: number
}

export interface Puzzle {
  meta: PuzzleMeta
  /** Builds a playable instance. Seeded puzzles vary their data with the seed; others ignore it. */
  build(seed: number): PuzzleInstance
}
