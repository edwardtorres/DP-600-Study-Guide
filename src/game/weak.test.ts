import { describe, expect, it } from 'vitest'
import { allQuestions } from '../content/questions'
import { outline } from '../data/outline'
import type { AnswerEntry } from '../save/schema'
import { bulletScores, trapMisses, WEAK_MIN_ANSWERS, WEAK_WINDOW, weakSpots } from './weak'

const byId = new Map(allQuestions.map((q) => [q.id, q]))
const one = (bullet: string) => allQuestions.filter((q) => !q.caseStudyId && q.bulletIds.length === 1 && q.bulletIds[0] === bullet)
const log = (bullet: string, pattern: (0 | 1)[], code: AnswerEntry[3] = 'i'): AnswerEntry[] => {
  const qs = one(bullet)
  return pattern.map((c, i) => [qs[i % qs.length]!.id, c, 1000 + i, code])
}

describe('Weak Spots', () => {
  it('ranks bullets by recent accuracy and reports how many answers each rests on', () => {
    const answers = [...log('P2.4', [0, 0, 1]), ...log('S1.2', [1, 1, 0, 1]), ...log('M1.1', [1, 1, 1])]
    const { ranked, notEnoughData } = weakSpots(bulletScores(answers, byId, outline))
    expect(ranked.map((s) => [s.bulletId, s.answers, s.correct])).toEqual([
      ['P2.4', 3, 1],
      ['S1.2', 4, 3],
      ['M1.1', 3, 3],
    ])
    expect(notEnoughData).toHaveLength(41 - 3)
  })

  it('lists bullets with too few answers separately', () => {
    expect(WEAK_MIN_ANSWERS).toBe(3)
    const { ranked, notEnoughData } = weakSpots(bulletScores(log('P2.4', [0, 0]), byId, outline))
    expect(ranked).toEqual([])
    expect(notEnoughData.find((s) => s.bulletId === 'P2.4')).toMatchObject({ answers: 2, accuracy: 0 })
  })

  it('uses only the most recent answers per bullet and ignores start-up checks and puzzles', () => {
    const old = log('P2.4', Array(WEAK_WINDOW).fill(0) as 0[])
    const recent = log('P2.4', Array(WEAK_WINDOW).fill(1) as 1[]).map((e): AnswerEntry => [e[0], e[1], e[2] + 5000, e[3]])
    const s = bulletScores([...old, ...recent, ...log('P2.4', [0, 0, 0], 's')], byId, outline).find((x) => x.bulletId === 'P2.4')!
    expect(s).toMatchObject({ answers: WEAK_WINDOW, accuracy: 1 })
  })

  it('ranks the "don\'t confuse" pairs missed most', () => {
    const withPair = allQuestions.filter((q) => q.trapPairId && !q.caseStudyId)
    const a = withPair.find((q) => q.trapPairId === 'dl-fallback')!
    const b = withPair.find((q) => q.trapPairId === 'storage-modes')!
    const answers: AnswerEntry[] = [
      [a.id, 0, 1, 'i'],
      [a.id, 0, 2, 'r'],
      [a.id, 1, 3, 'r'],
      [b.id, 0, 4, 'm'],
      [b.id, 0, 5, 's'], // start-up checks don't count
    ]
    expect(trapMisses(answers, byId)).toEqual([
      { pairId: 'dl-fallback', misses: 2, of: 3 },
      { pairId: 'storage-modes', misses: 1, of: 1 },
    ])
  })
})
