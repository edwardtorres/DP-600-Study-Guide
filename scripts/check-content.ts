/**
 * npm run check:content           → app structure vs scripts/official-outline.json
 * npm run check:content -- --live → also re-fetch the study guide and diff the bullets
 */
import { edges } from '../src/data/edges.ts'
import { machines } from '../src/data/machines.ts'
import { outline } from '../src/data/outline.ts'
import { validateAll } from '../src/data/validate.ts'
import { floors } from '../src/data/floors.ts'
import { allNotes, notesByMachine } from '../src/content/notes/index.ts'
import { NOTES_PENDING } from '../src/content/requirements.ts'
import { notesSources, notesWordCount, validateNotes } from '../src/content/validate.ts'

const decode = (s: string) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()

/** Extracts "domain › section › bullet" lines from the live page's version section. */
export function parseLive(html: string, version: string): string[] {
  const start = html.indexOf(version)
  if (start < 0) throw new Error(`Live page has no "${version}" section`)
  const end = html.indexOf('Study resources', start)
  const segment = html.slice(start, end < 0 ? undefined : end)
  const lines: string[] = []
  let domain = ''
  let section = ''
  let inSkills = false
  for (const m of segment.matchAll(/<(h3|h4)[^>]*>([\s\S]*?)<\/\1>|<li[^>]*>([\s\S]*?)<\/li>/g)) {
    if (m[1] === 'h3') {
      const title = decode(m[2] ?? '')
      if (title === 'Skills at a glance') inSkills = true
      else if (inSkills && /\(\d+–\d+%\)$/.test(title)) domain = title
      section = ''
    } else if (m[1] === 'h4' && domain) {
      section = decode(m[2] ?? '')
    } else if (m[3] !== undefined && section) {
      lines.push(`${domain} › ${section} › ${decode(m[3])}`)
    }
  }
  return lines
}

function recordedLines(): string[] {
  return outline.domains.flatMap((d) =>
    d.sections.flatMap((s) => s.bullets.map((b) => `${d.title} (${d.weightText}) › ${s.title} › ${b.text}`)),
  )
}

function printNotesSummary() {
  console.log('Notes by floor:')
  for (const floor of floors) {
    const onFloor = machines.filter((m) => m.floor === floor.id)
    const written = onFloor.map((m) => notesByMachine.get(m.id)).filter((n) => n !== undefined)
    const words = written.reduce((sum, n) => sum + notesWordCount(n), 0)
    const sources = new Set(written.flatMap((n) => notesSources(n)))
    const pending = NOTES_PENDING.includes(floor.id) ? '  (pending)' : ''
    console.log(`  ${floor.name}: ${written.length}/${onFloor.length} machines, ${words} words, ${sources.size} sources${pending}`)
  }
  const nv = allNotes.flatMap((n) => n.needsVerification.map((v) => `${n.machineId}: ${v.claim} (${v.why})`))
  console.log(`Needs verification (${nv.length}):`)
  for (const v of nv) console.log(`  ? ${v}`)
  if (NOTES_PENDING.length > 0) console.warn(`⚠ Notes still pending for: ${NOTES_PENDING.join(', ')}`)
}

async function main() {
  const errors = [...validateAll(outline, machines, edges), ...validateNotes(machines, allNotes)]

  if (process.argv.includes('--live')) {
    const res = await fetch(outline.source)
    if (!res.ok) {
      errors.push(`Could not fetch ${outline.source}: HTTP ${res.status}`)
    } else {
      const live = parseLive(await res.text(), outline.version)
      const recorded = recordedLines()
      const liveSet = new Set(live)
      const recSet = new Set(recorded)
      for (const l of live) if (!recSet.has(l)) errors.push(`On live page but not recorded: ${l}`)
      for (const l of recorded) if (!liveSet.has(l)) errors.push(`Recorded but not on live page: ${l}`)
      if (errors.length === 0) console.log(`Live page matches the recorded outline (${live.length} bullets).`)
    }
  }

  if (errors.length > 0) {
    console.error(`Content check failed (${errors.length}):`)
    for (const e of errors) console.error(`  ✗ ${e}`)
    process.exit(1)
  }
  printNotesSummary()
  const bullets = machines.reduce((n, m) => n + m.bulletIds.length, 0)
  console.log(
    `Content check passed: ${outline.domains.length} domains, ` +
      `${outline.domains.flatMap((d) => d.sections).length} sections, ${bullets} bullets mapped once across ` +
      `${machines.length} machines (${machines.filter((m) => m.orientation).length} orientation), ${edges.length} threads.`,
  )
}

await main()
