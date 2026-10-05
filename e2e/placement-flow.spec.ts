import { expect, test } from '@playwright/test'
import { backToMill, closeMachine, expectNoSideScroll, nodeState, openMachine, openMill, runAttempt } from './helpers'

test('placement flow: a failed placement blocks a same-day retry; a perfect one places the machine', async ({ page }) => {
  const errors = await openMill(page)

  await test.step('Loom Gearbox: one wrong answer fails, and the day is used', async () => {
    await openMachine(page, 'Loom Gearbox')
    expect(await nodeState(page, 'Loom Gearbox')).toBe('locked')
    const fail = await runAttempt(page, /placement check/, [0])
    expect(fail.status).toMatch(/4 of 5 correct/)
    await backToMill(fail.dialog)
    await expect(page.getByRole('button', { name: /placement check/ })).toBeDisabled()
    await expect(page.getByText(/One placement attempt per day/)).toBeVisible()
    await closeMachine(page)
  })

  await test.step('Warp Frame: 5 of 5 places the locked machine and unlocks what it feeds', async () => {
    expect(await nodeState(page, 'Warp Frame')).toBe('locked')
    expect(await nodeState(page, 'DAX Scale')).toBe('locked')
    await openMachine(page, 'Warp Frame')
    const pass = await runAttempt(page, /placement check/)
    expect(pass.status).toMatch(/5 of 5 correct/)
    await backToMill(pass.dialog)
    expect(await nodeState(page, 'Warp Frame')).toBe('certified')
    expect(await nodeState(page, 'DAX Scale')).toBe('idle')
    await closeMachine(page)
  })

  await test.step('DAX Scale: 5 of 5 places it too', async () => {
    await openMachine(page, 'DAX Scale')
    const pass = await runAttempt(page, /placement check/)
    expect(pass.status).toMatch(/5 of 5 correct/)
    await expectNoSideScroll(page)
    await backToMill(pass.dialog)
    expect(await nodeState(page, 'DAX Scale')).toBe('certified')
    await expect(page.getByText('Placed out with a perfect placement check.')).toBeVisible()
    await closeMachine(page)
    await expect(page.getByRole('button', { name: /^DAX Scale:/ }).first()).toHaveAttribute('data-placed', /.+/)
  })

  await expectNoSideScroll(page)
  expect(errors).toEqual([])
})
