import type { Graph } from '../data/graph'
import type { Machine, MachineState } from '../data/types'
import { attemptCode, type AnswerEntry, type AttemptKind, type MachineProgress, type Save } from '../save/schema'
import { INSPECTION_SIZE, PLACEMENT_SIZE, STARTUP_SIZE } from './draw'
import { addDays, dayKey, localTimeZone } from './time'

/** Inspections certify at 80% or more (4 of 5). */
export const INSPECTION_PASS = 0.8
/** After this many failed inspections on one machine in a local day, its inspections wait until the next day. */
export const INSPECTION_FAILS_PER_DAY = 2
export const INSPECTION_LOCK_REASON =
  'Two inspections failed today. Inspections for this machine reopen tomorrow, giving you time to study the notes and explanations.'

export function isCertified(save: Save, id: string): boolean {
  return save.machines[id]?.certification !== undefined
}

export function isPlaced(save: Save, id: string): boolean {
  return save.machines[id]?.certification?.kind === 'placement'
}

/**
 * Certified needs a passed test recorded in the save; nothing else certifies.
 * A machine is locked until every prerequisite is certified (by inspection or placement).
 */
export function machineState(id: string, graph: Graph, save: Save): MachineState {
  if (isCertified(save, id)) return 'certified'
  const prereqs = graph.prereqs.get(id) ?? []
  if (!prereqs.every((p) => isCertified(save, p))) return 'locked'
  return save.machines[id]?.startedAt ? 'running' : 'idle'
}

export function allStates(graph: Graph, save: Save): Map<string, MachineState> {
  return new Map(graph.ids.map((id) => [id, machineState(id, graph, save)]))
}

function updateMachine(save: Save, id: string, patch: Partial<MachineProgress>, now: Date): Save {
  return {
    ...save,
    updatedAt: now.toISOString(),
    machines: { ...save.machines, [id]: { ...save.machines[id], ...patch } },
  }
}

/** Opening the machine panel shows its notes; the first time is recorded (needed before the start-up check). */
export function openNotes(save: Save, id: string, now: Date = new Date()): Save {
  if (save.machines[id]?.notesOpenedAt) return save
  return updateMachine(save, id, { notesOpenedAt: now.toISOString() }, now)
}

export type AttemptAvailability = { ok: true } | { ok: false; reason: string }

/** Whether an attempt of this kind may start now. */
export function canAttempt(
  kind: AttemptKind,
  machine: Machine,
  graph: Graph,
  save: Save,
  now: Date = new Date(),
  timeZone: string = localTimeZone(),
): AttemptAvailability {
  const state = machineState(machine.id, graph, save)
  const progress = save.machines[machine.id]
  if (kind === 'startup') {
    if (state !== 'idle') return { ok: false, reason: 'The start-up check is for idle machines.' }
    if (!progress?.notesOpenedAt) return { ok: false, reason: 'Open the notes first.' }
    return { ok: true }
  }
  if (kind === 'inspection') {
    if (state !== 'running') return { ok: false, reason: 'Start the machine first.' }
    const today = dayKey(now, timeZone)
    const failsToday = (progress?.inspectionFails ?? []).filter((d) => d === today).length
    return failsToday >= INSPECTION_FAILS_PER_DAY ? { ok: false, reason: INSPECTION_LOCK_REASON } : { ok: true }
  }
  if (!machine.pl300) return { ok: false, reason: 'Placement checks are only for PL-300 carryover machines.' }
  if (state === 'certified') return { ok: false, reason: 'Already certified.' }
  if (progress?.placementDays?.includes(dayKey(now, timeZone))) {
    return { ok: false, reason: 'One placement attempt per day. Try again tomorrow.' }
  }
  return { ok: true }
}

/**
 * Starting a placement check uses up that machine's attempt for the local day,
 * even if it's closed without submitting, so the pool can't be previewed by
 * opening and closing it. Only this draw can then be submitted, once.
 */
export function beginPlacement(
  save: Save,
  machine: Machine,
  graph: Graph,
  questionIds: string[],
  now: Date = new Date(),
  timeZone: string = localTimeZone(),
): Save {
  if (!canAttempt('placement', machine, graph, save, now, timeZone).ok) return save
  const prev = save.machines[machine.id] ?? {}
  return updateMachine(
    save,
    machine.id,
    {
      placementDays: [...(prev.placementDays ?? []), dayKey(now, timeZone)],
      lastDraw: { ...prev.lastDraw, placement: questionIds },
      placementOpen: questionIds,
    },
    now,
  )
}

const sameIds = (a: string[] | undefined, b: string[]) => !!a && a.length === b.length && a.every((id, i) => id === b[i])

export interface AttemptResult {
  machineId: string
  kind: AttemptKind
  questionIds: string[]
  correct: boolean[]
}

export type AttemptOutcome = 'passed' | 'failed' | 'rejected'

const requiredSize: Record<AttemptKind, number> = { startup: STARTUP_SIZE, inspection: INSPECTION_SIZE, placement: PLACEMENT_SIZE }

export function passes(kind: AttemptKind, correct: boolean[]): boolean {
  const right = correct.filter(Boolean).length
  if (kind === 'inspection') return correct.length === INSPECTION_SIZE && right / correct.length >= INSPECTION_PASS
  // Start-up (2) and placement (5) need every answer right.
  return correct.length === requiredSize[kind] && right === correct.length
}

/**
 * Records a submitted attempt: logs every answer, remembers the draw, and
 * applies the only transitions the game allows. Start-up → running,
 * inspection ≥ 80% → certified, placement 5/5 → certified (placed).
 * An attempt that isn't allowed right now changes nothing.
 */
export function recordAttempt(
  save: Save,
  attempt: AttemptResult,
  machine: Machine,
  graph: Graph,
  now: Date = new Date(),
  timeZone: string = localTimeZone(),
): { save: Save; outcome: AttemptOutcome } {
  if (machine.id !== attempt.machineId || attempt.questionIds.length !== attempt.correct.length) return { save, outcome: 'rejected' }
  const allowed =
    attempt.kind === 'placement'
      ? !!machine.pl300 && !isCertified(save, machine.id) && sameIds(save.machines[machine.id]?.placementOpen, attempt.questionIds)
      : canAttempt(attempt.kind, machine, graph, save, now, timeZone).ok
  if (!allowed) return { save, outcome: 'rejected' }

  const at = Math.floor(now.getTime() / 1000)
  const entries: AnswerEntry[] = attempt.questionIds.map((id, i) => [id, attempt.correct[i] ? 1 : 0, at, attemptCode[attempt.kind]])
  const prev = save.machines[machine.id] ?? {}
  const patch: Partial<MachineProgress> = { lastDraw: { ...prev.lastDraw, [attempt.kind]: attempt.questionIds } }
  if (attempt.kind === 'placement') patch.placementOpen = undefined

  const passed = passes(attempt.kind, attempt.correct)
  if (attempt.kind === 'inspection' && !passed) {
    // Keep only recent days; the lock only ever looks at today.
    const recent = (prev.inspectionFails ?? []).filter((d) => d >= addDays(dayKey(now, timeZone), -7))
    patch.inspectionFails = [...recent, dayKey(now, timeZone)]
  }
  if (passed) {
    const score = attempt.correct.filter(Boolean).length / attempt.correct.length
    if (attempt.kind === 'startup') patch.startedAt = now.toISOString()
    else patch.certification = { passedAt: now.toISOString(), score, kind: attempt.kind === 'placement' ? 'placement' : 'inspection' }
  }
  const next = updateMachine({ ...save, answers: [...save.answers, ...entries] }, machine.id, patch, now)
  return { save: next, outcome: passed ? 'passed' : 'failed' }
}
