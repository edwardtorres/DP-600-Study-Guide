/**
 * Serves dist/ the way Azure Static Web Apps will, using public/staticwebapp.config.json:
 * global headers (including the CSP), per-route headers, the SPA navigation fallback,
 * and the 404 override. Text responses are gzipped when the browser accepts it, as a
 * static host's CDN would. Used by the production e2e project and Lighthouse.
 *   tsx scripts/serve-dist.ts [port]   (default 4173)
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { gzipSync } from 'node:zlib'

interface SwaConfig {
  globalHeaders: Record<string, string>
  routes: { route: string; headers?: Record<string, string> }[]
  navigationFallback: { rewrite: string; exclude: string[] }
  responseOverrides?: Record<string, { rewrite: string; statusCode?: number }>
  mimeTypes?: Record<string, string>
}

const root = 'dist'
const config = JSON.parse(readFileSync('public/staticwebapp.config.json', 'utf8')) as SwaConfig
const port = Number(process.argv[2] ?? 4173)

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  ...config.mimeTypes,
}

/** SWA-style wildcard: "*" matches within the path, "{a,b}" alternatives. */
export function matches(pattern: string, path: string): boolean {
  const re = pattern
    .replace(/[.+^$()|[\]\\]/g, '\\$&')
    .replace(/\{([^}]+)\}/g, (_, alts: string) => `(${alts.split(',').join('|')})`)
    .replace(/\*/g, '.*')
  return new RegExp(`^${re}$`).test(path)
}

function fileFor(urlPath: string): string | null {
  const p = normalize(join(root, decodeURIComponent(urlPath)))
  if (!p.startsWith(root)) return null
  if (existsSync(p) && statSync(p).isFile()) return p
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html')
  return null
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  let path = url.pathname
  let status = 200
  let file = fileFor(path)
  if (!file) {
    const excluded = config.navigationFallback.exclude.some((e) => matches(e, path))
    if (!excluded) {
      path = config.navigationFallback.rewrite
      file = fileFor(path)
    } else {
      const o = config.responseOverrides?.['404']
      status = o?.statusCode ?? 404
      file = o ? fileFor(o.rewrite) : null
      if (o) path = o.rewrite
    }
  }
  const headers: Record<string, string> = { ...config.globalHeaders }
  for (const r of config.routes) if (matches(r.route, url.pathname) || matches(r.route, path)) Object.assign(headers, r.headers)
  if (!file) {
    res.writeHead(404, headers).end('Not found')
    return
  }
  headers['Content-Type'] = types[extname(file)] ?? 'application/octet-stream'
  let body = readFileSync(file)
  if (/^(text\/|application\/(json|manifest))|svg/.test(headers['Content-Type']) && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''))) {
    body = gzipSync(body)
    headers['Content-Encoding'] = 'gzip'
    headers['Vary'] = 'Accept-Encoding'
  }
  res.writeHead(status, headers).end(body)
}).listen(port, () => console.log(`Serving ${root}/ with staticwebapp.config.json on http://localhost:${port}`))
