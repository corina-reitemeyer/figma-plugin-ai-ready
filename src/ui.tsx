import {
  Button,
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
  AutofixResult,
  AutofixResultHandler,
  CloseRequestHandler,
  SelectNodeResult,
  SelectNodeResultHandler
} from './shared/messages'
import { SafeText } from './ui/SafeText'

function Plugin() {
  const [status, setStatus] = useState(
    'Handlers ready: select/zoom + confirmed autofix (sandbox-validated).'
  )

  useEffect(function () {
    return on<SelectNodeResultHandler>('SELECT_NODE_RESULT', function (result) {
      setStatus(formatSelectResult(result))
    })
  }, [])

  useEffect(function () {
    return on<AutofixResultHandler>('AUTOFIX_RESULT', function (result) {
      setStatus(formatAutofixResult(result))
    })
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
        <Muted>
          Offline plugin shell. File-derived strings render via SafeText only.
        </Muted>
      </Text>
      <VerticalSpace space="small" />
      <Text>
        <SafeText value={status} />
      </Text>
      <VerticalSpace space="extraLarge" />
      <Button fullWidth onClick={handleCloseButtonClick} secondary>
        Close
      </Button>
      <VerticalSpace space="small" />
    </Container>
  )
}

function formatSelectResult(result: SelectNodeResult): string {
  if (result.ok) {
    return `Selected “${result.nodeName}” on canvas.`
  }
  return `Select failed (${result.reason}).`
}

function formatAutofixResult(result: AutofixResult): string {
  if (result.ok) {
    return result.detail
  }
  return `Autofix failed (${result.reason}): ${result.detail}`
}

export default render(Plugin)
