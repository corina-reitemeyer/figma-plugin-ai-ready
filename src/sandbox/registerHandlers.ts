import { emit, on } from '@create-figma-plugin/utilities'

import {
  AutofixRequestHandler,
  AutofixResultHandler,
  CloseRequestHandler,
  ListPagesRequestHandler,
  ListPagesResultHandler,
  parseAutofixRequest,
  parseScanRequest,
  parseSelectNodeRequest,
  ScanCancelHandler,
  ScanProgressHandler,
  ScanRequestHandler,
  ScanResultHandler,
  SelectNodeRequestHandler,
  SelectNodeResultHandler
} from '../shared/messages'
import { safeText } from '../shared/safeText'
import { applyConfirmedAutofix } from './autofix'
import { runAudit } from './runAudit'
import { requestScanCancel } from './scanCancel'
import { selectAndZoom } from './selectAndZoom'

/**
 * Wires guarded UI ↔ sandbox handlers. Unknown/invalid payloads are ignored or rejected.
 */
export function registerHandlers(): void {
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
