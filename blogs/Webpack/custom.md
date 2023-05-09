---
title: webpack系列-第三篇
date: 2023-05-08
categories: 
 - Webpack
tags:
 - webpack 第三篇
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

。。。待更新
