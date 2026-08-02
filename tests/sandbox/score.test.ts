import { describe, expect, it } from 'vitest'

import { scoreAudit } from '../../src/sandbox/score'
import { Issue } from '../../src/shared/types'

function issue(partial: Partial<Issue> & Pick<Issue, 'severity' | 'category'>): Issue {
  return {
    id: 'test:1:1:Problem',
    ruleId: 'test',
    nodeId: '1:1',
    nodeName: 'Button',
    message: 'Problem',
    fixTier: 'manual',
    fixHint: 'Fix it',
    ruleLabel: 'Test',
    rationale: 'Why',
    consequence: 'Impact',
    ...partial
  }
}

describe('scoreAudit', () => {
  it('marks empty applicable checks as unscored (not Good 100)', () => {
    const result = scoreAudit([], [])
    expect(result.scored).toBe(false)
    expect(result.overallScore).toBe(0)
    expect(result.band).toBe('unscored')
    expect(result.passedChecks).toBe(0)
    expect(result.failedChecks).toBe(0)
    for (const category of result.categories) {
      expect(category.applicable).toBe(false)
    }
  })

  it('excludes N/A from failed checks and denominator', () => {
    const result = scoreAudit(
      [
        {
          category: 'docs',
          severity: 'warning',
          passed: false,
          na: true,
          issueCount: 0
        },
        {
          category: 'naming',
          severity: 'error',
          passed: true,
          na: false,
          issueCount: 0
        }
      ],
      []
    )
    expect(result.scored).toBe(true)
    expect(result.naChecks).toBe(1)
    expect(result.passedChecks).toBe(1)
    expect(result.failedChecks).toBe(0)
    expect(result.overallScore).toBe(100)
    expect(result.band).toBe('good')
    const docs = result.categories.find(function (category) {
      return category.category === 'docs'
    })
    expect(docs?.applicable).toBe(false)
    const naming = result.categories.find(function (category) {
      return category.category === 'naming'
    })
    expect(naming?.applicable).toBe(true)
  })

  it('lowers score when error-severity checks fail', () => {
    const issues = [issue({ severity: 'error', category: 'naming' })]
    const result = scoreAudit(
      [
        {
          category: 'naming',
          severity: 'error',
          passed: false,
          na: false,
          issueCount: 1
        }
      ],
      issues
    )
    expect(result.scored).toBe(true)
    expect(result.overallScore).toBe(0)
    expect(result.band).toBe('poor')
    expect(result.issueCounts.error).toBe(1)
  })
})
