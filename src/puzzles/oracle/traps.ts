/**
 * The mistakes Query Oracle distractors are built from. Each distractor in a
 * template is computed by applying one of these mistakes to the same data.
 */
const L = 'https://learn.microsoft.com/en-us/'
export const SRC = {
  having: `${L}sql/t-sql/queries/select-having-transact-sql?view=fabric`,
  where: `${L}sql/t-sql/queries/where-transact-sql?view=fabric`,
  qualify: `${L}sql/t-sql/queries/select-qualify-clause-transact-sql?view=fabric`,
  select: `${L}sql/t-sql/queries/select-clause-transact-sql?view=fabric`,
  from: `${L}sql/t-sql/queries/from-transact-sql?view=fabric`,
  over: `${L}sql/t-sql/queries/select-over-clause-transact-sql?view=fabric`,
  rowNumber: `${L}sql/t-sql/functions/row-number-transact-sql?view=fabric`,
  rank: `${L}sql/t-sql/functions/rank-transact-sql?view=fabric`,
  denseRank: `${L}sql/t-sql/functions/dense-rank-transact-sql?view=fabric`,
  lag: `${L}sql/t-sql/functions/lag-transact-sql?view=fabric`,
  count: `${L}sql/t-sql/functions/count-transact-sql?view=fabric`,
  avg: `${L}sql/t-sql/functions/avg-transact-sql?view=fabric`,
  sum: `${L}sql/t-sql/functions/sum-transact-sql?view=fabric`,
  top: `${L}sql/t-sql/queries/top-transact-sql?view=fabric`,
  union: `${L}sql/t-sql/language-elements/set-operators-union-transact-sql?view=fabric`,
  caseExpr: `${L}sql/t-sql/language-elements/case-transact-sql?view=fabric`,
  orderBy: `${L}sql/t-sql/queries/select-order-by-clause-transact-sql?view=fabric`,
  coalesce: `${L}sql/t-sql/language-elements/coalesce-transact-sql?view=fabric`,
  groupBy: `${L}sql/t-sql/queries/select-group-by-transact-sql?view=fabric`,
  cte: `${L}sql/t-sql/queries/with-common-table-expression-transact-sql?view=fabric`,
  kJoin: `${L}kusto/query/join-operator?view=microsoft-fabric`,
  kInnerUnique: `${L}kusto/query/join-innerunique?view=microsoft-fabric`,
  kInner: `${L}kusto/query/join-inner?view=microsoft-fabric`,
  kLeftOuter: `${L}kusto/query/join-leftouter?view=microsoft-fabric`,
  kLeftAnti: `${L}kusto/query/join-leftanti?view=microsoft-fabric`,
  kTop: `${L}kusto/query/top-operator?view=microsoft-fabric`,
  kTake: `${L}kusto/query/take-operator?view=microsoft-fabric`,
  kSort: `${L}kusto/query/sort-operator?view=microsoft-fabric`,
  kSummarize: `${L}kusto/query/summarize-operator?view=microsoft-fabric`,
  kWhere: `${L}kusto/query/where-operator?view=microsoft-fabric`,
  kAvg: `${L}kusto/query/avg-aggregation-function?view=microsoft-fabric`,
  kCount: `${L}kusto/query/count-aggregation-function?view=microsoft-fabric`,
  kCountIf: `${L}kusto/query/countif-aggregation-function?view=microsoft-fabric`,
  kArgMax: `${L}kusto/query/arg-max-aggregation-function?view=microsoft-fabric`,
  kMax: `${L}kusto/query/max-aggregation-function?view=microsoft-fabric`,
  kDistinct: `${L}kusto/query/distinct-operator?view=microsoft-fabric`,
  kBin: `${L}kusto/query/bin-function?view=microsoft-fabric`,
  kUnion: `${L}kusto/query/union-operator?view=microsoft-fabric`,
  kExtend: `${L}kusto/query/extend-operator?view=microsoft-fabric`,
  kProject: `${L}kusto/query/project-operator?view=microsoft-fabric`,
  kNulls: `${L}kusto/query/scalar-data-types/null-values?view=microsoft-fabric`,
  kDatatable: `${L}kusto/query/datatable-operator?view=microsoft-fabric`,
  dEvaluate: `${L}dax/evaluate-statement-dax`,
  dDefine: `${L}dax/define-statement-dax`,
  dSummarizeColumns: `${L}dax/summarizecolumns-function-dax`,
  dCalculate: `${L}dax/calculate-function-dax`,
  dCalculateTable: `${L}dax/calculatetable-function-dax`,
  dKeepFilters: `${L}dax/keepfilters-function-dax`,
  dAll: `${L}dax/all-function-dax`,
  dRemoveFilters: `${L}dax/removefilters-function-dax`,
  dDivide: `${L}dax/divide-function-dax`,
  dCountRows: `${L}dax/countrows-function-dax`,
  dDistinctCount: `${L}dax/distinctcount-function-dax`,
  dSumx: `${L}dax/sumx-function-dax`,
  dSum: `${L}dax/sum-function-dax`,
  dRelated: `${L}dax/related-function-dax`,
  dAddColumns: `${L}dax/addcolumns-function-dax`,
  dValues: `${L}dax/values-function-dax`,
  dAverage: `${L}dax/average-function-dax`,
  dTopN: `${L}dax/topn-function-dax`,
  dVar: `${L}dax/var-dax`,
  dVarPractice: `${L}dax/best-practices/dax-variables`,
  dQueries: `${L}dax/dax-queries`,
} as const

export type TrapId =
  | 'where-vs-having'
  | 'where-vs-qualify'
  | 'window-partition'
  | 'distinct-not-dedupe'
  | 'inner-vs-left'
  | 'left-vs-right'
  | 'left-join-filter-in-where'
  | 'ignored-predicate'
  | 'kql-innerunique'
  | 'kql-dedupe-side'
  | 'kql-leftanti'
  | 'asc-vs-desc'
  | 'kql-sort-default'
  | 'nulls-ignored'
  | 'null-not-zero'
  | 'count-star-vs-column'
  | 'distinct-count'
  | 'take-vs-top'
  | 'operator-order'
  | 'rank-ties'
  | 'running-total-frame'
  | 'lag-vs-lead'
  | 'null-group'
  | 'union-vs-union-all'
  | 'case-first-match'
  | 'range-boundary'
  | 'max-vs-argmax'
  | 'bin-rounds-down'
  | 'project-vs-extend'
  | 'summarizecolumns-blank'
  | 'filter-context'
  | 'all-vs-removefilters'
  | 'calculate-replaces-filter'
  | 'divide-blank'
  | 'distinctcount-blank'
  | 'iterator-vs-aggregate'
  | 'context-transition'
  | 'topn-ties'
  | 'var-evaluated-once'

export interface Trap {
  id: TrapId
  label: string
  /** The general rule the mistake breaks. */
  rule: string
  sources: string[]
}

const t = (id: TrapId, label: string, rule: string, sources: string[]): Trap => ({ id, label, rule, sources })

export const traps: Trap[] = [
  t('where-vs-having', 'WHERE vs HAVING', 'WHERE filters rows before grouping; HAVING filters groups after the aggregates are computed.', [SRC.qualify, SRC.having]),
  t('where-vs-qualify', 'WHERE vs QUALIFY', 'QUALIFY filters after window functions are computed, so it can keep, for example, row number 1 per partition. WHERE runs before window functions.', [SRC.qualify]),
  t('window-partition', 'Missing PARTITION BY', 'Without PARTITION BY, a window function treats the whole result set as one partition.', [SRC.over]),
  t('distinct-not-dedupe', 'DISTINCT isn’t one row per key', 'SELECT DISTINCT removes only rows that are identical in every selected column; it doesn’t keep one row per key.', [SRC.select]),
  t('inner-vs-left', 'Inner vs left outer join', 'An inner join keeps only matching rows. A left outer join also keeps every unmatched row from the left side, with nulls for the right side.', [SRC.from, SRC.kLeftOuter]),
  t('left-vs-right', 'Left vs right join', 'A left outer join preserves the left table’s rows, not the right table’s.', [SRC.from]),
  t('left-join-filter-in-where', 'Filter in ON vs WHERE', 'A condition in a LEFT JOIN’s ON clause only limits which right rows match. The same condition in WHERE removes left rows whose right side is NULL, turning it into an inner join.', [SRC.from, SRC.where]),
  t('ignored-predicate', 'Ignored condition', 'Every condition in the query applies; dropping one changes which rows qualify.', [SRC.where, SRC.kWhere]),
  t('kql-innerunique', 'KQL innerunique default', 'A KQL join with no kind uses innerunique, which removes duplicate keys from the left side before matching. kind=inner keeps every left row.', [SRC.kInnerUnique, SRC.kJoin]),
  t('kql-dedupe-side', 'Which side innerunique deduplicates', 'innerunique deduplicates the left side only. Duplicates on the right side all match.', [SRC.kInnerUnique]),
  t('kql-leftanti', 'leftouter vs leftanti', 'leftanti returns only left rows with no match; leftouter returns every left row, matched or not.', [SRC.kLeftAnti, SRC.kLeftOuter]),
  t('asc-vs-desc', 'Ascending vs descending', 'Check the sort direction. T-SQL ORDER BY defaults to ASC; KQL sort and top default to desc.', [SRC.orderBy, SRC.kSort, SRC.kTop, SRC.dQueries]),
  t('kql-sort-default', 'KQL sort default per column', 'In KQL, each sort column without asc or desc defaults to desc, even when an earlier column says asc.', [SRC.kSort]),
  t('nulls-ignored', 'Nulls ignored by aggregates', 'AVG, SUM, and COUNT(column) skip nulls (KQL avg too, and DAX AVERAGE skips blanks), so a null isn’t treated as zero.', [SRC.avg, SRC.count, SRC.kAvg, SRC.dAverage, SRC.dCountRows]),
  t('null-not-zero', 'Null isn’t zero', 'A missing value stays null (or blank); it isn’t shown as 0 unless the query replaces it.', [SRC.lag, SRC.kNulls, SRC.dDivide]),
  t('count-star-vs-column', 'COUNT(*) vs COUNT(column)', 'COUNT(*) counts rows, including nulls and duplicates. COUNT(column) counts non-null values.', [SRC.count]),
  t('distinct-count', 'Distinct vs total count', 'A distinct count counts each value once; a plain count counts every row.', [SRC.count, SRC.kDistinct, SRC.dDistinctCount]),
  t('take-vs-top', 'take vs top', 'top N by an expression sorts first and returns N rows. take returns N rows with no guaranteed order unless the input is already sorted. T-SQL TOP with ORDER BY returns the first N rows in that order.', [SRC.kTake, SRC.kTop, SRC.top]),
  t('operator-order', 'Operator order', 'Each step works on the output of the step before it, so the order of operators (or clauses) changes the result.', [SRC.kSummarize, SRC.kTop, SRC.top]),
  t('rank-ties', 'ROW_NUMBER vs RANK vs DENSE_RANK', 'ROW_NUMBER numbers every row uniquely. RANK gives ties the same rank and then skips. DENSE_RANK gives ties the same rank without gaps.', [SRC.rank, SRC.denseRank, SRC.rowNumber]),
  t('running-total-frame', 'Window frame', 'With ORDER BY and a ROWS frame, a windowed SUM adds the rows from the start of the frame to the current row. Without ORDER BY in OVER, it sums the whole partition on every row.', [SRC.over, SRC.sum]),
  t('lag-vs-lead', 'LAG vs LEAD', 'LAG reads a previous row; LEAD reads a following row. With no default, the missing row gives NULL.', [SRC.lag]),
  t('null-group', 'Nulls in GROUP BY', 'GROUP BY puts all NULL keys into one group; it doesn’t drop them. Replacing NULL with a value merges them with any existing rows that have that value.', [SRC.groupBy, SRC.coalesce]),
  t('union-vs-union-all', 'UNION vs UNION ALL', 'T-SQL UNION removes duplicate rows; UNION ALL keeps them. KQL union returns the rows of all inputs, like UNION ALL.', [SRC.union, SRC.kUnion]),
  t('case-first-match', 'CASE returns the first match', 'CASE evaluates WHEN clauses in order and returns the first one that’s true. A NULL comparison isn’t true, so it falls to ELSE.', [SRC.caseExpr]),
  t('range-boundary', 'Boundary values', '>= includes the boundary value; > excludes it.', [SRC.where, SRC.having, SRC.kWhere, 'https://learn.microsoft.com/en-us/dax/filter-function-dax']),
  t('max-vs-argmax', 'max() vs arg_max()', 'arg_max returns the other columns from the row with the maximum value. max(column) returns the largest value of that column itself.', [SRC.kArgMax, SRC.kMax]),
  t('bin-rounds-down', 'bin() rounds down', 'bin(value, size) rounds down to a multiple of size; it never rounds to the nearest or up.', [SRC.kBin]),
  t('project-vs-extend', 'project vs extend', 'extend adds a column and keeps the others; project keeps only the columns it lists.', [SRC.kProject, SRC.kExtend]),
  t('summarizecolumns-blank', 'SUMMARIZECOLUMNS drops blank rows', 'SUMMARIZECOLUMNS only returns rows where at least one expression is non-blank.', [SRC.dSummarizeColumns]),
  t('filter-context', 'Filter context', 'An aggregation inside a grouped query is evaluated in that row’s filter context unless something changes it.', [SRC.dCalculate, SRC.dSummarizeColumns]),
  t('all-vs-removefilters', 'ALL / REMOVEFILTERS vs no removal', 'ALL or REMOVEFILTERS in CALCULATE clears the filter on the column, giving the grand total; without it, the denominator is the current group.', [SRC.dAll, SRC.dRemoveFilters]),
  t('calculate-replaces-filter', 'CALCULATE replaces vs KEEPFILTERS', 'A CALCULATE filter on a column replaces the existing filter on that column. KEEPFILTERS intersects it with the existing filter instead.', [SRC.dCalculate, SRC.dKeepFilters]),
  t('divide-blank', 'DIVIDE by zero', 'DIVIDE returns BLANK (or the alternate result, when given) instead of an error when the denominator is 0.', [SRC.dDivide]),
  t('distinctcount-blank', 'DISTINCTCOUNT counts BLANK', 'DISTINCTCOUNT counts BLANK as a value; DISTINCTCOUNTNOBLANK skips it.', [SRC.dDistinctCount]),
  t('iterator-vs-aggregate', 'Iterator vs aggregate', 'SUMX evaluates the expression for each row and then sums. Multiplying two SUMs gives a different number.', [SRC.dSumx, SRC.dSum]),
  t('context-transition', 'Context transition', 'A measure reference in row context gets an implicit CALCULATE, which turns the row into a filter. A plain SUM in row context isn’t filtered by the row.', [SRC.dCalculate, SRC.dAddColumns]),
  t('topn-ties', 'TOPN ties', 'If rows tie at the N-th position, TOPN returns all of them, so it can return more than N rows.', [SRC.dTopN]),
  t('var-evaluated-once', 'Variables are evaluated once', 'A variable is evaluated where it’s defined, outside the filters CALCULATE applies in RETURN; its value doesn’t change.', [SRC.dVar, SRC.dVarPractice]),
]

export const trapById = new Map(traps.map((x) => [x.id, x]))
