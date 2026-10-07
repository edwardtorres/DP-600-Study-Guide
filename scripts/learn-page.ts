/**
 * Fetches a cited page and reads what the fact-check and freshness scripts need:
 * the HTTP status, the final URL after redirects, the page's "Last updated on"
 * date, and the main article as plain text. Used by check-freshness.ts and the
 * Step 8 snapshot.
 */

export interface LearnPage {
  url: string
  status: number
  finalUrl: string
  /** ISO day (YYYY-MM-DD) of the page's last update, or null when the page publishes none. */
  updated: string | null
  title: string
  text: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" }

export function decodeEntities(s: string): string {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e: string) => {
    if (e[0] === '#') {
      const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
      return Number.isFinite(n) ? String.fromCodePoint(n) : m
    }
    return ENTITIES[e.toLowerCase()] ?? m
  })
}

/**
 * The page's last-updated day. Learn pages show "Last updated on" in a
 * <local-time datetime="…"> element and also carry <meta name="ms.date">.
 */
export function lastUpdated(html: string): string | null {
  const shown = /Last updated on\s*<local-time[^>]*datetime="([^"]+)"/i.exec(html)
  const meta = /<meta\s+name="ms\.date"\s+content="([^"]+)"/i.exec(html)
  const raw = shown?.[1] ?? meta?.[1]
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) {
    // ms.date is sometimes written as MM/DD/YYYY.
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim())
    return m ? `${m[3]}-${m[1]!.padStart(2, '0')}-${m[2]!.padStart(2, '0')}` : null
  }
  return d.toISOString().slice(0, 10)
}

/** The main article as plain text, one block per line. */
export function articleText(html: string): string {
  const main = /<main[\s\S]*?<\/main>/i.exec(html)?.[0] ?? /<body[\s\S]*<\/body>/i.exec(html)?.[0] ?? html
  const text = main
    .replace(/<(script|style|nav|svg|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6]|tr|pre|table|section|blockquote|dt|dd)>/gi, '\n')
    .replace(/<(td|th)[^>]*>/gi, ' | ')
    .replace(/<[^>]+>/g, '')
  return decodeEntities(text)
    .split('\n')
    .map((l) => l.replace(/[ \t ]+/g, ' ').trim())
    .filter((l) => l.length > 0)
    .join('\n')
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * fetch() that backs off when Learn rate-limits (429) or is briefly unavailable (503): it waits for
 * Retry-After when given, otherwise 2, 4, 8, 16, 32 s, then returns the last response. Learn
 * rate-limits bursts from shared runners such as GitHub Actions.
 */
export async function fetchPolitely(url: string, retries = 5): Promise<Response> {
  for (let i = 0; ; i++) {
    const res = await fetch(url, { redirect: 'follow' })
    if ((res.status !== 429 && res.status !== 503) || i >= retries) return res
    const after = Number(res.headers.get('retry-after'))
    await res.body?.cancel()
    await sleep(Number.isFinite(after) && after > 0 ? Math.min(after, 120) * 1000 : 2000 * 2 ** i)
  }
}

export async function fetchLearnPage(url: string, attempts = 3): Promise<LearnPage> {
  let lastErr: unknown
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetchPolitely(url)
      const html = res.status === 200 ? await res.text() : ''
      const title = decodeEntities(/<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? '')
      return { url, status: res.status, finalUrl: res.url || url, updated: html ? lastUpdated(html) : null, title, text: html ? articleText(html) : '' }
    } catch (err) {
      lastErr = err
      await sleep(1000 * 2 ** i)
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}
