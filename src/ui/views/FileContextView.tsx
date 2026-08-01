import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useMemo, useState } from 'preact/hooks'

import { SelectNodeRequestHandler } from '../../shared/messages'
import { AuditReport, Issue, RuleCategory } from '../../shared/types'
import { CategoryIcon, labelCategory } from '../CategoryIcon'
import {
  IconDoc,
  IconHexagon,
  IconSearch,
  IconVariants
} from '../Icon'
import { SafeText } from '../SafeText'
import { strings } from '../strings'

type FileContextViewProps = {
  report: AuditReport
}

type ComponentIssueRow = {
  nodeId: string
  nodeName: string
  pageName: string
  issueCount: number
}

type OptionalCheck = {
  ruleId: string
  label: string
  category: RuleCategory
}

const OPTIONAL_CHECKS: OptionalCheck[] = [
  {
    ruleId: 'structural-heuristic',
    label: strings.optionalLooksLikeComponent,
    category: 'structure'
  },
  {
    ruleId: 'variant-completeness',
    label: strings.optionalHoverDisabled,
    category: 'variants'
  }
]

export function FileContextView({ report }: FileContextViewProps) {
  const unusedVariables = report.inventory.unusedVariables ?? []
  const unusedCount =
    report.inventory.unusedVariableCount ?? unusedVariables.length
  const nodeCount =
    report.inventory.nodeCount ??
    report.inventory.componentCount +
      report.inventory.componentSetCount +
      report.inventory.frameCount

  const pageRows = useMemo(
    function () {
      return report.inventory.pages.map(function (page) {
        const issueCount = report.issues.filter(function (issue) {
          return issue.pageId === page.pageId
        }).length
        return {
          pageId: page.pageId,
          pageName: page.pageName,
          componentCount: page.componentCount,
          issueCount
        }
      })
    },
    [report.inventory.pages, report.issues]
  )

  const componentRows = useMemo(
    function () {
      return aggregateComponentsWithIssues(report.issues)
    },
    [report.issues]
  )

  const [enabledChecks, setEnabledChecks] = useState<Record<string, boolean>>(
    function () {
      const initial: Record<string, boolean> = {}
      for (const check of OPTIONAL_CHECKS) {
        initial[check.ruleId] = true
      }
      return initial
    }
  )

  function toggleCheck(ruleId: string): void {
    setEnabledChecks(function (prev) {
      return { ...prev, [ruleId]: !(prev[ruleId] ?? true) }
    })
  }

  return (
    <div className="file-context">
      <section className="file-section" aria-labelledby="file-scan-heading">
        <h3 id="file-scan-heading" className="section-title">
          {strings.fileScanSection}
        </h3>
        <div className="file-card">
          <span className="file-card-icon scan" aria-hidden="true">
            <IconSearch size={18} />
          </span>
          <span className="file-card-body">
            <span className="file-card-title">{scopeLabel(report, nodeCount)}</span>
            <span className="file-card-sub muted">
              {report.inventory.componentCount} components ·{' '}
              {formatRecency(report.scannedAt)} · {report.durationMs}ms
            </span>
          </span>
        </div>
      </section>

      {unusedCount > 0 ? (
        <section
          className="file-section"
          aria-labelledby="file-unused-heading"
        >
          <h3 id="file-unused-heading" className="section-title">
            {strings.fileUnusedVariablesSection} ({unusedCount})
          </h3>
          <p className="file-section-hint muted">
            {strings.fileUnusedVariablesHint}
          </p>
          {unusedVariables.length > 0 ? (
            <ul className="file-card-list">
              {unusedVariables.map(function (variable) {
                return (
                  <li key={variable.id}>
                    <div className="file-card">
                      <span className="file-card-icon variable" aria-hidden="true">
                        <IconHexagon size={18} />
                      </span>
                      <span className="file-card-body">
                        <span className="file-card-title">
                          <SafeText value={variable.name} />
                        </span>
                        <span className="file-card-sub muted">
                          <SafeText value={variable.collectionName} /> ·{' '}
                          {variable.resolvedType}
                        </span>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </section>
      ) : null}

      {pageRows.length > 0 ? (
        <section className="file-section" aria-labelledby="file-pages-heading">
          <h3 id="file-pages-heading" className="section-title">
            {strings.filePagesSection}
          </h3>
          <ul className="file-card-list">
            {pageRows.map(function (page) {
              return (
                <li key={page.pageId}>
                  <div className="file-card">
                    <span className="file-card-icon page" aria-hidden="true">
                      <IconDoc size={18} />
                    </span>
                    <span className="file-card-body">
                      <span className="file-card-title">
                        <SafeText value={page.pageName} />
                      </span>
                      <span className="file-card-sub muted">
                        {page.componentCount} components · {page.issueCount}{' '}
                        {page.issueCount === 1 ? 'issue' : 'issues'}
                      </span>
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {componentRows.length > 0 ? (
        <section
          className="file-section"
          aria-labelledby="file-components-heading"
        >
          <h3 id="file-components-heading" className="section-title">
            {strings.fileComponentsSection}
          </h3>
          <ul className="file-card-list">
            {componentRows.map(function (row) {
              return (
                <li key={row.nodeId}>
                  <button
                    type="button"
                    className="file-card file-card-button"
                    onClick={function () {
                      emit<SelectNodeRequestHandler>('SELECT_NODE_REQUEST', {
                        nodeId: row.nodeId
                      })
                    }}
                  >
                    <span className="file-card-icon component" aria-hidden="true">
                      <IconVariants size={18} />
                    </span>
                    <span className="file-card-body">
                      <span className="file-card-title">
                        <SafeText value={row.nodeName} />
                      </span>
                      <span className="file-card-sub muted">
                        <SafeText value={row.pageName} /> · {row.issueCount}{' '}
                        {row.issueCount === 1 ? 'issue' : 'issues'}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      <section
        className="file-section"
        aria-labelledby="file-optional-heading"
      >
        <h3 id="file-optional-heading" className="section-title">
          {strings.fileOptionalChecksSection}
        </h3>
        <ul className="file-card-list">
          {OPTIONAL_CHECKS.map(function (check) {
            const on = enabledChecks[check.ruleId] ?? true
            return (
              <li key={check.ruleId}>
                <div className="file-card file-card-toggle">
                  <span
                    className={`file-card-icon cat-${check.category}`}
                    aria-hidden="true"
                  >
                    <CategoryIcon category={check.category} />
                  </span>
                  <span className="file-card-body">
                    <span className="file-card-title">{check.label}</span>
                    <span className="file-card-sub muted">
                      {labelCategory(check.category)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className={on ? 'switch switch-on' : 'switch'}
                    role="switch"
                    aria-checked={on}
                    aria-label={check.label}
                    onClick={function () {
                      toggleCheck(check.ruleId)
                    }}
                  >
                    <span className="switch-thumb" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

function aggregateComponentsWithIssues(issues: Issue[]): ComponentIssueRow[] {
  const byNode = new Map<string, ComponentIssueRow>()

  for (const issue of issues) {
    const existing = byNode.get(issue.nodeId)
    if (existing === undefined) {
      byNode.set(issue.nodeId, {
        nodeId: issue.nodeId,
        nodeName: issue.nodeName,
        pageName: issue.pageName ?? 'Unknown page',
        issueCount: 1
      })
      continue
    }
    existing.issueCount += 1
  }

  return Array.from(byNode.values()).sort(function (a, b) {
    if (b.issueCount !== a.issueCount) {
      return b.issueCount - a.issueCount
    }
    return a.nodeName.localeCompare(b.nodeName)
  })
}

function scopeLabel(report: AuditReport, nodeCount: number): string {
  const nodes = `${nodeCount} node${nodeCount === 1 ? '' : 's'}`
  if (report.scope === 'selection') {
    return `Selection (${nodes})`
  }
  if (report.scope === 'file') {
    return `Whole file (${nodes})`
  }
  const pageCount = report.pageIds.length || report.inventory.pageCount
  return pageCount === 1
    ? `1 page (${nodes})`
    : `${pageCount} pages (${nodes})`
}

function formatRecency(iso: string): string {
  const then = Date.parse(iso)
  if (Number.isNaN(then)) {
    return 'just now'
  }
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  return `${minutes} minutes ago`
}
