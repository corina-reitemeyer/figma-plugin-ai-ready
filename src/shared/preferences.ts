import { ScopeKind } from './types'

export const SCAN_PREFERENCES_KEY = 'scanPreferences'

export const DEFAULT_SCOPE: ScopeKind = 'file'

export type ScanPreferences = {
  scope: ScopeKind
  selectedPageIds: string[]
}

export function isScopeKind(value: unknown): value is ScopeKind {
  return value === 'selection' || value === 'pages' || value === 'file'
}

export function parseScanPreferences(value: unknown): ScanPreferences | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null
  }
  const record = value as Record<string, unknown>
  if (!isScopeKind(record.scope)) {
    return null
  }
  const selectedPageIds = Array.isArray(record.selectedPageIds)
    ? record.selectedPageIds.filter(function (id) {
        return typeof id === 'string' && id.trim().length > 0
      }).map(function (id) {
        return (id as string).trim()
      })
    : []
  return {
    scope: record.scope,
    selectedPageIds
  }
}

/** Keep only page ids that still exist; fall back to the current page. */
export function resolveSelectedPageIds(
  preferredIds: string[],
  pages: Array<{ id: string }>,
  currentPageId: string
): string[] {
  const validIds = new Set(pages.map(function (page) {
    return page.id
  }))
  const resolved = preferredIds.filter(function (id) {
    return validIds.has(id)
  })
  if (resolved.length > 0) {
    return resolved
  }
  if (validIds.has(currentPageId)) {
    return [currentPageId]
  }
  const firstPage = pages[0]
  return firstPage === undefined ? [] : [firstPage.id]
}
