---
title: 轮询
date: 2023-04-04
categories: 
 - 日常整理
tags:
 - polling
sidebar: auto
---

## 1. 思路

1. 通过`setTimeout`来进行延时控制，因为`setInterval`会造成，异步请求未完成，又发出下一次请求
2. 暴露出`start`,`stop`，用于手动控制开启轮询、停止轮询
3. 需要等待异步请求`callback`完毕，开启下一次请求

## 2. 代码

```javascript
const pollRequest = (callback, pollTime = 3000) => {
    let timer, isStop = false

    const start = async () => {
        isStop = false
        await loop()
    }
    
    const stop = () => {
        isStop = true
        clearTimeout(timer)
    }
    
    const loop = async () => {
        try {
            await callback()
        } catch(error) {
            throw new Error(error)
        }
        if(isStop) return
        return (timer = setTimeout(loop, pollTime))
    }
    
    return {
        start,
        stop
    }
}
```

## 3. node 搭个简单的服务

```javascript
const http = require('http');

const server = http.createServer()

server.on('request', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.status = 200
    res.end()
    return
  }

  if(req.url === '/polling') {
    res.end(JSON.stringify({
      code: '0',
      success: true,
      list: [{ id: 1, name: '测试', age: 20 }]
    }))
    return
  }
})

server.listen(3030, () => {
  console.log('服务启动');
})
```

## 4. 静态页面

```javascript
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <button onclick="handlePollReq()">轮询接口</button>
  <script>
    const pollRequest = (callback, pollTime = 3000) => {
      let timer, isStop = false

      const start = async () => {
          isStop = false
          await loop()
      }
      
      const stop = () => {
          isStop = true
          clearTimeout(timer)
      }
      
      const loop = async () => {
          try {
              await callback()
          } catch(error) {
              throw new Error(error)
          }
          if(isStop) return
          return (timer = setTimeout(loop, pollTime))
      }
      
      return {
        start,
        stop
      }
    }
    const request = ({
      url,
      method,
      data,
      headers = {}
    }) => {
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest()

        xhr.open(method, url)

        Object.keys(headers).forEach((key) => {
          xhr.setRequestHeader(key, headers[key]);
        });

        xhr.send(data)

        xhr.onload = (e) => {
          resolve({
            data: e.target.response
          });
        };
      })
    }

    const fetchList = async () => {
      try {
        const res = await request({
          url: 'http://localhost:3030/polling',
          method: 'GET',
          headers: {
            'Content-type': 'application/json'
          },
        })
        console.log(JSON.parse(res.data))
      } catch (error) {
        pollingInstance.stop()
      }
    }

    const pollingInstance = pollRequest(fetchList, 3000)

    const handlePollReq = () => {
      pollingInstance.start()
    }
  </script>
</body>
</html>
```

## 5. 效果

![polling](/my-blog/learn/polling/polling.jpg)