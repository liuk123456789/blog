---
title: vue-router
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

## 2. 入口

三种路由模式

```typescript
export { createWebHistory } from './history/html5'
export { createMemoryHistory } from './history/memory'
export { createWebHashHistory } from './history/hash'
```

三种分别对应`history`、`memory(用于ssr)`、`hash`创建路由的方式

先看下三种方法

## 3. createWebHistory

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

   **二次封装的location**

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

   创建完`historyNavigation`、`historyListeners`之后，紧跟着声明一个go函数。该函数接收两个变量：`delta`历史记录移动的步数，`triggerListeners`是否触发监听。

4. 最后创建一个`routerHistory`对象，并将其返回。

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

