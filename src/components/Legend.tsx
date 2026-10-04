import type { MachineState } from '../data/types'
import { stateBadge, stateLabel } from './stateStyles'

const meaning: Record<MachineState, string> = {
  locked: 'a prerequisite is not certified yet',
  idle: 'ready to start',
  running: 'you are studying it',
  certified: 'inspection passed',
}

export function Legend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mill-400">
      {(Object.keys(meaning) as MachineState[]).map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className={`rounded px-1.5 py-px font-semibold uppercase ${stateBadge[s]}`}>{stateLabel[s]}</span>
          {meaning[s]}
        </span>
      ))}
      <span className="flex items-center gap-1.5">
        <svg width="28" height="6" aria-hidden="true"><path d="M0 3h28" stroke="var(--color-mill-600)" strokeWidth="2" strokeDasharray="5 5" /></svg>
        thread not spun
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="28" height="6" aria-hidden="true"><path d="M0 3h28" stroke="var(--color-brass-400)" strokeWidth="2" /></svg>
        prerequisite certified
      </span>
    </div>
  )
}
