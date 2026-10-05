export const SAVE_VERSION = 2
export const SAVE_KEY = 'fabric-mill:save'
export const BACKUP_KEY = 'fabric-mill:save:corrupt-backup'

export interface Certification {
  passedAt: string
  /** Fraction correct, 0–1. */
  score: number
  kind: 'inspection' | 'placement'
}

/** Which kind of attempt an answer came from: start-up check, inspection, or placement. */
export type AttemptCode = 's' | 'i' | 'p'
export type AttemptKind = 'startup' | 'inspection' | 'placement'
export const attemptCode: Record<AttemptKind, AttemptCode> = { startup: 's', inspection: 'i', placement: 'p' }

/** One answered question, kept compact for spaced repetition: [questionId, correct, unix seconds, attempt]. */
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
  machines: Record<string, MachineProgress>
  answers: AnswerEntry[]
  settings: Record<string, never>
}

export type Save = SaveV2

export function newSave(now: Date = new Date()): Save {
  const iso = now.toISOString()
  return { version: SAVE_VERSION, createdAt: iso, updatedAt: iso, machines: {}, answers: [], settings: {} }
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
    (a[3] === 's' || a[3] === 'i' || a[3] === 'p')
  )
}

/** Structural check for the current save version. */
export function isSaveV2(v: unknown): v is SaveV2 {
  if (!isObject(v) || v.version !== 2) return false
  if (!isIsoDate(v.createdAt) || !isIsoDate(v.updatedAt)) return false
  if (!isObject(v.settings) || !isObject(v.machines) || !Array.isArray(v.answers)) return false
  return Object.values(v.machines).every(isMachineProgress) && v.answers.every(isAnswerEntry)
}
