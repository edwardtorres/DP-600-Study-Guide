import { puzzleTypeName, type PuzzleMeta } from '../../puzzles/types'

export interface BenchItem {
  meta: PuzzleMeta
  /** Result of the most recent play, if any. */
  last?: boolean
  plays: number
}

/** The machine panel's list of puzzles. Practice only: never certifies. */
export function PuzzleBench({ items, open, onPlay }: { items: BenchItem[]; open: boolean; onPlay: (id: string) => void }) {
  if (items.length === 0) return null
  return (
    <section className="border-t border-mill-700 py-4" data-testid="puzzle-bench">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-mill-400">Puzzle bench</h3>
      <p className="mb-2 text-xs text-mill-400">
        {open ? 'Practice: earns XP and counts toward readiness, but never certifies the machine.' : 'Unlock this machine to use its puzzle bench.'}
      </p>
      <ul className="space-y-1.5">
        {items.map(({ meta, last, plays }) => (
          <li key={meta.id}>
            <button
              type="button"
              disabled={!open}
              onClick={() => onPlay(meta.id)}
              data-puzzle={meta.id}
              className="flex w-full items-center justify-between gap-3 rounded-lg border border-mill-600 bg-mill-900 px-3 py-2 text-left text-sm hover:border-brass-500/70 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-brass-300">
                  {puzzleTypeName[meta.type]} · {'●'.repeat(meta.difficulty)}
                  {'○'.repeat(3 - meta.difficulty)}
                </span>
                <span className="block break-words text-mill-50">{meta.title}</span>
              </span>
              <span className={`shrink-0 text-xs ${last === undefined ? 'text-mill-400' : last ? 'text-emerald-300' : 'text-madder'}`}>
                {last === undefined ? 'New' : `${last ? 'Solved' : 'Missed'} · ${plays} play${plays === 1 ? '' : 's'}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
