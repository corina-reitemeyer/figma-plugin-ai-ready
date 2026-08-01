import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'

import {
  CloseRequestHandler,
  ListPagesRequestHandler,
  ListPagesResultHandler,
  PageInfo,
  ScanCancelHandler,
  ScanProgressHandler,
  ScanRequestHandler,
  ScanResultHandler
} from '../shared/messages'
import { AuditReport, Issue, ScopeKind } from '../shared/types'
import { LiveRegion } from './LiveRegion'
import { ResultsTabId, ResultsTabs } from './ResultsTabs'
import { ScopePicker } from './ScopePicker'
import { strings } from './strings'
import { FileContextView } from './views/FileContextView'
import { IssuesView } from './views/IssuesView'
import { OverviewView } from './views/OverviewView'

type AppState = 'pre-scan' | 'scanning' | 'results'

export function App() {
  const [scope, setScope] = useState<ScopeKind>('pages')
  const [pages, setPages] = useState<PageInfo[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const [appState, setAppState] = useState<AppState>('pre-scan')
  const [status, setStatus] = useState<string>(strings.preScanHelp)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [statusPoliteness, setStatusPoliteness] = useState<
    'polite' | 'assertive'
  >('polite')
  const [activeTab, setActiveTab] = useState<ResultsTabId>('overview')
  const [pendingFix, setPendingFix] = useState<Issue | null>(null)

  useEffect(function () {
    emit<ListPagesRequestHandler>('LIST_PAGES_REQUEST')
    return on<ListPagesResultHandler>('LIST_PAGES_RESULT', function (payload) {
      setPages(payload.pages)
      setSelectedPageIds([payload.currentPageId])
    })
  }, [])

  useEffect(function () {
    return on<ScanProgressHandler>('SCAN_PROGRESS', function (progress) {
      setStatusPoliteness('polite')
      setStatus(progress.message)
    })
  }, [])

  useEffect(function () {
    return on<ScanResultHandler>('SCAN_RESULT', function (result) {
      if (result.ok) {
        setReport(result.report)
        setAppState('results')
        setActiveTab('overview')
        setStatusPoliteness('polite')
        setStatus(
          `Scan complete. Score ${result.report.overallScore}, ${result.report.issues.length} issues.`
        )
        return
      }
      setAppState('pre-scan')
      setStatusPoliteness('assertive')
      setStatus(`Scan failed (${result.reason}): ${result.detail}`)
    })
  }, [])

  const canRun = useMemo(
    function () {
      if (appState === 'scanning') {
        return false
      }
      if (scope === 'pages') {
        return selectedPageIds.length > 0
      }
      return true
    },
    [appState, scope, selectedPageIds]
  )

  const handleRun = useCallback(
    function () {
      setAppState('scanning')
      setReport(null)
      setPendingFix(null)
      setStatusPoliteness('polite')
      setStatus(strings.scanning)

      if (scope === 'selection') {
        emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'selection' })
        return
      }
      if (scope === 'file') {
        emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'file' })
        return
      }
      emit<ScanRequestHandler>('SCAN_REQUEST', {
        scope: 'pages',
        pageIds: selectedPageIds
      })
    },
    [scope, selectedPageIds]
  )

  return (
    <div className="app">
      <header>
        <h1>{strings.appTitle}</h1>
        {appState !== 'results' ? (
          <p className="help">{strings.preScanHelp}</p>
        ) : null}
      </header>

      <LiveRegion message={status} politeness={statusPoliteness} />

      {appState !== 'results' ? (
        <ScopePicker
          scope={scope}
          pages={pages}
          selectedPageIds={selectedPageIds}
          disabled={appState === 'scanning'}
          onScopeChange={setScope}
          onPagesChange={setSelectedPageIds}
        />
      ) : null}

      <div className="actions">
        {appState === 'scanning' ? (
          <button
            type="button"
            className="secondary"
            onClick={function () {
              emit<ScanCancelHandler>('SCAN_CANCEL')
            }}
          >
            {strings.cancelScan}
          </button>
        ) : (
          <button type="button" onClick={handleRun} disabled={!canRun}>
            {appState === 'results' ? 'Re-scan' : strings.runScan}
          </button>
        )}
        <button
          type="button"
          className="secondary"
          onClick={function () {
            emit<CloseRequestHandler>('CLOSE_REQUEST')
          }}
          disabled={appState === 'scanning'}
        >
          {strings.close}
        </button>
      </div>

      {appState === 'results' && report !== null ? (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading">{strings.resultsHeading}</h2>
          <ResultsTabs
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
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
                    onRequestFix={function (issue) {
                      setPendingFix(issue)
                      setStatusPoliteness('polite')
                      setStatus(
                        `Confirm fix for “${issue.nodeName}” in the next step (autofix UI).`
                      )
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
          {pendingFix !== null ? (
            <p className="muted">
              Pending fix queued for confirm dialog: {pendingFix.autofixId}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
