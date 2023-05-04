---
title: 单例模式
date: 2022-12-28
categories: 
 - Design Partten
tags:
 - single
sidebar: auto
---

### 1.  单例模式 - 一个类只有一个实例，并提供全局访问

1. 实现最简单的单例模式

   ```javascript
   let Singleton = function(name) {
       this.name = name
   }
   
   Singleton.instance = null
   Singleton.prototype.getName = function() {
       console.log(this.name)
   }
   
   Singleton.getInstance = function(name) {
       if(!this.instance) {
           this.instance = new Singleton(name)
       }
       return this.instance
   }
   
   const a = Singleton.getInstance('a')
   const b = Singleton.getInstance('b')
   
   console.log(a === b)
   ```

   

2. 透明的单例模式

   ```javascript
   let CreateDiv = (function () {
       let instance
       
       let CreateDiv = function(html) {
           console.log(instance)
           if(instance) return instance
           this.html = html
           this.init()
           return instance = this // 将实例指向instance
       }
       
       CreateDiv.prototype.init = function() {
           let div = document.createElement('div')
           div.innerHtml = this.html
           document.body.appendChild(div)
       }
       
       return CreateDiv
   })()
   
   const a = new CreateDiv('sven1')
   const b = new CreateDiv('sven2')
   
   console.log(a)
   console.log(b)
   console.log(a === b)
   ```

3. 使用代理实现单例模式

   ```javascript
   const CreateDiv = function(html) {
       this.html = html
       this.init()
   }
   
   CreateDiv.prototype.init = function() {
       const div = document.createElement('div')
       div.innerHtml = this.html
       document.body.appendChild(div)
   }
   
   // 代理类 保证instance 不污染全局
   const ProxySingletonCreateDiv = (function() {
       let instance
       // 借助闭包，第一次创建完成后不会销毁instance
       return function(html) {
           if(!instance) {
               instance = new CreateDiv(html)
           }
           return instance
       }
   })()
   
   // 使用
   const a = new ProxySingletonCreateDiv('seven1')
   const b = new ProxySingletonCreateDiv('seven2')
   
   console.log(a)
   console.log(b)
   console.log(a === b) // true
   ```

4. 惰性单例

   ```javascript
   Singleton.getInstance = (function() {
       // 因为闭包，导致instance不会被销毁，同时无需将instance 挂到Singleton上
   	let instance = null
       
       return function(props) {
           if(!instance) {
               instance = new Singleton(props)
           }
           return instance
       }
   })()
   ```

   

5. 通用的惰性单例

   ```javascript
   const getSingle = function(fn) {
       let result // 闭包导致result不会被销毁
   	return function() {
           return result || (result = fn.apply(this, arguments))
       }
   }
   ```

### 2.  实际应用场景

1. 项目中websocket实例对象，用于关闭、开启、接受消息、错误日志，所以考虑通过单例模式完成，大致代码如下

```javascript
export class SocketService {
  // 单例
  static instance = null

  static get Instance() {
    if (!this.instance) {
      this.instance = new SocketService()
    }

    return this.instance
  }
   ***
}

// 使用时直接SocketService.Instance 便可获取类实例对象
// const a = new SocketService.Instance()
```

2. 比如项目中需要对于localStorage/sessionStorage 进行数据操作时，我们也可以采用单例完成，大致代码如下

   ```javascript
   class StorageService {
       getItem(key) {
           return localStorage.getItem(key)
       }
       
       setItem(key, value) {
           return localStorage.setItem(key, value)
       }
       
       removeItem(key) {
           localStorage.removeItem(key)
       }
       
       clear() {
           localStorage.clear()
       }
   }
   
   const getStorageSingle = (() => {
       let instance = null
       return function() {
           if(!instance) {
               instance = new StorageService()
           }
           return instance
       }
   })()
   
   const a = getStorageSingle('a')
   const b = getStorageSingle('b')
   console.log(a === b)
   ```

   