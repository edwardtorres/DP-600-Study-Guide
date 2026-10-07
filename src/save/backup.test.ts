import { describe, expect, it } from 'vitest'
import { newSave } from './schema'
import { backupDue, readBackupMeta, recordExport, requestPersistence, snooze } from './backup'

const now = new Date('2026-10-20T12:00:00Z')
const day = 86_400_000
const withProgress = { ...newSave(now), answers: [['FO-01', 1, 1, 's']] as [string, 0 | 1, number, 's'][] }

describe('backup reminder', () => {
  it('needs progress', () => {
    expect(backupDue(newSave(now), {}, now)).toBe(false)
    expect(backupDue(withProgress, {}, now)).toBe(true)
  })
  it('shows again 7 days after the last export', () => {
    const meta = recordExport({}, new Date(now.getTime() - 6 * day))
    expect(backupDue(withProgress, meta, now)).toBe(false)
    expect(backupDue(withProgress, recordExport({}, new Date(now.getTime() - 7 * day)), now)).toBe(true)
  })
  it('Later hides it for a day', () => {
    const meta = snooze({}, now)
    expect(backupDue(withProgress, meta, new Date(now.getTime() + 23 * 3_600_000))).toBe(false)
    expect(backupDue(withProgress, meta, new Date(now.getTime() + 25 * 3_600_000))).toBe(true)
  })
  it('reads bad metadata as empty', () => {
    expect(readBackupMeta({ getItem: () => 'not json' })).toEqual({})
    expect(readBackupMeta({ getItem: () => '{"lastExportAt":5}' })).toEqual({})
  })
})

describe('storage persistence', () => {
  it('reports unsupported, persistent, and not persistent', async () => {
    expect(await requestPersistence(undefined)).toBe('unsupported')
    expect(await requestPersistence({ storage: {} as StorageManager })).toBe('unsupported')
    const make = (persisted: boolean, grant: boolean) => ({ storage: { persisted: async () => persisted, persist: async () => grant } as unknown as StorageManager })
    expect(await requestPersistence(make(true, false))).toBe('persistent')
    expect(await requestPersistence(make(false, true))).toBe('persistent')
    expect(await requestPersistence(make(false, false))).toBe('not-persistent')
  })
})
