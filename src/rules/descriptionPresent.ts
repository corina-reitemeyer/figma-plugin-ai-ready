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
    'A short description explains what the component is for — when to use it, and anything that is not obvious from the picture alone.',
  consequence:
    'Without that note, AI has to guess. It may pick the wrong use, skip important states, or miss accessibility needs.',
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
        message: 'This component has no description.',
        severity: 'warning',
        fixHint:
          'In the right panel, add a short description: what it is, when to use it, and any do/don’t notes.'
      })
    ]
  }
}
