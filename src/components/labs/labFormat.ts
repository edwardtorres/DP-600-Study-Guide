import type { Lab, LabPlatform } from '../../content/labs/types'
import { requiredStepIds } from '../../game/labs'
import type { LabProgress } from '../../save/schema'

export const platformLabel: Record<LabPlatform, string> = {
  browser: 'Browser',
  windows: 'Windows',
  mixed: 'Browser + Windows',
}

export const platformHint: Record<LabPlatform, string> = {
  browser: 'Runs in a browser on Windows or Mac.',
  windows: 'Needs Power BI Desktop (and for some steps SSMS), which run on Windows.',
  mixed: 'Most steps run in a browser; steps marked Windows need Power BI Desktop.',
}

export const minutesText = (m: number) => (m < 60 ? `${m} min` : `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}`)

/** "Learn · fabric-trial › increase-trial-capacity" or "Lab exercise · 01-lakehouse › upload-a-file". */
export function sourceLabel(url: string): string {
  const [page = '', frag] = url.split('#')
  const ml = page.match(/microsoftlearning\.github\.io\/.*\/Labs\/([^/]+)\.html$/)
  const name = ml ? ml[1]! : (page.split('?')[0]!.split('/').filter(Boolean).at(-1) ?? page)
  return `${ml ? 'Lab exercise' : 'Learn'} · ${name}${frag ? ` › ${frag.replace(/-/g, ' ')}` : ''}`
}

export interface LabStatus {
  done: number
  total: number
  required: number
  requiredDone: number
  complete: boolean
  problems: number
}

export function labStatus(lab: Lab, p: LabProgress | undefined): LabStatus {
  const all = [...lab.steps, ...lab.cleanup]
  const req = requiredStepIds(lab)
  return {
    done: all.filter((s) => p?.steps[s.id]).length,
    total: all.length,
    required: req.length,
    requiredDone: req.filter((id) => p?.steps[id]).length,
    complete: !!p?.completedAt,
    problems: Object.keys(p?.problems ?? {}).length,
  }
}
