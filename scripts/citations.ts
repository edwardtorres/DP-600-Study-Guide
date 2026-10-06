/**
 * Every cited page (fragment removed) and the content that cites it: machine
 * notes, questions, puzzles (including evaluator and Oracle trap sources),
 * labs, and verified edges. Shared by check-links, check-freshness, and the
 * claim export.
 */
import { allNotes } from '../src/content/notes/index.ts'
import { notesSources } from '../src/content/validate.ts'
import { edges } from '../src/data/edges.ts'
import { allQuestions } from '../src/content/questions/index.ts'
import { S } from '../src/content/questions/sources.ts'
import { allPuzzles } from '../src/content/puzzles/index.ts'
import { allLabs } from '../src/content/labs/index.ts'
import { ACCESS_SOURCES } from '../src/puzzles/evaluators/access.ts'
import { DEPLOY_SOURCES } from '../src/puzzles/evaluators/deployment.ts'
import { FALLBACK_SOURCES } from '../src/puzzles/evaluators/fallback.ts'
import { LINEAGE_SOURCES } from '../src/puzzles/evaluators/lineage.ts'
import { trapById } from '../src/puzzles/oracle/traps.ts'

export type CiterKind = 'machine' | 'question' | 'puzzle' | 'lab' | 'edge' | 'evaluator' | 'trap' | 'shared'

export interface Citers {
  machine: Set<string>
  question: Set<string>
  puzzle: Set<string>
  lab: Set<string>
  edge: Set<string>
  evaluator: Set<string>
  trap: Set<string>
  shared: Set<string>
}

export const pageOf = (url: string) => url.split('#')[0]!

export function citations(): Map<string, Citers> {
  const map = new Map<string, Citers>()
  const add = (url: string, kind: CiterKind, id: string) => {
    const page = pageOf(url)
    let c = map.get(page)
    if (!c) {
      c = { machine: new Set(), question: new Set(), puzzle: new Set(), lab: new Set(), edge: new Set(), evaluator: new Set(), trap: new Set(), shared: new Set() }
      map.set(page, c)
    }
    c[kind].add(id)
  }
  for (const n of allNotes) for (const u of notesSources(n)) add(u, 'machine', n.machineId)
  for (const e of edges) if (e.verified) add(e.verified.source, 'edge', `${e.from}→${e.to}`)
  for (const q of allQuestions) for (const u of q.sources) add(u, 'question', q.id)
  for (const [k, u] of Object.entries(S)) add(u, 'shared', k)
  for (const p of allPuzzles) {
    for (const u of p.meta.sources) add(u, 'puzzle', p.meta.id)
    for (const d of p.build(0).decisions) for (const u of d.sources) add(u, 'puzzle', p.meta.id)
  }
  for (const [name, srcs] of Object.entries({ access: ACCESS_SOURCES, deployment: DEPLOY_SOURCES, fallback: FALLBACK_SOURCES, lineage: LINEAGE_SOURCES }))
    for (const u of Object.values(srcs)) add(u, 'evaluator', name)
  for (const t of trapById.values()) for (const u of t.sources) add(u, 'trap', t.id)
  for (const l of allLabs) for (const s of [...l.steps, ...l.cleanup]) for (const u of s.sources) add(u, 'lab', l.id)
  return map
}
