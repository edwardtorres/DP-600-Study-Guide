import { semanticHardQuestions } from './semantic/hard'
import { modelAQuestions } from './semantic/model-a'
import { modelBQuestions } from './semantic/model-b'
import type { Question } from './types'

export const semanticQuestions: Question[] = [...modelAQuestions, ...modelBQuestions, ...semanticHardQuestions]
