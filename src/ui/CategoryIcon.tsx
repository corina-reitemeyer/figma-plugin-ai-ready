import { h } from 'preact'

import { RuleCategory } from '../shared/types'
import {
  IconDoc,
  IconHash,
  IconHexagon,
  IconLayout,
  IconVariants
} from './Icon'

type CategoryIconProps = {
  category: RuleCategory
  size?: number
}

export function CategoryIcon({ category, size = 18 }: CategoryIconProps) {
  switch (category) {
    case 'variants':
      return <IconVariants size={size} />
    case 'naming':
      return <IconHash size={size} />
    case 'tokens':
      return <IconHexagon size={size} />
    case 'structure':
      return <IconLayout size={size} />
    case 'docs':
      return <IconDoc size={size} />
    default:
      return <IconHash size={size} />
  }
}

export function labelCategory(category: RuleCategory | string): string {
  switch (category) {
    case 'naming':
      return 'Naming'
    case 'tokens':
      return 'Variables'
    case 'variants':
      return 'Variants'
    case 'structure':
      return 'Structure'
    case 'docs':
      return 'Docs'
    default:
      return category
  }
}
