import { describe, expect, it } from 'vitest'

import { isNonEmptyString, safeText } from '../../src/shared/safeText'

describe('safeText', () => {
  it('returns empty string for non-strings', () => {
    expect(safeText(null)).toBe('')
    expect(safeText(42)).toBe('')
  })

  it('strips control characters and trims', () => {
    expect(safeText('  Button\u0000Primary  ')).toBe('ButtonPrimary')
  })

  it('truncates long values', () => {
    expect(safeText('abcdefghij', 5)).toBe('abcd…')
  })
})

describe('isNonEmptyString', () => {
  it('rejects blank strings', () => {
    expect(isNonEmptyString('')).toBe(false)
    expect(isNonEmptyString('   ')).toBe(false)
    expect(isNonEmptyString('ok')).toBe(true)
  })
})
