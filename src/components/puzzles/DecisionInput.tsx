import type { Decision } from '../../puzzles/types'
import { DataTableView, type NullStyle } from './DataTableView'

const optionBox =
  'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brass-300'
const optionIdle = 'border-mill-600 bg-mill-900 hover:border-brass-500/70'
const optionOn = 'border-brass-400 bg-brass-500/15'

interface Props {
  decision: Decision
  value: string | undefined
  onChange: (value: string) => void
  nullStyle?: NullStyle
}

/** One decision, by tap or keyboard: a radio group, a native drop-down, or a toggle button. */
export function DecisionInput({ decision: d, value, onChange, nullStyle }: Props) {
  if (d.ui === 'toggle') {
    const on = value === 'yes'
    return (
      <button
        type="button"
        aria-pressed={on}
        data-toggle={d.id}
        onClick={() => onChange(on ? 'no' : 'yes')}
        className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm ${on ? optionOn : optionIdle}`}
      >
        <span className="min-w-0 break-words text-mill-50">{d.prompt}</span>
        <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${on ? 'bg-brass-400 text-mill-950' : 'border border-mill-600 text-mill-400'}`}>
          {on ? d.choices.find((c) => c.id === 'yes')?.label : d.choices.find((c) => c.id === 'no')?.label}
        </span>
      </button>
    )
  }
  if (d.ui === 'select') {
    return (
      <label className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
        <span className="text-mill-50">{d.prompt}</span>
        <select
          data-decision-select={d.id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-10 w-full rounded-lg border border-mill-600 bg-mill-900 px-2 py-1.5 text-mill-50 sm:w-64"
        >
          <option value="" disabled>
            Choose…
          </option>
          {d.choices.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
    )
  }
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm text-mill-50">{d.prompt}</legend>
      {d.choices.map((c) => {
        const on = value === c.id
        return (
          <label key={c.id} data-choice={c.id} className={`${optionBox} ${on ? optionOn : optionIdle} ${c.table ? 'flex-col' : ''}`}>
            <input type="radio" name={`d-${d.id}`} className="sr-only" checked={on} onChange={() => onChange(c.id)} />
            <span className="min-w-0 break-words font-semibold text-mill-50">{c.label}</span>
            {c.table && <DataTableView table={c.table} nullStyle={nullStyle} caption={false} />}
          </label>
        )
      })}
    </fieldset>
  )
}
