import { PageInfo } from '../shared/messages'
import { resolveSelectedPageIds } from '../shared/preferences'
import { safeText } from '../shared/safeText'
import { ScopeKind } from '../shared/types'
import { strings } from './strings'

export type ScopeSnapshot = {
  scope: ScopeKind
  selectedPageIds: string[]
}

export type SmartScopeState = {
  scope: ScopeKind
  selectedPageIds: string[]
  fallback: ScopeSnapshot
}

/** Non-selection snapshot to restore when the canvas selection clears. */
export function snapshotNonSelection(
  scope: ScopeKind,
  selectedPageIds: string[],
  currentPageId: string | null,
  pages: Array<{ id: string }>
): ScopeSnapshot {
  if (scope === 'selection') {
    return {
      scope: 'pages',
      selectedPageIds:
        currentPageId === null
          ? selectedPageIds
          : resolveSelectedPageIds(selectedPageIds, pages, currentPageId)
    }
  }
  return { scope, selectedPageIds }
}

/**
 * Auto-switch between selection and the remembered non-selection scope
 * when the canvas selection crosses empty ↔ non-empty.
 * Returns null when nothing should change.
 */
export function transitionForSelectionChange(args: {
  previousCount: number
  nextCount: number
  scope: ScopeKind
  selectedPageIds: string[]
  fallback: ScopeSnapshot
  currentPageId: string | null
  pages: Array<{ id: string }>
}): SmartScopeState | null {
  const hadSelection = args.previousCount > 0
  const hasSelection = args.nextCount > 0

  if (hadSelection === hasSelection) {
    return null
  }

  if (hasSelection) {
    if (args.scope === 'selection') {
      return null
    }
    return {
      scope: 'selection',
      selectedPageIds: args.selectedPageIds,
      fallback: snapshotNonSelection(
        args.scope,
        args.selectedPageIds,
        args.currentPageId,
        args.pages
      )
    }
  }

  const restored = args.fallback
  const nextScope = restored.scope === 'selection' ? 'pages' : restored.scope
  const nextPageIds =
    args.currentPageId === null
      ? restored.selectedPageIds
      : resolveSelectedPageIds(
          restored.selectedPageIds,
          args.pages,
          args.currentPageId
        )

  return {
    scope: nextScope,
    selectedPageIds: nextPageIds,
    fallback: {
      scope: nextScope,
      selectedPageIds: nextPageIds
    }
  }
}

/** If restored prefs say selection but the canvas is empty, fall back to pages. */
export function coerceScopeForSelectionCount(
  scope: ScopeKind,
  selectedPageIds: string[],
  selectionCount: number,
  currentPageId: string | null,
  pages: Array<{ id: string }>
): ScopeSnapshot {
  if (scope !== 'selection' || selectionCount > 0) {
    return { scope, selectedPageIds }
  }
  const pageIds =
    currentPageId === null
      ? selectedPageIds
      : resolveSelectedPageIds(selectedPageIds, pages, currentPageId)
  return { scope: 'pages', selectedPageIds: pageIds }
}

/**
 * When the user changes pages in Figma and only the previous current page
 * was checked, follow them to the new current page.
 */
export function followCurrentPageSelection(
  selectedPageIds: string[],
  previousCurrentPageId: string | null,
  nextCurrentPageId: string
): string[] | null {
  if (
    previousCurrentPageId === null ||
    previousCurrentPageId === nextCurrentPageId
  ) {
    return null
  }
  if (
    selectedPageIds.length === 1 &&
    selectedPageIds[0] === previousCurrentPageId
  ) {
    return [nextCurrentPageId]
  }
  return null
}

export function pageNameById(
  pages: PageInfo[],
  pageId: string | undefined
): string {
  if (pageId === undefined) {
    return ''
  }
  const page = pages.find(function (entry) {
    return entry.id === pageId
  })
  return page === undefined ? '' : safeText(page.name)
}

export function statusMessageForScope(args: {
  scope: ScopeKind
  selectionCount: number
  primaryName?: string
  selectedPageIds: string[]
  pages: PageInfo[]
}): string {
  const { scope, selectionCount, selectedPageIds, pages } = args
  const primaryName = safeText(args.primaryName ?? '')

  if (scope === 'file') {
    return strings.statusReadyFile
  }

  if (scope === 'pages') {
    if (selectedPageIds.length === 0) {
      return strings.statusPickPages
    }
    if (selectedPageIds.length === 1) {
      const name = pageNameById(pages, selectedPageIds[0])
      if (name.length > 0) {
        return strings.statusReadyNamedPage.replace('{name}', name)
      }
      return strings.statusReadyOnePage
    }
    return strings.statusReadyPages.replace(
      '{count}',
      String(selectedPageIds.length)
    )
  }

  if (selectionCount === 0) {
    return strings.statusEmptySelection
  }
  if (selectionCount === 1) {
    if (primaryName.length > 0) {
      return strings.statusReadyNamedLayer.replace('{name}', primaryName)
    }
    return strings.statusReadyOneLayer
  }
  if (primaryName.length > 0) {
    return strings.statusReadyNamedLayersMore
      .replace('{name}', primaryName)
      .replace('{n}', String(selectionCount - 1))
  }
  return strings.statusReadyLayers.replace('{count}', String(selectionCount))
}

export function scanButtonLabel(args: {
  scope: ScopeKind
  selectionCount?: number
  primaryName?: string
  selectedPageIds: string[]
  pages: PageInfo[]
}): string {
  const { scope, selectedPageIds, pages } = args
  const selectionCount = args.selectionCount ?? 0
  const primaryName = safeText(args.primaryName ?? '')

  if (scope === 'file') {
    return strings.runScanFile
  }

  if (scope === 'pages') {
    if (selectedPageIds.length === 1) {
      const name = pageNameById(pages, selectedPageIds[0])
      if (name.length > 0) {
        return strings.runScanNamed.replace('{name}', name)
      }
    }
    if (selectedPageIds.length > 1) {
      return strings.runScanPages.replace(
        '{count}',
        String(selectedPageIds.length)
      )
    }
  }

  if (scope === 'selection') {
    if (selectionCount === 1 && primaryName.length > 0) {
      return strings.runScanNamed.replace('{name}', primaryName)
    }
    return strings.runScanSelection
  }

  return strings.runScan
}
