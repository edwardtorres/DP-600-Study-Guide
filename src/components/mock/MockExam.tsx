import { useEffect, useRef, useState } from 'react'
import type { CaseStudy, Question } from '../../content/questions/types'
import { remainingMs } from '../../game/mock'
import { emptyResponse, isComplete, type Response } from '../../game/score'
import type { ActiveMock } from '../../save/schema'
import { QuestionInput } from '../questions/QuestionInput'

interface Props {
  active: ActiveMock
  /** Questions already shuffled with the mock's seed, by id. */
  questions: Map<string, Question>
  caseStudy: CaseStudy | undefined
  onResponse: (questionId: string, response: Response) => void
  onMark: (questionId: string) => void
  onLeaveCase: () => void
  onSubmit: (timedOut: boolean) => void
  onExit: () => void
}

const clock = (ms: number) => {
  const s = Math.ceil(ms / 1000)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return `${h > 0 ? `${h}:` : ''}${String(m).padStart(h > 0 ? 2 : 1, '0')}:${String(sec).padStart(2, '0')}`
}

function CasePanel({ c }: { c: CaseStudy }) {
  const list = (title: string, items: string[]) => (
    <div className="mt-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-mill-400">{title}</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-mill-200">
        {items.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
    </div>
  )
  return (
    <details open className="mb-4 rounded-lg border border-indigo-thread/50 bg-indigo-thread/10 p-3" data-testid="case-panel">
      <summary className="cursor-pointer font-display text-lg font-bold text-mill-50">Case study: {c.company}</summary>
      <p className="mt-1 text-sm text-mill-200">{c.summary}</p>
      {list('Existing environment', c.environment)}
      {list('Requirements', c.requirements)}
      {list('Constraints', c.constraints)}
    </details>
  )
}

/**
 * The mock exam. No feedback until the end. Section 1 is the case study; once
 * left (after a warning), it locks. The timer runs from the stored start time,
 * so it keeps going across reloads, and the exam submits itself at zero.
 */
export function MockExam({ active, questions, caseStudy, onResponse, onMark, onLeaveCase, onSubmit, onExit }: Props) {
  const [now, setNow] = useState(() => Date.now())
  const [index, setIndex] = useState(0)
  const [view, setView] = useState<'question' | 'review'>('question')
  const [confirm, setConfirm] = useState<'leave' | 'submit' | null>(null)
  const submitted = useRef(false)
  const top = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])
  const left = remainingMs(active, new Date(now))
  useEffect(() => {
    if (left <= 0 && !submitted.current) {
      submitted.current = true
      onSubmit(true)
    }
  }, [left, onSubmit])
  useEffect(() => {
    top.current?.focus()
  }, [index, view, active.caseLocked])

  const section: 'case' | 'main' = active.caseLocked ? 'main' : 'case'
  const ids = section === 'case' ? active.caseIds : active.mainIds
  const qid = ids[Math.min(index, ids.length - 1)]!
  const q = questions.get(qid)!
  const responseOf = (id: string) => (active.responses[id] as Response | undefined) ?? emptyResponse(questions.get(id)!)
  const answered = (id: string) => active.responses[id] !== undefined && isComplete(questions.get(id)!, responseOf(id))
  const unanswered = ids.filter((id) => !answered(id)).length
  const total = active.caseIds.length + active.mainIds.length
  const number = (section === 'case' ? 0 : active.caseIds.length) + index + 1

  const pill = (id: string, i: number) => {
    const isMarked = active.marked.includes(id)
    const done = answered(id)
    return (
      <button
        key={id}
        type="button"
        onClick={() => {
          setIndex(i)
          setView('question')
        }}
        aria-label={`Question ${(section === 'case' ? 0 : active.caseIds.length) + i + 1}${done ? ', answered' : ', unanswered'}${isMarked ? ', marked for review' : ''}`}
        aria-current={i === index && view === 'question' ? 'step' : undefined}
        className={`relative size-9 shrink-0 rounded-md border text-xs font-semibold ${i === index && view === 'question' ? 'border-brass-300 text-mill-50' : 'border-mill-600 text-mill-200'} ${done ? 'bg-mill-700' : 'bg-mill-950'}`}
      >
        {(section === 'case' ? 0 : active.caseIds.length) + i + 1}
        {isMarked && <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-weld" aria-hidden="true" />}
      </button>
    )
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="mock-title" className="fixed inset-0 z-40 flex justify-center bg-mill-950/95 sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-mill-950 sm:rounded-xl sm:border sm:border-mill-600">
        <div className="flex items-start justify-between gap-3 border-b border-mill-700 p-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brass-400">
              Mock exam{active.short ? ' (short dev mode)' : ''} · Section {section === 'case' ? '1 of 2: case study' : '2 of 2'}
            </p>
            <h2 id="mock-title" className="truncate font-display text-lg font-bold text-mill-50">
              {view === 'review' ? 'Review your answers' : `Question ${number} of ${total}`}
            </h2>
          </div>
          <div className="shrink-0 text-right">
            <p className={`font-mono text-xl font-bold ${left < 5 * 60_000 ? 'text-madder' : 'text-mill-50'}`} data-testid="mock-timer" aria-live="off">
              {clock(left)}
            </p>
            <button type="button" onClick={onExit} className="text-[11px] text-mill-400 hover:text-mill-50 hover:underline">
              Exit (timer keeps running)
            </button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto border-b border-mill-700 px-3 py-2" data-testid="mock-nav">
          {ids.map(pill)}
        </div>

        <div ref={top} tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden p-4 outline-none" data-testid="mock-body">
          {section === 'case' && caseStudy && <CasePanel c={caseStudy} />}
          {view === 'question' ? (
            <section data-question-id={q.id} data-format={q.format} aria-label={`Question ${number} of ${total}`}>
              <p className="mb-3 text-[15px] leading-relaxed text-mill-50">{q.stem}</p>
              <QuestionInput question={q} response={responseOf(q.id)} onChange={(r) => onResponse(q.id, r)} />
              <label className="mt-4 flex items-center gap-2 text-sm text-mill-200">
                <input type="checkbox" checked={active.marked.includes(q.id)} onChange={() => onMark(q.id)} className="size-5 accent-weld" />
                Mark for review
              </label>
            </section>
          ) : (
            <section data-testid="mock-review" className="space-y-3">
              <p className="text-sm text-mill-200">
                {unanswered} unanswered · {active.marked.filter((m) => active.mainIds.includes(m)).length} marked for review. Select a question to go back to it. Nothing is scored until you submit.
              </p>
              {active.caseLocked && (
                <p className="rounded-lg border border-mill-700 p-2 text-xs text-mill-400">
                  Section 1 (case study, questions 1–{active.caseIds.length}) is locked: you left it.
                </p>
              )}
              <ul className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {ids.map((id, i) => (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        setIndex(i)
                        setView('question')
                      }}
                      className="flex w-full items-center justify-between rounded-lg border border-mill-700 px-3 py-2 text-left text-sm hover:border-brass-400"
                      data-review-item={id}
                    >
                      <span className="text-mill-50">Question {(section === 'case' ? 0 : active.caseIds.length) + i + 1}</span>
                      <span className="text-xs">
                        {active.marked.includes(id) && <span className="mr-2 font-semibold text-weld">Marked</span>}
                        <span className={answered(id) ? 'text-emerald-300' : 'text-madder'}>{answered(id) ? 'Answered' : 'Unanswered'}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mill-700 p-3">
          {view === 'question' ? (
            <>
              <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0} className="rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50 disabled:opacity-40">
                Back
              </button>
              <div className="flex gap-2">
                {index < ids.length - 1 ? (
                  <button type="button" onClick={() => setIndex((i) => i + 1)} className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300">
                    Next
                  </button>
                ) : section === 'case' ? (
                  <button type="button" onClick={() => setConfirm('leave')} className="rounded-lg bg-indigo-thread px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-indigo-200">
                    Leave case study
                  </button>
                ) : (
                  <button type="button" onClick={() => setView('review')} className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300">
                    Review answers
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => setView('question')} className="rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50">
                Back to questions
              </button>
              <button type="button" onClick={() => setConfirm('submit')} className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300">
                Submit exam
              </button>
            </>
          )}
        </div>
      </div>

      {confirm && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="mock-confirm-title" aria-describedby="mock-confirm-text" className="fixed inset-0 z-50 flex items-center justify-center bg-mill-950/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-mill-600 bg-mill-900 p-4">
            <h3 id="mock-confirm-title" className="font-display text-lg font-bold text-mill-50">
              {confirm === 'leave' ? 'Leave the case study?' : 'Submit the exam?'}
            </h3>
            <p id="mock-confirm-text" className="mt-2 text-sm text-mill-200">
              {confirm === 'leave'
                ? `You can’t return to this section, as on Microsoft exams.${unanswered > 0 ? ` ${unanswered} case question${unanswered === 1 ? ' is' : 's are'} still unanswered.` : ''}`
                : `${unanswered > 0 ? `${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered and will count as wrong. ` : ''}You can’t change answers after submitting.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirm(null)} className="rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50">
                {confirm === 'leave' ? 'Stay' : 'Keep working'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const c = confirm
                  setConfirm(null)
                  if (c === 'leave') {
                    setIndex(0)
                    setView('question')
                    onLeaveCase()
                  } else if (!submitted.current) {
                    submitted.current = true
                    onSubmit(false)
                  }
                }}
                className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300"
              >
                {confirm === 'leave' ? 'Leave section' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
