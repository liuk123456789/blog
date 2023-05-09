---
title: webpack系列-第四篇
date: 2023-05-08
categories: 
 - Webpack
tags:
 - webpack 第四篇
sidebar: auto
---

# 1. 前言

因为`webpack`涉及到了很多`loader`和`plugin`配置，所以看下`webpack`中如何实现`loader`和`plugin`

## 2. loader

### 分类

#### 同步loader

```javascript
module.exports = function(source) {
    const result = someSyncOperation(source); // 同步逻辑
    return result;
}
```



#### 异步loader

```javascript
module.exports = function(source) {
	const callback = this.sync();
    // 异步逻辑
    someAsyncOperation(content, function(err, result) => {
   		if(err) return callback(err)
    	callback(null, result, map, meta)
    })
}
```



#### Pitching loader

`Pitching Loader` 是一个比较重要的概念，`Loader`总是从右往左被调用，如下

```javascript
{
  test: /\.js$/,
  use: [
    { loader: 'aa-loader' },
    { loader: 'bb-loader' },
    { loader: 'cc-loader' },
  ]
}
```

每个`Loader`都支持一个`pitch`属性，通过`module.exports.pitch`声明，如果`Loader`声明了`pitch`，那么该方法会优先于`Loader`的实际方法先执行，官方给出了执行顺序

```
|- aa-loader `pitch`
  |- bb-loader `pitch`
    |- cc-loader `pitch`
      |- requested module is picked up as a dependency
    |- cc-loader normal execution
  |- bb-loader normal execution
|- aa-loader normal execution
```

也就是会先从左向右执行一次每个 `Loader` 的 `pitch` 方法，再按照从右向左的顺序执行其实际方法。

#### Raw Loader

`url-laoder`和`file-loader`有一行这个代码

```javascript
export const raw = true;
```

默认情况下，`webpack`会把文件进行`UTF-8`编码，然后传给`Loader`，通过设置`raw`,`Loader`就可以接受原始的`Buffer`数据

### 重要的API

所谓`Loader`，也只是符合`commonjs`规范的`node`模块，它会导出一个可执行函数。`Loader runner`会调用这个函数，将文件内容或上一个`Loader`的处理结果传递进去。同时，`webpack`还为`Loader`提供了一个上下文`this`，其中存在很多有用的`api`

#### this.callback()

在 `Loader` 中，通常使用 `return` 来返回一个字符串或者 `Buffer`。如果需要返回多个结果值时，就需要使用 `this.callback`，定义如下：

```typescript
this.callback(
  // 无法转换时返回 Error，其余情况都返回 null
  err: Error | null,
  // 转换结果
  content: string | Buffer,
  // source map，方便调试用的
  sourceMap?: SourceMap,
  // 可以是任何东西。比如 ast
  meta?: any
);
```

一般来说如果调用该函数的话，应该手动 `return`，告诉 `webpack` 返回的结果在 `this.callback` 中，以避免含糊不清的结果：

```javascript
module.exports = function(source) {
	this.callback(null, source, sourceMaps);
    return;
}
```

#### this.async()

使用方式同`this.callback()`，异步`Loader`

#### this.cacheable()

有些情况下，有些操作需要耗费大量时间，每一次调用 `Loader` 转换时都会执行这些费时的操作。

在处理这类费时的操作时， `webapck` 会默认缓存所有 `Loader` 的处理结果，只有当被处理的文件发生变化时，才会重新调用 `Loader` 去执行转换操作。

`webpack` 是默认可缓存的，可以执行 `this.cacheable(false)` 手动关闭缓存。

#### this.resource

当前处理文件的完整请求路径，包括 `query`，比如 `/src/App.vue?type=templpate`。

#### this.resourcePath

当前处理文件的路径，不包括 `query`，比如 `/src/App.vue`。

#### this.resourceQuery

当前处理文件的 `query` 字符串，比如 `?type=template`。我们在 `vue-loader` 里有见过如何使用它：

```js
const qs = require('querystring');

const { resourceQuery } = this;
const rawQuery = resourceQuery.slice(1); // 删除前面的 ?
const incomingQuery = qs.parse(rawQuery); // 解析字符串成对象
// 取 query
if (incomingQuery.type) {}
```

#### this.emitFile

让 `webpack` 在输出目录新建一个文件，我们在 `file-loader` 里有见过：

```js
if (typeof options.emitFile === 'undefined' || options.emitFile) {
  this.emitFile(outputPath, content);
}
```

更多的 `api` 可在官方文档中查看：[Loader Interface](https://webpack.js.org/api/loaders/)

### Loader 工作流程简述

我们来回顾一下 `Loader` 的一些特点：

- `Loader` 是一个 `node` 模块；
- `Loader` 可以处理任意类型的文件，转换成 `webpack` 可以处理的模块；
- `Loader` 可以在 `webpack.config.js` 里配置，也可以在 `require` 语句里内联；
- `Loader` 可以根据配置从右向左链式执行；
- `Loader` 接受源文件内容字符串或者 `Buffer`；
- `Loader` 分为多种类型：同步、异步和 `pitching`，他们的执行流程不一样；
- `webpack` 为 `Loader` 提供了一个上下文，有一些 `api` 可以使用；
- ...

我们根据以上暂时知道的特点，可以对 `Loader` 的工作流程有个猜测，假设有一个 `js-loader`，它的工作流程简单来说是这样的：

1. `webpack.config.js` 里配置了一个 `js` 的 `Loader`；
2. 遇到 `js` 文件时，触发了 `js-loader`;
3. `js-loader` 接受了一个表示该 `js` 文件内容的 `source`;
4. `js-loader` 使用 `webapck` 提供的一系列 `api` 对 `source` 进行转换，得到一个 `result`;
5. 将 `result` 返回或者传递给下一个 `Loader`，直到处理完毕。

关于 `Loader` 的工作流程以及源码分析可以看 [【webpack进阶】你真的掌握了loader么？- loader十问](https://juejin.im/post/5bc1a73df265da0a8d36b74f#heading-1)。

### 自定义Loader

#### 1. 用法准则

这里说一下**单一任务和链式调用**。

一个 `Loader` 应该只完成一个功能，如果需要多步的转换工作，则应该编写多个 `Loader` 来进行链式调用完成转换。比如 `vue-loader` 只是处理了 `vue` 文件，起到一个分发的作用，将其中的 `template/style/script` 分别交给不同的处理器来处理。

这样会让维护 `Loader` 变得更简单，也能让不同的 `Loader` 更容易地串联在一起，而不是重复造轮子。

#### 2.Loader 工具库

编写 `Loader` 的过程中，最常用的两个工具库是 `loader-utils` 和 `schema-utils`，在现在常见的 `Loader` 中都能看到它们的身影。

#### 3.loader-utils

它提供了许多有用的工具，但最常用的一种工具是获取传递给 `Loader` 的选项：

```js
import { getOptions } from 'loader-utils';

export default function loader(src) {
  // 加载 options
  const options = getOptions(this) || {};
}
```

[loader-utils](https://github.com/webpack/loader-utils)

#### 4.schema-utils

配合 `loader-utils`，用于保证 `Loader` 选项，进行与 `JSON Schema` 结构一致的校验。

```javascript
import validateOptions from 'schema-utils';
import schema from './options.json';

export default function loader(src) {
  // 校验 options
  validateOptions(schema, options, {
    name: 'URL Loader',
    baseDataPath: 'options',
  });
}
```

### file-loader 源码

核心代码如下

```javascript
import path from 'path';

import { getOptions, interpolateName } from 'loader-utils';
import { validate } from 'schema-utils';

import schema from './options.json';

// content 原文件内容
export default loader(content) {
    const options = getOptions(this);
    // options 是json schema 配置
    validate(schema, options, {
        name: 'File Loader',
        baseDataPath: 'options'
    })
    // 上下文对象
    const context = options.context || this.rootContext
    // 不传入默认 内容hash拼接后缀名
    const name = options.name || '[contenthash].[ext]';
    // interpolateName 方法可以根据 name 和 content 内容生成哈希
  	// 可以保证文件内容没有发生变化的时候，文件名中的 [hash] 字段不变
    const url = interpolateName(this, name, {
        context,
        content,
        regExp: options.regExp,
  	});
    // 资源存放目录 如：dist/imgs/****.ext
    if (options.outputPath) {
        if (typeof options.outputPath === 'function') {
          outputPath = options.outputPath(url, this.resourcePath, context);
        } else {
          outputPath = path.posix.join(options.outputPath, url);
        }
    }
    // __webpack_public_path__ 会被编译成：output.publicPath
	let publicPath = `__webpack_public_path__ + ${JSON.stringify(outputPath)}`;

    // 配置的publiPath,options.publicPath会替换调output.publicPath
    // 如 publicPath: 'app/', options.publicPath: 'assets/'
    // 原图片地址 app/outputPath会被替换为 assets/outputPath
  	if (options.publicPath) {
        if (typeof options.publicPath === 'function') {
          publicPath = options.publicPath(url, this.resourcePath, context);
        } else {
          publicPath = `${
            options.publicPath.endsWith('/')
              ? options.publicPath
              : `${options.publicPath}/`
          }${url}`;
        }

    	publicPath = JSON.stringify(publicPath);
  	}
    // 省略emitFile的处理
    
    const esModule =
    typeof options.esModule !== 'undefined' ? options.esModule : true;
	// 返回字符串 是因为在通过此loader解析后，文件源路径会被publicPath代替
  	return `${esModule ? 'export default' : 'module.exports ='} ${publicPath};`;
}

// `webpack`会把文件进行`UTF-8`编码，然后传给`Loader`，通过设置`raw`,`Loader`就可以接受原始的`Buffer`数据
export const raw = true;
```

## 3. plugin

### tabable

在自定义插件前，必须先了解`tapable`，`tappable`是`webpack`的一个核心工具，它也可适用于其他地方，以提供类似的插件接口

`webpack`中许多对象扩展自`Tapable`类，这个类暴露`tap`，`tapAsync`，`tapPromise`注册事件方法，对应的调用方法call，callAsync，promise，可以使用这些方法，注入自定义的构建步骤，这个编译过程中不同时机触发

`tapable`给我们暴露很多钩子类，能为我们的插件提供挂载的钩子。那么这些钩子可以分为2个类别，即 "同步" 和 "异步"， 异步又分为两个类别，"并行" 还是 "串行"，同步的钩子它只有 "串行"。

```markdown
## 同步钩子
SyncHook
SyncBailHook
SyncWaterfallHook
SyncLoopHook

## 异步钩子

### 并行
AsyncParallelHook
AsyncParallelBailHook

### 串行
AsyncSeriesHook
AsyncSeriesBailHook
AsyncSeriesWaterHook

```

**hook分类**

- Basic 按顺序执行每个事件函数，不关系函数返回值
  - SyncHook
  - AsyncParallelHook
  - AsyncSeriesHook
- Bail 执行每个事件函数，遇到结果不为undefined则结束执行
  - SyncBailHook
  - AsyncParallelBailHook
- Waterfall 将最近上一个函数的返回值作为下一个函数的参数，如果上一个函数没有返回值(返回undefined)，那么就继续找上上个，如果找不到就用自己传入的参数
- Loop 不停循环执行事件函数，直到所有函数结果result === undefined,每次循环都是从头开始
  - SyncLoopHook

### 创建插件

webpack 插件由以下组成：

- 一个 JavaScript 命名函数或 JavaScript 类。
- 在插件函数的 prototype 上定义一个 `apply` 方法。
- 指定一个绑定到 webpack 自身的[事件钩子](https://webpack.docschina.org/api/compiler-hooks/)。
- 处理 webpack 内部实例的特定数据。
- 功能完成后调用 webpack 提供的回调

如下所示

```javascript
class MyCustomWebpackPlugin {
    // 原型对象上定义apply方法，参数为compiler
    // compiler 是webpack的核心引擎
    apply(compiler) {
        compiler.hooks.emit.tagAsync(
        	'MyCustomWebpackPlugin',
            (compilation, callback) => {
                console.log('这是我的自定义插件')
                compilation.addModule(/*...*/)
                callback()
            }
        )
    }
    
}
```

在上述的demo中，看到使用了`compiler`&`compilation`两个核心`api`

## Compiler&Compilation

### Complier

Compiler 对象包含了Webpack环境所有的配置信息，包含options (loaders, plugins...) 这些项，这个对象在webpack启动时候被实例化，它是全局唯一的。我们可以把它理解为webpack的实列。

### Compilation

compilation 对象包含了当前的模块资源、编译生成资源、文件的变化等。当webpack在开发模式下运行时，每当检测到一个文件发生改变的时候，那么一次新的 Compilation将会被创建。从而生成一组新的编译资源。

**Compiler对象 与 Compilation 对象 的区别是：** Compiler代表了是整个webpack从启动到关闭的生命周期。Compilation 对象只代表了一次新的编译。

## plugin中常用的api

#### 1. 读取输出资源、模块、依赖

`Compiler`中的`emit`钩子官方的解释为

> 输出 asset 到 output 目录之前执行。这个钩子 *不会* 被复制到子编译器。

因此我们可以读取输出的资源、代码块、模块以及对应依赖，大致为

```typescript
import { Compiler, WebpackPluginInstance } from 'webpack'

export default class CustomChunksPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
      // 使用tapAsync 代表异步钩子
      compiler.hooks.emit.tapAsync('CustomChunksPlugin', (compilation, callback) => {
        console.log(compilation.chunks)
        callback()
      })
  }
}
```

#### 2. 监听文件变化

webpack读取文件的时候，它会从入口模块去读取，然后依次找出所有的依赖模块。当入口模块或依赖的模块发生改变的时候，那么就会触发一次新的 Compilation。

在我们开发插件的时候，我们需要知道是那个文件发生改变，导致了新的Compilation, 我们可以添加如下代码进行监听

```typescript
import { Compiler, WebpackPluginInstance } from 'webpack'

export default class CustomWatchPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
      // 使用tapAsync 代表异步钩子
      compiler.hooks.watchRun.tapAsync('CustomWatchPlugin', (compilation, callback) => {
        // dosomething
        callback()
      })
  }
}
```

#### 3. 修改输出资源

我们在第一点说过：在我们的emit钩子事件发生时，表示的含义是：源文件的转换和组装已经完成了，在这里事件钩子里面我们可以读取到最终将输出的资源、代码块、模块及对应的依赖文件。因此如果我们现在要修改输出资源的内容的话，我们可以在emit事件中去做修改。那么所有输出的资源会存放在 compilation.assets中，compilation.assets是一个键值对，键为需要输出的文件名，值为文件对应的内容

```typescript
import { Compiler, WebpackPluginInstance } from 'webpack'

export default class CustomAssetsPlugin implements WebpackPluginInstance {
  apply(compiler: Compiler) {
      // 使用tapAsync 代表异步钩子
      compiler.hooks.emit.tapAsync('CustomAssetsPlugin', (compilation, callback) => {
        // dosomething
        compilation.assets[filename] = {
            source: () => {
                // fileContent 即可以代表文本文件的字符串，也可以是代表二进制文件的bufferreturn fileContent;
            },
            size: () => {
                return Buffer.byteLength(fileContent, 'utf8')
            }
        }
        callback()
      });
      
      compiler.hooks.emit.tapAsync('CustomAssetsPlugin', (compilation, callback) => {
          const asset = compilation.assets[filename];
          callback()
      })
  }
}
```

## 实现一个日志插件

```typescript
import { Compiler, WebpackPluginInstance } from 'webpack'

export default class LogWebpackPlugin implements WebpackPluginInstance {
  emitCallback: () => void
  doneCallback: () => void
  constructor(doneCallback: () => void, emitCallback: () => void) {
    this.emitCallback = emitCallback
    this.doneCallback = doneCallback
  }
  apply(compiler: Compiler) {
    compiler.hooks.emit.tap('LogWebpackPlugin', () => {
      this.emitCallback()
    })
    compiler.hooks.done.tap('LogWebpackPlugin', () => {
      this.doneCallback()
    })
    		          compiler.hooks.compilation.tap('LogWebpackPlugin', () => {
      // compilation（'编译器'对'编译ing'这个事件的监听）
      console.log('The compiler is starting a new compilation...')
    })
    compiler.hooks.compile.tap('LogWebpackPlugin', () => {
      // compile（'编译器'对'开始编译'这个事件的监听）
      console.log('The compiler is starting to compile...')
    })
  }
}
```

**Usage**

```typescript
import CustomLoggerPlugin from './plugins/CustomLoggerPlugin'

const webpackBaseConfig: Configuration = {
    plugins: [
        new CustomLoggerPlugin(
        () => {
            // Webpack 模块完成转换成功
            console.log('emit 事件发生啦，所有模块的转换和代码块对应的文件已经生成好~')
      	},
        () => {
            // Webpack 构建成功，并且文件输出了后会执行到这里，在这里可以做发布文件操作
            console.log('done 事件发生啦，成功构建完成~')
          }
        )
    ]
}
```

**效果**

![20230509173004](/my-blog/webpack/plugin_20230509173004.png)
