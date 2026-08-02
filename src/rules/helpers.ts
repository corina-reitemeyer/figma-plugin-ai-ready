import {
  AutofixId,
  CheckResult,
  FixTier,
  Severity
} from '../shared/types'

export function finding(options: {
  ruleId: string
  node: SceneNode
  message: string
  severity: Severity
  fixHint: string
  fixTier?: FixTier
  autofixId?: AutofixId
  autofixPayload?: CheckResult['autofixPayload']
  na?: boolean
  excludeFromScore?: boolean
}): CheckResult {
  return {
    ruleId: options.ruleId,
    nodeId: options.node.id,
    nodeName: options.node.name,
    message: options.message,
    severity: options.severity,
    fixTier: options.fixTier ?? 'manual',
    autofixId: options.autofixId,
    autofixPayload: options.autofixPayload,
    fixHint: options.fixHint,
    na: options.na,
    excludeFromScore: options.excludeFromScore
  }
}

export function suggestPascalName(name: string): string {
  const cleaned = name
    .replace(/^Copy of\s+/i, '')
    .replace(/[^\w\s/-]+/g, ' ')
    .trim()
  if (cleaned.length === 0) {
    return 'Component'
  }

  return cleaned
    .split(/[\s/_-]+/)
    .filter(Boolean)
    .map(function (part) {
      return part.charAt(0).toUpperCase() + part.slice(1)
    })
    .join('')
}
