import { h } from 'preact'

import { strings } from '../strings'

export function AiView() {
  return (
    <div className="ai-view">
      <p className="muted">{strings.aiViewPlaceholder}</p>
    </div>
  )
}
