import { route, GET, before, after, ALL } from 'awilix-router-core'
import { Response } from 'express'

@route('/ts')
@before((req: any, res: Response, next: any) => res.set('x-root-before', 'ts') && next())
@after((req: any, res: Response) => res.send(req.message))
export default class TsClass {
  service: any
  constructor({ service }: any) {
    this.service = service
  }

  @GET()
  index(req: any, res: Response) {
    res.send({ message: 'index' })
  }

  @route('/get')
  @GET()
  func(req: any, res: Response, next: any) {
    req.message = this.service.get('ts')
    res.status(203)
    next()
  }

  @route('/:id')
  @ALL()
  all(req: any, res: Response) {
    res.send({ method: req.method, id: req.params.id })
  }
}
