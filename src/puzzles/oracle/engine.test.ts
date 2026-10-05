import { describe, expect, it } from 'vitest'
import { avg, bin, countDistinct, countValues, denseRank, innerJoin, kqlInnerUnique, lag, lead, leftJoin, rank, runningSum, sortRows, sum, type Row } from './engine'

// Learn's own example tables for the KQL join flavors (join-innerunique, join-inner, join-leftouter pages).
const X: Row[] = [
  { Key: 'a', Value1: 1 },
  { Key: 'b', Value1: 2 },
  { Key: 'b', Value1: 3 },
  { Key: 'c', Value1: 4 },
]
const Y: Row[] = [
  { Key: 'b', Value2: 10 },
  { Key: 'c', Value2: 20 },
  { Key: 'c', Value2: 30 },
  { Key: 'd', Value2: 40 },
]
const merge = (l: Row, r: Row | null): Row => ({ Key: l.Key!, Value1: l.Value1!, Key1: r?.Key ?? null, Value2: r?.Value2 ?? null })
const flat = (rows: Row[]) => rows.map((r) => [r.Key, r.Value1, r.Key1, r.Value2])

describe('Query Oracle engine, checked against Learn examples', () => {
  it('innerunique keeps the first left row per key (join-innerunique example)', () => {
    expect(flat(kqlInnerUnique(X, Y, 'Key', merge))).toEqual([
      ['b', 2, 'b', 10],
      ['c', 4, 'c', 20],
      ['c', 4, 'c', 30],
    ])
  })

  it('inner join matches every pair (join-inner example)', () => {
    const X2 = [...X.slice(0, 3), { Key: 'k', Value1: 5 }, X[3]!]
    const Y2 = [...Y, { Key: 'k', Value2: 50 }]
    const out = flat(innerJoin(X2, Y2, (l, r) => l.Key === r.Key, merge))
    expect(out).toHaveLength(5)
    expect(out).toEqual(
      expect.arrayContaining([
        ['b', 2, 'b', 10],
        ['b', 3, 'b', 10],
        ['c', 4, 'c', 20],
        ['c', 4, 'c', 30],
        ['k', 5, 'k', 50],
      ]),
    )
  })

  it('leftouter keeps unmatched left rows with nulls (join-leftouter example)', () => {
    expect(flat(leftJoin(X, Y, (l, r) => l.Key === r.Key, merge))).toEqual([
      ['a', 1, null, null],
      ['b', 2, 'b', 10],
      ['b', 3, 'b', 10],
      ['c', 4, 'c', 20],
      ['c', 4, 'c', 30],
    ])
  })

  it('bin rounds down (bin page: bin(4.5, 1) = 4)', () => {
    expect(bin(4.5, 1)).toBe(4)
    expect(bin(199, 100)).toBe(100)
    expect(bin(200, 100)).toBe(200)
  })

  it('aggregates ignore nulls; COUNT(column) counts non-null values', () => {
    expect(sum([1, null, 2])).toBe(3)
    expect(avg([2, null, 4])).toBe(3)
    expect(avg([null])).toBeNull()
    expect(countValues(['a', null, 'a'])).toBe(2)
    expect(countDistinct(['a', null, 'a', 'b'])).toBe(2)
  })

  it('RANK skips after ties; DENSE_RANK does not', () => {
    const rows: Row[] = [{ v: 9 }, { v: 7 }, { v: 7 }, { v: 5 }]
    expect(rank(rows, (r) => r.v ?? null)).toEqual([1, 2, 2, 4])
    expect(denseRank(rows, (r) => r.v ?? null)).toEqual([1, 2, 2, 3])
  })

  it('LAG returns NULL before the first row unless a default is given; LEAD looks ahead', () => {
    expect(lag([1, 2, 3])).toEqual([null, 1, 2])
    expect(lag([1, 2, 3], 1, 0)).toEqual([0, 1, 2])
    expect(lead([1, 2, 3])).toEqual([2, 3, null])
    expect(runningSum([1, null, 2])).toEqual([1, 1, 3])
  })

  it('sorts nulls lowest by default (first ascending, last descending), with KQL-style overrides', () => {
    const rows: Row[] = [{ v: 2 }, { v: null }, { v: 1 }]
    expect(sortRows(rows, [{ by: 'v' }]).map((r) => r.v)).toEqual([null, 1, 2])
    expect(sortRows(rows, [{ by: 'v', dir: 'desc' }]).map((r) => r.v)).toEqual([2, 1, null])
    expect(sortRows(rows, [{ by: 'v', nulls: 'last' }]).map((r) => r.v)).toEqual([1, 2, null])
  })
})
