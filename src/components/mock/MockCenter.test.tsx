import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { allQuestions, caseStudies } from '../../content/questions'
import { newSave, type MockRecord } from '../../save/schema'
import { MockCenter } from './MockCenter'

const byId = new Map(allQuestions.map((q) => [q.id, q]))
const ids = allQuestions.filter((q) => !q.caseStudyId && q.bulletIds.length > 0).slice(0, 10).map((q) => q.id)
const rec = (id: string, freshness: number, day: number): MockRecord => ({
  id,
  startedAt: `2026-10-${day}T09:00:00.000Z`,
  finishedAt: `2026-10-${day}T10:00:00.000Z`,
  durationMin: 100,
  caseStudyId: caseStudies[0]!.id,
  questionIds: ids,
  correct: ids.map(() => 1),
  timedOut: false,
  freshness,
})

describe('MockCenter', () => {
  it('shows each mock’s freshness and explains why a stale mock didn’t count', () => {
    const save = { ...newSave(new Date('2026-10-20T00:00:00Z')), mocks: [rec('A', 0.9, 10), rec('B', 0.3, 12)] }
    render(<MockCenter save={save} questions={byId} cases={caseStudies} showId={null} nextRepeatsCase={false} now={Date.now()} onStart={() => {}} onResume={() => {}} onOpenPair={() => {}} onClose={() => {}} />)
    expect(screen.getByTestId('ready-to-book')).toHaveTextContent('Not ready to book yet')
    expect(screen.getByTestId('stale-mocks')).toHaveTextContent('only 30% of its main-section questions were fresh')
    const history = screen.getByTestId('mock-history')
    expect(history).toHaveTextContent('fresh 90%')
    expect(history).toHaveTextContent('fresh 30%')
    expect(history).toHaveTextContent('doesn’t count')
  })
})
