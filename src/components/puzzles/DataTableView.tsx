import type { Cell, DataTable } from '../../puzzles/types'

export type NullStyle = 'tsql' | 'kql' | 'dax' | 'plain'
const nullText: Record<NullStyle, string> = { tsql: 'NULL', kql: 'null', dax: '(blank)', plain: '—' }

/** A small table that scrolls inside its own box, so the page never scrolls sideways. */
export function DataTableView({ table, nullStyle = 'plain', caption = true }: { table: DataTable; nullStyle?: NullStyle; caption?: boolean }) {
  const show = (c: Cell) => (c === null ? <span className="italic text-mill-400">{nullText[nullStyle]}</span> : String(c))
  return (
    <div className="max-w-full overflow-x-auto rounded-md border border-mill-700" data-testid="data-table">
      <table className="w-full border-collapse text-left font-mono text-xs">
        {caption && <caption className="border-b border-mill-700 bg-mill-900 px-2 py-1 text-left font-sans text-[11px] font-semibold text-mill-200">{table.name}</caption>}
        <thead>
          <tr className="bg-mill-900">
            {table.columns.map((c) => (
              <th key={c} scope="col" className="whitespace-nowrap border-b border-mill-700 px-2 py-1 font-semibold text-brass-300">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.length === 0 && (
            <tr>
              <td colSpan={table.columns.length} className="px-2 py-1 italic text-mill-400">
                (no rows)
              </td>
            </tr>
          )}
          {table.rows.map((r, i) => (
            <tr key={i} className="odd:bg-mill-950 even:bg-mill-900/60">
              {r.map((c, j) => (
                <td key={j} className="whitespace-nowrap px-2 py-0.5 text-mill-50">
                  {show(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
