import { expect, test } from '@playwright/test'
import { answerShown, backToMill, closeMachine, expectNoSideScroll, nodeState, openMachine, openMill, runAttempt, expectAccessible } from './helpers'

test('machine flow: notes → start-up → inspection → certified, then the same-day inspection lock', async ({ page }) => {
  const errors = await openMill(page)
  expect(await nodeState(page, 'Water Wheel')).toBe('locked')

  await test.step('Founding Charter: start-up check then inspection', async () => {
    await openMachine(page, 'Founding Charter')
    const startup = await runAttempt(page, /Start-up check/)
    expect(startup.status).toMatch(/2 of 2 correct/)
    await backToMill(startup.dialog)
    expect(await nodeState(page, 'Founding Charter')).toBe('running')

    const inspection = await runAttempt(page, /Take the inspection/)
    expect(inspection.status).toMatch(/5 of 5 correct/)
    await expectNoSideScroll(page)
    await expectAccessible(page, 'machine-flow.spec.ts:17')
    await backToMill(inspection.dialog)
    expect(await nodeState(page, 'Founding Charter')).toBe('certified')
    expect(await nodeState(page, 'Water Wheel')).toBe('idle')
    await closeMachine(page)
  })

  await test.step('Water Wheel: two failed inspections lock inspections until tomorrow', async () => {
    await openMachine(page, 'Water Wheel')
    const startup = await runAttempt(page, /Start-up check/)
    expect(startup.status).toMatch(/2 of 2 correct/)
    await backToMill(startup.dialog)

    const first = await runAttempt(page, /Take the inspection/, [0, 1])
    expect(first.status).toMatch(/3 of 5 correct/)
    // First retry is immediate, with a new draw.
    await first.dialog.getByRole('button', { name: 'Try again (new draw)' }).tap()
    const dialog = first.dialog
    const total = 5
    for (let i = 0; i < total; i++) {
      await answerShown(page, i < 2)
      await dialog.getByRole('button', { name: i < total - 1 ? 'Next' : 'Submit' }).tap()
    }
    await expect(dialog.getByTestId('retry-blocked')).toContainText('Two inspections failed today')
    await expect(dialog.getByRole('button', { name: 'Try again (new draw)' })).toHaveCount(0)
    await backToMill(dialog)
    await expect(page.getByRole('button', { name: /Take the inspection/ })).toBeDisabled()
    await expect(page.getByTestId('inspection-note')).toContainText('reopen tomorrow')
    expect(await nodeState(page, 'Water Wheel')).toBe('running')
  })

  await expectNoSideScroll(page)
  await expectAccessible(page, 'machine-flow.spec.ts:48')
  expect(errors).toEqual([])
})
