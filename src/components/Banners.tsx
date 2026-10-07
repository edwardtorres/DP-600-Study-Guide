import { useState, useSyncExternalStore } from 'react'
import { applyUpdate, isUpdateReady, subscribeUpdate } from '../pwa'
import { backupDue, exportSaveFile, readBackupMeta, snooze, writeBackupMeta } from '../save/backup'
import type { Save } from '../save/schema'

const bar = 'mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm text-mill-50'

/** "Back up your save": shown when there's progress and no export in the last 7 days. */
export function BackupBanner({ save, exportTick }: { save: Save; exportTick: number }) {
  const [meta, setMeta] = useState(() => readBackupMeta())
  // Exports made elsewhere (Settings) bump exportTick and update the stored metadata; re-read it.
  const [tick, setTick] = useState(exportTick)
  if (tick !== exportTick) {
    setTick(exportTick)
    setMeta(readBackupMeta())
  }
  if (!backupDue(save, meta)) return null
  return (
    <div role="region" aria-label="Back up your save" className={`${bar} border-brass-500/60 bg-brass-500/10`} data-testid="backup-banner">
      <p className="min-w-0">
        <span className="font-semibold">Back up your progress.</span> You haven’t exported your save in the last 7 days. It lives only in this browser.
      </p>
      <span className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            exportSaveFile(save)
            setMeta(readBackupMeta())
          }}
          className="rounded-lg bg-brass-400 px-3 py-1.5 font-semibold text-mill-950 hover:bg-brass-300"
        >
          Export save
        </button>
        <button
          type="button"
          onClick={() => {
            const next = snooze(readBackupMeta())
            writeBackupMeta(next)
            setMeta(next)
          }}
          className="rounded-lg border border-mill-600 px-3 py-1.5 text-mill-200 hover:border-brass-400"
        >
          Later
        </button>
      </span>
    </div>
  )
}

/** A new deploy has been downloaded in the background; reload to use it. */
export function UpdateBanner() {
  const ready = useSyncExternalStore(subscribeUpdate, isUpdateReady, () => false)
  if (!ready) return null
  return (
    <div role="status" className={`${bar} border-indigo-thread/60 bg-indigo-thread/10`}>
      <p>A new version of Fabric Mill is ready.</p>
      <button type="button" onClick={applyUpdate} className="rounded-lg bg-indigo-thread px-3 py-1.5 font-semibold text-mill-950">
        Reload
      </button>
    </div>
  )
}
