---
title: 全局loading
date: 2022-12-30
categories: 
 - 日常整理
tags:
 - loading
sidebar: auto
---

### 1.  请求loading的问题

1. 单个请求，设置全局loading，请求响应的timing很短，造成页面一闪而过
2. 并发请求，开始loading很好控制，如何控制loading在结束时关闭需要考虑
3. 串行请求，loading如何能够衔接本次请求和上次请求的loading，而不会中途loading消失，突然又显示，以及如何判定两次请求是串行请求
4. 如果其中某个请求出错，loading是关掉还是继续等待后面的请求完成

### 2. 应对方案

1. 单个请求，开启loading，响应timing很快，那么可以在响应loading后延迟关闭

   ```javascript
   const timer = setTimeout(() => {
       loading = false
   }, delay)
   ```

   

2. 并发请求的思路是发送请求之前请求数+1，如果请求完成，requestCount 减掉1，同时需要判定是否还有未完成的请求（requestCount > 0）,最终requestCount为0的时候进行loading关闭，demo 代码如下

   ```javascript
   // 开始请求
   startLoading() {
       // 判定下requestCount是不是等于0，为0开启loading
       if(requestCount === 0) {
           loading = true
       }
       requestCount++
   }
   
   // 请求响应
   responseLoading() {
       // 请求减一
       requestCount--
       
       // 调用关闭loading
       if(requestCount === 0) {
           const timer = setTimeout(() => {
               loading = false
           }, delay)
       }
   }
   ```

   

3. 串行请求的话，记录上个请求结束的时间和下个请求开始时间，如果两者小于设定的某个值，那么就认为是串行请求，目前设置的是100ms，具体代码demo如下

   ```javascript
   let prevRequestEndTime = 0 // 上个请求结束的时间
   let requestEndTimer = null // 请求间隔计时器id
   const requestContinue = 100 // 串行请求的最小间隔时间
   const requestCount = 0 // 请求数目
   
   startLoading() {
       const nowTime = +new Date()
       // 判定下时间间隔是否小于requestContinue
       if(nowTime - prevRequestEndTime < requestContinue) {
           // 串行请求时需要将定时器清掉，否则上个请求loading在delay到了之后还是关闭loading
           clearTimeout(requestEndTimer)
           requestEndTimer = null
       } else if(requestCount === 0) {
           loading = true
       }
       requestCount++
   }
   
   responseLoading() {
       requestCount++
   	prevRequestEndTime = +new Date()
       
       if(requestCount === 0) {
           requestEndTimer = setTimeout(() => {
               loading = false
           }, requestContinue)
       }
   }
   ```

   

4. 某个请求出错了，对于串行请求，无法进行写个请求的开启，那么并行请求的处理情况就是，将请求总数减1，判定下是否时最后一个请求，是最后一个请求的话，延时关闭loading，代码demo如下

   ```javascript
   let prevResquestEndTime = 0
   let requestEndTimer = null
   const requestContinue = 100
   const requestCount = 0
   
   abortLoading() {
     requestCount++
     if(requestCount === 0){
       requestEndTimer = setTimeout(() => {
         loading = false
       }, requestContinue)
     }
   }
   ```



### 3. 最终代码

​		因为用于vue项目，所以考虑放在vuex中统一管理

```javascript
import { Loading } from 'element-ui'

const state = {
  requestCount: 0, // 请求数量
  prevRequestEndTime: 0, // 上个请求的结束时间
  requestEndTimer: null, // 延迟定时器的id
  requestContinue: 100, // 请求串行，上个请求结束和下个请求开始的间隔时间
  loadingInstance: null
}

const mutations = {
  // 设置loading
  setLoadingRender(state, isOpenLoading) {
    if (isOpenLoading) {
      state.loadingInstance = Loading.service({
        lock: true,
        fullscreen: true
      })
    } else {
      !!state.loadingInstance && state.loadingInstance.close()
      this.commit('requestLoading/clearState')
    }
  },
  // 请求结束的定时器的id
  setRequestEndTimer(state, timer) {
    state.requestEndTimer = timer
  },
  // 设置上一个请求的结束时间
  setPrevRequestEndTime(state, prevRequestEndTime) {
    state.prevRequestEndTime = prevRequestEndTime
  },
  // 请求增加
  addRequestCount(state) {
    state.requestCount++
  },
  // 请求减少
  subStractRequestCount(state) {
    state.requestCount--
  },

  clearState(state) {
    state.requestCount = 0
    state.requestEndTimer = null
    state.prevRequestEndTime = 0
    state.loadingInstance = null
  }
}

const actions = {
  startLoading({ commit, state }) {
    const {
      requestCount,
      prevRequestEndTime,
      requestEndTimer,
      requestContinue
    } = state
    const nowTime = +new Date()
    if (nowTime - prevRequestEndTime < requestContinue) {
      clearTimeout(requestEndTimer)
    } else if (requestCount === 0) {
      commit('setLoadingRender', true)
    }
    commit('addRequestCount')
  },

  reponsedLoading({ commit, state }) {
    commit('subStractRequestCount')
    commit('setPrevRequestEndTime', +new Date())
    const { requestCount, requestContinue } = state
    if (requestCount === 0) {
      const timer = setTimeout(() => {
        commit('setLoadingRender', false)
      }, requestContinue)
      commit('setRequestEndTimer', timer)
    }
  },

  abortLoading({ commit, state }) {
    commit('subStractRequestCount')
    const { requestCount, requestContinue } = state
    if (requestCount === 0) {
      const timer = setTimeout(() => {
        commit('setLoadingRender', false)
      }, requestContinue)
      commit('setRequestEndTimer', timer)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

```


### 4. 使用

1. 请求拦截器

   ```javascript
   requestInterceptors:(config, options) => {
       // 注意，默认是全局开启loading
       const useLoading = get(options, 'useLoading') || false
       useLoading && store.dispatch('requestLoading/startLoading')
   }
   ```

   

2. 请求错误拦截器

   ```javascript
   requestInterceptorsCatch:(error, options) => {
       // 请求拦截，终止当前的loading，准备下一个请求
       const useLoading = get(options, 'useLoading') || false
       useLoading && store.dispatch('requestLoading/abortLoading')
       return Promise.reject(error)
   }
   ```

   

3. 响应拦截器

   ```javascript
   responseInterceptors:(res, options) => {
       // 请求正常返回，继续下一个请求
       const useLoading = get(options, 'useLoading') || false
       useLoading && store.dispatch('requestLoading/reponsedLoading')
       return res
   }
   ```

   

4. 响应错误拦截器

   ```javascript
   responseInterceptorsCatch:(error, options) => {
       // 终止loading
       const useLoading = get(options, 'useLoading') || false
       useLoading && store.dispatch('requestLoading/abortLoading')
       ***
   }
   ```


