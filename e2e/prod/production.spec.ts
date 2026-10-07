import { expect, test, type Page } from '@playwright/test'
import { machines } from '../../src/data/machines'
import { SAVE_KEY, newSave } from '../../src/save/schema'
import { answerShown, expectAccessible, expectNoSideScroll, openMachine, runAttempt } from '../helpers'

/**
 * Production checks, run against the built app under the real hosting config (npm run e2e:prod)
 * or against the live site (E2E_BASE_URL=https://… npm run e2e:live). By tap, at both widths.
 */

/** Records CSP violations and console errors from the start of every page load. */
async function watch(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e)}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`)
  })
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] }
    w.__csp = []
    document.addEventListener('securitypolicyviolation', (e) => w.__csp.push(`${e.violatedDirective} ${e.blockedURI}`))
  })
  return {
    errors,
    csp: () => page.evaluate(() => (window as unknown as { __csp: string[] }).__csp),
  }
}

const map = (page: Page) => page.getByRole('button', { name: /^Founding Charter:/ })

test('hosting: security headers, SPA fallback, and the 404 page', async ({ page, request }) => {
  const res = await request.get('/')
  expect(res.status()).toBe(200)
  const h = res.headers()
  expect(h['content-security-policy']).toContain("default-src 'self'")
  expect(h['content-security-policy']).toContain("script-src 'self'")
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(h['strict-transport-security']).toContain('max-age=')
  const deep = await request.get('/some/deep/link')
  expect(deep.status()).toBe(200)
  expect(await deep.text()).toContain('<div id="root">')
  const missing = await request.get('/assets/does-not-exist.js')
  expect(missing.status()).toBe(404)
  expect(await missing.text()).toContain('No such thread')
  await page.goto('/some/deep/link')
  await expect(map(page)).toBeVisible()
})

test('the app runs under the CSP: map, notes, start-up check, review, Weak Spots, labs, settings, mock, with axe on each screen', async ({ page }) => {
  const w = await watch(page)
  await page.goto('/')
  await expect(map(page)).toBeVisible()
  await expectAccessible(page, 'map')
  await expectNoSideScroll(page)

  await test.step('notes and a start-up check', async () => {
    await map(page).tap()
    await expect(page.getByTestId('machine-notes')).toBeVisible()
    await expect(page.getByTestId('notes-verified')).toContainText('Last checked on Learn:')
    await expectAccessible(page, 'machine panel')
    const { status, dialog } = await runAttempt(page, /Start-up check/)
    expect(status).toMatch(/2 of 2/)
    await expectAccessible(page, 'start-up result')
    await dialog.getByRole('button', { name: 'Back to the mill' }).tap()
    await page.getByRole('button', { name: 'Close machine panel' }).tap()
  })

  await test.step('Daily review, Weak Spots, and Labs open', async () => {
    await page.getByRole('button', { name: /^Daily review/ }).tap()
    await expect(page.getByRole('dialog', { name: 'Daily review' })).toBeVisible()
    await expectAccessible(page, 'daily review')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Weak Spots' }).tap()
    await expect(page.getByRole('dialog', { name: 'Weak Spots' })).toBeVisible()
    await expectAccessible(page, 'weak spots')
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: 'Labs', exact: true }).tap()
    await expect(page.getByRole('dialog', { name: 'Workshop labs' })).toBeVisible()
    await expectAccessible(page, 'labs')
    await page.keyboard.press('Escape')
  })

  await test.step('Settings: storage, install help, and the answer key behind a warning', async () => {
    await page.getByRole('button', { name: 'Settings' }).tap()
    await expect(page.getByTestId('persist-status')).toContainText('Storage:')
    await expect(page.getByTestId('install-section')).toContainText('Add to Home Screen')
    await expectAccessible(page, 'settings')
    await page.getByRole('button', { name: 'Open the question bank…' }).tap()
    await expect(page.getByTestId('answer-key-warning')).toBeVisible()
    await page.getByRole('button', { name: 'Show the answer key' }).tap()
    await expect(page.getByRole('heading', { name: 'Question bank review' })).toBeVisible()
    await page.getByRole('button', { name: /Back to the mill/ }).tap()
  })

  await test.step('a full mock: case study, leave it, submit, results', async () => {
    await page.getByRole('button', { name: 'Mock exam' }).tap()
    await page.getByRole('dialog', { name: 'Mock exam' }).getByRole('button', { name: 'Start a mock exam' }).tap()
    const exam = page.getByRole('dialog', { name: /Question \d+ of \d+|Review your answers/ })
    await expect(exam.getByTestId('case-panel')).toBeVisible()
    await answerShown(page)
    await expectAccessible(page, 'mock exam')
    // Leave the case study from its last question.
    while (await exam.getByRole('button', { name: 'Next' }).isVisible()) await exam.getByRole('button', { name: 'Next' }).tap()
    await exam.getByRole('button', { name: 'Leave case study' }).tap()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Leave section' }).tap()
    await answerShown(page)
    // Jump to the last question (the rest stay unanswered and count as wrong), then review.
    await exam.getByRole('button', { name: /^Question \d+, / }).last().tap()
    await exam.getByRole('button', { name: 'Review answers' }).tap()
    await exam.getByRole('button', { name: 'Submit exam' }).tap()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Submit' }).tap()
    await expect(page.getByTestId('mock-results')).toBeVisible()
    await expect(page.getByTestId('mock-freshness')).toContainText('Freshness:')
    await expectAccessible(page, 'mock results')
    await expectNoSideScroll(page)
  })

  expect(await w.csp()).toEqual([])
  expect(w.errors).toEqual([])
})

test('puzzles and a lab load and run under the CSP (every lazy chunk)', async ({ page }) => {
  // A save with every machine certified except the puzzle machines, so their benches are open.
  const plays: [machine: string, puzzle: string][] = [
    ['Kusto Tension Meter', 'QO-K01'],
    ['Warp Frame', 'PD-05'],
    ['Direct Lake Shuttle', 'SF-15'],
    ['Thread Sieves', 'AM-04'],
  ]
  const open = new Set(plays.map(([name]) => machines.find((m) => m.themedName === name)!.id))
  const now = new Date()
  const save = newSave(now)
  for (const m of machines) if (!open.has(m.id)) save.machines[m.id] = { certification: { passedAt: now.toISOString(), score: 1, kind: 'inspection' } }
  await page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('fixture-loaded')) {
      localStorage.setItem(key, value)
      sessionStorage.setItem('fixture-loaded', '1')
    }
  }, [SAVE_KEY, JSON.stringify(save)] as const)
  const w = await watch(page)
  await page.goto('/')
  await expect(map(page)).toBeVisible()
  for (const [machine, puzzleId] of plays) {
    await openMachine(page, machine)
    await page.getByTestId('puzzle-bench').locator(`[data-puzzle="${puzzleId}"]`).tap()
    const dialog = page.getByRole('dialog').filter({ has: page.locator('#puzzle-title') })
    await expect(dialog.getByTestId('puzzle-body')).toHaveAttribute('data-puzzle-id', puzzleId)
    await expectAccessible(page, `puzzle ${puzzleId}`)
    await dialog.getByRole('button', { name: 'Close', exact: true }).tap()
    await page.getByRole('button', { name: 'Close machine panel' }).tap()
  }
  await page.getByRole('button', { name: 'Labs', exact: true }).tap()
  const labs = page.getByRole('dialog', { name: 'Workshop labs' })
  await labs.locator('button[data-lab="L05"]').tap()
  await expect(labs.getByTestId('lab-view').getByRole('checkbox').first()).toBeVisible()
  await expectAccessible(page, 'lab view')
  expect(await w.csp()).toEqual([])
  expect(w.errors).toEqual([])
})

test('works offline after the first visit (service worker)', async ({ page, context }) => {
  await page.goto('/')
  await expect(map(page)).toBeVisible()
  // Wait until the service worker controls the page and has precached the app.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(map(page)).toBeVisible()
  await map(page).tap()
  await expect(page.getByTestId('machine-notes')).toBeVisible()
  await context.setOffline(false)
})

test('installable: the manifest and icons are served', async ({ request }) => {
  const m = await request.get('/manifest.webmanifest')
  expect(m.status()).toBe(200)
  const manifest = (await m.json()) as { display: string; icons: { src: string }[] }
  expect(manifest.display).toBe('standalone')
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).status()).toBe(200)
  expect((await request.get('/icons/apple-touch-icon.png')).status()).toBe(200)
})
