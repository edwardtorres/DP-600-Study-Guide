import { avg, countDistinct, countValues, distinctInts, groupBy, int, pick, result, sample, shuffle, sortRows, sum, table, type Rand, type Row } from './engine'
import type { OracleTemplate } from './template'
import { SRC } from './traps'

/**
 * DAX query predict-the-result templates. Results are computed in TypeScript
 * from the generated model data, following the filter-context rules each
 * template cites; nothing is hand-written.
 */

const DQ = 'https://learn.microsoft.com/en-us/dax/dax-queries'
const REL = 'Relationship: ’Product’[Product] (one) to Sales[Product] (many), single direction.'

const daxScale = (id: string, title: string, difficulty: 1 | 2 | 3, sources: string[]) => ({
  id,
  title,
  machineIds: ['dax-scale'],
  bulletIds: ['P3.4'],
  difficulty,
  sources: [DQ, SRC.dEvaluate, ...sources],
  trapPairId: 'query-measure-vs-model-measure',
})
const punchCard = (id: string, title: string, difficulty: 1 | 2 | 3, sources: string[]) => ({
  id,
  title,
  machineIds: ['punch-card-reader'],
  bulletIds: ['S1.4'],
  difficulty,
  sources: [DQ, SRC.dEvaluate, ...sources],
})

const catalog: Record<string, string[]> = {
  Tools: ['Drill', 'Saw', 'Hammer'],
  Garden: ['Hose', 'Rake', 'Spade'],
  Paint: ['Brush', 'Roller', 'Primer'],
  Lights: ['Lamp', 'Bulb', 'Torch'],
}

/** A Product dimension with 3–4 categories (one with no sales) and a Sales fact. */
function productModel(rand: Rand, opts: { emptyCategory: boolean; salesRows: [number, number] }) {
  const cats = sample(rand, Object.keys(catalog), opts.emptyCategory ? 4 : 3).sort()
  const empty = opts.emptyCategory ? cats[cats.length - 1 - int(rand, 0, 1)]! : null
  const products: Row[] = cats.flatMap((Category) => sample(rand, catalog[Category]!, Category === empty ? 1 : 2).map((Product) => ({ Product, Category })))
  const sellable = products.filter((p) => p.Category !== empty)
  const n = int(rand, opts.salesRows[0], opts.salesRows[1])
  // Every sellable category gets at least one sale.
  const firstPerCat = [...groupBy(sellable, (p) => p.Category!)].map(([, g]) => g[0]!)
  const sold = [...firstPerCat, ...Array.from({ length: n - firstPerCat.length }, () => pick(rand, sellable))]
  return { cats, empty, products, sold: shuffle(rand, sold) }
}

const catOf = (products: Row[], name: string | number | null) => products.find((p) => p.Product === name)?.Category ?? null

// ── QO-D01 SUMMARIZECOLUMNS drops all-blank rows ──────────────────────
const d01: OracleTemplate = {
  meta: daxScale('QO-D01', 'Revenue and orders by category', 1, [SRC.dSummarizeColumns, SRC.dSum, SRC.dCountRows]),
  language: 'dax',
  intro: `One product category has no sales yet. ${REL}`,
  traps: ['summarizecolumns-blank', 'filter-context', 'distinct-count'],
  generate(rand) {
    const { cats, empty, products, sold } = productModel(rand, { emptyCategory: true, salesRows: [6, 8] })
    const sales: Row[] = sold.map((p, i) => ({ OrderID: 1 + i, Product: p.Product!, Amount: int(rand, 1, 20) * 10 }))
    const groups = (rs: Row[]) => groupBy(rs, (s) => catOf(products, s.Product ?? null))
    const g = groups(sales)
    const cols = ["Product[Category]", '[Revenue]', '[Orders]']
    const row = (Category: string, rs: Row[]) => ({ [cols[0]!]: Category, [cols[1]!]: sum(rs.map((r) => r.Amount!)), [cols[2]!]: rs.length || null })
    const listed = cats.filter((c) => g.has(c))
    const grand = sum(sales.map((s) => s.Amount!))
    return {
      tables: [table('Product', ['Product', 'Category'], products), table('Sales', ['OrderID', 'Product', 'Amount'], sales)],
      query: `EVALUATE\nSUMMARIZECOLUMNS (\n    'Product'[Category],\n    "Revenue", SUM ( Sales[Amount] ),\n    "Orders", COUNTROWS ( Sales )\n)\nORDER BY 'Product'[Category]`,
      correct: result(cols, listed.map((c) => row(c, g.get(c)!))),
      explain: `Each category’s row is evaluated in its own filter context, flowing to Sales through the relationship. ${empty} has no sales, so both expressions are blank and SUMMARIZECOLUMNS leaves the row out.`,
      distractors: [
        { trap: 'summarizecolumns-blank', why: `It keeps ${empty} with blank values, but rows where every expression is blank are removed.`, table: result(cols, cats.map((c) => row(c, g.get(c) ?? []))) },
        { trap: 'filter-context', why: 'It shows the grand totals on every row, as if the category didn’t filter Sales.', table: result(cols, listed.map((c) => ({ [cols[0]!]: c, [cols[1]!]: grand, [cols[2]!]: sales.length }))) },
        { trap: 'distinct-count', why: 'It counts distinct products sold instead of Sales rows; COUNTROWS counts every row.', table: result(cols, listed.map((c) => ({ ...row(c, g.get(c)!), [cols[2]!]: countDistinct(g.get(c)!.map((r) => r.Product!)) }))) },
      ],
    }
  },
}

// ── QO-D02 CALCULATE replaces the filter on a column ──────────────────
const d02: OracleTemplate = {
  meta: punchCard('QO-D02', 'A filtered measure by color', 2, [SRC.dCalculate, SRC.dDefine, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: `A query-scoped measure filters to red products. ${REL}`,
  traps: ['calculate-replaces-filter', 'filter-context'],
  generate(rand) {
    const colors = ['Black', 'Blue', 'Red']
    const products: Row[] = sample(rand, ['Bolt', 'Cog', 'Gear', 'Lever', 'Spool', 'Valve'], 5).map((Product, i) => ({ Product, Color: i < 3 ? colors[i]! : pick(rand, colors) }))
    const sales: Row[] = Array.from({ length: int(rand, 6, 8) }, (_, i) => ({ OrderID: 1 + i, Product: i < 3 ? products[i]!.Product! : pick(rand, products).Product!, Amount: int(rand, 1, 20) * 10 }))
    const color = (s: Row) => products.find((p) => p.Product === s.Product)?.Color ?? null
    const byColor = groupBy(sales, color)
    const total = (c: string) => sum((byColor.get(c) ?? []).map((r) => r.Amount!))
    const red = total('Red')
    const grand = sum(sales.map((s) => s.Amount!))
    const cols = ['Product[Color]', '[Revenue]', '[Red Revenue]']
    const listed = colors.filter((c) => byColor.has(c))
    const out = (f: (c: string) => number | null) => result(cols, listed.map((c) => ({ [cols[0]!]: c, [cols[1]!]: total(c), [cols[2]!]: f(c) })))
    return {
      tables: [table('Product', ['Product', 'Color'], products), table('Sales', ['OrderID', 'Product', 'Amount'], sales)],
      query: `DEFINE\n    MEASURE Sales[Red Revenue] =\n        CALCULATE ( SUM ( Sales[Amount] ), 'Product'[Color] = "Red" )\nEVALUATE\nSUMMARIZECOLUMNS (\n    'Product'[Color],\n    "Revenue", SUM ( Sales[Amount] ),\n    "Red Revenue", [Red Revenue]\n)\nORDER BY 'Product'[Color]`,
      correct: out(() => red),
      explain: 'The boolean filter in CALCULATE replaces whatever filter the row puts on Product[Color], so every row shows the red total.',
      distractors: [
        { trap: 'calculate-replaces-filter', why: 'It intersects the filters, as KEEPFILTERS would: only the Red row has a value.', table: out((c) => (c === 'Red' ? red : null)) },
        { trap: 'filter-context', why: 'It ignores the CALCULATE filter, so Red Revenue equals each row’s revenue.', table: out((c) => total(c)) },
        { trap: 'calculate-replaces-filter', why: 'It removes every filter and shows the grand total, but CALCULATE only replaces the filter on Color.', table: out(() => grand) },
      ],
    }
  },
}

// ── QO-D03 KEEPFILTERS intersects ─────────────────────────────────────
const d03: OracleTemplate = {
  meta: punchCard('QO-D03', 'KEEPFILTERS by color', 3, [SRC.dKeepFilters, SRC.dCalculate, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: `The measure wraps its filter in KEEPFILTERS. ${REL}`,
  traps: ['calculate-replaces-filter', 'summarizecolumns-blank', 'null-not-zero'],
  generate(rand) {
    const colors = ['Black', 'Blue', 'Red']
    const products: Row[] = sample(rand, ['Bolt', 'Cog', 'Gear', 'Lever', 'Spool', 'Valve'], 5).map((Product, i) => ({ Product, Color: i < 3 ? colors[i]! : pick(rand, colors) }))
    const sales: Row[] = Array.from({ length: int(rand, 6, 8) }, (_, i) => ({ OrderID: 1 + i, Product: i < 3 ? products[i]!.Product! : pick(rand, products).Product!, Amount: int(rand, 1, 20) * 10 }))
    const color = (s: Row) => products.find((p) => p.Product === s.Product)?.Color ?? null
    const byColor = groupBy(sales, color)
    const total = (c: string) => sum((byColor.get(c) ?? []).map((r) => r.Amount!))
    const red = total('Red')
    const cols = ['Product[Color]', '[Revenue]', '[Red Revenue]']
    const listed = colors.filter((c) => byColor.has(c))
    const out = (cs: string[], f: (c: string) => number | null) => result(cols, cs.map((c) => ({ [cols[0]!]: c, [cols[1]!]: total(c), [cols[2]!]: f(c) })))
    return {
      tables: [table('Product', ['Product', 'Color'], products), table('Sales', ['OrderID', 'Product', 'Amount'], sales)],
      query: `DEFINE\n    MEASURE Sales[Red Revenue] =\n        CALCULATE (\n            SUM ( Sales[Amount] ),\n            KEEPFILTERS ( 'Product'[Color] = "Red" )\n        )\nEVALUATE\nSUMMARIZECOLUMNS (\n    'Product'[Color],\n    "Revenue", SUM ( Sales[Amount] ),\n    "Red Revenue", [Red Revenue]\n)\nORDER BY 'Product'[Color]`,
      correct: out(listed, (c) => (c === 'Red' ? red : null)),
      explain: 'KEEPFILTERS intersects “Red” with the row’s own color filter. Only the Red row has a value; the other rows are blank, but they stay because Revenue isn’t blank.',
      distractors: [
        { trap: 'calculate-replaces-filter', why: 'It replaces the row’s color filter, which is what CALCULATE does without KEEPFILTERS.', table: out(listed, () => red) },
        { trap: 'summarizecolumns-blank', why: 'It drops the non-red rows, but a row stays when any expression (here Revenue) isn’t blank.', table: out(listed.filter((c) => c === 'Red'), () => red) },
        { trap: 'null-not-zero', why: 'It shows 0 where the intersection is empty, but the measure returns blank.', table: out(listed, (c) => (c === 'Red' ? red : 0)) },
      ],
    }
  },
}

// ── QO-D04 Share of total with ALL / REMOVEFILTERS ────────────────────
const d04: OracleTemplate = {
  meta: punchCard('QO-D04', 'Share of total by category', 2, [SRC.dRemoveFilters, SRC.dAll, SRC.dDivide, SRC.dCalculate]),
  language: 'dax',
  intro: `The measure divides each category’s revenue by the revenue of all categories. ${REL}`,
  traps: ['all-vs-removefilters', 'asc-vs-desc'],
  generate(rand) {
    const fn = pick(rand, ['REMOVEFILTERS', 'ALL'] as const)
    const { cats, products, sold } = productModel(rand, { emptyCategory: false, salesRows: [6, 7] })
    const total = pick(rand, [100, 200, 400])
    const unit = total / 100
    // Category totals are whole percentages of the grand total.
    const shares = [int(rand, 15, 40), int(rand, 15, 40)]
    shares.push(100 - shares[0]! - shares[1]!)
    const catAmount = new Map(cats.map((c, i) => [c, shares[i]! * unit]))
    const byCat = groupBy(sold, (p) => p.Category!)
    const sales: Row[] = []
    for (const [c, ps] of byCat) {
      let left = catAmount.get(c as string)!
      ps.forEach((p, j) => {
        const amt = j === ps.length - 1 ? left : Math.max(unit, Math.floor((left / (ps.length - j)) / unit) * unit)
        left -= amt
        sales.push({ Product: p.Product!, Amount: amt })
      })
    }
    const data: Row[] = shuffle(rand, sales).map((s, i) => ({ OrderID: 1 + i, ...s }))
    const cols = ['Product[Category]', '[Revenue]', '[Share %]']
    const rev = (c: string) => sum(data.filter((s) => catOf(products, s.Product ?? null) === c).map((s) => s.Amount!)) as number
    const out = (f: (c: string) => Row, dir: 'asc' | 'desc' = 'asc') => result(cols, sortRows(cats.map((c) => ({ [cols[0]!]: c, ...f(c) })), [{ by: cols[0]!, dir }]))
    return {
      reject: data.some((s) => (s.Amount as number) <= 0) ? 'a non-positive amount' : undefined,
      tables: [table('Product', ['Product', 'Category'], products), table('Sales', ['OrderID', 'Product', 'Amount'], data)],
      query: `DEFINE\n    MEASURE Sales[Share %] =\n        DIVIDE (\n            SUM ( Sales[Amount] ),\n            CALCULATE ( SUM ( Sales[Amount] ), ${fn} ( 'Product'[Category] ) )\n        ) * 100\nEVALUATE\nSUMMARIZECOLUMNS (\n    'Product'[Category],\n    "Revenue", SUM ( Sales[Amount] ),\n    "Share %", [Share %]\n)\nORDER BY 'Product'[Category]`,
      correct: out((c) => ({ [cols[1]!]: rev(c), [cols[2]!]: (rev(c) * 100) / total })),
      explain: `${fn} ( 'Product'[Category] ) inside CALCULATE clears the category filter for the denominator only, so each row divides its own revenue by the total of ${total}.`,
      distractors: [
        { trap: 'all-vs-removefilters', why: 'Without clearing the category filter, the denominator equals the numerator, so every share is 100.', table: out((c) => ({ [cols[1]!]: rev(c), [cols[2]!]: 100 })) },
        { trap: 'all-vs-removefilters', why: `It also clears the filter for the Revenue column, but ${fn} only affects the CALCULATE it’s in.`, table: out(() => ({ [cols[1]!]: total, [cols[2]!]: 100 })) },
        { trap: 'asc-vs-desc', why: 'It sorts categories descending; ORDER BY defaults to ascending.', table: out((c) => ({ [cols[1]!]: rev(c), [cols[2]!]: (rev(c) * 100) / total }), 'desc') },
      ],
    }
  },
}

// ── QO-D05 DIVIDE returns BLANK on zero ───────────────────────────────
const d05: OracleTemplate = {
  meta: punchCard('QO-D05', 'Profit per unit with free samples', 2, [SRC.dDivide, SRC.dSummarizeColumns, SRC.dSumx]),
  language: 'dax',
  intro: 'The Samples region ships free samples: quantity 0, with a negative profit for the cost.',
  traps: ['divide-blank', 'summarizecolumns-blank', 'iterator-vs-aggregate'],
  generate(rand) {
    const regs = sample(rand, ['East', 'North', 'West'], 2).sort()
    const sales: Row[] = []
    for (const r of regs) {
      // Each region has one profit per unit, so the per-unit value is a whole number.
      const unit = int(rand, 2, 9)
      for (let j = 0, n = int(rand, 2, 3); j < n; j++) {
        const Qty = int(rand, 1, 5)
        sales.push({ Region: r, Qty, Profit: Qty * unit })
      }
    }
    sales.push({ Region: 'Samples', Qty: 0, Profit: -int(rand, 1, 5) * 10 })
    if (sales.length < 7) sales.push({ Region: 'Samples', Qty: 0, Profit: -int(rand, 1, 5) * 10 })
    const data: Row[] = shuffle(rand, sales).map((s, i) => ({ OrderID: 1 + i, ...s }))
    const regions = [...regs, 'Samples'].sort()
    const cols = ['Sales[Region]', '[Profit]', '[Per Unit]']
    const g = groupBy(data, (s) => s.Region!)
    const p = (r: string) => sum(g.get(r)!.map((s) => s.Profit!)) as number
    const q = (r: string) => sum(g.get(r)!.map((s) => s.Qty!)) as number
    const div = (a: number, b: number) => (b === 0 ? null : a / b)
    const out = (rs: string[], f: (r: string) => number | null) => result(cols, rs.map((r) => ({ [cols[0]!]: r, [cols[1]!]: p(r), [cols[2]!]: f(r) })))
    const perRow = (r: string) => {
      const vals = g.get(r)!.map((s) => div(s.Profit as number, s.Qty as number)).filter((x): x is number => x !== null)
      return vals.length ? vals.reduce((a, b) => a + b, 0) : null
    }
    const nonInt = regs.some((r) => !Number.isInteger(p(r) / q(r)))
    return {
      reject: nonInt ? 'per-unit values aren’t whole numbers' : undefined,
      tables: [table('Sales', ['OrderID', 'Region', 'Qty', 'Profit'], data)],
      query: `EVALUATE\nSUMMARIZECOLUMNS (\n    Sales[Region],\n    "Profit", SUM ( Sales[Profit] ),\n    "Per Unit", DIVIDE ( SUM ( Sales[Profit] ), SUM ( Sales[Qty] ) )\n)\nORDER BY Sales[Region]`,
      correct: out(regions, (r) => div(p(r), q(r))),
      explain: 'DIVIDE returns BLANK when the denominator is 0, so Samples shows a blank Per Unit. Its row stays because Profit isn’t blank.',
      distractors: [
        { trap: 'divide-blank', why: 'It shows 0 for Samples, but DIVIDE returns BLANK unless you pass an alternate result.', table: out(regions, (r) => div(p(r), q(r)) ?? 0) },
        { trap: 'summarizecolumns-blank', why: 'It drops the Samples row, but the row has a non-blank Profit.', table: out(regs, (r) => div(p(r), q(r))) },
        { trap: 'iterator-vs-aggregate', why: 'It divides row by row and adds the results, as SUMX ( Sales, DIVIDE ( … ) ) would.', table: out(regions, perRow) },
      ],
    }
  },
}

// ── QO-D06 COUNTROWS vs DISTINCTCOUNT (counts BLANK) ──────────────────
const d06: OracleTemplate = {
  meta: daxScale('QO-D06', 'Orders and customers per region', 2, [SRC.dCountRows, SRC.dDistinctCount, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: 'Guest checkouts have a blank Customer.',
  traps: ['distinctcount-blank', 'distinct-count'],
  generate(rand) {
    const regs = sample(rand, ['East', 'North', 'South', 'West'], 2).sort()
    const custs = ['C1', 'C2', 'C3', 'C4']
    const rows: Row[] = [
      { Region: regs[0]!, Customer: 'C1' },
      { Region: regs[0]!, Customer: 'C1' },
      { Region: regs[0]!, Customer: null },
      { Region: regs[1]!, Customer: null },
      { Region: regs[1]!, Customer: null },
    ]
    for (let i = 0, n = int(rand, 1, 4); i < n; i++) rows.push({ Region: pick(rand, regs), Customer: pick(rand, [...custs, null]) })
    const data = shuffle(rand, rows).map((r, i) => ({ OrderID: 1 + i, ...r }))
    const cols = ['Sales[Region]', '[Orders]', '[Customers]']
    const g = groupBy(data, (r) => r.Region!)
    const withBlank = (rs: Row[]) => new Set(rs.map((r) => r.Customer ?? null)).size
    const out = (f: (rs: Row[]) => [number, number]) => result(cols, regs.map((r) => ({ [cols[0]!]: r, [cols[1]!]: f(g.get(r)!)[0], [cols[2]!]: f(g.get(r)!)[1] })))
    return {
      tables: [table('Sales', ['OrderID', 'Region', 'Customer'], data)],
      query: `EVALUATE\nSUMMARIZECOLUMNS (\n    Sales[Region],\n    "Orders", COUNTROWS ( Sales ),\n    "Customers", DISTINCTCOUNT ( Sales[Customer] )\n)\nORDER BY Sales[Region]`,
      correct: out((rs) => [rs.length, withBlank(rs)]),
      explain: 'COUNTROWS counts every Sales row. DISTINCTCOUNT counts each distinct value once, and it counts BLANK as one of the values.',
      distractors: [
        { trap: 'distinctcount-blank', why: 'It skips BLANK, as DISTINCTCOUNTNOBLANK would.', table: out((rs) => [rs.length, countDistinct(rs.map((r) => r.Customer ?? null))]) },
        { trap: 'distinct-count', why: 'It counts every row in Customers, not distinct values.', table: out((rs) => [rs.length, rs.length]) },
        { trap: 'distinctcount-blank', why: 'It leaves rows with a blank Customer out of COUNTROWS, which counts every row.', table: out((rs) => [countValues(rs.map((r) => r.Customer ?? null)), withBlank(rs)]) },
      ],
    }
  },
}

// ── QO-D07 SUMX vs SUM × SUM ──────────────────────────────────────────
const d07: OracleTemplate = {
  meta: punchCard('QO-D07', 'Revenue from quantity and price', 1, [SRC.dSumx, SRC.dSum, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: 'Sales stores quantity and unit price per line; revenue isn’t stored.',
  traps: ['iterator-vs-aggregate', 'filter-context'],
  generate(rand) {
    const regs = sample(rand, ['East', 'North', 'South', 'West'], 2).sort()
    // Prices sit symmetrically around a mean, so average price × quantity is a whole number.
    const rows: Row[] = regs.flatMap((Region) => {
      const k = int(rand, 2, 3)
      const mean = int(rand, 3, 7)
      const d = int(rand, 1, 2)
      const prices = k === 2 ? [mean - d, mean + d] : [mean - d, mean, mean + d]
      return prices.map((p) => ({ Region, Qty: int(rand, 1, 5), Price: p * 5 }))
    })
    const data = shuffle(rand, rows).map((r, i) => ({ Line: 1 + i, ...r }))
    const cols = ['Sales[Region]', '[Revenue]']
    const g = groupBy(data, (r) => r.Region!)
    const sx = (rs: Row[]) => rs.reduce((a, r) => a + (r.Qty as number) * (r.Price as number), 0)
    const out = (f: (rs: Row[]) => number) => result(cols, regs.map((r) => ({ [cols[0]!]: r, [cols[1]!]: f(g.get(r)!) })))
    const s = (rs: Row[], c: string) => sum(rs.map((r) => r[c] ?? null)) as number
    return {
      reject: regs.some((r) => !Number.isInteger(s(g.get(r)!, 'Qty') * (avg(g.get(r)!.map((x) => x.Price ?? null)) as number))) ? 'average price × quantity isn’t whole' : undefined,
      tables: [table('Sales', ['Line', 'Region', 'Qty', 'Price'], data)],
      query: `EVALUATE\nSUMMARIZECOLUMNS (\n    Sales[Region],\n    "Revenue", SUMX ( Sales, Sales[Qty] * Sales[Price] )\n)\nORDER BY Sales[Region]`,
      correct: out(sx),
      explain: 'SUMX iterates the Sales rows in each region’s filter context, multiplies Qty by Price on each row, and adds the results.',
      distractors: [
        { trap: 'iterator-vs-aggregate', why: 'It multiplies the total quantity by the total of the prices.', table: out((rs) => s(rs, 'Qty') * s(rs, 'Price')) },
        { trap: 'iterator-vs-aggregate', why: 'It multiplies the total quantity by the average price.', table: out((rs) => s(rs, 'Qty') * (avg(rs.map((r) => r.Price ?? null)) as number)) },
        { trap: 'filter-context', why: 'It iterates the whole table on every row; SUMX iterates only the rows the region filter leaves.', table: out(() => sx(data)) },
      ],
    }
  },
}

// ── QO-D08 RELATED inside an iterator ─────────────────────────────────
const d08: OracleTemplate = {
  meta: punchCard('QO-D08', 'Cost through a relationship', 2, [SRC.dRelated, SRC.dSumx, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: `Unit cost lives on the Product table. ${REL}`,
  traps: ['iterator-vs-aggregate', 'filter-context', 'summarizecolumns-blank'],
  generate(rand) {
    const { cats, products, sold } = productModel(rand, { emptyCategory: true, salesRows: [5, 7] })
    const prods: Row[] = products.map((p) => ({ ...p, UnitCost: int(rand, 1, 9) * 5 }))
    const sales: Row[] = sold.map((p, i) => ({ OrderID: 1 + i, Product: p.Product!, Qty: int(rand, 1, 4) }))
    const cost = (name: string | number | null) => (prods.find((p) => p.Product === name)?.UnitCost as number) ?? 0
    const g = groupBy(sales, (s) => catOf(products, s.Product ?? null))
    const cols = ['Product[Category]', '[Cost]']
    const line = (s: Row) => (s.Qty as number) * cost(s.Product ?? null)
    const listed = cats.filter((c) => g.has(c))
    const out = (cs: string[], f: (c: string) => number | null) => result(cols, cs.map((c) => ({ [cols[0]!]: c, [cols[1]!]: f(c) })))
    const grand = sales.reduce((a, s) => a + line(s), 0)
    return {
      tables: [table('Product', ['Product', 'Category', 'UnitCost'], prods), table('Sales', ['OrderID', 'Product', 'Qty'], sales)],
      query: `EVALUATE\nSUMMARIZECOLUMNS (\n    'Product'[Category],\n    "Cost", SUMX ( Sales, Sales[Qty] * RELATED ( 'Product'[UnitCost] ) )\n)\nORDER BY 'Product'[Category]`,
      correct: out(listed, (c) => g.get(c)!.reduce((a, s) => a + line(s), 0)),
      explain: 'For each Sales row, RELATED fetches that product’s UnitCost from the one side of the relationship; SUMX multiplies by Qty and adds the lines in each category.',
      distractors: [
        {
          trap: 'iterator-vs-aggregate',
          why: 'It multiplies the category’s total quantity by the sum of its products’ unit costs.',
          table: out(listed, (c) => (sum(g.get(c)!.map((s) => s.Qty!)) as number) * (sum(prods.filter((p) => p.Category === c).map((p) => p.UnitCost!)) as number)),
        },
        { trap: 'filter-context', why: 'It shows the grand total on every row, as if the category didn’t filter Sales.', table: out(listed, () => grand) },
        { trap: 'summarizecolumns-blank', why: 'It lists the category with no sales, but its Cost is blank, so SUMMARIZECOLUMNS removes the row.', table: out(cats, (c) => (g.has(c) ? g.get(c)!.reduce((a, s) => a + line(s), 0) : null)) },
      ],
    }
  },
}

// ── QO-D09 Context transition ─────────────────────────────────────────
const d09: OracleTemplate = {
  meta: punchCard('QO-D09', 'Measure vs plain SUM in ADDCOLUMNS', 3, [SRC.dCalculate, SRC.dAddColumns, SRC.dValues, SRC.dDefine]),
  language: 'dax',
  intro: `ADDCOLUMNS iterates the categories, adding a measure and a plain SUM. One category has no sales. ${REL}`,
  traps: ['context-transition'],
  generate(rand) {
    const { cats, empty, products, sold } = productModel(rand, { emptyCategory: true, salesRows: [6, 7] })
    const sales: Row[] = sold.map((p, i) => ({ OrderID: 1 + i, Product: p.Product!, Amount: int(rand, 1, 20) * 10 }))
    const g = groupBy(sales, (s) => catOf(products, s.Product ?? null))
    const per = (c: string) => (g.has(c) ? sum(g.get(c)!.map((s) => s.Amount!)) : null)
    const grand = sum(sales.map((s) => s.Amount!))
    const cols = ['Product[Category]', '[With measure]', '[Plain SUM]']
    const out = (a: (c: string) => number | null, b: (c: string) => number | null) => result(cols, cats.map((c) => ({ [cols[0]!]: c, [cols[1]!]: a(c), [cols[2]!]: b(c) })))
    return {
      tables: [table('Product', ['Product', 'Category'], products), table('Sales', ['OrderID', 'Product', 'Amount'], sales)],
      query: `DEFINE\n    MEASURE Sales[Total] = SUM ( Sales[Amount] )\nEVALUATE\nADDCOLUMNS (\n    VALUES ( 'Product'[Category] ),\n    "With measure", [Total],\n    "Plain SUM", SUM ( Sales[Amount] )\n)\nORDER BY 'Product'[Category]`,
      correct: out(per, () => grand),
      explain: `ADDCOLUMNS creates a row context. The measure reference gets an implicit CALCULATE (context transition), so it’s filtered to the category (blank for ${empty}). The plain SUM has no filter from the row, so it returns the grand total on every row. ADDCOLUMNS keeps every category.`,
      distractors: [
        { trap: 'context-transition', why: 'It filters the plain SUM by the row too, but a row context alone doesn’t filter.', table: out(per, per) },
        { trap: 'context-transition', why: 'It treats the measure like the plain SUM, but a measure reference triggers context transition.', table: out(() => grand, () => grand) },
        { trap: 'context-transition', why: 'It swaps the two columns.', table: out(() => grand, per) },
      ],
    }
  },
}

// ── QO-D10 AVERAGE skips blanks ───────────────────────────────────────
const shapes: [number, number, number][] = [
  [2, 1, 3],
  [2, 2, 2],
  [2, 2, 4],
  [1, 1, 4],
  [3, 1, 4],
]
const meanValues = (rand: Rand, k: number, mean: number) => {
  const d = int(rand, 0, Math.min(mean - 1, 5 - mean))
  return (k === 1 ? [mean] : k === 2 ? [mean - d, mean + d] : [mean - d, mean, mean + d]).map((x) => x * 2)
}
const d10: OracleTemplate = {
  meta: daxScale('QO-D10', 'Average discount with blanks', 2, [SRC.dAverage, SRC.dCountRows, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: 'Discount (whole percent) is blank on lines where no discount was recorded.',
  traps: ['nulls-ignored', 'distinct-count'],
  generate(rand) {
    const regs = ['East', 'North', 'West']
    const rows: Row[] = []
    regs.forEach((Region, i) => {
      if (i === 1) {
        const [k, m, mean] = pick(rand, shapes)
        for (const v of meanValues(rand, k, mean)) rows.push({ Region, Discount: v })
        for (let j = 0; j < m; j++) rows.push({ Region, Discount: null })
      } else for (const v of meanValues(rand, 2, int(rand, 2, 4))) rows.push({ Region, Discount: v })
    })
    const data = shuffle(rand, rows).map((r, i) => ({ Line: 1 + i, ...r }))
    const g = groupBy(data, (r) => r.Region!)
    const cols = ['Sales[Region]', '[Avg Discount]', '[Lines]']
    const d = (rs: Row[]) => rs.map((r) => r.Discount ?? null)
    const out = (f: (rs: Row[]) => [number | null, number]) => result(cols, regs.map((r) => ({ [cols[0]!]: r, [cols[1]!]: f(g.get(r)!)[0], [cols[2]!]: f(g.get(r)!)[1] })))
    return {
      tables: [table('Sales', ['Line', 'Region', 'Discount'], data)],
      query: `EVALUATE\nSUMMARIZECOLUMNS (\n    Sales[Region],\n    "Avg Discount", AVERAGE ( Sales[Discount] ),\n    "Lines", COUNTROWS ( Sales )\n)\nORDER BY Sales[Region]`,
      correct: out((rs) => [avg(d(rs)), rs.length]),
      explain: 'AVERAGE ignores blank cells (a 0 would count, a blank doesn’t), so it averages recorded discounts only. COUNTROWS counts every line.',
      distractors: [
        { trap: 'nulls-ignored', why: 'It treats blank discounts as 0 in the average.', table: out((rs) => [avg(d(rs).map((x) => x ?? 0)), rs.length]) },
        { trap: 'distinct-count', why: 'It counts only lines with a discount, but COUNTROWS counts every row.', table: out((rs) => [avg(d(rs)), countValues(d(rs))]) },
        { trap: 'nulls-ignored', why: 'It averages with blanks as 0 and also skips them in the line count.', table: out((rs) => [avg(d(rs).map((x) => x ?? 0)), countValues(d(rs))]) },
      ],
    }
  },
}

// ── QO-D11 TOPN returns ties ──────────────────────────────────────────
const d11: OracleTemplate = {
  meta: daxScale('QO-D11', 'Top two products with a tie', 2, [SRC.dTopN, SRC.dSummarizeColumns]),
  language: 'dax',
  intro: 'Two products have exactly the same revenue.',
  traps: ['topn-ties', 'asc-vs-desc', 'take-vs-top'],
  generate(rand) {
    const prods = sample(rand, ['Bolt', 'Cog', 'Gear', 'Lever', 'Spool', 'Valve'], 5).sort()
    const vals = distinctInts(rand, 4, 3, 30).map((x) => x * 10)
    vals.sort((a, b) => b - a)
    // Tie at 2nd place.
    const revenue = new Map<string, number>([[prods[0]!, vals[2]!], [prods[1]!, vals[1]!], [prods[2]!, vals[0]!], [prods[3]!, vals[1]!], [prods[4]!, vals[3]!]])
    const sales: Row[] = []
    for (const [p, r] of revenue) {
      const a = int(rand, 1, r / 10 - 1) * 10
      if (rand() < 0.5 && a < r) sales.push({ Product: p, Amount: a }, { Product: p, Amount: r - a })
      else sales.push({ Product: p, Amount: r })
    }
    const data: Row[] = shuffle(rand, sales).map((s, i) => ({ OrderID: 1 + i, ...s }))
    const cols = ['Sales[Product]', '[Revenue]']
    const totals: Row[] = [...revenue].map(([p, r]) => ({ [cols[0]!]: p, [cols[1]!]: r }))
    const sorted = (rs: Row[], dir: 'asc' | 'desc') => sortRows(rs, [{ by: cols[1]!, dir }, { by: cols[0]! }])
    const withTies = (dir: 'asc' | 'desc') => {
      const s = sorted(totals, dir)
      const cut = s[1]![cols[1]!]
      return s.filter((r, i) => i < 2 || r[cols[1]!] === cut)
    }
    return {
      tables: [table('Sales', ['OrderID', 'Product', 'Amount'], data)],
      query: `EVALUATE\nTOPN (\n    2,\n    SUMMARIZECOLUMNS ( Sales[Product], "Revenue", SUM ( Sales[Amount] ) ),\n    [Revenue], DESC\n)\nORDER BY [Revenue] DESC, Sales[Product]`,
      correct: result(cols, sorted(withTies('desc'), 'desc')),
      explain: 'TOPN ranks by Revenue descending. Two products tie at second place, and TOPN returns all rows tied at the N-th position, so the result has three rows.',
      distractors: [
        { trap: 'topn-ties', why: 'It stops at exactly two rows, but TOPN keeps every row tied at the N-th position.', table: result(cols, sorted(totals, 'desc').slice(0, 2)) },
        { trap: 'asc-vs-desc', why: 'It ranks ascending and keeps the lowest revenues.', table: result(cols, sorted(withTies('asc'), 'desc')) },
        { trap: 'take-vs-top', why: 'It keeps the first two products by name, ignoring the ranking.', table: result(cols, sorted(sortRows(totals, [{ by: cols[0]! }]).slice(0, 2), 'desc')) },
      ],
    }
  },
}

// ── QO-D12 Variables are evaluated once ───────────────────────────────
const d12: OracleTemplate = {
  meta: punchCard('QO-D12', 'A variable inside CALCULATE', 3, [SRC.dVar, SRC.dVarPractice, SRC.dRemoveFilters, SRC.dCalculate]),
  language: 'dax',
  intro: `The measure stores SUM ( Sales[Amount] ) in a variable, then passes the variable to CALCULATE. ${REL}`,
  traps: ['var-evaluated-once', 'filter-context'],
  generate(rand) {
    const { cats, products, sold } = productModel(rand, { emptyCategory: false, salesRows: [6, 7] })
    const sales: Row[] = sold.map((p, i) => ({ OrderID: 1 + i, Product: p.Product!, Amount: int(rand, 1, 20) * 10 }))
    const g = groupBy(sales, (s) => catOf(products, s.Product ?? null))
    const per = (c: string) => sum(g.get(c)!.map((s) => s.Amount!))
    const grand = sum(sales.map((s) => s.Amount!))
    const cols = ['Product[Category]', '[Revenue]', '[All Categories]']
    const out = (a: (c: string) => number | null, b: (c: string) => number | null) => result(cols, cats.map((c) => ({ [cols[0]!]: c, [cols[1]!]: a(c), [cols[2]!]: b(c) })))
    return {
      tables: [table('Product', ['Product', 'Category'], products), table('Sales', ['OrderID', 'Product', 'Amount'], sales)],
      query: `DEFINE\n    MEASURE Sales[All Categories] =\n        VAR CurrentSales = SUM ( Sales[Amount] )\n        RETURN\n            CALCULATE ( CurrentSales, REMOVEFILTERS ( 'Product'[Category] ) )\nEVALUATE\nSUMMARIZECOLUMNS (\n    'Product'[Category],\n    "Revenue", SUM ( Sales[Amount] ),\n    "All Categories", [All Categories]\n)\nORDER BY 'Product'[Category]`,
      correct: out(per, per),
      explain: 'The variable is evaluated once, where it’s defined, in the row’s category filter. CALCULATE then changes the filter, but CurrentSales already holds the category’s value, so All Categories equals Revenue.',
      distractors: [
        { trap: 'var-evaluated-once', why: 'It re-evaluates the variable after REMOVEFILTERS, but a variable’s value doesn’t change.', table: out(per, () => grand) },
        { trap: 'var-evaluated-once', why: 'It treats the variable as unusable inside CALCULATE; it can be passed in, it just keeps its value.', table: out(per, () => null) },
        { trap: 'filter-context', why: 'It applies REMOVEFILTERS to the Revenue column too.', table: out(() => grand, () => grand) },
      ],
    }
  },
}

// ── QO-D13 FILTER on a summarized table (after aggregation) ───────────
const d13: OracleTemplate = {
  meta: daxScale('QO-D13', 'Filter regions by total', 2, [SRC.dSummarizeColumns, 'https://learn.microsoft.com/en-us/dax/filter-function-dax']),
  language: 'dax',
  intro: 'FILTER wraps the summarized table, so it tests each region’s total.',
  traps: ['where-vs-having', 'range-boundary'],
  generate(rand) {
    const regs = sample(rand, ['East', 'North', 'South', 'West'], 3).sort()
    const rows: Row[] = Array.from({ length: int(rand, 7, 9) }, (_, i) => ({ Region: i < 3 ? regs[i]! : pick(rand, regs), Amount: int(rand, 2, 12) * 10 }))
    const data: Row[] = rows.map((r, i) => ({ OrderID: 1 + i, ...r }))
    const totals = (rs: Row[]) => [...groupBy(rs, (r) => r.Region!)].map(([Region, g]) => ({ Region, Total: sum(g.map((r) => r.Amount!)) as number }))
    const all = totals(data)
    const threshold = all.map((x) => x.Total).sort((a, b) => a - b)[1]!
    const cols = ['Sales[Region]', '[Revenue]']
    const out = (gs: { Region: string | number | null; Total: number }[], keep: (t: number) => boolean) =>
      result(cols, sortRows(gs.filter((x) => keep(x.Total)).map((x) => ({ [cols[0]!]: x.Region, [cols[1]!]: x.Total })), [{ by: cols[0]! }]))
    return {
      tables: [table('Sales', ['OrderID', 'Region', 'Amount'], data)],
      query: `EVALUATE\nFILTER (\n    SUMMARIZECOLUMNS ( Sales[Region], "Revenue", SUM ( Sales[Amount] ) ),\n    [Revenue] > ${threshold}\n)\nORDER BY Sales[Region]`,
      correct: out(all, (t) => t > threshold),
      explain: `SUMMARIZECOLUMNS totals each region first; FILTER then keeps the rows of that table whose Revenue is above ${threshold}, like HAVING in SQL.`,
      distractors: [
        { trap: 'where-vs-having', why: `It filters individual sales over ${threshold} before totalling, like a WHERE clause.`, table: out(totals(data.filter((r) => (r.Amount as number) > threshold)), () => true) },
        { trap: 'where-vs-having', why: 'It ignores the filter and keeps every region.', table: out(all, () => true) },
        { trap: 'range-boundary', why: `It keeps a total of exactly ${threshold}, but > excludes it.`, table: out(all, (t) => t >= threshold) },
      ],
    }
  },
}

export const daxTemplates: OracleTemplate[] = [d01, d02, d03, d04, d05, d06, d07, d08, d09, d10, d11, d12, d13]
