import AxeBuilder from '@axe-core/playwright'
import { expect, type Locator, type Page } from '@playwright/test'
import { allQuestions } from '../src/content/questions/index'

const byId = new Map(allQuestions.map((q) => [q.id, q]))

/** Seed for the dev-only ?seed= hook, so every draw and shuffle is repeatable. */
export const SEED = 22

/** Opens the app with a fresh save and records page errors. */
export async function openMill(page: Page): Promise<string[]> {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  await page.goto(`/?seed=${SEED}`)
  await expect(page.getByRole('button', { name: /^Founding Charter:/ })).toBeVisible()
  return errors
}

export const machineNode = (page: Page, name: string) => page.getByRole('button', { name: new RegExp(`^${name}:`) }).first()

export async function nodeState(page: Page, name: string): Promise<string | null> {
  return machineNode(page, name).getAttribute('data-state')
}

export async function openMachine(page: Page, name: string) {
  await machineNode(page, name).tap()
  await expect(page.getByRole('heading', { level: 2, name })).toBeVisible()
}

export async function closeMachine(page: Page) {
  await page.getByRole('button', { name: 'Close machine panel' }).tap()
}

/**
 * Answers the question on screen from the bank, by tap only (native selects use
 * selectOption). With `wrong`, gives a deliberately wrong answer instead.
 */
export async function answerShown(page: Page, wrong = false): Promise<string> {
  const section = page.locator('section[data-question-id]')
  const id = (await section.getAttribute('data-question-id'))!
  const q = byId.get(id)
  if (!q) throw new Error(`Unknown question ${id}`)
  const label = (text: string) => section.locator('label').filter({ has: page.getByText(text, { exact: true }) })
  switch (q.format) {
    case 'single':
    case 'multi': {
      let keys = q.format === 'single' ? [q.answer] : q.answers
      if (wrong) keys = [q.options.find((o) => !keys.includes(o.id))!.id, ...keys.slice(1)]
      for (const k of keys) await label(q.options.find((o) => o.id === k)!.text).tap()
      break
    }
    case 'yesno':
      for (const [i, s] of q.statements.entries()) {
        const value = wrong && i === 0 ? !s.answer : s.answer
        await section.locator('li').filter({ hasText: s.text }).locator('label').filter({ has: page.getByText(value ? 'Yes' : 'No', { exact: true }) }).tap()
      }
      break
    case 'match':
      for (const [i, pr] of q.pairs.entries()) {
        const choice = wrong ? q.pairs[(i + 1) % q.pairs.length]!.choiceId : pr.choiceId
        await section.locator(`[data-prompt="${pr.promptId}"]`).tap()
        await section.locator(`[data-choice="${choice}"]`).tap()
      }
      break
    case 'order':
      // The shuffle never starts solved, so leaving it as shown is wrong.
      if (wrong) break
      for (const [target, itemId] of q.answerOrder.entries()) {
        for (;;) {
          const ids = await section.locator('[data-item]').evaluateAll((els) => els.map((e) => e.getAttribute('data-item')))
          if (ids.indexOf(itemId) <= target) break
          await section.locator(`[data-item="${itemId}"] [data-move="up"]`).tap()
        }
      }
      break
    case 'dropdown':
      for (const [i, s] of q.slots.entries()) {
        const value = wrong && i === 0 ? s.options.find((o) => o.id !== s.answer)!.id : s.answer
        await section.locator(`select[data-slot="${s.id}"]`).selectOption(value)
      }
      break
  }
  return q.format
}

/**
 * Runs a whole attempt from the machine panel. `wrongAt` lists the question
 * positions (0-based) to answer wrongly. Returns the result status text.
 */
export async function runAttempt(page: Page, button: RegExp, wrongAt: number[] = []): Promise<{ status: string; dialog: Locator }> {
  await page.getByRole('button', { name: button }).tap()
  const dialog = page.getByRole('dialog', { name: /./ }).filter({ has: page.locator('#attempt-title') })
  const total = Number((await dialog.getByText(/Question 1 of \d+/).textContent())!.match(/of (\d+)/)![1])
  for (let i = 0; i < total; i++) {
    await answerShown(page, wrongAt.includes(i))
    await dialog.getByRole('button', { name: i < total - 1 ? 'Next' : 'Submit' }).tap()
  }
  const status = ((await dialog.getByRole('status').textContent()) ?? '').trim()
  return { status, dialog }
}

export async function backToMill(dialog: Locator) {
  await dialog.getByRole('button', { name: 'Back to the mill' }).tap()
}

/** The page never scrolls sideways (code and tables scroll inside their own boxes). */
export async function expectNoSideScroll(page: Page) {
  const { scroll, width } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, width: window.innerWidth }))
  expect(scroll).toBeLessThanOrEqual(width)
}

/**
 * Runs axe on the current screen and fails on any serious or critical issue
 * (WCAG 2.x A and AA rules). `label` names the screen in the failure message.
 */
export async function expectAccessible(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
  const serious = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')
  const summary = serious.map((v) => `${v.impact} ${v.id}: ${v.help} (${v.nodes.length} node(s): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')})`)
  expect(summary, `axe on ${label}`).toEqual([])
}
