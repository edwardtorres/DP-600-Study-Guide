import type { Machine } from '../../data/types'
import { DAILY_CAP, INTERVALS, MAINT_THRESHOLD, type DailyQueue, type Maintenance } from '../../game/review'
import { CloseIcon } from '../icons'

interface Props {
  queue: DailyQueue
  maintenance: { machine: Machine; status: Maintenance }[]
  onStart: () => void
  onMaintenance: (machineId: string) => void
  onClose: () => void
}

/** Daily review: what's due today (capped), how the intervals work, and machines that need maintenance. */
export function ReviewPage({ queue, maintenance, onStart, onMaintenance, onClose }: Props) {
  const size = queue.due.length + queue.topUp.length
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="review-title" className="fixed inset-0 z-30 flex items-start justify-center bg-mill-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-xl border border-mill-600 bg-mill-900">
        <div className="flex items-center justify-between border-b border-mill-700 p-4">
          <h2 id="review-title" className="font-display text-xl font-bold text-mill-50">
            Daily review
          </h2>
          <button type="button" onClick={onClose} aria-label="Close daily review" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-4 text-sm">
          <section className="rounded-lg border border-mill-700 bg-mill-950/60 p-3" data-testid="review-summary">
            <p className="font-display text-2xl font-bold text-mill-50" data-testid="due-count">
              {queue.dueCount} due
            </p>
            <p className="text-xs text-mill-400">
              Reviewed today: {queue.answeredToday} of {DAILY_CAP} · {queue.remaining} left today
            </p>
            {size > 0 ? (
              <>
                <p className="mt-2 text-mill-200">
                  Today’s session: {queue.due.length} due{queue.topUp.length > 0 ? ` + ${queue.topUp.length} from your weakest skills` : ''}.
                </p>
                <button type="button" onClick={onStart} className="mt-3 rounded-lg bg-brass-400 px-4 py-2 font-semibold text-mill-950 hover:bg-brass-300">
                  Start review ({size} {size === 1 ? 'question' : 'questions'})
                </button>
              </>
            ) : (
              <p className="mt-2 text-mill-200">{queue.remaining === 0 ? 'You’ve reached today’s review cap. Come back tomorrow.' : 'Nothing to review yet. Answer some questions first.'}</p>
            )}
          </section>
          <section>
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-mill-400">How it works</h3>
            <p className="text-mill-200">
              Every question you answer is scheduled. A miss comes back the next day; each correct answer in a row pushes it out further: {INTERVALS.join(', ')} days. At most {DAILY_CAP} review answers a day; if
              fewer are due, the rest come from your weakest skills. Reviews count toward readiness and earn XP, but never certify a machine.
            </p>
          </section>
          <section data-testid="maintenance-list">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wider text-mill-400">Machines that need maintenance</h3>
            {maintenance.length === 0 ? (
              <p className="text-mill-400">None. A certified machine needs maintenance when your recent review or mock accuracy on it falls below {Math.round(MAINT_THRESHOLD * 100)}%.</p>
            ) : (
              <ul className="space-y-2">
                {maintenance.map(({ machine, status }) => (
                  <li key={machine.id} className="flex items-center justify-between gap-3 rounded-lg border border-madder/50 bg-madder/10 p-2">
                    <span className="min-w-0">
                      <span className="block font-semibold text-mill-50">{machine.themedName}</span>
                      <span className="text-xs text-mill-400">
                        {Math.round((status.accuracy ?? 0) * 100)}% on the last {status.answers} review or mock answers
                      </span>
                    </span>
                    <button type="button" onClick={() => onMaintenance(machine.id)} className="shrink-0 rounded-lg border border-madder/70 px-3 py-1.5 text-xs font-semibold text-mill-50 hover:bg-madder/20">
                      Review set
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
