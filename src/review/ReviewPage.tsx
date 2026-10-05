import { useMemo, useState } from 'react'
import { allQuestions, caseStudies } from '../content/questions'
import type { Choice, Question } from '../content/questions/types'
import { floors } from '../data/floors'
import { findBullet } from '../data/outline'
import { machineById, machines } from '../data/machines'

const formatLabel: Record<Question['format'], string> = {
  single: 'Single choice',
  multi: 'Multi-select',
  yesno: 'Yes / No',
  order: 'Ordering',
  match: 'Matching',
  dropdown: 'Code drop-down',
}

function Option({ c, correct }: { c: Choice; correct: boolean }) {
  return (
    <li className={`rounded-md border p-2 ${correct ? 'border-brass-400 bg-brass-500/15' : 'border-mill-700'}`}>
      <p className="text-sm text-mill-50">
        {correct && <span className="mr-1 font-semibold text-brass-300">✓</span>}
        {c.text}
      </p>
      <p className="mt-1 text-xs text-mill-400">{c.explain}</p>
    </li>
  )
}

function Body({ q }: { q: Question }) {
  switch (q.format) {
    case 'single':
      return <ol className="space-y-2">{q.options.map((o) => <Option key={o.id} c={o} correct={o.id === q.answer} />)}</ol>
    case 'multi':
      return <ol className="space-y-2">{q.options.map((o) => <Option key={o.id} c={o} correct={q.answers.includes(o.id)} />)}</ol>
    case 'yesno':
      return (
        <ol className="space-y-2">
          {q.statements.map((s) => (
            <li key={s.id} className="rounded-md border border-mill-700 p-2">
              <p className="text-sm text-mill-50">
                <span className={`mr-2 rounded px-1.5 text-xs font-semibold ${s.answer ? 'bg-brass-400 text-mill-950' : 'bg-madder/40 text-mill-50'}`}>{s.answer ? 'Yes' : 'No'}</span>
                {s.text}
              </p>
              <p className="mt-1 text-xs text-mill-400">{s.explain}</p>
            </li>
          ))}
        </ol>
      )
    case 'order':
      return (
        <ol className="list-decimal space-y-2 pl-5">
          {q.answerOrder.map((id) => {
            const item = q.items.find((i) => i.id === id)!
            return (
              <li key={id} className="text-sm text-mill-50">
                {item.text}
                <p className="text-xs text-mill-400">{item.explain}</p>
              </li>
            )
          })}
        </ol>
      )
    case 'match':
      return (
        <ul className="space-y-2">
          {q.prompts.map((p) => {
            const pair = q.pairs.find((x) => x.promptId === p.id)!
            const choice = q.choices.find((c) => c.id === pair.choiceId)!
            return (
              <li key={p.id} className="rounded-md border border-mill-700 p-2 text-sm text-mill-50">
                {p.text} → <span className="font-semibold text-brass-300">{choice.text}</span>
                <p className="text-xs text-mill-400">{pair.explain}</p>
              </li>
            )
          })}
          <li className="text-xs text-mill-400">Choices offered: {q.choices.map((c) => c.text).join(' · ')}</li>
        </ul>
      )
    case 'dropdown':
      return (
        <div className="space-y-2">
          <pre className="overflow-x-auto rounded-md bg-mill-950 p-2 font-mono text-xs text-mill-50">
            <code>{q.code}</code>
          </pre>
          {q.slots.map((s) => (
            <div key={s.id}>
              <p className="text-xs font-semibold text-mill-200">Slot [[{s.id}]]</p>
              <ol className="mt-1 space-y-1">{s.options.map((o) => <Option key={o.id} c={o} correct={o.id === s.answer} />)}</ol>
            </div>
          ))}
        </div>
      )
  }
}

export function ReviewPage() {
  const [machineId, setMachineId] = useState<string>('all')
  const [format, setFormat] = useState<string>('all')
  const [flag, setFlag] = useState<string>('all')

  const shown = useMemo(
    () =>
      allQuestions.filter(
        (q) =>
          (machineId === 'all' || q.machineId === machineId) &&
          (format === 'all' || q.format === format) &&
          (flag === 'all' ||
            (flag === 'placement' && q.placement) ||
            (flag === 'preview' && q.preview) ||
            (flag === 'case' && q.caseStudyId) ||
            (flag.startsWith('d') && q.difficulty === Number(flag.slice(1)))),
      ),
    [machineId, format, flag],
  )
  const casesShown = new Set(shown.map((q) => q.caseStudyId).filter(Boolean))

  const select = 'max-w-full min-w-0 rounded-md border border-mill-600 bg-mill-900 px-2 py-1.5 text-sm text-mill-50'
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-6 text-mill-50">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-400">Fabric Mill · hidden</p>
      <h1 className="font-display text-3xl font-bold">Question bank review</h1>
      <p className="mt-1 text-sm text-mill-400">Answers and explanations are shown. Not linked from the game.</p>

      <div className="sticky top-0 z-10 mt-4 flex flex-wrap gap-2 bg-mill-950/95 py-2">
        <select aria-label="Machine" className={select} value={machineId} onChange={(e) => setMachineId(e.target.value)}>
          <option value="all">All machines ({allQuestions.length})</option>
          {floors.map((f) => (
            <optgroup key={f.id} label={f.name}>
              {machines
                .filter((m) => m.floor === f.id)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.themedName} · {m.skillName} ({allQuestions.filter((q) => q.machineId === m.id).length})
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <select aria-label="Format" className={select} value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="all">All formats</option>
          {Object.entries(formatLabel).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select aria-label="Filter" className={select} value={flag} onChange={(e) => setFlag(e.target.value)}>
          <option value="all">Any flag</option>
          <option value="placement">Placement-eligible</option>
          <option value="preview">Preview</option>
          <option value="case">Case study</option>
          <option value="d1">Difficulty 1</option>
          <option value="d2">Difficulty 2</option>
          <option value="d3">Difficulty 3</option>
        </select>
        <span className="self-center text-sm text-mill-400">{shown.length} shown</span>
      </div>

      {caseStudies
        .filter((c) => casesShown.has(c.id))
        .map((c) => (
          <details key={c.id} className="mt-4 rounded-lg border border-indigo-thread/50 bg-mill-900 p-3">
            <summary className="cursor-pointer font-semibold">
              Case study: {c.title} <span className="text-sm font-normal text-mill-400">({c.company})</span>
            </summary>
            <p className="mt-2 text-sm text-mill-200">{c.summary}</p>
            {(['environment', 'requirements', 'constraints'] as const).map((k) => (
              <div key={k} className="mt-2">
                <h3 className="text-xs font-semibold uppercase text-mill-400">{k}</h3>
                <ul className="list-disc pl-5 text-sm text-mill-200">{c[k].map((x) => <li key={x}>{x}</li>)}</ul>
              </div>
            ))}
          </details>
        ))}

      <ol className="mt-4 space-y-4">
        {shown.map((q) => (
          <li key={q.id} id={q.id} className="rounded-lg border border-mill-700 bg-mill-900 p-4">
            <div className="flex flex-wrap gap-1 text-[11px]">
              <span className="rounded bg-mill-700 px-1.5 font-mono">{q.id}</span>
              <span className="rounded bg-mill-700 px-1.5">{formatLabel[q.format]}</span>
              <span className="rounded bg-mill-700 px-1.5">Difficulty {q.difficulty}</span>
              <span className="rounded bg-mill-700 px-1.5">{machineById.get(q.machineId)?.themedName}</span>
              {q.bulletIds.map((b) => (
                <span key={b} className="rounded bg-mill-700 px-1.5" title={findBullet(b)?.bullet.text}>{b}</span>
              ))}
              {q.placement && <span className="rounded bg-weld/25 px-1.5 text-weld">Placement</span>}
              {q.preview && <span className="rounded bg-indigo-thread/30 px-1.5 text-indigo-200">Preview</span>}
              {q.trapPairId && <span className="rounded bg-madder/30 px-1.5">Trap: {q.trapPairId}</span>}
              {q.caseStudyId && <span className="rounded bg-indigo-thread/30 px-1.5">Case: {q.caseStudyId}</span>}
            </div>
            <p className="mt-2 whitespace-pre-line text-sm text-mill-50">{q.stem}</p>
            <div className="mt-3">
              <Body q={q} />
            </div>
            <p className="mt-3 text-xs text-mill-400">
              Sources:{' '}
              {q.sources.map((s, i) => (
                <a key={s} href={s} target="_blank" rel="noreferrer" className="mr-2 break-all text-brass-300 hover:underline">
                  [{i + 1}] {s.replace('https://learn.microsoft.com/en-us/', '')}
                </a>
              ))}
            </p>
          </li>
        ))}
      </ol>
      {shown.length === 0 && <p className="mt-6 text-sm text-mill-400">No questions match.</p>}
    </div>
  )
}
