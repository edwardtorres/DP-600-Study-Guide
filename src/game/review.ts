import type { Question } from '../content/questions/types'
import type { Outline } from '../data/types'
import type { AnswerEntry, AttemptCode, Save } from '../save/schema'
import { shuffled } from './shuffle'
import { addDays, dayKey, localTimeZone } from './time'
import { bulletScores, weakSpots } from './weak'

/**
 * Daily review: a simple interval (Leitner-style) schedule derived from the
 * answer log. Every bank question you've answered has a streak of correct
 * answers in a row. A miss resets the streak to 0, so the question comes back
 * the next day; each correct answer in a row pushes it further out.
 *
 *   streak:   0    1    2    3    4    5+
 *   due in:   1d   2d   4d   7d   14d  30d   (after the day of the last answer)
 *
 * Review answers are logged with code 'r'. They count in readiness and earn
 * normal XP (with the repeat rule), and never certify a machine.
 */
export const INTERVALS = [1, 2, 4, 7, 14, 30] as const
/** At most this many review answers per local day. */
export const DAILY_CAP = 20
/** Codes for answers to bank questions (puzzle plays, 'z', aren't bank questions). */
export const QUESTION_CODES: readonly AttemptCode[] = ['s', 'i', 'p', 'l', 'r', 'm']

/** Certified machine needs maintenance when its last MAINT_WINDOW review/mock answers (at least MAINT_MIN) score below MAINT_THRESHOLD. */
export const MAINT_WINDOW = 8
export const MAINT_MIN = 5
export const MAINT_THRESHOLD = 0.6
export const MAINT_SET_SIZE = 5

export interface Card {
  id: string
  /** Correct answers in a row (0 after a miss). */
  streak: number
  lastDay: string
  dueDay: string
  answers: number
}

export function intervalFor(streak: number): number {
  return INTERVALS[Math.min(streak, INTERVALS.length - 1)]!
}

/** Builds each answered question's schedule from the log. */
export function cards(answers: AnswerEntry[], timeZone: string = localTimeZone()): Map<string, Card> {
  const out = new Map<string, Card>()
  const sorted = [...answers].sort((a, b) => a[2] - b[2])
  for (const [id, correct, at, code] of sorted) {
    if (!QUESTION_CODES.includes(code)) continue
    const prev = out.get(id)
    const streak = correct ? (prev?.streak ?? 0) + 1 : 0
    const lastDay = dayKey(new Date(at * 1000), timeZone)
    out.set(id, { id, streak, lastDay, dueDay: addDays(lastDay, intervalFor(streak)), answers: (prev?.answers ?? 0) + 1 })
  }
  return out
}

export interface DailyQueue {
  /** Due questions in this session, most overdue first. */
  due: Question[]
  /** Extra questions from the weakest bullets when fewer are due than the cap allows. */
  topUp: Question[]
  /** All due questions today (may exceed what fits under the cap). */
  dueCount: number
  answeredToday: number
  /** Review answers still allowed today. */
  remaining: number
}

/**
 * Today's review session: due questions first (most overdue, then shortest
 * streak), capped at DAILY_CAP review answers per day. If fewer are due, top up
 * from the weakest bullets, unseen questions first. Case-study questions are
 * left out (they're for mock exams).
 */
export function dailyQueue(
  answers: AnswerEntry[],
  questions: Question[],
  outline: Outline,
  now: Date = new Date(),
  options: { cap?: number; timeZone?: string; rand?: () => number } = {},
): DailyQueue {
  const tz = options.timeZone ?? localTimeZone()
  const cap = options.cap ?? DAILY_CAP
  const today = dayKey(now, tz)
  const pool = questions.filter((q) => !q.caseStudyId)
  const byId = new Map(pool.map((q) => [q.id, q]))
  const answeredToday = answers.filter(([, , at, code]) => code === 'r' && dayKey(new Date(at * 1000), tz) === today).length
  const remaining = Math.max(0, cap - answeredToday)
  const schedule = cards(answers, tz)
  const dueCards = [...schedule.values()]
    .filter((c) => byId.has(c.id) && c.dueDay <= today)
    .sort((a, b) => a.dueDay.localeCompare(b.dueDay) || a.streak - b.streak || a.id.localeCompare(b.id))
  const due = dueCards.slice(0, remaining).map((c) => byId.get(c.id)!)
  const topUp: Question[] = []
  const room = remaining - due.length
  if (room > 0) {
    const taken = new Set(due.map((q) => q.id))
    for (const c of schedule.values()) if (c.lastDay === today) taken.add(c.id)
    const scores = bulletScores(answers, byId, outline)
    const { ranked, notEnoughData } = weakSpots(scores)
    const bulletOrder = [...ranked.map((s) => s.bulletId), ...notEnoughData.map((s) => s.bulletId)]
    const rand = options.rand ?? Math.random
    const lists = bulletOrder.map((b) => {
      const qs = shuffled(pool.filter((q) => q.bulletIds.includes(b) && !taken.has(q.id)), rand)
      return qs.sort((x, y) => Number(schedule.has(x.id)) - Number(schedule.has(y.id)))
    })
    // Round-robin over the weakest bullets so the top-up isn't one bullet only.
    for (let round = 0; topUp.length < room && lists.some((l) => l.length > round); round++) {
      for (const l of lists) {
        const q = l[round]
        if (!q || taken.has(q.id)) continue
        topUp.push(q)
        taken.add(q.id)
        if (topUp.length >= room) break
      }
    }
  }
  return { due, topUp, dueCount: dueCards.length, answeredToday, remaining }
}

/** Logs review answers with code 'r'. Never touches machine progress. */
export function recordReview(save: Save, questionIds: string[], correct: boolean[], now: Date = new Date()): Save {
  const t = Math.floor(now.getTime() / 1000)
  return {
    ...save,
    updatedAt: now.toISOString(),
    answers: [...save.answers, ...questionIds.map((id, i): AnswerEntry => [id, correct[i] ? 1 : 0, t, 'r'])],
  }
}

export interface Maintenance {
  needed: boolean
  answers: number
  accuracy: number | null
}

/**
 * Recent review and mock accuracy on a certified machine's questions. Below the
 * threshold the map shows "needs maintenance" and suggests a review set. It
 * never removes a certification.
 */
export function maintenance(machineId: string, certified: boolean, answers: AnswerEntry[], questionsById: Map<string, Pick<Question, 'machineId'>>): Maintenance {
  const recent: (0 | 1)[] = []
  for (let i = answers.length - 1; i >= 0 && recent.length < MAINT_WINDOW; i--) {
    const [id, correct, , code] = answers[i]!
    if ((code === 'r' || code === 'm') && questionsById.get(id)?.machineId === machineId) recent.push(correct)
  }
  const accuracy = recent.length ? recent.filter((c) => c === 1).length / recent.length : null
  const needed = certified && recent.length >= MAINT_MIN && accuracy !== null && accuracy < MAINT_THRESHOLD
  return { needed, answers: recent.length, accuracy }
}

/** A maintenance review set: the machine's questions, recently missed first, then due, then the rest. */
export function maintenanceSet(machineId: string, questions: Question[], answers: AnswerEntry[], now: Date = new Date(), rand: () => number = Math.random, timeZone: string = localTimeZone()): Question[] {
  const pool = shuffled(questions.filter((q) => q.machineId === machineId && !q.caseStudyId), rand)
  const schedule = cards(answers, timeZone)
  const today = dayKey(now, timeZone)
  const rank = (q: Question) => {
    const c = schedule.get(q.id)
    if (c && c.streak === 0) return 0
    if (c && c.dueDay <= today) return 1
    if (!c) return 2
    return 3
  }
  return pool.sort((a, b) => rank(a) - rank(b)).slice(0, MAINT_SET_SIZE)
}
