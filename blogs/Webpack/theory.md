---
title: webpack系列-第三篇
date: 2023-05-06
categories: 
 - Webpack
tags:
 - webpack 第三篇
sidebar: auto
---

## 1. 前言

第三篇主要就是就是说下`webpack`的一些概念定义，基本上就是自己之前搜的讲的好的一些文章的总结，希望能够帮助更了解`webpack`的运行原理

## 2. module chunk bundle

- module: module是离散功能块，相比于完整程序提供了更小的接触面。精心编写的模块提供了可靠的抽象和封装界限，使得应用程序中每个模块都具有条理清楚的设计和明确的目的。
- chunk: `webpack` 特定术语在内部用于管理捆绑过程。输出束（bundle）由 chunk 组成，其中有几种类型（例如 entry 和 child ）。通常，chunk 直接与 bundle 相对应，但是有些配置不会产生一对一的关系。
- bundle:由许多不同的模块生成，包含已经经过加载和编译过程的源文件的最终版本。

在模块化编程中，对于**module(模块)**广义的认知是所有通过`import/require`等方式引入的代码(*.mjs、*.js文件)。而在万物皆模块的 webpack，项目中**使用**的任何一个资源(如css、图片)也都被视作模块来处理。在 webpack 的编译过程中，module 的角色是**资源的映射对象，储存了当前文件所有信息**，包含资源的路径、上下文、依赖、内容等。
原始的资源模块以 Module 对象形式存在、流转、解析处理。

**chunk(代码块)**是一些模块 (module) 的封装单元。于 webpack 运行时的 **seal** 封包阶段生成，且直到资源构建阶段都会**持续发生变化**的代码块，在此期间插件通过各种[钩子事件](https://www.jianshu.com/p/fb3a8182838c)侵入各个编译阶段对 chunk 进行优化处理。
`webpack` 在 **make** 阶段解析所有模块资源，构建出完整的 [Dependency Graph](https://links.jianshu.com/go?to=https%3A%2F%2Fzhuanlan.zhihu.com%2Fp%2F369953304) (从 Entry 入口起点开始递归收集所有模块之间的依赖关系)。然后在 **seal** 阶段会根据配置及模块依赖图内容构建出一个或多个 chunk 实例，再由 [SplitChunksPlugin](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fplugins%2Fsplit-chunks-plugin%2F) 插件根据规则与 `ChunkGraph` 对 `Chunk` 做一系列的变化、拆解、合并操作，重新组织成一批性能更高的 Chunks。后续再为它们做排序和生成hash等一系列优化处理，直到 Compiler.compile 执行完成作为资源输出(**emitAssets**)。

**bundle(包)** 是 `webpack` 进程执行完毕后输出的**最终结果**，是对 chunk 进行编译压缩打包等处理后的产出。通常与构建完成的 chunk 为一对一的关系。当然存在例外情况



1. 设置sourceMap（devTool: 'source-map')

```javascript
const path = require('path')

module.exports = {
  entry: {
    app: path.resolve(__dirname, 'src/index.js')
  },
  
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash: 6].js',
    chunkFilename: '[name].[contenthash:8].js' // chunkFilename 指未被列在 entry 中，却又需要被打包出来的 chunk 文件的名称。一般来说，这个 chunk 文件指的就是要懒加载的代码。
  }
}
```

可以看出同一个chunk产生了两个bundle，app.js和它对应的app.js.map

1. [MiniCssExtractPlugin](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fplugins%2Fmini-css-extract-plugin%2F) 在 seal 的资源生成阶段 - chunk 获取 Manifest 清单文件的时候抽离出 CssModule 到单独的文件，这时 chunk 关联的css也算一个 bundle 了。

顺便说明下上面的**output.filename**和**output.chunkFilename**：

- filename 是给每个输出的 bundle 命名的(最终的 chunk)，[name]取值为 chunk 的名称。入口 chunk 的[name]是 [entry](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Fentry-context%2F%23naming) 配置的入口对象的 key，如上面的app (但只有当给 entry 传递对象才成立，否则都是默认的main)。runtime chunk 则是[optimization.runtimeChunk](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Foptimization%2F%23optimizationruntimechunk) 配置的名字。
- 如果配置了`chunkFilename`，则**除了包含运行时代码的那个 bundle，其余 bundle 的命名都应用chunkFilename**
  如单独抽出 `runtime chunk`，那么 runtime 应用 `output.filename`，其余都应用`output.chunkFilename`；否则就是包含入口模块的 chunk 应用 `output.filename`，其余用`output.chunkFilename`。

## 3. webpack构建的大致流程

- 初始化参数阶段：用户命令行输入参数/配置的脚本参数，获取最终的配置
- 开始编译：初始化阶段获取的配置初始化得到一个`compiler`对象，注册所有的插件`plugins`，插件开始监听`webpack`构建过程的生命周期的环节（事件），不同的环节会有相应的处理，然后开始执行编译
- 确定入口：根据配置的`entry`入口，开始解析文件构建`AST`语法数，找出依赖，递归下去
- 编译模板：递归过程中，根据文件类型和`loader`配置，调用相应的`loader`对不同的文件做不同的转换处理，找出该模块依赖的模块，然后递归下去，直至项目中依赖的所有模块经过了编译处理
- 编译过程中，有一系列的插件会在不同的环节做相应的事情，如：`UglifyPlugin`会在 `loader` 转换递归完对结果使用 `UglifyJs` 压缩覆盖之前的结果；再比如 `clean-webpack-plugin` ，会在结果输出之前清除 `dist` 目录等等。
- 完成编译并输出：递归结束后，得到每个文件结果，包含转换后的模块以及他们之间的依赖关系，根据`entry` 以及 `output` 等配置生成代码块`chunk`。
- 打包完成：根据`output`输出所有的`chunk`到对应的文件目录

## 4. 热更新原理

#### 一、前言 - webpack 热更新

> `Hot Module Replacement`，简称`HMR`，无需完全刷新整个页面的同时，更新模块。`HMR`的好处，在日常开发工作中体会颇深：**节省宝贵的开发时间、提升开发体验**。

刷新我们一般分为两种：

- 一种是页面刷新，不保留页面状态，就是简单粗暴，直接`window.location.reload()`。
- 另一种是基于`WDS (Webpack-dev-server)`的模块热替换，只需要局部刷新页面上发生变化的模块，同时可以保留当前的页面状态，比如复选框的选中状态、输入框的输入等。

`HMR`作为一个`Webpack`内置的功能，可以通过`HotModuleReplacementPlugin`或`--hot`开启。那么，`HMR`到底是怎么实现热更新的呢？下面让我们来了解一下吧！



#### 二、webpack的编译构建过程

项目启动后，进行构建打包，控制台会输出构建过程，我们可以观察到生成了一个 **Hash值**：`a93fd735d02d98633356`。

![首次构建控制台输出日志](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec043909c70b12~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

然后，在我们每次修改代码保存后，控制台都会出现 `Compiling…`字样，触发新的编译中...可以在控制台中观察到：

- **新的Hash值**：`a61bdd6e82294ed06fa3`
- **新的json文件**： `a93fd735d02d98633356.hot-update.json`
- **新的js文件**：`index.a93fd735d02d98633356.hot-update.js`

![修改代码的编译日志](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec04454e1167f7~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)



首先，我们知道`Hash`值代表每一次编译的标识。其次，根据新生成文件名可以发现，上次输出的`Hash`值会作为本次编译新生成的文件标识。依次类推，本次输出的`Hash`值会被作为下次热更新的标识。

然后看一下，新生成的文件是什么？每次修改代码，紧接着触发重新编译，然后浏览器就会发出 2 次请求。请求的便是本次新生成的 2 个文件。如下：

![浏览器请求](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec04289af752da~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

首先看`json`文件，返回的结果中，`h`代表本次新生成的`Hash`值，用于下次文件热更新请求的前缀。`c`表示当前要热更新的文件对应的是`index`模块。

再看下生成的`js`文件，那就是本次修改的代码，重新编译打包后的。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec04316d6ac5e3~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

还有一种情况是，如果没有任何代码改动，直接保存文件，控制台也会输出编译打包信息的。

- **新的Hash值**：`d2e4208eca62aa1c5389`
- **新的json文件**：`a61bdd6e82294ed06fa3.hot-update.json`



![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec04bd0d47eae4~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)



但是我们发现，并没有生成新的`js`文件，因为没有改动任何代码，同时浏览器发出的请求，可以看到`c`值为空，代表本次没有需要更新的代码。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec04c7b158cb3b~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)



小声说下，`webapck`以前的版本这种情况`hash`值是不会变的，后面可能出于什么原因改版了。细节不用在意，了解原理才是真谛!!!

最后思考下🤔，浏览器是如何知道本地代码重新编译了，并迅速请求了新生成的文件？是谁告知了浏览器？浏览器获得这些文件又是如何热更新成功的？那让我们带着疑问看下热更新的过程，从源码的角度看原理。

#### 三、热更新实现原理

相信大家都会配置`webpack-dev-server`热更新，我就不示意例子了。自己网上查下即可。接下来我们就来看下`webpack-dev-server`是如何实现热更新的？（源码都是精简过的，第一行会注明代码路径，看完最好结合源码食用一次）。

#### 1. webpack-dev-server启动本地服务

我们根据`webpack-dev-server`的`package.json`中的`bin`命令，可以找到命令的入口文件`bin/webpack-dev-server.js`。

```js
// node_modules/webpack-dev-server/bin/webpack-dev-server.js

// 生成webpack编译主引擎 compiler
let compiler = webpack(config);

// 启动本地服务
let server = new Server(compiler, options, log);
server.listen(options.port, options.host, (err) => {
    if (err) {throw err};
});
```

本地服务代码：

```js
// node_modules/webpack-dev-server/lib/Server.js
class Server {
    constructor() {
        this.setupApp();
        this.createServer();
    }
    
    setupApp() {
        // 依赖了express
    	this.app = new express();
    }
    
    createServer() {
        this.listeningApp = http.createServer(this.app);
    }
    listen(port, hostname, fn) {
        return this.listeningApp.listen(port, hostname, (err) => {
            // 启动express服务后，启动websocket服务
            this.createSocketServer();
        }
    }                                   
}
```

这一小节代码主要做了三件事：

- 启动`webpack`，生成`compiler`实例。`compiler`上有很多方法，比如可以启动 `webpack` 所有**编译**工作，以及**监听**本地文件的变化。
- 使用`express`框架启动本地`server`，让浏览器可以请求本地的**静态资源**。
- 本地`server`启动之后，再去启动`websocket`服务，如果不了解`websocket`，建议简单了解一下[websocket速成](https://link.juejin.cn?target=https%3A%2F%2Fwww.ruanyifeng.com%2Fblog%2F2017%2F05%2Fwebsocket.html)。通过`websocket`，可以建立本地服务和浏览器的双向通信。这样就可以实现当本地文件发生变化，立马告知浏览器可以热更新代码啦！

上述代码主要干了三件事，但是源码在启动服务前又做了很多事，接下来便看看`webpack-dev-server/lib/Server.js`还做了哪些事？

#### 2.修改webpack.config.js的entry配置

启动本地服务前，调用了`updateCompiler(this.compiler)`方法。这个方法中有 2 段关键性代码。一个是获取`websocket`客户端代码路径，另一个是根据配置获取`webpack`热更新代码路径。

```js
// 获取websocket客户端代码
const clientEntry = `${require.resolve(
    '../../client/'
)}?${domain}${sockHost}${sockPath}${sockPort}`;

// 根据配置获取热更新代码
let hotEntry;
if (options.hotOnly) {
    hotEntry = require.resolve('webpack/hot/only-dev-server');
} else if (options.hot) {
    hotEntry = require.resolve('webpack/hot/dev-server');
}
```

修改后的`webpack`入口配置如下：

```js
// 修改后的entry入口
{ entry:
    { index: 
        [
            // 上面获取的clientEntry
            'xxx/node_modules/webpack-dev-server/client/index.js?http://localhost:8080',
            // 上面获取的hotEntry
            'xxx/node_modules/webpack/hot/dev-server.js',
            // 开发配置的入口
            './src/index.js'
    	],
    },
}
```

为什么要新增了 2 个文件？在入口默默增加了 2 个文件，那就意味会一同打包到`bundle`文件中去，也就是线上运行时。

**（1）webpack-dev-server/client/index.js**

首先这个文件用于`websocket`的，因为`websoket`是双向通信，如果不了解`websocket`，建议简单了解一下[websocket速成](https://link.juejin.cn?target=https%3A%2F%2Fwww.ruanyifeng.com%2Fblog%2F2017%2F05%2Fwebsocket.html)。我们在第 1 步 `webpack-dev-server`初始化 的过程中，启动的是本地服务端的`websocket`。那客户端也就是我们的浏览器，浏览器还没有和服务端通信的代码呢？总不能让开发者去写吧。因此我们需要把`websocket`客户端通信代码偷偷塞到我们的代码中。客户端具体的代码后面会在合适的时机细讲哦。

**（2）webpack/hot/dev-server.js**

这个文件主要是用于检查更新逻辑的，这里大家知道就好，代码后面会在合适的时机（**第5步**）细讲。

#### 3. 监听webpack编译结束

修改好入口配置后，又调用了`setupHooks`方法。这个方法是用来注册监听事件的，监听每次`webpack`编译完成。

```js
// node_modules/webpack-dev-server/lib/Server.js
// 绑定监听事件
setupHooks() {
    const {done} = compiler.hooks;
    // 监听webpack的done钩子，tapable提供的监听方法
    done.tap('webpack-dev-server', (stats) => {
        this._sendStats(this.sockets, this.getStats(stats));
        this._stats = stats;
    });
};
```

当监听到一次`webpack`编译结束，就会调用`_sendStats`方法通过`websocket`给浏览器发送通知，`ok`和`hash`事件，这样浏览器就可以拿到最新的`hash`值了，做检查更新逻辑。

```js
// 通过websoket给客户端发消息
_sendStats() {
    this.sockWrite(sockets, 'hash', stats.hash);
    this.sockWrite(sockets, 'ok');
}
```

### 4. webpack监听文件变化

每次修改代码，就会触发编译。说明我们还需要监听本地代码的变化，主要是通过`setupDevMiddleware`方法实现的。

这个方法主要执行了`webpack-dev-middleware`库。很多人分不清`webpack-dev-middleware`和`webpack-dev-server`的区别。其实就是因为`webpack-dev-server`只负责启动服务和前置准备工作，所有文件相关的操作都抽离到`webpack-dev-middleware`库了，主要是本地文件的**编译**和**输出**以及**监听**，无非就是职责的划分更清晰了。

那我们来看下`webpack-dev-middleware`源码里做了什么事:

```js
// node_modules/webpack-dev-middleware/index.js
compiler.watch(options.watchOptions, (err) => {
    if (err) { /*错误处理*/ }
});

// 通过“memory-fs”库将打包后的文件写入内存
setFs(context, compiler); 
```

（1）调用了`compiler.watch`方法，在第 1 步中也提到过，`compiler`的强大。这个方法主要就做了 2 件事：

- 首先对本地文件代码进行编译打包，也就是`webpack`的一系列编译流程。
- 其次编译结束后，开启对本地文件的监听，当文件发生变化，重新编译，编译完成之后继续监听。

为什么代码的改动保存会自动编译，重新打包？这一系列的重新检测编译就归功于`compiler.watch`这个方法了。监听本地文件的变化主要是通过**文件的生成时间**是否有变化，这里就不细讲了。

（2）执行`setFs`方法，这个方法主要目的就是将编译后的文件打包到内存。这就是为什么在开发的过程中，你会发现`dist`目录没有打包后的代码，因为都在内存中。原因就在于访问内存中的代码比访问文件系统中的文件更快，而且也减少了代码写入文件的开销，这一切都归功于`memory-fs`。

#### 5. 浏览器接收到热更新的通知

我们已经可以监听到文件的变化了，当文件发生变化，就触发重新编译。同时还监听了每次编译结束的事件。当监听到一次`webpack`编译结束，`_sendStats`方法就通过`websoket`给浏览器发送通知，检查下是否需要热更新。下面重点讲的就是`_sendStats`方法中的`ok`和`hash`事件都做了什么。

那浏览器是如何接收到`websocket`的消息呢？回忆下第 2 步骤增加的入口文件，也就是`websocket`客户端代码。

```
'xxx/node_modules/webpack-dev-server/client/index.js?http://localhost:8080'
复制代码
```

这个文件的代码会被打包到`bundle.js`中，运行在浏览器中。来看下这个文件的核心代码吧。

```javascript
// webpack-dev-server/client/index.js
var socket = require('./socket');
var onSocketMessage = {
    hash: function hash(_hash) {
        // 更新currentHash值
        status.currentHash = _hash;
    },
    ok: function ok() {
        sendMessage('Ok');
        // 进行更新检查等操作
        reloadApp(options, status);
    },
};
// 连接服务地址socketUrl，?http://localhost:8080，本地服务地址
socket(socketUrl, onSocketMessage);

function reloadApp() {
	if (hot) {
        log.info('[WDS] App hot update...');
        
        // hotEmitter其实就是EventEmitter的实例
        var hotEmitter = require('webpack/hot/emitter');
        hotEmitter.emit('webpackHotUpdate', currentHash);
    } 
}
```

`socket`方法建立了`websocket`和服务端的连接，并注册了 2 个监听事件。

- `hash`事件，更新最新一次打包后的`hash`值。
- `ok`事件，进行热更新检查。

热更新检查事件是调用`reloadApp`方法。比较奇怪的是，这个方法又利用`node.js`的`EventEmitter`，发出`webpackHotUpdate`消息。这是为什么？为什么不直接进行检查更新呢？

个人理解就是为了更好的维护代码，以及职责划分的更明确。`websocket`仅仅用于客户端（浏览器）和服务端进行通信。而真正做事情的活还是交回给了`webpack`。

那`webpack`怎么做的呢？再来回忆下第 2 步。入口文件还有一个文件没有讲到，就是：

```javascript
'xxx/node_modules/webpack/hot/dev-server.js'
```

这个文件的代码同样会被打包到`bundle.js`中，运行在浏览器中。这个文件做了什么就显而易见了吧！先瞄一眼代码：

```javascript
// node_modules/webpack/hot/dev-server.js
var check = function check() {
    module.hot.check(true)
        .then(function(updatedModules) {
            // 容错，直接刷新页面
            if (!updatedModules) {
                window.location.reload();
                return;
            }
            
            // 热更新结束，打印信息
            if (upToDate()) {
                log("info", "[HMR] App is up to date.");
            }
    })
        .catch(function(err) {
            window.location.reload();
        });
};

var hotEmitter = require("./emitter");
hotEmitter.on("webpackHotUpdate", function(currentHash) {
    lastHash = currentHash;
    check();
});
```

这里`webpack`监听到了`webpackHotUpdate`事件，并获取最新了最新的`hash`值，然后终于进行检查更新了。检查更新呢调用的是`module.hot.check`方法。那么问题又来了，`module.hot.check`又是哪里冒出来了的！答案是`HotModuleReplacementPlugin`搞得鬼。这里留个疑问，继续往下看。

#### 6. HotModuleReplacementPlugin

从 webpack-dev-server v4 开始，HMR 是默认启用的。它会自动应用 [`webpack.HotModuleReplacementPlugin`](https://webpack.docschina.org/plugins/hot-module-replacement-plugin/)，这是启用 HMR 所必需的。因此当 `hot` 设置为 `true` 或者通过 CLI 设置 `--hot`，你不需要在你的 `webpack.config.js` 添加该插件。查看 [HMR concepts page](https://webpack.docschina.org/concepts/hot-module-replacement/) 以获取更多信息。



前面好像一直是`webpack-dev-server`做的事，那`HotModuleReplacementPlugin`在热更新过程中又做了什么伟大的事业呢？

首先你可以对比下，配置热更新和不配置时`bundle.js`的区别。内存中看不到？直接执行`webpack`命令就可以看到生成的`bundle.js`文件啦。不要用`webpack-dev-server`启动就好了。

（1）没有配置的。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec0c9e8fd12349~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

（2）配置了`HotModuleReplacementPlugin`或`--hot`的。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec0c90092fa0ac~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

哦~ 我们发现`moudle`新增了一个属性为`hot`，再看`hotCreateModule`方法。 这不就找到`module.hot.check`是哪里冒出来的。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec0dc36018973f~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)



经过对比打包后的文件，`__webpack_require__`中的`moudle`以及代码行数的不同。我们都可以发现`HotModuleReplacementPlugin`原来也是默默的塞了很多代码到`bundle.js`中呀。这和第 2 步骤很是相似哦！为什么，因为检查更新是在浏览器中操作呀。这些代码必须在运行时的环境。

你也可以直接看浏览器`Sources`下的代码，会发现`webpack`和`plugin`偷偷加的代码都在哦。在这里调试也很方便。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec0d4634af2b3c~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)

`HotModuleReplacementPlugin`如何做到的？这里我就不讲了，因为这需要你对`tapable`以及`plugin`机制有一定了解，可以看下我写的文章[Webpack插件机制之Tapable-源码解析](https://juejin.cn/post/6844904004435050503)。当然你也可以选择跳过，只关心热更新机制即可，毕竟信息量太大。



#### 7. moudle.hot.check 开始热更新

通过第 6 步，我们就可以知道`moudle.hot.check`方法是如何来的啦。那都做了什么？之后的源码都是`HotModuleReplacementPlugin`塞入到`bundle.js`中的哦，我就不写文件路径了。

- 利用上一次保存的`hash`值，调用`hotDownloadManifest`发送`xxx/hash.hot-update.json`的`ajax`请求；
- 请求结果获取热更新模块，以及下次热更新的`Hash` 标识，并进入热更新准备阶段。

```js
hotAvailableFilesMap = update.c; // 需要更新的文件
hotUpdateNewHash = update.h; // 更新下次热更新hash值
hotSetStatus("prepare"); // 进入热更新准备状态
```

- 调用`hotDownloadUpdateChunk`发送`xxx/hash.hot-update.js` 请求，通过`JSONP`方式。

```js
function hotDownloadUpdateChunk(chunkId) {
    var script = document.createElement("script");
    script.charset = "utf-8";
    script.src = __webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js";
    if (null) script.crossOrigin = null;
    document.head.appendChild(script);
 }
```

这个函数体为什么要单独拿出来，因为这里要解释下为什么使用`JSONP`获取最新代码？主要是因为`JSONP`获取的代码可以直接执行。为什么要直接执行？我们来回忆下`/hash.hot-update.js`的代码格式是怎么样的。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec04316d6ac5e3~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)



可以发现，新编译后的代码是在一个`webpackHotUpdate`函数体内部的。也就是要立即执行`webpackHotUpdate`这个方法。

再看下`webpackHotUpdate`这个方法。

```js
window["webpackHotUpdate"] = function (chunkId, moreModules) {
    hotAddUpdateChunk(chunkId, moreModules);
} ;
```

- `hotAddUpdateChunk`方法会把更新的模块`moreModules`赋值给全局全量`hotUpdate`。
- `hotUpdateDownloaded`方法会调用`hotApply`进行代码的替换。

```js
function hotAddUpdateChunk(chunkId, moreModules) {
    // 更新的模块moreModules赋值给全局全量hotUpdate
    for (var moduleId in moreModules) {
        if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
	    hotUpdate[moduleId] = moreModules[moduleId];
        }
    }
    // 调用hotApply进行模块的替换
    hotUpdateDownloaded();
}
```

#### 8. hotApply 热更新模块替换

热更新的核心逻辑就在`hotApply`方法了。 `hotApply`代码有将近 400 行

##### ①删除过期的模块，就是需要替换的模块

通过`hotUpdate`可以找到旧模块

```js
var queue = outdatedModules.slice();
while (queue.length > 0) {
    moduleId = queue.pop();
    // 从缓存中删除过期的模块
    module = installedModules[moduleId];
    // 删除过期的依赖
    delete outdatedDependencies[moduleId];
    
    // 存储了被删掉的模块id，便于更新代码
    outdatedSelfAcceptedModules.push({
        module: moduleId
    });
}
```

##### ②将新的模块添加到 modules 中

```js
appliedUpdate[moduleId] = hotUpdate[moduleId];
for (moduleId in appliedUpdate) {
    if (Object.prototype.hasOwnProperty.call(appliedUpdate, moduleId)) {
        modules[moduleId] = appliedUpdate[moduleId];
    }
}
```

##### ③通过__webpack_require__执行相关模块的代码

```js
for (i = 0; i < outdatedSelfAcceptedModules.length; i++) {
    var item = outdatedSelfAcceptedModules[i];
    moduleId = item.module;
    try {
        // 执行最新的代码
        __webpack_require__(moduleId);
    } catch (err) {
        // ...容错处理
    }
}

```

`hotApply`的确比较复杂，知道大概流程就好了，这一小节，要求你对webpack打包后的文件如何执行的有一些了解，大家可以自去看下。

#### 总结

还是以阅读源码的形式画的图，①-④的小标记，是文件发生变化的一个流程。

![img](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/12/1/16ec13499800dfce~tplv-t2oaga2asx-zoom-in-crop-mark:1304:0:0:0.awebp)



#### 大致原理梳理

1. 启动webpack 生成Compile实例，compiler上有很多方法，比如可以启动webpack所有编译工作，以及监听文件的变化

2. 使用express搭建本地server,让浏览器请求本地资源。server启动后，通过websocket，建立浏览器和本地服务间的双向通信，如果本地文件发生变更，需要通知浏览器热更新代码

3. webpack如何知道本地代码发生了修改从而触发weback重新编译&websocket如何知道webpack编译结束&websocket如何通知浏览器进行热更新呢？

   1. 启动本地服务前，调用了`updateCompiler(this.compiler)`方法。这个方法中有 2 段关键性代码。一个是获取`websocket`客户端代码路径，另一个是根据配置获取`webpack`热更新代码路径。

      ```js
      // 获取websocket客户端代码
      const clientEntry = `${require.resolve(
          '../../client/'
      )}?${domain}${sockHost}${sockPath}${sockPort}`;
      
      // 根据配置获取热更新代码
      let hotEntry;
      if (options.hotOnly) {
          hotEntry = require.resolve('webpack/hot/only-dev-server');
      } else if (options.hot) {
          hotEntry = require.resolve('webpack/hot/dev-server');
      }
      
      ```

   2. 修改webpack.config.js的entry配置

      ```js
      // 修改后的entry入口
      { entry:
          { index: 
              [
                  // 上面获取的clientEntry
                  'xxx/node_modules/webpack-dev-server/client/index.js?http://localhost:8080', // 参数后面的jsonp 请求会用到
                  // 上面获取的hotEntry
                  'xxx/node_modules/webpack/hot/dev-server.js',
                  // 开发配置的入口
                  './src/index.js'
          	],
          },
      }      
      
      ```

   3. 监听webpack 编译结束

      修改好入口配置后，又调用了`setupHooks`方法。这个方法是用来注册监听事件的，监听每次`webpack`编译完成。

      ```js
      // node_modules/webpack-dev-server/lib/Server.js
      // 绑定监听事件
      setupHooks() {
          const {done} = compiler.hooks;
          // 监听webpack的done钩子，tapable提供的监听方法
          done.tap('webpack-dev-server', (stats) => {
              this._sendStats(this.sockets, this.getStats(stats));
              this._stats = stats;
          });
      };
      ```

      当监听到一次`webpack`编译结束，就会调用`_sendStats`方法通过`websocket`给浏览器发送通知，`ok`和`hash`事件，这样浏览器就可以拿到最新的`hash`值了，做检查更新逻辑。

   4. webpack监听本地代码变化，通过webpack-dev-middleware,用于本地文件的编译和输出以及监听

      ```js
      // node_modules/webpack-dev-middleware/index.js
      compiler.watch(options.watchOptions, (err) => {
          if (err) { /*错误处理*/ }
      });
      
      // 通过“memory-fs”库将打包后的文件写入内存
      setFs(context, compiler); 
      ```

​			为什么代码的改动保存会自动编译，重新打包？这一系列的重新检测编译就归功于`				compiler.watch`这个方法了。监听本地文件的变化主要是通过**文件的生成时间**是否有变化，这里就不细讲了。

​			执行`setFs`方法，这个方法主要目的就是将编译后的文件打包到内存。这就是为什么在开发的过程中，你会发现`dist`目录没有打包后的代码，因为都在内存中。原因就在于访问内存中的代码比访问文件系统中的文件更快，而且也减少了代码写入文件的开销，这一切都归功于`memory-fs`。

   5. 现在我只到文件发生变化了，触发了webpack重新编译，那么编译完成后，调用第三步_sendStats，那么__sendStats如何工作的

      ```js
      // webpack-dev-server/client/index.js
      var socket = require('./socket');
      var onSocketMessage = {
          hash: function hash(_hash) {
              // 更新currentHash值
              status.currentHash = _hash;
          },
          ok: function ok() {
              sendMessage('Ok');
              // 进行更新检查等操作
              reloadApp(options, status);
          },
      };
      // 连接服务地址socketUrl，?http://localhost:8080，本地服务地址
      socket(socketUrl, onSocketMessage);
      
      function reloadApp() {
      	if (hot) {
              log.info('[WDS] App hot update...');
              
              // hotEmitter其实就是EventEmitter的实例
              var hotEmitter = require('webpack/hot/emitter');
              hotEmitter.emit('webpackHotUpdate', currentHash);
          } 
      }
      
      ```

      `socket`方法建立了`websocket`和服务端的连接，并注册了 2 个监听事件。

      - `hash`事件，更新最新一次打包后的`hash`值。
      - `ok`事件，进行热更新检查。

      热更新检查事件是调用`reloadApp`方法。比较奇怪的是，这个方法又利用`node.js`的`EventEmitter`，发出`webpackHotUpdate`消息。这是为什么？为什么不直接进行检查更新呢？

      个人理解就是为了更好的维护代码，以及职责划分的更明确。`websocket`仅仅用于客户端（浏览器）和服务端进行通信。而真正做事情的活还是交回给了`webpack`。

   6. `webpack`监听到了`webpackHotUpdate`事件，并获取最新了最新的`hash`值，然后终于进行检查更新了。检查更新呢调用的是`module.hot.check`方法。那么问题又来了，`module.hot.check`又是哪里冒出来了的！答案是`HotModuleReplacementPlugin`搞得鬼。这里留个疑问，继续往下看。

   7. 通过module.hot.check进行热更新

      - 利用上一次保存的`hash`值，调用`hotDownloadManifest`发送`xxx/hash.hot-update.json`的`ajax`请求；
      - 请求结果获取热更新模块，以及下次热更新的`Hash` 标识，并进入热更新准备阶段。

      ```js
      hotAvailableFilesMap = update.c; // 需要更新的文件
      hotUpdateNewHash = update.h; // 更新下次热更新hash值
      hotSetStatus("prepare"); // 进入热更新准备状态
      ```

      - 调用`hotDownloadUpdateChunk`发送`xxx/hash.hot-update.js` 请求，通过`JSONP`方式。

      ```js
      function hotDownloadUpdateChunk(chunkId) {
          var script = document.createElement("script");
          script.charset = "utf-8";
          script.src = __webpack_require__.p + "" + chunkId + "." + hotCurrentHash + ".hot-update.js";
          if (null) script.crossOrigin = null;
          document.head.appendChild(script);
       }
      ```

## 5. tree-shaking&side-effects

### 什么是treeShaking？

- treeShaking 是一个术语，通常用于描述移除 JavaScript 上下文中的未引用代码(dead-code)。

### treeShaking有什么用？

- 至于说有什么用呢？它的作用就是将程序中没有用到的代码在打包编译的时候都删除掉，这样能减少打包后包的体积大小，减少程序执行的时长

### 和传统DCE（Dead Code Elimination）有什么区别？

- 传统DCE是消除不可能执行的代码，而treeShaking虽然也是DCE新的实现方式，但是它是通过消除没有用到的代码来达到目的

**Dead Code的特征：**

- 代码不会被执行，不可到达
- 代码执行的结果不会被用到
- 代码只会影响死变量（只写不读）

### 在JS中是什么在做DCE？

首先肯定不是浏览器做DCE，因为当我们的代码送到浏览器，那还谈什么消除无法执行的代码来优化呢，所以肯定是送到浏览器之前的步骤进行优化。传统DCE使用到的是代码压缩优化工具uglify来完成的；而treeShaking则是通过webpack来完成的；

### 什么是sideEffects？

其主要功能是让 webpack 去除 treeShaking 带来副作用的代码。怎么去理解这个副作用呢？副作用可以理解成某个模块执行时除了导出成员之外所作的事情，比如我们修改了window上的属性，或者提供某个polyfill；如果没有这些副作用的话那么webpack就会清除没有用的代码，也就是上面说的treeShaking。

### sideEffects写法？

- true/false，false 为了告诉 `webpack` 所有文件代码都是没有副作用的
- 数组，数组则表示告诉 `webpack` 指定文件代码是没有副作用的

栗子如下：

`tree shaking` 前

```js
// webpack.config.js

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',

  plugins: [
    new HtmlWebpackPlugin(),
  ],
};
```

```js
// src/math.js

export const add = (x, y) => x + y;

export const subtract = (x, y) => x - y;
```



```js
// src/index.js

import { add } from './math';

console.log(add(1, 2));
```

从上面看到，我们引用并使用了`math.add` 函数，没有使用 `math.subtract `函数

执行 `npx webpack` 可以看到，打包结果中 `math `模块的两个函数都被打包了

`tree shaking` 后

```javascript
// webpack.config.js

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',

  plugins: [
    new HtmlWebpackPlugin(),
  ],

  optimization: {
    // 使用 ES module 方式引用的模块将被 tree shaking 优化
    usedExports: true,
  },
};
```


执行 `npx webpack` 可以看到，只有 已经使用的 `add `函数被暴露出去


在生产环境看以下效果

```js
// webpack.config.js

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',

  plugins: [
    new HtmlWebpackPlugin(),
  ],

  optimization: {
    usedExports: true,
  },
};
```

执行 `npx webpack `可以看到，只有已经使用的 `add `函数的执行结果，` subtract` 函数就是所谓的“未引用代码(`dead code`)”，也就是说，应该删除掉未被引用的` export`。并且代码已经被 `webpack `优化精简了

可以得出结论，`tree shaking` 会将通过使用 `ES module` 方式引用的模块中未使用的代码删除掉

`tree shaking` 两个关键词：1. 使用 `ES module` 方式引用模块； 2. 未使用的代码

继续验证

```js
// src/index.js

import { add, subtract } from './math';

console.log(add(1, 2));
```

从上面看到，我们引用了` add`, ``subtract` 但只使用了`math.add `函数，没有使用 `math.subtract` 函数

执行 `npx webpack` 可以看到，打包结果中依旧只有 `add` 函数被打包了，未使用过的 `subtract` 函数被删除了

`sideEffects`
注意 `Webpack` 不能百分百安全地进行 `tree-shaking`。有些模块导入，只要被引入，就会对应用程序产生重要的影响。一个很好的例子就

是 全局样式文件，或者 全局JS 文件。

```css
src/style.css

body {
    background-color: chocolate;
}
```

```javascript
// src/todo.global.js

console.log('TODO');
```

```javascript
// src/index.js

import _ from 'lodash';
import { add, subtract } from './math';
import './todo.global';
import './style.css';

console.log(add(1, 2));
```



```javascript
// webpack.config.js

const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'production',

  plugins: [
    new HtmlWebpackPlugin(),
  ],

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },

  optimization: {
    usedExports: true,
  },
};
```

执行` npx webpack serve`，你会发现 `style.css`、` todo.global.js `都生效了，这是因为这两个文件不是使用的 `ESmodules` 方式将模块导出（export）的。

`Webpack` 认为这样的文件有“副作用”。具有副作用的文件不应该做` tree-shaking`，因为这将破坏整个应用程序。

`Webpack` 的设计者清楚地认识到不知道哪些文件有副作用的情况下打包代码的风险，因此`webpack`默认地将所有代码视为有副作用。

这可以保护你免于删除必要的文件，但这意味着 `Webpack` 的默认行为实际上是不进行 `tree-shaking`。值得注意的是` webpack 5 `默认会进行 tree-shaking。

如何告诉 `Webpack` 你的代码无副作用，可以通过` package.json` 有一个特殊的属性 `sideEffects`，就是为此而存在的。

**sideEffects**有三个可能的值：

true：（默认值）这意味着所有的文件都有副作用，也就是没有一个文件可以 `tree-shaking`。

false：告诉 `Webpack` 没有文件有副作用，所有文件都可以 `tree-shaking`。

数组：是文件路径数组。它告诉 `webpack`，除了数组中包含的文件外，你的任何文件都没有副作用。因此，除了指定的文件之外，其他文件都可以安全地进行 tree-shaking。



💡: 通过 `/*#__PURE__*/` 注释来帮忙 terser。它给一个语句标记为没有副作用。就这样一个简单的改变就能够使下面的代码被 tree-shake:

```javascript
var Button$1 = /*#__PURE__*/ withAppProvider()(Button);
```



#### webpack5 对比webpack4 tree shaking的区别

> webpack4 曾经不进行对 CommonJs 导出和 require() 调用时的导出使用分析。webpack 5 增加了对一些 CommonJs 构造的支持，允许消除未使用的 CommonJs 导出，并从 require() 调用中跟踪引用的导出名称。所以webpack5的tree shaking 更加全面