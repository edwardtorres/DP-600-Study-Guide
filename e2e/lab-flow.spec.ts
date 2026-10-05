import { readFile } from 'node:fs/promises'
import { expect, test, type Page } from '@playwright/test'
import { labById } from '../src/content/labs/index'
import { LAB_XP, requiredStepIds } from '../src/game/labs'
import { SAVE_KEY, type Save } from '../src/save/schema'
import { answerShown, expectNoSideScroll, machineNode, nodeState, openMill } from './helpers'

const LAB = labById.get('L05')!
const NOTE = 'The Save as view button is under a different menu on my screen'

const xp = async (page: Page) => Number((await page.getByTestId('progress-stats').innerText()).match(/(\d[\d,]*) XP/)![1]!.replace(/,/g, ''))
const shot = async (page: Page, name: string) => {
  if (process.env.PW_SHOTS) await page.screenshot({ path: `${process.env.PW_SHOTS}/${test.info().project.name}-lab-${name}.png` })
}

test('lab flow: trial clock, steps, a problem note, export, completion, and the debrief, by tap', async ({ page }) => {
  const errors = await openMill(page)
  const labs = page.getByRole('dialog', { name: 'Workshop labs' })

  await test.step('open the Labs page and set the trial start date', async () => {
    await page.getByRole('button', { name: 'Labs', exact: true }).tap()
    await expect(labs.getByTestId('before-you-start')).toContainText('60 days')
    // Four local days ago, so today is day 5 of the trial.
    const start = await page.evaluate(() => {
      const d = new Date()
      d.setDate(d.getDate() - 4)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    })
    await labs.getByLabel('Trial start date').fill(start)
    await labs.getByRole('button', { name: 'Save date' }).tap()
    await expect(labs.getByTestId('days-left')).toHaveText('56 of 60 days left')
    await expect(labs.getByTestId('schedule').locator('li')).toHaveCount(15)
    await expectNoSideScroll(page)
    await shot(page, 'list')
  })

  await test.step('open a lab, tick steps, and report a problem', async () => {
    await labs.locator(`button[data-lab="${LAB.id}"]`).tap()
    const view = labs.getByTestId('lab-view')
    await expect(view.getByRole('heading', { name: LAB.title })).toBeVisible()
    const complete = view.getByRole('button', { name: /Mark lab complete/ })
    await expect(complete).toBeDisabled()

    const first = view.locator('[data-step="s1"]').first()
    await first.getByRole('checkbox').tap()
    await expect(first.getByRole('checkbox')).toBeChecked()

    const noted = view.locator('[data-step="s4"]').first()
    await noted.getByRole('button', { name: 'Report a problem with this step' }).tap()
    await noted.getByLabel(/What didn’t match/).fill(NOTE)
    await noted.getByRole('button', { name: 'Save note' }).tap()
    await expect(noted.getByText('Saved on this device')).toBeVisible()
    await expect(noted.getByTestId('trap-callout')).toContainText('Trap you’ll see')
    await expectNoSideScroll(page)
    await shot(page, 'steps')
  })

  await test.step('export the lab notes', async () => {
    const [download] = await Promise.all([page.waitForEvent('download'), labs.getByRole('button', { name: 'Export lab notes' }).tap()])
    expect(download.suggestedFilename()).toMatch(/^fabric-mill-lab-notes-\d{4}-\d{2}-\d{2}\.txt$/)
    const text = await readFile((await download.path())!, 'utf8')
    expect(text).toContain(`${LAB.id} ${LAB.title}`)
    expect(text).toContain(`Step 4 [${LAB.id}/s4] (not ticked)`)
    expect(text).toContain(`Problem: ${NOTE}`)
    expect(text).toContain('day 5 of 60')
  })

  const xpBefore = await xp(page)

  await test.step('complete the lab: fixed XP, no machine certified', async () => {
    const view = labs.getByTestId('lab-view')
    for (const id of requiredStepIds(LAB)) {
      const box = view.locator(`[data-step="${id}"]`).getByRole('checkbox')
      if (!(await box.isChecked())) await box.tap()
    }
    await view.getByRole('button', { name: /Mark lab complete/ }).tap()
    await expect(view.getByTestId('lab-finish').getByRole('status')).toContainText('Lab complete')
    expect(await xp(page)).toBe(xpBefore + LAB_XP)
    const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!) as Save, SAVE_KEY)
    expect(save.labs[LAB.id]?.completedAt).toBeTruthy()
    expect(save.labs[LAB.id]?.problems.s4).toBe(NOTE)
    expect(save.machines).toEqual({})
    await shot(page, 'complete')
  })

  await test.step('answer the debrief from the bank', async () => {
    await labs.getByRole('button', { name: 'Debrief (3 questions)' }).tap()
    const dialog = page.getByRole('dialog').filter({ has: page.locator('#attempt-title') })
    await expect(dialog.locator('#attempt-title')).toContainText(LAB.title)
    for (let i = 0; i < 3; i++) {
      await answerShown(page)
      await dialog.getByRole('button', { name: i < 2 ? 'Next' : 'Submit' }).tap()
    }
    await expect(dialog.getByRole('status')).toContainText('3 of 3 correct')
    await expect(dialog.getByRole('status')).toContainText('never certifies')
    await expectNoSideScroll(page)
    await shot(page, 'debrief')
    await dialog.getByRole('button', { name: 'Back to the mill' }).tap()
    expect(await xp(page)).toBeGreaterThan(xpBefore + LAB_XP)
    const save = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!) as Save, SAVE_KEY)
    const debrief = save.answers.filter((a) => a[3] === 'l')
    expect(debrief).toHaveLength(3)
    expect(debrief.every((a) => a[1] === 1)).toBe(true)
    expect(save.machines).toEqual({})
  })

  await test.step('the machine’s Workshop tab lists the lab as complete and opens it', async () => {
    await labs.getByRole('button', { name: 'Close labs' }).tap()
    expect(await nodeState(page, 'Inspection Bench')).not.toBe('certified')
    await machineNode(page, 'Inspection Bench').tap()
    await page.getByRole('tab', { name: /Workshop/ }).tap()
    const item = page.getByTestId('workshop').locator(`button[data-lab="${LAB.id}"]`)
    await expect(item).toContainText('Complete')
    await expectNoSideScroll(page)
    await shot(page, 'workshop')
    await item.tap()
    await expect(labs.getByTestId('lab-view')).toHaveAttribute('data-lab', LAB.id)
  })

  expect(errors).toEqual([])
})
