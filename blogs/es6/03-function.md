---
title: 003 函数的扩展
date: 2021-04-12
categories: 
 - ES6
tags:
 - ES6 FUNCTION
sidebar: auto

---

### 函数的length属性

指定了默认值以后，函数的length属性，将返回没有指定默认值的参数个数，也就是说，指定默认值，函数的length属性失真

```javascript
(function (a) {}).length // 1
(function (a = 5) {}).length // 0
(function (a, b, c = 5) {}).length // 2
```

如果设置了默认值的参数不是尾参数，那么`length`属性也不再计入后面的参数了。

```javascript
(function (a = 0, b, c) {}).length // 0
(function (a, d, b = 1, c) {}).length // 2
```

### 作用域

```javascript
var x = 1;
function f(x, y = x) {
    console.log(y);
}

f(2) // 2
```

调用f时，参数y = x形成一个单独的作用域。这个作用域里面，变量x本身没有定义，所以指向外层的全局变量x。函数调用时，函数体内部的局部变量x影响不到默认值变量x

如果此时，全局变量x不存在，就会报错

```javascript
function f(y = x) {
  let x = 2;
  console.log(y);
}

f() // ReferenceError: x is not defined
```

如果参数的默认值是一个哈桑农户，该函数的作用域也遵守这个规则

```javascript
let foo = 'outer';

function bar(func = () => foo) {
  let foo = 'inner';
  console.log(func());
}

bar(); // outer
```

函数bar的参数func的默认值是一个匿名函数，返回值时变量foo。函数参数形成的单独作用域里面，并没有定义变量foo，所以foo指向外层的全局变量foo，因此输出outer

改写成下面这样便会报错

```javascript
function bar(func = () => foo) {
  let foo = 'inner';
  console.log(func());
}

bar() // ReferenceError: foo is not defined
```

更复杂的一个例子

```javascript
var x = 1
function foo(x, y = function () {x = 2}) {
    var x = 3;
    y();
    console.log(x);// 3
}

foo() 
x // 1
```

上面代码中，函数`foo`的参数形成一个单独作用域。这个作用域里面，首先声明了变量`x`，然后声明了变量`y`，`y`的默认值是一个匿名函数。这个匿名函数内部的变量`x`，指向同一个作用域的第一个参数`x`。函数`foo`内部又声明了一个内部变量`x`，该变量与第一个参数`x`由于不是同一个作用域，所以不是同一个变量，因此执行`y`后，内部变量`x`和外部全局变量`x`的值都没变

### 应用

1. 剩余参数

   用于获取函数的多余参数，这样就不需要使用`arguments`对象了。rest 参数搭配的变量是一个数组，该变量将多余的参数放入数组中。

   ```javascript
   function add (...values) {
       let sum = 0;
       
       for (var val of values) {
           sum += val;
       }
       return sum;
   }
   add (2, 5, 3);
   ```

   

2. 严格模式

   ES5开始，函数内部可以设定为严格模式

   ```javascript
   function doSomething(a, b) {
       'use strict';
        // code   
   }
   ```

   ES2016 做了一点修改，规定只要函数参数使用了默认值、解构赋值、或者扩展运算符，那么函数内部就不能显式设定为严格模式，否则会报错。

   ```javascript
   // 报错
   function doSomething(a, b = a) {
     'use strict';
     // code
   }
   
   // 报错
   const doSomething = function ({a, b}) {
     'use strict';
     // code
   };
   
   // 报错
   const doSomething = (...a) => {
     'use strict';
     // code
   };
   
   const obj = {
     // 报错
     doSomething({a, b}) {
       'use strict';
       // code
     }
   };
   ```

3. name 属性

   函数的name属性，返回该函数的函数名

   ```javascript
   function foo () {}
   foo.name // "foo"
   ```

   需要注意的是，ES6 对这个属性的行为做出了一些修改。如果将一个匿名函数赋值给一个变量，ES5 的`name`属性，会返回空字符串，而 ES6 的`name`属性会返回实际的函数名。

   `Function`构造函数返回的函数实例，`name`属性的值为`anonymous`。

   ```javascript
   (new Function).name // "anonymous"
   ```

   `bind`返回的函数，`name`属性值会加上`bound`前缀。

   ```javascript
   function foo() {};
   foo.bind({}).name // "bound foo"
   
   (function(){}).bind({}).name // "bound "
   ```

4. 箭头函数

   如果箭头函数不需要参数或需要多个参数，就使用一个圆括号代表参数部分

   ```javascript
   var f = () => 5;
   // 等同于
   var f = function (v) {
   	return v;
   };
   ```

   如果箭头函数不需要参数或需要多个参数，就是用一个圆括号代表参数部分

   ```javascript
   var f = () => 5;
   // 等同于
   var f = function () {return 5};
   
   var sum = (num1, num2) => num1 + num2;
   // 等同于
   var sum = function (num1, num2) {
       return num1 + num2;
   };
   ```

   如果箭头函数的代码块多余一条语句，就使用大括号将他们括起来，并且使用return语句返回

   ```javascript
   var sum = (num1, num2) => { return num1 + num2}
   ```

   由于大括号被解释为代码块，所以如果箭头函数直接返回一个对象，必须在对象外面加上括号，否则报错

   ```javascript
   // 报错
   let getTempItem = id => { id: id, name: "Temp" };
   
   // 不报错
   let getTempItem = id => ({ id: id, name: "Temp" });
   ```

   下面是一种特殊情况，虽然可以运行，但会得到错误的结果。

   ```javascript
   let foo = () => { a: 1 };
   foo() // undefined
   ```

   使用注意点

   1. 函数体内的this对象，就是定义时所在的对象，而不是使用时所在对象
   2. 不可以当作构造函数，不可以new
   3. 不存在arguments对象
   4. 不可以使用yield命令，所以不能用作Generator函数

5. 尾调用优化

   尾调用（Tail Call）是函数式编程的一个重要概念，本身非常简单，一句话就能说清楚，就是指某个函数的最后一步是调用另一个函数。

   上面代码中，函数`f`的最后一步是调用函数`g`，这就叫尾调用。

   函数调用会在内存形成一个“调用记录”，又称“调用帧”（call frame），保存调用位置和内部变量等信息。如果在函数`A`的内部调用函数`B`，那么在`A`的调用帧上方，还会形成一个`B`的调用帧。等到`B`运行结束，将结果返回到`A`，`B`的调用帧才会消失。如果函数`B`内部还调用函数`C`，那就还有一个`C`的调用帧，以此类推。所有的调用帧，就形成一个“调用栈”（call stack）。

   ```javascript
   function f() {
     let m = 1;
     let n = 2;
     return g(m + n);
   }
   f();
   
   // 等同于
   function f() {
     return g(3);
   }
   f();
   
   // 等同于
   g(3);
   ```

   这就叫做“尾调用优化”（Tail call optimization），即只保留内层函数的调用帧。如果所有函数都是尾调用，那么完全可以做到每次执行时，调用帧只有一项，这将大大节省内存。这就是“尾调用优化”的意义。

   注意，只有不再用到外层函数的内部变量，内层函数的调用帧才会取代外层函数的调用帧，否则就无法进行“尾调用优化”。

6. 尾递归

   函数调用自身，称为递归。如果尾调用自身，就称为尾递归。

   递归非常耗费内存，因为需要同时保存成千上百个调用帧，很容易发生“栈溢出”错误（stack overflow）。但对于尾递归来说，由于只存在一个调用帧，所以永远不会发生“栈溢出”错误。

   ```javascript
   function factorial(n) {
     if (n === 1) return 1;
     return n * factorial(n - 1);
   }
   
   factorial(5) // 120
   ```

   改写成尾递归，只保留一个调用记录，复杂度O(1)

   ```javascript
   function factorial(n, total) {
       if (n === 1) return total;
   	return factorial(n-1, n * total);
   }
   factorial(5, 1)
   ```

   非尾递归的 Fibonacci 数列实现如下

   ```javascript
   function Fibonacci (n) {
     if ( n <= 1 ) {return 1};
   
     return Fibonacci(n - 1) + Fibonacci(n - 2);
   }
   
   Fibonacci(10) // 89
   Fibonacci(100) // 超时
   Fibonacci(500) // 超时
   ```

   尾递归的Fibonacci数列实现如下

   ```javascript
   function Fibonacci(n, ac1 = 1, ac2 = 1) {
       if (n <= 1) { return ac2 }
       
       return Fibonacci(n-1, ac2, ac1 +  ac2)
   }
   ```

   函数式编程有一个概念，叫做柯里化（currying），意思是将多参数的函数转换成单参数的形式。这里也可以使用柯里化。

   ```javascript
   function currying(fn, n) {
       return function (m) {
           return fn.call(this, m, n)
       }
   }
   
   function tailFactorial(n, total) {
       if (n = 1) return total;
       return tailFactorial(n -1, n * total);
   }
   
   const factorial = currying(tailFactorial, 1);
   factorial(5)
   ```

   

7. catch命令的参数省略

   JavaScript 语言的`try...catch`结构，以前明确要求`catch`命令后面必须跟参数，接受`try`代码块抛出的错误对象

   ```javascript
   try {
     // ...
   } catch (err) {
     // 处理错误
   }
   ```

   上面代码中，`catch`命令后面带有参数`err`。

   很多时候，`catch`代码块可能用不到这个参数。但是，为了保证语法正确，还是必须写。[ES2019](https://github.com/tc39/proposal-optional-catch-binding) 做出了改变，允许`catch`语句省略参数。

   ```javascript
   try {
     // ...
   } catch {
     // ...
   }
   ```

