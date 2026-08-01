/**
 * Shared audit content model — used by the sandbox engine and the UI.
 * File strings that appear here (nodeName, message, etc.) are untrusted; render as text only.
 */

export type ScopeKind = 'selection' | 'pages' | 'file'

/** What the UI asks the sandbox to audit. */
export type ScopeRequest =
  | { scope: 'selection' }
  | { scope: 'pages'; pageIds: string[] }
  | { scope: 'file' }

/** Sentinel page id: sandbox resolves to `figma.currentPage`. */
export const CURRENT_PAGE_SENTINEL = '__CURRENT__'

export type Severity = 'error' | 'warning' | 'info'

export type RuleCategory =
  | 'naming'
  | 'tokens'
  | 'variants'
  | 'structure'
  | 'docs'
// v2: | 'values' | 'codeConnect'

export type FixTier = 'auto' | 'manual'
// v2: | 'assisted'

export type AutofixId = 'rename-convention' | 'bind-inferred'

export type ScoreBand = 'good' | 'needsWork' | 'poor'

/** Node types rules may target in v1. */
export type AuditNodeType =
  | 'COMPONENT'
  | 'COMPONENT_SET'
  | 'FRAME'
  | 'GROUP'
  | 'INSTANCE'

export type PublishStatusValue =
  | PublishStatus
  | 'NA'

/**
 * Precomputed data shared across rules so they do not redo expensive work.
 */
export interface RuleContext {
  mutedRuleIds: ReadonlySet<string>
  publishStatusByNodeId: ReadonlyMap<string, PublishStatusValue>
}

/**
 * Static rule definition. `rationale` / `consequence` are Waze-style fixed copy
 * (same text for every instance of the rule).
 */
export interface Rule {
  id: string
  label: string
  category: RuleCategory
  targetTypes: readonly AuditNodeType[]
  severity: Severity
  /** When true, user can mute via clientStorage (structural heuristic). */
  mutable: boolean
  rationale: string
  consequence: string
  run: (node: SceneNode, ctx: RuleContext) => CheckResult[]
}

/**
 * One finding from a rule against a specific node (or N/A placeholder).
 */
export interface CheckResult {
  ruleId: string
  nodeId: string
  nodeName: string
  pageId?: string
  pageName?: string
  /** Instance-specific "what's wrong". */
  message: string
  severity: Severity
  fixTier: FixTier
  autofixId?: AutofixId
  /** Extra data for confirmed autofix handlers (UI must still confirm). */
  autofixPayload?: {
    suggestedName?: string
    field?: 'fills' | 'strokes'
    paintIndex?: number
    variableId?: string
  }
  /** Short how-to / what Fix will do. */
  fixHint: string
  /** When true, excluded from score denominator. */
  na?: boolean
}

/**
 * UI-facing issue: a CheckResult plus rule metadata for expanded WAVE copy.
 */
export interface Issue extends CheckResult {
  id: string
  category: RuleCategory
  ruleLabel: string
  rationale: string
  consequence: string
}

export interface CategoryResult {
  category: RuleCategory
  score: number
  passed: number
  failed: number
  issueCount: number
  naCount: number
}

export interface InventoryPageRow {
  pageId: string
  pageName: string
  componentCount: number
  componentSetCount: number
  score: number | null
}

export interface InventorySummary {
  componentCount: number
  componentSetCount: number
  frameCount: number
  pageCount: number
  /** Nodes included in this scan (components, sets, frames, groups, instances). */
  nodeCount: number
  pages: InventoryPageRow[]
  /** Optional v1 taste; full Values scope is v2. */
  variableCount?: number
  unusedVariableCount?: number
}

export interface AuditReport {
  scope: ScopeKind
  /** Empty for selection/file-wide semantics as needed; page ids when pages scope. */
  pageIds: string[]
  scannedAt: string
  durationMs: number
  rulesetVersion: string
  overallScore: number
  band: ScoreBand
  passedChecks: number
  failedChecks: number
  naChecks: number
  issueCounts: {
    error: number
    warning: number
    info: number
  }
  categories: CategoryResult[]
  issues: Issue[]
  inventory: InventorySummary
}

export const RULE_CATEGORIES: readonly RuleCategory[] = [
  'naming',
  'tokens',
  'variants',
  'structure',
  'docs'
] as const

export const SCORE_BAND_LABELS: Record<ScoreBand, string> = {
  good: 'Good',
  needsWork: 'Needs work',
  poor: 'Poor'
}
