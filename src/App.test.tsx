import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { machines } from './data/machines'
import { SAVE_KEY } from './save/schema'

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
    expect(within(panel).queryByRole('button', { name: 'Start machine' })).toBeNull()
  })

  it('starts an idle machine and saves it, without certifying it', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /^Founding Charter:/ }))
    await user.click(screen.getByRole('button', { name: 'Start machine' }))
    expect(screen.getByRole('button', { name: /^Founding Charter:.*Running\.$/ })).toBeInTheDocument()
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY)!)
    expect(saved.version).toBe(1)
    expect(saved.machines['founding-charter'].startedAt).toBeTruthy()
    expect(saved.machines['founding-charter'].certification).toBeUndefined()
    expect(screen.getByRole('button', { name: /Inspection.*Step 4/ })).toBeDisabled()
  })

  it('recovers from a corrupt save with a notice', () => {
    localStorage.setItem(SAVE_KEY, 'garbage')
    render(<App />)
    expect(screen.getByRole('status')).toHaveTextContent(/could not be read/)
  })
})
