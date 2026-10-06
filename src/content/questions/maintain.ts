import { accessQuestions } from './maintain/access'
import { maintainHardQuestions } from './maintain/hard'
import { lifecycleQuestions } from './maintain/lifecycle'
import type { Question } from './types'

export const maintainQuestions: Question[] = [...accessQuestions, ...lifecycleQuestions, ...maintainHardQuestions]
