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
import {
  coerceScopeForSelectionCount,
  followCurrentPageSelection,
  ScopeSnapshot,
  snapshotNonSelection,
  transitionForSelectionChange
} from './smartScope'
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
  const preferencesReady = useRef(false)
  const currentPageIdRef = useRef<string | null>(null)
  const pagesRef = useRef<PageInfo[]>([])
  const scopeRef = useRef<ScopeKind>(DEFAULT_SCOPE)
  const selectedPageIdsRef = useRef<string[]>([])
  const selectionCountRef = useRef(0)
  const fallbackRef = useRef<ScopeSnapshot>({
    scope: DEFAULT_SCOPE,
    selectedPageIds: []
  })
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

  const applyScopeState = useCallback(
    function (
      nextScope: ScopeKind,
      nextPageIds: string[],
      options?: { persist?: boolean; fallback?: ScopeSnapshot }
    ) {
      scopeRef.current = nextScope
      selectedPageIdsRef.current = nextPageIds
      setScope(nextScope)
      setSelectedPageIds(nextPageIds)
      if (options?.fallback !== undefined) {
        fallbackRef.current = options.fallback
      }
      if (options?.persist !== false) {
        persistPreferences(nextScope, nextPageIds)
      }
    },
    [persistPreferences]
  )

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
      if (nextScope === 'selection' && selectionCountRef.current === 0) {
        return
      }
      const pageIds =
        nextScope === 'pages'
          ? resolveSelectedPageIds(
              selectedPageIdsRef.current,
              pagesRef.current,
              currentPageIdRef.current ?? ''
            )
          : selectedPageIdsRef.current
      const fallback =
        nextScope === 'selection'
          ? fallbackRef.current
          : { scope: nextScope, selectedPageIds: pageIds }
      applyScopeState(nextScope, pageIds, { fallback })
    },
    [applyScopeState, clearTransientStatus]
  )

  const handlePagesChange = useCallback(
    function (nextPageIds: string[]) {
      clearTransientStatus()
      applyScopeState(scopeRef.current, nextPageIds, {
        fallback:
          scopeRef.current === 'selection'
            ? fallbackRef.current
            : { scope: scopeRef.current, selectedPageIds: nextPageIds }
      })
    },
    [applyScopeState, clearTransientStatus]
  )

  useEffect(function () {
    emit<ListPagesRequestHandler>('LIST_PAGES_REQUEST')
    emit<GetPreferencesRequestHandler>('GET_PREFERENCES_REQUEST')
    emit<SelectionStatusRequestHandler>('SELECTION_STATUS_REQUEST')

    function applyPreferences(prefs: {
      scope: ScopeKind
      selectedPageIds: string[]
    }) {
      const pageId = currentPageIdRef.current
      if (pageId === null) {
        pendingPreferences.current = prefs
        return
      }
      const resolvedPages = resolveSelectedPageIds(
        prefs.selectedPageIds,
        pagesRef.current,
        pageId
      )
      const coerced = coerceScopeForSelectionCount(
        prefs.scope,
        resolvedPages,
        selectionCountRef.current,
        pageId,
        pagesRef.current
      )
      const nextScope =
        selectionCountRef.current > 0 ? 'selection' : coerced.scope
      const fallback = snapshotNonSelection(
        coerced.scope,
        coerced.selectedPageIds,
        pageId,
        pagesRef.current
      )
      applyScopeState(nextScope, coerced.selectedPageIds, {
        persist: false,
        fallback
      })
      preferencesReady.current = true
      pendingPreferences.current = null
      if (nextScope !== prefs.scope) {
        persistPreferences(nextScope, coerced.selectedPageIds)
      }
    }

    const unsubscribePages = on<ListPagesResultHandler>(
      'LIST_PAGES_RESULT',
      function (payload) {
        const previousCurrentPageId = currentPageIdRef.current
        pagesRef.current = payload.pages
        setPages(payload.pages)
        currentPageIdRef.current = payload.currentPageId

        if (pendingPreferences.current !== null) {
          applyPreferences(pendingPreferences.current)
          return
        }

        const followed = followCurrentPageSelection(
          selectedPageIdsRef.current,
          previousCurrentPageId,
          payload.currentPageId
        )
        const nextPageIds =
          followed ??
          resolveSelectedPageIds(
            selectedPageIdsRef.current,
            payload.pages,
            payload.currentPageId
          )

        if (
          followed !== null ||
          nextPageIds.join('\0') !== selectedPageIdsRef.current.join('\0')
        ) {
          const nextFallback =
            scopeRef.current === 'selection'
              ? {
                  ...fallbackRef.current,
                  selectedPageIds:
                    fallbackRef.current.scope === 'pages'
                      ? nextPageIds
                      : fallbackRef.current.selectedPageIds
                }
              : scopeRef.current === 'pages'
                ? { scope: 'pages' as const, selectedPageIds: nextPageIds }
                : fallbackRef.current
          applyScopeState(scopeRef.current, nextPageIds, {
            fallback: nextFallback
          })
        }
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
        const previousCount = selectionCountRef.current
        selectionCountRef.current = payload.count
        setSelectionCount(payload.count)
        setPrimaryName(payload.primaryName)

        const transition = transitionForSelectionChange({
          previousCount,
          nextCount: payload.count,
          scope: scopeRef.current,
          selectedPageIds: selectedPageIdsRef.current,
          fallback: fallbackRef.current,
          currentPageId: currentPageIdRef.current,
          pages: pagesRef.current
        })
        if (transition === null) {
          return
        }
        applyScopeState(transition.scope, transition.selectedPageIds, {
          fallback: transition.fallback
        })
      }
    )

    return function () {
      unsubscribePages()
      unsubscribePrefs()
      unsubscribeSelection()
    }
  }, [applyScopeState, persistPreferences])

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
          primaryName={primaryName}
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
