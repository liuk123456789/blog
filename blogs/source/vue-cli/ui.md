---
title: vue-cli-第七篇
date: 2023-06-09
categories: 
 - 源码解读
tags:
 - vue-cli-第七篇
sidebar: auto
---

## 1. 前言

`vue ui`生成`vue`项目时，会本地启动服务，同时提供可视化界面的方式，完成配置

[官网链接](https://cli.vuejs.org/zh/guide/creating-a-project.html#%E4%BD%BF%E7%94%A8%E5%9B%BE%E5%BD%A2%E5%8C%96%E7%95%8C%E9%9D%A2)

## 2. 命令详情

```javascript
program
  .command('ui')
  .description('start and open the vue-cli ui')
  .option('-H, --host <host>', 'Host used for the UI server (default: localhost)')
  .option('-p, --port <port>', 'Port used for the UI server (by default search for available port)')
  .option('-D, --dev', 'Run in dev mode')
  .option('--quiet', `Don't output starting messages`)
  .option('--headless', `Don't open browser on start and output port`)
  .action((options) => {
    checkNodeVersion('>=8.6', 'vue ui')
    require('../lib/ui')(options)
  })
```

上述代码说明 `node`的最小必须8.6，同时加载`ui.js`的文件

## 3. 流程

![](https://kuangpf.com/vue-cli-analysis/assets/ui-img01.png)

这张图是 `vue ui` 的整体架构，如果现在不是很清楚里面里面涉及的知识的话，可以在了解完 ui 命令后再来回看一下。

除此之外，还需要了解以下这些知识：

- [GraphQL](https://graphql.org/)：API 查询语言
- [apollo-server](https://github.com/apollographql/apollo-server)： nodejs上构建grqphql服务端的web中间件,支持express，koa ，hapi等框架。
- [vue-apollo](https://vue-apollo.netlify.com/zh-cn/)：在 vue 项目中集成 GraphQL
- [express](https://github.com/expressjs/express)：Node.js Web 应用程序框架

接下来就从 server 端和 client 端进行分析。

## 4. server端

主要就是`lib/ui.js`

核心代码如下

```javascript
async function ui (options = {}, context = process.cwd()) {
  // vue ui 命令中未配置host，默认读本地
  const host = options.host || 'localhost'
  
  // 通过portfinder查找可用端口号
  let port = options.port
  if (!port) {
    port = await portfinder.getPortPromise()
  }

  // Config
  process.env.VUE_APP_CLI_UI_URL = ''

  // Optimize express
  const nodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'

  // Dev mode
  if (options.dev) {
    process.env.VUE_APP_CLI_UI_DEBUG = true
  }

  if (!process.env.VUE_CLI_IPC) {
    // Prevent IPC id conflicts
    process.env.VUE_CLI_IPC = `vue-cli-${shortid()}`
  }

  if (!options.quiet) log(`🚀  Starting GUI...`)

  const opts = {
    host,
    port,
    graphqlPath: '/graphql',
    subscriptionsPath: '/graphql',
    enableMocks: false,
    enableEngine: false,
    cors: {
      origin: host
    },
    timeout: 1000000,
    quiet: true,
    paths: {
      typeDefs: require.resolve('@vue/cli-ui/apollo-server/type-defs.js'),
      resolvers: require.resolve('@vue/cli-ui/apollo-server/resolvers.js'),
      context: require.resolve('@vue/cli-ui/apollo-server/context.js'),
      pubsub: require.resolve('@vue/cli-ui/apollo-server/pubsub.js'),
      server: require.resolve('@vue/cli-ui/apollo-server/server.js'),
      directives: require.resolve('@vue/cli-ui/apollo-server/directives.js')
    }
  }

  const { httpServer } = await server(opts, () => {
    // Reset for yarn/npm to work correctly
    if (typeof nodeEnv === 'undefined') {
      delete process.env.NODE_ENV
    } else {
      process.env.NODE_ENV = nodeEnv
    }

    // Open browser
    const url = `http://${host}:${port}`
    if (!options.quiet) log(`🌠  Ready on ${url}`)
    if (options.headless) {
      console.log(port)
    } else {
      setNotificationCallback(() => openBrowser(url))
      openBrowser(url)
    }
  })

  httpServer.on('upgrade', simpleCorsValidation(host))
}
```

上面是 `lib/ui.js` 的部分代码，主要就是获取 `opts`，然后执行 `@vue/cli-ui` 的 `server` 方法。在 `opts` 中需要注意的就是 `opts.path` , 它定义一些变量的路径，具体作用如下：

- **typeDefs**: `GraphQL Schema`，用来定义 `GraphQL` 数据模型
- **resolvers**： 用于解析 `GraphQL Query` 获取的数据
- **context**：可以向` resolvers `注入上下文对象
- **pubsub**：`GraphQL` 订阅
- **server**：`express `服务，利用 `app.use` 注册中间件
- **directives**： `GraphQL `指令， `@include`，`@skip`

接下来看服务端启动的代码，代码目录在 `cli-ui/graphql-server` 中，简单看下部分代码：

```js
// modified from vue-cli-plugin-apollo/graphql-server
// added a return value for the server() call

const http = require('http')
const { chalk } = require('@vue/cli-shared-utils')
const express = require('express')
const { ApolloServer, gql } = require('apollo-server-express')
const { PubSub } = require('graphql-subscriptions')
const merge = require('deepmerge')

const { SubscriptionServer } = require('subscriptions-transport-ws')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { execute, subscribe } = require('graphql')

function defaultValue (provided, value) {
  return provided == null ? value : provided
}

function autoCall (fn, ...context) {
  if (typeof fn === 'function') {
    return fn(...context)
  }
  return fn
}

module.exports = async (options, cb = null) => {
  // Default options
  options = merge({
    integratedEngine: false
  }, options)

  // Express app
  const app = express()
  const httpServer = http.createServer(app)

  // Customize those files
  let typeDefs = load(options.paths.typeDefs)
  const resolvers = load(options.paths.resolvers)
  const context = load(options.paths.context)
  const schemaDirectives = load(options.paths.directives)
  let pubsub
  try {
    pubsub = load(options.paths.pubsub)
  } catch (e) {
    if (process.env.NODE_ENV !== 'production' && !options.quiet) {
      console.log(chalk.yellow('Using default PubSub implementation for subscriptions.'))
      console.log(chalk.grey('You should provide a different implementation in production (for example with Redis) by exporting it in \'apollo-server/pubsub.js\'.'))
    }
  }
  let dataSources
  try {
    dataSources = load(options.paths.dataSources)
  } catch (e) {}

  // GraphQL API Server

  // Realtime subscriptions
  if (!pubsub) pubsub = new PubSub()

  // Customize server
  try {
    const serverModule = load(options.paths.server)
    serverModule(app)
  } catch (e) {
    // No file found
  }

  // Apollo server options

  typeDefs = processSchema(typeDefs)

  // eslint-disable-next-line prefer-const
  let subscriptionServer

  let apolloServerOptions = {
    typeDefs,
    resolvers,
    schemaDirectives,
    dataSources,
    tracing: true,
    cache: 'bounded',
    cacheControl: true,
    engine: !options.integratedEngine,
    // Resolvers context from POST
    context: async ({ req, connection }) => {
      let contextData
      try {
        if (connection) {
          contextData = await autoCall(context, { connection })
        } else {
          contextData = await autoCall(context, { req })
        }
      } catch (e) {
        console.error(e)
        throw e
      }
      contextData = Object.assign({}, contextData, { pubsub })
      return contextData
    },
    // Resolvers context from WebSocket
    plugins: [{
      async serverWillStart () {
        return {
          async drainServer () {
            subscriptionServer.close()
          }
        }
      }
    }]
  }

  // Automatic mocking
  if (options.enableMocks) {
    // Customize this file
    apolloServerOptions.mocks = load(options.paths.mocks)
    apolloServerOptions.mockEntireSchema = false

    if (!options.quiet) {
      if (process.env.NODE_ENV === 'production') {
        console.warn('Automatic mocking is enabled, consider disabling it with the \'enableMocks\' option.')
      } else {
        console.log('✔️  Automatic mocking is enabled')
      }
    }
  }

  // Apollo Engine
  if (options.enableEngine && options.integratedEngine) {
    if (options.engineKey) {
      apolloServerOptions.engine = {
        apiKey: options.engineKey,
        schemaTag: options.schemaTag,
        ...options.engineOptions || {}
      }
      console.log('✔️  Apollo Engine is enabled')
    } else if (!options.quiet) {
      console.log(chalk.yellow('Apollo Engine key not found.') + `To enable Engine, set the ${chalk.cyan('VUE_APP_APOLLO_ENGINE_KEY')} env variable.`)
      console.log('Create a key at https://engine.apollographql.com/')
      console.log('You may see `Error: Must provide document` errors (query persisting tries).')
    }
  } else {
    apolloServerOptions.engine = false
  }

  // Final options
  apolloServerOptions = merge(apolloServerOptions, defaultValue(options.serverOptions, {}))

  // Apollo Server
  const server = new ApolloServer(apolloServerOptions)

  const schema = makeExecutableSchema({
    typeDefs: apolloServerOptions.typeDefs,
    resolvers: apolloServerOptions.resolvers,
    schemaDirectives: apolloServerOptions.schemaDirectives
  })

  subscriptionServer = SubscriptionServer.create({
    schema,
    execute,
    subscribe,
    onConnect: async (connection, websocket) => {
      let contextData = {}
      try {
        contextData = await autoCall(context, {
          connection,
          websocket
        })
        contextData = Object.assign({}, contextData, { pubsub })
      } catch (e) {
        console.error(e)
        throw e
      }
      return contextData
    }
  }, {
    server: httpServer,
    path: options.subscriptionsPath
  })

  await server.start()

  // Express middleware
  server.applyMiddleware({
    app,
    path: options.graphqlPath,
    cors: options.cors
    // gui: {
    //   endpoint: graphqlPath,
    //   subscriptionEndpoint: graphqlSubscriptionsPath,
    // },
  })

  // Start server
  httpServer.setTimeout(options.timeout)

  httpServer.listen({
    host: options.host || 'localhost',
    port: options.port
  }, () => {
    if (!options.quiet) {
      console.log(`✔️  GraphQL Server is running on ${chalk.cyan(`http://localhost:${options.port}${options.graphqlPath}`)}`)
      if (process.env.NODE_ENV !== 'production' && !process.env.VUE_CLI_API_MODE) {
        console.log(`✔️  Type ${chalk.cyan('rs')} to restart the server`)
      }
    }

    cb && cb()
  })

  // added in order to let vue cli to deal with the http upgrade request
  return {
    apolloServer: server,
    httpServer
  }
}

function load (file) {
  const module = require(file)
  if (module.default) {
    return module.default
  }
  return module
}

function processSchema (typeDefs) {
  if (Array.isArray(typeDefs)) {
    return typeDefs.map(processSchema)
  }

  if (typeof typeDefs === 'string') {
    // Convert schema to AST
    typeDefs = gql(typeDefs)
  }

  // Remove upload scalar (it's already included in Apollo Server)
  removeFromSchema(typeDefs, 'ScalarTypeDefinition', 'Upload')

  return typeDefs
}

function removeFromSchema (document, kind, name) {
  const definitions = document.definitions
  const index = definitions.findIndex(
    def => def.kind === kind && def.name.kind === 'Name' && def.name.value === name
  )
  if (index !== -1) {
    definitions.splice(index, 1)
  }
}

```

以上是 `server` 的部分代码，主要作用是利用 `apollo-server` 在 `nodejs` 上构建 `grqphql` 服务端的 `web`中间件，由于 `server` 端是 `express` 环境， 因此使用了` npm `包 `apollo-server-express`，到这里，服务端就启动起来了。

## 5. client端

`client` 端可以看作是一个 `vue` 项目，它是通过 vue 组件构成，在 `ui` 方面使用了自家的 [@vue/ui](https://www.npmjs.com/package/@vue/ui)，由于 `server` 端采用了 `graphql`，因此` client `端使用了 [vue-apollo](https://github.com/Akryum/vue-apollo)，这样可以利用其提供的 `API `和组件高效方便地使用` graphql `进行查询，变更以及订阅。

`client` 端的内容非常多，从项目创建到项目配置、运行以及打包发布，涉及到的代码很多，但大部分的流程基本上一致，这就不会一一做分析了，会选择导入项目这部分来分析，因为` ui`命令也是基于插件机制的，而导入项目的时候会涉及到插件加载以及利用 `PluginAPI` 增强项目的配置和任务，下面就开始分析项目导入的整个过程。

> 源码目录
>
> `vue ui` 运行的客户端是要打包压缩过的代码，目录为 `@vue/cli-ui/dist`，通过以下代码设置了静态资源（文件）目录，访问 `localhost:8000` 则指向 `@vue/cli-ui/dist/index.html`,从而启动了 client 端，对应的源码目录为 `@vue/cli-ui/src`。
>
> ```js
> app.use(express.static(distPath, { maxAge: 0 }))
> ```

#### importProject

导入项目的组件为 `@vue/cli-ui/src/components/project-manager/ProjectSelect.vue`，部分代码如下

```html
<div class="actions-bar center">
  <VueButton
    icon-left="unarchive"
    :label="$route.query.action || $t('org.vue.views.project-select.buttons.import')"
    class="big primary import-project"
    :disabled="folderCurrent && !folderCurrent.isPackage"
    :loading="busy"
    @click="importProject()"
  />
</div>
```

这是不是看着就熟悉了，接着看 `importProject` 方法：

```js
async importProject (force = false) {
  this.showNoModulesModal = false
  this.busy = true
  await this.$nextTick()
  try {
    await this.$apollo.mutate({
      mutation: PROJECT_IMPORT,
      variables: {
        input: {
          path: this.folderCurrent.path,
          force
        }
      }
    })

    this.$router.push({ name: 'project-home' })
  } catch (e) {
    if (e.graphQLErrors && e.graphQLErrors.some(e => e.message === 'NO_MODULES')) {
      this.showNoModulesModal = true
    }
    this.busy = false
  }
}
```

代码写的比较明了，当执行 `importProject` 时候会利用 vue-apollo 提供的 `this.$apollo.mutate()` 来发送一个 GraphQL 变更，从而改变服务端的数据，接下来就看服务端的 Mutation： `projectImport`。

#### Mutation

处理 `projectImport` 变更的代码目录在 `@vue/cli-ui/apollo-server/schema/project.js` 中，代码如下：

```js
exports.resolvers = {
  Project: { // ... 
  },
  Query: { // ... 
  },
  Mutation: {
    // ...
    projectImport: (root, { input }, context) => projects.import(input, context),
    // ...
  }
}
```

接着看 `projects.import`,代码目录在 `@vue/cli-ui/apollo-server/connectors/projects.js` 中，代码如下：

```js
async function importProject (input, context) { // 导入项目，执行 projectImport mutate
  if (!input.force && !fs.existsSync(path.join(input.path, 'node_modules'))) { // 强制导入没有 node_modules 的情形
    throw new Error('NO_MODULES')
  }

  const project = {
    id: shortId.generate(), // shortId
    path: input.path, // 导入项目的路径
    favorite: 0,
    type: folders.isVueProject(input.path) ? 'vue' : 'unknown' // 是否为 vue 项目
  }
  const packageData = folders.readPackage(project.path, context)
  project.name = packageData.name
  context.db.get('projects').push(project).write() // 将 project 信息存在本地的 db 中 （ lowdb 实现 ）
  return open(project.id, context)
}
```

`importProject` 方法的作用就是获取导入项目的信息，并利用 [lowdb](https://github.com/typicode/lowdb) 将数据存储在本地（~/.vue-cli-ui/db.json），接着执行 open 方法加载插件。

#### 插件加载

```js
async function open (id, context) {
  const project = findOne(id, context)
  // ...
  cwd.set(project.path, context) // process.env.VUE_CLI_CONTEXT
  // Reset locales
  locales.reset(context)
  // Load plugins
  // 加载插件
  await plugins.list(project.path, context)
  // ...
  return project
}
```

以上为 open 方法的部分代码，比较核心的就是 `await plugins.list(project.path, context)`,接着看

```js
async function list (file, context, { resetApi = true, lightApi = false, autoLoadApi = true } = {}) {
  let pkg = folders.readPackage(file, context)
  let pkgContext = cwd.get()
  // Custom package.json location
  if (pkg.vuePlugins && pkg.vuePlugins.resolveFrom) { // 加载其他文件夹里的 package.json
    pkgContext = path.resolve(cwd.get(), pkg.vuePlugins.resolveFrom)
    pkg = folders.readPackage(pkgContext, context)
  }
  pkgStore.set(file, { pkgContext, pkg })

  let plugins = []
  // package.json 中 devDependencies，dependencies 插件
  plugins = plugins.concat(findPlugins(pkg.devDependencies || {}, file))
  plugins = plugins.concat(findPlugins(pkg.dependencies || {}, file))

  // Put cli service at the top
  const index = plugins.findIndex(p => p.id === CLI_SERVICE)
  if (index !== -1) {
    const service = plugins[index]
    plugins.splice(index, 1)
    plugins.unshift(service)
  }

  pluginsStore.set(file, plugins)

  log('Plugins found:', plugins.length, chalk.grey(file))

  if (resetApi || (autoLoadApi && !pluginApiInstances.has(file))) {
    await resetPluginApi({ file, lightApi }, context)
  }
  return plugins
}
```

`list` 方法首先会获取 package.json 里 `devDependencies` 和 `dependencies` 字段中的 UI 插件，接着执行 `resetPluginApi` 函数调用 UI 插件的 API，`resetPluginApi` 方法部分代码如下：

```js
function resetPluginApi ({ file, lightApi }, context) {
  return new Promise((resolve, reject) => {
    // ...
    // Cyclic dependency with projects connector
    setTimeout(async () => {
      // ...
      pluginApi = new PluginApi({
        plugins,
        file,
        project,
        lightMode: lightApi
      }, context)
      pluginApiInstances.set(file, pluginApi)

      // Run Plugin API
      // 默认的插件 suggest,task,config,widgets
      runPluginApi(path.resolve(__dirname, '../../'), pluginApi, context, 'ui-defaults')

      // devDependencies dependencies 插件
      plugins.forEach(plugin => runPluginApi(plugin.id, pluginApi, context))
      // Local plugins
      // package.json 中 vuePlugins.ui 插件
      const { pkg, pkgContext } = pkgStore.get(file)
      if (pkg.vuePlugins && pkg.vuePlugins.ui) {
        const files = pkg.vuePlugins.ui
        if (Array.isArray(files)) {
          for (const file of files) {
            runPluginApi(pkgContext, pluginApi, context, file)
          }
        }
      }
      // Add client addons
      pluginApi.clientAddons.forEach(options => {
        clientAddons.add(options, context)
      })
      // Add views
      for (const view of pluginApi.views) {
        await views.add({ view, project }, context)
      }
      // Register widgets
      for (const definition of pluginApi.widgetDefs) {
        await widgets.registerDefinition({ definition, project }, context)
      }
      // callHook ...
      // Load widgets for current project
      widgets.load(context)
      resolve(true)
    })
  })
}
```

`resetPluginApi` 方法主要利用函数 `runPluginApi` 执行所有 UI 插件的 PluginAPI，这里的 UI 插件来源主要有三部分组成：

- **内置 UI 插件**：包括了配置插件，建议插件（vue-router，vuex），任务插件以及看板部分的 widget 插件
- **package.json UI 插件**：项目中依赖的 UI 插件，可以通过 vuePlugins.resolveFrom 指定 package.json 位置
- **vuePlugins.ui**： package.json 中 vuePlugins 字段中的 UI 插件，这样可以直接访问插件 API

还是按照流程继续看下 `runPluginApi` 的核心代码：

```js
function runPluginApi (id, pluginApi, context, filename = 'ui') {
  // ...
  try {
    module = loadModule(`${id}/${filename}`, pluginApi.cwd, true)
  } catch (e) {}
  if (module) {
    if (typeof module !== 'function') { } else {
      pluginApi.pluginId = id
      try {
        module(pluginApi)
        log('Plugin API loaded for', name, chalk.grey(pluginApi.cwd))
      } catch (e) {}
      pluginApi.pluginId = null
    }
  }
}
```

首先尝试加载 UI 插件的 ui.js (也可以ui/index.js)，对于内置的 UI 插件，则加载 id/ui-defaults/index.js，加载完成以后则执行其 PluginAPI，[PluginAPI](https://cli.vuejs.org/zh/dev-guide/ui-api.html#ui-文件) 提供了很多的方法来增强项目的配置和任务以及分享数据和在进程间进行通信，具体查看官方文档，PluginAPI 在整个插件机制中是十分重要的一部分。在加载完所有 UI 插件后，则加载 PluginAPI 实例中 `addons`， `views` 和 `widgetDefs` 注册的 vue 组件。以 `client addons` 为例简单看下：

```js
function add (options, context) {
  if (findOne(options.id)) remove(options.id, context)

  addons.push(options)
  context.pubsub.publish(channels.CLIENT_ADDON_ADDED, {
    clientAddonAdded: options
  })
}
```

当执行 `clientAddons.add(options, context)` 会发布一个订阅，而 client 端在 `cli-ui/src/components/client-addon/ClientAddonLoader.vue` 中启用了 `client_addon_added` 订阅：

```js
apollo: {
  clientAddons: {
    query: CLIENT_ADDONS,
    fetchPolicy: 'no-cache',
    manual: true,
    result ({ data: { clientAddons }, stale }) {
      if (!stale) {
        clientAddons.forEach(this.loadAddon)
        this.$_lastRead = Date.now()
      }
    }
  },

  $subscribe: {
    clientAddonAdded: {
      query: CLIENT_ADDON_ADDED,
      result ({ data }) {
        if (this.$_lastRead && Date.now() - this.$_lastRead > 1000) {
          this.loadAddon(data.clientAddonAdded)
        }
      }
    }
  }
},
```

当在 server 端发布了一个订阅后，client 端会就是执行 `loadAddon` 从而加载客户端 addon 包，`loadAddon` 代码如下：

```js
loadAddon (addon) {
  // eslint-disable-next-line no-console
  console.log(`[UI] Loading client addon ${addon.id} (${addon.url})...`)
  const script = document.createElement('script')
  script.setAttribute('src', addon.url)
  document.body.appendChild(script)
}
```

`loadAddon` 方法通过 `<script>` 标签的方式将客户端 addon 包引入，view，widgets 这就暂不分析了，可自行查看下。 在 UI 插件加载完毕后，会执行对应的钩子回调 callHook。

```js
if (projectId !== project.id) {
  callHook({
    id: 'projectOpen',
    args: [project, projects.getLast(context)],
    file
  }, context)
} else {
  callHook({
    id: 'pluginReload',
    args: [project],
    file
  }, context)

  // View open hook
  const currentView = views.getCurrent()
  if (currentView) views.open(currentView.id)
}
```

最后再加载当前项目的`widgets`，到这里加载插件，即下面这段代码执行完毕：

```js
await plugins.list(project.path, context)
```

接着看 `open` 函数剩下的部分:

```js
// Date
context.db.get('projects').find({ id }).assign({
  openDate: Date.now()
}).write()
// Save for next time
context.db.set('config.lastOpenProject', id).write()
log('Project open', id, project.path)
return project
```

这段代码的作用就是将当前项目的信息存储在本地 db 中作为下次默认打开，执行到这里打开项目 `importProject` 的整个过程就分析完了。



## 6. 结尾

剩余的几个命令`init config upgrade info`等，就不再继续介绍了，因为有了前面的基础，后面这几个命令理解起来也会相对轻松，加上最近时间有限，所以`vue cli`暂时写到这里