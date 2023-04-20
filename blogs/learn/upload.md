---
title: 大文件上传、断点续传
date: 2023-03-27
categories: 
 - 日常整理
tags:
 - file upload
sidebar: auto
---

## 1. 前言
这是掘金上的一篇热文，针对大文件上传，因为后端使用的是`node`,所以感觉非常的契合前端开发，整理了作者思路，以及完成过程中的注意点，所以记录下

## 2. 流程图

![upload-flow](/my-blog/learn/upload/upload-flow.png)

## 3. 客户端

为了减少样式以及快速布局，选择`vue` + `element`完成

```vue
<template>
	<div id="app">
        <input type="file" @change="onFileChange" />
        <el-button type="primary" @click="handleUpload">上传</el-button>
    </div>
</template>

<script>
	export default {
        data() {
            return {
               container: {
                   file: null
               } 
            }
        },
        methods: {
            onFileChange(e) {
                const file = e.target.file[0]
                this.container.file = file
            }
        }
    }
</script>
```

首先我们拿到文件对象，点击上传时，对文件进行分片处理

### 文件分片 Blob.slice

```vue
<template>
	<div id="app">
        <input type="file" @change="onFileChange" />
        <el-button type="primary" @click="handleUpload">上传</el-button>
    </div>
</template>

<script>
    const SIZE = 5 * 1024 * 1024
	export default {
        data() {
            return {
               container: {
                   file: null
               } 
            }
        },
        methods: {
            onFileChange(e) {
                const file = e.target.file[0]
                this.container.file = file
            },
            handleUpload() {
                // 判定下文件是否为null
                if(!this.container.file) return
                
                // 分片
                const fileChunkList = this.createFileChunk(this.container.file)
            },
            // size 分片的每片大小
            createFileChunk(file, size = SIZE) {
                const fileChunkList = []
                let cur = 0
                while(cur < file.size) {
                    // Blob.slice 方法和数组的slice 方法相似
                    fileChunkList.push({file: file.slice(cur, cur + size)})
                    cur += size
                }
                
                return fileChunkList
            }
        }
    }
</script>
```

### XMLHttpRequest 请求封装

```javascript
export const request = ({
    url,
    method,
    data,
    headers = {},
    requestList,
    onProgress
}) => {
    return new Promise((resolve) => {
        const xhr = new XMLHttpRequest()
        
        xhr.open(method, url)
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key])
        })
        xhr.upload.onprogress = onProgress
        xhr.send(data)
    })
}
```

### 文件hash

1. 因为文件容量过大，导致文件`hash`计算时间过程，所以使用`Web Worker`计算文件`hash`
2. 使用`spark-md5`计算文件`hash`

代码如下:

```javascript
self.importScripts('/spark-md5.min.js')

self.onmessage = e => {

  const spark = new self.SparkMD5.ArrayBuffer()

  const {fileChunkList} = e.data

  console.log(fileChunkList)

  let count = 0
  let percentage = 0;

  const loadNext = index => {
    const reader = new FileReader()
    // 解析Blob
    reader.readAsArrayBuffer(fileChunkList[index].file)

    reader.onload = e => {
      count++;
      spark.append(e.target.result)
      if (count === fileChunkList.length) {
          self.postMessage({
              percentage: 100,
              hash: spark.end(),
          });
          self.close();
      } else {
          percentage += 100 / fileChunkList.length;
          self.postMessage({
              percentage,
          });
          loadNext(count);
      }
    }
  }
  loadNext(0)
}
```

监听`Web Worker`

```vue
<template>
</template>

<script>
export default {
    data() {
        return {
            container: {
                file: null,
                hash: null,
                worker: null
            },
            data: []
        }
    },
    methods: {
        async calculateHash(fileChunkList) {
            return new Promise(resolve => {
                this.container.worker = new Worker('/hash.js')
                this.container.worker.postMessage({ fileChunkList })
                
                this.container.worker.onmessage = e => {
                    const { hash, percentage } = e.data
                    this.percentage = percentage
                    
                    if(hash) resolve(hash)
                }
            })
        }
    }
}
</script>
```

## 文件hash进度条显示

```vue
<template>
	<div id="app">
    <input type="file" @change="onFileChange" />
    <el-button type="primary" @click="handleUpload">上传</el-button>
    <div>
      <!-- 显示文件hash进度条 -->
      <div>计算文件hash</div>
      <el-progress :percentage="hashPercentage"></el-progress>
    </div>
  </div>
</template>
```

完成以上部分，可以看下当前的效果

![upload-test](/my-blog/learn/upload/upload-test.jpg)

接下来,我们开始切片上传

### 上传切片

```vue
<template>
	<div id="app">
        <input type="file" @change="onFileChange" />
        <el-button type="primary" @click="handleUpload">上传</el-button>
    </div>
</template>

<script>
  // 引入request
  import { request } from './utils/util'

  const SIZE = 5 * 1024 * 1024
	export default {
        data() {
            return {
               container: {
                   file: null
               },
               data: []
            }
        },
        methods: {
            onFileChange(e) {
                const file = e.target.file[0]
                this.container.file = file
            },
            async handleUpload() {
                // 判定下文件是否为null
                if(!this.container.file) return
                
                // 分片
                const fileChunkList = this.createFileChunk(this.container.file)
                
                this.container.hash = await this.calculateHash(fileChunkList)
                
                this.data = fileChunkList.map(({file}, index) => ({
                    chunk: file,
                    hash:`${this.container.file.name}-${index}`
                }))
                // 上传切片
                await this.uploadChunks()
            },
            
            async uploadChunks() {
                const requestList = this.data.map(({chunk, hash}) => {
                    const formData = new FormData()
                    formData.append('chunk', chunk)
                    formData.append('hash', hash)
                    formData.append('filename', this.container.file.name)
                    return { formData }
                }).map(async ({ formData }) => {
                  try {
                    await request({
                      url: 'http://localhost:3030/',
                      method: 'POST',
                      data: formData
                    })
                  } catch (error) {
                    this.$message.warning(error.message || error)
                  }
                })
				// 并发请求
                await Promise.all(requestList)
            }
        }  
    }
</script>
```

我们把`chunk`处理成`formData`对象

## 4. 服务端

### http

```javascript
const http = require('http')

const server = http.createServer()

server.on('request', async(req, res) => {
  // 跨域处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // put delete 等预检请求  
  if(req.method === 'OPTIONS') {
    res.status = 200
    res.end()
    return
  }
})

server.listen(3030, () => {
    console.log('服务启动')
})
```

可以全局安装`nodemon`省的每次修改服务代码都要进行重新启动

```powershell
npm i -g nodemon
```

服务启动效果如下

![upload-server](/my-blog/learn/upload/server-listen.jpg)

### 切片处理

```javascript
const http = require('http')

const server = http.createServer()

const Controller = require('./controller')

const controller = new Controller()

server.on('request', async(req, res) => {
  // 跨域处理
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // put delete 等预检请求  
  if(req.method === 'OPTIONS') {
    res.status = 200
    res.end()
    return
  }

  // 上传切片处理  
  if(req.url === '/') {
    // 我们还是采用controller 控制分层来优化代码
    await controller.handleFormData(req, res)
    return
  }
})

server.listen(3030, () => {
    console.log('服务启动')
})
```

#### handleFormData

```javascript
// 可以处理文件上传&post的请求（解析请求体）的包
const multiparty = require('multiparty')

// 文件目录 当前目录下的target目录
const UPLOAD_DIR = path.resolve(__dirname, "./target")

async handleFormData(req, res) {
    const multipart = new multiparty.Form()
    multipart.parse(req, async (err, fields, files) => {
      if(err) {
        res.status = 500
        res.end('process file chunk failed')
        return
      }
      const [chunk] = files.chunk // 拿到文件块
      const [hash] = fields.hash // 文件hash
      const [filename] = fields.filename // 文件名
      const [fileHash] = fields.fileHash // chunkHash

      // UPLOAD_DIR 目录下的 fileHash目录
      const chunkDir = path.resolve(UPLOAD_DIR, fileHash)

      if(!fse.existsSync(chunkDir)) {
        await fse.mkdirs(chunkDir)
      }

      // Blob 写入文件目录
      await fse.move(chunk.path, path.resolve(chunkDir, hash))

      res.end("received file chunk")
    })
}
```

效果如下

![upload-chunk](/my-blog/learn/upload/upload-chunk.jpg)

接下来,我们需要合并`chunk`,生成文件,我们调整客户端和服务端代码

#### **客户端**

```javascript
<template>
	<div id="app">
        <input type="file" @change="onFileChange" />
        <el-button type="primary" @click="handleUpload">上传</el-button>
    </div>
</template>

<script>
  // 引入request
  import { request } from './utils/util'

  const SIZE = 5 * 1024 * 1024
	export default {
        data() {
            return {
               container: {
                   file: null
               },
               data: []
            }
        },
        methods: {
            onFileChange(e) {
                const file = e.target.file[0]
                this.container.file = file
            },
            async handleUpload() {
                // 判定下文件是否为null
                if(!this.container.file) return
                
                // 分片
                const fileChunkList = this.createFileChunk(this.container.file)
                
                this.container.hash = await this.calculateHash(fileChunkList)
                
                this.data = fileChunkList.map(({file}, index) => ({
                    chunk: file,
                    hash:`${this.container.file.name}-${index}`
                }))
                // 上传切片
                await this.uploadChunks()
            },
            
            async uploadChunks() {
                const requestList = this.data.map(({chunk, hash}) => {
                    const formData = new FormData()
                    formData.append('chunk', chunk)
                    formData.append('hash', hash)
                    formData.append('filename', this.container.file.name)
                    return { formData }
                }).map(async ({ formData }) => {
                  try {
                    await request({
                      url: 'http://localhost:3030/',
                      method: 'POST',
                      data: formData
                    })
                  } catch (error) {
                    this.$message.warning(error.message || error)
                  }
                })
				// 并发请求
                await Promise.all(requestList)
                // 合并切片
                await this.mergeRequest()
            },
            
            // 发送合并分片请求
            async mergeRequest() {
                await request({
                  url: 'http://localhost:3030/merge',
                  method: 'POST',
                  headers: {
                    'content-type': 'application/json'
                  },
                  data: JSON.stringify({
                    size: SIZE,
                    fileHash: this.container.hash,
                    filename: this.container.file.name
                  })
                })
             }
        } 
    }
</script>
```

#### **服务端**

入口文件增加路由匹配

```javascript
const http = require('http')

const Controller = require('./controller')

const controller = new Controller()

const server = http.createServer()

server.on('request', async(req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if(req.method === 'OPTIONS') {
    res.status = 200
    res.end()
    return
  }

  if(req.url === '/') {
    // 上传切片处理
    await controller.handleFormData(req, res)
    return
  }

  if(req.url === '/merge') {
    await controller.handleMerge(req, res)
    return
  }
})

server.listen(3030, () => {
  console.log('服务启动')
})
```

#### **handleMerge**

1. 解析POST(body-parse)传递参数
2. 获取上传的所有切片（注意排序）
3. 通过`createReadStream`读取切片，完成后通过`unlinkSync`删除切片
4. 将可读流写入可写流
5. `createWriteStream`写入文件

```javascript
const extractExt = filename => {
  return filename.slice(filename.lastIndexOf('.'), filename.length)
}

const resolveParse = req => {
  return new Promise(resolve => {
    let chunk = ""
    req.on("data", data => {
      chunk += data
    })

    req.on("end", () => {
      resolve(JSON.parse(chunk))
    })
  })
}

const pipeStream = (path, writeStream) => {
  new Promise(resolve => {
    // 可读流
    const readStream = fse.createReadStream(path)
    readStream.on('end', () => {
      fse.unlinkSync(path);
      resolve()
    })
    // 将可写流 流入 可读流
    readStream.pipe(writeStream)
  })
}

const mergeFileChunk = async (filePath, fileHash, size) => {
    const chunkDir = path.resolve(UPLOAD_DIR, fileHash)
    // chunks
    const chunkPaths = await fse.readdir(chunkDir)
    chunkPaths.sort((a, b) => a.split("-")[1] - b.split("-")[1])
    
    await Promise.all(chunkPaths.map((chunkPath, index) => {
        pipeStream(path.resolve(chunkDir, chunkPath), fse.createWriteStream(filePath, {
            start: index * size,
            end: (index + 1) * size
        }))
    }))
}

async handleMerge(req, res) {
    const data = await resolveParse(req)
    
    const { fileHash, filename, size } = data
    const ext = extractExt(filename)
    
    const path = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)
    
    await mergeFileChunk(filePath, fileHash, size)
    
    res.end(JSON.stringify({
        code: '0',
        message: 'file merged success'
    }))
}
```

效果如下

![upload-merge](/my-blog/learn/upload/upload-merge.jpg)

## 5. 秒传

通过查找`target`是否存在前上传文件（hash比对），便是秒传

### 客户端

增加`verify`请求，通过服务端秒传判定

```vue
<template>
</template>

<script>
export default {
    methods: {
        async verifyUpload(filename, fileHash) {
           const { data } = await request({
             url: 'http://localhost:3030/verify',
             method: 'POST',
             headers: {
              'Content-type': 'application/json'
             },
             data: JSON.stringify({
                filename,
                fileHash
             })
           })
           return JSON.parse(data)
        },
        async handleUpload() {
          if(!this.container.file) return
          this.status = STATUS_ENUM.UPLOADING

          // 分片
          const fileChunkList = this.createFileChunk(this.container.file)

          // 计算hash
          this.container.hash = await this.calculateHash(fileChunkList)

          // 文件hash 没必要上传同一个文件多次 {shouldUpload, uploadList}
          const { shouldUpload, uploadedList } = await this.verifyUpload(this.container.file.name, this.container.hash)

          // 是否已经上传过
          if(!shouldUpload) {
            this.$message.success('秒传：上传成功')
            this.status = STATUS_ENUM.WAITING
            return
          }

          this.data = fileChunkList.map(({file}, index) => ({
            fileHash: this.container.hash,
            index,
            hash: `${this.container.hash}-${index}`, // 分片hash
            chunk: file,
            size: file.size,
            percentage: uploadedList.includes(index) ? 100 : 0 // 当前切片是否已经上传过
          }))

          await this.uploadChunks(uploadedList)
        },
    }
}
</script>
```

### 服务端

增加`verify`的路由判定&`verify`的controller

```javascript
const http = require('http')

const Controller = require('./controller')

const controller = new Controller()

const server = http.createServer()

server.on('request', async(req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if(req.method === 'OPTIONS') {
    res.status = 200
    res.end()
    return
  }

  if(req.url === '/verify') {
    await controller.handleVerifyUpload(req, res)
    return
  }
})

server.listen(3000, () => {
  console.log('服务启动')
})

```

#### **handleVerifyUpload**

```javascript
// 读取已经上传的切片名称
const createUploadedList = async fileHash => {
  fse.existsSync(path.resolve(UPLOAD_DIR, fileHash))
  ? await fse.readdir(path.resolve(UPLOAD_DIR, fileHash)) : []
}

async handleVerifyUpload(req, res) {
    const { fileHash, filename } = await resolveParse(req)
    const ext = extractExt(filename)

    const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)

    if(fse.existsSync(filePath)) {
      res.end(JSON.stringify({shouldUpload: false}))
    } else {
      res.end(JSON.stringify({
          shouldUpload: true, 
          uploadedList: await createUploadedList(fileHash)
      }))
    }
}
```

效果如下

![upload-direct](/my-blog/learn/upload/upload-direct.jpg)

## 6. chunk的进度条配置

1. request增加onProgress，用于监听上传进度
2. 通过onProgress返回的loaded和总大小对比，获得当前进度

### 客户端

```vue
<script>
export default {
  methods: {
    async uploadChunks() {
      const requestList = this.data.map(({chunk, hash, index}) => {
        const formData = new FormData()
        formData.append('chunk', chunk)
        formData.append('hash', hash)
        formData.append('filename', this.container.file.name)
        formData.append('fileHash', this.container.hash)
        
        return { formData, index }
      }).map(async({formData, index}) => {
        try{
          await request({
            url: 'http://localhost:3000',
            method: 'POST',
            data: formData,
            onProgress: this.createProgressHandler(this.data[index])
          })
        }catch(error) {
          console.error('reject:', error)
        }
      })
      
      await Promise.all(requestList)
      
      // 发送合并请求
      await mergeRequest()
    },
    
    createProgressHandler(item) {
      return e => {
        item.percentage = parseInt(String(e.loaded / e.total) * 100)
      }
    }
  }
}
</script>
```

## 7. 断点续传

利用`XMLHttpRequest`的`abort`方法，可以取消一个`xhr`请求，所以需要增加一个参数保存`xhr`，改造下`request`请求方法

```javascript
export const request = ({
  url,
  method,
  data,
  headers = {},
  requestList,
  onProgress
}) => {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method, url);
    Object.keys(headers).forEach((key) => {
      xhr.setRequestHeader(key, headers[key]);
    });
    xhr.upload.onprogress = onProgress;
    xhr.send(data);

    xhr.onload = (e) => {
      if (requestList) {
        // 响应完成后，将xhr对象从请求列表中移除
        const xhrIndex = requestList.findIndex((item) => item === xhr);
        requestList.splice(xhrIndex, 1);
      }
      resolve({
        data: e.target.response
      });
    };
    
    if (requestList) {
      requestList.push(xhr);
    }
  });
};
```

暂停：新增暂停上传按钮，点击按钮时，调用保存`requestList`中`xhr`的`abort`方法，暂停所有切片的上传

```javascript
handlePause() {
  this.requestList.forEach(xhr => xhr?.abort())
  this.requestList = []
}
```

续传：增加恢复上传按钮，点击按钮调用`verifyUpload`，服务端返回还未完成上传的切片列表，从而调用`uploadChunks`，完成续传

**客户端**

```vue
<template>
	<div id="app">
        <input type="file" @change="onFileChange" />
        <el-button type="primary" @click="handleUpload">上传</el-button>
        <el-button @click="handleResume" v-if="status === Status.PAUSE"
          >resume</el-button
        >
        <el-button
          v-else
          :disabled="status !== Status.UPLOADING || !container.hash"
          @click="handlePause"
          >pause</el-button
        >
        <el-button @click="handleDelete">delete</el-button>
    </div>
</template>
<script>
import { request } from './utils/util'

const SIZE = 10 * 1024 * 1024

const STATUS_ENUM = {
    WAITING: 'WAITING',
    PAUSE: 'pause',
    UPLOADING: 'uploading',
    SUCCESS: 'success',
    ERROR: 'error'
}
export default {
    data() {
        return {
            container: {
              file: null,
              webworker: null,
              hash: null
            },
            data: [],
            requestList: [],
            Status: STATUS_ENUM,
            status: STATUS_ENUM.WAITING
        }
    },
    methods: {
      async handleResume() {
        this.status = STATUS_ENUM.UPLOADING;
        // 从服务端拿到已上传的切片
        const { uploadedList } = await this.verifyUpload(this.container.file.name, this.container.hash)
        await this.uploadChunks(uploadedList)
      },

      handlePause() {
        this.status = STATUS_ENUM.PAUSE;
        this.resetData();
      },
      resetData() {
        this.requestList.forEach(xhr => xhr?.abort());
        this.requestList = [];
        if (this.container.worker) {
          this.container.worker.onmessage = null;
        }
      },

      async handleUpload() {
        // 判定下文件是否为null
        if(!this.container.file) return
        this.status = STATUS_ENUM.UPLOADING;
        // 分片
        const fileChunkList = this.createFileChunk(this.container.file)

        // 计算文件hash
        this.container.hash = await this.calculateHash(fileChunkList)

        // 文件hash 没必要上传同一个文件多次 {shouldUpload, uploadList}
        const { shouldUpload, uploadedList } = await this.verifyUpload(this.container.file.name, this.container.hash)

        // 是否已经上传过
        if(!shouldUpload) {
          this.$message.success('秒传：上传成功')
          this.status = STATUS_ENUM.WAITING
          return
        }


        this.data = fileChunkList.map(({file}, index) => ({
          fileHash: this.container.hash, // 文件hash
          index, // 下标
          chunk: file, // chunk
          hash:`${this.container.hash}-${index}`, // chunk hash
          size: file.size, // 文件大小
          percentage: uploadedList.includes(`${this.container.hash}-${index}`) ? 100 : 0 // 当前切片是否已经上传过
        }))
        // 将已上传的切片传递给上传切片
        await this.uploadChunks(uploadedList)
      },
        
      async uploadChunks(uploadedList = []) {
        // 过滤出未上传的切片，处理成formData
        const requestList = this.data.filter(({hash}) => !uploadedList.includes(hash)).map(({chunk, hash, index}) => {
          const formData = new FormData()
          formData.append('chunk', chunk)
          formData.append('hash', hash)
          formData.append('filename', this.container.file.name)
          formData.append('fileHash', this.container.hash)
          return { formData, index }
        }).map(async ({ formData, index }) => {
          try {
            await request({
              url: 'http://localhost:3030/',
              method: 'POST',
              data: formData,
              onProgress: this.createProgressHandler(this.data[index]),
              requestList: this.requestList // 将xhr数组传入request
            })
          } catch (error) {
            this.$message.warning(error.message || error)
          }
        })
        // 并发请求
        await Promise.all(requestList)
		// 已经上传 和 剩余未上传 的和 和总的请求列表
        if (uploadedList.length + requestList.length === this.data.length) {
          // 合并切片
          await this.mergeRequest();
        }
      },
    }
}
</script>
```

**服务端**

服务端在`verify`接口获取下已经上传的切片，将已经上传的切片已数组形式返回

```javascript
// 获取已经上传的切片（根据fileHash 获取对应的chunks目录）
const createUploadedList = async fileHash =>  fse.existsSync(path.resolve(UPLOAD_DIR, fileHash))
    ? await fse.readdir(path.resolve(UPLOAD_DIR, fileHash)) : []


async handleVerifyUpload(req, res) {
    const { fileHash, filename } = await resolveParse(req)
    const ext = extractExt(filename)

    const filePath = path.resolve(UPLOAD_DIR, `${fileHash}${ext}`)

    if(fse.existsSync(filePath)) {
      res.end(JSON.stringify({ shouldUpload: false }))
    } else {
      res.end(JSON.stringify({ shouldUpload: true, uploadedList: await createUploadedList(fileHash) }))
    }
}
```

**效果图**

**中断（暂停）上传**

![upload-abort](/my-blog/learn/upload/upload-abort.jpg)

**恢复上传**

![upload-resume](/my-blog/learn/upload/upload-resume.jpg)

## 8. 优化（根据需要食用）

[原文链接](https://juejin.cn/post/6844904055819468808#heading-5)

以下时代码片段

```diff

+async sendRequest(forms, max=4) {
+  return new Promise(resolve => {
+    const len = forms.length;
+    let idx = 0;
+    let counter = 0;
+    const start = async ()=> {
+      // 有请求，有通道
+      while (idx < len && max > 0) {
+        max--; // 占用通道
+        console.log(idx, "start");
+        const form = forms[idx].form;
+        const index = forms[idx].index;
+        idx++
+        request({
+          url: '/upload',
+          data: form,
+          onProgress: this.createProgresshandler(this.chunks[index]),
+          requestList: this.requestList
+        }).then(() => {
+          max++; // 释放通道
+          counter++;
+          if (counter === len) {
+            resolve();
+          } else {
+            start();
+          }
+        });
+      }
+    }
+    start();
+  });
+}

async uploadChunks(uploadedList = []) {
  // 这里一起上传，碰见大文件就是灾难
  // 没被hash计算打到，被一次性的tcp链接把浏览器稿挂了
  // 异步并发控制策略，我记得这个也是头条一个面试题
  // 比如并发量控制成4
  const list = this.chunks
    .filter(chunk => uploadedList.indexOf(chunk.hash) == -1)
    .map(({ chunk, hash, index }, i) => {
      const form = new FormData();
      form.append("chunk", chunk);
      form.append("hash", hash);
      form.append("filename", this.container.file.name);
      form.append("fileHash", this.container.hash);
      return { form, index };
    })
-     .map(({ form, index }) =>
-       request({
-           url: "/upload",
-         data: form,
-         onProgress: this.createProgresshandler(this.chunks[index]),
-         requestList: this.requestList
-       })
-     );
-   // 直接全量并发
-   await Promise.all(list);
     // 控制并发  
+   const ret =  await this.sendRequest(list,4)

  if (uploadedList.length + list.length === this.chunks.length) {
    // 上传和已经存在之和 等于全部的再合并
    await this.mergeRequest();
  }
},
```

