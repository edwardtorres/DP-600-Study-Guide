import { isLearnUrl } from '../../data/validate'
import type { DomainId, FloorId, Machine, Outline } from '../../data/types'
import type { MachineNotes } from '../types'
import {
  BANNED_TERMS,
  CASES_PENDING,
  MAX_LONGEST_CORRECT_SHARE,
  MAX_POSITION_SHARE,
  MAX_PREVIEW_SHARE,
  MIN_PER_BULLET,
  MIN_PLACEMENT_PER_CARRYOVER,
  NEAR_DUPLICATE_JACCARD,
  QUESTIONS_PENDING,
} from './requirements'
import type { CaseStudy, Question } from './types'

export interface QuestionOptions {
  pending?: FloorId[]
  casesPending?: boolean
}

/** Every human-readable string in a question (for banned-term and duplicate checks). */
export function questionText(q: Question): string[] {
  const t = [q.stem]
  switch (q.format) {
    case 'single':
    case 'multi':
      q.options.forEach((o) => t.push(o.text, o.explain))
      break
    case 'yesno':
      q.statements.forEach((s) => t.push(s.text, s.explain))
      break
    case 'order':
      q.items.forEach((i) => t.push(i.text, i.explain))
      break
    case 'match':
      q.prompts.forEach((p) => t.push(p.text))
      q.choices.forEach((c) => t.push(c.text))
      q.pairs.forEach((p) => t.push(p.explain))
      break
    case 'dropdown':
      t.push(q.code)
      q.slots.forEach((s) => s.options.forEach((o) => t.push(o.text, o.explain)))
      break
  }
  return t
}

const words = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  )

export function jaccard(a: string, b: string): number {
  const A = words(a)
  const B = words(b)
  if (A.size === 0 && B.size === 0) return 1
  let inter = 0
  for (const w of A) if (B.has(w)) inter++
  return inter / (A.size + B.size - inter)
}

export function questionDomain(q: Question, outline: Outline): DomainId | null {
  const first = q.bulletIds[0]
  if (!first) return null
  for (const d of outline.domains) for (const s of d.sections) if (s.bullets.some((b) => b.id === first)) return d.id
  return null
}

export interface QuestionStats {
  total: number
  perBullet: Map<string, number>
  perMachine: Map<string, number>
  perDomain: Map<DomainId, number>
  domainShare: Map<DomainId, number>
  formats: Map<string, number>
  difficulty: Map<number, number>
  /** For 4-option single-choice: how often the correct answer is in position 1..4. */
  positions: number[]
  longestCorrect: { count: number; of: number }
  placement: Map<string, number>
  preview: number
}

export function questionStats(questions: Question[], outline: Outline): QuestionStats {
  const inc = <K>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1)
  const perBullet = new Map<string, number>()
  const perMachine = new Map<string, number>()
  const perDomain = new Map<DomainId, number>()
  const formats = new Map<string, number>()
  const difficulty = new Map<number, number>()
  const placement = new Map<string, number>()
  const positions = [0, 0, 0, 0]
  const longestCorrect = { count: 0, of: 0 }
  let preview = 0
  for (const q of questions) {
    q.bulletIds.forEach((b) => inc(perBullet, b))
    inc(perMachine, q.machineId)
    const d = questionDomain(q, outline)
    if (d) inc(perDomain, d)
    inc(formats, q.format)
    inc(difficulty, q.difficulty)
    if (q.placement) inc(placement, q.machineId)
    if (q.preview) preview++
    if (q.format === 'single' && q.options.length === 4) {
      const idx = q.options.findIndex((o) => o.id === q.answer)
      if (idx >= 0) positions[idx] = (positions[idx] ?? 0) + 1
    }
    if (q.format === 'single') {
      longestCorrect.of++
      const correct = q.options.find((o) => o.id === q.answer)
      const others = q.options.filter((o) => o.id !== q.answer)
      if (correct && others.every((o) => correct.text.length > o.text.length)) longestCorrect.count++
    }
  }
  const domainTotal = [...perDomain.values()].reduce((a, b) => a + b, 0)
  const domainShare = new Map([...perDomain].map(([k, v]) => [k, domainTotal ? v / domainTotal : 0]))
  return { total: questions.length, perBullet, perMachine, perDomain, domainShare, formats, difficulty, positions, longestCorrect, placement, preview }
}

export function validateQuestions(
  outline: Outline,
  machines: Machine[],
  notes: MachineNotes[],
  questions: Question[],
  cases: CaseStudy[],
  options: QuestionOptions = {},
): string[] {
  const pending = new Set(options.pending ?? QUESTIONS_PENDING)
  const casesPending = options.casesPending ?? CASES_PENDING
  const errors: string[] = []
  const machineById = new Map(machines.map((m) => [m.id, m]))
  const pairIds = new Set(notes.flatMap((n) => n.dontConfuse.map((d) => d.pairId)))
  const caseIds = new Set(cases.map((c) => c.id))
  const ids = new Set<string>()

  for (const c of cases) {
    if (!c.company.trim() || !c.summary.trim()) errors.push(`Case study ${c.id} needs a company and a summary`)
    if (!c.environment.length || !c.requirements.length || !c.constraints.length) {
      errors.push(`Case study ${c.id} needs environment, requirements, and constraints`)
    }
  }

  for (const q of questions) {
    const at = (msg: string) => errors.push(`${q.id}: ${msg}`)
    if (ids.has(q.id)) at('duplicate id')
    ids.add(q.id)
    const m = machineById.get(q.machineId)
    if (!m) {
      at(`unknown machine ${q.machineId}`)
      continue
    }
    if (m.orientation) {
      if (q.bulletIds.length) at('orientation questions have no bullets')
    } else {
      if (!q.bulletIds.length) at('needs at least one bullet')
      for (const b of q.bulletIds) if (!m.bulletIds.includes(b)) at(`bullet ${b} isn't on machine ${m.id}`)
    }
    if (!q.stem.trim()) at('empty stem')
    if (!q.sources.length) at('no Learn source')
    for (const s of q.sources) if (!isLearnUrl(s)) at(`non-Learn source ${s}`)
    if (q.trapPairId && !pairIds.has(q.trapPairId)) at(`unknown trapPairId ${q.trapPairId}`)
    if (q.caseStudyId && !caseIds.has(q.caseStudyId)) at(`unknown case study ${q.caseStudyId}`)
    if (q.placement && !m.pl300) at('placement questions must be on a PL-300 carryover machine')

    const needExplain = (label: string, explain: string) => {
      if (!explain.trim()) at(`${label} has no explanation`)
    }
    const uniqueIds = (label: string, list: { id: string }[]) => {
      if (new Set(list.map((x) => x.id)).size !== list.length) at(`duplicate ${label} ids`)
    }

    switch (q.format) {
      case 'single': {
        if (q.options.length !== 4) at('single-choice needs exactly 4 options')
        uniqueIds('option', q.options)
        if (!q.options.some((o) => o.id === q.answer)) at('answer is not an option')
        q.options.forEach((o) => needExplain(`option ${o.id}`, o.explain))
        break
      }
      case 'multi': {
        if (q.options.length < 4 || q.options.length > 5) at('multi-select needs 4–5 options')
        uniqueIds('option', q.options)
        if (q.answers.length < 2) at('multi-select needs at least 2 answers')
        for (const a of q.answers) if (!q.options.some((o) => o.id === a)) at(`answer ${a} is not an option`)
        if (!/choose (two|three)|select (two|three)/i.test(q.stem)) at('multi-select stem must say how many to choose')
        const n = /three/i.test(q.stem) ? 3 : 2
        if (q.answers.length !== n) at(`stem asks for ${n} answers but the key has ${q.answers.length}`)
        q.options.forEach((o) => needExplain(`option ${o.id}`, o.explain))
        break
      }
      case 'yesno': {
        if (q.statements.length < 2 || q.statements.length > 4) at('Yes/No sets need 2–4 statements')
        uniqueIds('statement', q.statements)
        q.statements.forEach((s) => needExplain(`statement ${s.id}`, s.explain))
        break
      }
      case 'order': {
        if (q.items.length < 3 || q.items.length > 6) at('ordering needs 3–6 items')
        uniqueIds('item', q.items)
        const itemIds = q.items.map((i) => i.id).sort().join()
        if ([...q.answerOrder].sort().join() !== itemIds) at('answerOrder must be a permutation of the items')
        if (q.items.map((i) => i.id).join() === q.answerOrder.join()) at('items are displayed in the correct order')
        q.items.forEach((i) => needExplain(`item ${i.id}`, i.explain))
        break
      }
      case 'match': {
        if (q.prompts.length < 3 || q.prompts.length > 5) at('matching needs 3–5 prompts')
        if (q.choices.length < q.prompts.length) at('matching needs at least as many choices as prompts')
        uniqueIds('prompt', q.prompts)
        uniqueIds('choice', q.choices)
        for (const p of q.prompts) {
          const pair = q.pairs.filter((x) => x.promptId === p.id)
          if (pair.length !== 1) at(`prompt ${p.id} needs exactly one pair`)
        }
        for (const pair of q.pairs) {
          if (!q.choices.some((c) => c.id === pair.choiceId)) at(`pair for ${pair.promptId} uses unknown choice`)
          needExplain(`pair ${pair.promptId}`, pair.explain)
        }
        break
      }
      case 'dropdown': {
        const placeholders = [...q.code.matchAll(/\[\[(\w+)\]\]/g)].map((x) => x[1])
        if (placeholders.length !== q.slots.length) at('every slot needs exactly one [[placeholder]] in the code')
        for (const s of q.slots) {
          if (!placeholders.includes(s.id)) at(`slot ${s.id} has no placeholder`)
          if (s.options.length < 3 || s.options.length > 4) at(`slot ${s.id} needs 3–4 options`)
          uniqueIds(`slot ${s.id} option`, s.options)
          if (!s.options.some((o) => o.id === s.answer)) at(`slot ${s.id} answer is not an option`)
          s.options.forEach((o) => needExplain(`slot ${s.id} option ${o.id}`, o.explain))
        }
        break
      }
    }

    const text = questionText(q).join('\n')
    for (const re of BANNED_TERMS) if (re.test(text)) at(`uses a banned phrase (${re.source})`)
    if (q.placement && m.pl300?.caveat) {
      const correct =
        q.format === 'single'
          ? q.options.filter((o) => o.id === q.answer).map((o) => o.text)
          : q.format === 'multi'
            ? q.options.filter((o) => q.answers.includes(o.id)).map((o) => o.text)
            : []
      if (correct.some((t) => /power query/i.test(t))) at('placement question on a partial-carryover machine is keyed to Power Query')
    }
  }

  // Near-duplicate stems across the whole bank.
  for (let i = 0; i < questions.length; i++) {
    for (let j = i + 1; j < questions.length; j++) {
      const a = questions[i]!
      const b = questions[j]!
      if (jaccard(a.stem, b.stem) >= NEAR_DUPLICATE_JACCARD) errors.push(`${a.id} and ${b.id} have near-duplicate stems`)
    }
  }

  const stats = questionStats(questions, outline)
  for (const m of machines) {
    if (pending.has(m.floor)) continue
    for (const b of m.bulletIds) {
      const n = stats.perBullet.get(b) ?? 0
      if (n < MIN_PER_BULLET) errors.push(`Bullet ${b} has ${n} questions; needs ${MIN_PER_BULLET}`)
    }
    if (m.pl300) {
      const n = stats.placement.get(m.id) ?? 0
      if (n < MIN_PLACEMENT_PER_CARRYOVER) errors.push(`${m.id} has ${n} placement-eligible questions; needs ${MIN_PLACEMENT_PER_CARRYOVER}`)
    }
  }

  const fourOption = stats.positions.reduce((a, b) => a + b, 0)
  if (fourOption >= 20) {
    stats.positions.forEach((n, i) => {
      if (n / fourOption > MAX_POSITION_SHARE) {
        errors.push(`Answer position ${i + 1} holds ${Math.round((n / fourOption) * 100)}% of 4-option answers (max ${MAX_POSITION_SHARE * 100}%)`)
      }
    })
  }
  if (stats.longestCorrect.of >= 20 && stats.longestCorrect.count / stats.longestCorrect.of > MAX_LONGEST_CORRECT_SHARE) {
    errors.push(`The correct option is the longest in ${stats.longestCorrect.count}/${stats.longestCorrect.of} single-choice questions (max 40%)`)
  }
  if (stats.total >= 20 && stats.preview / stats.total > MAX_PREVIEW_SHARE) {
    errors.push(`Preview questions are ${stats.preview}/${stats.total} (max 5%)`)
  }

  if (pending.size === 0 && !casesPending) {
    for (const d of outline.domains) {
      const share = (stats.domainShare.get(d.id) ?? 0) * 100
      if (share < d.weight.min || share > d.weight.max) {
        errors.push(`${d.title} is ${share.toFixed(1)}% of questions; official range ${d.weightText}`)
      }
    }
  }
  return errors
}
