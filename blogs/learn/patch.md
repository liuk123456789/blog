---
title: patch
date: 2022-12-30
categories: 
 - 日常整理
tags:
 - patch
sidebar: auto
---

### 1. 前言

项目中使用的包出现问题，提了issue，但是开源作者无发版/patch计划，我们项目急着上线，那么这时候我们可以通过patch-package对源码打补丁方式进行应急

### 2. 如何使用

1. 安装patch-package

   ```powershell
   npm i patch-package postinstall-postinstall --save-dev
   
   or
   
   yarn add patch-package postinstall-postinstall
   ```

   

2. 修改package.json文件

   package.json的scripts中声明了一系列的npm脚本命令，如下：（参考资料：[http://caibaojian.com/npm/misc/scripts.html](https://link.zhihu.com/?target=http%3A//caibaojian.com/npm/misc/scripts.html)）

   - prepublish: 在包发布之前运行，也会在npm install安装到本地时运行
   - publish,postpublish: 包被发布之后运行
   - preinstall: 包被安装前运行
   - install,postinstall: 包被安装后运行
   - preuninstall,uninstall: 包被卸载前运行
   - postuninstall: 包被卸载后运行
   - preversion: bump包版本前运行
   - postversion: bump包版本后运行
   - pretest,test,posttest: 通过npm test命令运行
   - prestop,stop,poststop: 通过npm stop命令运行
   - prestart,start,poststart: 通过npm start命令运行
   - prerestart,restart,postrestart: 通过npm restart运行

   可以看到依赖包在安装完之后会执行postinstall命令

   所以我们在package.json的scripts里面增加："postinstall": "patch-package"

   ```json
   "scripts": {
      ***
      "postinstall": "patch-package"
   }
   ```

   

3. 修改依赖包源码

   ```javascript
   const presetsCDN = {
       'mdi': 'https://www.unpkg.com/@mdi/font@6.6.96/css/materialdesignicons.min.css',
       'md': 'https://fonts.googleapis.com/css?family=Material+Icons',
       'fa': 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@latest/css/all.min.css',
       'fa4': 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'
   };
   ```

   

4. 生成补丁

   ```powershell
   yarn patch-package package-name(修改的包名）
   
   or
   
   npx patch-package package-name(修改的包名)
   ```

   

5. 生成补丁文件

   ```javascript
   diff --git a/node_modules/@nuxtjs/vuetify/dist/icons.js b/node_modules/@nuxtjs/vuetify/dist/icons.js
   index 913b185..67e3a7d 100644
   --- a/node_modules/@nuxtjs/vuetify/dist/icons.js
   +++ b/node_modules/@nuxtjs/vuetify/dist/icons.js
   @@ -1,5 +1,5 @@
    const presetsCDN = {
   -    'mdi': 'https://cdn.jsdelivr.net/npm/@mdi/font@latest/css/materialdesignicons.min.css',
   +    'mdi': 'https://www.unpkg.com/@mdi/font@6.6.96/css/materialdesignicons.min.css',
        'md': 'https://fonts.googleapis.com/css?family=Material+Icons',
        'fa': 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@latest/css/all.min.css',
        'fa4': 'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'
   
   ```

### 3. 问题

1. 只针对于当前包版本执行补丁，如果升级包，那么无效
2. 当前版本包如果升级，那么补丁不会生效，除非个人永远不升级
3. 此方案用于应急场景，最有的解决方案还是在源代码上pull request