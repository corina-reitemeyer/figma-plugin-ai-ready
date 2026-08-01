import { ComponentChildren, h, JSX } from 'preact'
import { useEffect, useId, useRef } from 'preact/hooks'

import { strings } from './strings'

export type ResultsTabId = 'overview' | 'issues' | 'fileContext'

type TabSpec = {
  id: ResultsTabId
  label: string
  panel: ComponentChildren
}

type ResultsTabsProps = {
  tabs: TabSpec[]
  activeTab: ResultsTabId
  onActiveTabChange: (tab: ResultsTabId) => void
}

export function ResultsTabs({
  tabs,
  activeTab,
  onActiveTabChange
}: ResultsTabsProps) {
  const baseId = useId()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])

  useEffect(
    function () {
      if (!tabs.some((tab) => tab.id === activeTab) && tabs[0] !== undefined) {
        onActiveTabChange(tabs[0].id)
      }
    },
    [tabs, activeTab, onActiveTabChange]
  )

  function focusTab(index: number): void {
    tabRefs.current[index]?.focus()
  }

  function onKeyDown(
    event: JSX.TargetedKeyboardEvent<HTMLButtonElement>,
    index: number
  ): void {
    if (tabs.length === 0) {
      return
    }
    let nextIndex = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      nextIndex = (index + 1) % tabs.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      nextIndex = (index - 1 + tabs.length) % tabs.length
    } else if (event.key === 'Home') {
      event.preventDefault()
      nextIndex = 0
    } else if (event.key === 'End') {
      event.preventDefault()
      nextIndex = tabs.length - 1
    } else {
      return
    }
    const tab = tabs[nextIndex]
    if (tab === undefined) {
      return
    }
    onActiveTabChange(tab.id)
    focusTab(nextIndex)
  }

  return (
    <div className="results-tabs">
      <div role="tablist" aria-label={strings.resultsHeading}>
        {tabs.map(function (tab, index) {
          const selected = tab.id === activeTab
          const tabId = `${baseId}-tab-${tab.id}`
          const panelId = `${baseId}-panel-${tab.id}`
          return (
            <button
              key={tab.id}
              id={tabId}
              ref={function (element) {
                tabRefs.current[index] = element
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onClick={function () {
                onActiveTabChange(tab.id)
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
      {tabs.map(function (tab) {
        const selected = tab.id === activeTab
        return (
          <div
            key={tab.id}
            id={`${baseId}-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            hidden={!selected}
          >
            {selected ? tab.panel : null}
          </div>
        )
      })}
    </div>
  )
}
