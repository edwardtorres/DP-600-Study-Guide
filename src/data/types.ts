export type DomainId = 'MAINTAIN' | 'PREPARE' | 'SEMANTIC'

export interface OutlineBullet {
  id: string
  text: string
}

export interface OutlineSection {
  id: string
  title: string
  bullets: OutlineBullet[]
}

export interface OutlineDomain {
  id: DomainId
  title: string
  weightText: string
  weight: { min: number; max: number }
  sections: OutlineSection[]
}

export interface Outline {
  source: string
  exam: string
  certification: string
  version: string
  pageLastUpdated: string
  retrievedOn: string
  note: string
  domains: OutlineDomain[]
}

export type FloorId = 'orientation' | 'prepare' | 'semantic' | 'maintain'

export type MachineState = 'locked' | 'idle' | 'running' | 'certified'

/** Where a future hands-on lab can run. Preliminary until Step 6 verifies on Learn. */
export type LabPlatform = 'browser' | 'windows' | 'tbd'

export interface Pl300Overlap {
  /** Verbatim bullets from the PL-300 study guide (skills measured as of April 20, 2026). */
  overlaps: string[]
  /** Set when the tag was requested but no PL-300 bullet matches it directly. */
  caveat?: string
}

export interface Machine {
  id: string
  floor: FloorId
  /** Mill-themed name. Always shown next to skillName. */
  themedName: string
  /** Plain skill name. */
  skillName: string
  /** Outline bullet ids. Empty for Orientation machines. */
  bulletIds: string[]
  orientation?: true
  pl300?: Pl300Overlap
  labPlatform: LabPlatform
  /** Learn-sourced notes arrive in Step 2. */
  notes: null
}

export interface Edge {
  /** The prerequisite machine. */
  from: string
  /** The machine it unlocks. */
  to: string
  reason: string
}
