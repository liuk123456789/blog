---
title: 并发控制
date: 2023-04-06
categories: 
 - 日常整理
tags:
 - 并发控制
sidebar: auto
---

## 1. 异步并发控制

在项目开发中，我们可能会遇到这种场景，就是需要控制下一次最多的并发请求数，所以，我们需要实现下这个功能

## 2. 思路

1. 通过参数limit 限制下最大并发数量
2. 如果请求池中的任务执行完成（不论成功还是失败），将请求从请求池中删除，否则添加进请求池
3. 判定下请求池的数量是否超过，最大并发数量，如果超过的话，那么等待连接池中的请求完成

## 3. 代码

```typescript
async function asyncPool(poolLimit: number, tasks: () => Promise<any>[]) {
    const res = []
    const executing = new Set()
    for(const task of tasks) {
        const p = Promise.resolve().then(task)
        res.push(p)
        executing.add(p)
        const clean = () => executing.delete(p)
        p.then(clean).catch(clean)
        // 如果异步池满了，那么需要等待异步池中的异步任务存在完结时，在进行push
        if(executing.size >= poolLimit) {
            await Promise.race(executing)
        }
    }
    // 返回所有的异步结果
    return Promise.all(res)
}
```

## 4. 测试

```javascript
const mockTaks = (n: number, name: string): Promise<{n: number, name: string}> => {
  return new Promise(resolve => {
    console.log(n, name, 'start');
    setTimeout(() => {
      console.log(n ,name, 'end')
      resolve({n, name})
    }, n * 1000);
  })
}

const start = async (): Promise<void> => {
  await asyncPool(2, [
    () => mockTaks(1, '吃饭'),
    () => mockTaks(3, '睡觉'),
    () => mockTaks(5, '上厕所'),
    () => mockTaks(3.5, '摸鱼'),
    () => mockTaks(4, '上班')
  ]);
  console.log('结束')
}

start()
```

结果如下

![poll-test](/my-blog/learn/async-poll/poll-test.png)
