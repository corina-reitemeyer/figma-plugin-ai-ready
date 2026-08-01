import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks'

import {
  AutofixRequest,
  AutofixRequestHandler,
  AutofixResultHandler,
  CloseRequestHandler,
  GetPreferencesRequestHandler,
  GetPreferencesResultHandler,
  ListPagesRequestHandler,
  ListPagesResultHandler,
  PageInfo,
  ScanCancelHandler,
  ScanProgressHandler,
  ScanRequestHandler,
  ScanResultHandler,
  SelectionStatusHandler,
  SelectionStatusRequestHandler,
  SetPreferencesRequestHandler
} from '../shared/messages'
import {
  DEFAULT_SCOPE,
  resolveSelectedPageIds
} from '../shared/preferences'
import { AuditReport, Issue, ScopeKind } from '../shared/types'
import { Button } from './Button'
import { ConfirmFixDialog } from './ConfirmFixDialog'
import { LiveRegion } from './LiveRegion'
import { ResultsTabId, ResultsTabs } from './ResultsTabs'
import { StartScreen } from './StartScreen'
import { strings } from './strings'
import { AiView } from './views/AiView'
import { FileContextView } from './views/FileContextView'
import { IssuesView } from './views/IssuesView'
import { OverviewView } from './views/OverviewView'

type AppState = 'pre-scan' | 'scanning' | 'results'

export function App() {
  const [scope, setScope] = useState<ScopeKind>(DEFAULT_SCOPE)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [selectedPageIds, setSelectedPageIds] = useState<string[]>([])
  const [selectionCount, setSelectionCount] = useState(0)
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
  const preferencesReady = useRef(false)
  const currentPageIdRef = useRef<string | null>(null)
  const pagesRef = useRef<PageInfo[]>([])
  const pendingPreferences = useRef<{
    scope: ScopeKind
    selectedPageIds: string[]
  } | null>(null)

  const persistPreferences = useCallback(function (
    nextScope: ScopeKind,
    nextPageIds: string[]
  ) {
    if (!preferencesReady.current) {
      return
    }
    emit<SetPreferencesRequestHandler>('SET_PREFERENCES_REQUEST', {
      scope: nextScope,
      selectedPageIds: nextPageIds
    })
  }, [])

  const clearTransientStatus = useCallback(function () {
    setStatus(function (current) {
      return current.startsWith('Scan failed') ||
        current.startsWith('Autofix failed')
        ? ''
        : current
    })
  }, [])

  const handleScopeChange = useCallback(
    function (nextScope: ScopeKind) {
      clearTransientStatus()
      setScope(nextScope)
      persistPreferences(nextScope, selectedPageIds)
    },
    [clearTransientStatus, persistPreferences, selectedPageIds]
  )

  const handlePagesChange = useCallback(
    function (nextPageIds: string[]) {
      clearTransientStatus()
      setSelectedPageIds(nextPageIds)
      persistPreferences(scope, nextPageIds)
    },
    [clearTransientStatus, persistPreferences, scope]
  )

  useEffect(function () {
    emit<ListPagesRequestHandler>('LIST_PAGES_REQUEST')
    emit<GetPreferencesRequestHandler>('GET_PREFERENCES_REQUEST')
    emit<SelectionStatusRequestHandler>('SELECTION_STATUS_REQUEST')

    function applyPreferences(prefs: {
      scope: ScopeKind
      selectedPageIds: string[]
    }) {
      const currentPageId = currentPageIdRef.current
      if (currentPageId === null) {
        pendingPreferences.current = prefs
        return
      }
      setScope(prefs.scope)
      setSelectedPageIds(
        resolveSelectedPageIds(
          prefs.selectedPageIds,
          pagesRef.current,
          currentPageId
        )
      )
      preferencesReady.current = true
      pendingPreferences.current = null
    }

    const unsubscribePages = on<ListPagesResultHandler>(
      'LIST_PAGES_RESULT',
      function (payload) {
        pagesRef.current = payload.pages
        setPages(payload.pages)
        currentPageIdRef.current = payload.currentPageId

        if (pendingPreferences.current !== null) {
          applyPreferences(pendingPreferences.current)
          return
        }

        // Default / restore page checkboxes once we know the page list.
        setSelectedPageIds(function (current) {
          return resolveSelectedPageIds(
            current,
            payload.pages,
            payload.currentPageId
          )
        })
      }
    )

    const unsubscribePrefs = on<GetPreferencesResultHandler>(
      'GET_PREFERENCES_RESULT',
      function (payload) {
        if (payload.preferences === null) {
          preferencesReady.current = true
          return
        }
        applyPreferences(payload.preferences)
      }
    )

    const unsubscribeSelection = on<SelectionStatusHandler>(
      'SELECTION_STATUS',
      function (payload) {
        setSelectionCount(payload.count)
      }
    )

    return function () {
      unsubscribePages()
      unsubscribePrefs()
      unsubscribeSelection()
    }
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
      if (appState === 'scanning') {
        return false
      }
      if (scope === 'pages') {
        return selectedPageIds.length > 0
      }
      if (scope === 'selection') {
        return selectionCount > 0
      }
      return true
    },
    [appState, scope, selectedPageIds, selectionCount]
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
    <div className={appState === 'results' ? 'app app-results' : 'app app-start'}>
      {appState === 'results' ? (
        <LiveRegion message={status} politeness={statusPoliteness} />
      ) : null}

      {appState !== 'results' ? (
        <StartScreen
          scope={scope}
          pages={pages}
          selectedPageIds={selectedPageIds}
          selectionCount={selectionCount}
          scanning={appState === 'scanning'}
          canScan={canRun}
          progress={progress}
          statusOverride={
            status.startsWith('Scan failed') || status.startsWith('Autofix failed')
              ? status
              : ''
          }
          onScopeChange={handleScopeChange}
          onPagesChange={handlePagesChange}
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
                panel: <AiView />
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
