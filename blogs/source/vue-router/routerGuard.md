---
title: vue-router 第五篇
date: 2023-05-24
categories: 
 - 源码解读
tags:
 - vue router
sidebar: auto
---

## 1. 路由守卫的相关

- `beforeEach`：在任何导航之前执行。返回一个删除已注册导航守卫的函数。
- `beforeResolve`：在导航解析之前执行。返回一个删除已注册导航守卫的函数。
- `afterEach`：在任何导航之后执行。返回一个删除已注册导航守卫的函数

使用如下

```typescript
const router = createRouter({ // ...})

router.beforeEach({ // ... })
router.beforeResolve({ //... })
router.afterEach({ //... })
```

## 2. 实现路由守卫

全局路由守卫就是通过维护一个数组实现的，核心的方法就是之前提到过的`useCallbacks`的函数可以创建一个可以重置的列表

```typescript
const beforeGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
const beforeResolveGuards = useCallbacks<NavigationGuardWithThis<undefined>>()
const afterGuards = useCallbacks<NavigationHookAfter>()

const router = {
    //...
    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add
}
```

看下`NavigationGuardWithThis`的类型参数

```typescript
export interface NavigationGuardWithThis<T> {
  (
    this: T,
    to: RouteLocationNormalized,
    from: RouteLocationNormalized,
    next: NavigationGuardNext
  ): NavigationGuardReturn | Promise<NavigationGuardReturn>
}
```

## 3. useCallbacks

```typescript
/**
 * Create a list of callbacks that can be reset. Used to create before and after navigation guards list
 */
export function useCallbacks<T>() {
  let handlers: T[] = []

  function add(handler: T): () => void {
    handlers.push(handler)
    return () => {
      const i = handlers.indexOf(handler)
      if (i > -1) handlers.splice(i, 1)
    }
  }

  function reset() {
    handlers = []
  }

  return {
    add,
    list: () => handlers,
    reset,
  }
}

```

值得注意的就是`add`方法，通过闭包，返回一个删除事件处理函数（handler）

## 4. onError相关

添加一个错误处理器，它会在每次导航遇到未被捕获的错误出现时被调用。其中包括同步和异步被抛出的错误、在任何导航守卫中返回或传入 `next` 的错误、尝试解析一个需要渲染路由的异步组件时发生的错误。

```typescript
export type _ErrorHandler = (
  error: any,
  to: RouteLocationNormalized,
  from: RouteLocationNormalizedLoaded
) => any

let errorHandlers = useCallbacks<_ErrorHandler>()

const router:Router = {
    onError: errorHhandlers.add
}
```

## 5. isReady相关

```typescript
let readyHandlers = useCallbacks<OnReadyCallback>()

function isReady(): Promise<void> {
    // ready为true并且当前路由不是初始路由，导航已经初始化完毕，立即解析promise
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
      return Promise.resolve()
    return new Promise((resolve, reject) => {
      // 将resolve、reject存入一个列表
      readyHandlers.add([resolve, reject])
    })
}
```

在之前解析的`push`过程中，无论过程中是否有错误信息，都会执行一个`markAsReady`函数。在`markAsReady`中会将`isReady`处理函数进行触发，触发完毕后，会将列表清空。

```typescript
function markAsReady<E = any>(err?: E): E | void {
  if (!ready) {
    // 如果存在err，说明还未准备好，如果不存在err，那么说明初始化导航已经完成，ready变为true，之后就不会再进入这个分支
    ready = !err
    // 设置popstate监听函数
    setupListeners()
    // 触发ready处理函数，有错误执行reject(err)，没有执行resolve()
    readyHandlers
      .list()
      .forEach(([resolve, reject]) => (err ? reject(err) : resolve()))
    // 执行完，清空列表
    readyHandlers.reset()
  }
  return err
}
```

## 6. install

```typescript
install(app: App) {
      const router = this
      // 注册RouterLink 和 RouterView 为全局组件
      app.component('RouterLink', RouterLink)
      app.component('RouterView', RouterView)
	  // 定义全局属性
      app.config.globalProperties.$router = router
      // 默认为当前路由实例对象
      Object.defineProperty(app.config.globalProperties, '$route', {
        enumerable: true,
        get: () => unref(currentRoute),
      })

      // this initial navigation is only necessary on client, on server it doesn't
      // make sense because it will create an extra unnecessary navigation and could
      // lead to problems
      if (
        isBrowser &&
        // used for the initial navigation client side to avoid pushing
        // multiple times when the router is used in multiple apps
        !started &&
        currentRoute.value === START_LOCATION_NORMALIZED
      ) {
        // see above
        started = true
        push(routerHistory.location).catch(err => {
          if (__DEV__) warn('Unexpected error when starting the router:', err)
        })
      }

      const reactiveRoute = {} as {
        [k in keyof RouteLocationNormalizedLoaded]: ComputedRef<
          RouteLocationNormalizedLoaded[k]
        >
      }
      for (const key in START_LOCATION_NORMALIZED) {
        // @ts-expect-error: the key matches
        reactiveRoute[key] = computed(() => currentRoute.value[key])
      }
      // 这里使用provide又将router、currentRoute注入到app实例中，你可能会疑问，在前面过程中已经可以	  // 在组件中使用this.$router、this.$route获取到对应数据了，这里为什么又使用provide再次注入呢？       // 这是因为在setup中式无法访问this的，这时通过inject就可以方便获取router及currentRoute。

      app.provide(routerKey, router)
      app.provide(routeLocationKey, reactive(reactiveRoute))
      app.provide(routerViewLocationKey, currentRoute)

      const unmountApp = app.unmount
      installedApps.add(app)
      app.unmount = function () {
        installedApps.delete(app)
        // the router is not attached to an app anymore
        if (installedApps.size < 1) {
          // invalidate the current navigation
          pendingLocation = START_LOCATION_NORMALIZED
          removeHistoryListener && removeHistoryListener()
          removeHistoryListener = null
          currentRoute.value = START_LOCATION_NORMALIZED
          started = false
          ready = false
        }
        unmountApp()
      }

      // TODO: this probably needs to be updated so it can be used by vue-termui
      if ((__DEV__ || __FEATURE_PROD_DEVTOOLS__) && isBrowser) {
        addDevtools(app, router, matcher)
      }
}
```

