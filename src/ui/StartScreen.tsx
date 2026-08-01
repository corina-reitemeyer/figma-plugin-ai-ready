import { h } from 'preact'

import { PageInfo } from '../shared/messages'
import { ScopeKind } from '../shared/types'
import { Button } from './Button'
import { IconSearch, IconSparkles } from './Icon'
import { ScopePicker } from './ScopePicker'
import { scanButtonLabel, statusMessageForScope } from './smartScope'
import { strings } from './strings'

type StartScreenProps = {
  scope: ScopeKind
  pages: PageInfo[]
  selectedPageIds: string[]
  selectionCount: number
  primaryName?: string
  scanning: boolean
  canScan: boolean
  progress?: { current: number; total: number; label: string } | null
  statusOverride?: string
  onScopeChange: (scope: ScopeKind) => void
  onPagesChange: (pageIds: string[]) => void
  onScan: () => void
  onCancel: () => void
}

export function StartScreen({
  scope,
  pages,
  selectedPageIds,
  selectionCount,
  primaryName = '',
  scanning,
  canScan,
  progress = null,
  statusOverride = '',
  onScopeChange,
  onPagesChange,
  onScan,
  onCancel
}: StartScreenProps) {
  const message =
    statusOverride.trim().length > 0
      ? statusOverride
      : scanning
        ? strings.scanningDesign
        : statusMessageForScope({
            scope,
            selectionCount,
            primaryName,
            selectedPageIds,
            pages
          })

  const buttonLabel = scanButtonLabel({
    scope,
    selectionCount,
    primaryName,
    selectedPageIds,
    pages
  })

  return (
    <div className="start-screen">
      <div className="start-hero">
        <div className="start-icon" aria-hidden="true">
          <IconSparkles size={32} />
        </div>

        <p className="start-status" aria-live="polite">
          {message}
        </p>

        {scanning && progress !== null ? (
          <div className="start-progress">
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.current}
              aria-label={progress.label}
              className="start-progress-track"
            >
              <div
                className="start-progress-bar"
                style={{
                  width: `${
                    progress.total === 0
                      ? 0
                      : (progress.current / progress.total) * 100
                  }%`
                }}
              />
            </div>
            <div className="start-progress-label">{progress.label}</div>
            <Button variant="outline" fullWidth onClick={onCancel}>
              {strings.cancelScan}
            </Button>
          </div>
        ) : (
          <div className="start-controls">
            <ScopePicker
              scope={scope}
              pages={pages}
              selectedPageIds={selectedPageIds}
              selectionCount={selectionCount}
              disabled={scanning}
              onScopeChange={onScopeChange}
              onPagesChange={onPagesChange}
            />
            <Button
              variant="cta"
              fullWidth
              onClick={onScan}
              disabled={!canScan || scanning}
              icon={<IconSearch size={16} />}
            >
              {buttonLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
