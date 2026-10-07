/**
 * npm run check:freshness: fetches every cited page, reads its "Last updated on"
 * date, and lists each source Microsoft updated after we last verified it
 * (SOURCE_VERIFIED in src/content/verified.ts), with the machines, questions,
 * puzzles, and labs that cite it. Pages that publish no date (the lab exercise
 * site) are listed separately. Needs network, so it isn't part of npm test.
 * Exits 1 when any source is stale or can't be fetched.
 *   --report <file>  when something changed, also writes a markdown report of it and what it
 *                    affects (used by the weekly freshness workflow)
 */
import { writeFileSync } from 'node:fs'
import { citations, type Citers } from './citations.ts'
import { fetchLearnPage } from './learn-page.ts'
import { SOURCE_VERIFIED } from '../src/content/verified.ts'
import { allQuestions } from '../src/content/questions/index.ts'
import { puzzleById } from '../src/content/puzzles/index.ts'
import { labById } from '../src/content/labs/index.ts'

const cites = citations()
const urls = [...cites.keys()].sort()

interface Row {
  url: string
  verified: string | undefined
  updated: string | null
  status: number
  error?: string
}

const rows: Row[] = []
const queue = [...urls]
async function worker() {
  for (let url = queue.shift(); url; url = queue.shift()) {
    try {
      const p = await fetchLearnPage(url)
      rows.push({ url, verified: SOURCE_VERIFIED[url], updated: p.updated, status: p.status })
    } catch (err) {
      rows.push({ url, verified: SOURCE_VERIFIED[url], updated: null, status: 0, error: err instanceof Error ? err.message : String(err) })
    }
  }
}
// Three at a time: Learn rate-limits bursts (fetchPolitely backs off on 429).
await Promise.all(Array.from({ length: 3 }, worker))
rows.sort((a, b) => a.url.localeCompare(b.url))

const citedBy = (c: Citers) =>
  (
    [
      ['machines', c.machine],
      ['questions', c.question],
      ['puzzles', c.puzzle],
      ['labs', c.lab],
      ['edges', c.edge],
      ['evaluators', c.evaluator],
      ['Oracle traps', c.trap],
      ['shared question sources', c.shared],
    ] as const
  )
    .filter(([, s]) => s.size > 0)
    .map(([k, s]) => `${k}: ${[...s].sort().join(', ')}`)
    .join('\n      ')

const failed = rows.filter((r) => r.status !== 200)
const unverified = rows.filter((r) => r.status === 200 && !r.verified)
const stale = rows.filter((r) => r.status === 200 && r.verified && r.updated && r.updated > r.verified)
const undated = rows.filter((r) => r.status === 200 && !r.updated)

console.log(`Checked ${rows.length} cited pages.`)
if (stale.length > 0) {
  console.log(`\nUpdated on Learn after we verified them (${stale.length}):`)
  for (const r of stale) console.log(`  ✗ ${r.url}\n      updated ${r.updated}, verified ${r.verified}\n      ${citedBy(cites.get(r.url)!)}`)
}
if (unverified.length > 0) {
  console.log(`\nNo verifiedAt date recorded (${unverified.length}):`)
  for (const r of unverified) console.log(`  ✗ ${r.url}`)
}
if (failed.length > 0) {
  console.log(`\nCouldn't fetch (${failed.length}):`)
  for (const r of failed) console.log(`  ✗ ${r.status || 'ERR'} ${r.url}${r.error ? ` (${r.error})` : ''}`)
}
if (undated.length > 0) {
  console.log(`\nNo last-updated date published, so they can't be compared (${undated.length}):`)
  for (const r of undated) console.log(`  · ${r.url} (verified ${r.verified ?? 'never'})`)
}
/** Machines touched by a page: its notes, plus the machines of the questions, puzzles, and labs that cite it. */
const questionMachine = new Map(allQuestions.map((q) => [q.id, q.machineId]))
function machinesOf(c: Citers): string[] {
  const ids = new Set(c.machine)
  for (const q of c.question) {
    const m = questionMachine.get(q)
    if (m) ids.add(m)
  }
  for (const p of c.puzzle) for (const m of puzzleById.get(p)?.meta.machineIds ?? []) ids.add(m)
  for (const l of c.lab) for (const m of labById.get(l)?.machineIds ?? []) ids.add(m)
  return [...ids].sort()
}

const bad = stale.length + unverified.length + failed.length
// The report lists changes only: pages updated since we verified them, pages with no date
// recorded, and pages that are gone (404/410). Network errors and 5xx are transient, so they are
// noted in a report but never cause one. No change → no report file.
const gone = failed.filter((r) => r.status === 404 || r.status === 410)
const transient = failed.filter((r) => !gone.includes(r))
const reportAt = process.argv.indexOf('--report')
if (reportAt > 0 && process.argv[reportAt + 1] && stale.length + unverified.length + gone.length > 0) {
  const list = (xs: Iterable<string>) => [...xs].sort().map((x) => `\`${x}\``).join(', ') || 'none'
  const affected = (c: Citers) => {
    const lines = [`  - machines: ${list(machinesOf(c))}`, `  - questions: ${list(c.question)}`, `  - puzzles: ${list(c.puzzle)}`, `  - labs: ${list(c.lab)}`]
    const other = [...c.edge, ...c.evaluator, ...c.trap, ...c.shared]
    if (other.length) lines.push(`  - also: ${list(other)}`)
    return lines
  }
  const md: string[] = []
  if (stale.length > 0) {
    md.push(`### Learn pages updated after we verified them (${stale.length})`, '')
    for (const r of stale) md.push(`- ${r.url}`, `  - updated ${r.updated}, verified ${r.verified}`, ...affected(cites.get(r.url)!))
    md.push('')
  }
  if (gone.length > 0) {
    md.push(`### Cited pages that are gone (${gone.length})`, '')
    for (const r of gone) md.push(`- ${r.status} ${r.url}`, ...affected(cites.get(r.url)!))
    md.push('')
  }
  if (unverified.length > 0) md.push(`### Cited pages with no verifiedAt date (${unverified.length})`, '', ...unverified.map((r) => `- ${r.url}`), '')
  if (transient.length > 0) md.push(`_Not counted: ${transient.length} page(s) couldn't be fetched this run (network or server error)._`, '')
  writeFileSync(process.argv[reportAt + 1]!, md.join('\n'))
}
console.log(bad === 0 ? `\nFreshness check passed: no cited page changed since it was verified.` : `\nFreshness check failed: ${bad} source(s) need a look.`)
process.exit(bad === 0 ? 0 : 1)
