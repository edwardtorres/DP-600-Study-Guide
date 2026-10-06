import { isLearnUrl } from '../data/validate'
import type { FloorId, Machine } from '../data/types'
import { CODE_REQUIRED, NOTES_PENDING, REQUIRED_PAIRS } from './requirements'
import type { Cited, MachineNotes } from './types'

interface NotesOptions {
  pending?: FloorId[]
}

/** Every URL cited anywhere in one machine's notes, in first-seen order. */
export function notesSources(n: MachineNotes): string[] {
  const urls: string[] = []
  const add = (list: string[]) => list.forEach((u) => urls.includes(u) || urls.push(u))
  const cited = (items: Cited[] = []) => items.forEach((c) => add(c.sources))
  cited(n.pl300Adds)
  cited(n.overview)
  n.bullets.forEach((b) => {
    cited(b.concepts)
    cited(b.howTo)
  })
  n.examples.forEach((e) => add(e.sources))
  cited(n.traps)
  n.dontConfuse.forEach((d) => cited(d.difference))
  n.renamed.forEach((r) => add(r.sources))
  n.preview.forEach((p) => add(p.sources))
  n.upcoming.forEach((u) => add(u.sources))
  n.glossary.forEach((g) => add(g.sources))
  n.contested?.forEach((c) => cited(c.readings))
  return urls
}

const words = (s: string) => s.split(/\s+/).filter(Boolean).length

/** Prose word count (code is not counted; its step explanations are). */
export function notesWordCount(n: MachineNotes): number {
  const cited = (items: Cited[] = []) => items.reduce((sum, c) => sum + words(c.text), 0)
  return (
    cited(n.pl300Adds) +
    cited(n.overview) +
    n.bullets.reduce((s, b) => s + cited(b.concepts) + cited(b.howTo), 0) +
    n.examples.reduce((s, e) => s + words(e.title) + e.steps.reduce((t, st) => t + words(st.explain), 0), 0) +
    cited(n.traps) +
    n.dontConfuse.reduce((s, d) => s + words(`${d.a} ${d.b}`) + cited(d.difference), 0) +
    n.renamed.reduce((s, r) => s + words(`${r.oldName} ${r.newName} ${r.examLikely} ${r.note}`), 0) +
    n.preview.reduce((s, p) => s + words(`${p.feature} ${p.note}`), 0) +
    n.upcoming.reduce((s, u) => s + words(u.change), 0) +
    n.glossary.reduce((s, g) => s + words(`${g.term} ${g.definition}`), 0) +
    (n.contested ?? []).reduce((s, c) => s + words(`${c.topic} ${c.guidance}`) + cited(c.readings), 0)
  )
}

export function validateNotes(machines: Machine[], notes: MachineNotes[], options: NotesOptions = {}): string[] {
  const pending = new Set(options.pending ?? NOTES_PENDING)
  const errors: string[] = []
  const byId = new Map<string, MachineNotes>()
  const machineIds = new Set(machines.map((m) => m.id))

  for (const n of notes) {
    if (!machineIds.has(n.machineId)) errors.push(`Notes for unknown machine ${n.machineId}`)
    if (byId.has(n.machineId)) errors.push(`Two sets of notes for ${n.machineId}`)
    byId.set(n.machineId, n)
  }

  const glossaryOwner = new Map<string, string>()
  const pairsSeen = new Set<string>()

  for (const m of machines) {
    const n = byId.get(m.id)
    if (!n) {
      if (!pending.has(m.floor)) errors.push(`${m.id} has no notes`)
      continue
    }
    const where = (what: string) => `${m.id}: ${what}`
    const checkSources = (what: string, sources: string[]) => {
      if (sources.length === 0) errors.push(where(`${what} has no Learn source`))
      for (const s of sources) if (!isLearnUrl(s)) errors.push(where(`${what} cites a non-Learn URL: ${s}`))
    }
    const checkCited = (what: string, items: Cited[]) =>
      items.forEach((c, i) => {
        if (!c.text.trim()) errors.push(where(`${what} #${i + 1} is empty`))
        checkSources(`${what} #${i + 1}`, c.sources)
      })

    if (n.overview.length === 0) errors.push(where('missing overview'))
    checkCited('overview', n.overview)
    if (m.pl300) {
      if (!n.pl300Adds?.length) errors.push(where('PL-300 machine has no "What DP-600 adds" section'))
      checkCited('pl300Adds', n.pl300Adds ?? [])
    } else if (n.pl300Adds?.length) {
      errors.push(where('has a "What DP-600 adds" section but no PL-300 tag'))
    }

    const covered = new Set(n.bullets.map((b) => b.bulletId))
    for (const id of m.bulletIds) if (!covered.has(id)) errors.push(where(`bullet ${id} has no notes`))
    for (const b of n.bullets) {
      if (!m.bulletIds.includes(b.bulletId)) errors.push(where(`notes for bullet ${b.bulletId}, which is not this machine's`))
      if (b.tools.length === 0) errors.push(where(`bullet ${b.bulletId} names no Fabric tool`))
      if (b.concepts.length === 0) errors.push(where(`bullet ${b.bulletId} has no key concepts`))
      if (b.howTo.length === 0) errors.push(where(`bullet ${b.bulletId} has no how-to`))
      checkCited(`bullet ${b.bulletId} concepts`, b.concepts)
      checkCited(`bullet ${b.bulletId} how-to`, b.howTo)
    }

    if (CODE_REQUIRED.includes(m.id) && n.examples.length === 0) errors.push(where('needs at least one worked example'))
    n.examples.forEach((e, i) => {
      if (e.illustrative !== true) errors.push(where(`example #${i + 1} is not marked illustrative`))
      if (e.steps.length === 0) errors.push(where(`example #${i + 1} has no steps`))
      e.steps.forEach((s, j) => {
        if (!s.code.trim() || !s.explain.trim()) errors.push(where(`example #${i + 1} step ${j + 1} needs code and an explanation`))
      })
      checkSources(`example "${e.title}"`, e.sources)
    })

    checkCited('trap', n.traps)
    n.dontConfuse.forEach((d) => {
      pairsSeen.add(d.pairId)
      if (d.difference.length === 0) errors.push(where(`don't-confuse ${d.pairId} has no explanation`))
      checkCited(`don't-confuse ${d.pairId}`, d.difference)
    })
    n.renamed.forEach((r) => checkSources(`rename ${r.oldName} → ${r.newName}`, r.sources))
    n.preview.forEach((p) => checkSources(`Preview label ${p.feature}`, p.sources))
    n.upcoming.forEach((u) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(u.date)) errors.push(where(`dated change has a bad date: ${u.date}`))
      checkSources(`dated change ${u.date}`, u.sources)
    })
    n.contested?.forEach((c) => {
      if (c.readings.length < 2) errors.push(where(`contested point "${c.topic}" needs at least two readings`))
      if (!c.guidance.trim()) errors.push(where(`contested point "${c.topic}" has no guidance`))
      checkCited(`contested "${c.topic}"`, c.readings)
    })
    n.glossary.forEach((g) => {
      const key = g.term.toLowerCase()
      const prev = glossaryOwner.get(key)
      if (prev) errors.push(where(`glossary term "${g.term}" is already defined in ${prev}`))
      glossaryOwner.set(key, m.id)
      checkSources(`glossary "${g.term}"`, g.sources)
    })
  }

  if (pending.size === 0) {
    for (const [id, label] of Object.entries(REQUIRED_PAIRS)) {
      if (!pairsSeen.has(id)) errors.push(`Required "don't confuse" pair missing: ${id} (${label})`)
    }
  }
  return errors
}
