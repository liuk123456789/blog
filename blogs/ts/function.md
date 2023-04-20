---
title: TS 函数系列
date: 2023-03-07
categories: 
 - TypeScript
tags:
 - ts function
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)

## 函数类型表达式

```typescript
function gretter(fn: (a: string) => void) {
    fn('Hello, World')
}

function printToConsole(s: string) {
    console.log(s)
}

gretter(printToConsole)
```

语法 `(a: string) => void` 表示一个函数有一个名为 `a` ，类型是字符串的参数，这个函数并没有返回任何值。



如果一个函数参数的类型并没有明确给出，它会被隐式设置为 `any`。

> 注意函数参数的名字是必须的，这种函数类型描述 `(string) => void`，表示的其实是一个函数有一个类型是 `any`，名为 `string` 的参数。

使用类型别名定义函数

```typescript
type GreetFunction = (a:string) => void;

function greeter(fn: GreetFunction) {
    // ...
}
```

## 调用签名

在 JavaScript 中，函数除了可以被调用，自己也是可以有属性值的。然而上一节讲到的函数类型表达式并不能支持声明属性，如果我们想描述一个带有属性的函数，我们可以在一个对象类型中写一个调用签名（call signature）。

```typescript
type DescribableFunction = {
    description: string;
    (someArg: number): boolean;
}

function doSomething(fn: DescribableFunction) {
    console.log(fn.description + 'returned' + fn(6))
}
```

注意这个语法跟函数类型表达式稍有不同，在参数列表和返回的类型之间用的是 `:` 而不是 `=>`。

## 构造函数

JavaScript 函数也可以使用 `new` 操作符调用，当被调用的时候，`TypeScript` 会认为这是一个构造函数(constructors)，因为他们会产生一个新对象。你可以写一个构造签名，方法是在调用签名前面加一个 `new` 关键词：

```typescript
type SomeConstructor = {
    new(s: string):SomeObject;
}

function fn(ctor: SomeConstructor) {
    return new ctor('hello')
}
```

一些对象，比如 `Date` 对象，可以直接调用，也可以使用 `new` 操作符调用，而你可以将调用签名和构造签名合并在一起：

```typescript
interface CallOrConstruct {
  new (s: string): Date; // 构造签名
  (n?: number): number; // 调用签名
}
```

## 泛型函数

函数的输出类型依赖函数的输入类型，或者两个输入的类型以某种形式相互关联。让我们考虑这样一个函数，它返回数组的第一个元素：

```typescript
function firstElement(arr: any[]) {
    return arr[0]
}
```

注意此时函数返回值的类型是 `any`，如果能返回第一个元素的具体类型就更好了。



在 TypeScript 中，`泛型就是被用来描述两个值之间的对应关系`。我们需要在函数签名里声明一个**类型参数 (type parameter)**：

```typescript
function firstElement<Type>(arr: Type[]): Type | undefined {
    return arr[0]
}
```

通过给函数添加一个类型参数 `Type`，并且在两个地方使用它，我们就在函数的输入(即数组)和函数的输出(即返回值)之间创建了一个关联。现在当我们调用它，一个更具体的类型就会被判断出来：

```typescript
// s is of type 'string'
const s = firstElement(["a", "b", "c"]);
// n is of type 'number'
const n = firstElement([1, 2, 3]);
// u is of type undefined
const u = firstElement([]);
```

### 推断

在上面的例子中，我们没有明确指定 `Type` 的类型，类型是被 `TypeScript` 自动推断出来的。

也可以使用多个类型参数，举个例子：

```typescript
function map<Input, Output>(arr: Input[], func: (arg: Input) => Output): Output[] {
    return arr.map(func)
}
```

注意在这个例子中，TypeScript 既可以推断出 Input 的类型 （从传入的 `string` 数组），又可以根据函数表达式的返回值推断出 `Output` 的类型。

### 约束

我们想关联两个值，但只能操作值的一些固定字段，这种情况，我们可以使用**约束（constraint）**对类型参数进行限制。

写一个函数，函数返回两个值中更长的那个。为此，我们需要保证传入的值有一个 `number` 类型的 `length` 属性。我们使用  `extends`  语法来约束函数参数：

```typescript
function longest<Type extends { length: number }>(a:Type, b:Type) {
    if(a.length === b.length) {
        return a
    } else {
        return b
    }
}

// longerArray is of type 'number[]'
const longerArray = longest([1, 2], [1, 2, 3]);
// longerString is of type 'alice' | 'bob'
const longerString = longest("alice", "bob");
// Error! Numbers don't have a 'length' property
const notOK = longest(10, 100);
// Argument of type 'number' is not assignable to parameter of type '{ length: number; }'.
```

对 `Type` 做了 `{ length: number }` 限制，我们才可以被允许获取 `a` `b`参数的 `.length` 属性。没有这个类型约束，我们甚至不能获取这些属性，因为这些值也许是其他类型，并没有 length 属性。

### 泛型约束实战

这是一个泛型约束常出现的错误

```typescript
function minimumLength<Type extends { length: number }>(
	obj: Type,
    minimum: number
 ): Type {
    if(obj.length >= minimum) {
        return obj
    } else {
        // 问题出现在这里：返回值类型应该是Type类型
        return { length: minimum }
    }
}
```

函数理应返回与传入参数相同类型的对象，而不仅仅是符合约束的对象。我们可以写出这样一段反例：

```typescript
// 'arr' gets value { length: 6 }
const arr = minimumLength([1, 2, 3], 6);
// and crashes here because arrays have
// a 'slice' method, but not the returned object!
console.log(arr.slice(0));
```

### 声明类型参数

TypeScript 通常能自动推断泛型调用中传入的类型参数，但也并不能总是推断出。举个例子，有这样一个合并两个数组的函数：

```typescript
function combine<Type>(arr1: Type[], arr2: Type[]): Type[] {
  return arr1.concat(arr2);
}
```

如果你像下面这样调用函数就会出现错误：

```typescript
const arr = combine([1, 2, 3], ["hello"]);
// Type 'string' is not assignable to type 'number'.
```

而如果你执意要这样做，你可以手动指定 `Type`：

```typescript
const arr = combine<string | number>([1, 2, 3], ["hello"]);
```

### 写一个好的泛型参数的建议

泛型函数很有意思，但也容易翻车。如果你使用了太多的类型参数，或者使用了一些并不需要的约束，都可能会导致不正确的类型推断。



#### 函数参数下移

下面这两个函数的写法很相似：

```typescript
function firstElement1<Type>(arr: Type[]) {
  return arr[0];
}
 
function firstElement2<Type extends any[]>(arr: Type) {
  return arr[0];
}
 
// a: number (good)
const a = firstElement1([1, 2, 3]);
// b: any (bad)
const b = firstElement2([1, 2, 3]);
```

第一眼看上去，两个函数可太相似了，但是第一个函数的写法可比第二个函数好太多了。第一个函数可以推断出返回的类型是 `number`，但第二个函数推断的返回类型却是 `any`，因为 TypeScript 不得不用约束的类型来推断 `arr[0]` 表达式，而不是等到函数调用的时候再去推断这个元素。



关于本节原文中的 `push down` 含义，在《重构》里，就有一个函数下移（Push Down Method）的优化方法，指如果超类中的某个函数只与一个或者少数几个子类有关，那么最好将其从超类中挪走，放到真正关心它的子类中去。即只在超类保留共用的行为。这种将超类中的函数本体复制到具体需要的子类的方法就可以称之为 "push down"，与本节中的去除 `extend any[]`，将其具体的推断交给 `Type` 自身就类似于 `push down`。

> Rule: 如果可能的话，直接使用类型参数而不是约束它



#### 使用更少的类型参数

这是另一对看起来很相似的函数：

```typescript
function filter1<Type>(arr: Type[], func: (arg: Type) => boolean): Type[] {
  return arr.filter(func);
}
 
function filter2<Type, Func extends (arg: Type) => boolean>(
  arr: Type[],
  func: Func
): Type[] {
  return arr.filter(func);
}
```

我们创建了一个并没有关联两个值的类型参数 `Func`，这是一个危险信号，因为它意味着调用者不得不毫无理由的手动指定一个额外的类型参数。`Func` 什么也没做，却导致函数更难阅读和推断。

> Rule: 尽可能用更少的类型参数



#### 类型参数应该出现两次

有的时候我们会忘记一个函数其实并不需要泛型

```typescript
function greet<Str extends string>(s: Str) {
  console.log("Hello, " + s);
}
 
greet("world");
```

其实我们可以如此简单的写这个函数：

```typescript
function greet(s: string) {
  console.log("Hello, " + s);
}
```

记住：类型参数是用来关联多个值之间的类型。如果一个类型参数只在函数签名里出现了一次，那它就没有跟任何东西产生关联。

> Rule: 如果一个类型参数仅仅出现在一个地方，强烈建议你重新考虑是否真的需要它



#### 可选参数

JavaScript 中的函数经常会被传入非固定数量的参数，举个例子：`number` 的 `toFixed` 方法就支持传入一个可选的参数：

```typescript
function f(n:number) {
    console.log(n.toFixed())
    console.log(n.toFixed(3))
}
```

我们可以使用 `?` 表示这个参数是可选的：

```typescript
function f(x?: number) {
  // ...
}
f(); // OK
f(10); // OK
```

尽管这个参数被声明为 `number`类型，`x` 实际上的类型为 `number | undefiend`，这是因为在 JavaScript 中未指定的函数参数就会被赋值 `undefined`。

你当然也可以提供有一个参数默认值：

```typescript
function f(x = 10) {
  // ...
}
```

现在在 `f` 函数体内，`x` 的类型为 `number`，因为任何 `undefined` 参数都会被替换为 `10`。注意当一个参数是可选的，调用的时候还是可以传入 `undefined`：

```typescript
declare function f(x?: number): void;
// cut
// All OK
f();
f(10);
f(undefined);
```



#### 回调中的可选参数

```typescript
function myForEach(arr: any[], callback: (arg: any, index?: number) => void){
    for(let i = 0; i < arr.length; i++) {
        callback(arr[i], i)
    }
})
```

将 `index?`作为一个可选参数，本意是希望下面这些调用是合法的：

```typescript
myForEach([1, 2, 3], (a) => console.log(a));
myForEach([1, 2, 3], (a, i) => console.log(a, i));
```

但 TypeScript 并不会这样认为，TypeScript 认为想表达的是回调函数可能只会被传入一个参数，换句话说，myForEach 函数也可能是这样的：

```typescript
function myForEach(arr: any[], callback: (arg: any, index?: number) => void) {
  for (let i = 0; i < arr.length; i++) {
    // I don't feel like providing the index today
    callback(arr[i]);
  }
}
```

如何修改？不设置可选参数即可

```typescript
function myForEach(arr: any[], callback: (arg: any, index: number) => void) {
  for (let i = 0; i < arr.length; i++) {
    callback(arr[i], i);
  }
}

myForEach([1, 2, 3], (a, i) => {
  console.log(a);
});
```

在 JavaScript 中，如果你调用一个函数的时候，传入了比需要更多的参数，额外的参数就会被忽略。TypeScript 也是同样的做法。

> 当你写一个回调函数的类型时,不要写一个可选参数, 除非你真的打算调用函数的时候不传入实参



#### 函数重载

一些 JavaScript 函数在调用的时候可以传入不同数量和类型的参数。举个例子。你可以写一个函数，返回一个日期类型 `Date`，这个函数接收一个时间戳（一个参数）或者一个 月/日/年 的格式 (三个参数)。



在 TypeScript 中，我们可以通过写重载签名 (overlaod signatures) 说明一个函数的不同调用方法。 我们需要写一些函数签名 (通常两个或者更多)，然后再写函数体的内容：

```typescript
// 重载签名 (overload signatures)
function makeDate(timeStamp: number): Date;
// 重载签名 (overload signatures)
function makeDate(m: number, d: number, y: number): Date;
function makeDate(mOrTimeStamp: number, d?: number, y?: number): Date {
  if (d !== undefined && y !== undefined) {
    return new Date(y, mOrTimeStamp, d);
  } else {
    return new Date(mOrTimeStamp);
  }
}

const d1 = makeDate(12345678);
const d2 = makeDate(5, 5, 5);
// No overload expects 2 arguments, but overloads do exist that expect either 1 or 3 arguments.
const d3 = makeDate(1, 3);
```

在这个例子中，我们写了两个函数重载，一个接受一个参数，另外一个接受三个参数。前面两个函数签名被称为重载签名 (overload signatures)。



然后，我们写了一个兼容签名的函数实现，我们称之为实现签名 (implementation signature) ，但这个签名不能被直接调用。尽管我们在函数声明中，在一个必须参数后，声明了两个可选参数，它依然不能被传入两个参数进行调用。



#### 重载签名和实现签名

常见的一个问题

```typescript
function fn(x:string):void;
function fn() {
    // ...
}
// Expected to be able to call with zero arguments
fn();
Expected 1 arguments, but got 0.
```

 再次强调一下，写进函数体的签名是对外部来说是“不可见”的，这也就意味着外界“看不到”它的签名，自然不能按照实现签名的方式来调用。

> 实现签名对外界来说是不可见的。当写一个重载函数的时候，你应该总是需要来两个或者更多的签名在实现签名之上。

而且实现签名必须和重载签名必须兼容（compatible），举个例子，这些函数之所以报错就是因为它们的实现签名并没有正确的和重载签名匹配。

```typescript
function fn(x: boolean):void
// Argument type isn't right
function fn(x: string):void
// This overload signature is not compatible with its implementation signature.
function fn(x:boolean) {}
```

修改下

```typescript
function fn(x: string): string;
// Return type isn't right
function fn(x: number): boolean;
This overload signature is not compatible with its implementation signature.
function fn(x: string | number) {
  return "oops";
}
```

#### 如何写好函数重载

设想这样一个函数，该函数返回数组或者字符串的长度：

```typescript
function len(s: string): number;
function len(arr: any[]): number;
function len(x: any) {
  return x.length;
}
```

函数代码功能实现了，也没有什么报错，但我们不能传入一个可能是字符串或者是数组的值，因为 TypeScript 只能一次用一个函数重载处理一次函数调用。

```typescript
len(""); // OK
len([0]); // OK
len(Math.random() > 0.5 ? "hello" : [0]);
```

因为两个函数重载都有相同的参数数量和相同的返回类型，我们可以写一个无重载版本的函数替代：

```typescript
function len(x: any[] | string) {
  return x.length;
}
```

这样函数就可以传入两个类型中的任意一个了。

> 尽可能的使用联合类型替代重载



### 在函数中声明 this (Declaring `this` in a Function)

TypeScript 会通过代码流分析函数中的 `this` 会是什么类型，举个例子：

```typescript
const user = {
  id: 123,
 
  admin: false,
  becomeAdmin: function () {
    this.admin = true;
  },
};
```

TypeScript 能够理解函数 `user.becomeAdmin` 中的 `this` 指向的是外层的对象 `user`，这已经可以应付很多情况了，但还是有一些情况需要你明确的告诉 TypeScript `this` 到底代表的是什么。

在 JavaScript  中，`this` 是保留字，所以不能当做参数使用。但 TypeScript 可以允许你在函数体内声明 `this` 的类型。

```typescript
interface DB {
  filterUsers(filter: (this: User) => boolean): User[];
}
 
const db = getDB();
const admins = db.filterUsers(function (this: User) {
  return this.admin;
});
```

这个写法有点类似于回调风格的 API。注意你需要使用 `function` 的形式而不能使用箭头函数：

```typescript
interface DB {
  filterUsers(filter: (this: User) => boolean): User[];
}
 
const db = getDB();
const admins = db.filterUsers(() => this.admin);
// The containing arrow function captures the global value of 'this'.
// Element implicitly has an 'any' type because type 'typeof globalThis' has no index signature.

```



#### 剩余参数

借助一个使用 `...` 语法的数组，为函数提供不定数量的实参。举个例子，数组的 `push` 方法就可以接受任何数量的实参：

```typescript
const arr1 = [1, 2, 3];
const arr2 = [4, 5, 6];
arr1.push(...arr2);
```

注意一般情况下，TypeScript 并不会假定数组是不变的(immutable)，这会导致一些意外的行为：

```typescript
// 类型被推断为 number[] -- "an array with zero or more numbers",
// not specifically two numbers
const args = [8, 5];
const angle = Math.atan2(...args);
// A spread argument must either have a tuple type or be passed to a rest parameter.
```

修复这个问题需要你写一点代码，通常来说, 使用 `as const` 是最直接有效的解决方法：

```typescript
// Inferred as 2-length tuple
const args = [8, 5] as const;
// OK
const angle = Math.atan2(...args);
```

通过 `as const` 语法将其变为只读元组便可以解决这个问题。

注意当你要运行在比较老的环境时，使用剩余参数语法也许需要你开启 `downlevelIteration` ，将代码转换为旧版本的 JavaScript。



#### 参数结构

使用参数解构方便的将作为参数提供的对象解构为函数体内一个或者多个局部变量，在 JavaScript 中，是这样的：

```typescript
function sum({ a, b, c }) {
  console.log(a + b + c);
}
sum({ a: 10, b: 3, c: 9 });
```

在解构语法后，要写上对象的类型注解：

```typescript
function sum({ a, b, c }: { a: number; b: number; c: number }) {
  console.log(a + b + c);
}
```

 这个看起来有些繁琐，你也可以这样写：

```typescript
// 跟上面是有一样的
type ABC = { a: number; b: number; c: number };
function sum({ a, b, c }: ABC) {
  console.log(a + b + c);
}
```



#### 函数的可赋值性

函数有一个 `void` 返回类型，会产生一些意料之外，情理之中的行为。



当基于上下文的类型推导（Contextual Typing）推导出返回类型为 `void` 的时候，并不会强制函数一定不能返回内容。换句话说，如果这样一个返回 `void` 类型的函数类型 `(type vf = () => void)`，

当被应用的时候，也是可以返回任何值的，但返回的值会被忽略掉。

因此，下面这些`() => void` 类型的实现都是有效的：

```typescript
type voidFunc = () => void;
 
const f1: voidFunc = () => {
  return true;
};
 
const f2: voidFunc = () => true;
 
const f3: voidFunc = function () {
  return true;
};
```

而且即便这些函数的返回值赋值给其他变量，也会维持 `void` 类型：

```typescript
const v1 = f1();
 
const v2 = f2();
 
const v3 = f3();
```

正是因为这个特性的存在，所以接下来的代码才会是有效的：

```typescript
const src = [1, 2, 3];
const dst = [0];
 
src.forEach((el) => dst.push(el));
```

尽管 `Array.prototype.push` 返回一个数字，并且 `Array.prototype.forEach` 方法期待一个返回 `void` 类型的函数，但这段代码依然没有报错。就是因为基于上下文推导，推导出 forEach 函数返回类型为 void，正是因为不强制函数一定不能返回内容，所以上面这种 `return dst.push(el)` 的写法才不会报错。

另外还有一个特殊的例子需要注意，当一个函数字面量定义返回一个 `void` 类型，函数是一定不能返回任何东西的：

```typescript
function f2(): void {
  // @ts-expect-error
  return true;
}
 
const f3 = function (): void {
  // @ts-expect-error
  return true;
};
```

