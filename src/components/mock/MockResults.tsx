import { pairIndex } from '../../content/pairs'
import type { Question } from '../../content/questions/types'
import { findBullet, outline } from '../../data/outline'
import { scoreMock } from '../../game/mock'
import { emptyResponse, type Response } from '../../game/score'
import type { MockRecord } from '../../save/schema'
import { QuestionResult } from '../questions/QuestionResult'

export const SCORING_URL = 'https://learn.microsoft.com/en-us/credentials/certifications/exam-scoring-reports'

const pct = (x: number) => `${Math.round(x * 100)}%`

/** One mock's results: raw percentages, per-bullet results, trap pairs, and every question with its explanation and sources. */
export function MockResults({ record, questions, onOpenPair }: { record: MockRecord; questions: Map<string, Question>; onOpenPair: (machineId: string, pairId: string) => void }) {
  const score = scoreMock(record, questions, outline)
  const traps = [...new Set(record.questionIds.filter((_, i) => record.correct[i] === 0).map((id) => questions.get(id)?.trapPairId).filter((p): p is string => !!p))]
  const bullets = [...score.byBullet].sort((a, b) => a[1].pct - b[1].pct || a[0].localeCompare(b[0]))
  const minutes = Math.round((Date.parse(record.finishedAt) - Date.parse(record.startedAt)) / 60000)
  return (
    <div className="space-y-5" data-testid="mock-results">
      <section className="rounded-xl border border-mill-600 bg-mill-900 p-4" role="status">
        <p className="font-display text-3xl font-bold text-mill-50" data-testid="mock-overall">
          {pct(score.overall.pct)}
        </p>
        <p className="text-sm text-mill-200">
          {score.overall.right} of {score.overall.total} correct (raw) · {minutes} of {record.durationMin} minutes{record.timedOut ? ' · time ran out' : ''}
        </p>
        <p className="mt-2 text-xs text-mill-400" data-testid="scaled-note">
          Microsoft reports exam scores on a scale of 1 to 1,000, and 700 passes. Learn says that because it’s a scaled score, it may not equal 70% of the points, so this raw percentage can’t predict your exam score exactly.{' '}
          <a href={SCORING_URL} target="_blank" rel="noreferrer" className="text-brass-300 hover:underline">
            Exam scoring on Learn ↗
          </a>
        </p>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">By domain</h3>
        <ul className="space-y-2" data-testid="mock-domains">
          {outline.domains.map((d) => {
            const t = score.byDomain.get(d.id)
            return (
              <li key={d.id}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0 text-mill-50">{d.title}</span>
                  <span className="shrink-0 text-mill-200">{t ? `${pct(t.pct)} (${t.right}/${t.total})` : '—'}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-mill-700">
                  <div className={`h-full ${t && t.pct >= 0.7 ? 'bg-emerald-400' : 'bg-madder'}`} style={{ width: `${(t?.pct ?? 0) * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">By exam skill, weakest first</h3>
        <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2" data-testid="mock-bullets">
          {bullets.map(([b, t]) => (
            <li key={b} className="flex justify-between gap-2 rounded border border-mill-700 px-2 py-1">
              <span className="min-w-0 truncate text-mill-200" title={findBullet(b)?.bullet.text}>
                <span className="mr-1 font-mono text-brass-300">{b}</span>
                {findBullet(b)?.bullet.text}
              </span>
              <span className={`shrink-0 ${t.pct >= 0.7 ? 'text-emerald-300' : 'text-madder'}`}>
                {t.right}/{t.total}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section data-testid="mock-traps">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">“Don’t confuse” traps you fell for</h3>
        {traps.length === 0 ? (
          <p className="text-sm text-mill-400">None this time.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {traps.map((id) => {
              const p = pairIndex.get(id)
              return p ? (
                <li key={id}>
                  <button type="button" onClick={() => onOpenPair(p.machineId, id)} className="rounded-lg border border-weld/50 bg-weld/10 px-3 py-1.5 text-left text-xs text-mill-50 hover:border-weld">
                    {p.a} vs {p.b}
                  </button>
                </li>
              ) : null
            })}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-mill-400">Every question</h3>
        <div className="space-y-3">
          {record.questionIds.map((id, i) => {
            const q = questions.get(id)
            if (!q) return null
            const r = (record.responses?.[id] as Response | undefined) ?? emptyResponse(q)
            return <QuestionResult key={id} index={i} question={q} response={r} correct={record.correct[i] === 1} onOpenPair={onOpenPair} />
          })}
        </div>
      </section>
    </div>
  )
}
