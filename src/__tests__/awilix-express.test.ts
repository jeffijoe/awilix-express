import * as awilixExpress from '../'

describe('awilix-express', function() {
  it('exists', function() {
    expect(awilixExpress).toBeDefined()
    expect(awilixExpress.scopePerRequest).toBeDefined()
    expect(awilixExpress.makeInvoker).toBeDefined()
    expect(awilixExpress.makeClassInvoker).toBeDefined()
  })
})
