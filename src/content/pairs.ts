import { allNotes } from './notes'

/** Where each "don't confuse" pair lives in the notes. */
export const pairIndex = new Map(
  allNotes.flatMap((n) => n.dontConfuse.map((d) => [d.pairId, { machineId: n.machineId, a: d.a, b: d.b }] as const)),
)
