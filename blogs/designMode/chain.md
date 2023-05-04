---
title: 职责链模式
date: 2023-02-14
categories: 
 - Design Partten
tags:
 - chain
sidebar: auto
---

## 定义

> 使多个对象都有机会处理请求，从而避免请求的发送者和接收者之间
>
> 的耦合关系，将这些对象连成一条链，并沿着这条链传递该请求，直到有一个对象处理它为止。

## 实际开发中的职责链模式

假设我们负责一个售卖手机的电商网站，经过分别交纳 500 元定金和 200 元定金的两轮预定

后（订单已在此时生成），现在已经到了正式购买的阶段。

公司针对支付过定金的用户有一定的优惠政策。在正式购买后，已经支付过 500 元定金的用

户会收到 100 元的商城优惠券，200 元定金的用户可以收到 50 元的优惠券，而之前没有支付定金

的用户只能进入普通购买模式，也就是没有优惠券，且在库存有限的情况下不一定保证能买到。

我们的订单页面是 PHP 吐出的模板，在页面加载之初，PHP 会传递给页面几个字段。

1. orderType：表示订单类型（定金用户或者普通购买用户），code 的值为 1 的时候是 500 元

   定金用户，为 2 的时候是 200 元定金用户，为 3 的时候是普通购买用户。

2. pay：表示用户是否已经支付定金，值为 true 或者 false, 虽然用户已经下过 500 元定金的

   订单，但如果他一直没有支付定金，现在只能降级进入普通购买模式。

3. stock：表示当前用于普通购买的手机库存数量，已经支付过 500 元或者 200 元定金的用

   户不受此限制。

下面我们把这个流程写成代码： 

```javascript
// 500元订单
const order500 = (orderType, pay, stack) => {
    if(orderType === 1 && !!pay) {
        console.log('500元定金预购，得到100元优惠券')
    } else {
        order200(orderType, pay, stack)
    }
}

// 200元订单
const order200 = (orderType, pay, stack) => {
    if ( orderType === 2 && pay === true ){ 
 		console.log( '200 元定金预购, 得到 50 优惠券' ); 
 	}else{ 
 		orderNormal( orderType, pay, stock ); // 将请求传递给普通订单
 	}
}

// 普通购买订单
const orderNormal = (orderType, pay, stack) => {
    if(stock > 0) {
        console.log('普通购买，无优惠券')
    } else {
        console.log('手机库存不足')
    }
}

order500( 1 , true, 500); // 输出：500 元定金预购, 得到 100 优惠券
order500( 1, false, 500 ); // 输出：普通购买, 无优惠券
order500( 2, true, 500 ); // 输出：200 元定金预购, 得到 500 优惠券
order500( 3, false, 500 ); // 输出：普通购买, 无优惠券
order500( 3, false, 0 ); // 输出：手机库存不足
```

## 灵活可拆分的职责链节点

​	    首先改写表示三种购买模式的节点函数，如果某个节点不能处理请求，则返回特定的字符串表示请求需要继续往后面传递

```javascript
const order500 = (orderType, pay, stack) => {
    if(orderType === 1 && !!pay) {
        console.log('500元定金，得到100优惠券')
    } else {
        return 'nextSuccessor'; // 我不知道下一个节点是谁，反正把请求往后面传递
    }
}

const order200 = (orderType, pay, stack) => {
    if(orderType === 2 && !!pay) {
        console.log( '200 元定金预购, 得到 50 优惠券' );
    } else {
        return 'nextSuccessor'; // 我不知道下一个节点是谁，反正把请求往后面传递
    }
}

const orderNormal = (orderType, pay, stack) => {
    if(orderType === 3 && !!pay) {
        console.log('普通购买，无优惠券')
    } else {
        console.log('手机库存不足')
    }
}
```

​		接下来需要把函数包装进职责链节点，我们定义一个构造函数 Chain，在 new Chain 的时候传递的参数即为需要被包装的函数，同时它还拥有一个实例属性 this.successor，表示在链中的下一个节点

​		此外Chain的prototype中还有两个函数，他们的作用如下所示

​		// Chain.prototype.setNextSuccessor 指定在链中的下一个节点

​		// Chain.prototype.passRequest 传递请求给某个节点

```javascript
const Chain = (fn) => {
    this.fn = fn
    this.successor = null
}

// 设置下一个节点
Chain.prototype.setNextSuccessor = (successor) => {
    return this.successor = successor
}

// 处理请求
Chain.protype.passRequest = () => {
    const ret = this.fn.apply(this, arguments)

	if(ret === 'nextSuccessor') {
        return this.successor && this.successor.passRequest.apply(this.successor, arguments)
    }

	return ret
}

const chainOrder500 = new Chain(order500)
const chainOrder200 = new Chain(order200)
const chainOrderNormal = new Chain(orderNormal)

// 指点节点在职责链中执行顺序
chainOrder500.setNextSuccessor(chainOrder200)
chainOrder200.setNextSuccessor(chainOrderNormal)

// 将请求传递给第一个节点
chainOrder500.passRequest(1, true, 500)
chainOrder500.passRequest(2, true, 500)
chainOrder500.passRequest(3, true, 500)
chainOrder500.passRequest(1, false, 0)
```

​	通过改进，可以自由灵活增加、移除、修改链中的节点顺序，加入增加300元定金购买，只需增加300元定金的请求处理逻辑
```javascript
const order300 = (orderType, pay, stack) => {
    if(orderType === 4 && !!pay) {
        console.log( '300 元定金预购, 得到 80 优惠券' );
    } else {
        return 'nextSuccessor'; // 我不知道下一个节点是谁，反正把请求往后面传递
    }
}

const chainOrder500 = new Chain(order500)
const chainOrder300 = new Chain(order300)
const chainOrder200 = new Chain(order200)
const chainOrderNormal = new Chain(orderNormal)

// 指点节点在职责链中执行顺序
chainOrder500.setNextSuccessor(chainOrder300)
chainOrder300.setNextSuccessor(chainOrder200)
chainOrder200.setNextSuccessor(chainOrderNormal)
```

## 异步职责链

​	    如果某个节点进行了异步请求，需要等待异步请求的结果后决定是否继续进行passRequest,所以节点函数中`nextSuccessor`已经没有意义，所以给Chain增加原型方法Chain.prototype.next，表示手动传递请求给职责链的下一个节点

```javascript
Chain.prototype.next = () => {
	return this.successor && this.successor.passRequest.apply(this.successor, arguments)
}
```

异步职责链的栗子

```javascript
const fn1 = new Chain(function(){ 
     console.log( 1 ); 
     return 'nextSuccessor';
});

const fn2 = new Chain(function(){ 
     console.log( 2 ); 
     var self = this; 
     setTimeout(function(){ 
         self.next(); // 手动触发进入下一个节点
     }, 1000 ); 
});
const fn3 = new Chain(function(){ 
     console.log( 3 );
});

fn1.setNextSuccessor( fn2 ).setNextSuccessor( fn3 );
fn1.passRequest();
```

## AOP 实现职责链

> AOP（Aspect-OrientedProgramming，面向切面编程），可以说是OOP（Object-Oriented Programing，面向对象编程）的补充和完善。
>
> OOP引入封装、继承和多态性等概念来建立一种对象层次结构，用以模拟公共行为的一个集合。当我们需要为分散的对象引入公共行为的时候，OOP则显得无能为力。也就是说，OOP允许你定义从上到下的关系，但并不适合定义从左到右的关系。例如日志功能。日志代码往往水平地散布在所有对象层次中，而与它所散布到的对象的核心功能毫无关系。对于其他类型的代码，如安全性、异常处理和透明的持续性也是如此。这种散布在各处的无关的代码被称为横切（cross-cutting）代码，在OOP设计中，它导致了大量代码的重复，而不利于各个模块的复用。
>
> 剖解开封装的对象内部，并将那些影响了多个类的公共行为封装到一个可重用模块，并将其名为“Aspect”，即方面。所谓“方面”，简单地说，就是将那些与业务无关，却为业务模块所共同调用的逻辑或责任封装起来，便于减少系统的重复代码，降低模块间的耦合度，并有利于未来的可操作性和可维护性。AOP代表的是一个横向的关系，如果说“对象”是一个空心的圆柱体，其中封装的是对象的属性和行为；那么面向方面编程的方法，就仿佛一把利刃，将这些空心圆柱体剖开，以获得其内部的消息。而剖开的切面，也就是所谓的“方面”了。然后它又以巧夺天功的妙手将这些剖开的切面复原，不留痕迹。

增加Function原型的行为after函数使得第一个函数返回'nextSuccessor'时，将请求继续传递给下一个函数，无论是返回字符串'nextSuccessor'或者 false 都只是一个约定，当然在这里我们也可以让函数返回 false 表示传递请求，选择'nextSuccessor'字符串是因为它看起来更能表达我们的目的，代码如下：
```javascript
Function.prototype.after = (fn) => {
    const self = this
	return function() {
        const ret = self.apply(this, arguments)
        if(ret === 'nextSuccessor') {
            return fn.apply(this, arguments)
        }
        return ret
    }
}

const order = order500yuan.after(order200yuan).after(orderNormal)

order(1, true, 500)
order(2, true, 500)
order(1, false, 500)
```

## 实际开发中案例

客户先选择供应商、然后从供应商提供的商品中进行选择，选择后，可对价格、数量、金额等字段进行编辑，最终形成一个包含多个商品对象的数组，每个商品对象具有很多与该商品相关的属性，字段如下

```typescript
export interface IProduct {
    id: number, // 商品id
    name: string, // 商品名称
    isFresh: boolean, // 生鲜产品
    purPrice: number, // 档案进价
    price: number, // 进价
    costPriceL: number, // 售价
    count: number, // 数量
    totalAmount: number, // 小计金额
    largeCount: number, // 箱数
}
```

存在下面的逻辑
点击保存按钮，调用接口生成一个采购订单，保存时，需要对客户选择的商品进行一些校验

1. 商品的小计金额（totalAmount）不能超过99999999
2. 需要判定采购设置中是否启用采购价（price）高于加权平均价时，进行提示
3. 生鲜商品允许价格高于商品档案进价，那么当一个商品为生鲜商品，
   且价格高于档案进价时，弹框提示

```javascript
export class Chain {
    constructor(fn) {
        this.fn = fn
        this.successor = null
    }
    
    setNextSuccessor(successor) {
      return (this.successor = successor)
    }
  
    async passRequest() {
      const res = await this.fn.apply(this, arguments)
      if (res === 'nextSuccessor' && this.successor) {
        return await this.successor.passRequest.apply(this.successor, arguments)
      }
      return res
    }
}

// 进行数据校验
const NEXT_CHAIN_FALG = 'nextSuccessor'
const AMOUNT_MAX = 99999999

async validateAmountMax(data) {
    const idx = data.findIndex(({amount}) => amount >= AMOUNT_MAX)
    if(idx === -1) return NEXT_CHAIN_FALG
    return new Promise((resolve) => {
        const modal = Modal.confirm({
            title: '提示',
            content: `小计金额不能超过${AMOUNT_MAX}`,
            icon: createVNode(ExclamationCircleOutlined),
            okText: '确定',
            cancelText: createNode(),
            async onOk() {
                nextTick(()=> modal.destroy())
                resolve(false)
            }
        })
    })
}

async validateInPriceHigherThanAutoPrice() {
    // ***省略具体代码
}

async validateFreshAllowInPriceHigherThanItemPrice() {
    // ***省略具体代码
}

const validAmount = new Chain(validateAmountMax)
const validCostPrice = new Chain(validateInPriceHigherThanAutoPrice)
const validFresh = new Chain(validateFreshAllowInPriceHigherThanItemPrice)

// 执行校验顺序
validAmount.setNextSuccessor(validCostPrice).setNextSuccessor(validFresh)

// 将请求传递给第一个节点
return await validaAmount.passRequest()

// 保存
async save(data) {
    const ret = await validate(data)
}
```

