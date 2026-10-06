/**
 * Step 8 fact-check: exports every claim unit (a statement with the pages it
 * cites) for the checker agents, grouped by checker:
 *   front-office, prepare, semantic, maintain (notes + questions of that floor;
 *   case-study questions go to their machine's floor), and puzzles-labs
 *   (evaluator rules, Oracle traps, puzzle decisions, lab steps).
 *
 *   tsx scripts/export-claims.ts <outDir>
 *
 * Writes <outDir>/<group>.json: { group, units: ClaimUnit[] }. A unit may hold
 * several atomic claims; checkers split them and give each its own verdict.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { allNotes } from '../src/content/notes/index.ts'
import type { Cited } from '../src/content/types.ts'
import { allQuestions, caseStudies } from '../src/content/questions/index.ts'
import type { Question } from '../src/content/questions/types.ts'
import { allPuzzles } from '../src/content/puzzles/index.ts'
import { allLabs } from '../src/content/labs/index.ts'
import { machines } from '../src/data/machines.ts'
import { edges } from '../src/data/edges.ts'
import { accessRules } from '../src/puzzles/evaluators/access.ts'
import { deployRules } from '../src/puzzles/evaluators/deployment.ts'
import { fallbackRules } from '../src/puzzles/evaluators/fallback.ts'
import { lineageRules } from '../src/puzzles/evaluators/lineage.ts'
import { traps } from '../src/puzzles/oracle/traps.ts'

export type Group = 'front-office' | 'prepare' | 'semantic' | 'maintain' | 'puzzles-labs'

export interface ClaimUnit {
  id: string
  /** Where the text lives (file › path). */
  location: string
  kind: string
  text: string
  sources: string[]
  /** Questions: the key, so the checker can flag the facts the key depends on. */
  key?: string
}

const floorGroup: Record<string, Group> = { orientation: 'front-office', prepare: 'prepare', semantic: 'semantic', maintain: 'maintain' }
const machineFloor = new Map(machines.map((m) => [m.id, m.floor]))
const groupOfMachine = (id: string): Group => floorGroup[machineFloor.get(id) ?? ''] ?? 'front-office'

const units: Record<Group, ClaimUnit[]> = { 'front-office': [], prepare: [], semantic: [], maintain: [], 'puzzles-labs': [] }

// ── Notes ────────────────────────────────────────────────────────────
for (const n of allNotes) {
  const g = groupOfMachine(n.machineId)
  const file = `src/content/notes/${machineFloor.get(n.machineId)}.ts › ${n.machineId}`
  const add = (path: string, kind: string, text: string, sources: string[]) =>
    units[g].push({ id: `N:${n.machineId}:${path}`, location: `${file} › ${path}`, kind, text, sources })
  const cited = (path: string, kind: string, items: Cited[] = []) => items.forEach((c, i) => add(`${path}[${i}]`, kind, c.text, c.sources))
  cited('pl300Adds', 'note', n.pl300Adds)
  cited('overview', 'note', n.overview)
  for (const b of n.bullets) {
    cited(`bullets.${b.bulletId}.concepts`, 'note', b.concepts)
    cited(`bullets.${b.bulletId}.howTo`, 'note', b.howTo)
  }
  n.examples.forEach((e, i) =>
    add(`examples[${i}]`, 'worked-example', `${e.title} (${e.language})\n` + e.steps.map((s, j) => `Step ${j + 1} code:\n${s.code}\nExplanation: ${s.explain}`).join('\n'), e.sources),
  )
  cited('traps', 'note', n.traps)
  n.dontConfuse.forEach((d) => cited(`dontConfuse.${d.pairId}`, 'dont-confuse', d.difference))
  n.renamed.forEach((r, i) => add(`renamed[${i}]`, 'rename', `${r.oldName} → ${r.newName}. ${r.note} Exam: ${r.examLikely}`, r.sources))
  n.preview.forEach((p, i) => add(`preview[${i}]`, 'preview-label', `PREVIEW: ${p.feature}. ${p.note}`, p.sources))
  n.upcoming.forEach((u, i) => add(`upcoming[${i}]`, 'dated-change', `${u.date}: ${u.change}`, u.sources))
  n.glossary.forEach((gl, i) => add(`glossary[${i}]`, 'glossary', `${gl.term}: ${gl.definition}`, gl.sources))
  n.contested?.forEach((c, i) => cited(`contested[${i}]`, 'contested-reading', c.readings))
}

// ── Verified prerequisite edges (shown as "verified on Microsoft Learn") ─
for (const e of edges)
  if (e.verified) units[groupOfMachine(e.to)].push({ id: `E:${e.from}>${e.to}`, location: 'src/data/edges.ts', kind: 'verified-edge', text: `${e.from} before ${e.to}: ${e.reason}`, sources: [e.verified.source] })

// ── Questions ────────────────────────────────────────────────────────
function keyText(q: Question): string {
  switch (q.format) {
    case 'single':
      return q.answer
    case 'multi':
      return q.answers.join(', ')
    case 'yesno':
      return q.statements.map((s) => `${s.id}=${s.answer ? 'Yes' : 'No'}`).join(', ')
    case 'order':
      return q.answerOrder.join(' → ')
    case 'match':
      return q.pairs.map((p) => `${p.promptId}→${p.choiceId}`).join(', ')
    case 'dropdown':
      return q.slots.map((s) => `[${s.id}]=${s.answer}`).join(', ')
  }
}

function questionText(q: Question): string {
  const lines = [`Stem: ${q.stem}`]
  if (q.caseStudyId) {
    const c = caseStudies.find((x) => x.id === q.caseStudyId)
    if (c) lines.unshift(`(Case study ${c.company}; the case text is in the case-studies unit.)`)
  }
  switch (q.format) {
    case 'single':
    case 'multi':
      q.options.forEach((o) => lines.push(`Option ${o.id}: ${o.text} — Explanation: ${o.explain}`))
      break
    case 'yesno':
      q.statements.forEach((s) => lines.push(`Statement ${s.id}: ${s.text} — Key: ${s.answer ? 'Yes' : 'No'} — Explanation: ${s.explain}`))
      break
    case 'order':
      q.items.forEach((it) => lines.push(`Item ${it.id}: ${it.text} — Explanation: ${it.explain}`))
      break
    case 'match':
      q.prompts.forEach((p) => lines.push(`Prompt ${p.id}: ${p.text}`))
      q.choices.forEach((c) => lines.push(`Choice ${c.id}: ${c.text}`))
      q.pairs.forEach((p) => lines.push(`Pair ${p.promptId}→${p.choiceId}: ${p.explain}`))
      break
    case 'dropdown':
      lines.push(`Code (${q.language}):\n${q.code}`)
      q.slots.forEach((s) => s.options.forEach((o) => lines.push(`Slot ${s.id} option ${o.id}: ${o.text} — Explanation: ${o.explain}`)))
      break
  }
  if (q.preview) lines.push('(Marked preview.)')
  return lines.join('\n')
}

for (const q of allQuestions) {
  const g = groupOfMachine(q.machineId)
  units[g].push({ id: `Q:${q.id}`, location: `question ${q.id} (${q.machineId}, ${q.bulletIds.join(', ')})`, kind: q.caseStudyId ? 'case-question' : 'question', text: questionText(q), sources: q.sources, key: keyText(q) })
}
for (const c of caseStudies) {
  const qs = allQuestions.filter((q) => q.caseStudyId === c.id)
  // The case text goes to every checker that has one of its questions.
  for (const g of new Set(qs.map((q) => groupOfMachine(q.machineId)))) units[g].push({
    id: `C:${c.id}`,
    location: `src/content/questions/cases*.ts › ${c.id}`,
    kind: 'case-study',
    text: JSON.stringify(c, null, 1),
    sources: [...new Set(qs.flatMap((q) => q.sources))],
  })
}

// ── Puzzles: evaluator rules, Oracle traps, and every puzzle's decisions ─
const pl = units['puzzles-labs']
const rule = (file: string, r: { id: string; text: string; source: string }) => pl.push({ id: `R:${r.id}`, location: file, kind: 'evaluator-rule', text: r.text, sources: [r.source] })
fallbackRules.forEach((r) => rule('src/puzzles/evaluators/fallback.ts', r))
Object.values(accessRules).forEach((r) => rule('src/puzzles/evaluators/access.ts', r))
Object.values(deployRules).forEach((r) => rule('src/puzzles/evaluators/deployment.ts', r))
Object.values(lineageRules).forEach((r) => rule('src/puzzles/evaluators/lineage.ts', r))
traps.forEach((t) => pl.push({ id: `T:${t.id}`, location: 'src/puzzles/oracle/traps.ts', kind: 'oracle-trap', text: `${t.label}: ${t.rule}`, sources: t.sources }))
for (const p of allPuzzles) {
  const inst = p.build(1)
  const lines = [`${p.meta.title} (${p.meta.type})`, `Intro: ${inst.intro}`]
  if (inst.context.kind === 'facts') inst.context.facts.forEach((f) => lines.push(`Fact: ${f.label}: ${f.value}`))
  if (inst.context.kind === 'oracle') lines.push(`Query (${inst.context.language}):\n${inst.context.query}`)
  for (const d of inst.decisions) {
    lines.push(`Decision ${d.id}${d.group ? ` [${d.group}]` : ''}: ${d.prompt}`)
    for (const c of d.choices) lines.push(`  Choice ${c.id}: ${c.label}${d.accepted.includes(c.id) ? ' (ACCEPTED)' : ''} — ${c.explain}`)
    lines.push(`  Why: ${d.explain}`)
  }
  pl.push({
    id: `P:${p.meta.id}`,
    location: `puzzle ${p.meta.id} (${p.meta.machineIds.join(', ')})`,
    kind: 'puzzle',
    text: lines.join('\n'),
    sources: [...new Set([...p.meta.sources, ...inst.decisions.flatMap((d) => d.sources)])],
  })
}

// ── Labs: goals, step statements, checkpoints, trap notes, cost notes ─
for (const l of allLabs) {
  pl.push({ id: `L:${l.id}:goal`, location: `lab ${l.id}`, kind: 'lab-goal', text: `${l.title}. ${l.goal}${l.before ? `\nBefore: ${l.before}` : ''}`, sources: [...new Set(l.steps.flatMap((s) => s.sources))] })
  for (const s of [...l.steps, ...l.cleanup]) {
    const lines = [`Step: ${s.text}`]
    if (s.checkpoint) lines.push(`Checkpoint: ${s.checkpoint}`)
    if (s.trapNote) lines.push(`Trap note: ${s.trapNote}`)
    if (s.cost) lines.push(`Cost note: ${s.cost}`)
    pl.push({ id: `L:${l.id}:${s.id}`, location: `lab ${l.id} step ${s.id}`, kind: 'lab-step', text: lines.join('\n'), sources: s.sources })
  }
}

const outDir = process.argv[2]
if (!outDir) {
  console.error('Usage: tsx scripts/export-claims.ts <outDir>')
  process.exit(1)
}
mkdirSync(outDir, { recursive: true })
for (const [group, list] of Object.entries(units)) {
  writeFileSync(`${outDir}/${group}.json`, JSON.stringify({ group, units: list }, null, 1))
  console.log(`${group}: ${list.length} units`)
}
