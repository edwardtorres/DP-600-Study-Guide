import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { allQuestions } from './content/questions'
import { machines } from './data/machines'
import { SAVE_KEY } from './save/schema'

/** Answers the visible question correctly by reading its key (test helper; the real player can't). */
function answerFromKey(section: HTMLElement, id: string) {
  const q = allQuestions.find((x) => x.id === id)!
  const click = (el: Element | null) => fireEvent.click(el!)
  switch (q.format) {
    case 'single':
    case 'multi': {
      const keys = q.format === 'single' ? [q.answer] : q.answers
      const labels = [...section.querySelectorAll('label')]
      for (const k of keys) click(labels.find((l) => l.textContent?.endsWith(q.options.find((o) => o.id === k)!.text))!.querySelector('input'))
      break
    }
    case 'yesno':
      for (const s of q.statements) {
        // Statements are shuffled per attempt, so find each one by its text.
        const item = within(section).getByText(s.text, { exact: false }).closest('li')!
        click(within(item).getByRole('radio', { name: s.answer ? 'Yes' : 'No' }))
      }
      break
    case 'match':
      for (const p of q.pairs) {
        click(section.querySelector(`[data-prompt="${p.promptId}"]`))
        click(section.querySelector(`[data-choice="${p.choiceId}"]`))
      }
      break
    case 'order':
      for (const [target, itemId] of q.answerOrder.entries()) {
        const current = () => [...section.querySelectorAll('[data-item]')].map((e) => e.getAttribute('data-item'))
        while (current().indexOf(itemId) > target) click(section.querySelector(`[data-item="${itemId}"] [data-move="up"]`))
      }
      break
    case 'dropdown':
      for (const s of q.slots) fireEvent.change(section.querySelector(`[data-slot="${s.id}"]`)!, { target: { value: s.answer } })
      break
  }
}

describe('mill map', () => {
  it('shows all four floors and every machine with its real skill name', () => {
    render(<App />)
    for (const name of ['Front Office', 'Spinning Floor & Dye House', 'Loom Hall', 'Gatehouse & Pattern Room']) {
      expect(screen.getByRole('region', { name })).toBeInTheDocument()
    }
    for (const m of machines) {
      expect(screen.getByRole('button', { name: new RegExp(`^${m.themedName}: `) })).toHaveAccessibleName(
        expect.stringContaining(m.skillName),
      )
    }
  })

  it('opens a detail panel with bullets, prerequisites, and reasons', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^Direct Lake Shuttle:/ }))
    const panel = screen.getByRole('complementary', { name: 'Direct Lake Shuttle' })
    expect(within(panel).getByText('Configure Direct Lake, including default fallback and refresh behavior')).toBeInTheDocument()
    expect(within(panel).getByText(/Direct Lake is a storage mode/)).toBeInTheDocument()
    expect(within(panel).getByText(/Certify every prerequisite/)).toBeInTheDocument()
    expect(within(panel).queryByRole('button', { name: /Start-up check/ })).toBeNull()
    expect(within(panel).queryByRole('button', { name: /placement check/ })).toBeNull()
  })

  it('opens the notes, passes a start-up check, and runs the machine without certifying it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^Founding Charter:/ }))
    let saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)
    expect(saved.version).toBe(2)
    expect(saved.machines['founding-charter'].notesOpenedAt).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /Start-up check/ }))
    const dialog = screen.getByRole('dialog', { name: 'Founding Charter' })
    for (let n = 0; n < 2; n++) {
      const section = dialog.querySelector('section[data-question-id]')!
      const q = allQuestions.find((x) => x.id === section.getAttribute('data-question-id'))!
      answerFromKey(section as HTMLElement, q.id)
      await user.click(within(dialog).getByRole('button', { name: n === 0 ? 'Next' : 'Submit' }))
    }
    const wrong = [...dialog.querySelectorAll('article[data-correct="false"]')].map((a) => a.getAttribute('data-question-id'))
    expect(wrong).toEqual([])
    expect(within(dialog).getByRole('status')).toHaveTextContent('2 of 2 correct')
    await user.click(within(dialog).getByRole('button', { name: 'Back to the mill' }))
    expect(screen.getByRole('button', { name: /^Founding Charter:.*Running\.$/ })).toBeInTheDocument()
    saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)
    expect(saved.machines['founding-charter'].startedAt).toBeTruthy()
    expect(saved.machines['founding-charter'].certification).toBeUndefined()
    expect(saved.answers).toHaveLength(2)
  })

  it('validates an imported save and changes nothing when it is invalid', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    const input = screen.getByLabelText('Import save file')
    await user.upload(input, new File(['{"version":2}'], 'bad.json', { type: 'application/json' }))
    expect(await screen.findByText(/Import failed: Save failed validation/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Replace progress' })).toBeNull()
  })

  it('recovers from a corrupt save with a notice', () => {
    localStorage.setItem(SAVE_KEY, 'garbage')
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent(/could not be read/)
  })
})

describe('review page', () => {
  it('renders the question bank browser', async () => {
    const { ReviewPage } = await import('./review/ReviewPage')
    render(<ReviewPage />)
    expect(screen.getByRole('heading', { name: 'Question bank review' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Machine' })).toBeInTheDocument()
  })
})
