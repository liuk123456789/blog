---
title: vue-router 第三篇
date: 2023-05-22
categories: 
 - 源码解读
tags:
 - vue router
sidebar: auto
---

## 1. 参数&返回值

- 参数

  **RouterOptions**

  类型

  ```typescript
  /**
   * Options to initialize a {@link Router} instance.
   */
  export interface RouterOptions extends PathParserOptions {
    /**
     * History implementation used by the router. Most web applications should use
     * `createWebHistory` but it requires the server to be properly configured.
     * You can also use a _hash_ based history with `createWebHashHistory` that
     * does not require any configuration on the server but isn't handled at all
     * by search engines and does poorly on SEO.
     *
     * @example
     * ```js
     * createRouter({
     *   history: createWebHistory(),
     *   // other options...
     * })
     * ```
     */
    history: RouterHistory
    /**
     * Initial list of routes that should be added to the router.
     */
    routes: Readonly<RouteRecordRaw[]>
    /**
     * Function to control scrolling when navigating between pages. Can return a
     * Promise to delay scrolling. Check {@link ScrollBehavior}.
     *
     * @example
     * ```js
     * function scrollBehavior(to, from, savedPosition) {
     *   // `to` and `from` are both route locations
     *   // `savedPosition` can be null if there isn't one
     * }
     * ```
     */
    scrollBehavior?: RouterScrollBehavior
    /**
     * Custom implementation to parse a query. See its counterpart,
     * {@link RouterOptions.stringifyQuery}.
     *
     * @example
     * Let's say you want to use the [qs package](https://github.com/ljharb/qs)
     * to parse queries, you can provide both `parseQuery` and `stringifyQuery`:
     * ```js
     * import qs from 'qs'
     *
     * createRouter({
     *   // other options...
     *   parseQuery: qs.parse,
     *   stringifyQuery: qs.stringify,
     * })
     * ```
     */
    parseQuery?: typeof originalParseQuery
    /**
     * Custom implementation to stringify a query object. Should not prepend a leading `?`.
     * {@link RouterOptions.parseQuery | parseQuery} counterpart to handle query parsing.
     */
    stringifyQuery?: typeof originalStringifyQuery
    /**
     * Default class applied to active {@link RouterLink}. If none is provided,
     * `router-link-active` will be applied.
     */
    linkActiveClass?: string
    /**
     * Default class applied to exact active {@link RouterLink}. If none is provided,
     * `router-link-exact-active` will be applied.
     */
    linkExactActiveClass?: string
    /**
     * Default class applied to non-active {@link RouterLink}. If none is provided,
     * `router-link-inactive` will be applied.
     */
    // linkInactiveClass?: string
  }
  ```

- 返回值 路由实例

  **Router**

  类型

  ```typescript
  /**
   * Router instance.
   */
  export interface Router {
    /**
     * @internal
     */
    // readonly history: RouterHistory
    /**
     * Current {@link RouteLocationNormalized}
     */
    readonly currentRoute: Ref<RouteLocationNormalizedLoaded>
    /**
     * Original options object passed to create the Router
     */
    readonly options: RouterOptions
  
    /**
     * Allows turning off the listening of history events. This is a low level api for micro-frontends.
     */
    listening: boolean
  
    /**
     * Add a new {@link RouteRecordRaw | route record} as the child of an existing route.
     *
     * @param parentName - Parent Route Record where `route` should be appended at
     * @param route - Route Record to add
     */
    addRoute(parentName: RouteRecordName, route: RouteRecordRaw): () => void
    /**
     * Add a new {@link RouteRecordRaw | route record} to the router.
     *
     * @param route - Route Record to add
     */
    addRoute(route: RouteRecordRaw): () => void
    /**
     * Remove an existing route by its name.
     *
     * @param name - Name of the route to remove
     */
    removeRoute(name: RouteRecordName): void
    /**
     * Checks if a route with a given name exists
     *
     * @param name - Name of the route to check
     */
    hasRoute(name: RouteRecordName): boolean
    /**
     * Get a full list of all the {@link RouteRecord | route records}.
     */
    getRoutes(): RouteRecord[]
  
    /**
     * Returns the {@link RouteLocation | normalized version} of a
     * {@link RouteLocationRaw | route location}. Also includes an `href` property
     * that includes any existing `base`. By default, the `currentLocation` used is
     * `router.currentRoute` and should only be overridden in advanced use cases.
     *
     * @param to - Raw route location to resolve
     * @param currentLocation - Optional current location to resolve against
     */
    resolve(
      to: RouteLocationRaw,
      currentLocation?: RouteLocationNormalizedLoaded
    ): RouteLocation & { href: string }
  
    /**
     * Programmatically navigate to a new URL by pushing an entry in the history
     * stack.
     *
     * @param to - Route location to navigate to
     */
    push(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
  
    /**
     * Programmatically navigate to a new URL by replacing the current entry in
     * the history stack.
     *
     * @param to - Route location to navigate to
     */
    replace(to: RouteLocationRaw): Promise<NavigationFailure | void | undefined>
  
    /**
     * Go back in history if possible by calling `history.back()`. Equivalent to
     * `router.go(-1)`.
     */
    back(): ReturnType<Router['go']>
    /**
     * Go forward in history if possible by calling `history.forward()`.
     * Equivalent to `router.go(1)`.
     */
    forward(): ReturnType<Router['go']>
    /**
     * Allows you to move forward or backward through the history. Calls
     * `history.go()`.
     *
     * @param delta - The position in the history to which you want to move,
     * relative to the current page
     */
    go(delta: number): void
  
    /**
     * Add a navigation guard that executes before any navigation. Returns a
     * function that removes the registered guard.
     *
     * @param guard - navigation guard to add
     */
    beforeEach(guard: NavigationGuardWithThis<undefined>): () => void
    /**
     * Add a navigation guard that executes before navigation is about to be
     * resolved. At this state all component have been fetched and other
     * navigation guards have been successful. Returns a function that removes the
     * registered guard.
     *
     * @example
     * ```js
     * router.beforeResolve(to => {
     *   if (to.meta.requiresAuth && !isAuthenticated) return false
     * })
     * ```
     *
     * @param guard - navigation guard to add
     */
    beforeResolve(guard: NavigationGuardWithThis<undefined>): () => void
    /**
     * Add a navigation hook that is executed after every navigation. Returns a
     * function that removes the registered hook.
     *
     * @example
     * ```js
     * router.afterEach((to, from, failure) => {
     *   if (isNavigationFailure(failure)) {
     *     console.log('failed navigation', failure)
     *   }
     * })
     * ```
     *
     * @param guard - navigation hook to add
     */
    afterEach(guard: NavigationHookAfter): () => void
  
    /**
     * Adds an error handler that is called every time a non caught error happens
     * during navigation. This includes errors thrown synchronously and
     * asynchronously, errors returned or passed to `next` in any navigation
     * guard, and errors occurred when trying to resolve an async component that
     * is required to render a route.
     *
     * @param handler - error handler to register
     */
    onError(handler: _ErrorHandler): () => void
    /**
     * Returns a Promise that resolves when the router has completed the initial
     * navigation, which means it has resolved all async enter hooks and async
     * components that are associated with the initial route. If the initial
     * navigation already happened, the promise resolves immediately.
     *
     * This is useful in server-side rendering to ensure consistent output on both
     * the server and the client. Note that on server side, you need to manually
     * push the initial location while on client side, the router automatically
     * picks it up from the URL.
     */
    isReady(): Promise<void>
  
    /**
     * Called automatically by `app.use(router)`. Should not be called manually by
     * the user. This will trigger the initial navigation when on client side.
     *
     * @internal
     * @param app - Application that uses the router
     */
    install(app: App): void
  }
  ```

## 2. 辅助工具函数/参数处理等

```typescript
import {
  parseQuery as originalParseQuery,
  stringifyQuery as originalStringifyQuery
} from './query'

export function createRouter(options:RouterOptions):Router {
    const matcher = createRouterMatcher(options.router, options)
    const parseQuery = options.parseQuery || originalParseQuery
    const stringifyQuery = options.stringifyQuery || originalStringifyQuery
    const routerHistory = options.history
    // 省略部分代码
}
```

1. matcher: 在第二篇中已经讲过，可以参考

2. originalParseQuery代码如下: 

   **路由参数?key=value&key1=value1格式解析为key/value形式**

   ```typescript
   /**
    * Transforms a queryString into a {@link LocationQuery} object. Accept both, a
    * version with the leading `?` and without Should work as URLSearchParams
   
    * @internal
    *
    * @param search - search string to parse
    * @returns a query object
    */
   export function parseQuery(search: string): LocationQuery {
     const query: LocationQuery = {}
     // 为了避免后续的split('&')空对象，所以这里前置判定
     if (search === '' || search === '?') return query
     const hasLeadingIM = search[0] === '?'
     const searchParams = (hasLeadingIM ? search.slice(1) : search).split('&')
     for (let i = 0; i < searchParams.length; ++i) {
       // 将+替换为' '，参考格式如a+b=c+d => { a b: c d }
       const searchParam = searchParams[i].replace(PLUS_RE, ' ')
       // 查找'='
       const eqPos = searchParam.indexOf('=')
       const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos))
       const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1))
   
       if (key in query) {
         // 此场景对应如下: e=%&e=%25
         let currentValue = query[key]
         if (!isArray(currentValue)) {
           currentValue = query[key] = [currentValue]
         }
         // we force the modification
         ;(currentValue as LocationQueryValue[]).push(value)
       } else {
         query[key] = value
       }
     }
     return query
   }
   ```

3. originalStringifyQuery: 

   **key/value 参数格式转化为路由参数格式key=value&key1=value1**

   ```typescript
   /**
    * Stringifies a {@link LocationQueryRaw} object. Like `URLSearchParams`, it
    * doesn't prepend a `?`
    *
    * @internal
    *
    * @param query - query object to stringify
    * @returns string version of the query without the leading `?`
    */
   export function stringifyQuery(query: LocationQueryRaw): string {
     let search = ''
     for (let key in query) {
       const value = query[key]
       key = encodeQueryKey(key)
       if (value == null) {
         // only null adds the value
         if (value !== undefined) {
           search += (search.length ? '&' : '') + key
         }
         continue
       }
       // keep null values
       const values: LocationQueryValueRaw[] = isArray(value)
         ? value.map(v => v && encodeQueryValue(v))
         : [value && encodeQueryValue(value)]
   
       values.forEach(value => {
         // skip undefined values in arrays as if they were not present
         // smaller code than using filter
         if (value !== undefined) {
           // only append & with non-empty search
           search += (search.length ? '&' : '') + key
           if (value != null) search += '=' + value
         }
       })
     }
   
     return search
   }
   ```

4. useCallbacks

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

   - add：将`handlers`添加进数组中，同时返回一个删除`handler`的方法
   - list：返回`handlers`的数组
   - reset： 重置`handlers`数组

5. applyToParams

   ```typescript
   export function applyToParams(
     fn: (v: string | number | null | undefined) => string,
     params: RouteParamsRaw | undefined
   ): RouteParams {
     const newParams: RouteParams = {}
   
     for (const key in params) {
       const value = params[key]
       newParams[key] = isArray(value)
         ? value.map(fn)
         : fn(value as Exclude<RouteParamValueRaw, any[]>)
     }
   
     return newParams
   }
   ```

   使用到的地方

   ```typescript
   // 因为使用到了bind，所以说下，bind会返回函数，所以后面才会normalizeParams(decodeParams(matchedRoute.params))这种方式调用，其中decodeParams(matchedRoute.params)对应了applyToParams的第二个参数
   const normalizeParams = applyToParams.bind(
   	null,
   	paramValue => '' + paramValue // 类型转为字符串
   )
   
   // 编码
   const encodeParams = applyToParams.bind(null, encodeParam)
   
   // 解码
   const decodeParams: (params: RouteParams | undefined) => RouteParams =
       // @ts-expect-error: intentionally avoid the type check
       applyToParams.bind(null, decode)
   ```

6. 

## 4. addRoute

```typescript
function addRoute(
    parentOrRoute: RouteRecordName | RouteRecordRaw,
    route?: RouteRecordRaw
    ) {
    let parent: Parameters<(typeof matcher)['addRoute']>[1] | undefined
    let record: RouteRecordRaw
    if (isRouteName(parentOrRoute)) {
      parent = matcher.getRecordMatcher(parentOrRoute)
      record = route!
    } else {
      record = parentOrRoute
    }
	
    return matcher.addRoute(record, parent)
}
```

1. 判定下`parentOrRoute`是否是路由名称，那么添加的是嵌套路由
2. 如果不是，那么为非嵌套路由

## 5. removeRoute

```typescript
function removeRoute(name: RouteRecordName) {
    // 根据路由名称匹配出对应的matcher
    const recordMatcher = matcher.getRecordMatcher(name)
    if (recordMatcher) {
      // matcher删除对应的matcher
      matcher.removeRoute(recordMatcher)
    } else if (__DEV__) {
      warn(`Cannot remove non-existent route "${String(name)}"`)
    }
}

```

## 6. getRoutes

```typescript
function getRoutes() {
    // 获取路由记录从routeMatcher中
    return matcher.getRoutes().map(routeMatcher => routeMatcher.record)
}
```

## 7. hasRoute

```typescript
function hasRoute(name: RouteRecordName): boolean {
	return !!matcher.getRecordMatcher(name)
}
```

用于判定路由是否存在，这里传参需要注意的是，必须传递路由名称

## 8. resolve

代码相对复杂，所以我们一步步分析

```typescript
function resolve(
    rawLocation: Readonly<RouteLocationRaw>,
    currentLocation?: RouteLocationNormalizedLoaded
  ): RouteLocation & { href: string } {
	// currentLocation不传的话，默认读取根路径的record
    currentLocation = assign({}, currentLocation || currentRoute.value)
    if (typeof rawLocation === 'string') {
      const locationNormalized = parseURL(
        parseQuery,
        rawLocation,
        currentLocation.path
      )
      const matchedRoute = matcher.resolve(
        { path: locationNormalized.path },
        currentLocation
      )

      const href = routerHistory.createHref(locationNormalized.fullPath)
      if (__DEV__) {
        if (href.startsWith('//'))
          warn(
            `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
          )
        else if (!matchedRoute.matched.length) {
          warn(`No match found for location with path "${rawLocation}"`)
        }
      }

      // locationNormalized is always a new object
      return assign(locationNormalized, matchedRoute, {
        params: decodeParams(matchedRoute.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: undefined,
        href,
      })
    }

    let matcherLocation: MatcherLocationRaw

    // path could be relative in object as well
    if ('path' in rawLocation) {
      if (
        __DEV__ &&
        'params' in rawLocation &&
        !('name' in rawLocation) &&
        // @ts-expect-error: the type is never
        Object.keys(rawLocation.params).length
      ) {
        warn(
          `Path "${rawLocation.path}" was passed with params but they will be ignored. Use a named route alongside params instead.`
        )
      }
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery, rawLocation.path, currentLocation.path).path,
      })
    } else {
      // remove any nullish param
      const targetParams = assign({}, rawLocation.params)
      for (const key in targetParams) {
        if (targetParams[key] == null) {
          delete targetParams[key]
        }
      }
      // pass encoded values to the matcher, so it can produce encoded path and fullPath
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(targetParams),
      })
      // current location params are decoded, we need to encode them in case the
      // matcher merges the params
      currentLocation.params = encodeParams(currentLocation.params)
    }

    const matchedRoute = matcher.resolve(matcherLocation, currentLocation)
    const hash = rawLocation.hash || ''

    if (__DEV__ && hash && !hash.startsWith('#')) {
      warn(
        `A \`hash\` should always start with the character "#". Replace "${hash}" with "#${hash}".`
      )
    }

    // the matcher might have merged current location params, so
    // we need to run the decoding again
    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params))

    const fullPath = stringifyURL(
      stringifyQuery,
      assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path,
      })
    )

    const href = routerHistory.createHref(fullPath)
    if (__DEV__) {
      if (href.startsWith('//')) {
        warn(
          `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
        )
      } else if (!matchedRoute.matched.length) {
        warn(
          `No match found for location with path "${
            'path' in rawLocation ? rawLocation.path : rawLocation
          }"`
        )
      }
    }

    return assign(
      {
        fullPath,
        // keep the hash encoded so fullPath is effectively path + encodedQuery +
        // hash
        hash,
        query:
          // if the user is using a custom query lib like qs, we might have
          // nested objects, so we keep the query as is, meaning it can contain
          // numbers at `$route.query`, but at the point, the user will have to
          // use their own type anyway.
          // https://github.com/vuejs/router/issues/328#issuecomment-649481567
          stringifyQuery === originalStringifyQuery
            ? normalizeQuery(rawLocation.query)
            : ((rawLocation.query || {}) as LocationQuery),
      },
      matchedRoute,
      {
        redirectedFrom: undefined,
        href,
      }
    )
}
```

### **rawLocation**类型是字符串

1. `rawLocation`类型是字符串时，通过`parseURL`格式化下URL，看下`parseURL`的代码

   **parseURL**

   ```typescript
   export function parseURL(
     parseQuery: (search: string) => LocationQuery,
     location: string,
     currentLocation: string = '/'
   ): LocationNormalized {
     let path: string | undefined,
       query: LocationQuery = {},
       searchString = '',
       hash = ''
   
     // hash # 位置
     const hashPos = location.indexOf('#')
     // 参数 ? 位置
     let searchPos = location.indexOf('?')
     if (hashPos < searchPos && hashPos >= 0) {
       searchPos = -1
     }
     
     if (searchPos > -1) {
        // 截取?之前的参数 如：foo?f=foo#hash
        // 结果：path: foo searchString: f=foo
       path = location.slice(0, searchPos)
       // 搜索参数  
       searchString = location.slice(
         searchPos + 1,
         hashPos > -1 ? hashPos : location.length
       )
   	// parseQuery格式化路由参数,栗子如下
       // ?e=%&e=23 => { e: [%, 23] }
       // ?id=1&name='zs' => { id: 1, name: 'zs' }
       query = parseQuery(searchString)
     }
   
     if (hashPos > -1) {
       // 兼容此场景 #foo
       path = path || location.slice(0, hashPos)
       // keep the # character
       // hash 值
       hash = location.slice(hashPos, location.length)
     }
   
     // no search and no query
     path = resolveRelativePath(path != null ? path : location, currentLocation)
     // empty path means a relative query or hash `?foo=f`, `#thing`
   
     return {
       fullPath: path + (searchString && '?') + searchString + hash,
       path,
       query,
       hash,
     }
   }
   ```

   **resolveRelativePath相对路径**

   ```typescript
   /**
    * Resolves a relative path that starts with `.`.
    *
    * @param to - path location we are resolving
    * @param from - currentLocation.path, should start with `/`
    */
   export function resolveRelativePath(to: string, from: string): string {
     // to 以/ 开头，那么它已经是相对路径，直接返回 
     if (to.startsWith('/')) return to
     if (__DEV__ && !from.startsWith('/')) {
       warn(
         `Cannot resolve a relative location without an absolute path. Trying to resolve "${to}" from "${from}". It should look like "/${from}".`
       )
       return to
     }
     // 未传递to，那么直接返回from	
     if (!to) return from
     
     const fromSegments = from.split('/')
     const toSegments = to.split('/')
     const lastToSegment = toSegments[toSegments.length - 1]
   
     // make . and ./ the same (../ === .., ../../ === ../..)
     // this is the same behavior as new URL()
     if (lastToSegment === '..' || lastToSegment === '.') {
       toSegments.push('')
     }
   
     let position = fromSegments.length - 1
     let toPosition: number
     let segment: string
   
     for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
       segment = toSegments[toPosition]
   	// 这里需要注意的就是
       // 这个代表统计目录，那么忽略，让toPosition 继续往下
       if (segment === '.') continue
       // 代表上级目录，所以from对应的position 需要指针往前（前提是position > 1）
       if (segment === '..') {
         // we can't go below zero, but we still need to increment toPosition
         if (position > 1) position--
         // continue
       }
       // we reached a non-relative path, we stop here
       else break
     }
   
     return (
       fromSegments.slice(0, position).join('/') +
       '/' +
       toSegments
         // ensure we use at least the last element in the toSegments
         .slice(toPosition - (toPosition === toSegments.length ? 1 : 0))
         .join('/')
     )
   }
   ```

   对应的测试结果，分为四种

   1. `to`为空，返回`from`

      `to='', from='/a/b'`  => `/a/b`

   2. `to`不带`.`/`..`

      `to='c', from='/a/b'` => `/a/c`

   3. `to`带有`.`/`..`

      `to='./c', from='/a/b/'` => `/a/b/c`

      `to='./c', from='/a/b'` => `/a/c`

      `to='../c', from='/a/b'` => `/c`

      `to='../c', from='/a/b/'` => `/a/c`

      `to='../c', from='/a/b/'` => `/a/c`

      `to='../../c', from='/a/b'` => `/c`

      `to='../../c', from='/a/b/'` => `/c`

      `to='../../c', from='/a/b/d'` => `/c`

   4. `to`是以`/`开头的相对路径

      `to='/c', from='/a/b'`=> `/c`

2. 所以`parseURL`结果返回给`locationNormalized`，具体如下

   `parseURL`返回格式如下

   ```typescript
   {
       fullPath: path + (searchString && '?') + searchString + hash,
       path,
       query,
       hash,
   }
   ```

   🌰如下：

   参数：`foo?f=foo#hash`

   结果

   ```typescript
   {
     fullPath: '/foo?f=foo#hash',
     path: '/foo',
     hash: '#hash',
     query: { f: 'foo' }
   }
   ```

3. 通过`path`匹配`matcher`，调用`createHref`，如下

   ```typescript
   export function createHref(base: string, location: HistoryLocation): string {
     return base.replace(BEFORE_HASH_RE, '#') + location
   }
   ```

4. 返回结果

   ```typescript
   return assign(locationNormalized, matchedRoute, {
       params: decodeParams(matchedRoute.params),
       hash: decode(locationNormalized.hash),
       redirectedFrom: undefined,
       href,
   })
   ```

### 'path' in rowLocation 场景

处理`path`为绝对路径

```
matchLocation = assign({}, rawLocation, {
	path: parseURL(parseQuery, rawLocation.path, currentLocation.path).path
})
```

### rowLocation不是字符串，且path不在rawLocation中

```typescript
  // 删除空的参数
  const targetParams = assign({}, rawLocation.params)
  for (const key in targetParams) {
    if (targetParams[key] == null) {
      delete targetParams[key]
    }
  }
  // 对params进行编码
  matcherLocation = assign({}, rawLocation, {
    params: encodeParams(rawLocation.params),
  })
  // 将当前位置的params编码 当前位置的参数被解码，我们需要对它们进行编码以防匹配器合并参数
  currentLocation.params = encodeParams(currentLocation.params)
}
```

生成返回结果

```typescript
// 调用matcher.resolve获取路由相关信息
const matchedRoute = matcher.resolve(matcherLocation, currentLocation)
const hash = rawLocation.hash || ''

// 由于matcher已经合并了当前位置的参数，所以需要进行解码
matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params))

// 生成完整path
const fullPath = stringifyURL(
  stringifyQuery,
  assign({}, rawLocation, {
    hash: encodeHash(hash),
    path: matchedRoute.path,
  })
)
// routerHistory.createHref会删除#之前的任意字符
const href = routerHistory.createHref(fullPath)
if (__DEV__) {
  if (href.startsWith('//')) {
    warn(
      `Location "${rawLocation}" resolved to "${href}". A resolved location cannot start with multiple slashes.`
    )
  } else if (!matchedRoute.matched.length) {
    warn(
      `No match found for location with path "${
        'path' in rawLocation ? rawLocation.path : rawLocation
      }"`
    )
  }
}

return assign(
  {
    fullPath,
    hash,
    query:
    // 如果query是个嵌套对象，normalizeQuery会将嵌套的对象toString，如果用户使用qs等库，我们需要保持query的状态
    // https://github.com/vuejs/router/issues/328#issuecomment-649481567
      stringifyQuery === originalStringifyQuery
        ? normalizeQuery(rawLocation.query)
        : ((rawLocation.query || {}) as LocationQuery),
  },
  matchedRoute,
  {
    redirectedFrom: undefined,
    href,
  }
)
```

## 说明

`push/replace`涉及的东西比较多，所以单独抽出作为下一篇
