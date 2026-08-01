import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'token-usage'

function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === 'SOLID'
}

function paintBound(paint: SolidPaint): boolean {
  return paint.boundVariables?.color !== undefined
}

function checkPaints(
  reportNode: SceneNode,
  geometryNode: SceneNode & GeometryMixin,
  field: 'fills' | 'strokes'
): CheckResult[] {
  const paints = geometryNode[field]
  if (paints === figma.mixed || !Array.isArray(paints)) {
    return []
  }

  const results: CheckResult[] = []
  const inferred = geometryNode.inferredVariables?.[field]

  paints.forEach(function (paint, index) {
    if (!isSolidPaint(paint) || paintBound(paint)) {
      return
    }

    const matches = inferred?.[index] ?? []
    if (matches.length === 1 && matches[0] !== undefined) {
      const variableId = matches[0].id
      results.push(
        finding({
          ruleId: RULE_ID,
          node: reportNode,
          message: `Hardcoded ${field}[${index}] matches an existing variable but is not bound.`,
          severity: 'warning',
          fixTier: 'auto',
          autofixId: 'bind-inferred',
          autofixPayload: {
            field,
            paintIndex: index,
            variableId
          },
          fixHint:
            'Bind this paint to the inferred variable so agents emit token references instead of raw hex.'
        })
      )
      // Point autofix at the geometry node that owns the paint.
      const last = results[results.length - 1]
      if (last !== undefined) {
        last.nodeId = geometryNode.id
        last.nodeName = geometryNode.name
      }
      return
    }

    results.push(
      finding({
        ruleId: RULE_ID,
        node: reportNode,
        message: `Hardcoded solid ${field}[${index}] is not bound to a variable.`,
        severity: 'info',
        fixHint:
          'Bind the color to a design token/variable (or style) that maps to your code theme API.'
      })
    )
  })

  return results
}

export const tokenUsageRule: Rule = {
  id: RULE_ID,
  label: 'Token usage',
  category: 'tokens',
  targetTypes: ['COMPONENT', 'COMPONENT_SET'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Bound variables tell MCP/codegen which design tokens to use instead of baking in raw values.',
  consequence:
    'Agents emit magic numbers/hex values that drift when tokens change and are harder to theme.',
  run(node: SceneNode): CheckResult[] {
    if (node.type === 'COMPONENT_SET') {
      return [
        ...checkPaints(node, node.defaultVariant, 'fills'),
        ...checkPaints(node, node.defaultVariant, 'strokes')
      ]
    }
    if (node.type === 'COMPONENT') {
      return [
        ...checkPaints(node, node, 'fills'),
        ...checkPaints(node, node, 'strokes')
      ]
    }
    return []
  }
}
