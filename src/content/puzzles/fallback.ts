import { fallbackPuzzle, type FallbackScenario } from '../../puzzles/build'
import { FALLBACK_SOURCES } from '../../puzzles/evaluators/fallback'
import type { Puzzle } from '../../puzzles/types'

/**
 * Shuttle Fallback scenarios. Each stores only its inputs; the outcome comes
 * from evaluateFallback, which encodes only cases Learn states outright. Per
 * the Step 3 review (DLS-05), no scenario depends on whether a guardrail is
 * evaluated per query or for the whole model: guardrail cases always query the
 * table that is over the limit.
 */

const base = (id: string, title: string, difficulty: 1 | 2 | 3, bullets: string[]) => ({
  id,
  title,
  machineIds: ['direct-lake-shuttle'],
  bulletIds: bullets,
  difficulty,
  sources: [FALLBACK_SOURCES.howItWorks, FALLBACK_SOURCES.overview],
  trapPairId: 'dl-fallback',
})

const scenarios: FallbackScenario[] = [
  {
    ...base('SF-01', 'Clean tables, default behavior', 1, ['S2.3']),
    story: 'A report visual queries a Direct Lake table built on a lakehouse Delta table. The model was refreshed after the last load.',
    input: { mode: 'sql', behavior: 'Automatic', situation: 'none' },
    situationText: 'Plain Delta table; no SQL security, no views, within every guardrail; model refreshed.',
  },
  {
    ...base('SF-02', 'A SQL view, default behavior', 2, ['S2.3']),
    story: 'One model table is based on a non-materialized SQL view in the warehouse’s SQL analytics endpoint. A visual queries it.',
    input: { mode: 'sql', behavior: 'Automatic', situation: 'sql-view' },
    situationText: 'The table is based on a SQL view (not materialized).',
  },
  {
    ...base('SF-03', 'A SQL view with fallback disabled', 2, ['S2.3']),
    story: 'The same view-based table, but a developer set the model’s Direct Lake behavior to catch problems during development.',
    input: { mode: 'sql', behavior: 'DirectLakeOnly', situation: 'sql-view' },
    situationText: 'The table is based on a SQL view (not materialized).',
  },
  {
    ...base('SF-04', 'SQL row-level security, default behavior', 2, ['S2.3']),
    story: 'The warehouse has a T-SQL security policy (row-level security) on the table a visual queries.',
    input: { mode: 'sql', behavior: 'Automatic', situation: 'sql-rls' },
    situationText: 'Row-level security is defined on the table at the SQL analytics endpoint.',
  },
  {
    ...base('SF-05', 'SQL row-level security, Direct Lake on OneLake', 3, ['S2.3', 'S2.4']),
    story: 'The same warehouse table with a T-SQL security policy, but this model uses Direct Lake on OneLake. The model’s DirectLakeBehavior property still says Automatic from an earlier template.',
    input: { mode: 'onelake', behavior: 'Automatic', situation: 'sql-rls' },
    situationText: 'Row-level security is defined on the table at the SQL analytics endpoint.',
  },
  {
    ...base('SF-06', 'Measuring DirectQuery performance', 1, ['S2.3']),
    story: 'A developer wants to measure how slow reports would be if every query fell back, so they change the model setting. The tables are clean Delta tables.',
    input: { mode: 'sql', behavior: 'DirectQueryOnly', situation: 'none' },
    situationText: 'Plain Delta table; every Direct Lake condition holds.',
  },
  {
    ...base('SF-07', 'Dynamic data masking, fallback disabled', 2, ['S2.3']),
    story: 'A column in the queried warehouse table has a dynamic data mask. The model is set to fail rather than fall back.',
    input: { mode: 'sql', behavior: 'DirectLakeOnly', situation: 'sql-ddm' },
    situationText: 'Dynamic data masking is defined on the table at the SQL analytics endpoint.',
  },
  {
    ...base('SF-08', 'Object-level security, default behavior', 2, ['S2.3']),
    story: 'The warehouse denies some users access to a column through SQL object-level security. A visual queries that table.',
    input: { mode: 'sql', behavior: 'Automatic', situation: 'sql-ols' },
    situationText: 'Object-level security is defined on the table at the SQL analytics endpoint.',
  },
  {
    ...base('SF-09', 'Over a guardrail, default behavior', 2, ['S2.3']),
    story: 'The visual queries a Delta table whose Parquet file count is above the capacity’s guardrail.',
    input: { mode: 'sql', behavior: 'Automatic', situation: 'guardrail' },
    situationText: 'The queried table exceeds a capacity guardrail (too many Parquet files).',
  },
  {
    ...base('SF-10', 'Over a guardrail, Direct Lake on OneLake', 3, ['S2.3', 'S2.4']),
    story: 'Same oversized table, but the model uses Direct Lake on OneLake.',
    input: { mode: 'onelake', behavior: 'DirectLakeOnly', situation: 'guardrail' },
    situationText: 'The queried table exceeds a capacity guardrail (too many Parquet files).',
  },
  {
    ...base('SF-11', 'Over a guardrail, fallback disabled', 2, ['S2.3']),
    story: 'The oversized table again, with Direct Lake on SQL and the behavior set to DirectLakeOnly.',
    input: { mode: 'sql', behavior: 'DirectLakeOnly', situation: 'guardrail' },
    situationText: 'The queried table exceeds a capacity guardrail (too many Parquet files).',
  },
  {
    ...base('SF-12', 'Unprocessed table on SQL', 3, ['S2.3']),
    story: 'A table was added to the model with an XMLA-based tool, and nobody refreshed the model before a user opened the report.',
    input: { mode: 'sql', behavior: 'Automatic', situation: 'unprocessed' },
    situationText: 'The table was added through XMLA and never refreshed (framed).',
  },
  {
    ...base('SF-13', 'Unprocessed table on OneLake', 3, ['S2.3', 'S2.4']),
    story: 'The same unprocessed table, in a Direct Lake on OneLake model.',
    input: { mode: 'onelake', behavior: 'DirectLakeOnly', situation: 'unprocessed' },
    situationText: 'The table was added through XMLA and never refreshed (framed).',
  },
  {
    ...base('SF-14', 'Clean tables, Direct Lake on OneLake', 1, ['S2.3', 'S2.4']),
    story: 'A Direct Lake on OneLake model reads clean Delta tables from two lakehouses. Someone set DirectLakeBehavior to DirectQueryOnly while testing another model.',
    input: { mode: 'onelake', behavior: 'DirectQueryOnly', situation: 'none' },
    situationText: 'Plain Delta tables; every Direct Lake condition holds.',
  },
]

export const fallbackPuzzles: Puzzle[] = scenarios.map(fallbackPuzzle)
