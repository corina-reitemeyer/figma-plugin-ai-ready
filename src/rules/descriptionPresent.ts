import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'description-present'

export const descriptionPresentRule: Rule = {
  id: RULE_ID,
  label: 'Component description',
  category: 'docs',
  targetTypes: ['COMPONENT', 'COMPONENT_SET'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Component descriptions give agents usage context (purpose, states, accessibility notes) beyond the visual tree.',
  consequence:
    'Without a description, agents guess intent and may generate the wrong API or omit important constraints.',
  run(node: SceneNode): CheckResult[] {
    if (node.type !== 'COMPONENT' && node.type !== 'COMPONENT_SET') {
      return []
    }

    const description = node.description.trim()
    if (description.length > 0) {
      return []
    }

    return [
      finding({
        ruleId: RULE_ID,
        node,
        message: 'Component has no description.',
        severity: 'warning',
        fixHint:
          'Add a short description covering purpose, key props/variants, and any a11y or usage notes for implementers/agents.'
      })
    ]
  }
}
