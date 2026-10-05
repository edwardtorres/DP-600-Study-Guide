import { useEffect, useRef, useState } from 'react'
import { pairIndex } from '../../content/pairs'
import type { Lab, LabStep } from '../../content/labs/types'
import type { Machine } from '../../data/types'
import { LAB_XP } from '../../game/labs'
import { MAX_PROBLEM_NOTE, type LabProgress } from '../../save/schema'
import { labStatus, minutesText, platformHint, sourceLabel } from './labFormat'
import { PlatformBadge } from './labUi'

interface Props {
  lab: Lab
  progress: LabProgress | undefined
  labsById: Map<string, Lab>
  machinesById: Map<string, Machine>
  /** Labs this one needs that aren't complete yet. */
  openPrereqs: string[]
  onToggleStep: (stepId: string, done: boolean) => void
  onProblem: (stepId: string, text: string) => void
  onComplete: () => void
  onDebrief: () => void
  onOpenLab: (labId: string) => void
  onOpenPair: (machineId: string, pairId: string) => void
  onOpenMachine: (machineId: string) => void
}

function ProblemNote({ id, saved, onSave }: { id: string; saved: string | undefined; onSave: (text: string) => void }) {
  const [open, setOpen] = useState(!!saved)
  const [text, setText] = useState(saved ?? '')
  const [status, setStatus] = useState<'saved' | 'dirty' | null>(saved ? 'saved' : null)
  const commit = () => {
    onSave(text)
    setStatus(text.trim() ? 'saved' : null)
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-madder hover:underline">
        Report a problem with this step
      </button>
    )
  }
  return (
    <div className="mt-2">
      <label htmlFor={`problem-${id}`} className="block text-xs font-semibold text-mill-200">
        What didn’t match? <span className="font-normal text-mill-400">(no tenant names, URLs, emails, or tokens)</span>
      </label>
      <textarea
        id={`problem-${id}`}
        value={text}
        maxLength={MAX_PROBLEM_NOTE}
        rows={3}
        onChange={(e) => {
          setText(e.target.value)
          setStatus('dirty')
        }}
        onBlur={commit}
        className="mt-1 w-full rounded-lg border border-mill-600 bg-mill-950 p-2 text-sm text-mill-50 focus:border-brass-400 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button type="button" onClick={commit} className="rounded border border-mill-600 px-2 py-1 text-xs text-mill-50 hover:border-brass-400">
          Save note
        </button>
        <span className="text-[11px] text-mill-400" aria-live="polite">
          {status === 'saved' ? 'Saved on this device' : status === 'dirty' ? 'Not saved yet' : ''}
        </span>
      </div>
    </div>
  )
}

function StepItem({ lab, step, n, prefix, progress, onToggleStep, onProblem, onOpenPair }: { lab: Lab; step: LabStep; n: number; prefix: string } & Pick<Props, 'progress' | 'onToggleStep' | 'onProblem' | 'onOpenPair'>) {
  const done = !!progress?.steps[step.id]
  const pair = step.trapPairId ? pairIndex.get(step.trapPairId) : undefined
  const label = `${prefix} ${n}`
  return (
    <li className={`rounded-lg border p-3 ${done ? 'border-emerald-400/40 bg-emerald-400/5' : 'border-mill-700 bg-mill-900'}`} data-step={step.id}>
      <div className="flex items-start gap-3">
        <input
          id={`step-${lab.id}-${step.id}`}
          type="checkbox"
          checked={done}
          onChange={(e) => onToggleStep(step.id, e.target.checked)}
          className="mt-1 size-5 shrink-0 accent-brass-400"
        />
        <div className="min-w-0 flex-1">
          <label htmlFor={`step-${lab.id}-${step.id}`} className="block text-sm text-mill-50">
            <span className="mr-1 font-semibold text-brass-300">{label}.</span>
            {step.optional && <span className="mr-1 rounded bg-mill-700 px-1 text-[10px] font-semibold uppercase text-mill-200">Optional</span>}
            {step.windows && <span className="mr-1 rounded bg-indigo-thread/20 px-1 text-[10px] font-semibold uppercase text-indigo-200">Windows</span>}
            {step.text}
          </label>
          {step.checkpoint && (
            <p className="mt-1 text-xs text-mill-200">
              <span className="font-semibold text-emerald-300">Check:</span> {step.checkpoint}
            </p>
          )}
          {step.cost && (
            <p className="mt-1 rounded border border-madder/50 bg-madder/10 p-2 text-xs text-mill-50">
              <span className="font-semibold">Cost warning:</span> {step.cost}
            </p>
          )}
          {pair && (
            <div className="mt-2 rounded border border-weld/50 bg-weld/10 p-2 text-xs text-mill-50" data-testid="trap-callout">
              <p>
                <span className="font-semibold text-weld">Trap you’ll see:</span> {pair.a} vs {pair.b}. {step.trapNote}
              </p>
              <button type="button" onClick={() => onOpenPair(pair.machineId, step.trapPairId!)} className="mt-1 font-semibold text-brass-300 hover:underline">
                Open “don’t confuse” in the notes
              </button>
            </div>
          )}
          <ul className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {step.sources.map((u) => (
              <li key={u}>
                <a href={u} target="_blank" rel="noreferrer" className="break-words text-[11px] text-brass-300 hover:underline">
                  {sourceLabel(u)} ↗
                </a>
              </li>
            ))}
          </ul>
          <ProblemNote id={`${lab.id}-${step.id}`} saved={progress?.problems[step.id]} onSave={(t) => onProblem(step.id, t)} />
        </div>
      </div>
    </li>
  )
}

export function LabView(props: Props) {
  const { lab, progress, labsById, machinesById, openPrereqs, onComplete, onDebrief, onOpenLab, onOpenMachine } = props
  const st = labStatus(lab, progress)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => heading.current?.focus(), [lab.id])
  const missing = st.required - st.requiredDone

  return (
    <article aria-labelledby="lab-title" data-testid="lab-view" data-lab={lab.id}>
      <p className="text-xs font-semibold uppercase tracking-wider text-brass-400">Lab {lab.order}</p>
      <h3 id="lab-title" ref={heading} tabIndex={-1} className="font-display text-xl font-bold text-mill-50 outline-none">
        {lab.title}
      </h3>
      <p className="mt-1 text-sm text-mill-200">{lab.goal}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-mill-400">
        <PlatformBadge platform={lab.platform} />
        <span>{platformHint[lab.platform]}</span>
        <span>· about {minutesText(lab.minutes)}</span>
      </div>
      <dl className="mt-2 space-y-1 text-xs">
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-mill-400">Machines:</dt>
          <dd className="flex flex-wrap gap-x-2">
            {lab.machineIds.map((id) => (
              <button key={id} type="button" onClick={() => onOpenMachine(id)} className="text-brass-300 hover:underline">
                {machinesById.get(id)?.themedName ?? id}
              </button>
            ))}
          </dd>
        </div>
        {lab.bulletIds.length > 0 && (
          <div className="flex flex-wrap gap-x-2">
            <dt className="text-mill-400">Exam skills:</dt>
            <dd className="font-mono text-mill-200">{lab.bulletIds.join(', ')}</dd>
          </div>
        )}
        <div className="flex flex-wrap gap-x-2">
          <dt className="text-mill-400">Do first:</dt>
          <dd className="flex flex-wrap gap-x-2">
            {lab.prereqs.length === 0 ? (
              <span className="text-mill-200">nothing</span>
            ) : (
              lab.prereqs.map((id) => (
                <button key={id} type="button" onClick={() => onOpenLab(id)} className={`hover:underline ${openPrereqs.includes(id) ? 'text-madder' : 'text-emerald-300'}`}>
                  Lab {labsById.get(id)?.order} {openPrereqs.includes(id) ? '(not done)' : '✓'}
                </button>
              ))
            )}
          </dd>
        </div>
      </dl>
      {lab.before && <p className="mt-3 rounded-lg border border-mill-600 bg-mill-800/60 p-3 text-sm text-mill-50">{lab.before}</p>}

      <h4 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">Steps</h4>
      <ol className="space-y-2">
        {lab.steps.map((s, i) => (
          <StepItem key={s.id} {...props} step={s} n={i + 1} prefix="Step" />
        ))}
      </ol>
      <h4 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">Cleanup</h4>
      <ol className="space-y-2">
        {lab.cleanup.map((s, i) => (
          <StepItem key={s.id} {...props} step={s} n={i + 1} prefix="Cleanup" />
        ))}
      </ol>

      <div className="mt-5 rounded-xl border border-mill-600 bg-mill-900 p-4" data-testid="lab-finish">
        {st.complete ? (
          <p className="text-sm text-emerald-300" role="status">
            Lab complete ({progress?.completedAt?.slice(0, 10)}). Self-reported: it earned {LAB_XP} XP and doesn’t certify any machine.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={onComplete}
              disabled={missing > 0}
              className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark lab complete (+{LAB_XP} XP)
            </button>
            <p className="mt-1 text-xs text-mill-400">
              {missing > 0 ? `Tick the ${missing} remaining required step${missing === 1 ? '' : 's'} (optional steps don’t count).` : 'Every required step is ticked.'} Completion never certifies a machine.
            </p>
          </>
        )}
        <div className="mt-3 border-t border-mill-700 pt-3">
          <button
            type="button"
            onClick={onDebrief}
            disabled={!st.complete}
            className="rounded-lg bg-indigo-thread px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-indigo-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Debrief (3 questions)
          </button>
          <p className="mt-1 text-xs text-mill-400">
            {st.complete ? 'Questions from the bank on this lab’s skills. They count toward readiness like an inspection, but certify nothing.' : 'Opens once the lab is complete.'}
          </p>
        </div>
      </div>
    </article>
  )
}
