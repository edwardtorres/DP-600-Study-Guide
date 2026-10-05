import type { Machine, Outline } from '../../data/types'
import { debriefPool, DEBRIEF_SIZE } from '../../game/labs'
import { pairIndex } from '../pairs'
import { BANNED_TERMS } from '../questions/requirements'
import type { Question } from '../questions/types'
import { machineLabPlatform } from './index'
import type { Lab, LabStep } from './types'

/** Lab steps may cite Learn, or Microsoft's official lab exercises (for lab steps only). */
export const LAB_SOURCE = /^https:\/\/(learn\.microsoft\.com\/en-us\/|microsoftlearning\.github\.io\/mslearn-fabric\/Instructions\/Labs\/)/

/** Features a Fabric trial doesn't include (fabric-trial page). No lab may depend on them. */
export const TRIAL_UNAVAILABLE: RegExp[] = [/copilot/i, /data agent/i, /\bAI functions?\b/i, /AI services/i, /trusted workspace access/i]

/** Things that must never be written into the repo: tenant URLs, connection strings, emails, tokens. */
export const PRIVATE_PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+\.[\w.-]+/, // email address or UPN
  /powerbi:\/\/[\w.-]+\//, // XMLA workspace connection URL
  /\.datawarehouse\.fabric\.microsoft\.com/i, // SQL connection string
  /(app\.fabric|app\.powerbi)\.microsoft\.com\/groups\//i, // workspace URL
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, // GUID (tenant, workspace, or item id)
  /\b(ghp|github_pat)_[A-Za-z0-9_]{10,}/, // GitHub token
  /\b(password|pwd|secret)\s*[=:]/i,
]

/** Numbers a checkpoint may mention: trial facts that don't depend on lab data. */
const CHECKPOINT_NUMBERS = new Set(['4', '60', '64'])

const LAB_ID = /^L\d{2}$/

export function labText(lab: Lab): string[] {
  const step = (s: LabStep) => [s.text, s.checkpoint ?? '', s.trapNote ?? '', s.cost ?? '']
  return [lab.title, lab.goal, lab.before ?? '', ...lab.steps.flatMap(step), ...lab.cleanup.flatMap(step)]
}

export function labSources(labs: Lab[]): string[] {
  return [...new Set(labs.flatMap((l) => [...l.steps, ...l.cleanup].flatMap((s) => s.sources)))].sort()
}

/**
 * Checks every lab: schema, ids, machine and bullet links, prerequisites
 * (existing, earlier, acyclic), sources on every step from the two allowed
 * sites, cleanup present, trap pairs, platform consistency, banned and
 * trial-unavailable terms, private-looking strings, data-free checkpoints,
 * a debrief pool, and bullet coverage.
 */
export function validateLabs(
  outline: Outline,
  machines: Machine[],
  labs: Lab[],
  questions: Question[],
  uncovered: Record<string, string>,
): string[] {
  const errors: string[] = []
  const machineById = new Map(machines.map((m) => [m.id, m]))
  const bulletIds = new Set(outline.domains.flatMap((d) => d.sections.flatMap((s) => s.bullets.map((b) => b.id))))
  const labIds = new Set<string>()
  const orders = new Set<number>()
  const byId = new Map(labs.map((l) => [l.id, l]))

  for (const lab of labs) {
    const at = (msg: string) => errors.push(`Lab ${lab.id}: ${msg}`)
    if (!LAB_ID.test(lab.id)) at('id must look like L01')
    if (labIds.has(lab.id)) at('duplicate id')
    labIds.add(lab.id)
    if (orders.has(lab.order)) at(`duplicate order ${lab.order}`)
    orders.add(lab.order)
    if (!lab.title.trim() || !lab.goal.trim()) at('needs a title and a goal')
    if (!(lab.minutes > 0 && lab.minutes <= 180)) at('minutes must be between 1 and 180')
    if (!['browser', 'windows', 'mixed'].includes(lab.platform)) at(`unknown platform ${lab.platform}`)
    if (lab.machineIds.length === 0) at('maps no machines')

    for (const m of lab.machineIds) if (!machineById.has(m)) at(`unknown machine ${m}`)
    const owned = new Set(lab.machineIds.flatMap((m) => machineById.get(m)?.bulletIds ?? []))
    for (const b of lab.bulletIds) {
      if (!bulletIds.has(b)) at(`unknown bullet ${b}`)
      else if (!owned.has(b)) at(`bullet ${b} isn't owned by any of its machines`)
    }
    if (lab.bulletIds.length === 0 && lab.machineIds.some((m) => !machineById.get(m)?.orientation)) at('only orientation labs may have no bullets')
    for (const b of lab.debriefBullets ?? []) if (!lab.bulletIds.includes(b)) at(`debrief bullet ${b} isn't one of the lab's bullets`)

    for (const p of lab.prereqs) {
      const pre = byId.get(p)
      if (!pre) at(`unknown prerequisite ${p}`)
      else if (pre.order >= lab.order) at(`prerequisite ${p} comes after it in the recommended order`)
    }

    if (lab.steps.length === 0) at('has no steps')
    if (lab.cleanup.length === 0) at('has no cleanup steps')
    const stepIds = new Set<string>()
    for (const [kind, list] of [['step', lab.steps], ['cleanup', lab.cleanup]] as const) {
      for (const s of list) {
        const where = (msg: string) => at(`${kind} ${s.id}: ${msg}`)
        if (stepIds.has(s.id)) where('duplicate step id')
        stepIds.add(s.id)
        if (!s.text.trim()) where('empty text')
        if (s.sources.length === 0) where('needs at least one source')
        for (const u of s.sources) if (!LAB_SOURCE.test(u)) where(`source must be learn.microsoft.com or microsoftlearning.github.io: ${u}`)
        if (s.trapPairId && !pairIndex.has(s.trapPairId)) where(`unknown trap pair ${s.trapPairId}`)
        if (s.trapNote && !s.trapPairId) where('trapNote needs a trapPairId')
        if (s.cost && !s.optional) where('a step with a cost warning must be optional')
        if (s.windows && lab.platform === 'browser' && !s.optional) where('a browser lab may only have optional Windows steps')
        for (const n of (s.checkpoint ?? '').replace(/\btype [12]\b/gi, '').match(/\b\d+\b/g) ?? []) {
          if (!CHECKPOINT_NUMBERS.has(n)) where(`checkpoint mentions a number (${n}); checkpoints shouldn't depend on data values`)
        }
      }
    }
    const required = lab.steps.filter((s) => !s.optional)
    if (lab.platform === 'windows' && !lab.steps.some((s) => s.windows)) at('a Windows lab needs at least one Windows step')
    if (lab.platform === 'mixed' && !(required.some((s) => s.windows) && required.some((s) => !s.windows))) {
      at('a mixed lab needs both browser and Windows steps')
    }

    for (const text of labText(lab)) {
      for (const re of BANNED_TERMS) if (re.test(text)) at(`uses a banned phrase (${re.source})`)
      for (const re of TRIAL_UNAVAILABLE) if (re.test(text)) at(`mentions a feature the trial doesn't include (${re.source})`)
      for (const re of PRIVATE_PATTERNS) if (re.test(text)) at(`contains something that looks private (${re.source})`)
    }

    if (debriefPool(lab, questions).length < DEBRIEF_SIZE) at(`debrief pool has fewer than ${DEBRIEF_SIZE} non-case questions`)
  }

  // Prerequisites must be acyclic (also implied by the order rule, checked directly here).
  const visiting = new Set<string>()
  const done = new Set<string>()
  const visit = (id: string, path: string[]) => {
    if (done.has(id)) return
    if (visiting.has(id)) {
      errors.push(`Lab prerequisites form a cycle: ${[...path, id].join(' → ')}`)
      return
    }
    visiting.add(id)
    for (const p of byId.get(id)?.prereqs ?? []) visit(p, [...path, id])
    visiting.delete(id)
    done.add(id)
  }
  for (const l of labs) visit(l.id, [])

  const covered = new Set(labs.flatMap((l) => l.bulletIds))
  for (const b of bulletIds) {
    if (!covered.has(b) && !uncovered[b]?.trim()) errors.push(`Bullet ${b} has no lab and no reason in LABS_UNCOVERED`)
    if (covered.has(b) && uncovered[b]) errors.push(`Bullet ${b} is covered by a lab but also listed in LABS_UNCOVERED`)
  }

  for (const m of machines) {
    const want = machineLabPlatform(m.id)
    if (!want) errors.push(`Machine ${m.id} has no lab`)
    else if (m.labPlatform !== want) errors.push(`Machine ${m.id}: labPlatform is ${m.labPlatform} but its labs are ${want}`)
  }
  return errors
}
