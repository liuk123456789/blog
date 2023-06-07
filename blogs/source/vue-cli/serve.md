---
title: vue-cli-第五篇
date: 2023-06-02
categories: 
 - 源码解读
tags:
 - vue-cli-第五篇
sidebar: auto
---

## 1. 前言

`vue serve` ：在开发环境模式下启动一个服务器 

## 2. 命令详情

```javascript
program
  .command('serve')
  .description('alias of "npm run serve" in the current project')
  .allowUnknownOption()
  .action(() => {
    require('../lib/util/runNpmScript')('serve', process.argv.slice(3))
  })
```

通过以上代码可以看出，通过`runNpnScript`运行脚本执行命令，起始执行的还是`cli-service/bin/vue-cli-service`的脚本，调用的是`service.run`这个命令

## 3. Service实例化

```javascript
// When useBuiltIn === false, built-in plugins are disabled. This is mostly
// for testing.
this.plugins = this.resolvePlugins(plugins, useBuiltIn)

resolvePlugins (inlinePlugins, useBuiltIn) {
    const idToPlugin = (id, absolutePath) => ({
      id: id.replace(/^.\//, 'built-in:'),
      apply: require(absolutePath || id)
    })

    let plugins

    const builtInPlugins = [
      './commands/serve', // 这里会去加载commands/serve.js 文件，后面会说到
      './commands/build',
      './commands/inspect',
      './commands/help',
      // config plugins are order sensitive
      './config/base',
      './config/assets',
      './config/css',
      './config/prod',
      './config/app'
    ].map((id) => idToPlugin(id))

    if (inlinePlugins) {
      plugins = useBuiltIn !== false
        ? builtInPlugins.concat(inlinePlugins)
        : inlinePlugins
    } else {
      const projectPlugins = Object.keys(this.pkg.devDependencies || {})
        .concat(Object.keys(this.pkg.dependencies || {}))
        .filter(isPlugin)
        .map(id => {
          if (
            this.pkg.optionalDependencies &&
            id in this.pkg.optionalDependencies
          ) {
            let apply = loadModule(id, this.pkgContext)
            if (!apply) {
              warn(`Optional dependency ${id} is not installed.`)
              apply = () => {}
            }

            return { id, apply }
          } else {
            return idToPlugin(id, resolveModule(id, this.pkgContext))
          }
        })

      plugins = builtInPlugins.concat(projectPlugins)
    }

    // Local plugins
    if (this.pkg.vuePlugins && this.pkg.vuePlugins.service) {
      const files = this.pkg.vuePlugins.service
      if (!Array.isArray(files)) {
        throw new Error(`Invalid type for option 'vuePlugins.service', expected 'array' but got ${typeof files}.`)
      }
      plugins = plugins.concat(files.map(file => ({
        id: `local:${file}`,
        apply: loadModule(`./${file}`, this.pkgContext)
      })))
    }
    debug('vue:plugins')(plugins)

    const orderedPlugins = sortPlugins(plugins)
    debug('vue:plugins-ordered')(orderedPlugins)

    return orderedPlugins
}
```

注意的是，类构造函数执行时会执行`resolvePlugins`，而此方法会去加载`commands/serve.js`文件，后面会说到这个

## 4. Service的run方法

```javascript
async run (name, args = {}, rawArgv = []) {
    // resolve mode
    // prioritize inline --mode
    // fallback to resolved default modes from plugins or development if --watch is defined
    // 解析mode 如：vue-cli-service serve --mode development
    const mode = args.mode || (name === 'build' && args.watch ? 'development' : this.modes[name])

    // 跳过插件解析
    this.setPluginsToSkip(args, rawArgv)

    // load env variables, load user config, apply plugins
    await this.init(mode)

    args._ = args._ || []
    let command = this.commands[name]
    if (!command && name) {
      error(`command "${name}" does not exist.`)
      process.exit(1)
    }
    if (!command || args.help || args.h) {
      command = this.commands.help
    } else {
      args._.shift() // remove command itself
      rawArgv.shift()
    }
    const { fn } = command
    return fn(args, rawArgv)
}
```

以下是代码的一些注解

1. 获取**mode**

   ```javascript
   const mode = args.mode || (name === 'build' && args.watch ? 'development' : this.modes[name])
   ```

2. **setPluginsToSkip**

   跳过插件解析

   ```javascript
   setPluginsToSkip (args, rawArgv) {
       let skipPlugins = args['skip-plugins']
       const pluginsToSkip = new Set()
       if (skipPlugins) {
         // When only one appearence, convert to array to prevent duplicate code
         if (!Array.isArray(skipPlugins)) {
           skipPlugins = Array.from([skipPlugins])
         }
         // Iter over all --skip-plugins appearences
         for (const value of skipPlugins.values()) {
           for (const plugin of value.split(',').map(id => resolvePluginId(id))) {
             pluginsToSkip.add(plugin)
           }
         }
       }
       this.pluginsToSkip = pluginsToSkip
   
       delete args['skip-plugins']
       // Delete all --skip-plugin appearences
       let index
       while ((index = rawArgv.indexOf('--skip-plugins')) > -1) {
         rawArgv.splice(index, 2) // Remove the argument and its value
       }
   }
   ```

3. **init**

   ```javascript
   init (mode = process.env.VUE_CLI_MODE) {
       if (this.initialized) {
         return
       }
       this.initialized = true
       this.mode = mode
   
       // load mode .env
       if (mode) {
         this.loadEnv(mode)
       }
       // load base .env
       this.loadEnv()
   
       // load user config
       const userOptions = this.loadUserOptions()
       const loadedCallback = (loadedUserOptions) => {
         this.projectOptions = defaultsDeep(loadedUserOptions, defaults())
   
         debug('vue:project-config')(this.projectOptions)
   
         // apply plugins.
         this.plugins.forEach(({ id, apply }) => {
           if (this.pluginsToSkip.has(id)) return
           apply(new PluginAPI(id, this), this.projectOptions)
         })
   
         // apply webpack configs from project config file
         if (this.projectOptions.chainWebpack) {
           this.webpackChainFns.push(this.projectOptions.chainWebpack)
         }
         if (this.projectOptions.configureWebpack) {
           this.webpackRawConfigFns.push(this.projectOptions.configureWebpack)
         }
       }
   
       if (isPromise(userOptions)) {
         return userOptions.then(loadedCallback)
       } else {
         return loadedCallback(userOptions)
       }
   }
   ```

   主要就是加载环境变量&插件解析

   **loadEnv**加载环境变量

   ```javascript
   loadEnv (mode) {
       const logger = debug('vue:env')
       const basePath = path.resolve(this.context, `.env${mode ? `.${mode}` : ``}`)
       const localPath = `${basePath}.local`
   
       const load = envPath => {
         try {
           const env = dotenv.config({ path: envPath, debug: process.env.DEBUG })
           dotenvExpand(env)
           logger(envPath, env)
         } catch (err) {
           // only ignore error if file is not found
           if (err.toString().indexOf('ENOENT') < 0) {
             error(err)
           }
         }
       }
   
       load(localPath)
       load(basePath)
   
       // by default, NODE_ENV and BABEL_ENV are set to "development" unless mode
       // is production or test. However the value in .env files will take higher
       // priority.
       if (mode) {
         // always set NODE_ENV during tests
         // as that is necessary for tests to not be affected by each other
         const shouldForceDefaultEnv = (
           process.env.VUE_CLI_TEST &&
           !process.env.VUE_CLI_TEST_TESTING_ENV
         )
         const defaultNodeEnv = (mode === 'production' || mode === 'test')
           ? mode
           : 'development'
         if (shouldForceDefaultEnv || process.env.NODE_ENV == null) {
           process.env.NODE_ENV = defaultNodeEnv
         }
         if (shouldForceDefaultEnv || process.env.BABEL_ENV == null) {
           process.env.BABEL_ENV = defaultNodeEnv
         }
       }
   }
   ```

   1. 加载本地的环境文件，环境文件的作用就是设置某个模式下特有的环境变量
   2. 加载环境变量其实要注意的就是优先级的问题，下面的代码已经体现的非常明显了，先加载 `.env.mode.local`，然后加载 `.env.mode`最后再加载`.env`
   3. 由于环境变量不会被覆盖，因此`.env.mode.local` 的优先级最高，`.env.mode.local`与` .env.mode `的区别就是前者会被`git`忽略掉。另外一点要注意的就是环境文件不会覆盖`Vue CLI`启动时已经存在的环境变量。

   **newPluginApi**用于内置插件的注册，生成`webpack`配置等

   代码如下

   ```javascript
   const path = require('path')
   const hash = require('hash-sum')
   const { semver, matchesPluginId } = require('@vue/cli-shared-utils')
   
   // Note: if a plugin-registered command needs to run in a specific default mode,
   // the plugin needs to expose it via `module.exports.defaultModes` in the form
   // of { [commandName]: mode }. This is because the command mode needs to be
   // known and applied before loading user options / applying plugins.
   
   class PluginAPI {
     /**
      * @param {string} id - Id of the plugin.
      * @param {Service} service - A vue-cli-service instance.
      */
     constructor (id, service) {
       this.id = id
       this.service = service
     }
   
     get version () {
       return require('../package.json').version
     }
   
     assertVersion (range) {
       if (typeof range === 'number') {
         if (!Number.isInteger(range)) {
           throw new Error('Expected string or integer value.')
         }
         range = `^${range}.0.0-0`
       }
       if (typeof range !== 'string') {
         throw new Error('Expected string or integer value.')
       }
   
       if (semver.satisfies(this.version, range, { includePrerelease: true })) return
   
       throw new Error(
         `Require @vue/cli-service "${range}", but was loaded with "${this.version}".`
       )
     }
   
     /**
      * Current working directory.
      */
     getCwd () {
       return this.service.context
     }
   
     /**
      * Resolve path for a project.
      *
      * @param {string} _path - Relative path from project root
      * @return {string} The resolved absolute path.
      */
     resolve (_path) {
       return path.resolve(this.service.context, _path)
     }
   
     /**
      * Check if the project has a given plugin.
      *
      * @param {string} id - Plugin id, can omit the (@vue/|vue-|@scope/vue)-cli-plugin- prefix
      * @return {boolean}
      */
     hasPlugin (id) {
       return this.service.plugins.some(p => matchesPluginId(id, p.id))
     }
   
     /**
      * Register a command that will become available as `vue-cli-service [name]`.
      *
      * @param {string} name
      * @param {object} [opts]
      *   {
      *     description: string,
      *     usage: string,
      *     options: { [string]: string }
      *   }
      * @param {function} fn
      *   (args: { [string]: string }, rawArgs: string[]) => ?Promise
      */
     registerCommand (name, opts, fn) {
       if (typeof opts === 'function') {
         fn = opts
         opts = null
       }
       this.service.commands[name] = { fn, opts: opts || {} }
     }
   
     /**
      * Register a function that will receive a chainable webpack config
      * the function is lazy and won't be called until `resolveWebpackConfig` is
      * called
      *
      * @param {function} fn
      */
     chainWebpack (fn) {
       this.service.webpackChainFns.push(fn)
     }
   
     /**
      * Register
      * - a webpack configuration object that will be merged into the config
      * OR
      * - a function that will receive the raw webpack config.
      *   the function can either mutate the config directly or return an object
      *   that will be merged into the config.
      *
      * @param {object | function} fn
      */
     configureWebpack (fn) {
       this.service.webpackRawConfigFns.push(fn)
     }
   
     /**
      * Register a dev serve config function. It will receive the express `app`
      * instance of the dev server.
      *
      * @param {function} fn
      */
     configureDevServer (fn) {
       this.service.devServerConfigFns.push(fn)
     }
   
     /**
      * Resolve the final raw webpack config, that will be passed to webpack.
      *
      * @param {ChainableWebpackConfig} [chainableConfig]
      * @return {object} Raw webpack config.
      */
     resolveWebpackConfig (chainableConfig) {
       return this.service.resolveWebpackConfig(chainableConfig)
     }
   
     /**
      * Resolve an intermediate chainable webpack config instance, which can be
      * further tweaked before generating the final raw webpack config.
      * You can call this multiple times to generate different branches of the
      * base webpack config.
      * See https://github.com/mozilla-neutrino/webpack-chain
      *
      * @return {ChainableWebpackConfig}
      */
     resolveChainableWebpackConfig () {
       return this.service.resolveChainableWebpackConfig()
     }
   
     /**
      * Generate a cache identifier from a number of variables
      */
     genCacheConfig (id, partialIdentifier, configFiles = []) {
       const fs = require('fs')
       const cacheDirectory = this.resolve(`node_modules/.cache/${id}`)
   
       // replace \r\n to \n generate consistent hash
       const fmtFunc = conf => {
         if (typeof conf === 'function') {
           return conf.toString().replace(/\r\n?/g, '\n')
         }
         return conf
       }
   
       const variables = {
         partialIdentifier,
         'cli-service': require('../package.json').version,
         env: process.env.NODE_ENV,
         test: !!process.env.VUE_CLI_TEST,
         config: [
           fmtFunc(this.service.projectOptions.chainWebpack),
           fmtFunc(this.service.projectOptions.configureWebpack)
         ]
       }
   
       try {
         variables['cache-loader'] = require('cache-loader/package.json').version
       } catch (e) {
         // cache-loader is only intended to be used for webpack 4
       }
   
       if (!Array.isArray(configFiles)) {
         configFiles = [configFiles]
       }
       configFiles = configFiles.concat([
         'package-lock.json',
         'yarn.lock',
         'pnpm-lock.yaml'
       ])
   
       const readConfig = file => {
         const absolutePath = this.resolve(file)
         if (!fs.existsSync(absolutePath)) {
           return
         }
   
         if (absolutePath.endsWith('.js')) {
           // should evaluate config scripts to reflect environment variable changes
           try {
             return JSON.stringify(require(absolutePath))
           } catch (e) {
             return fs.readFileSync(absolutePath, 'utf-8')
           }
         } else {
           return fs.readFileSync(absolutePath, 'utf-8')
         }
       }
   
       variables.configFiles = configFiles.map(file => {
         const content = readConfig(file)
         return content && content.replace(/\r\n?/g, '\n')
       })
   
       const cacheIdentifier = hash(variables)
       return { cacheDirectory, cacheIdentifier }
     }
   }
   
   module.exports = PluginAPI
   ```

## 4. commands/serve.js

```javascript
const {
  info,
  error,
  hasProjectYarn,
  hasProjectPnpm,
  IpcMessenger
} = require('@vue/cli-shared-utils')
const getBaseUrl = require('../util/getBaseUrl')

const defaults = {
  host: '0.0.0.0',
  port: 8080,
  https: false
}

/** @type {import('@vue/cli-service').ServicePlugin} */
module.exports = (api, options) => {
  const baseUrl = getBaseUrl(options)
  api.registerCommand('serve', {
    description: 'start development server',
    usage: 'vue-cli-service serve [options] [entry]',
    options: {
      '--open': `open browser on server start`,
      '--copy': `copy url to clipboard on server start`,
      '--stdin': `close when stdin ends`,
      '--mode': `specify env mode (default: development)`,
      '--host': `specify host (default: ${defaults.host})`,
      '--port': `specify port (default: ${defaults.port})`,
      '--https': `use https (default: ${defaults.https})`,
      '--public': `specify the public network URL for the HMR client`,
      '--skip-plugins': `comma-separated list of plugin names to skip for this run`
    }
  }, async function serve (args) {
    info('Starting development server...')

    // although this is primarily a dev server, it is possible that we
    // are running it in a mode with a production env, e.g. in E2E tests.
    const isInContainer = checkInContainer()
    const isProduction = process.env.NODE_ENV === 'production'

    const { chalk } = require('@vue/cli-shared-utils')
    const webpack = require('webpack')
    const WebpackDevServer = require('webpack-dev-server')
    const portfinder = require('portfinder')
    const prepareURLs = require('../util/prepareURLs')
    const prepareProxy = require('../util/prepareProxy')
    const launchEditorMiddleware = require('launch-editor-middleware')
    const validateWebpackConfig = require('../util/validateWebpackConfig')
    const isAbsoluteUrl = require('../util/isAbsoluteUrl')

    // configs that only matters for dev server
    api.chainWebpack(webpackConfig => {
      if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
        if (!webpackConfig.get('devtool')) {
          webpackConfig
            .devtool('eval-cheap-module-source-map')
        }

        // https://github.com/webpack/webpack/issues/6642
        // https://github.com/vuejs/vue-cli/issues/3539
        webpackConfig
          .output
            .globalObject(`(typeof self !== 'undefined' ? self : this)`)

        if (
          !process.env.VUE_CLI_TEST &&
          (!options.devServer.client ||
            options.devServer.client.progress !== false)
        ) {
          // the default progress plugin won't show progress due to infrastructreLogging.level
          webpackConfig
            .plugin('progress')
            .use(require('progress-webpack-plugin'))
        }
      }
    })

    // resolve webpack config
    const webpackConfig = api.resolveWebpackConfig()

    // check for common config errors
    validateWebpackConfig(webpackConfig, api, options)

    // load user devServer options with higher priority than devServer
    // in webpack config
    const projectDevServerOptions = Object.assign(
      webpackConfig.devServer || {},
      options.devServer
    )

    // expose advanced stats
    if (args.dashboard) {
      const DashboardPlugin = require('../webpack/DashboardPlugin')
      webpackConfig.plugins.push(new DashboardPlugin({
        type: 'serve'
      }))
    }

    // entry arg
    const entry = args._[0]
    if (entry) {
      webpackConfig.entry = {
        app: api.resolve(entry)
      }
    }

    // resolve server options
    const modesUseHttps = ['https', 'http2']
    const serversUseHttps = ['https', 'spdy']
    const optionsUseHttps = modesUseHttps.some(modeName => !!projectDevServerOptions[modeName]) ||
      (typeof projectDevServerOptions.server === 'string' && serversUseHttps.includes(projectDevServerOptions.server)) ||
      (typeof projectDevServerOptions.server === 'object' && projectDevServerOptions.server !== null && serversUseHttps.includes(projectDevServerOptions.server.type))
    const useHttps = args.https || optionsUseHttps || defaults.https
    const protocol = useHttps ? 'https' : 'http'
    const host = args.host || process.env.HOST || projectDevServerOptions.host || defaults.host
    portfinder.basePort = args.port || process.env.PORT || projectDevServerOptions.port || defaults.port
    const port = await portfinder.getPortPromise()
    const rawPublicUrl = args.public || projectDevServerOptions.public
    const publicUrl = rawPublicUrl
      ? /^[a-zA-Z]+:\/\//.test(rawPublicUrl)
        ? rawPublicUrl
        : `${protocol}://${rawPublicUrl}`
      : null
    const publicHost = publicUrl ? /^[a-zA-Z]+:\/\/([^/?#]+)/.exec(publicUrl)[1] : undefined

    const urls = prepareURLs(
      protocol,
      host,
      port,
      isAbsoluteUrl(baseUrl) ? '/' : baseUrl
    )
    const localUrlForBrowser = publicUrl || urls.localUrlForBrowser

    const proxySettings = prepareProxy(
      projectDevServerOptions.proxy,
      api.resolve('public')
    )

    // inject dev & hot-reload middleware entries
    let webSocketURL
    if (!isProduction) {
      if (publicHost) {
        // explicitly configured via devServer.public
        webSocketURL = {
          protocol: protocol === 'https' ? 'wss' : 'ws',
          hostname: publicHost,
          port
        }
      } else if (isInContainer) {
        // can't infer public network url if inside a container
        // infer it from the browser instead
        webSocketURL = 'auto://0.0.0.0:0/ws'
      } else {
        // otherwise infer the url from the config
        webSocketURL = {
          protocol: protocol === 'https' ? 'wss' : 'ws',
          hostname: urls.lanUrlForConfig || 'localhost',
          port
        }
      }

      if (process.env.APPVEYOR) {
        webpackConfig.plugins.push(
          new webpack.EntryPlugin(__dirname, 'webpack/hot/poll?500', { name: undefined })
        )
      }
    }

    const { projectTargets } = require('../util/targets')
    const supportsIE = !!projectTargets
    if (supportsIE) {
      webpackConfig.plugins.push(
        // must use undefined as name,
        // to avoid dev server establishing an extra ws connection for the new entry
        new webpack.EntryPlugin(__dirname, 'whatwg-fetch', { name: undefined })
      )
    }

    // fixme: temporary fix to suppress dev server logging
    // should be more robust to show necessary info but not duplicate errors
    webpackConfig.infrastructureLogging = { ...webpackConfig.infrastructureLogging, level: 'none' }
    webpackConfig.stats = 'errors-only'

    // create compiler
    const compiler = webpack(webpackConfig)

    // handle compiler error
    compiler.hooks.failed.tap('vue-cli-service serve', msg => {
      error(msg)
      process.exit(1)
    })

    // create server
    const server = new WebpackDevServer(Object.assign({
      historyApiFallback: {
        disableDotRule: true,
        htmlAcceptHeaders: [
          'text/html',
          'application/xhtml+xml'
        ],
        rewrites: genHistoryApiFallbackRewrites(baseUrl, options.pages)
      },
      hot: !isProduction
    }, projectDevServerOptions, {
      host,
      port,

      server: {
        type: protocol,
        ...(typeof projectDevServerOptions.server === 'object'
          ? projectDevServerOptions.server
          : {})
      },

      proxy: proxySettings,

      static: {
        directory: api.resolve('public'),
        publicPath: options.publicPath,
        watch: !isProduction,

        ...projectDevServerOptions.static
      },

      client: {
        webSocketURL,

        logging: 'none',
        overlay: isProduction // TODO disable this
          ? false
          : { warnings: false, errors: true },
        progress: !process.env.VUE_CLI_TEST,

        ...projectDevServerOptions.client
      },

      open: args.open || projectDevServerOptions.open,
      setupExitSignals: true,

      setupMiddlewares (middlewares, devServer) {
        // launch editor support.
        // this works with vue-devtools & @vue/cli-overlay
        devServer.app.use('/__open-in-editor', launchEditorMiddleware(() => console.log(
          `To specify an editor, specify the EDITOR env variable or ` +
          `add "editor" field to your Vue project config.\n`
        )))

        // allow other plugins to register middlewares, e.g. PWA
        // todo: migrate to the new API interface
        api.service.devServerConfigFns.forEach(fn => fn(devServer.app, devServer))

        if (projectDevServerOptions.setupMiddlewares) {
          return projectDevServerOptions.setupMiddlewares(middlewares, devServer)
        }

        return middlewares
      }
    }), compiler)

    if (args.stdin) {
      process.stdin.on('end', () => {
        server.stopCallback(() => {
          process.exit(0)
        })
      })

      process.stdin.resume()
    }

    // on appveyor, killing the process with SIGTERM causes execa to
    // throw error
    if (process.env.VUE_CLI_TEST) {
      process.stdin.on('data', data => {
        if (data.toString() === 'close') {
          console.log('got close signal!')
          server.stopCallback(() => {
            process.exit(0)
          })
        }
      })
    }

    return new Promise((resolve, reject) => {
      // log instructions & open browser on first compilation complete
      let isFirstCompile = true
      compiler.hooks.done.tap('vue-cli-service serve', stats => {
        if (stats.hasErrors()) {
          return
        }

        let copied = ''
        if (isFirstCompile && args.copy) {
          try {
            require('clipboardy').writeSync(localUrlForBrowser)
            copied = chalk.dim('(copied to clipboard)')
          } catch (_) {
            /* catch exception if copy to clipboard isn't supported (e.g. WSL), see issue #3476 */
          }
        }

        const networkUrl = publicUrl
          ? publicUrl.replace(/([^/])$/, '$1/')
          : urls.lanUrlForTerminal

        console.log()
        console.log(`  App running at:`)
        console.log(`  - Local:   ${chalk.cyan(urls.localUrlForTerminal)} ${copied}`)
        if (!isInContainer) {
          console.log(`  - Network: ${chalk.cyan(networkUrl)}`)
        } else {
          console.log()
          console.log(chalk.yellow(`  It seems you are running Vue CLI inside a container.`))
          if (!publicUrl && options.publicPath && options.publicPath !== '/') {
            console.log()
            console.log(chalk.yellow(`  Since you are using a non-root publicPath, the hot-reload socket`))
            console.log(chalk.yellow(`  will not be able to infer the correct URL to connect. You should`))
            console.log(chalk.yellow(`  explicitly specify the URL via ${chalk.blue(`devServer.public`)}.`))
            console.log()
          }
          console.log(chalk.yellow(`  Access the dev server via ${chalk.cyan(
            `${protocol}://localhost:<your container's external mapped port>${options.publicPath}`
          )}`))
        }
        console.log()

        if (isFirstCompile) {
          isFirstCompile = false

          if (!isProduction) {
            const buildCommand = hasProjectYarn(api.getCwd()) ? `yarn build` : hasProjectPnpm(api.getCwd()) ? `pnpm run build` : `npm run build`
            console.log(`  Note that the development build is not optimized.`)
            console.log(`  To create a production build, run ${chalk.cyan(buildCommand)}.`)
          } else {
            console.log(`  App is served in production mode.`)
            console.log(`  Note this is for preview or E2E testing only.`)
          }
          console.log()

          // Send final app URL
          if (args.dashboard) {
            const ipc = new IpcMessenger()
            ipc.send({
              vueServe: {
                url: localUrlForBrowser
              }
            })
          }

          // resolve returned Promise
          // so other commands can do api.service.run('serve').then(...)
          resolve({
            server,
            url: localUrlForBrowser
          })
        } else if (process.env.VUE_CLI_TEST) {
          // signal for test to check HMR
          console.log('App updated')
        }
      })

      server.start().catch(err => reject(err))
    })
  })
}

// https://stackoverflow.com/a/20012536
function checkInContainer () {
  if ('CODESANDBOX_SSE' in process.env) {
    return true
  }
  const fs = require('fs')
  if (fs.existsSync(`/proc/1/cgroup`)) {
    const content = fs.readFileSync(`/proc/1/cgroup`, 'utf-8')
    return /:\/(lxc|docker|kubepods(\.slice)?)\//.test(content)
  }
}

function genHistoryApiFallbackRewrites (baseUrl, pages = {}) {
  const path = require('path')
  const multiPageRewrites = Object
    .keys(pages)
    // sort by length in reversed order to avoid overrides
    // eg. 'page11' should appear in front of 'page1'
    .sort((a, b) => b.length - a.length)
    .map(name => ({
      from: new RegExp(`^/${name}`),
      to: path.posix.join(baseUrl, pages[name].filename || `${name}.html`)
    }))
  return [
    ...multiPageRewrites,
    { from: /./, to: path.posix.join(baseUrl, 'index.html') }
  ]
}

module.exports.defaultModes = {
  serve: 'development'
}

```

可以分为以下四个部分

1. **获取 webpack 配置：api.resolveWebpackConfig()** 

   `上一篇涉及到了这里，可以看下`

2. **获取 devServer 配置**

   获取`devServer`配置指的是获取 [webpack-dev-server 配置](https://webpack.js.org/configuration/dev-server/)，主要有两个地方可以配置， 第一种就是直接在`webpack`中配置，另外一种就是在 `vue.config.js` 或者 `package.vue` 中配置，后者配置方式拥有更高地优先级。在获取用户配置的 `devServer` 以后，还会对这些配置进行解析，比如用户没有配置，会使用默认的 `devServer` 配置，另外`CLI`参数或者 `process.env` 中 `devServer` 拥有更高的优先级，以 `devServer.port` 为例， `vue.config.js` 如下：

   ```javascript
   module.exports = {
     devServer: {
       port: 8080
     },
     configureWebpack: {
       devServer: {
         port: 8081
       }
     }
   }
   ```

   这种情况会优先采用 `devServer.port` 即 port 为 8080，因为它的优先级比较高，源码如下：

   ```javascript
   const projectDevServerOptions = Object.assign(
     webpackConfig.devServer || {},
     options.devServer
   )
   ```

   如果直接输入以下命令，则 `devServer.port` 为 8082

   ```javascript
   vue-cli-service serve --port 8082
   ```

   还有种情况，在项目中存在环境变量文件，比如存在 `.env.development` 文件，内容如下：

   ```javascript
   PORT=8083
   ```

   执行 `vue-cli-service serve` 时，`devServer.port` 则为 8083。如果 `process.env` 和命令行参数中含有一样的配置，则参数中的配置有更高 的优先级，源码实现如下：

   ```js
   portfinder.basePort = args.port || process.env.PORT || projectDevServerOptions.port || defaults.port
   const port = await portfinder.getPortPromise()
   ```

3. **注入 webpack-dev-server 和 hot-reload（HRM）中间件入口**

   先说下为什么要注入 `webpack-dev-server` 和 `hot-reload（HRM）`中间件入口。在开发中我们利用 `webpack-dev-server` 提供一个小型 Express 服务器 ，从而可以为 webpack 打包生成的资源文件提供 web 服务，并用 webpack 自带的 HRM 模块实现热更新。在 vue-cli 2.X 中 我们通过以下命令来启动 `webpack-dev-server`

   ```bash
   webpack-dev-server --inline --progress --config build/webpack.dev.conf.js
   ```

   但在 `vue-cli`中则没有通过 CLI 的方式来启动 `webpack-dev-server`，而是使用 `Node.js Api`方式，即使用 `vue-cli-service serve` 命令创建一个服务器实例：

   ```js
   const compiler = webpack(webpackConfig)
   new WebpackDevServer(compiler, {})
   ```

   这种方式就需要将 `webpack-dev-server` 客户端配置到`webpack`打包的入口文件中，如果还要实现热替换（`HMR`），则还需要将 `webpack/hot/dev-server` 文件加入到 `webpack`入口文件中，因此在源码中就有了以下代码：

   ```js
   // inject dev & hot-reload middleware entries
   let webSocketURL
   if (!isProduction) {
     if (publicHost) {
       // explicitly configured via devServer.public
       webSocketURL = {
         protocol: protocol === 'https' ? 'wss' : 'ws',
         hostname: publicHost,
         port
       }
     } else if (isInContainer) {
       // can't infer public network url if inside a container
       // infer it from the browser instead
       webSocketURL = 'auto://0.0.0.0:0/ws'
     } else {
       // otherwise infer the url from the config
       webSocketURL = {
         protocol: protocol === 'https' ? 'wss' : 'ws',
         hostname: urls.lanUrlForConfig || 'localhost',
         port
       }
     }
   
     if (process.env.APPVEYOR) {
       webpackConfig.plugins.push(
         new webpack.EntryPlugin(__dirname, 'webpack/hot/poll?500', { name: undefined })
       )
     }
   }
   ```

4. **创建 webpack-dev-server 实例**

   ```javascript
   // create server
   const server = new WebpackDevServer(Object.assign({
     historyApiFallback: {
       disableDotRule: true,
       htmlAcceptHeaders: [
         'text/html',
         'application/xhtml+xml'
       ],
       rewrites: genHistoryApiFallbackRewrites(baseUrl, options.pages)
     },
     hot: !isProduction
   }, projectDevServerOptions, {
     host,
     port,
   
     server: {
       type: protocol,
       ...(typeof projectDevServerOptions.server === 'object'
         ? projectDevServerOptions.server
         : {})
     },
   
     proxy: proxySettings,
   
     static: {
       directory: api.resolve('public'),
       publicPath: options.publicPath,
       watch: !isProduction,
   
       ...projectDevServerOptions.static
     },
   
     client: {
       webSocketURL,
   
       logging: 'none',
       overlay: isProduction // TODO disable this
         ? false
         : { warnings: false, errors: true },
       progress: !process.env.VUE_CLI_TEST,
   
       ...projectDevServerOptions.client
     },
   
     open: args.open || projectDevServerOptions.open,
     setupExitSignals: true,
   
     setupMiddlewares (middlewares, devServer) {
       // launch editor support.
       // this works with vue-devtools & @vue/cli-overlay
       devServer.app.use('/__open-in-editor', launchEditorMiddleware(() => console.log(
         `To specify an editor, specify the EDITOR env variable or ` +
         `add "editor" field to your Vue project config.\n`
       )))
   
       // allow other plugins to register middlewares, e.g. PWA
       // todo: migrate to the new API interface
       api.service.devServerConfigFns.forEach(fn => fn(devServer.app, devServer))
   
       if (projectDevServerOptions.setupMiddlewares) {
         return projectDevServerOptions.setupMiddlewares(middlewares, devServer)
       }
   
       return middlewares
     }
   }), compiler)
   
   return new Promise((resolve, reject) => {
     // log instructions & open browser on first compilation complete
     let isFirstCompile = true
     // webpack的compiler暴露的钩子，可以参考webpack系列的自定义plugin
     compiler.hooks.done.tap('vue-cli-service serve', stats => {
       if (stats.hasErrors()) {
         return
       }
   
       let copied = ''
       if (isFirstCompile && args.copy) {
         try {
           require('clipboardy').writeSync(localUrlForBrowser)
           copied = chalk.dim('(copied to clipboard)')
         } catch (_) {
           /* catch exception if copy to clipboard isn't supported (e.g. WSL), see issue #3476 */
         }
       }
   
       const networkUrl = publicUrl
         ? publicUrl.replace(/([^/])$/, '$1/')
         : urls.lanUrlForTerminal
   
       console.log()
       console.log(`  App running at:`)
       console.log(`  - Local:   ${chalk.cyan(urls.localUrlForTerminal)} ${copied}`)
       if (!isInContainer) {
         console.log(`  - Network: ${chalk.cyan(networkUrl)}`)
       } else {
         console.log()
         console.log(chalk.yellow(`  It seems you are running Vue CLI inside a container.`))
         if (!publicUrl && options.publicPath && options.publicPath !== '/') {
           console.log()
           console.log(chalk.yellow(`  Since you are using a non-root publicPath, the hot-reload socket`))
           console.log(chalk.yellow(`  will not be able to infer the correct URL to connect. You should`))
           console.log(chalk.yellow(`  explicitly specify the URL via ${chalk.blue(`devServer.public`)}.`))
           console.log()
         }
         console.log(chalk.yellow(`  Access the dev server via ${chalk.cyan(
           `${protocol}://localhost:<your container's external mapped port>${options.publicPath}`
         )}`))
       }
       console.log()
   
       if (isFirstCompile) {
         isFirstCompile = false
   
         if (!isProduction) {
           const buildCommand = hasProjectYarn(api.getCwd()) ? `yarn build` : hasProjectPnpm(api.getCwd()) ? `pnpm run build` : `npm run build`
           console.log(`  Note that the development build is not optimized.`)
           console.log(`  To create a production build, run ${chalk.cyan(buildCommand)}.`)
         } else {
           console.log(`  App is served in production mode.`)
           console.log(`  Note this is for preview or E2E testing only.`)
         }
         console.log()
   
         // Send final app URL
         if (args.dashboard) {
           const ipc = new IpcMessenger()
           ipc.send({
             vueServe: {
               url: localUrlForBrowser
             }
           })
         }
   
         // resolve returned Promise
         // so other commands can do api.service.run('serve').then(...)
         resolve({
           server,
           url: localUrlForBrowser
         })
       } else if (process.env.VUE_CLI_TEST) {
         // signal for test to check HMR
         console.log('App updated')
       }
     })
   
     server.start().catch(err => reject(err))
   })
   ```