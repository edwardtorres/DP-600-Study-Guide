import type { Graph } from '../data/graph'
import type { MachineState } from '../data/types'
import type { Save } from '../save/schema'

export function isCertified(save: Save, id: string): boolean {
  return save.machines[id]?.certification !== undefined
}

/**
 * Certified needs a passed test recorded in the save; nothing else certifies.
 * A machine is locked until every prerequisite is certified.
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

/** Idle → running. Returns the same save when the machine cannot start. */
export function startMachine(save: Save, id: string, graph: Graph, now: Date = new Date()): Save {
  if (machineState(id, graph, save) !== 'idle') return save
  const iso = now.toISOString()
  return {
    ...save,
    updatedAt: iso,
    machines: { ...save.machines, [id]: { ...save.machines[id], startedAt: iso } },
  }
}
