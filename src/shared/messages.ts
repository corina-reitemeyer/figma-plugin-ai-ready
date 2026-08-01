import { EventHandler } from '@create-figma-plugin/utilities'

import { AutofixId, AuditReport, ScopeRequest } from './types'
import { isNonEmptyString } from './safeText'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ——— UI → sandbox ———

export type SelectNodeRequest = {
  nodeId: string
}

export type AutofixRequest =
  | {
      autofixId: 'rename-convention'
      nodeId: string
      /** Must already be confirmed in the UI; sandbox re-validates the pattern. */
      suggestedName: string
    }
  | {
      autofixId: 'bind-inferred'
      nodeId: string
      field: 'fills' | 'strokes'
      paintIndex: number
      variableId: string
    }

export interface CloseRequestHandler extends EventHandler {
  name: 'CLOSE_REQUEST'
  handler: () => void
}

export interface SelectNodeRequestHandler extends EventHandler {
  name: 'SELECT_NODE_REQUEST'
  handler: (payload: SelectNodeRequest) => void
}

export interface AutofixRequestHandler extends EventHandler {
  name: 'AUTOFIX_REQUEST'
  handler: (payload: AutofixRequest) => void
}

export type ScanRequest = ScopeRequest

export interface ScanRequestHandler extends EventHandler {
  name: 'SCAN_REQUEST'
  handler: (payload: ScanRequest) => void
}

export interface ScanCancelHandler extends EventHandler {
  name: 'SCAN_CANCEL'
  handler: () => void
}

export type PageInfo = {
  id: string
  name: string
}

export interface ListPagesRequestHandler extends EventHandler {
  name: 'LIST_PAGES_REQUEST'
  handler: () => void
}

export interface ListPagesResultHandler extends EventHandler {
  name: 'LIST_PAGES_RESULT'
  handler: (payload: { pages: PageInfo[]; currentPageId: string }) => void
}

// ——— sandbox → UI ———

export type SelectNodeResult =
  | {
      ok: true
      nodeId: string
      nodeName: string
    }
  | {
      ok: false
      reason: 'invalid-id' | 'not-found' | 'not-selectable'
    }

export type AutofixResult =
  | {
      ok: true
      autofixId: AutofixId
      nodeId: string
      detail: string
    }
  | {
      ok: false
      autofixId: AutofixId | 'unknown'
      reason:
        | 'invalid-payload'
        | 'not-found'
        | 'unsupported'
        | 'validation-failed'
        | 'apply-failed'
      detail: string
    }

export interface SelectNodeResultHandler extends EventHandler {
  name: 'SELECT_NODE_RESULT'
  handler: (payload: SelectNodeResult) => void
}

export interface AutofixResultHandler extends EventHandler {
  name: 'AUTOFIX_RESULT'
  handler: (payload: AutofixResult) => void
}

export type ScanProgressEvent = {
  phase: 'loading' | 'scanning'
  current: number
  total: number
  pageName?: string
  message: string
  targetCount?: number
  largeFileWarning?: boolean
}

export interface ScanProgressHandler extends EventHandler {
  name: 'SCAN_PROGRESS'
  handler: (payload: ScanProgressEvent) => void
}

export type ScanResult =
  | { ok: true; report: AuditReport }
  | {
      ok: false
      reason: 'cancelled' | 'invalid-scope' | 'invalid-payload' | 'failed'
      detail: string
    }

export interface ScanResultHandler extends EventHandler {
  name: 'SCAN_RESULT'
  handler: (payload: ScanResult) => void
}

// ——— Runtime guards (never trust UI payloads) ———

export function parseSelectNodeRequest(
  value: unknown
): SelectNodeRequest | null {
  if (!isRecord(value) || !isNonEmptyString(value.nodeId)) {
    return null
  }
  return { nodeId: value.nodeId.trim() }
}

export function parseAutofixRequest(value: unknown): AutofixRequest | null {
  if (!isRecord(value) || !isNonEmptyString(value.nodeId)) {
    return null
  }

  const nodeId = value.nodeId.trim()
  const autofixId = value.autofixId

  if (autofixId === 'rename-convention') {
    if (!isNonEmptyString(value.suggestedName)) {
      return null
    }
    return {
      autofixId,
      nodeId,
      suggestedName: value.suggestedName.trim()
    }
  }

  if (autofixId === 'bind-inferred') {
    if (
      (value.field !== 'fills' && value.field !== 'strokes') ||
      typeof value.paintIndex !== 'number' ||
      !Number.isInteger(value.paintIndex) ||
      value.paintIndex < 0 ||
      !isNonEmptyString(value.variableId)
    ) {
      return null
    }
    return {
      autofixId,
      nodeId,
      field: value.field,
      paintIndex: value.paintIndex,
      variableId: value.variableId.trim()
    }
  }

  return null
}

export function parseScanRequest(value: unknown): ScanRequest | null {
  if (!isRecord(value) || typeof value.scope !== 'string') {
    return null
  }

  if (value.scope === 'selection') {
    return { scope: 'selection' }
  }

  if (value.scope === 'file') {
    return { scope: 'file' }
  }

  if (value.scope === 'pages') {
    if (!Array.isArray(value.pageIds)) {
      return null
    }
    const pageIds = value.pageIds.filter(isNonEmptyString).map(function (id) {
      return id.trim()
    })
    return { scope: 'pages', pageIds }
  }

  return null
}
