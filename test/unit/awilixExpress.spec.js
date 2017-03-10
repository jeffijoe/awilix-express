const { expect } = require('chai');
const awilixExpress = require('../../lib/awilix-express');

describe('awilixExpress', () => {
  it('exists', () => {
    expect(awilixExpress).to.exist;
    expect(awilixExpress.scopePerRequest).to.exist.and.to.be.a.Function;
    expect(awilixExpress.makeInvoker).to.exist.and.to.be.a.Function;
    expect(awilixExpress.makeClassInvoker).to.exist.and.to.be.a.Function;
  });
});
