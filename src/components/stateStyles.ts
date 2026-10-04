import type { MachineState } from '../data/types'

export const stateLabel: Record<MachineState, string> = {
  locked: 'Locked',
  idle: 'Idle',
  running: 'Running',
  certified: 'Certified',
}

export const stateCard: Record<MachineState, string> = {
  locked: 'border-mill-700 bg-mill-900 text-mill-400',
  idle: 'border-brass-500/70 bg-mill-800 text-mill-50 hover:border-brass-300',
  running: 'border-indigo-thread bg-mill-800 text-mill-50 shadow-[0_0_0_3px_rgb(111_134_214/0.25)]',
  certified: 'border-brass-300 bg-gradient-to-br from-brass-500/30 to-mill-800 text-mill-50',
}

export const stateBadge: Record<MachineState, string> = {
  locked: 'bg-mill-700 text-mill-400',
  idle: 'bg-brass-500/20 text-brass-300',
  running: 'bg-indigo-thread/25 text-indigo-200',
  certified: 'bg-brass-400 text-mill-950',
}
