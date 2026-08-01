import { describe, expect, it } from 'vitest'

import { suggestPascalName } from '../../src/rules/helpers'
import { namingRule } from '../../src/rules/naming'

function mockComponent(name: string): ComponentNode {
  return {
    id: '1:1',
    name,
    type: 'COMPONENT',
    componentPropertyDefinitions: {}
  } as unknown as ComponentNode
}

describe('suggestPascalName', () => {
  it('converts default names', () => {
    expect(suggestPascalName('Frame 123')).toBe('Frame123')
    expect(suggestPascalName('Copy of button')).toBe('Button')
  })
})

describe('namingRule', () => {
  it('flags default component names with autofix payload', () => {
    const results = namingRule.run(mockComponent('Component 1'), {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.autofixId).toBe('rename-convention')
    expect(results[0]?.autofixPayload?.suggestedName).toBeTruthy()
  })

  it('passes clean PascalCase names', () => {
    const results = namingRule.run(mockComponent('Button'), {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results).toEqual([])
  })
})
