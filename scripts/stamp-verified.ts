/**
 * Records verifiedAt dates in src/content/verified.ts.
 *   tsx scripts/stamp-verified.ts <YYYY-MM-DD> [url-or-machineId ...]
 * With no ids, adds the date for every cited page and machine that has none and
 * keeps existing dates. With ids, sets the date for just those (after you
 * re-check them against Learn). Never stamp a source you haven't re-read.
 */
import { writeFileSync } from 'node:fs'
import { citations } from './citations.ts'
import { allNotes } from '../src/content/notes/index.ts'
import { NOTES_VERIFIED, SOURCE_VERIFIED } from '../src/content/verified.ts'

const [date, ...ids] = process.argv.slice(2)
if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  console.error('Usage: tsx scripts/stamp-verified.ts <YYYY-MM-DD> [url-or-machineId ...]')
  process.exit(1)
}

const sources: Record<string, string> = {}
for (const url of [...citations().keys()].sort()) {
  const keep = SOURCE_VERIFIED[url]
  sources[url] = ids.length === 0 ? (keep ?? date) : ids.includes(url) ? date : (keep ?? date)
}
const notes: Record<string, string> = {}
for (const id of allNotes.map((n) => n.machineId).sort()) {
  const keep = NOTES_VERIFIED[id]
  notes[id] = ids.length === 0 ? (keep ?? date) : ids.includes(id) ? date : (keep ?? date)
}

const obj = (o: Record<string, string>) =>
  Object.entries(o)
    .map(([k, v]) => `  ${JSON.stringify(k)}: '${v}',`)
    .join('\n')

writeFileSync(
  'src/content/verified.ts',
  `/**
 * When each cited source, and each machine's notes, were last checked against
 * Microsoft Learn (Step 8 fact-check). npm run check:freshness compares these
 * dates with each page's "Last updated on" date. Update with
 * scripts/stamp-verified.ts after re-checking; don't edit by hand.
 */

/** Cited page (without #fragment) → day it was verified (YYYY-MM-DD). */
export const SOURCE_VERIFIED: Record<string, string> = {
${obj(sources)}
}

/** Machine id → day its notes were last checked against Learn. */
export const NOTES_VERIFIED: Record<string, string> = {
${obj(notes)}
}
`,
)
console.log(`Wrote ${Object.keys(sources).length} sources and ${Object.keys(notes).length} machines.`)
