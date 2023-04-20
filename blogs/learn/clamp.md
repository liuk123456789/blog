---
title: 文字截断
date: 2023-04-04
categories: 
 - 日常整理
tags:
 - clamp
sidebar: auto
---

## 1. 需求

对于一段文字截断，可以控制最多展示行数，超出隐藏，点击展开，展示所有文案，同时按钮文案变为收起，如下

**收起时效果图**

![image-20230405144632616](/my-blog/learn/clamp/image-20230405144632616.png)

**展开效果图**

![image-20230405144958923](/my-blog/learn/clamp/image-20230405144958923.png)

## 2. 实现

初始打算通过`CSS`解决这个问题，将文案和按钮设置为`inline-block`，但是会存在问题，就是文案中存在中文、英文、标点符号时，无法通过`CSS`控制宽度，后续就想到通过组件方式通过`JS`完成这个，所以到`github`上看下有没有类似组件`copy`下😂，最后选择了[vue-clamp](https://github.com/Justineo/vue-clamp)，所以我看了下源码，把作者思路总结了下

## 3. 流程图

![clamp-flow](/my-blog/learn/clamp/clamp-flow.png)

## 4. 详细代码解析

方法说明

```javascript
export default {
    name: 'vue-clamp',
    props: {
        // 容器标签
        tag: {
          type: String,
          default: 'div'
        },
        autoresize: {
            type: Boolean,
            default: false
        },
        maxLines: Number,
        maxHeight: [String, Number], // 最大高度
        ellipsis: {
            type: String,
            default: '...'
        },
        location: {
            type: String,
            default: 'end',
            validator(value) {
                return ['start', 'middle', 'end'].indexOf(value) !== -1
            }
        },
        expanded: Boolean // 是否是展开状态
    },
    data () {
        return {
          offset: null,
          text: this.getText(),
          localExpanded: !!this.expanded
        }
    },
    computed: {
        // 截断后的文案内容
    	clampedText () {
          if (this.location === 'start') {
            return this.ellipsis + (this.text.slice(-this.offset) || '').trim()
          } else if (this.location === 'middle') {
            const split = Math.floor(this.offset / 2)
            return (this.text.slice(0, split) || '').trim() + this.ellipsis + (this.text.slice(-split) || '').trim()
          }
          return (this.text.slice(0, this.offset) || '').trim() + this.ellipsis
        },
        isClamped () {
          if (!this.text) {
            return false
          }
          // offset 用于截断文案的长度
          // text 代表了原始文案的长度
          return this.offset !== this.text.length
        },
        // 展示给用户的文案内容
        realText () {
          return this.isClamped ? this.clampedText : this.text
        }      
    },
    
    mounted() {
        this.init()

        this.$watch(
          (vm) => [vm.maxLines, vm.maxHeight, vm.ellipsis, vm.isClamped, vm.location].join(),
          this.update
        )
        this.$watch((vm) => [vm.tag, vm.text, vm.autoresize].join(), this.init) 
    },
    // 组件更新
    updated () {
    	this.text = this.getText()
    	this.applyChange()
  	},
    
  	beforeDestroy () {
    	this.cleanUp()
  	},

   	methods: {
        // 1. 获取文案内容
        getText() {
           // 查找第一个非空的文本节点
           // Look for the first non-empty text node
           const [content] = (this.$slots.default || []).filter((node) => !node.tag && !node.isComment)
           return content ? content.text.trim() : ''
        },
        
        // 2. 更新offset
        update() {
            // 展开状态，无需操作
            if(this.localExpanded) {
                return
            }
            this.applyChange()
            if(this.isOverflow() || this.isClamped) {
                this.search()
            }
        },
        
        // 容器文案展示
        applyChange() {
            this.$refs.text.textContent = this.realText
        },
        
        // 通过getClientRects 获取inline元素所占行数
        getLines () {
            return Object.keys(
                Array.prototype.slice.call(this.$refs.content.getClientRects()).reduce(
                  (prev, { top, bottom }) => {
                    const key = `${top}/${bottom}`
                    if (!prev[key]) {
                      prev[key] = true
                    }
                    return prev
                  },
                  {}
                )
            ).length
         },
        
        // 文案是否超出
     	isOverflow () {
            if (!this.maxLines && !this.maxHeight) {
                return false
            }

            if (this.maxLines) {
                if (this.getLines() > this.maxLines) {
                    return true
                }
            }

            if (this.maxHeight) {
                if (this.$el.scrollHeight > this.$el.offsetHeight) {
                  return true
                }
            }
  			return false
    	},
        
        // 二分搜索 + 递归
    	search (...range) {
          const [from = 0, to = this.offset] = range
          // TODO: 这里的3 代表的是ellipsis的length, 作者这里写死了，实际中我们最好使用this.ellipsis.length 代替
          if (to - from <= 3) {
            this.stepToFit() // 精细文案内容
            return
          }
          // 二分搜索
          const target = Math.floor((to + from) / 2)
          // 改变offset， offset变化 会改变clampedText && isClamped的值
          // clampedText的变化 触发 realText变化
          // realText变化会影响 getLines() 的结果
          // getLines()的结果 会影响isOverflow()的判定结果
          // 然后用参数进行递归search
          this.clampAt(target)
          if (this.isOverflow()) {
            this.search(from, target)
          } else {
            this.search(target, to)
          }
        },
        // 更新offset && 视图
        clampAt (offset) {
          this.offset = offset
          this.applyChange()
        },
        
        stepToFit () {
          this.fill()
          this.clamp()
        },
        
        // 需要填充字符
        fill () {
          while (
            (!this.isOverflow() || this.getLines() < 2) &&
            this.offset < this.text.length
          ) {
            this.moveEdge(1)
          }
    	},
        
        // 需要截断字符
        clamp () {
          while (this.isOverflow() && this.getLines() > 1 && this.offset > 0) {
            this.moveEdge(-1)
          }
        },
        
        moveEdge (steps) {
        	this.clampAt(this.offset + steps)
        },
        
    	clampAt (offset) {
      		this.offset = offset
      		this.applyChange()
    	},
        // 移除事件监听器
        cleanUp () {
            if (this.unregisterResizeCallback) {
                this.unregisterResizeCallback()
            }
        }
    }
}
```

**render**函数

```javascript
render (h) {
    const contents = [
      h(
        'span',
        this.$isServer
          ? {}
          : {
            ref: 'text',
            attrs: {
              'aria-label': this.text.trim()
            }
          },
        this.$isServer ? this.text : this.realText
      )
    ]

    const { expand, collapse, toggle } = this
    const scope = {
      expand,
      collapse,
      toggle,
      clamped: this.isClamped,
      expanded: this.localExpanded
    }
    const before = this.$scopedSlots.before
      ? this.$scopedSlots.before(scope)
      : this.$slots.before
    if (before) {
      contents.unshift(...(Array.isArray(before) ? before : [before]))
    }
    const after = this.$scopedSlots.after
      ? this.$scopedSlots.after(scope)
      : this.$slots.after
    if (after) {
      contents.push(...(Array.isArray(after) ? after : [after]))
    }
    const lines = [
      h(
        'span',
        {
          style: {
            boxShadow: 'transparent 0 0'
          },
          ref: 'content'
        },
        contents
      )
    ]
    return h(
      this.tag,
      {
        style: {
          maxHeight: this.realMaxHeight,
          overflow: 'hidden'
        }
      },
      lines
    )
  }
```

**监听器相关**

```javascript
// DOM 事件监听器
import { addListener, removeListener } from 'resize-detector'

// vue 监听器
watch: {
    expanded (val) {
      this.localExpanded = val
    },
    localExpanded (val) {
      if (val) {
        this.clampAt(this.text.length)
      } else {
        this.update()
      }
      if (this.expanded !== val) {
        this.$emit('update:expanded', val)
      }
    },
    isClamped: {
      handler (val) {
        this.$nextTick(() => this.$emit('clampchange', val))
      },
      immediate: true
    }
},
    
mounted() {
	/****/
   if (this.autoresize) {
        addListener(this.$el, this.update)
        this.unregisterResizeCallback = () => {
          removeListener(this.$el, this.update)
        }
    }
}
```

## 5. props说明

1. maxLines： 必传，因为作者没有设置默认值
   
2. maxHeight: 容器的最大高度

3. ellipsis: 可自定义截断文本内容

4. autoresize: 用于适配屏幕尺寸变化

5. location: 截断文字， 'start' | 'middle' | 'end'

6. expanded： 用于手动控制展开隐藏，如下

   ```vue
   <template>
   <div id="app">
     <vue-clamp :max-lines="2" ellipsis="...." location="middle" :expanded="isExpaned">
       In quis eiusmod non pariatur do Lorem excepteur ullamco.Id ea nulla nulla Lorem pariatur ad exercitation ipsum enim ea dolore.Ea in aliqua id officia eu occaecat aute dolor anim qui non aute.Do aliquip nostrud aliquip amet Lorem eu.Eu consequat cupidatat aliquip voluptate deserunt elit et cillum consectetur.Tempor elit qui dolore in reprehenderit commodo ipsum culpa incididunt eu fugiat enim.Enim pariatur nulla sint fugiat consectetur ex.
       <template #after="{ toggle, expanded, clamped }">
         <a
           v-if="expanded || clamped"
           class="ml-8 mb-4"
           @click="toggle"
         >
           {{ expanded ? TOGGLE_LABEL_ENUM.COLLAPSE : TOGGLE_LABEL_ENUM.EXPANDED }}
         </a>
       </template>
     </vue-clamp>
   </div>
   </template>
   
   <script>
   import VueClamp from './components/Clamp'
   
   const TOGGLE_LABEL_ENUM = {
     EXPANDED: '展开',
     COLLAPSE: '收起'
   }
   
   export default {
     components: { VueClamp },
     data () {
       return {
         TOGGLE_LABEL_ENUM,
         isExpaned: false
       }
     }
   }
   </script>
   ```

7. tag 容器标签， 默认`div`
