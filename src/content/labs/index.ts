import type { Lab, LabPlatform } from './types'
import { prepareLabs } from './prepare'
import { semanticLabs } from './semantic'
import { maintainLabs } from './maintain'

/** Every lab, in recommended order. */
export const allLabs: Lab[] = [...prepareLabs, ...semanticLabs, ...maintainLabs].sort((a, b) => a.order - b.order)

export const labById = new Map(allLabs.map((l) => [l.id, l]))

/**
 * Outline bullets with no hands-on lab, and why. The content check fails if a
 * bullet is neither covered by a lab nor listed here.
 */
export const LABS_UNCOVERED: Record<string, string> = {}

/**
 * Bullets a lab covers only in part, and why (reported in the audit and on the
 * Labs page; not enforced).
 */
export const LABS_PARTIAL: Record<string, string> = {
  'M1.4': 'Applying a label needs Microsoft Purview sensitivity labels published in your tenant. Lab 12 asks you to record it if none are available.',
  'M1.3': 'Testing CLS and what another user sees needs a second account in your organization; those steps are optional. Semantic model OLS needs Power BI Desktop (Windows).',
  'M1.2': 'Sharing an item with someone else needs a second account; without one, Lab 11 only shows the share options.',
}

export const labMinutes = allLabs.reduce((t, l) => t + l.minutes, 0)

/** Bullets each lab covers. */
export function bulletsCovered(): Set<string> {
  return new Set(allLabs.flatMap((l) => l.bulletIds))
}

/** Labs that list a machine, in recommended order. */
export function labsForMachine(machineId: string): Lab[] {
  return allLabs.filter((l) => l.machineIds.includes(machineId))
}

/** The platform a machine's labs need: browser, windows, or mixed. */
export function machineLabPlatform(machineId: string): LabPlatform | undefined {
  const set = new Set(labsForMachine(machineId).map((l) => l.platform))
  if (set.size === 0) return undefined
  if (set.size === 1) return [...set][0]
  return 'mixed'
}
