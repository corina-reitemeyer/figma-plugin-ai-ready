import { describe, expect, it } from 'vitest'

import { scoreAudit } from '../../src/sandbox/score'
import { Issue } from '../../src/shared/types'

function issue(partial: Partial<Issue> & Pick<Issue, 'severity' | 'category'>): Issue {
  return {
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
  it('returns 100 with no applicable checks', () => {
    const result = scoreAudit([], [])
    expect(result.overallScore).toBe(100)
    expect(result.band).toBe('good')
    expect(result.passedChecks).toBe(0)
    expect(result.failedChecks).toBe(0)
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
    expect(result.naChecks).toBe(1)
    expect(result.passedChecks).toBe(1)
    expect(result.failedChecks).toBe(0)
    expect(result.overallScore).toBe(100)
  })

  it('lowers score when error-severity checks fail', () => {
    const issues = [
      issue({ severity: 'error', category: 'naming' })
    ]
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
    expect(result.overallScore).toBe(0)
    expect(result.band).toBe('poor')
    expect(result.issueCounts.error).toBe(1)
  })
})
