---
title: Node Api
date: 2023-04-23
categories: 
 - Node 
tags:
 - Node Api
sidebar: auto
---

## 前言

主要就是记录下，我学习`NodeJS`的总结吧，分为三部分，基础`api`的使用、`express`的实践/`egg`的实践。如果已经对于这些非常了解的同行，那么可以忽略本系列

## 回调函数

我们知道`NodeJs` 的异步编程主要就是通过回调方式，如下栗子中，我们通过异步方式读取文件内容，回调函数中的两个参数`err`，`data`，分别代遍读取失败和读取成功的结果

```javascript
const fs = require('fs')

fs.readFileSync('node.txt', (err, data) => {
  if(err) console.log(err)
  console.log(data)
})
```

## 事件驱动程序

Node.js 使用事件驱动模型，当web server接收到请求，就把它关闭然后进行处理，然后去服务下一个web请求。

当这个请求完成，它被放回处理队列，当到达队列开头，这个结果被返回给用户。

这个模型非常高效可扩展性非常强，因为 webserver 一直接受请求而不等待任何读写操作。（这也称之为非阻塞式IO或者事件驱动IO）

![img](https://www.runoob.com/wp-content/uploads/2015/09/event_loop.jpg)

## EventEmitter

`NodeJs`有多个内置事件，我们可以通过引入`events`模块，并通过实例化`EventEmitter`类来绑定和监听事件，如下实例

```javascript
// 引入 events 模块
var events = require('events');
// 创建 eventEmitter 对象
var eventEmitter = new events.EventEmitter();
 
// 创建事件处理程序
var connectHandler = function connected() {
   console.log('连接成功。');
  
   // 触发 data_received 事件 
   eventEmitter.emit('data_received');
}
 
// 绑定 connection 事件处理程序
eventEmitter.on('connection', connectHandler);
 
// 使用匿名函数绑定 data_received 事件
eventEmitter.on('data_received', function(){
   console.log('数据接收成功。');
});
 
// 触发 connection 事件 
eventEmitter.emit('connection');
 
console.log("程序执行完毕。");
```

`NodeJs`的很多对象都会分发事件，如：前面的`fs`在文件打开时触发事件，这个事件就是`events.EventEmitter`的实例

`EventEmitter`的`api`

- `addListener(event, listener)`为指定事件添加一个监听器到监听器队列的尾部
- `on(event, listener)`为指定事件注册一个监听器，接受一个字符串 event 和一个回调函数。
- `once(event, listener)`为指定事件注册一个单次监听器，监听器最多触发一次，触发后立即解除监听器
- `removeListener(event, listener)`移除指定事件的某个监听器，监听器必须是该事件已经注册过的监听器
- `removeAllListeners(event)`移除所有事件的监听器，如果指定事件，则移除指定时间的监听器
- `setMaxListeners(n)`默认情况下，`EventEmitters`如果你添加监听器超过10个就会输出警告信息
- `listeners(event)`返回指定事件的监听器数组
- `emit(event, [arg1], [arg2], [...])`按监听器的顺序执行执行每个监听器，如果事件有注册监听返回 true，否则返回 false。

### error事件

`eventEmitter`定义了一个特殊事件`error`，包含了错误含义，遇到异常时就会触发`error`事件，

`error`被触发时，`EventEmitter`规定如果没有响应的监听器，`NodeJs`会把它当作异常，退出程序并输出错误信息

我们一般要为会触发` error `事件的对象设置监听器，避免遇到错误后整个程序崩溃

```javascript
const events = require('events');
const emitter = new events.EventEmitter();
emitter.error('error');
```

## Buffer

`JS`语言本身只有字符串数据，没有二进制数据，在处理流文件时，必须使用二进制数据，所以`NodeJs`定义了`Buffer`类，用于存放二进制数据的缓存

字符编码

- `'utf8'`（别名：`'utf-8'`）：多字节编码的 Unicode 字符。 许多网页和其他文档格式使用 [UTF-8](http://url.nodejs.cn/mzW5jo)。 这是默认的字符编码。 当将 `Buffer` 解码为不完全包含有效 UTF-8 数据的字符串时，则 Unicode 替换字符 `U+FFFD` � 将用于表示这些错误。
- `'utf16le'`（别名：`'utf-16le'`）：多字节编码的 Unicode 字符。 与 `'utf8'` 不同，字符串中的每个字符都将使用 2 或 4 个字节进行编码。 Node.js 仅支持 [UTF-16](http://url.nodejs.cn/CJHzJq) 的[小端序](http://url.nodejs.cn/HY3tVp)变体。
- `'latin1'`: Latin-1 代表 [ISO-8859-1](http://url.nodejs.cn/z8AaDs)。 此字符编码仅支持 `U+0000` 至 `U+00FF` 的 Unicode 字符。 每个字符都使用单个字节进行编码。 不符合该范围的字符将被截断并映射到该范围内的字符。

二进制编码

- `'base64'`: [Base64](http://url.nodejs.cn/fum2xU) 编码。 当从字符串创建 `Buffer` 时，此编码还将正确接受 [RFC 4648，第 5 节](http://url.nodejs.cn/j8aS4R)中指定的 "URL 和文件名安全字母表"。 base64 编码的字符串中包含的空白字符（例如空格、制表符和换行符）会被忽略。
- `'base64url'`: [base64url](http://url.nodejs.cn/j8aS4R) 编码如 [RFC 4648 第 5 节](http://url.nodejs.cn/j8aS4R)中指定。 当从字符串创建 `Buffer` 时，此编码也将正确接受常规的 base64 编码的字符串。 当将 `Buffer` 编码为字符串时，此编码将忽略填充。
- `'hex'`: 将每个字节编码为两个十六进制字符。 当解码不完全由偶数个十六进制字符组成的字符串时，可能会发生数据截断。 请参阅下面的示例。

### 它有以下常用api

1. **alloc**

   语法：`Buffer.alloc(size[, fill[, encoding]])`

   返回指定大小的`Buffer`实例，如果没有设置fill，默认为0

   ```javascript
   // 创建一个长度为 10、且用 0 填充的 Buffer。
   const buf1 = Buffer.alloc(10) // <Buffer 00 00 00 00 00 00 00 00 00 00>
   
   // 创建一个长度为10、使用 12 填充的 Buffer
   const buf2 = Buffer.alloc(10, 12) // <Buffer 0c 0c 0c 0c 0c 0c 0c 0c 0c 0c>
   ```

   如果 `size` 大于 [`buffer.constants.MAX_LENGTH`](https://nodejs.cn/api-v16/buffer.html#bufferconstantsmax_length) 或小于 0，则抛出 [`ERR_INVALID_ARG_VALUE`](http://url.nodejs.cn/P9ucm1)。

   如果指定了`fill`，其实就是调用`Buffer.fill(fill)`

   如果同时指定`fill`和`encoding`，就调用`Buffer.fill(fill, encoding)`

2. **allocUnsafe**

   语法：`Buffer.allocUnsafe(size)`

   返回一个指定大小的 Buffer 实例，但是它不会被初始化，所以它可能包含敏感的数据，同时它可能含有老数据

   ```javascript
   // 最后的50 23 就是老数据
   const buf3 = Buffer.allocUnsafe(10) // <Buffer 00 00 00 00 00 00 00 00 50 23>
   ```

3. **byteLength**

   语法：`Buffer.byteLength`

   返回`buffer`字节数

4. **compare**

   语法：`Buffer.compare`

   - `buf1`
   - `buf2`
   - 返回: `-1`、`0` 或 `1`，取决于比较的结果

5. **concat**

   语法：`Buffer.concat`

   - `list`要连接的 `Buffer` 或 [`Uint8Array`](http://url.nodejs.cn/ZbDkpm) 实例的列表。
   - `totalLength`连接时 `list` 中 `Buffer` 实例的总长度。
   - 返回: `<Buffer>`

   ```javascript
   const buf8 = Buffer.concat([Buffer.from(('菜鸟教程')), Buffer.from('www.runoob.com')])
   
   console.log(buf8.toString()) // 菜鸟教程www.runoob.com
   ```

6. **from**

   - **Buffer.from(array)：** 返回一个被 array 的值初始化的新的 Buffer 实例（传入的 array 的元素只能是数字，不然就会自动被 0 覆盖）

     ```javascript
     const buf4 = Buffer.from([11, 2, 3]) // <Buffer 0b 02 03>
     const buf5 = Buffer.from(['s', 11, 2, 3]) // <Buffer 00 0b 02 03>
     ```

   - **Buffer.from(arrayBuffer[, byteOffset[, length]])：** 返回一个新建的与给定的 ArrayBuffer 共享同一内存的 Buffer。

     ```javascript
     const arr = new Uint16Array(2);
     
     arr[0] = 5000;
     arr[1] = 4000;
     
     // 与 `arr` 共享内存。
     const buf = Buffer.from(arr.buffer);
     
     console.log(buf);
     // 打印: <Buffer 88 13 a0 0f>
     
     // 更改原始的 Uint16Array 也会更改缓冲区。
     arr[1] = 6000;
     
     console.log(buf);
     // 打印: <Buffer 88 13 70 17>
     ```

   - **Buffer.from(buffer)：** 复制传入的 Buffer 实例的数据，并返回一个新的 Buffer 实例

     ```javascript
     const buf1 = Buffer.from('buffer');
     const buf2 = Buffer.from(buf1);
     
     buf1[0] = 0x61;
     
     console.log(buf1.toString());
     // 打印: auffer
     console.log(buf2.toString());
     // 打印: buffer
     ```

   - **Buffer.from(string[, encoding])：** 返回一个被 string 的值初始化的新的 Buffer 实例

     ```javascript
     const buf1 = Buffer.from('this is a tést');
     const buf2 = Buffer.from('7468697320697320612074c3a97374', 'hex');
     
     console.log(buf1.toString()); //  this is a tést
     console.log(buf2.toString()); // this is a tést
     console.log(buf1.toString('latin1')); // this is a tÃ©st
     ```

7. 其他`api`可以参考官网

### child_process

`NodeJs`提供了衍生子进程的能力，此功能主要由`child_process.spawn()`提供

#### spawn

语法：`child_process.spawn(command[, args][, options])`

如下

根目录创建`child-process/test.txt`

通过`ls -ls ./child-process`获取目录信息

```bash
const { spawn } = require('child_process')

const create = spawn('mkdir', ['-p', './child-process/test.txt'])
const ls = spawn('ls', ['-lh', './child-process'])

create.stdout.on('data', (data) => {
  console.log(data)
})

create.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

ls.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

ls.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

create.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});

ls.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
});
```

注：`windows`需要使用`bash`执行脚本

#### exec

语法：`child_process.exec(command[, options][, callback])`

用于`shell`并在该`shell`中运行命令，完成后将`stdout`和`stderr`传给回调函数

`process.cmd`

```shell
@ECHO off
GOTO start
:find_dp0
SET dp0=%~dp0
EXIT /b
:start
SETLOCAL
CALL :find_dp0

IF EXIST "%dp0%\node.exe" (
  SET "_prog=%dp0%\node.exe"
) ELSE (
  SET "_prog=node"
  SET PATHEXT=%PATHEXT:;.JS;=;%
)

endLocal & goto #_undefined_# 2>NUL || title %COMSPEC% & "%_prog%"  "%dp0%\..\node-api\child_progress%*
```

`window-child-process`

```javascript
const { exec } = require('child_process');
exec('process.cmd', (err, stdout, stderr) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(stdout);
});
```

`bash`环境下运行脚本

```bash
node window-child-process.js
# child process exited with code 0
# stdout: total 0
# drwxr-xr-x 1 lk 197121 0 4月  24 17:57 test.txt

# child process exited with code 0

```

#### execFile

语法：`child_process.execFile(file[, args][, options][, callback])`

修改下`window-child-process`文件

```javascript
const { execFile } = require('child_process');

const child = execFile('process.cmd', (error, stdout, stderr) => {
  if (error) {
    throw error;
  }
  console.log(stdout);
});
```
