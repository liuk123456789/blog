---
title: Rollup打包vue
date: 2023-04-17
categories: 
 - Rollup
tags:
 - Rollup&vue
sidebar: auto
---

## 

## 前言

因为`vite`是基于`rollup`，所以想通过这种方式，更深入的熟悉`rollup`，在日常生产中，我们还是选择`vite`

## 1. 通过rollup打包vue应用

> 版本说明
> node: 16.18.0
>
> vue: ^3.2.47
>
> rollup: ^3.20.3
>
> typescript: ^4.9.3

## 2. 初始npm

```shell
npm init -y
```

## 3. 安装一些常规依赖

```shell
npm i rollup vue typescript@4.9.3 @antfu/eslint-config eslint -D

npm i @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-json --D
```

## 4. 基本配置相关

`.eslintignore`

```
dist
node_modules
*.d.ts

```

`eslintrc`

```json
{
  "extends": "@antfu",
  "rules": {
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-ts-expect-error": "off"
  }
}
```

`tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "esnext",
    "lib": [      
      "dom",
      "esnext"
    ],
    "baseUrl": "./",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "jsx": "preserve",
    "strict": true,
    "strictNullChecks": true,
    "resolveJsonModule": true,
    "skipLibCheck": true
  },
}
```

## 5. rollup配置

`rollup.config.js`

```javascript
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

export default {
	input: './src/main.ts'
    output: {
    	format: 'es',
    	dir: 'dist'
	},
    plugins: [
        commonjs(),
        resolve(),
        json()
    ]
}
```

## 6. 修改下package.json

```json
{
	***
	"type": "module", // esm 规范
    "scripts": {
    	"build": "rollup --config  rollup.cofing.js",
    	"dev": "rollup --config rollup.config.js -w"
    }
}
```

我们先默认打包使用`rollup.config.js`，后续会进行拆分

## 7. 新建src目录

根目录下新建`src`目录，并且新建个文件`main.ts`,可以填写些内容，如

```typescript
funtion add(a: number, b: number): number {
    return a + b
}

export default add
```

因为使用了`ts`，我们需要通过插件`rollup-plugin-esbuild`让`rollup`能够打包`ts`，修改下`rollup.config.js`

```javascript
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

import esbuild from 'rollup-plugin-esbuild'

const isProEnv = (env) => {
    return process.env.NODE_ENV === 'production'
}

export default {
	input: './src/main.ts'
    output: {
    	format: 'es',
    	dir: 'dist'
	},
    plugins: [
        commonjs(),
        resolve(),
        json(),
        esBuild({
            // 这里先占个位，后续会配置环境变量的
            minify: isProEnv
        })
    ] 
}
```

到了这一步，我们需要打包看下是否正常

```shell
npm run dev

npm run build
```

## 8. 打包Vue相关步骤

1. `src`目录下新建`App.vue`,内容可以随意填写，可参考如下

   ```vue
   <script lang="ts" setup>
   import { onMounted, ref } from 'vue'
   
   import { isUndefined } from './utils/is'
   
   import BaseImage from '@/components/BaseImage/index.vue'
   
   const count = ref(0)
   
   onMounted(() => {
     setInterval(() => {
       count.value++
     }, 1000)
   })
   </script>
   
   <template>
     <div>
       <div>Vue3 App Rollup Generator CLi</div>
       <p>当前数量：{{ count }}</p>
       <p>测试：{{ isUndefined(count) ? 'Yes' : 'No' }}</p>
       <BaseImage />
     </div>
   </template>
   
   <style lang="scss">
   $themeColor: #3e68ff;
   
   #app {
     p {
       font-size: 32px;
       color: $themeColor;
     }
   }
   </style>
   ```

2. `main.ts`挂载下`app`

   ```typescript
   import { createApp } from 'vue'
   
   import App from './App.vue'
   
   const app = createApp(App)
   
   app.mount('#app')
   ```

3. 安装`sass rollup-plugin-postcss`依赖

   ```shell
   npm i sass rollup-plugin-postcss -D
   ```

4. 根目录新建`build`文件目录，同时新建以下几个文件

   `rollup.dev.config.js`: `development`配置

   `rollup.prop.config.js`: `production`配置

   `rollup.common.config.js`: 通用配置

   1. `rollup.common.config.js`配置如下

      安装相关依赖

      ```shell
      npm i rollup-plugin-peer-deps-external @rollup/plugin-replace @rollup/plugin-strip -D
      ```

      具体配置如下

      ```javascript
      import PluginPeerDepsExternal from 'rollup-plugin-peer-deps-external'
      import PluginJson from '@rollup/plugin-json'
      import PluginVue from 'rollup-plugin-vue'
      import PluginNodeResolve from '@rollup/plugin-node-resolve'
      import PluginCommonJS from '@rollup/plugin-commonjs'
      import { babel as PluginBabel } from '@rollup/plugin-babel'
      import PluginAlias from '@rollup/plugin-alias'
      import PluginReplace from '@rollup/plugin-replace'
      
      import PluginPostCss from 'rollup-plugin-postcss'
      import PluginStrip from '@rollup/plugin-strip'
      
      import PluginEsbuild from 'rollup-plugin-esbuild'
      
      const isProduction = (env) => {
          return env === 'production'
      }
      
      export default {
        input: './src/main.ts',
        output: {
          format: 'es',
          dir: 'dist',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
        plugins: [
          PluginPeerDepsExternal(),
          PluginAlias({
            entries: {
              '@': 'src',
              'types': 'types',
            },
          }),
          PluginNodeResolve({
            browser: true,
            extensions: ['.js', '.ts', '.jsx'],
          }),
          PluginVue({
            preprocessStyles: true, // 预处理样式
          }),
          PluginBabel({ babelHelpers: 'bundled' }),
          PluginCommonJS(),
          PluginJson(),
          PluginEsbuild({
            minify: isProduction(process.env.NODE_ENV),
            jsxFactory: 'vueJsxCompat',
          }),
          PluginStrip({
            include: '**/*.(ts|mjs|cjs|js)',
          }),
          PluginReplace({
            "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),// 替换环境变量
             preventAssignment: true,
          }),
          PluginPostCss()
        ],
      }
      ```

   2. `rollup.dev.config.js`

      安装对应依赖，用于构建本地服务器

      ```javascript
      npm i rollup-config-serve -D
      ```

      具体配置如下

      ```javascript
      import PluginServe from 'rollup-plugin-serve'
      
      import chalk from 'chalk'
      
      import _ from 'lodash'
      
      import RollupCommonConfig from './rollup.common.js'
      
      export default _.merge({
        plugins: [
          PluginServe({
            // 运行在浏览器中
            open: true,
            // 运行成功后，打开的地址
            openPage: '/',
            // 打印服务地址
            verbose: true,
            // 地址，端口号
            // host:"::",
            host: '127.0.0.1',
            port: 9527,
            // https 协议配置
            // https: {},
            // 运行成功，事件
            onListening(server) {
              const address = server.address()
              const host = address.address === '::' ? 'localhost' : address.address
              // by using a bound function, we can access options as `this`
              const protocol = this.https ? 'https' : 'http'
              // eslint-disable-next-line no-console
              console.log(
                chalk.blueBright('Server listening at ') + chalk.green(`${protocol}://${host}:${address.port}/`),
              )
            },
          }),
        ],
      }, RollupCommonConfig)
      
      ```

   3. `rollup.pro.config.js`

      具体配置如下

      ```javascript
      import PluginHtml from '@rollup/plugin-html'
      
      import _ from 'lodash'
      
      import RollupCommonConfig from './rollup.common.config'
      
      export default _.merge({}, RollupCommonConfig, {
        plugins: [
          PluginHtml({
            title: 'rollup-vue3-test',
            fileName: 'index.html',
          }),
        ],
      })
      ```

5. 修改下`rollup.config.js`的配置

   ```javascript
   import rollupDevConfig from './build/rollup.dev.config.js'
   import rollupProConfig from './build/rollup.pro.config.js'
   
   const rollupConfig = process.env.NODE_ENV === 'development' ? rollupDevConfig : rollupProConfig
   
   export default rollupConfig
   
   ```

6. `package.json`的脚本修改

   ```json
   {
     "scripts": {
       "dev": "rollup --config --environment NODE_ENV:development --watch",
       "build": "rollup --config --environment NODE_ENV:production"
     }
   }
   ```

   通过这种配置，我们便可以通过`process.env.NODE_ENV`访问到配置的变量

7. 打包

   ```shell
   npm run dev
   npm run build
   ```

8. 图片导入支持

   安装依赖

   ```shell
   npm i @rollup/plugin-image -D
   ```

   修改`rollup.common.js`配置

   ```javascript
   import PluginImage from '@rollup/plugin-image'
   
   export default {
   	plugins: [
   		***
           PluginImage()
   	]
   }
   ```

   `src`目录下建个`components/BaseImage`目录，新建文件`index.vue`,代码如下

   ```vue
   <script lang="ts">
   import { defineComponent } from 'vue'
   
   import testImg from '@/images/test.jpg'
   
   export default defineComponent({
     setup() {
       return {
         testImg,
       }
     },
   })
   </script>
   
   <template>
     <img class="image" :src="testImg">
   </template>
   
   <style lang="scss" scoped>
     .image {
       width: 400px;
       height: auto;
     }
   </style>
   ```

   `App.vue`引入

   ```vue
   <script lang="ts" setup>
   import { onMounted, ref } from 'vue'
   
   import { isUndefined } from './utils/is'
   
   import BaseImage from '@/components/BaseImage/index.vue'
   
   const count = ref(0)
   
   onMounted(() => {
     setInterval(() => {
       count.value++
     }, 1000)
   })
   </script>
   
   <template>
     <div>
       <div>Vue3 App Rollup Generator CLi</div>
       <p>当前数量：{{ count }}</p>
       <p>测试：{{ isUndefined(count) ? 'Yes' : 'No' }}</p>
       <BaseImage />
     </div>
   </template>
   
   <style lang="scss">
   $themeColor: #3e68ff;
   
   #app {
     p {
       font-size: 32px;
       color: $themeColor;
     }
   }
   </style>
   
   ```

9. 最终效果图如下

   ![image-20230418140441547](/my-blog/rollup/image-20230418140441547.png)

## 遗留问题

因为想在`vue`中使用`tsx`, 配置了`babel`，但是最终打包还是报错，未能解决，如果文章被大佬看到，如有解决方案，可以`github`提个`issue`，不胜感激

这是我当前的配置

`.babelrc`

```javascript
module.exports = {
  presets: [["@babel/env", { modules: false }]],
  plugins: ["@vue/babel-plugin-jsx"]
};
```

`BaseImage`

```vue
<script lang="tsx">
import { defineComponent } from 'vue'

import testImg from '@/images/test.jpg'

export default defineComponent({
  setup() {
    return () => (
      <img class="image" src={testImg} />
    )
  },
})
</script>

<style lang="scss" scoped>
  .image {
    width: 400px;
    height: auto;
  }
</style>

```

报错信息如下图

![rollup_tsx_20230418141546](/my-blog/rollup/rollup_tsx_20230418141546.png)

