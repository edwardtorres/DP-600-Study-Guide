/**
 * Test-only hook: `?mock=short` in the URL makes a mock exam 6 questions plus
 * the case study, with a 10-minute timer (used by `npm run e2e`). Like the
 * seed hook, it is only reachable from dev builds; scripts/check-bundle.ts
 * fails if this marker reaches a production bundle.
 */
export const MOCK_SHORT_MARKER = 'fabric-mill:mock-short-hook'

export function shortMockFromSearch(search: string): boolean {
  const on = new URLSearchParams(search).get('mock') === 'short'
  if (on) console.info(`[${MOCK_SHORT_MARKER}] short mock mode`)
  return on
}
