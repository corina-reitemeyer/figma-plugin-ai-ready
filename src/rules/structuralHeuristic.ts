import { NAMING } from '../config/defaults'
import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'structural-heuristic'

/** Cap how many of these tips appear in one scan. */
export const STRUCTURAL_TIP_CAP = 5

const SCREEN_NAME_PATTERN =
  /^(desktop|mobile|tablet|iphone|ipad|android|web|page|screen|section|homepage|home|landing|checkout|dashboard|artboard)\b/i

export type StructuralSignals = {
  componentLikeName: boolean
  autoLayoutCluster: boolean
  uiLikeChildren: boolean
  compactWidgetSize: boolean
}

/** Exported for unit tests. */
export function countSignals(signals: StructuralSignals): number {
  let total = 0
  if (signals.componentLikeName) total += 1
  if (signals.autoLayoutCluster) total += 1
  if (signals.uiLikeChildren) total += 1
  if (signals.compactWidgetSize) total += 1
  return total
}

/** Exported for unit tests. */
export function normalizeNameBase(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/\s+\d+$/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

/** Exported for unit tests. */
export function isScreenOrSectionShell(
  node: FrameNode | GroupNode,
  parent: BaseNode | null
): boolean {
  const name = node.name.trim()
  if (SCREEN_NAME_PATTERN.test(name)) {
    return true
  }
  // "Desktop / Home", "iPhone 14 - Checkout"
  if (/\s\/\s/.test(name) || /\s-\s/.test(name)) {
    if (SCREEN_NAME_PATTERN.test(name.split(/[/-]/)[0]?.trim() ?? '')) {
      return true
    }
  }

  if (!('width' in node) || !('height' in node)) {
    return false
  }

  const width = node.width
  const height = node.height
  const largeArtboard = width >= 600 && height >= 600
  const wideStrip = width >= 900 && height >= 200

  if (parent !== null && parent.type === 'PAGE' && (largeArtboard || wideStrip)) {
    return true
  }

  return largeArtboard && height >= 800
}

function collectSignals(node: FrameNode | GroupNode): StructuralSignals {
  const childCount = 'children' in node ? node.children.length : 0
  const name = node.name.trim()
  const hasAutoLayout =
    'layoutMode' in node && node.layoutMode !== 'NONE'

  let hasText = false
  let hasVisual = false
  if ('children' in node) {
    for (const child of node.children) {
      if (child.type === 'TEXT') {
        hasText = true
      }
      if (
        child.type === 'INSTANCE' ||
        child.type === 'RECTANGLE' ||
        child.type === 'ELLIPSE' ||
        child.type === 'VECTOR' ||
        child.type === 'BOOLEAN_OPERATION' ||
        child.type === 'COMPONENT'
      ) {
        hasVisual = true
      }
    }
  }

  const width = 'width' in node ? node.width : 0
  const height = 'height' in node ? node.height : 0
  const compactWidgetSize =
    width >= 40 &&
    height >= 24 &&
    width <= 480 &&
    height <= 320

  return {
    componentLikeName: NAMING.componentNamePattern.test(name),
    autoLayoutCluster: hasAutoLayout && childCount >= 3,
    uiLikeChildren: hasText && hasVisual && childCount >= 2,
    compactWidgetSize
  }
}

function sizeClose(
  a: FrameNode | GroupNode,
  b: FrameNode | GroupNode
): boolean {
  if (!('width' in a) || !('width' in b)) {
    return false
  }
  const widthRatio =
    Math.min(a.width, b.width) / Math.max(a.width, b.width || 1)
  const heightRatio =
    Math.min(a.height, b.height) / Math.max(a.height, b.height || 1)
  return widthRatio >= 0.85 && heightRatio >= 0.85
}

function layoutCompatible(
  a: FrameNode | GroupNode,
  b: FrameNode | GroupNode
): boolean {
  const aMode = 'layoutMode' in a ? a.layoutMode : 'NONE'
  const bMode = 'layoutMode' in b ? b.layoutMode : 'NONE'
  return aMode === bMode
}

/** Exported for unit tests. */
export function countSimilarSiblings(
  node: FrameNode | GroupNode,
  siblings: readonly SceneNode[]
): number {
  const childCount = 'children' in node ? node.children.length : 0
  const base = normalizeNameBase(node.name)
  let similar = 0

  for (const sibling of siblings) {
    if (sibling.id === node.id) {
      continue
    }
    if (sibling.type !== 'FRAME' && sibling.type !== 'GROUP') {
      continue
    }

    const siblingChildren =
      'children' in sibling ? sibling.children.length : 0
    const childCountClose = Math.abs(siblingChildren - childCount) <= 1
    const nameClose =
      base.length >= 3 && normalizeNameBase(sibling.name) === base
    const alike =
      childCountClose &&
      layoutCompatible(node, sibling) &&
      (sizeClose(node, sibling) || nameClose)

    if (alike) {
      similar += 1
    }
  }

  return similar
}

function shouldTip(
  signalCount: number,
  similarSiblingCount: number
): boolean {
  // Strong candidate alone, or medium candidate with reuse evidence nearby.
  if (signalCount >= 3) {
    return true
  }
  return signalCount >= 2 && similarSiblingCount >= 1
}

function siblingSceneNodes(parent: BaseNode | null): readonly SceneNode[] {
  if (parent === null) {
    return []
  }
  if (parent.type === 'PAGE') {
    return parent.children
  }
  if (parent.type === 'DOCUMENT') {
    return []
  }
  if ('children' in parent) {
    return parent.children as readonly SceneNode[]
  }
  return []
}

export const structuralHeuristicRule: Rule = {
  id: RULE_ID,
  label: 'Looks like a component',
  category: 'structure',
  targetTypes: ['FRAME', 'GROUP'],
  severity: 'info',
  mutable: true,
  rationale:
    'If the same chunk of UI shows up more than once, it usually belongs as a component — so every screen shares one building block.',
  consequence:
    'Reusable UI left as a plain frame is easy for AI to rebuild from scratch each time, with small differences that drift out of sync.',
  run(node: SceneNode): CheckResult[] {
    if (node.type !== 'FRAME' && node.type !== 'GROUP') {
      return []
    }

    let ancestor: BaseNode | null = node.parent ?? null
    while (ancestor !== null) {
      if (
        ancestor.type === 'COMPONENT' ||
        ancestor.type === 'COMPONENT_SET'
      ) {
        return []
      }
      ancestor = ancestor.parent ?? null
    }

    const parent = node.parent ?? null
    if (isScreenOrSectionShell(node, parent)) {
      return []
    }

    const signals = collectSignals(node)
    const signalCount = countSignals(signals)
    if (signalCount < 2) {
      return []
    }

    const similarSiblingCount = countSimilarSiblings(
      node,
      siblingSceneNodes(parent)
    )

    if (!shouldTip(signalCount, similarSiblingCount)) {
      return []
    }

    const reuseNote =
      similarSiblingCount > 0
        ? ` It looks similar to ${similarSiblingCount} nearby layer${similarSiblingCount === 1 ? '' : 's'}.`
        : ''

    return [
      finding({
        ruleId: RULE_ID,
        node,
        message: `“${node.name}” looks like reusable UI, but it is still a plain frame.${reuseNote}`,
        severity: 'info',
        excludeFromScore: true,
        fixHint:
          'If you reuse this UI, turn it into a component. If it is a one-off layout, you can ignore this tip — it does not lower your score.'
      })
    ]
  }
}
