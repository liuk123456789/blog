---
title: vue-cli-第六篇
date: 2023-06-09
categories: 
 - 源码解读
tags:
 - vue-cli-第六篇
sidebar: auto
---

## 1. 说明

`vue build`和`vue serve`非常类似，`vue build`用于打包

## 2. 命令详情

```javascript
program
  .command('build')
  .description('alias of "npm run build" in the current project')
  .action((cmd) => {
    require('../lib/util/runNpmScript')('build', process.argv.slice(3))
  })
```

可以看到，依赖的还是`runNpmScript`脚本，最终执行的就是`npm run build`对应的就是`cli-service/bin/vue-cli-service`的脚本，调用的是`service.run`这个命令,然后在`resolvePlugins`时，会加载`commands/build/index.js`

## 3. TODO

因为`build`设计的东西比较，目前还没有完全梳理完
