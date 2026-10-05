import { describe, expect, it } from 'vitest'
import { allQuestions } from '../content/questions'
import { displacedCount, hashString, minDisplaced, mulberry32, shuffleForAttempt } from './shuffle'

const order = (q: ReturnType<typeof shuffleForAttempt>) => {
  switch (q.format) {
    case 'single':
    case 'multi':
      return q.options.map((o) => o.id).join()
    case 'yesno':
      return q.statements.map((s) => s.id).join()
    case 'match':
      return q.choices.map((c) => c.id).join()
    case 'order':
      return q.items.map((i) => i.id).join()
    case 'dropdown':
      return q.slots.map((s) => s.options.map((o) => o.id).join('')).join('|')
  }
}

describe('render-time shuffle', () => {
  it('is deterministic for a seed', () => {
    expect(mulberry32(42)()).toBe(mulberry32(42)())
    expect(hashString('KT-01')).toBe(hashString('KT-01'))
  })

  it('is stable within an attempt for every format', () => {
    for (const q of allQuestions) expect(order(shuffleForAttempt(q, 1234))).toBe(order(shuffleForAttempt(q, 1234)))
  })

  it('changes between attempts for every format', () => {
    for (const format of ['single', 'multi', 'yesno', 'match', 'order', 'dropdown'] as const) {
      const qs = allQuestions.filter((q) => q.format === format)
      const differs = qs.some((q) => order(shuffleForAttempt(q, 1)) !== order(shuffleForAttempt(q, 2)))
      expect(differs, format).toBe(true)
    }
  })

  it('starts every ordering with at least half its items (rounded up) out of place, across 200 seeds', () => {
    const orders = allQuestions.filter((q) => q.format === 'order')
    expect(orders.length).toBeGreaterThan(0)
    for (const q of orders) {
      for (let seed = 0; seed < 200; seed++) {
        const s = shuffleForAttempt(q, seed)
        if (s.format !== 'order') throw new Error('format changed')
        const ids = s.items.map((i) => i.id)
        expect(ids).not.toEqual(q.answerOrder)
        expect(displacedCount(ids, q.answerOrder)).toBeGreaterThanOrEqual(minDisplaced(q.items.length))
        expect([...ids].sort()).toEqual([...q.answerOrder].sort())
      }
    }
  })

  it('counts displaced items and rounds the minimum up', () => {
    expect(displacedCount(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(0)
    expect(displacedCount(['b', 'a', 'c'], ['a', 'b', 'c'])).toBe(2)
    expect([2, 3, 4, 5, 6].map(minDisplaced)).toEqual([1, 2, 2, 3, 3])
  })

  it('keeps ids, keys, and explanations together', () => {
    for (const q of allQuestions) {
      const s = shuffleForAttempt(q, 99)
      if (s.format === 'single' && q.format === 'single') {
        expect(s.answer).toBe(q.answer)
        for (const o of s.options) expect(o).toEqual(q.options.find((x) => x.id === o.id))
      }
      if (s.format === 'multi' && q.format === 'multi') expect(s.answers).toEqual(q.answers)
      if (s.format === 'match' && q.format === 'match') expect(s.pairs).toEqual(q.pairs)
    }
  })
})
