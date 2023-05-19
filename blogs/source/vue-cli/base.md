---
title: 第一篇 creator
date: 2023-03-15 
categories: 
 - 源码解读
tags:
 - vue cli creator
sidebar: auto
---

## 1. 版本说明

```text
vue-cli: 5.0.8
```

## 2. 入口

打开项目的`package.json`文件，如下

```json
{
  "private": true,
  "workspaces": [
    "packages/@vue/*",
    "packages/test/*",
    "packages/vue-cli-version-marker"
  ],
  "scripts": {
    "test": "node --experimental-vm-modules scripts/test.js",
    "pretest": "yarn clean",
    "lint": "eslint --fix packages/**/*.js packages/**/bin/*",
    "lint-without-fix": "eslint packages/**/*.js packages/**/bin/*",
    "check-links": "node scripts/checkLinks.js",
    "clean": "rimraf packages/test/* packages/**/temp/*",
    "clean-e2e": "rimraf /tmp/verdaccio-workspace",
    "sync": "node scripts/syncDeps.js",
    "boot": "node scripts/bootstrap.js",
    "release": "yarn --pure-lockfile && yarn clean && node scripts/release.js",
    "version": "node scripts/genChangelog.js && node scripts/genDocs.js && git add CHANGELOG.md && git add docs",
    "docs": "vitepress dev docs",
    "docs:build": "vitepress build docs",
    "patch-chromedriver": "node scripts/patchChromedriver.js"
  },
  "gitHooks": {
    "pre-commit": "lint-staged",
    "commit-msg": "node scripts/verifyCommitMsg.js"
  },
  "lint-staged": {
    "*.{js,vue}": "eslint --fix",
    "packages/**/bin/*": "eslint --fix"
  },
  "devDependencies": {
  },
  "resolutions": {
    "puppeteer": "1.13.0"
  },
  "packageManager": "yarn@1.22.11"
}

```

- workspaces

  npm install 时将 workspaces 下面的包，软链到根目录的 node_modules 中，不用手动执行 `npm link` 操作。

- resolutions

  - 当项目会依赖一个不常更新的包，但这个包又依赖另一个需要立即升级的包。 这时候，如果这个（不常更新的）包的依赖列表里不包含需要升级的包的新版本，那就只能等待作者升级，没别的办法。

  - 项目的子依赖（依赖的依赖）需要紧急安全更新，来不及等待直接依赖更新。

  - 项目的直接依赖还可以正常工作但已经停止维护，这时子依赖需要更新。 同时，你清楚子依赖的更新不会影响现有系统，但是又不想通过 fork 的方式来升级直接依赖。

    项目的直接依赖定义了过于宽泛的子依赖版本范围，恰巧这其中的某个版本有问题，这时你想要把子依赖限制在某些正常工作的版本范围里。

需要详细了解`package.json`的字段说明，[参考此文](https://juejin.cn/post/7145001740696289317#heading-17)

根据`package.json`的配置，我们可以进入`packages`的`@vue`目录查看下有什么，选择其中`cli`目录，这便是通过命令方式安装`cli`的内容

```bash
npm install -g @vue/cli
# OR
yarn install -g @vue/cli
```

## 3. @vue/cli 文件分析

### package.json

```
{
	"bin": {
		"vue": "bin/vue.js"
	}
}
```

配置了`bin`也是我们为什么可以使用`vue create project-name`命令生成模板的原因

`vue`就是注册的命令，全局安装或者链接全局后就可以使用该命令

分析
在安装第三方带有bin字段的`npm`包时，可执行文件就会被链接到当前项目的`./node_modules/.bin`中，就可以使用`node node_modules/.bin/vue`执行

但如果是把包全局安装，`npm`就会把文件链接到`prefix/bin`中，我们就可以直接全局使用`vue`命令执行脚本了

```bash
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\..\@vue\cli\bin\vue.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\..\@vue\cli\bin\vue.js" %*
)
```

可以看到，最终执行的是`vue.js`的脚本，对应了`bin`配置的`bin/vue.js`

### vue.js文件

**头部注释 #!/usr/bin/env node**

```
#!/usr/bin/env node
```

> `#!/usr/bin/env node` `Linux`/`Unix`中管这个叫做`Shebang`,用于指明这个脚本的解释程序，`/usr/bin/env`就是告诉系统可以在PATH（环境变量中的`path`）目录中查找。 所以配置`#!/usr/bin/env node`, 就是解决了不同的用户node路径不同的问题，可以让系统动态的去查找`node`来执行你的脚本文件。

#### **检测node版本**

```javascript
// chalk 一个npm 包，用来对控制台 console.log 的内容进行样式包装。
// semver 语义化版本号包
const { chalk, semver } = require('@vue/cli-shared-utils')
// node 版本 12 或者 14以上
const requiredVersion = require('../package.json').engines.node

// 检测node 版本
function checkNodeVersion (wanted, id) {
  if (!semver.satisfies(process.version, wanted, { includePrerelease: true })) {
    console.log(chalk.red(
      'You are using Node ' + process.version + ', but this version of ' + id +
      ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
    ))
    process.exit(1)
  }
}

checkNodeVersion(requiredVersion, '@vue/cli')
```

`Semver`:

- 软件的版本通常由三位组成，形如：X.Y.Z

- 版本是严格递增的，此处是：15.6.1 -> 15.6.2 -> 16.0.0

- 在发布重要版本时，可以发布 alpha、beta、rc 等先行版本

  beta 和 rc 等修饰版本的关键字后面可以带上次数和 meta 信息

#### **调试模式**

```javascript
// enter debug mode when creating test repo
// process.cwd() 返回当前node.js 运行的目录
if (
  slash(process.cwd()).indexOf('/packages/test') > 0 && (
    fs.existsSync(path.resolve(process.cwd(), '../@vue')) ||
    fs.existsSync(path.resolve(process.cwd(), '../../@vue'))
  )
) {
  process.env.VUE_CLI_DEBUG = true
}
```

### **commander**

脚本最为核心的一块，我们从头开始，先看下`commander`包的使用说明

[commander的使用说明](https://github.com/tj/commander.js/blob/8b03ab75b5431fd2d58a24b842ba088d621f12dc/Readme.md)

```javascript
const loadCommand = require('../lib/util/loadCommand')
```

`loadCommand`在后面我们在讲

```typescript
program
  .version(`@vue/cli ${require('../package').version}`)
  .usage('<command> [options]')
```

`program.version`是我们可以使用`vue --version`获取`vue-cli`版本号的原因

`program.usage`是我们使用`vue/vue --help`命令时，终端展示的相关信息

如下图

![vue-cli-commander](/my-blog/source/vue-cli/vue-cli-commander.jpg)

#### **create命令**

```javascript
program
  .version(`@vue/cli ${require('../package').version}`)
  .usage('<command> [options]')

program
  .command('create <app-name>')
  .description('create a new project powered by vue-cli-service')
  .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset')
  .option('-d, --default', 'Skip prompts and use default preset')
  .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset')
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies')
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .option('-g, --git [message]', 'Force git initialization with initial commit message')
  .option('-n, --no-git', 'Skip git initialization')
  .option('-f, --force', 'Overwrite target directory if it exists')
  .option('--merge', 'Merge target directory if it exists')
  .option('-c, --clone', 'Use git clone when fetching remote preset')
  .option('-x, --proxy <proxyUrl>', 'Use specified proxy when creating project')
  .option('-b, --bare', 'Scaffold project without beginner instructions')
  .option('--skipGetStarted', 'Skip displaying "Get started" instructions')
  .action((name, options) => {
    // vue create [app-name] 多余的参数会被忽略
    if (minimist(process.argv.slice(3))._.length > 1) {
      console.log(chalk.yellow('\n Info: You provided more than one argument. The first one will be used as the app\'s name, the rest are ignored.'))
    }
    // --git makes commander to default git to true
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true
    }
    require('../lib/create')(name, options)
  })
```

对应的选项说明如下（ [vue cli官网](https://github.com/tj/commander.js/blob/8b03ab75b5431fd2d58a24b842ba088d621f12dc/Readme.md)提供）

```bash
  -p, --preset <presetName>       忽略提示符并使用已保存的或远程的预设选项
  -d, --default                   忽略提示符并使用默认预设选项
  -i, --inlinePreset <json>       忽略提示符并使用内联的 JSON 字符串预设选项
  -m, --packageManager <command>  在安装依赖时使用指定的 npm 客户端
  -r, --registry <url>            在安装依赖时使用指定的 npm registry
  -g, --git [message]             强制 / 跳过 git 初始化，并可选的指定初始化提交信息
  -n, --no-git                    跳过 git 初始化
  -f, --force                     覆写目标目录可能存在的配置
  -c, --clone                     使用 git clone 获取远程预设选项
  -x, --proxy                     使用指定的代理创建项目
  -b, --bare                      创建项目时省略默认组件中的新手指导信息
  -h, --help                      输出使用帮助信息
```

##### `action handler`处理函数

> 命令处理函数的参数，为该命令声明的所有参数，除此之外还会附加两个额外参数：一个是解析出的选项，另一个则是该命令对象自身。

##### `minimist`

通过`process.argv`解析命令行参数的demo

![vue-cli-argv](/my-blog/source/vue-cli/vue-cli-argv.jpg)

使用`minimist`解析命令行参数的demo

![vue-cli-minimist](/my-blog/source/vue-cli/vue-cli-minimist.jpg)

很明显，它会过滤掉 `-` 以及`--`的命令函数

#### 剩余其他命令如下

- add 新增插件

- invoke 调用插件生成器

- inspect 使用vue-cli服务检查项目中的webpack配置 （项目中可以使用配置脚本命令，看看vue-cli 对webpack做了哪些集成）

  如下

  

- serve 启用本地服务,运行项目（npm run serve）

- build 打包项目 （npm run build)

- ui 使用`vue ui`可视化界面创建`vue`项目初始模板

- init (vue-cli 2.x)老模板的创建，参考官网的说明

- outdated（实验阶段） 检查是否有过时的vue-cli服务/插件

- upgrade（实验阶段）升级vue-cli/插件

- migrate（实验阶段）为已安装的cli插件运行migrator

- info 运行的环境信息

#### --help & 容错处理 & 输入建议配置

```javascript
// output help information on unknown commands
program.on('command:*', ([cmd]) => {
  program.outputHelp()
  console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
  console.log()
  suggestCommands(cmd)
  process.exitCode = 1
})

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.cyan(`vue <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

// enhance common error messages
const enhanceErrorMessages = require('../lib/util/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
    flag ? `, got ${chalk.yellow(flag)}` : ``
  )
})

program.parse(process.argv)

function suggestCommands (unknownCommand) {
  const availableCommands = program.commands.map(cmd => cmd._name)

  let suggestion

  availableCommands.forEach(cmd => {
    const isBestMatch = leven(cmd, unknownCommand) < leven(suggestion || '', unknownCommand)
    if (leven(cmd, unknownCommand) < 3 && isBestMatch) {
      suggestion = cmd
    }
  })

  if (suggestion) {
    console.log(`  ` + chalk.red(`Did you mean ${chalk.yellow(suggestion)}?`))
  }
}
```

## create.js

#### **inquirer**

[使用文档](https://github.com/SBoudrias/Inquirer.js)

先看下`inquirer`这个命令交互包的基本使用

**安装**

```powershell
npm install inquirer --save
```

**使用**

```javascript
const inquirer = require('inquirer')

const chalk = require('chalk');

const questions = [{
  type: 'input',
  name: 'name',
  message: '请输入用户名'
}, {
  type: 'password',
  name: 'pwd',
  message: '请输入密码'
}, {
  type: 'list',
  name: 'gender',
  message: '请选择您的姓名',
  default: 0,
  choices: [
    { value: 1, name: '男' },
    { value: 2, name: '女' },
    { value: 3, name: '啊这...' }
  ]
}, {
  type: 'checkbox',
  name: 'color',
  message: '你最喜欢的颜色',
  default: 'yellow',
  choices: [
    { value: 'yellow', name: '黄' },
    { value: 'yellow a little', name: '有点黄' },
    { value: 'yellow much', name: '非常黄' },
    { value: 'yellow most', name: '黄到离谱' },
  ]
}]

const startQuestions = async () => {
  try {
    const answers = await inquirer.prompt(questions)
    console.log(chalk.blue(`${ answers.color}`))  
  } catch (error) {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
      console.log(chalk.redBright("Prompt couldn't be rendered in the current environment"))
    } else {
      // Something else went wrong
      console.log(chalk.red(error.message || error))
    }
  }
}

startQuestions()
```

**效果**

![vue-cli-inquirer](/my-blog/source/vue-cli/vue-cli-inquirer.jpg)

**流程图**

![vue-cli-create](/my-blog/source/vue-cli/vue-cli-create.png)

**校验**

**目录名称校验**

```javascript
  const cwd = options.cwd || process.cwd() // 当前工作目录
  const inCurrent = projectName === '.'
  const name = inCurrent ? path.relative('../', cwd) : projectName
  const targetDir = path.resolve(cwd, projectName || '.')

  const result = validateProjectName(name) // validateProjectName 包校验名称是否合法
  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`))
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red.dim('Error: ' + err))
    })
    result.warnings && result.warnings.forEach(warn => {
      console.error(chalk.red.dim('Warning: ' + warn))
    })
    exit(1)
  }
```

**目录是否存在校验**

```javascript
// 目录已存在，且不允许合并目录
if (fs.existsSync(targetDir) && !options.merge) {
    // 覆盖目标目录可能存在的配置
    if (options.force) {
      // 移除目标目录
      await fs.remove(targetDir)
    } else {
      await clearConsole()
      // 是当前目录
      if (inCurrent) {
        const { ok } = await inquirer.prompt([
          {
            name: 'ok',
            type: 'confirm',
            message: `Generate project in current directory?`
          }
        ])
        if (!ok) {
          return
        }
      } else {
        const { action } = await inquirer.prompt([
          {
            name: 'action',
            type: 'list',
            message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
            choices: [
              { name: 'Overwrite', value: 'overwrite' },
              { name: 'Merge', value: 'merge' },
              { name: 'Cancel', value: false }
            ]
          }
        ])
        if (!action) {
          return
        } else if (action === 'overwrite') {
          console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
          await fs.remove(targetDir)
        }
      }
    }
}
```

**Creator**

1. **promptModules**

   ```javascript
   exports.getPromptModules = () => {
     return [
       'vueVersion',
       'babel',
       'typescript',
       'pwa',
       'router',
       'vuex',
       'cssPreprocessors',
       'linter',
       'unit',
       'e2e'
     ].map(file => require(`../promptModules/${file}`))
   }
   ```

   这些是我们在通过`vue create app-name`时的配置信息，如下

   ![vue-cli-terminal](/my-blog/source/vue-cli/vue-cli-terminal.jpg)

2. **resolveIntroPrompts**

   ```javascript
   // 手动配置
   const isManualMode = answers => answers.preset === '__manual__'
   
   resolveIntroPrompts () {
   	const presets = this.getPresets()
       const presetChoices = Object.entries(presets).map(([name, preset]) => {
         let displayName = name
         // Vue version will be showed as features anyway,
         // so we shouldn't display it twice.
         if (name === 'Default (Vue 2)' || name === 'Default (Vue 3)') {
           displayName = 'Default'
         }
   
         return {
           name: `${displayName} (${formatFeatures(preset)})`,
           value: name
         }
       })
       const presetPrompt = {
         name: 'preset',
         type: 'list',
         message: `Please pick a preset:`,
         choices: [
           ...presetChoices,
           {
             name: 'Manually select features',
             value: '__manual__'
           }
         ]
       }
       const featurePrompt = {
         name: 'features',
         when: isManualMode,
         type: 'checkbox',
         message: 'Check the features needed for your project:',
         choices: [],
         pageSize: 10
       }
       return {
         presetPrompt,
         featurePrompt
       }
   }
   ```

   设置`prompt`的命令流程，`presetPrompt`初始预设，`featurePrompt`自定义设置

3. **resolveOutroPrompts**

   ```javascript
   resolveOutroPrompts () {
       const outroPrompts = [
         {
           name: 'useConfigFiles',
           when: isManualMode,
           type: 'list',
           message: 'Where do you prefer placing config for Babel, ESLint, etc.?',
           choices: [
             {
               name: 'In dedicated config files',
               value: 'files'
             },
             {
               name: 'In package.json',
               value: 'pkg'
             }
           ]
         },
         {
           name: 'save',
           when: isManualMode,
           type: 'confirm',
           message: 'Save this as a preset for future projects?',
           default: false
         },
         {
           name: 'saveName',
           when: answers => answers.save,
           type: 'input',
           message: 'Save preset as:'
         }
       ]
   
       // ask for packageManager once
       const savedOptions = loadOptions()
       if (!savedOptions.packageManager && (hasYarn() || hasPnpm3OrLater())) {
         const packageManagerChoices = []
   
         if (hasYarn()) {
           packageManagerChoices.push({
             name: 'Use Yarn',
             value: 'yarn',
             short: 'Yarn'
           })
         }
   
         if (hasPnpm3OrLater()) {
           packageManagerChoices.push({
             name: 'Use PNPM',
             value: 'pnpm',
             short: 'PNPM'
           })
         }
   
         packageManagerChoices.push({
           name: 'Use NPM',
           value: 'npm',
           short: 'NPM'
         })
   
         outroPrompts.push({
           name: 'packageManager',
           type: 'list',
           message: 'Pick the package manager to use when installing dependencies:',
           choices: packageManagerChoices
         })
       }
   
       return outroPrompts
   }
   ```

   主要用于模板保存

4. **PromptModuleAPI**

   功能就是将手动选择项对应的`prompt`压入`featurePrompts`和`injectedPrompts`

5. **create**

   1. 判定是否做了预设/保存过预设模板/使用默认预设

      ```javascript
      if (!preset) {
        if (cliOptions.preset) {
          // vue create foo --preset bar
          preset = await this.resolvePreset(cliOptions.preset, cliOptions.clone)
        } else if (cliOptions.default) {
          // vue create foo --default
          preset = defaults.presets['Default (Vue 3)']
        } else if (cliOptions.inlinePreset) {
          // vue create foo --inlinePreset {...}
          try {
            preset = JSON.parse(cliOptions.inlinePreset)
          } catch (e) {
            error(`CLI inline preset is not valid JSON: ${cliOptions.inlinePreset}`)
            exit(1)
          }
        }
      }
      ```

   2. 否则调用**promptAndResolvePreset**

      ```javascript
      async promptAndResolvePreset (answers = null) {
          // prompt
          if (!answers) {
            await clearConsole(true)
            answers = await inquirer.prompt(this.resolveFinalPrompts())
          }
          debug('vue-cli:answers')(answers)
      
          if (answers.packageManager) {
            saveOptions({
              packageManager: answers.packageManager
            })
          }
      
          let preset
          if (answers.preset && answers.preset !== '__manual__') {
            preset = await this.resolvePreset(answers.preset)
          } else {
            // manual
            preset = {
              useConfigFiles: answers.useConfigFiles === 'files',
              plugins: {}
            }
            answers.features = answers.features || []
            // run cb registered by prompt modules to finalize the preset
            this.promptCompleteCbs.forEach(cb => cb(answers, preset))
          }
      
          // validate
          validatePreset(preset)
      
          // save preset
          if (answers.save && answers.saveName && savePreset(answers.saveName, preset)) {
            log()
            log(`🎉  Preset ${chalk.yellow(answers.saveName)} saved in ${chalk.yellow(rcPath)}`)
          }
      
          debug('vue-cli:preset')(preset)
          return preset
      }
      ```

      1. 通过`resolveFinalPrompts`获取`prompt`的配置，然后`inquirer`触发
      2. 获取包管理工具，进行存储，
      3. 获取预设，是否需要进行保留预设，如果选择是进行预设的保存
      4. `promptCompleteCbs`可以看下`promptModules`下的各个配置项的`onPromptComplete`方法做了具体哪些事（主要是对应的依赖项配置）
      5. 返回设置

      下面自己仿照源码实现的一个简单预设命令,效果如下

      ![vue-cli-pormpt](/my-blog/source/vue-cli/vue-cli-prompt.jpg)

   3. 将依赖项添加到`package.json`的`devDependencies`

      ```javascript
      const pkg = {
        name,
        version: '0.1.0',
        private: true,
        devDependencies: {},
        ...resolvePkg(context)
      }
      const deps = Object.keys(preset.plugins)
      deps.forEach(dep => {
        if (preset.plugins[dep]._isPreset) {
          return
        }
      
        let { version } = preset.plugins[dep]
        // 没有版本号
        if (!version) {
           // 官方的 || cli-service || babel-preset-env
          if (isOfficialPlugin(dep) || dep === '@vue/cli-service' || dep === '@vue/babel-preset-env') {
            version = isTestOrDebug ? `latest` : `~${latestMinor}`
          } else {
            version = 'latest'
          }
        }
      
        pkg.devDependencies[dep] = version
      })
      
      // 写入 package.json
      await writeFileTree(context, {
        'package.json': JSON.stringify(pkg, null, 2)
      })
      ```

      读取`package.json`的配置方法如下

      ```javascript
      const fs = require('fs')
      const path = require('path')
      const readPkg = require('read-pkg')
      
      exports.resolvePkg = function (context) {
        if (fs.existsSync(path.join(context, 'package.json'))) {
          return readPkg.sync({ cwd: context })
        }
        return {}
      }
      ```
   
      **测试下这个小功能**
   
      读取`package.json`
   
      ```javascript
      const fs = require('fs')
      const path = require('path')
      const readPkg = require('read-pkg')
      
      function resolvePkg(context = process.cwd()) {
        if(fs.existsSync(path.join(context, 'package.json'))) {
          return readPkg.sync({ cwd: context})
        }
        return {}
      }
      ```
   
      新的配置写入`package.json`
   
      ```javascript
      const fs = require('fs-extra')
      const path = require('path')
      const readPkg = require('read-pkg')
      const writeFileTree = require('../utils/writeFileTree')
      
      function resolvePkg(context = process.cwd()) {
        if(fs.existsSync(path.join(context, 'package.json'))) {
          return readPkg.sync({ cwd: context})
        }
        return {}
      }
      
      const initWritePkg = async () => {
        const pkg = {
          version: '0.1.0',
          private: true,
          devDependencies: {},
          ...resolvePkg(context=process.cwd())
        }
      
        const preset = {
          plugins: {
            '@vue/cli-service': { bare: true },
            '@vue/cli-plugin-router': {
              history: true
            },
            '@vue/cli-plugin-vuex': {}
          }
        }
      
        const deps = Object.keys(preset.plugins)
      
        deps.forEach(dep => {
          if (preset.plugins[dep]._isPreset) {
            return
          }
      
          let { version } = preset.plugins[dep]
      
          if (!version) {
            version = 'latest'
          }
      
          pkg.devDependencies[dep] = version
        })
      
        await writeFileTree(process.cwd(), {
          'package.json': JSON.stringify(pkg, null, 2)
        })
      }
      
      initWritePkg()
      ```
   
      生成的`package.json`
   
      ```json
      "devDependencies": {
          "@vue/cli-service": "latest",
          "@vue/cli-plugin-router": "latest",
          "@vue/cli-plugin-vuex": "latest"
      }
      ```
   
   4. **shouldInitGit**
   
      ```javascript
      const shouldInitGit = this.shouldInitGit(cliOptions)
      if (shouldInitGit) {
        log(`🗃  Initializing git repository...`)
        this.emit('creation', { event: 'git-init' })
        await run('git init')
      }
      ```

## 结尾

第一步主要还是一些配置&`prompt`相关，下一篇涉及到的就是插件解析&生成器相关，也是最为核心的部分



