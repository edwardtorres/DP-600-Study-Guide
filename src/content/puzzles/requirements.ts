/** Minimum puzzle counts (Step 5). check:content enforces them. */
export const PUZZLE_MINIMUMS = {
  oraclePerLanguage: 12,
  pattern: 8,
  gearboxPerDeck: 12,
  fallback: 12,
  access: 10,
  rippleAndConveyor: 10,
} as const

/** Seeds each Query Oracle template is generated with during the content check. */
export const ORACLE_CHECK_SEEDS = 50
/** A puzzle play counts as correct at this share of right decisions (single-decision puzzles need it right). */
export const PUZZLE_PASS = 0.8
