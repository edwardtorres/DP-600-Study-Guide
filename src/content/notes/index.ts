import type { MachineNotes } from '../types'
import { maintainNotes } from './maintain'
import { orientationNotes } from './orientation'
import { prepareNotes } from './prepare'
import { semanticNotes } from './semantic'

export const allNotes: MachineNotes[] = [...orientationNotes, ...prepareNotes, ...semanticNotes, ...maintainNotes]

export const notesByMachine = new Map(allNotes.map((n) => [n.machineId, n]))
