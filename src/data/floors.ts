import type { DomainId, FloorId } from './types'

export interface Floor {
  id: FloorId
  name: string
  /** What happens on this floor, in plain words. */
  blurb: string
  domain?: DomainId
}

/** Top-to-bottom order of the mill map, following how the work flows. */
export const floors: Floor[] = [
  {
    id: 'orientation',
    name: 'Front Office',
    blurb: 'Fabric background the exam outline assumes you already know.',
  },
  {
    id: 'prepare',
    name: 'Spinning Floor & Dye House',
    blurb: 'Get, transform, and inspect data.',
    domain: 'PREPARE',
  },
  {
    id: 'semantic',
    name: 'Loom Hall',
    blurb: 'Design, build, and tune semantic models.',
    domain: 'SEMANTIC',
  },
  {
    id: 'maintain',
    name: 'Gatehouse & Pattern Room',
    blurb: 'Security, governance, and the development lifecycle.',
    domain: 'MAINTAIN',
  },
]

export const floorForDomain: Record<DomainId, FloorId> = {
  PREPARE: 'prepare',
  SEMANTIC: 'semantic',
  MAINTAIN: 'maintain',
}
