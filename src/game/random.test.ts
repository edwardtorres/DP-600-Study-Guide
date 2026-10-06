import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeRandom, shortMockMode } from './random'
import { seedFromSearch } from './seed'

afterEach(() => vi.unstubAllEnvs())

describe('seed hook', () => {
  it('parses only whole-number seeds', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(seedFromSearch('?seed=22')).toBe(22)
    expect(seedFromSearch('?seed=abc')).toBeNull()
    expect(seedFromSearch('?seed=-1')).toBeNull()
    expect(seedFromSearch('')).toBeNull()
  })

  it('makes draws repeatable in dev builds', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.stubEnv('DEV', true)
    const a = makeRandom('?seed=22')
    const b = makeRandom('?seed=22')
    expect(a).not.toBe(Math.random)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('ignores ?seed= in production builds', () => {
    vi.stubEnv('DEV', false)
    expect(makeRandom('?seed=22')).toBe(Math.random)
  })
})

describe('short mock hook', () => {
  it('turns on only with ?mock=short in dev builds', () => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.stubEnv('DEV', true)
    expect(shortMockMode('?mock=short')).toBe(true)
    expect(shortMockMode('?mock=full')).toBe(false)
    expect(shortMockMode('')).toBe(false)
  })

  it('is ignored in production builds', () => {
    vi.stubEnv('DEV', false)
    expect(shortMockMode('?mock=short')).toBe(false)
  })
})
