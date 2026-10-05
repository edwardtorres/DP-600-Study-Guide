/** A statement written in our own words, backed by Microsoft Learn pages. */
export interface Cited {
  text: string
  /** learn.microsoft.com URLs. At least one. */
  sources: string[]
}

export type FabricTool =
  | 'lakehouse'
  | 'warehouse'
  | 'sql-analytics-endpoint'
  | 'notebook'
  | 'dataflow-gen2'
  | 'pipeline'
  | 'eventhouse'
  | 'semantic-model'
  | 'power-bi-desktop'
  | 'onelake'
  | 'admin-portal'
  | 'workspace'
  | 'other'

export type CodeLanguage = 'tsql' | 'kql' | 'dax' | 'pyspark' | 'sparksql' | 'm' | 'tmsl'

export interface BulletNotes {
  bulletId: string
  tools: FabricTool[]
  concepts: Cited[]
  howTo: Cited[]
}

export interface WorkedExample {
  title: string
  language: CodeLanguage
  /** Examples are teaching aids, not production code. */
  illustrative: true
  steps: { code: string; explain: string }[]
  sources: string[]
}

export interface DontConfuse {
  pairId: string
  a: string
  b: string
  difference: Cited[]
}

export interface Renamed {
  oldName: string
  newName: string
  /** Which name the exam is likely to use, and why. */
  examLikely: string
  note: string
  sources: string[]
}

export interface PreviewLabel {
  feature: string
  note: string
  sources: string[]
}

export interface DatedChange {
  /** ISO date, e.g. 2026-12-01. */
  date: string
  change: string
  sources: string[]
}

export interface GlossaryEntry {
  term: string
  definition: string
  sources: string[]
}

export interface NeedsVerification {
  claim: string
  why: string
}

export interface MachineNotes {
  machineId: string
  /** Shown first on PL-300 carryover machines. */
  pl300Adds?: Cited[]
  overview: Cited[]
  bullets: BulletNotes[]
  examples: WorkedExample[]
  traps: Cited[]
  dontConfuse: DontConfuse[]
  renamed: Renamed[]
  preview: PreviewLabel[]
  upcoming: DatedChange[]
  glossary: GlossaryEntry[]
  needsVerification: NeedsVerification[]
}
