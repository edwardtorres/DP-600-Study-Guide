import type { Lab } from '../../content/labs/types'
import type { LabProgress } from '../../save/schema'
import { labStatus, minutesText } from './labFormat'
import { PlatformBadge, StatusText } from './labUi'

/** The Workshop tab in a machine's panel: the hands-on labs that practise this machine's skills. */
export function Workshop({ labs, progress, onOpenLab }: { labs: Lab[]; progress: Record<string, LabProgress>; onOpenLab: (labId: string) => void }) {
  return (
    <section className="py-4" data-testid="workshop">
      <p className="mb-3 text-xs text-mill-400">
        Hands-on labs in a Fabric trial. Completion is self-reported: it earns XP but never certifies the machine. Each lab ends with a 3-question debrief.
      </p>
      {labs.length === 0 ? (
        <p className="text-sm text-mill-400">No lab practises this machine.</p>
      ) : (
        <ul className="space-y-2">
          {labs.map((lab) => {
            const st = labStatus(lab, progress[lab.id])
            return (
              <li key={lab.id}>
                <button
                  type="button"
                  onClick={() => onOpenLab(lab.id)}
                  data-lab={lab.id}
                  className="w-full rounded-lg border border-mill-600 bg-mill-900 px-3 py-2 text-left text-sm hover:border-brass-500/70"
                >
                  <span className="flex flex-wrap items-center gap-2 text-[11px] text-mill-400">
                    <span className="font-mono font-semibold text-brass-300">Lab {lab.order}</span>
                    <PlatformBadge platform={lab.platform} />
                    <span>{minutesText(lab.minutes)}</span>
                    <span className="ml-auto">
                      <StatusText status={st} />
                    </span>
                  </span>
                  <span className="mt-0.5 block break-words text-mill-50">{lab.title}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
