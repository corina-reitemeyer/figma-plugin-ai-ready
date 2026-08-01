import { h } from 'preact'
import type { ComponentChildren } from 'preact'

type IconProps = {
  size?: number
  color?: string
  strokeWidth?: number
}

function Svg({
  size = 16,
  color = 'currentColor',
  strokeWidth = 2,
  fill = 'none',
  children
}: IconProps & { fill?: string; children: ComponentChildren }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      stroke-width={strokeWidth}
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  )
}

export function IconSearch(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 21 21" />
    </Svg>
  )
}

export function IconSparkles(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 13.4 8.6 18.5 10 13.4 11.4 12 16.5 10.6 11.4 5.5 10 10.6 8.6Z" />
      <path d="M18.5 15.5 19.2 17.8 21.5 18.5 19.2 19.2 18.5 21.5 17.8 19.2 15.5 18.5 17.8 17.8Z" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M5 12.5 10 17.5 19 7" />
    </Svg>
  )
}

export function IconRefresh(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M21 12a9 9 0 1 1-2.6-6.3" />
      <path d="M21 4v5h-5" />
    </Svg>
  )
}

export function IconChevronRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  )
}

export function IconClose(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </Svg>
  )
}

export function IconEye(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </Svg>
  )
}

/** Flat-top hexagon with a solid center dot (variables / tokens). */
export function IconHexagon(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={props.strokeWidth ?? 2.25}>
      <path d="M7 3.75h10l4.5 8.25L17 20.25H7L2.5 12Z" />
      <circle cx="12" cy="12" r="1.75" fill="currentColor" stroke="none" />
    </Svg>
  )
}

/** Rounded hash mark (naming). */
export function IconHash(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={props.strokeWidth ?? 2.25}>
      <path d="M9.25 4.5 7.5 19.5" />
      <path d="M16.5 4.5 14.75 19.5" />
      <path d="M5 9.25h14.5" />
      <path d="M4.25 14.75h14.5" />
    </Svg>
  )
}

/** Four squares rotated 45° into a diamond cluster (variants). */
export function IconVariants({
  size = 18,
  color = 'currentColor'
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <g fill={color} transform="rotate(45 12 12)">
        <rect x="5" y="5" width="6.25" height="6.25" rx="0.5" />
        <rect x="12.75" y="5" width="6.25" height="6.25" rx="0.5" />
        <rect x="5" y="12.75" width="6.25" height="6.25" rx="0.5" />
        <rect x="12.75" y="12.75" width="6.25" height="6.25" rx="0.5" />
      </g>
    </svg>
  )
}

/** Nested layout frames (structure / Auto Layout). */
export function IconLayout(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={props.strokeWidth ?? 2}>
      <rect x="3.5" y="4" width="17" height="16" rx="2" />
      <path d="M3.5 10h17" />
      <path d="M10 10v10" />
    </Svg>
  )
}

/** Document / description (docs). */
export function IconDoc(props: IconProps) {
  return (
    <Svg {...props} strokeWidth={props.strokeWidth ?? 2}>
      <path d="M7 3.5h7.5L19.5 8.5V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 12.5h6" />
      <path d="M9 16h4" />
    </Svg>
  )
}
