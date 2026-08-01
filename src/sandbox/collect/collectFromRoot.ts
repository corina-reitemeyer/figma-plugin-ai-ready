import { AuditNodeType } from '../../shared/types'
import { safeText } from '../../shared/safeText'
import { AuditTarget, COLLECT_NODE_TYPES } from './types'
import { getContainingPage } from './pageHelpers'

const TYPE_SET = new Set<string>(COLLECT_NODE_TYPES)

function isAuditNodeType(type: NodeType): type is AuditNodeType {
  return TYPE_SET.has(type)
}

/**
 * Single-pass walk: collect matching nodes under a root (inclusive).
 */
export function collectFromRoot(root: SceneNode): AuditTarget[] {
  const byId = new Map<string, AuditTarget>()

  function visit(node: SceneNode): void {
    if (isAuditNodeType(node.type)) {
      const page = getContainingPage(node)
      byId.set(node.id, {
        node,
        nodeId: node.id,
        nodeName: safeText(node.name),
        nodeType: node.type,
        pageId: page?.id ?? figma.currentPage.id,
        pageName: safeText(page?.name ?? figma.currentPage.name)
      })
    }

    if ('children' in node) {
      for (const child of node.children) {
        visit(child)
      }
    }
  }

  visit(root)
  return Array.from(byId.values())
}

/**
 * Collect matching nodes on a loaded page via criteria API (one query per page).
 */
export function collectFromPage(page: PageNode): AuditTarget[] {
  const nodes = page.findAllWithCriteria({
    types: [...COLLECT_NODE_TYPES]
  })

  return nodes.map(function (node) {
    return {
      node,
      nodeId: node.id,
      nodeName: safeText(node.name),
      nodeType: node.type as AuditNodeType,
      pageId: page.id,
      pageName: safeText(page.name)
    }
  })
}

export function mergeTargets(groups: AuditTarget[][]): AuditTarget[] {
  const byId = new Map<string, AuditTarget>()
  for (const group of groups) {
    for (const target of group) {
      byId.set(target.nodeId, target)
    }
  }
  return Array.from(byId.values())
}
