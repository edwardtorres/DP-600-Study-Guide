import { discoverChooseQuestions } from './prepare/discover-choose'
import { prepareHardQuestions } from './prepare/hard'
import { kqlDaxQuestions } from './prepare/kql-dax'
import { queryQuestions } from './prepare/query'
import { threadIntakeQuestions } from './prepare/thread-intake'
import { transformAQuestions } from './prepare/transform-a'
import { transformBQuestions } from './prepare/transform-b'
import type { Question } from './types'

export const prepareQuestions: Question[] = [
  ...threadIntakeQuestions,
  ...discoverChooseQuestions,
  ...transformAQuestions,
  ...transformBQuestions,
  ...queryQuestions,
  ...kqlDaxQuestions,
  ...prepareHardQuestions,
]
