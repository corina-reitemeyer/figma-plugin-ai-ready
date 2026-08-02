import { h, render } from 'preact'
import { useState } from 'preact/hooks'

import { Button } from '../src/ui/Button'
import { ResultsTabId, ResultsTabs } from '../src/ui/ResultsTabs'
import { StartScreen } from '../src/ui/StartScreen'
import { strings } from '../src/ui/strings'
import { AiView, sampleAiComponent } from '../src/ui/views/AiView'
import {
  FixAllItem,
  FixAllPhase,
  FixAllView
} from '../src/ui/views/FixAllView'
import { FileContextView } from '../src/ui/views/FileContextView'
import { IssuesView } from '../src/ui/views/IssuesView'
import { OverviewView } from '../src/ui/views/OverviewView'
import { Issue } from '../src/shared/types'
import { sampleReport } from '../tests/fixtures/auditReport'
import '../src/ui/styles.css'
import './preview.css'

type PreviewMode = 'start' | 'overview'

function PreviewApp() {
  const [mode, setMode] = useState<PreviewMode>('overview')
  const [selectionCount, setSelectionCount] = useState(3)
  const [aiLoading, setAiLoading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [progress, setProgress] = useState<{
    current: number
    total: number
    label: string
  } | null>(null)
  const [activeTab, setActiveTab] = useState<ResultsTabId>('issues')
  const [lastScan, setLastScan] = useState('—')
  const [report, setReport] = useState(sampleReport)
  const [fixAllItems, setFixAllItems] = useState<FixAllItem[] | null>(null)
  const [fixAllPhase, setFixAllPhase] = useState<FixAllPhase>('applying')

  const canScan = !scanning

  function simulateFixAll(issues: Issue[]): void {
    const items: FixAllItem[] = issues.map(function (issue) {
      return { issue, status: 'pending' }
    })
    setFixAllItems(items)
    setFixAllPhase('applying')
    setLastScan('fix-all')

    items.forEach(function (_item, index) {
      window.setTimeout(function () {
        setFixAllItems(function (current) {
          if (current === null) {
            return null
          }
          return current.map(function (entry, i) {
            if (i === index) {
              return { ...entry, status: 'running' }
            }
            if (i < index && entry.status === 'running') {
              return { ...entry, status: 'done' }
            }
            return entry
          })
        })
      }, index * 450)

      window.setTimeout(function () {
        setFixAllItems(function (current) {
          if (current === null) {
            return null
          }
          return current.map(function (entry, i) {
            if (i === index) {
              return { ...entry, status: 'done' }
            }
            return entry
          })
        })
      }, index * 450 + 350)
    })

    const applyMs = items.length * 450 + 400
    window.setTimeout(function () {
      setFixAllPhase('rescanning')
    }, applyMs)

    window.setTimeout(function () {
      setReport(function (current) {
        const remaining = current.issues.filter(function (issue) {
          return !issues.some(function (fixed) {
            return fixed.id === issue.id
          })
        })
        return {
          ...current,
          issues: remaining,
          failedChecks: Math.max(current.failedChecks - issues.length, 0),
          issueCounts: {
            ...current.issueCounts,
            warning: Math.max(
              current.issueCounts.warning -
                issues.filter(function (issue) {
                  return issue.severity === 'warning'
                }).length,
              0
            ),
            error: Math.max(
              current.issueCounts.error -
                issues.filter(function (issue) {
                  return issue.severity === 'error'
                }).length,
              0
            )
          }
        }
      })
      setFixAllPhase('done')
    }, applyMs + 700)
  }

  return (
    <div className="preview-shell">
      <aside className="preview-controls">
        <h1>Plugin UI preview</h1>
        <p>
          Plugin frame is 420×640. Toggle between the start screen and the
          post-scan results (defaults to Issues for Fix all).
        </p>

        <label>
          Screen
          <select
            value={mode}
            onChange={function (event) {
              setMode(
                (event.currentTarget as HTMLSelectElement).value as PreviewMode
              )
            }}
          >
            <option value="overview">Overview (results)</option>
            <option value="start">Start screen</option>
          </select>
        </label>

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

        {mode === 'overview' ? (
          <label className="preview-check">
            <input
              type="checkbox"
              checked={aiLoading}
              onChange={function (event) {
                setAiLoading(
                  (event.currentTarget as HTMLInputElement).checked
                )
              }}
            />
            Simulate AI view loading
          </label>
        ) : null}

        {mode === 'start' ? (
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
        ) : null}

        <p className="preview-meta">
          Last scan action: <strong>{lastScan}</strong>
        </p>
      </aside>

      <div className="preview-frame" aria-label="Plugin UI frame">
        {mode === 'start' ? (
          <div className="app app-start">
            <StartScreen
              selectionCount={selectionCount}
              primaryName={selectionCount === 0 ? '' : 'Checkout'}
              scanning={scanning}
              canScan={canScan}
              progress={progress}
              onScan={function () {
                setLastScan(selectionCount > 0 ? 'selection' : 'file')
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
                  setMode('overview')
                  setActiveTab('overview')
                  setReport(sampleReport)
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
        ) : (
          <div className="app app-results">
            <section
              className="results-shell"
              aria-label={strings.resultsHeading}
            >
              {fixAllItems !== null ? (
                <FixAllView
                  items={fixAllItems}
                  phase={fixAllPhase}
                  onBack={function () {
                    setFixAllItems(null)
                    setFixAllPhase('applying')
                    setActiveTab('issues')
                    setLastScan('back-to-issues')
                  }}
                />
              ) : (
                <ResultsTabs
                  activeTab={activeTab}
                  onActiveTabChange={setActiveTab}
                  onRefresh={function () {
                    setLastScan('re-scan')
                    setReport(sampleReport)
                  }}
                  tabs={[
                    {
                      id: 'overview',
                      label: strings.tabOverview,
                      panel: (
                        <OverviewView
                          report={report}
                          onOpenIssues={function () {
                            setActiveTab('issues')
                          }}
                        />
                      )
                    },
                    {
                      id: 'issues',
                      label: strings.tabIssues,
                      panel: (
                        <IssuesView
                          report={report}
                          onRequestFix={function () {}}
                          onRequestFixAll={simulateFixAll}
                        />
                      )
                    },
                    {
                      id: 'aiView',
                      label: strings.tabAiView,
                      panel: (
                        <AiView
                          selectionCount={selectionCount}
                          loading={aiLoading}
                          component={
                            selectionCount === 1 && !aiLoading
                              ? sampleAiComponent
                              : null
                          }
                          onViewOnCanvas={
                            selectionCount === 1
                              ? function () {
                                  setLastScan('view-on-canvas')
                                }
                              : undefined
                          }
                          onDeselect={function () {
                            setSelectionCount(0)
                          }}
                        />
                      )
                    },
                    {
                      id: 'fileContext',
                      label: strings.tabFileContext,
                      panel: <FileContextView report={report} />
                    }
                  ]}
                />
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

const root = document.getElementById('root')
if (root !== null) {
  render(<PreviewApp />, root)
}
