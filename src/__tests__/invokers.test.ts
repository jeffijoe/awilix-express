import { makeClassInvoker, makeFunctionInvoker, inject } from '../invokers'
import { createContainer, AwilixContainer, asValue, asFunction } from 'awilix'
import * as Express from 'express'

describe('invokers', function() {
  let container: AwilixContainer
  let methodSpy: any
  let factorySpy: any
  let constructorSpy: any
  let request: any
  beforeEach(function() {
    factorySpy = jest.fn()
    constructorSpy = jest.fn()
    methodSpy = jest.fn()
    container = createContainer()
    container.register('param', asValue(42))
    request = { container }
  })

  describe('makeFunctionInvoker', function() {
    it('returns callable middleware', function() {
      function target({ param }: any) {
        factorySpy()
        const obj = {
          method(req: any, res: Express.Response) {
            methodSpy()
            expect(this).toBe(obj)
            return [req, param]
          }
        }
        return obj
      }

      const invoker = makeFunctionInvoker(target)

      // Call it twice.
      invoker('method')(request)
      const result = invoker('method')(request)

      expect(result).toEqual([request, 42])
      expect(factorySpy).toHaveBeenCalledTimes(2)
      expect(methodSpy).toHaveBeenCalledTimes(2)
    })

    it('returns callable async middleware', async function() {
      function target({ param }: any) {
        factorySpy()
        const obj = {
          async method(req: any, res: Express.Response) {
            methodSpy()
            expect(this).toBe(obj)
            return [req, param]
          }
        }
        return obj
      }

      const invoker = makeFunctionInvoker(target)

      // Call it twice.
      await invoker('method')(request)
      const result = await invoker('method')(request)

      expect(result).toEqual([request, 42])
      expect(factorySpy).toHaveBeenCalledTimes(2)
      expect(methodSpy).toHaveBeenCalledTimes(2)
    })

    it('returns callable async middleware that handles errors', async function() {
      function target({ param }: any) {
        factorySpy()
        const obj = {
          async method(req: any, res: Express.Response) {
            methodSpy()
            expect(this).toBe(obj)
            throw new Error('42')
          }
        }
        return obj
      }

      const nextSpy = jest.fn()

      const invoker = makeFunctionInvoker(target)

      try {
        await invoker('method')(request, 'response', nextSpy)
        throw new Error('Should not be thrown')
      } catch (ex) {
        expect(ex).toBeDefined()
        expect(ex.message).not.toEqual('Should not be thrown')
        expect(ex.message).toEqual('42')
      }

      expect(nextSpy).toHaveBeenCalledTimes(1)
      expect(factorySpy).toHaveBeenCalledTimes(1)
      expect(methodSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('makeClassInvoker', function() {
    it('returns callable middleware', function() {
      class Target {
        param: any
        constructor({ param }: any) {
          constructorSpy()
          this.param = param
        }

        method(req: any, additional: any) {
          methodSpy()
          expect(this).toBeInstanceOf(Target)
          return [req, this.param, additional]
        }
      }

      const invoker = makeClassInvoker(Target)

      // Call it twice.
      invoker('method')(request, 'hello')
      const result = invoker('method')(request, 'hello')

      expect(result).toEqual([request, 42, 'hello'])
      expect(constructorSpy).toHaveBeenCalledTimes(2)
      expect(methodSpy).toHaveBeenCalledTimes(2)
    })

    it('returns callable async middleware', async function() {
      class Target {
        param: any
        constructor({ param }: any) {
          constructorSpy()
          this.param = param
        }

        async method(req: any, additional: any) {
          methodSpy()
          expect(this).toBeInstanceOf(Target)
          return [req, this.param, additional]
        }
      }

      const invoker = makeClassInvoker(Target)

      // Call it twice.
      await invoker('method')(request, 'hello')
      const result = await invoker('method')(request, 'hello')

      expect(result).toEqual([request, 42, 'hello'])
      expect(constructorSpy).toHaveBeenCalledTimes(2)
      expect(methodSpy).toHaveBeenCalledTimes(2)
    })

    it('returns callable async middleware that handles errors', async function() {
      class Target {
        param: any
        constructor({ param }: any) {
          constructorSpy()
          this.param = param
        }

        async method(req: any, additional: any) {
          methodSpy()
          expect(this).toBeInstanceOf(Target)
          throw new Error('42')
        }
      }

      const nextSpy = jest.fn()

      const invoker = makeClassInvoker(Target)

      try {
        await invoker('method')(request, 'response', nextSpy)
        throw new Error('Should not be thrown')
      } catch (ex) {
        expect(ex).toBeDefined()
        expect(ex.message).not.toEqual('Should not be thrown')
        expect(ex.message).toEqual('42')
      }

      expect(nextSpy).toHaveBeenCalledTimes(1)
      expect(constructorSpy).toHaveBeenCalledTimes(1)
      expect(methodSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('inject', () => {
    describe('passing a function', () => {
      it('converts function to resolver returns callable middleware', () => {
        const converted = inject(({ param }: any) => {
          constructorSpy()
          return (req: any, additional: any) => {
            methodSpy()
            return [req, param, additional]
          }
        })

        // Call it twice.
        converted(request, 'hello')
        const result = converted(request, 'hello')

        expect(result).toEqual([request, 42, 'hello'])
        expect(constructorSpy).toHaveBeenCalledTimes(2)
        expect(methodSpy).toHaveBeenCalledTimes(2)
      })
    })

    describe('passing a resolver', () => {
      it('converts function to resolver returns callable middleware', () => {
        const converted = inject(
          asFunction(({ param }: any) => {
            constructorSpy()
            return (req: any, additional: any) => {
              methodSpy()
              return [req, param, additional]
            }
          })
        )

        // Call it twice.
        converted(request, 'hello')
        const result = converted(request, 'hello')

        expect(result).toEqual([request, 42, 'hello'])
        expect(constructorSpy).toHaveBeenCalledTimes(2)
        expect(methodSpy).toHaveBeenCalledTimes(2)
      })
    })

    describe('passing a function returning an async method', () => {
      it('converts function to resolver returns callable middleware', async () => {
        const converted = inject(({ param }: any) => {
          constructorSpy()
          return async (req: any, additional: any) => {
            methodSpy()
            return [req, param, additional]
          }
        })

        // Call it twice.
        await converted(request, 'hello')
        const result = await converted(request, 'hello')

        expect(result).toEqual([request, 42, 'hello'])
        expect(constructorSpy).toHaveBeenCalledTimes(2)
        expect(methodSpy).toHaveBeenCalledTimes(2)
      })

      it('converts function to resolver returns callable middleware that handles errors', async () => {
        const converted = inject(({ param }: any) => {
          constructorSpy()
          return async (req: any, additional: any) => {
            methodSpy()
            throw new Error('42')
          }
        })

        const nextSpy = jest.fn()

        try {
          await converted(request, 'response', nextSpy)
          throw new Error('Should not be thrown')
        } catch (ex) {
          expect(ex).toBeDefined()
          expect(ex.message).not.toEqual('Should not be thrown')
          expect(ex.message).toEqual('42')
        }

        expect(nextSpy).toHaveBeenCalledTimes(1)
        expect(constructorSpy).toHaveBeenCalledTimes(1)
        expect(methodSpy).toHaveBeenCalledTimes(1)
      })
    })
  })
})
