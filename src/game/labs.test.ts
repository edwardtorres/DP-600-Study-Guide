import { describe, expect, it } from 'vitest'
import { allLabs, labById } from '../content/labs'
import { allQuestions } from '../content/questions'
import { outline } from '../data/outline'
import { newSave } from '../save/schema'
import { isCertified } from './state'
import { readiness } from './progress'
import {
  completeLab,
  debriefPool,
  drawDebrief,
  exportLabNotes,
  isLabComplete,
  LAB_XP,
  labXp,
  recordDebrief,
  requiredStepIds,
  setProblem,
  setStepDone,
  setTrialStart,
  suggestSchedule,
  trialClock,
} from './labs'
import { mulberry32 } from './shuffle'

const now = new Date('2026-10-05T12:00:00Z')
const lab = labById.get('L02')!

function tickAll(save = newSave(now)) {
  return requiredStepIds(lab).reduce((s, id) => setStepDone(s, lab.id, id, true, now), save)
}

describe('lab progress', () => {
  it('ticks and unticks steps', () => {
    let s = setStepDone(newSave(now), 'L02', 's1', true, now)
    expect(s.labs.L02?.steps).toEqual({ s1: true })
    s = setStepDone(s, 'L02', 's1', false, now)
    expect(s.labs.L02?.steps).toEqual({})
  })

  it('trims problem notes, caps their length, and removes empty ones', () => {
    let s = setProblem(newSave(now), 'L02', 's3', '  The button is called Get data now  ', now)
    expect(s.labs.L02?.problems.s3).toBe('The button is called Get data now')
    s = setProblem(s, 'L02', 's3', 'x'.repeat(5000), now)
    expect(s.labs.L02?.problems.s3).toHaveLength(2000)
    s = setProblem(s, 'L02', 's3', '   ', now)
    expect(s.labs.L02?.problems).toEqual({})
  })

  it('completes only when every required step (cleanup included) is ticked', () => {
    const partial = setStepDone(newSave(now), lab.id, 's1', true, now)
    const r = completeLab(partial, lab, now)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.missing).toContain('c1')
    expect(requiredStepIds(lab)).not.toContain('s8') // optional step
    const done = completeLab(tickAll(), lab, now)
    expect(done.ok).toBe(true)
    if (done.ok) expect(isLabComplete(done.save, lab.id)).toBe(true)
  })

  it('earns a fixed amount of XP and never certifies a machine', () => {
    const r = completeLab(tickAll(), lab, now)
    if (!r.ok) throw new Error('should complete')
    expect(labXp(r.save)).toBe(LAB_XP)
    expect(r.save.machines).toEqual({})
    for (const m of lab.machineIds) expect(isCertified(r.save, m)).toBe(false)
    // Completing twice doesn't add XP.
    const again = completeLab(r.save, lab, now)
    expect(again.ok && labXp(again.save)).toBe(LAB_XP)
  })
})

describe('debrief', () => {
  it('draws three non-case questions on the lab’s bullets for every lab', () => {
    for (const l of allLabs) {
      const qs = drawDebrief(l, allQuestions, mulberry32(7))
      expect(qs, l.id).toHaveLength(3)
      expect(new Set(qs.map((q) => q.id)).size).toBe(3)
      for (const q of qs) {
        expect(q.caseStudyId).toBeUndefined()
        if (l.bulletIds.length) expect(q.bulletIds.some((b) => l.bulletIds.includes(b))).toBe(true)
        else expect(l.machineIds).toContain(q.machineId)
      }
    }
  })

  it('spreads the draw over different bullets when it can', () => {
    const l = labById.get('L03')!
    const qs = drawDebrief(l, allQuestions, mulberry32(1))
    expect(new Set(qs.map((q) => q.bulletIds.find((b) => l.bulletIds.includes(b)))).size).toBe(3)
    expect(debriefPool(l, allQuestions).every((q) => !q.caseStudyId)).toBe(true)
  })

  it("logs answers with code 'l' that count toward readiness and leave machines alone", () => {
    const l = labById.get('L05')!
    const qs = debriefPool(l, allQuestions).slice(0, 3)
    let s = newSave(now)
    for (let i = 0; i < 4; i++) s = recordDebrief(s, qs.map((q) => q.id), [true, true, false], now)
    expect(s.answers.every((a) => a[3] === 'l')).toBe(true)
    expect(s.machines).toEqual({})
    const byId = new Map(allQuestions.map((q) => [q.id, q]))
    const r = readiness(s.answers, byId, outline)
    const prepare = r.domains.find((d) => d.domain === 'PREPARE')!
    expect(prepare.answered).toBe(12)
  })
})

describe('trial clock and schedule', () => {
  it('counts trial days in local calendar days', () => {
    expect(trialClock('2026-10-01', '2026-10-01')).toEqual({ day: 1, daysLeft: 60, lastDay: '2026-11-29', ended: false })
    expect(trialClock('2026-10-01', '2026-11-29')).toMatchObject({ day: 60, daysLeft: 1 })
    expect(trialClock('2026-10-01', '2026-12-05')).toMatchObject({ daysLeft: 0, ended: true })
  })

  it('spreads remaining labs in order and finishes five days before the end', () => {
    const sched = suggestSchedule(allLabs, '2026-10-01', '2026-10-01')
    expect(sched.finishBy).toBe('2026-11-24')
    expect(sched.items.map((i) => i.labId)).toEqual(allLabs.map((l) => l.id))
    expect(sched.items[0]!.day).toBe('2026-10-01')
    expect(sched.items.at(-1)!.day).toBe('2026-11-24')
    const days = sched.items.map((i) => i.day)
    expect([...days].sort()).toEqual(days)
    // Prerequisites are never scheduled after the labs that need them.
    const dayOf = new Map(sched.items.map((i) => [i.labId, i.day]))
    for (const l of allLabs) for (const p of l.prereqs) expect(dayOf.get(p)! <= dayOf.get(l.id)!).toBe(true)
    expect(sched.tight).toBe(false)
  })

  it('suggests today for everything once the buffer is reached', () => {
    const sched = suggestSchedule(allLabs.slice(0, 3), '2026-10-01', '2026-11-27')
    expect(sched.tight).toBe(true)
    expect(new Set(sched.items.map((i) => i.day))).toEqual(new Set(['2026-11-27']))
  })

  it('stores and clears the trial start date', () => {
    const s = setTrialStart(newSave(now), '2026-10-01', now)
    expect(s.trialStart).toBe('2026-10-01')
    expect(setTrialStart(s, undefined, now).trialStart).toBeUndefined()
  })
})

describe('export', () => {
  it('lists labs with progress and every problem note', () => {
    let s = setTrialStart(newSave(now), '2026-10-01', now)
    s = setStepDone(s, 'L02', 's1', true, now)
    s = setProblem(s, 'L02', 's3', 'No "Load to Tables" option\non my screen', now)
    const text = exportLabNotes(s, allLabs, now)
    expect(text).toContain('Trial started 2026-10-01 (day 5 of 60)')
    expect(text).toContain('L02 Thread intake')
    expect(text).toContain('1/' + (lab.steps.length + lab.cleanup.length) + ' steps ticked')
    expect(text).toContain('Step 3 [L02/s3] (not ticked)')
    expect(text).toContain('Problem: No "Load to Tables" option / on my screen')
    expect(text).not.toContain('L03')
  })

  it('says so when there is no progress', () => {
    expect(exportLabNotes(newSave(now), allLabs, now)).toContain('No lab progress yet.')
  })
})
