import { AutofixRequest } from '../shared/messages'
import { Issue } from '../shared/types'

/** Builds a sandbox autofix payload from an issue, or null if data is incomplete. */
export function issueToAutofixRequest(issue: Issue): AutofixRequest | null {
  if (
    issue.autofixId === 'rename-convention' &&
    issue.autofixPayload?.suggestedName
  ) {
    return {
      autofixId: 'rename-convention',
      nodeId: issue.nodeId,
      suggestedName: issue.autofixPayload.suggestedName
    }
  }

  if (
    issue.autofixId === 'bind-inferred' &&
    issue.autofixPayload?.field !== undefined &&
    issue.autofixPayload.paintIndex !== undefined &&
    issue.autofixPayload.variableId
  ) {
    return {
      autofixId: 'bind-inferred',
      nodeId: issue.nodeId,
      field: issue.autofixPayload.field,
      paintIndex: issue.autofixPayload.paintIndex,
      variableId: issue.autofixPayload.variableId
    }
  }

  return null
}
