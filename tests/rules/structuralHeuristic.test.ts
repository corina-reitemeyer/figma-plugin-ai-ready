import { describe, expect, it } from 'vitest'

import {
  countSignals,
  countSimilarSiblings,
  isScreenOrSectionShell,
  normalizeNameBase,
  structuralHeuristicRule
} from '../../src/rules/structuralHeuristic'

const emptyCtx = {
  mutedRuleIds: new Set<string>(),
  publishStatusByNodeId: new Map()
}

function mockFrame(options: {
  id?: string
  name: string
  width?: number
  height?: number
  layoutMode?: 'NONE' | 'HORIZONTAL' | 'VERTICAL'
  children?: SceneNode[]
  parent?: BaseNode | null
}): FrameNode {
  const node = {
    id: options.id ?? `frame:${options.name}`,
    name: options.name,
    type: 'FRAME',
    width: options.width ?? 160,
    height: options.height ?? 48,
    layoutMode: options.layoutMode ?? 'HORIZONTAL',
    children: options.children ?? [
      { type: 'TEXT', id: 't1', name: 'Label' },
      { type: 'RECTANGLE', id: 'r1', name: 'Bg' },
      { type: 'INSTANCE', id: 'i1', name: 'Icon' }
    ],
    parent: options.parent ?? null
  } as unknown as FrameNode
  return node
}

describe('structuralHeuristic helpers', () => {
  it('counts signals', () => {
    expect(
      countSignals({
        componentLikeName: true,
        autoLayoutCluster: true,
        uiLikeChildren: false,
        compactWidgetSize: true
      })
    ).toBe(3)
  })

  it('normalizes name bases for sibling matching', () => {
    expect(normalizeNameBase('Card 2')).toBe('card')
    expect(normalizeNameBase('Card')).toBe('card')
  })

  it('detects screen / section shells', () => {
    const page = { type: 'PAGE', id: '0:1', name: 'Page 1' } as PageNode
    expect(
      isScreenOrSectionShell(
        mockFrame({
          name: 'Desktop',
          width: 1440,
          height: 900,
          parent: page
        }),
        page
      )
    ).toBe(true)

    expect(
      isScreenOrSectionShell(
        mockFrame({ name: 'Button/Primary', width: 120, height: 40 }),
        null
      )
    ).toBe(false)
  })

  it('counts similar siblings by size and name', () => {
    const a = mockFrame({ id: 'a', name: 'Card', width: 200, height: 120 })
    const b = mockFrame({ id: 'b', name: 'Card 2', width: 210, height: 118 })
    const other = mockFrame({
      id: 'c',
      name: 'Footer',
      width: 800,
      height: 60,
      children: [{ type: 'TEXT', id: 't', name: 'x' } as SceneNode]
    })
    expect(countSimilarSiblings(a, [a, b, other])).toBe(1)
  })
})

describe('structuralHeuristicRule', () => {
  it('tips on a strong reusable widget and excludes it from score', () => {
    const results = structuralHeuristicRule.run(
      mockFrame({
        name: 'ListRow',
        width: 320,
        height: 56,
        layoutMode: 'HORIZONTAL'
      }),
      emptyCtx
    )
    expect(results).toHaveLength(1)
    expect(results[0]?.excludeFromScore).toBe(true)
    expect(results[0]?.severity).toBe('info')
  })

  it('skips large page artboards', () => {
    const page = {
      type: 'PAGE',
      id: '0:1',
      name: 'Home',
      parent: null
    } as unknown as PageNode
    const results = structuralHeuristicRule.run(
      mockFrame({
        name: 'Desktop',
        width: 1440,
        height: 1024,
        parent: page,
        layoutMode: 'VERTICAL'
      }),
      emptyCtx
    )
    expect(results).toEqual([])
  })

  it('skips weak frames without reuse evidence', () => {
    const results = structuralHeuristicRule.run(
      mockFrame({
        name: 'wrapper',
        width: 200,
        height: 40,
        layoutMode: 'NONE',
        children: [
          { type: 'TEXT', id: 't1', name: 'Only text' } as SceneNode,
          { type: 'RECTANGLE', id: 'r1', name: 'Bg' } as SceneNode
        ]
      }),
      emptyCtx
    )
    // uiLikeChildren + compactWidgetSize = 2, but no similar sibling and not 3 signals
    expect(results).toEqual([])
  })
})
