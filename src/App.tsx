import { useCallback, useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { MachineDetail } from './components/MachineDetail'
import { MillMap } from './components/MillMap'
import { edges } from './data/edges'
import { machineById, machines } from './data/machines'
import { millGraph } from './data/mill'
import { allStates, startMachine } from './game/state'
import { loadSave, writeSave, type LoadResult } from './save/storage'

export default function App() {
  const [initial] = useState<LoadResult>(() => loadSave({ knownMachineIds: machineById.keys() }))
  const [save, setSave] = useState(initial.save)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notice, setNotice] = useState(
    initial.status === 'recovered' ? 'Your saved progress could not be read, so a new mill was opened. The old save was kept as a backup.' : null,
  )

  useEffect(() => {
    writeSave(save)
  }, [save])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const states = useMemo(() => allStates(millGraph, save), [save])
  const onStart = useCallback((id: string) => setSave((s) => startMachine(s, id, millGraph)), [])
  const selected = selectedId ? machineById.get(selectedId) : undefined

  return (
    <div className={`min-h-screen px-4 py-6 sm:px-8 ${selected ? 'md:pr-[452px]' : ''}`}>
      {notice && (
        <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-madder/60 bg-madder/15 p-3 text-sm text-mill-50">
          {notice}
          <button type="button" className="text-mill-400 hover:text-mill-50" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
      <Header machines={machines} states={states} />
      <MillMap machines={machines} edges={edges} graph={millGraph} states={states} selectedId={selectedId} onSelect={setSelectedId} />
      <Legend />
      {selected && (
        <MachineDetail
          machine={selected}
          state={states.get(selected.id) ?? 'locked'}
          graph={millGraph}
          edges={edges}
          machinesById={machineById}
          states={states}
          onStart={onStart}
          onSelect={setSelectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
