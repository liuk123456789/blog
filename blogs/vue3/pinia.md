---
title: pinia的使用
date: 2022-12-29
categories: 
 - Vue
tags:
 - pinia
sidebar: auto
---

### 1. 安装依赖

```powershell
npm i pinia
```

### 2. stores目录新建index.ts

```typescript
import type { App } from 'vue'

import { createPinia } from 'pinia'

const store = createPinia()

export function setupStore(app: App<Element>) {
    app.use(store)
}

export { store }
```



### 3. main.ts 入口挂载pinia

```typescript
import { createApp } from "vue";

import App from "./App.vue";

import { setupStore } from "@/stores";

const app = createApp(App);

setupStore(app);

....
```

### 4. stores新建module目录（以user.ts为例）

```typescript
import { defineStore } from 'pinia'

import type { UserInfo } from "types/store";

import { store } from "@/stores";

interface UserState {
  token: Nullable<string>;
  userInfo: Nullable<UserInfo>;
  userInfoUpdateAt: Nullable<String>;
}

export const useUserStore = defineStore({
  id: "app-user",
  state: (): UserState => ({
    token: "1221222211221",
    userInfo: null,
    userInfoUpdateAt: null,
  }),
  getters: {}, // 同vuex的getters，对state数据进行映射
  actions: { // 同步&异步 修改state 的可以统一放在actions 处理
    updateToken(token: Nullable<string>) {
      this.token = token;
    },
    clearUserInfo() {
      this.token = null
      this.userInfo = null
      this.userInfoUpdateAt = null
    }
  },
});

// Need to be used outside the setup 非vue3组件内使用pinia
export function useUserStoreWithOut() {
  return useUserStore(store);
}
```

### 5. 使用

1. 组件内

   ```vue
   <template>
     <el-config-provider :size="size" :z-index="zIndex">
       <!-- 获取了state的值 -->
       <span>{{userStore.token}}</span>
       <el-button type="primary" @click="changeToken('221')">测试token</el-button>
       <svg-icon icon-class="color-star" />
       <GlobalRouterView />
     </el-config-provider>
   </template>
   
   <script lang="ts" setup>
     import { useUserStore } from '@/stores/module/user';
     
     const userStore = useUserStore()
     
     const changeToken = (token:string) => {
       userStore.updateToken(token) // 调用actions对应的方法
     }
   </script>
   
   ```

2. 非组件内

   ```typescript
   import { useUserStore } from '@/stores/module/user'
   
   import { defineStore } from 'pinia'
   
   import { storeToRefs } from 'pinia'
   
   export const useRequestLoading = defineStore({
     state: () => ({}),
     
     actions: {
       testModuleEvent() {
         // 在需要使用的地方调用
         const userStore = useUserStore()
         userStore.
       }
     }
   })
   ```

   PS：在非组件内使用pinia需要使用使用的地方调用，否则vue 回报错，报错原因是pinia未初始化就使用

### 6. 不同模块间调用

```typescript
import { useUserStore } from '@/stores/module/user'

// storeToRefs 用于解构保持数据响应式
import { defineStore, storeToRefs } from 'pinia'

export const useRequestLoading = defineStore({
  state: () => ({}),
  
  actions: {
    testModuleEvent() {
      // 在需要使用的地方调用
      const userStore = useUserStore()
      userStore.***
    }
  }
})
```

### 7. 数据持久化

1. 安装依赖

   ```powershell
   npm i pinia-plugin-persistedstate
   ```

2. 使用pinia-plugin-persistedstate

   ```typescript
   import type { App } from 'vue'
   import { createPinia } from 'pinia'
   
   import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
   
   const store = createPinia()
   store.use(piniaPluginPersistedstate)
   
   export function setupStore(app: App<Element>) {
     app.use(store)
   }
   
   export { store }
   
   ```

   

3. 在模块中使用

   ```typescript
   import * as userApis from '@/api/user'
   
   import { defineStore } from 'pinia'
   
   import type { UserInfo } from 'types/store'
   
   import { store } from '@/stores'
   
   interface UserState {
     token: Nullable<string>
     userInfo: Nullable<UserInfo>
     userInfoUpdateAt: Nullable<String>
   }
   
   export const useUserStore = defineStore({
     id: 'app-user',
     state: (): UserState => ({
       token: null,
       userInfo: null,
       userInfoUpdateAt: null
     }),
     getters: {
       isLogin: (state) => !!state.token
     },
     actions: {
       updateToken(payLoad: Nullable<{ token: string }>) {
         this.token = payLoad?.token || null
       },
       clearUserInfo() {
         this.token = null
         this.userInfo = null
         this.userInfoUpdateAt = null
       },
   
       setAuthKey(payLoad: { authKey: string }) {
         this.token = payLoad.authKey
       },
   
       async loginByPassword(payLoad: { mobile: string }) {
         const { success, result } = await userApis.loginByPassword(payLoad)
         if (!success || !result) return { success: false }
         // 设置token
         this.setAuthKey(result.token)
   
         return { success: true }
       }
     },
     // persist: true 将state中的所有数据都设为可持久化
     persist: {
       // key: 默认设置的id,
       // storage: 默认是window.localStorage 可修改为sessionStorage
       // 部分持久化状态的点符号路径数组，[]意味着没有状态被持久化(默认为undefined，持久化整个状态)
       paths: ['token', 'userInfo']
     }
   })
   
   // Need to be used outside the setup
   export function useUserStoreWithOut() {
     return useUserStore(store)
   }
   
   ```

   