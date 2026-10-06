import { pairIndex } from '../../content/pairs'
import { findBullet } from '../../data/outline'
import { WEAK_MIN_ANSWERS, WEAK_WINDOW, type BulletScore, type TrapMiss } from '../../game/weak'
import { CloseIcon } from '../icons'

export interface WeakLinks {
  machineId: string
  machineName: string
  puzzleId?: string
  /** False when the machine is locked, so its puzzle bench is closed. */
  puzzleOpen: boolean
  labId?: string
  labTitle?: string
}

interface Props {
  ranked: BulletScore[]
  notEnoughData: BulletScore[]
  traps: TrapMiss[]
  linksFor: (bulletId: string) => WeakLinks | undefined
  onNotes: (machineId: string) => void
  onPuzzle: (puzzleId: string) => void
  onLab: (labId: string) => void
  onPair: (machineId: string, pairId: string) => void
  onClose: () => void
}

const pct = (s: BulletScore) => `${Math.round((s.accuracy ?? 0) * 100)}%`

/** Bullets ranked by recent accuracy, the "don't confuse" pairs missed most, and where to practise each weak bullet. */
export function WeakSpots({ ranked, notEnoughData, traps, linksFor, onNotes, onPuzzle, onLab, onPair, onClose }: Props) {
  const link = 'rounded border border-mill-600 px-2 py-1 text-xs text-mill-50 hover:border-brass-400 disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="weak-title" className="fixed inset-0 z-30 flex justify-center bg-mill-950/85 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-mill-950 sm:rounded-xl sm:border sm:border-mill-600">
        <div className="flex items-center justify-between border-b border-mill-700 p-4">
          <div>
            <h2 id="weak-title" className="font-display text-xl font-bold text-mill-50">
              Weak Spots
            </h2>
            <p className="text-xs text-mill-400">
              Accuracy on each exam skill’s last {WEAK_WINDOW} inspection, placement, debrief, review, and mock answers.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Weak Spots" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden p-4 text-sm">
          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">Skills, weakest first</h3>
            {ranked.length === 0 ? (
              <p className="text-mill-400">No skill has {WEAK_MIN_ANSWERS} answers yet. Take inspections, reviews, or a mock to fill this in.</p>
            ) : (
              <ol className="space-y-2" data-testid="weak-ranked">
                {ranked.map((s) => {
                  const b = findBullet(s.bulletId)
                  const l = linksFor(s.bulletId)
                  return (
                    <li key={s.bulletId} className="rounded-lg border border-mill-700 bg-mill-900 p-3" data-bullet={s.bulletId}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="min-w-0 text-mill-50">
                          <span className="mr-2 font-mono text-xs text-brass-300">{s.bulletId}</span>
                          {b?.bullet.text}
                        </p>
                        <p className="shrink-0 text-right">
                          <span className={`font-display text-lg font-bold ${(s.accuracy ?? 0) < 0.6 ? 'text-madder' : (s.accuracy ?? 0) < 0.8 ? 'text-weld' : 'text-emerald-300'}`}>{pct(s)}</span>
                          <span className="block text-[11px] text-mill-400">
                            {s.correct}/{s.answers} answers
                          </span>
                        </p>
                      </div>
                      {l && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button type="button" className={link} onClick={() => onNotes(l.machineId)}>
                            Notes: {l.machineName}
                          </button>
                          {l.puzzleId && (
                            <button type="button" className={link} disabled={!l.puzzleOpen} onClick={() => onPuzzle(l.puzzleId!)} title={l.puzzleOpen ? undefined : 'Unlock the machine to use its puzzle bench'}>
                              Puzzle
                            </button>
                          )}
                          {l.labId && (
                            <button type="button" className={link} onClick={() => onLab(l.labId!)}>
                              Lab: {l.labTitle}
                            </button>
                          )}
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
          <section data-testid="trap-misses">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">“Don’t confuse” pairs you miss most</h3>
            {traps.length === 0 ? (
              <p className="text-mill-400">No misses on trap questions yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {traps.map((t) => {
                  const p = pairIndex.get(t.pairId)
                  if (!p) return null
                  return (
                    <li key={t.pairId}>
                      <button type="button" onClick={() => onPair(p.machineId, t.pairId)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-weld/40 bg-weld/10 px-3 py-2 text-left hover:border-weld">
                        <span className="min-w-0 text-mill-50">
                          {p.a} vs {p.b}
                        </span>
                        <span className="shrink-0 text-xs text-weld">
                          missed {t.misses} of {t.of}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
          {notEnoughData.length > 0 && (
            <section>
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-mill-400">Not enough data yet (fewer than {WEAK_MIN_ANSWERS} answers)</h3>
              <p className="font-mono text-xs text-mill-400">{notEnoughData.map((s) => `${s.bulletId} (${s.answers})`).join(' · ')}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
