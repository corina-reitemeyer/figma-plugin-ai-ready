import { describe, expect, it } from 'vitest'

import {
  CATEGORY_WEIGHTS,
  RULESET_VERSION,
  SEVERITY_WEIGHTS
} from '../../src/config/defaults'
import { RULE_CATEGORIES } from '../../src/shared/types'

describe('defaults', () => {
  it('exposes a ruleset version', () => {
    expect(RULESET_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('weights every v1 category equally', () => {
    const weights = RULE_CATEGORIES.map((category) => CATEGORY_WEIGHTS[category])
    expect(weights.every((weight) => weight === 1)).toBe(true)
  })

  it('orders severity weights error > warning > info', () => {
    expect(SEVERITY_WEIGHTS.error).toBeGreaterThan(SEVERITY_WEIGHTS.warning)
    expect(SEVERITY_WEIGHTS.warning).toBeGreaterThan(SEVERITY_WEIGHTS.info)
  })
})
