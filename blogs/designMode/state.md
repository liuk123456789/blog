---
title: 状态模式
date: 2023-03-02
categories: 
 - design partten
tags:
 - state
sidebar: auto
---

## 什么是状态模式

状态模式定义一个对象，这个对象可以通过管理其状态从而使得应用程序作出相应的变化。状态模式是一个非常常用的设计模式，它主要有两个角色组成：

- 环境类：拥有一个状态成员，可以修改其状态并作出相对应的反应
- 状态类：表示一种状态，包含其相应的处理方法

## 🌰

1. 这个案例来自曾探大佬的JavaScript设计模式与开发实战

   文件上传程序中有扫描、正在上传、暂停、上传成功、上传失败这几种状态，音乐

   播放器可以分为加载中、正在播放、暂停、播放完毕这几种状态。点击同一个按钮，在上传中和

   暂停状态下的行为表现是不一样的，同时它们的样式 class 也不同

   - 文件扫描状态，是不能进行任何操作的，即不能暂停也不能删除文件，只能等待扫描完成。扫描完成后，根据文件的md5值判断，若文件存在与服务器，那么直接跳到文件上传完成状态。如果文件大小超过允许上传的最大值，或者文件损坏，跳往上传失败状态

   - 上传过程中可以点击暂停暂停上传，暂停后点击同一个按钮会继续上传

   - 扫描和上传过程中，点击删除按钮无效，只有在暂停、上传完成、上传失败之后，才能

     删除文件。

   ```javascript
   // 定义几种状态的类
   
   // 扫描中
   class SignState {
     actionBtn = '扫描中'
     constructor(uploadInstance) {
       this.uploadInstance = uploadInstance
     }
     clickHandler1() {
       console.log('扫描中，点击无效')
     }
   
     clickHandler2() {
       console.log('文件正在上传中，不能删除')
     }
   }
   
   // 上传中
   class UploadingState {
     actionBtn = '上传中，点击暂停'
     constructor(uploadInstance) {
       this.uploadInstance = uploadInstance
     }
     clickHandler1() {
       this.uploadInstance.pause()
     }
   
     clickHandler2() {
       console.log('文件正在上传中，不能删除')
     }
   }
   
   // 暂停上传
   class PauseState {
     actionBtn = '点击继续上传'
     constructor(uploadInstance) {
       this.uploadInstance = uploadInstance
     }
     clickHandler1() {
       this.uploadInstance.uploading()
     }
     clickHandler2() {
       this.uploadInstance.del()
     }
   }
   
   // 上传完成
   class DoneState {
     actionBtn = '上传完成'
     constructor(uploadInstance) {
       this.uploadInstance = uploadInstance
     }
     clickHandler1() {
       this.uploadInstance.uploading()
     }
     clickHandler2() {
       this.uploadInstance.del()
     }
   }
   
   // 上传失败
   class ErrorState {
     actionBtn = '上传失败'
     constructor(uploadInstance) {
       this.uploadInstance = uploadInstance
     }
     clickHandler1() {
       console.log('文件上传失败，点击无效')
     }
   
     clickHandler2() {
       this.uploadInstance.del()
     }
   }
   
   // 环境类 Upload
   export default class Upload {
     constructor(fileName) {
       this.fileName = fileName
       this.signState = new SignState(this) // 设置初始状态为 waiting
       this.uploadingState = new UploadingState(this)
       this.pauseState = new PauseState(this)
       this.doneState = new DoneState(this)
       this.errorState = new ErrorState(this)
       this.currentState = this.signState
     }
   
     bindEvent() {
       this.currentState.clickHandler1()
     }
   
     delEvent() {
       this.currentState.clickHandler2()
     }
   
     sign() {
       console.log('开始文件扫描')
       this.currentState = this.signState
     }
   
     pause() {
       console.log('暂停文件上传')
       this.currentState = this.pauseState
     }
   
     uploading() {
       console.log('开始文件上传')
       this.currentState = this.uploadingState
     }
   
     del() {
       console.log('删除文件上传')
     }
   
     done() {
       console.log('文件上传完成')
       this.currentState = this.doneState
     }
   
     error() {
       this.currentState = this.errorState
     }
   }
   
   ```
   
   页面部分（vue)
   
   ```vue
   <template>
       <div>
         <el-button @click="() => uploadInstance.bindEvent()">{{ uploadInstance.currentState.actionBtn }}</el-button>
         <el-button @click="() => uploadInstance.delEvent()">删除</el-button>
       </div>
   </template>
   
   <script>
   import Upload from '@/utils/state'
   
   export default {
       data() {
         uploadInstance: new Upload('JavaScript 设计模式与开发实践')
       },
       
       created() {
           let timer1 = setTimeout(() => {
             this.uploadInstance.uploading()
           }, 3000)
   
           let timer2 = setTimeout(() => {
             this.uploadInstance.done()
             console.log(this.uploadInstance)
           }, 10000)
   
           this.$once('hook:beforeDestroy', () => {
             clearTimeout(timer1)
             clearTimeout(timer2)
             timer1 = null
             timer2 = null
           })
       }
   }
   </script>
   ```
   
   **可扩展部分**
   
   这个案例中，如果需要配置按钮type，可以在对应状态中添加type字段，如：
   
   ```javascript
   class UploadingState {
     // 将actionBtn的放入统一配置中
     // actionBtn = '上传中，点击暂停',
     // 已elementUI 为例
     actionProps = {
         // 原先的actionBtn
         btnLabel: '上传中，点击暂停'
         type: 'primary',
         plain: false,
         disabled: false
         /* extends your props*/
     }
   }
   ```
   
   如果需要根据不同state，切换不同的UI展示，那么可以这样做
   
   **JS部分**
   
   ```javascript
   import Uploading from '***/Uploading'
   
   class UploadingState {
       actionProps = {
         // 原先的actionBtn
         btnLabel: '上传中，点击暂停'
         type: 'primary',
         plain: false,
         disabled: false
         /* extends your props*/
       }
       // 渲染的组件
       renderCom: Uploading
   }
   ```
   
   **页面调整**
   
   **jsx的写法：需要安装`@vue/babel-plugin-transform-vue-jsx`**
   
   ```vue
   <script>
   import Upload from '@/utils/state'
   export default {
     data() {
       return {
         uploadInstance: new Upload('JavaScript 设计模式与开发实践')
       }
     },
   
     created() {
       let timer1 = setTimeout(() => {
         this.uploadInstance.uploading()
       }, 3000)
   
       let timer2 = setTimeout(() => {
         this.uploadInstance.done()
       }, 10000)
   
       this.$once('hook:beforeDestroy', () => {
         clearTimeout(timer1)
         clearTimeout(timer2)
         timer1 = null
         timer2 = null
       })
     },
     render() {
       const tag = this.uploadInstance.currentState.renderCom || ''
       return (
         tag
           ? <div>
             <tag></tag>
             <div>
               <el-button onClick={() => this.uploadInstance.bindEvent()}>{this.uploadInstance.currentState.actionBtn}</el-button>
               <el-button onClick={() => this.uploadInstance.delEvent()}>删除</el-button>
             </div>
           </div> : null
       )
     }
   }
   </script>
   
   ```
   
   **动态组件写法**
   
   ```vue
   <template>
     <div>
       <component :is="uploadInstance.currentState.renderCom" />
       <div>
         <el-button @click="() => uploadInstance.bindEvent()">{{ uploadInstance.currentState.actionBtn }}</el-button>
         <el-button @click="() => uploadInstance.delEvent()">删除</el-button>
       </div>
     </div>
   </template>
   
   <script>
   import Upload from '@/utils/state'
   
   export default {
     data() {
       return {
         uploadInstance: new Upload('JavaScript 设计模式与开发实践')
       }
     },
   
     created() {
       let timer1 = setTimeout(() => {
         this.uploadInstance.uploading()
       }, 3000)
   
       let timer2 = setTimeout(() => {
         this.uploadInstance.done()
       }, 10000)
   
       this.$once('hook:beforeDestroy', () => {
         clearTimeout(timer1)
         clearTimeout(timer2)
         timer1 = null
         timer2 = null
       })
     }
   }
   </script>
   
   ```
   
   👉🏼: 建议可以使用jsx写法，动态组件在绑定组件为空的时也不会报错，但是本人可能更喜欢jsx这种写法
