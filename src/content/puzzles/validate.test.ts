import { describe, expect, it } from 'vitest'
import { machines } from '../../data/machines'
import { outline } from '../../data/outline'
import { staticPuzzle } from '../../puzzles/build'
import type { Decision, PuzzleMeta } from '../../puzzles/types'
import { allQuestions } from '../questions'
import { allPuzzles, oracleTemplates } from '.'
import { validatePuzzles } from './validate'

const L = 'https://learn.microsoft.com/en-us/fabric/fundamentals/roles-workspaces'
const decision = (over: Partial<Decision> = {}): Decision => ({
  id: 'd1',
  prompt: 'Pick one',
  ui: 'buttons',
  choices: [
    { id: 'a', label: 'A', explain: 'Because.' },
    { id: 'b', label: 'B', explain: 'Because not.' },
  ],
  accepted: ['a'],
  explain: 'Because.',
  sources: [L],
  ...over,
})
const meta = (over: Partial<PuzzleMeta> = {}): PuzzleMeta => ({ id: 'ZZ-01', type: 'access', title: 'Test', machineIds: ['gate-keys'], bulletIds: ['M1.1'], difficulty: 1, sources: [L], ...over })
const check = (m: PuzzleMeta, d: Decision = decision(), intro = 'A scenario.') =>
  validatePuzzles(outline, machines, [...allPuzzles, staticPuzzle(m, intro, { kind: 'facts', facts: [] }, [d])], oracleTemplates, allQuestions.map((q) => q.id)).filter((e) => e.includes('ZZ-01'))

describe('puzzle content check', () => {
  it('passes on the real puzzles', () => {
    expect(validatePuzzles(outline, machines, allPuzzles, oracleTemplates, allQuestions.map((q) => q.id))).toEqual([])
  })
  it('accepts a well-formed puzzle', () => {
    expect(check(meta())).toEqual([])
  })
  it('rejects bad links, sources, domains, banned terms, and keys', () => {
    expect(check(meta({ machineIds: ['nope'] }))).toEqual(expect.arrayContaining([expect.stringContaining('unknown machine')]))
    expect(check(meta({ bulletIds: ['M1.2'] }))).toEqual(expect.arrayContaining([expect.stringContaining('isn’t on its machines')]))
    expect(check(meta({ machineIds: ['gate-keys', 'dax-scale'], bulletIds: ['M1.1', 'P3.4'] }))).toEqual(expect.arrayContaining([expect.stringContaining('one domain')]))
    expect(check(meta({ sources: ['https://example.com/x'] }))).toEqual(expect.arrayContaining([expect.stringContaining('learn.microsoft.com')]))
    expect(check(meta({ trapPairId: 'nope' }))).toEqual(expect.arrayContaining([expect.stringContaining('unknown trap pair')]))
    expect(check(meta(), decision(), 'Pick all of the above.')).toEqual(expect.arrayContaining([expect.stringContaining('banned phrase')]))
    expect(check(meta(), decision({ accepted: ['z'] }))).toEqual(expect.arrayContaining([expect.stringContaining('isn’t a choice')]))
    expect(check(meta(), decision({ sources: [] }))).toEqual(expect.arrayContaining([expect.stringContaining('no sources')]))
    expect(check(meta({ id: 'ZZ-01' }), decision({ choices: [{ id: 'a', label: 'A', explain: '' }, { id: 'b', label: 'B', explain: 'x' }] }))).toEqual(
      expect.arrayContaining([expect.stringContaining('no explanation')]),
    )
  })
  it('rejects an id that collides with a question id', () => {
    const errors = validatePuzzles(outline, machines, [staticPuzzle(meta({ id: allQuestions[0]!.id }), 'x', { kind: 'facts', facts: [] }, [decision()])], [], allQuestions.map((q) => q.id))
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('collides')]))
  })
  it('enforces the minimum counts', () => {
    const errors = validatePuzzles(outline, machines, [], [], [])
    expect(errors).toEqual(expect.arrayContaining([expect.stringContaining('Query Oracle tsql'), expect.stringContaining('pattern'), expect.stringContaining('Gearbox storage'), expect.stringContaining('Ripple & Conveyor')]))
  })
})
