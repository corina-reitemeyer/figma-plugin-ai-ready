import { describe, expect, it } from 'vitest'

import { variantCompletenessRule } from '../../src/rules/variantCompleteness'

function mockSet(
  values: Record<string, string[]>,
  children: Array<Record<string, string>>
): ComponentSetNode {
  return {
    id: '2:1',
    name: 'Button',
    type: 'COMPONENT_SET',
    variantGroupProperties: Object.fromEntries(
      Object.entries(values).map(function ([property, opts]) {
        return [property, { values: opts }]
      })
    ),
    children: children.map(function (variantProperties, index) {
      return {
        id: `2:${index + 2}`,
        name: 'Variant',
        type: 'COMPONENT',
        variantProperties
      }
    })
  } as unknown as ComponentSetNode
}

describe('variantCompletenessRule', () => {
  it('flags missing combinations as errors', () => {
    const node = mockSet(
      { Size: ['S', 'M'], State: ['Default', 'Hover'] },
      [{ Size: 'S', State: 'Default' }]
    )
    const results = variantCompletenessRule.run(node, {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results[0]?.message).toMatch(/3 variant combination/)
    expect(results[0]?.severity).toBe('error')
  })

  it('flags component sets with no variant properties as errors', () => {
    const node = mockSet({}, [])
    const results = variantCompletenessRule.run(node, {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results[0]?.severity).toBe('error')
    expect(results[0]?.message).toMatch(/no variant properties/)
  })

  it('passes a complete matrix', () => {
    const node = mockSet(
      { Size: ['S', 'M'] },
      [{ Size: 'S' }, { Size: 'M' }]
    )
    const results = variantCompletenessRule.run(node, {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results).toEqual([])
  })
})
