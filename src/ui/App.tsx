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
import { AuditReport, ScopeKind } from '../shared/types'
import { LiveRegion } from './LiveRegion'
import { ResultsTabs } from './ResultsTabs'
import { ScopePicker } from './ScopePicker'
import { strings } from './strings'

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

  const handleCancel = useCallback(function () {
    emit<ScanCancelHandler>('SCAN_CANCEL')
  }, [])

  const handleClose = useCallback(function () {
    emit<CloseRequestHandler>('CLOSE_REQUEST')
  }, [])

  const handleRescan = useCallback(
    function () {
      handleRun()
    },
    [handleRun]
  )

  return (
    <div className="app">
      <header>
        <h1>{strings.appTitle}</h1>
        <p className="help">{strings.preScanHelp}</p>
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
          <button type="button" className="secondary" onClick={handleCancel}>
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
          onClick={handleClose}
          disabled={appState === 'scanning'}
        >
          {strings.close}
        </button>
      </div>

      {appState === 'results' && report !== null ? (
        <section aria-labelledby="results-heading">
          <h2 id="results-heading">{strings.resultsHeading}</h2>
          <ResultsTabs
            tabs={[
              {
                id: 'overview',
                label: strings.tabOverview,
                panel: (
                  <p className="muted">
                    {strings.overviewPlaceholder} Current score:{' '}
                    {report.overallScore} ({report.band}).
                  </p>
                )
              },
              {
                id: 'issues',
                label: strings.tabIssues,
                panel: (
                  <p className="muted">
                    {strings.issuesPlaceholder} {report.issues.length} issue(s)
                    ready to render.
                  </p>
                )
              },
              {
                id: 'fileContext',
                label: strings.tabFileContext,
                panel: (
                  <p className="muted">
                    {strings.fileContextPlaceholder}{' '}
                    {report.inventory.componentCount} components across{' '}
                    {report.inventory.pageCount} page(s).
                  </p>
                )
              }
            ]}
          />
          <div className="actions" style={{ marginTop: 12 }}>
            <button type="button" className="secondary" onClick={handleRescan}>
              Re-scan
            </button>
          </div>
        </section>
      ) : null}
    </div>
  )
}
