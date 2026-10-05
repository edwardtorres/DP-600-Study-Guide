import { describe, expect, it } from 'vitest'
import { canonical } from './engine'
import { daxTemplates } from './dax'
import { kqlTemplates } from './kql'
import { caseProblems, generateCase, MAX_ROWS, MIN_ROWS, oracleInstance } from './template'
import { trapById } from './traps'
import { tsqlTemplates } from './tsql'

const all = [...tsqlTemplates, ...kqlTemplates, ...daxTemplates]

describe('Query Oracle templates', () => {
  it('has at least 12 templates per language, with unique ids', () => {
    expect(tsqlTemplates.length).toBeGreaterThanOrEqual(12)
    expect(kqlTemplates.length).toBeGreaterThanOrEqual(12)
    expect(daxTemplates.length).toBeGreaterThanOrEqual(12)
    expect(new Set(all.map((t) => t.meta.id)).size).toBe(all.length)
  })

  it.each(all.map((t) => [t.meta.id, t] as const))('%s builds a valid case for 100 seeds', (_, t) => {
    for (let seed = 0; seed < 100; seed++) {
      const c = generateCase(t, seed)
      expect(caseProblems(c)).toEqual([])
      const results = [c.correct, ...c.distractors.map((d) => d.table)].map(canonical)
      expect(new Set(results).size).toBe(4)
      for (const d of c.distractors) {
        expect(trapById.has(d.trap)).toBe(true)
        expect(t.traps).toContain(d.trap)
        expect(d.why.length).toBeGreaterThan(10)
      }
      for (const table of c.tables) {
        expect(table.rows.length).toBeGreaterThanOrEqual(MIN_ROWS)
        expect(table.rows.length).toBeLessThanOrEqual(MAX_ROWS)
      }
    }
  })

  it('builds the same instance for the same seed and new data for new seeds', () => {
    for (const t of all) {
      const a = oracleInstance(t, 42)
      expect(oracleInstance(t, 42)).toEqual(a)
      const queries = new Set(Array.from({ length: 20 }, (_, s) => JSON.stringify(oracleInstance(t, s).context)))
      expect(queries.size).toBeGreaterThan(5)
      const d = a.decisions[0]!
      expect(d.choices).toHaveLength(4)
      expect(d.accepted).toHaveLength(1)
      expect(d.choices.filter((c) => c.explain.startsWith('Correct.')).map((c) => c.id)).toEqual(d.accepted)
    }
  })

  it('spreads the correct answer across positions', () => {
    const positions = [0, 0, 0, 0]
    for (const t of all) for (let s = 0; s < 20; s++) {
      const d = oracleInstance(t, s).decisions[0]!
      positions[d.choices.findIndex((c) => c.id === d.accepted[0])]!++
    }
    const total = positions.reduce((a, b) => a + b, 0)
    for (const p of positions) expect(p / total).toBeLessThan(0.35)
  })
})
