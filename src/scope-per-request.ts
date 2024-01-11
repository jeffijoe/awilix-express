import { AwilixContainer } from 'awilix'
import { Response, NextFunction } from 'express'

/**
 * Express middleware factory that will create and attach
 * a scope onto a content.
 *
 * @param  {AwilixContainer} container
 * @return {Function}
 */
export function scopePerRequest(container: AwilixContainer) {
  return function scopePerRequestMiddleware(
    req: any,
    res: Response,
    next: NextFunction,
  ) {
    req.container = container.createScope()
    return next()
  }
}
