/**
 * npm run check:links: fetches every Learn URL cited in notes, verified edges,
 * questions, puzzles, and labs (plus the shared question source list) once and reports any that do not return HTTP 200.
 * Lab sources link to a section, so for those it also checks that the page has an element with that #id. Needs network.
 */
import { allNotes } from '../src/content/notes/index.ts'
import { notesSources } from '../src/content/validate.ts'
import { edges } from '../src/data/edges.ts'
import { allQuestions } from '../src/content/questions/index.ts'
import { S } from '../src/content/questions/sources.ts'
import { allPuzzles } from '../src/content/puzzles/index.ts'
import { puzzleSources } from '../src/content/puzzles/validate.ts'
import { allLabs } from '../src/content/labs/index.ts'
import { labSources } from '../src/content/labs/validate.ts'

const urls = [
  ...new Set([...allNotes.flatMap((n) => notesSources(n)), ...edges.flatMap((e) => (e.verified ? [e.verified.source] : [])),
    ...allQuestions.flatMap((q) => q.sources),
    ...Object.values(S),
    ...puzzleSources(allPuzzles),
    ...labSources(allLabs).map((u) => u.split('#')[0]!),
  ]),
].sort()

/** Fragments each page must contain (lab steps link to sections). */
const anchors = new Map<string, Set<string>>()
for (const u of labSources(allLabs)) {
  const [page, frag] = u.split('#') as [string, string | undefined]
  if (frag) anchors.set(page, (anchors.get(page) ?? new Set()).add(frag))
}

const failures: string[] = []
const queue = [...urls]
async function worker() {
  while (queue.length > 0) {
    const url = queue.shift()!
    try {
      const res = await fetch(url, { redirect: 'follow' })
      if (res.status !== 200) failures.push(`${res.status} ${url}`)
      else if (anchors.has(url)) {
        const html = await res.text()
        for (const frag of anchors.get(url)!) if (!html.includes(`id="${frag}"`)) failures.push(`missing section #${frag} on ${url}`)
      }
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
console.log(`Link check passed: ${urls.length} URLs return 200, and ${[...anchors.values()].reduce((n, a) => n + a.size, 0)} lab sections exist.`)
