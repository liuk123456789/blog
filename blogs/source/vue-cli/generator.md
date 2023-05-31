---
title: vue-cli第二篇
date: 2023-03-24
categories: 
 - 源码解读
tags:
 - vue-cli第二篇
sidebar: auto
---

## 1. 前言

在第一篇中，我们剩下了`generator`生成器没有说，这也是`vue create ***`命令最为核心的部分，同时也回顾下`resolvePlugins`的功能

## 2. resolvePlugins

```javascript
// { id: options } => [{ id, apply, options }]
async resolvePlugins (rawPlugins, pkg) {
    // ensure cli-service is invoked first
    rawPlugins = sortObject(rawPlugins, ['@vue/cli-service'], true)
    const plugins = []
    for (const id of Object.keys(rawPlugins)) {
      const apply = loadModule(`${id}/generator`, this.context) || (() => {})
      let options = rawPlugins[id] || {}

      if (options.prompts) {
        let pluginPrompts = loadModule(`${id}/prompts`, this.context)

        if (pluginPrompts) {
          const prompt = inquirer.createPromptModule()

          if (typeof pluginPrompts === 'function') {
            pluginPrompts = pluginPrompts(pkg, prompt)
          }
          if (typeof pluginPrompts.getPrompts === 'function') {
            pluginPrompts = pluginPrompts.getPrompts(pkg, prompt)
          }

          log()
          log(`${chalk.cyan(options._isPreset ? `Preset options:` : id)}`)
          options = await prompt(pluginPrompts)
        }
      }

      plugins.push({ id, apply, options })
    }
    return plugins
}
```

看下**`sortObject`**和**`loadModule`**

### 2.1 sortObject

```javascript
module.exports = function sortObject (obj, keyOrder, dontSortByUnicode) {
  if (!obj) return
  const res = {}

  if (keyOrder) {
    keyOrder.forEach(key => {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        res[key] = obj[key]
        delete obj[key]
      }
    })
  }

  const keys = Object.keys(obj)

  !dontSortByUnicode && keys.sort()
  keys.forEach(key => {
    res[key] = obj[key]
  })

  return res
}
```

主要作用解释将`@vue/cli-service`核心插件放在对象的第一位

### 2.2 loadModule

```javascript
exports.loadModule = function (request, context, force = false) {
  // createRequire doesn't work with jest mocked fs
  // (which we used in tests for cli-service)
  if (process.env.VUE_CLI_TEST && context === '/') {
    return require(request)
  }

  try {
    // 生成require(***)
    return createRequire(path.resolve(context, 'package.json'))(request)
  } catch (e) {
    const resolvedPath = exports.resolveModule(request, context)
    if (resolvedPath) {
      if (force) {
        clearRequireCache(resolvedPath)
      }
      return require(resolvedPath)
    }
  }
}
```

功能就是生成`require('@vue/cli-service')`等依赖引入

`resolvePlugins`就是解析`@vue/cli-***`的`apply`&`options`

`plugins`的结果如下

```javascript
[
  {
   	id: '@vue/cli-service',
   	apply: require('@vue/cli-service/generator'),
   	options: {}
  },
  {
  	id:'@vue/cli-plugin-router',
    apply: require('@vue/cli-plugin-router/generator'),
    options: {}
  }
]
```

## 3. Generator

`Create.js`代码中`resolvePlugins`之后便是实例化`Generator`，接下来就是调用`generatre`方法

```javascript
const generator = new Generator(context, {
  pkg,
  plugins,
  afterInvokeCbs,
  afterAnyInvokeCbs
})

await generator.generate({
  extractConfigFiles: preset.useConfigFiles
})
```

### 3.1 Generator类

```javascript
module.exports = class Generator {
    constructor(context, {
        pkg = {},
        plugins = [],
        afterInvokeCbs = [],
        afterAnyInvokeCbs = [],
        files = {},
        invoking = false
    } = {}) {
        // 当前运行环境根目录
        this.context = context
        // 插件排序
        this.plugins = sortPlugins(plugins)
        // 备份package.json
        this.originalPkg = pkg
        // 拷贝package.json
        this.pkg = Object.assign({}, pkg)
        // 包管理工具
        this.pm = new PackageManager({ context })
        this.imports = {}
        this.rootOptions = {}
        this.afterInvokeCbs = afterInvokeCbs
        this.afterAnyInvokeCbs = afterAnyInvokeCbs
        this.configTransforms = {}
        this.defaultConfigTransforms = defaultConfigTransforms
        this.reservedConfigTransforms = reservedConfigTransforms
        this.invoking = invoking
        // for conflict resolution
        this.depSources = {}
        // virtual file tree
        this.files = Object.keys(files).length
          // when execute `vue add/invoke`, only created/modified files are written to disk
          ? watchFiles(files, this.filesModifyRecord = new Set())
          // all files need to be written to disk
          : files
        this.fileMiddlewares = []
        this.postProcessFilesCbs = []
        // exit messages
        this.exitLogs = []

        // load all the other plugins
        this.allPlugins = this.resolveAllPlugins()

        const cliService = plugins.find(p => p.id === '@vue/cli-service')
        const rootOptions = cliService
          ? cliService.options
          : inferRootOptions(pkg)
		// @vue/cli-service 配置的options 赋给rootOptions
        this.rootOptions = rootOptions
    }
}
```

因为构造器方法中太多的字段了，确实跟人很难进入的感觉，所以我们先跳过这些字段，其中存在这行代码`this.allPlugins = this.resolveAllPlugins()`，所以，我们先去看下`resolveAllPlugins`的功能

### 3.2 **ResolveAllPlugins**

```javascript
resolveAllPlugins () {
    const allPlugins = []
    Object.keys(this.pkg.dependencies || {})
      .concat(Object.keys(this.pkg.devDependencies || {}))
      .forEach(id => {
        if (!isPlugin(id)) return
        // plugin的generator
        const pluginGenerator = loadModule(`${id}/generator`, this.context)
        if (!pluginGenerator) return
        allPlugins.push({ id, apply: pluginGenerator })
      })
    return sortPlugins(allPlugins)
}
```

解析`package.json`的所有依赖包，同时查找`require(***/generator)`，将它挂到`apply`属性，最后对`plugins`进行排序

### 3.3 generate

```javascript
async generate ({
    // babel.config.js postcss.config.js eslint.config.js等额外的配置文件
    extractConfigFiles = false, 
    checkExisting = false,
    sortPackageJson = true
  } = {}) {
    await this.initPlugins()

    // save the file system before applying plugin for comparison
    const initialFiles = Object.assign({}, this.files)
    // extract configs from package.json into dedicated files.
    this.extractConfigFiles(extractConfigFiles, checkExisting)
    // wait for file resolve
    await this.resolveFiles()
    // set package.json
    if (sortPackageJson) {
      this.sortPkg()
    }
    this.files['package.json'] = JSON.stringify(this.pkg, null, 2) + '\n'
    // write/update file tree to disk
    await writeFileTree(this.context, this.files, initialFiles, this.filesModifyRecord)
}
```

首先我们看下`initPlugins`

#### 3.3.1 initPlugins

```javascript
async initPlugins () {
    const { rootOptions, invoking } = this
    const pluginIds = this.plugins.map(p => p.id)

    // 避免修改afterInvokeCbs
    const passedAfterInvokeCbs = this.afterInvokeCbs
    this.afterInvokeCbs = []
    // apply hooks from all plugins to collect 'afterAnyHooks'
    for (const plugin of this.allPlugins) {
      const { id, apply } = plugin
      const api = new GeneratorAPI(id, this, {}, rootOptions)
      // 如果apply存在hooks，那么执行hooks
      if (apply.hooks) {
        await apply.hooks(api, {}, rootOptions, pluginIds)
      }
    }

    // We are doing save/load to make the hook order deterministic
    // save "any" hooks
    const afterAnyInvokeCbsFromPlugins = this.afterAnyInvokeCbs

    // reset hooks
    this.afterInvokeCbs = passedAfterInvokeCbs
    this.afterAnyInvokeCbs = []
    this.postProcessFilesCbs = []

    // apply generators from plugins
    for (const plugin of this.plugins) {
      const { id, apply, options } = plugin
      const api = new GeneratorAPI(id, this, options, rootOptions)
      await apply(api, options, rootOptions, invoking)

      if (apply.hooks) {
        // while we execute the entire `hooks` function,
        // only the `afterInvoke` hook is respected
        // because `afterAnyHooks` is already determined by the `allPlugins` loop above
        await apply.hooks(api, options, rootOptions, pluginIds)
      }
    }
    // restore "any" hooks
    this.afterAnyInvokeCbs = afterAnyInvokeCbsFromPlugins
}
```

**rootOptions**

```javascript
const cliService = plugins.find(p => p.id === '@vue/cli-service')

// 如果没有cliService(resolvePlugins传入)，那么会从package.json的依赖项中生成rootOptions
// rootOptions的配置大致如下
// {
// "vueVersion": '2' | '3',
// "bare": boolean,
// "useConfigFiles": boolean | 'file',
// "router": boolean,
// "vuex": boolean,
// "cssPreprocessor": 'sass' | 'less' | 'stylus',
// "plugins": {
//   "@vue/cli-plugin-babel": object,
//   "@vue/cli-plugin-typescript": object
// },
// "config": object
//   
// }
const rootOptions = cliService
  ? cliService.options
  : inferRootOptions(pkg)

this.rootOptions = rootOptions
```

#### 3.3.2 GenerateAPI

`GeneratorAPI` 是一个比较重要的部分了,`@vue/cli `插件所提供的 generator 向外暴露一个函数，接收的第一个参数 `api`，然后通过该 `api` 提供的方法去完成应用的拓展工作，这里所说 的 `api` 就是 `GeneratorAPI`，下面看一下 `GeneratorAPI` 提供了哪些方法。

- **hasPlugin**：判断项目中是否有某个插件
- **extendPackage**：拓展 `package.json` 配置
- **render**：利用 `ejs` 渲染模板文件
- **onCreateComplete**：内存中保存的文件字符串全部被写入文件后的回调函数
- **exitLog**：当 `generator` 退出的时候输出的信息
- **genJSConfig**：将 `json` 文件生成为` js` 配置文件
- **injectImports**：向文件当中注入`import`语法的方法
- **injectRootOptions**：向 `Vue` 根实例中添加选项

其中`api`就是`GeneratorApi`的示例，可以看下`cli-plugin-**`的目录结构，对比`GeneratorApi`的原型方法，感受下`generator`的强大功能

`initPlugins`就要到生成文件目录部分，所以接下就是

- `extractConfigFiles`(postcss.config.js .eslintrc 等这些)
- `resolveFiles`模板渲染
- `writeFileTree` 文件目录写入

#### extractConfigFiles

提取配置文件指的是将一些插件（比如 eslint，babel）的配置从 `package.json` 的字段中提取到专属的配置文件中。下面以 eslint 为例进行分析： 在初始化项目的时候，如果选择了 eslint 插件，在调用 `@vue/cli-plugin-eslint` 的 generator 的时候，就会向 `package.json` 注入 eslintConfig 字段：

```javascript
const fs = require('fs')
const path = require('path')

module.exports = (api, { config, lintOn = [] }, rootOptions, invoking) => {
  const eslintConfig = require('../eslintOptions').config(api, config, rootOptions)
  const devDependencies = require('../eslintDeps').getDeps(api, config, rootOptions)

  const pkg = {
    scripts: {
      lint: 'vue-cli-service lint'
    },
    eslintConfig,// eslint配置
    devDependencies
  }

  const editorConfigTemplatePath = path.resolve(__dirname, `./template/${config}/_editorconfig`)
  if (fs.existsSync(editorConfigTemplatePath)) {
    if (fs.existsSync(api.resolve('.editorconfig'))) {
      // Append to existing .editorconfig
      api.render(files => {
        const editorconfig = fs.readFileSync(editorConfigTemplatePath, 'utf-8')
        files['.editorconfig'] += `\n${editorconfig}`
      })
    } else {
      api.render(`./template/${config}`)
    }
  }

  if (typeof lintOn === 'string') {
    lintOn = lintOn.split(',')
  }

  if (!lintOn.includes('save')) {
    pkg.vue = {
      lintOnSave: false // eslint-loader configured in runtime plugin
    }
  }

  if (lintOn.includes('commit')) {
    Object.assign(pkg.devDependencies, {
      'lint-staged': '^11.1.2'
    })
    pkg.gitHooks = {
      'pre-commit': 'lint-staged'
    }
    const extensions = require('../eslintOptions').extensions(api)
      .map(ext => ext.replace(/^\./, '')) // remove the leading `.`
    pkg['lint-staged'] = {
      [`*.{${extensions.join(',')}}`]: 'vue-cli-service lint'
    }
  }

  api.extendPackage(pkg)

  // invoking only
  if (invoking) {
    if (api.hasPlugin('unit-mocha')) {
      // eslint-disable-next-line node/no-extraneous-require
      require('@vue/cli-plugin-unit-mocha/generator').applyESLint(api)
    } else if (api.hasPlugin('unit-jest')) {
      // eslint-disable-next-line node/no-extraneous-require
      require('@vue/cli-plugin-unit-jest/generator').applyESLint(api)
    }
  }

  // lint & fix after create to ensure files adhere to chosen config
  // for older versions that do not support the `hooks` feature
  try {
    api.assertCliVersion('^4.0.0-beta.0')
  } catch (e) {
    if (config && config !== 'base') {
      api.onCreateComplete(async () => {
        await require('../lint')({ silent: true }, api)
      })
    }
  }
}

// In PNPM v4, due to their implementation of the module resolution mechanism,
// put require('../lint') in the callback would raise a "Module not found" error,
// But we cannot cache the file outside the callback,
// because the node_module layout may change after the "intall additional dependencies"
// phase, thus making the cached module fail to execute.
// FIXME: at the moment we have to catch the bug and silently fail. Need to fix later.
module.exports.hooks = (api) => {
  // lint & fix after create to ensure files adhere to chosen config
  api.afterAnyInvoke(async () => {
    try {
      await require('../lint')({ silent: true }, api)
    } catch (e) {}
  })
}

// exposed for the typescript plugin
module.exports.applyTS = api => {
  api.extendPackage({
    eslintConfig: {
      extends: ['@vue/typescript'],
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    },
    devDependencies: require('../eslintDeps').DEPS_MAP.typescript
  })
}

```

如果 preset 的 `useConfigFiles` 为 true ，或者以 Manually 模式初始化 preset 的时候选择 In dedicated config files 存放配置文件:

那么 `extractConfigFiles` 方法就会将 `package.json` 中 eslintConfig 字段内容提取到 `.eslintrc.js` 文件中，内存中 `.eslintrc.js` 内容如下：

#### resolveFiles

resolveFiles 主要分为以下三个部分执行：

- **fileMiddlewares**
- **injectImportsAndOptions**
- **postProcessFilesCbs**

```javascript
async resolveFiles () {
    const files = this.files
    for (const middleware of this.fileMiddlewares) {
      await middleware(files, ejs.render)
    }

    // normalize file paths on windows
    // all paths are converted to use / instead of \
    normalizeFilePaths(files)

    // handle imports and root option injections
    Object.keys(files).forEach(file => {
      let imports = this.imports[file]
      imports = imports instanceof Set ? Array.from(imports) : imports
      if (imports && imports.length > 0) {
        files[file] = runTransformation(
          { path: file, source: files[file] },
          require('./util/codemods/injectImports'),
          { imports }
        )
      }

      let injections = this.rootOptions[file]
      injections = injections instanceof Set ? Array.from(injections) : injections
      if (injections && injections.length > 0) {
        files[file] = runTransformation(
          { path: file, source: files[file] },
          require('./util/codemods/injectOptions'),
          { injections }
        )
      }
    })

    for (const postProcess of this.postProcessFilesCbs) {
      await postProcess(files)
    }
    debug('vue:cli-files')(this.files)
}
```

`fileMiddlewares` 里面包含了 `ejs render` 函数，所有插件调用 `api.render` 时候只是把对应的渲染函数 push 到了 `fileMiddlewares` 中，等所有的 插件执行完以后才会遍历执行 `fileMiddlewares` 里面的所有函数，即在内存中生成模板文件字符串。

`injectImportsAndOptions` 就是将 generator 注入的 import 和 rootOption 解析到对应的文件中，比如选择了 vuex, 会在 `src/main.js` 中添加 `import store from './store'`，以及在 vue 根实例中添加 router 选项。

`postProcessFilesCbs` 是在所有普通文件在内存中渲染成字符串完成之后要执行的遍历回调。例如将 `@vue/cli-service/generator/index.js` 中的 render 是放在了 `fileMiddlewares` 里面，而将 `@vue/cli-service/generator/router/index.js` 中将替换 `src/App.vue` 文件的方法放在了 `postProcessFiles` 里面，原因是对 `src/App.vue` 文件的一些替换一定是发生在 render 函数之后，如果在之前，修改后的 src/App.vue 在之后 render 函数执行时又会被覆盖，这样显然不合理。

#### **writeFileTree**

```javascript
const fs = require('fs-extra')
const path = require('path')

function deleteRemovedFiles (directory, newFiles, previousFiles) {
  // get all files that are not in the new filesystem and are still existing
  const filesToDelete = Object.keys(previousFiles)
    .filter(filename => !newFiles[filename])

  // delete each of these files
  return Promise.all(filesToDelete.map(filename => {
    return fs.unlink(path.join(directory, filename))
  }))
}

/**
 *
 * @param {string} dir
 * @param {Record<string,string|Buffer>} files
 * @param {Record<string,string|Buffer>} [previousFiles]
 * @param {Set<string>} [include]
 */
module.exports = async function writeFileTree (dir, files, previousFiles, include) {
  if (process.env.VUE_CLI_SKIP_WRITE) {
    return
  }
  if (previousFiles) {
    await deleteRemovedFiles(dir, files, previousFiles)
  }
  Object.keys(files).forEach((name) => {
    if (include && !include.has(name)) return
    const filePath = path.join(dir, name)
    // 该函数确保该目录存在，如果目录结构不存在，它将由该函数创建。也可以使用mkdirsSync()和mkdirpSync()代替ensureDirSync()
    fs.ensureDirSync(path.dirname(filePath))
    // 写入文件
    fs.writeFileSync(filePath, files[name])
  })
}
```

## TODO: 

- [x] 这部分的内容确实很复杂，也没有完全梳理整个逻辑，后续会考虑参考源码实现简单的Generator
- [x] `add`,`inspect`,`init`等剩余其他命令的源码[参考文档](https://kuangpf.com/vue-cli-analysis)