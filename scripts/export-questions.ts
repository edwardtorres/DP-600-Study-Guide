/**
 * Exports questions for the independent reviewer.
 *   tsx scripts/export-questions.ts <floor|cases|all> <outDir> [idPattern]
 * idPattern (a regular expression) limits the export to matching ids, for example new questions only.
 * Writes <floor>-blind.json (stems and options only) and <floor>-keyed.json.
 * Output goes outside the repo (scratchpad); never commit it.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { allQuestions, caseStudies } from '../src/content/questions/index.ts'
import { machineById } from '../src/data/machines.ts'
import type { Question } from '../src/content/questions/types.ts'

const [floor, outDir, idPattern] = process.argv.slice(2)
const idRe = idPattern ? new RegExp(idPattern) : null
if (!floor || !outDir) {
  console.error('usage: tsx scripts/export-questions.ts <orientation|prepare|semantic|maintain|cases> <outDir>')
  process.exit(1)
}

const picked = allQuestions
  .filter((q) => floor === 'all' || (floor === 'cases' ? q.caseStudyId !== undefined : !q.caseStudyId && machineById.get(q.machineId)?.floor === floor))
  .filter((q) => !idRe || idRe.test(q.id))

function blind(q: Question) {
  const base = { id: q.id, format: q.format, stem: q.stem, caseStudy: q.caseStudyId }
  switch (q.format) {
    case 'single':
    case 'multi':
      return { ...base, options: q.options.map((o) => ({ id: o.id, text: o.text })) }
    case 'yesno':
      return { ...base, statements: q.statements.map((s) => ({ id: s.id, text: s.text })) }
    case 'order':
      return { ...base, items: q.items.map((i) => ({ id: i.id, text: i.text })) }
    case 'match':
      return { ...base, prompts: q.prompts, choices: q.choices }
    case 'dropdown':
      return { ...base, code: q.code, slots: q.slots.map((s) => ({ id: s.id, options: s.options.map((o) => ({ id: o.id, text: o.text })) })) }
  }
}

const usedCases = new Set(picked.map((q) => q.caseStudyId).filter(Boolean))
const cases = caseStudies.filter((c) => usedCases.has(c.id))
writeFileSync(join(outDir, `${floor}-blind.json`), JSON.stringify({ caseStudies: cases, questions: picked.map(blind) }, null, 2))
writeFileSync(join(outDir, `${floor}-keyed.json`), JSON.stringify({ caseStudies: cases, questions: picked }, null, 2))
console.log(`Exported ${picked.length} questions for ${floor}.`)
