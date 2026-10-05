import type { Question } from '../content/questions/types'

/** Small, fast, seedable PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a string hash, used to give each question its own stream within an attempt. */
export function hashString(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** A fresh random seed for a new attempt. */
export function newAttemptSeed(): number {
  return Math.floor(Math.random() * 0xffffffff) >>> 0
}

export function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j]!, out[i]!]
  }
  return out
}

const sameOrder = (ids: string[], answer: string[]) => ids.length === answer.length && ids.every((id, i) => id === answer[i])

/**
 * Returns the question as it should be displayed in one attempt. The same
 * (attemptSeed, question) pair always gives the same order; a new attempt seed
 * gives a new order. Ids and keys are untouched, so explanations stay with
 * their options and scoring is unaffected. Ordering items never start solved.
 */
export function shuffleForAttempt(q: Question, attemptSeed: number): Question {
  const rand = mulberry32((attemptSeed ^ hashString(q.id)) >>> 0)
  switch (q.format) {
    case 'single':
    case 'multi':
      return { ...q, options: shuffled(q.options, rand) }
    case 'yesno':
      return { ...q, statements: shuffled(q.statements, rand) }
    case 'match':
      return { ...q, choices: shuffled(q.choices, rand) }
    case 'dropdown':
      return { ...q, slots: q.slots.map((s) => ({ ...s, options: shuffled(s.options, rand) })) }
    case 'order': {
      let items = shuffled(q.items, rand)
      // With 2+ items a non-solved order exists; reshuffle until we find one.
      for (let tries = 0; items.length > 1 && sameOrder(items.map((i) => i.id), q.answerOrder) && tries < 50; tries++) {
        items = shuffled(q.items, rand)
      }
      if (items.length > 1 && sameOrder(items.map((i) => i.id), q.answerOrder)) items = [...items.slice(1), items[0]!]
      return { ...q, items }
    }
  }
}
