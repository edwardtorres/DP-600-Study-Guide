import { migrations as defaultMigrations, runMigrations, type Migration } from './migrations'
import { BACKUP_KEY, SAVE_KEY, SAVE_VERSION, isSaveV1, newSave, type Save } from './schema'

export interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

export type LoadResult =
  | { status: 'new'; save: Save }
  | { status: 'loaded'; save: Save; migratedFrom?: number }
  | { status: 'recovered'; save: Save; error: string }

function safeStorage(): StorageLike | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

/**
 * Reads, migrates, and validates the save. A save that cannot be read is
 * copied to BACKUP_KEY (never silently thrown away) and a fresh save starts.
 */
export function loadSave(
  options: {
    storage?: StorageLike | null
    knownMachineIds?: Iterable<string>
    migrations?: Migration[]
    now?: Date
  } = {},
): LoadResult {
  const storage = options.storage === undefined ? safeStorage() : options.storage
  const now = options.now ?? new Date()
  let raw: string | null = null
  try {
    raw = storage?.getItem(SAVE_KEY) ?? null
  } catch {
    raw = null
  }
  if (raw === null) return { status: 'new', save: newSave(now) }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('Save is not an object')
    const fromVersion = (parsed as Record<string, unknown>).version
    const migrated = runMigrations(parsed as Record<string, unknown>, SAVE_VERSION, options.migrations ?? defaultMigrations)
    if (!isSaveV1(migrated)) throw new Error('Save failed validation')
    const save = pruneUnknownMachines(migrated, options.knownMachineIds)
    return fromVersion === SAVE_VERSION
      ? { status: 'loaded', save }
      : { status: 'loaded', save, migratedFrom: fromVersion as number }
  } catch (err) {
    try {
      storage?.setItem(BACKUP_KEY, raw)
    } catch {
      // Storage is full or blocked; nothing more we can do.
    }
    return { status: 'recovered', save: newSave(now), error: err instanceof Error ? err.message : String(err) }
  }
}

function pruneUnknownMachines(save: Save, known?: Iterable<string>): Save {
  if (!known) return save
  const ids = new Set(known)
  const machines = Object.fromEntries(Object.entries(save.machines).filter(([id]) => ids.has(id)))
  return { ...save, machines }
}

export function writeSave(save: Save, storage: StorageLike | null = safeStorage()): boolean {
  try {
    storage?.setItem(SAVE_KEY, JSON.stringify(save))
    return storage !== null
  } catch {
    return false
  }
}
