const { expect } = require('chai');
const sinon = require('sinon');
const { createContainer } = require('awilix');
const inject = require('../../lib/inject');

describe('inject', () => {
  it('returns a middleware that creates a scope and attaches it to the request + calls next', () => {
    const container = createContainer();
    const value = 'ABC';
    class Class { }

    container
      .registerValue({ value })
      .registerClass({ instance: Class});

    const middleware = inject('value', 'instance');
    const next = sinon.spy(() => 42);
    const req = { container };
    const res = {};
    const result = middleware(req, res, next);

    expect(req.value).to.equal('ABC');
    expect(req.instance).to.be.instanceOf(Class);
    expect(result).to.equal(42);
  });
});
