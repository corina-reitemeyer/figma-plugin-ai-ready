import {
  CATEGORY_WEIGHTS,
  SEVERITY_WEIGHTS
} from '../config/defaults'
import { clampScore, scoreBand } from '../shared/scoreBand'
import {
  CategoryResult,
  Issue,
  RULE_CATEGORIES,
  RuleCategory,
  ScoreBand,
  Severity
} from '../shared/types'

export type CheckInstance = {
  category: RuleCategory
  severity: Severity
  passed: boolean
  na: boolean
  issueCount: number
}

export type ScoreSummary = {
  /** False when no applicable checks — do not treat overallScore as success. */
  scored: boolean
  overallScore: number
  band: ScoreBand
  categories: CategoryResult[]
  passedChecks: number
  failedChecks: number
  naChecks: number
  issueCounts: { error: number; warning: number; info: number }
}

/**
 * Build per-category and overall scores.
 * N/A instances are excluded from the denominator.
 * Categories with zero applicable checks are marked applicable: false (N/A in UI).
 * When nothing is applicable, scored is false (empty / unscored — not Good 100).
 */
export function scoreAudit(
  instances: readonly CheckInstance[],
  issues: readonly Issue[]
): ScoreSummary {
  const byCategory = new Map<RuleCategory, CheckInstance[]>()
  for (const category of RULE_CATEGORIES) {
    byCategory.set(category, [])
  }

  let passedChecks = 0
  let failedChecks = 0
  let naChecks = 0

  for (const instance of instances) {
    if (instance.na) {
      naChecks += 1
      continue
    }
    if (instance.passed) {
      passedChecks += 1
    } else {
      failedChecks += 1
    }
    byCategory.get(instance.category)?.push(instance)
  }

  const categories: CategoryResult[] = []

  for (const category of RULE_CATEGORIES) {
    const list = byCategory.get(category) ?? []
    const applicable = list.filter((item) => !item.na)
    const issueCount = issues.filter(
      (issue) => issue.category === category && issue.na !== true
    ).length
    const naCount = instances.filter(
      (item) => item.category === category && item.na
    ).length

    if (applicable.length === 0) {
      categories.push({
        category,
        applicable: false,
        score: 0,
        passed: 0,
        failed: 0,
        issueCount,
        naCount
      })
      continue
    }

    let numerator = 0
    let denominator = 0
    let passed = 0
    let failed = 0

    for (const item of applicable) {
      const weight = SEVERITY_WEIGHTS[item.severity]
      denominator += weight
      if (item.passed) {
        numerator += weight
        passed += 1
      } else {
        failed += 1
      }
    }

    categories.push({
      category,
      applicable: true,
      score: clampScore((numerator / denominator) * 100),
      passed,
      failed,
      issueCount,
      naCount
    })
  }

  const scoredCategories = categories.filter(function (category) {
    return category.applicable
  })

  if (scoredCategories.length === 0) {
    return {
      scored: false,
      overallScore: 0,
      band: 'unscored',
      categories,
      passedChecks,
      failedChecks,
      naChecks,
      issueCounts: {
        error: issues.filter((issue) => issue.severity === 'error').length,
        warning: issues.filter((issue) => issue.severity === 'warning').length,
        info: issues.filter((issue) => issue.severity === 'info').length
      }
    }
  }

  let sum = 0
  let weights = 0
  for (const category of scoredCategories) {
    const weight = CATEGORY_WEIGHTS[category.category]
    sum += category.score * weight
    weights += weight
  }
  const overallScore = clampScore(weights === 0 ? 100 : sum / weights)

  return {
    scored: true,
    overallScore,
    band: scoreBand(overallScore),
    categories,
    passedChecks,
    failedChecks,
    naChecks,
    issueCounts: {
      error: issues.filter((issue) => issue.severity === 'error').length,
      warning: issues.filter((issue) => issue.severity === 'warning').length,
      info: issues.filter((issue) => issue.severity === 'info').length
    }
  }
}
