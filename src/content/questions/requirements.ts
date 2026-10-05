import type { FloorId } from '../../data/types'

export const MIN_PER_BULLET = 6
export const MIN_PLACEMENT_PER_CARRYOVER = 8
export const MAX_PREVIEW_SHARE = 0.05
export const MAX_POSITION_SHARE = 0.35
export const MAX_LONGEST_CORRECT_SHARE = 0.4
export const NEAR_DUPLICATE_JACCARD = 0.8

/** Floors whose questions aren't written yet. Must be empty when Step 3 ends. */
export const QUESTIONS_PENDING: FloorId[] = ['maintain']
/** Case studies are written last; while true, the domain-share rule is skipped. */
export const CASES_PENDING = true

/**
 * Phrases tied to open needs-verification items (Step 8 queue). Questions must
 * not depend on them, so they may not appear anywhere in a question.
 */
export const BANNED_TERMS: RegExp[] = [
  /materialized view/i,
  /scalar (user-defined )?function/i,
  /scalar udf/i,
  /onelake data hub/i,
  /real-time analytics/i,
  /dropDuplicates|fillna/,
  /onelake security[^.]*generally available/i,
  /all of the above|none of the above/i,
]
