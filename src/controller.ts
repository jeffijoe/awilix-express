import { GlobOptions } from 'glob'
import {
  rollUpState,
  findControllers,
  HttpVerbs,
  getStateAndTarget,
  IStateAndTarget,
  IAwilixControllerBuilder,
  ClassOrFunctionReturning,
} from 'awilix-router-core'
import { makeInvoker } from './invokers'
import { Router } from 'express'

/**
 * Constructor type.
 */
export type ConstructorOrControllerBuilder =
  | (new (...args: any[]) => any)
  | IAwilixControllerBuilder

/**
 * Registers one or multiple decorated controller classes.
 *
 * @param ControllerClass One or multiple "controller" classes
 *        with decorators to register
 */
export function controller(
  ControllerClass:
    | ConstructorOrControllerBuilder
    | ConstructorOrControllerBuilder[],
): Router {
  const router = Router()
  if (Array.isArray(ControllerClass)) {
    ControllerClass.forEach((c) =>
      _registerController(router, getStateAndTarget(c)),
    )
  } else {
    _registerController(router, getStateAndTarget(ControllerClass))
  }

  return router
}

/**
 * Loads controllers for the given pattern.
 *
 * @param pattern
 * @param opts
 */
export function loadControllers(pattern: string, opts?: GlobOptions): Router {
  const router = Router()
  findControllers(pattern, {
    ...opts,
    absolute: true,
  }).forEach(_registerController.bind(null, router))

  return router
}

/**
 * Reads the config state and registers the routes in the router.
 *
 * @param router
 * @param ControllerClass
 */
function _registerController(
  router: Router,
  stateAndTarget: IStateAndTarget | null,
): void {
  if (!stateAndTarget) {
    return
  }

  const { state, target } = stateAndTarget
  const rolledUp = rollUpState(state)
  rolledUp.forEach((methodCfg, methodName) => {
    methodCfg.verbs.forEach((httpVerb) => {
      let method = httpVerb.toLowerCase()
      if (httpVerb === HttpVerbs.ALL) {
        method = 'all'
      }

      ;(router as any)[method](
        methodCfg.paths,
        ...methodCfg.beforeMiddleware,
        /*tslint:disable-next-line*/
        makeInvoker(target as ClassOrFunctionReturning<any>)(methodName as any),
        ...methodCfg.afterMiddleware,
      )
    })
  })
}
