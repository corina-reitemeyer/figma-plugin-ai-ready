import { NAMING } from '../config/defaults'
import { CheckResult, Rule } from '../shared/types'
import { finding } from './helpers'

const RULE_ID = 'structural-heuristic'

function looksLikeComponent(node: FrameNode | GroupNode): boolean {
  const childCount = 'children' in node ? node.children.length : 0
  if (childCount < 2) {
    return false
  }

  if (NAMING.componentNamePattern.test(node.name.trim())) {
    return true
  }

  if ('layoutMode' in node && node.layoutMode !== 'NONE' && childCount >= 3) {
    return true
  }

  return false
}

export const structuralHeuristicRule: Rule = {
  id: RULE_ID,
  label: 'Looks like a component',
  category: 'structure',
  targetTypes: ['FRAME', 'GROUP'],
  severity: 'info',
  mutable: true,
  rationale:
    'Reusable UI chunks should usually be components so agents can map them consistently via instances and Code Connect.',
  consequence:
    'Leaving reusable UI as plain frames makes agent output less reusable and harder to keep in sync with a design system.',
  run(node: SceneNode): CheckResult[] {
    if (node.type !== 'FRAME' && node.type !== 'GROUP') {
      return []
    }

    // Skip frames that are already inside a component definition.
    let parent: BaseNode | null = node.parent
    while (parent !== null) {
      if (parent.type === 'COMPONENT' || parent.type === 'COMPONENT_SET') {
        return []
      }
      parent = parent.parent
    }

    if (!looksLikeComponent(node)) {
      return []
    }

    return [
      finding({
        ruleId: RULE_ID,
        node,
        message: `“${node.name}” looks reusable but is not a component.`,
        severity: 'info',
        fixHint:
          'Create a component (or component set) if this UI is reused. Mute this rule if the frame is intentionally one-off.'
      })
    ]
  }
}
