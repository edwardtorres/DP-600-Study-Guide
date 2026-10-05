import type { Graph } from '../data/graph'
import type { DomainId, FloorId, Machine, Outline } from '../data/types'
import type { AnswerEntry, AttemptCode, Save } from '../save/schema'
import { isCertified, isPlaced } from './state'
import { addDays, dayKey, localTimeZone } from './time'

/**
 * Anything that can appear in the answer log: a question or a puzzle. Both carry
 * a difficulty (for XP) and the outline bullets they test (for readiness).
 */
export interface Scorable {
  difficulty: 1 | 2 | 3
  bulletIds: string[]
}

// ── XP and levels ──────────────────────────────────────────────────────

/** XP for a correct answer, by difficulty. */
export const XP_BY_DIFFICULTY = { 1: 10, 2: 20, 3: 30 } as const
/** Later correct answers to a question already answered correctly earn this share. */
export const REPEAT_XP_SHARE = 0.25

/**
 * XP from the answer log. The first correct answer to a question (or puzzle) earns
 * full XP; later correct answers earn 25% (rounded down, at least 1). XP never certifies anything.
 */
export function totalXp(answers: AnswerEntry[], questionsById: Map<string, Scorable>): number {
  const seen = new Set<string>()
  let xp = 0
  for (const [id, correct] of answers) {
    if (!correct) continue
    const q = questionsById.get(id)
    if (!q) continue
    const base = XP_BY_DIFFICULTY[q.difficulty]
    xp += seen.has(id) ? Math.max(1, Math.floor(base * REPEAT_XP_SHARE)) : base
    seen.add(id)
  }
  return xp
}

/** XP needed to reach a level: 50·L·(L−1). Level 1 starts at 0. */
export function xpForLevel(level: number): number {
  return 50 * level * (level - 1)
}

export const RANKS = [
  { name: 'Apprentice', fromLevel: 1 },
  { name: 'Journeyman', fromLevel: 4 },
  { name: 'Weaver', fromLevel: 7 },
  { name: 'Master Weaver', fromLevel: 10 },
] as const

export interface LevelInfo {
  level: number
  rank: string
  xp: number
  levelStartXp: number
  nextLevelXp: number
}

export function levelFor(xp: number): LevelInfo {
  let level = 1
  while (xpForLevel(level + 1) <= xp) level++
  const rank = [...RANKS].reverse().find((r) => level >= r.fromLevel)!.name
  return { level, rank, xp, levelStartXp: xpForLevel(level), nextLevelXp: xpForLevel(level + 1) }
}

// ── Streak ─────────────────────────────────────────────────────────────

export const STREAK_MIN_ANSWERS = 10

export interface StreakInfo {
  current: number
  best: number
  answeredToday: number
  /** Days (YYYY-MM-DD, local) that counted, oldest first. */
  days: string[]
}

/**
 * A day counts once at least 10 questions were answered that local calendar day.
 * The current streak ends today, or yesterday if today doesn't count yet.
 */
export function streak(answers: AnswerEntry[], now: Date = new Date(), timeZone: string = localTimeZone()): StreakInfo {
  const perDay = new Map<string, number>()
  for (const [, , at] of answers) {
    const k = dayKey(new Date(at * 1000), timeZone)
    perDay.set(k, (perDay.get(k) ?? 0) + 1)
  }
  const days = [...perDay].filter(([, n]) => n >= STREAK_MIN_ANSWERS).map(([d]) => d).sort()
  const counted = new Set(days)
  let best = 0
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  const today = dayKey(now, timeZone)
  let cursor = counted.has(today) ? today : addDays(today, -1)
  let current = 0
  while (counted.has(cursor)) {
    current++
    cursor = addDays(cursor, -1)
  }
  return { current, best, answeredToday: perDay.get(today) ?? 0, days }
}

/** First local day on which the streak reached `length` days, if ever. */
function streakReachedOn(days: string[], length: number): string | undefined {
  let run = 0
  let prev: string | null = null
  for (const d of days) {
    run = prev !== null && addDays(prev, 1) === d ? run + 1 : 1
    if (run >= length) return d
    prev = d
  }
  return undefined
}

// ── Badges ─────────────────────────────────────────────────────────────

export interface Badge {
  id: string
  name: string
  description: string
  /** ISO time or local day the badge was earned; undefined if not yet. */
  earnedAt?: string
}

const latest = (dates: (string | undefined)[]): string | undefined =>
  dates.every((d) => d !== undefined) && dates.length > 0 ? [...(dates as string[])].sort().at(-1) : undefined

export function badges(save: Save, machines: Machine[], graph: Graph, now: Date = new Date(), timeZone: string = localTimeZone()): Badge[] {
  void graph
  const certAt = (id: string) => save.machines[id]?.certification?.passedAt
  const allCertifiedAt = (ids: string[]) => latest(ids.map(certAt))
  const floor = (f: FloorId) => machines.filter((m) => m.floor === f).map((m) => m.id)
  const carryover = machines.filter((m) => m.pl300).map((m) => m.id)
  const placements = Object.values(save.machines)
    .filter((p) => p.certification?.kind === 'placement')
    .map((p) => p.certification!.passedAt)
    .sort()
  const perfect = Object.values(save.machines)
    .filter((p) => p.certification?.kind === 'inspection' && p.certification.score === 1)
    .map((p) => p.certification!.passedAt)
    .sort()
  const { days } = streak(save.answers, now, timeZone)

  return [
    { id: 'orientation', name: 'Mill Keys', description: 'Every Front Office (Orientation) machine certified.', earnedAt: allCertifiedAt(floor('orientation')) },
    { id: 'floor-prepare', name: 'Spinning Floor Foreman', description: 'Every machine on the Spinning Floor & Dye House certified.', earnedAt: allCertifiedAt(floor('prepare')) },
    { id: 'floor-semantic', name: 'Loom Hall Foreman', description: 'Every machine in the Loom Hall certified.', earnedAt: allCertifiedAt(floor('semantic')) },
    { id: 'floor-maintain', name: 'Gatekeeper', description: 'Every machine in the Gatehouse & Pattern Room certified.', earnedAt: allCertifiedAt(floor('maintain')) },
    { id: 'kql', name: 'Kusto Tensioner', description: 'Kusto Tension Meter (KQL) certified.', earnedAt: certAt('tension-meter') },
    { id: 'dax', name: 'DAX Assayer', description: 'DAX Scale certified.', earnedAt: certAt('dax-scale') },
    { id: 'direct-lake', name: 'Lake Shuttler', description: 'Direct Lake Shuttle certified.', earnedAt: certAt('direct-lake-shuttle') },
    { id: 'carryover', name: 'Transfer Papers', description: 'Every PL-300 carryover machine placed or certified.', earnedAt: allCertifiedAt(carryover) },
    { id: 'first-placement', name: 'Fast Track', description: 'Passed a first placement check.', earnedAt: placements[0] },
    { id: 'perfect-inspection', name: 'Flawless Bolt', description: 'Passed an inspection with 5 of 5 correct.', earnedAt: perfect[0] },
    { id: 'streak-7', name: 'Week at the Loom', description: 'A 7-day streak (10+ questions a day).', earnedAt: streakReachedOn(days, 7) },
    { id: 'streak-30', name: 'Month at the Loom', description: 'A 30-day streak (10+ questions a day).', earnedAt: streakReachedOn(days, 30) },
    { id: 'whole-mill', name: 'Master of the Mill', description: 'Every machine in the mill certified.', earnedAt: allCertifiedAt(machines.map((m) => m.id)) },
  ]
}

export function placedCount(save: Save, machines: Machine[]): { placed: number; certified: number } {
  return {
    placed: machines.filter((m) => isPlaced(save, m.id)).length,
    certified: machines.filter((m) => isCertified(save, m.id)).length,
  }
}

// ── Readiness ──────────────────────────────────────────────────────────

/** How many recent answers per domain feed readiness, and the minimum before a score shows. */
export const READINESS_WINDOW = 40
export const READINESS_MIN_ANSWERS = 10
/**
 * Which answers count toward readiness: inspections, placements, and puzzles.
 * Start-up checks ('s') don't. Step 7 adds the review and mock-exam codes here.
 */
export const READINESS_CODES: readonly AttemptCode[] = ['i', 'p', 'z']

/** The domain of an item's first outline bullet. */
export function domainOf(bulletIds: string[], outline: Outline): DomainId | null {
  const first = bulletIds[0]
  if (!first) return null
  for (const d of outline.domains) for (const s of d.sections) if (s.bullets.some((b) => b.id === first)) return d.id
  return null
}

export interface DomainReadiness {
  domain: DomainId
  /** 0–100, or null until there are enough answers. */
  score: number | null
  answered: number
  accuracy: number
  coverage: number
  weight: number
}

export interface Readiness {
  domains: DomainReadiness[]
  /** 0–100 weighted by the official domain percentages, or null until every domain has a score. */
  overall: number | null
}

/** Official weight of each domain: the midpoint of its published range, normalized. */
export function domainWeights(outline: Outline): Map<DomainId, number> {
  const mids = outline.domains.map((d) => [d.id, (d.weight.min + d.weight.max) / 2] as const)
  const total = mids.reduce((a, [, m]) => a + m, 0)
  return new Map(mids.map(([id, m]) => [id, m / total]))
}

/**
 * Readiness is accuracy, never XP. Only inspection, placement, and puzzle answers
 * count (READINESS_CODES); start-up checks don't. For each domain: accuracy over
 * the most recent 40 counted answers in that domain, multiplied by coverage
 * (distinct bullets answered ÷ bullets in the domain, capped at 1). Overall is the
 * weighted mean using the official domain percentages.
 */
export function readiness(answers: AnswerEntry[], questionsById: Map<string, Scorable>, outline: Outline): Readiness {
  const weights = domainWeights(outline)
  const counted = answers.filter(([, , , code]) => READINESS_CODES.includes(code))
  const domains: DomainReadiness[] = outline.domains.map((d) => {
    const bulletCount = d.sections.reduce((n, s) => n + s.bullets.length, 0)
    const inDomain = counted.filter(([id]) => {
      const q = questionsById.get(id)
      return q ? domainOf(q.bulletIds, outline) === d.id : false
    })
    const recent = inDomain.slice(-READINESS_WINDOW)
    const right = recent.filter(([, c]) => c === 1).length
    const accuracy = recent.length ? right / recent.length : 0
    const bullets = new Set(inDomain.flatMap(([id]) => questionsById.get(id)?.bulletIds ?? []))
    const coverage = Math.min(1, bullets.size / bulletCount)
    const score = inDomain.length >= READINESS_MIN_ANSWERS ? Math.round(accuracy * coverage * 100) : null
    return { domain: d.id, score, answered: inDomain.length, accuracy, coverage, weight: weights.get(d.id) ?? 0 }
  })
  const overall = domains.every((d) => d.score !== null)
    ? Math.round(domains.reduce((a, d) => a + (d.score ?? 0) * d.weight, 0))
    : null
  return { domains, overall }
}
