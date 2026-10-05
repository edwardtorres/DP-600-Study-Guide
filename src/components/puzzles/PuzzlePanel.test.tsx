import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { puzzleById } from '../../content/puzzles'
import { shuffleForPlay } from '../../puzzles/play'
import { PuzzlePanel } from './PuzzlePanel'

const ids = ['QO-K01', 'PD-06', 'GB-S09', 'SF-15', 'AM-07', 'RP-02', 'CN-03']

describe('PuzzlePanel', () => {
  it.each(ids)('%s can be solved with the keyboard alone', async (id) => {
    const user = userEvent.setup()
    const instance = shuffleForPlay(puzzleById.get(id)!.build(3), 3)
    const onSubmit = vi.fn()
    render(<PuzzlePanel instance={instance} onSubmit={onSubmit} onReplay={() => {}} onClose={() => {}} onOpenPair={() => {}} />)
    const check = screen.getByRole('button', { name: /Check|Answer every decision/ })
    for (const d of instance.decisions) {
      const box = document.querySelector<HTMLElement>(`[data-decision="${d.id}"]`)!
      const want = d.accepted[0]!
      if (d.ui === 'toggle') {
        if (want === 'yes') {
          within(box).getByRole('button').focus()
          await user.keyboard('{Enter}')
        }
      } else if (d.ui === 'select') {
        within(box).getByRole('combobox').focus()
        await user.selectOptions(within(box).getByRole('combobox'), want)
      } else {
        const label = box.querySelector<HTMLElement>(`[data-choice="${want}"]`)!
        within(label).getByRole('radio').focus()
        await user.keyboard(' ')
      }
    }
    expect(check).toBeEnabled()
    check.focus()
    await user.keyboard('{Enter}')
    expect(onSubmit).toHaveBeenCalledWith(true)
    expect(screen.getByRole('status')).toHaveTextContent(`${instance.decisions.length} of ${instance.decisions.length} right`)
    expect(screen.getByText(/never certify/i)).toBeInTheDocument()
  })

  it('checks only once every decision is answered, and reports a miss', async () => {
    const user = userEvent.setup()
    const instance = puzzleById.get('SF-02')!.build(0)
    const onSubmit = vi.fn()
    render(<PuzzlePanel instance={instance} onSubmit={onSubmit} onReplay={() => {}} onClose={() => {}} onOpenPair={() => {}} />)
    expect(screen.getByRole('button', { name: /Answer every decision/ })).toBeDisabled()
    const d = instance.decisions[0]!
    const wrong = d.choices.find((c) => !d.accepted.includes(c.id))!
    await user.click(screen.getByText(wrong.label))
    await user.click(screen.getByRole('button', { name: 'Check' }))
    expect(onSubmit).toHaveBeenCalledWith(false)
    expect(screen.getByText('Your answer')).toBeInTheDocument()
    expect(screen.getByText('Correct answer')).toBeInTheDocument()
  })
})
