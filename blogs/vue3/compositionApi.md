---
title: composition api
date: 2022-12-28
categories: 
 - Vue
tags:
 - compositionApi
sidebar: auto
---

### 1. setup的作用

- 配合组合式api，建立组合逻辑，创建响应式数据、创建通用函数，注册生命周期钩子的能力

- setup函数只会在被挂载时运行

- setup 返回值

  1. 函数，作为组件的render 函数（jsx/tsx）

     ```vue
     <script lang="tsx">
     import { defineComponent, toRefs, h } from 'vue'
     
     export default defineComponent({
        props: {},
        setup() {
            return () => {
                return (<span>测试tsx</span>)
            }
        }
     })
     </script>
     ```

  2. 对象，模板的数据源

     ```vue
     <template>
     	<div>
             <span>数值：{{number}}</span>
         </div>
     </template>
     <script lang="ts">
     import { defineComponent, toRefs, h } from 'vue'
     
     export default defineComponent({
        props: {},
        setup() {
            const state = reactive({
                number: 1
            })
            return {
                ...toRefs(state)
            }
        }
     })
     </script>
     ```

### 2. 生命周期的变化

1. 更名两个钩子

   ```tex
   beforeDestroy 更名为 beforeUnmount
   destroyed 更名为 onunMounted
   ```

2. Vue3.0也提供了Composition API形式的生命周期钩子，与Vue2.x中钩子对应关系如下:

   ```tex
   beforeCreate ===>setup()
   
   created =======>setup()
   
   beforeMount ===> onBeforeMount // 组件挂载完成之前，当这个钩子被调用时，组件已经完成了其响应式状态的设置，但还没有创建 DOM 节点。它即将首次执行 DOM 渲染过程。
   
   mounted=======> onMounted // 请求数据、ref操作dom 在此阶段操作,挂载完成
   
   beforeUpdate ===> onBeforeUpdate // 这个钩子可以用来在 Vue 更新 DOM 之前访问 DOM 状态。在这个钩子中更改状态也是安全的。
   
   updated =======> onUpdated // 组件因为响应式状态变更而更新其 DOM 树之后调用。
   
   beforeDestroy ==>onBeforeUnmount // 在组件实例被卸载之前调用。组件实例依然保持全部功能
   
   destroyed =====> onUnmounted // 组件卸载完成
   
   activated ====> onActivated // 若组件实例是 <KeepAlive> 缓存树的一部分，当组件被插入到 DOM 中时调用。
   
   deactivated ====> onDeactivated // 若组件实例是 <KeepAlive> 缓存树的一部分，当组件从 DOM 中被移除时调用。
   ```

### 3. 响应式数据

vue3 中操作响应式数据提供了以下几种API

1. ref

   - 基本用法

     ```vue
     <template>
       <div>
         <span>首页</span>
         <span>{{count}}</span>
         <span>{{refObj.a}}</span>
         <span>{{refObj.c.d[0][1]}}</span>
         <BackTop />
       </div>
     </template>
     <script setup lang="ts">
     import { ref } from 'vue'
       const count = ref(0)
       count.value++
       const refObj = ref({
         a: 'test1',
         b: 'test2',
         c: {
           d: [[10, 20],[52,63]]
         }
       })
       refObj.value.a = 'testa'
       refObj.value.c.d[0][1]++ // 21
     </script>
     
     ```

     

   - ref 数据类型是无论嵌套层级多深，修改值依然可以触发试图更新（响应式），如上refObj.c的对象

   - ref通常用来处理基本类型数据，对象类型的数据结构通常使用reactive

2. shallowRef

   和 ref() 不同，浅层 ref 的内部值将会原样存储和暴露，并且不会被深层递归地转为响应式。只有对 .value 的访问是响应式的。

   ```vue
   <template>
     <div>
       <span>首页</span>
       <span>count的值是：{{ count }}</span>
       <br />
       <br />
       <span>refState.d.c[1]的值是：{{ refState.d.c[1] }}</span>
       <br />
       <br />
       <span>shallowState.d.c[1]的值是：{{ shallowState.d.c[1] }}</span>
       <br />
       <br />
       <el-button type="primary" @click="updateShallowRefVal">更新shallowRef</el-button>
       <el-button type="primary" @click="updateRefVal">更新ref</el-button>
       <BackTop />
     </div>
   </template>
   <script setup lang="ts">
   import { ref, shallowRef } from 'vue'
   const count = ref(52)
   
   const refState = ref({
     d: {
       c: [1, 2]
     }
   })
   
   const shallowState = shallowRef({
     d: {
       c: [1, 2]
     }
   })
   const updateShallowRefVal = () => {
     shallowState.value.d.c[1]++ // 值不会同步到更新试图
   }
   
   const updateRefVal = () => {
     refState.value.d.c[1]++
   }
   </script>
   
   ```

   ![img](https://cdn.nlark.com/yuque/0/2022/png/2634037/1671011123024-aef0ce96-c6b3-4000-b7ff-243eb2f5d25c.png)

3. reactive

   - 响应式转换是“深层”的：它会影响到所有嵌套的属性。一个响应式对象也将深层地解包任何 [ref](https://cn.vuejs.org/api/reactivity-core.html#ref) 属性，同时保持响应性。
   - 值得注意的是，当访问到某个响应式数组或 Map 这样的原生集合类型中的 ref 元素时，不会执行 ref 的解包。
   - 若要避免深层响应式转换，只想保留对这个对象顶层次访问的响应性，请使用 [shallowReactive()](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreactive) 作替代。
   - 返回的对象以及其中嵌套的对象都会通过 [ES Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) 包裹，因此**不等于**源对象，建议只使用响应式代理，避免使用原始对象。

   1. ref解包的栗子

      ```vue
      <template>
        <div>
          <span>首页</span>
          <br />
          <br />
          <span>ref的count:{{ count }}</span>
          <br />
          <br />
          <span>reactive的count:{{ count }}</span>
          <br />
          <br />
          <!-- <el-button type="primary" @click.stop="updateShallowRefVal">更新shallowRef</el-button> -->
          <el-button type="primary" @click.stop="updateReactiveVal">更新reactive</el-button>
          <BackTop />
        </div>
      </template>
      <script setup lang="ts">
      import { ref, reactive } from 'vue'
      
      const count = ref(1)
      const obj = reactive({ count })
      
      const updateReactiveVal = () => {
        // 会更新 `obj.count`
        count.value++
        // 也会更新 `count` ref
        obj.count++ // 不需要通过obj.count.value++这样进行ref数据的更新
      }
      </script>
      
      ```

      

   2. 响应式数组或 Map 这样的原生集合类型中的 ref 元素时，不会执行 ref 的解包。

      ```vue
      <template>
        <div>
          <span>首页</span>
          <br />
          <br />
          <!-- <span>ref的count:{{ count }}</span> -->
          <br />
          <br />
          <!-- <span>reactive的count:{{ count }}</span> -->
          <br />
          <br />
          <!-- <el-button type="primary" @click.stop="updateShallowRefVal">更新shallowRef</el-button> -->
          <!-- <el-button type="primary" @click.stop="updateReactiveVal">更新reactive</el-button> -->
          <BackTop />
        </div>
      </template>
      <script setup lang="ts">
      import { ref, reactive } from 'vue'
      
      const books = reactive([ref('Vue 3 Guide')])
      // 这里需要 .value
      console.log(books[0].value) // Vue 3 Guide
      
      const map = reactive(new Map([['count', ref(0)]]))
      // 这里需要 .value
      console.log(map.get('count').value) // 0
      </script>
      
      ```

      

4. shallowReactive

   - reactive的浅层作用形式

   - 没有深层级的转换：一个浅层响应式对象里只有根级别的属性是响应式的。属性的值会被原样存储和暴露，这也意味着值为 ref 的属性**不会**被自动解包了。

     ```vue
     <template>
       <div>
         <span>首页</span>
         <br />
         <br />
         <!-- <span>ref的count:{{ count }}</span> -->
         <br />
         <br />
         <span>state.bar的值：{{ state.bar }}</span>
         <br />
         <br />
         <span>state.nested.bar的值：{{ state.nested.bar }}</span>
         <br />
         <br />
         <el-button type="primary" @click="updateBar">更新state.bar</el-button>
         <el-button type="primary" @click="updateNestedBar">更新state.nested.bar</el-button>
         <!-- <el-button type="primary" @click.stop="updateReactiveVal">更新reactive</el-button> -->
         <BackTop />
       </div>
     </template>
     <script setup lang="ts">
     import { shallowReactive, isReactive, ref } from 'vue'
     
     const state = shallowReactive({
       foo: 1,
       nested: {
         bar: 2
       },
       bar: ref(2)
     })
     // 更改状态自身的属性是响应式的
     state.foo++
     
     // ...但下层嵌套对象不会被转为响应式
     isReactive(state.nested) // false
     
     const updateBar = () => {
       state.bar.value++ // 不会解包
     }
     
     const updateNestedBar = () => {
       // 不是响应式的
       state.nested.bar++
       console.log('state.nested.bar', state.nested.bar)
     }
     </script>
     
     ```

     更新state.bar

     ![img](https://cdn.nlark.com/yuque/0/2022/png/2634037/1671013218165-4bb7287c-c818-4558-bacd-7e1495938d1b.png)

     更新state.nested.bar

     ![img](https://cdn.nlark.com/yuque/0/2022/png/2634037/1671013238397-cf7b3de9-c882-475f-964b-85bff1da169a.png)

5. readonly

   接受一个对象 (不论是响应式还是普通的) 或是一个 [ref](https://cn.vuejs.org/api/reactivity-core.html#ref)，返回一个原值的只读代理。

   只读代理是深层的：对任何嵌套属性的访问都将是只读的。它的 ref 解包行为与 reactive() 	相同，但解包得到的值是只读的。

   要避免深层级的转换行为，请使用 [shallowReadonly()](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreadonly) 作替代。

   ```vue
   <template>
     <div>
       <span>首页</span>
       <br />
       <br />
       <!-- <span>ref的count:{{ count }}</span> -->
       <br />
       <br />
       <!-- <span>state.bar的值：{{ state.bar }}</span> -->
       <br />
       <br />
       <!-- <span>state.nested.bar的值：{{ state.nested.bar }}</span> -->
       <br />
       <br />
       <!-- <el-button type="primary" @click="updateBar">更新state.bar</el-button> -->
       <!-- <el-button type="primary" @click="updateNestedBar">更新state.nested.bar</el-button> -->
       <!-- <el-button type="primary" @click.stop="updateReactiveVal">更新reactive</el-button> -->
       <BackTop />
     </div>
   </template>
   <script setup lang="ts">
   import { reactive, readonly, watchEffect } from 'vue'
   
   const original = reactive({ count: 0 })
   
   const copy = readonly(original)
   
   watchEffect(() => {
     // 用来做响应性追踪
     console.log(copy.count)
   })
   
   // 更改源属性会触发其依赖的侦听器
   original.count++
   
   // 更改该只读副本将会失败，并会得到一个警告
   copy.count++ // warning!
   </script>
   
   ```

   ![img](https://cdn.nlark.com/yuque/0/2022/png/2634037/1671013589650-143013d8-7ec9-48c5-aec6-fcf3387ba88e.png)

6. computed

   接受一个 getter 函数，返回一个只读的响应式 [ref](https://cn.vuejs.org/api/reactivity-core.html#ref) 对象。该 ref 通过 .value 暴露 getter 函数的返回值。它也可以接受一个带有 get 和 set 函数的对象来创建一个可写的 ref 对象。

   - 创建一个只读的计算属性 ref

     ```vue
     const count = ref(1)
     const plusOne = computed(() => count.value + 1)
     
     console.log(plusOne.value) // 2
     
     plusOne.value++ // 错误
     
     ```

   - 创建一个可写的计算属性 ref

     ```vue
     const count = ref(1)
     const plusOne = computed({
       get: () => count.value + 1,
       set: (val) => {
         count.value = val - 1
       }
     })
     
     plusOne.value = 1
     console.log(count.value) // 0
     ```

7. 副作用、监听器

   1. watch

   ```typescript
   // 侦听单个来源
   function watch<T>(
     source: WatchSource<T>,
     callback: WatchCallback<T>,
     options?: WatchOptions
   ): StopHandle
   
   // 侦听多个来源
   function watch<T>(
     sources: WatchSource<T>[],
     callback: WatchCallback<T[]>,
     options?: WatchOptions
   ): StopHandle
   
   type WatchCallback<T> = (
   value: T,
   oldValue: T,
   onCleanup: (cleanupFn: () => void) => void
   ) => void
   
   type WatchSource<T> =
   | Ref<T> // ref
   | (() => T) // getter
   | T extends object
   ? T
   : never // 响应式对象
   
   interface WatchOptions extends WatchEffectOptions {
     immediate?: boolean // 默认：false
     deep?: boolean // 默认：false
     flush?: 'pre' | 'post' | 'sync' // 默认：'pre' 前置刷新 Vue更新DOM之前
     onTrack?: (event: DebuggerEvent) => void
     onTrigger?: (event: DebuggerEvent) => void
   }
   ```

   - 默认是懒监听，即在侦听源发生变化时才执行回调函数
   - 侦听来源

   1. 1. 一个函数，返回一个值
      2. 一个ref
      3. 一个响应式对象
      4. 以上值组成的数组

   侦听一个 getter 函数：

   ```typescript
   const state = reactive({ count: 0 })
   watch(
     () => state.count,
     (count, prevCount) => {
       /* ... */
     }
   )
   ```

   侦听一个 ref：

   ```typescript
   const count = ref(0)
   watch(count, (count, prevCount) => {
     /* ... */
   })
   ```

   当侦听多个来源时，回调函数接受两个数组，分别对应来源数组中的新值和旧值：

   ```typescript
   watch([fooRef, barRef], ([foo, bar], [prevFoo, prevBar]) => {
     /* ... */
   })
   ```

   当使用 getter 函数作为源时，回调只在此函数的返回值变化时才会触发。如果你想让回调在深层级变更时也能触发，你需要使用 { deep: true } 强制侦听器进入深层级模式。在深层级模式时，如果回调函数由于深层级的变更而被触发，那么新值和旧值将是同一个对象。

   ```typescript
   const state = reactive({ count: 0 })
   watch(
     () => state,
     (newValue, oldValue) => {
       // newValue === oldValue
     },
     { deep: true }
   )
   ```

   当直接侦听一个响应式对象时，侦听器会自动启用深层模式：

   ```typescript
   const state = reactive({ count: 0 })
   watch(state, () => {
     /* 深层级变更状态所触发的回调 */
   })
   ```

   

   1. watchEffect

   立即执行一个函数，同时响应式的追踪其依赖，并在依赖更改时重新执行

   类型

   ```typescript
   function watchEffect(
     effect: (onCleanup: OnCleanup) => void,
     options?: WatchEffectOptions
   ): StopHandle
   
   type OnCleanup = (cleanupFn: () => void) => void
   
   interface WatchEffectOptions {
     flush?: 'pre' | 'post' | 'sync' // 默认：'pre'
     onTrack?: (event: DebuggerEvent) => void
     onTrigger?: (event: DebuggerEvent) => void
   }
   
   type StopHandle = () => void
   ```

   - **详细信息**

   第一个参数就是要运行的副作用函数。这个副作用函数的参数也是一个函数，用来注册清理回调。清理回调会在该副作用下一次执行前被调用，可以用来清理无效的副作用，例如等待中的异步请求 (参见下面的示例)。

   第二个参数是一个可选的选项，可以用来调整副作用的刷新时机或调试副作用的依赖。

   默认情况下，侦听器将在组件渲染之前执行。设置 flush: 'post' 将会使侦听器延迟到组件渲染之后再执行。详见[回调的触发时机](https://cn.vuejs.org/guide/essentials/watchers.html#callback-flush-timing)。在某些特殊情况下 (例如要使缓存失效)，可能有必要在响应式依赖发生改变时立即触发侦听器。这可以通过设置 flush: 'sync' 来实现。然而，该设置应谨慎使用，因为如果有多个属性同时更新，这将导致一些性能和数据一致性的问题。

   返回值是一个用来停止该副作用的函数。

   

   ```typescript
   const count = ref(0)
   
   watchEffect(() => console.log(count.value))
   // -> 输出 0
   
   count.value++
   // -> 输出 1
   ```

   

   副作用清除

   ```typescript
   watchEffect(async (onCleanup) => {
     const { response, cancel } = doAsyncWork(id.value)
     // `cancel` 会在 `id` 更改时调用
     // 以便取消之前
     // 未完成的请求
     onCleanup(cancel)
     data.value = await response
   })
   ```

   

   停止侦听器

   ```typescript
   const stop = watchEffect(() => {})
   
   // 当不再需要此侦听器时:
   stop()
   ```

   

   选项

   ```typescript
   watchEffect(() => {}, {
     flush: 'post',
     onTrack(e) {
       debugger
     },
     onTrigger(e) {
       debugger
     }
   })
   ```

   1. watchPostEffect

   [watchEffect()](https://cn.vuejs.org/api/reactivity-core.html#watcheffect) 使用 flush: 'post' 选项时的别名。// 同$nextTick 操作dom、组件等

   1. watchSyncEffect

   [watchEffect()](https://cn.vuejs.org/api/reactivity-core.html#watcheffect) 使用 flush: 'sync' 选项时的别名。// 同步调用，一旦依赖变更立即触发

   手动停止监听器/副作用

   ```typescript
   const stopWatchEffect = watchEffect(() => {})
   
   onBeforeUnmount(() => {
     stopWatchEffect()
   })
   ```

### 4. 响应式工具

1. isRef  

   检查某个值是否是ref

   - 类型

     ```typescript
     function isRef<T>(r:Ref<T> | unknown): r is Ref<T>
     ```

     请注意，返回值是一个[类型判定](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) (type predicate)，这意味着 isRef 可以被用作类型守卫：

     ```typescript
     let foo:unknown
     if(isRef(foo)) {
       return foo.value
     }
     ```

2. unref

如果参数是 ref，则返回内部值，否则返回参数本身。这是 val = isRef(val) ? val.value : val 计算的一个语法糖。

- 类型

```typescript
function unref<T>(ref: T | Ref<T>): T
```

- 示例

```typescript
function useFoo(x: number | Ref<number>) {
  const unwrapped = unref(x)
  // unwrapped 现在保证为 number 类型
}
```

3. toRef

基于响应式对象上的一个属性，创建一个对应的 ref。这样创建的 ref 与其源属性保持同步：改变源属性的值将更新 ref 的值，反之亦然。

- 类型

```typescript
function toRef<T extends object, K extends keyof T>(
  object: T,
  key: K,
  defaultValue?: T[K]
): ToRef<T[K]>

type ToRef<T> = T extends Ref ? T : Ref<T>
```

- 示例

```typescript
const state = reactive({
  foo: 1,
  bar: 2
})

const fooRef = toRef(state, 'foo')

// 更改该 ref 会更新源属性
fooRef.value++
console.log(state.foo) // 2

// 更改源属性也会更新该 ref
state.foo++
console.log(fooRef.value) // 3
```

请注意，这不同于：

```typescript
const fooRef = ref(state.foo)
```

上面这个 ref **不会**和 state.foo 保持同步，因为这个 ref() 接收到的是一个纯数值。

toRef() 这个函数在你想把一个 prop 的 ref 传递给一个组合式函数时会很有用：



```typescript
<script setup>
import { toRef } from 'vue'

const props = defineProps(/* ... */)

// 将 `props.foo` 转换为 ref，然后传入
// 一个组合式函数
useSomeFeature(toRef(props, 'foo'))
</script>
```

当 toRef 与组件 props 结合使用时，关于禁止对 props 做出更改的限制依然有效。尝试将新的值传递给 ref 等效于尝试直接更改 props，这是不允许的。在这种场景下，你可能可以考虑使用带有 get 和 set 的 [computed](https://cn.vuejs.org/api/reactivity-core.html#computed) 替代

1. toRefs

将一个响应式对象转换为一个普通对象，这个普通对象的每个属性都是指向源对象相应属性的 ref。每个单独的 ref 都是使用 [toRef()](https://cn.vuejs.org/api/reactivity-utilities.html#toref) 创建的。

- 类型

```typescript
function toRefs<T extends object>(
  object: T
): {
  [K in keyof T]: ToRef<T[K]>
}

type ToRef = T extends Ref ? T : Ref<T> // 非Ref类型使用Ref包装
```

- 示例

```typescript
const state = reactive({
  foo: 1,
  bar: 2
})

const stateAsRefs = toRefs(state)
/*
stateAsRefs 的类型：{
  foo: Ref<number>,
  bar: Ref<number>
}
*/

// 这个 ref 和源属性已经“链接上了”
state.foo++
console.log(stateAsRefs.foo.value) // 2

stateAsRefs.foo.value++
console.log(state.foo) // 3
```

当从组合式函数中返回响应式对象时，toRefs 相当有用。使用它，消费者组件可以解构/展开返回的对象而不会失去响应性：

```typescript
function useFeatureX() {
  const state = reactive({
    foo: 1,
    bar: 2
  })

  // ...基于状态的操作逻辑

  // 在返回时都转为 ref
  return toRefs(state)
}

// 可以解构而不会失去响应性
const { foo, bar } = useFeatureX()
```

toRefs 在调用时只会为源对象上可以枚举的属性创建 ref。如果要为可能还不存在的属性创建 ref，请改用 [toRef](https://cn.vuejs.org/api/reactivity-utilities.html#toref)。

### 5. 响应式进阶

1. triggerRef

强制触发依赖于一个[浅层 ref](https://cn.vuejs.org/api/reactivity-advanced.html#shallowref) 的副作用，这通常在对浅引用的内部值进行深度变更后使用。

```typescript
function triggerRef(ref: ShallowRef): void
```

- 示例

```typescript
const shallow = shallowRef({
  greet: 'Hello, world'
})

// 触发该副作用第一次应该会打印 "Hello, world"
watchEffect(() => {
  console.log(shallow.value.greet)
})

// 这次变更不应触发副作用，因为这个 ref 是浅层的
shallow.value.greet = 'Hello, universe'

// 打印 "Hello, universe"
triggerRef(shallow)
```

1. customRef

创建一个自定义的 ref，显式声明对其依赖追踪和更新触发的控制方式。

- 类型

```typescript
function customRef<T>(factory: CustomRefFactory<T>): Ref<T>

type CustomRefFactory<T> = (
  track: () => void,
  trigger: () => void
) => {
  get: () => T
  set: (value: T) => void
}
```

- 详细信息

customRef() 预期接收一个工厂函数作为参数，这个工厂函数接受 track 和 trigger 两个函数作为参数，并返回一个带有 get 和 set 方法的对象。

一般来说，track() 应该在 get() 方法中调用，而 trigger() 应该在 set() 中调用。然而事实上，你对何时调用、是否应该调用他们有完全的控制权。

- 示例

创建一个防抖的ref，即只在最近一次set调用后的一段固定间隔后在调用

```typescript
import { customRef } from 'vue'

export default useDebouncedRef(value, delay = 2000) {
  let timeout
  return customRef((track, trigger) => {
    return {
      get() {
        track()
        return value
      },
      set(newValue) {
        clearTimeout(timeout)
        timeout = setTimeout(() => {
          value = newValue
          trigger()
        }, delay)
      }
    }
  })
}
```

组件中使用

```vue
<script setup lang="ts">
import useDebouncedRef from './useDebouncedRef'

const text = useDebouncedRef('hello')
</script>
<template>
  <input v-model="text" />
</template>
```

1. toRaw

根据一个 Vue 创建的代理返回其原始对象。

- - 类型

```typescript
function toRaw<T>(proxy: T): T
```

- - 详细信息

toRaw() 可以返回由 [reactive()](https://cn.vuejs.org/api/reactivity-core.html#reactive)、[readonly()](https://cn.vuejs.org/api/reactivity-core.html#readonly)、[shallowReactive()](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreactive) 或者 [shallowReadonly()](https://cn.vuejs.org/api/reactivity-advanced.html#shallowreadonly) 创建的代理对应的原始对象。

这是一个可以用于临时读取而不引起代理访问/跟踪开销，或是写入而不触发更改的特殊方法。不建议保存对原始对象的持久引用，请谨慎使用。

- - 示例

```typescript
const foo = {}
const reactiveFoo = reactive(foo)

console.log(toRaw(reactiveFoo) === foo) // true
```

1. markRaw

将一个对象标记为不可被转为代理。返回该对象本身。

1. effectScope --TODO
2. getCurrentEffectScope --TODO

### 6. 依赖注入

1. provide

提供一个值，可以被后代组件注入。

- - 类型

```typescript
function provide<T>(key: InjectionKey<T> | string, value: T): void
```

- - 详细信息

provide() 接受两个参数：第一个参数是要注入的 key，可以是一个字符串或者一个 symbol，第二个参数是要注入的值。

当使用 TypeScript 时，key 可以是一个被类型断言为 InjectionKey 的 symbol。InjectionKey 是一个 Vue 提供的工具类型，继承自 Symbol，可以用来同步 provide() 和 inject() 之间值的类型。

与注册生命周期钩子的 API 类似，provide() 必须在组件的 setup() 阶段同步调用。

- - 示例

```typescript
<script setup>
import { ref, provide } from 'vue'
import { fooSymbol } from './injectionSymbols'

// 提供静态值
provide('foo', 'bar')

// 提供响应式的值
const count = ref(0)
provide('count', count)

// 提供时将 Symbol 作为 key
provide(fooSymbol, count)
</script>
```

1. inject

注入一个由祖先组件或整个应用 (通过 app.provide()) 提供的值。

- - 类型

```typescript
// 没有默认值
function inject<T>(key: InjectionKey<T> | string): T | undefined

// 带有默认值
function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T

// 使用工厂函数
function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue: () => T,
  treatDefaultAsFactory: true
): T
```

- - 详细信息

第一个参数是注入的 key。Vue 会遍历父组件链，通过匹配 key 来确定所提供的值。如果父组件链上多个组件对同一个 key 提供了值，那么离得更近的组件将会“覆盖”链上更远的组件所提供的值。如果没有能通过 key 匹配到值，inject() 将返回 undefined，除非提供了一个默认值。

第二个参数是可选的，即在没有匹配到 key 时使用的默认值。它也可以是一个工厂函数，用来返回某些创建起来比较复杂的值。如果默认值本身就是一个函数，那么你必须将 false 作为第三个参数传入，表明这个函数就是默认值，而不是一个工厂函数。

与注册生命周期钩子的 API 类似，inject() 必须在组件的 setup() 阶段同步调用。

当使用 TypeScript 时，key 可以是一个类型为 InjectionKey 的 symbol。InjectionKey 是一个 Vue 提供的工具类型，继承自 Symbol，可以用来同步 provide() 和 inject() 之间值的类型。

- - 示例

假设有一个父组件已经提供了一些值，如前面 provide() 的例子中所示：

```typescript
<script setup>
import { inject } from 'vue'
import { fooSymbol } from './injectionSymbols'

// 注入值的默认方式
const foo = inject('foo')

// 注入响应式的值
const count = inject('count')

// 通过 Symbol 类型的 key 注入
const foo2 = inject(fooSymbol)

// 注入一个值，若为空则使用提供的默认值
const bar = inject('foo', 'default value')

// 注入一个值，若为空则使用提供的工厂函数
const baz = inject('foo', () => new Map())

// 注入时为了表明提供的默认值是个函数，需要传入第三个参数
const fn = inject('function', () => {}, false)
</script>
```

### 7. setup 语法糖扩展

1. 使用响应式

响应式状态需要明确使用[响应式 API](https://cn.vuejs.org/api/reactivity-core.html) 来创建。和 setup() 函数的返回值一样，ref 在模板中使用的时候会自动解包：

```vue
<script setup>
  import { ref } from 'vue'
  
  const count = ref(0)
</script>

<template>
  <button @click="count++">{{ count }}</button>
</template>
```

1. 使用组件

引入的组件可直接使用，无需在components中注册，同时vue3推荐使用 PascalCase 格式以保持一致性

```vue
<script setup>
import MyComponent from './MyComponent.vue'
</script>

<template>
  <MyComponent />
</template>
```

动态组件 - 使用动态的 :is 来绑定：

```vue
<script setup>
import Foo from './Foo.vue'
import Bar from './Bar.vue'
</script>

<template>
  <component :is="Foo" />
  <component :is="someCondition ? Foo : Bar" />
</template>
```

递归组件

一个单文件组件可以通过它的文件名被其自己所引用。例如：名为 FooBar.vue 的组件可以在其模板中用FooBar引用它自己。

请注意这种方式相比于导入的组件优先级更低。如果有具名的导入和组件自身推导的名字冲突了，可以为导入的组件添加别名：

```javascript
import { FooBar as FooBarChild } from './components'
```

组件命名空间

可以使用带 . 的组件标签，例如 <Foo.Bar> 来引用嵌套在对象属性中的组件。这在需要从单个文件中导入多个组件的时候非常有用：

```vue
<script setup>
  import * as Form from './form-components'
</script>

<template>
<Form.Input>
  <Form.Label>label</Form.Label>
  </Form.Input>
</template>
```

1. 使用自定义指令

全局注册的自定义指令将正常工作。本地的自定义指令在setup语法糖 中不需要显式注册，但他们必须遵循 vNameOfDirective 这样的命名规范：

```vue
<script setup>
const vMyDirective = {
  beforeMount: (el) => {
    // 在元素上做些操作
  }
}
</script>
<template>
  <h1 v-my-directive>This is a Heading</h1>
</template>
```



如果指令是从别处导入的，可以通过重命名来使其符合命名规范：

```vue
<script setup>
import { myDirective as vMyDirective } from './MyDirective.js'
</script>
```

1. defineProps和defineEmits 父子通信

两者无需引入便可使用， defineProps 对应了父 - >子 的props，defineEmits 对应了子 -> 父的emits

1. defineExpose

使用 setup语法糖 的组件是**默认关闭**的——即通过模板引用或者 $parent 链获取到的组件的公开实例，**不会**暴露任何在 setup语法糖中声明的绑定。

可以通过 defineExpose 编译器宏来显式指定在setup语法糖组件中要暴露出去的属性：

```vue
<script setup>
import { ref } from 'vue'

const a = 1
const b = ref(2)

defineExpose({
  a,
  b
})
</script>
```

当父组件通过模板引用的方式获取到当前组件的实例，获取到的实例会像这样 { a: number, b: number } (ref 会和在普通实例中一样被自动解包)

1. useSlots 和 useAttrs

在setup语法糖中使用 slots 和 attrs 的情况应该是相对来说较为罕见的，因为可以在模板中直接通过 $slots 和 $attrs 来访问它们。在你的确需要使用它们的罕见场景中，可以分别用 useSlots 和 useAttrs 两个辅助函数：

```vue
<script setup>
import { useSlots, useAttrs } from 'vue'

const slots = useSlots()
const attrs = useAttrs()
</script>
```

1. defineProps  和 defineEmits 的类型声明

```vue
const props = defineProps<{
  foo: string
  bar?: number
}>()

const emit = defineEmits<{
  (e: 'change', id: number): void
  (e: 'update', value: string): void
}>()
```

声明带有默认值的props

```typescript
export interface Props {
  msg?: string
  labels?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  msg: 'hello',
  labels: () => ['one', 'two']
})
```
