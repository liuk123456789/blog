---
title: Rollup 基础用法
date: 2023-04-12
categories: 
 - Rollup 
tags:
 - Rollup basic
sidebar: auto
---

## 1. rollup简介

Rollup 是一个 JavaScript 模块打包工具，可以将多个小的代码片段编译为完整的库和应用。与传统的 CommonJS 和 AMD 这一类非标准化的解决方案不同，Rollup 使用的是 ES6 版本 Javascript 中的模块标准。新的 ES 模块可以让你自由、无缝地按需使用你最喜爱的库中那些有用的单个函数。这一特性在未来将随处可用，但 Rollup 让你现在就可以，想用就用。

## 2. rollup的常用选项说明

### **input**

类型：`string | string[] | { [entryName:string]:string }`

命令行参数： `-i/--input <filename>`

入口文件，值得注意的是如果使用数组/对象作为`input`的值，那么会被打包到独立的`chunks`,除非使用`output.file`选项，否则根据`ouput.entryFileNames`选项来确定，该选项值为对象形式时，对象的键将作为文件名中的 `[name]`，而对于值为数组形式，数组的值将作为入口的文件名。

#### **input几种类型的测试**

1. `string`

   `main.ts`

   ```typescript
   import type { Arrayable, Nullable } from './types'
   
   export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
     array = array ?? []
     return Array.isArray(array) ? array : [array]
   }
   
   /**
    * Convert `Arrayable<T>` to `Array<T>` and flatten it
    *
    * @category Array
    */
   export function flattenArrayable<T>(array?: Nullable<Arrayable<T | Array<T>>>): Array<T> {
     return toArray(array).flat(1) as Array<T>
   }
   ```

   `roll.config.js`配置

   ```typescript
   import resolve from '@rollup/plugin-node-resolve'
   import commonjs from '@rollup/plugin-commonjs'
   import json from '@rollup/plugin-json'
   
   import esbuild from 'rollup-plugin-esbuild'
   import clear from 'rollup-plugin-clear'
   
   export default {
     input: 'src/main.ts',
     output: {
       file: 'dist/index.mjs',
       format: 'esm',
     },
     external: [],
     plugins: [
       clear({
         target: ['dist/*'],
       }),
       resolve({
         preferBuiltins: true,
       }),
       json(),
       commonjs(),
       esbuild({
         target: 'node14',
       }),
     ],
   }
   ```

   `index.mjs`（生成`chunks`）

   ```typescript
   function toArray(array) {
     array = array ?? [];
     return Array.isArray(array) ? array : [array];
   }
   function flattenArrayable(array) {
     return toArray(array).flat(1);
   }
   
   export { flattenArrayable, toArray };
   ```

2. `string[]`

   `main.ts`

   ```typescript
   import type { Arrayable, Nullable } from './types'
   
   export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
     array = array ?? []
     return Array.isArray(array) ? array : [array]
   }
   
   /**
    * Convert `Arrayable<T>` to `Array<T>` and flatten it
    *
    * @category Array
    */
   export function flattenArrayable<T>(array?: Nullable<Arrayable<T | Array<T>>>): Array<T> {
     return toArray(array).flat(1) as Array<T>
   }
   
   ```

   `app.ts`

   ```typescript
   import type { Arrayable, Nullable } from './types'
   
   export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
     array = array ?? []
     return Array.isArray(array) ? array : [array]
   }
   
   /**
    * Convert `Arrayable<T>` to `Array<T>` and flatten it
    *
    * @category Array
    */
   export function flattenArrayable<T>(
     array?: Nullable<Arrayable<T | Array<T>>>,
   ): Array<T> {
     return toArray(array).flat(1) as Array<T>
   }
   
   ```

   `rollup.config.js`

   ```javascript
   import resolve from '@rollup/plugin-node-resolve'
   import commonjs from '@rollup/plugin-commonjs'
   import json from '@rollup/plugin-json'
   
   import esbuild from 'rollup-plugin-esbuild'
   import clear from 'rollup-plugin-clear'
   
   export default {
     input: ['src/main.ts', 'src/app.ts'],
     output: {
       dir: 'dist',
       format: 'cjs',
     },
     external: [],
     plugins: [
       clear({
         target: ['dist/*'],
       }),
       resolve({
         preferBuiltins: true,
       }),
       json(),
       commonjs(),
       esbuild({
         target: 'node14',
       }),
     ],
   }
   ```

   打包产物

   `app.js`

   ```javascript
   'use strict';
   
   function toArray(array) {
     array = array ?? [];
     return Array.isArray(array) ? array : [array];
   }
   function flattenArrayable(array) {
     return toArray(array).flat(1);
   }
   
   exports.flattenArrayable = flattenArrayable;
   exports.toArray = toArray;
   
   ```

   `main.js`

   ```javascript
   'use strict';
   
   function toArray(array) {
     array = array ?? [];
     return Array.isArray(array) ? array : [array];
   }
   function flattenArrayable(array) {
     return toArray(array).flat(1);
   }
   
   exports.flattenArrayable = flattenArrayable;
   exports.toArray = toArray;
   ```

3. `{ [entryName:string]:string }`

   `main.ts`

   ```typescript
   import type { Arrayable, Nullable } from './types'
   
   export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
     array = array ?? []
     return Array.isArray(array) ? array : [array]
   }
   
   /**
    * Convert `Arrayable<T>` to `Array<T>` and flatten it
    *
    * @category Array
    */
   export function flattenArrayable<T>(array?: Nullable<Arrayable<T | Array<T>>>): Array<T> {
     return toArray(array).flat(1) as Array<T>
   }
   
   ```

   `app.ts`

   ```typescript
   import type { Arrayable, Nullable } from './types'
   
   export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
     array = array ?? []
     return Array.isArray(array) ? array : [array]
   }
   
   /**
    * Convert `Arrayable<T>` to `Array<T>` and flatten it
    *
    * @category Array
    */
   export function flattenArrayable<T>(
     array?: Nullable<Arrayable<T | Array<T>>>,
   ): Array<T> {
     return toArray(array).flat(1) as Array<T>
   }
   
   ```

   `rollup.config.js`

   ```javascript
   import resolve from '@rollup/plugin-node-resolve'
   import commonjs from '@rollup/plugin-commonjs'
   import json from '@rollup/plugin-json'
   
   import esbuild from 'rollup-plugin-esbuild'
   
   export default {
     input: {
       main: 'src/main.ts',
       app: 'src/app.ts',
     },
     output: {
       dir: 'dist',
       entryFileNames: 'bundle.[name].js',
       format: 'esm',
     },
     external: [],
     plugins: [
       resolve({
         preferBuiltins: true,
       }),
       json(),
       commonjs(),
       esbuild({
         target: 'node14',
       }),
     ],
   }
   
   ```

   打包产物

   `bundle.app.js`

   ```javascript
   function toArray(array) {
     array = array ?? [];
     return Array.isArray(array) ? array : [array];
   }
   function flattenArrayable(array) {
     return toArray(array).flat(1);
   }
   
   export { flattenArrayable, toArray };
   ```

   `bundle.main.js`

   ```javascript
   function toArray(array) {
     array = array ?? [];
     return Array.isArray(array) ? array : [array];
   }
   function flattenArrayable(array) {
     return toArray(array).flat(1);
   }
   
   export { flattenArrayable, toArray };
   ```

### **output**

#### **dir**

指定生成`chunk`的文件所在目录。如果存在多个`chunk`那么，此选项是必填的，比如上述的多入口打包

#### **file**

指定写入的文件名称，如果选项生效，会生成源码映射目录，只有单个`chunk`时，此选项才会生效，`input`为`string`类型的栗子便是

#### **format**

该选项用于指定生成 bundle 的格式。可以是以下之一：

- `amd` - 异步模块定义，适用于 RequireJS 等模块加载器
- `cjs` - CommonJS，适用于 Node 环境和其他打包工具（别名：`commonjs`）
- `es` - 将 bundle 保留为 ES 模块文件，适用于其他打包工具以及支持 `<script type=module>` 标签的浏览器（别名: `esm`，`module`）
- `iife` - 自执行函数，适用于 `<script>` 标签。（如果你要为你的应用创建 bundle，那么你很可能用它。）
- `umd` - 通用模块定义，生成的包同时支持 `amd`、`cjs` 和 `iife` 三种格式
- `system` - SystemJS 模块加载器的原生格式（别名: `systemjs`）

#### **globals**

用于`format`设置为`umd`和`iife`场景，通常搭配`external`来标记外部依赖，如下

`app.ts`

```typescript
import _ from 'lodash'
import type { Arrayable, Nullable } from './types'

export function toArray<T>(array?: Nullable<Arrayable<T>>): Array<T> {
  array = array ?? []
  return Array.isArray(array) ? array : [array]
}

/**
 * Convert `Arrayable<T>` to `Array<T>` and flatten it
 *
 * @category Array
 */
export function flattenArrayable<T>(
  array?: Nullable<Arrayable<T | Array<T>>>,
): Array<T> {
  return toArray(array).flat(1) as Array<T>
}

export function get() {
  return _.countBy(['one', 'two', 'three'], 'length')
}
```

`roll.config.js`

```typescript
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

import esbuild from 'rollup-plugin-esbuild'

import terser from '@rollup/plugin-terser'

export default {
  input: 'src/app.ts',
  output: {
    dir: 'dist',
    chunkFileNames: '[name]-[hash:8].js',
    name: 'kUtils',
    format: 'iife',
    globals: {
      lodash: '_',
    },
  },
  external: ['lodash'],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    json(),
    commonjs(),
    esbuild({
      target: 'node14',
    }),
    terser(),
  ],
}
```

打包产物如下

使用了`@rollup/plugin-terser`进行了压缩

`app.js`

```javascript
var kUtils=function(t,r){"use strict";function n(t){return t=t??[],Array.isArray(t)?t:[t]}return t.flattenArrayable=function(t){return n(t).flat(1)},t.get=function(){return r.countBy(["one","two","three"],"length")},t.toArray=n,t}({},_);
```

#### **name**

想要使用全局变量名来表示你的 bundle 时，输出格式必须指定为 `iife` 或 `umd`。同一个页面上的其他脚本可以通过这个变量名来访问你的 bundle 导出。栗子就是上个栗子

#### **plugins**

作用输出的插件，如下

`rollup.config.js`

```javascript
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'

import esbuild from 'rollup-plugin-esbuild'

import terser from '@rollup/plugin-terser'

export default {
  input: 'src/app.ts',
  output: [{
    file: 'dist/app.min.js',
    format: 'iife',
    name: 'knUtils',
    globals: {
      lodash: '_',
    },
    plugins: [terser()],
  }, {
    file: 'dist/app.js',
    name: 'knUtils',
    globals: {
      lodash: '_',
    },
  }],
  external: ['lodash'],
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    json(),
    commonjs(),
    esbuild({
      target: 'node14',
    }),
  ],
}
```

如上，我们对其中`app.min.js`的打包产物进行压缩处理，打包结果如下

`app.js`

```javascript
import _ from 'lodash';

function toArray(array) {
  array = array ?? [];
  return Array.isArray(array) ? array : [array];
}
function flattenArrayable(array) {
  return toArray(array).flat(1);
}
function get() {
  return _.countBy(["one", "two", "three"], "length");
}

export { flattenArrayable, get, toArray };
```

`app.min.js`

```javascript
var knUtils=function(t,r){"use strict";function n(t){return t=t??[],Array.isArray(t)?t:[t]}return t.flattenArrayable=function(t){return n(t).flat(1)},t.get=function(){return r.countBy(["one","two","three"],"length")},t.toArray=n,t}({},_);
```

#### **assetFileNames**

该选项用于自定义构建结果中的静态文件名称。它支持以下占位符：

- `[extname]`：包含点的静态文件扩展名，例如：`.css`。
- `[ext]`：不包含点的文件扩展名，例如：`css`。
- `[hash]`：基于静态文件的名称和内容的哈希。
- `[name]`：静态文件的名称，不包含扩展名。

正斜杆 `/` 可以用来划分文件到子目录。又见 [`output.chunkFileNames`](https://www.rollupjs.com/guide/big-list-of-options#outputchunkfilenames), [`output.entryFileNames`](https://www.rollupjs.com/guide/big-list-of-options#outputentryfilenames)。

#### **chunkFileNames**

类型：`string`
命令行参数：`--chunkFileNames <pattern>`
默认值：`"[name]-[hash].js"`

该选项用于对代码分割中产生的 chunk 文件自定义命名。它支持以下形式：

- `[format]`：输出（output）选项中定义的 `format` 的值，例如：`es` 或 `cjs`。
- `[hash]`：哈希值，由 chunk 文件本身的内容和所有它依赖的文件的内容共同组成。
- `[name]`：chunk 的名字。它可以通过 [`output.manualChunks`](https://www.rollupjs.com/guide/big-list-of-options#outputmanualchunks) 显示设置，或者通过插件调用 [`this.emitFile`](https://www.rollupjs.com/guide/big-list-of-options#thisemitfileemittedfile-emittedchunk--emittedasset--string) 设置。如果没有做任何设置，它将会根据 chunk 的内容来确定。

正斜杆 `/` 可以用来划分 chunk 文件到子目录。又见 [`output.assetFileNames`](https://www.rollupjs.com/guide/big-list-of-options#outputassetfilenames), [`output.entryFileNames`](https://www.rollupjs.com/guide/big-list-of-options#outputentryfilenames)。

#### **entryFileNames**

类型：`string`
命令行参数：`--entryFileNames <pattern>`
默认值：`"[name].js"`

该选项用于指定 chunks 的入口文件名。支持以下形式：

- `[format]`：输出（output）选项中定义的 `format` 的值，例如：`es` 或 `cjs`。
- `[hash]`：哈希值，由入口文件本身的内容和所有它依赖的文件的内容共同组成。
- `[name]`：入口文件的文件名（不包含扩展名），当入口文件（entry）定义为对象时，它的值时对象的键。

正斜杆 `/` 可以用来划分文件到子目录。又见 [`output.assetFileNames`](https://www.rollupjs.com/guide/big-list-of-options#outputassetfilenames), [`output.chunkFileNames`](https://www.rollupjs.com/guide/big-list-of-options#outputchunkfilenames)。

### **cache**

该选项用于指定先前的 bundle 的缓存。当它设置后，Rollup 只会对改变的部分进行重新分析，从而加速观察模式（watch mode）中的后续构建。如果将它设置为 `false`，则会阻止 bundle 生成缓存，还会导致插件的缓存失效。

### **plugins**

类型：Plugin | (Plugin | void)[]

插件配置
