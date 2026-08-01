import { h, JSX } from 'preact'

import { safeText } from '../shared/safeText'

type SafeTextProps = {
  value: unknown
  maxLength?: number
  as?: keyof JSX.IntrinsicElements
  className?: string
}

/**
 * Renders untrusted strings as text only (no HTML parsing).
 */
export function SafeText({
  value,
  maxLength,
  as: Tag = 'span',
  className
}: SafeTextProps) {
  return <Tag className={className}>{safeText(value, maxLength)}</Tag>
}
