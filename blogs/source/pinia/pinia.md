---
title: Pinia 源码解读
date: 2023-03-14
categories: 
 - 源码解读
tags:
 - pinia
sidebar: auto

---

## 1. 版本说明

```text
pinia: 2.0.33
```
## 2. 为什么看Pinia源码

1. 因为Vue3发布两年多的时间，生态较为稳定，而Pinia作为新一代的集中式管理器，友好的支持TS，且兼容vue2、vue3
2. 学习一个Vue插件库是如何完成的，更好的更快的上手Pinia

## 3. 大致流程

  ![pinia-flow](/my-blog/source/pinia_flow.png)

## 4. createPinia

部分代码如下

```typescript
export function createPinia(): Pinia {
    // 创建effect作用于，主要是方便操作watch、watchEffect、computed 这些响应式/副作用，同时可以进行销毁
    const scope = effectScope(true)
    
    // 所有store 对应的state的集合，是一个key value 键值对的ref数据
    const state = scope.run<Ref<Record<string, StateTree>>>(() =>
      // 这里说明state是一个ref， 同时value的类型是StateTree                            
      ref<Record<string, StateTree>>({})
    )!
    
    // markRaw 标记一个对象，让它不会成为响应式对象
    const pinia: Pinia = markRaw({
        // Vue 插件注册
        install(app: App) {
          // this allows calling useStore() outside of a component setup after
          // installing pinia's plugin
          // 设置Pinia实例
          setActivePinia(pinia)
          // Vue3 相对于Vue2的不同处理
          if (!isVue2) {
            pinia._a = app
            // 全局provide
            app.provide(piniaSymbol, pinia)
            // 这种方式可以在组件中getCurrentInstacne这类方式获取pinia
            app.config.globalProperties.$pinia = pinia
            /* istanbul ignore else */
            if (USE_DEVTOOLS) {
              registerPiniaDevtools(app, pinia)
            }
        	// 插件
            toBeInstalled.forEach((plugin) => _p.push(plugin))
            toBeInstalled = []
          }
        },

        use(plugin) {
          if (!this._a && !isVue2) {
            toBeInstalled.push(plugin)
          } else {
            _p.push(plugin)
          }
          return this
        },

        _p, // plugin
        // it's actually undefined here
        // @ts-expect-error
        _a: null, // app Vue实例
        _e: scope, // 作用域对象
        _s: new Map<string, StoreGeneric>(), // store
        state, // store的state的集合
  })
}
```

## 5. defineStore

`Pinia`的核心逻辑在store.ts这个文件内，所以我们一步步来看下，首先看下初始化store的`defineStore`

```typescript
// function overload 函数重载
export function defineStore<
  Id extends string,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  // cannot extends ActionsTree because we loose the typings
  A /* extends ActionsTree */ = {}
>(
  id: Id,
  options: Omit<DefineStoreOptions<Id, S, G, A>, 'id'>
): StoreDefinition<Id, S, G, A>

export function defineStore<
  Id extends string,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  // cannot extends ActionsTree because we loose the typings
  A /* extends ActionsTree */ = {}
>(options: DefineStoreOptions<Id, S, G, A>): StoreDefinition<Id, S, G, A>
    
export function defineStore<Id extends string, SS>(
  id: Id,
  storeSetup: () => SS,
  options?: DefineSetupStoreOptions<
    Id,
    _ExtractStateFromSetupStore<SS>,
    _ExtractGettersFromSetupStore<SS>,
    _ExtractActionsFromSetupStore<SS>
  >
): StoreDefinition<
  Id,
  _ExtractStateFromSetupStore<SS>,
  _ExtractGettersFromSetupStore<SS>,
  _ExtractActionsFromSetupStore<SS>
>
```

`defineStore`使用了函数重载，这样我们可以三种方式初始化store

```typescript
// 第一种 options 风格
const useStore = defineStore('app-store', {
    state: () => ({
        // define some state value
    }),
    getters: {},
    actions: {}
})

// 第二种 options 风格
const useStore = defineStore({
    id: 'app-store',
    state: (): UserState => ({
        // define some state value 
    }),
  getters: {},
  actions: {}
})

// 第三种 compositionApi风格
const useStore = defineStore('app-store', () => {
    const count = ref(0)
    
    const increment = () => {
        count.value++
    }
    
    const decrement = () => {
        count.value--
    }
    return {
        count,
        increment,
        decrement
    }
})
```

`defineStore`返回了一个函数，并且将store的id挂载函数属性上，如下

```typescript
function useStore(pinia?: Pinia | null, hot?: StoreGeneric): StoreGeneric {
    // 获取组件实例
    const currentInstance = getCurrentInstance()
    // 获取pinia实例
    pinia =
      // in test mode, ignore the argument provided as we can always retrieve a
      // pinia instance with getActivePinia()
      (__TEST__ && activePinia && activePinia._testing ? null : pinia) ||
      (currentInstance && inject(piniaSymbol, null))
    if (pinia) setActivePinia(pinia)

    if (__DEV__ && !activePinia) {
      throw new Error(
        `[🍍]: getActivePinia was called with no active Pinia. Did you forget to install pinia?\n` +
          `\tconst pinia = createPinia()\n` +
          `\tapp.use(pinia)\n` +
          `This will fail in production.`
      )
    }

    pinia = activePinia!

    // 因为pinia使用了Map创建Store，所以进行缓存，这里判定缓存是否存在
    // 存在的话，直接返回，否则就创建Store
    if (!pinia._s.has(id)) {
      // creating the store registers it in `pinia._s`
      // compositionApi风格
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia)
      } else {
        // options风格
        createOptionsStore(id, options as any, pinia)
      }

      /* istanbul ignore else */
      if (__DEV__) {
        // @ts-expect-error: not the right inferred type
        useStore._pinia = pinia
      }
    }

    const store: StoreGeneric = pinia._s.get(id)!

    if (__DEV__ && hot) {
      const hotId = '__hot:' + id
      const newStore = isSetupStore
        ? createSetupStore(hotId, setup, options, pinia, true)
        : createOptionsStore(hotId, assign({}, options) as any, pinia, true)

      hot._hotUpdate(newStore)

      // cleanup the state properties and the store from the cache
      delete pinia.state.value[hotId]
      pinia._s.delete(hotId)
    }

    // save stores in instances to access them devtools
    if (
      __DEV__ &&
      IS_CLIENT &&
      currentInstance &&
      currentInstance.proxy &&
      // avoid adding stores that are just built for hot module replacement
      !hot
    ) {
      const vm = currentInstance.proxy
      const cache = '_pStores' in vm ? vm._pStores! : (vm._pStores = {})
      cache[id] = store
    }

    // StoreGeneric cannot be casted towards Store
    return store as any
  }

  useStore.$id = id
```

说明：

1. `createSetupStore`是整个源码最为复杂的一块地方，后面会一行解析
2. 因为`defineStore`返回的是函数（hooks）,所以使用时非常具有`hooks`风格的调用
3. TODO: 源码上还有热更新这块，目前没有去解析这块

## 6. createOptionStore

```typescript
function createOptionsStore<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A extends _ActionsTree
>(
  id: Id,
  options: DefineStoreOptions<Id, S, G, A>,
  pinia: Pinia,
  hot?: boolean
): Store<Id, S, G, A> {
  // 获取配置的state、getters、actions
  const { state, actions, getters } = options
  
  // 因为pinia.state 会包装成ref，所以这里通过pinia.state.value方式获取
  // 原因是，optionStore 最终还是会走到setupStore  源码 196 line
  const initialState: StateTree | undefined = pinia.state.value[id]

  let store: Store<Id, S, G, A>
  // setup 函数，setupStore 会调用这个函数
  function setup() {
    if (!initialState && (!__DEV__ || !hot)) {
      /* istanbul ignore if */
      if (isVue2) {
        set(pinia.state.value, id, state ? state() : {})
      } else {
        pinia.state.value[id] = state ? state() : {}
      }
    }

    // avoid creating a state in pinia.state.value
    // 这里将state进行ref的包装
    const localState =
      __DEV__ && hot
        ? // use ref() to unwrap refs inside state TODO: check if this is still necessary
          toRefs(ref(state ? state() : {}).value)
        : toRefs(pinia.state.value[id])
    // 生成store的model  
    return assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce((computedGetters, name) => {
        if (__DEV__ && name in localState) {
          console.warn(
            `[🍍]: A getter cannot have the same name as another state property. Rename one of them. Found with "${name}" in store "${id}".`
          )
        }
		// getters 使用了computed处理
        computedGetters[name] = markRaw(
          computed(() => {
            setActivePinia(pinia)
            // it was created just before
            const store = pinia._s.get(id)!

            // allow cross using stores
            /* istanbul ignore next */
            if (isVue2 && !store._r) return

            // @ts-expect-error
            // return getters![name].call(context, context)
            // TODO: avoid reading the getter while assigning with a global variable
            return getters![name].call(store, store)
          })
        )
        return computedGetters
      }, {} as Record<string, ComputedRef>)
    )
  }
  // 调用setupStore
  store = createSetupStore(id, setup, options, pinia, hot, true)

  return store as any
}
```

## 7. createSetupStore

```typescript
function createSetupStore<
  Id extends string,
  SS extends Record<any, unknown>,
  S extends StateTree,
  G extends Record<string, _Method>,
  A extends _ActionsTree
>(
  $id: Id,
  setup: () => SS,
  options:
    | DefineSetupStoreOptions<Id, S, G, A>
    | DefineStoreOptions<Id, S, G, A> = {},
  pinia: Pinia,
  hot?: boolean,
  isOptionsStore?: boolean
): Store<Id, S, G, A> {
  // 非空断言，获取effectScope 作用域
  let scope!: EffectScope

  // 插件注入
  const optionsForPlugin: DefineStoreOptionsInPlugin<Id, S, G, A> = assign(
    { actions: {} as A },
    options
  )

  /* istanbul ignore if */
  if (__DEV__ && !pinia._e.active) {
    throw new Error('Pinia destroyed')
  }

  // watcher options for $subscribe
  // 可以看作发布订阅模式的收集者
  const $subscribeOptions: WatchOptions = {
    deep: true,
    // flush: 'post',
  }
  
  /* istanbul ignore else */
  if (__DEV__ && !isVue2) {
    $subscribeOptions.onTrigger = (event) => {
      /* istanbul ignore else */
      if (isListening) {
        debuggerEvents = event
        // avoid triggering this while the store is being built and the state is being set in pinia
      } else if (isListening == false && !store._hotUpdating) {
        // let patch send all the events together later
        /* istanbul ignore else */
        if (Array.isArray(debuggerEvents)) {
          debuggerEvents.push(event)
        } else {
          console.error(
            '🍍 debuggerEvents should be an array. This is most likely an internal Pinia bug.'
          )
        }
      }
    }
  }

  // internal state
  let isListening: boolean // set to true at the end
  let isSyncListening: boolean // set to true at the end
  let subscriptions: SubscriptionCallback<S>[] = markRaw([])
  let actionSubscriptions: StoreOnActionListener<Id, S, G, A>[] = markRaw([])
  let debuggerEvents: DebuggerEvent[] | DebuggerEvent
  const initialState = pinia.state.value[$id] as UnwrapRef<S> | undefined

  // avoid setting the state for option stores if it is set
  // by the setup
  if (!isOptionsStore && !initialState && (!__DEV__ || !hot)) {
    /* istanbul ignore if */
    if (isVue2) {
      set(pinia.state.value, $id, {})
    } else {
      pinia.state.value[$id] = {}
    }
  }

  const hotState = ref({} as S)

  // avoid triggering too many listeners
  // https://github.com/vuejs/pinia/issues/1129
  let activeListener: Symbol | undefined
  function $patch(stateMutation: (state: UnwrapRef<S>) => void): void
  function $patch(partialState: _DeepPartial<UnwrapRef<S>>): void
  function $patch(
    partialStateOrMutator:
      | _DeepPartial<UnwrapRef<S>>
      | ((state: UnwrapRef<S>) => void)
  ): void {
    let subscriptionMutation: SubscriptionCallbackMutation<S>
    isListening = isSyncListening = false
    // reset the debugger events since patches are sync
    /* istanbul ignore else */
    if (__DEV__) {
      debuggerEvents = []
    }
    if (typeof partialStateOrMutator === 'function') {
      partialStateOrMutator(pinia.state.value[$id] as UnwrapRef<S>)
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents as DebuggerEvent[],
      }
    } else {
      mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator)
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: partialStateOrMutator,
        storeId: $id,
        events: debuggerEvents as DebuggerEvent[],
      }
    }
    const myListenerId = (activeListener = Symbol())
    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true
      }
    })
    isSyncListening = true
    // because we paused the watcher, we need to manually call the subscriptions
    triggerSubscriptions(
      subscriptions,
      subscriptionMutation,
      pinia.state.value[$id] as UnwrapRef<S>
    )
  }

  const $reset = isOptionsStore
    ? function $reset(this: _StoreWithState<Id, S, G, A>) {
        const { state } = options as DefineStoreOptions<Id, S, G, A>
        const newState = state ? state() : {}
        // we use a patch to group all changes into one single subscription
        this.$patch(($state) => {
          assign($state, newState)
        })
      }
    : /* istanbul ignore next */
    __DEV__
    ? () => {
        throw new Error(
          `🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`
        )
      }
    : noop

  function $dispose() {
    scope.stop()
    subscriptions = []
    actionSubscriptions = []
    pinia._s.delete($id)
  }

  /**
   * Wraps an action to handle subscriptions.
   *
   * @param name - name of the action
   * @param action - action to wrap
   * @returns a wrapped action to handle subscriptions
   */
  function wrapAction(name: string, action: _Method) {
    return function (this: any) {
      setActivePinia(pinia)
      const args = Array.from(arguments)

      const afterCallbackList: Array<(resolvedReturn: any) => any> = []
      const onErrorCallbackList: Array<(error: unknown) => unknown> = []
      function after(callback: _ArrayType<typeof afterCallbackList>) {
        afterCallbackList.push(callback)
      }
      function onError(callback: _ArrayType<typeof onErrorCallbackList>) {
        onErrorCallbackList.push(callback)
      }

      // @ts-expect-error
      triggerSubscriptions(actionSubscriptions, {
        args,
        name,
        store,
        after,
        onError,
      })

      let ret: any
      try {
        ret = action.apply(this && this.$id === $id ? this : store, args)
        // handle sync errors
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error)
        throw error
      }

      if (ret instanceof Promise) {
        return ret
          .then((value) => {
            triggerSubscriptions(afterCallbackList, value)
            return value
          })
          .catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error)
            return Promise.reject(error)
          })
      }

      // trigger after callbacks
      triggerSubscriptions(afterCallbackList, ret)
      return ret
    }
  }

  const _hmrPayload = /*#__PURE__*/ markRaw({
    actions: {} as Record<string, any>,
    getters: {} as Record<string, Ref>,
    state: [] as string[],
    hotState,
  })

  const partialStore = {
    _p: pinia,
    // _s: scope,
    $id,
    $onAction: addSubscription.bind(null, actionSubscriptions),
    $patch,
    $reset,
    $subscribe(callback, options = {}) {
      const removeSubscription = addSubscription(
        subscriptions,
        callback,
        options.detached,
        () => stopWatcher()
      )
      const stopWatcher = scope.run(() =>
        watch(
          () => pinia.state.value[$id] as UnwrapRef<S>,
          (state) => {
            if (options.flush === 'sync' ? isSyncListening : isListening) {
              callback(
                {
                  storeId: $id,
                  type: MutationType.direct,
                  events: debuggerEvents as DebuggerEvent,
                },
                state
              )
            }
          },
          assign({}, $subscribeOptions, options)
        )
      )!

      return removeSubscription
    },
    $dispose,
  } as _StoreWithState<Id, S, G, A>

  /* istanbul ignore if */
  if (isVue2) {
    // start as non ready
    partialStore._r = false
  }

  const store: Store<Id, S, G, A> = reactive(
    __DEV__ || USE_DEVTOOLS
      ? assign(
          {
            _hmrPayload,
            _customProperties: markRaw(new Set<string>()), // devtools custom properties
          },
          partialStore
          // must be added later
          // setupStore
        )
      : partialStore
  ) as unknown as Store<Id, S, G, A>

  // store the partial store now so the setup of stores can instantiate each other before they are finished without
  // creating infinite loops.
  pinia._s.set($id, store)

  // TODO: idea create skipSerialize that marks properties as non serializable and they are skipped
  const setupStore = pinia._e.run(() => {
    scope = effectScope()
    return scope.run(() => setup())
  })!

  // overwrite existing actions to support $onAction
  for (const key in setupStore) {
    const prop = setupStore[key]

    if ((isRef(prop) && !isComputed(prop)) || isReactive(prop)) {
      // mark it as a piece of state to be serialized
      if (__DEV__ && hot) {
        set(hotState.value, key, toRef(setupStore as any, key))
        // createOptionStore directly sets the state in pinia.state.value so we
        // can just skip that
      } else if (!isOptionsStore) {
        // in setup stores we must hydrate the state and sync pinia state tree with the refs the user just created
        if (initialState && shouldHydrate(prop)) {
          if (isRef(prop)) {
            prop.value = initialState[key]
          } else {
            // probably a reactive object, lets recursively assign
            // @ts-expect-error: prop is unknown
            mergeReactiveObjects(prop, initialState[key])
          }
        }
        // transfer the ref to the pinia state to keep everything in sync
        /* istanbul ignore if */
        if (isVue2) {
          set(pinia.state.value[$id], key, prop)
        } else {
          pinia.state.value[$id][key] = prop
        }
      }

      /* istanbul ignore else */
      if (__DEV__) {
        _hmrPayload.state.push(key)
      }
      // action
    } else if (typeof prop === 'function') {
      // @ts-expect-error: we are overriding the function we avoid wrapping if
      const actionValue = __DEV__ && hot ? prop : wrapAction(key, prop)
      // this a hot module replacement store because the hotUpdate method needs
      // to do it with the right context
      /* istanbul ignore if */
      if (isVue2) {
        set(setupStore, key, actionValue)
      } else {
        // @ts-expect-error
        setupStore[key] = actionValue
      }

      /* istanbul ignore else */
      if (__DEV__) {
        _hmrPayload.actions[key] = prop
      }

      // list actions so they can be used in plugins
      // @ts-expect-error
      optionsForPlugin.actions[key] = prop
    } else if (__DEV__) {
      // add getters for devtools
      if (isComputed(prop)) {
        _hmrPayload.getters[key] = isOptionsStore
          ? // @ts-expect-error
            options.getters[key]
          : prop
        if (IS_CLIENT) {
          const getters: string[] =
            (setupStore._getters as string[]) ||
            // @ts-expect-error: same
            ((setupStore._getters = markRaw([])) as string[])
          getters.push(key)
        }
      }
    }
  }

  // add the state, getters, and action properties
  /* istanbul ignore if */
  if (isVue2) {
    Object.keys(setupStore).forEach((key) => {
      set(store, key, setupStore[key])
    })
  } else {
    assign(store, setupStore)
    // allows retrieving reactive objects with `storeToRefs()`. Must be called after assigning to the reactive object.
    // Make `storeToRefs()` work with `reactive()` #799
    assign(toRaw(store), setupStore)
  }

  // use this instead of a computed with setter to be able to create it anywhere
  // without linking the computed lifespan to wherever the store is first
  // created.
  Object.defineProperty(store, '$state', {
    get: () => (__DEV__ && hot ? hotState.value : pinia.state.value[$id]),
    set: (state) => {
      /* istanbul ignore if */
      if (__DEV__ && hot) {
        throw new Error('cannot set hotState')
      }
      $patch(($state) => {
        assign($state, state)
      })
    },
  })

  // add the hotUpdate before plugins to allow them to override it
  /* istanbul ignore else */
  if (__DEV__) {
    store._hotUpdate = markRaw((newStore) => {
      store._hotUpdating = true
      newStore._hmrPayload.state.forEach((stateKey) => {
        if (stateKey in store.$state) {
          const newStateTarget = newStore.$state[stateKey]
          const oldStateSource = store.$state[stateKey]
          if (
            typeof newStateTarget === 'object' &&
            isPlainObject(newStateTarget) &&
            isPlainObject(oldStateSource)
          ) {
            patchObject(newStateTarget, oldStateSource)
          } else {
            // transfer the ref
            newStore.$state[stateKey] = oldStateSource
          }
        }
        // patch direct access properties to allow store.stateProperty to work as
        // store.$state.stateProperty
        set(store, stateKey, toRef(newStore.$state, stateKey))
      })

      // remove deleted state properties
      Object.keys(store.$state).forEach((stateKey) => {
        if (!(stateKey in newStore.$state)) {
          del(store, stateKey)
        }
      })

      // avoid devtools logging this as a mutation
      isListening = false
      isSyncListening = false
      pinia.state.value[$id] = toRef(newStore._hmrPayload, 'hotState')
      isSyncListening = true
      nextTick().then(() => {
        isListening = true
      })

      for (const actionName in newStore._hmrPayload.actions) {
        const action: _Method = newStore[actionName]

        set(store, actionName, wrapAction(actionName, action))
      }

      // TODO: does this work in both setup and option store?
      for (const getterName in newStore._hmrPayload.getters) {
        const getter: _Method = newStore._hmrPayload.getters[getterName]
        const getterValue = isOptionsStore
          ? // special handling of options api
            computed(() => {
              setActivePinia(pinia)
              return getter.call(store, store)
            })
          : getter

        set(store, getterName, getterValue)
      }

      // remove deleted getters
      Object.keys(store._hmrPayload.getters).forEach((key) => {
        if (!(key in newStore._hmrPayload.getters)) {
          del(store, key)
        }
      })

      // remove old actions
      Object.keys(store._hmrPayload.actions).forEach((key) => {
        if (!(key in newStore._hmrPayload.actions)) {
          del(store, key)
        }
      })

      // update the values used in devtools and to allow deleting new properties later on
      store._hmrPayload = newStore._hmrPayload
      store._getters = newStore._getters
      store._hotUpdating = false
    })
  }

  if (USE_DEVTOOLS) {
    const nonEnumerable = {
      writable: true,
      configurable: true,
      // avoid warning on devtools trying to display this property
      enumerable: false,
    }

    // avoid listing internal properties in devtools
    ;(['_p', '_hmrPayload', '_getters', '_customProperties'] as const).forEach(
      (p) => {
        Object.defineProperty(
          store,
          p,
          assign({ value: store[p] }, nonEnumerable)
        )
      }
    )
  }

  /* istanbul ignore if */
  if (isVue2) {
    // mark the store as ready before plugins
    store._r = true
  }

  // apply all plugins
  pinia._p.forEach((extender) => {
    /* istanbul ignore else */
    if (USE_DEVTOOLS) {
      const extensions = scope.run(() =>
        extender({
          store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin,
        })
      )!
      Object.keys(extensions || {}).forEach((key) =>
        store._customProperties.add(key)
      )
      assign(store, extensions)
    } else {
      assign(
        store,
        scope.run(() =>
          extender({
            store,
            app: pinia._a,
            pinia,
            options: optionsForPlugin,
          })
        )!
      )
    }
  })

  if (
    __DEV__ &&
    store.$state &&
    typeof store.$state === 'object' &&
    typeof store.$state.constructor === 'function' &&
    !store.$state.constructor.toString().includes('[native code]')
  ) {
    console.warn(
      `[🍍]: The "state" must be a plain object. It cannot be\n` +
        `\tstate: () => new MyClass()\n` +
        `Found in store "${store.$id}".`
    )
  }

  // only apply hydrate to option stores with an initial state in pinia
  if (
    initialState &&
    isOptionsStore &&
    (options as DefineStoreOptions<Id, S, G, A>).hydrate
  ) {
    ;(options as DefineStoreOptions<Id, S, G, A>).hydrate!(
      store.$state,
      initialState
    )
  }

  isListening = true
  isSyncListening = true
  return store
}
```

### **$patch**

```typescript
// function reload 函数重载
function $patch(stateMutation: (state: UnwrapRef<S>) => void): void
function $patch(partialState: _DeepPartial<UnwrapRef<S>>): void
```

从函数重载中，可以看到$patch支持两种方式传参，一种是通过函数形式，一种是对象形式

#### **函数形式的$patch**

```typescript
if (typeof partialStateOrMutator === 'function') {
  // 将当前获取的store对应的state传入
  partialStateOrMutator(pinia.state.value[$id] as UnwrapRef<S>)
  // 订阅
  subscriptionMutation = {
    type: MutationType.patchFunction,// 类型
    storeId: $id, // store 标识
    events: debuggerEvents as DebuggerEvent[], // event
  }
}
```

- 通过pinia.state.value[$id] 获取当前store的state，并作为参数传入
- `subscriptionMutation`订阅者

#### 对象形式的$patch

```typescript
mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator)
subscriptionMutation = {
	type: MutationType.patchObject,
	payload: partialStateOrMutator,
	storeId: $id,
	events: debuggerEvents as DebuggerEvent[],
}

// mergeReactiveObjects 代码如下
function mergeReactiveObjects<T extends StateTree>(
  target: T,
  patchToApply: _DeepPartial<T>
): T {
  // no need to go through symbols because they cannot be serialized anyway
  for (const key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key)) continue;
    const subPatch = patchToApply[key];
    const targetValue = target[key];
    if (
      isPlainObject(targetValue) &&
      isPlainObject(subPatch) &&
      target.hasOwnProperty(key) &&
      !isRef(subPatch) &&
      !isReactive(subPatch)
    ) {
      // 如果被修改的值 修改前修改后都是object类型并且不是Function类型、并且不是ref 不是isReactive，则递归mergeReactiveObjects达到修改嵌套object的目的
      target[key] = mergeReactiveObjects(targetValue, subPatch);
    } else {
      // @ts-expect-error: subPatch is a valid value
      // 如果是简单类型 则直接进行state的修改，这里的target为pinia.state.value[$id]
      // 按我们的示例来实际分析：pinia.state.value[$id].counter = 2
      target[key] = subPatch;
    }
  }
  return target;
}
```

### **state修改完成后触发订阅**

```typescript
// because we paused the watcher, we need to manually call the subscriptions
triggerSubscriptions(
  subscriptions,
  subscriptionMutation,
  pinia.state.value[$id] as UnwrapRef<S>
)
```

> TOOD: 这里存疑的问题就是，此时subscriptions可能会是空数组，导致callback根本不会执行，暂时我也没搞懂这段代码

### **$reset 重置state为初始化状态**

```typescript
const $reset = __DEV__
	? () => {
        throw new Error(
            `🍍: Store "${$id}" is built using the setup syntax and does not implement $reset().`
        );
	}
	: noop; // noop为空函数

store.$reset = function $reset() {
    // state通过闭包机制获得最初state定义的状态
    const newState = state ? state() : {};
    // 通过$patch完成对state中数据的更新
    this.$patch(($state) => {
        assign($state, newState);
    });
};
```

### **$onAction**

订阅当前`store`所有`action`操作，每当`action`被执行的时候，便会触发该方法

```typescript
const partialStore = {
	$onAction: addSubscription.bind(null, actionSubscriptions) // action 事件注册函数
}
```

- 通过`addSubscription`添加订阅
- `addSubscription`的返回值是`removeSubscription`

#### **addSubscription**

```typescript
export function addSubscription<T extends _Method>(
  subscriptions: T[],
  callback: T, // 通过store.$onAction传入的回调，trigger的时候会进行会执行回调
  detached?: boolean, // true， 作用域销毁依旧有效 
  onCleanup: () => void = noop
) {
  // 使用$Action的时候就会触发回调。因为triggerSubscription 会执行回调
  subscriptions.push(callback)

  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback)
    if (idx > -1) {
      subscriptions.splice(idx, 1)
      onCleanup()
    }
  }
  
  // 取消订阅
  if (!detached && getCurrentScope()) {
    onScopeDispose(removeSubscription)
  }
  return removeSubscription
}
```

#### **wrapAction**

```typescript
// action 初始化会通过wrapAction包装
const actionValue = __DEV__ && hot ? prop : wrapAction(key, prop)
```

`wrapAction`的代码如下

```typescript
function wrapAction(name: string, action: _Method) {
    return function (this: any) {
      // 设置当前活动的pinia
      setActivePinia(pinia)
      // 类数组转数组
      const args = Array.from(arguments)
      
      const afterCallbackList: Array<(resolvedReturn: any) => any> = []
      const onErrorCallbackList: Array<(error: unknown) => unknown> = []
      // 将after的callback 入栈
      function after(callback: _ArrayType<typeof afterCallbackList>) {
        afterCallbackList.push(callback)
      }
      // 将error的callback入栈
      function onError(callback: _ArrayType<typeof onErrorCallbackList>) {
        onErrorCallbackList.push(callback)
      }

      // @ts-expect-error
	  // 触发actionSubscriptions中订阅的store.$Action的全部回调函数,并将参数传入
      // 此时store.$onAction的callback已经执行,但是after onError的回调函数尚未执行
      triggerSubscriptions(actionSubscriptions, {
        args,
        name,
        store,
        after,
        onError,
      })

      let ret: any
      try {
        ret = action.apply(this && this.$id === $id ? this : store, args)
        // handle sync errors
      } catch (error) {
        // 如果action执行出错,则直接执行错误回调,终止函数
        triggerSubscriptions(onErrorCallbackList, error)
        throw error
      }
      // ret 是 Promise(这也是为什么action支持异步的原因)
      // 会通过上方的try catch，但是会在action结尾增加then catch进行结果捕捉
      if (ret instanceof Promise) {
        return ret
          .then((value) => {
            triggerSubscriptions(afterCallbackList, value)
            return value
          })
          .catch((error) => {
            triggerSubscriptions(onErrorCallbackList, error)
            return Promise.reject(error)
          })
      }

      // trigger after callbacks
      // 如果try catch 通过，并且当前action不是Promise，则逻辑进行到此处，触发所有 触发真正的after函数，并将当前action的返回值传入其中，至此完成对action触发的监听。
      triggerSubscriptions(afterCallbackList, ret)
      return ret
    }
}
```

所以Pinia的官网提供了$onAction的`after`,`error`用法

```typescript
const unsubscribe = someStore.$onAction(
  ({
    name, // action 的名字
    store, // store 实例
    args, // 调用这个 action 的参数
    after, // 在这个 action 执行完毕之后，执行这个函数
    onError, // 在这个 action 抛出异常的时候，执行这个函数
  }) => {
    // 记录开始的时间变量
    const startTime = Date.now()
    // 这将在 `store` 上的操作执行之前触发
    console.log(`Start "${name}" with params [${args.join(', ')}].`)

    // 如果 action 成功并且完全运行后，after 将触发。
    // 它将等待任何返回的 promise
    after((result) => {
      console.log(
        `Finished "${name}" after ${
          Date.now() - startTime
        }ms.\nResult: ${result}.`
      )
    })

    // 如果 action 抛出或返回 Promise.reject ，onError 将触发
    onError((error) => {
      console.warn(
        `Failed "${name}" after ${Date.now() - startTime}ms.\nError: ${error}.`
      )
    })
  }
)

// 手动移除订阅
unsubscribe()
```

### **$subscribe**

官网中提供一个`订阅状态`的栗子，用于查看state状态变化，如下

可以通过 store 的 `$subscribe()` 方法查看状态及其变化，类似于 Vuex 的 [subscribe 方法](https://vuex.vuejs.org/api/#subscribe)。 与常规的 `watch()` 相比，使用 `$subscribe()` 的优点是 *subscriptions* 只会在 *patches* 之后触发一次（例如，当使用上面的函数版本时）

```typescript
cartStore.$subscribe((mutation, state) => {
  // import { MutationType } from 'pinia'
  mutation.type // 'direct' | 'patch object' | 'patch function'
  // 与 cartStore.$id 相同
  mutation.storeId // 'cart'
  // 仅适用于 mutation.type === 'patch object'
  mutation.payload // 补丁对象传递给 to cartStore.$patch()

  // 每当它发生变化时，将整个状态持久化到本地存储
  localStorage.setItem('cart', JSON.stringify(state))
})
```

源码如下

```typescript
$subscribe(callback, options = {}) {
  // 同wrapAction中 添加订阅者
  const removeSubscription = addSubscription(
    subscriptions,
    callback,
    options.detached, // true的话，作用域dispose时，不销毁
    () => stopWatcher()
  )
  const stopWatcher = scope.run(() =>
    // 监听state的变化
    watch(
      () => pinia.state.value[$id] as UnwrapRef<S>,
      (state) => {
        if (options.flush === 'sync' ? isSyncListening : isListening) {
          // 
          callback(
            {
              storeId: $id,
              type: MutationType.direct,
              events: debuggerEvents as DebuggerEvent,
            },
            state
          )
        }
      },
      assign({}, $subscribeOptions, options)
    )
  )!

  return removeSubscription
},
```

### **$dispose**

调用该方法后将会注销当前`store`

`scope`中存储当前`store`中的相关反应，当前`state`的`watch`，`ref`，等等`effect`都通过`scope.run`创建，就是为了方便统一处理，这里调用`scope.stop()`所有的`effect`便被全部注销了。

```typescript
function $dispose() {
    scope.stop();
    subscriptions = []
    actionSubscriptions = []
    pinia._s.delete($id)
}
```


### TODO:

1. 发布订阅模型的详细解答
2. hot 热更新相关没有涉及
3. TS相关没有涉及
4. 辅助函数`mapHelpers`未涉及
5. `devTools`未涉及
6. `PiniaVuePlugin`未涉及（用于兼容vue2）
