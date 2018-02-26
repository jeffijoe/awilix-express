import { route, GET, before, after } from 'awilix-router-core'

@route('/js')
@before((req,res, next) => res.set('x-root-before', 'js') && next())
@after((req, res) => res.send(req.message))
export default class JsClass {
  constructor({ service }) {
    this.service = service
  }

  @route('/get')
  @GET()
  func(req, res, next) {
    req.message = this.service.get('js')
    res.status(203)
    next()
  }
}
