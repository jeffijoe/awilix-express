import { scopePerRequest } from '../scope-per-request'
import { createContainer } from 'awilix'
import * as Express from 'express'

describe('scopePerRequest', function() {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', function() {
    const container = createContainer()
    const middleware = scopePerRequest(container)
    const next = jest.fn(() => 42)
    const req = {} as any
    const res = {} as Express.Response
    const result = middleware(req, res, next)
    expect(req.container).toBeDefined()
    expect(result).toEqual(42)
  })
})
