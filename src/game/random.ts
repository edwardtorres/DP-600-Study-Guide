import { shortMockFromSearch } from './mockShort'
import { seedFromSearch } from './seed'
import { mulberry32 } from './shuffle'

/**
 * Randomness for draws and shuffles. In dev builds only, `?seed=N` makes it
 * repeatable for the e2e flows. Production builds fold `import.meta.env.DEV`
 * to false, so the seed branch and its module are removed from the bundle.
 */
export function makeRandom(search: string = typeof window === 'undefined' ? '' : window.location.search): () => number {
  if (!import.meta.env.DEV) return Math.random
  const seed = seedFromSearch(search)
  return seed === null ? Math.random : mulberry32(seed)
}

/** Dev builds only: `?mock=short` turns on the short mock for e2e. Production always returns false. */
export function shortMockMode(search: string = typeof window === 'undefined' ? '' : window.location.search): boolean {
  if (!import.meta.env.DEV) return false
  return shortMockFromSearch(search)
}
