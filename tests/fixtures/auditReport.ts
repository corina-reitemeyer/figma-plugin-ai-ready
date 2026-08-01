import { AuditReport, Issue } from '../../src/shared/types'

export const sampleIssue: Issue = {
  id: 'naming.default-name:1:2',
  ruleId: 'naming.default-name',
  ruleLabel: 'Clear names',
  category: 'naming',
  nodeId: '1:2',
  nodeName: 'Frame 42',
  pageId: '0:1',
  pageName: 'Components',
  message: '“Frame 42” is a default or generic name',
  severity: 'warning',
  fixTier: 'auto',
  autofixId: 'rename-convention',
  autofixPayload: { suggestedName: 'Button' },
  fixHint: 'Rename to a semantic name such as Button.',
  rationale: 'Agents match components by readable names.',
  consequence: 'Generated code may invent opaque identifiers.'
}

export const sampleIssues: Issue[] = [
  {
    id: 'variants.missing:2:1',
    ruleId: 'variants.completeness',
    ruleLabel: 'Missing variants',
    category: 'variants',
    nodeId: '2:1',
    nodeName: 'Button',
    pageId: '0:1',
    pageName: 'Components',
    message: 'Missing variant: Size=Large, State=Hover',
    severity: 'error',
    fixTier: 'manual',
    fixHint: 'Add the missing variant combination.',
    rationale: 'Agents need a complete variant matrix.',
    consequence: 'Codegen may omit states or invent props.'
  },
  {
    id: 'variants.missing:2:2',
    ruleId: 'variants.completeness',
    ruleLabel: 'Missing variants',
    category: 'variants',
    nodeId: '2:2',
    nodeName: 'Button',
    pageId: '0:1',
    pageName: 'Components',
    message: 'Missing variant: Size=Small, State=Disabled',
    severity: 'error',
    fixTier: 'manual',
    fixHint: 'Add the missing variant combination.',
    rationale: 'Agents need a complete variant matrix.',
    consequence: 'Codegen may omit states or invent props.'
  },
  sampleIssue,
  {
    id: 'naming.default-name:1:3',
    ruleId: 'naming.default-name',
    ruleLabel: 'Clear names',
    category: 'naming',
    nodeId: '1:3',
    nodeName: 'Copy of Button/Primary',
    pageId: '0:1',
    pageName: 'Components',
    message: '“Copy of Button/Primary” is a default or generic name',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Rename to a semantic name.',
    rationale: 'Agents match components by readable names.',
    consequence: 'Generated code may invent opaque identifiers.'
  },
  {
    id: 'naming.property:1:4',
    ruleId: 'naming.property',
    ruleLabel: 'Clear names',
    category: 'naming',
    nodeId: '1:4',
    nodeName: 'Card',
    pageId: '0:1',
    pageName: 'Components',
    message: 'Property “Property 1” on Card has a default name',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Rename the property to a semantic label.',
    rationale: 'Agents match properties by readable names.',
    consequence: 'Generated props may be opaque.'
  }
]

export const sampleReport: AuditReport = {
  scope: 'selection',
  pageIds: [],
  scannedAt: new Date().toISOString(),
  durationMs: 42,
  rulesetVersion: '1.0.0',
  overallScore: 69,
  band: 'needsWork',
  passedChecks: 54,
  failedChecks: 20,
  naChecks: 1,
  issueCounts: { error: 2, warning: 18, info: 0 },
  categories: [
    {
      category: 'naming',
      score: 95,
      passed: 12,
      failed: 1,
      issueCount: 3,
      naCount: 0
    },
    {
      category: 'tokens',
      score: 68,
      passed: 10,
      failed: 4,
      issueCount: 4,
      naCount: 0
    },
    {
      category: 'variants',
      score: 38,
      passed: 4,
      failed: 6,
      issueCount: 2,
      naCount: 0
    },
    {
      category: 'structure',
      score: 91,
      passed: 14,
      failed: 1,
      issueCount: 0,
      naCount: 0
    },
    {
      category: 'docs',
      score: 55,
      passed: 8,
      failed: 5,
      issueCount: 1,
      naCount: 1
    }
  ],
  issues: sampleIssues,
  inventory: {
    componentCount: 11,
    componentSetCount: 3,
    frameCount: 8,
    pageCount: 1,
    nodeCount: 3,
    unusedVariableCount: 4,
    variableCount: 12,
    pages: [
      {
        pageId: '0:1',
        pageName: 'Components',
        componentCount: 11,
        componentSetCount: 3,
        score: 69
      }
    ]
  }
}
