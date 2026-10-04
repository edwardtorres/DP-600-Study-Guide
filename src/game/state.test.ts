import { describe, expect, it } from 'vitest'
import { millGraph } from '../data/mill'
import { newSave, type Save } from '../save/schema'
import { allStates, machineState, startMachine } from './state'

const now = new Date('2026-10-04T12:00:00Z')
const certify = (save: Save, id: string): Save => ({
  ...save,
  machines: { ...save.machines, [id]: { certification: { passedAt: now.toISOString(), score: 0.8, kind: 'inspection' } } },
})

describe('machine state', () => {
  it('opens only the starting machine on a new save', () => {
    const states = allStates(millGraph, newSave(now))
    expect([...states].filter(([, s]) => s !== 'locked').map(([id]) => id)).toEqual(['founding-charter'])
  })

  it('moves idle → running when started, and refuses to start locked machines', () => {
    const save = newSave(now)
    expect(startMachine(save, 'water-wheel', millGraph, now)).toBe(save)
    const started = startMachine(save, 'founding-charter', millGraph, now)
    expect(machineState('founding-charter', millGraph, started)).toBe('running')
  })

  it('unlocks a machine only when every prerequisite is certified', () => {
    let save = certify(newSave(now), 'founding-charter')
    save = certify(save, 'water-wheel')
    save = certify(save, 'three-vats')
    expect(machineState('direct-lake-shuttle', millGraph, save)).toBe('locked')
    save = certify(save, 'loom-gearbox')
    expect(machineState('direct-lake-shuttle', millGraph, save)).toBe('locked')
    save = certify(save, 'vat-selector')
    expect(machineState('direct-lake-shuttle', millGraph, save)).toBe('idle')
  })

  it('reports certified only from a recorded passed test', () => {
    const save = startMachine(newSave(now), 'founding-charter', millGraph, now)
    expect(machineState('founding-charter', millGraph, save)).toBe('running')
    expect(machineState('founding-charter', millGraph, certify(save, 'founding-charter'))).toBe('certified')
  })
})
