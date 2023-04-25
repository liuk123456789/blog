---
title: Sass的内置模块
date: 2023-01-13
categories: 
 - Sass
tags:
 - Sass built-in module
sidebar: auto
---

## sass:list

在`sass`中，每个映射都算作一个列表，其中包含每个键/值对的两个元素列表。例如，（1:2,3:4）计为（1,2,34）。因此，所有这些函数也适用于map！

> 使用时，请使用@use 'sass:list' 引入

**append**

```scss
@use 'sass:list'
    
$-marginMaps: 10px 20px;
$-sperateMaps: 10px,20px;

.test-mt1 {
  margin: list.append($-marginMaps, 30px 40px) // 10px 20px 30px 40px
}

.test-mt2 {
  margin: list.append($-sperateMaps,(30px 40px), $separator: space)
}
```

**index**

获取值的下标

```scss
@use 'sass:list'
    
$-marginMaps: 10px 20px;
$-sperateMaps: 10px,20px;

.test-mt1 {
  margin: list.append($-marginMaps, 30px 40px) // 10px 20px 30px 40px
}

.test-mt2 {
  margin: list.append($-sperateMaps,(30px 40px), $separator: space)
}

.test-mt3 {
    margin: #{list.index($-marginMaps, 20px) * 8}px; // 8px
}
```

**is-bracketed**

是否有中括号

```scss
@use 'sass:list';
$-marginMaps: 10px,20px;
$-appendMaps: 30px 40px;
$-bracketMaps: [a b c];

@function setMargin() {
  $result: list.index($-marginMaps, 20px);
  // 判定定义变量中是否存在中括号
  $isBracketed: list.is-bracketed($-bracketMaps);
  @if($isBracketed) {
    @return 10;
  } @else if ($result) {
    @return $result * 8;
  } @else {
    @return 4;
  }
}

.test-mt3 {
  margin: #{setMargin()}px;    
}
```

**join**

```scss
@use 'sass:list';

$-marginMaps: 10px,20px;
$-appendMaps: 30px 40px;

// 不设置分隔符
.test-mt1 {
  margin: list.join($-marginMaps,$-appendMaps); // 10px,20px,30px 40px
}

// 设置分隔符
.test-mt2 {
  margin: list.join($-marginMaps,$-appendMaps, $separator: space) // 10px 20px 30px 40px
}
```

**length**

```scss
.test-mt {
  margin: #{list.length($-marginMaps)}px; // 2px
}
```

**nth**

根据填写key，获取value

```scss
@debug list.nth(10px 12px 16px, 2); // 12px
// -1代表倒数第一个
@debug list.nth([line1, line2, line3], -1); // line3
```

## sass:math

**常量**

```scss
@debug math.$e // 2.7182818285
```

```scss
@debug math.$pi // 3.1415926536
```

**函数**

1. ceill

   取整，进行四舍五入

   ```scss
   @debug math.ceil(4); // 4
   @debug math.ceil(4.2); // 4
   @debug math.ceil(4.9); // 5
   ```

2. clamp

   将$number限制在$min和$max之间。如果$number小于$min，则返回$min，如果大于$max，则返回$max。

   $min、$number和$max必须具有兼容的单位，或者都是无单位的。

   ```scss
   @debug math.clamp(-1,0,1); // 0
   @debug math.clamp(1px,-1px,10px); // 1px
   @debug math.clamp(-lin,1cm,10mm); // 10mm
   ```

3. floor

   取整，不进行四舍五入

   ```scss
   @debug math.floor(4); // 4
   @debug math.floor(4.2); // 4
   @debug math.floor(4.9); // 4
   ```

4. max

   获取一组数据中的最大值

   ```scss
   @debug math.max(1px,4px); // 4px
   
   $widths: 50px, 30px, 100px;
   @debug math.max($widths...); // 100px
   ```

5. min

   获取一组数据中的最小值

   ```scss
   @debug math.min(1px, 4px); // 1px
   
   $widths: 50px, 30px, 100px;
   @debug math.min($widths...); // 30px
   ```

6. round

   四舍五入

   ```scss
   @debug math.round(4); // 4
   @debug math.round(4.2); // 4
   @debug math.round(4.9); // 5
   ```

7. abs

   获取绝对值

   ```scss
   @debug math.abs(10px); // 10px
   @debug math.abs(-10px); // 10px
   ```

## sass:string

**quote**

```scss
string.quote($string)
```

以带引号的字符串形式返回$string

```scss
@debug string.quote(Helvetica); // "Helvetica"
@debug string.quote("Helvetica"); // "Helvetica"
```

**index**

```scss
string.index($string, $substring)
```

返回$string中$substring的第一个索引，如果$string不包含$ssubstring，则返回null。

```scss
@debug string.index("Helvetica Neue", "Helvetica"); // 1
@debug string.index("Helvetica Neue", "Neue"); // 11
```

**insert**

```scss
string.insert($string, $insert, $index)
```

返回在$index处插入$insert的$string的副本。

```scss
@debug string.insert("Roboto Bold", "Mono", 7); // "Roboto Mono Bold"
@debug string.insert("Roboto Bold", "Mono", -6); // "Roboto Mono Bold"
```

如果$index的长度大于$string的长度，则将$insert添加到末尾。如果$index小于字符串的负长度，则将$insert添加到开头

```scss
@debug string.insert("Roboto", " Bold", 100); // "Roboto Bold"
@debug string.insert("Bold", "Roboto ", -100); // "Roboto Bold"
```

**length**

```scss
string.length($string)
```

返回$string中的字符数。

```scss
@debug string.length("Helvetica Neue"); // 14
@debug string.length(bold); // 4
@debug string.length(""); // 0
```

**slice**

```scss
string.slice($string, $start-at, $end-at: -1)
```

返回$string的片段，该片段从索引$start at开始，到索引$end at结束（包括两者）

```scss
@debug string.slice("Helvetica Neue", 11); // "Neue"
@debug string.slice("Helvetica Neue", 1, 3); // "Hel"
@debug string.slice("Helvetica Neue", 1, -6); // "Helvetica"
```

**to-upper-case**

```scss
string.to-upper-case($string)
```

返回将ASCII字母转换为大写的$字符串副本。

```scss
@debug string.to-upper-case("Bold"); // "BOLD"
@debug string.to-upper-case(sans-serif); // SANS-SERIF
```

**to-lower-case**

```scss
string.to-lower-case($string)
```

返回将ASCII字母转换为小写的$字符串副本。

```scss
@debug string.to-lower-case("Bold"); // "bold"
@debug string.to-lower-case(SANS-SERIF); // sans-serif
```

**unique-id**

```scss
string.unique-id()
```

返回一个随机生成的未加引号的字符串，该字符串保证是有效的CSS标识符，并且在当前Sass编译中是唯一的。

```scss
@debug string.unique-id(); // uabtrnzug
@debug string.unique-id(); // u6w1b1def
```

**quote**

```scss
string.unquote($string)
```

将$string作为未加引号的字符串返回。这可能会产生无效的CSS字符串，因此请谨慎使用。

```scss
@debug string.unquote("Helvetica"); // Helvetica
@debug string.unquote(".widget:hover"); // .widget:hover
```

## sass:map

**deep-merge**

```scss
map.deep-merge($map1, $map2) //=> map 
```

与map.merge（）相同，只是嵌套的map值也会递归合并。

```scss
$helvetica-light: (
  "weights": (
    "lightest": 100,
    "light": 300
  )
);
$helvetica-heavy: (
  "weights": (
    "medium": 500,
    "bold": 700
  )
);

@debug map.deep-merge($helvetica-light, $helvetica-heavy);
// (
//   "weights": (
//     "lightest": 100,
//     "light": 300,
//     "medium": 500,
//     "bold": 700
//   )
// )
@debug map.merge($helvetica-light, $helvetica-heavy);
// (
//   "weights": (
//     "medium: 500,
//     "bold": 700
//   )
// )
```

**deep-remove**

```scss
map.deep-remove($map, $key, $keys...) //=> map 
```

如果$key为空，则返回$map的副本，该副本没有与$key关联的值。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.deep-remove($font-weights, "regular");
// ("medium": 500, "bold": 700)
```

如果$keys不为空，则从左到右跟随一组键，包括$key并排除$keys中的最后一个键，以查找要更新的嵌套映射。

返回$map的副本，其中目标映射没有与$keys中的最后一个键关联的值。

```scss
$fonts: (
  "Helvetica": (
    "weights": (
      "regular": 400,
      "medium": 500,
      "bold": 700
    )
  )
);

@debug map.deep-remove($fonts, "Helvetica", "weights", "regular");
// (
//   "Helvetica": (
//     "weights: (
//       "medium": 500,
//       "bold": 700
//     )
//   )
// )
```

**get**

```scss
map.get($map, $key, $keys...)
```

如果$key为空，则返回$map中与$key关联的值。

如果$map没有与$key关联的值，则返回null。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.get($font-weights, "medium"); // 500
@debug map.get($font-weights, "extra-bold"); // null
```

如果$keys不为空，则从左到右跟随一组键，包括$key，并排除$keys中的最后一个键，以查找要搜索的嵌套映射。



返回目标映射中与$keys中的最后一个键关联的值。



如果映射没有与键关联的值，或者$keys中的任何键在映射中缺失或引用了非映射的值，则返回null。

```scss
$fonts: (
  "Helvetica": (
    "weights": (
      "regular": 400,
      "medium": 500,
      "bold": 700
    )
  )
);

@debug map.get($fonts, "Helvetica", "weights", "regular"); // 400
@debug map.get($fonts, "Helvetica", "colors"); // null
```

**has-key**

```scss
map.has-key($map, $key, $keys...)
```

如果$key为空，则返回$map是否包含与$key关联的值。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.has-key($font-weights, "regular"); // true
@debug map.has-key($font-weights, "bolder"); // false
```

如果$keys不为空，则从左到右跟随一组键，包括$key，并排除$keys中的最后一个键，以查找要搜索的嵌套映射。



如果目标映射包含与$keys中的最后一个键关联的值，则返回true。



如果没有，或者$keys中的任何键在映射中缺失或引用了非映射的值，则返回false。

```scss
$fonts: (
  "Helvetica": (
    "weights": (
      "regular": 400,
      "medium": 500,
      "bold": 700
    )
  )
);

@debug map.has-key($fonts, "Helvetica", "weights", "regular"); // true
@debug map.has-key($fonts, "Helvetica", "colors"); // false
```

**keys**

```scss
map.keys($map)
```

返回$map中所有键的`逗号`分隔列表。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.keys($font-weights); // "regular", "medium", "bold"
```

**merge**

```scss
map.merge($map1, $map2)
map-merge($map1, $map2)
map.merge($map1, $keys..., $map2)
map-merge($map1, $keys..., $map2) //=> map 
```

如果未传递$keys，则返回包含$map1和$map2中所有键和值的新映射。

如果$map1和$map2都具有相同的键，则$map2的值优先。

返回的映射中也出现在$map1中的所有键的顺序与$map1相同。$map2中的新键将显示在maps的末尾。

```scss
$light-weights: ("lightest": 100, "light": 300);
$heavy-weights: ("medium": 500, "bold": 700);

@debug map.merge($light-weights, $heavy-weights);
// ("lightest": 100, "light": 300, "medium": 500, "bold": 700)
```

如果$keys不为空，请跟随$keys查找要合并的嵌套映射。如果$keys中的任何键在映射中缺失或引用的值不是映射，请将该键处的值设置为空映射。

返回$map1的副本，其中目标映射被新映射替换，新映射包含目标映射和$map2中的所有键和值。

```scss
$fonts: (
  "Helvetica": (
    "weights": (
      "lightest": 100,
      "light": 300
    )
  )
);
$heavy-weights: ("medium": 500, "bold": 700);

@debug map.merge($fonts, "Helvetica", "weights", $heavy-weights);
// (
//   "Helvetica": (
//     "weights": (
//       "lightest": 100,
//       "light": 300,
//       "medium": 500,
//       "bold": 700
//     )
//   )
// )
```

**remove**

```scss
map.remove($map, $keys...)
```

返回$map的副本，其中没有与$keys关联的任何值。

如果$keys中的某个键在$map中没有关联值，则会忽略它。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.remove($font-weights, "regular"); // ("medium": 500, "bold": 700)
@debug map.remove($font-weights, "regular", "bold"); // ("medium": 500)
@debug map.remove($font-weights, "bolder");
// ("regular": 400, "medium": 500, "bold": 700)
```

**set**

```scss
map.set($map, $key, $value)
```

如果未传递$keys，则返回$map的副本，$key处的值设置为$value。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.set($font-weights, "regular", 300);
// ("regular": 300, "medium": 500, "bold": 700)
```

```scss
$fonts: (
  "Helvetica": (
    "weights": (
      "regular": 400,
      "medium": 500,
      "bold": 700
    )
  )
);

@debug map.set($fonts, "Helvetica", "weights", "regular", 300);
// (
//   "Helvetica": (
//     "weights": (
//       "regular": 300,
//       "medium": 500,
//       "bold": 700
//     )
//   )
// )
```

**values**

```scss
map.values($map)
```

返回$map中所有值的逗号分隔列表。

```scss
$font-weights: ("regular": 400, "medium": 500, "bold": 700);

@debug map.values($font-weights); // 400, 500, 700
```

## sass:color sass:meta sass:selector

也不太熟悉，所以用法请参考[官网](https://sass-lang.com/documentation/modules/color)
