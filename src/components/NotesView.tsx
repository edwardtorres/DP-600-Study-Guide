import type { ReactNode } from 'react'
import { notesSources } from '../content/validate'
import type { Cited, FabricTool, MachineNotes } from '../content/types'
import { findBullet } from '../data/outline'

const toolLabel: Record<FabricTool, string> = {
  lakehouse: 'Lakehouse',
  warehouse: 'Warehouse',
  'sql-analytics-endpoint': 'SQL analytics endpoint',
  notebook: 'Notebook',
  'dataflow-gen2': 'Dataflow Gen2',
  pipeline: 'Pipeline',
  eventhouse: 'Eventhouse',
  'semantic-model': 'Semantic model',
  'power-bi-desktop': 'Power BI Desktop',
  onelake: 'OneLake',
  'admin-portal': 'Admin portal',
  workspace: 'Workspace',
  other: 'Other',
}

const languageLabel = { tsql: 'T-SQL', kql: 'KQL', dax: 'DAX', pyspark: 'PySpark', sparksql: 'Spark SQL', m: 'Power Query M', tmsl: 'TMSL' }

function Block({ title, children, open = true }: { title: string; children: ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-t border-mill-700 py-3">
      <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wider text-mill-400 hover:text-mill-200">
        <span className="mr-1 inline-block transition-transform group-open:rotate-90">▸</span>
        {title}
      </summary>
      <div className="mt-2 space-y-2 text-sm leading-relaxed text-mill-200">{children}</div>
    </details>
  )
}

export function NotesView({ notes }: { notes: MachineNotes }) {
  const sources = notesSources(notes)
  const ref = (urls: string[]) => (
    <span className="ml-0.5 whitespace-nowrap align-super text-[10px]">
      {urls.map((u) => {
        const n = sources.indexOf(u) + 1
        return (
          <a key={u} href={u} target="_blank" rel="noreferrer" className="mx-px text-brass-300 hover:underline" title={u}>
            [{n}]
          </a>
        )
      })}
    </span>
  )
  const para = (c: Cited, key: number | string) => (
    <p key={key}>
      {c.text}
      {ref(c.sources)}
    </p>
  )

  return (
    <div data-testid="machine-notes">
      {notes.pl300Adds && notes.pl300Adds.length > 0 && (
        <Block title="What DP-600 adds beyond PL-300">
          <div className="rounded-lg border border-weld/40 bg-weld/10 p-3">{notes.pl300Adds.map(para)}</div>
        </Block>
      )}

      <Block title="Overview">{notes.overview.map(para)}</Block>

      {notes.bullets.map((b) => (
        <Block key={b.bulletId} title={`${b.bulletId} · ${findBullet(b.bulletId)?.bullet.text ?? ''}`}>
          <div className="flex flex-wrap gap-1">
            {b.tools.map((t) => (
              <span key={t} className="rounded bg-indigo-thread/20 px-1.5 py-px text-[11px] text-indigo-200">
                {toolLabel[t]}
              </span>
            ))}
          </div>
          <h4 className="pt-1 text-xs font-semibold text-mill-50">Key concepts</h4>
          {b.concepts.map(para)}
          <h4 className="pt-1 text-xs font-semibold text-mill-50">How it's done</h4>
          {b.howTo.map(para)}
        </Block>
      ))}

      {notes.examples.length > 0 && (
        <Block title="Worked examples">
          {notes.examples.map((e) => (
            <div key={e.title} className="space-y-2">
              <p className="font-medium text-mill-50">
                {e.title}
                <span className="ml-2 whitespace-nowrap rounded bg-mill-700 px-1.5 py-px text-[10px] uppercase text-mill-200">{languageLabel[e.language]}</span>
                <span className="ml-1 whitespace-nowrap rounded bg-madder/25 px-1.5 py-px text-[10px] uppercase text-mill-50">Illustrative</span>
                {ref(e.sources)}
              </p>
              <ol className="space-y-2">
                {e.steps.map((s, i) => (
                  <li key={i}>
                    <pre className="overflow-x-auto rounded-md bg-mill-950 p-2 font-mono text-xs text-mill-50">
                      <code>{s.code}</code>
                    </pre>
                    <p className="mt-1 text-xs text-mill-400">
                      <span className="font-semibold text-mill-200">Step {i + 1}.</span> {s.explain}
                    </p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </Block>
      )}

      {notes.traps.length > 0 && (
        <Block title="Exam traps">
          <ul className="list-disc space-y-1 pl-5">
            {notes.traps.map((t, i) => (
              <li key={i}>
                {t.text}
                {ref(t.sources)}
              </li>
            ))}
          </ul>
        </Block>
      )}

      {notes.dontConfuse.length > 0 && (
        <Block title="Don't confuse">
          {notes.dontConfuse.map((d) => (
            <div key={d.pairId} className="rounded-lg border border-mill-600 p-3">
              <p className="mb-1 font-semibold text-mill-50">
                {d.a} <span className="text-mill-400">vs</span> {d.b}
              </p>
              {d.difference.map(para)}
            </div>
          ))}
        </Block>
      )}

      {notes.renamed.length > 0 && (
        <Block title="Renamed features">
          {notes.renamed.map((r) => (
            <p key={r.oldName}>
              <span className="text-mill-400 line-through">{r.oldName}</span> → <span className="font-semibold text-mill-50">{r.newName}</span>.{' '}
              {r.note} <span className="text-brass-300">Exam: {r.examLikely}</span>
              {ref(r.sources)}
            </p>
          ))}
        </Block>
      )}

      {notes.preview.length > 0 && (
        <Block title="Preview features">
          {notes.preview.map((p) => (
            <p key={p.feature}>
              <span className="mr-1 rounded bg-indigo-thread/30 px-1.5 py-px text-[10px] font-semibold uppercase text-indigo-200">Preview</span>
              <span className="font-semibold text-mill-50">{p.feature}.</span> {p.note}
              {ref(p.sources)}
            </p>
          ))}
        </Block>
      )}

      {notes.upcoming.length > 0 && (
        <Block title="Upcoming changes">
          {notes.upcoming.map((u) => (
            <p key={u.date + u.change}>
              <span className="mr-1 rounded bg-madder/30 px-1.5 py-px font-mono text-[11px] text-mill-50">{u.date}</span>
              {u.change}
              {ref(u.sources)}
            </p>
          ))}
        </Block>
      )}

      {notes.glossary.length > 0 && (
        <Block title="Glossary" open={false}>
          <dl className="space-y-2">
            {notes.glossary.map((g) => (
              <div key={g.term}>
                <dt className="font-semibold text-mill-50">{g.term}</dt>
                <dd>
                  {g.definition}
                  {ref(g.sources)}
                </dd>
              </div>
            ))}
          </dl>
        </Block>
      )}

      <Block title={`Sources (${sources.length})`} open={false}>
        <ol className="list-decimal space-y-1 pl-5 text-xs">
          {sources.map((u) => (
            <li key={u}>
              <a href={u} target="_blank" rel="noreferrer" className="break-all text-brass-300 hover:underline">
                {u.replace('https://learn.microsoft.com/en-us/', 'learn: ')}
              </a>
            </li>
          ))}
        </ol>
      </Block>
    </div>
  )
}
