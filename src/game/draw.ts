import type { Question } from '../content/questions/types'
import type { Machine } from '../data/types'
import type { AttemptKind } from '../save/schema'
import { shuffled } from './shuffle'

export const INSPECTION_SIZE = 5
export const STARTUP_SIZE = 2
export const PLACEMENT_SIZE = 5

/** Questions a machine's checks may use: its own, never case-study questions (reserved for the mock exam). */
export function machinePool(machineId: string, questions: Question[]): Question[] {
  return questions.filter((q) => q.machineId === machineId && !q.caseStudyId)
}

export function placementPool(machineId: string, questions: Question[]): Question[] {
  return machinePool(machineId, questions).filter((q) => q.placement)
}

/** Fresh (not in the previous attempt) questions first, each group in random order. */
function freshFirst(pool: Question[], previous: Set<string>, rand: () => number): Question[] {
  const fresh = shuffled(
    pool.filter((q) => !previous.has(q.id)),
    rand,
  )
  const seen = shuffled(
    pool.filter((q) => previous.has(q.id)),
    rand,
  )
  return [...fresh, ...seen]
}

/**
 * Inspection draw rules:
 * 1. one question per bullet on the machine (fresh questions preferred),
 * 2. at least one question at difficulty 2 or higher,
 * 3. fill the rest, preferring questions not in the previous inspection,
 * 4. shuffle the final order.
 * Rules give way only when the pool is too small to satisfy them.
 */
export function drawInspection(machine: Machine, questions: Question[], previous: string[] = [], rand: () => number = Math.random): Question[] {
  const prev = new Set(previous)
  const ordered = freshFirst(machinePool(machine.id, questions), prev, rand)
  const picked: Question[] = []
  const take = (q: Question | undefined) => {
    if (q && !picked.includes(q) && picked.length < INSPECTION_SIZE) picked.push(q)
  }
  for (const b of machine.bulletIds) {
    if (picked.some((q) => q.bulletIds.includes(b))) continue
    take(ordered.find((q) => q.bulletIds.includes(b)))
  }
  if (!picked.some((q) => q.difficulty >= 2)) {
    const hard = ordered.find((q) => q.difficulty >= 2 && !picked.includes(q))
    if (hard) {
      if (picked.length >= INSPECTION_SIZE) picked.pop()
      take(hard)
    }
  }
  for (const q of ordered) take(q)
  return shuffled(picked, rand)
}

/** Start-up check: two questions, difficulty 1–2 preferred, avoiding the previous start-up draw. */
export function drawStartup(machine: Machine, questions: Question[], previous: string[] = [], rand: () => number = Math.random): Question[] {
  const prev = new Set(previous)
  const pool = machinePool(machine.id, questions)
  const easy = freshFirst(
    pool.filter((q) => q.difficulty <= 2),
    prev,
    rand,
  )
  const rest = freshFirst(
    pool.filter((q) => q.difficulty > 2),
    prev,
    rand,
  )
  // Prefer fresh easy, then fresh hard, then repeats.
  const ordered = [...easy.filter((q) => !prev.has(q.id)), ...rest.filter((q) => !prev.has(q.id)), ...easy, ...rest]
  return [...new Set(ordered)].slice(0, STARTUP_SIZE)
}

/** Placement: five placement-eligible questions, avoiding the previous placement draw. */
export function drawPlacement(machine: Machine, questions: Question[], previous: string[] = [], rand: () => number = Math.random): Question[] {
  return freshFirst(placementPool(machine.id, questions), new Set(previous), rand).slice(0, PLACEMENT_SIZE)
}

export function drawFor(kind: AttemptKind, machine: Machine, questions: Question[], previous: string[] = [], rand: () => number = Math.random): Question[] {
  if (kind === 'startup') return drawStartup(machine, questions, previous, rand)
  if (kind === 'placement') return drawPlacement(machine, questions, previous, rand)
  return drawInspection(machine, questions, previous, rand)
}
