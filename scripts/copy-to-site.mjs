/** Copy the verified subpath build into the portfolio without including Azure server configuration. */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'

const portfolio = process.argv[2]
if (!portfolio || !existsSync(join(portfolio, 'work.html')) || !existsSync(join(portfolio, '_headers'))) {
  throw new Error('Usage: npm run copy:site -- <portfolio checkout> (must contain work.html and _headers)')
}
const html = readFileSync('dist/index.html', 'utf8')
if (!html.includes('/apps/fabric-mill/assets/')) {
  throw new Error('Run npm run build:site before copying; this build does not use /apps/fabric-mill/.')
}
const target = resolve(portfolio, 'apps/fabric-mill')
rmSync(target, { recursive: true, force: true })
mkdirSync(target, { recursive: true })
cpSync('dist', target, { recursive: true })
for (const name of ['staticwebapp.config.json', 'robots.txt']) rmSync(join(target, name), { force: true })
const notFound = join(target, '404.html')
writeFileSync(notFound, readFileSync(notFound, 'utf8').replaceAll('href="/', 'href="/apps/fabric-mill/'))
console.log(`Copied the Fabric Mill build to ${target}`)
