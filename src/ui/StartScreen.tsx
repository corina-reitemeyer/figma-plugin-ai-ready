import { h } from 'preact'

import { safeText } from '../shared/safeText'
import { Button } from './Button'
import { IconSearch, IconSparkles } from './Icon'
import { strings } from './strings'

type StartScreenProps = {
  selectionCount: number
  primaryName?: string
  scanning: boolean
  canScan: boolean
  progress?: { current: number; total: number; label: string } | null
  statusOverride?: string
  onScan: () => void
  onCancel: () => void
}

function statusMessage(selectionCount: number, primaryName: string): string {
  if (selectionCount === 0) {
    return strings.statusReadyFile
  }
  if (selectionCount === 1 && primaryName.length > 0) {
    return strings.statusReadyNamedLayer.replace('{name}', primaryName)
  }
  if (selectionCount > 1 && primaryName.length > 0) {
    return strings.statusReadyNamedLayersMore
      .replace('{name}', primaryName)
      .replace('{n}', String(selectionCount - 1))
  }
  if (selectionCount === 1) {
    return strings.statusReadyOneLayer
  }
  return strings.statusReadyLayers.replace('{count}', String(selectionCount))
}

function scanButtonLabel(selectionCount: number): string {
  if (selectionCount === 0) {
    return strings.runScanFile
  }
  return strings.runScanSelection
}

export function StartScreen({
  selectionCount,
  primaryName = '',
  scanning,
  canScan,
  progress = null,
  statusOverride = '',
  onScan,
  onCancel
}: StartScreenProps) {
  const name = safeText(primaryName)
  const message =
    statusOverride.trim().length > 0
      ? statusOverride
      : scanning
        ? strings.scanningDesign
        : statusMessage(selectionCount, name)

  const buttonLabel = scanButtonLabel(selectionCount)

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
            <Button variant="secondary" fullWidth onClick={onCancel}>
              {strings.cancelScan}
            </Button>
          </div>
        ) : (
          <div className="start-controls">
            <Button
              variant="primary"
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
