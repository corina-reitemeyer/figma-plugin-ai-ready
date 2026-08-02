import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'

import { SelectNodeRequestHandler } from '../../shared/messages'
import {
  AuditReport,
  Issue,
  SCORE_BAND_LABELS,
  ScoreBand
} from '../../shared/types'
import { CategoryIcon, labelCategory } from '../CategoryIcon'
import { IconChevronRight, IconHexagon, IconVariants } from '../Icon'
import { SafeText } from '../SafeText'
import { formatScanScopeLabel } from '../scopeLabel'
import { strings } from '../strings'

type OverviewViewProps = {
  report: AuditReport
  onOpenIssues: () => void
}

const RING_SIZE = 128
const RING_STROKE = 10
const CAT_RING_SIZE = 52
const CAT_RING_STROKE = 5

export function OverviewView({ report, onOpenIssues }: OverviewViewProps) {
  const topIssues = report.issues.slice(0, 5)
  const bandLabel = SCORE_BAND_LABELS[report.band]
  const unusedCount = report.inventory.unusedVariableCount ?? 0
  const nodeCount =
    report.inventory.nodeCount ??
    report.inventory.componentCount +
      report.inventory.componentSetCount +
      report.inventory.frameCount
  const unscored = !report.scored

  if (unscored) {
    return (
      <div className="overview overview-unscored">
        <div className="score-hero score-hero-unscored" role="status">
          <span className="ai-empty-icon" aria-hidden="true">
            <IconVariants size={24} />
          </span>
          <p className="band-label band-unscored">{strings.scoreUnscoredTitle}</p>
          <p className="score-unscored-body">{strings.scoreUnscoredBody}</p>
          <p className="score-meta muted">
            {formatScanScopeLabel(report, nodeCount)} ·{' '}
            {report.inventory.componentCount} components ·{' '}
            {formatRecency(report.scannedAt)}
          </p>
        </div>
        <p className="score-footnote muted">{strings.scoreFootnote}</p>
      </div>
    )
  }

  return (
    <div className="overview">
      <div
        className="score-hero"
        aria-label={`Overall score ${report.overallScore}, ${bandLabel}`}
      >
        <ScoreRing
          score={report.overallScore}
          band={report.band}
          size={RING_SIZE}
          stroke={RING_STROKE}
        />
        <p className={`band-label band-${report.band}`}>{bandLabel}</p>
        <p className="score-caption">{strings.scoreCaption}</p>
        <p className="score-scope muted">{strings.scoreCaptionScoped}</p>
        <p className="score-meta muted">
          {formatScanScopeLabel(report, nodeCount)} ·{' '}
          {report.inventory.componentCount} components ·{' '}
          {formatRecency(report.scannedAt)}
        </p>
      </div>

      <p className="counts" aria-label="Pass and issue breakdown">
        <span className="count count-passed">
          <span className="count-value">{report.passedChecks}</span>
          <span className="count-label">Passed</span>
        </span>
        <span className="count count-warning">
          <span className="count-value">{report.issueCounts.warning}</span>
          <span className="count-label">Warnings</span>
        </span>
        <span className="count count-error">
          <span className="count-value">{report.issueCounts.error}</span>
          <span className="count-label">Errors</span>
        </span>
      </p>

      <ul className="category-gauges" aria-label="Category scores">
        {report.categories.map(function (category) {
          if (!category.applicable) {
            return (
              <li key={category.category} className="category-gauge">
                <div
                  className="score-ring score-ring-compact band-unscored"
                  style={{ width: CAT_RING_SIZE, height: CAT_RING_SIZE }}
                  aria-label={`${labelCategory(category.category)} not applicable`}
                >
                  <span className="score-number score-number-na">
                    {strings.categoryNotApplicable}
                  </span>
                </div>
                <span className="category-gauge-label">
                  {labelCategory(category.category)}
                </span>
              </li>
            )
          }

          const band = bandFor(category.score)
          return (
            <li key={category.category} className="category-gauge">
              <ScoreRing
                score={category.score}
                band={band}
                size={CAT_RING_SIZE}
                stroke={CAT_RING_STROKE}
                compact
              />
              <span className="category-gauge-label">
                {labelCategory(category.category)}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="score-footnote muted">{strings.scoreFootnote}</p>

      {unusedCount > 0 ? (
        <button type="button" className="feature-card" onClick={onOpenIssues}>
          <span className="feature-card-icon" aria-hidden="true">
            <IconHexagon size={20} />
          </span>
          <span className="feature-card-body">
            <span className="feature-card-title">
              Unused variables · ({unusedCount})
            </span>
            <span className="feature-card-sub muted">
              Set up in this file but not used here.
            </span>
          </span>
          <IconChevronRight size={16} color="var(--muted-gray)" />
        </button>
      ) : null}

      <h3 className="section-title">Top issues</h3>
      {topIssues.length === 0 ? (
        <p className="muted">No issues found in this scan.</p>
      ) : (
        <ul className="top-issues">
          {topIssues.map(function (issue) {
            return (
              <li key={issue.id}>
                <IssueCard issue={issue} />
              </li>
            )
          })}
        </ul>
      )}

      {report.issues.length > 0 ? (
        <button
          type="button"
          className="bf-btn bf-btn-outline view-all-btn"
          onClick={onOpenIssues}
        >
          View all {report.issues.length} issues
        </button>
      ) : null}
    </div>
  )
}

function IssueCard({ issue }: { issue: Issue }) {
  return (
    <button
      type="button"
      className="issue-card"
      onClick={function () {
        emit<SelectNodeRequestHandler>('SELECT_NODE_REQUEST', {
          nodeId: issue.nodeId
        })
      }}
    >
      <span
        className={`issue-card-icon cat-${issue.category}`}
        aria-hidden="true"
      >
        <CategoryIcon category={issue.category} />
      </span>
      <span className="issue-card-body">
        <span className="issue-card-title">
          <SafeText value={issue.ruleLabel} />
        </span>
        <span className="issue-card-sub muted">
          <SafeText value={issue.message} />
        </span>
      </span>
      <IconChevronRight size={16} color="var(--muted-gray)" />
    </button>
  )
}

function ScoreRing({
  score,
  band,
  size,
  stroke,
  compact = false
}: {
  score: number
  band: ScoreBand
  size: number
  stroke: number
  compact?: boolean
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset =
    circumference - (Math.min(100, Math.max(0, score)) / 100) * circumference
  const center = size / 2

  return (
    <div
      className={`score-ring band-${band}${compact ? ' score-ring-compact' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="score-ring-track"
          cx={center}
          cy={center}
          r={radius}
          stroke-width={stroke}
        />
        <circle
          className="score-ring-progress"
          cx={center}
          cy={center}
          r={radius}
          stroke-width={stroke}
          stroke-dasharray={String(circumference)}
          stroke-dashoffset={String(offset)}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      <span className="score-number">{score}</span>
    </div>
  )
}

function bandFor(score: number): ScoreBand {
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
