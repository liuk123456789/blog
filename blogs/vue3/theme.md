---
title: element plus 自定义主题
date: 2022-12-28
categories: 
 - Vue
tags:
 - ui theme
sidebar: auto
---

### 1. 安装相关依赖

```powershell
npm i sass sass-loader -D
```

### 2. 新建一个index.scss

```css
@forward 'element-plus/theme-chalk/src/common/var.scss' with (
    $colors: (
    	'primary': (
    		'base': rgb(24,217,243)
    	)
    )
)
    
//@forward "url" as prefix 为URL调用增加前缀
//@forward "url" with (...) 给URL所指向文件传递参数
//@forward "url" as prefix with (...)

// 导入所有样式 如果不进行按需加载方案
@use "element-plus/theme-chalk/src/index.scss" as *;
```

### 3. 引入全部样式（不推荐）

```typescript
import './assets/styles/element/index.scss'
```

### 4. 按需加载引入组件&对应样式

1. 安装对应的依赖

   ```powershell
   npm i -D unplugin-vue-components unplugin-auto-import
   ```

2. 配置vite.config.ts

   ```typescript
   import AutoImport from 'unplugin-auto-import/vite'
   
   import Components from 'unplugin-vue-components/vite'
   
   import { ElementPlusResolver } from 'unplugin-vue-component/resolvers'
   
   export default defineConfig({
   	plugins: [
       AutoImport({
         resolvers: [ElementPlusResolver()],
       }),
       Components({
         resolvers: [ElementPlusResolver()],
       }),
     ]
   })
   ```

3. 将新建的index.scss作为全局注入

   ```typescript
   export default defineConfig({
   	return {
     	css: {
       	preprocessorOptions: {
         	scss: {
             additionalData: '@use "@/assets/styles/element/index.scss" as *;'
           }
         }
       }
     }
   })
   ```