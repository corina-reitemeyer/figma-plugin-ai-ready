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
      <fieldset disabled={disabled}>
        <legend>{strings.scopeLegend}</legend>
        {(
          [
            ['selection', strings.scopeSelection],
            ['pages', strings.scopePages],
            ['file', strings.scopeFile]
          ] as const
        ).map(function ([value, label]) {
          const id = `scope-${value}`
          return (
            <label key={value} className="scope-option" htmlFor={id}>
              <input
                id={id}
                type="radio"
                name="audit-scope"
                value={value}
                checked={scope === value}
                onChange={function () {
                  onScopeChange(value)
                }}
              />
              <span>{label}</span>
            </label>
          )
        })}
      </fieldset>

      {scope === 'pages' ? (
        <fieldset disabled={disabled} className="pages-fieldset">
          <legend>{strings.pagesLegend}</legend>
          <div className="pages-list">
            {pages.map(function (page) {
              const id = `page-${page.id}`
              const checked = selectedPageIds.includes(page.id)
              return (
                <label key={page.id} className="page-option" htmlFor={id}>
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
