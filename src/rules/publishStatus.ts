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
    'Published library components are what other files (and AI tools) usually see. Unpublished work stays private to this file.',
  consequence:
    'If the latest version is not published, teams and AI may build from an old component — or miss it completely.',
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
          message: 'Publish status is not available for this component.',
          severity: 'info',
          fixHint: 'Nothing to do here.',
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
          message: 'This component is not published to the library yet.',
          severity: 'warning',
          fixHint:
            'Publish it to your team library so other files and AI tools can use the real component.'
        })
      ]
    }

    return [
      finding({
        ruleId: RULE_ID,
        node,
        message: 'This component has changes that are not published yet.',
        severity: 'warning',
        fixHint:
          'Publish the update (or discard the changes) so everyone is looking at the same version.'
      })
    ]
  }
}
