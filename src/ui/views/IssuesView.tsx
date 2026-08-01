import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useMemo, useState } from 'preact/hooks'

import { SelectNodeRequestHandler } from '../../shared/messages'
import { AuditReport, Issue, Severity } from '../../shared/types'
import { SafeText } from '../SafeText'

type IssuesViewProps = {
  report: AuditReport
  onRequestFix?: (issue: Issue) => void
}

export function IssuesView({ report, onRequestFix }: IssuesViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all')

  const issues = useMemo(
    function () {
      const filtered =
        severityFilter === 'all'
          ? report.issues
          : report.issues.filter((issue) => issue.severity === severityFilter)

      if (report.scope !== 'file' && report.pageIds.length <= 1) {
        return [{ pageName: null as string | null, issues: filtered }]
      }

      const groups = new Map<string, Issue[]>()
      for (const issue of filtered) {
        const key = issue.pageName ?? 'Unknown page'
        const list = groups.get(key) ?? []
        list.push(issue)
        groups.set(key, list)
      }
      return Array.from(groups.entries()).map(function ([pageName, list]) {
        return { pageName, issues: list }
      })
    },
    [report, severityFilter]
  )

  return (
    <div className="issues-view">
      <div className="filters" role="group" aria-label="Filter by severity">
        {(['all', 'error', 'warning', 'info'] as const).map(function (value) {
          return (
            <button
              key={value}
              type="button"
              className={
                severityFilter === value ? 'chip chip-active' : 'chip'
              }
              aria-pressed={severityFilter === value}
              onClick={function () {
                setSeverityFilter(value)
              }}
            >
              {value}
            </button>
          )
        })}
      </div>

      {issues.every((group) => group.issues.length === 0) ? (
        <p className="muted">No issues match this filter.</p>
      ) : (
        issues.map(function (group) {
          return (
            <section key={group.pageName ?? 'flat'} className="issue-group">
              {group.pageName !== null ? (
                <h3 className="section-title">
                  <SafeText value={group.pageName} />
                </h3>
              ) : null}
              <ul className="issue-list">
                {group.issues.map(function (issue) {
                  const expanded = expandedId === issue.id
                  return (
                    <li key={issue.id} className="issue-row">
                      <div className="issue-main">
                        <button
                          type="button"
                          className="issue-select"
                          onClick={function () {
                            emit<SelectNodeRequestHandler>(
                              'SELECT_NODE_REQUEST',
                              { nodeId: issue.nodeId }
                            )
                          }}
                        >
                          <span
                            className={`severity severity-${issue.severity}`}
                          >
                            {issue.severity}
                          </span>
                          <span className="issue-copy">
                            <SafeText value={issue.message} />
                            <span className="muted">
                              <SafeText value={issue.nodeName} />
                              {issue.pageName
                                ? ` · ${issue.pageName}`
                                : ''}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="text-button"
                          aria-expanded={expanded}
                          onClick={function () {
                            setExpandedId(expanded ? null : issue.id)
                          }}
                        >
                          {expanded ? 'Hide details' : 'Show details'}
                        </button>
                      </div>
                      {expanded ? (
                        <div className="issue-details">
                          <p>
                            <strong>Why this matters</strong>
                            <br />
                            <SafeText value={issue.rationale} maxLength={2000} />
                          </p>
                          <p>
                            <strong>If you don’t fix this</strong>
                            <br />
                            <SafeText
                              value={issue.consequence}
                              maxLength={2000}
                            />
                          </p>
                          <p>
                            <strong>How to fix</strong>
                            <br />
                            <SafeText value={issue.fixHint} maxLength={2000} />
                          </p>
                          {issue.fixTier === 'auto' &&
                          issue.autofixId !== undefined &&
                          onRequestFix !== undefined ? (
                            <button
                              type="button"
                              onClick={function () {
                                onRequestFix(issue)
                              }}
                            >
                              Fix
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}
