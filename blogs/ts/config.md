---
title: TS 配置文件
date: 2023-03-17
categories: 
 - TypeScript
tags:
 - tsconfig
sidebar: auto
---

## 1. tsconfig.json的功能

作为TypeScript的配置文件，主要的功能的就是服务TypeScript执行编译时，执行对应的编译选项/编译配置等，有以下几个顶层属性构成

- compileOnSave
- compilerOptions
- exclude
- extends
- files
- include
- referenves
- typeAcquisition

## 2. tsconfig.json 配置项介绍

1. **compileOnSave**

   `compileOnSave`设置文件保存时自动编译，但需要编译器支持，默认值为false

2. **compilerOptions**

   TS的配置编译选项，也是日常开发中接触最多的，如果`compilerOptions`属性被忽略，则编译器会使用默认值，然后对应的属性也是非常多，下面列举一些常用的属性以及说明

   ```json
   {
     // ...
     "compilerOptions": {
       "incremental": true, // TS编译器在第一次编译之后会生成一个存储编译信息的文件，第二次编译会在第一次的基础上进行增量编译，可以提高编译的速度
       "tsBuildInfoFile": "./buildFile", // 增量编译文件的存储位置
       "diagnostics": true, // 打印诊断信息 
       "target": "ES5", // 目标语言的版本
       "module": "CommonJS", // 生成代码的模板标准
       "outFile": "./app.js", // 将多个相互依赖的文件生成一个文件，可以用在AMD模块中，即开启时应设置"module": "AMD",
       "lib": ["DOM", "ES2015", "ScriptHost", "ES2019.Array"], // TS需要引用的库，即声明文件，es5 默认引用dom、es5、scripthost,如需要使用es的高级版本特性，通常都需要配置，如es8的数组新特性需要引入"ES2019.Array",
       "allowJS": true, // 允许编译器编译JS，JSX文件
       "checkJs": true, // 允许在JS文件中报错，通常与allowJS一起使用
       "outDir": "./dist", // 指定输出目录
       "rootDir": "./", // 指定输出文件目录(用于输出)，用于控制输出目录结构
       "declaration": true, // 生成声明文件，开启后会自动生成声明文件
       "declarationDir": "./file", // 指定生成声明文件存放目录
       "emitDeclarationOnly": true, // 只生成声明文件，而不会生成js文件
       "sourceMap": true, // 生成目标文件的sourceMap文件
       "inlineSourceMap": true, // 生成目标文件的inline SourceMap，inline SourceMap会包含在生成的js文件中
       "declarationMap": true, // 为声明文件生成sourceMap
       "typeRoots": [], // 声明文件目录，默认时node_modules/@types
       "types": [], // 加载的声明文件包
       "removeComments":true, // 删除注释 
       "noEmit": true, // 不输出文件,即编译后不会生成任何js文件
       "noEmitOnError": true, // 发送错误时不输出任何文件
       "noEmitHelpers": true, // 不生成helper函数，减小体积，需要额外安装，常配合importHelpers一起使用
       "importHelpers": true, // 通过tslib引入helper函数，文件必须是模块
       "downlevelIteration": true, // 降级遍历器实现，如果目标源是es3/5，那么遍历器会有降级的实现
       "strict": true, // 开启所有严格的类型检查
       "alwaysStrict": true, // 在代码中注入'use strict'
       "noImplicitAny": true, // 不允许隐式的any类型
       "strictNullChecks": true, // 不允许把null、undefined赋值给其他类型的变量
       "strictFunctionTypes": true, // 不允许函数参数双向协变
       "strictPropertyInitialization": true, // 类的实例属性必须初始化
       "strictBindCallApply": true, // 严格的bind/call/apply检查
       "noImplicitThis": true, // 不允许this有隐式的any类型
       "noUnusedLocals": true, // 检查只声明、未使用的局部变量(只提示不报错)
       "noUnusedParameters": true, // 检查未使用的函数参数(只提示不报错)
       "noFallthroughCasesInSwitch": true, // 防止switch语句贯穿(即如果没有break语句后面不会执行)
       "noImplicitReturns": true, //每个分支都会有返回值
       "esModuleInterop": true, // 允许export=导出，由import from 导入
       "allowUmdGlobalAccess": true, // 允许在模块中全局变量的方式访问umd模块
       "moduleResolution": "node", // 模块解析策略，ts默认用node的解析策略，即相对的方式导入
       "baseUrl": "./", // 解析非相对模块的基础地址，默认是当前目录
       "paths": { // 路径映射，相对于baseUrl
         // 如使用jq时不想使用默认版本，而需要手动指定版本，可进行如下配置
         "jquery": ["node_modules/jquery/dist/jquery.min.js"]
       },
       "rootDirs": ["src","out"], // 将多个目录放在一个虚拟目录下，用于运行时，即编译后引入文件的位置可能发生变化，这也设置可以虚拟src和out在同一个目录下，不用再去改变路径也不会报错
       "listEmittedFiles": true, // 打印输出文件
       "listFiles": true// 打印编译的文件(包括引用的声明文件)
     }
   }
   ```

3. **exclude**

   `exclude`属性作用是指定编译器需要排除的文件/文件夹

   默认排除`node_modules`文件夹下文件

   ```json
   {
       // ...
       "exclude": [
           "src/lib" // 排除src目录下的lib
       ]
   }
   ```

   和`include`属性相似，支持通配符

   - `*` 匹配0或多个字符（不包括目录分隔符）
   - `?` 匹配一个任意字符（不包括目录分隔符）
   - `**/` 递归匹配任意子目录

4. **extends**

   `extends`引入其他的`tsconfig`的json配置文件，当前的配置继承引入配置，如

   ```json
   {
       // ...
       "extends": "./tsconfig.common.json"
   }
   ```

5. **files**

   `files` 属性作用是**指定需要编译的单个文件列表**。
   默认是包含当前目录和子目录下所有 TypeScript 文件。

   ```json
   {
       // ...
       "files": [
           // 指定编译文件时src目录下的leo.ts文件
           "src/leo.ts"
       ]
   }
   ```

6. **include**

   `include`属性作用是指定编译需要编译的文件

   ```json
   {
       "include": [
           "src/**/*.ts",
           "src/**/*.d.ts",
           "src/**/*.tsx",
           "src/**/*.vue",
           "vite.config.*",
           "vitest.config.*",
           "cypress.config.*",
           "types/**/*.d.ts",
           "types/**/*.ts",
           "build/**/*.ts",
           "build/**/*.d.ts",
           "mock/**/*.ts"
        ]
   }
   ```

7. **references**

   `references`属性作用是指定工程引用依赖

   在项目开发中，有时候我们为了方便将前端项目和后端`node`项目放在同一个目录下开发，两个项目依赖同一个配置文件和通用文件，但我们希望前后端项目进行灵活的分别打包，那么我们可以进行如下配置：

   ```json
   {
   	// ...
     "references": [ // 指定依赖的工程
        {"path": "./common"}
     ]
   }
   ```

8. **typeAcquisition**

   `typeAcquisition` 属性作用是**设置自动引入库类型定义文件(.d.ts)相关。**

   包含 3 个子属性：

   - `enable` : 布尔类型，是否开启自动引入库类型定义文件(.d.ts)，默认为 false；
   - `include` : 数组类型，允许自动引入的库名，如：[,“lodash”]；
   - `exculde` : 数组类型，排除的库名。

   ```json
   {
   	// ...
     "typeAcquisition": {
       "enable": false,
       "exclude": ["lodash"],
       "include": ["jest"]
     }
   }
   ```

## 3. vite + vue3 + ts的tsconfig的配置

```json
{
  "compilerOptions": {
    "types": ["vite/client"], // 用于import.meta.***
    "target": "esnext",
    "module": "esnext",
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
  "plugins": [
    {
      "name": "@vuedx/typescript-plugin-vue"
    }
  ],
  "include": [
    "src/**/*.ts",
    "src/**/*.d.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "vite.config.*",
    "vitest.config.*",
    "cypress.config.*",
    "types/**/*.d.ts",
    "types/**/*.ts",
    "build/**/*.ts",
    "build/**/*.d.ts",
    "mock/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.js"
  ]
}
```