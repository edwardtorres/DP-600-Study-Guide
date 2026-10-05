import { accessQuestions } from './maintain/access'
import { lifecycleQuestions } from './maintain/lifecycle'
import type { Question } from './types'

export const maintainQuestions: Question[] = [...accessQuestions, ...lifecycleQuestions]
