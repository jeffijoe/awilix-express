const { expect } = require('chai');
const sinon = require('sinon');
const { createContainer } = require('awilix');
const scopePerRequest = require('../../lib/scopePerRequest');

describe('scopePerRequest', () => {
  it('returns a middleware that creates a scope and attaches it to a context + calls next', () => {
    const container = createContainer();
    const middleware = scopePerRequest(container);
    const next = sinon.spy(() => 42);
    const req = {};
    const res = {};
    const result = middleware(req, res, next);
    expect(req.container).to.exist;
    expect(result).to.equal(42);
  });
});
