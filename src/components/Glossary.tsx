import { useEffect, useMemo, useRef, useState } from 'react'
import { allNotes } from '../content/notes'
import { machineById } from '../data/machines'
import { CloseIcon } from './icons'

export function Glossary({ onClose, onSelect }: { onClose: () => void; onSelect: (machineId: string) => void }) {
  const [query, setQuery] = useState('')
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    input.current?.focus()
  }, [])

  const entries = useMemo(
    () =>
      allNotes
        .flatMap((n) => n.glossary.map((g) => ({ ...g, machineId: n.machineId })))
        .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' })),
    [],
  )
  const q = query.trim().toLowerCase()
  const shown = q ? entries.filter((e) => `${e.term} ${e.definition}`.toLowerCase().includes(q)) : entries

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="glossary-title" className="fixed inset-0 z-30 flex justify-center bg-mill-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-xl border border-mill-600 bg-mill-900">
        <div className="flex items-center justify-between gap-3 border-b border-mill-700 p-4">
          <h2 id="glossary-title" className="font-display text-xl font-bold text-mill-50">
            Pattern Dictionary <span className="font-sans text-sm font-normal text-mill-400">({entries.length} terms)</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close glossary" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="p-4 pb-2">
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms…"
            aria-label="Search glossary"
            className="w-full rounded-lg border border-mill-600 bg-mill-950 px-3 py-2 text-sm text-mill-50 placeholder:text-mill-400"
          />
        </div>
        <dl className="space-y-3 overflow-y-auto px-4 pb-4">
          {shown.length === 0 && <p className="text-sm text-mill-400">{entries.length === 0 ? 'Terms arrive as notes are written.' : 'No matches.'}</p>}
          {shown.map((e) => (
            <div key={e.term} className="border-b border-mill-800 pb-2">
              <dt className="font-semibold text-mill-50">{e.term}</dt>
              <dd className="text-sm text-mill-200">
                {e.definition}{' '}
                <button type="button" className="text-xs text-brass-300 hover:underline" onClick={() => onSelect(e.machineId)}>
                  {machineById.get(e.machineId)?.themedName}
                </button>{' '}
                {e.sources.map((u, i) => (
                  <a key={u} href={u} target="_blank" rel="noreferrer" className="text-[10px] text-brass-300 hover:underline">
                    [{i + 1}]
                  </a>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
