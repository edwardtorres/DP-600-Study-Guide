import type { FloorId } from '../../data/types'

export const MIN_PER_BULLET = 6
export const MIN_PLACEMENT_PER_CARRYOVER = 8
export const MAX_PREVIEW_SHARE = 0.05
export const MAX_POSITION_SHARE = 0.35
export const MAX_LONGEST_CORRECT_SHARE = 0.4
export const NEAR_DUPLICATE_JACCARD = 0.8
/** Multi-select: no option position may be correct in more than this share of questions with that option count. */
export const MAX_MULTI_POSITION_SHARE = 0.6
/** Yes/No statements: the share answered Yes must stay inside this range. */
export const YES_SHARE = { min: 0.4, max: 0.6 }
/** Distribution rules apply once a bank has at least this many items. */
export const MIN_FOR_DISTRIBUTION = 10
export const CASE_STUDY_COUNT = 6
export const MIN_CASE_QUESTIONS = 6
export const MAX_CASE_QUESTIONS = 8

/** Floors whose questions aren't written yet. Must be empty when Step 3 ends. */
export const QUESTIONS_PENDING: FloorId[] = []
/** Case studies are written last; while true, the domain-share rule is skipped. */
export const CASES_PENDING = false

/**
 * Phrases tied to points Learn doesn’t settle (contested or unsupported after the Step 8 fact-check). Questions must
 * not depend on them, so they may not appear anywhere in a question.
 */
export const BANNED_TERMS: RegExp[] = [
  /materialized view/i,
  /onelake data hub/i,
  /real-time analytics/i,
  // Step 8: contested points (Learn pages disagree; see each machine's "contested" notes).
  /(object-level|column-level) security[^.]*(fall(s)? back|fallback)/i,
  /contributor[^.]*deploy[^.]*(existing )?(semantic model|paginated report)/i,
  /onelake security[^.]*generally available/i,
  /all of the above|none of the above/i,
]
