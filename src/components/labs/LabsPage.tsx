import { useEffect, useRef, useState } from 'react'
import { LABS_PARTIAL } from '../../content/labs'
import type { Lab } from '../../content/labs/types'
import type { Machine } from '../../data/types'
import { isLabComplete, SCHEDULE_BUFFER_DAYS, suggestSchedule, trialClock, TRIAL_DAYS } from '../../game/labs'
import type { Save } from '../../save/schema'
import { CloseIcon } from '../icons'
import { labStatus, minutesText } from './labFormat'
import { PlatformBadge, StatusText } from './labUi'
import { LabView } from './LabView'

const TRIAL = 'https://learn.microsoft.com/en-us/fabric/fundamentals/fabric-trial'

interface Props {
  labs: Lab[]
  save: Save
  today: string
  machinesById: Map<string, Machine>
  labId: string | null
  onOpenLab: (labId: string | null) => void
  onTrialStart: (day: string | undefined) => void
  onToggleStep: (labId: string, stepId: string, done: boolean) => void
  onProblem: (labId: string, stepId: string, text: string) => void
  onComplete: (labId: string) => void
  onDebrief: (labId: string) => void
  onExport: () => void
  onOpenPair: (machineId: string, pairId: string) => void
  onOpenMachine: (machineId: string) => void
  onClose: () => void
}

const shortDate = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

function TrialClock({ save, today, labs, onTrialStart }: Pick<Props, 'save' | 'today' | 'labs' | 'onTrialStart'>) {
  const [draft, setDraft] = useState(save.trialStart ?? '')
  const remaining = labs.filter((l) => !isLabComplete(save, l.id))
  const clock = save.trialStart ? trialClock(save.trialStart, today) : null
  const sched = save.trialStart ? suggestSchedule(remaining, save.trialStart, today) : null
  const remainingMinutes = remaining.reduce((t, l) => t + l.minutes, 0)
  const byId = new Map(labs.map((l) => [l.id, l]))
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(draft) && draft <= today

  return (
    <section className="rounded-xl border border-mill-600 bg-mill-900 p-4" data-testid="trial-clock">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-mill-400">Trial clock</h3>
      <form
        className="mt-2 flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) onTrialStart(draft)
        }}
      >
        <label className="text-sm text-mill-200">
          Trial start date
          <input
            type="date"
            value={draft}
            max={today}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1 block rounded-lg border border-mill-600 bg-mill-950 px-2 py-1.5 text-mill-50"
          />
        </label>
        <button type="submit" disabled={!valid} className="rounded-lg bg-brass-400 px-3 py-1.5 text-sm font-semibold text-mill-950 hover:bg-brass-300 disabled:opacity-40">
          Save date
        </button>
        {save.trialStart && (
          <button
            type="button"
            onClick={() => {
              setDraft('')
              onTrialStart(undefined)
            }}
            className="rounded-lg border border-mill-600 px-3 py-1.5 text-sm text-mill-200"
          >
            Clear
          </button>
        )}
      </form>
      {!clock && <p className="mt-2 text-xs text-mill-400">Enter the day your Fabric trial started (the Account manager shows it). The clock and schedule use your device’s calendar days.</p>}
      {clock && sched && (
        <div className="mt-3">
          <p className="font-display text-2xl font-bold text-mill-50" data-testid="days-left">
            {clock.ended ? 'Trial ended' : `${clock.daysLeft} of ${TRIAL_DAYS} days left`}
          </p>
          <p className="text-xs text-mill-400">
            Day {Math.max(1, clock.day)} · last day {shortDate(clock.lastDay)} · {remaining.length} lab{remaining.length === 1 ? '' : 's'} left (about {minutesText(remainingMinutes)})
          </p>
          {remaining.length > 0 && !clock.ended && (
            <>
              <h4 className="mt-3 text-xs font-semibold uppercase tracking-wider text-mill-400">
                Suggested schedule (finish by {shortDate(sched.finishBy)}, {SCHEDULE_BUFFER_DAYS} days before the end)
              </h4>
              {sched.tight && <p className="mt-1 text-xs text-madder">There isn’t room before the buffer, so every remaining lab is suggested for today. Prioritise the labs for skills you find hardest.</p>}
              <ol className="mt-2 space-y-1 text-sm" data-testid="schedule">
                {sched.items.map((it) => (
                  <li key={it.labId} className="flex gap-3">
                    <span className="w-28 shrink-0 text-mill-400">{it.day === today ? 'Today' : shortDate(it.day)}</span>
                    <span className="min-w-0 break-words text-mill-50">
                      Lab {byId.get(it.labId)?.order}: {byId.get(it.labId)?.title}
                    </span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
    </section>
  )
}

export function LabsPage(props: Props) {
  const { labs, save, labId, onOpenLab, onExport, onClose } = props
  const lab = labId ? labs.find((l) => l.id === labId) : undefined
  const byId = new Map(labs.map((l) => [l.id, l]))
  const totalMinutes = labs.reduce((t, l) => t + l.minutes, 0)
  const body = useRef<HTMLDivElement>(null)
  // Block body on purpose: newer browsers return a Promise from scrollTo(), and an effect must not return one.
  useEffect(() => {
    body.current?.scrollTo?.({ top: 0 })
  }, [labId])

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="labs-title" className="fixed inset-0 z-30 flex justify-center bg-mill-950/85 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-mill-950 sm:rounded-xl sm:border sm:border-mill-600">
        <div className="flex items-center justify-between gap-3 border-b border-mill-700 p-4">
          <div className="min-w-0">
            <h2 id="labs-title" className="font-display text-xl font-bold text-mill-50">
              Workshop labs
            </h2>
            <p className="text-xs text-mill-400">
              {labs.length} hands-on labs in a Fabric trial, about {minutesText(totalMinutes)} in all.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" onClick={onExport} className="rounded-lg border border-brass-500/70 px-3 py-1.5 text-sm text-brass-300 hover:bg-brass-500/15">
              Export lab notes
            </button>
            <button type="button" onClick={onClose} aria-label="Close labs" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>

        <div ref={body} className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          {lab ? (
            <>
              <button type="button" onClick={() => onOpenLab(null)} className="mb-3 text-sm font-semibold text-brass-300 hover:underline">
                ← All labs
              </button>
              <LabView
                lab={lab}
                progress={save.labs[lab.id]}
                labsById={byId}
                machinesById={props.machinesById}
                openPrereqs={lab.prereqs.filter((p) => !isLabComplete(save, p))}
                onToggleStep={(s, d) => props.onToggleStep(lab.id, s, d)}
                onProblem={(s, t) => props.onProblem(lab.id, s, t)}
                onComplete={() => props.onComplete(lab.id)}
                onDebrief={() => props.onDebrief(lab.id)}
                onOpenLab={(id) => onOpenLab(id)}
                onOpenPair={props.onOpenPair}
                onOpenMachine={props.onOpenMachine}
              />
            </>
          ) : (
            <div className="space-y-4">
              <section className="rounded-xl border border-weld/50 bg-weld/10 p-4 text-sm text-mill-50" data-testid="before-you-start">
                <h3 className="font-semibold text-weld">Before you start</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>A Fabric trial lasts 60 days, and Microsoft doesn’t guarantee you a second one.</li>
                  <li>When it ends, Fabric items other than Power BI items become inactive unless the workspace moves to a paid capacity.</li>
                  <li>The trial doesn’t include Copilot, data agents, or AI functions, so no lab uses them.</li>
                  <li>No lab needs a paid Azure resource. Steps marked Windows need Power BI Desktop.</li>
                  <li>These labs haven’t been run end to end yet. If a step doesn’t match your screen, use “Report a problem”, then export your notes.</li>
                  <li>Never type tenant names, workspace URLs, connection strings, tokens, or emails into a note. Notes stay on this device and in your save export.</li>
                </ul>
                <a href={`${TRIAL}#whats-includedand-whats-not`} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs text-brass-300 hover:underline">
                  Learn · Fabric trial ↗
                </a>
              </section>
              <TrialClock save={save} today={props.today} labs={labs} onTrialStart={props.onTrialStart} />
              <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">All labs, in recommended order</h3>
                <ol className="space-y-2">
                  {labs.map((l) => {
                    const st = labStatus(l, save.labs[l.id])
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() => onOpenLab(l.id)}
                          data-lab={l.id}
                          className="w-full rounded-lg border border-mill-600 bg-mill-900 px-3 py-2 text-left text-sm hover:border-brass-500/70"
                        >
                          <span className="flex flex-wrap items-center gap-2 text-[11px] text-mill-400">
                            <span className="font-mono font-semibold text-brass-300">Lab {l.order}</span>
                            <PlatformBadge platform={l.platform} />
                            <span>{minutesText(l.minutes)}</span>
                            {l.prereqs.length > 0 && <span>after {l.prereqs.map((p) => `Lab ${byId.get(p)?.order}`).join(', ')}</span>}
                            <span className="ml-auto">
                              <StatusText status={st} />
                              {st.problems > 0 && <span className="ml-2 text-madder">{st.problems} problem note{st.problems === 1 ? '' : 's'}</span>}
                            </span>
                          </span>
                          <span className="mt-0.5 block break-words text-mill-50">{l.title}</span>
                          {l.bulletIds.length > 0 && <span className="block font-mono text-[11px] text-mill-400">{l.bulletIds.join(' · ')}</span>}
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </section>
              <section className="text-xs text-mill-400">
                <h3 className="mb-1 font-semibold uppercase tracking-wider">Covered only in part</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {Object.entries(LABS_PARTIAL).map(([b, why]) => (
                    <li key={b}>
                      <span className="font-mono">{b}</span>: {why}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
