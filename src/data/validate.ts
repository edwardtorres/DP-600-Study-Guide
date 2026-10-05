import { floorForDomain } from './floors'
import { buildGraph, redundantEdges, reachableFrom, startNodes, topoOrder } from './graph'
import type { Edge, Machine, Outline } from './types'

/** Counts the user confirmed against the study guide (Skills measured as of October 19, 2026). */
export const EXPECTED = {
  version: 'Skills measured as of October 19, 2026',
  domains: [
    { id: 'MAINTAIN', title: 'Maintain a data analytics solution', weightText: '25–30%', sections: 2, bullets: 11 },
    { id: 'PREPARE', title: 'Prepare data', weightText: '45–50%', sections: 3, bullets: 18 },
    { id: 'SEMANTIC', title: 'Implement and manage semantic models', weightText: '25–30%', sections: 2, bullets: 12 },
  ],
  sections: 7,
  bullets: 41,
  maxOrientation: 4,
} as const

export const isLearnUrl = (url: string) => /^https:\/\/learn\.microsoft\.com\/[^\s]*$/.test(url)

export function validateOutline(outline: Outline): string[] {
  const errors: string[] = []
  if (outline.version !== EXPECTED.version) errors.push(`Outline version is "${outline.version}"`)
  if (outline.domains.length !== EXPECTED.domains.length) {
    errors.push(`Expected ${EXPECTED.domains.length} domains, found ${outline.domains.length}`)
  }
  EXPECTED.domains.forEach((exp, i) => {
    const d = outline.domains[i]
    if (!d) return
    if (d.id !== exp.id || d.title !== exp.title) errors.push(`Domain ${i + 1} is "${d.title}", expected "${exp.title}"`)
    if (d.weightText !== exp.weightText) errors.push(`${d.title} weight is ${d.weightText}, expected ${exp.weightText}`)
    if (d.sections.length !== exp.sections) errors.push(`${d.title} has ${d.sections.length} sections, expected ${exp.sections}`)
    const n = d.sections.reduce((sum, s) => sum + s.bullets.length, 0)
    if (n !== exp.bullets) errors.push(`${d.title} has ${n} bullets, expected ${exp.bullets}`)
  })
  const sections = outline.domains.flatMap((d) => d.sections)
  if (sections.length !== EXPECTED.sections) errors.push(`Expected ${EXPECTED.sections} sections, found ${sections.length}`)
  const bullets = sections.flatMap((s) => s.bullets)
  if (bullets.length !== EXPECTED.bullets) errors.push(`Expected ${EXPECTED.bullets} bullets, found ${bullets.length}`)
  const ids = new Set<string>()
  for (const b of bullets) {
    if (ids.has(b.id)) errors.push(`Duplicate bullet id ${b.id}`)
    ids.add(b.id)
    if (b.text.trim() === '') errors.push(`Bullet ${b.id} is empty`)
  }
  return errors
}

export function validateMapping(outline: Outline, machines: Machine[]): string[] {
  const errors: string[] = []
  const bulletDomain = new Map<string, Outline['domains'][number]>()
  for (const d of outline.domains) for (const s of d.sections) for (const b of s.bullets) bulletDomain.set(b.id, d)

  const machineIds = new Set<string>()
  const owner = new Map<string, string>()
  let orientation = 0
  for (const m of machines) {
    if (machineIds.has(m.id)) errors.push(`Duplicate machine id ${m.id}`)
    machineIds.add(m.id)
    if (!m.themedName.trim() || !m.skillName.trim()) errors.push(`${m.id} needs both a themed name and a skill name`)

    if (m.floor === 'orientation') {
      orientation++
      if (!m.orientation) errors.push(`${m.id} is on the orientation floor but not tagged Orientation`)
      if (m.bulletIds.length > 0) errors.push(`Orientation machine ${m.id} must not own outline bullets`)
      if (m.pl300) errors.push(`Orientation machine ${m.id} must not carry a PL-300 tag`)
      continue
    }
    if (m.orientation) errors.push(`${m.id} is tagged Orientation but sits on the ${m.floor} floor`)
    if (m.bulletIds.length < 1 || m.bulletIds.length > 3) {
      errors.push(`${m.id} has ${m.bulletIds.length} bullets; machines need 1–3`)
    }
    for (const id of m.bulletIds) {
      const domain = bulletDomain.get(id)
      if (!domain) {
        errors.push(`${m.id} references unknown bullet ${id}`)
        continue
      }
      const prev = owner.get(id)
      if (prev) errors.push(`Bullet ${id} is in both ${prev} and ${m.id}`)
      owner.set(id, m.id)
      if (floorForDomain[domain.id] !== m.floor) {
        errors.push(`${m.id} is on the ${m.floor} floor but bullet ${id} belongs to ${domain.title}`)
      }
    }
    if (m.pl300 && m.pl300.overlaps.length === 0) errors.push(`${m.id} has a PL-300 tag with no overlapping bullets`)
  }
  if (orientation > EXPECTED.maxOrientation) {
    errors.push(`${orientation} orientation machines; at most ${EXPECTED.maxOrientation} allowed`)
  }
  for (const id of bulletDomain.keys()) if (!owner.has(id)) errors.push(`Bullet ${id} is not mapped to any machine`)
  return errors
}

export function validateGraph(machines: Machine[], edges: Edge[]): string[] {
  const errors: string[] = []
  const ids = machines.map((m) => m.id)
  const known = new Set(ids)
  const seen = new Set<string>()
  for (const e of edges) {
    const key = `${e.from}->${e.to}`
    if (!known.has(e.from)) errors.push(`Edge ${key}: unknown machine ${e.from}`)
    if (!known.has(e.to)) errors.push(`Edge ${key}: unknown machine ${e.to}`)
    if (e.from === e.to) errors.push(`Edge ${key} points to itself`)
    if (seen.has(key)) errors.push(`Duplicate edge ${key}`)
    seen.add(key)
    if (!e.reason.trim()) errors.push(`Edge ${key} has no reason`)
    if (e.verified && !isLearnUrl(e.verified.source)) errors.push(`Edge ${key} verified source is not on learn.microsoft.com`)
  }
  if (errors.length > 0) return errors

  const g = buildGraph(ids, edges)
  if (!topoOrder(g)) return [...errors, 'Prerequisite graph has a cycle']
  const roots = startNodes(g)
  const reached = reachableFrom(g, roots)
  for (const id of ids) if (!reached.has(id)) errors.push(`${id} is not reachable from a starting machine`)
  for (const e of redundantEdges(g, edges)) {
    errors.push(`Edge ${e.from}->${e.to} is redundant (already implied by other threads)`)
  }
  return errors
}

export function validateAll(outline: Outline, machines: Machine[], edges: Edge[]): string[] {
  return [...validateOutline(outline), ...validateMapping(outline, machines), ...validateGraph(machines, edges)]
}
