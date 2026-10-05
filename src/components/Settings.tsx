import { useRef, useState } from 'react'
import { machineById } from '../data/machines'
import type { Save } from '../save/schema'
import { exportSave, importSave } from '../save/storage'
import { CloseIcon } from './icons'

interface Props {
  save: Save
  onImport: (save: Save) => void
  onReset: () => void
  onClose: () => void
}

export function Settings({ save, onImport, onReset, onClose }: Props) {
  const [message, setMessage] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null)
  const [pending, setPending] = useState<Save | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const file = useRef<HTMLInputElement>(null)

  const doExport = () => {
    const blob = new Blob([exportSave(save)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fabric-mill-save-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
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
    <div role="dialog" aria-modal="true" aria-labelledby="settings-title" className="fixed inset-0 z-30 flex items-start justify-center bg-mill-950/80 p-4 backdrop-blur-sm">
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
                  className="rounded-lg bg-madder px-4 py-2 font-semibold text-mill-50"
                >
                  Yes, reset everything
                </button>
                <button type="button" onClick={() => setConfirmReset(false)} className="ml-2 text-mill-400 hover:text-mill-50">
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
