import { describe, expect, it } from 'vitest'

import {
  DEFAULT_SCOPE,
  parseScanPreferences,
  resolveSelectedPageIds
} from '../../src/shared/preferences'

describe('preferences', () => {
  it('defaults scope to full file', () => {
    expect(DEFAULT_SCOPE).toBe('file')
  })

  it('parses valid scan preferences', () => {
    expect(
      parseScanPreferences({
        scope: 'pages',
        selectedPageIds: [' 0:1 ', '', 2, '0:2']
      })
    ).toEqual({
      scope: 'pages',
      selectedPageIds: ['0:1', '0:2']
    })
  })

  it('rejects invalid preferences', () => {
    expect(parseScanPreferences(null)).toBeNull()
    expect(parseScanPreferences({ scope: 'values' })).toBeNull()
    expect(parseScanPreferences({ selectedPageIds: [] })).toBeNull()
  })

  it('resolves selected pages to valid ids or current page', () => {
    const pages = [{ id: '0:1' }, { id: '0:2' }]
    expect(resolveSelectedPageIds(['0:2', '9:9'], pages, '0:1')).toEqual([
      '0:2'
    ])
    expect(resolveSelectedPageIds(['9:9'], pages, '0:1')).toEqual(['0:1'])
    expect(resolveSelectedPageIds([], pages, 'missing')).toEqual(['0:1'])
  })
})
