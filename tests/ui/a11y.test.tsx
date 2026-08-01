import { render } from '@testing-library/preact'
import { h } from 'preact'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

import { ConfirmFixDialog } from '../../src/ui/ConfirmFixDialog'
import { ResultsTabs } from '../../src/ui/ResultsTabs'
import { StartScreen } from '../../src/ui/StartScreen'
import { AiView, sampleAiComponent } from '../../src/ui/views/AiView'
import { FileContextView } from '../../src/ui/views/FileContextView'
import { FixAllView } from '../../src/ui/views/FixAllView'
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
  it('StartScreen has no axe violations', async () => {
    const { container } = render(
      <StartScreen
        selectionCount={1}
        primaryName="Button"
        scanning={false}
        canScan={true}
        progress={null}
        statusOverride=""
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
          { id: 'aiView', label: 'AI view', panel: <p>AI view panel</p> },
          {
            id: 'fileContext',
            label: 'File',
            panel: <p>File panel</p>
          }
        ]}
        onRefresh={function () {}}
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
      <IssuesView
        report={sampleReport}
        onRequestFix={function () {}}
        onRequestFixAll={function () {}}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('FixAllView has no axe violations', async () => {
    const { container } = render(
      <FixAllView
        items={[
          { issue: sampleIssue, status: 'done' },
          {
            issue: sampleReport.issues.find(function (issue) {
              return issue.fixTier === 'auto' && issue.id !== sampleIssue.id
            })!,
            status: 'running'
          }
        ]}
        phase="applying"
        onBack={function () {}}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('AiView empty state has no axe violations', async () => {
    const { container } = render(
      <AiView selectionCount={0} component={null} />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('AiView multi-select state has no axe violations', async () => {
    const { container } = render(
      <AiView
        selectionCount={3}
        component={null}
        onDeselect={function () {}}
      />
    )
    expect(await axe(container, axeOptions)).toHaveNoViolations()
  })

  it('AiView with component has no axe violations', async () => {
    const { container } = render(
      <AiView
        selectionCount={1}
        component={sampleAiComponent}
        onViewOnCanvas={function () {}}
        onDeselect={function () {}}
      />
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
