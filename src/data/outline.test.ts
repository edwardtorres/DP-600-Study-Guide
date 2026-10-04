import { describe, expect, it } from 'vitest'
import { allBullets, outline } from './outline'
import { EXPECTED, validateOutline } from './validate'

describe('official outline', () => {
  it('is the October 19, 2026 version', () => {
    expect(outline.version).toBe('Skills measured as of October 19, 2026')
    expect(outline.source).toMatch(/^https:\/\/learn\.microsoft\.com\//)
  })

  it('has 3 domains, 7 sections, and 41 bullets with the published weights', () => {
    expect(outline.domains.map((d) => [d.title, d.weightText])).toEqual([
      ['Maintain a data analytics solution', '25–30%'],
      ['Prepare data', '45–50%'],
      ['Implement and manage semantic models', '25–30%'],
    ])
    expect(outline.domains.flatMap((d) => d.sections)).toHaveLength(7)
    expect(allBullets).toHaveLength(41)
    expect(outline.domains.map((d) => d.sections.reduce((n, s) => n + s.bullets.length, 0))).toEqual([11, 18, 12])
  })

  it('passes the shared validator', () => {
    expect(validateOutline(outline)).toEqual([])
    expect(EXPECTED.bullets).toBe(41)
  })
})
