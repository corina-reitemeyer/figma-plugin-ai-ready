import { h } from 'preact'

import { Issue } from '../shared/types'
import { Button } from './Button'
import { SafeText } from './SafeText'

type ConfirmFixDialogProps = {
  issue: Issue
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmFixDialog({
  issue,
  busy = false,
  onConfirm,
  onCancel
}: ConfirmFixDialogProps) {
  const title =
    issue.autofixId === 'rename-convention'
      ? 'Confirm rename'
      : issue.autofixId === 'bind-inferred'
        ? 'Confirm token bind'
        : 'Confirm fix'

  const detail =
    issue.autofixId === 'rename-convention'
      ? `Rename “${issue.nodeName}” to “${issue.autofixPayload?.suggestedName ?? ''}”.`
      : issue.autofixId === 'bind-inferred'
        ? `Bind ${issue.autofixPayload?.field ?? 'paint'}[${issue.autofixPayload?.paintIndex ?? 0}] on “${issue.nodeName}” to the inferred variable.`
        : issue.fixHint

  return (
    <div
      className="confirm-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-fix-title"
    >
      <h3 id="confirm-fix-title">{title}</h3>
      <p>
        <SafeText value={detail} maxLength={1000} />
      </p>
      <p className="muted">This change can be undone with Figma’s Undo.</p>
      <div className="confirm-actions">
        <Button variant="primary" size="compact" onClick={onConfirm} disabled={busy}>
          {busy ? 'Applying…' : 'Apply fix'}
        </Button>
        <Button variant="secondary" size="compact" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
