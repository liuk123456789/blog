---
title: TS 类型挑战
date: 2023-03-10
categories: 
 - TypeScript
tags:
 - ts challenge
sidebar: auto
---

## 说明
antfu（托尼老师）发起的针对于TypeScript类型挑战的题目，也是巩固TypeScript类型使用特棒的实践

[传送门](https://github.com/type-challenges/type-challenges)

## 简单

### **Pick**

For example

```typescript
interface Todo {
  title: string
  description: string
  completed: boolean
}

type TodoPreview = MyPick<Todo, 'title' | 'completed'>

const todo: TodoPreview = {
    title: 'Clean room',
    completed: false,
}
```

Answer:

```typescript
// K extends keyof T 收窄K的类型
// keyof T 获取字符串/数字的字面量的联合类型
// [p in K]: T[p] 类型映射,意思是遍历K,获取对应的属性

type MyPick<T, K extends keyof T> = {
  [p in K]: T[p]
}
```

### **Readonly**

For Example

```typescript
interface Todo {
  title: string
  description: string
}

const todo: MyReadonly<Todo> = {
  title: "Hey",
  description: "foobar"
}

todo.title = "Hello" // Error: cannot reassign a readonly property
todo.description = "barFoo" // Error: cannot reassign a readonly property
```

Answer

```typescript
// 和Pick相似，都是进行类型映射
type MyReadonly<T> = {
    readonly [p in keyof T]: T[p]
}
```

### **Tuple to Object**

For example

```typescript
const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const

type result = TupleToObject<typeof tuple> // expected { 'tesla': 'tesla', 'model 3': 'model 3', 'model X': 'model X', 'model Y': 'model Y'}
```

Answer:

```typescript
type TupleToObject<T extends readonly (string | number)[]> = {
  [p in T[number]]: p
}
```

原理

```typescript
const tuple = ['tesla', 'model 3', 'model X', 'model Y'] as const;

type a = typeof tuple // readonly ['tesla', 'model 3', 'model X', 'model Y']

type b = typeof tuple[number] // 'tesla' | 'model 3' | 'model X' | 'model Y'
```

### **First of Array**

For example:

```typescript
type arr1 = ['a', 'b', 'c']
type arr2 = [3, 2, 1]

type head1 = First<arr1> // expected to be 'a'
type head2 = First<arr2> // expected to be 3
```

Answer:

```typescript
// 两种解法

// 判定数组长度是否等于0，否的话直接取T[0]
type First<T extends any[]> = T extends {length: 0} ? never : T[0]

// 通过infer 类型推断
type First<T extends any[]> = T extends [infer A, ...infer B] ? A : never
```

### **Length of Tuple**

For example

```typescript
type tesla = ['tesla', 'model 3', 'model X', 'model Y']
type spaceX = ['FALCON 9', 'FALCON HEAVY', 'DRAGON', 'STARSHIP', 'HUMAN SPACEFLIGHT']

type teslaLength = Length<tesla>  // expected 4
type spaceXLength = Length<spaceX> // expected 5
```

Answer

```typescript
// 数组存在length属性，对应数组的长度
type Length<T extends readonly unknown[]> = T['length']
```

### **Exclude**

For example

```typescript
type Result = MyExclude<'a' | 'b' | 'c', 'a'> // 'b' | 'c'
```

Answer

```typescript
// 原因：泛型中使用条件类型的时候，如果传入一个联合类型，就会变成分发的（distributive）
// 可以这样理解 ’a' extends 'a' ? never : 'a' | 'b' extends 'a' ? never : 'b' | 'c' extends 'a' ? never : 'c'
type MyExclude<T, U> = T extends U ? never : T
```

### **Awaited**

For example

```typescript
type ExampleType = Promise<string>

type Result = MyAwaited<ExampleType> // string
```

Answer

```typescript
// PromiseLike 类Promise对象
// 通过infer A 推断 A 是不是PromiseLike,如果是，递归下，否则返回A
type MyAwaited<T extends PromiseLike<any>> = T extends PromiseLike<infer A> ? (A extends PromiseLike<any> ? MyAwaited<A> : A) : never
```

### **If**

For example

```typescript
type A = If<true, 'a', 'b'>  // expected to be 'a'
type B = If<false, 'a', 'b'> // expected to be 'b'
```

Answer

```typescript
type If<C extends boolean, T, F> = C extends true ? T : F
```

### **Concat**

For example

```typescript
type Result = Concat<[1], [2]> // expected to be [1, 2]
```

Answer

```typescript
type Concat<T extends unknown[], U extends unknown[]> = [...T, ...U]
```

### **Includes**

For example

```typescript
type isPillarMen = Includes<['Kars', 'Esidisi', 'Wamuu', 'Santana'], 'Dio'> // expected to be `false`
```

Answer

```typescript
// 利用类型推导infer 获取数组的第一个元素，进行比对，如果不等，递归下
type Includes<T extends readonly any[], U> = T extends [infer F, ...infer R] ? (Equal<F,U> extends true ? true : Includes<R, U>) : false
```

### **Push**

For example

```typescript
type Result = Push<[1, 2], '3'> // [1, 2, '3']
```

Answer

```typescript
// 利用解构
type Push<T extends unknown[], U> = [...T, U]
```

### **Unshift**

For example

```typescript
type Result = Unshift<[1, 2], 0> // [0, 1, 2,]
```

Answer

```typescript
// 同push
type Unshift<T extends unknown[], U> = [U, ...T]
```

### **Parameters**

For example

```typescript
const foo = (arg1: string, arg2: number): void => {}

type FunctionParamsType = MyParameters<typeof foo> // [arg1: string, arg2: number]
```

Answer

```typescript
type MyParameters<T extends (...args: any[]) => any> = T extends(...args: infer A) => any ? A : never
```

## 适中

### **Get Return Type**

For example

```typescript
const fn = (v: boolean) => {
    if(v)
      return 1
    else return 2
}
```

Answer

```typescript
type MyReturnType<T> = T extends (...args: any[]) => infer A ? A : never 

```

### **Omit**

For example

```typescript
interface Todo {
  title: string
  description: string
  completed: boolean
}

type TodoPreview = MyOmit<Todo, 'description' | 'title'>

const todo: TodoPreview = {
  completed: false,
}
```

Answer

```typescript
// as 用于实现键名重新映射
type MyOmit<T, K extends keyof T> = {
  [p in keyof T as p extends K ? never : p]: T[p]
}
```

### **Readonly2**

For example

```typescript
interface Todo {
	title: string,
	description: string,
	completed: boolean
}

const todo: MyReadonly2<Todo, 'title' | 'description'> = {
  title: "Hey",
  description: "foobar",
  completed: false,
}

todo.title = 'hello'
todo.description = 'barFoo'
todo.completed = true
```

Answer

```typescript
// k extends keyof T = keyof T 为了兼容K为null
// p in keyof T as p extends K  as 是为了实现键名的重新映射
// 所以p in keyof T as p extends K ? never : p意思是p是T的属性，
// 然后进行类型约束（p extends K) 如果是 筛掉，否则就是p,然后通过as 重新映射
type MyReadonly2<T, K extends keyof T = keyof T> = {
  readonly [key in K]: T[key]
} & {
  [p in keyof T as p extends K ? never : p]: T[p]
}
```

### **Deep Readonly**

For example

```typescript
type X = { 
  x: { 
    a: 1
    b: 'hi'
  }
  y: 'hey'
}

type Expected = { 
  readonly x: { 
    readonly a: 1
    readonly b: 'hi'
  }
  readonly y: 'hey' 
}

type Todo = DeepReadonly<X> // should be same as `Expected`
```

Answer:

```typescript
// keyof T[key] extends never 用于判定T[key]是否存在子属性
type DeepReadonly<T> = {
  readonly [key in keyof T]: keyof T[key] extends never ? T[key] : DeepReadonly<T[key]>
}
```

### **Tuple to Union**

For example

```typescript
type Arr = ['1', '2', '3']

type Test = TupleToUnion<Arr> // expected to be '1' | '2' | '3'
```

Answer

```typescript
type TupleToUnion<T extends unknown[]> = T[number]
```

### **Chainable Options**

For example

```typescript
declare const config: Chainable

const result = config
  .option('foo', 123)
  .option('name', 'type-challenges')
  .option('bar', { value: 'Hello World' })
  .get()

// expect the type of result to be:
interface Result {
  foo: number
  name: string
  bar: {
    value: string
  }
}
```

Answer : 未写出来，待更

### **Last  of Array**

For example

```typescript
type arr1 = ['a', 'b', 'c']
type arr2 = [3, 2, 1]

type tail1 = Last<arr1> // expected to be 'c'
type tail2 = Last<arr2> // expected to be 1
```

Answer

```typescript
// 参考First of Array
type Last<T extends any[]> = T extends [...infer R, infer L] ? L : never
```

### **Pop**

For example

```typescript
type arr1 = ['a', 'b', 'c', 'd']
type arr2 = [3, 2, 1]

type re1 = Pop<arr1> // expected to be ['a', 'b', 'c']
type re2 = Pop<arr2> // expected to be [3, 2]
```

Answer 同`push`和`unshift`

### **Promise.all**

For example

```typescript
const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise<string>((resolve, reject) => {
  setTimeout(resolve, 100, 'foo');
});

// expected to be `Promise<[number, 42, string]>`
const p = PromiseAll([promise1, promise2, promise3] as const)
```

Answer

```typescript
type MyAwaited<T> = T extends PromiseLike<infer U> ? U : T

declare function PromiseAll<T extends unknow[]>(value: readonly[...T]) : Promise<{
    [key in keyof T]: MyAwaited<T<key>>
}>
```

### **Type Lookup**

For example

```typescript
interface Cat {
  type: 'cat'
  breeds: 'Abyssinian' | 'Shorthair' | 'Curl' | 'Bengal'
}

interface Dog {
  type: 'dog'
  breeds: 'Hound' | 'Brittany' | 'Bulldog' | 'Boxer'
  color: 'brown' | 'white' | 'black'
}

type MyDogType = LookUp<Cat | Dog, 'dog'> // expected to be `Dog`
```

Answer

```typescript
type LookUp<U, T> = U extends { type: T } ? U: never 
```

### **Trim Left**

For example

```typescript
type trimed = TrimLeft<'  Hello World  '> // expected to be 'Hello World  '
```

Answer

```typescript
// `${WhiteSpace}${infer R}` 模板字面量类型
type WhiteSpace = '\n' | '\t' | ' '
type TrimLeft<S extends string> = S extends `${WhiteSpace}${infer R}` ? TrimRight<R> : S
```

### **Trim**

For example

```typescript
type trimmed = Trim<'  Hello World  '> // expected to be 'Hello World'
```

Answer

```typescript
type WhiteSpace = '\n' | '\t' | ' '
type TrimLeft<S extends string> = S extends `${WhiteSpace}${infer R}` | `${infer R}${WhiteSpace}` ? TrimLeft<R> : S
```

### **Capitalize**

For example

```typescript
type capitalized = Capitalize<'hello world'> // expected to be 'Hello world'
```

Answer

```typescript
type MyCapitalize<S extends string> = S extends `${infer F}${infer R}` ? `${Uppercase<F>}${R}` : S
```

### **Replace**

For example

```typescript
type replaced = Replace<'types are fun!', 'fun', 'awesome'> // expected to be 'types are awesome!'
```

Answer

```typescript
type Replace<S extends string, From extends string, To extends string> = From extends '' ? S : S extends `${infer F}${From}${infer R}` ? `${F}${To}${R}`: S
```

### **ReplaceAll**

Form example

```typescript
type replaced = ReplaceAll<'t y p e s', ' ', ''> // expected to be 'types'
```

Answer

```typescript
type ReplaceAll<
  S extends string,
  From extends string,
  To extends string
> = From extends ''
  ? S
  : S extends `${infer S}${From}${infer E}`
  ? `${S}${To}${ReplaceAll<E, From, To>}`
  : S

```

### **Append Argument**

For example

```typescript
type Fn = (a: number, b: string) => number

type Result = AppendArgument<Fn, boolean>
```

Answer

```typescript
// 主要就是利用类型推导 infer 进行数据合并
type AppendArgument<Fn, A> = Fn extends (...args: [...infer P]) => infer R ? (...args: [...P, A]) => R
```

### **Permutation**

全排列
For example

```typescript
type perm = Permutation<'A' | 'B' | 'C'>; // ['A', 'B', 'C'] | ['A', 'C', 'B'] | ['B', 'A', 'C'] | ['B', 'C', 'A'] | ['C', 'A', 'B'] | ['C', 'B', 'A']
```

Answer

没写出来，参考别人的

[答案传送门](https://github.com/type-challenges/type-challenges/issues/12994)

```typescript
// 官方文档中，介绍了一种操作，叫 Distributive conditional types
// 简单来说，传入给T extends U中的T如果是一个联合类型A | B | C，则这个表达式会被展开成
// (A extends U ? X : Y) | (B extends U ? X : Y) | (C extends U ? X : Y)
// [U] extends [never] 而不是 U extends never 因为  U是联合类型 条件类型会走分配得到的是一个联合类型  不符合期望
type Permutation<T, C = T> = [T] extends [never] ? [] : C extends infer U ? [U, ...Permutation<Exclude<T, U>>] : never
```

### **Length of String**

字符串长度

Answer

```typescript
// 因为数组可以通过length 获取长度，所以思路就是将字符切割成数组
// 利用类型推导 & 递归 将字符串字符挨个放入数组中
// 最后取length 即可
type LengthOfString<S extends string, L extends unknown[] = []> = S extends `${infer F}${infer R}` ? LengthOfString<R, [F, ...L]> : L['length']
```

### **Flatten**

For example

```typescript
type flatten = Flatten<[1, 2, [3, 4], [[[5]]]]> // [1, 2, 3, 4, 5]
```

Answer

```typescript
// 递归判定是数组的元素是否时数组
type Flatten<T extends unknown[]> = T extends [infer F, ...infer R]
    ? F extends any[]
        ? Flatten<[...F, ...R]>
        : [F, ...Flatten<R>]
    : T;
```

### **Append to object**

For example

```typescript
type Test = { id: '1' }
type Result = AppendToObject<Test, 'value', 4> // expected to be { id: '1', value: 4 }
```

Answer

```typescript
type AppendToObject<T extends object, U extends PropertyKey, V> = T & Record<U, V> extends infer R ? {
  [K in keyof R]: R[K]
} : never
```

### **Absolute**

For example

```typescript
type Test = -100;
type Result = Absolute<Test>; // expected to be "100"
```

Answer

```typescript
type Absolute<T extends number | string | bigint> = `${T}` extends `-${infer U}` ? U : `${T}`
```

### **String to Union**

For example

```typescript
type Test = '123';
type Result = StringToUnion<Test>; // expected to be "1" | "2" | "3"
```

Answer

第一种

```typescript
type StringToUnion<T extends string> = T extends `${infer F}${infer R}` ? F | StringToUnion<R> :never
```

第二种

```typescript
type Split<S extends string> = S extends ''
  ? []
  : S extends `${infer F}${infer R}`
  ? [F, ...Split<R>]
  : [S]

type StringToUnion<T extends string> = Split<T>[number]
```

### **Merge**

For example

```typescript
type foo = {
  name: string;
  age: string;
}
type coo = {
  age: number;
  sex: string
}

type Result = Merge<foo,coo>; // expected to be {name: string, age: number, sex: string}
```

Answer

```typescript
// 相同属性，S 优先级高， 所以先判定是否在S中
// 在判断是否在F中
type Merge<F extends object, S extends object> = {
  [key in keyof F | keyof S]: key extends keyof S ? S[key] : key extends keyof F ? F[key] : never
}
```

### **KebabCase**

For example

```typescript
type FooBarBaz = KebabCase<"FooBarBaz">;
const foobarbaz: FooBarBaz = "foo-bar-baz";

type DoNothing = KebabCase<"do-nothing">;
const doNothing: DoNothing = "do-nothing";
```

Answer

```typescript
// R extends Uncapitalize<R> 判定是否是小写字母
// '-' extends Uncapitalize<'-'> ? true :false ==> true
type KebabCase<Str extends string> =
  Str extends `${infer F}${infer R}`
    ? R extends Uncapitalize<R>
      ? `${Lowercase<F>}${KebabCase<R>}`
      : `${Lowercase<F>}-${KebabCase<R>}`
    : Str;
```

### **Diff**

For example

```typescript
Get an Object that is the difference between O & O1
```

Answer

```typescript
type Diff<O,O1> = {
    [key in Exclude<keyof O1, keyof O> | Exclude<keyof O, keyof O1>]: (O&O1)[key];
}
```

### **AnyOf**

For example

```typescript
type Sample1 = AnyOf<[1, '', false, [], {}]> // expected to be true.
type Sample2 = AnyOf<[0, '', false, [], {}]> // expected to be false.
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/13226)

```typescript
//判断真假时注意  可以直接extends[] 判断数组真假，但是对象不可以，对象必须判断有无键值
type IsTrue<T> = T extends '' | [] | false | 0 ? false : T extends {} ? keyof T extends never ? false :  true : false
type AnyOf<T extends readonly any[]> = T extends [infer F, ...infer Rest] ?  IsTrue<F> extends true ? true : AnyOf<Rest> : IsTrue<T[0]>
```

### **IsNever**

For example

```typescript
type A = IsNever<never>  // expected to be true
type B = IsNever<undefined> // expected to be false
type C = IsNever<null> // expected to be false
type D = IsNever<[]> // expected to be false
type E = IsNever<number> // expected to be false
```

Answer

```typescript
// [U] extends [never] 而不是 U extends never U是联合类型 条件类型会走分配得到的是一个联合类型
type isNever<T> = [T] extends [never] ? true : false
```

### **isUnion**

For example

```typescript
type case1 = IsUnion<string>  // false
type case2 = IsUnion<string|number>  // true
type case3 = IsUnion<[string|number]>  // false
```

Answer

```typescript
type isNever<T> = [T] extends [never] ? true : false
// [C] extends [T] 这里需要注意下
// type test1 = number | 1
// type test2 = [test] => [number]
// [test2] extends [test1] => false
type IsUnion<T, C = T> = isNever<T> extends true ? false : T extends C ? [C] extends [T] ? false : true : false
```

### **ReplaceKeys**

For example

```typescript
type NodeA = {
  type: 'A'
  name: string
  flag: number
}

type NodeB = {
  type: 'B'
  id: number
  flag: number
}

type NodeC = {
  type: 'C'
  name: string
  flag: number
}


type Nodes = NodeA | NodeB | NodeC

type ReplacedNodes = ReplaceKeys<Nodes, 'name' | 'flag', {name: number, flag: string}> // {type: 'A', name: number, flag: string} | {type: 'B', id: number, flag: string} | {type: 'C', name: number, flag: string} // would replace name from string to number, replace flag from number to string.

type ReplacedNotExistKeys = ReplaceKeys<Nodes, 'name', {aa: number}> // {type: 'A', name: never, flag: number} | NodeB | {type: 'C', name: never, flag: number} // would replace name to never
```

Answer

```typescript
type ReplaceKeys<U,T,Y> = {
    [key in keyof U]: key extends T ? (key extends keyof Y ? Y[key] : never) : U[key]
}
```

### **Remove Index Signature**

For example

```typescript

type Foo = {
  [key: string]: any;
  foo(): void;
}

type A = RemoveIndexSignature<Foo>  // expected { foo(): void }
```

Answer

```typescript
// 过滤非索引类型的属性
type FilterIndexSignature<U> = string extends U ? never : number extends U ? never : symbol extends U ? never : U
type RemoveIndexSignature<T> = {
    [key in keyof T as FilterIndexSignature<U>]: T[key]
}
```

### **Percentage Parser**

For  example

```typescript
type PString1 = ''
type PString2 = '+85%'
type PString3 = '-85%'
type PString4 = '85%'
type PString5 = '85'

type R1 = PercentageParser<PString1> // expected ['', '', '']
type R2 = PercentageParser<PString2> // expected ["+", "85", "%"]
type R3 = PercentageParser<PString3> // expected ["-", "85", "%"]
type R4 = PercentageParser<PString4> // expected ["", "85", "%"]
type R5 = PercentageParser<PString5> // expected ["", "85", ""]
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/13331)

```typescript
type PercentageParser1<S extends string> = S extends `${infer A}${infer R}` ? A extends '+' | '-' ? A : '' : ''
type PercentageParser2<S extends string> = S extends `${infer A}${infer R}` ? A extends '+' | '-' | '%' ? PercentageParser2<R>: `${A}${PercentageParser2<R>}`  : ''
type PercentageParser3<S extends string> = S extends `${infer A}${infer R}` ? A extends '%' ? A : PercentageParser3<R>: ''
type PercentageParser<A extends string> = [PercentageParser1<A>, PercentageParser2<A>,PercentageParser3<A>]

// 这种挺好
// type PercentageParser<A extends string> = A extends `${infer m extends '+' | '-'}${infer k}%` ? [m, k, '%'] : A extends `${infer m extends '+' | '-'}${infer k}` ? [m, k, ''] : A extends `${infer k}%` ? ['', k, '%'] : ['', A, '']

```

### **Mutable**

For example

```typescript
interface Todo {
  readonly title: string
  readonly description: string
  readonly completed: boolean
}

type MutableTodo = Mutable<Todo> // { title: string; description: string; completed: boolean; }

```

Answer

```typescript
// type PropertyKey = string | number | symbol
type Mutable<T extends Record<PropertyKey, any>> = {
  -readonly [key in keyof T]: T[key];
}
```

### **Drop Char**

For example

```typescript
type Butterfly = DropChar<' b u t t e r f l y ! ', ' '> // 'butterfly!'
```

Answer

```typescript
// 利用类型推导 + 递归
type DropChar<S extends string, C extends string> = S extends `${infer F}${infer R}` ? F extends C ? DropChar<R, C> : `${F}${DropChar<R,C>}` : S
```

### **Minus**

For example

```typescript
type Zero = MinusOne<1> // 0
type FiftyFour = MinusOne<55> // 54
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/15967)

### **PickByType**

For example

```typescript
type OnlyBoolean = PickByType<{
  name: string
  count: number
  isReadonly: boolean
  isEnable: boolean
}, boolean> // { isReadonly: boolean; isEnable: boolean; }
```

Answer

```typescript
// 利用as 键名重新映射
type PickByType<T extends Record<PropertyKey, any>, U> = {
  [key in keyof T as T[key] extends U ? key : never]: T[key]
}
```

### **StartsWith**

For example

```typescript
type a = StartsWith<'abc', 'ac'> // expected to be false
type b = StartsWith<'abc', 'ab'> // expected to be true
type c = StartsWith<'abc', 'abcd'> // expected to be false
```

Answer

```typescript
type StartsWith<T extends string, U extends string> = T extends `${U}${infer R}` ? true : false
```

### **EndsWith**

For example

```typescript
type a = EndsWith<'abc', 'bc'> // expected to be true
type b = EndsWith<'abc', 'abc'> // expected to be true
type c = EndsWith<'abc', 'd'> // expected to be false
```

Answer(同StartsWith)

```typescript
type EndsWith<T extends string, U extends string> = T extends `${infer F}${U}` ? true : false
```

### **PartialByKeys**

For example

```typescript
interface User {
  name: string
  age: number
  address: string
}

type UserPartialName = PartialByKeys<User, 'name'> // { name?:string; age:number; address:string }
```

Answer

```typescript
type Merge<T> = {
    [key in keyof T]: T[key]
}

type PartialByKeys<T, K = any> = Merge<{
  [P in keyof T as P extends K ? P : never]?: T[P];
} & {
  [P in keyof T as P extends K ? never : P]: T[P];
}>
```

### **RequiredByKeys**

For example

```typescript
interface User {
  name?: string
  age?: number
  address?: string
}

type UserRequiredName = RequiredByKeys<User, 'name'> // { name: string; age?: number; address?: string }
```

Answer（同PartialByKeys）

```typescript
type Merge<T> = {
  [key in keyof T]: T[key]
}
type RequiredByKeys<T, K> = Merge<{
  [P in keyof T as P extends K ? P : never]-?: T[P];
} & {
  [P in keyof T as P extends K ? never : P]: T[P];
}>
```

### **OmitByType**

For example

```typescript
type OmitBoolean = OmitByType<{
  name: string
  count: number
  isReadonly: boolean
  isEnable: boolean
}, boolean> // { name: string; count: number }
```

Answer

```typescript
type OmitByType<T extends Record<PropertyKey, any>, U> = {
  [key in keyof T as T[key] extends U ? never : key]: T[key]
}
```

### **ObjectEntries**

For example

```typescript
interface Model {
  name: string;
  age: number;
  locations: string[] | null;
}
type modelEntries = ObjectEntries<Model> // ['name', string] | ['age', number] | ['locations', string[] | null];
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/18743)

```typescript
// https://ghaiklor.github.io/type-challenges-solutions/en/medium-objectentries.html
type ObjectEntries<T> = {
  // `-?` is for the undefined[any] = undefined case
  // like in `Expect<Equal<ObjectEntries<{ key?: undefined }>, ["key", undefined]>>`, will see `["key", undefined] | undefined`
  // `T[P] extends infer R | undefined ? R : T[P]` removes the partial's undefined type value
  [P in keyof T]-?: [P, T[P] extends infer R | undefined ? R : T[P]];
}[keyof T];

// 说明 类型分叉
{}[keyof T] => {}[***] | {}[***]
```

### **Shift**

For example

```typescript
type Result = Shift<[3, 2, 1]> // [2, 1]
```

Answer 参考前面的`unshift push`等写法

### **Tuple to Nested Object**

For example

```typescript
type a = TupleToNestedObject<['a'], string> // {a: string}
type b = TupleToNestedObject<['a', 'b'], number> // {a: {b: number}}
type c = TupleToNestedObject<[], boolean> // boolean. if the tuple is empty, just return the U type
```

Answer

```typescript
type TupleToNestedObject<T extends readonly string[], U> = T extends [
  infer First extends string,
  ...infer Rest,
]
  ? {
      // 获取key 对应的value， 如果剩余项存在，那么递归下
      [P in First]: Rest extends string[] ? TupleToNestedObject<Rest, U> : U
    }
  : U
```

### **Reverse**

For example

```typescript
type a = Reverse<['a', 'b']> // ['b', 'a']
type b = Reverse<['a', 'b', 'c']> // ['c', 'b', 'a']
```

Answer 参考`push`,`shift`即可

```typescript
type Reverse<T> = T extends [infer F, ...infer R] ? [...Reverse<R>, F] : T
```

### **Flip Arguments**

For example

```typescript
type Flipped = FlipArguments<(arg0: string, arg1: number, arg2: boolean) => void> 
// (arg0: boolean, arg1: number, arg2: string) => void
```

Answer

```typescript
// 反转数组
type Reverse<T extends unknown[]> = T extends [infer F, ...infer R] ? [...Reverse<R>, F] : T

// 通过Reverse 反转参数
type FlipArguments<T extends Function> = T extends (...args:[infer F, ...infer R]) => infer Y ? F extends NonNullable<unknown> ? (...args: [...Reverse<R>, F]) => Y : T : T
```

### **FlattenPath**

For example

```typescript
type a = FlattenDepth<[1, 2, [3, 4], [[[5]]]], 2> // [1, 2, 3, 4, [5]]. flattern 2 times
type b = FlattenDepth<[1, 2, [3, 4], [[[5]]]]> // [1, 2, 3, 4, [[5]]]. Depth defaults to be 1
```

Answer

```typescript
// 一次平铺的类型
type Flatten<U extends unknown[]> = U extends [infer F, ...infer R] ? F extends unknown[] ? [...F, ...Flatten<R>] : [F, ...Flatten<R>] : []

// 判定下 Depth 和 Count['length']是否相等，相等，说明不许flatten
// 不等，判定下 flatten 和 T 的结果是否一致（繁殖 Time 非常大， 导致的无必要的递归），一致，返回结果
// 否则的话就 进行平铺
type FlattenDepth<T extends unknown[], Depth extends number = 1, Counts extends unknown[] = []>= Counts['length'] extends Depth ? T : Flatten<T> extends T ? T : FlattenDepth<Flatten<T>, Depth, [...Counts, unknown]>
```

### **BEM style string**

For example

```typescript
The Block, Element, Modifier methodology (BEM) is a popular naming convention for classes in CSS.

For example, the block component would be represented as btn, element that depends upon the block would be represented as btn__price, modifier that changes the style of the block would be represented as btn--big or btn__price--warning.

Implement BEM<B, E, M> which generate string union from these three parameters. Where B is a string literal, E and M are string arrays (can be empty).
```

Answer

```typescript
type Element<T extends string[]> = [] extends T ? '' : `__${T[number]}`
type Module<M extends string[]> = [] extends M ? '' : `--${M[number]}`
type BEM<B extends string, E extends string[], M extends string[]> = `${B}${Element<E>}${Module<M>}`
```

### **InorderTrave**

For example

```typescript
const tree1 = {
  val: 1,
  left: null,
  right: {
    val: 2,
    left: {
      val: 3,
      left: null,
      right: null,
    },
    right: null,
  },
} as const

type A = InorderTraversal<typeof tree1> // [1, 3, 2]
```

Answer

```typescript
// 定义二叉树类型
interface TreeNode {
    val: number
    left: TreeNode | null
    right: TreeNode | null
}

type InorderTraversal<T extends TreeNode | null>= [T] extends [TreeNode] ? ([
   ...InorderTraversal<T['left']>,
   T['val'],
   ...InorderTraversal<T['right']>
]) : []
```

### **Flip**

For example

```typescript
Flip<{ a: "x", b: "y", c: "z" }>; // {x: 'a', y: 'b', z: 'c'}
Flip<{ a: 1, b: 2, c: 3 }>; // {1: 'a', 2: 'b', 3: 'c'}
Flip<{ a: false, b: true }>; // {false: 'a', true: 'b'}
```

Answer

```typescript
// 主要就是去字面量，还是模板字面量
type Flip<T extends Record<PropertyKey, any>> = {
  [P in keyof T as T[P] extends PropertyKey ? T[P] : `${T[P]}`]: P
}
```

### **Fibonacci Sequence**

For example

```typescript
type Result1 = Fibonacci<3> // 2
type Result2 = Fibonacci<8> // 21
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/14095)

### **AllCombinations全排列**

For example

```typescript
type AllCombinations_ABC = AllCombinations<'ABC'>;
// should be '' | 'A' | 'B' | 'C' | 'AB' | 'AC' | 'BA' | 'BC' | 'CA' | 'CB' | 'ABC' | 'ACB' | 'BAC' | 'BCA' | 'CAB' | 'CBA'
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/14096)

```typescript
// 答案
type AllCombinations<S extends string, U extends string = StrToUnion<S>> =
  [U] extends [never]
  ? ''
  : '' | {
    [K in U]: `${K}${AllCombinations<never, Exclude<U, K>>}`
  }[U]
```

### **Greater Than**

For example

```typescript
GreaterThan<2, 1> //should be true
GreaterThan<1, 1> //should be false
GreaterThan<10, 100> //should be false
GreaterThan<111, 11> //should be true
```

Answer

```typescript
type GreaterThan<T extends number, U extends number, L extends any[] = []> = T extends L['length'] ? false : U extends L['length'] ? true : GreaterThan<T,U,[...L,0]>
```

```typescript
type newArr<T extends number, A extends any[] = []> = 
  A['length'] extends T
    ? A
    : newArr<T, [...A, '']>

type GreaterArr<T extends any[], U extends any[]> = U extends [...T, ...any] ? false : true

type GreaterThan<T extends number, U extends number> = GreaterArr<newArr<T>, newArr<U>>
```

### **Zip**

For example

```typescript
type exp = Zip<[1, 2], [true, false]> // expected to be [[1, true], [2, false]]
```

Answer

```typescript
type Zip<T extends unknown[], U extends unknown[], Res extends unknown[] = []> = T extends [infer TF, ...infer TR] ? U extends [infer UF, ...infer UR] ? Zip<TR,UR, [...Res, [TF, UF]]> : Res : Res
```

### **isTuple**

For example

```typescript
type case1 = IsTuple<[number]> // true
type case2 = IsTuple<readonly [number]> // true
type case3 = IsTuple<number[]> // false
```

Answer

```typescript
type W = 1 extends 1 ? true : false; // true
type X = number extends number ? true : false; // true
type Y = number extends 1 ? true : false; // false
type Z = 1 extends number ? true : false; // true

type IsAny<T> = 1 extends T & 0 ? true : false;
type A = any & 0; // any
type B = never & 0; // never
type C = unknown & 0; // 0

type IsNever0<T> = [T] extends [never] ? true : false; // true
type IsNever1<T> = [T] extends never[] ? true : false; // true
type IsNever2<T> = T[] extends [never] ? true : false; // false
type IsNever3<T> = T[] extends never[] ? true : false; // true

type IsNever<T> = [T] extends [never] ? true : false

type IsTuple<T> = true extends IsAny<T> | IsNever<T>
    ? false
    : T extends readonly [infer _Head, ...infer _Tail] | readonly []
    ? true
    : false;
```

### **Chunk**

For example

```typescript
type exp1 = Chunk<[1, 2, 3], 2> // expected to be [[1, 2], [3]]
type exp2 = Chunk<[1, 2, 3], 4> // expected to be [[1, 2, 3]]
type exp3 = Chunk<[1, 2, 3], 1> // expected to be [[1], [2], [3]]
```

Answer

```typescript
// 主要用到的就是递归
// 如果递归后自定义结果数组的length 和 给定的chunk number 相等，放回结果
// 如果小于，那么继续递归
type Chunk<T extends any[], N extends number = 1, C extends any[] = []> = 
  T extends [infer R, ...infer U]
    ? C['length'] extends N
      ? [C, ...Chunk<T, N>]
      : Chunk<U, N, [...C, R]>
    : C extends []
      ? C
      : [C]
```

### **Trim Right**

For example

```typescript
type Trimed = TrimRight<'   Hello World    '> // expected to be '   Hello World'
```

Answer

参考下之前的**TrimLeft**

```typescript
type WhiteSpace = '\n' | '\t' | ' '
type TrimRight<S extends string>= S extends `${infer F}${WhiteSpace}` ? TrimRight<F> : S
```

### **Without**

For example

```typescript
type Res = Without<[1, 2], 1>; // expected to be [2]
type Res1 = Without<[1, 2, 4, 1, 5], [1, 2]>; // expected to be [4, 5]
type Res2 = Without<[2, 3, 2, 3, 2, 3, 2, 3], [2, 3]>; // expected to be []
```

Answer

```typescript
// 将数组转联合类型
// 通过infer 判定下数组第一个元素 是否包含在 联合类型中，
// 在的话递归剩余的元素
// 不在的话，放到返回结果中，同时继续遍历剩余元素
type toUnion<T> = T extends any[] ? T[number] : T
type Without<T extends unknown[], U> = 
  T extends [infer F, ...infer R] ? F extends toUnion<U> ? Without<R,U> : [F, ...Without<R,U>] :[]
```

### **Trunc**

For example

```typescript
type A = Trunc<12.34> // 12
```

Answer

```typescript
// 通过模板字符串 装成字符类型
// F extends '' ? '0' 为了兼容 .23 这种场景
type Trunc<T extends number | string> = `${T}` extends `${infer F}.${infer R}` ? F extends '' ? '0' : F : `${T}`
```

### **indexOf**

For example

```typescript
type IndexOf<T extends unknown[], U, Res extends unknown[] = []> = 
  T extends [infer F, ...infer R] 
  ? Equal<F, U> extends true
    ? Res['length']
    : IndexOf<R, U, [...Res, 0]>
  : -1
```

### **Join**

For example

```typescript
type Res = Join<["a", "p", "p", "l", "e"], "-">; // expected to be 'a-p-p-l-e'
type Res1 = Join<["Hello", "World"], " ">; // expected to be 'Hello World'
type Res2 = Join<["2", "2", "2"], 1>; // expected to be '21212'
type Res3 = Join<["o"], "u">; // expected to be 'o'
```

Answer

```typescript
type Join<T extends string[], U extends string | number> = 
  T extends [infer F extends string, ...infer R extends string[]] 
    ? R['length'] extends 0 
      ? F : `${F}${U}${Join<R,U>}` 
    :''
```

### **LastIndexOf**

For example

```typescript
type Res1 = LastIndexOf<[1, 2, 3, 2, 1], 2> // 3
type Res2 = LastIndexOf<[0, 0, 0], 2> // -1
```

Answer

```typescript
// 因为 1 extends number 为 true，使用 F extends U会导致测试用例通不过
// 所以使用 Equal 判定是否相等
// 而R['length'] 刚好对应了查找的下标
type LastIndexOf<T extends unknown[], U> = 
  T extends [...infer R, infer F] 
    ? Equal<F,U> extends true 
      ? R['length'] : LastIndexOf<R, U> 
    : -1
```

### **Unique**

For example

```typescript
type Res = Unique<[1, 1, 2, 2, 3, 3]>; // expected to be [1, 2, 3]
type Res1 = Unique<[1, 2, 3, 4, 4, 5, 6, 7]>; // expected to be [1, 2, 3, 4, 5, 6, 7]
type Res2 = Unique<[1, "a", 2, "b", 2, "a"]>; // expected to be [1, "a", 2, "b"]
type Res3 = Unique<[string, number, 1, "a", 1, string, 2, "b", 2, number]>; // expected to be [string, number, 1, "a", 2, "b"]
type Res4 = Unique<[unknown, unknown, any, any, never, never]>; // expected to be [unknown, any, never]
```

Answer

```typescript
type IsInclude<T extends unknown[], U> = T extends [infer F, ...infer R] ? Equal<F,U> extends true ? true : IsInclude<R,U> : false

type Unique<T extends unknown[], Res extends unknown[] = []> = 
  T extends [infer F, ...infer R]
    ? IsInclude<Res, F> extends true 
      ? Unique<R, Res> : Unique<R, [...Res, F]>
    : Res
```

### **MapTypes**

For example

```typescript
type StringToNumber = { mapFrom: string; mapTo: number;}
MapTypes<{iWillBeANumberOneDay: string}, StringToNumber> // gives { iWillBeANumberOneDay: number; }
```

Be aware that user can provide a union of types:

```
type StringToNumber = { mapFrom: string; mapTo: number;}
type StringToDate = { mapFrom: string; mapTo: Date;}
MapTypes<{iWillBeNumberOrDate: string}, StringToDate | StringToNumber> // gives { iWillBeNumberOrDate: number | Date; }
```

If the type doesn't exist in our map, leave it as it was:

```typescript
type StringToNumber = { mapFrom: string; mapTo: number;}
MapTypes<{iWillBeANumberOneDay: string, iWillStayTheSame: Function}, StringToNumber> // // gives { iWillBeANumberOneDay: number, iWillStayTheSame: Function }
```

Answer

题目的意思是让`T`,跟随`R`的类型进行转换

```typescript
// 第一版 如果R 是联合类型，那么R['mapTo']是无法获取类型的，导致测试用例无法通过
// type MapTypes<T, R extends { mapFrom: any, mapTo: any }> = {
   // [key in keyof T] : T[key] extends R['mapFrom'] ? R['mapTo'] : T[key]
// }

// 第二版 利用联合类型 在条件判断中的distributive（分发）特性
type MapTypes<T, R extends { mapFrom: any, mapTo: any }> = {
  [key in keyof T] : T[key] extends R['mapFrom'] 
  ? R extends { mapFrom: T[key] } 
    ? R['mapTo'] : never 
  : T[key]
}
```

### **Construct Tuple**

For example

```typescript
type result = ConstructTuple<2> // expect to be [unknown, unkonwn]
```

Answer

```typescript
type ConstructTuple<L extends number, Res extends unknown[] = []> = L extends 0 ? Res : L extends Res['length'] ? Res : ConstructTuple<L, [...Res, unknown]>
```

### **Number Range**

For example

```typescript
type result = NumberRange<2 , 9> //  | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 
```

Answer

```typescript
// 加1
type AddOne<M, Res extends unknown[] = []> = Res['length'] extends M
  ? [...Res, 1]['length']
  : AddOn<M, [...Res, 1]>;
type NumberRange<L, H, Result extends unknown[] = []> = L extends H
  ? [...Result, L][number]
  : NumberRange<AddOne<L>, H, [...Result, L]>;
```

### **Combination**

For example

```typescript
// expected to be `"foo" | "bar" | "baz" | "foo bar" | "foo bar baz" | "foo baz" | "foo baz bar" | "bar foo" | "bar foo baz" | "bar baz" | "bar baz foo" | "baz foo" | "baz foo bar" | "baz bar" | "baz bar foo"`
type Keys = Combination<['foo', 'bar', 'baz']>
```

Answer

[参考答案](https://github.com/type-challenges/type-challenges/issues/14157)

```typescript
// 答案
type Combination<T extends string[], A = T[number], U = A> = 
  U extends infer I extends string
    ? I | `${I} ${Combination<[], Exclude<A, I>>}`
    :never
```

## 困难

## 地狱

### TODO: 不定期更新



