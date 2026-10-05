import type { Question } from '../content/questions/types'

/** What the player submitted for one question. */
export type Response =
  | { format: 'single'; choice: string | null }
  | { format: 'multi'; choices: string[] }
  | { format: 'yesno'; answers: Record<string, boolean | undefined> }
  | { format: 'match'; pairs: Record<string, string | undefined> }
  | { format: 'order'; order: string[] }
  | { format: 'dropdown'; slots: Record<string, string | undefined> }

export function emptyResponse(q: Question): Response {
  switch (q.format) {
    case 'single':
      return { format: 'single', choice: null }
    case 'multi':
      return { format: 'multi', choices: [] }
    case 'yesno':
      return { format: 'yesno', answers: {} }
    case 'match':
      return { format: 'match', pairs: {} }
    case 'order':
      return { format: 'order', order: q.items.map((i) => i.id) }
    case 'dropdown':
      return { format: 'dropdown', slots: {} }
  }
}

/** True when every part of the question has an answer, so it can be submitted. */
export function isComplete(q: Question, r: Response): boolean {
  if (q.format !== r.format) return false
  switch (q.format) {
    case 'single':
      return r.format === 'single' && r.choice !== null
    case 'multi':
      return r.format === 'multi' && r.choices.length === q.answers.length
    case 'yesno':
      return r.format === 'yesno' && q.statements.every((s) => r.answers[s.id] !== undefined)
    case 'match':
      return r.format === 'match' && q.prompts.every((p) => r.pairs[p.id] !== undefined)
    case 'order':
      return r.format === 'order' && r.order.length === q.items.length
    case 'dropdown':
      return r.format === 'dropdown' && q.slots.every((s) => r.slots[s.id] !== undefined)
  }
}

/**
 * Full credit only: every part must be right. A multi-select needs exactly the
 * keyed set, a Yes/No set every statement, a match every pair, an ordering the
 * whole sequence, and a drop-down every slot. There is no partial credit.
 */
export function isCorrect(q: Question, r: Response): boolean {
  switch (q.format) {
    case 'single':
      return r.format === 'single' && r.choice === q.answer
    case 'multi':
      return r.format === 'multi' && r.choices.length === q.answers.length && q.answers.every((a) => r.choices.includes(a))
    case 'yesno':
      return r.format === 'yesno' && q.statements.every((s) => r.answers[s.id] === s.answer)
    case 'match':
      return r.format === 'match' && q.pairs.every((p) => r.pairs[p.promptId] === p.choiceId)
    case 'order':
      return r.format === 'order' && r.order.length === q.answerOrder.length && q.answerOrder.every((id, i) => r.order[i] === id)
    case 'dropdown':
      return r.format === 'dropdown' && q.slots.every((s) => r.slots[s.id] === s.answer)
  }
}
