/**
 * README screenshots at desktop (1440 px) and phone (390 px) widths, taken from the production
 * build served with its real headers (run `npm run build` first):
 *   tsx scripts/screenshots.ts            → docs/screenshots/*.png
 * The save is a made-up fixture: a mill partway through Prepare data, with inspection answers.
 * Set PW_CHROMIUM to a Chromium binary if Playwright's own browser isn't installed.
 */
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { chromium, type Page } from '@playwright/test'
import { allQuestions } from '../src/content/questions/index.ts'
import { edges } from '../src/data/edges.ts'
import { machines } from '../src/data/machines.ts'
import { BACKUP_META_KEY } from '../src/save/backup.ts'
import { newSave, SAVE_KEY, type Save } from '../src/save/schema.ts'

const port = 4190
const out = 'docs/screenshots'
const now = new Date()

/** Certifies the first machines in prerequisite order, each with a passed inspection in the log. */
function fixture(count: number): Save {
  const save = newSave(new Date(now.getTime() - 9 * 86_400_000))
  const done = new Set<string>()
  const prereqs = (id: string) => edges.filter((e) => e.to === id).map((e) => e.from)
  let t = Math.floor(now.getTime() / 1000) - 8 * 86_400
  while (done.size < count) {
    const next = machines.find((m) => !done.has(m.id) && prereqs(m.id).every((p) => done.has(p)))
    if (!next) break
    done.add(next.id)
    save.machines[next.id] = { certification: { passedAt: new Date(t * 1000).toISOString(), score: 1, kind: 'inspection' } }
    for (const q of allQuestions.filter((x) => x.machineId === next.id && !x.caseStudyId).slice(0, 5)) save.answers.push([q.id, 1, (t += 60), 'i'])
    t += 3 * 3600
  }
  return save
}

async function open(page: Page, save: Save) {
  await page.addInitScript(
    ([saveKey, saveJson, metaKey, metaJson]) => {
      localStorage.setItem(saveKey, saveJson)
      localStorage.setItem(metaKey, metaJson)
    },
    [SAVE_KEY, JSON.stringify(save), BACKUP_META_KEY, JSON.stringify({ lastExportAt: now.toISOString() })] as const,
  )
  await page.goto(`http://localhost:${port}/`)
  await page.getByTestId('progress-stats').waitFor()
  await page.evaluate(() => document.fonts.ready)
}

async function machine(page: Page, name: string) {
  await page.getByRole('button', { name: new RegExp(`^${name}:`) }).click()
  await page.getByTestId('machine-notes').waitFor()
}

const server = spawn('npx', ['tsx', 'scripts/serve-dist.ts', String(port)], { stdio: 'ignore' })
try {
  await new Promise((r) => setTimeout(r, 2500))
  mkdirSync(out, { recursive: true })
  const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
  const save = fixture(14)
  const idle = machines.find((m) => !save.machines[m.id] && edges.filter((e) => e.to === m.id).every((e) => save.machines[e.from]))!

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  await open(desktop, save)
  await desktop.screenshot({ path: `${out}/desktop-map.png` })
  await machine(desktop, idle.themedName)
  await desktop.screenshot({ path: `${out}/desktop-notes.png` })

  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
  await open(phone, save)
  await phone.screenshot({ path: `${out}/phone-map.png` })
  await phone.getByRole('button', { name: 'Mock exam', exact: true }).click()
  await phone.getByRole('dialog', { name: 'Mock exam' }).getByRole('button', { name: 'Start a mock exam' }).click()
  await phone.getByTestId('case-panel').waitFor()
  await phone.screenshot({ path: `${out}/phone-mock.png` })

  await browser.close()
  console.log(`Wrote 4 screenshots to ${out}/ (idle machine: ${idle.themedName}).`)
} finally {
  server.kill()
}
