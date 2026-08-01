import { RuleCategory, Severity } from '../shared/types'

/** Bump when rule semantics change in a way that invalidates score comparisons. */
export const RULESET_VERSION = '0.1.0'

/**
 * Equal category weights for v1. Rebalance via this config later — not in scoring math.
 */
export const CATEGORY_WEIGHTS: Record<RuleCategory, number> = {
  naming: 1,
  tokens: 1,
  variants: 1,
  structure: 1,
  docs: 1
}

/**
 * Denominator/numerator weight per check instance by its rule severity.
 * Heavier severities move the category score more when they fail or pass.
 */
export const SEVERITY_WEIGHTS: Record<Severity, number> = {
  error: 3,
  warning: 2,
  info: 1
}

/** Soft naming defaults — tweak without touching rule logic. */
export const NAMING = {
  /** PascalCase segment or slash-grouped PascalCase paths. */
  componentNamePattern:
    /^(?:[A-Z][A-Za-z0-9]*\/)*[A-Z][A-Za-z0-9]*$/,
  defaultNamePattern:
    /^(?:Frame|Group|Rectangle|Ellipse|Component|Property|Boolean|Variant)\s*\d+$/i,
  copyOfPattern: /^Copy of\b/i
} as const
