import { Rule } from '../shared/types'
import { autoLayoutUsageRule } from './autoLayoutUsage'
import { descriptionPresentRule } from './descriptionPresent'
import { namingRule } from './naming'
import { publishStatusRule } from './publishStatus'
import { structuralHeuristicRule } from './structuralHeuristic'
import { tokenUsageRule } from './tokenUsage'
import { variantCompletenessRule } from './variantCompleteness'

/**
 * Explicit rule registry (bundlers cannot glob at runtime).
 * Add a rule file + one entry here.
 */
export const rules: Rule[] = [
  namingRule,
  variantCompletenessRule,
  tokenUsageRule,
  autoLayoutUsageRule,
  descriptionPresentRule,
  publishStatusRule,
  structuralHeuristicRule
]
