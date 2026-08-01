import { AuditReport } from '../shared/types'

/** Short scope line for overview / file meta (e.g. "Selection (20 nodes)"). */
export function formatScanScopeLabel(
  report: AuditReport,
  nodeCount: number
): string {
  const nodes = `${nodeCount} node${nodeCount === 1 ? '' : 's'}`
  if (report.scope === 'selection') {
    return `Selection (${nodes})`
  }
  if (report.scope === 'file') {
    return `File (${nodes})`
  }
  const pageCount = report.pageIds.length || report.inventory.pageCount
  return pageCount === 1
    ? `1 page (${nodes})`
    : `${pageCount} pages (${nodes})`
}
