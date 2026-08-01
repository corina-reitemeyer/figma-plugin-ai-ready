import { h } from 'preact'

import { Issue } from '../../shared/types'
import { IconCheck, IconSparkles } from '../Icon'
import { SafeText } from '../SafeText'
import { strings } from '../strings'

export type FixAllItemStatus = 'pending' | 'running' | 'done' | 'failed'

export type FixAllItem = {
  issue: Issue
  status: FixAllItemStatus
  detail?: string
}

export type FixAllPhase = 'applying' | 'rescanning' | 'done'

type FixAllViewProps = {
  items: FixAllItem[]
  phase: FixAllPhase
  onBack: () => void
}

function statusLabel(status: FixAllItemStatus): string {
  if (status === 'done') {
    return strings.fixAllStatusDone
  }
  if (status === 'running') {
    return strings.fixAllStatusRunning
  }
  if (status === 'failed') {
    return strings.fixAllStatusFailed
  }
  return strings.fixAllStatusPending
}

export function FixAllView({ items, phase, onBack }: FixAllViewProps) {
  const completed = items.filter(function (item) {
    return item.status === 'done' || item.status === 'failed'
  }).length
  const total = Math.max(items.length, 1)
  const progressPct =
    phase === 'done' ? 100 : Math.round((completed / total) * 100)

  const heading =
    phase === 'done'
      ? strings.fixAllDoneTitle
      : phase === 'rescanning'
        ? strings.fixAllRescanningTitle
        : strings.fixAllApplyingTitle

  const subtitle =
    phase === 'done'
      ? strings.fixAllDoneBody
      : phase === 'rescanning'
        ? strings.fixAllRescanningBody
        : strings.fixAllApplyingBody.replace('{count}', String(items.length))

  return (
    <div className="fix-all-view" aria-busy={phase !== 'done'}>
      <div className="fix-all-hero">
        <span className="fix-all-hero-icon" aria-hidden="true">
          <IconSparkles size={22} />
        </span>
        <h2 className="fix-all-title">{heading}</h2>
        <p className="fix-all-subtitle muted">{subtitle}</p>

        <div
          className="fix-all-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          aria-label={strings.fixAllProgressLabel}
        >
          <div
            className="fix-all-progress-bar"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="fix-all-progress-meta muted">
          {completed} / {items.length}
        </p>
      </div>

      <ul className="fix-all-list" aria-label={strings.fixAllListLabel}>
        {items.map(function (item) {
          return (
            <li
              key={item.issue.id}
              className={`fix-all-item fix-all-item-${item.status}`}
            >
              <span className="fix-all-check" aria-hidden="true">
                {item.status === 'done' ? (
                  <IconCheck size={14} />
                ) : item.status === 'running' ? (
                  <span className="fix-all-spinner" />
                ) : item.status === 'failed' ? (
                  <span className="fix-all-fail-mark">!</span>
                ) : (
                  <span className="fix-all-empty-check" />
                )}
              </span>
              <span className="sr-only">{statusLabel(item.status)}</span>
              <span className="fix-all-item-body">
                <span className="fix-all-item-title">
                  <SafeText value={item.issue.ruleLabel} />
                </span>
                <span className="fix-all-item-sub muted">
                  <SafeText value={item.issue.message} />
                </span>
                {item.detail !== undefined && item.status === 'failed' ? (
                  <span className="fix-all-item-error">
                    <SafeText value={item.detail} maxLength={200} />
                  </span>
                ) : null}
              </span>
            </li>
          )
        })}
      </ul>

      {phase === 'done' ? (
        <div className="fix-all-footer">
          <button
            type="button"
            className="bf-btn bf-btn-dark fix-all-back-btn"
            onClick={onBack}
          >
            {strings.fixAllBack}
          </button>
        </div>
      ) : null}
    </div>
  )
}
