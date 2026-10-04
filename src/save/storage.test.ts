import { describe, expect, it } from 'vitest'
import type { Migration } from './migrations'
import { runMigrations } from './migrations'
import { BACKUP_KEY, SAVE_KEY, SAVE_VERSION, newSave } from './schema'
import { loadSave, writeSave, type StorageLike } from './storage'

function memory(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
}

const now = new Date('2026-10-04T12:00:00Z')

describe('save system', () => {
  it('starts a fresh version-1 save when nothing is stored', () => {
    const r = loadSave({ storage: memory(), now })
    expect(r.status).toBe('new')
    expect(r.save).toEqual(newSave(now))
    expect(SAVE_VERSION).toBe(1)
  })

  it('round-trips a save', () => {
    const storage = memory()
    const save = { ...newSave(now), machines: { 'water-wheel': { startedAt: now.toISOString() } } }
    expect(writeSave(save, storage)).toBe(true)
    expect(loadSave({ storage })).toEqual({ status: 'loaded', save })
  })

  it('backs up and replaces a corrupt save', () => {
    const storage = memory({ [SAVE_KEY]: '{not json' })
    const r = loadSave({ storage, now })
    expect(r.status).toBe('recovered')
    expect(storage.data[BACKUP_KEY]).toBe('{not json')
    expect(r.save).toEqual(newSave(now))
  })

  it('rejects a save that fails validation, such as a certification with no score', () => {
    const bad = { ...newSave(now), machines: { 'water-wheel': { certification: { passedAt: now.toISOString(), kind: 'inspection' } } } }
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(bad) }) })
    expect(r.status).toBe('recovered')
  })

  it('rejects a save from a newer app version', () => {
    const future = { ...newSave(now), version: 99 }
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(future) }) })
    expect(r.status === 'recovered' && r.error).toMatch(/newer/)
  })

  it('drops progress for machines that no longer exist', () => {
    const save = { ...newSave(now), machines: { gone: { startedAt: now.toISOString() }, 'water-wheel': {} } }
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(save) }), knownMachineIds: ['water-wheel'] })
    expect(Object.keys(r.save.machines)).toEqual(['water-wheel'])
  })

  it('runs a migration chain up to the current version', () => {
    const v0toV1: Migration = {
      from: 0,
      migrate: (old) => ({
        createdAt: old.created,
        updatedAt: old.created,
        machines: Object.fromEntries((old.started as string[]).map((id) => [id, { startedAt: old.created }])),
        settings: {},
      }),
    }
    const v0 = { version: 0, created: now.toISOString(), started: ['water-wheel'] }
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(v0) }), migrations: [v0toV1] })
    expect(r).toEqual({
      status: 'loaded',
      migratedFrom: 0,
      save: { version: 1, createdAt: v0.created, updatedAt: v0.created, machines: { 'water-wheel': { startedAt: v0.created } }, settings: {} },
    })
    expect(() => runMigrations({ version: 0 }, 1, [])).toThrow(/No migration/)
  })

  it('works when storage is unavailable', () => {
    expect(loadSave({ storage: null, now }).status).toBe('new')
    expect(writeSave(newSave(now), null)).toBe(false)
  })
})
