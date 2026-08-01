import { describe, expect, it } from 'vitest'

import { clampScore, scoreBand } from '../../src/shared/scoreBand'

describe('scoreBand', () => {
  it('maps Lighthouse-like thresholds', () => {
    expect(scoreBand(100)).toBe('good')
    expect(scoreBand(90)).toBe('good')
    expect(scoreBand(89)).toBe('needsWork')
    expect(scoreBand(50)).toBe('needsWork')
    expect(scoreBand(49)).toBe('poor')
    expect(scoreBand(0)).toBe('poor')
  })
})

describe('clampScore', () => {
  it('clamps and rounds', () => {
    expect(clampScore(-10)).toBe(0)
    expect(clampScore(150)).toBe(100)
    expect(clampScore(88.4)).toBe(88)
    expect(clampScore(Number.NaN)).toBe(0)
  })
})
