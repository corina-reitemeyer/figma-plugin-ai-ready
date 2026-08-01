/**
 * Visual tokens ported from the AI-Readiness / agent:lint checker UI —
 * Quizlet-style classroom palette with lime brand accent.
 */

export const color = {
  brand: '#a3e635',
  brandHover: '#8fc92a',
  tint: '#f4fbe3',
  mint: '#5fd4a5',
  mintTint: '#d4f7ea',
  ink: '#282e3e',
  muted: '#586380',
  mutedGray: '#6b7289',
  canvas: '#ffffff',
  paperWhite: '#ffffff',
  rule: '#e2e5ec',
  row: '#eef0f6',
  rowHover: '#e2e5ee'
} as const

export const semantic = {
  error: '#c53030',
  errorBg: '#fbe4e1',
  warning: '#ff9725',
  warningBg: '#fff4e3',
  info: color.mutedGray,
  infoBg: color.row,
  good: color.mint,
  goodBg: color.mintTint
} as const

export const font = {
  sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
} as const

export const radius = {
  buttons: 4,
  inputs: 4,
  cards: 8,
  rows: 14,
  badge: 10,
  pills: 200
} as const

export const shadow = {
  sm: 'rgba(40, 46, 62, 0.1) 0px 2px 4px 0px',
  md: 'rgba(40, 46, 62, 0.1) 0px 4px 16px 0px',
  glow: 'rgba(163, 230, 21, 0.35) 0px 4px 18px 0px'
} as const

export const heroBackground =
  `linear-gradient(165deg, ${color.tint} 0%, ${color.mintTint} 42%, ${color.paperWhite} 100%)` as const
