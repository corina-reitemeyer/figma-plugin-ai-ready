import {
  Button,
  Columns,
  Container,
  Muted,
  render,
  Text,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

import {
  CloseRequestHandler,
  ScanCancelHandler,
  ScanProgressHandler,
  ScanRequestHandler,
  ScanResultHandler
} from './shared/messages'
import { CURRENT_PAGE_SENTINEL } from './shared/types'
import { SafeText } from './ui/SafeText'

function Plugin() {
  const [status, setStatus] = useState(
    'Ready to scan. Rules registry is empty until the next sub-task.'
  )
  const [scanning, setScanning] = useState(false)

  useEffect(function () {
    return on<ScanProgressHandler>('SCAN_PROGRESS', function (progress) {
      setStatus(progress.message)
    })
  }, [])

  useEffect(function () {
    return on<ScanResultHandler>('SCAN_RESULT', function (result) {
      setScanning(false)
      if (result.ok) {
        const { report } = result
        setStatus(
          `Scan complete: score ${report.overallScore} (${report.band}) · ${report.inventory.componentCount} components · ${report.issues.length} issues`
        )
        return
      }
      setStatus(`Scan failed (${result.reason}): ${result.detail}`)
    })
  }, [])

  const handleScanSelection = useCallback(function () {
    setScanning(true)
    setStatus('Starting selection scan…')
    emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'selection' })
  }, [])

  const handleScanCurrentPage = useCallback(function () {
    setScanning(true)
    setStatus('Starting page scan…')
    emit<ScanRequestHandler>('SCAN_REQUEST', {
      scope: 'pages',
      pageIds: [CURRENT_PAGE_SENTINEL]
    })
  }, [])

  const handleScanFile = useCallback(function () {
    setScanning(true)
    setStatus('Starting whole-file scan…')
    emit<ScanRequestHandler>('SCAN_REQUEST', { scope: 'file' })
  }, [])

  const handleCancel = useCallback(function () {
    emit<ScanCancelHandler>('SCAN_CANCEL')
  }, [])

  const handleCloseButtonClick = useCallback(function () {
    emit<CloseRequestHandler>('CLOSE_REQUEST')
  }, [])

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      <Text>
        <strong>Agent-Readiness Checker</strong>
      </Text>
      <VerticalSpace space="small" />
      <Text>
        <Muted>Offline collectors + engine. Pick a scope to scan.</Muted>
      </Text>
      <VerticalSpace space="small" />
      <Text>
        <SafeText value={status} />
      </Text>
      <VerticalSpace space="medium" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleScanSelection} disabled={scanning}>
          Selection
        </Button>
        <Button fullWidth onClick={handleScanCurrentPage} disabled={scanning}>
          Page
        </Button>
        <Button fullWidth onClick={handleScanFile} disabled={scanning}>
          File
        </Button>
      </Columns>
      <VerticalSpace space="small" />
      <Columns space="extraSmall">
        <Button fullWidth onClick={handleCancel} disabled={!scanning} secondary>
          Cancel
        </Button>
        <Button
          fullWidth
          onClick={handleCloseButtonClick}
          secondary
          disabled={scanning}
        >
          Close
        </Button>
      </Columns>
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
