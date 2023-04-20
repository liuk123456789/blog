---
title: TS object系列
date: 2023-03-08
categories: 
 - TypeScript
tags:
 - ts object
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)

## 对象类型（Object Types)

在 JavaScript 中，最基本的将数据成组和分发的方式就是通过对象。在 TypeScript 中，我们通过对象类型（object types）来描述对象。

对象类型可以是匿名的

```typescript
function greet(person: { name: string, age: number }) {
    return 'Hello' + person.name
}
```

也可以通过接口进行定义

```typescript
interface Person {
    name: string;
    age: number;
}

function greet(person: Person) {
    return 'Hello' + person.name
}
```

或者通过类型别名

```typescript
type Person = {
    name: string;
    age: number;
}

function greet(person: Person) {
    return 'Hello' + person.name
}
```

## 属性修饰符

对象类型中的每个属性可以说明它的类型、属性是否可选、属性是否只读等信息。

### 可选属性

在属性名后面加一个 `?` 标记表示这个属性是可选的：

```typescript
interface PaintOptions {
	shape: Shape;
    xPos?: number;
    yPos?: number;
}

function paintShape(opts: PaintOptions) {
    // ...
}

const shape = getShape()
paintShape({ shape });
paintShape({ shape, xPos: 100 });
paintShape({ shape, yPos: 100 });
paintShape({ shape, xPos: 100, yPos: 100 });
```

### readonly属性

在 TypeScript 中，属性可以被标记为 `readonly`，这不会改变任何运行时的行为，但在类型检查的时候，一个标记为 `readonly`的属性是不能被写入的。

```typescript
interface SomeType {
    readonly prop: string;
}

function doSomething(obj: SomeType) {
  // 可以get.
  console.log(`prop has the value '${obj.prop}'.`);
 
  // 无法重新赋值
  obj.prop = "hello";
  // Cannot assign to 'prop' because it is a read-only property.
}
```

不过使用 `readonly` 并不意味着一个值就完全是不变的，亦或者说，内部的内容是不能变的。`readonly` 仅仅表明属性本身是不能被重新写入的。

```typescript
interface Home {
  readonly resident: { name: string; age: number };
}
 
function visitForBirthday(home: Home) {
  // We can read and update properties from 'home.resident'.
  console.log(`Happy birthday ${home.resident.name}!`);
  home.resident.age++;
}
 
function evict(home: Home) {
  // But we can't write to the 'resident' property itself on a 'Home'.
  home.resident = {
  // Cannot assign to 'resident' because it is a read-only property.
    name: "Victor the Evictor",
    age: 42,
  };
}
```

TypeScript 在检查两个类型是否兼容的时候，并不会考虑两个类型里的属性是否是 `readonly`，这就意味着，`readonly` 的值是可以通过别名修改的。

```typescript
interface Person {
  name: string;
  age: number;
}
 
interface ReadonlyPerson {
  readonly name: string;
  readonly age: number;
}
 
let writablePerson: Person = {
  name: "Person McPersonface",
  age: 42,
};
 
// works
let readonlyPerson: ReadonlyPerson = writablePerson;
 
console.log(readonlyPerson.age); // prints '42'
writablePerson.age++;
console.log(readonlyPerson.age); // prints '43'
```

### 索引签名

有的时候，你不能提前知道一个类型里的所有属性的名字，但是你知道这些值的特征。



这种情况，你就可以用一个索引签名 (index signature) 来描述可能的值的类型，举个例子：

```typescript
interface StringArray {
  [index: number]: string;
}
 
const myArray: StringArray = getStringArray();
const secondItem = myArray[1]; // const secondItem: string
```

这样，我们就有了一个具有索引签名的接口 `StringArray`，这个索引签名表示当一个 `StringArray` 类型的值使用 `number` 类型的值进行索引的时候，会返回一个 `string`类型的值。



一个索引签名的属性类型必须是 `string` 或者是 `number`。



虽然 TypeScript 可以同时支持 `string` 和 `number` 类型，但数字索引的返回类型一定要是字符索引返回类型的子类型。这是因为当使用一个数字进行索引的时候，JavaScript 实际上把它转成了一个字符串。这就意味着使用数字 100 进行索引跟使用字符串 100 索引，是一样的。

```typescript
interface Animal {
  name: string;
}
 
interface Dog extends Animal {
  breed: string;
}
 
// Error: indexing with a numeric string might get you a completely separate type of Animal!
interface NotOkay {
  [x: number]: Animal;
  // 'number' index type 'Animal' is not assignable to 'string' index type 'Dog'.
  [x: string]: Dog;
}
```

尽管字符串索引用来描述字典模式（dictionary pattern）非常的有效，但也会强制要求所有的属性要匹配索引签名的返回类型。这是因为一个声明类似于 `obj.property` 的字符串索引，跟 `obj["property"]`是一样的。在下面的例子中，`name` 的类型并不匹配字符串索引的类型，所以类型检查器会给出报错：

```typescript
interface NumberDictionary {
  [index: string]: number;
 
  length: number; // ok
  name: string;
	// Property 'name' of type 'string' is not assignable to 'string' index type 'number'.
}
```

### 属性继承

有时我们需要一个比其他类型更具体的类型。举个例子，假设我们有一个 `BasicAddress` 类型用来描述在美国邮寄信件和包裹的所需字段。

```typescript
interface BasicAddress {
    name?: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
}
```

这在一些情况下已经满足了，但同一个地址的建筑往往还有不同的单元号，我们可以再写一个 `AddressWithUnit`：

```typescript
interface AddressWithUnit {
    name?: string;
    unit: string;
    street: string;
    city: string;
    country: string;
    postalCode: string;
}
```

这样写固然可以，但为了加一个字段，就是要完全的拷贝一遍。



我们可以改成继承 `BasicAddress`的方式来实现：

```typescript
interface BasicAddress {
  name?: string;
  street: string;
  city: string;
  country: string;
  postalCode: string; 
}

interface AddressWithUnit extends BasicAddress {
    unit: string;
}
```

对接口使用 `extends`关键字允许我们有效的从其他声明过的类型中拷贝成员，并且随意添加新成员。

接口可以继承多个类型：

```typescript
interface Colorful {
    color: string;
}

interface Circle {
    radius: number;
}

interface ColorfulCircle extends Colorful, Circle {}

const cc: ColorfulCircle = {
  color: "red",
  radius: 42,
};
```

### 交叉类型

TypeScript 也提供了名为交叉类型（Intersection types）的方法，用于合并已经存在的对象类型。

交叉类型的定义需要使用`&`操作符：

```typescript
interface Colorful {
    color: string;
}

interface Circle {
    radius: number;
}

type ColorfulCircle = Colorful & Circle;
```

### 接口继承与交叉类型

这两种方式在合并类型上看起来很相似，但实际上还是有很大的不同。最原则性的不同就是在于冲突怎么处理，这也是你决定选择那种方式的主要原因。

```typescript
interface Colorful {
  color: string;
}

interface ColorfulSub extends Colorful {
  color: number
}

// Interface 'ColorfulSub' incorrectly extends interface 'Colorful'.
// Types of property 'color' are incompatible.
// Type 'number' is not assignable to type 'string'.
```

使用继承的方式，如果重写类型会导致编译错误，但交叉类型不会：

```typescript
interface Colorful {
  color: string;
}

type ColorfulSub = Colorful & {
  color: number
}
```

虽然不会报错，那 `color` 属性的类型是什么呢，答案是 `never`，取得是 `string` 和 `number` 的交集。

### 泛型对象类型

### Array类型

`Array` 本身就是一个泛型

```typescript
interface Array<Type> {
  /**
   * Gets or sets the length of the array.
   */
  length: number;
 
  /**
   * Removes the last element from an array and returns it.
   */
  pop(): Type | undefined;
 
  /**
   * Appends new elements to an array, and returns the new length of the array.
   */
  push(...items: Type[]): number;
 
  // ...
}
```

现代 JavaScript 也提供其他是泛型的数据结构，比如 `Map<K, V>` ， `Set<T>` 和 `Promise<T>`。因为 `Map` 、`Set` 、`Promise`的行为表现，它们可以跟任何类型搭配使用。

### `ReadonlyArray` 类型（The ReadonlyArray Type）

`ReadonlyArray` 是一个特殊类型，它可以描述数组不能被改变。

```typescript
function doStuff(values: ReadonlyArray<string>) {
  // We can read from 'values'...
  const copy = values.slice();
  console.log(`The first value is ${values[0]}`);
 
  // ...but we can't mutate 'values'.
  values.push("hello!");
  // Property 'push' does not exist on type 'readonly string[]'.
}
```

`ReadonlyArray` 主要是用来做意图声明。当我们看到一个函数返回 `ReadonlyArray`，就是在告诉我们不能去更改其中的内容，当我们看到一个函数支持传入 `ReadonlyArray` ，这是在告诉我们我们可以放心的传入数组到函数中，而不用担心会改变数组的内容。



不像 `Array`，`ReadonlyArray` 并不是一个我们可以用的构造器函数。

```typescript
new ReadonlyArray("red", "green", "blue");
// 'ReadonlyArray' only refers to a type, but is being used as a value here.
```

然而，我们可以直接把一个常规数组赋值给 `ReadonlyArray`。

```typescript
const roArray: ReadonlyArray<string> = ["red", "green", "blue"];
```

TypeScript 也针对 `ReadonlyArray<Type>` 提供了更简短的写法 `readonly Type[]`。

```typescript
function doStuff(values: readonly string[]) {
  // We can read from 'values'...
  const copy = values.slice();
  console.log(`The first value is ${values[0]}`);
 
  // ...but we can't mutate 'values'.
  values.push("hello!");
  // Property 'push' does not exist on type 'readonly string[]'.
}
```

最后有一点要注意，就是 `Arrays` 和 `ReadonlyArray` 并不能双向的赋值：

```typescript
let x: readonly string[] = [];
let y: string[] = [];
 
x = y; // ok
y = x; // The type 'readonly string[]' is 'readonly' and cannot be assigned to the mutable type 'string[]'.
```

### 元组类型（Tuple Types）

元组类型是另外一种 `Array` 类型，当你明确知道数组包含多少个元素，并且每个位置元素的类型都明确知道的时候，就适合使用元组类型。

```typescript
type StringNumberPair = [string, number];
```

在这个例子中，`StringNumberPair` 就是 `string` 和 `number` 的元组类型。



跟 `ReadonlyArray` 一样，它并不会在运行时产生影响，但是对 TypeScript 很有意义。因为对于类型系统，`StringNumberPair` 描述了一个数组，索引 0 的值的类型是 `string`，索引 1 的值的类型是 `number`。

```typescript
function doSomething(pair: [string, number]) {
  const a = pair[0];
       
const a: string
  const b = pair[1];
       
const b: number
  // ...
}
 
doSomething(["hello", 42]);
```

如果要获取元素数量之外的元素，TypeScript 会提示错误：

```typescript
function doSomething(pair: [string, number]) {
  // ...
 
  const c = pair[2];
  // Tuple type '[string, number]' of length '2' has no element at index '2'.
}
```

我们也可以使用 JavaScript 的数组解构语法解构元组：

```typescript
function doSomething(stringHash: [string, number]) {
  const [inputString, hash] = stringHash;
  console.log(inputString); // const inputString: string
  console.log(hash); // const hash: number
}
```

元组类型在重度依赖约定的 API 中很有用，因为它会让每个元素的意义都很明显。当我们解构的时候，元组给了我们命名变量的自由度。在上面的例子中，我们可以命名元素 `0` 和 `1` 为我们想要的名字。



然而，也不是每个用户都这样认为，所以有的时候，使用一个带有描述属性名字的对象也许是个更好的方式。

除了长度检查，简单的元组类型跟声明了 `length` 属性和具体的索引属性的 `Array` 是一样的。

```typescript
interface StringNumberPair {
  // specialized properties
  length: 2;
  0: string;
  1: number;
 
  // Other 'Array<string | number>' members...
  slice(start?: number, end?: number): Array<string | number>;
}
```

在元组类型中，你也可以写一个可选属性，但可选元素必须在最后面，而且也会影响类型的 `length` 。

```typescript
type Either2dOr3d = [number, number, number?];
 
function setCoordinate(coord: Either2dOr3d) {
  const [x, y, z] = coord;
              
  const z: number | undefined
 
  console.log(`Provided coordinates had ${coord.length} dimensions`);
  // (property) length: 2 | 3
}
```

Tuples 也可以使用剩余元素语法，但必须是 array/tuple 类型：

```typescript
type StringNumberBooleans = [string, number, ...boolean[]];
type StringBooleansNumber = [string, ...boolean[], number];
type BooleansStringNumber = [...boolean[], string, number];
```

有剩余元素的元组并不会设置 `length`，因为它只知道在不同位置上的已知元素信息：

```typescript
const a: StringNumberBooleans = ["hello", 1];
const b: StringNumberBooleans = ["beautiful", 2, true];
const c: StringNumberBooleans = ["world", 3, true, false, true, false, true];

console.log(a.length); // (property) length: number

type StringNumberPair = [string, number];
const d: StringNumberPair = ['1', 1];
console.log(d.length); // (property) length: 2
```

可选元素和剩余元素的存在，使得 TypeScript 可以在参数列表里使用元组，就像这样：

```typescript
function readButtonInput(...args: [string, number, ...boolean[]]) {
  const [name, version, ...input] = args;
  // ...
}
```

基本等同于：

```typescript
function readButtonInput(name: string, version: number, ...input: boolean[]) {
  // ...
}
```

### `readonly` 元组类型（readonly Tuple Types）



元组类型也是可以设置 `readonly` 的：

```typescript
function doSomething(pair: readonly [string, number]) {
  // ...
}
```

这样 TypeScript 就不会允许写入`readonly` 元组的任何属性：

```typescript
function doSomething(pair: readonly [string, number]) {
  pair[0] = "hello!";
  // Cannot assign to '0' because it is a read-only property.
}
```

在大部分的代码中，元组只是被创建，使用完后也不会被修改，所以尽可能的将元组设置为 `readonly` 是一个好习惯。



如果我们给一个数组字面量 `const` 断言，也会被推断为 `readonly` 元组类型。

```typescript
let point = [3, 4] as const;
 
function distanceFromOrigin([x, y]: [number, number]) {
  return Math.sqrt(x ** 2 + y ** 2);
}
 
distanceFromOrigin(point);

// Argument of type 'readonly [3, 4]' is not assignable to parameter of type '[number, number]'.
// The type 'readonly [3, 4]' is 'readonly' and cannot be assigned to the mutable type '[number, number]'.
```

尽管 `distanceFromOrigin` 并没有更改传入的元素，但函数希望传入一个可变元组。因为 `point` 的类型被推断为 `readonly [3, 4]`，它跟 `[number number]` 并不兼容，所以 TypeScript 给了一个报错。
