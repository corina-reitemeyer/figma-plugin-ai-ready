import { h } from 'preact'

import { SafeText } from './SafeText'

type LiveRegionProps = {
  message: string
  politeness?: 'polite' | 'assertive'
}

export function LiveRegion({
  message,
  politeness = 'polite'
}: LiveRegionProps) {
  return (
    <div
      className="live-region sr-only"
      aria-live={politeness}
      aria-atomic="true"
    >
      <SafeText value={message} />
    </div>
  )
}
