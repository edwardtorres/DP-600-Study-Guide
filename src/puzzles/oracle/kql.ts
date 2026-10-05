import { avg, bin, dedupeBy, distinct, distinctInts, groupBy, innerJoin, int, kqlInnerUnique, leftJoin, max, pick, result, sample, shuffle, sortRows, sum, table, type Rand, type Row } from './engine'
import type { OracleTemplate } from './template'
import { SRC } from './traps'

/**
 * KQL predict-the-result templates (Eventhouse / KQL database).
 * Every result is computed from the generated data; nothing is hand-written.
 */

const users = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6']
const regions = ['Central', 'East', 'North', 'South', 'West']
const products = ['Bolt', 'Cog', 'Gear', 'Lever', 'Pulley', 'Spool', 'Valve']
const meta = (id: string, title: string, difficulty: 1 | 2 | 3, sources: string[], trapPairId?: string) => ({
  id,
  title,
  machineIds: ['tension-meter'],
  bulletIds: ['P3.3'],
  difficulty,
  sources,
  ...(trapPairId ? { trapPairId } : {}),
})

// ── QO-K01 join default (innerunique) vs kind=inner ───────────────────
const k01: OracleTemplate = {
  meta: meta('QO-K01', 'Join with no kind', 3, [SRC.kJoin, SRC.kInnerUnique, SRC.kInner]),
  language: 'kql',
  intro: 'Sessions has one row per page view, so a user can appear several times. Purchases has one row per purchase.',
  traps: ['kql-innerunique', 'inner-vs-left', 'kql-dedupe-side'],
  generate(rand) {
    const kind = pick(rand, ['default', 'inner'] as const)
    const us = sample(rand, users, 4).sort()
    const pages = ['home', 'cart', 'help', 'shop']
    const sessions: Row[] = shuffle(rand, [us[0]!, us[0]!, us[1]!, us[1]!, us[2]!, us[3]!, ...(rand() < 0.5 ? [us[0]!] : [])]).map((UserId) => ({ UserId, Page: pick(rand, pages) }))
    const amounts = distinctInts(rand, 6, 1, 30).map((x) => x * 5)
    const buyers = [us[0]!, us[1]!, us[1]!, us[2]!, 'u9', pick(rand, [us[0]!, us[2]!])]
    const purchases: Row[] = buyers.map((UserId, i) => ({ UserId, Amount: amounts[i]! }))
    const merge = (l: Row, r: Row | null): Row => ({ UserId: l.UserId!, Amount: r?.Amount ?? null })
    const on = (l: Row, r: Row) => l.UserId === r.UserId
    const out = (rows: Row[]) => result(['UserId', 'Amount'], sortRows(rows, [{ by: 'UserId' }, { by: 'Amount' }]))
    const unique = kqlInnerUnique(sessions, purchases, 'UserId', merge)
    const inner = innerJoin(sessions, purchases, on, merge)
    const outer = leftJoin(sessions, purchases, on, merge)
    const rightDeduped = innerJoin(sessions, dedupeBy(purchases, (r) => r.UserId ?? null), on, merge)
    const common = {
      tables: [table('Sessions', ['UserId', 'Page'], sessions), table('Purchases', ['UserId', 'Amount'], purchases)],
      query: `Sessions\n| join ${kind === 'inner' ? 'kind=inner ' : ''}Purchases on UserId\n| project UserId, Amount\n| order by UserId asc, Amount asc`,
    }
    if (kind === 'default')
      return {
        ...common,
        correct: out(unique),
        explain: 'With no kind, KQL uses innerunique: it keeps one Sessions row per UserId, then matches it with every purchase for that user. Users with no purchase, and the purchase by u9, drop out.',
        distractors: [
          { trap: 'kql-innerunique', why: 'It keeps every Sessions row, as kind=inner would, so each purchase repeats once per page view.', table: out(inner) },
          { trap: 'inner-vs-left', why: 'It keeps users with no purchase (Amount null), as kind=leftouter would.', table: out(outer) },
          { trap: 'kql-dedupe-side', why: 'It deduplicates the Purchases side instead, keeping one purchase per user.', table: out(rightDeduped) },
        ],
      }
    return {
      ...common,
      correct: out(inner),
      explain: 'kind=inner keeps every matching pair, so each purchase appears once for every Sessions row of that user.',
      distractors: [
        { trap: 'kql-innerunique', why: 'It deduplicates the Sessions side first, which is what the default (no kind) does, not kind=inner.', table: out(unique) },
        { trap: 'inner-vs-left', why: 'It keeps users with no purchase (Amount null), as kind=leftouter would.', table: out(outer) },
        { trap: 'kql-dedupe-side', why: 'It keeps one purchase per user, but neither side is deduplicated with kind=inner.', table: out(rightDeduped) },
      ],
    }
  },
}

// ── QO-K02 leftouter ──────────────────────────────────────────────────
const k02: OracleTemplate = {
  meta: meta('QO-K02', 'Devices and their alerts', 2, [SRC.kLeftOuter, SRC.kLeftAnti, SRC.kNulls]),
  language: 'kql',
  intro: 'Operations wants every device listed with the severity of each alert, including devices with no alerts. Severity is a long column.',
  traps: ['kql-innerunique', 'kql-leftanti', 'null-not-zero'],
  generate(rand) {
    const devices: Row[] = ['d1', 'd2', 'd3', 'd4', 'd5'].map((DeviceId) => ({ DeviceId, Site: pick(rand, ['Leeds', 'Lyon', 'Oslo']) }))
    const alerting = ['d1', 'd2', 'd2', pick(rand, ['d1', 'd3']), 'd9']
    if (rand() < 0.5) alerting.push('d3')
    const alerts: Row[] = alerting.map((DeviceId, i) => ({ AlertId: 900 + i, DeviceId, Severity: int(rand, 1, 5) }))
    const merge = (l: Row, r: Row | null): Row => ({ DeviceId: l.DeviceId!, Site: l.Site!, Severity: r?.Severity ?? null })
    const on = (l: Row, r: Row) => l.DeviceId === r.DeviceId
    const out = (rows: Row[]) => result(['DeviceId', 'Site', 'Severity'], sortRows(rows, [{ by: 'DeviceId' }, { by: 'Severity' }]))
    const outer = leftJoin(devices, alerts, on, merge)
    return {
      tables: [table('Devices', ['DeviceId', 'Site'], devices), table('Alerts', ['AlertId', 'DeviceId', 'Severity'], alerts)],
      query: `Devices\n| join kind=leftouter Alerts on DeviceId\n| project DeviceId, Site, Severity\n| order by DeviceId asc, Severity asc`,
      correct: out(outer),
      explain: 'leftouter keeps every device. A device with several alerts appears once per alert; a device with none appears once with a null Severity. The alert for d9 has no device, so it’s dropped.',
      distractors: [
        { trap: 'kql-innerunique', why: 'It drops devices with no alerts, as the default join (innerunique) would.', table: out(kqlInnerUnique(devices, alerts, 'DeviceId', merge)) },
        { trap: 'kql-leftanti', why: 'It returns only devices with no alerts, as kind=leftanti would.', table: out(devices.filter((d) => !alerts.some((a) => on(d, a))).map((d) => merge(d, null))) },
        { trap: 'null-not-zero', why: 'It shows 0 for devices with no alerts, but the unmatched Severity is null.', table: out(outer.map((r) => ({ ...r, Severity: r.Severity ?? 0 }))) },
      ],
    }
  },
}

// ── QO-K03 top N by (desc by default) ─────────────────────────────────
const k03: OracleTemplate = {
  meta: meta('QO-K03', 'Top three by damage', 1, [SRC.kTop, SRC.kTake]),
  language: 'kql',
  intro: 'A storm-events table records damage per state. The query returns three rows.',
  traps: ['asc-vs-desc', 'take-vs-top', 'operator-order'],
  generate(rand) {
    const states = sample(rand, ['Iowa', 'Ohio', 'Texas', 'Utah', 'Maine', 'Idaho', 'Kansas'], int(rand, 6, 7))
    const dmg = distinctInts(rand, states.length, 5, 95).map((x) => x * 1000)
    const rows: Row[] = states.map((State, i) => ({ State, Damage: dmg[i]! }))
    const cols = ['State', 'Damage']
    return {
      tables: [table('StormDamage', cols, rows)],
      query: `StormDamage\n| top 3 by Damage\n| project State, Damage`,
      correct: result(cols, sortRows(rows, [{ by: 'Damage', dir: 'desc' }]).slice(0, 3)),
      explain: 'top sorts by the expression and returns the first N rows. With no asc or desc, top sorts descending, so these are the three highest Damage values.',
      distractors: [
        { trap: 'asc-vs-desc', why: 'It sorts ascending and returns the three lowest values; top defaults to desc.', table: result(cols, sortRows(rows, [{ by: 'Damage' }]).slice(0, 3)) },
        { trap: 'take-vs-top', why: 'It returns the first three rows as stored, like take 3 on unsorted data.', table: result(cols, rows.slice(0, 3)) },
        { trap: 'operator-order', why: 'It takes three rows first and sorts only those.', table: result(cols, sortRows(rows.slice(0, 3), [{ by: 'Damage', dir: 'desc' }])) },
      ],
    }
  },
}

// ── QO-K04 sort: each column defaults to desc ─────────────────────────
const k04: OracleTemplate = {
  meta: meta('QO-K04', 'Sorting by two columns', 2, [SRC.kSort]),
  language: 'kql',
  intro: 'A sales table is sorted for a report. Only the first sort column says asc.',
  traps: ['kql-sort-default', 'asc-vs-desc'],
  generate(rand) {
    const regs = sample(rand, regions, 3)
    const n = int(rand, 6, 8)
    const revs = distinctInts(rand, n, 10, 90).map((x) => x * 10)
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({ Region: i < 3 ? regs[i]! : pick(rand, regs), Product: pick(rand, products), Revenue: revs[i]! }))
    const cols = ['Region', 'Product', 'Revenue']
    const s = (rd: 'asc' | 'desc', vd: 'asc' | 'desc') => result(cols, sortRows(rows, [{ by: 'Region', dir: rd }, { by: 'Revenue', dir: vd }]))
    return {
      tables: [table('Sales', cols, rows)],
      query: `Sales\n| sort by Region asc, Revenue\n| project Region, Product, Revenue`,
      correct: s('asc', 'desc'),
      explain: 'asc applies only to Region. Revenue has no direction, and KQL sort defaults to desc, so within each region the highest revenue comes first.',
      distractors: [
        { trap: 'kql-sort-default', why: 'It carries asc over to Revenue, but each sort column has its own direction.', table: s('asc', 'asc') },
        { trap: 'asc-vs-desc', why: 'It sorts Region descending too, ignoring the explicit asc.', table: s('desc', 'desc') },
        { trap: 'kql-sort-default', why: 'It swaps the directions: Region descending, Revenue ascending.', table: s('desc', 'asc') },
      ],
    }
  },
}

// ── QO-K05 where before vs after summarize ────────────────────────────
const k05: OracleTemplate = {
  meta: meta('QO-K05', 'Filter rows, then filter totals', 2, [SRC.kWhere, SRC.kSummarize], 'sql-vs-kql'),
  language: 'kql',
  intro: 'The query filters twice: once on orders and once on region totals.',
  traps: ['operator-order', 'range-boundary'],
  generate(rand) {
    const regs = sample(rand, regions, 3)
    const n = int(rand, 7, 9)
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({ OrderId: 101 + i, Region: pick(rand, regs), Amount: int(rand, 2, 12) * 10 }))
    const minAmount = pick(rand, [40, 50, 60])
    const totals = (rs: Row[]) => [...groupBy(rs, (r) => r.Region!)].map(([Region, g]) => ({ Region, Total: sum(g.map((r) => r.Amount!)) as number }))
    const filtered = rows.filter((r) => (r.Amount as number) >= minAmount)
    const minTotal = totals(filtered).map((x) => x.Total).sort((a, b) => a - b)[1] ?? 100
    const out = (gs: { Region: string | number | null; Total: number }[], keep: (t: number) => boolean) =>
      result(['Region', 'Total'], sortRows(gs.filter((g) => keep(g.Total)), [{ by: 'Region' }]))
    return {
      tables: [table('Orders', ['OrderId', 'Region', 'Amount'], rows)],
      query: `Orders\n| where Amount >= ${minAmount}\n| summarize Total = sum(Amount) by Region\n| where Total > ${minTotal}\n| order by Region asc`,
      correct: out(totals(filtered), (t) => t > minTotal),
      explain: `Each operator works on the previous output: the first where drops orders under ${minAmount}, summarize totals the rest by region, and the second where keeps totals above ${minTotal}.`,
      distractors: [
        { trap: 'operator-order', why: 'It totals every order, as if the first where ran after summarize.', table: out(totals(rows), (t) => t > minTotal) },
        { trap: 'operator-order', why: 'It skips the second where and keeps every region.', table: out(totals(filtered), () => true) },
        { trap: 'range-boundary', why: `It keeps a total of exactly ${minTotal}, but > excludes it.`, table: out(totals(filtered), (t) => t >= minTotal) },
      ],
    }
  },
}

// ── QO-K06 avg() ignores nulls; count() counts records ────────────────
const shapes: [number, number, number][] = [
  [2, 1, 3],
  [2, 2, 2],
  [2, 2, 4],
  [1, 1, 4],
  [3, 1, 4],
]
function meanValues(rand: Rand, k: number, mean: number): number[] {
  const d = int(rand, 0, Math.min(mean - 1, 5 - mean))
  const raw = k === 1 ? [mean] : k === 2 ? [mean - d, mean + d] : [mean - d, mean, mean + d]
  return raw.map((x) => x * 5)
}
const k06: OracleTemplate = {
  meta: meta('QO-K06', 'Average temperature with gaps', 2, [SRC.kAvg, SRC.kCount, SRC.kNulls]),
  language: 'kql',
  intro: 'Temp is a long column; some readings failed and are null.',
  traps: ['nulls-ignored', 'count-star-vs-column'],
  generate(rand) {
    const sensors = ['s1', 's2', 's3']
    const rows: Row[] = []
    sensors.forEach((Sensor, i) => {
      if (i === 1) {
        const [k, m, mean] = pick(rand, shapes)
        for (const t of meanValues(rand, k, mean)) rows.push({ Sensor, Temp: t })
        for (let j = 0; j < m; j++) rows.push({ Sensor, Temp: null })
      } else for (const t of meanValues(rand, 2, int(rand, 2, 4))) rows.push({ Sensor, Temp: t })
    })
    const data = shuffle(rand, rows)
    const temps = (g: Row[]) => g.map((r) => r.Temp ?? null)
    const by = (f: (g: Row[]) => Row) => result(['Sensor', 'AvgTemp', 'Samples'], sortRows([...groupBy(data, (r) => r.Sensor!)].map(([Sensor, g]) => ({ Sensor, ...f(g) })), [{ by: 'Sensor' }]))
    const nonNull = (g: Row[]) => temps(g).filter((t) => t !== null).length
    return {
      tables: [table('Readings', ['Sensor', 'Temp'], data)],
      query: `Readings\n| summarize AvgTemp = avg(Temp), Samples = count() by Sensor\n| order by Sensor asc`,
      correct: by((g) => ({ AvgTemp: avg(temps(g)), Samples: g.length })),
      explain: 'avg() ignores records with a null value, so the average uses real readings only. count() counts every record in the group, null or not.',
      distractors: [
        { trap: 'nulls-ignored', why: 'It treats null readings as 0 in the average.', table: by((g) => ({ AvgTemp: avg(temps(g).map((t) => t ?? 0)), Samples: g.length })) },
        { trap: 'count-star-vs-column', why: 'It makes count() skip nulls, but count() counts records.', table: by((g) => ({ AvgTemp: avg(temps(g)), Samples: nonNull(g) })) },
        { trap: 'nulls-ignored', why: 'It averages with nulls as 0 and also skips them in the count.', table: by((g) => ({ AvgTemp: avg(temps(g).map((t) => t ?? 0)), Samples: nonNull(g) })) },
      ],
    }
  },
}

// ── QO-K07 count() vs countif() ───────────────────────────────────────
const k07: OracleTemplate = {
  meta: meta('QO-K07', 'Attempts and failures per user', 1, [SRC.kCount, SRC.kCountIf, SRC.kSummarize]),
  language: 'kql',
  intro: 'Security reviews sign-in attempts. One user had no failures.',
  traps: ['ignored-predicate', 'operator-order'],
  generate(rand) {
    const us = sample(rand, users, 3).sort()
    const results: [string, string][] = [
      [us[0]!, 'Fail'],
      [us[0]!, 'OK'],
      [us[1]!, 'Fail'],
      [us[1]!, 'Fail'],
      [us[2]!, 'OK'],
    ]
    for (let i = 0, n = int(rand, 1, 4); i < n; i++) results.push([pick(rand, us), pick(rand, ['OK', 'Fail'])])
    const rows: Row[] = shuffle(rand, results).map(([User, Result], i) => ({ Time: `08:${String(10 + i * 3).padStart(2, '0')}`, User, Result }))
    const fails = (g: Row[]) => g.filter((r) => r.Result === 'Fail').length
    const by = (rs: Row[], f: (g: Row[]) => Row) => result(['User', 'Attempts', 'Failures'], sortRows([...groupBy(rs, (r) => r.User!)].map(([User, g]) => ({ User, ...f(g) })), [{ by: 'User' }]))
    return {
      tables: [table('SignIns', ['Time', 'User', 'Result'], rows)],
      query: `SignIns\n| summarize Attempts = count(),\n            Failures = countif(Result == "Fail") by User\n| order by User asc`,
      correct: by(rows, (g) => ({ Attempts: g.length, Failures: fails(g) })),
      explain: 'count() counts every record in the group; countif() counts only records where the predicate is true. A user with no failures still appears, with Failures = 0.',
      distractors: [
        { trap: 'ignored-predicate', why: 'It counts every attempt in Failures, ignoring the predicate.', table: by(rows, (g) => ({ Attempts: g.length, Failures: g.length })) },
        { trap: 'ignored-predicate', why: 'It applies the predicate to count() too.', table: by(rows, (g) => ({ Attempts: fails(g), Failures: fails(g) })) },
        { trap: 'operator-order', why: 'It filters failures before summarizing, which drops the user with none and counts only failed attempts.', table: by(rows.filter((r) => r.Result === 'Fail'), (g) => ({ Attempts: g.length, Failures: g.length })) },
      ],
    }
  },
}

// ── QO-K08 arg_max ────────────────────────────────────────────────────
const k08: OracleTemplate = {
  meta: meta('QO-K08', 'Latest state per device', 2, [SRC.kArgMax, SRC.kMax]),
  language: 'kql',
  intro: 'Each device reports its state several times. The query returns the latest state of each device.',
  traps: ['asc-vs-desc', 'max-vs-argmax', 'take-vs-top'],
  generate(rand) {
    const states = ['Idle', 'Running', 'Stopped', 'Warning']
    const devs = ['d1', 'd2', 'd3']
    const times = distinctInts(rand, 8, 0, 47).map((x) => `2026-10-01 ${String(Math.floor(x / 2) % 24).padStart(2, '0')}:${x % 2 ? '30' : '00'}`)
    const rows: Row[] = shuffle(rand, times).map((Timestamp, i) => ({ DeviceId: devs[i % 3]!, Timestamp, State: pick(rand, states) }))
    const per = (pickRow: (g: Row[]) => Row) => result(['DeviceId', 'State'], sortRows([...groupBy(rows, (r) => r.DeviceId!)].map(([DeviceId, g]) => ({ DeviceId, State: pickRow(g).State! })), [{ by: 'DeviceId' }]))
    return {
      tables: [table('DeviceStatus', ['DeviceId', 'Timestamp', 'State'], rows)],
      query: `DeviceStatus\n| summarize arg_max(Timestamp, State) by DeviceId\n| project DeviceId, State\n| order by DeviceId asc`,
      correct: per((g) => sortRows(g, [{ by: 'Timestamp', dir: 'desc' }])[0]!),
      explain: 'arg_max(Timestamp, State) finds the row with the latest Timestamp in each group and returns its State.',
      distractors: [
        { trap: 'asc-vs-desc', why: 'It returns the earliest state, as arg_min would.', table: per((g) => sortRows(g, [{ by: 'Timestamp' }])[0]!) },
        { trap: 'max-vs-argmax', why: 'It returns the alphabetically largest State, as max(State) would.', table: result(['DeviceId', 'State'], sortRows([...groupBy(rows, (r) => r.DeviceId!)].map(([DeviceId, g]) => ({ DeviceId, State: max(g.map((r) => r.State ?? null)) })), [{ by: 'DeviceId' }])) },
        { trap: 'take-vs-top', why: 'It returns the last row listed for each device, as if the table were already in time order.', table: per((g) => g[g.length - 1]!) },
      ],
    }
  },
}

// ── QO-K09 distinct ───────────────────────────────────────────────────
const k09: OracleTemplate = {
  meta: meta('QO-K09', 'Distinct pages per user', 1, [SRC.kDistinct, SRC.kSort]),
  language: 'kql',
  intro: 'PageViews has one row per view; users often revisit a page.',
  traps: ['distinct-count', 'distinct-not-dedupe', 'kql-sort-default'],
  generate(rand) {
    const us = sample(rand, users, 3).sort()
    const pages = ['cart', 'home', 'shop']
    const base: Row[] = [
      { UserId: us[0]!, Page: 'home' },
      { UserId: us[0]!, Page: 'home' },
      { UserId: us[0]!, Page: 'shop' },
      { UserId: us[1]!, Page: pick(rand, pages) },
      { UserId: us[2]!, Page: 'cart' },
    ]
    for (let i = 0, n = int(rand, 1, 4); i < n; i++) base.push({ UserId: pick(rand, us), Page: pick(rand, pages) })
    const rows: Row[] = shuffle(rand, base).map((r, i) => ({ ...r, ViewedAt: `10:${String(5 + i * 4).padStart(2, '0')}` }))
    const cols = ['UserId', 'Page']
    const proj = rows.map((r) => ({ UserId: r.UserId!, Page: r.Page! }))
    const out = (rs: Row[], pageDir: 'asc' | 'desc' = 'asc') => result(cols, sortRows(rs, [{ by: 'UserId' }, { by: 'Page', dir: pageDir }]))
    return {
      tables: [table('PageViews', ['UserId', 'Page', 'ViewedAt'], rows)],
      query: `PageViews\n| distinct UserId, Page\n| order by UserId asc, Page asc`,
      correct: out(distinct(proj, cols)),
      explain: 'distinct returns each distinct combination of UserId and Page once, however many times it was viewed.',
      distractors: [
        { trap: 'distinct-count', why: 'It keeps repeated views of the same page.', table: out(proj) },
        { trap: 'distinct-not-dedupe', why: 'It keeps one row per user, but distinct works on the combination of both columns.', table: out(dedupeBy(sortRows(distinct(proj, cols), [{ by: 'UserId' }, { by: 'Page' }]), (r) => r.UserId ?? null)) },
        { trap: 'kql-sort-default', why: 'It sorts Page descending, but the query says asc for both columns.', table: out(distinct(proj, cols), 'desc') },
      ],
    }
  },
}

// ── QO-K10 bin() rounds down; order by defaults to desc ───────────────
const k10: OracleTemplate = {
  meta: meta('QO-K10', 'Request durations in buckets', 2, [SRC.kBin, SRC.kSort, SRC.kSummarize]),
  language: 'kql',
  intro: 'Request durations (ms) are grouped into 100 ms buckets. The final sort has no direction.',
  traps: ['bin-rounds-down', 'kql-sort-default'],
  generate(rand) {
    const n = int(rand, 7, 9)
    const durs = [100, 199, 250, ...distinctInts(rand, n - 3, 1, 59).map((x) => x * 7 + 3)]
    const rows: Row[] = shuffle(rand, durs).map((DurationMs, i) => ({ RequestId: 600 + i, DurationMs }))
    const buckets = (f: (d: number) => number, dir: 'asc' | 'desc') =>
      result(['Bucket', 'Requests'], sortRows([...groupBy(rows, (r) => f(r.DurationMs as number))].map(([Bucket, g]) => ({ Bucket, Requests: g.length })), [{ by: 'Bucket', dir }]))
    return {
      tables: [table('Requests', ['RequestId', 'DurationMs'], rows)],
      query: `Requests\n| summarize Requests = count() by Bucket = bin(DurationMs, 100)\n| order by Bucket`,
      correct: buckets((d) => bin(d, 100), 'desc'),
      explain: 'bin() rounds each duration down to a multiple of 100 (199 goes to 100). order by with no direction sorts descending.',
      distractors: [
        { trap: 'bin-rounds-down', why: 'It rounds to the nearest 100, so 199 and 250 move up.', table: buckets((d) => Math.round(d / 100) * 100, 'desc') },
        { trap: 'bin-rounds-down', why: 'It rounds up to the next multiple of 100.', table: buckets((d) => Math.ceil(d / 100) * 100, 'desc') },
        { trap: 'kql-sort-default', why: 'It sorts ascending, but KQL order by defaults to desc.', table: buckets((d) => bin(d, 100), 'asc') },
      ],
    }
  },
}

// ── QO-K11 union keeps every row ──────────────────────────────────────
const k11: OracleTemplate = {
  meta: meta('QO-K11', 'Orders across two quarters', 2, [SRC.kUnion, SRC.kSummarize, SRC.kSort]),
  language: 'kql',
  intro: 'Q1Orders and Q2Orders have the same columns. A customer can buy the same product in both quarters.',
  traps: ['union-vs-union-all', 'asc-vs-desc'],
  generate(rand) {
    const prods = sample(rand, products, 3).sort()
    const custs = ['c1', 'c2', 'c3']
    const q1: Row[] = Array.from({ length: int(rand, 5, 6) }, () => ({ Product: pick(rand, prods), Customer: pick(rand, custs) }))
    const q2: Row[] = [{ ...q1[0]! }, ...Array.from({ length: int(rand, 4, 5) }, () => ({ Product: pick(rand, prods), Customer: pick(rand, custs) }))]
    const shuffled2 = shuffle(rand, q2)
    const all = [...q1, ...shuffled2]
    const counts = (rs: Row[], dir: 'asc' | 'desc' = 'desc') =>
      result(['Product', 'Orders'], sortRows([...groupBy(rs, (r) => r.Product!)].map(([Product, g]) => ({ Product, Orders: g.length })), [{ by: 'Orders', dir }, { by: 'Product', dir: 'asc' }]))
    const inBoth = all.filter((r) => q1.some((a) => a.Product === r.Product) && shuffled2.some((b) => b.Product === r.Product))
    const totals = [...groupBy(all, (r) => r.Product!)].map(([, g]) => g.length)
    return {
      reject: new Set(totals).size !== totals.length ? 'two products tie on Orders' : undefined,
      tables: [table('Q1Orders', ['Product', 'Customer'], q1), table('Q2Orders', ['Product', 'Customer'], shuffled2)],
      query: `union Q1Orders, Q2Orders\n| summarize Orders = count() by Product\n| order by Orders desc, Product asc`,
      correct: counts(all),
      explain: 'union returns the rows of all its inputs, duplicates included (like SQL UNION ALL), so every order in both quarters is counted.',
      distractors: [
        { trap: 'union-vs-union-all', why: 'It removes identical rows first, as SQL UNION would; KQL union keeps them.', table: counts(distinct(all, ['Product', 'Customer'])) },
        { trap: 'union-vs-union-all', why: 'It counts only products found in both tables, as a join would.', table: counts(inBoth) },
        { trap: 'asc-vs-desc', why: 'It lists the smallest count first.', table: counts(all, 'asc') },
      ],
    }
  },
}

// ── QO-K12 extend, where, project ─────────────────────────────────────
const k12: OracleTemplate = {
  meta: meta('QO-K12', 'Net amount filter', 1, [SRC.kExtend, SRC.kWhere, SRC.kProject], 'project-vs-extend'),
  language: 'kql',
  intro: 'The query computes a net amount, filters on it, and returns two columns.',
  traps: ['ignored-predicate', 'range-boundary', 'project-vs-extend'],
  generate(rand) {
    const n = int(rand, 6, 8)
    const rows: Row[] = Array.from({ length: n }, (_, i) => {
      const Amount = int(rand, 3, 12) * 10
      return { OrderId: 201 + i, Amount, Discount: i === 0 ? Amount - 50 : int(rand, 0, 3) * 10 }
    })
    rows[0] = { ...rows[0]!, Amount: 70, Discount: 20 }
    const withNet: (Row & { Net: number })[] = rows.map((r) => ({ ...r, Net: (r.Amount as number) - (r.Discount as number) }))
    const out = (rs: Row[], cols = ['OrderId', 'Net']) => result(cols, sortRows(rs, [{ by: 'OrderId' }]))
    return {
      tables: [table('Orders', ['OrderId', 'Amount', 'Discount'], rows)],
      query: `Orders\n| extend Net = Amount - Discount\n| where Net >= 50\n| project OrderId, Net\n| order by OrderId asc`,
      correct: out(withNet.filter((r) => r.Net >= 50)),
      explain: 'extend adds Net to every row, where keeps rows with Net of 50 or more (50 included), and project keeps only OrderId and Net.',
      distractors: [
        { trap: 'ignored-predicate', why: 'It filters on Amount instead of the new Net column.', table: out(withNet.filter((r) => (r.Amount as number) >= 50)) },
        { trap: 'range-boundary', why: 'It drops the order with Net exactly 50; >= keeps it.', table: out(withNet.filter((r) => r.Net > 50)) },
        { trap: 'project-vs-extend', why: 'It keeps every column, but project returns only the columns it lists.', table: out(withNet.filter((r) => r.Net >= 50), ['OrderId', 'Amount', 'Discount', 'Net']) },
      ],
    }
  },
}

// ── QO-K13 summarize, then top ────────────────────────────────────────
const k13: OracleTemplate = {
  meta: meta('QO-K13', 'Top two regions by total', 2, [SRC.kSummarize, SRC.kTop]),
  language: 'kql',
  intro: 'The query totals sales by region and keeps the best two regions.',
  traps: ['asc-vs-desc', 'operator-order', 'take-vs-top'],
  generate(rand) {
    const regs = sample(rand, regions, 4)
    const n = int(rand, 7, 9)
    const rows: Row[] = Array.from({ length: n }, (_, i) => ({ Region: i < 4 ? regs[i]! : pick(rand, regs), Amount: int(rand, 1, 30) * 10 }))
    const cols = ['Region', 'Total']
    const totals = (rs: Row[]) => [...groupBy(rs, (r) => r.Region!)].map(([Region, g]) => ({ Region, Total: sum(g.map((r) => r.Amount!)) }))
    const t = totals(rows)
    const topFirst = totals(sortRows(rows, [{ by: 'Amount', dir: 'desc' }]).slice(0, 2))
    const tie = new Set(t.map((x) => x.Total)).size !== t.length || new Set(rows.map((r) => r.Amount)).size !== rows.length
    return {
      reject: tie ? 'ties make the top rows ambiguous' : undefined,
      tables: [table('Sales', ['Region', 'Amount'], rows)],
      query: `Sales\n| summarize Total = sum(Amount) by Region\n| top 2 by Total`,
      correct: result(cols, sortRows(t, [{ by: 'Total', dir: 'desc' }]).slice(0, 2)),
      explain: 'summarize totals each region first; top 2 by Total then sorts those totals descending (the default) and keeps two.',
      distractors: [
        { trap: 'asc-vs-desc', why: 'It keeps the two smallest totals; top defaults to desc.', table: result(cols, sortRows(t, [{ by: 'Total' }]).slice(0, 2)) },
        { trap: 'operator-order', why: 'It picks the two biggest single sales first and totals only those.', table: result(cols, sortRows(topFirst, [{ by: 'Total', dir: 'desc' }])) },
        { trap: 'take-vs-top', why: 'It keeps the first two regions summarize produced, without sorting.', table: result(cols, t.slice(0, 2)) },
      ],
    }
  },
}

export const kqlTemplates: OracleTemplate[] = [k01, k02, k03, k04, k05, k06, k07, k08, k09, k10, k11, k12, k13]
