import { describe, expect, it } from 'vitest'
import { machines } from '../../data/machines'
import { outline } from '../../data/outline'
import { allQuestions } from '../questions'
import { allLabs, LABS_UNCOVERED, labMinutes } from './index'
import type { Lab } from './types'
import { labSources, validateLabs } from './validate'

const run = (labs: Lab[], uncovered = LABS_UNCOVERED) => validateLabs(outline, machines, labs, allQuestions, uncovered)
const swap = (id: string, change: (l: Lab) => Lab) => allLabs.map((l) => (l.id === id ? change(structuredClone(l)) : l))

describe('labs', () => {
  it('pass every rule', () => {
    expect(run(allLabs)).toEqual([])
  })

  it('cover every outline bullet', () => {
    const covered = new Set(allLabs.flatMap((l) => l.bulletIds))
    const all = outline.domains.flatMap((d) => d.sections.flatMap((s) => s.bullets.map((b) => b.id)))
    expect(all.filter((b) => !covered.has(b))).toEqual(Object.keys(LABS_UNCOVERED))
  })

  it('cite only Learn and Microsoft’s lab exercises', () => {
    for (const u of labSources(allLabs)) expect(u).toMatch(/^https:\/\/(learn\.microsoft\.com|microsoftlearning\.github\.io)\//)
  })

  it('total about 14 to 20 hours', () => {
    expect(labMinutes / 60).toBeGreaterThan(14)
    expect(labMinutes / 60).toBeLessThan(20)
  })

  it('reject a source from another site', () => {
    const bad = swap('L02', (l) => ({ ...l, steps: [{ ...l.steps[0]!, sources: ['https://example.com/tutorial'] }, ...l.steps.slice(1)] }))
    expect(run(bad).join('\n')).toMatch(/L02: step s1: source must be/)
  })

  it('reject a lab with no cleanup', () => {
    expect(run(swap('L03', (l) => ({ ...l, cleanup: [] })))).toContain('Lab L03: has no cleanup steps')
  })

  it('reject features the trial excludes and private-looking text', () => {
    const ai = swap('L05', (l) => ({ ...l, goal: `${l.goal} Then ask Copilot.` }))
    expect(run(ai).join('\n')).toMatch(/L05: mentions a feature the trial doesn't include/)
    const email = swap('L05', (l) => ({ ...l, before: 'Sign in as someone@contoso.com.' }))
    expect(run(email).join('\n')).toMatch(/L05: contains something that looks private/)
    const xmla = swap('L15', (l) => ({ ...l, before: 'Use powerbi://api.powerbi.com/v1.0/myorg/DP600-Dev' }))
    expect(run(xmla).join('\n')).toMatch(/L15: contains something that looks private/)
  })

  it('reject data-dependent checkpoints', () => {
    const bad = swap('L06', (l) => ({ ...l, steps: [{ ...l.steps[0]!, checkpoint: 'The table has 1,000 rows.' }, ...l.steps.slice(1)] }))
    expect(run(bad).join('\n')).toMatch(/L06: step s1: checkpoint mentions a number/)
  })

  it('reject a prerequisite later in the order, and cycles', () => {
    const later = swap('L02', (l) => ({ ...l, prereqs: ['L05'] }))
    expect(run(later).join('\n')).toMatch(/L02: prerequisite L05 comes after it/)
    const cycle = allLabs.map((l) => (l.id === 'L01' ? { ...l, prereqs: ['L02'] } : l))
    expect(run(cycle).join('\n')).toMatch(/cycle/)
  })

  it('reject an uncovered bullet without a reason', () => {
    const without = allLabs.map((l) => ({ ...l, bulletIds: l.bulletIds.filter((b) => b !== 'P3.3') }))
    expect(run(without)).toContain('Bullet P3.3 has no lab and no reason in LABS_UNCOVERED')
    expect(run(without, { 'P3.3': 'needs a paid feature' })).not.toContain('Bullet P3.3 has no lab and no reason in LABS_UNCOVERED')
  })

  it('reject a required Windows step in a browser lab, and a cost on a required step', () => {
    const win = swap('L02', (l) => ({ ...l, steps: [{ ...l.steps[0]!, windows: true }, ...l.steps.slice(1)] }))
    expect(run(win).join('\n')).toMatch(/L02: step s1: a browser lab may only have optional Windows steps/)
    const cost = swap('L02', (l) => ({ ...l, steps: [{ ...l.steps[0]!, cost: 'Uses a paid Azure resource' }, ...l.steps.slice(1)] }))
    expect(run(cost).join('\n')).toMatch(/must be optional/)
  })

  it('keep each machine’s lab platform in sync with its labs', () => {
    const mixedUp = machines.map((m) => (m.id === 'batch-winder' ? { ...m, labPlatform: 'browser' as const } : m))
    expect(validateLabs(outline, mixedUp, allLabs, allQuestions, LABS_UNCOVERED)).toContain(
      'Machine batch-winder: labPlatform is browser but its labs are windows',
    )
  })
})
