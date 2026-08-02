import { describe, expect, it } from 'vitest'

import {
  formatPaddingGap,
  formatRgbToHex,
  kindLabelFromType,
  sizingModeLabel
} from '../../src/sandbox/aiViewPreview'

describe('aiViewPreview helpers', () => {
  it('kindLabelFromType replaces underscores', () => {
    expect(kindLabelFromType('COMPONENT_SET')).toBe('COMPONENT SET')
    expect(kindLabelFromType('FRAME')).toBe('FRAME')
  })

  it('formatRgbToHex converts 0–1 RGB', () => {
    expect(formatRgbToHex({ r: 37 / 255, g: 99 / 255, b: 235 / 255 })).toBe(
      '#2563EB'
    )
    expect(formatRgbToHex({ r: 1, g: 0, b: 0 }, 0.5)).toBe('#FF0000 @ 50%')
  })

  it('sizingModeLabel keeps known modes', () => {
    expect(sizingModeLabel('HUG')).toBe('HUG')
    expect(sizingModeLabel('FILL')).toBe('FILL')
    expect(sizingModeLabel('FIXED')).toBe('FIXED')
  })

  it('formatPaddingGap collapses symmetric padding', () => {
    expect(formatPaddingGap(8, 8, 8, 8, 4)).toBe('Padding 8 · Gap 4')
    expect(formatPaddingGap(8, 16, 8, 16, 8)).toBe('Padding 8/16 · Gap 8')
    expect(formatPaddingGap(8, 16, 8, 12, 8)).toBe(
      'Padding 8/16/8/12 · Gap 8'
    )
  })
})
