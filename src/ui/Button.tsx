import { h } from 'preact'
import type { ComponentChildren } from 'preact'

type Variant = 'primary' | 'cta' | 'outline' | 'ghost' | 'dark'

type ButtonProps = {
  children: ComponentChildren
  onClick: () => void
  variant?: Variant
  fullWidth?: boolean
  disabled?: boolean
  title?: string
  icon?: ComponentChildren
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: 'bf-btn bf-btn-primary',
  cta: 'bf-btn bf-btn-cta',
  outline: 'bf-btn bf-btn-outline',
  ghost: 'bf-btn bf-btn-ghost',
  dark: 'bf-btn bf-btn-dark'
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  fullWidth,
  disabled,
  title,
  icon
}: ButtonProps) {
  const isGhost = variant === 'ghost'
  const isCta = variant === 'cta'
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={VARIANT_CLASS[variant]}
      style={{
        width: fullWidth ? '100%' : undefined,
        padding: isGhost ? 0 : isCta ? '14px 20px' : '8px 18px',
        fontSize: isCta ? 15 : 14
      }}
    >
      {icon}
      {children}
    </button>
  )
}
