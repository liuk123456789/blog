---
title: vue-cli第四篇
date: 2023-06-02
categories: 
 - 源码解读
tags:
 - vue-cli第四篇
sidebar: auto
---

## 1. 前言

`vue inspect`用于查看`vue cli`中`webpack`的配置相关

## 2. 命令详情

```javascript
program
  .command('inspect [paths...]')
  .description('inspect the webpack config in a project with vue-cli-service')
  .option('--mode <mode>')
  .option('--rule <ruleName>', 'inspect a specific module rule')
  .option('--plugin <pluginName>', 'inspect a specific plugin')
  .option('--rules', 'list all module rule names')
  .option('--plugins', 'list all plugin names')
  .option('-v --verbose', 'Show full function definitions in output')
  .action((paths, options) => {
    require('../lib/inspect')(paths, options)
  })

```

通过以上代码可以看出，主要的逻辑都是在`inspect.js`文件中

## 3. inspect.js

```javascript
const fs = require('fs')
const path = require('path')
const resolve = require('resolve')
const { execa } = require('@vue/cli-shared-utils')

module.exports = function inspect (paths, args) {
  const cwd = process.cwd()
  let servicePath
  try {
    servicePath = resolve.sync('@vue/cli-service', { basedir: cwd })
  } catch (e) {
    const { error } = require('@vue/cli-shared-utils')
    error(
      `Failed to locate @vue/cli-service.\n` +
      `Note that \`vue inspect\` is an alias of \`vue-cli-service inspect\`\n` +
      `and can only be used in a project where @vue/cli-service is locally installed.`
    )
    process.exit(1)
  }
  const binPath = path.resolve(servicePath, '../../bin/vue-cli-service.js')
  if (fs.existsSync(binPath)) {
    execa('node', [
      binPath,
      'inspect',
      ...(args.mode ? ['--mode', args.mode] : []),
      ...(args.rule ? ['--rule', args.rule] : []),
      ...(args.plugin ? ['--plugin', args.plugin] : []),
      ...(args.rules ? ['--rules'] : []),
      ...(args.plugins ? ['--plugins'] : []),
      ...(args.verbose ? ['--verbose'] : []),
      ...paths
    ], { cwd, stdio: 'inherit' })
  }
}

```

代码相对简单，获取 `@vue/cli-service` 的执行文件路径，然后查找`bin/vue-cli-service.js`然后通过`execa(基于child_progress)`执行`node vue-cli-service inspect`命令

## 3. bin/vue-cli-service.js

```javascript
#!/usr/bin/env node

const { semver, error } = require('@vue/cli-shared-utils')
const requiredVersion = require('../package.json').engines.node

if (!semver.satisfies(process.version, requiredVersion, { includePrerelease: true })) {
  error(
    `You are using Node ${process.version}, but vue-cli-service ` +
    `requires Node ${requiredVersion}.\nPlease upgrade your Node version.`
  )
  process.exit(1)
}

const Service = require('../lib/Service')
const service = new Service(process.env.VUE_CLI_CONTEXT || process.cwd())

const rawArgv = process.argv.slice(2)
const args = require('minimist')(rawArgv, {
  boolean: [
    // build
    // FIXME: --no-module, --no-unsafe-inline, no-clean, etc.
    'modern',
    'report',
    'report-json',
    'inline-vue',
    'watch',
    // serve
    'open',
    'copy',
    'https',
    // inspect
    'verbose'
  ]
})
const command = args._[0]

service.run(command, args, rawArgv).catch(err => {
  error(err)
  process.exit(1)
})

```

可以看出脚本依赖`Service`，通过`minimist`进行参数解析，而命令对应的文件`cli-service/lib/commands/inspect.js`有此命令的详细代码

## 4.inspect命令详解

```javascript
module.exports = (api, options) => {
  api.registerCommand(
    'inspect',
    {
      description: 'inspect internal webpack config',
      usage: 'vue-cli-service inspect [options] [...paths]',
      options: {
        '--mode': 'specify env mode (default: development)',
        '--rule <ruleName>': 'inspect a specific module rule',
        '--plugin <pluginName>': 'inspect a specific plugin',
        '--rules': 'list all module rule names',
        '--plugins': 'list all plugin names',
        '--verbose': 'show full function definitions in output',
        '--skip-plugins': 'comma-separated list of plugin names to skip for this run'
      }
    },
    args => {
      const { chalk, get } = require('@vue/cli-shared-utils')
      const { toString } = require('webpack-chain')
      const { highlight } = require('cli-highlight')
      const config = api.resolveWebpackConfig()
      const { _: paths, verbose } = args

      let res
      let hasUnnamedRule
      if (args.rule) {
        res = config.module.rules.find(r => r.__ruleNames[0] === args.rule)
      } else if (args.plugin) {
        res = config.plugins.find(p => p.__pluginName === args.plugin)
      } else if (args.rules) {
        res = config.module.rules.map(r => {
          const name = r.__ruleNames ? r.__ruleNames[0] : 'Nameless Rule (*)'

          hasUnnamedRule = hasUnnamedRule || !r.__ruleNames

          return name
        })
      } else if (args.plugins) {
        res = config.plugins.map(p => p.__pluginName || p.constructor.name)
      } else if (paths.length > 1) {
        res = {}
        paths.forEach(path => {
          res[path] = get(config, path)
        })
      } else if (paths.length === 1) {
        res = get(config, paths[0])
      } else {
        res = config
      }

      const output = toString(res, { verbose })
      console.log(highlight(output, { language: 'js' }))

      // Log explanation for Nameless Rules
      if (hasUnnamedRule) {
        console.log(`--- ${chalk.green('Footnotes')} ---`)
        console.log(`*: ${chalk.green(
          'Nameless Rules'
        )} were added through the ${chalk.green(
          'configureWebpack()'
        )} API (possibly by a plugin) instead of ${chalk.green(
          'chainWebpack()'
        )} (recommended).
    You can run ${chalk.green(
    'vue-cli-service inspect'
  )} without any arguments to inspect the full config and read these rules' config.`)
      }
    }
  )
}

module.exports.defaultModes = {
  inspect: 'development'
}

```

`api.registerCommand`说明了`inspect`命令注册的以及一些参数说明

接下来就是生成`webpack`配置相关代码，首先通过 `resolveWebpackConfig` 获取整个项目的` webpack` 配置，然后根据` args` 的值获取对应的 `webpack` 配置并通过 `webpack-chain` 的 `toString` 函数来生成配置信息，最终打印在控制台上。除了 `plugin`, `rule` 等参数，在源码中还有 `paths `变量，它里面包含着除了 命令本身以外的参数，比如执行 `vue-cli-service inspect entry` 命令 , `paths `则为 `[entry]`，`paths `是一个数组，如果包含多个参数，则会 返回所有参数对应的 `webpack` 配置，例如想要一次性返回 `entry` 和 `output` 的配置，可以执行以下命令：

```javascript
vue-cli-service inspect entry output
```

## 5. resolveWebpackConfig

```javascript
resolveChainableWebpackConfig () {
	const chainableConfig = new Config()
	// apply chains
	this.webpackChainFns.forEach(fn => fn(chainableConfig))
	return chainableConfig
}

resolveWebpackConfig (chainableConfig = this.resolveChainableWebpackConfig()) {
    if (!this.initialized) {
      throw new Error('Service must call init() before calling resolveWebpackConfig().')
    }
    // get raw config
    let config = chainableConfig.toConfig()
    const original = config
    // apply raw config fns
    this.webpackRawConfigFns.forEach(fn => {
      if (typeof fn === 'function') {
        // function with optional return value
        const res = fn(config)
        if (res) config = merge(config, res)
      } else if (fn) {
        // merge literal values
        config = merge(config, fn)
      }
    })

    // #2206 If config is merged by merge-webpack, it discards the __ruleNames
    // information injected by webpack-chain. Restore the info so that
    // vue inspect works properly.
    if (config !== original) {
      cloneRuleNames(
        config.module && config.module.rules,
        original.module && original.module.rules
      )
    }

    // check if the user has manually mutated output.publicPath
    const target = process.env.VUE_CLI_BUILD_TARGET
    if (
      !process.env.VUE_CLI_TEST &&
      (target && target !== 'app') &&
      config.output.publicPath !== this.projectOptions.publicPath
    ) {
      throw new Error(
        `Do not modify webpack output.publicPath directly. ` +
        `Use the "publicPath" option in vue.config.js instead.`
      )
    }

    if (
      !process.env.VUE_CLI_ENTRY_FILES &&
      typeof config.entry !== 'function'
    ) {
      let entryFiles
      if (typeof config.entry === 'string') {
        entryFiles = [config.entry]
      } else if (Array.isArray(config.entry)) {
        entryFiles = config.entry
      } else {
        entryFiles = Object.values(config.entry || []).reduce((allEntries, curr) => {
          return allEntries.concat(curr)
        }, [])
      }

      entryFiles = entryFiles.map(file => path.resolve(this.context, file))
      process.env.VUE_CLI_ENTRY_FILES = JSON.stringify(entryFiles)
    }

    return config
}
```

`webpackChainFns`是将`chainWebpack`选项放入数组中，如下

```javascript
// vue.config.js
chainWebpack: config => {
	config.module
  		.rule('vue')
  		.use('vue-loader')
    	.tap(options => {
      		// 修改它的选项...
      		return options
    	})
}
```

后面执行`webpackChainFns`时会将`webpack-chain`的实例传入，生成可被`webpack-chain`解析的配置，关于`webpack-chain`的内容[查看此篇](https://liuk123456789.github.io/my-blog/blogs/Webpack/webpack-chain.html)

```javascript
// apply chains
this.webpackChainFns.forEach(fn => fn(chainableConfig))
```

后面的`webpackRawConfigFns`也是同理，因为`configureWebpack`可以配置成函数/对象，如下

```javascript
// vue.config.js
module.exports = {
  configureWebpack: {
    plugins: [
      new MyAwesomeWebpackPlugin()
    ]
  }
}

// vue.config.js
module.exports = {
  configureWebpack: config => {
    if (process.env.NODE_ENV === 'production') {
      // 为生产环境修改配置...
    } else {
      // 为开发环境修改配置...
    }
  }
}
```

所以兼容了这两个场景

```javascript
// apply raw config fns
this.webpackRawConfigFns.forEach(fn => {
  if (typeof fn === 'function') {
    // function with optional return value
    const res = fn(config)
    if (res) config = merge(config, res)
  } else if (fn) {
    // merge literal values
    config = merge(config, fn)
  }
})
```

接下来`publicPath`的手动修改的问题

```javascript
if (
  !process.env.VUE_CLI_TEST &&
  (target && target !== 'app') &&
  config.output.publicPath !== this.projectOptions.publicPath
) {
  throw new Error(
    `Do not modify webpack output.publicPath directly. ` +
    `Use the "publicPath" option in vue.config.js instead.`
  )
}
```

入口文件的配置（单入口/多入口等的配置）,`vue-cli`是统一将其处理成数组

```javascript

if (
  !process.env.VUE_CLI_ENTRY_FILES &&
  typeof config.entry !== 'function'
) {
  let entryFiles
  if (typeof config.entry === 'string') {
    entryFiles = [config.entry]
  } else if (Array.isArray(config.entry)) {
    entryFiles = config.entry
  } else {
    entryFiles = Object.values(config.entry || []).reduce((allEntries, curr) => {
      return allEntries.concat(curr)
    }, [])
  }

  entryFiles = entryFiles.map(file => path.resolve(this.context, file))
  process.env.VUE_CLI_ENTRY_FILES = JSON.stringify(entryFiles)
}
```

## 6. 问题

我们看了`vue inspect`命令，可能会有这样的疑惑，`vue cli`内置的`webpack`配置是什么，这些都在`Service.js`中，会有单独说下`cli-service`的