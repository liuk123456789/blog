---
title: sku 选择器
date: 2023-02-24
categories: 
 - 日常整理
tags:
 - sku selector
sidebar: auto
---

[原文链接](https://juejin.cn/post/7002746459456176158)

## 1. 页面基本架子

> 因为作者使用的是React，本人常用的是vue，所以就用vue来抄袭下作者的思路

```vue
<template>
	<ul>
        <li v-for="(item,index) in type" :key="index" class="mb-16">
    		<el-button 
            	v-for="(spec, itemIndex) in item"
                :key="itemIndex"
                :type="selected.includes(spec) ? 'primary' : ''"
                :disabled="!unDisabled.includes(valueInLabel[spec])"
                @click="onClickSelType(spec, valueInLabel[spec], index)"
            >
            {{spec}}
    		</el-button>
    	</li>
    </ul>
</template>

<script>
export default {
    data() {
        return {
          type: [['男裤', '女裤', '儿童'], ['黑色', '白色', '红色', '粉色'], ['S', 'L', 'XXL', 'M']],
          types: [],
          valueInLabel: {},
          selected: [],
          unDisabled: [],
          canUseSku: [],
          pathFinder: {}
        }
    }
}
</script>
```

- type

  原始数据

- types

  扁平化后的数组

- valueInLabel

  质数和属性的映射关系

- unDisabled

  属性不可选

- canUseSku

  可供选择的sku，某个sku库存不足时，无法进行选择，初始化时传入，对不可进行的sku的进行标记

- pathFinder

  sku选择的核心类

## 2. 实现思路

1. types&valueInLabel

   ```vue
   <template>
   	<ul>
           <li v-for="(item,index) in type" :key="index" class="mb-16">
       		<el-button 
               	v-for="(spec, itemIndex) in item"
                   :key="itemIndex"
                   :type="selected.includes(spec) ? 'primary' : ''"
                   :disabled="!unDisabled.includes(valueInLabel[spec])"
                   @click="onClickSelType(spec, valueInLabel[spec], index)"
               >
               {{spec}}
       		</el-button>
       	</li>
       </ul>
   </template>
   
   <script>
   const isPrime = (number) => {
     for (let ii = 2; ii < number; ++ii) {
       if (number % ii === 0) {
         return false
       }
     }
     return true
   }
   
   const getPrime = (total) => {
     const res = []
     for (let i = 2; res.length < total; i++) {
       if (i === 2 || i === 3) {
         res.push(i)
         continue
       }
       // 质数必定是在6周围，减少判断
       const rest = 6 - (i % 6)
       if (![1, 5].includes(rest)) {
         continue
       }
       if (isPrime(i)) {
         res.push(i)
       }
     }
     return res
   }
   export default {
       data() {
           return {
             type: [['男裤', '女裤', '儿童'], ['黑色', '白色', '红色', '粉色'], ['S', 'L', 'XXL', 'M']],
             types: [],
             valueInLabel: {},
             selected: [],
             unDisabled: [],
             canUseSku: [],
             pathFinder: {}
           }
       },
       mounted() {
           this.types = this.type.flat()
           // 将规格转为质数
           const prime = getPrime(this.types.length)
           // 质数对应属性枚举值
           this.types.forEach((item, index) => {
               this.valueInLabel[item] = prime[index]
           })
       }
   }
   </script>
   ```

2. 使用笛卡尔积将属性组装成sku

   > 笛卡尔乘积是指在数学中，两个[集合] *X* 和 *Y* 的笛卡尔积(Cartesian product)，又称 [ 直积 ] ，表示为 *X*  ×  *Y*，第一个对象是 *X* 的成员而第二个对象是 *Y* 的所有可能 [ 有序对 ] 的其中一个成员
   >
   > 假设集合 A = { a, b }，集合 B = { 0, 1, 2 }，则两个集合的笛卡尔积为 { ( a, 0 ),  ( a, 1 ),  ( a, 2),  ( b, 0),  ( b, 1),  ( b, 2) }

   那么我们可以得出组装的SKU，图下所示

   ![sku-combine](/my-blog/learn/sku/sku-combine.png)

   **实现代码**

   作者通过父级指针的方式，进行循环，父级指针值为null，那么进行下一次遍历，通过count获取二位数组的index，从而获取属性，以此循环，获得最终的笛卡尔积

   ```javascript
    /**
    * 笛卡尔积组装
    * @param {Array} list
    * @returns []
    */
   function descartes(list) {
     // parent 上一级索引;count 指针计数
     let point = {}; // 准备移动指针
     let result = []; // 准备返回数据
     let pIndex = null; // 准备父级指针
     let tempCount = 0; // 每层指针坐标
     let temp = []; // 组装当个 sku 结果
   
     // 一：根据参数列生成指针对象
     for (let index in list) {
       if (typeof list[index] === 'object') {
         point[index] = { parent: pIndex, count: 0 };
         pIndex = index;
       }
     }
   
     // 单维度数据结构直接返回
     if (pIndex === null) {
       return list;
     }
   
     // 动态生成笛卡尔积
     while (true) {
       // 二：生成结果
       let index;
       for (index in list) {
         tempCount = point[index].count;
         temp.push(list[index][tempCount]);
       }
       // 压入结果数组
       result.push(temp);
       temp = [];
   
       // 三：检查指针最大值问题，移动指针
       while (true) {
         if (point[index].count + 1 >= list[index].length) {
           point[index].count = 0;
           pIndex = point[index].parent;
           if (pIndex === null) {
             return result;
           }
           // 赋值 parent 进行再次检查
           index = pIndex;
         } else {
           point[index].count++;
           break;
         }
       }
     }
   }
   ```

   提供一种快速的获取笛卡尔积的方式

   ```javascript
   const descartes = (list) => {
       return list.reduce((total, next) => {
           return total.flatMap(x => next.map(y => [...x, y]))
       }, [[]])
   }
   ```

   > 因为flatMap存在兼容性问题，现在浏览器一般都支持，如果需要兼容，可以使用lodash的flatMap

   **继续完善代码**

   ```vue
   <template>
   	<ul>
           <li v-for="(item,index) in type" :key="index" class="mb-16">
       		<el-button 
               	v-for="(spec, itemIndex) in item"
                   :key="itemIndex"
                   :type="selected.includes(spec) ? 'primary' : ''"
                   :disabled="!unDisabled.includes(valueInLabel[spec])"
                   @click="onClickSelType(spec, valueInLabel[spec], index)"
               >
               {{spec}}
       		</el-button>
       	</li>
       </ul>
   </template>
   
   <script>
   const isPrime = (number) => {
     for (let ii = 2; ii < number; ++ii) {
       if (number % ii === 0) {
         return false
       }
     }
     return true
   }
   
   const getPrime = (total) => {
     const res = []
     for (let i = 2; res.length < total; i++) {
       if (i === 2 || i === 3) {
         res.push(i)
         continue
       }
       // 质数必定是在6周围，减少判断
       const rest = 6 - (i % 6)
       if (![1, 5].includes(rest)) {
         continue
       }
       if (isPrime(i)) {
         res.push(i)
       }
     }
     return res
   }
   export default {
       data() {
           return {
             type: [['男裤', '女裤', '儿童'], ['黑色', '白色', '红色', '粉色'], ['S', 'L', 'XXL', 'M']],
             types: [],
             valueInLabel: {},
             selected: [],
             unDisabled: [],
             canUseSku: [],
             pathFinder: {}
           }
       },
       mounted() {
           this.types = this.type.flat()
           // 将规格转为质数
           const prime = getPrime(this.types.length)
           
           // 质数对应属性枚举值
           this.types.forEach((item, index) => {
               this.valueInLabel[item] = prime[index]
           })
           // 组装的sku
           const sku = this.descartes(this.type).map(item => {
               return {
                   // 随机库存内容
                   stock: Math.floor(Math.random() * 10) > 5 ? 0 : 1,
                   // 规格名
                   skuName: item,
                   // 规格对应质数
                   skuPrime: item.map(ii => this.valueInLabel[ii])
               }
           })
           // 筛选除可用的sku（库存不为0）
           const canUseSku = sku.filter(item => item.stock)
       },
       methods: {
           descartes(data) {
             return data.reduce((total, prev) => {
               return total.flatMap(x => prev.map(y => [...x, y]))
             }, [[]])
           }
       }
   }
   </script>
   ```

3. 选择属性逻辑处理

   ![sku-combine](/my-blog/learn/sku/sku-prop.png)

   如上图中，我们需要考虑以下几点

   1. 选中时，需要更新下不可选中的属性，置灰
   2. 如果已经选中，此时就是取消选中，更新下属性是否可选中信息
   3. 同行存在已经选中的情况，需要去掉之前选中，把当前的节点设置为选中，同时更新属性是否可选中的信息

   根据上述说的，很明显我们需要为每个属性节点设置位置坐标，位置坐标和type是一一对应的，那么如何区分属性可选，不可选，已选。这里就需要用到邻接矩阵

   #### 邻接矩阵

   首先，看下什么是邻接矩阵，来自[百度百科](https://link.juejin.cn?target=https%3A%2F%2Fbaike.baidu.com%2Fitem%2F%E9%82%BB%E6%8E%A5%E7%9F%A9%E9%98%B5%2F9796080%3Ffr%3Daladdin)的解释

   - 用一个二维数组存放顶点间关系（边或弧）的数据，这个二维数组称为邻接矩阵。
   - 逻辑结构分为两部分：V 和 E 集合，其中，V 是顶点，E 是边。因此，用一个一维数组存放图中所有顶点数据。

   字面描述可能比较晦涩难懂，那么让我们来看看图片帮助理解，如果两个顶点互通（有连线），那么它们对应下标的值则为 1，否则为 0。

   ![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/6b1cb4d8707d49aeb0bfc9b7c0063961~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)

   #### 让我们继续前面的🌰 数据来看

   规格

   ```javascript
   const type = ["男裤", "女裤", "儿童裤"]
   const color = ["黑色", "白色", "红色", "粉色"]
   const size = ["S","L", "XXL", "M"]
   ```

   假设总 SKU 的库存值为下面示例，可选为有库存，不可选为某项规格无库存

   ```javascript
   [
     ["男裤", "黑色", "S"], // S 无号
     ["男裤", "黑色", "L"],
     ["男裤", "白色", "S"], // S 无号
     ["男裤", "白色", "L"],
     ["女裤", "黑色", "S"], // S 无号
     ["女裤", "黑色", "L"],
     ["女裤", "白色", "S"], // S 无号
     ["女裤", "白色", "L"],
   ]
   复制代码
   ```

   那么根据邻接矩阵思想，可以得到结果图：

   ![img](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/ad2e35a3373b4157b6e12737703ad697~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp)

   从图中可以看出，SKU 中每两规格都可选择，那么相对的标志值为 1，否则为 0，当整条规格选中都是 1，才会使整条 SKU 链路可选

4. 属性选择部分逻辑

   ```javascript
   <template>
   	<ul>
           <li v-for="(item,index) in type" :key="index" class="mb-16">
       		<el-button 
               	v-for="(spec, itemIndex) in item"
                   :key="itemIndex"
                   :type="selected.includes(spec) ? 'primary' : ''"
                   :disabled="!unDisabled.includes(valueInLabel[spec])"
                   @click="onClickSelType(spec, valueInLabel[spec], index)"
               >
               {{spec}}
       		</el-button>
       	</li>
       </ul>
   </template>
   
   <script>
   export default {
       data() {
           return {
             type: [['男裤', '女裤', '儿童'], ['黑色', '白色', '红色', '粉色'], ['S', 'L', 'XXL', 'M']],
             types: [],
             valueInLabel: {},
             selected: [], // 已选规格
             unDisabled: [],
             canUseSku: [],
             pathFinder: {}
           }
       },
       methods: {
   		...
           // sku
           onClickSelType(spec, prime, primeIndex) {
             const { selected, valueInLabel, type: stateType } = this
             const index = selected.indexOf(type)
             
             if(index > -1) {
                 // 移除选择的属性
             } else if(***) {
             	// 同行选择，需要将已选的剔除掉
               // 1.找到该属性内容
               // 2. 该属性对应的质数
               // 3. 删除该质数对应的坐标
               // 4. 将该属性对应的位置坐标设置为1（代表可选）
               // 将单前的添加进selected列表中
             } else {
                 // 这里就是单纯添加进已选属性列表
             }
               
             // 更新不可选中的属性
           }
       }
   }
   </script>
   ```

5. 借助PathFinder类完成4中的逻辑

   ```javascript
   const cloneTwo = (o) => {
     const ret = []
     for (let j = 0; j < o.length; j++) {
       const i = o[j]
       ret.push(i.slice ? i.slice() : i)
     }
     return ret
   }
   
   class PathFinder {
       constructor(maps, openWay) {
           this.maps = maps // 属性对应的质数二维数组
           this.openWay = openWay // 可选的sku 数组
           this._way = {} // 质数对应位置坐标的映射关系
           this.light = [] // 位置坐标
           this.selected = [] // 已选属性
           this.init()
       }
       // 初始化
       init() {
         this.light = cloneTwo(this.maps)
         const light = this.light
         
         for(let i = 0; i < light.length; i++) {
             const l = light[i]
             for(let j = 0; j < l.length; j++) {
                 this._way[i][j] = [i,j] // 位置坐标
                 l[j] = 1 // 初始默认都是可选的
             }
         }
           
         // 得到每个可操作的 SKU 质数的集合
         for (let i = 0; i < this.openWay.length; i++) {
           // TODO: 也可以换成reduce求乘积，作者为了减少循环，使用了eval
           // eslint-disable-next-line no-eval
           this.openWay[i] = eval(this.openWay[i].join('*')) // 2 * 5 * 11 积的形式
         }
           
         // 更新下light
         this._check()
       }
       
       // 用于检查是否可选
       _check(isAdd) {
           const light = this.light
           const maps = this.maps
           
           for (let i = 0; i < light.length; i++) {
             const li = light[i]
             const selected = this._getSelected(i)
             for (let j = 0; j < li.length; j++) {
               if (li[j] !== 2) {
                 // 如果是加一个条件，那么只能选择light等于1的值
                 if (isAdd) {
                   if (li[j]) {
                     light[i][j] = this._checkItem(maps[i][j], selected)
                   }
                 } else {
                   light[i][j] = this._checkItem(maps[i][j], selected)
                 }
               }
             }
             return this.light
           }
       }
       // 获取选中的属性对应位置坐标的x值
       _getSelected(xpath) {
           const selected = this.selected
           const _way = this.way
           const retArr = []
           let ret = 1
           
           if(selected.length) {
               for(let j = 0; j < selected.length; j++) {
                   const s = selected[j]
                   // xpath表示同一行，当已经被选择的和当前检测的项目再同一行的时候
                   // 需要忽略。
                   // 必须选择了 [1, 2],检测的项目是[1, 3]，不可能存在[1, 2]和[1, 3]
                   // 的组合，他们在同一行
                   if(_way[s][0] === xpath) {
                       ret *= s
                       retArr.push(s)
                   }
               }
           }
           return ret
       }
       
      /**
      * 检查是否可选内容
      * @param {Int} item 当前规格质数
      * @param {Array} selected
      * @returns
      */
      _checkItem(item, selected) {
        // 拿到可以选择的 SKU 内容集合
        const openWay = this.openWay
        const val = item * selected
        // 拿到已经选中规格集合*此规格集合值
        // 可选 SKU 集合反除，查询是否可选
        for (let i = 0; i < openWay.length; i++) {
          if (openWay[i] % val === 0) {
            return 1 // 可选
          }
        }
        return 0 // 不可选
     }
       
     /** 选择可选属性后处理
      * @param {array} point [x, y]
      */
     add(point) {
       point = point instanceof Array ? point : this._way[point]
       const val = this.maps[point[0]][point[1]]
   
       // 检查是否可选中
       if (!this.light[point[0]][point[1]]) {
         throw new Error(
           'this point [' + point + '] is no availabe, place choose an other'
         )
       }
   
       if (this.selected.includes(val)) return
   
       const isAdd = this._dealChange(point)
       this.selected.push(val)
       this.light[point[0]][point[1]] = 2 // 代表已选中 区分不可选和可选
       this._check(!isAdd)
     }
       
      /**
      * 判断是否同行选中
      * @param {Array} point 选中内容坐标
      * @returns
      */
     _dealChange(point) {
       const selected = this.selected
       // 遍历处理选中内容
       for (let i = 0; i < selected.length; i++) {
         // 获取刚刚选中内容的坐标，属于同一行内容
         const line = this._way[selected[i]]
         if (line[0] === point[0]) {
           this.light[line[0]][line[1]] = 1
           selected.splice(i, 1)
           return true
         }
       }
   
       return false
     }
       
      /**
      * 移除已选规格
      * @param {Array} point
      */
     remove(point) {
       point = point instanceof Array ? point : this._way[point]
       const val = this.maps[point[0]][point[1]]
       if (!val) {
         return
       }
   
       for (let i = 0; i < this.selected.length; i++) {
         if (this.selected[i] === val) {
             const line = this._way[this.selected[i]]
             this.light[line[0]][line[1]] = 1
             this.selected.splice(i, 1)
         }
       }
       this._check()
     }
   
     /**
      * 获取当前可用数据
      * @returns []
      */
     getWay() {
       const light = this.light
       const way = cloneTwo(light)
       for (let i = 0; i < light.length; i++) {
         const line = light[i]
         for (let j = 0; j < line.length; j++) {
           if (line[j]) way[i][j] = this.maps[i][j]
         }
       }
       return way // 规格对应的质数
     }
   }
   ```

6.  补全sku选择逻辑

   ```vue
   <template>
   	<ul>
           <li v-for="(item,index) in type" :key="index" class="mb-16">
       		<el-button 
               	v-for="(spec, itemIndex) in item"
                   :key="itemIndex"
                   :type="selected.includes(spec) ? 'primary' : ''"
                   :disabled="!unDisabled.includes(valueInLabel[spec])"
                   @click="onClickSelType(spec, valueInLabel[spec], index)"
               >
               {{spec}}
       		</el-button>
       	</li>
       </ul>
   </template>
   
   <script>
   export default {
       data() {
           return {
             type: [['男裤', '女裤', '儿童'], ['黑色', '白色', '红色', '粉色'], ['S', 'L', 'XXL', 'M']],
             types: [],
             valueInLabel: {},
             selected: [], // 已选规格
             unDisabled: [],
             canUseSku: [],
             pathFinder: {}
           }
       },
       methods: {
   		...
           // sku
           onClickSelType(spec, prime, primeIndex) {
             const { selected, valueInLabel, type: stateType } = this
             const index = selected.indexOf(type)
             
             if(index > -1) {
                 // 移除选择的属性
                 this.pathFinder.remove(prime)
                 selected.splice(index, 1)
             } else if(***) {
             	// 同行选择，需要将已选的剔除掉
               // 1.找到该属性内容
               // 2. 该属性对应的质数
               // 3. 删除该质数对应的坐标
               // 4. 将该属性对应的位置坐标设置为1（代表可选）
               const removeType = stateType[primeIndex][light[primeIndex].indexOf(2)]
       		const removePrime = this.valueInLabel[removeType]
               this.pathFinder.remove(removePrime)
      			selected.splice(index, 1)
               // 将单前的添加进selected列表中
       		this.pathFinder.add(prime)
       		selected.push(spec)
             } else {
                 // 这里就是单纯添加进已选属性列表
                 this.pathFinder.add(prime)
                 selected.push(type)
             }
               
             // 更新不可选中的属性
       	  this.unDisabled = this.pathFinder.getWay().flat()
           }
       }
   }
   </script>
   ```

7. 效果图

   ![sku-combine](/my-blog/learn/sku/sku-selector.gif)
