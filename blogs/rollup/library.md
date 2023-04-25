---
title: Rollup 打包实践
date: 2023-04-14
categories: 
 - Rollup 
tags:
 - Rollup library
sidebar: auto
---

## 1. 使用rollup打包工具库

通过上次`rollup`的基本使用，这次我们通过`rollup`打包一个工具库，并发布到`npm`上

> 推荐
> node 版本：16.18.0

## 2. 使用步骤

1. `npm init -y`生成`package.json`文件，修改下里面的信息如下

   ```json
   {
     "name": "@liuk123456789/util",
     "type": "module", // esm
     "version": "0.0.1",
     "description": "This is a test",
     "main": "dist/index.cjs",
     "module": "dist/index.mjs",
     "types": "index.d.ts",
     "files": [
       "dist",
       "*.d.ts"
     ],
     "scripts": {
       "build": "rollup -c"
     },
     "exports": {
       ".": {
         "types": "./index.d.ts",
         "require": "./dist/index.cjs",
         "import": "./dist/index.mjs"
       }
     },
     "keywords": [
       "utils"
     ],
     "author": "liuk123456789 <liuer5194@gmail.com>",
     "license": "MIT",
     "repository": {
       "type": "git",
       "url": "git+https://github.com/liuk123456789/utils.git"
     },
     "bugs": {
       "url": "https://github.com/liuk123456789/utils/issues"
     },
     "homepage": "https://github.com/liuk123456789/utils#readme",
   }
   ```

2. 安装相关依赖

   ```shell
   npm i rollup @antfu/eslint-config eslint typescript@4.9.3 -D
   ```

3. 配置`eslint`

   `.eslintrc`

   ```json
   {
     "extends": "@antfu",
     "rules": {
       "@typescript-eslint/ban-ts-comment": "off",
       "@typescript-eslint/prefer-ts-expect-error": "off"
     }
   }
   ```

   `.eslintignore`

   ```json
   dist
   node_modules
   *.d.ts
   ```

4. `rollup.config.js`配置

   ```javascript
   const entries = ['src/index.ts']
   
   // 因为是多入口，需要打包cjs/mjs & .d.ts 的 bundle，所以这里使用数组
   export default [
       ...entries.map(input => ({
           input,
           output: [
               {
                   file: input.replace('src/', 'dist/').replace('.ts', '.mjs'),
                   format: 'esm'
               },
               {
                   file: input.replace('src/', 'dist/').replace('.ts', '.cjs'),
                   format: 'cjs'           
               }
           ],
           external: [],
           plugins
       })),
         ...entries.map(input => ({
       input,
       output: {
         file: input.replace('src/', '').replace('.ts', '.d.ts'),
         format: 'esm',
       },
       external: []
     })),
   ]
   ```

5. 配置脚本

   ```json
   {
       "scripts": {
           "build": "rollup -c"
       }
   }
   ```

6.  安装兼容性包`@rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-json`

   `@rollup/plugin-node-resolve @rollup/plugin-commonjs`搭配使用是因为`rollup`遵循`esmodule`规范，而引入`node_modules`中的包，存在无法解析的问题，所以进行这两个包非常通用

   `@rollup/plugin-json`使`rollup`支持`json`导入

   ```shell
   npm i @rollup/plugin-node-resolve @rollup/plugin-commonjs @rollup/plugin-json -D
   ```

7. 修改下`rollup.config.js`

   ```javascript
   import resolve from '@rollup/plugin-node-resolve'
   import commonjs from '@rollup/plugin-commonjs'
   import json from '@rollup/plugin-json'
   
   const entries = ['src/index.ts']
   
   const plugins = [
     resolve({
       preferBuiltins: true,
     }),
     json(),
     commonjs(),
   ]
   
   // 因为是多入口，需要打包cjs/mjs & .d.ts 的 bundle，所以这里使用数组
   export default [
       ...entries.map(input => ({
           input,
           output: [
               {
                   file: input.replace('src/', 'dist/').replace('.ts', '.mjs'),
                   format: 'esm'
               },
               {
                   file: input.replace('src/', 'dist/').replace('.ts', '.cjs'),
                   format: 'cjs'           
               }
           ],
           external: [],
           plugins
       })),
         ...entries.map(input => ({
       input,
       output: {
         file: input.replace('src/', '').replace('.ts', '.d.ts'),
         format: 'esm',
       },
       external: []
     })),
   ]
   ```

8. 新建`src`目录

   `index.ts`

   ```typescript
   export * from './base'
   export * from './is'
   ```

   `is.ts`

   ```typescript
   import { toString } from './base'
   
   export function isDef<T = any>(val?: T): val is T {
     return typeof val !== 'undefined'
   }
   export function isBoolean(val: any): val is boolean {
     return typeof val === 'boolean'
   }
   export function isFunction<T extends Function>(val: any): val is T {
     return typeof val === 'function'
   }
   export function isNumber(val: any): val is number {
     return typeof val === 'number'
   }
   export function isString(val: unknown): val is string {
     return typeof val === 'string'
   }
   export function isObject(val: any): val is object {
     return toString(val) === '[object Object]'
   }
   export function isUndefined(val: any): val is undefined {
     return toString(val) === '[object Undefined]'
   }
   export function isNull(val: any): val is null {
     return toString(val) === '[object Null]'
   }
   export function isRegExp(val: any): val is RegExp {
     return toString(val) === '[object RegExp]'
   }
   export function isDate(val: any): val is Date {
     return toString(val) === '[object Date]'
   }
   
   // @ts-ignore
   export function isWindow(val: any): boolean {
     return typeof window !== 'undefined' && toString(val) === '[object Window]'
   }
   // @ts-ignore
   export const isBrowser = typeof window !== 'undefined'
   ```

   `base.ts`

   ```typescript
   export function assert(condition: boolean,
     message: string): asserts condition {
     if (!condition)
       throw new Error(message)
   }
   export function toString(v: any) {
     return Object.prototype.toString.call(v)
   }
   export function getTypeName(v: any) {
     if (v === null)
       return 'null'
     const type = toString(v).slice(8, -1).toLowerCase()
     return ['object', 'function'].includes(typeof v) ? type : typeof v
   }
   export function noop() {}
   ```

   `string.ts`

   ```typescript
   /**
    * Replace backslash to slash
    *
    * @category String
    */
   export function slash(str: string) {
     return str.replace(/\\/g, '/')
   }
   
   /**
    * Ensure prefix of a string
    *
    * @category String
    */
   export function ensurePrefix(prefix: string, str: string) {
     if (!str.startsWith(prefix))
       return prefix + str
     return str
   }
   
   /**
    * Ensure suffix of a string
    *
    * @category String
    */
   export function ensureSuffix(suffix: string, str: string) {
     if (!str.endsWith(suffix))
       return str + suffix
     return str
   }
   
   /**
    * Dead simple template engine, just like Python's `.format()`
    *
    * @category String
    * @example
    * ```
    * const result = template(
    *   'Hello {0}! My name is {1}.',
    *   'Inès',
    *   'Anthony'
    * ) // Hello Inès! My name is Anthony.
    * ```
    */
   export function template(str: string, ...args: any[]): string {
     return str.replace(/{(\d+)}/g, (match, key) => {
       const index = Number(key)
       if (Number.isNaN(index))
         return match
       return args[index]
     })
   }
   
   // port from nanoid
   // https://github.com/ai/nanoid
   const urlAlphabet
       = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict'
   /**
    * Generate a random string
    * @category String
    */
   export function randomStr(size = 16, dict = urlAlphabet) {
     let id = ''
     let i = size
     const len = dict.length
     while (i--) id += dict[(Math.random() * len) | 0]
     return id
   }
   
   /**
    * First letter uppercase, other lowercase
    * @category string
    * @example
    * ```
    * capitalize('hello') => 'Hello'
    * ```
    */
   export function capitalize(str: string): string {
     return str[0].toUpperCase() + str.slice(1).toLowerCase()
   }
   ```

   `types.ts`

   ```typescript
   /**
    * Promise, or maybe not
    */
   export type Awaitable<T> = T | PromiseLike<T>
   
   /**
    * Null or whatever
    */
   export type Nullable<T> = T | null | undefined
   
   /**
    * Array, or not yet
    */
   export type Arrayable<T> = T | Array<T>
   
   /**
    * Function
    */
   export type Fn<T = void> = () => T
   
   /**
    * Constructor
    */
   export type Constructor<T = void> = new (...args: any[]) => T
   
   /**
    * Infers the element type of an array
    */
   export type ElementOf<T> = T extends (infer E)[] ? E : never
   
   /**
    * Defines an intersection type of all union items.
    *
    * @param U Union of any types that will be intersected.
    * @returns U items intersected
    * @see https://stackoverflow.com/a/50375286/9259330
    */
   export type UnionToIntersection<U> = (
     U extends unknown ? (k: U) => void : never
   ) extends (k: infer I) => void
     ? I
     : never
   
   /**
    * Infers the arguments type of a function
    */
   export type ArgumentsType<T> = T extends (...args: infer A) => any ? A : never
   
   export type MergeInsertions<T> = T extends object
     ? { [K in keyof T]: MergeInsertions<T[K]> }
     : T
   
   export type DeepMerge<F, S> = MergeInsertions<{
     [K in keyof F | keyof S]: K extends keyof S & keyof F
       ? DeepMerge<F[K], S[K]>
       : K extends keyof S
         ? S[K]
         : K extends keyof F
           ? F[K]
           : never;
   }>
   ```

9. 打包看下

   ```shell
   npm run build
   ```

   可以看到报错了，报错信息如下

   ```
   src/index.ts → dist/index.mjs, dist/index.cjs...
   [!] RollupError: Could not resolve "./base" from "src/index.ts"
   src/index.ts
       at error (E:\rollup\utils\node_modules\rollup\dist\shared\rollup.js:274:30)
       at ModuleLoader.handleInvalidResolvedId (E:\rollup\utils\node_modules\rollup\dist\shared\rollup.js:24280:24)
       at E:\rollup\utils\node_modules\rollup\dist\shared\rollup.js:24242:26
   ```

10. 可以看到，解析不了`typescript`

    所以需要装个插件`rollup-plugin-esbuild `解析`typescript`

    ```shell
    npm i rollup-plugin-esbuild -D
    ```

    `roll.config.js`

    ```javascript
    import resolve from '@rollup/plugin-node-resolve'
    import commonjs from '@rollup/plugin-commonjs'
    import json from '@rollup/plugin-json'
    
    import esbuild from 'rollup-plugin-esbuild'
    
    const entries = ['src/index.ts']
    
    const plugins = [
      resolve({
        preferBuiltins: true,
      }),
      json(),
      commonjs(),
      esbuild({
          target: 'node14' // 因为其中的插件基本都需要node14+。所以这里配置下node的版本
      })
    ]
    
    // 因为是多入口，需要打包cjs/mjs & .d.ts 的 bundle，所以这里使用数组
    export default [
        ...entries.map(input => ({
            input,
            output: [
                {
                    file: input.replace('src/', 'dist/').replace('.ts', '.mjs'),
                    format: 'esm'
                },
                {
                    file: input.replace('src/', 'dist/').replace('.ts', '.cjs'),
                    format: 'cjs'           
                }
            ],
            external: [],
            plugins
        })),
          ...entries.map(input => ({
        input,
        output: {
          file: input.replace('src/', '').replace('.ts', '.d.ts'),
          format: 'esm',
        },
        external: []
      })),
    ]
    ```

    

    还是报错，报错信息如下

    ```
    src/index.ts → index.d.ts...
    [!] RollupError: Could not resolve "./base" from "src/index.ts"
    src/index.ts
        at error (E:\rollup\utils\node_modules\rollup\dist\shared\rollup.js:274:30)
        at ModuleLoader.handleInvalidResolvedId (E:\rollup\utils\node_modules\rollup\dist\shared\rollup.js:24280:24)
        at E:\rollup\utils\node_modules\rollup\dist\shared\rollup.js:24242:26
    ```

11. 所以我们还需要转个插件，用于生成`.d.ts`文件

    ```shell
    npm i rollup-plugin-dts
    ```

    `rollup.config.js`

    ```javascript
    import resolve from '@rollup/plugin-node-resolve'
    import commonjs from '@rollup/plugin-commonjs'
    import json from '@rollup/plugin-json'
    
    import esbuild from 'rollup-plugin-esbuild'
    import dts from 'rollup-plugin-dts'
    
    const entries = ['src/index.ts']
    
    const plugins = [
      resolve({
        preferBuiltins: true,
      }),
      json(),
      commonjs(),
      esbuild({
          target: 'node14' // 因为其中的插件基本都需要node14+。所以这里配置下node的版本
      })
    ]
    
    // 因为是多入口，需要打包cjs/mjs & .d.ts 的 bundle，所以这里使用数组
    export default [
        ...entries.map(input => ({
            input,
            output: [
                {
                    file: input.replace('src/', 'dist/').replace('.ts', '.mjs'),
                    format: 'esm'
                },
                {
                    file: input.replace('src/', 'dist/').replace('.ts', '.cjs'),
                    format: 'cjs'           
                }
            ],
            external: [],
            plugins
        })),
          ...entries.map(input => ({
        input,
        output: {
          file: input.replace('src/', '').replace('.ts', '.d.ts'),
          format: 'esm',
        },
        external: [],
        plugins:[
            dts({ respectExternal: true }) // 排除external的配置
        ]
      })),
    ]
    ```

12. 打包成功

    生成文件如下

    `index.mjs`

    ```javascript
    function assert(condition, message) {
      if (!condition)
        throw new Error(message);
    }
    function toString(v) {
      return Object.prototype.toString.call(v);
    }
    function getTypeName(v) {
      if (v === null)
        return "null";
      const type = toString(v).slice(8, -1).toLowerCase();
      return ["object", "function"].includes(typeof v) ? type : typeof v;
    }
    function noop() {
    }
    
    function isDef(val) {
      return typeof val !== "undefined";
    }
    function isBoolean(val) {
      return typeof val === "boolean";
    }
    function isFunction(val) {
      return typeof val === "function";
    }
    function isNumber(val) {
      return typeof val === "number";
    }
    function isString(val) {
      return typeof val === "string";
    }
    function isObject(val) {
      return toString(val) === "[object Object]";
    }
    function isUndefined(val) {
      return toString(val) === "[object Undefined]";
    }
    function isNull(val) {
      return toString(val) === "[object Null]";
    }
    function isRegExp(val) {
      return toString(val) === "[object RegExp]";
    }
    function isDate(val) {
      return toString(val) === "[object Date]";
    }
    function isWindow(val) {
      return typeof window !== "undefined" && toString(val) === "[object Window]";
    }
    const isBrowser = typeof window !== "undefined";
    
    export { assert, getTypeName, isBoolean, isBrowser, isDate, isDef, isFunction, isNull, isNumber, isObject, isRegExp, isString, isUndefined, isWindow, noop, toString };
    ```

    `index.cjs`

    ```javascript
    'use strict';
    
    function assert(condition, message) {
      if (!condition)
        throw new Error(message);
    }
    function toString(v) {
      return Object.prototype.toString.call(v);
    }
    function getTypeName(v) {
      if (v === null)
        return "null";
      const type = toString(v).slice(8, -1).toLowerCase();
      return ["object", "function"].includes(typeof v) ? type : typeof v;
    }
    function noop() {
    }
    
    function isDef(val) {
      return typeof val !== "undefined";
    }
    function isBoolean(val) {
      return typeof val === "boolean";
    }
    function isFunction(val) {
      return typeof val === "function";
    }
    function isNumber(val) {
      return typeof val === "number";
    }
    function isString(val) {
      return typeof val === "string";
    }
    function isObject(val) {
      return toString(val) === "[object Object]";
    }
    function isUndefined(val) {
      return toString(val) === "[object Undefined]";
    }
    function isNull(val) {
      return toString(val) === "[object Null]";
    }
    function isRegExp(val) {
      return toString(val) === "[object RegExp]";
    }
    function isDate(val) {
      return toString(val) === "[object Date]";
    }
    function isWindow(val) {
      return typeof window !== "undefined" && toString(val) === "[object Window]";
    }
    const isBrowser = typeof window !== "undefined";
    
    exports.assert = assert;
    exports.getTypeName = getTypeName;
    exports.isBoolean = isBoolean;
    exports.isBrowser = isBrowser;
    exports.isDate = isDate;
    exports.isDef = isDef;
    exports.isFunction = isFunction;
    exports.isNull = isNull;
    exports.isNumber = isNumber;
    exports.isObject = isObject;
    exports.isRegExp = isRegExp;
    exports.isString = isString;
    exports.isUndefined = isUndefined;
    exports.isWindow = isWindow;
    exports.noop = noop;
    exports.toString = toString;
    ```

    `index.d.ts`

    ```typescript
    declare function assert(condition: boolean, message: string): asserts condition;
    declare function toString(v: any): any;
    declare function getTypeName(v: any): any;
    declare function noop(): void;
    
    declare function isDef<T = any>(val?: T): val is T;
    declare function isBoolean(val: any): val is boolean;
    declare function isFunction<T extends Function>(val: any): val is T;
    declare function isNumber(val: any): val is number;
    declare function isString(val: unknown): val is string;
    declare function isObject(val: any): val is object;
    declare function isUndefined(val: any): val is undefined;
    declare function isNull(val: any): val is null;
    declare function isRegExp(val: any): val is RegExp;
    declare function isDate(val: any): val is Date;
    declare function isWindow(val: any): boolean;
    declare const isBrowser: boolean;
    
    export { assert, getTypeName, isBoolean, isBrowser, isDate, isDef, isFunction, isNull, isNumber, isObject, isRegExp, isString, isUndefined, isWindow, noop, toString };
    ```

## 3. 修改下package.json

```json
{
  "name": "@liuk123456789/k_util",
  "type": "module", // 在 node 支持 ES 模块后，要求 ES 模块采用 .mjs 后缀文件名。只要遇到 .mjs 文件，就认为它是 ES 模块。如果不想修改文件后缀，就可以在 package.json文件中，指定 type 字段为 module。
  "version": "0.0.6",
  "description": "This is a test",
  "main": "dist/index.cjs", // cjs 规范 程序入口
  "module": "dist/index.mjs", // esm 规范 入口
  "types": "index.d.ts", // 定义类型声明入口文件
  // 发布文件的配置
  "files": [
    "dist", // dist 目录
    "*.d.ts" // ts声明文件
  ],
  // node 在 14.13 支持在 package.json 里定义 exports 字段，拥有了条件导出的功能。
 //  exports 字段可以配置不同环境对应的模块入口文件，并且当它存在时，它的优先级最高。
  "exports": {
    ".": {
      "types": "./index.d.ts",
      "require": "./dist/index.cjs",
      "import": "./dist/index.mjs"
    }
  },
  "scripts": {
    "build": "rollup -c",
    "dev": "nr build --watch",
    "lint": "eslint .",
    "prepublishOnly": "npm run build",
    "release": "bumpp --commit --push --tag && npm publish --acess public"
  },
  "keywords": [
    "utils"
  ],
  "author": "liuk123456789 <liuer5194@gmail.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/liuk123456789/utils.git"
  },
  "bugs": {
    "url": "https://github.com/liuk123456789/utils/issues"
  },
  "homepage": "https://github.com/liuk123456789/utils#readme",
  "devDependencies": {
    "@antfu/eslint-config": "^0.38.4",
    "@rollup/plugin-alias": "^5.0.0",
    "@rollup/plugin-commonjs": "^24.1.0",
    "@rollup/plugin-json": "^6.0.0",
    "@rollup/plugin-node-resolve": "^15.0.2",
    "bumpp": "^9.1.0",
    "eslint": "^8.38.0",
    "rollup": "^3.20.2",
    "rollup-plugin-dts": "^5.3.0",
    "rollup-plugin-esbuild": "^5.0.0",
    "typescript": "^4.9.3"
  }
}

```

## 4. npm 发包

> 发布包之前使用npm login 登录下，然后使用npm publish 发布，也可以安装[bumpp](https://www.npmjs.com/package/bumpp)完成发布

使用`bumpp`发布可以配置脚本

```json
"scripts": {
    release: "bumpp --commit --push --tag && npm publish --access public"
}
```

