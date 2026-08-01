import {
  Button,
  Container,
  Muted,
  render,
  Text,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback } from 'preact/hooks'

import { CloseHandler } from './types'

function Plugin() {
  const handleCloseButtonClick = useCallback(function () {
    emit<CloseHandler>('CLOSE')
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
          Scaffold ready. Next: audit types, rule engine, and the Lighthouse-style
          results UI. This plugin stays offline (no network access).
        </Muted>
      </Text>
      <VerticalSpace space="extraLarge" />
      <Button fullWidth onClick={handleCloseButtonClick} secondary>
        Close
      </Button>
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
