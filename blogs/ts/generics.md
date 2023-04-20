---
title: TS 进阶
date: 2023-03-08
categories: 
 - TypeScript
tags:
 - ts advanced
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)

## 泛型

### 使用泛型变量

当你创建泛型函数时，你会发现，编译器会强制你在函数体内，正确的使用这些类型参数。这就意味着，你必须认真的对待这些参数，考虑到他们可能是任何一个，甚至是所有的类型（比如用了联合类型）。

```typescript
function identufy<Type>(arg: Type):Type {
	return arg;
}
```

如果我们打印`arg`参数的长度呢？

```typescript
function logginIdentify<Type>(arg: Type):Type {
	console.log(arg.length);
    // Property 'length' does not exist on type 'Type'.
    return arg;
}
```

因为Type类型存在变化性，所以编译报错

### 泛型类型

泛型函数的形式就跟其他非泛型函数的一样，都需要先列一个类型参数列表，这有点像函数声明：

```typescript
function identify<Type>(arg: Type):Type {
	return arg;    
}

let myIndentify: <Type>(arg: Type) => Type = identify
```

泛型的类型参数可以使用不同的名字，只要数量和使用方式上一致即可：

```typescript
function identify<Type>(arg: Type):Type {
    return arg;
}

let myIndentify: <Input>(arg: Input) => Input = identify
```

我们也可以以对象类型的调用签名的形式，书写这个泛型类型：

```typescript
function identify<Type>(arg: Type): Type {
    return arg;
}
// 函数签名：入参、返回值
let myIdentify: { <Type>(arg): Type } = identify
```

实现泛型接口

```typescript
interface GenericIdentifyFn {
    <Type>(arg: Type): Type
}

function identify<Type>(arg: Type): Type {
    return arg;
}

let myIndentify: GenericIdentifyFn = identify;
```

泛型参数作为整个接口的参数，这可以让我们清楚的知道传入的是什么参数 (举个例子：`Dictionary<string>` 而不是 `Dictionary`)。而且接口里其他的成员也可以看到。

```typescript
interface GenericIdentityFn<Type> {
  (arg: Type): Type;
}
 
function identity<Type>(arg: Type): Type {
  return arg;
}
 
let myIdentity: GenericIdentityFn<number> = identity;
```

注意在这个例子里，我们只做了少许改动。不再描述一个泛型函数，而是将一个非泛型函数签名，作为泛型类型的一部分。



现在当我们使用 `GenericIdentityFn` 的时候，需要明确给出参数的类型。(在这个例子中，是 `number`)，有效的锁定了调用签名使用的类型。



当要描述一个包含泛型的类型时，理解什么时候把类型参数放在调用签名里，什么时候把它放在接口里是很有用的。



除了泛型接口之外，我们也可以创建泛型类。注意，不可能创建泛型枚举类型和泛型命名空间。



### 泛型类

泛型类写法上类似于泛型接口。在类名后面，使用尖括号中 `<>` 包裹住类型参数列表：

```typescript
class GenericNumber<Type> {
    zeroValue: Type;
    add: (x: Type, y: Type) => Type;
}

let myGenericNumber = new GenericNumber<number>()
myGenericNumber.zeroValue = 0;
myGenericNumber.add = function (x, y) {
  return x + y;
};
```

上述代码中，并未限制只能使用`number`类型，可以使用其他类型

```typescript
let stringNumeric = new GenericNumber<string>()
myGenericNumber.zeroValue = '1';
myGenericNumber.add = function(x, y) {
    return x + y
}

console.log(stringNumeric.add(stringNumeric.zeroValue, "test"));
```

### 泛型约束

创建一个接口，用来描述约束。这里，我们创建了一个只有 `.length` 属性的接口，然后我们使用这个接口和 `extend`关键词实现了约束：

```typescript
interface LengthWise {
    length: number;
}

function logginIdentify<Type extends LengthWise>(arg: Type): Type {
    console.log(arg.length)
    return arg;
}
```

这样，便约束了泛型

### 泛型约束中使用类型参数

可以使用类型参数，这个类型被其他类型参数约束

举个例子，我们希望获取一个对象给定属性名的值，为此，我们需要确保我们不会获取 `obj` 上不存在的属性。所以我们在两个类型之间建立一个约束：

```typescript
// 会返回该对象属性名组成的一个字符串或者数字字面量的联合
// example: keyof {a: 1, b: 2, c: 3} => 'a' | 'b' | 'c'
function getProperty<Type, Key extends keyof Type>(obj: Type, key: Key) {
  return obj[key];
}
 
let x = { a: 1, b: 2, c: 3, d: 4 };
 
getProperty(x, "a");
getProperty(x, "m");

// Argument of type '"m"' is not assignable to parameter of type '"a" | "b" | "c" | "d"'.
```

### 泛型中使用类类型

在 TypeScript 中，当使用工厂模式创建实例的时候，有必要通过他们的构造函数推断出类的类型，举个例子：

```typescript
function create<Type>(c: { new(): Type}): Type {
    return new c()
}
```

下面是一个更复杂的例子，使用原型属性推断和约束，构造函数和类实例的关系。

```typescript
class BeeKeeper {
  hasMask: boolean = true;
}
 
class ZooKeeper {
  nametag: string = "Mikle";
}
 
class Animal {
  numLegs: number = 4;
}
 
class Bee extends Animal {
  keeper: BeeKeeper = new BeeKeeper();
}
 
class Lion extends Animal {
  keeper: ZooKeeper = new ZooKeeper();
}

function createInstance<A extends Animal>(c: new () => A): A {
  return new c();
}
 
createInstance(Lion).keeper.nametag;
createInstance(Bee).keeper.hasMask;
```

## keyof

对一个对象类型使用 `keyof` 操作符，会返回该对象属性名组成的一个字符串或者数字字面量的联合。这个例子中的类型 P 就等同于 "x" | "y"：

```typescript
type Point = { x: number; y: number };
type P = keyof Point;

// type P = keyof Point
```

但如果这个类型有一个 `string` 或者 `number` 类型的索引签名，`keyof` 则会直接返回这些类型：

```typescript
type Arrayish = { [n: number]: unknow }
type A = keyof Arrayish // => number

type Mapish = { [k: string]: boolean };
type M = keyof Mapish;
// type M = string | number
```

注意在这个例子中，`M` 是 `string | number`，这是因为 JavaScript 对象的属性名会被强制转为一个字符串，所以 `obj[0]` 和 `obj["0"]` 是一样的。

## 数字字面量联合类型

`keyof` 也可能返回一个数字字面量的联合类型，那什么时候会返回数字字面量联合类型呢，我们可以尝试构建这样一个对象：

```typescript
const NumericObject = {
  [1]: "冴羽一号",
  [2]: "冴羽二号",
  [3]: "冴羽三号"
};

type result = keyof typeof NumericObject

// typeof NumbericObject 的结果为：
// {
//   1: string;
//   2: string;
//   3: string;
// }
// 所以最终的结果为：
// type result = 1 | 2 | 3
```

### Symbol

其实 TypeScript 也可以支持 symbol 类型的属性名：

```typescript
const sym1 = Symbol()
const sym2 = Symbol()
const sym3 = Symbol()

const symbolToNumberMap = {
    [sym1]: 1,
    [sym2]: 2,
    [sym3]: 3,
}

type KS = keyof typeof symbolToNumberMap // typeof sym1 | typeof sym2 | typeof sym3
```

这也就是为什么当我们在泛型中像下面的例子中使用，会如此报错：

```typescript
function useKey<T, K extends keyof T>(o: T, k: K) {
  var name: string = k; 
  // Type 'string | number | symbol' is not assignable to type 'string'.
}
```

如果你确定只使用字符串类型的属性名，你可以这样写：

```typescript
function useKey<T, K extends Extract<keyof T, string>>(o: T, k: K) {
  var name: string = k; // OK
}
```

而如果你要处理所有的属性名，你可以这样写：

```typescript
function useKey<T, K extends keyof T>(o: T, k: K) {
  var name: string | number | symbol = k;
}
```

### 类和接口

对类使用`keyof`:

```typescript
// 例一
class Person {
    name: '冴羽'
}

type result = keyof Person
// type result = "name"
```

```typescript
// 例子二
class Person {
  [1]: string = "冴羽";
}

type result = keyof Person;
// type result = 1
```

接口使用`keyof`

```typescript
interface Person {
    name: 'string'
}

type result = keyof Person;
// type result = "name"
```



## typeof

### 限制

TypeScrip有意限制可以使用`typeof`的表达式的种类

在 TypeScript 中，只有对标识符（比如变量名）或者他们的属性使用 `typeof` 才是合法的。这可能会导致一些令人迷惑的问题：

```typescript
// Meant to use = ReturnType<typeof msgbox>
let shouldContinue: typeof msgbox("Are you sure you want to continue?");
// ',' expected.
```

我们本意是想获取 `msgbox("Are you sure you want to continue?")` 的返回值的类型，所以直接使用了 `typeof msgbox("Are you sure you want to continue?")`，看似能正常执行，但实际并不会，这是因为 `typeof` 只能对标识符和属性使用。而正确的写法应该是：

```typescript
ReturnType<typeof msgbox>
```

### 对象使用typeof

```typescript
const person = { name: "kevin", age: "18" }
type Kevin = typeof person;

// type Kevin = {
// 		name: string;
// 		age: string;
// }
```

### 函数使用typeof

```typescript
function identity<Type>(arg: Type): Type {
  return arg;
}

type result = typeof identity;
// type result = <Type>(arg: Type) => Type
```

### enum使用typeof

```typescript
enum UserResponse {
  No = 0,
  Yes = 1,
}

type result = typeof UserResponse;

// ok
const a: result = {
      "No": 2,
      "Yes": 3
}

result 类型类似于：

// {
//	"No": number,
//  "YES": number
// }
```

不过对一个 enum 类型只使用 `typeof` 一般没什么用，通常还会搭配 `keyof` 操作符用于获取属性名的联合字符串：

```typescript
type result = keyof typeof UserResponse;
// type result = "No" | "Yes"
```



## 索引访问类型

可以使用**索引访问类型（indexed access type）**查找另外一个类型上的特定属性：

```typescript
type Person = { age: number; name: string; alive: boolean };
type Age = Person["age"];
// type Age = number
```

因为索引名本身就是一个类型，所以我们也可以使用联合、`keyof` 或者其他类型：

```typescript
type I1 = Person["age" | "name"];  
// type I1 = string | number
 
type I2 = Person[keyof Person];
// type I2 = string | number | boolean
 
type AliveOrName = "alive" | "name";
type I3 = Person[AliveOrName];  
// type I3 = string | boolean
```

接下来是另外一个示例，我们使用 `number` 来获取数组元素的类型。结合 `typeof` 可以方便的捕获数组字面量的元素类型：

```typescript
const MyArray = [
  { name: "Alice", age: 15 },
  { name: "Bob", age: 23 },
  { name: "Eve", age: 38 },
];
 
type Person = typeof MyArray[number];
       
// type Person = {
//    name: string;
//    age: number;
// }

type Age = typeof MyArray[number]["age"];  
// type Age = number

// Or
type Age2 = Person["age"];   
// type Age2 = number
```

作为索引的只能是类型，这意味着你不能使用 `const` 创建一个变量引用：

```typescript
const key = "age";
type Age = Person[key];

// Type 'key' cannot be used as an index type.
// 'key' refers to a value, but is being used as a type here. Did you mean 'typeof key'?
```

然而你可以使用类型别名实现类似的重构:

```typescript
type key = "age";
type Age = Person[key];
```

假设有这样一个业务场景，一个页面要用在不同的 APP 里，比如淘宝、天猫、支付宝，根据所在 APP 的不同，调用的底层 API 会不同，我们可能会这样写：

```typescript
const APP = ['TaoBao', 'Tmall', 'Alipay'];

function getPhoto(app: string) {
  // ...
}
  
getPhoto('TaoBao'); // ok
getPhoto('whatever'); // ok
```

如果我们仅仅是对 app 约束为 `string` 类型，即使传入其他的字符串，也不会导致报错，我们可以使用字面量联合类型约束一下：

```typescript
const APP = ['TaoBao', 'Tmall', 'Alipay'];
type app = 'TaoBao' | 'Tmall' | 'Alipay';

function getPhoto(app: app) {
  // ...
}
  
getPhoto('TaoBao'); // ok
getPhoto('whatever'); // not ok
```

但写两遍又有些冗余，我们怎么根据一个数组获取它的所有值的字符串联合类型呢？我们就可以结合上一篇的 `typeof` 和本节的内容实现：

```typescript
const APP = ['TaoBao', 'Tmall', 'Alipay'] as const;
type app = typeof APP[number];
// type app = "TaoBao" | "Tmall" | "Alipay"

function getPhoto(app: app) {
  // ...
}
  
getPhoto('TaoBao'); // ok
getPhoto('whatever'); // not ok
```

分析如下：

首先是使用 `as const` 将数组变为 `readonly` 的元组类型，但此时 `APP` 还是一个值，我们通过 `typeof` 获取 `APP` 的类型：

```typescript
type typeOfAPP = typeof APP;
// type typeOfAPP = readonly ["TaoBao", "Tmall", "Alipay"]
```

最后在通过索引访问类型，获取字符串联合类型：

```typescript
type app = typeof APP[number];
// type app = "TaoBao" | "Tmall" | "Alipay"
```

## 条件类型

我们需要基于输入的值来决定输出的值，同样我们也需要基于输入的值的类型来决定输出的值的类型。**条件类型（Conditional types**）就是用来帮助我们描述输入类型和输出类型之间的关系。

```typescript
interface Animal {
  live(): void;
}

interface Dog extends Animal {
  woof(): void;
}
 
type Example1 = Dog extends Animal ? number : string;     
// type Example1 = number
 
type Example2 = RegExp extends Animal ? number : string;     
// type Example2 = string
```

条件类型的写法有点类似于 JavaScript 中的条件表达式（condition ? trueExpression : falseExpression ）：

```typescript
SomeType extends OtherType ? TrueType : FalseType;
```

单从这个例子，可能看不出条件类型有什么用，但当搭配泛型使用的时候就很有用了，让我们拿下面的 `createLabel` 函数为例：

```typescript
interface IdLabel {
  id: number /* some fields */;
}
interface NameLabel {
  name: string /* other fields */;
}
 
function createLabel(id: number): IdLabel;
function createLabel(name: string): NameLabel;
function createLabel(nameOrId: string | number): IdLabel | NameLabel;
function createLabel(nameOrId: string | number): IdLabel | NameLabel {
  throw "unimplemented";
}
```

这里使用了函数重载，描述了 createLabel 是如何基于输入值的类型不同而做出不同的决策，返回不同的类型。注意这样一些事情：



1如果一个库不得不在一遍又一遍的遍历 API 后做出相同的选择，它会变得非常笨重。

2我们不得不创建三个重载，一个是为了处理明确知道的类型，我们为每一种类型都写了一个重载（这里一个是 string，一个是 number），一个则是为了通用情况 （接收一个 string | number）。而如果增加一种新的类型，重载的数量将呈指数增加。



其实我们完全可以用把逻辑写在条件类型中：

```typescript
type NameOrId<T extends number | string> = T extends number
  ? IdLabel
  : NameLabel;
```

使用这个条件类型，我们可以简化掉函数重载：

```typescript
function createLabel<T extends number | string>(idOrName: T): NameOrId<T> {
  throw "unimplemented";
}

let a = createLabel("typescript");
// let a: NameLabel

let b = createLabel(2.8);
// let b: IdLabel
 
let c = createLabel(Math.random() ? "hello" : 42);
// let c: NameLabel | IdLabel
```

### 条件类型约束

通常，使用条件类型会为我们提供一些新的信息。正如使用**类型保护（type guards）**可以**收窄类型（narrowing）**为我们提供一个更加具体的类型，条件类型的 `true` 分支也会进一步约束泛型，举个例子：

```typescript
type MessageOf<T> = T["message"];
// Type '"message"' cannot be used to index type 'T'.
```

TypeScript 报错是因为 `T` 不知道有一个名为 `message` 的属性。我们可以约束 `T`，这样 TypeScript 就不会再报错：

```typescript
type MessageOf<T extends { message: unknown }> = T["message"];
 
interface Email {
  message: string;
}
 
type EmailMessageContents = MessageOf<Email>;
// type EmailMessageContents = string
```

但是，如果我们想要 `MessgeOf` 可以传入任何类型，但是当传入的值没有 `message` 属性的时候，则返回默认类型比如 `never` 呢？



我们可以把约束移出来，然后使用一个条件类型：

```typescript
type MessageOf<T> = T extends { message: unknown } ? T["message"] : never;
 
interface Email {
  message: string;
}
 
interface Dog {
  bark(): void;
}
 
type EmailMessageContents = MessageOf<Email>;           
// type EmailMessageContents = string
 
type DogMessageContents = MessageOf<Dog>;          
// type DogMessageContents = never
```

### 在条件类型中推断

条件类型提供了 `infer` 关键词，可以从正在比较的类型中推断类型，然后在 `true` 分支里引用该推断结果。借助 `infer`，我们修改下 `Flatten` 的实现，不再借助索引访问类型“手动”的获取出来：

```typescript
type Flatten<Type> = Type extends Array<infer Item> ? Item : Type;
```

里我们使用了 `infer` 关键字声明了一个新的类型变量 `Item` ，而不是像之前在 `true` 分支里明确的写出如何获取 `T` 的元素类型，这可以解放我们，让我们不用再苦心思考如何从我们感兴趣的类型结构中挖出需要的类型结构。

我们也可以使用 `infer` 关键字写一些有用的**类型帮助别名（helper type aliases）**。举个例子，我们可以获取一个函数返回的类型：

```typescript
type GetReturnType<Type> = Type extends (...args: never[]) => infer Return
  ? Return
  : never;
 
type Num = GetReturnType<() => number>;
// type Num = number
 
type Str = GetReturnType<(x: string) => string>;
// type Str = string
 
type Bools = GetReturnType<(a: boolean, b: boolean) => boolean[]>;   
// type Bools = boolean[]
```

当从多重调用签名（就比如重载函数）中推断类型的时候，会按照最后的签名进行推断，因为一般这个签名是用来处理所有情况的签名。

```typescript
declare function stringOrNum(x: string): number;
declare function stringOrNum(x: number): string;
declare function stringOrNum(x: string | number): string | number;
 
type T1 = ReturnType<typeof stringOrNum>;                     
// type T1 = string | number
```

### 分发条件类型

当在泛型中使用条件类型的时候，如果传入一个联合类型，就会变成**分发的（distributive）**，举个例子：

```typescript
type ToArray<Type> = Type extends any ? Type[] : never;
```

如果我们在 `ToArray` 传入一个联合类型，这个条件类型会被应用到联合类型的每个成员：

```typescript
type ToArray<Type> = Type extends any ? Type[] : never;
 
type StrArrOrNumArr = ToArray<string | number>;        
// type StrArrOrNumArr = string[] | number[]
```

通常这是我们期望的行为，如果你要避免这种行为，你可以用方括号包裹 `extends` 关键字的每一部分。

```typescript
type ToArrayNonDist<Type> = [Type] extends [any] ? Type[] : never;
 
// 'StrArrOrNumArr' is no longer a union.
type StrArrOrNumArr = ToArrayNonDist<string | number>;
// type StrArrOrNumArr = (string | number)[]
```

## 映射类型

有的时候，一个类型需要基于另外一个类型，但是你又不想拷贝一份，这个时候可以考虑使用映射类型。



映射类型建立在索引签名的语法上，我们先回顾下索引签名：

```typescript
// 当你需要提前声明属性的类型时
type OnlyBoolsAndHorses = {
  [key: string]: boolean | Horse;
};
 
const conforms: OnlyBoolsAndHorses = {
  del: true,
  rodney: false,
};
```

而映射类型，就是使用了 `PropertyKeys` 联合类型的泛型，其中 `PropertyKeys` 多是通过 `keyof` 创建，然后循环遍历键名创建一个类型：

```typescript
type OptionsFlags<Type> = {
  [Property in keyof Type]: boolean;
};
```

```typescript
type FeatureFlags = {
  darkMode: () => void;
  newUserProfile: () => void;
};
 
type FeatureOptions = OptionsFlags<FeatureFlags>;
// type FeatureOptions = {
//    darkMode: boolean;
//    newUserProfile: boolean;
// }
```

### 映射修饰符

在使用映射类型时，有两个额外的修饰符可能会用到，一个是 `readonly`，用于设置属性只读，一个是 `?` ，用于设置属性可选。



你可以通过前缀 `-` 或者 `+` 删除或者添加这些修饰符，如果没有写前缀，相当于使用了 `+` 前缀。 

```typescript
// 删除属性中的只读属性
type CreateMutable<Type> = {
  -readonly [Property in keyof Type]: Type[Property];
};
 
type LockedAccount = {
  readonly id: string;
  readonly name: string;
};
 
type UnlockedAccount = CreateMutable<LockedAccount>;

// type UnlockedAccount = {
//    id: string;
//    name: string;
// }
```

```typescript
// 删除属性中的可选属性
type Concrete<Type> = {
  [Property in keyof Type]-?: Type[Property];
};
 
type MaybeUser = {
  id: string;
  name?: string;
  age?: number;
};
 
type User = Concrete<MaybeUser>;
// type User = {
//    id: string;
//    name: string;
//    age: number;
// }
```

## 通过 `as` 实现键名重新映射

在 TypeScript 4.1 及以后，你可以在映射类型中使用 `as` 语句实现键名重新映射：

```typescript
type MappedTypeWithNewProperties<Type> = {
    [Properties in keyof Type as NewKeyType]: Type[Properties]
}
```

举个例子，你可以利用「[模板字面量类型](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html)」，基于之前的属性名创建一个新属性名：

```typescript
type Getters<Type> = {
    // 这里就是通过as 进行重新映射
    // 前缀get+首字母大写的Property
    [Property in keyof Type as `get${Capitalize<string & Property>}`]: () => Type[Property]
};
 
interface Person {
    name: string;
    age: number;
    location: string;
}
 
type LazyPerson = Getters<Person>;

// type LazyPerson = {
//    getName: () => string;
//    getAge: () => number;
//    getLocation: () => string;
// }
```

你也可以利用条件类型返回一个 `never` 从而过滤掉某些属性:

```typescript
// Remove the 'kind' property
type RemoveKindField<Type> = {
    [Property in keyof Type as Exclude<Property, "kind">]: Type[Property]
};
 
interface Circle {
    kind: "circle";
    radius: number;
}
 
type KindlessCircle = RemoveKindField<Circle>;

// type KindlessCircle = {
//    radius: number;
// }
```

你还可以遍历任何联合类型，不仅仅是 `string | number | symbol` 这种联合类型，可以是任何类型的联合：

```typescript
type EventConfig<Events extends { kind: string }> = {
    [E in Events as E["kind"]]: (event: E) => void;
}
 
type SquareEvent = { kind: "square", x: number, y: number };
type CircleEvent = { kind: "circle", radius: number };
 
type Config = EventConfig<SquareEvent | CircleEvent>
// type Config = {
//    square: (event: SquareEvent) => void;
//    circle: (event: CircleEvent) => void;
// }
```

映射类型也可以跟其他的功能搭配使用，举个例子，这是一个使用条件类型的映射类型，会根据对象是否有 `pii` 属性返回 `true` 或者 `false` :

```typescript
type ExtractPII<Type> = {
  [Property in keyof Type]: Type[Property] extends { pii: true } ? true : false;
};
 
type DBFields = {
  id: { format: "incrementing" };
  name: { type: string; pii: true };
};
 
type ObjectsNeedingGDPRDeletion = ExtractPII<DBFields>;
// type ObjectsNeedingGDPRDeletion = {
//    id: false;
//    name: true;
// }
```

## 模板字面量类型

模板字面量类型以[字符串字面量类型](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types)为基础，可以通过联合类型扩展成多个字符串。



它们跟 JavaScript 的模板字符串是相同的语法，但是只能用在类型操作中。当使用模板字面量类型时，它会替换模板中的变量，返回一个新的字符串字面量：

```typescript
type World = "world";
 
type Greeting = `hello ${World}`;
// type Greeting = "hello world"
```

当模板中的变量是一个联合类型时，每一个可能的字符串字面量都会被表示：

```typescript
type EmailLocaleIDs = "welcome_email" | "email_heading";
type FooterLocaleIDs = "footer_title" | "footer_sendoff";
 
type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
// type AllLocaleIDs = "welcome_email_id" | "email_heading_id" | "footer_title_id" | "footer_sendoff_id"
```

如果模板字面量里的多个变量都是联合类型，结果会交叉相乘，比如下面的例子就有 2 * 2 * 3 一共 12 种结果：

```typescript
type AllLocaleIDs = `${EmailLocaleIDs | FooterLocaleIDs}_id`;
type Lang = "en" | "ja" | "pt";
 
type LocaleMessageIDs = `${Lang}_${AllLocaleIDs}`;
// type LocaleMessageIDs = "en_welcome_email_id" | "en_email_heading_id" | "en_footer_title_id" | "en_footer_sendoff_id" | "ja_welcome_email_id" | "ja_email_heading_id" | "ja_footer_title_id" | "ja_footer_sendoff_id" | "pt_welcome_email_id" | "pt_email_heading_id" | "pt_footer_title_id" | "pt_footer_sendoff_id"
```

### 类型中的字符串联合类型（String Unions in Types）

模板字面量最有用的地方在于你可以基于一个类型内部的信息，定义一个新的字符串，让我们举个例子：



有这样一个函数 `makeWatchedObject`， 它会给传入的对象添加了一个 `on`  方法。在 JavaScript 中，它的调用看起来是这样：`makeWatchedObject(baseObject)`，我们假设这个传入对象为：

```typescript
const passedObject = {
  firstName: "Saoirse",
  lastName: "Ronan",
  age: 26,
};
```

这个 `on` 方法会被添加到这个传入对象上，该方法接受两个参数，`eventName` （ `string` 类型） 和 `callBack` （`function` 类型）：

```typescript
// 伪代码
const result = makeWatchedObject(baseObject);
result.on(eventName, callBack);
```

我们希望 `eventName` 是这种形式：`attributeInThePassedObject + "Changed"` ，举个例子，`passedObject` 有一个属性 `firstName`，对应产生的 `eventName` 为 `firstNameChanged`，同理，`lastName` 对应的是 `lastNameChanged`，`age` 对应的是 `ageChanged`。



当这个 `callBack` 函数被调用的时候：



- 应该被传入与 `attributeInThePassedObject` 相同类型的值。比如 `passedObject` 中， `firstName` 的值的类型为 `string` , 对应 `firstNameChanged` 事件的回调函数，则接受传入一个 `string`  类型的值。`age` 的值的类型为 `number`，对应 `ageChanged` 事件的回调函数，则接受传入一个 `number` 类型的值。
- 返回值类型为 `void` 类型。

`on()` 方法的签名最一开始是这样的：`on(eventName: string, callBack: (newValue: any) => void)`。 使用这样的签名，我们是不能实现上面所说的这些约束的，这个时候就可以使用模板字面量：

```typescript
const person = makeWatchedObject({
    firstName: 'Saoirse',
    lastName: 'Ronan',
    age: 26
})

// makeWatchedObject has added `on` to the anonymous Object
person.on("firstNameChanged", (newValue) => {
  console.log(`firstName was changed to ${newValue}!`);
});
```

注意这个例子里，`on` 方法添加的事件名为 `"firstNameChanged"`， 而不仅仅是 `"firstName"`，而回调函数传入的值 `newValue` ，我们希望约束为 `string` 类型。我们先实现第一点。



在这个例子里，我们希望传入的事件名的类型，是对象属性名的联合，只是每个联合成员都还在最后拼接一个 `Changed` 字符，在 JavaScript 中，我们可以做这样一个计算：

```typescript
Object.keys(passedObject).map(x => ${x}Changed)
```

模板字面量提供了一个相似的字符串操作：

```typescript
type PropEventSource<Type> = {
    on(eventName: `${string & keyof Type}Changed`, callback: (newValue: any) => void): void;
};
 
/// Create a "watched object" with an 'on' method
/// so that you can watch for changes to properties.

declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>;
```

注意，我们在这里例子中，模板字面量里我们写的是 string & keyof Type，我们可不可以只写成 keyof Type 呢？如果我们这样写，会报错：

```typescript
type PropEventSource<Type> = {
    on(eventName: `${keyof Type}Changed`, callback: (newValue: any) => void): void;
};

// Type 'keyof Type' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
// Type 'string | number | symbol' is not assignable to type 'string | number | bigint | boolean | null | undefined'.
// ...
```

从报错信息中，我们也可以看出报错原因，在 [《TypeScript 系列之 Keyof 操作符》](https://github.com/mqyqingfeng/Blog/issues/223)里，我们知道 `keyof` 操作符会返回 `string | number | symbol` 类型，但是模板字面量的变量要求的类型却是 `string | number | bigint | boolean | null | undefined`，比较一下，多了一个 symbol 类型，所以其实我们也可以这样写：

```typescript
type PropEventSource<Type> = {
    on(eventName: `${Exclude<keyof Type, symbol>}Changed`, callback: (newValue: any) => void): void;
};
```

再或者这样写：

```typescript
type PropEventSource<Type> = {
     on(eventName: `${Extract<keyof Type, string>}Changed`, callback: (newValue: any) => void): void;
};
```

### 模板字面量的推断

现在我们来实现第二点，回调函数传入的值的类型与对应的属性值的类型相同。我们现在只是简单的对 `callBack` 的参数使用 `any` 类型。实现这个约束的关键在于借助泛型函数：



1. 捕获泛型函数第一个参数的字面量，生成一个字面量类型
2. 该字面量类型可以被对象属性构成的联合约束
3. 对象属性的类型可以通过索引访问获取
4. 应用此类型，确保回调函数的参数类型与对象属性的类型是同一个类型

```typescript
type PropEventSource<Type> = {
    on<Key extends string & keyof Type>
        (eventName: `${Key}Changed`, callback: (newValue: Type[Key]) => void ): void;
};
 
declare function makeWatchedObject<Type>(obj: Type): Type & PropEventSource<Type>;

const person = makeWatchedObject({
  firstName: "Saoirse",
  lastName: "Ronan",
  age: 26
});
 
person.on("firstNameChanged", newName => {                             
														  // (parameter) newName: string
    console.log(`new name is ${newName.toUpperCase()}`);
});
 
person.on("ageChanged", newAge => {
                        // (parameter) newAge: number
    if (newAge < 0) {
        console.warn("warning! negative age");
    }
})
```

这里我们把 `on` 改成了一个泛型函数。



当一个用户调用的时候传入 `"firstNameChanged"`，TypeScript 会尝试着推断 `Key` 正确的类型。它会匹配 `key` 和 `"Changed"` 前的字符串 ，然后推断出字符串 `"firstName"` ，然后再获取原始对象的 `firstName` 属性的类型，在这个例子中，就是 `string` 类型。
