import { lazy, Suspense, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { Legend } from './components/Legend'
import { MillMap } from './components/MillMap'
import { edges } from './data/edges'
import { machineById, machines } from './data/machines'
import { millGraph } from './data/mill'
import { allStates } from './game/state'
import { loadSave, type LoadResult } from './save/storage'
import { ErrorBoundary } from './components/ErrorBoundary'

/**
 * The full game (question bank, notes, puzzles, labs) loads as separate chunks after first paint.
 * The content chunks are imported first, in parallel, so each one evaluates in its own task
 * instead of one long task that would block taps while the game loads.
 */
const App = lazy(async () => {
  await Promise.all([import('./content/questions'), import('./content/notes'), import('./content/puzzles'), import('./content/labs')])
  return import('./App')
})

const noop = () => {}
const placeholderLevel = { level: 1, rank: '', xp: 0, levelStartXp: 0, nextLevelXp: 1 }
const placeholderStreak = { current: 0, best: 0, answeredToday: 0, days: [] }
const placeholderReadiness = { domains: [], overall: null }

/**
 * First paint: the mill map drawn from the save (machine states don't need the
 * content), with the same layout as the game. It's inert (not interactive and
 * hidden from assistive tech) until the game has loaded and replaces it.
 */
function Shell({ loaded }: { loaded: LoadResult }) {
  const states = useMemo(() => allStates(millGraph, loaded.save), [loaded])
  return (
    <div className="min-h-screen px-4 py-6 sm:px-8" inert>
      <Header
        loading
        machines={machines}
        states={states}
        level={placeholderLevel}
        streak={placeholderStreak}
        readiness={placeholderReadiness}
        badgesEarned={0}
        dueCount={0}
        mockActive={!!loaded.save.activeMock}
        onOpenGlossary={noop}
        onOpenLabs={noop}
        onOpenReview={noop}
        onOpenWeak={noop}
        onOpenMock={noop}
        onOpenBadges={noop}
        onOpenSettings={noop}
      />
      <main>
        <MillMap machines={machines} edges={edges} graph={millGraph} states={states} selectedId={null} placedIds={new Set()} maintenanceIds={new Set()} onSelect={noop} />
        <Legend />
      </main>
    </div>
  )
}

export function Boot() {
  const [loaded] = useState<LoadResult>(() => loadSave({ knownMachineIds: machineById.keys() }))
  return (
    <ErrorBoundary>
      <Suspense fallback={<Shell loaded={loaded} />}>
        <App loaded={loaded} />
      </Suspense>
    </ErrorBoundary>
  )
}
