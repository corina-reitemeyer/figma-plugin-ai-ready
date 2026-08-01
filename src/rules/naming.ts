import { NAMING } from '../config/defaults'
import { CheckResult, Rule } from '../shared/types'
import { finding, suggestPascalName } from './helpers'

const RULE_ID = 'naming'

export const namingRule: Rule = {
  id: RULE_ID,
  label: 'Naming convention',
  category: 'naming',
  targetTypes: ['COMPONENT', 'COMPONENT_SET'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Clear, stable component names help coding agents match design nodes to code components and Code Connect mappings.',
  consequence:
    'Agents may invent awkward identifiers, miss the right component, or regenerate unstable names that drift from your design system.',
  run(node: SceneNode): CheckResult[] {
    const name = node.name.trim()
    const results: CheckResult[] = []

    if (NAMING.copyOfPattern.test(name) || NAMING.defaultNamePattern.test(name)) {
      const suggestedName = suggestPascalName(name)
      results.push(
        finding({
          ruleId: RULE_ID,
          node,
          message: `“${name}” looks like a default or duplicated layer name.`,
          severity: 'warning',
          fixTier: 'auto',
          autofixId: 'rename-convention',
          autofixPayload: { suggestedName },
          fixHint: `Rename to something like “${suggestedName}” (PascalCase or Namespace/Component).`
        })
      )
      return results
    }

    if (!NAMING.componentNamePattern.test(name)) {
      const suggestedName = suggestPascalName(name)
      results.push(
        finding({
          ruleId: RULE_ID,
          node,
          message: `“${name}” does not match PascalCase / Namespace/Component naming.`,
          severity: 'warning',
          fixTier: 'auto',
          autofixId: 'rename-convention',
          autofixPayload: { suggestedName },
          fixHint: `Rename to “${suggestedName}” or a slash-grouped name like “Forms/TextField”.`
        })
      )
    }

    if (
      'componentPropertyDefinitions' in node &&
      node.componentPropertyDefinitions
    ) {
      for (const [rawKey, definition] of Object.entries(
        node.componentPropertyDefinitions
      )) {
        const propName = rawKey.split('#')[0] ?? rawKey
        if (
          NAMING.defaultNamePattern.test(propName) ||
          /^(Property|Boolean|Text|Instance)\s*\d*$/i.test(propName)
        ) {
          results.push(
            finding({
              ruleId: RULE_ID,
              node,
              message: `Property “${propName}” (${definition.type}) uses a weak default name.`,
              severity: 'info',
              fixHint:
                'Rename the component property to a clear, code-friendly label (e.g. Label, IsDisabled, Icon).'
            })
          )
        }
      }
    }

    return results
  }
}
