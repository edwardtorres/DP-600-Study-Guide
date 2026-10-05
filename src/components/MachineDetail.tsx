import { useEffect, useRef, type ReactNode } from 'react'
import type { Graph } from '../data/graph'
import { notesByMachine } from '../content/notes'
import { findBullet } from '../data/outline'
import type { Edge, Machine, MachineState } from '../data/types'
import type { AttemptAvailability } from '../game/state'
import type { AttemptKind } from '../save/schema'
import { CloseIcon } from './icons'
import { stateBadge, stateLabel } from './stateStyles'
import { NotesView } from './NotesView'
import { Tags } from './Tags'

interface Props {
  machine: Machine
  state: MachineState
  graph: Graph
  edges: Edge[]
  machinesById: Map<string, Machine>
  states: Map<string, MachineState>
  placed: boolean
  availability: Record<AttemptKind, AttemptAvailability>
  /** Lowest-level counts used in the action text. */
  poolSizes: { inspection: number; placement: number }
  focusPairId?: string | null
  onAttempt: (kind: AttemptKind) => void
  onSelect: (id: string) => void
  onClose: () => void
}

const platformText = {
  browser: 'Browser (Windows or Mac)',
  windows: 'Windows only (Power BI Desktop)',
  tbd: 'To be confirmed in Step 6',
} as const

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-mill-700 py-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">{title}</h3>
      {children}
    </section>
  )
}

export function MachineDetail({ machine, state, graph, edges, machinesById, states, placed, availability, poolSizes, focusPairId, onAttempt, onSelect, onClose }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  const panel = useRef<HTMLElement>(null)
  useEffect(() => {
    if (focusPairId) return
    heading.current?.focus()
  }, [machine.id, focusPairId])
  useEffect(() => {
    if (!focusPairId) return
    const el = panel.current?.querySelector<HTMLElement>(`#pair-${CSS.escape(focusPairId)}`)
    if (!el) return
    el.closest('details')?.setAttribute('open', '')
    el.scrollIntoView({ block: 'start' })
    el.focus()
  }, [machine.id, focusPairId])

  const reasonFor = (from: string, to: string) => edges.find((e) => e.from === from && e.to === to)
  const prereqs = graph.prereqs.get(machine.id) ?? []
  const unlocks = graph.unlocks.get(machine.id) ?? []

  const link = (id: string) => {
    const m = machinesById.get(id)!
    const s = states.get(id) ?? 'locked'
    return (
      <button type="button" onClick={() => onSelect(id)} className="group flex w-full items-baseline gap-2 text-left">
        <span className={`shrink-0 rounded px-1.5 py-px text-[10px] font-semibold uppercase ${stateBadge[s]}`}>{stateLabel[s]}</span>
        <span className="font-medium text-mill-50 group-hover:text-brass-300 group-hover:underline">{m.themedName}</span>
        <span className="truncate text-xs text-mill-400">{m.skillName}</span>
      </button>
    )
  }

  return (
    <aside
      ref={panel}
      aria-labelledby="machine-detail-title"
      className="fixed inset-x-0 bottom-0 z-20 max-h-[75vh] overflow-y-auto rounded-t-2xl border-t border-mill-600 bg-mill-900 px-5 pb-8 pt-4 shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] lg:w-[560px] md:rounded-none md:border-l md:border-t-0"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase ${stateBadge[state]}`}>{stateLabel[state]}</span>
          {placed && <span className="ml-1 inline-block rounded bg-weld px-2 py-0.5 text-xs font-semibold uppercase text-mill-950">Placed</span>}
          <h2 id="machine-detail-title" ref={heading} tabIndex={-1} className="mt-2 font-display text-2xl font-bold text-mill-50 outline-none">
            {machine.themedName}
          </h2>
          <p className="text-sm text-brass-300">{machine.skillName}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Tags machine={machine} />
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="Close machine panel" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
          <CloseIcon className="size-5" />
        </button>
      </div>

      <div className="my-4 flex flex-col gap-2" data-testid="machine-actions">
        {state === 'locked' && <p className="text-sm text-mill-400">Certify every prerequisite below to unlock this machine.</p>}
        {state === 'idle' && (
          <>
            <button
              type="button"
              onClick={() => onAttempt('startup')}
              disabled={!availability.startup.ok}
              className="rounded-lg bg-brass-400 px-4 py-2 font-semibold text-mill-950 hover:bg-brass-300 disabled:opacity-40"
            >
              Start-up check (2 questions)
            </button>
            <p className="text-xs text-mill-400">Read the notes below, then get both start-up questions right to start the machine.</p>
          </>
        )}
        {state === 'running' && (
          <>
            <button
              type="button"
              onClick={() => onAttempt('inspection')}
              disabled={!availability.inspection.ok}
              className="rounded-lg bg-indigo-thread px-4 py-2 font-semibold text-mill-950 hover:bg-indigo-200 disabled:opacity-40"
            >
              Take the inspection (5 questions, 4 to pass)
            </button>
            <p className="text-xs text-mill-400" data-testid="inspection-note">
              {availability.inspection.ok
                ? `Drawn from ${poolSizes.inspection} questions on this machine; every exam skill on it is covered.`
                : availability.inspection.reason}
            </p>
          </>
        )}
        {state === 'certified' && (
          <p className="text-sm text-brass-300">{placed ? 'Placed out with a perfect placement check.' : 'Certified by inspection.'}</p>
        )}
        {machine.pl300 && state !== 'certified' && (
          <>
            <button
              type="button"
              onClick={() => onAttempt('placement')}
              disabled={!availability.placement.ok}
              className="rounded-lg border border-weld/70 px-4 py-2 text-sm font-semibold text-weld hover:bg-weld/10 disabled:opacity-40"
            >
              PL-300 placement check (5 questions, all 5 to pass)
            </button>
            <p className="text-xs text-mill-400">
              {availability.placement.ok
                ? `Tests what DP-600 adds beyond PL-300 (${poolSizes.placement} questions in the pool). One attempt per day (it counts once you start), available even while locked.`
                : availability.placement.reason}
            </p>
          </>
        )}
      </div>

      {machine.bulletIds.length > 0 ? (
        <Section title="Exam skills (official outline)">
          <ul className="space-y-2">
            {machine.bulletIds.map((id) => {
              const found = findBullet(id)
              return (
                <li key={id} className="text-sm text-mill-200">
                  <span className="mr-2 font-mono text-xs text-mill-400">{id}</span>
                  {found?.bullet.text}
                  <span className="block text-xs text-mill-400">{found?.domain.title} ({found?.domain.weightText})</span>
                </li>
              )
            })}
          </ul>
        </Section>
      ) : (
        <Section title="Orientation">
          <p className="text-sm text-mill-200">Background the DP-600 outline assumes. It is not an exam bullet itself.</p>
        </Section>
      )}

      {notesByMachine.get(machine.id) ? (
        <NotesView notes={notesByMachine.get(machine.id)!} />
      ) : (
        <Section title="Notes">
          <p className="text-sm italic text-mill-400">Notes for this floor are still being written.</p>
        </Section>
      )}

      {machine.pl300 && (
        <Section title="PL-300 carryover">
          <p className="mb-2 text-sm text-mill-200">Overlaps these PL-300 skills. Notes here will focus on what DP-600 adds.</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-mill-200">
            {machine.pl300.overlaps.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
          {machine.pl300.caveat && <p className="mt-2 text-xs text-weld">{machine.pl300.caveat}</p>}
        </Section>
      )}

      <Section title="Prerequisite threads">
        {prereqs.length === 0 ? (
          <p className="text-sm text-mill-400">None. This is where the mill starts.</p>
        ) : (
          <ul className="space-y-3">
            {prereqs.map((p) => (
              <li key={p}>
                {link(p)}
                <p className="mt-0.5 text-xs text-mill-400">{reasonFor(p, machine.id)?.reason}</p>
                {reasonFor(p, machine.id)?.verified && (
                  <a
                    href={reasonFor(p, machine.id)!.verified!.source}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-brass-300 hover:underline"
                  >
                    ✓ verified on Microsoft Learn
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {unlocks.length > 0 && (
        <Section title="Feeds into">
          <ul className="space-y-2">
            {unlocks.map((u) => (
              <li key={u}>{link(u)}</li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Hands-on lab platform">
        <p className="text-sm text-mill-200">{platformText[machine.labPlatform]}</p>
        {machine.labNote && <p className="mt-1 text-xs text-mill-400">{machine.labNote}</p>}
      </Section>
    </aside>
  )
}
