import type { Edge } from './types'

export interface Graph {
  ids: string[]
  prereqs: Map<string, string[]>
  unlocks: Map<string, string[]>
}

export function buildGraph(ids: string[], edges: Edge[]): Graph {
  const prereqs = new Map(ids.map((id) => [id, [] as string[]]))
  const unlocks = new Map(ids.map((id) => [id, [] as string[]]))
  for (const e of edges) {
    prereqs.get(e.to)?.push(e.from)
    unlocks.get(e.from)?.push(e.to)
  }
  return { ids, prereqs, unlocks }
}

export function startNodes(g: Graph): string[] {
  return g.ids.filter((id) => (g.prereqs.get(id) ?? []).length === 0)
}

/** Kahn's algorithm. Returns null when the graph has a cycle. */
export function topoOrder(g: Graph): string[] | null {
  const indegree = new Map(g.ids.map((id) => [id, (g.prereqs.get(id) ?? []).length]))
  const queue = g.ids.filter((id) => indegree.get(id) === 0)
  const order: string[] = []
  while (queue.length > 0) {
    const id = queue.shift()!
    order.push(id)
    for (const next of g.unlocks.get(id) ?? []) {
      const d = (indegree.get(next) ?? 0) - 1
      indegree.set(next, d)
      if (d === 0) queue.push(next)
    }
  }
  return order.length === g.ids.length ? order : null
}

export function reachableFrom(g: Graph, roots: string[]): Set<string> {
  const seen = new Set<string>()
  const stack = [...roots]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    stack.push(...(g.unlocks.get(id) ?? []))
  }
  return seen
}

/** Edges whose target is still reachable from their source without them. */
export function redundantEdges(g: Graph, edges: Edge[]): Edge[] {
  return edges.filter((e) => {
    const others = (g.unlocks.get(e.from) ?? []).filter((n) => n !== e.to)
    return reachableFrom(g, others).has(e.to)
  })
}

/** Longest-path depth from any start node. Used for left-to-right layout. */
export function depths(g: Graph): Map<string, number> {
  const order = topoOrder(g) ?? g.ids
  const depth = new Map<string, number>()
  for (const id of order) {
    const pre = g.prereqs.get(id) ?? []
    depth.set(id, pre.length === 0 ? 0 : Math.max(...pre.map((p) => (depth.get(p) ?? 0) + 1)))
  }
  return depth
}
