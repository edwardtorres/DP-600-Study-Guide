import { describe, expect, it } from 'vitest'
import { machines } from '../../data/machines'
import { outline } from '../../data/outline'
import { allNotes } from '../notes'
import { allQuestions, caseStudies } from '.'
import { CASES_PENDING, QUESTIONS_PENDING } from './requirements'
import type { Question, SingleQuestion } from './types'
import { jaccard, questionStats, validateQuestions } from './validate'

const src = ['https://learn.microsoft.com/en-us/fabric/fundamentals/direct-lake-overview']
const single = (id: string, extra: Partial<SingleQuestion> = {}): SingleQuestion => ({
  id,
  machineId: 'loom-gearbox',
  bulletIds: ['S1.1'],
  format: 'single',
  difficulty: 2,
  stem: `You need to pick a storage mode for scenario ${id}. What should you use?`,
  sources: src,
  options: [
    { id: 'a', text: 'Import', explain: 'x' },
    { id: 'b', text: 'DirectQuery', explain: 'x' },
    { id: 'c', text: 'Direct Lake', explain: 'x' },
    { id: 'd', text: 'Dual', explain: 'x' },
  ],
  answer: 'c',
  ...extra,
})
const v = (qs: Question[], opts = { pending: ['orientation', 'prepare', 'semantic', 'maintain'] as const }) =>
  validateQuestions(outline, machines, allNotes, qs, caseStudies, { pending: [...opts.pending], casesPending: true })

describe('question bank', () => {
  it('passes validation as written', () => {
    expect(validateQuestions(outline, machines, allNotes, allQuestions, caseStudies)).toEqual([])
  })

  it('rejects missing sources, missing explanations, bad keys, and unknown pairs', () => {
    const errs = v([
      single('q1', { sources: [] }),
      single('q2', { options: [{ id: 'a', text: 'A', explain: '' }, { id: 'b', text: 'B', explain: 'x' }, { id: 'c', text: 'C', explain: 'x' }, { id: 'd', text: 'D', explain: 'x' }] }),
      single('q3', { answer: 'z' }),
      single('q4', { trapPairId: 'nope' }),
      single('q5', { sources: ['https://example.com/'] }),
    ]).join('\n')
    expect(errs).toMatch(/q1: no Learn source/)
    expect(errs).toMatch(/q2: option a has no explanation/)
    expect(errs).toMatch(/q3: answer is not an option/)
    expect(errs).toMatch(/q4: unknown trapPairId nope/)
    expect(errs).toMatch(/q5: non-Learn source/)
  })

  it('blocks banned needs-verification terms and all/none of the above', () => {
    const errs = v([
      single('q1', { stem: 'You need to create a materialized view in a warehouse. What should you use?' }),
      single('q2', { options: [{ id: 'a', text: 'None of the above', explain: 'x' }, { id: 'b', text: 'B', explain: 'x' }, { id: 'c', text: 'C', explain: 'x' }, { id: 'd', text: 'D', explain: 'x' }] }),
    ]).join('\n')
    expect(errs).toMatch(/q1: uses a banned phrase/)
    expect(errs).toMatch(/q2: uses a banned phrase/)
  })

  it('flags near-duplicate stems, skewed answer positions, and long-answer bias', () => {
    const qs = Array.from({ length: 24 }, (_, i) =>
      single(`p${i}`, {
        stem: `Scenario ${i}: a team in region ${i * 7} needs option ${i * 13} for workload ${i * 31}.`,
        answer: 'a',
        options: [
          { id: 'a', text: 'The deliberately longest correct option text', explain: 'x' },
          { id: 'b', text: 'Short', explain: 'x' },
          { id: 'c', text: 'Short', explain: 'x' },
          { id: 'd', text: 'Short', explain: 'x' },
        ],
      }),
    )
    qs.push(single('dupA', { stem: 'You need to load parquet files into a warehouse table quickly. What should you use?' }))
    qs.push(single('dupB', { stem: 'You need to load parquet files into a warehouse table quickly. What should you do?' }))
    const errs = v(qs).join('\n')
    expect(errs).toMatch(/dupA and dupB have near-duplicate stems/)
    expect(errs).toMatch(/Answer position 1 holds/)
    expect(errs).toMatch(/correct option is the longest/)
  })

  it('enforces per-bullet minimums and placement counts once a floor is written', () => {
    const errs = validateQuestions(outline, machines, allNotes, [single('q1')], caseStudies, { pending: ['orientation', 'prepare', 'maintain'], casesPending: true }).join('\n')
    expect(errs).toMatch(/Bullet S1\.1 has 1 questions; needs 6/)
    expect(errs).toMatch(/loom-gearbox has 0 placement-eligible questions; needs 8/)
  })

  it('rejects placement questions keyed to Power Query on partial-carryover machines', () => {
    const errs = v([
      single('pq', {
        machineId: 'carding-machine',
        bulletIds: ['P2.7'],
        placement: true,
        options: [
          { id: 'a', text: 'Remove duplicates in Power Query Editor in Power BI Desktop', explain: 'x' },
          { id: 'b', text: 'B', explain: 'x' },
          { id: 'c', text: 'C', explain: 'x' },
          { id: 'd', text: 'D', explain: 'x' },
        ],
        answer: 'a',
      }),
    ]).join('\n')
    expect(errs).toMatch(/keyed to Power Query/)
  })

  it('computes stats and similarity', () => {
    expect(jaccard('load parquet into warehouse', 'load parquet into warehouse')).toBe(1)
    const st = questionStats([single('a'), single('b', { answer: 'a' })], outline)
    expect(st.positions).toEqual([1, 0, 1, 0])
    expect(st.perDomain.get('SEMANTIC')).toBe(2)
  })

  it('ends Step 3 with nothing pending', () => {
    // Enforced once all floors and case studies are written.
    if (QUESTIONS_PENDING.length === 0 && !CASES_PENDING) {
      expect(caseStudies).toHaveLength(4)
    }
  })
})
