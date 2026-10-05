import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeRandom } from './random'
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
