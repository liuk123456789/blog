---
title: axios 封装
date: 2023-01-03
categories: 
 - 日常整理
tags:
 - axios
sidebar: auto
---

### 1. 通过class类完成基础架子

1. 实例化axios & 请求/响应拦截器相关

   ```typescript
   import type { AxiosRequestConfig, AxiosInstance, AxiosResponse, AxiosError } from 'axios';
   import type { RequestOptions, Result, UploadFileParams } from '/#/axios';
   import type { CreateAxiosOptions } from './axiosTransform';
   import axios from 'axios';
   import qs from 'qs';
   import { AxiosCanceler } from './axiosCancel';
   import { isFunction } from '/@/utils/is';
   import { cloneDeep } from 'lodash-es';
   import { ContentTypeEnum } from '/@/enums/httpEnum';
   import { RequestEnum } from '/@/enums/httpEnum';
   
   export class Request {
       private axiosInstance: AxiosInstance
       private readonly options: CreateAxiosOptions
       
       constructor(options: CreateAxiosOptions) {
           this.options = options
           this.axiosInstance = axios.create(options)
           this.setupInterceptors()
       }
       
       private createAxios(config: CreateAxiosOptions):void {
           this.axiosInstance = axios.create(config)
       }
       
       private getTransform() {
           const { transform } = this.options
           return transform
       }
       
       getAxios(): AxiosInstance {
           return this.axiosInstance
       }
       
       configAxios(config: CreateAxiosOptions) {
           if (!this.axiosInstance) {
             return;
           }
           this.createAxios(config);
       }
       
       setHeader(headers: any):void {
           if(!this.axiosInstance) {
               return
           }
           Object.assign(this.axiosInstance.defaults.headers, headers)
       }
       
       private setupInterceptors() {
           const transform = this.getTransform();
           if(!transform) {
               return;
           }
           
           const {
               requestInterceptors,
               requestInterceptorsCatch,
               responseInterceptors,
               responseInterceptorsCatch
           } = transform
           
           const axiosCanceler = new AxiosCanceler()
           
            // 请求拦截器
          	this.axiosInstance.interceptors.request.use((config: AxiosRequestConfig) => {
               if(requestInterceptors && isFunction(requestInterceptors)) {
                   config = requestInterceptors(config, this.options)
               }
               return config
           }
       }, undefined)
       
       // 请求错误拦截器
       requestInterceptorsCatch && isFunction(requestInterceptorsCatch) && this.axiosInstance.interceptors.request.use(undefined, requestInterceptorsCatch)
   
   	// 响应拦截器
   	this.axiosInstance.interceptors.response.use((res: AxiosResponse<any>) => {
         if(responseInterceptors && isFunction(responseInterceptors)) {
             res = responseInterceptors(res)
         }
         return res
       }, undefined)
           
   	// 响应错误拦截器
       responseInterceptorsCatch && isFunction(responseInterceptorsCatch) && this.axiosInstance.interceptors.response.use(undefined, (error) => {
           return responseInterceptorsCatch(this.axiosInstance, error)
       })
   }
   ```

   

2. 引入Request class 类 & 默认拦截器config

   ```typescript
   // axios配置  只需更改该文件即可，其他文件可以不动
   import { merge, get } from 'lodash-es'
   import type { AxiosRequestConfig, AxiosResponse } from 'axios'
   
   import { Request } from './request'
   import type { RequestTransform, CreateRequestOptions } from './requestTransform'
   import { formatRequestData, createErrorMessage, createResponseCatchTips, reLogin } from './helper'
   
   import { RequestOptions, Result } from './types'
   import { RequestEnum, ContentTypeEnum, ErrorMessageEnum } from './enum'
   import { UnAuthKey, AuthKey, Timeout, BaseURL, RequestErrMsg, DefaultRequestOptions } from './const'
   
   import { useRequestLoadingStoreWithOut } from '@/stores/module/request-loading'
   
   import { useUserStoreWithOut } from '@/stores/module/user'
   import { isBlank, isObject } from '../is'
   
   const transform: RequestTransform = {
     /**
      * @description 请求之前处理config
      */
     beforeRequestHook: (config, options) => {
       const requestLoadingStore = useRequestLoadingStoreWithOut()
       const useLoading = get(options, 'useLoading') || false
       useLoading && requestLoadingStore.startLoading()
   
       const params = config.params || {}
       if (config.method?.toUpperCase() !== RequestEnum.GET) {
         if (typeof params === 'object') {
           options?.formatData && formatRequestData(params)
           config.data = params
           config.params = undefined
         }
       }
   
       return config
     },
   
     /**
      * @description 请求拦截器
      */
     requestInterceptors: (config, options) => {
       // 如果请求头里面带有 "UnAuthKey" 则不传 "AuthKey"
       if (!config || !config.headers) return config
       const unAuth = !!config.headers[UnAuthKey]
       const userStore = useUserStoreWithOut()
       const token = userStore.token
       if (token && !unAuth) {
         config.headers[AuthKey] = token
       }
       unAuth && Reflect.deleteProperty(config.headers, UnAuthKey)
   
       return config
     },
   
     /**
      * 响应拦截器
      */
     responseInterceptors: (res:AxiosResponse<any>, options) => {
       const requestLoadingStore = useRequestLoadingStoreWithOut()
       // 请求拦截,终止当前的loading，准备下一个请求
       const useLoading = get(options, 'useLoading') || false
       useLoading && requestLoadingStore.reponsedLoading()
       return res
     },
   
     /**
      * @description 响应拦截器错误捕获
      */
     responseInterceptorsCatch: (error, options) => {
       const requestLoadingStore = useRequestLoadingStoreWithOut()
       // 请求正常返回,继续下一个请求
       const useLoading = get(options, 'useLoading') || false
       useLoading && requestLoadingStore.abortLoading()
   
       const { response, code, message } = error || {}
       const responseData = response?.data
       const alertDefaultErrorMsgByKey = (key: keyof typeof RequestErrMsg) => {
         createErrorMessage({ errorMessage: RequestErrMsg[key] }, ErrorMessageEnum.MESSAGE)
       }
       // 特殊错误处理
       const errHandleres = [
         {
           checker: () => code === 'ECONNABORTED' && message.indexOf('timeout') !== -1,
           handler: () => alertDefaultErrorMsgByKey('apiTimeoutMessage')
         },
         {
           checker: () => error?.toString?.()?.includes?.('Network Error'),
           handler: () => alertDefaultErrorMsgByKey('networkExceptionMsg')
         },
         {
           checker: () => {
             if (!isBlank(responseData)) return false
             if (!isObject(responseData)) return false
             return [4011, 401].includes(responseData.status)
           },
           handler: () => {
             createResponseCatchTips(error, {})
             reLogin()
           }
         }
       ]
       try {
         const errorChecker = errHandleres.find(({ checker }) => checker())
         if (errorChecker) {
           errorChecker.handler()
         } else {
           // 不需要错误处理的统一进行错误提示
           createResponseCatchTips(error, options as RequestOptions)
         }
       } catch (error: any) {
         throw new Error(error)
       }
   
       return Promise.reject(responseData)
     },
   
     /**
      * @description 处理请求数据
      */
     transformRequestHook: (res: AxiosResponse<Result>, options?: RequestOptions) => {
       if (!options) return res
   
       const { isReturnNativeResponse, isTransformRequestResult } = options
       const { data } = res
       // 不进行任何处理，直接返回
       if (isReturnNativeResponse) return res
   
       // 用于页面代码可能需要直接获取code，data，message这些信息时开启
       if (!isTransformRequestResult) return data
   
       if (!data) return data
   
       const msg = data.msg
       return msg
     }
   }
   
   export function createRequest(opt?: Partial<CreateRequestOptions>) {
     const options = merge(
       {
         timeout: Timeout,
         // 接口域名地址
         baseURL: BaseURL,
         headers: { 'Content-Type': ContentTypeEnum.JSON },
         // 数据处理
         transform,
         // 请求配置项，下面的选项都可以在独立的接口请求中覆盖
         requestOptions: DefaultRequestOptions
       } as Partial<CreateRequestOptions>,
       opt || {}
     )
     return new Request(options)
   }
   
   export default createRequest()
   ```

   

3. 辅助函数&枚举配置

   1. 变量相关

      ```typescript
      import { ErrorMessageEnum } from './enum'
      
      export const AuthKey = 'token'
      
      // 后端给的无需stream-id的标记
      export const UnAuthKey = 'noToken'
      
      // 请求超时时间 60s
      export const Timeout = 60 * 1000
      
      // 请求域名
      export const BaseURL = import.meta.env.VUE_APP_API_HOST || ''
      
      // 预设的常见错误提示
      export const RequestErrMsg = {
        operationFailed: '操作失败',
        errorTip: '错误提示',
        errorMessage: '操作失败,系统异常',
        timeoutMessage: '登录超时,请重新登录',
        apiTimeoutMessage: '接口请求超时,请刷新页面重试',
        networkException: '网络异常',
        networkExceptionMsg: '请检查您的网络连接是否正常',
      
        401: '用户没有权限（未登录、登录过期）',
        403: '用户得到授权，但是访问是被禁止的。',
        404: '网络请求错误，未找到该资源',
        405: '网络请求错误',
        408: '网络请求超时',
        500: '服务器错误,请联系相关人员',
        501: '网络未实现',
        502: '网络错误',
        503: '服务不可用，服务器暂时过载或维护',
        504: '网络超时',
        505: 'http版本不支持该请求'
      }
      
      export const DefaultRequestOptions = {
        // 不对数据进行任何处理， 直接返回响应结果
        isReturnNativeResponse: false,
        // 需要对返回数据进行处理
        isTransformRequestResult: true,
        // 格式化提交参数
        isFormatData: true,
        // 消息提示类型
        errorMessageMode: ErrorMessageEnum.ERRROR_DIALOG,
        // 忽略重复请求
        ignoreCancelToken: true,
        useLoading: true
      }
      
      ```

      

   2. 枚举相关

      ```typescript
      /**
       * @description 请求类型
       */
      export const RequestEnum = {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT'
      }
      
      /**
       * @description  contentType
       */
      export const ContentTypeEnum = {
        // json
        JSON: 'application/json;charset=UTF-8',
        // form-data qs
        FORM_URLENCODED: 'application/x-www-form-urlencoded;charset=UTF-8',
        // form-data  upload
        FORM_DATA: 'multipart/form-data;charset=UTF-8'
      }
      
      /**
       * 错误展示类型
       */
      export const ErrorMessageEnum = {
        MESSAGE: 'message',
        ERRROR_DIALOG: 'errorDialog'
      }
      
      ```

      

   3. 辅助函数

      ```typescript
      import { isObject, isString } from 'lodash'
      
      import { Message } from 'element-ui'
      
      import RequestErrorDialog from '@/modules/RequestErrorDialog'
      
      import router from '@/router'
      
      import store from '@/store'
      
      /**
       * @description 处理请求参数
       */
      export const formatRequestData = params => {
        for (const key in params) {
          if (isString(key)) {
            const value = params[key]
            if (value) {
              try {
                params[key] = isString(value) ? value.trim() : value
              } catch (error) {
                throw new Error(error)
              }
            }
          }
          if (isObject(params[key])) {
            formatRequestData(params[key])
          }
        }
      }
      
      /**
       * 创建错误信息
       * @param error
       * @param error
       */
      
      export const createErrorMessage = (error, mode) => {
        const modeHandles = {
          message(errorObj) {
            Message.error(errorObj.errorMessage)
          },
          errorDialog(errorObj) {
            new RequestErrorDialog(errorObj)
          }
        }
      
        const handler = modeHandles[mode]
        handler && handler(error)
      }
      
      /**
       * 提示响应报错
       * @param error
       */
      export async function createResponseCatchTips(error, requestOptions) {
        const { response, config } = error
        const msgMode = requestOptions.errorMessageMode
        // 接口错误信息追踪
        const url = config.url || '未获取到接口地址'
        const errorMessage = response.data.msg
      
        createErrorMessage(
          {
            url,
            errorMessage
          },
          msgMode
        )
      }
      
      /**
       * 重新登录
       */
      export const reLogin = () => {
        window.sessionStorage.clear()
        router.replace({ name: 'Login' })
        store.commit('USERINFO', { userInfo: {} })
      }
      
      ```

### 2. formData 支持

因为axios默认时Payload的数据格式请求，有时候后端接受参数必须时formData格式，所以我们必须进行转换，Payload和Form Data的主要设置是根据请求头的Content-Type的值来的

Payload       Content-Type: ‘application/json; charset=utf-8’

Form Data   Content-Type: ‘application/x-www-form-urlencoded’因为axios默认时Payload的数据格式请求，有时候后端接受参数必须时formData格式，所以我们必须进行转换，Payload和Form Data的主要设置是根据请求头的Content-Type的值来的

Payload       Content-Type: ‘application/json; charset=utf-8’

Form Data   Content-Type: ‘application/x-www-form-urlencoded’

修改Request类代码

```typescript
export class Request {
  ****
  // 支持 form-data
  supportFormData(config: AxiosRequestConfig) {
    const headers = config.headers || this.options.headers;
    const contentType = headers?.['Content-Type'] || headers?.['content-type'];

    if (
      contentType !== ContentTypeEnum.FORM_URLENCODED ||
      !Reflect.has(config, 'data') ||
      config.method?.toUpperCase() === RequestEnum.GET
    ) {
      return config;
    }

    return {
      ...config,
      data: qs.stringify(config.data, { arrayFormat: 'brackets' }),
    };
  }
}
```



### 3. 取消请求

```typescript
import type { AxiosRequestConfig, Canceler } from 'axios'
import axios from 'axios'
import { isFunction } from '@/utils/is'

// 管理请求
let pendingMap = new Map<string, Canceler>()

export const getPendingUrl = (config: AxiosRequestConfig) =>
  [config.method, config.url, config.params ? JSON.stringify(config.params) : ''].join('&')

export class RequestCanceler {
  /**
   * 添加请求
   * @param {Object} config
   */
  addPending(config: AxiosRequestConfig) {
    this.removePending(config)
    const url = getPendingUrl(config)
    config.cancelToken =
      config.cancelToken ||
      new axios.CancelToken((cancel) => {
        if (!pendingMap.has(url)) {
          // If there is no current request in pending, add it
          pendingMap.set(url, cancel)
        }
      })
  }

  /**
   * @description 清除全部进行中请求
   */
  removeAllPending() {
    pendingMap.forEach((cancel) => {
      cancel && isFunction(cancel) && cancel()
    })
    pendingMap.clear()
  }

  /**
   * 移除请求
   * @param {Object} config
   */
  removePending(config: AxiosRequestConfig) {
    const url = getPendingUrl(config)

    if (pendingMap.has(url)) {
      // 如果当前请求进行中 则需要取消 & 移除
      const cancel = pendingMap.get(url)
      cancel && cancel(url)
      pendingMap.delete(url)
    }
  }

  /**
   * @description 重置进行中请求管理
   */
  reset(): void {
    pendingMap = new Map<string, Canceler>()
  }
}

```

### 4. get、post、put、delete等请求统一处理

```typescript
export class Request {
    ***
    get<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<ResponseData<T>> {
    return this.request({ ...config, method: 'GET' }, options)
  }

    post<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<ResponseData<T>> {
    return this.request({ ...config, method: 'POST' }, options)
  }

    put<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<ResponseData<T>> {
    return this.request({ ...config, method: 'PUT' }, options)
  }

    request<T = any>(config: AxiosRequestConfig, options?: RequestOptions): Promise<ResponseData<T>> {
    let conf: AxiosRequestConfig = cloneDeep(config)
    const transform = this.getTransform()

    const { requestOptions } = this.options

    // 这里处理下错误类型模式,优先读取配置，否则的话默认为errorDialog
    if (requestOptions) {
      requestOptions.errorMessageMode =
        options?.errorMessageMode ?? DefaultRequestOptions.errorMessageMode
    }

    const opt: RequestOptions = Object.assign({}, requestOptions, options)

    const { beforeRequestHook, requestCatchHook, transformRequestHook } = transform || {}

    if (beforeRequestHook && isFunction(beforeRequestHook)) {
      conf = beforeRequestHook(conf, opt)
    }

    conf = this.supportFormData(conf)

    return new Promise((resolve) => {
      this.axiosInstance
        .request<any, AxiosResponse<Result>>(conf)
        .then(
          (res: AxiosResponse<Result>) => {
            const result: ResponseData<T> = {
              success: true,
              result: res as unknown as T
            }

            if (transformRequestHook && isFunction(transformRequestHook)) {
              const ret: T = transformRequestHook(res, opt)
              result.result = ret

              resolve(result)
              return
            }

            resolve(result)
          },
          (e: any) => {
            const result = {
              success: false,
              error: e
            }
            resolve(result)
          }
        )
        .catch(async (e: Error) => {
          if (requestCatchHook && isFunction(requestCatchHook)) {
            await requestCatchHook(e)
            return
          }
          throw e
        })
    })
  }
}
```

### 5. 使用

```typescript
import request from '@/utils/request'

// TODO: params 这里先弄个demo，后续会将类型补齐
export const loginByPassword = (params: any) => {
  return request.get(
    {
      url: '/website/login/passwdlogin',
      params
    },
    {
      UnAuthKey: true,
      useLoading: false
    }
  )
}

// TODO: params 这里先弄个demo，后续会将类型补齐
export const registerByNoAuth = (params: any) => {
  return request.post(
    {
      url: '/website/login/registerNoAuth',
      params
    },
    {
      useLoading: false
    }
  )
}
```

