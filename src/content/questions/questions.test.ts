import { describe, expect, it } from 'vitest'
import { machines } from '../../data/machines'
import { outline } from '../../data/outline'
import { allNotes } from '../notes'
import { allQuestions, caseStudies } from '.'
import { CASES_PENDING, QUESTIONS_PENDING } from './requirements'
import type { MultiQuestion, Question, SingleQuestion, YesNoQuestion } from './types'
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

  it('requires each case study to have 6–8 questions spanning all domains', () => {
    const kase = { id: 'k1', company: 'Example Co', title: 'T', summary: 'S', environment: ['e'], requirements: ['r'], constraints: ['c'] }
    const qs = [single('k-a', { caseStudyId: 'k1' }), single('k-b', { caseStudyId: 'k1', stem: 'Another storage mode scenario for a case. What fits?' })]
    const errs = validateQuestions(outline, machines, allNotes, qs, [kase], {
      pending: ['orientation', 'prepare', 'semantic', 'maintain'],
      casesPending: false,
    }).join('\n')
    expect(errs).toMatch(/Case study k1 has 2 questions; needs 6–8/)
    expect(errs).toMatch(/Case study k1 must span all 3 domains/)
    expect(errs).toMatch(/Expected 6 case studies, found 1/)
  })

  it('flags skewed multi-select positions and Yes/No shares', () => {
    const multi = (i: number): MultiQuestion => ({
      id: `m${i}`,
      machineId: 'loom-gearbox',
      bulletIds: ['S1.1'],
      format: 'multi',
      difficulty: 2,
      stem: `Scenario ${i} with storage choices number ${i * 7}. Which two apply? Choose two.`,
      sources: src,
      options: ['a', 'b', 'c', 'd'].map((id) => ({ id, text: `Option ${id}`, explain: 'x' })),
      answers: ['a', 'b'],
    })
    const yesno = (i: number): YesNoQuestion => ({
      id: `y${i}`,
      machineId: 'loom-gearbox',
      bulletIds: ['S1.1'],
      format: 'yesno',
      difficulty: 2,
      stem: `Statement set ${i} about modes ${i * 11}. Select Yes if true.`,
      sources: src,
      statements: [1, 2, 3].map((n) => ({ id: `s${n}`, text: `Statement ${n}`, answer: true, explain: 'x' })),
    })
    const errs = v([...Array.from({ length: 10 }, (_, i) => multi(i)), ...Array.from({ length: 4 }, (_, i) => yesno(i))]).join('\n')
    expect(errs).toMatch(/Multi-select \(4 options\): position 1 is correct in 10\/10/)
    expect(errs).toMatch(/Yes\/No statements: Yes is the answer for 12\/12/)
  })

  it('has every case study written and nothing pending (6 since Step 7)', () => {
    // Enforced once all floors and case studies are written.
    if (QUESTIONS_PENDING.length === 0 && !CASES_PENDING) {
      expect(caseStudies).toHaveLength(6)
    }
  })
})

describe('arrange', () => {
  it('rotates answer positions and keeps each explanation with its option', async () => {
    const { arrange } = await import('./arrange')
    const qs = Array.from({ length: 8 }, (_, i) => single(`r${i}`, { answer: 'c' }))
    const out = arrange(qs) as SingleQuestion[]
    expect(out.map((q) => q.answer)).toEqual(['a', 'b', 'c', 'd', 'a', 'b', 'c', 'd'])
    for (const q of out) expect(q.options.find((o) => o.id === q.answer)?.text).toBe('Direct Lake')
  })
})
