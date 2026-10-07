import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AttemptPanel } from './components/AttemptPanel'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { MachineDetail } from './components/MachineDetail'
import { MillMap } from './components/MillMap'
import { allLabs, labById, labsForMachine } from './content/labs'
import { completeLab, drawDebrief, exportLabNotes, labXp, recordDebrief, setProblem, setStepDone, setTrialStart } from './game/labs'
import { dayKey } from './game/time'
import type { WeakLinks } from './components/weak/WeakSpots'
import { dailyQueue, maintenance, maintenanceSet, recordReview } from './game/review'
import { bulletScores, trapMisses, weakSpots } from './game/weak'
import { chooseCase, drawMock, finishMock, leaveCase, remainingMs, setMockResponse, startMock, toggleMark } from './game/mock'
import { caseStudies } from './content/questions'
import { allPuzzles, puzzleById, puzzlesFor } from './content/puzzles'
import { allQuestions } from './content/questions'
import type { Question } from './content/questions/types'
import { edges } from './data/edges'
import { machineById, machines } from './data/machines'
import { millGraph } from './data/mill'
import { outline } from './data/outline'
import { drawFor, machinePool, placementPool } from './game/draw'
import { badges as computeBadges, levelFor, readiness as computeReadiness, streak as computeStreak, totalXp } from './game/progress'
import { recordPuzzle } from './game/puzzles'
import { makeRandom, shortMockMode } from './game/random'
import { hashString, mulberry32, newAttemptSeed, shuffleForAttempt } from './game/shuffle'
import { allStates, beginPlacement, canAttempt, isPlaced, openNotes, recordAttempt } from './game/state'
import { shuffleForPlay } from './puzzles/play'
import type { PuzzleInstance } from './puzzles/types'
import { newSave, type AttemptKind, type Save } from './save/schema'
import { backupSave, loadSave, writeSave, type LoadResult } from './save/storage'
import { requestPersistence, type PersistStatus } from './save/backup'
import { BackupBanner, UpdateBanner } from './components/Banners'
import { CloseIcon } from './components/icons'

// Dialogs and panels load on first use, so the first screen stays small.
const Badges = lazy(() => import('./components/Badges').then((m) => ({ default: m.Badges })))
const Glossary = lazy(() => import('./components/Glossary').then((m) => ({ default: m.Glossary })))
const PuzzlePanel = lazy(() => import('./components/puzzles/PuzzlePanel').then((m) => ({ default: m.PuzzlePanel })))
const LabsPage = lazy(() => import('./components/labs/LabsPage').then((m) => ({ default: m.LabsPage })))
const ReviewPage = lazy(() => import('./components/review/ReviewPage').then((m) => ({ default: m.ReviewPage })))
const WeakSpots = lazy(() => import('./components/weak/WeakSpots').then((m) => ({ default: m.WeakSpots })))
const MockCenter = lazy(() => import('./components/mock/MockCenter').then((m) => ({ default: m.MockCenter })))
const MockExam = lazy(() => import('./components/mock/MockExam').then((m) => ({ default: m.MockExam })))
const AnswerKey = lazy(() => import('./review/ReviewPage').then((m) => ({ default: m.ReviewPage })))
const Settings = lazy(() => import('./components/Settings').then((m) => ({ default: m.Settings })))

const questionsById = new Map(allQuestions.map((q) => [q.id, q]))
/** Everything the answer log can refer to: questions and puzzles (both carry difficulty and bullets). */
const scorables = new Map<string, { difficulty: 1 | 2 | 3; bulletIds: string[] }>([...questionsById, ...allPuzzles.map((p) => [p.meta.id, p.meta] as const)])

interface Play {
  key: number
  instance: PuzzleInstance
}

interface Debrief {
  key: number
  labId: string
  questions: Question[]
}

interface ReviewSession {
  key: number
  heading: string
  questions: Question[]
}

interface Attempt {
  key: number
  machineId: string
  kind: AttemptKind
  questions: Question[]
}

export default function App({ loaded }: { loaded?: LoadResult } = {}) {
  const [initial] = useState<LoadResult>(() => loaded ?? loadSave({ knownMachineIds: machineById.keys() }))
  const [save, setSave] = useState(initial.save)
  const saveRef = useRef(save)
  const [rand] = useState(() => makeRandom())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusPairId, setFocusPairId] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'glossary' | 'settings' | 'badges' | 'labs' | 'review' | 'weak' | 'mock' | null>(null)
  const [clock, setClock] = useState(() => Date.now())
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null)
  const [examOpen, setExamOpen] = useState(() => !!initial.save.activeMock)
  const [mockShowId, setMockShowId] = useState<string | null>(null)
  const [labId, setLabId] = useState<string | null>(null)
  const [today, setToday] = useState(() => dayKey(new Date()))
  const [debrief, setDebrief] = useState<Debrief | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [play, setPlay] = useState<Play | null>(null)
  const [persist, setPersist] = useState<PersistStatus | null>(null)
  const [exportTick, setExportTick] = useState(0)
  const [answerKey, setAnswerKey] = useState(false)
  const [notice, setNotice] = useState(
    initial.status === 'recovered' ? 'Your saved progress could not be read, so a new mill was opened. The old save was kept as a backup.' : null,
  )

  useEffect(() => {
    saveRef.current = save
    writeSave(save)
  }, [save])

  // Ask the browser to keep this site's storage (shown in Settings).
  useEffect(() => {
    let live = true
    void requestPersistence().then((p) => live && setPersist(p))
    return () => {
      live = false
    }
  }, [])

  /** Opening a machine's panel shows its notes; the first time is recorded (needed before its start-up check). */
  const select = useCallback((id: string | null, pairId: string | null = null) => {
    setFocusPairId(pairId)
    setSelectedId(id)
    if (id) setSave((s) => openNotes(s, id))
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || attempt || play || debrief || reviewSession || examOpen) return
      if (answerKey) setAnswerKey(false)
      else if (dialog) setDialog(null)
      else select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dialog, attempt, play, debrief, reviewSession, examOpen, answerKey, select])

  const states = useMemo(() => allStates(millGraph, save), [save])
  const placedIds = useMemo(() => new Set(machines.filter((m) => isPlaced(save, m.id)).map((m) => m.id)), [save])
  // Lab completions add a fixed amount of XP each (self-reported, never certifying).
  const level = useMemo(() => levelFor(totalXp(save.answers, scorables) + labXp(save)), [save])
  const streak = useMemo(() => computeStreak(save.answers), [save.answers])
  const readiness = useMemo(() => computeReadiness(save.answers, scorables, outline), [save.answers])
  const badgeList = useMemo(() => computeBadges(save, machines, millGraph), [save])
  // The queue's top-up order is seeded by the day, so it is stable within a day and doesn't consume the app's draws.
  const queue = useMemo(() => {
    const now = new Date(clock)
    return dailyQueue(save.answers, allQuestions, outline, now, { rand: mulberry32(hashString(dayKey(now))) })
  }, [save.answers, clock])
  const maintenanceById = useMemo(
    () => new Map(machines.map((m) => [m.id, maintenance(m.id, states.get(m.id) === 'certified', save.answers, questionsById)])),
    [save.answers, states],
  )
  const maintenanceIds = useMemo(() => new Set([...maintenanceById].filter(([, v]) => v.needed).map(([k]) => k)), [maintenanceById])
  const weak = useMemo(() => weakSpots(bulletScores(save.answers, questionsById, outline)), [save.answers])
  const traps = useMemo(() => trapMisses(save.answers, questionsById), [save.answers])
  /** Questions of the mock in progress, shuffled with its stored seed so a reload shows the same order. */
  const mockQuestions = useMemo(() => {
    const a = save.activeMock
    if (!a) return new Map<string, Question>()
    return new Map([...a.caseIds, ...a.mainIds].map((id) => [id, shuffleForAttempt(questionsById.get(id)!, a.seed)] as const))
  }, [save.activeMock])

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

  const startPuzzle = useCallback(
    (puzzleId: string) => {
      const puzzle = puzzleById.get(puzzleId)
      if (!puzzle) return
      const seed = rand === Math.random ? newAttemptSeed() : Math.floor(rand() * 0xffffffff)
      setPlay((p) => ({ key: (p?.key ?? 0) + 1, instance: shuffleForPlay(puzzle.build(seed), seed) }))
    },
    [rand],
  )

  const bench = useMemo(() => {
    if (!selectedId) return []
    return puzzlesFor(selectedId).map((p) => {
      const plays = save.answers.filter(([id, , , code]) => id === p.meta.id && code === 'z')
      const last = plays.at(-1)
      return { meta: p.meta, plays: plays.length, ...(last ? { last: last[1] === 1 } : {}) }
    })
  }, [selectedId, save.answers])

  const update = useCallback((change: (s: Save) => Save) => {
    const next = change(saveRef.current)
    saveRef.current = next
    setSave(next)
  }, [])

  const openLab = useCallback((id: string | null) => {
    setToday(dayKey(new Date()))
    setLabId(id)
    setDialog('labs')
  }, [])

  const startDebrief = useCallback(
    (id: string) => {
      const lab = labById.get(id)
      if (!lab || !saveRef.current.labs[id]?.completedAt) return
      const seed = rand === Math.random ? newAttemptSeed() : Math.floor(rand() * 0xffffffff)
      const drawn = drawDebrief(lab, allQuestions, rand)
      setDebrief((d) => ({ key: (d?.key ?? 0) + 1, labId: id, questions: drawn.map((q) => shuffleForAttempt(q, seed)) }))
    },
    [rand],
  )

  const openDialog = useCallback((d: 'review' | 'weak' | 'mock') => {
    setClock(Date.now())
    setDialog(d)
  }, [])

  const startReview = useCallback(
    (heading: string, qs: Question[]) => {
      if (qs.length === 0) return
      const seed = rand === Math.random ? newAttemptSeed() : Math.floor(rand() * 0xffffffff)
      setReviewSession((r) => ({ key: (r?.key ?? 0) + 1, heading, questions: qs.map((q) => shuffleForAttempt(q, seed)) }))
    },
    [rand],
  )

  const beginMock = useCallback(() => {
    const short = shortMockMode()
    const now = new Date()
    const draw = drawMock({ questions: allQuestions, cases: caseStudies, mocks: saveRef.current.mocks, answers: saveRef.current.answers, outline, now, rand, short })
    const seed = rand === Math.random ? newAttemptSeed() : Math.floor(rand() * 0xffffffff)
    update((s) => startMock(s, draw, seed, now, short))
    setDialog(null)
    setExamOpen(true)
  }, [rand, update])

  const submitMock = useCallback(
    (timedOut: boolean) => {
      const id = saveRef.current.activeMock?.id ?? null
      update((s) => finishMock(s, questionsById, new Date(), timedOut))
      setExamOpen(false)
      setMockShowId(id)
      setClock(Date.now())
      setDialog('mock')
    },
    [update],
  )

  // A mock whose time ran out while the app was closed is submitted on load.
  useEffect(() => {
    const a = saveRef.current.activeMock
    if (a && remainingMs(a) === 0) submitMock(true)
  }, [submitMock])

  const weakLinks = useCallback(
    (bulletId: string): WeakLinks | undefined => {
      const m = machines.find((x) => x.bulletIds.includes(bulletId))
      if (!m) return undefined
      const puzzle = allPuzzles.find((p) => p.meta.bulletIds.includes(bulletId))
      const lab = allLabs.find((l) => l.bulletIds.includes(bulletId))
      const puzzleMachine = puzzle?.meta.machineIds.find((id) => (states.get(id) ?? 'locked') !== 'locked')
      return {
        machineId: m.id,
        machineName: m.themedName,
        ...(puzzle ? { puzzleId: puzzle.meta.id } : {}),
        puzzleOpen: !!puzzleMachine,
        ...(lab ? { labId: lab.id, labTitle: `Lab ${lab.order}` } : {}),
      }
    },
    [states],
  )

  const exportNotes = useCallback(() => {
    const now = new Date()
    const blob = new Blob([exportLabNotes(saveRef.current, allLabs, now)], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fabric-mill-lab-notes-${dayKey(now)}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, [])

  const selected = selectedId ? machineById.get(selectedId) : undefined
  const attemptMachine = attempt ? machineById.get(attempt.machineId) : undefined
  const debriefLab = debrief ? labById.get(debrief.labId) : undefined

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
      <UpdateBanner />
      <BackupBanner save={save} exportTick={exportTick} />
      <Header
        machines={machines}
        states={states}
        level={level}
        streak={streak}
        readiness={readiness}
        badgesEarned={badgeList.filter((b) => b.earnedAt).length}
        onOpenGlossary={() => setDialog('glossary')}
        onOpenLabs={() => openLab(null)}
        dueCount={queue.dueCount}
        onOpenReview={() => openDialog('review')}
        onOpenWeak={() => openDialog('weak')}
        onOpenMock={() => openDialog('mock')}
        mockActive={!!save.activeMock}
        onOpenBadges={() => setDialog('badges')}
        onOpenSettings={() => setDialog('settings')}
      />
      <main>
        <MillMap
          machines={machines}
          edges={edges}
          graph={millGraph}
          states={states}
          selectedId={selectedId}
          placedIds={placedIds}
          maintenanceIds={maintenanceIds}
          onSelect={(id) => select(id)}
        />
        <Legend />
      </main>
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
          bench={bench}
          onPuzzle={(id) => {
            if ((states.get(selected.id) ?? 'locked') !== 'locked') startPuzzle(id)
          }}
          labs={labsForMachine(selected.id)}
          labProgress={save.labs}
          onOpenLab={(id) => openLab(id)}
          maintenance={
            maintenanceIds.has(selected.id)
              ? { accuracy: maintenanceById.get(selected.id)!.accuracy ?? 0, answers: maintenanceById.get(selected.id)!.answers }
              : null
          }
          onMaintenance={() => startReview(`Maintenance: ${selected.themedName}`, maintenanceSet(selected.id, allQuestions, save.answers, new Date(), rand))}
          onAttempt={(kind) => startAttempt(selected.id, kind)}
          onSelect={(id) => select(id)}
          onClose={() => select(null)}
        />
      )}
      <Suspense fallback={null}>
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
      {play && (
        <PuzzlePanel
          key={play.key}
          instance={play.instance}
          onSubmit={(correct) => {
            const next = recordPuzzle(saveRef.current, play.instance.meta.id, correct)
            saveRef.current = next
            setSave(next)
          }}
          onReplay={() => startPuzzle(play.instance.meta.id)}
          onClose={() => setPlay(null)}
          onOpenPair={(machineId, pairId) => {
            setPlay(null)
            select(machineId, pairId)
          }}
        />
      )}
      {dialog === 'labs' && (
        <LabsPage
          labs={allLabs}
          save={save}
          today={today}
          machinesById={machineById}
          labId={labId}
          onOpenLab={setLabId}
          onTrialStart={(day) => update((s) => setTrialStart(s, day))}
          onToggleStep={(lab, step, done) => update((s) => setStepDone(s, lab, step, done))}
          onProblem={(lab, step, text) => update((s) => setProblem(s, lab, step, text))}
          onComplete={(id) => {
            const lab = labById.get(id)
            if (!lab) return
            const r = completeLab(saveRef.current, lab)
            if (r.ok) update(() => r.save)
          }}
          onDebrief={startDebrief}
          onExport={exportNotes}
          onOpenPair={(machineId, pairId) => {
            setDialog(null)
            select(machineId, pairId)
          }}
          onOpenMachine={(id) => {
            setDialog(null)
            select(id)
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {reviewSession && (
        <AttemptPanel
          key={`review-${reviewSession.key}`}
          machine={machineById.get(reviewSession.questions[0]!.machineId)!}
          kind="review"
          heading={reviewSession.heading}
          questions={reviewSession.questions}
          onSubmit={(correct) => {
            update((s) => recordReview(s, reviewSession.questions.map((q) => q.id), correct))
            setClock(Date.now())
            return correct.every(Boolean) ? 'passed' : 'failed'
          }}
          onClose={() => setReviewSession(null)}
          onOpenPair={(machineId, pairId) => {
            setReviewSession(null)
            setDialog(null)
            select(machineId, pairId)
          }}
        />
      )}
      {dialog === 'review' && (
        <ReviewPage
          queue={queue}
          maintenance={machines.filter((m) => maintenanceIds.has(m.id)).map((m) => ({ machine: m, status: maintenanceById.get(m.id)! }))}
          onStart={() => {
            setDialog(null)
            startReview('Daily review', [...queue.due, ...queue.topUp])
          }}
          onMaintenance={(id) => {
            setDialog(null)
            startReview(`Maintenance: ${machineById.get(id)!.themedName}`, maintenanceSet(id, allQuestions, save.answers, new Date(), rand))
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'weak' && (
        <WeakSpots
          ranked={weak.ranked}
          notEnoughData={weak.notEnoughData}
          traps={traps}
          linksFor={weakLinks}
          onNotes={(id) => {
            setDialog(null)
            select(id)
          }}
          onPuzzle={(id) => {
            setDialog(null)
            startPuzzle(id)
          }}
          onLab={(id) => openLab(id)}
          onPair={(machineId, pairId) => {
            setDialog(null)
            select(machineId, pairId)
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog === 'mock' && (
        <MockCenter
          save={save}
          questions={questionsById}
          cases={caseStudies}
          showId={mockShowId}
          nextRepeatsCase={chooseCase(caseStudies, save.mocks).repeat}
          now={clock}
          onStart={beginMock}
          onResume={() => {
            setDialog(null)
            setExamOpen(true)
          }}
          onOpenPair={(machineId, pairId) => {
            setDialog(null)
            select(machineId, pairId)
          }}
          onClose={() => {
            setMockShowId(null)
            setDialog(null)
          }}
        />
      )}
      {examOpen && save.activeMock && (
        <MockExam
          active={save.activeMock}
          questions={mockQuestions}
          caseStudy={caseStudies.find((c) => c.id === save.activeMock!.caseStudyId)}
          onResponse={(id, r) => update((s) => setMockResponse(s, id, r))}
          onMark={(id) => update((s) => toggleMark(s, id))}
          onLeaveCase={() => update((s) => leaveCase(s))}
          onSubmit={submitMock}
          onExit={() => setExamOpen(false)}
        />
      )}
      {debrief && debriefLab && (
        <AttemptPanel
          key={`debrief-${debrief.key}`}
          machine={machineById.get(debriefLab.machineIds[0]!)!}
          kind="debrief"
          heading={`Lab ${debriefLab.order}: ${debriefLab.title}`}
          questions={debrief.questions}
          onSubmit={(correct) => {
            update((s) => recordDebrief(s, debrief.questions.map((q) => q.id), correct))
            return correct.every(Boolean) ? 'passed' : 'failed'
          }}
          onClose={() => setDebrief(null)}
          onOpenPair={(machineId, pairId) => {
            setDebrief(null)
            setDialog(null)
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
          persist={persist}
          onExported={() => setExportTick((t) => t + 1)}
          onOpenAnswerKey={() => {
            setDialog(null)
            setAnswerKey(true)
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {answerKey && (
        <div role="dialog" aria-modal="true" aria-label="Question bank and answer key" className="fixed inset-0 z-40 overflow-y-auto bg-mill-950">
          <div className="sticky top-0 z-10 flex justify-end border-b border-mill-700 bg-mill-950/95 p-3">
            <button type="button" onClick={() => setAnswerKey(false)} className="flex items-center gap-1 rounded-lg border border-mill-600 px-3 py-1.5 text-sm text-mill-200 hover:border-brass-400">
              <CloseIcon className="size-4" /> Back to the mill
            </button>
          </div>
          <AnswerKey />
        </div>
      )}
      </Suspense>
    </div>
  )
}
