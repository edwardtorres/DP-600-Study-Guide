/**
 * Exports questions for the independent reviewer.
 *   tsx scripts/export-questions.ts <floor|cases> <outDir>
 * Writes <floor>-blind.json (stems and options only) and <floor>-keyed.json.
 * Output goes outside the repo (scratchpad); never commit it.
 */
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { allQuestions, caseStudies } from '../src/content/questions/index.ts'
import { machineById } from '../src/data/machines.ts'
import type { Question } from '../src/content/questions/types.ts'

const [floor, outDir] = process.argv.slice(2)
if (!floor || !outDir) {
  console.error('usage: tsx scripts/export-questions.ts <orientation|prepare|semantic|maintain|cases> <outDir>')
  process.exit(1)
}

const picked = allQuestions.filter((q) =>
  floor === 'cases' ? q.caseStudyId !== undefined : !q.caseStudyId && machineById.get(q.machineId)?.floor === floor,
)

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

const cases = floor === 'cases' ? caseStudies : []
writeFileSync(join(outDir, `${floor}-blind.json`), JSON.stringify({ caseStudies: cases, questions: picked.map(blind) }, null, 2))
writeFileSync(join(outDir, `${floor}-keyed.json`), JSON.stringify({ caseStudies: cases, questions: picked }, null, 2))
console.log(`Exported ${picked.length} questions for ${floor}.`)
