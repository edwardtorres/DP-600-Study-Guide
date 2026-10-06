import type { CaseStudy, Question } from '../content/questions/types'
import type { DomainId, Outline } from '../data/types'
import type { ActiveMock, AnswerEntry, MockRecord, Save } from '../save/schema'
import { domainOf, domainWeights } from './progress'
import { isCorrect, type Response } from './score'
import { shuffled } from './shuffle'

/**
 * Mock exam. Microsoft states 100 minutes for DP-600 and that most exams have
 * 40–60 questions (no DP-600 count is published), so a mock has about 50
 * questions in 100 minutes: one case study (its own section, which locks once
 * you leave it) plus questions drawn by the official domain weights.
 */
export const MOCK_MINUTES = 100
export const MOCK_SIZE = 50
/** Dev-only short mock (?mock=short): 6 main questions plus the case study, 10 minutes. */
export const SHORT_MAIN = 6
export const SHORT_MINUTES = 10
/** Questions answered in this many days count as "seen recently". */
export const RECENT_DAYS = 14
/**
 * A full mock counts toward "ready to book" only if at least this share of its
 * main-section questions weren't answered (in any attempt) in the RECENT_DAYS
 * days before it started.
 */
export const FRESH_MIN = 0.5
/** Ready to book: the two most recent counting mocks each at least this overall... */
export const READY_OVERALL = 0.8
/** ...and every domain at least this. */
export const READY_DOMAIN = 0.7

export interface MockDraw {
  caseStudyId: string
  /** True when every case study was used before, so the least recently used one is repeated. */
  repeatCase: boolean
  caseIds: string[]
  mainIds: string[]
}

/** The case study not used in any previous mock, or else the least recently used one. */
export function chooseCase(cases: CaseStudy[], mocks: MockRecord[]): { caseStudyId: string; repeat: boolean } {
  const lastUsed = new Map<string, string>()
  for (const m of mocks) {
    const prev = lastUsed.get(m.caseStudyId)
    if (!prev || m.finishedAt > prev) lastUsed.set(m.caseStudyId, m.finishedAt)
  }
  const unused = cases.find((c) => !lastUsed.has(c.id))
  if (unused) return { caseStudyId: unused.id, repeat: false }
  const oldest = [...cases].sort((a, b) => lastUsed.get(a.id)!.localeCompare(lastUsed.get(b.id)!))[0]!
  return { caseStudyId: oldest.id, repeat: true }
}

/** How many main-section questions each domain needs so the whole mock follows the official weights. */
export function domainTargets(total: number, caseQuestions: Question[], outline: Outline): Map<DomainId, number> {
  const weights = domainWeights(outline)
  const caseCount = new Map<DomainId, number>()
  for (const q of caseQuestions) {
    const d = domainOf(q.bulletIds, outline)
    if (d) caseCount.set(d, (caseCount.get(d) ?? 0) + 1)
  }
  const main = total - caseQuestions.length
  // Largest-remainder rounding of the ideal totals, then subtract what the case study already covers.
  const ideal = [...weights].map(([d, w]) => ({ d, x: total * w }))
  const base = ideal.map(({ d, x }) => ({ d, n: Math.floor(x), r: x - Math.floor(x) }))
  let left = total - base.reduce((a, b) => a + b.n, 0)
  for (const b of [...base].sort((a, b) => b.r - a.r)) {
    if (left <= 0) break
    b.n++
    left--
  }
  const need = new Map(base.map(({ d, n }) => [d, Math.max(0, n - (caseCount.get(d) ?? 0))]))
  // Keep the main section exactly `main` long.
  let diff = main - [...need.values()].reduce((a, b) => a + b, 0)
  const order = [...weights].sort((a, b) => b[1] - a[1]).map(([d]) => d)
  for (let i = 0; diff !== 0; i++) {
    const d = order[i % order.length]!
    const n = need.get(d)!
    if (diff > 0) {
      need.set(d, n + 1)
      diff--
    } else if (n > 0) {
      need.set(d, n - 1)
      diff++
    }
  }
  return need
}

/**
 * Draws a mock: an unseen case study, then main-section questions by domain
 * weight, spread over each domain's bullets. It avoids the last mock's
 * questions and prefers questions not answered in the last RECENT_DAYS days,
 * then the least recently answered. Orientation-only questions are never drawn.
 */
export function drawMock(input: {
  questions: Question[]
  cases: CaseStudy[]
  mocks: MockRecord[]
  answers: AnswerEntry[]
  outline: Outline
  now?: Date
  rand?: () => number
  short?: boolean
}): MockDraw {
  const { questions, cases, mocks, answers, outline } = input
  const now = input.now ?? new Date()
  const rand = input.rand ?? Math.random
  const { caseStudyId, repeat } = chooseCase(cases, mocks)
  const caseQs = questions.filter((q) => q.caseStudyId === caseStudyId)
  const total = (input.short ? SHORT_MAIN : MOCK_SIZE - caseQs.length) + caseQs.length
  const targets = domainTargets(total, caseQs, outline)

  const lastMock = new Set(mocks.at(-1)?.questionIds ?? [])
  const lastSeen = new Map<string, number>()
  for (const [id, , at] of answers) lastSeen.set(id, Math.max(lastSeen.get(id) ?? 0, at))
  const recentCut = now.getTime() / 1000 - RECENT_DAYS * 86400
  const score = (q: Question) => {
    const seen = lastSeen.get(q.id)
    if (seen === undefined) return 0
    return seen < recentCut ? 1 + seen / 1e10 : 3 + seen / 1e10
  }

  const mainIds: string[] = []
  for (const [domain, n] of targets) {
    const inDomain = questions.filter((q) => !q.caseStudyId && q.bulletIds.length > 0 && domainOf(q.bulletIds, outline) === domain)
    // Avoid the last mock's questions unless the domain would run short.
    const fresh = inDomain.filter((q) => !lastMock.has(q.id))
    const pool = fresh.length >= n ? fresh : inDomain
    const ranked = shuffled(pool, rand).sort((a, b) => score(a) - score(b))
    const byBullet = new Map<string, Question[]>()
    for (const q of ranked) {
      const b = q.bulletIds[0]!
      byBullet.set(b, [...(byBullet.get(b) ?? []), q])
    }
    // Round-robin over bullets, best-ranked bullet first, so the domain is covered broadly.
    const lists = [...byBullet.values()].sort((a, b) => score(a[0]!) - score(b[0]!))
    const picked: Question[] = []
    for (let round = 0; picked.length < n && lists.some((l) => l.length > round); round++) {
      for (const l of lists) {
        if (picked.length >= n) break
        const q = l[round]
        if (q) picked.push(q)
      }
    }
    mainIds.push(...picked.map((q) => q.id))
  }
  return { caseStudyId, repeatCase: repeat, caseIds: caseQs.map((q) => q.id), mainIds: shuffled(mainIds, rand) }
}

/**
 * Share (0–1) of `mainIds` not answered in any question attempt (every code but
 * puzzles) in the RECENT_DAYS days before `startedAt`. An empty section is fully fresh.
 */
export function mockFreshness(mainIds: readonly string[], answers: readonly AnswerEntry[], startedAt: string): number {
  if (mainIds.length === 0) return 1
  const start = Date.parse(startedAt) / 1000
  const from = start - RECENT_DAYS * 86400
  const seen = new Set<string>()
  for (const [id, , t, code] of answers) if (code !== 'z' && t >= from && t < start) seen.add(id)
  return mainIds.filter((id) => !seen.has(id)).length / mainIds.length
}

export function startMock(save: Save, draw: MockDraw, seed: number, now: Date = new Date(), short = false): Save {
  const active: ActiveMock = {
    id: `M${now.getTime().toString(36)}`,
    startedAt: now.toISOString(),
    durationMin: short ? SHORT_MINUTES : MOCK_MINUTES,
    caseStudyId: draw.caseStudyId,
    caseIds: draw.caseIds,
    mainIds: draw.mainIds,
    seed,
    responses: {},
    marked: [],
    caseLocked: false,
    ...(short ? { short: true as const } : {}),
    freshness: mockFreshness(draw.mainIds, save.answers, now.toISOString()),
  }
  return { ...save, updatedAt: now.toISOString(), activeMock: active }
}

/** Milliseconds left, from the stored start time (so a reload doesn't reset the clock). Never negative. */
export function remainingMs(active: Pick<ActiveMock, 'startedAt' | 'durationMin'>, now: Date = new Date()): number {
  return Math.max(0, Date.parse(active.startedAt) + active.durationMin * 60_000 - now.getTime())
}

export function isCaseQuestion(active: ActiveMock, questionId: string): boolean {
  return active.caseIds.includes(questionId)
}

/** Saves a response. Once the case study is left, its questions can't be changed. */
export function setMockResponse(save: Save, questionId: string, response: Response, now: Date = new Date()): Save {
  const a = save.activeMock
  if (!a) return save
  if (a.caseLocked && isCaseQuestion(a, questionId)) return save
  if (!a.caseIds.includes(questionId) && !a.mainIds.includes(questionId)) return save
  return { ...save, updatedAt: now.toISOString(), activeMock: { ...a, responses: { ...a.responses, [questionId]: response } } }
}

export function toggleMark(save: Save, questionId: string): Save {
  const a = save.activeMock
  if (!a || (a.caseLocked && isCaseQuestion(a, questionId))) return save
  const marked = a.marked.includes(questionId) ? a.marked.filter((m) => m !== questionId) : [...a.marked, questionId]
  return { ...save, activeMock: { ...a, marked } }
}

/** Leaving the case study locks it for the rest of the mock, as on Microsoft exams. */
export function leaveCase(save: Save): Save {
  const a = save.activeMock
  return a ? { ...save, activeMock: { ...a, caseLocked: true } } : save
}

/**
 * Ends the mock: scores every question (full credit only; unanswered counts
 * wrong), logs one 'm' answer per question, stores the record, and clears the
 * mock in progress. Never touches machine progress.
 */
export function finishMock(save: Save, questionsById: Map<string, Question>, now: Date = new Date(), timedOut = false): Save {
  const a = save.activeMock
  if (!a) return save
  const ids = [...a.caseIds, ...a.mainIds]
  const correct = ids.map((id): 0 | 1 => {
    const q = questionsById.get(id)
    const r = a.responses[id] as Response | undefined
    return q && r && isCorrect(q, r) ? 1 : 0
  })
  const finishedAt = now.toISOString()
  const t = Math.floor(now.getTime() / 1000)
  const record: MockRecord = {
    id: a.id,
    startedAt: a.startedAt,
    finishedAt,
    durationMin: a.durationMin,
    caseStudyId: a.caseStudyId,
    questionIds: ids,
    correct,
    timedOut,
    responses: a.responses,
    seed: a.seed,
    ...(a.short ? { short: true as const } : {}),
    freshness: a.freshness,
  }
  const { activeMock: _done, ...rest } = save
  return {
    ...rest,
    updatedAt: finishedAt,
    mocks: [...save.mocks, record],
    answers: [...save.answers, ...ids.map((id, i): AnswerEntry => [id, correct[i]!, t, 'm'])],
  }
}

export interface Tally {
  right: number
  total: number
  /** 0–1. */
  pct: number
}

export interface MockScore {
  overall: Tally
  byDomain: Map<DomainId, Tally>
  byBullet: Map<string, Tally>
}

const tally = (right: number, total: number): Tally => ({ right, total, pct: total ? right / total : 0 })

/** Raw percentages overall, per domain, and per bullet. */
export function scoreMock(record: MockRecord, questionsById: Map<string, Pick<Question, 'bulletIds'>>, outline: Outline): MockScore {
  const dom = new Map<DomainId, [number, number]>()
  const bul = new Map<string, [number, number]>()
  record.questionIds.forEach((id, i) => {
    const q = questionsById.get(id)
    const c = record.correct[i]!
    const d = q ? domainOf(q.bulletIds, outline) : null
    if (d) {
      const [r, t] = dom.get(d) ?? [0, 0]
      dom.set(d, [r + c, t + 1])
    }
    for (const b of q?.bulletIds ?? []) {
      const [r, t] = bul.get(b) ?? [0, 0]
      bul.set(b, [r + c, t + 1])
    }
  })
  const right = record.correct.reduce<number>((a, c) => a + c, 0)
  return {
    overall: tally(right, record.correct.length),
    byDomain: new Map([...dom].map(([d, [r, t]]) => [d, tally(r, t)])),
    byBullet: new Map([...bul].map(([b, [r, t]]) => [b, tally(r, t)])),
  }
}

/**
 * Ready to book: the two most recent full mocks each scored at least 80%
 * overall with every domain at least 70%. Short (dev) mocks don't count. This
 * is a raw-percentage signal; Microsoft's 700 is a scaled score, so the mock
 * can't predict it exactly.
 */
export interface ReadyStatus {
  ready: boolean
  /** Full mocks that don't count because too few of their questions were fresh, newest first. */
  stale: { id: string; finishedAt: string; freshness: number; reason: string }[]
  /** The full mocks the rule looked at (the two most recent that count), newest first. */
  counted: string[]
}

/**
 * Ready to book: the two most recent full mocks that count (freshness at least
 * FRESH_MIN) each score at least READY_OVERALL overall with every domain at
 * least READY_DOMAIN. A stale mock is skipped: it neither counts nor breaks the run.
 * Short (dev) mocks never count.
 */
export function readyStatus(mocks: MockRecord[], questionsById: Map<string, Pick<Question, 'bulletIds'>>, outline: Outline): ReadyStatus {
  const full = mocks.filter((m) => !m.short)
  const stale = full
    .filter((m) => m.freshness < FRESH_MIN)
    .reverse()
    .map((m) => ({
      id: m.id,
      finishedAt: m.finishedAt,
      freshness: m.freshness,
      reason: `only ${Math.round(m.freshness * 100)}% of its main-section questions were fresh (not answered in the ${RECENT_DAYS} days before it); a mock needs ${Math.round(FRESH_MIN * 100)}% to count`,
    }))
  const counting = full.filter((m) => m.freshness >= FRESH_MIN).slice(-2)
  const ready =
    counting.length === 2 &&
    counting.every((m) => {
      const s = scoreMock(m, questionsById, outline)
      return s.overall.pct >= READY_OVERALL && outline.domains.every((d) => (s.byDomain.get(d.id)?.pct ?? 0) >= READY_DOMAIN)
    })
  return { ready, stale, counted: counting.map((m) => m.id).reverse() }
}

export function readyToBook(mocks: MockRecord[], questionsById: Map<string, Pick<Question, 'bulletIds'>>, outline: Outline): boolean {
  return readyStatus(mocks, questionsById, outline).ready
}
