/**
 * Shuttle Fallback evaluator: what happens to a DAX query against a Direct Lake
 * table, given the Direct Lake flavor, the model's DirectLakeBehavior, and the
 * situation. Only cases Learn states outright are encoded; anything else
 * returns null, and the content check rejects a scenario that uses it.
 */

const L = 'https://learn.microsoft.com/en-us/'
export const FALLBACK_SOURCES = {
  overview: `${L}fabric/fundamentals/direct-lake-overview`,
  howItWorks: `${L}fabric/fundamentals/direct-lake-how-it-works`,
} as const

export type DirectLakeMode = 'onelake' | 'sql'
export type DirectLakeBehavior = 'Automatic' | 'DirectLakeOnly' | 'DirectQueryOnly'
/**
 * none: every Direct Lake condition holds.
 * sql-rls / sql-ols / sql-ddm: the table has row-level security, object-level
 *   security, or dynamic data masking defined at the SQL analytics endpoint.
 * sql-view: the table is based on a (non-materialized) SQL view.
 * unprocessed: the table was added with an XMLA tool and never refreshed.
 * guardrail: the queried table exceeds a capacity guardrail (for example, too many Parquet files).
 */
export type Situation = 'none' | 'sql-rls' | 'sql-ols' | 'sql-ddm' | 'sql-view' | 'unprocessed' | 'guardrail'
export type Outcome = 'directlake' | 'directquery' | 'error'

export const outcomeLabel: Record<Outcome, string> = {
  directlake: 'Answered in Direct Lake mode',
  directquery: 'Falls back to DirectQuery',
  error: 'The query fails with an error',
}

export interface FallbackInput {
  mode: DirectLakeMode
  behavior: DirectLakeBehavior
  situation: Situation
}

export interface FallbackRule {
  id: string
  /** The rule in plain words. */
  text: string
  source: string
  applies: (i: FallbackInput) => boolean
  outcome: Outcome
}

const sqlCause: Record<Exclude<Situation, 'none'>, string> = {
  'sql-rls': 'row-level security defined at the SQL analytics endpoint',
  'sql-ols': 'object-level security defined at the SQL analytics endpoint',
  'sql-ddm': 'dynamic data masking defined at the SQL analytics endpoint',
  'sql-view': 'a table based on a non-materialized SQL view',
  unprocessed: 'a table that was never refreshed (framed)',
  guardrail: 'a table over a capacity guardrail',
}

/** Rules in priority order; the first that applies decides. */
export const fallbackRules: FallbackRule[] = [
  {
    id: 'FB-1',
    text: 'Direct Lake on OneLake doesn’t fall back to DirectQuery, and DirectLakeBehavior only applies to Direct Lake on SQL analytics endpoints. With every condition met, the query runs in Direct Lake.',
    source: FALLBACK_SOURCES.howItWorks,
    applies: (i) => i.mode === 'onelake' && i.situation === 'none',
    outcome: 'directlake',
  },
  {
    id: 'FB-2',
    text: 'When the SQL analytics endpoint enforces row-level security, Direct Lake on OneLake queries still succeed, and the SQL-based RLS isn’t applied (OneLake access doesn’t observe it).',
    source: FALLBACK_SOURCES.overview,
    applies: (i) => i.mode === 'onelake' && i.situation === 'sql-rls',
    outcome: 'directlake',
  },
  {
    id: 'FB-3',
    text: 'With Direct Lake on OneLake, queries involving unprocessed tables return an error.',
    source: FALLBACK_SOURCES.overview,
    applies: (i) => i.mode === 'onelake' && i.situation === 'unprocessed',
    outcome: 'error',
  },
  {
    id: 'FB-4',
    text: 'If guardrails are exceeded with Direct Lake on OneLake, refresh fails and the model can’t be queried until the Delta tables are optimized within the limits.',
    source: FALLBACK_SOURCES.overview,
    applies: (i) => i.mode === 'onelake' && i.situation === 'guardrail',
    outcome: 'error',
  },
  {
    id: 'FB-5',
    text: 'DirectLakeBehavior = DirectQueryOnly: the query always uses DirectQuery mode.',
    source: FALLBACK_SOURCES.howItWorks,
    applies: (i) => i.mode === 'sql' && i.behavior === 'DirectQueryOnly',
    outcome: 'directquery',
  },
  {
    id: 'FB-6',
    text: 'Direct Lake on SQL analytics endpoints stays in Direct Lake when every condition holds: no SQL RLS, OLS, or DDM on the referenced tables, no non-materialized SQL views, no table over a guardrail, and the model was refreshed (framed).',
    source: FALLBACK_SOURCES.howItWorks,
    applies: (i) => i.mode === 'sql' && i.situation === 'none',
    outcome: 'directlake',
  },
  {
    id: 'FB-7',
    text: 'DirectLakeBehavior = Automatic (the default): if a Direct Lake condition isn’t met, the query silently falls back to DirectQuery.',
    source: FALLBACK_SOURCES.howItWorks,
    applies: (i) => i.mode === 'sql' && i.behavior === 'Automatic' && i.situation !== 'none',
    outcome: 'directquery',
  },
  {
    id: 'FB-8',
    text: 'DirectLakeBehavior = DirectLakeOnly: if a Direct Lake condition isn’t met, the query fails with an error.',
    source: FALLBACK_SOURCES.howItWorks,
    applies: (i) => i.mode === 'sql' && i.behavior === 'DirectLakeOnly' && i.situation !== 'none',
    outcome: 'error',
  },
]

export interface FallbackResult {
  outcome: Outcome
  rule: FallbackRule
  /** Why the situation matters, for the explanation. */
  cause?: string
}

/** Returns the outcome, or null if Learn doesn't state this combination outright. */
export function evaluateFallback(input: FallbackInput): FallbackResult | null {
  const rule = fallbackRules.find((r) => r.applies(input))
  if (!rule) return null
  return { outcome: rule.outcome, rule, ...(input.situation !== 'none' ? { cause: sqlCause[input.situation] } : {}) }
}
