import { CheckResult, Rule, RuleContext } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'publish-status'

export const publishStatusRule: Rule = {
  id: RULE_ID,
  label: 'Publish status',
  category: 'docs',
  targetTypes: ['COMPONENT', 'COMPONENT_SET'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Published, up-to-date library components are what consumers and agents typically pull into product files.',
  consequence:
    'Unpublished or changed components mean agents may read stale library context or miss the component entirely.',
  run(node: SceneNode, ctx: RuleContext): CheckResult[] {
    if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET') {
      return []
    }

    const status = ctx.publishStatusByNodeId.get(node.id) ?? 'NA'

    if (status === 'NA') {
      return [
        finding({
          ruleId: RULE_ID,
          node,
          message: 'Publish status not applicable for this node.',
          severity: 'info',
          fixHint: 'No action needed.',
          na: true
        })
      ]
    }

    if (status === 'CURRENT') {
      return []
    }

    if (status === 'UNPUBLISHED') {
      return [
        finding({
          ruleId: RULE_ID,
          node,
          message: 'Component is unpublished.',
          severity: 'warning',
          fixHint:
            'Publish this component to your team library so consumers/agents get the latest definition.'
        })
      ]
    }

    return [
      finding({
        ruleId: RULE_ID,
        node,
        message: 'Component has unpublished changes.',
        severity: 'warning',
        fixHint:
          'Publish the latest changes (or discard them) so library consumers are not on a stale version.'
      })
    ]
  }
}
