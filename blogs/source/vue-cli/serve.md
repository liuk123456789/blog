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

## 5. commands/serve.js

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

## 6. webpack配置相关

看完了`serve`相关代码，除了`devServer`，其他的`webpack`配置代码中确认有体现，所以说下这块

**Service.js**

```javascript
const { defaults } = require('./options')
const loadFileConfig = require('./util/loadFileConfig')
```

`options`里面的内容是默认的基础配置，具体代码如下

**options**

```javascript
const { createSchema, validate } = require('@vue/cli-shared-utils')

const schema = createSchema(joi => joi.object({
  publicPath: joi.string().allow(''),
  outputDir: joi.string(),
  assetsDir: joi.string().allow(''),
  indexPath: joi.string(),
  filenameHashing: joi.boolean(),
  runtimeCompiler: joi.boolean(),
  transpileDependencies: joi.alternatives().try(
    joi.boolean(),
    joi.array()
  ),
  productionSourceMap: joi.boolean(),
  parallel: joi.alternatives().try(
    joi.boolean(),
    joi.number().integer()
  ),
  devServer: joi.object(),
  pages: joi.object().pattern(
    /\w+/,
    joi.alternatives().try(
      joi.string().required(),
      joi.array().items(joi.string().required()),

      joi.object().keys({
        entry: joi.alternatives().try(
          joi.string().required(),
          joi.array().items(joi.string().required())
        ).required()
      }).unknown(true)
    )
  ),
  crossorigin: joi.string().valid('', 'anonymous', 'use-credentials'),
  integrity: joi.boolean(),

  // css
  css: joi.object({
    extract: joi.alternatives().try(joi.boolean(), joi.object()),
    sourceMap: joi.boolean(),
    loaderOptions: joi.object({
      css: joi.object(),
      sass: joi.object(),
      scss: joi.object(),
      less: joi.object(),
      stylus: joi.object(),
      postcss: joi.object()
    })
  }),

  // webpack
  chainWebpack: joi.func(),
  configureWebpack: joi.alternatives().try(
    joi.object(),
    joi.func()
  ),

  // known runtime options for built-in plugins
  lintOnSave: joi.any().valid(true, false, 'error', 'warning', 'default'),
  pwa: joi.object(),

  // terser
  terser: joi.object({
    minify: joi.string().valid('terser', 'esbuild', 'swc', 'uglifyJs'),
    terserOptions: joi.object()
  }),

  // 3rd party plugin options
  pluginOptions: joi.object()
}))

exports.validate = (options, cb) => {
  validate(options, schema, cb)
}

// #2110
// https://github.com/nodejs/node/issues/19022
// in some cases cpus() returns undefined, and may simply throw in the future
function hasMultipleCores () {
  try {
    return require('os').cpus().length > 1
  } catch (e) {
    return false
  }
}

exports.defaults = () => ({
  // project deployment base
  publicPath: '/',

  // where to output built files
  outputDir: 'dist',

  // where to put static assets (js/css/img/font/...)
  assetsDir: '',

  // filename for index.html (relative to outputDir)
  indexPath: 'index.html',

  // whether filename will contain hash part
  filenameHashing: true,

  // boolean, use full build?
  runtimeCompiler: false,

  // whether to transpile all dependencies
  transpileDependencies: false,

  // sourceMap for production build?
  productionSourceMap: !process.env.VUE_CLI_TEST,

  // use thread-loader for babel & TS in production build
  // enabled by default if the machine has more than 1 cores
  parallel: hasMultipleCores(),

  // multi-page config
  pages: undefined,

  // <script type="module" crossorigin="use-credentials">
  // #1656, #1867, #2025
  crossorigin: undefined,

  // subresource integrity
  integrity: false,

  css: {
    // extract: true,
    // modules: false,
    // sourceMap: false,
    // loaderOptions: {}
  },

  // whether to use eslint-loader
  lintOnSave: 'default',

  devServer: {
    /*
    open: process.platform === 'darwin',
    host: '0.0.0.0',
    port: 8080,
    https: false,
    hotOnly: false,
    proxy: null, // string | Object
    before: app => {}
  */
  }
})
```

`loadFileConfig`是读取用户手动的`webpack`配置

**loadFileConfig.js**

```javascript
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')
const isFileEsm = require('is-file-esm')
const { loadModule } = require('@vue/cli-shared-utils')

module.exports = function loadFileConfig (context) {
  let fileConfig, fileConfigPath

  const possibleConfigPaths = [
    process.env.VUE_CLI_SERVICE_CONFIG_PATH,
    './vue.config.js',
    './vue.config.cjs',
    './vue.config.mjs'
  ]
  for (const p of possibleConfigPaths) {
    const resolvedPath = p && path.resolve(context, p)
    if (resolvedPath && fs.existsSync(resolvedPath)) {
      fileConfigPath = resolvedPath
      break
    }
  }

  if (fileConfigPath) {
    const { esm } = isFileEsm.sync(fileConfigPath)

    if (esm) {
      fileConfig = import(pathToFileURL(fileConfigPath))
    } else {
      fileConfig = loadModule(fileConfigPath, context)
    }
  }

  return {
    fileConfig,
    fileConfigPath
  }
}
```

前面提及的`resolvePlugins`起始是加载了`webpack`配置

```javascript
const builtInPlugins = [
  './commands/serve',
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
```

需要注意的是`app.js assets.js base.js prod.js terserOptions.js`

**app.js**

```javascript
// config that are specific to --target app
const fs = require('fs')
const path = require('path')

// 确保传递给html-webpack插件的文件名是相对路径
function ensureRelative (outputDir, _path) {
  if (path.isAbsolute(_path)) {
    return path.relative(outputDir, _path)
  } else {
    return _path
  }
}

module.exports = (api, options) => {
  api.chainWebpack(webpackConfig => {
    // 只有构建应用是app时触发
    if (process.env.VUE_CLI_BUILD_TARGET && process.env.VUE_CLI_BUILD_TARGET !== 'app') {
      return
    }

    const isProd = process.env.NODE_ENV === 'production'
    const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD
    const outputDir = api.resolve(options.outputDir)

    const getAssetPath = require('../util/getAssetPath')
    // 生成文件路径名称
    const outputFilename = getAssetPath(
      options,
      `js/[name]${isLegacyBundle ? `-legacy` : ``}${isProd && options.filenameHashing ? '.[contenthash:8]' : ''}.js`
    )
    webpackConfig
      .output
        .filename(outputFilename)
        .chunkFilename(outputFilename)

    // TODO: 这一段没太理解，为什么需要将realContentHash 设置为false
    // webpack官网对于realContentHash的解释 在处理静态资源后添加额外的哈希编译，以获得正确的静态资源     // 内容哈希。如果 realContentHash 设置为 false，内部数据用于计算哈希值，当静态资源相同时，它可以改变。
    webpackConfig.optimization
      .set('realContentHash', false)

    // 代码分割
    // 初始化阶段 node_modules 包 放入chunk-vendors 其他初始化依赖的模块放入chunk-common
    // 异步包单独打包（webpack默认的分包策略）
    if (process.env.NODE_ENV !== 'test') {
      webpackConfig.optimization.splitChunks({
        cacheGroups: {
          defaultVendors: {
            name: `chunk-vendors`,
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            chunks: 'initial'
          },
          common: {
            name: `chunk-common`,
            minChunks: 2,
            priority: -20,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      })
    }

    // 解析html
    const resolveClientEnv = require('../util/resolveClientEnv')

    const htmlOptions = {
      title: api.service.pkg.name,
      scriptLoading: 'defer',
      templateParameters: (compilation, assets, assetTags, pluginOptions) => {
        // enhance html-webpack-plugin's built in template params
        return Object.assign({
          compilation: compilation,
          webpackConfig: compilation.options,
          htmlWebpackPlugin: {
            tags: assetTags,
            files: assets,
            options: pluginOptions
          }
        }, resolveClientEnv(options, true /* raw */))
      }
    }

    // handle indexPath
    if (options.indexPath !== 'index.html') {
      // why not set filename for html-webpack-plugin?
      // 1. It cannot handle absolute paths
      // 2. Relative paths causes incorrect SW manifest to be generated (#2007)
      webpackConfig
        .plugin('move-index')
        .use(require('../webpack/MovePlugin'), [
          path.resolve(outputDir, 'index.html'),
          path.resolve(outputDir, options.indexPath)
        ])
    }

    // resolve HTML file(s)
    const HTMLPlugin = require('html-webpack-plugin')
    // const PreloadPlugin = require('@vue/preload-webpack-plugin')
    const multiPageConfig = options.pages
    const htmlPath = api.resolve('public/index.html')
    const defaultHtmlPath = path.resolve(__dirname, 'index-default.html')
    const publicCopyIgnore = ['**/.DS_Store']

    if (!multiPageConfig) {
      // default, single page setup.
      htmlOptions.template = fs.existsSync(htmlPath)
        ? htmlPath
        : defaultHtmlPath

      publicCopyIgnore.push(api.resolve(htmlOptions.template).replace(/\\/g, '/'))

      webpackConfig
        .plugin('html')
          .use(HTMLPlugin, [htmlOptions])

      // FIXME: need to test out preload plugin's compatibility with html-webpack-plugin 4/5
      // if (!isLegacyBundle) {
      //   // inject preload/prefetch to HTML
      //   webpackConfig
      //     .plugin('preload')
      //       .use(PreloadPlugin, [{
      //         rel: 'preload',
      //         include: 'initial',
      //         fileBlacklist: [/\.map$/, /hot-update\.js$/]
      //       }])

      //   webpackConfig
      //     .plugin('prefetch')
      //       .use(PreloadPlugin, [{
      //         rel: 'prefetch',
      //         include: 'asyncChunks'
      //       }])
      // }
    } else {
      // multi-page setup
      webpackConfig.entryPoints.clear()

      const pages = Object.keys(multiPageConfig)
      const normalizePageConfig = c => typeof c === 'string' ? { entry: c } : c

      pages.forEach(name => {
        const pageConfig = normalizePageConfig(multiPageConfig[name])
        const {
          entry,
          template = `public/${name}.html`,
          filename = `${name}.html`,
          chunks = ['chunk-vendors', 'chunk-common', name]
        } = pageConfig

        // Currently Cypress v3.1.0 comes with a very old version of Node,
        // which does not support object rest syntax.
        // (https://github.com/cypress-io/cypress/issues/2253)
        // So here we have to extract the customHtmlOptions manually.
        const customHtmlOptions = {}
        for (const key in pageConfig) {
          if (
            !['entry', 'template', 'filename', 'chunks'].includes(key)
          ) {
            customHtmlOptions[key] = pageConfig[key]
          }
        }

        // 入口
        const entries = Array.isArray(entry) ? entry : [entry]
        webpackConfig.entry(name).merge(entries.map(e => api.resolve(e)))

        // trim inline loader
        // * See https://github.com/jantimon/html-webpack-plugin/blob/master/docs/template-option.md#2-setting-a-loader-directly-for-the-template
        const templateWithoutLoader = template.replace(/^.+!/, '').replace(/\?.+$/, '')

        // resolve page index template
        const hasDedicatedTemplate = fs.existsSync(api.resolve(templateWithoutLoader))
        const templatePath = hasDedicatedTemplate
          ? template
          : fs.existsSync(htmlPath)
            ? htmlPath
            : defaultHtmlPath

        publicCopyIgnore.push(api.resolve(templateWithoutLoader).replace(/\\/g, '/'))

        // inject html plugin for the page
        const pageHtmlOptions = Object.assign(
          {},
          htmlOptions,
          {
            chunks,
            template: templatePath,
            filename: ensureRelative(outputDir, filename)
          },
          customHtmlOptions
        )

        webpackConfig
          .plugin(`html-${name}`)
            .use(HTMLPlugin, [pageHtmlOptions])
      })

      // FIXME: preload plugin is not compatible with webpack 5 / html-webpack-plugin 4 yet
      // if (!isLegacyBundle) {
      //   pages.forEach(name => {
      //     const filename = ensureRelative(
      //       outputDir,
      //       normalizePageConfig(multiPageConfig[name]).filename || `${name}.html`
      //     )
      //     webpackConfig
      //       .plugin(`preload-${name}`)
      //         .use(PreloadPlugin, [{
      //           rel: 'preload',
      //           includeHtmlNames: [filename],
      //           include: {
      //             type: 'initial',
      //             entries: [name]
      //           },
      //           fileBlacklist: [/\.map$/, /hot-update\.js$/]
      //         }])

      //     webpackConfig
      //       .plugin(`prefetch-${name}`)
      //         .use(PreloadPlugin, [{
      //           rel: 'prefetch',
      //           includeHtmlNames: [filename],
      //           include: {
      //             type: 'asyncChunks',
      //             entries: [name]
      //           }
      //         }])
      //   })
      // }
    }

    // CORS and Subresource Integrity
    if (options.crossorigin != null || options.integrity) {
      webpackConfig
        .plugin('cors')
          .use(require('../webpack/CorsPlugin'), [{
            crossorigin: options.crossorigin,
            integrity: options.integrity,
            publicPath: options.publicPath
          }])
    }

    // 复制public的静态资源
    const publicDir = api.resolve('public')
    const CopyWebpackPlugin = require('copy-webpack-plugin')
    const PlaceholderPlugin = class PlaceholderPlugin { apply () {} }

    const copyOptions = {
      patterns: [{
        from: publicDir,
        to: outputDir,
        toType: 'dir',
        noErrorOnMissing: true,
        globOptions: {
          ignore: publicCopyIgnore
        },
        info: {
          minimized: true
        }
      }]
    }

    if (fs.existsSync(publicDir)) {
      if (isLegacyBundle) {
        webpackConfig.plugin('copy').use(PlaceholderPlugin, [copyOptions])
      } else {
        webpackConfig.plugin('copy').use(CopyWebpackPlugin, [copyOptions])
      }
    }
  })
}

```



**assets.js**

静态资源的`rules`的配置

```javascript
/** @type {import('@vue/cli-service').ServicePlugin} */
module.exports = (api, options) => {
  const getAssetPath = require('../util/getAssetPath')

  const genAssetSubPath = dir => {
    return getAssetPath(
      options,
      `${dir}/[name]${options.filenameHashing ? '.[hash:8]' : ''}[ext]`
    )
  }

  api.chainWebpack(webpackConfig => {
    webpackConfig.module
    .rule('svg')
      .test(/\.(svg)(\?.*)?$/)
      // do not base64-inline SVGs.
      // https://github.com/facebookincubator/create-react-app/pull/1180
      .set('type', 'asset/resource')
      .set('generator', {
        filename: genAssetSubPath('img')
      })

    webpackConfig.module
      .rule('images')
        .test(/\.(png|jpe?g|gif|webp|avif)(\?.*)?$/)
        .set('type', 'asset')
        .set('generator', {
          filename: genAssetSubPath('img')
        })

    webpackConfig.module
      .rule('media')
        .test(/\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/)
        .set('type', 'asset')
        .set('generator', {
          filename: genAssetSubPath('media')
        })

    webpackConfig.module
      .rule('fonts')
        .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
        .set('type', 'asset')
        .set('generator', {
          filename: genAssetSubPath('fonts')
        })
  })
}
```



**base.js**

```javascript
const path = require('path')

/** @type {import('@vue/cli-service').ServicePlugin} */
module.exports = (api, options) => {
  const cwd = api.getCwd()
  const webpack = require('webpack')
  const vueMajor = require('../util/getVueMajor')(cwd)

  api.chainWebpack(webpackConfig => {
    const isLegacyBundle = process.env.VUE_CLI_MODERN_MODE && !process.env.VUE_CLI_MODERN_BUILD
    const resolveLocal = require('../util/resolveLocal')

    // https://github.com/webpack/webpack/issues/14532#issuecomment-947525539
    webpackConfig.output.set('hashFunction', 'xxhash64')

    // https://github.com/webpack/webpack/issues/11467#issuecomment-691873586
    webpackConfig.module
      .rule('esm')
        .test(/\.m?jsx?$/)
        .resolve.set('fullySpecified', false)

    webpackConfig
      .mode('development')
      .context(api.service.context)
      .entry('app')
        .add('./src/main.js')
        .end()
      .output
        .path(api.resolve(options.outputDir))
        .filename(isLegacyBundle ? '[name]-legacy.js' : '[name].js')
        .publicPath(options.publicPath)

    webpackConfig.resolve
      .extensions
        .merge(['.mjs', '.js', '.jsx', '.vue', '.json', '.wasm'])
        .end()
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))
        .end()
      .alias
        .set('@', api.resolve('src'))

    webpackConfig.resolveLoader
      .modules
        .add('node_modules')
        .add(api.resolve('node_modules'))
        .add(resolveLocal('node_modules'))

    webpackConfig.module
      .noParse(/^(vue|vue-router|vuex|vuex-router-sync)$/)

    // js is handled by cli-plugin-babel ---------------------------------------

    // vue-loader --------------------------------------------------------------
    let cacheLoaderPath
    try {
      cacheLoaderPath = require.resolve('cache-loader')
    } catch (e) {}

    if (vueMajor === 2) {
      // for Vue 2 projects
      const partialIdentifier = {
        'vue-loader': require('@vue/vue-loader-v15/package.json').version,
        '@vue/component-compiler-utils': require('@vue/component-compiler-utils/package.json').version
      }

      try {
        partialIdentifier['vue-template-compiler'] = require('vue-template-compiler/package.json').version
      } catch (e) {
        // For Vue 2.7 projects, `vue-template-compiler` is not required
      }

      const vueLoaderCacheConfig = api.genCacheConfig('vue-loader', partialIdentifier)

      webpackConfig.resolve
        .alias
          .set(
            'vue$',
            options.runtimeCompiler
              ? 'vue/dist/vue.esm.js'
              : 'vue/dist/vue.runtime.esm.js'
          )

      if (cacheLoaderPath) {
        webpackConfig.module
          .rule('vue')
            .test(/\.vue$/)
            .use('cache-loader')
              .loader(cacheLoaderPath)
              .options(vueLoaderCacheConfig)
      }

      webpackConfig.module
        .rule('vue')
          .test(/\.vue$/)
          .use('vue-loader')
            .loader(require.resolve('@vue/vue-loader-v15'))
            .options(Object.assign({
              compilerOptions: {
                whitespace: 'condense'
              }
            }, cacheLoaderPath ? vueLoaderCacheConfig : {}))

      webpackConfig
        .plugin('vue-loader')
          .use(require('@vue/vue-loader-v15').VueLoaderPlugin)

      // some plugins may implicitly relies on the `vue-loader` dependency path name
      // such as vue-cli-plugin-apollo
      // <https://github.com/Akryum/vue-cli-plugin-apollo/blob/d9fe48c61cc19db88fef4e4aa5e49b31aa0c44b7/index.js#L88>
      // so we need a hotfix for that
      webpackConfig
        .resolveLoader
          .modules
            .prepend(path.resolve(__dirname, './vue-loader-v15-resolve-compat'))
    } else if (vueMajor === 3) {
      // for Vue 3 projects
      const vueLoaderCacheConfig = api.genCacheConfig('vue-loader', {
        'vue-loader': require('vue-loader/package.json').version
      })

      webpackConfig.resolve
        .alias
          .set(
            'vue$',
            options.runtimeCompiler
              ? 'vue/dist/vue.esm-bundler.js'
              : 'vue/dist/vue.runtime.esm-bundler.js'
          )

      if (cacheLoaderPath) {
        webpackConfig.module
          .rule('vue')
            .test(/\.vue$/)
            .use('cache-loader')
              .loader(cacheLoaderPath)
              .options(vueLoaderCacheConfig)
      }

      webpackConfig.module
        .rule('vue')
          .test(/\.vue$/)
          .use('vue-loader')
            .loader(require.resolve('vue-loader'))
            .options({
              ...vueLoaderCacheConfig,
              babelParserPlugins: ['jsx', 'classProperties', 'decorators-legacy']
            })

      webpackConfig
        .plugin('vue-loader')
          .use(require('vue-loader').VueLoaderPlugin)

      // feature flags <http://link.vuejs.org/feature-flags>
      webpackConfig
        .plugin('feature-flags')
          .use(webpack.DefinePlugin, [{
            __VUE_OPTIONS_API__: 'true',
            __VUE_PROD_DEVTOOLS__: 'false'
          }])
    }

    // https://github.com/vuejs/vue-loader/issues/1435#issuecomment-869074949
    webpackConfig.module
      .rule('vue-style')
        .test(/\.vue$/)
          .resourceQuery(/type=style/)
            .sideEffects(true)

    // Other common pre-processors ---------------------------------------------
    const maybeResolve = name => {
      try {
        return require.resolve(name)
      } catch (error) {
        return name
      }
    }

    webpackConfig.module
      .rule('pug')
        .test(/\.pug$/)
          .oneOf('pug-vue')
            .resourceQuery(/vue/)
            .use('pug-plain-loader')
              .loader(maybeResolve('pug-plain-loader'))
              .end()
            .end()
          .oneOf('pug-template')
            .use('raw')
              .loader(maybeResolve('raw-loader'))
              .end()
            .use('pug-plain-loader')
              .loader(maybeResolve('pug-plain-loader'))
              .end()
            .end()

    const resolveClientEnv = require('../util/resolveClientEnv')
    webpackConfig
      .plugin('define')
        .use(webpack.DefinePlugin, [
          resolveClientEnv(options)
        ])

    webpackConfig
      .plugin('case-sensitive-paths')
        .use(require('case-sensitive-paths-webpack-plugin'))

    // friendly error plugin displays very confusing errors when webpack
    // fails to resolve a loader, so we provide custom handlers to improve it
    const { transformer, formatter } = require('../util/resolveLoaderError')
    webpackConfig
      .plugin('friendly-errors')
        .use(require('@soda/friendly-errors-webpack-plugin'), [{
          additionalTransformers: [transformer],
          additionalFormatters: [formatter]
        }])

    const TerserPlugin = require('terser-webpack-plugin')
    const terserOptions = require('./terserOptions')
    webpackConfig.optimization
      .minimizer('terser')
        .use(TerserPlugin, [terserOptions(options)])
  })

```

从上述代码中，处理入口、出口、`vue-loader`、`terser-webpack-plugin` 代码压缩等处理

**css.js**

```javascript
const fs = require('fs')
const path = require('path')
const { chalk, semver, loadModule } = require('@vue/cli-shared-utils')
const isAbsoluteUrl = require('../util/isAbsoluteUrl')

const findExisting = (context, files) => {
  for (const file of files) {
    if (fs.existsSync(path.join(context, file))) {
      return file
    }
  }
}

module.exports = (api, rootOptions) => {
  api.chainWebpack(webpackConfig => {
    const getAssetPath = require('../util/getAssetPath')
    const shadowMode = !!process.env.VUE_CLI_CSS_SHADOW_MODE
    const isProd = process.env.NODE_ENV === 'production'

    const {
      extract = isProd,
      sourceMap = false,
      loaderOptions = {}
    } = rootOptions.css || {}

    const shouldExtract = extract !== false && !shadowMode
    const filename = getAssetPath(
      rootOptions,
      `css/[name]${rootOptions.filenameHashing ? '.[contenthash:8]' : ''}.css`
    )
    const extractOptions = Object.assign({
      filename,
      chunkFilename: filename
    }, extract && typeof extract === 'object' ? extract : {})

    // when project publicPath is a relative path
    // use relative publicPath in extracted CSS based on extract location
    const cssPublicPath = (isAbsoluteUrl(rootOptions.publicPath) || rootOptions.publicPath.startsWith('/'))
      ? rootOptions.publicPath
      : process.env.VUE_CLI_BUILD_TARGET === 'lib'
        // in lib mode, CSS is extracted to dist root.
        ? './'
        : '../'.repeat(
          extractOptions.filename
            .replace(/^\.[/\\]/, '')
            .split(/[/\\]/g)
            .length - 1
        )

    // check if the project has a valid postcss config
    // if it doesn't, don't use postcss-loader for direct style imports
    // because otherwise it would throw error when attempting to load postcss config
    const hasPostCSSConfig = !!(loaderOptions.postcss || api.service.pkg.postcss || findExisting(api.resolve('.'), [
      '.postcssrc',
      '.postcssrc.js',
      'postcss.config.js',
      '.postcssrc.yaml',
      '.postcssrc.json'
    ]))

    if (!hasPostCSSConfig) {
      // #6342
      // NPM 6 may incorrectly hoist postcss 7 to the same level of autoprefixer
      // So we have to run a preflight check to tell the users how to fix it
      const autoprefixerDirectory = path.dirname(require.resolve('autoprefixer/package.json'))
      const postcssPkg = loadModule('postcss/package.json', autoprefixerDirectory)
      const postcssVersion = postcssPkg.version
      if (!semver.satisfies(postcssVersion, '8.x')) {
        throw new Error(
          `The package manager has hoisted a wrong version of ${chalk.cyan('postcss')}, ` +
          `please run ${chalk.cyan('npm i postcss@8 -D')} to fix it.`
        )
      }

      loaderOptions.postcss = {
        postcssOptions: {
          plugins: [
            require('autoprefixer')
          ]
        }
      }
    }

    // if building for production but not extracting CSS, we need to minimize
    // the embbeded inline CSS as they will not be going through the optimizing
    // plugin.
    const needInlineMinification = isProd && !shouldExtract

    const cssnanoOptions = {
      preset: ['default', {
        mergeLonghand: false,
        cssDeclarationSorter: false
      }]
    }
    if (rootOptions.productionSourceMap && sourceMap) {
      cssnanoOptions.map = { inline: false }
    }

    function createCSSRule (lang, test, loader, options) {
      const baseRule = webpackConfig.module.rule(lang).test(test)

      // rules for <style module>
      const vueModulesRule = baseRule.oneOf('vue-modules').resourceQuery(/module/)
      applyLoaders(vueModulesRule, true)

      // rules for <style>
      const vueNormalRule = baseRule.oneOf('vue').resourceQuery(/\?vue/)
      applyLoaders(vueNormalRule)

      // rules for *.module.* files
      const extModulesRule = baseRule.oneOf('normal-modules').test(/\.module\.\w+$/)
      applyLoaders(extModulesRule)

      // rules for normal CSS imports
      const normalRule = baseRule.oneOf('normal')
      applyLoaders(normalRule)

      function applyLoaders (rule, forceCssModule = false) {
        if (shouldExtract) {
          rule
            .use('extract-css-loader')
            .loader(require('mini-css-extract-plugin').loader)
            .options({
              publicPath: cssPublicPath
            })
        } else {
          rule
            .use('vue-style-loader')
            .loader(require.resolve('vue-style-loader'))
            .options({
              sourceMap,
              shadowMode
            })
        }

        const cssLoaderOptions = Object.assign({
          sourceMap,
          importLoaders: (
            1 + // stylePostLoader injected by vue-loader
            1 + // postcss-loader
            (needInlineMinification ? 1 : 0)
          )
        }, loaderOptions.css)

        if (forceCssModule) {
          cssLoaderOptions.modules = {
            ...cssLoaderOptions.modules,
            auto: () => true
          }
        }

        if (cssLoaderOptions.modules) {
          cssLoaderOptions.modules = {
            localIdentName: '[name]_[local]_[hash:base64:5]',
            ...cssLoaderOptions.modules
          }
        }

        rule
          .use('css-loader')
          .loader(require.resolve('css-loader'))
          .options(cssLoaderOptions)

        if (needInlineMinification) {
          rule
            .use('cssnano')
            .loader(require.resolve('postcss-loader'))
            .options({
              sourceMap,
              postcssOptions: {
                plugins: [require('cssnano')(cssnanoOptions)]
              }
            })
        }

        rule
          .use('postcss-loader')
          .loader(require.resolve('postcss-loader'))
          .options(Object.assign({ sourceMap }, loaderOptions.postcss))

        if (loader) {
          let resolvedLoader
          try {
            resolvedLoader = require.resolve(loader)
          } catch (error) {
            resolvedLoader = loader
          }

          rule
            .use(loader)
            .loader(resolvedLoader)
            .options(Object.assign({ sourceMap }, options))
        }
      }
    }

    createCSSRule('css', /\.css$/)
    createCSSRule('postcss', /\.p(ost)?css$/)
    createCSSRule('scss', /\.scss$/, 'sass-loader', Object.assign(
      {},
      loaderOptions.scss || loaderOptions.sass
    ))
    createCSSRule('sass', /\.sass$/, 'sass-loader', Object.assign(
      {},
      loaderOptions.sass,
      {
        sassOptions: Object.assign(
          {},
          loaderOptions.sass && loaderOptions.sass.sassOptions,
          {
            indentedSyntax: true
          }
        )
      }
    ))
    createCSSRule('less', /\.less$/, 'less-loader', loaderOptions.less)
    createCSSRule('stylus', /\.styl(us)?$/, 'stylus-loader', loaderOptions.stylus)

    // inject CSS extraction plugin
    if (shouldExtract) {
      webpackConfig
        .plugin('extract-css')
          .use(require('mini-css-extract-plugin'), [extractOptions])

      // minify extracted CSS
      webpackConfig.optimization
        .minimizer('css')
          .use(require('css-minimizer-webpack-plugin'), [{
            parallel: rootOptions.parallel,
            minimizerOptions: cssnanoOptions
          }])
    }
  })
}

```



最后在`init`时合并配置

```javascript
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
```

