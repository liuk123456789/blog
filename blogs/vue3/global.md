---
title: vite配置&全局组件相关
date: 2022-12-29
categories: 
 - Vue
tags:
 - vite&register
sidebar: auto
---

### 1. 如何注册全局组件

1. 创建一个BaseImage组件，如下

   ```vue
   <template>
     <el-image v-bind="$attrs" loading="lazy">
       <template #placeholder>
         <div class="image-slot p-absolute"> 加载中<span class="dot">...</span> </div>
       </template>
     </el-image>
   </template>
   <script lang="ts" setup name="BaseImage"></script>
   <style lang="less" scoped>
   .image-slot {
     width: 50px;
     color: @thirdColor;
     top: 50%;
     left: 50%;
     transform: translate(-50%, -50%);
     text-align: center;
     font-size: 12px;
   }
   
   .el-image {
     .el-image__error {
       font-size: 12px;
       color: @thirdColor;
     }
   }
   </style>
   
   ```

   

2. 目录下新建install.ts

   ```typescript
   import type { App } from 'vue'
   
   import BaseImage from './BaseImage'
   
   export default {
     install(app: App) {
       app.component('BaseImage', BaseImage)
     }
   }
   ```

   

3. 注册,新建registerGlobalComp.ts

   ```typescript
   import type { App } from 'vue'
   
   export const setupGlobalComp = (app: App) => {
     // TODO: globEager被弃用，暂未查到提代方案
     const components: Record<string, any> = import.meta.globEager('./**/install.ts')
     for (const path in components) {
       app.use(components[path].default)
     }
   }
   ```

   

4. 使用

   ```vue
   import { defineComponent } from 'vue'
   
   import LogoImg from '@/assets/images/logo.png'
   
   export default defineComponent({
     props: {
       onLink: {
         type: Function as PropType<() => void>,
         required: true
       }
     },
     setup(props) {
       return () => (
         <BaseImage
           class="cursor"
           onClick={props.onLink}
           style="width: 138px; height: 48px"
           src={LogoImg}
         />
       )
     }
   })
   
   ```

   

### 2. vite 的环境变量的配置

1. 环境变量如下

   ```json
   VITE_APP_API_HOST = ""
   VITE_APP_SERVER_MODE = development
   VITE_APP_CODE_URI_PREFIX = https://wecharttst.lcztrade.com/scan
   
   VITE_APP_DEFAULT_AVATAR = https://imgwx01.oss-cn-hzfinance.aliyuncs.com/lcz_mall_img/IMAGE8061750110650021628243411470.png?Expires=1943603411&OSSAccessKeyId=M1UaGBgxBvBWqXlg&Signature=KFJKmL9%2FBJnbvBNxhQxr5JuZXmM%3D
   
   ```

2. package.json npm script 配置脚本命令

   ```json
    "scripts": {
       "dev": "vite --mode development",
       "build": "run-p type-check build-only",
       "build:test": "run-p type-check build-test"
       "preview": "vite preview --port 4173",
       "build-only": "vite build",
       "build-test": "vite build --mode test"
       "type-check": "vue-tsc --noEmit",
       "lint": "eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix --ignore-path .gitignore"
     },
   ```

   

3. 配置tsconfig.json 文件

   ```json
   {
     "types": ["vite/client"],
     "include": {
       "env.d.ts"
     }
   }
   ```

   PS: 后续修改了env.d.ts的文件位置，统一放在types目录下，所以include修改为：{   "types/**/*.d.ts",

     "types/**/*.ts" }

4. env.d.ts 扩展*ImportMetaEnv*接口

   ```typescript
   // 三斜线告诉TS 文件依赖
   /// <reference types="vite/client" />
   
   interface ImportMetaEnv {
     VITE_PORT: number
     VITE_PROXY: [string, string][]
     VITE_GLOB_APP_TITLE: string
     VITE_APP_API_HOST: string
     VITE_APP_SERVER_MODE: string
     VITE_APP_CODE_URI_PREFIX: string
     VITE_APP_DEFAULT_AVATAR: string
     VITE_PUBLIC_PATH: string
     VITE_DROP_CONSOLE: boolean
   }
   ```

   

5. 使用

   ```vue
   <script lang="ts" setup>
   const envMeta = import.meta.env
   </script>
   ```

   

### 3. vite.config.ts中使用import.meta.env

1. 重写个方法wrapperEnv，用于处理env中的配置

   ```typescript
   // Read all environment variable configuration files to process.env
   export function wrapperEnv(envConf: Recordable): ImportMetaEnv {
     const ret: any = {}
   
     for (const envName of Object.keys(envConf)) {
       let realName = envConf[envName].replace(/\\n/g, '\n')
       realName = realName === 'true' ? true : realName === 'false' ? false : realName
       if (envName === 'VITE_PORT') {
         realName = Number(realName)
       }
       if (envName === 'VITE_PROXY' && realName) {
         try {
           // 单引号变双引号
           realName = JSON.parse(realName.replace(/'/g, '"'))
         } catch (error) {
           realName = ''
         }
       }
       ret[envName] = realName
       if (typeof realName === 'string') {
         process.env[envName] = realName
       } else if (typeof realName === 'object') {
         process.env[envName] = JSON.stringify(realName)
       }
     }
     return ret
   }
   ```

   

2. 修改vite.config.ts的配置

   ```typescript
   import { fileURLToPath, URL } from 'node:url'
   
   import { defineConfig, loadEnv } from 'vite'
   import type { UserConfig, ConfigEnv } from 'vite'
   
   import vue from '@vitejs/plugin-vue'
   import vueJsx from '@vitejs/plugin-vue-jsx'
   import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
   
   import vueSetupExtend from 'vite-plugin-vue-setup-extend'
   
   import { wrapperEnv } from './build/utils'
   import { createProxy } from './build/vite/proxy'
   
   import path from 'path'
   
   export default defineConfig({ mode: ConfigEnv }): UserConfig => {
     const root = process.cwd()
     // 获取环境变量
     const env = loadEnv(mode, root)
     // 进行数据格式转化
     const viteEnv = wrapperEnv(env)
     
     const { VITE_PORT, VITE_PUBLIC_PATH, VITE_PROXY, VITE_DROP_CONSOLE } = viteEnv
   
     return {
       base: VITE_PUBLIC_PATH,
       root,
       plugins: ***,
       resolve: ***,
       css: ***,
       server: ***,
       esbuild: ***
     }
   }
   
   ```

### 4. vite本地代理

1. .evn.development 设置代理url

   ```json
   VITE_PROXY = [["/website","https://wecharttst.lcztrade.com/wechart"]]
   ```

   

2. vite.config.ts配置server

   ```typescript
   import { fileURLToPath, URL } from 'node:url'
   
   import { defineConfig, loadEnv } from 'vite'
   import type { UserConfig, ConfigEnv } from 'vite'
   
   import vue from '@vitejs/plugin-vue'
   import vueJsx from '@vitejs/plugin-vue-jsx'
   import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
   
   import vueSetupExtend from 'vite-plugin-vue-setup-extend'
   
   import { wrapperEnv } from './build/utils'
   import { createProxy } from './build/vite/proxy'
   
   import path from 'path'
   
   export default defineConfig({ mode: ConfigEnv }): UserConfig => {
     const root = process.cwd()
     const env = loadEnv(mode, root)
     
     const viteEnv = wrapperEnv(env)
     
     const { VITE_PORT, VITE_PUBLIC_PATH, VITE_PROXY, VITE_DROP_CONSOLE } = viteEnv
     
     return {
       base: VITE_PUBLIC_PATH,
       root,
       plugins: ***,
       resolve: ***,
       css: ***,
       server: {
         https: false,
         host: true,
         port: VITE_PORT,
         // Load proxy configuration from .env
         proxy: createProxy(VITE_PROXY)
       }
       esbuild: ***
     }
   }
   ```

   

3. createProxy代理方法

   ```typescript
   import type { ProxyOptions } from 'vite'
   
   type ProxyItem = [string, string]
   
   type ProxyList = ProxyItem[]
   
   type ProxyTargetList = Record<string, ProxyOptions>
   
   const httpsRE = /^https:\/\//
   
   export function createProxy(list: ProxyList = []) {
     const ret: ProxyTargetList = {}
     
     for(const [prefix, target] of list) {
       const isHttps = httpsRE.test(target)
   
       ret[prefix] = [
         target: target,
         changeOrigin: true,
         // ws: true,
         rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
         // https is require secure=false
         ...(isHttps ? { secure: false } : {})
       ]
     }
     
     return ret
   }
   
   /**生成格式如下
     {
       target: 'http://***,
       changeOrigin: true,
       rewrite: (path) => path.replace(new RegExp(`new RegExp(`^${prefix}`)`, ''))
       ...(isHttps ? { secure: false } : {})
     }
   */
   ```