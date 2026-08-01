import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'

import {
  AutofixRequest,
  AutofixRequestHandler,
  AutofixResultHandler,
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
import { ConfirmFixDialog } from './ConfirmFixDialog'
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
  const [fixBusy, setFixBusy] = useState(false)

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
      setFixBusy(false)
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

  useEffect(
    function () {
      return on<AutofixResultHandler>('AUTOFIX_RESULT', function (result) {
        setFixBusy(false)
        if (result.ok) {
          setPendingFix(null)
          setStatusPoliteness('polite')
          setStatus(`${result.detail} Re-scanning…`)
          handleRun()
          return
        }
        setStatusPoliteness('assertive')
        setStatus(`Autofix failed (${result.reason}): ${result.detail}`)
      })
    },
    [handleRun]
  )

  const handleConfirmFix = useCallback(function () {
    if (pendingFix === null || pendingFix.autofixId === undefined) {
      return
    }

    let request: AutofixRequest | null = null
    if (
      pendingFix.autofixId === 'rename-convention' &&
      pendingFix.autofixPayload?.suggestedName
    ) {
      request = {
        autofixId: 'rename-convention',
        nodeId: pendingFix.nodeId,
        suggestedName: pendingFix.autofixPayload.suggestedName
      }
    } else if (
      pendingFix.autofixId === 'bind-inferred' &&
      pendingFix.autofixPayload?.field !== undefined &&
      pendingFix.autofixPayload.paintIndex !== undefined &&
      pendingFix.autofixPayload.variableId
    ) {
      request = {
        autofixId: 'bind-inferred',
        nodeId: pendingFix.nodeId,
        field: pendingFix.autofixPayload.field,
        paintIndex: pendingFix.autofixPayload.paintIndex,
        variableId: pendingFix.autofixPayload.variableId
      }
    }

    if (request === null) {
      setStatusPoliteness('assertive')
      setStatus('This issue is missing autofix payload data.')
      return
    }

    setFixBusy(true)
    emit<AutofixRequestHandler>('AUTOFIX_REQUEST', request)
  }, [pendingFix])

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
            <ConfirmFixDialog
              issue={pendingFix}
              busy={fixBusy}
              onConfirm={handleConfirmFix}
              onCancel={function () {
                setPendingFix(null)
              }}
            />
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
