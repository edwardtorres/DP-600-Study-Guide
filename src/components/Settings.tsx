import { useRef, useState, useSyncExternalStore } from 'react'
import { machineById } from '../data/machines'
import type { Save } from '../save/schema'
import { importSave } from '../save/storage'
import { exportSaveFile, type PersistStatus } from '../save/backup'
import { canPromptInstall, isInstalled, promptInstall, subscribeInstall } from '../pwa'
import { CloseIcon } from './icons'

interface Props {
  save: Save
  onImport: (save: Save) => void
  onReset: () => void
  onClose: () => void
  /** Result of asking the browser to keep this site's storage. */
  persist: PersistStatus | null
  /** Called after an export, so the backup reminder updates. */
  onExported?: () => void
  /** Opens the question bank with its answer key (after the warning). */
  onOpenAnswerKey: () => void
}

const persistText: Record<PersistStatus, string> = {
  persistent: 'Persistent: the browser won’t clear it to free up space.',
  'not-persistent': 'Not persistent: the browser may clear it under storage pressure. Export regularly.',
  unsupported: 'This browser doesn’t support persistent storage. Export regularly.',
}

export function Settings({ save, onImport, onReset, onClose, persist, onExported, onOpenAnswerKey }: Props) {
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, setPending] = useState<Save | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [confirmKey, setConfirmKey] = useState(false)
  const installable = useSyncExternalStore(subscribeInstall, canPromptInstall, () => false)
  const file = useRef<HTMLInputElement>(null)

  const doExport = () => {
    exportSaveFile(save)
    onExported?.()
    setMessage({ kind: 'ok', text: 'Save exported.' })
  }

  const readFile = async (f: File | undefined) => {
    if (!f) return
    const result = importSave(await f.text(), machineById.keys())
    if (result.ok) {
      setPending(result.save)
      setMessage({ kind: 'ok', text: `Valid save with ${Object.keys(result.save.machines).length} machines and ${result.save.answers.length} answers. Replace your current progress?` })
    } else {
      setPending(null)
      setMessage({ kind: 'error', text: `Import failed: ${result.error}. Nothing was changed.` })
    }
    if (file.current) file.current.value = ''
  }

  const button = 'rounded-lg border border-mill-600 px-4 py-2 text-sm text-mill-50 hover:border-brass-400'

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="fixed inset-0 z-30 flex items-start justify-center overflow-y-auto bg-mill-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-mill-600 bg-mill-900">
        <div className="flex items-center justify-between border-b border-mill-700 p-4">
          <h2 id="settings-title" className="font-display text-xl font-bold text-mill-50">
            Settings
          </h2>
          <button type="button" onClick={onClose} aria-label="Close settings" className="rounded p-1 text-mill-400 hover:bg-mill-800 hover:text-mill-50">
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="space-y-5 p-4 text-sm text-mill-200">
          <section>
            <h3 className="mb-1 font-semibold text-mill-50">Export your save</h3>
            <p className="mb-2 text-xs text-mill-400">Downloads your progress and answer history as a JSON file.</p>
            <button type="button" onClick={doExport} className={button}>
              Export save
            </button>
          </section>
          <section data-testid="storage-section">
            <h3 className="mb-1 font-semibold text-mill-50">Keeping your progress</h3>
            <p className="text-xs text-mill-400" data-testid="persist-status">
              Storage: {persist === null ? 'checking…' : persistText[persist]}
            </p>
            <p className="mt-1 text-xs text-mill-400">
              Safari may delete a site’s data if you don’t use it for a while. Installing Fabric Mill to your Home Screen and exporting your save regularly protect your
              progress.
            </p>
          </section>
          <section data-testid="install-section">
            <h3 className="mb-1 font-semibold text-mill-50">Install the app</h3>
            {isInstalled() ? (
              <p className="text-xs text-mill-400">Fabric Mill is installed and works offline.</p>
            ) : (
              <>
                <p className="text-xs text-mill-400">Installed, it opens like an app and works offline after your first visit.</p>
                <p className="mt-2 text-xs font-semibold text-mill-200">Install on iPhone or iPad (Safari)</p>
                <ol className="ml-4 list-decimal text-xs text-mill-400">
                  <li>Tap the Share button (the square with an arrow pointing up).</li>
                  <li>Scroll down and tap Add to Home Screen.</li>
                  <li>Tap Add.</li>
                </ol>
                {installable && (
                  <button type="button" onClick={() => void promptInstall()} className={`${button} mt-2`}>
                    Install Fabric Mill
                  </button>
                )}
              </>
            )}
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-mill-50">Import a save</h3>
            <p className="mb-2 text-xs text-mill-400">The file is checked before anything changes. Older save versions are upgraded.</p>
            <label className={`${button} inline-block cursor-pointer`}>
              Choose file…
              <input ref={file} type="file" accept="application/json,.json" className="sr-only" aria-label="Import save file" onChange={(e) => void readFile(e.target.files?.[0])} />
            </label>
            {pending && (
              <button
                type="button"
                onClick={() => {
                  onImport(pending)
                  setPending(null)
                  setMessage({ kind: 'ok', text: 'Save imported.' })
                }}
                className="ml-2 rounded-lg bg-brass-400 px-4 py-2 text-sm font-semibold text-mill-950"
              >
                Replace progress
              </button>
            )}
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-mill-50">Reset progress</h3>
            <p className="mb-2 text-xs text-mill-400">Starts a new mill. Your current save is kept as a backup in this browser first.</p>
            {!confirmReset ? (
              <button type="button" onClick={() => setConfirmReset(true)} className={`${button} border-madder/60 text-madder`}>
                Reset progress…
              </button>
            ) : (
              <div className="rounded-lg border border-madder/60 bg-madder/10 p-3">
                <p className="mb-2 text-mill-50">This erases every certification, answer, and streak. Export first if you want to keep them.</p>
                <button
                  type="button"
                  onClick={() => {
                    onReset()
                    setConfirmReset(false)
                    setMessage({ kind: 'ok', text: 'Progress reset.' })
                  }}
                  className="rounded-lg bg-madder-deep px-4 py-2 font-semibold text-mill-50"
                >
                  Yes, reset everything
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="ml-2 text-mill-400 hover:text-mill-50">
                  Cancel
                </button>
              </div>
            )}
          </section>
          <section>
            <h3 className="mb-1 font-semibold text-mill-50">Question bank and answer key</h3>
            {!confirmKey ? (
              <button type="button" onClick={() => setConfirmKey(true)} className={button}>
                Open the question bank…
              </button>
            ) : (
              <div className="rounded-lg border border-weld/60 bg-weld/10 p-3" data-testid="answer-key-warning">
                <p className="mb-2 text-mill-50">The question bank shows every question with its answer. Browsing it makes mocks, inspections, and reviews less meaningful.</p>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmKey(false)
                    onOpenAnswerKey()
                  }}
                  className="rounded-lg bg-weld px-4 py-2 font-semibold text-mill-950"
                >
                  Show the answer key
                </button>
                <button type="button" onClick={() => setConfirmKey(false)} className="ml-2 text-mill-400 hover:text-mill-50">
                  Cancel
                </button>
              </div>
            )}
          </section>
          {message && (
            <p role="status" className={message.kind === 'ok' ? 'text-emerald-300' : 'text-madder'}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
