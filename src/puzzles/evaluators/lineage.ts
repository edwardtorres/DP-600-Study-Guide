/**
 * Ripple evaluator: which items impact analysis lists for a change. An edge
 * [a, b] means b depends on a (b is downstream of a).
 */

export const LINEAGE_SOURCES = {
  impact: 'https://learn.microsoft.com/en-us/fabric/governance/impact-analysis',
  lineage: 'https://learn.microsoft.com/en-us/fabric/governance/lineage',
} as const

export const lineageRules = {
  ALL: {
    id: 'LN-ALL',
    text: 'Impact analysis can list all affected downstream items: everything that depends on the changed item, directly or through other items, in any workspace.',
    source: LINEAGE_SOURCES.impact,
  },
  CHILD: {
    id: 'LN-CHILD',
    text: 'The Child items tab lists only direct children: items one step downstream of the changed item.',
    source: LINEAGE_SOURCES.impact,
  },
  VIEW: {
    id: 'LN-VIEW',
    text: 'A workspace’s lineage view doesn’t show downstream items in other workspaces; impact analysis does.',
    source: LINEAGE_SOURCES.lineage,
  },
} as const

/** Items one step downstream. */
export function children(edges: [string, string][], id: string): string[] {
  return [...new Set(edges.filter(([a]) => a === id).map(([, b]) => b))]
}

/** Every item downstream of `id`, directly or indirectly (not including `id`). */
export function downstream(edges: [string, string][], id: string): string[] {
  const seen = new Set<string>()
  const queue = [id]
  while (queue.length) {
    const next = queue.shift()!
    for (const c of children(edges, next)) {
      if (c !== id && !seen.has(c)) {
        seen.add(c)
        queue.push(c)
      }
    }
  }
  return [...seen]
}

/** Throws if the graph has a cycle (lineage is a DAG). */
export function assertAcyclic(nodes: string[], edges: [string, string][]): void {
  for (const n of nodes) {
    const seen = new Set<string>()
    const queue = children(edges, n)
    while (queue.length) {
      const next = queue.shift()!
      if (next === n) throw new Error(`Cycle through ${n}`)
      if (seen.has(next)) continue
      seen.add(next)
      queue.push(...children(edges, next))
    }
  }
}
