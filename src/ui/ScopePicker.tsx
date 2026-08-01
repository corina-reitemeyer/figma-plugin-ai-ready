import { h } from 'preact'

import { ScopeKind } from '../shared/types'
import { PageInfo } from '../shared/messages'
import { SafeText } from './SafeText'
import { strings } from './strings'

type ScopePickerProps = {
  scope: ScopeKind
  pages: PageInfo[]
  selectedPageIds: string[]
  disabled?: boolean
  onScopeChange: (scope: ScopeKind) => void
  onPagesChange: (pageIds: string[]) => void
}

const SCOPE_OPTIONS: Array<{ value: ScopeKind; label: string }> = [
  { value: 'file', label: strings.scopeFile },
  { value: 'pages', label: strings.scopePages },
  { value: 'selection', label: strings.scopeSelection }
]

export function ScopePicker({
  scope,
  pages,
  selectedPageIds,
  disabled = false,
  onScopeChange,
  onPagesChange
}: ScopePickerProps) {
  return (
    <div className="scope-picker">
      <label className="scope-select-label" htmlFor="audit-scope">
        <span className="scope-select-caption">{strings.scopeLegend}</span>
        <select
          id="audit-scope"
          className="scope-select"
          value={scope}
          disabled={disabled}
          onChange={function (event) {
            const next = (event.currentTarget as HTMLSelectElement)
              .value as ScopeKind
            onScopeChange(next)
          }}
        >
          {SCOPE_OPTIONS.map(function (option) {
            return (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )
          })}
        </select>
      </label>

      {scope === 'pages' ? (
        <fieldset disabled={disabled} className="pages-fieldset">
          <legend>{strings.pagesLegend}</legend>
          <div className="pages-list">
            {pages.map(function (page) {
              const id = `page-${page.id}`
              const checked = selectedPageIds.includes(page.id)
              return (
                <label
                  key={page.id}
                  className={
                    checked ? 'bf-page-row bf-page-row-selected' : 'bf-page-row'
                  }
                  htmlFor={id}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={function () {
                      if (checked) {
                        onPagesChange(
                          selectedPageIds.filter(function (pageId) {
                            return pageId !== page.id
                          })
                        )
                      } else {
                        onPagesChange(selectedPageIds.concat(page.id))
                      }
                    }}
                  />
                  <SafeText value={page.name} />
                </label>
              )
            })}
          </div>
        </fieldset>
      ) : null}
    </div>
  )
}
