import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { BACKUP_META_KEY } from './save/backup'
import { newSave, SAVE_KEY } from './save/schema'

describe('answer key access (Step 9)', () => {
  it('is reached only from Settings, after a warning', async () => {
    const user = userEvent.setup()
    render(<App />)
    expect(screen.queryByRole('heading', { name: 'Question bank review' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    await user.click(await screen.findByRole('button', { name: 'Open the question bank…' }))
    expect(screen.getByTestId('answer-key-warning')).toHaveTextContent('makes mocks, inspections, and reviews less meaningful')
    await user.click(screen.getByRole('button', { name: 'Show the answer key' }))
    // The answer key is a lazy chunk; under a full parallel test run it can take over a second.
    expect(await screen.findByRole('heading', { name: 'Question bank review' }, { timeout: 5000 })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Back to the mill/ }))
    expect(screen.queryByRole('heading', { name: 'Question bank review' })).toBeNull()
  })
})

describe('save protection (Step 9)', () => {
  it('shows the backup banner when there is progress and no recent export, and Later hides it', async () => {
    const save = { ...newSave(), answers: [['FO-01', 1, 1759579200, 's']] }
    localStorage.setItem(SAVE_KEY, JSON.stringify(save))
    const user = userEvent.setup()
    render(<App />)
    const banner = screen.getByTestId('backup-banner')
    expect(banner).toHaveTextContent('haven’t exported your save in the last 7 days')
    await user.click(within(banner).getByRole('button', { name: 'Later' }))
    expect(screen.queryByTestId('backup-banner')).toBeNull()
    expect(JSON.parse(localStorage.getItem(BACKUP_META_KEY)!).snoozeUntil).toBeTruthy()
  })

  it('has no banner for a new save', () => {
    render(<App />)
    expect(screen.queryByTestId('backup-banner')).toBeNull()
  })

  it('shows the storage persistence result and the Safari note in Settings', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: { persisted: async () => false, persist: async () => true } })
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: 'Settings' }))
    expect(await screen.findByTestId('persist-status')).toHaveTextContent('Storage: Persistent')
    expect(screen.getByTestId('storage-section')).toHaveTextContent('Safari may delete a site’s data')
    expect(screen.getByTestId('install-section')).toHaveTextContent('Add to Home Screen')
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined })
  })
})

describe('error boundary (Step 9)', () => {
  it('shows the crash screen with an export option', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Boom(): never {
      throw new Error('kaboom')
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Export save' })).toBeInTheDocument()
    expect(screen.getByText(/kaboom/)).toBeInTheDocument()
    spy.mockRestore()
  })
})

describe('effects never return a value (Step 9 CI)', () => {
  it('opens Labs when scrollTo returns a Promise, as newer Chromium does', async () => {
    const original = Element.prototype.scrollTo
    Element.prototype.scrollTo = function () {
      return Promise.resolve()
    } as unknown as typeof Element.prototype.scrollTo
    try {
      const user = userEvent.setup()
      render(<App />)
      await user.click(screen.getByRole('button', { name: 'Labs' }))
      expect(await screen.findByTestId('before-you-start', {}, { timeout: 5000 })).toBeInTheDocument()
      expect(screen.queryByText('Something went wrong')).toBeNull()
    } finally {
      Element.prototype.scrollTo = original
    }
  })
})
