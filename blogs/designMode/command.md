---
title: 命令模式
date: 2023-02-08
categories: 
 - design partten
tags:
 - command
sidebar: auto
---

## 什么是命令模式

由3个角色组成：`发布者`、`接收者`、`命令对象`

1. 发布者 `invoker`（发出命令，调用命令对象，不知道如何执行与谁执行）；
2. 接收者 `receiver` (提供对应接口处理请求，不知道谁发起请求）；
3. 命令对象 `command`（接收命令，调用接收者对应接口处理发布者的请求）。

流程：发布者`invoker`和接受者`receiver`各自独立，将请求封装成命令对象`command`，请求的具体执行命令对象`command`调用接受者`receiver`对应接口执行

命令对象 `command` 充当发布者 `invoker` 与接收者 `receiver` 之间的连接桥梁（中间对象介入）。实现发布者与接收之间的解耦，对比过程化请求调用，命令对象 `command` 拥有更长的生命周期，接收者 `receiver` 属性方法被封装在命令对象 `command` 属性中，使得程序执行时可任意时刻调用接收者对象 `receiver` 。因此 `command` 可对请求进行进一步管控处理，如实现延时、预定、排队、撤销等功能。

## 实现命令模式

```javascript
class Receiver { // 接受者
    execute() {
        console.log('接收者执行请求')
    }
}

class Command { // 命令对象类
    constructor(receiver) {
        this.receiver = receiver
    }
    execute() { // 调用接收者对应接口执行
        console.log('命令对象 -> 接受者 ->对应接口执行')
        this.receiver.execute()
    }
}

class Invoke { // 发布者类
    constuctor(command) {
        this.command = command
    }
    invoke() { // 发布请求，调用命令对象
        console.log('发布者发布请求')
        this.command.execute()
    }
}

const warehouse = new Receiver() // 仓库
const order = new Command(warehouse) // 订单
const client = new Invoker(order) // 客户
```

## 应用场景

1. 使用命令模式写个菜单程序

   假设现在有一个编写用户界面的程序，该用户页面上有数十个 `button` 按钮，因为项目比较大，开发主管决定让某个程序员同学绘制这些按钮，而另外一些程序员则负责编写点击按钮后的具体行为，这些行为都将被封装在对象里。对于绘制按钮的程序员来说，他完全不知道某个按钮未来用来做什么，他只知道点击这个按钮会发生某些事情。

   ```html
   <body>
   	<div>
   	  <button id="btn1">刷新菜单</button>
         <button id="btn2">添加子菜单</button>
         <button id="btn3">删除子菜单</button>
       </div>
       
       <script>
       	function getDomById(id) {
               return document.getElementById(id)
           }
           
           // 命令调用者
           const btn1 = getDomById('btn1')
           const btn2 = getDomById('btn2')
           const btn3 = getDomById('btn3')
       </script>
   </body>
   ```

   接下来定义 `setCommand` 函数， `setCommand` 函数负责往按钮上安装命令。可以肯定的是，点击按钮会执行某个 `command` 命令，执行命令的动作被约定为调用 `command` 对象的 `execute()` 方法。

   ```javascript
   function setComment(btn, comment) {
       btn.addEventListener('click', function() {
           // 命令中间对象的execute 方法
           comment.execute()
       })
   }
   ```

   命令执行者

   ```javascript
   // 命令执行者
   const MenuBar = {
       refresh: function() {
           console.log('刷新菜单目录')
       }
   }
   
   const SubMenu = {
       add: function() {
           console.log('增加子菜单')
       },
       del: function() {
           console.log('删除子菜单')
       }
   }
   ```

   命令的中间对象

   ```javascript
   function RefreshMenuBarComment(receiver) {
       return {
           execute: function() {
               receiver.refresh()
           }
       }
   }
   
   function AddSubMenuComment(receiver) {
       return {
           execute: function() {
               receiver.add()
           }
       }
   }
   
   function DelSubMenuComment(receiver) {
       return {
           execute: function() {
               receiver.del()
           }
       }
   }
   ```

   最后就是把命令接收者传入到 `command` 对象创建函数中，并把 `command` 对象安装到 `button` 上面。

   ```javascript
   setComment(btn1, RefreshMenuBarComment(MenuBar))
   setComment(btn2, AddSubMenuComment(MenuBar))
   setComment(btn3, DelSubMenuComment(MenuBar))
   ```

2. 使用命令模式完成一个动画，动画让页面上的小球移动到水平方向的某个位置，也可以通过撤销按钮撤销小球

   ```html
   <!DOCTYPE html>
     <html lang="en">
     <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <meta http-equiv="X-UA-Compatible" content="ie=edge">
       <title>命令模式2</title>
       <style>
         html, body, div, button, input {
           margin: 0;
           padding: 0;
         }
         .ball {
           position: absolute;
           top: 50px;
           background: #000;
           width: 50px;
           height: 50px;
           border-radius: 50%;
         }
       </style>
     </head>
     <body>
       <div id="ball" class="ball"></div>
       输入小球移动后的位置：<input id="pos" />
       <button id="moveBtn">开始移动</button>
       <button id="undo">撤销移动</button>
     </body>
     </html>
   ```

   实现动画构造函数

   ```javascript
   const tween = {
       linear: function (t, b, c, d) {
         return c * t / d + b;
       },
       easeIn: function (t, b, c, d) {
         return c * (t /= d) * t + b;
       },
       strongEaseIn: function (t, b, c, d) {
         return c * (t /= d) * t * t * t * t + b;
       },
       strongEaseOut: function (t, b, c, d) {
         return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
       },
       sineaseIn: function (t, b, c, d) {
         return c * (t /= d) * t * t + b;
       },
       sineaseOut: function (t, b, c, d) {
         return c * ((t = t / d - 1) * t * t + 1) + b;
       }
   }
   
     class Animate {
       constructor(dom) {
         this.dom = dom;
         this.startTime = 0;
         this.startPos = 0;
         this.endPos = 0;
         this.propertyName = null;
         this.easing = null;
         this.duretion = null;
       }
   
       start = (propertyName, endPos, duration, easing) => {
         this.startTime = +new Date();
         this.startPos = this.dom.getBoundingClientRect()[propertyName];
         this.propertyName = propertyName;
         this.endPos = endPos;
         this.duration = duration;
         this.easing = tween[easing];
   
         let self = this;
         let timeId = setInterval(function () {
           if (self.step() === false) {
             clearInterval(timeId);
           }
         }, 19)
       }
   
       step = () => {
         let t = +new Date();
         if (t > this.startTime + this.duration) {
           this.update(this.endPos);
           return false;
         }
   
         let pos = this.easing(t - this.startTime, this.startPos, this.endPos - this.startPos, this.duration);
         this.update(pos);
       }
   
       update = pos => {
         this.dom.style[this.propertyName] = pos + 'px';
       }
     }
   ```

   接下来开始定义命令的调用者、命令的中间对象、命令的具体执行者

   ```javascript
   <script>
       function getDomById(id) {
         return document.getElementById(id);
       }
       
       const ball = getDomById("ball"), pos = getDomById("pos");
       // 命令的调用者
       const  moveBtn = getDomById("moveBtn"), undo = getDomById("undo");
       let prePos; // 用来保存上一次小球移动的位置
   
       // 命令的具体执行者 或者称为命令的接收者
       const animate = new Animate(ball);
   
       // 创建命令中间对象
       const MoveCommand = function (receiver) {
         return {
           posStack: [],
           execute: function (pos) {
             receiver.start('left', pos, 1000, 'strongEaseOut');
             this.posStack.push(receiver.dom.getBoundingClientRect()[receiver.propertyName]);
           },
           unExecute: function () {
             if (this.posStack.length) {
               prePos = this.posStack.pop();
               receiver.start('left', prePos, 1000, 'strongEaseOut');
               pos.value = prePos;
             } else {
               console.log('已回退到最开始步骤');
             }
           },
         }
       }
   
       const moveCommand = MoveCommand(animate); // moveCommand 是创建的命令中间对象
   
       // 命令的调用者通过命令中间对象与命令的具体执行者进行解耦  
   
       moveBtn.addEventListener('click', function () {
         moveCommand.execute(pos.value);
       })
   
       undo.addEventListener('click', function () {
         moveCommand.unExecute();
       })
   </script>
   ```