import type { Lab } from '../content/labs/types'
import type { Question } from '../content/questions/types'
import { MAX_PROBLEM_NOTE, type AnswerEntry, type LabProgress, type Save } from '../save/schema'
import { shuffled } from './shuffle'
import { addDays, dayKey } from './time'

/**
 * Hands-on labs are self-reported. Completing one earns a fixed amount of XP
 * and never certifies a machine: nothing here touches machine progress.
 */
export const LAB_XP = 75
export const DEBRIEF_SIZE = 3
export const TRIAL_DAYS = 60
/** The suggested schedule finishes this many days before the trial ends. */
export const SCHEDULE_BUFFER_DAYS = 5

const empty = (): LabProgress => ({ steps: {}, problems: {} })
const progressOf = (save: Save, labId: string): LabProgress => save.labs[labId] ?? empty()
const withLab = (save: Save, labId: string, p: LabProgress, now: Date): Save => ({
  ...save,
  updatedAt: now.toISOString(),
  labs: { ...save.labs, [labId]: p },
})

/** Ids of the steps (and cleanup steps) that must be ticked before a lab can be completed. */
export function requiredStepIds(lab: Lab): string[] {
  return [...lab.steps, ...lab.cleanup].filter((s) => !s.optional).map((s) => s.id)
}

export function setStepDone(save: Save, labId: string, stepId: string, done: boolean, now: Date = new Date()): Save {
  const p = progressOf(save, labId)
  const steps = { ...p.steps }
  if (done) steps[stepId] = true
  else delete steps[stepId]
  return withLab(save, labId, { ...p, steps }, now)
}

/** Saves a problem note for a step (trimmed, at most MAX_PROBLEM_NOTE characters). An empty note removes it. */
export function setProblem(save: Save, labId: string, stepId: string, text: string, now: Date = new Date()): Save {
  const p = progressOf(save, labId)
  const problems = { ...p.problems }
  const note = text.trim().slice(0, MAX_PROBLEM_NOTE)
  if (note) problems[stepId] = note
  else delete problems[stepId]
  return withLab(save, labId, { ...p, problems }, now)
}

export type CompleteResult = { ok: true; save: Save } | { ok: false; missing: string[] }

/** Marks a lab complete once every required step is ticked. Earns LAB_XP; never certifies. */
export function completeLab(save: Save, lab: Lab, now: Date = new Date()): CompleteResult {
  const p = progressOf(save, lab.id)
  const missing = requiredStepIds(lab).filter((id) => !p.steps[id])
  if (missing.length > 0) return { ok: false, missing }
  if (p.completedAt) return { ok: true, save }
  return { ok: true, save: withLab(save, lab.id, { ...p, completedAt: now.toISOString() }, now) }
}

export function isLabComplete(save: Save, labId: string): boolean {
  return !!save.labs[labId]?.completedAt
}

/** XP from completed labs (fixed per lab). */
export function labXp(save: Save): number {
  return Object.values(save.labs).filter((p) => p.completedAt).length * LAB_XP
}

/**
 * Questions a lab's debrief may use: the bank's questions on the lab's
 * bullets, never case-study questions. A lab without bullets (orientation)
 * uses its machines' questions.
 */
export function debriefPool(lab: Lab, questions: Question[]): Question[] {
  const bullets = new Set(lab.debriefBullets ?? lab.bulletIds)
  return questions.filter(
    (q) => !q.caseStudyId && (bullets.size > 0 ? q.bulletIds.some((b) => bullets.has(b)) : lab.machineIds.includes(q.machineId)),
  )
}

/** Three debrief questions, spread over as many of the lab's bullets as possible. */
export function drawDebrief(lab: Lab, questions: Question[], rand: () => number = Math.random): Question[] {
  const pool = shuffled(debriefPool(lab, questions), rand)
  const picked: Question[] = []
  for (const b of shuffled(lab.debriefBullets ?? lab.bulletIds, rand)) {
    if (picked.length >= DEBRIEF_SIZE) break
    const q = pool.find((x) => x.bulletIds.includes(b) && !picked.includes(x))
    if (q) picked.push(q)
  }
  for (const q of pool) if (picked.length < DEBRIEF_SIZE && !picked.includes(q)) picked.push(q)
  return picked
}

/** Logs debrief answers with code 'l'. They count toward readiness like inspections; machine progress is untouched. */
export function recordDebrief(save: Save, questionIds: string[], correct: boolean[], now: Date = new Date()): Save {
  const t = Math.floor(now.getTime() / 1000)
  return {
    ...save,
    updatedAt: now.toISOString(),
    answers: [...save.answers, ...questionIds.map((id, i): AnswerEntry => [id, correct[i] ? 1 : 0, t, 'l'])],
  }
}

export function setTrialStart(save: Save, day: string | undefined, now: Date = new Date()): Save {
  const next: Save = { ...save, updatedAt: now.toISOString() }
  if (day) next.trialStart = day
  else delete next.trialStart
  return next
}

/** Whole days from a to b (both YYYY-MM-DD). */
export function daysBetween(a: string, b: string): number {
  const ms = (k: string) => {
    const [y, m, d] = k.split('-').map(Number) as [number, number, number]
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((ms(b) - ms(a)) / 86_400_000)
}

export interface TrialClock {
  /** Day of the trial today (1 on the start date). */
  day: number
  /** Days left, 0 once the trial has ended. */
  daysLeft: number
  /** Last day of the trial (YYYY-MM-DD). */
  lastDay: string
  ended: boolean
}

export function trialClock(trialStart: string, today: string): TrialClock {
  const day = daysBetween(trialStart, today) + 1
  const lastDay = addDays(trialStart, TRIAL_DAYS - 1)
  const daysLeft = Math.max(0, TRIAL_DAYS - day + 1)
  return { day, daysLeft, lastDay, ended: daysLeft === 0 }
}

export interface ScheduleItem {
  labId: string
  day: string
}

export interface Schedule {
  items: ScheduleItem[]
  /** Target day to finish the last lab: SCHEDULE_BUFFER_DAYS before the trial ends. */
  finishBy: string
  /** True when there's no room left before the buffer, so every remaining lab is suggested for today. */
  tight: boolean
}

/**
 * Spreads the remaining labs (in recommended order, so prerequisites come
 * first) evenly from today to the finish-by day.
 */
export function suggestSchedule(remaining: Lab[], trialStart: string, today: string): Schedule {
  const finishBy = addDays(trialStart, TRIAL_DAYS - 1 - SCHEDULE_BUFFER_DAYS)
  const span = daysBetween(today, finishBy) + 1
  const ordered = [...remaining].sort((a, b) => a.order - b.order)
  if (span < 1) return { items: ordered.map((l) => ({ labId: l.id, day: today })), finishBy, tight: true }
  const n = ordered.length
  const items = ordered.map((l, i) => ({ labId: l.id, day: addDays(today, n <= 1 ? 0 : Math.floor((i * (span - 1)) / (n - 1))) }))
  return { items, finishBy, tight: span < n }
}

export const todayKey = (now: Date = new Date()) => dayKey(now)

/**
 * Plain-text export of lab progress and problem notes, to paste back into a
 * conversation. Only what the player typed and ticked; nothing from the tenant.
 */
export function exportLabNotes(save: Save, labs: Lab[], now: Date = new Date()): string {
  const header = [
    'Fabric Mill: lab notes',
    `Exported ${dayKey(now)}`,
    ...(save.trialStart ? [`Trial started ${save.trialStart} (day ${trialClock(save.trialStart, dayKey(now)).day} of ${TRIAL_DAYS})`] : []),
    'Check before sharing: these notes should not contain tenant names, workspace URLs, connection strings, tokens, or emails.',
    '',
  ]
  const lines: string[] = []
  for (const lab of [...labs].sort((a, b) => a.order - b.order)) {
    const p = save.labs[lab.id]
    if (!p) continue
    const all = [...lab.steps.map((s, i) => ({ s, label: `Step ${i + 1}` })), ...lab.cleanup.map((s, i) => ({ s, label: `Cleanup ${i + 1}` }))]
    const done = all.filter(({ s }) => p.steps[s.id]).length
    lines.push(`${lab.id} ${lab.title}`)
    lines.push(`  Status: ${p.completedAt ? `complete (${p.completedAt.slice(0, 10)})` : 'in progress'}; ${done}/${all.length} steps ticked`)
    for (const { s, label } of all) {
      const note = p.problems[s.id]
      if (!note) continue
      lines.push(`  ${label} [${lab.id}/${s.id}] ${p.steps[s.id] ? '(ticked)' : '(not ticked)'}: ${s.text}`)
      lines.push(`    Problem: ${note.replace(/\s*\n\s*/g, ' / ')}`)
    }
    lines.push('')
  }
  return [...header, ...(lines.length ? lines : ['No lab progress yet.'])].join('\n')
}
