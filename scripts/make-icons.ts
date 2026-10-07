/**
 * Generates the PWA icons in public/icons from the favicon art, using Playwright's Chromium.
 *   tsx scripts/make-icons.ts   (set PW_CHROMIUM if Playwright's own browser isn't installed)
 * The PNGs are committed; re-run only when the artwork changes.
 */
import { chromium } from '@playwright/test'

const art = (pad: number, radius: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${32 + 2 * pad} ${32 + 2 * pad}" width="100%" height="100%">
  <rect x="${-pad}" y="${-pad}" width="${32 + 2 * pad}" height="${32 + 2 * pad}" rx="${radius}" fill="#211a14"/>
  <g stroke="#dcaa52" stroke-width="2.5" stroke-linecap="round"><path d="M8 9h16M8 16h16M8 23h16"/><path d="M11 6v20M21 6v20" stroke="#6f86d6"/></g></svg>`

const icons = [
  { file: 'icon-192.png', size: 192, pad: 0, radius: 6 },
  { file: 'icon-512.png', size: 512, pad: 0, radius: 6 },
  // Maskable icons keep the art inside the central safe zone (80%), with a square full-bleed background.
  { file: 'icon-512-maskable.png', size: 512, pad: 5, radius: 0 },
  // iOS rounds the corners itself, so the touch icon is square.
  { file: 'apple-touch-icon.png', size: 180, pad: 2, radius: 0 },
]

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {})
for (const i of icons) {
  const page = await browser.newPage({ viewport: { width: i.size, height: i.size } })
  await page.setContent(`<html><body style="margin:0;background:transparent">${art(i.pad, i.radius)}</body></html>`)
  await page.screenshot({ path: `public/icons/${i.file}`, omitBackground: true })
  await page.close()
  console.log(`public/icons/${i.file}`)
}
await browser.close()
