import * as Express from 'express'
import * as http from 'http'
import { loadControllers, controller } from '../controller'
import { scopePerRequest } from '../scope-per-request'
import { createContainer, asFunction } from 'awilix'
import { route, GET, createController } from '../'
import { AddressInfo } from 'net'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const AssertRequest = require('assert-request')

describe('controller registration', () => {
  let server: http.Server
  let request: any
  beforeEach(async () => {
    ;[server, request] = await createServer()
  })

  afterEach(() => server.close())

  it('registers the correct routes', async () => {
    await Promise.all([
      request
        .get('/js/get')
        .status(203)
        .header('x-root-before', 'js')
        .json({ message: 'js' }),
      request
        .get('/ts/get')
        .status(203)
        .header('x-root-before', 'ts')
        .json({ message: 'ts' }),
      request
        .get('/ts/123')
        .okay()
        .header('x-root-before', 'ts')
        .json({ method: 'GET', id: '123' }),
      request
        .post('/ts/123')
        .okay()
        .header('x-root-before', 'ts')
        .json({ method: 'POST', id: '123' }),
      request.get('/ts').okay().json({ message: 'index' }),
      request.get('/ping').okay().json({ message: 'pong' }),
      request.get('/func').okay().json({ message: 'func' }),
    ])
  })
})

function createServer(): Promise<[http.Server, any]> {
  const app = Express()
  const container = createContainer({
    strict: true,
  }).register({
    service: asFunction(() => ({ get: (message: string) => ({ message }) })),
  })
  app.use(scopePerRequest(container))
  app.use(loadControllers('__fixtures__/1/*.*'))
  app.use(controller(PlainController))
  app.use(controller([Nothing]))
  app.use(
    controller(
      createController(({ service }: any) => ({
        func: (req: any, res: Express.Response) =>
          res.send(service.get('func')),
      }))
        .prefix('/func')
        .get('', 'func'),
    ),
  )

  return new Promise((resolve) => {
    const server = app.listen(() => {
      const addr = server.address() as AddressInfo
      resolve([server, AssertRequest(`http://127.0.0.1:${addr.port}`)])
    })
  })
}

class Nothing {}

class PlainController {
  @route('/ping')
  @GET()
  ping(req: any, res: Express.Response) {
    res.send({ message: 'pong' })
  }
}
