import type { FloorId } from '../data/types'

/** "Don't confuse" pairs the notes must cover somewhere. */
export const REQUIRED_PAIRS: Record<string, string> = {
  'storage-modes': 'Import vs DirectQuery vs Direct Lake vs composite',
  'dl-onelake-vs-sql': 'Direct Lake on OneLake vs Direct Lake on SQL analytics endpoint',
  'dl-fallback': 'Direct Lake fallback behavior',
  stores: 'Lakehouse vs warehouse vs eventhouse',
  'endpoint-vs-warehouse': 'SQL analytics endpoint vs warehouse',
  'access-layers': 'Workspace roles vs item permissions vs RLS/CLS/OLS',
  'endorse-vs-label': 'Endorsement vs sensitivity labels',
  'pbi-files': '.pbix vs .pbip vs .pbit vs .pbids',
  'pipelines-vs-git': 'Deployment pipelines vs Git integration',
}

/** Machines whose skill involves code, so they need at least one worked example. */
export const CODE_REQUIRED = [
  'thread-intake',
  'carding-machine',
  'twisting-frame',
  'dye-vat',
  'weave-planner',
  'inspection-bench',
  'recipe-book',
  'tension-meter',
  'dax-scale',
  'punch-card-reader',
  'jacquard-head',
  'speed-governor',
  'thread-sieves',
  'batch-winder',
]

/**
 * Floors whose notes are not written yet. Step 2 writes one floor per commit
 * and shrinks this list; it must be empty when Step 2 ends.
 */
export const NOTES_PENDING: FloorId[] = ['orientation', 'prepare', 'semantic', 'maintain']
