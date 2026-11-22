import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, it, beforeEach, afterEach } from 'node:test'
import express, { Response } from 'express'
import * as http from 'http'
import { loadControllers, controller } from '../controller'
import { scopePerRequest } from '../scope-per-request'
import { createContainer, asFunction } from 'awilix'
import { route, GET, createController } from '../'
import { FindControllersOptions } from 'awilix-router-core'
import { AddressInfo } from 'net'

import { requestFrom } from './request'

describe('controller registration', () => {
  let server: http.Server
  let request: ReturnType<typeof requestFrom>
  beforeEach(async () => {
    ;[server, request] = await createServer()
  })

  afterEach(() => server.close())

  it('loads controllers with esModules option', async () => {
    const [esmServer, esmRequest] = await createServer({
      esModules: true,
      import: (url: string) => Promise.resolve(require(fileURLToPath(url))),
    })
    try {
      await Promise.all([
        esmRequest('/js/get', {
          status: 203,
          headers: { 'x-root-before': 'js' },
          json: { message: 'js' },
        }),
        esmRequest('/ts/get', {
          status: 203,
          headers: { 'x-root-before': 'ts' },
          json: { message: 'ts' },
        }),
      ])
    } finally {
      esmServer.close()
    }
  })

  it('registers the correct routes', async () => {
    await Promise.all([
      request('/js/get', {
        status: 203,
        headers: { 'x-root-before': 'js' },
        json: { message: 'js' },
      }),
      request('/ts/get', {
        status: 203,
        headers: { 'x-root-before': 'ts' },
        json: { message: 'ts' },
      }),
      request('/ts/123', {
        headers: { 'x-root-before': 'ts' },
        json: { method: 'GET', id: '123' },
      }),
      request('/ts/123', {
        method: 'POST',
        headers: { 'x-root-before': 'ts' },
        json: { method: 'POST', id: '123' },
      }),
      request('/ts', { json: { message: 'index' } }),
      request('/ping', { json: { message: 'pong' } }),
      request('/func', { json: { message: 'func' } }),
    ])
  })
})

async function createServer(
  loadOpts?: FindControllersOptions<true>,
): Promise<[http.Server, ReturnType<typeof requestFrom>]> {
  const app = express()
  const container = createContainer({
    strict: true,
  }).register({
    service: asFunction(() => ({ get: (message: string) => ({ message }) })),
  })
  app.use(scopePerRequest(container))
  if (loadOpts) {
    app.use(
      await loadControllers(
        join(__dirname, '../../__fixtures__/1/*.js'),
        loadOpts,
      ),
    )
  } else {
    app.use(loadControllers(join(__dirname, '../../__fixtures__/1/*.js')))
  }
  app.use(controller(PlainController))
  app.use(controller([Nothing]))
  app.use(
    controller(
      createController(({ service }: any) => ({
        func: (req: any, res: Response) => res.send(service.get('func')),
      }))
        .prefix('/func')
        .get('', 'func'),
    ),
  )

  return new Promise((resolve) => {
    const server = app.listen(() => {
      const addr = server.address() as AddressInfo
      resolve([server, requestFrom(`http://127.0.0.1:${addr.port}`)])
    })
  })
}

class Nothing {}

class PlainController {
  @route('/ping')
  @GET()
  ping(req: any, res: Response) {
    res.send({ message: 'pong' })
  }
}
