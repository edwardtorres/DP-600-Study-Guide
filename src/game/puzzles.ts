import type { Save } from '../save/schema'

/**
 * Records one puzzle play in the answer log (code 'z'). Puzzles are practice:
 * this only appends to the log, so it can earn XP and feed readiness, but it
 * never touches machine progress and can't certify anything.
 */
export function recordPuzzle(save: Save, puzzleId: string, correct: boolean, now: Date = new Date()): Save {
  return {
    ...save,
    updatedAt: now.toISOString(),
    answers: [...save.answers, [puzzleId, correct ? 1 : 0, Math.floor(now.getTime() / 1000), 'z']],
  }
}
