/** Verify the deployed portfolio card, app panels, asset URLs, and offline PWA at desktop and phone widths. */
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
const origin=process.env.SITE_ORIGIN??'https://edwardtorres.dev'
const browser=await chromium.launch()
try {
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:true})
  const page=await context.newPage();const errors=[]
  page.on('pageerror',e=>errors.push(String(e)))
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.addInitScript(()=>{window.__csp=[];document.addEventListener('securitypolicyviolation',e=>window.__csp.push(e.violatedDirective))})
  await page.goto(origin+'/work')
  const card=page.getByRole('link',{name:'Open the DP-600 Study project page'})
  assert.equal(await card.count(),1)
  await card.click()
  await page.getByRole('heading',{name:'DP-600 STUDY',exact:true}).waitFor()
  assert.equal(await page.locator('img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth>0)),true)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)
  await page.getByRole('link',{name:'OPEN STUDY APP'}).first().click()
  await page.getByTestId('progress-stats').waitFor()
  assert.equal(new URL(page.url()).pathname,'/apps/fabric-mill/')
  for(const name of ['Labs','Settings','Pattern Dictionary','Weak Spots']){
   await page.getByRole('button',{name,exact:true}).click()
   await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape')
  }
  await page.getByRole('button',{name:/^Founding Charter:/}).click()
  await page.getByTestId('machine-notes').waitFor()
  await page.getByRole('button',{name:'Close machine panel'}).click()
  const registration=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return {scope:r.scope,script:r.active.scriptURL}})
  assert.equal(registration.scope,origin+'/apps/fabric-mill/')
  assert.equal(registration.script,origin+'/apps/fabric-mill/sw.js')
  const manifest=await (await context.request.get(origin+'/apps/fabric-mill/manifest.webmanifest')).json()
  assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./')
  for(const icon of manifest.icons) assert.equal((await context.request.get(origin+'/apps/fabric-mill/'+icon.src)).status(),200)
  await page.reload();await page.getByTestId('progress-stats').waitFor()
  await context.setOffline(true);await page.reload();await page.getByTestId('progress-stats').waitFor()
  await page.getByRole('button',{name:'Labs',exact:true}).click();await page.getByTestId('before-you-start').waitFor()
  await context.setOffline(false)
  assert.deepEqual(await page.evaluate(()=>window.__csp),[]);assert.deepEqual(errors,[])
  await page.goto(origin+'/work')
  assert.equal(await page.evaluate(()=>navigator.serviceWorker.controller===null),true)
  await context.close();console.log(`PASS ${width}px: work card, project images, app panels, scoped PWA, offline, and no CSP/console errors`)
 }
} finally {await browser.close()}
