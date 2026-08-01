import { render } from '@testing-library/preact'
import { h } from 'preact'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { ConfirmFixDialog } from '../../src/ui/ConfirmFixDialog'
import { ResultsTabs } from '../../src/ui/ResultsTabs'
import { ScopePicker } from '../../src/ui/ScopePicker'
import { StartScreen } from '../../src/ui/StartScreen'
import { FileContextView } from '../../src/ui/views/FileContextView'
import { IssuesView } from '../../src/ui/views/IssuesView'
import { OverviewView } from '../../src/ui/views/OverviewView'
import { sampleIssue, sampleReport } from '../fixtures/auditReport'

vi.mock('@create-figma-plugin/utilities', () => ({
  emit: vi.fn(),
  on: vi.fn()
}))

/** jsdom has no real stylesheets; skip color-contrast noise. */
const axeOptions = {
  rules: {
    'color-contrast': { enabled: false }
  }
}

describe('UI accessibility', () => {
  it('ScopePicker has no axe violations', async () => {
    const { container } = render(
      <ScopePicker
        scope="pages"
        pages={[
          { id: '0:1', name: 'Components' },
          { id: '0:2', name: 'Foundations' }
        ]}
        selectedPageIds={['0:1']}
        onScopeChange={function () {}}
        onPagesChange={function () {}}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('StartScreen has no axe violations', async () => {
    const { container } = render(
      <StartScreen
        scope="file"
        pages={[
          { id: '0:1', name: 'Components' },
          { id: '0:2', name: 'Foundations' }
        ]}
        selectedPageIds={['0:1']}
        selectionCount={1}
        scanning={false}
        canScan={true}
        progress={null}
        statusOverride=""
        onScopeChange={function () {}}
        onPagesChange={function () {}}
        onScan={function () {}}
        onCancel={function () {}}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('ResultsTabs has no axe violations', async () => {
    const { container } = render(
      <ResultsTabs
        activeTab="overview"
        onActiveTabChange={function () {}}
        tabs={[
          { id: 'overview', label: 'Overview', panel: <p>Overview panel</p> },
          { id: 'issues', label: 'Issues', panel: <p>Issues panel</p> },
          {
            id: 'fileContext',
            label: 'File context',
            panel: <p>File context panel</p>
          }
        ]}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('OverviewView has no axe violations', async () => {
    const { container } = render(
      <OverviewView report={sampleReport} onOpenIssues={function () {}} />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('IssuesView has no axe violations', async () => {
    const { container } = render(
      <IssuesView report={sampleReport} onRequestFix={function () {}} />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('FileContextView has no axe violations', async () => {
    const { container } = render(<FileContextView report={sampleReport} />)
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('ConfirmFixDialog has no axe violations', async () => {
    const { container } = render(
      <ConfirmFixDialog
        issue={sampleIssue}
        onConfirm={function () {}}
        onCancel={function () {}}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })
})
