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
  label: 'Variant matrix completeness',
  category: 'variants',
  targetTypes: ['COMPONENT_SET'],
  severity: 'warning',
  mutable: false,
  rationale:
    'Agents and Code Connect map variants from the full property matrix. Missing combinations look like incomplete APIs.',
  consequence:
    'Generated code may omit states, invent fake variants, or fail when a designer later adds the missing combination.',
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
          message: 'Component set has no variant properties defined.',
          severity: 'warning',
          fixHint:
            'Add variant properties (e.g. Size, State) so the set describes a clear matrix.'
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
          message: `Variant property “${group.property}” has fewer than 2 options.`,
          severity: 'info',
          fixHint:
            'Add the missing options, or convert a Yes/No variant into a boolean component property.'
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
        message: `Missing ${missing.length} variant combination(s) (e.g. ${preview}).`,
        severity: 'warning',
        fixHint:
          'Add the missing variants, or remove unused property values from the variant matrix.'
      })
    ]
  }
}
