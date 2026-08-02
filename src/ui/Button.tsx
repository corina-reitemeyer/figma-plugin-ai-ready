import { h } from 'preact'
import type { ComponentChildren } from 'preact'

/** Canonical button roles. Legacy aliases map to these. */
type Variant = 'primary' | 'secondary' | 'tertiary'
type LegacyVariant = 'cta' | 'outline' | 'ghost' | 'dark'
type Size = 'default' | 'compact'

type ButtonProps = {
  children: ComponentChildren
  onClick: () => void
  variant?: Variant | LegacyVariant
  size?: Size
  fullWidth?: boolean
  disabled?: boolean
  title?: string
  icon?: ComponentChildren
  className?: string
}

function resolveVariant(variant: Variant | LegacyVariant): Variant {
  if (variant === 'cta' || variant === 'dark' || variant === 'primary') {
    return 'primary'
  }
  if (variant === 'outline' || variant === 'secondary') {
    return 'secondary'
  }
  return 'tertiary'
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'default',
  fullWidth,
  disabled,
  title,
  icon,
  className
}: ButtonProps) {
  const resolved = resolveVariant(variant)
  const classes = [
    'bf-btn',
    `bf-btn-${resolved}`,
    size === 'compact' ? 'bf-btn-compact' : null,
    fullWidth ? 'bf-btn-full' : null,
    className
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {icon}
      {children}
    </button>
  )
}
