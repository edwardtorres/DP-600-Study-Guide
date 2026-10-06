import { S } from '../sources'
import type { Question } from '../types'

/** Step 8: questions for needs-verification items that Learn now settles (dynamic data masking as a Direct Lake fallback cause). */

const ds = 'direct-lake-shuttle'

export const semanticVerifiedQuestions: Question[] = [
  {
    id: 'DS-V1',
    machineId: ds,
    bulletIds: ['S2.3'],
    format: 'single',
    difficulty: 2,
    trapPairId: 'dl-fallback',
    stem: 'A semantic model uses Direct Lake on SQL analytics endpoints with DirectLakeBehavior left at its default, Automatic. A warehouse administrator adds dynamic data masking to a column of a table the model uses. What happens to report queries against that table?',
    sources: [S.dlHow],
    options: [
      { id: 'a', text: 'They stay in Direct Lake mode and show the unmasked values', explain: 'Learn lists dynamic data masking defined at the SQL analytics endpoint as a condition that keeps a table out of Direct Lake mode.' },
      { id: 'b', text: 'They fail with an error until the masking rule is removed', explain: 'An error is what DirectLakeOnly returns. With Automatic, the query falls back instead.' },
      { id: 'c', text: 'They fall back to DirectQuery through the SQL analytics endpoint', explain: 'Correct. Dynamic data masking at the SQL analytics endpoint is a fallback cause, and with Automatic the query silently falls back to DirectQuery.' },
      { id: 'd', text: 'The next refresh fails, but queries keep using the last framed data', explain: 'Learn lists masking as a condition for how queries are answered. With Automatic, the consequence is DirectQuery fallback for those queries.' },
    ],
    answer: 'c',
  },
  {
    id: 'DS-V2',
    machineId: ds,
    bulletIds: ['S2.3'],
    format: 'single',
    difficulty: 3,
    trapPairId: 'dl-fallback',
    stem: 'A Direct Lake on SQL analytics endpoints model must never run DirectQuery, so its DirectLakeBehavior is set to DirectLakeOnly. Later, dynamic data masking is defined at the SQL analytics endpoint on a column of one of its tables. What do report users see for visuals that query that table?',
    sources: [S.dlHow],
    options: [
      { id: 'a', text: 'The visuals fail with an error', explain: 'Correct. Masking at the SQL analytics endpoint is a Direct Lake condition that isn’t met, and with DirectLakeOnly a query that can’t run in Direct Lake fails instead of falling back.' },
      { id: 'b', text: 'The visuals fall back to DirectQuery anyway, because masking overrides the setting', explain: 'DirectLakeOnly prevents fallback; Learn says the query fails instead.' },
      { id: 'c', text: 'The visuals load in Direct Lake mode with the masked values', explain: 'The table no longer meets the conditions for Direct Lake mode, so it isn’t answered from memory.' },
      { id: 'd', text: 'The visuals load in Direct Lake mode, ignoring the mask', explain: 'The table no longer meets the conditions for Direct Lake mode.' },
    ],
    answer: 'a',
  },
]
