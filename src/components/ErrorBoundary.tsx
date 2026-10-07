import { Component, type ErrorInfo, type ReactNode } from 'react'
import { exportRawSave } from '../save/backup'

interface State {
  error: Error | null
  exported: boolean | null
}

/**
 * Top-level crash screen (Step 9). It offers the raw stored save as a download,
 * read straight from localStorage so it works whatever state the app is in.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null, exported: null }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Fabric Mill crashed', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <main role="alert" className="mx-auto max-w-lg px-4 py-16 text-mill-50">
        <h1 className="font-display text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-sm text-mill-200">
          The mill hit an unexpected error. Your progress is still stored in this browser. Export it first to be safe, then reload.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => this.setState({ exported: exportRawSave() })}
            className="rounded-lg bg-brass-400 px-4 py-2 font-semibold text-mill-950 hover:bg-brass-300"
          >
            Export save
          </button>
          <button type="button" onClick={() => window.location.reload()} className="rounded-lg border border-mill-600 px-4 py-2 text-mill-200 hover:border-brass-400">
            Reload
          </button>
        </div>
        {this.state.exported !== null && (
          <p role="status" className="mt-3 text-sm text-mill-200">
            {this.state.exported ? 'Save exported.' : 'No saved progress was found to export.'}
          </p>
        )}
        <p className="mt-6 text-xs text-mill-400">Details: {this.state.error.message}</p>
      </main>
    )
  }
}
