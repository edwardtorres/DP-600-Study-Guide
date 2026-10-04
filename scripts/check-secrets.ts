/**
 * Fails if a tracked (or staged) file contains a local path, a private link,
 * or something that looks like a token. Run before every commit.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const patterns: [string, RegExp][] = [
  ['Unix home path', /\/(?:home|Users)\/[A-Za-z0-9._-]+\//],
  ['Root home path', /\/root\//],
  ['Windows user path', /[A-Za-z]:\\Users\\/i],
  ['Temp scratch path', /\/tmp\/claude/],
  ['Claude session link', /claude\.ai\/(?:code\/)?(?:session|chat|share)/i],
  ['GitHub token', /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}/],
  ['API key', /\bsk-[A-Za-z0-9_-]{20,}/],
  ['AWS key', /\bAKIA[0-9A-Z]{16}\b/],
  ['Private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['Bearer token', /\bBearer\s+[A-Za-z0-9._-]{20,}/],
]

const self = 'scripts/check-secrets.ts'
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' })
  .split('\n')
  .filter((f) => f && f !== self && f !== 'package-lock.json')

const hits: string[] = []
for (const file of files) {
  let text: string
  try {
    text = readFileSync(file, 'utf8')
  } catch {
    continue
  }
  text.split('\n').forEach((line, i) => {
    for (const [name, re] of patterns) if (re.test(line)) hits.push(`${file}:${i + 1} ${name}`)
  })
}

if (hits.length > 0) {
  console.error(`Secrets check failed (${hits.length}):`)
  for (const h of hits) console.error(`  ✗ ${h}`)
  process.exit(1)
}
console.log(`Secrets check passed (${files.length} files scanned).`)
