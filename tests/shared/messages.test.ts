import { describe, expect, it } from 'vitest'

import {
  parseAutofixRequest,
  parseSelectNodeRequest
} from '../../src/shared/messages'

describe('parseSelectNodeRequest', () => {
  it('accepts a valid payload', () => {
    expect(parseSelectNodeRequest({ nodeId: ' 1:2 ' })).toEqual({
      nodeId: '1:2'
    })
  })

  it('rejects invalid payloads', () => {
    expect(parseSelectNodeRequest(null)).toBeNull()
    expect(parseSelectNodeRequest({})).toBeNull()
    expect(parseSelectNodeRequest({ nodeId: '' })).toBeNull()
    expect(parseSelectNodeRequest({ nodeId: 1 })).toBeNull()
  })
})

describe('parseAutofixRequest', () => {
  it('accepts rename-convention', () => {
    expect(
      parseAutofixRequest({
        autofixId: 'rename-convention',
        nodeId: '1:2',
        suggestedName: 'Button'
      })
    ).toEqual({
      autofixId: 'rename-convention',
      nodeId: '1:2',
      suggestedName: 'Button'
    })
  })

  it('accepts bind-inferred', () => {
    expect(
      parseAutofixRequest({
        autofixId: 'bind-inferred',
        nodeId: '1:2',
        field: 'fills',
        paintIndex: 0,
        variableId: 'VariableID:1'
      })
    ).toEqual({
      autofixId: 'bind-inferred',
      nodeId: '1:2',
      field: 'fills',
      paintIndex: 0,
      variableId: 'VariableID:1'
    })
  })

  it('rejects malformed autofix payloads', () => {
    expect(
      parseAutofixRequest({
        autofixId: 'rename-convention',
        nodeId: '1:2'
      })
    ).toBeNull()
    expect(
      parseAutofixRequest({
        autofixId: 'bind-inferred',
        nodeId: '1:2',
        field: 'fills',
        paintIndex: -1,
        variableId: 'VariableID:1'
      })
    ).toBeNull()
    expect(
      parseAutofixRequest({
        autofixId: 'nope',
        nodeId: '1:2'
      })
    ).toBeNull()
  })
})
