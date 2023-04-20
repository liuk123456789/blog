---
title: 发布订阅模式
date: 2023-02-01
categories: 
 - design partten
tags:
 - observer
sidebar: auto
---

## 什么是发布订阅模式

> 发布—订阅模式又叫观察者模式，它定义对象间的一种一对多的依赖关系，当一个对象的状
>
> 态发生改变时，所有依赖于它的对象都将得到通知。在 JavaScript 开发中，我们一般用事件模型
>
> 来替代传统的发布—订阅模式。

**发布订阅模式的现实案例**

小明最近看上了一套房子，到了售楼处之后才被告知，该楼盘的房子早已售罄。好在售楼

MM 告诉小明，不久后还有一些尾盘推出，开发商正在办理相关手续，手续办好后便可以购买。但到底是什么时候，目前还没有人能够知道。于是小明记下了售楼处的电话，以后每天都会打电话过去询问是不是已经到了购买时间。除了小明，还有小红、小强、小龙也会每天向售楼处咨询这个问题。一个星期过后，售楼 MM 决定辞职，因为厌倦了每天回答 1000 个相同内容的电话。

当然现实中没有这么笨的销售公司，实际上故事是这样的：小明离开之前，把电话号码留在

了售楼处。售楼 MM 答应他，新楼盘一推出就马上发信息通知小明。小红、小强和小龙也是一

样，他们的电话号码都被记在售楼处的花名册上，新楼盘推出的时候，售楼 MM 会翻开花名册，

遍历上面的电话号码，依次发送一条短信来通知他们。

## 发布订阅模式实现售楼案例

1. 第一版

   ```javascript
   class SalesOfficesClass {
       clientList = []
       
       static instance = null
       
       // 做个单例
       static get Instance() {
           if(!this.instance) {
               this.instance = new SalesOfficesClass()
           }
           return this.instance
       }
       
       // 添加订阅者
       listen(fn) {
           this.clientList.push(fn)
       }
       
       // 发布消息
       trigger() {
           for(const fn of this.clientList) {
               fn.apply(this, arguments)
           }
       }
   }
   ```

   测试下

   ```javascript
   const salesOfficesInstance = SalesOfficesClass.Instance
   
   // 添加订阅者1
   salesOfficesInstance.listen((price,squareMeter) => {
       console.log('价格= ', price)
       console.log( 'squareMeter= ' + squareMeter )
   })
   
   // 添加订阅者2
   salesOfficesInstance.listen((price,squareMeter) => {
       console.log('价格= ', price)
       console.log( 'squareMeter= ' + squareMeter )
   })
   
   // 发布消息
   salesOfficesInstance.trigger(2000000, 100)
   salesOfficesInstance.trigger(2400000, 120)
   ```

   问题：

   1. 添加订阅者无法区分标识
   2. trigger触发都会触发两次

2. 给订阅者添加标识key

   ```javascript
   class SalesOfficesClass {
       clientList = {}
       
       static instance = null
       
       // 做个单例
       static get Instance() {
           if(!this.instance) {
               this.instance = new SalesOfficesClass()
           }
           return this.instance
       }
       
       // 添加订阅者
       listen(key,fn) {
           if(!this.clientList[key]) {
               this.clientList[key] = []
           }
           this.clientList[key].push(fn)
       }
       
       // 发布消息
       trigger() {
           const args = Array.from(arguments)
           const key = args.shift()
           const fns = this.clientList[key]
           if(!fns || !fns.length) return false
          
           for(const fn of fns) {
               console.log(arguments)
               fn.apply(this, args)
           }
       }
   }
   ```

   测试下上述功能

   ```javascript
   const salesOfficesInstance = SalesOfficesClass.Instance
   
   // 添加订阅者1
   salesOfficesInstance.listen('squareMeter100', (price) => {
       console.log('价格= ', price)
   }))
   
   // 添加订阅者2
   salesOfficesInstance.listen('squareMeter120',(price) => {
       console.log('价格= ', price)
   }))
   
   // 发布消息
   salesOfficesInstance.trigger('squareMeter100', 2000000) // 价格= 2000000
   salesOfficesInstance.trigger('squareMeter120', 2400000) // 价格= 2400000
   ```

## 发布订阅的通用版本

需要考虑以下几个

1. Publisher: 发布者，消息发生时负责通知订阅者
2. Subscriber: 订阅者，当消息发生时被通知的对象
3. SubscriberMap: 持有不同type的数组，存储所有的订阅者的数组
4. type: 消息类型，订阅者可以订阅不同的消息类型
5. subscribe: 该方法为订阅者添加到SubscriberMap中的对应的数组中
6. unSubscribe: 该方法为SubscribeMap中删除订阅者
7. notify：该方法遍历通知SubscribeMap中对应type的每个订阅者

```javascript
class EventEmitter {
    static instance = null
    constructor() {
        this.subscriber = {}
    }
    
    // 做个单例
    static get Instance() {
        if(!this.instance) {
            this.instance = new EventEmitter()
        }
        return this.instance
    }
    
    subscribe(key, fn) {
        if(!this.subscriber[key]) {
            this.subscriber[key] = []
        }
        this.subscriber[key].push(fn) // 订阅消息添加进缓存列表
    }
    
    notify() {
        const args = Array.from(arguments)
        const key = args.shift()
        const fns = this.subscriber[key]
        if(!fns || !fns.length) return false
        
        for(const fn of fns) {
            fn.apply(this, args)
        }
    }
    
    unsubscribe(key, fn) {
       const fns = this.subscriber[key]
       if(!fns) { // 如果key对应的消息没有被人订阅，则直接返回
           return false
       }
        
        if(!fn) { // 如果没有传入fn,那么意思就是取消key的所有订阅
            fns && (fns.length = 0)
        } else {
            const idx = fns.findIndex(_fn => _fn === fn)
            if(idx > -1) fns.splice(idx, 1)
        }
    }
}
```

测试下上述功能

```javascript
const salesOfficesInstance = EventEmitter.Instance

// 添加订阅者1
salesOfficesInstance.subscribe('squareMeter100', fn1 = (price) => {
    console.log('价格= ', price)
})

// 添加订阅者2
salesOfficesInstance.subscribe('squareMeter100', fn2 = (other) => {
    console.log('价格2= ', other)
})

salesOfficesInstance.unsubscribe('squareMeter100', fn2)

// 发布消息
salesOfficesInstance.notify('squareMeter100', 2000000) // 价格= 2000000
```

## 命令空间的问题

```javascript
const DEFAULT_LAST_KEY = 'last'

class EventEmitter {
    static instance = null
    static nameSpaceCache = {}
    static namespace = '_default'

    constructor() {
        this.subscriber = {}
        this.offlineStack = []
    }
    
    // 做个单例
    static get Instance() {
        return new EventEmitter()
    }
    
    subscribe(key, fn) {
        if(!this.subscriber[key]) {
            this.subscriber[key] = []
        }
        this.subscriber[key].push(fn) // 订阅消息添加进缓存列表
    }
    
    notify() {
        const args = Array.from(arguments)
        const key = args.shift()
      	const fns = this.subscriber[key]
        if(!fns || !fns.length) {
            return
        }
        
        for(const fn of fns) {
            fn.apply(this, args)
        }
    }
    
    unsubscribe(key, fn) {
       const fns = this.subscriber[key]
       if(fns) {
           if(fn) {
               const idx = fns.findIndex(_fn => _fn === fn)
               if(idx > -1) {
                 fns.splice(idx, 1)   
               }
           } else {
               fns = []
           }
       }
    }
    // 创建命名空间
    static create(namespace) {
        namespace = namespace || this.namespace
        this.nameSpaceCache[namespace] = this.nameSpaceCache[namespace] || this.Instance
        return this.nameSpaceCache[namespace]
    }
}
```

测试上述结果

```javascript
EventEmitter.create('namespace1').subscribe('click', function(a) {
    console.log(a) // 1
})
EventEmitter.create('namespace1').notify('click',1)

EventEmitter.create('namespace2').subscribe('click', function(a) {
    console.log(a) // 2
})
EventEmitter.create('namespace2').notify('click', 2)
```



## 实际应用

1. vue-bus

   ```javascript
   const install = function(Vue) {
       const Bus = new Vue({
           methods: {
               emit(event, ...args) {
                   this.$emit(event, ...args)
               },
               on(event, callback) {
                   this.$on(event, callback)
               },
               off(event, callback) {
                   this.$off(event, callback)
               }
           }
       })
       
       Vue.prototype.$bus = Bus
   }
   
   export default install
   ```

2. vuex（截取代码片段）

   ```javascript
   export class Store {
       constructor(options = {}) {
           ***
           // subscriber
           this._subscribers = []
           ***
       }
     // publisher      
     commit (_type, _payload, _options) {
   	***
       // notify
       this._subscribers
         .slice() // shallow copy to prevent iterator invalidation if subscriber synchronously calls unsubscribe
         .forEach(sub => sub(mutation, this.state))
   	***
     }
     // subscribe
     subscribe (fn, options) {
       return genericSubscribe(fn, this._subscribers, options)
     }
   }
   ```
