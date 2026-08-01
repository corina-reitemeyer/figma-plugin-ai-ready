import { emit } from '@create-figma-plugin/utilities'
import { Fragment, h } from 'preact'

import { SelectNodeRequestHandler } from '../../shared/messages'
import { AuditReport, SCORE_BAND_LABELS } from '../../shared/types'
import { SafeText } from '../SafeText'

type OverviewViewProps = {
  report: AuditReport
  onOpenIssues: () => void
}

export function OverviewView({ report, onOpenIssues }: OverviewViewProps) {
  const topIssues = report.issues.slice(0, 5)
  const bandLabel = SCORE_BAND_LABELS[report.band]
  const scopeLabel =
    report.scope === 'selection'
      ? 'Selection scan'
      : report.scope === 'file'
        ? 'Whole-file scan'
        : 'Page scan'

  return (
    <div className="overview">
      <div
        className="score-hero"
        aria-label={`Overall score ${report.overallScore}, ${bandLabel}`}
      >
        <div className={`score-number band-${report.band}`}>
          {report.overallScore}
        </div>
        <div className="score-meta">
          <p className={`band-label band-${report.band}`}>{bandLabel}</p>
          <p className="muted">
            {scopeLabel} · {report.inventory.componentCount} components ·{' '}
            {formatRecency(report.scannedAt)}
          </p>
        </div>
      </div>

      <p className="counts" aria-label="Pass and issue breakdown">
        <span>{report.passedChecks} passed</span>
        <span aria-hidden="true"> · </span>
        <span>{report.issues.length} issues</span>
        <span aria-hidden="true"> · </span>
        <span>
          {report.issueCounts.error} errors, {report.issueCounts.warning}{' '}
          warnings
        </span>
        {report.naChecks > 0 ? (
          <Fragment>
            <span aria-hidden="true"> · </span>
            <span>{report.naChecks} N/A</span>
          </Fragment>
        ) : null}
      </p>

      <h3 className="section-title">Categories</h3>
      <ul className="category-list">
        {report.categories.map(function (category) {
          return (
            <li key={category.category}>
              <div className="category-row">
                <span className="category-name">
                  {labelCategory(category.category)}
                </span>
                <span
                  className={`category-score band-${bandFor(category.score)}`}
                >
                  {category.score}
                </span>
              </div>
              <div
                className="category-bar"
                role="meter"
                aria-label={`${labelCategory(category.category)} score ${category.score}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={category.score}
              >
                <span style={{ width: `${category.score}%` }} />
              </div>
            </li>
          )
        })}
      </ul>

      <h3 className="section-title">Top issues</h3>
      {topIssues.length === 0 ? (
        <p className="muted">No issues found in this scan.</p>
      ) : (
        <ul className="top-issues">
          {topIssues.map(function (issue) {
            return (
              <li key={issue.id}>
                <button
                  type="button"
                  className="issue-link"
                  onClick={function () {
                    emit<SelectNodeRequestHandler>('SELECT_NODE_REQUEST', {
                      nodeId: issue.nodeId
                    })
                  }}
                >
                  <span className={`severity severity-${issue.severity}`}>
                    {issue.severity}
                  </span>
                  <SafeText value={issue.message} />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <button type="button" className="text-button" onClick={onOpenIssues}>
        View all {report.issues.length} issues
      </button>
    </div>
  )
}

function labelCategory(category: string): string {
  switch (category) {
    case 'naming':
      return 'Naming'
    case 'tokens':
      return 'Tokens'
    case 'variants':
      return 'Variants'
    case 'structure':
      return 'Structure'
    case 'docs':
      return 'Docs & Publish'
    default:
      return category
  }
}

function bandFor(score: number): string {
  if (score >= 90) return 'good'
  if (score >= 50) return 'needsWork'
  return 'poor'
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
