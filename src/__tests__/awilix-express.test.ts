import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as awilixExpress from '../'

describe('awilix-express', function () {
  it('exists', function () {
    assert.notStrictEqual(awilixExpress, undefined)
    assert.notStrictEqual(awilixExpress.scopePerRequest, undefined)
    assert.notStrictEqual(awilixExpress.makeInvoker, undefined)
    assert.notStrictEqual(awilixExpress.makeClassInvoker, undefined)
  })
})
