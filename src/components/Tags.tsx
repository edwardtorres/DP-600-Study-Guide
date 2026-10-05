import type { Machine } from '../data/types'

const chip = 'inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide'

export function Tags({ machine }: { machine: Machine }) {
  return (
    <>
      {machine.orientation && <span className={`${chip} bg-mill-600/60 text-mill-200`}>Orientation</span>}
      {machine.pl300 && (
        <span className={`${chip} bg-weld/20 text-weld`}>{machine.pl300.caveat ? 'PL-300 · partial' : 'PL-300'}</span>
      )}
      {machine.labPlatform === 'windows' && <span className={`${chip} bg-indigo-thread/20 text-indigo-200`}>Windows lab</span>}
      {machine.labPlatform === 'mixed' && <span className={`${chip} bg-indigo-thread/20 text-indigo-200`}>Lab · part Windows</span>}
    </>
  )
}
