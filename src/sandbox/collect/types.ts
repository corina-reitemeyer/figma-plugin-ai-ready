import { AuditNodeType, ScopeKind, ScopeRequest } from '../../shared/types'

export type { ScopeRequest }

export const COLLECT_NODE_TYPES: readonly AuditNodeType[] = [
  'COMPONENT',
  'COMPONENT_SET',
  'FRAME',
  'GROUP'
] as const

export type AuditTarget = {
  node: SceneNode
  nodeId: string
  nodeName: string
  nodeType: AuditNodeType
  pageId: string
  pageName: string
}

export type CollectProgress = {
  phase: 'loading' | 'scanning'
  current: number
  total: number
  pageName?: string
  message: string
}

export type CollectResult = {
  scope: ScopeKind
  pageIds: string[]
  targets: AuditTarget[]
  cancelled: boolean
}

export type ProgressCallback = (progress: CollectProgress) => void

/** Soft warning threshold for whole-file / multi-page scans. */
export const LARGE_TARGET_WARNING = 500
