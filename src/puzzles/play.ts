import { hashString, mulberry32, shuffled } from '../game/shuffle'
import type { PuzzleInstance } from './types'
import { PUZZLE_PASS } from '../content/puzzles/requirements'

/** A player's answers, by decision id. */
export type PuzzleResponse = Record<string, string | undefined>

/**
 * Shuffles the choices of every multi-choice decision for one play, seeded so
 * the order is stable within a play and new for each play. Yes/No pairs and
 * drop-downs keep their order. Ids and keys are untouched.
 */
export function shuffleForPlay(i: PuzzleInstance, playSeed: number): PuzzleInstance {
  return {
    ...i,
    decisions: i.decisions.map((d) =>
      d.ui === 'buttons' && d.choices.length > 2 ? { ...d, choices: shuffled(d.choices, mulberry32((playSeed ^ hashString(`${i.meta.id}/${d.id}`)) >>> 0)) } : d,
    ),
  }
}

/** Starting answers: toggles start at their initial value; everything else is unanswered. */
export function initialResponse(i: PuzzleInstance): PuzzleResponse {
  return Object.fromEntries(i.decisions.filter((d) => d.ui === 'toggle').map((d) => [d.id, d.initial]))
}

export function isPuzzleComplete(i: PuzzleInstance, r: PuzzleResponse): boolean {
  return i.decisions.every((d) => r[d.id] !== undefined)
}

export interface PuzzleScore {
  /** Right or wrong per decision, in decision order. */
  results: boolean[]
  right: number
  total: number
  /** Counts as a correct play: 80% of decisions, or the single decision right. */
  correct: boolean
}

export function scorePuzzle(i: PuzzleInstance, r: PuzzleResponse): PuzzleScore {
  const results = i.decisions.map((d) => r[d.id] !== undefined && d.accepted.includes(r[d.id]!))
  const right = results.filter(Boolean).length
  const total = results.length
  return { results, right, total, correct: total === 1 ? right === 1 : right / total >= PUZZLE_PASS }
}
