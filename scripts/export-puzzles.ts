/**
 * npm run export:puzzles -- <dir>
 * Writes a blind review sample (no keys or explanations) and its key to <dir>,
 * which must be outside the repo. The sample is at least 30% of each puzzle
 * type (Query Oracle: 30% of templates per language, at a fixed seed), plus
 * every Shuttle Fallback, Access Matrix, and Conveyor scenario.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { allPuzzles, oracleTemplates } from '../src/content/puzzles/index.ts'
import { shuffleForPlay } from '../src/puzzles/play.ts'
import type { Puzzle, PuzzleType } from '../src/puzzles/types.ts'

export const REVIEW_SEED = 2026

export function reviewSample(puzzles: Puzzle[]): Puzzle[] {
  const everyOne: PuzzleType[] = ['fallback', 'access', 'conveyor']
  const groups = new Map<string, Puzzle[]>()
  for (const p of puzzles) {
    const key = p.meta.type === 'oracle' ? `oracle:${oracleTemplates.find((t) => t.meta.id === p.meta.id)!.language}` : p.meta.type === 'gearbox' ? `gearbox:${p.meta.id.slice(0, 4)}` : p.meta.type
    groups.set(key, [...(groups.get(key) ?? []), p])
  }
  const out: Puzzle[] = []
  for (const [key, list] of groups) {
    if (everyOne.includes(key as PuzzleType)) {
      out.push(...list)
      continue
    }
    const n = Math.ceil(list.length * 0.3)
    const step = list.length / n
    for (let i = 0; i < n; i++) out.push(list[Math.floor(i * step)]!)
  }
  return out
}

function main() {
  const dir = resolve(process.argv[2] ?? '')
  if (!process.argv[2] || dir.startsWith(resolve('.'))) {
    console.error('Usage: npm run export:puzzles -- <dir outside the repo>')
    process.exit(1)
  }
  mkdirSync(dir, { recursive: true })
  const sample = reviewSample(allPuzzles)
  const blind = sample.map((p) => {
    const i = shuffleForPlay(p.build(REVIEW_SEED), REVIEW_SEED)
    return {
      id: i.meta.id,
      type: i.meta.type,
      title: i.meta.title,
      intro: i.intro,
      context: i.context,
      decisions: i.decisions.map((d) => ({ id: d.id, group: d.group, prompt: d.prompt, choices: d.choices.map((c) => ({ id: c.id, label: c.label, ...(c.table ? { table: c.table } : {}) })) })),
    }
  })
  const keyed = sample.map((p) => {
    const i = shuffleForPlay(p.build(REVIEW_SEED), REVIEW_SEED)
    return { id: i.meta.id, type: i.meta.type, sources: i.meta.sources, decisions: i.decisions.map((d) => ({ id: d.id, prompt: d.prompt, accepted: d.accepted, explain: d.explain, sources: d.sources, choices: d.choices.map((c) => ({ id: c.id, label: c.label, explain: c.explain })) })) }
  })
  writeFileSync(join(dir, 'puzzles-blind.json'), JSON.stringify(blind, null, 1))
  writeFileSync(join(dir, 'puzzles-keyed.json'), JSON.stringify(keyed, null, 1))
  const counts = new Map<string, number>()
  for (const p of sample) counts.set(p.meta.type, (counts.get(p.meta.type) ?? 0) + 1)
  console.log(`Wrote ${sample.length} puzzles (${blind.reduce((n, p) => n + p.decisions.length, 0)} decisions): ${[...counts].map(([k, v]) => `${k} ${v}`).join(', ')}`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
