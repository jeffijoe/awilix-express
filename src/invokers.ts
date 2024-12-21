import {
  asFunction,
  Resolver,
  AwilixContainer,
  ResolverOptions,
  Constructor,
  asClass,
  ClassOrFunctionReturning,
  FunctionReturning,
} from 'awilix'
import { isClass } from 'awilix/lib/utils'
import { NextFunction, Request, Response } from 'express'
import * as assert from 'assert'

/**
 * Creates either a function invoker or a class invoker, based on whether
 * the argument can be classified as a class or not. Uses Awilix' `isClass` utility.
 *
 * @param functionOrClass
 * The function or class to invoke.
 *
 * @param opts
 * Resolver options for the class/function.
 */
export function makeInvoker<T>(
  functionOrClass: ClassOrFunctionReturning<T>,
  opts?: ResolverOptions<T>,
) {
  return isClass(functionOrClass)
    ? /*tslint:disable-next-line*/
      makeClassInvoker(functionOrClass as Constructor<T>, opts)
    : /*tslint:disable-next-line*/
      makeFunctionInvoker(functionOrClass as FunctionReturning<T>, opts)
}

/**
 * Returns a function that when called with a name,
 * returns another function to be used as Express middleware.
 * That function will run `fn` with the container cradle as the
 * only parameter, and then call the `methodToInvoke` on
 * the result.
 *
 * @param, {Function} fn
 * @return {(methodToInvoke: string) => (req) => void}
 */
export function makeFunctionInvoker<T>(
  fn: FunctionReturning<T>,
  opts?: ResolverOptions<T>,
) {
  return makeResolverInvoker(asFunction(fn, opts))
}

/**
 * Same as `makeInvoker` but for classes.
 *
 * @param  {Class} Class
 * @return {(methodToInvoke: string) => (req) => void}
 */
export function makeClassInvoker<T>(
  Class: Constructor<T>,
  opts?: ResolverOptions<T>,
) {
  return makeResolverInvoker(asClass(Class, opts))
}

/**
 * Returns a function that when called with a method name,
 * returns another function to be used as Express middleware.
 * That function will run `container.build(resolver)`, and
 * then call the method on the result, passing in the Express request
 * and rest of the parameters.
 *
 * @param, {Resolver} resolver
 * @return {(methodToInvoke: string) => (req) => void}
 */
export function makeResolverInvoker<T>(resolver: Resolver<T>) {
  /**
   * 2nd step is to create a method to invoke on the result
   * of the resolver.
   *
   * @param  methodToInvoke
   * @return {(req) => void}
   */
  return function makeMemberInvoker<K extends keyof T>(methodToInvoke: K) {
    /**
     * The invoker middleware.
     *
     * @param  {E.Request} req
     * @param  {...*} rest
     * @return {*}
     */
    return function memberInvoker(req: any, ...rest: any[]) {
      const container: AwilixContainer = req.container
      const resolved: any = container.build(resolver)
      assert(
        methodToInvoke,
        `methodToInvoke must be a valid method type, such as string, number or symbol, but was ${String(
          methodToInvoke,
        )}`,
      )
      if (!resolved[methodToInvoke!]) {
        throw Error(
          `The method attempting to be invoked, '${String(
            methodToInvoke,
          )}', does not exist on the controller`,
        )
      }
      return asyncErrorWrapper(resolved[methodToInvoke!].bind(resolved))(
        req,
        ...rest,
      )
    }
  }
}

/**
 * Injects dependencies into the middleware factory when the middleware is invoked.
 *
 * @param factory
 */
export function inject(factory: ClassOrFunctionReturning<any> | Resolver<any>) {
  const resolver = getResolver(factory)
  /**
   * The invoker middleware.
   */
  return function middlewareFactoryHandler(req: any, ...rest: any[]) {
    const container: AwilixContainer = req.container
    const resolved: any = container.build(resolver)
    return asyncErrorWrapper(resolved)(req, ...rest)
  }
}

/**
 * Wraps or returns a resolver.
 */
function getResolver<T>(
  arg: ClassOrFunctionReturning<T> | Resolver<T>,
): Resolver<T> {
  if (typeof arg === 'function') {
    /*tslint:disable-next-line*/
    return asFunction(arg as any)
  }

  return arg
}

/**
 * Wraps a middleware, detects if it returns a Promise and calls next() with the caught error, if necessary.
 * @param fn
 */
function asyncErrorWrapper(
  fn: (...args: any[]) => any,
): (...args: any[]) => any {
  return function asyncWrappedMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    const returnValue = fn(req, res, next)

    if (
      returnValue &&
      returnValue.catch &&
      typeof returnValue.catch === 'function'
    ) {
      return returnValue.catch((err: any) => {
        next(err)
      })
    } else {
      return returnValue
    }
  }
}
