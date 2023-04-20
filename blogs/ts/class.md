---
title: TS class
date: 2023-03-09
categories: 
 - TypeScript
tags:
 - ts class
sidebar: auto
---

## 原文链接

[冴羽的typeScript系列](https://www.yuque.com/yayu/od8gmv/eqteva)
## 类

TypeScript 完全支持 ES2015 引入的 `class` 关键字。



和其他 JavaScript 语言特性一样，TypeScript 提供了类型注解和其他语法，允许你表达类与其他类型之间的关系


## 类成员

### 字段

一个字段声明会创建一个公共（public）可写入（writeable）的属性

```typescript
class Point {
    x: number;
    y: number;
}

const pt = new Point();
pt.x = 0;
pt.y = 0;
```

注意：类型注解是可选的，如果没有指定，默认any

字段可以设置初始值

```typescript
class Point {
    x = 0;
    y = 0;
}

const pt = new Point();
console.log(`${pt.x},${pt.y}`)
```

就像 `const` 、`let` 和 `var` ，一个类属性的初始值会被用于推断它的类型:

```typescript
const pt = new Point();
pt.x = "0";
// Type 'string' is not assignable to type 'number'.
```

`tsconfig.json`中配置字段`strictPropertyInitialization`控制类字段是否需要在构造函数李初始化

```typescript
class BadGreeter {
    name: string;
}
```

```typescript
class GoodGreeter {
  name: string;
 
  constructor() {
    this.name = "hello";
  }
}
```

注意，字段需要在构造函数自身进行初始化。TypeScript 并不会分析构造函数里你调用的方法，进而判断初始化的值，因为一个派生类也许会覆盖这些方法并且初始化成员失败：

```typescript
class BadGreeter {
  name: string;
  // Property 'name' has no initializer and is not definitely assigned in the constructor.
  setName(): void {
    this.name = '123'
  }
  constructor() {
    this.setName();
  }
}
```

如果你执意要通过其他方式初始化一个字段，而不是在构造函数里（举个例子，引入外部库为你补充类的部分内容），你可以使用明确赋值断言操作符（definite assignment assertion operator） `!`:

```typescript
class OKGreeter {
  // Not initialized, but no error
  name!: string;
}
```

#### **readonly**

字段可以添加一个`readOnly`前缀修饰符，会阻止构造函数之外的赋值

```typescript
class Greeter {
    readonly name:string = 'world';
    
    constructor(otherName?: string) {
        if(otherName !== undefined) {
            this.name = otherName
        }
    }
    
    err() {
        this.name = 'not ok'
    }
}

const g = new Greeter()
g.name = 'also not ok'
```

### 构造函数

类的构造函数跟函数非常相似，可以使用类型注解的参数、默认值、重载等

```typescript
class Point {
    x: number;
    y: number;
    
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}
```

```typescript
class Point {
  // Overloads
  constructor(x: number, y: string);
  constructor(s: string);
  constructor(xs: any, y?: any) {
    // TBD
  }
}
```

但构造函数签名与函数签名之前存在一些区别

- 构造函数不能有类型参数（关于类型参数，回想下泛型里的内容），这些属于外层的类声明，我们稍后就会学习到。
- 构造函数不能有[返回类型注解](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#return-type-annotations)，因为总是返回类实例类型

#### **Super调用**

就像在 JavaScript 中，如果你有一个基类，你需要在使用任何 `this.` 成员之前，先在构造函数里调用 `super()`。

```typescript
class Base {
	 k = 4;
}

class Derived extends Base {
	constructor() {
		console.log(this.k)
        super()
	}
}
```

#### **方法**

类中的函数属性被称为方法。方法跟函数、构造函数一样，使用相同的类型注解。

```typescript
class Point {
  x = 10;
  y = 10;
 
  scale(n: number): void {
    this.x *= n;
    this.y *= n;
  }
}
```

除了标准的类型注解，TypeScript 并没有给方法添加任何新的东西。



注意在一个方法体内，它依然可以通过 `this.` 访问字段和其他的方法。方法体内一个未限定的名称（unqualified name，没有明确限定作用域的名称）总是指向闭包作用域里的内容。

```typescript
let x: number = 0;
 
class C {
  x: string = "hello";
 
  m() {
    // This is trying to modify 'x' from line 1, not the class property
    x = "world";
		// Type 'string' is not assignable to type 'number'.
  }
}
```

#### **Getters/Setters**

类也可以有存储器

```typescript
class C {
    _length = 0;
    get length() {
        return this._length
    }
    set length(value) {
        this._length = value
    }
}
```

TypeScript对存取器有一些特殊的推断规则：

- 如果`get`存在而`set`不存在，属性便会自动设置为`readonly`
- 如果setter参数的类型没有指定，它会被推断为getter的返回类型
- getters和setters必须有相同的成员可见性

```typescript
class Thing {
    _size = 0;
    
    // getter返回的类型是number
    get size():number {
        return this._size
    }
    
    // 传入的类型是string | number | boolean的联合类型
    set size(value: string | number | boolean) {
        let num = Number(value);
        
        // 排除NaN、Infinite等
        if(!Number.isFinite(num)) {
            this._size = 0
            return
        }
        this._size = num
    }
}
```

#### **索引签名**

类可以声明索引签名，它和对象类型的索引签名是一样的

```typescript
class MyClass {
    [s: string]: boolean | ((s: string) => boolean);
    
    check(s: string) {
        return this[s] as boolean
    }
}
```

因为索引签名类型也需要捕获方法的类型，这使得并不容易有效的使用这些类型。通常的来说，在其他地方存储索引数据而不是在类实例本身，会更好一些。

## 类继承

JavaScript的类可以继承基类

### `implements`语句

可以使用`implements`语句检查一个类是否满足一个特定的`interface`，如果一个类没有正确实现它，那么TypeScriot会报错

```typescript
interface Pingable {
	ping(): void;
}

class Sonar implements Pingable {
	ping() {
		console.log('ping!')
	}
}

class Ball implements Pingable {
	pong() {
		console.log('pong!')
	}
}
```

类也可以实现多个接口，比如 `class C implements A, B {`

**注意事项**

`implements` 语句仅仅检查类是否按照接口类型实现，但它并不会改变类的类型或者方法的类型。一个常见的错误就是以为 `implements` 语句会改变类的类型——然而实际上它并不会：

```typescript
interface Checkable {
    check(name: string): boolean;
}

class NameChecker implements Checkable {
    check(s) {
        return s.toLowercase() === 'ok'
    }
}
```

在这个例子中，我们可能会以为 `s` 的类型会被 `check` 的 `name: string` 参数影响。实际上并没有，`implements` 语句并不会影响类的内部是如何检查或者类型推断的。



类似的，实现一个有可选属性的接口，并不会创建这个属性：

```typescript
interface A {
    x: number;
    y?: number;
}

class C implements A {
    x = 0;
}

const c = new C()
c.y = 10
```

### `extends`语句

类可以 `extend` 一个基类。一个派生类有基类所有的属性和方法，还可以定义额外的成员。

```typescript
class Animal {
    move() {
        console.log('Moving along')
    }
}

class Dog extends Animal {
    woof(times: number) {
        for(let i =0; i < times; i++) {
            console.log('woof!')
        }
    }
}

const d = new Dog();
d.move();
d.woof(3);
```

#### **覆写属性**

一个派生类可以覆写一个基类的字段或属性。你可以使用 `super` 语法访问基类的方法。



TypeScript 强制要求派生类总是它的基类的子类型。

```typescript
class Base {
  greet() {
    console.log("Hello, world!");
  }
}
 
class Derived extends Base {
  greet(name?: string) {
    if (name === undefined) {
      super.greet();
    } else {
      console.log(`Hello, ${name.toUpperCase()}`);
    }
  }
}
 
const d = new Derived();
d.greet();
d.greet("reader");
```

派生类需要遵循着它的基类的实现。



而且通过一个基类引用指向一个派生类实例，这是非常常见并合法的：

```typescript
// Alias the derived instance through a base class reference
const b: Base = d;
// No problem
b.greet();
```

但是如果 `Derived` 不遵循 `Base` 的约定实现呢？

```typescript
class Base {
  greet() {
    console.log("Hello, world!");
  }
}
 
class Derived extends Base {
  // Make this parameter required
  greet(name: string) {
	// Property 'greet' in type 'Derived' is not assignable to the same property in base type 'Base'.
  // Type '(name: string) => void' is not assignable to type '() => void'.
    console.log(`Hello, ${name.toUpperCase()}`);
  }
}
```

即便我们忽视错误编译代码，这个例子也会运行错误：

```typescript
const b:Base = new Derived();
// Crashes because "name" will be undefined
b.greet();
```

#### **初始化顺序**

有些情况下，JavaScript 类初始化的顺序会让你感到很奇怪，让我们看这个例子：

```typescript
class Base {
    name = 'base';
    constructor() {
        console.log('My name is' + this.name)
    }
}

class Derived extends Base {
    name = 'derived';
}

const d = new Derived()
```

到底发生了什么呢？



类初始化的顺序，就像在 JavaScript 中定义的那样：



- 基类字段初始化
- 基类构造函数运行
- 派生类字段初始化
- 派生类构造函数运行



这意味着基类构造函数只能看到它自己的 `name` 的值，因为此时派生类字段初始化还没有运行。



#### **继承内置类型**

> 注意：如果你不打算继承内置的类型比如 `Array`、`Error`、`Map` 等或者你的编译目标是 ES6/ES2015 或者更新的版本，你可以跳过这个章节。

在 ES2015 中，当调用 `super(...)` 的时候，如果构造函数返回了一个对象，会隐式替换 `this` 的值。所以捕获 `super()` 可能的返回值并用 `this` 替换它是非常有必要的。



这就导致，像 `Error`、`Array` 等子类，也许不会再如你期望的那样运行。这是因为 `Error`、`Array` 等类似内置对象的构造函数，会使用 ECMAScript 6 的 `new.target` 调整原型链。然而，在 ECMAScript 5 中，当调用一个构造函数的时候，并没有方法可以确保 `new.target` 的值。 其他的降级编译器默认也会有同样的限制。

#### **成员可见性**

你可以使用 TypeScript 控制某个方法或者属性是否对类以外的代码可见。

**public**

类成员默认可见性`public`，一个`public`的成员在任何地方被获取：

```typescript
class Greeter {
    public greet() {
        console.log('hi!')
    }
}

const g = new Greeter();
g.greet()
```

因为 `public` 是默认的可见性修饰符，所以你不需要写它，除非处于格式或者可读性的原因。

**protected**

`protected`成员仅仅对子类可见：

```typescript
class Greeter {
  public greet() {
    console.log("Hello, " + this.getName());
  }
  protected getName() {
    return "hi";
  }
}
 
class SpecialGreeter extends Greeter {
  public howdy() {
    // OK to access protected member here
    console.log("Howdy, " + this.getName());
  }
}
const g = new SpecialGreeter();
g.greet(); // OK
g.getName();
// Property 'getName' is protected and only accessible within class 'Greeter' and its subclasses.
```

**受保护成员的公开**

派生类需要遵循基类的实现，但是依然可以选择公开拥有更多能力的基类子类型，这就包括让一个 `protected` 成员变成 `public`：

```typescript
class Base {
    protected m = 10;
}

class Derived extends Base {
    m = 15;
}

const d = new Derived() // ok
```

这里需要注意的是，如果公开不是故意的，在这个派生类中，我们需要小心的拷贝 `protected` 修饰符。

**交叉等级受保护成员访问**

不同的 OOP 语言在通过一个基类引用是否可以合法的获取一个 `protected` 成员是有争议的。

```typescript
class Base {
  protected x: number = 1;
  getX() {
      return this.x
  }
}
class Derived1 extends Base {
  protected x: number = 5;
}
class Derived2 extends Base {
  f1(other: Derived2) {
    other.x = 10;
  }
  f2(other: Base) {
    other.x = 10;
		// Property 'x' is protected and only accessible through an instance of class 'Derived2'. This is an instance of class 'Base'.
  }
}
```

在 Java 中，这是合法的，而 C# 和 C++ 认为这段代码是不合法的。



TypeScript 站在 C# 和 C++ 这边。因为 `Derived2` 的 `x` 应该只有从  `Derived2` 的子类访问才是合法的，而 `Derived1` 并不是它们中的一个。此外，如果通过 `Derived1` 访问 `x` 是不合法的，通过一个基类引用访问也应该是不合法的。

**private**

`private` 有点像 `protected` ，但是不允许访问成员，即便是子类。

```typescript
class Base {
    private x = 0;
    getName() {
        return this.x
    }
}

const b = new Base()
```

```typescript
class Derived extends Base {
  showX() {
    // Can't access in subclasses
    console.log(this.x);
		// Property 'x' is private and only accessible within class 'Base'.
  }
}
```

因为 `private` 成员对派生类并不可见，所以一个派生类也不能增加它的可见性：

```typescript
class Base {
  private x = 0;
}
class Derived extends Base {
// Class 'Derived' incorrectly extends base class 'Base'.
// Property 'x' is private in type 'Base' but not in type 'Derived'.
  x = 1;
}
```

**交叉实例私有成员访问**

不同的 OOP 语言在关于一个类的不同实例是否可以获取彼此的 `private` 成员上，也是不一致的。像 Java、C#、C++、Swift 和 PHP 都是允许的，Ruby 是不允许。

TypeScript 允许交叉实例私有成员的获取：

````typescript
class A {
  private x = 10;
 
  public sameAs(other: A) {
    // No error
    return other.x === this.x;
  }
}
````

**警告**

`private`和 `protected` 仅仅在类型检查的时候才会强制生效。

这意味着在 JavaScript 运行时，像 `in` 或者简单的属性查找，依然可以获取 `private` 或者 `protected` 成员。

```typescript
class MySafe {
  private secretKey = 12345;
}
```

```typescript
// In a JavaScript file...
const s = new MySafe();
// Will print 12345
console.log(s.secretKey);
```

`private` 允许在类型检查的时候，通过方括号语法进行访问。这让比如单元测试的时候，会更容易访问 `private` 字段，这也让这些字段是弱私有（soft private）而不是严格的强制私有。

```typescript
class MySafe {
  private secretKey = 12345;
}
 
const s = new MySafe();
 
// Not allowed during type checking
console.log(s.secretKey);
// Property 'secretKey' is private and only accessible within class 'MySafe'.
 
// OK
console.log(s["secretKey"]);
```

不像 TypeScript 的 `private`，JavaScript 的[私有字段](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Private_class_fields)（`#`）即便是编译后依然保留私有性，并且不会提供像上面这种方括号获取的方法，这让它们变得强私有（hard private）。

```typescript
class Dog {
  #barkAmount = 0;
  personality = "happy";
 
  constructor() {}
}
```

```typescript
"use strict";
class Dog {
    #barkAmount = 0;
    personality = "happy";
    constructor() { }
}
```

当被编译成 ES2021 或者之前的版本，TypeScript 会使用 WeakMaps 替代 `#`:

```typescript
"use strict";
var _Dog_barkAmount;
class Dog {
    constructor() {
        _Dog_barkAmount.set(this, 0);
        this.personality = "happy";
    }
}
_Dog_barkAmount = new WeakMap();
```

如果你需要防止恶意攻击，保护类中的值，你应该使用强私有的机制比如闭包，`WeakMaps` ，或者私有字段。但是注意，这也会在运行时影响性能。

### 静态成员

```typescript
class MyClass {
  static x = 0;
  static printX() {
    console.log(MyClass.x);
  }
}
console.log(MyClass.x);
MyClass.printX();
```

静态成员同样可以使用 `public` `protected` 和 `private` 这些可见性修饰符：

```typescript
class MyClass {
  private static x = 0;
}
console.log(MyClass.x);
// Property 'x' is private and only accessible within class 'MyClass'.
```

静态成员也可以被继承：

```typescript
class Base {
  static getGreeting() {
    return "Hello world";
  }
}
class Derived extends Base {
  myGreeting = Derived.getGreeting();
}
```

#### **特殊静态名称**

类本身是函数，而覆写 `Function` 原型上的属性通常认为是不安全的，因此不能使用一些固定的静态名称，函数属性像 `name`、`length`、`call` 不能被用来定义 `static` 成员：

```typescript
class S {
  static name = "S!";
  // Static property 'name' conflicts with built-in property 'Function.name' of constructor function 'S'.
}
```

#### **为什么没有静态类**

TypeScript（和 JavaScript） 并没有名为静态类（static class）的结构，但是像 C# 和 Java 有。



所谓静态类，指的是作为类的静态成员存在于某个类的内部的类。比如这种：

```java
// java
public class OuterClass {
  private static String a = "1";
	static class InnerClass {
  	private int b = 2;
  }
}
```

举个例子，我们不需要一个 `static class` 语法，因为 TypeScript 中一个常规对象（或者顶级函数）可以实现一样的功能：

```typescript
// Unnecessary "static" class
class MyStaticClass {
  static doSomething() {}
}
 
// Preferred (alternative 1)
function doSomething() {}
 
// Preferred (alternative 2)
const MyHelperObject = {
  dosomething() {},
};
```

## 泛型类

类跟接口一样，也可以写泛型。当使用 `new` 实例化一个泛型类，它的类型参数的推断跟函数调用是同样的方式：

```typescript
class Box<Type> {
  contents: Type;
  constructor(value: Type) {
    this.contents = value;
  }
}
 
const b = new Box("hello!");
// const b: Box<string>
```

类跟接口一样也可以使用泛型约束以及默认值。

### 静态成员中的类型参数

这代码并不合法，但是原因可能并没有那么明显：

```typescript
class Box<Type> {
  static defaultValue: Type;
	// Static members cannot reference class type parameters.
}
```

记住类型会被完全抹除，运行时，只有一个 `Box.defaultValue` 属性槽。这也意味着如果设置 `Box<string>.defaultValue` 是可以的话，这也会改变 `Box<number>.defaultValue`，而这样是不好的。



所以泛型类的静态成员不应该引用类的类型参数。



## 类运行时的this

```typescript
class MyClass {
  name = "MyClass";
  getName() {
    return this.name;
  }
}
const c = new MyClass();
const obj = {
  name: "obj",
  getName: c.getName,
};
 
// Prints "obj", not "MyClass"
console.log(obj.getName());
```

默认情况下，函数中 `this` 的值取决于函数是如何被调用的。在这个例子中，因为函数通过 `obj` 被调用，所以 `this` 的值是 `obj` 而不是类实例。



这显然不是你所希望的。TypeScript 提供了一些方式缓解或者阻止这种错误。

### 箭头函数

如果你有一个函数，经常在被调用的时候丢失 `this` 上下文，使用一个箭头函数或许更好些。

```typescript
class MyClass {
  name = "MyClass";
  getName = () => {
    return this.name;
  };
}
const c = new MyClass();
const g = c.getName;
// Prints "MyClass" instead of crashing
console.log(g());
```

这里有几点需要注意下：



- `this` 的值在运行时是正确的，即使 TypeScript 不检查代码
- 这会使用更多的内存，因为每一个类实例都会拷贝一遍这个函数。
- 你不能在派生类使用 `super.getName` ，因为在原型链中并没有入口可以获取基类方法。

### `this`参数

在 TypeScript 方法或者函数的定义中，第一个参数且名字为 `this` 有特殊的含义。该参数会在编译的时候被抹除：

```typescript
// TypeScript input with 'this' parameter
function fn(this: SomeType, x: number) {
  /* ... */
}
```

TypeScript 会检查一个有 `this` 参数的函数在调用时是否有一个正确的上下文。不像上个例子使用箭头函数，我们可以给方法定义添加一个 `this` 参数，静态强制方法被正确调用：

```typescript
class MyClass {
  name = "MyClass";
  getName(this: MyClass) {
    return this.name;
  }
}
const c = new MyClass();
// OK
c.getName();
 
// Error, would crash
const g = c.getName;
console.log(g());
// The 'this' context of type 'void' is not assignable to method's 'this' of type 'MyClass'.
```

这个方法也有一些注意点，正好跟箭头函数相反：

- JavaScript 调用者依然可能在没有意识到它的时候错误使用类方法
- 每个类一个函数，而不是每一个类实例一个函数
- 基类方法定义依然可以通过 `super` 调用

## `this`类型

在类中，有一个特殊的名为 `this` 的类型，会动态的引用当前类的类型，让我们看下它的用法：

```typescript
class Box {
  contents: string = "";
  set(value: string) {
	// (method) Box.set(value: string): this
    this.contents = value;
    return this;
  }
}
```

这里，TypeScript 推断 `set` 的返回类型为 `this` 而不是 `Box` 。让我们写一个 `Box` 的子类：

```typescript
class ClearableBox extends Box {
  clear() {
    this.contents = "";
  }
}
 
const a = new ClearableBox();
const b = a.set("hello");

// const b: ClearableBox
```

你也可以在参数类型注解中使用 `this` ：

```typescript
class Box {
  content: string = "";
  sameAs(other: this) {
    return other.content === this.content;
  }
}
```

不同于写 `other: Box` ，如果你有一个派生类，它的 `sameAs` 方法只接受来自同一个派生类的实例。

```typescript
class Box {
  content: string = "";
  sameAs(other: this) {
    return other.content === this.content;
  }
}
 
class DerivedBox extends Box {
  otherContent: string = "?";
}
 
const base = new Box();
const derived = new DerivedBox();
derived.sameAs(base);
// Argument of type 'Box' is not assignable to parameter of type 'DerivedBox'.
  // Property 'otherContent' is missing in type 'Box' but required in type 'DerivedBox'.

```

### 基于`this`的类型保护

你可以在类和接口的方法返回的位置，使用 `this is Type` 。当搭配使用类型收窄 (举个例子，`if` 语句)，目标对象的类型会被收窄为更具体的 `Type`。

```typescript
class FileSystemObject {
    isFile(): this is FileRep {
        return this instanceof FileRep;
    }
    isDirectory(): this is Directory {
        return this instanceof Directory;
    }
    isNetworked(): this is Networked & this {
        return this.networked;
    }
    constructor(public path: string, private networked: boolean) {}
}

class FileRep extends FileSystemObject {
    constructor(path: string, public content: string) {
      super(path, false);
    }
}

class Directory extends FileSystemObject {
    children: FileSystemObject[];
    constructor(path: string) {
      super(path, false)
      this.children = []
    }
}

interface Networked {
    host: string;
}

const fso: FileSystemObject = new FileRep('foo/bar.txt', 'foo');

if (fso.isFile()) {
    fso.content;
    // const fso: FileRep
} else if (fso.isDirectory()) {
    fso.children;
    // const fso: Directory
} else if (fso.isNetworked()) {
    fso.host;
    // const fso: Networked & FileSystemObject
}
```

一个常见的基于 this 的类型保护的使用例子，会对一个特定的字段进行懒校验（lazy validation）。举个例子，在这个例子中，当 `hasValue` 被验证为 true 时，会从类型中移除 `undefined`：

```typescript
class Box<T> {
  value?: T;
 
  hasValue(): this is { value: T } {
    return this.value !== undefined;
  }
}
 
const box = new Box();
box.value = "Gameboy";
 
box.value;  
// (property) Box<unknown>.value?: unknown
 
if (box.hasValue()) {
  box.value;
  // (property) value: unknown
}
```

## 参数属性

TypeScript 提供了特殊的语法，可以把一个构造函数参数转成一个同名同值的类属性。这些就被称为参数属性（parameter properties）。你可以通过在构造函数参数前添加一个可见性修饰符 `public` `private` `protected` 或者 `readonly` 来创建参数属性，最后这些类属性字段也会得到这些修饰符：

```typescript
class Params {
  constructor(
    public readonly x: number,
    protected y: number,
    private z: number
  ) {
    // No body necessary
  }
}
const a = new Params(1, 2, 3);
console.log(a.x);
// (property) Params.x: number

console.log(a.z);
// Property 'z' is private and only accessible within class 'Params'.
```

## 类表达式

类表达式跟类声明非常类似，唯一不同的是类表达式不需要一个名字，尽管我们可以通过绑定的标识符进行引用：

```typescript
const someClass = class<Type> {
  content: Type;
  constructor(value: Type) {
    this.content = value;
  }
};
 
const m = new someClass("Hello, world");  
// const m: someClass<string>
```

## 抽象类和成员

TypeScript 中，类、方法、字段都可以是抽象的（abstract）。



抽象方法或者抽象字段是不提供实现的。这些成员必须存在在一个抽象类中，这个抽象类也不能直接被实例化。



抽象类的作用是作为子类的基类，让子类实现所有的抽象成员。当一个类没有任何抽象成员，他就会被认为是具体的（concrete）。

```typescript
abstract class Base {
  // 抽象成员
  abstract getName(): string;
 
  printName() {
    console.log("Hello, " + this.getName());
  }
}
 
const b = new Base();
// Cannot create an instance of an abstract class.
```

我们不能使用 `new` 实例 `Base` 因为它是抽象类。我们需要写一个派生类，并且实现抽象成员。

```typescript
class Derived extends Base {
  // 派生类实现抽象成员
  getName() {
    return "world";
  }
}
 
const d = new Derived();
d.printName();
```

注意，如果我们忘记实现基类的抽象成员，我们会得到一个报错：

```typescript
class Derived extends Base {
	// Non-abstract class 'Derived' does not implement inherited abstract member 'getName' from class 'Base'.
  // forgot to do anything
}
```

### 抽象构造签名

有的时候，你希望接受传入可以继承一些抽象类产生一个类的实例的类构造函数。



举个例子，你也许会写这样的代码：

```typescript
function greet(ctor: typeof Base) {
  const instance = new ctor();
	// Cannot create an instance of an abstract class.
  instance.printName();
}
```

但如果你写一个函数接受传入一个构造签名：

```typescript
function greet(ctor: new () => Base) {
  const instance = new ctor();
  instance.printName();
}
greet(Derived);
greet(Base);

// Argument of type 'typeof Base' is not assignable to parameter of type 'new () => Base'.
// Cannot assign an abstract constructor type to a non-abstract constructor type.
```

现在 TypeScript 会正确的告诉你，哪一个类构造函数可以被调用，`Derived` 可以，因为它是具体的，而 `Base` 是不能的。

## 类之间的关系

大部分时候，TypeScript 的类跟其他类型一样，会被结构性比较。



举个例子，这两个类可以用于替代彼此，因为它们结构是相等的：

```typescript
class Point1 {
  x = 0;
  y = 0;
}
 
class Point2 {
  x = 0;
  y = 0;
}
 
// OK
const p: Point1 = new Point2();
```

类似的还有，类的子类型之间可以建立关系，即使没有明显的继承：

```typescript
class Person {
  name: string;
  age: number;
}
 
class Employee {
  name: string;
  age: number;
  salary: number;
}
 
// OK
const p: Person = new Employee();
```

这听起来有些简单，但还有一些例子可以看出奇怪的地方。



空类没有任何成员。在一个结构化类型系统中，没有成员的类型通常是任何其他类型的父类型。所以如果你写一个空类（只是举例，你可不要这样做），任何东西都可以用来替换它：

```typescript
class Empty {}
 
function fn(x: Empty) {
  // can't do anything with 'x', so I won't
}
 
// All OK!
fn(window);
fn({});
fn(fn);
```

