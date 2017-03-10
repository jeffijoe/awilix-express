const { expect } = require('chai');
const sinon = require('sinon');
const { createContainer } = require('awilix');
const { makeInvoker, makeClassInvoker } = require('../../lib/invokers');

describe('invokers', () => {
  let container,
    methodSpy,
    factorySpy,
    constructorSpy,
    req;

  beforeEach(() => {
    factorySpy = sinon.spy();
    constructorSpy = sinon.spy();
    methodSpy = sinon.spy();
    container = createContainer();
    container.registerValue('param', 42);
    req = { container };
  });

  describe('makeInvoker', () => {
    it('calls the function with the cradle then the method with the req', () => {
      function target({ param }) {
        factorySpy();

        return {
          method(req) {
            methodSpy();
            return [req, param];
          }
        };
      }

      const invoker = makeInvoker(target);

      // Call it twice.
      invoker('method')(req);
      const result = invoker('method')(req);

      expect(result).to.deep.equal([req, 42]);
      expect(factorySpy).to.have.been.calledTwice;
      expect(methodSpy).to.have.been.calledTwice;
    });
  });

  describe('makeClassInvoker', () => {
    it('instantiate class with the cradle then calls the method with the req', () => {
      class Target {
        constructor({ param }) {
          constructorSpy();
          this.param = param;
        }

        method(req, additional) {
          methodSpy();
          return [req, this.param, additional];
        }
      }

      const invoker = makeClassInvoker(Target);

      // Call it twice.
      invoker('method')(req, 'hello');
      const result = invoker('method')(req, 'hello');

      expect(result).to.deep.equal([req, 42, 'hello']);
      expect(constructorSpy).to.have.been.calledTwice;
      expect(methodSpy).to.have.been.calledTwice;
    });
  });
});
