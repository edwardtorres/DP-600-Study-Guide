import { describe, expect, it } from 'vitest'
import { allQuestions } from '../content/questions'
import { machineById, machines } from '../data/machines'
import { drawInspection, drawPlacement, drawStartup, machinePool, placementPool } from './draw'
import { mulberry32 } from './shuffle'

describe('draw rules', () => {
  it('never draws case-study questions', () => {
    for (const m of machines) {
      for (let seed = 0; seed < 5; seed++) {
        const drawn = [
          ...drawInspection(m, allQuestions, [], mulberry32(seed)),
          ...drawStartup(m, allQuestions, [], mulberry32(seed)),
          ...drawPlacement(m, allQuestions, [], mulberry32(seed)),
        ]
        expect(drawn.every((q) => !q.caseStudyId && q.machineId === m.id)).toBe(true)
      }
    }
  })

  it('every inspection has 5 distinct questions, covers every bullet, and has one at difficulty 2+', () => {
    for (const m of machines) {
      for (let seed = 0; seed < 20; seed++) {
        const d = drawInspection(m, allQuestions, [], mulberry32(seed))
        expect(d).toHaveLength(5)
        expect(new Set(d.map((q) => q.id)).size).toBe(5)
        for (const b of m.bulletIds) expect(d.some((q) => q.bulletIds.includes(b)), `${m.id} ${b}`).toBe(true)
        expect(d.some((q) => q.difficulty >= 2), m.id).toBe(true)
      }
    }
  })

  it('avoids the previous inspection where the pool allows, and falls back on small pools', () => {
    for (const m of machines) {
      const pool = machinePool(m.id, allQuestions)
      const first = drawInspection(m, allQuestions, [], mulberry32(1))
      const second = drawInspection(m, allQuestions, first.map((q) => q.id), mulberry32(2))
      const repeats = second.filter((q) => first.some((f) => f.id === q.id)).length
      // Only as many repeats as the pool forces.
      expect(repeats).toBeLessThanOrEqual(Math.max(0, 5 - (pool.length - 5)))
      expect(second).toHaveLength(5)
    }
  })

  it('start-up checks draw two questions and avoid the previous start-up draw', () => {
    const m = machineById.get('founding-charter')!
    const a = drawStartup(m, allQuestions, [], mulberry32(3))
    expect(a).toHaveLength(2)
    const b = drawStartup(m, allQuestions, a.map((q) => q.id), mulberry32(4))
    expect(b.some((q) => a.some((x) => x.id === q.id))).toBe(false)
  })

  it('placement draws only placement-eligible questions', () => {
    for (const m of machines.filter((x) => x.pl300)) {
      const pool = placementPool(m.id, allQuestions)
      expect(pool.length, m.id).toBeGreaterThanOrEqual(8)
      const d = drawPlacement(m, allQuestions, [], mulberry32(5))
      expect(d).toHaveLength(5)
      expect(d.every((q) => q.placement)).toBe(true)
      const again = drawPlacement(m, allQuestions, d.map((q) => q.id), mulberry32(6))
      expect(again.filter((q) => d.some((x) => x.id === q.id)).length).toBeLessThanOrEqual(Math.max(0, 10 - pool.length))
    }
  })
})
