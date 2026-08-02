import { collectFromRoot, mergeTargets } from './collectFromRoot'
import { AuditTarget } from './types'

/**
 * Walk selection roots, collect audit nodes, and resolve INSTANCE → main
 * component (+ parent set). Nested instances under a selected frame/group
 * are resolved too so screen-level selections stay useful.
 */
export async function collectTargetsFromSelection(
  selection: readonly SceneNode[]
): Promise<AuditTarget[]> {
  const groups: AuditTarget[][] = []
  const seenInstanceIds = new Set<string>()

  for (const node of selection) {
    groups.push(collectFromRoot(node))

    const instances = listInstancesInTree(node)
    for (const instance of instances) {
      if (seenInstanceIds.has(instance.id)) {
        continue
      }
      seenInstanceIds.add(instance.id)
      const resolved = await resolveInstanceTargets(instance)
      if (resolved.length > 0) {
        groups.push(resolved)
      }
    }
  }

  return mergeTargets(groups)
}

/** Root instance plus nested instances; do not walk inside instance children. */
export function listInstancesInTree(root: SceneNode): InstanceNode[] {
  const found: InstanceNode[] = []

  function visit(node: SceneNode): void {
    if (node.type === 'INSTANCE') {
      found.push(node)
      return
    }
    if ('children' in node) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(root)
  return found
}

async function resolveInstanceTargets(
  node: InstanceNode
): Promise<AuditTarget[]> {
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
