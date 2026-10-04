import { useMemo } from 'react'
import { floors } from '../data/floors'
import type { Graph } from '../data/graph'
import type { Edge, Machine, MachineState } from '../data/types'
import { LEFT_PAD, layoutMill } from '../game/layout'
import { MachineNode } from './MachineNode'
import { Threads } from './Threads'

interface Props {
  machines: Machine[]
  edges: Edge[]
  graph: Graph
  states: Map<string, MachineState>
  selectedId: string | null
  onSelect: (id: string) => void
}

const bandTint: Record<string, string> = {
  orientation: 'bg-mill-900/60',
  prepare: 'bg-[#2a1f1a]/70',
  semantic: 'bg-[#1d2030]/70',
  maintain: 'bg-[#22261d]/70',
}

export function MillMap({ machines, edges, graph, states, selectedId, onSelect }: Props) {
  const layout = useMemo(() => layoutMill(machines, graph), [machines, graph])

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-mill-700 bg-mill-950">
      <div className="relative min-w-full" style={{ width: layout.width, height: layout.height }}>
        {layout.bands.map((band) => {
          const floor = floors.find((f) => f.id === band.floor)!
          return (
            <section
              key={band.floor}
              aria-label={floor.name}
              className={`absolute inset-x-0 border-b border-mill-700/70 ${bandTint[band.floor]}`}
              style={{ top: band.y, height: band.height }}
            >
              <h2 className="sticky left-0 inline-block px-6 pt-3 font-display text-sm font-semibold tracking-wide text-brass-300" style={{ paddingLeft: LEFT_PAD }}>
                {floor.name}
                <span className="ml-2 font-sans text-xs font-normal text-mill-400">{floor.blurb}</span>
              </h2>
            </section>
          )
        })}
        <Threads edges={edges} layout={layout} states={states} selectedId={selectedId} />
        {machines.map((m) => {
          const pos = layout.nodes.get(m.id)!
          return (
            <MachineNode
              key={m.id}
              machine={m}
              state={states.get(m.id) ?? 'locked'}
              x={pos.x}
              y={pos.y}
              selected={selectedId === m.id}
              onSelect={onSelect}
            />
          )
        })}
      </div>
    </div>
  )
}
