import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useMemo, useState } from 'preact/hooks'

import { SelectNodeRequestHandler } from '../../shared/messages'
import { AuditReport, Issue, RuleCategory } from '../../shared/types'
import { CategoryIcon, labelCategory } from '../CategoryIcon'
import { IconChevronRight, IconSparkles } from '../Icon'
import { SafeText } from '../SafeText'
import { strings } from '../strings'

type CategoryFilter = RuleCategory | 'all'

type IssuesViewProps = {
  report: AuditReport
  onRequestFix?: (issue: Issue) => void
  onRequestFixAll?: (issues: Issue[]) => void
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  'all',
  'naming',
  'tokens',
  'variants',
  'structure',
  'docs'
]

function isAutofixable(issue: Issue): boolean {
  return issue.fixTier === 'auto' && issue.autofixId !== undefined
}

function issueLocation(issue: Issue): string {
  if (issue.pageName) {
    return `${issue.nodeName} — Page: ${issue.pageName}`
  }
  return issue.nodeName
}

export function IssuesView({
  report,
  onRequestFix,
  onRequestFixAll
}: IssuesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')

  const filteredIssues = useMemo(
    function () {
      if (categoryFilter === 'all') {
        return report.issues
      }
      return report.issues.filter((issue) => issue.category === categoryFilter)
    },
    [report.issues, categoryFilter]
  )

  const quickFixes = useMemo(
    function () {
      return filteredIssues.filter(isAutofixable)
    },
    [filteredIssues]
  )

  function selectNode(issue: Issue): void {
    emit<SelectNodeRequestHandler>('SELECT_NODE_REQUEST', {
      nodeId: issue.nodeId
    })
  }

  function toggleExpanded(issue: Issue): void {
    const next = expandedId === issue.id ? null : issue.id
    setExpandedId(next)
    selectNode(issue)
  }

  function handleFixAll(): void {
    if (quickFixes.length === 0 || onRequestFixAll === undefined) {
      return
    }
    onRequestFixAll(quickFixes)
  }

  return (
    <div className="issues-view">
      <div className="issues-body">
        <p className="fix-tier-legend muted">{strings.fixTierLegend}</p>

        {quickFixes.length > 0 && onRequestFixAll !== undefined ? (
          <div className="quick-fixes-block">
            <div className="feature-card quick-fixes-card">
              <span
                className="feature-card-icon quick-fix-icon"
                aria-hidden="true"
              >
                <IconSparkles size={18} />
              </span>
              <span className="feature-card-body">
                <span className="feature-card-title">
                  {strings.quickFixes} · ({quickFixes.length})
                </span>
              </span>
              <button
                type="button"
                className="bf-btn bf-btn-dark fix-all-btn"
                onClick={handleFixAll}
              >
                {strings.fixAll}
              </button>
            </div>
          </div>
        ) : null}

        <div className="filters" role="group" aria-label={strings.filterByCategory}>
          {CATEGORY_FILTERS.map(function (value) {
            const label =
              value === 'all' ? strings.filterAll : labelCategory(value)
            return (
              <button
                key={value}
                type="button"
                className={
                  categoryFilter === value ? 'chip chip-active' : 'chip'
                }
                aria-pressed={categoryFilter === value}
                onClick={function () {
                  setCategoryFilter(value)
                  setExpandedId(null)
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {filteredIssues.length === 0 ? (
          <p className="muted">{strings.noIssuesFilter}</p>
        ) : (
          <ul className="issue-card-list">
            {filteredIssues.map(function (issue) {
              const expanded = expandedId === issue.id
              return (
                <li
                  key={issue.id}
                  className={
                    expanded
                      ? 'issue-card-item issue-card-item-expanded'
                      : 'issue-card-item'
                  }
                >
                  <button
                    type="button"
                    className="issue-card"
                    aria-expanded={expanded}
                    onClick={function () {
                      toggleExpanded(issue)
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
                        <span
                          className={
                            isAutofixable(issue)
                              ? 'fix-tier-badge fix-tier-auto'
                              : 'fix-tier-badge fix-tier-manual'
                          }
                        >
                          {isAutofixable(issue)
                            ? strings.fixTierAuto
                            : strings.fixTierManual}
                        </span>
                      </span>
                      <span className="issue-card-sub muted">
                        <SafeText value={issue.message} />
                      </span>
                      <span className="issue-card-meta">
                        <SafeText value={issueLocation(issue)} />
                      </span>
                    </span>
                    <IconChevronRight size={16} color="var(--muted-gray)" />
                  </button>
                  {expanded ? (
                    <div className="issue-details">
                      <p>
                        <strong>{strings.whyMatters}</strong>
                        <br />
                        <SafeText value={issue.rationale} maxLength={2000} />
                      </p>
                      <p>
                        <strong>{strings.ifNotFixed}</strong>
                        <br />
                        <SafeText
                          value={issue.consequence}
                          maxLength={2000}
                        />
                      </p>
                      <p>
                        <strong>{strings.howToFix}</strong>
                        <br />
                        <SafeText value={issue.fixHint} maxLength={2000} />
                      </p>
                      {isAutofixable(issue) && onRequestFix !== undefined ? (
                        <button
                          type="button"
                          className="bf-btn bf-btn-dark fix-all-btn"
                          onClick={function () {
                            onRequestFix(issue)
                          }}
                        >
                          {strings.fix}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <footer className="issues-footer" aria-label={strings.totalIssues}>
        <span className="issues-footer-label">{strings.totalIssues}</span>
        <span className="issues-total-badge">{filteredIssues.length}</span>
      </footer>
    </div>
  )
}
