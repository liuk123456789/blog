---
title: 移动端瀑布流
date: 2023-04-07
categories: 
 - 日常整理
tags:
 - water fall
sidebar: auto
---

## 1. 什么是瀑布流

瀑布流又称瀑布流式布局，是一种多列等宽不等高的一种页面布局方式。视觉表现为参差不齐的多栏布局。随着页面滚动条向下滚动，这种布局会不断加载数据并附加至当前的尾部。是一种多列等宽不等高的一种页面布局方式，用于图片比较复杂，图片尺寸比较复杂时可以使用的一种展示方式，这种展示方式可以使页面比较美观，让人有种错落有致的感觉。

## 2. 思路

1. 通过`flex`布局，配置参数`col`用于设置列数，每列也使用`flex`布局，所以我们的最终的数据`colData`结构会是下面这样

   ```javascript
   [[item1,item2, ...],[item4, item5, ...]]
   ```

2. 设置下首次渲染的个数`firstPageCount`,如果当前已经渲染的个数小于`firstPageCount`，那么就按照一列列渲染（0,1,2,0...)，完成首屏加载

3. 通过`IntersectionObserver`，监听此时最小列高度的最后元素的`image`的加载，如果加载完成后，我们去查找当前的最小列高度，将数据源中的第一个元素导入列数组`colData`中，同时重复2步骤，直至数据源空无数据

## 3. 代码

1. 页面结构布局

   ```vue
   <template>
       <div class="waterfall-wrapper" :style="{ 'column-gap': gap[1] }">
           <div
             class="col-wrapper"
             ref="cols"
             v-for="(col, i) in colData"
             :key="i"
             :style="{ 'row-gap': gap[0] }"
           >
             <div class="row-wrapper" v-for="(row, j) in col" :key="j">
               <slot :item="row" />
             </div>
           </div>
       </div>
   </template>
   
   <script>
   export default {
       props: {
           // 瀑布流数据
           model: {
              type: Array,
              default: () => []
           },
           // 列数, 默认两列
           col: {
               type: Number,
               default: 2
           },
           // 首屏渲染的个数
           firstPageCount: {
               type: Number,
               default: 6
           }
           // 行列间距
           gap: {
           	type: Array,
               default: [0, 0]
           }
       },
       data() {
           return {
               // 列数据
               colData: []
           }
       }
   }
   </script>
   <style lang="less" scoped>
     .waterfall-wrapper {
       display: flex;
       align-items: flex-start;
     }
   
     .col-wrapper {
       display: flex;
       flex: 1 1 0%;
       flex-direction: column;
     }
   </style>
   ```

2. 监听`col`&`数据源`变化，生成初始化的列数据

   ```vue
   <template>
       <div class="waterfall-wrapper" :style="{ 'column-gap': gap[1] }">
           <div
             class="col-wrapper"
             ref="cols"
             v-for="(col, i) in colData"
             :key="i"
             :style="{ 'row-gap': gap[0] }"
           >
             <div class="row-wrapper" v-for="(row, j) in col" :key="j">
               <slot :item="row" />
             </div>
           </div>
       </div>
   </template>
   
   <script>
   let minCol = 0
   let count = 0
   
   export default {
       props: {
           // 瀑布流数据
           model: {
              type: Array,
              default: () => []
           },
           // 列数, 默认两列
           col: {
               type: Number,
               default: 2
           },
           // 行列间距
           gap: {
           	type: Array,
               default: [0, 0]
           }
       },
       data() {
           return {
               // 列数据
               colData: [],
               // 待放入列的队列数据
               innerData: []
           }
       },
       
       watch: {
           col(v) {
               this.createColData(v)
           },
           model: {
               handler(value) {
                  if(!value) return
                  this.innerData = [...this.innerData, ...v]
                  // 渲染首屏数据
                  this.createWaterFall()
               },
               immediate: true,
               deep: true
           }
       },
       
       methods: {
           getMinHeightCol() {
           	// 首屏渲染，按列依次渲染
         		if (count < this.firstPageCount) {
           		minCol = count % (this.col)
           		return
         		}
         		const heightList = this.$refs['cols'].map((item) => item.offsetHeight)
         		const minHeight = Math.min(...heightList)
        	 	minCol = heightList.indexOf(minHeight)
           },
           
           createColData(col) {
            	while(i < col) {
                   this.colData.push([])
                   i++
               }
           },
           
           // 添加到瀑布流最小高度列中
           appendColData() {
               const colItem = this.innerData.shift()
               this.colData[minCol].push(colItem)
           }
           
           createWaterFall() {
               // 获取瀑布流中的最小列
               this.getMinHeightCol()
               // 取出数据源的第一个数据，添加瀑布流中最小高度列中
               this.appendColData()
               // 判定下此时的count 和 首屏渲染的个数firstPageCount
               if(++count < this.firstPageCount) {
                   this.$nextTick(() => this.createWaterFall())
               } else {
                   // 监听图片加载
               }
           }
       }
   }
   </script>
   ```

3. 监听`image`

   ```vue
   <template>
       <div class="waterfall-wrapper" :style="{ 'column-gap': gap[1] }">
           <div
             class="col-wrapper"
             ref="cols"
             v-for="(col, i) in colData"
             :key="i"
             :style="{ 'row-gap': gap[0] }"
           >
             <div class="row-wrapper" v-for="(row, j) in col" :key="j">
               <slot :item="row" />
             </div>
           </div>
       </div>
   </template>
   
   <script>
   let minCol = 0
   let count = 0
   
   export default {
       props: {
           // 瀑布流数据
           model: {
              type: Array,
              default: () => []
           },
           // 列数, 默认两列
           col: {
               type: Number,
               default: 2
           },
           // 行列间距
           gap: {
           	type: Array,
               default: [0, 0]
           },
       	// 扩展intersectionRect交叉区域，可以提前加载部分数据，优化用户浏览体验
       	rootMargin: {
         		type: String,
         		default: '0px 0px 400px 0px'
       	}
       },
       data() {
           return {
               // 列数据
               colData: [],
               // 待放入列的队列数据
               innerData: []
           }
       },
       
       watch: {
           col(v) {
               this.createColData(v)
           },
           model: {
               handler(value) {
                  if(!value) return
                  this.innerData = [...this.innerData, ...v]
                  // 渲染首屏数据
                  this.createWaterFall()
               },
               immediate: true,
               deep: true
           }
       },
       
       created() {
       	// 不支持IntersectionObserver的场景下，动态引入polyfill
       	const ioPromise = checkIntersectionObserver()
         		? Promise.resolve()
         		: import('intersection-observer')
   
       	ioPromise.then(() => {
         		// 瀑布流布局：取出数据源中最靠前的一个并添加到瀑布流高度最小的那一列，等图片完全加载后重复该循环
         		observerObj = new IntersectionObserver(
           		(entries) => {
             			for (const entry of entries) {
                           // isIntersecting 可以简单的理解为视图区域和元素相交
                           const { target, isIntersecting } = entry
                           if (isIntersecting) {
                             const done = () => {
                               if (innerData.length) {
                                 this.createWaterFall()
                               } else {
                                 // 告诉父组件，瀑布流数据加载完成，可以添加新的数据
                                 this.$emit('rendered')
                               }
                               // 停止观察，防止回拉时二次触发监听逻辑
                               // 因为 在进入和离开时，IntersectionObserver的回调会触发
                               observerObj.unobserve(target)
                             }
   						  // 加载完成
                             if (target.complete) {
                               done()
                             } else {
                               target.onload = target.onerror = done
                             }
                           }
                         }
                       },
                       {
                         rootMargin: this.rootMargin // 扩大交叉区域，提前加载后面的数据
                       }
         			)
       		})
       }
       
       methods: {
       	// 开启监听
   		startObserver() {
         		// 开始监测新增加的瀑布流元素
               // TODO: 这里暂时写死了，后续可以通过传参后者查找image方式优化
         		const nodes = this.$refs['cols'][minCol].querySelectorAll('.waterfall-img')
         		const lastNode = nodes[nodes.length - 1]
         		observerObj.observe(lastNode)
       	},
       }
   }
   </script>
   ```

4. `Intersection Observer`的`polyfill`

   ```javascript
   const inBrowser = typeof window !== 'undefined' && window !== null
   
   function checkIntersectionObserver() {
     if (
       inBrowser &&
       'IntersectionObserver' in window &&
       'IntersectionObserverEntry' in window &&
       'intersectionRatio' in window.IntersectionObserverEntry.prototype
     ) {
       // Minimal polyfill for Edge 15's lack of `isIntersecting`
       // See: https://github.com/w3c/IntersectionObserver/issues/211
       if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
         Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
           get: function() {
             return this.intersectionRatio > 0
           }
         })
       }
       return true
     }
     return false
   }
   
   export { checkIntersectionObserver }
   
   ```

## 4. 效果图

![image-20230410122650856](/my-blog/learn/water-fall/image-20230410122650856.png)
