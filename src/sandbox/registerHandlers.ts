import { emit, on } from '@create-figma-plugin/utilities'

import {
  AutofixRequestHandler,
  AutofixResultHandler,
  CloseRequestHandler,
  parseAutofixRequest,
  parseSelectNodeRequest,
  SelectNodeRequestHandler,
  SelectNodeResultHandler
} from '../shared/messages'
import { applyConfirmedAutofix } from './autofix'
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
}
