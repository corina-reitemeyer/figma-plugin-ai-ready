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
  const surface = field === 'fills' ? 'fill' : 'stroke'

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
          message: `This ${surface} matches a color variable but is not linked to it.`,
          severity: 'warning',
          fixTier: 'auto',
          autofixId: 'bind-inferred',
          autofixPayload: {
            field,
            paintIndex: index,
            variableId
          },
          fixHint:
            'Link the color to that variable. Then AI can use your design tokens instead of a one-off hex value.'
        })
      )
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
        message: `This ${surface} uses a hardcoded color instead of a variable.`,
        severity: 'info',
        fixHint:
          'Apply a color variable from your library (or create one). That keeps the design and code on the same tokens.'
      })
    )
  })

  return results
}

function checkNodePaints(node: SceneNode & GeometryMixin): CheckResult[] {
  return [
    ...checkPaints(node, node, 'fills'),
    ...checkPaints(node, node, 'strokes')
  ]
}

export const tokenUsageRule: Rule = {
  id: RULE_ID,
  label: 'Use variables',
  category: 'tokens',
  targetTypes: ['COMPONENT', 'COMPONENT_SET', 'FRAME'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Color variables are the shared language between design and code. When a fill is linked to a variable, AI can reuse that token instead of inventing a new hex.',
  consequence:
    'Hardcoded colors show up as one-off values in code. Themes break more easily, and the design system drifts.',
  run(node: SceneNode): CheckResult[] {
    if (node.type === 'COMPONENT_SET') {
      return checkNodePaints(node.defaultVariant)
    }
    if (node.type === 'COMPONENT' || node.type === 'FRAME') {
      return checkNodePaints(node)
    }
    return []
  }
}
