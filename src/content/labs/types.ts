/**
 * Hands-on Fabric trial labs (Step 6). Labs are untested until the player runs
 * them, so every step cites its source, checkpoints avoid exact data values,
 * and each step has a place to report a problem. Completion is self-reported:
 * it earns a fixed amount of XP and never certifies a machine.
 */

import type { LabPlatform } from '../../data/types'

export type { LabPlatform }

export interface LabStep {
  id: string
  /** What to do, in a sentence or two. Long click paths live in the cited section. */
  text: string
  /** learn.microsoft.com (or, for lab steps only, microsoftlearning.github.io) pages, ideally with a #section. */
  sources: string[]
  /** What you should see on your own screen; never an exact data value. */
  checkpoint?: string
  /** A notes "don't confuse" pair this step demonstrates ("trap you'll see"). */
  trapPairId?: string
  /** Shown as a short callout with the trap. */
  trapNote?: string
  /** Not needed to complete the lab. */
  optional?: true
  /** A cost warning and the free alternative (only on optional steps). */
  cost?: string
  /** Steps that need Power BI Desktop (Windows). */
  windows?: true
}

export interface Lab {
  id: string
  /** Recommended order (1 = first). */
  order: number
  title: string
  goal: string
  machineIds: string[]
  /** Outline bullets practised. Orientation labs have none. */
  bulletIds: string[]
  platform: LabPlatform
  /** Estimated minutes. */
  minutes: number
  prereqs: string[]
  /** Short setup note shown before the steps (for example which workspace to use). */
  before?: string
  steps: LabStep[]
  cleanup: LabStep[]
  /** Bullets the 3-question debrief draws from (defaults to bulletIds). */
  debriefBullets?: string[]
}
