import type { Cell, DataTable } from '../types'

/**
 * Small, pure helpers the Query Oracle templates use to compute every result.
 * Templates never hand-write an answer: they generate data, then derive the
 * correct result and each distractor (one per mistake) with these helpers.
 */

export type Row = Record<string, Cell>
export type Rand = () => number

// ── Seeded data generation ─────────────────────────────────────────────

export const int = (rand: Rand, lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))
export const pick = <T>(rand: Rand, items: readonly T[]): T => items[Math.floor(rand() * items.length)]!
export const chance = (rand: Rand, p: number) => rand() < p

/** k distinct items from `items`, in random order. */
export function sample<T>(rand: Rand, items: readonly T[], k: number): T[] {
  const pool = [...items]
  const out: T[] = []
  while (out.length < k && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]!)
  return out
}

/** k distinct integers in [lo, hi] stepping by `step`, in random order. */
export function distinctInts(rand: Rand, k: number, lo: number, hi: number, step = 1): number[] {
  const values: number[] = []
  for (let v = lo; v <= hi; v += step) values.push(v)
  return sample(rand, values, k)
}

export function shuffle<T>(rand: Rand, items: readonly T[]): T[] {
  return sample(rand, items, items.length)
}

// ── Tables ─────────────────────────────────────────────────────────────

/** A table from row objects, in the given column order. */
export function table(name: string, columns: string[], rows: Row[]): DataTable {
  return { name, columns, rows: rows.map((r) => columns.map((c) => (r[c] === undefined ? null : r[c]!))) }
}

export const result = (columns: string[], rows: Row[]) => table('Result', columns, rows)

/** Identity of a result for "are these two candidates the same?" checks. */
export function canonical(t: DataTable): string {
  return JSON.stringify([t.columns, t.rows])
}

// ── Aggregates (SQL/KQL/DAX all ignore nulls/blanks in these) ──────────

const nums = (values: Cell[]) => values.filter((v): v is number => typeof v === 'number')

export function sum(values: Cell[]): number | null {
  const n = nums(values)
  return n.length ? n.reduce((a, b) => a + b, 0) : null
}

export function avg(values: Cell[]): number | null {
  const n = nums(values)
  return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null
}

/** COUNT(column): non-null values only. */
export const countValues = (values: Cell[]) => values.filter((v) => v !== null).length

export const countDistinct = (values: Cell[]) => new Set(values.filter((v) => v !== null)).size

export function max(values: Cell[]): Cell {
  const present = values.filter((v) => v !== null)
  if (!present.length) return null
  return present.reduce((a, b) => (compare(a, b) >= 0 ? a : b))
}

// ── Relational operations ──────────────────────────────────────────────

/** Groups rows by a key, keeping the order in which keys first appear. */
export function groupBy(rows: Row[], key: (r: Row) => Cell): Map<Cell, Row[]> {
  const out = new Map<Cell, Row[]>()
  for (const r of rows) {
    const k = key(r)
    out.set(k, [...(out.get(k) ?? []), r])
  }
  return out
}

/** Compares two cells; null sorts lowest (as T-SQL ORDER BY and KQL `asc nulls first`). */
export function compare(a: Cell, b: Cell): number {
  if (a === b) return 0
  if (a === null) return -1
  if (b === null) return 1
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return String(a) < String(b) ? -1 : 1
}

export interface SortKey {
  by: string | ((r: Row) => Cell)
  dir?: 'asc' | 'desc'
  /** Where nulls go. Default: lowest value (first ascending, last descending). */
  nulls?: 'first' | 'last'
}

/** Stable sort by several keys. */
export function sortRows(rows: Row[], keys: SortKey[]): Row[] {
  const get = (k: SortKey, r: Row) => (typeof k.by === 'string' ? (r[k.by] ?? null) : k.by(r))
  return rows
    .map((r, i) => ({ r, i }))
    .sort((x, y) => {
      for (const k of keys) {
        const a = get(k, x.r)
        const b = get(k, y.r)
        if (a === b) continue
        const dir = k.dir === 'desc' ? -1 : 1
        if (k.nulls && (a === null || b === null)) return (a === null ? -1 : 1) * (k.nulls === 'first' ? 1 : -1)
        const c = compare(a, b) * dir
        if (c !== 0) return c
      }
      return x.i - y.i
    })
    .map((x) => x.r)
}

/** Inner join: every matching pair of rows (duplicates on either side multiply). */
export function innerJoin(left: Row[], right: Row[], on: (l: Row, r: Row) => boolean, merge: (l: Row, r: Row) => Row): Row[] {
  return left.flatMap((l) => right.filter((r) => on(l, r)).map((r) => merge(l, r)))
}

/** Left outer join: unmatched left rows are kept once, merged with an empty right row. */
export function leftJoin(left: Row[], right: Row[], on: (l: Row, r: Row) => boolean, merge: (l: Row, r: Row | null) => Row): Row[] {
  return left.flatMap((l) => {
    const matches = right.filter((r) => on(l, r))
    return matches.length ? matches.map((r) => merge(l, r)) : [merge(l, null)]
  })
}

/** Keeps the first row for each key (used for KQL innerunique's left-side deduplication). */
export function dedupeBy(rows: Row[], key: (r: Row) => Cell): Row[] {
  const seen = new Set<Cell>()
  return rows.filter((r) => {
    const k = key(r)
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** KQL `join kind=innerunique` (the default): deduplicate the left side on the key, then inner join. */
export function kqlInnerUnique(left: Row[], right: Row[], key: string, merge: (l: Row, r: Row) => Row): Row[] {
  return innerJoin(dedupeBy(left, (r) => r[key] ?? null), right, (l, r) => l[key] === r[key], merge)
}

/** Distinct rows over the given columns, keeping first appearance. */
export function distinct(rows: Row[], columns: string[]): Row[] {
  const seen = new Set<string>()
  return rows.filter((r) => {
    const k = JSON.stringify(columns.map((c) => r[c] ?? null))
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

// ── Window functions over rows already in window order ────────────────

export function rowNumber(rows: Row[]): number[] {
  return rows.map((_, i) => i + 1)
}

/** RANK: ties share a rank, and the next rank skips (1, 2, 2, 4). */
export function rank(rows: Row[], value: (r: Row) => Cell): number[] {
  return rows.map((r, i) => {
    let first = i
    while (first > 0 && value(rows[first - 1]!) === value(r)) first--
    return first + 1
  })
}

/** DENSE_RANK: ties share a rank, and the next rank doesn't skip (1, 2, 2, 3). */
export function denseRank(rows: Row[], value: (r: Row) => Cell): number[] {
  const out: number[] = []
  let current = 0
  rows.forEach((r, i) => {
    if (i === 0 || value(rows[i - 1]!) !== value(r)) current++
    out.push(current)
  })
  return out
}

/** Value `offset` rows back (LAG), or `fallback` (NULL by default) before the first row. */
export function lag(values: Cell[], offset = 1, fallback: Cell = null): Cell[] {
  return values.map((_, i) => (i - offset >= 0 ? values[i - offset]! : fallback))
}

export function lead(values: Cell[], offset = 1, fallback: Cell = null): Cell[] {
  return values.map((_, i) => (i + offset < values.length ? values[i + offset]! : fallback))
}

/** Running total from the first row to the current row. */
export function runningSum(values: Cell[]): (number | null)[] {
  let total: number | null = null
  return values.map((v) => {
    if (typeof v === 'number') total = (total ?? 0) + v
    return total
  })
}

/** KQL bin()/floor(): rounds down to a multiple of `size`. */
export const bin = (v: number, size: number) => Math.floor(v / size) * size
