import { expect, test, type Page } from '@playwright/test'
import { puzzleById } from '../src/content/puzzles/index'
import { machines } from '../src/data/machines'
import { mulberry32 } from '../src/game/shuffle'
import { shuffleForPlay } from '../src/puzzles/play'
import { SAVE_KEY, newSave, type Save } from '../src/save/schema'
import { SEED, closeMachine, expectNoSideScroll, machineNode, nodeState, openMachine } from './helpers'

/** One puzzle of each type, on machines whose prerequisites the fixture certifies. */
const plays: [machine: string, puzzle: string][] = [
  ['Kusto Tension Meter', 'QO-K01'],
  ['Warp Frame', 'PD-05'],
  ['Direct Lake Shuttle', 'GB-S06'],
  ['Direct Lake Shuttle', 'SF-15'],
  ['Thread Sieves', 'AM-04'],
  ['Ripple Map', 'RP-02'],
  ['Conveyor', 'CN-03'],
]
const targetIds = new Set(plays.map(([name]) => machines.find((m) => m.themedName === name)!.id))

/** A mill where every machine except the puzzle machines is certified, so those are unlocked but not certified. */
function fixtureSave(): Save {
  const now = new Date('2026-10-05T09:00:00Z')
  const save = newSave(now)
  for (const m of machines) if (!targetIds.has(m.id)) save.machines[m.id] = { certification: { passedAt: now.toISOString(), score: 1, kind: 'inspection' } }
  return save
}

const xp = async (page: Page) => Number((await page.getByTestId('progress-stats').innerText()).match(/(\d[\d,]*) XP/)![1]!.replace(/,/g, ''))

test('puzzle flow: one puzzle of each type, solved by tap; XP rises and no machine is certified', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('fixture-loaded')) {
      localStorage.setItem(key, value)
      sessionStorage.setItem('fixture-loaded', '1')
    }
  }, [SAVE_KEY, JSON.stringify(fixtureSave())] as const)
  await page.goto(`/?seed=${SEED}`)
  await expect(machineNode(page, 'Founding Charter')).toBeVisible()

  // The app's seeded random source: each puzzle play takes the next value as its seed.
  const rand = mulberry32(SEED)
  let before = await xp(page)

  for (const [machine, puzzleId] of plays) {
    await test.step(`${machine}: ${puzzleId}`, async () => {
      expect(await nodeState(page, machine)).toBe('idle')
      await openMachine(page, machine)
      await page.getByTestId('puzzle-bench').locator(`[data-puzzle="${puzzleId}"]`).tap()
      const seed = Math.floor(rand() * 0xffffffff)
      const instance = shuffleForPlay(puzzleById.get(puzzleId)!.build(seed), seed)
      const dialog = page.getByRole('dialog').filter({ has: page.locator('#puzzle-title') })
      await expect(dialog.getByTestId('puzzle-body')).toHaveAttribute('data-puzzle-id', puzzleId)
      for (const d of instance.decisions) {
        const box = dialog.locator(`[data-decision="${d.id}"]`)
        const want = d.accepted[0]!
        if (d.ui === 'toggle') {
          if (want === 'yes') await box.getByRole('button').tap()
        } else if (d.ui === 'select') await box.locator('select').selectOption(want)
        else await box.locator(`[data-choice="${want}"]`).tap()
      }
      await expectNoSideScroll(page)
      if (process.env.PW_SHOTS) await page.screenshot({ path: `${process.env.PW_SHOTS}/${test.info().project.name}-${puzzleId}-answered.png`, fullPage: true })
      await dialog.getByRole('button', { name: 'Check' }).tap()
      await expect(dialog.getByRole('status')).toContainText(`${instance.decisions.length} of ${instance.decisions.length} right`)
      await expectNoSideScroll(page)
      if (process.env.PW_SHOTS) await page.screenshot({ path: `${process.env.PW_SHOTS}/${test.info().project.name}-${puzzleId}-result.png` })
      await dialog.getByRole('button', { name: 'Back to the mill' }).tap()
      const after = await xp(page)
      expect(after).toBeGreaterThan(before)
      before = after
      // Puzzles are practice: the machine stays uncertified.
      expect(await nodeState(page, machine)).toBe('idle')
      await expect(page.getByTestId('puzzle-bench').locator(`[data-puzzle="${puzzleId}"]`)).toContainText('Solved')
      await closeMachine(page)
    })
  }

  await test.step('a locked machine’s bench is closed', async () => {
    await page.evaluate((key) => localStorage.removeItem(key), SAVE_KEY)
    await page.reload()
    await openMachine(page, 'Kusto Tension Meter')
    expect(await nodeState(page, 'Kusto Tension Meter')).toBe('locked')
    await expect(page.getByTestId('puzzle-bench').locator('[data-puzzle="QO-K01"]')).toBeDisabled()
  })

  expect(errors).toEqual([])
})
