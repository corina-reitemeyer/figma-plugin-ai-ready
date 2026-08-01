import { h } from 'preact'

import { IconVariants } from '../Icon'
import { SafeText } from '../SafeText'
import { strings } from '../strings'

export type AiValueKind = 'raw' | 'token'

export type AiValueRow = {
  label: string
  value: string
  kind: AiValueKind
}

export type AiComponentPreview = {
  name: string
  kindLabel: string
  sourceLabel: string
  variantProperties: string[]
  layout: string[]
  values: AiValueRow[]
  description: string
}

/** Sample component matching the AI view draft for preview / empty state. */
export const sampleAiComponent: AiComponentPreview = {
  name: 'Button/Primary',
  kindLabel: 'COMPONENT',
  sourceLabel: 'Design System',
  variantProperties: ['Size: Medium', 'State: Default'],
  layout: [
    'HORIZONTAL Auto Layout · 2 children',
    'Sizing: HUG (horizontal) × HUG (vertical)',
    'Padding 8/16/8/16 · Gap 8'
  ],
  values: [
    { label: 'Fill', value: '#2563EB (not linked)', kind: 'raw' },
    { label: 'Corner radius', value: 'radius/md', kind: 'token' },
    { label: 'Auto Layout spacing', value: 'space/sm', kind: 'token' }
  ],
  description:
    'Primary call-to-action button. Use for the single most important action on a screen.'
}

type AiViewProps = {
  component?: AiComponentPreview
}

export function AiView({ component = sampleAiComponent }: AiViewProps) {
  return (
    <div className="ai-view">
      <div className="ai-identity">
        <span className="ai-identity-icon" aria-hidden="true">
          <IconVariants size={18} />
        </span>
        <div className="ai-identity-body">
          <p className="ai-identity-name">
            <SafeText value={component.name} />
          </p>
          <p className="ai-identity-meta">
            <span className="ai-identity-kind">
              <SafeText value={component.kindLabel} />
            </span>
            {' · '}
            <SafeText value={component.sourceLabel} />
          </p>
        </div>
      </div>

      <section className="ai-section" aria-labelledby="ai-variants-heading">
        <h3 id="ai-variants-heading" className="ai-section-title">
          {strings.aiVariantProperties}
        </h3>
        <div className="ai-row">
          <p className="ai-row-text ai-row-inline">
            {component.variantProperties.map(function (property) {
              return (
                <span key={property}>
                  <SafeText value={property} />
                </span>
              )
            })}
          </p>
        </div>
      </section>

      <section className="ai-section" aria-labelledby="ai-layout-heading">
        <h3 id="ai-layout-heading" className="ai-section-title">
          {strings.aiLayout}
        </h3>
        <ul className="ai-row-list">
          {component.layout.map(function (line) {
            return (
              <li key={line} className="ai-row">
                <p className="ai-row-text">
                  <SafeText value={line} />
                </p>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="ai-section" aria-labelledby="ai-values-heading">
        <h3 id="ai-values-heading" className="ai-section-title">
          {strings.aiValuesHeading}
        </h3>
        <ul className="ai-row-list">
          {component.values.map(function (row) {
            return (
              <li key={row.label} className="ai-row ai-value-row">
                <span className="ai-value-label">
                  <SafeText value={row.label} />
                </span>
                <span
                  className={
                    row.kind === 'token'
                      ? 'ai-value-token'
                      : 'ai-value-raw'
                  }
                >
                  {row.kind === 'token' ? (
                    <span aria-hidden="true">→ </span>
                  ) : null}
                  <SafeText value={row.value} />
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="ai-section" aria-labelledby="ai-description-heading">
        <h3 id="ai-description-heading" className="ai-section-title">
          {strings.aiDescription}
        </h3>
        <div className="ai-row">
          <p className="ai-row-text ai-description">
            <SafeText value={component.description} />
          </p>
        </div>
      </section>
    </div>
  )
}
