import { describe, expect, it } from 'vitest'
import { allQuestions } from '../content/questions'
import type { Question } from '../content/questions/types'
import { outline } from '../data/outline'
import { newSave, type AnswerEntry } from '../save/schema'
import { cards, DAILY_CAP, dailyQueue, intervalFor, INTERVALS, maintenance, maintenanceSet, recordReview } from './review'
import { mulberry32 } from './shuffle'

const TZ = 'UTC'
const at = (iso: string) => Math.floor(Date.parse(iso) / 1000)
const day = (n: number) => at(`2026-10-${String(n).padStart(2, '0')}T12:00:00Z`)
const nonCase = allQuestions.filter((q) => !q.caseStudyId && q.bulletIds.length > 0)
const byId = new Map(allQuestions.map((q) => [q.id, q]))

describe('review intervals', () => {
  it('a miss comes back the next day; correct answers in a row push it out 2, 4, 7, 14, then 30 days', () => {
    expect(INTERVALS).toEqual([1, 2, 4, 7, 14, 30])
    expect([0, 1, 2, 3, 4, 5, 6, 9].map(intervalFor)).toEqual([1, 2, 4, 7, 14, 30, 30, 30])
    const log: AnswerEntry[] = [['Q', 1, day(1), 'i']]
    expect(cards(log, TZ).get('Q')).toMatchObject({ streak: 1, lastDay: '2026-10-01', dueDay: '2026-10-03' })
    log.push(['Q', 1, day(3), 'r'], ['Q', 1, day(7), 'r'])
    expect(cards(log, TZ).get('Q')).toMatchObject({ streak: 3, dueDay: '2026-10-14' })
    log.push(['Q', 0, day(14), 'r'])
    expect(cards(log, TZ).get('Q')).toMatchObject({ streak: 0, dueDay: '2026-10-15' })
  })

  it('ignores puzzle plays and uses answer time order', () => {
    const log: AnswerEntry[] = [['Q', 0, day(5), 'r'], ['Q', 1, day(2), 'i'], ['P', 1, day(2), 'z']]
    const c = cards(log, TZ)
    expect(c.has('P')).toBe(false)
    expect(c.get('Q')).toMatchObject({ streak: 0, lastDay: '2026-10-05', answers: 2 })
  })

  it('uses local days in the given time zone', () => {
    // 23:30 UTC on Oct 1 is already Oct 2 in Tokyo.
    const log: AnswerEntry[] = [['Q', 0, at('2026-10-01T23:30:00Z'), 'i']]
    expect(cards(log, 'Asia/Tokyo').get('Q')?.dueDay).toBe('2026-10-03')
    expect(cards(log, 'UTC').get('Q')?.dueDay).toBe('2026-10-02')
  })
})

describe('daily queue', () => {
  const now = new Date('2026-10-10T09:00:00Z')

  it('lists due questions most overdue first, then shortest streak', () => {
    const [a, b, c] = nonCase
    const log: AnswerEntry[] = [
      [a!.id, 1, day(1), 'i'], // due Oct 3
      [b!.id, 0, day(6), 'i'], // due Oct 7
      [c!.id, 1, day(9), 'i'], // due Oct 11 (not yet)
    ]
    const q = dailyQueue(log, allQuestions, outline, now, { timeZone: TZ, cap: 2 })
    expect(q.due.map((x) => x.id)).toEqual([a!.id, b!.id])
    expect(q.dueCount).toBe(2)
    expect(q.topUp).toEqual([])
  })

  it('caps review answers per local day, counting what was already reviewed today', () => {
    expect(DAILY_CAP).toBe(20)
    const log: AnswerEntry[] = nonCase.slice(0, 30).map((q) => [q.id, 0, day(1), 'i'])
    const fresh = dailyQueue(log, allQuestions, outline, now, { timeZone: TZ })
    expect(fresh.dueCount).toBe(30)
    expect(fresh.due).toHaveLength(20)
    const reviewedToday: AnswerEntry[] = nonCase.slice(40, 52).map((q) => [q.id, 1, at('2026-10-10T08:00:00Z'), 'r'])
    const later = dailyQueue([...log, ...reviewedToday], allQuestions, outline, now, { timeZone: TZ })
    expect(later.answeredToday).toBe(12)
    expect(later.remaining).toBe(8)
    expect(later.due.length + later.topUp.length).toBe(8)
  })

  it('tops up from the weakest bullets, unseen questions first, when little is due', () => {
    const weakBullet = 'P2.4'
    const strongBullet = 'P2.5'
    const weak = nonCase.filter((q) => q.bulletIds.includes(weakBullet))
    const strong = nonCase.filter((q) => q.bulletIds.includes(strongBullet) && !q.bulletIds.includes(weakBullet))
    const log: AnswerEntry[] = [
      ...weak.slice(0, 3).map((q): AnswerEntry => [q.id, 0, day(9), 'i']),
      ...strong.slice(0, 3).map((q): AnswerEntry => [q.id, 1, day(9), 'i']),
    ]
    const q = dailyQueue(log, allQuestions, outline, now, { timeZone: TZ, cap: 5, rand: mulberry32(3) })
    expect(q.dueCount).toBe(3) // the three misses are due today
    expect(q.topUp).toHaveLength(2)
    // The weakest bullet comes first in the top-up, with questions not answered yet.
    expect(q.topUp[0]!.bulletIds).toContain(weakBullet)
    expect(log.some(([id]) => id === q.topUp[0]!.id)).toBe(false)
  })

  it('never includes case-study questions', () => {
    const caseQ = allQuestions.find((q) => q.caseStudyId)!
    const q = dailyQueue([[caseQ.id, 0, day(1), 'm']], allQuestions, outline, now, { timeZone: TZ, cap: 30, rand: mulberry32(1) })
    expect([...q.due, ...q.topUp].every((x) => !x.caseStudyId)).toBe(true)
  })

  it("logs review answers as 'r' and leaves machines alone", () => {
    const s = recordReview(newSave(now), ['A', 'B'], [true, false], now)
    expect(s.answers).toEqual([
      ['A', 1, Math.floor(now.getTime() / 1000), 'r'],
      ['B', 0, Math.floor(now.getTime() / 1000), 'r'],
    ])
    expect(s.machines).toEqual({})
  })
})

describe('machine maintenance', () => {
  const m = 'carding-machine'
  const qs = nonCase.filter((q) => q.machineId === m)
  const entries = (pattern: (0 | 1)[], code: 'r' | 'm' | 'i' = 'r'): AnswerEntry[] => pattern.map((c, i) => [qs[i % qs.length]!.id, c, day(1) + i, code])

  it('flags a certified machine whose recent review accuracy is below 60%', () => {
    expect(maintenance(m, true, entries([1, 0, 0, 1, 0]), byId)).toMatchObject({ needed: true, answers: 5, accuracy: 0.4 })
    // Exactly 60% isn't below the threshold.
    expect(maintenance(m, true, entries([1, 1, 1, 0, 0]), byId).needed).toBe(false)
  })

  it('needs at least 5 review or mock answers and only looks at the last 8', () => {
    expect(maintenance(m, true, entries([0, 0, 0, 0]), byId).needed).toBe(false)
    expect(maintenance(m, true, entries([0, 0, 0, 0, 0], 'i'), byId).needed).toBe(false)
    const old = entries([0, 0, 0, 0, 0, 0])
    const recent = entries([1, 1, 1, 1, 1, 1, 1, 1]).map((e): AnswerEntry => [e[0], e[1], e[2] + 1000, e[3]])
    expect(maintenance(m, true, [...old, ...recent], byId)).toMatchObject({ needed: false, answers: 8, accuracy: 1 })
  })

  it('only applies to certified machines and never changes certification', () => {
    const save = newSave()
    const log = entries([0, 0, 0, 0, 0])
    expect(maintenance(m, false, log, byId).needed).toBe(false)
    maintenance(m, true, log, byId)
    expect(save.machines).toEqual({})
  })

  it('builds a 5-question set from the machine, recent misses first', () => {
    const missed = qs[2]!
    const set = maintenanceSet(m, allQuestions, [[missed.id, 0, day(9), 'r']], new Date('2026-10-10T09:00:00Z'), mulberry32(2), TZ)
    expect(set).toHaveLength(5)
    expect(set[0]!.id).toBe(missed.id)
    expect(set.every((q: Question) => q.machineId === m && !q.caseStudyId)).toBe(true)
  })
})
