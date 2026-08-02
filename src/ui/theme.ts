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
  mutedGray: '#586380',
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
  /** Score band “poor” — distinct from severity error. */
  poor: '#c2410c',
  info: color.mutedGray,
  infoBg: color.row,
  good: color.mint,
  goodBg: color.mintTint
} as const

export const font = {
  sans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
} as const

export const radius = {
  buttons: 200,
  inputs: 4,
  cards: 8,
  rows: 14,
  badge: 6,
  pills: 200
} as const

/** Plugin type scale — keep UI roles on these steps. */
export const type = {
  display: { size: 36, weight: 700 },
  titleLg: { size: 16, weight: 700 },
  title: { size: 14, weight: 700 },
  section: { size: 13, weight: 700 },
  bodyStrong: { size: 13, weight: 600 },
  body: { size: 12, weight: 400 },
  caption: { size: 11, weight: 500 },
  micro: { size: 10, weight: 700 }
} as const

export const shadow = {
  sm: 'rgba(40, 46, 62, 0.1) 0px 2px 4px 0px',
  md: 'rgba(40, 46, 62, 0.1) 0px 4px 16px 0px',
  glow: 'rgba(163, 230, 21, 0.35) 0px 4px 18px 0px'
} as const

export const heroBackground =
  `linear-gradient(165deg, ${color.tint} 0%, ${color.mintTint} 42%, ${color.paperWhite} 100%)` as const
