import { SelectNodeResult } from '../shared/messages'
import { safeText } from '../shared/safeText'

function getContainingPage(node: BaseNode): PageNode | null {
  let current: BaseNode | null = node
  while (current !== null) {
    if (current.type === 'PAGE') {
      return current
    }
    current = current.parent
  }
  return null
}

function isSceneNode(node: BaseNode): node is SceneNode {
  return node.type !== 'DOCUMENT' && node.type !== 'PAGE'
}

/**
 * Re-resolves the node in the sandbox (never trust the UI alone), then selects + zooms.
 */
export async function selectAndZoom(nodeId: string): Promise<SelectNodeResult> {
  const trimmed = nodeId.trim()
  if (trimmed.length === 0) {
    return { ok: false, reason: 'invalid-id' }
  }

  const node = await figma.getNodeByIdAsync(trimmed)
  if (node === null) {
    return { ok: false, reason: 'not-found' }
  }

  if (!isSceneNode(node)) {
    return { ok: false, reason: 'not-selectable' }
  }

  const page = getContainingPage(node)
  if (page !== null && page.id !== figma.currentPage.id) {
    await figma.setCurrentPageAsync(page)
  }

  figma.currentPage.selection = [node]
  figma.viewport.scrollAndZoomIntoView([node])

  return {
    ok: true,
    nodeId: node.id,
    nodeName: safeText(node.name)
  }
}
