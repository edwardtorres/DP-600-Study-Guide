/**
 * tsx scripts/compare-puzzle-review.ts <keyed.json> <answers.json>
 * answers.json: { "<puzzleId>": { "<decisionId>": "<choiceId>" } }
 * Prints every decision where the reviewer's answer isn't accepted.
 */
import { readFileSync } from 'node:fs'

const keyed = JSON.parse(readFileSync(process.argv[2]!, 'utf8')) as { id: string; decisions: { id: string; prompt: string; accepted: string[]; choices: { id: string; label: string }[] }[] }[]
const answers = JSON.parse(readFileSync(process.argv[3]!, 'utf8')) as Record<string, Record<string, string>>
let total = 0
let agree = 0
const misses: string[] = []
for (const p of keyed) {
  for (const d of p.decisions) {
    total++
    const a = answers[p.id]?.[d.id]
    if (a !== undefined && d.accepted.includes(a)) agree++
    else {
      const label = (id: string | undefined) => d.choices.find((c) => c.id === id)?.label ?? '(none)'
      misses.push(`${p.id} ${d.id} "${d.prompt}": reviewer ${label(a)} | key ${d.accepted.map(label).join(' / ')}`)
    }
  }
}
console.log(`Agreement: ${agree}/${total} decisions`)
const byPuzzle = new Set(misses.map((m) => m.split(' ')[0]))
console.log(`Puzzles with a disagreement: ${byPuzzle.size}/${keyed.length}`)
for (const m of misses) console.log(`  ✗ ${m}`)
