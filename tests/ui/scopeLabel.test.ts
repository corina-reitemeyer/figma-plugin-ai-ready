import { describe, expect, it } from 'vitest'

import { formatScanScopeLabel } from '../../src/ui/scopeLabel'
import { sampleReport } from '../fixtures/auditReport'

describe('formatScanScopeLabel', () => {
  it('labels selection scans', () => {
    expect(
      formatScanScopeLabel({ ...sampleReport, scope: 'selection' }, 20)
    ).toBe('Selection (20 nodes)')
  })

  it('labels file scans', () => {
    expect(formatScanScopeLabel({ ...sampleReport, scope: 'file' }, 20)).toBe(
      'File (20 nodes)'
    )
  })

  it('labels page scans', () => {
    expect(
      formatScanScopeLabel(
        { ...sampleReport, scope: 'pages', pageIds: ['0:1', '0:2'] },
        1
      )
    ).toBe('2 pages (1 node)')
  })
})
