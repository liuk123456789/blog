---
title: TS模块
date: 2023-03-09
categories: 
 - TypeScript
tags:
 - ts module
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)

## TypeScript中的模块

### 附加导入语法

导入重命名：`import { old as new }`

```typescript
import { pi as π } from "./maths.ts";
 
console.log(π);
// (alias) var π: number
// import π
```

混合导入语法

```typescript
// maths.js
export const pi = 3.14;
export default class RandomNumberGenerator {}

import RNGen, { pi as π } from './maths.js'
```

导出所有，放入单独的命名空间：`import * as namespace`

```typescript
// @filename: app.ts
import * as math from './maths.ts'
```

导入单独文件： `import '[filename]'`

```typescript
// app.ts
import './maths.ts'	
```

在这个例子中， `import` 什么也没干，然而，`math.ts` 的所有代码都会执行，触发一些影响其他对象的副作用（side-effects）

### TypeScript 的ES语法

类型可以向JS值那样，使用相同的语法导入和导出

```typescript
export type Cat = { breeed: string; yearOfBirth: number }

export interface Dog {
    breeds: string[];
    yearOfBirth: number;
}

import { Cat, Dog } from './animal'
type Animals = Cat | Dog
```

TypeScript 已经在两个方面拓展了 `import` 语法，方便类型导入：

#### **导入类型**

```typescript
// @filename: animal.ts
export type Cat = { breed: string; yearOfBirth: number };
// 'createCatName' cannot be used as a value because it was imported using 'import type'.
export type Dog = { breeds: string[]; yearOfBirth: number };
export const createCatName = () => "fluffy";
 
// @filename: valid.ts
import type { Cat, Dog } from "./animal.js";
export type Animals = Cat | Dog;
 
// @filename: app.ts
import type { createCatName } from "./animal.js";
const name = createCatName();
```

#### **内置类型导入**

TypeScript 4.5 也允许单独的导入，你需要使用 `type` 前缀 ，表明被导入的是一个类型：

```typescript
import { createCatName, type Cat, type Dog } from './animal.ts'

export type Animals = Cat | Dog
const name = createCatName()
```

这些可以让一个非 TypeScript 编译器比如 Babel、swc 或者 esbuild 知道什么样的导入可以被安全移除。

导入类型和内置类型导入的区别在于一个是导入语法，一个是仅仅导入类型。

#### **CommonJS行为的ES模块语法**

TypeScript 之所以有 ES 模块语法跟 CommonJS 和 AMD 的 `required` 有很大的关系。使用 ES 模块语法的导入跟 `require` 一样都可以处理绝大部分的情况，但是这个语法能确保你在有 CommonJS 输出的 TypeScript 文件里，有一个 1 对 1 的匹配：

```typescript
import fs = require('fs')
const code = fs.readFileSync('hello.ts', 'utf8')
```



## CommonJS语法

### 导出

```javascript
function absolte(num: number) {
    if(num < 0) return num * -1;
    return num;
}

module.exports = {
  pi: 3.14,
  squareTwo: 1.41,
  phi: 1.61,
  absolute,
}
```

这些文件可以通过一个 `require` 语句导入：

```javascript
const maths = require('maths')
maths.pi
```

你可以使用 JavaScript 的解构语法简化一点代码：

```javascript
const { squareTwo } = require("maths");
squareTwo;
// const squareTwo: any
```

### CommonJS 和 ES 模块互操作（CommonJS and ES Modules interop）



因为默认导出和模块声明空间对象导出的差异，CommonJS 和  ES 模块不是很合适一起使用。TypeScript 有一个 [esModuleInterop](https://www.typescriptlang.org/tsconfig#esModuleInterop) 编译选项可以减少两种规范之间的冲突。

## TypeScript模块解析选项

模块解析是从 `import` 或者 `require` 语句中取出字符串，然后决定字符指向的是哪个文件的过程。



TypeScript 包含两个解析策略：Classic 和 Node。Classic，当编译选项 [module](https://www.typescriptlang.org/tsconfig#module) 不是 `commonjs` 时的默认选择，包含了向后兼容。Node 策略则复制了 CommonJS 模式下 Nodejs 的运行方式，会对 `.ts` 和 `.d.ts` 有额外的检查。



这里有很多 TSConfig 标志可以影响 TypeScript 的模块策略：[moduleResolution](https://www.typescriptlang.org/tsconfig#moduleResolution), [baseUrl](https://www.typescriptlang.org/tsconfig#baseUrl), [paths](https://www.typescriptlang.org/tsconfig#paths), [rootDirs](https://www.typescriptlang.org/tsconfig#rootDirs)。



关于这些策略工作的完整细节，你可以参考 [Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)。

## TypeScript 模块输出选项

有两个选项可以影响 JavaScript 输出的文件：



- [target](https://www.typescriptlang.org/tsconfig#target) 决定了哪些 JS 特性会被降级（被转换成可以在更老的 JavaScript 运行环境使用），哪些则完整保留。
- [module](https://www.typescriptlang.org/tsconfig#module) 决定了转换后代码采用的模块规范



你使用哪个 [target](https://www.typescriptlang.org/tsconfig#target) 取决于你期望代码运行的环境。这些可以是：你需要支持的最老的浏览器，你期望代码运行的最老的 Nodejs 版本，或者一些独特的运行环境比如 Electron 等。



编译选项 [module](https://www.typescriptlang.org/tsconfig#module) 决定了模块之间通信使用哪一种规范。在运行时，模块加载器会在执行模块之前，查找并执行这个模块所有的依赖。



举个例子，这是一个使用 ES Module 语法的 TypeScript 文件，展示了 [module](https://www.typescriptlang.org/tsconfig#module) 选项不同导致的编译结果：

```typescript
import { valueOfPi } from "./constants.js";
 
export const twoPi = valueOfPi * 2;
```

### ES2020

```typescript
import { valueOfPi } from "./constants.js";
export const twoPi = valueOfPi * 2;
```

### CommonJS

```typescript
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.twoPi = void 0;
const constants_js_1 = require("./constants.js");
exports.twoPi = constants_js_1.valueOfPi * 2;
```

### UMD

```typescript
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./constants.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.twoPi = void 0;
    const constants_js_1 = require("./constants.js");
    exports.twoPi = constants_js_1.valueOfPi * 2;
});
 
```

注意 ES2020 已经跟原始的 index.ts 文件相同了。

你可以在 [TSConfig 模块](https://www.typescriptlang.org/tsconfig#module)页面看到所有可用的选项和它们对应编译后的 JavaScript 代码长什么样。



## namespace 命名空间

请务必注意一点，TypeScript 1.5里术语名已经发生了变化。 “内部模块”现在称做“命名空间”。 “外部模块”现在则简称为“模块”，这是为了与 [ECMAScript 2015](https://link.juejin.cn?target=http%3A%2F%2Fwww.ecma-international.org%2Fecma-262%2F6.0%2F)里的术语保持一致，(也就是说 `module X {` 相当于现在推荐的写法 `namespace X {`)。
 这段话简单看就是，现在“内部模块”被叫命名空间，使用的关键词为`namespace`；“外部模块”现在被叫做模块，使用关键词`module`

### namespace的使用

官网中栗子如下

```typescript
// index.d.ts
//创建一个命名空间Validation
namespace Validation {
   //将命名空间中的接口暴露出去
    export interface StringValidator {
        isAcceptable(s: string): boolean;
    }

    const lettersRegexp = /^[A-Za-z]+$/;
    const numberRegexp = /^[0-9]+$/;
    //将LettersOnllyValidator类暴露出去
    export class LettersOnlyValidator implements StringValidator {
        isAcceptable(s: string) {
            return lettersRegexp.test(s);
        }
    }
    //将ZipCodeValidator类暴露出去
    export class ZipCodeValidator implements StringValidator {
        isAcceptable(s: string) {
            return s.length === 5 && numberRegexp.test(s);
        }
    }
}


// test.ts
let strings = ["Hello", "98052", "101"];


let validators: { [s: string]: Validation.StringValidator; } = {};
validators["ZIP code"] = new Validation.ZipCodeValidator();
validators["Letters only"] = new Validation.LettersOnlyValidator();


for (let s of strings) {
    for (let name in validators) {
        console.log(`"${ s }" - ${ validators[name].isAcceptable(s) ? "matches" : "does not match" } ${ name }`);
    }
}
```

- 该例子创建了一个名为`Validation`的命名空间，在这个命名空间中有一个`StringValidator`接口，并有两个类分别是`LettersOnlyValidator`类和`ZipCodeValidator`类，这两个类分别用来判断是否为英文字母和是否为0-9的数字。
- 当我们想让这些接口和类在命名空间之外也是可访问的，所以需要使用 `export`。 相反的，变量 `lettersRegexp`和`numberRegexp`是实现的细节，不需要导出，因此它们在命名空间外是不能访问的。 在文件末尾的测试代码里，由于是在命名空间之外访问，因此需要限定类型的名称，比如 `Validation.LettersOnlyValidator`。

从上面的话中我们可以看出，在命名空间中，可以隔绝作用域，外部的作用域无法访问到`Validation`中的作用域，如果想让外面的作用域访问到`Validation`中的作用域，需要使用`export`将想要访问的接口或是类给暴露出去。

- 在命名空间中，有他自己的作用域，外部无法访问到，要想访问需使用`export`将访问的部分暴露出去

### 命名空间中的作用都是独立的

```typescript
// namespace 定义一个名为 A 的单独的空间
namespace A {
    interface Animal{
        name:string;
        eat():void;
    }

    // 外部需要调用的类 需要用 【export】 给 导出 去
    export class Dog implements Animal {
        name: string;
        constructor(name:string) {
            this.name = name;
        }
        eat() {
            return this.name + '吃骨头1'
        }
        
    }
}

// namespace 定义一个名为 V 的单独的空间
namespace V {
    interface Animal{
        name:string;
        eat():void;
    }

    // 外部需要调用的类 需要用 【export】 给 导出 去
    export class Dog implements Animal {
        name: string;
        constructor(name:string) {
            this.name = name;
        }
        eat() {
            return this.name + '吃骨头2'
        }
        
    }
}

let dog1 = new A.Dog('小黑')
console.log(dog1.eat())  // 小黑吃骨头1

let dog2  = new V.Dog('小白')
console.log(dog2.eat())  // 小白吃骨头2
```

### 同命名空间的合并

```typescript
namespace Animals {
    export class Cat { }
}

namespace Animals {
    export interface Legged { numberOfLegs: number; }
    export class Dog { }
}
```

合并如下

```typescript
namespace Animals {
    export interface Legged { numberOfLegs: number; }

    export class Cat { }
    export class Dog { }
}
```

在相同的名字的命名空间中

1. 其中模块导出的同名接口会合并为一个接口
2. 未导出的成员，仅在未合并前的命名空间可见。从其他空间合并来的成员无法访问未导出的成员
3. 对于里头值的合并，如果里头值的名字相同，那么后来的命名空间的值会优先级会更高
4. 对于没有冲突的成员，会直接混入