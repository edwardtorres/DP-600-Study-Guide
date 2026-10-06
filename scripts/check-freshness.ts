/**
 * npm run check:freshness: fetches every cited page, reads its "Last updated on"
 * date, and lists each source Microsoft updated after we last verified it
 * (SOURCE_VERIFIED in src/content/verified.ts), with the machines, questions,
 * puzzles, and labs that cite it. Pages that publish no date (the lab exercise
 * site) are listed separately. Needs network, so it isn't part of npm test.
 * Exits 1 when any source is stale or can't be fetched.
 */
import { citations, type Citers } from './citations.ts'
import { fetchLearnPage } from './learn-page.ts'
import { SOURCE_VERIFIED } from '../src/content/verified.ts'

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
await Promise.all(Array.from({ length: 6 }, worker))
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
const bad = stale.length + unverified.length + failed.length
console.log(bad === 0 ? `\nFreshness check passed: no cited page changed since it was verified.` : `\nFreshness check failed: ${bad} source(s) need a look.`)
process.exit(bad === 0 ? 0 : 1)
