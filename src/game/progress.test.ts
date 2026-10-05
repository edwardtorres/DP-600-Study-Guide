import { describe, expect, it } from 'vitest'
import type { Question } from '../content/questions/types'
import { machines } from '../data/machines'
import { millGraph } from '../data/mill'
import { outline } from '../data/outline'
import { newSave, type AnswerEntry, type Save } from '../save/schema'
import { badges, domainWeights, levelFor, readiness, readinessWindow, streak, totalXp, xpForLevel } from './progress'
import { addDays, dayKey } from './time'

const q = (id: string, difficulty: 1 | 2 | 3, bullet = 'P1.1'): Question => ({
  id,
  machineId: 'm',
  bulletIds: [bullet],
  difficulty,
  stem: '',
  sources: [],
  format: 'single',
  options: [],
  answer: 'a',
})
const byId = (qs: Question[]) => new Map(qs.map((x) => [x.id, x]))
const at = (iso: string) => Math.floor(Date.parse(iso) / 1000)
const answers = (iso: string, n: number, correct: 0 | 1 = 1): AnswerEntry[] => Array.from({ length: n }, (_, i) => [`Q${i}`, correct, at(iso), 'i'])

describe('XP and levels', () => {
  it('scales XP by difficulty and gives 25% for repeat correct answers', () => {
    const qs = byId([q('a', 1), q('b', 2), q('c', 3)])
    expect(totalXp([['a', 1, 0, 'i'], ['b', 1, 0, 'i'], ['c', 1, 0, 'i']], qs)).toBe(60)
    expect(totalXp([['c', 1, 0, 'i'], ['c', 1, 0, 'i'], ['c', 0, 0, 'i']], qs)).toBe(30 + 7)
    expect(totalXp([['a', 1, 0, 'i'], ['a', 1, 0, 'i']], qs)).toBe(10 + 2)
    expect(totalXp([['b', 0, 0, 'i'], ['missing', 1, 0, 'i']], qs)).toBe(0)
  })

  it('maps XP to levels and ranks', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpForLevel)).toEqual([0, 100, 300, 600, 1000, 4500])
    expect(levelFor(0)).toMatchObject({ level: 1, rank: 'Apprentice', nextLevelXp: 100 })
    expect(levelFor(99).level).toBe(1)
    expect(levelFor(100).level).toBe(2)
    expect(levelFor(600)).toMatchObject({ level: 4, rank: 'Journeyman' })
    expect(levelFor(2100)).toMatchObject({ level: 7, rank: 'Weaver' })
    expect(levelFor(4500)).toMatchObject({ level: 10, rank: 'Master Weaver' })
  })
})

describe('streak in the local time zone', () => {
  it('counts a day only after 10 answers', () => {
    const now = new Date('2026-10-04T20:00:00Z')
    expect(streak(answers('2026-10-04T18:00:00Z', 9), now, 'UTC')).toMatchObject({ current: 0, answeredToday: 9 })
    expect(streak(answers('2026-10-04T18:00:00Z', 10), now, 'UTC')).toMatchObject({ current: 1 })
  })

  it('uses the local calendar day, not UTC', () => {
    // 2026-10-05 03:00 UTC is still Oct 4 (20:00) in Los Angeles and already Oct 5 (12:00) in Tokyo.
    const instant = '2026-10-05T03:00:00Z'
    expect(dayKey(new Date(instant), 'America/Los_Angeles')).toBe('2026-10-04')
    expect(dayKey(new Date(instant), 'Asia/Tokyo')).toBe('2026-10-05')
    const log = [...answers('2026-10-04T18:00:00Z', 10), ...answers(instant, 10)]
    // In LA both batches fall on Oct 4 → one day. In Tokyo they are Oct 5 (03:00 JST) and Oct 5 → also one day.
    expect(streak(log, new Date(instant), 'America/Los_Angeles').days).toEqual(['2026-10-04'])
    // In UTC they are Oct 4 and Oct 5 → two consecutive days.
    expect(streak(log, new Date(instant), 'UTC')).toMatchObject({ current: 2, best: 2 })
  })

  it('keeps the streak through today until the day ends, and breaks after a missed day', () => {
    const tz = 'America/Los_Angeles'
    const log = [...answers('2026-10-02T18:00:00Z', 10), ...answers('2026-10-03T18:00:00Z', 10)]
    // Oct 4 morning in LA, nothing answered yet today: streak is still 2.
    expect(streak(log, new Date('2026-10-04T16:00:00Z'), tz).current).toBe(2)
    // Oct 5 in LA: Oct 4 was missed, so the streak is broken.
    expect(streak(log, new Date('2026-10-05T16:00:00Z'), tz)).toMatchObject({ current: 0, best: 2 })
  })

  it('handles the daylight-saving change', () => {
    const tz = 'America/Los_Angeles'
    // DST ends on 2026-11-01 in the US: Oct 31, Nov 1, Nov 2 are consecutive local days.
    const log = [...answers('2026-10-31T20:00:00Z', 10), ...answers('2026-11-01T20:00:00Z', 10), ...answers('2026-11-02T20:00:00Z', 10)]
    expect(streak(log, new Date('2026-11-02T21:00:00Z'), tz).current).toBe(3)
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
  })
})

describe('readiness', () => {
  it('weights domains by the official midpoints', () => {
    const w = domainWeights(outline)
    expect(w.get('PREPARE')).toBeCloseTo(47.5 / 102.5, 5)
    expect(w.get('SEMANTIC')).toBeCloseTo(27.5 / 102.5, 5)
    expect(w.get('MAINTAIN')).toBeCloseTo(27.5 / 102.5, 5)
  })

  it('uses recent accuracy times bullet coverage, never XP, and needs 10 answers', () => {
    const prepBullets = outline.domains.find((d) => d.id === 'PREPARE')!.sections.flatMap((s) => s.bullets.map((b) => b.id))
    const qs = prepBullets.map((b, i) => q(`p${i}`, 3, b))
    const log: AnswerEntry[] = qs.map((x, i) => [x.id, i % 2 === 0 ? 1 : 0, i, 'i'])
    const r = readiness(log, byId(qs), outline)
    const prep = r.domains.find((d) => d.domain === 'PREPARE')!
    expect(prep.coverage).toBe(1)
    expect(prep.score).toBe(Math.round((9 / 18) * 100))
    expect(r.domains.find((d) => d.domain === 'SEMANTIC')!.score).toBeNull()
    expect(r.overall).toBeNull()

    // Half the bullets covered with 100% accuracy → 50.
    const half = qs.slice(0, 9)
    const log2: AnswerEntry[] = [...half, ...half].map((x, i) => [x.id, 1, i, 'i'])
    expect(readiness(log2, byId(qs), outline).domains.find((d) => d.domain === 'PREPARE')!.score).toBe(50)
  })

  it('counts inspection, placement, and puzzle answers, never start-up checks', () => {
    const prepBullets = outline.domains.find((d) => d.id === 'PREPARE')!.sections.flatMap((s) => s.bullets.map((b) => b.id))
    const qs = prepBullets.map((b, i) => q(`p${i}`, 1, b))
    const prep = (log: AnswerEntry[]) => readiness(log, byId(qs), outline).domains.find((d) => d.domain === 'PREPARE')!
    const base: AnswerEntry[] = qs.slice(0, 10).map((x, i) => [x.id, 1, i, 'i'])
    // Start-up answers (even wrong ones on new bullets) change nothing.
    const startups: AnswerEntry[] = qs.slice(10).map((x, i) => [x.id, 0, 100 + i, 's'])
    expect(prep([...base, ...startups])).toEqual(prep(base))
    // Placement answers count.
    expect(prep([...base, [qs[11]!.id, 0, 200, 'p']]).answered).toBe(11)
    // A puzzle play counts toward accuracy and covers its bullets.
    const puzzle = { id: 'QO-T01', difficulty: 2 as const, bulletIds: [prepBullets[15]!, prepBullets[16]!] }
    const lookup = new Map<string, { difficulty: 1 | 2 | 3; bulletIds: string[] }>([...byId(qs), [puzzle.id, puzzle]])
    const withPuzzle = readiness([...base, [puzzle.id, 1, 300, 'z']], lookup, outline).domains.find((d) => d.domain === 'PREPARE')!
    expect(withPuzzle.answered).toBe(11)
    expect(withPuzzle.coverage).toBeCloseTo(12 / prepBullets.length, 5)
  })

  it('caps puzzle plays at the 10 most recent in a domain’s 40-answer window', () => {
    const prepBullets = outline.domains.find((d) => d.id === 'PREPARE')!.sections.flatMap((s) => s.bullets.map((b) => b.id))
    const qs = prepBullets.map((b, i) => q(`p${i}`, 1, b))
    const puzzle = { id: 'QO-T01', difficulty: 2 as const, bulletIds: [prepBullets[0]!] }
    const lookup = new Map<string, { difficulty: 1 | 2 | 3; bulletIds: string[] }>([...byId(qs), [puzzle.id, puzzle]])
    // 30 puzzle plays (all right), then 20 inspection answers (all wrong).
    const log: AnswerEntry[] = [
      ...Array.from({ length: 30 }, (_, i) => [puzzle.id, 1, i, 'z'] as AnswerEntry),
      ...Array.from({ length: 20 }, (_, i) => [qs[i % qs.length]!.id, 0, 100 + i, 'i'] as AnswerEntry),
    ]
    const w = readinessWindow(log)
    expect(w.filter((e) => e[3] === 'z')).toHaveLength(10)
    expect(w.filter((e) => e[3] === 'i')).toHaveLength(20)
    // The 10 kept plays are the most recent ones, in log order.
    expect(w.filter((e) => e[3] === 'z').map((e) => e[2])).toEqual([20, 21, 22, 23, 24, 25, 26, 27, 28, 29])
    const prep = readiness(log, lookup, outline).domains.find((d) => d.domain === 'PREPARE')!
    expect(prep.accuracy).toBeCloseTo(10 / 30, 5)
    // Without enough other answers, the window is shorter rather than filled with older plays.
    expect(readinessWindow(log.slice(0, 30))).toHaveLength(10)
    // Never more than 40, and interleaved plays beyond the cap are skipped.
    const mixed: AnswerEntry[] = Array.from({ length: 100 }, (_, i) => [i % 2 ? qs[0]!.id : puzzle.id, 1, i, i % 2 ? 'i' : 'z'] as AnswerEntry)
    const mw = readinessWindow(mixed)
    expect(mw).toHaveLength(40)
    expect(mw.filter((e) => e[3] === 'z')).toHaveLength(10)
  })

  it('counts lab debrief answers like inspections', () => {
    const prepBullets = outline.domains.find((d) => d.id === 'PREPARE')!.sections.flatMap((s) => s.bullets.map((b) => b.id))
    const qs = prepBullets.map((b, i) => q(`p${i}`, 1, b))
    const log: AnswerEntry[] = qs.slice(0, 12).map((x, i) => [x.id, 1, i, 'l'])
    expect(readiness(log, byId(qs), outline).domains.find((d) => d.domain === 'PREPARE')!.answered).toBe(12)
  })

  it('computes the weighted overall once every domain has a score', () => {
    const all = outline.domains.flatMap((d) => d.sections.flatMap((s) => s.bullets.map((b) => q(`${b.id}`, 1, b.id))))
    const log: AnswerEntry[] = all.map((x, i) => [x.id, x.bulletIds[0]!.startsWith('P') ? 1 : 0, i, 'i'])
    const r = readiness(log, byId(all), outline)
    expect(r.overall).toBe(Math.round(100 * (47.5 / 102.5)))
  })
})

describe('badges', () => {
  it('are earned only from certifications and streaks', () => {
    const now = new Date('2026-10-04T12:00:00Z')
    let save: Save = newSave(now)
    expect(badges(save, machines, millGraph, now, 'UTC').every((b) => !b.earnedAt)).toBe(true)
    const cert = (id: string, kind: 'inspection' | 'placement', score = 1) =>
      (save = { ...save, machines: { ...save.machines, [id]: { certification: { passedAt: now.toISOString(), score, kind } } } })
    for (const m of machines.filter((x) => x.floor === 'orientation')) cert(m.id, 'inspection', 0.8)
    cert('tension-meter', 'inspection')
    cert('dax-scale', 'placement')
    const earned = new Set(badges(save, machines, millGraph, now, 'UTC').filter((b) => b.earnedAt).map((b) => b.id))
    expect(earned).toEqual(new Set(['orientation', 'kql', 'dax', 'first-placement', 'perfect-inspection']))
  })
})
