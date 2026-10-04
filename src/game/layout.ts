import { floors } from '../data/floors'
import { depths, type Graph } from '../data/graph'
import type { FloorId, Machine } from '../data/types'

export const CARD_W = 184
export const CARD_H = 92
export const COL_W = 224
export const ROW_H = 108
export const MAX_ROWS = 4
export const BAND_PAD_TOP = 44
export const BAND_PAD_BOTTOM = 24
export const LEFT_PAD = 24

export interface Placed {
  id: string
  floor: FloorId
  x: number
  y: number
}

export interface Band {
  floor: FloorId
  y: number
  height: number
}

export interface MillLayout {
  width: number
  height: number
  bands: Band[]
  nodes: Map<string, Placed>
}

/**
 * Each floor is a horizontal band. Inside a floor, columns follow
 * prerequisite depth (left → right), starting from that floor's shallowest
 * machine, so every floor uses the full width. A column holds at most
 * MAX_ROWS machines and spills into the next. Machines are ordered by the
 * average position of their prerequisites so threads cross less.
 */
export function layoutMill(machines: Machine[], graph: Graph): MillLayout {
  const depth = depths(graph)
  const nodes = new Map<string, Placed>()
  const bands: Band[] = []
  let y = 0
  let maxCols = 1

  for (const floor of floors) {
    const onFloor = machines.filter((m) => m.floor === floor.id)
    const floorDepths = [...new Set(onFloor.map((m) => depth.get(m.id) ?? 0))].sort((a, b) => a - b)
    let col = 0
    let rows = 1
    for (const d of floorDepths) {
      const score = (id: string) => {
        const pre = (graph.prereqs.get(id) ?? []).map((p) => nodes.get(p)).filter((p) => p !== undefined)
        return pre.length ? pre.reduce((a, p) => a + p.x + p.y / 10_000, 0) / pre.length : 0
      }
      const column = onFloor.filter((m) => depth.get(m.id) === d).sort((a, b) => score(a.id) - score(b.id))
      column.forEach((m, i) => {
        const c = col + Math.floor(i / MAX_ROWS)
        const r = i % MAX_ROWS
        nodes.set(m.id, { id: m.id, floor: floor.id, x: LEFT_PAD + c * COL_W, y: y + BAND_PAD_TOP + r * ROW_H })
      })
      rows = Math.max(rows, Math.min(column.length, MAX_ROWS))
      col += Math.ceil(column.length / MAX_ROWS)
    }
    maxCols = Math.max(maxCols, col)
    const height = BAND_PAD_TOP + (rows - 1) * ROW_H + CARD_H + BAND_PAD_BOTTOM
    bands.push({ floor: floor.id, y, height })
    y += height
  }

  return { width: LEFT_PAD * 2 + (maxCols - 1) * COL_W + CARD_W, height: y, bands, nodes }
}

/** SVG path for a thread. Same floor: left → right. Across floors: vertical. */
export function threadPath(a: Placed, b: Placed): string {
  if (a.floor === b.floor) {
    const x1 = a.x + CARD_W
    const y1 = a.y + CARD_H / 2
    const x2 = b.x
    const y2 = b.y + CARD_H / 2
    const bend = Math.max(30, Math.abs(x2 - x1) / 2)
    return `M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}`
  }
  const down = b.y > a.y
  const x1 = a.x + CARD_W / 2
  const y1 = down ? a.y + CARD_H : a.y
  const x2 = b.x + CARD_W / 2
  const y2 = down ? b.y : b.y + CARD_H
  const bend = Math.max(40, Math.abs(y2 - y1) / 2) * (down ? 1 : -1)
  return `M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}`
}
