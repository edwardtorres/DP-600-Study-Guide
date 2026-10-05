import type { ReactNode } from 'react'
import { languageName, tokenClass, tokenize, type CodeLanguage } from './highlight'

export function Highlighted({ code, language }: { code: string; language: CodeLanguage }) {
  return (
    <>
      {tokenize(code, language).map((t, i) =>
        t.kind === 'plain' ? (
          <span key={i}>{t.text}</span>
        ) : (
          <span key={i} className={tokenClass[t.kind]}>
            {t.text}
          </span>
        ),
      )}
    </>
  )
}

/**
 * A monospace code box with syntax highlighting. It scrolls sideways inside
 * its own box, so long lines never widen the page on a phone.
 */
export function CodeBlock({ code, language, children }: { code?: string; language: CodeLanguage; children?: ReactNode }) {
  return (
    <div className="max-w-full overflow-hidden rounded-md border border-mill-700 bg-mill-950">
      <div className="border-b border-mill-800 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-mill-400">{languageName[language]}</div>
      <pre className="overflow-x-auto p-2 font-mono text-xs leading-relaxed text-mill-50" data-testid="code-block">
        <code>{children ?? <Highlighted code={code ?? ''} language={language} />}</code>
      </pre>
    </div>
  )
}
