---
title: 虚拟滚动列表
date: 2023-02-28
categories: 
 - 源码解读
tags:
 - vitual scroll
sidebar: auto
---

## 适用场景
在数据爆炸的今天，我们或多或少在项目中遇到过，数据上千上万时出现滚动，dom结构复杂点，就会出现滚动卡顿，影响用户体验

## 虚拟滚动的实现原理

  ![vitual-scroll](/my-blog/learn/vitual-scroll/virtual-principle.png)

## virtual-scroll-list的源码解析

### 1. 流程图

  ![vitual-scroll](/my-blog/learn/vitual-scroll/virtual-process.png)

### 2. template模板结构

```javascript
render(h) {
    // 获取header 和 footer 的自定义插槽
    const { header, footer } = this.$slots
    // padFront 滚动过的高度 padBehind 剩余滚动的高度
    const { padFront, padBehind } = this.range
    
    const { isHorizontal, pageMode, rootTag, wrapTag, wrapClass, wrapStyle, headerTag, headerClass, headerStyle, footerTag, footerClass, footerStyle } = this
    const paddingStyle = { padding: isHorizontal ? `0px ${padBehind}px 0px ${padFront}px` : `${padFront}px 0px ${padBehind}px` }
    const wrapperStyle = wrapStyle ? Object.assign({}, wrapStyle, paddingStyle) : paddingStyle
    // h 渲染函数
    return h(rootTag, {
        ref: 'root',
        on: {
            '&scroll': !pageMode && this.onScroll
        }
    }, [
        //header slot
        header ? h(Slot, {
            class: headerClass,
            style: headerStyle,
            props: {
                tag: headerTag,
                event: EVENT_TYPE.SLOT,
                uniqueKey: SLOT_TYPE.HEADER
            }
        }, header) : null,
        
        // 内容区域列表 main list
        h(wrapTag, {
            class: wrapClass,
            attrs: {
                role: 'group'
            },
            style: wrapperStyle,
        }, this.getRenderSlots(h)),
        
        // footer slot
        footer ? h(Slot, {
            class: footerClass,
            style: footerStyle,
            props: {
                tag: footerTag,
                event: EVENT_TYPE.SLOT,
                uniqueKey: SLOT_TYPE.FOOTER
            }
        }, footer) : null,
        
        // 空元素用于滚动到底部
         h('div', {
            ref: 'shepherd',
            style: {
              width: isHorizontal ? '0px' : '100%',
              height: isHorizontal ? '100%' : '0px'
            }
         })
    ])
    
}
```

字段说明

- isHorizontal
  - 含义：是否是水平方向滚动
  - 默认值： false
- pageMode
  - 含义：是否是页面模式，开启后整屏滚动
  - 默认值：false
- rootTag
  - 含义：虚拟滚动列表的根标签
  - 默认值：div
- wrapTag
  - 含义：包裹列表的容器
  - 默认值：div
- wrapClass
  - 含义：包裹列表容器的css class
  - 默认值：''
- wrapStyle
  - 含义：包裹列表容器的内联样式
  - 默认值：paddingStyle
- headerTag
  - 含义：头部插槽对应的标签名
  - 默认值： div
- headerClass
  - 含义：头部插槽对应的css 类
  - 默认值：''
- headerStyle
  - 含义：头部插槽对应的内联样式 style
  - 默认值：{}
- footerTag
  - 含义：底部插槽对应的标签名
  - 默认值：div
- footerClass
  - 含义：底部插槽对应的css 类名
  - 默认值：''
- footerStyle
  - 含义：底部插槽对应的内联样式style
  - 默认值：{}

1. 组件初始化

   ```javascript
   created() {
       // direction 默认值：'vertical' 代表垂直方向
       this.isHorizontal = this.direction === 'horizontal'
       this.directionKey = this.isHorizontal ? 'scrollLeft' : 'scrollTop'
       
       this.installVirtual()
       
       // 监听 列表事件
       this.$on(EVENT_TYPE.ITEM, this.onItemResized)
   
       // 监听 头部插槽事件
       if (this.$slots.header || this.$slots.footer) {
         this.$on(EVENT_TYPE.SLOT, this.onSlotResized)
       }
   }
   
   methods: {
       installVirtual() {
            this.virtual = new Virtual({
           	slotHeaderSize: 0,
               slotFooterSize: 0,
               keeps: this.keeps,
               estimateSize: this.estimateSize,
               buffer: Math.round(this.keeps / 3), // recommend for a third of keeps
               uniqueIds: this.getUniqueIdFromDataSources()
       	}, this.onRangeChanged)
           // 获取范围
       	this.range = this.virtual.getRange()   
       },
       
       // 获取不重复的uniqueId
       getUniqueIdFromDataSources() {
           const { dataKey } = this
           return this.dataSources.map((dataSource) => typeof dataKey === 'function' ? dataKey(dataSource) : dataSource[dataKey])
       }
   }
   ```

   **Virtual类中做了什么？？**

   ```javascript
   const DIRECTION_TYPE = {
     FRONT: 'FRONT', // scroll up or left 向上滚动 / 向左滚动
     BEHIND: 'BEHIND' // scroll down or right 向下滚动 / 向右滚动
   }
   
   // 计算尺寸的枚举
   const CALC_TYPE = {
     INIT: 'INIT', // 初始化
     FIXED: 'FIXED', // 固定高度
     DYNAMIC: 'DYNAMIC' // 动态高度
   }
   
   const LEADING_BUFFER = 0
   class Virtual {
       constructor(param, callUpdate) {
           this.init(param, callUpdate)
       }
       
       init(param, callUpdate) {
          this.param = data
          this.callUpdate = callUpdate
           
          // 列表中高度的集合
          this.sizes = new Map()
          this.firstRangeTotalSize = 0
          this.firstRangeAverageSize = 0
          this.lastCalcIndex = 0
          this.fixedSizeIndex = 0
          // 默认值是 init
          this.calcType = CALC_TYPE.INIT
           
          // scroll data
          this.offset = 0
          this.direction = ''
           
          // range data
          this.range = Object.create(null)
          if(param) {
              this.checkRange(0, param.keeps - 1)
          }
       }
       
       checkRange(start, end) {
           // 可是区域渲染列表的个数 默认值：30
           const keeps = this.param.keeps
           // dataKey的数组
           const total = this.param.uniqueIds.length
    
           // total <= keeps
           if(total <= keeps) {
               start = 0
               end = this.getLastIndex()
           } else if(end - start < keeps - 1) {
               // 最后30条的处理场景
               start = end - keeps + 1
           }
           if(this.range.start !== start) {
               // 更新开始和结束索引
               this.updateRange(start, end)
           }
       }
       // 更新相关数据
       updateRange(start, end) {
          this.range.start = start
          this.range.end = end
          this.range.padFront = this.getPadFront()
          this.range.padBehind = this.getPadBehind()
          this.callUpdate(this.getRange())
       }
       
      // return total front offset
      getPadFront () {
        // 固定高度时 返回 列表高度 * 起始索引
        if (this.isFixedType()) {
          return this.fixedSizeValue * this.range.start
        } else {
          // 动态高度的处理
          return this.getIndexOffset(this.range.start)
        }
      }
   
      // return total behind offset
      getPadBehind () {
        const end = this.range.end
        const lastIndex = this.getLastIndex()
        
        if (this.isFixedType()) {
          // 固定高度 返回 (列表的个数 - 1 - 终止索引) * 列表条目的高度
          return (lastIndex - end) * this.fixedSizeValue
        }
          
        // 动态高度的处理
        // if it's all calculated, return the exactly offset
        if (this.lastCalcIndex === lastIndex) {
          return this.getIndexOffset(lastIndex) - this.getIndexOffset(end)
        } else {
          // if not, use a estimated value
          return (lastIndex - end) * this.getEstimateSize()
        }
      }
       
       getIndexOffset(givenIndex) {
           if(!givenIndex) return 0
           
           let offset = 0
           let indexSize = 0
           
           for(let index = 0; index < givenIndex; index++) {
               // 列表高度
               indexSize = this.sizes.get(this.param.uniqueIds[index])
               const calcIndexSize = typeof indexSize === 'number' ? indexSize : this.getEstimateSize()
               offset += calcIndexSize 
           }
           
           this.lastCalcIndex = Math.max(this.lastCalcIndex, g)
       }
       
       // return current render range
       getRange () {
           const range = Object.create(null)
           range.start = this.range.start
           range.end = this.range.end
           range.padFront = this.range.padFront
           range.padBehind = this.range.padBehind
           return range
       }
       
        // get the item estimate size
     	getEstimateSize () {
       	return this.isFixedType() ? this.fixedSizeValue : (this.firstRangeAverageSize || this.param.estimateSize)
     	}
   }
   ```

   **初始化主要做了这些**

   1. 更新和滚动条关联的几个属性，start、end、padFront、padBehind
      - start: 滚动的起始索引，初始值为0
      - end：滚动的终止所以，初始值是param.keeps - 1
      - padFront：滚动容器的paddingTop， 初始值是 0
      - padBehind: 滚动容器的paddingBottom，初始值是 (lastIndex - end) * this.fixedSizeValue

### 3. 监听滚动事件

父组件

```javascript
onScroll(evt) {
    // 滚动距离
    const offset = this.getOffset()
    // 根元素可视区域的高度
    const clientSize = this.getClientSize()
    // 根元素可滚动距离
    const scrollSize = this.getScrollSize()
    
    // iOS滚动弹回行为会导致方向错误
    if (offset < 0 || (offset + clientSize > scrollSize + 1) || !scrollSize) {
    	return
    }
    
    this.virtual.handleScroll(offset)
    this.emitEvent(offset, clientSize, scrollSize, evt)
}

emitEvent(offset, clientSize, scrollSize, evt) {
      // 暴露给父组件事件
      this.$emit('scroll', evt, this.virtual.getRange())
      if (this.virtual.isFront() && !!this.dataSources.length && (offset - this.topThreshold <= 0)) {
        this.$emit('totop')
      } else if (this.virtual.isBehind() && (offset + clientSize + this.bottomThreshold >= scrollSize)) {
        this.$emit('tobottom')
      }
}
```

**virtual.js**的handleScroll

```javascript
handleScroll(offset) {
    // 用于判定是滚动方向
    this.direction = offset < this.offset ? DIRECTION_TYPE.FRONT : DIRECTION_TYPE.BEHIND
    // 更新了offset的赋值
    this.offset = offset

    if (!this.param) {
      return
    }

    if (this.direction === DIRECTION_TYPE.FRONT) {
      this.handleFront()
    } else if (this.direction === DIRECTION_TYPE.BEHIND) {
      this.handleBehind()
    }
}

handleFront() {
    const overs = this.getScrollOvers()
    
    // 判定是否在缓冲区域滚动
    if(overs > this.range.start) {
        return
    }
    
    const start = Math.max(overs - this.param.buffer, 0)
    this.checkRange(start, this.getEndByStart(start))
}

handleBehind() {
    const overs = this.getScrollOvers()
    
    // 判定是否在缓冲区域滚动
    if(overs < this.range.start + this.param.buffer) {
        return
    }
    
    this.checkRange(overs, this.getEndByStart(overs))
}

getScrollOvers() {
    const offset = this.offset - this.param.slotHeaderSize
    
    if(offset <= 0) {
        return 0
    }
    
    // if is fixed type, that can be easily
    if (this.isFixedType()) {
      return Math.floor(offset / this.fixedSizeValue)
    }
    
    // 动态高度使用二分法，快速查找
    let low = 0
    let middle = 0
    let middleOffset = 0
    let high = this.param.uniqueIds.length

    while (low <= high) {
      // this.__bsearchCalls++
      middle = low + Math.floor((high - low) / 2)
      middleOffset = this.getIndexOffset(middle)

      if (middleOffset === offset) {
        return middle
      } else if (middleOffset < offset) {
        low = middle + 1
      } else if (middleOffset > offset) {
        high = middle - 1
      }
    }

    return low > 0 ? --low : 0
}

getEndByStart(start) {
    const theoryEnd = start + this.param.keeps - 1
    const truelyEnd = Math.min(theoryEnd, this.getLastIndex())
    return truelyEnd
}
```

**getScrollOvers**处理固定高度和动态高度两种情况

- 固定高度 直接返回Math.floor(滚动高度 / 固定高度)，向下滚动时，如果返回overs 大于等于 起始索引 + buffer，那么更新起止索引，向上滚动时，返回overs 小于等于 起始索引，那么更新起止索引，需要注意的是

  > cosnt start = Math.max(overs - this.param.buffer, 0) // overs需要扣减buffer
  >
  > this.checkRange(start, this.getEndByStart(start))

- 非固定高度， 通过二分算法，快速比对滚动距离`offset` 和 `middle`的对应的滚动距离做对比，如果`offset < middle`， 那么 修改 `high = middle - 1`， 如果`offset > middle`，那么修改`low = middle + 1`，否则就是`middle`

**父组件**在created生命周期中使用`$on`方法名分别是`EVENT_TYPE.ITEM`和`EVENT_SLOT`，如下代码

```javascript
this.$on(EVENT_TYPE.ITEM, this.onItemResized)
// listen slot size change
if (this.$slots.header || this.$slots.footer) {
  this.$on(EVENT_TYPE.SLOT, this.onSlotResized)
}
```

但是父组件中无`this.$emit(EVENT_TYPE.ITEM)和this.$emit(EVENT_TYPE.SLOT)`对应，在`item.js`中存在这样的代码

```javascript
// tell parent current size identify by unqiue key
dispatchSizeChange() {
  // 父组件中通过$on接受 
  this.$parent.$emit(this.event, this.uniqueKey, this.getCurrentSize(), this.hasInitial)
}
```

> hasInitial 用于自定插槽中，Item组件并未使用到这个变量

同时在子组件（也可以说插槽组件）中使用ResizeObserver监听元素变化（尺寸，显示隐藏等）

```javascript
mounted() {
    if (typeof ResizeObserver !== 'undefined') {
    	this.resizeObserver = new ResizeObserver(() => {
        	this.dispatchSizeChange()
      	})
      	this.resizeObserver.observe(this.$el)
    }
},

// since componet will be reused, so disptach when updated
// 组件更新时，需要重新调用父组件的$on
updated() {
	this.dispatchSizeChange()
},

beforeDestroy() {
    if (this.resizeObserver) {
    	this.resizeObserver.disconnect()
    	this.resizeObserver = null
    }
},

methods: {
    getCurrentSize() {
      return this.$el ? this.$el[this.shapeKey] : 0
    },

    // tell parent current size identify by unqiue key
    dispatchSizeChange() {
      // 父组件中通过$on接受
      this.$parent.$emit(this.event, this.uniqueKey, this.getCurrentSize(), this.hasInitial)
    }
}
```

`父组件`的`$on`的onItemResized和onSlotResized的功能

```javascript
onItemResized(id, size) {
    // 存储元素高度
    this.virtual.saveSize(id, size)
    // 暴露给外部父组件
    this.$emit('resized', id, size)
}

onSlotResized(type, size, hasInit) {
    if(type === SLOT_TYPE.HEADER) {
        // 更新头部插槽尺寸
        this.virtual.updateParam('slotHeaderSize', size)
    } else if(type === SLOT_TYPE.FOOTER) {
        // 更新底部插槽尺寸
        this.virtual.updateParam('slotFooterSize', size)
    }
    
    if (hasInit) {
       this.virtual.handleSlotSizeChange()
    }
}
```

