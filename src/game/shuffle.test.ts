import { describe, expect, it } from 'vitest'
import { allQuestions } from '../content/questions'
import { hashString, mulberry32, shuffleForAttempt } from './shuffle'

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

  it('never shows ordering items in the correct order', () => {
    const orders = allQuestions.filter((q) => q.format === 'order')
    for (const q of orders) {
      for (let seed = 0; seed < 200; seed++) {
        const s = shuffleForAttempt(q, seed)
        if (s.format !== 'order') throw new Error('format changed')
        expect(s.items.map((i) => i.id)).not.toEqual(q.answerOrder)
      }
    }
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
