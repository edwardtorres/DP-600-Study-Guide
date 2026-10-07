import type { PuzzleContext } from '../../puzzles/types'
import { CodeBlock } from '../code/CodeBlock'
import { DataTableView } from './DataTableView'

/** The puzzle's setup: input tables and query, a list of facts, or an item graph. */
export function PuzzleContextView({ context }: { context: PuzzleContext }) {
  if (context.kind === 'oracle') {
    return (
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {context.tables.map((t) => (
            <DataTableView key={t.name} table={t} nullStyle={context.language} />
          ))}
        </div>
        <CodeBlock code={context.query} language={context.language} />
      </div>
    )
  }
  if (context.kind === 'facts') {
    return (
      <div className="space-y-3">
        {context.facts.length > 0 && (
          <dl className="grid gap-x-3 gap-y-1 rounded-lg border border-mill-700 bg-mill-900 p-3 text-sm sm:grid-cols-[max-content_1fr]">
            {context.facts.map((f, i) => (
              <div key={i} className="contents">
                <dt className="font-semibold text-brass-300">{f.label}</dt>
                <dd className="mb-1 break-words text-mill-50 sm:mb-0">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {context.tables?.map((t) => <DataTableView key={t.name} table={t} />)}
      </div>
    )
  }
  const label = (id: string) => context.nodes.find((n) => n.id === id)?.label ?? id
  const workspaces = [...new Set(context.nodes.map((n) => n.workspace))]
  return (
    <div className="space-y-3" data-testid="item-graph">
      <div className="grid gap-2 sm:grid-cols-2">
        {workspaces.map((w) => (
          <div key={w} className="rounded-lg border border-mill-700 bg-mill-900 p-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-mill-400">Workspace: {w}</p>
            <ul className="mt-1 space-y-1">
              {context.nodes
                .filter((n) => n.workspace === w)
                .map((n) => (
                  <li key={n.id} className={`rounded px-2 py-1 text-sm ${n.id === context.changed ? 'bg-madder/20 font-semibold text-mill-50' : 'text-mill-200'}`}>
                    {n.label} <span className="text-xs text-mill-400">· {n.itemType}</span>
                    {n.id === context.changed && <span className="ml-1 text-xs font-semibold text-mill-50">(changing)</span>}
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-mill-700 bg-mill-900 p-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-mill-400">Connections (upstream → downstream)</p>
        <ul className="mt-1 space-y-0.5 text-sm text-mill-200">
          {context.edges.map(([a, b]) => (
            <li key={`${a}-${b}`}>
              {label(a)} <span className="text-brass-300">→</span> {label(b)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
