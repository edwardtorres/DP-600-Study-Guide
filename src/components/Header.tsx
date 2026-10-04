import { floors } from '../data/floors'
import { outline } from '../data/outline'
import type { Machine, MachineState } from '../data/types'

interface Props {
  machines: Machine[]
  states: Map<string, MachineState>
}

export function Header({ machines, states }: Props) {
  return (
    <header className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-400">DP-600 · Fabric Analytics Engineer</p>
      <h1 className="font-display text-3xl font-bold text-mill-50 sm:text-4xl">Fabric Mill</h1>
      <p className="mt-1 max-w-2xl text-sm text-mill-200">
        Weave raw data threads into finished analytics fabric. Each machine is an exam skill. Certify a machine by passing its
        inspection to unlock the machines it feeds.
      </p>
      <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {floors.map((floor) => {
          const onFloor = machines.filter((m) => m.floor === floor.id)
          const done = onFloor.filter((m) => states.get(m.id) === 'certified').length
          const domain = outline.domains.find((d) => d.id === floor.domain)
          return (
            <li key={floor.id} className="rounded-lg border border-mill-700 bg-mill-900 p-3">
              <p className="truncate text-sm font-semibold text-mill-50">{floor.name}</p>
              <p className="text-xs text-mill-400">{domain ? `${domain.title} · ${domain.weightText}` : 'Orientation'}</p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-mill-700"
                role="progressbar"
                aria-label={`${floor.name} machines certified`}
                aria-valuemin={0}
                aria-valuemax={onFloor.length}
                aria-valuenow={done}
              >
                <div className="h-full bg-brass-400" style={{ width: `${(done / onFloor.length) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-mill-400">
                {done}/{onFloor.length} certified
              </p>
            </li>
          )
        })}
      </ul>
    </header>
  )
}
