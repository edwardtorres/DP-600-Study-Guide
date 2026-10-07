import { expect, test } from '@playwright/test'
import { allQuestions } from '../src/content/questions/index'
import { DAILY_CAP } from '../src/game/review'
import { SAVE_KEY, newSave, type AnswerEntry, type Save } from '../src/save/schema'
import { SEED, answerShown, expectNoSideScroll, machineNode, expectAccessible } from './helpers'

const fo = allQuestions.filter((q) => q.machineId === 'founding-charter')
const others = allQuestions.filter((q) => !q.caseStudyId && q.bulletIds.length > 0)

/**
 * A save where Founding Charter is certified but its last five reviews were
 * wrong (needs maintenance), fifteen review answers were already given today
 * (so five remain under the cap), and six questions missed three days ago are due.
 */
function fixtureSave(): Save {
  const now = Math.floor(Date.now() / 1000)
  const save = newSave(new Date((now - 5 * 86400) * 1000))
  save.machines['founding-charter'] = { certification: { passedAt: new Date((now - 5 * 86400) * 1000).toISOString(), score: 1, kind: 'inspection' } }
  const due: AnswerEntry[] = others.slice(0, 6).map((q, i) => [q.id, 0, now - 3 * 86400 + i, 'i'])
  const todayWrong: AnswerEntry[] = fo.slice(0, 5).map((q, i) => [q.id, 0, now - 600 + i, 'r'])
  const todayRight: AnswerEntry[] = others.slice(20, 30).map((q, i) => [q.id, 1, now - 500 + i, 'r'])
  save.answers = [...due, ...todayWrong, ...todayRight]
  return save
}

const stored = async (page: import('@playwright/test').Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!) as Save, SAVE_KEY)

test('daily review: due questions under the daily cap, logged as r; a certified machine with poor reviews needs maintenance', async ({ page }) => {
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

  await test.step('the certified machine shows the maintenance mark and stays certified', async () => {
    const node = machineNode(page, 'Founding Charter')
    await expect(node).toHaveAttribute('data-maintenance', 'true')
    await expect(node).toHaveAttribute('data-state', 'certified')
    await node.tap()
    await expect(page.getByTestId('maintenance-note')).toContainText('Needs maintenance')
    await page.getByRole('button', { name: 'Close machine panel' }).tap()
  })

  await test.step('the Daily review page shows what is due and today’s cap', async () => {
    await page.getByRole('button', { name: /^Daily review/ }).tap()
    const dlg = page.getByRole('dialog', { name: 'Daily review' })
    await expect(dlg.getByTestId('due-count')).toHaveText('6 due')
    await expect(dlg.getByTestId('review-summary')).toContainText(`Reviewed today: 15 of ${DAILY_CAP}`)
    await expect(dlg.getByTestId('maintenance-list')).toContainText('Founding Charter')
    await expectNoSideScroll(page)
    await expectAccessible(page, 'review-flow.spec.ts:55')
    if (process.env.PW_SHOTS) await page.screenshot({ path: `${process.env.PW_SHOTS}/${test.info().project.name}-review-page.png` })
    await dlg.getByRole('button', { name: 'Start review (5 questions)' }).tap()
  })

  await test.step('answer the session (one wrong) and see it logged', async () => {
    const before = (await stored(page)).answers.length
    const dialog = page.getByRole('dialog').filter({ has: page.locator('#attempt-title') })
    await expect(dialog.locator('#attempt-title')).toHaveText('Daily review')
    for (let i = 0; i < 5; i++) {
      await answerShown(page, i === 0)
      await dialog.getByRole('button', { name: i < 4 ? 'Next' : 'Submit' }).tap()
    }
    await expect(dialog.getByRole('status')).toContainText('4 of 5 correct')
    await expect(dialog.getByRole('status')).toContainText('never certify')
    await expectNoSideScroll(page)
    await expectAccessible(page, 'review-flow.spec.ts:70')
    if (process.env.PW_SHOTS) await page.screenshot({ path: `${process.env.PW_SHOTS}/${test.info().project.name}-review-result.png` })
    await dialog.getByRole('button', { name: 'Back to the mill' }).tap()
    const s = await stored(page)
    const added = s.answers.slice(before)
    expect(added).toHaveLength(5)
    expect(added.every((a) => a[3] === 'r')).toBe(true)
    expect(added.filter((a) => a[1] === 0)).toHaveLength(1)
    expect(s.machines['founding-charter']?.certification?.kind).toBe('inspection')
  })

  await test.step('the cap is reached and only the overflow is still due', async () => {
    await expect(page.getByRole('button', { name: /^Daily review/ })).toHaveText('Daily review (1)')
    await page.getByRole('button', { name: /^Daily review/ }).tap()
    const dlg = page.getByRole('dialog', { name: 'Daily review' })
    await expect(dlg.getByTestId('due-count')).toHaveText('1 due')
    await expect(dlg).toContainText('reached today’s review cap')
  })

  expect(errors).toEqual([])
})
