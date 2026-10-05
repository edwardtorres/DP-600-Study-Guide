import type { Difficulty } from '../content/questions/types'
import { evaluateAccess, type AccessQuestion, type AccessSetup, type AccessUser } from './evaluators/access'
import { bindLabel, evaluateAction, evaluateBinding, type BindingCase, type BindOutcome, type PipelineAction, type PipelineUser } from './evaluators/deployment'
import { evaluateFallback, outcomeLabel, type FallbackInput, type Outcome } from './evaluators/fallback'
import { assertAcyclic, children, downstream, lineageRules } from './evaluators/lineage'
import type { DataTable, Decision, Puzzle, PuzzleChoice, PuzzleContext, PuzzleMeta, PuzzleType } from './types'

/**
 * Turns authored scenarios into playable puzzles. Shuttle Fallback, Access
 * Matrix, Ripple, and Conveyor scenarios store inputs only: every accepted
 * answer is computed here by the matching evaluator.
 */

interface Base {
  id: string
  title: string
  machineIds: string[]
  bulletIds: string[]
  difficulty: Difficulty
  sources: string[]
  trapPairId?: string
}

const metaOf = (type: PuzzleType, b: Base): PuzzleMeta => ({
  id: b.id,
  type,
  title: b.title,
  machineIds: b.machineIds,
  bulletIds: b.bulletIds,
  difficulty: b.difficulty,
  sources: b.sources,
  ...(b.trapPairId ? { trapPairId: b.trapPairId } : {}),
})

export function staticPuzzle(meta: PuzzleMeta, intro: string, context: PuzzleContext, decisions: Decision[]): Puzzle {
  return { meta, build: () => ({ meta, intro, context, decisions }) }
}

const uniq = <T>(xs: T[]) => [...new Set(xs)]

// ── Gearbox Picker ─────────────────────────────────────────────────────

export interface DeckOption {
  id: string
  label: string
  /** What the option is, from Learn; shown when a card has no specific note. */
  explain: string
}

export interface GearboxCard extends Base {
  scenario: string
  accepted: string[]
  /** Why the accepted option(s) fit. */
  why: string
  /** Card-specific notes on why an option does or doesn't fit. */
  notes?: Record<string, string>
}

export function gearboxPuzzle(deckName: string, options: DeckOption[], card: GearboxCard): Puzzle {
  for (const a of card.accepted) if (!options.some((o) => o.id === a)) throw new Error(`${card.id}: unknown option ${a}`)
  const choices: PuzzleChoice[] = options.map((o) => ({
    id: o.id,
    label: o.label,
    explain: card.notes?.[o.id] ?? (card.accepted.includes(o.id) ? card.why : `Not the best fit here. ${o.explain}`),
  }))
  const meta = metaOf('gearbox', card)
  return staticPuzzle(meta, card.scenario, { kind: 'facts', facts: [{ label: 'Deck', value: deckName }] }, [
    { id: 'pick', prompt: `Which ${deckName.toLowerCase()} fits best?`, ui: 'buttons', choices, accepted: card.accepted, explain: card.why, sources: card.sources },
  ])
}

// ── Pattern Draft ──────────────────────────────────────────────────────

export type ColumnRole = 'measure' | 'attribute' | `dim:${string}`
export type KeyChoice = 'surrogate' | 'natural' | 'smart-date'
export type ChangeChoice = 'type1' | 'type2' | 'type3' | 'fact'
export type Cardinality = 'one-to-many' | 'many-to-many' | 'one-to-one'
export type Direction = 'single' | 'both'

export interface PatternScenario extends Base {
  story: string
  /** A few rows of the flat source. */
  source: DataTable
  grain: { choices: string[]; accepted: number[]; why: string }
  /** Dimension names offered for column assignment. */
  dimensions: string[]
  columns: { name: string; accepted: ColumnRole[]; why: string }[]
  keys: { dimension: string; accepted: KeyChoice[]; why: string }[]
  changes: { attribute: string; accepted: ChangeChoice[]; why: string }[]
  relationships: { from: string; to: string; cardinality: Cardinality[]; direction: Direction[]; why: string }[]
}

const SS = 'https://learn.microsoft.com/en-us/power-bi/guidance/star-schema'
const DIM = 'https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-dimension-tables'
const FACT = 'https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-fact-tables'
const M2M = 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-many-to-many'
const BIDI = 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-bidirectional-filtering'
const ONE1 = 'https://learn.microsoft.com/en-us/power-bi/guidance/relationships-one-to-one'

const roleExplain = {
  measure: 'Fact measure: a typically numeric column that queries summarize (sum, count, average…).',
  attribute: 'Fact attribute: describes the event and sets its granularity (for example an order or ticket number); it can form a degenerate dimension.',
  dim: (d: string) => `Dimension attribute of ${d}: describes a business entity used to filter and group facts.`,
}
const keyChoices: Record<KeyChoice, { label: string; explain: string }> = {
  surrogate: { label: 'Add a generated surrogate key', explain: 'A surrogate key is a single-column unique identifier generated and stored in the dimension. Learn recommends it even when a natural key seems acceptable, and SCD type 2 requires it.' },
  natural: { label: 'Use the source system’s natural key', explain: 'The natural (business) key relates the dimension to its source, but it can repeat once versions are stored and isn’t insulated from source changes.' },
  'smart-date': { label: 'Use a meaningful date key (for example 20261005)', explain: 'Key values should carry no meaning, except for date and time dimension keys, where a meaningful key is acceptable.' },
}
const changeChoices: Record<ChangeChoice, { label: string; explain: string }> = {
  type1: { label: 'SCD type 1 (overwrite)', explain: 'Type 1 overwrites the row: no history is kept, as if the member always had the new value. Use it for most changing attributes and to correct errors.' },
  type2: { label: 'SCD type 2 (new version row)', explain: 'Type 2 inserts a new, time-based version row (with validity dates and a current flag), so history keeps its original context. Reserve it for attributes whose history matters.' },
  type3: { label: 'SCD type 3 (previous-value column)', explain: 'Type 3 keeps limited history in extra columns. It isn’t commonly used and is hard to use in a semantic model.' },
  fact: { label: 'Store it in the fact table instead', explain: 'An attribute that changes rapidly (for example a frequently changing price) belongs in the fact table rather than versioning the dimension.' },
}
const cardinalityLabel: Record<Cardinality, string> = { 'one-to-many': 'One-to-many', 'many-to-many': 'Many-to-many', 'one-to-one': 'One-to-one' }
const cardinalityExplain: Record<Cardinality, string> = {
  'one-to-many': 'One-to-many: the dimension’s unique key is the “one” side and the fact table is the “many” side.',
  'many-to-many': 'Many-to-many: both columns can hold duplicates. Learn uses it to relate a dimension to a higher-grain fact, not to relate two dimensions directly.',
  'one-to-one': 'One-to-one: both columns are unique. Learn generally doesn’t recommend it; it’s always bi-directional.',
}
const directionExplain: Record<Direction, string> = {
  single: 'Single: filters flow from the one side (dimension) to the many side (fact). Learn recommends minimizing bi-directional relationships.',
  both: 'Both: filters flow in both directions. Needed when a bridging table must pass a filter from one dimension to another; otherwise it can hurt performance and confuse users.',
}

export function patternPuzzle(s: PatternScenario): Puzzle {
  const sources = uniq([...s.sources, SS])
  const decisions: Decision[] = []
  decisions.push({
    id: 'grain',
    group: '1 · Grain',
    prompt: 'What is the grain of the fact table?',
    ui: 'buttons',
    choices: s.grain.choices.map((c, i) => ({ id: `g${i}`, label: c, explain: s.grain.accepted.includes(i) ? s.grain.why : 'This isn’t the level one fact row represents for this requirement.' })),
    accepted: s.grain.accepted.map((i) => `g${i}`),
    explain: s.grain.why,
    sources: uniq([FACT, SS]),
  })
  const roleChoices: PuzzleChoice[] = [
    { id: 'measure', label: 'Fact: measure', explain: roleExplain.measure },
    { id: 'attribute', label: 'Fact: attribute (degenerate dimension)', explain: roleExplain.attribute },
    ...s.dimensions.map((d) => ({ id: `dim:${d}`, label: `Dimension: ${d}`, explain: roleExplain.dim(d) })),
  ]
  for (const c of s.columns)
    decisions.push({ id: `col-${c.name}`, group: '2 · Columns', prompt: `Where does ${c.name} go?`, ui: 'select', choices: roleChoices, accepted: c.accepted, explain: c.why, sources: uniq([FACT, DIM, SS]) })
  for (const k of s.keys) {
    const opts: KeyChoice[] = k.dimension === 'Date' ? ['surrogate', 'natural', 'smart-date'] : ['surrogate', 'natural']
    decisions.push({
      id: `key-${k.dimension}`,
      group: '3 · Keys',
      prompt: `Which key should the ${k.dimension} dimension use?`,
      ui: 'buttons',
      choices: opts.map((o) => ({ id: o, ...keyChoices[o] })),
      accepted: k.accepted,
      explain: k.why,
      sources: [DIM, SS],
    })
  }
  for (const c of s.changes)
    decisions.push({
      id: `scd-${c.attribute}`,
      group: '4 · Changing attributes',
      prompt: `How should changes to ${c.attribute} be handled?`,
      ui: 'buttons',
      choices: (Object.keys(changeChoices) as ChangeChoice[]).map((o) => ({ id: o, ...changeChoices[o] })),
      accepted: c.accepted,
      explain: c.why,
      sources: [DIM, SS],
    })
  for (const r of s.relationships) {
    const name = `${r.from} → ${r.to}`
    decisions.push({
      id: `card-${r.from}-${r.to}`,
      group: '5 · Relationships',
      prompt: `Cardinality of ${name}?`,
      ui: 'buttons',
      choices: (Object.keys(cardinalityLabel) as Cardinality[]).map((o) => ({ id: o, label: cardinalityLabel[o], explain: cardinalityExplain[o] })),
      accepted: r.cardinality,
      explain: r.why,
      sources: uniq([SS, M2M, ONE1]),
    })
    decisions.push({
      id: `dir-${r.from}-${r.to}`,
      group: '5 · Relationships',
      prompt: `Cross-filter direction of ${name}?`,
      ui: 'buttons',
      choices: (['single', 'both'] as Direction[]).map((o) => ({ id: o, label: o === 'single' ? 'Single' : 'Both', explain: directionExplain[o] })),
      accepted: r.direction,
      explain: r.why,
      sources: uniq([BIDI, M2M]),
    })
  }
  return staticPuzzle(metaOf('pattern', { ...s, sources }), s.story, { kind: 'facts', facts: [], tables: [s.source] }, decisions)
}

// ── Shuttle Fallback ───────────────────────────────────────────────────

export interface FallbackScenario extends Base {
  story: string
  input: FallbackInput
  /** How the situation is described to the player (no answer hints). */
  situationText: string
}

const modeText = { onelake: 'Direct Lake on OneLake', sql: 'Direct Lake on SQL analytics endpoint' } as const

export function fallbackPuzzle(s: FallbackScenario): Puzzle {
  const r = evaluateFallback(s.input)
  if (!r) throw new Error(`${s.id}: Learn doesn’t state this combination outright`)
  const outcomes: Outcome[] = ['directlake', 'directquery', 'error']
  const choices = outcomes.map((o) => ({
    id: o,
    label: outcomeLabel[o],
    explain: o === r.outcome ? `${r.rule.text}` : `Not here. ${r.rule.text}`,
  }))
  const facts = [
    { label: 'Table storage mode', value: modeText[s.input.mode] },
    { label: 'DirectLakeBehavior', value: s.input.behavior },
    { label: 'Situation', value: s.situationText },
  ]
  return staticPuzzle(metaOf('fallback', { ...s, sources: uniq([...s.sources, r.rule.source]) }), s.story, { kind: 'facts', facts }, [
    { id: 'outcome', prompt: 'What happens to the query?', ui: 'buttons', choices, accepted: [r.outcome], explain: `${r.rule.id}: ${r.rule.text}`, sources: [r.rule.source] },
  ])
}

// ── Gatehouse Access Matrix ────────────────────────────────────────────

export interface AccessScenario extends Base {
  story: string
  setup: AccessSetup
  /** Extra setup facts shown to the player (rules, tables). */
  facts?: { label: string; value: string }[]
  questions: { q: AccessQuestion; prompt: string }[]
}

function describeUser(u: AccessUser): string {
  const parts: string[] = []
  parts.push(u.role ? `${u.role} role in the workspace` : 'no workspace role')
  if (u.item?.length) parts.push(`shared item permissions: ${u.item.join(', ')}`)
  for (const g of u.grants ?? []) parts.push(`GRANT SELECT on ${g.table}${g.columns ? `(${g.columns.join(', ')})` : ''}`)
  if (u.unmask) parts.push('GRANT UNMASK')
  if (u.modelRoles?.length) parts.push(`semantic model role${u.modelRoles.length > 1 ? 's' : ''}: ${u.modelRoles.join(', ')}`)
  return parts.join('; ')
}

const setLabel = (vals: string[], all: string[]) => (vals.length === 0 ? 'No rows' : vals.length === all.length && all.every((v) => vals.includes(v)) ? `All rows (${all.join(', ')})` : vals.join(', '))

export function accessPuzzle(s: AccessScenario): Puzzle {
  const decisions: Decision[] = s.questions.map(({ q, prompt }, i) => {
    const a = evaluateAccess(s.setup, q)
    const ruleText = a.rules.map((r) => r.text).join(' ')
    const sources = uniq(a.rules.map((r) => r.source))
    if (a.kind === 'bool') {
      const yes = a.value ? 'yes' : 'no'
      return {
        id: `q${i + 1}`,
        group: q.user,
        prompt,
        ui: 'buttons',
        choices: [
          { id: 'yes', label: 'Yes', explain: yes === 'yes' ? ruleText : `No. ${ruleText}` },
          { id: 'no', label: 'No', explain: yes === 'no' ? ruleText : `Yes. ${ruleText}` },
        ],
        accepted: [yes],
        explain: ruleText,
        sources,
      }
    }
    // A set answer: offer the right set plus the plausible wrong ones.
    const all = [...(s.setup.rlsValues ?? Object.values(s.setup.warehouseRls?.allow ?? {}).flat())].sort()
    const candidates = new Map<string, string[]>()
    const add = (vals: string[]) => candidates.set(JSON.stringify([...new Set(vals)].sort()), [...new Set(vals)].sort())
    add(a.value)
    add(all)
    add([])
    for (const r of s.setup.modelRls ?? []) add(r.values)
    for (const v of Object.values(s.setup.warehouseRls?.allow ?? {})) add(v)
    const right = JSON.stringify(a.value)
    // Ids follow label order, so an id never hints at the answer.
    const sets = [...candidates.values()].sort((x, y) => setLabel(x, all).localeCompare(setLabel(y, all)))
    const choices = sets.map((vals, j) => ({
      id: `s${j}`,
      label: setLabel(vals, all),
      explain: JSON.stringify(vals) === right ? ruleText : `Not this set. ${ruleText}`,
    }))
    return {
      id: `q${i + 1}`,
      group: q.user,
      prompt,
      ui: 'buttons',
      choices,
      accepted: [choices[sets.findIndex((v) => JSON.stringify(v) === right)]!.id],
      explain: ruleText,
      sources,
    }
  })
  const facts = [...s.setup.users.map((u) => ({ label: u.name, value: describeUser(u) })), ...(s.facts ?? [])]
  return staticPuzzle(metaOf('access', { ...s, sources: uniq([...s.sources, ...decisions.flatMap((d) => d.sources)]) }), s.story, { kind: 'facts', facts }, decisions)
}

// ── Ripple (impact analysis) ───────────────────────────────────────────

export interface RippleScenario extends Base {
  story: string
  nodes: { id: string; label: string; itemType: string; workspace: string }[]
  edges: [string, string][]
  changed: string
  /** Which impact analysis tabs to ask about. */
  ask: ('all' | 'children')[]
}

export function ripplePuzzle(s: RippleScenario): Puzzle {
  assertAcyclic(s.nodes.map((n) => n.id), s.edges)
  for (const [a, b] of s.edges) if (!s.nodes.some((n) => n.id === a) || !s.nodes.some((n) => n.id === b)) throw new Error(`${s.id}: edge ${a} → ${b} uses an unknown item`)
  const others = s.nodes.filter((n) => n.id !== s.changed)
  const all = new Set(downstream(s.edges, s.changed))
  const kids = new Set(children(s.edges, s.changed))
  const changed = s.nodes.find((n) => n.id === s.changed)!
  const decisions: Decision[] = []
  for (const tab of s.ask) {
    const set = tab === 'all' ? all : kids
    const rule = tab === 'all' ? lineageRules.ALL : lineageRules.CHILD
    const group = tab === 'all' ? 'All downstream items' : 'Child items (direct children only)'
    for (const n of others) {
      const listed = set.has(n.id)
      decisions.push({
        id: `${tab}-${n.id}`,
        group,
        prompt: `${n.label} (${n.itemType}, ${n.workspace})`,
        ui: 'toggle',
        initial: 'no',
        choices: [
          { id: 'yes', label: 'Listed', explain: listed ? rule.text : `Not listed: ${n.label} doesn’t depend on ${changed.label}${tab === 'children' && all.has(n.id) ? ' directly' : ''}.` },
          { id: 'no', label: 'Not listed', explain: listed ? `It is listed: ${rule.text}` : rule.text },
        ],
        accepted: [listed ? 'yes' : 'no'],
        explain: listed ? `${n.label} depends on ${changed.label}${tab === 'children' ? ' directly' : ''}. ${rule.text}` : rule.text,
        sources: [rule.source],
      })
    }
  }
  const sources = uniq([...s.sources, lineageRules.ALL.source, lineageRules.VIEW.source])
  return staticPuzzle(metaOf('ripple', { ...s, sources }), s.story, { kind: 'graph', nodes: s.nodes, edges: s.edges, changed: s.changed }, decisions)
}

// ── Conveyor (deployment pipelines) ────────────────────────────────────

export interface ConveyorScenario extends Base {
  story: string
  stages: string[]
  users: PipelineUser[]
  actions: { action: PipelineAction; prompt: string }[]
  bindings: { case: BindingCase; prompt: string }[]
}

export function conveyorPuzzle(s: ConveyorScenario): Puzzle {
  const decisions: Decision[] = []
  s.actions.forEach(({ action, prompt }, i) => {
    const r = evaluateAction(s.users, action)
    const text = `${r.why} ${r.rules.map((x) => x.text).join(' ')}`
    decisions.push({
      id: `a${i + 1}`,
      group: 'Actions',
      prompt,
      ui: 'buttons',
      choices: [
        { id: 'ok', label: 'Succeeds', explain: r.ok ? text : `It fails. ${text}` },
        { id: 'fail', label: 'Fails', explain: r.ok ? `It succeeds. ${text}` : text },
      ],
      accepted: [r.ok ? 'ok' : 'fail'],
      explain: text,
      sources: uniq(r.rules.map((x) => x.source)),
    })
  })
  s.bindings.forEach(({ case: c, prompt }, i) => {
    const r = evaluateBinding(c)
    const text = r.rules.map((x) => x.text).join(' ')
    const outcomes: BindOutcome[] = ['target', 'source', 'fails']
    decisions.push({
      id: `b${i + 1}`,
      group: 'Binding in the target stage',
      prompt,
      ui: 'buttons',
      choices: outcomes.map((o) => ({ id: o, label: bindLabel[o], explain: o === r.outcome ? text : `Not this. ${text}` })),
      accepted: [r.outcome],
      explain: text,
      sources: uniq(r.rules.map((x) => x.source)),
    })
  })
  const facts = [
    { label: 'Stages', value: s.stages.join(' → ') },
    ...s.users.map((u) => ({
      label: u.name,
      value: [u.pipelineAdmin ? 'pipeline admin' : 'not a pipeline admin', ...s.stages.map((st) => `${st}: ${u.roles[st] ?? 'no role'}`), ...(u.owns?.length ? [`owns ${u.owns.join(', ')}`] : [])].join('; '),
    })),
  ]
  return staticPuzzle(metaOf('conveyor', { ...s, sources: uniq([...s.sources, ...decisions.flatMap((d) => d.sources)]) }), s.story, { kind: 'facts', facts }, decisions)
}
