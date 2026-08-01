import { NAMING } from '../config/defaults'
import { AutofixRequest, AutofixResult } from '../shared/messages'
import { safeText } from '../shared/safeText'

function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === 'SOLID'
}

async function applyRename(
  nodeId: string,
  suggestedName: string
): Promise<AutofixResult> {
  if (!NAMING.componentNamePattern.test(suggestedName)) {
    return {
      ok: false,
      autofixId: 'rename-convention',
      reason: 'validation-failed',
      detail: 'Suggested name failed the naming convention check.'
    }
  }

  const node = await figma.getNodeByIdAsync(nodeId)
  if (node === null) {
    return {
      ok: false,
      autofixId: 'rename-convention',
      reason: 'not-found',
      detail: 'Node no longer exists.'
    }
  }

  if (!('name' in node)) {
    return {
      ok: false,
      autofixId: 'rename-convention',
      reason: 'unsupported',
      detail: 'This node cannot be renamed.'
    }
  }

  try {
    const previous = safeText(node.name)
    node.name = suggestedName
    return {
      ok: true,
      autofixId: 'rename-convention',
      nodeId: node.id,
      detail: `Renamed "${previous}" to "${safeText(suggestedName)}".`
    }
  } catch (error) {
    return {
      ok: false,
      autofixId: 'rename-convention',
      reason: 'apply-failed',
      detail: error instanceof Error ? error.message : 'Rename failed.'
    }
  }
}

async function applyBindInferred(
  request: Extract<AutofixRequest, { autofixId: 'bind-inferred' }>
): Promise<AutofixResult> {
  const node = await figma.getNodeByIdAsync(request.nodeId)
  if (node === null) {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'not-found',
      detail: 'Node no longer exists.'
    }
  }

  if (
    !('fills' in node) &&
    request.field === 'fills'
  ) {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'unsupported',
      detail: 'Node has no fills.'
    }
  }

  if (!('strokes' in node) && request.field === 'strokes') {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'unsupported',
      detail: 'Node has no strokes.'
    }
  }

  const variable = await figma.variables.getVariableByIdAsync(request.variableId)
  if (variable === null) {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'validation-failed',
      detail: 'Variable no longer exists.'
    }
  }

  const geometryNode = node as GeometryMixin & SceneNode
  const paints = geometryNode[request.field]
  if (paints === figma.mixed || !Array.isArray(paints)) {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'unsupported',
      detail: 'Paint list is mixed or unavailable.'
    }
  }

  const paint = paints[request.paintIndex]
  if (paint === undefined || !isSolidPaint(paint)) {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'validation-failed',
      detail: 'Target paint is missing or not a solid color.'
    }
  }

  try {
    const nextPaint = figma.variables.setBoundVariableForPaint(
      paint,
      'color',
      variable
    )
    const nextPaints = paints.slice()
    nextPaints[request.paintIndex] = nextPaint
    geometryNode[request.field] = nextPaints

    return {
      ok: true,
      autofixId: 'bind-inferred',
      nodeId: node.id,
      detail: `Bound ${request.field}[${request.paintIndex}] to ${safeText(variable.name)}.`
    }
  } catch (error) {
    return {
      ok: false,
      autofixId: 'bind-inferred',
      reason: 'apply-failed',
      detail: error instanceof Error ? error.message : 'Bind failed.'
    }
  }
}

/**
 * Applies a user-confirmed autofix. Call only after the UI confirmation step.
 */
export async function applyConfirmedAutofix(
  request: AutofixRequest
): Promise<AutofixResult> {
  if (request.autofixId === 'rename-convention') {
    return applyRename(request.nodeId, request.suggestedName)
  }
  return applyBindInferred(request)
}
