/* eslint-disable no-unused-vars */

const { expect } = require('chai');
const sinon = require('sinon');
const Express = require('express');
const { Router } = Express;
const { createContainer, asClass } = require('awilix');
const AssertRequest = require('assert-request');
const { scopePerRequest, makeInvoker, makeClassInvoker } = require('../../lib/awilix-express');

class TestService {
  constructor({ serviceConstructor }) { }
}

class TestClass {
  constructor({ testClassConstructor, testService }) {
  }

  handle(req, res) {
    res.send({ success: true });
  }
}

function testFactoryFunction({ testFactoryFunctionInvocation, testService }) {
  return {
    handle(req, res) {
      res.send({ success: true });
    }
  };
}

function createServer(spies) {
  const app = Express();
  const router = Router();

  const container = createContainer()
    .register({
      testService: asClass(TestService).scoped()
    })
    // These will be registered as transient.
    .registerFunction(spies);

  app.use(scopePerRequest(container));

  const fnAPI = makeInvoker(testFactoryFunction);
  const classAPI = makeClassInvoker(TestClass);
  router.get('/function', fnAPI('handle'));
  router.get('/class', classAPI('handle'));
  app.use(router);

  return new Promise((resolve, reject) => {
    let server = app.listen((err) => err ? reject(err) : resolve(server));
  });
}

describe('integration', () => {
  let request,
    server,
    serviceConstructor,
    testClassConstructor,
    testFactoryFunctionInvocation;

  beforeEach(() => {
    serviceConstructor = sinon.spy();
    testClassConstructor = sinon.spy();
    testFactoryFunctionInvocation = sinon.spy();

    const spies = {
      serviceConstructor,
      testClassConstructor,
      testFactoryFunctionInvocation
    };

    return createServer(spies).then(s => {
      server = s;
      request = AssertRequest(server);
    });
  });

  afterEach((done) => server.close(done));

  describe('makeInvoker', () => {
    it('makes sure the spy is called once for each request', () => {
      return Promise.all([
        request.get('/function').okay(),
        request.get('/function').okay()
      ]).then(() => {
        expect(testClassConstructor).to.not.have.been.called;
        expect(testFactoryFunctionInvocation).to.have.been.calledTwice;
        expect(serviceConstructor).to.have.been.calledTwice;
      });
    });
  });

  describe('makeClassInvoker', () => {
    it('makes sure the spy is called once for each request', () => {
      return Promise.all([
        request.get('/class').okay(),
        request.get('/class').okay()
      ]).then(() => {
        expect(testFactoryFunctionInvocation).to.not.have.been.called;
        expect(testClassConstructor).to.have.been.calledTwice;
        expect(serviceConstructor).to.have.been.calledTwice;
      });
    });
  });
});
/* eslint-enable no-unused-vars */
