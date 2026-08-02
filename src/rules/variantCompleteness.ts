import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'variant-completeness'

function cartesian(
  groups: Array<{ property: string; values: string[] }>
): Array<Record<string, string>> {
  return groups.reduce<Array<Record<string, string>>>(
    function (acc, group) {
      if (acc.length === 0) {
        return group.values.map(function (value) {
          return { [group.property]: value }
        })
      }
      const next: Array<Record<string, string>> = []
      for (const combo of acc) {
        for (const value of group.values) {
          next.push({ ...combo, [group.property]: value })
        }
      }
      return next
    },
    []
  )
}

function comboKey(combo: Record<string, string>): string {
  return Object.keys(combo)
    .sort()
    .map(function (key) {
      return `${key}=${combo[key]}`
    })
    .join('|')
}

export const variantCompletenessRule: Rule = {
  id: RULE_ID,
  label: 'Missing variants',
  category: 'variants',
  targetTypes: ['COMPONENT_SET'],
  severity: 'error',
  mutable: false,
  rationale:
    'Variant properties (like Size and State) should cover every combination you actually need. That matrix is what AI and code tools use as the component’s options.',
  consequence:
    'Missing combinations make the component look incomplete. AI may skip a state, invent one that does not exist, or break when you add it later.',
  run(node: SceneNode): CheckResult[] {
    if (node.type !== 'COMPONENT_SET') {
      return []
    }

    const groups = Object.entries(node.variantGroupProperties).map(
      function ([property, info]) {
        return { property, values: info.values }
      }
    )

    if (groups.length === 0) {
      return [
        finding({
          ruleId: RULE_ID,
          node,
          message: 'This component set has no variant properties yet.',
          severity: 'error',
          fixHint:
            'Add properties like Size or State so the set clearly lists the options designers and AI can choose from.'
        })
      ]
    }

    const expected = cartesian(groups)
    if (expected.length > 64) {
      // Avoid noisy reports on huge matrices; still flag empty/single-option props.
      const weak = groups.filter((group) => group.values.length < 2)
      return weak.map(function (group) {
        return finding({
          ruleId: RULE_ID,
          node,
          message: `“${group.property}” only has one option. Variants need at least two.`,
          severity: 'info',
          fixHint:
            'Add another value, or turn a simple on/off choice into a boolean property instead of a variant.'
        })
      })
    }

    const present = new Set<string>()
    for (const child of node.children) {
      if (child.type !== 'COMPONENT' || child.variantProperties === null) {
        continue
      }
      present.add(comboKey(child.variantProperties))
    }

    const missing = expected.filter(function (combo) {
      return !present.has(comboKey(combo))
    })

    if (missing.length === 0) {
      return []
    }

    const preview = missing
      .slice(0, 3)
      .map(function (combo) {
        return Object.entries(combo)
          .map(function ([key, value]) {
            return `${key}=${value}`
          })
          .join(', ')
      })
      .join('; ')

    return [
      finding({
        ruleId: RULE_ID,
        node,
        message: `${missing.length} variant combination(s) are missing (for example ${preview}).`,
        severity: 'error',
        fixHint:
          'Add the missing variants in the set, or remove property values you do not need.'
      })
    ]
  }
}
