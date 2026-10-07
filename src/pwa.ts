/**
 * Service worker registration and the "new version available" signal (Step 9; adapted from the AZ-900 study app).
 * Production builds only (never the dev server or tests). A new deploy installs in the background
 * and WAITS; the UI shows a prompt, and only when the player taps Reload does the new version take over.
 */
type Listener = () => void
let waiting: ServiceWorker | null = null
const listeners = new Set<Listener>()
const notify = () => listeners.forEach((l) => l())

export function subscribeUpdate(l: Listener): () => void {
  listeners.add(l)
  return () => listeners.delete(l)
}
export const isUpdateReady = (): boolean => waiting !== null

/** Tells the waiting version to take over, then reloads once it does. */
export function applyUpdate(): void {
  if (!waiting) return
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloaded) return
    reloaded = true
    window.location.reload()
  })
  waiting.postMessage('SKIP_WAITING')
}

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .then((reg) => {
        const track = (sw: ServiceWorker | null) => {
          if (!sw) return
          const check = () => {
            // "installed" with an existing controller = an update waiting (the first install has no controller).
            if (sw.state === 'installed' && navigator.serviceWorker.controller) {
              waiting = sw
              notify()
            }
          }
          check()
          sw.addEventListener('statechange', check)
        }
        track(reg.waiting)
        reg.addEventListener('updatefound', () => track(reg.installing))
        // Look for a new deploy when the app comes back to the foreground, and every 30 minutes.
        const update = () => reg.update().catch(() => {})
        document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && update())
        setInterval(update, 30 * 60_000)
      })
      .catch(() => {
        // No service worker (e.g. private mode): the app still works online.
      })
  })
}

// ── Install (Step 9) ─────────────────────────────────────────────────
/** The browser's install prompt event (Chromium browsers; Safari has none, so iPhone users follow the Share steps). */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}
let installEvent: InstallPromptEvent | null = null
const installListeners = new Set<Listener>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    installEvent = e as InstallPromptEvent
    installListeners.forEach((l) => l())
  })
  window.addEventListener('appinstalled', () => {
    installEvent = null
    installListeners.forEach((l) => l())
  })
}

export const canPromptInstall = (): boolean => installEvent !== null
export function subscribeInstall(l: Listener): () => void {
  installListeners.add(l)
  return () => installListeners.delete(l)
}
export async function promptInstall(): Promise<boolean> {
  if (!installEvent) return false
  await installEvent.prompt()
  const { outcome } = await installEvent.userChoice
  installEvent = null
  installListeners.forEach((l) => l())
  return outcome === 'accepted'
}
/** True when running as an installed app (home screen or desktop install). */
export const isInstalled = (): boolean =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true)
