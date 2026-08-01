import { RULESET_VERSION } from '../config/defaults'
import { rules as defaultRules } from '../rules'
import {
  AuditReport,
  CheckResult,
  Issue,
  PublishStatusValue,
  Rule,
  RuleContext
} from '../shared/types'
import { safeText } from '../shared/safeText'
import { AuditTarget } from './collect/types'
import { buildInventory } from './inventory'
import { CheckInstance, scoreAudit } from './score'

function ruleApplies(rule: Rule, target: AuditTarget): boolean {
  return rule.targetTypes.includes(target.nodeType)
}

async function buildRuleContext(
  targets: readonly AuditTarget[],
  mutedRuleIds: ReadonlySet<string>
): Promise<RuleContext> {
  const publishStatusByNodeId = new Map<string, PublishStatusValue>()

  for (const target of targets) {
    if (
      target.node.type === 'COMPONENT' ||
      target.node.type === 'COMPONENT_SET'
    ) {
      try {
        const status = await (
          target.node as ComponentNode | ComponentSetNode
        ).getPublishStatusAsync()
        publishStatusByNodeId.set(target.nodeId, status)
      } catch {
        publishStatusByNodeId.set(target.nodeId, 'NA')
      }
    } else {
      publishStatusByNodeId.set(target.nodeId, 'NA')
    }
  }

  return {
    mutedRuleIds,
    publishStatusByNodeId
  }
}

function toIssue(rule: Rule, result: CheckResult): Issue {
  return {
    ...result,
    nodeName: safeText(result.nodeName),
    pageName:
      result.pageName === undefined ? undefined : safeText(result.pageName),
    message: safeText(result.message, 1000),
    fixHint: safeText(result.fixHint, 1000),
    category: rule.category,
    ruleLabel: rule.label,
    rationale: rule.rationale,
    consequence: rule.consequence
  }
}

export type RunEngineOptions = {
  targets: readonly AuditTarget[]
  scope: AuditReport['scope']
  pageIds: string[]
  durationMs: number
  rules?: readonly Rule[]
  mutedRuleIds?: ReadonlySet<string>
}

/**
 * Run registered rules against collected targets (single pass over targets × matching rules).
 */
export async function runEngine(
  options: RunEngineOptions
): Promise<AuditReport> {
  const rulesList = options.rules ?? defaultRules
  const muted = options.mutedRuleIds ?? new Set<string>()
  const ctx = await buildRuleContext(options.targets, muted)

  const issues: Issue[] = []
  const instances: CheckInstance[] = []

  for (const target of options.targets) {
    for (const rule of rulesList) {
      if (muted.has(rule.id) || !ruleApplies(rule, target)) {
        continue
      }

      const rawResults = rule.run(target.node, ctx)
      const annotated = rawResults.map(function (result) {
        return {
          ...result,
          pageId: result.pageId ?? target.pageId,
          pageName: result.pageName ?? target.pageName,
          nodeId: result.nodeId || target.nodeId,
          nodeName: result.nodeName || target.nodeName
        }
      })

      const findings = annotated.filter((result) => result.na !== true)
      const naOnly = annotated.length > 0 && findings.length === 0

      if (naOnly) {
        instances.push({
          category: rule.category,
          severity: rule.severity,
          passed: false,
          na: true,
          issueCount: 0
        })
        continue
      }

      if (findings.length === 0) {
        instances.push({
          category: rule.category,
          severity: rule.severity,
          passed: true,
          na: false,
          issueCount: 0
        })
        continue
      }

      instances.push({
        category: rule.category,
        severity: rule.severity,
        passed: false,
        na: false,
        issueCount: findings.length
      })

      for (const result of findings) {
        issues.push(toIssue(rule, result))
      }
    }
  }

  const scored = scoreAudit(instances, issues)
  const inventory = buildInventory(options.targets, issues)

  const severityRank: Record<Issue['severity'], number> = {
    error: 0,
    warning: 1,
    info: 2
  }
  issues.sort(function (a, b) {
    const rank = severityRank[a.severity] - severityRank[b.severity]
    if (rank !== 0) {
      return rank
    }
    return a.nodeName.localeCompare(b.nodeName)
  })

  return {
    scope: options.scope,
    pageIds: options.pageIds,
    scannedAt: new Date().toISOString(),
    durationMs: options.durationMs,
    rulesetVersion: RULESET_VERSION,
    overallScore: scored.overallScore,
    band: scored.band,
    passedChecks: scored.passedChecks,
    failedChecks: scored.failedChecks,
    naChecks: scored.naChecks,
    issueCounts: scored.issueCounts,
    categories: scored.categories,
    issues,
    inventory
  }
}
