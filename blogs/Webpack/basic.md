---
title: webpack系列-第一篇
date: 2023-04-27
categories: 
 - Webpack
tags:
 - webpack 第一篇
sidebar: auto
---

## 1. 版本说明

> nodejs: v16.18.0
>
> pnpm: 7.18.2
>
> webpack:  5.80.0
>
> webpack-cli: 5.0.2
>
> vue: 3.2.47
>
> typescript: 5.0.4

## 2. 代码规范相关配置

### eslint + prettier

1. 安装相关依赖

   ```powershell
   pnpm install eslint eslint-plugin-vue eslint-plugin-prettier @typescript-eslint/parser @typescript-eslint/eslint-plugin -D
   ```

2. **eslintrc**配置

   ```js
   {
     "root": true,
     "env": {
       "browser": true,
       "node": true,
       "es2021": true,
     },
     extends: [
       'eslint:recommended',
       'plugin:vue/vue3-recommended',
       'plugin:prettier/recommended',
       'plugin:@typescript-eslint/recommended',
     ],
     parserOptions: {
       ecmaVersion: 12,
       parser: '@typescript-eslint/parser',
       sourceType: 'module',
       jsxPragma: 'React',
       ecmaFeatures: {
         jsx: true,
       },
     },
     rules: {
       "no-console": process.env.NODE_ENV === "production" ? "error" : "off",
       "no-debugger": process.env.NODE_ENV === "production" ? "error" : "off",
       "prettier/prettier": [
         "error",
         {
           endOfLine: "auto",
         },
       ],
       "vue/html-self-closing": "error",
     },
   }
   ```

3. **prettierrc**配置

   ```javascript
   // .prettierrc.js
   module.exports = {
     printWidth: 100, // 单行输出（不折行）的（最大）长度  
     tabWidth: 2, // 每个缩进级别的空格数  
     tabs: false, // 使用制表符 (tab) 缩进行而不是空格 (space)。  
     semi: false, // 是否在语句末尾打印分号  
     singleQuote: true, // 是否使用单引号  
     quoteProps: 'as-needed', // 仅在需要时在对象属性周围添加引号  
     bracketSpacing: true, // 是否在对象属性添加空格  
     jsxBracketSameLine: true,
     // 将 > 多行 JSX 元素放在最后一行的末尾，而不是单独放在下一行（不适用于自闭元素）,
     //默认false,这里选择>不另起一行  
     htmlWhitespaceSensitivity: 'ignore',
     // 指定 HTML 文件的全局空白区域敏感度, "ignore" - 空格被认为是不敏感的  
     trailingComma: 'none', // 去除对象最末尾元素跟随的逗号  
     useTabs: false, // 不使用缩进符，而使用空格  
     jsxSingleQuote: false, // jsx 不使用单引号，而使用双引号  
     arrowParens: 'always', // 箭头函数，只有一个参数的时候，也需要括号  
     rangeStart: 0, // 每个文件格式化的范围是文件的全部内容  
     proseWrap: 'always', // 当超出print width（上面有这个参数）时就折行  
     endOfLine: 'lf' // 换行符使用 lf
   };
   ```

### husky&lint-staged&commitizen 

1. 安装依赖

   ```powershell
   pnpm dlx husky-init && pnpm install
   ```

2. 添加脚本

   ```powershell
   pnpm pkg set scripts.prepare="husky install"
   pnpm run prepare
   ```

3. 修改`.husky/pre-commit`

   ```sh
   #!/usr/bin/env sh
   . "$(dirname -- "$0")/_/husky.sh"
   
   pnpm run lint:lint-staged
   ```

4. `lint-staged`

   1. 安装依赖

      ```powershell
      pnpm install lint-staged -D
      ```

   2. 修改`package.json`文件

      ```json
      "lint-staged": {
          "src/**/*.{js,jsx,ts,tsx,vue}": [
            "prettier --write",
            "eslint --cache --fix",
            "git add"
          ]
      }
      ```

5. `commitzen `提交信息参考这篇文件配置

   [参考链接](https://segmentfault.com/a/1190000039813329)

### 3. Typescript支持

安装依赖

```powershell
pnpm install typescript webpack webpack-cli -D
pnpm install babel-loader ts-node @babel/core @babel/preset-typescript @babel/preset-env core-js -D
pnpm install @types/node
```

创建`tsconfig.json`

```json
{
  "compilerOptions": {
    "types": ["@types/node"],
    "target": "esnext",
    "module": "CommonJS",
    "moduleResolution": "node",
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "allowSyntheticDefaultImports": true,
    "strictFunctionTypes": false,
    "jsx": "preserve",
    "baseUrl": "./",
    "allowJs": true,
    "sourceMap": true,
    "esModuleInterop": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "experimentalDecorators": true,
    "lib": [
      "dom",
      "esnext"
    ],
    "incremental": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "types/**/*.d.ts",
    "types/**/*.ts",
    "build/**/*.ts",
    "build/**/*.d.ts",
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.js"
  ],
  "ts-node": {
    "logError": true,
    "transpileOnly": true
  }
}
```

## 4. webpack.base.ts配置

1. 安装依赖

   ```powershell
   pnpm install webpack webpack-cli html-webpack-plugin vue-loader -D
   ```

2. 通用配置`webpack.base.ts`

   ```typescript
   import { Configuration } from 'webpack'
   
   import HtmlWebpackPlugin from 'html-webpack-plugin'
   
   import { VueLoaderPlugin } from 'vue-loader'
   
   const baseConfig:Configuration = {
       entry: path.join(__dirname, '../src/main.ts'),
       output: {
           filename: '[name]_[contentHash:8].js',
           path: path.join(__dirname, '../dist'),
           clean: true, // 构建清除
           publicPath: '/' // 构建根路径
       },
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
                }
           ]
       },
       resolve: {
           extensions: ['.vue', '.ts', '.tsx', '.js']
       },
       plugins: [
           new VueLoaderPlugin(),
           new HtmlWebpackPlugin({
             title: 'koona Webpack',
             template: path.join(__dirname, '../public/index.html'),
             filename: 'index.html',
             // 压缩html资源
             minify: {
               collapseWhitespace: true, // 去空格
               removeComments: true // 去注释
             }
           })
       ]
   }
   ```

3. `.babelrc`的配置

   ```json
   {
     "presets": [
       [
         "@babel/preset-env",
         {
           // 设置兼容目标浏览器版本,也可以在根目录配置.browserslistrc文件,babel-loader会自动寻找上面配置好的文件.browserslistrc
           "targets": { "browsers": ["> 1%", "last 2 versions", "not ie <= 8"] },
           "useBuiltIns": "usage", // 根据配置的浏览器兼容,以及代码中使用到的api进行引入polyfill按需添加
           "corejs": 3, // 配置使用core-js使用的版本
           "loose": true
         }
       ],
       [
         "@babel/preset-typescript",
         {
           "allExtensions": true //支持所有类型
         }
       ]
     ],
     "plugins": ["@babel/plugin-transform-runtime"]
   }
   ```

4. `package.json`脚本配置

   ```json
   "scripts": {
       "dev": "webpack serve --mode development --config  build/webpack.base.ts",
       "build": "webpack --mode production --config build/webpack.base.ts",
   }
   ```

5. ` src/main.ts /src/App.vue`

   **main.ts**

   ```typescript
   import { createApp } from 'vue'
   
   import App from './App.vue'
   
   const app = createApp(App)
   
   app.mount('#app')
   
   ```

   **App.vue**

   ```vue
   <script lang="ts">
   import { defineComponent } from "vue"
   export default defineComponent({
     setup() {
       return {}
     }
   })
   </script>
   <template>
     <div>Webpack Build Vue3.x</div>
   </template>
   
   ```

6. `public index.html`

   ```html
   <!DOCTYPE html>
   <html lang="">
   
   <head>
     <meta charset="utf-8">
     <meta http-equiv="X-UA-Compatible" content="IE=edge">
     <meta name="viewport" content="width=device-width,initial-scale=1.0">
     <title>
       <%= htmlWebpackPlugin.options.title %>
     </title>
   </head>
   
   <body>
     <noscript>
       <strong>We're sorry but <%= htmlWebpackPlugin.options.title %> doesn't work properly without JavaScript enabled.
           Please enable it to continue.</strong>
     </noscript>
     <div id="app">
     </div>
   </body>
   
   </html>
   ```

7. 测试

   ```powershell
   pnpm run dev # dev
   pnpm run build # pro
   ```

8. 效果图

   `dev`

   ![image-20230427171316559](/my-blog/webpack/image-20230427171316559.png)

   `build`

   ![Dingtalk_20230427171226](/my-blog/webpack/Dingtalk_20230427171226.jpg)

9. 💡：

   1. 原本解析`.vue`需要`vue-loader & @vue/compiler-sfc`依赖进行模板解析的，但是`vue 3.2.13+`已经内置了`@vue/compile-sfc`
   2. `webpack5`的`output`中配置了`clean: true`代表清除打包目录，所以无需安装`clean-webpack-plugin`

## 5. webpack.dev.ts配置

```typescript
import path from 'path'

import { merge } from 'webpack-merge'

import { Configuration as WebpackConfiguration } from 'webpack'

import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server'

interface WebpacDevConfiguraion extends WebpackConfiguration {
  devServer: WebpackDevServerConfiguration
}

import baseConfig from './webpack.base'

const webpackDevConfig: WebpacDevConfiguraion = merge(baseConfig, {
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  devServer: {
    host: '127.0.0.1',
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
}) as WebpacDevConfiguraion

export default webpackDevConfig

```

















