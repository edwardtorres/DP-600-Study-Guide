import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AttemptPanel } from './components/AttemptPanel'
import { Badges } from './components/Badges'
import { Glossary } from './components/Glossary'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { MachineDetail } from './components/MachineDetail'
import { MillMap } from './components/MillMap'
import { Settings } from './components/Settings'
import { allQuestions } from './content/questions'
import type { Question } from './content/questions/types'
import { edges } from './data/edges'
import { machineById, machines } from './data/machines'
import { millGraph } from './data/mill'
import { outline } from './data/outline'
import { drawFor, machinePool, placementPool } from './game/draw'
import { badges as computeBadges, levelFor, readiness as computeReadiness, streak as computeStreak, totalXp } from './game/progress'
import { makeRandom } from './game/random'
import { newAttemptSeed, shuffleForAttempt } from './game/shuffle'
import { allStates, beginPlacement, canAttempt, isPlaced, openNotes, recordAttempt } from './game/state'
import { newSave, type AttemptKind, type Save } from './save/schema'
import { backupSave, loadSave, writeSave, type LoadResult } from './save/storage'

const questionsById = new Map(allQuestions.map((q) => [q.id, q]))

interface Attempt {
  key: number
  machineId: string
  kind: AttemptKind
  questions: Question[]
}

export default function App() {
  const [initial] = useState<LoadResult>(() => loadSave({ knownMachineIds: machineById.keys() }))
  const [save, setSave] = useState(initial.save)
  const saveRef = useRef(save)
  const [rand] = useState(() => makeRandom())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusPairId, setFocusPairId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'glossary' | 'settings' | 'badges' | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [notice, setNotice] = useState(
    initial.status === 'recovered' ? 'Your saved progress could not be read, so a new mill was opened. The old save was kept as a backup.' : null,
  )

  useEffect(() => {
    saveRef.current = save
    writeSave(save)
  }, [save])

  /** Opening a machine's panel shows its notes; the first time is recorded (needed before its start-up check). */
  const select = useCallback((id: string | null, pairId: string | null = null) => {
    setFocusPairId(pairId)
    setSelectedId(id)
    if (id) setSave((s) => openNotes(s, id))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || attempt) return
      if (dialog) setDialog(null)
      else select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, attempt, select])

  const states = useMemo(() => allStates(millGraph, save), [save])
  const placedIds = useMemo(() => new Set(machines.filter((m) => isPlaced(save, m.id)).map((m) => m.id)), [save])
  const level = useMemo(() => levelFor(totalXp(save.answers, questionsById)), [save.answers])
  const streak = useMemo(() => computeStreak(save.answers), [save.answers])
  const readiness = useMemo(() => computeReadiness(save.answers, questionsById, outline), [save.answers])
  const badgeList = useMemo(() => computeBadges(save, machines, millGraph), [save])

  const startAttempt = useCallback(
    (machineId: string, kind: AttemptKind) => {
      const machine = machineById.get(machineId)
      if (!machine || !canAttempt(kind, machine, millGraph, saveRef.current).ok) return
      const previous = saveRef.current.machines[machineId]?.lastDraw?.[kind] ?? []
      const seed = rand === Math.random ? newAttemptSeed() : Math.floor(rand() * 0xffffffff)
      const drawn = drawFor(kind, machine, allQuestions, previous, rand)
      if (kind === 'placement') {
        // Starting a placement uses the day's attempt, even if it's closed unsubmitted.
        const next = beginPlacement(saveRef.current, machine, millGraph, drawn.map((q) => q.id))
        saveRef.current = next
        setSave(next)
      }
      setAttempt((a) => ({ key: (a?.key ?? 0) + 1, machineId, kind, questions: drawn.map((q) => shuffleForAttempt(q, seed)) }))
    },
    [rand],
  )

  const submitAttempt = useCallback(
    (correct: boolean[]) => {
      if (!attempt) return 'rejected' as const
      const machine = machineById.get(attempt.machineId)!
      const { save: next, outcome } = recordAttempt(
        saveRef.current,
        { machineId: attempt.machineId, kind: attempt.kind, questionIds: attempt.questions.map((q) => q.id), correct },
        machine,
        millGraph,
      )
      saveRef.current = next
      setSave(next)
      return outcome
    },
    [attempt],
  )

  const selected = selectedId ? machineById.get(selectedId) : undefined
  const attemptMachine = attempt ? machineById.get(attempt.machineId) : undefined

  return (
    <div className={`min-h-screen px-4 py-6 sm:px-8 ${selected ? 'md:pr-[472px] lg:pr-[592px]' : ''}`}>
      {notice && (
        <div role="status" className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-madder/60 bg-madder/15 p-3 text-sm text-mill-50">
          {notice}
          <button type="button" className="text-mill-400 hover:text-mill-50" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
      <Header
        machines={machines}
        states={states}
        level={level}
        streak={streak}
        readiness={readiness}
        badgesEarned={badgeList.filter((b) => b.earnedAt).length}
        onOpenGlossary={() => setDialog('glossary')}
        onOpenBadges={() => setDialog('badges')}
        onOpenSettings={() => setDialog('settings')}
      />
      <MillMap
        machines={machines}
        edges={edges}
        graph={millGraph}
        states={states}
        selectedId={selectedId}
        placedIds={placedIds}
        onSelect={(id) => select(id)}
      />
      <Legend />
      {selected && (
        <MachineDetail
          machine={selected}
          state={states.get(selected.id) ?? 'locked'}
          graph={millGraph}
          edges={edges}
          machinesById={machineById}
          states={states}
          placed={placedIds.has(selected.id)}
          availability={{
            startup: canAttempt('startup', selected, millGraph, save),
            inspection: canAttempt('inspection', selected, millGraph, save),
            placement: canAttempt('placement', selected, millGraph, save),
          }}
          poolSizes={{ inspection: machinePool(selected.id, allQuestions).length, placement: placementPool(selected.id, allQuestions).length }}
          focusPairId={focusPairId}
          onAttempt={(kind) => startAttempt(selected.id, kind)}
          onSelect={(id) => select(id)}
          onClose={() => select(null)}
        />
      )}
      {attempt && attemptMachine && (
        <AttemptPanel
          key={attempt.key}
          machine={attemptMachine}
          kind={attempt.kind}
          questions={attempt.questions}
          onSubmit={submitAttempt}
          onRetry={() => startAttempt(attempt.machineId, attempt.kind)}
          retryBlocked={() => {
            const a = canAttempt(attempt.kind, attemptMachine, millGraph, saveRef.current)
            return a.ok ? null : a.reason
          }}
          onClose={() => setAttempt(null)}
          onOpenPair={(machineId, pairId) => {
            setAttempt(null)
            select(machineId, pairId)
          }}
        />
      )}
      {dialog === 'glossary' && (
        <Glossary
          onClose={() => setDialog(null)}
          onSelect={(id) => {
            setDialog(null)
            select(id)
          }}
        />
      )}
      {dialog === 'badges' && <Badges badges={badgeList} onClose={() => setDialog(null)} />}
      {dialog === 'settings' && (
        <Settings
          save={save}
          onImport={(s: Save) => setSave(s)}
          onReset={() => {
            backupSave()
            setSave(newSave())
          }}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
