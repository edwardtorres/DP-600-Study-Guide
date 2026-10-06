import type { Question } from '../content/questions/types'
import type { Outline } from '../data/types'
import type { AnswerEntry, AttemptCode } from '../save/schema'

/** Answers that measure what you know (not start-up checks, not puzzle plays). */
export const WEAK_CODES: readonly AttemptCode[] = ['i', 'p', 'l', 'r', 'm']
/** Each bullet's score rests on its most recent answers. */
export const WEAK_WINDOW = 20
/** Fewer answers than this, and a bullet is listed as "not enough data" instead of ranked. */
export const WEAK_MIN_ANSWERS = 3

export interface BulletScore {
  bulletId: string
  /** Answers the score rests on (at most WEAK_WINDOW). */
  answers: number
  correct: number
  /** 0–1, or null with no answers. */
  accuracy: number | null
}

/** Accuracy per outline bullet over its most recent WEAK_WINDOW counted answers. */
export function bulletScores(answers: AnswerEntry[], questionsById: Map<string, Pick<Question, 'bulletIds'>>, outline: Outline): BulletScore[] {
  const recent = new Map<string, (0 | 1)[]>()
  for (let i = answers.length - 1; i >= 0; i--) {
    const [id, correct, , code] = answers[i]!
    if (!WEAK_CODES.includes(code)) continue
    for (const b of questionsById.get(id)?.bulletIds ?? []) {
      const list = recent.get(b) ?? []
      if (list.length < WEAK_WINDOW) list.push(correct)
      recent.set(b, list)
    }
  }
  return outline.domains.flatMap((d) =>
    d.sections.flatMap((s) =>
      s.bullets.map((b) => {
        const list = recent.get(b.id) ?? []
        const correct = list.filter((c) => c === 1).length
        return { bulletId: b.id, answers: list.length, correct, accuracy: list.length ? correct / list.length : null }
      }),
    ),
  )
}

export interface WeakSpots {
  /** Bullets with enough answers, weakest first (ties: more answers first, then outline order). */
  ranked: BulletScore[]
  /** Bullets with fewer than WEAK_MIN_ANSWERS answers, in outline order. */
  notEnoughData: BulletScore[]
}

export function weakSpots(scores: BulletScore[]): WeakSpots {
  const order = new Map(scores.map((s, i) => [s.bulletId, i]))
  const ranked = scores
    .filter((s) => s.answers >= WEAK_MIN_ANSWERS)
    .sort((a, b) => a.accuracy! - b.accuracy! || b.answers - a.answers || order.get(a.bulletId)! - order.get(b.bulletId)!)
  return { ranked, notEnoughData: scores.filter((s) => s.answers < WEAK_MIN_ANSWERS) }
}

export interface TrapMiss {
  pairId: string
  misses: number
  /** All counted answers on questions that test this pair. */
  of: number
}

/** "Don't confuse" pairs you miss most: wrong answers on questions that carry the pair. */
export function trapMisses(answers: AnswerEntry[], questionsById: Map<string, Pick<Question, 'trapPairId'>>): TrapMiss[] {
  const by = new Map<string, TrapMiss>()
  for (const [id, correct, , code] of answers) {
    if (!WEAK_CODES.includes(code)) continue
    const pair = questionsById.get(id)?.trapPairId
    if (!pair) continue
    const t = by.get(pair) ?? { pairId: pair, misses: 0, of: 0 }
    t.of++
    if (!correct) t.misses++
    by.set(pair, t)
  }
  return [...by.values()].filter((t) => t.misses > 0).sort((a, b) => b.misses - a.misses || b.misses / b.of - a.misses / a.of || a.pairId.localeCompare(b.pairId))
}
