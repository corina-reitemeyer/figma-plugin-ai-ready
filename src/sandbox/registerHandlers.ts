import { emit, on } from '@create-figma-plugin/utilities'

import {
  AiViewRequestHandler,
  AiViewResultHandler,
  AutofixRequestHandler,
  AutofixResultHandler,
  ClearSelectionRequestHandler,
  CloseRequestHandler,
  GetPreferencesRequestHandler,
  GetPreferencesResultHandler,
  ListPagesRequestHandler,
  ListPagesResultHandler,
  parseAiViewRequest,
  parseAutofixRequest,
  parseScanRequest,
  parseSelectNodeRequest,
  parseSetPreferencesRequest,
  ScanCancelHandler,
  ScanProgressHandler,
  ScanRequestHandler,
  ScanResultHandler,
  SelectionStatusHandler,
  SelectionStatusRequestHandler,
  SelectNodeRequestHandler,
  SelectNodeResultHandler,
  SetPreferencesRequestHandler
} from '../shared/messages'
import { safeText } from '../shared/safeText'
import { buildAiViewPreview } from './aiViewPreview'
import { applyConfirmedAutofix } from './autofix'
import {
  readScanPreferences,
  writeScanPreferences
} from './preferencesStorage'
import { runAudit } from './runAudit'
import { requestScanCancel } from './scanCancel'
import { selectAndZoom } from './selectAndZoom'

function emitSelectionStatus(): void {
  const selection = figma.currentPage.selection
  const primary = selection[0]
  emit<SelectionStatusHandler>('SELECTION_STATUS', {
    count: selection.length,
    primaryId: primary === undefined ? '' : primary.id,
    primaryName: primary === undefined ? '' : safeText(primary.name),
    primaryType: primary === undefined ? '' : primary.type
  })
}

/**
 * Wires guarded UI ↔ sandbox handlers. Unknown/invalid payloads are ignored or rejected.
 */
function emitPagesList(): void {
  void (async function () {
    const pages = []
    for (const page of figma.root.children) {
      pages.push({
        id: page.id,
        name: safeText(page.name)
      })
    }
    emit<ListPagesResultHandler>('LIST_PAGES_RESULT', {
      pages,
      currentPageId: figma.currentPage.id
    })
  })()
}

export function registerHandlers(): void {
  figma.on('selectionchange', emitSelectionStatus)
  figma.on('currentpagechange', function () {
    emitPagesList()
    emitSelectionStatus()
  })

  on<CloseRequestHandler>('CLOSE_REQUEST', function () {
    figma.closePlugin()
  })

  on<SelectNodeRequestHandler>('SELECT_NODE_REQUEST', function (payload) {
    void (async function () {
      const request = parseSelectNodeRequest(payload)
      if (request === null) {
        emit<SelectNodeResultHandler>('SELECT_NODE_RESULT', {
          ok: false,
          reason: 'invalid-id'
        })
        return
      }

      const result = await selectAndZoom(request.nodeId)
      emit<SelectNodeResultHandler>('SELECT_NODE_RESULT', result)
    })()
  })

  on<AiViewRequestHandler>('AI_VIEW_REQUEST', function (payload) {
    void (async function () {
      const request = parseAiViewRequest(payload)
      if (request === null) {
        emit<AiViewResultHandler>('AI_VIEW_RESULT', {
          ok: false,
          nodeId: '',
          reason: 'invalid-id'
        })
        return
      }

      const result = await buildAiViewPreview(request.nodeId)
      emit<AiViewResultHandler>('AI_VIEW_RESULT', result)
    })()
  })

  on<AutofixRequestHandler>('AUTOFIX_REQUEST', function (payload) {
    void (async function () {
      const request = parseAutofixRequest(payload)
      if (request === null) {
        emit<AutofixResultHandler>('AUTOFIX_RESULT', {
          ok: false,
          autofixId: 'unknown',
          reason: 'invalid-payload',
          detail: 'Autofix request failed validation.'
        })
        return
      }

      const result = await applyConfirmedAutofix(request)
      emit<AutofixResultHandler>('AUTOFIX_RESULT', result)
    })()
  })

  on<ListPagesRequestHandler>('LIST_PAGES_REQUEST', function () {
    emitPagesList()
  })

  on<GetPreferencesRequestHandler>('GET_PREFERENCES_REQUEST', function () {
    void (async function () {
      const preferences = await readScanPreferences()
      emit<GetPreferencesResultHandler>('GET_PREFERENCES_RESULT', {
        preferences
      })
    })()
  })

  on<SetPreferencesRequestHandler>('SET_PREFERENCES_REQUEST', function (payload) {
    void (async function () {
      const preferences = parseSetPreferencesRequest(payload)
      if (preferences === null) {
        return
      }
      await writeScanPreferences(preferences)
    })()
  })

  on<SelectionStatusRequestHandler>('SELECTION_STATUS_REQUEST', function () {
    emitSelectionStatus()
  })

  on<ClearSelectionRequestHandler>('CLEAR_SELECTION_REQUEST', function () {
    figma.currentPage.selection = []
    emitSelectionStatus()
  })

  on<ScanCancelHandler>('SCAN_CANCEL', function () {
    requestScanCancel()
  })

  on<ScanRequestHandler>('SCAN_REQUEST', function (payload) {
    void (async function () {
      const request = parseScanRequest(payload)
      if (request === null) {
        emit<ScanResultHandler>('SCAN_RESULT', {
          ok: false,
          reason: 'invalid-payload',
          detail: 'Scan request failed validation.'
        })
        return
      }

      const result = await runAudit(request, function (progress) {
        emit<ScanProgressHandler>('SCAN_PROGRESS', progress)
      })

      emit<ScanResultHandler>('SCAN_RESULT', result)
    })()
  })
}
