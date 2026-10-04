import { edges } from './edges'
import { buildGraph } from './graph'
import { machines } from './machines'

export const millGraph = buildGraph(
  machines.map((m) => m.id),
  edges,
)
