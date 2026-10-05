import type { Badge } from '../game/progress'
import { CloseIcon, SealIcon } from './icons'

const when = (s: string) => (s.length === 10 ? s : new Date(s).toLocaleDateString())

export function Badges({ badges, onClose }: { badges: Badge[]; onClose: () => void }) {
  const earned = badges.filter((b) => b.earnedAt).length
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="badges-title" className="fixed inset-0 z-30 flex items-start justify-center bg-mill-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-full w-full max-w-lg flex-col rounded-xl border border-mill-600 bg-mill-900">
        <div className="flex items-center justify-between border-b border-mill-700 p-4">
          <h2 id="badges-title" className="font-display text-xl font-bold text-mill-50">
            Badges <span className="font-sans text-sm font-normal text-mill-400">({earned} of {badges.length})</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close badges" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <ul className="space-y-2 overflow-y-auto p-4">
          {badges.map((b) => (
            <li key={b.id} className={`flex items-start gap-3 rounded-lg border p-3 ${b.earnedAt ? 'border-brass-400/60 bg-brass-500/10' : 'border-mill-700 opacity-60'}`}>
              <SealIcon className={`mt-0.5 size-6 shrink-0 ${b.earnedAt ? 'text-brass-300' : 'text-mill-600'}`} />
              <div>
                <p className="font-semibold text-mill-50">{b.name}</p>
                <p className="text-xs text-mill-200">{b.description}</p>
                <p className="text-[11px] text-mill-400">{b.earnedAt ? `Earned ${when(b.earnedAt)}` : 'Not earned yet'}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
