import { describe, expect, it } from 'vitest'
import { allQuestions } from '../../content/questions'
import { tokenize } from './highlight'

describe('code highlighter', () => {
  it('classifies T-SQL tokens', () => {
    const t = tokenize("SELECT COALESCE(Region, 'Unknown') -- fill\nFROM dbo.T WHERE Amount > 10", 'tsql')
    const kinds = (k: string) => t.filter((x) => x.kind === k).map((x) => x.text)
    expect(kinds('keyword')).toEqual(['SELECT', 'FROM', 'WHERE'])
    expect(kinds('function')).toEqual(['COALESCE'])
    expect(kinds('string')).toEqual(["'Unknown'"])
    expect(kinds('comment')).toEqual(['-- fill'])
    expect(kinds('number')).toEqual(['10'])
  })

  it('classifies KQL and DAX tokens', () => {
    const k = tokenize('StormEvents\n| summarize Events = count() by bin(StartTime, 30d)', 'kql')
    expect(k.filter((x) => x.kind === 'keyword').map((x) => x.text)).toEqual(['summarize', 'by'])
    expect(k.find((x) => x.text === '30d')?.kind).toBe('number')
    const d = tokenize('EVALUATE SUMMARIZECOLUMNS(\'Date\'[Month], "Orders", [Orders])', 'dax')
    expect(d[0]).toEqual({ kind: 'keyword', text: 'EVALUATE' })
    expect(d.find((x) => x.text === 'SUMMARIZECOLUMNS')?.kind).toBe('function')
  })

  it('never loses text, for every code question in the bank', () => {
    for (const q of allQuestions) {
      if (q.format !== 'dropdown') continue
      expect(tokenize(q.code, q.language).map((t) => t.text).join('')).toBe(q.code)
    }
  })
})
