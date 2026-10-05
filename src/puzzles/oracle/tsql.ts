import { avg, countDistinct, countValues, denseRank, distinct, distinctInts, groupBy, innerJoin, int, lag, lead, leftJoin, pick, rank, result, runningSum, sample, shuffle, sortRows, sum, table, type Rand, type Row } from './engine'
import type { OracleTemplate } from './template'
import { SRC } from './traps'

/**
 * T-SQL predict-the-result templates (Fabric Warehouse / SQL analytics endpoint).
 * Every result is computed from the generated data; nothing is hand-written.
 */

const names = ['Ana', 'Ben', 'Chen', 'Dara', 'Eli', 'Femi', 'Gus', 'Hana', 'Ivo', 'Jo']
const regions = ['Central', 'East', 'North', 'South', 'West']
const products = ['Bolt', 'Cog', 'Gear', 'Lever', 'Pulley', 'Spool', 'Valve', 'Winch']
const day = (n: number) => `2026-${String(Math.floor((n - 1) / 28) + 6).padStart(2, '0')}-${String(((n - 1) % 28) + 1).padStart(2, '0')}`

// ── QO-T01 WHERE vs HAVING ────────────────────────────────────────────
const t01: OracleTemplate = {
  meta: {
    id: 'QO-T01',
    title: 'Row filter, then group filter',
    machineIds: ['inspection-bench'],
    bulletIds: ['P3.2'],
    difficulty: 2,
    sources: [SRC.having, SRC.where, SRC.qualify, SRC.groupBy],
    trapPairId: 'where-having-qualify',
  },
  language: 'tsql',
  intro: 'A warehouse table holds orders. An analyst wants each region’s total from larger orders only, and only for regions above a threshold.',
  traps: ['where-vs-having', 'range-boundary'],
  generate(rand) {
    const regs = sample(rand, regions, 3)
    const n = int(rand, 7, 9)
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({ OrderID: 101 + i, Region: pick(rand, regs), Amount: int(rand, 2, 12) * 10 }))
    const minAmount = pick(rand, [40, 50, 60])
    const totals = (rs: Row[]) =>
      [...groupBy(rs, (r) => r.Region!)].map(([Region, g]) => ({ Region, Total: sum(g.map((r) => r.Amount!)) as number }))
    const filtered = rows.filter((r) => (r.Amount as number) >= minAmount)
    // The threshold is one region's filtered total, so the boundary matters.
    const candidates = totals(filtered).map((x) => x.Total).sort((a, b) => a - b)
    const minTotal = candidates[1] ?? 100
    const out = (groups: { Region: string | number | null; Total: number }[], keep: (t: number) => boolean) =>
      result(['Region', 'Total'], sortRows(groups.filter((g) => keep(g.Total)), [{ by: 'Region' }]))
    return {
      tables: [table('dbo.Orders', ['OrderID', 'Region', 'Amount'], rows)],
      query: `SELECT Region, SUM(Amount) AS Total\nFROM dbo.Orders\nWHERE Amount >= ${minAmount}\nGROUP BY Region\nHAVING SUM(Amount) > ${minTotal}\nORDER BY Region;`,
      correct: out(totals(filtered), (t) => t > minTotal),
      explain: `WHERE first removes orders under ${minAmount}; GROUP BY totals what’s left; HAVING then keeps only regions whose total is above ${minTotal}.`,
      distractors: [
        { trap: 'where-vs-having', why: 'It ignores the WHERE filter, so small orders still count toward each total.', table: out(totals(rows), (t) => t > minTotal) },
        { trap: 'where-vs-having', why: 'It applies only WHERE and keeps every region, skipping the HAVING filter on totals.', table: out(totals(filtered), () => true) },
        { trap: 'range-boundary', why: `It treats > ${minTotal} as >= ${minTotal}, keeping a region whose total is exactly ${minTotal}.`, table: out(totals(filtered), (t) => t >= minTotal) },
      ],
    }
  },
}

// ── QO-T02 QUALIFY to keep the latest row per key ─────────────────────
const t02: OracleTemplate = {
  meta: {
    id: 'QO-T02',
    title: 'Keep the latest row per customer',
    machineIds: ['carding-machine'],
    bulletIds: ['P2.7'],
    difficulty: 2,
    sources: [SRC.qualify, SRC.rowNumber, SRC.over],
    trapPairId: 'where-having-qualify',
  },
  language: 'tsql',
  intro: 'A staging table has several updates per customer. The query should keep one row per customer: the most recent.',
  traps: ['asc-vs-desc', 'window-partition', 'distinct-not-dedupe'],
  generate(rand) {
    const ids = sample(rand, [11, 12, 13, 14, 15], 3).sort()
    const days = distinctInts(rand, 8, 1, 50)
    const rows: Row[] = []
    let d = 0
    for (const id of ids) {
      const k = id === ids[0] ? 3 : int(rand, 2, 3)
      const who = pick(rand, names).toLowerCase()
      for (let j = 0; j < k && d < days.length; j++) rows.push({ CustomerID: id, Email: `${who}${j === 0 ? '' : j + 1}@contoso.com`, ModifiedAt: day(days[d++]!) })
    }
    const data = shuffle(rand, rows)
    const latest = (dir: 'asc' | 'desc') =>
      [...groupBy(data, (r) => r.CustomerID!)].map(([, g]) => sortRows(g, [{ by: 'ModifiedAt', dir }])[0]!)
    const cols = ['CustomerID', 'Email', 'ModifiedAt']
    const byId = (rs: Row[]) => result(cols, sortRows(rs, [{ by: 'CustomerID' }]))
    return {
      tables: [table('dbo.CustomerUpdates', cols, data)],
      query: `SELECT CustomerID, Email, ModifiedAt\nFROM dbo.CustomerUpdates\nQUALIFY ROW_NUMBER() OVER (\n    PARTITION BY CustomerID\n    ORDER BY ModifiedAt DESC) = 1\nORDER BY CustomerID;`,
      correct: byId(latest('desc')),
      explain: 'ROW_NUMBER restarts at 1 for each CustomerID and numbers the newest update first (DESC). QUALIFY runs after the window function and keeps row 1, so each customer’s latest row remains.',
      distractors: [
        { trap: 'asc-vs-desc', why: 'It numbers the oldest update first, keeping each customer’s earliest row.', table: byId(latest('asc')) },
        { trap: 'window-partition', why: 'It numbers all rows as one partition, so only the single newest row in the table survives.', table: byId([sortRows(data, [{ by: 'ModifiedAt', dir: 'desc' }])[0]!]) },
        { trap: 'distinct-not-dedupe', why: 'It behaves like SELECT DISTINCT: every row differs somewhere, so nothing is removed.', table: result(cols, sortRows(distinct(data, cols), [{ by: 'CustomerID' }, { by: 'ModifiedAt' }])) },
      ],
    }
  },
}

// ── QO-T03 LEFT JOIN with COUNT(column) ───────────────────────────────
const t03: OracleTemplate = {
  meta: {
    id: 'QO-T03',
    title: 'Customers with and without orders',
    machineIds: ['twisting-frame'],
    bulletIds: ['P2.6'],
    difficulty: 2,
    sources: [SRC.from, SRC.count, SRC.groupBy],
  },
  language: 'tsql',
  intro: 'Marketing wants an order count for every customer, including customers who haven’t ordered yet.',
  traps: ['inner-vs-left', 'count-star-vs-column', 'left-vs-right'],
  generate(rand) {
    const custs = sample(rand, names, 5).map((Name, i) => ({ CustomerID: i + 1, Name }))
    const n = int(rand, 6, 8)
    const orders: Row[] = Array.from({ length: n }, (_, i) => ({
      OrderID: 501 + i,
      CustomerID: i === n - 1 ? 9 : pick(rand, custs.slice(0, 3)).CustomerID,
      Amount: int(rand, 2, 30) * 5,
    }))
    const counts = (rows: Row[], key: string, value: (g: Row[]) => number) =>
      result(['Name', 'OrderCount'], sortRows([...groupBy(rows, (r) => r[key] ?? null)].map(([Name, g]) => ({ Name, OrderCount: value(g) })), [{ by: 'Name' }]))
    const merge = (c: Row, o: Row | null): Row => ({ Name: c.Name!, OrderID: o?.OrderID ?? null })
    const left = leftJoin(custs, orders, (c, o) => c.CustomerID === o.CustomerID, merge)
    const inner = innerJoin(custs, orders, (c, o) => c.CustomerID === o.CustomerID, merge)
    const right = orders.map((o) => ({ Name: custs.find((c) => c.CustomerID === o.CustomerID)?.Name ?? null, OrderID: o.OrderID! }))
    const countCol = (g: Row[]) => countValues(g.map((r) => r.OrderID ?? null))
    return {
      tables: [table('dbo.Customers', ['CustomerID', 'Name'], custs), table('dbo.Orders', ['OrderID', 'CustomerID', 'Amount'], orders)],
      query: `SELECT c.Name, COUNT(o.OrderID) AS OrderCount\nFROM dbo.Customers AS c\nLEFT JOIN dbo.Orders AS o\n    ON o.CustomerID = c.CustomerID\nGROUP BY c.Name\nORDER BY c.Name;`,
      correct: counts(left, 'Name', countCol),
      explain: 'LEFT JOIN keeps every customer. For customers with no orders, o.OrderID is NULL, and COUNT(o.OrderID) skips NULLs, so they show 0. The order for customer 9 has no customer row, so it doesn’t appear.',
      distractors: [
        { trap: 'inner-vs-left', why: 'It drops customers with no orders, as an inner join would.', table: counts(inner, 'Name', countCol) },
        { trap: 'count-star-vs-column', why: 'It counts rows (COUNT(*)), so a customer with no orders shows 1 for the NULL row.', table: counts(left, 'Name', (g) => g.length) },
        { trap: 'left-vs-right', why: 'It keeps every order instead of every customer, so the unmatched order appears under a NULL name and customers with no orders vanish.', table: counts(right, 'Name', countCol) },
      ],
    }
  },
}

// ── QO-T04 LEFT JOIN: filter in ON vs WHERE ───────────────────────────
const t04: OracleTemplate = {
  meta: {
    id: 'QO-T04',
    title: 'Open orders, every customer listed',
    machineIds: ['twisting-frame'],
    bulletIds: ['P2.6'],
    difficulty: 3,
    sources: [SRC.from, SRC.where, SRC.orderBy],
  },
  language: 'tsql',
  intro: 'A report must list every customer, with the amount of each of their open orders (if any).',
  traps: ['left-join-filter-in-where', 'ignored-predicate', 'null-not-zero'],
  generate(rand) {
    const custs = sample(rand, names, 5)
      .sort()
      .map((Name, i) => ({ CustomerID: i + 1, Name }))
    const amounts = distinctInts(rand, 7, 4, 40, 1).map((x) => x * 5)
    const orders: Row[] = amounts.map((Amount, i) => ({
      OrderID: 701 + i,
      CustomerID: pick(rand, custs.slice(0, 4)).CustomerID,
      Status: i < 2 ? 'Closed' : pick(rand, ['Open', 'Closed']),
      Amount,
    }))
    const merge = (c: Row, o: Row | null): Row => ({ Name: c.Name!, Amount: o?.Amount ?? null, Status: o?.Status ?? null })
    const out = (rows: Row[]) => result(['Name', 'Amount'], sortRows(rows, [{ by: 'Name' }, { by: 'Amount' }]))
    const open = (o: Row) => o.Status === 'Open'
    const correct = leftJoin(custs, orders, (c, o) => c.CustomerID === o.CustomerID && open(o), merge)
    return {
      tables: [table('dbo.Customers', ['CustomerID', 'Name'], custs), table('dbo.Orders', ['OrderID', 'CustomerID', 'Status', 'Amount'], orders)],
      query: `SELECT c.Name, o.Amount\nFROM dbo.Customers AS c\nLEFT JOIN dbo.Orders AS o\n    ON o.CustomerID = c.CustomerID\n   AND o.Status = 'Open'\nORDER BY c.Name, o.Amount;`,
      correct: out(correct),
      explain: 'The Status condition is part of ON, so it only decides which orders match. Every customer stays; a customer with no open order gets one row with a NULL amount.',
      distractors: [
        {
          trap: 'left-join-filter-in-where',
          why: 'It applies the Status test as if it were in WHERE, which removes customers whose order side is NULL.',
          table: out(leftJoin(custs, orders, (c, o) => c.CustomerID === o.CustomerID, merge).filter((r) => r.Status === 'Open')),
        },
        { trap: 'ignored-predicate', why: 'It ignores the Status condition and lists closed orders too.', table: out(leftJoin(custs, orders, (c, o) => c.CustomerID === o.CustomerID, merge)) },
        { trap: 'null-not-zero', why: 'It shows 0 for customers without an open order, but the unmatched amount is NULL.', table: out(correct.map((r) => ({ ...r, Amount: r.Amount ?? 0 }))) },
      ],
    }
  },
}

// ── QO-T05 COUNT(*) vs COUNT(column) vs COUNT(DISTINCT) ───────────────
const t05: OracleTemplate = {
  meta: {
    id: 'QO-T05',
    title: 'Counting leads with missing emails',
    machineIds: ['carding-machine'],
    bulletIds: ['P2.7'],
    difficulty: 1,
    sources: [SRC.count, SRC.groupBy],
  },
  language: 'tsql',
  intro: 'Before a campaign, a data engineer profiles how many leads per region have an email address.',
  traps: ['nulls-ignored', 'count-star-vs-column', 'distinct-count'],
  generate(rand) {
    const regs = sample(rand, regions, 3).sort()
    const pool = sample(rand, names, 4).map((x) => `${x.toLowerCase()}@contoso.com`)
    // Region 1 gets a NULL and a repeated email; the rest is random.
    const fixed: Row[] = [
      { Region: regs[0]!, Email: pool[0]! },
      { Region: regs[0]!, Email: pool[0]! },
      { Region: regs[0]!, Email: null },
      { Region: regs[1]!, Email: null },
    ]
    const extra = Array.from({ length: int(rand, 3, 5) }, () => ({ Region: pick(rand, regs), Email: pick(rand, [...pool.slice(1), null]) }))
    const rows2: Row[] = shuffle(rand, [...fixed, ...extra]).map((r, i) => ({ LeadID: i + 1, ...r }))
    const by = (f: (g: Row[]) => Row) => result(['Region', 'Leads', 'WithEmail'], sortRows([...groupBy(rows2, (r) => r.Region!)].map(([Region, g]) => ({ Region, ...f(g) })), [{ by: 'Region' }]))
    const emails = (g: Row[]) => g.map((r) => r.Email ?? null)
    return {
      tables: [table('dbo.Leads', ['LeadID', 'Region', 'Email'], rows2)],
      query: `SELECT Region,\n       COUNT(*) AS Leads,\n       COUNT(Email) AS WithEmail\nFROM dbo.Leads\nGROUP BY Region\nORDER BY Region;`,
      correct: by((g) => ({ Leads: g.length, WithEmail: countValues(emails(g)) })),
      explain: 'COUNT(*) counts every row in the group. COUNT(Email) counts non-NULL emails only, and it still counts a repeated email each time.',
      distractors: [
        { trap: 'nulls-ignored', why: 'It counts NULL emails in WithEmail, as if COUNT(Email) counted rows.', table: by((g) => ({ Leads: g.length, WithEmail: g.length })) },
        { trap: 'count-star-vs-column', why: 'It makes COUNT(*) skip rows with a NULL email, but COUNT(*) counts every row.', table: by((g) => ({ Leads: countValues(emails(g)), WithEmail: countValues(emails(g)) })) },
        { trap: 'distinct-count', why: 'It counts each email once, as COUNT(DISTINCT Email) would.', table: by((g) => ({ Leads: g.length, WithEmail: countDistinct(emails(g)) })) },
      ],
    }
  },
}

// ── QO-T06 AVG with NULLs ─────────────────────────────────────────────
/** [rated values, nulls, average] combinations where every average is a whole number either way. */
const avgShapes: [number, number, number][] = [
  [2, 1, 3],
  [2, 2, 2],
  [2, 2, 4],
  [1, 1, 4],
  [3, 1, 4],
]
function valuesWithMean(rand: Rand, k: number, mean: number): number[] {
  const d = int(rand, 0, Math.min(mean - 1, 5 - mean))
  if (k === 1) return [mean]
  if (k === 2) return [mean - d, mean + d]
  return [mean - d, mean, mean + d]
}
const t06: OracleTemplate = {
  meta: {
    id: 'QO-T06',
    title: 'Average rating with unrated rows',
    machineIds: ['carding-machine'],
    bulletIds: ['P2.7'],
    difficulty: 2,
    sources: [SRC.avg, SRC.count],
  },
  language: 'tsql',
  intro: 'Score is an int column. Some ratings were saved without a score (NULL). The query reports each product’s average score and how many rows were rated.',
  traps: ['nulls-ignored', 'count-star-vs-column'],
  generate(rand) {
    const prods = sample(rand, products, 3).sort()
    const rows: Row[] = []
    prods.forEach((Product, i) => {
      if (i === 1) {
        const [k, m, mean] = pick(rand, avgShapes)
        for (const s of valuesWithMean(rand, k, mean)) rows.push({ Product, Score: s })
        for (let j = 0; j < m; j++) rows.push({ Product, Score: null })
      } else for (const s of valuesWithMean(rand, 2, int(rand, 2, 4))) rows.push({ Product, Score: s })
    })
    const data = shuffle(rand, rows).map((r, i) => ({ RatingID: i + 1, ...r }))
    const by = (f: (g: Row[]) => Row) => result(['Product', 'AvgScore', 'Rated'], sortRows([...groupBy(data, (r) => r.Product!)].map(([Product, g]) => ({ Product, ...f(g) })), [{ by: 'Product' }]))
    const scores = (g: Row[]) => g.map((r) => r.Score ?? null)
    const asZero = (g: Row[]) => scores(g).map((s) => s ?? 0)
    return {
      tables: [table('dbo.Ratings', ['RatingID', 'Product', 'Score'], data)],
      query: `SELECT Product,\n       AVG(Score) AS AvgScore,\n       COUNT(Score) AS Rated\nFROM dbo.Ratings\nGROUP BY Product\nORDER BY Product;`,
      correct: by((g) => ({ AvgScore: avg(scores(g)), Rated: countValues(scores(g)) })),
      explain: 'AVG and COUNT(column) both ignore NULLs, so the average uses rated rows only and Rated counts only rows with a score.',
      distractors: [
        { trap: 'nulls-ignored', why: 'It treats NULL scores as 0 in both the average and the count.', table: by((g) => ({ AvgScore: avg(asZero(g)), Rated: g.length })) },
        { trap: 'count-star-vs-column', why: 'The average is right, but Rated counts every row as COUNT(*) would.', table: by((g) => ({ AvgScore: avg(scores(g)), Rated: g.length })) },
        { trap: 'nulls-ignored', why: 'Rated is right, but the average divides by every row, as if NULL were 0.', table: by((g) => ({ AvgScore: avg(asZero(g)), Rated: countValues(scores(g)) })) },
      ],
    }
  },
}

// ── QO-T07 TOP with ORDER BY DESC ─────────────────────────────────────
const t07: OracleTemplate = {
  meta: {
    id: 'QO-T07',
    title: 'Top three products by revenue',
    machineIds: ['inspection-bench'],
    bulletIds: ['P3.2'],
    difficulty: 1,
    sources: [SRC.top, SRC.orderBy],
  },
  language: 'tsql',
  intro: 'A dashboard tile shows the three best-selling products.',
  traps: ['asc-vs-desc', 'take-vs-top', 'operator-order'],
  generate(rand) {
    const prods = sample(rand, products, int(rand, 6, 7))
    const revs = distinctInts(rand, prods.length, 10, 99).map((x) => x * 100)
    const rows: Row[] = prods.map((Product, i) => ({ Product, Revenue: revs[i]! }))
    const cols = ['Product', 'Revenue']
    return {
      tables: [table('dbo.ProductSales', cols, rows)],
      query: `SELECT TOP (3) Product, Revenue\nFROM dbo.ProductSales\nORDER BY Revenue DESC;`,
      correct: result(cols, sortRows(rows, [{ by: 'Revenue', dir: 'desc' }]).slice(0, 3)),
      explain: 'With ORDER BY, TOP (3) returns the first three rows in that order: the highest revenues, highest first.',
      distractors: [
        { trap: 'asc-vs-desc', why: 'It sorts ascending and returns the three lowest revenues.', table: result(cols, sortRows(rows, [{ by: 'Revenue' }]).slice(0, 3)) },
        { trap: 'take-vs-top', why: 'It returns the first three rows as stored, ignoring ORDER BY.', table: result(cols, rows.slice(0, 3)) },
        { trap: 'operator-order', why: 'It takes three rows first and only then sorts them, so it can miss the real top three.', table: result(cols, sortRows(rows.slice(0, 3), [{ by: 'Revenue', dir: 'desc' }])) },
      ],
    }
  },
}

// ── QO-T08 RANK vs DENSE_RANK vs ROW_NUMBER ───────────────────────────
const t08: OracleTemplate = {
  meta: {
    id: 'QO-T08',
    title: 'Ranking with ties',
    machineIds: ['inspection-bench'],
    bulletIds: ['P3.2'],
    difficulty: 2,
    sources: [SRC.rank, SRC.denseRank, SRC.rowNumber, SRC.over],
  },
  language: 'tsql',
  intro: 'Sales reps are ranked by sales. Two reps have the same total.',
  traps: ['rank-ties', 'asc-vs-desc'],
  generate(rand) {
    const fn = pick(rand, ['RANK', 'DENSE_RANK'] as const)
    const reps = sample(rand, names, int(rand, 6, 7))
    const vals = distinctInts(rand, reps.length - 1, 20, 90).map((x) => x * 10)
    vals.sort((a, b) => b - a)
    const tieAt = int(rand, 0, vals.length - 2)
    const sales = [...vals.slice(0, tieAt + 1), vals[tieAt]!, ...vals.slice(tieAt + 1)]
    const rows: Row[] = shuffle(
      rand,
      reps.map((Rep, i) => ({ Rep, Sales: sales[i]! })),
    )
    const ordered = sortRows(rows, [{ by: 'Sales', dir: 'desc' }, { by: 'Rep' }])
    const v = (r: Row) => r.Sales ?? null
    const withRank = (ranks: number[]) => result(['Rep', 'Sales', 'SalesRank'], ordered.map((r, i) => ({ ...r, SalesRank: ranks[i]! })))
    const asc = sortRows(rows, [{ by: 'Sales' }, { by: 'Rep' }])
    const ascRank = (f: typeof rank) => {
      const ranks = f(asc, v)
      return ordered.map((r) => ranks[asc.indexOf(r)]!)
    }
    const main = fn === 'RANK' ? rank : denseRank
    const other = fn === 'RANK' ? denseRank : rank
    return {
      tables: [table('dbo.RepSales', ['Rep', 'Sales'], rows)],
      query: `SELECT Rep, Sales,\n       ${fn}() OVER (ORDER BY Sales DESC) AS SalesRank\nFROM dbo.RepSales\nORDER BY Sales DESC, Rep;`,
      correct: withRank(main(ordered, v)),
      explain:
        fn === 'RANK'
          ? 'RANK gives tied reps the same rank, and the next rep’s rank skips ahead by the number of ties (1, 2, 2, 4…).'
          : 'DENSE_RANK gives tied reps the same rank, and the next rank follows with no gap (1, 2, 2, 3…).',
      distractors: [
        { trap: 'rank-ties', why: fn === 'RANK' ? 'It ranks like DENSE_RANK, with no gap after the tie.' : 'It ranks like RANK, skipping a number after the tie.', table: withRank(other(ordered, v)) },
        { trap: 'rank-ties', why: 'It numbers every row uniquely, like ROW_NUMBER, so tied reps get different ranks.', table: withRank(ordered.map((_, i) => i + 1)) },
        { trap: 'asc-vs-desc', why: 'It ranks the lowest sales as 1, as ORDER BY Sales ASC would.', table: withRank(ascRank(main)) },
      ],
    }
  },
}

// ── QO-T09 Running total frame ────────────────────────────────────────
const t09: OracleTemplate = {
  meta: {
    id: 'QO-T09',
    title: 'Running total by date',
    machineIds: ['twisting-frame'],
    bulletIds: ['P2.5'],
    difficulty: 2,
    sources: [SRC.over, SRC.sum],
  },
  language: 'tsql',
  intro: 'Finance wants each day’s sales with a running total since the first day.',
  traps: ['running-total-frame', 'asc-vs-desc'],
  generate(rand) {
    const days = distinctInts(rand, int(rand, 5, 7), 1, 28).map(day)
    const rows: Row[] = days.map((SaleDate) => ({ SaleDate, Amount: int(rand, 1, 20) * 10 }))
    const ordered = sortRows(rows, [{ by: 'SaleDate' }])
    const amounts = ordered.map((r) => r.Amount ?? null)
    const out = (totals: (number | null)[]) => result(['SaleDate', 'Amount', 'RunningTotal'], ordered.map((r, i) => ({ ...r, RunningTotal: totals[i] ?? null })))
    const grand = sum(amounts)
    const fromEnd = runningSum([...amounts].reverse()).reverse()
    const previous = [null, ...runningSum(amounts).slice(0, -1)]
    return {
      tables: [table('dbo.DailySales', ['SaleDate', 'Amount'], rows)],
      query: `SELECT SaleDate, Amount,\n       SUM(Amount) OVER (\n           ORDER BY SaleDate\n           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW\n       ) AS RunningTotal\nFROM dbo.DailySales\nORDER BY SaleDate;`,
      correct: out(runningSum(amounts)),
      explain: 'The frame runs from the first row (by SaleDate) to the current row, so each total adds every earlier day plus the current one.',
      distractors: [
        { trap: 'running-total-frame', why: 'It sums the whole partition on every row, as a SUM() OVER () with no ORDER BY would.', table: out(amounts.map(() => grand)) },
        { trap: 'asc-vs-desc', why: 'It accumulates from the latest date backward, as ORDER BY SaleDate DESC would.', table: out(fromEnd) },
        { trap: 'running-total-frame', why: 'It stops at the previous row (1 PRECEDING), leaving out the current day.', table: out(previous) },
      ],
    }
  },
}

// ── QO-T10 LAG ────────────────────────────────────────────────────────
const t10: OracleTemplate = {
  meta: {
    id: 'QO-T10',
    title: 'Month-over-month change',
    machineIds: ['inspection-bench'],
    bulletIds: ['P3.2'],
    difficulty: 2,
    sources: [SRC.lag, SRC.over],
  },
  language: 'tsql',
  intro: 'An analyst compares each month’s revenue with the month before.',
  traps: ['lag-vs-lead', 'null-not-zero'],
  generate(rand) {
    const start = int(rand, 1, 6)
    const months = Array.from({ length: int(rand, 5, 6) }, (_, i) => `2026-${String(start + i).padStart(2, '0')}`)
    const rows: Row[] = shuffle(
      rand,
      months.map((Month) => ({ Month, Revenue: int(rand, 10, 40) * 100 })),
    )
    const ordered = sortRows(rows, [{ by: 'Month' }])
    const rev = ordered.map((r) => r.Revenue as number)
    const out = (changes: (number | null)[]) => result(['Month', 'Revenue', 'Change'], ordered.map((r, i) => ({ ...r, Change: changes[i] ?? null })))
    const diff = (other: (number | null)[]) => rev.map((v, i) => (other[i] === null ? null : v - (other[i] as number)))
    const prev = lag(rev) as (number | null)[]
    return {
      tables: [table('dbo.MonthlyRevenue', ['Month', 'Revenue'], rows)],
      query: `SELECT Month, Revenue,\n       Revenue - LAG(Revenue) OVER (ORDER BY Month) AS Change\nFROM dbo.MonthlyRevenue\nORDER BY Month;`,
      correct: out(diff(prev)),
      explain: 'LAG reads the previous month’s revenue. The first month has no previous row, so LAG returns NULL and the subtraction is NULL.',
      distractors: [
        { trap: 'lag-vs-lead', why: 'It compares with the next month (LEAD), so the last month is NULL instead of the first.', table: out(diff(lead(rev) as (number | null)[])) },
        { trap: 'null-not-zero', why: 'It shows the first month’s change as 0, but there’s no previous value to subtract.', table: out(diff(prev).map((x) => x ?? 0)) },
        { trap: 'null-not-zero', why: 'It treats the missing previous value as 0, so the first month’s change equals its revenue.', table: out(diff(lag(rev, 1, 0) as (number | null)[])) },
      ],
    }
  },
}

// ── QO-T11 NULLs in GROUP BY with COALESCE ────────────────────────────
const t11: OracleTemplate = {
  meta: {
    id: 'QO-T11',
    title: 'Orders by channel with missing values',
    machineIds: ['carding-machine'],
    bulletIds: ['P2.7'],
    difficulty: 3,
    sources: [SRC.coalesce, SRC.groupBy, SRC.count],
  },
  language: 'tsql',
  intro: 'Some orders have no Channel recorded (NULL), and a few were already labelled “Unknown”. The query groups both together.',
  traps: ['null-group'],
  generate(rand) {
    const base = sample(rand, ['Store', 'Web', 'Phone'], 2)
    const channels: (string | null)[] = [base[0]!, base[0]!, base[1]!, 'Unknown', null, null]
    const extra = int(rand, 1, 3)
    for (let i = 0; i < extra; i++) channels.push(pick(rand, [base[0]!, base[1]!, null, 'Unknown']))
    const rows: Row[] = shuffle(rand, channels).map((Channel, i) => ({ OrderID: 301 + i, Channel, Amount: int(rand, 2, 20) * 5 }))
    const label = (r: Row) => r.Channel ?? 'Unknown'
    const out = (groups: Row[]) => result(['ChannelName', 'Orders'], sortRows(groups, [{ by: 'ChannelName' }]))
    const grouped = (key: (r: Row) => string | number | null, count: (g: Row[]) => number, name: (k: string | number | null) => string | number | null) =>
      [...groupBy(rows, key)].map(([k, g]) => ({ ChannelName: name(k), Orders: count(g) }))
    return {
      tables: [table('dbo.Orders', ['OrderID', 'Channel', 'Amount'], rows)],
      query: `SELECT COALESCE(Channel, 'Unknown') AS ChannelName,\n       COUNT(*) AS Orders\nFROM dbo.Orders\nGROUP BY COALESCE(Channel, 'Unknown')\nORDER BY ChannelName;`,
      correct: out(grouped(label, (g) => g.length, (k) => k)),
      explain: 'The query groups by the COALESCE expression, so NULL channels become “Unknown” before grouping and merge with the rows already labelled “Unknown”. COUNT(*) counts all of them.',
      distractors: [
        { trap: 'null-group', why: 'It drops the NULL rows, but GROUP BY keeps NULLs (here they become “Unknown”).', table: out(grouped(label, (g) => g.filter((r) => r.Channel !== null).length, (k) => k).filter((g) => (g.Orders as number) > 0)) },
        { trap: 'null-group', why: 'It groups by the raw Channel and relabels afterwards, giving two separate “Unknown” rows.', table: out(grouped((r) => r.Channel ?? null, (g) => g.length, (k) => k ?? 'Unknown')) },
        { trap: 'null-group', why: 'It keeps the NULL rows as their own group with a NULL name, as GROUP BY Channel without COALESCE would.', table: out(grouped((r) => r.Channel ?? null, (g) => g.length, (k) => k)) },
      ],
    }
  },
}

// ── QO-T12 UNION vs UNION ALL ─────────────────────────────────────────
const t12: OracleTemplate = {
  meta: {
    id: 'QO-T12',
    title: 'Combining two buyer lists',
    machineIds: ['twisting-frame'],
    bulletIds: ['P2.6'],
    difficulty: 1,
    sources: [SRC.union, SRC.orderBy],
    trapPairId: 'merge-vs-append',
  },
  language: 'tsql',
  intro: 'Two tables list customer IDs that bought in store and online. A customer can appear in both, and more than once in one.',
  traps: ['union-vs-union-all', 'asc-vs-desc'],
  generate(rand) {
    const op = pick(rand, ['UNION', 'UNION ALL'] as const)
    const ids = sample(rand, [21, 22, 23, 24, 25, 26, 27, 28], 7)
    const store = shuffle(rand, [...ids.slice(0, 4), ids[0]!])
    const web = shuffle(rand, [...ids.slice(2, 7)])
    const all = [...store, ...web].map((CustomerID) => ({ CustomerID }))
    const out = (rows: Row[], dir: 'asc' | 'desc' = 'asc') => result(['CustomerID'], sortRows(rows, [{ by: 'CustomerID', dir }]))
    const dedupAll = distinct(all, ['CustomerID'])
    const crossOnly = [...store.map((CustomerID) => ({ CustomerID })), ...web.filter((x) => !store.includes(x)).map((CustomerID) => ({ CustomerID }))]
    const correct = op === 'UNION' ? dedupAll : all
    return {
      tables: [table('dbo.StoreBuyers', ['CustomerID'], store.map((CustomerID) => ({ CustomerID }))), table('dbo.WebBuyers', ['CustomerID'], web.map((CustomerID) => ({ CustomerID })))],
      query: `SELECT CustomerID FROM dbo.StoreBuyers\n${op}\nSELECT CustomerID FROM dbo.WebBuyers\nORDER BY CustomerID;`,
      correct: out(correct),
      explain: op === 'UNION' ? 'UNION removes every duplicate row, including a customer repeated inside one table, so each ID appears once.' : 'UNION ALL keeps every row from both queries, duplicates included.',
      distractors: [
        { trap: 'union-vs-union-all', why: op === 'UNION' ? 'It keeps duplicates, as UNION ALL would.' : 'It removes duplicates, as UNION would.', table: out(op === 'UNION' ? all : dedupAll) },
        { trap: 'union-vs-union-all', why: 'It removes only IDs that appear in both tables and keeps a repeat within one table.', table: out(crossOnly) },
        { trap: 'asc-vs-desc', why: 'It sorts descending, but ORDER BY defaults to ascending.', table: out(correct, 'desc') },
      ],
    }
  },
}

// ── QO-T13 CASE buckets ───────────────────────────────────────────────
const t13: OracleTemplate = {
  meta: {
    id: 'QO-T13',
    title: 'Bucketing orders by size',
    machineIds: ['twisting-frame'],
    bulletIds: ['P2.5'],
    difficulty: 2,
    sources: [SRC.caseExpr, SRC.groupBy, SRC.count],
  },
  language: 'tsql',
  intro: 'Orders are grouped into size bands. One order has no amount recorded (NULL).',
  traps: ['case-first-match', 'range-boundary'],
  generate(rand) {
    const hi = pick(rand, [100, 200])
    const lo = hi / 2
    const amounts: (number | null)[] = [hi, lo, null, int(rand, 1, 4) * (lo / 5), hi + int(rand, 1, 5) * 10, lo + int(rand, 1, 4) * 5]
    const extra = int(rand, 1, 3)
    for (let i = 0; i < extra; i++) amounts.push(int(rand, 1, 30) * 10)
    const rows: Row[] = shuffle(rand, amounts).map((Amount, i) => ({ OrderID: 401 + i, Amount }))
    const bucket = (a: number | null, gte: boolean, lastWins: boolean) => {
      const ge = (x: number, t: number) => (gte ? x >= t : x > t)
      if (a === null) return 'Small'
      if (lastWins) return ge(a, lo) ? 'Medium' : ge(a, hi) ? 'Large' : 'Small'
      return ge(a, hi) ? 'Large' : ge(a, lo) ? 'Medium' : 'Small'
    }
    const out = (rs: Row[], f: (a: number | null) => string) =>
      result(['Size', 'Orders'], sortRows([...groupBy(rs, (r) => f((r.Amount as number | null) ?? null))].map(([Size, g]) => ({ Size, Orders: g.length })), [{ by: 'Size' }]))
    const caseText = `CASE WHEN Amount >= ${hi} THEN 'Large'\n            WHEN Amount >= ${lo} THEN 'Medium'\n            ELSE 'Small' END`
    return {
      tables: [table('dbo.Orders', ['OrderID', 'Amount'], rows)],
      query: `SELECT ${caseText} AS Size,\n       COUNT(*) AS Orders\nFROM dbo.Orders\nGROUP BY ${caseText}\nORDER BY Size;`,
      correct: out(rows, (a) => bucket(a, true, false)),
      explain: `CASE returns the first WHEN that’s true, so ${hi} and above is Large and ${lo} up to ${hi - 1} is Medium. A NULL amount makes both comparisons unknown, so it falls to ELSE (Small).`,
      distractors: [
        { trap: 'case-first-match', why: 'It lets a later WHEN win, so large orders end up as Medium.', table: out(rows, (a) => bucket(a, true, true)) },
        { trap: 'range-boundary', why: `It treats >= as >, so exactly ${hi} and exactly ${lo} drop a band.`, table: out(rows, (a) => bucket(a, false, false)) },
        { trap: 'case-first-match', why: 'It leaves the NULL amount out, but a NULL comparison falls through to ELSE.', table: out(rows.filter((r) => r.Amount !== null), (a) => bucket(a, true, false)) },
      ],
    }
  },
}

// ── QO-T14 COUNT DISTINCT, WHERE, ORDER BY DESC ───────────────────────
const t14: OracleTemplate = {
  meta: {
    id: 'QO-T14',
    title: 'Customers and revenue since July',
    machineIds: ['inspection-bench'],
    bulletIds: ['P3.2'],
    difficulty: 2,
    sources: [SRC.count, SRC.where, SRC.orderBy, SRC.sum],
  },
  language: 'tsql',
  intro: 'Sales wants, per region, how many different customers ordered since 1 July and the revenue from those orders, biggest region first.',
  traps: ['distinct-count', 'asc-vs-desc', 'ignored-predicate'],
  generate(rand) {
    const regs = sample(rand, regions, 3)
    const n = int(rand, 8, 10)
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({
      OrderID: 801 + i,
      Region: regs[i % 3]!,
      CustomerID: i < 2 ? 31 : pick(rand, [31, 32, 33, 34]),
      Amount: int(rand, 2, 40) * 10,
      OrderDate: pick(rand, ['2026-06-12', '2026-06-28', '2026-07-01', '2026-07-15', '2026-08-03']),
    }))
    rows[1] = { ...rows[1]!, Region: rows[0]!.Region!, OrderDate: '2026-07-15' }
    rows[0] = { ...rows[0]!, OrderDate: '2026-07-01' }
    const since = rows.filter((r) => (r.OrderDate as string) >= '2026-07-01')
    const agg = (rs: Row[], customers: (g: Row[]) => number, dir: 'asc' | 'desc') =>
      result(
        ['Region', 'Customers', 'Revenue'],
        sortRows(
          [...groupBy(rs, (r) => r.Region!)].map(([Region, g]) => ({ Region, Customers: customers(g), Revenue: sum(g.map((r) => r.Amount!)) })),
          [{ by: 'Revenue', dir }],
        ),
      )
    const distinctCustomers = (g: Row[]) => countDistinct(g.map((r) => r.CustomerID!))
    const totals = (rs: Row[]) => [...groupBy(rs, (r) => r.Region!)].map(([, g]) => sum(g.map((r) => r.Amount!)))
    const tie = (xs: (number | null)[]) => new Set(xs).size !== xs.length
    return {
      reject: tie(totals(since)) || tie(totals(rows)) ? 'two regions tie on revenue, so the order is ambiguous' : undefined,
      tables: [table('dbo.Orders', ['OrderID', 'Region', 'CustomerID', 'Amount', 'OrderDate'], rows)],
      query: `SELECT Region,\n       COUNT(DISTINCT CustomerID) AS Customers,\n       SUM(Amount) AS Revenue\nFROM dbo.Orders\nWHERE OrderDate >= '2026-07-01'\nGROUP BY Region\nORDER BY Revenue DESC;`,
      correct: agg(since, distinctCustomers, 'desc'),
      explain: 'WHERE keeps orders on or after 1 July. COUNT(DISTINCT CustomerID) counts each customer once per region, and the regions are listed from the highest revenue down.',
      distractors: [
        { trap: 'distinct-count', why: 'It counts orders, not different customers, as COUNT(CustomerID) would.', table: agg(since, (g) => g.length, 'desc') },
        { trap: 'asc-vs-desc', why: 'It lists the smallest revenue first.', table: agg(since, distinctCustomers, 'asc') },
        { trap: 'ignored-predicate', why: 'It ignores the date filter and includes June orders.', table: agg(rows, distinctCustomers, 'desc') },
      ],
    }
  },
}

export const tsqlTemplates: OracleTemplate[] = [t01, t02, t03, t04, t05, t06, t07, t08, t09, t10, t11, t12, t13, t14]
