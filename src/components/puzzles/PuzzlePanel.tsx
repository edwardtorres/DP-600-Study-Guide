import { useEffect, useRef, useState } from 'react'
import { pairIndex } from '../../content/pairs'
import { initialResponse, isPuzzleComplete, scorePuzzle, type PuzzleResponse, type PuzzleScore } from '../../puzzles/play'
import { puzzleTypeName, type Decision, type PuzzleInstance } from '../../puzzles/types'
import { CloseIcon } from '../icons'
import { DecisionInput } from './DecisionInput'
import { DataTableView, type NullStyle } from './DataTableView'
import { PuzzleContextView } from './PuzzleContextView'

interface Props {
  instance: PuzzleInstance
  onSubmit: (correct: boolean) => void
  onReplay: () => void
  onClose: () => void
  onOpenPair: (machineId: string, pairId: string) => void
}

const groups = (ds: Decision[]) => {
  const out: [string, Decision[]][] = []
  for (const d of ds) {
    const g = d.group ?? ''
    const last = out.at(-1)
    if (last && last[0] === g) last[1].push(d)
    else out.push([g, [d]])
  }
  return out
}

function DecisionResult({ d, given, right, nullStyle }: { d: Decision; given: string | undefined; right: boolean; nullStyle: NullStyle }) {
  const label = (id: string | undefined) => d.choices.find((c) => c.id === id)?.label ?? '—'
  const shown = d.ui === 'toggle' ? d.choices : d.choices.filter((c) => d.accepted.includes(c.id) || c.id === given)
  return (
    <li data-decision-result={d.id} data-correct={right} className={`rounded-md border p-2 text-sm ${right ? 'border-emerald-400/50 bg-emerald-400/5' : 'border-madder/60 bg-madder/10'}`}>
      <p className="text-mill-50">
        <span className={right ? 'text-emerald-300' : 'text-madder'}>{right ? '✓' : '✗'}</span> {d.prompt}
      </p>
      {d.ui === 'toggle' ? (
        <p className="mt-0.5 text-xs text-mill-200">
          <span className="font-semibold">Answer: {label(d.accepted[0])}</span> · you said {label(given)}. {d.explain}
        </p>
      ) : (
        <ul className="mt-1 space-y-1">
          {shown.map((c) => (
            <li key={c.id} className="text-xs text-mill-200">
              <span className="font-semibold text-mill-50">{c.label}</span>
              {d.accepted.includes(c.id) && <span className="ml-2 font-semibold text-emerald-300">Correct answer</span>}
              {c.id === given && <span className={`ml-2 font-semibold ${right ? 'text-emerald-300' : 'text-madder'}`}>Your answer</span>}
              {c.table && (
                <div className="mt-1">
                  <DataTableView table={c.table} nullStyle={nullStyle} caption={false} />
                </div>
              )}
              <span className="mt-0.5 block">{c.explain}</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

/** One puzzle play: setup, decisions, then a per-decision result. Practice only. */
export function PuzzlePanel({ instance, onSubmit, onReplay, onClose, onOpenPair }: Props) {
  const [response, setResponse] = useState<PuzzleResponse>(() => initialResponse(instance))
  const [score, setScore] = useState<PuzzleScore | null>(null)
  const top = useRef<HTMLDivElement>(null)
  useEffect(() => top.current?.focus(), [score])

  const { meta } = instance
  const nullStyle: NullStyle = instance.context.kind === 'oracle' ? instance.context.language : 'plain'
  const complete = isPuzzleComplete(instance, response)
  const answered = instance.decisions.filter((d) => response[d.id] !== undefined).length
  const pair = meta.trapPairId ? pairIndex.get(meta.trapPairId) : undefined
  const sources = [...new Set([...meta.sources, ...instance.decisions.flatMap((d) => d.sources)])]

  const submit = () => {
    const s = scorePuzzle(instance, response)
    setScore(s)
    onSubmit(s.correct)
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="puzzle-title" className="fixed inset-0 z-40 flex justify-center bg-mill-950/85 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-mill-950 sm:rounded-xl sm:border sm:border-mill-600">
        <div className="flex items-start justify-between gap-3 border-b border-mill-700 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brass-400">Puzzle bench · {puzzleTypeName[meta.type]}</p>
            <h2 id="puzzle-title" className="font-display text-xl font-bold text-mill-50">
              {meta.title}
            </h2>
            <p className="text-xs text-mill-400">
              Practice: earns XP and counts toward readiness, never certifies. {instance.decisions.length > 1 ? `Get at least 80% of the ${instance.decisions.length} decisions right.` : 'Get it right.'}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div ref={top} tabIndex={-1} className="flex-1 space-y-4 overflow-y-auto overflow-x-hidden p-4 outline-none" data-testid="puzzle-body" data-puzzle-id={meta.id}>
          {score && (
            <div role="status" className={`rounded-xl border p-4 ${score.correct ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-madder/60 bg-madder/10'}`}>
              <p className="font-display text-2xl font-bold text-mill-50">
                {score.right} of {score.total} right
              </p>
              <p className="mt-1 text-sm text-mill-200">
                {score.correct ? 'Solved. It’s logged as a correct puzzle play and earns XP.' : 'Not solved this time. It’s logged as a miss; review the explanations and play again.'} Puzzles never certify a machine.
              </p>
            </div>
          )}
          <p className="text-[15px] leading-relaxed text-mill-50">{instance.intro}</p>
          <PuzzleContextView context={instance.context} />

          {!score &&
            groups(instance.decisions).map(([g, ds]) => (
              <section key={g || 'decisions'} className="space-y-3">
                {g && <h3 className="text-xs font-semibold uppercase tracking-wider text-mill-400">{g}</h3>}
                {ds.map((d) => (
                  <div key={d.id} data-decision={d.id}>
                    <DecisionInput decision={d} value={response[d.id]} nullStyle={nullStyle} onChange={(v) => setResponse((r) => ({ ...r, [d.id]: v }))} />
                  </div>
                ))}
              </section>
            ))}

          {score && (
            <div className="space-y-3">
              {groups(instance.decisions).map(([g, ds]) => (
                <section key={g || 'decisions'}>
                  {g && <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-mill-400">{g}</h3>}
                  <ul className="space-y-1.5">
                    {ds.map((d) => (
                      <DecisionResult key={d.id} d={d} given={response[d.id]} right={score.results[instance.decisions.indexOf(d)]!} nullStyle={nullStyle} />
                    ))}
                  </ul>
                </section>
              ))}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                <span className="text-mill-400">Learn:</span>
                {sources.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="break-all text-brass-300 hover:underline">
                    {u.replace('https://learn.microsoft.com/en-us/', '')}
                  </a>
                ))}
              </div>
              {pair && meta.trapPairId && (
                <button type="button" onClick={() => onOpenPair(pair.machineId, meta.trapPairId!)} className="text-xs font-semibold text-indigo-200 hover:underline">
                  Don’t confuse: {pair.a} vs {pair.b} →
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mill-700 p-3">
          {!score ? (
            <>
              <span className="text-xs text-mill-400">
                {answered} of {instance.decisions.length} answered
              </span>
              <button
                type="button"
                onClick={submit}
                disabled={!complete}
                className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {complete ? 'Check' : 'Answer every decision to check'}
              </button>
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50">
                Back to the mill
              </button>
              <button type="button" onClick={onReplay} className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300">
                {meta.type === 'oracle' ? 'Play again (new data)' : 'Play again'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
