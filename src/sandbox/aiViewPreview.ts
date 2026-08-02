import {
  AiComponentPreview,
  AiValueRow,
  AiVariantProperty
} from '../shared/aiView'
import { AiViewResult } from '../shared/messages'
import { safeText } from '../shared/safeText'

const NO_DESCRIPTION = 'No description'

export function kindLabelFromType(type: string): string {
  return type.replace(/_/g, ' ')
}

export function formatRgbToHex(color: RGB, opacity = 1): string {
  const r = Math.round(clamp01(color.r) * 255)
  const g = Math.round(clamp01(color.g) * 255)
  const b = Math.round(clamp01(color.b) * 255)
  const hex =
    '#' +
    [r, g, b]
      .map(function (channel) {
        return channel.toString(16).padStart(2, '0').toUpperCase()
      })
      .join('')
  if (opacity < 1) {
    return `${hex} @ ${Math.round(opacity * 100)}%`
  }
  return hex
}

export function sizingModeLabel(mode: string): string {
  if (mode === 'HUG') {
    return 'HUG'
  }
  if (mode === 'FILL') {
    return 'FILL'
  }
  if (mode === 'FIXED') {
    return 'FIXED'
  }
  return mode
}

export function formatPaddingGap(
  top: number,
  right: number,
  bottom: number,
  left: number,
  gap: number
): string {
  const padding =
    top === right && right === bottom && bottom === left
      ? String(roundPx(top))
      : top === bottom && left === right
        ? `${roundPx(top)}/${roundPx(right)}`
        : `${roundPx(top)}/${roundPx(right)}/${roundPx(bottom)}/${roundPx(left)}`
  return `Padding ${padding} · Gap ${roundPx(gap)}`
}

function clamp01(value: number): number {
  if (value < 0) {
    return 0
  }
  if (value > 1) {
    return 1
  }
  return value
}

function roundPx(value: number): number {
  return Math.round(value * 100) / 100
}

function isSceneNode(node: BaseNode): node is SceneNode {
  return node.type !== 'DOCUMENT' && node.type !== 'PAGE'
}

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

function hasAutoLayout(
  node: SceneNode
): node is SceneNode & {
  layoutMode: 'NONE' | 'HORIZONTAL' | 'VERTICAL' | 'GRID'
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  itemSpacing: number
  layoutSizingHorizontal: 'FIXED' | 'HUG' | 'FILL'
  layoutSizingVertical: 'FIXED' | 'HUG' | 'FILL'
} {
  return 'layoutMode' in node
}

function childCount(node: SceneNode): number | null {
  if ('children' in node && Array.isArray(node.children)) {
    return node.children.length
  }
  return null
}

async function resolveVariableName(variableId: string): Promise<string | null> {
  try {
    const variable = await figma.variables.getVariableByIdAsync(variableId)
    if (variable === null) {
      return null
    }
    return safeText(variable.name)
  } catch {
    return null
  }
}

async function boundName(
  boundVariables: { [field: string]: VariableAlias | VariableAlias[] } | undefined,
  field: string
): Promise<string | null> {
  if (boundVariables === undefined) {
    return null
  }
  const alias = boundVariables[field]
  if (alias === undefined) {
    return null
  }
  const id = Array.isArray(alias) ? alias[0]?.id : alias.id
  if (id === undefined || id.length === 0) {
    return null
  }
  return resolveVariableName(id)
}

function collectVariantProperties(node: SceneNode): AiVariantProperty[] {
  if (node.type === 'COMPONENT' || node.type === 'INSTANCE') {
    const props = node.variantProperties
    if (props === null) {
      return []
    }
    return Object.keys(props)
      .sort()
      .map(function (label) {
        return {
          label: safeText(label),
          value: safeText(props[label] ?? '')
        }
      })
  }

  if (node.type === 'COMPONENT_SET') {
    const groups = node.variantGroupProperties
    return Object.keys(groups)
      .sort()
      .map(function (label) {
        const values = groups[label]?.values ?? []
        return {
          label: safeText(label),
          value: values.map(safeText).join(' | ')
        }
      })
  }

  return []
}

function buildLayoutLines(node: SceneNode): string[] {
  const lines: string[] = []
  const count = childCount(node)

  if (hasAutoLayout(node) && node.layoutMode !== 'NONE') {
    const direction = node.layoutMode
    const childPart =
      count === null
        ? ''
        : ` · ${count} ${count === 1 ? 'child' : 'children'}`
    lines.push(`${direction} Auto Layout${childPart}`)
    lines.push(
      `Sizing: ${sizingModeLabel(node.layoutSizingHorizontal)} (horizontal) × ${sizingModeLabel(node.layoutSizingVertical)} (vertical)`
    )
    lines.push(
      formatPaddingGap(
        node.paddingTop,
        node.paddingRight,
        node.paddingBottom,
        node.paddingLeft,
        node.itemSpacing
      )
    )
    return lines
  }

  if ('width' in node && 'height' in node) {
    lines.push(`Size ${roundPx(node.width)} × ${roundPx(node.height)}`)
  }

  if (count !== null) {
    lines.push(`${count} ${count === 1 ? 'child' : 'children'}`)
  }

  if (lines.length === 0) {
    lines.push('No layout properties')
  }

  return lines
}

async function buildValueRows(node: SceneNode): Promise<AiValueRow[]> {
  const rows: AiValueRow[] = []

  if ('fills' in node) {
    const fills = node.fills
    if (fills !== figma.mixed && Array.isArray(fills) && fills.length > 0) {
      const paint = fills[0]
      if (paint !== undefined && paint.type === 'SOLID' && paint.visible !== false) {
        const tokenName = await boundName(
          paint.boundVariables as
            | { [field: string]: VariableAlias | VariableAlias[] }
            | undefined,
          'color'
        )
        if (tokenName !== null) {
          rows.push({ label: 'Fill', value: tokenName, kind: 'token' })
        } else {
          const opacity =
            paint.opacity === undefined ? 1 : clamp01(paint.opacity)
          rows.push({
            label: 'Fill',
            value: `${formatRgbToHex(paint.color, opacity)} (not linked)`,
            kind: 'raw'
          })
        }
      }
    }
  }

  if ('cornerRadius' in node) {
    const radius = node.cornerRadius
    if (typeof radius === 'number') {
      const tokenName = await boundName(
        'boundVariables' in node
          ? (node.boundVariables as
              | { [field: string]: VariableAlias | VariableAlias[] }
              | undefined)
          : undefined,
        'cornerRadius'
      )
      if (tokenName !== null) {
        rows.push({ label: 'Corner radius', value: tokenName, kind: 'token' })
      } else {
        rows.push({
          label: 'Corner radius',
          value: `${roundPx(radius)}px`,
          kind: 'raw'
        })
      }
    } else if (radius === figma.mixed) {
      rows.push({
        label: 'Corner radius',
        value: 'Mixed',
        kind: 'raw'
      })
    }
  }

  if (hasAutoLayout(node) && node.layoutMode !== 'NONE') {
    const tokenName = await boundName(
      'boundVariables' in node
        ? (node.boundVariables as
            | { [field: string]: VariableAlias | VariableAlias[] }
            | undefined)
        : undefined,
      'itemSpacing'
    )
    if (tokenName !== null) {
      rows.push({
        label: 'Auto Layout spacing',
        value: tokenName,
        kind: 'token'
      })
    } else {
      rows.push({
        label: 'Auto Layout spacing',
        value: `${roundPx(node.itemSpacing)}px`,
        kind: 'raw'
      })
    }
  }

  if (rows.length === 0) {
    rows.push({
      label: 'Values',
      value: 'No bound or solid values on this layer',
      kind: 'raw'
    })
  }

  return rows
}

async function readDescription(node: SceneNode): Promise<string> {
  if (node.type === 'COMPONENT' || node.type === 'COMPONENT_SET') {
    const description = node.description.trim()
    if (description.length > 0) {
      return safeText(description)
    }
    return NO_DESCRIPTION
  }

  if (node.type === 'INSTANCE') {
    try {
      const main = await node.getMainComponentAsync()
      const description = main?.description.trim() ?? ''
      if (description.length > 0) {
        return safeText(description)
      }
    } catch {
      // fall through
    }
  }

  return NO_DESCRIPTION
}

/**
 * Builds an AI-view preview for a node id. Never trusts the UI payload alone.
 */
export async function buildAiViewPreview(nodeId: string): Promise<AiViewResult> {
  const trimmed = nodeId.trim()
  if (trimmed.length === 0) {
    return { ok: false, nodeId: '', reason: 'invalid-id' }
  }

  const node = await figma.getNodeByIdAsync(trimmed)
  if (node === null) {
    return { ok: false, nodeId: trimmed, reason: 'not-found' }
  }

  if (!isSceneNode(node)) {
    return { ok: false, nodeId: trimmed, reason: 'not-scene' }
  }

  const page = getContainingPage(node)
  const sourceLabel =
    page !== null && page.name.trim().length > 0
      ? safeText(page.name)
      : 'Local'

  const preview: AiComponentPreview = {
    name: safeText(node.name),
    kindLabel: kindLabelFromType(node.type),
    sourceLabel,
    variantProperties: collectVariantProperties(node),
    layout: buildLayoutLines(node),
    values: await buildValueRows(node),
    description: await readDescription(node)
  }

  return {
    ok: true,
    nodeId: node.id,
    preview
  }
}
