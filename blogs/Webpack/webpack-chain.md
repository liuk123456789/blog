---
title: webpack系列-第五篇
date: 2023-05-10
categories: 
 - Webpack
tags:
 - webpack 第五篇
sidebar: auto
---

## 1. 前言

因为`vue-cli`的配置选项基本都是集成自`webpack-chain`的`api`，所以实践下`webpack-chain`

[webpack-chain](https://github.com/neutrinojs/webpack-chain)

💡：因为测试涉及太多，不用图片展示了

## 2. 准备工作

1. 在[webpack-vue](https://github.com/liuk123456789/webpack-vue)中进行测试，所以切了个[分支](https://github.com/liuk123456789/webpack-vue/tree/release-feature-1.4.0/kn_webpackchain_20230508)

2. 依赖安装

   ```shell
   pnpm install webpack-chain -D
   pnpm install @types/webpack-chain
   ```

3. `build`目录下新建文件`webpack.chain.ts`

4. `package.json`增加个脚本`test:chain: ts-node build/webpack.chain.ts`

## 3. 入口配置

1. 单入口

   ```typescript
   chainConfig.entry('app').add('src/index.ts').end()
   ```

   结果如下：

   ```javascript
   { entry: { app: [ 'src/index.ts' ] } }
   ```

   

2. 多入口

   ```typescript
   chainConfig.entry('app').add('src/index.ts').end().entry('main').add('src/main.ts').end()
   ```

   结果如下：

   ```javascript
   { entry: { app: [ 'src/index.ts' ], main: [ 'src/main.ts' ] } }
   ```

## 4. 出口配置

```typescript
chainConfig
  .output.path('dist')
  .filename('[name].[contenthash:8].js')
  .publicPath('/')
  .chunkFilename('[name].[contenthash:8].js')
  .end()
```

输出结果

```javascript
{
  output: {
    path: 'dist',
    filename: '[name].[contenthash:8].js',
    publicPath: '/',
    chunkFilename: '[name].[contenthash:8].js'
  }
}
```

## 5. resolve

#### alias&extensions&modules

```typescript
chainConfig.resolve.alias.set('@', path.join(__dirname, '../src'))
.end()
.extensions.add('.ts')
.add('.js')
.prepend('.vue')
.end()
.modules.add('node_modules')
.end()
```

输出结果

```typescript
resolve: {
	alias: { '@': 'E:\\webpack\\webpack-vue\\src' },
	extensions: [ '.vue', '.ts', '.js' ],
    modules: [ 'node_modules' ]
}
```

## 6. optimizations

```typescript
chainConfig.when(isPro(process.env.NODE_ENV), (config) =>
  config.optimization
    .minimize(true)
    .usedExports(true)
    .sideEffects(true)
    .runtimeChunk({
      name: 'runtime'
    })
    .splitChunks({
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
    })
    .minimizer('css')
    .use(CssMinimizerPlugin)
    .end()
    .minimizer('terser')
    .use(TerserPlugin)
    .end()
)
```

修改下脚本文件，配置下环境变量

```json
{
    "scripts": {
    	"test:chain": "cross-env NODE_ENV=production ts-node build/webpack.chain.ts",
    }
}
```

输出结果

```javascript
  optimization: {
    minimize: true,
    usedExports: true,
    sideEffects: true,
    runtimeChunk: { name: 'runtime' },
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxAsyncRequests: 6,
      maxInitialRequests: 6,
      enforceSizeThreshold: 50000,
      cacheGroups: [Object]
    },
    minimizer: [ [CssMinimizerPlugin], [TerserPlugin] ]
  }
```

💡: minimizer的配置问题，生成的结果其实并不是预期，预期结果如下

```typescript
optimization:{
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
}
```

但是目前官网提供的配置只能通过`.minimizer('terser').use(TerserPlugin)`这样的方式，所以这里目前没有解决

## 7. plugins

配置如下

```typescript
chainConfig
  .when(isPro(process.env.NODE_ENV), (config) =>
    config.optimization
      .minimize(true)
      .usedExports(true)
      .sideEffects(true)
      .runtimeChunk({
        name: 'runtime'
      })
      .splitChunks({
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
      })
      .minimizer('css')
      .use(CssMinimizerPlugin)
      .end()
      .minimizer('terser')
      .use(TerserPlugin)
      .tap((args) => [
        ...args,
        {
          parallel: true, // 开启多线程压缩
          terserOptions: {
            compress: {
              pure_funcs: ['console.log'] // 删除console.log
            }
          }
        }
      ])
      .end()
  )
  .plugin('vue-loader')
  .use(VueLoaderPlugin)
  .end()
  .plugin('ScriptExtHtmlPlugin')
   // 在 HtmlWebpackPlugin 插件后加载
  .after('html')
  .use('script-ext-html-webpack-plugin', [
    {
      // `runtime` must same as runtimeChunk name. default is `runtime`
      inline: /runtime\..*\.js$/
    }
  ])
  .end()
  .plugin('html')
  .use(HtmlWebpackPlugin)
  .end()

  .when(isPro(process.env.NODE_ENV), (config) => {
    config
      .plugin('copy')
      .use(CopyPlugin, [
        {
          patterns: [
            {
              from: path.resolve(__dirname, '../public'),
              to: path.resolve(__dirname, '../dist'),
              filter: (source: string) => !source.includes('index.html')
            }
          ]
        }
      ])
      .end()
      .plugin('mini-css-extract')
      .use(MiniCssExtractPlugin, [
        {
          filename: 'css/[name].[contenthash:8].css' // 抽离css的输出目录和名称
        }
      ])
      .end()
      .plugin('compress')
      .use(CompressionPlugin, [
        {
          test: /\.(js|css)$/, // 只生成css,js压缩文件
          filename: '[path][base].gz', // 文件命名
          algorithm: 'gzip', // 压缩格式,默认是gzip
          threshold: 10240, // 只有大小大于该值的资源会被处理。默认值是 10k
          minRatio: 0.8 // 压缩率,默认值是 0.8
        }
      ])
  })
  .end()
```

输出如下

```javascript
[
    VueLoaderPlugin {},
    HtmlWebpackPlugin { userOptions: [Object], version: 5 },
    ScriptExtHtmlWebpackPlugin { options: [Object] },
    CopyPlugin { patterns: [Array], options: {} },
    MiniCssExtractPlugin {
      _sortedModulesCache: [WeakMap],
      options: [Object],
      runtimeOptions: [Object]
    },
    CompressionPlugin {
      options: [Object],
      algorithm: [Function: asyncBufferWrapper]
    }
]
```

## 8. module

```typescript
chainConfig.module.rule('compile')
  .test(/\.vue$/)
  .use('vue-loader')
  .end()
  .rule('js')
  .exclude.add((file) => /node_modules/.test(file) && !/\.vue\.js/.test(file))
  .end()
  .test(/\.js$/)
  .use('babel-loader')
  .end()
  .rule('ts')
  .exclude.add(/node_modules/)
  .end()
  .use('babel-loader')
  .end()
```

如果是这里关于样式`loader`的处理，可以参考`vue-cli`的配置，核心代码如下

```javascript
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
```



