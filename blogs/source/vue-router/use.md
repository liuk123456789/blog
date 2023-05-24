---
title: vue-router 第六篇
date: 2023-05-24
categories: 
 - 源码解读
tags:
 - vue router
sidebar: auto
---

## 1. 前言

这一篇主要涉及到的就是`useRouter useRoute useLink`的使用

## 2. useRouter&useRoute

```typescript
// useRouter和useRoute都是使用inject来进行获取对应值。对应值都是在install过程中注入的（参考第五篇的install）

export function useRouter(): Router {
  return inject(routerKey)!
}

export function useRoute(): RouteLocationNormalizedLoaded {
  return inject(routeLocationKey)!
}
```

## 3. useLink

```typescript
// TODO: we could allow currentRoute as a prop to expose `isActive` and
// `isExactActive` behavior should go through an RFC
export function useLink(props: UseLinkOptions) {
  // 路由实例
  const router = inject(routerKey)!
  // 当前路由对象
  const currentRoute = inject(routeLocationKey)!
  // 跳转的目标路由信息
  const route = computed(() => router.resolve(unref(props.to)))

  // 被激活的目标索引
  const activeRecordIndex = computed<number>(() => {
    const { matched } = route.value
    const { length } = matched
    // 匹配的完整路由
    const routeMatched: RouteRecord | undefined = matched[length - 1]
    const currentMatched = currentRoute.matched
    // 未匹配或者当前路由也未匹配到的话，返回-1
    if (!routeMatched || !currentMatched.length) return -1
    // 当前路由匹配项中查找目标路由
    const index = currentMatched.findIndex(
      isSameRouteRecord.bind(null, routeMatched)
    )
    if (index > -1) return index
    // 目标路由匹配到的路由的父路由的path（如果父路由是由别名产生，取源路由的path）
    const parentRecordPath = getOriginalPath(
      matched[length - 2] as RouteRecord | undefined
    )
    return (
      // we are dealing with nested routes
      length > 1 &&
		// 如果父路由和匹配的路由具有相同的路径，则此链接指的是空的子路由
        getOriginalPath(routeMatched) === parentRecordPath &&
        // 避免子路由和父路由进行比对
        currentMatched[currentMatched.length - 1].path !== parentRecordPath
        ? currentMatched.findIndex(
            isSameRouteRecord.bind(null, matched[length - 2])
          )
        : index
    )
  })
  // 当前router-link是否处于激活状态，activeRecordIndex大于-1并且，当前路由的params与目标路由的params相同
  const isActive = computed<boolean>(
    () =>
      activeRecordIndex.value > -1 &&
      includesParams(currentRoute.params, route.value.params)
  )
  // 是否完全匹配，目标路由必须和当前路由所匹配到的路由最后一个相同
  const isExactActive = computed<boolean>(
    () =>
      activeRecordIndex.value > -1 &&
      activeRecordIndex.value === currentRoute.matched.length - 1 &&
      isSameRouteLocationParams(currentRoute.params, route.value.params)
  )
  // 利用push/replace 完成跳转
  function navigate(
    e: MouseEvent = {} as MouseEvent
  ): Promise<void | NavigationFailure> {
    if (guardEvent(e)) {
      return router[unref(props.replace) ? 'replace' : 'push'](
        unref(props.to)
        // avoid uncaught errors are they are logged anyway
      ).catch(noop)
    }
    return Promise.resolve()
  }

  // devtools only
  if ((__DEV__ || __FEATURE_PROD_DEVTOOLS__) && isBrowser) {
    const instance = getCurrentInstance()
    if (instance) {
      const linkContextDevtools: UseLinkDevtoolsContext = {
        route: route.value,
        isActive: isActive.value,
        isExactActive: isExactActive.value,
      }

      // @ts-expect-error: this is internal
      instance.__vrl_devtools = instance.__vrl_devtools || []
      // @ts-expect-error: this is internal
      instance.__vrl_devtools.push(linkContextDevtools)
      watchEffect(
        () => {
          linkContextDevtools.route = route.value
          linkContextDevtools.isActive = isActive.value
          linkContextDevtools.isExactActive = isExactActive.value
        },
        { flush: 'post' }
      )
    }
  }

  /**
   * NOTE: update {@link _RouterLinkI}'s `$slots` type when updating this
   */
  return {
    route,
    href: computed(() => route.value.href),
    isActive,
    isExactActive,
    navigate,
  }
}
```

## 3. RouterView

```typescript
export const RouterView = RouterViewImpl as unknown as {
  new (): {
    $props: AllowedComponentProps &
      ComponentCustomProps &
      VNodeProps &
      RouterViewProps

    $slots: {
      default?: ({
        Component,
        route,
      }: {
        Component: VNode
        route: RouteLocationNormalizedLoaded
      }) => VNode[]
    }
  }
}
```

首先看下`RouterViewImpl`的代码

### RouterViewImpl

```typescript
// /*#__PURE__*/ 主要是tree-shaking ，意思是这个函数是纯函数，
// 如果未使用，打包时会进行tree-shaking

export const RouterViewImpl = /*#__PURE__*/ defineComponent({
  name: 'RouterView',
  // #674 we manually inherit them
  inheritAttrs: false,
  props: {
    // 如果设置了name，渲染对应路由配置下中components下的相应组件  
    name: {
      type: String as PropType<string>,
      default: 'default',
    },
    route: Object as PropType<RouteLocationNormalizedLoaded>,
  },

  // Better compat for @vue/compat users
  // https://github.com/vuejs/router/issues/1315
  compatConfig: { MODE: 3 },

  setup(props, { attrs, slots }) {
    // 如果<router-view>的父节点是<keep-alive>或<transition>进行提示
    __DEV__ && warnDeprecatedUsage()

    // 当前路由  
    const injectedRoute = inject(routerViewLocationKey)!
    // 要展示的路由，优先取props.route
    const routeToDisplay = computed<RouteLocationNormalizedLoaded>(
      () => props.route || injectedRoute.value
    )
    // router-view的深度，从0开始
    const injectedDepth = inject(viewDepthKey, 0)
    // 匹配到的路由
    const depth = computed<number>(() => {
      let initialDepth = unref(injectedDepth)
      const { matched } = routeToDisplay.value
      let matchedRoute: RouteLocationMatched | undefined
      while (
        (matchedRoute = matched[initialDepth]) &&
        !matchedRoute.components
      ) {
        initialDepth++
      }
      return initialDepth
    })
    const matchedRouteRef = computed<RouteLocationMatched | undefined>(
      () => routeToDisplay.value.matched[depth.value]
    )

    provide(
      viewDepthKey,
      computed(() => depth.value + 1)
    )
    provide(matchedRouteKey, matchedRouteRef)
    provide(routerViewLocationKey, routeToDisplay)

    const viewRef = ref<ComponentPublicInstance>()

    // watch at the same time the component instance, the route record we are
    // rendering, and the name
    watch(
      () => [viewRef.value, matchedRouteRef.value, props.name] as const,
      ([instance, to, name], [oldInstance, from, oldName]) => {
        if (to) {
          // 当导航到一个新的路由，更新组件实例
          to.instances[name] = instance
          // 组件实例被应用于不同路由
          if (from && from !== to && instance && instance === oldInstance) {
            if (!to.leaveGuards.size) {
              to.leaveGuards = from.leaveGuards
            }
            if (!to.updateGuards.size) {
              to.updateGuards = from.updateGuards
            }
          }
        }

        // 触发beforeRouteEnter next回调
        if (
          instance &&
          to &&
          // if there is no instance but to and from are the same this might be
          // the first visit
          (!from || !isSameRouteRecord(to, from) || !oldInstance)
        ) {
          ;(to.enterCallbacks[name] || []).forEach(callback =>
            callback(instance)
          )
        }
      },
      { flush: 'post' }
    )

    return () => {
      const route = routeToDisplay.value
      const currentName = props.name
      const matchedRoute = matchedRouteRef.value
      // 需要展示的路由
      const ViewComponent =
        matchedRoute && matchedRoute.components![currentName]

      if (!ViewComponent) {
        return normalizeSlot(slots.default, { Component: ViewComponent, route })
      }

      // 路由中的定义的props
      const routePropsOption = matchedRoute.props[currentName]
      // 如果routePropsOption为空，取null
      // 如果routePropsOption为true，取route.params
      // 如果routePropsOption是函数，取函数返回值
      // 其他情况取routePropsOption
      const routeProps = routePropsOption
        ? routePropsOption === true
          ? route.params
          : typeof routePropsOption === 'function'
          ? routePropsOption(route)
          : routePropsOption
        : null
      // 当组件实例被卸载时，删除组件实例以防止泄露
      const onVnodeUnmounted: VNodeProps['onVnodeUnmounted'] = vnode => {
        // remove the instance reference to prevent leak
        if (vnode.component!.isUnmounted) {
          matchedRoute.instances[currentName] = null
        }
      }
	  // 生成组件
      const component = h(
        ViewComponent,
        assign({}, routeProps, attrs, {
          onVnodeUnmounted,
          ref: viewRef,
        })
      )

      if (
        (__DEV__ || __FEATURE_PROD_DEVTOOLS__) &&
        isBrowser &&
        component.ref
      ) {
        // TODO: can display if it's an alias, its props
        const info: RouterViewDevtoolsContext = {
          depth: depth.value,
          name: matchedRoute.name,
          path: matchedRoute.path,
          meta: matchedRoute.meta,
        }

        const internalInstances = isArray(component.ref)
          ? component.ref.map(r => r.i)
          : [component.ref.i]

        internalInstances.forEach(instance => {
          // @ts-expect-error
          instance.__vrv_devtools = info
        })
      }

      return (
        // 有默认插槽则使用默认默认插槽，否则直接使用component
        normalizeSlot(slots.default, { Component: component, route }) ||
        component
      )
    }
  },
})
```

## 4. RouterLink

```typescript
export const RouterLink: _RouterLinkI = RouterLinkImpl as any

export const RouterLinkImpl = /*#__PURE__*/ defineComponent({
  name: 'RouterLink',
  compatConfig: { MODE: 3 },
  props: {
    to: {
      type: [String, Object] as PropType<RouteLocationRaw>,
      required: true,
    },
    // 决定是否调用router.push()还是router.replace()  
    replace: Boolean,
    // 链接被激活时，用于渲染a标签的class
    activeClass: String,
    // 链接精准激活时，用于渲染a标签的class
    exactActiveClass: String,
    // 是否不应该将内容包裹在<a/>标签中
    custom: Boolean,
    // 传递给aria-current属性的值
    ariaCurrentValue: {
      type: String as PropType<RouterLinkProps['ariaCurrentValue']>,
      default: 'page',
    },
  },

  useLink,

  setup(props, { slots }) {
    // 使用useLink创建router-link所需的一些属性和行为  
    const link = reactive(useLink(props))
    // createRouter时传入的options
    const { options } = inject(routerKey)!

    const elClass = computed(() => ({
      [getLinkClass(
        props.activeClass,
        options.linkActiveClass,
        'router-link-active'
      )]: link.isActive,
      // [getLinkClass(
      //   props.inactiveClass,
      //   options.linkInactiveClass,
      //   'router-link-inactive'
      // )]: !link.isExactActive,
      [getLinkClass(
        props.exactActiveClass,
        options.linkExactActiveClass,
        'router-link-exact-active'
      )]: link.isExactActive,
    }))

    return () => {
      // 默认插槽  
      const children = slots.default && slots.default(link)
      // 如果设置了props.custom，直接显示chldren，反之需要使用a标签包裹
      return props.custom
        ? children
        : h(
            'a',
            {
              'aria-current': link.isExactActive
                ? props.ariaCurrentValue
                : null,
              href: link.href,
              // this would override user added attrs but Vue will still add
              // the listener, so we end up triggering both
              onClick: link.navigate,
              class: elClass.value,
            },
            children
          )
    }
  },
})
```

