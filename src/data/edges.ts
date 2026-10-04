import type { Edge } from './types'

/**
 * Prerequisite threads: `from` must be certified before `to` unlocks.
 * Based on how Fabric skills build on each other and on the order of the
 * DP-600T00 learning paths on Microsoft Learn. Tests keep this graph
 * acyclic, fully reachable, and free of edges already implied by others.
 */
export const edges: Edge[] = [
  // Front Office
  { from: 'founding-charter', to: 'water-wheel', reason: 'OneLake, capacities, and workspaces are the platform under every Fabric workload.' },
  { from: 'water-wheel', to: 'three-vats', reason: 'Lakehouses, warehouses, and eventhouses are items stored in OneLake inside a workspace.' },
  { from: 'water-wheel', to: 'mill-lease', reason: 'A trial gives you a capacity and workspace, so you need to know what those are first.' },

  // Into the Spinning Floor
  { from: 'three-vats', to: 'thread-intake', reason: 'You connect and ingest into a specific store, so you need to know the store types.' },
  { from: 'three-vats', to: 'bale-catalog', reason: 'The OneLake catalog and Real-Time hub list items by type; you need to recognize them.' },
  { from: 'three-vats', to: 'vat-selector', reason: 'Choosing a data store builds on knowing what each store type is.' },
  { from: 'thread-intake', to: 'shared-spool', reason: 'OneLake integration exposes ingested Eventhouse and model data as Delta tables, so ingestion comes first.' },
  { from: 'thread-intake', to: 'carding-machine', reason: 'You clean data after you have connected to it and brought it in.' },
  { from: 'thread-intake', to: 'inspection-bench', reason: 'You query data that is already in a lakehouse or warehouse.' },
  { from: 'thread-intake', to: 'tension-meter', reason: 'KQL queries run against data ingested into an eventhouse.' },
  { from: 'carding-machine', to: 'twisting-frame', reason: 'Joins and aggregations need clean, correctly typed, de-duplicated keys.' },
  { from: 'carding-machine', to: 'dye-vat', reason: 'Derived columns are built on cleaned, correctly typed columns.' },
  { from: 'twisting-frame', to: 'weave-planner', reason: 'Building dimensions and denormalizing are merge and aggregate work.' },
  { from: 'vat-selector', to: 'weave-planner', reason: 'A star schema is implemented differently in a lakehouse than in a warehouse.' },
  { from: 'inspection-bench', to: 'recipe-book', reason: 'Views, functions, and stored procedures wrap SELECT queries you can already write.' },

  // Into the Loom Hall
  { from: 'three-vats', to: 'loom-gearbox', reason: 'Storage modes (including Direct Lake) depend on where the data lives.' },
  { from: 'loom-gearbox', to: 'warp-frame', reason: 'You pick a storage mode when you add tables, before you model them.' },
  { from: 'loom-gearbox', to: 'wide-beam', reason: 'Large model storage format matters for import models, so you need storage modes first.' },
  { from: 'loom-gearbox', to: 'batch-winder', reason: 'Incremental refresh partitions import (or hybrid) tables, so storage modes come first.' },
  { from: 'loom-gearbox', to: 'direct-lake-shuttle', reason: 'Direct Lake is a storage mode; you compare it with import and DirectQuery first.' },
  { from: 'vat-selector', to: 'direct-lake-shuttle', reason: 'Direct Lake on OneLake vs on the SQL analytics endpoint needs lakehouse and warehouse basics.' },
  { from: 'warp-frame', to: 'punch-card-reader', reason: 'DAX filter context flows through the model’s relationships.' },
  { from: 'warp-frame', to: 'double-loom', reason: 'Composite models add relationships across source groups to an existing star schema.' },
  { from: 'warp-frame', to: 'dax-scale', reason: 'DAX queries select from a semantic model’s tables and relationships.' },
  { from: 'punch-card-reader', to: 'jacquard-head', reason: 'Calculation groups and dynamic format strings are written in DAX.' },
  { from: 'punch-card-reader', to: 'speed-governor', reason: 'You can only tune DAX you can already read and write.' },

  // Into the Gatehouse & Pattern Room
  { from: 'water-wheel', to: 'gate-keys', reason: 'Workspace roles apply to workspaces, so you need to know what workspaces are.' },
  { from: 'gate-keys', to: 'item-locks', reason: 'Item permissions are layered on top of workspace roles.' },
  { from: 'item-locks', to: 'thread-sieves', reason: 'Row-, column-, and object-level security narrow access that item permissions already grant.' },
  { from: 'item-locks', to: 'seal-and-stamp', reason: 'Labeling and endorsing need the right item permissions.' },
  { from: 'gate-keys', to: 'pattern-ledger', reason: 'Connecting a workspace to Git needs the workspace Admin role.' },
  { from: 'pattern-ledger', to: 'draft-table', reason: 'A .pbip project is the source-control format for Power BI items.' },
  { from: 'pattern-ledger', to: 'conveyor', reason: 'Deployment pipelines work alongside Git integration in the lifecycle.' },
  { from: 'thread-intake', to: 'ripple-map', reason: 'Impact analysis traces items fed by connections, dataflows, and stores.' },
  { from: 'loom-gearbox', to: 'ripple-map', reason: 'Semantic models are the downstream items impact analysis most often flags.' },
  { from: 'warp-frame', to: 'remote-loom-control', reason: 'You deploy and manage a semantic model’s tables and relationships over XMLA.' },
  { from: 'gate-keys', to: 'remote-loom-control', reason: 'XMLA write access depends on workspace permissions.' },
  { from: 'warp-frame', to: 'pattern-book', reason: 'Shared semantic models and templates reuse a model you have built.' },
  { from: 'thread-intake', to: 'pattern-book', reason: 'A .pbids file packages a data connection.' },
]
