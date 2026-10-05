import { describe, expect, it } from 'vitest'
import type { Migration } from './migrations'
import { migrations, runMigrations } from './migrations'
import v1Fixture from './fixtures/save-v1.json'
import v2Fixture from './fixtures/save-v2.json'
import v3Fixture from './fixtures/save-v3.json'
import { BACKUP_KEY, SAVE_KEY, SAVE_VERSION, isSaveV1, isSaveV2, isSaveV3, isSaveV4, newSave } from './schema'
import { backupSave, exportSave, importSave, loadSave, writeSave, type StorageLike } from './storage'

function memory(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return { data, getItem: (k) => data[k] ?? null, setItem: (k, v) => void (data[k] = v) }
}

const now = new Date('2026-10-04T12:00:00Z')

describe('save system', () => {
  it('starts a fresh version-4 save when nothing is stored', () => {
    const r = loadSave({ storage: memory(), now })
    expect(r.status).toBe('new')
    expect(r.save).toEqual(newSave(now))
    expect(SAVE_VERSION).toBe(4)
    expect(r.save.answers).toEqual([])
  })

  it('migrates a real version-1 save to version 4 and keeps its progress', () => {
    expect(isSaveV1(v1Fixture)).toBe(true)
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(v1Fixture) }), knownMachineIds: ['founding-charter', 'water-wheel'] })
    expect(r.status).toBe('loaded')
    if (r.status !== 'loaded') return
    expect(r.migratedFrom).toBe(1)
    expect(isSaveV4(r.save)).toBe(true)
    expect(r.save.version).toBe(4)
    expect(r.save.labs).toEqual({})
    expect(r.save.createdAt).toBe(v1Fixture.createdAt)
    expect(r.save.machines['founding-charter']).toEqual({ startedAt: '2026-10-01T08:20:00.000Z' })
    expect(r.save.answers).toEqual([])
  })

  it('migrates a real version-3 save (captured from the Step 5 app) to version 4, adding an empty lab log', () => {
    expect(isSaveV3(v3Fixture)).toBe(true)
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(v3Fixture) }), knownMachineIds: Object.keys(v3Fixture.machines) })
    expect(r.status).toBe('loaded')
    if (r.status !== 'loaded') return
    expect(r.migratedFrom).toBe(3)
    expect(isSaveV4(r.save)).toBe(true)
    expect(r.save).toEqual({ ...v3Fixture, version: 4, labs: {} })
    expect(r.save.answers.some((a) => a[3] === 'z')).toBe(true)
    expect(r.save.machines['water-wheel']?.inspectionFails?.length).toBeGreaterThan(0)
  })

  it('migrates a real version-2 save (captured from the Step 4 app) to version 4', () => {
    expect(isSaveV2(v2Fixture)).toBe(true)
    const ids = Object.keys(v2Fixture.machines)
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(v2Fixture) }), knownMachineIds: ids })
    expect(r.status).toBe('loaded')
    if (r.status !== 'loaded') return
    expect(r.migratedFrom).toBe(2)
    expect(isSaveV4(r.save)).toBe(true)
    expect(r.save).toEqual({ ...v2Fixture, version: 4, labs: {} })
    expect(r.save.answers.length).toBeGreaterThan(0)
    expect(r.save.machines['founding-charter']?.certification?.kind).toBe('inspection')
  })

  it('validates the answer log and new machine fields', () => {
    const good = {
      ...newSave(now),
      machines: { 'water-wheel': { notesOpenedAt: now.toISOString(), lastDraw: { inspection: ['FO-04'] }, placementDays: ['2026-10-04'] } },
      answers: [['FO-04', 1, 1759579200, 'i']],
    }
    expect(isSaveV4(good)).toBe(true)
    expect(isSaveV4({ ...good, answers: [['QO-T01', 1, 1759579200, 'z']] })).toBe(true)
    expect(isSaveV4({ ...good, machines: { 'water-wheel': { inspectionFails: ['2026-10-04', '2026-10-04'] } } })).toBe(true)
    expect(isSaveV4({ ...good, answers: [['FO-04', 2, 1, 'i']] })).toBe(false)
    expect(isSaveV4({ ...good, answers: [['FO-04', 1, 1, 'x']] })).toBe(false)
    expect(isSaveV4({ ...good, machines: { 'water-wheel': { placementDays: ['4 Oct'] } } })).toBe(false)
    expect(isSaveV4({ ...good, machines: { 'water-wheel': { inspectionFails: ['today'] } } })).toBe(false)
    expect(isSaveV4({ ...good, machines: { 'water-wheel': { lastDraw: { review: [] } } } })).toBe(false)
    expect(isSaveV4({ ...good, answers: [['FO-04', 1, 1759579200, 'l']] })).toBe(true)
    expect(isSaveV4({ ...good, labs: { L01: { steps: { s1: true }, problems: { s2: 'Button moved' }, completedAt: now.toISOString() } }, trialStart: '2026-10-01' })).toBe(true)
    expect(isSaveV4({ ...good, labs: { L01: { steps: { s1: 'yes' }, problems: {} } } })).toBe(false)
    expect(isSaveV4({ ...good, labs: { L01: { steps: {}, problems: { s1: 'x'.repeat(2001) } } } })).toBe(false)
    expect(isSaveV4({ ...good, trialStart: 'next week' })).toBe(false)
    expect(isSaveV3({ ...good, version: 3, answers: [['FO-04', 1, 1, 'l']] })).toBe(false)
    // A v2 save can't hold puzzle plays.
    expect(isSaveV2({ ...good, version: 2, answers: [['QO-T01', 1, 1, 'z']] })).toBe(false)
  })

  it('imports a valid save file, migrating older versions, and rejects bad files without side effects', () => {
    const save = { ...newSave(now), answers: [['FO-01', 1, 1759579200, 's']] as [string, 0 | 1, number, 's'][] }
    expect(importSave(exportSave(save))).toEqual({ ok: true, save })
    const fromV1 = importSave(JSON.stringify(v1Fixture))
    expect(fromV1.ok && fromV1.migratedFrom).toBe(1)
    expect(importSave('not json')).toEqual({ ok: false, error: 'The file is not valid JSON' })
    expect(importSave('[]')).toEqual({ ok: false, error: 'Save is not an object' })
    expect(importSave(JSON.stringify({ ...save, answers: 'nope' }))).toEqual({ ok: false, error: 'Save failed validation' })
  })

  it('backs up the current save before a reset', () => {
    const storage = memory({ [SAVE_KEY]: '{"version":2}' })
    backupSave(storage)
    expect(storage.data[BACKUP_KEY]).toBe('{"version":2}')
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
    const r = loadSave({ storage: memory({ [SAVE_KEY]: JSON.stringify(v0) }), migrations: [v0toV1, ...migrations] })
    expect(r).toEqual({
      status: 'loaded',
      migratedFrom: 0,
      save: { version: 4, labs: {}, createdAt: v0.created, updatedAt: v0.created, machines: { 'water-wheel': { startedAt: v0.created } }, settings: {}, answers: [] },
    })
    expect(() => runMigrations({ version: 0 }, 1, [])).toThrow(/No migration/)
  })

  it('works when storage is unavailable', () => {
    expect(loadSave({ storage: null, now }).status).toBe('new')
    expect(writeSave(newSave(now), null)).toBe(false)
  })
})
