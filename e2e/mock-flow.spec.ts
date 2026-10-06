import { expect, test, type Page } from '@playwright/test'
import { SAVE_KEY, type Save } from '../src/save/schema'
import { SEED, answerShown, expectNoSideScroll, openMill } from './helpers'

const stored = async (page: Page) => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!) as Save, SAVE_KEY)
const seconds = (t: string) => t.split(':').map(Number).reduce((a, b) => a * 60 + b, 0)
const shot = async (page: Page, name: string) => {
  if (process.env.PW_SHOTS) await page.screenshot({ path: `${process.env.PW_SHOTS}/${test.info().project.name}-mock-${name}.png` })
}

test('mock exam (short dev mode): case study section and lock, mark for review, reload, review screen, and results', async ({ page }) => {
  const errors = await openMill(page)
  await page.goto(`/?seed=${SEED}&mock=short`)
  const exam = page.getByRole('dialog', { name: /Question \d+ of \d+|Review your answers/ })

  await test.step('start a mock: the case study comes first', async () => {
    await page.getByRole('button', { name: 'Mock exam' }).tap()
    const center = page.getByRole('dialog', { name: 'Mock exam' })
    await expect(center.getByTestId('ready-to-book')).toContainText('Not ready to book yet')
    await center.getByRole('button', { name: 'Start a mock exam' }).tap()
    await expect(exam.getByTestId('case-panel')).toBeVisible()
    await expect(exam).toContainText('Section 1 of 2: case study')
    await expect(exam.getByTestId('mock-timer')).toHaveText(/^(10:00|9:5\d)$/)
    await expectNoSideScroll(page)
    await shot(page, 'case')
  })

  const save0 = await stored(page)
  const caseCount = save0.activeMock!.caseIds.length
  const mainCount = save0.activeMock!.mainIds.length
  expect(mainCount).toBe(6)

  await test.step('answer the case questions, then leave the section after the warning', async () => {
    for (let i = 0; i < caseCount; i++) {
      await answerShown(page)
      if (i < caseCount - 1) await exam.getByRole('button', { name: 'Next' }).tap()
    }
    // No feedback during the exam.
    await expect(exam.getByText(/Correct answer|Your answer/)).toHaveCount(0)
    await exam.getByRole('button', { name: 'Leave case study' }).tap()
    const warn = page.getByRole('alertdialog')
    await expect(warn).toContainText('can’t return to this section')
    await warn.getByRole('button', { name: 'Stay' }).tap()
    await expect(exam.getByTestId('case-panel')).toBeVisible()
    await exam.getByRole('button', { name: 'Leave case study' }).tap()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Leave section' }).tap()
    await expect(exam).toContainText('Section 2 of 2')
    await expect(exam.getByTestId('case-panel')).toHaveCount(0)
    // Only the main section's questions can be opened now.
    await expect(exam.getByTestId('mock-nav').getByRole('button')).toHaveCount(mainCount)
    expect((await stored(page)).activeMock!.caseLocked).toBe(true)
  })

  await test.step('answer and mark questions, then reload: the timer keeps running and answers stay', async () => {
    await answerShown(page)
    await exam.getByLabel('Mark for review').tap()
    await exam.getByRole('button', { name: 'Next' }).tap()
    await answerShown(page)
    const before = seconds((await exam.getByTestId('mock-timer').textContent())!)
    await page.waitForTimeout(1500)
    await page.reload()
    await expect(exam.getByTestId('mock-timer')).toBeVisible()
    const after = seconds((await exam.getByTestId('mock-timer').textContent())!)
    expect(after).toBeLessThan(before)
    expect(after).toBeGreaterThan(before - 30)
    await expect(exam).toContainText('Section 2 of 2')
    const nav = exam.getByTestId('mock-nav')
    await expect(nav.getByRole('button', { name: /, answered, marked for review$/ })).toHaveCount(1)
    await expect(nav.getByRole('button', { name: /, answered/ })).toHaveCount(2)
  })

  await test.step('answer the rest except one, then use the review screen', async () => {
    const nav = exam.getByTestId('mock-nav')
    await nav.getByRole('button').nth(2).tap()
    for (let i = 2; i < mainCount - 1; i++) {
      await answerShown(page)
      await exam.getByRole('button', { name: 'Next' }).tap()
    }
    await exam.getByRole('button', { name: 'Review answers' }).tap()
    const review = exam.getByTestId('mock-review')
    await expect(review).toContainText('1 unanswered · 1 marked for review')
    await expect(review).toContainText('Section 1 (case study')
    await expect(review.getByText('Marked', { exact: true })).toHaveCount(1)
    await expectNoSideScroll(page)
    await shot(page, 'review')
    await exam.getByRole('button', { name: 'Submit exam' }).tap()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('1 question is unanswered')
    await confirm.getByRole('button', { name: 'Submit' }).tap()
  })

  await test.step('results: scores, explanations, traps, scaled-score note, and history', async () => {
    const results = page.getByTestId('mock-results')
    await expect(results).toBeVisible()
    await expect(results.getByTestId('mock-overall')).toHaveText(/^\d+%$/)
    await expect(results.getByTestId('mock-domains').locator('li')).toHaveCount(3)
    await expect(results.getByTestId('mock-bullets').locator('li').first()).toBeVisible()
    await expect(results.getByTestId('mock-traps')).toBeVisible()
    await expect(results.getByTestId('scaled-note')).toContainText('scaled score, it may not equal 70% of the points')
    await expect(results.locator('article[data-question-id]')).toHaveCount(caseCount + mainCount)
    await expect(results.locator('article[data-correct="false"]').first()).toBeVisible()
    await expectNoSideScroll(page)
    await shot(page, 'results')
    const s = await stored(page)
    expect(s.activeMock).toBeUndefined()
    expect(s.mocks).toHaveLength(1)
    expect(s.answers.filter((a) => a[3] === 'm')).toHaveLength(caseCount + mainCount)
    expect(s.machines).toEqual({})
    await page.getByRole('button', { name: '← All mocks' }).tap()
    await expect(page.getByTestId('mock-history').locator('li')).toHaveCount(1)
    await expect(page.getByTestId('mock-history')).toContainText('(short)')
  })

  expect(errors).toEqual([])
})
