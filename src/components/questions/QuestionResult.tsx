import { pairIndex } from '../../content/pairs'
import type { Question } from '../../content/questions/types'
import type { Response } from '../../game/score'
import { CodeBlock } from '../code/CodeBlock'
import { LETTERS } from './QuestionInput'

const mark = (ok: boolean) => (ok ? <span className="text-emerald-300">✓</span> : <span className="text-madder">✗</span>)

function Line({ correct, chosen, label, text, explain }: { correct: boolean; chosen: boolean; label?: string; text: string; explain: string }) {
  return (
    <li className={`rounded-md border p-2 text-sm ${correct ? 'border-emerald-400/50 bg-emerald-400/10' : chosen ? 'border-madder/60 bg-madder/10' : 'border-mill-700'}`}>
      <p className="text-mill-50">
        {label && <span className="mr-2 font-mono text-xs text-brass-300">{label}</span>}
        {text}
        {correct && <span className="ml-2 text-xs font-semibold text-emerald-300">Correct answer</span>}
        {chosen && <span className={`ml-2 text-xs font-semibold ${correct ? 'text-emerald-300' : 'text-madder'}`}>Your answer</span>}
      </p>
      <p className="mt-0.5 text-xs text-mill-200">{explain}</p>
    </li>
  )
}

function Body({ q, r }: { q: Question; r: Response }) {
  switch (q.format) {
    case 'single':
      return (
        <ul className="space-y-1.5">
          {q.options.map((o, i) => (
            <Line key={o.id} label={LETTERS[i]} text={o.text} explain={o.explain} correct={o.id === q.answer} chosen={r.format === 'single' && r.choice === o.id} />
          ))}
        </ul>
      )
    case 'multi':
      return (
        <ul className="space-y-1.5">
          {q.options.map((o, i) => (
            <Line key={o.id} label={LETTERS[i]} text={o.text} explain={o.explain} correct={q.answers.includes(o.id)} chosen={r.format === 'multi' && r.choices.includes(o.id)} />
          ))}
        </ul>
      )
    case 'yesno':
      return (
        <ul className="space-y-1.5">
          {q.statements.map((s, i) => {
            const given = r.format === 'yesno' ? r.answers[s.id] : undefined
            return (
              <li key={s.id} className="rounded-md border border-mill-700 p-2 text-sm">
                <p className="text-mill-50">
                  {mark(given === s.answer)} <span className="font-mono text-xs text-mill-400">{i + 1}.</span> {s.text}
                </p>
                <p className="mt-0.5 text-xs text-mill-200">
                  <span className="font-semibold">Answer: {s.answer ? 'Yes' : 'No'}</span>
                  {given !== undefined && <span> · you said {given ? 'Yes' : 'No'}</span>}. {s.explain}
                </p>
              </li>
            )
          })}
        </ul>
      )
    case 'match':
      return (
        <ul className="space-y-1.5">
          {q.pairs.map((p) => {
            const prompt = q.prompts.find((x) => x.id === p.promptId)
            const choice = q.choices.find((x) => x.id === p.choiceId)
            const givenId = r.format === 'match' ? r.pairs[p.promptId] : undefined
            const given = q.choices.find((x) => x.id === givenId)
            return (
              <li key={p.promptId} className="rounded-md border border-mill-700 p-2 text-sm">
                <p className="text-mill-50">
                  {mark(givenId === p.choiceId)} {prompt?.text} → <span className="font-semibold">{choice?.text}</span>
                </p>
                {givenId !== p.choiceId && given && <p className="text-xs text-madder">You matched: {given.text}</p>}
                <p className="mt-0.5 text-xs text-mill-200">{p.explain}</p>
              </li>
            )
          })}
        </ul>
      )
    case 'order':
      return (
        <ol className="space-y-1.5">
          {q.answerOrder.map((id, i) => {
            const item = q.items.find((x) => x.id === id)
            const yourPos = r.format === 'order' ? r.order.indexOf(id) : -1
            return (
              <li key={id} className="rounded-md border border-mill-700 p-2 text-sm">
                <p className="text-mill-50">
                  {mark(yourPos === i)} <span className="font-mono text-xs text-brass-300">{i + 1}.</span> {item?.text}
                  {yourPos !== i && yourPos >= 0 && <span className="ml-2 text-xs text-madder">you put it at {yourPos + 1}</span>}
                </p>
                <p className="mt-0.5 text-xs text-mill-200">{item?.explain}</p>
              </li>
            )
          })}
        </ol>
      )
    case 'dropdown':
      return (
        <div className="space-y-2">
          <CodeBlock code={q.code} language={q.language} />
          {q.slots.map((s) => {
            const given = r.format === 'dropdown' ? r.slots[s.id] : undefined
            return (
              <div key={s.id}>
                <p className="text-xs font-semibold text-mill-400">
                  {mark(given === s.answer)} Blank [[{s.id}]]
                </p>
                <ul className="mt-1 space-y-1">
                  {s.options.map((o) => (
                    <Line key={o.id} text={o.text} explain={o.explain} correct={o.id === s.answer} chosen={given === o.id} />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )
  }
}

interface Props {
  index: number
  question: Question
  response: Response
  correct: boolean
  onOpenPair?: (machineId: string, pairId: string) => void
}

/** One question after submission: right or wrong, every explanation, sources, and the related "don't confuse" pair. */
export function QuestionResult({ index, question, response, correct, onOpenPair }: Props) {
  const pair = question.trapPairId ? pairIndex.get(question.trapPairId) : undefined
  return (
    <article data-question-id={question.id} data-correct={correct} className="rounded-xl border border-mill-700 bg-mill-900 p-4">
      <p className={`text-xs font-semibold uppercase tracking-wider ${correct ? 'text-emerald-300' : 'text-madder'}`}>
        Question {index + 1} · {correct ? 'Correct' : 'Not correct'}
      </p>
      <p className="mt-1 text-sm text-mill-50">{question.stem}</p>
      <div className="mt-3">
        <Body q={question} r={response} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="text-mill-400">Learn:</span>
        {question.sources.map((u) => (
          <a key={u} href={u} target="_blank" rel="noreferrer" className="break-all text-brass-300 hover:underline">
            {u.replace('https://learn.microsoft.com/en-us/', '')}
          </a>
        ))}
      </div>
      {pair && onOpenPair && question.trapPairId && (
        <button type="button" onClick={() => onOpenPair(pair.machineId, question.trapPairId!)} className="mt-2 text-xs font-semibold text-indigo-200 hover:underline">
          Don’t confuse: {pair.a} vs {pair.b} →
        </button>
      )}
    </article>
  )
}
