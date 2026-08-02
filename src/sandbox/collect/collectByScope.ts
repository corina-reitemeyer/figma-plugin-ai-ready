import { CURRENT_PAGE_SENTINEL, ScopeRequest } from '../../shared/types'
import { isScanCancelled } from '../scanCancel'
import { collectFromPage, mergeTargets } from './collectFromRoot'
import { ensurePageLoaded } from './pageHelpers'
import { collectTargetsFromSelection } from './resolveSelectionTargets'
import { CollectResult, ProgressCallback } from './types'

async function collectSelection(
  onProgress?: ProgressCallback
): Promise<CollectResult> {
  onProgress?.({
    phase: 'scanning',
    current: 0,
    total: 1,
    message: 'Scanning selection…'
  })

  const targets = await collectTargetsFromSelection(
    figma.currentPage.selection
  )

  onProgress?.({
    phase: 'scanning',
    current: 1,
    total: 1,
    message: `Found ${targets.length} targets in selection`
  })

  return {
    scope: 'selection',
    pageIds: [],
    targets,
    cancelled: isScanCancelled()
  }
}

async function collectPages(
  pageIds: string[],
  onProgress?: ProgressCallback
): Promise<CollectResult> {
  const uniqueIds = Array.from(
    new Set(
      pageIds.filter(Boolean).map(function (id) {
        return id === CURRENT_PAGE_SENTINEL ? figma.currentPage.id : id
      })
    )
  )
  if (uniqueIds.length === 0) {
    return {
      scope: 'pages',
      pageIds: [],
      targets: [],
      cancelled: false
    }
  }

  const pages: PageNode[] = []
  for (const id of uniqueIds) {
    if (isScanCancelled()) {
      return {
        scope: 'pages',
        pageIds: uniqueIds,
        targets: [],
        cancelled: true
      }
    }
    const node = await figma.getNodeByIdAsync(id)
    if (node !== null && node.type === 'PAGE') {
      pages.push(node)
    }
  }

  const groups: ReturnType<typeof collectFromPage>[] = []
  for (let index = 0; index < pages.length; index += 1) {
    if (isScanCancelled()) {
      return {
        scope: 'pages',
        pageIds: pages.map((page) => page.id),
        targets: mergeTargets(groups),
        cancelled: true
      }
    }

    const page = pages[index]
    if (page === undefined) {
      continue
    }

    onProgress?.({
      phase: 'loading',
      current: index + 1,
      total: pages.length,
      pageName: page.name,
      message: `Loading page ${index + 1} of ${pages.length}…`
    })
    await ensurePageLoaded(page)

    onProgress?.({
      phase: 'scanning',
      current: index + 1,
      total: pages.length,
      pageName: page.name,
      message: `Scanning page ${index + 1} of ${pages.length}…`
    })
    groups.push(collectFromPage(page))
  }

  return {
    scope: 'pages',
    pageIds: pages.map((page) => page.id),
    targets: mergeTargets(groups),
    cancelled: isScanCancelled()
  }
}

async function collectFile(onProgress?: ProgressCallback): Promise<CollectResult> {
  onProgress?.({
    phase: 'loading',
    current: 0,
    total: 1,
    message: 'Loading all pages…'
  })

  await figma.loadAllPagesAsync()

  if (isScanCancelled()) {
    return {
      scope: 'file',
      pageIds: figma.root.children.map((page) => page.id),
      targets: [],
      cancelled: true
    }
  }

  const pages = figma.root.children
  const groups: ReturnType<typeof collectFromPage>[] = []

  for (let index = 0; index < pages.length; index += 1) {
    if (isScanCancelled()) {
      return {
        scope: 'file',
        pageIds: pages.map((page) => page.id),
        targets: mergeTargets(groups),
        cancelled: true
      }
    }

    const page = pages[index]
    if (page === undefined) {
      continue
    }

    onProgress?.({
      phase: 'scanning',
      current: index + 1,
      total: pages.length,
      pageName: page.name,
      message: `Scanning page ${index + 1} of ${pages.length}…`
    })
    groups.push(collectFromPage(page))
  }

  return {
    scope: 'file',
    pageIds: pages.map((page) => page.id),
    targets: mergeTargets(groups),
    cancelled: isScanCancelled()
  }
}

export async function collectByScope(
  request: ScopeRequest,
  onProgress?: ProgressCallback
): Promise<CollectResult> {
  if (request.scope === 'selection') {
    return collectSelection(onProgress)
  }
  if (request.scope === 'pages') {
    return collectPages(request.pageIds, onProgress)
  }
  return collectFile(onProgress)
}
