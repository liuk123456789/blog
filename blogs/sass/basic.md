---
title: sass的基本用法
date: 2023-01-12
categories: 
 - sass
tags:
 - sass basic usage
sidebar: auto
---

## 1. 前期准备

因为项目使用了vue3 + TS + vite ，所以就通过此来展示sass的用法

## 2. 基本功能

1. 嵌套规则

   ```scss
   .test {
     .test-head {
       font-size: 18px;
     }
   }
   ```

2. 父选择器 &

   ```scss
   .test {
       // 这里等同于 .test:hover
       &:hover {
           color: pink;
       }
       .test-head {
           font-size: 18px
       }
   }
   ```

3. 属性嵌套

   ```scss
   .test {
       // 这里等同于 .test:hover
       &:hover {
           color: pink;
       }
       .test-head {
           // 这里就是属性嵌套
           font: 18px {
               family: fantasy;
               weight: bold;  
           }
       }
   }
   ```

   

4. 变量

   ```scss
   $main-font-size: 18px;
   
   .test {
     // 这里等同于 .test:hover
     &:hover {
       color: pink;
     }
     .test-head {
       // 这里就是属性嵌套
       font: {
         size: $main-font-size;
         family: fantasy;
         weight: bold;  
       }
     }
   }
   ```

   效果如图

   ![](/my-blog/sass/basic/sass-basic_one.jpg)

## 3. sass 数据类型

- 数字，`1, 2, 13, 10px`
- 字符串，有引号字符串与无引号字符串，`"foo", 'bar', baz`
- 颜色，`blue, #04a3f9, rgba(255,0,0,0.5)`
- 布尔型，`true, false`
- 空值，`null`
- 数组 (list)，用空格或逗号作分隔符，`1.5em 1em 0 2em, Helvetica, Arial, sans-serif`
- maps, 相当于 JavaScript 的 object，`(key1: value1, key2: value2)`

### 3.1 字符串

使用#{}插值表达式将有引号字符串转无引号字符串

```scss
$main-font-size: 18px;

@mixin test-margin($pt) {
  padding-top: #{$pt}px
}

.test {
  // 这里等同于 .test:hover
  &:hover {
    color: pink;
  }
  .test-head {
    // 这里就是属性嵌套
    font: {
      size: $main-font-size;
      family: fantasy;
      weight: bold;  
    }
    @include test-margin('20')
  }
}
```

### 3.2 数组/Maps/colors

后续会提及用处

## 4. 计算

1. 除法

   1. 

   ```scss
   .test-head {
     $width: 1000px;
     width: $width/2;            // Uses a variable, does division
     width: round(1.5)/2;        // Uses a function, does division
     height: 500px/2;          // Uses parentheses, does division
     margin-left: 5px + 8px/2px;
   }
   ```

   PS: 
   vue3 + vite 搭建项目不出意外会提示下面错误

   > Deprecation Warning: Using / for division outside of calc() is deprecated and will be removed in Dart Sass 2.0.0.

   可用以下办法解决

   1. @use 'sass:math' + math.div

      ```scss
      @use 'sass:math';
      
      .test-head {
        $width: 1000px;
        width: math.div($width,2);            // Uses a variable, does division
        width: math.div(round(1.5),2);        // Uses a function, does division
        height: math.div(500px,2);          // Uses parentheses, does division
        margin-left: 5px + math.div(8px,2px);
      }
      ```

      

   2. 使用calc

      ```scss
      .test-head {
        $width: 1000px;
        width: calc($width/2);            // Uses a variable, does division
        width: calc(round(1.5)/2);        // Uses a function, does division
        height: calc(500px/2);          // Uses parentheses, does division
        margin-left: 5px + calc(8px/2px);
      }
      ```

2. 颜色

   ```scss
   @use 'sass:math';
   
   .test-head {
     $width: 1000px;
     width: math.div($width,2);            // Uses a variable, does division
     width: math.div(round(1.5),2);        // Uses a function, does division
     height: math.div(500px,2);          // Uses parentheses, does division
     margin-left: 5px + math.div(8px,2px);
     // 颜色的mix函数
     color:  mix(rgba(255, 0, 0, 0.75) , rgba(0, 255, 0, 0.75), 80%);
     // color: #010203 + #040506; 已经废弃
   }
   ```

3.  加法

   ```scss
   @use 'sass:math';
   
   .test-head {
     $width: 1000px;
     width: math.div($width,2);            // Uses a variable, does division
     width: math.div(round(1.5),2);        // Uses a function, does division
     height: math.div(500px,2);          // Uses parentheses, does division
     margin-left: 5px + math.div(8px,2px);
     // 颜色的mix函数
     color:  mix(rgba(255, 0, 0, 0.75) , rgba(0, 255, 0, 0.75), 80%);
     // color: #010203 + #040506; 已经废弃
   }
   ```

   规则： 最终的结果根据+ 左侧字符是否有引号，有则有，反之无

   使用插值表达式

   ```scss
   @use 'sass:math';
   
   .test-head {
     $width: 1000px;
     $margin: 6;
     width: math.div($width,2);            // Uses a variable, does division
     width: math.div(round(1.5),2);        // Uses a function, does division
     height: math.div(500px,2);          // Uses parentheses, does division
     margin: #{$margin + 6}px  auto;
     // 颜色的mix函数
     color:  mix(rgba(255, 0, 0, 0.75) , rgba(0, 255, 0, 0.75), 80%);
     // color: #010203 + #040506; 已经废弃
   }
   ```

4.  变量定义

   如果变量定义过了，那么不在重新取值，否则取值

   ```scss
   @use 'sass:math';
   
   .test-head {
     $width: 1000px;
     $width: 2000px !default; //
     $margin: 6;
     width: math.div($width,2);            // Uses a variable, does division
     width: math.div(round(1.5),2);        // Uses a function, does division
     height: math.div(500px,2);          // Uses parentheses, does division
     margin: #{$margin + 6}px  auto;
     // 颜色的mix函数
     color:  mix(rgba(255, 0, 0, 0.75) , rgba(0, 255, 0, 0.75), 80%);
     // color: #010203 + #040506; 已经废弃
   }
   ```

   PS: 如果变量值为空值，那么看作未赋值

   ```
   @use 'sass:math';
   
   .test-head {
     $width: null;
     $width: 2000px !default; //
     $margin: 6;
     width: math.div($width,2);            // Uses a variable, does division
     width: math.div(round(1.5),2);        // Uses a function, does division
     height: math.div(500px,2);          // Uses parentheses, does division
     margin: #{$margin + 6}px  auto;
     // 颜色的mix函数
     color:  mix(rgba(255, 0, 0, 0.75) , rgba(0, 255, 0, 0.75), 80%);
     // color: #010203 + #040506; 已经废弃
   }
   ```

## 5. @-Rules与指令

1. @import 导入scss 文件

   常规导入

   ```scss
   @import '@/assets/styles/basic.scss'
   ```

   同时导入多个

   ```scss
   @import '@/assets/styles/basic.scss', '@/assets/styles/index.scss'
   ```

   partials：需要导入SCSS或Sass文件，但不希望编译css，在文件名添加_，但是导入语句是不需要区分的

   新建_mixin.scss文件

   ```scss
   @mixin test-margin($pt) {
     padding-top: #{$pt}px;
   }
   ```

   引入_mixin.scss文件

   ```scss
   @use 'sass:math';
   
   // 无需./_mixin这种方式引入
   @import './mixin';
   
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
       @include test-margin('20')
     }
   }
   ```

   

2. @media

   Sass 中 `@media` 指令与 CSS 中用法一样，只是增加了一点额外的功能：允许其在 CSS 规则中嵌套。如果 `@media` 嵌套在 CSS 规则内，编译时，`@media` 将被编译到文件的最外层，包含嵌套的父选择器。这个功能让 `@media` 用起来更方便，不需要重复使用选择器，也不会打乱 CSS 的书写流程。

   ```scss
   .sidebar {
     width: 300px;
     @media screen and (orientation: landscape) {
       width: 500px;
     }
   }
   ```

   编译

   ```scss
   .sidebar {
     width: 300px; }
     @media screen and (orientation: landscape) {
       .sidebar {
         width: 500px; } }
   ```

   

3. @extend

   基础使用

   ```scss
   .error {
     border: 1px #f00;
     background-color: #fdd;
   }
   .seriousError {
     // 将一个选择器下的所有样式继承给另一个选择器
     @extend .error; // 继承.error的样式
     border-width: 3px;
   }
   ```

   `@extend` 的作用是将重复使用的样式 (`.error`) 延伸 (extend) 给需要包含这个样式的特殊样式（`.seriousError`），刚刚的例子：

   ```scss
   .error {
     border: 1px #f00;
     background-color: #fdd;
   }
   .error.intrusion {
     background-image: url("/image/hacked.png");
   }
   .seriousError {
     @extend .error;
     border-width: 3px;
   }
   ```

   编译为

   ```css
   .error, .seriousError {
     border: 1px #f00;
     background-color: #fdd; }
   
   .error.intrusion, .seriousError.intrusion {
     background-image: url("/image/hacked.png"); }
   
   .seriousError {
     border-width: 3px; }
   ```

   复杂的选择器 

   Class 选择器并不是唯一可以被延伸 (extend) 的，Sass 允许延伸任何定义给单个元素的选择器，比如 `.special.cool`，`a:hover` 或者 `a.user[href^="http://"]` 等

   ```scss
   .hoverlink {
     @extend a:hover;
   }
   ```

   同 class 元素一样，`a:hover` 的样式将继承给 `.hoverlink`。

   ```scss
   .hoverlink {
     @extend a:hover;
   }
   a:hover {
     text-decoration: underline;
   }
   ```

   编译为

   ```css
   a:hover, .hoverlink {
     text-decoration: underline; }
   ```

   多量延伸

   ```scss
   .error {
     border: 1px #f00;
     background-color: #fdd;
   }
   .attention {
     font-size: 3em;
     background-color: #ff0;
   }
   .seriousError {
     @extend .error;
     @extend .attention;
     border-width: 3px;
   }
   ```

   编译为

   ```css
   .error, .seriousError {
     border: 1px #f00;
     background-color: #fdd; }
   
   .attention, .seriousError {
     font-size: 3em;
     background-color: #ff0; }
   
   .seriousError {
     border-width: 3px; }
   ```

   继续延伸

   当一个选择器延伸给第二个后，可以继续将第二个选择器延伸给第三个

   ```scss
   .error {
     border: 1px #f00;
     background-color: #fdd;
   }
   .seriousError {
     @extend .error;
     border-width: 3px;
   }
   .criticalError {
     @extend .seriousError;
     position: fixed;
     top: 10%;
     bottom: 10%;
     left: 10%;
     right: 10%;
   }
   ```

   编译为

   ```css
   .error, .seriousError, .criticalError {
     border: 1px #f00;
     background-color: #fdd; }
   
   .seriousError, .criticalError {
     border-width: 3px; }
   
   .criticalError {
     position: fixed;
     top: 10%;
     bottom: 10%;
     left: 10%;
     right: 10%; }
   ```

   暂时不可以将选择器列 (Selector Sequences)，比如 `.foo .bar` 或 `.foo + .bar`，延伸给其他元素，但是，却可以将其他元素延伸给选择器列

   ```scss
   #fake-links .link {
     @extend a;
   }
   
   a {
     color: blue;
     &:hover {
       text-decoration: underline;
     }
   }
   ```

   编译为

   ```css
   a, #fake-links .link {
     color: blue; }
     a:hover, #fake-links .link:hover {
       text-decoration: underline; }
   ```

   @extend-only

   有时，需要定义一套样式并不是给某个元素用，而是只通过 `@extend` 指令使用，尤其是在制作 Sass 样式库的时候，希望 Sass 能够忽略用不到的样式。

   如果使用普通的 CSS 规则，最后会编译出很多用不到的样式，也容易与其他样式名冲突，所以，Sass 引入了“占位符选择器” (placeholder selectors)，看起来很像普通的 `id` 或 `class` 选择器，只是 `#` 或 `.` 被替换成了 `%`。可以像 class 或者 id 选择器那样使用，当它们单独使用时，不会被编译到 CSS 文件中。

   ```scss
   // This ruleset won't be rendered on its own.
   #context a%extreme {
     color: blue;
     font-weight: bold;
     font-size: 2em;
   }
   ```

   占位符选择器需要通过延伸指令使用，用法与 class 或者 id 选择器一样，被延伸后，占位符选择器本身不会被编译。

   ```scss
   .notice {
     @extend %extreme;
   }
   ```

   编译为

   ```scss
   #context a.notice {
     color: blue;
     font-weight: bold;
     font-size: 2em; }
   ```



## 6. 控制指令

### @if

当 `@if` 的表达式返回值不是 `false` 或者 `null` 时，条件成立，输出 `{}` 内的代码：

```scss
p {
  @if 1 + 1 == 2 { border: 1px solid; }
  @if 5 < 3 { border: 2px dotted; }
  @if null  { border: 3px double; }
}
```

编译为

```css
p {
  border: 1px solid;
}
```

`@if` 声明后面可以跟多个 `@else if` 声明，或者一个 `@else` 声明。如果 `@if` 声明失败，Sass 将逐条执行 `@else if` 声明，如果全部失败，最后执行 `@else` 声明

```scss
$type: monster;
p {
  @if $type == ocean {
    color: blue;
  } @else if $type == matador {
    color: red;
  } @else if $type == monster {
    color: green;
  } @else {
    color: black;
  }
}
```

编译为

```css
p {
  color: green;
}
```

### @for

这个指令包含两种格式：`@for $var from <start> through <end>`，或者 `@for $var from <start> to <end>`，区别在于 `through` 与 `to` 的含义：*当使用 `through` 时，条件范围包含 `<start>` 与 `<end>` 的值，而使用 `to` 时条件范围只包含 `<start>` 的值不包含 `<end>` 的值*。另外，`$var` 可以是任何变量，比如 `$i`；`<start>` 和 `<end>` 必须是整数值。

```scss
@for $i from 1 through 3 {
  .item-#{$i} { width: 2em * $i; }
}
```

编译

```scss
.item-1 {
  width: 2em;
}
.item-2 {
  width: 4em;
}
.item-3 {
  width: 6em;
}
```

### @each

`@each` 指令的格式是 `$var in <list>`, `$var` 可以是任何变量名，比如 `$length` 或者 `$name`，而 `<list>` 是一连串的值，也就是值列表。

```scss
@each $mt in 2,4,6,8 {
    .mt-#{$mt} {
        margin-top: #{$mt}px
    }
}
```

编译为

```
.mt-2 {
  margin-top: 2px;
}
.mt-4 {
  margin-top: 4px;
}
.mt-6 {
  margin-top: 6px;
}
.mt-8 {
  margin-top: 8px;
}
```

**多重赋值**

```scss
@each $animal, $color, $cursor in (puma, black, default),
                                  (sea-slug, blue, pointer),
                                  (egret, white, move) {
  .#{$animal}-icon {
    background-image: url('/images/#{$animal}.png');
    border: 2px solid $color;
    cursor: $cursor;
  }
}
```

编译为

```css
.puma-icon {
  background-image: url('/images/puma.png');
  border: 2px solid black;
  cursor: default;
}
.sea-slug-icon {
  background-image: url('/images/sea-slug.png');
  border: 2px solid blue;
  cursor: pointer;
}
.egret-icon {
  background-image: url('/images/egret.png');
  border: 2px solid white;
  cursor: move;
}
```

**由于映射被视为成对的列表，因此多重赋值也适用于它们**

```scss
@each $header, $size in (h1: 2em, h2: 1.5em, h3: 1.2em) {
  #{$header} {
    font-size: $size;
  }
}
```

编译为

```css
h1 {
  font-size: 2em;
}
h2 {
  font-size: 1.5em;
}
h3 {
  font-size: 1.2em;
}
```

### @while

`@while` 指令重复输出格式直到表达式返回结果为 `false`。这样可以实现比 `@for` 更复杂的循环，只是很少会用到

```scss
$i: 6;
@while $i > 0 {
  .item-#{$i} { width: 2em * $i; }
  $i: $i - 2;
}
```

编译

```css
.item-6 {
  width: 12em;
}

.item-4 {
  width: 8em;
}

.item-2 {
  width: 4em;
}
```

### @mixin & @include

**常规用法**

```scss
@mixin large-text {
  font: {
    family: Arial;
    size: 20px;
    weight: bold;
  }
  color: #ff0000;
}
```

使用`@include`引用

```scss
.test {
	@include large-text;
}
```

**最外层引用混合样式**

```scss
@mixin large-text {
  .outer-mixin {
    font: {
        family: Arial;
        size: 20px;
        weight: bold;
    }
	color: #ff0000;
  }
}
@include large-text
```

编译为

```css
.outer-mixin {
    font-family: Arial;
    font-size: 20px;
    font-weight: bold;
    color: #ff0000;
}
```

**混合样式中也可以引用其他的混合样式**

```scss
@mixin compound {
  @include highlighted-background;
  @include header-text;
}
@mixin highlighted-background { background-color: #fc0; }
@mixin header-text { font-size: 20px; }
```

**混合样式的参数**

```scss
@mixin sexy-border($color, $width) {
  border: {
    color: $color;
    width: $width;
    style: dashed;
  }
}
p { @include sexy-border(blue, 1in); }
```

编译

```css
p {
  border-color: blue;
  border-width: 1in;
  border-style: dashed;
}
```

**混合样式默认值**

```scss
@mixin sexy-border($color, $width: 1in) {
  border: {
    color: $color;
    width: $width;
    style: dashed;
  }
}
p { @include sexy-border(blue); }
h1 { @include sexy-border(blue, 2in); }
```

编译为

```css
p {
  border-color: blue;
  border-width: 1in;
  border-style: dashed;
}

h1 {
  border-color: blue;
  border-width: 2in;
  border-style: dashed;
}
```

携带关键词传参

```scss
p { @include sexy-border($color: blue); }
h1 { @include sexy-border($color: blue, $width: 2in); }
```

**参数变量**

**可以使用参数变量 `…` 声明（写在参数的最后方）告诉 Sass 将这些参数视为值列表处理**

```scss
@mixin box-shadow($shadows...) {
  -moz-box-shadow: $shadows;
  -webkit-box-shadow: $shadows;
  box-shadow: $shadows;
}
.shadows {
  @include box-shadow(0px 4px 5px #666, 2px 6px 10px #999);
}
```

**参数变量也可以用在引用混合指令的时候 (`@include`)，与平时用法一样，将一串值列表中的值逐条作为参数引用**

```scss
@mixin colors($text, $background, $border) {
  color: $text;
  background-color: $background;
  border-color: $border;
}
$values: #ff0000, #00ff00, #0000ff;
.primary {
  @include colors($values...);
}
```

**@mixin + @content**

```scss
@mixin mixin-content {
  .mixin-pre {
    @content;
  }
}
@include mixin-content {
  .mixin-content__test {
    color: pink;
  }
}
```

编译为

```css
.mixin-pre .mixin-content__test {
    color: pink;
}
```

**`@content` 在指令中出现过多次或者出现在循环中时，额外的代码将被导入到每一个地方**

官网栗子如下

```scss
$color: white;
@mixin colors($color: blue) {
  background-color: $color;
  @content;
  border-color: $color;
}
.colors {
  @include colors { color: $color; }
}
```

编译为

```css
.colors {
  background-color: blue;
  color: white;
  border-color: blue;
}
```

## 6. function指令

官网栗子

```scss
$grid-width: 40px;
$gutter-width: 10px;

@function grid-width($n) {
  @return $n * $grid-width + ($n - 1) * $gutter-width;
}

#sidebar { width: grid-width(5); }
```

编译为

```css
#sidebar {
  width: 240px; }
```

与 mixin 相同，也可以传递若干个全局变量给函数作为参数。一个函数可以含有多条语句，需要调用 `@return` 输出结果。

自定义的函数也可以使用关键词参数，上面的例子还可以这样写：

```scss
#sidebar { width: grid-width($n: 5); }
```