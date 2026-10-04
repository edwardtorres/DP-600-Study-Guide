import { describe, expect, it } from 'vitest'
import { edges } from './edges'
import { buildGraph, depths, reachableFrom, redundantEdges, startNodes, topoOrder } from './graph'
import { machines } from './machines'
import { allBullets, outline } from './outline'
import type { Edge, Machine } from './types'
import { validateAll, validateGraph, validateMapping } from './validate'
import { CARD_H, CARD_W, layoutMill } from '../game/layout'

const ids = machines.map((m) => m.id)
const graph = buildGraph(ids, edges)

describe('bullet mapping', () => {
  it('maps every outline bullet to exactly one machine', () => {
    const counts = new Map(allBullets.map((b) => [b.id, 0]))
    for (const m of machines) for (const id of m.bulletIds) counts.set(id, (counts.get(id) ?? 0) + 1)
    expect([...counts.entries()].filter(([, n]) => n !== 1)).toEqual([])
    expect(machines.flatMap((m) => m.bulletIds)).toHaveLength(41)
  })

  it('gives every non-orientation machine 1–3 bullets from its own floor', () => {
    expect(validateMapping(outline, machines)).toEqual([])
  })

  it('has at most 4 orientation machines, none owning bullets', () => {
    const orientation = machines.filter((m) => m.orientation)
    expect(orientation.length).toBeLessThanOrEqual(4)
    expect(orientation.every((m) => m.bulletIds.length === 0 && m.floor === 'orientation')).toBe(true)
  })

  it('always pairs a themed name with a real skill name', () => {
    for (const m of machines) {
      expect(m.themedName.trim()).not.toBe('')
      expect(m.skillName.trim()).not.toBe('')
    }
  })

  it('catches a bullet mapped twice or not at all', () => {
    const twice: Machine[] = machines.map((m) => (m.id === 'dye-vat' ? { ...m, bulletIds: ['P2.2', 'P2.9'] } : m))
    expect(validateMapping(outline, twice).join()).toMatch(/P2\.9 is in both/)
    const missing = machines.map((m) => (m.id === 'dye-vat' ? { ...m, bulletIds: [] } : m))
    expect(validateMapping(outline, missing).join()).toMatch(/P2\.2 is not mapped/)
  })
})

describe('prerequisite graph', () => {
  it('is acyclic', () => {
    expect(topoOrder(graph)).not.toBeNull()
  })

  it('reaches every machine from a starting machine', () => {
    const roots = startNodes(graph)
    expect(roots).toEqual(['founding-charter'])
    expect(reachableFrom(graph, roots).size).toBe(machines.length)
  })

  it('has no redundant, duplicate, or reasonless edges', () => {
    expect(redundantEdges(graph, edges)).toEqual([])
    expect(validateGraph(machines, edges)).toEqual([])
  })

  it('detects a cycle and a redundant edge', () => {
    const cyclic: Edge[] = [...edges, { from: 'warp-frame', to: 'three-vats', reason: 'test' }]
    expect(validateGraph(machines, cyclic)).toContain('Prerequisite graph has a cycle')
    const redundant: Edge[] = [...edges, { from: 'founding-charter', to: 'three-vats', reason: 'test' }]
    expect(validateGraph(machines, redundant).join()).toMatch(/redundant/)
  })

  it('assigns layout depths that increase along every edge', () => {
    const d = depths(graph)
    for (const e of edges) expect(d.get(e.to)!).toBeGreaterThan(d.get(e.from)!)
  })
})

it('passes every content check together', () => {
  expect(validateAll(outline, machines, edges)).toEqual([])
})

describe('mill layout', () => {
  it('places every machine on its own floor without overlaps', () => {

    const layout = layoutMill(machines, graph)
    const placed = machines.map((m) => ({ m, p: layout.nodes.get(m.id)! }))
    for (const { m, p } of placed) {
      const band = layout.bands.find((b) => b.floor === m.floor)!
      expect(p.y).toBeGreaterThanOrEqual(band.y)
      expect(p.y + CARD_H).toBeLessThanOrEqual(band.y + band.height)
    }
    for (const a of placed)
      for (const b of placed)
        if (a !== b) {
          const overlap = Math.abs(a.p.x - b.p.x) < CARD_W && Math.abs(a.p.y - b.p.y) < CARD_H
          expect(overlap, `${a.m.id} overlaps ${b.m.id}`).toBe(false)
        }
  })
})
