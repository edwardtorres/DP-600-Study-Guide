import { ripplePuzzle, type RippleScenario } from '../../puzzles/build'
import { LINEAGE_SOURCES } from '../../puzzles/evaluators/lineage'
import type { Puzzle } from '../../puzzles/types'

/**
 * Ripple scenarios: an item graph and a changed item. Which items impact
 * analysis lists is computed from the edges by the lineage evaluator.
 * An edge [a, b] means b depends on a.
 */

const base = (id: string, title: string, difficulty: 1 | 2 | 3) => ({
  id,
  title,
  machineIds: ['ripple-map'],
  bulletIds: ['M2.4'],
  difficulty,
  sources: [LINEAGE_SOURCES.impact],
  trapPairId: 'lineage-vs-impact',
})

const scenarios: RippleScenario[] = [
  {
    ...base('RP-01', 'Dropping a lakehouse column', 1),
    story: 'You plan to drop a column from a table in the Sales lakehouse and open impact analysis on the lakehouse. Tap every item it lists under All downstream items. You have access to every workspace shown.',
    nodes: [
      { id: 'nb', label: 'Load Sales notebook', itemType: 'Notebook', workspace: 'Engineering' },
      { id: 'lh', label: 'Sales lakehouse', itemType: 'Lakehouse', workspace: 'Engineering' },
      { id: 'sm', label: 'Sales model', itemType: 'Semantic model', workspace: 'Engineering' },
      { id: 'rp', label: 'Sales report', itemType: 'Report', workspace: 'Engineering' },
      { id: 'db', label: 'Exec dashboard', itemType: 'Dashboard', workspace: 'Executive' },
      { id: 'hr', label: 'HR lakehouse', itemType: 'Lakehouse', workspace: 'Engineering' },
    ],
    edges: [
      ['nb', 'lh'],
      ['lh', 'sm'],
      ['sm', 'rp'],
      ['rp', 'db'],
    ],
    changed: 'lh',
    ask: ['all'],
  },
  {
    ...base('RP-02', 'Changing a warehouse view', 2),
    story: 'A view in the Finance warehouse will change. Impact analysis works at the item level, so you run it on the warehouse. Mark what each tab lists. You have access to every workspace shown.',
    nodes: [
      { id: 'wh', label: 'Finance warehouse', itemType: 'Warehouse', workspace: 'Finance' },
      { id: 'smA', label: 'Budget model', itemType: 'Semantic model', workspace: 'Finance' },
      { id: 'rpA', label: 'Budget report', itemType: 'Report', workspace: 'Finance' },
      { id: 'smB', label: 'Board model', itemType: 'Semantic model', workspace: 'Board' },
      { id: 'rpB', label: 'Board pack', itemType: 'Report', workspace: 'Board' },
      { id: 'lh', label: 'Ops lakehouse', itemType: 'Lakehouse', workspace: 'Finance' },
      { id: 'smC', label: 'Ops model', itemType: 'Semantic model', workspace: 'Finance' },
    ],
    edges: [
      ['wh', 'smA'],
      ['smA', 'rpA'],
      ['wh', 'smB'],
      ['smB', 'rpB'],
      ['lh', 'smC'],
    ],
    changed: 'wh',
    ask: ['children', 'all'],
  },
  {
    ...base('RP-03', 'Renaming a measure in a shared model', 2),
    story: 'You will rename a measure in the certified Sales model. Reports in two workspaces use it, and another team built a composite model on top of it. Which items does impact analysis list under All downstream items? You have access to every workspace shown.',
    nodes: [
      { id: 'lh', label: 'Sales lakehouse', itemType: 'Lakehouse', workspace: 'Engineering' },
      { id: 'sm', label: 'Sales model', itemType: 'Semantic model', workspace: 'Engineering' },
      { id: 'r1', label: 'Sales overview', itemType: 'Report', workspace: 'Engineering' },
      { id: 'r2', label: 'Regional sales', itemType: 'Report', workspace: 'Regions' },
      { id: 'cm', label: 'Sales + targets model', itemType: 'Semantic model', workspace: 'Planning' },
      { id: 'r3', label: 'Targets report', itemType: 'Report', workspace: 'Planning' },
      { id: 'db', label: 'Regions dashboard', itemType: 'Dashboard', workspace: 'Regions' },
    ],
    edges: [
      ['lh', 'sm'],
      ['sm', 'r1'],
      ['sm', 'r2'],
      ['r2', 'db'],
      ['sm', 'cm'],
      ['cm', 'r3'],
    ],
    changed: 'sm',
    ask: ['all'],
  },
  {
    ...base('RP-04', 'A lakehouse feeding a dataflow', 3),
    story: 'The Raw lakehouse will change its schema. A Dataflow Gen2 reads it and writes to a warehouse, which feeds a model and report. Mark what each impact analysis tab lists. You have access to every workspace shown.',
    nodes: [
      { id: 'raw', label: 'Raw lakehouse', itemType: 'Lakehouse', workspace: 'Ingest' },
      { id: 'df', label: 'Clean orders dataflow', itemType: 'Dataflow Gen2', workspace: 'Ingest' },
      { id: 'wh', label: 'Orders warehouse', itemType: 'Warehouse', workspace: 'Ingest' },
      { id: 'sm', label: 'Orders model', itemType: 'Semantic model', workspace: 'Reporting' },
      { id: 'rp', label: 'Orders report', itemType: 'Report', workspace: 'Reporting' },
      { id: 'pl', label: 'Nightly pipeline', itemType: 'Pipeline', workspace: 'Ingest' },
    ],
    edges: [
      ['pl', 'raw'],
      ['raw', 'df'],
      ['df', 'wh'],
      ['wh', 'sm'],
      ['sm', 'rp'],
    ],
    changed: 'raw',
    ask: ['children', 'all'],
  },
  {
    ...base('RP-05', 'Changing a KQL database table', 2),
    story: 'A table in the Telemetry KQL database will be renamed. Which items does impact analysis on the KQL database list under All downstream items? You have access to every workspace shown.',
    nodes: [
      { id: 'es', label: 'Device eventstream', itemType: 'Eventstream', workspace: 'RTI' },
      { id: 'kd', label: 'Telemetry KQL database', itemType: 'KQL database', workspace: 'RTI' },
      { id: 'qs', label: 'Ops queryset', itemType: 'KQL queryset', workspace: 'RTI' },
      { id: 'rd', label: 'Live dashboard', itemType: 'Real-Time Dashboard', workspace: 'RTI' },
      { id: 'sm', label: 'Telemetry model', itemType: 'Semantic model', workspace: 'BI' },
      { id: 'rp', label: 'Uptime report', itemType: 'Report', workspace: 'BI' },
      { id: 'lh', label: 'Archive lakehouse', itemType: 'Lakehouse', workspace: 'RTI' },
    ],
    edges: [
      ['es', 'kd'],
      ['kd', 'qs'],
      ['kd', 'rd'],
      ['kd', 'sm'],
      ['sm', 'rp'],
    ],
    changed: 'kd',
    ask: ['all'],
  },
]

export const ripplePuzzles: Puzzle[] = scenarios.map(ripplePuzzle)
