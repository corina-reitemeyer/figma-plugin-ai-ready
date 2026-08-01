import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'auto-layout-usage'

function checkComponentFrame(node: ComponentNode): CheckResult[] {
  if (node.layoutMode !== 'NONE') {
    return []
  }
  return [
    finding({
      ruleId: RULE_ID,
      node,
      message: 'Top-level component frame uses absolute positioning (no Auto Layout).',
      severity: 'warning',
      fixHint:
        'Apply Auto Layout (horizontal/vertical) so MCP get_design_context can infer spacing and structure more reliably.'
    })
  ]
}

export const autoLayoutUsageRule: Rule = {
  id: RULE_ID,
  label: 'Auto Layout usage',
  category: 'structure',
  targetTypes: ['COMPONENT', 'COMPONENT_SET'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Auto Layout communicates structure and spacing that coding agents can translate into flex/stack layouts.',
  consequence:
    'Without Auto Layout, agents often emit brittle absolute positioning that is harder to maintain in code.',
  run(node: SceneNode): CheckResult[] {
    if (node.type === 'COMPONENT') {
      return checkComponentFrame(node)
    }
    if (node.type === 'COMPONENT_SET') {
      return checkComponentFrame(node.defaultVariant)
    }
    return []
  }
}
