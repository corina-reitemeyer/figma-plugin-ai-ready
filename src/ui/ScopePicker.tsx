import { h, JSX } from 'preact'
import { useId, useRef } from 'preact/hooks'

import { ScopeKind } from '../shared/types'
import { PageInfo } from '../shared/messages'
import { SafeText } from './SafeText'
import { strings } from './strings'

type ScopePickerProps = {
  scope: ScopeKind
  pages: PageInfo[]
  selectedPageIds: string[]
  selectionCount: number
  disabled?: boolean
  onScopeChange: (scope: ScopeKind) => void
  onPagesChange: (pageIds: string[]) => void
}

type ScopeTab = {
  value: ScopeKind
  label: string
  enabled: boolean
}

export function ScopePicker({
  scope,
  pages,
  selectedPageIds,
  selectionCount,
  disabled = false,
  onScopeChange,
  onPagesChange
}: ScopePickerProps) {
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  const tabs: ScopeTab[] = [
    {
      value: 'selection',
      label: strings.scopeTabSelection,
      enabled: selectionCount > 0
    },
    {
      value: 'pages',
      label: strings.scopeTabPage,
      enabled: true
    },
    {
      value: 'file',
      label: strings.scopeTabFile,
      enabled: true
    }
  ]

  function focusTab(index: number): void {
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(
    event: JSX.TargetedKeyboardEvent<HTMLButtonElement>,
    index: number
  ): void {
    if (disabled || tabs.length === 0) {
      return
    }

    const enabledIndexes = tabs
      .map(function (tab, tabIndex) {
        return tab.enabled ? tabIndex : -1
      })
      .filter(function (tabIndex) {
        return tabIndex >= 0
      })

    if (enabledIndexes.length === 0) {
      return
    }

    const position = enabledIndexes.indexOf(index)
    let nextPosition = position === -1 ? 0 : position

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      nextPosition = (nextPosition + 1) % enabledIndexes.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      nextPosition =
        (nextPosition - 1 + enabledIndexes.length) % enabledIndexes.length
    } else if (event.key === 'Home') {
      event.preventDefault()
      nextPosition = 0
    } else if (event.key === 'End') {
      event.preventDefault()
      nextPosition = enabledIndexes.length - 1
    } else {
      return
    }

    const nextIndex = enabledIndexes[nextPosition]
    if (nextIndex === undefined) {
      return
    }
    const nextTab = tabs[nextIndex]
    if (nextTab === undefined) {
      return
    }
    onScopeChange(nextTab.value)
    focusTab(nextIndex)
  }

  return (
    <div className="scope-picker">
      <div className="scope-select-caption" id={`${baseId}-label`}>
        {strings.scopeLegend}
      </div>
      <div
        className="scope-tabs"
        role="tablist"
        aria-labelledby={`${baseId}-label`}
      >
        {tabs.map(function (tab, index) {
          const selected = scope === tab.value
          const tabDisabled = disabled || !tab.enabled
          return (
            <button
              key={tab.value}
              id={`${baseId}-tab-${tab.value}`}
              ref={function (element) {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={
                tab.value === 'pages' ? `${baseId}-panel-pages` : undefined
              }
              aria-disabled={tabDisabled}
              disabled={tabDisabled}
              tabIndex={selected && !tabDisabled ? 0 : -1}
              className={
                selected ? 'scope-tab scope-tab-selected' : 'scope-tab'
              }
              onClick={function () {
                if (!tabDisabled) {
                  onScopeChange(tab.value)
                }
              }}
              onKeyDown={function (event) {
                onKeyDown(event, index)
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {scope === 'pages' ? (
        <div
          id={`${baseId}-panel-pages`}
          role="tabpanel"
          aria-labelledby={`${baseId}-tab-pages`}
        >
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
                      checked
                        ? 'bf-page-row bf-page-row-selected'
                        : 'bf-page-row'
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
        </div>
      ) : null}
    </div>
  )
}
