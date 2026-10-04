import outlineJson from '../../scripts/official-outline.json'
import type { Outline, OutlineBullet, OutlineDomain } from './types'

export const outline = outlineJson as Outline

export const allBullets: OutlineBullet[] = outline.domains.flatMap((d) =>
  d.sections.flatMap((s) => s.bullets),
)

const bulletIndex = new Map<string, { bullet: OutlineBullet; domain: OutlineDomain }>()
for (const domain of outline.domains) {
  for (const section of domain.sections) {
    for (const bullet of section.bullets) bulletIndex.set(bullet.id, { bullet, domain })
  }
}

export function findBullet(id: string) {
  return bulletIndex.get(id)
}
