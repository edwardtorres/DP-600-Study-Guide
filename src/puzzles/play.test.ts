import { describe, expect, it } from 'vitest'
import { allPuzzles, puzzleById } from '../content/puzzles'
import { recordPuzzle } from '../game/puzzles'
import { readiness, totalXp } from '../game/progress'
import { outline } from '../data/outline'
import { newSave } from '../save/schema'
import { initialResponse, isPuzzleComplete, scorePuzzle, shuffleForPlay, type PuzzleResponse } from './play'

const now = new Date('2026-10-05T12:00:00Z')

describe('puzzle play', () => {
  it('shuffles choices per play, stable within a play, keeping ids and keys', () => {
    const p = puzzleById.get('AM-05')!.build(0)
    const a = shuffleForPlay(p, 1)
    expect(shuffleForPlay(p, 1)).toEqual(a)
    const orders = new Set(Array.from({ length: 10 }, (_, s) => shuffleForPlay(p, s).decisions[0]!.choices.map((c) => c.id).join()))
    expect(orders.size).toBeGreaterThan(1)
    expect(a.decisions.map((d) => d.accepted)).toEqual(p.decisions.map((d) => d.accepted))
  })

  it('spreads accepted answers across positions after shuffling', () => {
    let first = 0
    let total = 0
    for (const p of allPuzzles) {
      for (let s = 0; s < 5; s++) {
        for (const d of shuffleForPlay(p.build(s), s).decisions) {
          if (d.ui !== 'buttons' || d.choices.length < 3) continue
          total++
          if (d.accepted.includes(d.choices[0]!.id)) first++
        }
      }
    }
    expect(first / total).toBeLessThan(0.45)
  })

  it('scores per decision: 80% for multi-decision puzzles, exact for single-decision ones', () => {
    const p = puzzleById.get('PD-01')!.build(0)
    const right: PuzzleResponse = Object.fromEntries(p.decisions.map((d) => [d.id, d.accepted[0]]))
    expect(scorePuzzle(p, right).correct).toBe(true)
    const wrong = (n: number) => {
      const r = { ...right }
      for (const d of p.decisions.slice(0, n)) r[d.id] = d.choices.find((c) => !d.accepted.includes(c.id))!.id
      return r
    }
    const total = p.decisions.length
    const allowed = Math.floor(total * 0.2 + 1e-9)
    expect(scorePuzzle(p, wrong(allowed)).correct).toBe(true)
    expect(scorePuzzle(p, wrong(allowed + 1)).correct).toBe(false)
    const single = puzzleById.get('SF-01')!.build(0)
    const d = single.decisions[0]!
    expect(scorePuzzle(single, { [d.id]: d.accepted[0] }).correct).toBe(true)
    expect(scorePuzzle(single, { [d.id]: d.choices.find((c) => !d.accepted.includes(c.id))!.id }).correct).toBe(false)
  })

  it('toggles start answered; other decisions start empty', () => {
    const rp = puzzleById.get('RP-01')!.build(0)
    expect(isPuzzleComplete(rp, initialResponse(rp))).toBe(true)
    const gb = puzzleById.get('GB-S01')!.build(0)
    expect(isPuzzleComplete(gb, initialResponse(gb))).toBe(false)
  })

  it('recording a puzzle logs one z entry, earns XP, feeds readiness, and never certifies', () => {
    const save = newSave(now)
    const p = puzzleById.get('QO-T01')!
    const next = recordPuzzle(save, p.meta.id, true, now)
    expect(next.answers).toEqual([['QO-T01', 1, Math.floor(now.getTime() / 1000), 'z']])
    expect(next.machines).toBe(save.machines)
    const lookup = new Map(allPuzzles.map((x) => [x.meta.id, x.meta]))
    expect(totalXp(next.answers, lookup)).toBe(20)
    expect(totalXp(recordPuzzle(next, p.meta.id, true, now).answers, lookup)).toBe(25)
    const r = readiness(next.answers, lookup, outline)
    expect(r.domains.find((d) => d.domain === 'PREPARE')!.answered).toBe(1)
  })
})
