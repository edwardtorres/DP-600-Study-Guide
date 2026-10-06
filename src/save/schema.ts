export const SAVE_VERSION = 5
export const SAVE_KEY = 'fabric-mill:save'
export const BACKUP_KEY = 'fabric-mill:save:corrupt-backup'

export interface Certification {
  passedAt: string
  /** Fraction correct, 0–1. */
  score: number
  kind: 'inspection' | 'placement'
}

/**
 * Which kind of attempt an answer came from: start-up check, inspection,
 * placement, puzzle, lab debrief, daily review, or mock exam.
 */
export type AttemptCode = 's' | 'i' | 'p' | 'z' | 'l' | 'r' | 'm'
export const ATTEMPT_CODES: readonly AttemptCode[] = ['s', 'i', 'p', 'z', 'l', 'r', 'm']

/** Longest problem note kept per lab step. */
export const MAX_PROBLEM_NOTE = 2000

/** Self-reported progress on one hands-on lab. Notes stay in localStorage and the save export only. */
export interface LabProgress {
  /** Steps ticked as done, by step id. */
  steps: Record<string, true>
  /** Problem notes ("this step didn't match what I saw"), by step id. */
  problems: Record<string, string>
  /** When the lab was marked complete. */
  completedAt?: string
}
export type AttemptKind = 'startup' | 'inspection' | 'placement'
export const attemptCode: Record<AttemptKind, AttemptCode> = { startup: 's', inspection: 'i', placement: 'p' }

/**
 * One answered question (or one puzzle play, code 'z'), kept compact for spaced
 * repetition: [questionId or puzzleId, correct, unix seconds, attempt].
 */
export type AnswerEntry = [questionId: string, correct: 0 | 1, at: number, attempt: AttemptCode]

export interface MachineProgress {
  /** First time the machine's notes were opened (required before the start-up check). */
  notesOpenedAt?: string
  startedAt?: string
  certification?: Certification
  /** Question ids drawn in the previous attempt of each kind, to avoid repeats. */
  lastDraw?: Partial<Record<AttemptKind, string[]>>
  /** Local calendar days (YYYY-MM-DD) on which a placement check was attempted. */
  placementDays?: string[]
  /** Question ids of a placement check that was started but not yet submitted. */
  placementOpen?: string[]
  /** Local calendar days (YYYY-MM-DD) of failed inspections, one entry per failure (recent days only). */
  inspectionFails?: string[]
}

export interface SaveV1 {
  version: 1
  createdAt: string
  updatedAt: string
  machines: Record<string, { startedAt?: string; certification?: Certification }>
  settings: Record<string, never>
}

export interface SaveV2 {
  version: 2
  createdAt: string
  updatedAt: string
  machines: Record<string, Omit<MachineProgress, 'inspectionFails'>>
  answers: [string, 0 | 1, number, 's' | 'i' | 'p'][]
  settings: Record<string, never>
}

export interface SaveV3 {
  version: 3
  createdAt: string
  updatedAt: string
  machines: Record<string, MachineProgress>
  answers: [string, 0 | 1, number, 's' | 'i' | 'p' | 'z'][]
  settings: Record<string, never>
}

export interface SaveV4 {
  version: 4
  createdAt: string
  updatedAt: string
  machines: Record<string, MachineProgress>
  answers: [string, 0 | 1, number, 's' | 'i' | 'p' | 'z' | 'l'][]
  /** Hands-on lab progress, by lab id. */
  labs: Record<string, LabProgress>
  /** Local day (YYYY-MM-DD) the Fabric trial started, entered by the player. */
  trialStart?: string
  settings: Record<string, never>
}

/** A finished mock exam. Question ids are stored in exam order (case study first). */
export interface MockRecord {
  id: string
  startedAt: string
  finishedAt: string
  durationMin: number
  caseStudyId: string
  questionIds: string[]
  correct: (0 | 1)[]
  /** True when time ran out and the mock was submitted automatically. */
  timedOut: boolean
  /** Dev-only short mock (?mock=short). */
  short?: true
}

/** A mock exam in progress. Kept in the save so the timer and answers survive a reload. */
export interface ActiveMock {
  id: string
  startedAt: string
  durationMin: number
  caseStudyId: string
  caseIds: string[]
  mainIds: string[]
  /** Seed for option shuffles, so a reload shows the same order. */
  seed: number
  /** Responses by question id (the shapes in src/game/score.ts). */
  responses: Record<string, unknown>
  marked: string[]
  /** Set once the player leaves the case study section; it can't be reopened. */
  caseLocked: boolean
  short?: true
}

export interface SaveV5 {
  version: 5
  createdAt: string
  updatedAt: string
  machines: Record<string, MachineProgress>
  answers: AnswerEntry[]
  labs: Record<string, LabProgress>
  trialStart?: string
  /** Finished mock exams, oldest first. */
  mocks: MockRecord[]
  activeMock?: ActiveMock
  settings: Record<string, never>
}

export type Save = SaveV5

export function newSave(now: Date = new Date()): Save {
  const iso = now.toISOString()
  return { version: SAVE_VERSION, createdAt: iso, updatedAt: iso, machines: {}, answers: [], labs: {}, mocks: [], settings: {} }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))
const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string')
const isDayKey = (v: unknown): v is string => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)

function isCertification(v: unknown): v is Certification {
  return (
    isObject(v) &&
    isIsoDate(v.passedAt) &&
    typeof v.score === 'number' &&
    v.score >= 0 &&
    v.score <= 1 &&
    (v.kind === 'inspection' || v.kind === 'placement')
  )
}

/** Structural check for version-1 saves (used by tests and migration fixtures). */
export function isSaveV1(v: unknown): v is SaveV1 {
  if (!isObject(v) || v.version !== 1) return false
  if (!isIsoDate(v.createdAt) || !isIsoDate(v.updatedAt)) return false
  if (!isObject(v.settings) || !isObject(v.machines)) return false
  return Object.values(v.machines).every(
    (p) =>
      isObject(p) &&
      (p.startedAt === undefined || isIsoDate(p.startedAt)) &&
      (p.certification === undefined || isCertification(p.certification)),
  )
}

function isMachineProgress(p: unknown): p is MachineProgress {
  if (!isObject(p)) return false
  if (p.notesOpenedAt !== undefined && !isIsoDate(p.notesOpenedAt)) return false
  if (p.startedAt !== undefined && !isIsoDate(p.startedAt)) return false
  if (p.certification !== undefined && !isCertification(p.certification)) return false
  if (p.lastDraw !== undefined) {
    if (!isObject(p.lastDraw)) return false
    for (const [k, ids] of Object.entries(p.lastDraw)) {
      if (!['startup', 'inspection', 'placement'].includes(k) || !isStringArray(ids)) return false
    }
  }
  if (p.placementDays !== undefined && !(Array.isArray(p.placementDays) && p.placementDays.every(isDayKey))) return false
  if (p.placementOpen !== undefined && !isStringArray(p.placementOpen)) return false
  if (p.inspectionFails !== undefined && !(Array.isArray(p.inspectionFails) && p.inspectionFails.every(isDayKey))) return false
  return true
}

function isAnswerEntry(a: unknown): a is AnswerEntry {
  return (
    Array.isArray(a) &&
    a.length === 4 &&
    typeof a[0] === 'string' &&
    (a[1] === 0 || a[1] === 1) &&
    typeof a[2] === 'number' &&
    Number.isFinite(a[2]) &&
    ATTEMPT_CODES.includes(a[3])
  )
}

function hasSaveShell(v: unknown, version: number): v is Record<string, unknown> & { machines: Record<string, unknown>; answers: unknown[] } {
  return (
    isObject(v) &&
    v.version === version &&
    isIsoDate(v.createdAt) &&
    isIsoDate(v.updatedAt) &&
    isObject(v.settings) &&
    isObject(v.machines) &&
    Array.isArray(v.answers)
  )
}

/** Structural check for version-2 saves (used by tests and migration fixtures). */
export function isSaveV2(v: unknown): v is SaveV2 {
  if (!hasSaveShell(v, 2)) return false
  return (
    Object.values(v.machines).every((p) => isMachineProgress(p) && p.inspectionFails === undefined) &&
    v.answers.every((a) => isAnswerEntry(a) && ['s', 'i', 'p'].includes(a[3]))
  )
}

/** Structural check for version-3 saves (used by tests and migration fixtures). */
export function isSaveV3(v: unknown): v is SaveV3 {
  if (!hasSaveShell(v, 3)) return false
  return Object.values(v.machines).every(isMachineProgress) && v.answers.every((a) => isAnswerEntry(a) && !['l', 'r', 'm'].includes(a[3]))
}

function isLabProgress(v: unknown): v is LabProgress {
  if (!isObject(v) || !isObject(v.steps) || !isObject(v.problems)) return false
  if (!Object.values(v.steps).every((x) => x === true)) return false
  if (!Object.values(v.problems).every((x) => typeof x === 'string' && x.length <= MAX_PROBLEM_NOTE)) return false
  return v.completedAt === undefined || isIsoDate(v.completedAt)
}

/** Structural check for version-4 saves (used by tests and migration fixtures). */
export function isSaveV4(v: unknown): v is SaveV4 {
  if (!hasSaveShell(v, 4)) return false
  if (!isObject(v.labs) || !Object.values(v.labs).every(isLabProgress)) return false
  if (v.trialStart !== undefined && !isDayKey(v.trialStart)) return false
  return Object.values(v.machines).every(isMachineProgress) && v.answers.every((a) => isAnswerEntry(a) && a[3] !== 'r' && a[3] !== 'm')
}

function isMockRecord(v: unknown): v is MockRecord {
  return (
    isObject(v) &&
    typeof v.id === 'string' &&
    isIsoDate(v.startedAt) &&
    isIsoDate(v.finishedAt) &&
    typeof v.durationMin === 'number' &&
    v.durationMin > 0 &&
    typeof v.caseStudyId === 'string' &&
    isStringArray(v.questionIds) &&
    Array.isArray(v.correct) &&
    v.correct.length === v.questionIds.length &&
    v.correct.every((c) => c === 0 || c === 1) &&
    typeof v.timedOut === 'boolean' &&
    (v.short === undefined || v.short === true)
  )
}

function isActiveMock(v: unknown): v is ActiveMock {
  return (
    isObject(v) &&
    typeof v.id === 'string' &&
    isIsoDate(v.startedAt) &&
    typeof v.durationMin === 'number' &&
    v.durationMin > 0 &&
    typeof v.caseStudyId === 'string' &&
    isStringArray(v.caseIds) &&
    isStringArray(v.mainIds) &&
    typeof v.seed === 'number' &&
    Number.isFinite(v.seed) &&
    isObject(v.responses) &&
    Object.values(v.responses).every((r) => isObject(r) && typeof r.format === 'string') &&
    isStringArray(v.marked) &&
    typeof v.caseLocked === 'boolean' &&
    (v.short === undefined || v.short === true)
  )
}

/** Structural check for the current save version. */
export function isSaveV5(v: unknown): v is SaveV5 {
  if (!hasSaveShell(v, 5)) return false
  if (!isObject(v.labs) || !Object.values(v.labs).every(isLabProgress)) return false
  if (v.trialStart !== undefined && !isDayKey(v.trialStart)) return false
  if (!Array.isArray(v.mocks) || !v.mocks.every(isMockRecord)) return false
  if (v.activeMock !== undefined && !isActiveMock(v.activeMock)) return false
  return Object.values(v.machines).every(isMachineProgress) && v.answers.every(isAnswerEntry)
}
