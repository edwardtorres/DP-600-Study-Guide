import type { Edge, MachineState } from '../data/types'
import { threadPath, type MillLayout } from '../game/layout'

interface Props {
  edges: Edge[]
  layout: MillLayout
  states: Map<string, MachineState>
  selectedId: string | null
}

export function Threads({ edges, layout, states, selectedId }: Props) {
  return (
    <svg className="pointer-events-none absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
      {edges.map((e) => {
        const a = layout.nodes.get(e.from)
        const b = layout.nodes.get(e.to)
        if (!a || !b) return null
        const spun = states.get(e.from) === 'certified'
        const active = selectedId !== null && (e.from === selectedId || e.to === selectedId)
        const dim = selectedId !== null && !active
        return (
          <path
            key={`${e.from}->${e.to}`}
            data-thread={`${e.from}->${e.to}`}
            d={threadPath(a, b)}
            fill="none"
            stroke={active ? 'var(--color-indigo-thread)' : spun ? 'var(--color-brass-400)' : 'var(--color-mill-600)'}
            strokeWidth={active ? 3 : 2}
            strokeDasharray={spun || active ? undefined : '5 5'}
            opacity={dim ? 0.25 : 0.9}
          />
        )
      })}
    </svg>
  )
}
