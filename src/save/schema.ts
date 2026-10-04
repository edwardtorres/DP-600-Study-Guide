export const SAVE_VERSION = 1
export const SAVE_KEY = 'fabric-mill:save'
export const BACKUP_KEY = 'fabric-mill:save:corrupt-backup'

export interface Certification {
  passedAt: string
  /** Fraction correct, 0–1. */
  score: number
  kind: 'inspection' | 'placement'
}

export interface MachineProgress {
  startedAt?: string
  certification?: Certification
}

export interface SaveV1 {
  version: 1
  createdAt: string
  updatedAt: string
  machines: Record<string, MachineProgress>
  settings: Record<string, never>
}

export type Save = SaveV1

export function newSave(now: Date = new Date()): Save {
  const iso = now.toISOString()
  return { version: SAVE_VERSION, createdAt: iso, updatedAt: iso, machines: {}, settings: {} }
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)
const isIsoDate = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v))

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

/** Structural check for the current save version. */
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
