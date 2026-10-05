/**
 * npm run check:links: fetches every Learn URL cited in notes and verified
 * edges once and reports any that do not return HTTP 200. Needs network.
 */
import { allNotes } from '../src/content/notes/index.ts'
import { notesSources } from '../src/content/validate.ts'
import { edges } from '../src/data/edges.ts'

const urls = [
  ...new Set([...allNotes.flatMap((n) => notesSources(n)), ...edges.flatMap((e) => (e.verified ? [e.verified.source] : []))]),
].sort()

const failures: string[] = []
const queue = [...urls]
async function worker() {
  while (queue.length > 0) {
    const url = queue.shift()!
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.status !== 200) failures.push(`${res.status} ${url}`)
    } catch (err) {
      failures.push(`ERR ${url} (${err instanceof Error ? err.message : String(err)})`)
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker))

if (failures.length > 0) {
  console.error(`Link check failed (${failures.length} of ${urls.length}):`)
  for (const f of failures) console.error(`  ✗ ${f}`)
  process.exit(1)
}
console.log(`Link check passed: ${urls.length} Learn URLs return 200.`)
