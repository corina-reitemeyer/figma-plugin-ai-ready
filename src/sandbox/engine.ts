import { RULESET_VERSION } from '../config/defaults'
import { rules as defaultRules } from '../rules'
import { STRUCTURAL_TIP_CAP } from '../rules/structuralHeuristic'
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

const TIP_RULE_CAPS: ReadonlyMap<string, number> = new Map([
  ['structural-heuristic', STRUCTURAL_TIP_CAP]
])

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
  const nodeName = safeText(result.nodeName)
  const message = safeText(result.message, 1000)
  return {
    ...result,
    id: `${rule.id}:${result.nodeId}:${message}`,
    nodeName,
    pageName:
      result.pageName === undefined ? undefined : safeText(result.pageName),
    message,
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

      let rawResults: CheckResult[]
      try {
        rawResults = rule.run(target.node, ctx)
      } catch (error) {
        // One rule/node failure must not abort the whole scan (Figma API edge cases).
        console.warn(
          `[agent-readiness] rule ${rule.id} failed on ${target.nodeId}`,
          error
        )
        continue
      }

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

      const scoringFindings = findings.filter(function (result) {
        return result.excludeFromScore !== true
      })
      const tipFindings = findings.filter(function (result) {
        return result.excludeFromScore === true
      })

      // Tips still surface in Issues, but do not fail the score.
      if (scoringFindings.length === 0) {
        instances.push({
          category: rule.category,
          severity: rule.severity,
          passed: true,
          na: false,
          issueCount: 0
        })
      } else {
        instances.push({
          category: rule.category,
          severity: rule.severity,
          passed: false,
          na: false,
          issueCount: scoringFindings.length
        })
      }

      for (const result of scoringFindings) {
        issues.push(toIssue(rule, result))
      }
      for (const result of tipFindings) {
        issues.push(toIssue(rule, result))
      }
    }
  }

  const cappedIssues = capTipIssues(issues)
  const scored = scoreAudit(instances, cappedIssues)
  const inventory = buildInventory(options.targets, cappedIssues)

  const severityRank: Record<Issue['severity'], number> = {
    error: 0,
    warning: 1,
    info: 2
  }
  cappedIssues.sort(function (a, b) {
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
    scored: scored.scored,
    overallScore: scored.overallScore,
    band: scored.band,
    passedChecks: scored.passedChecks,
    failedChecks: scored.failedChecks,
    naChecks: scored.naChecks,
    issueCounts: scored.issueCounts,
    categories: scored.categories,
    issues: cappedIssues,
    inventory
  }
}

/** Keep soft tips useful without flooding Issues. */
function capTipIssues(issues: Issue[]): Issue[] {
  const tipCounts = new Map<string, number>()
  const kept: Issue[] = []

  for (const issue of issues) {
    if (issue.excludeFromScore !== true) {
      kept.push(issue)
      continue
    }

    const cap = TIP_RULE_CAPS.get(issue.ruleId)
    if (cap === undefined) {
      kept.push(issue)
      continue
    }

    const used = tipCounts.get(issue.ruleId) ?? 0
    if (used >= cap) {
      continue
    }
    tipCounts.set(issue.ruleId, used + 1)
    kept.push(issue)
  }

  return kept
}
