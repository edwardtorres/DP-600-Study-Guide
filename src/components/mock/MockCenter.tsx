import { useState } from 'react'
import type { CaseStudy, Question } from '../../content/questions/types'
import { outline } from '../../data/outline'
import { FRESH_MIN, MOCK_MINUTES, MOCK_SIZE, READY_DOMAIN, READY_OVERALL, RECENT_DAYS, readyStatus, remainingMs, scoreMock } from '../../game/mock'
import type { Save } from '../../save/schema'
import { CloseIcon } from '../icons'
import { MockResults } from './MockResults'

export const PRACTICE_URL =
  'https://learn.microsoft.com/en-us/credentials/certifications/fabric-analytics-engineer-associate/practice/assessment?assessment-type=practice&assessmentId=90&practice-assessment-type=certification'

interface Props {
  save: Save
  questions: Map<string, Question>
  cases: CaseStudy[]
  /** A record to show first (for example, the mock just finished). */
  showId: string | null
  /** True when every case study has been used, so the next mock repeats one. */
  nextRepeatsCase: boolean
  now: number
  onStart: () => void
  onResume: () => void
  onOpenPair: (machineId: string, pairId: string) => void
  onClose: () => void
}

const pct = (x: number) => `${Math.round(x * 100)}%`

/** Mock exam home: start or resume, the ready-to-book signal, results, and the history of every mock. */
export function MockCenter({ save, questions, cases, showId, nextRepeatsCase, now, onStart, onResume, onOpenPair, onClose }: Props) {
  const [selected, setSelected] = useState<string | null>(showId)
  const record = selected ? save.mocks.find((m) => m.id === selected) : undefined
  const status = readyStatus(save.mocks, questions, outline)
  const ready = status.ready
  const company = (id: string) => cases.find((c) => c.id === id)?.company ?? id
  const active = save.activeMock

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mockcenter-title" className="fixed inset-0 z-30 flex justify-center bg-mill-950/85 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-mill-950 sm:rounded-xl sm:border sm:border-mill-600">
        <div className="flex items-center justify-between border-b border-mill-700 p-4">
          <h2 id="mockcenter-title" className="font-display text-xl font-bold text-mill-50">
            {record ? 'Mock exam results' : 'Mock exam'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close mock exam" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {record ? (
            <>
              <button type="button" onClick={() => setSelected(null)} className="mb-3 text-sm font-semibold text-brass-300 hover:underline">
                ← All mocks
              </button>
              <MockResults record={record} questions={questions} onOpenPair={onOpenPair} />
            </>
          ) : (
            <div className="space-y-5 text-sm">
              <section className="rounded-xl border border-mill-600 bg-mill-900 p-4">
                <p className="text-mill-200">
                  About {MOCK_SIZE} questions in {MOCK_MINUTES} minutes: one case study you haven’t seen in a mock (its own section, locked once you leave it), then questions drawn by the official domain weights, avoiding your
                  last mock and preferring questions you haven’t seen recently. Mark questions for review and check them before you submit. No feedback until the end. Answers count toward readiness and earn XP, but never
                  certify a machine.
                </p>
                <p className="mt-2 text-xs text-mill-400">
                  Microsoft gives 100 minutes for DP-600 and says most exams have 40–60 questions; it doesn’t publish a DP-600 question count.
                </p>
                {active ? (
                  <button type="button" onClick={onResume} className="mt-3 rounded-lg bg-brass-400 px-4 py-2 font-semibold text-mill-950 hover:bg-brass-300">
                    Resume mock ({Math.ceil(remainingMs(active, new Date(now)) / 60000)} min left)
                  </button>
                ) : (
                  <>
                    <button type="button" onClick={onStart} className="mt-3 rounded-lg bg-brass-400 px-4 py-2 font-semibold text-mill-950 hover:bg-brass-300">
                      Start a mock exam
                    </button>
                    {nextRepeatsCase && <p className="mt-2 text-xs text-weld">You’ve seen every case study in a mock, so the next one repeats the case you saw longest ago.</p>}
                  </>
                )}
              </section>

              <section className={`rounded-xl border p-4 ${ready ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-mill-700'}`} data-testid="ready-to-book">
                <p className="font-semibold text-mill-50">{ready ? 'Ready to book' : 'Not ready to book yet'}</p>
                <p className="mt-1 text-xs text-mill-200">
                  Shown after your two most recent full mocks that count each score at least {pct(READY_OVERALL)} overall, with every domain at least {pct(READY_DOMAIN)}. A mock counts only if at least {pct(FRESH_MIN)} of its
                  main-section questions were fresh (not answered in the {RECENT_DAYS} days before it started). These are raw percentages, not Microsoft’s scaled score.
                </p>
                {status.stale.length > 0 && (
                  <ul className="mt-2 space-y-1 text-xs text-weld" data-testid="stale-mocks">
                    {status.stale.map((m) => (
                      <li key={m.id}>
                        The mock from {new Date(m.finishedAt).toLocaleDateString()} doesn’t count: {m.reason}.
                      </li>
                    ))}
                  </ul>
                )}
                <a href={PRACTICE_URL} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-brass-300 hover:underline">
                  Check yourself with Microsoft’s free DP-600 practice assessment ↗
                </a>
              </section>

              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">History</h3>
                {save.mocks.length === 0 ? (
                  <p className="text-mill-400">No mocks yet.</p>
                ) : (
                  <ul className="space-y-2" data-testid="mock-history">
                    {[...save.mocks].reverse().map((m) => {
                      const s = scoreMock(m, questions, outline)
                      return (
                        <li key={m.id}>
                          <button type="button" onClick={() => setSelected(m.id)} className="w-full rounded-lg border border-mill-600 bg-mill-900 px-3 py-2 text-left hover:border-brass-500/70" data-mock={m.id}>
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-semibold text-mill-50">
                                {pct(s.overall.pct)}
                                {m.short ? ' (short)' : ''}
                                <span className="ml-2 text-xs font-normal text-mill-400">fresh {pct(m.freshness)}</span>
                                {!m.short && m.freshness < FRESH_MIN && <span className="ml-2 rounded bg-weld/15 px-1.5 py-0.5 text-xs font-normal text-weld">doesn’t count</span>}
                              </span>
                              <span className="text-xs text-mill-400">{new Date(m.finishedAt).toLocaleString()}</span>
                            </span>
                            <span className="mt-0.5 block text-xs text-mill-200">
                              {outline.domains.map((d) => `${d.title.split(' ')[0]} ${s.byDomain.get(d.id) ? pct(s.byDomain.get(d.id)!.pct) : '—'}`).join(' · ')} · case: {company(m.caseStudyId)}
                              {m.timedOut ? ' · time ran out' : ''}
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
