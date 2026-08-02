import { collectFromRoot, mergeTargets } from './collectFromRoot'
import { AuditTarget } from './types'

/**
 * Walk selection roots and resolve INSTANCE → main component (+ parent set)
 * so everyday variant clicks produce auditable targets.
 */
export async function collectTargetsFromSelection(
  selection: readonly SceneNode[]
): Promise<AuditTarget[]> {
  const groups: AuditTarget[][] = []

  for (const node of selection) {
    groups.push(collectFromRoot(node))
    const resolved = await resolveInstanceTargets(node)
    if (resolved.length > 0) {
      groups.push(resolved)
    }
  }

  return mergeTargets(groups)
}

async function resolveInstanceTargets(node: SceneNode): Promise<AuditTarget[]> {
  if (node.type !== 'INSTANCE') {
    return []
  }

  try {
    const main = await node.getMainComponentAsync()
    if (main === null) {
      return []
    }

    const groups: AuditTarget[][] = [collectFromRoot(main)]
    const parent = main.parent
    if (parent !== null && parent.type === 'COMPONENT_SET') {
      groups.push(collectFromRoot(parent))
    }
    return mergeTargets(groups)
  } catch {
    return []
  }
}
