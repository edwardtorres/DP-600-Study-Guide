import type { LabPlatform } from '../../content/labs/types'
import { platformHint, platformLabel, type LabStatus } from './labFormat'

export function PlatformBadge({ platform }: { platform: LabPlatform }) {
  const tone = platform === 'browser' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-indigo-thread/20 text-indigo-200'
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide ${tone}`} title={platformHint[platform]}>
      {platformLabel[platform]}
    </span>
  )
}

export function StatusText({ status }: { status: LabStatus }) {
  if (status.complete) return <span className="text-emerald-300">Complete</span>
  if (status.done === 0) return <span className="text-mill-400">Not started</span>
  return (
    <span className="text-brass-300">
      {status.done}/{status.total} steps
    </span>
  )
}
