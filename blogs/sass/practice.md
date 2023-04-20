---
title: sass的实践
date: 2023-04-03
categories: 
 - sass
tags:
 - sass practice
sidebar: auto
---

## 1. 版本说明

>   "sass": "^1.57.1",
>
>   "sass-loader": "^13.2.0",
>
>   "vue": "^3.2.38",
>
>   "vite": "^3.0.9",

## 2. 全局变量配置

这里通过`vite`配置全局变量，当然，也可以在入口文件中进行引入全局变量， `vite.config.ts`配置如下

```typescript
export default defineConfig(({ mode, command }: ConfigEnv): UserConfig => {
	return {
		css: {
            preprocessorOptions: {
                scss: {
                  additionalData: '@use "@/assets/styles/element/index.scss" as *;@use "@/assets/styles/variable.scss";'
                }
            }
        }
	}
}
```

在`sass`进阶中，提到过`@use`引入`scss`模块的规则

> ```scss
> @use './mixin' as *; // 全局， 可直接使用 @include ***等
> @use './mixin' as mixinModule; // 命名空间， 使用时需要 @include mixinModule.***等
> @use './mixin'; // 等同于 @use './mixin' as mixin; 使用时需要 @include mixin.***等
> ```

根据上述规则，所以我们在使用全局变量时需要加上命名空间

```scss
.test-content {
    color: variable.$secondaryColor; // color: #666
}
```

> 备注：在入口文件中直接引入全局变量，需要注意的是：如果存在第二个全局引入的`scss`文件，此文件中不能直接使用全局变量，需要@use 引入

## 3. helper 辅助样式

1. **flex**布局

   ```scss
   $-flex-maps: 'start', 'center', 'around', 'between', 'end';
   $-align-maps: 'start', 'center', 'baseline', 'stretch', 'end';
   
   @each $justify in $-flex-maps {
     @each $align in $-align-maps {
       .flex-#{$justify}-#{$align} {
         display: flex;
         @if $justify == 'start' or $justify == 'end' {
           justify-content: flex-#{$justify};
         } @else if $justify == 'around' or $justify == 'between' {
           justify-content: space-#{$justify};
         } @else {
           justify-content: #{$justify};
         }
         @if $align != 'start' and $align != 'end' {
           align-items: #{$align};
         } @else {
           align-items: flex-#{$align};
         }
       }
     }
   }
   ```

   1. `@if`和`and`、`or`、`not`使用代表与/或/非
   2. 使用`#{}`插值表达式将有引号字符串转无引号字符串

2. **space**&**border-radius**

   ```scss
   @each $value in $-spaceList {
     .mt-#{$value} {
       margin-top: #{$value}px;
     }
     .ml-#{$value} {
       margin-left: #{$value}px;
     }
     .mr-#{$value} {
       margin-right: #{$value}px;
     }
     .mb-#{$value} {
       margin-bottom: #{$value}px;
     }
   
     @each $key in $-spaceList {
       .m-#{$value}-#{$key} {
         margin: #{$value}px #{$key}px
       }
       .p-#{$value}-#{$key} {
         padding: #{$value}px #{$key}px
       }
     }
   }
   
   @each $border in $-radiusList {
     .b-#{$border} {
       border-radius: #{$border}px;
     }
   }
   ```

## 4. @mixin & @include

`_mixin.scss`文件内容如下

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

`basic.scss`中使用`mixin`

```scss
@use './mixin'; // 默认mixin是其命名空间

.test-content {
    @include mixin.wrapped-stylish-mixin($width: 100px);
    color: variable.$secondaryColor;
}
```

## 5. @function

```scss
$-box-shadow: null;
@function -box-shadow() {  
  @return $-box-shadow or (0 0.5rem 1rem rgba($-black, 0.15));
}
```

`@function`常与`@return`搭配，用于返回计算结果

## 6. @forward

根据进阶用法对于`@forward`的说明，注意以下几点

1. `@forward`语句可以引入另一个模块的所有变量、mixins和函数，将它们直接作为当前模块的API暴露出去，而不会真的在当前模块增加代码

2. 不能在当前模块中使用通过`@forward`引入模块的变量、mixins和函数，但是，可以通过`@use 当前模块的path`，从而使用，注意的是模块的私有变量是无法被外部调用的前提依然不变，栗子如下

   ```scss
   /**_mixin.scss*/
   @forward './modules';
   
   @mixin wrapped-stylish-mixin($width) {
     font-size: $-baseSize;
     font-weight: bold;
     margin: #{setMargin()}px;
     @include stylish-mixin($width);
   }
   ```

   ```scss
   /**basic.scss*/
   @use './mixin';
   .test-content {
   	@include mixin.wrapped-stylish-mixin($width: 100px);
   	color: variable.$secondaryColor;
   }
   ```

   此时，是无法解析`setMargin()`函数的，去除`mixin.scss`中的函数调用，在`basic.scss`中直接调用`setMargin()`看下效果

   ```scss
   /**_mixin.scss*/
   @forward './modules';
   
   @mixin wrapped-stylish-mixin($width) {
     font-size: $-baseSize;
     font-weight: bold;
     @include stylish-mixin($width);
   }
   ```

   ```scss
   .test-content {
   	@include mixin.wrapped-stylish-mixin($width: 100px);
   	color: variable.$secondaryColor;
       margin: #{mixin.setMargin()}px;
   }
   
   // result
   .test .test-content {
       font-size: 16px;
       font-weight: bold;
       width: 100px;
       color: #666;
       margin: 10px;
   }
   ```

3.  可使用`hide`/`false`控制成员是否可见

   我们将`setMargin`进行`hide`，会发现编译报错

4. 可以通过`as`添加前缀

   ```scss
   /**_mixin.scss*/
   @forward './modules' as modules-*;
   
   @mixin wrapped-stylish-mixin($width) {
     font-size: $-baseSize;
     font-weight: bold;
     @include stylish-mixin($width);
   }
   ```

   ```scss
   .test-content {
   	@include mixin.wrapped-stylish-mixin($width: 100px);
   	color: variable.$secondaryColor;
       margin: #{mixin.modules-setMargin()}px;
   }
   ```

5. 通过`with`配置模块

   `ElementPlus`的主题自定义

   ```scss
   @forward 'element-plus/theme-chalk/src/common/var.scss' with (
     $colors: (
       'primary': (
         'base': green,
       ),
     ),
   );
   ```

## 7. 内置函数

目前内置函数我使用的很少，这里就说明如何使用，如果到时候用到，可以直接去看官网文档给的栗子

`vue3.x`中使用`sass`内置模块需要通过`@use`这样的方式，同时创建对应的命令空间

```scss
@use "sass:list";
@use "sass:colors";

@function setMargin() {
  $result: list.index($-marginMaps, 20px);
  $isBracketed: list.is-bracketed($-bracketMaps);
  @if($isBracketed) {
    @return 10;
  } @else if ($result) {
    @return $result * 8;
  } @else {
    @return 4;
  }
}
```

## 8. 结尾

为什么使用`@use`而不使用`@import`呢？

**@import的缺点**

1. 无法知道定义的变量、mixin、函数从那里定义
2. 嵌套import会导致重复css代码。如：一个页面中动态引入了一个组件，页面本身需要加载`page.css`，组件的样式由`component.css`决定，而这两个样式表的源scss文件中都用到了`common.scss`，那么在动态引入组件的时候，`common.css`中的样式就会被重复加载，可能对原有的样式造成覆盖
3. 不存在命令空间，css选择器是全局的，需要避免重名问题
4. 没有私有函数的概念。库作者无法确保他们的私有工具函数不会被使用者直接获取，直接使用私有函数可能导致混淆和向后兼容的问题。
5. `@extend`规则可能会影响到样式中的一切选择器，而不是仅仅是作者所希望的那些。

所以`@use`的出现就是解决`@import` 存在的问题

目前只是个人实践中使用到`sass`的一部分功能，不管如何，使用`sass`的最终目的就是为了快速布局

