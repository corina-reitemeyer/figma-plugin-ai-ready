import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useId, useState } from 'preact/hooks'

import { SelectNodeRequestHandler } from '../../shared/messages'
import {
  AuditReport,
  CategoryResult,
  Issue,
  SCORE_BAND_LABELS,
  ScoreBand,
  Severity
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

const RING_SIZE = 120
const RING_STROKE = 10
const CAT_RING_SIZE = 52
const CAT_RING_STROKE = 5
const TOP_ISSUES_LIMIT = 3
const CATEGORY_PANEL_ID = 'overview-category-scores'

export function OverviewView({ report, onOpenIssues }: OverviewViewProps) {
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const categoryPanelId = useId()
  const panelId = `${CATEGORY_PANEL_ID}-${categoryPanelId}`
  const unusedCount = report.inventory.unusedVariableCount ?? 0
  const issueSlots =
    unusedCount > 0 ? Math.max(0, TOP_ISSUES_LIMIT - 1) : TOP_ISSUES_LIMIT
  const topIssues = report.issues.slice(0, issueSlots)
  const bandLabel = SCORE_BAND_LABELS[report.band]
  const nodeCount =
    report.inventory.nodeCount ??
    report.inventory.componentCount +
      report.inventory.componentSetCount +
      report.inventory.frameCount
  const unscored = !report.scored
  const weakCategories = weakCategoryPreview(report.categories)
  const issueCount = report.issues.length
  const hasTopRows = unusedCount > 0 || topIssues.length > 0
  const warningHintId = `${panelId}-warning-hint`
  const errorHintId = `${panelId}-error-hint`
  const viewIssuesLabel =
    issueCount > 0
      ? strings.viewIssuesCount.replace('{count}', String(issueCount))
      : strings.viewIssues

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
        <p className="score-meta muted">
          {formatScanScopeLabel(report, nodeCount)} ·{' '}
          {report.inventory.componentCount} components ·{' '}
          {formatRecency(report.scannedAt)}
        </p>
      </div>

      <div className="counts-block">
        <ul className="counts" aria-label={strings.countsAriaLabel}>
          <li className="count count-passed">
            <span className="count-value">{report.passedChecks}</span>
            <span className="count-label">{strings.countPassed}</span>
          </li>
          <li className="count count-warning">
            <button
              type="button"
              className="count-action"
              onClick={onOpenIssues}
              aria-label={`${report.issueCounts.warning} ${strings.countWarnings}`}
              aria-describedby={warningHintId}
            >
              <span className="count-value">{report.issueCounts.warning}</span>
              <span className="count-label">{strings.countWarnings}</span>
            </button>
            <span id={warningHintId} className="count-hint" role="tooltip">
              {strings.countWarningHint}
            </span>
          </li>
          <li className="count count-error">
            <button
              type="button"
              className="count-action"
              onClick={onOpenIssues}
              aria-label={`${report.issueCounts.error} ${strings.countErrors}`}
              aria-describedby={errorHintId}
            >
              <span className="count-value">{report.issueCounts.error}</span>
              <span className="count-label">{strings.countErrors}</span>
            </button>
            <span id={errorHintId} className="count-hint" role="tooltip">
              {strings.countErrorHint}
            </span>
          </li>
        </ul>
      </div>

      {issueCount > 0 ? (
        <div className="overview-act">
          <button
            type="button"
            className="bf-btn bf-btn-dark view-issues-btn"
            onClick={onOpenIssues}
          >
            {viewIssuesLabel}
          </button>
        </div>
      ) : null}

      <div
        className={
          categoriesOpen
            ? 'category-scores category-scores-open'
            : 'category-scores'
        }
      >
        <button
          type="button"
          className="category-scores-toggle"
          aria-expanded={categoriesOpen}
          aria-controls={panelId}
          onClick={function () {
            setCategoriesOpen(!categoriesOpen)
          }}
        >
          <span className="category-scores-heading">
            <span className="category-scores-title">
              {strings.categoryScores}
            </span>
            {!categoriesOpen && weakCategories.length > 0 ? (
              <span className="category-scores-chips">
                {weakCategories.map(function (category) {
                  const band = bandFor(category.score)
                  return (
                    <span
                      key={category.category}
                      className={`category-score-chip band-${band}`}
                    >
                      <span className="category-score-chip-label">
                        {labelCategory(category.category)}
                      </span>
                      <span className="category-score-chip-value">
                        {category.score}
                      </span>
                    </span>
                  )
                })}
              </span>
            ) : null}
          </span>
          <span className="category-scores-chevron" aria-hidden="true">
            <IconChevronRight size={14} color="var(--muted-gray)" />
          </span>
        </button>
        <div id={panelId} hidden={!categoriesOpen}>
          {categoriesOpen ? (
            <ul className="category-gauges" aria-label={strings.categoryScores}>
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
          ) : null}
        </div>
      </div>

      <section className="overview-top-issues" aria-labelledby="overview-top-issues-heading">
        <h3 id="overview-top-issues-heading" className="section-title">
          {strings.topIssues}
        </h3>
        {!hasTopRows ? (
          <p className="muted">{strings.noIssuesFound}</p>
        ) : (
          <ul className="top-issues">
            {unusedCount > 0 ? (
              <li>
                <button
                  type="button"
                  className="issue-card"
                  onClick={onOpenIssues}
                >
                  <span
                    className="issue-card-icon cat-tokens"
                    aria-hidden="true"
                  >
                    <IconHexagon size={18} />
                  </span>
                  <span className="issue-card-body">
                    <span className="issue-card-title-row">
                      <span className="issue-card-title">
                        {strings.unusedVariablesTitle}
                      </span>
                      <span className="severity-badge severity-info">
                        {unusedCount}
                      </span>
                    </span>
                    <span className="issue-card-sub muted">
                      {strings.unusedVariablesBody}
                    </span>
                  </span>
                  <IconChevronRight size={16} color="var(--muted-gray)" />
                </button>
              </li>
            ) : null}
            {topIssues.map(function (issue) {
              return (
                <li key={issue.id}>
                  <IssueCard issue={issue} />
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <p className="score-footnote muted">{strings.scoreFootnote}</p>
    </div>
  )
}

function severityLabel(severity: Severity): string {
  if (severity === 'error') return strings.severityError
  if (severity === 'warning') return strings.severityWarning
  return strings.severityInfo
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
        <span className="issue-card-title-row">
          <span className="issue-card-title">
            <SafeText value={issue.ruleLabel} />
          </span>
          <span className={`severity-badge severity-${issue.severity}`}>
            {severityLabel(issue.severity)}
          </span>
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

/** Collapsed preview: weakest applicable categories under the “good” band. */
function weakCategoryPreview(
  categories: readonly CategoryResult[]
): CategoryResult[] {
  return categories
    .filter(function (category) {
      return category.applicable && category.score < 90
    })
    .slice()
    .sort(function (a, b) {
      return a.score - b.score
    })
    .slice(0, 3)
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
