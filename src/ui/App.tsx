import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'

import {
  AutofixRequest,
  AutofixRequestHandler,
  AutofixResultHandler,
  ClearSelectionRequestHandler,
  CloseRequestHandler,
  ScanCancelHandler,
  ScanProgressHandler,
  ScanRequestHandler,
  ScanResultHandler,
  SelectionStatusHandler,
  SelectionStatusRequestHandler,
  SelectNodeRequestHandler
} from '../shared/messages'
import { AuditReport, Issue } from '../shared/types'
import { Button } from './Button'
import { ConfirmFixDialog } from './ConfirmFixDialog'
import { LiveRegion } from './LiveRegion'
import { ResultsTabId, ResultsTabs } from './ResultsTabs'
import { StartScreen } from './StartScreen'
import { strings } from './strings'
import { AiView, sampleAiComponent } from './views/AiView'
import { FileContextView } from './views/FileContextView'
import { IssuesView } from './views/IssuesView'
import { OverviewView } from './views/OverviewView'

type AppState = 'pre-scan' | 'scanning' | 'results'

export function App() {
  const [selectionCount, setSelectionCount] = useState(0)
  const [primaryId, setPrimaryId] = useState('')
  const [primaryName, setPrimaryName] = useState('')
  const [appState, setAppState] = useState<AppState>('pre-scan')
  const [status, setStatus] = useState<string>('')
  const [progress, setProgress] = useState<{
    current: number
    total: number
    label: string
  } | null>(null)
  const [report, setReport] = useState<AuditReport | null>(null)
  const [statusPoliteness, setStatusPoliteness] = useState<
    'polite' | 'assertive'
  >('polite')
  const [activeTab, setActiveTab] = useState<ResultsTabId>('overview')
  const [pendingFix, setPendingFix] = useState<Issue | null>(null)
  const [fixBusy, setFixBusy] = useState(false)

  useEffect(function () {
    emit<SelectionStatusRequestHandler>('SELECTION_STATUS_REQUEST')

    return on<SelectionStatusHandler>('SELECTION_STATUS', function (payload) {
      setSelectionCount(payload.count)
      setPrimaryId(payload.primaryId)
      setPrimaryName(payload.primaryName)
    })
  }, [])

  useEffect(function () {
    return on<ScanProgressHandler>('SCAN_PROGRESS', function (event) {
      setStatusPoliteness('polite')
      setStatus(event.message)
      setProgress({
        current: event.current,
        total: Math.max(event.total, 1),
        label: event.message
      })
    })
  }, [])

  useEffect(function () {
    return on<ScanResultHandler>('SCAN_RESULT', function (result) {
      setProgress(null)
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
      return appState !== 'scanning'
    },
    [appState]
  )

  const handleRun = useCallback(
    function () {
      setAppState('scanning')
      setReport(null)
      setPendingFix(null)
      setFixBusy(false)
      setProgress({ current: 0, total: 1, label: strings.scanningDesign })
      setStatusPoliteness('polite')
      setStatus(strings.scanningDesign)

      if (selectionCount > 0) {
        emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'selection' })
        return
      }
      emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'file' })
    },
    [selectionCount]
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
    <div className={appState === 'results' ? 'app app-results' : 'app app-start'}>
      {appState === 'results' ? (
        <LiveRegion message={status} politeness={statusPoliteness} />
      ) : null}

      {appState !== 'results' ? (
        <StartScreen
          selectionCount={selectionCount}
          primaryName={primaryName}
          scanning={appState === 'scanning'}
          canScan={canRun}
          progress={progress}
          statusOverride={
            status.startsWith('Scan failed') || status.startsWith('Autofix failed')
              ? status
              : ''
          }
          onScan={handleRun}
          onCancel={function () {
            emit<ScanCancelHandler>('SCAN_CANCEL')
          }}
        />
      ) : null}

      {appState !== 'results' ? (
        <div className="start-close">
          <Button
            variant="ghost"
            onClick={function () {
              emit<CloseRequestHandler>('CLOSE_REQUEST')
            }}
            disabled={appState === 'scanning'}
          >
            {strings.close}
          </Button>
        </div>
      ) : null}

      {appState === 'results' && report !== null ? (
        <section className="results-shell" aria-label={strings.resultsHeading}>
          <ResultsTabs
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            onRefresh={handleRun}
            refreshDisabled={!canRun}
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
                id: 'aiView',
                label: strings.tabAiView,
                panel: (
                  <AiView
                    selectionCount={selectionCount}
                    component={
                      selectionCount === 1 ? sampleAiComponent : null
                    }
                    onViewOnCanvas={
                      selectionCount === 1 && primaryId.length > 0
                        ? function () {
                            emit<SelectNodeRequestHandler>(
                              'SELECT_NODE_REQUEST',
                              { nodeId: primaryId }
                            )
                          }
                        : undefined
                    }
                    onDeselect={function () {
                      emit<ClearSelectionRequestHandler>(
                        'CLEAR_SELECTION_REQUEST'
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
