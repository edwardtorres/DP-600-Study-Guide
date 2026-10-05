/**
 * Compares a reviewer's blind answers with the answer key.
 *   tsx scripts/compare-review.ts <keyed.json> <answers.json>
 * answers.json: { "<questionId>": <answer> } where answer is
 *   single: "b" | multi: ["a","c"] | yesno: {"s1": true,...} | order: ["c","a","b"]
 *   match: {"p1": "c2",...} | dropdown: {"1": "b",...}
 */
import { readFileSync } from 'node:fs'
import type { Question } from '../src/content/questions/types.ts'

const [keyedPath, answersPath] = process.argv.slice(2)
const keyed: { questions: Question[] } = JSON.parse(readFileSync(keyedPath!, 'utf8'))
const answers: Record<string, unknown> = JSON.parse(readFileSync(answersPath!, 'utf8'))

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const sortObj = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).sort())
const mismatches: string[] = []
let missing = 0
for (const q of keyed.questions) {
  const got = answers[q.id]
  if (got === undefined) {
    missing++
    mismatches.push(`${q.id}: no reviewer answer`)
    continue
  }
  let key: unknown
  switch (q.format) {
    case 'single':
      key = q.answer
      break
    case 'multi':
      key = [...q.answers].sort()
      break
    case 'yesno':
      key = sortObj(Object.fromEntries(q.statements.map((s) => [s.id, s.answer])))
      break
    case 'order':
      key = q.answerOrder
      break
    case 'match':
      key = sortObj(Object.fromEntries(q.pairs.map((p) => [p.promptId, p.choiceId])))
      break
    case 'dropdown':
      key = sortObj(Object.fromEntries(q.slots.map((s) => [s.id, s.answer])))
      break
  }
  const norm = Array.isArray(got) && q.format === 'multi' ? [...got].sort() : typeof got === 'object' && got && !Array.isArray(got) ? sortObj(got as Record<string, unknown>) : got
  if (!same(norm, key)) mismatches.push(`${q.id} [${q.format}]: reviewer ${JSON.stringify(norm)} vs key ${JSON.stringify(key)}`)
}
console.log(`${keyed.questions.length - mismatches.length}/${keyed.questions.length} match (${missing} missing)`)
for (const m of mismatches) console.log(`  ✗ ${m}`)
