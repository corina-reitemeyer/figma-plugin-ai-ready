import { describe, expect, it } from 'vitest'

import {
  coerceScopeForSelectionCount,
  followCurrentPageSelection,
  scanButtonLabel,
  snapshotNonSelection,
  statusMessageForScope,
  transitionForSelectionChange
} from '../../src/ui/smartScope'

const pages = [
  { id: '0:1', name: 'Home' },
  { id: '0:2', name: 'Components' },
  { id: '0:3', name: 'Patterns' }
]

describe('smartScope', () => {
  it('switches to selection when layers become selected', () => {
    expect(
      transitionForSelectionChange({
        previousCount: 0,
        nextCount: 2,
        scope: 'pages',
        selectedPageIds: ['0:1'],
        fallback: { scope: 'pages', selectedPageIds: ['0:1'] },
        currentPageId: '0:1',
        pages
      })
    ).toEqual({
      scope: 'selection',
      selectedPageIds: ['0:1'],
      fallback: { scope: 'pages', selectedPageIds: ['0:1'] }
    })
  })

  it('restores fallback when selection clears', () => {
    expect(
      transitionForSelectionChange({
        previousCount: 3,
        nextCount: 0,
        scope: 'selection',
        selectedPageIds: ['0:1', '0:2'],
        fallback: { scope: 'file', selectedPageIds: ['0:1'] },
        currentPageId: '0:1',
        pages
      })
    ).toEqual({
      scope: 'file',
      selectedPageIds: ['0:1'],
      fallback: { scope: 'file', selectedPageIds: ['0:1'] }
    })
  })

  it('does not thrash when selection stays non-empty', () => {
    expect(
      transitionForSelectionChange({
        previousCount: 1,
        nextCount: 4,
        scope: 'file',
        selectedPageIds: ['0:1'],
        fallback: { scope: 'file', selectedPageIds: ['0:1'] },
        currentPageId: '0:1',
        pages
      })
    ).toBeNull()
  })

  it('coerces empty-canvas selection prefs to pages', () => {
    expect(
      coerceScopeForSelectionCount('selection', ['0:2'], 0, '0:1', pages)
    ).toEqual({
      scope: 'pages',
      selectedPageIds: ['0:2']
    })
  })

  it('follows the current page when only that page was checked', () => {
    expect(followCurrentPageSelection(['0:1'], '0:1', '0:2')).toEqual(['0:2'])
    expect(followCurrentPageSelection(['0:1', '0:2'], '0:1', '0:2')).toBeNull()
  })

  it('builds status and CTA copy from canvas-named selection and pages', () => {
    expect(
      statusMessageForScope({
        scope: 'pages',
        selectionCount: 0,
        selectedPageIds: ['0:1'],
        pages
      })
    ).toBe('Ready to scan Home.')
    expect(
      statusMessageForScope({
        scope: 'selection',
        selectionCount: 1,
        primaryName: 'Checkout',
        selectedPageIds: ['0:1'],
        pages
      })
    ).toBe('Ready to scan Checkout.')
    expect(
      statusMessageForScope({
        scope: 'selection',
        selectionCount: 3,
        primaryName: 'Checkout',
        selectedPageIds: ['0:1'],
        pages
      })
    ).toBe('Checkout + 2 more. Ready when you are.')
    expect(
      scanButtonLabel({
        scope: 'selection',
        selectionCount: 1,
        primaryName: 'Checkout',
        selectedPageIds: ['0:1'],
        pages
      })
    ).toBe('Scan Checkout')
    expect(
      scanButtonLabel({
        scope: 'pages',
        selectedPageIds: ['0:1'],
        pages
      })
    ).toBe('Scan Home')
    expect(
      scanButtonLabel({
        scope: 'file',
        selectedPageIds: [],
        pages
      })
    ).toBe('Scan entire file')
  })

  it('snapshots selection as pages for fallback', () => {
    expect(snapshotNonSelection('selection', [], '0:1', pages)).toEqual({
      scope: 'pages',
      selectedPageIds: ['0:1']
    })
  })
})
