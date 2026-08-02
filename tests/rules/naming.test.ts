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

function mockFrame(name: string): FrameNode {
  return {
    id: '2:1',
    name,
    type: 'FRAME',
    children: []
  } as unknown as FrameNode
}

describe('suggestPascalName', () => {
  it('converts default names', () => {
    expect(suggestPascalName('Frame 123')).toBe('Frame123')
    expect(suggestPascalName('Copy of button')).toBe('Button')
  })
})

describe('namingRule', () => {
  it('flags default component names as errors with autofix payload', () => {
    const results = namingRule.run(mockComponent('Component 1'), {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]?.severity).toBe('error')
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

  it('flags default frame names as warnings but allows sentence-case screens', () => {
    const ctx = {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    }
    const defaultFrame = namingRule.run(mockFrame('Frame 12'), ctx)
    expect(defaultFrame[0]?.autofixId).toBe('rename-convention')
    expect(defaultFrame[0]?.severity).toBe('warning')

    const screen = namingRule.run(mockFrame('Checkout header'), ctx)
    expect(screen).toEqual([])
  })

  it('flags non-conventional component names as warnings', () => {
    const results = namingRule.run(mockComponent('my button'), {
      mutedRuleIds: new Set(),
      publishStatusByNodeId: new Map()
    })
    expect(results[0]?.severity).toBe('warning')
  })

  it('does not read property definitions on variant components', () => {
    const set = {
      id: 'set:1',
      name: 'Button',
      type: 'COMPONENT_SET'
    } as unknown as ComponentSetNode
    const variant = {
      id: '1:9',
      name: 'Size=Medium, State=Default',
      type: 'COMPONENT',
      parent: set,
      get componentPropertyDefinitions() {
        throw new Error(
          'Can only get component property definitions of a component set or non-variant component'
        )
      }
    } as unknown as ComponentNode

    expect(() =>
      namingRule.run(variant, {
        mutedRuleIds: new Set(),
        publishStatusByNodeId: new Map()
      })
    ).not.toThrow()
  })
})
