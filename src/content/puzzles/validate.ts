import type { Machine, Outline } from '../../data/types'
import { caseProblems, generateCase, type OracleTemplate } from '../../puzzles/oracle/template'
import { trapById } from '../../puzzles/oracle/traps'
import type { Puzzle, PuzzleInstance, PuzzleType } from '../../puzzles/types'
import { pairIndex } from '../pairs'
import { BANNED_TERMS } from '../questions/requirements'
import { ORACLE_CHECK_SEEDS, PUZZLE_MINIMUMS } from './requirements'

const LEARN = /^https:\/\/learn\.microsoft\.com\//

function domainOfBullet(outline: Outline, id: string): string | null {
  for (const d of outline.domains) for (const s of d.sections) if (s.bullets.some((b) => b.id === id)) return d.id
  return null
}

/** Every piece of text a player can see in an instance. */
export function instanceText(i: PuzzleInstance): string[] {
  const out = [i.meta.title, i.intro]
  const c = i.context
  if (c.kind === 'oracle') out.push(c.query, ...c.tables.flatMap((t) => [t.name, ...t.columns, ...t.rows.flat().map(String)]))
  if (c.kind === 'facts') out.push(...c.facts.flatMap((f) => [f.label, f.value]), ...(c.tables ?? []).flatMap((t) => [t.name, ...t.columns, ...t.rows.flat().map(String)]))
  if (c.kind === 'graph') out.push(...c.nodes.flatMap((n) => [n.label, n.itemType, n.workspace]))
  for (const d of i.decisions) {
    out.push(d.prompt, d.explain, d.group ?? '')
    for (const ch of d.choices) out.push(ch.label, ch.explain, ...(ch.table ? ch.table.rows.flat().map(String) : []))
  }
  return out
}

export interface PuzzleStats {
  total: number
  byType: Map<PuzzleType, number>
  byMachine: Map<string, number>
  byDomain: Map<string, number>
  oracleByLanguage: Map<string, number>
  gearboxByDeck: Map<string, number>
  decisions: number
}

export function puzzleStats(outline: Outline, puzzles: Puzzle[], templates: OracleTemplate[]): PuzzleStats {
  const inc = <K>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1)
  const st: PuzzleStats = { total: puzzles.length, byType: new Map(), byMachine: new Map(), byDomain: new Map(), oracleByLanguage: new Map(), gearboxByDeck: new Map(), decisions: 0 }
  for (const p of puzzles) {
    inc(st.byType, p.meta.type)
    for (const m of p.meta.machineIds) inc(st.byMachine, m)
    inc(st.byDomain, domainOfBullet(outline, p.meta.bulletIds[0] ?? '') ?? '?')
    if (p.meta.type === 'gearbox') inc(st.gearboxByDeck, p.meta.id.startsWith('GB-S') ? 'storage' : 'store')
    st.decisions += p.build(0).decisions.length
  }
  for (const t of templates) inc(st.oracleByLanguage, t.language)
  return st
}

/**
 * Checks every puzzle: schema, machine and bullet links, one domain per
 * puzzle, Learn-only sources, banned terms, trap pairs, minimum counts, and
 * (for Query Oracle) that every template generates valid cases.
 */
export function validatePuzzles(outline: Outline, machines: Machine[], puzzles: Puzzle[], templates: OracleTemplate[], questionIds: Iterable<string>): string[] {
  const errors: string[] = []
  const machineById = new Map(machines.map((m) => [m.id, m]))
  const qids = new Set(questionIds)
  const ids = new Set<string>()
  for (const p of puzzles) {
    const m = p.meta
    const at = (msg: string) => errors.push(`Puzzle ${m.id}: ${msg}`)
    if (ids.has(m.id)) at('duplicate id')
    ids.add(m.id)
    if (qids.has(m.id)) at('id collides with a question id (they share the answer log)')
    if (![1, 2, 3].includes(m.difficulty)) at('difficulty must be 1–3')
    if (!m.title.trim()) at('missing title')
    if (m.machineIds.length === 0) at('no machine')
    if (m.bulletIds.length === 0) at('no bullet')
    const machineBullets = new Set<string>()
    for (const id of m.machineIds) {
      const mc = machineById.get(id)
      if (!mc) at(`unknown machine ${id}`)
      else {
        mc.bulletIds.forEach((b) => machineBullets.add(b))
        if (!mc.bulletIds.some((b) => m.bulletIds.includes(b))) at(`machine ${id} owns none of the puzzle’s bullets`)
      }
    }
    for (const b of m.bulletIds) if (!machineBullets.has(b)) at(`bullet ${b} isn’t on its machines`)
    const domains = new Set(m.bulletIds.map((b) => domainOfBullet(outline, b)))
    if (domains.size !== 1 || domains.has(null)) at(`bullets must sit in exactly one domain (got ${[...domains].join(', ')})`)
    if (m.sources.length === 0) at('no sources')
    for (const s of m.sources) if (!LEARN.test(s)) at(`source isn’t learn.microsoft.com: ${s}`)
    if (m.trapPairId && !pairIndex.has(m.trapPairId)) at(`unknown trap pair ${m.trapPairId}`)

    let instances: PuzzleInstance[]
    try {
      instances = m.type === 'oracle' ? [p.build(0), p.build(1), p.build(2)] : [p.build(0)]
    } catch (e) {
      at(`doesn’t build: ${e instanceof Error ? e.message : String(e)}`)
      continue
    }
    for (const i of instances) {
      if (i.decisions.length === 0) at('has no decisions')
      const dids = new Set<string>()
      for (const d of i.decisions) {
        const dat = (msg: string) => at(`decision ${d.id}: ${msg}`)
        if (dids.has(d.id)) dat('duplicate decision id')
        dids.add(d.id)
        if (d.choices.length < 2) dat('needs at least 2 choices')
        if (new Set(d.choices.map((c) => c.id)).size !== d.choices.length) dat('duplicate choice ids')
        if (d.accepted.length === 0) dat('no accepted answer')
        for (const a of d.accepted) if (!d.choices.some((c) => c.id === a)) dat(`accepted ${a} isn’t a choice`)
        if (d.accepted.length === d.choices.length) dat('every choice is accepted')
        for (const c of d.choices) if (!c.explain.trim()) dat(`choice ${c.id} has no explanation`)
        if (!d.explain.trim()) dat('no explanation')
        if (d.sources.length === 0) dat('no sources')
        for (const s of d.sources) if (!LEARN.test(s)) dat(`source isn’t learn.microsoft.com: ${s}`)
        if (d.ui === 'toggle' && !d.initial) dat('toggle needs an initial value')
      }
      const text = instanceText(i).join('\n')
      for (const re of BANNED_TERMS) if (re.test(text)) at(`uses a banned phrase (${re.source})`)
    }
  }

  // Query Oracle templates: every seed builds 4 distinct, valid candidates.
  for (const t of templates) {
    for (const tr of t.traps) if (!trapById.has(tr)) errors.push(`Template ${t.meta.id}: unknown trap ${tr}`)
    for (let seed = 0; seed < ORACLE_CHECK_SEEDS; seed++) {
      try {
        const c = generateCase(t, seed)
        const problems = caseProblems(c)
        if (problems.length) errors.push(`Template ${t.meta.id} seed ${seed}: ${problems.join('; ')}`)
        for (const d of c.distractors) if (!t.traps.includes(d.trap)) errors.push(`Template ${t.meta.id}: distractor trap ${d.trap} isn’t declared`)
      } catch (e) {
        errors.push(`Template ${t.meta.id}: ${e instanceof Error ? e.message : String(e)}`)
        break
      }
    }
  }
  for (const tr of trapById.values()) {
    if (tr.sources.length === 0) errors.push(`Trap ${tr.id}: no sources`)
    for (const s of tr.sources) if (!LEARN.test(s)) errors.push(`Trap ${tr.id}: source isn’t learn.microsoft.com: ${s}`)
  }

  // Minimum counts.
  const st = puzzleStats(outline, puzzles, templates)
  for (const lang of ['tsql', 'kql', 'dax'])
    if ((st.oracleByLanguage.get(lang) ?? 0) < PUZZLE_MINIMUMS.oraclePerLanguage) errors.push(`Query Oracle ${lang}: ${st.oracleByLanguage.get(lang) ?? 0} templates, needs ${PUZZLE_MINIMUMS.oraclePerLanguage}`)
  const need = (type: PuzzleType, n: number) => {
    if ((st.byType.get(type) ?? 0) < n) errors.push(`${type}: ${st.byType.get(type) ?? 0} puzzles, needs ${n}`)
  }
  need('pattern', PUZZLE_MINIMUMS.pattern)
  need('fallback', PUZZLE_MINIMUMS.fallback)
  need('access', PUZZLE_MINIMUMS.access)
  for (const deck of ['storage', 'store'])
    if ((st.gearboxByDeck.get(deck) ?? 0) < PUZZLE_MINIMUMS.gearboxPerDeck) errors.push(`Gearbox ${deck} deck: ${st.gearboxByDeck.get(deck) ?? 0} cards, needs ${PUZZLE_MINIMUMS.gearboxPerDeck}`)
  const rc = (st.byType.get('ripple') ?? 0) + (st.byType.get('conveyor') ?? 0)
  if (rc < PUZZLE_MINIMUMS.rippleAndConveyor) errors.push(`Ripple & Conveyor: ${rc} scenarios, needs ${PUZZLE_MINIMUMS.rippleAndConveyor}`)
  return errors
}

/** Every learn.microsoft.com URL the puzzles cite (for check:links). */
export function puzzleSources(puzzles: Puzzle[]): string[] {
  const urls = new Set<string>()
  for (const p of puzzles) {
    p.meta.sources.forEach((s) => urls.add(s))
    for (const d of p.build(0).decisions) d.sources.forEach((s) => urls.add(s))
  }
  for (const t of trapById.values()) t.sources.forEach((s) => urls.add(s))
  return [...urls]
}
