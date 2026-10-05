import type { Question } from './types'

const LETTERS = ['a', 'b', 'c', 'd', 'e']

/**
 * Places each single-choice answer at a rotating position (1, 2, 3, 4, 1, …)
 * and relabels options a–d in display order, so answer positions stay balanced
 * however the questions were authored. Explanations travel with their options.
 */
export function arrange(questions: Question[]): Question[] {
  let slot = 0
  return questions.map((q) => {
    if (q.format !== 'single' || q.options.length !== 4) return q
    const correct = q.options.find((o) => o.id === q.answer)
    if (!correct) return q
    const others = q.options.filter((o) => o.id !== q.answer)
    const target = slot++ % 4
    const ordered = [...others.slice(0, target), correct, ...others.slice(target)]
    const options = ordered.map((o, i) => ({ ...o, id: LETTERS[i]! }))
    return { ...q, options, answer: LETTERS[target]! }
  })
}
