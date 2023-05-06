---
title: webpack系列-第二篇
date: 2023-05-04
categories: 
 - Webpack
tags:
 - webpack 第二篇
sidebar: auto
---

## 1. 前言

本篇主要就是`webpack`打包优化方面

## 2. 构建进度美化

1. 依赖安装

   ```shell
   pnpm install webpackbar -D
   ```

2. 修改`webpack.base.ts`配置

   ```typescript
   import WebpackBar from 'webpackbar'
   
   const webpackBaseConfig: Configuration = {
       stats: process.env.NODE_ENV === 'development' ? 'errors-only' : 'normal',
       plugins: [
           new WebpackBar({
         		color: '#3E68FF',
         		basic: false,
         		profile: false
           })
       ]
   }
   ```

   本来打算使用`friendly-errors-webpack-plugin`，但是目前不支持`webpack5.x`，所以配置了`stats`

   #### Stats Presets

   `webpack` 有一些特定的预设选项给统计信息输出：

   | 预设                | 可选值  | 描述                                              |
   | :------------------ | :------ | :------------------------------------------------ |
   | `'errors-only'`     | *none*  | 只在发生错误时输出                                |
   | `'errors-warnings'` | *none*  | 只在发生错误或有警告时输出                        |
   | `'minimal'`         | *none*  | 只在发生错误或新的编译开始时输出                  |
   | `'none'`            | `false` | 没有输出                                          |
   | `'normal'`          | `true`  | 标准输出                                          |
   | `'verbose'`         | *none*  | 全部输出                                          |
   | `'detailed'`        | *none*  | 全部输出除了 `chunkModules` 和 `chunkRootModules` |
   | `'summary'`         | *none*  | 输出` webpack` 版本，以及警告数和错误数           |

## 3. 持久化缓存

`webpack5`之前通常使用`cache-loader`进行缓存配置，还有模块缓存插件`hard-source-webpack-plugin`，配置好缓存后第二次打包，通过对文件做哈希对比来验证文件前后是否一致，如果一致则采用上一次的缓存，可以极大地节省时间。

`webpack5` 较于 `webpack4`，新增了持久化缓存、改进缓存算法等优化，通过配置 [webpack 持久化缓存](https://link.juejin.cn?target=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Fcache%2F%23root)，来缓存生成的 `webpack` 模块和 `chunk`，改善下一次打包的构建速度,可提速 `90%` 左右,配置也简单，修改`webpack.base.ts`：

```typescript
const webpackBaseConfig: Configuration = {
    cache: {
        type: 'filesystem'
    }
}
```

## 4. include&exclude 缩小构建目标

修改下`webpack.base.ts`

```typescript
module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      // babel
      {
        test: /\.js$/,
        exclude: (file) => /node_modules/.test(file) && !/\.vue\.js/.test(file),
        use: ['babel-loader']
      },
      // ts
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      ...generateCssLoader(),
      {
        test: /\.(png|jpe?g|gif|svg|bmp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 30 * 1024 // 小于30kb 转 base64
          }
        },
        generator: {
          filename: 'images/[hash][ext][query]'
        }
      },
      {
        test: /.(woff2?|eot|ttf|otf)$/, // 匹配字体图标文件
        type: 'asset', // type选择asset
        exclude: /node_modules/,
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        },
        generator: {
          filename: 'fonts/[hash][ext][query]' // 文件输出目录和命名
        }
      },
      {
        test: /.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
        type: 'asset', // type选择asset
        exclude: /node_modules/,
        parser: {
          dataUrlCondition: {
            maxSize: 30 * 1024
          }
        },
        generator: {
          filename: 'media/[hash][ext][query]' // 文件输出目录和命名
        }
      },
      {
        // 匹配json文件
        test: /\.json$/,
        exclude: /node_modules/,
        type: 'asset/resource', // 将json文件视为文件类型
        generator: {
          // 这里专门针对json文件的处理
          filename: 'json/[name].[hash][ext][query]'
        }
      }
    ]
}
```

## 5. devtools配置

开发过程中或者打包后的代码都是`webpack`处理后的代码，如果进行调试肯定希望看到源代码，而不是编译后的代码，`source map`就是用来做源码映射的，不同的映射模式会明显影响到构建和重新构建的速度，`devtool`选项就是`webpack`提供的选择源码映射方式的配置。

`devtool`的命名规则为：

```shell
^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$
复制代码
```

| 关键字      | 描述                                                         |
| ----------- | ------------------------------------------------------------ |
| `inline`    | 代码内通过 `dataUrl` 形式引入 `SourceMap`                    |
| `hidden`    | 生成 `SourceMap` 文件,但不使用                               |
| `eval`      | `eval(...)` 形式执行代码,通过 `dataUrl` 形式引入 `SourceMap` |
| `nosources` | 不生成 `SourceMap`                                           |
| `cheap`     | 只需要定位到行信息,不需要列信息                              |
| `module`    | 展示源代码中的错误位置                                       |

开发环境推荐：`eval-cheap-module-source-map`

- 本地开发首次打包慢点没关系，因为 `eval` 缓存的原因，热更新会很快
- 开发中，我们每行代码不会写的太长，只需要定位到行就行，所以加上 `cheap`
- 我们希望能够找到源代码的错误，而不是打包后的，所以需要加上 `module`

修改下`webpack.dev.ts`

```typescript
const webpackDevConfig: WebpackDevConfiguraion = merge(webpackBaseConfig, {
  mode: 'development',
  // devtool配置
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    host: '0.0.0.0',
    port: 9527,
    open: true,
    compress: false,
    hot: true,
    historyApiFallback: true, // history 404
    setupExitSignals: true, // 允许SIGINT和SIGTERM信号关闭开发服务器和退出进程
    static: {
      directory: path.join(__dirname, '../public')
    },
    headers: { 'Access-Control-Allow-Origin': '*' }
  }
}) as WebpackDevConfiguraion

export default webpackDevConfig
```

## 6. 打包体积分析

1. 依赖安装

   ```shell
   pnpm install webpack-bundle-analyzer -D
   pnpm install @types/webpack-bundle-analyzer -D
   ```

2. 新建个`webpack.analy.ts`

   ```typescript
   import webpackProConfig from "./webpack.prod";
   
   import { merge } from "webpack-merge";
   
   import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
   
   const webpackAnalyConfig = merge(webpackProConfig, {
       plugins: [
         new BundleAnalyzerPlugin() // 配置分析打包结果插件
       ]
   }))
   
   export default webpackAnalyConfig;
   ```

3. 新加脚本

   ```json
     "scripts": {
       "build:analy": "cross-env NODE_ENV=production BASE_ENV=pro webpack -c build/webpack.analy.ts"
     },
   ```

4. 执行`pnpm run build:analy`

## 7. css抽离&压缩

1. 依赖安装

   ```shell
   pnpm install mini-css-extract-plugin css-minimizer-webpack-plugin -D
   ```

2. 开发环境使用的是`style-loader`，而生产环境我们抽离`css`

   修改下`build/utils`

   ```typescript
   const isDev = process.env.NODE_ENV === 'development'
   
   const styleLoadersArray = [
     isDev ? 'style-loader' : MiniCssExtractPlugin.loader,
     'css-loader',
     'postcss-loader'
   ]
   ```

3. 修改下`webpack.prod.ts`进行样式抽离

   ```typescript
   import MiniCssExtractPlugin from 'mini-css-extract-plugin'
   
   const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
     // ...
     mode: 'production',
     plugins: [
       // ...
       new MiniCssExtractPlugin({
         filename: 'css/[name].[contenthash:8].css' // 抽离css的输出目录和名称
       })
     ]
   })
   
   ```

4. 修改下`webpack.prod.ts`进行样式压缩

   ```typescript
   // ...
   import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
   
   const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
     // ...
     mode: 'production',
     // ...
     optimization: {
       minimizer: [
         new CssMinimizerPlugin(), // 压缩css
       ],
     },
     plugins: [
       // ...
       new MiniCssExtractPlugin({
         filename: 'css/[name].[contenthash:8].css' // 抽离css的输出目录和名称
       })
     ]
   })
   ```

## 8. js压缩

设置mode为production时,webpack会使用内置插件[terser-webpack-plugin](https://link.juejin.cn/?target=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Fterser-webpack-plugin)压缩js文件,该插件默认支持多线程压缩,但是上面配置optimization.minimizer压缩css后,js压缩就失效了,需要手动再添加一下,webpack内部安装了该插件,由于pnpm解决了幽灵依赖问题,如果用的pnpm的话,需要手动再安装一下依赖。

```shell
pnpm install terser-webpack-plugin compression-webpack-plugin -D
```

修改`webpack.prod.ts`

```typescript
import { Configuration } from 'webpack'

import merge from 'webpack-merge'

import webpackBaseConfig from './webpack.base'

import CopyPlugin from 'copy-webpack-plugin'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin'
import TerserPlugin from 'terser-webpack-plugin'
import CompressionPlugin from 'compression-webpack-plugin'

import path from 'path'

const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
  mode: 'production',
  optimization: {
    splitChunks: {
      // 分隔代码
      cacheGroups: {
        vendors: {
          // 提取node_modules代码
          test: /node_modules/, // 只匹配node_modules里面的模块
          name: 'vendors', // 提取文件命名为vendors,js后缀和chunkhash会自动加
          minChunks: 1, // 只要使用一次就提取出来
          chunks: 'initial', // 只提取初始化就能获取到的模块,不管异步的
          minSize: 0, // 提取代码体积大于0就提取出来
          priority: 1 // 提取优先级为1
        },
        commons: {
          // 提取页面公共代码
          name: 'commons', // 提取文件命名为commons
          minChunks: 2, // 只要使用两次就提取出来
          chunks: 'initial', // 只提取初始化就能获取到的模块,不管异步的
          minSize: 0 // 提取代码体积大于0就提取出来
        }
      }
    },
    runtimeChunk: {
      name: 'mainifels'
    },
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(), // 压缩css
      new TerserPlugin({
        parallel: true, // 开启多线程压缩
        terserOptions: {
          compress: {
            pure_funcs: ['console.log'] // 删除console.log
          }
        }
      })
    ]
  },
  performance: {
    hints: false,
    maxAssetSize: 4000000, // 整数类型（以字节为单位）
    maxEntrypointSize: 5000000 // 整数类型（以字节为单位）
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, '../public'),
          to: path.resolve(__dirname, '../dist'),
          filter: (source) => !source.includes('index.html')
        }
      ]
    }),
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css' // 抽离css的输出目录和名称
    }),
    // 打包时生成gzip文件
    new CompressionPlugin({
      test: /\.(js|css)$/, // 只生成css,js压缩文件
      filename: '[path][base].gz', // 文件命名
      algorithm: 'gzip', // 压缩格式,默认是gzip
      threshold: 10240, // 只有大小大于该值的资源会被处理。默认值是 10k
      minRatio: 0.8 // 压缩率,默认值是 0.8
    })
  ]
})

export default webpackProdConfig
```

## 9. 文件指纹

项目维护的时候，一般只会修改一部分代码，可以合理配置文件缓存，来提升前端加载页面速度和减少服务器压力，而 `hash` 就是浏览器缓存策略很重要的一部分。`webpack` 打包的 `hash` 分三种：

- `hash`：跟整个项目的构建相关，只要项目里有文件更改，整个项目构建的 `hash` 值都会更改，并且全部文件都共用相同的 `hash` 值
- `chunkhash`：不同的入口文件进行依赖文件解析、构建对应的`chunk`，生成对应的哈希值，文件本身修改或者依赖文件修改，`chunkhash` 值会变化
- `contenthash`：每个文件自己单独的 `hash` 值，文件的改动只会影响自身的 `hash` 值

`hash` 是在输出文件时配置的，格式是 `filename: "[name].[chunkhash:8][ext]"`，`[xx]` 格式是 `webpack` 提供的占位符，`:8` 是生成 `hash` 的长度。

修改下`webpack.base.ts`更改静态资源`hash`

```typescript
const webpackBaseConfig: Configuration = {
  entry: path.join(__dirname, '../src/main.ts'),
  stats: process.env.NODE_ENV === 'development' ? 'errors-only' : 'normal',
  output: {
    filename: '[name]_[chunkhash:8].js'
    // ...
  },
  module: {
    rules: [
      // ...
      {
        test: /\.(png|jpe?g|gif|svg|bmp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 30 * 1024 // 小于30kb 转 base64
          }
        },
        generator: {
          filename: 'images/[name].[contenthash:8].[ext]'
        }
      },
      {
        test: /.(woff2?|eot|ttf|otf)$/, // 匹配字体图标文件
        type: 'asset', // type选择asset
        exclude: /node_modules/,
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024
          }
        },
        generator: {
          filename: 'fonts/[name].[contenthash:8][ext]' // 文件输出目录和命名
        }
      },
      {
        test: /.(mp4|webm|ogg|mp3|wav|flac|aac)$/, // 匹配媒体文件
        type: 'asset', // type选择asset
        exclude: /node_modules/,
        parser: {
          dataUrlCondition: {
            maxSize: 30 * 1024
          }
        },
        generator: {
          filename: 'media/[name].[contenthash:8][ext]' // 文件输出目录和命名
        }
      },
      {
        // 匹配json文件
        test: /\.json$/,
        exclude: /node_modules/,
        type: 'asset/resource', // 将json文件视为文件类型
        generator: {
          // 这里专门针对json文件的处理
          filename: 'json/[name].[contenthash:8][ext]'
        }
      }
    ]
  },
}
```

修改`webpakc.prod.ts`更改`css`的`hash`

```typescript
const webpackProdConfig: Configuration = merge(webpackBaseConfig, {
  mode: 'production',
  // ...  
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css' // 抽离css的输出目录和名称
    }),
  ]
})
```

## 10. 代码分割splitChunk

### webpack chunk分包原理

- 同一个entry入口模块与它的同步依赖组织成一个chunk,还包括runtime（webpackBootstrap 自执行函数的形式）
- 每一个**异步模块**与它的同步依赖单独组成一个 chunk。其中只会包含**入口 chunk 中不存在的同步依赖**；若存在同步第三方包，也会被单独打包成一个 chunk。

那么，`SplitChunksPlugin` 就是在这个基础上再做优化了，也就是对这些 chunk 进行进一步的组合/分割。

### why & how? 为何要代码分割以及如何分割

[Code Splitting](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fguides%2Fcode-splitting%2F) 拆包优化的最终目标是什么？无非是：

1. 把更新频率低的代码和内容频繁变动的代码分离，把共用率较高的资源也拆出来，最大限度利用浏览器缓存。
2. 减少 http 请求次数的同时避免单个文件太大以免拖垮响应速度，也就是拆包时尽量实现`文件个数更少`、`单个文件体积更小`。

第二点的两个目标是互相矛盾的，因此要达到两者之间的平衡是个**博弈**的过程，没有太绝对的拆包策略，都是力求提高性能水准罢了。

具体来说，比如一些第三方插件，更新频率其实很低，单个体积通常又较小，就很适合打包在一个文件里。而 `UI 组件库`更新少的同时体积却比较大，就可以单独打成一个包(也有直接用 `CDN `外链的)。还有开发者写的公共组件，一般写完后修改也不多，适合拎出来放一个文件。

`webpack` 配置`output.filename`或`output.chunkFilename`值中的**[contenthash]**使得重新打包时若` chunk `内容没有变化，就跳过直接使用缓存，当然对应的输出文件名称中的 `hash `值也不会改变。这样既能提高二次构建速度，又能不影响用户的浏览器缓存。
为何配置文件名时在[取值占位符](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Foutput%2F%23template-strings)里使用**[contenthash]**而不是**[chunkhash]**呢？
`chunkhash`是 `chunk` 级别的 `hash` 值。但在项目中我们通常的做法是把` css` 都抽离出来，作为模块import到对应的 `js` 文件中。如果使用**[chunkhash]**，两个关联的 `js` 和 `css` 文件名的 `hash` 值是一样的。一旦其中一个改动了，与其关联的另一个文件即使毫无变化，文件名也会改变，缓存也就失效了。
而**[contenthash]**，只关注文件本身，自身内容不变，hash 值也不会变。

其余剩下的基本就是我们的业务代码，改动频率就很大了，是每次发布版本都会变的。

![img](/my-blog/webpack/1669732833078-9def05b6-1d15-47ec-8188-1252af7de665.webp)

### 常用的代码分离与方法

- **入口起点**：通过 [entry](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Fentry-context%2F%23entry) 配置手动地分离代码。
- **防止重复**：使用 [Entry dependencies](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Fentry-context%2F%23dependencies) 或者 内置插件 [SplitChunksPlugin](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fplugins%2Fsplit-chunks-plugin) 去重和分离 chunk。
- **动态导入**：通过异步引入模块(如import('./m.js'))来分离代码。

### webpackChunkName

异步加载的 chunk 无法通过 webpack 配置自定义打包后的名称，默认都是以0、1、2...这样的数字命名。
魔法注释可以帮助我们自定义异步 chunk 名。

```javascript
component: () => import(/* webpackChunkName: "route-login" */ '@/views/login')
如果想把某个路由下的所有组件都打包在同一个异步块 (chunk) 中。那么在webpackChunkName注释提供相同的 chunk name 即可。

Webpack 会将任何一个异步模块与相同的块名称组合到相同的异步块中。
```

如果想把某个路由下的所有组件都打包在同一个异步块 (chunk) 中。那么在webpackChunkName注释提供相同的 chunk name 即可。

```javascript
const Foo = () => import(/* webpackChunkName: "group-foo" */ './Foo.vue')
const Bar = () => import(/* webpackChunkName: "group-foo" */ './Bar.vue')
const Baz = () => import(/* webpackChunkName: "group-foo" */ './Baz.vue') 
```

`Webpack` 会将任何一个异步模块与相同的块名称组合到相同的异步块中。

#### `SplitChunksPlugin`配置详解

先看下	**`SplitChunksPlugin`**插件的默认配置，再结合实例来搞懂每个配置项真正的用处。
`webpack` 上的文档地址：[【SplitChunksPlugin API】](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fplugins%2Fsplit-chunks-plugin%2F)

```javascript
module.exports = {
  // 加上入口和输出的配置，以便结合实际说明
  entry: {
    index: './src/a',
    admin: './src/b'
  },
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash:6].js',
    chunkFilename: '[name].[contenthash:8].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'async', // 2. 处理的 chunk 类型
      minSize: 20000, // 4. 允许新拆出 chunk 的最小体积
      minRemainingSize: 0,
      minChunks: 1, // 5. 拆分前被 chunk 公用的最小次数
      maxAsyncRequests: 30, // 7. 每个异步加载模块最多能被拆分的数量
      maxInitialRequests: 30, // 6. 每个入口和它的同步依赖最多能被拆分的数量
      enforceSizeThreshold: 50000, // 8. 强制执行拆分的体积阈值并忽略其他限制
      cacheGroups: { // 1. 缓存组
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/, // 1.1 模块路径/文件名匹配正则
          priority: -10, // 1.2 缓存组权重
          reuseExistingChunk: true, // 1.3 复用已被拆出的依赖模块，而不是继续包含在该组一起生成
        },
        default: {
          minChunks: 2, // 5. default 组的模块必须至少被 2 个 chunk 共用 (本次分割前) 
          priority: -20,
          reuseExistingChunk: true,
        }
      }
    },
  },
};
```

1. cacheGroups

**核心配置** - 缓存组，可以继承/覆盖来自`splitChunks.*`的任何选项。它自身拥有`test`、`priority` 和 `reuseExistingChunk` 三个配置项。
`splitChunksPlugin` 就是根据`cacheGroups`去拆分模块的，后面2. 3. ...等其余属性其实是**应用到每一个缓存组的公共配置，同样的参数以缓存组的值为准**。

把默认缓存组`defaultVendors`或`default`设置为 false，即可禁用对应缓存组规则。
模块必须符合某个缓存组的所有条件，才会被分割。

1.1 test 模块匹配规则，可以匹配模块资源绝对路径(函数或正则)或 chunk 名称(字符串)，匹配 chunk 名称时(如'app')，将选择 chunk 中的所有模块。
可选值：function (module, { chunkGraph, moduleGraph }) => boolean | RegExp | string

```javascript
cacheGroups: {
  chunks: 'all',
  react: { // 1. 正则匹配示例，把 react 和 react-dom 分到一个名为 `lib-react` 的 js 中
    // `[\\/]` 是作为跨平台兼容性的路径分隔符
    test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
    name: 'lib-react',
  },
  svgIcon: { // 2. 函数匹配示例，把自定义 svg 图标都拆出来，放到 `svgIcon.js` 中
    test(module) {
      // `module.resource` 是文件的绝对路径
      // 用`path.sep` 代替 / or \，以便跨平台兼容
      const path = require('path'); // path 一般会在配置文件引入，此处只是说明 path 的来源，实际并不用加上
      return ( // 匹配 icon 文件夹下的 .svg 后缀文件
        module.resource &&
        module.resource.endsWith('.svg') &&
        module.resource.includes(`${path.sep}icons${path.sep}`)
      );
    },
    name: 'svgIcon'
  },
},
```

- 1.2 priority ：
  <number> 默认值：-20
  缓存组打包的优先级/权重，`数值大`的优先。
  一个模块同时满足多个缓存组的条件，会优先考虑权重最高的那个缓存组。
  默认组的优先级为负，以允许自定义组获得更高的优先级 (自定义组的默认值为0)。
- 1.3 reuseExistingChunk
  <boolean> 默认值：true
  如果当前 chunk 包含已从主 chunk 中拆分出的模块，那么缓存组不会在新 chunk 内生成这个/些模块，而是去复用被拆出的 module。
  这可能会影响 chunk 的结果文件名。



1. chunks

<string> 默认值："async"
	选择进行代码分割的 chunk 类型，可选值："all" | "async"(异步) | "initial"(同步)

默认配置只会对按需加载的代码进行分割。那么入口文件同步依赖的第三方包和公共模块是无法拆出来的。因此通常会将`SplitChunk`整体的值设置为"all"，把初始加载的代码也加入到分割的“受众”中来。在具体缓存组如有需要再按实际情况再覆盖。
如果设为"initial"，那么该缓存组只会分离应用初始加载需要的包。有时这是有必要的，因为设为一味设为"all"的话，打包出来的 js 都会在应用初始载入时加载，即使里面包含一些首页用不到的模块。

1. automaticNameDelimiter

<string>默认值：'~'

此选项可以指定生成名称中的分隔符。

默认情况下，若未用cacheGroups.{cacheGroup}.name自定义 chunk 名， webpack 会使用 	chunk 的缓存组名和entry来源生成 chunk 名(例如default~index.js、defaultVendors~admin.js）。

1. minSize

<number>默认值：20000

生成chunk的最小体积（以bytes为单位）

新拆出的 chunk 的体积最小值，也就是符合缓存组其他条件的前提下，体积大于等于这个值的模块/模块集合才会被拆分出来。
比如我们有两个入口 chunk，各自都包含了一个模块m(或者均有m1和m2)，本来符合默认配置中的default缓存组，但由于这个模块(或者m1加上m2)体积不足 20kb，便无法被输出为一个文件。

⚠️ 即使不匹配任何一个缓存组，在 splitChunks.* 的**minSize**选项会影响**异步 chunk**。规则是**体积大于****minSize****值的公共模块会被拆出**。(除非 splitChunks.* chunks: 'initial'，才没有这种影响)
公共模块即 >= 2个异步 chunk 共享的模块，同minChunks: 2。



1. minChunks

<number>默认值为：1

拆分前必须**共享模块的最小 chunks 数**。

比如数值是2，那么在符合某个缓存组其他规则的前提下，拆分前必须有 2 个 chunk 共用了这个模块，才可以被归到这个组下拆分出来。
	不是文件共享而是 **chunk 共享**，所以清楚 SplitChunksPlugin 处理前 chunk 的分包情况非常有必要。

1. maxInitialRequests

<number> 默认值： 30

每个入口点的最大并行请求数。

也就是**每个入口和它的同步依赖**最多够被拆分/合并成几个js文件。对这个数量进行限制为的是避免初始js请求过多。

注意几点：

- 入口文件本身算一个请求
- 如单独拆出了runtimeChunk，不算在内
- 单独拆出的css文件不算在内
- 若同时有两个模块满足cacheGroup规则要进行拆分，但maxInitialRequests只允许再拆出一个文件，那么体积较大的模块会被拆分出来。



1. maxAsyncRequests

<number> 默认值：30

每个按需加载模块的最大并行请求数。

也就是**一个异步加载模块和它的同步依赖**最多能被拆分成几个js。除了处理对象不同，应该很好理解。

注意几点：

- import()文件本身算一个请求
- 同样不算js以外的公共资源请求如css
- 若同时有两个模块满足cacheGroup规则要进行拆分，但maxAsyncRequests只允许再拆出一个文件，那么体积较大的模块会被拆分出来。



1. enforceSizeThreshold

<number> 默认值： 50

如果符合缓存组其他条件(不包括下面三项)的模块/模块集超过这个体积阈值，就忽略minRemainingSize, maxAsyncRequests, maxInitialRequests的配置，总是为这个缓存组创建 chunk。
也就是说即使超出了maxAsyncRequests或maxInitialRequests指定的可拆分次数，只要缓存组模块体积大于50kb，仍然会分出新 chunk。



### 拆包

#### 文件以内容摘要 hash 值命名以实现持久缓存

通过对output.filename和output.chunkFilename的配置，利用[contenthash]占位符，为js文件名加上根据其内容生成的唯一 hash 值，**轻松实现资源的长效缓存**。也就是说，无论是第几次打包，内容没有变化的资源 (如js、css) 文件名永远不会变，而那些有修改的文件就会生成新的文件名 (hash 值) 。

```javascript
module.exports = {
  output: {
    path: __dirname + '/dist',
    filename: '[name].[contenthash:6].js',
    chunkFilename: '[name].[contenthash:8].js',
  },
}
```

**如果是 webpack 4，还需要分别固定****moduleId**和**chunkId**，以保持名称的稳定性**。
因为 webpack 内部维护了一个自增的数字 id，每个 module 都有一个 id。当增加或删除 module 的时候，id 就会变化，导致其它 module 虽然内容没有变化，但由于 id 被强占，只能自增或者自减，导致整个项目的 module id 的顺序都错乱了。
也就是说，如果引入了一个新模块或删掉一个模块，都可能**导致其它文件的 moduleId 发生改变，相应地文件内容也就改变，缓存便失效了**。
同样地，chunk 的新增/减少也会导致 chunk id 顺序发生错乱，那么原本的缓存就不作数了。

**解决办法：**

- **moduleId**：
  [HashedModuleIdsPlugin](https://links.jianshu.com/go?to=https%3A%2F%2Fv4.webpack.docschina.org%2Fplugins%2Fhashed-module-ids-plugin%2F)插件 (webpack 4) → [optimization.moduleIds: 'deterministic'](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Foptimization%2F%23optimizationmoduleids) (webpack 5)
  在` webpack 5 `无需额外配置，使用默认值就好。
- **chunkId**：
  [NamedChunksPlugin]()插件 (webpack 4) → [optimization.chunkIds](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Foptimization%2F%23optimizationchunkids) (webpack 5)
  但这个方法只对命名 chunk 有效，我们的懒加载页面生成的 chunk 还需要额外设置，如vue-cli 4的处理：

```javascript
// node_modules/@vue/cli-service/lib/config/app.js
chainWebpack: config => {
  config
    .plugin('named-chunks')
      .use(require('webpack/lib/NamedChunksPlugin'), [chunk => {
        if (chunk.name) {
          return chunk.name
        }
        const hash = require('hash-sum')
        const joinedHash = hash(
          Array.from(chunk.modulesIterable, m => m.id).join('_')
        )
        return `chunk-` + joinedHash
      }])
}
```

在 webpack 5 optimization.chunkIds默认开发环境'named'，生产环境'deterministic'，因此我们**无需设置该配置项。而且 webpack 5 更改了 id 生成算法，异步 chunk 也能轻松拥有固定的 id 了**。



##### 至于图片和 CSS 文件

- CSS 是通过 [mini-css-extract-plugin](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fplugins%2Fmini-css-extract-plugin%2F) 插件的filename和chunkFilename定义文件名，值用 hash 占位符如[contenthash:8]实现缓存配置的。
- 而图片文件，是在 [file-loader](https://links.jianshu.com/go?to=https%3A%2F%2Fwww.npmjs.com%2Fpackage%2Ffile-loader) 的 name 配置项用[contenthash]处理的。
  注 ⚠️：webpack 5 废弃了 file-loader，改用 [output.assetModuleFilename](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fguides%2Fasset-modules%2F%23custom-output-filename) 定义图片字体等资源文件的名称，如assetModuleFilename: 'images/[contenthash][ext][query]'。

#### SplitChunksPlugin 拆包实战

##### vue-cli 4 默认处理

结合`vue-cli 4` 搭的项目，来看下 `vue-cli` 通过 [chainWebpack](https://links.jianshu.com/go?to=https%3A%2F%2Fcli.vuejs.org%2Fzh%2Fguide%2Fwebpack.html%23%E9%93%BE%E5%BC%8F%E6%93%8D%E4%BD%9C-%E9%AB%98%E7%BA%A7) 覆盖掉 `SplitChunksPlugin cacheGroups`项默认值的配置(整理后)：
(vue-cli chainWebpack配置处大致是node_modules/@vue/cli-service/lib/config/app.js:38)

```javascript
module.exports = {
  entry: {
    app: './src/main',
  },
  output: {
    path: __dirname + '/dist',
    filename: 'static/js/[name].[contenthash:8].js',
    chunkFilename: 'static/js/[name].[contenthash:8].js',
  },
  optimization: {
    splitChunks: {
      chunks: 'async', // 只处理异步 chunk，这里两个缓存组都另配了 chunks，那么就被无视了 
      minSize: 30000, // 允许新拆出 chunk 的最小体积
      maxSize: 0, // 旨在与 HTTP/2 和长期缓存一起使用。它增加了请求数量以实现更好的缓存。它还可以用于减小文件大小，以加快二次构建速度。
      minChunks: 1, // 拆分前被 chunk 公用的最小次数
      maxAsyncRequests: 5, // 每个异步加载模块最多能被拆分的数量
      maxInitialRequests: 3, // 每个入口和它的同步依赖最多能被拆分的数量
      automaticNameDelimiter: '~',
      cacheGroups: { // 缓存组
        vendors: {
          name: `chunk-vendors`,
          test: /[\\/]node_modules[\\/]/,
          priority: -10, // 缓存组权重，数字越大优先级越高
          chunks: 'initial' // 只处理初始 chunk
        },
        common: {
          name: `chunk-common`,
          minChunks: 2, // common 组的模块必须至少被 2 个 chunk 共用 (本次分割前) 
          priority: -20,
          chunks: 'initial', // 只针对同步 chunk
          reuseExistingChunk: true  // 复用已被拆出的依赖模块，而不是继续包含在该组一起生成
        }
      },
    },
  },
};
```

运行打包后，发现入口文件依赖的第三方包被全数拆出放进了`chunk-vendors.js`，剩下的同步依赖都被打包进了`app.js`，而其他都是懒加载组件生成的异步 chunk。并没有打包出所谓的公共模块合集`chunk-common.js`。(module 被两个以上chunk所应用，那么拆分module 生成打包文件)

解读下此配置的拆分实现：	

1. 入口来自 node_modules 文件夹的同步依赖放入chunk-vendors；
2. 被至少 2 个 同步 chunk 共享的模块放入chunk-common；
3. 符合每个缓存组其他条件的情况下，能拆出的模块整合后的体积必须大于30kb(*在进行 min+gz 之前的体积*)。**小了不生成新 chunk**。
4. 每个异步引入模块并行请求的数量 (即它本身和它的同步依赖被拆分成的 js 个数)不能多于5个；每个入口文件和它的同步依赖最多能被拆成3个 js。
5. 即使不匹配任何一个缓存组，splitChunks.* 级别的最小 chunk 属性minSize也会影响所有**异步 chunk**，效果是**体积大于minSize值的公共模块（大于等于2个异步chunk引用的模块）会被拆出**。(除非 splitChunks.* chunks: 'initial')
   公共模块即 >= 2个异步 chunk 共享的模块，同minChunks: 2。

### 拆包优化

- **基础类库 chunk-libs**
  构成项目必不可少的一些基础类库，如`vue`+`vue-router`+`vuex`+`axios` 这种标准的全家桶，它们的升级频率都不高，但每个页面都需要它们。(一些全局被共用的，体积不大的第三方库也可以放在其中：比如`nprogress`、`js-cookie`等)

- **UI 组件库**
  理论上 UI 组件库也可以放入 libs 中，但它实在是过大，不管是Element-UI还是Ant Designgzip 压缩完都要 200kb 左右，可能比 libs 里所有的包加起来还要大不少，而且 UI 组件库的更新频率也相对比 libs 要更高一点。我们会及时更新它来解决一些现有的 bugs 或使用一些新功能。**所以建议将 UI 组件库单独拆成一个包**。

- **自定义组件/函数 chunk-commons**
  这里的 commons 分为 必要和非必要。
  **必要组件是指那些项目里必须加载它们才能正常运行的组件或者函数。**比如你的路由表、全局 state、全局侧边栏/Header/Footer 等组件、自定义 Svg 图标等等。这些其实就是你在入口文件中依赖的东西，它们都会默认打包到app.js中。
  非必要组件是指被大部分懒加载页面使用，但在入口文件 entry 中未被引入的模块。比如：一个管理后台，你封装了很多select或者table组件，由于它们的体积不会很大，它们都会被默认打包到到每一个懒加载页面的 chunk 中，这样会造成不少的浪费。你有十个页面引用了它，就会包重复打包十次。所以应该将那些被大量共用的组件单独打包成chunk-commons。
  不过还是要结合具体情况来看。一般情况下，你也可以将那些*非必要组件/函数*也在入口文件 entry 中引入，和*必要组件/函数*一同打包到app.js之中也是没什么问题的。



- **低频组件**
  低频组件和上面的自定义公共组件 chunk-commons 最大的区别是，它们只会在一些特定业务场景下使用，比如富文本编辑器、js-xlsx前端 excel 处理库等。一般这些库都是第三方的且大于30kb (缓存组外的默认minSize值)，也不会在初始页加载，所以 webpack 4 会默认打包成一个独立的 js。一般无需特别处理。小于minSize的情况会被打包到具体使用它的页面 js (异步 chunk) 中。



- **业务代码**
  就是我们平时经常写的业务代码。一般都是按照页面的划分来打包，比如在 vue 中，使用[路由懒加载](https://links.jianshu.com/go?to=https%3A%2F%2Frouter.vuejs.org%2Fzh%2Fguide%2Fadvanced%2Flazy-loading.html)的方式加载页面 component: () => import('./Guide.vue') webpack 默认会将它打包成一个独立的异步加载的 js。



再回观我们之前的`app.js`和`chunk-vendors.js`。它们都是初始加载的` js`，由于体积太大需要在合理范围内拆分成更小一些的 `js`，以利用浏览器的并发请求，优化首页加载体验。

- 为了缩减初始代码体积，通常只抽入口依赖的第三方、另行处理懒加载页面的库依赖更为合理。而我的项目中除了重复的一个，异步模块无其他第三方引入。就简单交由commons缓存组去处理。vue 我通过 webpack 的 [externals](https://links.jianshu.com/go?to=https%3A%2F%2Fwebpack.docschina.org%2Fconfiguration%2Fexternals%2F%23externals) 配了 CDN，故没有打包进来。
- chunk-vendors.js的Element-UI组件库应单独分出为chunk-elementUI.js，由于它包含在第三方包的缓存组内，要给它设置比libs更高的优先级。
- app.js中图标占了大头可以单独抽出来，把自定义 svg 都放到 chunk-svgIcon.js 中；
- 备一个优先级最低的chunk-commons.js，用于处理其他公共组件

```javascript
splitChunks: {
  chunks: "all",
  minSize: 20000, // 允许新拆出 chunk 的最小体积，也是异步 chunk 公共模块的强制拆分体积
  maxAsyncRequests: 6, // 每个异步加载模块最多能被拆分的数量
  maxInitialRequests: 6, // 每个入口和它的同步依赖最多能被拆分的数量
  enforceSizeThreshold: 50000, // 强制执行拆分的体积阈值并忽略其他限制
  cacheGroups: {
    libs: { // 第三方库
      name: "chunk-libs",
      test: /[\\/]node_modules[\\/]/,
      priority: 10,
      chunks: "initial" // 只打包初始时依赖的第三方
    },
    elementUI: { // elementUI 单独拆包
      name: "chunk-elementUI",
      test: /[\\/]node_modules[\\/]element-ui[\\/]/,
      priority: 20 // 权重要大于 libs
    },
    svgIcon: { // svg 图标
      name: 'chunk-svgIcon',
      test(module) {
        // `module.resource` 是文件的绝对路径
        // 用`path.sep` 代替 / or \，以便跨平台兼容
        // const path = require('path') // path 一般会在配置文件引入，此处只是说明 path 的来源，实际并不用加上
        return (
          module.resource &&
          module.resource.endsWith('.svg') &&
          module.resource.includes(`${path.sep}icons${path.sep}`)
        )
      },
      priority: 30
    },
    commons: { // 公共模块包
      name: `chunk-commons`,
      minChunks: 2, 
      priority: 0,
      reuseExistingChunk: true
    }
  },
};
```

好了，这大概就是`splitChunk`的内容，我们修改下`webpack.prod.ts`

```typescript
optimization: {
    splitChunks: {
      chunks: 'all',
      minSize: 20000, // 允许新拆出 chunk 的最小体积，也是异步 chunk 公共模块的强制拆分体积
      maxAsyncRequests: 6, // 每个异步加载模块最多能被拆分的数量
      maxInitialRequests: 6, // 每个入口和它的同步依赖最多能被拆分的数量
      enforceSizeThreshold: 50000, // 强制执行拆分的体积阈值并忽略其他限制
      // 分隔代码
      cacheGroups: {
        libs: {
          // 提取node_modules代码
          test: /node_modules/, // 只匹配node_modules里面的模块
          name: 'chunk-libs', // 提取文件命名为vendors,js后缀和chunkhash会自动加
          chunks: 'initial', // 只提取初始化就能获取到的模块,不管异步的
          priority: 10 // 提取优先级为1
        },
        // 公共模块包，同步模块 chunks 包含同步和异步
        commons: {
          name: 'chunk-commons', // 提取文件命名为commons
          minChunks: 2, // 只要使用两次就提取出来
          minSize: 0, // 提取代码体积大于0就提取出来
          reuseExistingChunk: true // 复用已被拆出的依赖模块，而不是继续包含在该组一起生成
        }
      }
    },
    // 作用是将包含chunks映射关系的list单独从app.js里提取出来，因为每一个chunk的id基本都是基于内容hash出来的，每次改动都会影响hash值，如果不将其提取，造成每次app.js都会改变。缓存失效  
    runtimeChunk: {
      name: 'runtime'
    },
    minimize: true,
    minimizer: [
      new CssMinimizerPlugin(), // 压缩css
      new TerserPlugin({
        parallel: true, // 开启多线程压缩
        terserOptions: {
          compress: {
            pure_funcs: ['console.log', 'debugger'] // 删除console.log
          }
        }
      })
    ]
  },
```

