import type { Save } from './schema'
import { SAVE_KEY } from './schema'
import { exportSave } from './storage'

/**
 * Save protection (Step 9): download helpers, the "back up your save" reminder,
 * and storage persistence. The reminder's bookkeeping is a per-device
 * convenience, so it lives in its own key rather than in the versioned save.
 */
export const BACKUP_META_KEY = 'fabric-mill:backup'
/** Remind when there's progress and no export in this many days. */
export const BACKUP_REMINDER_DAYS = 7
/** "Later" hides the reminder for this long. */
export const SNOOZE_HOURS = 24

export interface BackupMeta {
  lastExportAt?: string
  snoozeUntil?: string
}

const DAY = 86_400_000

export function readBackupMeta(storage: Pick<Storage, 'getItem'> | null = local()): BackupMeta {
  try {
    const raw = storage?.getItem(BACKUP_META_KEY)
    const v = raw ? (JSON.parse(raw) as unknown) : null
    if (!v || typeof v !== 'object') return {}
    const o = v as Record<string, unknown>
    return {
      ...(typeof o.lastExportAt === 'string' ? { lastExportAt: o.lastExportAt } : {}),
      ...(typeof o.snoozeUntil === 'string' ? { snoozeUntil: o.snoozeUntil } : {}),
    }
  } catch {
    return {}
  }
}

export function writeBackupMeta(meta: BackupMeta, storage: Pick<Storage, 'setItem'> | null = local()): void {
  try {
    storage?.setItem(BACKUP_META_KEY, JSON.stringify(meta))
  } catch {
    // Storage unavailable: the reminder simply shows again next time.
  }
}

/** True when the save holds progress worth losing. */
export function hasProgress(save: Save): boolean {
  return save.answers.length > 0 || Object.keys(save.machines).length > 0 || Object.keys(save.labs).length > 0 || save.mocks.length > 0
}

/** Show the reminder when there's progress, no export in the last 7 days, and it isn't snoozed. */
export function backupDue(save: Save, meta: BackupMeta, now: Date = new Date()): boolean {
  if (!hasProgress(save)) return false
  if (meta.snoozeUntil && Date.parse(meta.snoozeUntil) > now.getTime()) return false
  if (!meta.lastExportAt) return true
  return now.getTime() - Date.parse(meta.lastExportAt) >= BACKUP_REMINDER_DAYS * DAY
}

export const recordExport = (_meta: BackupMeta, now: Date = new Date()): BackupMeta => ({ lastExportAt: now.toISOString() })
export const snooze = (meta: BackupMeta, now: Date = new Date()): BackupMeta => ({ ...meta, snoozeUntil: new Date(now.getTime() + SNOOZE_HOURS * 3_600_000).toISOString() })

export function downloadText(text: string, fileName: string, type = 'application/json'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const saveFileName = (now: Date = new Date()) => `fabric-mill-save-${now.toISOString().slice(0, 10)}.json`

/** Downloads the save and records the export for the reminder. */
export function exportSaveFile(save: Save, now: Date = new Date()): void {
  downloadText(exportSave(save), saveFileName(now))
  writeBackupMeta(recordExport(readBackupMeta(), now))
}

/** Last-resort export used by the crash screen: the raw stored text, whatever state the app is in. */
export function exportRawSave(): boolean {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY)
    if (!raw) return false
    downloadText(raw, saveFileName())
    return true
  } catch {
    return false
  }
}

export type PersistStatus = 'persistent' | 'not-persistent' | 'unsupported'

/** Asks the browser to keep this site's storage (not evicted under pressure). Safe to call more than once. */
export async function requestPersistence(nav: Pick<Navigator, 'storage'> | undefined = typeof navigator !== 'undefined' ? navigator : undefined): Promise<PersistStatus> {
  const storage = nav?.storage
  if (!storage || typeof storage.persist !== 'function') return 'unsupported'
  try {
    if (typeof storage.persisted === 'function' && (await storage.persisted())) return 'persistent'
    return (await storage.persist()) ? 'persistent' : 'not-persistent'
  } catch {
    return 'not-persistent'
  }
}

function local(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}
