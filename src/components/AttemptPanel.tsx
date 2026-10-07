import { useEffect, useRef, useState } from 'react'
import type { Question } from '../content/questions/types'
import type { Machine } from '../data/types'
import { emptyResponse, isComplete, isCorrect, type Response } from '../game/score'
import type { AttemptOutcome } from '../game/state'
import type { AttemptKind } from '../save/schema'
import { CloseIcon } from './icons'
import { QuestionInput } from './questions/QuestionInput'
import { QuestionResult } from './questions/QuestionResult'

/** A lab debrief reuses this panel: 3 bank questions, logged for readiness, never certifying. */
export type PanelKind = AttemptKind | 'debrief' | 'review'

const attemptTitle: Record<PanelKind, string> = {
  debrief: 'Lab debrief',
  review: 'Daily review',
  startup: 'Start-up check',
  inspection: 'Inspection',
  placement: 'Placement check',
}

const rule: Record<PanelKind, string> = {
  debrief: '3 questions from the bank on this lab’s exam skills. They count toward readiness like an inspection; nothing is certified.',
  review: 'Questions due for review, plus your weakest skills. Answers set when each one comes back, count toward readiness, and never certify.',
  startup: '2 questions. Get both right to start the machine.',
  inspection: '5 questions. Get at least 4 right (80%) to certify the machine.',
  placement: '5 questions from what DP-600 adds beyond PL-300. Get all 5 right to certify the machine as placed. One attempt per day, used as soon as you start.',
}

interface Props {
  machine: Machine
  kind: PanelKind
  /** Overrides the machine name in the title (a lab debrief shows the lab). */
  heading?: string
  /** Already drawn and shuffled for this attempt. */
  questions: Question[]
  onSubmit: (correct: boolean[]) => AttemptOutcome
  onRetry?: () => void
  /** Why a retry isn't allowed right now (asked after the result is recorded), or null if it is. */
  retryBlocked?: () => string | null
  onClose: () => void
  onOpenPair: (machineId: string, pairId: string) => void
}

export function AttemptPanel({ machine, kind, heading, questions, onSubmit, onRetry, retryBlocked, onClose, onOpenPair }: Props) {
  const [responses, setResponses] = useState<Response[]>(() => questions.map(emptyResponse))
  const [index, setIndex] = useState(0)
  const [result, setResult] = useState<{ correct: boolean[]; outcome: AttemptOutcome; blocked: string | null } | null>(null)
  const top = useRef<HTMLDivElement>(null)

  useEffect(() => {

    top.current?.focus()

  }, [index, result])

  const q = questions[index]
  const allDone = questions.every((qq, i) => isComplete(qq, responses[i]!))
  const answered = questions.filter((qq, i) => isComplete(qq, responses[i]!)).length

  const submit = () => {
    const correct = questions.map((qq, i) => isCorrect(qq, responses[i]!))
    const outcome = onSubmit(correct)
    setResult({ correct, outcome, blocked: outcome === 'failed' ? (retryBlocked?.() ?? null) : null })
  }

  const right = result ? result.correct.filter(Boolean).length : 0
  const passedText: Record<PanelKind, string> = {
    debrief: 'All right. Logged toward readiness. A lab debrief never certifies a machine.',
    review: 'All right. Each question moves further out in your review schedule. Reviews never certify a machine.',
    startup: `Start-up check passed. ${machine.themedName} is running. Study the notes, then take the inspection.`,
    inspection: `Inspection passed. ${machine.themedName} is certified, and any machine it feeds may now unlock.`,
    placement: `Placement passed. ${machine.themedName} is certified as placed, and the machines it feeds may now unlock.`,
  }
  const failedText: Record<PanelKind, string> = {
    debrief: 'Logged toward readiness. Review the explanations below; a lab debrief never certifies a machine.',
    review: 'Missed questions come back tomorrow; correct ones move further out. Review the explanations below. Reviews never certify a machine.',
    startup: 'Not passed. Both answers must be right. Review the notes and try again with a new draw.',
    inspection: 'Not passed. You need at least 4 of 5. Review the explanations and notes, then try again with a new draw.',
    placement: 'Not passed. Placement needs all 5 right. You can try again tomorrow, or work through the machine normally.',
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="attempt-title" className="fixed inset-0 z-40 flex justify-center bg-mill-950/85 backdrop-blur-sm sm:p-4">
      <div className="flex h-full w-full max-w-3xl flex-col bg-mill-950 sm:rounded-xl sm:border sm:border-mill-600">
        <div className="flex items-start justify-between gap-3 border-b border-mill-700 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-brass-400">{attemptTitle[kind]}</p>
            <h2 id="attempt-title" className="truncate font-display text-xl font-bold text-mill-50">
              {heading ?? machine.themedName}
            </h2>
            <p className="text-xs text-mill-400">{rule[kind]}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>

        <div ref={top} tabIndex={-1} className="flex-1 overflow-y-auto overflow-x-hidden p-4 outline-none" data-testid="attempt-body">
          {!result && q && (
            <section data-question-id={q.id} data-format={q.format} aria-label={`Question ${index + 1} of ${questions.length}`}>
              <p className="text-xs text-mill-400">
                Question {index + 1} of {questions.length} · {answered} answered
              </p>
              <p className="mt-1 mb-3 text-[15px] leading-relaxed text-mill-50">{q.stem}</p>
              <QuestionInput
                question={q}
                response={responses[index]!}
                onChange={(r) => setResponses((rs) => rs.map((x, i) => (i === index ? r : x)))}
              />
            </section>
          )}

          {result && (
            <div className="space-y-4">
              <div role="status" className={`rounded-xl border p-4 ${result.outcome === 'passed' ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-madder/60 bg-madder/10'}`}>
                <p className="font-display text-2xl font-bold text-mill-50">
                  {right} of {questions.length} correct
                </p>
                <p className="mt-1 text-sm text-mill-200">{result.outcome === 'passed' ? passedText[kind] : result.outcome === 'failed' ? failedText[kind] : 'This attempt could not be recorded.'}</p>
                <p className="mt-1 text-xs text-mill-400">A question counts only if every part of it is right.</p>
                {result.blocked && (
                  <p className="mt-2 text-sm font-semibold text-madder" data-testid="retry-blocked">
                    {result.blocked}
                  </p>
                )}
              </div>
              {questions.map((qq, i) => (
                <QuestionResult key={qq.id} index={i} question={qq} response={responses[i]!} correct={result.correct[i]!} onOpenPair={onOpenPair} />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mill-700 p-3">
          {!result ? (
            <>
              <button
                type="button"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
                className="rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50 disabled:opacity-40"
              >
                Back
              </button>
              {index < questions.length - 1 ? (
                <button type="button" onClick={() => setIndex((i) => i + 1)} className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300">
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={!allDone}
                  className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {allDone ? 'Submit' : `Answer all ${questions.length} to submit`}
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50">
                Back to the mill
              </button>
              {result.outcome === 'failed' && onRetry && kind !== 'placement' && !result.blocked && (
                <button type="button" onClick={onRetry} className="rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950 hover:bg-brass-300">
                  Try again (new draw)
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
