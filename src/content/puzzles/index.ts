import { daxTemplates } from '../../puzzles/oracle/dax'
import { kqlTemplates } from '../../puzzles/oracle/kql'
import { oraclePuzzle, type OracleTemplate } from '../../puzzles/oracle/template'
import { tsqlTemplates } from '../../puzzles/oracle/tsql'
import type { Puzzle } from '../../puzzles/types'
import { accessPuzzles } from './access'
import { conveyorPuzzles } from './conveyor'
import { fallbackPuzzles } from './fallback'
import { gearboxPuzzles } from './gearbox'
import { patternPuzzles } from './pattern'
import { ripplePuzzles } from './ripple'

export const oracleTemplates: OracleTemplate[] = [...tsqlTemplates, ...kqlTemplates, ...daxTemplates]

export const allPuzzles: Puzzle[] = [
  ...oracleTemplates.map(oraclePuzzle),
  ...patternPuzzles,
  ...gearboxPuzzles,
  ...fallbackPuzzles,
  ...accessPuzzles,
  ...ripplePuzzles,
  ...conveyorPuzzles,
]

export const puzzleById = new Map(allPuzzles.map((p) => [p.meta.id, p]))

/** Puzzles shown on each machine's Puzzle bench. */
export function puzzlesFor(machineId: string): Puzzle[] {
  return allPuzzles.filter((p) => p.meta.machineIds.includes(machineId))
}
