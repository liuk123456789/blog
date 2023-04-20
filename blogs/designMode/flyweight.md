---
title: 享元模式
date: 2023-02-09
categories: 
 - design partten
tags:
 - flyweight
sidebar: auto
---

## 什么是享元模式

> **享**就是分享之意，指一物被众人共享，而这也正是该模式的终旨所在，**元**意为单元，蝇量级的个体，该模式的核心就是使用共享技术来有效的支持大量的细粒度对象。

![](/my-blog/designPattern/fly-weight.png)

- Flyweight是抽象享元角色，为具体享元角色规定了必须实现的方法
- ConcreteFlyWeight 是具体享元角色，实现享元角色定义的方法
- FlyweightFactory是享元工厂，负责创建和管理享元角色，它用于构造一个池容器，同时提供从池中获得对象的方法
- Client 是客户端角色：维护对所有享元对象的引用，而且还需要存储对应的外部状态

## 使用场景

有个服装厂，生产了男女服装各50种款式，为了推销需要找模特来拍照，正常可能会找男女模特各50个，每个模特分别穿一种服装拍一组照片。其代码实现如下：

```javascript
// 模特类
class Modal {
    construtor(name, gender, clothes) {
        this.name = name
        this.gender = gender
        this.clothes = clothes
    }
    takePhoto() {
        console.log(`${this.gender}模特${this.name}穿${this.clothes}拍了张照`)
    }
}
```

```javascript
// 穿衣拍照实现
for(let i = 0; i < 50; i++) {
    let manModel = new Modal(`张${i}`,'男',`服装${i}`)
    manModel.takePhoto()
}

for(let i = 50; i < 100; i++) {
    let womanModel = new Modal(`李${i}`, '女', `服装${i}`)
    womanModal.takePhoto()
}
```

上述代码会创造100个模特对象，如果衣服种类增加，那么还需要增加模特对象

享元模式可以解决这个问题，不管多少种类衣服，只需男女一个模特进行拍照也可实现该需求，实现享元模式主要就是区分内部状态和外部状态

1. 内部状态存储在对象的内部
2. 内部状态可以被一些对象共享
3. 内部状态独立于具体的场景，通常不会改变
4. 外部状态取决于具体的场景，并根据场景而变化，外部状态不能被共享

对于上述案例来说，对于模特对象来说衣服属于外部对象，性别属于内部对象

### 构建享元对象

```javascript
class Modal {
	constructor(id, gender) {
        this.gender = gender
        this.name = `张${gender}${id}`
    }
}
```

### 构建享元工厂

```javascript
class ModalFactory {
    // 单例模式
    static create(id, gender) {
        if(this[gender]) {
            return this[gender]
        }
        return this[gender] = new Modal(id, gender)
    }
}
```

### 管理外部状态

```javascript
class TakeClothesManager {
    // 添加衣服款式
    static addClothes(id, gender, clothes) {
        const modal = ModalFactory.create(id, gender)
        this[id] = {
            clothes,
            modal
        }
    }
    // 拍照
    static takePhoto(id) {
        const obj = this[id]
        console.log(`${obj.modal.gender}模特${obj.modal.name}穿${obj.clothes}拍了张照`)
    }
}
```

### 执行

```javascript
for(let i = 0; i < 50; i++) {
    TakeClothesManager.addClothes(i, '男', `服装${i}`)
    TakeClothesManager.takePhoto(i)
}

for(let i = 50; i < 100; i++) {
    const {addClothes, takePhoto} = TakeClothesManager
    TakeClothesManager.addClothes(i, '女', `服装${i}`)
    TakeClothesManager.takePhoto(i)
}
```

## 总结

优点：大大减少对象的创建，降低系统的内存，使效率提高

缺点：需要分离出外部状态和内部状态，提高了系统的复杂度

