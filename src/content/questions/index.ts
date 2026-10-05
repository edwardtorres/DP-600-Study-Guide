import { caseStudies, caseQuestions } from './cases'
import { maintainQuestions } from './maintain'
import { orientationQuestions } from './orientation'
import { prepareQuestions } from './prepare'
import { semanticQuestions } from './semantic'
import { arrange } from './arrange'
import type { Question } from './types'

export { caseStudies }

export const allQuestions: Question[] = arrange([
  ...orientationQuestions,
  ...prepareQuestions,
  ...semanticQuestions,
  ...maintainQuestions,
  ...caseQuestions,
])
