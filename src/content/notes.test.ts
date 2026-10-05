import { describe, expect, it } from 'vitest'
import { machines } from '../data/machines'
import { allNotes } from './notes'
import { NOTES_PENDING, REQUIRED_PAIRS } from './requirements'
import type { MachineNotes } from './types'
import { notesSources, notesWordCount, validateNotes } from './validate'

const src = ['https://learn.microsoft.com/en-us/fabric/fundamentals/microsoft-fabric-overview']
const minimal = (machineId: string, extra: Partial<MachineNotes> = {}): MachineNotes => ({
  machineId,
  overview: [{ text: 'Overview.', sources: src }],
  bullets: [],
  examples: [],
  traps: [],
  dontConfuse: [],
  renamed: [],
  preview: [],
  upcoming: [],
  glossary: [],
  needsVerification: [],
  ...extra,
})

describe('notes', () => {
  it('pass validation for every floor that is written', () => {
    expect(validateNotes(machines, allNotes)).toEqual([])
  })

  it('cover every machine once no floor is pending', () => {
    const missing = machines.filter((m) => !NOTES_PENDING.includes(m.floor) && !allNotes.some((n) => n.machineId === m.id))
    expect(missing.map((m) => m.id)).toEqual([])
  })

  it('reject a missing machine, a non-Learn source, and an uncovered bullet', () => {
    const bad = [
      minimal('founding-charter', { overview: [{ text: 'x', sources: ['https://example.com/'] }] }),
      minimal('bale-catalog'),
    ]
    const errors = validateNotes(machines, bad, { pending: [] }).join('\n')
    expect(errors).toMatch(/water-wheel has no notes/)
    expect(errors).toMatch(/non-Learn URL: https:\/\/example\.com/)
    expect(errors).toMatch(/bale-catalog: bullet P1\.2 has no notes/)
    expect(errors).toMatch(/Required "don't confuse" pair missing: storage-modes/)
  })

  it('require PL-300 sections, code examples, and sources on every item', () => {
    const bad = [
      minimal('dax-scale', {
        bullets: [{ bulletId: 'P3.4', tools: ['semantic-model'], concepts: [{ text: 'c', sources: [] }], howTo: [{ text: 'h', sources: src }] }],
      }),
    ]
    const errors = validateNotes(machines, bad, { pending: [] }).join('\n')
    expect(errors).toMatch(/dax-scale: PL-300 machine has no "What DP-600 adds"/)
    expect(errors).toMatch(/dax-scale: needs at least one worked example/)
    expect(errors).toMatch(/bullet P3\.4 concepts #1 has no Learn source/)
  })

  it('reject duplicate glossary terms', () => {
    const g = [{ term: 'OneLake', definition: 'd', sources: src }]
    const errors = validateNotes(machines, [minimal('founding-charter', { glossary: g }), minimal('water-wheel', { glossary: g })], {
      pending: ['prepare', 'semantic', 'maintain', 'orientation'],
    })
    expect(errors.join()).toMatch(/"OneLake" is already defined in founding-charter/)
  })

  it('count words and collect sources', () => {
    const n = minimal('founding-charter', { glossary: [{ term: 'Two words', definition: 'three more words', sources: src }] })
    expect(notesWordCount(n)).toBe(6)
    expect(notesSources(n)).toEqual(src)
  })

  it('list nine required pairs', () => {
    expect(Object.keys(REQUIRED_PAIRS)).toHaveLength(9)
  })
})

it('has no floors pending: every machine has notes (strict mode)', () => {
  expect(NOTES_PENDING).toEqual([])
  expect(allNotes).toHaveLength(machines.length)
})
