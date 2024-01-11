# awilix-express

[![npm version](https://badge.fury.io/js/awilix-express.svg)](https://badge.fury.io/js/awilix-express)
[![CI](https://github.com/jeffijoe/awilix-express/actions/workflows/ci.yml/badge.svg)](https://github.com/jeffijoe/awilix-express/actions/workflows/ci.yml)
[![Coverage Status](https://coveralls.io/repos/github/jeffijoe/awilix-express/badge.svg?branch=master)](https://coveralls.io/github/jeffijoe/awilix-express?branch=master)
![Typings Included](https://img.shields.io/badge/typings-included-brightgreen.svg)

Awilix helpers, router and scope-instantiating middleware for **Express**. 🐨

> ✨ **NEW IN V1**: [first-class router support with auto-loading!](#awesome-usage) 🚀

# Table of Contents

- [awilix-express](#awilix-express)
- [Table of Contents](#table-of-contents)
- [Installation](#installation)
- [Basic Usage](#basic-usage)
- [Awesome Usage](#awesome-usage)
- [Why do I need it?](#why-do-i-need-it)
  - [Manual](#manual)
  - [Using `awilix-express`](#using-awilix-express)
- [API](#api)
- [Contributing](#contributing)
  - [`npm run` scripts](#npm-run-scripts)
- [Author](#author)

# Installation

```
npm install --save awilix-express
```

# Basic Usage

Add the middleware to your Express app.

```js
const { asClass, asValue, createContainer } = require('awilix')
const { scopePerRequest } = require('awilix-express')

const container = createContainer()
container.register({
  // Scoped lifetime = new instance per request
  // Imagine the TodosService needs a `user`.
  // class TodosService { constructor({ user }) { } }
  todosService: asClass(TodosService).scoped(),
})

// Add the middleware, passing it your Awilix container.
// This will attach a scoped container on the context.
app.use(scopePerRequest(container))

// Now you can add request-specific data to the scope.
app.use((req, res, next) => {
  req.container.register({
    user: asValue(req.user), // from some authentication middleware...
  })

  return next()
})
```

Then in your route handlers...

```js
const { makeInvoker } = require('awilix-express')

function makeAPI({ todosService }) {
  return {
    find: (req, res) => {
      return todosService.find().then((result) => {
        res.send(result)
      })
    },
  }
}

const api = makeInvoker(makeAPI)

// Creates middleware that will invoke `makeAPI`
// for each request, giving you a scoped instance.
router.get('/todos', api('find'))
```

# Awesome Usage

**As of `awilix-express@1.0.0`**, we ship with `Express.Router` bindings for [`awilix-router-core`][awilix-router-core]!
This is cool because now your routing setup can be streamlined with first-class Awilix support!

The Awilix-based router comes in 2 flavors: **a builder** and **ESNext decorators**.

**`routes/todos-api.js`** - demos the builder pattern

```js
import bodyParser from 'body-parser'
import { authenticate } from './your-auth-middleware'
import { createController } from 'awilix-express' // or `awilix-router-core`

const API = ({ todoService }) => ({
  getTodo: async (req, res) => {
    res.send(await todoService.get(req.params.id))
  },
  createTodo: async (req, res) => {
    res.send(await todoService.create(req.body))
  },
})

export default createController(API)
  .prefix('/todos') // Prefix all endpoints with `/todo`
  .before([authenticate()]) // run authentication for all endpoints
  .get('/:id', 'getTodo') // Maps `GET /todos/:id` to the `getTodo` function on the returned object from `API`
  .post('', 'createTodo', {
    // Maps `POST /todos` to the `createTodo` function on the returned object from `API`
    before: [bodyParser()], // Runs the bodyParser just for this endpoint
  })
```

**`routes/users-api.js`** - demos the decorator pattern

```js
import bodyParser from 'body-parser'
import { authenticate } from './your-auth-middleware'
import { route, GET, POST, before } from 'awilix-express' // or `awilix-router-core`

@route('/users')
export default class UserAPI {
  constructor({ userService }) {
    this.userService = userService
  }

  @route('/:id')
  @GET()
  @before([authenticate()])
  async getUser(req, res) {
    res.send(await this.userService.get(req.params.id))
  }

  @POST()
  @before([bodyParser()])
  async createUser(req, res) {
    res.send(await this.userService.create(req.body))
  }
}
```

**`server.js`**

```js
import Express from 'express'
import { asClass, createContainer } from 'awilix'
import { loadControllers, scopePerRequest } from 'awilix-express'

const app = Express()
const container = createContainer().register({
  userService: asClass(/*...*/),
  todoService: asClass(/*...*/),
})
app.use(scopePerRequest(container))
// Loads all controllers in the `routes` folder
// relative to the current working directory.
// This is a glob pattern.
app.use(loadControllers('routes/*.js', { cwd: __dirname }))

app.listen(3000)
```

Please see the [`awilix-router-core`][awilix-router-core] docs for information about the full API.

# Why do I need it?

You can certainly use Awilix with Express without this library, but follow along and you might see why it's useful.

Imagine this simple imaginary Todos app, written in ES6:

```js
// A totally framework-independent piece of application code.
// Nothing here is remotely associated with HTTP, Express or anything.
class TodosService {
  constructor({ currentUser, db }) {
    // We depend on the current user!
    this.currentUser = currentUser
    this.db = db
  }

  getTodos() {
    // use your imagination ;)
    return this.db('todos').where('user', this.currentUser.id)
  }
}

// Here's a Express API that calls the service
class TodoAPI {
  constructor({ todosService }) {
    this.todosService = todosService
  }
  getTodos(req, res) {
    return this.todosService.getTodos().then((todos) => res.send(todos))
  }
}
```

So the problem with the above is that the `TodosService` needs a `currentUser` for it to function. Let's first try solving this manually, and then with `awilix-express`.

## Manual

This is how you would have to do it without Awilix at all.

```js
import db from './db'

router.get('/todos', (req, res) => {
  // We need a new instance for each request,
  // else the currentUser trick wont work.
  const api = new TodoAPI({
    todosService: new TodosService({
      db,
      // current user is request specific.
      currentUser: req.user,
    }),
  })

  // invoke the method.
  return api.getTodos(req, res)
})
```

Let's do this with Awilix instead. We'll need a bit of setup code.

```js
import { asValue, createContainer, Lifetime } from 'awilix'

const container = createContainer()

// The `TodosService` lives in services/TodosService
container.loadModules(['services/*.js'], {
  // we want `TodosService` to be registered as `todosService`.
  formatName: 'camelCase',
  resolverOptions: {
    // We want instances to be scoped to the Express request.
    // We need to set that up.
    lifetime: Lifetime.SCOPED,
  },
})

// imagination is a wonderful thing.
app.use(someAuthenticationMethod())

// We need a middleware to create a scope per request.
// Hint: that's the scopePerRequest middleware in `awilix-express` ;)
app.use((req, res, next) => {
  // We want a new scope for each request!
  req.container = container.createScope()
  // The `TodosService` needs `currentUser`
  req.container.register({
    currentUser: asValue(req.user), // from auth middleware... IMAGINATION!! :D
  })
  return next()
})
```

Okay! Let's try setting up that API again!

```js
export default function (router) {
  router.get('/todos', (req, res) => {
    // We have our scope available!
    const api = new TodoAPI(req.container.cradle) // Awilix magic!
    return api.getTodos(req, res)
  })
}
```

A lot cleaner, but we can make this even shorter!

```js
export default function (router) {
  // Just invoke `api` with the method name and
  // you've got yourself a middleware that instantiates
  // the API and calls the method.
  const api = (methodName) => {
    // create our handler
    return function (req, res) {
      const controller = new TodoAPI(req.container.cradle)
      return controller[method](req, res)
    }
  }

  // adding more routes is way easier!
  router.get('/todos', api('getTodos'))
}
```

## Using `awilix-express`

In our route handler, do the following:

```js
import { makeInvoker } from 'awilix-express'

export default function (router) {
  const api = makeInvoker(TodoAPI)
  router.get('/todos', api('getTodos'))
}
```

And in your express application setup:

```js
import { asValue, createContainer, Lifetime } from 'awilix'
import { scopePerRequest } from 'awilix-express'

const container = createContainer()

// The `TodosService` lives in services/TodosService
container.loadModules(
  [
    ['services/*.js', Lifetime.SCOPED], // shortcut to make all services scoped
  ],
  {
    // we want `TodosService` to be registered as `todosService`.
    formatName: 'camelCase',
  },
)

// imagination is a wonderful thing.
app.use(someAuthenticationMethod())

// Woah!
app.use(scopePerRequest(container))
app.use((req, res, next) => {
  // We still want to register the user!
  // req.container is a scope!
  req.container.register({
    currentUser: asValue(req.user), // from auth middleware... IMAGINATION!! :D
  })
})
```

Now **that** is way simpler!

```js
import { makeInvoker } from 'awilix-express'

function makeTodoAPI({ todosService }) {
  return {
    getTodos: (req, res) => {
      return todosService.getTodos().then((todos) => res.send(todos))
    },
  }
}

export default function (router) {
  const api = makeInvoker(makeTodoAPI)
  router.get('/api/todos', api('getTodos'))
}
```

That concludes the tutorial! Hope you find it useful, I know I have.

# API

The package exports everything from `awilix-router-core` as well as the following **Express middleware factories**:

- `scopePerRequest(container)`: creates a scope per request.
- `controller(decoratedClassOrController)`: registers routes and delegates to Express.Router.
- `loadControllers(pattern, opts)`: loads files matching a glob pattern and registers their exports as controllers.
- `makeInvoker(functionOrClass, opts)(methodName)`: using `isClass`, calls either `makeFunctionInvoker` or `makeClassInvoker`.
- `makeClassInvoker(Class, opts)(methodName)`: resolves & calls `methodName` on the resolved instance, passing it `req`, `res` and `next`.
- `makeFunctionInvoker(function, opts)(methodName)`: resolves & calls `methodName` on the resolved instance, passing it `req`, `res` and `next`.
- `makeResolverInvoker(resolver, opts)`: used by the other invokers, exported for convenience.
- `inject(middlewareFactory)`: resolves the middleware per request.

```js
app.use(
  inject(({ userService }) => (req, res, next) => {
    /**/
  }),
)
```

# Contributing

## `npm run` scripts

- `npm run test`: Runs tests once
- `npm run lint`: Lints + formats the code once
- `npm run cover`: Runs code coverage using `istanbul`

# Author

- Talysson Oliveira Cassiano - [@talyssonoc](https://twitter.com/talyssonoc)
- Jeff Hansen - [@jeffijoe](https://twitter.com/jeffijoe)

[awilix-router-core]: https://github.com/jeffijoe/awilix-router-core
