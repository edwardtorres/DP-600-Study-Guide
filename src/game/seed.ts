/**
 * Test-only hook: `?seed=N` in the URL makes every draw and shuffle repeatable
 * (used by `npm run e2e`). It is only reachable from dev builds; see random.ts.
 * The marker below lets scripts/check-bundle.ts prove a production bundle
 * doesn't contain this module.
 */
export const SEED_HOOK_MARKER = 'fabric-mill:seed-hook'

export function seedFromSearch(search: string): number | null {
  const seed = new URLSearchParams(search).get('seed')
  if (seed === null || !/^\d+$/.test(seed)) return null
  console.info(`[${SEED_HOOK_MARKER}] draws and shuffles use seed ${seed}`)
  return Number(seed)
}
