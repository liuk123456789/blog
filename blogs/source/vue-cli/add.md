---
title: vue-cli-第三篇
date: 2023-06-02
categories: 
 - 源码解读
tags:
 - vue-cli-第三篇
sidebar: auto
---

## 1. 前言

这一篇说的是`vue add/invoke`命令，此命令的功能是在`vue-cli`中安装插件并调用其`generator`

## 2. 命令详情

```javascript
program
  .command('add <plugin> [pluginOptions]')
  .description('install a plugin and invoke its generator in an already created project')
  .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .allowUnknownOption()
  .action((plugin) => {
    require('../lib/add')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('invoke <plugin> [pluginOptions]')
  .description('invoke the generator of a plugin in an already created project')
  .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .allowUnknownOption()
  .action((plugin) => {
    require('../lib/invoke')(plugin, minimist(process.argv.slice(3)))
  })
```

可以看出此命令的依赖文件是`add.js`和`invoke.js`，然后将`plugin`名称以及`options`传入

## 3. add.js

```javascript
module.exports = (...args) => {
  return add(...args).catch(err => {
    error(err)
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1)
    }
  })
}
```

调用`add`方法，将参数传入，我们看下`add`方法

### 3.3.1 add方法

```javascript
async function add (pluginToAdd, options = {}, context = process.cwd()) {
  // 用于判定git 是否存在文件提交
  if (!(await confirmIfGitDirty(context))) {
    return
  }

  // for `vue add` command in 3.x projects
  // 内部依赖直接通过addRouter和addVuex安装
  const servicePkg = loadModule('@vue/cli-service/package.json', context)
  if (servicePkg && semver.satisfies(servicePkg.version, '3.x')) {
    // special internal "plugins"
    if (/^(@vue\/)?router$/.test(pluginToAdd)) {
      return addRouter(context)
    }
    if (/^(@vue\/)?vuex$/.test(pluginToAdd)) {
      return addVuex(context)
    }
  }

  const pluginRe = /^(@?[^@]+)(?:@(.+))?$/
  const [
    // eslint-disable-next-line
    _skip,
    pluginName,
    pluginVersion
  ] = pluginToAdd.match(pluginRe)
  // 1. vue-cli-plugin-foo, @vue/cli-plugin-foo, @bar/vue-cli-plugin-foo 直接返回对应的plugin名称
  // 2. 官方插件 返回@vue/cli-plugin-**形式 如 babel => @vue/cli-plugin-babel
  // 3. 首字母是@开头 如：@vue/foo @bar/foo
  // @vue/foo => @vue/cli-plugin-foo
  // @bar/foo => @bar/vue-cli-plugin-foo
  // 4. foo => @vue/cli-plugin-foo
  const packageName = resolvePluginId(pluginName)

  log()
  log(`📦  Installing ${chalk.cyan(packageName)}...`)
  log()

  const pm = new PackageManager({ context })

  if (pluginVersion) {
    // 添加依赖到package.json中
    await pm.add(`${packageName}@${pluginVersion}`)
  } else if (isOfficialPlugin(packageName)) {
    const { latestMinor } = await getVersions()
    await pm.add(`${packageName}@~${latestMinor}`)
  } else {
    await pm.add(packageName, { tilde: true })
  }

  log(`${chalk.green('✔')}  Successfully installed plugin: ${chalk.cyan(packageName)}`)
  log()
  // 调用生成器
  const generatorPath = resolveModule(`${packageName}/generator`, context)
  if (generatorPath) {
    // 调用invoke方法
    invoke(pluginName, options, context)
  } else {
    log(`Plugin ${packageName} does not have a generator to invoke`)
  }
}
```

这部分代码相对比较简单，需要注意的就是调用`invoke`方法，所以看下`invoke`做了什么

## 4. invoke.js

```javascript
async function invoke (pluginName, options = {}, context = process.cwd()) {
  if (!(await confirmIfGitDirty(context))) {
    return
  }

  delete options._
  const pkg = getPkg(context)

  // 从本地的package.json文件中匹配plugin
  const findPlugin = deps => {
    if (!deps) return
    let name
    // official
    if (deps[(name = `@vue/cli-plugin-${pluginName}`)]) {
      return name
    }
    // full id, scoped short, or default short
    if (deps[(name = resolvePluginId(pluginName))]) {
      return name
    }
  }

  const id = findPlugin(pkg.devDependencies) || findPlugin(pkg.dependencies)
  if (!id) {
    throw new Error(
      `Cannot resolve plugin ${chalk.yellow(pluginName)} from package.json. ` +
        `Did you forget to install it?`
    )
  }
  // 调用generator
  const pluginGenerator = loadModule(`${id}/generator`, context)
  if (!pluginGenerator) {
    throw new Error(`Plugin ${id} does not have a generator.`)
  }

  // resolve options if no command line options (other than --registry) are passed,
  // and the plugin contains a prompt module.
  // eslint-disable-next-line prefer-const
  let { registry, $inlineOptions, ...pluginOptions } = options
  if ($inlineOptions) {
    try {
      pluginOptions = JSON.parse($inlineOptions)
    } catch (e) {
      throw new Error(`Couldn't parse inline options JSON: ${e.message}`)
    }
  } else if (!Object.keys(pluginOptions).length) {
    let pluginPrompts = loadModule(`${id}/prompts`, context)
    if (pluginPrompts) {
      const prompt = inquirer.createPromptModule()

      if (typeof pluginPrompts === 'function') {
        pluginPrompts = pluginPrompts(pkg, prompt)
      }
      if (typeof pluginPrompts.getPrompts === 'function') {
        pluginPrompts = pluginPrompts.getPrompts(pkg, prompt)
      }
      pluginOptions = await prompt(pluginPrompts)
    }
  }

  const plugin = {
    id,
    apply: pluginGenerator,
    options: {
      registry,
      ...pluginOptions
    }
  }

  await runGenerator(context, plugin, pkg)
}
```

该方法先调用 `findPlugin` 判断插件是否安装，接着判断是否有 `generator（pluginGenerator）`，然后就是判断插件是否含有 `prompt`。如果有则调用 `inquirer.prompt` 获取插件的 `option`，并传给其 `generator`，在完成这些以后，就是 `runGenerator`。

而对于 `vue-cli` 内部一些特殊的"插件"，比如 `router，vuex`就直接调用 `runGenerator`。

`runGenerator` 的实质就是构造一个 `Generator` 实例，并调用其 `generate` 方法。 如果对 `generate` 方法还不熟悉的话，可查看下 `vue create` 部分。 在实例的 `generator` 方法调用完成之后执行以下命令：

```javascript
git ls-files --exclude-standard --modified --others
```

因为插件的 `generator` 可以通过 `GeneratorAPI` 暴露的 `render` 和 `extendPackage` 方法修改项目的文件

