import { floors } from '../data/floors'
import { outline } from '../data/outline'
import type { DomainId, Machine, MachineState } from '../data/types'
import type { LevelInfo, Readiness, StreakInfo } from '../game/progress'

interface Props {
  machines: Machine[]
  states: Map<string, MachineState>
  level: LevelInfo
  streak: StreakInfo
  readiness: Readiness
  badgesEarned: number
  onOpenGlossary: () => void
  onOpenBadges: () => void
  onOpenSettings: () => void
}

const domainShort: Record<DomainId, string> = { PREPARE: 'Prepare', SEMANTIC: 'Models', MAINTAIN: 'Maintain' }

function Stats({ level, streak, readiness, badgesEarned, onOpenBadges }: Pick<Props, 'level' | 'streak' | 'readiness' | 'badgesEarned' | 'onOpenBadges'>) {
  const span = level.nextLevelXp - level.levelStartXp
  const into = level.xp - level.levelStartXp
  return (
    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3" data-testid="progress-stats">
      <div className="rounded-lg border border-mill-700 bg-mill-900 p-3">
        <p className="text-sm font-semibold text-mill-50">
          {level.rank} <span className="font-normal text-mill-400">· Level {level.level}</span>
        </p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mill-700" role="progressbar" aria-label="XP to next level" aria-valuemin={0} aria-valuemax={span} aria-valuenow={into}>
          <div className="h-full bg-indigo-thread" style={{ width: `${(into / span) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-mill-400">
          {level.xp} XP · {level.nextLevelXp - level.xp} to level {level.level + 1}
        </p>
      </div>
      <div className="rounded-lg border border-mill-700 bg-mill-900 p-3">
        <p className="text-sm font-semibold text-mill-50">
          Streak {streak.current} {streak.current === 1 ? 'day' : 'days'} <span className="font-normal text-mill-400">· best {streak.best}</span>
        </p>
        <p className="mt-1 text-xs text-mill-400">
          Today {Math.min(streak.answeredToday, 10)}/10 questions{streak.answeredToday >= 10 ? ' ✓' : ''}
        </p>
        <button type="button" onClick={onOpenBadges} className="mt-1 text-xs font-semibold text-brass-300 hover:underline">
          Badges: {badgesEarned} earned →
        </button>
      </div>
      <div
        className="rounded-lg border border-mill-700 bg-mill-900 p-3"
        title="Readiness is your accuracy on your most recent 40 inspection, placement, lab-debrief, and puzzle answers in each domain (at most 10 of them puzzle plays, the most recent), scaled by how many of that domain's exam skills you've answered. Start-up checks don't count, and neither does XP. Overall weights the domains by the official exam percentages."
      >
        <p className="text-sm font-semibold text-mill-50">
          Readiness {readiness.overall === null ? '—' : `${readiness.overall}%`}
        </p>
        <ul className="mt-1 flex flex-wrap gap-x-3 text-xs text-mill-400">
          {readiness.domains.map((d) => (
            <li key={d.domain}>
              {domainShort[d.domain]} {d.score === null ? '—' : `${d.score}%`}
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] text-mill-400">Recent inspection, placement, lab-debrief, and puzzle accuracy (at most 10 puzzle plays) × skills covered, weighted by exam percentages. Start-up checks don't count.</p>
      </div>
    </div>
  )
}

export function Header({ machines, states, level, streak, readiness, badgesEarned, onOpenGlossary, onOpenBadges, onOpenSettings }: Props) {
  return (
    <header className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brass-400">DP-600 · Fabric Analytics Engineer</p>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-mill-50 sm:text-4xl">Fabric Mill</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onOpenGlossary}
            className="rounded-lg border border-brass-500/70 px-3 py-1.5 text-sm font-medium text-brass-300 hover:bg-brass-500/15"
          >
            Pattern Dictionary
          </button>
          <button type="button" onClick={onOpenSettings} className="rounded-lg border border-mill-600 px-3 py-1.5 text-sm text-mill-200 hover:border-brass-400">
            Settings
          </button>
        </div>
      </div>
      <p className="mt-1 max-w-2xl text-sm text-mill-200">
        Weave raw data threads into finished analytics fabric. Each machine is an exam skill. Open a machine's notes, pass its
        start-up check, then pass its inspection to certify it and unlock the machines it feeds. PL-300 carryover machines can be placed out with a 5/5 placement check.
      </p>
      <Stats level={level} streak={streak} readiness={readiness} badgesEarned={badgesEarned} onOpenBadges={onOpenBadges} />
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {floors.map((floor) => {
          const onFloor = machines.filter((m) => m.floor === floor.id)
          const done = onFloor.filter((m) => states.get(m.id) === 'certified').length
          const domain = outline.domains.find((d) => d.id === floor.domain)
          return (
            <li key={floor.id} className="rounded-lg border border-mill-700 bg-mill-900 p-3">
              <p className="truncate text-sm font-semibold text-mill-50">{floor.name}</p>
              <p className="text-xs text-mill-400">{domain ? `${domain.title} · ${domain.weightText}` : 'Orientation'}</p>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full bg-mill-700"
                role="progressbar"
                aria-label={`${floor.name} machines certified`}
                aria-valuemin={0}
                aria-valuemax={onFloor.length}
                aria-valuenow={done}
              >
                <div className="h-full bg-brass-400" style={{ width: `${(done / onFloor.length) * 100}%` }} />
              </div>
              <p className="mt-1 text-xs text-mill-400">
                {done}/{onFloor.length} certified
              </p>
            </li>
          )
        })}
      </ul>
    </header>
  )
}
