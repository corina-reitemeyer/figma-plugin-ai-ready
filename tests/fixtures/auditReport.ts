import { AuditReport, Issue } from '../../src/shared/types'

const rationale = {
  naming: 'Agents match components by readable names.',
  variants: 'Agents need a complete variant matrix.',
  tokens: 'Bound variables keep design and code in sync.',
  structure: 'Auto Layout and components map cleanly to code structure.',
  docs: 'Descriptions give agents usage context beyond the visual tree.'
} as const

const consequence = {
  naming: 'Generated code may invent opaque identifiers.',
  variants: 'Codegen may omit states or invent props.',
  tokens: 'Hardcoded values drift from the design system.',
  structure: 'Agents may emit brittle absolute positioning.',
  docs: 'Agents guess intent and may generate the wrong API.'
} as const

export const sampleIssue: Issue = {
  id: 'naming.default-name:1:2',
  ruleId: 'naming',
  ruleLabel: 'Clear names',
  category: 'naming',
  nodeId: '1:2',
  nodeName: 'Frame 42',
  pageId: '0:1',
  pageName: 'Design System',
  message: '“Frame 42” is a default or generic name',
  severity: 'warning',
  fixTier: 'auto',
  autofixId: 'rename-convention',
  autofixPayload: { suggestedName: 'Button' },
  fixHint: 'Rename to a semantic name such as Button.',
  rationale: rationale.naming,
  consequence: consequence.naming
}

export const sampleIssues: Issue[] = [
  {
    id: 'variants.missing:2:1',
    ruleId: 'variant-completeness',
    ruleLabel: 'Missing variants',
    category: 'variants',
    nodeId: '2:1',
    nodeName: 'Button',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Missing variant: Size=Large, State=Hover',
    severity: 'error',
    fixTier: 'manual',
    fixHint: 'Add the missing variant combination.',
    rationale: rationale.variants,
    consequence: consequence.variants
  },
  {
    id: 'variants.missing:2:2',
    ruleId: 'variant-completeness',
    ruleLabel: 'Missing variants',
    category: 'variants',
    nodeId: '2:2',
    nodeName: 'Button',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Missing variant: Size=Small, State=Disabled',
    severity: 'error',
    fixTier: 'manual',
    fixHint: 'Add the missing variant combination.',
    rationale: rationale.variants,
    consequence: consequence.variants
  },
  sampleIssue,
  {
    id: 'naming.default-name:1:3',
    ruleId: 'naming',
    ruleLabel: 'Clear names',
    category: 'naming',
    nodeId: '1:3',
    nodeName: 'Copy of Button/Primary',
    pageId: '0:1',
    pageName: 'Design System',
    message: '“Copy of Button/Primary” is a default or generic name',
    severity: 'warning',
    fixTier: 'auto',
    autofixId: 'rename-convention',
    autofixPayload: { suggestedName: 'ButtonPrimary' },
    fixHint: 'Rename to a semantic name.',
    rationale: rationale.naming,
    consequence: consequence.naming
  },
  {
    id: 'token-usage:3:1',
    ruleId: 'token-usage',
    ruleLabel: 'Use variables',
    category: 'tokens',
    nodeId: '3:1',
    nodeName: 'Badge',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Corner radius uses hardcoded 6',
    severity: 'warning',
    fixTier: 'auto',
    autofixId: 'bind-inferred',
    autofixPayload: {
      field: 'fills',
      paintIndex: 0,
      variableId: 'VariableID:1:1'
    },
    fixHint: 'Bind the value to the matching variable.',
    rationale: rationale.tokens,
    consequence: consequence.tokens
  },
  {
    id: 'token-usage:3:2',
    ruleId: 'token-usage',
    ruleLabel: 'Use variables',
    category: 'tokens',
    nodeId: '3:2',
    nodeName: 'Card',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Auto Layout spacing uses hardcoded 12 — match spacing/md',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Replace hardcoded spacing with a spacing variable.',
    rationale: rationale.tokens,
    consequence: consequence.tokens
  },
  {
    id: 'token-usage:3:3',
    ruleId: 'token-usage',
    ruleLabel: 'Use variables',
    category: 'tokens',
    nodeId: '3:3',
    nodeName: 'Nav/Item',
    pageId: '0:2',
    pageName: 'Marketing Site',
    message: 'Stroke uses hardcoded #E5E7EB',
    severity: 'warning',
    fixTier: 'auto',
    autofixId: 'bind-inferred',
    autofixPayload: {
      field: 'strokes',
      paintIndex: 0,
      variableId: 'VariableID:1:2'
    },
    fixHint: 'Bind the stroke to the matching color variable.',
    rationale: rationale.tokens,
    consequence: consequence.tokens
  },
  {
    id: 'auto-layout-usage:4:1',
    ruleId: 'auto-layout-usage',
    ruleLabel: 'Auto Layout',
    category: 'structure',
    nodeId: '4:1',
    nodeName: 'Header',
    pageId: '0:2',
    pageName: 'Marketing Site',
    message:
      '“Header” positions 4 children absolutely instead of using Auto Layout',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Apply Auto Layout so spacing and structure are explicit.',
    rationale: rationale.structure,
    consequence: consequence.structure
  },
  {
    id: 'publish-status:5:1',
    ruleId: 'publish-status',
    ruleLabel: 'Publish status',
    category: 'docs',
    nodeId: '5:1',
    nodeName: 'Button/Primary',
    pageId: '0:1',
    pageName: 'Design System',
    message:
      '“Button/Primary” has unpublished changes — the library is out of date',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Publish the library so consumers see the latest component.',
    rationale: rationale.docs,
    consequence: consequence.docs
  },
  {
    id: 'token-usage:3:4',
    ruleId: 'token-usage',
    ruleLabel: 'Use variables',
    category: 'tokens',
    nodeId: '3:4',
    nodeName: 'Notification dot',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Text matches the “Body/Regular” style but isn’t linked',
    severity: 'info',
    fixTier: 'manual',
    fixHint: 'Apply the matching text style.',
    rationale: rationale.tokens,
    consequence: consequence.tokens
  },
  {
    id: 'variants.missing:2:3',
    ruleId: 'variant-completeness',
    ruleLabel: 'Hover & disabled states',
    category: 'variants',
    nodeId: '2:3',
    nodeName: 'Button',
    pageId: '0:1',
    pageName: 'Design System',
    message: '“State” property on “Button” has no “Disabled” value',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Add Hover and Disabled state variants.',
    rationale: rationale.variants,
    consequence: consequence.variants
  },
  {
    id: 'description-present:6:1',
    ruleId: 'description-present',
    ruleLabel: 'Component description',
    category: 'docs',
    nodeId: '6:1',
    nodeName: 'Card',
    pageId: '0:1',
    pageName: 'Design System',
    message: '“Card” has no description',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Add a short description covering purpose and key props.',
    rationale: rationale.docs,
    consequence: consequence.docs
  },
  {
    id: 'description-present:6:2',
    ruleId: 'description-present',
    ruleLabel: 'Component description',
    category: 'docs',
    nodeId: '6:2',
    nodeName: 'Badge',
    pageId: '0:1',
    pageName: 'Design System',
    message: '“Badge” has no description',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Add a short description covering purpose and key props.',
    rationale: rationale.docs,
    consequence: consequence.docs
  },
  {
    id: 'structural-heuristic:7:1',
    ruleId: 'structural-heuristic',
    ruleLabel: 'Looks like a component',
    category: 'structure',
    nodeId: '7:1',
    nodeName: 'Modal Wrapper',
    pageId: '0:2',
    pageName: 'Marketing Site',
    message: '“Modal Wrapper” matches 2 other frame(s) in shape and naming',
    severity: 'info',
    fixTier: 'manual',
    fixHint: 'Create a component and replace duplicate frames with instances.',
    rationale: rationale.structure,
    consequence: consequence.structure
  },
  {
    id: 'structural-heuristic:7:2',
    ruleId: 'structural-heuristic',
    ruleLabel: 'Looks like a component',
    category: 'structure',
    nodeId: '7:2',
    nodeName: 'Modal Wrapper',
    pageId: '0:2',
    pageName: 'Marketing Site',
    message: '“Modal Wrapper” matches 2 other frame(s) in shape and naming',
    severity: 'info',
    fixTier: 'manual',
    fixHint: 'Create a component and replace duplicate frames with instances.',
    rationale: rationale.structure,
    consequence: consequence.structure
  },
  {
    id: 'naming.property:1:4',
    ruleId: 'naming',
    ruleLabel: 'Clear names',
    category: 'naming',
    nodeId: '1:4',
    nodeName: 'Card',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Property “Property 1” on Card has a default name',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Rename the property to a semantic label.',
    rationale: rationale.naming,
    consequence: consequence.naming
  },
  {
    id: 'auto-layout-usage:4:2',
    ruleId: 'auto-layout-usage',
    ruleLabel: 'Auto Layout',
    category: 'structure',
    nodeId: '4:2',
    nodeName: 'Footer',
    pageId: '0:2',
    pageName: 'Marketing Site',
    message: 'Top-level component frame uses absolute positioning (no Auto Layout)',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Apply Auto Layout (horizontal/vertical).',
    rationale: rationale.structure,
    consequence: consequence.structure
  },
  {
    id: 'publish-status:5:2',
    ruleId: 'publish-status',
    ruleLabel: 'Publish status',
    category: 'docs',
    nodeId: '5:2',
    nodeName: 'Input/Text',
    pageId: '0:1',
    pageName: 'Design System',
    message: '“Input/Text” has unpublished changes',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Publish the library update.',
    rationale: rationale.docs,
    consequence: consequence.docs
  },
  {
    id: 'description-present:6:3',
    ruleId: 'description-present',
    ruleLabel: 'Component description',
    category: 'docs',
    nodeId: '6:3',
    nodeName: 'Avatar',
    pageId: '0:1',
    pageName: 'Design System',
    message: '“Avatar” has no description',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Add a short description covering purpose and key props.',
    rationale: rationale.docs,
    consequence: consequence.docs
  },
  {
    id: 'token-usage:3:5',
    ruleId: 'token-usage',
    ruleLabel: 'Use variables',
    category: 'tokens',
    nodeId: '3:5',
    nodeName: 'Chip',
    pageId: '0:1',
    pageName: 'Design System',
    message: 'Fill uses hardcoded #F3F4F6',
    severity: 'warning',
    fixTier: 'manual',
    fixHint: 'Bind the fill to the matching color variable.',
    rationale: rationale.tokens,
    consequence: consequence.tokens
  }
]

export const sampleReport: AuditReport = {
  scope: 'selection',
  pageIds: [],
  scannedAt: new Date().toISOString(),
  durationMs: 480,
  rulesetVersion: '1.0.0',
  overallScore: 69,
  band: 'needsWork',
  passedChecks: 54,
  failedChecks: 20,
  naChecks: 1,
  issueCounts: { error: 2, warning: 15, info: 3 },
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
      issueCount: 5,
      naCount: 0
    },
    {
      category: 'variants',
      score: 38,
      passed: 4,
      failed: 6,
      issueCount: 3,
      naCount: 0
    },
    {
      category: 'structure',
      score: 91,
      passed: 14,
      failed: 1,
      issueCount: 4,
      naCount: 0
    },
    {
      category: 'docs',
      score: 55,
      passed: 8,
      failed: 5,
      issueCount: 5,
      naCount: 1
    }
  ],
  issues: sampleIssues,
  inventory: {
    componentCount: 11,
    componentSetCount: 3,
    frameCount: 8,
    pageCount: 2,
    nodeCount: 20,
    unusedVariableCount: 4,
    variableCount: 12,
    unusedVariables: [
      {
        id: 'VariableID:9:1',
        name: 'color/legacy/brand-blue',
        collectionName: 'Primitives',
        resolvedType: 'COLOR'
      },
      {
        id: 'VariableID:9:2',
        name: 'space/xxl',
        collectionName: 'Spacing',
        resolvedType: 'FLOAT'
      },
      {
        id: 'VariableID:9:3',
        name: 'radius/pill-old',
        collectionName: 'Primitives',
        resolvedType: 'FLOAT'
      },
      {
        id: 'VariableID:9:4',
        name: 'opacity/disabled-alt',
        collectionName: 'Primitives',
        resolvedType: 'FLOAT'
      }
    ],
    pages: [
      {
        pageId: '0:1',
        pageName: 'Design System',
        componentCount: 9,
        componentSetCount: 2,
        score: 72
      },
      {
        pageId: '0:2',
        pageName: 'Marketing Site',
        componentCount: 6,
        componentSetCount: 1,
        score: 61
      }
    ]
  }
}
