---
title: promise all 错误捕获
date: 2022-12-30
categories: 
 - 日常整理
tags:
 - promise all
sidebar: auto
---

### 1. Promise.all处理并行请求的问题

日常开发中，一个页面初始化/进行某个action时需要调用多个接口，而这些接口不存在顺序执行（串行），所以我们优先考虑使用Promise.all完成请求，而Promise.all在处理并发请求时存在天然缺陷，如下

🌰:

```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('1')
    resolve('promise resolve 1')
  }, 1000)
})

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('2')
    resolve('promise resolve 2');
  }, 2000);
});

const p3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('promise reject 3');
  }, 500);
});

Promise.all([p3,p2,p1]).then(res => {
  console.log(res)
}).catch(err => {
  console.log(err)
})
```

上述代码运行结果如下

![](/my-blog/learn/promise/demo1.jpg)

**产生原因：**

**Promise.all**并发任务中存在一个**reject**时，那么返回的Promise会被catch捕获，导致整个并发的失败

我们存在这样的疑问，如果第一个Promise已经reject了，那么后续的Promise会被阻塞吗？修改下栗子1的代码

🌰：	

```javascript
const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('1')
    resolve('promise resolve 1')
  }, 1000)
})

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    console.log('2')
    resolve('promise resolve 2');
  }, 2000);
});

const p3 = new Promise((resolve, reject) => {
  setTimeout(() => {
    reject('promise reject 3');
  }, 500);
});

Promise.all([p3,p2,p1]).then(res => {
  console.log(res)
}).catch(err => {
  console.log(err)
})
```

上述代码结果如下

![](/my-blog/learn/promise/demo2.jpg)



> Promise.all中所有Promise都会执行，也就是说Promise状态最终都会是fulfilled/rejected

Promise.all 大致实现思路如下

```javascript
  return new MyPromise((resolve, reject) => {
    /**
     * 返回值的集合
     */
    let values = []
    let count = 0
    for (let [i, p] of list.entries()) {
      // 数组参数如果不是MyPromise实例，先调用MyPromise.resolve
      this.resolve(p).then(res => {
        values[i] = res
        count++
        // 所有状态都变成fulfilled时返回的MyPromise状态就变成fulfilled
        if (count === list.length) resolve(values)
      }, err => {
        // 有一个被rejected时返回的MyPromise状态就变成rejected
        reject(err)
      })
    }
  })
```

### 2. 如何解决

1. 借助async...await + try ... catch 解决（推荐）

   ```javascript
   const p1 = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve('promise resolve 1')
     }, 1000)
   })
   
   const p2 = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve('promise resolve 2');
     }, 2000);
   });
   
   const p3 = new Promise((resolve, reject) => {
     setTimeout(() => {
       reject('promise reject 3');
     }, 3000);
   });
   
   Promise.all([p1,p2,p3]).then(res => {
     console.log(res)
   }).catch(err => {
     console.log(err)
   })
   
   async function promiseWithError (promiseInstance) {
     try{
       const res = await promiseInstance
       return {
         success: true,
         data: res
       }
     } catch {
       return {
         success: false
       }
     }
   }
   
   const res = await Promise.all([p1, p2, p3].map(item => promiseWithError(item)))
   
   console.log(res)
   
   /* Promise.all([p1, p2, p3].map(item => promiseWithError(item)))
     .then(res => {
       console.log('resolve:', res);
     })
     .catch(err => {
       console.log('reject:', err);
     });
   */
   ```

   

2. 队列的promise使用catch捕获异常

   ```javascript
   const p1 = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve('promise resolve 1')
     }, 1000)
   }).catch(function(err) {
     return err;
   });
   
   const p2 = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve('promise resolve 2');
     }, 2000);
   }).catch(function(err) {
     return err;
   });
   
   const p3 = new Promise((resolve, reject) => {
     setTimeout(() => {
       reject('promise reject 3');
     }, 3000);
   }).catch(function(err) {
     console.log(err)
     return err;
   });
   
   Promise.all([p1,p2,p3]).then(res => {
     console.log(res)
   }).catch(err => {
     console.log(err)
   })
   
   // 打印 ['promise resolve 1', 'promise resolve 2', 'promise reject 3']
   ```

   

3. 使用Promise.allSettled （浏览器兼容性问题）

   ```javascript
   const p1 = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve('promise resolve 1')
     }, 1000)
   })
   
   const p2 = new Promise((resolve, reject) => {
     setTimeout(() => {
       resolve('promise resolve 2');
     }, 2000);
   });
   
   const p3 = new Promise((resolve, reject) => {
     setTimeout(() => {
       reject('promise reject 3');
     }, 3000);
   });
   
   Promise.allSettled([p1, p2, p3])
   .then(res => {
     console.log('resolve:', res);
   })
   .catch(err => {
     console.log('reject:', err);
   });
   
   // 最终输出为：
   // resolve: [{ status: "fulfilled", value: "promise resolve 1" }, { status: "fulfilled", value: "promise resolve 2"}, { status: "rejected", reason: "promise reject 3"} ]
   
   ```

   



