import { AuditReport, Issue } from '../../src/shared/types'

export const sampleIssue: Issue = {
  id: 'naming.default-name:1:2',
  ruleId: 'naming.default-name',
  ruleLabel: 'Avoid default component names',
  category: 'naming',
  nodeId: '1:2',
  nodeName: 'Component 1',
  pageId: '0:1',
  pageName: 'Components',
  message: '“Component 1” looks like a default Figma name.',
  severity: 'warning',
  fixTier: 'auto',
  autofixId: 'rename-convention',
  autofixPayload: { suggestedName: 'Button' },
  fixHint: 'Rename to a semantic name such as Button.',
  rationale: 'Agents match components by readable names.',
  consequence: 'Generated code may invent opaque identifiers.'
}

export const sampleReport: AuditReport = {
  scope: 'pages',
  pageIds: ['0:1'],
  scannedAt: '2026-08-01T00:00:00.000Z',
  durationMs: 42,
  rulesetVersion: '1.0.0',
  overallScore: 72,
  band: 'needsWork',
  passedChecks: 10,
  failedChecks: 3,
  naChecks: 1,
  issueCounts: { error: 0, warning: 2, info: 1 },
  categories: [
    {
      category: 'naming',
      score: 60,
      passed: 1,
      failed: 1,
      issueCount: 1,
      naCount: 0
    },
    {
      category: 'tokens',
      score: 80,
      passed: 2,
      failed: 0,
      issueCount: 0,
      naCount: 0
    },
    {
      category: 'variants',
      score: 70,
      passed: 2,
      failed: 1,
      issueCount: 1,
      naCount: 0
    },
    {
      category: 'structure',
      score: 90,
      passed: 3,
      failed: 0,
      issueCount: 0,
      naCount: 0
    },
    {
      category: 'docs',
      score: 50,
      passed: 2,
      failed: 1,
      issueCount: 1,
      naCount: 1
    }
  ],
  issues: [sampleIssue],
  inventory: {
    componentCount: 12,
    componentSetCount: 3,
    frameCount: 8,
    pageCount: 1,
    pages: [
      {
        pageId: '0:1',
        pageName: 'Components',
        componentCount: 12,
        componentSetCount: 3,
        score: 72
      }
    ]
  }
}
