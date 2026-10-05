import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useEffect, useState } from 'react'
import { describe, expect, it } from 'vitest'
import { allQuestions } from '../../content/questions'
import type { Question } from '../../content/questions/types'
import { emptyResponse, isCorrect, type Response } from '../../game/score'
import { shuffleForAttempt } from '../../game/shuffle'
import { QuestionInput } from './QuestionInput'

let latest: Response | null = null
function Harness({ q }: { q: Question }) {
  const [r, setR] = useState<Response>(() => emptyResponse(q))
  useEffect(() => {
    latest = r
  }, [r])
  return <QuestionInput question={q} response={r} onChange={setR} />
}
const pick = (id: string) => shuffleForAttempt(allQuestions.find((q) => q.id === id)!, 7)

describe('question renderers (keyboard only)', () => {
  it('single choice: arrow keys and space select an option', async () => {
    const q = pick('LG-01')
    if (q.format !== 'single') throw new Error()
    const user = userEvent.setup()
    render(<Harness q={q} />)
    const target = q.options.find((o) => o.id === q.answer)!
    await user.tab()
    await user.keyboard(' ')
    for (let i = 0; i < 4 && (latest as { choice: string }).choice !== target.id; i++) await user.keyboard('{ArrowDown}')
    expect(isCorrect(q, latest!)).toBe(true)
  })

  it('multi-select: tab and space toggle checkboxes; only both picks score', async () => {
    const q = pick('KT-12')
    if (q.format !== 'multi') throw new Error()
    const user = userEvent.setup()
    render(<Harness q={q} />)
    const boxes = screen.getAllByRole('checkbox')
    for (const [i, o] of q.options.entries()) {
      boxes[i]!.focus()
      if (q.answers.includes(o.id)) await user.keyboard(' ')
    }
    expect(isCorrect(q, latest!)).toBe(true)
    boxes[q.options.findIndex((o) => !q.answers.includes(o.id))]!.focus()
    await user.keyboard(' ')
    expect(isCorrect(q, latest!)).toBe(false)
  })

  it('Yes/No set: every statement answered with the keyboard', async () => {
    const q = pick('FO-21')
    if (q.format !== 'yesno') throw new Error()
    const user = userEvent.setup()
    render(<Harness q={q} />)
    for (const [i, s] of q.statements.entries()) {
      const group = screen.getByRole('radiogroup', { name: `Statement ${i + 1}` })
      within(group).getByRole('radio', { name: s.answer ? 'Yes' : 'No' }).focus()
      await user.keyboard(' ')
    }
    expect(isCorrect(q, latest!)).toBe(true)
  })

  it('matching: Enter on an item, then Enter on its choice', async () => {
    const q = pick('KT-08')
    if (q.format !== 'match') throw new Error()
    const user = userEvent.setup()
    const { container } = render(<Harness q={q} />)
    for (const p of q.pairs) {
      container.querySelector<HTMLElement>(`[data-prompt="${p.promptId}"]`)!.focus()
      await user.keyboard('{Enter}')
      container.querySelector<HTMLElement>(`[data-choice="${p.choiceId}"]`)!.focus()
      await user.keyboard('{Enter}')
    }
    expect(isCorrect(q, latest!)).toBe(true)
  })

  it('ordering: move buttons operated with Enter put items in order', async () => {
    const q = pick('WP-08')
    if (q.format !== 'order') throw new Error()
    const user = userEvent.setup()
    render(<Harness q={q} />)
    for (const [target, id] of q.answerOrder.entries()) {
      let pos = (latest as { order: string[] }).order.indexOf(id)
      while (pos > target) {
        const text = q.items.find((i) => i.id === id)!.text
        screen.getByRole('button', { name: `Move "${text}" up` }).focus()
        await user.keyboard('{Enter}')
        pos--
      }
    }
    expect(isCorrect(q, latest!)).toBe(true)
  })

  it('drop-down code: each blank is a native select', async () => {
    const q = pick('CM-02')
    if (q.format !== 'dropdown') throw new Error()
    const user = userEvent.setup()
    render(<Harness q={q} />)
    for (const s of q.slots) {
      await user.selectOptions(screen.getByRole('combobox', { name: `Blank ${s.id}` }), s.answer)
    }
    expect(isCorrect(q, latest!)).toBe(true)
    expect(screen.getByTestId('code-block').className).toMatch(/overflow-x-auto/)
  })
})
