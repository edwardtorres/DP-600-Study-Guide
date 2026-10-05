import { describe, expect, it } from 'vitest'
import { machineById } from '../data/machines'
import { millGraph } from '../data/mill'
import { newSave, type Save } from '../save/schema'
import { allStates, canAttempt, isPlaced, machineState, openNotes, passes, recordAttempt } from './state'

const tz = 'America/Los_Angeles'
const now = new Date('2026-10-04T19:00:00Z') // 12:00 in Los Angeles
const m = (id: string) => machineById.get(id)!
const certify = (save: Save, id: string): Save => ({
  ...save,
  machines: { ...save.machines, [id]: { certification: { passedAt: now.toISOString(), score: 0.8, kind: 'inspection' } } },
})
const attempt = (machineId: string, kind: 'startup' | 'inspection' | 'placement', correct: boolean[]) => ({
  machineId,
  kind,
  questionIds: correct.map((_, i) => `Q-${i}`),
  correct,
})

describe('machine lifecycle', () => {
  it('opens only the starting machine on a new save', () => {
    const states = allStates(millGraph, newSave(now))
    expect([...states].filter(([, s]) => s !== 'locked').map(([id]) => id)).toEqual(['founding-charter'])
  })

  it('unlocks a machine only when every prerequisite is certified, and propagates down the graph', () => {
    let save = certify(newSave(now), 'founding-charter')
    save = certify(save, 'water-wheel')
    save = certify(save, 'three-vats')
    expect(machineState('direct-lake-shuttle', millGraph, save)).toBe('locked')
    save = certify(save, 'loom-gearbox')
    expect(machineState('direct-lake-shuttle', millGraph, save)).toBe('locked')
    save = certify(save, 'vat-selector')
    expect(machineState('direct-lake-shuttle', millGraph, save)).toBe('idle')
  })

  it('idle → running needs the notes opened and a 2/2 start-up check', () => {
    const fc = m('founding-charter')
    let save = newSave(now)
    expect(canAttempt('startup', fc, millGraph, save, now, tz)).toEqual({ ok: false, reason: 'Open the notes first.' })
    expect(recordAttempt(save, attempt(fc.id, 'startup', [true, true]), fc, millGraph, now, tz).outcome).toBe('rejected')
    save = openNotes(save, fc.id, now)
    const failed = recordAttempt(save, attempt(fc.id, 'startup', [true, false]), fc, millGraph, now, tz)
    expect(failed.outcome).toBe('failed')
    expect(machineState(fc.id, millGraph, failed.save)).toBe('idle')
    expect(failed.save.answers).toHaveLength(2)
    const passed = recordAttempt(failed.save, attempt(fc.id, 'startup', [true, true]), fc, millGraph, now, tz)
    expect(passed.outcome).toBe('passed')
    expect(machineState(fc.id, millGraph, passed.save)).toBe('running')
    expect(passed.save.machines[fc.id]?.lastDraw?.startup).toEqual(['Q-0', 'Q-1'])
  })

  it('running → certified needs at least 4 of 5 in an inspection', () => {
    const fc = m('founding-charter')
    let save = openNotes(newSave(now), fc.id, now)
    expect(recordAttempt(save, attempt(fc.id, 'inspection', [true, true, true, true, true]), fc, millGraph, now, tz).outcome).toBe('rejected')
    save = recordAttempt(save, attempt(fc.id, 'startup', [true, true]), fc, millGraph, now, tz).save
    const three = recordAttempt(save, attempt(fc.id, 'inspection', [true, true, true, false, false]), fc, millGraph, now, tz)
    expect(three.outcome).toBe('failed')
    expect(machineState(fc.id, millGraph, three.save)).toBe('running')
    const four = recordAttempt(three.save, attempt(fc.id, 'inspection', [true, true, false, true, true]), fc, millGraph, now, tz)
    expect(four.outcome).toBe('passed')
    expect(machineState(fc.id, millGraph, four.save)).toBe('certified')
    expect(four.save.machines[fc.id]?.certification).toMatchObject({ kind: 'inspection', score: 0.8 })
    expect(machineState('water-wheel', millGraph, four.save)).toBe('idle')
  })

  it('placement: carryover only, even while locked, 5/5 required, unlocks dependents, marks placed', () => {
    const dax = m('dax-scale')
    const save = newSave(now)
    expect(machineState(dax.id, millGraph, save)).toBe('locked')
    expect(canAttempt('placement', m('bale-catalog'), millGraph, save, now, tz).ok).toBe(false)
    const fail = recordAttempt(save, attempt(dax.id, 'placement', [true, true, true, true, false]), dax, millGraph, now, tz)
    expect(fail.outcome).toBe('failed')
    expect(machineState(dax.id, millGraph, fail.save)).toBe('locked')

    const pass = recordAttempt(save, attempt(dax.id, 'placement', [true, true, true, true, true]), dax, millGraph, now, tz)
    expect(pass.outcome).toBe('passed')
    expect(machineState(dax.id, millGraph, pass.save)).toBe('certified')
    expect(isPlaced(pass.save, dax.id)).toBe(true)
    // A placed machine counts as certified for its dependents' prerequisites.
    for (const next of millGraph.unlocks.get(dax.id) ?? []) {
      const others = (millGraph.prereqs.get(next) ?? []).filter((p) => p !== dax.id)
      const all = others.reduce((s, p) => certify(s, p), pass.save)
      expect(machineState(next, millGraph, all)).not.toBe('locked')
    }
  })

  it('allows one placement attempt per machine per local day', () => {
    const dax = m('dax-scale')
    const first = recordAttempt(newSave(now), attempt(dax.id, 'placement', [false, true, true, true, true]), dax, millGraph, now, tz)
    expect(first.save.machines[dax.id]?.placementDays).toEqual(['2026-10-04'])
    expect(canAttempt('placement', dax, millGraph, first.save, now, tz)).toMatchObject({ ok: false })
    // 23:59 local the same day: still blocked.
    const lateSameDay = new Date('2026-10-05T06:59:00Z')
    expect(canAttempt('placement', dax, millGraph, first.save, lateSameDay, tz).ok).toBe(false)
    expect(recordAttempt(first.save, attempt(dax.id, 'placement', [true, true, true, true, true]), dax, millGraph, lateSameDay, tz).outcome).toBe('rejected')
    // 00:01 local the next day: allowed.
    const nextDay = new Date('2026-10-05T07:01:00Z')
    expect(canAttempt('placement', dax, millGraph, first.save, nextDay, tz).ok).toBe(true)
    // Another carryover machine isn't affected.
    expect(canAttempt('placement', m('loom-gearbox'), millGraph, first.save, now, tz).ok).toBe(true)
  })

  it('certification only comes from passed tests', () => {
    expect(passes('inspection', [true, true, true, true, false])).toBe(true)
    expect(passes('inspection', [true, true, true, false, false])).toBe(false)
    expect(passes('inspection', [true, true, true, true])).toBe(false)
    expect(passes('placement', [true, true, true, true, false])).toBe(false)
    expect(passes('startup', [true])).toBe(false)
    const save = openNotes(newSave(now), 'founding-charter', now)
    expect(machineState('founding-charter', millGraph, save)).toBe('idle')
  })
})
