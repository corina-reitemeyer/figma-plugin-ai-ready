import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'

import { AiComponentPreview } from '../shared/aiView'
import {
  AiViewRequestHandler,
  AiViewResultHandler,
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
import { issueToAutofixRequest } from './autofixRequest'
import { Button } from './Button'
import { ConfirmFixDialog } from './ConfirmFixDialog'
import { LiveRegion } from './LiveRegion'
import { ResultsTabId, ResultsTabs } from './ResultsTabs'
import { StartScreen } from './StartScreen'
import { strings } from './strings'
import { AiView } from './views/AiView'
import {
  FixAllItem,
  FixAllPhase,
  FixAllView
} from './views/FixAllView'
import { FileContextView } from './views/FileContextView'
import { IssuesView } from './views/IssuesView'
import { OverviewView } from './views/OverviewView'

type AppState = 'pre-scan' | 'scanning' | 'results'

type FixAllSession = {
  items: FixAllItem[]
  phase: FixAllPhase
  /** Index currently running, or -1 when idle between steps. */
  runningIndex: number
}

function markItem(
  items: FixAllItem[],
  index: number,
  status: FixAllItem['status'],
  detail?: string
): FixAllItem[] {
  return items.map(function (item, i) {
    if (i !== index) {
      return item
    }
    return { ...item, status, detail }
  })
}

export function App() {
  const [selectionCount, setSelectionCount] = useState(0)
  const [primaryId, setPrimaryId] = useState('')
  const [primaryName, setPrimaryName] = useState('')
  const [aiPreview, setAiPreview] = useState<AiComponentPreview | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
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
  const [fixAll, setFixAll] = useState<FixAllSession | null>(null)
  const fixAllRef = useRef<FixAllSession | null>(null)
  const primaryIdRef = useRef('')

  useEffect(function () {
    fixAllRef.current = fixAll
  }, [fixAll])

  useEffect(function () {
    emit<SelectionStatusRequestHandler>('SELECTION_STATUS_REQUEST')

    return on<SelectionStatusHandler>('SELECTION_STATUS', function (payload) {
      primaryIdRef.current = payload.primaryId
      setSelectionCount(payload.count)
      setPrimaryId(payload.primaryId)
      setPrimaryName(payload.primaryName)

      if (payload.count === 1 && payload.primaryId.length > 0) {
        setAiLoading(true)
        setAiPreview(null)
        emit<AiViewRequestHandler>('AI_VIEW_REQUEST', {
          nodeId: payload.primaryId
        })
        return
      }

      setAiLoading(false)
      setAiPreview(null)
    })
  }, [])

  useEffect(function () {
    return on<AiViewResultHandler>('AI_VIEW_RESULT', function (result) {
      if (result.nodeId.length > 0 && result.nodeId !== primaryIdRef.current) {
        return
      }

      setAiLoading(false)
      if (result.ok) {
        setAiPreview(result.preview)
        return
      }
      setAiPreview(null)
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

  const emitScan = useCallback(
    function () {
      if (selectionCount > 0) {
        emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'selection' })
        return
      }
      emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'file' })
    },
    [selectionCount]
  )

  const startQuietRescan = useCallback(
    function () {
      setFixAll(function (current) {
        if (current === null) {
          return null
        }
        return { ...current, phase: 'rescanning', runningIndex: -1 }
      })
      setStatusPoliteness('polite')
      setStatus(strings.fixAllRescanningBody)
      emitScan()
    },
    [emitScan]
  )

  const advanceFixAll = useCallback(
    function (session: FixAllSession) {
      let nextIndex = session.runningIndex + 1

      while (nextIndex < session.items.length) {
        const nextItem = session.items[nextIndex]
        if (nextItem === undefined) {
          break
        }

        const request = issueToAutofixRequest(nextItem.issue)
        if (request === null) {
          const failedItems = markItem(
            session.items,
            nextIndex,
            'failed',
            'This issue is missing autofix payload data.'
          )
          session = {
            ...session,
            items: failedItems,
            runningIndex: nextIndex
          }
          setFixAll(session)
          nextIndex += 1
          continue
        }

        const runningItems = markItem(session.items, nextIndex, 'running')
        const nextSession: FixAllSession = {
          ...session,
          items: runningItems,
          phase: 'applying',
          runningIndex: nextIndex
        }
        setFixAll(nextSession)
        emit<AutofixRequestHandler>('AUTOFIX_REQUEST', request)
        return
      }

      startQuietRescan()
    },
    [startQuietRescan]
  )

  useEffect(function () {
    return on<ScanResultHandler>('SCAN_RESULT', function (result) {
      setProgress(null)

      const batch = fixAllRef.current
      if (batch !== null && batch.phase === 'rescanning') {
        if (result.ok) {
          setReport(result.report)
          setFixAll({
            ...batch,
            phase: 'done',
            runningIndex: -1
          })
          setStatusPoliteness('polite')
          setStatus(
            result.report.scored
              ? `Quick fixes complete. Score ${result.report.overallScore}, ${result.report.issues.length} issues.`
              : `Quick fixes complete. Nothing auditable in this scope.`
          )
          return
        }
        setFixAll({
          ...batch,
          phase: 'done',
          runningIndex: -1
        })
        setStatusPoliteness('assertive')
        setStatus(`Re-scan failed (${result.reason}): ${result.detail}`)
        return
      }

      if (result.ok) {
        setReport(result.report)
        setAppState('results')
        setActiveTab('overview')
        setStatusPoliteness('polite')
        setStatus(
          result.report.scored
            ? `Scan complete. Score ${result.report.overallScore}, ${result.report.issues.length} issues.`
            : 'Scan complete. Nothing auditable in this scope.'
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
      return appState !== 'scanning' && fixAll === null
    },
    [appState, fixAll]
  )

  const handleRun = useCallback(
    function () {
      setAppState('scanning')
      setReport(null)
      setPendingFix(null)
      setFixBusy(false)
      setFixAll(null)
      setProgress({ current: 0, total: 1, label: strings.scanningDesign })
      setStatusPoliteness('polite')
      setStatus(strings.scanningDesign)
      emitScan()
    },
    [emitScan]
  )

  useEffect(
    function () {
      return on<AutofixResultHandler>('AUTOFIX_RESULT', function (result) {
        const batch = fixAllRef.current
        if (batch !== null && batch.phase === 'applying') {
          const index = batch.runningIndex
          if (index < 0 || index >= batch.items.length) {
            return
          }

          const nextItems = markItem(
            batch.items,
            index,
            result.ok ? 'done' : 'failed',
            result.detail
          )
          const nextSession: FixAllSession = {
            ...batch,
            items: nextItems,
            runningIndex: index
          }
          setFixAll(nextSession)
          advanceFixAll(nextSession)
          return
        }

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
    [advanceFixAll, handleRun]
  )

  const handleConfirmFix = useCallback(function () {
    if (pendingFix === null) {
      return
    }

    const request: AutofixRequest | null = issueToAutofixRequest(pendingFix)
    if (request === null) {
      setStatusPoliteness('assertive')
      setStatus('This issue is missing autofix payload data.')
      return
    }

    setFixBusy(true)
    emit<AutofixRequestHandler>('AUTOFIX_REQUEST', request)
  }, [pendingFix])

  const handleFixAll = useCallback(
    function (issues: Issue[]) {
      if (issues.length === 0) {
        return
      }
      setPendingFix(null)
      const session: FixAllSession = {
        items: issues.map(function (issue) {
          return { issue, status: 'pending' as const }
        }),
        phase: 'applying',
        runningIndex: -1
      }
      setFixAll(session)
      setStatusPoliteness('polite')
      setStatus(strings.fixAllApplyingTitle)
      advanceFixAll(session)
    },
    [advanceFixAll]
  )

  const handleFixAllBack = useCallback(function () {
    setFixAll(null)
    setActiveTab('issues')
  }, [])

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
          {fixAll !== null ? (
            <FixAllView
              items={fixAll.items}
              phase={fixAll.phase}
              onBack={handleFixAllBack}
            />
          ) : (
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
                      onRequestFixAll={handleFixAll}
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
                        selectionCount === 1 ? aiPreview : null
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
          )}
          {pendingFix !== null && fixAll === null ? (
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
