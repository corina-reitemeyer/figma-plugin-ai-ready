import { h, render } from 'preact'
import { useState } from 'preact/hooks'

import { ScopeKind } from '../src/shared/types'
import { Button } from '../src/ui/Button'
import { StartScreen } from '../src/ui/StartScreen'
import '../src/ui/styles.css'
import './preview.css'

const SAMPLE_PAGES = [
  { id: '0:1', name: 'Components' },
  { id: '0:2', name: 'Foundations' },
  { id: '0:3', name: 'Patterns' }
]

function PreviewApp() {
  const [scope, setScope] = useState<ScopeKind>('file')
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>(['0:1'])
  const [selectionCount, setSelectionCount] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    label: string
  } | null>(null)
  const [lastScan, setLastScan] = useState('—')

  const canScan =
    !scanning &&
    (scope === 'file' ||
      (scope === 'pages' && selectedPageIds.length > 0) ||
      (scope === 'selection' && selectionCount > 0))

  return (
    <div className="preview-shell">
      <aside className="preview-controls">
        <h1>Start screen preview</h1>
        <p>
          Plugin frame is 420×640 — matching the lint-checker UI. Scope selector
          + Scan keep the new behavior; visuals come from that theme.
        </p>

        <label>
          Canvas selection count
          <input
            type="range"
            min={0}
            max={5}
            value={selectionCount}
            onInput={function (event) {
              setSelectionCount(
                Number((event.currentTarget as HTMLInputElement).value)
              )
            }}
          />
          <span>{selectionCount}</span>
        </label>

        <label className="preview-check">
          <input
            type="checkbox"
            checked={scanning}
            onChange={function (event) {
              const next = (event.currentTarget as HTMLInputElement).checked
              setScanning(next)
              setProgress(
                next
                  ? { current: 2, total: 5, label: 'Scanning page 2 of 5…' }
                  : null
              )
            }}
          />
          Simulate scanning
        </label>

        <p className="preview-meta">
          Last scan action: <strong>{lastScan}</strong>
        </p>
      </aside>

      <div className="preview-frame" aria-label="Plugin UI frame">
        <div className="app app-start">
          <StartScreen
            scope={scope}
            pages={SAMPLE_PAGES}
            selectedPageIds={selectedPageIds}
            selectionCount={selectionCount}
            scanning={scanning}
            canScan={canScan}
            progress={progress}
            onScopeChange={setScope}
            onPagesChange={setSelectedPageIds}
            onScan={function () {
              setLastScan(
                scope === 'pages'
                  ? `pages:${selectedPageIds.join(',')}`
                  : scope
              )
              setScanning(true)
              setProgress({
                current: 1,
                total: 4,
                label: 'Scanning your design…'
              })
              window.setTimeout(function () {
                setProgress({
                  current: 3,
                  total: 4,
                  label: 'Running rules…'
                })
              }, 500)
              window.setTimeout(function () {
                setScanning(false)
                setProgress(null)
              }, 1400)
            }}
            onCancel={function () {
              setScanning(false)
              setProgress(null)
              setLastScan('cancelled')
            }}
          />
          <div className="start-close">
            <Button variant="ghost" onClick={function () {}}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const root = document.getElementById('root')
if (root !== null) {
  render(<PreviewApp />, root)
}
