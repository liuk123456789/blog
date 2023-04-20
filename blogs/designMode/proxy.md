---
title: 代理模式
date: 2023-02-01
categories: 
 - design partten
tags:
 - proxy
sidebar: auto
---

## 什么是代理模式

> 代理模式给某一个对象提供一个代理对象或者占位符，并由代理对象控制原对象的引用，也可以理解为对外暴露的接口并不是原对象。通俗地讲，生活中也有比较常见的代理模式：中介、寄卖、经纪人等等。而这种模式存在的意义在于当访问者与被访问者不方便直接访问/接触的情况下，提供一个替身来处理事务流程，实际访问的是替身，替身将事务做了一些处理/过滤之后，再转交给本体对象以减轻本体对象的负担。

## 保护代理

> 保护代理，顾名思义是为了保护本体
>
> 基于权限控制对资源的访问

下面用一个场景和例子来实际感受一下，基于上面最简代理模式进行扩展，我们可以使用保护代理实现，过滤未通过身份校验的请求、监听服务端 ready 才发送请求等操作，保护实体服务端不被非法请求攻击和降低服务端负担。

```javascript
const proxy = {
    receiveRequest: (request) => {
        // 校验身份
        const pass = validatePassport(request)
        if(pass) {
            server.listenReady(() => {
                console.log('proxy request', request)
                server.handleRequest(request)
            })
        }
    }
}
```

## 虚拟代理

> 虚拟代理作为创建开销大的对象的代表，协助控制创建开销大的资源，直到真正需要一个对象的时候再去创建它，由虚拟代理来扮演对象的替身，对象创建后，再将资源直接委托给实体对象

1. 虚拟代理实现图片懒加载

   ```javascript
   const myImg = (() => {
       const imgNode = document.createElement('img')
       document.body.appendChild(imgNode)
       
       return {
           setSrc: (src) => {
               imgNode.src = src
           }
       }
   })
   
   const proxyImg = (() => {
       const img = new Image
       img.onload = function () {
           myImg.setSrc(this.src)
       }
       
       return {
           setSrc:(src) => {
               myImg.setSrc('***/loading.gif')
               img.src = src
           }
       }
   })()
   proxyImg.serSrc('http:// imgcache.qq.com/music/photo/k/000GGDys0yA0Nk.jpg')
   ```

2. 虚拟代理合并http请求

   页面中有一个文件列表，当点击文件对应的 checkbox 之后，该文件将被传输。

   如果我们点击的足够快，会有频繁的网络请求，这将带来相当大的开销。

   我们使用 proxySynchronousFile 来收集2s内的请求，最后一次性进行传输。

   ```javascript
   const synchronousFile = function(ids) {
       // 文件传输
   }
   
   const proxySynchronousFile = (function() {
     const fileArray = []
     let timer
     return function(id) {
         fileArray.push(id)
         // 倒计时未完成
         if(timer) return
         timer = setTimeout(() => {
             synchronousFile(fileArray.join(','))
             clearTimeout(timer)
             timer = null
             fileArray.length = 0
         }, 2000)
     }
   })()
   const checkedIds = document.getElementByTagName('input')
   for(let checkbox of checkboxes) {
       checkbox.onclick = function() {
           if(this.checked) {
               proxySynchronousFile(this.id)
           }
       }
   }
   ```

## 代理模式应用

1. 缓存代理

   ```javascript
   const complexFn = (x) => {
       ...
       return res;
   }
   
   const getKeyName = (x) => {
       ...
       return key;
   }
   
   const proxyFn = (function() {
       const resMap = {}
       return function(x) {
           const keyName = getKeyName(x);
           if(resMap[keyName]) {
               return resMap[keyName]
           }
           return resMap[keyName] = complexFn(x)
   })()
   ```

2. 使用高阶函数动态创建代理

   ```javascript
   const mul = function() {
       let res = 1
       for(let i = 0; i < arguments.length; i++) {
           res *= arguments[i]
       }
       return res
   }
   
   const plus = function() {
       let res = 0
       for(let i = 0; i < arguments.length; i++) {
           res += arguments[i]
       }
       return res
   }
   
   // 创建缓存代理的工厂
   const createProxyFactory = function(fn) {
       const cache = {}
       return function() {
           const args = Array.prototype.join.call(arguments, ',')
           if(args in cache) {
               return cache[args]
           }
           return cache[args] = fn.apply(this, arguments)
       }	
   }
   
   // 使用
   const proxyMul = createProxyFactory(mul)
   const proxyPlus = createProxyFactory(plus)
   
   console.log(proxyMul(1,2,3,4))
   console.log(proxyMul(1,2,3,4))
   console.log(proxyPlus(1,2,3,4))
   console.log(proxyPlus(1,2,3,4))
   ```
