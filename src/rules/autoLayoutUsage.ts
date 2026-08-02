import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'auto-layout-usage'

function missingAutoLayoutFinding(node: SceneNode): CheckResult {
  return finding({
    ruleId: RULE_ID,
    node,
    message: `“${node.name}” is not using Auto Layout.`,
    severity: 'warning',
    fixHint:
      'Select the layer and click Auto Layout (Shift + A). That helps AI turn spacing into real layout in code, not fixed positions.'
  })
}

export const autoLayoutUsageRule: Rule = {
  id: RULE_ID,
  label: 'Auto Layout',
  category: 'structure',
  targetTypes: ['COMPONENT', 'COMPONENT_SET', 'FRAME'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Auto Layout shows how pieces sit next to each other and how much space is between them — the same way flex layout works in code.',
  consequence:
    'Without Auto Layout, AI often places everything with fixed X/Y positions. The design looks right once, then breaks when content or screen size changes.',
  run(node: SceneNode): CheckResult[] {
    if (node.type === 'COMPONENT') {
      if (node.layoutMode !== 'NONE') {
        return []
      }
      return [missingAutoLayoutFinding(node)]
    }

    if (node.type === 'COMPONENT_SET') {
      const variant = node.defaultVariant
      if (variant.layoutMode !== 'NONE') {
        return []
      }
      return [missingAutoLayoutFinding(variant)]
    }

    if (node.type === 'FRAME') {
      if (node.layoutMode !== 'NONE') {
        return []
      }
      // Skip empty / single-child shells to reduce noise on wrappers.
      if (node.children.length < 2) {
        return []
      }
      return [missingAutoLayoutFinding(node)]
    }

    return []
  }
}
