/**
 * Proves the production bundle ignores ?seed= and ?mock=short. The seed hook (src/game/seed.ts)
 * is only reachable behind import.meta.env.DEV, which a production build folds to
 * false; this fails if the hook's marker or a "seed" query lookup survived.
 * Runs as part of `npm run build`.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const MARKER = 'fabric-mill:seed-hook'
const PATTERNS: [string, RegExp][] = [
  ['seed hook marker', new RegExp(MARKER)],
  ['a "seed" query parameter lookup', /\.get\(\s*["'`]seed["'`]\s*\)/],
  ['short mock hook marker', /fabric-mill:mock-short-hook/],
  ['a "mock" query parameter lookup', /\.get\(\s*["'`]mock["'`]\s*\)/],
]

export function findSeedHook(js: string): string[] {
  return PATTERNS.filter(([, re]) => re.test(js)).map(([name]) => name)
}

function main() {
  const dir = join(process.cwd(), 'dist', 'assets')
  let files: string[]
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.js'))
  } catch {
    console.error('check-bundle: dist/assets not found. Run vite build first.')
    process.exit(1)
  }
  if (files.length === 0) {
    console.error('check-bundle: no JavaScript in dist/assets.')
    process.exit(1)
  }
  // Positive control: the detector must catch both hooks' own sources.
  const source = ['seed.ts', 'mockShort.ts'].map((f) => readFileSync(join(process.cwd(), 'src', 'game', f), 'utf8')).join('\n')
  if (findSeedHook(source).length !== PATTERNS.length) {
    console.error('check-bundle: the detector no longer matches src/game/seed.ts and mockShort.ts; update the patterns.')
    process.exit(1)
  }
  const hits = files.flatMap((f) => findSeedHook(readFileSync(join(dir, f), 'utf8')).map((what) => `${f}: ${what}`))
  if (hits.length) {
    console.error(`check-bundle: the production bundle still contains a dev-only hook:\n  ${hits.join('\n  ')}`)
    process.exit(1)
  }
  console.log(`check-bundle: ok, ${files.length} production JS file(s) contain no ?seed= or ?mock=short hook.`)
}

main()
