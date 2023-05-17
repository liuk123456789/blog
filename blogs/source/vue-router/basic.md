---
title: vue-router 第一篇
date: 2023-05-15
categories: 
 - 源码解读
tags:
 - vue router
sidebar: auto
---

## 1. 前言

版本说明

```
vue-router: '4.2.0'
vue: '3.3.1'
vite: '4.3.5'
typescript: '4.9.4'
```

## 2. HTML5 history

开始源码前，我们有必要知道关于`HTML5`的`history`的一些`api`，以下内容大部分都是从[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/History)获取的

- 含义：`history`允许操作浏览器的曾经在标签页或者框架访问的历史绘画记录

- 属性

  length: 表示会话历史中元素的数目，包括当前加载的页

  scrollRestoration:允许 web 应用程序在历史导航上显式地设置默认滚动恢复行为

  state:history 栈顶的 `任意` 值的拷贝。通过这种方式可以查看 state 值，不必等待 [`popstate`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event)事件发生后再查看。

  > 需要注意的是如果不调用replaceState/pushState，那么state的值是null

- 方法

  `back()`

  ​	会话历史记录中向后移动一页。如果没有上一页，则此方法调用不执行任何操作

  `forward()`

  ​	在会话历史中向前移动一页。它与使用`delta`参数为 1 时调用 `history.go(delta)`的效果相同。

  `go()`

  ​	会话历史记录中加载特定页面。你可以使用它在历史记录中前后移动，具体取决于`delta`参数的值。

  `pushState()`

  ​	向浏览器的会话历史栈增加了一个条目

  ​	该方法是[异步](https://developer.mozilla.org/zh-CN/docs/Glossary/Asynchronous)的。为 [`popstate`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event) 事件增加监听器，以确定导航何时完成。`state` 参数将在其中可用。

  > ​	`history.push(state, unused, url)`

  - state

    `state` 对象是一个 JavaScript 对象，其与通过 `pushState()` 创建的新历史条目相关联。每当用户导航到新的 `state`，都会触发 [`popstate`](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/popstate_event) 事件，并且该事件的 `state` 属性包含历史条目 `state` 对象的副本。

    `state` 对象可以是任何可以序列化的对象。因为 Firefox 将 `state` 对象保存到用户的磁盘上，以便用户重启浏览器可以恢复，我们对 `state` 对象序列化的表示施加了 16 MiB 的限制。如果你传递的 `state` 对象的序列化表示超出了 `pushState()` 可接受的大小，该方法将抛出异常

  - unused

    由于历史原因，该参数存在且不能忽略；传递一个空字符串是安全的，以防将来对该方法进行更改

  - url

    新历史条目的 URL。请注意，浏览器不会在调用 `pushState()` 之后尝试加载该 URL，但是它可能会在以后尝试加载该 URL，例如，在用户重启浏览器之后。新 URL 可以不是绝对路径；如果它是相对的，它将相对于当前的 URL 进行解析。新的 URL 必须与当前 URL 同[源](https://developer.mozilla.org/zh-CN/docs/Glossary/Origin)；否则，`pushState()` 将抛出异常。如果该参数没有指定，则将其设置为当前文档的 URL

  `replaceState()`

  ​	使用`state objects`, `title`,和 `URL` 作为参数，修改当前历史记录实体，如果你想更新当前的 state 	对象或者当前历史实体的 URL 来响应用户的的动作的话这个方法将会非常有用。

  ​	语法

  > `history.replaceState(stateObj, title[, url])`

- popstate

  每当激活的历史记录发生变化时，都会触发`popstate`事件。如果被激活的历史记录条目是由`pushState`所创建，或是被`replaceState`方法影响到的，`popstate`事件的状态属性将包含历史记录的状态对象的一个拷贝。所以我们可以通过监听`popstate`

  > window.addEventListener('popstate', function(event) {
  >
  > ​	//做一些操作
  >
  > })

## 3. 入口

三种路由模式

```typescript
export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'
```

三种分别对应`history`、`memory(用于ssr)`、`hash`创建路由的方式

先看下三种方法

## 4. createWebHistory

```typescript
function createWebHistory(base?: string): RouterHistory {
  base = normalizeBase(base)

  const historyNavigation = useHistoryStateNavigation(base)
  const historyListeners = useHistoryListeners(
    base,
    historyNavigation.state,
    historyNavigation.location,
    historyNavigation.replace
  )
  function go(delta: number, triggerListeners = true) {
    if (!triggerListeners) historyListeners.pauseListeners()
    history.go(delta)
  }

  const routerHistory: RouterHistory = assign(
    {
      // it's overridden right after
      location: '',
      base,
      go,
      createHref: createHref.bind(null, base),
    },

    historyNavigation,
    historyListeners
  )

  Object.defineProperty(routerHistory, 'location', {
    enumerable: true,
    get: () => historyNavigation.location.value,
  })

  Object.defineProperty(routerHistory, 'state', {
    enumerable: true,
    get: () => historyNavigation.state.value,
  })

  return routerHistory
}
```

1. `normalizeBase`

   ```typescript
   /**
    * Normalizes a base by removing any trailing slash and reading the base tag if
    * present.
    *
    * @param base - base to normalize
    */
   export function normalizeBase(base?: string): string {
     if (!base) {
       if (isBrowser) {
         // respect <base> tag
         const baseEl = document.querySelector('base')
         base = (baseEl && baseEl.getAttribute('href')) || '/'
         // strip full URL origin
         base = base.replace(/^\w+:\/\/[^\/]+/, '')
       } else {
         base = '/'
       }
     }
   
     // ensure leading slash when it was removed by the regex above avoid leading
     // slash with hash because the file could be read from the disk like file://
     // and the leading slash would cause problems
     if (base[0] !== '/' && base[0] !== '#') base = '/' + base
   
     // remove the trailing slash so all other method can just do `base + fullPath`
     // to build an href
     return removeTrailingSlash(base)
   }
   ```

   首先判定是否传入参数`base`，如果没有，使用`/base`；否则判定是否是浏览器环境，在浏览器环境下会尝试获取<base>标签的href属性作为base，如果没有<base>标签或<base>标签的`href`属性没有值，base取/，然后又对base进行了`reaplce(/^\w+:\/\/[^\/]+/, '')`操作，该操作是去除base的`http(s)://xxx`部分（如果base是https://vuejs.com/foo/bar，base最终会变成`/foo/bar`

   最后通过`removeTrailingSlash`去掉`base`末尾的`/`

2. `useHistoryStateNavigation`

   将处理后的`base`传入`useHistoryStateNavigation`

   ```typescript
   function useHistoryStateNavigation(base: string) {
     const { history, location } = window
   
     // private variables
     const currentLocation: ValueContainer<HistoryLocation> = {
       value: createCurrentLocation(base, location),
     }
     const historyState: ValueContainer<StateEntry> = { value: history.state }
     // build current history entry as this is a fresh navigation
     if (!historyState.value) {
       changeLocation(
         currentLocation.value,
         {
           back: null,
           current: currentLocation.value,
           forward: null,
           // the length is off by one, we need to decrease it
           position: history.length - 1,
           replaced: true,
           // don't add a scroll as the user may have an anchor, and we want
           // scrollBehavior to be triggered without a saved position
           scroll: null,
         },
         true
       )
     }
   
     function changeLocation(
       to: HistoryLocation,
       state: StateEntry,
       replace: boolean
     ): void {
       /**
        * if a base tag is provided, and we are on a normal domain, we have to
        * respect the provided `base` attribute because pushState() will use it and
        * potentially erase anything before the `#` like at
        * https://github.com/vuejs/router/issues/685 where a base of
        * `/folder/#` but a base of `/` would erase the `/folder/` section. If
        * there is no host, the `<base>` tag makes no sense and if there isn't a
        * base tag we can just use everything after the `#`.
        */
       const hashIndex = base.indexOf('#')
       const url =
         hashIndex > -1
           ? (location.host && document.querySelector('base')
               ? base
               : base.slice(hashIndex)) + to
           : createBaseLocation() + base + to
       try {
         // BROWSER QUIRK
         // NOTE: Safari throws a SecurityError when calling this function 100 times in 30 seconds
         history[replace ? 'replaceState' : 'pushState'](state, '', url)
         historyState.value = state
       } catch (err) {
         if (__DEV__) {
           warn('Error with push/replace State', err)
         } else {
           console.error(err)
         }
         // Force the navigation, this also resets the call count
         location[replace ? 'replace' : 'assign'](url)
       }
     }
   
     function replace(to: HistoryLocation, data?: HistoryState) {
       const state: StateEntry = assign(
         {},
         history.state,
         buildState(
           historyState.value.back,
           // keep back and forward entries but override current position
           to,
           historyState.value.forward,
           true
         ),
         data,
         { position: historyState.value.position }
       )
   
       changeLocation(to, state, true)
       currentLocation.value = to
     }
   
     function push(to: HistoryLocation, data?: HistoryState) {
       // Add to current entry the information of where we are going
       // as well as saving the current position
       const currentState = assign(
         {},
         // use current history state to gracefully handle a wrong call to
         // history.replaceState
         // https://github.com/vuejs/router/issues/366
         historyState.value,
         history.state as Partial<StateEntry> | null,
         {
           forward: to,
           scroll: computeScrollPosition(),
         }
       )
   
       if (__DEV__ && !history.state) {
         warn(
           `history.state seems to have been manually replaced without preserving the necessary values. Make sure to preserve existing history state if you are manually calling history.replaceState:\n\n` +
             `history.replaceState(history.state, '', url)\n\n` +
             `You can find more information at https://next.router.vuejs.org/guide/migration/#usage-of-history-state.`
         )
       }
   
       changeLocation(currentState.current, currentState, true)
   
       const state: StateEntry = assign(
         {},
         buildState(currentLocation.value, to, null),
         { position: currentState.position + 1 },
         data
       )
   
       changeLocation(to, state, false)
       currentLocation.value = to
     }
   
     return {
       location: currentLocation,
       state: historyState,
   
       push,
       replace,
     }
   }
   ```

   代表稍微有点长，我们先看下返回，再看对应的处理

   - location

     ```typescript
     // private variables
     const currentLocation: ValueContainer<HistoryLocation> = {
     	value: createCurrentLocation(base, location),
     }
     ```

     ```typescript
     /**
      * Creates a normalized history location from a window.location object
      * @param base - The base path
      * @param location - The window.location object
      */
     function createCurrentLocation(
       base: string,
       location: Location
     ): HistoryLocation {
       const { pathname, search, hash } = location
       // allows hash bases like #, /#, #/, #!, #!/, /#!/, or even /folder#end
       const hashPos = base.indexOf('#')
       if (hashPos > -1) {
         let slicePos = hash.includes(base.slice(hashPos))
           ? base.slice(hashPos).length
           : 1
         let pathFromHash = hash.slice(slicePos)
         // prepend the starting slash to hash so the url starts with /#
         if (pathFromHash[0] !== '/') pathFromHash = '/' + pathFromHash
         return stripBase(pathFromHash, '')
       }
       const path = stripBase(pathname, base)
       return path + search + hash
     }
     ```

     1. `base`中含`#`，代码逻辑如下所示：

        `hash`:`#/foo/bar`，`base`：`#/foo`，返回：`/bar`

        `hash`:`#/foo/bar`，`base`：`#/`，返回：`/foo/bar`

     2. 不含`#`，那么判定`base`是否存在或者`pathname`是否已`base`开头，如果为`true`，那么返回`pathname`，否则从`pathname`中去除`base`

   - state

     一个包含`value`属性的对象，`value`存储的是当前的`history.state`

   - push

     向历史记录中添加一条记录。在push过程中你会发现调用了两次`changeLocation`，在第一次调用`changeLocation`时，目的是为了记录当前页面在的滚动位置，如果使用`history.back()`或浏览器回退/前进按钮回到这个页面，页面会滚动到对应位置，为了不再历史栈中保存新的记录，第一次记录使用的`reaplceState`替换当前历史记录。第二次调用`changeLocation`是会跳转到需要跳转的位置。

   - replace

     替换当前历史记录

   **基于pushState/replaceState的二次封装**

   ```typescript
   function changeLocation(
       to: HistoryLocation,
       state: StateEntry,
       replace: boolean
     ): void {
       /**
        * if a base tag is provided, and we are on a normal domain, we have to
        * respect the provided `base` attribute because pushState() will use it and
        * potentially erase anything before the `#` like at
        * https://github.com/vuejs/router/issues/685 where a base of
        * `/folder/#` but a base of `/` would erase the `/folder/` section. If
        * there is no host, the `<base>` tag makes no sense and if there isn't a
        * base tag we can just use everything after the `#`.
        */
       const hashIndex = base.indexOf('#')
       const url =
         hashIndex > -1
           ? (location.host && document.querySelector('base')
               ? base
               : base.slice(hashIndex)) + to
           : createBaseLocation() + base + to
       try {
         // BROWSER QUIRK
         // NOTE: Safari throws a SecurityError when calling this function 100 times in 30 seconds
         history[replace ? 'replaceState' : 'pushState'](state, '', url)
         historyState.value = state
       } catch (err) {
         if (__DEV__) {
           warn('Error with push/replace State', err)
         } else {
           console.error(err)
         }
         // Force the navigation, this also resets the call count
         location[replace ? 'replace' : 'assign'](url)
       }
   }
   ```

3. `useHistoryListeners`

   代码如下

   ```typescript
   function useHistoryListeners(
     base: string,
     historyState: ValueContainer<StateEntry>,
     currentLocation: ValueContainer<HistoryLocation>,
     replace: RouterHistory['replace']
   ) {
     let listeners: NavigationCallback[] = []
     let teardowns: Array<() => void> = []
     // TODO: should it be a stack? a Dict. Check if the popstate listener
     // can trigger twice
     let pauseState: HistoryLocation | null = null
   
     const popStateHandler: PopStateListener = ({
       state,
     }: {
       state: StateEntry | null
     }) => {
       const to = createCurrentLocation(base, location)
       const from: HistoryLocation = currentLocation.value
       const fromState: StateEntry = historyState.value
       let delta = 0
   
       if (state) {
         currentLocation.value = to
         historyState.value = state
   
         // ignore the popstate and reset the pauseState
         if (pauseState && pauseState === from) {
           pauseState = null
           return
         }
         delta = fromState ? state.position - fromState.position : 0
       } else {
         replace(to)
       }
   
       // console.log({ deltaFromCurrent })
       // Here we could also revert the navigation by calling history.go(-delta)
       // this listener will have to be adapted to not trigger again and to wait for the url
       // to be updated before triggering the listeners. Some kind of validation function would also
       // need to be passed to the listeners so the navigation can be accepted
       // call all listeners
       listeners.forEach(listener => {
         listener(currentLocation.value, from, {
           delta,
           type: NavigationType.pop,
           direction: delta
             ? delta > 0
               ? NavigationDirection.forward
               : NavigationDirection.back
             : NavigationDirection.unknown,
         })
       })
     }
   
     function pauseListeners() {
       pauseState = currentLocation.value
     }
   
     function listen(callback: NavigationCallback) {
       // set up the listener and prepare teardown callbacks
       listeners.push(callback)
   
       const teardown = () => {
         const index = listeners.indexOf(callback)
         if (index > -1) listeners.splice(index, 1)
       }
   
       teardowns.push(teardown)
       return teardown
     }
   
     function beforeUnloadListener() {
       const { history } = window
       if (!history.state) return
       history.replaceState(
         assign({}, history.state, { scroll: computeScrollPosition() }),
         ''
       )
     }
   
     function destroy() {
       for (const teardown of teardowns) teardown()
       teardowns = []
       window.removeEventListener('popstate', popStateHandler)
       window.removeEventListener('beforeunload', beforeUnloadListener)
     }
   
     // set up the listeners and prepare teardown callbacks
     window.addEventListener('popstate', popStateHandler)
     // TODO: could we use 'pagehide' or 'visibilitychange' instead?
     // https://developer.chrome.com/blog/page-lifecycle-api/
     window.addEventListener('beforeunload', beforeUnloadListener, {
       passive: true,
     })
   
     return {
       pauseListeners,
       listen,
       destroy,
     }
   }
   ```

   同样，通过返回值看下逻辑

   - pauseListeners

     暂停监听的函数

   - listen

     接收一个回调函数，并返回一个删除监听的函数。该回调函数会被加入`listeners`数组中，并向`teardowns`数组中添加卸载函数。

   - destroy

     销毁函数，清空`listeners`与`teardowns`，移除`popstate`、`beforeunload`监听。

   核心方法**`popStateHandler`**

   ```typescript
   const popStateHandler: PopStateListener = ({
       state,
     }: {
       state: StateEntry | null
     }) => {
       // to: 目标路由
       const to = createCurrentLocation(base, location)
       // from: 来源路由
       const from: HistoryLocation = currentLocation.value
       // 路由堆栈信息
       const fromState: StateEntry = historyState.value
       let delta = 0
   
       if (state) {
         currentLocation.value = to
         historyState.value = state
   
         // 忽略popstate并重置pauseState
         if (pauseState && pauseState === from) {
           pauseState = null
           return
         }
         delta = fromState ? state.position - fromState.position : 0
       } else {
         replace(to)
       }
   
       // console.log({ deltaFromCurrent })
       // Here we could also revert the navigation by calling history.go(-delta)
       // this listener will have to be adapted to not trigger again and to wait for the url
       // to be updated before triggering the listeners. Some kind of validation function would also
       // need to be passed to the listeners so the navigation can be accepted
       // call all listeners
       listeners.forEach(listener => {
         listener(currentLocation.value, from, {
           delta,
           type: NavigationType.pop,
           direction: delta
             ? delta > 0
               ? NavigationDirection.forward
               : NavigationDirection.back
             : NavigationDirection.unknown,
         })
       })
     }
   ```

   - 初始判定是否存在，不存在执行`replace`的逻辑
   - 更新`currentLoaction`&`historyState`
   - 设置`delta`（主要用于判定forward还是back)
   - 遍历监听数组，执行回调,`delta` 如果是大于0,那么`forward`,否则`back`

   **构建`state`对象**

   ```typescript
   /**
    * Creates a state object
    */
   function buildState(
     back: HistoryLocation | null,
     current: HistoryLocation,
     forward: HistoryLocation | null,
     replaced: boolean = false,
     computeScroll: boolean = false
   ): StateEntry {
     return {
       back,
       current,
       forward,
       replaced,
       position: window.history.length,
       scroll: computeScroll ? computeScrollPosition() : null,
     }
   }
   ```

   这个方法主要是外部调用`push`，`replace`时，构建`state`对象，对象内容包括如下

   - back

     back的url

   - current

     当前url

   - forward

     forward的url

   - replaced

     是否是replace，replace 执行replaceState

   - position

     路由栈历史记录

   - scroll

     滚动条位置

   最后创建一个`routerHistory`对象，并将其返回。

   ```typescript
   const routerHistory: RouterHistory = assign(
     {
       location: '',
       base,
       go,
       createHref: createHref.bind(null, base),
     },
     historyNavigation,
     historyListeners
   )
   
   // 拦截routerHistory.location，使routerHistory.location返回当前路由地址
   Object.defineProperty(routerHistory, 'location', {
     enumerable: true,
     get: () => historyNavigation.location.value,
   })
   
   // 拦截routerHistory.state，使routerHistory.state返回当前的的history.state
   Object.defineProperty(routerHistory, 'state', {
     enumerable: true,
     get: () => historyNavigation.state.value,
   })
   
   return routerHistory
   ```

## 3. createHashHistory

基于`createWebHistory`实现

代码如下

```typescript
export function createWebHashHistory(base?: string): RouterHistory {
  // 对于使用文件协议打开的页面location.host是空字符串，这时的base为''
  // 也就是说在使用文件协议打开页面时，设置了base是不生效的，因为base始终是''
  base = location.host ? base || location.pathname + location.search : ''
  // 允许中间的#: `/base/#/app`
  if (!base.includes('#')) base += '#'

  if (__DEV__ && !base.endsWith('#/') && !base.endsWith('#')) {
    warn(
      `A hash base must end with a "#":\n"${base}" should be "${base.replace(
        /#.*$/,
        '#'
      )}".`
    )
  }
  return createWebHistory(base)
}
```

## 4. createMemoryHistory

代码如下

```typescript
/**
 * Creates an in-memory based history. The main purpose of this history is to handle SSR. It starts in a special location that is nowhere.
 * It's up to the user to replace that location with the starter location by either calling `router.push` or `router.replace`.
 *
 * @param base - Base applied to all urls, defaults to '/'
 * @returns a history object that can be passed to the router constructor
 */
export function createMemoryHistory(base: string = ''): RouterHistory {
  let listeners: NavigationCallback[] = []
  let queue: HistoryLocation[] = [START]
  let position: number = 0
  base = normalizeBase(base)

  function setLocation(location: HistoryLocation) {
    position++
    if (position === queue.length) {
      // we are at the end, we can simply append a new entry
      queue.push(location)
    } else {
      // we are in the middle, we remove everything from here in the queue
      queue.splice(position)
      queue.push(location)
    }
  }

  function triggerListeners(
    to: HistoryLocation,
    from: HistoryLocation,
    { direction, delta }: Pick<NavigationInformation, 'direction' | 'delta'>
  ): void {
    const info: NavigationInformation = {
      direction,
      delta,
      type: NavigationType.pop,
    }
    for (const callback of listeners) {
      callback(to, from, info)
    }
  }

  const routerHistory: RouterHistory = {
    // rewritten by Object.defineProperty
    location: START,
    // TODO: should be kept in queue
    state: {},
    base,
    createHref: createHref.bind(null, base),

    replace(to) {
      // remove current entry and decrement position
      queue.splice(position--, 1)
      setLocation(to)
    },

    push(to, data?: HistoryState) {
      setLocation(to)
    },

    listen(callback) {
      listeners.push(callback)
      return () => {
        const index = listeners.indexOf(callback)
        if (index > -1) listeners.splice(index, 1)
      }
    },
    destroy() {
      listeners = []
      queue = [START]
      position = 0
    },

    go(delta, shouldTrigger = true) {
      const from = this.location
      const direction: NavigationDirection =
        // we are considering delta === 0 going forward, but in abstract mode
        // using 0 for the delta doesn't make sense like it does in html5 where
        // it reloads the page
        delta < 0 ? NavigationDirection.back : NavigationDirection.forward
      position = Math.max(0, Math.min(position + delta, queue.length - 1))
      if (shouldTrigger) {
        triggerListeners(this.location, from, {
          direction,
          delta,
        })
      }
    },
  }

  Object.defineProperty(routerHistory, 'location', {
    enumerable: true,
    get: () => queue[position],
  })

  if (__TEST__) {
    // @ts-expect-error: only for tests
    routerHistory.changeURL = function (url: string) {
      const from = this.location
      queue.splice(position++ + 1, queue.length, url)
      triggerListeners(this.location, from, {
        direction: NavigationDirection.unknown,
        delta: 0,
      })
    }
  }

  return routerHistory
}
```

返回的还是`routerHistory`对象

- 定义了`listeners`，`quene`，`position`三个变量，分别代表监听器集合，历史记录队列，历史记录在队列的位置

- 设置记录

  ```typescript
  function setLocation(location: HistoryLocation) {
      position++
      if (position === queue.length) {
        // we are at the end, we can simply append a new entry
        queue.push(location)
      } else {
        // we are in the middle, we remove everything from here in the queue
        queue.splice(position)
        queue.push(location)
      }
  }
  ```

  调用阶段，position自增，判定下此时position是否和对象的长度一直，如果一致，那么入栈，

  否则，当历史记录在队列的非末尾位置时，删除position及之后的记录，然后再push，如果某一刻处在非结尾的历史记录时，这时要进行push或reqlace操作，此时position之后的记录就会失效

- go 方法

  ```typescript
  go(delta, shouldTrigger = true) {
    const from = this.location
    // go的方向。delta < 0 为 back，相反为 forward
    const direction: NavigationDirection =
      delta < 0 ? NavigationDirection.back : NavigationDirection.forward
    // go之后所处的position：Math.min(position + delta, queue.length - 1)保证了position<=queue.length - 1, 如果position + delta超出了数组最大索引，就取最大索引
    // Math.max(0, Math.min(position + delta, queue.length - 1))进一步保证了position>=0，如果position + delta < 0, 则取0
    position = Math.max(0, Math.min(position + delta, queue.length - 1))
    // 根据shouldTrigger决定是否触发监听函数
    if (shouldTrigger) {
      triggerListeners(this.location, from, {
        direction,
        delta,
      })
    }
  }
  ```

## 下篇

第一篇主要就是构建三种路由模式的源码，下一篇对应了源码中的`createRouterMatcher`

