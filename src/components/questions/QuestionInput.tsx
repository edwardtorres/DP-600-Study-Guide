import { useState } from 'react'
import type { DropdownQuestion, MatchQuestion, MultiQuestion, OrderQuestion, Question, SingleQuestion, YesNoQuestion } from '../../content/questions/types'
import type { Response } from '../../game/score'
import { CodeBlock, Highlighted } from '../code/CodeBlock'

export const LETTERS = 'ABCDEFGH'

interface InputProps<Q extends Question, R extends Response> {
  question: Q
  response: R
  onChange: (r: R) => void
}

const optionBox =
  'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brass-300'
const optionIdle = 'border-mill-600 bg-mill-900 hover:border-brass-500/70'
const optionOn = 'border-brass-400 bg-brass-500/15'

function SingleChoice({ question, response, onChange }: InputProps<SingleQuestion, Extract<Response, { format: 'single' }>>) {
  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">Choose one answer</legend>
      {question.options.map((o, i) => {
        const on = response.choice === o.id
        return (
          <label key={o.id} className={`${optionBox} ${on ? optionOn : optionIdle}`}>
            <input
              type="radio"
              name={`q-${question.id}`}
              className="sr-only"
              checked={on}
              onChange={() => onChange({ format: 'single', choice: o.id })}
            />
            <span className="font-mono text-xs font-semibold text-brass-300">{LETTERS[i]}</span>
            <span className="min-w-0 break-words text-mill-50">{o.text}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

function MultiSelect({ question, response, onChange }: InputProps<MultiQuestion, Extract<Response, { format: 'multi' }>>) {
  const need = question.answers.length
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-xs text-mill-400">
        Choose {need}. Selected {response.choices.length} of {need}.
      </legend>
      {question.options.map((o, i) => {
        const on = response.choices.includes(o.id)
        return (
          <label key={o.id} className={`${optionBox} ${on ? optionOn : optionIdle}`}>
            <input
              type="checkbox"
              className="sr-only"
              checked={on}
              onChange={() =>
                onChange({ format: 'multi', choices: on ? response.choices.filter((c) => c !== o.id) : [...response.choices, o.id] })
              }
            />
            <span aria-hidden="true" className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border text-[10px] ${on ? 'border-brass-300 bg-brass-400 text-mill-950' : 'border-mill-400'}`}>
              {on ? '✓' : ''}
            </span>
            <span className="font-mono text-xs font-semibold text-brass-300">{LETTERS[i]}</span>
            <span className="min-w-0 break-words text-mill-50">{o.text}</span>
          </label>
        )
      })}
    </fieldset>
  )
}

function YesNoSet({ question, response, onChange }: InputProps<YesNoQuestion, Extract<Response, { format: 'yesno' }>>) {
  return (
    <ol className="space-y-3">
      {question.statements.map((s, i) => (
        <li key={s.id} className="rounded-lg border border-mill-700 bg-mill-900 p-3">
          <p className="text-sm text-mill-50">
            <span className="mr-2 font-mono text-xs text-mill-400">{i + 1}.</span>
            {s.text}
          </p>
          <div role="radiogroup" aria-label={`Statement ${i + 1}`} className="mt-2 flex gap-2">
            {([true, false] as const).map((v) => {
              const on = response.answers[s.id] === v
              return (
                <label key={String(v)} className={`${optionBox} flex-1 justify-center py-1.5 ${on ? optionOn : optionIdle}`}>
                  <input
                    type="radio"
                    name={`q-${question.id}-${s.id}`}
                    className="sr-only"
                    checked={on}
                    onChange={() => onChange({ format: 'yesno', answers: { ...response.answers, [s.id]: v } })}
                  />
                  <span className="font-semibold text-mill-50">{v ? 'Yes' : 'No'}</span>
                </label>
              )
            })}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** Tap a prompt, then tap a choice. Tapping a paired prompt again lets you change or clear it. Works with keyboard too. */
function Matching({ question, response, onChange }: InputProps<MatchQuestion, Extract<Response, { format: 'match' }>>) {
  const [active, setActive] = useState<string | null>(question.prompts[0]?.id ?? null)
  const letterOf = (choiceId: string | undefined) => {
    const i = question.choices.findIndex((c) => c.id === choiceId)
    return i >= 0 ? LETTERS[i] : null
  }
  const assign = (choiceId: string) => {
    if (!active) return
    const pairs = { ...response.pairs, [active]: choiceId }
    onChange({ format: 'match', pairs })
    const next = question.prompts.find((p) => pairs[p.id] === undefined)
    setActive(next?.id ?? null)
  }
  const clear = (promptId: string) => {
    const pairs = { ...response.pairs }
    delete pairs[promptId]
    onChange({ format: 'match', pairs })
    setActive(promptId)
  }
  return (
    <div className="space-y-4">
      <p className="text-xs text-mill-400">Tap an item, then tap the choice that matches it. A choice may be used more than once or not at all.</p>
      <ol className="space-y-2" aria-label="Items to match">
        {question.prompts.map((p, i) => {
          const letter = letterOf(response.pairs[p.id])
          const on = active === p.id
          return (
            <li key={p.id} className="flex items-stretch gap-2">
              <button
                type="button"
                aria-pressed={on}
                data-prompt={p.id}
                onClick={() => setActive(p.id)}
                className={`flex min-w-0 flex-1 items-start gap-2 rounded-lg border px-3 py-2 text-left text-sm ${on ? 'border-brass-400 bg-brass-500/15' : 'border-mill-600 bg-mill-900'}`}
              >
                <span className="font-mono text-xs text-mill-400">{i + 1}.</span>
                <span className="min-w-0 flex-1 break-words text-mill-50">{p.text}</span>
                <span
                  className={`shrink-0 rounded px-1.5 font-mono text-xs font-semibold ${letter ? 'bg-brass-400 text-mill-950' : 'border border-dashed border-mill-400 text-mill-400'}`}
                  aria-label={letter ? `matched to ${letter}` : 'not matched yet'}
                >
                  {letter ?? '?'}
                </span>
              </button>
              {letter && (
                <button type="button" onClick={() => clear(p.id)} aria-label={`Clear match for item ${i + 1}`} className="rounded-lg border border-mill-600 px-2 text-xs text-mill-400 hover:text-mill-50">
                  Clear
                </button>
              )}
            </li>
          )
        })}
      </ol>
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-mill-400">
          {active ? `Choose a match for item ${question.prompts.findIndex((p) => p.id === active) + 1}` : 'All items matched. Tap an item to change it.'}
        </p>
        <ul className="space-y-2" aria-label="Choices">
          {question.choices.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                data-choice={c.id}
                disabled={!active}
                onClick={() => assign(c.id)}
                className={`${optionBox} w-full text-left ${optionIdle} disabled:cursor-default disabled:opacity-60`}
              >
                <span className="font-mono text-xs font-semibold text-brass-300">{LETTERS[i]}</span>
                <span className="min-w-0 break-words text-mill-50">{c.text}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

/** Up/down buttons move each item; no dragging needed. */
function Ordering({ question, response, onChange }: InputProps<OrderQuestion, Extract<Response, { format: 'order' }>>) {
  const [announce, setAnnounce] = useState('')
  const byId = new Map(question.items.map((i) => [i.id, i]))
  const move = (index: number, delta: number) => {
    const to = index + delta
    if (to < 0 || to >= response.order.length) return
    const order = [...response.order]
    ;[order[index], order[to]] = [order[to]!, order[index]!]
    onChange({ format: 'order', order })
    setAnnounce(`${byId.get(order[to]!)?.text ?? 'Item'} moved to position ${to + 1}.`)
  }
  return (
    <div>
      <p className="mb-2 text-xs text-mill-400">Use the arrows to put the steps in order, first at the top.</p>
      <ol className="space-y-2">
        {response.order.map((id, i) => (
          <li key={id} data-item={id} className="flex items-center gap-2 rounded-lg border border-mill-600 bg-mill-900 p-2">
            <span className="w-5 shrink-0 text-center font-mono text-xs text-brass-300">{i + 1}</span>
            <span className="min-w-0 flex-1 break-words text-sm text-mill-50">{byId.get(id)?.text}</span>
            <span className="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label={`Move "${byId.get(id)?.text}" up`}
                data-move="up"
                className="rounded border border-mill-600 px-2 text-sm text-mill-50 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(i, 1)}
                disabled={i === response.order.length - 1}
                aria-label={`Move "${byId.get(id)?.text}" down`}
                data-move="down"
                className="rounded border border-mill-600 px-2 text-sm text-mill-50 disabled:opacity-30"
              >
                ↓
              </button>
            </span>
          </li>
        ))}
      </ol>
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
    </div>
  )
}

function DropdownCode({ question, response, onChange }: InputProps<DropdownQuestion, Extract<Response, { format: 'dropdown' }>>) {
  const parts = question.code.split(/(\[\[\w+\]\])/)
  return (
    <CodeBlock language={question.language}>
      {parts.map((part, i) => {
        const m = /^\[\[(\w+)\]\]$/.exec(part)
        if (!m) return <Highlighted key={i} code={part} language={question.language} />
        const slot = question.slots.find((s) => s.id === m[1])
        if (!slot) return <span key={i}>{part}</span>
        return (
          <select
            key={i}
            aria-label={`Blank ${slot.id}`}
            data-slot={slot.id}
            value={response.slots[slot.id] ?? ''}
            onChange={(e) => onChange({ format: 'dropdown', slots: { ...response.slots, [slot.id]: e.target.value || undefined } })}
            className="mx-0.5 rounded border border-brass-500/70 bg-mill-800 px-1 py-0.5 font-mono text-xs text-mill-50"
          >
            <option value="">[{slot.id}] choose…</option>
            {slot.options.map((o) => (
              <option key={o.id} value={o.id}>
                {o.text}
              </option>
            ))}
          </select>
        )
      })}
    </CodeBlock>
  )
}

/** Renders the answer controls for any question format. `question` should already be shuffled for this attempt. */
export function QuestionInput({ question, response, onChange }: { question: Question; response: Response; onChange: (r: Response) => void }) {
  switch (question.format) {
    case 'single':
      return response.format === 'single' ? <SingleChoice question={question} response={response} onChange={onChange} /> : null
    case 'multi':
      return response.format === 'multi' ? <MultiSelect question={question} response={response} onChange={onChange} /> : null
    case 'yesno':
      return response.format === 'yesno' ? <YesNoSet question={question} response={response} onChange={onChange} /> : null
    case 'match':
      return response.format === 'match' ? <Matching question={question} response={response} onChange={onChange} /> : null
    case 'order':
      return response.format === 'order' ? <Ordering question={question} response={response} onChange={onChange} /> : null
    case 'dropdown':
      return response.format === 'dropdown' ? <DropdownCode question={question} response={response} onChange={onChange} /> : null
  }
}
