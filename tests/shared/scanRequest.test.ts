import { describe, expect, it } from 'vitest'

import { parseScanRequest } from '../../src/shared/messages'
import { CURRENT_PAGE_SENTINEL } from '../../src/shared/types'

describe('parseScanRequest', () => {
  it('parses selection and file scopes', () => {
    expect(parseScanRequest({ scope: 'selection' })).toEqual({
      scope: 'selection'
    })
    expect(parseScanRequest({ scope: 'file' })).toEqual({ scope: 'file' })
  })

  it('parses pages multi-select', () => {
    expect(
      parseScanRequest({
        scope: 'pages',
        pageIds: ['1:1', CURRENT_PAGE_SENTINEL, '']
      })
    ).toEqual({
      scope: 'pages',
      pageIds: ['1:1', CURRENT_PAGE_SENTINEL]
    })
  })

  it('rejects invalid scopes', () => {
    expect(parseScanRequest(null)).toBeNull()
    expect(parseScanRequest({ scope: 'pages' })).toBeNull()
    expect(parseScanRequest({ scope: 'values' })).toBeNull()
  })
})
