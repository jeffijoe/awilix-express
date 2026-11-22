import { describe, it, mock } from 'node:test'
import assert from 'node:assert/strict'
import { scopePerRequest } from '../scope-per-request'
import { createContainer } from 'awilix'
import * as Express from 'express'

describe('scopePerRequest', function () {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', function () {
    const container = createContainer({ strict: true })
    const middleware = scopePerRequest(container)
    const next = mock.fn(() => 42)
    const req = {} as any
    const res = {} as Express.Response
    const result = middleware(req, res, next)
    assert.notStrictEqual(req.container, undefined)
    assert.deepStrictEqual(result, 42)
  })
})
