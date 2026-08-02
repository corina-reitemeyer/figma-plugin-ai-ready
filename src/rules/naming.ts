import { NAMING } from '../config/defaults'
import { CheckResult, Rule } from '../shared/types'
import { finding, suggestPascalName } from './helpers'

const RULE_ID = 'naming'

export const namingRule: Rule = {
  id: RULE_ID,
  label: 'Clear names',
  category: 'naming',
  targetTypes: ['COMPONENT', 'COMPONENT_SET', 'FRAME', 'GROUP'],
  severity: 'error',
  mutable: false,
  rationale:
    'A clear name tells an AI what this layer is for — like “Button” or “Checkout header” instead of “Frame 12”.',
  consequence:
    'Vague names make the AI guess. You get odd labels in code, or it may miss the right component entirely.',
  run(node: SceneNode): CheckResult[] {
    const name = node.name.trim()
    const results: CheckResult[] = []
    const isFrameOrGroup = node.type === 'FRAME' || node.type === 'GROUP'

    if (NAMING.copyOfPattern.test(name) || NAMING.defaultNamePattern.test(name)) {
      const suggestedName = suggestPascalName(name)
      // Components/sets: agents can’t identify the layer — error.
      // Frames/groups: still important, but screens can work without perfect names.
      results.push(
        finding({
          ruleId: RULE_ID,
          node,
          message: `“${name}” looks like a default Figma name.`,
          severity: isFrameOrGroup ? 'warning' : 'error',
          fixTier: 'auto',
          autofixId: 'rename-convention',
          autofixPayload: { suggestedName },
          fixHint: `Rename it to something meaningful, for example “${suggestedName}”.`
        })
      )
      return results
    }

    // Frames/groups: only flag default/copy names. Screens often use sentence case.
    if (isFrameOrGroup) {
      return results
    }

    if (!NAMING.componentNamePattern.test(name)) {
      const suggestedName = suggestPascalName(name)
      results.push(
        finding({
          ruleId: RULE_ID,
          node,
          message: `“${name}” is hard for tools to read as a component name.`,
          severity: 'warning',
          fixTier: 'auto',
          autofixId: 'rename-convention',
          autofixPayload: { suggestedName },
          fixHint: `Use a simple name like “${suggestedName}”, or group it like “Forms/Text field”.`
        })
      )
    }

    // Property definitions live on the set (or a standalone component).
    // Variant components throw if you read componentPropertyDefinitions.
    if (canReadPropertyDefinitions(node)) {
      try {
        const definitions = node.componentPropertyDefinitions
        for (const [rawKey, definition] of Object.entries(definitions)) {
          const propName = rawKey.split('#')[0] ?? rawKey
          if (
            NAMING.defaultNamePattern.test(propName) ||
            /^(Property|Boolean|Text|Instance)\s*\d*$/i.test(propName)
          ) {
            results.push(
              finding({
                ruleId: RULE_ID,
                node,
                message: `Property “${propName}” still has a default name.`,
                severity: 'info',
                fixHint:
                  'Rename the property to what it means in the UI — for example Label, Disabled, or Icon.'
              })
            )
          }
        }
      } catch {
        // Ignore Figma getter failures on edge node types.
      }
    }

    return results
  }
}

function canReadPropertyDefinitions(
  node: SceneNode
): node is ComponentNode | ComponentSetNode {
  if (node.type === 'COMPONENT_SET') {
    return true
  }
  if (node.type !== 'COMPONENT') {
    return false
  }
  // Variant members are children of a component set — definitions are on the set.
  const parent = node.parent
  return parent == null || parent.type !== 'COMPONENT_SET'
}
