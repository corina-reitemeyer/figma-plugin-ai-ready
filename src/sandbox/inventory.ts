import {
  AuditTarget
} from './collect/types'
import { InventoryPageRow, InventorySummary, Issue } from '../shared/types'

export function buildInventory(
  targets: readonly AuditTarget[],
  issues: readonly Issue[]
): InventorySummary {
  const pageMap = new Map<
    string,
    {
      pageId: string
      pageName: string
      componentCount: number
      componentSetCount: number
      issueCount: number
    }
  >()

  let componentCount = 0
  let componentSetCount = 0
  let frameCount = 0

  for (const target of targets) {
    if (target.nodeType === 'COMPONENT') {
      componentCount += 1
    } else if (target.nodeType === 'COMPONENT_SET') {
      componentSetCount += 1
    } else if (target.nodeType === 'FRAME') {
      frameCount += 1
    }

    const existing = pageMap.get(target.pageId)
    if (existing === undefined) {
      pageMap.set(target.pageId, {
        pageId: target.pageId,
        pageName: target.pageName,
        componentCount: target.nodeType === 'COMPONENT' ? 1 : 0,
        componentSetCount: target.nodeType === 'COMPONENT_SET' ? 1 : 0,
        issueCount: 0
      })
    } else {
      if (target.nodeType === 'COMPONENT') {
        existing.componentCount += 1
      }
      if (target.nodeType === 'COMPONENT_SET') {
        existing.componentSetCount += 1
      }
    }
  }

  for (const issue of issues) {
    if (issue.na === true || issue.pageId === undefined) {
      continue
    }
    const row = pageMap.get(issue.pageId)
    if (row !== undefined) {
      row.issueCount += 1
    }
  }

  const pages: InventoryPageRow[] = Array.from(pageMap.values()).map(
    function (row) {
      return {
        pageId: row.pageId,
        pageName: row.pageName,
        componentCount: row.componentCount,
        componentSetCount: row.componentSetCount,
        // Page-level score filled later when we have richer scoring; null for now if no issues tracked as score
        score: null
      }
    }
  )

  return {
    componentCount,
    componentSetCount,
    frameCount,
    pageCount: pages.length,
    nodeCount: targets.length,
    pages
  }
}
