import type { Machine, MachineState } from '../data/types'
import { CARD_H, CARD_W } from '../game/layout'
import { GearIcon, IdleIcon, LockIcon, SealIcon } from './icons'
import { stateCard, stateLabel } from './stateStyles'
import { Tags } from './Tags'

interface Props {
  machine: Machine
  state: MachineState
  x: number
  y: number
  selected: boolean
  placed?: boolean
  onSelect: (id: string) => void
}

function StateIcon({ state }: { state: MachineState }) {
  const cls = 'size-5 shrink-0'
  if (state === 'locked') return <LockIcon className={cls} />
  if (state === 'running') return <GearIcon className={`${cls} text-indigo-thread motion-safe:animate-spin-slow`} />
  if (state === 'certified') return <SealIcon className={`${cls} text-brass-300`} />
  return <IdleIcon className={`${cls} text-brass-400`} />
}

export function MachineNode({ machine, state, x, y, selected, placed = false, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(machine.id)}
      aria-pressed={selected}
      aria-label={`${machine.themedName}: ${machine.skillName}. ${stateLabel[state]}${placed ? ' (placed)' : ''}.`}
      data-state={state}
      data-placed={placed || undefined}
      className={`absolute flex flex-col gap-1 rounded-lg border-2 p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brass-300 ${stateCard[state]} ${selected ? 'ring-2 ring-mill-50' : ''}`}
      style={{ left: x, top: y, width: CARD_W, height: CARD_H }}
    >
      <span className="flex items-start gap-2">
        <StateIcon state={state} />
        <span className="min-w-0">
          <span className="block truncate font-display text-[15px] font-semibold leading-tight">{machine.themedName}</span>
          <span className="line-clamp-2 text-[11px] leading-snug opacity-80">{machine.skillName}</span>
        </span>
      </span>
      <span className="mt-auto flex flex-wrap gap-1">
        {placed && <span className="rounded bg-weld px-1.5 py-px text-[10px] font-semibold uppercase text-mill-950">Placed</span>}
        <Tags machine={machine} />
      </span>
    </button>
  )
}
