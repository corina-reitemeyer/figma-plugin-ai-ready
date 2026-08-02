import { h } from 'preact'

import {
  AiComponentPreview,
  AiValueKind,
  AiValueRow,
  AiVariantProperty
} from '../../shared/aiView'
import { Button } from '../Button'
import { IconClose, IconEye, IconVariants } from '../Icon'
import { SafeText } from '../SafeText'
import { strings } from '../strings'

export type { AiComponentPreview, AiValueKind, AiValueRow, AiVariantProperty }

/** Sample component for preview harness and a11y tests. */
export const sampleAiComponent: AiComponentPreview = {
  name: 'Button/Primary',
  kindLabel: 'COMPONENT',
  sourceLabel: 'Design System',
  variantProperties: [
    { label: 'Size', value: 'Medium' },
    { label: 'State', value: 'Default' }
  ],
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
  selectionCount?: number
  loading?: boolean
  /** Set when exactly one layer is selected and preview is ready. */
  component?: AiComponentPreview | null
  onViewOnCanvas?: () => void
  onDeselect?: () => void
}

function AiViewSkeleton() {
  return (
    <div
      className="ai-view ai-view-loading"
      role="status"
      aria-busy="true"
      aria-label={strings.aiViewLoading}
    >
      <div className="ai-identity">
        <span className="ai-skeleton ai-skeleton-icon" aria-hidden="true" />
        <div className="ai-identity-body">
          <span className="ai-skeleton ai-skeleton-line ai-skeleton-line-wide" />
          <span className="ai-skeleton ai-skeleton-line ai-skeleton-line-narrow" />
        </div>
      </div>
      <section className="ai-section" aria-hidden="true">
        <span className="ai-skeleton ai-skeleton-title" />
        <div className="ai-row">
          <span className="ai-skeleton ai-skeleton-block" />
        </div>
      </section>
      <section className="ai-section" aria-hidden="true">
        <span className="ai-skeleton ai-skeleton-title" />
        <ul className="ai-row-list">
          <li className="ai-row">
            <span className="ai-skeleton ai-skeleton-block" />
          </li>
          <li className="ai-row">
            <span className="ai-skeleton ai-skeleton-block" />
          </li>
        </ul>
      </section>
      <section className="ai-section" aria-hidden="true">
        <span className="ai-skeleton ai-skeleton-title" />
        <ul className="ai-row-list">
          <li className="ai-row">
            <span className="ai-skeleton ai-skeleton-block" />
          </li>
        </ul>
      </section>
    </div>
  )
}

export function AiView({
  selectionCount = 0,
  loading = false,
  component = null,
  onViewOnCanvas,
  onDeselect
}: AiViewProps) {
  if (selectionCount > 1) {
    return (
      <div className="ai-view ai-view-empty" role="status">
        <span className="ai-empty-icon" aria-hidden="true">
          <IconVariants size={24} />
        </span>
        <p className="ai-empty-title">{strings.aiViewMultiTitle}</p>
        <p className="ai-empty-body">{strings.aiViewMultiBody}</p>
        {onDeselect !== undefined ? (
          <div className="ai-empty-action">
            <Button variant="secondary" size="compact" onClick={onDeselect}>
              {strings.aiViewClearSelection}
            </Button>
          </div>
        ) : null}
      </div>
    )
  }

  if (selectionCount === 1 && loading) {
    return <AiViewSkeleton />
  }

  if (selectionCount !== 1 || component === null) {
    return (
      <div className="ai-view ai-view-empty" role="status">
        <span className="ai-empty-icon" aria-hidden="true">
          <IconVariants size={24} />
        </span>
        <p className="ai-empty-title">{strings.aiViewEmptyTitle}</p>
        <p className="ai-empty-body">{strings.aiViewEmptyBody}</p>
      </div>
    )
  }

  const hasActions =
    onViewOnCanvas !== undefined || onDeselect !== undefined
  const showVariants = component.variantProperties.length > 0

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
        {hasActions ? (
          <div className="ai-identity-actions">
            {onViewOnCanvas !== undefined ? (
              <button
                type="button"
                className="ai-identity-action"
                onClick={onViewOnCanvas}
                aria-label={strings.aiViewLocate}
                title={strings.aiViewLocate}
              >
                <IconEye size={15} />
              </button>
            ) : null}
            {onDeselect !== undefined ? (
              <button
                type="button"
                className="ai-identity-action"
                onClick={onDeselect}
                aria-label={strings.aiViewDeselect}
                title={strings.aiViewDeselect}
              >
                <IconClose size={14} />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {showVariants ? (
        <section className="ai-section" aria-labelledby="ai-variants-heading">
          <h3 id="ai-variants-heading" className="ai-section-title">
            {strings.aiVariantProperties}
          </h3>
          <div className="ai-row">
            <p className="ai-row-text ai-row-inline">
              {component.variantProperties.map(function (property) {
                return (
                  <span key={property.label} className="ai-variant-pair">
                    <span className="ai-variant-label">
                      <SafeText value={property.label} />
                    </span>
                    <span className="ai-variant-value">
                      <SafeText value={property.value} />
                    </span>
                  </span>
                )
              })}
            </p>
          </div>
        </section>
      ) : null}

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
                    row.kind === 'token' ? 'ai-value-token' : 'ai-value-raw'
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
