/**
 * Normalize untrusted file-derived strings for UI display.
 * Always render the result as text nodes — never as HTML.
 */

const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g

export function safeText(value: unknown, maxLength = 500): string {
  if (typeof value !== 'string') {
    return ''
  }

  const normalized = value.replace(CONTROL_CHARS, '').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}
