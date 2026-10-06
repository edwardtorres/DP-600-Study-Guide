import { describe, expect, it } from 'vitest'
import { allQuestions, caseStudies } from '../content/questions'
import type { Question } from '../content/questions/types'
import { outline } from '../data/outline'
import { importSave, exportSave } from '../save/storage'
import { newSave, type AnswerEntry, type MockRecord, type Save } from '../save/schema'
import {
  chooseCase,
  domainTargets,
  drawMock,
  finishMock,
  leaveCase,
  MOCK_MINUTES,
  MOCK_SIZE,
  readyToBook,
  remainingMs,
  scoreMock,
  setMockResponse,
  SHORT_MAIN,
  startMock,
  toggleMark,
} from './mock'
import { domainOf, domainWeights } from './progress'
import { emptyResponse, type Response } from './score'
import { mulberry32 } from './shuffle'

const byId = new Map(allQuestions.map((q) => [q.id, q]))
const now = new Date('2026-10-06T10:00:00Z')
const record = (over: Partial<MockRecord>): MockRecord => ({
  id: 'M',
  startedAt: now.toISOString(),
  finishedAt: now.toISOString(),
  durationMin: 100,
  caseStudyId: caseStudies[0]!.id,
  questionIds: [],
  correct: [],
  timedOut: false,
  ...over,
})

/** The keyed (correct) response for a question. */
function keyed(q: Question): Response {
  switch (q.format) {
    case 'single':
      return { format: 'single', choice: q.answer }
    case 'multi':
      return { format: 'multi', choices: q.answers }
    case 'yesno':
      return { format: 'yesno', answers: Object.fromEntries(q.statements.map((s) => [s.id, s.answer])) }
    case 'match':
      return { format: 'match', pairs: Object.fromEntries(q.pairs.map((p) => [p.promptId, p.choiceId])) }
    case 'order':
      return { format: 'order', order: q.answerOrder }
    case 'dropdown':
      return { format: 'dropdown', slots: Object.fromEntries(q.slots.map((s) => [s.id, s.answer])) }
  }
}

describe('mock draw', () => {
  it('picks a case study not used before, then the least recently used one', () => {
    expect(chooseCase(caseStudies, [])).toEqual({ caseStudyId: caseStudies[0]!.id, repeat: false })
    const used = caseStudies.slice(0, 5).map((c, i) => record({ caseStudyId: c.id, finishedAt: `2026-09-0${i + 1}T00:00:00Z` }))
    expect(chooseCase(caseStudies, used)).toEqual({ caseStudyId: caseStudies[5]!.id, repeat: false })
    const all = [...used, record({ caseStudyId: caseStudies[5]!.id, finishedAt: '2026-09-09T00:00:00Z' }), record({ caseStudyId: caseStudies[0]!.id, finishedAt: '2026-09-10T00:00:00Z' })]
    expect(chooseCase(caseStudies, all)).toEqual({ caseStudyId: caseStudies[1]!.id, repeat: true })
  })

  it('draws about 50 questions by the official domain weights, counting the case study', () => {
    const d = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers: [], outline, now, rand: mulberry32(4) })
    const ids = [...d.caseIds, ...d.mainIds]
    expect(ids).toHaveLength(MOCK_SIZE)
    expect(new Set(ids).size).toBe(MOCK_SIZE)
    expect(d.caseIds.every((id) => byId.get(id)!.caseStudyId === d.caseStudyId)).toBe(true)
    expect(d.mainIds.every((id) => !byId.get(id)!.caseStudyId)).toBe(true)
    const weights = domainWeights(outline)
    for (const dm of outline.domains) {
      const n = ids.filter((id) => domainOf(byId.get(id)!.bulletIds, outline) === dm.id).length
      expect(Math.abs(n - MOCK_SIZE * weights.get(dm.id)!), dm.id).toBeLessThanOrEqual(1)
    }
    // No orientation-only questions.
    expect(d.mainIds.every((id) => byId.get(id)!.bulletIds.length > 0)).toBe(true)
  })

  it('keeps the main section exactly the right size whatever the case covers', () => {
    for (const c of caseStudies) {
      const caseQs = allQuestions.filter((q) => q.caseStudyId === c.id)
      const t = domainTargets(MOCK_SIZE, caseQs, outline)
      expect([...t.values()].reduce((a, b) => a + b, 0)).toBe(MOCK_SIZE - caseQs.length)
    }
  })

  it('spreads each domain over its bullets', () => {
    const d = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers: [], outline, now, rand: mulberry32(9) })
    const bullets = new Set(d.mainIds.map((id) => byId.get(id)!.bulletIds[0]))
    expect(bullets.size).toBeGreaterThanOrEqual(30)
  })

  it('avoids the last mock’s questions', () => {
    const first = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers: [], outline, now, rand: mulberry32(1) })
    const last = record({ caseStudyId: first.caseStudyId, questionIds: [...first.caseIds, ...first.mainIds], correct: [...first.caseIds, ...first.mainIds].map(() => 1) })
    const second = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [last], answers: [], outline, now, rand: mulberry32(1) })
    expect(second.caseStudyId).not.toBe(first.caseStudyId)
    expect(second.mainIds.filter((id) => first.mainIds.includes(id))).toEqual([])
  })

  it('prefers questions not answered recently', () => {
    const recentlySeen = allQuestions.filter((q) => !q.caseStudyId && q.bulletIds.length > 0).map((q): AnswerEntry => [q.id, 1, Math.floor(now.getTime() / 1000) - 86400, 'i'])
    const keepFresh = new Set(allQuestions.filter((q) => q.bulletIds[0] === 'P2.4' && !q.caseStudyId).map((q) => q.id))
    const answers = recentlySeen.filter(([id]) => !keepFresh.has(id))
    const d = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers, outline, now, rand: mulberry32(5) })
    const fromP24 = d.mainIds.filter((id) => byId.get(id)!.bulletIds[0] === 'P2.4')
    expect(fromP24.length).toBeGreaterThan(0)
    expect(fromP24.every((id) => keepFresh.has(id))).toBe(true)
  })

  it('has a dev-only short mode with 6 main questions', () => {
    const d = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers: [], outline, now, rand: mulberry32(2), short: true })
    expect(d.mainIds).toHaveLength(SHORT_MAIN)
  })
})

describe('mock exam', () => {
  const draw = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers: [], outline, now, rand: mulberry32(6) })
  const started = startMock(newSave(now), draw, 42, now)

  it('keeps time from the stored start, across a save round-trip', () => {
    expect(started.activeMock!.durationMin).toBe(MOCK_MINUTES)
    expect(remainingMs(started.activeMock!, now)).toBe(100 * 60_000)
    const later = new Date(now.getTime() + 25 * 60_000)
    const reloaded = importSave(exportSave(started))
    if (!reloaded.ok) throw new Error('round-trip failed')
    expect(remainingMs(reloaded.save.activeMock!, later)).toBe(75 * 60_000)
    expect(remainingMs(started.activeMock!, new Date(now.getTime() + 200 * 60_000))).toBe(0)
  })

  it('locks the case study section once left', () => {
    const caseId = draw.caseIds[0]!
    const q = byId.get(caseId)!
    let s = setMockResponse(started, caseId, emptyResponse(q))
    expect(s.activeMock!.responses[caseId]).toBeDefined()
    s = leaveCase(s)
    const changed = setMockResponse(s, caseId, keyed(q))
    expect(changed.activeMock!.responses[caseId]).toEqual(emptyResponse(q))
    expect(toggleMark(s, caseId).activeMock!.marked).toEqual([])
    // Main-section questions still accept answers and marks.
    const mainId = draw.mainIds[0]!
    expect(setMockResponse(s, mainId, keyed(byId.get(mainId)!)).activeMock!.responses[mainId]).toBeDefined()
    expect(toggleMark(s, mainId).activeMock!.marked).toEqual([mainId])
  })

  it('scores full credit only, counts unanswered as wrong, logs m answers, and never certifies', () => {
    let s: Save = started
    const ids = [...draw.caseIds, ...draw.mainIds]
    // Answer every question correctly except the last two (one wrong, one unanswered).
    ids.slice(0, -2).forEach((id) => (s = setMockResponse(s, id, keyed(byId.get(id)!))))
    const wrongQ = byId.get(ids.at(-2)!)!
    s = setMockResponse(s, wrongQ.id, emptyResponse(wrongQ))
    const done = finishMock(s, byId, new Date(now.getTime() + 60 * 60_000))
    expect(done.activeMock).toBeUndefined()
    const rec = done.mocks[0]!
    expect(rec.questionIds).toEqual(ids)
    expect(rec.correct.slice(0, -2).every((c) => c === 1)).toBe(true)
    expect(rec.correct.slice(-2)).toEqual([0, 0])
    expect(done.answers.filter((a) => a[3] === 'm')).toHaveLength(ids.length)
    expect(done.machines).toEqual({})
    const score = scoreMock(rec, byId, outline)
    expect(score.overall).toEqual({ right: ids.length - 2, total: ids.length, pct: (ids.length - 2) / ids.length })
    expect([...score.byDomain.values()].reduce((a, t) => a + t.total, 0)).toBe(ids.length)
    expect(score.byBullet.size).toBeGreaterThan(20)
  })
})

describe('ready to book', () => {
  const draw = drawMock({ questions: allQuestions, cases: caseStudies, mocks: [], answers: [], outline, now, rand: mulberry32(8) })
  const ids = [...draw.caseIds, ...draw.mainIds]
  const mock = (pct: number, failDomain?: string): MockRecord => {
    const correct = ids.map((id, i): 0 | 1 => {
      if (failDomain && domainOf(byId.get(id)!.bulletIds, outline) === failDomain) return 0
      return i / ids.length < pct ? 1 : 0
    })
    return record({ questionIds: ids, correct })
  }

  it('needs two mocks in a row at 80% or more with every domain at 70% or more', () => {
    expect(readyToBook([mock(1)], byId, outline)).toBe(false)
    expect(readyToBook([mock(1), mock(1)], byId, outline)).toBe(true)
    expect(readyToBook([mock(1), mock(0.5)], byId, outline)).toBe(false)
    expect(readyToBook([mock(0.5), mock(1), mock(1)], byId, outline)).toBe(true)
    expect(readyToBook([mock(1), mock(1, 'MAINTAIN')], byId, outline)).toBe(false)
  })

  it('ignores short (dev) mocks', () => {
    expect(readyToBook([mock(1), { ...mock(1), short: true }], byId, outline)).toBe(false)
  })
})
