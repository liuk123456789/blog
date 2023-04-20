---
title: 自定义Dialog
date: 2023-04-04
categories: 
 - Vue
tags:
 - Dialog
sidebar: auto
---

## 1. 需求说明

进行接口请求时，如果接口报错，需要将接口错误信息，请求URL，参数等信息，某些接口需要通过`Dialog`方式进行展现，同时提供复制功能，方便前后端排查问题

## 2. 需求实现

1. 使用`axios`进行接口请求时，`axios`提供了响应错误拦截器，我们需要在这里判定展示错误的方式

   ```javascript
   responseInterceptorsCatch: (error, options) => {
       const { response } = error || {}
       const responseData = response.data
       // 判定展示错误方式， 默认 Message
       const alertDefaultErrorMsgByKey = (key) => {
         createErrorMessage(
           { errorMessage: RequestErrMsg[key] },
           ErrorMessageEnum.MESSAGE
         )
       }
    }
   ```

   

2. 如何在`js`中调用`vue`组件呢？首先考虑的是通过`js`方式进行调用，那么在`js`中需要生成组件实例，并且挂载到容器上，我们看下官网上的栗子

   ```javascript
   // 创建构造器
   var Profile = Vue.extend({
     template: '<p>{{firstName}} {{lastName}} aka {{alias}}</p>',
     data: function () {
       return {
         firstName: 'Walter',
         lastName: 'White',
         alias: 'Heisenberg'
       }
     }
   })
   // 创建 Profile 实例，并挂载到一个元素上。
   new Profile().$mount('#mount-point')
   ```

3. 我们把它封装到一个类中，那么可以在任意地方进行调用

## 3. 代码

1. 二次封装`ElementUI`的`Dialog`组件

   ```vue
   <template>
     <el-dialog
       :visible.sync="requestErrorVisible"
       :title="dialogProps.title"
       :width="dialogProps.width"
       class="request-dialog"
       @close="onCloseDialog"
     >
       <div class="content">
         <!-- <div>url: {{ this.dialogProps.url }}</div> -->
         <div>错误信息: {{ dialogProps.errorMessage }}</div>
       </div>
       <template slot="footer">
         <div>
           <el-button @click="onClose">取消</el-button>
           <el-button ref="clipboardBtnRef" class="clipboard" type="primary">{{
             copyBtnText
           }}</el-button>
         </div>
       </template>
     </el-dialog>
   </template>
   
   <script>
   import ClipboardJS from 'clipboard'
   
   import { Message } from 'element-ui'
   
   export default {
     name: 'RequestErrorDialog',
     props: {
       dialogProps: {
         type: Object,
         default: () => ({})
       },
       copyBtnText: {
         type: String,
         default: '复制信息'
       }
     },
     data() {
       return {
         requestErrorVisible: false
       }
     },
     computed: {
       clipboardText() {
         return `错误信息：${this.dialogProps.errorMessage}`
       }
     },
     mounted() {
       this.initCopyMessage()
     },
     beforeDestroy() {
       this.$el.parentNode.removeChild(this.$el)
     },
     methods: {
       initCopyMessage() {
         const clipboard = new ClipboardJS(this.$refs.clipboardBtnRef.$el, {
           text: () => this.clipboardText,
           container: document.getElementById('app') // !!! ClipboardJS 会创建一个 textarea 用做内容复制， container 为该 textarea 的插入容器(不传入则默认为 body )
         })
   
         clipboard.on('success', function() {
           Message.success('复制成功')
         })
         clipboard.on('error', function() {
           Message.error('复制失败')
         })
       },
   
       onCloseDialog() {
         this.$el.parentNode.removeChild(this.$el)
         this.requestErrorVisible = false
       },
   
       onShowDialog() {
         this.requestErrorVisible = true
       },
       onClose() {
         this.requestErrorVisible = false
       }
     }
   }
   </script>
   <style lang="less" scoped>
   .request-dialog {
     :deep(.el-dialog__header) {
       text-align: center;
     }
   }
   .content {
     text-align: left;
     line-height: 24px;
   }
   </style>
   
   ```

2. `Vue.extends`

   ```javascript
   import Vue from 'vue'
   import RequestErrorDialog from './index.vue'
   import { getAppRootEl } from '@/utils/util'
   
   class RenderErrorDialog {
     constructor(options) {
       this.instance = this.initInstance(options)
       this.show()
     }
   
     initInstance(data) {
       const container = document.createElement('div')
       const rootEl = getAppRootEl()
       const ErrorDialogPlugin = Vue.extend(RequestErrorDialog)
       this.instance = new ErrorDialogPlugin({
         propsData: {
           dialogProps: {
             title: '操作/获取数据失败',
             width: '40%',
             url: data.url,
             errorMessage: data.errorMessage
           }
         }
       })
   
       this.instance.$mount(container)
       rootEl.appendChild(this.instance.$el)
       return this.instance
     }
   
     show() {
       this.instance.onShowDialog()
     }
   
     close() {
       this.instance.onClose()
       const rootEl = getAppRootEl()
       rootEl.removeChild(this.instance.$el)
     }
   }
   export default RenderErrorDialog
   ```

3. 使用

   ```javascript
   import RequestErrorDialog from '@/components/RequestErrorDialog'
   
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
   ```

