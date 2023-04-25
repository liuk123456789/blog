---
title: Sass的进阶用法
date: 2023-01-13
categories: 
 - Sass
tags:
 - Sass advance usage
sidebar: auto
---

## At-Rules

### @use的使用

**@import的缺点**

1. 无法知道定义的变量、mixin、函数从那里定义
2. 嵌套import会导致重复css代码。如：一个页面中动态引入了一个组件，页面本身需要加载page.css，组件的样式由component.css决定，而这两个样式表的源scss文件中都用到了common.scss，那么在动态引入组件的时候，common.css中的样式就会被重复加载，可能对原有的样式造成覆盖
3. 不存在命令空间，css选择器是全局的，需要避免重名问题
4. 没有私有函数的概念。库作者无法确保他们的私有工具函数不会被使用者直接获取，直接使用私有函数可能导致混淆和向后兼容的问题。
5. `@extend`规则可能会影响到样式中的一切选择器，而不是仅仅是作者所希望的那些。

所以`@use`的出现就是解决`@import` 存在的问题

1. 基本语法

   `@use addressUrl  as namespace`

   🌰如下

   _mixin.scss 文件内容

   ```scss
   // 私有变量无法暴露给外部使用
   $-baseSize: 16px;
   
   ._other_test {
     font-size: $-baseSize;
   }
   
   @mixin test-margin($pt) {
     padding-top: #{$pt}px;
   }
   
   @mixin stylish-mixin($width) {
   width: #{$width};
   }
   
   @mixin wrapped-stylish-mixin($width) {
     font-size: $-baseSize;
     font-weight: bold;
     @include stylish-mixin($width);
   }
   
   @mixin mixin-content {
     .mixin-pre {
       @content;
     }
   }
   ```

   base.scss文件内容

   ```scss
   @use 'sass:math';
   
   @use './mixin' as mixinModule;
   
   $main-font-size: 18px;
   
   .test {
     // 这里等同于 .test:hover
     &:hover {
       color: pink;
     }
     .test-head {
       $width: null;
       $width: 2000px !default;
       $margin: 6;
       width: math.div($width,2);            // Uses a variable, does division
       width: math.div(round(1.5),2);        // Uses a function, does division
       height: math.div(500px,2);          // Uses parentheses, does division
       margin: #{$margin + 6}px  auto;
       // 颜色的mix函数
       color:  mix(rgba(255, 0, 0, 0.75) , rgba(0, 255, 0, 0.75), 80%);
       cursor: e + -resize;
       // 这里就是属性嵌套
       font: {
         size: $main-font-size;
         family: fantasy;
         weight: bold;
       }
       @include mixinModule.test-margin('20')
     }
   
     .test-content {
       @include mixinModule.wrapped-stylish-mixin($width: 100px)
     }
   }
   
   @include mixinModule.mixin-content {
     .mixin-content__test {
       color: pink;
     }
   }
   ```

   

2. 命名空间问题

   ```scss
   @use './mixin' as *; // 全局， 可直接使用 @include ***等
   @use './mixin' as mixinModule; // 命名空间， 使用时需要 @include mixinModule.***等
   @use './mixin'; // 等同于 @use './mixin' as mixin; 使用时需要 @include mixin.***等
   ```

   建议：最好在使用@use给模块命名空间名称

3. -或者_定义的私用成员，外部模块无法使用，只能在定义样式表中使用，🌰如下

   ```scss
   // _mixin.scss
   // 私有变量无法暴露给外部使用
   $-baseSize: 16px;
   
   // base.scss
   .test {
     &:hover {
       margin-top: helperModule.$-private-variables;
     }
   }
   ```

   编译错误

   > Error: Private members can't be accessed from outside their modules.

4. `@use sassFileUrl with(<variable>: <value>, <variable>: <value>)`

   ```scss
   $black: #000 !default; // !default 如果存在那么取存在的，否则定义变量的值
   $border-radius: 0.25rem !default;
   $box-shadow: 0 0.5rem 1rem rgba($black, 0.15) !default;
   
   code {
     border-radius: $border-radius;
     box-shadow: $box-shadow;
   }
   ```

   ```scss
   @use 'libary' with (
     $black: #222;
     $border-radius: 0.1rem;
   )
   ```

   

5. with mixin

   官网🌰

   ```scss
   // _library.scss
   $-black: #000;
   $-border-radius: 0.25rem;
   $-box-shadow: null;
   
   /// If the user has configured `$-box-shadow`, returns their configured value.
   /// Otherwise returns a value derived from `$-black`.
   @function -box-shadow() {
     @return $-box-shadow or (0 0.5rem 1rem rgba($-black, 0.15));
   }
   
   @mixin configure($black: null, $border-radius: null, $box-shadow: null) {
     @if $black {
       $-black: $black !global;// 修改全局变量
     }
     @if $border-radius {
       $-border-radius: $border-radius !global; // 修改全局变量
     }
     @if $box-shadow {
       $-box-shadow: $box-shadow !global;
     }
   }
   
   @mixin styles {
     code {
       border-radius: $-border-radius;
       box-shadow: -box-shadow();
     }
   }
   ```

   ```scss
   // style.scss
   @use 'library';
   
   @include library.configure(
     $black: #222,
     $border-radius: 0.1rem
   );
   
   @include library.styles;
   ```

### @forward的是使用

`@forward`语句可以引入另一个模块的所有变量、mixins和函数，将它们直接作为当前模块的API暴露出去，而不会真的在当前模块增加代码。这样，库作者可以更好地在不同源文件之间拆分代码。不同于`@use`，`@forward`不会给变量添加命名空间。

```scss
@forward 'functions'
@forward 'variables'
@forward 'mixins'
```

注意，此时生成的`bootstrap.css`文件中，是不包含"functions"、“variables”、"mixins"代码的，也不能直接在`bootstrap.scss`文件中使用这些模块。而是需要在另一个文件中@import或者`@use bootstrap`模块，再去使用这些方法。`bootstrap.scss`文件类似于一个传输中转站，把上下游的成员变量无缝连接起来。

*注意，直接写在上游模块的样式仍然会被`@forward`进来。见下例：*

```scss
/* upstream.scss */
...
footer {
  height: pow(2,3) * 1px;
  font-weight: map.get($font-weight, 'medium');
}

/* downstream.scss */
@forward 'upstream.scss'
    
/* 生成的downstream.css */
footer {
  height: 8px;
  font-weight: 500;
}
```

**使用hide/show控制成员是否可见**

官网🌰

```scss
// src/_list.scss
$horizontal-list-gap: 2em;

@mixin list-reset {
  margin: 0;
  padding: 0;
  list-style: none;
}

@mixin list-horizontal {
  @include list-reset;

  li {
    display: inline-block;
    margin: {
      left: -2px;
      right: $horizontal-list-gap;
    }
  }
}
```

```scss
// bootstrap.scss
@forward "src/list" hide list-reset, $horizontal-list-gap;
```

**添加前缀**

官网🌰

```scss
// src/_list.scss
@mixin reset {
  margin: 0;
  padding: 0;
  list-style: none;
}
```

```scss
// bootstrap.scss
@forward "src/list" as list-*; // 添加前缀 list-
```

```scss
// styles.scss
@use "bootstrap";

li {
  @include bootstrap.list-reset;
}
```

**配置模块**

`@forward`规则还可以加载带有配置的模块。这与`@use`的工作原理基本相同，但有一点：`@forward`规则的配置可以使用！其配置中的默认标志。这允许模块更改上游样式表的默认值，同时仍允许下游样式表覆盖它们。

官网🌰

```scss
// _library.scss
$black: #000 !default;
$border-radius: 0.25rem !default;
$box-shadow: 0 0.5rem 1rem rgba($black, 0.15) !default;

code {
  border-radius: $border-radius;
  box-shadow: $box-shadow;
}
```

```scss
// _opinionated.scss
@forward 'library' with (
  $black: #222 !default,
  $border-radius: 0.1rem !default
);
```

```scss
// style.scss
@use 'opinionated' with ($black: #333);
```

## @function的使用

函数是使用@function at规则定义的，该规则是@function＜name＞（＜arguments…＞）｛…｝编写的。函数的名称可以是任何Sass标识符。它只能包含通用语句以及@return at规则，该规则指示用作函数调用结果的值。函数是使用普通CSS函数语法调用的。

官网🌰

**基本使用**

```scss
// 立方公式
@function pow($base, $exponent) {
  $result: 1;
  @for $_ from 1 through $exponent { // @for from... through 包含 start 和 end的值
    $result: $result * $base;
  }
  @return $result; // 返回结果必须使用@return
}

.sidebar {
  float: left;
  margin-left: pow(4, 3) * 1px; // 64px
}
```

**默认参数**

通常，函数声明的每个参数都必须在包含该函数时传递。但是，您可以通过定义一个默认值使参数成为可选的，如果未传递该参数，将使用该默认值。默认值使用与变量声明相同的语法：变量名，后跟冒号和SassScript表达式。这使得定义灵活的函数API变得容易，可以以简单或复杂的方式使用。

```scss
@function invert($color,$amount: 100%) {
    // change-color(color,red,green,blur,hue,saturation,lightness,alpha)
    // hue: 返回颜色在 HSL 色值中的角度值 (0deg - 255deg)
    $inverse: change-color($color,$hue:hue($color) + 180);
    // mix函数，mix(color1,color2,weight)
    @return mix($inverse,$color,$amount);
}

$primary-color: #036;
.header {
    background-color: invert($primary-color, 80%);
}
```

编译为

```css
.header {
  background-color: #523314;
}
```



**关键字参数**

官网栗子

```scss
$primary-color: #036;
.banner {
  background-color: $primary-color;
  color: scale-color($primary-color, $lightness: +40%);
}
```

编译为

```css
.banner {
  background-color: #036;
  color: #0a85ff;
}
```

**任意参数**

```scss
@function sum($numbers...) {
  $sum: 0;
  @each $number in $numbers {
    $sum: $sum + $number;
  }
  @return $sum;
}

.micro {
  width: sum(50px, 30px, 100px);
}
```

编译为

```css
.micro {
  width: 180px;
}
```

