import { describe, expect, it } from 'vitest'

import { listInstancesInTree } from '../../src/sandbox/collect/resolveSelectionTargets'

function frame(
  name: string,
  children: SceneNode[] = []
): FrameNode {
  return {
    id: `frame:${name}`,
    name,
    type: 'FRAME',
    children
  } as unknown as FrameNode
}

function instance(name: string): InstanceNode {
  return {
    id: `instance:${name}`,
    name,
    type: 'INSTANCE'
  } as unknown as InstanceNode
}

describe('listInstancesInTree', () => {
  it('returns a root instance', () => {
    const node = instance('Button')
    expect(listInstancesInTree(node).map((item) => item.id)).toEqual([
      'instance:Button'
    ])
  })

  it('finds nested instances but does not walk inside them', () => {
    const nestedInsideInstance = frame('Inner', [instance('Hidden')])
    const root = frame('Screen', [
      instance('Primary'),
      frame('Card', [instance('Icon')]),
      {
        ...instance('WithChildren'),
        children: [nestedInsideInstance]
      } as unknown as InstanceNode
    ])

    const ids = listInstancesInTree(root)
      .map((item) => item.id)
      .sort()
    expect(ids).toEqual([
      'instance:Icon',
      'instance:Primary',
      'instance:WithChildren'
    ])
  })
})
