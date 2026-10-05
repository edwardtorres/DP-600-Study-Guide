export type CodeLanguage = 'tsql' | 'kql' | 'dax'
export const languageName: Record<CodeLanguage, string> = { tsql: 'T-SQL', kql: 'KQL', dax: 'DAX' }
export type TokenKind = 'keyword' | 'function' | 'string' | 'number' | 'comment' | 'operator' | 'plain'
export interface Token {
  kind: TokenKind
  text: string
}

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean).map((w) => w.toLowerCase()))

const KEYWORDS: Record<CodeLanguage, Set<string>> = {
  tsql: words(`select from where group by having order asc desc qualify over partition join inner left right full outer cross on
    as and or not in is null like between top distinct insert into values update set delete merge using when matched then target
    source create alter drop table view procedure proc function returns return begin end exec execute declare with case else
    union all except intersect grant deny revoke security policy add filter predicate state schemabinding nulls last first`),
  kql: words(`where project extend summarize by sort order asc desc top take limit join kind on count distinct let and or not
    between in has contains startswith endswith render union lookup mv-expand parse project-away project-rename`),
  dax: words(`define measure evaluate var return order by asc desc start at table column true false in not and or`),
}

/** Splits code into tokens for highlighting. Unknown text stays plain, so nothing is ever dropped. */
export function tokenize(code: string, language: CodeLanguage): Token[] {
  const tokens: Token[] = []
  const push = (kind: TokenKind, text: string) => {
    const last = tokens.at(-1)
    if (last && last.kind === kind && kind === 'plain') last.text += text
    else tokens.push({ kind, text })
  }
  const lineComment = language === 'tsql' ? '--' : '//'
  let i = 0
  while (i < code.length) {
    const rest = code.slice(i)
    const ch = code[i]!
    if (rest.startsWith(lineComment) || (language !== 'tsql' && rest.startsWith('--'))) {
      const end = code.indexOf('\n', i)
      const stop = end === -1 ? code.length : end
      push('comment', code.slice(i, stop))
      i = stop
      continue
    }
    if (ch === "'" || ch === '"') {
      let j = i + 1
      while (j < code.length && code[j] !== ch) j++
      push('string', code.slice(i, Math.min(j + 1, code.length)))
      i = j + 1
      continue
    }
    const num = /^\d+(\.\d+)?[a-z]*/i.exec(rest)
    if (num && !/[\w]/.test(code[i - 1] ?? '')) {
      push('number', num[0])
      i += num[0].length
      continue
    }
    const word = /^[A-Za-z_][\w-]*/.exec(rest)
    if (word) {
      let w = word[0]
      // Hyphenated words are only kept for KQL operators like project-away.
      if (w.includes('-') && !(language === 'kql' && KEYWORDS.kql.has(w.toLowerCase()))) w = w.split('-')[0]!
      const after = code.slice(i + w.length).match(/^\s*\(/)
      // In KQL, count() and similar are functions even though count is also an operator.
      if (KEYWORDS[language].has(w.toLowerCase()) && !(language === 'kql' && after)) push('keyword', w)
      else if (after) push('function', w)
      else push('plain', w)
      i += w.length
      continue
    }
    if (/[=<>!+\-*/|%]/.test(ch)) {
      push('operator', ch)
      i++
      continue
    }
    push('plain', ch)
    i++
  }
  return tokens
}

export const tokenClass: Record<TokenKind, string> = {
  keyword: 'text-indigo-200 font-semibold',
  function: 'text-brass-300',
  string: 'text-emerald-300',
  number: 'text-orange-300',
  comment: 'text-mill-400 italic',
  operator: 'text-pink-300',
  plain: '',
}
