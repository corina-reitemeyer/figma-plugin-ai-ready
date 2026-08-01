import { ScanProgressEvent } from '../shared/messages'
import { AuditReport, ScopeRequest } from '../shared/types'
import { collectByScope } from './collect/collectByScope'
import { LARGE_TARGET_WARNING } from './collect/types'
import { runEngine } from './engine'
import { isScanCancelled, resetScanCancel } from './scanCancel'

export type AuditProgress = ScanProgressEvent

export type RunAuditResult =
  | { ok: true; report: AuditReport }
  | {
      ok: false
      reason: 'cancelled' | 'invalid-scope' | 'failed'
      detail: string
    }

async function readMutedRuleIds(): Promise<Set<string>> {
  try {
    const value = await figma.clientStorage.getAsync('mutedRuleIds')
    if (Array.isArray(value)) {
      return new Set(value.filter((item) => typeof item === 'string'))
    }
  } catch {
    // ignore storage errors
  }
  return new Set()
}

/**
 * Collect targets for the scope, then run the rule engine.
 */
export async function runAudit(
  request: ScopeRequest,
  onProgress?: (progress: AuditProgress) => void
): Promise<RunAuditResult> {
  resetScanCancel()
  const started = Date.now()

  try {
    const collected = await collectByScope(request, onProgress)

    if (collected.cancelled || isScanCancelled()) {
      return {
        ok: false,
        reason: 'cancelled',
        detail: 'Scan cancelled.'
      }
    }

    if (request.scope === 'pages' && collected.pageIds.length === 0) {
      return {
        ok: false,
        reason: 'invalid-scope',
        detail: 'No valid pages selected for the scan.'
      }
    }

    onProgress?.({
      phase: 'scanning',
      current: 1,
      total: 1,
      targetCount: collected.targets.length,
      largeFileWarning: collected.targets.length >= LARGE_TARGET_WARNING,
      message:
        collected.targets.length >= LARGE_TARGET_WARNING
          ? `Large scan (${collected.targets.length} targets) — running rules…`
          : `Running rules on ${collected.targets.length} targets…`
    })

    const mutedRuleIds = await readMutedRuleIds()
    const report = await runEngine({
      targets: collected.targets,
      scope: collected.scope,
      pageIds: collected.pageIds,
      durationMs: Date.now() - started,
      mutedRuleIds
    })

    if (isScanCancelled()) {
      return {
        ok: false,
        reason: 'cancelled',
        detail: 'Scan cancelled.'
      }
    }

    return { ok: true, report }
  } catch (error) {
    return {
      ok: false,
      reason: 'failed',
      detail: error instanceof Error ? error.message : 'Scan failed.'
    }
  }
}
