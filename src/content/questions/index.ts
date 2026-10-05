import { caseStudies, caseQuestions } from './cases'
import { maintainQuestions } from './maintain'
import { orientationQuestions } from './orientation'
import { prepareQuestions } from './prepare'
import { semanticQuestions } from './semantic'
import type { Question } from './types'

export { caseStudies }

export const allQuestions: Question[] = [
  ...orientationQuestions,
  ...prepareQuestions,
  ...semanticQuestions,
  ...maintainQuestions,
  ...caseQuestions,
]
