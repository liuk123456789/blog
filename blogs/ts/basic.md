---
title: TS 常见类型&类型收窄
date: 2023-03-06
categories: 
 - TypeScript
tags:
 - ts type&narrowing
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)

## 1. 前期工作

1. 通过安装全局的`typescript`编译

   ```powershell
   npm i -g typescript
   ```

   新建一个文件，如：`index.ts `通过`typeScript `编译

   ```powershell
   tsc index.ts
   ```

   执行上述命令后，可以看到会生成`index.js`文件，编译成功

   我们可以借助`vscode`，自动编译

   1. 进入根目录，`vscode`终端运行`tsc --init `生成`tsconfig.json`文件
   2. 修改`tsconfig.json`中`outDir`配置（`outDir`代表的就是编程成`js`后的输出目录）
   3. 选择`vscode`菜单栏的终端 -> 选择运行生成任务 -> 选择 `tsc:监视 - tsconfig.json`
   4. 可以看到生成了`js`文件目录，且将`index.ts`编译成`index.js`

2. 直接使用线上的 [TypeScript Playground](https://link.juejin.cn/?target=https%3A%2F%2Fwww.typescriptlang.org%2Fplay%2F) 来学习新的语法或新特性。通过配置 **TS Config** 的 Target，可以设置不同的编译目标，从而编译生成不同的目标代码。

## 2. typescript的常用类型

1. **number**

   ```typescript
   const num:number = 10
   ```

2. **string**

   ```typescript
   const name:string = 'crystal'
   ```

3. **boolean**

   ```typescript
   const isVisible:boolean = false
   ```

4. **symbol**

   ```typescript
   const test = Symbol('symbol')
   ```

5. **array**

   ```typescript
   const list:number[] = [1,2,3,4]
   // or
   const list:Array<number> = [1, 2, 3, 4]
   ```

6. **tuple**

   **单个变量中存储不同类型的值，这时候我们就可以使用元组**

   ```typescript
   let tupleType: [string, boolean];
   tupleType = ["semlinker", true];
   ```

7. **enum**

   1. 数字枚举

      ```typescript
      enum PositionEnum {
          TOP,
          BOTTOM,
          LEFT,
          RIGHT
      }
      
      const pos:PositionEnum = PositionEnum.TOP // 0
      ```

      **编译的js**

      ```javascript
      'use strict'
      var PositionEnum
      (function (PositionEnum) {
          PositionEnum[PositionEnum["TOP"] = 0] = "TOP";
          PositionEnum[PositionEnum["BOTTOM"] = 1] = "BOTTOM";
          PositionEnum[PositionEnum["LEFT"] = 2] = "LEFT";
          PositionEnum[PositionEnum["RIGHT"] = 3] = "RIGHT";
      })(PositionEnum || (PositionEnum = {}))
      ```

   2. 字符串枚举

      ```typescript
      enum PositionEnum {
          TOP = 'top',
          BOTTOM = 'bottom',
          LEFT = 'left',
          RIGHT = 'right',
      }
      const pos:PositionEnum = PositionEnum.TOP // 'top'
      ```

   3. 常量枚举

      ```typescript
      const enum PositionEnum {
          TOP,
          BOTTOM,
          LEFT,
          RIGHT
      }
      
      const pos:PositionEnum = PositionEnum.TOP
      ```

      **编译的js**

      ```javascript
      "use strict";
      const pos = 0 /* PositionEnum.TOP */;
      ```

   4. 异构枚举

      **成员值是数字和字符串的混合**

      ```typescript
      enum Enum {
          A,
          B,
          C = 'C',
          D = 'D',
          E = 8,
          F,
      }
      ```

      **编译的js**

      ```javascript
      "use strict";
      var Enum;
      (function (Enum) {
          Enum[Enum["A"] = 0] = "A";
          Enum[Enum["B"] = 1] = "B";
          Enum["C"] = "C";
          Enum["D"] = "D";
          Enum[Enum["E"] = 8] = "E";
          Enum[Enum["F"] = 9] = "F";
          Enum[Enum["G"] = 10] = "G";
      })(Enum || (Enum = {}));
      ```

8. **any**

   TS中，任何类型都可以归为`any`类型，所以`any`也是类型系统的顶级类型

   ```typescript
   let testAny:any = 1
   testAny = 10
   testAny = [1,'22','222',121221]
   ```

   如果你没有指定一个类型，`TypeScript` 也不能从上下文推断出它的类型，编译器就会默认设置为 `any` 类型。

   

   如果你总是想避免这种情况，毕竟 `TypeScript` 对 `any` 不做类型检查，你可以通过`tsconfig.json`开启编译项 [noImplicitAny](https://www.typescriptlang.org/tsconfig#noImplicitAny)，当被隐式推断为 `any` 时，`TypeScript `就会报错。如下

   ```typescript
   let testAny: any = 1;
   testAny = 10;
   testAny = [1, '22', '222', 121221];
   
   // ts编译报错参数"s"隐式具有"any"类型
   function(s) {
     console.log(s as string.substr(3))
   }
   ```

9. **unknow**

   同`any`相似，所有类型也可以赋值给`unknow`。

   ```typescript
   let value: unknow
   
   value = 1;
   value = 'test';
   value = [];
   value = {};
   value = Math.randow
   value = null;
   value = undefined;
   value = new TypeError();
   value = Symbol("type");
   ```

   `unknow`类型只能赋值给`any`和`unkonw`类型本身

   ```typescript
   let value: unknown;
   
   let value1: unknown = value; // OK
   let value2: any = value; // OK
   let value3: boolean = value; // Error
   let value4: number = value; // Error
   let value5: string = value; // Error
   let value6: object = value; // Error
   let value7: any[] = value; // Error
   let value8: Function = value; // Error
   ```

   `unknown` 类型只能被赋值给 `any` 类型和 `unknown` 类型本身

10. **void**

    `void` 类型像是与 `any` 类型相反，它表示没有任何类型。当一个函数没有返回值时，你通常会见到其返回值类型是 void：

    ```typescript
    // node_modules/typescript/lib/lib.es5.d.ts
    interface ObjectConstructor {
      create(o: object | null): any;
      // ...
    }
    
    const proto = {};
    
    Object.create(proto);     // OK
    Object.create(null);      // OK
    Object.create(undefined); // Error
    Object.create(1337);      // Error
    Object.create(true);      // Error
    Object.create("oops");    // Error
    ```

11. **null和undefined**

    `null`和`indefined`两者分别代表各自的类型``null`,`undefined`

12. **函数**

    函数是js传递数据的主要方法，TS允许你指定函数的输入值和输出值的类型

    **参数类型注解(Parameter Type Annotations)**

    ```typescript
    // Parameter type annotations
    function greet(name: string) {
        console.log('Hello', + name.toUpperCase() + '!!')
    }
    ```

    函数有了类型注解后，TS便会检查函数的实参

    ```typescript
    // Argument of type 'number' is not assignable to parameter of type 'string'.
    greet(40)
    ```

    **返回值类型注解(Return Type Annotations)**
    返回值的类型注解。返回值的类型注解跟在参数列表后面

    ```typescript
    function getFavoriteNumber(): number {
        return 26
    }
    ```

    **匿名函数**

    匿名函数不同于函数声明，当TS知道一个匿名函数被怎样调用时，匿名函数的参数会自动指定类型

    ```typescript
    // No type annotations here, but TypeScript can spot the bug
    const names = ["Alice", "Bob", "Eve"];
    
    // Contextual typing for function
    names.forEach(function (s) {
      console.log(s.toUppercase());
      // Property 'toUppercase' does not exist on type 'string'. Did you mean 'toUpperCase'?
    });
     
    // Contextual typing also applies to arrow functions
    names.forEach((s) => {
      console.log(s.toUppercase());
      // Property 'toUppercase' does not exist on type 'string'. Did you mean 'toUpperCase'?
    });
    ```

    上述栗子可以看出，尽管没有置顶`s`的类型，但是根据传入数组的类型，推断了`s`的类型

    这个过程称之为`上下文推断`

13. **对象类型**

    定义一个对象类型，需要知道列出属性和对应的类型，如下

    ```typescript
    function printCoord(pt: { x:number, y:number }) {
      console.log("The coordinate's x value is " + pt.x);
      console.log("The coordinate's y value is " + pt.y);
    }
    printCoord({ x:3, y:7 })
    ```

    **可选属性**

    对象类型可以指定一些甚至所有的属性都是可选的，只需在属性名后添加`?`

    ```typescript
    function printName(obj: { first: string, last?: string }) {
        // ...
    }
    printName({ first: 'ghost' })
    printName({ first: 'Tyon', last: 'oliford' })
    ```

    在js中，如果`get`一个不存在的属性，会得到`undefined`而不是运行时错误，因此，当`get`一个可选属性时，你需要在使用它时，检查是否是`undefined`

    ```typescript
    function printName(obj: { first: string; last?: string }) {
      // obj.last 可能会是undefined，所以会报错
      console.log(obj.last.toUpperCase());
      // ok
      if (obj.last !== undefined) {
        console.log(obj.last.toUpperCase());
      }
     
      // 使用了ES6的可选链
      console.log(obj.last?.toUpperCase());
    }
    ```

14. **联合类型**

    **定义一个联合类型**

    一个联合类型是由两个或者更多类型组成的类型，表示值可能是这些类型中的任意一个。这其中每个类型都是联合类型的**成员（members）**。

    ```typescript
    function printId(id: number | string) {
        console.log('Your ID is:' + id)
    }
    printId(101)
    printId('202')
    ```

    **使用联合类型**

    使用联合类型时`TypeScript` 会要求你做的事情，必须对每个联合的成员都是有效的。举个例子，如果你有一个联合类型 `string | number` , 你不能使用只存在 `string` 上的方法：

    ```typescript
    function printId(id: number | string) {
        console.log(id.toUpperCase())
        // Property 'toUpperCase' does not exist on type 'string | number'.
        // Property 'toUpperCase' does not exist on type 'number'.
    }
    ```

    解决方案是用代码收窄联合类型，就像在`js`没有类型注解那样使用

    举个例子，`TypeScript` 知道，对一个 `string` 类型的值使用 `typeof` 会返回字符串 `"string"`：

    ```typescript
    function printId(id: number | string) {
      if (typeof id === "string") {
        // In this branch, id is of type 'string'
        console.log(id.toUpperCase());
      } else {
        // Here, id is of type 'number'
        console.log(id);
      }
    }
    ```

    再举一个例子，使用函数，比如 `Array.isArray`:

    ```typescript
    function welcomePeople(x: string[] | string) {
      if (Array.isArray(x)) {
        // Here: 'x' is 'string[]'
        console.log("Hello, " + x.join(" and "));
      } else {
        // Here: 'x' is 'string'
        console.log("Welcome lone traveler " + x);
      }
    }
    ```

    注意在 `else`分支，我们并不需要做任何特殊的事情，如果 `x `不是 `string[]`，那么它一定是 `string `

    

    有时候，如果联合类型里的每个成员都有一个属性，举个例子，数字和字符串都有 `slice` 方法，你就可以直接使用这个属性，而不用做类型收窄：

    ```typescript
    // Return type is inferred as number[] | string
    function getFirstThree(x: number[] | string) {
      return x.slice(0, 3);
    }
    ```

15. **类型别名**

    所谓类型别名就是，可以指代任意类型的名字，类型别名的语法如下

    ```typescript
    type Point = {
        x: number;
        y: number;
    }
    function printCoord(pt: Point) {
      console.log("The coordinate's x value is " + pt.x);
      console.log("The coordinate's y value is " + pt.y);
    }
    // 传入的x y 类型必须是number
    printCoord({ x: 100, y: 100 });
    ```

    可以使用类型别名给任意类型一个名字，如下

    ```typescript
    type ID = number | string
    ```

16. **接口**

    接口声明是命名对象类型的一种方式

    ```typescript
    interface IPoint {
        x: number;
        y: number;
    }
    
    function printCoord(pt: Point) {
        console.log("The coordinate's x value is" + pt.x)
        console.log("The coordinate's y value is" + pt.y)
    }
    
    printCoord({ x: 100, y: 100 })
    ```

    **类型和接口的不同**

    类型别名和接口非常的相似，大部分的时候，可以根据喜好选择使用，最关键的区别在于类型别名本身无法添加新的属性，而接口是可以扩展的

    ```typescript
    // Interface
    // 通过继承扩展接口
    interface Animal {
        name: string
    }
    
    interface Bear extends Animal {
        honey: boolean
    }
    
    // Type
    // 通过交叉扩展类型别名
    type Animal = {
      name: string
    }
    
    type Bear = Animal & { 
      honey: boolean 
    }
    ```

    ```typescript
    // Interface
    // 对一个已经存在的接口添加新的字段
    interface Window {
        title: string
    }
    
    interface Window {
        ts: TypeScriptAPI
    }
    
    const src = 'const a = "Hello World"';
    window.ts.transpileModule(src, {});
    
    // Type 创建后不可在变
    type Widnow = {
    	title: string
    }
    
    type Window = {
        ts: TypeScriptAPI
    }
    // Error: Duplicate identifier 'Window'.
    ```

17. **类型断言**

    有时候明确知道某个值的类型，但是TS不知道，这种情况下我们可以通过类型断言,如下

    ```typescript
    const myCanvas = document.getElementById('main_canvas') as HTMLCanvasElement;
    ```

    就像类型注解一样，类型断言会被编译器移除，不会影响运行时的行为

    也可以使用尖括号语法

    ```typescript
    const myCanvas = <HTMLCanvasElement>document.getElementById("main_canvas");
    ```

    `TypeScript` 仅仅允许类型断言转换为一个更加具体或者更不具体的类型。这个规则可以阻止一些不可能的强制类型转换，比如：

    ```typescript
    const x = "hello" as number;
    // Conversion of type 'string' to type 'number' may be a mistake because neither type sufficiently overlaps with the other. If this was intentional, convert the expression to 'unknown' first.
    ```

    有时候，这条规则显得非常保守，阻止了原本有效的类型转换，如果发生了此类情况，需要通过双重断言，先断言为`any`或`unknow`，然后在断言为渴望类型

    ```typescript
    const a = (expr as any) as T;
    ```

18. **字面量类型**

    除了常见的类型`string`和`number`，我们也可以将类型声明为更具体的数字或者字符串

    ```typescript
    let changeingString = 'Hello World'
    changeingString = 'Olá Mundo'
    ```

    字面量类型本身没有太大用，结合联合类型，就变得实用

    ```typescript
    function printText(s:string, alignment: 'left' | 'right' | 'center') {
        // ...
    }
    
    printText("Hello, world", "left");
    printText("G'day, mate", "centre");
    // Argument of type '"centre"' is not assignable to parameter of type '"left" | "right" | "center"'.
    ```

    **字面量推断**

    初始化一个对象时，TS会假设这个对象的属性值未来会被修改

    ```typescript
    const obj = { counter: 0 }
    if(someCondition) {
        obj.counter = 1
    }
    ```

    TS不会认为`obj.counter`之前是0，现在赋值为1是错误的，`obj.counter`类型只要是`number`类型，但不要求是一定是某个值

    ```typescript
    declare function handleRequest(url: string, method: 'GET' | 'POST'):void;
    
    const req = { url: 'https://example.com', method: 'GET' }
    
    handleRequest(req.url, req.method)
    // Argument of type 'string' is not assignable to parameter of type '"GET" | "POST"'.
    ```

    `req.method` 被推断为 `string` ，而不是 `"GET"`，因为在创建 `req` 和 调用 `handleRequest` 函数之间，可能还有其他的代码，或许会将 `req.method` 赋值一个新字符串比如 `"Guess"` 。所以 TypeScript 就报错了。

    两种方式解决上述问题

    1. 添加类型断言改变推断结果

       ```typescript
       // Change 1:
       const req = { url: "https://example.com", method: "GET" as "GET" };
       // Change 2
       handleRequest(req.url, req.method as "GET");
       ```

       修改 1 表示“我有意让 `req.method` 的类型为字面量类型 `"GET"`，这会阻止未来可能赋值为 `"GUESS"` 等字段”。修改 2 表示“我知道 `req.method` 的值是 `"GET"`”.

    2. 也可以使用`as const`把整个对象转为字段量

       ```typescript
       const req = { url: "https://example.com", method: "GET" } as const;
       handleRequest(req.url, req.method);
       ```

19. **非空断言操作符**

    TypeScript 提供了一个特殊的语法，可以在不做任何检查的情况下，从类型中移除 `null` 和 `undefined`，这就是在任意表达式后面写上 `!`  ，这是一个有效的类型断言，表示它的值不可能是 `null` 或者 `undefined`：

    ```typescript
    function liveDangerously(x?: number | null) {
        // 断言x不为null/undefined
        console.log(x!.toFixed())
    }
    ```

    就像其他的类型断言，这也不会更改任何运行时的行为。重要的事情说一遍，只有当你明确的知道这个值不可能是 `null` 或者 `undefined` 时才使用 `!` 。

## 3. 类型收窄（Narrowing）

1. **typeof 类型保护**

   ```typescript
   function printAll(strs: string | string[] | null) {
     if (typeof strs === "object") {
       for (const s of strs) {
   		  // Object is possibly 'null'.
         console.log(s);
       }
     } else if (typeof strs === "string") {
       console.log(strs);
     } else {
       // do nothing
     }
   }
   ```

   在这个 `printAll` 函数中，我们尝试判断 `strs` 是否是一个对象，原本的目的是判断它是否是一个数组类型，但是在 JavaScript 中，`typeof null` 也会返回 `object`。而这是 JavaScript 一个不幸的历史事故。

   

   熟练的用户自然不会感到惊讶，但也并不是所有人都如此熟练。不过幸运的是，TypeScript 会让我们知道 `strs` 被收窄为 `strings[] | null` ，而不仅仅是 `string[]`。

2. **真值收窄**

   ```typescript
   function printAll(strs: string | string[] | null) {
     // 这里通过判定了strs不为空且类型是object时才执行后续代码
     if (strs && typeof strs === "object") {
       for (const s of strs) {
         console.log(s);
       }
     } else if (typeof strs === "string") {
       console.log(strs);
     }
   }
   ```

   值得注意的是，基本类型真值检查很容易导致错误

   ```typescript
   function printAll(strs: string | string[] | null) {
     // !!!!!!!!!!!!!!!!
     //  DON'T DO THIS!
     //   KEEP READING
     // !!!!!!!!!!!!!!!!
     // 如果strs 为空字符串是，程序无法往下执行，和我们预期会不一致
       
     if (strs) {
       if (typeof strs === "object") {
         for (const s of strs) {
           console.log(s);
         }
       } else if (typeof strs === "string") {
         console.log(strs);
       }
     }
   }
   ```

3. **等值收窄**

   ```typescript
   function printAll(strs: string | string[] | null) {
       // 等值判定
       if (strs !== null) {
           if (typeof strs === 'object') {
               for (const s of strs) {
                   console.log(s);
               }
           }
       } else if (typeof strs === 'string') {
           console.log(strs);
       }
   }
   ```

   JavaScript 的宽松相等操作符如 `==` 和 `!=` 也可以正确的收窄。在 JavaScript 中，通过  `== null`  这种方式并不能准确的判断出这个值就是 `null`，它也有可能是 `undefined` 。对 `== undefined` 也是一样，不过利用这点，我们可以方便的判断一个值既不是 `null` 也不是 `undefined`：

   ```typescript
   interface Container {
       value: number | null | undefined
   }
   
   function multiplyValue(container: Container, factor: number) {
       if(container.value != null) {
           console.log(container.value)
           container.value *= factor
       }
   }
   ```

4. **in 操作符收窄**

   JavaScript中有一个`in`操作符可以判断一个对象是否存在对应属性名，TypeScript中可可以进行类型收窄

   ```typescript
   type Fish = { swim: () => void }
   type Bird = { fly:() => void }
   
   function move(animal: Fish | Bird) {
       if('swim' in animal) {
           return animal.swim()
       }
       return animal.fly()
   }
   ```

   如果存在可选属性，如果一个人类即可以`swim`也可以`fly`，也能准确显示

   ```typescript
   type Fish = { swim:() => void }
   type Bird = { fly:() => void }
   type Human = { swim?: () => void; fly?:() => void }
   
   function move(animal: Fish | Bird | Human) {
       if('swim' in animal) {
           animal;
       } else {
           animal;
       }
   }
   ```

5. **instanceof 收窄**

   `instanceof`也是一种类型保护，TypeScript也可以通过`instanceof`正确类型收窄

   ```typescript
   function logValue(x: Date | string) {
       if(x instanceof Date) {
           console.log(x.toUTCString())
       } else {
           console.log(x.toUpperCase())
       }
   }
   ```

6. **赋值语句**

   ```typescript
   let x = Math.random() < 0.5 ? 10 : 'hello world';
   
   x = 1;
   
   x= 'string'
   ```

   注意这些赋值语句都有有效的，即便我们已经将 `x` 改为 `number` 类型，但我们依然可以将其更改为 `string` 类型，这是因为 `x` 最初的声明为 `string | number`，赋值的时候只会根据正式的声明进行核对。

   如果赋值非`string | number` ,TS编译便会报错

7. **控制流分析**

   ```typescript
   function padLeft(padding: number | string, input: string) {
     if (typeof padding === "number") {
       return new Array(padding + 1).join(" ") + input;
     }
     return padding + input;
   }
   ```

   在第一个 `if` 语句里，因为有 `return` 语句，TypeScript 就能通过代码分析，判断出在剩余的部分 `return padding + input` ，如果 padding 是 `number` 类型，是无法达到 (**unreachable**) 这里的，所以在剩余的部分，就会将 `number`类型从 `number | string` 类型中删除掉。


   这种基于**可达性**(**reachability**) 的代码分析就叫做控制流分析(control flow analysis)。在遇到类型保护和赋值语句的时候，TypeScript 就是使用这样的方式收窄类型。而使用这种方式，一个变量可以被观察到变为不同的类型：

8. **类型判断式(type predicates)**

   在有的文档里， `type predicates` 会被翻译为**类型谓词**。考虑到 predicate 作为动词还有表明、声明、断言的意思，区分于类型断言（Type Assertion），这里我就索性翻译成类型判断式。

   

   如果你想直接通过代码控制类型的改变， 你可以自定义一个类型保护。实现方式是定义一个函数，这个函数返回的类型是类型判断式，示例如下：

   ```typescript
   type Fish = { swim: () => void };
   type Bird = { fly: () => void };
   
   function isFish(pet: Fish | Bird):pet is Fish {
       return (pet as Fish).swim !== undefined
   }
   
   let pet: Fish | Bird = {
     swim: () => console.log('swim'),
     fly: () => console.log('fly')
   }
   
   if (isFish(pet)) {
     pet.swim(); // let pet: Fish
   } else {
     pet.fly(); // let pet: Bird
   }
   ```

   在这个例子中，`pet is Fish`就是我们的类型判断式，一个类型判断式采用 `parameterName is Type`的形式，但 `parameterName` 必须是当前函数的参数名。

   如果不使用类型`类型判断式`，那么`isFish(pet)`便会报错

   

   当 isFish 被传入变量进行调用，TypeScript 就可以将这个变量收窄到更具体的类型：

   ```typescript
   // Both calls to 'swim' and 'fly' are now okay.
   let pet = getSmallPet();
    
   if (isFish(pet)) {
     pet.swim(); // let pet: Fish
   } else {
     pet.fly(); // let pet: Bird
   }
   ```

   注意这里，TypeScript 并不仅仅知道 `if` 语句里的 `pet` 是 `Fish` 类型，也知道在 `else` 分支里，`pet` 是 `Bird` 类型，毕竟 `pet` 就两个可能的类型。

9. **可辩别联合（Discriminated unions）**

   让我们试想有这样一个处理 `Shape` （比如 `Circles`、`Squares` ）的函数，`Circles` 会记录它的半径属性，`Squares` 会记录它的边长属性，我们使用一个 `kind` 字段来区分判断处理的是 `Circles` 还是 `Squares`，这是初始的 `Shape` 定义：

   ```typescript
   interface Shape {
       kind: 'circle' | 'suqre';
       radius?: number;
       sideLength?: number;
   }
   ```

   使用了一个联合类型，`"circle" | "square"` ，使用这种方式，而不是一个 `string`，我们可以避免一些拼写错误的情况：

   ```typescript
   function handleShape(shape: Shape) {
     // oops!
     if (shape.kind === "rect") {
   	// This condition will always return 'false' since the types '"circle" | "square"' and '"rect"' have no overlap.
       // ...
     }
   }
   ```

   写一个获取面积的 `getArea` 函数，而圆和正方形的计算面积的方式有所不同，我们先处理一下是 `Circle` 的情况：

   ```typescript
   function getArea(shape: Shape) {
      return Math.PI * shape.radius ** 2 
   }
   ```

   此时编译会报错，因为`radius`可能是`undefined`，如果通过`kind`判定下呢？

   ```typescript
   function getArea(shape: Shape) {
     if (shape.kind === "circle") {
       return Math.PI * shape.radius ** 2;
   		// Object is possibly 'undefined'.
     }
   }
   ```

   报错依旧存在，尝试通过非空断言，表示`kind`是`circle`时`radius`一定存在

   ```typescript
   function getArea(shape: Shape) {
     if (shape.kind === "circle") {
       return Math.PI * shape.radius! ** 2;
   		// Object is possibly 'undefined'.
     }
   }
   ```

   然而这个不是一个很好的方法，设定为可选，现在又断言一定存在。所以修改下`Shape`的定义

   ```typescript
   interface Circle {
       kind: 'circle';
       radius: 'number';
   }
   
   interface Square {
       kind: 'square';
       sideLength: number
   }
   
   type Shape = Circle | Square
   ```

   我们把 `Shape` 根据 `kind` 属性分成两个不同的类型，`radius` 和 `sideLength` 在各自的类型中被定义为 `required`。

   

   现在看下是否还会报错

   ```typescript
   function getArea(shape: Shape) {
       if(shape.kind === 'circle') {
           return Math.PI * shape.radius ** 2;
       }
   }
   
   getArea({ kind: 'circle', radius: 10})
   ```

   当联合类型中的每个类型，都包含了一个共同的字面量类型的属性，TypeScript 就会认为这是一个**可辨别联合（discriminated union）**，然后可以将具体成员的类型进行收窄。

   

   在这个例子中，`kind` 就是这个公共的属性（作为 Shape 的**可辨别(discriminant)** 属性 ）。

10. **never类型**

    当进行收窄的时候，如果你把所有可能的类型都穷尽了，TypeScript 会使用一个 `never` 类型来表示一个不可能存在的状态。

11. **穷尽检查**

    never 类型可以赋值给任何类型，然而，没有类型可以赋值给 `never` （除了 `never` 自身）。这就意味着你可以在 `switch` 语句中使用 `never` 来做一个穷尽检查。

     

    举个例子，给 `getArea` 函数添加一个 `default`，把 `shape` 赋值给 `never` 类型，当出现还没有处理的分支情况时，`never` 就会发挥作用。

    ```typescript
    type Shape = Circle | Square;
     
    function getArea(shape: Shape) {
      switch (shape.kind) {
        case "circle":
          return Math.PI * shape.radius ** 2;
        case "square":
          return shape.sideLength ** 2;
        default:
          const _exhaustiveCheck: never = shape;
          return _exhaustiveCheck;
      }
    }
    ```

    当我们给 `Shape` 类型添加一个新成员，却没有做对应处理的时候，就会导致一个 TypeScript 错误：

    ```typescript
    interface Triangle {
      kind: "triangle";
      sideLength: number;
    }
     
    type Shape = Circle | Square | Triangle;
     
    function getArea(shape: Shape) {
      switch (shape.kind) {
        case "circle":
          return Math.PI * shape.radius ** 2;
        case "square":
          return shape.sideLength ** 2;
        default:
          const _exhaustiveCheck: never = shape;
          // Type 'Triangle' is not assignable to type 'never'.
          return _exhaustiveCheck;
      }
    }
    ```

    因为 TypeScript 的收窄特性，执行到 `default`  的时候，类型被收窄为 `Triangle`，但因为任何类型都不能赋值给 `never` 类型，这就会产生一个编译错误。通过这种方式，你就可以确保 `getArea` 函数总是穷尽了所有 `shape` 的可能性。



​    

​    

​    

​    
