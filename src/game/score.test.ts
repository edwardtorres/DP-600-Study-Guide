import { describe, expect, it } from 'vitest'
import type { Question } from '../content/questions/types'
import { emptyResponse, isComplete, isCorrect } from './score'

const base = { machineId: 'm', bulletIds: [], difficulty: 2 as const, stem: 's', sources: [] }
const opt = (id: string) => ({ id, text: id, explain: 'x' })

const single: Question = { ...base, id: 's', format: 'single', options: ['a', 'b', 'c', 'd'].map(opt), answer: 'c' }
const multi: Question = { ...base, id: 'm', format: 'multi', options: ['a', 'b', 'c', 'd'].map(opt), answers: ['b', 'd'] }
const yesno: Question = {
  ...base,
  id: 'y',
  format: 'yesno',
  statements: [
    { id: 's1', text: '', answer: true, explain: '' },
    { id: 's2', text: '', answer: false, explain: '' },
    { id: 's3', text: '', answer: true, explain: '' },
  ],
}
const match: Question = {
  ...base,
  id: 'x',
  format: 'match',
  prompts: [{ id: 'p1', text: '' }, { id: 'p2', text: '' }, { id: 'p3', text: '' }],
  choices: [{ id: 'c1', text: '' }, { id: 'c2', text: '' }, { id: 'c3', text: '' }],
  pairs: [
    { promptId: 'p1', choiceId: 'c2', explain: '' },
    { promptId: 'p2', choiceId: 'c1', explain: '' },
    { promptId: 'p3', choiceId: 'c3', explain: '' },
  ],
}
const order: Question = { ...base, id: 'o', format: 'order', items: ['i2', 'i1', 'i3'].map(opt), answerOrder: ['i1', 'i2', 'i3'] }
const dropdown: Question = {
  ...base,
  id: 'd',
  format: 'dropdown',
  language: 'tsql',
  code: '[[1]] [[2]]',
  slots: [
    { id: '1', options: ['a', 'b', 'c'].map(opt), answer: 'a' },
    { id: '2', options: ['a', 'b', 'c'].map(opt), answer: 'c' },
  ],
}

describe('full-credit scoring', () => {
  it('single choice', () => {
    expect(isCorrect(single, { format: 'single', choice: 'c' })).toBe(true)
    expect(isCorrect(single, { format: 'single', choice: 'a' })).toBe(false)
    expect(isCorrect(single, { format: 'single', choice: null })).toBe(false)
  })

  it('multi-select needs exactly both picks', () => {
    expect(isCorrect(multi, { format: 'multi', choices: ['d', 'b'] })).toBe(true)
    expect(isCorrect(multi, { format: 'multi', choices: ['b'] })).toBe(false)
    expect(isCorrect(multi, { format: 'multi', choices: ['b', 'c'] })).toBe(false)
    expect(isCorrect(multi, { format: 'multi', choices: ['b', 'd', 'a'] })).toBe(false)
  })

  it('Yes/No needs every statement', () => {
    expect(isCorrect(yesno, { format: 'yesno', answers: { s1: true, s2: false, s3: true } })).toBe(true)
    expect(isCorrect(yesno, { format: 'yesno', answers: { s1: true, s2: false, s3: false } })).toBe(false)
    expect(isCorrect(yesno, { format: 'yesno', answers: { s1: true, s2: false } })).toBe(false)
  })

  it('matching needs every pair', () => {
    expect(isCorrect(match, { format: 'match', pairs: { p1: 'c2', p2: 'c1', p3: 'c3' } })).toBe(true)
    expect(isCorrect(match, { format: 'match', pairs: { p1: 'c2', p2: 'c3', p3: 'c1' } })).toBe(false)
  })

  it('ordering needs the whole sequence', () => {
    expect(isCorrect(order, { format: 'order', order: ['i1', 'i2', 'i3'] })).toBe(true)
    expect(isCorrect(order, { format: 'order', order: ['i1', 'i3', 'i2'] })).toBe(false)
  })

  it('drop-down needs every slot', () => {
    expect(isCorrect(dropdown, { format: 'dropdown', slots: { 1: 'a', 2: 'c' } })).toBe(true)
    expect(isCorrect(dropdown, { format: 'dropdown', slots: { 1: 'a', 2: 'b' } })).toBe(false)
  })

  it('a response for another format is never correct', () => {
    expect(isCorrect(single, { format: 'multi', choices: ['c'] })).toBe(false)
  })

  it('knows when a response is complete', () => {
    expect(isComplete(single, emptyResponse(single))).toBe(false)
    expect(isComplete(multi, { format: 'multi', choices: ['a'] })).toBe(false)
    expect(isComplete(multi, { format: 'multi', choices: ['a', 'b'] })).toBe(true)
    expect(isComplete(order, emptyResponse(order))).toBe(true)
    expect(isComplete(match, { format: 'match', pairs: { p1: 'c1', p2: 'c2' } })).toBe(false)
  })
})
